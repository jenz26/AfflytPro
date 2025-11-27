# Afflyt Pro - Implementazione TypeScript (Parte 3)

## Prefetch Service (services/keepa/KeepaPrefetch.ts)

```typescript
import type Redis from 'ioredis'
import type { PrismaClient } from '@prisma/client'
import type { KeepaQueueConfig, UserPlan } from '../../types/keepa'
import { KeepaQueue } from './KeepaQueue'
import { KeepaCache } from './KeepaCache'
import { KeepaTokenManager } from './KeepaTokenManager'

export class KeepaPrefetch {
  private redis: Redis
  private prisma: PrismaClient
  private config: KeepaQueueConfig
  private queue: KeepaQueue
  private cache: KeepaCache
  private tokenManager: KeepaTokenManager
  
  constructor(
    redis: Redis,
    prisma: PrismaClient,
    config: KeepaQueueConfig,
    queue: KeepaQueue,
    cache: KeepaCache,
    tokenManager: KeepaTokenManager
  ) {
    this.redis = redis
    this.prisma = prisma
    this.config = config
    this.queue = queue
    this.cache = cache
    this.tokenManager = tokenManager
  }
  
  async runIfIdle(): Promise<void> {
    // 1. Controlla se la coda è vuota
    const queueDepth = await this.queue.getDepth()
    if (queueDepth > 0) {
      return  // C'è lavoro urgente
    }
    
    // 2. Controlla token disponibili
    const tokens = await this.tokenManager.getAvailable()
    if (tokens < this.config.DEAL_API_COST) {
      return  // Non abbastanza token
    }
    
    // 3. Trova automazioni che triggerano presto
    const lookaheadEnd = new Date(
      Date.now() + this.config.PREFETCH_LOOKAHEAD_MINUTES * 60 * 1000
    )
    
    const upcomingAutomations = await this.prisma.automation.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          gt: new Date(),
          lte: lookaheadEnd
        }
      },
      include: {
        user: {
          select: {
            id: true,
            plan: true
          }
        }
      },
      orderBy: {
        nextRunAt: 'asc'
      }
    })
    
    if (upcomingAutomations.length === 0) {
      return
    }
    
    // 4. Raggruppa per categoria
    const byCategory = this.groupBy(upcomingAutomations, a => a.category)
    
    // 5. Crea prefetch jobs
    let prefetchCreated = 0
    
    for (const [category, automations] of Object.entries(byCategory)) {
      if (prefetchCreated >= this.config.MAX_PREFETCH_PER_TICK) {
        break
      }
      
      // Cache già fresca?
      if (await this.cache.isFresh(category)) {
        continue
      }
      
      // Job già pending?
      if (await this.queue.hasPendingJob(category)) {
        continue
      }
      
      // Crea prefetch job
      const formattedAutomations = automations.map(a => ({
        id: a.id,
        userId: a.userId,
        userPlan: a.user.plan as UserPlan,
        filters: a.filters as any,
        nextRunAt: a.nextRunAt
      }))
      
      await this.queue.createPrefetchJob(category, formattedAutomations)
      await this.redis.hincrby('keepa:stats:prefetch', 'created', 1)
      
      prefetchCreated++
      
      console.log(
        `[Prefetch] Created job for ${category}, ` +
        `${automations.length} automations due in next ` +
        `${this.config.PREFETCH_LOOKAHEAD_MINUTES}min`
      )
    }
  }
  
  private groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return arr.reduce((acc, item) => {
      const key = keyFn(item)
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(item)
      return acc
    }, {} as Record<string, T[]>)
  }
}
```

---

## Worker (workers/keepaWorker.ts)

```typescript
import type { PrismaClient } from '@prisma/client'
import { getRedis } from '../lib/redis'
import { KeepaClient } from '../services/keepa/KeepaClient'
import { KeepaTokenManager } from '../services/keepa/KeepaTokenManager'
import { KeepaQueue } from '../services/keepa/KeepaQueue'
import { KeepaCache } from '../services/keepa/KeepaCache'
import { KeepaPrefetch } from '../services/keepa/KeepaPrefetch'
import { DEFAULT_CONFIG, type QueueJob, type Deal } from '../types/keepa'

export class KeepaWorker {
  private prisma: PrismaClient
  private client: KeepaClient
  private tokenManager: KeepaTokenManager
  private queue: KeepaQueue
  private cache: KeepaCache
  private prefetch: KeepaPrefetch
  private running: boolean = false
  private intervalId: NodeJS.Timeout | null = null
  
  constructor(prisma: PrismaClient) {
    const redis = getRedis()
    const config = DEFAULT_CONFIG
    
    this.prisma = prisma
    this.client = new KeepaClient(process.env.KEEPA_API_KEY!, config)
    this.tokenManager = new KeepaTokenManager(redis, config)
    this.queue = new KeepaQueue(redis, config)
    this.cache = new KeepaCache(redis, config)
    this.prefetch = new KeepaPrefetch(
      redis, prisma, config, 
      this.queue, this.cache, this.tokenManager
    )
  }
  
  start(): void {
    if (this.running) return
    
    this.running = true
    console.log('[Worker] Starting Keepa worker...')
    
    // Tick ogni 3 secondi
    this.intervalId = setInterval(
      () => this.tick(),
      DEFAULT_CONFIG.WORKER_TICK_MS
    )
    
    // Prima tick immediata
    this.tick()
  }
  
  stop(): void {
    if (!this.running) return
    
    this.running = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    
    console.log('[Worker] Stopped')
  }
  
  private async tick(): Promise<void> {
    try {
      // 1. Processa job dalla coda
      await this.processQueue()
      
      // 2. Se idle, prova prefetch
      await this.prefetch.runIfIdle()
      
      // 3. Aggiorna timestamp
      await getRedis().hset('keepa:stats', 'last_tick_at', Date.now().toString())
      
    } catch (error) {
      console.error('[Worker] Tick error:', error)
    }
  }
  
  private async processQueue(): Promise<void> {
    // Controlla token disponibili
    const tokens = await this.tokenManager.getAvailable()
    
    // Guarda il prossimo job senza rimuoverlo
    const nextJob = await this.queue.peek()
    if (!nextJob) return
    
    // Abbastanza token?
    if (nextJob.tokenCost > tokens) {
      // Aspetta, ma non bloccare il loop
      return
    }
    
    // Rimuovi dalla coda
    const job = await this.queue.dequeue()
    if (!job) return
    
    // Esegui
    await this.executeJob(job)
  }
  
  private async executeJob(job: QueueJob): Promise<void> {
    console.log(`[Worker] Executing job ${job.id} for ${job.category}`)
    
    const startTime = Date.now()
    
    try {
      // Chiama Keepa
      const categoryId = this.getCategoryId(job.category)
      const result = await this.client.fetchDeals(categoryId)
      
      // Aggiorna token da response
      await this.tokenManager.updateFromResponse(
        result.tokensLeft,
        result.refillIn
      )
      
      // Consuma token
      await this.tokenManager.consume(job.tokenCost)
      
      // Salva in cache
      await this.cache.save(
        job.category,
        result.deals,
        job.isPrefetch ? 'prefetch' : 'automation'
      )
      
      // Notifica automazioni in attesa
      await this.notifyWaitingAutomations(job, result.deals)
      
      // Cleanup
      await this.queue.completeJob(job)
      
      // Log per analytics
      await this.logJobCompletion(job, result.deals.length, Date.now() - startTime)
      
    } catch (error) {
      console.error(`[Worker] Job ${job.id} failed:`, error)
      
      // TODO: Retry logic? Per ora logga e basta
      await this.queue.completeJob(job)  // Rimuovi comunque il pending
    }
  }
  
  private async notifyWaitingAutomations(
    job: QueueJob,
    deals: Deal[]
  ): Promise<void> {
    
    for (const waiter of job.waitingAutomations) {
      try {
        // Applica filtri
        const filtered = this.cache.applyFilters(deals, waiter.filters)
        
        if (filtered.length === 0) {
          console.log(
            `[Worker] No deals match filters for automation ${waiter.automationId}`
          )
          continue
        }
        
        // Seleziona i migliori
        const automation = await this.prisma.automation.findUnique({
          where: { id: waiter.automationId }
        })
        
        const maxDeals = (automation?.maxDealsPerPost as number) || 5
        const selected = this.cache.selectBest(filtered, maxDeals)
        
        // Pubblica (implementare in base a dove pubblica)
        await this.publishDeals(waiter.automationId, selected)
        
        // Aggiorna nextRunAt
        await this.updateNextRun(waiter.automationId)
        
      } catch (error) {
        console.error(
          `[Worker] Failed to notify automation ${waiter.automationId}:`,
          error
        )
      }
    }
  }
  
  private async publishDeals(
    automationId: string,
    deals: Deal[]
  ): Promise<void> {
    // TODO: Implementare la logica di pubblicazione
    // - Telegram bot
    // - Altri canali
    
    const automation = await this.prisma.automation.findUnique({
      where: { id: automationId },
      include: { user: true }
    })
    
    if (!automation) return
    
    console.log(
      `[Worker] Publishing ${deals.length} deals for automation ${automationId}`
    )
    
    // Placeholder per Telegram
    if (automation.telegramChannelId) {
      // await telegramBot.sendDeals(automation.telegramChannelId, deals)
    }
  }
  
  private async updateNextRun(automationId: string): Promise<void> {
    const automation = await this.prisma.automation.findUnique({
      where: { id: automationId }
    })
    
    if (!automation) return
    
    const nextRun = new Date(
      Date.now() + automation.intervalMinutes * 60 * 1000
    )
    
    await this.prisma.automation.update({
      where: { id: automationId },
      data: {
        lastRunAt: new Date(),
        nextRunAt: nextRun
      }
    })
  }
  
  private async logJobCompletion(
    job: QueueJob,
    dealsCount: number,
    durationMs: number
  ): Promise<void> {
    await this.prisma.keepaTokenLog.create({
      data: {
        operation: job.type,
        tokenCost: job.tokenCost,
        category: job.category,
        jobId: job.id,
        success: true,
        responseTime: durationMs
      }
    })
  }
  
  private getCategoryId(categoryName: string): number {
    // Mapping nomi → ID
    const categories: Record<string, number> = {
      'Informatica': 412609031,
      'Elettronica': 524015031,
      'Casa e cucina': 524013031,
      'Giardino e giardinaggio': 524006031,
      // ... altri
    }
    
    return categories[categoryName] || 0
  }
}
```

---

## Automation Scheduler (services/automation/AutomationScheduler.ts)

```typescript
import cron from 'node-cron'
import type { PrismaClient } from '@prisma/client'
import { getRedis } from '../../lib/redis'
import { KeepaQueue } from '../keepa/KeepaQueue'
import { KeepaCache } from '../keepa/KeepaCache'
import { DEFAULT_CONFIG, type UserPlan } from '../../types/keepa'

export class AutomationScheduler {
  private prisma: PrismaClient
  private queue: KeepaQueue
  private cache: KeepaCache
  private cronJob: cron.ScheduledTask | null = null
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    
    const redis = getRedis()
    this.queue = new KeepaQueue(redis, DEFAULT_CONFIG)
    this.cache = new KeepaCache(redis, DEFAULT_CONFIG)
  }
  
  start(): void {
    // Esegui ogni minuto
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkDueAutomations()
    })
    
    console.log('[Scheduler] Automation scheduler started')
  }
  
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop()
      this.cronJob = null
    }
    console.log('[Scheduler] Automation scheduler stopped')
  }
  
  private async checkDueAutomations(): Promise<void> {
    const now = new Date()
    
    // Trova automazioni che devono triggerare
    const dueAutomations = await this.prisma.automation.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now }
      },
      include: {
        user: {
          select: {
            id: true,
            plan: true
          }
        }
      }
    })
    
    if (dueAutomations.length === 0) {
      return
    }
    
    console.log(`[Scheduler] Found ${dueAutomations.length} due automations`)
    
    // Raggruppa per categoria
    const byCategory = this.groupBy(dueAutomations, a => a.category)
    
    for (const [category, automations] of Object.entries(byCategory)) {
      await this.handleCategoryAutomations(category, automations)
    }
  }
  
  private async handleCategoryAutomations(
    category: string,
    automations: Array<{
      id: string
      userId: string
      user: { id: string; plan: string }
      filters: any
      nextRunAt: Date
      intervalMinutes: number
      maxDealsPerPost?: number
      telegramChannelId?: string
    }>
  ): Promise<void> {
    
    // Check cache
    const { status, data } = await this.cache.checkStatus(category)
    
    if (status === 'fresh' && data) {
      // Cache fresco! Pubblica subito per tutte le automazioni
      console.log(`[Scheduler] Cache hit for ${category}, publishing immediately`)
      
      for (const automation of automations) {
        // Applica filtri e pubblica
        const filtered = this.cache.applyFilters(data.deals, automation.filters)
        const selected = this.cache.selectBest(
          filtered, 
          automation.maxDealsPerPost || 5
        )
        
        if (selected.length > 0) {
          await this.publishDeals(automation, selected)
        }
        
        // Aggiorna nextRunAt
        await this.updateNextRun(automation)
      }
      
    } else {
      // Cache stale o mancante, accoda refresh
      console.log(`[Scheduler] Cache ${status} for ${category}, queuing refresh`)
      
      for (const automation of automations) {
        await this.queue.enqueueOrAttach(category, {
          id: automation.id,
          userId: automation.userId,
          userPlan: automation.user.plan as UserPlan,
          filters: automation.filters,
          nextRunAt: automation.nextRunAt
        })
      }
      
      // Le automazioni verranno notificate quando il job completa
    }
  }
  
  private async publishDeals(
    automation: any,
    deals: any[]
  ): Promise<void> {
    // TODO: Implementare pubblicazione
    console.log(
      `[Scheduler] Publishing ${deals.length} deals ` +
      `for automation ${automation.id}`
    )
  }
  
  private async updateNextRun(automation: any): Promise<void> {
    const nextRun = new Date(
      Date.now() + automation.intervalMinutes * 60 * 1000
    )
    
    await this.prisma.automation.update({
      where: { id: automation.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: nextRun
      }
    })
  }
  
  private groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return arr.reduce((acc, item) => {
      const key = keyFn(item)
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(item)
      return acc
    }, {} as Record<string, T[]>)
  }
}
```

---

## Entry Point (index.ts)

```typescript
import { PrismaClient } from '@prisma/client'
import { KeepaWorker } from './workers/keepaWorker'
import { AutomationScheduler } from './services/automation/AutomationScheduler'
import { closeRedis } from './lib/redis'

const prisma = new PrismaClient()

// Inizializza servizi
const worker = new KeepaWorker(prisma)
const scheduler = new AutomationScheduler(prisma)

// Avvia
worker.start()
scheduler.start()

console.log('[App] Afflyt Keepa system started')

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[App] Shutting down...')
  
  worker.stop()
  scheduler.stop()
  
  await closeRedis()
  await prisma.$disconnect()
  
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[App] Interrupted, shutting down...')
  
  worker.stop()
  scheduler.stop()
  
  await closeRedis()
  await prisma.$disconnect()
  
  process.exit(0)
})
```

---

*Continua in 07-MONITORING.md*
