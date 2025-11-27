# Afflyt Pro - Implementazione TypeScript (Parte 2)

## Queue Service (services/keepa/KeepaQueue.ts)

```typescript
import type Redis from 'ioredis'
import { randomUUID } from 'crypto'
import type { 
  QueueJob, 
  WaitingAutomation,
  KeepaQueueConfig,
  QueueMetrics,
  UserPlan
} from '../../types/keepa'

export class KeepaQueue {
  private redis: Redis
  private config: KeepaQueueConfig
  
  constructor(redis: Redis, config: KeepaQueueConfig) {
    this.redis = redis
    this.config = config
  }
  
  // ============================================
  // ENQUEUE / ATTACH
  // ============================================
  
  async enqueueOrAttach(
    category: string,
    automation: {
      id: string
      userId: string
      userPlan: UserPlan
      filters: any
      nextRunAt: Date
    }
  ): Promise<string> {
    
    // Check se esiste già un job pending per questa categoria
    const existingJobId = await this.redis.get(`keepa:pending:${category}`)
    
    if (existingJobId) {
      const attached = await this.attachToExisting(existingJobId, automation)
      if (attached) {
        return existingJobId
      }
    }
    
    // Crea nuovo job
    return await this.createJob(category, automation, false)
  }
  
  private async attachToExisting(
    jobId: string,
    automation: {
      id: string
      userId: string
      userPlan: UserPlan
      filters: any
      nextRunAt: Date
    }
  ): Promise<boolean> {
    
    // Trova il job nella coda
    const allJobs = await this.redis.zrange('keepa:queue', 0, -1, 'WITHSCORES')
    
    for (let i = 0; i < allJobs.length; i += 2) {
      const job: QueueJob = JSON.parse(allJobs[i])
      
      if (job.id === jobId) {
        // Aggiungi automazione ai waiters
        job.waitingAutomations.push({
          automationId: automation.id,
          userId: automation.userId,
          userPlan: automation.userPlan,
          filters: automation.filters,
          triggersAt: automation.nextRunAt
        })
        
        // Se era prefetch, ora diventa job normale
        if (job.isPrefetch) {
          job.isPrefetch = false
        }
        
        // Ricalcola priorità
        job.priority = this.calculatePriority(job)
        
        // Aggiorna in Redis
        await this.redis.zrem('keepa:queue', allJobs[i])
        await this.redis.zadd('keepa:queue', job.priority, JSON.stringify(job))
        
        console.log(`[Queue] Attached automation ${automation.id} to job ${jobId}`)
        return true
      }
    }
    
    return false
  }
  
  private async createJob(
    category: string,
    automation: {
      id: string
      userId: string
      userPlan: UserPlan
      filters: any
      nextRunAt: Date
    },
    isPrefetch: boolean
  ): Promise<string> {
    
    const job: QueueJob = {
      id: randomUUID(),
      type: 'deal_search',
      category,
      tokenCost: this.config.DEAL_API_COST,
      createdAt: new Date(),
      waitingAutomations: [{
        automationId: automation.id,
        userId: automation.userId,
        userPlan: automation.userPlan,
        filters: automation.filters,
        triggersAt: automation.nextRunAt
      }],
      isPrefetch,
      priority: 0
    }
    
    job.priority = isPrefetch 
      ? this.config.PREFETCH_PRIORITY 
      : this.calculatePriority(job)
    
    await this.redis.zadd('keepa:queue', job.priority, JSON.stringify(job))
    await this.redis.set(`keepa:pending:${category}`, job.id, 'EX', 300)
    
    console.log(`[Queue] Created ${isPrefetch ? 'prefetch' : ''} job ${job.id} for ${category}`)
    return job.id
  }
  
  // ============================================
  // PREFETCH
  // ============================================
  
  async createPrefetchJob(
    category: string,
    automations: Array<{
      id: string
      userId: string
      userPlan: UserPlan
      filters: any
      nextRunAt: Date
    }>
  ): Promise<string> {
    
    const job: QueueJob = {
      id: randomUUID(),
      type: 'deal_search',
      category,
      tokenCost: this.config.DEAL_API_COST,
      createdAt: new Date(),
      waitingAutomations: automations.map(a => ({
        automationId: a.id,
        userId: a.userId,
        userPlan: a.userPlan,
        filters: a.filters,
        triggersAt: a.nextRunAt
      })),
      isPrefetch: true,
      priority: this.config.PREFETCH_PRIORITY
    }
    
    await this.redis.zadd('keepa:queue', job.priority, JSON.stringify(job))
    await this.redis.set(`keepa:pending:${category}`, job.id, 'EX', 1800)
    
    console.log(`[Queue] Created prefetch job ${job.id} for ${category}`)
    return job.id
  }
  
  // ============================================
  // DEQUEUE
  // ============================================
  
  async dequeue(): Promise<QueueJob | null> {
    const result = await this.redis.zpopmin('keepa:queue')
    
    if (!result || result.length === 0) {
      return null
    }
    
    return JSON.parse(result[0] as string)
  }
  
  async peek(): Promise<QueueJob | null> {
    const result = await this.redis.zrange('keepa:queue', 0, 0)
    
    if (!result || result.length === 0) {
      return null
    }
    
    return JSON.parse(result[0])
  }
  
  async requeue(job: QueueJob): Promise<void> {
    await this.redis.zadd('keepa:queue', job.priority, JSON.stringify(job))
  }
  
  // ============================================
  // CLEANUP
  // ============================================
  
  async completeJob(job: QueueJob): Promise<void> {
    await this.redis.del(`keepa:pending:${job.category}`)
    await this.redis.hincrby('keepa:stats', 'jobs_processed', 1)
    
    if (job.isPrefetch) {
      await this.redis.hincrby('keepa:stats:prefetch', 'completed', 1)
    }
  }
  
  async hasPendingJob(category: string): Promise<boolean> {
    const pending = await this.redis.get(`keepa:pending:${category}`)
    return !!pending
  }
  
  // ============================================
  // PRIORITY CALCULATION
  // ============================================
  
  private calculatePriority(job: QueueJob): number {
    if (job.isPrefetch) {
      return this.config.PREFETCH_PRIORITY
    }
    
    const now = Date.now()
    
    // 1. URGENZA (0-30 punti, score basso = più urgente)
    const earliestTrigger = Math.min(
      ...job.waitingAutomations.map(a => new Date(a.triggersAt).getTime())
    )
    const minutesUntil = Math.max(0, (earliestTrigger - now) / 60000)
    const urgencyScore = Math.min(30, Math.floor(minutesUntil))
    
    // 2. VALORE CACHE (0-20 punti, più beneficiari = score più basso)
    const beneficiaries = job.waitingAutomations.length
    const cacheValueScore = Math.max(0, 20 - (beneficiaries * 2))
    
    // 3. PIANO (0-10 punti)
    const planScores: Record<UserPlan, number> = {
      'business': 0,
      'pro': 3,
      'starter': 6,
      'free': 10
    }
    
    const bestPlan = job.waitingAutomations.reduce((best, a) => {
      return planScores[a.userPlan] < planScores[best] ? a.userPlan : best
    }, 'free' as UserPlan)
    
    const planScore = planScores[bestPlan]
    
    return urgencyScore + cacheValueScore + planScore
  }
  
  // ============================================
  // METRICS
  // ============================================
  
  async getMetrics(): Promise<QueueMetrics> {
    const allJobs = await this.redis.zrange('keepa:queue', 0, -1, 'WITHSCORES')
    
    const jobs: Array<{ job: QueueJob; score: number }> = []
    for (let i = 0; i < allJobs.length; i += 2) {
      jobs.push({
        job: JSON.parse(allJobs[i]),
        score: parseFloat(allJobs[i + 1])
      })
    }
    
    const now = Date.now()
    const ages = jobs.map(j => 
      (now - new Date(j.job.createdAt).getTime()) / 1000
    )
    
    return {
      queueDepth: jobs.length,
      oldestJobAge: ages.length > 0 ? Math.max(...ages) : 0,
      avgWaitTime: ages.length > 0 
        ? ages.reduce((a, b) => a + b, 0) / ages.length 
        : 0,
      jobsByPriority: {
        urgent: jobs.filter(j => j.score <= 20).length,
        normal: jobs.filter(j => j.score > 20 && j.score <= 50).length,
        low: jobs.filter(j => j.score > 50 && j.score < 100).length,
        prefetch: jobs.filter(j => j.score >= 100).length
      }
    }
  }
  
  async getDepth(): Promise<number> {
    return await this.redis.zcard('keepa:queue')
  }
}
```

---

## Cache Service (services/keepa/KeepaCache.ts)

```typescript
import type Redis from 'ioredis'
import type { 
  Deal, 
  CachedCategory, 
  CacheStatus,
  CacheMetrics,
  KeepaQueueConfig,
  AutomationFilters
} from '../../types/keepa'

export class KeepaCache {
  private redis: Redis
  private config: KeepaQueueConfig
  
  constructor(redis: Redis, config: KeepaQueueConfig) {
    this.redis = redis
    this.config = config
  }
  
  // ============================================
  // READ
  // ============================================
  
  async checkStatus(category: string): Promise<{
    status: CacheStatus
    data: CachedCategory | null
  }> {
    const cached = await this.redis.hgetall(`keepa:cache:${category}`)
    
    if (!cached || !cached.deals) {
      await this.redis.hincrby('keepa:stats', 'cache_misses', 1)
      return { status: 'missing', data: null }
    }
    
    const data: CachedCategory = {
      deals: JSON.parse(cached.deals),
      updatedAt: parseInt(cached.updatedAt),
      ttl: parseInt(cached.ttl),
      source: cached.source as 'automation' | 'prefetch'
    }
    
    const age = Date.now() - data.updatedAt
    
    await this.redis.hincrby('keepa:stats', 'cache_hits', 1)
    
    if (age < this.config.CACHE_FRESH_THRESHOLD_MS) {
      return { status: 'fresh', data }
    }
    
    if (age < this.config.CACHE_STALE_THRESHOLD_MS) {
      return { status: 'stale', data }
    }
    
    return { status: 'expired', data }
  }
  
  async get(category: string): Promise<Deal[] | null> {
    const { status, data } = await this.checkStatus(category)
    
    if (status === 'missing') {
      return null
    }
    
    return data!.deals
  }
  
  async isFresh(category: string): Promise<boolean> {
    const { status } = await this.checkStatus(category)
    return status === 'fresh'
  }
  
  // ============================================
  // WRITE
  // ============================================
  
  async save(
    category: string,
    deals: Deal[],
    source: 'automation' | 'prefetch'
  ): Promise<void> {
    
    const now = Date.now()
    
    await this.redis.hset(`keepa:cache:${category}`, {
      deals: JSON.stringify(deals),
      updatedAt: now.toString(),
      ttl: this.config.CACHE_TTL_MS.toString(),
      source
    })
    
    // TTL Redis per auto-cleanup
    const expireSeconds = Math.ceil(this.config.CACHE_TTL_MS * 2 / 1000)
    await this.redis.expire(`keepa:cache:${category}`, expireSeconds)
    
    await this.redis.hincrby('keepa:stats', 'cache_writes', 1)
    
    console.log(`[Cache] Saved ${deals.length} deals for ${category}`)
  }
  
  // ============================================
  // INVALIDATE
  // ============================================
  
  async invalidate(category: string): Promise<void> {
    await this.redis.del(`keepa:cache:${category}`)
    await this.redis.del(`keepa:pending:${category}`)
  }
  
  async invalidateAll(): Promise<void> {
    const keys = await this.redis.keys('keepa:cache:*')
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
  
  // ============================================
  // FILTERS
  // ============================================
  
  applyFilters(deals: Deal[], filters: AutomationFilters): Deal[] {
    return deals.filter(deal => {
      // Sconto minimo
      if (filters.minDiscount && deal.discountPercent < filters.minDiscount) {
        return false
      }
      
      // Prezzo massimo
      if (filters.maxPrice && deal.currentPrice > filters.maxPrice) {
        return false
      }
      
      // Rating minimo
      if (filters.minRating && deal.rating && deal.rating < filters.minRating) {
        return false
      }
      
      // Recensioni minime
      if (filters.minReviews && deal.reviewCount && deal.reviewCount < filters.minReviews) {
        return false
      }
      
      // Keyword escluse
      if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
        const titleLower = deal.title.toLowerCase()
        for (const keyword of filters.excludeKeywords) {
          if (titleLower.includes(keyword.toLowerCase())) {
            return false
          }
        }
      }
      
      // Solo Prime
      if (filters.primeOnly && !deal.isPrime) {
        return false
      }
      
      return true
    })
  }
  
  selectBest(deals: Deal[], limit: number = 5): Deal[] {
    // Ordina per sconto decrescente
    const sorted = [...deals].sort((a, b) => 
      b.discountPercent - a.discountPercent
    )
    
    return sorted.slice(0, limit)
  }
  
  // ============================================
  // METRICS
  // ============================================
  
  async getMetrics(): Promise<CacheMetrics> {
    const keys = await this.redis.keys('keepa:cache:*')
    
    let fresh = 0
    let stale = 0
    let totalAge = 0
    
    const now = Date.now()
    
    for (const key of keys) {
      const updatedAt = await this.redis.hget(key, 'updatedAt')
      if (updatedAt) {
        const age = now - parseInt(updatedAt)
        totalAge += age
        
        if (age < this.config.CACHE_FRESH_THRESHOLD_MS) {
          fresh++
        } else {
          stale++
        }
      }
    }
    
    const stats = await this.redis.hgetall('keepa:stats')
    const hits = parseInt(stats?.cache_hits || '0')
    const misses = parseInt(stats?.cache_misses || '0')
    
    return {
      totalCategories: keys.length,
      freshCategories: fresh,
      staleCategories: stale,
      hitRate: hits + misses > 0 ? hits / (hits + misses) : 0,
      avgAge: keys.length > 0 ? (totalAge / keys.length) / 1000 : 0
    }
  }
}
```

---

*Continua in 06-IMPLEMENTATION-3.md*
