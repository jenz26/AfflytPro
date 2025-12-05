import cron, { ScheduledTask } from 'node-cron';
import type { PrismaClient, AutomationRule, Channel, User, PlanType } from '@prisma/client';
import type Redis from 'ioredis';
import type {
  KeepaQueueConfig,
  UserPlan,
  Deal,
  AutomationFilters,
  DealPublishMode
} from '../../types/keepa';
import { KeepaQueue } from './KeepaQueue';
import { KeepaCache } from './KeepaCache';
import { AMAZON_IT_CATEGORIES, getCategoryByName } from '../../data/amazon-categories';
import { captureException, addBreadcrumb } from '../../lib/sentry';

type RuleWithRelations = AutomationRule & {
  user: Pick<User, 'id' | 'plan'>;
  channel: Channel | null;
};

/**
 * AutomationScheduler v2
 *
 * Runs every minute to check for AutomationRules that need to trigger.
 * Uses the new WaitingRule system with proper categoryId handling.
 *
 * Flow:
 * 1. Find AutomationRules where nextRunAt <= now AND isActive
 * 2. Group by category
 * 3. For each category:
 *    - If cache is fresh: Worker will publish immediately (already processed)
 *    - If cache is stale/missing: enqueue a job with all waiting rules
 */
export class AutomationScheduler {
  private prisma: PrismaClient;
  private redis: Redis;
  private config: KeepaQueueConfig;
  private queue: KeepaQueue;
  private cache: KeepaCache;
  private cronJob: ScheduledTask | null = null;

  constructor(prisma: PrismaClient, redis: Redis, config: KeepaQueueConfig) {
    this.prisma = prisma;
    this.redis = redis;
    this.config = config;
    this.queue = new KeepaQueue(redis, config);
    this.cache = new KeepaCache(redis, config);
  }

  start(): void {
    // Run every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkDueRules();
    });

    console.log('[AutomationScheduler] Started - checking rules every minute');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    console.log('[AutomationScheduler] Stopped');
  }

  /**
   * Check for rules that need to be executed
   */
  private async checkDueRules(): Promise<void> {
    const now = new Date();

    try {
      // Find rules that are due
      const dueRules = await this.prisma.automationRule.findMany({
        where: {
          isActive: true,
          nextRunAt: { lte: now }
        },
        include: {
          user: {
            select: {
              id: true,
              plan: true
            }
          },
          channel: true
        }
      });

      if (dueRules.length === 0) {
        return;
      }

      console.log(`[AutomationScheduler] Found ${dueRules.length} due rules`);

      // Group by primary category
      const byCategory = this.groupByCategory(dueRules);

      // Process each category group
      for (const [categoryKey, rules] of Object.entries(byCategory)) {
        await this.handleCategoryRules(categoryKey, rules);
      }
    } catch (error) {
      console.error('[AutomationScheduler] Error checking due rules:', error);

      // Sentry: Capture scheduler errors
      captureException(error as Error, {
        component: 'AutomationScheduler',
        operation: 'checkDueRules'
      });
    }
  }

  /**
   * Group rules by their primary category
   */
  private groupByCategory(rules: RuleWithRelations[]): Record<string, RuleWithRelations[]> {
    return rules.reduce((acc, rule) => {
      // Get the first category from the rule
      const categoryValue = rule.categories?.[0];
      if (!categoryValue) {
        console.warn(`[AutomationScheduler] Rule ${rule.id} has no categories, skipping`);
        return acc;
      }

      // Resolve category ID - could be a name (string) or already an ID (number as string)
      const categoryId = this.resolveCategoryId(categoryValue);
      if (!categoryId) {
        console.warn(`[AutomationScheduler] Rule ${rule.id} has invalid category "${categoryValue}", skipping`);
        return acc;
      }

      // Use categoryId as key
      const key = categoryId.toString();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(rule);
      return acc;
    }, {} as Record<string, RuleWithRelations[]>);
  }

  /**
   * Resolve a category value to its numeric ID
   * Handles both category names (e.g., "Electronics") and numeric IDs
   */
  private resolveCategoryId(categoryValue: string): number | null {
    // First, try to parse as a number (already an ID)
    const asNumber = parseInt(categoryValue, 10);
    if (!isNaN(asNumber) && asNumber > 0) {
      // Verify it's a valid category ID
      const exists = AMAZON_IT_CATEGORIES.some(c => c.id === asNumber);
      if (exists) {
        return asNumber;
      }
    }

    // Otherwise, look up by name (supports both Italian and English names)
    const category = getCategoryByName(categoryValue);
    if (category) {
      return category.id;
    }

    return null;
  }

  /**
   * Handle all rules for a specific category
   */
  private async handleCategoryRules(
    categoryIdStr: string,
    rules: RuleWithRelations[]
  ): Promise<void> {
    const categoryId = parseInt(categoryIdStr, 10);
    const categoryInfo = AMAZON_IT_CATEGORIES.find(c => c.id === categoryId);
    const categoryName = categoryInfo?.name || `Category-${categoryId}`;

    console.log(`[AutomationScheduler] Processing ${rules.length} rules for ${categoryName}`);

    // FASE 5.4: Check if cache is fresh - if so, deals are ready to publish immediately
    const { status: cacheStatus } = await this.cache.checkStatus(categoryName);

    if (cacheStatus === 'fresh') {
      // Cache is fresh - the Worker will handle publishing from cache without API call
      console.log(`[AutomationScheduler] Cache is fresh for ${categoryName}, enqueueing for immediate publish`);
    } else {
      console.log(`[AutomationScheduler] Cache is ${cacheStatus} for ${categoryName}, will fetch from Keepa`);
    }

    // Check if there's already a pending job
    const hasPending = await this.queue.hasPendingJob(categoryId);
    if (hasPending) {
      console.log(`[AutomationScheduler] Job already pending for ${categoryName}, attaching rules`);
    }

    // Sentry: Track category batch processing
    addBreadcrumb(`Processing ${rules.length} rules for ${categoryName}`, 'scheduler.batch', {
      categoryId,
      categoryName,
      rulesCount: rules.length,
      cacheStatus,
      ruleIds: rules.map(r => r.id)
    });

    // Enqueue or attach each rule
    for (const rule of rules) {
      try {
        await this.enqueueRule(categoryId, categoryName, rule);
      } catch (error) {
        console.error(`[AutomationScheduler] Error enqueueing rule ${rule.id}:`, error);

        // Sentry: Capture rule enqueue error
        captureException(error as Error, {
          ruleId: rule.id,
          ruleName: rule.name,
          categoryId,
          categoryName,
          component: 'AutomationScheduler',
          operation: 'enqueueRule'
        });
      }
    }
  }

  /**
   * Enqueue a single rule
   */
  private async enqueueRule(
    categoryId: number,
    categoryName: string,
    rule: RuleWithRelations
  ): Promise<void> {
    // Map Prisma PlanType to our UserPlan type
    const userPlan = this.mapPlanType(rule.user.plan);

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

    // Enqueue or attach to existing job
    await this.queue.enqueueOrAttach(categoryId, categoryName, {
      ruleId: rule.id,
      userId: rule.userId,
      userPlan,
      channelId: rule.channelId,
      channelAmazonTag: (rule.channel as any)?.amazonTag ?? undefined,
      filters,
      dealsPerRun: rule.dealsPerRun,
      minScore: rule.minScore,
      dealPublishMode: rule.dealPublishMode as DealPublishMode,
      showKeepaButton: rule.showKeepaButton,
      templateId: rule.templateId ?? undefined,
      nextRunAt: rule.nextRunAt ?? new Date()
    });

    console.log(`[AutomationScheduler] Enqueued rule ${rule.id} (${rule.name}) for ${categoryName}`);
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
   * Force trigger a specific rule (for testing)
   */
  async triggerRule(ruleId: string): Promise<void> {
    const rule = await this.prisma.automationRule.findUnique({
      where: { id: ruleId },
      include: {
        user: {
          select: {
            id: true,
            plan: true
          }
        },
        channel: true
      }
    });

    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const categoryValue = rule.categories[0];
    if (!categoryValue) {
      throw new Error(`Rule ${ruleId} has no categories`);
    }

    const categoryId = this.resolveCategoryId(categoryValue);
    if (!categoryId) {
      throw new Error(`Rule ${ruleId} has invalid category "${categoryValue}"`);
    }

    const categoryInfo = AMAZON_IT_CATEGORIES.find(c => c.id === categoryId);
    const categoryName = categoryInfo?.name || `Category-${categoryId}`;

    await this.enqueueRule(categoryId, categoryName, rule as RuleWithRelations);
    console.log(`[AutomationScheduler] Force triggered rule ${ruleId}`);
  }
}
