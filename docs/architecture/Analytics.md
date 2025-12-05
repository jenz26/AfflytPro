# Analytics Page - Report Completo

La pagina Analytics (`/dashboard/analytics`) fornisce metriche dettagliate sulle performance dei link affiliati dell'utente.

## Architettura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ANALYTICS PAGE                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────────┐ │
│  │ PeriodSelector│  │ AnalyticsFilters│  │   ExportDropdown        │ │
│  │ 7d/30d/today  │  │ channel/tag/... │  │   CSV/PDF               │ │
│  └──────────────┘  └────────────────┘  └──────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                        KPI CARDS (4)                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │  Revenue   │ │   Clicks   │ │    CVR     │ │    EPC     │       │
│  │   €xxx     │ │   xxxx     │ │   x.x%     │ │   €x.xx    │       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
├─────────────────────────────────────────────────────────────────────┤
│                           TAB NAVIGATION                             │
│  [Overview] [Audience] [Channels] [Telegram] [Products] [DealScore] │
│  [Time] [AI ✨PRO]                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                           TAB CONTENT                                │
│                    (Varies by selected tab)                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Tabs (Schede)

| Tab | Componente | Descrizione | Restrizioni |
|-----|------------|-------------|-------------|
| **Overview** | `RevenueChart`, `ChannelBreakdown`, `TopLinksTable` | Dashboard principale con grafici e metriche | Tutti |
| **Audience** | `AudienceAnalytics` | Distribuzione geografica, device, browser | Tutti |
| **Channels** | `ChannelDeepDive` | Analisi per canale (Telegram, Email, etc.) | Tutti |
| **Telegram** | `TelegramChannelsAnalytics` | Metriche specifiche canali Telegram | Tutti |
| **Products** | `ProductAnalytics` | Performance per categoria e fascia prezzo | Tutti |
| **Deal Score** | `DealScoreAnalytics` | Correlazione score-conversioni | Tutti |
| **Time** | `TimeHeatmap` | Heatmap orario click | Tutti |
| **AI** | `AIInsights` | Insights AI con raccomandazioni | **Solo PRO/BUSINESS** |

---

## 2. API Endpoints

### Base Path: `/analytics`

| Endpoint | Metodo | Auth | Descrizione |
|----------|--------|------|-------------|
| `/overview` | GET | ✅ | KPI principali (revenue, clicks, CVR, EPC) |
| `/time-series` | GET | ✅ | Dati per grafici (revenue/clicks nel tempo) |
| `/top-links` | GET | ✅ | Top link per performance |
| `/channels` | GET | ✅ | Breakdown per canale |
| `/heatmap` | GET | ✅ | Distribuzione click per ora/giorno |
| `/products` | GET | ✅ | Analisi per categoria/prezzo |
| `/audience` | GET | ✅ | Dati audience (geo, device, browser) |
| `/deal-score` | GET | ✅ | Analisi Deal Score |
| `/insights` | GET | ✅ PRO | AI Insights (richiede piano PRO) |
| `/telegram-channels` | GET | ✅ | Analytics canali Telegram |
| `/telegram-channel/:id` | GET | ✅ | Dettaglio singolo canale Telegram |
| `/filters` | GET | ✅ | Metadata per filtri (channels, tags, categories) |
| `/export` | GET | ✅ | Export CSV dati |
| `/export/summary` | GET | ✅ | Export summary report |
| `/track` | POST | ❌ | Tracking eventi (anonimo ok) |
| `/funnel` | GET | ✅ | Analisi funnel (admin) |
| `/my-progress` | GET | ✅ | Progresso onboarding utente |

---

## 3. Dettaglio Endpoints

### 3.1 GET `/analytics/overview`
**Ritorna**: KPI overview con trend

**Query Params**:
- `period`: `7d` | `30d` | `today` (default: `7d`)
- `channelId`: Filtra per canale
- `amazonTag`: Filtra per tag Amazon
- `category`: Filtra per categoria prodotto
- `dealScoreMin`: Score minimo
- `dealScoreMax`: Score massimo

**Response**:
```typescript
{
  revenue: { current: number, change: number, trend: 'up' | 'down' | 'stable' },
  clicks: { current: number, change: number, trend: 'up' | 'down' | 'stable' },
  cvr: { current: number, change: number, benchmark: 4.2, trend: 'up' | 'down' | 'stable' },
  epc: { current: number, change: number, industry: 0.32, trend: 'up' | 'down' | 'stable' },
  conversions: { current: number, change: number, trend: 'up' | 'down' | 'stable' },
  period: number
}
```

---

### 3.2 GET `/analytics/time-series`
**Ritorna**: Dati per grafici temporali

**Query Params**: Stessi di overview + `granularity` (day/hour)

**Response**:
```typescript
{
  data: Array<{
    date: string,      // ISO date
    clicks: number,
    revenue: number,
    conversions: number
  }>,
  period: number
}
```

---

### 3.3 GET `/analytics/top-links`
**Ritorna**: Top performing links

**Query Params**:
- `period`, `channelId`, etc. (come overview)
- `limit`: Numero di link (default: 5)
- `sortBy`: `clicks` | `revenue` | `cvr`

**Response**:
```typescript
{
  links: Array<{
    id: string,
    shortCode: string,
    shortUrl: string,
    product: { title: string, imageUrl?: string, asin: string },
    metrics: { clicks: number, conversions: number, revenue: number, cvr: number, epc: number }
  }>,
  total: number,
  period: number
}
```

---

### 3.4 GET `/analytics/channels`
**Ritorna**: Performance per canale

**Response**:
```typescript
{
  channels: Array<{
    channel: string,
    clicks: number,
    conversions: number,
    revenue: number,
    cvr: number,
    epc: number,
    clicksPercent: number,
    revenuePercent: number
  }>,
  totals: { clicks: number, revenue: number },
  period: number
}
```

---

### 3.5 GET `/analytics/heatmap`
**Ritorna**: Distribuzione click per giorno/ora

**Response**:
```typescript
{
  heatmap: Array<{
    day: string,      // 'Mon', 'Tue', etc.
    dayIndex: number, // 0-6
    hour: number,     // 0-23
    value: number,    // clicks
    intensity: number // 0-1 normalized
  }>,
  bestTime: { day: string, hour: number, clicks: number } | null,
  totalClicks: number,
  period: number
}
```

---

### 3.6 GET `/analytics/products`
**Ritorna**: Analisi per categoria e fascia prezzo

**Response**:
```typescript
{
  byCategory: Array<{
    category: string,
    clicks: number,
    conversions: number,
    revenue: number,
    cvr: number,
    avgPrice: number
  }>,
  byPriceRange: Array<{
    range: string,   // '0-25€', '25-50€', etc.
    clicks: number,
    conversions: number,
    revenue: number,
    cvr: number
  }>,
  topPerformers: Array<{
    productId: string,
    title: string,
    clicks: number,
    conversions: number,
    revenue: number,
    cvr: number,
    avgPrice: number
  }>,
  totals: {
    totalProducts: number,
    totalClicks: number,
    totalConversions: number,
    totalRevenue: number
  }
}
```

---

### 3.7 GET `/analytics/audience`
**Ritorna**: Dati demografici e tecnici

**Response**:
```typescript
{
  countries: Array<{ country: string, code: string, clicks: number, percentage: number }>,
  devices: Array<{ device: string, clicks: number, percentage: number, icon: string }>,
  browsers: Array<{ browser: string, clicks: number, percentage: number }>,
  operatingSystems: Array<{ os: string, clicks: number, percentage: number }>,
  languages: Array<{ language: string, clicks: number, percentage: number }>,
  referrers: Array<{ source: string, clicks: number, percentage: number }>,
  newVsReturning: { new: number, returning: number, newPercentage: number },
  totals: { totalClicks: number, uniqueVisitors: number, countries: number },
  period: number
}
```

---

### 3.8 GET `/analytics/deal-score`
**Ritorna**: Correlazione Deal Score e performance

**Response**:
```typescript
{
  distribution: Array<{ range: string, count: number, percentage: number }>,
  scoreConversionCorrelation: Array<{
    scoreRange: string,
    avgClicks: number,
    avgConversions: number,
    avgRevenue: number,
    cvr: number,
    totalLinks: number
  }>,
  topScoringDeals: Array<{
    productId: string,
    title: string,
    asin: string,
    score: number,
    discount: number,
    imageUrl?: string,
    clicks: number,
    conversions: number,
    revenue: number
  }>,
  scoreTrends: Array<{ date: string, avgScore: number, maxScore: number, dealsFound: number }>,
  summary: {
    avgScore: number,
    totalDeals: number,
    dealsAbove80: number,
    dealsAbove90: number,
    bestPerformingScoreRange: string
  },
  period: number
}
```

---

### 3.9 GET `/analytics/insights` (PRO)
**Ritorna**: AI Insights personalizzati

**Query Params**:
- `period`: `7d` | `30d`
- `locale`: `en` | `it`

**Response**:
```typescript
{
  insights: Array<{
    type: 'success' | 'warning' | 'info' | 'opportunity',
    category: string,
    title: string,
    description: string,
    priority: 'high' | 'medium' | 'low',
    actionable: boolean,
    action?: { label: string, href: string },
    metric?: { value: number, unit: string, trend?: 'up' | 'down' }
  }>,
  score: number,      // Health score 0-100
  summary: {
    totalLinks: number,
    activeLinks: number,
    totalClicks: number,
    totalConversions: number,
    totalRevenue: number,
    cvr: number
  },
  period: number
}
```

**Restrizione**: Ritorna 403 se `user.plan === 'FREE'`

---

### 3.10 GET `/analytics/telegram-channels`
**Ritorna**: Analytics specifiche per canali Telegram

**Response**:
```typescript
{
  channels: Array<{
    channelId: string,
    channelName: string,
    clicks: number,
    uniqueClicks: number,
    conversions: number,
    revenue: number,
    cvr: number,
    epc: number,
    uniqueMessages: number,      // Post unici
    linksPromoted: number,       // Link diversi promossi
    avgClicksPerMessage: number, // Media click per post
    avgTimeToClickMinutes: number | null, // Tempo medio click
    bestPostingHour: number,     // 0-23
    clicksByHour: number[]       // [24 valori]
  }>,
  totals: { clicks: number, uniqueClicks: number, conversions: number, revenue: number },
  period: number
}
```

---

### 3.11 GET `/analytics/filters`
**Ritorna**: Metadata per i filtri UI

**Response**:
```typescript
{
  channels: Array<{ id: string, name: string, platform: string }>,
  tags: string[],              // Amazon tags usati
  categories: string[],        // Categorie prodotto
  dealScoreRange: { min: number, max: number, avg: number }
}
```

---

### 3.12 GET `/analytics/export`
**Ritorna**: CSV con dati analitici

**Query Params**:
- `period`: Periodo dati
- `type`: Tipo export

**Response**: File CSV con header `Content-Disposition: attachment`

---

## 4. Componenti UI

### 4.1 KPI Cards
```
┌──────────────────┐
│  [Icon]  €123.45 │
│  Revenue         │
│  ↑ +15.2%        │
│  vs periodo prec │
└──────────────────┘
```

### 4.2 Revenue Chart (Recharts)
- Grafico area con revenue e clicks
- Tooltip interattivo
- Periodo configurabile

### 4.3 Channel Breakdown (Pie Chart)
- Distribuzione click per canale
- Percentuali e revenue

### 4.4 Time Heatmap
- Griglia 7x24 (giorni x ore)
- Intensità colore = click
- Best time evidenziato

### 4.5 AI Insights Card
```
┌────────────────────────────────────────┐
│  🧠 Health Score: 78/100               │
│  ━━━━━━━━━━━━━━━━━━━━━ [===========]   │
├────────────────────────────────────────┤
│  ⚠️ High Priority                      │
│  Your CVR dropped 15% this week        │
│  [→ View Recommendations]              │
├────────────────────────────────────────┤
│  💡 Opportunity                        │
│  Tech products perform 2x better       │
│  [→ Create Tech Automation]            │
└────────────────────────────────────────┘
```

---

## 5. Filtri Globali

I filtri si applicano a tutti gli endpoint tramite query params:

| Filtro | Descrizione | Applicato a |
|--------|-------------|-------------|
| `channelId` | ID canale specifico | Tutti |
| `amazonTag` | Tag affiliato Amazon | Tutti |
| `category` | Categoria prodotto | Tutti |
| `dealScoreMin` | Score minimo | Tutti |
| `dealScoreMax` | Score massimo | Tutti |

---

## 6. Feature Gating

| Feature | FREE | PRO | BUSINESS |
|---------|------|-----|----------|
| Overview Tab | ✅ | ✅ | ✅ |
| Audience Tab | ✅ | ✅ | ✅ |
| Channels Tab | ✅ | ✅ | ✅ |
| Telegram Tab | ✅ | ✅ | ✅ |
| Products Tab | ✅ | ✅ | ✅ |
| Deal Score Tab | ✅ | ✅ | ✅ |
| Time Tab | ✅ | ✅ | ✅ |
| **AI Insights Tab** | 🔒 | ✅ | ✅ |
| Export CSV | ✅ | ✅ | ✅ |
| Export PDF | 🔒 | ✅ | ✅ |

---

## 7. Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Click     │───▶│  Prisma DB  │◀───│ Conversion  │
│   Records   │    │             │    │   Records   │
└─────────────┘    └──────┬──────┘    └─────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Analytics API     │
              │   (aggregation)     │
              └──────────┬──────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  /overview    │ │ /time-series  │ │  /insights    │
│  KPIs + trend │ │ chart data    │ │  AI analysis  │
└───────────────┘ └───────────────┘ └───────────────┘
```

---

## 8. Sicurezza

- **Autenticazione**: Tutti gli endpoint (eccetto `/track`) richiedono JWT
- **Autorizzazione**: I dati sono filtrati per `userId` del token
- **Rate Limiting**: Applicato a livello server
- **Tier Check**: `/insights` verifica `user.plan !== 'FREE'`

---

## 9. Performance

- **Caching**: Nessun caching lato API (dati real-time)
- **Pagination**: Non implementata (dati aggregati)
- **Parallel Fetching**: Frontend carica 6 endpoint in parallelo
- **Lazy Loading**: Tab non-overview caricati on-demand

---

## 10. Localizzazione

- Supporto `en` e `it` per:
  - Labels UI (`useTranslations('analytics')`)
  - AI Insights messages (param `locale`)
  - Date formatting

---

## 11. File Structure

```
apps/web/
├── app/[locale]/dashboard/analytics/
│   └── page.tsx                    # Main page
└── components/analytics/
    ├── index.ts                    # Barrel export
    ├── AnalyticsKPICard.tsx
    ├── RevenueChart.tsx
    ├── TopLinksTable.tsx
    ├── ChannelBreakdown.tsx
    ├── ChannelDeepDive.tsx
    ├── TimeHeatmap.tsx
    ├── ProductAnalytics.tsx
    ├── AudienceAnalytics.tsx
    ├── DealScoreAnalytics.tsx
    ├── TelegramChannelsAnalytics.tsx
    ├── AIInsights.tsx
    ├── PeriodSelector.tsx
    ├── AnalyticsFilters.tsx
    └── ExportDropdown.tsx

apps/api/src/routes/
└── analytics.ts                    # All API endpoints (2300+ lines)
```
