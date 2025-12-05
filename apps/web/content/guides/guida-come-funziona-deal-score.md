---
title: "Come Funziona il Deal Score di Afflyt: Guida Tecnica Completa"
slug: "come-funziona-deal-score"
description: "Scopri l'algoritmo dietro al Deal Score di Afflyt. Analisi tecnica dei fattori, pesi dinamici e ottimizzazione automatica basata su machine learning."
category: "Tecnico"
readTime: "10 min"
publishedAt: "2024-12-05"
updatedAt: "2024-12-05"
author: "Afflyt Team"
keywords:
  - deal score
  - algoritmo scoring offerte
  - machine learning affiliate
  - pesi dinamici
  - ottimizzazione conversioni
  - keepa api
featured: true
---

Il Deal Score è il cuore dell'intelligenza di Afflyt. È l'algoritmo che analizza ogni offerta Amazon e decide se vale la pena pubblicarla nel tuo canale Telegram. In questa guida tecnica ti spieghiamo esattamente come funziona, quali fattori considera e come si ottimizza automaticamente nel tempo.

Se gestisci un canale di offerte, capire il Deal Score ti aiuterà a configurare meglio le tue automazioni e a interpretare perché certe offerte vengono selezionate e altre no.

## Cos'è il Deal Score

Il Deal Score è un punteggio da 0 a 100 assegnato a ogni offerta Amazon. Più alto è il punteggio, più l'offerta è considerata "di qualità" per il tuo pubblico specifico.

**Score ranges:**

| Range | Significato |
|-------|-------------|
| 80-100 | Eccellente - offerta da pubblicare subito |
| 60-79 | Buono - offerta solida |
| 40-59 | Discreto - dipende dai tuoi standard |
| 20-39 | Mediocre - probabilmente da scartare |
| 0-19 | Scadente - non pubblicare |

Ma il Deal Score non è un numero statico calcolato con una formula fissa. È un sistema dinamico che:

1. Parte da una base comune per tutti
2. Si adatta al tipo di canale (audience type)
3. **Impara dalle conversioni reali** del tuo canale specifico

## I Fattori del Deal Score

Il punteggio è composto da più fattori, ognuno con un peso specifico.

### Fattore 1: Discount Score (Peso Base: 25%)

Misura la qualità dello sconto rispetto allo storico prezzi.

**Come si calcola:**

```
discount_score = (sconto_reale / sconto_massimo_atteso) × 100
```

Non consideriamo lo "sconto dal prezzo di listino" di Amazon (spesso gonfiato), ma lo sconto rispetto a:

- Prezzo medio ultimi 30 giorni
- Prezzo medio ultimi 90 giorni
- Prezzo minimo storico

**Esempio:**
- Prezzo attuale: €50
- Prezzo medio 30gg: €70
- Sconto reale: 28.5%
- Sconto massimo atteso (benchmark): 40%
- **Discount Score:** (28.5 / 40) × 100 = **71**

**Bonus applicati:**
- +10 se è il **minimo storico assoluto**
- +5 se è il **minimo degli ultimi 30 giorni**

### Fattore 2: Rating Score (Peso Base: 20%)

Valuta la qualità del prodotto basandosi sulle recensioni.

**Formula:**

```
rating_score = ((rating - 3) / 2) × 100
```

Questo normalizza il rating su una scala 0-100 dove:
- 3.0 stelle = 0 punti
- 4.0 stelle = 50 punti
- 5.0 stelle = 100 punti

**Perché partiamo da 3?** Sotto 3 stelle consideriamo il prodotto non pubblicabile, quindi non ha senso dare punteggi positivi.

**Modificatori:**
- **Numero recensioni basso** (<50): Score ridotto del 20%
- **Numero recensioni alto** (>1000): Score aumentato del 10%

### Fattore 3: Sales Rank Score (Peso Base: 20%)

Il Sales Rank indica la popolarità di vendita nella categoria.

**Problema:** I Sales Rank variano enormemente per categoria. Un rank 5.000 in "Elettronica" è ottimo, ma in "Libri" è nella media.

**Soluzione:** Usiamo una scala logaritmica normalizzata:

```
rank_score = max(0, 100 - (log10(sales_rank) × 20))
```

**Tradotto:**
- Rank 1-10: Score ~100
- Rank 100: Score ~60
- Rank 1.000: Score ~40
- Rank 10.000: Score ~20
- Rank 100.000+: Score ~0

### Fattore 4: Price Drop Score (Peso Base: 15%)

Misura l'entità del calo di prezzo recente.

**Formula:**

```
price_drop_score = min(100, price_drop_percent × 2)
```

Un calo del 50% ottiene il massimo punteggio (100).

**Perché è separato dal Discount Score?** Perché un prodotto può avere:
- Sconto alto rispetto al "listino" (discount) ma prezzo stabile (no drop)
- Calo di prezzo recente (drop) ma sconto nominale basso

Vogliamo premiare entrambi i casi quando sono reali.

### Fattore 5: Review Count Score (Peso Base: 10%)

Valuta la "fiducia" nel prodotto basata sul volume di recensioni.

**Formula (scala logaritmica):**

```
review_score = min(100, log10(review_count + 1) × 33)
```

**Risultati:**
- 10 recensioni: ~33 punti
- 100 recensioni: ~66 punti
- 1.000 recensioni: ~100 punti

### Fattore 6: Deal Type Bonus (Peso Base: 10%)

Alcuni tipi di offerta meritano un bonus:

| Tipo | Bonus |
|------|-------|
| Lightning Deal (Offerta Lampo) | +15 |
| Deal of the Day | +12 |
| Coupon attivo | +8 |
| Warehouse Deal | +5 |
| Prime Exclusive | +3 |

## La Formula Completa

Il Deal Score finale è:

```
deal_score = (discount × w1) + (rating × w2) + (rank × w3) + 
             (price_drop × w4) + (reviews × w5) + deal_type_bonus
```

Dove `w1...w5` sono i **pesi dinamici** (spiegati nella prossima sezione).

**Con i pesi default:**

```
deal_score = (discount × 0.25) + (rating × 0.20) + (rank × 0.20) + 
             (price_drop × 0.15) + (reviews × 0.10) + bonus
```

## Pesi Dinamici: L'Intelligenza che Impara

Ecco dove Afflyt si distingue dai sistemi tradizionali. I pesi non sono fissi, ma **si adattano automaticamente** basandosi sulle performance reali del tuo canale.

### Come Funziona

1. **Raccolta dati:** Ogni volta che pubblichi un'offerta, tracciamo click e conversioni
2. **Calcolo correlazioni:** Usiamo il [coefficiente di Pearson](https://it.wikipedia.org/wiki/Correlazione_(statistica)) per misurare quanto ogni fattore correla con le conversioni
3. **Aggiornamento pesi:** I fattori che correlano di più con le vendite ottengono pesi maggiori

### Esempio Pratico

Immagina che dopo un mese di dati, Afflyt scopra che:

- Nel TUO canale, il **rating** correla fortemente con le conversioni (r = 0.7)
- Ma il **sales rank** correla poco (r = 0.2)

Il sistema automaticamente aumenterà il peso del rating e diminuirà quello del rank, SOLO per il tuo canale.

**Nuovi pesi personalizzati:**
```
discount: 0.25 → 0.23
rating: 0.20 → 0.28  // Aumentato!
rank: 0.20 → 0.12    // Diminuito!
price_drop: 0.15 → 0.17
reviews: 0.10 → 0.10
```

### Confidence e Blending

Quando hai pochi dati, il sistema non può essere sicuro delle correlazioni. Usiamo un sistema di **confidence**:

| Data Points | Confidence | Comportamento |
|-------------|------------|---------------|
| <10 | 0.1 | 90% pesi default, 10% pesi calcolati |
| 10-50 | 0.3 | 70% default, 30% calcolati |
| 50-200 | 0.6 | 40% default, 60% calcolati |
| >200 | 0.9 | 10% default, 90% calcolati |

Questo garantisce stabilità con pochi dati e personalizzazione con molti dati.

## Audience Types: Pesi Pre-Configurati

Per i canali nuovi o con pochi dati, offriamo **preset** ottimizzati per tipologia di audience:

### Tech Enthusiasts
```
discount: 0.20
rating: 0.25
rank: 0.25
price_drop: 0.15
reviews: 0.15
```
*Pubblico esigente che valuta qualità e popolarità*

### Bargain Hunters
```
discount: 0.35
rating: 0.15
rank: 0.15
price_drop: 0.25
reviews: 0.10
```
*Pubblico focalizzato sul risparmio*

### Quality Seekers
```
discount: 0.15
rating: 0.35
rank: 0.20
price_drop: 0.10
reviews: 0.20
```
*Pubblico che vuole solo prodotti eccellenti*

### General Audience
```
discount: 0.25
rating: 0.20
rank: 0.20
price_drop: 0.15
reviews: 0.10
```
*Bilanciato per canali generalisti*

## Come Interpretare il Deal Score nella Dashboard

Nella [dashboard di Afflyt](/it/features/dashboard), ogni offerta mostra:

- **Score totale** (0-100)
- **Breakdown** dei singoli fattori
- **Indicatore di confidence** (quanto i pesi sono personalizzati)

### Esempio di Breakdown

```
Deal Score: 78/100

├── Discount (23%): 17/23 punti
├── Rating (4.6★): 16/20 punti
├── Sales Rank (#342): 18/20 punti
├── Price Drop (-35%): 11/15 punti
├── Reviews (2.3K): 9/10 punti
└── Bonus (Lightning): +7 punti
```

Questo ti permette di capire **perché** un'offerta ha un certo punteggio e ottimizzare i tuoi filtri di conseguenza.

## Configurare le Soglie di Pubblicazione

Puoi impostare soglie minime di Deal Score per le tue automazioni:

| Strategia | Soglia Consigliata |
|-----------|-------------------|
| Solo le migliori | 75+ |
| Qualità alta | 65+ |
| Standard | 55+ |
| Volume alto | 45+ |

> **Pro Tip:** Inizia con soglia alta (70+) e abbassala gradualmente se non hai abbastanza deal. È meglio pubblicare poco e bene che tanto e male.

## API e Integrazione Tecnica

Per gli utenti avanzati, il Deal Score è disponibile via API:

```json
GET /api/deals/{asin}/score

Response:
{
  "asin": "B08N5WRWNW",
  "deal_score": 78,
  "factors": {
    "discount": { "value": 28.5, "score": 71, "weight": 0.23 },
    "rating": { "value": 4.6, "score": 80, "weight": 0.28 },
    "sales_rank": { "value": 342, "score": 89, "weight": 0.12 },
    "price_drop": { "value": 35, "score": 70, "weight": 0.17 },
    "review_count": { "value": 2341, "score": 90, "weight": 0.10 }
  },
  "deal_type": "lightning",
  "deal_type_bonus": 15,
  "confidence": 0.72,
  "is_lowest_ever": false,
  "is_lowest_30d": true
}
```

## Confronto con Altri Sistemi

| Feature | Afflyt Deal Score | Bot Tradizionali |
|---------|-------------------|------------------|
| Fattori multipli | ✅ 6+ fattori | ❌ Solo sconto |
| Pesi dinamici | ✅ Machine learning | ❌ Fissi |
| Per-canale | ✅ Personalizzato | ❌ Uguale per tutti |
| Storico prezzi | ✅ Keepa integrato | ⚠️ Spesso assente |
| Correlazioni | ✅ Pearson coefficient | ❌ Nessuna |

## Ottimizzare il Deal Score per il Tuo Canale

Per ottenere il massimo dal sistema:

1. **Importa i report Amazon Associates** - Più dati di conversione = pesi più precisi
2. **Scegli l'audience type corretto** - Inizia dal preset più vicino al tuo pubblico
3. **Dai tempo al sistema** - Servono ~50 conversioni per correlazioni significative
4. **Analizza i breakdown** - Identifica quali fattori contano per il TUO pubblico
5. **Sperimenta con le soglie** - Trova il balance tra volume e qualità

## Conclusione

Il Deal Score di Afflyt non è una semplice formula statica, ma un sistema intelligente che:

- Analizza 6+ fattori per ogni offerta
- Usa dati reali di storico prezzi (Keepa)
- Si adatta automaticamente al tuo pubblico
- Migliora con più dati di conversione

Capire come funziona ti aiuta a configurare meglio le automazioni e interpretare le scelte del sistema.

[**Prova il Deal Score in Azione →**](/it/register)

---

*Vuoi vedere come il Deal Score si integra con gli analytics? Leggi la guida su [come analizzare click e conversioni](/it/blog/analizzare-click-conversioni-canale-telegram).*
