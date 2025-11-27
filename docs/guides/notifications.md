# Afflyt Pro - Complete Notification System Guide
## Email, In-App, and Telegram Notifications Strategy

**Version**: 1.0  
**Last Updated**: November 26, 2025  
**Owner**: Product & Engineering Team

---

## 📋 Table of Contents

### Part 1: Email System
1. [Email Architecture Overview](#1-email-architecture-overview)
2. [Email Categories & Taxonomy](#2-email-categories--taxonomy)
3. [Email Design System](#3-email-design-system)
4. [Email Copy Guidelines](#4-email-copy-guidelines)
5. [Technical Implementation](#5-technical-implementation)
6. [Deliverability & Best Practices](#6-deliverability--best-practices)
7. [Legal Compliance](#7-legal-compliance)

### Part 2: In-App Notifications
8. [In-App Notification System](#8-in-app-notification-system)
9. [Notification Types & Priorities](#9-notification-types--priorities)
10. [UI/UX Design Patterns](#10-uiux-design-patterns)
11. [Technical Implementation](#11-technical-implementation-in-app)

### Part 3: Telegram Notifications
12. [Telegram Bot Architecture](#12-telegram-bot-architecture)
13. [Notification Types & Triggers](#13-notification-types--triggers)
14. [Message Design & Formatting](#14-message-design--formatting)
15. [Bot Commands & Interactions](#15-bot-commands--interactions)

### Part 4: Cross-Channel Strategy
16. [Notification Preference Center](#16-notification-preference-center)
17. [Multi-Channel Orchestration](#17-multi-channel-orchestration)
18. [Analytics & Monitoring](#18-analytics--monitoring)
19. [Emergency & Critical Alerts](#19-emergency--critical-alerts)

---

# PART 1: EMAIL SYSTEM

---

## 1. Email Architecture Overview

### 1.1 Email Stack

```typescript
Email Infrastructure:
├── ESP (Email Service Provider): Resend / AWS SES / SendGrid
├── Template Engine: React Email / MJML
├── Queue System: BullMQ / Redis
├── Analytics: PostMark / Custom tracking
├── Bounce Handler: Webhook-based
└── Unsubscribe: Preference center (self-hosted)

Sending Flow:
User Action → Trigger Event → Queue Job → Render Template → Send via ESP → Track Delivery
```

### 1.2 Email Categories Matrix

| Category | Priority | Unsubscribable | Send Immediately | Examples |
|----------|----------|----------------|------------------|----------|
| **Transactional** | Critical | ❌ No | ✅ Yes | Magic link, password reset, email verification |
| **System** | High | ❌ No | ✅ Yes | Payment failed, API key expiring, account suspended |
| **Operational** | Medium | ⚠️ Partial | ⏱️ Batched | Deal published, automation error, weekly report |
| **Marketing** | Low | ✅ Yes | ⏱️ Scheduled | New features, product updates, tips & tricks |

**Rules**:
- **Transactional**: User-initiated, cannot unsubscribe (legally required)
- **System**: Platform-initiated critical, minimal opt-out
- **Operational**: Product updates, user can control frequency
- **Marketing**: Promotional, full opt-out required

---

## 2. Email Categories & Taxonomy

### 2.1 Transactional Emails (Critical Path)

#### **A. Authentication**

**1. Email Verification (Welcome)**
```yaml
Trigger: User signup
Send: Immediately
Purpose: Verify email ownership, activate account
Expires: 24 hours
Cannot unsubscribe: Yes (legally required)

Subject (IT): "Benvenuto su Afflyt"
Subject (EN): "Welcome to Afflyt"

Body Structure:
- Greeting with name (if available)
- Brief welcome (1 sentence)
- CTA: "Verify Email" button
- Expiry notice (24h)
- Footer: Copyright + links

Metrics to Track:
- Open rate (target: >60%)
- Click rate (target: >40%)
- Verification rate (target: >80% of clicks)
- Time to verify (target: <30 minutes)
```

**2. Magic Link Login**
```yaml
Trigger: User requests passwordless login
Send: Immediately
Purpose: Secure authentication
Expires: 15 minutes
Cannot unsubscribe: Yes

Subject (IT): "Accedi ad Afflyt"
Subject (EN): "Sign in to Afflyt"

Body Structure:
- Greeting with name
- One-line intro
- CTA: "Sign in" button
- Security notice (15 min expiry, one-time use)
- Footer

Metrics:
- Delivery time (target: <10 seconds)
- Click rate (target: >95%)
- Failed attempts (alert if >5%)
```

**3. Password Reset**
```yaml
Trigger: User requests password reset
Send: Immediately
Purpose: Secure password change
Expires: 1 hour
Cannot unsubscribe: Yes

Subject (IT): "Reimposta la tua password"
Subject (EN): "Reset your password"

Body Structure:
- Greeting
- Context (you requested reset)
- CTA: "Reset Password" button
- Expiry (1 hour)
- Ignore instruction (if not requested)
- Security tip (never share link)

Metrics:
- Request-to-send time (target: <5 seconds)
- Completion rate (target: >70%)
- Suspicious activity detection
```

---

#### **B. Payment & Billing**

**4. Payment Successful**
```yaml
Trigger: Stripe webhook `invoice.paid`
Send: Immediately
Purpose: Receipt confirmation
Cannot unsubscribe: Yes (legal requirement - receipt)

Subject: "Ricevuta pagamento - Afflyt PRO"

Body Structure:
- Transaction confirmation
- Amount paid (€49.00)
- Billing period (Dec 1 - Dec 31, 2025)
- Payment method (Visa •••• 4242)
- Download invoice link (PDF)
- Next billing date
- Support link

Attachments:
- Invoice PDF (EU-compliant, with VAT if applicable)

Metrics:
- Delivery time (target: <1 minute after payment)
- PDF download rate
- Support inquiries related to payment
```

**5. Payment Failed**
```yaml
Trigger: Stripe webhook `invoice.payment_failed`
Send: Immediately + Follow-ups (Day 3, 7, 14)
Purpose: Prompt payment update to avoid suspension
Cannot unsubscribe: No (critical system email)

Subject: "Problema con il pagamento - Azione richiesta"

Body Structure:
- Clear problem statement
- Reason (card declined, expired, etc.)
- Impact (account suspended in X days)
- CTA: "Update Payment Method" (Stripe portal)
- Alternative: Contact support
- Urgency indicator

Follow-up Cadence:
- Day 0: Immediate notification
- Day 3: Reminder (if still unpaid)
- Day 7: Final warning (suspension imminent)
- Day 14: Account suspended notification

Metrics:
- Resolution rate by day 7 (target: >85%)
- Churn due to payment issues (minimize)
```

**6. Subscription Changed**
```yaml
Trigger: User upgrades/downgrades plan
Send: Immediately
Purpose: Confirmation of change

Subject: "Piano modificato: Afflyt {{newPlan}}"

Body Structure:
- Confirmation of change
- Old plan → New plan
- New price
- Effective date
- Updated limits (TTL, features)
- CTA: View billing details

Metrics:
- Confirmation acknowledgment
- Support tickets post-change
```

---

#### **C. Account Management**

**7. Account Suspended**
```yaml
Trigger: Payment failed >14 days, ToS violation, fraud detection
Send: Immediately
Purpose: Inform user, provide resolution path
Cannot unsubscribe: No

Subject: "Account Afflyt sospeso - Azione necessaria"

Body Structure:
- Clear reason for suspension
- Impact (no access until resolved)
- Resolution steps
- CTA: "Resolve Issue" or "Contact Support"
- Timeline (e.g., permanent deletion in 30 days)

Metrics:
- Resolution rate
- Time to resolution
- Appeals submitted
```

**8. Account Deleted**
```yaml
Trigger: User requests account deletion
Send: Immediately (confirmation) + 7 days later (final)
Purpose: Confirm deletion, allow cancellation

Subject: "Conferma eliminazione account - 7 giorni"

Body Structure:
- Deletion scheduled for [date]
- What will be deleted (all data, irreversible)
- CTA: "Cancel Deletion" (if within 7 days)
- GDPR compliance statement
- Export data link (available for 7 days)

Metrics:
- Deletion completion rate
- Cancellation rate (users who change mind)
```

---

### 2.2 Operational Emails (Product Activity)

#### **A. Automation & Deals**

**9. Deal Published Notification**
```yaml
Trigger: Automation publishes deal to channel
Send: Batched (every 15 minutes) or Real-time (user preference)
Purpose: Keep user informed of automation activity
Unsubscribable: Yes (user controls frequency)

Subject: "{{count}} nuovi deal pubblicati - Afflyt"

Body Structure:
- Summary (X deals published in last Y minutes)
- Top 3 deals (ASIN, title, price, link)
- Performance snapshot (clicks, estimated revenue)
- CTA: "View All in Dashboard"

Batching Logic:
- If <5 deals: Include all
- If >5 deals: Show top 3 + "and X more"
- If >50 deals/hour: Switch to hourly digest

User Controls:
- Real-time (every publish)
- Hourly digest
- Daily digest
- Weekly digest only
- Off (disable entirely)

Metrics:
- Engagement with deal links
- Dashboard visits triggered by email
- Opt-out rate (if high, redesign)
```

**10. Automation Error**
```yaml
Trigger: Automation fails (API error, channel disconnected, etc.)
Send: Immediately (first error), then throttled
Purpose: Alert user to fix issue
Unsubscribable: Partial (cannot disable critical errors)

Subject: "Automazione {{name}} - Errore rilevato"

Body Structure:
- Clear error description
- Affected automation name
- Impact (deals not published since X time)
- Resolution steps (reconnect channel, check API keys)
- CTA: "Fix Now" (deep link to settings)
- Escalation: If not fixed in 24h, send reminder

Throttling:
- First error: Immediate
- Subsequent errors: Max 1 email per 6 hours
- Auto-resolve: Stop sending if user fixes issue

Metrics:
- Time to resolution (target: <1 hour)
- Resolution rate without support
```

---

#### **B. Reporting & Insights**

**11. Daily Performance Summary**
```yaml
Trigger: Cron job (9:00 AM user's timezone)
Send: Daily (if opted in)
Purpose: Daily snapshot of key metrics
Unsubscribable: Yes

Subject: "Riepilogo giornaliero Afflyt - {{date}}"

Body Structure:
- Hero metric: Yesterday's revenue (€X.XX, +Y% vs avg)
- 3-column KPIs:
  * Clicks (count, trend)
  * Conversions (count, CVR)
  * Active deals (count)
- Top performing link (title, revenue, clicks)
- Insight: "Your best posting time was 15:00"
- CTA: "View Full Report"

Conditions to Send:
- User has >0 activity yesterday
- User hasn't disabled daily emails
- Account is active

Metrics:
- Open rate (target: >30%)
- Dashboard visits from email
- Engagement with insights
```

**12. Weekly Report**
```yaml
Trigger: Cron (Monday 9:00 AM)
Send: Weekly
Purpose: Comprehensive performance review
Unsubscribable: Yes

Subject: "Report settimanale Afflyt - {{weekRange}}"

Body Structure:
- Executive summary (revenue, clicks, CVR)
- Week-over-week comparison
- Top 5 deals by revenue
- Channel performance breakdown
- Insight: "Telegram drove 82% of revenue"
- Action item: "Try posting more on weekends"
- CTA: "View Detailed Analytics"

Attachments:
- Optional: PDF report (PRO/Enterprise only)

Metrics:
- PDF download rate
- Action taken on insights
- Retention correlation (users who read = higher retention)
```

---

### 2.3 Marketing Emails (Growth & Engagement)

**13. Onboarding Sequence**
```yaml
Trigger: Account created + email verified
Send: Drip campaign over 14 days
Purpose: Guide user to first value, reduce churn
Unsubscribable: Yes

Sequence:
Day 0: Welcome + Quick start guide
Day 1: Connect first channel tutorial
Day 3: Set up first automation (with video)
Day 7: Optimization tips (best posting times)
Day 14: Upgrade to PRO (if still Free tier)

Each Email Structure:
- One primary action (don't overwhelm)
- Progress indicator (Step 2 of 5)
- Educational content (how-to)
- Social proof (optional)
- CTA: Single, clear action

Exit Conditions:
- User completes action (skip that email)
- User unsubscribes
- User upgrades to PRO (skip upgrade emails)

Metrics:
- Completion rate per step
- Churn rate by step
- Time to first value (activation)
```

**14. Feature Announcement**
```yaml
Trigger: New feature launch
Send: Scheduled (one-time)
Purpose: Drive adoption of new features
Unsubscribable: Yes

Subject: "Novità: {{featureName}} disponibile su Afflyt"

Body Structure:
- Hero image (feature screenshot)
- Problem → Solution (what it solves)
- How to use (3 simple steps)
- CTA: "Try Now"
- Availability (PRO only / All tiers)
- Feedback: "Let us know what you think"

Targeting:
- Send to users on relevant tier
- Exclude users who already used feature
- A/B test subject lines

Metrics:
- Feature adoption rate
- Time to first use
- Feedback submissions
```

**15. Re-engagement Campaign**
```yaml
Trigger: User inactive >30 days
Send: 3-email sequence over 2 weeks
Purpose: Win back churned/inactive users
Unsubscribable: Yes

Sequence:
Email 1 (Day 30): "We miss you" + recent updates
Email 2 (Day 37): "Here's what you're missing" + stats
Email 3 (Day 44): "Last chance" + special offer (if applicable)

Exit Conditions:
- User logs in (stop sequence)
- User unsubscribes
- No response after Email 3 (mark as churned)

Metrics:
- Reactivation rate
- Churn recovery
- Final unsubscribe rate
```

---

## 3. Email Design System

### 3.1 Visual Design Specifications

#### **A. Layout Structure**

```
┌────────────────────────────────────────────┐
│ HEADER (Dark #0A0E1A)                      │ ← 80px height
│ [Logo]                            afflyt.io│
├────────────────────────────────────────────┤
│                                             │
│ CONTENT (White #FFFFFF)                    │
│                                             │
│ Greeting: 18px, semibold                   │ ← 40px top padding
│ Body: 16px, regular, line-height 1.6       │
│ CTA Button: Gradient, 14px, bold           │ ← 32px top margin
│ Meta text: 14px, gray                      │
│                                             │
│                                             │ ← 40px bottom padding
├────────────────────────────────────────────┤
│ FOOTER (Light Gray #F9FAFB)                │ ← 60px height
│ © 2025 Afflyt · Privacy · Help             │
└────────────────────────────────────────────┘

Dimensions:
- Container width: 600px (desktop standard)
- Mobile: 100% width, min 320px
- Padding: 32px (desktop), 20px (mobile)
- Border radius: 12px (container)
```

#### **B. Assets**

```typescript
// Logo URL (hosted on CDN)
const LOGO_URL = 'https://afflyt.io/images/logo.webp';

// Used in email header (dark background)
// Logo dimensions: height 32px, auto width
```

#### **C. Color System**

```css
/* Brand Colors */
--primary-cyan: #06B6D4;
--primary-blue: #3B82F6;
--gradient-cyan: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
--gradient-amber: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);

/* Button Color Usage */
/* - Cyan gradient: Default actions (verify email, magic link, general CTAs) */
/* - Amber gradient: Security-sensitive actions (password reset) */

/* Backgrounds */
--bg-email: #F3F4F6;        /* Outer background */
--bg-container: #FFFFFF;     /* Email body */
--bg-header: #0A0E1A;        /* Header/Footer option 1 */
--bg-footer: #F9FAFB;        /* Footer option 2 */

/* Text */
--text-primary: #1F2937;     /* Headings, body */
--text-secondary: #6B7280;   /* Meta, captions */
--text-tertiary: #9CA3AF;    /* Footer, disclaimers */
--text-white: #FFFFFF;       /* On dark backgrounds */

/* Interactive */
--link-color: #06B6D4;
--link-hover: #0891B2;
--button-bg: var(--gradient);
--button-text: #FFFFFF;
```

#### **C. Typography**

```css
/* Font Stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             Roboto, Helvetica, Arial, sans-serif;

/* Type Scale */
.email-h1 {
  font-size: 24px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.email-h2 {
  font-size: 20px;
  line-height: 1.4;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.email-body {
  font-size: 16px;
  line-height: 1.6;
  font-weight: 400;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.email-small {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.email-caption {
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-tertiary);
}

/* Monospace (for codes, ASINs) */
.email-code {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  background: #F3F4F6;
  padding: 2px 6px;
  border-radius: 4px;
}
```

#### **D. Button Styles**

```html
<!-- Primary Button - Cyan (Default: verify email, magic link, general CTAs) -->
<a href="{{actionUrl}}"
   style="display: inline-block;
          padding: 14px 32px;
          background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
          color: #FFFFFF;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;">
  {{buttonText}}
</a>

<!-- Primary Button - Amber (Security actions: password reset) -->
<a href="{{actionUrl}}"
   style="display: inline-block;
          padding: 14px 32px;
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: #FFFFFF;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;">
  {{buttonText}}
</a>

<!-- Secondary Button -->
<a href="{{url}}"
   style="display: inline-block;
          padding: 12px 24px;
          background: transparent;
          color: #06B6D4;
          text-decoration: none;
          border: 2px solid #06B6D4;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;">
  {{buttonText}}
</a>

<!-- Text Link -->
<a href="{{url}}"
   style="color: #06B6D4;
          text-decoration: none;
          font-weight: 500;">
  {{linkText}}
</a>
```

**Button Color Usage:**
| Email Type | Button Color | Reason |
|------------|--------------|--------|
| Welcome/Verify Email | Cyan | Standard action |
| Magic Link | Cyan | Standard action |
| Password Reset | Amber | Security-sensitive, draws attention |
| Verification Reminder | Cyan | Standard action |
| Payment Failed | Amber | Urgent action required |

#### **E. Component Library**

**Alert Box (Info/Warning/Error)**
```html
<!-- Info Alert -->
<div style="background: rgba(6, 182, 212, 0.1);
            border-left: 4px solid #06B6D4;
            padding: 16px;
            border-radius: 8px;
            margin: 24px 0;">
  <p style="margin: 0; color: #0891B2; font-size: 14px;">
    <strong>Info:</strong> {{message}}
  </p>
</div>

<!-- Warning Alert -->
<div style="background: rgba(245, 158, 11, 0.1);
            border-left: 4px solid #F59E0B;
            padding: 16px;
            border-radius: 8px;">
  <p style="margin: 0; color: #D97706; font-size: 14px;">
    <strong>Warning:</strong> {{message}}
  </p>
</div>

<!-- Error Alert -->
<div style="background: rgba(239, 68, 68, 0.1);
            border-left: 4px solid #EF4444;
            padding: 16px;
            border-radius: 8px;">
  <p style="margin: 0; color: #DC2626; font-size: 14px;">
    <strong>Error:</strong> {{message}}
  </p>
</div>
```

**Stats Card (for reports)**
```html
<table cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr>
    <td style="padding: 20px; background: #F9FAFB; border-radius: 8px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" width="33%">
            <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase;">
              Clicks
            </p>
            <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 700; color: #1F2937;">
              1,247
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #10B981;">
              +12.3% ↗
            </p>
          </td>
          <td align="center" width="33%">
            <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase;">
              Revenue
            </p>
            <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 700; color: #1F2937;">
              €342
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #10B981;">
              +8.7% ↗
            </p>
          </td>
          <td align="center" width="33%">
            <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase;">
              CVR
            </p>
            <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 700; color: #1F2937;">
              4.8%
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #9CA3AF;">
              →
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

### 3.2 Responsive Design

```html
<!-- Mobile-Friendly Table Structure -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" 
       style="max-width: 600px; margin: 0 auto;">
  <tr>
    <td style="padding: 20px;">
      <!-- Content here -->
    </td>
  </tr>
</table>

<!-- Media Queries (in <style> tag) -->
<style>
  @media only screen and (max-width: 600px) {
    .email-container {
      width: 100% !important;
      max-width: 100% !important;
    }
    .email-content {
      padding: 20px !important;
    }
    .email-button {
      width: 100% !important;
      display: block !important;
    }
    .email-h1 {
      font-size: 20px !important;
    }
    .stats-card td {
      display: block !important;
      width: 100% !important;
      margin-bottom: 16px !important;
    }
  }
</style>
```

---

## 4. Email Copy Guidelines

### 4.1 Writing Principles

**1. Clarity Over Cleverness**
```
❌ "Your affiliate game just leveled up! 🚀"
✅ "Your Afflyt account is now active."

❌ "Uh-oh! Houston, we have a problem... 🛸"
✅ "Payment failed. Update your payment method."
```

**2. Brevity is King**
```
Target word counts:
- Subject line: 4-8 words (40 characters max)
- Greeting: 1 line
- Intro: 1-2 sentences
- Body: 2-4 sentences max
- CTA: 2-4 words
- Footer: Minimal (copyright + 2-3 links)

Total email: <150 words for transactional, <300 for marketing
```

**3. Action-Oriented**
```
Every email must have ONE primary action:
- Verify email
- Reset password
- Update payment
- View report
- Try feature

No emails with multiple CTAs (confuses user)
```

**4. Professional Tone**
```
Voice attributes:
- Clear and direct (not cryptic)
- Helpful (not pushy)
- Professional (not stuffy)
- Friendly (not overly casual)
- Confident (not arrogant)

Avoid:
- Emoji (except security icons in specific contexts)
- Exclamation marks (max 1 per email)
- Marketing buzzwords ("revolutionary", "game-changing")
- Jargon without explanation
```

---

### 4.2 Subject Line Formula

**Structure**: `[Action/Context] - [Object/Detail]`

**Good Examples**:
```
✅ "Accedi ad Afflyt"
✅ "Pagamento ricevuto - €49.00"
✅ "Automazione in errore - Azione richiesta"
✅ "Report settimanale - 15-21 Nov"
✅ "Nuovo: Analytics avanzato"
```

**Bad Examples**:
```
❌ "🎉 You won't believe what we just launched!"
❌ "URGENT: OPEN NOW!!!"
❌ "RE: RE: RE:" (fake reply chains)
❌ "Hey [First Name]" (awkward personalization)
❌ "" (blank subject)
```

**Best Practices**:
- Front-load important words (mobile truncation)
- No ALL CAPS (spam filters hate it)
- Personalize strategically (not always)
- Test with spam checker tools
- A/B test marketing subjects (not transactional)

---

### 4.3 Preheader Text

**What**: Text that appears after subject in inbox preview  
**Length**: 50-100 characters  
**Purpose**: Reinforce subject, increase open rate

**Examples**:
```
Subject: "Accedi ad Afflyt"
Preheader: "Link valido per 15 minuti • Accesso sicuro"

Subject: "Pagamento ricevuto - €49.00"
Preheader: "Ricevuta per Afflyt PRO • Dicembre 2025"

Subject: "Report settimanale - 15-21 Nov"
Preheader: "€342 di revenue • +12% clicks • Insights inclusi"
```

**Implementation**:
```html
<div style="display: none; max-height: 0px; overflow: hidden;">
  {{preheaderText}}
</div>
```

---

## 5. Technical Implementation

### 5.1 Email Rendering Engine

**Recommended Stack**: React Email + Resend

```typescript
// email/templates/MagicLinkEmail.tsx
import {
  Html, Head, Body, Container, Section,
  Heading, Text, Button, Link, Hr, Img
} from '@react-email/components';

interface MagicLinkEmailProps {
  name?: string;
  magicLink: string;
  expiryMinutes: number;
  locale: 'it' | 'en';
}

export default function MagicLinkEmail({
  name,
  magicLink,
  expiryMinutes,
  locale
}: MagicLinkEmailProps) {
  const t = getEmailTranslation('magicLink', locale);
  
  return (
    <Html lang={locale}>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Img
              src="https://afflyt.io/logo-horizontal-white.png"
              width="120"
              height="40"
              alt="Afflyt"
            />
          </Section>
          
          {/* Content */}
          <Section style={styles.content}>
            <Heading style={styles.greeting}>
              {generateGreeting(t.greeting, name)}
            </Heading>
            
            <Text style={styles.body}>
              {t.intro}
            </Text>
            
            <Button
              href={magicLink}
              style={styles.button}
            >
              {replaceVariables(t.buttonText, { appName: 'Afflyt' })}
            </Button>
            
            <Text style={styles.meta}>
              {replaceVariables(t.expiry, { minutes: expiryMinutes })}
            </Text>
            
            <Text style={styles.footer}>
              {t.footer}
            </Text>
          </Section>
          
          {/* Footer */}
          <Section style={styles.footerSection}>
            <Text style={styles.copyright}>
              {replaceVariables(t.copyright, { year: new Date().getFullYear(), appName: 'Afflyt' })} ·{' '}
              <Link href="https://afflyt.io/privacy" style={styles.link}>
                {t.links.privacy}
              </Link> ·{' '}
              <Link href="https://afflyt.io/help" style={styles.link}>
                {t.links.help}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#F3F4F6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    maxWidth: '600px',
    margin: '40px auto',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#0A0E1A',
    padding: '24px 32px',
    textAlign: 'center' as const,
  },
  content: {
    padding: '40px 32px',
  },
  greeting: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '24px',
  },
  body: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#4B5563',
    marginBottom: '32px',
  },
  button: {
    display: 'inline-block',
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    color: '#FFFFFF',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
    textAlign: 'center' as const,
  },
  meta: {
    fontSize: '14px',
    color: '#6B7280',
    marginTop: '24px',
  },
  footer: {
    fontSize: '14px',
    color: '#9CA3AF',
    marginTop: '24px',
  },
  footerSection: {
    backgroundColor: '#F9FAFB',
    padding: '24px 32px',
    textAlign: 'center' as const,
  },
  copyright: {
    fontSize: '12px',
    color: '#6B7280',
  },
  link: {
    color: '#06B6D4',
    textDecoration: 'none',
  },
};
```

---

### 5.2 Sending System

```typescript
// lib/email/sender.ts
import { Resend } from 'resend';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: ReactElement;
  replyTo?: string;
  tags?: { name: string; value: string }[];
  scheduledAt?: Date;
}

export async function sendEmail({
  to,
  subject,
  template,
  replyTo = 'noreply@afflyt.io',
  tags = [],
  scheduledAt
}: SendEmailOptions) {
  try {
    // Render React template to HTML
    const html = render(template);
    
    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: 'Afflyt <noreply@afflyt.io>',
      to,
      subject,
      html,
      replyTo,
      tags: [
        ...tags,
        { name: 'environment', value: process.env.NODE_ENV },
      ],
      scheduledAt: scheduledAt?.toISOString(),
    });
    
    if (error) {
      throw new Error(`Email send failed: ${error.message}`);
    }
    
    // Log success
    await logEmailSent({
      emailId: data.id,
      to: Array.isArray(to) ? to : [to],
      subject,
      tags,
    });
    
    return { success: true, emailId: data.id };
  } catch (error) {
    // Log failure
    await logEmailFailed({
      to: Array.isArray(to) ? to : [to],
      subject,
      error: error.message,
    });
    
    throw error;
  }
}

// Example usage
await sendEmail({
  to: 'user@example.com',
  subject: 'Accedi ad Afflyt',
  template: <MagicLinkEmail
    name="Marco"
    magicLink="https://afflyt.io/auth/verify?token=..."
    expiryMinutes={15}
    locale="it"
  />,
  tags: [
    { name: 'type', value: 'magic-link' },
    { name: 'userId', value: user.id },
  ],
});
```

---

### 5.3 Queue System (BullMQ)

```typescript
// lib/queues/email-queue.ts
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  maxRetriesPerRequest: null,
});

// Email Queue
export const emailQueue = new Queue('emails', { connection });

// Add email to queue
export async function queueEmail(
  type: string,
  data: any,
  options: {
    priority?: number;
    delay?: number;
    attempts?: number;
  } = {}
) {
  return await emailQueue.add(
    type,
    data,
    {
      priority: options.priority || 5, // 1 (highest) to 10 (lowest)
      delay: options.delay || 0, // milliseconds
      attempts: options.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s, 10s, 20s...
      },
    }
  );
}

// Worker to process queue
export const emailWorker = new Worker(
  'emails',
  async (job) => {
    const { type, data } = job;
    
    switch (type) {
      case 'magic-link':
        await sendMagicLinkEmail(data);
        break;
      case 'payment-failed':
        await sendPaymentFailedEmail(data);
        break;
      case 'weekly-report':
        await sendWeeklyReportEmail(data);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  },
  {
    connection,
    concurrency: 10, // Process 10 emails simultaneously
  }
);

// Usage example
await queueEmail('magic-link', {
  userId: user.id,
  email: user.email,
  token: magicToken,
}, {
  priority: 1, // High priority (transactional)
});
```

---

### 5.4 Bounce & Complaint Handling

```typescript
// app/api/webhooks/resend/route.ts
import { headers } from 'next/headers';
import { Webhook } from 'svix';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = headers();
  
  const svixId = headersList.get('svix-id');
  const svixTimestamp = headersList.get('svix-timestamp');
  const svixSignature = headersList.get('svix-signature');
  
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing headers', { status: 400 });
  }
  
  const webhook = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);
  
  let event;
  try {
    event = webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }
  
  // Handle different event types
  switch (event.type) {
    case 'email.bounced':
      await handleBounce(event.data);
      break;
    case 'email.complained':
      await handleComplaint(event.data);
      break;
    case 'email.delivered':
      await handleDelivered(event.data);
      break;
    case 'email.opened':
      await handleOpened(event.data);
      break;
    case 'email.clicked':
      await handleClicked(event.data);
      break;
  }
  
  return new Response('OK', { status: 200 });
}

async function handleBounce(data: any) {
  const { email, bounce_type } = data;
  
  if (bounce_type === 'hard') {
    // Hard bounce: Invalid email, suppress permanently
    await db.user.update({
      where: { email },
      data: {
        emailVerified: false,
        emailBounced: true,
        emailBouncedAt: new Date(),
      },
    });
    
    // Add to suppression list
    await db.emailSuppression.create({
      data: {
        email,
        reason: 'hard_bounce',
        suppressedAt: new Date(),
      },
    });
  } else {
    // Soft bounce: Temporary issue, retry later
    await logSoftBounce(email);
  }
}

async function handleComplaint(data: any) {
  const { email } = data;
  
  // User marked as spam - suppress immediately
  await db.user.update({
    where: { email },
    data: {
      emailUnsubscribed: true,
      emailComplaint: true,
    },
  });
  
  await db.emailSuppression.create({
    data: {
      email,
      reason: 'spam_complaint',
      suppressedAt: new Date(),
    },
  });
}
```

---

## 6. Deliverability & Best Practices

### 6.1 SPF, DKIM, DMARC Setup

**SPF Record** (add to DNS):
```
afflyt.io TXT "v=spf1 include:_spf.resend.com ~all"
```

**DKIM**: Resend provides CNAME records, add to DNS:
```
resend._domainkey.afflyt.io CNAME resend1._domainkey.resend.com
resend2._domainkey.afflyt.io CNAME resend2._domainkey.resend.com
```

**DMARC Record**:
```
_dmarc.afflyt.io TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@afflyt.io"
```

**Verification Checklist**:
- [ ] SPF passes (check with MXToolbox)
- [ ] DKIM passes (send test email, check headers)
- [ ] DMARC passes
- [ ] Reverse DNS (PTR record) configured
- [ ] Domain reputation clean (SenderScore >90)

---

### 6.2 Spam Score Optimization

**Rules to Follow**:

1. **Subject Lines**:
   - ❌ ALL CAPS
   - ❌ Multiple exclamation marks!!!
   - ❌ Spammy words (FREE, WIN, URGENT, CLICK HERE)
   - ❌ Excessive emoji 🎉🎉🎉
   - ✅ Clear, descriptive, professional

2. **Content**:
   - ❌ Image-only emails (no text)
   - ❌ Large images (>1MB)
   - ❌ Too many links (>5)
   - ❌ Shortened URLs (bit.ly, tinyurl)
   - ✅ Good text-to-image ratio (60:40)
   - ✅ Plain text version included

3. **Technical**:
   - ✅ Valid HTML (no broken tags)
   - ✅ Unsubscribe link present (for marketing)
   - ✅ Physical address in footer (legal requirement)
   - ✅ List-Unsubscribe header
   - ✅ Message-ID header

4. **Sending Behavior**:
   - ❌ Sudden volume spikes
   - ❌ Sending to purchased lists
   - ❌ Sending to unverified emails
   - ✅ Gradual sending ramp-up
   - ✅ Clean, opted-in list
   - ✅ Regular sending schedule

**Test Tools**:
- Mail Tester (mail-tester.com) - Target: 8/10 or higher
- GlockApps - Inbox placement testing
- Litmus - Rendering across clients

---

### 6.3 List Hygiene

```typescript
// Clean email list regularly
async function cleanEmailList() {
  // Remove hard bounces
  const bounced = await db.emailSuppression.findMany({
    where: { reason: 'hard_bounce' },
  });
  
  // Remove spam complaints
  const complained = await db.emailSuppression.findMany({
    where: { reason: 'spam_complaint' },
  });
  
  // Remove unsubscribes
  const unsubscribed = await db.user.findMany({
    where: { emailUnsubscribed: true },
  });
  
  // Remove inactive (no open in 6 months)
  const inactive = await db.user.findMany({
    where: {
      lastEmailOpenedAt: {
        lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      },
    },
  });
  
  // Mark for suppression
  const suppressionList = [
    ...bounced,
    ...complained,
    ...unsubscribed,
    ...inactive,
  ];
  
  console.log(`Suppressing ${suppressionList.length} emails`);
  
  // Don't actually delete (GDPR), just mark as suppressed
  // They can re-opt-in if they want
}

// Run weekly
schedule('0 0 * * 0', cleanEmailList); // Every Sunday midnight
```

---

## 7. Legal Compliance

### 7.1 GDPR (EU)

**Requirements**:
1. **Consent**: Must be freely given, specific, informed
   - Pre-checked boxes = NOT valid consent
   - Must be separate from T&C acceptance
   - Clear language (not legalese)

2. **Right to Access**: User can request all data you have
   - Must provide within 30 days
   - Machine-readable format (JSON)

3. **Right to Erasure**: User can request deletion
   - Must delete within 30 days
   - Can retain for legal obligations only

4. **Right to Portability**: User can export data
   - CSV or JSON format
   - Includes all emails sent/received

**Implementation**:
```typescript
// User requests data export
export async function generateGDPRExport(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      emails: true, // All emails sent
      clicks: true,
      conversions: true,
      // ... all related data
    },
  });
  
  return {
    personal_info: {
      email: user.email,
      name: user.name,
      created_at: user.createdAt,
    },
    email_history: user.emails.map(e => ({
      type: e.type,
      subject: e.subject,
      sent_at: e.sentAt,
      opened: e.opened,
    })),
    // ... more data
  };
}
```

---

### 7.2 CAN-SPAM (USA)

**Requirements**:
1. **No False/Misleading Headers**: From, To, Reply-To must be accurate
2. **Clear Subject Lines**: Must reflect email content
3. **Identify as Ad**: Marketing emails must be identifiable
4. **Physical Address**: Must include valid postal address
5. **Opt-Out Mechanism**: Must be clear, easy, functional
6. **Honor Opt-Outs Quickly**: Within 10 business days

**Implementation**:
```html
<!-- Footer for marketing emails -->
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
  <p style="font-size: 12px; color: #6B7280; margin-bottom: 8px;">
    You're receiving this email because you signed up for Afflyt updates.
  </p>
  <p style="font-size: 12px; color: #6B7280; margin-bottom: 8px;">
    <a href="{{unsubscribeUrl}}" style="color: #06B6D4;">Unsubscribe</a> | 
    <a href="{{preferencesUrl}}" style="color: #06B6D4;">Email Preferences</a>
  </p>
  <p style="font-size: 12px; color: #9CA3AF;">
    Afflyt S.r.l.<br>
    Via Example 123, 20100 Milano, Italy
  </p>
</div>
```

---

### 7.3 Double Opt-In Best Practice

```typescript
// User signup flow
async function signupUser(email: string, name: string) {
  // 1. Create user (unverified)
  const user = await db.user.create({
    data: {
      email,
      name,
      emailVerified: false,
      marketingOptIn: false, // Default: opted OUT
    },
  });
  
  // 2. Send verification email
  const verificationToken = generateToken();
  await sendEmail({
    to: email,
    subject: 'Benvenuto su Afflyt',
    template: <WelcomeEmail
      name={name}
      verificationLink={`https://afflyt.io/verify?token=${verificationToken}`}
    />,
    tags: [{ name: 'type', value: 'verification' }],
  });
  
  // 3. User clicks link → verify email
  // 4. THEN ask for marketing consent (separate step)
}

// After email verified, ask for marketing opt-in
async function showMarketingOptIn(userId: string) {
  // Show UI with clear language:
  // "Would you like to receive product updates and tips?"
  // [ ] Yes, send me emails about new features and best practices
  //
  // If user checks → set marketingOptIn: true
  // If user doesn't check → marketingOptIn stays false
  //
  // User can change this anytime in settings
}
```

---

# PART 2: IN-APP NOTIFICATIONS

---

## 8. In-App Notification System

### 8.1 Architecture Overview

```typescript
In-App Notification Stack:
├── WebSocket Server (real-time push)
├── Notification Service (business logic)
├── Notification Store (database)
├── Frontend Components (UI)
└── Sound/Badge System (browser notifications)

Flow:
Event Occurs → Notification Service → WebSocket Push → Frontend Receives → UI Updates → User Sees
```

### 8.2 Database Schema

```prisma
// schema.prisma
model Notification {
  id String @id @default(cuid())
  
  // User
  userId String
  user User @relation(fields: [userId], references: [id])
  
  // Content
  type NotificationType
  title String
  message String
  icon String? // Lucide icon name
  
  // Metadata
  category NotificationCategory
  priority NotificationPriority
  
  // Action
  actionUrl String?
  actionLabel String?
  
  // State
  read Boolean @default(false)
  readAt DateTime?
  dismissed Boolean @default(false)
  dismissedAt DateTime?
  
  // Timestamps
  createdAt DateTime @default(now())
  expiresAt DateTime?
  
  @@index([userId, read])
  @@index([userId, createdAt])
}

enum NotificationType {
  INFO
  SUCCESS
  WARNING
  ERROR
}

enum NotificationCategory {
  SYSTEM // Account, billing, security
  AUTOMATION // Deal published, automation error
  ANALYTICS // Reports, insights
  PRODUCT // New features, updates
}

enum NotificationPriority {
  LOW // Can wait, batched
  MEDIUM // Show soon, non-urgent
  HIGH // Show immediately, important
  CRITICAL // Interrupt user, requires action
}
```

---

## 9. Notification Types & Priorities

### 9.1 Notification Matrix

| Event | Type | Priority | Sound | Badge | Persistent | Auto-Dismiss |
|-------|------|----------|-------|-------|------------|--------------|
| **Deal Published** | SUCCESS | LOW | ❌ | ✅ | ❌ | 5s |
| **Automation Error** | ERROR | HIGH | ✅ | ✅ | ✅ | Manual |
| **Payment Failed** | ERROR | CRITICAL | ✅ | ✅ | ✅ | Manual |
| **Report Ready** | INFO | MEDIUM | ❌ | ✅ | ✅ | Manual |
| **New Feature** | INFO | LOW | ❌ | ✅ | ✅ | Manual |
| **TTL Limit Warning** | WARNING | HIGH | ✅ | ✅ | ✅ | Manual |
| **API Key Expiring** | WARNING | HIGH | ✅ | ✅ | ✅ | Manual |

### 9.2 Notification Examples

#### **A. Deal Published (Low Priority)**
```typescript
{
  type: 'SUCCESS',
  category: 'AUTOMATION',
  priority: 'LOW',
  title: 'Deal pubblicato',
  message: 'Wireless Mouse Pro è stato pubblicato su Telegram',
  icon: 'Check',
  actionUrl: '/dashboard/deals/deal_123',
  actionLabel: 'Vedi deal',
  autoDismiss: 5000, // 5 seconds
}
```

**UI Behavior**:
- Toast notification (bottom-right)
- Green icon
- Fades out after 5s
- No sound
- Increments badge count

---

#### **B. Automation Error (High Priority)**
```typescript
{
  type: 'ERROR',
  category: 'AUTOMATION',
  priority: 'HIGH',
  title: 'Automazione in errore',
  message: 'Daily Deals: Telegram bot non autorizzato',
  icon: 'AlertTriangle',
  actionUrl: '/settings/channels',
  actionLabel: 'Risolvi ora',
  persistent: true, // Stays until user interacts
  sound: true,
}
```

**UI Behavior**:
- Toast notification (red)
- Alert sound plays
- Stays visible until clicked or dismissed
- Badge count increments
- Also added to Notification Center

---

#### **C. Payment Failed (Critical Priority)**
```typescript
{
  type: 'ERROR',
  category: 'SYSTEM',
  priority: 'CRITICAL',
  title: 'Pagamento fallito',
  message: 'Aggiorna il metodo di pagamento entro 3 giorni per evitare la sospensione',
  icon: 'CreditCard',
  actionUrl: '/settings/billing',
  actionLabel: 'Aggiorna carta',
  persistent: true,
  sound: true,
  modal: true, // Show as modal overlay (blocks UI)
}
```

**UI Behavior**:
- **Blocks UI** with modal overlay
- Cannot be dismissed without action or explicit close
- Alert sound plays
- Red/urgent styling
- Badge shows "!"

---

#### **D. Weekly Report Ready (Medium Priority)**
```typescript
{
  type: 'INFO',
  category: 'ANALYTICS',
  priority: 'MEDIUM',
  title: 'Report settimanale pronto',
  message: 'Hai generato €342 questa settimana (+12%)',
  icon: 'BarChart3',
  actionUrl: '/analytics?range=week',
  actionLabel: 'Vedi report',
  persistent: true,
}
```

**UI Behavior**:
- Toast (blue info style)
- No sound
- Stays in Notification Center
- Badge increments

---

## 10. UI/UX Design Patterns

### 10.1 Toast Notifications (Temporary)

```typescript
// components/notifications/Toast.tsx
import { X, Check, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ToastProps {
  id: string
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO'
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  onDismiss: (id: string) => void
  autoDismiss?: number // milliseconds
}

const typeConfig = {
  SUCCESS: {
    icon: Check,
    color: 'bg-green-500/10 border-green-500/30 text-green-400',
  },
  ERROR: {
    icon: AlertCircle,
    color: 'bg-red-500/10 border-red-500/30 text-red-400',
  },
  WARNING: {
    icon: AlertTriangle,
    color: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  },
  INFO: {
    icon: Info,
    color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  },
}

export function Toast({
  id,
  type,
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
  autoDismiss = 5000,
}: ToastProps) {
  const config = typeConfig[type]
  const Icon = config.icon
  
  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => onDismiss(id), autoDismiss)
      return () => clearTimeout(timer)
    }
  }, [id, autoDismiss])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm
        shadow-lg max-w-md ${config.color}
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm mb-1 text-white">
          {title}
        </h4>
        <p className="text-sm text-gray-300 leading-snug">
          {message}
        </p>
        
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-2 text-xs font-medium text-cyan-400 hover:text-cyan-300"
          >
            {actionLabel} →
          </button>
        )}
      </div>
      
      <button
        onClick={() => onDismiss(id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

// Toast Container (bottom-right stack)
export function ToastContainer({ toasts }: { toasts: ToastProps[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
```

---

### 10.2 Notification Center (Persistent)

```typescript
// components/notifications/NotificationCenter.tsx
import { Bell, Check, Trash2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent
        align="end"
        className="w-96 p-0 bg-gray-900 border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-semibold text-white">Notifiche</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Segna tutte come lette
            </button>
          )}
        </div>
        
        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nessuna notifica</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => markAsRead(notification.id)}
                onDelete={() => deleteNotification(notification.id)}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({ notification, onMarkRead, onDelete }) {
  const Icon = getIconComponent(notification.icon)
  
  return (
    <div
      className={`
        flex items-start gap-3 p-4 border-b border-gray-800 last:border-0
        hover:bg-gray-800/50 transition-colors
        ${!notification.read ? 'bg-cyan-500/5' : ''}
      `}
    >
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
        ${notification.type === 'ERROR' ? 'bg-red-500/10 text-red-400' :
          notification.type === 'WARNING' ? 'bg-amber-500/10 text-amber-400' :
          notification.type === 'SUCCESS' ? 'bg-green-500/10 text-green-400' :
          'bg-cyan-500/10 text-cyan-400'}
      `}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white text-sm mb-1">
          {notification.title}
        </h4>
        <p className="text-sm text-gray-400 leading-snug mb-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <time>{formatRelativeTime(notification.createdAt)}</time>
          {notification.actionUrl && (
            <a
              href={notification.actionUrl}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              {notification.actionLabel} →
            </a>
          )}
        </div>
      </div>
      
      <div className="flex gap-1">
        {!notification.read && (
          <button
            onClick={onMarkRead}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded transition-colors"
            title="Segna come letta"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 rounded transition-colors"
          title="Elimina"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
```

---

### 10.3 Browser Notifications (Permission-based)

```typescript
// lib/notifications/browser.ts

// Request permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Browser notifications not supported')
    return false
  }
  
  if (Notification.permission === 'granted') {
    return true
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  
  return false
}

// Show browser notification
export function showBrowserNotification({
  title,
  body,
  icon = '/logo-icon.png',
  tag,
  onClick,
}: {
  title: string
  body: string
  icon?: string
  tag?: string
  onClick?: () => void
}) {
  if (Notification.permission !== 'granted') {
    return
  }
  
  const notification = new Notification(title, {
    body,
    icon,
    tag, // Same tag replaces previous notification
    badge: '/logo-icon.png',
    vibrate: [200, 100, 200],
  })
  
  if (onClick) {
    notification.onclick = onClick
  }
  
  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000)
}

// Usage example
showBrowserNotification({
  title: 'Automazione in errore',
  body: 'Daily Deals: Telegram bot non autorizzato',
  tag: 'automation-error-123',
  onClick: () => {
    window.focus()
    router.push('/settings/channels')
  },
})
```

---

## 11. Technical Implementation (In-App)

### 11.1 WebSocket Real-Time Push

```typescript
// lib/websocket/client.ts
import { io, Socket } from 'socket.io-client'

class NotificationSocket {
  private socket: Socket | null = null
  
  connect(userId: string, token: string) {
    this.socket = io('wss://afflyt.io', {
      auth: { token },
      query: { userId },
    })
    
    this.socket.on('notification', (data) => {
      this.handleNotification(data)
    })
    
    this.socket.on('connect', () => {
      console.log('Notifications connected')
    })
    
    this.socket.on('disconnect', () => {
      console.log('Notifications disconnected')
    })
  }
  
  disconnect() {
    this.socket?.disconnect()
  }
  
  private handleNotification(notification: any) {
    // Add to store
    useNotificationStore.getState().addNotification(notification)
    
    // Show toast
    if (notification.priority !== 'LOW') {
      showToast(notification)
    }
    
    // Play sound
    if (notification.sound) {
      playNotificationSound()
    }
    
    // Browser notification (if permission granted)
    if (notification.priority === 'CRITICAL' || notification.priority === 'HIGH') {
      showBrowserNotification({
        title: notification.title,
        body: notification.message,
        onClick: () => {
          if (notification.actionUrl) {
            router.push(notification.actionUrl)
          }
        },
      })
    }
  }
}

export const notificationSocket = new NotificationSocket()
```

---

### 11.2 Notification Store (Zustand)

```typescript
// stores/notificationStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: !notification.read ? state.unreadCount + 1 : state.unreadCount,
        }))
      },
      
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true, readAt: new Date() } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }))
        
        // Also update in backend
        fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      },
      
      markAllAsRead: () => {
        const unreadIds = get().notifications
          .filter((n) => !n.read)
          .map((n) => n.id)
        
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }))
        
        // Batch update in backend
        fetch('/api/notifications/read-all', {
          method: 'POST',
          body: JSON.stringify({ ids: unreadIds }),
        })
      },
      
      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: state.notifications.find((n) => n.id === id)?.read
            ? state.unreadCount
            : Math.max(0, state.unreadCount - 1),
        }))
        
        fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      },
      
      clearAll: () => {
        set({ notifications: [], unreadCount: 0 })
        fetch('/api/notifications', { method: 'DELETE' })
      },
    }),
    {
      name: 'notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Keep last 50
        unreadCount: state.unreadCount,
      }),
    }
  )
)
```

---

# PART 3: TELEGRAM NOTIFICATIONS

---

## 12. Telegram Bot Architecture

### 12.1 Bot Setup

```typescript
// lib/telegram/bot.ts
import { Bot, InlineKeyboard } from 'grammy'

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

// Start command
bot.command('start', async (ctx) => {
  await ctx.reply(
    `🚀 Benvenuto su Afflyt Bot!

Collega il tuo account per ricevere notifiche in tempo reale:

• 📊 Report giornalieri
• ⚠️ Alert automazioni
• 💰 Aggiornamenti revenue
• 🎯 Deal pubblicati

Usa /link per collegare il tuo account.`,
    {
      reply_markup: new InlineKeyboard()
        .url('Collega Account', 'https://afflyt.io/settings/notifications?connect=telegram')
    }
  )
})

// Link account command
bot.command('link', async (ctx) => {
  const telegramId = ctx.from.id
  const username = ctx.from.username
  
  // Generate one-time linking code
  const linkingCode = await generateTelegramLinkingCode(telegramId, username)
  
  await ctx.reply(
    `🔗 Codice di collegamento:

<code>${linkingCode}</code>

Inserisci questo codice nelle impostazioni di Afflyt per collegare il tuo account.

Il codice scade tra 10 minuti.`,
    {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard()
        .url('Vai alle Impostazioni', 'https://afflyt.io/settings/notifications')
    }
  )
})

// Status command
bot.command('status', async (ctx) => {
  const telegramId = ctx.from.id
  const user = await getUserByTelegramId(telegramId)
  
  if (!user) {
    return ctx.reply('Account non collegato. Usa /link per collegarlo.')
  }
  
  const stats = await getDashboardStats(user.id)
  
  await ctx.reply(
    `📊 <b>Stato Account</b>

👤 ${user.name}
📧 ${user.email}
💎 Piano: ${user.tier}

<b>Oggi:</b>
💰 Revenue: €${stats.today.revenue}
👆 Clicks: ${stats.today.clicks}
📈 CVR: ${stats.today.cvr}%

<b>Automazioni:</b>
✅ Attive: ${stats.automations.active}
⏸️ In pausa: ${stats.automations.paused}
❌ Errori: ${stats.automations.error}`,
    {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard()
        .url('Dashboard', 'https://afflyt.io/dashboard')
    }
  )
})

// Help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    `📖 <b>Comandi Disponibili</b>

/start - Inizia
/link - Collega account
/status - Stato account
/mute - Disattiva notifiche (1h, 8h, 24h)
/unmute - Riattiva notifiche
/report - Report giornaliero
/help - Questo messaggio

Per impostazioni avanzate, visita:
https://afflyt.io/settings/notifications`,
    { parse_mode: 'HTML' }
  )
})

// Mute command
bot.command('mute', async (ctx) => {
  await ctx.reply(
    'Per quanto tempo vuoi disattivare le notifiche?',
    {
      reply_markup: new InlineKeyboard()
        .text('1 ora', 'mute_1h').text('8 ore', 'mute_8h').row()
        .text('24 ore', 'mute_24h').text('Finché non riattivo', 'mute_forever')
    }
  )
})

// Callback query handler
bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data
  
  if (data.startsWith('mute_')) {
    const duration = data.split('_')[1]
    const telegramId = ctx.from.id
    
    await muteTelegramNotifications(telegramId, duration)
    
    await ctx.answerCallbackQuery({
      text: `✅ Notifiche disattivate per ${duration === 'forever' ? 'sempre' : duration}`,
    })
    
    await ctx.editMessageText(`🔕 Notifiche disattivate

Usa /unmute per riattivarle.`)
  }
})

bot.start()
```

---

## 13. Notification Types & Triggers

### 13.1 Telegram Notification Matrix

| Event | Enabled by Default | User Can Disable | Format | Frequency |
|-------|-------------------|------------------|--------|-----------|
| **Deal Published** | ✅ | ✅ | Batched | Every 15 min |
| **Automation Error** | ✅ | ❌ | Immediate | Real-time |
| **Payment Failed** | ✅ | ❌ | Immediate | Once + reminders |
| **Daily Report** | ✅ | ✅ | Scheduled | 9:00 AM |
| **TTL Warning** | ✅ | ❌ | Immediate | Once at 80%, 90%, 95% |
| **New Feature** | ✅ | ✅ | Scheduled | Max 1/week |

---

### 13.2 Notification Examples

#### **A. Deal Published (Batched)**
```typescript
// Batched every 15 minutes
const message = `📢 <b>Nuovi Deal Pubblicati</b>

${deals.slice(0, 3).map(deal => `
🔹 <b>${deal.title}</b>
💰 ${deal.price} (${deal.discount}% off)
🔗 <a href="${deal.amazonUrl}">Vedi su Amazon</a>
📊 Deal Score: ${deal.dealScore}/100
`).join('\n')}

${deals.length > 3 ? `\n... e altri ${deals.length - 3} deal` : ''}

<a href="https://afflyt.io/dashboard">📊 Vedi Dashboard Completa</a>`

await bot.api.sendMessage(telegramId, message, {
  parse_mode: 'HTML',
  disable_web_page_preview: true,
})
```

**Output**:
```
📢 Nuovi Deal Pubblicati

🔹 Wireless Mouse Pro
💰 €24.99 (40% off)
🔗 Vedi su Amazon
📊 Deal Score: 87/100

🔹 Gaming Keyboard RGB
💰 €49.99 (35% off)
🔗 Vedi su Amazon
📊 Deal Score: 82/100

... e altri 12 deal

📊 Vedi Dashboard Completa
```

---

#### **B. Automation Error (Critical)**
```typescript
const message = `⚠️ <b>Automazione in Errore</b>

<b>Automazione:</b> ${automation.name}
<b>Errore:</b> ${error.message}
<b>Orario:</b> ${formatTime(new Date())}

<b>Azione richiesta:</b>
${getErrorResolution(error.code)}

<a href="https://afflyt.io/automations/${automation.id}">🔧 Risolvi Ora</a>`

await bot.api.sendMessage(telegramId, message, {
  parse_mode: 'HTML',
  reply_markup: new InlineKeyboard()
    .url('Risolvi Ora', `https://afflyt.io/automations/${automation.id}`)
    .row()
    .text('Metti in pausa', `pause_automation_${automation.id}`)
})
```

---

#### **C. Daily Report (Scheduled)**
```typescript
const message = `📊 <b>Report Giornaliero - ${formatDate(new Date())}</b>

💰 <b>Revenue:</b> €${stats.revenue} <i>(${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%)</i>
👆 <b>Clicks:</b> ${stats.clicks} <i>(${stats.clicksChange > 0 ? '+' : ''}${stats.clicksChange}%)</i>
✅ <b>Conversioni:</b> ${stats.conversions}
📈 <b>CVR:</b> ${stats.cvr}%

<b>Top Deal:</b>
🏆 ${topDeal.title}
💰 €${topDeal.revenue} • ${topDeal.clicks} clicks

<b>Insight:</b>
${generateInsight(stats)}

<a href="https://afflyt.io/analytics">📈 Vedi Report Completo</a>`

await bot.api.sendMessage(telegramId, message, {
  parse_mode: 'HTML',
})
```

---

#### **D. Payment Failed (Urgent)**
```typescript
const message = `🚨 <b>Problema Pagamento</b>

Il pagamento per Afflyt PRO è fallito.

<b>Motivo:</b> ${paymentError.reason}
<b>Importo:</b> €${amount}

<b>⚠️ Conseguenze:</b>
• Account sospeso tra ${daysRemaining} giorni
• Automazioni disattivate
• Perdita accesso dati

<b>👉 Azione Immediata Richiesta</b>

<a href="https://afflyt.io/settings/billing">💳 Aggiorna Pagamento</a>`

await bot.api.sendMessage(telegramId, message, {
  parse_mode: 'HTML',
  reply_markup: new InlineKeyboard()
    .url('Aggiorna Carta', 'https://afflyt.io/settings/billing')
})
```

---

## 14. Message Design & Formatting

### 14.1 Formatting Guidelines

**Telegram HTML Supported Tags**:
```html
<b>Bold</b>
<i>Italic</i>
<u>Underline</u>
<s>Strikethrough</s>
<code>Monospace</code>
<pre>Code block</pre>
<a href="URL">Link</a>
```

**Best Practices**:
```typescript
✅ DO:
- Use <b> for headers and important info
- Use <i> for metadata (timestamps, changes)
- Use <code> for codes, tokens, ASINs
- Use <a> for actionable links
- Add emoji for visual hierarchy (max 3-4 per message)
- Keep messages <4096 characters (Telegram limit)

❌ DON'T:
- Overuse formatting (looks spammy)
- Use emoji excessively (>5 per message)
- Send walls of text (break into multiple messages)
- Use shortened URLs (looks suspicious)
```

### 14.2 Message Templates

**Template Structure**:
```typescript
interface TelegramMessageTemplate {
  icon: string // Emoji
  title: string
  body: string
  metadata?: Record<string, string>
  insight?: string
  action?: {
    label: string
    url: string
  }
  buttons?: InlineKeyboardButton[][]
}

// Example: Error notification
const errorTemplate: TelegramMessageTemplate = {
  icon: '⚠️',
  title: 'Automazione in Errore',
  body: `
<b>Automazione:</b> {{automation_name}}
<b>Errore:</b> {{error_message}}
<b>Orario:</b> {{timestamp}}
  `.trim(),
  metadata: {
    'Ultima pubblicazione': '2 ore fa',
    'Deal mancati': '15',
  },
  action: {
    label: 'Risolvi Ora',
    url: 'https://afflyt.io/automations/{{automation_id}}',
  },
  buttons: [[
    { text: 'Risolvi', url: '...' },
    { text: 'Pausa', callback_data: 'pause_{{automation_id}}' },
  ]],
}
```

---

## 15. Bot Commands & Interactions

### 15.1 Command Reference

```
/start - Inizia e collega account
/link - Genera codice di collegamento
/status - Mostra stato account e statistiche oggi
/report - Invia report giornaliero ora
/mute [1h|8h|24h|always] - Disattiva notifiche
/unmute - Riattiva notifiche
/settings - Link a impostazioni notifiche
/help - Mostra questo elenco
```

### 15.2 Interactive Buttons

```typescript
// Inline keyboard examples

// Single button
new InlineKeyboard()
  .url('Vedi Dashboard', 'https://afflyt.io/dashboard')

// Multiple buttons (row)
new InlineKeyboard()
  .url('Dashboard', 'https://afflyt.io/dashboard')
  .url('Impostazioni', 'https://afflyt.io/settings')

// Multiple rows
new InlineKeyboard()
  .text('Mute 1h', 'mute_1h').text('Mute 8h', 'mute_8h').row()
  .text('Mute 24h', 'mute_24h').text('Mute sempre', 'mute_forever')

// Callback data handling
bot.on('callback_query:data', async (ctx) => {
  const action = ctx.callbackQuery.data
  
  if (action.startsWith('pause_automation_')) {
    const automationId = action.replace('pause_automation_', '')
    await pauseAutomation(automationId)
    await ctx.answerCallbackQuery({ text: '✅ Automazione messa in pausa' })
  }
})
```

---

## 16. Notification Preference Center

### 16.1 Settings UI

```typescript
// pages/settings/notifications.tsx

export default function NotificationSettings() {
  const { preferences, updatePreference } = useNotificationPreferences()
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Preferenze Notifiche</h2>
        <p className="text-gray-400">
          Controlla quando e come ricevere notifiche
        </p>
      </div>
      
      {/* Email Notifications */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email
        </h3>
        
        <NotificationToggle
          label="Deal pubblicati"
          description="Ricevi email quando vengono pubblicati nuovi deal"
          value={preferences.email.dealPublished}
          onChange={(v) => updatePreference('email', 'dealPublished', v)}
          frequency={preferences.email.dealPublishedFrequency}
          onFrequencyChange={(f) => updatePreference('email', 'dealPublishedFrequency', f)}
        />
        
        <NotificationToggle
          label="Report settimanale"
          description="Report con metriche e insights ogni settimana"
          value={preferences.email.weeklyReport}
          onChange={(v) => updatePreference('email', 'weeklyReport', v)}
        />
        
        <NotificationToggle
          label="Novità prodotto"
          description="Annunci di nuove funzionalità e aggiornamenti"
          value={preferences.email.productUpdates}
          onChange={(v) => updatePreference('email', 'productUpdates', v)}
        />
      </section>
      
      {/* In-App Notifications */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          In-App
        </h3>
        
        <NotificationToggle
          label="Toast notifications"
          description="Notifiche temporanee nell'angolo dello schermo"
          value={preferences.inApp.toast}
          onChange={(v) => updatePreference('inApp', 'toast', v)}
        />
        
        <NotificationToggle
          label="Suoni"
          description="Riproduci suoni per notifiche importanti"
          value={preferences.inApp.sound}
          onChange={(v) => updatePreference('inApp', 'sound', v)}
        />
        
        <NotificationToggle
          label="Browser notifications"
          description="Notifiche del browser anche quando la tab non è attiva"
          value={preferences.inApp.browser}
          onChange={(v) => updatePreference('inApp', 'browser', v)}
          requires="permission"
          onRequestPermission={requestNotificationPermission}
        />
      </section>
      
      {/* Telegram Notifications */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Telegram
        </h3>
        
        {preferences.telegram.connected ? (
          <>
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-400">
                  Collegato a @{preferences.telegram.username}
                </p>
              </div>
              <button
                onClick={disconnectTelegram}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Scollega
              </button>
            </div>
            
            <NotificationToggle
              label="Report giornaliero"
              description="Ricevi statistiche giornaliere alle 9:00 AM"
              value={preferences.telegram.dailyReport}
              onChange={(v) => updatePreference('telegram', 'dailyReport', v)}
            />
            
            <NotificationToggle
              label="Alert automazioni"
              description="Notifiche immediate per errori nelle automazioni"
              value={preferences.telegram.automationAlerts}
              onChange={(v) => updatePreference('telegram', 'automationAlerts', v)}
              disabled // Cannot disable critical alerts
            />
          </>
        ) : (
          <div className="p-6 border-2 border-dashed border-gray-700 rounded-xl text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <h4 className="font-semibold mb-2">Telegram non collegato</h4>
            <p className="text-sm text-gray-400 mb-4">
              Ricevi notifiche in tempo reale su Telegram
            </p>
            <Button onClick={connectTelegram}>
              Collega Telegram
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
```

---

## 17. Multi-Channel Orchestration

### 17.1 Notification Rules Engine

```typescript
// lib/notifications/orchestrator.ts

interface NotificationRule {
  event: string
  channels: {
    email?: EmailConfig
    inApp?: InAppConfig
    telegram?: TelegramConfig
  }
  conditions?: Condition[]
}

const NOTIFICATION_RULES: NotificationRule[] = [
  // Deal Published
  {
    event: 'deal.published',
    channels: {
      email: {
        enabled: true,
        template: 'deal-published',
        batching: {
          interval: 15 * 60 * 1000, // 15 minutes
          max: 50, // Max 50 deals per batch
        },
        userControlled: true,
      },
      inApp: {
        enabled: true,
        type: 'toast',
        priority: 'LOW',
        autoDismiss: 5000,
      },
      telegram: {
        enabled: true,
        template: 'deal-published',
        batching: {
          interval: 15 * 60 * 1000,
          max: 10, // Show max 10 in Telegram
        },
        userControlled: true,
      },
    },
  },
  
  // Automation Error
  {
    event: 'automation.error',
    channels: {
      email: {
        enabled: true,
        template: 'automation-error',
        immediate: true,
        throttle: {
          perAutomation: 6 * 60 * 60 * 1000, // Max 1 per 6h per automation
        },
      },
      inApp: {
        enabled: true,
        type: 'toast',
        priority: 'HIGH',
        persistent: true,
        sound: true,
      },
      telegram: {
        enabled: true,
        template: 'automation-error',
        immediate: true,
        userControlled: false, // Cannot disable
      },
    },
  },
  
  // Payment Failed
  {
    event: 'payment.failed',
    channels: {
      email: {
        enabled: true,
        template: 'payment-failed',
        immediate: true,
        followUp: [
          { delay: 3 * 24 * 60 * 60 * 1000, template: 'payment-failed-reminder' },
          { delay: 7 * 24 * 60 * 60 * 1000, template: 'payment-failed-final' },
        ],
      },
      inApp: {
        enabled: true,
        type: 'modal', // Blocks UI
        priority: 'CRITICAL',
        persistent: true,
        sound: true,
      },
      telegram: {
        enabled: true,
        template: 'payment-failed',
        immediate: true,
        userControlled: false,
      },
    },
  },
]

// Orchestrator function
export async function sendNotification(
  event: string,
  userId: string,
  data: any
) {
  const rule = NOTIFICATION_RULES.find((r) => r.event === event)
  if (!rule) {
    console.warn(`No notification rule for event: ${event}`)
    return
  }
  
  const user = await getUser(userId)
  const preferences = await getNotificationPreferences(userId)
  
  // Check user preferences and send via appropriate channels
  const promises = []
  
  // Email
  if (rule.channels.email?.enabled && shouldSendEmail(rule, preferences)) {
    promises.push(sendEmailNotification(user, rule.channels.email, data))
  }
  
  // In-App
  if (rule.channels.inApp?.enabled && shouldSendInApp(rule, preferences)) {
    promises.push(sendInAppNotification(user, rule.channels.inApp, data))
  }
  
  // Telegram
  if (rule.channels.telegram?.enabled && shouldSendTelegram(rule, preferences)) {
    promises.push(sendTelegramNotification(user, rule.channels.telegram, data))
  }
  
  await Promise.allSettled(promises)
}
```

---

## 18. Analytics & Monitoring

### 18.1 Notification Metrics

```typescript
// Track all notification events
interface NotificationEvent {
  id: string
  userId: string
  type: string // 'sent', 'delivered', 'opened', 'clicked', 'failed'
  channel: 'email' | 'in-app' | 'telegram'
  notificationId: string
  metadata: any
  createdAt: Date
}

// Key Metrics to Track
const NOTIFICATION_METRICS = {
  // Delivery
  'email.sent': 'Total emails sent',
  'email.delivered': 'Delivered to inbox',
  'email.bounced': 'Bounced (hard/soft)',
  'email.spam': 'Marked as spam',
  
  // Engagement
  'email.opened': 'Email opened',
  'email.clicked': 'Link clicked in email',
  'inApp.seen': 'In-app notification seen',
  'inApp.clicked': 'In-app notification clicked',
  'telegram.sent': 'Telegram message sent',
  'telegram.clicked': 'Telegram button clicked',
  
  // User Actions
  'user.unsubscribed': 'Unsubscribed from emails',
  'user.muted': 'Muted notifications (temp)',
  'user.disabled': 'Disabled notification type',
}

// Dashboard Analytics
export async function getNotificationAnalytics(
  userId: string,
  dateRange: { start: Date; end: Date }
) {
  return {
    email: {
      sent: await countEvents('email.sent', userId, dateRange),
      delivered: await countEvents('email.delivered', userId, dateRange),
      opened: await countEvents('email.opened', userId, dateRange),
      clicked: await countEvents('email.clicked', userId, dateRange),
      openRate: await calculateRate('email.opened', 'email.delivered', userId, dateRange),
      clickRate: await calculateRate('email.clicked', 'email.opened', userId, dateRange),
    },
    inApp: {
      shown: await countEvents('inApp.seen', userId, dateRange),
      clicked: await countEvents('inApp.clicked', userId, dateRange),
      clickRate: await calculateRate('inApp.clicked', 'inApp.seen', userId, dateRange),
    },
    telegram: {
      sent: await countEvents('telegram.sent', userId, dateRange),
      clicked: await countEvents('telegram.clicked', userId, dateRange),
      clickRate: await calculateRate('telegram.clicked', 'telegram.sent', userId, dateRange),
    },
  }
}
```

---

### 18.2 Alert Monitoring

```typescript
// Monitor notification system health

// Alert conditions
const ALERT_CONDITIONS = {
  // High bounce rate
  emailBounceRate: {
    threshold: 5, // %
    window: 24 * 60 * 60 * 1000, // 24h
    action: 'pause_email_sending',
  },
  
  // Low delivery rate
  emailDeliveryRate: {
    threshold: 95, // %
    window: 1 * 60 * 60 * 1000, // 1h
    action: 'check_esp_status',
  },
  
  // High unsubscribe rate
  unsubscribeRate: {
    threshold: 2, // %
    window: 7 * 24 * 60 * 60 * 1000, // 7 days
    action: 'review_email_content',
  },
  
  // WebSocket disconnections
  websocketDisconnectRate: {
    threshold: 10, // %
    window: 5 * 60 * 1000, // 5 min
    action: 'restart_websocket_server',
  },
}

// Monitoring job (runs every 5 minutes)
schedule('*/5 * * * *', async () => {
  for (const [metric, config] of Object.entries(ALERT_CONDITIONS)) {
    const rate = await calculateMetricRate(metric, config.window)
    
    if (shouldAlert(rate, config.threshold, metric)) {
      await sendAlertToTeam({
        severity: 'warning',
        metric,
        current: rate,
        threshold: config.threshold,
        action: config.action,
      })
    }
  }
})
```

---

## 19. Emergency & Critical Alerts

### 19.1 System-Wide Incidents

```typescript
// Broadcast critical message to all active users
export async function broadcastEmergencyAlert({
  title,
  message,
  severity, // 'info' | 'warning' | 'critical'
  actionUrl,
  actionLabel,
}: {
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  actionUrl?: string
  actionLabel?: string
}) {
  // Get all active users
  const users = await db.user.findMany({
    where: {
      emailVerified: true,
      status: 'active',
    },
  })
  
  // Send via all channels immediately
  await Promise.all([
    // Email
    queueBulkEmails(users.map(u => ({
      to: u.email,
      subject: `[${severity.toUpperCase()}] ${title}`,
      template: <EmergencyAlertEmail
        title={title}
        message={message}
        severity={severity}
        actionUrl={actionUrl}
        actionLabel={actionLabel}
      />,
    }))),
    
    // In-App (WebSocket broadcast)
    broadcastWebSocketNotification({
      type: severity === 'critical' ? 'ERROR' : 'WARNING',
      title,
      message,
      priority: 'CRITICAL',
      modal: severity === 'critical',
      actionUrl,
      actionLabel,
    }),
    
    // Telegram
    users.filter(u => u.telegramId).map(u =>
      bot.api.sendMessage(u.telegramId!, formatEmergencyAlertTelegram({
        title,
        message,
        severity,
        actionUrl,
      }), { parse_mode: 'HTML' })
    ),
  ])
  
  // Log incident
  await db.incident.create({
    data: {
      title,
      message,
      severity,
      notifiedUsers: users.length,
      createdAt: new Date(),
    },
  })
}

// Usage example
await broadcastEmergencyAlert({
  title: 'Maintenance Programmata',
  message: 'Afflyt sarà offline per manutenzione il 15 dicembre dalle 02:00 alle 04:00 UTC. Le automazioni saranno temporaneamente sospese.',
  severity: 'warning',
  actionUrl: 'https://status.afflyt.io',
  actionLabel: 'Vedi Status Page',
})
```

---

## 20. Testing & Quality Assurance

### 20.1 Email Testing Checklist

```
□ Rendering
  □ Gmail (desktop + mobile)
  □ Outlook (2016, 2019, 365)
  □ Apple Mail (macOS + iOS)
  □ Yahoo Mail
  □ ProtonMail

□ Content
  □ All variables replaced correctly
  □ Links work (not 404)
  □ Unsubscribe link works
  □ Images load (with alt text)
  □ No broken HTML

□ Deliverability
  □ SPF passes
  □ DKIM passes
  □ DMARC passes
  □ Spam score <5 (Mail Tester)
  □ No blacklisted IPs

□ Localization
  □ Italian translations correct
  □ English translations correct
  □ Date/time formats correct
  □ Currency formats correct

□ Accessibility
  □ Semantic HTML structure
  □ Alt text on images
  □ High contrast ratios
  □ Plain text version included
```

### 20.2 Notification Testing Script

```typescript
// test/notifications.test.ts

describe('Notification System', () => {
  describe('Email Notifications', () => {
    it('sends magic link email', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Accedi ad Afflyt',
        template: <MagicLinkEmail
          name="Test User"
          magicLink="https://afflyt.io/auth/verify?token=test"
          expiryMinutes={15}
          locale="it"
        />,
      })
      
      expect(result.success).toBe(true)
      expect(result.emailId).toBeDefined()
    })
    
    it('respects user preferences', async () => {
      // User has disabled marketing emails
      await updatePreferences(userId, { email: { productUpdates: false } })
      
      const result = await sendNotification('product.new_feature', userId, {})
      
      expect(result.email).toBeNull() // Should not send
      expect(result.inApp).toBeDefined() // Should still show in-app
    })
  })
  
  describe('In-App Notifications', () => {
    it('creates notification in database', async () => {
      await sendInAppNotification(userId, {
        type: 'INFO',
        title: 'Test',
        message: 'Test message',
      })
      
      const notifications = await getNotifications(userId)
      expect(notifications).toHaveLength(1)
      expect(notifications[0].title).toBe('Test')
    })
    
    it('marks as read', async () => {
      const notificationId = await createNotification(userId, {...})
      await markAsRead(notificationId)
      
      const notification = await getNotification(notificationId)
      expect(notification.read).toBe(true)
      expect(notification.readAt).toBeDefined()
    })
  })
  
  describe('Telegram Notifications', () => {
    it('sends message to connected user', async () => {
      const user = await createTestUser({ telegramId: 123456 })
      
      await sendTelegramNotification(user.id, {
        template: 'daily-report',
        data: {...},
      })
      
      // Verify message sent (mock bot API)
      expect(mockBot.api.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('Report Giornaliero'),
        expect.any(Object)
      )
    })
  })
})
```

---

## 📚 Appendix

### A. Quick Reference: Notification Decision Tree

```
User performs action
  ↓
Is it critical? (payment, security)
  YES → Send via ALL channels (Email + In-App + Telegram)
  NO  ↓
  
Does user have preferences set?
  YES → Follow preferences
  NO  ↓
  
Use default rules:
  - Transactional → Email + In-App
  - Operational → In-App + Telegram (if connected)
  - Marketing → Email only (opt-in required)
```

### B. Contact & Support

**Notification System Issues**:
- Engineering: engineering@afflyt.io
- Product: product@afflyt.io

**Deliverability Issues**:
- ESP Support (Resend): support@resend.com
- Internal: devops@afflyt.io

---

**End of Guide**  
Version: 1.0  
Last Updated: November 26, 2025  
Maintained by: Afflyt Product Team