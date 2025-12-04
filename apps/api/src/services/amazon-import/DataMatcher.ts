/**
 * DataMatcher
 *
 * Matches Amazon order data with ChannelDealHistory records.
 * Uses ASIN + tracking ID + time window to find the best match.
 */

import { PrismaClient } from '@prisma/client';
import { MatchResult } from './types';

const prisma = new PrismaClient();

/**
 * Subtract days from a date
 */
function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export class DataMatcher {
  /**
   * Cerca un match in ChannelDealHistory per un ordine Amazon
   */
  static async findMatchingDeal(
    userId: string,
    asin: string,
    orderDate: Date,
    trackingId: string | null
  ): Promise<MatchResult> {
    // Finestra di match: deal pubblicato nei 7 giorni precedenti all'ordine
    // (cookie Amazon dura 24h, ma lasciamo margine per casi edge)
    const windowStart = subDays(orderDate, 7);
    const windowEnd = addDays(orderDate, 1);

    // 1. Prima prova: match esatto ASIN + TrackingID
    if (trackingId) {
      const exactMatch = await prisma.channelDealHistory.findFirst({
        where: {
          asin,
          trackingIdUsed: trackingId,
          publishedAt: {
            gte: windowStart,
            lte: windowEnd,
          },
          channel: {
            userId,
          },
        },
        select: { id: true },
      });

      if (exactMatch) {
        return {
          matched: true,
          dealHistoryId: exactMatch.id,
          confidence: 1.0,
          matchReason: 'exact_asin_tracking',
        };
      }
    }

    // 2. Match per ASIN + finestra temporale (senza tracking)
    const asinMatch = await prisma.channelDealHistory.findFirst({
      where: {
        asin,
        publishedAt: {
          gte: windowStart,
          lte: windowEnd,
        },
        channel: {
          userId,
        },
      },
      orderBy: {
        publishedAt: 'desc', // Prendi il più recente
      },
      select: { id: true, trackingIdUsed: true },
    });

    if (asinMatch) {
      // Confidence più bassa se il tracking non corrisponde
      const confidence = asinMatch.trackingIdUsed === trackingId ? 0.9 : 0.7;

      return {
        matched: true,
        dealHistoryId: asinMatch.id,
        confidence,
        matchReason: 'asin_time_window',
      };
    }

    // 3. Nessun match trovato
    return {
      matched: false,
      dealHistoryId: null,
      confidence: 0,
      matchReason: null,
    };
  }

  /**
   * Aggiorna ChannelDealHistory con dati ordine
   */
  static async updateDealWithOrderData(
    dealHistoryId: string,
    orderData: {
      clicks?: number;
      conversions?: number;
      revenue?: number;
      commissionEarned?: number;
    }
  ): Promise<void> {
    const current = await prisma.channelDealHistory.findUnique({
      where: { id: dealHistoryId },
      select: { clicks: true, conversions: true, revenue: true, commissionEarned: true },
    });

    if (!current) return;

    await prisma.channelDealHistory.update({
      where: { id: dealHistoryId },
      data: {
        clicks: (current.clicks || 0) + (orderData.clicks || 0),
        conversions: (current.conversions || 0) + (orderData.conversions || 0),
        revenue: (current.revenue || 0) + (orderData.revenue || 0),
        commissionEarned: (current.commissionEarned || 0) + (orderData.commissionEarned || 0),
      },
    });
  }

  /**
   * Check if an order was already imported (by ASIN + orderDate + trackingId)
   */
  static async isOrderDuplicate(
    userId: string,
    asin: string,
    orderDate: Date,
    trackingId: string | null
  ): Promise<boolean> {
    const existing = await prisma.amazonOrder.findUnique({
      where: {
        userId_asin_orderDate_trackingId: {
          userId,
          asin,
          orderDate,
          trackingId: trackingId || '',
        },
      },
    });

    return !!existing;
  }

  /**
   * Get summary of matching statistics for a user
   */
  static async getMatchingStats(userId: string): Promise<{
    totalOrders: number;
    matchedOrders: number;
    unmatchedOrders: number;
    matchRate: number;
    avgConfidence: number;
  }> {
    const stats = await prisma.amazonOrder.aggregate({
      where: { userId },
      _count: {
        id: true,
        matchedDealId: true,
      },
      _avg: {
        matchConfidence: true,
      },
    });

    const total = stats._count.id || 0;
    const matched = stats._count.matchedDealId || 0;

    return {
      totalOrders: total,
      matchedOrders: matched,
      unmatchedOrders: total - matched,
      matchRate: total > 0 ? (matched / total) * 100 : 0,
      avgConfidence: stats._avg.matchConfidence || 0,
    };
  }
}

export default DataMatcher;
