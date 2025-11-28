# Keepa Queue System v2 - Development TODO

**Inizio progetto:** 2024-11-28
**Obiettivo:** Ricostruire il sistema automazioni seguendo la guida keepa-queue-guide con migliorie

---

## Stato Generale

| Fase | Descrizione | Status | Completato |
|------|-------------|--------|------------|
| FASE 0 | Multi-Tag Setup | 🔴 TODO | |
| FASE 1 | Types | 🔴 TODO | |
| FASE 2 | KeepaClient v2 | 🔴 TODO | |
| FASE 3 | Queue + Cache | 🔴 TODO | |
| FASE 4 | KeepaWorker v2 | 🔴 TODO | |
| FASE 5 | AutomationScheduler v2 | 🔴 TODO | |
| FASE 6 | KeepaPrefetch | 🔴 TODO | |
| FASE 7 | Integration | 🔴 TODO | |
| FASE 8 | Testing | 🔴 TODO | |
| FASE 9 | Cleanup | 🔴 TODO | |

**Legenda:** 🔴 TODO | 🟡 IN PROGRESS | 🟢 DONE | ⏸️ BLOCKED

---

## FASE 0: Multi-Tag Setup

> Permettere tag Amazon diversi per ogni canale

| # | Task | Status | Note |
|---|------|--------|------|
| 0.1 | Add `amazonTag` field to Channel schema | 🔴 | `amazonTag String?` in schema.prisma |
| 0.2 | Create Prisma migration | 🔴 | `npx prisma migrate dev --name add-amazon-tag-to-channel` |
| 0.3 | Update Channel API (GET/PUT) | 🔴 | Leggere/scrivere amazonTag |
| 0.4 | Update Step5Destination UI | 🔴 | Mostrare tag canale, permettere edit |
| 0.5 | Update tag resolution logic | 🔴 | `rule.override > channel.tag > user.default` |

### DEVLOG FASE 0
```
[DATA] - Note sviluppo...
```

---

## FASE 1: Types

> Creare interfacce TypeScript condivise

| # | Task | Status | Note |
|---|------|--------|------|
| 1.1 | Create `types/keepa.ts` | 🔴 | File principale types |
| 1.2 | Define core interfaces | 🔴 | QueueJob, WaitingRule, CachedCategory, UnionFilters, Config |

### Interfaces da creare:
```typescript
// types/keepa.ts
- KeepaQueueConfig
- QueueJob
- WaitingRule
- UnionFilters
- CachedCategory
- CacheStatus
- TokenMetrics
- QueueMetrics
```

### DEVLOG FASE 1
```
[DATA] - Note sviluppo...
```

---

## FASE 2: KeepaClient v2

> Refactoring client API Keepa con multi-priceType e buybox

| # | Task | Status | Note |
|---|------|--------|------|
| 2.1 | Refactor `fetchDeals` for 3 priceTypes | 🔴 | BuyBox(18), Amazon(0), New(1) |
| 2.2 | Add `calculateUnionFilters()` | 🔴 | Merge filtri da N regole |
| 2.3 | Add `verifyDealsWithBuybox()` | 🔴 | Product API con buybox=1 |
| 2.4 | Add ASIN deduplication | 🔴 | Set<string> across responses |

### Mapping Filtri AutomationRule → Keepa:
```
categories        → includeCategories: [id]
minDiscount       → deltaPercentRange: [min, 100]
minPrice/maxPrice → currentRange: [min*100, max*100]
minRating         → minRating: rating * 10
maxSalesRank      → salesRankRange: [0, max]
amazonOnly        → mustHaveAmazonOffer: true
```

### DEVLOG FASE 2
```
[DATA] - Note sviluppo...
```

---

## FASE 3: Queue + Cache

> Sistema coda Redis con priorità e cache collaborativo

| # | Task | Status | Note |
|---|------|--------|------|
| 3.1 | Fix `KeepaQueue.enqueueOrAttach()` | 🔴 | Gestione waitingRules[] |
| 3.2 | Implement `calculatePriority()` | 🔴 | urgency + cacheValue + plan |
| 3.3 | Add queue operations | 🔴 | dequeue, requeue, completeJob, peek |
| 3.4 | Implement `KeepaCache` Redis | 🔴 | Hash keepa:cache:{category} |
| 3.5 | Add `checkStatus()` | 🔴 | fresh/stale/expired/missing |
| 3.6 | Add cache operations | 🔴 | save, get, invalidate, isFresh |

### Redis Keys:
```
keepa:queue           - Sorted Set (priority)
keepa:pending:{cat}   - String (job dedup)
keepa:cache:{cat}     - Hash (deals + metadata)
keepa:tokens          - String (available)
keepa:stats           - Hash (metrics)
```

### DEVLOG FASE 3
```
[DATA] - Note sviluppo...
```

---

## FASE 4: KeepaWorker v2

> Worker principale che processa la coda

| # | Task | Status | Note |
|---|------|--------|------|
| 4.1 | Implement main `tick()` loop | 🔴 | setInterval 3 sec |
| 4.2 | Add `processQueue()` | 🔴 | Check token, peek, dequeue |
| 4.3 | Implement `executeJob()` | 🔴 | Keepa API → cache → notify |
| 4.4 | Add per-rule filtering | 🔴 | Applica filtri specifici |
| 4.5 | Integrate `ScoringEngine` | 🔴 | calculateDealScore + minScore |
| 4.6 | Implement `notifyWaitingRules()` | 🔴 | Filter → score → dedup → publish |
| 4.7 | Integrate `TelegramBotService` | 🔴 | sendDealToChannel |
| 4.8 | Add `ChannelDealHistory` dedup | 🔴 | Skip ASIN già pubblicati |

### Flusso executeJob:
```
1. Dequeue job
2. Call Keepa Deal API (3x priceTypes) = 15 token
3. Deduplica ASIN
4. Verifica top deals con Product API (buybox=1) = ~40 token
5. Salva in Redis cache
6. Per ogni waitingRule:
   - Applica filtri specifici
   - Calcola score con ScoringEngine
   - Filtra >= minScore
   - Check ChannelDealHistory (dedup)
   - Pubblica su Telegram
   - Salva in ChannelDealHistory
7. Update nextRunAt per ogni rule
```

### DEVLOG FASE 4
```
[DATA] - Note sviluppo...
```

---

## FASE 5: AutomationScheduler v2

> Scheduler che triggera le automazioni

| # | Task | Status | Note |
|---|------|--------|------|
| 5.1 | Query due AutomationRules | 🔴 | nextRunAt <= NOW, isActive |
| 5.2 | Group by category | 🔴 | Map<category, rules[]> |
| 5.3 | Calculate unionFilters | 🔴 | Per categoria |
| 5.4 | Cache check + enqueue/publish | 🔴 | Fresh → publish, Stale → enqueue |
| 5.5 | Update nextRunAt with jitter | 🔴 | Evita thundering herd |

### Flusso Scheduler:
```
Ogni minuto:
1. Query rules due
2. Raggruppa per categoria
3. Per ogni categoria:
   - Check Redis cache
   - SE fresh: pubblica subito per ogni rule
   - SE stale/missing: enqueueOrAttach(category, rules[])
```

### DEVLOG FASE 5
```
[DATA] - Note sviluppo...
```

---

## FASE 6: KeepaPrefetch

> Ottimizzazione tempo idle

| # | Task | Status | Note |
|---|------|--------|------|
| 6.1 | Implement idle detection | 🔴 | Queue vuota + token disponibili |
| 6.2 | Find upcoming automations | 🔴 | nextRunAt < NOW + 30min |
| 6.3 | Create prefetch jobs | 🔴 | Priority = 100 (bassa) |

### DEVLOG FASE 6
```
[DATA] - Note sviluppo...
```

---

## FASE 7: Integration

> Collegamento di tutti i componenti

| # | Task | Status | Note |
|---|------|--------|------|
| 7.1 | Update `app.ts` startup | 🔴 | Avvia Worker + Scheduler |
| 7.2 | Remove `keepa-populate-scheduler` | 🔴 | Non più necessario |
| 7.3 | Remove old scheduler conflicts | 🔴 | Pulisci automation-scheduler vecchio |
| 7.4 | Add `KeepaTokenLog` model | 🔴 | Analytics consumo token |

### DEVLOG FASE 7
```
[DATA] - Note sviluppo...
```

---

## FASE 8: Testing

> Validazione completa del sistema

| # | Task | Status | Note |
|---|------|--------|------|
| 8.1 | Single automation E2E | 🔴 | Crea → trigger → publish |
| 8.2 | Multi-rule same category | 🔴 | 3 rules → 1 job → 3 publish |
| 8.3 | Cache hit vs miss | 🔴 | Prima (miss) → seconda (hit) |
| 8.4 | Prefetch functionality | 🔴 | Idle → prefetch → use cache |
| 8.5 | ScoringEngine + minScore | 🔴 | Verifica calcolo e filtro |
| 8.6 | dealPublishMode variants | 🔴 | DISCOUNTED / LOWEST / BOTH |

### Test Checklist:
```
[ ] Automazione singola pubblica correttamente
[ ] Prezzo Telegram = prezzo Amazon (buybox)
[ ] Deduplicazione job funziona (1 chiamata Keepa per N rules)
[ ] Cache Redis si popola e viene usato
[ ] Score calcolato correttamente
[ ] minScore filtra correttamente
[ ] dealPublishMode DISCOUNTED_ONLY funziona
[ ] dealPublishMode LOWEST_PRICE funziona
[ ] dealPublishMode BOTH funziona
[ ] Keepa chart appare se abilitato
[ ] Short link tracciato correttamente
[ ] Multi-tag per canale funziona
[ ] Prefetch prepara cache in anticipo
```

### DEVLOG FASE 8
```
[DATA] - Note sviluppo...
```

---

## FASE 9: Cleanup

> Pulizia finale e deploy

| # | Task | Status | Note |
|---|------|--------|------|
| 9.1 | Remove dead code | 🔴 | AutomationQueueScheduler, RuleExecutor obsoleto |
| 9.2 | Update documentation | 🔴 | Aggiorna guide |
| 9.3 | Final build + deploy | 🔴 | Railway production |

### File da rimuovere/pulire:
```
[ ] apps/api/src/services/keepa/AutomationQueueScheduler.ts (parti obsolete)
[ ] apps/api/src/jobs/keepa-populate-scheduler.ts (tutto)
[ ] apps/api/src/services/RuleExecutor.ts (refactor o rimuovi)
[ ] Codice duplicato/morto vario
```

### DEVLOG FASE 9
```
[DATA] - Note sviluppo...
```

---

## Architettura Finale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AFFLYT PRO v2                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐   │
│  │  CRON SCHEDULER  │     │   KEEPA WORKER   │     │   PREFETCH     │   │
│  │    (1 min)       │     │    (3 sec)       │     │   (idle)       │   │
│  └────────┬─────────┘     └────────┬─────────┘     └───────┬────────┘   │
│           │                        │                       │            │
│           └────────────────────────┼───────────────────────┘            │
│                                    ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                           REDIS                                   │   │
│  │  keepa:queue | keepa:pending:{cat} | keepa:cache:{cat}           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      KEEPA API                                    │   │
│  │  Deal API (3x priceTypes) + Product API (buybox=1)               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     POSTGRESQL                                    │   │
│  │  AutomationRule | Channel | ChannelDealHistory | KeepaTokenLog   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Migliorie Incluse (vs guida originale)

| Area | Originale | Migliorato |
|------|-----------|------------|
| Price Types | Solo Amazon (0) | BuyBox(18) + Amazon(0) + New(1) |
| Pricing | stats.current[] | buyBoxPrice + buyBoxSavingBasis |
| Deal Mode | Non previsto | DISCOUNTED_ONLY / LOWEST_PRICE / BOTH |
| Keepa Chart | Non previsto | Opzione con proxy |
| Multi-Tag | Non previsto | Tag per canale + override |
| Scoring | Non previsto | ScoringEngine proprietario |
| Telegram | Placeholder | MarkdownV2 completo |
| Short Links | Non previsto | Tracking integrato |

---

## Note Tecniche

### Token Budget per Categoria
```
Deal API (3 priceTypes): 15 token
Product API (10 deals, buybox=1): 40 token
TOTALE: ~55 token per refresh categoria
```

### Con 20 token/min (piano base):
- 1200 token/ora
- ~22 refresh categoria/ora
- Con deduplicazione: molto più efficiente!

---

## Changelog

| Data | Versione | Modifiche |
|------|----------|-----------|
| 2024-11-28 | 0.0.1 | Creazione documento, piano iniziale |

---

*Ultimo aggiornamento: 2024-11-28*
