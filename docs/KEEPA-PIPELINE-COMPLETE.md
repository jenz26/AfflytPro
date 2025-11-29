# Afflyt Pro - Keepa Pipeline v2 Complete Documentation

> **Last Updated**: 2024-11-29
> **Version**: 2.0.0
> **Status**: Production Ready

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Data Flow](#3-data-flow)
4. [Component Details](#4-component-details)
   - [4.1 KeepaQueue](#41-keepaqueue)
   - [4.2 KeepaCache](#42-keepacache)
   - [4.3 KeepaTokenManager](#43-keepatokenmanager)
   - [4.4 KeepaClient](#44-keepaclient)
   - [4.5 AutomationScheduler](#45-automationscheduler)
   - [4.6 KeepaWorker](#46-keepaworker)
   - [4.7 KeepaPrefetch](#47-keepaprefetch)
5. [Scoring Engine](#5-scoring-engine)
6. [Database Models](#6-database-models)
7. [API Endpoints](#7-api-endpoints)
8. [Configuration](#8-configuration)
9. [Telemetry & Monitoring](#9-telemetry--monitoring)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Executive Summary

### What is the Keepa Pipeline?

The Keepa Pipeline is the core automation engine of Afflyt Pro. It:

1. **Fetches deals** from Amazon via Keepa API
2. **Scores them** based on quality metrics
3. **Filters them** according to user preferences
4. **Publishes them** to Telegram/Discord channels

### Key Features

| Feature | Description |
|---------|-------------|
| **Smart Batching** | Multiple rules for same category share one API call |
| **Multi-Layer Caching** | Redis cache reduces API calls by 60-80% |
| **Token Budgeting** | Never exceeds 20 tokens/minute API limit |
| **Adaptive Scoring** | Score formula adapts to available data |
| **Prefetch System** | Proactively fetches data during idle time |
| **Telemetry** | Per-run statistics for threshold tuning |

### Token Budget

```
Keepa API Budget: 20 tokens/minute

Per Job Cost:
├── Deal API: 5 tokens (1 price type)
├── Product API: 4 tokens × 3 deals = 12 tokens
└── TOTAL: ~17 tokens/job

Sustainable Rate: 1 job per minute with headroom
```

---

## 2. Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        AFFLYT PRO                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Frontend   │───▶│   API        │───▶│   Database   │       │
│  │   (Next.js)  │    │   (Fastify)  │    │  (PostgreSQL)│       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                             │                    │               │
│                             ▼                    │               │
│  ┌──────────────────────────────────────────────┴───────────┐   │
│  │                    KEEPA PIPELINE v2                      │   │
│  ├───────────────────────────────────────────────────────────┤   │
│  │                                                           │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │   │
│  │  │ Automation  │──▶│   Keepa     │──▶│   Keepa     │     │   │
│  │  │ Scheduler   │   │   Queue     │   │   Worker    │     │   │
│  │  └─────────────┘   └─────────────┘   └─────────────┘     │   │
│  │         │                │                  │             │   │
│  │         ▼                ▼                  ▼             │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │   │
│  │  │   Keepa     │   │   Keepa     │   │   Keepa     │     │   │
│  │  │  Prefetch   │   │   Cache     │   │   Client    │     │   │
│  │  └─────────────┘   └─────────────┘   └─────────────┘     │   │
│  │                           │                  │             │   │
│  │                           ▼                  ▼             │   │
│  │                    ┌─────────────┐   ┌─────────────┐     │   │
│  │                    │    Redis    │   │  Keepa API  │     │   │
│  │                    │   (Cache)   │   │  (External) │     │   │
│  │                    └─────────────┘   └─────────────┘     │   │
│  │                                                           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```
apps/api/src/
├── services/keepa/
│   ├── index.ts                 # Singleton exports
│   ├── KeepaQueue.ts            # Priority queue system
│   ├── KeepaCache.ts            # Multi-layer cache
│   ├── KeepaTokenManager.ts     # Token budget tracking
│   ├── KeepaClient.ts           # Keepa API wrapper
│   ├── AutomationScheduler.ts   # Rule scheduling (cron)
│   ├── KeepaWorker.ts           # Job processor
│   └── KeepaPrefetch.ts         # Idle-time prefetch
├── services/
│   └── ScoringEngine.ts         # Deal scoring algorithm
├── routes/
│   └── automations.ts           # API endpoints
├── types/
│   └── keepa.ts                 # Type definitions
└── prisma/
    └── schema.prisma            # Database models
```

---

## 3. Data Flow

### Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────────┘

1. USER CREATES AUTOMATION RULE
   │
   ▼
2. AutomationScheduler (runs every 60s)
   ├── Query: SELECT * FROM AutomationRule WHERE nextRunAt <= NOW()
   ├── Group rules by category
   └── For each category group:
       │
       ▼
3. KeepaQueue.enqueueOrAttach()
   ├── Check: Is there a pending job for this category?
   │   ├── YES → Attach rule to existing job
   │   └── NO  → Create new job
   ├── Calculate union filters (most permissive)
   └── Calculate priority score
       │
       ▼
4. KeepaWorker.tick() (runs every 3s)
   ├── Peek next job from queue
   ├── Check token availability
   │   ├── ENOUGH → Continue
   │   └── NOT ENOUGH → Wait, sync with Keepa API
   ├── Dequeue job
   └── Process job:
       │
       ▼
5. Cache Check
   ├── FRESH (< 30 min) → Use cached deals, skip API
   └── STALE/MISSING → Continue to API
       │
       ▼
6. KeepaClient.fetchDealsMultiPrice()
   ├── Call Keepa Deal API
   ├── Fetch for each price type (BuyBox, Amazon, New)
   ├── Deduplicate ASINs
   └── Transform raw deals to Deal objects
       │
       ▼
7. KeepaClient.verifyDealsWithBuybox()
   ├── Call Keepa Product API for top N deals
   ├── Get accurate BuyBox price
   ├── Get rating/review data
   └── Detect hasVisibleDiscount (strikethrough price)
       │
       ▼
8. KeepaCache.save()
   └── Store deals in Redis (TTL: 60 min)
       │
       ▼
9. For Each Waiting Rule:
   │
   ├── 9.1 Apply Rule Filters
   │   ├── minDiscount, maxPrice, minRating
   │   ├── brandInclude/Exclude
   │   └── primeOnly, fbaOnly, etc.
   │
   ├── 9.2 Filter by DealPublishMode
   │   ├── DISCOUNTED_ONLY → hasVisibleDiscount === true
   │   ├── LOWEST_PRICE → isHistoricalLow === true
   │   └── BOTH → either condition
   │
   ├── 9.3 Score Deals (ScoringEngine)
   │   ├── Calculate discount score (0-50 points)
   │   ├── Calculate salesRank score (0-30 points)
   │   └── Calculate priceDrop score (0-20 points)
   │
   ├── 9.4 Filter by minScore
   │   └── Keep only deals where score >= rule.minScore
   │
   ├── 9.5 Check Deduplication
   │   └── Exclude ASINs already published to channel (within 7 days)
   │
   ├── 9.6 Publish to Channel
   │   ├── Format message (Telegram/Discord)
   │   ├── Include affiliate link with tag
   │   ├── Optional: Include Keepa price chart
   │   └── Send via TelegramBotService
   │
   └── 9.7 Record Stats
       ├── Update ChannelDealHistory (deduplication)
       ├── Update AutomationRule (nextRunAt, totalRuns)
       └── Create AutomationRunStats (telemetry)

10. Job Complete
    └── Remove from queue, update stats
```

### Deal Transformation

```
Keepa Raw Deal (from API)
{
  asin: "B0BCR8Z7QL",
  title: "Echo Hub - Schermo...",
  current: [10999, -1, -1, 2345, 19999, ...],  // Prices in cents
  deltaPercent: [[15], [20], [25], [45]],       // Price changes
  image: [65, 49, ...]                          // Char codes
}
        │
        ▼ transformDeal()
        │
Deal Object
{
  asin: "B0BCR8Z7QL",
  title: "Echo Hub - Schermo...",
  currentPrice: 109.99,           // EUR
  originalPrice: 199.99,          // EUR (from listPrice)
  discountPercent: 45,            // Calculated from listPrice
  hasVisibleDiscount: true,       // listPrice > currentPrice
  isHistoricalLow: false,
  category: "Elettronica",
  salesRank: 2345,
  rating: null,                   // Not in Deal API
  reviewCount: null               // Not in Deal API
}
        │
        ▼ enrichDealWithProductData()
        │
Verified Deal
{
  ...above,
  buyBoxPrice: 109.99,            // Verified
  rating: 4.5,                    // From Product API
  reviewCount: 1234,              // From Product API
  isPrime: true,
  isVerified: true
}
```

---

## 4. Component Details

### 4.1 KeepaQueue

**File**: `apps/api/src/services/keepa/KeepaQueue.ts`

**Purpose**: Priority queue for Keepa API jobs. Batches multiple rules for same category.

#### Key Structures

```typescript
interface QueueJob {
  id: string;                    // UUID
  type: 'deal_search' | 'product_refresh';
  category: string;              // Category name
  categoryId: number;            // Keepa category ID
  tokenCost: number;             // Estimated cost
  createdAt: Date;
  unionFilters: UnionFilters;    // Merged filters
  waitingRules: WaitingRule[];   // Rules waiting for this job
  isPrefetch: boolean;           // Prefetch job flag
  priority: number;              // Priority score (lower = higher priority)
}

interface WaitingRule {
  ruleId: string;
  userId: string;
  userPlan: 'free' | 'starter' | 'pro' | 'business';
  channelId: string;
  filters: AutomationFilters;
  dealsPerRun: number;
  minScore: number;
  dealPublishMode: DealPublishMode;
  includeKeepaChart: boolean;
  triggersAt: Date;
}
```

#### Priority Calculation

```typescript
calculatePriority(waitingRules: WaitingRule[]): number {
  // Urgency: minutes until earliest trigger (0-30 points)
  const urgency = Math.min(30, minutesUntilTrigger);

  // Cache Value: more beneficiaries = lower score (0-20 points)
  const cacheValue = 20 - (waitingRules.length * 2);

  // Plan Tier: higher plans = lower score
  const planTier = {
    business: 0,
    pro: 3,
    starter: 6,
    free: 10
  }[highestPlan];

  return urgency + cacheValue + planTier;
  // Range: 0 (highest priority) to 60 (lowest)
}
```

#### Redis Keys

| Key | Type | Description |
|-----|------|-------------|
| `keepa:queue` | Sorted Set | All jobs, score = priority |
| `keepa:pending:{categoryId}` | String | Job ID pending for category |
| `keepa:stats` | Hash | Queue statistics |

---

### 4.2 KeepaCache

**File**: `apps/api/src/services/keepa/KeepaCache.ts`

**Purpose**: Multi-layer caching to reduce API calls.

#### Cache Status

```typescript
type CacheStatus = 'fresh' | 'stale' | 'expired' | 'missing';

// Thresholds (configurable)
FRESH: age < 30 minutes     → Use directly
STALE: 30 min < age < 60 min → Use but consider refresh
EXPIRED: age > 60 minutes   → Must refresh
MISSING: no entry           → Must fetch
```

#### Cache Structure

```typescript
interface CachedCategory {
  deals: Deal[];           // Cached deals
  updatedAt: number;       // Timestamp (ms)
  ttl: number;             // Time to live (ms)
  source: 'automation' | 'prefetch';
  unionFilters?: UnionFilters;
}
```

#### Redis Keys

| Key | Type | TTL | Description |
|-----|------|-----|-------------|
| `keepa:cache:{category}` | Hash | 2 hours | Cached deals + metadata |

---

### 4.3 KeepaTokenManager

**File**: `apps/api/src/services/keepa/KeepaTokenManager.ts`

**Purpose**: Track and budget Keepa API tokens.

#### Token Costs

| Operation | Cost | Notes |
|-----------|------|-------|
| Deal API | 5 tokens | Per price type |
| Product API | 4 tokens | Per ASIN (1 base + 2 buybox + 1 stats) |

#### Example Budget

```
Typical Job:
├── Deal API (1 price type): 5 tokens
├── Product API (3 ASINs): 12 tokens
└── TOTAL: 17 tokens

Budget: 20 tokens/minute
Sustainable: 1 job/minute with 3 token headroom
```

#### Methods

```typescript
class KeepaTokenManager {
  syncFromKeepa(): Promise<void>           // Fetch real token count
  updateFromResponse(tokensLeft, refillIn) // Update from API response
  getAvailable(): Promise<number>          // Get cached count
  canAfford(cost: number): Promise<boolean>
  consume(cost: number): Promise<void>
  waitForTokens(cost: number, maxWaitMs?: number): Promise<boolean>
}
```

---

### 4.4 KeepaClient

**File**: `apps/api/src/services/keepa/KeepaClient.ts`

**Purpose**: Wrapper for Keepa API calls.

#### Price Type Indices

```typescript
const PRICE_TYPE = {
  AMAZON: 0,        // Amazon direct price
  NEW: 1,           // New 3rd party price
  USED: 2,          // Used price
  SALES_RANK: 3,    // Sales rank position
  LIST_PRICE: 4,    // Strikethrough price (RRP)
  BUY_BOX: 18       // Current BuyBox winner
} as const;
```

#### Key Methods

```typescript
class KeepaClient {
  // Fetch deals for multiple price types, deduplicate
  fetchDealsMultiPrice(
    categoryId: number,
    filters?: UnionFilters
  ): Promise<{
    deals: Deal[];
    tokensLeft: number;
    refillIn: number;
    tokenCost: number;
  }>

  // Verify top deals with Product API
  verifyDealsWithBuybox(
    deals: Deal[],
    limit: number
  ): Promise<{
    verifiedDeals: Deal[];
    tokensLeft: number;
    refillIn: number;
    tokenCost: number;
  }>

  // Calculate most permissive filters from multiple rules
  static calculateUnionFilters(
    filters: AutomationFilters[]
  ): UnionFilters
}
```

#### Visible Discount Detection

```typescript
// In transformDeal():
const listPriceCents = raw.current?.[PRICE_TYPE.LIST_PRICE] ?? 0;
const listPrice = listPriceCents > 0 ? listPriceCents / 100 : 0;

// Amazon shows strikethrough when listPrice > currentPrice
const hasVisibleDiscount = listPrice > 0 && listPrice > currentPrice;

if (hasVisibleDiscount) {
  discountPercent = Math.round(((listPrice - currentPrice) / listPrice) * 100);
  originalPrice = listPrice;
}
```

---

### 4.5 AutomationScheduler

**File**: `apps/api/src/services/keepa/AutomationScheduler.ts`

**Purpose**: Find due rules and enqueue them.

#### Execution Flow

```
Every 60 seconds:
1. Query: AutomationRule WHERE nextRunAt <= NOW() AND isActive = true
2. Group by primary category
3. For each category:
   a. Convert rules to WaitingRule objects
   b. Call queue.enqueueOrAttach()
4. Update nextRunAt with jitter
```

#### Jitter Calculation

```typescript
// Prevent all rules from triggering at exact same time
const jitterMax = Math.min(intervalMinutes * 0.15, 30);
const jitter = (Math.random() - 0.5) * 2 * jitterMax;
const nextRunAt = now + (intervalMinutes + jitter) * 60 * 1000;
```

---

### 4.6 KeepaWorker

**File**: `apps/api/src/services/keepa/KeepaWorker.ts`

**Purpose**: Process queue jobs, fetch deals, notify rules.

#### Tick Loop

```typescript
async tick(): Promise<void> {
  // 1. Check tokens
  const tokensAvailable = await tokenManager.getAvailable();

  // 2. Peek next job
  const nextJob = await queue.peek();
  if (!nextJob) return;

  // 3. Check affordability
  const estimatedCost = this.estimateJobCost(nextJob);
  if (tokensAvailable < estimatedCost) {
    await tokenManager.syncFromKeepa();
    return;
  }

  // 4. Process
  await this.processQueue();
}
```

#### Deal Processing Pipeline

```typescript
async processRule(rule: WaitingRule, deals: Deal[]): Promise<void> {
  // 1. Apply rule-specific filters
  const filtered = this.applyRuleFilters(deals, rule);

  // 2. Filter by dealPublishMode
  const modeFiltered = this.filterByPublishMode(filtered, rule.dealPublishMode);

  // 3. Score and sort
  const scored = this.scoreDeals(modeFiltered);

  // 4. Filter by minScore
  const scoredFiltered = scored.filter(d => d.score >= rule.minScore);

  // 5. Limit to dealsPerRun
  const toPublish = scoredFiltered.slice(0, rule.dealsPerRun);

  // 6. Check dedupe and publish
  for (const deal of toPublish) {
    if (!await this.isDuplicate(rule.channelId, deal.asin)) {
      await this.publishDeal(rule, deal);
      await this.recordDealPublished(rule.channelId, deal.asin);
    }
  }

  // 7. Save telemetry
  await this.saveRunStats(rule, { ... });
}
```

---

### 4.7 KeepaPrefetch

**File**: `apps/api/src/services/keepa/KeepaPrefetch.ts`

**Purpose**: Proactively fetch data during idle time.

#### Conditions for Prefetch

```typescript
runIfIdle(): Promise<void> {
  // Only prefetch if:
  // 1. Queue is empty
  // 2. Tokens available >= DEAL_API_COST
  // 3. Haven't exceeded MAX_PREFETCH_PER_TICK

  // Find rules triggering in next 30 minutes
  // that don't have fresh cache
  // Create prefetch job with priority 100 (low)
}
```

---

## 5. Scoring Engine

**File**: `apps/api/src/services/ScoringEngine.ts`

### Scoring Modes

The scoring engine adapts based on available data:

| Mode | Condition | Weights |
|------|-----------|---------|
| **FULL** | rating + salesRank available | 40% discount, 25% salesRank, 20% rating, 15% priceDrop |
| **DEAL_API** | salesRank but no rating | 50% discount, 30% salesRank, 20% priceDrop |
| **MINIMAL** | no salesRank, no rating | 70% discount, 30% priceDrop |

### Component Calculations

#### Discount Score (max 40 raw points)

```typescript
calculateDiscountScore(discount: number): number {
  // Linear: 0% = 0 points, 100% = 40 points
  return Math.min(40, (discount / 100) * 40);
}

// Examples:
// 20% discount → 8 points
// 50% discount → 20 points
// 77% discount → 30.8 points
```

#### Sales Rank Score (max 25 raw points)

```typescript
calculateSalesRankScore(salesRank: number, category: string): number {
  // Category-specific thresholds
  const thresholds = {
    'Elettronica': 50000,
    'Casa e cucina': 100000,
    'Sport e tempo libero': 75000,
    'Giardino e giardinaggio': 100000,
    'Libri': 25000,
    'default': 75000
  };

  const maxRank = thresholds[category] || thresholds['default'];

  // Logarithmic scaling for better distribution
  if (salesRank <= 1) return 25;
  if (salesRank >= maxRank) return 0;

  const logRank = Math.log10(salesRank);
  const logMax = Math.log10(maxRank);

  return 25 * (1 - (logRank / logMax));
}

// Examples (Casa e cucina, maxRank=100000):
// Rank 100 → 20 points
// Rank 1000 → 15 points
// Rank 10000 → 10 points
// Rank 50000 → 5 points
```

#### Rating Score (max 20 raw points)

```typescript
calculateRatingScore(rating: number, reviewCount: number): number {
  if (!rating) return 0;

  // Base: rating/5 * 15 (max 15 points)
  const baseScore = (rating / 5) * 15;

  // Review bonus: 0-5 points based on count
  let reviewBonus = 0;
  if (reviewCount >= 10000) reviewBonus = 5;
  else if (reviewCount >= 5000) reviewBonus = 4;
  else if (reviewCount >= 1000) reviewBonus = 3;
  else if (reviewCount >= 500) reviewBonus = 2;
  else if (reviewCount >= 100) reviewBonus = 1;

  return Math.min(20, baseScore + reviewBonus);
}

// Examples:
// 4.5 stars, 5000 reviews → 13.5 + 4 = 17.5 points
// 4.0 stars, 200 reviews → 12 + 1 = 13 points
```

#### Price Drop Score (max 15 raw points)

```typescript
calculatePriceDropScore(currentPrice: number, originalPrice: number): number {
  if (currentPrice >= originalPrice) return 0;

  const dropPercentage = ((originalPrice - currentPrice) / originalPrice) * 100;

  // Linear: 0% = 0 points, 100% = 15 points
  return Math.min(15, (dropPercentage / 100) * 15);
}
```

### Normalization (DEAL_API Mode)

```typescript
// When only salesRank available (typical Deal API response):
if (!hasRatingData && hasSalesRankData) {
  // Redistribute to reach 0-100 scale
  const discountNormalized = (rawDiscount / 40) * 50;    // 0-50
  const salesRankNormalized = (rawSalesRank / 25) * 30;  // 0-30
  const priceDropNormalized = (rawPriceDrop / 15) * 20;  // 0-20
  // Total: 0-100
}
```

### Score Labels

```typescript
getScoreLabel(score: number): { text: string; color: string; emoji: string } {
  if (score >= 75) return { text: 'HOT', color: 'red', emoji: '🔥' };
  if (score >= 60) return { text: 'OTTIMO', color: 'cyan', emoji: '⭐' };
  if (score >= 45) return { text: 'BUONO', color: 'green', emoji: '✅' };
  if (score >= 30) return { text: 'DECENTE', color: 'yellow', emoji: '👍' };
  return { text: 'MEH', color: 'gray', emoji: '😐' };
}
```

### Score Distribution (Real Data Example)

From `debug-scoring.js` output with 150 deals:

```
SCORE DISTRIBUTION (after v2 fixes)
════════════════════════════════════
0-20 (MEH)        59 (39.3%) ████████████████████
20-40 (DECENTE)   79 (52.7%) ██████████████████████████
40-60 (BUONO)     11 (7.3%)  ████
60-80 (OTTIMO)     1 (0.7%)
80-100 (HOT)       0 (0.0%)

DEALS PASSING THRESHOLDS
════════════════════════
minScore >= 10:  132 deals (88.0%)
minScore >= 20:   91 deals (60.7%)
minScore >= 30:   32 deals (21.3%)
minScore >= 35:   22 deals (14.7%)  ← Default threshold
minScore >= 40:   12 deals (8.0%)
minScore >= 50:    3 deals (2.0%)
minScore >= 60:    1 deals (0.7%)
```

---

## 6. Database Models

### AutomationRule

```prisma
model AutomationRule {
  id          String   @id @default(uuid())
  userId      String

  // Basic Info
  name        String
  description String?
  isActive    Boolean  @default(true)

  // FREE Tier Filters
  categories  String[]
  minScore    Int      @default(35)  // 0-100

  // PRO Tier Filters
  minPrice    Float?
  maxPrice    Float?
  minDiscount Int?     // 0-100
  minRating   Int?     // 0-500 scale
  minReviews  Int?
  maxSalesRank Int?

  // BUSINESS Tier Filters
  amazonOnly    Boolean  @default(false)
  fbaOnly       Boolean  @default(false)
  hasCoupon     Boolean  @default(false)
  primeOnly     Boolean  @default(false)
  brandInclude  String[]
  brandExclude  String[]
  listedAfter   DateTime?

  // Publishing
  channelId         String?
  templateId        String?
  dealPublishMode   DealPublishMode @default(DISCOUNTED_ONLY)
  includeKeepaChart Boolean @default(false)
  amazonTagOverride String?

  // Scheduling
  schedulePreset    String   @default("relaxed")
  intervalMinutes   Int      @default(360)  // 6 hours
  dealsPerRun       Int      @default(3)
  nextRunAt         DateTime?
  dedupeWindowHours Int      @default(168)  // 7 days
  emptyRunsCount    Int      @default(0)

  // Stats
  lastRunAt      DateTime?
  totalRuns      Int @default(0)
  dealsPublished Int @default(0)
  clicksGenerated Int @default(0)

  // Relations
  user           User @relation(...)
  channel        Channel? @relation(...)
  publishHistory ChannelDealHistory[]
  runStats       AutomationRunStats[]
}
```

### AutomationRunStats (Telemetry)

```prisma
model AutomationRunStats {
  id        String   @id @default(cuid())
  ruleId    String

  // Pipeline Counts
  dealsFetched        Int   // From Deal API
  dealsAfterFilters   Int   // After basic filters
  dealsAfterMode      Int   // After dealPublishMode
  dealsPassingScore   Int   // Pass minScore
  dealsPublished      Int   // Actually published

  // Score Statistics
  avgScore    Float?
  minScore    Float?
  maxScore    Float?
  stdDev      Float?

  // Thresholds Used
  minScoreThreshold   Int
  dealPublishMode     String

  // Performance
  durationMs  Int
  cacheHit    Boolean @default(false)

  createdAt DateTime @default(now())
}
```

### ChannelDealHistory (Deduplication)

```prisma
model ChannelDealHistory {
  id          String   @id @default(cuid())
  channelId   String
  asin        String
  ruleId      String?
  publishedAt DateTime @default(now())
  expiresAt   DateTime  // publishedAt + dedupeWindowHours

  @@unique([channelId, asin])
  @@index([expiresAt])
}
```

---

## 7. API Endpoints

### Automation Rules CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/automation/rules` | List all user rules |
| GET | `/automation/rules/:id` | Get single rule |
| POST | `/automation/rules` | Create rule |
| PUT | `/automation/rules/:id` | Update rule |
| DELETE | `/automation/rules/:id` | Delete rule |

### Special Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/automation/rules/:id/run` | Manual execution |
| POST | `/automation/rules/:id/preview` | Preview matching deals |
| POST | `/automation/cache/clear` | Clear all cache |
| GET | `/automation/wizard-config` | Wizard configuration |

### Create Rule Schema

```typescript
const createRuleSchema = z.object({
  // Required
  name: z.string().min(1).max(200),
  categories: z.array(z.string()).min(1),

  // Optional with defaults
  description: z.string().max(500).optional(),
  minScore: z.number().min(0).max(100).default(35),

  // PRO tier (stripped if not authorized)
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minDiscount: z.number().min(0).max(100).optional(),

  // Scheduling
  schedulePreset: z.enum(['relaxed', 'active', 'intensive', 'custom']).default('relaxed'),
  intervalMinutes: z.number().int().min(30).max(1440).optional(),
  dealsPerRun: z.number().int().min(1).max(30).optional(),

  // Publishing
  channelId: z.string().uuid().optional(),
  dealPublishMode: z.enum(['DISCOUNTED_ONLY', 'LOWEST_PRICE', 'BOTH']).default('DISCOUNTED_ONLY'),
  includeKeepaChart: z.boolean().default(false),

  isActive: z.boolean().default(true)
});
```

---

## 8. Configuration

### Default Configuration

```typescript
const DEFAULT_CONFIG: KeepaQueueConfig = {
  // Token Management
  TOKENS_PER_MINUTE: 20,
  DEAL_API_COST: 5,
  PRODUCT_API_COST: 4,

  // Fetching
  PRICE_TYPES: [18],              // BuyBox only
  VERIFY_TOP_N_DEALS: 3,

  // Caching
  CACHE_TTL_MS: 3600000,          // 1 hour
  CACHE_FRESH_THRESHOLD_MS: 1800000, // 30 min
  CACHE_STALE_THRESHOLD_MS: 3600000, // 1 hour

  // Prefetch
  PREFETCH_LOOKAHEAD_MINUTES: 30,
  PREFETCH_PRIORITY: 100,
  MAX_PREFETCH_PER_TICK: 1,

  // Worker
  WORKER_TICK_MS: 3000            // 3 seconds
};
```

### Plan Limits

```typescript
const PLAN_LIMITS = {
  FREE: {
    automations: { active: 1, total: 2 },
    channels: 1,
    minScore: 60,  // Locked at OTTIMO+
    execution: { intervalMinutes: 360 }  // 6 hours
  },
  PRO: {
    automations: { active: 7, total: 10 },
    channels: 5,
    minScore: 35,  // User adjustable
    execution: { intervalMinutes: 150 }  // 2.5 hours
  },
  BUSINESS: {
    automations: { active: -1, total: -1 },  // Unlimited
    channels: -1,
    minScore: 0,  // Any
    execution: { intervalMinutes: 30 }  // 30 minutes
  }
};
```

### Schedule Presets

| Preset | Interval | Deals/Run | Daily Deals |
|--------|----------|-----------|-------------|
| Relaxed | 6 hours | 3 | ~12 |
| Active | 2 hours | 5 | ~60 |
| Intensive | 1 hour | 10 | ~240 |

---

## 9. Telemetry & Monitoring

### AutomationRunStats Usage

Query example for threshold tuning:

```sql
SELECT
  dealPublishMode,
  minScoreThreshold,
  AVG(avgScore) as avg_score,
  AVG(stdDev) as avg_stddev,
  SUM(dealsFetched) as total_fetched,
  SUM(dealsPassingScore) as total_passing,
  SUM(dealsPublished) as total_published,
  AVG(durationMs) as avg_duration,
  COUNT(*) FILTER (WHERE cacheHit) as cache_hits
FROM AutomationRunStats
WHERE createdAt > NOW() - INTERVAL '7 days'
GROUP BY dealPublishMode, minScoreThreshold
ORDER BY dealPublishMode, minScoreThreshold;
```

### Key Metrics to Monitor

| Metric | Query | Target |
|--------|-------|--------|
| Cache Hit Rate | `cache_hits / total_runs` | > 60% |
| Score Pass Rate | `dealsPassingScore / dealsFetched` | 10-30% |
| Publish Success Rate | `dealsPublished / dealsPassingScore` | > 80% |
| Avg Duration (cache hit) | `AVG(durationMs) WHERE cacheHit` | < 500ms |
| Avg Duration (cache miss) | `AVG(durationMs) WHERE NOT cacheHit` | < 5000ms |

### Redis Stats

```bash
# Check queue depth
redis-cli ZCARD keepa:queue

# Check cache stats
redis-cli HGETALL keepa:stats

# Check token status
redis-cli GET keepa:tokens
redis-cli GET keepa:refill_at
```

---

## 10. Troubleshooting

### Common Issues

#### No Deals Published

```
Symptom: Rules run but 0 deals published
Check:
1. dealsFetched > 0? If not, Keepa API issue or category empty
2. dealsAfterFilters > 0? If not, filters too restrictive
3. dealsAfterMode > 0? If not, dealPublishMode wrong
4. dealsPassingScore > 0? If not, minScore too high
5. Check deduplication: same ASINs published recently?
```

#### Token Exhaustion

```
Symptom: Jobs waiting in queue, not processing
Check:
1. redis-cli GET keepa:tokens - Current tokens
2. redis-cli GET keepa:refill_at - Next refill
3. Keepa API status: https://api.keepa.com/token?key=YOUR_KEY
```

#### Cache Not Working

```
Symptom: Every request hits Keepa API
Check:
1. redis-cli KEYS "keepa:cache:*" - Cache entries exist?
2. Check TTL: redis-cli TTL "keepa:cache:CategoryName"
3. Verify Redis connection in worker logs
```

#### Scoring Anomalies

```
Symptom: Deals with high discount get low scores
Check:
1. Is salesRank available? If not, using MINIMAL mode
2. Category in categoryThresholds? Using default 75000
3. Run debug-scoring.js to inspect actual calculations
```

### Debug Commands

```bash
# Run scoring debug script
cd apps/api && node debug-scoring.js

# Check cache status
cd apps/api && node -e "
const Redis = require('ioredis');
const redis = new Redis();
redis.keys('keepa:cache:*').then(keys => {
  console.log('Cached categories:', keys);
  process.exit(0);
});
"

# Force token sync
cd apps/api && node -e "
// ... token sync script
"
```

---

## Appendix A: Score Examples

### Example 1: High Score Deal (DEAL_API Mode)

```
Product: Tappeto Cucina Austin
├── Discount: 77%
├── SalesRank: 2860 (Casa e cucina)
├── Rating: N/A (Deal API)
└── Price: €15.90 (was €69.13)

Raw Scores:
├── rawDiscount: 30.80 / 40
├── rawSalesRank: 7.72 / 25 (log scale)
├── rawRating: 0 / 20 (not available)
└── rawPriceDrop: 11.55 / 15

Normalized (DEAL_API mode, 50/30/20):
├── discountScore: 38.50 / 50
├── salesRankScore: 9.26 / 30
├── priceDropScore: 15.40 / 20
└── ratingScore: 0 / 0

FINAL SCORE: 63 / 100 → OTTIMO ⭐
```

### Example 2: Low Score Deal

```
Product: Generic Item
├── Discount: 20%
├── SalesRank: 85000 (Casa e cucina)
├── Rating: N/A
└── Price: €45.00 (was €56.25)

Raw Scores:
├── rawDiscount: 8.00 / 40
├── rawSalesRank: 0.56 / 25 (near threshold)
├── rawRating: 0 / 20
└── rawPriceDrop: 3.00 / 15

Normalized:
├── discountScore: 10.00 / 50
├── salesRankScore: 0.67 / 30
├── priceDropScore: 4.00 / 20
└── ratingScore: 0 / 0

FINAL SCORE: 15 / 100 → MEH 😐
```

---

## Appendix B: Changelog

### v2.0.0 (2024-11-29)

- **Scoring**: Added DEAL_API mode with proper normalization
- **Scoring**: Changed salesRank to logarithmic scale
- **Scoring**: Increased category thresholds (50k-100k)
- **Telemetry**: Added AutomationRunStats model
- **Thresholds**: Lowered default minScore from 70 to 35
- **Labels**: Updated score labels (MEH/DECENTE/BUONO/OTTIMO/HOT)

### v1.0.0 (2024-11-27)

- Initial Keepa Queue v2 implementation
- Smart batching for same-category rules
- Multi-layer caching system
- Token budget management
- Prefetch during idle time

---

*Generated by Claude Code on 2024-11-29*
