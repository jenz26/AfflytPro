# Studio: Sistema di Scheduling Automazioni

> **DECISIONI FINALI (post-review UX)**

## Obiettivo

Permettere agli utenti di configurare:
1. **Frequenza di pubblicazione** (ogni quanto postare)
2. **Quantità per esecuzione** (quante offerte per volta)
3. ~~**Finestra temporale**~~ → **RIMOSSO MVP** (jitter automatico invece)
4. **Deduplicazione** (evitare offerte duplicate sullo stesso canale)

---

## 1. UI Semplificata (Progressive Disclosure)

### Preset per il 70% degli utenti

```
┌─────────────────────────────────────────────────────────────┐
│  Come vuoi pubblicare?                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ○ 🐢 Rilassato                                              │
│    3 offerte ogni 6 ore (12/giorno)                         │
│                                                              │
│  ○ ⚡ Attivo                                                 │
│    3 offerte ogni 2 ore (36/giorno)                         │
│                                                              │
│  ○ 🔥 Intensivo                      (PRO+)                  │
│    5 offerte ogni ora (120/giorno)                          │
│                                                              │
│  ○ ⚙️ Personalizzato...              (PRO+)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Mapping Preset → Valori

| Preset | intervalMinutes | dealsPerRun | Piano |
|--------|-----------------|-------------|-------|
| Rilassato | 360 (6h) | 3 | FREE+ |
| Attivo | 120 (2h) | 3 | FREE+ |
| Intensivo | 60 (1h) | 5 | PRO+ |
| Custom | configurabile | configurabile | PRO+ |

## 2. Configurazione Frequenza (Custom)

### Limiti per Piano

| Piano    | Frequenza Minima | Opzione Custom |
|----------|------------------|----------------|
| FREE     | 4 ore            | ❌             |
| PRO      | 1 ora            | ✅             |
| BUSINESS | 30 minuti        | ✅ (anche cron)|

### Schema DB (modifica AutomationRule)

```prisma
model AutomationRule {
  // ... campi esistenti ...

  // NUOVO: Scheduling
  intervalMinutes    Int       @default(360)  // 6 ore default

  // NUOVO: Finestra oraria
  activeFromHour     Int?      // 0-23, null = sempre attivo
  activeToHour       Int?      // 0-23, null = sempre attivo
  timezone           String    @default("Europe/Rome")

  // NUOVO: Quantità
  dealsPerRun        Int       @default(3)    // Quante offerte per esecuzione

  // NUOVO: Prossima esecuzione calcolata
  nextRunAt          DateTime?
}
```

---

## 2. Finestra Temporale (Orari Attivi)

### UI Proposta

```
┌─────────────────────────────────────────────────────────────┐
│  Quando pubblicare?                                         │
├─────────────────────────────────────────────────────────────┤
│  ○ 24 ore su 24                                             │
│  ○ Solo di giorno (8:00 - 22:00)                           │
│  ○ Orario lavorativo (9:00 - 18:00)                        │
│  ○ Personalizzato:                                          │
│    Da: [08:00 ▼]  A: [23:00 ▼]                             │
└─────────────────────────────────────────────────────────────┘
```

### Logica Scheduler

```typescript
function shouldRunNow(rule: AutomationRule): boolean {
  const now = new Date();
  const hour = getHourInTimezone(now, rule.timezone);

  // Se non ci sono limiti orari, sempre attivo
  if (rule.activeFromHour === null || rule.activeToHour === null) {
    return true;
  }

  // Gestisce anche range che attraversano mezzanotte (es. 22:00 - 06:00)
  if (rule.activeFromHour <= rule.activeToHour) {
    // Range normale: 08:00 - 22:00
    return hour >= rule.activeFromHour && hour < rule.activeToHour;
  } else {
    // Range notturno: 22:00 - 06:00
    return hour >= rule.activeFromHour || hour < rule.activeToHour;
  }
}
```

### Calcolo nextRunAt

```typescript
function calculateNextRun(rule: AutomationRule): Date {
  let next = new Date(Date.now() + rule.intervalMinutes * 60 * 1000);

  // Se cade fuori dalla finestra attiva, sposta all'inizio della prossima finestra
  if (!isInActiveWindow(next, rule)) {
    next = getNextActiveWindowStart(next, rule);
  }

  return next;
}
```

---

## 3. Deduplicazione Offerte

### Problema

Un utente pubblica ogni 2 ore. Le offerte Keepa cambiano lentamente.
Senza deduplicazione: stessa offerta pubblicata più volte.

### Soluzione: Tabella ChannelDealHistory

```prisma
model ChannelDealHistory {
  id          String   @id @default(cuid())

  // Chiave composta per lookup veloce
  channelId   String
  asin        String

  // Metadata
  publishedAt DateTime @default(now())
  ruleId      String?  // Quale regola l'ha pubblicata

  // TTL per auto-cleanup (quanto tempo evitare duplicati)
  expiresAt   DateTime // Default: publishedAt + 7 giorni

  @@unique([channelId, asin])
  @@index([channelId])
  @@index([expiresAt])
}
```

### Logica di Filtering

```typescript
async function filterDuplicates(
  deals: Deal[],
  channelId: string,
  dedupeWindowHours: number = 168 // 7 giorni default
): Promise<Deal[]> {

  const cutoff = new Date(Date.now() - dedupeWindowHours * 60 * 60 * 1000);

  // Trova ASIN già pubblicati su questo canale
  const published = await prisma.channelDealHistory.findMany({
    where: {
      channelId,
      publishedAt: { gte: cutoff }
    },
    select: { asin: true }
  });

  const publishedAsins = new Set(published.map(p => p.asin));

  // Filtra le offerte già pubblicate
  return deals.filter(deal => !publishedAsins.has(deal.asin));
}
```

### Dopo Pubblicazione

```typescript
async function recordPublishedDeals(
  channelId: string,
  deals: Deal[],
  ruleId: string
): Promise<void> {

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 giorni

  await prisma.channelDealHistory.createMany({
    data: deals.map(deal => ({
      channelId,
      asin: deal.asin,
      ruleId,
      expiresAt
    })),
    skipDuplicates: true // Ignora se già esiste
  });
}
```

### Configurazione Utente (Opzionale Avanzato)

```
┌─────────────────────────────────────────────────────────────┐
│  Evita duplicati per:                                       │
├─────────────────────────────────────────────────────────────┤
│  ○ 24 ore     (stessa offerta può tornare domani)          │
│  ○ 3 giorni                                                 │
│  ○ 7 giorni   (consigliato)                                │
│  ○ 30 giorni  (BUSINESS only)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Quantità per Esecuzione

### UI

```
┌─────────────────────────────────────────────────────────────┐
│  Quante offerte pubblicare per volta?                       │
├─────────────────────────────────────────────────────────────┤
│  [  3  ▼]  offerte                                          │
│                                                             │
│  💡 Con i tuoi filtri ci sono ~45 offerte disponibili       │
│     Pubblicando 3 ogni 2 ore = ~36 offerte/giorno          │
└─────────────────────────────────────────────────────────────┘
```

### Limiti per Piano

| Piano    | Min | Max | Default |
|----------|-----|-----|---------|
| FREE     | 1   | 3   | 2       |
| PRO      | 1   | 10  | 5       |
| BUSINESS | 1   | 30  | 10      |

---

## 5. Flow Completo Esecuzione

```
┌─────────────────────────────────────────────────────────────┐
│  SCHEDULER (ogni minuto)                                     │
│                                                              │
│  1. SELECT rules WHERE nextRunAt <= NOW AND isActive        │
│  2. Per ogni rule:                                           │
│     - Controlla finestra oraria → skip se fuori orario      │
│     - Passa a RuleExecutor                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  RULE EXECUTOR                                               │
│                                                              │
│  1. Carica offerte dalla cache (o chiama Keepa)             │
│  2. Applica filtri della rule                                │
│  3. filterDuplicates() → rimuovi già pubblicati             │
│  4. Ordina per score/sconto                                  │
│  5. Prendi top N (dealsPerRun)                              │
│  6. Se deals.length === 0 → skip, log "no new deals"        │
│  7. Pubblica su canale                                       │
│  8. recordPublishedDeals()                                   │
│  9. Aggiorna nextRunAt                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Schema DB Completo (Modifiche)

```prisma
// Modifica a AutomationRule esistente
model AutomationRule {
  // ... campi esistenti ...

  // ═══════════════════════════════════════════════════════════════
  // SCHEDULING (NUOVO)
  // ═══════════════════════════════════════════════════════════════

  /// Intervallo in minuti tra le esecuzioni
  intervalMinutes    Int       @default(360)  // 6 ore

  /// Ora di inizio finestra attiva (0-23), null = sempre
  activeFromHour     Int?

  /// Ora di fine finestra attiva (0-23), null = sempre
  activeToHour       Int?

  /// Timezone utente
  timezone           String    @default("Europe/Rome")

  /// Prossima esecuzione schedulata
  nextRunAt          DateTime?

  // ═══════════════════════════════════════════════════════════════
  // QUANTITÀ (NUOVO)
  // ═══════════════════════════════════════════════════════════════

  /// Quante offerte pubblicare per esecuzione
  dealsPerRun        Int       @default(3)

  /// Finestra deduplicazione in ore (evita ripubblicazione)
  dedupeWindowHours  Int       @default(168)  // 7 giorni
}

// NUOVA TABELLA
model ChannelDealHistory {
  id          String   @id @default(cuid())
  channelId   String
  asin        String
  ruleId      String?
  publishedAt DateTime @default(now())
  expiresAt   DateTime

  channel     Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  rule        AutomationRule? @relation(fields: [ruleId], references: [id], onDelete: SetNull)

  @@unique([channelId, asin])
  @@index([channelId])
  @@index([expiresAt])
}
```

---

## 7. Cleanup Job

Pulisce i record di deduplicazione scaduti:

```typescript
// Esegui ogni ora
async function cleanupExpiredDealHistory(): Promise<void> {
  const deleted = await prisma.channelDealHistory.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });

  console.log(`[Cleanup] Removed ${deleted.count} expired deal history records`);
}
```

---

## 8. UI Wizard - Step Scheduling

```
┌─────────────────────────────────────────────────────────────┐
│  📅 Configura Pubblicazione                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FREQUENZA                                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Ogni [2 ore ▼]                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  QUANTITÀ                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Pubblica [3 ▼] offerte per volta                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ORARI ATTIVI                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ○ Sempre (24/7)                                         ││
│  │ ● Solo in certi orari:                                  ││
│  │   Dalle [08:00 ▼] alle [23:00 ▼]                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  DUPLICATI                                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Evita di ripubblicare la stessa offerta per [7 giorni▼] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  📊 Stima: ~36 offerte/giorno pubblicate                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Priorità Implementazione

### Fase 1 (MVP)
- [ ] Aggiungere campi a AutomationRule (intervalMinutes, dealsPerRun, nextRunAt)
- [ ] Creare tabella ChannelDealHistory
- [ ] Implementare deduplicazione base
- [ ] Modificare scheduler per usare nextRunAt

### Fase 2 (Finestra Oraria)
- [ ] Aggiungere activeFromHour, activeToHour, timezone
- [ ] Logica calcolo nextRunAt con finestra
- [ ] UI per configurazione orari

### Fase 3 (Polish)
- [ ] Cleanup job per ChannelDealHistory
- [ ] Statistiche deduplicazione ("12 offerte skippate perché già pubblicate")
- [ ] Preview nel wizard ("Con questi filtri: ~X offerte/giorno")

---

## 10. Decisioni Finali (Post-Review UX)

### Domande Risolte

| Domanda | Decisione | Motivazione |
|---------|-----------|-------------|
| **Giorni settimana?** | ❌ NO | Complessità senza valore. Deal non rispettano weekend. |
| **Finestra oraria?** | ❌ NO (MVP) | Telegram è asincrono. Jitter ±30min automatico invece. |
| **Pause manuali?** | ✅ SÌ | Toggle semplice "Pausa". Utile per vacanze/problemi. |
| **Notifiche errori?** | ✅ SÌ | Dopo 3 run consecutive senza pubblicare → notifica. |
| **Priorità offerte?** | **Sconto maggiore** | Quello che converte meglio. Random non ha senso. |
| **Rotazione categorie?** | ❌ NO | L'utente sceglie categorie nei filtri. |

### Jitter Automatico (invece di finestra oraria)

```typescript
function calculateNextRunWithJitter(intervalMinutes: number): Date {
  // Jitter ±15% dell'intervallo (max ±30 min)
  const jitterMax = Math.min(intervalMinutes * 0.15, 30);
  const jitter = (Math.random() - 0.5) * 2 * jitterMax;

  return new Date(Date.now() + (intervalMinutes + jitter) * 60 * 1000);
}
```

Benefici:
- Il canale non sembra un bot (orari variabili)
- Zero configurazione utente
- Nessuna complessità finestra oraria

### Feedback Post-Esecuzione (importante per UX)

Dopo ogni run, loggare/mostrare:
```
✅ Pubblicato 3 offerte
   (5 disponibili, 2 già pubblicate questa settimana)
```

### Stima Intelligente nel Wizard

```
📊 Con questa configurazione:
   ~36 offerte/giorno
   ~15 probabilmente nuove (dopo deduplicazione)

   ⚠️ Con i tuoi filtri stretti, potresti finire
   le offerte nuove in ~3 giorni
```

---

## 11. Schema DB Finale (MVP)

```prisma
// Modifica a AutomationRule esistente
model AutomationRule {
  // ... campi esistenti ...

  // ═══════════════════════════════════════════════════════════════
  // SCHEDULING (NUOVO)
  // ═══════════════════════════════════════════════════════════════

  /// Preset: 'relaxed' | 'active' | 'intensive' | 'custom'
  schedulePreset     String    @default("relaxed")

  /// Intervallo in minuti (usato se preset=custom, altrimenti derivato)
  intervalMinutes    Int       @default(360)

  /// Quante offerte pubblicare per esecuzione
  dealsPerRun        Int       @default(3)

  /// Prossima esecuzione schedulata (con jitter)
  nextRunAt          DateTime?

  /// Finestra deduplicazione in ore
  dedupeWindowHours  Int       @default(168)  // 7 giorni
}

// NUOVA TABELLA
model ChannelDealHistory {
  id          String   @id @default(cuid())
  channelId   String
  asin        String
  ruleId      String?
  publishedAt DateTime @default(now())
  expiresAt   DateTime

  @@unique([channelId, asin])
  @@index([channelId])
  @@index([expiresAt])
}
```

---

## 12. Piano Implementazione MVP

### Fase 1: Database
- [ ] Aggiungere campi a AutomationRule (schedulePreset, intervalMinutes, dealsPerRun, nextRunAt, dedupeWindowHours)
- [ ] Creare tabella ChannelDealHistory
- [ ] Migration Prisma

### Fase 2: Backend
- [ ] Modificare scheduler per usare nextRunAt + jitter
- [ ] Implementare deduplicazione in RuleExecutor
- [ ] Ordinamento per sconto (best deals first)
- [ ] Notifica dopo 3 run vuote consecutive

### Fase 3: Frontend
- [ ] Step wizard con preset (Rilassato/Attivo/Intensivo/Custom)
- [ ] Stima offerte/giorno
- [ ] Toggle pausa automazione

### Fase 4: Polish
- [ ] Cleanup job per ChannelDealHistory scaduti
- [ ] Feedback post-esecuzione nella dashboard
- [ ] Stats deduplicazione
