# 🤖 Afflyt Pro - Integrazione Bot Telegram

Sistema completo per pubblicare deal su Telegram con tracking funnel automatico tramite short link.

---

## 📋 Panoramica

Il bot Telegram di Afflyt Pro:
1. ✅ Trova deal su Amazon (manuale o automatico)
2. ✅ Crea automaticamente short link tracciati
3. ✅ Pubblica su canali Telegram con tracking completo
4. ✅ Monitora clicks, conversioni e metriche
5. ✅ Gestisce multiple campagne per canale

---

## 🚀 Quick Start

### 1. Setup Bot Telegram

#### A. Crea il Bot
1. Apri Telegram e cerca `@BotFather`
2. Invia `/newbot`
3. Scegli nome e username (es: `AfflytDealBot`)
4. Salva il **Bot Token** che ti viene fornito

#### B. Setup Canale
1. Crea un canale pubblico o privato
2. Aggiungi il bot come **Administrator**
3. Dai permessi di **Post Messages**
4. Ottieni il Channel ID:
   - Canale pubblico: `@nome_canale`
   - Canale privato: usa `@userinfobot` per ottenere l'ID

### 2. Configurazione Ambiente

Aggiungi al tuo `.env`:

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHANNEL_ID=@your_channel  # o -100123456789 per canali privati

# App URL (per generare short links)
APP_URL=https://afflyt.pro  # o http://localhost:3000 per dev
NEXT_PUBLIC_APP_URL=https://afflyt.pro
```

### 3. Test della Connessione

```bash
# Da apps/api
npx ts-node test-telegram-bot.ts
```

**Output atteso:**
```
🤖 Testing Telegram Bot Integration

📋 Configuration:
   Bot Token: 123456789:...
   Channel: @your_channel

🔐 Step 1: Validating bot token...
✅ Token valido!
   Bot: @AfflytDealBot
   Name: Afflyt Deal Bot

📡 Step 2: Validating channel connection...
✅ Canale accessibile!
   Can Post: Sì

📨 Step 3: Sending test message...
✅ Test message inviato!

🔥 Step 4: Publishing deal with short link tracking...
✅ Deal pubblicato con successo!
   Short URL: https://afflyt.pro/r/abc123xyz

📊 Il link include tracking per:
   - Source: telegram
   - Campaign: channel_@your_channel
   - Funnel events: page_view, click, redirect, ecc.

🎉 Test completato! Controlla il tuo canale Telegram.
```

---

## 📊 Architettura del Sistema

```
┌─────────────────┐
│  Deal Finder    │  1. Trova deal Amazon
│  (Manuale/Auto) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ TelegramBot     │  2. Riceve deal data
│ Service         │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ /api/links/     │  3. Crea short link
│ shorten         │     - Salva in DB
└────────┬────────┘     - Genera shortCode
         │              - Ritorna shortUrl
         ↓
┌─────────────────┐
│ Format Message  │  4. Compone messaggio
│ with Short URL  │     - Emoji + testo
└────────┬────────┘     - Inline button
         │              - #Ad disclosure
         ↓
┌─────────────────┐
│ Telegram API    │  5. Pubblica su canale
│ (sendPhoto)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ User clicks     │  6. Utente clicca link
│ Short Link      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ /r/[shortCode]  │  7. Interstitial page
│ Redirect Page   │     - Product preview
└────────┬────────┘     - Consent banner
         │              - Funnel tracking
         ↓
┌─────────────────┐
│ Amazon.it       │  8. Redirect finale
│ (with tag)      │
└─────────────────┘
         │
         ↓
┌─────────────────┐
│ Purchase        │  9. Conversione
│ (if any)        │
└─────────────────┘
```

---

## 💻 Uso Programmatico

### Esempio: Pubblica Deal Singolo

```typescript
import { TelegramBotService } from './services/TelegramBotService';

const deal = {
  asin: 'B08N5WRWNW',
  title: 'Apple AirPods Pro (2ª generazione)',
  price: 199.99,
  originalPrice: 299.00,
  discount: 0.33,
  rating: 4.7,
  reviewCount: 45234,
  imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
  affiliateLink: 'https://amazon.it/dp/B08N5WRWNW?tag=afflyt-21',
};

const result = await TelegramBotService.sendDealToChannel(
  '@your_channel',
  process.env.TELEGRAM_BOT_TOKEN!,
  deal
);

console.log('Short URL:', result.shortUrl);
// Output: https://afflyt.pro/r/w5DMbbjJ
```

### Esempio: Pubblica Deal Automatici

```typescript
import { TelegramBotService } from './services/TelegramBotService';
import { AmazonScraper } from './services/AmazonScraper'; // esempio

async function publishDailyDeals() {
  // 1. Trova deal (esempio: top 10 best sellers)
  const deals = await AmazonScraper.findTopDeals({
    category: 'electronics',
    minDiscount: 20,
    minRating: 4.0,
    limit: 10,
  });

  console.log(`Found ${deals.length} deals`);

  // 2. Pubblica ciascun deal con 5 minuti di intervallo
  for (const deal of deals) {
    console.log(`Publishing: ${deal.title}`);

    const result = await TelegramBotService.sendDealToChannel(
      process.env.TELEGRAM_CHANNEL_ID!,
      process.env.TELEGRAM_BOT_TOKEN!,
      {
        asin: deal.asin,
        title: deal.title,
        price: deal.currentPrice,
        originalPrice: deal.originalPrice,
        discount: deal.discount,
        rating: deal.rating,
        reviewCount: deal.reviewCount,
        imageUrl: deal.imageUrl,
        affiliateLink: deal.affiliateUrl,
      }
    );

    if (result.success) {
      console.log(`✅ Published: ${result.shortUrl}`);
    } else {
      console.error(`❌ Failed: ${result.error}`);
    }

    // Wait 5 minutes before next post (evita spam)
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
  }
}

// Run daily at 9:00 AM
import cron from 'node-cron';
cron.schedule('0 9 * * *', publishDailyDeals);
```

---

## 📨 Formato Messaggio Telegram

Il bot invia messaggi nel seguente formato:

```
🔥 HOT DEAL ALERT!

Apple AirPods Pro (2ª generazione) con Custodia MagSafe

💰 Prezzo: €199.99 ~€299.00~
💸 Risparmi: €99.01 (-33%)
⭐ Rating: 4.7/5 (45234 recensioni)

👉 [Vedi su Amazon](https://afflyt.pro/r/w5DMbbjJ)

#Ad | Deal trovato da Afflyt Pro 🤖

[Button: 🛒 Vai su Amazon]
```

**Elementi del messaggio:**
- 🔥 Emoji attira attenzione
- Titolo prodotto
- Prezzo attuale e originale (con strikethrough)
- Calcolo risparmio automatico
- Rating e recensioni Amazon
- **Short link tracciato** (non link diretto Amazon!)
- Disclosure `#Ad` per compliance
- Inline button per conversione facile

---

## 📊 Tracking & Analytics

### Dati Tracciati Automaticamente

Quando un utente clicca sul short link da Telegram, vengono tracciati:

| Dato | Valore | Scopo |
|------|--------|-------|
| **Source** | `telegram` | Identifica provenienza |
| **Campaign** | `channel_@nome_canale` | Distingue tra canali |
| **Link ID** | `cmic5k0dm...` | ID univoco short link |
| **Short Code** | `w5DMbbjJ` | Codice breve del link |
| **ASIN** | `B08N5WRWNW` | Prodotto Amazon |
| **Price** | `199.99` | Prezzo al momento della pubblicazione |
| **Discount** | `33` | Percentuale sconto |

### Funnel Events Tracciati

Per ogni click sul link vengono tracciati fino a 10 eventi:

1. `page_view` - Arrivo su interstitial
2. `page_ready` - Pagina caricata
3. `consent_shown` - Banner consenso mostrato (prima volta)
4. `consent_accepted` - Utente accetta auto-redirect
5. `consent_declined` - Utente preferisce click manuale
6. `auto_redirect_start` - Countdown auto-redirect inizia
7. `manual_click` - Click su bottone "Vai su Amazon"
8. `redirect_complete` - Redirect effettuato con successo
9. `redirect_cancelled` - Utente torna indietro
10. `preference_changed` - Utente cambia impostazioni

### Query Analytics Esempi

**Performance per Canale:**
```typescript
const channelStats = await prisma.shortLink.groupBy({
  by: ['source', 'campaignId'],
  where: {
    source: 'telegram',
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    }
  },
  _count: true,
  _sum: {
    clicks: true,
    conversions: true
  }
});

// Output esempio:
// { source: 'telegram', campaignId: 'channel_@deals', clicks: 523, conversions: 47 }
// { source: 'telegram', campaignId: 'channel_@offerte', clicks: 312, conversions: 28 }
```

**Top Performing Deals:**
```typescript
const topDeals = await prisma.shortLink.findMany({
  where: { source: 'telegram' },
  orderBy: { clicks: 'desc' },
  take: 10,
  select: {
    title: true,
    shortCode: true,
    clicks: true,
    conversions: true,
    asin: true,
    currentPrice: true,
    discount: true,
  }
});

topDeals.forEach(deal => {
  const ctr = (deal.conversions / deal.clicks) * 100;
  console.log(`${deal.title}: ${ctr.toFixed(2)}% CTR`);
});
```

**Funnel Drop-off Analysis:**
```typescript
const funnelAnalysis = await prisma.redirectFunnelEvent.groupBy({
  by: ['eventType'],
  where: {
    link: {
      source: 'telegram',
      campaignId: 'channel_@deals'
    }
  },
  _count: true
});

// Output esempio:
// page_view: 1000
// page_ready: 980 (-2% technical drop)
// manual_click: 950 (-3% bounce)
// redirect_complete: 945 (-0.5% cancel)
// CTR finale: 94.5%
```

---

## 🎨 Personalizzazione Messaggi

### Emoji Variants

```typescript
// Tech deals
🔥 HOT DEAL ALERT!
💻 TECH DEAL!
⚡ FLASH DEAL!
🎮 GAMING DEAL!
📱 SMARTPHONE DEAL!

// Savings focused
💰 SUPER RISPARMIO!
💸 AFFARE DEL GIORNO!
🤑 PREZZO BOMBA!
```

### Template Personalizzati

```typescript
// Short format (per deal minori)
const shortMessage = `
🔥 ${deal.title}

€${deal.price} (-${deal.discount}%) 👉 ${shortUrl}

#Ad
`.trim();

// Detailed format (per deal premium)
const detailedMessage = `
🔥 *SUPER OFFERTA*

📦 ${deal.title}

💰 *Prezzo NOW:* €${deal.price}
~~€${deal.originalPrice}~~

💸 *Risparmi:* €${savings} (-${discountPercent}%)
⭐ *Rating:* ${deal.rating}/5
📊 *Recensioni:* ${deal.reviewCount.toLocaleString()}

${deal.features?.map(f => `✓ ${f}`).join('\n')}

👉 [Acquista Ora](${shortUrl})

⏰ *Offerta limitata!*
#Ad | Via @AfflytDealBot
`.trim();
```

---

## 🔒 Best Practices

### 1. **Rate Limiting**
Non pubblicare troppi deal in poco tempo:
```typescript
// Max 1 deal ogni 5 minuti
const PUBLISH_INTERVAL_MS = 5 * 60 * 1000;

for (const deal of deals) {
  await publishDeal(deal);
  await sleep(PUBLISH_INTERVAL_MS);
}
```

### 2. **Error Handling**
Gestisci sempre gli errori:
```typescript
try {
  const result = await TelegramBotService.sendDealToChannel(...);
  if (!result.success) {
    logger.error('Failed to publish deal', { error: result.error });
    // Retry logic o notifica admin
  }
} catch (error) {
  logger.error('Unexpected error', { error });
}
```

### 3. **Amazon Compliance**
- ✅ Usa sempre `#Ad` o disclaimer simile
- ✅ Non nascondere che è un link affiliato
- ✅ Non modificare prezzi o informazioni Amazon
- ✅ Aggiorna timestamp verifiche prezzi

### 4. **GDPR Compliance**
- ✅ Short link non salvano dati personali
- ✅ Tracking basato su session ID anonimo
- ✅ Consent management nell'interstitial
- ✅ Opzione per disabilitare tracking

---

## 🧪 Testing

### Test Manuale Completo

1. **Pubblica deal di test:**
   ```bash
   npx ts-node test-telegram-bot.ts
   ```

2. **Verifica messaggio su Telegram:**
   - Il messaggio appare nel canale?
   - L'immagine è visibile?
   - Il bottone "Vai su Amazon" funziona?

3. **Testa short link:**
   - Clicca sul link del messaggio
   - Verifica interstitial page
   - Controlla countdown/progress bar
   - Testa consent banner

4. **Verifica tracking:**
   ```bash
   node test-funnel.js
   ```
   Dovresti vedere eventi: `page_view`, `manual_click`, `redirect_complete`

5. **Controlla database:**
   ```bash
   cd apps/api && npx prisma studio
   ```
   - ShortLink: nuovo link creato con `source: "telegram"`
   - RedirectFunnelEvent: eventi registrati

---

## 🐛 Troubleshooting

### Errore: "Unauthorized"
**Causa:** Bot token non valido
**Soluzione:** Verifica `TELEGRAM_BOT_TOKEN` nel `.env`

### Errore: "Chat not found"
**Causa:** Channel ID errato o bot non aggiunto
**Soluzione:**
1. Verifica Channel ID (usa `@userinfobot`)
2. Aggiungi bot al canale come admin

### Errore: "Not enough rights"
**Causa:** Bot non è admin o non ha permessi
**Soluzione:** Promuovi bot ad admin con permesso "Post Messages"

### Link non funzionano
**Causa:** `APP_URL` non configurato correttamente
**Soluzione:** Imposta `APP_URL=https://afflyt.pro` (o localhost per dev)

### Tracking non funziona
**Causa:** Database non raggiungibile o API non funzionante
**Soluzione:**
1. Verifica che `apps/web` sia in esecuzione
2. Testa API: `curl http://localhost:3000/api/links/shorten`
3. Controlla logs per errori

---

## 📚 Risorse

- **Telegram Bot API:** https://core.telegram.org/bots/api
- **Telegraf Docs:** https://telegraf.js.org
- **Amazon Associates:** https://affiliate-program.amazon.it
- **Redirect System:** `/DOCS/REDIRECT_SYSTEM.md`

---

## 🎉 Sistema Completo!

✅ Bot Telegram configurato
✅ Short link con tracking integrato
✅ Interstitial page UX-ottimizzata
✅ Funnel tracking automatico
✅ Analytics per ogni canale
✅ Amazon & GDPR compliant

**Ready to scale! 🚀**
