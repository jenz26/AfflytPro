import { PrismaClient, Prisma, AutomationRule } from '@prisma/client';
import { ScoringEngine } from './ScoringEngine';
import { MessageFormatter } from './MessageFormatter';
import { TelegramBotService } from './TelegramBotService';
import { ProductCacheService } from './ProductCacheService';
import { SecurityService } from './SecurityService';
import { needsKeepaRefresh, getPlanLimits } from '../config/planLimits';
import { KeepaPopulateService } from './KeepaPopulateService';
import { AMAZON_IT_CATEGORIES } from '../data/amazon-categories';

const prisma = new PrismaClient();
const securityService = new SecurityService();

// ═══════════════════════════════════════════════════════════════
// PLAN-BASED LIMITS FOR QUERY (fallback if dealsPerRun not set)
// ═══════════════════════════════════════════════════════════════

const PLAN_RESULTS_LIMIT: Record<string, number> = {
    FREE: 5,
    PRO: 15,
    BUSINESS: 30,
};

// ═══════════════════════════════════════════════════════════════
// DEDUPLICATION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get ASINs already published to a channel within the dedupe window
 */
async function getPublishedAsins(
    channelId: string,
    dedupeWindowHours: number
): Promise<Set<string>> {
    const cutoff = new Date(Date.now() - dedupeWindowHours * 60 * 60 * 1000);

    const published = await prisma.channelDealHistory.findMany({
        where: {
            channelId,
            publishedAt: { gte: cutoff }
        },
        select: { asin: true }
    });

    return new Set(published.map(p => p.asin));
}

/**
 * Record published deals in history for deduplication
 */
async function recordPublishedDeals(
    channelId: string,
    asins: string[],
    ruleId: string,
    dedupeWindowHours: number
): Promise<void> {
    const expiresAt = new Date(Date.now() + dedupeWindowHours * 60 * 60 * 1000);

    // Use createMany with skipDuplicates to handle race conditions
    await prisma.channelDealHistory.createMany({
        data: asins.map(asin => ({
            channelId,
            asin,
            ruleId,
            expiresAt
        })),
        skipDuplicates: true
    });
}

// ═══════════════════════════════════════════════════════════════
// DYNAMIC QUERY BUILDER
// ═══════════════════════════════════════════════════════════════

interface RuleWithFilters extends AutomationRule {
    user: { plan: string };
}

/**
 * Build dynamic Prisma query based on rule filters and user plan
 * Only applies filters that are allowed for the user's plan
 */
function buildProductQuery(rule: RuleWithFilters): {
    where: Prisma.ProductWhereInput;
    take: number;
    orderBy: Prisma.ProductOrderByWithRelationInput;
} {
    const userPlan = rule.user?.plan || 'FREE';
    const isPro = userPlan === 'PRO' || userPlan === 'BUSINESS';
    const isBusiness = userPlan === 'BUSINESS';

    const where: Prisma.ProductWhereInput = {
        // Always apply: Fresh data only (last 24h)
        lastPriceCheckAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
    };

    // ═══════════════════════════════════════════════════════════════
    // FREE TIER FILTERS (always applied)
    // ═══════════════════════════════════════════════════════════════

    // Categories (required)
    if (rule.categories && rule.categories.length > 0) {
        where.category = { in: rule.categories };
    }

    // ═══════════════════════════════════════════════════════════════
    // PRO TIER FILTERS (only for PRO and BUSINESS)
    // ═══════════════════════════════════════════════════════════════

    if (isPro) {
        // Price range
        if (rule.minPrice !== null || rule.maxPrice !== null) {
            where.currentPrice = {};
            if (rule.minPrice !== null && rule.minPrice !== undefined) {
                where.currentPrice.gte = rule.minPrice;
            }
            if (rule.maxPrice !== null && rule.maxPrice !== undefined) {
                where.currentPrice.lte = rule.maxPrice;
            }
        }

        // Minimum discount
        if (rule.minDiscount !== null && rule.minDiscount !== undefined) {
            where.discount = { gte: rule.minDiscount };
        }

        // Minimum rating (stored as 0-500 in rule, 0-5 in DB)
        if (rule.minRating !== null && rule.minRating !== undefined) {
            where.rating = { gte: rule.minRating / 100 };
        }

        // Minimum reviews
        if (rule.minReviews !== null && rule.minReviews !== undefined) {
            where.reviewCount = { gte: rule.minReviews };
        }

        // Max sales rank
        if (rule.maxSalesRank !== null && rule.maxSalesRank !== undefined) {
            where.salesRank = { lte: rule.maxSalesRank };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // BUSINESS TIER FILTERS (only for BUSINESS)
    // ═══════════════════════════════════════════════════════════════

    if (isBusiness) {
        // Amazon only
        if (rule.amazonOnly) {
            where.isAmazonSeller = true;
        }

        // FBA only
        if (rule.fbaOnly) {
            where.isFBA = true;
        }

        // Has coupon
        if (rule.hasCoupon) {
            where.hasCoupon = true;
        }

        // Prime only
        if (rule.primeOnly) {
            where.isPrime = true;
        }

        // Brand include (case-insensitive)
        if (rule.brandInclude && rule.brandInclude.length > 0) {
            where.brandName = {
                in: rule.brandInclude,
                mode: 'insensitive',
            };
        }

        // Brand exclude (case-insensitive)
        if (rule.brandExclude && rule.brandExclude.length > 0) {
            where.NOT = {
                brandName: {
                    in: rule.brandExclude,
                    mode: 'insensitive',
                },
            };
        }

        // Listed after
        if (rule.listedAfter) {
            where.listedAt = { gte: rule.listedAfter };
        }
    }

    // Get max results based on plan
    const maxResults = PLAN_RESULTS_LIMIT[userPlan] || PLAN_RESULTS_LIMIT.FREE;

    return {
        where,
        take: maxResults * 3, // Fetch extra for scoring filter
        orderBy: { discount: 'desc' },
    };
}

// ═══════════════════════════════════════════════════════════════
// KEEPA CACHE REFRESH LOGIC
// ═══════════════════════════════════════════════════════════════

// Minimum deals in cache per category before triggering Keepa refresh
const MIN_CACHE_DEALS_PER_CATEGORY = 5;

// Maximum age of cache before refresh (24 hours)
const CACHE_MAX_AGE_HOURS = 24;

/**
 * Map Italian category names to Keepa category IDs
 */
function getCategoryIdFromName(categoryName: string): number | null {
    const category = AMAZON_IT_CATEGORIES.find(
        c => c.name.toLowerCase() === categoryName.toLowerCase() ||
             c.nameEN.toLowerCase() === categoryName.toLowerCase()
    );
    return category?.id || null;
}

/**
 * Check if cache is sufficient for given categories
 * Returns categories that need Keepa refresh
 */
async function checkCacheStatus(categories: string[]): Promise<{
    needsRefresh: boolean;
    categoriesNeedingRefresh: string[];
    totalCached: number;
}> {
    const cutoffDate = new Date(Date.now() - CACHE_MAX_AGE_HOURS * 60 * 60 * 1000);
    let totalCached = 0;
    const categoriesNeedingRefresh: string[] = [];

    for (const category of categories) {
        const count = await prisma.product.count({
            where: {
                category,
                lastPriceCheckAt: { gte: cutoffDate }
            }
        });

        totalCached += count;

        if (count < MIN_CACHE_DEALS_PER_CATEGORY) {
            categoriesNeedingRefresh.push(category);
        }
    }

    return {
        needsRefresh: categoriesNeedingRefresh.length > 0,
        categoriesNeedingRefresh,
        totalCached
    };
}

/**
 * Fetch deals from Keepa and populate cache
 */
async function refreshCacheFromKeepa(categories: string[]): Promise<{
    success: boolean;
    dealsSaved: number;
    tokensUsed: number;
    errors: string[];
}> {
    if (!process.env.KEEPA_API_KEY) {
        return { success: false, dealsSaved: 0, tokensUsed: 0, errors: ['KEEPA_API_KEY not configured'] };
    }

    const keepaService = new KeepaPopulateService();
    try {
        const result = await keepaService.populateDeals({
            maxDeals: 100,
            minRating: 200,
            minDiscountPercent: 5
        });
        return {
            success: result.saved > 0,
            dealsSaved: result.saved,
            tokensUsed: result.tokensUsed,
            errors: result.errors
        };
    } catch (error: any) {
        return { success: false, dealsSaved: 0, tokensUsed: 0, errors: [error.message] };
    }
}

/**
 * Get user's Amazon affiliate tag from Credential Vault
 * Returns the first valid Amazon tag found
 * Throws error if no tag is configured - affiliate tag is MANDATORY
 */
async function getUserAmazonTag(userId: string): Promise<string> {
    const credentials = await prisma.credential.findMany({
        where: {
            userId,
            provider: {
                in: ['AMAZON_TAG', 'AMAZON_AFFILIATE', 'AMAZON']
            }
        },
        orderBy: { createdAt: 'asc' } // Use the first one added
    });

    for (const credential of credentials) {
        try {
            const decryptedTag = securityService.decrypt(credential.key);
            if (decryptedTag && decryptedTag.length > 0) {
                return decryptedTag;
            }
        } catch (e) {
            console.warn(`Failed to decrypt Amazon tag credential ${credential.id}`);
        }
    }

    // No tag found - this is a critical error, automation cannot proceed
    throw new Error(`MISSING_AMAZON_TAG: Nessun tag Amazon affiliato configurato per l'utente ${userId}. Configura il tag nelle impostazioni per pubblicare offerte.`);
}

interface ExecutionResult {
    success: boolean;
    dealsProcessed: number;
    dealsPublished: number;
    errors: string[];
    executionTime: number;
}

/**
 * RuleExecutor - 6-Step Automation Flow (Synchronous for Phase 1)
 * 
 * Executes automation rules without BullMQ/Redis dependency.
 * Can be triggered manually via API for testing.
 */
export class RuleExecutor {
    /**
     * Execute automation rule with full 6-step flow
     * 
     * STEP 1: Load Rule
     * STEP 2: Targeting - Find deals matching criteria
     * STEP 3: Scoring - Filter by Deal Score
     * STEP 4: A/B Split (if configured)
     * STEP 5: Generate Affiliate Links & Publish
     * STEP 6: Update Usage Stats
     */
    static async executeRule(ruleId: string): Promise<ExecutionResult> {
        const startTime = Date.now();
        const errors: string[] = [];
        let dealsProcessed = 0;
        let dealsPublished = 0;

        try {
            // STEP 1: Load Rule
            const rule = await prisma.automationRule.findUnique({
                where: { id: ruleId },
                include: {
                    user: {
                        include: {
                            credentials: {
                                where: { provider: 'TELEGRAM_BOT' }
                            }
                        }
                    },
                    channel: true,
                    split: true,
                    triggers: true,
                    actions: true
                }
            });

            if (!rule) {
                throw new Error(`Rule not found: ${ruleId}`);
            }

            if (!rule.isActive) {
                throw new Error(`Rule is inactive: ${rule.name}`);
            }

            // STEP 2: Targeting
            const cacheService = new ProductCacheService();
            const currentUserPlan = rule.user?.plan || 'FREE';
            const maxResults = PLAN_RESULTS_LIMIT[currentUserPlan] || PLAN_RESULTS_LIMIT.FREE;
            const query = buildProductQuery(rule as RuleWithFilters);

            // Check cache and refresh from Keepa if needed
            const cacheStatus = await checkCacheStatus(rule.categories);
            if (cacheStatus.needsRefresh) {
                await refreshCacheFromKeepa(cacheStatus.categoriesNeedingRefresh);
            }

            // Query products from cache
            const deals = await prisma.product.findMany({
                where: query.where,
                take: query.take,
                orderBy: query.orderBy,
            });

            // STEP 3: Scoring
            const scoringEngine = new ScoringEngine();
            const scoredDeals = [];

            for (const deal of deals) {
                dealsProcessed++;
                const scoreData = scoringEngine.calculateDealScore({
                    currentPrice: deal.currentPrice,
                    originalPrice: deal.originalPrice,
                    discount: deal.discount,
                    salesRank: deal.salesRank || 999999,
                    rating: deal.rating || 0,
                    reviewCount: deal.reviewCount || 0,
                    category: deal.category
                });

                if (scoreData.score >= rule.minScore) {
                    scoredDeals.push({ ...deal, score: scoreData.score, scoreBreakdown: scoreData });
                }
            }

            if (scoredDeals.length === 0) {
                return {
                    success: true,
                    dealsProcessed,
                    dealsPublished: 0,
                    errors: [],
                    executionTime: Date.now() - startTime
                };
            }

            // STEP 4: A/B Split (if configured)
            let selectedVariant = null;
            if (rule.split) {
                const variants = rule.split.variants as any[];
                const totalWeight = variants.reduce((sum: number, v: any) => sum + v.weight, 0);
                let random = Math.random() * totalWeight;
                for (const variant of variants) {
                    random -= variant.weight;
                    if (random <= 0) {
                        selectedVariant = variant;
                        break;
                    }
                }
            }

            // STEP 5: Generate Links & Publish
            const dealsLimit = rule.dealsPerRun || maxResults;

            // Deduplication: Filter out already published deals
            let deduplicatedDeals = scoredDeals;
            if (rule.channel) {
                const publishedAsins = await getPublishedAsins(rule.channel.id, rule.dedupeWindowHours);
                if (publishedAsins.size > 0) {
                    deduplicatedDeals = scoredDeals.filter(deal => !publishedAsins.has(deal.asin));
                }
            }

            const dealsToPublish = deduplicatedDeals
                .sort((a, b) => b.score - a.score)
                .slice(0, dealsLimit);

            // Get Telegram bot token
            const telegramCredential = rule.user.credentials?.find((c: any) => c.provider === 'TELEGRAM_BOT');
            if (!telegramCredential) {
                errors.push('No Telegram bot token');
                return { success: false, dealsProcessed, dealsPublished: 0, errors, executionTime: Date.now() - startTime };
            }

            // Get user's Amazon affiliate tag
            let userAmazonTag: string;
            try {
                userAmazonTag = await getUserAmazonTag(rule.userId);
            } catch (tagError: any) {
                errors.push(tagError.message || 'No Amazon tag configured');
                return { success: false, dealsProcessed, dealsPublished: 0, errors, executionTime: Date.now() - startTime };
            }

            const botToken = securityService.decrypt(telegramCredential.key);
            const channelId = rule.channel!.channelId;
            const userPlan = rule.user.plan as string;

            // Publish deals
            for (const deal of dealsToPublish) {
                try {
                    const affiliateLink = `https://amazon.it/dp/${deal.asin}?tag=${userAmazonTag}`;
                    const result = await TelegramBotService.sendDealToChannel(
                        channelId,
                        botToken,
                        {
                            asin: deal.asin,
                            title: deal.title,
                            price: deal.currentPrice,
                            originalPrice: deal.originalPrice,
                            discount: deal.discount / 100,
                            rating: deal.rating || 0,
                            reviewCount: deal.reviewCount || 0,
                            imageUrl: deal.imageUrl || undefined,
                            affiliateLink
                        },
                        rule.userId,       // Pass userId for tracking
                        userAmazonTag      // Pass amazonTag for tracking
                    );

                    if (result.success) {
                        dealsPublished++;
                    } else {
                        errors.push(`${deal.asin}: ${result.error}`);
                    }
                } catch (error: any) {
                    errors.push(`${deal.asin}: ${error.message}`);
                }
            }

            // Record published deals for deduplication
            if (rule.channel && dealsPublished > 0) {
                const publishedAsins = dealsToPublish.slice(0, dealsPublished).map(d => d.asin);
                await recordPublishedDeals(rule.channel.id, publishedAsins, rule.id, rule.dedupeWindowHours);
            }

            // STEP 6: Update Usage Stats
            await prisma.automationRule.update({
                where: { id: ruleId },
                data: {
                    lastRunAt: new Date(),
                    totalRuns: { increment: 1 },
                    dealsPublished: { increment: dealsPublished },
                }
            });

            const executionTime = Date.now() - startTime;

            // Log summary (single line)
            console.log(`[Rule] "${rule.name}" completed: ${dealsPublished}/${dealsProcessed} deals published (${executionTime}ms)`);

            return { success: true, dealsProcessed, dealsPublished, errors, executionTime };

        } catch (error: any) {
            const executionTime = Date.now() - startTime;
            console.error(`[Rule] Execution failed: ${error.message}`);
            return { success: false, dealsProcessed, dealsPublished, errors: [error.message, ...errors], executionTime };
        }
    }
}
