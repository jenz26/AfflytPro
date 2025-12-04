/**
 * Amazon Associates CSV Import Types
 *
 * Type definitions for parsing and importing Amazon Associates CSV reports.
 */

export type ReportType = 'orders' | 'earnings' | 'daily_trends' | 'tracking' | 'link_type';

export interface ParsedOrderRow {
  category: string;
  productTitle: string;
  asin: string;
  orderDate: Date;
  quantity: number;
  price: number;
  linkType: string | null;
  trackingId: string | null;
  orderType: string | null; // 'di' | 'ndi'
  deviceType: string | null;
}

export interface ParsedEarningsRow {
  category: string;
  productTitle: string;
  asin: string;
  seller: string;
  trackingId: string;
  shippedDate: Date;
  price: number;
  shippedQuantity: number;
  returns: number;
  revenue: number;
  commission: number;
  deviceType: string | null;
  isDirectPurchase: boolean;
}

export interface ParsedDailyTrendRow {
  date: Date;
  clicks: number;
  ordersAmazon: number;
  orders3rdParty: number;
  ordersTotal: number;
  conversionRate: number;
}

export interface ParsedTrackingRow {
  trackingId: string;
  clicks: number;
  orderedItems: number;
  shippedItems: number;
  revenue: number;
  commission: number;
}

export interface ParsedLinkTypeRow {
  linkType: string;
  clicks: number;
  orderedItems: number;
  conversionRate: number;
  orderedRevenue: number;
  shippedItems: number;
  commission: number;
}

export interface ImportResult {
  success: boolean;
  reportType: ReportType;
  rowsTotal: number;
  rowsImported: number;
  rowsSkipped: number;
  rowsFailed: number;
  matchedDeals: number;
  unmatchedDeals: number;
  errors: Array<{ row: number; error: string }>;
  periodStart: Date | null;
  periodEnd: Date | null;
}

export interface MatchResult {
  matched: boolean;
  dealHistoryId: string | null;
  confidence: number;
  matchReason: string | null;
}

export interface ParseResult<T> {
  rows: T[];
  periodStart: Date | null;
  periodEnd: Date | null;
  headers: string[];
}
