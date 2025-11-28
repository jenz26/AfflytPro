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

// Keepa Domain IDs (from documentation)
const KEEPA_DOMAIN_IDS: Record<string, number> = {
    'com': 1,
    'co.uk': 2,
    'de': 3,
    'fr': 4,
    'co.jp': 5,
    'ca': 6,
    'it': 8,
    'es': 9,
    'in': 10,
    'com.mx': 11,
    'com.br': 12
};

// Price Type indices for csv field
const PRICE_TYPES = {
    AMAZON: 0,
    NEW: 1,
    USED: 2,
    SALES: 3,
    LISTPRICE: 4,
    COLLECTIBLE: 5,
    REFURBISHED: 6,
    NEW_FBM_SHIPPING: 7,
    LIGHTNING_DEAL: 8,
    WAREHOUSE: 9,
    NEW_FBA: 10,
    COUNT_NEW: 11,
    COUNT_USED: 12,
    COUNT_REFURBISHED: 13,
    COUNT_COLLECTIBLE: 14,
    EXTRA_INFO_UPDATES: 15,
    RATING: 16,
    COUNT_REVIEWS: 17,
    BUY_BOX_SHIPPING: 18
};

export class KeepaEngine {
    private client: AxiosInstance;
    private apiKey: string;
    private domainId: number;
    private maxRetries: number;
    private refreshQueue: Set<string> = new Set();
    private isProcessingQueue = false;

    constructor() {
        this.apiKey = process.env.KEEPA_API_KEY || '';
        const domainCode = process.env.KEEPA_DOMAIN || 'it';
        this.domainId = KEEPA_DOMAIN_IDS[domainCode.toLowerCase()] || 8; // Default to Italy
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
                        domain: this.domainId, // Use numeric domain ID (8 for Italy)
                        asin,
                        stats: 30,   // Include 30-day stats (provides current prices, averages, etc.)
                        rating: 1,   // Include rating and review count history (1 token extra if fresh)
                        buybox: 1    // Include Buy Box data: buyBoxPrice, buyBoxSavingBasis, buyBoxSavingPercentage (2 tokens extra)
                        // Note: 'offers' parameter costs 6 tokens per page - skip for basic verification
                        // Total cost: 1 (base) + 1 (rating) + 2 (buybox) = 4 tokens per product
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
     *
     * PRIORITY ORDER for prices (to match what Amazon shows):
     * 1. Buy Box data (buyBoxPrice, buyBoxSavingBasis) - most accurate, what customer sees
     * 2. stats.current[] array using Price Type indexing
     * 3. csv array as last fallback
     *
     * Price Type indices for stats.current[]:
     * 0=AMAZON, 1=NEW, 3=SALES, 4=LISTPRICE, 16=RATING, 17=COUNT_REVIEWS, 18=BUY_BOX_SHIPPING
     */
    private parseKeepaResponse(keepaData: any): KeepaProduct {
        const stats = keepaData.stats;

        let currentPriceCents = -1;
        let originalPriceCents = -1;
        let salesRank: number | undefined;
        let rating: number | undefined;
        let reviewCount: number | undefined;

        if (stats) {
            // PRIORITY 1: Use Buy Box data if available (most accurate - what Amazon actually shows)
            // buyBoxPrice and buyBoxSavingBasis are only available when buybox=1 parameter is used
            if (stats.buyBoxPrice && stats.buyBoxPrice > 0) {
                currentPriceCents = stats.buyBoxPrice;

                // buyBoxSavingBasis is the strikethrough price shown on Amazon
                if (stats.buyBoxSavingBasis && stats.buyBoxSavingBasis > 0) {
                    originalPriceCents = stats.buyBoxSavingBasis;
                }

                console.log(`[Keepa] ${keepaData.asin}: Using BuyBox price ${currentPriceCents}c, strikethrough ${originalPriceCents}c`);
            }

            // PRIORITY 2: Fall back to stats.current[] if no buybox data
            if (currentPriceCents <= 0 && stats.current) {
                // Try Amazon price first, then New marketplace
                currentPriceCents = stats.current[PRICE_TYPES.AMAZON];
                if (currentPriceCents <= 0) {
                    currentPriceCents = stats.current[PRICE_TYPES.NEW];
                }

                // Get list price for original price
                if (originalPriceCents <= 0) {
                    originalPriceCents = stats.current[PRICE_TYPES.LISTPRICE];
                }

                console.log(`[Keepa] ${keepaData.asin}: Using stats.current price ${currentPriceCents}c, listprice ${originalPriceCents}c`);
            }

            // If no original price yet, use 30-day average as reference
            if (originalPriceCents <= 0 && stats.avg30) {
                originalPriceCents = stats.avg30[PRICE_TYPES.AMAZON] || stats.avg30[PRICE_TYPES.NEW];
            }

            // Get sales rank
            if (stats.current) {
                const rankValue = stats.current[PRICE_TYPES.SALES];
                salesRank = rankValue > 0 ? rankValue : undefined;

                // Get rating (0-50 scale in Keepa, we convert to 0-5)
                const ratingValue = stats.current[PRICE_TYPES.RATING];
                rating = ratingValue > 0 ? ratingValue / 10 : undefined;

                // Get review count
                const reviewValue = stats.current[PRICE_TYPES.COUNT_REVIEWS];
                reviewCount = reviewValue > 0 ? reviewValue : undefined;
            }
        }

        // PRIORITY 3: Fallback to csv array if stats not available
        if (currentPriceCents <= 0 && keepaData.csv) {
            const amazonPrices = keepaData.csv[PRICE_TYPES.AMAZON];
            const newPrices = keepaData.csv[PRICE_TYPES.NEW];

            // csv format: [keepaTime, value, keepaTime, value, ...]
            // Get last value (most recent)
            if (amazonPrices && amazonPrices.length >= 2) {
                currentPriceCents = amazonPrices[amazonPrices.length - 1];
            } else if (newPrices && newPrices.length >= 2) {
                currentPriceCents = newPrices[newPrices.length - 1];
            }

            if (originalPriceCents <= 0) {
                const listPrices = keepaData.csv[PRICE_TYPES.LISTPRICE];
                if (listPrices && listPrices.length >= 2) {
                    originalPriceCents = listPrices[listPrices.length - 1];
                }
            }

            console.log(`[Keepa] ${keepaData.asin}: Using csv fallback price ${currentPriceCents}c`);
        }

        // If still no original price, use current price (no discount shown)
        if (originalPriceCents <= 0) {
            originalPriceCents = currentPriceCents;
        }

        // Build image URL from images array
        let imageUrl: string | undefined;
        if (keepaData.images && keepaData.images.length > 0) {
            const firstImage = keepaData.images[0];
            const imageName = firstImage.l || firstImage.m;
            if (imageName) {
                imageUrl = `https://m.media-amazon.com/images/I/${imageName}`;
            }
        }

        return {
            asin: keepaData.asin,
            title: keepaData.title || `Product ${keepaData.asin}`,
            currentPrice: currentPriceCents > 0 ? KeepaUtils.centsToEuros(currentPriceCents) : 0,
            originalPrice: originalPriceCents > 0 ? KeepaUtils.centsToEuros(originalPriceCents) : 0,
            salesRank,
            rating,
            reviewCount,
            category: KeepaUtils.extractCategoryName(keepaData),
            imageUrl
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
            // Product Finder returns only ASINs, not full product objects
            // Token cost: 10 + 1 per 100 ASINs
            const response = await this.retryWithBackoff(async () => {
                return await this.client.get('/query', {
                    params: {
                        key: this.apiKey,
                        domain: this.domainId,
                        selection: JSON.stringify({
                            ...params,
                            page: params.page || 0,
                            perPage: params.perPage || 50
                        })
                    }
                });
            });

            // Response contains { asinList: string[], totalResults: number }
            const asinList = response.data.asinList || [];

            // If we need full product data, we'd have to call /product for each ASIN
            // For now, return basic structure with just ASINs
            // The caller should use checkAndRefresh() to get full data
            return asinList.map((asin: string) => ({
                asin,
                title: '',
                currentPrice: 0,
                originalPrice: 0,
                category: ''
            } as KeepaProduct));

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
