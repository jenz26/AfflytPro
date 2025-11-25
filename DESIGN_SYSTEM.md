# Afflyt Pro Design System

## 🎨 Design Principles

1. **Consistency is King** - Same component = Same look everywhere
2. **Hierarchy Through Variants** - Limited, purposeful variations
3. **Predictable Spacing** - Standard padding/margins across all components
4. **Visual Coherence** - Unified border radius, colors, and effects

---

## 📐 Design Tokens

### Border Radius
```tsx
sm: 8px   // Buttons, small elements
md: 12px  // Cards, containers (STANDARD)
lg: 16px  // Large panels
xl: 20px  // Modals
```

### Spacing
```tsx
xs: 8px   // Tight spacing
sm: 12px  // Compact
md: 20px  // Standard (DEFAULT for cards)
lg: 32px  // Loose
xl: 48px  // Very loose
```

### Colors
```tsx
Primary Cyan: #00E5E0
Dark Background: #14151C
Glass White: rgba(255, 255, 255, 0.02)
Glass Border: rgba(0, 229, 224, 0.15)
Profit Green: #10B981
Loss Red: #EF4444
```

---

## 🧩 Core Components

### 1. GlassCard

**Standard Usage:**
```tsx
<GlassCard>
  {/* Content here */}
</GlassCard>
```

**Design Specs:**
- Border radius: **12px** (ALWAYS)
- Padding: **20px** (default)
- Border: `1px solid rgba(0,229,224,0.15)`
- Background: `rgba(255,255,255,0.02)`
- Backdrop blur: **10px**

**Variants:**
```tsx
// Default - standard card
<GlassCard variant="default">

// Interactive - for clickable cards
<GlassCard variant="interactive" onClick={handler}>

// Flat - no blur/shadow
<GlassCard variant="flat">
```

**Padding Options:**
```tsx
<GlassCard padding="none">  // No padding
<GlassCard padding="sm">    // 12px
<GlassCard padding="md">    // 20px (DEFAULT)
<GlassCard padding="lg">    // 32px
```

---

### 2. CyberButton

**⚠️ CRITICAL RULES:**
- **MAX 1 Primary** button per screen
- **2-3 Secondary** buttons per screen
- **Unlimited Ghost** buttons

**Usage:**
```tsx
// PRIMARY - Use ONCE per screen
<CyberButton variant="primary">
  Create New Mission
</CyberButton>

// SECONDARY - Use 2-3 times
<CyberButton variant="secondary">
  Edit
</CyberButton>

// GHOST - Unlimited
<CyberButton variant="ghost">
  Cancel
</CyberButton>
```

**Sizes:**
```tsx
<CyberButton size="sm">   // Compact
<CyberButton size="md">   // Standard (DEFAULT)
<CyberButton size="lg">   // Large
```

---

### 3. ScoreIndicator

**Context-aware score visualization** - choose the right variant for each context

```tsx
// Tables & Lists - Compact pill badge
<ScorePill score={92} size="sm" showLabel />

// Cards & Hero sections - Large gradient text
<ScoreText score={85} size="lg" showLabel />

// Progress lists - Visual percentage bar
<ScoreBar score={73} size="md" showLabel />

// Detail views - Circular progress arc
<ScoreArc score={88} size="lg" showLabel />

// Or use the base component with variant
<ScoreIndicator score={65} variant="pill" size="md" />
```

**Variants & Use Cases:**
| Variant | Best For | Visual Style |
|---------|----------|--------------|
| `pill` | Tables, compact lists | Badge with dot indicator |
| `text` | Cards, hero sections | Large gradient text with glow |
| `bar` | Progress lists | Horizontal progress bar |
| `arc` | Detail panels, modals | Circular SVG progress arc |

**Sizes:**
- `sm`: Small (pill: text-xs, arc: 48px)
- `md`: Medium (pill: text-sm, arc: 64px) - DEFAULT
- `lg`: Large (pill: text-base, arc: 80px)

**Auto-coloring (all variants):**
- 85-100: Green (HOT) - Top performing deals
- 70-84: Cyan (GOOD) - High quality deals
- 50-69: Yellow (OK) - Moderate deals
- 0-49: Red (LOW) - Low quality deals

**Examples by Page:**
```tsx
// Deal Finder (table rows)
<ScorePill score={deal.score} size="sm" showLabel />

// Dashboard KPI
<ScoreText score={avgScore} size="lg" showLabel />

// Automation Performance
<ScoreBar score={rule.avgScore} size="md" />

// Deal Detail Panel
<ScoreArc score={deal.score} size="lg" showLabel />
```

**Backward Compatibility:**
```tsx
// Old code still works (ScoreCircle = ScoreArc)
<ScoreCircle score={85} />  // ✅ Maps to ScoreArc
```

---

### 4. StandardEmptyState

**ALWAYS use when a section is empty**

```tsx
<StandardEmptyState
  icon={Zap}
  title="No Automations Yet"
  description="Create your first automation to start finding deals automatically"
  actionLabel="New Mission"
  onAction={() => setShowWizard(true)}
/>
```

**Design Specs:**
- Icon: 64px (w-16 h-16)
- Title: `text-xl font-bold text-white`
- Description: `text-gray-400 max-w-md`
- Single Primary CTA button

---

## 📋 Usage Guidelines

### Dashboard Layout
```tsx
<div className="p-8">  {/* Standard page padding */}
  <GlassCard>
    <div className="p-5">  {/* Standard card padding */}
      {/* Content */}
    </div>
  </GlassCard>
</div>
```

### Table Rows (Deal Finder)
```tsx
<div className="rounded-xl border border-afflyt-glass-border hover:border-afflyt-cyan-500/30 transition-all duration-300 p-4">
  {/* Table row content */}
</div>
```

**Table Design Rules:**
- Each row = GlassCard styling
- Border radius: 12px
- Padding: 16-20px
- Hover effect: border color change
- Spacing between rows: 12px (gap-3)

### Button Hierarchy Example
```tsx
// ✅ GOOD - One primary, rest secondary/ghost
<div>
  <CyberButton variant="primary">Create</CyberButton>
  <CyberButton variant="secondary">Edit</CyberButton>
  <CyberButton variant="ghost">Cancel</CyberButton>
</div>

// ❌ BAD - Multiple primaries
<div>
  <CyberButton variant="primary">Create</CyberButton>
  <CyberButton variant="primary">Save</CyberButton>  {/* NO! */}
</div>
```

---

## 🎯 Quick Fixes Checklist

### Deal Finder
- [ ] Replace flat table rows with GlassCard-styled rows
- [ ] Add `rounded-xl` to each row
- [ ] Use ScorePill (compact) instead of custom score display
- [ ] Standardize spacing: `gap-3` between rows
- [ ] Add hover effects: `hover:border-afflyt-cyan-500/30`

### Dashboard
- [ ] Ensure all KPI cards use GlassCard component
- [ ] Replace custom score displays with ScoreText or ScoreArc
- [ ] Verify spacing consistency: `p-5` for cards

### Automations
- [ ] RuleCard already uses GlassCard ✅
- [ ] Replace any custom empty states with StandardEmptyState
- [ ] Verify button hierarchy (max 1 primary)

### Channels/Settings
- [ ] Use StandardEmptyState for empty channel list
- [ ] Ensure all cards use GlassCard
- [ ] Button hierarchy: 1 primary ("Add Channel")

---

## 🚀 Implementation Priority

1. **High Priority** - User sees immediately
   - [ ] Deal Finder table styling
   - [ ] Button variants cleanup
   - [ ] Score displays standardization

2. **Medium Priority** - Consistency improvements
   - [ ] Empty states
   - [ ] Card padding standardization
   - [ ] Spacing consistency

3. **Low Priority** - Polish
   - [ ] Animation timings
   - [ ] Hover effects uniformity
   - [ ] Shadow consistency

---

## 📦 Component Import Guide

```tsx
// Core UI components
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { ScorePill, ScoreText, ScoreBar, ScoreArc } from '@/components/ui/ScoreIndicator';
import { StandardEmptyState } from '@/components/ui/StandardEmptyState';

// Or import the base component with variants
import { ScoreIndicator } from '@/components/ui/ScoreIndicator';

// Design tokens (if needed)
import { designTokens, cardStyles, buttonStyles } from '@/lib/design-tokens';
```

---

## 🎨 Color Usage

### Cyan (Primary)
- Primary buttons
- Hover states
- Active indicators
- Score circles (70-84)

### Green (Success/Profit)
- Positive metrics
- Score circles (85-100)
- Success states

### Red (Error/Loss)
- Negative metrics
- Score circles (0-49)
- Error states

### Yellow/Orange (Warning)
- Score circles (50-69)
- Alerts
- Moderate states

---

## ✅ Before/After Examples

### Card Styling

**Before:**
```tsx
<div className="bg-gray-800 p-4 rounded border border-gray-700">
```

**After:**
```tsx
<GlassCard>
  {/* Content */}
</GlassCard>
```

### Score Display

**Before:**
```tsx
<div className="text-2xl font-bold text-cyan-400">{score}</div>
```

**After:**
```tsx
// Choose the right variant for your context
<ScorePill score={score} size="sm" />      // Tables
<ScoreText score={score} size="lg" />      // Cards
<ScoreBar score={score} size="md" />       // Lists
<ScoreArc score={score} size="lg" />       // Details
```

### Empty State

**Before:**
```tsx
<div className="text-center py-8">
  <p>No items found</p>
  <button onClick={create}>Create</button>
</div>
```

**After:**
```tsx
<StandardEmptyState
  icon={Package}
  title="No Items Yet"
  description="Get started by creating your first item"
  actionLabel="Create Item"
  onAction={create}
/>
```

---

## 🔍 Review Checklist

Before pushing changes, verify:

- [ ] All cards use GlassCard component
- [ ] Border radius is 12px everywhere (except buttons = 8px)
- [ ] Padding is consistent (20px for cards)
- [ ] Max 1 primary button per screen
- [ ] All scores use appropriate ScoreIndicator variant (pill/text/bar/arc)
- [ ] All empty states use StandardEmptyState
- [ ] Spacing follows standard scale (8, 12, 20, 32, 48)
- [ ] Colors match design tokens
- [ ] Hover effects are consistent
- [ ] Transitions are 300ms standard

---

Made with ❤️ for Afflyt Pro consistency
