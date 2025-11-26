import { PrismaClient } from '@prisma/client';
import { ScoringEngine } from './ScoringEngine';
import { MessageFormatter } from './MessageFormatter';
import { TelegramBotService } from './TelegramBotService';
import { ProductCacheService } from './ProductCacheService';
import { SecurityService } from './SecurityService';
import { needsKeepaRefresh, getPlanLimits } from '../config/planLimits';

const prisma = new PrismaClient();
const securityService = new SecurityService();

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
            console.log('\n' + '🤖'.repeat(35));
            console.log('🤖 AUTOMATION RULE EXECUTOR - START');
            console.log('🤖'.repeat(35) + '\n');

            // ===== STEP 1: Load Rule =====
            console.log('📋 STEP 1: Loading automation rule...');

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

            console.log(`✅ Loaded rule: "${rule.name}"`);
            console.log(`   User: ${rule.user.email}`);
            console.log(`   Min Score: ${rule.minScore}`);
            console.log(`   Categories: ${rule.categories}`);
            console.log(`   Max Price: ${rule.maxPrice ? `€${rule.maxPrice}` : 'No limit'}\n`);

            // ===== STEP 2: Targeting - Find Deals (with Cache) =====
            console.log('🎯 STEP 2: Targeting deals from cache...');

            // Categories is now a native array in PostgreSQL
            const categories = rule.categories;
            const cacheService = new ProductCacheService();

            // Search in cached products (fresh data < 24h)
            const deals = await prisma.product.findMany({
                where: {
                    category: { in: categories },
                    currentPrice: rule.maxPrice ? { lte: rule.maxPrice } : undefined,
                    // Only include fresh cached products
                    lastPriceCheckAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                    }
                },
                take: 50, // Limit for performance
                orderBy: {
                    discount: 'desc' // Prioritize high discounts
                }
            });

            console.log(`✅ Found ${deals.length} cached deals (fresh < 24h)\n`);

            // If too few deals, warn but continue
            if (deals.length < 5) {
                console.log('⚠️  Warning: Very few cached deals found.');
                console.log('   Consider running a cache refresh job to fetch more products from Keepa.\n');
            }

            // ===== STEP 3: Scoring - Filter by Deal Score =====
            console.log('⭐ STEP 3: Calculating Deal Scores...');

            const scoringEngine = new ScoringEngine();
            const scoredDeals = [];

            for (const deal of deals) {
                dealsProcessed++;

                // Calculate score using ScoringEngine
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
                    scoredDeals.push({
                        ...deal,
                        score: scoreData.score,
                        scoreBreakdown: scoreData
                    });

                    console.log(`   ✓ ${deal.title.substring(0, 50)}... - Score: ${scoreData.score}`);
                }
            }

            console.log(`✅ ${scoredDeals.length} deals passed score threshold (>= ${rule.minScore})\n`);

            if (scoredDeals.length === 0) {
                console.log('ℹ️  No deals to publish. Execution complete.\n');
                return {
                    success: true,
                    dealsProcessed,
                    dealsPublished: 0,
                    errors: [],
                    executionTime: Date.now() - startTime
                };
            }

            // ===== STEP 4: A/B Split (if configured) =====
            let selectedVariant = null;
            if (rule.split) {
                console.log('🔀 STEP 4: Applying A/B Split...');

                const variants = rule.split.variants as any[];
                // Weighted random selection
                const totalWeight = variants.reduce((sum: number, v: any) => sum + v.weight, 0);
                let random = Math.random() * totalWeight;

                for (const variant of variants) {
                    random -= variant.weight;
                    if (random <= 0) {
                        selectedVariant = variant;
                        break;
                    }
                }

                console.log(`✅ Selected variant: ${selectedVariant.name} (weight: ${selectedVariant.weight}%)\n`);
            } else {
                console.log('⏭️  STEP 4: No A/B split configured, skipping...\n');
            }

            // ===== STEP 5: Generate Links & Publish =====
            console.log('📢 STEP 5: Generating short links and publishing to Telegram...');

            // Limit to top 10 deals to avoid spam
            const dealsToPublish = scoredDeals
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);

            // Get Telegram bot token from user credentials
            const telegramCredential = rule.user.credentials?.find(
                (c: any) => c.provider === 'TELEGRAM_BOT'
            );

            if (!telegramCredential) {
                const errorMsg = 'No Telegram bot token found in user credentials';
                errors.push(errorMsg);
                console.error(`❌ ${errorMsg}\n`);

                return {
                    success: false,
                    dealsProcessed,
                    dealsPublished: 0,
                    errors: [errorMsg],
                    executionTime: Date.now() - startTime
                };
            }

            // Get user's Amazon affiliate tag - MANDATORY for publishing
            let userAmazonTag: string;
            try {
                userAmazonTag = await getUserAmazonTag(rule.userId);
                console.log(`   ✅ Amazon tag found: ${userAmazonTag}`);
            } catch (tagError: any) {
                const errorMsg = tagError.message || 'Nessun tag Amazon affiliato configurato';
                errors.push(errorMsg);
                console.error(`❌ ${errorMsg}\n`);

                // TODO: Send notification to user (email/telegram/in-app)
                // NotificationService.notify(rule.userId, {
                //     type: 'AUTOMATION_ERROR',
                //     title: 'Automazione bloccata',
                //     message: 'Configura il tuo tag Amazon affiliato per pubblicare offerte.',
                //     action: { type: 'link', url: '/settings/credentials' }
                // });

                return {
                    success: false,
                    dealsProcessed,
                    dealsPublished: 0,
                    errors: [errorMsg],
                    executionTime: Date.now() - startTime
                };
            }

            const botToken = securityService.decrypt(telegramCredential.key); // Decrypt token
            const channelId = rule.channel!.channelId; // e.g., '@mychannel' or '-1002882115796'

            // Get user plan for refresh logic
            const userPlan = rule.user.plan as string;
            const planLimits = getPlanLimits(userPlan);

            console.log(`   Plan: ${userPlan}`);
            console.log(`   Keepa Refresh Policy: ${planLimits.keepa.forceRefreshIfOlderThan === null ? 'No force refresh' : planLimits.keepa.forceRefreshIfOlderThan === 0 ? 'Always refresh' : `Refresh if > ${planLimits.keepa.forceRefreshIfOlderThan / 60}h old`}\n`);

            for (const deal of dealsToPublish) {
                try {
                    // Check if Keepa refresh is needed before publishing
                    const minutesSinceRefresh = Math.floor(
                        (Date.now() - new Date(deal.lastPriceCheckAt).getTime()) / 60000
                    );

                    console.log(`\n   📦 Deal: ${deal.title.substring(0, 40)}...`);
                    console.log(`      Data age: ${Math.floor(minutesSinceRefresh / 60)}h ${minutesSinceRefresh % 60}m`);

                    if (needsKeepaRefresh(userPlan, minutesSinceRefresh)) {
                        console.log(`      🔄 Data too old, refreshing from Keepa...`);

                        // TODO: Implement actual Keepa API refresh here
                        // For now, just log the action
                        console.log(`      ⚠️  Keepa refresh not yet implemented, using cached data`);

                        // When Keepa refresh is implemented:
                        // 1. Call KeepaEngine.fetchFromKeepa(deal.asin, rule.userId)
                        // 2. Update Product in database with fresh data
                        // 3. Recalculate score
                        // 4. If score < rule.minScore, skip this deal
                        // 5. Update deal object with fresh data

                        // Example:
                        // const freshData = await keepaEngine.fetchFromKeepa(deal.asin, rule.userId);
                        // const freshScore = scoringEngine.calculateDealScore(freshData);
                        // if (freshScore.score < rule.minScore) {
                        //     console.log(`      ⏭️  Score dropped to ${freshScore.score}, skipping...`);
                        //     continue;
                        // }
                        // deal = { ...deal, ...freshData, score: freshScore.score };
                    } else {
                        console.log(`      ✅ Data fresh enough, proceeding...`);
                    }

                    // Build Amazon affiliate URL with user's tag (already validated above)
                    const affiliateLink = `https://amazon.it/dp/${deal.asin}?tag=${userAmazonTag}`;

                    // Use TelegramBotService to create short link and publish
                    const result = await TelegramBotService.sendDealToChannel(
                        channelId,
                        botToken,
                        {
                            asin: deal.asin,
                            title: deal.title,
                            price: deal.currentPrice,
                            originalPrice: deal.originalPrice,
                            discount: deal.discount / 100, // Convert to decimal (33 → 0.33)
                            rating: deal.rating || 0,
                            reviewCount: deal.reviewCount || 0,
                            imageUrl: deal.imageUrl || undefined,
                            affiliateLink
                        }
                    );

                    if (result.success) {
                        dealsPublished++;
                        console.log(`   ✓ Published: ${deal.title.substring(0, 50)}... (Score: ${deal.score})`);
                        console.log(`     Short URL: ${result.shortUrl}`);
                    } else {
                        const errorMsg = `Failed to publish ${deal.asin}: ${result.error}`;
                        errors.push(errorMsg);
                        console.error(`   ✗ ${errorMsg}`);
                    }

                } catch (error: any) {
                    const errorMsg = `Failed to publish deal ${deal.asin}: ${error.message}`;
                    errors.push(errorMsg);
                    console.error(`   ✗ ${errorMsg}`);
                }
            }

            console.log(`✅ Published ${dealsPublished} deals\n`);

            // ===== STEP 6: Update Usage Stats =====
            console.log('📊 STEP 6: Updating usage statistics...');

            await prisma.automationRule.update({
                where: { id: ruleId },
                data: {
                    lastRunAt: new Date(),
                    totalRuns: { increment: 1 }
                }
            });

            const executionTime = Date.now() - startTime;
            console.log(`✅ Stats updated\n`);

            // ===== Summary =====
            console.log('📈 EXECUTION SUMMARY');
            console.log('='.repeat(70));
            console.log(`Rule: ${rule.name}`);
            console.log(`Deals Processed: ${dealsProcessed}`);
            console.log(`Deals Published: ${dealsPublished}`);
            console.log(`Execution Time: ${executionTime}ms`);
            console.log(`Errors: ${errors.length}`);
            console.log('='.repeat(70) + '\n');

            if (errors.length > 0) {
                console.log('⚠️  ERRORS:');
                errors.forEach(err => console.log(`   - ${err}`));
                console.log('');
            }

            console.log('🤖'.repeat(35));
            console.log('🤖 AUTOMATION RULE EXECUTOR - COMPLETE');
            console.log('🤖'.repeat(35) + '\n');

            return {
                success: true,
                dealsProcessed,
                dealsPublished,
                errors,
                executionTime
            };

        } catch (error: any) {
            const executionTime = Date.now() - startTime;
            console.error('\n❌ RULE EXECUTION FAILED:', error.message);
            console.error('🤖'.repeat(35) + '\n');

            return {
                success: false,
                dealsProcessed,
                dealsPublished,
                errors: [error.message, ...errors],
                executionTime
            };
        }
    }
}
