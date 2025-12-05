# Afflyt Pro - Sistema di Ottimizzazione Automatica

## Report Architetturale Completo

**Data:** Dicembre 2024  
**Versione:** 1.0  
**Stato:** Da implementare per Beta

---

## Executive Summary

Questo documento descrive l'architettura completa del sistema di ottimizzazione automatica di Afflyt, che trasforma la piattaforma da "bot che pubblica offerte" a "sistema intelligente che impara e migliora".

### Obiettivi Chiave

1. **Personalizzazione per canale** — Ogni canale ha un pubblico diverso, il sistema deve adattarsi
2. **Attribution precisa** — Sapere ESATTAMENTE quale post ha generato quale vendita
3. **Ottimizzazione continua** — Il sistema migliora automaticamente nel tempo
4. **Health monitoring** — Tracciare la salute del canale (crescita, churn)

### Componenti Principali

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AFFLYT OPTIMIZATION SYSTEM                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐  │
│  │   KEEPA    │──▶│   DEALS    │──▶│  SCORING   │──▶│  SCHEDULE  │  │
│  │  (source)  │   │   (pool)   │   │ (select)   │   │   (when)   │  │
│  └────────────┘   └────────────┘   └─────┬──────┘   └─────┬──────┘  │
│                                          │                │         │
│                         ┌────────────────┴────────────────┘         │
│                         ▼                                           │
│                   ┌────────────┐   ┌────────────┐                   │
│                   │  PUBLISH   │──▶│  TELEGRAM  │                   │
│                   │  (output)  │   │ (deliver)  │                   │
│                   └─────┬──────┘   └─────┬──────┘                   │
│                         │                │                          │
│         ┌───────────────┴────────────────┴───────────────┐          │
│         ▼                                                ▼          │
│   ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌─────────┐   │
│   │   CLICKS   │   │  MEMBERS   │   │   AMAZON   │   │  HEALTH │   │
│   │  (track)   │   │   (±)      │   │  (report)  │   │ (score) │   │
│   └─────┬──────┘   └─────┬──────┘   └─────┬──────┘   └────┬────┘   │
│         │                │                │               │         │
│         └────────────────┴────────────────┴───────────────┘         │
│                                   │                                  │
│                                   ▼                                  │
│                          ┌────────────────┐                         │
│                          │  CHANNEL       │                         │
│                          │  INSIGHTS      │──▶ Feedback to SCORING  │
│                          │  (learn)       │                         │
│                          └────────────────┘                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Deal Score System

### 1.1 Score Attuale (Base)

Il Deal Score attuale è **statico** e **globale** — non considera il canale specifico.

| Fattore | Peso | Calcolo |
|---------|------|---------|
| Sconto | 40% | Lineare: 50% sconto = 20 punti |
| Sales Rank | 25% | Logaritmico inverso (più basso = meglio) |
| Rating | 20% | (rating/5 × 15) + bonus recensioni |
| Price Drop | 15% | % calo vs storico |

**Label Score:**
- 0-29: MEH
- 30-44: DECENTE
- 45-59: BUONO
- 60-74: OTTIMO
- 75+: HOT 🔥

### 1.2 Score Migliorato (Channel Affinity)

Il nuovo sistema aggiunge un **moltiplicatore personalizzato** per canale:

```
Final Score = Base Deal Score × Channel Affinity Multiplier
```

**Channel Affinity Multiplier** è calcolato da:

| Fattore | Range | Fonte Dati |
|---------|-------|------------|
| Category Performance | 0.8x - 1.4x | CVR storico per categoria su quel canale |
| Price Range Performance | 0.9x - 1.2x | CVR storico per fascia prezzo |
| Time Slot Performance | 0.9x - 1.1x | CTR storico per orario |

**Esempio:**

```
Prodotto: iPhone Case
Base Score: 65 (OTTIMO)

Canale @TechDeals:
- Categoria "Elettronica" ha CVR 8% (media canale 4%) → multiplier +25%
- Fascia €20-50 ha CVR 6% (media 4%) → multiplier +10%

Final Score = 65 × 1.35 = 88 (HOT 🔥)

Canale @CasaOfferte:
- Categoria "Elettronica" ha CVR 1% (media canale 3%) → multiplier -15%
- Fascia €20-50 ha CVR 2% (media 3%) → multiplier -5%

Final Score = 65 × 0.80 = 52 (BUONO)
```

Lo stesso prodotto ha score diverso su canali diversi.

### 1.3 Confidence System

Il moltiplicatore si applica solo quando c'è abbastanza confidenza nei dati:

| Post Storici | Confidence | Comportamento |
|--------------|------------|---------------|
| < 30 | 0.0 - 0.3 | Usa solo Base Score |
| 30-100 | 0.3 - 0.6 | Applica multiplier parziale |
| 100-200 | 0.6 - 0.8 | Applica multiplier quasi completo |
| 200+ | 0.8 - 1.0 | Applica multiplier completo |

```typescript
function calculateFinalScore(baseScore: number, channelId: string): number {
  const insights = await getChannelInsights(channelId)
  
  if (!insights || insights.confidence < 0.3) {
    return baseScore // Non abbastanza dati
  }
  
  const multiplier = calculateMultiplier(insights, product)
  const adjustedMultiplier = 1 + (multiplier - 1) * insights.confidence
  
  return Math.round(baseScore * adjustedMultiplier)
}
```

---

## 2. Dynamic Score Weights & Audience Types

### 2.1 Il Problema dei Pesi Fissi

I pesi attuali del Deal Score sono **fissi e globali**:

```
- Sconto: 40%
- Sales Rank: 25%
- Rating: 20%
- Price Drop: 15%
```

Ma pubblici diversi rispondono a fattori diversi:

| Tipo Pubblico | Comportamento | Fattore Chiave |
|---------------|---------------|----------------|
| **Product Hunters** | Aspettano il prodotto giusto scontato | Sales Rank (popolarità) |
| **Deal Explorers** | Comprano d'impulso se prezzo assurdo | Sconto % |
| **Niche Focused** | Cercano qualità nella loro nicchia | Rating + Categoria |

**Esempio concreto:**
- Cinesata sconosciuta al 70% → Deal Explorer compra, Product Hunter ignora
- Bimby al 18% → Product Hunter compra, Deal Explorer ignora

### 2.2 I Tre Tipi di Audience

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUDIENCE TYPES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 PRODUCT HUNTERS                                             │
│  ├── "Aspetto l'offerta giusta sul prodotto che voglio"         │
│  ├── Sales Rank basso = prodotto desiderato                     │
│  ├── Brand conosciuti performano meglio                         │
│  └── Sconto moderato su prodotto giusto > sconto alto su cinesata│
│                                                                 │
│  🛒 DEAL EXPLORERS                                              │
│  ├── "Mi piace scoprire occasioni incredibili"                  │
│  ├── Sconto estremo attira attenzione                           │
│  ├── Comprano d'impulso                                         │
│  └── Sales Rank meno rilevante                                  │
│                                                                 │
│  🎮 NICHE FOCUSED                                               │
│  ├── "Cerco solo prodotti della mia categoria"                  │
│  ├── Rating e recensioni molto importanti                       │
│  ├── Categoria è filtro primario                                │
│  └── Qualità > prezzo                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Pesi Dinamici per Canale

Invece di pesi fissi, ogni canale ha **pesi personalizzati** basati sullo storico:

```typescript
// Pesi base (fallback)
const BASE_WEIGHTS = {
  discount: 0.40,
  salesRank: 0.25,
  rating: 0.20,
  priceDrop: 0.15
}

// Pesi per tipo audience (iniziali)
const AUDIENCE_WEIGHTS = {
  product_hunters: {
    discount: 0.25,
    salesRank: 0.40,
    rating: 0.25,
    priceDrop: 0.10
  },
  deal_explorers: {
    discount: 0.50,
    salesRank: 0.10,
    rating: 0.25,
    priceDrop: 0.15
  },
  niche_focused: {
    discount: 0.30,
    salesRank: 0.25,
    rating: 0.30,
    priceDrop: 0.15
  }
}

// Pesi learned (dopo abbastanza dati)
function getChannelWeights(insights: ChannelInsights): Weights {
  if (!insights || insights.confidence < 0.5) {
    // Usa pesi da onboarding o base
    return AUDIENCE_WEIGHTS[insights?.audienceType] || BASE_WEIGHTS
  }
  
  // Usa pesi calcolati da correlazioni
  return insights.scoreWeights
}
```

### 2.4 Calcolo Correlazioni

Per ogni canale, analizziamo quale fattore predice meglio le conversioni:

```typescript
async function calculateFactorCorrelations(channelId: string): Promise<Correlations> {
  const posts = await getPostsWithConversions(channelId, last90Days)
  
  if (posts.length < 50) {
    return null // Non abbastanza dati
  }
  
  // Correlazione Pearson tra ogni fattore e conversioni
  const correlations = {
    discount: pearsonCorrelation(
      posts.map(p => p.discount),
      posts.map(p => p.conversions)
    ),
    salesRank: pearsonCorrelation(
      posts.map(p => -p.salesRank), // Inverso: rank basso = buono
      posts.map(p => p.conversions)
    ),
    rating: pearsonCorrelation(
      posts.map(p => p.rating),
      posts.map(p => p.conversions)
    ),
    priceDrop: pearsonCorrelation(
      posts.map(p => p.priceDrop),
      posts.map(p => p.conversions)
    )
  }
  
  // Normalizza per ottenere pesi (solo correlazioni positive)
  const positive = {
    discount: Math.max(0, correlations.discount),
    salesRank: Math.max(0, correlations.salesRank),
    rating: Math.max(0, correlations.rating),
    priceDrop: Math.max(0, correlations.priceDrop)
  }
  
  const total = Object.values(positive).reduce((a, b) => a + b, 0)
  
  if (total === 0) return BASE_WEIGHTS
  
  return {
    discount: positive.discount / total,
    salesRank: positive.salesRank / total,
    rating: positive.rating / total,
    priceDrop: positive.priceDrop / total
  }
}
```

### 2.5 Esempio Pratico

**Canale @AssettoCorsa (nicchia gaming/simulazione)**

Storico 90 giorni:
```
Post 1: Volante Logitech, SalesRank 1.200, Sconto 15% → 12 conversioni
Post 2: Mouse cinese, SalesRank 89.000, Sconto 70% → 0 conversioni  
Post 3: Monitor Samsung, SalesRank 800, Sconto 22% → 8 conversioni
Post 4: Cuffie sconosciute, SalesRank 120.000, Sconto 65% → 1 conversione
```

Correlazioni calcolate:
```
discount ↔ conversions: 0.15 (bassa)
salesRank ↔ conversions: 0.72 (alta!)
rating ↔ conversions: 0.45 (media)
priceDrop ↔ conversions: 0.18 (bassa)
```

Pesi risultanti:
```
discount: 10%   (era 40%)
salesRank: 48%  (era 25%) ← Questo canale vuole prodotti popolari!
rating: 30%     (era 20%)
priceDrop: 12%  (era 15%)
```

**Effetto:** Lo stesso prodotto ha score diverso:

```
Prodotto: Mouse cinese sconosciuto -70%
- Score con pesi fissi: 72 (sconto domina)
- Score con pesi canale: 35 (salesRank pessimo penalizza)

Prodotto: Logitech G29 -18%
- Score con pesi fissi: 48 (sconto basso)
- Score con pesi canale: 71 (salesRank ottimo premia)
```

### 2.6 Inferenza Automatica del Tipo

Dopo abbastanza dati, il sistema inferisce il tipo di audience:

```typescript
function inferAudienceType(correlations: Correlations): AudienceType {
  const { discount, salesRank, rating } = correlations
  
  // Se salesRank domina → Product Hunters
  if (salesRank > discount * 1.5 && salesRank > rating) {
    return 'product_hunters'
  }
  
  // Se discount domina → Deal Explorers
  if (discount > salesRank * 1.5 && discount > rating) {
    return 'deal_explorers'
  }
  
  // Se rating domina → Niche Focused
  if (rating > discount && rating > salesRank) {
    return 'niche_focused'
  }
  
  return 'mixed'
}
```

### 2.7 Onboarding Question

Durante setup canale, chiediamo:

```
Come descriveresti il tuo pubblico?

[ ] 🎯 Cercano prodotti specifici
    "I miei iscritti aspettano offerte su brand e prodotti che già conoscono"
    
[ ] 🛒 Amano scoprire occasioni  
    "I miei iscritti comprano d'impulso se vedono un prezzo incredibile"
    
[ ] 🎮 Nicchia specifica
    "Il mio canale è focalizzato su una categoria precisa"
```

Risposta → pesi iniziali → affinati dai dati.

### 2.8 Dashboard Insight

```
┌─────────────────────────────────────────────────────────────────┐
│  🧠 Cosa Abbiamo Imparato sul Tuo Pubblico                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Il tuo pubblico è di tipo: PRODUCT HUNTERS 🎯                  │
│                                                                 │
│  I tuoi iscritti non cercano "qualsiasi cosa scontata".         │
│  Aspettano offerte su prodotti specifici che già conoscono      │
│  e desiderano.                                                  │
│                                                                 │
│  📊 Cosa funziona per te:                                       │
│  • Prodotti popolari (Sales Rank basso) → +72% conversioni      │
│  • Brand conosciuti → +45% conversioni                          │
│  • Sconto alto su prodotto sconosciuto → quasi zero vendite     │
│                                                                 │
│  ⚖️ I tuoi pesi personalizzati:                                 │
│  ┌────────────────────────────────────────────┐                 │
│  │ Sales Rank  ████████████████████ 48%       │                 │
│  │ Rating      ████████████         30%       │                 │
│  │ Price Drop  █████                12%       │                 │
│  │ Sconto      ████                 10%       │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                 │
│  💡 Consiglio:                                                  │
│  Abbiamo aumentato il peso del Sales Rank nel tuo Deal Score.   │
│  Vedrai meno "cinesate al 70%" e più "prodotti veri scontati".  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.9 Schema Database Additions

```prisma
model ChannelInsights {
  // ... existing fields ...
  
  // Factor correlations (learned from conversion data)
  factorCorrelations Json?
  // { discount: 0.15, salesRank: 0.72, rating: 0.45, priceDrop: 0.18 }
  
  // Derived weights (normalized correlations)
  scoreWeights Json?
  // { discount: 0.10, salesRank: 0.48, rating: 0.30, priceDrop: 0.12 }
  
  // Audience type
  audienceType           String?  // 'product_hunters' | 'deal_explorers' | 'niche_focused' | 'mixed'
  audienceTypeSource     String?  // 'onboarding' | 'inferred'
  audienceTypeConfidence Float?   // 0-1
}
```

---

## 3. Smart Scheduling System

### 2.1 Problema

Il sistema attuale pubblica **quando trova** il deal, non **quando è ottimale**.

```
Deal trovato: 03:00 di notte
Pubblicato: 03:00 di notte
Pubblico attivo: 19:00-22:00
Risultato: CTR bassissimo
```

### 2.2 Soluzione

Il sistema analizza lo storico e **schedula** la pubblicazione all'ora ottimale.

```
Deal trovato: 03:00
Best hours per questo canale: [19, 20, 21, 12, 18]
Deal scade: tra 48h
Decisione: Schedula alle 19:00 di oggi
```

### 2.3 Logica di Scheduling

```typescript
function calculatePublishTime(deal: Deal, insights: ChannelInsights): Date {
  const now = new Date()
  const currentHour = now.getHours()
  
  // 1. Se non abbastanza dati, pubblica subito
  if (!insights || insights.confidence < 0.5) {
    return now
  }
  
  // 2. Se siamo già in un'ora buona, pubblica subito
  if (insights.bestHours.slice(0, 3).includes(currentHour)) {
    return now
  }
  
  // 3. Trova prossima ora buona
  const nextBestHour = findNextBestHour(insights.bestHours, currentHour)
  const waitTime = hoursUntil(nextBestHour)
  
  // 4. Se il deal scade prima, pubblica subito
  if (deal.lightningEndAt && deal.lightningEndAt < nextBestHour) {
    return now
  }
  
  // 5. Se aspettare è ragionevole (< 8h), aspetta
  if (waitTime <= 8) {
    return nextBestHour
  }
  
  // 6. Altrimenti pubblica subito
  return now
}
```

### 2.4 Gestione Lightning Deals

I Lightning Deals hanno scadenza breve e vanno gestiti diversamente:

| Tipo Deal | Scadenza | Comportamento |
|-----------|----------|---------------|
| Lightning Deal | < 4h | Pubblica SUBITO |
| Lightning Deal | 4-12h | Schedula se prossima ora buona è vicina |
| Price Drop | Nessuna | Schedula liberamente |
| Standard | Nessuna | Schedula liberamente |

---

## 4. Member Tracking System

### 3.1 Perché è Importante

Le metriche di click/conversione non bastano. Un canale può avere:
- Tanti click ma perdere iscritti → morendo
- Pochi click ma guadagnare iscritti → crescendo

### 3.2 Cosa Tracciamo

| Metrica | Frequenza | Metodo |
|---------|-----------|--------|
| Member Count | Ogni 6h | Polling `getChatMemberCount` |
| Join Events | Real-time | Webhook `chat_member` |
| Leave Events | Real-time | Webhook `chat_member` |
| Churn Rate | Giornaliero | Calcolo da snapshots |
| Growth Rate | Giornaliero | Calcolo da snapshots |

### 3.3 Telegram Bot Requirements

Per il tracking completo, il bot deve:
- ✅ Essere aggiunto al canale
- ✅ Essere **amministratore** del canale
- ✅ Avere permesso di vedere i membri

Questo è richiesto durante l'onboarding del canale.

### 3.4 Health Score

Ogni canale ha un **Health Score** (0-100) calcolato da:

```typescript
function calculateHealthScore(channelId: string): number {
  const snapshots = await getWeeklySnapshots(channelId)
  const posts = await getWeeklyPosts(channelId)
  
  let score = 50 // Base
  
  // 1. Growth component (+/- 20 punti)
  const growthRate = calculateGrowthRate(snapshots)
  if (growthRate > 5) score += 20
  else if (growthRate > 0) score += 10
  else if (growthRate < -5) score -= 20
  else if (growthRate < 0) score -= 10
  
  // 2. Posting frequency component (+/- 15 punti)
  const avgPostsPerDay = posts.length / 7
  if (avgPostsPerDay <= 5) score += 10
  else if (avgPostsPerDay <= 10) score += 0
  else if (avgPostsPerDay > 15) score -= 15
  
  // 3. Engagement component (+/- 15 punti)
  const avgCtr = calculateAvgCtr(posts)
  if (avgCtr > 5) score += 15
  else if (avgCtr > 2) score += 5
  else if (avgCtr < 1) score -= 10
  
  return clamp(score, 0, 100)
}
```

### 3.5 Azioni Basate su Health Score

| Health Score | Stato | Azioni Automatiche |
|--------------|-------|-------------------|
| 80-100 | Eccellente | Nessuna, continua così |
| 60-79 | Buono | Monitoraggio normale |
| 40-59 | Attenzione | Alert al creator, suggerimenti |
| 20-39 | Critico | Riduzione frequenza automatica |
| 0-19 | Emergenza | Pausa pubblicazioni, alert urgente |

---

## 5. Amazon Attribution con ascsubtag

### 4.1 Cos'è ascsubtag

Amazon permette di aggiungere un parametro di tracking custom agli URL affiliati:

```
https://www.amazon.it/dp/B08XXX?tag=afflyt-21&ascsubtag=TRACKING_CODE
```

Il valore di `ascsubtag` appare nei report commissioni Amazon, permettendo attribution precisa.

### 4.2 Formato ascsubtag Afflyt

```
ch{channelId}_m{messageId}_t{timestamp}_s{score}_r{ruleId}

Esempio:
ch12_m7891234_t1701619200_s72_r5

Significato:
- ch12: Channel ID 12
- m7891234: Telegram Message ID 7891234
- t1701619200: Unix timestamp pubblicazione
- s72: Deal Score 72
- r5: Automation Rule ID 5
```

**Limite Amazon:** 100 caratteri (il nostro formato usa ~40)

### 4.3 Impatto sull'Attribution

| Senza ascsubtag | Con ascsubtag |
|-----------------|---------------|
| "Vendita €50, non so da dove" | "Vendita €50, canale 12, post 789" |
| Attribution fuzzy per timestamp | Attribution diretta al messaggio |
| ~70% accuratezza | ~99% accuratezza |

### 4.4 Flusso Completo

```
1. Deal pubblicato su canale 12
   URL: amazon.it/dp/B08XXX?tag=afflyt-21&ascsubtag=ch12_m789_t170...

2. Utente clicca (tracciato nel nostro sistema)

3. Utente compra dopo 4 ore (cookie Amazon 24h)

4. Report Amazon disponibile dopo 24-48h
   Riga: "ASIN B08XXX, €50, ascsubtag=ch12_m789_t170..."

5. OCR Parser estrae ascsubtag

6. Match: ch12_m789 → ChannelDealHistory record

7. Update: quel post specifico ha generato €50

8. ChannelInsights ricalcola performance

9. Prossimi deal simili → score boost su canale 12
```

### 4.5 Integrazione con Shortener

Il shortener Afflyt deve includere ascsubtag nel redirect:

```typescript
// Quando genera short link
const shortUrl = `afflyt.io/r/${shortCode}`

// Quando fa redirect
app.get('/r/:code', async (req, res) => {
  const link = await getLink(req.params.code)
  
  // Costruisci URL con ascsubtag
  const ascsubtag = buildAscsubtag({
    channelId: link.channelId,
    messageId: link.telegramMessageId,
    timestamp: link.createdAt,
    score: link.dealScore,
    ruleId: link.ruleId
  })
  
  const finalUrl = `${link.amazonUrl}&ascsubtag=${ascsubtag}`
  
  // Track click
  await trackClick(link.id, req)
  
  // Redirect
  res.redirect(finalUrl)
})
```

---

## 6. OCR Report Parser

### 5.1 Perché OCR

Amazon non fornisce API per i report commissioni. I report sono:
- Scaricabili come CSV/TSV dalla console Associates
- Oppure ricevuti via email come allegato

Per automatizzare, dobbiamo:
1. L'utente carica il report (file o screenshot)
2. Sistema parsa e estrae i dati
3. Match con ascsubtag per attribution

### 5.2 Struttura Report Amazon

| Campo | Esempio | Uso |
|-------|---------|-----|
| Order ID | 123-456-789 | Identificativo unico |
| ASIN | B08XXX | Prodotto venduto |
| Product Name | "iPhone Case..." | Display |
| Quantity | 1 | Calcoli |
| Revenue | €49.99 | Tracking |
| Commission | €2.50 | Earnings |
| Link Type | "Product Link" | Filtro |
| Tracking ID | afflyt-21 | Verifica tag |
| **ascsubtag** | ch12_m789_t170... | **ATTRIBUTION** |

### 5.3 Parsing Flow

```typescript
async function parseAmazonReport(file: File): Promise<ConversionData[]> {
  // 1. Detect format (CSV, TSV, image)
  const format = detectFormat(file)
  
  // 2. Extract data
  let rawData: string[][]
  if (format === 'image') {
    rawData = await ocrExtract(file) // Tesseract o Cloud Vision
  } else {
    rawData = await csvParse(file)
  }
  
  // 3. Parse rows
  const conversions: ConversionData[] = []
  
  for (const row of rawData) {
    const ascsubtag = row.ascsubtag || row['Sub Tag'] || null
    
    if (!ascsubtag) {
      // Link senza tracking, skip o fuzzy match
      continue
    }
    
    // Parse ascsubtag
    const parsed = parseAscsubtag(ascsubtag)
    
    conversions.push({
      orderId: row.orderId,
      asin: row.asin,
      revenue: parseFloat(row.revenue),
      commission: parseFloat(row.commission),
      ascsubtag,
      channelId: parsed.channelId,
      messageId: parsed.messageId,
      timestamp: parsed.timestamp,
      score: parsed.score,
      ruleId: parsed.ruleId
    })
  }
  
  return conversions
}

function parseAscsubtag(subtag: string): ParsedSubtag {
  // Format: ch12_m789_t1701619200_s72_r5
  const parts = subtag.split('_')
  const result: ParsedSubtag = {}
  
  for (const part of parts) {
    if (part.startsWith('ch')) result.channelId = part.slice(2)
    if (part.startsWith('m')) result.messageId = part.slice(1)
    if (part.startsWith('t')) result.timestamp = parseInt(part.slice(1))
    if (part.startsWith('s')) result.score = parseInt(part.slice(1))
    if (part.startsWith('r')) result.ruleId = part.slice(1)
  }
  
  return result
}
```

### 5.4 OCR Technology Options

| Opzione | Pro | Contro | Costo |
|---------|-----|--------|-------|
| Tesseract.js | Gratuito, self-hosted | Accuratezza media | €0 |
| Google Cloud Vision | Alta accuratezza | Costo per request | ~€1.5/1000 img |
| AWS Textract | Ottimo per tabelle | Costo | ~€1.5/1000 img |
| Azure Computer Vision | Buona accuratezza | Costo | ~€1/1000 img |

**Raccomandazione:** Inizia con upload CSV (gratis), aggiungi OCR per immagini dopo.

---

## 7. Channel Insights System

### 6.1 Cosa Calcola

| Insight | Descrizione | Aggiornamento |
|---------|-------------|---------------|
| Best Hours | Top 5 ore per CTR | Ogni 6h |
| Best Days | Top 3 giorni per conversioni | Giornaliero |
| Top Categories | Categorie con CVR sopra media | Giornaliero |
| Optimal Price Range | Fascia prezzo con miglior CVR | Giornaliero |
| Optimal Discount Range | Fascia sconto con miglior EPC | Giornaliero |
| Posting Frequency Sweet Spot | N post/giorno ottimale | Settimanale |

### 6.2 Calculation Job

```typescript
// Eseguito ogni 6 ore
async function calculateChannelInsights(channelId: string) {
  const thirtyDaysAgo = subDays(new Date(), 30)
  
  // 1. Get all published deals with performance
  const deals = await prisma.channelDealHistory.findMany({
    where: {
      channelId,
      publishedAt: { gte: thirtyDaysAgo }
    },
    include: {
      clicks: true,
      conversions: true
    }
  })
  
  if (deals.length < 30) {
    // Non abbastanza dati
    return null
  }
  
  // 2. Calculate hourly stats
  const hourlyStats = {}
  for (let h = 0; h < 24; h++) {
    const hourDeals = deals.filter(d => d.publishedAt.getHours() === h)
    hourlyStats[h] = {
      posts: hourDeals.length,
      clicks: sum(hourDeals, 'clicks'),
      conversions: sum(hourDeals, 'conversions'),
      revenue: sum(hourDeals, 'revenue'),
      ctr: avgCtr(hourDeals),
      cvr: avgCvr(hourDeals)
    }
  }
  
  // 3. Calculate category stats
  const categoryStats = groupBy(deals, 'category').map(group => ({
    category: group.key,
    posts: group.items.length,
    clicks: sum(group.items, 'clicks'),
    conversions: sum(group.items, 'conversions'),
    revenue: sum(group.items, 'revenue'),
    cvr: avgCvr(group.items),
    epc: avgEpc(group.items)
  }))
  
  // 4. Calculate price range stats
  const priceRanges = ['0-20', '20-50', '50-100', '100-200', '200+']
  const priceStats = priceRanges.map(range => ({
    range,
    ...calculateStatsForPriceRange(deals, range)
  }))
  
  // 5. Determine best performers
  const bestHours = rankBy(hourlyStats, 'cvr').slice(0, 5).map(h => h.hour)
  const topCategories = rankBy(categoryStats, 'cvr').slice(0, 10).map(c => c.category)
  const optimalPriceRange = rankBy(priceStats, 'cvr')[0]?.range
  
  // 6. Calculate confidence
  const confidence = Math.min(deals.length / 200, 1)
  
  // 7. Upsert insights
  await prisma.channelInsights.upsert({
    where: { channelId },
    create: {
      channelId,
      hourlyStats,
      bestHours,
      categoryStats,
      topCategories,
      priceStats,
      optimalPriceRange,
      totalPosts: deals.length,
      totalClicks: sum(deals, 'clicks'),
      totalConversions: sum(deals, 'conversions'),
      avgCvr: avgCvr(deals),
      avgEpc: avgEpc(deals),
      confidence,
      lastCalculated: new Date()
    },
    update: {
      hourlyStats,
      bestHours,
      categoryStats,
      topCategories,
      priceStats,
      optimalPriceRange,
      totalPosts: deals.length,
      totalClicks: sum(deals, 'clicks'),
      totalConversions: sum(deals, 'conversions'),
      avgCvr: avgCvr(deals),
      avgEpc: avgEpc(deals),
      confidence,
      lastCalculated: new Date()
    }
  })
}
```

---

## 8. Cold Start Handling

### 7.1 Il Problema

Canale nuovo = zero dati = impossibile ottimizzare.

### 7.2 Soluzione: Exploration Phase

Nei primi 30 giorni, il sistema entra in **modalità esplorazione**:

```typescript
function shouldExplore(insights: ChannelInsights | null): boolean {
  if (!insights) return true
  if (insights.totalPosts < 50) return true
  if (insights.confidence < 0.3) return true
  return false
}

function selectDealForExploration(deals: Deal[], insights: ChannelInsights | null) {
  // Durante esplorazione:
  // - 70% best score (exploitation)
  // - 30% random (exploration)
  
  if (Math.random() < 0.3) {
    // Exploration: scegli random tra top 20
    const topDeals = deals.sort((a, b) => b.score - a.score).slice(0, 20)
    return topDeals[Math.floor(Math.random() * topDeals.length)]
  } else {
    // Exploitation: scegli il migliore
    return deals.sort((a, b) => b.score - a.score)[0]
  }
}
```

### 7.3 Exploration Matrix

Durante l'esplorazione, il sistema cerca di coprire:

| Dimensione | Variazioni da Testare |
|------------|----------------------|
| Orari | Almeno 1 post per ogni fascia (mattina, pomeriggio, sera, notte) |
| Categorie | Almeno 3 post per le top 10 categorie |
| Fasce Prezzo | Almeno 5 post per ogni fascia |
| Fasce Sconto | Almeno 5 post per ogni fascia |

### 7.4 Onboarding Questions

Durante l'onboarding del canale, chiediamo:

```
1. "Il tuo pubblico è principalmente interessato a:"
   [ ] Tech & Elettronica
   [ ] Casa & Giardino
   [ ] Moda & Abbigliamento
   [ ] Sport & Outdoor
   [ ] Tutto / Misto

2. "A che ora è più attivo il tuo pubblico?"
   [ ] Mattina (6-12)
   [ ] Pomeriggio (12-18)
   [ ] Sera (18-24)
   [ ] Non lo so

3. "Quanti iscritti hai?"
   [ ] < 1.000
   [ ] 1.000 - 5.000
   [ ] 5.000 - 20.000
   [ ] > 20.000
```

Queste risposte guidano l'esplorazione iniziale.

---

## 9. Database Schema

### 8.1 Nuove Tabelle

```prisma
// ═══════════════════════════════════════════════════════════════
// CHANNEL INSIGHTS - Performance analytics per canale
// ═══════════════════════════════════════════════════════════════

model ChannelInsights {
  id        String   @id @default(cuid())
  channelId String   @unique
  channel   Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  
  // Performance per ora (0-23)
  // { "0": { posts, clicks, conversions, revenue, ctr, cvr }, ... }
  hourlyStats    Json
  bestHours      Int[]   // Top 5 ore ordinate per CVR
  
  // Performance per giorno (0=Dom, 6=Sab)
  // { "0": { posts, clicks, conversions, revenue, ctr, cvr }, ... }
  dailyStats     Json?
  bestDays       Int[]   // Top 3 giorni ordinati per CVR
  
  // Performance per categoria
  // { "electronics": { posts, clicks, conversions, revenue, cvr, epc }, ... }
  categoryStats  Json
  topCategories  String[]  // Top 10 categorie per CVR
  
  // Performance per fascia prezzo
  // { "0-20": {...}, "20-50": {...}, ... }
  priceStats         Json?
  optimalPriceRange  String?
  
  // Performance per fascia sconto
  // { "10-20": {...}, "20-40": {...}, ... }
  discountStats         Json?
  optimalDiscountRange  String?
  
  // Metriche aggregate
  totalPosts       Int
  totalClicks      Int
  totalConversions Int
  totalRevenue     Float     @default(0)
  avgCtr           Float?
  avgCvr           Float
  avgEpc           Float
  
  // Confidence (0-1, aumenta con i dati)
  confidence       Float     @default(0)
  
  // Posting frequency optimization
  optimalPostsPerDay  Int?
  
  lastCalculated   DateTime
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  @@index([channelId])
  @@index([lastCalculated])
}

// ═══════════════════════════════════════════════════════════════
// CHANNEL MEMBER SNAPSHOTS - Storico membri
// ═══════════════════════════════════════════════════════════════

model ChannelMemberSnapshot {
  id          String   @id @default(cuid())
  channelId   String
  channel     Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  
  memberCount Int
  
  // Calcolati rispetto a snapshot precedente
  delta        Int?      // +/- rispetto a precedente
  deltaPercent Float?    // % cambio
  
  snapshotAt   DateTime  @default(now())
  
  @@index([channelId])
  @@index([snapshotAt])
}

// ═══════════════════════════════════════════════════════════════
// CHANNEL MEMBER EVENTS - Join/Leave events
// ═══════════════════════════════════════════════════════════════

model ChannelMemberEvent {
  id             String   @id @default(cuid())
  channelId      String
  channel        Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  
  // Telegram user info
  telegramUserId String
  username       String?
  
  // Event type
  eventType      String   // 'joined' | 'left' | 'kicked' | 'banned'
  
  // Context for correlation
  postsLast24h   Int?     // Quanti post nelle 24h precedenti
  lastPostAsin   String?  // ASIN ultimo post prima dell'evento
  lastPostCategory String? // Categoria ultimo post
  
  eventAt        DateTime @default(now())
  
  @@index([channelId])
  @@index([eventType])
  @@index([eventAt])
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULED DEALS - Deal programmati per smart scheduling
// ═══════════════════════════════════════════════════════════════

model ScheduledDeal {
  id          String   @id @default(cuid())
  channelId   String
  channel     Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  ruleId      String
  rule        AutomationRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  
  // Product info
  asin        String
  productId   String?
  product     Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  
  // Score at scheduling time
  baseScore   Int
  finalScore  Int
  
  // Scheduling
  scheduledFor DateTime
  reason       String?  // "optimal_hour" | "immediate" | "lightning_deal"
  
  // Status
  status       String   @default("pending") // pending | published | cancelled | expired
  publishedAt  DateTime?
  cancelledAt  DateTime?
  cancelReason String?
  
  // Result tracking
  telegramMessageId String?
  
  createdAt    DateTime @default(now())
  
  @@index([channelId])
  @@index([scheduledFor])
  @@index([status])
}
```

### 8.2 Modifiche a Tabelle Esistenti

```prisma
// Aggiunte a Channel
model Channel {
  // ... existing fields ...
  
  // Member tracking
  currentMemberCount    Int?
  memberCountUpdatedAt  DateTime?
  
  // Health metrics
  weeklyChurnRate       Float?    // % persi ultima settimana
  weeklyGrowthRate      Float?    // % guadagnati ultima settimana
  netGrowthRate         Float?    // growth - churn
  healthScore           Float?    // 0-100
  healthCalculatedAt    DateTime?
  
  // Relations (nuove)
  insights              ChannelInsights?
  memberSnapshots       ChannelMemberSnapshot[]
  memberEvents          ChannelMemberEvent[]
  scheduledDeals        ScheduledDeal[]
}

// Aggiunte a AffiliateLink
model AffiliateLink {
  // ... existing fields ...
  
  // Amazon tracking
  ascsubtag    String?   // Il subtag usato per questo link
  
  // Source info (per correlazione)
  dealScore    Int?      // Score al momento della creazione
  
  @@index([ascsubtag])
}

// Aggiunte a Conversion
model Conversion {
  // ... existing fields ...
  
  // Da report Amazon (via OCR)
  ascsubtag           String?
  
  // Parsed da ascsubtag
  sourceChannelId     String?
  sourceMessageId     String?
  sourceTimestamp     DateTime?
  sourceDealScore     Int?
  sourceRuleId        String?
  
  // Match quality
  attributionMethod   String?  // "direct" | "fuzzy" | "unknown"
  attributionConfidence Float?
  
  @@index([ascsubtag])
  @@index([sourceChannelId])
}

// Aggiunte a ChannelDealHistory
model ChannelDealHistory {
  // ... existing fields ...
  
  // Performance tracking
  clicks           Int      @default(0)
  uniqueClicks     Int      @default(0)
  conversions      Int      @default(0)
  revenue          Float    @default(0)
  
  // Score al momento della pubblicazione
  baseScore        Int?
  finalScore       Int?
  
  // ascsubtag usato
  ascsubtag        String?
  
  @@index([ascsubtag])
}
```

---

## 10. Background Jobs

### 9.1 Job Schedule

| Job | Frequenza | Descrizione |
|-----|-----------|-------------|
| `memberSnapshotJob` | Ogni 6h | Polling member count per tutti i canali |
| `insightsCalculationJob` | Ogni 6h | Ricalcola ChannelInsights |
| `healthScoreJob` | Giornaliero | Calcola Health Score |
| `scheduledDealsPublisher` | Ogni minuto | Pubblica deal schedulati |
| `reportParserJob` | On-demand | Parsa report Amazon caricati |
| `conversionAttributionJob` | Ogni ora | Matcha conversioni con ascsubtag |

### 9.2 Job Implementations

```typescript
// jobs/memberSnapshotJob.ts
export async function memberSnapshotJob() {
  const channels = await getActiveChannels()
  
  for (const channel of channels) {
    try {
      const count = await telegram.getChatMemberCount(channel.channelId)
      const lastSnapshot = await getLastSnapshot(channel.id)
      
      const delta = lastSnapshot ? count - lastSnapshot.memberCount : 0
      const deltaPercent = lastSnapshot 
        ? (delta / lastSnapshot.memberCount) * 100 
        : 0
      
      await createSnapshot({
        channelId: channel.id,
        memberCount: count,
        delta,
        deltaPercent
      })
      
      await updateChannelMemberCount(channel.id, count)
      
    } catch (error) {
      logger.error(`Failed to snapshot ${channel.id}`, error)
    }
  }
}

// jobs/scheduledDealsPublisher.ts
export async function scheduledDealsPublisher() {
  const now = new Date()
  
  const dueDeals = await prisma.scheduledDeal.findMany({
    where: {
      status: 'pending',
      scheduledFor: { lte: now }
    },
    include: {
      channel: true,
      product: true,
      rule: true
    }
  })
  
  for (const deal of dueDeals) {
    try {
      // Verifica che il prodotto sia ancora valido
      const stillValid = await verifyDealStillValid(deal.asin)
      
      if (!stillValid) {
        await cancelScheduledDeal(deal.id, 'deal_expired')
        continue
      }
      
      // Pubblica
      const messageId = await publishDeal(deal)
      
      await prisma.scheduledDeal.update({
        where: { id: deal.id },
        data: {
          status: 'published',
          publishedAt: new Date(),
          telegramMessageId: messageId
        }
      })
      
    } catch (error) {
      logger.error(`Failed to publish scheduled deal ${deal.id}`, error)
    }
  }
}
```

---

## 11. API Endpoints

### 10.1 Nuovi Endpoints

```typescript
// GET /api/channels/:id/insights
// Ritorna ChannelInsights per un canale
{
  bestHours: [19, 20, 21, 12, 18],
  topCategories: ["electronics", "home", "sports"],
  optimalPriceRange: "50-100",
  avgCvr: 4.2,
  avgEpc: 0.35,
  confidence: 0.78,
  recommendations: [
    "Il tuo pubblico è più attivo tra le 19 e le 21",
    "Elettronica converte 2x rispetto ad altre categorie",
    "Considera di aumentare il minScore a 50"
  ]
}

// GET /api/channels/:id/health
// Ritorna Health metrics
{
  healthScore: 72,
  memberCount: 5420,
  weeklyGrowthRate: 2.3,
  weeklyChurnRate: 0.8,
  netGrowthRate: 1.5,
  trend: "growing",
  alerts: []
}

// POST /api/reports/upload
// Upload report Amazon per parsing
{
  file: File,
  format: "csv" | "image"
}
// Response
{
  parsed: 45,
  matched: 38,
  unmatched: 7,
  totalRevenue: 1234.56,
  totalCommission: 62.50
}

// GET /api/channels/:id/scheduled-deals
// Lista deal schedulati
[
  {
    id: "...",
    asin: "B08XXX",
    productTitle: "iPhone Case",
    scheduledFor: "2024-12-05T19:00:00Z",
    finalScore: 72,
    reason: "optimal_hour"
  }
]

// DELETE /api/scheduled-deals/:id
// Cancella deal schedulato
```

---

## 12. Dashboard UI Updates

### 11.1 Nuova Tab "Insights"

```
┌─────────────────────────────────────────────────────────────┐
│  Channel Insights: @TechDealsHub                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Performance Overview           🎯 Confidence: 78%       │
│  ┌─────────┬─────────┬─────────┬─────────┐                 │
│  │  Posts  │ Clicks  │  Conv   │ Revenue │                 │
│  │   234   │  4,521  │   89    │ €892.45 │                 │
│  │         │ CTR 3.2%│ CVR 2.0%│ EPC €0.20│                 │
│  └─────────┴─────────┴─────────┴─────────┘                 │
│                                                             │
│  ⏰ Best Hours                     📦 Top Categories        │
│  ┌─────────────────────┐          ┌─────────────────────┐  │
│  │ ████████████ 19:00  │          │ Electronics   42%   │  │
│  │ ██████████   20:00  │          │ Home          23%   │  │
│  │ █████████    21:00  │          │ Sports        15%   │  │
│  │ ███████      12:00  │          │ Fashion       12%   │  │
│  │ ██████       18:00  │          │ Other          8%   │  │
│  └─────────────────────┘          └─────────────────────┘  │
│                                                             │
│  💡 AI Recommendations                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • Il tuo pubblico converte meglio tra 19:00-21:00   │   │
│  │ • Elettronica ha CVR 2x rispetto alla media         │   │
│  │ • Considera di ridurre post su "Casa" (CVR 0.5%)    │   │
│  │ • Fascia €50-100 performa meglio di altre           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Health Indicator in Channel List

```
┌─────────────────────────────────────────────────────────────┐
│  I Tuoi Canali                                              │
├─────────────────────────────────────────────────────────────┤
│  @TechDealsHub      5,420 membri  ↑ +2.3%   ●●●●○ Health 78 │
│  @OfferteCasa       1,234 membri  ↓ -1.2%   ●●○○○ Health 42 │
│  @SportDeals          890 membri  ↑ +5.1%   ●●●●● Health 91 │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. Integrazione con Sistema Esistente

### 13.1 Pipeline Attuale vs Nuova

```
PIPELINE ATTUALE (6 Step):
┌──────────────────────────────────────────────────────────────────┐
│ Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6              │
│ Load     Target   Score    A/B      Publish   Update             │
│ Rule     Query    (fisso)  Split    (subito)  Stats              │
└──────────────────────────────────────────────────────────────────┘

PIPELINE NUOVA (8 Step):
┌──────────────────────────────────────────────────────────────────┐
│ Step 1 → Step 2 → Step 3 → Step 3.5 → Step 4 → Step 5 → Step 6/7 │
│ Load     Target   Base     Channel   A/B      Schedule  Publish/ │
│ Rule     Query    Score    Affinity  Split    Decision  Queue    │
│                   (dinamico)                                      │
│                            ↓                                      │
│                      + ascsubtag in URL                           │
│                      + baseScore/finalScore saved                 │
└──────────────────────────────────────────────────────────────────┘
```

### 13.2 Componenti Invariati

| Componente | File | Note |
|------------|------|------|
| Step 1: Load Rule | RuleExecutor.ts | Nessun cambio |
| Step 2: Targeting | RuleExecutor.ts | Nessun cambio |
| Step 4: A/B Split | RuleExecutor.ts | Nessun cambio |
| Deduplication | RuleExecutor.ts | Nessun cambio (7 giorni) |
| Keepa verification | KeepaEngine.ts | Nessun cambio |
| Telegram publish | TelegramBotService.ts | Solo aggiunta ascsubtag |
| Scheduler cron | automation-scheduler.ts | Nessun cambio |
| Preset scheduling | automations.ts | Nessun cambio |

### 13.3 Componenti Modificati

#### ScoringEngine.ts

```typescript
// PRIMA: Pesi fissi
function calculateDealScore(product: Product): number {
  const WEIGHTS = {
    discount: 0.40,
    salesRank: 0.25,
    rating: 0.20,
    priceDrop: 0.15
  }
  // calcolo...
  return score
}

// DOPO: Pesi dinamici per canale
async function calculateDealScore(
  product: Product, 
  channelId?: string
): Promise<{ baseScore: number, finalScore: number }> {
  
  // 1. Calcola base score (pesi fissi - per confronto e minScore)
  const baseScore = calculateBaseScore(product)
  
  // 2. Se no canale, ritorna base
  if (!channelId) {
    return { baseScore, finalScore: baseScore }
  }
  
  // 3. Prendi insights canale
  const insights = await getChannelInsights(channelId)
  
  // 4. Se pochi dati, usa pesi da audience type o fallback
  if (!insights || insights.confidence < 0.3) {
    const weights = getWeightsForAudienceType(insights?.audienceType)
    const adjustedScore = calculateWithWeights(product, weights)
    return { baseScore, finalScore: adjustedScore }
  }
  
  // 5. Usa pesi learned
  const dynamicScore = calculateWithWeights(product, insights.scoreWeights)
  
  // 6. Applica Channel Affinity multiplier (categoria, prezzo)
  const multiplier = calculateAffinityMultiplier(product, insights)
  const finalScore = Math.round(dynamicScore * multiplier)
  
  return { baseScore, finalScore: clamp(finalScore, 0, 100) }
}
```

#### RuleExecutor.ts

```typescript
// PRIMA: Pubblica sempre subito
async function executePublishStep(deals, rule) {
  for (const deal of deals) {
    await publishDeal(deal, rule)
  }
}

// DOPO: Decide se pubblicare ora o schedulare
async function executePublishStep(deals, rule) {
  const insights = await getChannelInsights(rule.channelId)
  
  for (const deal of deals) {
    // 1. Verifica e dedup (invariato)
    const verified = await verifyDeal(deal)
    if (!verified) continue
    
    const isDupe = await checkDedup(deal.asin, rule.channelId)
    if (isDupe) continue
    
    // 2. NUOVO: Decidi quando pubblicare
    if (rule.publishingMode === 'immediate') {
      // Utente ha scelto pubblicazione immediata
      await publishDealNow(deal, rule)
    } else {
      // Smart scheduling (default)
      const publishTime = calculateOptimalPublishTime(deal, insights, rule)
      
      if (publishTime <= new Date()) {
        await publishDealNow(deal, rule)
      } else {
        await scheduleDeal(deal, rule, publishTime)
      }
    }
  }
}

function calculateOptimalPublishTime(deal, insights, rule): Date {
  const now = new Date()
  
  // Se non abbastanza dati, pubblica ora
  if (!insights || insights.confidence < 0.5) {
    return now
  }
  
  // Se già in ora buona (top 3), pubblica ora
  const currentHour = now.getHours()
  if (insights.bestHours.slice(0, 3).includes(currentHour)) {
    return now
  }
  
  // Se Lightning Deal che scade presto, pubblica ora
  if (deal.lightningEndAt) {
    const hoursUntilExpiry = differenceInHours(deal.lightningEndAt, now)
    if (hoursUntilExpiry < 4) {
      return now
    }
  }
  
  // Trova prossima ora buona con slot disponibili
  const nextBest = await findNextAvailableBestHour(
    insights.bestHours, 
    rule.channelId,
    MAX_SCHEDULED_PER_HOUR
  )
  
  // Se troppo lontana (> 8h), pubblica ora
  if (differenceInHours(nextBest, now) > 8) {
    return now
  }
  
  return nextBest
}
```

#### TelegramBotService.ts

```typescript
// Aggiungere ascsubtag nella generazione URL

function generateAffiliateUrl(params: {
  asin: string
  tag: string
  channelId: string
  ruleId?: string
  dealScore?: number
}): string {
  const { asin, tag, channelId, ruleId, dealScore } = params
  
  // Costruisci ascsubtag (max 100 chars Amazon limit)
  const timestamp = Math.floor(Date.now() / 1000)
  const ascsubtag = [
    `ch${channelId}`,
    `t${timestamp}`,
    dealScore != null ? `s${dealScore}` : null,
    ruleId ? `r${ruleId}` : null
  ].filter(Boolean).join('_')
  
  return `https://www.amazon.it/dp/${asin}?tag=${tag}&ascsubtag=${ascsubtag}`
}

// Dopo publish, aggiorna con messageId
async function publishDeal(deal, rule): Promise<PublishResult> {
  // ... genera messaggio ...
  
  const result = await telegram.sendMessage(channel.channelId, message)
  const messageId = result.message_id
  
  // Aggiorna ascsubtag con messageId per tracking preciso
  const finalAscsubtag = `ch${rule.channelId}_m${messageId}_t${timestamp}_s${deal.finalScore}_r${rule.id}`
  
  // Salva in ChannelDealHistory
  await prisma.channelDealHistory.create({
    data: {
      channelId: rule.channelId,
      asin: deal.asin,
      ruleId: rule.id,
      telegramMessageId: messageId.toString(),
      baseScore: deal.baseScore,
      finalScore: deal.finalScore,
      ascsubtag: finalAscsubtag,
      // ... altri campi
    }
  })
  
  return { messageId, ascsubtag: finalAscsubtag }
}
```

### 13.4 Conflitti e Soluzioni

#### Conflitto 1: Smart Scheduling vs Aspettativa Utente

**Problema:** Utente sceglie "intensive" (1h), sistema schedula per 8h dopo.

**Soluzione:** 
- `publishingMode` toggle per automazione
- Default: `smart`
- Opzione: `immediate` (comportamento legacy)

```prisma
model AutomationRule {
  // ... existing ...
  publishingMode String @default("smart") // 'smart' | 'immediate'
}
```

#### Conflitto 2: Accumulo Deal Schedulati

**Problema:** Multiple run trovano deal → tutti schedulati stessa ora → spam.

**Soluzione:** Rate limiting con costanti configurabili:

```typescript
const SCHEDULING_LIMITS = {
  MAX_PER_HOUR: 5,      // Max deal schedulati per singola ora
  MAX_TOTAL: 15,        // Max deal in coda totali per canale
  MAX_WAIT_HOURS: 8     // Max ore di attesa prima di pubblicare comunque
}

async function findNextAvailableBestHour(bestHours, channelId, maxPerHour) {
  for (const hour of bestHours) {
    const nextOccurrence = getNextOccurrenceOfHour(hour)
    const scheduled = await countScheduledForHour(channelId, nextOccurrence)
    
    if (scheduled < maxPerHour) {
      return nextOccurrence
    }
  }
  // Tutte le ore buone piene → pubblica ora
  return new Date()
}
```

#### Conflitto 3: minScore con Pesi Dinamici

**Problema:** Score cambia con pesi → prodotto passa/non passa in modo imprevedibile.

**Soluzione:** minScore si applica al **baseScore** (pesi fissi), non al finalScore.

```typescript
// Nel filtering
const deals = scoredDeals.filter(d => d.baseScore >= rule.minScore)

// Nel ranking (dopo filter)
const ranked = deals.sort((a, b) => b.finalScore - a.finalScore)
```

Così:
- minScore = soglia "oggettiva" controllata dall'utente
- finalScore = ranking personalizzato per canale

### 13.5 Nuovi Job Scheduler

| Job | Cron | Funzione |
|-----|------|----------|
| `scheduledDealsPublisher` | `* * * * *` (ogni minuto) | Pubblica deal schedulati che sono "due" |
| `channelInsightsCalculator` | `0 */6 * * *` (ogni 6h) | Ricalcola insights per canali attivi |
| `memberSnapshotJob` | `0 */6 * * *` (ogni 6h) | Polling member count |
| `healthScoreCalculator` | `0 4 * * *` (ogni giorno 4am) | Calcola health score |
| `correlationCalculator` | `0 3 * * *` (ogni giorno 3am) | Calcola correlazioni fattori → pesi |

```typescript
// jobs/scheduledDealsPublisher.ts
export async function scheduledDealsPublisher() {
  const now = new Date()
  
  const dueDeals = await prisma.scheduledDeal.findMany({
    where: {
      status: 'pending',
      scheduledFor: { lte: now }
    },
    include: { channel: true, rule: true, product: true },
    orderBy: { finalScore: 'desc' } // Best first
  })
  
  for (const deal of dueDeals) {
    try {
      // Ri-verifica validità deal (prezzo potrebbe essere cambiato)
      const stillValid = await verifyDealStillValid(deal.asin)
      
      if (!stillValid) {
        await updateScheduledDeal(deal.id, { 
          status: 'cancelled', 
          cancelReason: 'deal_expired' 
        })
        continue
      }
      
      // Pubblica
      const result = await publishDealNow(deal, deal.rule)
      
      await updateScheduledDeal(deal.id, {
        status: 'published',
        publishedAt: new Date(),
        telegramMessageId: result.messageId
      })
      
    } catch (error) {
      logger.error(`Failed to publish scheduled deal ${deal.id}`, error)
      await updateScheduledDeal(deal.id, { 
        status: 'failed',
        cancelReason: error.message
      })
    }
  }
}
```

### 13.6 Modifiche Schema Database

```prisma
// Aggiunte a AutomationRule
model AutomationRule {
  // ... existing fields ...
  
  // Smart Scheduling toggle
  publishingMode String @default("smart") // 'smart' | 'immediate'
  
  // Relations
  scheduledDeals ScheduledDeal[]
}

// Aggiunte a ChannelDealHistory
model ChannelDealHistory {
  // ... existing fields ...
  
  // Score tracking
  baseScore   Int?
  finalScore  Int?
  
  // Attribution
  ascsubtag   String?
  
  // Performance (populated async)
  clicks      Int @default(0)
  conversions Int @default(0)
  revenue     Float @default(0)
  
  @@index([ascsubtag])
}

// Nuova tabella ScheduledDeal (già nel report sezione 9)
```

### 13.7 API Modifiche

```typescript
// PUT /api/automation/rules/:id
// Aggiungere publishingMode al body

interface UpdateRuleBody {
  // ... existing fields ...
  publishingMode?: 'smart' | 'immediate'
}

// GET /api/channels/:id/scheduled-deals
// Nuovo endpoint per vedere deal in coda

// DELETE /api/scheduled-deals/:id
// Nuovo endpoint per cancellare deal schedulato
```

### 13.8 Effort Integrazione

| Task | File | Effort |
|------|------|--------|
| Modifiche ScoringEngine | ScoringEngine.ts | 4h |
| Modifiche RuleExecutor | RuleExecutor.ts | 8h |
| ascsubtag in links | TelegramBotService.ts | 2h |
| Job scheduledDealsPublisher | Nuovo file | 4h |
| Job channelInsightsCalculator | Nuovo file | 6h |
| Job memberSnapshotJob | Nuovo file | 3h |
| Migrazioni DB | schema.prisma | 2h |
| API publishingMode | automations.ts | 2h |
| API scheduled-deals | Nuovo file | 3h |
| **Totale integrazione** | | **~34h** |

---

## 14. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| Schema DB updates (migrazioni) | 🔴 Critical | 2h |
| ascsubtag generation in links | 🔴 Critical | 4h |
| ascsubtag in shortener redirect | 🔴 Critical | 2h |
| Member count polling job | 🔴 Critical | 4h |
| Basic ChannelInsights calculation | 🔴 Critical | 8h |

### Phase 2: Intelligence (Week 2-3)

| Task | Priority | Effort |
|------|----------|--------|
| Channel Affinity multiplier | 🔴 Critical | 6h |
| Smart Scheduling logic | 🔴 Critical | 8h |
| Health Score calculation | 🟡 High | 4h |
| Member webhook handler | 🟡 High | 4h |
| ScheduledDeal publisher job | 🔴 Critical | 4h |

### Phase 3: Attribution (Week 3-4)

| Task | Priority | Effort |
|------|----------|--------|
| Report upload endpoint | 🔴 Critical | 4h |
| CSV parser | 🔴 Critical | 4h |
| OCR integration (basic) | 🟡 High | 8h |
| Conversion attribution logic | 🔴 Critical | 6h |
| Dashboard "Upload Report" UI | 🟡 High | 4h |

### Phase 4: UI & Polish (Week 4-5)

| Task | Priority | Effort |
|------|----------|--------|
| Insights dashboard tab | 🟡 High | 8h |
| Health indicators | 🟡 High | 4h |
| Scheduled deals management | 🟡 High | 6h |
| AI recommendations generator | 🟢 Medium | 6h |
| Cold start onboarding flow | 🟡 High | 4h |

### Total Estimated Effort

- **Phase 1:** ~20h
- **Phase 2:** ~26h
- **Phase 3:** ~26h
- **Phase 4:** ~28h
- **Total:** ~100h (2.5 weeks full-time)

---

## 15. Success Metrics

### 13.1 System Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Attribution accuracy | > 90% | Matched conversions / Total conversions |
| Scheduling effectiveness | +20% CTR | CTR scheduled vs immediate |
| Channel Affinity impact | +15% CVR | CVR with affinity vs without |
| Cold start time | < 14 days | Days to reach 0.5 confidence |

### 13.2 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Beta tester retention | > 80% | Active after 30 days |
| Revenue per channel | +25% | Avg revenue post-optimization |
| Channel health | > 60 avg | Avg health score across channels |
| Data collected | 10k+ posts | Total posts tracked in beta |

---

## 16. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Amazon changes report format | High | Versioned parsers, alert on parse failures |
| Telegram rate limits | Medium | Queuing system, exponential backoff |
| Low data during cold start | Medium | Exploration phase, onboarding questions |
| Bot banned by Telegram | High | Multiple bot tokens, rate limiting |
| ascsubtag not appearing in reports | Critical | Test thoroughly before launch |

---

## 17. Open Questions

1. **ascsubtag availability:** Verificare che appaia effettivamente nei report Italia
2. **Report frequency:** Ogni quanto gli utenti scaricano i report? Giornaliero? Settimanale?
3. **Privacy:** Come gestiamo GDPR per il tracking utenti Telegram?
4. **Multi-marketplace:** ascsubtag funziona uguale su Amazon.de, .fr, .es?

---

## Appendix A: ascsubtag Format Specification

```
Format: ch{cid}_m{mid}_t{ts}_s{score}_r{rid}

Fields:
- ch{cid}  : Channel ID (internal, max 10 chars)
- m{mid}   : Telegram Message ID (max 15 chars)
- t{ts}    : Unix timestamp (10 chars)
- s{score} : Deal Score 0-100 (max 3 chars)
- r{rid}   : Rule ID (max 10 chars)

Total max length: ~55 chars (well under 100 limit)

Examples:
- ch12_m7891234567_t1701619200_s72_r5
- ch999_m123456789012345_t1701619200_s100_r999
```

---

## Appendix B: Health Score Algorithm

```typescript
function calculateHealthScore(channel: Channel): number {
  let score = 50 // Base
  
  // 1. Growth component (max ±25 points)
  const growth = channel.netGrowthRate || 0
  if (growth > 10) score += 25
  else if (growth > 5) score += 20
  else if (growth > 2) score += 15
  else if (growth > 0) score += 10
  else if (growth > -2) score += 0
  else if (growth > -5) score -= 10
  else if (growth > -10) score -= 20
  else score -= 25
  
  // 2. Posting frequency component (max ±15 points)
  const postsPerDay = channel.avgPostsPerDay || 0
  if (postsPerDay >= 2 && postsPerDay <= 5) score += 15
  else if (postsPerDay >= 1 && postsPerDay <= 8) score += 10
  else if (postsPerDay > 15) score -= 15
  else if (postsPerDay > 10) score -= 5
  else if (postsPerDay < 1) score -= 5
  
  // 3. Engagement component (max ±10 points)
  const avgCtr = channel.avgCtr || 0
  if (avgCtr > 5) score += 10
  else if (avgCtr > 3) score += 5
  else if (avgCtr < 1) score -= 10
  else if (avgCtr < 2) score -= 5
  
  return Math.max(0, Math.min(100, score))
}
```

---

*Documento generato durante sessione di design Afflyt Pro — Dicembre 2024*
