# Afflyt Pro - Master TODO List

**Last Updated**: November 27, 2025
**Overall Progress**: ~80%

---

## Overview

Questo documento consolida tutti i TODO del progetto in un unico file organizzato per priorità e categoria.

### Legenda Priorità
- 🔴 **P0 - CRITICAL**: Blocca il rilascio, rischi sicurezza
- 🟠 **P1 - HIGH**: Funzionalità core mancanti
- 🟡 **P2 - MEDIUM**: Miglioramenti importanti
- 🟢 **P3 - LOW**: Nice to have, ottimizzazioni
- ✅ **DONE**: Completato

---

## Status Summary

| Categoria | Completati | Totali | % |
|-----------|------------|--------|---|
| Sicurezza | 8 | 12 | 67% |
| Auth System | 9 | 11 | 82% |
| Monitoring | 6 | 6 | 100% |
| Analytics Page | 1 | 6 | 17% |
| Deals/Products | 2 | 4 | 50% |
| Automations | 2 | 3 | 67% |
| Settings | 3 | 5 | 60% |
| Infrastruttura | 2 | 5 | 40% |

---

## 🔴 P0 - CRITICAL (Security & Blocking Issues)

### Security - COMPLETATI

- [x] ~~**Rimuovere Token Telegram Hardcoded**~~ ✅
  - File: `apps/api/test-telegram-bot.ts`
  - Rimosso fallback hardcoded

- [x] ~~**Sanitizzare dangerouslySetInnerHTML (XSS)**~~ ✅
  - File: `apps/web/components/templates/TelegramPreview.tsx`
  - Implementato DOMPurify

- [x] ~~**Fixare userId Hardcoded in Deals**~~ ✅
  - File: `apps/api/src/routes/deals.ts`
  - Ora usa JWT user ID

- [x] ~~**Rate Limiting Auth Endpoints**~~ ✅
  - File: `apps/api/src/routes/auth.ts`
  - Implementato per IP e per email

- [x] ~~**Disposable Email Blocking**~~ ✅
  - File: `apps/api/src/lib/disposable-emails.ts`
  - Blocca registrazioni da email temporanee

- [x] ~~**Token Reuse Detection**~~ ✅
  - File: `apps/api/src/routes/auth.ts`
  - Log tentativi di riutilizzo magic link

### Security - DA FARE

- [ ] **Migrare JWT da localStorage a httpOnly cookies**
  - Priorità: 🔴 P0
  - Problema: JWT in localStorage vulnerabile a XSS
  - File: `apps/api/src/app.ts`, `apps/web/lib/api/`
  - Azione: Implementare cookie-based auth con CSRF protection

- [ ] **Implementare CSRF Protection**
  - Priorità: 🔴 P0
  - Richiesto se si migra a cookies
  - Azione: Aggiungere token CSRF a form e API calls

- [ ] **Content Security Policy (CSP) Headers**
  - Priorità: 🟠 P1
  - File: `apps/web/next.config.ts`
  - Azione: Configurare CSP per prevenire XSS

- [ ] **Audit Log per azioni admin**
  - Priorità: 🟡 P2
  - Loggare: cambio password, delete account, cambio email
  - File: nuovo `apps/api/src/services/AuditService.ts`

---

## 🟠 P1 - HIGH (Core Features)

### Auth System - COMPLETATI

- [x] ~~**Magic Link come metodo primario**~~ ✅
- [x] ~~**Countdown resend magic link (60s)**~~ ✅
- [x] ~~**Magic Link Success Screen con tips**~~ ✅
- [x] ~~**Endpoint POST /auth/set-password**~~ ✅
- [x] ~~**Auth Events logging in DB**~~ ✅
- [x] ~~**Rate limit per email (3/ora)**~~ ✅
- [x] ~~**Email Provider Detection**~~ ✅
- [x] ~~**Webmail Quick-Open Buttons**~~ ✅
- [x] ~~**Provider Warning (Outlook/Hotmail)**~~ ✅

### Auth System - DA FARE

- [ ] **Session Management UI**
  - Priorità: 🟠 P1
  - Mostrare sessioni attive in `/settings/security`
  - Permettere revoca sessioni individuali
  - Files: `apps/api/src/routes/auth.ts`, `apps/web/app/[locale]/settings/security/`

- [ ] **Account Deletion Flow**
  - Priorità: 🟠 P1
  - Conferma via email prima di eliminare
  - Soft delete con grace period 30 giorni
  - Files: `apps/api/src/routes/auth.ts`, `apps/web/app/[locale]/settings/security/`

### Monitoring - COMPLETATI

- [x] ~~**Sentry Error Tracking (Frontend)**~~ ✅
- [x] ~~**Sentry Error Tracking (Backend)**~~ ✅
- [x] ~~**PostHog Analytics Integration**~~ ✅
- [x] ~~**Tawk.to Live Chat**~~ ✅
- [x] ~~**Event Tracking (auth, onboarding)**~~ ✅
- [x] ~~**User Context Unificato**~~ ✅

---

## 🟡 P2 - MEDIUM (Important Improvements)

### Analytics Page

- [x] ~~**Tab 1: Performance Overview**~~ ✅ (implementato)

- [ ] **Tab 2: Channel Deep Dive**
  - Priorità: 🟡 P2
  - Confronto multi-linea tra canali
  - File: `apps/web/app/[locale]/dashboard/analytics/page.tsx`

- [ ] **Tab 3: Product Analytics**
  - Priorità: 🟡 P2
  - Breakdown per categorie, price range
  - File: `apps/web/app/[locale]/dashboard/analytics/page.tsx`

- [ ] **Tab 4: Time Analysis Heatmap**
  - Priorità: 🟡 P2
  - Endpoint esiste, manca UI
  - File: `apps/web/app/[locale]/dashboard/analytics/page.tsx`

- [ ] **Tab 5: AI Insights (PRO+)**
  - Priorità: 🟢 P3
  - Suggerimenti AI basati su dati
  - Richiede integrazione LLM

- [ ] **Export CSV/PDF**
  - Priorità: 🟡 P2
  - Export dati analytics
  - File: nuovo componente export

### Deals & Products

- [x] ~~**userId da JWT**~~ ✅
- [x] ~~**Tag affiliato dinamico**~~ ✅

- [ ] **Save Link to Channel**
  - Priorità: 🟡 P2
  - File: `apps/web/components/deals/DealDetailPanel.tsx`
  - Azione: Collegare a API esistente

- [ ] **Keepa API Integration completa**
  - Priorità: 🟡 P2
  - File: `apps/api/src/services/RuleExecutor.ts`
  - Azione: Implementare refresh reale dati

### Settings

- [x] ~~**Logout funzionante**~~ ✅
- [x] ~~**Rate limiting**~~ ✅
- [x] ~~**Validazione tag Amazon**~~ ✅

- [ ] **Templates API collegata**
  - Priorità: 🟡 P2
  - Files: `apps/web/app/[locale]/settings/templates/page.tsx`
  - Azione: Collegare a `/user/templates`

- [ ] **Tier Lock per FREE users**
  - Priorità: 🟡 P2
  - File: `apps/web/app/[locale]/dashboard/analytics/page.tsx`
  - Azione: Leggere piano utente, applicare blur + CTA upgrade

### Automations

- [x] ~~**Tag affiliato da credentials utente**~~ ✅
- [x] ~~**Validazione tag**~~ ✅

- [ ] **Notification quando automazione esegue**
  - Priorità: 🟡 P2
  - Email/push quando deal pubblicato
  - File: `apps/api/src/services/RuleExecutor.ts`

---

## 🟢 P3 - LOW (Nice to Have)

### UX Improvements

- [ ] **Onboarding Video Tutorial**
  - Priorità: 🟢 P3
  - Video embed per ogni step onboarding

- [ ] **Dark/Light Mode Toggle**
  - Priorità: 🟢 P3
  - Attualmente solo dark mode

- [ ] **Keyboard Shortcuts**
  - Priorità: 🟢 P3
  - `Cmd+K` search, `Cmd+N` new automation, etc.

- [ ] **PWA Support**
  - Priorità: 🟢 P3
  - Manifest, service worker, offline support

### Analytics Enhancements

- [ ] **A/B Testing con PostHog Feature Flags**
  - Priorità: 🟢 P3
  - Test varianti UI

- [ ] **Exit Survey con PostHog Surveys**
  - Priorità: 🟢 P3
  - Chiedere feedback quando utente cancella account

- [ ] **NPS Survey periodico**
  - Priorità: 🟢 P3
  - "Quanto consiglieresti Afflyt?"

### Performance

- [ ] **Image Optimization**
  - Priorità: 🟢 P3
  - Lazy loading, WebP, dimensioni ottimizzate

- [ ] **Bundle Size Analysis**
  - Priorità: 🟢 P3
  - Ridurre JS bundle size

- [ ] **API Response Caching**
  - Priorità: 🟢 P3
  - Redis per caching responses frequenti

### Infrastruttura

- [ ] **Migrare Middleware Next.js**
  - Priorità: 🟢 P3
  - Warning: "middleware" deprecated, usare "proxy"
  - File: `apps/web/middleware.ts`

- [ ] **GitHub Actions CI/CD**
  - Priorità: 🟡 P2
  - Build + test automatici su PR
  - Deploy automatico su merge

- [ ] **Database Backups Automatici**
  - Priorità: 🟠 P1
  - Backup giornalieri PostgreSQL
  - Retention 30 giorni

- [ ] **Monitoring Alerts su Slack**
  - Priorità: 🟡 P2
  - Notifica su errori Sentry critici
  - Alert su metriche anomale

- [ ] **Staging Environment**
  - Priorità: 🟡 P2
  - Ambiente di test separato da production

---

## 🔒 Security Checklist (Pre-Production)

### Implementati ✅
- [x] HTTPS enforced (Vercel/Railway default)
- [x] JWT authentication
- [x] Password hashing (bcrypt)
- [x] Rate limiting (IP + email based)
- [x] XSS sanitization (DOMPurify)
- [x] SQL injection protection (Prisma ORM)
- [x] Disposable email blocking
- [x] Auth token expiration (15 min magic link, 7 days JWT)
- [x] Error tracking (Sentry)
- [x] CORS configurato

### Da Implementare
- [ ] httpOnly cookies per JWT
- [ ] CSRF protection
- [ ] Content Security Policy
- [ ] Security headers (Helmet.js equivalent)
- [ ] Input validation su tutti endpoint (zod schemas)
- [ ] Audit logging
- [ ] Penetration testing
- [ ] Dependency vulnerability scanning (npm audit)
- [ ] Secrets rotation policy
- [ ] 2FA (Two-Factor Authentication)

---

## 📅 Roadmap Suggerita

### Sprint 1 (Questa settimana)
1. Session Management UI
2. Account Deletion Flow
3. Templates API collegata

### Sprint 2 (Prossima settimana)
1. httpOnly cookies migration
2. CSRF protection
3. Analytics Tab 2 & 3

### Sprint 3
1. CSP headers
2. GitHub Actions CI/CD
3. Analytics Tab 4 + Export

### Backlog
- Tutto il resto P2/P3

---

## Files Obsoleti da Rimuovere

```
docs/TODO.md              → sostituito da questo file
docs/TODO-login-system.md → sostituito da questo file
```

---

## Note

- Build passa senza errori (web + api)
- TypeScript check passa
- Nessun `@ts-ignore` o `eslint-disable`
- File `.env` non committato (corretto)
- Monitoring attivo (Sentry, PostHog, Tawk.to)

---

**Maintainer**: Team Afflyt
**Ultimo Audit**: November 27, 2025
