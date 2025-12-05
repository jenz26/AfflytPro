# Afflyt Deal Discovery System - Report Tecnico

## Panoramica

Il sistema di discovery delle offerte di Afflyt utilizza l'API Keepa per trovare deal su Amazon.it, li valuta con un algoritmo di scoring proprietario, e li pubblica automaticamente sui canali Telegram degli utenti.

---

## 1. Architettura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATION SCHEDULER                          │
│  Esegue le regole ogni X minuti (configurabile per utente)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      KEEPA QUEUE SYSTEM                          │
│  Gestisce le richieste API con rate limiting e token budget     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        KEEPA API                                 │
│  1. Deal API - Trova offerte per categoria                      │
│  2. Product API - Verifica BuyBox e prezzi reali                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SCORING ENGINE                               │
│  Calcola score 0-100 basato su discount, prezzo, rating, etc.  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TELEGRAM PUBLISHER                             │
│  Formatta e pubblica il messaggio con link affiliato            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Come Cerchiamo le Offerte

### 2.1 Keepa Deal API

Utilizziamo l'endpoint `deals` di Keepa con i seguenti parametri:

```typescript
// Richiesta all'API Keepa
{
  domain: 8,              // Amazon.it
  category: categoryId,   // Es: 412609031 (Elettronica)
  priceTypes: [0, 1, 2],  // Amazon, Marketplace New, Marketplace Used

  // Filtri di base
  deltaPercentRange: [-90, -15],  // Sconto tra 15% e 90%
  deltaRange: [-10000, -100],     // Risparmio minimo €1

  // Filtri qualità
  salesRankRange: [1, 50000],     // Top 50k bestseller
  isRangeEnabled: true
}
```

### 2.2 Tipi di Prezzo Analizzati

Keepa fornisce **diversi tipi di prezzo** per ogni prodotto:

| Tipo | Descrizione | Uso |
|------|-------------|-----|
| `AMAZON` | Prezzo venduto e spedito da Amazon | Preferito |
| `NEW` | Prezzo più basso da venditori terzi (nuovo) | Fallback |
| `USED` | Prezzo usato | Ignorato |
| `LIST_PRICE` | Prezzo di listino (MSRP) | ⚠️ Spesso gonfiato |
| `BUYBOX` | Prezzo attuale nel BuyBox | Verificato |

### 2.3 Verifica BuyBox

Dopo aver ottenuto i deal, verifichiamo i **top 20** con la Product API:

```typescript
// Verifica BuyBox per i migliori deal
const verifyResult = await keepaClient.verifyDealsWithBuybox(
  sortedDeals,
  VERIFY_TOP_N_DEALS  // 20
);
```

Questo ci permette di:
- Confermare che il prezzo è ancora valido
- Verificare chi detiene il BuyBox (Amazon vs terzi)
- Ottenere dati storici sui prezzi

---

## 3. Calcolo dello Score

### 3.1 Componenti dello Score

Lo score finale (0-100) è calcolato con **pesi dinamici**:

```typescript
const WEIGHTS = {
  discount: 0.35,      // 35% - Percentuale di sconto
  priceDrop: 0.25,     // 25% - Drop vs media 30gg
  rating: 0.20,        // 20% - Valutazione prodotto
  salesRank: 0.20      // 20% - Popolarità (bestseller rank)
};
```

### 3.2 Formula Discount Score

```typescript
function calculateDiscountScore(discount: number): number {
  // Normalizza lo sconto in un range 0-100
  // 15% sconto = ~30 punti
  // 30% sconto = ~60 punti
  // 50% sconto = ~85 punti
  // 70%+ sconto = ~95 punti

  if (discount <= 15) return discount * 2;
  if (discount <= 30) return 30 + (discount - 15) * 2;
  if (discount <= 50) return 60 + (discount - 30) * 1.25;
  return Math.min(100, 85 + (discount - 50) * 0.3);
}
```

### 3.3 Formula Price Drop Score

Confrontiamo il prezzo attuale con la **media degli ultimi 30 giorni**:

```typescript
function calculatePriceDropScore(
  currentPrice: number,
  avgPrice30: number
): number {
  if (!avgPrice30 || avgPrice30 <= currentPrice) return 0;

  const dropPercent = ((avgPrice30 - currentPrice) / avgPrice30) * 100;

  // Drop del 10% = 40 punti
  // Drop del 20% = 70 punti
  // Drop del 30%+ = 90+ punti
  return Math.min(100, dropPercent * 3);
}
```

### 3.4 Rating Score

```typescript
function calculateRatingScore(
  rating: number,      // 0-50 (Keepa scale, 45 = 4.5 stelle)
  reviewCount: number
): number {
  // Rating base (0-50 su scala Keepa)
  const ratingScore = (rating / 50) * 60;  // Max 60 punti

  // Bonus per numero di recensioni
  const reviewBonus = Math.min(40, Math.log10(reviewCount + 1) * 15);

  return Math.min(100, ratingScore + reviewBonus);
}
```

### 3.5 Sales Rank Score

```typescript
function calculateSalesRankScore(
  salesRank: number,
  category: string
): number {
  // Top 100 = 100 punti
  // Top 1000 = 80 punti
  // Top 10000 = 60 punti
  // Top 50000 = 40 punti

  if (salesRank <= 100) return 100;
  if (salesRank <= 1000) return 80 + (1000 - salesRank) / 45;
  if (salesRank <= 10000) return 60 + (10000 - salesRank) / 450;
  if (salesRank <= 50000) return 40 + (50000 - salesRank) / 2000;
  return Math.max(0, 40 - (salesRank - 50000) / 5000);
}
```

---

## 4. Fonti dei Prezzi

### 4.1 Prezzo Originale (il problema)

Il "prezzo originale" mostrato può provenire da diverse fonti:

| Fonte | Affidabilità | Problema |
|-------|--------------|----------|
| `listPrice` | ⚠️ Bassa | MSRP spesso gonfiato dai venditori |
| `referencePrice` | ⚠️ Media | Prezzo "era" di Amazon, manipolabile |
| `avgPrice30` | ✅ Alta | Media reale ultimi 30 giorni |
| `avgPrice90` | ✅ Alta | Media reale ultimi 90 giorni |
| `lowestPrice` | ✅ Alta | Minimo storico verificato |

### 4.2 Esempio del Problema

```
Prodotto: Thunelec Cuffie Bluetooth

Dati Keepa:
- currentPrice: €9.99
- listPrice: €147.14      ← Prezzo di listino (GONFIATO)
- avgPrice30: €12.50      ← Media reale ultimi 30gg
- avgPrice90: €14.20      ← Media reale ultimi 90gg

Sconto mostrato: -93% (basato su listPrice)
Sconto REALE: -20% (basato su avgPrice30)
```

### 4.3 Perché Succede

I venditori Amazon possono:
1. **Impostare un MSRP artificialmente alto** per far sembrare lo sconto maggiore
2. **Alzare temporaneamente il prezzo** e poi "scontarlo"
3. **Usare il prezzo "era"** che Amazon non verifica rigorosamente

Amazon ha regole contro queste pratiche, ma l'enforcement è limitato.

---

## 5. Dati Disponibili da Keepa

Per ogni deal, Keepa ci fornisce:

```typescript
interface KeepaProduct {
  asin: string;
  title: string;

  // Prezzi attuali
  currentPrice: number;      // Prezzo attuale
  buyBoxPrice: number;       // Prezzo nel BuyBox

  // Prezzi storici
  listPrice: number;         // MSRP (spesso gonfiato)
  avgPrice30: number;        // Media 30 giorni
  avgPrice90: number;        // Media 90 giorni
  lowestPrice: number;       // Minimo storico

  // Sconto calcolato
  discountPercent: number;   // % sconto vs listPrice

  // Qualità prodotto
  rating: number;            // 0-50 (4.5 = 45)
  reviewCount: number;
  salesRank: number;

  // Metadata
  category: string;
  imageUrl: string;
  isPrime: boolean;

  // Stato deal
  dealType: 'lightning' | 'deal_of_day' | 'coupon' | 'price_drop';
  dealEndTime?: Date;
}
```

---

## 6. Filtri Applicati

### 6.1 Filtri Utente (configurabili nel wizard)

| Filtro | Default | Descrizione |
|--------|---------|-------------|
| `minScore` | 35 | Score minimo per pubblicare |
| `categories` | [] | Categorie Amazon da monitorare |
| `maxPrice` | null | Prezzo massimo |
| `minDiscount` | null | Sconto minimo % |
| `minRating` | null | Rating minimo (0-500 scale) |
| `primeOnly` | false | Solo prodotti Prime |

### 6.2 Filtri Sistema (hardcoded)

```typescript
// In KeepaWorker.ts
const SYSTEM_FILTERS = {
  minDiscount: 15,           // Minimo 15% sconto
  maxSalesRank: 50000,       // Top 50k bestseller
  minSavings: 100,           // Minimo €1 risparmio
  maxResults: 150            // Max deal per query
};
```

### 6.3 Deal Publish Mode

L'utente può scegliere cosa pubblicare:

| Mode | Descrizione |
|------|-------------|
| `DISCOUNTED_ONLY` | Solo deal con sconto visibile (barrato) |
| `LOWEST_PRICE` | Solo prezzi al minimo storico |
| `BOTH` | Entrambi |

---

## 7. Flusso Completo

```
1. SCHEDULER
   └─> Ogni X minuti, per ogni automazione attiva

2. QUEUE
   └─> Raggruppa richieste per categoria
   └─> Gestisce rate limit Keepa (60 tokens/min)

3. KEEPA DEAL API
   └─> Richiede deal per categoria
   └─> Riceve max 150 deal

4. CACHE CHECK
   └─> Se dati freschi (<30min), usa cache
   └─> Altrimenti, chiama API

5. BUYBOX VERIFY
   └─> Verifica top 20 deal con Product API
   └─> Conferma prezzi reali

6. FILTER PIPELINE
   └─> Applica filtri utente (categoria, prezzo, etc.)
   └─> Filtra per dealPublishMode
   └─> Filtra per minScore

7. SCORING
   └─> Calcola score per ogni deal
   └─> Ordina per score decrescente

8. DEDUPLICATION
   └─> Verifica se ASIN già pubblicato (TTL 7gg)
   └─> Skip duplicati

9. PUBLISH
   └─> Genera copy (template o LLM)
   └─> Pubblica su Telegram
   └─> Registra in ChannelDealHistory
```

---

## 8. Problema Identificato: Sconti Gonfiati

### 8.1 Causa Root

Il sistema attualmente usa `listPrice` (MSRP) come prezzo di riferimento per calcolare lo sconto. Questo valore è:
- Fornito dal venditore
- Non verificato da Amazon
- Spesso artificialmente alto

### 8.2 Impatto

- Sconti mostrati del 80-95% quando lo sconto reale è 10-30%
- Perdita di credibilità del canale
- Utenti delusi quando vedono il prezzo "normale" su Amazon

### 8.3 Soluzioni Proposte

**Opzione A: Usare avgPrice30 come riferimento**
```typescript
// Invece di:
const discount = ((listPrice - currentPrice) / listPrice) * 100;

// Usare:
const discount = ((avgPrice30 - currentPrice) / avgPrice30) * 100;
```

**Opzione B: Mostrare entrambi gli sconti**
```
🔥 Cuffie Bluetooth
💰 €9.99 (era €12.50 media 30gg)
📉 -20% vs media | -93% vs listino
```

**Opzione C: Filtro anti-gonfiaggio**
```typescript
// Escludere deal dove listPrice è >2x avgPrice30
if (listPrice > avgPrice30 * 2) {
  // Sconto sospetto, usa avgPrice30
  originalPrice = avgPrice30;
}
```

**Opzione D: Mostrare badge "Minimo Storico"**
```typescript
if (currentPrice <= lowestPrice) {
  // Aggiungi badge 🏆 MINIMO STORICO
}
```

---

## 9. Metriche e Logging

### 9.1 Dati Tracciati

Per ogni esecuzione:
```typescript
interface AutomationRunStats {
  ruleId: string;
  dealsFetched: number;       // Deal dalla API
  dealsAfterFilters: number;  // Dopo filtri base
  dealsAfterMode: number;     // Dopo dealPublishMode
  dealsPassingScore: number;  // Dopo minScore
  dealsPublished: number;     // Effettivamente pubblicati
  avgScore: number;
  minScore: number;
  maxScore: number;
  durationMs: number;
  cacheHit: boolean;
}
```

### 9.2 Log di Debug

```
[KeepaWorker] Rule xxx filter pipeline:
  150 -> 150 (filters)
      -> 127 (mode: DISCOUNTED_ONLY)
      -> 112 (minScore: 65)

[KeepaWorker] Top scores:
  B0ABC123: base=78 final=82 (disc:45%)
  B0DEF456: base=72 final=75 (disc:38%)
```

---

## 10. Conclusioni

Il sistema di discovery funziona correttamente nel trovare deal, ma il problema degli **sconti gonfiati** deriva dalla fonte dati (Amazon/venditori) non dal nostro algoritmo.

### Raccomandazioni

1. **Priorità Alta**: Implementare Opzione C (filtro anti-gonfiaggio)
2. **Priorità Media**: Aggiungere badge "Minimo Storico" (Opzione D)
3. **Priorità Bassa**: Mostrare sconto vs media (Opzione B)

### File Coinvolti

- `apps/api/src/services/keepa/KeepaWorker.ts` - Logica principale
- `apps/api/src/services/ScoringEngine.ts` - Calcolo score
- `apps/api/src/services/TelegramBotService.ts` - Formattazione messaggio
- `apps/api/src/services/scheduling/SchedulerService.ts` - Smart scheduling
