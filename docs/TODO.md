# TODO - AfflytPro Project

> Generato il: 2025-11-26
> Stato completamento stimato: ~75%

---

## 🔴 P0 - CRITICI (Da fixare SUBITO)

### 1. [x] Rimuovere Token Telegram Hardcoded (COMPLETATO 2025-11-26)
- **File**: `apps/api/test-telegram-bot.ts:14`
- **Problema**: Token bot esposto in chiaro nel codice
- **Azione**: Rimuovere fallback hardcoded, usare solo `process.env.TELEGRAM_BOT_TOKEN`

### 2. [x] Sanitizzare dangerouslySetInnerHTML (COMPLETATO 2025-11-26)
- **File**: `apps/web/components/templates/TelegramPreview.tsx:100`
- **Problema**: XSS vulnerability se template contiene HTML maligno
- **Azione**: Installare e usare DOMPurify per sanitizzare `formattedMessage`

### 3. [x] Fixare userId Hardcoded in Deals (COMPLETATO 2025-11-26)
- **File**: `apps/api/src/routes/deals.ts:162`
- **Problema**: `userId = 'test-user'` invece di prendere da JWT
- **Azione**: Usare `(req.user as any).id` o simile da token autenticato

---

## 🟠 P1 - IMPORTANTI

### 4. [x] Implementare Logout (COMPLETATO 2025-11-26)
- **File**: `apps/web/components/navigation/CommandBar.tsx:291, 409`
- **Problema**: TODO comment, logout non funziona
- **Azione**: Implementare `localStorage.removeItem('token')` + redirect

### 5. [x] Implementare API Security Settings (COMPLETATO 2025-11-26)
- **File**: `apps/web/app/[locale]/settings/security/page.tsx`
- **Problemi**:
  - Linea 87: Cambio password API mancante
  - Linea 93: Revoca sessione mancante
  - Linea 102: Eliminazione account mancante
- **Azione**: Creare endpoint backend + collegare frontend

### 6. [x] Aggiungere Rate Limiting (COMPLETATO 2025-11-26)
- **File**: `apps/api/src/app.ts`
- **Endpoint da proteggere**:
  - `/auth/register`
  - `/auth/login`
  - `/auth/magic-link`
  - `/analytics/track`
- **Azione**: Installare `@fastify/rate-limit` e configurare

### 7. [x] Validazione Tag Amazon (COMPLETATO 2025-11-26)
- **File**: `apps/api/src/routes/links.ts:43`
- **Problema**: Manca validazione tag contro Credential Vault utente
- **Azione**: Verificare che il tag appartenga all'utente prima di creare link

### 8. [x] Tag Affiliato Dinamico in RuleExecutor (COMPLETATO 2025-11-26)
- **File**: `apps/api/src/services/RuleExecutor.ts:254`
- **Problema**: Tag hardcoded `afflyt-21`
- **Azione**: Recuperare tag dalle impostazioni/credentials utente

---

## 🟡 P2 - MIGLIORAMENTI

### 9. [ ] Completare Analytics Page
- **File**: `apps/web/app/[locale]/dashboard/analytics/page.tsx`
- **Spec**: `DOCS/UI/UX/Analytics-page.md`
- **Mancanti**:
  - [ ] Tab 2: Channel Deep Dive (confronto multi-linea)
  - [ ] Tab 3: Product Analytics (categorie, price range)
  - [ ] Tab 4: Time Analysis Heatmap (endpoint esiste, manca UI)
  - [ ] Tab 5: AI Insights (PRO+)
  - [ ] Export CSV/PDF
  - [ ] Quick Stats: Top Device, Best Hour (ora mostrano "-")

### 10. [ ] Implementare Sistema Lock Tier FREE
- **File**: `apps/web/app/[locale]/dashboard/analytics/page.tsx:293`
- **Problema**: `locked={false}` hardcoded
- **Azione**: Leggere piano utente e applicare lock con blur + upgrade CTA

### 11. [ ] Migrare Middleware Next.js
- **File**: `apps/web/middleware.ts`
- **Warning**: "middleware" convention deprecated, usare "proxy"
- **Azione**: Seguire guida migrazione Next.js 16

### 12. [ ] Completare Integrazione Keepa API
- **File**: `apps/api/src/services/RuleExecutor.ts:230`
- **Problema**: TODO - implementare refresh reale Keepa
- **Azione**: Collegare a KeepaEngine.ts per fetch dati reali

### 13. [ ] Implementare API Templates Utente
- **Files**:
  - `apps/web/app/[locale]/settings/templates/page.tsx:56`
  - `apps/web/app/[locale]/dashboard/settings/templates/page.tsx:56`
- **Problema**: TODO - endpoint API mancante
- **Azione**: Collegare a `/user/templates` esistente

### 14. [ ] Implementare Save Link to Channel
- **File**: `apps/web/components/deals/DealDetailPanel.tsx:71`
- **Problema**: TODO - API per salvare link e associare canale
- **Azione**: Creare endpoint o usare esistente

### 15. [ ] Aggiungere Campo TTL a User Model
- **File**: `apps/api/src/routes/dashboard.ts:36, 144`
- **Problema**: TTL hardcoded a 72h
- **Azione**: Aggiungere campo `ttl` a schema Prisma User

---

## 🟢 P3 - NICE TO HAVE

### 16. [ ] Validazione Resend Email
- **File**: `apps/api/src/services/EmailService.ts:31`
- **Azione**: Aggiungere validazione risposta Resend

### 17. [ ] Migliorare Token Storage
- **Problema**: JWT in localStorage vulnerabile a XSS
- **Azione**: Considerare migrazione a httpOnly cookies

### 18. [ ] Configurare CORS per Produzione
- **File**: `apps/api/src/app.ts:51`
- **Problema**: `origin: true` troppo permissivo
- **Azione**: Usare `CORS_ORIGINS` da env in produzione

---

## 📊 Stato Moduli

| Modulo | Completamento | Note |
|--------|---------------|------|
| Auth System | 90% | Manca revoca sessione, delete account |
| Dashboard | 75% | TTL hardcoded |
| Analytics | 60% | Mancano tabs, export, tier lock |
| Deals/Products | 70% | userId hardcoded, save to channel |
| Automations | 85% | Tag affiliato hardcoded |
| Channels | 80% | Validazione tag |
| Security | 65% | Rate limiting, XSS fix |

---

## Note

- Build passa senza errori (web + api)
- TypeScript check passa
- Nessun `@ts-ignore` o `eslint-disable` trovato
- File `.env` non committato (corretto)
