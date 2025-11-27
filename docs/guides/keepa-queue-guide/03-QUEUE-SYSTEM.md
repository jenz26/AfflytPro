# Afflyt Pro - Sistema di Coda con Priorità

## Concetto Base

La coda gestisce tutti i job Keepa con un sistema di priorità che garantisce:

1. **Job urgenti passano prima** - Chi triggera tra 2 minuti ha la precedenza
2. **Valore cache considerato** - Job che servono più automazioni hanno priorità
3. **Piano come tiebreaker** - A parità, Business > Pro > Starter > Free
4. **Pre-fetch mai blocca** - I job prefetch hanno priorità bassissima

---

## Struttura Job

```typescript
interface QueueJob {
  // Identificazione
  id: string
  type: 'deal_search' | 'product_refresh'
  
  // Targeting
  category: string
  asins?: string[]  // Solo per product_refresh
  
  // Costi
  tokenCost: number
  
  // Timing
  createdAt: Date
  
  // Chi aspetta questo job
  waitingAutomations: WaitingAutomation[]
  
  // Metadata
  isPrefetch: boolean
  priority: number  // Calcolato, score per sorted set
}

interface WaitingAutomation {
  automationId: string
  userId: string
  userPlan: 'free' | 'starter' | 'pro' | 'business'
  filters: AutomationFilters
  triggersAt: Date  // Quando doveva triggerare l'automazione
}

interface AutomationFilters {
  minDiscount?: number      // es. 30 = minimo 30% sconto
  maxPrice?: number         // es. 100 = max €100
  minRating?: number        // es. 4 = minimo 4 stelle
  minReviews?: number       // es. 50 = minimo 50 recensioni
  excludeKeywords?: string[] // es. ["ricondizionato", "usato"]
}
```

---

## Calcolo Priorità

La priorità è un punteggio numerico. **Score più basso = priorità più alta** (Redis ZPOPMIN prende il minimo).

```typescript
function calculatePriority(job: QueueJob): number {
  // Pre-fetch ha sempre priorità bassissima
  if (job.isPrefetch) {
    return 100
  }
  
  const now = Date.now()
  
  // 1. URGENZA (0-30 punti, invertiti)
  // Job che triggera ORA = 0, tra 30 min = 30
  const earliestTrigger = Math.min(
    ...job.waitingAutomations.map(a => a.triggersAt.getTime())
  )
  const minutesUntilTrigger = Math.max(0, (earliestTrigger - now) / 60000)
  const urgencyScore = Math.min(30, Math.floor(minutesUntilTrigger))
  
  // 2. VALORE CACHE (0-20 punti, invertiti)
  // Più automazioni beneficiano, più è prioritario
  const beneficiaries = job.waitingAutomations.length
  const cacheValueScore = Math.max(0, 20 - (beneficiaries * 2))
  
  // 3. PIANO (0-10 punti)
  // Piano più alto tra i waiters
  const planScores = {
    'business': 0,
    'pro': 3,
    'starter': 6,
    'free': 10
  }
  const bestPlan = job.waitingAutomations.reduce((best, a) => {
    return planScores[a.userPlan] < planScores[best] ? a.userPlan : best
  }, 'free' as const)
  const planScore = planScores[bestPlan]
  
  // Score finale (più basso = più prioritario)
  return urgencyScore + cacheValueScore + planScore
}
```

### Esempi di Priorità

| Scenario | Urgenza | Cache | Piano | Score |
|----------|---------|-------|-------|-------|
| Business, triggera ora, 5 automazioni | 0 | 10 | 0 | **10** |
| Pro, triggera tra 5 min, 3 automazioni | 5 | 14 | 3 | **22** |
| Free, triggera tra 20 min, 1 automazione | 20 | 18 | 10 | **48** |
| Prefetch qualsiasi | - | - | - | **100** |

---

## Operazioni Coda

### Aggiungere Job (o agganciarsi a esistente)

```typescript
async function enqueueOrAttach(
  category: string,
  automation: Automation,
  redis: Redis
): Promise<string> {
  
  // 1. C'è già un job pending per questa categoria?
  const existingJobId = await redis.get(`keepa:pending:${category}`)
  
  if (existingJobId) {
    // Aggancia a job esistente
    const jobData = await redis.zscore('keepa:queue', existingJobId)
    if (jobData) {
      const job: QueueJob = JSON.parse(jobData)
      
      // Aggiungi questa automazione ai waiters
      job.waitingAutomations.push({
        automationId: automation.id,
        userId: automation.userId,
        userPlan: automation.user.plan,
        filters: automation.filters,
        triggersAt: automation.nextRunAt
      })
      
      // Ricalcola priorità (potrebbe aumentare con più waiters)
      job.priority = calculatePriority(job)
      
      // Aggiorna in Redis
      await redis.zrem('keepa:queue', existingJobId)
      await redis.zadd('keepa:queue', job.priority, JSON.stringify(job))
      
      return existingJobId
    }
  }
  
  // 2. Crea nuovo job
  const job: QueueJob = {
    id: generateId(),
    type: 'deal_search',
    category,
    tokenCost: 5,  // Deal API costa 5 token
    createdAt: new Date(),
    waitingAutomations: [{
      automationId: automation.id,
      userId: automation.userId,
      userPlan: automation.user.plan,
      filters: automation.filters,
      triggersAt: automation.nextRunAt
    }],
    isPrefetch: false,
    priority: 0  // Calcolato sotto
  }
  
  job.priority = calculatePriority(job)
  
  // Aggiungi a coda e marca come pending
  await redis.zadd('keepa:queue', job.priority, JSON.stringify(job))
  await redis.set(`keepa:pending:${category}`, job.id, 'EX', 300)
  
  return job.id
}
```

### Prelevare Job (Worker)

```typescript
async function dequeueJob(redis: Redis): Promise<QueueJob | null> {
  // ZPOPMIN ritorna [member, score] del job con score minimo
  const result = await redis.zpopmin('keepa:queue')
  
  if (!result || result.length === 0) {
    return null
  }
  
  const job: QueueJob = JSON.parse(result[0])
  return job
}
```

### Rimettere Job in Coda (se non abbastanza token)

```typescript
async function requeueJob(job: QueueJob, redis: Redis): Promise<void> {
  // Rimettiamo con la stessa priorità
  await redis.zadd('keepa:queue', job.priority, JSON.stringify(job))
}
```

### Completare Job

```typescript
async function completeJob(
  job: QueueJob,
  deals: Deal[],
  redis: Redis,
  prisma: PrismaClient
): Promise<void> {
  
  // 1. Salva deals in cache
  await redis.hset(`keepa:cache:${job.category}`, {
    deals: JSON.stringify(deals),
    updatedAt: Date.now().toString(),
    ttl: (60 * 60 * 1000).toString()  // 1 ora TTL
  })
  await redis.expire(`keepa:cache:${job.category}`, 3600)
  
  // 2. Notifica automazioni in attesa
  for (const waiter of job.waitingAutomations) {
    // Applica filtri specifici dell'automazione
    const filteredDeals = applyFilters(deals, waiter.filters)
    
    if (filteredDeals.length > 0) {
      // Pubblica (es. Telegram)
      await publishDeals(waiter.automationId, filteredDeals)
    }
    
    // Aggiorna nextRunAt dell'automazione
    await prisma.automation.update({
      where: { id: waiter.automationId },
      data: {
        lastRunAt: new Date(),
        nextRunAt: calculateNextRun(waiter.automationId)
      }
    })
  }
  
  // 3. Cleanup
  await redis.del(`keepa:pending:${job.category}`)
  
  // 4. Log per analytics
  await prisma.keepaTokenLog.create({
    data: {
      operation: job.type,
      tokenCost: job.tokenCost,
      category: job.category,
      jobId: job.id,
      success: true,
      responseTime: 0  // TODO: misurare
    }
  })
  
  // 5. Aggiorna stats
  await redis.hincrby('keepa:stats', 'jobs_processed', 1)
  await redis.hincrby('keepa:stats', 'tokens_used_today', job.tokenCost)
}
```

---

## Gestione Token

### Tracking Token Disponibili

```typescript
class TokenManager {
  private redis: Redis
  
  // Keepa ci dice quanti token abbiamo nella response
  async updateFromKeepaResponse(response: KeepaResponse): Promise<void> {
    await this.redis.set('keepa:tokens', response.tokensLeft.toString())
    await this.redis.set('keepa:refill_at', 
      (Date.now() + response.refillIn).toString()
    )
  }
  
  async getAvailableTokens(): Promise<number> {
    const tokens = await this.redis.get('keepa:tokens')
    return tokens ? parseInt(tokens) : 20  // Default 20 se non sappiamo
  }
  
  async canAfford(cost: number): Promise<boolean> {
    const available = await this.getAvailableTokens()
    return available >= cost
  }
  
  async waitForTokens(cost: number): Promise<void> {
    while (!(await this.canAfford(cost))) {
      const refillAt = await this.redis.get('keepa:refill_at')
      const waitTime = refillAt 
        ? Math.max(0, parseInt(refillAt) - Date.now())
        : 60000  // Default 1 minuto
      
      await sleep(Math.min(waitTime, 5000))  // Max 5 sec wait per check
    }
  }
}
```

### Costo Operazioni Keepa

```typescript
const TOKEN_COSTS = {
  deal_search: 5,           // Deal API
  product_single: 1,        // Product API per ASIN
  product_with_offers: 2,   // Product API con offers
  token_status: 0           // Gratuito
} as const

function calculateJobCost(job: QueueJob): number {
  if (job.type === 'deal_search') {
    return TOKEN_COSTS.deal_search
  }
  
  if (job.type === 'product_refresh' && job.asins) {
    return job.asins.length * TOKEN_COSTS.product_single
  }
  
  return 0
}
```

---

## Monitoraggio Coda

```typescript
interface QueueMetrics {
  queueDepth: number           // Job in attesa
  oldestJobAge: number         // Secondi dal job più vecchio
  avgWaitTime: number          // Tempo medio attesa
  jobsByPriority: {
    urgent: number    // priority 0-20
    normal: number    // priority 21-50
    low: number       // priority 51-99
    prefetch: number  // priority 100+
  }
}

async function getQueueMetrics(redis: Redis): Promise<QueueMetrics> {
  const allJobs = await redis.zrange('keepa:queue', 0, -1, 'WITHSCORES')
  
  const jobs: Array<{job: QueueJob, score: number}> = []
  for (let i = 0; i < allJobs.length; i += 2) {
    jobs.push({
      job: JSON.parse(allJobs[i]),
      score: parseFloat(allJobs[i + 1])
    })
  }
  
  const now = Date.now()
  const ages = jobs.map(j => (now - new Date(j.job.createdAt).getTime()) / 1000)
  
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
```

---

*Documento creato: 2025-11-27*
*Versione: 1.0*
