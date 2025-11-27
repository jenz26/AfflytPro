# Afflyt Pro - Pre-fetch Intelligente

## Obiettivo

**Zero token sprecati.** Quando non ci sono job urgenti, usiamo i token disponibili per preparare i dati che serviranno a breve.

```
Scenario tipico: sono le 3 di notte

- Nessuna automazione triggerata
- 20 token disponibili che si rigenerano ogni minuto
- Automazioni che triggerano alle 7:00, 8:00, 9:00

Senza prefetch: token sprecati tutta la notte
Con prefetch: alle 6:30 inizia a preparare i dati per le 7:00
```

---

## Logica Pre-fetch

### Quando Attivare

Il pre-fetch si attiva solo quando:

1. **Coda vuota** - Nessun job urgente in attesa
2. **Token disponibili** - Almeno abbastanza per un'operazione
3. **Automazioni in arrivo** - Ci sono automazioni che triggerano nelle prossime X minuti

```typescript
const PREFETCH_CONFIG = {
  // Finestra temporale per considerare automazioni "in arrivo"
  LOOKAHEAD_MINUTES: 30,
  
  // Priorità dei job prefetch (alta = bassa priorità)
  PREFETCH_PRIORITY: 100,
  
  // Massimo prefetch jobs da creare in un tick
  MAX_PREFETCH_PER_TICK: 1,
  
  // Minimo token per tentare prefetch
  MIN_TOKENS_FOR_PREFETCH: 5
}
```

### Flusso Pre-fetch

```typescript
async function prefetchIfIdle(
  redis: Redis,
  prisma: PrismaClient
): Promise<void> {
  
  // 1. Controlla se la coda è vuota
  const queueDepth = await redis.zcard('keepa:queue')
  if (queueDepth > 0) {
    // C'è lavoro urgente, non prefetchare
    return
  }
  
  // 2. Controlla token disponibili
  const tokens = await getAvailableTokens(redis)
  if (tokens < PREFETCH_CONFIG.MIN_TOKENS_FOR_PREFETCH) {
    return
  }
  
  // 3. Trova automazioni che triggerano presto
  const lookaheadEnd = new Date(
    Date.now() + PREFETCH_CONFIG.LOOKAHEAD_MINUTES * 60 * 1000
  )
  
  const upcomingAutomations = await prisma.automation.findMany({
    where: {
      isActive: true,
      nextRunAt: {
        gt: new Date(),
        lte: lookaheadEnd
      }
    },
    include: {
      user: true
    },
    orderBy: {
      nextRunAt: 'asc'
    }
  })
  
  if (upcomingAutomations.length === 0) {
    return
  }
  
  // 4. Raggruppa per categoria
  const byCategory = groupBy(upcomingAutomations, a => a.category)
  
  // 5. Per ogni categoria, valuta se serve prefetch
  let prefetchCreated = 0
  
  for (const [category, automations] of Object.entries(byCategory)) {
    if (prefetchCreated >= PREFETCH_CONFIG.MAX_PREFETCH_PER_TICK) {
      break  // Un prefetch alla volta
    }
    
    // Cache già fresca? Skip
    const { status } = await checkCacheStatus(category, redis)
    if (status === 'fresh') {
      continue
    }
    
    // Job già pending per questa categoria? Skip
    const pending = await redis.get(`keepa:pending:${category}`)
    if (pending) {
      continue
    }
    
    // Crea job prefetch
    await createPrefetchJob(category, automations, redis)
    prefetchCreated++
  }
}
```

### Creazione Job Prefetch

```typescript
async function createPrefetchJob(
  category: string,
  automations: Automation[],
  redis: Redis
): Promise<string> {
  
  const job: QueueJob = {
    id: generateId(),
    type: 'deal_search',
    category,
    tokenCost: 5,
    createdAt: new Date(),
    isPrefetch: true,
    priority: PREFETCH_CONFIG.PREFETCH_PRIORITY,
    waitingAutomations: automations.map(a => ({
      automationId: a.id,
      userId: a.userId,
      userPlan: a.user.plan,
      filters: a.filters,
      triggersAt: a.nextRunAt
    }))
  }
  
  await redis.zadd('keepa:queue', job.priority, JSON.stringify(job))
  await redis.set(`keepa:pending:${category}`, job.id, 'EX', 1800)  // 30 min TTL
  
  // Log per debug
  console.log(`[Prefetch] Created job for ${category}, ` +
    `${automations.length} automations due in next 30min`)
  
  return job.id
}
```

---

## Priorità dei Prefetch

I job prefetch hanno **priorità 100**, molto più alta (= meno urgente) dei job normali che hanno priorità 0-50.

Questo significa:

1. Se arriva un job urgente, il prefetch viene "saltato"
2. Il prefetch viene eseguito solo quando non c'è altro da fare
3. Non blocca mai le operazioni degli utenti

```
Coda:
├── [Priority 10] Job normale - Informatica (user triggera tra 2 min)
├── [Priority 25] Job normale - Casa (user triggera tra 10 min)
└── [Priority 100] Prefetch - Sport (automazione tra 25 min)

Worker prende: Priority 10 → Priority 25 → Priority 100
Se arriva nuovo job a Priority 5, passa davanti a tutti
```

---

## Quando il Prefetch Diventa Job Normale

Se un'automazione triggera mentre c'è un prefetch pending per quella categoria, il prefetch "si trasforma" in job normale:

```typescript
async function enqueueOrAttach(
  category: string,
  automation: Automation,
  redis: Redis
): Promise<string> {
  
  const existingJobId = await redis.get(`keepa:pending:${category}`)
  
  if (existingJobId) {
    // C'è già un job (potrebbe essere prefetch)
    const jobsWithScores = await redis.zrangebyscore(
      'keepa:queue',
      '-inf',
      '+inf',
      'WITHSCORES'
    )
    
    // Trova il job
    for (let i = 0; i < jobsWithScores.length; i += 2) {
      const job: QueueJob = JSON.parse(jobsWithScores[i])
      
      if (job.id === existingJobId) {
        // Aggiungi automazione ai waiters
        job.waitingAutomations.push({
          automationId: automation.id,
          userId: automation.userId,
          userPlan: automation.user.plan,
          filters: automation.filters,
          triggersAt: automation.nextRunAt
        })
        
        // ERA un prefetch? Ora diventa job normale
        if (job.isPrefetch) {
          job.isPrefetch = false
        }
        
        // Ricalcola priorità (ora più alta perché c'è un trigger reale)
        job.priority = calculatePriority(job)
        
        // Aggiorna in Redis
        await redis.zrem('keepa:queue', jobsWithScores[i])
        await redis.zadd('keepa:queue', job.priority, JSON.stringify(job))
        
        return existingJobId
      }
    }
  }
  
  // Se non trovato, crea nuovo job (logica normale)
  // ...
}
```

---

## Scenari di Utilizzo

### Scenario 1: Notte Tranquilla

```
23:00 - Ultima automazione del giorno completa
23:01 - Coda vuota, worker idle
23:02 - Prefetch controlla: automazioni domani alle 7:00
        → Troppo lontane (>30 min), niente prefetch

... notte ...

06:30 - Prefetch controlla: automazioni alle 7:00
        → Categoria "Informatica" ha 3 automazioni
        → Cache stale (ultimo refresh ieri sera)
        → Crea job prefetch
06:31 - Worker processa prefetch
        → Chiama Keepa, salva cache
        → Le 3 automazioni sono già nei waiters
06:32 - Cache pronto per le 7:00

07:00 - Automazioni triggerano
        → Cache fresco (aggiornato 30 min fa)
        → Pubblicazione istantanea, zero attesa
```

### Scenario 2: Prefetch Interrotto

```
03:00 - Prefetch crea job per "Sport" (automazione alle 03:25)
        → Priority 100
03:01 - Job in coda, non ancora processato
03:02 - User triggera manualmente automazione "Casa"
        → Crea job priority 15
        → Passa davanti al prefetch
03:03 - Worker processa "Casa" (priority 15)
03:04 - Worker processa "Sport" (priority 100)
        → Prefetch completato, ma dopo il job urgente
```

### Scenario 3: Prefetch Convertito

```
03:00 - Prefetch crea job per "Informatica" (priority 100)
03:01 - User A ha automazione che triggera ORA su "Informatica"
        → Si aggancia al job prefetch esistente
        → Job diventa isPrefetch=false
        → Priority ricalcolata: ora è 12 (urgente)
03:02 - Worker processa subito (priority 12)
        → Sia il prefetch che l'automazione serviti
```

---

## Metriche Prefetch

```typescript
interface PrefetchMetrics {
  prefetchJobsCreated: number      // Oggi
  prefetchJobsCompleted: number    // Oggi
  prefetchJobsConverted: number    // Diventati job normali
  prefetchTokensUsed: number       // Token usati per prefetch
  prefetchCacheHitsEnabled: number // Cache hit grazie a prefetch
}

async function getPrefetchMetrics(redis: Redis): Promise<PrefetchMetrics> {
  const stats = await redis.hgetall('keepa:stats:prefetch')
  
  return {
    prefetchJobsCreated: parseInt(stats?.created || '0'),
    prefetchJobsCompleted: parseInt(stats?.completed || '0'),
    prefetchJobsConverted: parseInt(stats?.converted || '0'),
    prefetchTokensUsed: parseInt(stats?.tokens || '0'),
    prefetchCacheHitsEnabled: parseInt(stats?.cache_hits || '0')
  }
}
```

---

## Configurazione Avanzata

### Prefetch Aggressivo (più token, più preparazione)

```typescript
const AGGRESSIVE_PREFETCH = {
  LOOKAHEAD_MINUTES: 60,        // Guarda 1 ora avanti
  MAX_PREFETCH_PER_TICK: 3,     // Fino a 3 prefetch per tick
  MIN_TOKENS_FOR_PREFETCH: 10   // Serve più margine
}
```

### Prefetch Conservativo (risparmia token)

```typescript
const CONSERVATIVE_PREFETCH = {
  LOOKAHEAD_MINUTES: 15,        // Solo prossimi 15 min
  MAX_PREFETCH_PER_TICK: 1,     // Un prefetch alla volta
  MIN_TOKENS_FOR_PREFETCH: 15   // Solo se abbondano token
}
```

### Prefetch Disabilitato

```typescript
const NO_PREFETCH = {
  LOOKAHEAD_MINUTES: 0,         // Disabilita
  MAX_PREFETCH_PER_TICK: 0
}
```

---

## Considerazioni

### Pro del Prefetch

- Utilizza token che andrebbero sprecati
- Riduce latenza per le automazioni
- Il sistema lavora sempre, mai idle
- Migliora UX (pubblicazione istantanea)

### Contro del Prefetch

- Leggera complessità in più
- Se i pattern cambiano, potrebbe prefetchare cose inutili
- Consuma token che potrebbero servire per spike improvvisi

### Raccomandazione

Inizia con **configurazione conservativa** (15 min lookahead, 1 prefetch per tick). Monitora le metriche e aumenta se vedi che funziona bene.

---

*Documento creato: 2025-11-27*
*Versione: 1.0*
