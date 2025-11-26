# Afflyt Pro

**Piattaforma SaaS per Affiliate Marketing Intelligente su Amazon**

Sistema di automazione per scoperta deal, generazione link affiliati e pubblicazione multi-canale (Telegram, Discord, Email) con scoring AI e analytics real-time.

---

## Struttura del Progetto

```
AfflytPro/
├── apps/
│   ├── api/          # Backend Fastify (Node.js + TypeScript)
│   └── web/          # Frontend Next.js 16 (React 19)
├── DOCS/             # Documentazione feature e changelog
└── README.md         # Questo file
```

---

## Prerequisiti

- **Node.js** >= 18.x
- **npm** >= 9.x
- **SQLite** (incluso)

---

## Installazione

### 1. Clona il repository

```bash
git clone <repository-url>
cd AfflytPro
```

### 2. Installa le dipendenze

Dalla **root del progetto**:

```bash
npm install
```

Questo installerà le dipendenze per entrambe le app (workspaces).

---

## Configurazione

### Backend (API)

Crea un file `.env` in `apps/api/.env`:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Security
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
ENCRYPTION_SECRET="your-32-char-encryption-key-for-aes256"

# Server
PORT=3001
```

**Importante:**
- `JWT_SECRET`: Chiave per firmare i JWT token (minimo 32 caratteri)
- `ENCRYPTION_SECRET`: Chiave AES-256 per criptare le credenziali (esattamente 32 caratteri)

### Frontend (Web)

Il frontend si connette automaticamente a `http://localhost:3001` (API).

Se hai bisogno di cambiare l'URL dell'API, modifica:
- `apps/web/app/auth/login/page.tsx` (riga con `fetch('http://localhost:3001/...`)

---

## Setup Database

Vai nella cartella API e inizializza il database:

```bash
cd apps/api
npx prisma generate
npx prisma db push
```

Questo creerà:
- Il database SQLite in `apps/api/prisma/dev.db`
- I tipi TypeScript da Prisma

---

## Avvio del Progetto

### Opzione 1: Avvio Manuale (Consigliato per sviluppo)

**Terminale 1 - Backend:**
```bash
cd apps/api
npm run dev
```

Server API disponibile su: **http://localhost:3001**

**Terminale 2 - Frontend:**
```bash
cd apps/web
npm run dev
```

Applicazione web disponibile su: **http://localhost:3000**

### Opzione 2: Avvio dalla Root (Simultaneo)

**Terminale 1 - Backend:**
```bash
npm run dev --workspace=api
```

**Terminale 2 - Frontend:**
```bash
npm run dev --workspace=web
```

---

## Comandi Disponibili

### Root (Monorepo)

```bash
# Installa tutte le dipendenze
npm install

# Avvia un workspace specifico
npm run dev --workspace=api
npm run dev --workspace=web
```

### Backend (apps/api)

```bash
cd apps/api

# Sviluppo (hot reload)
npm run dev

# Build per produzione
npm run build

# Avvia build compilato
npm start

# Database
npx prisma generate       # Genera client Prisma
npx prisma db push        # Sincronizza schema con DB
npx prisma studio         # UI per esplorare DB
```

### Frontend (apps/web)

```bash
cd apps/web

# Sviluppo
npm run dev

# Build per produzione
npm run build

# Avvia build di produzione
npm start

# Lint
npm run lint
```

---

## Porte Utilizzate

| Servizio | Porta | URL |
|----------|-------|-----|
| **Frontend** | 3000 | http://localhost:3000 |
| **Backend API** | 3001 | http://localhost:3001 |

---

## Primo Accesso

1. Avvia backend e frontend
2. Apri http://localhost:3000
3. Verrai reindirizzato a `/auth/login`
4. Clicca su **"Registrati"** per creare un account
5. Dopo la registrazione, effettua il login

---

## Struttura API

### Endpoints Principali

```
POST   /auth/register          # Registrazione utente
POST   /auth/login             # Login (email + password)
GET    /auth/me                # Profilo utente autenticato

GET    /dashboard              # KPI e stato onboarding

POST   /user/credentials       # Aggiungi credenziale (API key)
GET    /user/credentials       # Lista credenziali
DELETE /user/credentials/:id   # Elimina credenziale

POST   /user/channels          # Aggiungi canale (Telegram/Discord)
GET    /user/channels          # Lista canali
DELETE /user/channels/:id      # Elimina canale

GET    /products               # Cerca prodotti/deal
POST   /links/generate         # Genera link affiliato
GET    /links/my               # I tuoi link

POST   /automations            # Crea regola automazione
GET    /automations            # Lista regole
PUT    /automations/:id        # Aggiorna regola
DELETE /automations/:id        # Elimina regola
POST   /automations/:id/execute # Esegui regola manualmente

POST   /track/r/:hash/clickout # Track click (pubblico)
POST   /track/conversion       # Track conversione (pubblico)
GET    /track/stats/:linkId    # Statistiche link
```

---

## Stack Tecnologico

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Fastify 4.26
- **Database:** SQLite + Prisma ORM
- **Auth:** JWT (@fastify/jwt)
- **Security:** bcryptjs, AES-256-GCM

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React

---

## Features Implementate

### FVD 1: Autenticazione & UI
- [x] Sistema registrazione/login
- [x] JWT authentication
- [x] Design system Cyber Intelligence
- [x] Componenti UI riusabili

### FVD 2: Credential Vault
- [x] CRUD credenziali con encryption AES-256
- [x] Supporto provider multipli (OpenAI, Anthropic, Telegram Bot)

### FVD 3: Deal Finder
- [x] Scoring engine multi-fattore
- [x] Integrazione Keepa (stub)
- [x] Filtri per categoria e prezzo

### FVD 4: Dashboard
- [x] KPI widget
- [x] Onboarding flow
- [x] Statistiche performance

### FVD 5: Automation Studio
- [x] CRUD regole automazione
- [x] Trigger configurabili (schedule, score, price drop)
- [x] A/B testing variants
- [x] Esecuzione manuale

### Tracking & Analytics
- [x] Click tracking GDPR-compliant
- [x] Conversion tracking
- [x] Link statistics

---

## Sviluppi Futuri

- [ ] Integrazione Keepa API reale
- [ ] Bot Telegram/Discord funzionanti
- [ ] Background job queue (BullMQ + Redis)
- [ ] Email notifications
- [ ] Migrazione a PostgreSQL
- [ ] Rate limiting & validazione input
- [ ] CI/CD pipeline
- [ ] Docker setup

---

## Troubleshooting

### Errore: "Cannot find module '@prisma/client'"

```bash
cd apps/api
npx prisma generate
```

### Errore: "JWT_SECRET is required"

Crea il file `.env` in `apps/api/` con le variabili necessarie.

### Porta 3000/3001 già in uso

Cambia la porta nel file `.env` (backend) o in `apps/web/package.json` (frontend):

```bash
# Frontend su porta 3002
npm run dev -- -p 3002
```

### Database locked

Se Prisma Studio è aperto, chiudilo prima di eseguire migrazioni.

---

## Supporto

Per domande o problemi, consulta:
- Documentazione in `DOCS/`
- Changelog in `DOCS/changelogs/`

---

## Licenza

Proprietario - Marco Contin

---

**Buon sviluppo! 🚀**
