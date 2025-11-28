# Keepa Queue System v2 - Development TODO

**Inizio progetto:** 2024-11-28
**Obiettivo:** Ricostruire il sistema automazioni seguendo la guida keepa-queue-guide con migliorie

---

## Stato Generale

| Fase | Descrizione | Status | Completato |
|------|-------------|--------|------------|
| FASE 0 | Multi-Tag Setup | 🟢 DONE | 2024-11-28 |
| FASE 1 | Types | 🟢 DONE | 2024-11-28 |
| FASE 2 | KeepaClient v2 | 🟢 DONE | 2024-11-28 |
| FASE 3 | Queue + Cache | 🟢 DONE | 2024-11-28 |
| FASE 4 | KeepaWorker v2 | 🟢 DONE | 2024-11-28 |
| FASE 5 | AutomationScheduler v2 | 🟢 DONE | 2024-11-28 |
| FASE 6 | KeepaPrefetch | 🟢 DONE | 2024-11-28 |
| FASE 7 | Integration | 🟢 DONE | 2024-11-28 |
| FASE 8 | Testing | 🔴 TODO | |
| FASE 9 | Cleanup | 🟢 DONE | 2024-11-28 |

**Legenda:** 🔴 TODO | 🟡 IN PROGRESS | 🟢 DONE | ⏸️ BLOCKED

---

## FASE 0: Multi-Tag Setup

> Permettere tag Amazon diversi per ogni canale

| # | Task | Status | Note |
|---|------|--------|------|
| 0.1 | Add `amazonTag` field to Channel schema | 🟢 | Campo già presente in schema.prisma:279 |
| 0.2 | Create Prisma migration | 🟢 | `migrations/20241128_add_amazon_tag_to_channel/` |
| 0.3 | Update Channel API (GET/PUT) | 🟢 | Aggiunto in routes/channels.ts |
| 0.4 | Update Step5Destination UI | 🟢 | Mostra amazonTag per canale |
| 0.5 | Add amazonTag to Channel wizard | 🟢 | Input in Step 2 + riepilogo |
| 0.6 | Add amazonTag edit modal | 🟢 | Modal edit per canali esistenti |
| 0.7 | Update tag resolution logic | 🟢 | `resolveAmazonTag()` in types/keepa.ts |

### DEVLOG FASE 0
```
[2024-11-28] - Aggiunto campo amazonTag a Channel schema
[2024-11-28] - Creata migrazione SQL
[2024-11-28] - API channels supporta amazonTag in create/update
[2024-11-28] - Step5Destination mostra tag canale
[2024-11-28] - resolveAmazonTag implementato con priorità rule > channel > user
[2024-11-28] - Aggiunto campo amazonTag nel wizard creazione canale (Step 2)
[2024-11-28] - Aggiunto modal edit per modificare amazonTag su canali esistenti
[2024-11-28] - ChannelCard mostra amazonTag se presente
```

---

## FASE 1: Types

> Creare interfacce TypeScript condivise

| # | Task | Status | Note |
|---|------|--------|------|
| 1.1 | Create `types/keepa.ts` | 🟢 | File espanso con tutti i tipi |
| 1.2 | Define core interfaces | 🟢 | Tutti i tipi implementati |

### Interfaces create:
```typescript
// types/keepa.ts
- KeepaQueueConfig ✅
- QueueJob ✅
- WaitingRule ✅ (sostituisce WaitingAutomation)
- UnionFilters ✅
- CachedCategory ✅
- CacheStatus ✅
- TokenMetrics ✅
- QueueMetrics ✅
- KeepaProduct ✅ (nuovo - per Product API)
- KeepaOffer ✅
- ScoredDeal ✅
- DealPublishMode ✅
- TagResolution ✅
```

### DEVLOG FASE 1
```
[2024-11-28] - Espanso types/keepa.ts con tutti i nuovi tipi
[2024-11-28] - Aggiunto KeepaProduct per Product API response
[2024-11-28] - Aggiunto WaitingRule con tutti i campi necessari
[2024-11-28] - Aggiunto resolveAmazonTag helper function
```

---

## FASE 2: KeepaClient v2

> Refactoring client API Keepa con multi-priceType e buybox

| # | Task | Status | Note |
|---|------|--------|------|
| 2.1 | Refactor `fetchDeals` for 3 priceTypes | 🟢 | fetchDealsMultiPrice() |
| 2.2 | Add `calculateUnionFilters()` | 🟢 | Static method |
| 2.3 | Add `verifyDealsWithBuybox()` | 🟢 | Product API con buybox=1 |
| 2.4 | Add ASIN deduplication | 🟢 | Set<string> across responses |

### DEVLOG FASE 2
```
[2024-11-28] - Implementato fetchDealsMultiPrice con BuyBox(18), Amazon(0), New(1)
[2024-11-28] - calculateUnionFilters usa filtri più permissivi per efficienza cache
[2024-11-28] - verifyDealsWithBuybox estrae buyBoxPrice e buyBoxSavingBasis
[2024-11-28] - Deduplicazione ASIN integrata nel fetch multi-price
```

---

## FASE 3: Queue + Cache

> Sistema coda Redis con priorità e cache collaborativo

| # | Task | Status | Note |
|---|------|--------|------|
| 3.1 | Fix `KeepaQueue.enqueueOrAttach()` | 🟢 | Usa WaitingRule[] |
| 3.2 | Implement `calculatePriority()` | 🟢 | urgency + cacheValue + plan |
| 3.3 | Add queue operations | 🟢 | dequeue, requeue, completeJob, peek |
| 3.4 | Implement `KeepaCache` Redis | 🟢 | Hash keepa:cache:{category} |
| 3.5 | Add `checkStatus()` | 🟢 | Returns { status, data } |
| 3.6 | Add cache operations | 🟢 | save, get, invalidate, isFresh |

### DEVLOG FASE 3
```
[2024-11-28] - KeepaQueue usa WaitingRule invece di WaitingAutomation
[2024-11-28] - Priorità: urgency(0-30) + cacheValue(0-20) + plan(0-10)
[2024-11-28] - createPrefetchJob per job di prefetch a bassa priorità
[2024-11-28] - KeepaCache con checkStatus che ritorna fresh/stale/expired/missing
```

---

## FASE 4: KeepaWorker v2

> Worker principale che processa la coda

| # | Task | Status | Note |
|---|------|--------|------|
| 4.1 | Implement main `tick()` loop | 🟢 | setInterval 3 sec |
| 4.2 | Add `processQueue()` | 🟢 | Check token, peek, dequeue |
| 4.3 | Implement `executeJob()` | 🟢 | Cache check → Keepa API → notify |
| 4.4 | Add per-rule filtering | 🟢 | applyRuleFilters() |
| 4.5 | Integrate `ScoringEngine` | 🟢 | scoreDeals() con minScore |
| 4.6 | Implement `notifyWaitingRules()` | 🟢 | processRule per ogni waiter |
| 4.7 | Integrate `TelegramBotService` | 🟢 | publishDeals() |
| 4.8 | Add `ChannelDealHistory` dedup | 🟢 | isDuplicate + recordDealPublished |

### DEVLOG FASE 4
```
[2024-11-28] - Worker completamente riscritto in services/keepa/KeepaWorker.ts
[2024-11-28] - Cache HIT salta chiamata Keepa API
[2024-11-28] - filterByPublishMode per DISCOUNTED_ONLY/LOWEST_PRICE/BOTH
[2024-11-28] - Deduplicazione via ChannelDealHistory con TTL
[2024-11-28] - updateRuleStats con jitter per nextRunAt
```

---

## FASE 5: AutomationScheduler v2

> Scheduler che triggera le automazioni

| # | Task | Status | Note |
|---|------|--------|------|
| 5.1 | Query due AutomationRules | 🟢 | nextRunAt <= NOW, isActive |
| 5.2 | Group by category | 🟢 | Map<category, rules[]> |
| 5.3 | Calculate unionFilters | 🟢 | Via KeepaClient.calculateUnionFilters |
| 5.4 | Cache check + enqueue/publish | 🟢 | Log cache status prima di enqueue |
| 5.5 | Update nextRunAt with jitter | 🟢 | Nel Worker dopo publish |

### DEVLOG FASE 5
```
[2024-11-28] - AutomationScheduler riscritto in services/keepa/AutomationScheduler.ts
[2024-11-28] - Usa AutomationRule invece di Automation
[2024-11-28] - Cache check logga fresh/stale/missing
[2024-11-28] - enqueueOrAttach passa tutti i campi WaitingRule
```

---

## FASE 6: KeepaPrefetch

> Ottimizzazione tempo idle

| # | Task | Status | Note |
|---|------|--------|------|
| 6.1 | Implement idle detection | 🟢 | Queue vuota + token disponibili |
| 6.2 | Find upcoming automations | 🟢 | nextRunAt < NOW + 30min |
| 6.3 | Create prefetch jobs | 🟢 | Priority = 100 (bassa) |

### DEVLOG FASE 6
```
[2024-11-28] - KeepaPrefetch aggiornato per usare WaitingRule
[2024-11-28] - runIfIdle chiamato periodicamente da app.ts
[2024-11-28] - createPrefetchJob con formattedRules completo
```

---

## FASE 7: Integration

> Collegamento di tutti i componenti

| # | Task | Status | Note |
|---|------|--------|------|
| 7.1 | Update `app.ts` startup | 🟢 | Avvia Worker + Scheduler + Prefetch |
| 7.2 | Disable `keepa-populate-scheduler` | 🟢 | Commentato in app.ts |
| 7.3 | Disable old scheduler conflicts | 🟢 | automation-scheduler.ts disabilitato |
| 7.4 | Add `KeepaTokenLog` model | 🟢 | Già esistente in schema |

### DEVLOG FASE 7
```
[2024-11-28] - app.ts avvia KeepaWorker + AutomationScheduler + KeepaPrefetch
[2024-11-28] - startKeepaPopulateScheduler commentato
[2024-11-28] - startAutomationScheduler commentato (conflitto con nuovo)
[2024-11-28] - Graceful shutdown implementato
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
| 9.1 | Remove dead code | 🟢 | Vecchio worker e scheduler rimossi |
| 9.2 | Update documentation | 🟢 | TODO aggiornato |
| 9.3 | Final build + deploy | 🔴 | Railway production |

### File modificati/rimossi:
```
[✅] apps/api/src/workers/keepaWorker.ts - RIMOSSO (vecchio)
[✅] apps/api/src/services/keepa/AutomationQueueScheduler.ts - RIMOSSO (vecchio)
[✅] apps/api/src/jobs/automation-scheduler.ts - DISABILITATO
[✅] apps/api/src/jobs/keepa-populate-scheduler.ts - DISABILITATO
[  ] apps/api/src/services/RuleExecutor.ts - MANTENUTO per compat
```

### DEVLOG FASE 9
```
[2024-11-28] - Rimosso workers/keepaWorker.ts (vecchio)
[2024-11-28] - Rimosso AutomationQueueScheduler.ts (vecchio)
[2024-11-28] - Disabilitato startAutomationScheduler in app.ts
[2024-11-28] - Disabilitato startKeepaPopulateScheduler in app.ts
[2024-11-28] - Build TypeScript passa senza errori
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
│  │    (1 min)       │     │    (3 sec)       │     │   (30 sec)     │   │
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
Product API (20 deals, buybox=1): 40 token
TOTALE: ~55 token per refresh categoria
```

### Con 20 token/min (piano base):
- 1200 token/ora
- ~22 refresh categoria/ora
- Con deduplicazione: molto più efficiente!

---

## Prossimi Step per Deploy

1. **Applicare migrazione Prisma**:
   ```bash
   cd apps/api && npx prisma migrate deploy
   ```

2. **Verificare variabili ambiente**:
   - `REDIS_URL` - URL Redis server
   - `KEEPA_API_KEY` - Chiave API Keepa
   - `ENCRYPTION_SECRET` - Per decrypt bot token

3. **Deploy su Railway**:
   ```bash
   git push origin master
   ```

4. **Verificare logs**:
   - `[Keepa v2] Starting queue system...`
   - `[AutomationScheduler] Started`
   - `[KeepaWorker] Started`

---

## Changelog

| Data | Versione | Modifiche |
|------|----------|-----------|
| 2024-11-28 | 0.0.1 | Creazione documento, piano iniziale |
| 2024-11-28 | 1.0.0 | Implementazione completa FASE 0-7, 9 |

---

*Ultimo aggiornamento: 2024-11-28*
