import type Redis from 'ioredis';
import { randomUUID } from 'crypto';
import type {
  QueueJob,
  KeepaQueueConfig,
  QueueMetrics,
  UserPlan,
  WaitingRule,
  UnionFilters,
  AutomationFilters,
  DealPublishMode
} from '../../types/keepa';
import { KeepaClient } from './KeepaClient';

export class KeepaQueue {
  private redis: Redis;
  private config: KeepaQueueConfig;

  constructor(redis: Redis, config: KeepaQueueConfig) {
    this.redis = redis;
    this.config = config;
  }

  // ============================================
  // V2: ENQUEUE WITH WAITING RULES
  // ============================================

  /**
   * Enqueue a job for a category, or attach to existing job
   * @param categoryId Keepa category ID
   * @param category Category name
   * @param rule The automation rule to attach
   * @returns Job ID
   */
  async enqueueOrAttach(
    categoryId: number,
    category: string,
    rule: {
      ruleId: string;
      userId: string;
      userPlan: UserPlan;
      channelId: string | null;
      channelAmazonTag?: string;
      filters: AutomationFilters;
      dealsPerRun: number;
      minScore: number;
      dealPublishMode: DealPublishMode;
      includeKeepaChart: boolean;
      templateId?: string;
      nextRunAt: Date;
    }
  ): Promise<string> {
    // Check if there's an existing pending job for this category
    const existingJobId = await this.redis.get(`keepa:pending:${categoryId}`);

    if (existingJobId) {
      const attached = await this.attachToExisting(existingJobId, rule);
      if (attached) {
        return existingJobId;
      }
    }

    // Create new job
    return await this.createJob(categoryId, category, rule, false);
  }

  /**
   * Attach a rule to an existing job
   */
  private async attachToExisting(
    jobId: string,
    rule: {
      ruleId: string;
      userId: string;
      userPlan: UserPlan;
      channelId: string | null;
      channelAmazonTag?: string;
      filters: AutomationFilters;
      dealsPerRun: number;
      minScore: number;
      dealPublishMode: DealPublishMode;
      includeKeepaChart: boolean;
      templateId?: string;
      nextRunAt: Date;
    }
  ): Promise<boolean> {
    // Find the job in the queue
    const allJobs = await this.redis.zrange('keepa:queue', 0, -1, 'WITHSCORES');

    for (let i = 0; i < allJobs.length; i += 2) {
      const job: QueueJob = JSON.parse(allJobs[i]);

      if (job.id === jobId) {
        // Create waiting rule
        const waitingRule: WaitingRule = {
          ruleId: rule.ruleId,
          userId: rule.userId,
          userPlan: rule.userPlan,
          channelId: rule.channelId,
          channelAmazonTag: rule.channelAmazonTag,
          filters: rule.filters,
          dealsPerRun: rule.dealsPerRun,
          minScore: rule.minScore,
          dealPublishMode: rule.dealPublishMode,
          includeKeepaChart: rule.includeKeepaChart,
          templateId: rule.templateId,
          triggersAt: rule.nextRunAt
        };

        job.waitingRules.push(waitingRule);

        // If was prefetch, now becomes normal job
        if (job.isPrefetch) {
          job.isPrefetch = false;
          await this.redis.hincrby('keepa:stats:prefetch', 'converted', 1);
        }

        // Recalculate union filters
        job.unionFilters = this.calculateUnionFilters(job.waitingRules);

        // Recalculate priority
        job.priority = this.calculatePriority(job);

        // Update in Redis
        await this.redis.zrem('keepa:queue', allJobs[i]);
        await this.redis.zadd('keepa:queue', job.priority, JSON.stringify(job));

        console.log(`[Queue] Attached rule ${rule.ruleId} to job ${jobId} (${job.waitingRules.length} waiters)`);
        return true;
      }
    }

    return false;
  }

  /**
   * Create a new queue job
   */
  private async createJob(
    categoryId: number,
    category: string,
    rule: {
      ruleId: string;
      userId: string;
      userPlan: UserPlan;
      channelId: string | null;
      channelAmazonTag?: string;
      filters: AutomationFilters;
      dealsPerRun: number;
      minScore: number;
      dealPublishMode: DealPublishMode;
      includeKeepaChart: boolean;
      templateId?: string;
      nextRunAt: Date;
    },
    isPrefetch: boolean
  ): Promise<string> {
    const waitingRule: WaitingRule = {
      ruleId: rule.ruleId,
      userId: rule.userId,
      userPlan: rule.userPlan,
      channelId: rule.channelId,
      channelAmazonTag: rule.channelAmazonTag,
      filters: rule.filters,
      dealsPerRun: rule.dealsPerRun,
      minScore: rule.minScore,
      dealPublishMode: rule.dealPublishMode,
      includeKeepaChart: rule.includeKeepaChart,
      templateId: rule.templateId,
      triggersAt: rule.nextRunAt
    };

    const unionFilters = KeepaClient.calculateUnionFilters([rule.filters]);

    const job: QueueJob = {
      id: randomUUID(),
      type: 'deal_search',
      category,
      categoryId,
      tokenCost: this.config.PRICE_TYPES.length * this.config.DEAL_API_COST,
      createdAt: new Date(),
      unionFilters,
      waitingRules: [waitingRule],
      isPrefetch,
      priority: 0
    };

    job.priority = isPrefetch
      ? this.config.PREFETCH_PRIORITY
      : this.calculatePriority(job);

    await this.redis.zadd('keepa:queue', job.priority, JSON.stringify(job));
    await this.redis.set(`keepa:pending:${categoryId}`, job.id, 'EX', 300);

    console.log(`[Queue] Created ${isPrefetch ? 'prefetch ' : ''}job ${job.id} for ${category} (priority: ${job.priority})`);
    return job.id;
  }

  // ============================================
  // PREFETCH
  // ============================================

  async createPrefetchJob(
    categoryId: number,
    category: string,
    rules: Array<{
      ruleId: string;
      userId: string;
      userPlan: UserPlan;
      channelId: string | null;
      channelAmazonTag?: string;
      filters: AutomationFilters;
      dealsPerRun: number;
      minScore: number;
      dealPublishMode: DealPublishMode;
      includeKeepaChart: boolean;
      templateId?: string;
      nextRunAt: Date;
    }>
  ): Promise<string> {
    const waitingRules: WaitingRule[] = rules.map(r => ({
      ruleId: r.ruleId,
      userId: r.userId,
      userPlan: r.userPlan,
      channelId: r.channelId,
      channelAmazonTag: r.channelAmazonTag,
      filters: r.filters,
      dealsPerRun: r.dealsPerRun,
      minScore: r.minScore,
      dealPublishMode: r.dealPublishMode,
      includeKeepaChart: r.includeKeepaChart,
      templateId: r.templateId,
      triggersAt: r.nextRunAt
    }));

    const unionFilters = KeepaClient.calculateUnionFilters(
      rules.map(r => r.filters)
    );

    const job: QueueJob = {
      id: randomUUID(),
      type: 'deal_search',
      category,
      categoryId,
      tokenCost: this.config.PRICE_TYPES.length * this.config.DEAL_API_COST,
      createdAt: new Date(),
      unionFilters,
      waitingRules,
      isPrefetch: true,
      priority: this.config.PREFETCH_PRIORITY
    };

    await this.redis.zadd('keepa:queue', job.priority, JSON.stringify(job));
    await this.redis.set(`keepa:pending:${categoryId}`, job.id, 'EX', 1800);

    console.log(`[Queue] Created prefetch job ${job.id} for ${category}`);
    return job.id;
  }

  // ============================================
  // DEQUEUE
  // ============================================

  async dequeue(): Promise<QueueJob | null> {
    const result = await this.redis.zpopmin('keepa:queue');

    if (!result || result.length === 0) {
      return null;
    }

    const job = JSON.parse(result[0] as string);
    // Fix dates after JSON parse
    job.createdAt = new Date(job.createdAt);
    job.waitingRules = job.waitingRules?.map((w: any) => ({
      ...w,
      triggersAt: new Date(w.triggersAt)
    })) || [];

    return job;
  }

  async peek(): Promise<QueueJob | null> {
    const result = await this.redis.zrange('keepa:queue', 0, 0);

    if (!result || result.length === 0) {
      return null;
    }

    const job = JSON.parse(result[0]);
    job.createdAt = new Date(job.createdAt);
    job.waitingRules = job.waitingRules?.map((w: any) => ({
      ...w,
      triggersAt: new Date(w.triggersAt)
    })) || [];

    return job;
  }

  async requeue(job: QueueJob): Promise<void> {
    await this.redis.zadd('keepa:queue', job.priority, JSON.stringify(job));
  }

  // ============================================
  // CLEANUP
  // ============================================

  async completeJob(job: QueueJob): Promise<void> {
    await this.redis.del(`keepa:pending:${job.categoryId}`);
    await this.redis.hincrby('keepa:stats', 'jobs_processed', 1);

    if (job.isPrefetch) {
      await this.redis.hincrby('keepa:stats:prefetch', 'completed', 1);
    }
  }

  async hasPendingJob(categoryId: number): Promise<boolean> {
    const pending = await this.redis.get(`keepa:pending:${categoryId}`);
    return !!pending;
  }

  // ============================================
  // PRIORITY CALCULATION
  // ============================================

  private calculatePriority(job: QueueJob): number {
    if (job.isPrefetch) {
      return this.config.PREFETCH_PRIORITY;
    }

    const now = Date.now();

    // 1. URGENZA (0-30 punti, score basso = più urgente)
    const earliestTrigger = Math.min(
      ...job.waitingRules.map(r => new Date(r.triggersAt).getTime())
    );
    const minutesUntil = Math.max(0, (earliestTrigger - now) / 60000);
    const urgencyScore = Math.min(30, Math.floor(minutesUntil));

    // 2. VALORE CACHE (0-20 punti, più beneficiari = score più basso)
    const beneficiaries = job.waitingRules.length;
    const cacheValueScore = Math.max(0, 20 - (beneficiaries * 2));

    // 3. PIANO (0-10 punti)
    const planScores: Record<UserPlan, number> = {
      'business': 0,
      'pro': 3,
      'starter': 6,
      'free': 10
    };

    const bestPlan = job.waitingRules.reduce((best, r) => {
      return planScores[r.userPlan] < planScores[best] ? r.userPlan : best;
    }, 'free' as UserPlan);

    const planScore = planScores[bestPlan];

    return urgencyScore + cacheValueScore + planScore;
  }

  // ============================================
  // UNION FILTERS
  // ============================================

  private calculateUnionFilters(waitingRules: WaitingRule[]): UnionFilters {
    return KeepaClient.calculateUnionFilters(
      waitingRules.map(r => r.filters)
    );
  }

  // ============================================
  // METRICS
  // ============================================

  async getMetrics(): Promise<QueueMetrics> {
    const allJobs = await this.redis.zrange('keepa:queue', 0, -1, 'WITHSCORES');

    const jobs: Array<{ job: QueueJob; score: number }> = [];
    for (let i = 0; i < allJobs.length; i += 2) {
      jobs.push({
        job: JSON.parse(allJobs[i]),
        score: parseFloat(allJobs[i + 1])
      });
    }

    const now = Date.now();
    const ages = jobs.map(j =>
      (now - new Date(j.job.createdAt).getTime()) / 1000
    );

    return {
      queueDepth: jobs.length,
      oldestJobAge: ages.length > 0 ? Math.max(...ages) : 0,
      avgWaitTime: ages.length > 0
        ? ages.reduce((a, b) => a + b, 0) / ages.length
        : 0,
      jobsByPriority: {
        urgent: jobs.filter(j => j.score <= 20).length,
        normal: jobs.filter(j => j.score > 20 && j.score <= 50).length,
        low: jobs.filter(j => j.score > 50 && j.score < 100).length,
        prefetch: jobs.filter(j => j.score >= 100).length
      }
    };
  }

  async getDepth(): Promise<number> {
    return await this.redis.zcard('keepa:queue');
  }
}
