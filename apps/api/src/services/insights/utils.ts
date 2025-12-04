/**
 * InsightsCalculator Utilities
 *
 * Helper functions for calculating channel insights.
 */

import { MIN_DATA_FOR_CONFIDENCE, DAYS_OF_WEEK, DayOfWeek } from './types';

/**
 * Get price range bucket for a price
 */
export function getPriceRange(price: number): string {
  if (price < 25) return '0-25';
  if (price < 50) return '25-50';
  if (price < 100) return '50-100';
  if (price < 200) return '100-200';
  return '200+';
}

/**
 * Get discount range bucket for a discount percentage
 */
export function getDiscountRange(discount: number): string {
  if (discount < 15) return '0-15';
  if (discount < 25) return '15-25';
  if (discount < 40) return '25-40';
  if (discount < 60) return '40-60';
  return '60+';
}

/**
 * Get day of week name from date
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  return DAYS_OF_WEEK[date.getDay()];
}

/**
 * Calculate confidence score based on data points
 */
export function calculateConfidence(dataPoints: number): number {
  if (dataPoints >= MIN_DATA_FOR_CONFIDENCE.veryHigh) return 1.0;
  if (dataPoints >= MIN_DATA_FOR_CONFIDENCE.high) return 0.9;
  if (dataPoints >= MIN_DATA_FOR_CONFIDENCE.medium) return 0.6;
  if (dataPoints >= MIN_DATA_FOR_CONFIDENCE.low) return 0.3;
  return 0.1;
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 *
 * @param x First array of numbers
 * @param y Second array of numbers
 * @returns Correlation coefficient between -1 and 1
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 5) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;

  const correlation = numerator / denominator;

  // Clamp between -1 and 1
  return Math.max(-1, Math.min(1, correlation));
}

/**
 * Normalize weights to sum to 1
 */
export function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((a, b) => a + Math.abs(b), 0);
  if (total === 0) {
    // Return equal weights
    const keys = Object.keys(weights);
    const equalWeight = 1 / keys.length;
    return Object.fromEntries(keys.map((k) => [k, equalWeight]));
  }

  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(weights)) {
    normalized[key] = Math.abs(value) / total;
  }
  return normalized;
}

/**
 * Get top N items from stats by a metric
 */
export function getTopN<T extends Record<string, any>>(
  stats: T,
  metric: string,
  n: number,
  minPosts: number = 3
): string[] {
  return Object.entries(stats)
    .filter(([_, data]) => (data.posts || 0) >= minPosts)
    .sort((a, b) => (b[1][metric] || 0) - (a[1][metric] || 0))
    .slice(0, n)
    .map(([key]) => key);
}

/**
 * Find optimal range from stats based on CVR
 */
export function findOptimalRange(
  stats: Record<string, { cvr: number; posts: number }>,
  minPosts: number = 5
): { min: number; max: number } | null {
  const validRanges = Object.entries(stats)
    .filter(([_, data]) => data.posts >= minPosts && data.cvr > 0)
    .sort((a, b) => b[1].cvr - a[1].cvr);

  if (validRanges.length === 0) return null;

  const bestRange = validRanges[0][0];

  if (bestRange.includes('+')) {
    const min = parseInt(bestRange.replace('+', ''));
    return { min, max: 9999 };
  }

  const [min, max] = bestRange.split('-').map(Number);
  return { min, max };
}

/**
 * Safe division - returns 0 if denominator is 0
 */
export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Get hours between two dates
 */
export function hoursBetween(date1: Date, date2: Date): number {
  return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60);
}

/**
 * Subtract days from a date
 */
export function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}
