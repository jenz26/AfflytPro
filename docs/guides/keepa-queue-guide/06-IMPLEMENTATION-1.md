# Afflyt Pro - Implementazione TypeScript

## Struttura File

```
apps/api/src/
├── services/
│   ├── keepa/
│   │   ├── KeepaClient.ts         // Client API Keepa
│   │   ├── KeepaTokenManager.ts   // Gestione token
│   │   ├── KeepaQueue.ts          // Sistema coda
│   │   ├── KeepaCache.ts          // Sistema cache
│   │   └── KeepaPrefetch.ts       // Pre-fetch intelligente
│   └── automation/
│       └── AutomationScheduler.ts // Cron automazioni
├── workers/
│   └── keepaWorker.ts             // Worker loop principale
├── types/
│   └── keepa.ts                   // Type definitions
└── lib/
    └── redis.ts                   // Redis client singleton
```

---

## Types (types/keepa.ts)

```typescript
// ============================================
// KEEPA TYPES
// ============================================

export interface KeepaResponse {
  tokensLeft: number
  refillIn: number
  refillRate: number
}

export interface KeepaDealsResponse extends KeepaResponse {
  deals: KeepaRawDeal[]
}

export interface KeepaRawDeal {
  asin: string
  title: string
  image: string
  current: number[]      // [price_type, price]
  delta: number[]        // [delta_percent, delta_absolute]
  categories: number[]
  rating: number
  totalReviews: number
  isPrime: boolean
  availabilityType: number
  dealEndTime?: number
}

export interface Deal {
  asin: string
  title: string
  imageUrl: string
  currentPrice: number
  originalPrice: number
  discountPercent: number
  discountAbsolute: number
  category: string
  categoryId: number
  rating: number | null
  reviewCount: number | null
  isPrime: boolean
  availabilityType: string
  dealEndDate: Date | null
  fetchedAt: Date
}

// ============================================
// QUEUE TYPES
// ============================================

export type UserPlan = 'free' | 'starter' | 'pro' | 'business'
export type JobType = 'deal_search' | 'product_refresh'
export type CacheStatus = 'fresh' | 'stale' | 'expired' | 'missing'

export interface AutomationFilters {
  minDiscount?: number
  maxPrice?: number
  minRating?: number
  minReviews?: number
  excludeKeywords?: string[]
  primeOnly?: boolean
}

export interface WaitingAutomation {
  automationId: string
  userId: string
  userPlan: UserPlan
  filters: AutomationFilters
  triggersAt: Date
}

export interface QueueJob {
  id: string
  type: JobType
  category: string
  asins?: string[]
  tokenCost: number
  createdAt: Date
  waitingAutomations: WaitingAutomation[]
  isPrefetch: boolean
  priority: number
}

export interface CachedCategory {
  deals: Deal[]
  updatedAt: number
  ttl: number
  source: 'automation' | 'prefetch'
}

// ============================================
// CONFIG TYPES
// ============================================

export interface KeepaQueueConfig {
  // Token
  TOKENS_PER_MINUTE: number
  DEAL_API_COST: number
  PRODUCT_API_COST: number
  
  // Cache
  CACHE_TTL_MS: number
  CACHE_FRESH_THRESHOLD_MS: number
  CACHE_STALE_THRESHOLD_MS: number
  
  // Prefetch
  PREFETCH_LOOKAHEAD_MINUTES: number
  PREFETCH_PRIORITY: number
  MAX_PREFETCH_PER_TICK: number
  
  // Worker
  WORKER_TICK_MS: number
}

export const DEFAULT_CONFIG: KeepaQueueConfig = {
  TOKENS_PER_MINUTE: 20,
  DEAL_API_COST: 5,
  PRODUCT_API_COST: 1,
  
  CACHE_TTL_MS: 60 * 60 * 1000,           // 1 ora
  CACHE_FRESH_THRESHOLD_MS: 30 * 60 * 1000, // 30 min
  CACHE_STALE_THRESHOLD_MS: 60 * 60 * 1000, // 1 ora
  
  PREFETCH_LOOKAHEAD_MINUTES: 30,
  PREFETCH_PRIORITY: 100,
  MAX_PREFETCH_PER_TICK: 1,
  
  WORKER_TICK_MS: 3000
}

// ============================================
// METRICS TYPES
// ============================================

export interface QueueMetrics {
  queueDepth: number
  oldestJobAge: number
  avgWaitTime: number
  jobsByPriority: {
    urgent: number
    normal: number
    low: number
    prefetch: number
  }
}

export interface CacheMetrics {
  totalCategories: number
  freshCategories: number
  staleCategories: number
  hitRate: number
  avgAge: number
}

export interface TokenMetrics {
  available: number
  usedToday: number
  utilizationRate: number
}
```

---

## Redis Client (lib/redis.ts)

```typescript
import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true
    })
    
    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err)
    })
    
    redis.on('connect', () => {
      console.log('[Redis] Connected')
    })
  }
  
  return redis
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
  }
}
```

---

## Keepa Client (services/keepa/KeepaClient.ts)

```typescript
import type { 
  KeepaDealsResponse, 
  KeepaRawDeal, 
  Deal,
  KeepaQueueConfig 
} from '../../types/keepa'

const KEEPA_API_BASE = 'https://api.keepa.com'

export class KeepaClient {
  private apiKey: string
  private config: KeepaQueueConfig
  
  constructor(apiKey: string, config: KeepaQueueConfig) {
    this.apiKey = apiKey
    this.config = config
  }
  
  async fetchDeals(categoryId: number, domain: number = 8): Promise<{
    deals: Deal[]
    tokensLeft: number
    refillIn: number
  }> {
    const url = new URL(`${KEEPA_API_BASE}/deal`)
    url.searchParams.set('key', this.apiKey)
    url.searchParams.set('domain', domain.toString())  // 8 = Italy
    url.searchParams.set('selection', JSON.stringify({
      includeCategories: [categoryId],
      priceTypes: [0, 1, 2],  // Amazon, New, Used
      deltaPercentRange: [20, 100],  // Min 20% sconto
      isRangeEnabled: true,
      dateRange: [0, 0]  // Solo deal attivi
    }))
    
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`Keepa API error: ${response.status}`)
    }
    
    const data: KeepaDealsResponse = await response.json()
    
    return {
      deals: data.deals.map(raw => this.transformDeal(raw)),
      tokensLeft: data.tokensLeft,
      refillIn: data.refillIn
    }
  }
  
  async fetchProducts(asins: string[], domain: number = 8): Promise<{
    products: any[]
    tokensLeft: number
    refillIn: number
  }> {
    const url = new URL(`${KEEPA_API_BASE}/product`)
    url.searchParams.set('key', this.apiKey)
    url.searchParams.set('domain', domain.toString())
    url.searchParams.set('asin', asins.join(','))
    url.searchParams.set('history', '1')
    url.searchParams.set('offers', '20')
    
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`Keepa API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      products: data.products || [],
      tokensLeft: data.tokensLeft,
      refillIn: data.refillIn
    }
  }
  
  async getTokenStatus(): Promise<{
    tokensLeft: number
    refillIn: number
    refillRate: number
  }> {
    const url = new URL(`${KEEPA_API_BASE}/token`)
    url.searchParams.set('key', this.apiKey)
    
    const response = await fetch(url.toString())
    const data = await response.json()
    
    return {
      tokensLeft: data.tokensLeft,
      refillIn: data.refillIn,
      refillRate: data.refillRate
    }
  }
  
  private transformDeal(raw: KeepaRawDeal): Deal {
    const currentPrice = raw.current[1] / 100  // Keepa usa centesimi
    const discountPercent = raw.delta[0]
    const originalPrice = currentPrice / (1 - discountPercent / 100)
    
    return {
      asin: raw.asin,
      title: raw.title,
      imageUrl: raw.image 
        ? `https://images-eu.ssl-images-amazon.com/images/I/${raw.image}`
        : '',
      currentPrice,
      originalPrice,
      discountPercent,
      discountAbsolute: raw.delta[1] / 100,
      category: this.getCategoryName(raw.categories[0]),
      categoryId: raw.categories[0],
      rating: raw.rating > 0 ? raw.rating / 10 : null,
      reviewCount: raw.totalReviews > 0 ? raw.totalReviews : null,
      isPrime: raw.isPrime,
      availabilityType: this.getAvailabilityType(raw.availabilityType),
      dealEndDate: raw.dealEndTime 
        ? new Date(raw.dealEndTime * 1000) 
        : null,
      fetchedAt: new Date()
    }
  }
  
  private getCategoryName(categoryId: number): string {
    // Mapping categorie Amazon IT principali
    const categories: Record<number, string> = {
      412609031: 'Informatica',
      524015031: 'Elettronica',
      524013031: 'Casa e cucina',
      524006031: 'Giardino e giardinaggio',
      // ... altri
    }
    return categories[categoryId] || `Category ${categoryId}`
  }
  
  private getAvailabilityType(type: number): string {
    const types: Record<number, string> = {
      0: 'In stock',
      1: 'Out of stock',
      2: 'Pre-order',
      3: 'Back-order'
    }
    return types[type] || 'Unknown'
  }
}
```

---

## Token Manager (services/keepa/KeepaTokenManager.ts)

```typescript
import type Redis from 'ioredis'
import type { KeepaQueueConfig, TokenMetrics } from '../../types/keepa'

export class KeepaTokenManager {
  private redis: Redis
  private config: KeepaQueueConfig
  
  constructor(redis: Redis, config: KeepaQueueConfig) {
    this.redis = redis
    this.config = config
  }
  
  async updateFromResponse(tokensLeft: number, refillIn: number): Promise<void> {
    const multi = this.redis.multi()
    
    multi.set('keepa:tokens', tokensLeft.toString())
    multi.set('keepa:refill_at', (Date.now() + refillIn).toString())
    
    await multi.exec()
  }
  
  async getAvailable(): Promise<number> {
    const tokens = await this.redis.get('keepa:tokens')
    return tokens ? parseInt(tokens) : this.config.TOKENS_PER_MINUTE
  }
  
  async canAfford(cost: number): Promise<boolean> {
    const available = await this.getAvailable()
    return available >= cost
  }
  
  async consume(cost: number): Promise<void> {
    const current = await this.getAvailable()
    const newValue = Math.max(0, current - cost)
    
    await this.redis.set('keepa:tokens', newValue.toString())
    await this.redis.hincrby('keepa:stats', 'tokens_used_today', cost)
  }
  
  async getRefillTime(): Promise<number> {
    const refillAt = await this.redis.get('keepa:refill_at')
    if (!refillAt) return 60000  // Default 1 minuto
    
    const waitTime = parseInt(refillAt) - Date.now()
    return Math.max(0, waitTime)
  }
  
  async waitForTokens(cost: number): Promise<void> {
    while (!(await this.canAfford(cost))) {
      const waitTime = await this.getRefillTime()
      await this.sleep(Math.min(waitTime, 5000))
    }
  }
  
  async getMetrics(): Promise<TokenMetrics> {
    const available = await this.getAvailable()
    const stats = await this.redis.hgetall('keepa:stats')
    const usedToday = parseInt(stats?.tokens_used_today || '0')
    
    // Max teorico al giorno: 20 token/min * 60 min * 24 ore = 28.800
    const maxDaily = this.config.TOKENS_PER_MINUTE * 60 * 24
    
    return {
      available,
      usedToday,
      utilizationRate: usedToday / maxDaily
    }
  }
  
  async resetDailyStats(): Promise<void> {
    await this.redis.hset('keepa:stats', 'tokens_used_today', '0')
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

---

*Continua in 06-IMPLEMENTATION-2.md*
