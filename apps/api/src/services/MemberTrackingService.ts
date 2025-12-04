/**
 * MemberTrackingService
 *
 * Tracks member counts for Telegram channels over time.
 * Provides growth metrics, trend analysis, and subscriber value calculations.
 */

import { PrismaClient } from '@prisma/client';
import { SecurityService } from './SecurityService';

const prisma = new PrismaClient();
const securityService = new SecurityService();

// Telegram Bot API response types
interface TelegramChatMemberCountResponse {
  ok: boolean;
  result?: number;
  description?: string;
}

/**
 * Subtract days from a date
 */
function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

export class MemberTrackingService {
  /**
   * Fetch member count from Telegram API
   */
  static async fetchMemberCount(
    botToken: string,
    telegramChannelId: string
  ): Promise<number | null> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getChatMemberCount?chat_id=${telegramChannelId}`
      );

      const data: TelegramChatMemberCountResponse = await response.json();

      if (data.ok && data.result !== undefined) {
        return data.result;
      }

      console.error(
        `[MemberTracking] Telegram API error for ${telegramChannelId}:`,
        data.description
      );
      return null;
    } catch (error) {
      console.error(`[MemberTracking] Fetch error for ${telegramChannelId}:`, error);
      return null;
    }
  }

  /**
   * Record member snapshot for a channel
   */
  static async recordMemberSnapshot(channelId: string): Promise<boolean> {
    // 1. Load channel with credential
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        channelId: true, // Telegram channel ID
        credential: {
          select: {
            key: true, // Encrypted bot token
          },
        },
      },
    });

    if (!channel || !channel.credential) {
      console.log(`[MemberTracking] No credential for channel ${channelId}`);
      return false;
    }

    // 2. Decrypt bot token
    let botToken: string;
    try {
      botToken = securityService.decrypt(channel.credential.key);
    } catch (error) {
      console.error(`[MemberTracking] Failed to decrypt bot token for ${channelId}`);
      return false;
    }

    // 3. Fetch member count from Telegram
    const memberCount = await this.fetchMemberCount(botToken, channel.channelId);

    if (memberCount === null) {
      return false;
    }

    // 4. Get previous snapshot to calculate delta
    const previousSnapshot = await prisma.channelMemberSnapshot.findFirst({
      where: { channelId },
      orderBy: { snapshotAt: 'desc' },
      select: { memberCount: true },
    });

    const delta = previousSnapshot ? memberCount - previousSnapshot.memberCount : null;

    const deltaPercent =
      previousSnapshot && previousSnapshot.memberCount > 0
        ? (delta! / previousSnapshot.memberCount) * 100
        : null;

    // 5. Create snapshot
    await prisma.channelMemberSnapshot.create({
      data: {
        channelId,
        memberCount,
        delta,
        deltaPercent,
        source: 'telegram_api',
      },
    });

    // 6. Update Channel with current count
    await prisma.channel.update({
      where: { id: channelId },
      data: {
        currentMemberCount: memberCount,
        memberCountUpdatedAt: new Date(),
      },
    });

    console.log(
      `[MemberTracking] Recorded ${memberCount} members for channel ${channelId} (${delta !== null ? (delta >= 0 ? '+' : '') + delta : 'first snapshot'})`
    );

    return true;
  }

  /**
   * Record snapshots for all active channels
   */
  static async recordAllChannelSnapshots(): Promise<{ success: number; failed: number }> {
    const channels = await prisma.channel.findMany({
      where: {
        credential: { isNot: null },
        platform: 'TELEGRAM',
      },
      select: { id: true },
    });

    let success = 0;
    let failed = 0;

    for (const channel of channels) {
      try {
        const recorded = await this.recordMemberSnapshot(channel.id);
        if (recorded) {
          success++;
        } else {
          failed++;
        }

        // Rate limiting: max 20 requests/second for Telegram
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[MemberTracking] Error for channel ${channel.id}:`, error);
        failed++;
      }
    }

    console.log(`[MemberTracking] Recorded snapshots: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Calculate growth metrics for a channel
   */
  static async calculateGrowthMetrics(channelId: string): Promise<{
    avgDailyGrowth: number;
    growthTrend: 'growing' | 'stable' | 'declining';
    growth30d: number;
    growthPercent30d: number;
  }> {
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Get snapshots for the last 30 days
    const snapshots = await prisma.channelMemberSnapshot.findMany({
      where: {
        channelId,
        snapshotAt: { gte: thirtyDaysAgo },
      },
      orderBy: { snapshotAt: 'asc' },
      select: {
        memberCount: true,
        delta: true,
        snapshotAt: true,
      },
    });

    if (snapshots.length < 2) {
      return {
        avgDailyGrowth: 0,
        growthTrend: 'stable',
        growth30d: 0,
        growthPercent30d: 0,
      };
    }

    // Calculate total growth
    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];
    const growth30d = lastSnapshot.memberCount - firstSnapshot.memberCount;
    const growthPercent30d =
      firstSnapshot.memberCount > 0 ? (growth30d / firstSnapshot.memberCount) * 100 : 0;

    // Calculate daily average
    const dailyChanges = snapshots.filter((s) => s.delta !== null).map((s) => s.delta!);

    const avgDailyGrowth =
      dailyChanges.length > 0
        ? dailyChanges.reduce((a, b) => a + b, 0) / dailyChanges.length
        : 0;

    // Determine trend
    let growthTrend: 'growing' | 'stable' | 'declining';
    if (avgDailyGrowth > 5) {
      growthTrend = 'growing';
    } else if (avgDailyGrowth < -5) {
      growthTrend = 'declining';
    } else {
      growthTrend = 'stable';
    }

    return {
      avgDailyGrowth,
      growthTrend,
      growth30d,
      growthPercent30d,
    };
  }

  /**
   * Update growth metrics in Channel
   */
  static async updateChannelGrowthMetrics(channelId: string): Promise<void> {
    const metrics = await this.calculateGrowthMetrics(channelId);

    // Calculate subscriber value
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        currentMemberCount: true,
        insights: {
          select: { totalRevenue: true },
        },
      },
    });

    const subscriberValue =
      channel?.currentMemberCount && channel.currentMemberCount > 0
        ? (channel.insights?.totalRevenue || 0) / channel.currentMemberCount
        : null;

    await prisma.channel.update({
      where: { id: channelId },
      data: {
        avgDailyGrowth: metrics.avgDailyGrowth,
        growthTrend: metrics.growthTrend,
        subscriberValue,
      },
    });

    // Also update ChannelInsights if it exists
    const insights = await prisma.channelInsights.findUnique({
      where: { channelId },
    });

    if (insights) {
      await prisma.channelInsights.update({
        where: { channelId },
        data: {
          memberGrowth30d: metrics.growth30d,
          memberGrowthPercent: metrics.growthPercent30d,
          subscriberValue,
        },
      });
    }
  }

  /**
   * Update metrics for all channels
   */
  static async updateAllChannelMetrics(): Promise<{ processed: number; errors: number }> {
    const channels = await prisma.channel.findMany({
      where: {
        platform: 'TELEGRAM',
        currentMemberCount: { not: null },
      },
      select: { id: true },
    });

    let processed = 0;
    let errors = 0;

    for (const channel of channels) {
      try {
        await this.updateChannelGrowthMetrics(channel.id);
        processed++;
      } catch (error) {
        console.error(`[MemberTracking] Error updating metrics for ${channel.id}:`, error);
        errors++;
      }
    }

    console.log(`[MemberTracking] Updated metrics for ${processed} channels (${errors} errors)`);
    return { processed, errors };
  }

  /**
   * Get member history for a channel (for charting)
   */
  static async getMemberHistory(
    channelId: string,
    days: number = 30
  ): Promise<Array<{ date: Date; memberCount: number; change: number | null }>> {
    const since = subDays(new Date(), days);

    const snapshots = await prisma.channelMemberSnapshot.findMany({
      where: {
        channelId,
        snapshotAt: { gte: since },
      },
      orderBy: { snapshotAt: 'asc' },
      select: {
        snapshotAt: true,
        memberCount: true,
        delta: true,
      },
    });

    return snapshots.map((s) => ({
      date: s.snapshotAt,
      memberCount: s.memberCount,
      change: s.delta,
    }));
  }

  /**
   * Get channel stats
   */
  static async getChannelStats(channelId: string): Promise<{
    currentMembers: number | null;
    lastUpdated: Date | null;
    avgDailyGrowth: number;
    growthTrend: 'growing' | 'stable' | 'declining';
    growth30d: number;
    growthPercent30d: number;
    subscriberValue: number | null;
  }> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        currentMemberCount: true,
        memberCountUpdatedAt: true,
        subscriberValue: true,
      },
    });

    const metrics = await this.calculateGrowthMetrics(channelId);

    return {
      currentMembers: channel?.currentMemberCount || null,
      lastUpdated: channel?.memberCountUpdatedAt || null,
      subscriberValue: channel?.subscriberValue || null,
      ...metrics,
    };
  }

  /**
   * Detect churn after posts (correlation between posting and unsubscribes)
   */
  static async detectChurnAfterPosts(channelId: string): Promise<number | null> {
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Get days with posts
    const postsPerDay = await prisma.channelDealHistory.groupBy({
      by: ['publishedAt'],
      where: {
        channelId,
        publishedAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    // Get member changes per day
    const memberChanges = await prisma.channelMemberSnapshot.findMany({
      where: {
        channelId,
        snapshotAt: { gte: thirtyDaysAgo },
        delta: { lt: 0 }, // Only days with negative growth
      },
      select: {
        snapshotAt: true,
        delta: true,
      },
    });

    // Simple correlation: days with many posts vs days with churn
    if (postsPerDay.length === 0 || memberChanges.length === 0) {
      return null;
    }

    // Calculate average churn on high-post days vs normal days
    const highPostDays = new Set(
      postsPerDay
        .filter((p) => p._count > 3) // Days with more than 3 posts
        .map((p) => new Date(p.publishedAt).toDateString())
    );

    const churnOnHighPostDays = memberChanges.filter((m) =>
      highPostDays.has(new Date(m.snapshotAt).toDateString())
    );

    if (churnOnHighPostDays.length === 0) {
      return 0; // No correlation
    }

    const avgChurnOnHighPostDays =
      churnOnHighPostDays.reduce((sum, m) => sum + Math.abs(m.delta!), 0) /
      churnOnHighPostDays.length;

    const avgChurnNormal =
      memberChanges.reduce((sum, m) => sum + Math.abs(m.delta!), 0) / memberChanges.length;

    // Return difference as percentage
    if (avgChurnNormal > 0) {
      return ((avgChurnOnHighPostDays - avgChurnNormal) / avgChurnNormal) * 100;
    }

    return null;
  }
}

export default MemberTrackingService;
