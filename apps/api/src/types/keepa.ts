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

/**
 * Keepa Product API response product object
 */
export interface KeepaProduct {
  asin: string;
  title: string;
  imagesCSV?: string;
  categories: number[];
  rootCategory: number;

  // BuyBox data (when buybox=1 is requested)
  buyBoxSellerIdHistory?: string;
  buyBoxIsFBA?: boolean;
  buyBoxIsAmazon?: boolean;
  buyBoxPrice?: number;           // Current BuyBox price in cents
  buyBoxShipping?: number;        // BuyBox shipping cost

  // Stats contains current prices and historical data
  stats?: {
    current: number[];            // Index 0=Amazon, 1=New, 2=Used, 18=BuyBox
    avg: number[][];
    avg30: number[];
    avg90: number[];
    avg180: number[];
    atIntervalStart: number[];
    min: number[][];
    max: number[][];
    buyBoxSeller?: string;
    buyBoxPrice?: number;
    buyBoxShipping?: number;
    buyBoxIsFBA?: boolean;
    buyBoxIsAmazon?: boolean;
    buyBoxAvgPrice?: number;
    buyBoxAvgSellingPrice?: number;
    listPrice?: number;            // Prezzo di listino (prezzo barrato)
    salesRankCurrent?: number;
    salesRankAvg30?: number;
    salesRankAvg90?: number;
    // Savings basis for visible discount
    buyBoxSavingBasis?: number;    // Il prezzo su cui è calcolato lo sconto (in cents)
  };

  // Product info
  brand?: string;
  manufacturer?: string;
  productGroup?: string;

  // Ratings
  csv?: number[][];               // Price history arrays
  salesRanks?: Record<number, number[][]>;
  rating?: number;                // 0-50 scale
  reviewCount?: number;

  // Offers
  offers?: KeepaOffer[];
  liveOffers?: KeepaOffer[];

  // Additional
  lastUpdate?: number;
  fbaFees?: {
    pickAndPackFee?: number;
  };
}

export interface KeepaOffer {
  sellerId: string;
  sellerName?: string;
  isPrime: boolean;
  isFBA: boolean;
  isAmazon: boolean;
  isScam?: boolean;
  condition: number;
  conditionComment?: string;
  offerCSV?: number[];
  shipping?: number;
  primeExcl?: boolean;
}

export interface KeepaProductsResponse extends KeepaResponse {
  products: KeepaProduct[];
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

  // V2 additions for BuyBox verification
  buyBoxPrice?: number;           // Verified BuyBox price
  buyBoxSavingBasis?: number;     // Price used for discount calculation (listPrice)
  isVerified?: boolean;           // Verified via Product API
  priceType?: 'amazon' | 'buybox' | 'new';  // Source of the price
  hasVisibleDiscount?: boolean;   // Has strikethrough price on Amazon
  isHistoricalLow?: boolean;      // Is at historical low price
}

/**
 * Extended Deal with scoring and publishing metadata
 */
export interface ScoredDeal extends Deal {
  score: number;                  // 0-100 deal score
  scoreComponents?: {
    discount: number;
    price: number;
    rating: number;
    popularity: number;
    timing: number;
  };
}

// ============================================
// QUEUE TYPES V2
// ============================================

export type UserPlan = 'free' | 'starter' | 'pro' | 'business';
export type JobType = 'deal_search' | 'product_refresh';
export type CacheStatus = 'fresh' | 'stale' | 'expired' | 'missing';
export type DealPublishMode = 'DISCOUNTED_ONLY' | 'LOWEST_PRICE' | 'BOTH';

/**
 * AutomationRule filters mapped to Keepa Deal API parameters
 */
export interface AutomationFilters {
  // Basic (FREE tier)
  categories?: string[];           // Category IDs
  minScore?: number;               // Minimum deal score (0-100)

  // Advanced (PRO tier)
  minDiscount?: number;            // Min discount %
  minPrice?: number;               // Min price EUR
  maxPrice?: number;               // Max price EUR
  minRating?: number;              // Min rating (0-500 scale)
  minReviews?: number;             // Min review count
  maxSalesRank?: number;           // Max sales rank

  // Premium (BUSINESS tier)
  amazonOnly?: boolean;            // Only Amazon as seller
  fbaOnly?: boolean;               // Only FBA offers
  hasCoupon?: boolean;             // Only with coupon
  primeOnly?: boolean;             // Only Prime eligible
  brandInclude?: string[];         // Include brands
  brandExclude?: string[];         // Exclude brands
  excludeKeywords?: string[];      // Keywords to exclude
  listedAfter?: Date;              // Only products listed after date
}

/**
 * Union filters: merged from multiple AutomationRules for the same category
 * Uses the most permissive values to maximize cache efficiency
 */
export interface UnionFilters {
  categories: string[];
  minDiscount: number;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  maxSalesRank: number;
}

/**
 * Waiting rule attached to a queue job
 */
export interface WaitingRule {
  ruleId: string;
  userId: string;
  userPlan: UserPlan;
  channelId: string | null;
  channelAmazonTag?: string;       // Tag from channel
  filters: AutomationFilters;
  dealsPerRun: number;
  minScore: number;
  dealPublishMode: DealPublishMode;
  includeKeepaChart: boolean;
  templateId?: string;
  triggersAt: Date;
}

// Keep backward compatibility
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
  categoryId: number;              // Keepa category ID
  asins?: string[];
  tokenCost: number;
  createdAt: Date;
  unionFilters: UnionFilters;      // Merged filters for Keepa API call
  waitingRules: WaitingRule[];     // V2: rules instead of automations
  waitingAutomations?: WaitingAutomation[];  // Deprecated, for backward compat
  isPrefetch: boolean;
  priority: number;
}

export interface CachedCategory {
  deals: Deal[];
  updatedAt: number;
  ttl: number;
  source: 'automation' | 'prefetch';
  unionFilters?: UnionFilters;     // Filters used for this cache entry
}

// ============================================
// CONFIG TYPES
// ============================================

export interface KeepaQueueConfig {
  // Token
  TOKENS_PER_MINUTE: number;
  DEAL_API_COST: number;           // Cost per priceType
  PRODUCT_API_COST: number;        // Cost per ASIN

  // Multi-price fetch
  PRICE_TYPES: number[];           // [18, 0, 1] = BuyBox, Amazon, New
  VERIFY_TOP_N_DEALS: number;      // How many deals to verify with Product API

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
  DEAL_API_COST: 5,                // 5 tokens per 150 deals (per priceType)
  PRODUCT_API_COST: 1,             // 1 token per ASIN (official Keepa docs)

  // Optimized for 20 tokens/minute plan:
  // - Single priceType = 5 tokens
  // - Verify 10 deals = 10 tokens
  // - Total: ~15 tokens per job (fits in 20/min budget)
  PRICE_TYPES: [18],               // BuyBox(18) only - most relevant for deals
  VERIFY_TOP_N_DEALS: 10,          // Verify top 10 deals with Product API

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

// ============================================
// TAG RESOLUTION
// ============================================

/**
 * Priority for Amazon tag resolution:
 * 1. Rule override (if set)
 * 2. Channel tag (if set)
 * 3. User default tag
 */
export interface TagResolution {
  ruleOverride?: string;
  channelTag?: string;
  userDefault: string;
}

export function resolveAmazonTag(resolution: TagResolution): string {
  return resolution.ruleOverride || resolution.channelTag || resolution.userDefault;
}
