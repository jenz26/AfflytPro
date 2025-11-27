// ============================================
// KEEPA API TYPES
// ============================================

export interface KeepaResponse {
  tokensLeft: number;
  refillIn: number;
  refillRate: number;
}

export interface KeepaDealsResponse extends KeepaResponse {
  deals: {
    dr: KeepaRawDeal[];
    categoryIds?: number[];
    categoryNames?: string[];
  };
}

export interface KeepaRawDeal {
  asin: string;
  title: string;
  image: number[];        // Array of char codes
  current: number[];      // [price_type, price] - prices in cents
  avg: number[][];        // Average prices [priceType][timeRange]
  delta: number[][];      // Price drops [priceType][timeRange]
  deltaPercent: number[][]; // Discount percentages [priceType][timeRange]
  categories: number[];
  rootCat: number;
  creationDate: number;
  lastUpdate: number;
}

export interface Deal {
  asin: string;
  title: string;
  imageUrl: string;
  currentPrice: number;
  originalPrice: number;
  discountPercent: number;
  discountAbsolute: number;
  category: string;
  categoryId: number;
  rating: number | null;
  reviewCount: number | null;
  isPrime: boolean;
  availabilityType: string;
  dealEndDate: Date | null;
  fetchedAt: Date;
}

// ============================================
// QUEUE TYPES
// ============================================

export type UserPlan = 'free' | 'starter' | 'pro' | 'business';
export type JobType = 'deal_search' | 'product_refresh';
export type CacheStatus = 'fresh' | 'stale' | 'expired' | 'missing';

export interface AutomationFilters {
  minDiscount?: number;
  maxPrice?: number;
  minRating?: number;
  minReviews?: number;
  excludeKeywords?: string[];
  primeOnly?: boolean;
  categories?: string[];
}

export interface WaitingAutomation {
  automationId: string;
  userId: string;
  userPlan: UserPlan;
  filters: AutomationFilters;
  triggersAt: Date;
}

export interface QueueJob {
  id: string;
  type: JobType;
  category: string;
  asins?: string[];
  tokenCost: number;
  createdAt: Date;
  waitingAutomations: WaitingAutomation[];
  isPrefetch: boolean;
  priority: number;
}

export interface CachedCategory {
  deals: Deal[];
  updatedAt: number;
  ttl: number;
  source: 'automation' | 'prefetch';
}

// ============================================
// CONFIG TYPES
// ============================================

export interface KeepaQueueConfig {
  // Token
  TOKENS_PER_MINUTE: number;
  DEAL_API_COST: number;
  PRODUCT_API_COST: number;

  // Cache
  CACHE_TTL_MS: number;
  CACHE_FRESH_THRESHOLD_MS: number;
  CACHE_STALE_THRESHOLD_MS: number;

  // Prefetch
  PREFETCH_LOOKAHEAD_MINUTES: number;
  PREFETCH_PRIORITY: number;
  MAX_PREFETCH_PER_TICK: number;

  // Worker
  WORKER_TICK_MS: number;
}

export const DEFAULT_CONFIG: KeepaQueueConfig = {
  TOKENS_PER_MINUTE: 20,
  DEAL_API_COST: 5,
  PRODUCT_API_COST: 1,

  CACHE_TTL_MS: 60 * 60 * 1000,              // 1 ora
  CACHE_FRESH_THRESHOLD_MS: 30 * 60 * 1000,  // 30 min
  CACHE_STALE_THRESHOLD_MS: 60 * 60 * 1000,  // 1 ora

  PREFETCH_LOOKAHEAD_MINUTES: 30,
  PREFETCH_PRIORITY: 100,
  MAX_PREFETCH_PER_TICK: 1,

  WORKER_TICK_MS: 3000
};

// ============================================
// METRICS TYPES
// ============================================

export interface QueueMetrics {
  queueDepth: number;
  oldestJobAge: number;
  avgWaitTime: number;
  jobsByPriority: {
    urgent: number;
    normal: number;
    low: number;
    prefetch: number;
  };
}

export interface CacheMetrics {
  totalCategories: number;
  freshCategories: number;
  staleCategories: number;
  hitRate: number;
  avgAge: number;
}

export interface TokenMetrics {
  available: number;
  usedToday: number;
  utilizationRate: number;
}

export interface RealtimeMetrics {
  tokensAvailable: number;
  tokensUsedLastHour: number;
  utilizationRate: number;
  queueDepth: number;
  oldestJobAge: number;
  jobsProcessedLastHour: number;
  cacheHitRate: number;
  categoriesCached: number;
  avgCacheAge: number;
}
