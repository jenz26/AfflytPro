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
import {
  calculateDealScore,
  getChannelScoreContext,
  ScoringEngine,
  type ProductScoreInput,
  type ChannelScoreContext,
  type ScoreResult
} from '../ScoringEngine';
import { TelegramBotService } from '../TelegramBotService';
import { SecurityService } from '../SecurityService';
import { LLMCopyService, type DealCopyPayload, type LLMCopyConfig } from '../LLMCopyService';
import { trackingIdPool, type TrackingIdAssignment } from '../TrackingIdPoolService';
import { SchedulerService, type ScheduleDealInput } from '../scheduling';
import { captureException, addBreadcrumb, Sentry } from '../../lib/sentry';

const DEFAULT_AMAZON_TAG = 'afflyt-21';

// Stress test mode: reduces logging, accumulates metrics in Redis
const STRESS_TEST_MODE = process.env.STRESS_TEST_MODE === 'true';
const TEST_CHANNEL_PREFIX = 'TEST_';

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
  private llmCopyService: LLMCopyService;

  private isRunning = false;
  private tickInterval: NodeJS.Timeout | null = null;

  // Stress test metrics (accumulated in memory, flushed to Redis)
  private stressMetrics = {
    rulesProcessed: 0,
    dealsPublished: 0,
    duplicatesSkipped: 0,
    jobsCompleted: 0,
    tokenWaits: 0,
    errors: 0
  };

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
    this.llmCopyService = new LLMCopyService(redis);
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

    // Flush stress test metrics on stop
    if (STRESS_TEST_MODE) {
      this.flushStressMetrics();
    }
  }

  // ============================================
  // STRESS TEST HELPERS
  // ============================================

  /**
   * Log only if not in stress test mode (reduces Railway log volume)
   */
  private log(message: string, force = false): void {
    if (!STRESS_TEST_MODE || force) {
      console.log(message);
    }
  }

  /**
   * Check if a channel is a test channel (mock Telegram)
   */
  private isTestChannel(channelId: string | null): boolean {
    return channelId?.startsWith(TEST_CHANNEL_PREFIX) ?? false;
  }

  /**
   * Flush accumulated metrics to Redis for stress test analysis
   */
  private async flushStressMetrics(): Promise<void> {
    try {
      await this.redis.hset('stress:metrics', {
        rulesProcessed: this.stressMetrics.rulesProcessed,
        dealsPublished: this.stressMetrics.dealsPublished,
        duplicatesSkipped: this.stressMetrics.duplicatesSkipped,
        jobsCompleted: this.stressMetrics.jobsCompleted,
        tokenWaits: this.stressMetrics.tokenWaits,
        errors: this.stressMetrics.errors,
        timestamp: Date.now()
      });
      console.log(`[KeepaWorker] Stress metrics flushed: ${JSON.stringify(this.stressMetrics)}`);
    } catch (error) {
      console.error('[KeepaWorker] Failed to flush stress metrics:', error);
    }
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

          // Sentry: Track token wait events
          addBreadcrumb('Waiting for tokens', 'keepa.tokens', {
            tokensAvailable,
            estimatedCost,
            jobId: nextJob.id,
            category: nextJob.category
          });
        }
        return;
      }

      // Process the queue
      await this.processQueue();
    } catch (error) {
      console.error('[KeepaWorker] Tick error:', error);

      // Sentry: Capture tick errors
      captureException(error as Error, {
        component: 'KeepaWorker',
        operation: 'tick'
      });
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

    // Sentry: Add breadcrumb for job start
    addBreadcrumb(`Processing job ${job.id}`, 'keepa.worker', {
      jobId: job.id,
      category: job.category,
      categoryId: job.categoryId,
      rulesCount: job.waitingRules.length,
      isPrefetch: job.isPrefetch
    });

    try {
      await this.executeJob(job);
      await this.queue.completeJob(job);

      // Sentry: Add breadcrumb for job completion
      addBreadcrumb(`Job ${job.id} completed`, 'keepa.worker', {
        jobId: job.id,
        category: job.category
      });
    } catch (error) {
      console.error(`[KeepaWorker] Job ${job.id} failed:`, error);

      // Sentry: Capture job failure with context
      captureException(error as Error, {
        jobId: job.id,
        category: job.category,
        categoryId: job.categoryId,
        rulesCount: job.waitingRules.length,
        ruleIds: job.waitingRules.map(r => r.ruleId),
        isPrefetch: job.isPrefetch,
        component: 'KeepaWorker',
        operation: 'processQueue'
      });

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

    // Sentry: Start a transaction for job execution
    const transaction = Sentry.startSpanManual(
      {
        op: 'keepa.job',
        name: `Job ${job.category}`,
      },
      (span) => span
    );

    try {
      // Add context to the span
      transaction.setAttribute('job.id', job.id);
      transaction.setAttribute('job.category', job.category);
      transaction.setAttribute('job.categoryId', job.categoryId);
      transaction.setAttribute('job.rulesCount', job.waitingRules.length);
      transaction.setAttribute('job.isPrefetch', job.isPrefetch);

      // FASE 5.4: Check cache first - if fresh, use cached deals
      const { status: cacheStatus, data: cachedData } = await this.cache.checkStatus(job.category);
      let finalDeals: Deal[];
      let cacheHit = false;

      transaction.setAttribute('cache.status', cacheStatus);

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

      transaction.setAttribute('cache.hit', cacheHit);
      transaction.setAttribute('deals.count', finalDeals.length);

      if (finalDeals.length === 0) {
        console.log(`[KeepaWorker] No deals for ${job.category}`);
        transaction.setStatus({ code: 1, message: 'No deals found' });
        return;
      }

      // Process each waiting rule
      console.log(`[KeepaWorker] Notifying ${job.waitingRules.length} waiting rules with ${finalDeals.length} deals`);
      await this.notifyWaitingRules(job.waitingRules, finalDeals, cacheHit);

      const duration = Date.now() - startTime;
      console.log(`[KeepaWorker] Job ${job.id} completed in ${duration}ms`);

      transaction.setAttribute('job.durationMs', duration);
      transaction.setStatus({ code: 0 }); // OK
    } catch (error) {
      transaction.setStatus({ code: 2, message: (error as Error).message }); // ERROR
      throw error;
    } finally {
      transaction.end();
    }
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

        // Sentry: Capture rule processing error
        captureException(error as Error, {
          ruleId: rule.ruleId,
          channelId: rule.channelId,
          minScore: rule.minScore,
          dealsPerRun: rule.dealsPerRun,
          dealPublishMode: rule.dealPublishMode,
          dealsAvailable: deals.length,
          cacheHit,
          component: 'KeepaWorker',
          operation: 'notifyWaitingRules'
        });
      }
    }
  }

  private async processRule(rule: WaitingRule, deals: Deal[], cacheHit = false): Promise<void> {
    const startTime = Date.now();

    // 0. Load channel context for dynamic scoring (once per rule execution)
    let channelContext: ChannelScoreContext | undefined;
    if (rule.channelId) {
      channelContext = await getChannelScoreContext(rule.channelId);
      if (channelContext) {
        console.log(`[KeepaWorker] Channel context loaded: audienceType=${channelContext.audienceType}, confidence=${channelContext.confidence.toFixed(2)}`);
      }
    }

    // 1. Apply rule-specific filters
    const filtered = this.applyRuleFilters(deals, rule);

    // 2. Filter by dealPublishMode
    const modeFiltered = this.filterByPublishMode(filtered, rule.dealPublishMode);

    // 3. Score deals with dynamic weights (if channel context available)
    const scored = this.scoreDealsWithContext(modeFiltered, channelContext);

    // 4. Filter by minScore using baseScore (fixed weights for consistent user threshold)
    const scoredFiltered = scored.filter(d => d.baseScore >= rule.minScore);

    // Diagnostic logging
    console.log(`[KeepaWorker] Rule ${rule.ruleId} filter pipeline: ${deals.length} -> ${filtered.length} (filters) -> ${modeFiltered.length} (mode: ${rule.dealPublishMode}) -> ${scoredFiltered.length} (minScore: ${rule.minScore})`);

    // Log top 3 scores if we have scored deals but none passed minScore
    if (scored.length > 0 && scoredFiltered.length === 0) {
      const topScores = scored.slice(0, 3).map(d => `${d.asin}: base=${d.baseScore} final=${d.finalScore} (disc:${d.discountPercent}%)`);
      console.log(`[KeepaWorker] Top scores: ${topScores.join(', ')}`);
    }

    // 5. Pass ALL scored deals to publishDeals - it will publish up to dealsPerRun
    //    Deals are already sorted by finalScore (dynamic weights) for optimal ranking
    let published = 0;
    if (scoredFiltered.length === 0) {
      console.log(`[KeepaWorker] Rule ${rule.ruleId}: No deals passed filters (minScore: ${rule.minScore})`);
      await this.updateRuleStats(rule.ruleId, 0, true);
    } else {
      // 6. Check deduplication and publish (pass all candidates, limit enforced inside)
      published = await this.publishDeals(rule, scoredFiltered);

      // 7. Update rule stats
      await this.updateRuleStats(rule.ruleId, published);

      console.log(`[KeepaWorker] Rule ${rule.ruleId}: Published ${published}/${scoredFiltered.length} candidates`);
    }

    // 8. Save telemetry for analysis
    await this.saveRunStats(rule, {
      dealsFetched: deals.length,
      dealsAfterFilters: filtered.length,
      dealsAfterMode: modeFiltered.length,
      dealsPassingScore: scoredFiltered.length,
      dealsPublished: published,
      scores: scored.map(d => d.baseScore),
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

  /**
   * Score deals with dynamic weights based on channel context.
   * - Uses baseScore for minScore filtering (fixed weights)
   * - Uses finalScore for ranking (dynamic weights per channel/audience)
   * - Sorts by finalScore for optimal publishing order
   */
  private scoreDealsWithContext(deals: Deal[], channelContext?: ChannelScoreContext): ScoredDeal[] {
    return deals.map(deal => {
      // Prepare product input for new scoring engine
      const productInput: ProductScoreInput = {
        currentPrice: deal.currentPrice,
        originalPrice: deal.originalPrice,
        discount: deal.discountPercent,
        salesRank: undefined, // Not available from Deal API
        rating: deal.rating ?? undefined,
        reviewCount: deal.reviewCount ?? undefined,
        category: deal.category,
        asin: deal.asin
      };

      // Calculate score with channel context (if available)
      const result: ScoreResult = calculateDealScore(productInput, channelContext);

      return {
        ...deal,
        score: result.baseScore,          // Legacy compatibility
        baseScore: result.baseScore,      // Fixed weights - used for minScore filter
        finalScore: result.finalScore,    // Dynamic weights - used for ranking
        scoreLabel: result.label,
        scoreComponents: {
          discount: result.components.discountScore * result.weightsUsed.discount,
          price: result.components.priceDropScore * result.weightsUsed.priceDrop,
          rating: result.components.ratingScore * result.weightsUsed.rating,
          popularity: result.components.salesRankScore * result.weightsUsed.salesRank,
          timing: 0
        }
      };
    }).sort((a, b) => b.finalScore - a.finalScore); // Sort by finalScore for optimal ranking
  }

  /**
   * @deprecated Use scoreDealsWithContext instead
   */
  private scoreDeals(deals: Deal[]): ScoredDeal[] {
    return this.scoreDealsWithContext(deals, undefined);
  }

  // ============================================
  // PUBLISHING
  // ============================================

  private async publishDeals(rule: WaitingRule, deals: ScoredDeal[]): Promise<number> {
    if (!rule.channelId) {
      console.log(`[KeepaWorker] Rule ${rule.ruleId}: No channel configured, skipping publish`);
      return 0;
    }

    // Get channel with credential AND rule LLM config
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

    // Get rule LLM configuration and publishingMode
    const ruleConfig = await this.prisma.automationRule.findUnique({
      where: { id: rule.ruleId },
      select: {
        copyMode: true,
        messageTemplate: true,
        customStylePrompt: true,
        llmModel: true,
        publishingMode: true
      }
    });

    // Check if smart scheduling is enabled
    const useSmartScheduling = ruleConfig?.publishingMode === 'smart';

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

    // Prepare LLM config
    const llmConfig: LLMCopyConfig = {
      copyMode: (ruleConfig?.copyMode as 'TEMPLATE' | 'LLM') || 'TEMPLATE',
      messageTemplate: ruleConfig?.messageTemplate,
      customStylePrompt: ruleConfig?.customStylePrompt,
      llmModel: ruleConfig?.llmModel || 'gpt-4o-mini',
      ruleId: rule.ruleId
    };

    let publishedCount = 0;
    let skippedDuplicates = 0;

    // Check if user has tracking IDs available
    const hasTrackingIds = await trackingIdPool.hasAvailableTrackingIds(channel.user.id);
    if (hasTrackingIds) {
      console.log(`[KeepaWorker] User ${channel.user.id} has tracking IDs available for attribution`);
    }

    for (const deal of deals) {
      // Stop if we've published enough deals
      if (publishedCount >= rule.dealsPerRun) {
        console.log(`[KeepaWorker] Reached dealsPerRun limit (${rule.dealsPerRun})`);
        break;
      }

      // Check deduplication
      const isDuplicate = await this.isDuplicate(rule.channelId, deal.asin, rule.ruleId);
      if (isDuplicate) {
        skippedDuplicates++;
        console.log(`[KeepaWorker] Skipping ${deal.asin} - already published (${skippedDuplicates} skipped so far)`);
        continue;
      }

      // Smart Scheduling: Schedule deal instead of publishing immediately
      if (useSmartScheduling) {
        // Check if deal is already scheduled
        const isScheduled = await SchedulerService.isDealScheduled(rule.channelId, deal.asin);
        if (isScheduled) {
          console.log(`[KeepaWorker] Skipping ${deal.asin} - already scheduled`);
          continue;
        }

        // Determine deal type for scheduling priority
        let dealType = 'deal';
        if (deal.hasVisibleDiscount) {
          dealType = 'deal';
        } else if (deal.isHistoricalLow) {
          dealType = 'price_drop';
        }
        // Check if it's a lightning deal (has short expiry)
        // Lightning deals typically have dealEndTime set
        const dealEndTime = (deal as any).lightningEndAt || (deal as any).dealEndTime;
        if (dealEndTime) {
          dealType = 'lightning';
        }

        const scheduleInput: ScheduleDealInput = {
          channelId: rule.channelId,
          ruleId: rule.ruleId,
          asin: deal.asin,
          productTitle: deal.title,
          baseScore: deal.baseScore,
          finalScore: deal.finalScore,
          dealType,
          originalPrice: deal.originalPrice,
          dealPrice: deal.currentPrice,
          discount: deal.discountPercent,
          category: deal.category,
          dealEndTime: dealEndTime ? new Date(dealEndTime) : undefined
        };

        try {
          const scheduledId = await SchedulerService.scheduleDeal(scheduleInput);
          publishedCount++; // Count as "processed" for smart scheduling
          console.log(`[KeepaWorker] Scheduled ${deal.asin} -> ${scheduledId}`);

          // Sentry breadcrumb
          addBreadcrumb(`Scheduled deal ${deal.asin}`, 'keepa.schedule', {
            scheduledId,
            asin: deal.asin,
            ruleId: rule.ruleId,
            channelId: rule.channelId,
            dealType,
            baseScore: deal.baseScore,
            finalScore: deal.finalScore
          });
        } catch (error: any) {
          console.error(`[KeepaWorker] Failed to schedule ${deal.asin}:`, error);
          captureException(error, {
            asin: deal.asin,
            ruleId: rule.ruleId,
            channelId: rule.channelId,
            component: 'KeepaWorker',
            operation: 'scheduleDeal'
          });
        }

        continue; // Skip immediate publish, deal is scheduled
      }

      // Immediate Mode: Publish directly
      // Acquire tracking ID BEFORE building link (for precise attribution)
      let trackingIdUsed: string | undefined;
      let trackingRecordId: string | undefined;
      if (hasTrackingIds) {
        // Use a temporary reference - we'll update with real dealHistoryId after recording
        const tempRef = `temp_${deal.asin}_${Date.now()}`;
        const trackingAssignment = await trackingIdPool.acquireTrackingId(channel.user.id, tempRef);
        if (trackingAssignment) {
          trackingIdUsed = trackingAssignment.trackingId;
          trackingRecordId = trackingAssignment.trackingRecordId;
          console.log(`[KeepaWorker] Acquired tracking ID ${trackingIdUsed} for ${deal.asin}`);
        }
      }

      // Build affiliate link with tracking ID if available (otherwise fallback to main tag)
      const tagToUse = trackingIdUsed || amazonTag;
      const affiliateLink = this.buildAffiliateLink(deal.asin, tagToUse);

      // Generate copy (LLM or template)
      const copyPayload: DealCopyPayload = {
        asin: deal.asin,
        title: deal.title,
        currentPrice: deal.currentPrice,
        originalPrice: deal.originalPrice,
        discountPercent: deal.discountPercent,
        category: deal.category,
        rating: deal.rating,
        reviewCount: deal.reviewCount,
        isHistoricalLow: deal.isHistoricalLow,
        hasVisibleDiscount: deal.hasVisibleDiscount,
        affiliateUrl: affiliateLink
      };

      const copyResult = await this.llmCopyService.generateCopy(copyPayload, llmConfig);
      console.log(`[KeepaWorker] Copy generated for ${deal.asin} via ${copyResult.source}`);

      // Publish to Telegram with custom copy
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
          affiliateLink,
          dealType: deal.hasVisibleDiscount ? 'discounted' : 'lowest_price',
          hasVisibleDiscount: deal.hasVisibleDiscount,
          isLowestEver: deal.isHistoricalLow,
          showKeepaButton: rule.showKeepaButton,
          customCopy: copyResult.text, // Pass LLM-generated copy
          // V3: Price source for message formatting
          priceSource: deal.priceSource,
          avgPrice30: deal.avgPrice30
        },
        channel.user.id,
        amazonTag,
        // UTM params for channel attribution tracking
        {
          channelName: channel.name,
          platform: channel.platform
        }
      );

      if (result.success) {
        // Record in history with complete deal data for analytics and insights
        const dealHistoryId = await this.recordDealPublished(
          rule.channelId,
          deal.asin,
          rule.ruleId,
          copyResult.text,
          copyResult.source,
          deal.currentPrice,
          result.messageId,
          // Complete deal info for analytics and InsightsCalculator
          {
            // Scoring
            baseScore: deal.baseScore,
            finalScore: deal.finalScore,
            scoreBreakdown: deal.scoreComponents,
            // Product info
            productTitle: deal.title,
            category: deal.category,
            // Prices
            originalPrice: deal.originalPrice,
            discount: deal.discountPercent,
            // Price history
            avgPrice30: deal.avgPrice30,
            avgPrice90: deal.avgPrice90,
            priceDropPercent: deal.discountVsAvg,
            isLowestEver: deal.isHistoricalLow || false,
            // Product metrics
            rating: deal.rating,
            reviewCount: deal.reviewCount,
            // Deal details
            dealType: deal.hasVisibleDiscount ? 'deal' : 'price_drop',
            dealEndTime: deal.dealEndDate,
            hasVisibleDiscount: deal.hasVisibleDiscount || false,
            // Message info
            messageText: copyResult.text,
            messageFormat: copyResult.source === 'LLM' ? 'llm_generated' : 'template_standard',
            // Tracking (already acquired before publishing)
            trackingIdUsed
          }
        );

        // Update UserTrackingId.dealHistoryId with the real ID (if we acquired one)
        if (trackingRecordId && dealHistoryId) {
          await this.prisma.userTrackingId.update({
            where: { id: trackingRecordId },
            data: { dealHistoryId }
          });
          console.log(`[KeepaWorker] Linked tracking ID ${trackingIdUsed} to deal history ${dealHistoryId}`);
        }

        publishedCount++;

        // Sentry: Track successful publish
        addBreadcrumb(`Published deal ${deal.asin}`, 'keepa.publish', {
          asin: deal.asin,
          ruleId: rule.ruleId,
          channelId: rule.channelId,
          price: deal.currentPrice,
          discount: deal.discountPercent,
          baseScore: deal.baseScore,
          finalScore: deal.finalScore,
          copySource: copyResult.source,
          trackingIdUsed
        });
      } else {
        console.error(`[KeepaWorker] Failed to publish ${deal.asin}:`, result.error);

        // Sentry: Capture publish failure
        captureException(new Error(`Telegram publish failed: ${result.error}`), {
          asin: deal.asin,
          ruleId: rule.ruleId,
          channelId: rule.channelId,
          telegramChannelId: channel.channelId,
          error: result.error,
          component: 'KeepaWorker',
          operation: 'publishDeals'
        });
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
    // Find the most recent entry for this channel+asin combination
    const existing = await this.prisma.channelDealHistory.findFirst({
      where: {
        channelId,
        asin
      },
      orderBy: { publishedAt: 'desc' }
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

  private async recordDealPublished(
    channelId: string,
    asin: string,
    ruleId: string,
    generatedCopy?: string,
    copySource?: string,
    priceAtGeneration?: number,
    telegramMessageId?: number,
    // Complete deal info for analytics and InsightsCalculator
    dealInfo?: {
      // Scoring
      baseScore: number;
      finalScore: number;
      scoreBreakdown?: any;
      // Product info
      productTitle?: string;
      category?: string;
      // Prices
      originalPrice?: number;
      discount?: number;
      // Price history
      avgPrice30?: number;
      avgPrice90?: number;
      priceDropPercent?: number;
      isLowestEver?: boolean;
      // Product metrics
      rating?: number | null;
      reviewCount?: number | null;
      // Deal details
      dealType?: string;
      dealEndTime?: Date | null;
      hasVisibleDiscount?: boolean;
      // Message info
      messageText?: string;
      messageFormat?: string;
      // Tracking
      trackingIdUsed?: string;
    }
  ): Promise<string | null> {
    // Get rule's dedupeWindowHours
    const rule = await this.prisma.automationRule.findUnique({
      where: { id: ruleId },
      select: { dedupeWindowHours: true }
    });

    const dedupeHours = rule?.dedupeWindowHours ?? 168; // Default 7 days
    const expiresAt = new Date(Date.now() + dedupeHours * 60 * 60 * 1000);
    const now = new Date();

    // Find existing unexpired entry for this channel+asin
    const existing = await this.prisma.channelDealHistory.findFirst({
      where: {
        channelId,
        asin,
        expiresAt: { gt: now }
      },
      orderBy: { publishedAt: 'desc' }
    });

    // Complete data fields for analytics and InsightsCalculator
    const commonData = {
      ruleId,
      publishedAt: now,
      expiresAt,
      // LLM copy tracking
      generatedCopy,
      copySource,
      copyGeneratedAt: generatedCopy ? now : undefined,
      priceAtGeneration,
      telegramMessageId: telegramMessageId?.toString(),
      // Product info
      productTitle: dealInfo?.productTitle,
      category: dealInfo?.category,
      // Scoring
      baseScore: dealInfo?.baseScore,
      finalScore: dealInfo?.finalScore,
      scoreBreakdown: dealInfo?.scoreBreakdown,
      // Prices
      originalPrice: dealInfo?.originalPrice,
      dealPrice: priceAtGeneration,
      discount: dealInfo?.discount,
      // Price history
      avgPrice30: dealInfo?.avgPrice30,
      avgPrice90: dealInfo?.avgPrice90,
      priceDropPercent: dealInfo?.priceDropPercent,
      isLowestEver: dealInfo?.isLowestEver ?? false,
      isLowest30: false, // Will be calculated separately if needed
      // Product metrics
      rating: dealInfo?.rating,
      reviewCount: dealInfo?.reviewCount,
      // Deal details
      dealType: dealInfo?.dealType,
      dealEndTime: dealInfo?.dealEndTime,
      // Message info
      messageText: dealInfo?.messageText,
      messageFormat: dealInfo?.messageFormat,
      // Tracking
      trackingIdUsed: dealInfo?.trackingIdUsed
    };

    if (existing) {
      // Update existing record
      const updated = await this.prisma.channelDealHistory.update({
        where: { id: existing.id },
        data: commonData
      });
      return updated.id;
    } else {
      // Create new record
      const created = await this.prisma.channelDealHistory.create({
        data: {
          channelId,
          asin,
          ...commonData
        }
      });
      return created.id;
    }
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
