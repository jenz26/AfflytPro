Scheduler di Afflyt Pro
Lo scheduler è un sistema BullMQ-based per programmare messaggi automatici sui canali Telegram.
Architettura
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Fastify API   │────▶│   BullMQ Queue  │
│   (Wizard)      │     │   + Prisma      │     │   + Redis       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Telegram API   │
                                                └─────────────────┘
Tipi di Post Supportati
Tipo	Descrizione
CUSTOM	Testo libero personalizzato
BOUNTY	Link affiliato Amazon (Prime, Audible, Kindle, Music, Kids+)
RECAP	Riassunto deal giornaliero (LLM-generated)
CROSS_PROMO	Cross-promotion su altri canali
WELCOME	Messaggio per nuovi iscritti
SPONSORED	Contenuto sponsorizzato
Wizard di Creazione (4 Step)
Step 1: Basics
Nome del post
Tipo (CUSTOM, BOUNTY, RECAP...)
Selezione canale Telegram
Per BOUNTY: template (Prime, Audible...) + URL affiliato + Tag
Step 2: Content
Editor rich text con markdown
Variabili disponibili:
{{date}} → Data corrente
{{time}} → Ora corrente
{{link}} → Link affiliato (BOUNTY)
{{deals}} → Lista deal (RECAP)
URL media opzionale (immagine/GIF)
Limite: 4096 caratteri
Step 3: Schedule
Preset cron:
Ogni giorno alle 9:00, 12:00, 18:00, 21:00
Giorni feriali alle 9:00
Ogni domenica alle 10:00
Ogni 6 ore
Espressione custom
Timezone: Europe/Rome, UTC, etc.
Conflict Settings:
Skip se deal in pending
Buffer minutes (1-120)
Reschedule on conflict
Step 4: Review
Riepilogo completo
Anteprima contenuto
Pulsante "Test" (invio immediato)
API Endpoints
Metodo	Endpoint	Descrizione
GET	/scheduler	Lista tutti i post schedulati
GET	/scheduler/:id	Dettaglio singolo post
POST	/scheduler	Crea nuovo post schedulato
PUT	/scheduler/:id	Aggiorna post
DELETE	/scheduler/:id	Elimina post
POST	/scheduler/:id/toggle	Attiva/Pausa post
POST	/scheduler/:id/test	Invia messaggio di test
GET	/scheduler/:id/logs	Log esecuzioni (paginato)
Database Schema
model ScheduledPost {
  id              String
  userId          String
  channelId       String
  
  // Content
  type            ScheduledPostType   // CUSTOM, BOUNTY, RECAP...
  name            String
  content         String              // Max 4096
  mediaUrl        String?
  
  // Scheduling
  schedule        String              // Cron expression "0 9 * * *"
  timezone        String              // "Europe/Rome"
  isActive        Boolean
  
  // Tracking
  lastRunAt       DateTime?
  nextRunAt       DateTime?
  runCount        Int                 // Successi
  failCount       Int                 // Fallimenti
  
  // Settings
  conflictSettings Json?
  
  // Relations
  executions      ScheduledPostExecution[]
}

model ScheduledPostExecution {
  id              String
  scheduledPostId String
  executedAt      DateTime
  status          ExecutionStatus     // SUCCESS, FAILED, SKIPPED...
  messageId       String?             // Telegram message ID
  error           String?
  retryCount      Int
  clicks          Int
}
Cron Expression Format
┌───────────── minuto (0-59)
│ ┌─────────── ora (0-23)
│ │ ┌───────── giorno del mese (1-31)
│ │ │ ┌─────── mese (1-12)
│ │ │ │ ┌───── giorno della settimana (0-6, 0=Domenica)
│ │ │ │ │
* * * * *
Esempi:
Cron	Significato
0 9 * * *	Ogni giorno alle 9:00
0 9 * * 1-5	Giorni feriali alle 9:00
0 9,18 * * *	Ogni giorno alle 9:00 e 18:00
0 */6 * * *	Ogni 6 ore
0 10 * * 0	Ogni domenica alle 10:00
Flow di Esecuzione
┌─────────────────────────────────────────────────────────────┐
│                    CRON JOB (ogni minuto)                    │
│  SELECT * FROM ScheduledPost                                 │
│  WHERE isActive = true AND nextRunAt <= NOW()                │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  Per ogni post trovato:      │
        │  1. Calcola nextRunAt        │
        │  2. Aggiorna nel DB          │
        │  3. Enqueue in BullMQ        │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  BULLMQ WORKER               │
        │  1. Fetch post + channel     │
        │  2. Check conflicts          │
        │  3. Decrypt bot token        │
        │  4. Replace {{variables}}    │
        │  5. Send via Telegram API    │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  POST-EXECUTION              │
        │  - Record execution log      │
        │  - Update runCount/failCount │
        │  - Schedule next run         │
        └──────────────────────────────┘
Conflict Detection
Il sistema evita sovrapposizioni con i deal automatici:
// Prima di inviare, controlla ChannelDealHistory
const recentPosts = await prisma.channelDealHistory.findMany({
  where: {
    channelId,
    publishedAt: { gte: cooldownStart }
  }
});

if (recentPosts.length > 0 && settings.skipIfDealPending) {
  // SKIP o RESCHEDULE
}
Opzioni:
skipIfDealPosted: Salta se c'è un deal recente
bufferMinutes: Minuti di buffer (1-120)
rescheduleOnConflict: Riprogramma invece di skippare
maxRescheduleMinutes: Massimo ritardo (1-180)
Retry Logic
Tentativo	Delay
1° retry	1 minuto
2° retry	2 minuti
3° retry	4 minuti
Dopo 3 fallimenti → FAILED definitivo
Rate Limiting
BullMQ: Max 10 job/secondo (limite Telegram)
Concurrency: 5 job simultanei
Cleanup: Completati rimossi dopo 24h, falliti dopo 7 giorni
Limiti per Piano
Piano	Max Post Schedulati
FREE	10
PRO	50
BUSINESS	100
Inizializzazione (App Start)
// In app.ts
const schedulerQueue = new SchedulerQueue(redis, prisma);
await schedulerQueue.start();

const schedulerCron = new SchedulerCron(prisma, redis, schedulerQueue);
schedulerCron.start();

// Recupera post senza nextRunAt (dopo restart)
await schedulerCron.initializeNextRunTimes();
Questo garantisce che nessun post venga perso dopo un deploy/restart.
