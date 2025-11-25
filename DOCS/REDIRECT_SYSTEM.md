
# 🔗 Afflyt Pro - Sistema Redirect Amazon

Sistema completo di redirect conforme ad Amazon Associates con tracking funnel avanzato.

---

## 📋 **Panoramica**

Il sistema redirect Afflyt Pro permette di:
1. ✅ Creare short link Amazon compliance
2. ✅ Mostrare interstitial page trasparente
3. ✅ Tracciare funnel completo (10 eventi)
4. ✅ Gestire consenso auto-redirect (GDPR-friendly)
5. ✅ Monitorare conversioni e metriche

---

## 🚀 **Quick Start**

### **1. Creare un Short Link**

```typescript
// Esempio: Da Telegram Bot o Deal Finder

const response = await fetch('/api/links/shorten', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    asin: 'B08N5WRWNW',
    amazonUrl: 'https://amazon.it/dp/B08N5WRWNW?tag=afflyt-21',
    title: 'Apple AirPods Pro (2ª generazione)',
    imageUrl: 'https://...',
    currentPrice: 199.99,
    originalPrice: 299.00,
    source: 'telegram',         // Opzionale: 'telegram', 'webapp', 'email'
    campaignId: 'black-friday', // Opzionale
    userId: 'user_123',         // Opzionale
  }),
});

const { shortUrl, shortCode, linkId } = await response.json();
// shortUrl: "https://afflyt.pro/r/abc123xyz"
```

### **2. Pubblicare su Telegram**

```typescript
const message = `
🔥 Apple AirPods Pro (2ª generazione)

💰 €199.99 (-33% sconto!)
~~€299.00~~

⭐ 4.7/5 (45,234 recensioni)

👉 Vedi su Amazon: ${shortUrl}

#Ad | Prezzo verificato 2 min fa
`;

await telegram.sendMessage(channelId, message);
```

### **3. Flow Utente**

```
User clicks → afflyt.pro/r/abc123xyz
           → Interstitial page (UX ottimizzata)
           → [First time: manual click + consent banner]
           → [Returning + auto: 3s countdown]
           → Redirect to Amazon
           → Funnel tracked ✅
```

---

## 📊 **Funnel Tracking**

### **Eventi Tracciati** (10 total)

| # | Evento | Quando | Metrica Chiave |
|---|--------|--------|----------------|
| 1 | `page_view` | Arrivo su interstitial | **Impressioni** |
| 2 | `page_ready` | Pagina caricata | **Load Time** |
| 3 | `consent_shown` | Banner mostrato (1ª visita) | **First-Time Users** |
| 4 | `consent_accepted` | Utente accetta auto-redirect | **Consent Rate** |
| 5 | `consent_declined` | Utente rifiuta | **Manual Preference %** |
| 6 | `auto_redirect_start` | Countdown inizia | **Auto-Redirect Users** |
| 7 | `manual_click` | Click su "Vai su Amazon" | **Manual Clicks** |
| 8 | `redirect_complete` | Redirect effettuato | **CTR (Click-Through Rate)** |
| 9 | `redirect_cancelled` | Utente torna indietro | **Bounce Rate** |
| 10 | `preference_changed` | Cambio impostazione | **Setting Changes** |

### **Calcolo KPI**

```typescript
// Click-Through Rate (CTR)
CTR = (redirect_complete / page_view) * 100

// Bounce Rate
BounceRate = (redirect_cancelled / page_view) * 100

// Consent Accept Rate
ConsentRate = (consent_accepted / consent_shown) * 100

// Avg Time to Action
AvgTime = AVG(timeOnPage WHERE eventType = 'manual_click')
```

---

## 📈 **Dashboard Analytics (Query di Esempio)**

### **1. Conversions per Short Link**

```typescript
const analytics = await prisma.shortLink.findMany({
  select: {
    shortCode: true,
    asin: true,
    title: true,
    clicks: true,
    conversions: true,
    bounces: true,
    funnelEvents: {
      where: { eventType: 'redirect_complete' },
      select: { timestamp: true },
    },
  },
  orderBy: { clicks: 'desc' },
  take: 10,
});

// Calculate CTR
analytics.forEach(link => {
  const ctr = (link.funnelEvents.length / link.clicks) * 100;
  console.log(`${link.title}: ${ctr.toFixed(2)}% CTR`);
});
```

### **2. Funnel Drop-off Analysis**

```typescript
const funnel = await prisma.redirectFunnelEvent.groupBy({
  by: ['eventType'],
  where: {
    timestamp: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    },
  },
  _count: true,
});

// Expected funnel:
// page_view: 1000
// page_ready: 980 (-2% technical drop)
// manual_click: 950 (-3% bounce)
// redirect_complete: 945 (-0.5% cancel)
```

### **3. Device & Browser Breakdown**

```typescript
const deviceStats = await prisma.redirectFunnelEvent.groupBy({
  by: ['device', 'browser'],
  where: { eventType: 'redirect_complete' },
  _count: true,
});

// Output:
// { device: 'mobile', browser: 'Chrome', _count: 523 }
// { device: 'desktop', browser: 'Firefox', _count: 201 }
```

---

## 🎯 **Success Metrics (Target)**

| Metrica | Target | Come Misurare |
|---------|--------|---------------|
| **CTR** | >95% | `redirect_complete / page_view` |
| **Bounce Rate** | <5% | `redirect_cancelled / page_view` |
| **Time to Action** | <3s | AVG `timeOnPage` per `manual_click` |
| **Consent Rate** | >70% | `consent_accepted / consent_shown` |
| **Load Time (FCP)** | <1s | `timestamp` diff tra `page_view` e `page_ready` |

---

## 🔌 **Integrazione con Telegram Bot**

```typescript
// bot/handlers/publishDeal.ts

import { Deal } from '@/types';

export async function publishDealToTelegram(deal: Deal, channelId: string) {
  // 1. Create short link
  const response = await fetch(`${process.env.APP_URL}/api/links/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      asin: deal.asin,
      amazonUrl: deal.affiliateUrl, // Already has tag
      title: deal.title,
      imageUrl: deal.imageUrl,
      currentPrice: deal.currentPrice,
      originalPrice: deal.originalPrice,
      source: 'telegram',
      campaignId: `channel_${channelId}`,
    }),
  });

  const { shortUrl } = await response.json();

  // 2. Build message
  const message = `
🔥 ${deal.title}

💰 €${deal.currentPrice} ${deal.discount ? `(-${deal.discount}%)` : ''}
${deal.originalPrice ? `~~€${deal.originalPrice}~~` : ''}

⭐ ${deal.rating}/5 (${deal.reviewCount} recensioni)

👉 Vedi su Amazon: ${shortUrl}

#Ad | Prezzo verificato ${Math.floor((Date.now() - deal.lastPriceCheckAt.getTime()) / 60000)}m fa
  `.trim();

  // 3. Send to Telegram
  await bot.telegram.sendMessage(channelId, message, {
    parse_mode: 'Markdown',
  });

  console.log(`✅ Published deal ${deal.asin} with short link ${shortUrl}`);
}
```

---

## 🎨 **UX/UI Specs**

### **Layout Mobile (Primary)**
```
┌─────────────────┐
│ → Amazon        │  <- Sticky header
├─────────────────┤
│                 │
│  [████ Img ████]│  <- Product image 100x100px
│                 │
│  AirPods Pro    │  <- Title (line-clamp-2)
│  €199.99 (-33%) │  <- Price + discount
│                 │
├─────────────────┤
│  ━━━━━━━━━━     │  <- Progress bar (if auto)
├─────────────────┤
│                 │
│  VAI SU AMAZON  │  <- CTA (primary, full-width)
│                 │
│  Torna indietro │  <- Cancel (ghost)
│                 │
│  🔗 amazon.it   │  <- Footer (compliance)
│  🕐 2 min fa    │
│  ℹ️  Affiliato  │
└─────────────────┘
```

### **Consent Banner (Sticky Bottom)**
```
┌─────────────────────────────────────┐
│ ⚡ Vuoi redirect automatico?        │
│ [No, chiedi] [Sì, attiva]          │
└─────────────────────────────────────┘
```

---

## 🔒 **Privacy & GDPR**

### **Dati Salvati**

| Campo | Tipo | Scopo | Retention |
|-------|------|-------|-----------|
| `sessionId` | Random ID | Analytics | 90 giorni |
| `visitorId` | Cookie | Unique user | 365 giorni |
| `device/browser/os` | String | UX optimization | 90 giorni |
| `consent` | LocalStorage | User preference | 365 giorni |

### **Privacy-Compliant**
- ✅ No PII (Personally Identifiable Information)
- ✅ No IP address stored (only hashed)
- ✅ Opt-in consent for auto-redirect
- ✅ User can revoke anytime
- ✅ Data retention limits

---

## 🧪 **Testing**

### **Test il Funnel Completo**

```bash
# 1. Crea un test link
curl -X POST http://localhost:3000/api/links/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "asin": "TEST123",
    "amazonUrl": "https://amazon.it/dp/TEST123?tag=afflyt-21",
    "title": "Test Product",
    "currentPrice": 99.99,
    "originalPrice": 149.99,
    "source": "test"
  }'

# 2. Apri il link
open http://localhost:3000/r/[shortCode]

# 3. Verifica eventi nel database
npx prisma studio
# Vai su RedirectFunnelEvent e verifica gli eventi
```

### **Verifica Metriche**

```typescript
// Check analytics in console
const link = await prisma.shortLink.findUnique({
  where: { shortCode: 'abc123xyz' },
  include: {
    funnelEvents: {
      orderBy: { timestamp: 'asc' },
    },
  },
});

console.log('Total clicks:', link.clicks);
console.log('Bounces:', link.bounces);
console.log('Events:', link.funnelEvents.map(e => e.eventType));
```

---

## 📝 **TODO: Prossimi Step**

- [ ] Dashboard Analytics UI per visualizzare metriche
- [ ] Export CSV report per analisi esterna
- [ ] Integrazione con Google Analytics 4
- [ ] A/B testing countdown duration (2s vs 3s vs 5s)
- [ ] Heatmap tracking (dove cliccano gli utenti)
- [ ] Link expiration auto-cleanup (cron job)

---

## 🎉 **Sistema Completo!**

✅ Database schema con tracking
✅ API per short links
✅ Interstitial page UX-ottimizzata
✅ Funnel tracking (10 eventi)
✅ Consent management GDPR-compliant
✅ Amazon Associates compliance
✅ Mobile-first responsive
✅ Analytics-ready

**Ready to track those conversions!** 🚀
