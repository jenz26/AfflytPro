# Afflyt Pro Documentation

## Overview

Afflyt Pro is an affiliate marketing automation platform that helps content creators and marketers automate deal discovery and publishing across multiple channels.

## Documentation Structure

```
docs/
├── architecture/      # System design, data models, implementation plans
├── api/              # API reference and integration guides
├── guides/           # How-to guides and tutorials
├── deployment/       # Deployment and infrastructure docs
├── changelog/        # Release notes and version history
├── ui/               # UI/UX specifications and designs
└── examples/         # Code examples and templates
```

## Quick Links

### Architecture
- [Design System](./architecture/DESIGN_SYSTEM.md) - UI component guidelines
- [Implementation Plan](./architecture/Implementation-Plan.md) - Development roadmap
- [Product Cache Strategy](./architecture/PRODUCT_CACHE_STRATEGY.md) - Caching architecture
- [Redirect System](./architecture/REDIRECT_SYSTEM.md) - Affiliate link handling

### Guides
- [Telegram Bot Integration](./guides/TELEGRAM_BOT_INTEGRATION.md) - Setup Telegram publishing

### Deployment
- [Deployment Guide](./deployment/DEPLOYMENT.md) - Production deployment

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Fastify, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Auth**: JWT + Magic Links (Resend)
- **Integrations**: Keepa API, Telegram Bot API

## Development

```bash
# Install dependencies
npm install

# Run frontend
cd apps/web && npm run dev

# Run backend
cd apps/api && npm run dev
```
