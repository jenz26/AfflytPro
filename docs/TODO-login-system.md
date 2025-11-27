# TODO: Login System Alignment

**Obiettivo**: Allineare l'implementazione attuale alla guida `login-guide-part1-4.md`

**Data**: 27 Novembre 2025

---

## P0 - Critiche (UX principale)

- [x] **1. Invertire tab default login page** ✅
  - Magic Link deve essere il primo tab (default)
  - Password diventa tab secondario
  - File: `apps/web/app/[locale]/auth/login/page.tsx`

- [x] **2. Aggiungere countdown resend magic link** ✅
  - 60 secondi prima di poter re-inviare
  - Mostrare countdown visivo
  - Disabilitare button durante countdown
  - File: `apps/web/app/[locale]/auth/login/page.tsx`

- [x] **3. Migliorare Magic Link Success Screen** ✅
  - Aggiungere tips: "Controlla spam/promozioni"
  - Aggiungere: "Cerca email da noreply@afflyt.io"
  - Aggiungere: "Il link scade dopo 15 minuti"
  - Aggiungere link "Non ricevi l'email?" → supporto
  - File: `apps/web/app/[locale]/auth/login/page.tsx`

---

## P1 - Importanti (Funzionalità)

- [ ] **4. Endpoint POST /auth/set-password**
  - Per utenti passwordless che vogliono aggiungere password
  - Validazione: min 8 char, 1 uppercase, 1 number
  - Solo per utenti autenticati senza password
  - File: `apps/api/src/routes/auth.ts`

- [ ] **5. Auth Events logging**
  - Creare tabella AuthEvent in Prisma
  - Loggare: magic_link_sent, magic_link_clicked, login_success, login_failed, logout
  - Per analytics e debug
  - Files: `apps/api/prisma/schema.prisma`, `apps/api/src/routes/auth.ts`

- [ ] **6. Rate limit per email**
  - Aggiungere limite 3 magic link/ora per singola email
  - Oltre al rate limit per IP esistente
  - File: `apps/api/src/routes/auth.ts`

---

## P2 - Nice to Have

- [ ] **7. Support widget (Crisp)**
  - Integrare Crisp chat
  - Context-aware: passare info su dove l'utente è bloccato
  - Files: `apps/web/lib/crisp.ts`, `apps/web/components/support/`

- [ ] **8. Email provider detection**
  - Rilevare Outlook/Hotmail/corporate email
  - Mostrare avviso specifico per provider problematici
  - File: `apps/web/lib/email-provider-detection.ts`

- [ ] **9. LoginHelpCard component**
  - Tips contestuali per ogni stato (magic_link_sent, expired, error)
  - Azioni rapide verso supporto
  - File: `apps/web/components/auth/LoginHelpCard.tsx`

- [ ] **10. Session tracking DB**
  - Tabella Sessions per gestione multi-device
  - Limit 5 sessioni attive per utente
  - UI per vedere/revocare sessioni
  - Files: `apps/api/prisma/schema.prisma`, `apps/api/src/routes/auth.ts`

---

## Progresso

| Priorità | Totale | Completati | % |
|----------|--------|------------|---|
| P0       | 3      | 3          | 100% |
| P1       | 3      | 0          | 0% |
| P2       | 4      | 0          | 0% |
| **TOTAL**| **10** | **3**      | **30%** |

---

## Note

- La guida suggerisce Magic Link come metodo primario (90% utenti)
- Password è opt-in per chi preferisce
- Countdown resend previene spam e migliora deliverability
- Auth events sono fondamentali per debug e analytics
