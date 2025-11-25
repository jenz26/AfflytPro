/**
 * ProductCacheService - Intelligent Caching with Amazon Compliance
 *
 * Manages product data caching from Keepa API with automatic
 * freshness checking and compliance-aware TTL strategies.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProductSearchResult {
  asin: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  discount: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  category: string;
  salesRank?: number;
  isCached: boolean;
  cacheAge: number; // minutes
  lastChecked: Date;
}

export interface CacheConfig {
  // TTL strategies (in minutes)
  dealAlerts: number;      // 15-60 min for hot deals
  highTraffic: number;     // 1-4 hours for popular products
  mediumTraffic: number;   // 6-12 hours
  lowTraffic: number;      // 24 hours (max allowed by Amazon)

  // Thresholds
  highTrafficThreshold: number;  // clicks per day
  mediumTrafficThreshold: number;
}

// Default Amazon-compliant configuration
const DEFAULT_CONFIG: CacheConfig = {
  dealAlerts: 30,           // 30 minutes for deals
  highTraffic: 240,         // 4 hours
  mediumTraffic: 720,       // 12 hours
  lowTraffic: 1440,         // 24 hours (Amazon max)
  highTrafficThreshold: 100,
  mediumTrafficThreshold: 20,
};

export class ProductCacheService {
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get product with intelligent cache strategy
   */
  async getProduct(asin: string, options?: {
    forceRefresh?: boolean;
    isDealAlert?: boolean;
  }): Promise<ProductSearchResult | null> {
    // 1. Try to get from cache
    const cachedProduct = await prisma.product.findUnique({
      where: { asin },
      include: {
        affiliateLinks: {
          select: { clicks: true }
        }
      }
    });

    // 2. Check if cache is fresh
    if (cachedProduct && !options?.forceRefresh) {
      const cacheAge = this.getCacheAge(cachedProduct.lastPriceCheckAt);
      const ttl = this.calculateTTL(cachedProduct, options?.isDealAlert);

      if (cacheAge < ttl) {
        console.log(`✅ Cache HIT for ${asin} (age: ${cacheAge}min, TTL: ${ttl}min)`);

        return {
          asin: cachedProduct.asin,
          title: cachedProduct.title,
          currentPrice: cachedProduct.currentPrice,
          originalPrice: cachedProduct.originalPrice,
          discount: cachedProduct.discount,
          rating: cachedProduct.rating || undefined,
          reviewCount: cachedProduct.reviewCount || undefined,
          imageUrl: cachedProduct.imageUrl || undefined,
          category: cachedProduct.category,
          salesRank: cachedProduct.salesRank || undefined,
          isCached: true,
          cacheAge,
          lastChecked: cachedProduct.lastPriceCheckAt,
        };
      }
    }

    // 3. Cache miss or expired - fetch fresh data
    console.log(`❌ Cache MISS for ${asin} - fetching from Keepa...`);
    return null; // Caller should fetch from Keepa and update cache
  }

  /**
   * Update cache with fresh Keepa data
   */
  async updateProduct(asin: string, keepaData: {
    title: string;
    currentPrice: number;
    originalPrice: number;
    category: string;
    imageUrl?: string;
    rating?: number;
    reviewCount?: number;
    salesRank?: number;
    brandId?: string;
  }): Promise<ProductSearchResult> {
    const discount = Math.round(
      ((keepaData.originalPrice - keepaData.currentPrice) / keepaData.originalPrice) * 100
    );

    const product = await prisma.product.upsert({
      where: { asin },
      update: {
        title: keepaData.title,
        currentPrice: keepaData.currentPrice,
        originalPrice: keepaData.originalPrice,
        discount,
        category: keepaData.category,
        imageUrl: keepaData.imageUrl,
        rating: keepaData.rating,
        reviewCount: keepaData.reviewCount,
        salesRank: keepaData.salesRank,
        lastPriceCheckAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        asin,
        title: keepaData.title,
        currentPrice: keepaData.currentPrice,
        originalPrice: keepaData.originalPrice,
        discount,
        category: keepaData.category,
        imageUrl: keepaData.imageUrl,
        rating: keepaData.rating,
        reviewCount: keepaData.reviewCount,
        salesRank: keepaData.salesRank,
        brandId: keepaData.brandId,
        keepaDataTTL: this.config.lowTraffic, // Start with lowest traffic assumption
        lastPriceCheckAt: new Date(),
      },
    });

    console.log(`✅ Cache UPDATED for ${asin}`);

    return {
      asin: product.asin,
      title: product.title,
      currentPrice: product.currentPrice,
      originalPrice: product.originalPrice,
      discount: product.discount,
      rating: product.rating || undefined,
      reviewCount: product.reviewCount || undefined,
      imageUrl: product.imageUrl || undefined,
      category: product.category,
      salesRank: product.salesRank || undefined,
      isCached: false,
      cacheAge: 0,
      lastChecked: product.lastPriceCheckAt,
    };
  }

  /**
   * Batch get products (for search results)
   */
  async getProducts(asins: string[], options?: {
    isDealAlert?: boolean;
  }): Promise<{
    cached: ProductSearchResult[];
    toFetch: string[];
  }> {
    const cached: ProductSearchResult[] = [];
    const toFetch: string[] = [];

    for (const asin of asins) {
      const product = await this.getProduct(asin, options);
      if (product) {
        cached.push(product);
      } else {
        toFetch.push(asin);
      }
    }

    return { cached, toFetch };
  }

  /**
   * Calculate dynamic TTL based on traffic and context
   */
  private calculateTTL(product: any, isDealAlert?: boolean): number {
    // Deal alerts need fresh data
    if (isDealAlert) {
      return this.config.dealAlerts;
    }

    // Calculate traffic (clicks per day)
    const totalClicks = product.affiliateLinks.reduce(
      (sum: number, link: any) => sum + link.clicks,
      0
    );

    // High traffic = shorter TTL (more frequent updates)
    if (totalClicks >= this.config.highTrafficThreshold) {
      return this.config.highTraffic;
    }

    // Medium traffic
    if (totalClicks >= this.config.mediumTrafficThreshold) {
      return this.config.mediumTraffic;
    }

    // Low traffic = longer TTL (save API calls)
    return this.config.lowTraffic;
  }

  /**
   * Get cache age in minutes
   */
  private getCacheAge(lastCheck: Date): number {
    return Math.floor((Date.now() - lastCheck.getTime()) / 60000);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalProducts: number;
    fresh: number;
    stale: number;
    averageAge: number;
    hitRate?: number;
  }> {
    const products = await prisma.product.findMany({
      select: {
        lastPriceCheckAt: true,
        affiliateLinks: {
          select: { clicks: true }
        }
      }
    });

    let fresh = 0;
    let stale = 0;
    let totalAge = 0;

    products.forEach(product => {
      const age = this.getCacheAge(product.lastPriceCheckAt);
      const ttl = this.calculateTTL(product);

      totalAge += age;

      if (age < ttl) {
        fresh++;
      } else {
        stale++;
      }
    });

    return {
      totalProducts: products.length,
      fresh,
      stale,
      averageAge: products.length > 0 ? Math.round(totalAge / products.length) : 0,
    };
  }

  /**
   * Cleanup old products (optional maintenance)
   */
  async cleanupOldProducts(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await prisma.product.deleteMany({
      where: {
        lastPriceCheckAt: {
          lt: cutoffDate
        },
        affiliateLinks: {
          none: {} // Only delete if no affiliate links exist
        }
      }
    });

    console.log(`🧹 Cleaned up ${result.count} old products`);
    return result.count;
  }

  /**
   * Force refresh stale products (background job)
   */
  async refreshStaleProducts(limit: number = 10): Promise<string[]> {
    const staleProducts = await prisma.product.findMany({
      where: {
        lastPriceCheckAt: {
          lt: new Date(Date.now() - this.config.lowTraffic * 60 * 1000)
        }
      },
      take: limit,
      orderBy: {
        lastPriceCheckAt: 'asc' // Oldest first
      },
      select: {
        asin: true
      }
    });

    return staleProducts.map(p => p.asin);
  }
}

// Example usage:
/*
const cacheService = new ProductCacheService();

// 1. Try to get from cache
const product = await cacheService.getProduct('B08N5WRWNW');

if (!product) {
  // 2. Cache miss - fetch from Keepa
  const keepaData = await keepaApi.getProduct('B08N5WRWNW');

  // 3. Update cache
  const freshProduct = await cacheService.updateProduct('B08N5WRWNW', keepaData);
}

// 4. For deal alerts (shorter TTL)
const dealProduct = await cacheService.getProduct('B08N5WRWNW', {
  isDealAlert: true
});
*/
