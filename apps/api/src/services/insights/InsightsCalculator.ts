/**
 * InsightsCalculator
 *
 * Calculates channel insights and dynamic weights from deal history data.
 * Uses real conversion data to compute correlations and optimize scoring weights.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import {
  ChannelInsightsData,
  HourlyStats,
  DailyStats,
  CategoryStats,
  PriceRangeStats,
  DiscountRangeStats,
  DealTypeStats,
  FactorCorrelations,
  ScoreWeights,
  PRICE_RANGES,
  DISCOUNT_RANGES,
  DAYS_OF_WEEK,
  DealDataForInsights,
  DEFAULT_WEIGHTS,
} from './types';
import {
  getPriceRange,
  getDiscountRange,
  getDayOfWeek,
  calculateConfidence,
  pearsonCorrelation,
  normalizeWeights,
  getTopN,
  findOptimalRange,
  safeDivide,
  subDays,
} from './utils';

const ANALYSIS_PERIOD_DAYS = 30;
const MIN_POSTS_FOR_STATS = 3;

export class InsightsCalculator {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Calculate complete insights for a channel
   */
  async calculateInsights(channelId: string): Promise<ChannelInsightsData> {
    const periodEnd = new Date();
    const periodStart = subDays(periodEnd, ANALYSIS_PERIOD_DAYS);

    // Load ALL deal data for the period
    const deals = await this.prisma.channelDealHistory.findMany({
      where: {
        channelId,
        publishedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        asin: true,
        publishedAt: true,
        baseScore: true,
        finalScore: true,
        dealPrice: true,
        originalPrice: true,
        discount: true,
        avgPrice30: true,
        priceDropPercent: true,
        isLowestEver: true,
        isLowest30: true,
        salesRank: true,
        rating: true,
        reviewCount: true,
        category: true,
        dealType: true,
        hasCoupon: true,
        clicks: true,
        conversions: true,
        revenue: true,
      },
    });

    if (deals.length === 0) {
      return this.getEmptyInsights(periodStart, periodEnd);
    }

    // Cast deals for type safety
    const typedDeals = deals as DealDataForInsights[];

    // Calculate all stats
    const hourlyStats = this.calculateHourlyStats(typedDeals);
    const dailyStats = this.calculateDailyStats(typedDeals);
    const categoryStats = this.calculateCategoryStats(typedDeals);
    const priceStats = this.calculatePriceStats(typedDeals);
    const discountStats = this.calculateDiscountStats(typedDeals);
    const dealTypeStats = this.calculateDealTypeStats(typedDeals);

    // Calculate REAL correlations from data
    const factorCorrelations = this.calculateRealCorrelations(typedDeals);
    const scoreWeights = this.calculateDynamicWeights(factorCorrelations, deals.length);

    // Aggregates
    const totalPosts = deals.length;
    const totalClicks = deals.reduce((sum, d) => sum + (d.clicks || 0), 0);
    const totalConversions = deals.reduce((sum, d) => sum + (d.conversions || 0), 0);
    const totalRevenue = deals.reduce((sum, d) => sum + (d.revenue || 0), 0);

    const avgCtr = safeDivide(totalClicks, totalPosts);
    const avgCvr = safeDivide(totalConversions, totalClicks);
    const avgEpc = safeDivide(totalRevenue, totalClicks);
    const avgOrderValue = safeDivide(totalRevenue, totalConversions);

    // Best performers
    const bestHours = this.findBestHours(hourlyStats);
    const bestDays = getTopN(dailyStats, 'cvr', 3);
    const topCategories = getTopN(categoryStats, 'cvr', 5);
    const bestDealTypes = getTopN(dealTypeStats, 'cvr', 3);
    const optimalPriceRange = findOptimalRange(priceStats, MIN_POSTS_FOR_STATS);
    const optimalDiscountRange = findOptimalRange(discountStats, MIN_POSTS_FOR_STATS);

    const confidence = calculateConfidence(totalPosts);

    return {
      hourlyStats,
      bestHours,
      dailyStats,
      bestDays,
      categoryStats,
      topCategories,
      dealTypeStats,
      bestDealTypes,
      priceStats,
      optimalPriceRange,
      discountStats,
      optimalDiscountRange,
      factorCorrelations,
      scoreWeights,
      totalPosts,
      totalClicks,
      totalConversions,
      totalRevenue,
      avgCtr,
      avgCvr,
      avgEpc,
      avgOrderValue,
      confidence,
      dataPoints: totalPosts,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Calculate REAL correlations from saved data
   */
  private calculateRealCorrelations(deals: DealDataForInsights[]): FactorCorrelations {
    // Filter deals with conversion data
    const dealsWithData = deals.filter(
      (d) => d.conversions !== undefined && d.conversions !== null
    );

    if (dealsWithData.length < 10) {
      return {
        discount: 0,
        salesRank: 0,
        rating: 0,
        priceDrop: 0,
        isLowestEver: 0,
        reviewCount: 0,
      };
    }

    // Prepare arrays for correlation
    // Y = conversions (target variable)
    const conversions = dealsWithData.map((d) => d.conversions || 0);

    // X = various factors
    const discounts = dealsWithData.map((d) => d.discount || 0);
    const salesRanks = dealsWithData.map((d) => {
      // Invert: lower rank = better, so use -log for positive correlation
      const rank = d.salesRank || 1000000;
      return -Math.log10(rank + 1);
    });
    const ratings = dealsWithData.map((d) => d.rating || 0);
    const priceDrops = dealsWithData.map((d) => d.priceDropPercent || 0);
    const isLowestEver = dealsWithData.map((d) => (d.isLowestEver ? 1 : 0));
    const reviewCounts = dealsWithData.map((d) => Math.log10((d.reviewCount || 0) + 1));

    return {
      discount: pearsonCorrelation(discounts, conversions),
      salesRank: pearsonCorrelation(salesRanks, conversions),
      rating: pearsonCorrelation(ratings, conversions),
      priceDrop: pearsonCorrelation(priceDrops, conversions),
      isLowestEver: pearsonCorrelation(isLowestEver, conversions),
      reviewCount: pearsonCorrelation(reviewCounts, conversions),
    };
  }

  /**
   * Calculate dynamic weights from correlations
   */
  private calculateDynamicWeights(
    correlations: FactorCorrelations,
    dataPoints: number
  ): ScoreWeights {
    if (dataPoints < MIN_POSTS_FOR_STATS * 2) {
      return DEFAULT_WEIGHTS;
    }

    // Use only the 4 main factors for weights
    const rawWeights = {
      discount: Math.abs(correlations.discount) + 0.05,
      salesRank: Math.abs(correlations.salesRank) + 0.05,
      rating: Math.abs(correlations.rating) + 0.05,
      priceDrop: Math.abs(correlations.priceDrop) + 0.05,
    };

    const normalized = normalizeWeights(rawWeights) as unknown as ScoreWeights;

    // Blend with defaults based on confidence
    const confidence = calculateConfidence(dataPoints);

    return {
      discount: normalized.discount * confidence + DEFAULT_WEIGHTS.discount * (1 - confidence),
      salesRank:
        normalized.salesRank * confidence + DEFAULT_WEIGHTS.salesRank * (1 - confidence),
      rating: normalized.rating * confidence + DEFAULT_WEIGHTS.rating * (1 - confidence),
      priceDrop:
        normalized.priceDrop * confidence + DEFAULT_WEIGHTS.priceDrop * (1 - confidence),
    };
  }

  /**
   * Calculate hourly stats
   */
  private calculateHourlyStats(deals: DealDataForInsights[]): HourlyStats {
    const stats: HourlyStats = {};

    for (let h = 0; h < 24; h++) {
      stats[h.toString()] = {
        posts: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        cvr: 0,
      };
    }

    for (const deal of deals) {
      if (!deal.publishedAt) continue;
      const hour = new Date(deal.publishedAt).getHours().toString();
      stats[hour].posts++;
      stats[hour].clicks += deal.clicks || 0;
      stats[hour].conversions += deal.conversions || 0;
      stats[hour].revenue += deal.revenue || 0;
    }

    for (const hour of Object.keys(stats)) {
      const s = stats[hour];
      s.ctr = safeDivide(s.clicks, s.posts);
      s.cvr = safeDivide(s.conversions, s.clicks);
    }

    return stats;
  }

  /**
   * Calculate daily stats
   */
  private calculateDailyStats(deals: DealDataForInsights[]): DailyStats {
    const stats: DailyStats = {};

    for (const day of DAYS_OF_WEEK) {
      stats[day] = { posts: 0, clicks: 0, conversions: 0, revenue: 0, ctr: 0, cvr: 0 };
    }

    for (const deal of deals) {
      if (!deal.publishedAt) continue;
      const day = getDayOfWeek(new Date(deal.publishedAt));
      stats[day].posts++;
      stats[day].clicks += deal.clicks || 0;
      stats[day].conversions += deal.conversions || 0;
      stats[day].revenue += deal.revenue || 0;
    }

    for (const day of Object.keys(stats)) {
      const s = stats[day];
      s.ctr = safeDivide(s.clicks, s.posts);
      s.cvr = safeDivide(s.conversions, s.clicks);
    }

    return stats;
  }

  /**
   * Calculate category stats
   */
  private calculateCategoryStats(deals: DealDataForInsights[]): CategoryStats {
    const stats: CategoryStats = {};

    for (const deal of deals) {
      const category = deal.category || 'Unknown';

      if (!stats[category]) {
        stats[category] = {
          posts: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          cvr: 0,
          avgScore: 0,
          avgDiscount: 0,
        };
      }

      stats[category].posts++;
      stats[category].clicks += deal.clicks || 0;
      stats[category].conversions += deal.conversions || 0;
      stats[category].revenue += deal.revenue || 0;
      stats[category].avgScore += deal.finalScore || 0;
      stats[category].avgDiscount += deal.discount || 0;
    }

    for (const category of Object.keys(stats)) {
      const s = stats[category];
      s.cvr = safeDivide(s.conversions, s.clicks);
      s.avgScore = safeDivide(s.avgScore, s.posts);
      s.avgDiscount = safeDivide(s.avgDiscount, s.posts);
    }

    return stats;
  }

  /**
   * Calculate price range stats
   */
  private calculatePriceStats(deals: DealDataForInsights[]): PriceRangeStats {
    const stats: PriceRangeStats = {};

    for (const range of PRICE_RANGES) {
      stats[range] = {
        posts: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        cvr: 0,
        avgDiscount: 0,
      };
    }

    for (const deal of deals) {
      const price = deal.dealPrice || 0;
      const range = getPriceRange(price);

      stats[range].posts++;
      stats[range].clicks += deal.clicks || 0;
      stats[range].conversions += deal.conversions || 0;
      stats[range].revenue += deal.revenue || 0;
      stats[range].avgDiscount += deal.discount || 0;
    }

    for (const range of Object.keys(stats)) {
      const s = stats[range];
      s.cvr = safeDivide(s.conversions, s.clicks);
      s.avgDiscount = safeDivide(s.avgDiscount, s.posts);
    }

    return stats;
  }

  /**
   * Calculate discount range stats
   */
  private calculateDiscountStats(deals: DealDataForInsights[]): DiscountRangeStats {
    const stats: DiscountRangeStats = {};

    for (const range of DISCOUNT_RANGES) {
      stats[range] = { posts: 0, clicks: 0, conversions: 0, revenue: 0, cvr: 0 };
    }

    for (const deal of deals) {
      const discount = deal.discount || 0;
      const range = getDiscountRange(discount);

      stats[range].posts++;
      stats[range].clicks += deal.clicks || 0;
      stats[range].conversions += deal.conversions || 0;
      stats[range].revenue += deal.revenue || 0;
    }

    for (const range of Object.keys(stats)) {
      const s = stats[range];
      s.cvr = safeDivide(s.conversions, s.clicks);
    }

    return stats;
  }

  /**
   * Calculate deal type stats
   */
  private calculateDealTypeStats(deals: DealDataForInsights[]): DealTypeStats {
    const stats: DealTypeStats = {};

    for (const deal of deals) {
      const dealType = deal.dealType || 'standard';

      if (!stats[dealType]) {
        stats[dealType] = {
          posts: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          cvr: 0,
          avgScore: 0,
        };
      }

      stats[dealType].posts++;
      stats[dealType].clicks += deal.clicks || 0;
      stats[dealType].conversions += deal.conversions || 0;
      stats[dealType].revenue += deal.revenue || 0;
      stats[dealType].avgScore += deal.finalScore || 0;
    }

    for (const type of Object.keys(stats)) {
      const s = stats[type];
      s.cvr = safeDivide(s.conversions, s.clicks);
      s.avgScore = safeDivide(s.avgScore, s.posts);
    }

    return stats;
  }

  /**
   * Find best hours for posting
   */
  private findBestHours(hourlyStats: HourlyStats): number[] {
    return Object.entries(hourlyStats)
      .filter(([_, stats]) => stats.posts >= MIN_POSTS_FOR_STATS)
      .sort((a, b) => {
        const cvrDiff = b[1].cvr - a[1].cvr;
        if (Math.abs(cvrDiff) > 0.01) return cvrDiff;
        return b[1].ctr - a[1].ctr;
      })
      .slice(0, 5)
      .map(([hour]) => parseInt(hour));
  }

  /**
   * Get empty insights for new channels
   */
  private getEmptyInsights(periodStart: Date, periodEnd: Date): ChannelInsightsData {
    const emptyHourly: HourlyStats = {};
    for (let h = 0; h < 24; h++) {
      emptyHourly[h.toString()] = {
        posts: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        cvr: 0,
      };
    }

    const emptyDaily: DailyStats = {};
    for (const day of DAYS_OF_WEEK) {
      emptyDaily[day] = { posts: 0, clicks: 0, conversions: 0, revenue: 0, ctr: 0, cvr: 0 };
    }

    const emptyPrice: PriceRangeStats = {};
    for (const range of PRICE_RANGES) {
      emptyPrice[range] = {
        posts: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        cvr: 0,
        avgDiscount: 0,
      };
    }

    const emptyDiscount: DiscountRangeStats = {};
    for (const range of DISCOUNT_RANGES) {
      emptyDiscount[range] = { posts: 0, clicks: 0, conversions: 0, revenue: 0, cvr: 0 };
    }

    return {
      hourlyStats: emptyHourly,
      bestHours: [20, 19, 21, 12, 18], // Sensible defaults
      dailyStats: emptyDaily,
      bestDays: ['thursday', 'friday', 'wednesday'],
      categoryStats: {},
      topCategories: [],
      dealTypeStats: {},
      bestDealTypes: [],
      priceStats: emptyPrice,
      optimalPriceRange: null,
      discountStats: emptyDiscount,
      optimalDiscountRange: null,
      factorCorrelations: {
        discount: 0,
        salesRank: 0,
        rating: 0,
        priceDrop: 0,
        isLowestEver: 0,
        reviewCount: 0,
      },
      scoreWeights: DEFAULT_WEIGHTS,
      totalPosts: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      avgCtr: 0,
      avgCvr: 0,
      avgEpc: 0,
      avgOrderValue: 0,
      confidence: 0,
      dataPoints: 0,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Save insights to database
   */
  async saveInsights(channelId: string, insights: ChannelInsightsData): Promise<void> {
    // Convert null to Prisma.DbNull for Json fields, and use JSON.parse/stringify for proper typing
    const optimalPriceRangeValue = insights.optimalPriceRange
      ? (insights.optimalPriceRange as Prisma.InputJsonValue)
      : Prisma.DbNull;
    const optimalDiscountRangeValue = insights.optimalDiscountRange
      ? (insights.optimalDiscountRange as Prisma.InputJsonValue)
      : Prisma.DbNull;
    const factorCorrelationsValue = JSON.parse(
      JSON.stringify(insights.factorCorrelations)
    ) as Prisma.InputJsonValue;
    const scoreWeightsValue = JSON.parse(
      JSON.stringify(insights.scoreWeights)
    ) as Prisma.InputJsonValue;

    await this.prisma.channelInsights.upsert({
      where: { channelId },
      create: {
        channelId,
        hourlyStats: insights.hourlyStats,
        bestHours: insights.bestHours,
        dailyStats: insights.dailyStats,
        bestDays: insights.bestDays,
        categoryStats: insights.categoryStats,
        topCategories: insights.topCategories,
        dealTypeStats: insights.dealTypeStats,
        bestDealTypes: insights.bestDealTypes,
        priceStats: insights.priceStats,
        optimalPriceRange: optimalPriceRangeValue,
        discountStats: insights.discountStats,
        optimalDiscountRange: optimalDiscountRangeValue,
        factorCorrelations: factorCorrelationsValue,
        scoreWeights: scoreWeightsValue,
        totalPosts: insights.totalPosts,
        totalClicks: insights.totalClicks,
        totalConversions: insights.totalConversions,
        totalRevenue: insights.totalRevenue,
        avgCtr: insights.avgCtr,
        avgCvr: insights.avgCvr,
        avgEpc: insights.avgEpc,
        avgOrderValue: insights.avgOrderValue,
        confidence: insights.confidence,
        dataPoints: insights.dataPoints,
        periodDays: ANALYSIS_PERIOD_DAYS,
        lastCalculated: new Date(),
      },
      update: {
        hourlyStats: insights.hourlyStats,
        bestHours: insights.bestHours,
        dailyStats: insights.dailyStats,
        bestDays: insights.bestDays,
        categoryStats: insights.categoryStats,
        topCategories: insights.topCategories,
        dealTypeStats: insights.dealTypeStats,
        bestDealTypes: insights.bestDealTypes,
        priceStats: insights.priceStats,
        optimalPriceRange: optimalPriceRangeValue,
        discountStats: insights.discountStats,
        optimalDiscountRange: optimalDiscountRangeValue,
        factorCorrelations: factorCorrelationsValue,
        scoreWeights: scoreWeightsValue,
        totalPosts: insights.totalPosts,
        totalClicks: insights.totalClicks,
        totalConversions: insights.totalConversions,
        totalRevenue: insights.totalRevenue,
        avgCtr: insights.avgCtr,
        avgCvr: insights.avgCvr,
        avgEpc: insights.avgEpc,
        avgOrderValue: insights.avgOrderValue,
        confidence: insights.confidence,
        dataPoints: insights.dataPoints,
        periodDays: ANALYSIS_PERIOD_DAYS,
        lastCalculated: new Date(),
      },
    });

    console.log(
      `[InsightsCalculator] Saved insights for channel ${channelId} (confidence: ${insights.confidence.toFixed(2)}, dataPoints: ${insights.dataPoints})`
    );
  }

  /**
   * Calculate and save insights
   */
  async calculateAndSave(channelId: string): Promise<ChannelInsightsData> {
    const insights = await this.calculateInsights(channelId);
    await this.saveInsights(channelId, insights);
    return insights;
  }

  /**
   * Recalculate insights for all active channels
   */
  async recalculateAllChannels(): Promise<{ processed: number; errors: number }> {
    const periodStart = subDays(new Date(), ANALYSIS_PERIOD_DAYS);

    const channels = await this.prisma.channel.findMany({
      where: {
        dealHistory: {
          some: {
            publishedAt: {
              gte: periodStart,
            },
          },
        },
      },
      select: { id: true },
    });

    let processed = 0;
    let errors = 0;

    for (const channel of channels) {
      try {
        await this.calculateAndSave(channel.id);
        processed++;
      } catch (error) {
        console.error(`[InsightsCalculator] Error for channel ${channel.id}:`, error);
        errors++;
      }
    }

    console.log(`[InsightsCalculator] Recalculated ${processed} channels (${errors} errors)`);
    return { processed, errors };
  }

  /**
   * Get insights for a channel (from DB or calculate if missing)
   */
  async getInsights(channelId: string, recalculate = false): Promise<ChannelInsightsData> {
    if (recalculate) {
      return this.calculateAndSave(channelId);
    }

    const existing = await this.prisma.channelInsights.findUnique({
      where: { channelId },
    });

    if (existing) {
      // Return existing with type casting
      const periodEnd = existing.lastCalculated || new Date();
      const periodStart = subDays(periodEnd, existing.periodDays || ANALYSIS_PERIOD_DAYS);

      return {
        hourlyStats: (existing.hourlyStats as HourlyStats) || {},
        bestHours: existing.bestHours || [],
        dailyStats: (existing.dailyStats as DailyStats) || {},
        bestDays: existing.bestDays || [],
        categoryStats: (existing.categoryStats as CategoryStats) || {},
        topCategories: existing.topCategories || [],
        dealTypeStats: (existing.dealTypeStats as DealTypeStats) || {},
        bestDealTypes: existing.bestDealTypes || [],
        priceStats: (existing.priceStats as PriceRangeStats) || {},
        optimalPriceRange: existing.optimalPriceRange as { min: number; max: number } | null,
        discountStats: (existing.discountStats as DiscountRangeStats) || {},
        optimalDiscountRange: existing.optimalDiscountRange as {
          min: number;
          max: number;
        } | null,
        factorCorrelations: (existing.factorCorrelations as unknown as FactorCorrelations) || {
          discount: 0,
          salesRank: 0,
          rating: 0,
          priceDrop: 0,
          isLowestEver: 0,
          reviewCount: 0,
        },
        scoreWeights: (existing.scoreWeights as unknown as ScoreWeights) || DEFAULT_WEIGHTS,
        totalPosts: existing.totalPosts,
        totalClicks: existing.totalClicks,
        totalConversions: existing.totalConversions,
        totalRevenue: existing.totalRevenue,
        avgCtr: existing.avgCtr || 0,
        avgCvr: existing.avgCvr || 0,
        avgEpc: existing.avgEpc || 0,
        avgOrderValue: existing.avgOrderValue || 0,
        confidence: existing.confidence,
        dataPoints: existing.dataPoints,
        periodStart,
        periodEnd,
      };
    }

    // Calculate if not exists
    return this.calculateAndSave(channelId);
  }
}

// Singleton instance
let insightsCalculatorInstance: InsightsCalculator | null = null;

export function getInsightsCalculator(prisma?: PrismaClient): InsightsCalculator {
  if (!insightsCalculatorInstance) {
    insightsCalculatorInstance = new InsightsCalculator(prisma);
  }
  return insightsCalculatorInstance;
}

export default InsightsCalculator;
