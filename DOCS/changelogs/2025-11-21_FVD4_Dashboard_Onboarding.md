# Changelog - FVD 4: Dashboard UI & Onboarding Hub (TSK-072)

**Date:** 2025-11-21
**Version:** 0.4.0
**Author:** Antigravity (AI Assistant)

## Summary
This release implements the **Dashboard UI & Onboarding Hub**, an adaptive interface that guides new users through setup while providing active users with comprehensive KPI insights. The dashboard dynamically adjusts its UI based on user state (new/partial/active) and prominently displays the North Star Metric (Weekly Active Automations).

## 🚀 New Features

### Backend API (apps/api)

#### Dashboard Stats Endpoint
- **GET /user/dashboard/stats**: Aggregates KPI data for the dashboard
  - Onboarding progress (channels, credentials, automations)
  - Account data (plan, TTL, limits)
  - Performance metrics (clicks, revenue, conversion rate)
  - Keepa budget tracking
  - Recent high-score deals

#### User Model Updates
- Added `plan` field (default: "PRO")
- Added `ttl` field (default: 72 hours)

### Frontend Components (apps/web)

#### Main Dashboard Page (`/dashboard/page.tsx`)
**Adaptive UI States**:
- **NEW**: Welcome hero + 3-step onboarding flow + minimal KPIs
- **PARTIAL**: Onboarding with progress + limited KPIs
- **ACTIVE**: Full KPI grid + Hot Deals + Quick Stats

**Header Elements**:
- Plan & TTL badge
- WAA (Weekly Active Automations) counter - North Star Metric
- System status indicator (green pulse)

**State Calculation**:
```typescript
const steps = [channelConnected, credentialsSet, automationCreated];
const completed = steps.filter(Boolean).length;

if (completed === 0) return 'new';
if (completed < 3) return 'partial';
return 'active';
```

#### OnboardingFlow Component
**3-Step Guided Wizard**:
1. **Connetti Canale** → `/dashboard/settings/channels`
   - Create Telegram bot
   - Add bot to channel
   - Insert credentials

2. **Imposta Credenziali** → `/dashboard/settings/credentials`
   - Keepa API key
   - Amazon affiliate tags

3. **Crea Automazione** → `/dashboard/automations/new`
   - Set filters (score, categories)
   - Select channels
   - Activate automation

**Features**:
- Progress bar (0-100%)
- Estimated time remaining
- Visual step completion with checkmarks
- Active step highlighting with pulse animation
- Value proposition box (ROI +247%)
- Connection lines between steps

#### KPIWidget Component
**Reusable Widget** with support for:
- Main/sub values with labels
- Trend indicators (↑/↓ with percentage)
- Progress bars
- Status indicators (good/warning/critical)
- Activity lists (recent deals)
- Color themes (cyan/plasma/profit/warning)

**4 Dashboard Widgets**:
1. **Performance Totale**: Clicks + Revenue + Trend
2. **Stato Limiti**: Rules + Offers usage
3. **Budget Keepa**: Consumed vs Total + Days remaining
4. **Ultima Attività**: Last click + Last deal + Recent deals list

## 🎯 North Star Metric (NSM)

**Weekly Active Automations (WAA)**:
- Prominently displayed in header
- Target: 5 automations
- Visual format: "3/5 Automazioni"
- Color-coded based on progress

## 🛠 Technical Details

### API Response Structure
```json
{
  "onboardingProgress": {
    "channelConnected": boolean,
    "credentialsSet": boolean,
    "automationCreated": boolean
  },
  "accountData": {
    "plan": "PRO",
    "ttl": 72,
    "limits": { ... },
    "keepaBudget": { ... }
  },
  "performance": { ... },
  "recentDeals": [ ... ]
}
```

### User State Logic
- Fetches data from `/user/dashboard/stats`
- Calculates state client-side
- Stores in React state
- Triggers UI re-render on state change

### Design Compliance
- ✅ Glass morphism on all cards
- ✅ Corner cuts on CTA buttons
- ✅ Cyan/Plasma/Profit color palette
- ✅ Font mono for numerical data
- ✅ Pulse animations for live indicators
- ✅ Gradient backgrounds for emphasis

## ✅ Verification

### Implemented
- ✅ Dashboard stats API endpoint
- ✅ User model with plan/ttl fields
- ✅ KPIWidget component
- ✅ OnboardingFlow component
- ✅ Main dashboard page with adaptive states
- ✅ TTL and WAA indicators in header

### Pending Manual Testing
- [ ] Onboarding flow navigation (click CTAs)
- [ ] KPI data display accuracy
- [ ] User state transitions (new → partial → active)
- [ ] API error handling
- [ ] Loading states

## 🔧 Integration Points

**With FVD 2 (Channels & Credentials)**:
- Onboarding step 1 links to `/dashboard/settings/channels`
- Onboarding step 2 links to `/dashboard/settings/credentials`
- Progress calculated from channel/credential counts

**With FVD 3 (Deal Finder)**:
- Recent deals fetched from Product model
- Deal scores displayed in activity widget
- Hot Deals section for active users

**With Future FVD 5 (Automation Studio)**:
- Onboarding step 3 links to `/dashboard/automations/new`
- WAA metric tracks active automations
- Automation performance in Quick Stats

## 🚨 Known Limitations

1. **Automation Model**: Not yet implemented - placeholder logic returns false
2. **Mock Data**: Some metrics use mock data (conversion rate, quick stats)
3. **No Real-time Updates**: Dashboard requires manual refresh
4. **No Caching**: API calls on every page load

## 📝 Files Modified

### Backend
- `apps/api/src/routes/dashboard.ts`: New dashboard stats endpoint
- `apps/api/src/app.ts`: Registered dashboard routes
- `apps/api/prisma/schema.prisma`: Added plan/ttl to User model

### Frontend
- `apps/web/app/dashboard/page.tsx`: Main dashboard page
- `apps/web/components/dashboard/OnboardingFlow.tsx`: 3-step wizard
- `apps/web/components/dashboard/KPIWidget.tsx`: Reusable KPI widget

## 🎯 Next Steps (FVD 5)

1. Implement Automation Studio (`/dashboard/automations/new`)
2. Add real-time updates via WebSocket
3. Implement dashboard caching (5 min TTL)
4. Add error boundaries and fallback UI
5. Implement automated tests for components
