/**
 * ScoringEngine - Deal Score Calculation
 * 
 * Calculates a 0-100 score for products based on multiple weighted factors:
 * - Discount (40%)
 * - Sales Rank (25%)
 * - Rating (20%)
 * - Price Drop History (15%)
 */

export interface ScoreComponents {
    discountScore: number;    // 0-40
    salesRankScore: number;   // 0-25
    ratingScore: number;      // 0-20
    priceDropScore: number;   // 0-15
}

export interface ProductScoreInput {
    currentPrice: number;
    originalPrice: number;
    discount: number;
    salesRank?: number;
    rating?: number;
    reviewCount?: number;
    category: string;
}

export class ScoringEngine {
    /**
     * Calculate the overall Deal Score (0-100)
     */
    calculateDealScore(product: ProductScoreInput): { score: number; components: ScoreComponents } {
        const components: ScoreComponents = {
            discountScore: this.calculateDiscountScore(product.discount),
            salesRankScore: this.calculateSalesRankScore(product.salesRank, product.category),
            ratingScore: this.calculateRatingScore(product.rating, product.reviewCount),
            priceDropScore: this.calculatePriceDropScore(product.currentPrice, product.originalPrice)
        };

        const totalScore = Math.round(
            components.discountScore +
            components.salesRankScore +
            components.ratingScore +
            components.priceDropScore
        );

        return {
            score: Math.min(100, Math.max(0, totalScore)),
            components
        };
    }

    /**
     * Discount Score (40% weight)
     * Higher discount = higher score
     */
    private calculateDiscountScore(discount: number): number {
        // Linear scaling: 0% = 0 points, 100% = 40 points
        return Math.min(40, (discount / 100) * 40);
    }

    /**
     * Sales Rank Score (25% weight)
     * Lower rank = higher score (inverse relationship)
     */
    private calculateSalesRankScore(salesRank: number | undefined, category: string): number {
        if (!salesRank) return 0;

        // Category-specific thresholds
        const categoryThresholds: Record<string, number> = {
            'Elettronica': 1000,
            'Casa e cucina': 2000,
            'Sport e tempo libero': 1500,
            'Libri': 500,
            'default': 1000
        };

        const threshold = categoryThresholds[category] || categoryThresholds['default'];

        // Inverse scaling: rank 1 = 25 points, rank > threshold = 0 points
        if (salesRank <= 1) return 25;
        if (salesRank >= threshold) return 0;

        return 25 * (1 - (salesRank / threshold));
    }

    /**
     * Rating Score (20% weight)
     * Higher rating + more reviews = higher score
     */
    private calculateRatingScore(rating: number | undefined, reviewCount: number | undefined): number {
        if (!rating) return 0;

        // Base score from rating (0-5 stars -> 0-15 points)
        const baseScore = (rating / 5) * 15;

        // Bonus for review count (0-5 points)
        let reviewBonus = 0;
        if (reviewCount) {
            if (reviewCount >= 10000) reviewBonus = 5;
            else if (reviewCount >= 5000) reviewBonus = 4;
            else if (reviewCount >= 1000) reviewBonus = 3;
            else if (reviewCount >= 500) reviewBonus = 2;
            else if (reviewCount >= 100) reviewBonus = 1;
        }

        return Math.min(20, baseScore + reviewBonus);
    }

    /**
     * Price Drop Score (15% weight)
     * Larger price drop = higher score
     */
    private calculatePriceDropScore(currentPrice: number, originalPrice: number): number {
        if (currentPrice >= originalPrice) return 0;

        const dropPercentage = ((originalPrice - currentPrice) / originalPrice) * 100;

        // Scaling: 0% drop = 0 points, 100% drop = 15 points
        return Math.min(15, (dropPercentage / 100) * 15);
    }

    /**
     * Get human-readable score label
     */
    getScoreLabel(score: number): { text: string; color: string } {
        if (score >= 85) return { text: 'HOT DEAL', color: 'red' };
        if (score >= 70) return { text: 'OTTIMO', color: 'cyan' };
        if (score >= 50) return { text: 'BUONO', color: 'yellow' };
        return { text: 'NORMALE', color: 'gray' };
    }
}
