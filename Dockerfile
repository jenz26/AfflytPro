# Multi-stage build for Afflyt API
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only API package files first (better caching)
COPY apps/api/package*.json ./
COPY apps/api/prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy API source code
COPY apps/api/src ./src
COPY apps/api/tsconfig.json ./

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start command - runs migrations then starts server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
