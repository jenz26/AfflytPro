# Afflyt Pro - Login System Guide (Part 3/4)
## Backend Implementation

**Version**: 1.0  
**Last Updated**: November 27, 2025

---

## 📋 Part 3 Contents

1. API Endpoints
2. Database Schemas
3. Email System
4. Business Logic
5. Testing

---

## 1. API Endpoints

### 1.1 Magic Link Request

```typescript
// POST /api/auth/magic-link
// Purpose: Request a magic link for login or signup

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { sendMagicLinkEmail } from '@/lib/email'
import { generateMagicLinkToken } from '@/lib/auth'

const requestSchema = z.object({
  email: z.string().email('Invalid email format'),
  type: z.enum(['login', 'signup']),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate body
    const body = await req.json()
    const { email, type } = requestSchema.parse(body)
    
    const normalizedEmail = email.toLowerCase().trim()
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    
    // 2. Rate limiting
    const emailLimitOk = await rateLimit.check('magic-link:email', normalizedEmail, 3, 3600)
    if (!emailLimitOk) {
      return NextResponse.json(
        { error: 'rate_limit_exceeded', message: 'Too many requests. Try again in 1 hour.' },
        { status: 429 }
      )
    }
    
    const ipLimitOk = await rateLimit.check('magic-link:ip', ip, 10, 3600)
    if (!ipLimitOk) {
      return NextResponse.json(
        { error: 'rate_limit_exceeded', message: 'Too many requests from this IP.' },
        { status: 429 }
      )
    }
    
    // 3. Check user existence based on type
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })
    
    if (type === 'login' && !user) {
      return NextResponse.json(
        { error: 'user_not_found', message: 'No account found with this email.' },
        { status: 404 }
      )
    }
    
    if (type === 'signup' && user) {
      return NextResponse.json(
        { error: 'user_exists', message: 'Account already exists. Please login.' },
        { status: 409 }
      )
    }
    
    // 4. Check account status (if login)
    if (type === 'login' && user) {
      if (user.status === 'suspended') {
        return NextResponse.json(
          { error: 'account_suspended', message: 'Account suspended. Contact support.' },
          { status: 403 }
        )
      }
    }
    
    // 5. Generate token
    const token = generateMagicLinkToken()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    
    // 6. Store token
    await db.magicLinkToken.create({
      data: {
        token,
        userId: user?.id || null,
        email: normalizedEmail,
        type,
        expiresAt,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })
    
    // 7. Send email
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}&type=${type}`
    
    await sendMagicLinkEmail({
      to: normalizedEmail,
      name: user?.name || null,
      magicLink,
      type,
      expiryMinutes: 15,
    })
    
    // 8. Log event
    await logAuthEvent({
      type: 'magic_link_sent',
      email: normalizedEmail,
      userId: user?.id,
      ip,
    })
    
    // 9. Return success
    return NextResponse.json({
      success: true,
      message: `Magic link sent to ${normalizedEmail}`,
      expiresIn: 900, // seconds
    })
    
  } catch (error) {
    console.error('Magic link error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'validation_error', message: error.errors[0].message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'internal_error', message: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
```

---

### 1.2 Magic Link Verification

```typescript
// GET /auth/verify
// Purpose: Verify magic link token and create session

import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const type = searchParams.get('type') as 'login' | 'signup' | null
    
    // 1. Validate parameters
    if (!token || !type) {
      return redirectWithError('/login', 'invalid_link')
    }
    
    // 2. Find token in database
    const tokenRecord = await db.magicLinkToken.findUnique({
      where: { token },
      include: { user: true },
    })
    
    if (!tokenRecord) {
      return redirectWithError('/login', 'token_invalid')
    }
    
    // 3. Check if already used
    if (tokenRecord.used) {
      return redirectWithError('/login', 'token_already_used')
    }
    
    // 4. Check if expired
    if (tokenRecord.expiresAt < new Date()) {
      return redirectWithError('/login', 'token_expired')
    }
    
    // 5. Check type matches
    if (tokenRecord.type !== type) {
      return redirectWithError('/login', 'token_invalid')
    }
    
    // 6. Mark token as used
    await db.magicLinkToken.update({
      where: { token },
      data: {
        used: true,
        usedAt: new Date(),
      },
    })
    
    // 7. Handle based on type
    let user = tokenRecord.user
    
    if (type === 'signup' && !user) {
      // Create new user
      user = await db.user.create({
        data: {
          email: tokenRecord.email,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          tier: 'free',
          status: 'active',
        },
      })
      
      // Log signup
      await logAuthEvent({
        type: 'user_signed_up',
        email: user.email,
        userId: user.id,
      })
      
      // Send welcome email (async, don't await)
      sendWelcomeEmail(user).catch(console.error)
    }
    
    if (type === 'login' && user) {
      // Update last login
      await db.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
        },
      })
      
      // Log login
      await logAuthEvent({
        type: 'user_logged_in',
        email: user.email,
        userId: user.id,
      })
    }
    
    // 8. Create session
    const session = createSession(user!)
    
    // 9. Set cookie and redirect
    const response = NextResponse.redirect(new URL('/dashboard', req.url))
    response.cookies.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })
    
    return response
    
  } catch (error) {
    console.error('Verify error:', error)
    return redirectWithError('/login', 'internal_error')
  }
}

// Helper function
function redirectWithError(path: string, error: string) {
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_URL)
  url.searchParams.set('error', error)
  return NextResponse.redirect(url)
}
```

---

### 1.3 Password Login

```typescript
// POST /api/auth/login
// Purpose: Login with email + password

import bcrypt from 'bcrypt'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)
    
    const normalizedEmail = email.toLowerCase().trim()
    const ip = req.ip || 'unknown'
    
    // 1. Check rate limit
    const limitOk = await rateLimit.check('password-login:email', normalizedEmail, 5, 900)
    if (!limitOk) {
      return NextResponse.json(
        { error: 'rate_limit_exceeded', message: 'Too many failed attempts. Try again in 15 minutes.' },
        { status: 429 }
      )
    }
    
    // 2. Check for account lockout
    await checkLoginAttempts(normalizedEmail)
    
    // 3. Find user
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })
    
    if (!user) {
      await recordFailedLogin(normalizedEmail, 'user_not_found')
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Invalid email or password.' },
        { status: 401 }
      )
    }
    
    // 4. Check if password is set
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'password_not_set', message: 'Password not set. Use magic link to login.' },
        { status: 400 }
      )
    }
    
    // 5. Verify password
    const valid = await bcrypt.compare(password, user.passwordHash)
    
    if (!valid) {
      await recordFailedLogin(normalizedEmail, 'invalid_password')
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Invalid email or password.' },
        { status: 401 }
      )
    }
    
    // 6. Check account status
    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'account_suspended', message: 'Account suspended. Contact support.' },
        { status: 403 }
      )
    }
    
    // 7. Clear failed attempts
    await clearFailedAttempts(normalizedEmail)
    
    // 8. Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
    
    // 9. Log successful login
    await logAuthEvent({
      type: 'password_login_success',
      email: user.email,
      userId: user.id,
      ip,
    })
    
    // 10. Create session
    const session = createSession(user)
    
    // 11. Return success with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
    })
    
    response.cookies.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })
    
    return response
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: 'An error occurred.' },
      { status: 500 }
    )
  }
}
```

---

### 1.4 Set Password (Opt-In)

```typescript
// POST /api/user/set-password
// Purpose: Enable password authentication (opt-in)

const setPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await authenticateRequest(req)
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Not authenticated.' },
        { status: 401 }
      )
    }
    
    // 2. Parse and validate
    const body = await req.json()
    const { password } = setPasswordSchema.parse(body)
    
    // 3. Check if password already set
    if (user.passwordHash) {
      return NextResponse.json(
        { error: 'password_exists', message: 'Password already set. Use change password instead.' },
        { status: 400 }
      )
    }
    
    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 10)
    
    // 5. Update user
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordSetAt: new Date(),
      },
    })
    
    // 6. Log event
    await logAuthEvent({
      type: 'password_set',
      email: user.email,
      userId: user.id,
    })
    
    // 7. Send notification email
    await sendPasswordSetEmail(user).catch(console.error)
    
    // 8. Return success
    return NextResponse.json({
      success: true,
      message: 'Password set successfully.',
    })
    
  } catch (error) {
    console.error('Set password error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'validation_error', message: error.errors[0].message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'internal_error', message: 'An error occurred.' },
      { status: 500 }
    )
  }
}
```

---

### 1.5 Logout

```typescript
// POST /api/auth/logout
// Purpose: Invalidate session

export async function POST(req: NextRequest) {
  try {
    // 1. Get current user
    const user = await authenticateRequest(req)
    
    if (user) {
      // 2. Log event
      await logAuthEvent({
        type: 'user_logged_out',
        email: user.email,
        userId: user.id,
      })
    }
    
    // 3. Clear cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete('session')
    
    return response
    
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 }
    )
  }
}
```

---

## 2. Database Schemas

### 2.1 Users Table

```prisma
// schema.prisma

model User {
  id String @id @default(cuid())
  
  // Authentication
  email String @unique
  emailVerified Boolean @default(false)
  emailVerifiedAt DateTime?
  passwordHash String? // null = password not set
  passwordSetAt DateTime?
  
  // Profile
  name String?
  avatar String?
  
  // Subscription
  tier Tier @default(FREE)
  stripeCustomerId String? @unique
  stripeSubscriptionId String?
  
  // Status
  status UserStatus @default(ACTIVE)
  suspendedAt DateTime?
  suspendedReason String?
  
  // Metadata
  lastLoginAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  magicLinkTokens MagicLinkToken[]
  failedLoginAttempts FailedLoginAttempt?
  sessions Session[]
  authEvents AuthEvent[]
  
  @@index([email])
  @@index([status])
}

enum Tier {
  FREE
  PRO
  ENTERPRISE
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}
```

---

### 2.2 Magic Link Tokens Table

```prisma
model MagicLinkToken {
  id String @id @default(cuid())
  
  // Token
  token String @unique
  type TokenType
  
  // User
  userId String?
  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)
  email String
  
  // Status
  used Boolean @default(false)
  usedAt DateTime?
  
  // Security
  expiresAt DateTime
  ipAddress String
  userAgent String
  
  // Timestamps
  createdAt DateTime @default(now())
  
  @@index([token])
  @@index([email, type])
  @@index([expiresAt])
}

enum TokenType {
  LOGIN
  SIGNUP
}
```

---

### 2.3 Failed Login Attempts Table

```prisma
model FailedLoginAttempt {
  id String @id @default(cuid())
  
  // User
  email String @unique
  userId String? @unique
  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Attempts
  attempts Int @default(0)
  lastAttempt DateTime
  lastFailureReason String?
  
  // Lockout
  lockedUntil DateTime?
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([email])
  @@index([lockedUntil])
}
```

---

### 2.4 Sessions Table (Optional - for tracking)

```prisma
model Session {
  id String @id @default(cuid())
  
  // User
  userId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Session
  token String @unique // JWT token hash
  expiresAt DateTime
  
  // Device info
  ipAddress String
  userAgent String
  device String? // "Desktop", "Mobile", "Tablet"
  browser String? // "Chrome", "Safari", etc.
  os String? // "Windows", "macOS", "iOS", etc.
  
  // Activity
  lastActivityAt DateTime
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}
```

---

### 2.5 Auth Events Table (Audit Log)

```prisma
model AuthEvent {
  id String @id @default(cuid())
  
  // Event
  type AuthEventType
  
  // User
  userId String?
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
  email String?
  
  // Context
  ipAddress String?
  userAgent String?
  metadata Json? // Additional context
  
  // Timestamp
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([email])
  @@index([type])
  @@index([createdAt])
}

enum AuthEventType {
  MAGIC_LINK_SENT
  MAGIC_LINK_CLICKED
  USER_SIGNED_UP
  USER_LOGGED_IN
  PASSWORD_LOGIN_SUCCESS
  PASSWORD_LOGIN_FAILED
  PASSWORD_SET
  PASSWORD_CHANGED
  PASSWORD_RESET_REQUESTED
  USER_LOGGED_OUT
  ACCOUNT_LOCKED
  SESSION_EXPIRED
}
```

---

## 3. Email System

### 3.1 Magic Link Email (Login)

```typescript
// lib/email/magic-link.tsx

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Link,
} from '@react-email/components'

interface Props {
  name?: string
  magicLink: string
  expiryMinutes: number
}

export default function MagicLinkEmail({ name, magicLink, expiryMinutes }: Props) {
  const greeting = name ? `Ciao ${name},` : 'Ciao,'
  
  return (
    <Html lang="it">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <img
              src="https://afflyt.io/logo-horizontal-white.png"
              width="120"
              height="40"
              alt="Afflyt"
            />
          </Section>
          
          {/* Content */}
          <Section style={styles.content}>
            <Heading style={styles.heading}>
              {greeting}
            </Heading>
            
            <Text style={styles.text}>
              Accedi al tuo account Afflyt cliccando il pulsante qui sotto:
            </Text>
            
            <Button href={magicLink} style={styles.button}>
              Accedi ad Afflyt
            </Button>
            
            <Text style={styles.meta}>
              Questo link è valido per <strong>{expiryMinutes} minuti</strong> e può essere usato una sola volta.
            </Text>
            
            <Text style={styles.footer}>
              Se non hai richiesto questo accesso, ignora questa email.
            </Text>
          </Section>
          
          {/* Footer */}
          <Section style={styles.footerSection}>
            <Text style={styles.copyright}>
              © 2025 Afflyt ·{' '}
              <Link href="https://afflyt.io/privacy" style={styles.link}>
                Privacy
              </Link>{' '}
              ·{' '}
              <Link href="https://afflyt.io/help" style={styles.link}>
                Help
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    backgroundColor: '#F3F4F6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
  heading: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '24px',
  },
  text: {
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
}
```

---

## 4. Business Logic

### 4.1 Failed Login Tracking

```typescript
// lib/auth/failed-logins.ts

export async function checkLoginAttempts(email: string): Promise<void> {
  const attempts = await db.failedLoginAttempt.findUnique({
    where: { email },
  })
  
  if (!attempts) return
  
  // Check if locked
  if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (attempts.lockedUntil.getTime() - Date.now()) / 60000
    )
    throw new AuthError(
      'account_locked',
      `Account locked. Try again in ${minutesLeft} minutes.`
    )
  }
  
  // Check attempt count
  if (attempts.attempts >= 5) {
    // Lock for 15 minutes
    const lockUntil = new Date(Date.now() + 15 * 60 * 1000)
    
    await db.failedLoginAttempt.update({
      where: { email },
      data: { lockedUntil: lockUntil },
    })
    
    throw new AuthError('account_locked', 'Too many failed attempts. Account locked for 15 minutes.')
  }
}

export async function recordFailedLogin(
  email: string,
  reason: string
): Promise<void> {
  await db.failedLoginAttempt.upsert({
    where: { email },
    create: {
      email,
      attempts: 1,
      lastAttempt: new Date(),
      lastFailureReason: reason,
    },
    update: {
      attempts: { increment: 1 },
      lastAttempt: new Date(),
      lastFailureReason: reason,
    },
  })
}

export async function clearFailedAttempts(email: string): Promise<void> {
  await db.failedLoginAttempt.delete({
    where: { email },
  }).catch(() => {
    // Ignore if doesn't exist
  })
}
```

---

## 5. Testing

### 5.1 Integration Tests

```typescript
// __tests__/auth/magic-link.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { POST as sendMagicLink } from '@/app/api/auth/magic-link/route'
import { GET as verifyMagicLink } from '@/app/auth/verify/route'

describe('Magic Link Authentication', () => {
  beforeEach(async () => {
    // Clear database
    await db.user.deleteMany()
    await db.magicLinkToken.deleteMany()
  })
  
  it('should send magic link for existing user', async () => {
    // Create user
    const user = await db.user.create({
      data: {
        email: 'test@example.com',
        emailVerified: true,
      },
    })
    
    // Send magic link
    const response = await sendMagicLink(
      new Request('http://localhost/api/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          type: 'login',
        }),
      })
    )
    
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    
    // Verify token was created
    const token = await db.magicLinkToken.findFirst({
      where: { email: 'test@example.com' },
    })
    expect(token).toBeDefined()
    expect(token!.type).toBe('LOGIN')
  })
  
  it('should return error for non-existent user on login', async () => {
    const response = await sendMagicLink(
      new Request('http://localhost/api/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          type: 'login',
        }),
      })
    )
    
    expect(response.status).toBe(404)
    
    const data = await response.json()
    expect(data.error).toBe('user_not_found')
  })
  
  it('should create user and login on signup verification', async () => {
    // Send signup magic link
    const sendResponse = await sendMagicLink(
      new Request('http://localhost/api/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          type: 'signup',
        }),
      })
    )
    
    expect(sendResponse.status).toBe(200)
    
    // Get token
    const token = await db.magicLinkToken.findFirst({
      where: { email: 'newuser@example.com' },
    })
    
    // Verify token
    const verifyResponse = await verifyMagicLink(
      new Request(`http://localhost/auth/verify?token=${token!.token}&type=signup`)
    )
    
    expect(verifyResponse.status).toBe(302) // Redirect
    
    // Check user was created
    const user = await db.user.findUnique({
      where: { email: 'newuser@example.com' },
    })
    
    expect(user).toBeDefined()
    expect(user!.emailVerified).toBe(true)
  })
  
  it('should rate limit magic link requests', async () => {
    const email = 'ratelimit@example.com'
    
    // Create user
    await db.user.create({
      data: { email, emailVerified: true },
    })
    
    // Send 3 magic links (within limit)
    for (let i = 0; i < 3; i++) {
      const response = await sendMagicLink(
        new Request('http://localhost/api/auth/magic-link', {
          method: 'POST',
          body: JSON.stringify({ email, type: 'login' }),
        })
      )
      expect(response.status).toBe(200)
    }
    
    // 4th attempt should be rate limited
    const response = await sendMagicLink(
      new Request('http://localhost/api/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email, type: 'login' }),
      })
    )
    
    expect(response.status).toBe(429)
    
    const data = await response.json()
    expect(data.error).toBe('rate_limit_exceeded')
  })
})
```

---

## Next Steps

Continue to **Part 4: Support & Edge Cases** for:
- Support widget integration
- Edge case handling
- Monitoring & alerting
- Production checklist

---

**End of Part 3**
