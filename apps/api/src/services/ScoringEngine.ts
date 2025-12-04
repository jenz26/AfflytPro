/**
 * ScoringEngine - Deal Score Calculation with Dynamic Weights
 *
 * Calculates two types of scores:
 * - baseScore (0-100): Fixed weights, used for global comparisons
 * - finalScore (0-100): Dynamic weights based on channel/audience, used for publishing decisions
 *
 * Base weights (when full data available):
 * - Discount: 40%
 * - Sales Rank: 25%
 * - Rating: 20%
 * - Price Drop: 15%
 *
 * Dynamic weights are adjusted based on:
 * - Channel historical performance (ChannelInsights)
 * - Audience type preferences
 * - Category affinity for the specific channel
 */

import { prisma } from '../lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

export interface ScoreWeights {
    discount: number;    // 0-1 (percentage as decimal)
    salesRank: number;   // 0-1
    rating: number;      // 0-1
    priceDrop: number;   // 0-1
}

export interface ProductScoreInput {
    currentPrice: number;
    originalPrice: number;
    discount: number;           // Percentage (0-100)
    salesRank?: number;
    rating?: number;
    reviewCount?: number;
    category: string;
    asin?: string;              // For category affinity lookup
}

export interface ChannelScoreContext {
    channelId: string;
    audienceType: 'product_hunters' | 'deal_explorers' | 'niche_focused' | 'unknown';
    customWeights?: ScoreWeights;
    categoryAffinity?: Record<string, number>;  // category -> affinity score (0-1)
    avgCtr?: number;
    avgCvr?: number;
    confidence: number;         // 0-1, how reliable the channel data is
}

export interface ScoreComponents {
    discountScore: number;      // 0-100 normalized
    salesRankScore: number;     // 0-100 normalized
    ratingScore: number;        // 0-100 normalized
    priceDropScore: number;     // 0-100 normalized
}

export interface ScoreResult {
    baseScore: number;          // 0-100, fixed weights
    finalScore: number;         // 0-100, dynamic weights for channel
    components: ScoreComponents;
    weightsUsed: ScoreWeights;
    label: ScoreLabel;
    affinityMultiplier?: number;
    debug?: {
        audienceType?: string;
        categoryAffinity?: number;
        confidence?: number;
    };
}

export interface ScoreLabel {
    text: string;
    color: string;
    emoji: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default weights for base score calculation (sum = 1.0)
 */
export const DEFAULT_WEIGHTS: ScoreWeights = {
    discount: 0.40,
    salesRank: 0.25,
    rating: 0.20,
    priceDrop: 0.15
};

/**
 * Audience-specific weight adjustments
 * These represent what each audience type values most
 */
export const AUDIENCE_WEIGHTS: Record<string, ScoreWeights> = {
    // Deal hunters prioritize discount and price drops heavily
    product_hunters: {
        discount: 0.50,
        salesRank: 0.15,
        rating: 0.15,
        priceDrop: 0.20
    },
    // Deal explorers want balanced, good quality deals
    deal_explorers: {
        discount: 0.35,
        salesRank: 0.25,
        rating: 0.25,
        priceDrop: 0.15
    },
    // Niche focused audiences care more about quality and popularity
    niche_focused: {
        discount: 0.25,
        salesRank: 0.30,
        rating: 0.30,
        priceDrop: 0.15
    },
    // Unknown audiences get default weights
    unknown: {
        discount: 0.40,
        salesRank: 0.25,
        rating: 0.20,
        priceDrop: 0.15
    }
};

/**
 * Score labels with thresholds
 */
export const SCORE_LABELS: Array<{ min: number; text: string; color: string; emoji: string }> = [
    { min: 75, text: 'HOT', color: 'red', emoji: '🔥' },
    { min: 60, text: 'OTTIMO', color: 'cyan', emoji: '⭐' },
    { min: 45, text: 'BUONO', color: 'green', emoji: '✅' },
    { min: 30, text: 'DECENTE', color: 'yellow', emoji: '👍' },
    { min: 0, text: 'MEH', color: 'gray', emoji: '😐' }
];

/**
 * Category-specific sales rank thresholds (max rank for score = 0)
 */
const CATEGORY_RANK_THRESHOLDS: Record<string, number> = {
    'Elettronica': 50000,
    'Casa e cucina': 100000,
    'Sport e tempo libero': 75000,
    'Giardino e giardinaggio': 100000,
    'Fai da te': 75000,
    'Libri': 25000,
    'Informatica': 50000,
    'Giochi e giocattoli': 75000,
    'Bellezza': 100000,
    'Salute e cura della persona': 100000,
    'default': 75000
};

// ============================================================================
// COMPONENT SCORE CALCULATORS (return 0-100 normalized scores)
// ============================================================================

/**
 * Calculate discount score (0-100)
 * Linear scaling: higher discount = higher score
 */
export function calculateDiscountScore(discount: number): number {
    if (discount <= 0) return 0;
    if (discount >= 100) return 100;

    // Linear scaling: 0% = 0, 100% = 100
    return Math.min(100, discount);
}

/**
 * Calculate sales rank score (0-100)
 * Logarithmic scaling: lower rank = higher score
 *
 * - Rank 1-100: 100-80 points (top sellers)
 * - Rank 100-1000: 80-60 points (excellent)
 * - Rank 1000-10000: 60-30 points (good)
 * - Rank 10000-50000: 30-10 points (average)
 * - Rank 50000+: 10-0 points (below average)
 */
export function calculateSalesRankScore(salesRank: number | undefined, category: string): number {
    if (!salesRank || salesRank <= 0) return 0;

    const maxRank = CATEGORY_RANK_THRESHOLDS[category] || CATEGORY_RANK_THRESHOLDS['default'];

    if (salesRank <= 1) return 100;
    if (salesRank >= maxRank) return 0;

    // Logarithmic scaling for better distribution
    const logRank = Math.log10(salesRank);
    const logMax = Math.log10(maxRank);

    // Score decreases as rank increases
    const score = 100 * (1 - (logRank / logMax));

    return Math.max(0, Math.min(100, score));
}

/**
 * Calculate rating score (0-100)
 * Combines star rating with review count for credibility
 *
 * - Base score from rating: 0-5 stars -> 0-75 points
 * - Bonus from review count: 0-25 points
 */
export function calculateRatingScore(rating: number | undefined, reviewCount: number | undefined): number {
    if (!rating || rating <= 0) return 0;

    // Base score from rating (0-5 stars -> 0-75 points)
    const baseScore = Math.min(75, (rating / 5) * 75);

    // Review count bonus (0-25 points)
    let reviewBonus = 0;
    if (reviewCount) {
        if (reviewCount >= 10000) reviewBonus = 25;
        else if (reviewCount >= 5000) reviewBonus = 20;
        else if (reviewCount >= 1000) reviewBonus = 15;
        else if (reviewCount >= 500) reviewBonus = 10;
        else if (reviewCount >= 100) reviewBonus = 5;
        else if (reviewCount >= 10) reviewBonus = 2;
    }

    return Math.min(100, baseScore + reviewBonus);
}

/**
 * Calculate price drop score (0-100)
 * Measures the savings from original price
 */
export function calculatePriceDropScore(currentPrice: number, originalPrice: number): number {
    if (currentPrice >= originalPrice || originalPrice <= 0) return 0;

    const dropPercentage = ((originalPrice - currentPrice) / originalPrice) * 100;

    // Direct percentage mapping (0% = 0, 100% = 100)
    return Math.min(100, Math.max(0, dropPercentage));
}

// ============================================================================
// WEIGHT UTILITIES
// ============================================================================

/**
 * Get effective weights, handling missing data by redistributing weights
 */
function getEffectiveWeights(
    baseWeights: ScoreWeights,
    hasRating: boolean,
    hasSalesRank: boolean
): ScoreWeights {
    const { discount, salesRank, rating, priceDrop } = baseWeights;

    // Full data available - use weights as-is
    if (hasRating && hasSalesRank) {
        return baseWeights;
    }

    // No rating, no sales rank - redistribute to discount and price drop
    if (!hasRating && !hasSalesRank) {
        const total = discount + priceDrop;
        return {
            discount: discount / total,
            salesRank: 0,
            rating: 0,
            priceDrop: priceDrop / total
        };
    }

    // Has sales rank but no rating - redistribute rating weight
    if (!hasRating && hasSalesRank) {
        const total = discount + salesRank + priceDrop;
        return {
            discount: discount / total,
            salesRank: salesRank / total,
            rating: 0,
            priceDrop: priceDrop / total
        };
    }

    // Has rating but no sales rank - redistribute sales rank weight
    if (hasRating && !hasSalesRank) {
        const total = discount + rating + priceDrop;
        return {
            discount: discount / total,
            salesRank: 0,
            rating: rating / total,
            priceDrop: priceDrop / total
        };
    }

    return baseWeights;
}

/**
 * Blend custom weights with audience weights based on confidence
 * Higher confidence = more weight to custom/learned weights
 */
function blendWeights(
    audienceWeights: ScoreWeights,
    customWeights: ScoreWeights | undefined,
    confidence: number
): ScoreWeights {
    if (!customWeights || confidence <= 0) {
        return audienceWeights;
    }

    // Clamp confidence between 0 and 1
    const c = Math.max(0, Math.min(1, confidence));

    // Blend: (1-c) * audience + c * custom
    return {
        discount: (1 - c) * audienceWeights.discount + c * customWeights.discount,
        salesRank: (1 - c) * audienceWeights.salesRank + c * customWeights.salesRank,
        rating: (1 - c) * audienceWeights.rating + c * customWeights.rating,
        priceDrop: (1 - c) * audienceWeights.priceDrop + c * customWeights.priceDrop
    };
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Calculate deal score with optional channel context for dynamic weights
 *
 * @param product - Product data for scoring
 * @param channelContext - Optional channel context for dynamic scoring
 * @returns ScoreResult with baseScore, finalScore, components, and metadata
 */
export function calculateDealScore(
    product: ProductScoreInput,
    channelContext?: ChannelScoreContext
): ScoreResult {
    const hasRating = product.rating !== undefined && product.rating !== null && product.rating > 0;
    const hasSalesRank = product.salesRank !== undefined && product.salesRank !== null && product.salesRank > 0;

    // Calculate normalized component scores (0-100)
    const components: ScoreComponents = {
        discountScore: calculateDiscountScore(product.discount),
        salesRankScore: hasSalesRank ? calculateSalesRankScore(product.salesRank, product.category) : 0,
        ratingScore: hasRating ? calculateRatingScore(product.rating, product.reviewCount) : 0,
        priceDropScore: calculatePriceDropScore(product.currentPrice, product.originalPrice)
    };

    // Calculate base score (fixed DEFAULT_WEIGHTS)
    const baseWeights = getEffectiveWeights(DEFAULT_WEIGHTS, hasRating, hasSalesRank);
    const baseScore = Math.round(
        components.discountScore * baseWeights.discount +
        components.salesRankScore * baseWeights.salesRank +
        components.ratingScore * baseWeights.rating +
        components.priceDropScore * baseWeights.priceDrop
    );

    // Calculate final score (dynamic weights if channel context provided)
    let finalScore = baseScore;
    let weightsUsed = baseWeights;
    let affinityMultiplier: number | undefined;
    let debug: ScoreResult['debug'];

    if (channelContext) {
        // Get audience-based weights
        const audienceWeights = AUDIENCE_WEIGHTS[channelContext.audienceType] || AUDIENCE_WEIGHTS.unknown;

        // Blend with custom channel weights based on confidence
        const blendedWeights = blendWeights(
            audienceWeights,
            channelContext.customWeights,
            channelContext.confidence
        );

        // Apply data availability adjustments
        weightsUsed = getEffectiveWeights(blendedWeights, hasRating, hasSalesRank);

        // Calculate weighted score
        let dynamicScore =
            components.discountScore * weightsUsed.discount +
            components.salesRankScore * weightsUsed.salesRank +
            components.ratingScore * weightsUsed.rating +
            components.priceDropScore * weightsUsed.priceDrop;

        // Apply category affinity multiplier if available
        if (channelContext.categoryAffinity && product.category) {
            const affinity = channelContext.categoryAffinity[product.category];
            if (affinity !== undefined) {
                // Affinity ranges from 0.5 (low affinity) to 1.5 (high affinity)
                affinityMultiplier = 0.5 + affinity;  // affinity is 0-1, so result is 0.5-1.5
                dynamicScore *= affinityMultiplier;
            }
        }

        finalScore = Math.round(Math.min(100, Math.max(0, dynamicScore)));

        debug = {
            audienceType: channelContext.audienceType,
            categoryAffinity: affinityMultiplier,
            confidence: channelContext.confidence
        };
    }

    // Get label based on final score
    const label = getScoreLabel(finalScore);

    return {
        baseScore: Math.min(100, Math.max(0, baseScore)),
        finalScore,
        components,
        weightsUsed,
        label,
        affinityMultiplier,
        debug
    };
}

/**
 * Get human-readable label for a score
 */
export function getScoreLabel(score: number): ScoreLabel {
    for (const label of SCORE_LABELS) {
        if (score >= label.min) {
            return { text: label.text, color: label.color, emoji: label.emoji };
        }
    }
    return { text: 'MEH', color: 'gray', emoji: '😐' };
}

// ============================================================================
// CHANNEL CONTEXT HELPER
// ============================================================================

/**
 * Fetch channel context from database for dynamic scoring
 *
 * @param channelId - The channel ID to fetch context for
 * @returns ChannelScoreContext or undefined if channel not found
 */
export async function getChannelScoreContext(channelId: string): Promise<ChannelScoreContext | undefined> {
    try {
        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: {
                insights: true
            }
        });

        if (!channel) return undefined;

        const insights = channel.insights;

        // Build category affinity map from insights
        let categoryAffinity: Record<string, number> | undefined;
        if (insights?.categoryStats) {
            const stats = insights.categoryStats as Record<string, { clicks?: number; conversions?: number; ctr?: number; cvr?: number }>;
            categoryAffinity = {};

            // Calculate affinity based on conversion rate relative to average
            const categories = Object.keys(stats);
            if (categories.length > 0) {
                const avgCvr = categories.reduce((sum, cat) => sum + (stats[cat]?.cvr || 0), 0) / categories.length;

                for (const cat of categories) {
                    const catCvr = stats[cat]?.cvr || 0;
                    // Normalize to 0-1 range (0.5 = average, 1 = 2x average, 0 = 0)
                    categoryAffinity[cat] = avgCvr > 0 ? Math.min(1, catCvr / (avgCvr * 2)) : 0.5;
                }
            }
        }

        // Parse custom weights from insights
        let customWeights: ScoreWeights | undefined;
        if (insights?.scoreWeights) {
            const weights = insights.scoreWeights as Record<string, number>;
            if (weights.discount !== undefined && weights.salesRank !== undefined &&
                weights.rating !== undefined && weights.priceDrop !== undefined) {
                customWeights = {
                    discount: weights.discount,
                    salesRank: weights.salesRank,
                    rating: weights.rating,
                    priceDrop: weights.priceDrop
                };
            }
        }

        // Determine audience type
        const audienceType = (channel.audienceType as ChannelScoreContext['audienceType']) ||
                            (insights?.audienceType as ChannelScoreContext['audienceType']) ||
                            'unknown';

        return {
            channelId: channel.id,
            audienceType,
            customWeights,
            categoryAffinity,
            avgCtr: insights?.avgCtr ?? undefined,
            avgCvr: insights?.avgCvr ?? undefined,
            confidence: insights?.confidence ?? 0
        };
    } catch (error) {
        console.error('[ScoringEngine] Error fetching channel context:', error);
        return undefined;
    }
}

// ============================================================================
// INTEGRATION TEST HELPER
// ============================================================================

/**
 * Test helper to verify channel context loading from database
 * Use for debugging and integration testing
 *
 * @example
 * npx tsx -e "import { testContextLoading } from './src/services/ScoringEngine'; testContextLoading('YOUR_CHANNEL_ID');"
 */
export async function testContextLoading(channelId: string): Promise<void> {
    console.log(`\n🔍 Testing context loading for channel: ${channelId}\n`);

    const context = await getChannelScoreContext(channelId);

    if (!context) {
        console.log(`❌ Channel ${channelId} not found or error loading context`);
        return;
    }

    console.log(`✅ Context loaded successfully:`);
    console.log(`   channelId: ${context.channelId}`);
    console.log(`   audienceType: ${context.audienceType}`);
    console.log(`   confidence: ${context.confidence}`);
    console.log(`   avgCtr: ${context.avgCtr ?? 'not set'}`);
    console.log(`   avgCvr: ${context.avgCvr ?? 'not set'}`);

    if (context.customWeights) {
        console.log(`   customWeights:`);
        console.log(`     - discount: ${context.customWeights.discount}`);
        console.log(`     - salesRank: ${context.customWeights.salesRank}`);
        console.log(`     - rating: ${context.customWeights.rating}`);
        console.log(`     - priceDrop: ${context.customWeights.priceDrop}`);
    } else {
        console.log(`   customWeights: using defaults`);
    }

    if (context.categoryAffinity) {
        const categories = Object.keys(context.categoryAffinity);
        console.log(`   categoryAffinity: ${categories.length} categories`);
        categories.slice(0, 5).forEach(cat => {
            console.log(`     - ${cat}: ${context.categoryAffinity![cat].toFixed(2)}`);
        });
        if (categories.length > 5) {
            console.log(`     ... and ${categories.length - 5} more`);
        }
    } else {
        console.log(`   categoryAffinity: none`);
    }

    // Test score calculation with this context
    console.log(`\n📊 Test score calculation with context:`);
    const testProduct: ProductScoreInput = {
        currentPrice: 49.99,
        originalPrice: 79.99,
        discount: 37,
        salesRank: 500,
        rating: 4.5,
        reviewCount: 200,
        category: 'Elettronica'
    };

    const withoutContext = calculateDealScore(testProduct);
    const withContext = calculateDealScore(testProduct, context);

    console.log(`   Without context: baseScore=${withoutContext.baseScore}, finalScore=${withoutContext.finalScore}`);
    console.log(`   With context: baseScore=${withContext.baseScore}, finalScore=${withContext.finalScore}`);
    console.log(`   Difference: ${withContext.finalScore - withoutContext.baseScore > 0 ? '+' : ''}${withContext.finalScore - withoutContext.baseScore}`);
    console.log(`   Label: ${withContext.label.emoji} ${withContext.label.text}`);

    console.log(`\n✨ Context test complete\n`);
}

// ============================================================================
// LEGACY CLASS WRAPPER (for backwards compatibility)
// ============================================================================

/**
 * @deprecated Use the standalone functions instead
 */
export class ScoringEngine {
    calculateDealScore(product: ProductScoreInput): { score: number; components: ScoreComponents } {
        const result = calculateDealScore(product);

        // Convert to legacy format (weighted components, not normalized)
        const legacyComponents: ScoreComponents = {
            discountScore: result.components.discountScore * result.weightsUsed.discount,
            salesRankScore: result.components.salesRankScore * result.weightsUsed.salesRank,
            ratingScore: result.components.ratingScore * result.weightsUsed.rating,
            priceDropScore: result.components.priceDropScore * result.weightsUsed.priceDrop
        };

        return {
            score: result.baseScore,
            components: legacyComponents
        };
    }

    getScoreLabel(score: number): ScoreLabel {
        return getScoreLabel(score);
    }
}
