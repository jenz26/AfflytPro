import type Redis from 'ioredis';
import type { PrismaClient } from '@prisma/client';
import type { KeepaQueueConfig, UserPlan } from '../../types/keepa';
import { KeepaQueue } from './KeepaQueue';
import { KeepaCache } from './KeepaCache';
import { KeepaTokenManager } from './KeepaTokenManager';

export class KeepaPrefetch {
  private redis: Redis;
  private prisma: PrismaClient;
  private config: KeepaQueueConfig;
  private queue: KeepaQueue;
  private cache: KeepaCache;
  private tokenManager: KeepaTokenManager;

  constructor(
    redis: Redis,
    prisma: PrismaClient,
    config: KeepaQueueConfig,
    queue: KeepaQueue,
    cache: KeepaCache,
    tokenManager: KeepaTokenManager
  ) {
    this.redis = redis;
    this.prisma = prisma;
    this.config = config;
    this.queue = queue;
    this.cache = cache;
    this.tokenManager = tokenManager;
  }

  async runIfIdle(): Promise<void> {
    // 1. Controlla se la coda è vuota
    const queueDepth = await this.queue.getDepth();
    if (queueDepth > 0) {
      return; // C'è lavoro urgente
    }

    // 2. Controlla token disponibili
    const tokens = await this.tokenManager.getAvailable();
    if (tokens < this.config.DEAL_API_COST) {
      return; // Non abbastanza token
    }

    // 3. Trova automazioni che triggerano presto
    const lookaheadEnd = new Date(
      Date.now() + this.config.PREFETCH_LOOKAHEAD_MINUTES * 60 * 1000
    );

    const upcomingAutomations = await this.prisma.automation.findMany({
      where: {
        enabled: true,
        nextRunAt: {
          gt: new Date(),
          lte: lookaheadEnd
        }
      },
      include: {
        user: {
          select: {
            id: true,
            plan: true
          }
        }
      },
      orderBy: {
        nextRunAt: 'asc'
      }
    });

    if (upcomingAutomations.length === 0) {
      return;
    }

    // 4. Raggruppa per categoria
    const byCategory = this.groupBy(upcomingAutomations, a => {
      // Get category from filters
      const filters = a.filters as any;
      return filters?.categories?.[0] || 'Elettronica'; // Default category
    });

    // 5. Crea prefetch jobs
    let prefetchCreated = 0;

    for (const [category, automations] of Object.entries(byCategory)) {
      if (prefetchCreated >= this.config.MAX_PREFETCH_PER_TICK) {
        break;
      }

      // Cache già fresca?
      if (await this.cache.isFresh(category)) {
        continue;
      }

      // Job già pending?
      if (await this.queue.hasPendingJob(category)) {
        continue;
      }

      // Crea prefetch job
      const formattedAutomations = automations.map(a => ({
        id: a.id,
        userId: a.userId,
        userPlan: (a.user.plan || 'free') as UserPlan,
        filters: a.filters as any,
        nextRunAt: a.nextRunAt
      }));

      await this.queue.createPrefetchJob(category, formattedAutomations);
      await this.redis.hincrby('keepa:stats:prefetch', 'created', 1);

      prefetchCreated++;

      console.log(
        `[Prefetch] Created job for ${category}, ` +
        `${automations.length} automations due in next ` +
        `${this.config.PREFETCH_LOOKAHEAD_MINUTES}min`
      );
    }
  }

  private groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return arr.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }
}
