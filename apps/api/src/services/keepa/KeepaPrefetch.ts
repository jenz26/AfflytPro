import type Redis from 'ioredis';
import type { PrismaClient, AutomationRule, Channel, User, PlanType } from '@prisma/client';
import type {
  KeepaQueueConfig,
  UserPlan,
  AutomationFilters,
  DealPublishMode
} from '../../types/keepa';
import { KeepaQueue } from './KeepaQueue';
import { KeepaCache } from './KeepaCache';
import { KeepaTokenManager } from './KeepaTokenManager';
import { AMAZON_IT_CATEGORIES } from '../../data/amazon-categories';

type RuleWithRelations = AutomationRule & {
  user: Pick<User, 'id' | 'plan'>;
  channel: Channel | null;
};

/**
 * KeepaPrefetch v2
 *
 * Runs during idle time to prefetch data for upcoming automations.
 * Uses the new WaitingRule system.
 *
 * Idle detection:
 * - Queue is empty
 * - Enough tokens available
 *
 * Prefetch candidates:
 * - Rules with nextRunAt in the next PREFETCH_LOOKAHEAD_MINUTES
 * - Categories not already cached or pending
 */
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
    tokenManager: KeepaTokenManager
  ) {
    this.redis = redis;
    this.prisma = prisma;
    this.config = config;
    this.queue = new KeepaQueue(redis, config);
    this.cache = new KeepaCache(redis, config);
    this.tokenManager = tokenManager;
  }

  /**
   * Run prefetch if system is idle
   * Call this from the worker tick when appropriate
   */
  async runIfIdle(): Promise<void> {
    // 1. Check if queue is empty
    const queueDepth = await this.queue.getDepth();
    if (queueDepth > 0) {
      return; // Queue has work to do
    }

    // 2. Check token availability
    const tokensAvailable = await this.tokenManager.getAvailable();
    const minTokensNeeded = this.config.PRICE_TYPES.length * this.config.DEAL_API_COST;
    if (tokensAvailable < minTokensNeeded) {
      return; // Not enough tokens
    }

    // 3. Find upcoming rules
    const lookaheadEnd = new Date(
      Date.now() + this.config.PREFETCH_LOOKAHEAD_MINUTES * 60 * 1000
    );

    const upcomingRules = await this.prisma.automationRule.findMany({
      where: {
        isActive: true,
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
        },
        channel: true
      },
      orderBy: {
        nextRunAt: 'asc'
      }
    });

    if (upcomingRules.length === 0) {
      return; // No upcoming rules
    }

    // 4. Group by category
    const byCategory = this.groupByCategory(upcomingRules as RuleWithRelations[]);

    // 5. Create prefetch jobs (limited per tick)
    let prefetchCreated = 0;

    for (const [categoryIdStr, rules] of Object.entries(byCategory)) {
      if (prefetchCreated >= this.config.MAX_PREFETCH_PER_TICK) {
        break;
      }

      const categoryId = parseInt(categoryIdStr, 10);
      const categoryInfo = AMAZON_IT_CATEGORIES.find(c => c.id === categoryId);
      const categoryName = categoryInfo?.name || `Category-${categoryId}`;

      // Skip if cache is fresh
      if (await this.cache.isFresh(categoryName)) {
        continue;
      }

      // Skip if job already pending
      if (await this.queue.hasPendingJob(categoryId)) {
        continue;
      }

      // Create prefetch job
      await this.createPrefetchJob(categoryId, categoryName, rules);
      prefetchCreated++;

      await this.redis.hincrby('keepa:stats:prefetch', 'created', 1);

      console.log(
        `[Prefetch] Created job for ${categoryName}, ` +
        `${rules.length} rules due in next ${this.config.PREFETCH_LOOKAHEAD_MINUTES}min`
      );
    }
  }

  /**
   * Group rules by primary category
   */
  private groupByCategory(rules: RuleWithRelations[]): Record<string, RuleWithRelations[]> {
    return rules.reduce((acc, rule) => {
      const categoryId = rule.categories?.[0];
      if (!categoryId) {
        return acc;
      }

      const key = categoryId.toString();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(rule);
      return acc;
    }, {} as Record<string, RuleWithRelations[]>);
  }

  /**
   * Create a prefetch job for a category
   */
  private async createPrefetchJob(
    categoryId: number,
    categoryName: string,
    rules: RuleWithRelations[]
  ): Promise<string> {
    const formattedRules = rules.map(rule => {
      // Build filters from rule
      const filters: AutomationFilters = {
        categories: rule.categories,
        minScore: rule.minScore,
        minDiscount: rule.minDiscount ?? undefined,
        minPrice: rule.minPrice ?? undefined,
        maxPrice: rule.maxPrice ?? undefined,
        minRating: rule.minRating ?? undefined,
        minReviews: rule.minReviews ?? undefined,
        maxSalesRank: rule.maxSalesRank ?? undefined,
        amazonOnly: rule.amazonOnly || undefined,
        fbaOnly: rule.fbaOnly || undefined,
        hasCoupon: rule.hasCoupon || undefined,
        primeOnly: rule.primeOnly || undefined,
        brandInclude: rule.brandInclude.length > 0 ? rule.brandInclude : undefined,
        brandExclude: rule.brandExclude.length > 0 ? rule.brandExclude : undefined,
        listedAfter: rule.listedAfter ?? undefined
      };

      return {
        ruleId: rule.id,
        userId: rule.userId,
        userPlan: this.mapPlanType(rule.user.plan),
        channelId: rule.channelId,
        channelAmazonTag: (rule.channel as any)?.amazonTag ?? undefined,
        filters,
        dealsPerRun: rule.dealsPerRun,
        minScore: rule.minScore,
        dealPublishMode: rule.dealPublishMode as DealPublishMode,
        includeKeepaChart: rule.includeKeepaChart,
        templateId: rule.templateId ?? undefined,
        nextRunAt: rule.nextRunAt ?? new Date()
      };
    });

    return await this.queue.createPrefetchJob(categoryId, categoryName, formattedRules);
  }

  /**
   * Map Prisma PlanType to our UserPlan type
   */
  private mapPlanType(plan: PlanType): UserPlan {
    switch (plan) {
      case 'BUSINESS':
        return 'business';
      case 'PRO':
        return 'pro';
      case 'FREE':
      default:
        return 'free';
    }
  }

  /**
   * Get prefetch stats
   */
  async getStats(): Promise<{
    created: number;
    converted: number;
    completed: number;
  }> {
    const stats = await this.redis.hgetall('keepa:stats:prefetch');
    return {
      created: parseInt(stats?.created || '0', 10),
      converted: parseInt(stats?.converted || '0', 10),
      completed: parseInt(stats?.completed || '0', 10)
    };
  }
}
