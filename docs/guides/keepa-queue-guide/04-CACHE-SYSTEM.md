# Afflyt Pro - Sistema Cache Collaborativo

## Principio Fondamentale

Il cache è **collaborativo**: quando un'automazione refresha una categoria, tutte le altre automazioni sulla stessa categoria beneficiano del dato aggiornato.

```
User A: Automazione "Informatica" → refresh → salva in cache
User B: Automazione "Informatica" → trova cache fresco → usa subito
User C: Automazione "Informatica" → trova cache fresco → usa subito

1 chiamata Keepa, 3 automazioni servite
```

---

## Struttura Cache

### Redis Key Pattern

```
keepa:cache:{category}
```

Esempio: `keepa:cache:Informatica`, `keepa:cache:Casa e cucina`

### Dati Cachati

```typescript
interface CachedCategory {
  deals: Deal[]           // Lista deal dalla Deal API
  updatedAt: number       // Timestamp ultimo refresh
  ttl: number             // TTL in millisecondi
  source: 'automation' | 'prefetch'  // Chi ha triggerato il refresh
}

interface Deal {
  asin: string
  title: string
  imageUrl: string
  currentPrice: number
  originalPrice: number
  discountPercent: number
  category: string
  rating?: number
  reviewCount?: number
  isPrime: boolean
  availabilityType: string
  dealEndDate?: Date
  // ... altri campi da Keepa
}
```

### TTL Configurazione

```typescript
const CACHE_CONFIG = {
  // TTL uguale per tutti i piani
  TTL_MS: 60 * 60 * 1000,  // 1 ora
  
  // Soglia per considerare cache "fresco"
  FRESH_THRESHOLD_MS: 30 * 60 * 1000,  // 30 minuti
  
  // Sotto questa soglia, il cache è "stale" ma usabile
  STALE_THRESHOLD_MS: 60 * 60 * 1000,  // 1 ora
  
  // Oltre questa soglia, cache scaduto (non usare)
  EXPIRED_THRESHOLD_MS: 2 * 60 * 60 * 1000  // 2 ore
}
```

---

## Operazioni Cache

### Controllare Freschezza

```typescript
type CacheStatus = 'fresh' | 'stale' | 'expired' | 'missing'

async function checkCacheStatus(
  category: string,
  redis: Redis
): Promise<{status: CacheStatus, data: CachedCategory | null}> {
  
  const cached = await redis.hgetall(`keepa:cache:${category}`)
  
  if (!cached || !cached.deals) {
    return { status: 'missing', data: null }
  }
  
  const data: CachedCategory = {
    deals: JSON.parse(cached.deals),
    updatedAt: parseInt(cached.updatedAt),
    ttl: parseInt(cached.ttl),
    source: cached.source as 'automation' | 'prefetch'
  }
  
  const age = Date.now() - data.updatedAt
  
  if (age < CACHE_CONFIG.FRESH_THRESHOLD_MS) {
    return { status: 'fresh', data }
  }
  
  if (age < CACHE_CONFIG.STALE_THRESHOLD_MS) {
    return { status: 'stale', data }
  }
  
  if (age < CACHE_CONFIG.EXPIRED_THRESHOLD_MS) {
    return { status: 'expired', data }
  }
  
  // Troppo vecchio, considera missing
  return { status: 'missing', data: null }
}
```

### Salvare in Cache

```typescript
async function saveToCache(
  category: string,
  deals: Deal[],
  source: 'automation' | 'prefetch',
  redis: Redis
): Promise<void> {
  
  const data: CachedCategory = {
    deals,
    updatedAt: Date.now(),
    ttl: CACHE_CONFIG.TTL_MS,
    source
  }
  
  await redis.hset(`keepa:cache:${category}`, {
    deals: JSON.stringify(deals),
    updatedAt: data.updatedAt.toString(),
    ttl: data.ttl.toString(),
    source
  })
  
  // Imposta TTL Redis per auto-cleanup
  await redis.expire(
    `keepa:cache:${category}`,
    Math.ceil(CACHE_CONFIG.EXPIRED_THRESHOLD_MS / 1000)
  )
  
  // Aggiorna stats
  await redis.hincrby('keepa:stats', 'cache_writes', 1)
}
```

### Leggere da Cache

```typescript
async function getFromCache(
  category: string,
  redis: Redis
): Promise<Deal[] | null> {
  
  const { status, data } = await checkCacheStatus(category, redis)
  
  if (status === 'missing') {
    await redis.hincrby('keepa:stats', 'cache_misses', 1)
    return null
  }
  
  await redis.hincrby('keepa:stats', 'cache_hits', 1)
  return data!.deals
}
```

---

## Logica Decisionale

### Quando Usare Cache vs Refresh

```typescript
async function decideAction(
  category: string,
  redis: Redis
): Promise<'use_cache' | 'queue_refresh' | 'queue_refresh_use_stale'> {
  
  const { status, data } = await checkCacheStatus(category, redis)
  
  switch (status) {
    case 'fresh':
      // Cache perfetto, usa subito
      return 'use_cache'
    
    case 'stale':
      // Cache usabile ma vecchiotto
      // Usa ora, ma schedula refresh per prossima volta
      return 'queue_refresh_use_stale'
    
    case 'expired':
    case 'missing':
      // Serve refresh prima di usare
      return 'queue_refresh'
  }
}
```

### Flusso Completo Automazione

```typescript
async function handleAutomationTrigger(
  automation: Automation,
  redis: Redis,
  prisma: PrismaClient
): Promise<void> {
  
  const action = await decideAction(automation.category, redis)
  
  switch (action) {
    case 'use_cache':
      // Cache fresco, pubblica subito
      const deals = await getFromCache(automation.category, redis)
      const filtered = applyFilters(deals!, automation.filters)
      await publishDeals(automation, filtered)
      await updateNextRun(automation, prisma)
      break
    
    case 'queue_refresh_use_stale':
      // Usa cache stale ora, ma accoda refresh
      const staleDeals = await getFromCache(automation.category, redis)
      const staleFiltered = applyFilters(staleDeals!, automation.filters)
      await publishDeals(automation, staleFiltered)
      await updateNextRun(automation, prisma)
      
      // Accoda refresh per le prossime automazioni
      // (non aspettiamo, il refresh sarà pronto per la prossima volta)
      await enqueueRefreshIfNotPending(automation.category, redis)
      break
    
    case 'queue_refresh':
      // Serve refresh, automazione aspetta
      await enqueueOrAttach(automation.category, automation, redis)
      // La pubblicazione avverrà quando il job completa
      break
  }
}
```

---

## Applicazione Filtri

Ogni automazione ha filtri specifici. Il cache contiene TUTTI i deal, i filtri si applicano al momento della pubblicazione.

```typescript
function applyFilters(deals: Deal[], filters: AutomationFilters): Deal[] {
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
    
    // Keyword escluse nel titolo
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
```

### Ordinamento e Limite

```typescript
function selectDealsToPublish(
  deals: Deal[],
  automation: Automation
): Deal[] {
  // Ordina per sconto (migliori prima)
  const sorted = [...deals].sort((a, b) => b.discountPercent - a.discountPercent)
  
  // Limita al numero massimo per pubblicazione
  const limit = automation.maxDealsPerPost || 5
  return sorted.slice(0, limit)
}
```

---

## Invalidazione Cache

### Quando Invalidare

Il cache si invalida automaticamente via TTL Redis. Non serve invalidazione manuale in casi normali.

Casi eccezionali che potrebbero richiedere invalidazione:

```typescript
// Invalida cache specifico (es. categoria eliminata)
async function invalidateCategory(category: string, redis: Redis): Promise<void> {
  await redis.del(`keepa:cache:${category}`)
  await redis.del(`keepa:pending:${category}`)
}

// Invalida tutto (es. manutenzione)
async function invalidateAllCache(redis: Redis): Promise<void> {
  const keys = await redis.keys('keepa:cache:*')
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
```

---

## Metriche Cache

```typescript
interface CacheMetrics {
  totalCategories: number
  freshCategories: number
  staleCategories: number
  hitRate: number        // cache_hits / (cache_hits + cache_misses)
  avgAge: number         // Età media dei cache in secondi
}

async function getCacheMetrics(redis: Redis): Promise<CacheMetrics> {
  const keys = await redis.keys('keepa:cache:*')
  
  let fresh = 0
  let stale = 0
  let totalAge = 0
  
  for (const key of keys) {
    const updatedAt = await redis.hget(key, 'updatedAt')
    if (updatedAt) {
      const age = Date.now() - parseInt(updatedAt)
      totalAge += age
      
      if (age < CACHE_CONFIG.FRESH_THRESHOLD_MS) {
        fresh++
      } else {
        stale++
      }
    }
  }
  
  const stats = await redis.hgetall('keepa:stats')
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
```

---

## Ottimizzazioni Future

### 1. Cache Gerarchico

Se una categoria padre viene refreshata, potrebbe invalidare/aggiornare le sotto-categorie.

### 2. TTL Dinamico

Categorie più "trafficate" potrebbero avere TTL più corto perché vengono refreshate comunque spesso.

### 3. Warm-up Cache

Al startup, pre-popolare le categorie più usate basandosi su storico.

---

*Documento creato: 2025-11-27*
*Versione: 1.0*
