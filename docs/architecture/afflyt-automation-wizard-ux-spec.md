# AFFLYT - Automation Wizard UX Specification

## Overview

Wizard a 7 step per la creazione di automazioni. Ogni step ha un focus singolo e chiaro.

```
Step 1: 🎯 Obiettivo      → Nome, descrizione
Step 2: 📦 Cosa Cercare   → Categorie + dealPublishMode
Step 3: 🎚️ Filtri        → Score, prezzo, rating (gated by plan)
Step 4: ⏰ Quando         → Schedule preset + publishingMode
Step 5: 📢 Dove           → Canale + opzioni post
Step 6: ✍️ Come           → Copy: template vs LLM
Step 7: ✅ Review         → Riepilogo con edit inline
```

---

## Step 1: Obiettivo

### Scopo
Dare un nome identificativo all'automazione.

### Campi

| Campo | Tipo | Required | Max Length | Default |
|-------|------|----------|------------|---------|
| name | text | ✅ | 200 | - |
| description | textarea | ❌ | 500 | null |

### UI

```
┌─────────────────────────────────────────────────────────┐
│  🎯 Dai un nome alla tua automazione                    │
│                                                         │
│  Nome *                                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Offerte Tech Daily                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Descrizione (opzionale)                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Le migliori offerte tech per il mio canale      │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 Tip: Un nome chiaro ti aiuta a gestire più         │
│     automazioni. Es: "Tech Weekend", "Flash Deals"      │
│                                                         │
│                              [Continua →]               │
└─────────────────────────────────────────────────────────┘
```

### Validazione
- Nome: required, min 3 chars, max 200 chars
- Descrizione: optional, max 500 chars

---

## Step 2: Cosa Cercare

### Scopo
Selezionare categorie e tipo di deal da cercare.

### Campi

| Campo | Tipo | Required | Default | Plan Limit |
|-------|------|----------|---------|------------|
| categories | multi-select | ✅ | - | FREE: 3, PRO: 8, BIZ: 16 |
| dealPublishMode | radio | ✅ | DISCOUNTED_ONLY | - |

### dealPublishMode Values

| Value | Label | Description |
|-------|-------|-------------|
| DISCOUNTED_ONLY | Solo scontati | Prezzo barrato visibile |
| LOWEST_PRICE | Solo minimi storici | Al minimo anche senza sconto |
| BOTH | Entrambi | Tutti i deal validi |

### Categorie Amazon IT

| ID | Emoji | Nome IT | Volume |
|----|-------|---------|--------|
| 412609031 | 📱 | Elettronica | 17M |
| 425916031 | 💻 | Informatica | 7M |
| 523997031 | 🎮 | Giochi | 6M |
| 524015031 | 🏠 | Casa e cucina | 65M |
| 5512286031 | 👕 | Moda | 79M |
| 524012031 | ⚽ | Sport | 15M |
| 1571280031 | 🏍️ | Auto e Moto | 28M |
| 635016031 | 🌱 | Giardino | 13M |
| 6198082031 | 💄 | Bellezza | 6M |
| 12472499031 | 🐕 | Animali | 6M |
| 2454160031 | 🔧 | Fai da te | 23M |
| 1571289031 | 💊 | Salute | 5M |
| 1571286031 | 👶 | Prima infanzia | 3M |
| 3628629031 | 🎸 | Strumenti musicali | 3M |
| 411663031 | 📚 | Libri | 21M |
| 3606310031 | 📎 | Cancelleria | 5M |

### UI

```
┌─────────────────────────────────────────────────────────┐
│  📦 Che tipo di offerte vuoi trovare?                   │
│                                                         │
│  CATEGORIE (seleziona fino a 3)           [2/3 FREE]   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ☑️ 📱 Elettronica                    17M prod.  │   │
│  │ ☑️ 💻 Informatica                     7M prod.  │   │
│  │ ☐ 🎮 Giochi e Videogiochi            6M prod.  │   │
│  │ ☐ 🏠 Casa e cucina                   65M prod.  │   │
│  │ ☐ 👕 Moda                            79M prod.  │   │
│  │ ☐ ⚽ Sport                           15M prod.  │   │
│  │    ... [Mostra tutte le 16 categorie]            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  TIPO DI DEAL                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ◉ Solo scontati     Prezzo barrato visibile     │   │
│  │ ○ Solo minimi       Al minimo storico           │   │
│  │ ○ Entrambi          Tutti i deal validi         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                    [← Indietro]  [Continua →]          │
└─────────────────────────────────────────────────────────┘
```

### Validazione
- Almeno 1 categoria selezionata
- Max categorie = plan limit
- Se supera limit → mostra upsell

---

## Step 3: Filtri

### Scopo
Configurare soglie di qualità e filtri avanzati.

### Campi

| Campo | Tipo | Default | Plan |
|-------|------|---------|------|
| minScore | slider | 35 | FREE |
| minPrice | number | null | PRO |
| maxPrice | number | null | PRO |
| minDiscount | number | null | PRO |
| minRating | select | null | PRO |
| minReviews | number | null | PRO |
| maxSalesRank | number | null | PRO |
| amazonOnly | toggle | false | BIZ |
| fbaOnly | toggle | false | BIZ |
| primeOnly | toggle | false | BIZ |
| hasCoupon | toggle | false | BIZ |

### minScore Thresholds

| Value | Label | Emoji | Description |
|-------|-------|-------|-------------|
| 0-34 | Tutte | 😐 | Anche deal mediocri |
| 35-44 | Buone | 🙂 | Filtro base (default) |
| 45-59 | Ottime | 😊 | Consigliato |
| 60+ | Eccellenti | 🤩 | Solo top deal |

### minRating Values

| Value | Label |
|-------|-------|
| 300 | ⭐⭐⭐ (3+) |
| 350 | ⭐⭐⭐½ (3.5+) |
| 400 | ⭐⭐⭐⭐ (4+) |
| 450 | ⭐⭐⭐⭐½ (4.5+) |

### UI

```
┌─────────────────────────────────────────────────────────┐
│  🎚️ Quanto devono essere buone le offerte?             │
│                                                         │
│  DEAL SCORE MINIMO                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │         😐        🙂        😊        🤩        │   │
│  │    0━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━100   │   │
│  │                  ▲                              │   │
│  │                 45                              │   │
│  │                                                  │   │
│  │  45+ = Offerte ottime (consigliato)             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ────────────────────────────────────────────────────  │
│                                                         │
│  FILTRI AVANZATI                              [PRO]    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Prezzo       €[10     ] - €[200    ]          │   │
│  │  Sconto min   [20%              ▼]             │   │
│  │  Rating min   [⭐⭐⭐⭐ (4+)      ▼]             │   │
│  │  Recensioni   [100+             ▼]             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🔒 FILTRI BUSINESS                        [UPGRADE]   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ☐ Solo venduto da Amazon                 🔒    │   │
│  │  ☐ Solo spedito FBA                       🔒    │   │
│  │  ☐ Solo Prime                             🔒    │   │
│  │  ☐ Solo con coupon                        🔒    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                    [← Indietro]  [Continua →]          │
└─────────────────────────────────────────────────────────┘
```

### Comportamento Plan Gating
- FREE: Solo minScore visibile e attivo
- PRO: Filtri avanzati sbloccati
- BIZ: Tutti i filtri sbloccati
- Filtri locked: visibili ma disabilitati con lucchetto

---

## Step 4: Quando

### Scopo
Configurare frequenza e modalità di pubblicazione.

### Campi

| Campo | Tipo | Default | Plan |
|-------|------|---------|------|
| schedulePreset | radio | "active" | FREE: relaxed/active, PRO: +intensive/custom |
| publishingMode | radio | "smart" | ALL |
| intervalMinutes | number | - | PRO (solo custom) |
| dealsPerRun | number | - | PRO (solo custom) |

### Schedule Presets

| Preset | Intervallo | Deals/Run | Plan | Label |
|--------|------------|-----------|------|-------|
| relaxed | 360 min (6h) | 3 | FREE | 😴 Rilassato |
| active | 120 min (2h) | 3 | FREE | ⚡ Attivo |
| intensive | 60 min (1h) | 5 | PRO | 🔥 Intensivo |
| custom | User defined | User defined | PRO | ⚙️ Custom |

### Publishing Mode

| Value | Label | Description |
|-------|-------|-------------|
| smart | 🧠 Smart Timing | Pubblica negli orari migliori (da ChannelInsights) |
| immediate | ⚡ Immediato | Pubblica subito quando trova deal |

### UI

```
┌─────────────────────────────────────────────────────────┐
│  ⏰ Quando pubblicare?                                  │
│                                                         │
│  FREQUENZA                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  ○ 😴 Rilassato        ◉ ⚡ Attivo              │   │
│  │     6h, 3 deal/run        2h, 3 deal/run        │   │
│  │                                                  │   │
│  │  ○ 🔥 Intensivo       ○ ⚙️ Custom    [PRO]     │   │
│  │     1h, 5 deal/run        Personalizza          │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Custom Settings (solo se custom) ──────────────┐   │
│  │  Intervallo:  [    90    ] minuti (min: 60)     │   │
│  │  Deal/run:    [     4    ] (max: 10)            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  MODALITÀ PUBBLICAZIONE                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  ◉ 🧠 Smart Timing                              │   │
│  │     Pubblica negli orari migliori per il tuo    │   │
│  │     canale (basato su analytics)                │   │
│  │                                                  │   │
│  │  ○ ⚡ Immediato                                  │   │
│  │     Pubblica appena trova un deal valido        │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📊 Stima: ~12-15 post/giorno con Attivo + Smart      │
│                                                         │
│                    [← Indietro]  [Continua →]          │
└─────────────────────────────────────────────────────────┘
```

### Validazione
- Se custom: intervalMinutes >= 60 (PRO) o >= 30 (BIZ)
- Se custom: dealsPerRun 1-10 (PRO) o 1-30 (BIZ)

---

## Step 5: Dove

### Scopo
Selezionare canale e opzioni del post.

### Campi

| Campo | Tipo | Default |
|-------|------|---------|
| channelId | select | - |
| showKeepaButton | toggle | true |

### UI

```
┌─────────────────────────────────────────────────────────┐
│  📢 Dove pubblicare?                                    │
│                                                         │
│  CANALE DESTINAZIONE                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  ◉ 📱 Offerte Tech Italia                       │   │
│  │     @offertetechit · 1.234 iscritti · 💚 92%    │   │
│  │                                                  │   │
│  │  ○ 🏍️ Mondo Moto Deals                          │   │
│  │     @motodeals · 567 iscritti · 💛 78%          │   │
│  │                                                  │   │
│  │  ○ ➕ Aggiungi nuovo canale...                   │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  BOTTONI POST                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  ☑️ 🛒 Acquista su Amazon      (sempre attivo)  │   │
│  │                                                  │   │
│  │  ☑️ 📊 Storico Prezzi                           │   │
│  │        Bottone per vedere il grafico Keepa      │   │
│  │        (si apre nel browser)                    │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  PREVIEW BOTTONI                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │   [🛒 Acquista]  [📊 Storico Prezzi]            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                    [← Indietro]  [Continua →]          │
└─────────────────────────────────────────────────────────┘
```

### Channel Display Info

Mostrare per ogni canale:
- Emoji (basato su categoria o custom)
- Nome
- Username/ID (@xxx o -100xxx)
- Member count
- Health Score con colore (💚 80+, 💛 50-79, ❤️ <50)

### Validazione
- Almeno un canale selezionato
- Canale deve essere in stato ACTIVE

---

## Step 6: Come

### Scopo
Configurare generazione del copy dei post.

### Campi

| Campo | Tipo | Default | Plan |
|-------|------|---------|------|
| copyMode | radio | "TEMPLATE" | LLM = PRO+ |
| llmModel | select | "gpt-4o-mini" | PRO+ |
| customStylePrompt | textarea | null | PRO+ |
| messageTemplate | textarea | default | ALL |

### copyMode Values

| Value | Label | Plan |
|-------|-------|------|
| TEMPLATE | 📝 Template Standard | ALL |
| LLM | 🤖 AI Generated | PRO+ |

### llmModel Values

| Value | Label | Cost | Quality |
|-------|-------|------|---------|
| gpt-4o-mini | GPT-4o Mini | 💰 | ⭐⭐⭐ |
| gpt-4o | GPT-4o | 💰💰 | ⭐⭐⭐⭐ |
| gpt-4-turbo | GPT-4 Turbo | 💰💰💰 | ⭐⭐⭐⭐⭐ |

### Default Template

```
🔥 {title}

💰 {price} {originalPrice|strikethrough}
📉 -{discount}% · ⭐ {rating} ({reviewCount} recensioni)

🔗 {link}
```

### UI

```
┌─────────────────────────────────────────────────────────┐
│  ✍️ Come scrivere i post?                               │
│                                                         │
│  MODALITÀ                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  ◉ 📝 Template Standard                         │   │
│  │     Formato collaudato, veloce, zero costi      │   │
│  │                                                  │   │
│  │  ○ 🤖 AI Generated                      [PRO]   │   │
│  │     Copy unico e persuasivo per ogni deal       │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ PREVIEW TEMPLATE ──────────────────────────────┐   │
│  │                                                  │   │
│  │  🔥 Apple AirPods Pro                           │   │
│  │                                                  │   │
│  │  💰 €199.00  €̶2̶7̶9̶.̶0̶0̶                          │   │
│  │  📉 -29% · ⭐ 4.5 (12.543 recensioni)           │   │
│  │                                                  │   │
│  │  [🛒 Acquista]  [📊 Storico Prezzi]             │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ─────────── Opzioni AI (se selezionato) ───────────  │
│                                                         │
│  MODELLO AI                                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ◉ gpt-4o-mini    Veloce, economico     💰     │   │
│  │  ○ gpt-4o         Qualità premium       💰💰   │   │
│  │  ○ gpt-4-turbo    Massima qualità       💰💰💰 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  STILE PERSONALIZZATO (opzionale)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Descrivi come vuoi che scriva l'AI...           │   │
│  │ [Tono entusiasta ma non esagerato. Usa emoji   ]│   │
│  │ [con moderazione. Evidenzia sempre il          ]│   │
│  │ [risparmio in euro.                            ]│   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ⚠️ Limite: 50 post AI/giorno                          │
│                                                         │
│                    [← Indietro]  [Continua →]          │
└─────────────────────────────────────────────────────────┘
```

### Template Editor (Opzionale Advanced)

Per utenti che vogliono customizzare il template:

```
┌─────────────────────────────────────────────────────────┐
│  📝 TEMPLATE PERSONALIZZATO                [Advanced]   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔥 {title}                                      │   │
│  │                                                  │   │
│  │ 💰 {price} {originalPrice|strikethrough}        │   │
│  │ 📉 -{discount}% · ⭐ {rating}                   │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Placeholder disponibili:                              │
│  {title} {price} {originalPrice} {discount}            │
│  {rating} {reviewCount} {category} {link}              │
└─────────────────────────────────────────────────────────┘
```

### Validazione
- Se LLM e piano FREE → mostra upsell
- customStylePrompt: max 500 chars

---

## Step 7: Review

### Scopo
Riepilogo completo con possibilità di edit inline.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  ✅ Riepilogo Automazione                               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🎯 OBIETTIVO                           [Edit]  │   │
│  │  ────────────────────────────────────────────── │   │
│  │  Nome: Offerte Tech Daily                       │   │
│  │  Descrizione: Le migliori offerte tech per...   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📦 COSA CERCARE                        [Edit]  │   │
│  │  ────────────────────────────────────────────── │   │
│  │  Categorie: Elettronica, Informatica            │   │
│  │  Tipo deal: Solo scontati                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🎚️ FILTRI                              [Edit]  │   │
│  │  ────────────────────────────────────────────── │   │
│  │  Score minimo: 45+                              │   │
│  │  Prezzo: €10 - €200                             │   │
│  │  Rating: 4+ stelle                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ⏰ QUANDO                               [Edit]  │   │
│  │  ────────────────────────────────────────────── │   │
│  │  Frequenza: ⚡ Attivo (ogni 2h, 3 deal/run)     │   │
│  │  Modalità: 🧠 Smart Timing                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📢 DOVE                                 [Edit]  │   │
│  │  ────────────────────────────────────────────── │   │
│  │  Canale: @offertetechit (1.234 iscritti)        │   │
│  │  Bottoni: 🛒 Acquista, 📊 Storico Prezzi       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ✍️ COME                                 [Edit]  │   │
│  │  ────────────────────────────────────────────── │   │
│  │  Copy: 📝 Template Standard                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📊 STIMA OUTPUT                                │   │
│  │  ────────────────────────────────────────────── │   │
│  │  Post stimati: ~12-15/giorno                    │   │
│  │  Prima esecuzione: oggi alle 14:30              │   │
│  │  Costo AI: €0.00/giorno (template)              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│           [← Indietro]  [🚀 Crea Automazione]          │
└─────────────────────────────────────────────────────────┘
```

### Edit Behavior
- Click [Edit] → torna allo step specifico
- Dopo edit → torna a Review (non ricomincia)

### Stima Output Calculation

```typescript
const postsPerDay = (24 * 60 / intervalMinutes) * dealsPerRun;
const firstRun = new Date(); // next interval
const aiCostPerDay = copyMode === 'LLM' 
  ? postsPerDay * costPerModel[llmModel] 
  : 0;
```

---

## Comportamenti Globali

### Progress Indicator

```
┌─────────────────────────────────────────────────────────┐
│  ●───●───●───●───○───○───○                              │
│  1   2   3   4   5   6   7                              │
│                                                         │
│  Step 4 di 7: Quando                                   │
└─────────────────────────────────────────────────────────┘
```

### Navigation
- [← Indietro]: Sempre visibile (tranne Step 1)
- [Continua →]: Validazione prima di procedere
- Click su step completato nel progress: torna a quello step
- ESC o click fuori: Conferma "Vuoi abbandonare?"

### Plan Gating UI

```
┌─────────────────────────────────────────────────────────┐
│  🔒 Funzionalità PRO                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Questa funzionalità richiede il piano PRO      │   │
│  │                                                  │   │
│  │  [Scopri PRO →]    [Continua senza]             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Save Draft (Auto)
- Salva in localStorage ogni cambio step
- Ripristina se utente ritorna entro 24h
- Clear dopo creazione completata

### Error States

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Errore                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Non è stato possibile creare l'automazione.    │   │
│  │  Errore: Channel not found                      │   │
│  │                                                  │   │
│  │  [Riprova]    [Contatta Supporto]               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## API Payload Finale

```typescript
interface CreateAutomationPayload {
  // Step 1
  name: string;
  description?: string;
  
  // Step 2
  categories: string[];
  dealPublishMode: 'DISCOUNTED_ONLY' | 'LOWEST_PRICE' | 'BOTH';
  
  // Step 3
  minScore: number;
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  minRating?: number;
  minReviews?: number;
  maxSalesRank?: number;
  amazonOnly?: boolean;
  fbaOnly?: boolean;
  primeOnly?: boolean;
  hasCoupon?: boolean;
  
  // Step 4
  schedulePreset: 'relaxed' | 'active' | 'intensive' | 'custom';
  intervalMinutes?: number;  // solo se custom
  dealsPerRun?: number;      // solo se custom
  publishingMode: 'smart' | 'immediate';
  
  // Step 5
  channelId: string;
  showKeepaButton: boolean;
  
  // Step 6
  copyMode: 'TEMPLATE' | 'LLM';
  messageTemplate?: string;
  llmModel?: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo';
  customStylePrompt?: string;
}
```

---

## Modifiche Database

### Rename Field

```sql
-- Rinomina per chiarezza
ALTER TABLE "AutomationRule" 
RENAME COLUMN "includeKeepaChart" TO "showKeepaButton";
```

### Default Value

```prisma
model AutomationRule {
  // ...
  showKeepaButton  Boolean  @default(true)
  // ...
}
```

---

## Implementazione Bottoni Telegram

### Codice Invio Messaggio

```typescript
async function publishDeal(deal: Deal, rule: AutomationRule) {
  const buttons: InlineKeyboardButton[][] = [[]];
  
  // Bottone Acquista (sempre presente)
  buttons[0].push({
    text: '🛒 Acquista',
    url: deal.affiliateLink
  });
  
  // Bottone Keepa (se abilitato)
  if (rule.showKeepaButton) {
    buttons[0].push({
      text: '📊 Storico Prezzi',
      url: `https://keepa.com/#!product/8-${deal.asin}`
    });
  }
  
  await bot.sendMessage(rule.channel.telegramId, messageText, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}
```

### Keepa URL Format

```
Italia (8):  https://keepa.com/#!product/8-{ASIN}
Germania (3): https://keepa.com/#!product/3-{ASIN}
Spagna (9):  https://keepa.com/#!product/9-{ASIN}
Francia (4): https://keepa.com/#!product/4-{ASIN}
UK (2):      https://keepa.com/#!product/2-{ASIN}
USA (1):     https://keepa.com/#!product/1-{ASIN}
```

---

## File da Modificare

| File | Modifiche |
|------|-----------|
| `CreateMissionWizard.tsx` | Aggiungere Step 6, riorganizzare |
| `Step2Categories.tsx` | Aggiungere dealPublishMode |
| `Step4Schedule.tsx` | Aggiungere publishingMode |
| `Step5Destination.tsx` | Rinominare includeKeepaChart → showKeepaButton |
| `Step6Copy.tsx` | **NUOVO** - copyMode, llmModel, customStylePrompt |
| `Step7Review.tsx` | Mostrare tutti i nuovi campi |
| `automations.ts` (API) | Aggiornare payload |
| `TelegramPublisher.ts` | Implementare inline buttons |
| `schema.prisma` | Rinominare campo |

---

## Timeline Implementazione

| Fase | Task | Tempo |
|------|------|-------|
| 1 | Rename DB field + migration | 30 min |
| 2 | Step 2: aggiungere dealPublishMode | 1h |
| 3 | Step 4: aggiungere publishingMode | 1h |
| 4 | Step 5: update showKeepaButton | 30 min |
| 5 | Step 6: nuovo componente Copy | 2h |
| 6 | Step 7: review completo | 1h |
| 7 | API: aggiornare payload + validation | 1h |
| 8 | Telegram: implementare inline buttons | 1h |
| 9 | Test e2e | 1h |
| **Totale** | | **~9h** |
