import type { PrismaClient } from '@prisma/client';
import { getRedis } from '../lib/redis';
import { KeepaClient } from '../services/keepa/KeepaClient';
import { KeepaTokenManager } from '../services/keepa/KeepaTokenManager';
import { KeepaQueue } from '../services/keepa/KeepaQueue';
import { KeepaCache } from '../services/keepa/KeepaCache';
import { KeepaPrefetch } from '../services/keepa/KeepaPrefetch';
import { DEFAULT_CONFIG, type QueueJob, type Deal } from '../types/keepa';
import { AMAZON_IT_CATEGORIES } from '../data/amazon-categories';

export class KeepaWorker {
  private prisma: PrismaClient;
  private client: KeepaClient;
  private tokenManager: KeepaTokenManager;
  private queue: KeepaQueue;
  private cache: KeepaCache;
  private prefetch: KeepaPrefetch;
  private running: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient) {
    const redis = getRedis();
    const config = DEFAULT_CONFIG;

    this.prisma = prisma;
    this.client = new KeepaClient(process.env.KEEPA_API_KEY || '', config);
    this.tokenManager = new KeepaTokenManager(redis, config);
    this.queue = new KeepaQueue(redis, config);
    this.cache = new KeepaCache(redis, config);
    this.prefetch = new KeepaPrefetch(
      redis, prisma, config,
      this.queue, this.cache, this.tokenManager
    );
  }

  start(): void {
    if (this.running) return;

    if (!process.env.KEEPA_API_KEY) {
      console.warn('[Worker] KEEPA_API_KEY not set, worker disabled');
      return;
    }

    this.running = true;
    console.log('[Worker] Starting Keepa worker...');

    // Tick ogni 3 secondi
    this.intervalId = setInterval(
      () => this.tick(),
      DEFAULT_CONFIG.WORKER_TICK_MS
    );

    // Prima tick immediata
    this.tick();
  }

  stop(): void {
    if (!this.running) return;

    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('[Worker] Stopped');
  }

  private async tick(): Promise<void> {
    try {
      // 1. Processa job dalla coda
      await this.processQueue();

      // 2. Se idle, prova prefetch
      await this.prefetch.runIfIdle();

      // 3. Aggiorna timestamp
      await getRedis().hset('keepa:stats', 'last_tick_at', Date.now().toString());

    } catch (error) {
      console.error('[Worker] Tick error:', error);
    }
  }

  private async processQueue(): Promise<void> {
    // Controlla token disponibili
    const tokens = await this.tokenManager.getAvailable();

    // Guarda il prossimo job senza rimuoverlo
    const nextJob = await this.queue.peek();
    if (!nextJob) return;

    // Abbastanza token?
    if (nextJob.tokenCost > tokens) {
      // Aspetta, ma non bloccare il loop
      return;
    }

    // Rimuovi dalla coda
    const job = await this.queue.dequeue();
    if (!job) return;

    // Esegui
    await this.executeJob(job);
  }

  private async executeJob(job: QueueJob): Promise<void> {
    console.log(`[Worker] Executing job ${job.id} for ${job.category}`);

    const startTime = Date.now();

    try {
      // Chiama Keepa
      const categoryId = this.getCategoryId(job.category);
      const result = await this.client.fetchDeals(categoryId);

      // Aggiorna token da response
      await this.tokenManager.updateFromResponse(
        result.tokensLeft,
        result.refillIn
      );

      // Consuma token
      await this.tokenManager.consume(job.tokenCost);

      // Salva in cache
      await this.cache.save(
        job.category,
        result.deals,
        job.isPrefetch ? 'prefetch' : 'automation'
      );

      // Notifica automazioni in attesa
      await this.notifyWaitingAutomations(job, result.deals);

      // Cleanup
      await this.queue.completeJob(job);

      // Log per analytics
      await this.logJobCompletion(job, result.deals.length, Date.now() - startTime);

      console.log(`[Worker] Job ${job.id} completed: ${result.deals.length} deals`);

    } catch (error: any) {
      console.error(`[Worker] Job ${job.id} failed:`, error.message);

      // Rimuovi comunque il pending
      await this.queue.completeJob(job);
    }
  }

  private async notifyWaitingAutomations(
    job: QueueJob,
    deals: Deal[]
  ): Promise<void> {

    for (const waiter of job.waitingAutomations) {
      try {
        // Applica filtri
        const filtered = this.cache.applyFilters(deals, waiter.filters);

        if (filtered.length === 0) {
          console.log(
            `[Worker] No deals match filters for automation ${waiter.automationId}`
          );
          continue;
        }

        // Seleziona i migliori
        const automation = await this.prisma.automation.findUnique({
          where: { id: waiter.automationId },
          include: { user: true }
        });

        if (!automation) continue;

        const maxDeals = 5; // Default
        const selected = this.cache.selectBest(filtered, maxDeals);

        // Pubblica
        await this.publishDeals(automation, selected);

        // Aggiorna nextRunAt
        await this.updateNextRun(automation);

      } catch (error) {
        console.error(
          `[Worker] Failed to notify automation ${waiter.automationId}:`,
          error
        );
      }
    }
  }

  private async publishDeals(
    automation: any,
    deals: Deal[]
  ): Promise<void> {
    // TODO: Integrare con RuleExecutor esistente per pubblicazione Telegram

    console.log(
      `[Worker] Publishing ${deals.length} deals for automation ${automation.id} (${automation.name})`
    );

    // Per ora logga soltanto - la pubblicazione verrà integrata col sistema esistente
    // if (automation.telegramChatId) {
    //   await telegramBot.sendDeals(automation.telegramChatId, deals);
    // }
  }

  private async updateNextRun(automation: any): Promise<void> {
    // Calcola prossima esecuzione basata su intervalMinutes
    const intervalMinutes = automation.intervalMinutes || 360; // Default 6 ore
    const nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000);

    await this.prisma.automation.update({
      where: { id: automation.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: nextRun
      }
    });
  }

  private async logJobCompletion(
    job: QueueJob,
    dealsCount: number,
    durationMs: number
  ): Promise<void> {
    try {
      await this.prisma.keepaTokenLog.create({
        data: {
          operation: job.type,
          tokenCost: job.tokenCost,
          category: job.category,
          jobId: job.id,
          success: true,
          responseTime: durationMs
        }
      });
    } catch (error) {
      // KeepaTokenLog model might not exist yet
      console.log(`[Worker] Job ${job.id} stats: ${dealsCount} deals, ${durationMs}ms`);
    }
  }

  private getCategoryId(categoryName: string): number {
    const category = AMAZON_IT_CATEGORIES.find(
      c => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    return category?.id || AMAZON_IT_CATEGORIES[0].id; // Default to first category
  }
}
