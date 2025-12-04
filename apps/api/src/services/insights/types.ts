/**
 * InsightsCalculator Types
 *
 * Type definitions for channel insights and analytics.
 */

export interface HourlyStats {
  [hour: string]: {
    posts: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cvr: number;
  };
}

export interface DailyStats {
  [day: string]: {
    posts: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cvr: number;
  };
}

export interface CategoryStats {
  [category: string]: {
    posts: number;
    clicks: number;
    conversions: number;
    revenue: number;
    cvr: number;
    avgScore: number;
    avgDiscount: number;
  };
}

export interface PriceRangeStats {
  [range: string]: {
    posts: number;
    clicks: number;
    conversions: number;
    revenue: number;
    cvr: number;
    avgDiscount: number;
  };
}

export interface DiscountRangeStats {
  [range: string]: {
    posts: number;
    clicks: number;
    conversions: number;
    revenue: number;
    cvr: number;
  };
}

export interface DealTypeStats {
  [dealType: string]: {
    posts: number;
    clicks: number;
    conversions: number;
    revenue: number;
    cvr: number;
    avgScore: number;
  };
}

export interface FactorCorrelations {
  discount: number;
  salesRank: number;
  rating: number;
  priceDrop: number;
  isLowestEver: number;
  reviewCount: number;
}

export interface ScoreWeights {
  discount: number;
  salesRank: number;
  rating: number;
  priceDrop: number;
}

export interface ChannelInsightsData {
  // Timing
  hourlyStats: HourlyStats;
  bestHours: number[];
  dailyStats: DailyStats;
  bestDays: string[];

  // Content
  categoryStats: CategoryStats;
  topCategories: string[];
  dealTypeStats: DealTypeStats;
  bestDealTypes: string[];

  // Pricing
  priceStats: PriceRangeStats;
  optimalPriceRange: { min: number; max: number } | null;
  discountStats: DiscountRangeStats;
  optimalDiscountRange: { min: number; max: number } | null;

  // Dynamic weights
  factorCorrelations: FactorCorrelations;
  scoreWeights: ScoreWeights;

  // Aggregates
  totalPosts: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  avgCtr: number;
  avgCvr: number;
  avgEpc: number;
  avgOrderValue: number;

  // Meta
  confidence: number;
  dataPoints: number;
  periodStart: Date;
  periodEnd: Date;
}

export const PRICE_RANGES = ['0-25', '25-50', '50-100', '100-200', '200+'] as const;
export type PriceRange = (typeof PRICE_RANGES)[number];

export const DISCOUNT_RANGES = ['0-15', '15-25', '25-40', '40-60', '60+'] as const;
export type DiscountRange = (typeof DISCOUNT_RANGES)[number];

export const DAYS_OF_WEEK = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const MIN_DATA_FOR_CONFIDENCE = {
  low: 10,
  medium: 50,
  high: 200,
  veryHigh: 500,
};

// Deal data structure for calculations
export interface DealDataForInsights {
  id: string;
  asin: string;
  publishedAt: Date | null;
  baseScore: number | null;
  finalScore: number | null;
  dealPrice: number | null;
  originalPrice: number | null;
  discount: number | null;
  avgPrice30: number | null;
  priceDropPercent: number | null;
  isLowestEver: boolean;
  isLowest30: boolean;
  salesRank: number | null;
  rating: number | null;
  reviewCount: number | null;
  category: string | null;
  dealType: string | null;
  hasCoupon: boolean;
  clicks: number;
  conversions: number;
  revenue: number;
}

// Default weights from ScoringEngine
export const DEFAULT_WEIGHTS: ScoreWeights = {
  discount: 0.3,
  salesRank: 0.25,
  rating: 0.2,
  priceDrop: 0.25,
};
