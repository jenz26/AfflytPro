# Afflyt Pro - Architettura Sistema Keepa

## Diagramma Generale

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AFFLYT PRO                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│  │   CRON       │     │   WORKER     │     │   PREFETCH   │        │
│  │  (1 min)     │     │  (3 sec)     │     │  (idle)      │        │
│  │              │     │              │     │              │        │
│  │ Trova auto-  │     │ Processa     │     │ Anticipa     │        │
│  │ mazioni due  │     │ coda jobs    │     │ refresh      │        │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘        │
│         │                    │                    │                 │
│         └────────────────────┼────────────────────┘                 │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                         REDIS                                  │ │
│  │                                                                │ │
│  │  keepa:queue          │ Sorted Set - job con priorità         │ │
│  │  keepa:pending:{cat}  │ String - job ID per categoria         │ │
│  │  keepa:cache:{cat}    │ Hash - dati deal per categoria        │ │
│  │  keepa:tokens         │ String - token disponibili            │ │
│  │  keepa:stats          │ Hash - metriche                       │ │
│  │                                                                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                     KEEPA SERVICE                              │ │
│  │                                                                │ │
│  │  - Rate limiting (20 token/min)                               │ │
│  │  - Chiamate Deal API (5 token)                                │ │
│  │  - Chiamate Product API (1 token/ASIN)                        │ │
│  │                                                                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                     POSTGRESQL                                 │ │
│  │                                                                │ │
│  │  Automation      │ Configurazione automazioni utente          │ │
│  │  User            │ Utenti e piani                             │ │
│  │  KeepaTokenLog   │ Storico consumo token (analytics)          │ │
│  │                                                                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Flusso: Automazione Triggera

```
                    CRON (ogni minuto)
                           │
                           ▼
            ┌─────────────────────────────┐
            │ SELECT * FROM automations   │
            │ WHERE nextRunAt <= NOW()    │
            │ AND isActive = true         │
            └─────────────────────────────┘
                           │
                           ▼
            ┌─────────────────────────────┐
            │ Raggruppa per categoria     │
            │ {                           │
            │   "Informatica": [A1, A2],  │
            │   "Casa": [A3]              │
            │ }                           │
            └─────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     ┌─────────────────┐       ┌─────────────────┐
     │ Check cache     │       │ Check cache     │
     │ "Informatica"   │       │ "Casa"          │
     └────────┬────────┘       └────────┬────────┘
              │                         │
      ┌───────┴───────┐         ┌───────┴───────┐
      ▼               ▼         ▼               ▼
   FRESCO          STALE     FRESCO          STALE
      │               │         │               │
      ▼               ▼         ▼               ▼
  Pubblica      Crea/Aggancia  Pubblica    Crea/Aggancia
  subito        a job          subito      a job
```

---

## Flusso: Worker Processa Job

```
                    WORKER (ogni 3 sec)
                           │
                           ▼
            ┌─────────────────────────────┐
            │ ZPOPMIN keepa:queue         │
            │ (job con priorità più alta) │
            └─────────────────────────────┘
                           │
                           ▼
            ┌─────────────────────────────┐
            │ tokenCost <= tokensAvailable│
            │ ?                           │
            └─────────────────────────────┘
                    │              │
                   YES            NO
                    │              │
                    ▼              ▼
            ┌──────────────┐  ┌──────────────┐
            │ Esegui job   │  │ Rimetti in   │
            │              │  │ coda, wait   │
            └──────┬───────┘  └──────────────┘
                   │
                   ▼
            ┌─────────────────────────────┐
            │ Keepa API call              │
            │ (Deal o Product)            │
            └─────────────────────────────┘
                   │
                   ▼
            ┌─────────────────────────────┐
            │ Salva in cache              │
            │ SET keepa:cache:{category}  │
            └─────────────────────────────┘
                   │
                   ▼
            ┌─────────────────────────────┐
            │ Per ogni automazione in     │
            │ waitingAutomations:         │
            │ - Applica filtri            │
            │ - Pubblica deal             │
            │ - Aggiorna nextRunAt        │
            └─────────────────────────────┘
                   │
                   ▼
            ┌─────────────────────────────┐
            │ DEL keepa:pending:{cat}     │
            │ Decrementa token            │
            │ Log stats                   │
            └─────────────────────────────┘
```

---

## Flusso: Pre-fetch Intelligente

```
                    PREFETCH (dopo worker)
                           │
                           ▼
            ┌─────────────────────────────┐
            │ Coda vuota?                 │
            │ Token disponibili?          │
            └─────────────────────────────┘
                    │              │
                   YES            NO
                    │              │
                    ▼              ▼
            ┌──────────────┐      EXIT
            │ Trova auto-  │
            │ mazioni che  │
            │ triggerano   │
            │ in <30 min   │
            └──────┬───────┘
                   │
                   ▼
            ┌─────────────────────────────┐
            │ Per ogni categoria:         │
            │ - Cache già fresca? Skip    │
            │ - Job già pending? Skip     │
            │ - Altrimenti: crea job      │
            │   con priorità BASSA (100)  │
            └─────────────────────────────┘
                   │
                   ▼
            ┌─────────────────────────────┐
            │ Job prefetch viene eseguito │
            │ solo se non arrivano job    │
            │ urgenti nel frattempo       │
            └─────────────────────────────┘
```

---

## Strutture Dati Redis

### keepa:queue (Sorted Set)

```
Score (priority) │ Member (job JSON)
─────────────────┼────────────────────────────────────────
15               │ {"id":"j1","category":"Informatica",...}
23               │ {"id":"j2","category":"Casa",...}
100              │ {"id":"j3","category":"Sport",...}  ← prefetch
```

Score più basso = priorità più alta.

### keepa:pending:{category} (String)

```
Key                        │ Value    │ TTL
───────────────────────────┼──────────┼─────
keepa:pending:Informatica  │ "j1"     │ 300s
keepa:pending:Casa         │ "j2"     │ 300s
```

Serve per deduplicazione: se esiste, non creiamo un nuovo job.

### keepa:cache:{category} (Hash)

```
Key                      │ Field      │ Value
─────────────────────────┼────────────┼─────────────────────
keepa:cache:Informatica  │ deals      │ [JSON array di deal]
                         │ updatedAt  │ 1732712400000
                         │ ttl        │ 3600000
```

### keepa:tokens (String)

```
Key           │ Value │ Note
──────────────┼───────┼─────────────────────────
keepa:tokens  │ 18    │ Aggiornato da response Keepa
```

### keepa:stats (Hash)

```
Key          │ Field              │ Value
─────────────┼────────────────────┼────────
keepa:stats  │ tokens_used_today  │ 4523
             │ jobs_processed     │ 892
             │ cache_hits         │ 1456
             │ cache_misses       │ 892
             │ last_tick_at       │ 1732712400000
```

---

## Schema Prisma (Aggiunte)

```prisma
// Logging consumo token per analytics
model KeepaTokenLog {
  id           String   @id @default(cuid())
  operation    String   // 'deal' | 'product'
  tokenCost    Int
  category     String?
  asins        String[] // Lista ASIN se product call
  jobId        String?
  success      Boolean
  responseTime Int      // ms
  createdAt    DateTime @default(now())

  @@index([createdAt])
  @@index([category])
}

// Estensione Automation esistente
model Automation {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  name        String
  isActive    Boolean  @default(true)
  
  // Scheduling
  intervalMinutes Int     // Ogni quanto triggerare
  nextRunAt       DateTime
  lastRunAt       DateTime?
  
  // Targeting
  category    String      // Categoria Amazon
  filters     Json        // {minDiscount, maxPrice, minRating, ...}
  
  // Output
  telegramChannelId String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([nextRunAt, isActive])
  @@index([category])
}
```

---

*Documento creato: 2025-11-27*
*Versione: 1.0*
