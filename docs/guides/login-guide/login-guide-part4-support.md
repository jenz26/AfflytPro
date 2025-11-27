# Afflyt Pro - Login System Guide (Part 4/4)
## Support Integration & Edge Cases

**Version**: 1.0  
**Last Updated**: November 27, 2025

---

## 📋 Part 4 Contents

1. Support Widget Integration
2. Edge Case Handling
3. Monitoring & Analytics
4. Production Checklist

---

## 1. Support Widget Integration

### 1.1 Crisp Setup

```typescript
// lib/crisp.ts
// Crisp Chat Widget Integration

declare global {
  interface Window {
    $crisp: any
    CRISP_WEBSITE_ID: string
  }
}

export function initializeCrisp() {
  window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID!
  
  ;(function() {
    const d = document
    const s = d.createElement('script')
    s.src = 'https://client.crisp.chat/l.js'
    s.async = true
    d.getElementsByTagName('head')[0].appendChild(s)
  })()
}

// Open chat widget
export function openSupportChat() {
  if (window.$crisp) {
    window.$crisp.push(['do', 'chat:open'])
  }
}

// Set user context
export function setSupportUser(user: {
  email: string
  name?: string
  tier?: string
}) {
  if (window.$crisp) {
    window.$crisp.push(['set', 'user:email', user.email])
    if (user.name) {
      window.$crisp.push(['set', 'user:nickname', user.name])
    }
    if (user.tier) {
      window.$crisp.push(['set', 'session:data', [[['tier', user.tier]]]])
    }
  }
}

// Send custom event
export function trackSupportEvent(event: string, data?: any) {
  if (window.$crisp) {
    window.$crisp.push(['set', 'session:event', [[event, data]]])
  }
}
```

---

### 1.2 Support Button Component

```typescript
// components/support/SupportButton.tsx

'use client'

import { MessageCircle } from 'lucide-react'
import { openSupportChat } from '@/lib/crisp'

interface Props {
  variant?: 'button' | 'link'
  className?: string
  context?: string // e.g., 'login_page', 'magic_link_failed'
}

export function SupportButton({ 
  variant = 'link', 
  className = '',
  context 
}: Props) {
  function handleClick() {
    // Track that user clicked support from this context
    if (context) {
      trackSupportEvent('support_requested', { context })
    }
    
    // Open Crisp chat
    openSupportChat()
  }
  
  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={`
          inline-flex items-center gap-2 px-4 py-2 
          bg-gray-800 hover:bg-gray-700 
          text-white rounded-lg 
          transition-colors ${className}
        `}
      >
        <MessageCircle className="w-4 h-4" />
        <span>Contatta il supporto</span>
      </button>
    )
  }
  
  return (
    <button
      onClick={handleClick}
      className={`
        text-sm text-gray-500 hover:text-gray-400 
        transition-colors underline-offset-2 hover:underline 
        ${className}
      `}
    >
      Contatta il supporto
    </button>
  )
}
```

---

### 1.3 Context-Aware Support Messages

```typescript
// lib/support/context-messages.ts

interface SupportContext {
  title: string
  preMessage: string // Pre-filled message in chat
  tags: string[] // For Crisp filtering
}

export const SUPPORT_CONTEXTS: Record<string, SupportContext> = {
  // Login issues
  magic_link_not_received: {
    title: 'Magic Link non ricevuto',
    preMessage: 'Non ho ricevuto il magic link. Ho controllato spam e promozioni.',
    tags: ['login', 'magic_link', 'email_issue'],
  },
  
  magic_link_expired: {
    title: 'Magic Link scaduto',
    preMessage: 'Il magic link è scaduto prima che potessi usarlo.',
    tags: ['login', 'magic_link', 'expired'],
  },
  
  password_not_working: {
    title: 'Password non funziona',
    preMessage: 'Non riesco ad accedere con la mia password.',
    tags: ['login', 'password', 'access_issue'],
  },
  
  account_locked: {
    title: 'Account bloccato',
    preMessage: 'Il mio account è stato bloccato per troppi tentativi di accesso.',
    tags: ['login', 'locked', 'urgent'],
  },
  
  // Email issues
  email_delivery_problem: {
    title: 'Problema consegna email',
    preMessage: 'Non ricevo email da Afflyt (magic link, notifiche, etc).',
    tags: ['email', 'deliverability', 'technical'],
  },
  
  // Account issues
  cant_access_email: {
    title: 'Non posso accedere alla mia email',
    preMessage: 'Ho perso accesso alla mia email e non riesco ad accedere al mio account.',
    tags: ['account', 'recovery', 'urgent'],
  },
  
  account_suspended: {
    title: 'Account sospeso',
    preMessage: 'Il mio account risulta sospeso. Posso sapere il motivo?',
    tags: ['account', 'suspended', 'urgent'],
  },
  
  // General
  other_issue: {
    title: 'Altro problema',
    preMessage: 'Ho un problema con il login.',
    tags: ['login', 'other'],
  },
}

// Open support with context
export function openSupportWithContext(contextKey: string) {
  const context = SUPPORT_CONTEXTS[contextKey]
  
  if (!context) {
    openSupportChat()
    return
  }
  
  if (window.$crisp) {
    // Set context tags
    window.$crisp.push(['set', 'session:segments', [context.tags]])
    
    // Pre-fill message
    window.$crisp.push(['set', 'message:text', [context.preMessage]])
    
    // Open chat
    window.$crisp.push(['do', 'chat:open'])
  }
}
```

---

### 1.4 Inline Support Helpers

```typescript
// components/support/LoginHelpCard.tsx
// Shows contextual help based on login state

'use client'

import { AlertCircle, Mail, Clock, HelpCircle } from 'lucide-react'
import { openSupportWithContext } from '@/lib/support/context-messages'

interface Props {
  scenario: 
    | 'magic_link_sent'
    | 'magic_link_expired'
    | 'email_not_received'
    | 'general'
}

export function LoginHelpCard({ scenario }: Props) {
  const content = {
    magic_link_sent: {
      icon: Mail,
      title: 'Controlla la tua email',
      tips: [
        'Il link arriva entro 30 secondi',
        'Controlla la cartella spam o promozioni',
        'Cerca email da noreply@afflyt.io',
        'Il link scade dopo 15 minuti',
      ],
      action: {
        label: 'Non ricevo la email',
        context: 'magic_link_not_received',
      },
    },
    
    magic_link_expired: {
      icon: Clock,
      title: 'Link scaduto',
      tips: [
        'I magic link scadono dopo 15 minuti per sicurezza',
        'Richiedi un nuovo link dalla pagina di login',
        'Il nuovo link sostituisce quello vecchio',
      ],
      action: {
        label: 'Ho ancora problemi',
        context: 'magic_link_expired',
      },
    },
    
    email_not_received: {
      icon: AlertCircle,
      title: 'Email non ricevuta?',
      tips: [
        'Attendi 1-2 minuti (a volte le email sono lente)',
        'Controlla spam, promozioni, e altre cartelle',
        'Verifica che l\'email sia scritta correttamente',
        'Alcuni provider email bloccano link di login',
      ],
      action: {
        label: 'Contatta il supporto',
        context: 'email_delivery_problem',
      },
    },
    
    general: {
      icon: HelpCircle,
      title: 'Serve aiuto?',
      tips: [
        'Il nostro supporto risponde in media entro 2 ore',
        'Siamo disponibili 7 giorni su 7',
        'Puoi anche usare la password se l\'hai impostata',
      ],
      action: {
        label: 'Contatta il supporto',
        context: 'other_issue',
      },
    },
  }
  
  const { icon: Icon, title, tips, action } = content[scenario]
  
  return (
    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
      <div className="flex items-start gap-3 mb-3">
        <Icon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-white mb-2">{title}</h3>
          <ul className="space-y-1.5">
            {tips.map((tip, index) => (
              <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <button
        onClick={() => openSupportWithContext(action.context)}
        className="w-full mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
      >
        {action.label}
      </button>
    </div>
  )
}

// Usage in MagicLinkSuccess component
<MagicLinkSuccess email={email}>
  <LoginHelpCard scenario="magic_link_sent" />
</MagicLinkSuccess>
```

---

## 2. Edge Case Handling

### 2.1 Email Provider Issues

```typescript
// lib/email/provider-detection.ts

// Known problematic email providers
const PROBLEMATIC_PROVIDERS = {
  // Aggressive spam filtering
  'outlook.com': {
    issue: 'aggressive_spam_filter',
    tips: [
      'Aggiungi noreply@afflyt.io ai contatti',
      'Controlla la cartella "Posta indesiderata"',
      'Potrebbe servire fino a 2 minuti per ricevere l\'email',
    ],
  },
  'hotmail.com': {
    issue: 'aggressive_spam_filter',
    tips: [
      'Aggiungi noreply@afflyt.io ai contatti',
      'Controlla la cartella "Posta indesiderata"',
    ],
  },
  
  // Corporate email (may block external links)
  'corporate': { // Placeholder for corporate domains
    issue: 'link_blocking',
    tips: [
      'Il tuo provider email potrebbe bloccare link esterni',
      'Prova ad usare un\'email personale',
      'Oppure imposta una password e usa quella',
    ],
  },
}

export function checkEmailProvider(email: string): {
  hasIssues: boolean
  provider?: string
  tips?: string[]
} {
  const domain = email.split('@')[1]?.toLowerCase()
  
  if (!domain) {
    return { hasIssues: false }
  }
  
  const providerInfo = PROBLEMATIC_PROVIDERS[domain]
  
  if (providerInfo) {
    return {
      hasIssues: true,
      provider: domain,
      tips: providerInfo.tips,
    }
  }
  
  // Check if corporate (heuristic)
  const isCorporate = !domain.includes('.com') && 
                     !domain.includes('.it') && 
                     !domain.includes('.net')
  
  if (isCorporate) {
    return {
      hasIssues: true,
      provider: 'corporate',
      tips: PROBLEMATIC_PROVIDERS.corporate.tips,
    }
  }
  
  return { hasIssues: false }
}

// Usage in frontend
const emailCheck = checkEmailProvider(email)

if (emailCheck.hasIssues) {
  return (
    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
      <p className="text-sm text-amber-400 mb-2">
        ⚠️ Email provider potenzialmente problematico
      </p>
      <ul className="text-sm text-gray-400 space-y-1">
        {emailCheck.tips?.map((tip, i) => (
          <li key={i}>• {tip}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

### 2.2 Token Reuse Attempt

```typescript
// When user clicks magic link multiple times

export async function GET(req: NextRequest) {
  // ... existing code ...
  
  // Check if already used
  if (tokenRecord.used) {
    // Log suspicious activity
    await logAuthEvent({
      type: 'TOKEN_REUSE_ATTEMPT',
      email: tokenRecord.email,
      userId: tokenRecord.userId,
      ipAddress: req.ip,
      metadata: {
        tokenId: tokenRecord.id,
        usedAt: tokenRecord.usedAt,
      },
    })
    
    // Check if session already exists
    const session = req.cookies.get('session')
    if (session) {
      // User is already logged in, just redirect
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    // Not logged in, show friendly error
    return redirectWithError(
      '/login',
      'token_already_used',
      'Questo link è già stato usato. Richiedi un nuovo magic link.'
    )
  }
  
  // ... rest of code ...
}
```

---

### 2.3 Disposable Email Detection

```typescript
// lib/email/disposable-check.ts
// Prevent spam signups with disposable emails

const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'mailinator.com',
  'trashmail.com',
  // ... add more
]

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return DISPOSABLE_DOMAINS.includes(domain)
}

// Use in signup
if (type === 'signup' && isDisposableEmail(email)) {
  return NextResponse.json(
    { 
      error: 'disposable_email',
      message: 'Disposable email addresses are not allowed. Please use a permanent email.' 
    },
    { status: 400 }
  )
}
```

---

### 2.4 Session Hijacking Prevention

```typescript
// lib/auth/session-validation.ts

interface SessionValidation {
  isValid: boolean
  reason?: string
  action?: 'logout' | 'challenge' | 'allow'
}

export async function validateSession(
  session: Session,
  request: {
    ipAddress: string
    userAgent: string
  }
): Promise<SessionValidation> {
  // 1. Check if session expired
  if (session.expiresAt < new Date()) {
    return {
      isValid: false,
      reason: 'expired',
      action: 'logout',
    }
  }
  
  // 2. Check if IP changed (potential hijacking)
  if (session.ipAddress !== request.ipAddress) {
    // Log suspicious activity
    await logSecurityEvent({
      type: 'IP_CHANGE_DETECTED',
      userId: session.userId,
      oldIp: session.ipAddress,
      newIp: request.ipAddress,
    })
    
    // For high-security: force re-authentication
    // For better UX: allow but monitor
    return {
      isValid: true, // Allow but flagged
      reason: 'ip_changed',
      action: 'allow',
    }
  }
  
  // 3. Check if user agent changed drastically
  const userAgentChanged = !isSimilarUserAgent(
    session.userAgent,
    request.userAgent
  )
  
  if (userAgentChanged) {
    await logSecurityEvent({
      type: 'USER_AGENT_CHANGE',
      userId: session.userId,
    })
    
    // Could be legitimate (browser update)
    return {
      isValid: true,
      reason: 'user_agent_changed',
      action: 'allow',
    }
  }
  
  return {
    isValid: true,
    action: 'allow',
  }
}

function isSimilarUserAgent(ua1: string, ua2: string): boolean {
  // Simple heuristic: same browser family
  const browser1 = ua1.match(/(Chrome|Firefox|Safari|Edge)/)?.[0]
  const browser2 = ua2.match(/(Chrome|Firefox|Safari|Edge)/)?.[0]
  return browser1 === browser2
}
```

---

### 2.5 Concurrent Login Handling

```typescript
// What happens if user logs in on multiple devices?

// Strategy: Allow multiple sessions, but limit to N active sessions

const MAX_ACTIVE_SESSIONS = 5

export async function createSession(user: User): Promise<string> {
  // Create new session
  const session = /* ... create session ... */
  
  // Check active session count
  const activeSessions = await db.session.count({
    where: {
      userId: user.id,
      expiresAt: { gt: new Date() },
    },
  })
  
  if (activeSessions >= MAX_ACTIVE_SESSIONS) {
    // Delete oldest session
    const oldestSession = await db.session.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'asc' },
    })
    
    if (oldestSession) {
      await db.session.delete({
        where: { id: oldestSession.id },
      })
      
      // Notify user (optional)
      await sendEmail({
        to: user.email,
        subject: 'Sessione rimossa',
        template: 'session-removed',
        data: {
          device: oldestSession.device,
          reason: 'Superato limite di sessioni attive',
        },
      })
    }
  }
  
  return session
}
```

---

## 3. Monitoring & Analytics

### 3.1 Key Metrics to Track

```typescript
// lib/analytics/auth-metrics.ts

export const AUTH_METRICS = {
  // Conversion funnel
  'login_page_viewed': 'User lands on login page',
  'magic_link_requested': 'User requests magic link',
  'magic_link_sent': 'Email sent successfully',
  'magic_link_clicked': 'User clicks link in email',
  'login_success': 'User successfully logged in',
  
  // Errors
  'magic_link_failed': 'Email send failed',
  'magic_link_expired': 'User clicked expired link',
  'token_invalid': 'Invalid token',
  'rate_limit_hit': 'Rate limit exceeded',
  
  // Support
  'support_opened': 'User opened support widget',
  'support_contacted': 'User sent support message',
  
  // Password (fallback)
  'password_login_attempted': 'User tried password login',
  'password_login_failed': 'Password incorrect',
  'password_set': 'User enabled password',
}

// Track with your analytics provider
export function trackAuthEvent(event: keyof typeof AUTH_METRICS, properties?: any) {
  // PostHog
  if (window.posthog) {
    window.posthog.capture(event, properties)
  }
  
  // Google Analytics
  if (window.gtag) {
    window.gtag('event', event, properties)
  }
  
  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.track(event, properties)
  }
}

// Usage
trackAuthEvent('magic_link_requested', {
  email_provider: email.split('@')[1],
  user_type: user ? 'returning' : 'new',
})
```

---

### 3.2 Funnel Analysis Dashboard

```typescript
// Calculate conversion rates

export async function getAuthFunnel(dateRange: DateRange) {
  const events = await db.authEvent.groupBy({
    by: ['type'],
    where: {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    },
    _count: true,
  })
  
  const counts = Object.fromEntries(
    events.map(e => [e.type, e._count])
  )
  
  // Calculate rates
  return {
    steps: {
      1: {
        name: 'Page Views',
        count: counts.PAGE_VIEWED || 0,
        rate: 100,
      },
      2: {
        name: 'Magic Link Requested',
        count: counts.MAGIC_LINK_SENT || 0,
        rate: calculateRate(counts.MAGIC_LINK_SENT, counts.PAGE_VIEWED),
      },
      3: {
        name: 'Email Clicked',
        count: counts.MAGIC_LINK_CLICKED || 0,
        rate: calculateRate(counts.MAGIC_LINK_CLICKED, counts.MAGIC_LINK_SENT),
      },
      4: {
        name: 'Login Success',
        count: counts.USER_LOGGED_IN || 0,
        rate: calculateRate(counts.USER_LOGGED_IN, counts.MAGIC_LINK_CLICKED),
      },
    },
    
    // Drop-off analysis
    dropoff: {
      'request_to_click': counts.MAGIC_LINK_SENT - counts.MAGIC_LINK_CLICKED,
      'click_to_login': counts.MAGIC_LINK_CLICKED - counts.USER_LOGGED_IN,
    },
    
    // Overall conversion
    overallConversion: calculateRate(counts.USER_LOGGED_IN, counts.PAGE_VIEWED),
  }
}

function calculateRate(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 100)
}
```

---

### 3.3 Alerts Configuration

```typescript
// lib/monitoring/alerts.ts
// Set up alerts for critical issues

interface AlertCondition {
  metric: string
  threshold: number
  comparison: 'above' | 'below'
  window: number // minutes
  action: () => Promise<void>
}

const ALERT_CONDITIONS: AlertCondition[] = [
  // Email delivery issues
  {
    metric: 'email_delivery_rate',
    threshold: 90, // %
    comparison: 'below',
    window: 60,
    action: async () => {
      await sendSlackAlert({
        channel: '#alerts',
        message: '🚨 Email delivery rate below 90%! Check ESP status.',
        severity: 'critical',
      })
    },
  },
  
  // High error rate
  {
    metric: 'login_error_rate',
    threshold: 10, // %
    comparison: 'above',
    window: 30,
    action: async () => {
      await sendSlackAlert({
        channel: '#alerts',
        message: '⚠️ Login error rate above 10%. Investigate immediately.',
        severity: 'high',
      })
    },
  },
  
  // Magic link expiry rate
  {
    metric: 'magic_link_expiry_rate',
    threshold: 20, // %
    comparison: 'above',
    window: 60,
    action: async () => {
      await sendSlackAlert({
        channel: '#product',
        message: '📧 High magic link expiry rate. Users may need more time or reminders.',
        severity: 'medium',
      })
    },
  },
  
  // Support volume spike
  {
    metric: 'support_requests',
    threshold: 50, // requests/hour
    comparison: 'above',
    window: 60,
    action: async () => {
      await sendSlackAlert({
        channel: '#support',
        message: '📞 Support request spike detected. Something may be broken.',
        severity: 'high',
      })
    },
  },
]

// Monitor and trigger alerts
export async function checkAlerts() {
  for (const condition of ALERT_CONDITIONS) {
    const currentValue = await getMetricValue(condition.metric, condition.window)
    
    const shouldAlert = 
      (condition.comparison === 'above' && currentValue > condition.threshold) ||
      (condition.comparison === 'below' && currentValue < condition.threshold)
    
    if (shouldAlert) {
      await condition.action()
      
      // Log alert
      await db.alert.create({
        data: {
          type: condition.metric,
          threshold: condition.threshold,
          currentValue,
          triggeredAt: new Date(),
        },
      })
    }
  }
}

// Run every 5 minutes
setInterval(checkAlerts, 5 * 60 * 1000)
```

---

## 4. Production Checklist

### 4.1 Pre-Launch Checklist

```markdown
## Authentication System - Production Readiness

### Security ✅
- [ ] HTTPS enforced on all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting implemented and tested
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] CSRF tokens implemented
- [ ] Password hashing uses bcrypt with cost 10+
- [ ] Magic link tokens are cryptographically secure
- [ ] Session cookies are httpOnly, secure, sameSite
- [ ] No sensitive data in logs

### Email Deliverability ✅
- [ ] SPF record configured
- [ ] DKIM signing enabled
- [ ] DMARC policy set
- [ ] Domain warmup completed (if new domain)
- [ ] ESP sending limits understood
- [ ] Bounce/complaint handling implemented
- [ ] Email templates tested in 5+ clients
- [ ] Unsubscribe mechanism working
- [ ] Spam score <5 (Mail Tester)

### Functionality ✅
- [ ] Magic link flow works end-to-end
- [ ] Password fallback works
- [ ] Token expiration enforced (15min magic link)
- [ ] Session expiration enforced (30 days)
- [ ] Failed login lockout works (5 attempts = 15min lock)
- [ ] Rate limiting works (3 magic links/hour)
- [ ] Concurrent sessions limited (max 5)
- [ ] Support widget loads and works

### User Experience ✅
- [ ] Login page loads <2s
- [ ] Magic link email arrives <30s
- [ ] Clear error messages for all failure states
- [ ] Mobile responsive (tested iOS + Android)
- [ ] Keyboard navigation works
- [ ] Screen reader accessible
- [ ] Works in 3+ browsers (Chrome, Safari, Firefox)
- [ ] No console errors
- [ ] Loading states clear
- [ ] Success states clear

### Monitoring ✅
- [ ] Error tracking configured (Sentry)
- [ ] Analytics tracking configured
- [ ] Auth funnel dashboard created
- [ ] Alerts configured for critical metrics
- [ ] Logs centralized (Datadog/CloudWatch)
- [ ] Performance monitoring (Core Web Vitals)

### Documentation ✅
- [ ] API documentation complete
- [ ] Support team trained
- [ ] Runbook for common issues
- [ ] Incident response plan documented

### Legal ✅
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] GDPR compliance verified (if EU users)
- [ ] Cookie consent implemented
- [ ] Data retention policy defined
```

---

### 4.2 Launch Day Checklist

```markdown
## Day of Launch

### Pre-Launch (T-2 hours)
- [ ] All tests passing
- [ ] Database backups verified
- [ ] Rollback plan documented
- [ ] Team on standby
- [ ] Monitoring dashboards open

### Launch (T-0)
- [ ] Deploy to production
- [ ] Verify health checks pass
- [ ] Test login flow in production
- [ ] Monitor error rates (5 min)
- [ ] Monitor email delivery (5 min)

### Post-Launch (T+2 hours)
- [ ] Check conversion funnel
- [ ] Review error logs
- [ ] Check support tickets
- [ ] Monitor server load
- [ ] Verify email queue healthy

### End of Day
- [ ] Review full day metrics
- [ ] Document any issues
- [ ] Plan fixes if needed
- [ ] Team debrief
```

---

### 4.3 Monitoring Dashboard Setup

```typescript
// Key metrics to display on dashboard

export const LOGIN_DASHBOARD_METRICS = {
  // Real-time
  realtime: {
    'Active Sessions': 'count(sessions) WHERE active = true',
    'Current Error Rate': 'errors / requests * 100 (last 5min)',
    'Email Queue Size': 'count(email_queue) WHERE status = pending',
  },
  
  // Today
  today: {
    'Total Logins': 'count(auth_events) WHERE type = login_success',
    'Magic Link Success Rate': 'magic_link_success / magic_link_sent * 100',
    'Avg Login Time': 'avg(time_to_login) in seconds',
    'Support Requests': 'count(support_tickets)',
  },
  
  // Week
  week: {
    'New Users': 'count(users) WHERE created > 7 days ago',
    'Login Conversion': 'logins / page_views * 100',
    'Password Adoption': 'users_with_password / total_users * 100',
    'Email Deliverability': 'delivered / sent * 100',
  },
  
  // Alerts
  alerts: [
    { condition: 'error_rate > 5%', severity: 'high' },
    { condition: 'email_delivery < 95%', severity: 'critical' },
    { condition: 'support_requests > 100/day', severity: 'medium' },
  ],
}
```

---

### 4.4 Common Issues Runbook

```markdown
## Issue: Magic Links Not Being Received

### Diagnosis Steps
1. Check email queue: Are emails stuck?
2. Check ESP status: Is SendGrid/Resend operational?
3. Check spam rate: Are we being flagged?
4. Check user's email provider: Known issues?

### Resolution
- If queue stuck: Restart email worker
- If ESP down: Wait for resolution or switch ESP
- If spam flagged: Review email content, check SPF/DKIM
- If provider issue: Suggest password fallback or alternative email

### Prevention
- Monitor email delivery rate (>95%)
- Have backup ESP configured
- Maintain good sender reputation

---

## Issue: High Login Error Rate

### Diagnosis Steps
1. Check error logs: What's failing?
2. Check rate limiting: Are legitimate users blocked?
3. Check database: Query performance OK?
4. Check session validation: Logic error?

### Resolution
- If specific error: Fix the bug
- If rate limiting: Adjust limits temporarily
- If DB slow: Optimize queries or scale up
- If validation bug: Deploy hotfix

### Prevention
- Comprehensive error handling
- Load testing before launch
- Gradual rollout of changes

---

## Issue: Account Lockout Spike

### Diagnosis Steps
1. Check failed login attempts: Brute force attack?
2. Check IPs: Same IP attacking multiple accounts?
3. Check user reports: Legitimate users locked out?

### Resolution
- If attack: Block IPs, enable CAPTCHA
- If legitimate: Reset lockouts, adjust threshold
- Communication: Email affected users

### Prevention
- CAPTCHA after 3 failed attempts
- IP-based rate limiting
- Monitor for attack patterns
```

---

## Summary

### Key Takeaways

1. **Magic Link Primary**: Passwordless first, password as opt-in fallback
2. **Support Integration**: Context-aware Crisp widget on every step
3. **Edge Cases**: Handle email provider issues, token reuse, disposable emails
4. **Monitoring**: Track funnel, set alerts, have dashboard ready
5. **Production Ready**: Complete checklist before launch

### Files Created

- `login-guide-part1-strategy.md` - Strategy & Architecture
- `login-guide-part2-ui-ux.md` - UI/UX Design
- `login-guide-part3-backend.md` - Backend Implementation
- `login-guide-part4-support.md` - Support & Edge Cases (this file)

### Next Actions

1. Review all 4 parts with team
2. Implement based on priority (P0 → P1 → P2)
3. Test thoroughly in staging
4. Launch with monitoring dashboard open
5. Iterate based on real user feedback

---

**End of Guide**  
Version: 1.0  
Complete: 4/4 Parts  
Total Pages: ~50  
Total Words: ~15,000
