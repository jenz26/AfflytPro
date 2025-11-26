# Afflyt Pro - Brand Kit v1.0
## Complete Visual Identity System

---

## 📋 Table of Contents

1. [Brand Overview](#brand-overview)
2. [Logo System](#logo-system)
3. [Typography](#typography)
4. [Color Palette](#color-palette)
5. [Iconography](#iconography)
6. [Grid & Spacing](#grid--spacing)
7. [Brand Voice & Messaging](#brand-voice--messaging)
8. [Usage Guidelines](#usage-guidelines)
9. [Asset Export Specifications](#asset-export-specifications)
10. [Marketing Templates](#marketing-templates)

---

## 1. Brand Overview

### Brand Essence

**Name**: Afflyt Pro  
**Tagline**: "Intelligence-Driven Affiliate Marketing"  
**Positioning**: Next-generation Amazon affiliate automation platform for creators and marketers who demand professional tools and insights.

**Brand Personality**:
- **Professional**: Enterprise-grade reliability
- **Intelligent**: AI-powered insights and automation
- **Efficient**: Zero-friction workflow
- **Transparent**: Clear analytics, no hidden metrics
- **Empowering**: Tools that multiply your impact

**Target Audience**:
- Tech-savvy affiliate marketers (25-45 years)
- Content creators scaling their income
- Digital agencies managing multiple campaigns
- E-commerce entrepreneurs

---

## 2. Logo System

### 2.1 Primary Logo (Full)

```
┌────────────────────────────────────┐
│  [Icon]  AFFLYT PRO                │
│           Intelligence-Driven       │
└────────────────────────────────────┘

Components:
- Icon: Arrow-A symbol (cyan gradient)
- Wordmark: "AFFLYT PRO" in Satoshi Bold
- Tagline: "Intelligence-Driven" in Satoshi Regular (optional)
```

**Specifications**:
```typescript
Logo {
  Icon: {
    size: 40px × 40px (1:1 ratio)
    colors: Gradient(#06B6D4 → #3B82F6, 135deg)
    style: "Geometric, bold, minimal"
  },
  
  Wordmark: {
    font: "Satoshi-Bold"
    size: 24px
    tracking: -0.02em (tight)
    color: "#FFFFFF" (light mode) | "#0A0E1A" (dark mode)
  },
  
  Tagline: {
    font: "Satoshi-Regular"
    size: 10px
    tracking: 0.05em (wide)
    color: "#9CA3AF"
    textTransform: "uppercase"
  }
}
```

### 2.2 Logo Variations

#### **A. Horizontal Lockup** (Primary)
```
[Icon] AFFLYT PRO
       Intelligence-Driven
```
**Use**: Website header, presentations, business cards  
**Minimum width**: 180px  
**Aspect ratio**: ~4:1

#### **B. Stacked Lockup**
```
    [Icon]
  AFFLYT PRO
Intelligence-Driven
```
**Use**: Square formats, social media profiles  
**Minimum width**: 120px  
**Aspect ratio**: 1:1.2

#### **C. Icon Only**
```
[Icon]
```
**Use**: Favicon, app icon, social media avatar  
**Minimum size**: 16px × 16px  
**Formats**: Square (1:1)

#### **D. Wordmark Only**
```
AFFLYT PRO
```
**Use**: Internal documents, email signatures (when icon not needed)  
**Minimum width**: 100px

### 2.3 Logo Colors

#### **Primary (Dark Backgrounds)**
```css
Icon: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)
Wordmark: #FFFFFF
Tagline: #9CA3AF
```

#### **Light Mode (White/Light Backgrounds)**
```css
Icon: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)
Wordmark: #0A0E1A
Tagline: #6B7280
```

#### **Monochrome (When Color Not Available)**
```css
/* Dark variant */
All elements: #FFFFFF

/* Light variant */
All elements: #0A0E1A
```

#### **White Knockout** (Colored Backgrounds)
```css
All elements: #FFFFFF
Use: When background is cyan, blue, or any brand color
```

### 2.4 Clear Space & Minimum Size

**Clear Space Rule**:
```
Clear space = Height of "A" in AFFLYT
Minimum = 0.5x logo height on all sides

Example:
If logo is 40px tall → 20px clear space around
```

**Minimum Sizes**:
```
Digital:
- Horizontal: 180px width
- Stacked: 120px width  
- Icon only: 16px × 16px

Print:
- Horizontal: 50mm width
- Stacked: 35mm width
- Icon only: 8mm × 8mm
```

### 2.5 Logo Don'ts

❌ **Never**:
- Change the gradient colors
- Rotate or skew the logo
- Add effects (drop shadow, outer glow, etc.)
- Place on busy backgrounds without container
- Stretch or distort proportions
- Outline the logo
- Recreate or redraw the logo
- Use gradients other than official ones

✅ **Always**:
- Use official logo files
- Maintain aspect ratio when scaling
- Ensure sufficient contrast with background
- Use appropriate variation for context

---

## 3. Typography

### 3.1 Brand Font: Space Grotesk

**Why Space Grotesk?**
- Modern geometric sans-serif with tech personality
- Excellent readability at all sizes
- Variable font for performance
- Wide weight range (Light to Bold)
- Professional yet futuristic feel - matches our "Intelligence-Driven" positioning

**Font Family**:
```css
font-family: 'Space Grotesk', -apple-system, system-ui, sans-serif;
```

**CSS Variable**: `--font-space-grotesk`

**Download/Import**: Available via Google Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 3.1.1 Secondary Font: Inter

**Why Inter?**
- Highly legible system-like font
- Perfect for long-form body text
- Excellent at small sizes

**Font Family**:
```css
font-family: 'Inter', -apple-system, system-ui, sans-serif;
```

**CSS Variable**: `--font-inter`

### 3.2 Font Weights & Usage

| Weight      | Value | Use Case                                    |
|-------------|-------|---------------------------------------------|
| Light       | 300   | Large display text (rarely)                 |
| Regular     | 400   | Body text, paragraphs, descriptions         |
| Medium      | 500   | Buttons, labels, navigation                 |
| SemiBold    | 600   | Component headers, emphasis                 |
| Bold        | 700   | Headings, emphasis, wordmark                |

### 3.3 Type Scale

```typescript
// Desktop Scale
const TYPE_SCALE = {
  display: {
    size: '4rem',      // 64px - Hero titles
    lineHeight: 1.1,
    weight: 900,
    letterSpacing: '-0.02em',
  },
  h1: {
    size: '3rem',      // 48px - Page titles
    lineHeight: 1.2,
    weight: 700,
    letterSpacing: '-0.015em',
  },
  h2: {
    size: '2.25rem',   // 36px - Section headers
    lineHeight: 1.3,
    weight: 700,
    letterSpacing: '-0.01em',
  },
  h3: {
    size: '1.875rem',  // 30px - Subsection headers
    lineHeight: 1.3,
    weight: 700,
    letterSpacing: '-0.01em',
  },
  h4: {
    size: '1.5rem',    // 24px - Card headers
    lineHeight: 1.4,
    weight: 700,
    letterSpacing: '0',
  },
  h5: {
    size: '1.25rem',   // 20px - Component headers
    lineHeight: 1.4,
    weight: 600,
    letterSpacing: '0',
  },
  h6: {
    size: '1.125rem',  // 18px - Small headers
    lineHeight: 1.4,
    weight: 600,
    letterSpacing: '0',
  },
  body: {
    size: '1rem',      // 16px - Body text
    lineHeight: 1.6,
    weight: 400,
    letterSpacing: '0',
  },
  small: {
    size: '0.875rem',  // 14px - Captions, labels
    lineHeight: 1.5,
    weight: 400,
    letterSpacing: '0',
  },
  xs: {
    size: '0.75rem',   // 12px - Metadata, tags
    lineHeight: 1.4,
    weight: 500,
    letterSpacing: '0.02em',
  },
}

// Mobile Scale (responsive adjustment)
@media (max-width: 768px) {
  display: 2.5rem    // 40px
  h1: 2rem           // 32px
  h2: 1.75rem        // 28px
  h3: 1.5rem         // 24px
  // Body sizes remain same
}
```

### 3.4 Monospace Font (Data Display)

**Font**: JetBrains Mono  
**Use**: Numbers, codes, ASINs, timestamps, technical data

```css
font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

**Usage Examples**:
```html
<!-- Revenue display -->
<span class="font-mono text-2xl font-bold">€342.50</span>

<!-- ASIN code -->
<code class="font-mono text-sm text-cyan-400">B0C9XY1234</code>

<!-- Timestamp -->
<time class="font-mono text-xs text-gray-500">2025-11-26 14:30:15</time>
```

---

## 4. Color Palette

### 4.1 Primary Colors

#### **Afflyt Cyan** (Brand Primary)
```css
--afflyt-cyan-50:  #E6FFFE   /* Lightest - hover states */
--afflyt-cyan-100: #B3FFFC   /* Very light - backgrounds */
--afflyt-cyan-200: #80FFF9   /* Light - borders */
--afflyt-cyan-300: #4DFFF6   /* Medium light */
--afflyt-cyan-400: #1AFFF3   /* Medium */
--afflyt-cyan-500: #00E5E0   /* Primary - main brand color */
--afflyt-cyan-600: #00B8B3   /* Darker - hover */
--afflyt-cyan-700: #008A86   /* Dark */
--afflyt-cyan-800: #005D5A   /* Very dark */
--afflyt-cyan-900: #002F2D   /* Darkest */
```

**Primary Use**: Logo, CTAs, links, accents, highlights

#### **Electric Blue** (Gradient Partner)
```css
--blue-50:  #EFF6FF
--blue-100: #DBEAFE
--blue-200: #BFDBFE
--blue-300: #93C5FD
--blue-400: #60A5FA
--blue-500: #3B82F6   /* Secondary brand color */
--blue-600: #2563EB   /* Darker - hover states */
--blue-700: #1D4ED8
--blue-800: #1E40AF
--blue-900: #1E3A8A
```

**Use**: Gradients with cyan, secondary CTAs, data visualization

#### **Afflyt Plasma** (Premium/Pro Features)
```css
--afflyt-plasma-400: #B794F4
--afflyt-plasma-500: #9F7AEA   /* Accent for pro features */
--afflyt-plasma-600: #805AD5   /* Hover */
```

**Use**: Pro badges, premium features, accent highlights

#### **Afflyt Profit** (Success/Green)
```css
--afflyt-profit-400: #48BB78
--afflyt-profit-500: #38A169   /* Primary success */
--afflyt-profit-600: #2F855A   /* Hover */
```

**Use**: Revenue indicators, positive metrics, success states

### 4.2 Semantic Colors

#### **Success** (Use afflyt-profit or standard green)
```css
--green-400: #4ADE80
--green-500: #10B981   /* Primary success */
--green-600: #059669   /* Hover */
/* Or use --afflyt-profit-* for revenue-specific success */
```
**Use**: Confirmations, positive metrics, active status

#### **Warning** (Amber)
```css
--amber-400: #FBBF24
--amber-500: #F59E0B   /* Primary warning */
--amber-600: #D97706   /* Hover */
```
**Use**: Warnings, tier badges, attention alerts

#### **Error** (Red)
```css
--red-400: #F87171
--red-500: #EF4444     /* Primary error */
--red-600: #DC2626     /* Hover */
```
**Use**: Errors, destructive actions, critical alerts

#### **Info/Premium** (Use afflyt-plasma)
```css
--afflyt-plasma-400: #B794F4
--afflyt-plasma-500: #9F7AEA   /* Primary info/premium */
--afflyt-plasma-600: #805AD5   /* Hover */
```
**Use**: Info messages, pro features, special badges, premium indicators

### 4.3 Neutral Colors (Dark Theme)

#### **Backgrounds** (Afflyt Dark System)
```css
--afflyt-dark-50:  #1A1B23   /* Card background */
--afflyt-dark-100: #13141B   /* Base background (primary) */
--afflyt-dark-200: #0C0D13   /* Deep background */
--afflyt-dark-300: #23242E   /* Hover state */
--afflyt-dark-400: #2D2E3A   /* Active state */
```

#### **Text**
```css
--text-primary:   #FFFFFF   /* Pure white - headings */
--text-secondary: #D1D5DB   /* Cool gray - body */
--text-tertiary:  #9CA3AF   /* Muted gray - captions */
--text-accent:    #00E5E0   /* Afflyt cyan - links */
```

#### **Borders**
```css
--border-subtle:  #23242E   /* Barely visible */
--border-default: #374151   /* Standard borders */
--border-strong:  #4B5563   /* Emphasis borders */
--border-neon:    #00E5E0   /* Active/focus - afflyt cyan */
```

#### **Glass Effects**
```css
--afflyt-glass-white:  rgba(255, 255, 255, 0.05);
--afflyt-glass-cyan:   rgba(0, 229, 224, 0.1);
--afflyt-glass-border: rgba(0, 229, 224, 0.2);
```

### 4.4 Gradient System

#### **Primary Gradient** (Afflyt Cyber)
```css
/* Tailwind: bg-gradient-to-r from-afflyt-cyan-400 to-afflyt-cyan-600 */
background: linear-gradient(to right, #1AFFF3, #00B8B3);

/* Alternative with blue (for CTAs): */
/* Tailwind: bg-gradient-to-r from-afflyt-cyan-500 to-blue-500 */
background: linear-gradient(to right, #00E5E0, #3B82F6);
```
**Use**: Primary buttons, CTAs, hero sections

#### **Premium Gradient** (Plasma)
```css
/* Tailwind: bg-gradient-to-r from-afflyt-plasma-500 to-afflyt-plasma-600 */
background: linear-gradient(to right, #9F7AEA, #805AD5);

/* Alternative purple-pink: */
/* Tailwind: bg-gradient-to-r from-purple-500 to-pink-500 */
background: linear-gradient(to right, #A855F7, #EC4899);
```
**Use**: Pro features, premium badges, upgrade CTAs

#### **Alert Gradient**
```css
/* Tailwind: bg-gradient-to-r from-yellow-500 to-orange-500 */
background: linear-gradient(to right, #EAB308, #F97316);
```
**Use**: Warning states, urgent notifications, limit warnings

#### **Success Gradient**
```css
/* Tailwind: bg-gradient-to-r from-afflyt-profit-500 to-afflyt-cyan-500 */
background: linear-gradient(to right, #38A169, #00E5E0);
```
**Use**: Success messages, achievement badges, revenue indicators

#### **Subtle Overlay** (Glassmorphism)
```css
background: rgba(26, 27, 35, 0.8);  /* afflyt-dark-50 with opacity */
backdrop-filter: blur(12px);
border: 1px solid rgba(0, 229, 224, 0.2);  /* afflyt-glass-border */
```
**Use**: Modal overlays, dropdown menus, tooltips

### 4.5 Color Usage Rules

**Accessibility**:
- All text on background must meet WCAG AA (4.5:1 contrast)
- Interactive elements: AAA preferred (7:1)
- Use color contrast checker for custom combinations

**Hierarchy**:
1. **Primary action**: Cyan gradient button
2. **Secondary action**: Outline button (cyan border)
3. **Tertiary action**: Ghost button (text only)

**Data Visualization**:
```typescript
const CHART_COLORS = [
  '#00E5E0', // Afflyt Cyan (primary)
  '#3B82F6', // Blue
  '#38A169', // Afflyt Profit Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#9F7AEA', // Afflyt Plasma Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
]
```

---

## 5. Iconography

### 5.1 Icon System: Lucide React

**Library**: Lucide Icons (https://lucide.dev)  
**Style**: Outline, geometric, consistent stroke  
**Stroke Width**: 2px (default)

**Why Lucide?**
- 1000+ icons, growing library
- React-native support
- Tree-shakeable (bundle size optimized)
- Consistent design language
- Open source, free

### 5.2 Icon Sizing

```typescript
const ICON_SIZES = {
  xs: '12px',   // Tags, badges
  sm: '16px',   // Inline text, small buttons
  md: '20px',   // Default UI, navigation
  lg: '24px',   // Headers, prominent buttons
  xl: '32px',   // Hero sections, empty states
  '2xl': '48px', // Large illustrations
}
```

### 5.3 Core Icon Set

**Navigation**:
- Home: `<Home />`
- Dashboard: `<LayoutDashboard />`
- Analytics: `<BarChart3 />`
- Settings: `<Settings />`
- Help: `<HelpCircle />`

**Actions**:
- Add: `<Plus />`
- Edit: `<Pencil />`
- Delete: `<Trash2 />`
- Save: `<Check />`
- Cancel: `<X />`
- More: `<MoreVertical />`

**Communication**:
- Send: `<Send />`
- Message: `<MessageCircle />`
- Mail: `<Mail />`
- Bell: `<Bell />`

**Data & Analytics**:
- Chart Line: `<TrendingUp />`
- Chart Bar: `<BarChart3 />`
- Target: `<Target />`
- Zap: `<Zap />`

**Status**:
- Success: `<CheckCircle2 />`
- Warning: `<AlertCircle />`
- Error: `<XCircle />`
- Info: `<Info />`

### 5.4 Icon Colors

```typescript
// Default (inherit text color)
className="text-current"

// Semantic colors
className="text-green-400"   // Success
className="text-amber-400"   // Warning
className="text-red-400"     // Error
className="text-cyan-400"    // Brand accent
```

### 5.5 Custom Icon Creation

If creating custom icons:
- 24×24 viewBox
- 2px stroke width
- Round line caps
- Round line joins
- Optical centering (not mathematical)

---

## 6. Grid & Spacing

### 6.1 Spacing Scale (8px Base)

```typescript
const SPACING = {
  px: '1px',
  0: '0',
  0.5: '2px',    // 0.125rem
  1: '4px',      // 0.25rem
  1.5: '6px',    // 0.375rem
  2: '8px',      // 0.5rem  ← Base unit
  3: '12px',     // 0.75rem
  4: '16px',     // 1rem
  5: '20px',     // 1.25rem
  6: '24px',     // 1.5rem
  8: '32px',     // 2rem
  10: '40px',    // 2.5rem
  12: '48px',    // 3rem
  16: '64px',    // 4rem
  20: '80px',    // 5rem
  24: '96px',    // 6rem
}
```

**Usage Guidelines**:
- Component padding: 16px (4) or 24px (6)
- Card gaps: 16px or 24px
- Section spacing: 32px (8) to 64px (16)
- Page margins: 24px (6) mobile, 48px (12) desktop

### 6.2 Grid System

**Desktop (>1024px)**:
```css
max-width: 1440px
columns: 12
gutter: 24px
margin: 48px
```

**Tablet (768px - 1023px)**:
```css
max-width: 100%
columns: 8
gutter: 20px
margin: 32px
```

**Mobile (<767px)**:
```css
max-width: 100%
columns: 4
gutter: 16px
margin: 16px
```

### 6.3 Breakpoints

```typescript
const BREAKPOINTS = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
}
```

---

## 7. Brand Voice & Messaging

### 7.1 Brand Voice Attributes

**Professional yet Approachable**
- ✅ "Automate your affiliate marketing with intelligence"
- ❌ "AI stuff that does marketing things"

**Clear, Not Jargon-Heavy**
- ✅ "Track every click and conversion in real-time"
- ❌ "Leverage synergistic touchpoint analytics"

**Confident, Not Arrogant**
- ✅ "Built for marketers who demand better tools"
- ❌ "Other platforms suck, we're the only good one"

**Empowering, Not Condescending**
- ✅ "You're in control. We're here to amplify your work."
- ❌ "Let us do everything for you, you don't need to understand"

### 7.2 Key Messages

**Primary Value Proposition**:
> "Afflyt Pro combines intelligent automation with deep analytics to help affiliate marketers maximize revenue without the manual grind."

**Key Benefits** (3 pillars):
1. **Automation**: 24/7 deal discovery and posting
2. **Intelligence**: AI-powered insights and recommendations
3. **Control**: Full transparency with BYOK (Bring Your Own Keys)

**Differentiation**:
- "Unlike basic automation tools, Afflyt gives you *intelligence*"
- "Built by affiliate marketers, for affiliate marketers"
- "Your keys, your data, your control"

### 7.3 Tone Guidelines

**Do**:
- Use active voice ("Afflyt automates...")
- Be specific with numbers ("847 deals published")
- Show, don't tell ("See which channels drive 80% of revenue")
- Use power words: "intelligence," "automate," "maximize," "control"

**Don't**:
- Use marketing fluff ("revolutionary," "game-changing")
- Make unverifiable claims ("10x your income instantly!")
- Use complex jargon unnecessarily
- Be cutesy or overly casual

### 7.4 Writing Examples

**Dashboard Welcome**:
✅ Good: "Welcome back, Marco. You've earned €342.50 this week."  
❌ Bad: "Hey there! Ready to crush it today? 🚀"

**Feature Description**:
✅ Good: "AI-powered insights identify your top-performing channels and suggest optimization strategies."  
❌ Bad: "Our super-smart AI analyzes stuff and tells you things!"

**Error Message**:
✅ Good: "Connection to Telegram failed. Check your bot token and try again."  
❌ Bad: "Oops! Something went wrong. Please try again later."

---

## 8. Usage Guidelines

### 8.1 Logo Placement

**Website Header**:
```
Position: Top-left
Size: 40px height (horizontal lockup)
Background: Transparent or dark
Linking: Always link to homepage
```

**Marketing Materials**:
```
Position: Consistent placement (top-left or center)
Size: Prominent but not overwhelming (10-15% of page width)
Spacing: Minimum 40px from edges
```

**Social Media**:
```
Profile Picture: Icon only, square crop
Cover Photo: Horizontal lockup, centered
```

### 8.2 Color Application

**Primary Actions**:
- Buttons: Cyan gradient
- Links: Cyan-500
- Hover states: Cyan-600

**Backgrounds**:
- Main: bg-primary (#0A0E1A)
- Cards: bg-secondary (#111827)
- Elevated: bg-tertiary (#1F2937)

**Text Hierarchy**:
- Headlines: text-primary (#F9FAFB)
- Body: text-secondary (#D1D5DB)
- Captions: text-tertiary (#9CA3AF)

### 8.3 Typography Application

**Headings**:
```css
h1, h2, h3: Satoshi Bold (700)
h4, h5, h6: Satoshi SemiBold (600)
All: Tight letter-spacing (-0.015em to -0.01em)
```

**Body Text**:
```css
Body: Satoshi Regular (400)
Emphasized: Satoshi Medium (500)
Line-height: 1.6 (optimal readability)
```

**UI Elements**:
```css
Buttons: Satoshi Medium (500)
Labels: Satoshi Medium (500)
Input text: Satoshi Regular (400)
```

---

## 9. Asset Export Specifications

### 9.1 Logo Files Required

#### **Vector Formats** (Design & Scalability)
```
✅ logo-horizontal.svg         (Primary)
✅ logo-stacked.svg             (Square format)
✅ logo-icon.svg                (Icon only)
✅ logo-wordmark.svg            (Text only)
✅ logo-horizontal-white.svg    (White version)
✅ logo-horizontal-dark.svg     (Dark version)

Optional:
- logo-horizontal.ai            (Adobe Illustrator)
- logo-horizontal.eps           (Print)
```

#### **Raster Formats** (Web & App)

**PNG (Transparent Background)**:
```
Logo Horizontal:
- logo-horizontal@1x.png   (360px width)
- logo-horizontal@2x.png   (720px width)
- logo-horizontal@3x.png   (1080px width)

Logo Icon:
- logo-icon-16.png
- logo-icon-32.png
- logo-icon-64.png
- logo-icon-128.png
- logo-icon-256.png
- logo-icon-512.png
- logo-icon-1024.png       (App store)
```

**Favicon Set**:
```
✅ favicon.ico                  (16×16, 32×32, 48×48 multi-size)
✅ favicon-16x16.png
✅ favicon-32x32.png
✅ apple-touch-icon.png         (180×180)
✅ android-chrome-192x192.png
✅ android-chrome-512x512.png
```

**Social Media**:
```
✅ og-image.png                 (1200×630, OpenGraph)
✅ twitter-card.png             (1200×600, Twitter)
✅ profile-picture.png          (400×400, square)
✅ linkedin-banner.png          (1584×396)
✅ youtube-banner.png           (2560×1440)
```

### 9.2 Export Settings

**SVG**:
```
Format: SVG 1.1
Decimal places: 2
Minify: Yes
Remove metadata: Yes
Outline strokes: No (keep as strokes)
Responsive: Yes (viewBox, no fixed width/height)
```

**PNG**:
```
Color mode: RGB
Bit depth: 32-bit (with alpha)
Compression: Maximum (lossless)
Interlaced: No
```

**Favicon.ico**:
```
Sizes: 16×16, 32×32, 48×48 (embedded)
Color depth: 32-bit
Compression: PNG
```

### 9.3 File Organization

```
brand-kit/
├── logos/
│   ├── vector/
│   │   ├── logo-horizontal.svg
│   │   ├── logo-stacked.svg
│   │   ├── logo-icon.svg
│   │   └── logo-wordmark.svg
│   ├── png/
│   │   ├── horizontal/
│   │   │   ├── logo-horizontal@1x.png
│   │   │   ├── logo-horizontal@2x.png
│   │   │   └── logo-horizontal@3x.png
│   │   └── icon/
│   │       ├── logo-icon-16.png
│   │       ├── logo-icon-32.png
│   │       └── ...
│   └── favicon/
│       ├── favicon.ico
│       ├── favicon-16x16.png
│       └── ...
├── colors/
│   ├── palette.ase             (Adobe Swatch)
│   ├── palette.scss            (Sass variables)
│   └── tailwind.config.js      (Tailwind config)
├── typography/
│   ├── satoshi/
│   │   ├── Satoshi-Regular.woff2
│   │   ├── Satoshi-Medium.woff2
│   │   ├── Satoshi-Bold.woff2
│   │   └── Satoshi-Variable.woff2
│   └── jetbrains-mono/
│       └── JetBrainsMono-Regular.woff2
├── icons/
│   └── custom-icons.svg        (If any custom icons)
└── templates/
    ├── social-media/
    ├── presentations/
    └── marketing/
```

---

## 10. Marketing Templates

### 10.1 Social Media Templates

#### **Instagram Post** (1080×1080)
```
Background: Dark gradient (#0A0E1A → #1F2937)
Logo: Top-left, 80px
Content area: Center, 800×800
Font: Satoshi Bold, 48px headline
CTA: Bottom, "afflyt.pro"
```

#### **Twitter/X Post** (1200×675)
```
Background: Dark with cyan accent
Logo: Icon only, 64px, top-left
Message: Center-aligned, max 2 lines
Font: Satoshi Bold, 42px
Handle: @afflytpro, bottom-right
```

#### **LinkedIn Post** (1200×627)
```
Layout: Split (40% visual, 60% text)
Background: Professional dark blue gradient
Logo: Horizontal, top
Headlines: Satoshi Bold, 36px
Body: Satoshi Regular, 18px
```

### 10.2 Email Signature

```html
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Satoshi, Arial, sans-serif; font-size: 14px; color: #0A0E1A;">
  <tr>
    <td style="padding-bottom: 10px;">
      <img src="https://afflyt.pro/logo-email.png" alt="Afflyt Pro" width="120" height="40" style="display: block; border: 0;">
    </td>
  </tr>
  <tr>
    <td style="font-weight: 700; font-size: 16px;">
      Marco Contin
    </td>
  </tr>
  <tr>
    <td style="color: #6B7280;">
      Founder & CEO, Afflyt Pro
    </td>
  </tr>
  <tr>
    <td style="padding-top: 8px;">
      <a href="mailto:marco@afflyt.pro" style="color: #06B6D4; text-decoration: none;">marco@afflyt.pro</a>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 4px;">
      <a href="https://afflyt.pro" style="color: #06B6D4; text-decoration: none;">afflyt.pro</a>
    </td>
  </tr>
</table>
```

### 10.3 Presentation Slide Template

**Title Slide**:
```
Background: Dark (#0A0E1A)
Logo: Large, centered
Title: Satoshi Black, 72px
Subtitle: Satoshi Regular, 24px, #9CA3AF
```

**Content Slide**:
```
Background: Dark with subtle grid pattern
Logo: Small, top-right
Title: Satoshi Bold, 48px, left-aligned
Body: Satoshi Regular, 20px
Accent: Cyan highlights on key data
```

**Data Slide**:
```
Background: Dark
Charts: Cyan/Blue color scheme
Numbers: Satoshi Bold (large), monospace (detail)
Labels: Satoshi Regular, 16px
```

### 10.4 Business Card

**Front**:
```
Size: 85mm × 55mm (standard EU)
Background: Dark (#0A0E1A) with cyan accent corner
Logo: Horizontal, top-left
Name: Satoshi Bold, 18pt
Title: Satoshi Regular, 12pt
Contact: Satoshi Regular, 10pt
```

**Back**:
```
Background: Cyan gradient
Tagline: "Intelligence-Driven Affiliate Marketing"
Font: Satoshi Bold, 14pt, White
QR Code: White, bottom-right (to afflyt.pro)
```

---

## 11. Digital Implementation

### 11.1 Web Font Loading

```html
<!-- In <head> -->
<link rel="preconnect" href="https://api.fontshare.com">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet">

<!-- Or self-hosted -->
<style>
  @font-face {
    font-family: 'Satoshi';
    src: url('/fonts/Satoshi-Variable.woff2') format('woff2');
    font-weight: 300 900;
    font-display: swap;
  }
</style>
```

### 11.2 CSS Custom Properties

```css
:root {
  /* Colors */
  --color-cyan-500: #06B6D4;
  --color-blue-500: #3B82F6;
  --color-bg-primary: #0A0E1A;
  --color-text-primary: #F9FAFB;
  
  /* Typography */
  --font-primary: 'Satoshi', -apple-system, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
  
  /* Spacing */
  --spacing-unit: 8px;
  --spacing-sm: calc(var(--spacing-unit) * 2);  /* 16px */
  --spacing-md: calc(var(--spacing-unit) * 3);  /* 24px */
  --spacing-lg: calc(var(--spacing-unit) * 4);  /* 32px */
  
  /* Border radius */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-neon: 0 0 20px rgba(6, 182, 212, 0.5);
}
```

### 11.3 Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary - Electric Cyan (Data Intelligence)
        'afflyt-cyan': {
          50: '#E6FFFE',
          100: '#B3FFFC',
          200: '#80FFF9',
          300: '#4DFFF6',
          400: '#1AFFF3',
          500: '#00E5E0', // Primary
          600: '#00B8B3',
          700: '#008A86',
          800: '#005D5A',
          900: '#002F2D',
        },
        // Accent - Plasma Purple (Premium/Pro Features)
        'afflyt-plasma': {
          400: '#B794F4',
          500: '#9F7AEA', // Accent
          600: '#805AD5',
        },
        // Success - Profit Green
        'afflyt-profit': {
          400: '#48BB78',
          500: '#38A169',
          600: '#2F855A',
        },
        // Dark Mode Backgrounds
        'afflyt-dark': {
          50: '#1A1B23',  // Card background
          100: '#13141B', // Base background
          200: '#0C0D13', // Deep background
          300: '#23242E', // Hover state
          400: '#2D2E3A', // Active state
        },
        // Glass Effect
        'afflyt-glass': {
          white: 'rgba(255, 255, 255, 0.05)',
          cyan: 'rgba(0, 229, 224, 0.1)',
          border: 'rgba(0, 229, 224, 0.2)',
        }
      },
    },
  },
  plugins: [],
};
export default config;
```

---

## 12. Brand Evolution Guidelines

### When to Update the Brand

**Minor Updates** (Annual or as needed):
- Add new color variations
- Expand icon library
- Update templates
- Refine messaging

**Major Updates** (Every 3-5 years):
- Logo refresh (maintain recognition)
- Typography evolution
- Color palette expansion
- Voice modernization

### Consistency Checks

Before any branded material goes live:
- [ ] Logo is official version (not recreated)
- [ ] Colors match exact hex codes
- [ ] Fonts are correct (Satoshi, not similar)
- [ ] Clear space maintained
- [ ] Contrast ratios meet accessibility
- [ ] Messaging aligns with brand voice

---

## 13. Quick Reference

### Logo Usage
- **Primary**: Horizontal lockup (dark background)
- **Square**: Stacked lockup (social profiles)
- **Small**: Icon only (<100px width)
- **Minimum**: 180px (horizontal), 120px (stacked)

### Colors (Afflyt Brand)
- **Primary**: Afflyt Cyan `#00E5E0`
- **Secondary**: Blue `#3B82F6`
- **Premium**: Afflyt Plasma `#9F7AEA`
- **Success**: Afflyt Profit `#38A169`
- **Background**: Afflyt Dark `#13141B`
- **Cards**: Afflyt Dark-50 `#1A1B23`
- **Text**: White `#FFFFFF`

### Gradients (Tailwind classes)
- **Primary CTA**: `bg-gradient-to-r from-afflyt-cyan-400 to-afflyt-cyan-600`
- **Secondary CTA**: `bg-gradient-to-r from-afflyt-cyan-500 to-blue-500`
- **Premium**: `bg-gradient-to-r from-afflyt-plasma-500 to-afflyt-plasma-600`
- **Warning**: `bg-gradient-to-r from-yellow-500 to-orange-500`

### Typography
- **Headings**: Space Grotesk Bold (700)
- **Body**: Space Grotesk Regular (400) or Inter
- **UI**: Space Grotesk Medium (500)
- **Data/Numbers**: JetBrains Mono

### Spacing
- **Base unit**: 8px
- **Component padding**: 16px or 24px
- **Section gaps**: 32px to 64px

---

## 14. Missing Assets Checklist

The following assets need to be created to complete the brand kit:

### Logo Files (Priority: High)
- [ ] `logo-horizontal.svg` - Primary horizontal logo
- [ ] `logo-stacked.svg` - Stacked/square format
- [ ] `logo-icon.svg` - Icon only (A arrow symbol)
- [ ] `logo-wordmark.svg` - Text only "AFFLYT PRO"
- [ ] `logo-horizontal-white.svg` - White version for colored backgrounds
- [ ] `logo-horizontal-dark.svg` - Dark version for light backgrounds

### Favicon Set (Priority: High)
- [x] `favicon.ico` - Multi-size (exists in app/)
- [ ] `favicon-16x16.png`
- [ ] `favicon-32x32.png`
- [ ] `apple-touch-icon.png` (180×180)
- [ ] `android-chrome-192x192.png`
- [ ] `android-chrome-512x512.png`
- [ ] `site.webmanifest`

### Social Media Assets (Priority: Medium)
- [ ] `og-image.png` (1200×630) - OpenGraph/Facebook
- [ ] `twitter-card.png` (1200×600)
- [ ] `profile-picture.png` (400×400)
- [ ] `linkedin-banner.png` (1584×396)

### Suggested Location
```
apps/web/public/
├── logos/
│   ├── logo-horizontal.svg
│   ├── logo-stacked.svg
│   ├── logo-icon.svg
│   └── logo-wordmark.svg
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
├── android-chrome-192x192.png
├── android-chrome-512x512.png
├── og-image.png
└── site.webmanifest
```

---

## 15. Contact & Support

**Brand Guidelines Questions**: brand@afflyt.pro  
**Asset Requests**: design@afflyt.pro  
**Partnership Inquiries**: hello@afflyt.pro

**Download Brand Kit**: https://afflyt.pro/brand-kit

---

**End of Brand Kit**  
Version: 1.0  
Last Updated: November 26, 2025  
© 2025 Afflyt Pro. All rights reserved.