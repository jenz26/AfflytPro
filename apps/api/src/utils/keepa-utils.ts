/**
 * Keepa Utility Functions
 * Conversion helpers between Keepa format and our internal format
 */

export class KeepaUtils {
    /**
     * Convert Keepa price (cents) to euros
     * @example 3999 -> 39.99
     */
    static centsToEuros(cents: number | null | undefined): number {
        if (!cents || cents < 0) return 0;
        return cents / 100;
    }

    /**
     * Convert euros to Keepa cents
     * @example 39.99 -> 3999
     */
    static eurosToCents(euros: number): number {
        return Math.round(euros * 100);
    }

    /**
     * Convert Keepa rating (0-500) to stars (0-5)
     * @example 450 -> 4.5
     */
    static keepaRatingToStars(keepaRating: number | null | undefined): number {
        if (!keepaRating || keepaRating < 0) return 0;
        return keepaRating / 100;
    }

    /**
     * Convert stars to Keepa rating
     * @example 4.5 -> 450
     */
    static starsToKeepaRating(stars: number): number {
        return Math.round(stars * 100);
    }

    /**
     * Convert Unix timestamp (seconds) to Date
     * @example 1625270400 -> Date object
     */
    static unixToDate(unixSeconds: number | null | undefined): Date | null {
        if (!unixSeconds) return null;
        return new Date(unixSeconds * 1000);
    }

    /**
     * Calculate discount percentage
     * @param currentPrice Current price in cents
     * @param listPrice List price in cents
     * @returns Discount percentage (0-100)
     */
    static calculateDiscount(currentPrice: number, listPrice: number): number {
        if (!listPrice || listPrice <= 0) return 0;
        if (!currentPrice || currentPrice <= 0) return 0;
        if (currentPrice >= listPrice) return 0;

        return Math.round(((listPrice - currentPrice) / listPrice) * 100);
    }

    /**
     * Get latest value from Keepa data array
     * @example getLatestValue([100, 200, 300]) -> 300
     */
    static getLatestValue<T>(arr: T[] | null | undefined): T | null {
        if (!arr || arr.length === 0) return null;
        return arr[arr.length - 1];
    }

    /**
     * Check if product is in stock
     * @param stockAmazon Keepa stock field
     * @returns true if in stock, false otherwise
     */
    static isInStock(stockAmazon: number | null | undefined): boolean {
        if (stockAmazon === null || stockAmazon === undefined) return false;
        if (stockAmazon === -1) return false; // Data not available
        return stockAmazon > 0;
    }

    /**
     * Get average of Keepa data array
     */
    static getAverage(arr: number[] | null | undefined): number | null {
        if (!arr || arr.length === 0) return null;
        const sum = arr.reduce((acc, val) => acc + val, 0);
        return sum / arr.length;
    }

    /**
     * Extract category name from Keepa response
     */
    static extractCategoryName(keepaData: any): string {
        // Try categoryTree first (most descriptive)
        if (keepaData.categoryTree && keepaData.categoryTree.length > 0) {
            const categories = keepaData.categoryTree.map((cat: any) => cat.name);
            return categories[categories.length - 1]; // Get most specific category
        }

        // Fallback to binding
        if (keepaData.binding) {
            return keepaData.binding;
        }

        // Last resort
        return 'General';
    }
}
