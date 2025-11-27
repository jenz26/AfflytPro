# Afflyt Pro - Monitoring & Analytics Guide

**Version**: 1.0
**Last Updated**: November 27, 2025
**Status**: Implemented

---

## Overview

Afflyt Pro utilizza tre strumenti di monitoring integrati per tracciare errori, comportamento utenti e fornire supporto in tempo reale.

| Tool | Scopo | Piano | Costo |
|------|-------|-------|-------|
| **Sentry** | Error tracking | Developer (Free) | €0/mese |
| **PostHog** | Product analytics | Free Cloud | €0/mese |
| **Tawk.to** | Live chat support | Free | €0/mese |

---

## 1. Sentry - Error Tracking

### Cos'è
Sentry cattura automaticamente errori JavaScript/TypeScript sia nel frontend che nel backend, fornendo stack trace, user context e breadcrumbs per il debugging.

### Configurazione

**Frontend (Next.js)**
- File: `apps/web/sentry.client.config.ts` (client-side)
- File: `apps/web/sentry.server.config.ts` (server-side)
- File: `apps/web/sentry.edge.config.ts` (edge/middleware)
- File: `apps/web/app/global-error.tsx` (pagina errore custom)

**Backend (Fastify API)**
- File: `apps/api/src/lib/sentry.ts` (modulo Sentry)
- File: `apps/api/src/app.ts` (error handler globale)

### Variabili d'Ambiente

```bash
# Frontend (Vercel)
NEXT_PUBLIC_SENTRY_DSN=https://c79dee78d90e6fa585686dc031a02eb4@o4510437320491008.ingest.de.sentry.io/4510437327503440

# Backend (Railway)
SENTRY_DSN=https://6fc678f2979a0db796ee56109ccbd09d@o4510437320491008.ingest.de.sentry.io/4510437334319184
```

### Cosa viene tracciato

**Frontend:**
- Errori JavaScript non gestiti
- Errori React (component crashes)
- Errori di rete (fetch failures)
- Session replay per errori (10% sessioni, 100% su errore)

**Backend:**
- Errori 5xx (server errors)
- Stack trace con contesto request
- User context (id, email, plan) se autenticato

### Filtri applicati

Errori ignorati (rumore):
- Browser extensions (`chrome-extension://`, `moz-extension://`)
- Network errors generici (`Network Error`, `Failed to fetch`)
- `ResizeObserver loop` (bug browser)
- Errori 4xx (client errors) - non inviati al backend

### Dashboard

URL: https://sentry.io
Org: `afflyt`
Projects: `afflyt-web` (frontend), `afflyt-api` (backend)

---

## 2. PostHog - Product Analytics

### Cos'è
PostHog traccia eventi utente, page views, e fornisce funnel analysis per capire come gli utenti interagiscono con l'app.

### Configurazione

- File: `apps/web/components/analytics/PostHogProvider.tsx`
- Provider wrappato nel layout: `apps/web/app/[locale]/layout.tsx`

### Variabili d'Ambiente

```bash
# Frontend (Vercel)
NEXT_PUBLIC_POSTHOG_KEY=phc_jfMIDU4cty3HlgaBsY9f3FHjGnfPaASzn30u7XwvnFC
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

### Eventi Tracciati

#### Authentication Events

| Evento | Quando | Properties |
|--------|--------|------------|
| `login_page_viewed` | Apertura pagina login | - |
| `magic_link_requested` | Richiesta magic link | `email_provider`, `is_new_user` |
| `magic_link_clicked` | Click su link in email | - |
| `login_success` | Login completato | `method` (password/magic_link) |
| `login_error` | Errore login | `error_type` |
| `user_registered` | Nuova registrazione | `method` |

#### Onboarding Events

| Evento | Quando | Properties |
|--------|--------|------------|
| `onboarding_step_viewed` | Visualizzazione step | `step` (1-6), `step_name` |
| `onboarding_completed` | Completamento onboarding | - |

#### Feature Usage Events (predefiniti, da implementare)

| Evento | Quando | Properties |
|--------|--------|------------|
| `automation_created` | Creazione automazione | `type` |
| `channel_connected` | Connessione canale | `type` |
| `deal_found` | Deal trovato | `score` |
| `support_chat_opened` | Apertura chat supporto | `context` |

### User Identification

Dopo il login, l'utente viene identificato con:
```typescript
Analytics.identify(userId, {
  email: user.email,
  name: user.name,
  plan: user.plan,
});
```

### Funnel Analysis Disponibili

1. **Login Funnel**
   - `login_page_viewed` → `magic_link_requested` → `magic_link_clicked` → `login_success`

2. **Onboarding Funnel**
   - Step 1 (welcome) → Step 2 (plan) → Step 3 (telegram) → Step 4 (email) → Step 5 (automation) → Step 6 (complete)

### Dashboard

URL: https://eu.posthog.com
Project: Afflyt Pro

### Features Abilitate

- [x] Product Analytics (eventi, funnel)
- [x] Web Analytics (page views, sessioni)
- [x] Session Replay (registrazione sessioni)
- [x] Surveys (sondaggi in-app)
- [ ] Feature Flags (non utilizzato)
- [ ] Experiments (non utilizzato)

---

## 3. Tawk.to - Live Chat Support

### Cos'è
Widget di chat live che appare in basso a destra su tutte le pagine, permettendo agli utenti di contattare il supporto in tempo reale.

### Configurazione

- File: `apps/web/components/support/TawkChat.tsx`
- Caricato nel layout: `apps/web/app/[locale]/layout.tsx`

### Variabili d'Ambiente

```bash
# Frontend (Vercel)
NEXT_PUBLIC_TAWK_PROPERTY_ID=69285669cb59ac1958eae2c7
NEXT_PUBLIC_TAWK_WIDGET_ID=1jb2p33cj
```

### User Context

Quando l'utente è loggato, vengono passati a Tawk:
- `name`: Nome utente
- `email`: Email utente
- `plan`: Piano abbonamento
- `id`: User ID
- `locale`: Lingua (it/en)

### Quick Replies Configurati

1. "Non ricevo il magic link"
2. "Ho problemi con il login"
3. "Come funziona Afflyt?"
4. "Altro"

### Controllo Programmatico

```typescript
import { TawkActions } from '@/components/support/TawkChat';

// Aprire la chat
TawkActions.open();

// Chiudere la chat
TawkActions.close();

// Aprire con contesto specifico
TawkActions.openWithContext('magic_link_issue');

// Tracciare evento
TawkActions.trackEvent('support_requested', { context: 'login' });
```

### Dashboard

URL: https://dashboard.tawk.to
Property: Afflyt Pro

---

## 4. Utility Unificata - Monitoring

### File

`apps/web/lib/monitoring.ts`

### Funzioni Disponibili

```typescript
import { setMonitoringUser, clearMonitoringUser, trackEvent } from '@/lib/monitoring';

// Dopo login - setta user su tutti i servizi (Sentry, PostHog, Tawk)
setMonitoringUser({
  id: user.id,
  email: user.email,
  name: user.name,
  plan: user.plan,
});

// Al logout - pulisce user context
clearMonitoringUser();

// Traccia evento cross-platform (PostHog + Sentry breadcrumb + Tawk)
trackEvent('feature_used', { feature: 'deal_finder' });
```

---

## 5. Pagine con Tracking Implementato

### Login Page (`/auth/login`)
- [x] `login_page_viewed` on mount
- [x] `login_success` (password) + user identification
- [x] `magic_link_requested` con email provider
- [x] `login_error` su fallimento

### Magic Link Page (`/auth/magic-link`)
- [x] `magic_link_clicked` su verifica
- [x] `login_success` (magic_link) + user identification
- [x] `login_error` su token invalido/scaduto

### Onboarding Page (`/onboarding`)
- [x] `onboarding_step_viewed` su ogni cambio step
- [x] `onboarding_completed` al termine

### Dashboard e altre pagine
- [ ] Da implementare tracking specifico per feature usage

---

## 6. Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Sentry     │  │   PostHog    │  │   Tawk.to    │       │
│  │   (Errors)   │  │  (Analytics) │  │   (Chat)     │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│                  ┌────────▼────────┐                        │
│                  │  monitoring.ts  │                        │
│                  │ (unified API)   │                        │
│                  └────────┬────────┘                        │
│                           │                                  │
│              ┌────────────┼────────────┐                    │
│              │            │            │                    │
│        ┌─────▼─────┐ ┌────▼────┐ ┌────▼─────┐              │
│        │  Login    │ │ Onboard │ │ Dashboard │              │
│        │  Pages    │ │  Page   │ │  Pages    │              │
│        └───────────┘ └─────────┘ └───────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Backend (Fastify)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐                                       │
│  │  Sentry (Errors) │                                       │
│  └────────┬─────────┘                                       │
│           │                                                  │
│  ┌────────▼─────────┐                                       │
│  │  Error Handler   │  ← Cattura errori 5xx                 │
│  │  (app.ts)        │  ← Aggiunge user context              │
│  └──────────────────┘                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Privacy & GDPR

### PostHog
- Server EU (`eu.i.posthog.com`) per compliance GDPR
- `respect_dnt: true` - rispetta Do Not Track
- Nessun dato sensibile tracciato (no password, no dati finanziari)

### Sentry
- Server EU (`ingest.de.sentry.io`) per compliance GDPR
- Session replay con `maskAllText: true` e `blockAllMedia: true`
- Nessun dato sensibile nei log

### Tawk.to
- Solo dati base utente (email, nome)
- Utente può chiudere la chat in qualsiasi momento

---

## 8. Costi Futuri

### Quando serve upgrade?

| Tool | Free Tier | Quando upgrade |
|------|-----------|----------------|
| Sentry | 5K errori/mese | >5K errori/mese |
| PostHog | 1M eventi/mese | >1M eventi/mese |
| Tawk.to | Illimitato | Mai (per chat base) |

### Stima costi scale

| Utenti attivi | Sentry | PostHog | Tawk | Totale |
|---------------|--------|---------|------|--------|
| <1,000 | €0 | €0 | €0 | **€0** |
| 1,000-5,000 | €26 | €0 | €0 | **€26** |
| 5,000-10,000 | €26 | €0* | €25 | **€51** |
| >10,000 | €80 | €450 | €95 | **€625** |

*PostHog self-hosted gratuito come alternativa

---

## 9. TODO Futuri

### Alta Priorità
- [ ] Aggiungere tracking su creazione automazione
- [ ] Aggiungere tracking su connessione canale
- [ ] Aggiungere tracking su deal pubblicato

### Media Priorità
- [ ] Configurare alert Sentry su Slack
- [ ] Creare dashboard PostHog per KPI principali
- [ ] Implementare exit survey con PostHog Surveys

### Bassa Priorità
- [ ] A/B testing con PostHog Feature Flags
- [ ] Heatmaps con PostHog
- [ ] Chatbot Tawk.to per FAQ automatiche

---

## 10. Troubleshooting

### PostHog non traccia eventi
1. Verifica che `NEXT_PUBLIC_POSTHOG_KEY` sia impostata
2. Controlla console per errori
3. Verifica che non sia attivo un ad-blocker

### Sentry non riceve errori
1. Verifica DSN corretta
2. Controlla che l'errore non sia filtrato (vedi `ignoreErrors`)
3. Verifica che non sia un errore 4xx (filtrato di default)

### Tawk.to non appare
1. Verifica `NEXT_PUBLIC_TAWK_PROPERTY_ID` e `WIDGET_ID`
2. Controlla console per errori di caricamento script
3. Verifica che non sia bloccato da ad-blocker

---

## Changelog

### v1.0 (Nov 27, 2025)
- Integrazione iniziale Sentry (frontend + backend)
- Integrazione PostHog con eventi auth e onboarding
- Integrazione Tawk.to live chat
- Utility `monitoring.ts` per user context unificato
- Documentazione completa

---

**Maintainer**: Team Afflyt
**Contatti**: support@afflyt.io
