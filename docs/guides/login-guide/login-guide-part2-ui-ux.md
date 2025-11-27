# Afflyt Pro - Login System Guide (Part 2/4)
## UI/UX Design Specification

**Version**: 1.0  
**Last Updated**: November 27, 2025

---

## 📋 Part 2 Contents

1. Login Page Design System
2. Component Specifications
3. State Management
4. Responsive Design
5. Accessibility

---

## 1. Login Page Design System

### 1.1 Layout Structure

```
Desktop (1024px+):
┌────────────────────────────────────────────────────────┐
│                                                        │
│  [Logo]                                    [Language] │ ← Header
│                                                        │
│                                                        │
│              ┌──────────────────┐                     │
│              │                  │                     │
│              │   Login Form     │                     │
│              │                  │                     │
│              │   • Centered     │                     │
│              │   • Max 440px    │                     │
│              │   • Glassmorphic │                     │
│              │                  │                     │
│              └──────────────────┘                     │
│                                                        │
│                                                        │
│                    [Support Link]                     │ ← Footer
│                                                        │
└────────────────────────────────────────────────────────┘

Mobile (<768px):
┌────────────────────┐
│ [Logo]      [Lang] │
│                    │
│                    │
│ ┌────────────────┐ │
│ │                │ │
│ │  Login Form    │ │
│ │  Full width    │ │
│ │  Padding 20px  │ │
│ │                │ │
│ └────────────────┘ │
│                    │
│  [Support Link]    │
│                    │
└────────────────────┘
```

---

### 1.2 Visual Design Specs

```css
/* Container */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0A0E1A 0%, #1A1F2E 100%);
  padding: 24px;
}

/* Card */
.login-card {
  width: 100%;
  max-width: 440px;
  background: rgba(17, 24, 39, 0.6); /* bg-secondary with opacity */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

/* Logo */
.logo {
  height: 40px;
  margin-bottom: 40px;
}

/* Heading */
.heading {
  font-size: 28px;
  font-weight: 700;
  color: #F9FAFB; /* text-primary */
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

/* Subheading */
.subheading {
  font-size: 16px;
  color: #9CA3AF; /* text-tertiary */
  margin-bottom: 32px;
  line-height: 1.5;
}

/* Input */
.input {
  width: 100%;
  height: 48px;
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 16px;
  color: #F9FAFB;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #06B6D4; /* cyan */
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
}

.input::placeholder {
  color: #6B7280;
}

/* Button Primary */
.button-primary {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.button-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(6, 182, 212, 0.3);
}

.button-primary:active {
  transform: translateY(0);
}

.button-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Link */
.link {
  color: #06B6D4;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.link:hover {
  color: #22D3EE;
}

/* Help Text */
.help-text {
  font-size: 14px;
  color: #9CA3AF;
  text-align: center;
  margin-top: 16px;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 32px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #374151;
}

.divider-text {
  font-size: 12px;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## 2. Component Specifications

### 2.1 Login Page (Magic Link - Default)

```typescript
// /app/login/page.tsx

export default function LoginPage() {
  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <Logo className="logo" />
        
        {/* Heading */}
        <div className="mb-8">
          <h1 className="heading">Bentornato</h1>
          <p className="subheading">
            Accedi al tuo account Afflyt
          </p>
        </div>
        
        {/* Magic Link Form */}
        <MagicLinkForm />
        
        {/* Divider */}
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">oppure</span>
          <div className="divider-line" />
        </div>
        
        {/* Password Fallback Link */}
        <div className="text-center">
          <Link href="/login/password" className="link text-sm">
            Preferisci usare la password?
          </Link>
        </div>
        
        {/* Register CTA */}
        <div className="mt-8 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg text-center">
          <p className="text-sm text-gray-300 mb-2">
            Prima volta su Afflyt?
          </p>
          <Link href="/register" className="link font-semibold">
            Crea account gratuito →
          </Link>
        </div>
        
        {/* Support Link */}
        <div className="mt-6 text-center">
          <button
            onClick={openSupportWidget}
            className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            Problemi di accesso? Contatta il supporto
          </button>
        </div>
      </div>
      
      {/* Language Selector (Fixed Bottom) */}
      <LanguageSelector />
    </div>
  )
}
```

---

### 2.2 Magic Link Form Component

```typescript
// components/auth/MagicLinkForm.tsx

'use client'

import { useState } from 'react'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'

export function MagicLinkForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validate
    if (!email) {
      setError('Inserisci la tua email')
      return
    }
    
    if (!isValidEmail(email)) {
      setError('Email non valida')
      return
    }
    
    setError(null)
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'login' }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Errore durante l\'invio')
      }
      
      setIsSuccess(true)
      
      // Track event
      analytics.track('Magic Link Sent', { email })
      
    } catch (error) {
      setError(error.message)
      console.error('Magic link error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Show success state
  if (isSuccess) {
    return <MagicLinkSuccess email={email} onResend={handleSubmit} />
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input pl-12"
            autoFocus
            autoComplete="email"
            disabled={isLoading}
          />
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}
      
      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !email}
        className="button-primary"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Invio in corso...</span>
          </>
        ) : (
          <>
            <Mail className="w-5 h-5" />
            <span>Invia Magic Link</span>
          </>
        )}
      </button>
      
      {/* Help Text */}
      <p className="help-text">
        Ti invieremo un link sicuro per accedere senza password
      </p>
    </form>
  )
}

// Email validation
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}
```

---

### 2.3 Magic Link Success State

```typescript
// components/auth/MagicLinkSuccess.tsx

'use client'

import { useState, useEffect } from 'react'
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  email: string
  onResend: () => Promise<void>
}

export function MagicLinkSuccess({ email, onResend }: Props) {
  const [canResend, setCanResend] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [isResending, setIsResending] = useState(false)
  
  // Countdown timer
  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true)
      return
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [countdown])
  
  async function handleResend() {
    setIsResending(true)
    await onResend()
    setIsResending(false)
    setCountdown(30)
    setCanResend(false)
  }
  
  return (
    <div className="text-center py-8">
      {/* Success Icon */}
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full mb-6">
        <CheckCircle2 className="w-8 h-8 text-green-400" />
      </div>
      
      {/* Heading */}
      <h2 className="text-2xl font-bold text-white mb-2">
        Controlla la tua email
      </h2>
      
      {/* Message */}
      <p className="text-gray-400 mb-6">
        Abbiamo inviato un link di accesso a:<br />
        <strong className="text-white">{email}</strong>
      </p>
      
      {/* Instructions */}
      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3 text-left">
          <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="mb-2">
              Clicca il link nell'email per accedere automaticamente.
            </p>
            <p className="text-gray-500">
              Il link scade tra <strong>15 minuti</strong> e può essere usato una sola volta.
            </p>
          </div>
        </div>
      </div>
      
      {/* Spam Notice */}
      <div className="flex items-start gap-2 text-left text-sm text-gray-500 mb-6">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          Non hai ricevuto l'email? Controlla la cartella spam o promozioni.
        </p>
      </div>
      
      {/* Resend Button */}
      <button
        onClick={handleResend}
        disabled={!canResend || isResending}
        className={`
          inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all
          ${canResend 
            ? 'bg-gray-800 text-white hover:bg-gray-700' 
            : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {isResending ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Invio in corso...</span>
          </>
        ) : canResend ? (
          <>
            <RefreshCw className="w-4 h-4" />
            <span>Invia di nuovo</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            <span>Invia di nuovo ({countdown}s)</span>
          </>
        )}
      </button>
      
      {/* Support Link */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-2">
          Ancora problemi?
        </p>
        <button
          onClick={openSupportWidget}
          className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
        >
          Contatta il supporto →
        </button>
      </div>
    </div>
  )
}

// Open support widget
function openSupportWidget() {
  if (window.$crisp) {
    window.$crisp.push(['do', 'chat:open'])
  }
}
```

---

### 2.4 Password Login Page (Fallback)

```typescript
// /app/login/password/page.tsx

'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PasswordLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Credenziali non valide')
      }
      
      // Track successful login
      analytics.track('Password Login Success', { email })
      
      // Redirect to dashboard
      router.push('/dashboard')
      
    } catch (error) {
      setError(error.message)
      
      // Track failed login
      analytics.track('Password Login Failed', { 
        email, 
        error: error.message 
      })
      
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="login-container">
      <div className="login-card">
        {/* Back to Magic Link */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna al magic link</span>
        </Link>
        
        {/* Logo */}
        <Logo className="logo" />
        
        {/* Heading */}
        <div className="mb-8">
          <h1 className="heading">Accedi con password</h1>
          <p className="subheading">
            Inserisci le tue credenziali
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
              autoComplete="email"
              autoFocus
              required
            />
          </div>
          
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-12 pr-12"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}
          
          {/* Forgot Password */}
          <div className="text-right">
            <Link 
              href="/forgot-password" 
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              Password dimenticata?
            </Link>
          </div>
          
          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="button-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Accesso in corso...</span>
              </>
            ) : (
              <span>Accedi</span>
            )}
          </button>
        </form>
        
        {/* Register CTA */}
        <div className="mt-8 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg text-center">
          <p className="text-sm text-gray-300 mb-2">
            Prima volta su Afflyt?
          </p>
          <Link href="/register" className="link font-semibold">
            Crea account gratuito →
          </Link>
        </div>
        
        {/* Support */}
        <div className="mt-6 text-center">
          <button
            onClick={openSupportWidget}
            className="text-xs text-gray-500 hover:text-gray-400"
          >
            Problemi di accesso? Contatta il supporto
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 3. State Management

### 3.1 Error States

```typescript
// Error types and messages

type AuthError = 
  | 'invalid_email'
  | 'user_not_found'
  | 'invalid_password'
  | 'account_locked'
  | 'rate_limit_exceeded'
  | 'email_not_verified'
  | 'account_suspended'
  | 'token_expired'
  | 'token_invalid'
  | 'network_error'

const ERROR_MESSAGES: Record<AuthError, string> = {
  invalid_email: 'Email non valida. Controlla e riprova.',
  user_not_found: 'Nessun account trovato con questa email.',
  invalid_password: 'Password non corretta. Riprova o usa il magic link.',
  account_locked: 'Account bloccato per troppi tentativi. Riprova tra 15 minuti.',
  rate_limit_exceeded: 'Troppi tentativi. Riprova tra qualche minuto.',
  email_not_verified: 'Email non ancora verificata. Controlla la tua inbox.',
  account_suspended: 'Account sospeso. Contatta il supporto per assistenza.',
  token_expired: 'Link scaduto. Richiedi un nuovo magic link.',
  token_invalid: 'Link non valido. Richiedi un nuovo magic link.',
  network_error: 'Errore di connessione. Controlla la tua rete e riprova.',
}

// Error component
function ErrorAlert({ error }: { error: AuthError | string }) {
  const message = ERROR_MESSAGES[error as AuthError] || error
  
  return (
    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-red-400">
            {message}
          </p>
          {error === 'account_locked' && (
            <button
              onClick={openSupportWidget}
              className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
            >
              Contatta il supporto
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

### 3.2 Loading States

```typescript
// Loading indicator component

function LoadingButton({ 
  isLoading, 
  children, 
  ...props 
}: ButtonProps & { isLoading: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || isLoading}
      className="button-primary"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Caricamento...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Skeleton loading for page transitions
function LoginSkeleton() {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="animate-pulse space-y-4">
          {/* Logo skeleton */}
          <div className="h-10 w-32 bg-gray-700 rounded" />
          
          {/* Heading skeleton */}
          <div className="h-8 w-48 bg-gray-700 rounded mt-8" />
          <div className="h-4 w-64 bg-gray-700 rounded" />
          
          {/* Form skeleton */}
          <div className="h-12 bg-gray-700 rounded mt-8" />
          <div className="h-12 bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  )
}
```

---

## 4. Responsive Design

### 4.1 Breakpoint Strategy

```css
/* Mobile First Approach */

/* Base (Mobile) - 320px+ */
.login-card {
  width: 100%;
  padding: 32px 24px;
  border-radius: 12px;
}

.heading {
  font-size: 24px;
}

/* Tablet - 768px+ */
@media (min-width: 768px) {
  .login-card {
    max-width: 440px;
    padding: 48px 40px;
    border-radius: 16px;
  }
  
  .heading {
    font-size: 28px;
  }
}

/* Desktop - 1024px+ */
@media (min-width: 1024px) {
  /* Same as tablet, no changes needed */
}
```

---

### 4.2 Touch Optimization (Mobile)

```css
/* Larger touch targets for mobile */
@media (max-width: 767px) {
  .button-primary,
  .input {
    height: 52px; /* Increased from 48px */
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  .link {
    padding: 8px; /* Larger tap area */
    margin: -8px; /* Negative margin to maintain visual spacing */
  }
}

/* Prevent zoom on input focus (iOS) */
input,
select,
textarea {
  font-size: 16px !important;
}
```

---

## 5. Accessibility

### 5.1 Keyboard Navigation

```typescript
// Ensure tab order is logical
<form>
  <input tabIndex={1} /> {/* Email */}
  <button tabIndex={2}>Send Magic Link</button>
  <a tabIndex={3}>Prefer password?</a>
  <a tabIndex={4}>Create account</a>
  <button tabIndex={5}>Contact support</button>
</form>

// Focus trap in modal/drawer
import FocusTrap from 'focus-trap-react'

<FocusTrap>
  <div role="dialog" aria-modal="true">
    {/* Modal content */}
  </div>
</FocusTrap>

// Escape key to close
useEffect(() => {
  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeModal()
    }
  }
  window.addEventListener('keydown', handleEscape)
  return () => window.removeEventListener('keydown', handleEscape)
}, [])
```

---

### 5.2 Screen Reader Support

```tsx
// ARIA labels and roles
<form role="form" aria-label="Login form">
  <label htmlFor="email" id="email-label">
    Email
  </label>
  <input
    id="email"
    type="email"
    aria-labelledby="email-label"
    aria-describedby="email-help"
    aria-required="true"
    aria-invalid={!!error}
  />
  <p id="email-help" className="sr-only">
    Enter your email address to receive a login link
  </p>
  
  {error && (
    <div role="alert" aria-live="assertive">
      {error}
    </div>
  )}
  
  <button type="submit" aria-label="Send magic link to email">
    Send Magic Link
  </button>
</form>

// Loading state announcement
{isLoading && (
  <div className="sr-only" role="status" aria-live="polite">
    Sending magic link, please wait
  </div>
)}

// Success state announcement
{isSuccess && (
  <div className="sr-only" role="status" aria-live="polite">
    Magic link sent successfully. Check your email.
  </div>
)}
```

---

### 5.3 Color Contrast

```css
/* Ensure WCAG AA compliance (4.5:1 minimum) */

/* Good contrast examples */
.text-primary {
  color: #F9FAFB; /* White on dark = 18:1 ✅ */
}

.text-secondary {
  color: #D1D5DB; /* Light gray on dark = 12:1 ✅ */
}

.link {
  color: #06B6D4; /* Cyan on dark = 8:1 ✅ */
}

/* Bad contrast - avoid */
.bad-example {
  color: #4B5563; /* Medium gray on dark = 3:1 ❌ */
}

/* Test all colors with tools like:
   - WebAIM Contrast Checker
   - Chrome DevTools Accessibility Panel
*/
```

---

## Next Steps

Continue to **Part 3: Backend Implementation** for:
- API endpoint specifications
- Database schemas
- Email sending logic
- Token validation
- Session management

---

**End of Part 2**
