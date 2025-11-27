# Afflyt Pro - Login System Guide (Part 1/4)
## Strategy & Architecture

**Version**: 1.0  
**Last Updated**: November 27, 2025

---

## 📋 Part 1 Contents

1. Authentication Strategy Overview
2. User Flow Diagrams
3. Technical Architecture
4. Security Model

---

## 1. Authentication Strategy Overview

### 1.1 Hybrid Approach: Passwordless-First

**Primary Method**: Magic Link (90% users)
**Fallback Method**: Password (10% users, opt-in)
**Enterprise Method**: SSO (future, PRO/Enterprise tiers)

---

### 1.2 Why Passwordless Primary?

#### **User Experience Benefits**
```
Magic Link Flow:
1. Enter email → 2. Check email → 3. Click link → 4. Auto-login
Total: 3 steps, ~30 seconds

Password Flow:
1. Enter email → 2. Enter password → 3. Forgot? → 4. Reset email → 
5. Click link → 6. New password → 7. Login again
Total: 7 steps, 2-3 minutes
```

**Result**: 
- 57% fewer steps
- Zero cognitive load (nothing to remember)
- 4x faster first login

---

#### **Security Benefits**
```
Password Problems:
❌ Weak passwords ("password123")
❌ Password reuse (leaked from other sites)
❌ Phishing attacks (fake login pages)
❌ Brute force attacks
❌ Credential stuffing

Magic Link Advantages:
✅ Unique token per login (one-time use)
✅ Short expiration (15 minutes)
✅ Email = built-in 2FA
✅ No password database to breach
✅ Phishing harder (token not reusable)
```

**Industry Data**: 81% of breaches involve weak/stolen passwords (Verizon 2024)

---

#### **Business Benefits**
```
Support Cost Reduction:
- Password reset tickets: -100% (€24k/year saved)
- "Can't login" tickets: -60%
- Account recovery: -80%

Conversion Improvement:
- Signup completion: +25% (no password complexity rules)
- Mobile signup: +40% (no keyboard switching)
- Time to first value: -50% (faster activation)

Brand Alignment:
- "Intelligence-Driven" → Smart auth (no passwords)
- Modern SaaS → Cutting-edge UX
- Security-first → No weak password problem
```

---

### 1.3 When to Use Password Fallback

**Automatic Triggers**:
- Magic link delivery fails 3+ times
- User's email provider blocks links
- Corporate email policy restrictions

**User-Requested**:
- "I prefer password" link on login page
- Power users who login 5+ times/day
- Setting enabled in user preferences

**Not Promoted**: Password option is available but hidden (small link, not a tab)

---

## 2. User Flow Diagrams

### 2.1 New User Journey (First Time)

```
┌─────────────────────────────────────────────────────────┐
│ LANDING PAGE (afflyt.io)                                │
├─────────────────────────────────────────────────────────┤
│ • Hero section                                          │
│ • Value proposition                                     │
│ • Features overview                                     │
│                                                         │
│ [CTA: "Inizia Gratis"] ← No credit card required      │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ SIGNUP PAGE (/register)                                 │
├─────────────────────────────────────────────────────────┤
│ Inizia con Afflyt                                       │
│ Crea il tuo account in 30 secondi                      │
│                                                         │
│ Email: [____________________]                           │
│                                                         │
│ [✓] Accetto Termini e Privacy                          │
│                                                         │
│ [Crea Account Gratuito] ← Magic Link sent             │
│                                                         │
│ Hai già un account? Accedi →                           │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ EMAIL VERIFICATION SENT                                 │
├─────────────────────────────────────────────────────────┤
│ ✉️ Controlla la tua email                              │
│                                                         │
│ Abbiamo inviato un link di verifica a:                 │
│ marco@example.com                                       │
│                                                         │
│ Il link scade tra 24 ore                               │
│                                                         │
│ [Non hai ricevuto l'email? Invia di nuovo]            │
│                                                         │
│ 💡 Controlla anche la cartella spam                    │
│                                                         │
│ Problemi? [Contatta il supporto]                       │
└─────────────────────────────────────────────────────────┘
                    ↓
        User checks email
                    ↓
┌─────────────────────────────────────────────────────────┐
│ EMAIL INBOX                                             │
├─────────────────────────────────────────────────────────┤
│ From: Afflyt <noreply@afflyt.io>                       │
│ Subject: Benvenuto su Afflyt                           │
│                                                         │
│ Ciao Marco,                                             │
│                                                         │
│ Benvenuto su Afflyt. Per attivare il tuo account,     │
│ verifica la tua email:                                  │
│                                                         │
│ [Verifica Email] ← Click here                          │
│                                                         │
│ Il link è valido per 24 ore.                           │
└─────────────────────────────────────────────────────────┘
                    ↓
        Click "Verifica Email"
                    ↓
┌─────────────────────────────────────────────────────────┐
│ EMAIL VERIFIED → AUTO LOGIN                             │
├─────────────────────────────────────────────────────────┤
│ ✅ Email verificata con successo!                       │
│                                                         │
│ Reindirizzamento alla dashboard...                     │
└─────────────────────────────────────────────────────────┘
                    ↓ (2 seconds)
┌─────────────────────────────────────────────────────────┐
│ ONBOARDING FLOW (First-Time Setup)                     │
├─────────────────────────────────────────────────────────┤
│ Step 1: Connetti Telegram                              │
│ Step 2: Setup API Keys (optional)                      │
│ Step 3: Crea prima automazione                         │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ DASHBOARD (Main App)                                    │
└─────────────────────────────────────────────────────────┘
```

**Key Points**:
- Email is the only required field (no password)
- Verification link doubles as first login
- No separate "create password" step
- Session lasts 30 days ("Remember me" default)

---

### 2.2 Returning User Journey (Magic Link)

```
┌─────────────────────────────────────────────────────────┐
│ LOGIN PAGE (/login)                                     │
├─────────────────────────────────────────────────────────┤
│ [Logo]                                                  │
│                                                         │
│ Bentornato                                              │
│ Accedi al tuo account Afflyt                           │
│                                                         │
│ Email: [marco@example.com]                             │
│                                                         │
│ [Invia Magic Link] ← Primary CTA                       │
│                                                         │
│ Ti invieremo un link sicuro per accedere               │
│ senza password                                          │
│                                                         │
│ ────────── oppure ──────────                           │
│                                                         │
│ <small>Preferisci usare la password?</small>          │ ← Hidden link
│                                                         │
│ Problemi di accesso? [Contatta supporto]              │
└─────────────────────────────────────────────────────────┘
                    ↓
        Click "Invia Magic Link"
                    ↓
┌─────────────────────────────────────────────────────────┐
│ MAGIC LINK SENT                                         │
├─────────────────────────────────────────────────────────┤
│ ✉️ Controlla la tua email                              │
│                                                         │
│ Abbiamo inviato un link di accesso a:                  │
│ marco@example.com                                       │
│                                                         │
│ Il link scade tra 15 minuti                            │
│                                                         │
│ [Non hai ricevuto l'email? Invia di nuovo]            │
│                                                         │
│ 💡 Controlla anche la cartella spam                    │
│                                                         │
│ Problemi? [Contatta il supporto]                       │
└─────────────────────────────────────────────────────────┘
                    ↓ (5-30 seconds)
        User checks email
                    ↓
┌─────────────────────────────────────────────────────────┐
│ EMAIL INBOX                                             │
├─────────────────────────────────────────────────────────┤
│ From: Afflyt <noreply@afflyt.io>                       │
│ Subject: Accedi ad Afflyt                              │
│                                                         │
│ Ciao Marco,                                             │
│                                                         │
│ Accedi al tuo account cliccando il pulsante:           │
│                                                         │
│ [Accedi ad Afflyt] ← Click here                        │
│                                                         │
│ Questo link è valido per 15 minuti e può essere       │
│ usato una sola volta.                                   │
│                                                         │
│ Se non hai richiesto questo accesso, ignora            │
│ questa email.                                           │
└─────────────────────────────────────────────────────────┘
                    ↓
        Click "Accedi ad Afflyt"
                    ↓
┌─────────────────────────────────────────────────────────┐
│ AUTO LOGIN + REDIRECT                                   │
├─────────────────────────────────────────────────────────┤
│ ✅ Accesso effettuato con successo!                     │
│                                                         │
│ Reindirizzamento...                                     │
└─────────────────────────────────────────────────────────┘
                    ↓ (immediate)
┌─────────────────────────────────────────────────────────┐
│ DASHBOARD                                               │
└─────────────────────────────────────────────────────────┘
```

**Total Time**: 30-60 seconds from login click to dashboard

---

### 2.3 Password Fallback Journey

```
┌─────────────────────────────────────────────────────────┐
│ LOGIN PAGE (/login)                                     │
├─────────────────────────────────────────────────────────┤
│ Bentornato                                              │
│                                                         │
│ Email: [marco@example.com]                             │
│ [Invia Magic Link]                                      │
│                                                         │
│ <small>Preferisci usare la password?</small>          │ ← User clicks
└─────────────────────────────────────────────────────────┘
                    ↓
        Click "Preferisci usare la password?"
                    ↓
┌─────────────────────────────────────────────────────────┐
│ LOGIN PAGE - PASSWORD MODE                              │
├─────────────────────────────────────────────────────────┤
│ ← Torna al magic link                                   │
│                                                         │
│ Accedi con password                                     │
│                                                         │
│ Email: [marco@example.com]                             │
│                                                         │
│ Password: [••••••••] 👁                                │
│                                                         │
│ [Accedi]                                                │
│                                                         │
│ Password dimenticata?                                   │
│                                                         │
│ Problemi? [Contatta supporto]                          │
└─────────────────────────────────────────────────────────┘
                    ↓
        Submit credentials
                    ↓
┌─────────────────────────────────────────────────────────┐
│ DASHBOARD (immediate)                                   │
└─────────────────────────────────────────────────────────┘
```

---

### 2.4 First-Time Password Setup (Opt-In)

**Scenario**: User wants to enable password for their account

```
┌─────────────────────────────────────────────────────────┐
│ SETTINGS > SECURITY                                     │
├─────────────────────────────────────────────────────────┤
│ Authentication Method                                   │
│                                                         │
│ ◉ Magic Link (Consigliato) ← Current                  │
│   Accesso passwordless via email                       │
│                                                         │
│ ○ Password                                              │
│   Accesso tradizionale con password                    │
│   Utile per login frequenti                            │
│                                                         │
│ [Cambia Metodo]                                         │
└─────────────────────────────────────────────────────────┘
                    ↓
        User selects "Password" and clicks "Cambia Metodo"
                    ↓
┌─────────────────────────────────────────────────────────┐
│ CREATE PASSWORD                                         │
├─────────────────────────────────────────────────────────┤
│ Imposta una password                                    │
│                                                         │
│ Nuova password:                                         │
│ [____________________]                                  │
│                                                         │
│ Password requirements:                                  │
│ ✓ Minimo 8 caratteri                                   │
│ ✗ Almeno una maiuscola                                 │
│ ✗ Almeno un numero                                     │
│                                                         │
│ Conferma password:                                      │
│ [____________________]                                  │
│                                                         │
│ [Salva Password]                                        │
│                                                         │
│ Potrai sempre tornare al magic link                    │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ ✅ Password impostata con successo!                     │
│                                                         │
│ Ora puoi accedere con password o magic link           │
└─────────────────────────────────────────────────────────┘
```

**Note**: Password is opt-in only. Users must explicitly enable it. Magic Link remains available even after password is set.

---

## 3. Technical Architecture

### 3.1 Authentication Flow (Magic Link)

```typescript
/**
 * Magic Link Authentication Flow
 * Timeline: Request → Send → Verify → Login
 */

// Step 1: User requests magic link
POST /api/auth/magic-link
{
  "email": "marco@example.com",
  "type": "login" | "signup"
}

// Backend processes:
1. Validate email format
2. Check if user exists (login) or doesn't exist (signup)
3. Generate unique token (JWT or random string)
4. Store token in database with expiration
5. Send email with magic link
6. Return success response

Response:
{
  "success": true,
  "message": "Magic link sent to marco@example.com",
  "expiresIn": 900 // 15 minutes in seconds
}

// Step 2: User clicks link in email
GET /auth/verify?token=abc123xyz&type=login

// Backend processes:
1. Extract token from URL
2. Verify token exists in database
3. Check token not expired
4. Check token not already used
5. Mark token as used
6. Create user session (JWT)
7. Set httpOnly cookie
8. Redirect to dashboard

Redirect: /dashboard
Set-Cookie: session=eyJhbGc... (httpOnly, secure, sameSite)

// Step 3: All subsequent requests include session cookie
GET /api/dashboard/stats
Cookie: session=eyJhbGc...

// Backend validates session on every request
```

---

### 3.2 Token Storage Schema

```typescript
// Database: magic_link_tokens table
interface MagicLinkToken {
  id: string                    // Primary key
  token: string                 // Unique token (indexed)
  userId: string | null         // User ID (null for signup)
  email: string                 // Email address
  type: 'login' | 'signup'      // Token type
  used: boolean                 // Has been used?
  usedAt: Date | null           // When used
  expiresAt: Date               // Expiration timestamp
  createdAt: Date               // Creation timestamp
  ipAddress: string             // Request IP (security)
  userAgent: string             // Request user agent
}

// Example row
{
  id: "tok_abc123",
  token: "mlt_xyz789abc456def",
  userId: "usr_marco123",
  email: "marco@example.com",
  type: "login",
  used: false,
  usedAt: null,
  expiresAt: "2025-11-27T15:30:00Z", // 15 min from now
  createdAt: "2025-11-27T15:15:00Z",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0..."
}

// Indexes for performance
CREATE INDEX idx_token ON magic_link_tokens(token);
CREATE INDEX idx_email_type ON magic_link_tokens(email, type);
CREATE INDEX idx_expires ON magic_link_tokens(expiresAt);

// Cleanup old tokens (cron job, daily)
DELETE FROM magic_link_tokens 
WHERE expiresAt < NOW() - INTERVAL '7 days';
```

---

### 3.3 Session Management

```typescript
/**
 * Session Strategy: JWT stored in httpOnly cookie
 */

// Session creation (after successful auth)
interface SessionPayload {
  userId: string
  email: string
  tier: 'free' | 'pro' | 'enterprise'
  createdAt: number
  expiresAt: number
}

// Generate JWT
import jwt from 'jsonwebtoken'

const session = jwt.sign(
  {
    userId: user.id,
    email: user.email,
    tier: user.tier,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
)

// Set cookie
res.cookie('session', session, {
  httpOnly: true,        // Not accessible via JavaScript
  secure: true,          // HTTPS only
  sameSite: 'lax',       // CSRF protection
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
  domain: '.afflyt.io',  // Works on all subdomains
})

// Verify session on protected routes
import { verify } from 'jsonwebtoken'

function authenticateRequest(req, res, next) {
  const token = req.cookies.session
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  
  try {
    const payload = verify(token, process.env.JWT_SECRET)
    req.user = payload // Attach user to request
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid session' })
  }
}

// Refresh session (automatic, every request)
// If session expires in <7 days, issue new token
if (payload.expiresAt - Date.now() < 7 * 24 * 60 * 60 * 1000) {
  const newSession = jwt.sign(
    { ...payload, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  )
  res.cookie('session', newSession, cookieOptions)
}
```

---

### 3.4 Password Authentication (Fallback)

```typescript
/**
 * Password auth is optional, opt-in only
 * User must explicitly enable it in settings
 */

// Check if user has password set
interface User {
  id: string
  email: string
  passwordHash: string | null  // null = no password set
  passwordSetAt: Date | null
}

// Login with password
POST /api/auth/login
{
  "email": "marco@example.com",
  "password": "SecurePassword123"
}

// Backend process
import bcrypt from 'bcrypt'

async function loginWithPassword(email: string, password: string) {
  // 1. Find user
  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    throw new Error('Invalid email or password')
  }
  
  // 2. Check if password is set
  if (!user.passwordHash) {
    throw new Error('Password not set. Use magic link.')
  }
  
  // 3. Verify password
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    // Log failed attempt
    await logFailedLogin(user.id, 'invalid_password')
    throw new Error('Invalid email or password')
  }
  
  // 4. Check account status
  if (user.status === 'suspended') {
    throw new Error('Account suspended')
  }
  
  // 5. Create session
  const session = createSession(user)
  
  // 6. Log successful login
  await logSuccessfulLogin(user.id)
  
  return session
}

// Set password (opt-in)
POST /api/user/set-password
{
  "password": "NewSecurePassword123"
}

// Backend
async function setPassword(userId: string, password: string) {
  // 1. Validate password strength
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  
  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, 10)
  
  // 3. Update user
  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      passwordSetAt: new Date(),
    },
  })
  
  // 4. Notify user via email
  await sendEmail({
    to: user.email,
    subject: 'Password impostata',
    template: 'password-set',
  })
}

// Disable password (revert to magic link only)
POST /api/user/remove-password

async function removePassword(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: null,
      passwordSetAt: null,
    },
  })
}
```

---

## 4. Security Model

### 4.1 Token Security

```typescript
/**
 * Magic Link Token Generation
 * Requirements:
 * - Cryptographically secure random
 * - Unique (no collisions)
 * - Unpredictable
 * - URL-safe
 */

import crypto from 'crypto'

function generateMagicLinkToken(): string {
  // Generate 32 bytes of random data
  const randomBytes = crypto.randomBytes(32)
  
  // Convert to base64url (URL-safe)
  const token = randomBytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  // Prefix for identification
  return `mlt_${token}` // mlt = magic link token
}

// Example output: mlt_abc123XYZ789def456...

// Token validation
function validateToken(token: string): boolean {
  // Check format
  if (!token.startsWith('mlt_')) return false
  
  // Check length (32 bytes base64 = ~43 chars + prefix)
  if (token.length !== 47) return false
  
  // Check only valid characters
  const validChars = /^mlt_[A-Za-z0-9_-]+$/
  return validChars.test(token)
}
```

---

### 4.2 Rate Limiting

```typescript
/**
 * Prevent brute force and abuse
 */

// Rate limits
const RATE_LIMITS = {
  magicLink: {
    perEmail: 3,           // Max 3 requests per email per hour
    perIP: 10,             // Max 10 requests per IP per hour
    global: 1000,          // Max 1000 requests globally per hour
  },
  passwordLogin: {
    perEmail: 5,           // Max 5 attempts per email per 15min
    perIP: 20,             // Max 20 attempts per IP per 15min
  },
}

// Implementation (using Redis)
import Redis from 'ioredis'
const redis = new Redis()

async function checkRateLimit(
  type: 'magicLink' | 'passwordLogin',
  identifier: string, // email or IP
  limit: number,
  window: number // seconds
): Promise<boolean> {
  const key = `ratelimit:${type}:${identifier}`
  const current = await redis.incr(key)
  
  if (current === 1) {
    // First request, set expiration
    await redis.expire(key, window)
  }
  
  if (current > limit) {
    return false // Rate limit exceeded
  }
  
  return true // OK
}

// Usage
async function sendMagicLink(email: string, ip: string) {
  // Check email limit
  const emailOk = await checkRateLimit('magicLink', email, 3, 3600)
  if (!emailOk) {
    throw new Error('Too many requests. Try again in 1 hour.')
  }
  
  // Check IP limit
  const ipOk = await checkRateLimit('magicLink', ip, 10, 3600)
  if (!ipOk) {
    throw new Error('Too many requests from this IP. Try again later.')
  }
  
  // Proceed with sending
  // ...
}
```

---

### 4.3 Brute Force Protection (Password)

```typescript
/**
 * Progressive delays after failed login attempts
 */

interface FailedLoginAttempt {
  email: string
  attempts: number
  lastAttempt: Date
  lockedUntil: Date | null
}

async function checkLoginAttempts(email: string): Promise<void> {
  const attempts = await db.failedLoginAttempt.findUnique({
    where: { email },
  })
  
  if (!attempts) return // First attempt, OK
  
  // Check if locked
  if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (attempts.lockedUntil.getTime() - Date.now()) / 60000
    )
    throw new Error(`Account locked. Try again in ${minutesLeft} minutes.`)
  }
  
  // Check attempt count
  if (attempts.attempts >= 5) {
    // Lock account for 15 minutes
    await db.failedLoginAttempt.update({
      where: { email },
      data: {
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      },
    })
    throw new Error('Too many failed attempts. Account locked for 15 minutes.')
  }
}

async function recordFailedLogin(email: string): Promise<void> {
  await db.failedLoginAttempt.upsert({
    where: { email },
    create: {
      email,
      attempts: 1,
      lastAttempt: new Date(),
    },
    update: {
      attempts: { increment: 1 },
      lastAttempt: new Date(),
    },
  })
}

async function clearFailedAttempts(email: string): Promise<void> {
  await db.failedLoginAttempt.delete({
    where: { email },
  })
}

// Usage in login flow
try {
  await checkLoginAttempts(email)
  const user = await loginWithPassword(email, password)
  await clearFailedAttempts(email) // Success, clear history
  return user
} catch (error) {
  await recordFailedLogin(email)
  throw error
}
```

---

### 4.4 CSRF Protection

```typescript
/**
 * Cross-Site Request Forgery protection
 * Using SameSite cookies + CSRF tokens for state-changing operations
 */

// Cookie already has SameSite: 'lax'
// Additional CSRF token for critical operations

import crypto from 'crypto'

// Generate CSRF token (stored in session)
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Middleware to inject CSRF token
function injectCsrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken()
  }
  res.locals.csrfToken = req.session.csrfToken
  next()
}

// Validate CSRF token on state-changing requests
function validateCsrfToken(req, res, next) {
  const methods = ['POST', 'PUT', 'DELETE', 'PATCH']
  
  if (!methods.includes(req.method)) {
    return next() // GET, HEAD, OPTIONS don't need CSRF
  }
  
  const tokenFromHeader = req.headers['x-csrf-token']
  const tokenFromBody = req.body.csrfToken
  const tokenFromSession = req.session.csrfToken
  
  const providedToken = tokenFromHeader || tokenFromBody
  
  if (!providedToken || providedToken !== tokenFromSession) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }
  
  next()
}

// Frontend usage
<form>
  <input type="hidden" name="csrfToken" value={csrfToken} />
  {/* ... */}
</form>

// Or in fetch
fetch('/api/user/update', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
})
```

---

## Next Steps

Continue to **Part 2: UI/UX Design** for:
- Complete login page component specifications
- Magic link success/error states
- Password fallback UI
- Support integration widget

---

**End of Part 1**
