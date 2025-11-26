# Afflyt Pro - Claude Code Instructions

## Project Overview
Afflyt Pro is an affiliate marketing automation platform with:
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4
- **Backend**: Fastify API
- **Database**: PostgreSQL with Prisma ORM

## Key Directories
- `apps/web` - Next.js frontend
- `apps/api` - Fastify backend
- `packages/` - Shared packages

## Development Commands
```bash
# Run frontend
cd apps/web && npm run dev

# Run backend
cd apps/api && npm run dev

# Build
npm run build
```

## Notes
- Database is being migrated to EU (Netherlands) for GDPR compliance
- User authentication uses JWT + Magic Links via Resend
