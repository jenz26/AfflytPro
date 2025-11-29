# Keepa Queue v2 - Stress Test Suite

Sistema di stress test per validare il funzionamento della Queue v2 con batching e rate limiting.

## Prerequisiti

```bash
# Variabili d'ambiente richieste
REDIS_URL=redis://...
DATABASE_URL=postgresql://...
```

## Come Eseguire i Test

### 1. Setup - Crea le regole di test

```bash
cd apps/api
node scripts/stress-test/setup.js
```

Questo script:
- Trova un utente BUSINESS nel database
- Crea un canale di test `STRESS_TEST_CHANNEL` (mocked, non invia messaggi reali)
- Crea le regole di automazione definite in `config.js`

### 2. Runner - Esegui il test

```bash
node scripts/stress-test/runner.js
```

Questo script:
- Imposta tutte le regole per triggerare immediatamente
- Monitora la coda e il progresso
- Stampa un report finale con metriche

### 3. Cleanup - Pulisci i dati di test

```bash
node scripts/stress-test/cleanup.js
```

Questo script:
- Elimina tutte le regole `STRESS_TEST_*`
- Elimina il canale di test
- Pulisce le chiavi Redis `stress:*`

## Configurazione Test (config.js)

```javascript
module.exports = {
  TEST_PREFIX: 'STRESS_TEST_',

  // Categorie da testare (ID Keepa per Amazon IT)
  CATEGORIES: [
    { id: 524015031, name: 'Casa e cucina', rulesCount: 15 },
    { id: 412609031, name: 'Elettronica', rulesCount: 10 },
    { id: 523997031, name: 'Giochi e giocattoli', rulesCount: 5 }
  ],

  // Variazioni di filtri per le regole
  RULE_VARIATIONS: [
    { minScore: 60, minDiscount: 20, maxPrice: 50 },
    // ... altre variazioni
  ],

  EXPECTED: {
    totalRules: 30,
    totalJobs: 3,      // 3 categorie = 3 job (batching!)
    tokensSaved: 27,   // 30 - 3 = 27 chiamate API risparmiate
    maxTimeSeconds: 60
  }
};
```

## Scenari di Test Eseguiti

### Test 1: Batching Base (20 regole)
- **Config**: 4 categorie x 5 regole
- **Risultato**: 20 regole -> 4 job
- **API calls saved**: 16

### Test 2: Batching Medio (100 regole)
- **Config**: 10 categorie x 10 regole
- **Risultato**: 100 regole -> 10 job in 49s
- **API calls saved**: 90

### Test 3: Rate Limiter (25 categorie)
- **Config**: 25 categorie x 1 regola (forza rate limiting)
- **Risultato**: Completato in 1.3 min con backpressure
- **Verifica**: Token sync ogni 30s funziona

### Test 4: Batching Estremo (200 regole)
- **Config**: 1 categoria x 200 regole
- **Risultato**: 200 regole -> 1 job in 16s
- **API calls saved**: 199 (99.5%!)

### Test 5: Error Resilience (30 regole)
- **Config**: Mix di regole valide + regole che generano errori
- **Risultato**: Job continua anche con errori isolati
- **Verifica**: Sentry cattura errori con contesto

## Cosa Verifica il Test

1. **Batching per Categoria**: Regole sulla stessa categoria vengono aggregate in un unico job
2. **Rate Limiting**: Il sistema rispetta i limiti di token Keepa (20/min)
3. **Error Isolation**: Errori su singole regole non crashano il job
4. **Cache**: Deals cachati vengono riutilizzati senza chiamate API
5. **Deduplication**: Lo stesso deal non viene pubblicato due volte

## Metriche Raccolte

Il runner raccoglie metriche in Redis (`stress:metrics`):
- `rulesProcessed`: Regole processate
- `dealsPublished`: Deal pubblicati
- `duplicatesSkipped`: Duplicati saltati
- `jobsCompleted`: Job completati
- `tokenWaits`: Attese per token
- `errors`: Errori

## Mock Telegram

I canali con `channelId` che inizia con `TEST_` sono mocked:
- Non inviano messaggi reali a Telegram
- Loggano `[Telegram] MOCK: Would send {asin} to {channel}`
- Ritornano `{ success: true, mocked: true }`

## Integrazione Sentry

Gli errori sono tracciati in Sentry con:
- **Breadcrumbs**: Job start/complete, token waits, publish
- **Context**: ruleId, category, asin, channelId
- **Performance**: Timing di ogni job con attributi

## Troubleshooting

### "No BUSINESS user found"
Crea un utente con piano BUSINESS nel database.

### "Rule has invalid category"
Verifica che i category ID in config.js esistano in `amazon-categories.ts`.

### Test troppo lento
- Aumenta `maxTimeSeconds` in config
- Riduci il numero di categorie (meno job = meno rate limiting)
