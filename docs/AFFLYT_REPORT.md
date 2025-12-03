# Afflyt Pro - Comprehensive Technical Report

**Generated:** 2025-12-02
**Version:** 1.0.0
**Status:** Beta (Private Testing)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [API Endpoints](#4-api-endpoints)
5. [Frontend Pages](#5-frontend-pages)
6. [Key Features](#6-key-features)
7. [Recent Implementations](#7-recent-implementations)

---

## 1. Project Overview

**Afflyt Pro** is an affiliate marketing automation platform designed for Italian Amazon Associates. The platform automates deal discovery, affiliate link management, and multi-channel publishing.

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 + React 19 + Tailwind CSS 4 |
| **Backend** | Fastify API (Node.js) |
| **Database** | PostgreSQL + Prisma ORM |
| **Authentication** | JWT + Magic Links (Resend) |
| **Payments** | Stripe (subscriptions) |
| **Integrations** | Telegram Bot API, Keepa API, OpenAI |
| **Analytics** | PostHog + Custom analytics |

### Directory Structure

```
AfflytPro/
├── apps/
│   ├── api/          # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/     # API route handlers
│   │   │   ├── services/   # Business logic
│   │   │   └── jobs/       # Background jobs
│   │   └── prisma/         # Database schema
│   └── web/          # Next.js frontend
│       ├── app/            # App router pages
│       ├── components/     # React components
│       └── lib/            # Utilities
├── packages/         # Shared packages
│   ├── i18n/         # Internationalization
│   └── database/     # Prisma client
└── docs/             # Documentation
```

---

## 2. Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AFFLYT PRO                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Next.js   │───▶│  Fastify    │───▶│ PostgreSQL  │          │
│  │   Frontend  │◀───│    API      │◀───│  Database   │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│         │                  │                                     │
│         │                  │                                     │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌─────────────┐          │
│  │   PostHog   │    │   Resend    │    │   Stripe    │          │
│  │  Analytics  │    │   (Email)   │    │  Payments   │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                            │                                     │
│                     ┌──────▼──────┐    ┌─────────────┐          │
│                     │  Telegram   │    │    Keepa    │          │
│                     │   Bot API   │    │     API     │          │
│                     └─────────────┘    └─────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### User Tiers

| Tier | Features |
|------|----------|
| **FREE** | 1 channel, 3 automations, basic filters |
| **PRO** | 5 channels, unlimited automations, advanced filters, AI insights |
| **BUSINESS** | Unlimited channels, premium filters, API access, white-label |
| **BETA_TESTER** | PRO features with extended limits |

---

## 3. Database Schema

### Core Models (35+ tables)

#### User & Authentication
- `User` - User accounts with persona, preferences, email settings
- `AuthToken` - Magic link & reset tokens
- `AuthEvent` - Security audit log
- `ApiKey` - API access keys
- `Session` - Active login sessions

#### Products & Links
- `Product` - Amazon product data (from Keepa)
- `AffiliateLink` - Tracked affiliate links
- `ShortLink` - URL shortener records
- `Click` - Click tracking with device/geo data
- `Conversion` - Sales conversions

#### Channels & Automation
- `Channel` - Telegram/Discord channels
- `Credential` - Encrypted API credentials
- `AutomationRule` - Deal automation rules
- `AutomationTrigger` - Rule triggers
- `AutomationAction` - Rule actions
- `MessageTemplate` - Message templates
- `ChannelDealHistory` - Deduplication records

#### Scheduling
- `ScheduledPost` - Non-deal scheduled content
- `ScheduledPostExecution` - Execution history
- `BountyTemplate` - Amazon bounty templates

#### Billing
- `Subscription` - Stripe subscriptions
- `Invoice` - Payment invoices
- `PaymentMethod` - Payment methods

#### Analytics & Tracking
- `AnalyticsEvent` - Custom events
- `AutomationRunStats` - Automation telemetry
- `KeepaTokenLog` - API usage tracking
- `KeepaMonthlyBudget` - Token budgets

#### Misc
- `BetaInviteCode` - Beta access codes
- `AffiliateTag` - Tag pool management
- `Notification` - In-app notifications
- `Achievement` - Gamification badges
- `OnboardingProgress` - Onboarding state

### Key Enums

```prisma
enum PlanType { FREE, PRO, BUSINESS, BETA_TESTER }
enum UserRole { USER, ADMIN }
enum ChannelPlatform { TELEGRAM, DISCORD }
enum ChannelStatus { CONNECTED, PENDING, ERROR }
enum TriggerType { SCHEDULE, SCORE_THRESHOLD, PRICE_DROP }
enum ActionType { PUBLISH_CHANNEL, SEND_EMAIL, WEBHOOK }
enum DealPublishMode { DISCOUNTED_ONLY, LOWEST_PRICE, BOTH }
enum LinkType { DEAL, BOUNTY, SCHEDULED, MANUAL }
enum ScheduledPostType { CUSTOM, BOUNTY, RECAP, CROSS_PROMO, WELCOME, SPONSORED }
enum ExecutionStatus { PENDING, RUNNING, SUCCESS, FAILED, SKIPPED_*, RETRY, RESCHEDULED }
```

---

## 4. API Endpoints

### Route Files (23 files)

| File | Prefix | Purpose |
|------|--------|---------|
| `auth.ts` | `/auth` | Authentication (magic link, login, register) |
| `admin.ts` | `/admin` | Admin dashboard endpoints |
| `analytics.ts` | `/analytics` | Performance analytics |
| `automations.ts` | `/automations` | Automation rules CRUD |
| `billing.ts` | `/billing` | Stripe subscriptions |
| `channels.ts` | `/channels` | Channel management |
| `credentials.ts` | `/credentials` | API credential storage |
| `dashboard.ts` | `/dashboard` | Dashboard data |
| `deals.ts` | `/deals` | Deal discovery |
| `links.ts` | `/links` | Affiliate link generation |
| `internal-links.ts` | `/internal/links` | Internal link operations |
| `notifications.ts` | `/notifications` | Notification management |
| `products.ts` | `/products` | Product data |
| `scheduler.ts` | `/scheduler` | Scheduled posts |
| `security.ts` | `/security` | Security operations |
| `templates.ts` | `/templates` | Message templates |
| `tracking.ts` | `/tracking` | Click/conversion tracking |
| `beta.ts` | `/beta` | Beta code management |
| `affiliate-tags.ts` | `/affiliate-tags` | Tag pool management |
| `bounty-templates.ts` | `/bounty-templates` | Bounty templates |
| `keepa-public.ts` | `/keepa` | Public Keepa endpoints |
| `internal-keepa.ts` | `/internal/keepa` | Internal Keepa operations |
| `validation.ts` | `/validation` | Data validation |

### Detailed Endpoint List (~150+ endpoints)

#### Authentication (`/auth`)
```
POST /auth/magic-link          # Send magic link email
GET  /auth/magic-link/verify   # Verify magic link token
POST /auth/login               # Password login (if set)
POST /auth/register            # New user registration
POST /auth/logout              # Logout current session
GET  /auth/me                  # Get current user
PUT  /auth/me                  # Update user profile
POST /auth/password/set        # Set password (first time)
POST /auth/password/change     # Change password
POST /auth/password/reset      # Request password reset
POST /auth/password/reset/confirm # Confirm password reset
```

#### Analytics (`/analytics`)
```
GET /analytics/overview        # KPI overview (revenue, clicks, CVR, EPC)
GET /analytics/time-series     # Chart data over time
GET /analytics/top-links       # Top performing links
GET /analytics/channels        # Channel breakdown
GET /analytics/heatmap         # Click heatmap by hour/day
GET /analytics/products        # Product performance
GET /analytics/audience        # Device/geo/browser stats
GET /analytics/deal-score      # Deal score analytics
GET /analytics/filters         # Available filter options
GET /analytics/insights        # AI-generated insights
GET /analytics/export          # Export data (CSV)
GET /analytics/export/summary  # Export summary (JSON)
POST /analytics/track          # Track custom event
GET /analytics/progress        # Onboarding progress
```

**Filter Parameters (all endpoints):**
- `period` - 7d, 30d, today
- `channelId` - Filter by channel
- `amazonTag` - Filter by affiliate tag
- `category` - Filter by product category
- `dealScoreMin` / `dealScoreMax` - Score range

#### Automations (`/automations`)
```
GET    /automations            # List user automations
POST   /automations            # Create automation
GET    /automations/:id        # Get automation details
PUT    /automations/:id        # Update automation
DELETE /automations/:id        # Delete automation
POST   /automations/:id/toggle # Toggle active state
POST   /automations/:id/run    # Manual trigger
GET    /automations/templates  # Preset templates
GET    /automations/stats/:id  # Run statistics
```

#### Channels (`/channels`)
```
GET    /channels               # List user channels
POST   /channels               # Create channel
GET    /channels/:id           # Get channel details
PUT    /channels/:id           # Update channel
DELETE /channels/:id           # Delete channel
POST   /channels/:id/test      # Test channel connection
GET    /channels/:id/history   # Deal history
```

#### Links (`/links`)
```
POST /links/generate           # Generate affiliate link
GET  /links/my                 # Get user's links
GET  /links/:shortCode         # Get link details
GET  /links/:shortCode/stats   # Link statistics
```

#### Admin (`/admin`)
```
GET  /admin/stats              # Platform statistics
GET  /admin/users              # User management
GET  /admin/users/:id          # User details
PUT  /admin/users/:id          # Update user
GET  /admin/beta-codes         # Beta code management
POST /admin/beta-codes         # Generate beta codes
PUT  /admin/beta-codes/:id     # Update beta code
DELETE /admin/beta-codes/:id   # Delete beta code
GET  /admin/automations        # All automations
GET  /admin/activity           # Recent activity
```

#### Billing (`/billing`)
```
GET  /billing/subscription     # Current subscription
POST /billing/checkout         # Create checkout session
POST /billing/portal           # Customer portal link
POST /billing/webhook          # Stripe webhook
GET  /billing/invoices         # Invoice history
GET  /billing/usage            # Usage statistics
```

#### Scheduler (`/scheduler`)
```
GET    /scheduler/posts        # List scheduled posts
POST   /scheduler/posts        # Create scheduled post
GET    /scheduler/posts/:id    # Get post details
PUT    /scheduler/posts/:id    # Update post
DELETE /scheduler/posts/:id    # Delete post
POST   /scheduler/posts/:id/run # Run immediately
GET    /scheduler/executions   # Execution history
GET    /scheduler/calendar     # Calendar view
```

#### Tracking (`/tracking`)
```
GET  /r/:code                  # Redirect short link (tracked)
POST /tracking/click           # Record click
POST /tracking/conversion      # Record conversion
GET  /tracking/funnel/:linkId  # Funnel analytics
```

---

## 5. Frontend Pages

### Public Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing | Marketing landing page |
| `/auth/login` | Login | Password login form |
| `/auth/magic-link` | Magic Link | Magic link auth flow |
| `/auth/verify-email` | Verify Email | Email verification |
| `/auth/reset-password` | Reset Password | Password reset flow |
| `/r/[code]` | Redirect | Affiliate link redirect page |

### Dashboard Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/dashboard` | Overview | Main dashboard with KPIs |
| `/dashboard/analytics` | Analytics | Performance analytics |
| `/dashboard/automations` | Automations | Manage automation rules |
| `/dashboard/channels` | Channels | Manage channels |
| `/dashboard/links` | Links | Manage affiliate links |
| `/dashboard/scheduler` | Scheduler | Scheduled posts |

### Settings Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/settings` | Overview | Settings overview |
| `/settings/profile` | Profile | User profile |
| `/settings/security` | Security | Password, 2FA, sessions |
| `/settings/billing` | Billing | Subscription management |
| `/settings/api-keys` | API Keys | API key management |
| `/settings/affiliate-tags` | Affiliate Tags | Tag pool management |
| `/settings/notifications` | Notifications | Notification preferences |
| `/settings/tester` | Beta Tester | Beta testing tools |

### Admin Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/admin` | Dashboard | Admin overview |
| `/admin/login` | Login | Admin authentication |

### Help Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/help` | Help Center | Help documentation |
| `/help/guides/[slug]` | Guide | Individual guide |

### Onboarding

| Route | Page | Purpose |
|-------|------|---------|
| `/onboarding` | Onboarding | New user onboarding flow |

---

## 6. Key Features

### 6.1 Deal Automation Engine

The core feature that automatically finds and publishes Amazon deals:

1. **Deal Discovery** - Scans Keepa API for deals matching user criteria
2. **Scoring** - Calculates deal confidence score (0-100)
3. **Filtering** - Applies user-defined filters (price, category, brand, etc.)
4. **Deduplication** - Prevents republishing same deal within window
5. **Publishing** - Sends to connected Telegram channels
6. **Tracking** - Creates tracked affiliate links

**Filter Tiers:**
- **FREE**: Categories, minimum score
- **PRO**: Price range, discount %, rating, reviews, sales rank
- **BUSINESS**: Amazon-only, FBA-only, coupon, Prime, brand filters

### 6.2 Analytics Dashboard

Comprehensive performance tracking:

- **KPIs**: Revenue, clicks, CVR, EPC with trends
- **Time Series**: Revenue and clicks over time
- **Top Links**: Best performing affiliate links
- **Channel Breakdown**: Performance by channel
- **Heatmap**: Clicks by hour and day of week
- **Products**: Performance by category and price range
- **Audience**: Device, browser, OS, country breakdown
- **Deal Score**: Score distribution and correlation with conversions
- **AI Insights**: AI-generated recommendations (PRO)

**Filters:**
- Channel, Amazon Tag, Category, Deal Score Range

### 6.3 Channel Management

Multi-channel publishing support:

- **Telegram**: Bot token integration, channel posting
- **Discord**: Webhook integration (planned)
- **Per-channel settings**: Custom Amazon tags, templates

### 6.4 Scheduler

Non-deal content scheduling:

- **Custom Posts**: Schedule any content
- **Bounty Posts**: Amazon Prime, Audible, Music, Kindle promotions
- **Recap Posts**: Daily/weekly top deals summary
- **Conflict Detection**: Avoids overlapping with deal publications

### 6.5 Affiliate Tag Pool

Centralized tag management:

- Multiple Amazon tags per user
- Per-automation/channel tag assignment
- Analytics breakdown by tag

### 6.6 Beta Code System

Access control for beta testing:

- Unique codes (format: AFFLYT-XXXX-XXXX)
- Optional email pre-assignment
- Expiration dates
- Admin management interface

---

## 7. Recent Implementations

### 7.1 Analytics Filters (Phase 8) ✅

Added advanced filtering to analytics:

**New Component:** `AnalyticsFilters.tsx`
- Channel dropdown
- Amazon Tag dropdown
- Category dropdown
- Deal Score range slider
- Reset button

**New Endpoint:** `GET /analytics/filters`
```typescript
{
  channels: [{ id, name, platform }],
  tags: ["tag1", "tag2"],
  categories: ["Electronics", "Home", ...],
  dealScoreRange: { min: 0, max: 100, avg: 65 }
}
```

**Updated Endpoints:** All analytics endpoints now accept filter parameters.

### 7.2 Deal Score Analytics (Phase 9) ✅

Added dedicated deal score analytics tab:

**New Endpoint:** `GET /analytics/deal-score`
```typescript
{
  distribution: [{ range, count, percentage }],
  scoreConversionCorrelation: [{ scoreRange, avgClicks, cvr, ... }],
  topScoringDeals: [{ asin, score, clicks, conversions, ... }],
  scoreTrends: [{ date, avgScore, maxScore, dealsFound }],
  summary: { avgScore, totalDeals, dealsAbove80, dealsAbove90, ... }
}
```

**New Component:** `DealScoreAnalytics.tsx`
- Score distribution visualization
- Score vs CVR correlation
- Top scoring deals table
- Score trends over time
- Summary cards

### 7.3 Persona-Based Onboarding ✅

Implemented personalized onboarding flow:

- Welcome survey (persona type, experience, goals)
- Channel selection based on persona
- Guided setup for each channel
- Progress tracking

### 7.4 Admin Dashboard ✅

Complete admin interface:

- User management (view, edit, tier changes)
- Beta code management (create, assign, delete)
- Platform statistics
- Activity monitoring

---

## Appendix A: Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="..."
RESEND_API_KEY="..."

# Integrations
KEEPA_API_KEY="..."
TELEGRAM_BOT_TOKEN="..."
OPENAI_API_KEY="..."

# Payments
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."
STRIPE_PRICE_PRO="..."
STRIPE_PRICE_BUSINESS="..."

# Analytics
NEXT_PUBLIC_POSTHOG_KEY="..."
NEXT_PUBLIC_POSTHOG_HOST="..."

# URLs
NEXT_PUBLIC_API_URL="..."
NEXT_PUBLIC_APP_URL="..."
```

---

## Appendix B: Development Commands

```bash
# Install dependencies
npm install

# Run development servers
cd apps/web && npm run dev    # Frontend: http://localhost:3000
cd apps/api && npm run dev    # Backend: http://localhost:3001

# Database
npx prisma generate           # Generate Prisma client
npx prisma db push            # Push schema changes
npx prisma studio             # Open Prisma Studio

# Build
npm run build

# Type checking
npx tsc --noEmit
```

---

## Appendix C: File Statistics

| Category | Count |
|----------|-------|
| API Route Files | 23 |
| Database Models | 35+ |
| Frontend Pages | 25 |
| API Endpoints | ~150+ |
| Lines of Schema | ~1550 |

---

*Report generated by Claude Code for Afflyt Pro v1.0.0*
