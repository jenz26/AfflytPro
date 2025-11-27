import type Redis from 'ioredis';
import type {
  Deal,
  CachedCategory,
  CacheStatus,
  CacheMetrics,
  KeepaQueueConfig,
  AutomationFilters
} from '../../types/keepa';

export class KeepaCache {
  private redis: Redis;
  private config: KeepaQueueConfig;

  constructor(redis: Redis, config: KeepaQueueConfig) {
    this.redis = redis;
    this.config = config;
  }

  // ============================================
  // READ
  // ============================================

  async checkStatus(category: string): Promise<{
    status: CacheStatus;
    data: CachedCategory | null;
  }> {
    const cached = await this.redis.hgetall(`keepa:cache:${category}`);

    if (!cached || !cached.deals) {
      await this.redis.hincrby('keepa:stats', 'cache_misses', 1);
      return { status: 'missing', data: null };
    }

    const data: CachedCategory = {
      deals: JSON.parse(cached.deals),
      updatedAt: parseInt(cached.updatedAt),
      ttl: parseInt(cached.ttl),
      source: cached.source as 'automation' | 'prefetch'
    };

    const age = Date.now() - data.updatedAt;

    await this.redis.hincrby('keepa:stats', 'cache_hits', 1);

    if (age < this.config.CACHE_FRESH_THRESHOLD_MS) {
      return { status: 'fresh', data };
    }

    if (age < this.config.CACHE_STALE_THRESHOLD_MS) {
      return { status: 'stale', data };
    }

    return { status: 'expired', data };
  }

  async get(category: string): Promise<Deal[] | null> {
    const { status, data } = await this.checkStatus(category);

    if (status === 'missing') {
      return null;
    }

    return data!.deals;
  }

  async isFresh(category: string): Promise<boolean> {
    const { status } = await this.checkStatus(category);
    return status === 'fresh';
  }

  // ============================================
  // WRITE
  // ============================================

  async save(
    category: string,
    deals: Deal[],
    source: 'automation' | 'prefetch'
  ): Promise<void> {
    const now = Date.now();

    await this.redis.hset(`keepa:cache:${category}`, {
      deals: JSON.stringify(deals),
      updatedAt: now.toString(),
      ttl: this.config.CACHE_TTL_MS.toString(),
      source
    });

    // TTL Redis per auto-cleanup
    const expireSeconds = Math.ceil(this.config.CACHE_TTL_MS * 2 / 1000);
    await this.redis.expire(`keepa:cache:${category}`, expireSeconds);

    await this.redis.hincrby('keepa:stats', 'cache_writes', 1);

    console.log(`[Cache] Saved ${deals.length} deals for ${category}`);
  }

  // ============================================
  // INVALIDATE
  // ============================================

  async invalidate(category: string): Promise<void> {
    await this.redis.del(`keepa:cache:${category}`);
    await this.redis.del(`keepa:pending:${category}`);
  }

  async invalidateAll(): Promise<void> {
    const keys = await this.redis.keys('keepa:cache:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // ============================================
  // FILTERS
  // ============================================

  applyFilters(deals: Deal[], filters: AutomationFilters): Deal[] {
    return deals.filter(deal => {
      // Sconto minimo
      if (filters.minDiscount && deal.discountPercent < filters.minDiscount) {
        return false;
      }

      // Prezzo massimo
      if (filters.maxPrice && deal.currentPrice > filters.maxPrice) {
        return false;
      }

      // Rating minimo
      if (filters.minRating && deal.rating && deal.rating < filters.minRating) {
        return false;
      }

      // Recensioni minime
      if (filters.minReviews && deal.reviewCount && deal.reviewCount < filters.minReviews) {
        return false;
      }

      // Keyword escluse
      if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
        const titleLower = deal.title.toLowerCase();
        for (const keyword of filters.excludeKeywords) {
          if (titleLower.includes(keyword.toLowerCase())) {
            return false;
          }
        }
      }

      // Solo Prime
      if (filters.primeOnly && !deal.isPrime) {
        return false;
      }

      // Categorie specifiche
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(deal.category)) {
          return false;
        }
      }

      return true;
    });
  }

  selectBest(deals: Deal[], limit: number = 5): Deal[] {
    // Ordina per sconto decrescente
    const sorted = [...deals].sort((a, b) =>
      b.discountPercent - a.discountPercent
    );

    return sorted.slice(0, limit);
  }

  // ============================================
  // METRICS
  // ============================================

  async getMetrics(): Promise<CacheMetrics> {
    const keys = await this.redis.keys('keepa:cache:*');

    let fresh = 0;
    let stale = 0;
    let totalAge = 0;

    const now = Date.now();

    for (const key of keys) {
      const updatedAt = await this.redis.hget(key, 'updatedAt');
      if (updatedAt) {
        const age = now - parseInt(updatedAt);
        totalAge += age;

        if (age < this.config.CACHE_FRESH_THRESHOLD_MS) {
          fresh++;
        } else {
          stale++;
        }
      }
    }

    const stats = await this.redis.hgetall('keepa:stats');
    const hits = parseInt(stats?.cache_hits || '0');
    const misses = parseInt(stats?.cache_misses || '0');

    return {
      totalCategories: keys.length,
      freshCategories: fresh,
      staleCategories: stale,
      hitRate: hits + misses > 0 ? hits / (hits + misses) : 0,
      avgAge: keys.length > 0 ? (totalAge / keys.length) / 1000 : 0
    };
  }
}
