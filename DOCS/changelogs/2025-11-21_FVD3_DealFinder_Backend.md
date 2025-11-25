# Changelog - FVD 3: Deal Finder Backend Core (TSK-069)

**Date:** 2025-11-21
**Version:** 0.3.0
**Author:** Antigravity (AI Assistant)

## Summary
This release implements the **Deal Finder Backend Core**, providing the infrastructure for intelligent product discovery, deal scoring, and affiliate link generation. The system includes Keepa API integration with TTL-based lazy loading, a sophisticated scoring algorithm, and compliance-focused data management.

## 🚀 New Features

### Database Schema (Backend)
- **Brand Model**: Product brand management with slug-based URLs
- **Product Model**: Complete product data with compliance fields:
  - `scoreComponents`: JSON breakdown of Deal Score calculation
  - `lastPriceCheckAt`: Timestamp for Amazon compliance (24h freshness)
  - `keepaDataTTL`: Dynamic TTL in minutes
  - Indexed fields: `asin`, `category`, `salesRank`
- **AffiliateLink Model**: Tracking for generated affiliate links
  - Short URL generation
  - Click tracking
  - Amazon tag association
- **KeepaMonthlyBudget Model**: Token usage tracking per user/month

### Core Logic Engines (Backend)

#### ScoringEngine
Calculates Deal Score (0-100) based on weighted factors:
- **Discount** (40%): Linear scaling from 0-100% discount
- **Sales Rank** (25%): Category-specific inverse ranking
- **Rating** (20%): Star rating + review count bonus
- **Price Drop** (15%): Historical price comparison

Returns both the total score and component breakdown for transparency.

#### KeepaEngine
Implements TTL-based lazy loading:
- **Freshness Tiers**:
  - Fresh (< 6h): 24h TTL
  - Valid (6-12h): 12h TTL
  - Expiring (12-20h): 6h TTL
  - Critical (> 20h): Immediate refresh
- **Background Refresh Queue**: Non-blocking updates
- **Monthly Budget Tracking**: Prevents API overage
- **Mock Keepa API**: Ready for real integration

### API Routes (Backend)

#### GET /products/discover
Main Deal Finder search endpoint:
- **Query Filters**: search, category, minScore, priceMin/Max
- **Enrichment**: Calculates Deal Score in-memory for each product
- **Lazy Load**: Triggers background refresh for stale data
- **Response**: Enriched deals with score, TTL, and freshness metadata

#### GET /products/:asin
Single product details with real-time scoring.

#### POST /links/generate
Generate compliant Amazon affiliate links:
- **Validation**: Verifies product exists and ASIN is valid
- **Link Generation**: Full URL with Amazon tag + short URL
- **Tracking**: Stores link in DB for click analytics
- **Compliance**: Returns TTL and freshness disclaimer

#### GET /links/my
User's generated links with click stats.

#### POST /links/:id/click
Track link clicks for analytics.

## 🛠 Technical Details

### Scoring Algorithm
```typescript
Total Score = (Discount × 0.4) + (SalesRank × 0.25) + (Rating × 0.2) + (PriceDrop × 0.15)
```

**Score Labels**:
- 85-100: HOT DEAL (red/orange)
- 70-84: OTTIMO (cyan)
- 50-69: BUONO (yellow)
- 0-49: NORMALE (gray)

### TTL Logic
```typescript
TTL = keepaDataTTL - minutesSinceLastCheck
Status = TTL < 0 ? 'expired' : TTL < 360 ? 'critical' : TTL < 720 ? 'expiring' : 'valid'
```

### Compliance
- `lastPriceCheckAt`: Updated on every Keepa refresh
- `scoreComponents`: Stored as JSON for audit trail
- Link expiration: 24h from last price check
- Disclaimer: Included in all link generation responses

## 📊 Database Migrations

**New Models**: 4
**New Relations**: 6
**Indexes Added**: 5 (asin, category, salesRank, productId, userId)

## ✅ Verification

### Implemented
- ✅ Database schema with all compliance fields
- ✅ ScoringEngine with 4-component weighted calculation
- ✅ KeepaEngine with TTL/lazy load logic
- ✅ Product discovery API with filtering
- ✅ Affiliate link generation with tracking
- ✅ Prisma Client regenerated successfully

### Pending Manual Testing
- [ ] Deal Score calculation accuracy
- [ ] TTL refresh queue behavior
- [ ] Link generation with real Amazon tags
- [ ] Monthly budget enforcement

## 🔧 Integration Points

**With FVD 2 (Credential Vault)**:
- Amazon tags should be validated against user's stored credentials
- Keepa API key retrieved from Vault (TODO)

**With FVD 4 (Frontend)**:
- `/products/discover` powers the Deal Finder Command Center
- Deal Score visual component uses returned `scoreComponents`
- TTL indicator uses `ttl` and `lastUpdated` fields

## 🚨 Known Limitations

1. **Mock Keepa API**: Currently returns dummy data. Real integration pending.
2. **In-Memory Queue**: Refresh queue is not persisted. Use Redis/Bull in production.
3. **No Tag Validation**: Amazon tags not yet validated against Vault.
4. **Short URL Mock**: Using random codes instead of Amazon's API.

## 📝 Files Modified

### Backend
- `apps/api/prisma/schema.prisma`: Added 4 new models
- `apps/api/src/services/ScoringEngine.ts`: New service
- `apps/api/src/services/KeepaEngine.ts`: New service
- `apps/api/src/routes/products.ts`: New routes
- `apps/api/src/routes/links.ts`: New routes
- `apps/api/src/app.ts`: Registered new routes

## 🎯 Next Steps (FVD 4)

1. Implement Deal Finder frontend UI (Command Center)
2. Integrate real Keepa API
3. Add Redis for persistent queue
4. Implement tag validation with Vault
5. Add automated tests for scoring logic
