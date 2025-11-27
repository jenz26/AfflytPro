import cron, { ScheduledTask } from 'node-cron';
import type { PrismaClient } from '@prisma/client';
import { getRedis } from '../../lib/redis';
import { KeepaQueue } from './KeepaQueue';
import { KeepaCache } from './KeepaCache';
import { DEFAULT_CONFIG, type UserPlan, type Deal } from '../../types/keepa';

/**
 * AutomationQueueScheduler
 *
 * Runs every minute to check for automations that need to trigger.
 * Works with the new Redis-based queue system.
 *
 * Flow:
 * 1. Find automations where nextRunAt <= now
 * 2. Group by category
 * 3. For each category:
 *    - If cache is fresh: publish immediately
 *    - If cache is stale/missing: queue a refresh job
 */
export class AutomationQueueScheduler {
  private prisma: PrismaClient;
  private queue: KeepaQueue;
  private cache: KeepaCache;
  private cronJob: ScheduledTask | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;

    const redis = getRedis();
    this.queue = new KeepaQueue(redis, DEFAULT_CONFIG);
    this.cache = new KeepaCache(redis, DEFAULT_CONFIG);
  }

  start(): void {
    // Esegui ogni minuto
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkDueAutomations();
    });

    console.log('[AutomationQueueScheduler] Started - checking automations every minute');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    console.log('[AutomationQueueScheduler] Stopped');
  }

  private async checkDueAutomations(): Promise<void> {
    const now = new Date();

    // Trova automazioni che devono triggerare
    const dueAutomations = await this.prisma.automation.findMany({
      where: {
        enabled: true,
        nextRunAt: { lte: now }
      },
      include: {
        user: {
          select: {
            id: true,
            plan: true
          }
        }
      }
    });

    if (dueAutomations.length === 0) {
      return;
    }

    console.log(`[AutomationQueueScheduler] Found ${dueAutomations.length} due automations`);

    // Raggruppa per categoria
    const byCategory = this.groupByCategory(dueAutomations);

    for (const [category, automations] of Object.entries(byCategory)) {
      await this.handleCategoryAutomations(category, automations);
    }
  }

  private groupByCategory(automations: any[]): Record<string, any[]> {
    return automations.reduce((acc, auto) => {
      // Get category from filters
      const filters = auto.filters as any;
      const category = filters?.categories?.[0] || 'Elettronica';

      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(auto);
      return acc;
    }, {} as Record<string, any[]>);
  }

  private async handleCategoryAutomations(
    category: string,
    automations: any[]
  ): Promise<void> {

    // Check cache
    const { status, data } = await this.cache.checkStatus(category);

    if (status === 'fresh' && data) {
      // Cache fresco! Pubblica subito per tutte le automazioni
      console.log(`[AutomationQueueScheduler] Cache HIT for ${category}, publishing immediately`);

      for (const automation of automations) {
        // Applica filtri e pubblica
        const filters = automation.filters as any;
        const filtered = this.cache.applyFilters(data.deals, filters);
        const selected = this.cache.selectBest(filtered, 5);

        if (selected.length > 0) {
          await this.publishDeals(automation, selected);
        }

        // Aggiorna nextRunAt
        await this.updateNextRun(automation);
      }

    } else {
      // Cache stale o mancante, accoda refresh
      console.log(`[AutomationQueueScheduler] Cache ${status} for ${category}, queuing refresh`);

      for (const automation of automations) {
        const filters = automation.filters as any;

        await this.queue.enqueueOrAttach(category, {
          id: automation.id,
          userId: automation.userId,
          userPlan: (automation.user.plan || 'free') as UserPlan,
          filters: filters,
          nextRunAt: automation.nextRunAt
        });
      }

      // Le automazioni verranno notificate quando il worker completa il job
    }
  }

  private async publishDeals(
    automation: any,
    deals: Deal[]
  ): Promise<void> {
    // TODO: Integrare con RuleExecutor esistente
    console.log(
      `[AutomationQueueScheduler] Would publish ${deals.length} deals ` +
      `for automation ${automation.id} (${automation.name})`
    );

    // Qui andrà la logica di pubblicazione su Telegram
    // Per ora solo log
  }

  private async updateNextRun(automation: any): Promise<void> {
    const intervalMinutes = automation.intervalMinutes || 360;
    const nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000);

    await this.prisma.automation.update({
      where: { id: automation.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: nextRun
      }
    });
  }
}
