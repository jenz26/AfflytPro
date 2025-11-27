# Afflyt Pro - Monitoring e Metriche

## Dashboard Metriche

### Metriche Real-time

```typescript
interface RealtimeMetrics {
  // Token
  tokensAvailable: number
  tokensUsedLastHour: number
  utilizationRate: number  // 0-1
  
  // Coda
  queueDepth: number
  oldestJobAge: number    // secondi
  jobsProcessedLastHour: number
  
  // Cache
  cacheHitRate: number    // 0-1
  categoriesCached: number
  avgCacheAge: number     // secondi
}
```

### Implementazione API Metriche

```typescript
// routes/metrics.ts
import { Router } from 'express'
import { getRedis } from '../lib/redis'
import { KeepaQueue } from '../services/keepa/KeepaQueue'
import { KeepaCache } from '../services/keepa/KeepaCache'
import { KeepaTokenManager } from '../services/keepa/KeepaTokenManager'
import { DEFAULT_CONFIG } from '../types/keepa'

const router = Router()

router.get('/metrics', async (req, res) => {
  const redis = getRedis()
  const queue = new KeepaQueue(redis, DEFAULT_CONFIG)
  const cache = new KeepaCache(redis, DEFAULT_CONFIG)
  const tokenManager = new KeepaTokenManager(redis, DEFAULT_CONFIG)
  
  const [queueMetrics, cacheMetrics, tokenMetrics] = await Promise.all([
    queue.getMetrics(),
    cache.getMetrics(),
    tokenManager.getMetrics()
  ])
  
  const stats = await redis.hgetall('keepa:stats')
  
  res.json({
    timestamp: new Date().toISOString(),
    
    tokens: {
      available: tokenMetrics.available,
      usedToday: tokenMetrics.usedToday,
      utilizationRate: tokenMetrics.utilizationRate
    },
    
    queue: {
      depth: queueMetrics.queueDepth,
      oldestJobAge: queueMetrics.oldestJobAge,
      avgWaitTime: queueMetrics.avgWaitTime,
      byPriority: queueMetrics.jobsByPriority
    },
    
    cache: {
      hitRate: cacheMetrics.hitRate,
      totalCategories: cacheMetrics.totalCategories,
      freshCategories: cacheMetrics.freshCategories,
      avgAge: cacheMetrics.avgAge
    },
    
    totals: {
      jobsProcessed: parseInt(stats?.jobs_processed || '0'),
      cacheHits: parseInt(stats?.cache_hits || '0'),
      cacheMisses: parseInt(stats?.cache_misses || '0'),
      cacheWrites: parseInt(stats?.cache_writes || '0')
    }
  })
})

router.get('/metrics/prefetch', async (req, res) => {
  const redis = getRedis()
  const stats = await redis.hgetall('keepa:stats:prefetch')
  
  res.json({
    created: parseInt(stats?.created || '0'),
    completed: parseInt(stats?.completed || '0'),
    converted: parseInt(stats?.converted || '0'),
    tokensUsed: parseInt(stats?.tokens || '0')
  })
})

export default router
```

---

## Alerting

### Condizioni Alert

| Condizione | Severità | Azione |
|------------|----------|--------|
| Queue depth > 20 | Warning | Log + Monitor |
| Queue depth > 50 | High | Slack notification |
| Queue depth > 100 | Critical | Email + Slack |
| Oldest job > 5 min | Warning | Log |
| Oldest job > 15 min | High | Slack notification |
| Token utilization > 95% | Warning | Consider upgrade |
| Cache hit rate < 50% | Warning | Review prefetch |
| Worker not ticking > 1 min | Critical | Page on-call |

### Implementazione Alert

```typescript
// services/alerting/AlertService.ts

interface AlertConfig {
  queueDepthWarning: number
  queueDepthHigh: number
  queueDepthCritical: number
  oldestJobWarning: number    // secondi
  oldestJobHigh: number
  tokenUtilizationWarning: number
  cacheHitRateWarning: number
  workerTimeoutCritical: number  // secondi
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  queueDepthWarning: 20,
  queueDepthHigh: 50,
  queueDepthCritical: 100,
  oldestJobWarning: 300,      // 5 min
  oldestJobHigh: 900,         // 15 min
  tokenUtilizationWarning: 0.95,
  cacheHitRateWarning: 0.5,
  workerTimeoutCritical: 60
}

export class AlertService {
  private config: AlertConfig
  private lastAlerts: Map<string, number> = new Map()
  private cooldownMs: number = 5 * 60 * 1000  // 5 minuti tra alert uguali
  
  constructor(config: AlertConfig = DEFAULT_ALERT_CONFIG) {
    this.config = config
  }
  
  async checkAndAlert(metrics: RealtimeMetrics): Promise<void> {
    // Queue depth
    if (metrics.queueDepth >= this.config.queueDepthCritical) {
      await this.alert('queue_critical', 'CRITICAL', 
        `Queue depth critical: ${metrics.queueDepth} jobs`)
    } else if (metrics.queueDepth >= this.config.queueDepthHigh) {
      await this.alert('queue_high', 'HIGH',
        `Queue depth high: ${metrics.queueDepth} jobs`)
    } else if (metrics.queueDepth >= this.config.queueDepthWarning) {
      await this.alert('queue_warning', 'WARNING',
        `Queue depth elevated: ${metrics.queueDepth} jobs`)
    }
    
    // Oldest job
    if (metrics.oldestJobAge >= this.config.oldestJobHigh) {
      await this.alert('oldest_job_high', 'HIGH',
        `Oldest job waiting ${Math.round(metrics.oldestJobAge / 60)} minutes`)
    } else if (metrics.oldestJobAge >= this.config.oldestJobWarning) {
      await this.alert('oldest_job_warning', 'WARNING',
        `Oldest job waiting ${Math.round(metrics.oldestJobAge / 60)} minutes`)
    }
    
    // Token utilization
    if (metrics.utilizationRate >= this.config.tokenUtilizationWarning) {
      await this.alert('token_util', 'WARNING',
        `Token utilization at ${Math.round(metrics.utilizationRate * 100)}%`)
    }
    
    // Cache hit rate
    if (metrics.cacheHitRate < this.config.cacheHitRateWarning) {
      await this.alert('cache_hit', 'WARNING',
        `Cache hit rate low: ${Math.round(metrics.cacheHitRate * 100)}%`)
    }
  }
  
  async checkWorkerHealth(redis: Redis): Promise<void> {
    const lastTick = await redis.hget('keepa:stats', 'last_tick_at')
    
    if (lastTick) {
      const elapsed = (Date.now() - parseInt(lastTick)) / 1000
      
      if (elapsed > this.config.workerTimeoutCritical) {
        await this.alert('worker_timeout', 'CRITICAL',
          `Worker not responding for ${Math.round(elapsed)} seconds`)
      }
    }
  }
  
  private async alert(
    key: string,
    severity: 'WARNING' | 'HIGH' | 'CRITICAL',
    message: string
  ): Promise<void> {
    // Cooldown check
    const lastAlert = this.lastAlerts.get(key)
    if (lastAlert && (Date.now() - lastAlert) < this.cooldownMs) {
      return
    }
    
    this.lastAlerts.set(key, Date.now())
    
    console.log(`[Alert ${severity}] ${message}`)
    
    // Slack notification per HIGH e CRITICAL
    if (severity !== 'WARNING') {
      await this.sendSlackAlert(severity, message)
    }
    
    // Email per CRITICAL
    if (severity === 'CRITICAL') {
      await this.sendEmailAlert(message)
    }
  }
  
  private async sendSlackAlert(
    severity: string,
    message: string
  ): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!webhookUrl) return
    
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `[${severity}] Afflyt Keepa: ${message}`,
          username: 'Afflyt Alerts'
        })
      })
    } catch (error) {
      console.error('[Alert] Failed to send Slack notification:', error)
    }
  }
  
  private async sendEmailAlert(message: string): Promise<void> {
    // TODO: Implementare con Resend/SendGrid
    console.log('[Alert] Would send email:', message)
  }
}
```

### Cron Alert Check

```typescript
// workers/alertWorker.ts
import cron from 'node-cron'
import { getRedis } from '../lib/redis'
import { AlertService } from '../services/alerting/AlertService'
import { KeepaQueue } from '../services/keepa/KeepaQueue'
import { KeepaCache } from '../services/keepa/KeepaCache'
import { KeepaTokenManager } from '../services/keepa/KeepaTokenManager'
import { DEFAULT_CONFIG } from '../types/keepa'

export function startAlertWorker(): cron.ScheduledTask {
  const alertService = new AlertService()
  
  // Check ogni minuto
  return cron.schedule('* * * * *', async () => {
    const redis = getRedis()
    
    const queue = new KeepaQueue(redis, DEFAULT_CONFIG)
    const cache = new KeepaCache(redis, DEFAULT_CONFIG)
    const tokenManager = new KeepaTokenManager(redis, DEFAULT_CONFIG)
    
    const [queueMetrics, cacheMetrics, tokenMetrics] = await Promise.all([
      queue.getMetrics(),
      cache.getMetrics(),
      tokenManager.getMetrics()
    ])
    
    await alertService.checkAndAlert({
      tokensAvailable: tokenMetrics.available,
      tokensUsedLastHour: 0,  // TODO
      utilizationRate: tokenMetrics.utilizationRate,
      queueDepth: queueMetrics.queueDepth,
      oldestJobAge: queueMetrics.oldestJobAge,
      jobsProcessedLastHour: 0,  // TODO
      cacheHitRate: cacheMetrics.hitRate,
      categoriesCached: cacheMetrics.totalCategories,
      avgCacheAge: cacheMetrics.avgAge
    })
    
    await alertService.checkWorkerHealth(redis)
  })
}
```

---

## Logging Strutturato

```typescript
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  base: {
    service: 'afflyt-keepa'
  }
})

// Uso
logger.info({ category: 'Informatica', deals: 15 }, 'Cache refreshed')
logger.warn({ queueDepth: 45 }, 'Queue depth elevated')
logger.error({ error, jobId: 'xyz' }, 'Job execution failed')
```

---

## Health Check Endpoint

```typescript
// routes/health.ts
import { Router } from 'express'
import { getRedis } from '../lib/redis'

const router = Router()

router.get('/health', async (req, res) => {
  const checks: Record<string, boolean> = {}
  
  // Redis
  try {
    await getRedis().ping()
    checks.redis = true
  } catch {
    checks.redis = false
  }
  
  // Worker (check last tick)
  try {
    const lastTick = await getRedis().hget('keepa:stats', 'last_tick_at')
    if (lastTick) {
      const elapsed = (Date.now() - parseInt(lastTick)) / 1000
      checks.worker = elapsed < 60  // Healthy se tick negli ultimi 60s
    } else {
      checks.worker = false
    }
  } catch {
    checks.worker = false
  }
  
  const healthy = Object.values(checks).every(v => v)
  
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  })
})

router.get('/ready', async (req, res) => {
  // Ready check per Kubernetes
  try {
    await getRedis().ping()
    res.status(200).json({ status: 'ready' })
  } catch {
    res.status(503).json({ status: 'not ready' })
  }
})

export default router
```

---

## Reset Daily Stats

```typescript
// workers/dailyReset.ts
import cron from 'node-cron'
import { getRedis } from '../lib/redis'

export function startDailyResetWorker(): cron.ScheduledTask {
  // Ogni giorno a mezzanotte
  return cron.schedule('0 0 * * *', async () => {
    const redis = getRedis()
    
    // Salva stats di ieri per storico (opzionale)
    const stats = await redis.hgetall('keepa:stats')
    console.log('[Daily] Yesterday stats:', stats)
    
    // Reset
    await redis.hset('keepa:stats', {
      'tokens_used_today': '0',
      'jobs_processed': '0',
      'cache_hits': '0',
      'cache_misses': '0',
      'cache_writes': '0'
    })
    
    await redis.hset('keepa:stats:prefetch', {
      'created': '0',
      'completed': '0',
      'converted': '0',
      'tokens': '0'
    })
    
    console.log('[Daily] Stats reset complete')
  })
}
```

---

## Quando Scalare

### Segnali che servono più token

1. **Queue depth costantemente > 50** → Jobs in attesa troppi
2. **Oldest job > 10 min regolarmente** → Utenti aspettano troppo
3. **Token utilization > 90% costante** → Siamo al limite
4. **Cache hit rate in calo** → Prefetch non riesce a tenere il passo

### Azioni

1. **Prima opzione**: Ottimizza
   - Aumenta TTL cache
   - Riduci prefetch aggressività
   - Batch più grandi

2. **Seconda opzione**: Upgrade Keepa
   - 20 → 60 token/min = €49 → €129
   - 3x capacità

3. **Terza opzione**: Multi-key
   - Seconda API key con load balancing
   - Complessità maggiore

---

## Checklist Lancio

- [ ] Redis configurato su Railway
- [ ] Variabili ambiente settate (KEEPA_API_KEY, REDIS_URL)
- [ ] Worker e Scheduler avviati
- [ ] Health check funzionante
- [ ] Metriche endpoint accessibile
- [ ] Slack webhook configurato (opzionale)
- [ ] Prima automazione di test creata
- [ ] Monitoraggio attivo per prime 24h

---

*Documento creato: 2025-11-27*
*Versione: 1.0*
