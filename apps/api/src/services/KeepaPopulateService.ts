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
    avg: number[][];        // Average prices [priceType][timeRange]
    delta: number[][];      // Price drops [priceType][timeRange]
    deltaPercent: number[][]; // Discount percentages [priceType][timeRange]
    minRating: number;      // Minimum rating filter (0-50 scale, not 0-500!)
    creationDate: number;   // Keepa time minutes
    lastUpdate: number;
    currentSince: number[]; // When current price started
    // Note: salesRank, reviewCount, isAmazon, isPrime are NOT in Deal object
}

export class KeepaPopulateService {
    private client: AxiosInstance;
    private apiKey: string;
    private loggedDealStructure = false;

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
        minRating?: number;         // Minimum rating 0-500 (default: 200 = 2 stars)
        minDiscountPercent?: number;// Minimum discount % (default: 5)
    } = {}): Promise<{ saved: number; skipped: number; errors: string[]; tokensUsed: number }> {
        const {
            maxDeals = 50,
            minRating = 200,      // 2 stars
            minDiscountPercent = 5
        } = options;

        console.log('\n' + '='.repeat(60));
        console.log('🔍 KEEPA POPULATE SERVICE - START');
        console.log('='.repeat(60));
        console.log(`   Max deals: ${maxDeals}`);
        console.log(`   Categories: ALL`);
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

            // Don't filter by category - get deals from ALL categories

            console.log('📡 Calling Keepa Deals API...');
            console.log('   Domain:', KEEPA_DOMAIN_IT, '(Italy)');
            console.log('   Selection:', JSON.stringify(dealParams));

            // Keepa API call - NO domain in URL, only in selection JSON
            const response = await this.client.get('/deal', {
                params: {
                    key: this.apiKey,
                    selection: JSON.stringify(dealParams)
                }
            });

            // Response structure: { deals: { dr: [...], categoryIds, categoryNames }, tokensLeft, ... }
            const responseData = response.data as any;
            const deals = responseData.deals?.dr || [];
            const tokensLeft = responseData.tokensLeft ?? 0;
            const refillIn = responseData.refillIn ?? 0;
            const refillRate = responseData.refillRate ?? 0;

            console.log('📦 Response received - Categories:', responseData.deals?.categoryNames?.slice(0, 5).join(', '));

            // Estimate tokens used (deals API costs ~5 tokens)
            tokensUsed = 5;

            console.log(`✅ Received ${deals?.length || 0} deals from Keepa`);
            console.log(`   Tokens left: ${tokensLeft}`);
            console.log(`   Refill in: ${refillIn}ms (rate: ${refillRate}/min)`);
            console.log('');

            if (!deals || deals.length === 0) {
                console.log('⚠️  No deals found matching criteria');
                console.log('   This could mean: no deals match filters OR API returned empty');
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

            // Log full error details for debugging
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', JSON.stringify(error.response.data, null, 2));
                console.error('   Headers:', JSON.stringify(error.response.headers, null, 2));
            }

            if (error.response?.status === 429) {
                errors.push('Rate limit exceeded - token quota depleted');
            } else if (error.response?.status === 401) {
                errors.push('Invalid API key');
            } else if (error.response?.status === 400) {
                const errorMsg = error.response.data?.error || error.response.data?.message || 'Bad request - check parameters';
                errors.push(`Bad request: ${errorMsg}`);
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
    private async saveDeal(deal: any): Promise<any> {
        // Debug: log first deal structure to understand the format
        if (!this.loggedDealStructure) {
            console.log('📋 Deal structure sample:', JSON.stringify(deal, null, 2));
            this.loggedDealStructure = true;
        }

        // Deals API returns different structure than Product API
        // Fields: asin, title, image (array of bytes), current, avg, delta, deltaPercent, etc.

        // Get current price - deal.current is array of prices by type [Amazon, New, Used, etc]
        const currentPriceRaw = deal.current?.[0] ?? deal.current?.[1] ?? deal.current?.[2];
        const currentPriceCents = typeof currentPriceRaw === 'number' && currentPriceRaw > 0
            ? currentPriceRaw
            : null;

        if (!currentPriceCents) {
            return null; // Skip if no valid price
        }

        // Get discount percent - deltaPercent is 2D array: deltaPercent[priceType][timeRange]
        // priceType: 0=Amazon, 1=New, 2=Used, etc.
        // timeRange: 0=1day, 1=7days, 2=30days, 3=90days
        // We want the 30-day or 90-day comparison for Amazon price (index 0)
        let discountPercent = 0;
        if (deal.deltaPercent && Array.isArray(deal.deltaPercent)) {
            // Try Amazon price type first (index 0), then New (index 1)
            const amazonDeltas = deal.deltaPercent[0];
            const newDeltas = deal.deltaPercent[1];

            // Get 30-day delta (index 2) or 90-day (index 3)
            const deltaValue = amazonDeltas?.[2] ?? amazonDeltas?.[3] ?? newDeltas?.[2] ?? newDeltas?.[3] ?? 0;

            // deltaPercent is negative for price drops (we want positive discount)
            if (typeof deltaValue === 'number' && deltaValue < 0) {
                discountPercent = Math.abs(deltaValue);
            }
        }

        // Clamp discount to valid range
        discountPercent = Math.max(0, Math.min(99, Math.round(discountPercent)));

        // Calculate original price from current price and discount
        let originalPriceCents = currentPriceCents;
        if (discountPercent > 0) {
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
