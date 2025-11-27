# Afflyt Pro - Automations Page UX Study (Part 1/5)
## User Research & Insights

**Version**: 1.0  
**Date**: November 27, 2025  
**Focus**: User personas, journeys, pain points

---

## 📋 Part 1 Contents

1. Executive Summary
2. User Personas
3. User Journey Maps
4. Current State Analysis
5. Pain Points & Opportunities

---

## 1. Executive Summary

### 1.1 Design Vision

**Core Principle**: **"Intelligence at your fingertips"**

Transform automation management from a technical chore into an empowering experience where users feel like they're commanding an intelligent agent fleet.

**Key Pillars**:
1. **Clarity**: Always show what's happening and why
2. **Control**: Power users need quick access, beginners need guidance
3. **Confidence**: Visual feedback confirms actions worked
4. **Continuous value**: Show ROI constantly

---

### 1.2 Research Methodology

**Approach**:
- Analysis of similar SaaS automation tools (Zapier, Make, IFTTT)
- Competitor analysis (Amazon Associates Dashboard, affiliate networks)
- Best practices from marketing automation (HubSpot, Mailchimp)
- Heuristic evaluation based on requirements

**Focus Areas**:
- First-time user experience (FTUE)
- Rule creation efficiency
- Performance monitoring clarity
- Tier upgrade triggers
- Mobile usability

---

## 2. User Personas

### 2.1 Persona 1: "Luca - The Side Hustler"

```
📊 DEMOGRAPHICS
Age: 28-35
Location: Milano, Italia
Occupation: Marketing specialist (day job) + affiliate marketer (evenings)
Tech Skill: Medium (comfortable with tools, not a developer)
Income Goal: €500-1500/month extra

🎯 GOALS
- Automate deal posting so he doesn't have to check Amazon manually
- Grow his Telegram channel from 2K to 10K followers
- Spend <1 hour/week managing automations
- Monetize without it feeling like a "second job"

😤 FRUSTRATIONS
- "I don't have time to manually search for deals every day"
- "I'm not sure which settings will actually find good deals"
- "I want to know if my automations are working without logging in daily"
- "Upgrade prompts are annoying when I'm not ready to pay"

💭 BEHAVIORS
- Logs in 2-3x per week
- Checks performance on mobile during commute
- Wants quick wins and instant gratification
- Decision-maker: sees ROI before upgrading

🎨 UI NEEDS
- Clear onboarding ("What should I create first?")
- Templates for common use cases
- Visual performance feedback (graphs, trends)
- Mobile-optimized monitoring
- Notification of important events (rule stopped, great performance)
```

---

### 2.2 Persona 2: "Giulia - The Pro Marketer"

```
📊 DEMOGRAPHICS
Age: 32-45
Location: Roma/Bologna, Italia
Occupation: Full-time affiliate marketer / content creator
Tech Skill: High (comfortable with APIs, webhooks, automation)
Income: €3K-8K/month from affiliates
Manages: 5-8 Telegram channels (different niches)

🎯 GOALS
- Maximize revenue per channel with optimized rules
- A/B test different strategies (price ranges, categories)
- Scale operations without proportional time investment
- Data-driven decisions (what works, what doesn't)

😤 FRUSTRATIONS
- "I need to clone and tweak rules constantly - too many clicks"
- "Can't see comparative performance (which rule is best?)"
- "No bulk operations (pause all, run all)"
- "Missing advanced features (scheduling, conditional logic)"

💭 BEHAVIORS
- Logs in daily, power user
- Uses keyboard shortcuts when available
- Monitors analytics obsessively
- Experiments constantly (create/pause/modify rules)

🎨 UI NEEDS
- Keyboard shortcuts for everything
- Bulk operations (multi-select, batch actions)
- Advanced analytics (trends, comparisons, forecasts)
- Quick edit mode (inline editing without modal)
- Export data (CSV, API access)
```

---

### 2.3 Persona 3: "Marco - The Beginner"

```
📊 DEMOGRAPHICS
Age: 22-28
Location: Any Italian city
Occupation: Student or junior employee
Tech Skill: Low-Medium (uses apps, not tech-savvy)
Experience: Never done affiliate marketing before

🎯 GOALS
- Understand what affiliate marketing is
- Create first automation without breaking anything
- See if this can make money (proof of concept)
- Learn by doing (trial and error OK)

😤 FRUSTRATIONS
- "I don't know what to put in these fields"
- "What's a 'deal score'? Is 70 good or bad?"
- "I created a rule but nothing happened - is it working?"
- "Too many options, I'm overwhelmed"

💭 BEHAVIORS
- Needs hand-holding and tooltips
- Reads documentation when stuck
- Abandons if too complex
- Motivated by quick wins

🎨 UI NEEDS
- Guided onboarding (wizard with explanations)
- Tooltips and inline help everywhere
- Smart defaults (pre-filled values that work)
- Preview mode ("See what this rule will find")
- Success celebrations (first deal published!)
```

---

## 3. User Journey Maps

### 3.1 Journey: First-Time User Creates First Automation

**Scenario**: Luca just signed up (FREE tier) and lands on Automations page

```
STAGE 1: ARRIVAL (Landing on empty Automations page)
├─ Emotion: 😐 Neutral, curious
├─ Thought: "OK, where do I start?"
├─ Action: Looks around, reads page
└─ Pain Point: Empty state with just a "Create" button = confusing

STAGE 2: DISCOVERY (Decides to create first rule)
├─ Emotion: 🤔 Uncertain
├─ Thought: "What should I create? What's a good automation?"
├─ Action: Clicks "Create Automation"
└─ Pain Point: No guidance on what to create

STAGE 3: CREATION (Going through wizard)
├─ Step 1 (Mission): 
│   ├─ Emotion: 😕 Confused
│   ├─ Thought: "What name should I use? What's a good description?"
│   ├─ Action: Types generic name, leaves description empty
│   └─ Pain Point: No examples or suggestions
│
├─ Step 2 (Categories):
│   ├─ Emotion: 🙂 Better (visual, clear)
│   ├─ Thought: "OK, I like tech stuff, I'll pick Electronics"
│   ├─ Action: Selects 2-3 categories
│   └─ Success: Visual selection is intuitive
│
├─ Step 3 (Filters):
│   ├─ Emotion: 😰 Overwhelmed
│   ├─ Thought: "What numbers should I put? Will this work?"
│   ├─ Action: Random values or leaves defaults
│   └─ Pain Point: No guidance on good vs bad values
│
├─ Step 4 (Quality):
│   ├─ Emotion: 😕 Uncertain
│   ├─ Thought: "Is 70 high or low? What if I set it wrong?"
│   ├─ Action: Leaves default (no context)
│   └─ Pain Point: Slider has no labels ("Strict" vs "Relaxed")
│
├─ Step 5 (Destination):
│   ├─ Emotion: 😐 Neutral
│   ├─ Thought: "I only have one channel anyway"
│   ├─ Action: Selects channel
│   └─ Issue: If no channels connected = blocco completo
│
└─ Step 6 (Review):
    ├─ Emotion: 😅 Relieved (almost done)
    ├─ Thought: "Hope this works..."
    ├─ Action: Clicks "Create Automation"
    └─ Pain Point: No preview of what deals will match

STAGE 4: CONFIRMATION (After creation)
├─ Emotion: ✅ Accomplished (created something!)
├─ Thought: "Now what? When will it run?"
├─ Action: Stares at dashboard
└─ Pain Point: No clear next step or expectation setting

STAGE 5: WAITING (Minutes/hours later)
├─ Emotion: 😟 Anxious
├─ Thought: "Is it working? Should I see something?"
├─ Action: Keeps refreshing page
└─ Pain Point: No real-time feedback or status

STAGE 6: FIRST RESULT (Rule executes, publishes deal)
├─ Emotion: 🎉 Excited! (if success) OR 😞 Disappointed (if no deals)
├─ Thought: "It works!" OR "Nothing happened..."
├─ Action: Checks Telegram channel
└─ Critical: Need celebration or explanation
```

**Key Insights**:
- ⚠️ **Friction Point #1**: Empty state lacks guidance
- ⚠️ **Friction Point #2**: Wizard lacks context and smart defaults
- ⚠️ **Friction Point #3**: No preview/testing before activation
- ⚠️ **Friction Point #4**: Long wait time with no feedback
- ✅ **Success Moment**: First deal published (must be celebrated!)

---

### 3.2 Journey: Pro User Optimizing Existing Automation

**Scenario**: Giulia wants to improve a rule that's underperforming

```
STAGE 1: ANALYSIS (Dashboard review)
├─ Emotion: 🤔 Analytical
├─ Thought: "Rule #3 has low conversion - why?"
├─ Action: Looks at stats on card
└─ Pain Point: Limited analytics on card (need detail view)

STAGE 2: DEEP DIVE (Clicks into rule detail)
├─ Emotion: 🔍 Focused
├─ Thought: "Are the filters too strict? Or categories wrong?"
├─ Action: Opens rule settings
└─ Pain Point: Can't see "what deals did this find recently"

STAGE 3: HYPOTHESIS (Forms theory)
├─ Emotion: 💡 Inspired
├─ Thought: "Maybe I should increase maxPrice to €150"
├─ Action: Opens edit mode
└─ Need: Side-by-side comparison (current vs proposed)

STAGE 4: TESTING (Wants to validate before committing)
├─ Emotion: 🧪 Experimental
├─ Thought: "Will this find more/better deals?"
├─ Action: Looks for preview/test button
└─ Pain Point: No preview in edit mode

STAGE 5: ITERATION (Try different settings)
├─ Emotion: 😤 Frustrated (if can't A/B test easily)
├─ Thought: "I have to create duplicate rule to test?"
├─ Action: Duplicates rule, modifies copy
└─ Pain Point: No native A/B testing or variants

STAGE 6: COMPARISON (Both rules running)
├─ Emotion: 😓 Overwhelmed (too many rules now)
├─ Thought: "Which one is actually better?"
├─ Action: Manually compares stats
└─ Pain Point: No comparison view (side-by-side)
```

**Key Insights**:
- ⚠️ **Advanced Need #1**: Historical data (what deals matched)
- ⚠️ **Advanced Need #2**: Preview/test mode (before commit)
- ⚠️ **Advanced Need #3**: A/B testing built-in
- ⚠️ **Advanced Need #4**: Comparative analytics

---

## 4. Current State Analysis

### 4.1 Strengths (What's Already Good)

```
✅ CLEAR DATA MODEL
- Rules have all necessary attributes
- Metrics are well-defined (runs, deals, clicks)
- API endpoints cover all CRUD operations

✅ LOGICAL STRUCTURE
- 6-step wizard is comprehensive
- Categories → Filters → Quality is good progression
- Separation of concerns (config vs monitoring)

✅ TIER DIFFERENTIATION
- Clear limits per tier (# rules, frequency)
- Feature gating makes sense (advanced filters = PRO)

✅ REAL-TIME CAPABILITIES
- Can run manually ("Run Now")
- Live monitoring potential

✅ FLEXIBLE
- Search + filters for organization
- Grid/list view options
- Duplicate for iteration
```

---

### 4.2 Gaps & Opportunities

```
❌ ONBOARDING
Current: Empty state with just a button
Opportunity: Guided first-run experience with templates

❌ CONTEXT & GUIDANCE
Current: No explanations in wizard steps
Opportunity: Tooltips, examples, smart suggestions

❌ FEEDBACK LOOPS
Current: Long wait (6h on FREE) for first result
Opportunity: Preview mode, test with real data

❌ PERFORMANCE INSIGHTS
Current: Just numbers (156 deals, 2340 clicks)
Opportunity: Trends, benchmarks ("20% above average"), recommendations

❌ BULK OPERATIONS
Current: One-by-one management
Opportunity: Multi-select, batch pause/resume, templates

❌ COLLABORATION
Current: Solo experience
Opportunity: Share configs, community templates

❌ MOBILE EXPERIENCE
Current: Probably desktop-focused
Opportunity: Mobile-optimized monitoring (read-only on phone)

❌ GAMIFICATION
Current: Just utility
Opportunity: Streaks, achievements, leaderboard

❌ LEARNING RESOURCES
Current: No inline help
Opportunity: Contextual tips, video tutorials, best practices
```

---

## 5. Pain Points & Solutions

### 5.1 Pain Point: "I don't know what to create first"

**Problem**: Empty state paralysis

**User Quote**: *"I'm staring at an empty dashboard with a 'Create' button. What should I create?"*

**Solution 1: Template Library**
```
Instead of empty state, show:

┌────────────────────────────────────────────────────┐
│  🚀 Starter Templates                              │
├────────────────────────────────────────────────────┤
│                                                    │
│  [📱 Tech Deals Under €50]                        │
│  Electronics & Computers                           │
│  Perfect for beginners • ~15 deals/day            │
│  [Use Template →]                                  │
│                                                    │
│  [👗 Fashion Deals 40%+ Off]                      │
│  Clothing & Accessories                            │
│  High volume • ~25 deals/day                      │
│  [Use Template →]                                  │
│                                                    │
│  [🏠 Home & Kitchen Bestsellers]                  │
│  Home Improvement                                  │
│  Popular niche • ~10 quality deals/day            │
│  [Use Template →]                                  │
│                                                    │
│  [✨ Create Custom]                               │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Benefits**:
- Zero learning curve (start with proven config)
- Instant success (templates are pre-optimized)
- Educational (user sees what works, can modify later)

---

### 5.2 Pain Point: "I don't know if my settings are good"

**Problem**: No validation or feedback during wizard

**User Quote**: *"I put maxPrice: €100, minDiscount: 30% - is that too strict? Too loose?"*

**Solution 1: Live Preview Counter**
```
In wizard Step 3 (Filters), show real-time count:

┌────────────────────────────────────────────────────┐
│  Filters (Step 3/6)                                │
├────────────────────────────────────────────────────┤
│                                                    │
│  Max Price: €100     [slider]                     │
│  Min Discount: 30%   [slider]                     │
│  Min Rating: 4.0★    [slider]                     │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 📊 Estimated Results                         │ │
│  │                                              │ │
│  │ With these filters, we found:                │ │
│  │ ~12 deals/day in your selected categories   │ │
│  │                                              │ │
│  │ ⚠️ Too few? Try increasing maxPrice or      │ │
│  │    reducing minDiscount                      │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Solution 2: Smart Suggestions**
```
┌────────────────────────────────────────────────────┐
│  💡 Recommendations                                │
├────────────────────────────────────────────────────┤
│  Popular for Electronics:                          │
│  • Max Price: €50-150                             │
│  • Min Discount: 20-30%                           │
│  • Min Rating: 4.0★                               │
│  [Apply These →]                                   │
└────────────────────────────────────────────────────┘
```

---

### 5.3 Pain Point: "Nothing happened after I created it"

**Problem**: Long wait time (6h on FREE tier) with no feedback

**User Quote**: *"I created a rule 2 hours ago. Is it working? Did I do something wrong?"*

**Solution 1: Immediate Test Run**
```
After creation, show modal:

┌────────────────────────────────────────────────────┐
│  ✅ Automation Created Successfully!               │
├────────────────────────────────────────────────────┤
│                                                    │
│  Your automation "Hot Deals Elettronica" is now   │
│  active and will run automatically every 6 hours.  │
│                                                    │
│  Next scheduled run: Today at 16:00               │
│                                                    │
│  Want to see it in action right now?              │
│                                                    │
│  [🧪 Run Test Now] [Later]                        │
│                                                    │
│  A test run won't publish deals to your channel,  │
│  but shows you what deals match your filters.     │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Solution 2: Status Timeline**
```
On dashboard card, show timeline:

┌────────────────────────────────────────────────────┐
│  Hot Deals Elettronica             [ON] [...]     │
├────────────────────────────────────────────────────┤
│                                                    │
│  ⏱️ Status Timeline:                              │
│                                                    │
│  ✅ 10:30 - Created                               │
│  ⏳ 16:00 - First run scheduled                   │
│  💤 22:00 - Second run scheduled                  │
│                                                    │
│  Tip: Runs happen every 6 hours. Upgrade to PRO   │
│  for runs every 2 hours!                          │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### 5.4 Pain Point: "Too many clicks to modify a rule"

**Problem**: Edit requires opening wizard again (6 steps)

**User Quote**: *"I just want to change the price from €100 to €150, why do I need to go through the whole wizard?"*

**Solution: Quick Edit Mode**
```
On dashboard, card has "Quick Edit" dropdown:

┌────────────────────────────────────────────────────┐
│  Hot Deals Elettronica             [ON] [⋮]       │
│                                     └─┬─┘          │
│  Electronics, Computers               │            │
│  Runs: 47 • Deals: 156               │            │
│                                      ▼            │
│  ┌──────────────────────────────────────┐         │
│  │ 👁️  View Details                    │         │
│  │ ⚡ Quick Edit                        │ ← NEW!  │
│  │ 🧪 Run Test Now                     │         │
│  │ 📋 Duplicate                        │         │
│  │ ⏸️  Pause                           │         │
│  │ 🗑️  Delete                          │         │
│  └──────────────────────────────────────┘         │
└────────────────────────────────────────────────────┘

Click "Quick Edit" → Inline form expands:

┌────────────────────────────────────────────────────┐
│  Hot Deals Elettronica                    [Save]  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Name: [Hot Deals Elettronica____________]        │
│                                                    │
│  Max Price:  €100  [slider] → €150               │
│  Min Discount: 20% [slider]                       │
│  Min Rating: 4.0★  [slider]                       │
│                                                    │
│  [Cancel] [Save Changes]                          │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Benefits**:
- Single-click access to common edits
- No modal/wizard overhead
- Inline validation and preview

---

### 5.5 Pain Point: "I can't tell which rule is performing best"

**Problem**: No comparative view or sorting by performance

**User Quote**: *"I have 3 rules running. Which one should I focus on? Which should I pause?"*

**Solution 1: Performance Ranking**
```
Add sorting options:

[Sort by: Performance ▼]
          ├─ Name
          ├─ Created Date
          ├─ Last Run
          ├─ Total Deals
          ├─ Click Rate (CTR)
          └─ Revenue (if tracked)

When sorted by Performance, show rank badges:

┌────────────────────────────────────────────────────┐
│  🥇 #1  Hot Deals Elettronica          [ON] [...]  │
│  CTR: 7.2% • €48/day revenue                       │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  🥈 #2  Fashion Deals 40% Off          [ON] [...]  │
│  CTR: 6.1% • €31/day revenue                       │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  🥉 #3  Home Bestsellers               [ON] [...]  │
│  CTR: 4.8% • €22/day revenue                       │
└────────────────────────────────────────────────────┘
```

**Solution 2: Insights & Recommendations**
```
Add "Insights" section above cards:

┌────────────────────────────────────────────────────┐
│  📊 Performance Insights                           │
├────────────────────────────────────────────────────┤
│                                                    │
│  💡 "Hot Deals Elettronica" is your top performer │
│     Consider creating similar rules for other     │
│     tech categories.                              │
│                                                    │
│  ⚠️  "Home Bestsellers" hasn't found deals in 3   │
│     days. Filters may be too strict.              │
│     [Review Filters →]                            │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Summary: Top 5 Critical Pain Points

| # | Pain Point | Impact | Solution Priority |
|---|-----------|--------|-------------------|
| 1 | Empty state paralysis | High (blocks first use) | P0 - Template library |
| 2 | No validation in wizard | High (bad configs) | P0 - Live preview |
| 3 | Long wait, no feedback | High (user anxiety) | P0 - Test mode |
| 4 | Too many clicks to edit | Medium (power user friction) | P1 - Quick edit |
| 5 | No performance comparison | Medium (optimization hard) | P1 - Ranking/insights |

---

## Next Steps

Continue to **Part 2: Information Architecture & User Flows** for:
- Complete page structure
- Detailed user flows (with decision trees)
- Navigation patterns
- State management strategy

---

**End of Part 1**
