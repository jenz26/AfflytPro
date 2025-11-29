import type Redis from 'ioredis';
import type { PrismaClient } from '@prisma/client';
import type {
  QueueJob,
  KeepaQueueConfig,
  Deal,
  ScoredDeal,
  WaitingRule,
  DealPublishMode
} from '../../types/keepa';
import { resolveAmazonTag } from '../../types/keepa';
import { KeepaClient } from './KeepaClient';
import { KeepaQueue } from './KeepaQueue';
import { KeepaCache } from './KeepaCache';
import { KeepaTokenManager } from './KeepaTokenManager';
import { ScoringEngine } from '../ScoringEngine';
import { TelegramBotService } from '../TelegramBotService';
import { SecurityService } from '../SecurityService';

const DEFAULT_AMAZON_TAG = 'afflyt-21';

export class KeepaWorker {
  private redis: Redis;
  private prisma: PrismaClient;
  private config: KeepaQueueConfig;
  private keepaClient: KeepaClient;
  private queue: KeepaQueue;
  private cache: KeepaCache;
  private tokenManager: KeepaTokenManager;
  private scoringEngine: ScoringEngine;
  private securityService: SecurityService;

  private isRunning = false;
  private tickInterval: NodeJS.Timeout | null = null;

  constructor(
    redis: Redis,
    prisma: PrismaClient,
    config: KeepaQueueConfig,
    keepaApiKey: string
  ) {
    this.redis = redis;
    this.prisma = prisma;
    this.config = config;
    this.keepaClient = new KeepaClient(keepaApiKey, config);
    this.queue = new KeepaQueue(redis, config);
    this.cache = new KeepaCache(redis, config);
    this.tokenManager = new KeepaTokenManager(redis, config, keepaApiKey);
    this.scoringEngine = new ScoringEngine();
    this.securityService = new SecurityService();
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  start(): void {
    if (this.isRunning) {
      console.log('[KeepaWorker] Already running');
      return;
    }

    this.isRunning = true;
    this.tickInterval = setInterval(() => this.tick(), this.config.WORKER_TICK_MS);
    console.log(`[KeepaWorker] Started - tick every ${this.config.WORKER_TICK_MS}ms`);
  }

  stop(): void {
    this.isRunning = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    console.log('[KeepaWorker] Stopped');
  }

  // ============================================
  // MAIN TICK LOOP
  // ============================================

  private async tick(): Promise<void> {
    try {
      // Check if we have enough tokens
      const tokensAvailable = await this.tokenManager.getAvailable();

      // Peek at next job to check cost
      const nextJob = await this.queue.peek();
      if (!nextJob) {
        return; // Queue empty
      }

      const estimatedCost = this.estimateJobCost(nextJob);
      if (tokensAvailable < estimatedCost) {
        // Not enough tokens - sync with Keepa to get real token count
        const lastSyncKey = 'keepa:last_token_sync';
        const lastSync = await this.redis.get(lastSyncKey);
        const now = Date.now();

        // Sync every 30 seconds when waiting for tokens
        if (!lastSync || now - parseInt(lastSync, 10) > 30000) {
          console.log(`[KeepaWorker] Syncing tokens with Keepa (have ${tokensAvailable}, need ${estimatedCost})`);
          await this.tokenManager.syncFromKeepa();
          await this.redis.set(lastSyncKey, now.toString(), 'EX', 60);
        }
        return;
      }

      // Process the queue
      await this.processQueue();
    } catch (error) {
      console.error('[KeepaWorker] Tick error:', error);
    }
  }

  private estimateJobCost(job: QueueJob): number {
    // Deal API cost (3 priceTypes * 5 tokens = 15)
    const dealCost = this.config.PRICE_TYPES.length * this.config.DEAL_API_COST;
    // Product API cost for verification (20 deals * 2 tokens = 40)
    const verifyCost = this.config.VERIFY_TOP_N_DEALS * this.config.PRODUCT_API_COST;
    return dealCost + verifyCost;
  }

  // ============================================
  // QUEUE PROCESSING
  // ============================================

  private async processQueue(): Promise<void> {
    const job = await this.queue.dequeue();
    if (!job) {
      return;
    }

    console.log(`[KeepaWorker] Processing job ${job.id} for ${job.category} (${job.waitingRules.length} rules)`);

    try {
      await this.executeJob(job);
      await this.queue.completeJob(job);
    } catch (error) {
      console.error(`[KeepaWorker] Job ${job.id} failed:`, error);
      // Requeue with lower priority
      job.priority += 50;
      await this.queue.requeue(job);
    }
  }

  // ============================================
  // JOB EXECUTION
  // ============================================

  private async executeJob(job: QueueJob): Promise<void> {
    const startTime = Date.now();

    // FASE 5.4: Check cache first - if fresh, use cached deals
    const { status: cacheStatus, data: cachedData } = await this.cache.checkStatus(job.category);
    let finalDeals: Deal[];
    let cacheHit = false;

    if (cacheStatus === 'fresh' && cachedData) {
      // Use cached deals - no Keepa API call needed!
      console.log(`[KeepaWorker] Cache HIT for ${job.category} - using cached deals`);
      if (cachedData.deals.length > 0) {
        finalDeals = cachedData.deals;
        cacheHit = true;
        await this.redis.hincrby('keepa:stats', 'cache_hits', 1);
      } else {
        // Cache was marked fresh but empty, fetch anyway
        finalDeals = await this.fetchAndVerifyDeals(job);
      }
    } else {
      // Cache miss or stale - fetch from Keepa
      console.log(`[KeepaWorker] Cache ${cacheStatus} for ${job.category} - fetching from Keepa`);
      await this.redis.hincrby('keepa:stats', 'cache_misses', 1);
      finalDeals = await this.fetchAndVerifyDeals(job);

      // Save to cache
      await this.cache.save(job.category, finalDeals, job.isPrefetch ? 'prefetch' : 'automation');
    }

    if (finalDeals.length === 0) {
      console.log(`[KeepaWorker] No deals for ${job.category}`);
      return;
    }

    // Process each waiting rule
    console.log(`[KeepaWorker] Notifying ${job.waitingRules.length} waiting rules with ${finalDeals.length} deals`);
    await this.notifyWaitingRules(job.waitingRules, finalDeals, cacheHit);

    const duration = Date.now() - startTime;
    console.log(`[KeepaWorker] Job ${job.id} completed in ${duration}ms`);
  }

  /**
   * Fetch deals from Keepa and verify with BuyBox
   */
  private async fetchAndVerifyDeals(job: QueueJob): Promise<Deal[]> {
    // 1. Fetch deals with multi-priceType
    console.log(`[KeepaWorker] Fetching deals for category ${job.categoryId}`);
    const dealResult = await this.keepaClient.fetchDealsMultiPrice(
      job.categoryId,
      job.unionFilters
    );

    // Update token count from Keepa response (authoritative source)
    await this.tokenManager.updateFromResponse(dealResult.tokensLeft, dealResult.refillIn);
    await this.logTokenUsage('deal_search', dealResult.tokenCost, job.category, [], job.id);

    if (dealResult.deals.length === 0) {
      return [];
    }

    console.log(`[KeepaWorker] Got ${dealResult.deals.length} deals, verifying top ${this.config.VERIFY_TOP_N_DEALS}`);

    // 2. Sort by discount and verify top deals with BuyBox
    const sortedDeals = [...dealResult.deals].sort(
      (a, b) => b.discountPercent - a.discountPercent
    );

    const verifyResult = await this.keepaClient.verifyDealsWithBuybox(
      sortedDeals,
      this.config.VERIFY_TOP_N_DEALS
    );

    // Update token count from Keepa response (authoritative source)
    if (verifyResult.tokensLeft > 0) {
      await this.tokenManager.updateFromResponse(verifyResult.tokensLeft, verifyResult.refillIn);
    }
    const verifiedAsins = verifyResult.verifiedDeals.map(d => d.asin);
    await this.logTokenUsage('product_refresh', verifyResult.tokenCost, job.category, verifiedAsins, job.id);

    // Merge verified deals back
    const verifiedMap = new Map(verifyResult.verifiedDeals.map(d => [d.asin, d]));
    const finalDeals = sortedDeals.map(d => verifiedMap.get(d.asin) || d);

    console.log(`[KeepaWorker] Verified ${verifyResult.verifiedDeals.length} deals`);

    return finalDeals;
  }

  // ============================================
  // RULE NOTIFICATION
  // ============================================

  private async notifyWaitingRules(rules: WaitingRule[], deals: Deal[], cacheHit = false): Promise<void> {
    for (const rule of rules) {
      try {
        await this.processRule(rule, deals, cacheHit);
      } catch (error) {
        console.error(`[KeepaWorker] Error processing rule ${rule.ruleId}:`, error);
      }
    }
  }

  private async processRule(rule: WaitingRule, deals: Deal[], cacheHit = false): Promise<void> {
    const startTime = Date.now();

    // 1. Apply rule-specific filters
    const filtered = this.applyRuleFilters(deals, rule);

    // 2. Filter by dealPublishMode
    const modeFiltered = this.filterByPublishMode(filtered, rule.dealPublishMode);

    // 3. Score and filter by minScore
    const scored = this.scoreDeals(modeFiltered);
    const scoredFiltered = scored.filter(d => d.score >= rule.minScore);

    // Diagnostic logging
    console.log(`[KeepaWorker] Rule ${rule.ruleId} filter pipeline: ${deals.length} -> ${filtered.length} (filters) -> ${modeFiltered.length} (mode: ${rule.dealPublishMode}) -> ${scoredFiltered.length} (minScore: ${rule.minScore})`);

    // Log top 3 scores if we have scored deals but none passed minScore
    if (scored.length > 0 && scoredFiltered.length === 0) {
      const topScores = scored.slice(0, 3).map(d => `${d.asin}: ${d.score} (disc:${d.discountPercent}%)`);
      console.log(`[KeepaWorker] Top scores: ${topScores.join(', ')}`);
    }

    // 4. Limit to dealsPerRun
    const toPublish = scoredFiltered.slice(0, rule.dealsPerRun);

    let published = 0;
    if (toPublish.length === 0) {
      console.log(`[KeepaWorker] Rule ${rule.ruleId}: No deals passed filters (minScore: ${rule.minScore})`);
      await this.updateRuleStats(rule.ruleId, 0, true);
    } else {
      // 5. Check deduplication and publish
      published = await this.publishDeals(rule, toPublish);

      // 6. Update rule stats
      await this.updateRuleStats(rule.ruleId, published);

      console.log(`[KeepaWorker] Rule ${rule.ruleId}: Published ${published}/${toPublish.length} deals`);
    }

    // 7. Save telemetry for analysis
    await this.saveRunStats(rule, {
      dealsFetched: deals.length,
      dealsAfterFilters: filtered.length,
      dealsAfterMode: modeFiltered.length,
      dealsPassingScore: scoredFiltered.length,
      dealsPublished: published,
      scores: scored.map(d => d.score),
      durationMs: Date.now() - startTime,
      cacheHit
    });
  }

  /**
   * Save run statistics for telemetry and threshold tuning
   */
  private async saveRunStats(
    rule: WaitingRule,
    stats: {
      dealsFetched: number;
      dealsAfterFilters: number;
      dealsAfterMode: number;
      dealsPassingScore: number;
      dealsPublished: number;
      scores: number[];
      durationMs: number;
      cacheHit: boolean;
    }
  ): Promise<void> {
    try {
      // Calculate score statistics
      let avgScore: number | null = null;
      let minScoreVal: number | null = null;
      let maxScore: number | null = null;
      let stdDev: number | null = null;

      if (stats.scores.length > 0) {
        avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
        minScoreVal = Math.min(...stats.scores);
        maxScore = Math.max(...stats.scores);

        // Calculate standard deviation
        if (stats.scores.length > 1) {
          const squaredDiffs = stats.scores.map(s => Math.pow(s - avgScore!, 2));
          stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / stats.scores.length);
        }
      }

      await this.prisma.automationRunStats.create({
        data: {
          ruleId: rule.ruleId,
          dealsFetched: stats.dealsFetched,
          dealsAfterFilters: stats.dealsAfterFilters,
          dealsAfterMode: stats.dealsAfterMode,
          dealsPassingScore: stats.dealsPassingScore,
          dealsPublished: stats.dealsPublished,
          avgScore,
          minScore: minScoreVal,
          maxScore,
          stdDev,
          minScoreThreshold: rule.minScore,
          dealPublishMode: rule.dealPublishMode,
          durationMs: stats.durationMs,
          cacheHit: stats.cacheHit
        }
      });
    } catch (error) {
      // Non-critical - don't fail the job if telemetry fails
      console.error('[KeepaWorker] Failed to save run stats:', error);
    }
  }

  // ============================================
  // FILTERING
  // ============================================

  private applyRuleFilters(deals: Deal[], rule: WaitingRule): Deal[] {
    const filters = rule.filters;

    return deals.filter(deal => {
      // Discount
      if (filters.minDiscount && deal.discountPercent < filters.minDiscount) {
        return false;
      }

      // Price range
      if (filters.minPrice && deal.currentPrice < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && deal.currentPrice > filters.maxPrice) {
        return false;
      }

      // Rating (we use 0-500 scale internally, deal.rating is 0-50)
      if (filters.minRating && deal.rating !== null) {
        const ratingIn500Scale = deal.rating * 10;
        if (ratingIn500Scale < filters.minRating) {
          return false;
        }
      }

      // Reviews
      if (filters.minReviews && deal.reviewCount !== null && deal.reviewCount < filters.minReviews) {
        return false;
      }

      // Prime only
      if (filters.primeOnly && !deal.isPrime) {
        return false;
      }

      // Exclude keywords
      if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
        const titleLower = deal.title.toLowerCase();
        for (const keyword of filters.excludeKeywords) {
          if (titleLower.includes(keyword.toLowerCase())) {
            return false;
          }
        }
      }

      return true;
    });
  }

  private filterByPublishMode(deals: Deal[], mode: DealPublishMode): Deal[] {
    switch (mode) {
      case 'DISCOUNTED_ONLY':
        // Only deals with visible strikethrough price
        return deals.filter(d => d.hasVisibleDiscount === true);

      case 'LOWEST_PRICE':
        // Only deals at historical low
        return deals.filter(d => d.isHistoricalLow === true);

      case 'BOTH':
        // Either visible discount or historical low
        return deals.filter(d => d.hasVisibleDiscount === true || d.isHistoricalLow === true);

      default:
        return deals;
    }
  }

  // ============================================
  // SCORING
  // ============================================

  private scoreDeals(deals: Deal[]): ScoredDeal[] {
    return deals.map(deal => {
      const { score, components } = this.scoringEngine.calculateDealScore({
        currentPrice: deal.currentPrice,
        originalPrice: deal.originalPrice,
        discount: deal.discountPercent,
        salesRank: undefined, // Not available from Deal API
        rating: deal.rating ?? undefined,
        reviewCount: deal.reviewCount ?? undefined,
        category: deal.category
      });

      return {
        ...deal,
        score,
        scoreComponents: {
          discount: components.discountScore,
          price: components.priceDropScore,
          rating: components.ratingScore,
          popularity: components.salesRankScore,
          timing: 0
        }
      };
    }).sort((a, b) => b.score - a.score);
  }

  // ============================================
  // PUBLISHING
  // ============================================

  private async publishDeals(rule: WaitingRule, deals: ScoredDeal[]): Promise<number> {
    if (!rule.channelId) {
      console.log(`[KeepaWorker] Rule ${rule.ruleId}: No channel configured, skipping publish`);
      return 0;
    }

    // Get channel with credential
    const channel = await this.prisma.channel.findUnique({
      where: { id: rule.channelId },
      include: {
        credential: true,
        user: {
          select: {
            id: true,
            brandId: true
          }
        }
      }
    });

    if (!channel || !channel.credential) {
      console.error(`[KeepaWorker] Channel ${rule.channelId} not found or no credential`);
      return 0;
    }

    // Decrypt bot token
    let botToken: string;
    try {
      botToken = this.securityService.decrypt(channel.credential.key);
    } catch (error) {
      console.error(`[KeepaWorker] Failed to decrypt credential for channel ${rule.channelId}`);
      return 0;
    }

    // Resolve Amazon tag
    const amazonTag = resolveAmazonTag({
      ruleOverride: undefined, // Could add rule override in future
      channelTag: (channel as any).amazonTag || undefined,
      userDefault: channel.user.brandId || DEFAULT_AMAZON_TAG
    });

    let publishedCount = 0;

    for (const deal of deals) {
      // Check deduplication
      const isDuplicate = await this.isDuplicate(rule.channelId, deal.asin, rule.ruleId);
      if (isDuplicate) {
        console.log(`[KeepaWorker] Skipping ${deal.asin} - already published to channel`);
        continue;
      }

      // Publish to Telegram
      const result = await TelegramBotService.sendDealToChannel(
        channel.channelId,
        botToken,
        {
          asin: deal.asin,
          title: deal.title,
          price: deal.currentPrice,
          originalPrice: deal.originalPrice,
          discount: deal.discountPercent / 100,
          rating: deal.rating ?? 0,
          reviewCount: deal.reviewCount ?? 0,
          imageUrl: deal.imageUrl,
          affiliateLink: this.buildAffiliateLink(deal.asin, amazonTag),
          dealType: deal.hasVisibleDiscount ? 'discounted' : 'lowest_price',
          hasVisibleDiscount: deal.hasVisibleDiscount,
          isLowestEver: deal.isHistoricalLow,
          includeKeepaChart: rule.includeKeepaChart
        },
        channel.user.id,
        amazonTag
      );

      if (result.success) {
        // Record in history
        await this.recordDealPublished(rule.channelId, deal.asin, rule.ruleId);
        publishedCount++;
      } else {
        console.error(`[KeepaWorker] Failed to publish ${deal.asin}:`, result.error);
      }

      // Small delay between messages to avoid rate limiting
      await this.delay(1000);
    }

    return publishedCount;
  }

  // ============================================
  // DEDUPLICATION
  // ============================================

  private async isDuplicate(channelId: string, asin: string, ruleId?: string): Promise<boolean> {
    const existing = await this.prisma.channelDealHistory.findUnique({
      where: {
        channelId_asin: {
          channelId,
          asin
        }
      }
    });

    if (!existing) {
      return false;
    }

    // Check if expired
    if (existing.expiresAt < new Date()) {
      // Delete expired record
      await this.prisma.channelDealHistory.delete({
        where: { id: existing.id }
      });
      return false;
    }

    return true;
  }

  private async recordDealPublished(channelId: string, asin: string, ruleId: string): Promise<void> {
    // Get rule's dedupeWindowHours
    const rule = await this.prisma.automationRule.findUnique({
      where: { id: ruleId },
      select: { dedupeWindowHours: true }
    });

    const dedupeHours = rule?.dedupeWindowHours ?? 168; // Default 7 days
    const expiresAt = new Date(Date.now() + dedupeHours * 60 * 60 * 1000);

    await this.prisma.channelDealHistory.upsert({
      where: {
        channelId_asin: {
          channelId,
          asin
        }
      },
      create: {
        channelId,
        asin,
        ruleId,
        expiresAt
      },
      update: {
        ruleId,
        publishedAt: new Date(),
        expiresAt
      }
    });
  }

  // ============================================
  // STATS UPDATE
  // ============================================

  private async updateRuleStats(ruleId: string, dealsPublished: number, isEmpty = false): Promise<void> {
    const rule = await this.prisma.automationRule.findUnique({
      where: { id: ruleId },
      select: { intervalMinutes: true, emptyRunsCount: true }
    });

    if (!rule) return;

    // Calculate next run with jitter (±10%)
    const jitter = Math.floor(rule.intervalMinutes * 0.1 * (Math.random() * 2 - 1));
    const nextRunAt = new Date(Date.now() + (rule.intervalMinutes + jitter) * 60 * 1000);

    await this.prisma.automationRule.update({
      where: { id: ruleId },
      data: {
        lastRunAt: new Date(),
        nextRunAt,
        totalRuns: { increment: 1 },
        dealsPublished: { increment: dealsPublished },
        emptyRunsCount: isEmpty ? { increment: 1 } : 0
      }
    });
  }

  // ============================================
  // TOKEN LOGGING
  // ============================================

  private async logTokenUsage(
    operation: string,
    tokenCost: number,
    category: string,
    asins: string[],
    jobId: string
  ): Promise<void> {
    await this.prisma.keepaTokenLog.create({
      data: {
        operation,
        tokenCost,
        category,
        asins,
        jobId,
        success: true,
        responseTime: 0
      }
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  private buildAffiliateLink(asin: string, tag: string): string {
    return `https://www.amazon.it/dp/${asin}?tag=${tag}&linkCode=ll1&language=it_IT`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
