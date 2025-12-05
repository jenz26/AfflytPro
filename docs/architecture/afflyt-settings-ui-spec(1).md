# Afflyt - Settings UI Specification

> **Companion Document**  
> - `afflyt-optimization-system-report.md` - Architettura algoritmi
> - `afflyt-ux-guide.md` - Design UI/UX generale  
> - `afflyt-onboarding-spec.md` - Specifiche onboarding con PostHog
> - **Questo documento** - Specifiche UI pagina Settings

---

## 1. Overview

### 1.1 Obiettivo

Definire la struttura e il comportamento della pagina **Settings** di Afflyt, con focus su:

1. **Rinomina tab "Tag Affiliato"** → **"Amazon Associates"**
2. **Unificazione Store ID + Tracking IDs Pool** nella stessa sezione
3. **Setup Wizard in Dashboard** per guidare configurazioni avanzate post-onboarding

### 1.2 Principi Guida

- **Onboarding snello**: Solo l'essenziale per iniziare (Store ID obbligatorio, no tracking IDs)
- **Progressive disclosure**: Funzionalità avanzate accessibili ma non imposte
- **Copia-incolla friendly**: Input tracking IDs ottimizzato per lista incollata
- **Feedback immediato**: Validazione real-time, contatori, stats pool

---

## 2. Struttura Tabs Settings

### 2.1 Tabs Attuali vs Nuove

| Prima | Dopo |
|-------|------|
| Profilo | Profilo |
| Fatturazione | Fatturazione |
| Chiavi API | Chiavi API |
| **Tag Affiliato** | **Amazon Associates** ← Rinominata |
| Notifiche | Notifiche |
| Sicurezza | Sicurezza |
| Beta Tester | Beta Tester |

### 2.2 Icone Tabs

```
👤 Profilo
💳 Fatturazione  
🔑 Chiavi API
🛒 Amazon Associates  ← Nuova icona (carrello/Amazon)
🔔 Notifiche
🔒 Sicurezza
🧪 Beta Tester
```

---

## 3. Tab "Amazon Associates" - Layout Completo

### 3.1 Struttura Generale

```
┌─────────────────────────────────────────────────────────────────┐
│  🛒 Amazon Associates                                           │
│  Configura il tuo account affiliato Amazon                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  SEZIONE 1: STORE ID                                    │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  SEZIONE 2: TRACKING IDS POOL (Avanzato)               │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                         [💾 Salva Modifiche]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Sezione 1: Store ID

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 Store ID                                                    │
│  Il tuo identificativo principale Amazon Associates             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Store ID *                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ topoffertetec-21                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ℹ️ Lo trovi su Amazon Associates, in alto a destra nella      │
│     dashboard. Esempio: nomeutente-21                          │
│                                                                 │
│  [📖 Come trovare il tuo Store ID]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Specifiche Campo Store ID

| Proprietà | Valore |
|-----------|--------|
| Tipo | Text input |
| Obbligatorio | ✅ Sì |
| Validazione | Regex: `^[a-zA-Z0-9]+-2[0-9]$` |
| Placeholder | `es: mionome-21` |
| Max length | 50 caratteri |
| Stato | Modificabile sempre |

#### Validazione Store ID

```typescript
function validateStoreId(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Store ID obbligatorio' };
  }
  
  // Formato: alfanumerico + trattino + 2X (dove X è cifra)
  const regex = /^[a-zA-Z0-9]+-2[0-9]$/;
  if (!regex.test(value)) {
    return { 
      valid: false, 
      error: 'Formato non valido. Esempio corretto: mionome-21' 
    };
  }
  
  return { valid: true };
}
```

### 3.3 Sezione 2: Tracking IDs Pool

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Tracking IDs Pool                               [Avanzato] │
│  Traccia le vendite per singolo deal                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Pool Status ───────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  Pool: 7 tracking IDs                                  │   │
│  │                                                         │   │
│  │  Disponibili    5   ●●●●●○○                            │   │
│  │  In uso         2   ●●                                 │   │
│  │                                                         │   │
│  │  Capacità: ~7 deal/giorno con tracking preciso         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Info Box ──────────────────────────────────────────────┐   │
│  │ 💡 Senza tracking IDs, tutti i link useranno lo Store  │   │
│  │    ID. Funziona perfettamente, ma non saprai quale     │   │
│  │    deal specifico ha generato una vendita.             │   │
│  │                                                         │   │
│  │    Con i tracking IDs, puoi vedere esattamente:        │   │
│  │    • Quale deal ha convertito                          │   │
│  │    • A che ora è avvenuta la vendita                   │   │
│  │    • Su quale canale                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [📖 Come creare Tracking IDs]        [⚙️ Gestisci Pool →]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Stati Pool

**Stato: Pool Vuoto**
```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Tracking IDs Pool                               [Avanzato] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  ⚪ Nessun tracking ID configurato                      │   │
│  │                                                         │   │
│  │  I link useranno lo Store ID predefinito.              │   │
│  │  Configura i tracking IDs per analytics avanzati.      │   │
│  │                                                         │   │
│  │            [🚀 Configura Tracking IDs]                 │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Stato: Pool Attivo**
```
┌─────────────────────────────────────────────────────────────────┐
│  Pool: 30 tracking IDs                                         │
│                                                                 │
│  Disponibili   28   ████████████████████████████░░              │
│  In uso         2   ██                                          │
│                                                                 │
│  ✅ Capacità ottimale per canali attivi                        │
└─────────────────────────────────────────────────────────────────┘
```

**Stato: Pool Quasi Esaurito**
```
┌─────────────────────────────────────────────────────────────────┐
│  Pool: 10 tracking IDs                                         │
│                                                                 │
│  Disponibili    2   ██░░░░░░░░                                  │
│  In uso         8   ████████                                    │
│                                                                 │
│  ⚠️ Pool quasi esaurito. Aggiungi altri tracking IDs o         │
│     attendi il rilascio automatico (entro 24h).                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Modal "Gestisci Pool"

### 4.1 Layout Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Gestisci Tracking IDs Pool                            [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Incolla i tracking IDs creati su Amazon (uno per riga):       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ hsgf-21                                                 │   │
│  │ adsf0a-21                                               │   │
│  │ gsfd-21                                                 │   │
│  │ toft01-21                                               │   │
│  │ abbaca1-21                                              │   │
│  │ sceltescontate-21                                       │   │
│  │ topoffertetec-21                                        │   │
│  │                                                         │   │
│  │                                                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ✅ 7 tracking IDs validi riconosciuti                         │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📊 Statistiche Pool                                           │
│                                                                 │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐  │
│  │ Totale       │ Disponibili  │ In Uso       │ Oggi        │  │
│  │     7        │      5       │      2       │   12 deal   │  │
│  └──────────────┴──────────────┴──────────────┴─────────────┘  │
│                                                                 │
│  💡 Con 7 IDs puoi tracciare ~7 deal contemporaneamente.       │
│     Consigliamo almeno 30 per canali attivi.                   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🗑️ Tracking IDs in uso (non rimuovibili ora)                  │
│                                                                 │
│  • toft01-21      → Deal B08XYZ pubblicato 2h fa               │
│  • abbaca1-21     → Deal B09ABC pubblicato 5h fa               │
│                                                                 │
│                              [Annulla]    [💾 Salva Pool]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Specifiche Textarea

| Proprietà | Valore |
|-----------|--------|
| Tipo | Textarea multiline |
| Rows | 10 (espandibile) |
| Placeholder | `Incolla qui i tracking IDs, uno per riga...` |
| Parsing | Split per `\n`, trim, filter empty |
| Validazione | Regex per riga: `^[a-zA-Z0-9]+-2[0-9]$` |

### 4.3 Logica di Parsing

```typescript
interface ParseResult {
  valid: string[];
  duplicates: string[];
  invalid: string[];
  alreadyExists: string[];
}

function parseTrackingIds(input: string, existingIds: string[]): ParseResult {
  const lines = input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const result: ParseResult = {
    valid: [],
    duplicates: [],
    invalid: [],
    alreadyExists: []
  };
  
  const seen = new Set<string>();
  
  for (const trackingId of lines) {
    // Check formato
    if (!isValidTrackingIdFormat(trackingId)) {
      result.invalid.push(trackingId);
      continue;
    }
    
    // Check duplicato in input
    if (seen.has(trackingId)) {
      result.duplicates.push(trackingId);
      continue;
    }
    
    // Check già esistente in DB
    if (existingIds.includes(trackingId)) {
      result.alreadyExists.push(trackingId);
      continue;
    }
    
    seen.add(trackingId);
    result.valid.push(trackingId);
  }
  
  return result;
}

function isValidTrackingIdFormat(value: string): boolean {
  return /^[a-zA-Z0-9]+-2[0-9]$/.test(value);
}
```

### 4.4 Feedback Validazione

**Tutti validi:**
```
✅ 7 tracking IDs validi riconosciuti
```

**Con problemi:**
```
✅ 5 tracking IDs validi
⚠️ 2 già esistenti (ignorati): toft01-21, abbaca1-21
❌ 1 formato non valido: abc123 (manca suffisso -21)
```

**Tutti invalidi:**
```
❌ Nessun tracking ID valido trovato.
   Assicurati che ogni riga contenga un ID nel formato: nome-21
```

---

## 5. Pagina Guida "Come creare Tracking IDs"

### 5.1 Opzioni di Implementazione

**Opzione A: Modal/Drawer**
- Pro: Utente non lascia la pagina
- Contro: Spazio limitato per screenshots

**Opzione B: Pagina dedicata** 
- Pro: Spazio per guida dettagliata con immagini
- Contro: Navigazione extra

**Opzione C: Link esterno (docs)**
- Pro: Aggiornabile senza deploy
- Contro: Utente lascia l'app

**Raccomandazione: Opzione A (Modal)** con link a docs esterni per approfondimenti.

### 5.2 Contenuto Modal Guida

```
┌─────────────────────────────────────────────────────────────────┐
│  📖 Come creare Tracking IDs su Amazon                    [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  I tracking IDs ti permettono di sapere esattamente quale      │
│  deal ha generato una vendita. Ecco come crearli:              │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  STEP 1: Vai su Amazon Associates                              │
│                                                                 │
│  1. Accedi a affiliate-program.amazon.it                       │
│  2. Clicca sul tuo email in alto a destra                      │
│  3. Seleziona "Gestisci i tuoi Tracking ID"                    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  STEP 2: Crea i Tracking IDs                                   │
│                                                                 │
│  1. Clicca "Aggiungi tracking ID"                              │
│  2. Inserisci un nome (es: afl01, afl02, afl03...)            │
│  3. Clicca "Crea"                                              │
│  4. Ripeti per ogni ID che vuoi creare                         │
│                                                                 │
│  💡 Consigliamo di creare almeno 30 tracking IDs.              │
│     Puoi usare un pattern come: afl01, afl02, afl03...         │
│                                                                 │
│  ⚠️ Nota: I nomi devono essere unici in tutto Amazon.          │
│     Se un nome è già preso, prova ad aggiungere numeri         │
│     o lettere (es: afl01x, mioid01, ecc.)                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  STEP 3: Copia e incolla in Afflyt                             │
│                                                                 │
│  1. Seleziona tutti i tracking IDs creati                      │
│  2. Copia la lista                                             │
│  3. Incolla nella textarea qui sopra                           │
│                                                                 │
│  I tracking IDs verranno riconosciuti automaticamente!         │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [📺 Video tutorial (2 min)]     [📄 Guida completa]           │
│                                                                 │
│                                              [Ho capito! →]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Setup Wizard in Dashboard

### 6.1 Posizione

Il Setup Wizard appare nella **Dashboard principale**, in alto o nella sidebar, finché non è completato al 100%.

### 6.2 Layout Card

```
┌─────────────────────────────────────────────────────────────────┐
│  🚀 Completa la configurazione                           85%   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Account creato                                              │
│  ✅ Store ID configurato                                        │
│  ✅ Canale Telegram connesso                                    │
│  ✅ Prima automazione attiva                                    │
│                                                                 │
│  ⬜ Tracking IDs configurati                      [Configura →] │
│     Traccia vendite per singolo deal                           │
│                                                                 │
│  ⬜ Dati fatturazione                             [Completa →]  │
│     Necessari per ricevere fatture                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Stati Item

| Stato | Icona | Stile |
|-------|-------|-------|
| Completato | ✅ | Testo normale, colore success |
| Da completare | ⬜ | Testo normale + CTA button |
| Opzionale | ○ | Testo grigio, CTA secondario |
| Bloccato | 🔒 | Testo grigio, tooltip spiega prerequisiti |

### 6.4 Logica Completamento

```typescript
interface SetupProgress {
  accountCreated: boolean;       // Sempre true dopo signup
  storeIdConfigured: boolean;    // user.amazonAssociatesTag != null
  channelConnected: boolean;     // channels.length > 0
  firstAutomationActive: boolean; // automationRules.length > 0
  trackingIdsConfigured: boolean; // userTrackingIds.length >= 10
  billingConfigured: boolean;    // user.billingInfo != null
}

function calculateProgress(setup: SetupProgress): number {
  const required = [
    setup.accountCreated,
    setup.storeIdConfigured,
    setup.channelConnected,
    setup.firstAutomationActive
  ];
  
  const optional = [
    setup.trackingIdsConfigured,
    setup.billingConfigured
  ];
  
  const requiredComplete = required.filter(Boolean).length;
  const optionalComplete = optional.filter(Boolean).length;
  
  // Required = 70%, Optional = 30%
  const requiredPercent = (requiredComplete / required.length) * 70;
  const optionalPercent = (optionalComplete / optional.length) * 30;
  
  return Math.round(requiredPercent + optionalPercent);
}
```

### 6.5 Comportamento CTA

| Item | Click Action |
|------|--------------|
| Tracking IDs configurati | Naviga a Settings > Amazon Associates, apre modal |
| Dati fatturazione | Naviga a Settings > Fatturazione |

### 6.6 Dismissibilità

- **Non dismissibile** finché required items < 100%
- **Dismissibile** quando solo optional items mancanti
- Se dismissed, mostra solo barra minima: `"Setup 85% - Completa →"`

---

## 7. Integrazioni con Onboarding

### 7.1 Cosa Raccoglie l'Onboarding

| Campo | Onboarding | Settings |
|-------|------------|----------|
| Nome | ✅ Step 1 | ✅ Profilo |
| Store ID | ✅ Step 1 | ✅ Amazon Associates |
| Fuso orario | ✅ Step 1 (auto-detect) | ✅ Profilo |
| Canale Telegram | ✅ Step 2 | ✅ Canali |
| Audience Type | ✅ Step 3 | ❌ (per canale) |
| Prima Automazione | ✅ Step 4 | ✅ Automazioni |
| Tracking IDs | ❌ | ✅ Amazon Associates |
| Fatturazione | ❌ | ✅ Fatturazione |

### 7.2 Transizione Onboarding → Dashboard

```
Onboarding completato
        │
        ▼
┌─────────────────────┐
│  🎉 Sei pronto!     │
│                     │
│  [Vai alla Dashboard]
│                     │
│  💡 Tip: Configura  │
│  i Tracking IDs in  │
│  Settings per       │
│  analytics avanzati │
└─────────────────────┘
        │
        ▼
Dashboard con Setup Wizard visibile
```

---

## 8. API Endpoints

### 8.1 Store ID

**GET /api/user/amazon-associates**
```json
{
  "storeId": "topoffertetec-21",
  "trackingIdsCount": 7,
  "trackingIdsAvailable": 5,
  "trackingIdsInUse": 2
}
```

**PATCH /api/user/amazon-associates**
```json
{
  "storeId": "topoffertetec-21"
}
```

### 8.2 Tracking IDs Pool

**GET /api/tracking-ids**
```json
{
  "total": 7,
  "available": 5,
  "inUse": 2,
  "capacityPerDay": 7,
  "trackingIds": [
    { "trackingId": "hsgf-21", "status": "available", "totalUses": 12, "lastUsedAt": null },
    { "trackingId": "toft01-21", "status": "in_use", "totalUses": 8, "expiresAt": "2024-12-05T10:00:00Z" }
  ]
}
```

**POST /api/tracking-ids**
```json
{
  "trackingIds": "hsgf-21\nadsf0a-21\ngsfd-21"
}
```

Response:
```json
{
  "added": ["hsgf-21", "adsf0a-21"],
  "duplicates": [],
  "invalid": ["gsfd"],
  "alreadyExists": ["toft01-21"]
}
```

**DELETE /api/tracking-ids/:trackingId**
```json
{
  "success": true
}
```

### 8.3 Setup Progress

**GET /api/user/setup-progress**
```json
{
  "progress": 85,
  "items": {
    "accountCreated": true,
    "storeIdConfigured": true,
    "channelConnected": true,
    "firstAutomationActive": true,
    "trackingIdsConfigured": false,
    "billingConfigured": false
  }
}
```

---

## 9. Componenti React

### 9.1 Struttura File

```
components/settings/
├── SettingsLayout.tsx
├── tabs/
│   ├── ProfileTab.tsx
│   ├── BillingTab.tsx
│   ├── ApiKeysTab.tsx
│   ├── AmazonAssociatesTab.tsx    ← Nuova
│   ├── NotificationsTab.tsx
│   ├── SecurityTab.tsx
│   └── BetaTesterTab.tsx
├── amazon/
│   ├── StoreIdSection.tsx
│   ├── TrackingIdsSection.tsx
│   ├── TrackingIdsModal.tsx
│   ├── TrackingIdsGuideModal.tsx
│   └── PoolStatsCard.tsx
└── wizard/
    ├── SetupWizardCard.tsx
    └── SetupWizardItem.tsx

hooks/
├── useTrackingIds.ts
├── useSetupProgress.ts
└── useAmazonAssociates.ts
```

### 9.2 Hook useTrackingIds

```typescript
interface UseTrackingIdsReturn {
  // Data
  trackingIds: TrackingId[];
  stats: PoolStats;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  addTrackingIds: (input: string) => Promise<AddResult>;
  removeTrackingId: (trackingId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

function useTrackingIds(): UseTrackingIdsReturn {
  // Implementation with React Query or SWR
}
```

### 9.3 Hook useSetupProgress

```typescript
interface UseSetupProgressReturn {
  progress: number;
  items: SetupProgressItems;
  isComplete: boolean;
  isDismissed: boolean;
  dismiss: () => void;
  refetch: () => Promise<void>;
}

function useSetupProgress(): UseSetupProgressReturn {
  // Implementation
}
```

---

## 10. Analytics Events

### 10.1 Eventi Settings

| Evento | Proprietà | Quando |
|--------|-----------|--------|
| `settings_viewed` | `tab` | Apertura tab settings |
| `settings_saved` | `tab`, `fields_changed[]` | Salvataggio modifiche |
| `store_id_updated` | `previous`, `new` | Modifica Store ID |
| `tracking_ids_modal_opened` | `current_count` | Apertura modal |
| `tracking_ids_added` | `count`, `valid`, `invalid` | Aggiunta IDs |
| `tracking_ids_removed` | `tracking_id` | Rimozione ID |
| `tracking_ids_guide_viewed` | - | Apertura guida |

### 10.2 Eventi Setup Wizard

| Evento | Proprietà | Quando |
|--------|-----------|--------|
| `setup_wizard_viewed` | `progress`, `missing_items[]` | Visualizzazione wizard |
| `setup_wizard_item_clicked` | `item_name` | Click su item |
| `setup_wizard_dismissed` | `progress` | Dismissione wizard |
| `setup_wizard_completed` | `days_to_complete` | 100% completato |

---

## 11. Responsive Design

### 11.1 Breakpoints

| Breakpoint | Comportamento |
|------------|---------------|
| Desktop (>1024px) | Layout completo, modal larghi |
| Tablet (768-1024px) | Sezioni stacked, modal 90% width |
| Mobile (<768px) | Full-width, modal fullscreen |

### 11.2 Mobile Considerations

- Textarea tracking IDs: height auto-expand
- Stats pool: layout verticale invece di orizzontale
- Modal: fullscreen con header fixed
- Setup Wizard: collapsibile

---

## 12. Accessibilità

### 12.1 Requisiti

- [ ] Focus management nel modal
- [ ] Aria-labels su tutti i controlli
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader announcements per validazione
- [ ] Contrasto colori WCAG AA

### 12.2 Aria Labels

```html
<button aria-label="Gestisci pool tracking IDs">
  Gestisci Pool →
</button>

<textarea 
  aria-label="Tracking IDs, uno per riga"
  aria-describedby="tracking-ids-help"
/>

<div id="tracking-ids-help">
  Incolla i tracking IDs creati su Amazon, uno per riga
</div>
```

---

## 13. Testing Checklist

### 13.1 Funzionalità

- [ ] Store ID: salvataggio e validazione
- [ ] Store ID: feedback errore formato
- [ ] Tracking IDs: parsing copia-incolla
- [ ] Tracking IDs: riconoscimento duplicati
- [ ] Tracking IDs: riconoscimento invalidi
- [ ] Tracking IDs: aggiunta al pool
- [ ] Tracking IDs: rimozione dal pool
- [ ] Tracking IDs: visualizzazione stats
- [ ] Modal: apertura/chiusura
- [ ] Modal guida: contenuto corretto
- [ ] Setup Wizard: progress calculation
- [ ] Setup Wizard: navigation to settings
- [ ] Setup Wizard: dismiss behavior

### 13.2 Edge Cases

- [ ] Pool vuoto: UI corretta
- [ ] Pool pieno (100 IDs): comportamento
- [ ] Tutti IDs in uso: UI warning
- [ ] Incolla lista vuota: nessun errore
- [ ] Incolla caratteri speciali: handling
- [ ] Store ID con spazi: trim automatico
- [ ] Connessione lenta: loading states
- [ ] Errore API: error states

### 13.3 Responsive

- [ ] Mobile: modal fullscreen
- [ ] Mobile: textarea usabile
- [ ] Tablet: layout corretto
- [ ] Desktop: tutte le feature visibili

---

## 14. Implementation Priority

### Phase 1: Core (Week 1)
- [ ] Rinomina tab "Tag Affiliato" → "Amazon Associates"
- [ ] Sezione Store ID (già esistente, riposizionare)
- [ ] Sezione Tracking IDs Pool (placeholder)
- [ ] API endpoints base

### Phase 2: Pool Management (Week 2)
- [ ] Modal "Gestisci Pool"
- [ ] Parsing e validazione tracking IDs
- [ ] Salvataggio in DB
- [ ] Stats pool real-time

### Phase 3: Setup Wizard (Week 2-3)
- [ ] Card Setup Wizard in Dashboard
- [ ] Calcolo progress
- [ ] Navigation to settings
- [ ] Dismiss behavior

### Phase 4: Polish (Week 3)
- [ ] Modal guida con steps
- [ ] Link a video tutorial
- [ ] Analytics events
- [ ] Responsive refinements

---

## 15. Sezione 3: Import Report Amazon (CSV Importer)

### 15.1 Overview

La terza sezione della tab "Amazon Associates" permette agli utenti di importare i report CSV scaricati dalla dashboard Amazon Associates per:

- Popolare dati storici di conversione
- Validare performance tracking IDs
- Sbloccare analytics avanzati con dati reali
- Calcolare metriche accurate (CVR, EPC, Revenue)

### 15.2 Layout Sezione Import

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Sincronizza Report Amazon                                   │
│  Importa i tuoi dati per analytics avanzati                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  📈 Importa i report da Amazon Associates per           │   │
│  │     sbloccare analytics avanzati e ottimizzazione AI    │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  📅 Ultimo import: 2 dic 2024                   │   │   │
│  │  │  📦 Ordini importati: 59                        │   │   │
│  │  │  💰 Revenue tracciata: €42.01                   │   │   │
│  │  │  🎯 Match con deal Afflyt: 23 (39%)             │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  [📥 Importa Report CSV]    [📜 Storico Import]        │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.3 Stato: Nessun Import (First Time)

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Sincronizza Report Amazon                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │        📊                                               │   │
│  │                                                         │   │
│  │  Importa i tuoi report Amazon Associates per            │   │
│  │  sbloccare analytics avanzati e ottimizzazione AI       │   │
│  │                                                         │   │
│  │  ✓ Vedi quali deal convertono meglio                    │   │
│  │  ✓ Calcola CVR e revenue reali                          │   │
│  │  ✓ Ottimizza automaticamente lo scoring                 │   │
│  │                                                         │   │
│  │  Ultimo import: Mai                                     │   │
│  │                                                         │   │
│  │           [📥 Importa Report CSV]                       │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.4 Modal Import - Step 1: Istruzioni

```
┌─────────────────────────────────────────────────────────────────┐
│  📥 Importa Report Amazon Associates                      [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 Come scaricare i report                                    │
│                                                                 │
│  1. Vai su affiliate-program.amazon.it/home/reports            │
│                                                                 │
│  2. Seleziona il periodo (consigliamo ultimi 12 mesi)          │
│                                                                 │
│  3. Scarica questi report come CSV:                            │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐   │
│     │  Report             │ Cosa contiene    │ Priorità  │   │
│     ├─────────────────────────────────────────────────────┤   │
│     │  📦 Fee-Orders      │ Ordini           │ ⭐ Critico │   │
│     │  💰 Fee-Earnings    │ Guadagni         │ ⭐ Critico │   │
│     │  📈 Fee-DailyTrends │ Trend giornalieri│ 🔶 Consigliato│
│     │  🏷️ Fee-Tracking    │ Per tracking ID  │ ⚪ Opzionale │
│     └─────────────────────────────────────────────────────┘   │
│                                                                 │
│  💡 Tip: Puoi trascinare tutti i file insieme!                 │
│                                                                 │
│                                    [Avanti →]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.5 Modal Import - Step 2: Upload Files

```
┌─────────────────────────────────────────────────────────────────┐
│  📥 Importa Report Amazon Associates                      [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [← Indietro]                              Step 2 di 3         │
│                                                                 │
│  📁 Carica i file CSV                                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │              ┌─────────┐                                │   │
│  │              │  📄     │                                │   │
│  │              │   +     │                                │   │
│  │              └─────────┘                                │   │
│  │                                                         │   │
│  │      Trascina i file CSV qui                            │   │
│  │      oppure [Sfoglia file]                              │   │
│  │                                                         │   │
│  │      Formati supportati: .csv (max 10MB per file)       │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  File caricati:                                                │
│  (nessun file)                                                 │
│                                                                 │
│                              [Annulla]    [📊 Importa Dati]    │
│                                           (disabilitato)       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.6 Modal Import - Step 2: Files Caricati

```
┌─────────────────────────────────────────────────────────────────┐
│  📥 Importa Report Amazon Associates                      [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [← Indietro]                              Step 2 di 3         │
│                                                                 │
│  📁 Carica i file CSV                                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │      Trascina altri file CSV qui                        │   │
│  │      oppure [Sfoglia file]                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  File caricati:                                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ✅ Fee-Orders-xxx.csv           📦 Ordini      59 righe │ 🗑️│
│  │    Rilevato: Fee-Orders                                 │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ✅ Fee-Earnings-xxx.csv         💰 Guadagni    31 righe │ 🗑️│
│  │    Rilevato: Fee-Earnings                               │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ✅ Fee-DailyTrends-xxx.csv      📈 Trend       64 righe │ 🗑️│
│  │    Rilevato: Fee-DailyTrends                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚠️ Fee-Tracking non caricato (opzionale)                      │
│                                                                 │
│                              [Annulla]    [📊 Importa Dati]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.7 Modal Import - Step 3: Processing

```
┌─────────────────────────────────────────────────────────────────┐
│  📥 Importazione in corso...                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                              Step 3 di 3                        │
│                                                                 │
│  ████████████████████░░░░░░░░░░  67%                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  ✅ Fee-Orders                                          │   │
│  │     59 ordini analizzati                                │   │
│  │     23 abbinati a deal Afflyt                           │   │
│  │                                                         │   │
│  │  ✅ Fee-Earnings                                        │   │
│  │     31 guadagni importati                               │   │
│  │     €42.01 revenue totale                               │   │
│  │                                                         │   │
│  │  🔄 Fee-DailyTrends                                     │   │
│  │     Elaborazione trend giornalieri...                   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⏳ Tempo stimato: ~10 secondi                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.8 Modal Import - Step 3: Completato

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Importazione completata!                              [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ✓                                            │
│                  ─────                                          │
│                                                                 │
│  📊 Riepilogo Import                                           │
│                                                                 │
│  ┌─────────────────┬─────────────────┬─────────────────┐       │
│  │    📦 Ordini    │   💰 Guadagni   │    📈 Giorni    │       │
│  │       59        │     €42.01      │       64        │       │
│  └─────────────────┴─────────────────┴─────────────────┘       │
│                                                                 │
│  🔗 Match con deal Afflyt                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ├── Abbinati automaticamente: 23                       │   │
│  │  ├── Non abbinati (pre-Afflyt): 36                      │   │
│  │  └── Tracking IDs riconosciuti: 1                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📈 Analytics aggiornati                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CVR reale calcolato:     5.6%                          │   │
│  │  EPC medio:               €0.07                         │   │
│  │  Top categoria:           Computer & Tablet             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│              [Chiudi]            [Vai ad Analytics →]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.9 Modal Storico Import

```
┌─────────────────────────────────────────────────────────────────┐
│  📜 Storico Import                                        [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Data        │ File                │ Righe  │ Match │ St │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 02/12/2024  │ Fee-Orders-xxx.csv  │ 59     │ 23    │ ✅ │ 🗑️│
│  │ 02/12/2024  │ Fee-Earnings-xxx.csv│ 31     │ 31    │ ✅ │ 🗑️│
│  │ 02/12/2024  │ Fee-DailyTrends-xxx │ 64     │ -     │ ✅ │ 🗑️│
│  │ 15/11/2024  │ Fee-Orders-xxx.csv  │ 45     │ 18    │ ✅ │ 🗑️│
│  │ 15/11/2024  │ Fee-Earnings-xxx.csv│ 22     │ 22    │ ✅ │ 🗑️│
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📊 Totali                                                     │
│  ├── Import totali: 5                                          │
│  ├── Ordini importati: 104                                     │
│  ├── Revenue tracciata: €89.50                                 │
│  └── Periodo coperto: Giu 2024 - Dic 2024                      │
│                                                                 │
│  💡 Importa regolarmente per analytics più accurati            │
│                                                                 │
│                                              [Chiudi]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.10 Stati di Errore

#### File Non Riconosciuto

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ report_vendite.csv              ❓ Sconosciuto              │ 🗑️│
│    Tipo report non riconosciuto. Usa i file originali Amazon   │   │
└─────────────────────────────────────────────────────────────────┘
```

#### File Troppo Grande

```
┌─────────────────────────────────────────────────────────────────┐
│ ❌ Fee-Orders-xxx.csv              📦 Ordini      Errore       │ 🗑️│
│    File troppo grande (15MB). Massimo consentito: 10MB         │   │
└─────────────────────────────────────────────────────────────────┘
```

#### Errore Parsing

```
┌─────────────────────────────────────────────────────────────────┐
│ ❌ Fee-Orders-xxx.csv              📦 Ordini      Errore       │ 🗑️│
│    Errore parsing riga 45: formato data non valido             │   │
└─────────────────────────────────────────────────────────────────┘
```

### 15.11 Banner Reminder in Dashboard

Se l'utente non ha mai importato o l'ultimo import è > 30 giorni:

```
┌─────────────────────────────────────────────────────────────────┐
│  💡 Migliora i tuoi analytics                                  │
│                                                                 │
│  Importa i tuoi report Amazon Associates per sbloccare:        │
│  • CVR e revenue reali per ogni deal                           │
│  • Ottimizzazione automatica dello scoring                     │
│  • Insights su cosa converte meglio                            │
│                                                                 │
│                    [Importa Report →]              [Nascondi]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.12 Componenti React

#### FileDropzone

```tsx
interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  maxFiles?: number;
}

// Stati:
// - idle: "Trascina i file CSV qui"
// - dragover: bordo blu, sfondo azzurro chiaro
// - uploading: spinner
// - error: bordo rosso, messaggio errore
```

#### ImportFileRow

```tsx
interface ImportFileRowProps {
  file: File;
  status: 'parsing' | 'ready' | 'error' | 'importing' | 'done';
  detectedType: ReportType | null;
  rowCount: number | null;
  error: string | null;
  onRemove: () => void;
}
```

#### ImportProgress

```tsx
interface ImportProgressProps {
  files: Array<{
    name: string;
    type: ReportType;
    status: 'pending' | 'processing' | 'done' | 'error';
    progress: number;
    result?: ImportResult;
  }>;
  overallProgress: number;
}
```

#### ImportResults

```tsx
interface ImportResultsProps {
  results: ImportResult[];
  aggregateStats: {
    totalOrders: number;
    totalRevenue: number;
    matchedDeals: number;
    unmatchedDeals: number;
    topCategory: string;
    cvr: number;
    epc: number;
  };
  onClose: () => void;
  onGoToAnalytics: () => void;
}
```

### 15.13 API Integration

```typescript
// Hooks
const useImportCSV = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  
  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    
    const response = await fetch('/api/user/amazon-import/upload-multiple', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    setResults(data.results);
    setIsUploading(false);
  };
  
  return { uploadFiles, isUploading, progress, results };
};

const useImportHistory = () => {
  return useQuery('import-history', () => 
    fetch('/api/user/amazon-import/history').then(r => r.json())
  );
};

const useImportStats = () => {
  return useQuery('import-stats', () => 
    fetch('/api/user/amazon-import/stats').then(r => r.json())
  );
};
```

### 15.14 Auto-Detection Logic (Frontend)

```typescript
const detectReportType = (file: File): Promise<{
  type: ReportType | null;
  confidence: number;
  rowCount: number;
}> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      
      // Check first line for report identifier
      const firstLine = lines[0]?.toLowerCase() || '';
      
      let type: ReportType | null = null;
      let confidence = 0;
      
      if (firstLine.includes('orders') || firstLine.includes('ordini')) {
        type = 'orders';
        confidence = 0.9;
      } else if (firstLine.includes('earnings') || firstLine.includes('guadagni')) {
        type = 'earnings';
        confidence = 0.9;
      } else if (firstLine.includes('daily') || firstLine.includes('trend')) {
        type = 'daily_trends';
        confidence = 0.9;
      } else if (firstLine.includes('tracking') || firstLine.includes('monitoraggio')) {
        type = 'tracking';
        confidence = 0.9;
      }
      
      // Also check headers in second line
      const headers = lines[1]?.toLowerCase() || '';
      if (!type) {
        if (headers.includes('asin') && headers.includes('quantità')) {
          type = 'orders';
          confidence = 0.7;
        } else if (headers.includes('commissioni') || headers.includes('spedizione')) {
          type = 'earnings';
          confidence = 0.7;
        }
      }
      
      // Count rows (excluding header lines)
      const rowCount = lines.filter(l => l.trim()).length - 2;
      
      resolve({ type, confidence, rowCount });
    };
    
    reader.readAsText(file);
  });
};
```

### 15.15 Validazione Pre-Upload

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const validateFiles = (files: File[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check file count
  if (files.length > 5) {
    errors.push('Massimo 5 file per volta');
  }
  
  // Check file sizes
  files.forEach(f => {
    if (f.size > 10 * 1024 * 1024) {
      errors.push(`${f.name} supera il limite di 10MB`);
    }
  });
  
  // Check file types
  files.forEach(f => {
    if (!f.name.endsWith('.csv')) {
      errors.push(`${f.name} non è un file CSV`);
    }
  });
  
  // Check for required files
  const hasOrders = files.some(f => 
    f.name.toLowerCase().includes('orders') || 
    f.name.toLowerCase().includes('ordini')
  );
  
  if (!hasOrders) {
    warnings.push('Report Fee-Orders non trovato (consigliato)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
```

### 15.16 PostHog Events

```typescript
// Eventi da tracciare
posthog.capture('csv_import_started', {
  fileCount: files.length,
  fileTypes: detectedTypes,
  totalSize: totalBytes
});

posthog.capture('csv_import_completed', {
  success: true,
  ordersImported: result.ordersTotal,
  revenueTracked: result.totalRevenue,
  matchRate: result.matchedDeals / result.totalDeals,
  duration: elapsedMs
});

posthog.capture('csv_import_error', {
  errorType: 'parsing' | 'upload' | 'validation',
  fileName: file.name,
  errorMessage: error.message
});
```

---

## 16. Layout Completo Tab Amazon Associates (Aggiornato)

```
┌─────────────────────────────────────────────────────────────────┐
│  🛒 Amazon Associates                                           │
│  Configura il tuo account affiliato Amazon                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📦 SEZIONE 1: STORE ID                                 │   │
│  │  [Input Store ID con validazione]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🎯 SEZIONE 2: TRACKING IDS POOL (Avanzato)            │   │
│  │  [Pool manager con stats]                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📊 SEZIONE 3: SINCRONIZZA REPORT                       │   │
│  │  [Import CSV con stats e storico]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                         [💾 Salva Modifiche]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 17. Documenti Correlati

| Documento | Descrizione |
|-----------|-------------|
| `afflyt-optimization-system-report.md` | Architettura algoritmi, TrackingIdPoolService |
| `afflyt-ux-guide.md` | Design system, componenti base |
| `afflyt-onboarding-spec.md` | Flow onboarding, cosa si raccoglie |
| **Questo documento** | Specifiche UI Settings + Import CSV |

---

## 18. Implementation Checklist (Aggiornato)

### Phase 1: Amazon Associates Base (Week 1)
- [x] Rinomina tab "Tag Affiliato" → "Amazon Associates"
- [x] Sezione Store ID
- [x] Validazione input

### Phase 2: Tracking IDs Pool (Week 1-2)
- [x] Sezione collapsible "Tracking IDs Pool"
- [x] Modal "Gestisci Pool"
- [x] Parsing e validazione tracking IDs
- [x] Salvataggio in DB
- [x] Stats pool real-time

### Phase 3: Setup Wizard (Week 2-3)
- [ ] Card Setup Wizard in Dashboard
- [ ] Calcolo progress
- [ ] Navigation to settings
- [ ] Dismiss behavior

### Phase 4: CSV Import UI (Week 3-4)
- [ ] Sezione 3 "Sincronizza Report" nel tab
- [ ] FileDropzone component
- [ ] Auto-detection report type
- [ ] Modal multi-step import
- [ ] Progress tracking
- [ ] Results summary
- [ ] Import history modal
- [ ] Banner reminder in Dashboard
- [ ] PostHog events tracking

### Phase 5: Polish (Week 4)
- [ ] Modal guida con steps
- [ ] Link a video tutorial
- [ ] Analytics events completi
- [ ] Responsive refinements
- [ ] Error states e recovery

---

*Documento creato: Dicembre 2024*  
*Versione: 1.1 - Aggiunto Import CSV UI*
