# Afflyt Pro - Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Next.js Frontend                         │    │
│  │                 apps/web                                 │    │
│  │                 Region: fra1 (Frankfurt)                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS API calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Railway                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Fastify Backend                          │    │
│  │                 apps/api                                 │    │
│  │                 Port: 3001                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ Internal connection (~1-5ms)      │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 PostgreSQL Database                      │    │
│  │                 Railway Postgres Plugin                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- [Vercel Account](https://vercel.com)
- [Railway Account](https://railway.app)
- [Resend Account](https://resend.com) - for transactional emails
- Domain verified in Resend (for production emails)

---

## Step 1: Railway Setup (Backend + Database)

### 1.1 Create New Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account if needed
5. Select the `AfflytPro` repository

### 1.2 Configure Backend Service

1. Railway will detect the monorepo - select **"apps/api"** as the root directory
2. Or configure manually:
   - **Root Directory:** `apps/api`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npx prisma migrate deploy && node dist/app.js`

### 1.3 Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "Add PostgreSQL"**
3. Railway will automatically provision the database
4. The `DATABASE_URL` will be automatically available to your backend service

### 1.4 Configure Environment Variables

In Railway, go to your backend service → **Variables** and add:

```env
# Required
JWT_SECRET=<generate with: openssl rand -hex 32>
ENCRYPTION_SECRET=<generate with: openssl rand -hex 16>
NODE_ENV=production

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@afflyt.io
FROM_NAME=Afflyt Pro

# URLs
APP_URL=https://afflyt.io

# CORS (your Vercel domain)
CORS_ORIGINS=https://afflyt.io,https://www.afflyt.io

# Keepa API (if using)
KEEPA_API_KEY=<your-keepa-key>
KEEPA_DOMAIN=IT
```

> **Note:** `DATABASE_URL` is automatically injected by Railway when you link the PostgreSQL database.

### 1.5 Link Database to Backend

1. Click on your backend service
2. Go to **"Variables"**
3. Click **"+ New Variable"** → **"Add Reference"**
4. Select your PostgreSQL database
5. Choose `DATABASE_URL`

### 1.6 Generate Domain

1. Click on your backend service
2. Go to **"Settings"** → **"Networking"**
3. Click **"Generate Domain"**
4. Note your Railway URL (e.g., `afflyt-api.up.railway.app`)

---

## Step 2: Vercel Setup (Frontend)

### 2.1 Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`

### 2.2 Configure Environment Variables

Add these environment variables in Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.up.railway.app
```

### 2.3 Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend

### 2.4 Configure Custom Domain (Optional)

1. Go to your project → **"Settings"** → **"Domains"**
2. Add your domain (e.g., `afflyt.io`)
3. Follow DNS configuration instructions

---

## Step 3: Post-Deployment

### 3.1 Run Database Migrations

Railway automatically runs migrations on deploy (configured in `railway.toml`).

To run manually:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

### 3.2 Verify Deployment

1. **Backend Health:** Visit `https://your-railway-url.up.railway.app/health`
   - Should return: `{"status":"ok"}`

2. **Frontend:** Visit your Vercel URL
   - Auth pages should load correctly
   - API calls should work

### 3.3 Update CORS Origins

After getting your production URLs, update Railway environment variables:

```env
CORS_ORIGINS=https://afflyt.io,https://www.afflyt.io,https://your-vercel-url.vercel.app
```

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (auto-injected by Railway) |
| `JWT_SECRET` | Yes | Min 32 chars, for JWT signing |
| `ENCRYPTION_SECRET` | Yes | 32 bytes hex, for credential encryption |
| `NODE_ENV` | Yes | Set to `production` |
| `RESEND_API_KEY` | Yes | Resend API key for emails |
| `FROM_EMAIL` | Yes | Sender email (verified domain) |
| `FROM_NAME` | No | Sender name (default: Afflyt Pro) |
| `APP_URL` | Yes | Frontend URL for email links |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |
| `KEEPA_API_KEY` | No | Keepa API key for product data |
| `KEEPA_DOMAIN` | No | Keepa domain (default: IT) |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if DATABASE_URL is set correctly
railway run printenv | grep DATABASE_URL

# Test database connection
railway run npx prisma db pull
```

### Migration Errors

```bash
# Reset migrations (WARNING: destroys data)
railway run npx prisma migrate reset

# Generate new migration
railway run npx prisma migrate dev --name init
```

### CORS Errors

1. Verify `CORS_ORIGINS` includes your frontend domain
2. Check for trailing slashes (don't include them)
3. Include both `www` and non-`www` versions

### Build Failures

**Backend:**
- Check `apps/api/package.json` has all dependencies
- Verify TypeScript compiles: `npm run build`

**Frontend:**
- Check for missing environment variables
- Verify `NEXT_PUBLIC_API_URL` is set

---

## Local Development

### Start PostgreSQL (Docker)

```bash
docker run --name afflyt-postgres \
  -e POSTGRES_USER=afflyt \
  -e POSTGRES_PASSWORD=afflyt \
  -e POSTGRES_DB=afflyt \
  -p 5432:5432 \
  -d postgres:15
```

### Configure Local Environment

```bash
# apps/api/.env
DATABASE_URL="postgresql://afflyt:afflyt@localhost:5432/afflyt?schema=public"
JWT_SECRET=dev-secret-key-min-32-characters-long
ENCRYPTION_SECRET=dev-encryption-secret-32bytes
RESEND_API_KEY=re_test_xxxx
FROM_EMAIL=onboarding@resend.dev
APP_URL=http://localhost:3000
```

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Run Development Servers

```bash
# Terminal 1 - Backend
cd apps/api
npm install
npx prisma migrate dev
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm install
npm run dev
```

---

## Security Checklist

- [ ] JWT_SECRET is unique and >= 32 characters
- [ ] ENCRYPTION_SECRET is unique
- [ ] CORS_ORIGINS only includes trusted domains
- [ ] FROM_EMAIL uses verified domain (not @resend.dev in production)
- [ ] All environment variables are set in production
- [ ] HTTPS is enforced (automatic with Vercel/Railway)
- [ ] Database is only accessible from Railway internal network
