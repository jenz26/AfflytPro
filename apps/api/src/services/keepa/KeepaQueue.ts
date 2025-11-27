import type Redis from 'ioredis';
import { randomUUID } from 'crypto';
import type {
  QueueJob,
  KeepaQueueConfig,
  QueueMetrics,
  UserPlan
} from '../../types/keepa';

export class KeepaQueue {
  private redis: Redis;
  private config: KeepaQueueConfig;

  constructor(redis: Redis, config: KeepaQueueConfig) {
    this.redis = redis;
    this.config = config;
  }

  // ============================================
  // ENQUEUE / ATTACH
  // ============================================

  async enqueueOrAttach(
    category: string,
    automation: {
      id: string;
      userId: string;
      userPlan: UserPlan;
      filters: any;
      nextRunAt: Date;
    }
  ): Promise<string> {
    // Check se esiste già un job pending per questa categoria
    const existingJobId = await this.redis.get(`keepa:pending:${category}`);

    if (existingJobId) {
      const attached = await this.attachToExisting(existingJobId, automation);
      if (attached) {
        return existingJobId;
      }
    }

    // Crea nuovo job
    return await this.createJob(category, automation, false);
  }

  private async attachToExisting(
    jobId: string,
    automation: {
      id: string;
      userId: string;
      userPlan: UserPlan;
      filters: any;
      nextRunAt: Date;
    }
  ): Promise<boolean> {
    // Trova il job nella coda
    const allJobs = await this.redis.zrange('keepa:queue', 0, -1, 'WITHSCORES');

    for (let i = 0; i < allJobs.length; i += 2) {
      const job: QueueJob = JSON.parse(allJobs[i]);

      if (job.id === jobId) {
        // Aggiungi automazione ai waiters
        job.waitingAutomations.push({
          automationId: automation.id,
          userId: automation.userId,
          userPlan: automation.userPlan,
          filters: automation.filters,
          triggersAt: automation.nextRunAt
        });

        // Se era prefetch, ora diventa job normale
        if (job.isPrefetch) {
          job.isPrefetch = false;
          await this.redis.hincrby('keepa:stats:prefetch', 'converted', 1);
        }

        // Ricalcola priorità
        job.priority = this.calculatePriority(job);

        // Aggiorna in Redis
        await this.redis.zrem('keepa:queue', allJobs[i]);
        await this.redis.zadd('keepa:queue', job.priority, JSON.stringify(job));

        console.log(`[Queue] Attached automation ${automation.id} to job ${jobId} (${job.waitingAutomations.length} waiters)`);
        return true;
      }
    }

    return false;
  }

  private async createJob(
    category: string,
    automation: {
      id: string;
      userId: string;
      userPlan: UserPlan;
      filters: any;
      nextRunAt: Date;
    },
    isPrefetch: boolean
  ): Promise<string> {
    const job: QueueJob = {
      id: randomUUID(),
      type: 'deal_search',
      category,
      tokenCost: this.config.DEAL_API_COST,
      createdAt: new Date(),
      waitingAutomations: [{
        automationId: automation.id,
        userId: automation.userId,
        userPlan: automation.userPlan,
        filters: automation.filters,
        triggersAt: automation.nextRunAt
      }],
      isPrefetch,
      priority: 0
    };

    job.priority = isPrefetch
      ? this.config.PREFETCH_PRIORITY
      : this.calculatePriority(job);

    await this.redis.zadd('keepa:queue', job.priority, JSON.stringify(job));
    await this.redis.set(`keepa:pending:${category}`, job.id, 'EX', 300);

    console.log(`[Queue] Created ${isPrefetch ? 'prefetch ' : ''}job ${job.id} for ${category} (priority: ${job.priority})`);
    return job.id;
  }

  // ============================================
  // PREFETCH
  // ============================================

  async createPrefetchJob(
    category: string,
    automations: Array<{
      id: string;
      userId: string;
      userPlan: UserPlan;
      filters: any;
      nextRunAt: Date;
    }>
  ): Promise<string> {
    const job: QueueJob = {
      id: randomUUID(),
      type: 'deal_search',
      category,
      tokenCost: this.config.DEAL_API_COST,
      createdAt: new Date(),
      waitingAutomations: automations.map(a => ({
        automationId: a.id,
        userId: a.userId,
        userPlan: a.userPlan,
        filters: a.filters,
        triggersAt: a.nextRunAt
      })),
      isPrefetch: true,
      priority: this.config.PREFETCH_PRIORITY
    };

    await this.redis.zadd('keepa:queue', job.priority, JSON.stringify(job));
    await this.redis.set(`keepa:pending:${category}`, job.id, 'EX', 1800);

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
    job.waitingAutomations = job.waitingAutomations.map((w: any) => ({
      ...w,
      triggersAt: new Date(w.triggersAt)
    }));

    return job;
  }

  async peek(): Promise<QueueJob | null> {
    const result = await this.redis.zrange('keepa:queue', 0, 0);

    if (!result || result.length === 0) {
      return null;
    }

    const job = JSON.parse(result[0]);
    job.createdAt = new Date(job.createdAt);
    job.waitingAutomations = job.waitingAutomations.map((w: any) => ({
      ...w,
      triggersAt: new Date(w.triggersAt)
    }));

    return job;
  }

  async requeue(job: QueueJob): Promise<void> {
    await this.redis.zadd('keepa:queue', job.priority, JSON.stringify(job));
  }

  // ============================================
  // CLEANUP
  // ============================================

  async completeJob(job: QueueJob): Promise<void> {
    await this.redis.del(`keepa:pending:${job.category}`);
    await this.redis.hincrby('keepa:stats', 'jobs_processed', 1);

    if (job.isPrefetch) {
      await this.redis.hincrby('keepa:stats:prefetch', 'completed', 1);
    }
  }

  async hasPendingJob(category: string): Promise<boolean> {
    const pending = await this.redis.get(`keepa:pending:${category}`);
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
      ...job.waitingAutomations.map(a => new Date(a.triggersAt).getTime())
    );
    const minutesUntil = Math.max(0, (earliestTrigger - now) / 60000);
    const urgencyScore = Math.min(30, Math.floor(minutesUntil));

    // 2. VALORE CACHE (0-20 punti, più beneficiari = score più basso)
    const beneficiaries = job.waitingAutomations.length;
    const cacheValueScore = Math.max(0, 20 - (beneficiaries * 2));

    // 3. PIANO (0-10 punti)
    const planScores: Record<UserPlan, number> = {
      'business': 0,
      'pro': 3,
      'starter': 6,
      'free': 10
    };

    const bestPlan = job.waitingAutomations.reduce((best, a) => {
      return planScores[a.userPlan] < planScores[best] ? a.userPlan : best;
    }, 'free' as UserPlan);

    const planScore = planScores[bestPlan];

    return urgencyScore + cacheValueScore + planScore;
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
