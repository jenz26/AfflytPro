/**
 * KeepaPopulateService - Populates the Product database with deals from Keepa
 *
 * Strategy:
 * - Uses Keepa Deals API to find current deals/offers
 * - Minimum 2 stars rating
 * - All conditions (Amazon, New, Used, Warehouse)
 * - Italy domain only
 * - Runs on schedule to keep DB fresh
 */

import axios, { AxiosInstance } from 'axios';
import prisma from '../lib/prisma';
import { AMAZON_IT_CATEGORIES } from '../data/amazon-categories';
import { KeepaUtils } from '../utils/keepa-utils';

// Keepa domain codes
const KEEPA_DOMAIN_IT = 8; // Italy

// Token costs (approximate)
// Deals API: 5 tokens per request (returns up to 150 deals)
// Product API: 1 token per ASIN

interface KeepaDealsResponse {
    timestamp: number;
    deals: KeepaRawDeal[];
    tokensLeft: number;
    refillIn: number;
    refillRate: number;
}

// Keepa Deal object structure (from /deal endpoint)
// See: https://github.com/keepacom/api_backend/blob/master/src/main/java/com/keepa/api/backend/structs/Deal.java
interface KeepaRawDeal {
    asin: string;
    title: string;
    image: number[];        // Array of char codes (not string!)
    categories: number[];
    rootCat: number;
    current: number[];      // Current prices by type [Amazon, New, Used, etc]
    avg: number[][];        // Average prices [dateRange][priceType]
    delta: number[][];      // Price drops [dateRange][priceType]
    deltaPercent: number[][]; // Discount percentages [dateRange][priceType]
    minRating: number;      // Minimum rating filter (0-50 scale, not 0-500!)
    creationDate: number;   // Keepa time minutes
    lastUpdate: number;
    currentSince: number[]; // When current price started
    lightningEnd: number;   // When lightning deal ends (Keepa time), 0 if not lightning
    warehouseCondition: number; // 0=none, 2=LikeNew, 3=VeryGood, 4=Good, 5=Acceptable
    // Note: salesRank, reviewCount, isAmazon, isPrime are NOT in Deal object
}

// Deal type classification
type DealType = 'lightning' | 'price_drop' | 'deal' | 'warehouse' | null;

// Keepa time conversion: (keepaTime + 21564000) * 60000 = Unix milliseconds
function keepaTimeToDate(keepaTime: number): Date | null {
    if (!keepaTime || keepaTime <= 0) return null;
    return new Date((keepaTime + 21564000) * 60000);
}

export class KeepaPopulateService {
    private client: AxiosInstance;
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.KEEPA_API_KEY || '';
        this.client = axios.create({
            baseURL: 'https://api.keepa.com',
            timeout: 60000,
        });
    }

    /**
     * Fetch deals from Keepa and store in database
     * @param options Configuration options
     * @returns Number of deals saved
     */
    async populateDeals(options: {
        maxDeals?: number;          // Max deals to fetch (default: 50)
        minRating?: number;         // Minimum rating 0-500 (default: 200 = 2 stars)
        minDiscountPercent?: number;// Minimum discount % (default: 5)
    } = {}): Promise<{ saved: number; skipped: number; errors: string[]; tokensUsed: number }> {
        const {
            maxDeals = 50,
            minRating = 200,
            minDiscountPercent = 5
        } = options;

        if (!this.apiKey) {
            console.error('[Keepa] No API key configured');
            return { saved: 0, skipped: 0, errors: ['No API key'], tokensUsed: 0 };
        }

        const errors: string[] = [];
        let saved = 0;
        let skipped = 0;
        let tokensUsed = 0;

        try {
            // Build the deals request using correct Keepa API parameters
            // domainId MUST be inside the selection JSON, NOT as a URL param
            // NOTE: priceTypes can only contain ONE value, not multiple!
            // Omitting priceTypes returns all deal types

            const dealParams: Record<string, any> = {
                page: 0,
                domainId: KEEPA_DOMAIN_IT,  // 8 = Italy
                priceTypes: [0],  // 0 = Amazon price (required, only ONE value allowed)
                hasReviews: true,
                isRangeEnabled: true,
                deltaPercentRange: [minDiscountPercent, 100]
            };

            // Add minimum rating filter (Keepa uses 0-50 scale, not 0-500)
            // 2 stars = 20 on Keepa scale
            if (minRating > 0) {
                dealParams.minRating = Math.floor(minRating / 10);
            }

            // Keepa API call
            const response = await this.client.get('/deal', {
                params: {
                    key: this.apiKey,
                    selection: JSON.stringify(dealParams)
                }
            });

            const responseData = response.data as any;
            const deals = responseData.deals?.dr || [];
            tokensUsed = 5;

            if (!deals || deals.length === 0) {
                return { saved: 0, skipped: 0, errors: [], tokensUsed };
            }

            // Process and save deals
            for (const deal of deals.slice(0, maxDeals)) {
                try {
                    const product = await this.saveDeal(deal);
                    if (product) {
                        saved++;
                    } else {
                        skipped++;
                    }
                } catch (error: any) {
                    errors.push(`${deal.asin}: ${error.message}`);
                }
            }

        } catch (error: any) {
            console.error('[Keepa] API error:', error.response?.status || error.message);
            if (error.response?.status === 429) {
                errors.push('Rate limit exceeded');
            } else if (error.response?.status === 401) {
                errors.push('Invalid API key');
            } else {
                errors.push(error.message);
            }
        }

        // Only log summary if there were issues
        if (errors.length > 0) {
            console.error(`[Keepa] Populate completed with ${errors.length} errors`);
        }

        return { saved, skipped, errors, tokensUsed };
    }

    /**
     * Save a single deal to the database
     */
    private async saveDeal(deal: any): Promise<any> {
        // Get current price - deal.current is array of prices by type [Amazon, New, Used, etc]
        const currentPriceRaw = deal.current?.[0] ?? deal.current?.[1] ?? deal.current?.[2];
        const currentPriceCents = typeof currentPriceRaw === 'number' && currentPriceRaw > 0
            ? currentPriceRaw
            : null;

        if (!currentPriceCents) {
            return null; // Skip if no valid price
        }

        // Get discount percent - deltaPercent is 2D array: deltaPercent[dateRange][priceType]
        // dateRange: 0=day (24h), 1=week (7d), 2=month (31d), 3=90days
        // priceType: 0=Amazon, 1=New, 2=Used, etc.
        // We want the 30-day (index 2) or 90-day (index 3) comparison for Amazon price (priceType 0)
        let discountPercent = 0;
        if (deal.deltaPercent && Array.isArray(deal.deltaPercent)) {
            // deltaPercent[dateRange][priceType]
            // Try 30-day range first (index 2), then 90-day (index 3), then week (1), then day (0)
            const monthData = deal.deltaPercent[2];   // 30 days
            const quarterData = deal.deltaPercent[3]; // 90 days
            const weekData = deal.deltaPercent[1];    // 7 days
            const dayData = deal.deltaPercent[0];     // 24 hours

            // For each date range, try Amazon price (0), then New price (1)
            const deltaValue =
                monthData?.[0] ?? monthData?.[1] ??     // 30-day: Amazon or New
                quarterData?.[0] ?? quarterData?.[1] ?? // 90-day: Amazon or New
                weekData?.[0] ?? weekData?.[1] ??       // 7-day: Amazon or New
                dayData?.[0] ?? dayData?.[1] ??         // 24h: Amazon or New
                0;

            // deltaPercent is negative for price drops (we want positive discount)
            if (typeof deltaValue === 'number' && deltaValue < 0) {
                discountPercent = Math.abs(deltaValue);
            }
        }

        // Also try to get original price from avg (average prices)
        // avg[dateRange][priceType] - use 30-day or 90-day average as "original" price
        let originalPriceFromAvg: number | null = null;
        if (deal.avg && Array.isArray(deal.avg)) {
            const monthAvg = deal.avg[2];   // 30-day average
            const quarterAvg = deal.avg[3]; // 90-day average

            const avgValue =
                monthAvg?.[0] ?? monthAvg?.[1] ??       // 30-day: Amazon or New
                quarterAvg?.[0] ?? quarterAvg?.[1] ??   // 90-day: Amazon or New
                null;

            if (typeof avgValue === 'number' && avgValue > 0) {
                originalPriceFromAvg = avgValue;
            }
        }

        // Clamp discount to valid range
        discountPercent = Math.max(0, Math.min(99, Math.round(discountPercent)));

        // Calculate original price - prefer avg data, fallback to calculation from discount
        let originalPriceCents = currentPriceCents;
        if (originalPriceFromAvg && originalPriceFromAvg > currentPriceCents) {
            // Use average price as original (more accurate)
            originalPriceCents = originalPriceFromAvg;
            // Recalculate discount from actual prices
            discountPercent = Math.round(((originalPriceCents - currentPriceCents) / originalPriceCents) * 100);
            discountPercent = Math.max(0, Math.min(99, discountPercent));
        } else if (discountPercent > 0) {
            // Fallback: calculate original from discount percentage
            originalPriceCents = Math.round(currentPriceCents / (1 - discountPercent / 100));
        }

        // Get category name
        const categoryId = deal.rootCat || deal.categories?.[0];
        const category = AMAZON_IT_CATEGORIES.find(c => c.id === categoryId);
        const categoryName = category?.name || 'Altro';

        // Build image URL - deal.image is array of char codes, need to convert
        let imageUrl: string | undefined;
        if (deal.image && Array.isArray(deal.image)) {
            // Convert array of char codes to string
            const imageFileName = String.fromCharCode(...deal.image);
            imageUrl = `https://m.media-amazon.com/images/I/${imageFileName}`;
        } else if (typeof deal.image === 'string') {
            imageUrl = `https://m.media-amazon.com/images/I/${deal.image}`;
        }

        // Note: Deal object does NOT have salesRank, reviewCount, isAmazon, isPrime
        // These fields would require a separate Product API call (costs more tokens)
        // For now we save what we have from the Deal endpoint

        // === DEAL TYPE CLASSIFICATION ===
        let dealType: DealType = null;
        let lightningEndAt: Date | null = null;
        let dealConfidence = 0;

        // 1. Check if it's a Lightning Deal (highest confidence)
        if (deal.lightningEnd && deal.lightningEnd > 0) {
            dealType = 'lightning';
            lightningEndAt = keepaTimeToDate(deal.lightningEnd);
            dealConfidence = 95; // Lightning deals are definitely temporary
        }
        // 2. Check if it's a Warehouse Deal
        else if (deal.warehouseCondition && deal.warehouseCondition >= 2) {
            dealType = 'warehouse';
            dealConfidence = 80;
        }
        // 3. Analyze price patterns to distinguish real deals from permanent price changes
        else if (discountPercent > 0) {
            // Get day vs month delta to detect temporary vs permanent
            const dayDelta = deal.deltaPercent?.[0]?.[0] ?? deal.deltaPercent?.[0]?.[1] ?? 0;
            const monthDelta = deal.deltaPercent?.[2]?.[0] ?? deal.deltaPercent?.[2]?.[1] ?? 0;

            // Calculate how "fresh" the discount is
            // If day delta is much higher than month delta, it's a recent drop (likely a deal)
            // If they're similar, it's been at this price for a while (permanent change)
            const dayDeltaAbs = Math.abs(dayDelta);
            const monthDeltaAbs = Math.abs(monthDelta);

            if (dayDeltaAbs > 0 && monthDeltaAbs > 0) {
                const freshnessRatio = dayDeltaAbs / monthDeltaAbs;

                if (freshnessRatio > 1.5) {
                    // Recent significant drop - likely a real deal
                    dealType = 'price_drop';
                    dealConfidence = Math.min(90, Math.round(50 + (freshnessRatio * 10)));
                } else if (discountPercent >= 20) {
                    // Significant discount but stable - could still be a deal
                    dealType = 'deal';
                    dealConfidence = Math.min(70, Math.round(30 + discountPercent));
                } else {
                    // Small discount, stable price - probably just normal pricing
                    dealType = null;
                    dealConfidence = 0;
                }
            } else if (dayDeltaAbs > 10) {
                // Recent drop detected
                dealType = 'price_drop';
                dealConfidence = Math.min(80, Math.round(40 + dayDeltaAbs));
            } else if (discountPercent >= 15 && originalPriceFromAvg) {
                // Good discount vs historical average
                dealType = 'deal';
                dealConfidence = Math.min(70, Math.round(20 + discountPercent));
            }
        }

        // Clamp confidence
        dealConfidence = Math.max(0, Math.min(100, dealConfidence));

        // Upsert to database
        const product = await prisma.product.upsert({
            where: { asin: deal.asin },
            update: {
                title: deal.title || `Product ${deal.asin}`,
                currentPrice: KeepaUtils.centsToEuros(currentPriceCents),
                originalPrice: KeepaUtils.centsToEuros(originalPriceCents),
                discount: discountPercent,
                // Deal API doesn't provide these - leave existing values or null
                // salesRank, reviewCount, rating, isAmazonSeller, isPrime not updated
                category: categoryName,
                imageUrl,
                dealType,
                lightningEndAt,
                dealConfidence,
                lastPriceCheckAt: new Date(),
                keepaDataTTL: 1440, // 24 hours in minutes
                updatedAt: new Date()
            },
            create: {
                asin: deal.asin,
                title: deal.title || `Product ${deal.asin}`,
                currentPrice: KeepaUtils.centsToEuros(currentPriceCents),
                originalPrice: KeepaUtils.centsToEuros(originalPriceCents),
                discount: discountPercent,
                // Deal API doesn't provide these fields
                salesRank: null,
                rating: null,
                reviewCount: null,
                category: categoryName,
                imageUrl,
                isAmazonSeller: false,
                isPrime: false,
                dealType,
                lightningEndAt,
                dealConfidence,
                lastPriceCheckAt: new Date(),
                keepaDataTTL: 1440
            }
        });

        return product;
    }

    /**
     * Get token status from Keepa
     */
    async getTokenStatus(): Promise<{ tokensLeft: number; refillRate: number } | null> {
        if (!this.apiKey) return null;

        try {
            const response = await this.client.get('/token', {
                params: { key: this.apiKey }
            });
            return {
                tokensLeft: response.data.tokensLeft,
                refillRate: response.data.refillRate
            };
        } catch {
            return null;
        }
    }
}

// Export singleton instance
export const keepaPopulateService = new KeepaPopulateService();
