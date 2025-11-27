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
import { AMAZON_IT_CATEGORIES, getNonGatedCategories } from '../data/amazon-categories';
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

interface KeepaRawDeal {
    asin: string;
    title: string;
    image: string;
    categories: number[];
    rootCat: number;
    current: number[];      // Current prices by condition [Amazon, New, Used, etc]
    avg: number[];          // Average prices
    delta: number[];        // Price drops
    deltaPercent: number[]; // Discount percentages
    salesRank: number;
    rating: number;         // 0-500 scale (4.5 stars = 450)
    reviewCount: number;
    isAmazon: boolean;
    isPrime: boolean;
    availabilityAmazon: number;
    condition: number;      // 0=Amazon, 1=New, 2=Used, etc
    lastUpdate: number;
}

export class KeepaPopulateService {
    private client: AxiosInstance;
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.KEEPA_API_KEY || '';

        if (!this.apiKey) {
            console.warn('[KeepaPopulate] WARNING: KEEPA_API_KEY not set!');
        }

        this.client = axios.create({
            baseURL: 'https://api.keepa.com',
            timeout: 60000, // 60s timeout for deals endpoint
        });
    }

    /**
     * Fetch deals from Keepa and store in database
     * @param options Configuration options
     * @returns Number of deals saved
     */
    async populateDeals(options: {
        maxDeals?: number;          // Max deals to fetch (default: 50)
        categories?: number[];      // Category IDs to search (default: all non-gated)
        minRating?: number;         // Minimum rating 0-500 (default: 200 = 2 stars)
        minDiscountPercent?: number;// Minimum discount % (default: 10)
    } = {}): Promise<{ saved: number; skipped: number; errors: string[]; tokensUsed: number }> {
        const {
            maxDeals = 50,
            categories = getNonGatedCategories().map(c => c.id),
            minRating = 200,      // 2 stars
            minDiscountPercent = 10
        } = options;

        console.log('\n' + '='.repeat(60));
        console.log('🔍 KEEPA POPULATE SERVICE - START');
        console.log('='.repeat(60));
        console.log(`   Max deals: ${maxDeals}`);
        console.log(`   Categories: ${categories.length}`);
        console.log(`   Min rating: ${minRating / 100} stars`);
        console.log(`   Min discount: ${minDiscountPercent}%`);
        console.log('');

        if (!this.apiKey) {
            console.error('❌ No KEEPA_API_KEY set!');
            return { saved: 0, skipped: 0, errors: ['No API key'], tokensUsed: 0 };
        }

        const errors: string[] = [];
        let saved = 0;
        let skipped = 0;
        let tokensUsed = 0;

        try {
            // Build the deals request
            // Keepa Deals API parameters
            const dealRequest = {
                domain: KEEPA_DOMAIN_IT,
                selection: JSON.stringify({
                    // Price types to include
                    // 0=Amazon, 1=New 3rd party, 2=Used, 7=Amazon Warehouse
                    priceTypes: [0, 1, 2, 7],

                    // Only deals with minimum rating
                    deltaPercentRange: [minDiscountPercent, 100],

                    // Rating filter (min 2 stars = 200)
                    currentRatingRange: [minRating, 500],

                    // Must have reviews
                    hasReviews: true,

                    // Include out of stock? No
                    isOutOfStock: false,

                    // Category filter (root categories)
                    rootCatInclude: categories,

                    // Sort by discount percentage descending
                    sort: [['deltaPercent', 'desc']],

                    // Pagination
                    page: 0,
                    perPage: Math.min(maxDeals, 150) // Keepa max is 150 per request
                })
            };

            console.log('📡 Calling Keepa Deals API...');

            const response = await this.client.get<KeepaDealsResponse>('/deal', {
                params: {
                    key: this.apiKey,
                    ...dealRequest
                }
            });

            const { deals, tokensLeft, refillIn, refillRate } = response.data;

            // Estimate tokens used (deals API costs ~5 tokens)
            tokensUsed = 5;

            console.log(`✅ Received ${deals?.length || 0} deals from Keepa`);
            console.log(`   Tokens left: ${tokensLeft}`);
            console.log(`   Refill in: ${refillIn}ms (rate: ${refillRate}/min)`);
            console.log('');

            if (!deals || deals.length === 0) {
                console.log('⚠️  No deals found matching criteria');
                return { saved: 0, skipped: 0, errors: [], tokensUsed };
            }

            // Process and save each deal
            console.log('💾 Saving deals to database...');

            for (const deal of deals.slice(0, maxDeals)) {
                try {
                    const product = await this.saveDeal(deal);
                    if (product) {
                        saved++;
                        console.log(`   ✓ ${deal.asin}: ${deal.title?.substring(0, 40)}... (${deal.deltaPercent?.[0] || 0}% off)`);
                    } else {
                        skipped++;
                    }
                } catch (error: any) {
                    errors.push(`${deal.asin}: ${error.message}`);
                    console.error(`   ✗ ${deal.asin}: ${error.message}`);
                }
            }

        } catch (error: any) {
            console.error('❌ Keepa API error:', error.message);

            if (error.response?.status === 429) {
                errors.push('Rate limit exceeded - token quota depleted');
            } else if (error.response?.status === 401) {
                errors.push('Invalid API key');
            } else {
                errors.push(error.message);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 KEEPA POPULATE SUMMARY');
        console.log('='.repeat(60));
        console.log(`   Deals saved: ${saved}`);
        console.log(`   Deals skipped: ${skipped}`);
        console.log(`   Errors: ${errors.length}`);
        console.log(`   Tokens used: ~${tokensUsed}`);
        console.log('='.repeat(60) + '\n');

        return { saved, skipped, errors, tokensUsed };
    }

    /**
     * Save a single deal to the database
     */
    private async saveDeal(deal: KeepaRawDeal): Promise<any> {
        // Get best current price from available conditions
        // current array: [0]=Amazon, [1]=New, [2]=Used, etc
        const amazonPrice = deal.current?.[0] > 0 ? deal.current[0] : null;
        const newPrice = deal.current?.[1] > 0 ? deal.current[1] : null;
        const usedPrice = deal.current?.[2] > 0 ? deal.current[2] : null;

        // Use the best available price (Amazon first, then New, then Used)
        const currentPriceCents = amazonPrice || newPrice || usedPrice;

        if (!currentPriceCents || currentPriceCents <= 0) {
            return null; // Skip if no valid price
        }

        // Get original/list price from avg or calculate from delta
        const avgPrice = deal.avg?.[0] || deal.avg?.[1] || currentPriceCents;
        const discountPercent = deal.deltaPercent?.[0] || deal.deltaPercent?.[1] || 0;

        // Calculate original price if we have discount
        let originalPriceCents = avgPrice;
        if (discountPercent > 0 && discountPercent < 100) {
            originalPriceCents = Math.round(currentPriceCents / (1 - discountPercent / 100));
        }

        // Get category name
        const categoryId = deal.rootCat || deal.categories?.[0];
        const category = AMAZON_IT_CATEGORIES.find(c => c.id === categoryId);
        const categoryName = category?.name || 'Altro';

        // Build image URL
        const imageUrl = deal.image
            ? `https://m.media-amazon.com/images/I/${deal.image}`
            : undefined;

        // Upsert to database
        const product = await prisma.product.upsert({
            where: { asin: deal.asin },
            update: {
                title: deal.title || `Product ${deal.asin}`,
                currentPrice: KeepaUtils.centsToEuros(currentPriceCents),
                originalPrice: KeepaUtils.centsToEuros(originalPriceCents),
                discount: Math.max(0, Math.min(100, discountPercent)),
                salesRank: deal.salesRank || null,
                rating: deal.rating ? KeepaUtils.keepaRatingToStars(deal.rating) : null,
                reviewCount: deal.reviewCount || null,
                category: categoryName,
                imageUrl,
                isAmazonSeller: deal.isAmazon || false,
                isPrime: deal.isPrime || false,
                lastPriceCheckAt: new Date(),
                keepaDataTTL: 1440, // 24 hours in minutes
                updatedAt: new Date()
            },
            create: {
                asin: deal.asin,
                title: deal.title || `Product ${deal.asin}`,
                currentPrice: KeepaUtils.centsToEuros(currentPriceCents),
                originalPrice: KeepaUtils.centsToEuros(originalPriceCents),
                discount: Math.max(0, Math.min(100, discountPercent)),
                salesRank: deal.salesRank || null,
                rating: deal.rating ? KeepaUtils.keepaRatingToStars(deal.rating) : null,
                reviewCount: deal.reviewCount || null,
                category: categoryName,
                imageUrl,
                isAmazonSeller: deal.isAmazon || false,
                isPrime: deal.isPrime || false,
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
