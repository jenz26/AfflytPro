/**
 * KeepaEngine - Keepa API Integration with TTL/Lazy Load Logic
 *
 * Manages product data freshness and Keepa API calls with:
 * - TTL-based refresh logic
 * - Lazy loading (return stale data, refresh in background)
 * - Monthly token budget tracking
 */

import { PrismaClient } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import { KeepaUtils } from '../utils/keepa-utils';

const prisma = new PrismaClient();

export interface KeepaProduct {
    asin: string;
    title: string;
    currentPrice: number;
    originalPrice: number;
    salesRank?: number;
    rating?: number;
    reviewCount?: number;
    category: string;
    imageUrl?: string;
}

export interface KeepaProductFinderParams {
    categories_include?: number[];
    categories_exclude?: number[];
    current_AMAZON_gte?: number; // In cents
    current_AMAZON_lte?: number; // In cents
    current_RATING_gte?: number; // 0-500 scale
    current_SALES_lte?: number;
    current_COUNT_REVIEWS_gte?: number;
    hasReviews?: boolean;
    sort?: Array<[string, 'asc' | 'desc']>;
    page?: number;
    perPage?: number;
}

export class KeepaEngine {
    private client: AxiosInstance;
    private apiKey: string;
    private domain: string;
    private maxRetries: number;
    private refreshQueue: Set<string> = new Set();
    private isProcessingQueue = false;

    constructor() {
        this.apiKey = process.env.KEEPA_API_KEY || '';
        this.domain = process.env.KEEPA_DOMAIN || 'IT';
        this.maxRetries = parseInt(process.env.KEEPA_MAX_RETRIES || '3');

        if (!this.apiKey) {
            console.warn('WARNING: KEEPA_API_KEY not set. Using mock data.');
        }

        this.client = axios.create({
            baseURL: 'https://api.keepa.com',
            timeout: parseInt(process.env.KEEPA_TIMEOUT_MS || '30000'),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Check product freshness and trigger refresh if needed
     * Returns current data immediately (lazy load)
     */
    async checkAndRefresh(asin: string, userId: string): Promise<any> {
        const product = await prisma.product.findUnique({
            where: { asin }
        });

        if (!product) {
            // Product not in DB, fetch immediately
            return await this.fetchAndStore(asin, userId);
        }

        // Calculate TTL status
        const ttlStatus = this.calculateTTL(product);

        // If stale, add to refresh queue
        if (ttlStatus.needsRefresh) {
            this.addToRefreshQueue(asin, userId);
        }

        // Return current data immediately
        return product;
    }

    /**
     * Calculate TTL and freshness status
     */
    private calculateTTL(product: any): { ttl: number; needsRefresh: boolean; status: string } {
        const now = new Date();
        const lastCheck = new Date(product.lastPriceCheckAt);
        const minutesSinceCheck = Math.floor((now.getTime() - lastCheck.getTime()) / 60000);
        const ttlRemaining = product.keepaDataTTL - minutesSinceCheck;

        let status = 'fresh';
        let needsRefresh = false;

        if (ttlRemaining < 0) {
            status = 'expired';
            needsRefresh = true;
        } else if (ttlRemaining < 360) { // < 6h
            status = 'critical';
            needsRefresh = true;
        } else if (ttlRemaining < 720) { // < 12h
            status = 'expiring';
            needsRefresh = true;
        } else if (ttlRemaining < 1200) { // < 20h
            status = 'valid';
        }

        return {
            ttl: Math.max(0, ttlRemaining),
            needsRefresh,
            status
        };
    }

    /**
     * Add ASIN to refresh queue and process in background
     */
    private addToRefreshQueue(asin: string, userId: string): void {
        this.refreshQueue.add(asin);

        // Start processing queue if not already running
        if (!this.isProcessingQueue) {
            this.processRefreshQueue(userId);
        }
    }

    /**
     * Process refresh queue in background
     */
    private async processRefreshQueue(userId: string): Promise<void> {
        if (this.isProcessingQueue) return;

        this.isProcessingQueue = true;

        try {
            while (this.refreshQueue.size > 0) {
                const asin = Array.from(this.refreshQueue)[0];
                this.refreshQueue.delete(asin);

                try {
                    await this.fetchAndStore(asin, userId);
                    // Rate limiting: wait 100ms between requests
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.error(`Failed to refresh ${asin}:`, error);
                }
            }
        } finally {
            this.isProcessingQueue = false;
        }
    }

    /**
     * Fetch product data from Keepa API and store in DB
     */
    private async fetchAndStore(asin: string, userId: string): Promise<any> {
        // Check monthly budget
        const canMakeRequest = await this.checkMonthlyBudget(userId);
        if (!canMakeRequest) {
            throw new Error('Monthly Keepa token limit exceeded');
        }

        // Fetch from Keepa API
        const keepaData = await this.fetchFromKeepa(asin);

        // Calculate discount
        const discount = Math.round(
            ((keepaData.originalPrice - keepaData.currentPrice) / keepaData.originalPrice) * 100
        );

        // Update or create product
        const product = await prisma.product.upsert({
            where: { asin },
            update: {
                title: keepaData.title,
                currentPrice: keepaData.currentPrice,
                originalPrice: keepaData.originalPrice,
                discount,
                salesRank: keepaData.salesRank,
                rating: keepaData.rating,
                reviewCount: keepaData.reviewCount,
                category: keepaData.category,
                imageUrl: keepaData.imageUrl,
                lastPriceCheckAt: new Date(),
                keepaDataTTL: 1440, // Reset to 24h
                updatedAt: new Date()
            },
            create: {
                asin,
                title: keepaData.title,
                currentPrice: keepaData.currentPrice,
                originalPrice: keepaData.originalPrice,
                discount,
                salesRank: keepaData.salesRank,
                rating: keepaData.rating,
                reviewCount: keepaData.reviewCount,
                category: keepaData.category,
                imageUrl: keepaData.imageUrl,
                lastPriceCheckAt: new Date(),
                keepaDataTTL: 1440
            }
        });

        // Increment token usage
        await this.incrementTokenUsage(userId);

        return product;
    }

    /**
     * Fetch product data from Keepa API (REAL IMPLEMENTATION)
     */
    private async fetchFromKeepa(asin: string): Promise<KeepaProduct> {
        // If no API key, return mock data
        if (!this.apiKey || this.apiKey === 'your-keepa-api-key-here') {
            console.log(`Using mock data for ${asin} (no API key set)`);
            return {
                asin,
                title: `Product ${asin}`,
                currentPrice: 19.99,
                originalPrice: 59.99,
                salesRank: 24,
                rating: 4.5,
                reviewCount: 12543,
                category: 'Elettronica',
                imageUrl: `https://via.placeholder.com/200?text=${asin}`
            };
        }

        try {
            const response = await this.retryWithBackoff(async () => {
                return await this.client.get('/product', {
                    params: {
                        key: this.apiKey,
                        domain: this.domain,
                        asin,
                        history: 1,  // Include price history
                        stats: 30,   // Include 30-day stats
                        offers: 20   // Include offers
                    }
                });
            });

            // Keepa returns array of products
            const keepaData = response.data.products?.[0];

            if (!keepaData) {
                throw new Error(`Product ${asin} not found in Keepa`);
            }

            return this.parseKeepaResponse(keepaData);

        } catch (error: any) {
            throw this.handleKeepaError(error, asin);
        }
    }

    /**
     * Parse Keepa JSON response to our KeepaProduct format
     */
    private parseKeepaResponse(keepaData: any): KeepaProduct {
        // Extract latest values from data arrays (with type assertions)
        const latestAmazonPrice = KeepaUtils.getLatestValue(keepaData.data?.NEW) as number | null;
        const latestListPrice = KeepaUtils.getLatestValue(keepaData.data?.LISTPRICE) as number | null;
        const latestRating = KeepaUtils.getLatestValue(keepaData.data?.RATING) as number | null;
        const latestReviews = KeepaUtils.getLatestValue(keepaData.data?.REVIEWS) as number | null;
        const latestSalesRank = KeepaUtils.getLatestValue(keepaData.data?.SALES) as number | null;

        // Use buyBoxPrice as fallback for current price
        const currentPriceCents = latestAmazonPrice || keepaData.buyBoxPrice || 0;
        const listPriceCents = latestListPrice || currentPriceCents;

        return {
            asin: keepaData.asin,
            title: keepaData.title || `Product ${keepaData.asin}`,
            currentPrice: KeepaUtils.centsToEuros(currentPriceCents),
            originalPrice: KeepaUtils.centsToEuros(listPriceCents),
            salesRank: latestSalesRank ?? undefined,
            rating: latestRating ? KeepaUtils.keepaRatingToStars(latestRating) : undefined,
            reviewCount: latestReviews ?? undefined,
            category: KeepaUtils.extractCategoryName(keepaData),
            imageUrl: keepaData.imageUrl || undefined
        };
    }

    /**
     * Handle Keepa-specific errors
     */
    private handleKeepaError(error: any, context: string): Error {
        if (error.response) {
            const status = error.response.status;

            if (status === 429) {
                return new Error(`Keepa rate limit exceeded. Token quota depleted. Context: ${context}`);
            } else if (status === 401) {
                return new Error(`Keepa unauthorized. Invalid API key. Context: ${context}`);
            } else if (status === 400) {
                const msg = error.response.data?.message || 'Invalid parameters';
                return new Error(`Keepa bad request: ${msg}. Context: ${context}`);
            }
        }

        return new Error(`Keepa API error: ${error.message}. Context: ${context}`);
    }

    /**
     * Retry API call with exponential backoff
     */
    private async retryWithBackoff<T>(
        fn: () => Promise<T>,
        attempt: number = 0
    ): Promise<T> {
        try {
            return await fn();
        } catch (error: any) {
            if (attempt >= this.maxRetries - 1) {
                throw error;
            }

            // Don't retry on authentication errors
            if (error.response?.status === 401) {
                throw error;
            }

            const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
            console.log(`Keepa API retry ${attempt + 1}/${this.maxRetries}. Waiting ${waitTime}ms...`);

            await new Promise(resolve => setTimeout(resolve, waitTime));

            return this.retryWithBackoff(fn, attempt + 1);
        }
    }

    /**
     * Search products with advanced filters using Keepa Product Finder
     * Public method to allow external usage
     */
    async productFinder(params: KeepaProductFinderParams): Promise<KeepaProduct[]> {
        // If no API key, return empty array
        if (!this.apiKey || this.apiKey === 'your-keepa-api-key-here') {
            console.log('Product finder: No API key set, returning empty array');
            return [];
        }

        try {
            const response = await this.retryWithBackoff(async () => {
                return await this.client.post('/product', {
                    key: this.apiKey,
                    domain: this.domain,
                    selection: JSON.stringify({
                        ...params,
                        page: params.page || 0,
                        perPage: params.perPage || 50
                    })
                });
            });

            const products = response.data.products || [];

            return products.map((keepaData: any) => this.parseKeepaResponse(keepaData));

        } catch (error: any) {
            throw this.handleKeepaError(error, 'product-finder');
        }
    }

    /**
     * Check if user has remaining tokens for this month
     */
    private async checkMonthlyBudget(userId: string): Promise<boolean> {
        const currentMonth = new Date().toISOString().slice(0, 7); // "2025-11"

        const budget = await prisma.keepaMonthlyBudget.findUnique({
            where: {
                userId_month: {
                    userId,
                    month: currentMonth
                }
            }
        });

        if (!budget) {
            // Create budget for new month
            await prisma.keepaMonthlyBudget.create({
                data: {
                    userId,
                    month: currentMonth,
                    tokensUsed: 0,
                    tokensLimit: 10000,
                    resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                }
            });
            return true;
        }

        return budget.tokensUsed < budget.tokensLimit;
    }

    /**
     * Increment token usage for the current month
     */
    private async incrementTokenUsage(userId: string): Promise<void> {
        const currentMonth = new Date().toISOString().slice(0, 7);

        await prisma.keepaMonthlyBudget.update({
            where: {
                userId_month: {
                    userId,
                    month: currentMonth
                }
            },
            data: {
                tokensUsed: {
                    increment: 1
                }
            }
        });
    }
}
