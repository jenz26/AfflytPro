/**
 * AmazonImportService
 *
 * Main service for importing Amazon Associates CSV reports.
 * Handles file parsing, data matching, and database persistence.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { ReportType, ImportResult } from './types';
import { OrdersParser } from './parsers/OrdersParser';
import { EarningsParser } from './parsers/EarningsParser';
import { DailyTrendsParser } from './parsers/DailyTrendsParser';
import { TrackingParser } from './parsers/TrackingParser';
import { DataMatcher } from './DataMatcher';
import { CSVParser } from './CSVParser';

const prisma = new PrismaClient();

export class AmazonImportService {
  /**
   * Import a CSV file
   */
  static async importFile(
    userId: string,
    reportType: ReportType,
    fileName: string,
    content: string
  ): Promise<ImportResult> {
    // 1. Create import record
    const importRecord = await prisma.amazonReportImport.create({
      data: {
        userId,
        fileName,
        reportType,
        fileSize: Buffer.byteLength(content, 'utf8'),
        status: 'processing',
        startedAt: new Date(),
      },
    });

    try {
      let result: ImportResult;

      switch (reportType) {
        case 'orders':
          result = await this.importOrders(userId, importRecord.id, content);
          break;
        case 'earnings':
          result = await this.importEarnings(userId, importRecord.id, content);
          break;
        case 'daily_trends':
          result = await this.importDailyTrends(userId, importRecord.id, content);
          break;
        case 'tracking':
          result = await this.importTracking(userId, importRecord.id, content);
          break;
        case 'link_type':
          // Link type is informational only, no persistent storage needed
          result = {
            success: true,
            reportType: 'link_type',
            rowsTotal: 0,
            rowsImported: 0,
            rowsSkipped: 0,
            rowsFailed: 0,
            matchedDeals: 0,
            unmatchedDeals: 0,
            errors: [],
            periodStart: null,
            periodEnd: null,
          };
          break;
        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }

      // 2. Update import record
      await prisma.amazonReportImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          rowsTotal: result.rowsTotal,
          rowsImported: result.rowsImported,
          rowsSkipped: result.rowsSkipped,
          rowsFailed: result.rowsFailed,
          matchedDeals: result.matchedDeals,
          unmatchedDeals: result.unmatchedDeals,
          periodStart: result.periodStart,
          periodEnd: result.periodEnd,
          errors: result.errors.length > 0 ? result.errors : Prisma.DbNull,
        },
      });

      return result;
    } catch (error: any) {
      // Update as failed
      await prisma.amazonReportImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errors: [{ row: 0, error: error.message }],
        },
      });

      throw error;
    }
  }

  /**
   * Import Fee-Orders
   */
  private static async importOrders(
    userId: string,
    importId: string,
    content: string
  ): Promise<ImportResult> {
    const { rows, periodStart, periodEnd } = OrdersParser.parse(content);

    const result: ImportResult = {
      success: true,
      reportType: 'orders',
      rowsTotal: rows.length,
      rowsImported: 0,
      rowsSkipped: 0,
      rowsFailed: 0,
      matchedDeals: 0,
      unmatchedDeals: 0,
      errors: [],
      periodStart,
      periodEnd,
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Check for duplicate
        const isDuplicate = await DataMatcher.isOrderDuplicate(
          userId,
          row.asin,
          row.orderDate,
          row.trackingId
        );

        if (isDuplicate) {
          result.rowsSkipped++;
          continue;
        }

        // Try to match with ChannelDealHistory
        const match = await DataMatcher.findMatchingDeal(
          userId,
          row.asin,
          row.orderDate,
          row.trackingId
        );

        // Create order record
        await prisma.amazonOrder.create({
          data: {
            userId,
            importId,
            asin: row.asin,
            productTitle: row.productTitle,
            category: row.category,
            orderDate: row.orderDate,
            quantity: row.quantity,
            price: row.price,
            linkType: row.linkType,
            trackingId: row.trackingId,
            orderType: row.orderType,
            deviceType: row.deviceType,
            matchedDealId: match.dealHistoryId,
            matchConfidence: match.confidence,
          },
        });

        // Update ChannelDealHistory if matched
        if (match.matched && match.dealHistoryId) {
          await DataMatcher.updateDealWithOrderData(match.dealHistoryId, {
            conversions: row.quantity,
          });
          result.matchedDeals++;
        } else {
          result.unmatchedDeals++;
        }

        result.rowsImported++;
      } catch (error: any) {
        result.rowsFailed++;
        result.errors.push({ row: i + 1, error: error.message });
      }
    }

    return result;
  }

  /**
   * Import Fee-Earnings
   */
  private static async importEarnings(
    userId: string,
    importId: string,
    content: string
  ): Promise<ImportResult> {
    const { rows, periodStart, periodEnd } = EarningsParser.parse(content);

    const result: ImportResult = {
      success: true,
      reportType: 'earnings',
      rowsTotal: rows.length,
      rowsImported: 0,
      rowsSkipped: 0,
      rowsFailed: 0,
      matchedDeals: 0,
      unmatchedDeals: 0,
      errors: [],
      periodStart,
      periodEnd,
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Find existing order to update
        const existingOrder = await prisma.amazonOrder.findFirst({
          where: {
            userId,
            asin: row.asin,
            trackingId: row.trackingId,
          },
          orderBy: { orderDate: 'desc' },
        });

        if (existingOrder) {
          // Update with earnings data
          await prisma.amazonOrder.update({
            where: { id: existingOrder.id },
            data: {
              shippedDate: row.shippedDate,
              shippedQuantity: row.shippedQuantity,
              returns: row.returns,
              revenue: row.revenue,
              commission: row.commission,
              seller: row.seller,
              isDirectPurchase: row.isDirectPurchase,
            },
          });

          // Update ChannelDealHistory if matched
          if (existingOrder.matchedDealId) {
            await DataMatcher.updateDealWithOrderData(existingOrder.matchedDealId, {
              revenue: row.revenue,
              commissionEarned: row.commission,
            });
            result.matchedDeals++;
          }

          result.rowsImported++;
        } else {
          // Create new record with earnings data
          const match = await DataMatcher.findMatchingDeal(
            userId,
            row.asin,
            row.shippedDate,
            row.trackingId
          );

          await prisma.amazonOrder.create({
            data: {
              userId,
              importId,
              asin: row.asin,
              productTitle: row.productTitle,
              category: row.category,
              orderDate: row.shippedDate, // Use shipped date as order date
              quantity: row.shippedQuantity,
              price: row.price,
              trackingId: row.trackingId,
              shippedDate: row.shippedDate,
              shippedQuantity: row.shippedQuantity,
              returns: row.returns,
              revenue: row.revenue,
              commission: row.commission,
              seller: row.seller,
              isDirectPurchase: row.isDirectPurchase,
              matchedDealId: match.dealHistoryId,
              matchConfidence: match.confidence,
            },
          });

          if (match.matched && match.dealHistoryId) {
            await DataMatcher.updateDealWithOrderData(match.dealHistoryId, {
              revenue: row.revenue,
              commissionEarned: row.commission,
              conversions: row.shippedQuantity,
            });
            result.matchedDeals++;
          } else {
            result.unmatchedDeals++;
          }

          result.rowsImported++;
        }
      } catch (error: any) {
        result.rowsFailed++;
        result.errors.push({ row: i + 1, error: error.message });
      }
    }

    return result;
  }

  /**
   * Import Fee-DailyTrends
   */
  private static async importDailyTrends(
    userId: string,
    importId: string,
    content: string
  ): Promise<ImportResult> {
    const { rows, periodStart, periodEnd } = DailyTrendsParser.parse(content);

    const result: ImportResult = {
      success: true,
      reportType: 'daily_trends',
      rowsTotal: rows.length,
      rowsImported: 0,
      rowsSkipped: 0,
      rowsFailed: 0,
      matchedDeals: 0,
      unmatchedDeals: 0,
      errors: [],
      periodStart,
      periodEnd,
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        await prisma.amazonDailyStats.upsert({
          where: {
            userId_date: {
              userId,
              date: row.date,
            },
          },
          create: {
            userId,
            importId,
            date: row.date,
            clicks: row.clicks,
            ordersAmazon: row.ordersAmazon,
            orders3rdParty: row.orders3rdParty,
            ordersTotal: row.ordersTotal,
            conversionRate: row.conversionRate,
          },
          update: {
            clicks: row.clicks,
            ordersAmazon: row.ordersAmazon,
            orders3rdParty: row.orders3rdParty,
            ordersTotal: row.ordersTotal,
            conversionRate: row.conversionRate,
          },
        });

        result.rowsImported++;
      } catch (error: any) {
        result.rowsFailed++;
        result.errors.push({ row: i + 1, error: error.message });
      }
    }

    return result;
  }

  /**
   * Import Fee-Tracking
   */
  private static async importTracking(
    userId: string,
    importId: string,
    content: string
  ): Promise<ImportResult> {
    const { rows, periodStart, periodEnd } = TrackingParser.parse(content);

    const result: ImportResult = {
      success: true,
      reportType: 'tracking',
      rowsTotal: rows.length,
      rowsImported: 0,
      rowsSkipped: 0,
      rowsFailed: 0,
      matchedDeals: 0,
      unmatchedDeals: 0,
      errors: [],
      periodStart,
      periodEnd,
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        await prisma.amazonTrackingStats.upsert({
          where: {
            userId_trackingId_periodStart_periodEnd: {
              userId,
              trackingId: row.trackingId,
              periodStart: periodStart || new Date(),
              periodEnd: periodEnd || new Date(),
            },
          },
          create: {
            userId,
            importId,
            trackingId: row.trackingId,
            periodStart,
            periodEnd,
            clicks: row.clicks,
            orderedItems: row.orderedItems,
            shippedItems: row.shippedItems,
            revenue: row.revenue,
            commission: row.commission,
          },
          update: {
            clicks: row.clicks,
            orderedItems: row.orderedItems,
            shippedItems: row.shippedItems,
            revenue: row.revenue,
            commission: row.commission,
          },
        });

        result.rowsImported++;
      } catch (error: any) {
        result.rowsFailed++;
        result.errors.push({ row: i + 1, error: error.message });
      }
    }

    return result;
  }

  /**
   * Get import history for user
   */
  static async getImportHistory(userId: string, limit: number = 10) {
    return prisma.amazonReportImport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get aggregated stats from imported data
   */
  static async getImportedStats(userId: string) {
    const [orders, dailyStats, trackingStats, matchingStats] = await Promise.all([
      prisma.amazonOrder.aggregate({
        where: { userId },
        _count: true,
        _sum: {
          quantity: true,
          revenue: true,
          commission: true,
        },
      }),
      prisma.amazonDailyStats.aggregate({
        where: { userId },
        _sum: {
          clicks: true,
          ordersTotal: true,
        },
      }),
      prisma.amazonTrackingStats.findMany({
        where: { userId },
        select: {
          trackingId: true,
          clicks: true,
          orderedItems: true,
          commission: true,
        },
      }),
      DataMatcher.getMatchingStats(userId),
    ]);

    return {
      totalOrders: orders._count,
      totalQuantity: orders._sum.quantity || 0,
      totalRevenue: orders._sum.revenue || 0,
      totalCommission: orders._sum.commission || 0,
      totalClicks: dailyStats._sum.clicks || 0,
      conversionRate:
        dailyStats._sum.clicks && dailyStats._sum.ordersTotal
          ? (dailyStats._sum.ordersTotal / dailyStats._sum.clicks) * 100
          : 0,
      trackingIds: trackingStats,
      matching: matchingStats,
    };
  }

  /**
   * Auto-detect report type from file content
   */
  static detectReportType(content: string): ReportType | null {
    return CSVParser.detectReportType(content);
  }

  /**
   * Delete an import and all its related data
   */
  static async deleteImport(userId: string, importId: string): Promise<boolean> {
    const importRecord = await prisma.amazonReportImport.findFirst({
      where: { id: importId, userId },
    });

    if (!importRecord) {
      return false;
    }

    // Delete related orders
    await prisma.amazonOrder.deleteMany({
      where: { importId },
    });

    // Delete import record
    await prisma.amazonReportImport.delete({
      where: { id: importId },
    });

    return true;
  }
}

export default AmazonImportService;
