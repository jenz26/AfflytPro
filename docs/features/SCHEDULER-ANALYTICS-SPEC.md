# Scheduler & Analytics Enhancement - Feature Specification

> **Documento di tracking per lo sviluppo della feature Scheduler e integrazione Analytics**
>
> Ultimo aggiornamento: 2025-01-30
> Revisione: v2.0 - Integrati feedback review

---

## 📋 INDICE

1. [Overview](#overview)
2. [Stato Attuale](#stato-attuale)
3. [Scheduler - Nuova Pagina](#scheduler---nuova-pagina)
4. [Conflict Detection & Guardrails](#conflict-detection--guardrails)
5. [Analytics - Integrazioni](#analytics---integrazioni)
6. [Tracking & Metriche](#tracking--metriche)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [UI Components](#ui-components)
10. [Sicurezza](#sicurezza)
11. [LLM Generation Settings](#llm-generation-settings)
12. [Checklist Implementazione](#checklist-implementazione)
13. [Note Tecniche](#note-tecniche)
14. [Dipendenze](#dipendenze)
15. [Metriche di Successo](#metriche-di-successo)

---

## Overview

Trasformare Afflyt da "tool per deal" a **piattaforma completa di channel management** attraverso:

1. **Scheduler** - Nuova pagina per programmazione contenuti non-deal
2. **Analytics Enhancement** - Nuove metriche derivate dallo Scheduler
3. **PostHog Integration** - Eventi per product analytics

---

## Stato Attuale

### ✅ Già Implementato

| Componente | File | Stato |
|------------|------|-------|
| Analytics Page | `apps/web/app/[locale]/dashboard/analytics/page.tsx` | ✅ Completo |
| KPI Cards | Revenue, Clicks, CVR, EPC | ✅ Funzionante |
| Revenue Chart | Time series clicks + revenue | ✅ Funzionante |
| Channel Breakdown | Performance per canale | ✅ Funzionante |
| Top Links Table | Top 5 deal performer | ✅ Funzionante |
| Time Heatmap | Best hour/day analysis | ✅ Funzionante |
| Product Analytics | Per categoria/prezzo | ✅ Funzionante |
| AI Insights | PRO only, con score | ✅ Funzionante |
| PostHog Provider | `apps/web/components/analytics/PostHogProvider.tsx` | ✅ Configurato |
| Short Link Tracking | Click tracking via `/r/` redirect | ✅ Funzionante |

### ❌ Da Implementare

| Componente | Priorità | Complessità |
|------------|----------|-------------|
| Scheduler Page | 🔴 Alta | Media |
| Scheduler API | 🔴 Alta | Media |
| Scheduler Worker (BullMQ) | 🔴 Alta | Media |
| Bounty Link Tracking | 🟡 Media | Bassa |
| Scheduler Analytics Tab | 🟡 Media | Bassa |
| PostHog Scheduler Events | 🟢 Bassa | Bassa |

---

## Scheduler - Nuova Pagina

### Posizionamento UI

```
Navbar: Dashboard | Analytics | Automazioni | Scheduler | Canali
                                              ^^^^^^^^^^
                                              NUOVA PAGINA
```

### Tipi di Programmazione

| Tipo | Icona | Descrizione | Frequenza | Complessità | Fase |
|------|-------|-------------|-----------|-------------|------|
| **Custom** | ✏️ | Testo libero programmato | Custom | Bassa | MVP |
| **Bounty Ads** | 💳 | Link bounty Amazon (Prime, Audible, Music, Kindle) | Giornaliera/Settimanale | Bassa | MVP |
| **Recap Offerte** | 📊 | Top 5/10 deal delle ultime 24h con LLM | Giornaliera | Media | v2 |
| **Cross Promotion** | 🔀 | Promozione altri canali del network | Ogni X giorni | Bassa | v2 |
| **Welcome Post** | 👋 | Benvenuto ai nuovi iscritti | Settimanale | Bassa | v2 |
| **Post Sponsorizzati** | 📢 | Contenuti brand/sponsor | Custom | Bassa | v3 |

### Bounty Types Supportati

| Bounty | URL Base | Tag Affiliato | Commissione Tipica |
|--------|----------|---------------|-------------------|
| Amazon Prime | `amazon.it/prime?tag=` | `{userTag}` | €3/iscrizione |
| Audible | `amazon.it/audible?tag=` | `{userTag}` | €5/trial |
| Kindle Unlimited | `amazon.it/kindle-unlimited?tag=` | `{userTag}` | €3/trial |
| Amazon Music | `amazon.it/music?tag=` | `{userTag}` | €3/trial |
| Custom | User defined | User defined | Variable |

### Settings per Tipo

```typescript
// ==================== BOUNTY SETTINGS ====================
interface BountySettings {
  bountyType: 'PRIME' | 'AUDIBLE' | 'MUSIC' | 'KINDLE' | 'CUSTOM';
  bountyUrl: string;           // URL completo con tag
  customTag?: string;          // Per CUSTOM type
  copyStyle: 'casual' | 'professional' | 'urgent';
  useEmoji: boolean;
  minHoursBetween: number;     // Anti-spam (default: 24)
  generateWithLLM: boolean;    // Genera copy con AI
}

// ==================== RECAP SETTINGS ====================
interface RecapSettings {
  maxDeals: 5 | 10 | 15;
  categories: string[];        // Filtro categorie (vuoto = tutte)
  sortBy: 'score' | 'discount' | 'clicks' | 'recent';
  minScore: number;            // Score minimo per inclusione
  includeImages: boolean;
  headerTemplate: string;      // Template header (con variabili)
  footerTemplate: string;      // Template footer
}

// ==================== CROSS PROMO SETTINGS ====================
interface CrossPromoSettings {
  targetChannels: string[];    // Channel IDs da promuovere (min 2 per rotation)
  rotationMode: 'sequential' | 'random' | 'weighted';
  weights?: Record<string, number>;  // Per weighted mode
  copyVariants: string[];      // Varianti copy per A/B
  excludeCurrentChannel: boolean;
}

// Cross Promo Guardrails (anti-spam Telegram)
const CROSS_PROMO_LIMITS = {
  minHoursBetween: 72,           // Telegram penalizza spam
  maxPerWeek: 2,                 // User fatigue prevention
  neverSameChannelTwice: true,   // Rotazione obbligatoria
  minTargetChannels: 2,          // Per rotation mode
};

// ==================== WELCOME SETTINGS ====================
interface WelcomeSettings {
  messageTemplate: string;
  includeLinks: boolean;
  bountyLink?: string;
  otherChannels: string[];     // Canali da promuovere
  showRules: boolean;          // Mostra regole canale
}

// ==================== CUSTOM SETTINGS ====================
interface CustomSettings {
  mediaType: 'none' | 'image' | 'video';
  mediaUrl?: string;
  buttons?: Array<{
    text: string;
    url: string;
  }>;
  parseMode: 'HTML' | 'Markdown';
}
```

---

## Conflict Detection & Guardrails

### Deal vs Scheduled Post Conflicts

Quando lo Scheduler vuole pubblicare ma c'è un deal in coda o appena pubblicato:

```typescript
// Conflict Detection Settings (per ScheduledPost)
interface ConflictSettings {
  skipIfDealPending: boolean;     // Default: true - salta se deal in coda
  bufferMinutes: number;          // Default: 10 - minuti di buffer
  rescheduleOnConflict: boolean;  // Default: false - riprogramma invece di skip
  maxRescheduleMinutes: number;   // Default: 60 - max ritardo riprogrammazione
}

// Conflict Check Flow
async function checkConflict(scheduledPost: ScheduledPost): Promise<ConflictResult> {
  const channelId = scheduledPost.channelId;
  const bufferMinutes = scheduledPost.settings?.conflict?.bufferMinutes || 10;

  // Check 1: Deal pubblicato negli ultimi N minuti?
  const recentDeal = await prisma.affiliateLink.findFirst({
    where: {
      channelId,
      createdAt: { gte: subMinutes(new Date(), bufferMinutes) },
      linkType: 'DEAL'
    }
  });

  // Check 2: Deal in coda per i prossimi N minuti?
  const pendingDeal = await prisma.keepaQueueItem.findFirst({
    where: {
      channelId,
      status: 'PENDING',
      scheduledFor: { lte: addMinutes(new Date(), bufferMinutes) }
    }
  });

  if (recentDeal || pendingDeal) {
    return {
      hasConflict: true,
      reason: recentDeal ? 'RECENT_DEAL' : 'PENDING_DEAL',
      conflictingItem: recentDeal || pendingDeal
    };
  }

  return { hasConflict: false };
}
```

### Execution Status Estesi

```typescript
enum ExecutionStatus {
  PENDING           = 'PENDING',           // In coda
  RUNNING           = 'RUNNING',           // In esecuzione
  SUCCESS           = 'SUCCESS',           // Completato con successo
  FAILED            = 'FAILED',            // Fallito
  SKIPPED_CONFLICT  = 'SKIPPED_CONFLICT',  // Saltato per conflitto con deal
  SKIPPED_RATE_LIMIT = 'SKIPPED_RATE_LIMIT', // Saltato per rate limit
  SKIPPED_CHANNEL   = 'SKIPPED_CHANNEL',   // Saltato per canale disattivato
  RETRY             = 'RETRY',             // In attesa di retry
  RESCHEDULED       = 'RESCHEDULED',       // Riprogrammato per conflitto
}
```

### Cross Promo Validation

```typescript
function validateCrossPromo(settings: CrossPromoSettings): ValidationResult {
  const errors: string[] = [];

  // Min 2 canali per rotation
  if (settings.rotationMode !== 'sequential' && settings.targetChannels.length < 2) {
    errors.push('Need at least 2 channels for random/weighted rotation');
  }

  // Weights devono sommare a 1 (o normalizzare)
  if (settings.rotationMode === 'weighted' && settings.weights) {
    const totalWeight = Object.values(settings.weights).reduce((a, b) => a + b, 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      errors.push('Weights must sum to 1');
    }
  }

  return { valid: errors.length === 0, errors };
}
```

---

## Analytics - Integrazioni

### Nuove Metriche dallo Scheduler

| Metrica | Calcolo | Visualizzazione | Tab |
|---------|---------|-----------------|-----|
| **Scheduled Posts Count** | `COUNT(ScheduledPost) WHERE isActive` | KPI Card | Overview |
| **Scheduled Executions (period)** | `COUNT(ScheduledPostExecution)` | KPI Card | Scheduler |
| **Bounty Clicks** | `COUNT(Click) WHERE linkType = 'BOUNTY'` | Chart + KPI | Scheduler |
| **Bounty CTR** | `bountyClicks / impressions stimate` | Percentage | Scheduler |
| **Bounty Conversions** | Tracked via Amazon cookie (se disponibile) | KPI Card | Scheduler |
| **Estimated Bounty Revenue** | `clicks × commissione media per tipo` | KPI Card | Scheduler |
| **Recap Engagement** | Click sui deal inclusi nel recap | Chart | Scheduler |
| **Best Performing Bounty** | Top by clicks + CTR | Table | Scheduler |
| **Best Performing Time** | Hour/DayOfWeek con più click | Heatmap | Scheduler |
| **Execution Success Rate** | `SUCCESS / (SUCCESS + FAILED + SKIPPED)` | Gauge | Scheduler |
| **Conflict Skip Rate** | `SKIPPED_CONFLICT / total` | Percentage | Scheduler |
| **Posts by Type** | Group by `ScheduledPostType` | Pie Chart | Scheduler |

### Nuovo Tab Analytics: "Scheduler"

```
Tabs: Overview | Channels | Products | Time | Scheduler | AI (PRO)
                                             ^^^^^^^^^^
                                             NUOVO TAB
```

**Contenuto del tab Scheduler:**

1. **KPI Cards Row**
   - Active Schedules
   - Executions This Period
   - Bounty Clicks
   - Success Rate %

2. **Charts**
   - Executions Over Time (bar chart)
   - Clicks by Post Type (pie chart)
   - Best Performing Hours for Scheduled Posts

3. **Tables**
   - Top Bounties by Clicks
   - Recent Executions Log
   - Failed/Skipped Executions (with error details + reason)

### Analytics Data Structure

```typescript
interface SchedulerAnalytics {
  // KPI Overview
  activeSchedules: number;
  executionsThisPeriod: number;
  successRate: number;

  // Bounty Performance
  bountyClicks: number;
  bountyCTR: number;
  estimatedBountyRevenue: number;

  // Best Performers
  bestPerformingBounty: {
    type: BountyType;
    clicks: number;
    ctr: number;
  };
  bestPerformingTime: {
    hour: number;
    dayOfWeek: number;
    avgClicks: number;
  };

  // Conflicts & Issues
  conflictSkipRate: number;
  failedExecutions: number;

  // By Type Breakdown
  executionsByType: Record<ScheduledPostType, {
    count: number;
    successRate: number;
    avgClicks: number;
  }>;
}
```

---

## Tracking & Metriche

### Strategia: Dove Salvare Cosa

| Tipo Dato | Storage | Motivo |
|-----------|---------|--------|
| Click su short link | **Database** (`Click` table) | Real-time analytics, già funziona |
| Bounty clicks | **Database** | Sono short link via `/r/` redirect, stesso sistema |
| Scheduled post executions | **Database** | Cronologia, retry, metriche |
| User behavior (flows) | **PostHog** | Product analytics, funnels, cohorts |
| Feature adoption | **PostHog** | Track usage patterns |
| Errors/exceptions | **Sentry** | Già configurato |

### Bounty Link Tracking Flow

**IMPORTANTE**: I bounty link DEVONO passare per il redirect `/r/` per tracking uniforme.

```typescript
// Quando crei un bounty link
async function createBountyLink(
  userId: string,
  bountyType: BountyType,
  channelId: string,
  scheduledPostId: string
): Promise<string> {
  const bountyUrl = BOUNTY_URLS[bountyType];  // Es: 'https://amazon.it/prime'
  const userTag = await getUserAffiliateTag(userId);

  // Crea AffiliateLink per tracking
  const affiliateLink = await prisma.affiliateLink.create({
    data: {
      userId,
      channelId,
      originalUrl: `${bountyUrl}?tag=${userTag}`,
      linkType: 'BOUNTY',
      scheduledPostId,
      // shortCode generato automaticamente
    }
  });

  // Restituisce URL tracked
  return `${APP_URL}/r/${affiliateLink.shortCode}`;
}

// Bounty URLs base
const BOUNTY_URLS: Record<BountyType, string> = {
  PRIME: 'https://www.amazon.it/amazonprime',
  AUDIBLE: 'https://www.amazon.it/hz/audible/mlp',
  KINDLE: 'https://www.amazon.it/kindle-dbs/hz/subscribe/ku',
  MUSIC: 'https://www.amazon.it/music/unlimited',
};
```

### Modifica AffiliateLink per Link Type

```prisma
// Aggiungere a schema.prisma

enum LinkType {
  DEAL       // Link a prodotto da automazione
  BOUNTY     // Link bounty (Prime, Audible, etc.)
  SCHEDULED  // Link da scheduled post
  MANUAL     // Link creato manualmente
}

model AffiliateLink {
  // ... campi esistenti ...

  linkType    LinkType  @default(DEAL)

  // Relazione opzionale a scheduled post
  scheduledPostId  String?
  scheduledPost    ScheduledPost? @relation(fields: [scheduledPostId], references: [id])
}
```

### PostHog Events - Scheduler

```typescript
// Da aggiungere a PostHogProvider.tsx

// ==================== SCHEDULER EVENTS ====================

/**
 * Track scheduled post created
 */
trackScheduledPostCreated: (postType: string, frequency: string, channelId: string) => {
  Analytics.track('scheduled_post_created', {
    post_type: postType,
    frequency,
    channel_id: channelId
  });
},

/**
 * Track scheduled post executed
 */
trackScheduledPostExecuted: (postType: string, success: boolean, executionTime: number) => {
  Analytics.track('scheduled_post_executed', {
    post_type: postType,
    success,
    execution_time_ms: executionTime
  });
},

/**
 * Track scheduled post toggled (activated/deactivated)
 */
trackScheduledPostToggled: (postId: string, isActive: boolean) => {
  Analytics.track('scheduled_post_toggled', {
    post_id: postId,
    is_active: isActive
  });
},

/**
 * Track bounty link clicked
 */
trackBountyClicked: (bountyType: string, channelId: string, scheduledPostId: string) => {
  Analytics.track('bounty_clicked', {
    bounty_type: bountyType,
    channel_id: channelId,
    scheduled_post_id: scheduledPostId
  });
},

/**
 * Track recap post viewed/interacted
 */
trackRecapEngagement: (dealsCount: number, clickedDealIndex?: number) => {
  Analytics.track('recap_engagement', {
    deals_count: dealsCount,
    clicked_deal_index: clickedDealIndex
  });
},

/**
 * Track scheduler page viewed
 */
trackSchedulerPageViewed: () => {
  Analytics.track('scheduler_page_viewed');
},

/**
 * Track scheduler wizard started
 */
trackSchedulerWizardStarted: (postType: string) => {
  Analytics.track('scheduler_wizard_started', { post_type: postType });
},

/**
 * Track scheduler wizard completed
 */
trackSchedulerWizardCompleted: (postType: string, stepCount: number) => {
  Analytics.track('scheduler_wizard_completed', {
    post_type: postType,
    steps_completed: stepCount
  });
},
```

---

## Database Schema

### Nuove Tabelle

```prisma
// ==================== SCHEDULED POSTS ====================

model ScheduledPost {
  id            String   @id @default(cuid())
  userId        String
  channelId     String

  // Tipo e contenuto
  type          ScheduledPostType
  name          String                  // Nome identificativo
  content       String   @db.Text       // Contenuto del messaggio
  mediaUrl      String?                 // URL immagine/video opzionale

  // Scheduling
  schedule      String                  // Cron expression (es: "0 9 * * *")
  timezone      String   @default("Europe/Rome")  // IANA timezone
  isActive      Boolean  @default(true)

  // Conflict Settings (JSON)
  conflictSettings Json?  // ConflictSettings interface

  // Tracking esecuzione
  lastRunAt     DateTime?
  nextRunAt     DateTime?
  runCount      Int      @default(0)
  failCount     Int      @default(0)    // Consecutive failures

  // Performance aggregate
  totalClicks   Int      @default(0)

  // Settings specifiche per tipo (JSON)
  settings      Json?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  channel       Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  executions    ScheduledPostExecution[]
  affiliateLinks AffiliateLink[]

  @@index([userId])
  @@index([channelId])
  @@index([nextRunAt])
  @@index([isActive, nextRunAt])
}

enum ScheduledPostType {
  CUSTOM
  BOUNTY
  RECAP
  CROSS_PROMO
  WELCOME
  SPONSORED
}

// ==================== EXECUTION LOGS ====================

model ScheduledPostExecution {
  id              String   @id @default(cuid())
  scheduledPostId String

  // Execution details
  executedAt      DateTime @default(now())
  status          ExecutionStatus

  // Telegram response
  messageId       String?              // Telegram message ID
  chatId          String?              // Telegram chat ID

  // Error tracking
  error           String?  @db.Text    // Error message if failed
  errorCode       String?              // Error code for categorization
  retryCount      Int      @default(0)

  // Performance metrics (populated async)
  clicks          Int      @default(0)

  // Content snapshot (per debug)
  contentSnapshot String?  @db.Text    // Contenuto inviato

  // Relations
  scheduledPost   ScheduledPost @relation(fields: [scheduledPostId], references: [id], onDelete: Cascade)

  @@index([scheduledPostId])
  @@index([executedAt])
  @@index([status])
}

enum ExecutionStatus {
  PENDING     // In coda
  RUNNING     // In esecuzione
  SUCCESS     // Completato con successo
  FAILED      // Fallito
  SKIPPED     // Saltato (es: canale disattivato)
  RETRY       // In attesa di retry
}

// ==================== BOUNTY TEMPLATES ====================

model BountyTemplate {
  id          String   @id @default(cuid())

  // Template info
  name        String               // Es: "Amazon Prime IT"
  bountyType  String               // PRIME, AUDIBLE, MUSIC, KINDLE
  locale      String   @default("it")  // Lingua template

  // URLs
  baseUrl     String               // URL senza tag
  tagParam    String   @default("tag")  // Nome parametro tag

  // Default content
  defaultCopy String   @db.Text    // Copy di default
  emoji       String?              // Emoji suggerita

  // Metadata
  avgCommission Float?             // Commissione media stimata
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Modifiche a Tabelle Esistenti

```prisma
// Aggiungere a AffiliateLink
model AffiliateLink {
  // ... campi esistenti ...

  // NUOVO: Tipo di link
  linkType         LinkType  @default(DEAL)

  // NUOVO: Relazione a scheduled post (opzionale)
  scheduledPostId  String?
  scheduledPost    ScheduledPost? @relation(fields: [scheduledPostId], references: [id])

  @@index([linkType])
  @@index([scheduledPostId])
}

enum LinkType {
  DEAL
  BOUNTY
  SCHEDULED
  MANUAL
}
```

---

## API Endpoints

### Scheduler CRUD

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/scheduler` | Lista programmazioni utente | ✅ |
| `POST` | `/api/scheduler` | Crea nuova programmazione | ✅ |
| `GET` | `/api/scheduler/:id` | Dettaglio programmazione | ✅ |
| `PUT` | `/api/scheduler/:id` | Modifica programmazione | ✅ |
| `DELETE` | `/api/scheduler/:id` | Elimina programmazione | ✅ |
| `POST` | `/api/scheduler/:id/toggle` | Attiva/Disattiva | ✅ |
| `POST` | `/api/scheduler/:id/run` | Esegui manualmente (pubblica) | ✅ |
| `POST` | `/api/scheduler/:id/preview` | Preview (genera testo, NON pubblica) | ✅ |
| `POST` | `/api/scheduler/:id/test` | Test (pubblica su canale test se configurato) | ✅ |
| `GET` | `/api/scheduler/:id/logs` | Cronologia esecuzioni | ✅ |

### Preview vs Test vs Run

```typescript
// /preview - Solo genera il contenuto, non invia
// Rate limit: 20/hour per user
POST /api/scheduler/:id/preview
Response: {
  content: string;      // Testo generato
  mediaUrl?: string;    // Media se presente
  estimatedLength: number;
}

// /test - Invia su canale di test (se configurato)
// Rate limit: 5/hour per user
POST /api/scheduler/:id/test
Body: {
  testChannelId?: string;  // Opzionale: override canale test
}
Response: {
  success: boolean;
  messageId?: string;
  testChannelId: string;
}

// /run - Esecuzione reale sul canale configurato
// Rate limit: 10/hour per scheduled post
POST /api/scheduler/:id/run
Response: {
  executionId: string;
  status: ExecutionStatus;
  messageId?: string;
}
```

### Scheduler Analytics

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/analytics/scheduler/overview` | KPI scheduler | ✅ |
| `GET` | `/api/analytics/scheduler/executions` | Esecuzioni con filtri | ✅ |
| `GET` | `/api/analytics/scheduler/bounties` | Performance bounty | ✅ |
| `GET` | `/api/analytics/scheduler/by-type` | Breakdown per tipo | ✅ |

### Bounty Templates

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/bounty-templates` | Lista template bounty | ✅ |
| `GET` | `/api/bounty-templates/:type` | Template specifico | ✅ |

---

## UI Components

### Struttura File

```
apps/web/
├── app/[locale]/dashboard/scheduler/
│   └── page.tsx                    # Pagina principale Scheduler
│
├── components/scheduler/
│   ├── index.ts                    # Exports
│   ├── SchedulerPage.tsx           # Layout pagina
│   ├── ScheduledPostCard.tsx       # Card singola programmazione
│   ├── ScheduledPostList.tsx       # Lista con filtri
│   ├── CreateScheduleModal.tsx     # Modal wizard creazione
│   ├── EditScheduleModal.tsx       # Modal modifica
│   ├── ScheduleWizard/
│   │   ├── WizardContainer.tsx     # Container wizard
│   │   ├── StepSelectType.tsx      # Step 1: Scegli tipo
│   │   ├── StepContent.tsx         # Step 2: Contenuto
│   │   ├── StepFrequency.tsx       # Step 3: Frequenza
│   │   ├── StepChannel.tsx         # Step 4: Canale
│   │   └── StepPreview.tsx         # Step 5: Anteprima
│   ├── FrequencyPicker.tsx         # Selettore frequenza (cron UI)
│   ├── BountySelector.tsx          # Selettore tipo bounty
│   ├── BountyPreview.tsx           # Preview bounty message
│   ├── ExecutionLogs.tsx           # Tabella log esecuzioni
│   ├── ExecutionLogItem.tsx        # Singolo log
│   └── SchedulerEmptyState.tsx     # Stato vuoto
│
├── components/analytics/
│   └── SchedulerAnalytics.tsx      # Tab analytics per scheduler
```

### Traduzioni Richieste

```json
// messages/it.json - da aggiungere
{
  "scheduler": {
    "title": "Scheduler",
    "subtitle": "Programma contenuti automatici per i tuoi canali",
    "create": "Nuova Programmazione",
    "emptyState": {
      "title": "Nessuna programmazione",
      "description": "Crea la tua prima programmazione per automatizzare i contenuti del canale"
    },
    "types": {
      "custom": {
        "name": "Post Personalizzato",
        "description": "Pubblica un messaggio personalizzato a orari programmati"
      },
      "bounty": {
        "name": "Bounty Amazon",
        "description": "Promuovi Prime, Audible, Kindle e guadagna commissioni extra"
      },
      "recap": {
        "name": "Recap Giornaliero",
        "description": "Riassunto automatico delle migliori offerte del giorno"
      },
      "crossPromo": {
        "name": "Cross Promotion",
        "description": "Promuovi i tuoi altri canali automaticamente"
      },
      "welcome": {
        "name": "Benvenuto",
        "description": "Messaggio di benvenuto per i nuovi iscritti"
      }
    },
    "wizard": {
      "step1": "Tipo",
      "step2": "Contenuto",
      "step3": "Frequenza",
      "step4": "Canale",
      "step5": "Anteprima"
    },
    "frequency": {
      "daily": "Ogni giorno",
      "weekly": "Ogni settimana",
      "custom": "Personalizzato"
    },
    "status": {
      "active": "Attivo",
      "paused": "In pausa",
      "error": "Errore"
    },
    "actions": {
      "edit": "Modifica",
      "delete": "Elimina",
      "pause": "Metti in pausa",
      "activate": "Attiva",
      "runNow": "Esegui ora",
      "viewLogs": "Vedi log"
    },
    "logs": {
      "title": "Cronologia Esecuzioni",
      "success": "Successo",
      "failed": "Fallito",
      "skipped": "Saltato"
    }
  }
}
```

---

## Sicurezza

### Checklist Sicurezza

| ID | Task | Descrizione | Priorità |
|----|------|-------------|----------|
| **SEC-001** | Validazione ownership canale | Verificare che l'utente sia owner del canale prima di creare scheduled post | 🔴 Alta |
| **SEC-002** | Rate limiting API | Implementare rate limits su tutti gli endpoint scheduler | 🔴 Alta |
| **SEC-003** | Sanitizzazione contenuto | Sanitizzare contenuto custom per XSS/injection prima di salvare | 🔴 Alta |
| **SEC-004** | Validazione cron expression | Validare che le cron expression siano valide e non troppo frequenti | 🟡 Media |
| **SEC-005** | Audit log | Loggare tutte le operazioni CRUD su scheduled posts | 🟡 Media |
| **SEC-006** | Input validation | Validare tutti gli input (lunghezza contenuto, URL, etc.) | 🔴 Alta |

### Implementazione Sicurezza

```typescript
// Validazione ownership canale
async function validateChannelOwnership(
  userId: string,
  channelId: string
): Promise<boolean> {
  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      userId: userId,
      isActive: true
    }
  });
  return !!channel;
}

// Sanitizzazione contenuto
import DOMPurify from 'isomorphic-dompurify';

function sanitizeContent(content: string, parseMode: 'HTML' | 'Markdown'): string {
  if (parseMode === 'HTML') {
    // Permetti solo tag Telegram-safe
    const ALLOWED_TAGS = ['b', 'i', 'u', 's', 'code', 'pre', 'a'];
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS,
      ALLOWED_ATTR: ['href']
    });
  }
  // Markdown: escape caratteri pericolosi
  return content.replace(/[<>&]/g, (c) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;'
  }[c] || c));
}

// Validazione cron expression
import parser from 'cron-parser';

function validateCronExpression(expression: string): ValidationResult {
  try {
    const interval = parser.parseExpression(expression);
    const next = interval.next().toDate();
    const nextNext = interval.next().toDate();

    // Check: non più frequente di 1 ora
    const diffMinutes = (nextNext.getTime() - next.getTime()) / 60000;
    if (diffMinutes < 60) {
      return {
        valid: false,
        error: 'Scheduled posts must be at least 1 hour apart'
      };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid cron expression' };
  }
}

// Input validation
const CONTENT_LIMITS = {
  maxLength: 4096,           // Telegram limit
  maxMediaUrlLength: 2048,
  maxNameLength: 100,
  maxButtonsCount: 5,
  maxButtonTextLength: 64,
};
```

---

## LLM Generation Settings

### Configurazione per Recap e Copy Generati

```typescript
interface LLMGenerationSettings {
  provider: 'openai' | 'anthropic';
  model: string;                    // Es: 'gpt-4o-mini', 'claude-3-haiku'
  temperature: number;              // Default: 0.7
  maxTokens: number;                // Default: 500
  systemPrompt: string;
  userPromptTemplate: string;       // Con variabili {{deals}}, {{date}}, etc.
}

// Default per Recap
const DEFAULT_RECAP_SETTINGS: LLMGenerationSettings = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 500,
  systemPrompt: `Sei un esperto di copywriting per canali Telegram di offerte.
Il tuo compito è creare recap accattivanti delle migliori offerte del giorno.

REGOLE:
- Max 4096 caratteri (limite Telegram)
- Usa emoji appropriati ma non eccessivi
- Tono: informativo ma entusiasta
- NON inventare prezzi o sconti
- Includi sempre il link di ogni offerta
- Formatta con Markdown Telegram (bold, italic)`,
  userPromptTemplate: `Genera un recap delle migliori offerte del giorno per un canale Telegram.

DATA: {{date}}
CANALE: {{channelName}}

OFFERTE (ordinate per score):
{{deals}}

NUMERO OFFERTE DA INCLUDERE: {{maxDeals}}
TONO RICHIESTO: {{tone}}

Output SOLO il testo del post, senza commenti o spiegazioni.`
};

// Default per Bounty Copy
const DEFAULT_BOUNTY_COPY: Record<BountyType, Record<CopyStyle, string>> = {
  PRIME: {
    casual: '🚀 Hai già provato Amazon Prime?\n\nConsegne gratuite, Prime Video, Music e tanto altro!\n\n👉 {{link}}',
    professional: '📦 Amazon Prime: il tuo shopping evoluto\n\nSpedizioni illimitate in 1 giorno, streaming incluso.\n\nScopri i vantaggi → {{link}}',
    urgent: '⚡️ ULTIMA CHIAMATA: Prime GRATIS per 30 giorni!\n\nNon perdere questa occasione 👇\n{{link}}'
  },
  AUDIBLE: {
    casual: '🎧 Ami leggere ma non hai tempo?\n\nAudible ti regala il primo audiolibro!\n\n👉 {{link}}',
    professional: '📚 Audible: trasforma il tempo in cultura\n\n+200.000 audiolibri, il primo è gratis.\n\nInizia ora → {{link}}',
    urgent: '🔥 OFFERTA LIMITATA: Audiolibro GRATIS!\n\nSolo per nuovi iscritti 👇\n{{link}}'
  },
  // ... altri bounty types
};
```

---

## Checklist Implementazione

### 🔴 Fase 1 - MVP (Priorità Alta)

#### Database
- [ ] **DB-001**: Aggiungere schema Prisma `ScheduledPost` + `ScheduledPostExecution`
- [ ] **DB-002**: Aggiungere enum `LinkType` a `AffiliateLink`
- [ ] **DB-003**: Aggiungere enum `ExecutionStatus` esteso (con SKIPPED_CONFLICT, etc.)
- [ ] **DB-004**: Creare migration e applicare
- [ ] **DB-005**: Seed `BountyTemplate` con template IT

#### API Backend
- [ ] **API-001**: CRUD endpoints `/api/scheduler`
- [ ] **API-002**: Endpoint `/api/scheduler/:id/toggle`
- [ ] **API-003**: Endpoint `/api/scheduler/:id/preview` (genera testo, non pubblica)
- [ ] **API-004**: Endpoint `/api/scheduler/:id/test` (pubblica su canale test)
- [ ] **API-005**: Endpoint `/api/bounty-templates`

#### Sicurezza (MVP Critical)
- [ ] **SEC-001**: Validazione ownership canale prima di scheduled post
- [ ] **SEC-002**: Rate limiting API scheduler
- [ ] **SEC-003**: Sanitizzazione contenuto custom (XSS, injection)
- [ ] **SEC-006**: Input validation (lunghezza, URL, etc.)

#### Worker
- [ ] **WORKER-001**: Job processor BullMQ per scheduled posts
- [ ] **WORKER-002**: Cron job per calcolare `nextRunAt` con timezone
- [ ] **WORKER-003**: Retry logic per failed executions
- [ ] **WORKER-004**: Conflict detection con deal in coda

#### Frontend
- [ ] **UI-001**: Pagina `/dashboard/scheduler`
- [ ] **UI-002**: Componente `ScheduledPostList`
- [ ] **UI-003**: Componente `ScheduledPostCard`
- [ ] **UI-004**: Componente `CreateScheduleModal` (wizard base)
- [ ] **UI-005**: Step wizard: SelectType, Content, Frequency, Channel, Preview
- [ ] **UI-006**: Componente `FrequencyPicker` (con timezone selector)
- [ ] **UI-007**: Componente `BountySelector`
- [ ] **UI-008**: Traduzioni IT/EN
- [ ] **UI-009**: Link in navbar

#### Tipi Supportati MVP
- [ ] **TYPE-001**: Custom post (testo libero)
- [ ] **TYPE-002**: Bounty post (Prime, Audible, Music, Kindle) con link tracked via `/r/`

### 🟡 Fase 2 - Complete (Priorità Media)

#### Backend
- [ ] **API-006**: Endpoint `/api/scheduler/:id/logs`
- [ ] **API-007**: Endpoint `/api/scheduler/:id/run` (esecuzione manuale)
- [ ] **API-008**: Endpoints analytics scheduler (`/api/analytics/scheduler/*`)
- [ ] **WORKER-005**: Content generation con LLM per Recap
- [ ] **WORKER-006**: Aggregazione click per scheduled posts

#### Sicurezza (Fase 2)
- [ ] **SEC-004**: Validazione cron expression (non troppo frequente)
- [ ] **SEC-005**: Audit log operazioni CRUD

#### Frontend
- [ ] **UI-010**: Componente `ExecutionLogs` (con status SKIPPED_CONFLICT visibile)
- [ ] **UI-011**: Tab "Scheduler" in Analytics page
- [ ] **UI-012**: Componente `SchedulerAnalytics` (con metriche estese)
- [ ] **UI-013**: Modale conferma eliminazione
- [ ] **UI-014**: Conflict Settings UI nel wizard

#### Tipi Supportati v2
- [ ] **TYPE-003**: Recap offerte (con LLM + settings configurabili)
- [ ] **TYPE-004**: Cross Promotion (con guardrails anti-spam)
- [ ] **TYPE-005**: Welcome post

#### PostHog
- [ ] **PH-001**: Eventi scheduler in PostHogProvider
- [ ] **PH-002**: Tracking creazione scheduled post
- [ ] **PH-003**: Tracking esecuzione scheduled post
- [ ] **PH-004**: Tracking bounty clicks
- [ ] **PH-005**: Tracking conflict skips

### 🟢 Fase 3 - Advanced (Priorità Bassa)

- [ ] **ADV-001**: SmartTiming™ (AI suggerisce orari migliori)
- [ ] **ADV-002**: A/B Testing per copy bounty
- [ ] **ADV-003**: Bulk actions (attiva/disattiva multipli)
- [ ] **ADV-004**: Import/Export configurazioni
- [ ] **ADV-005**: Webhook notifications per esecuzioni
- [ ] **ADV-006**: Sponsored post type (per partnership)
- [ ] **TYPE-006**: Post sponsorizzati

---

## Note Tecniche

### Cron Expressions Comuni

| Espressione | Significato |
|-------------|-------------|
| `0 9 * * *` | Ogni giorno alle 09:00 |
| `0 9,18 * * *` | Ogni giorno alle 09:00 e 18:00 |
| `0 */6 * * *` | Ogni 6 ore |
| `0 12 * * 1` | Ogni lunedì alle 12:00 |
| `0 9 * * 1-5` | Lun-Ven alle 09:00 |

### Rate Limits

- Max 10 scheduled posts per FREE user
- Max 50 scheduled posts per PRO user
- Max 100 scheduled posts per BUSINESS user
- Min 1 ora tra esecuzioni stesso post
- Max 1 esecuzione al minuto per canale

### Error Handling

```typescript
// Retry strategy
const RETRY_CONFIG = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelayMs: 60000,  // 1 minuto
  maxDelayMs: 3600000,    // 1 ora
};

// Error codes
enum SchedulerErrorCode {
  CHANNEL_NOT_FOUND = 'CHANNEL_NOT_FOUND',
  CHANNEL_DISCONNECTED = 'CHANNEL_DISCONNECTED',
  TELEGRAM_API_ERROR = 'TELEGRAM_API_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  CONTENT_GENERATION_FAILED = 'CONTENT_GENERATION_FAILED',
  INVALID_SETTINGS = 'INVALID_SETTINGS',
}
```

---

## Dipendenze

### Pacchetti da aggiungere

```json
{
  "dependencies": {
    "cron-parser": "^4.9.0",     // Parse cron expressions
    "cronstrue": "^2.50.0"       // Human-readable cron
  }
}
```

### Servizi esterni

- **Telegram Bot API**: Già configurato
- **OpenAI/Anthropic**: Per generazione copy (Recap)
- **BullMQ**: Già configurato per job processing
- **Redis**: Già configurato

---

## Metriche di Successo

| Metrica | Target MVP | Target v2 |
|---------|------------|-----------|
| Utenti con almeno 1 scheduled post | 20% | 50% |
| Bounty clicks / mese | 1000 | 5000 |
| Success rate esecuzioni | 95% | 99% |
| Tempo medio creazione post | < 2 min | < 1 min |
