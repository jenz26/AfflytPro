/**
 * Email Report Cron Service
 *
 * Handles scheduled email reports:
 * - Weekly reports (Monday 9:00 AM user timezone)
 * - Daily summaries (9:00 AM user timezone, if enabled)
 */

import cron, { ScheduledTask } from 'node-cron';
import type { PrismaClient } from '@prisma/client';
import { NotificationService } from './NotificationService';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { captureException } from '../lib/sentry';

interface UserStats {
  revenue: number;
  clicks: number;
  conversions: number;
  cvr: number;
}

interface TopDeal {
  title: string;
  revenue: number;
  clicks: number;
}

interface ChannelBreakdown {
  name: string;
  revenue: number;
  percentage: number;
}

export class EmailReportCron {
  private prisma: PrismaClient;
  private weeklyJob: ScheduledTask | null = null;
  private dailyJob: ScheduledTask | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  start(): void {
    // Weekly report: Every Monday at 9:00 AM (server time)
    // Users will receive based on their timezone preference
    this.weeklyJob = cron.schedule('0 9 * * 1', async () => {
      console.log('[EmailReportCron] Running weekly report job...');
      await this.sendWeeklyReports();
    });

    // Daily summary: Every day at 9:00 AM (server time)
    this.dailyJob = cron.schedule('0 9 * * *', async () => {
      console.log('[EmailReportCron] Running daily summary job...');
      await this.sendDailySummaries();
    });

    console.log('[EmailReportCron] Started - Weekly (Mon 9AM), Daily (9AM)');
  }

  stop(): void {
    if (this.weeklyJob) {
      this.weeklyJob.stop();
      this.weeklyJob = null;
    }
    if (this.dailyJob) {
      this.dailyJob.stop();
      this.dailyJob = null;
    }
    console.log('[EmailReportCron] Stopped');
  }

  // ============================================
  // WEEKLY REPORTS
  // ============================================

  async sendWeeklyReports(): Promise<void> {
    try {
      // Get users who have weekly reports enabled
      const users = await this.prisma.user.findMany({
        where: {
          emailPrefs_weeklyReport: true,
          isActive: true,
          emailVerified: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailPrefs_timezone: true,
        },
      });

      console.log(`[EmailReportCron] Sending weekly reports to ${users.length} users`);

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          // Check if it's 9 AM in user's timezone
          if (!this.isTimeInTimezone(9, user.emailPrefs_timezone)) {
            continue;
          }

          const stats = await this.getUserWeeklyStats(user.id);

          // Skip if user has no activity
          if (stats.clicks === 0 && stats.revenue === 0) {
            continue;
          }

          const weekRange = this.getWeekRange();
          const topDeals = await this.getTopDeals(user.id, 7);
          const channelBreakdown = await this.getChannelBreakdown(user.id, 7);
          const comparison = await this.getWeeklyComparison(user.id);
          const insight = this.generateInsight(stats, channelBreakdown);

          await NotificationService.send(
            user.id,
            NotificationType.WEEKLY_REPORT,
            {
              locale: 'it',
              weekRange,
              stats,
              topDeals,
              channelBreakdown,
              comparison,
              insight,
            },
            [NotificationChannel.EMAIL]
          );

          // Update last sent timestamp
          await this.prisma.user.update({
            where: { id: user.id },
            data: { lastWeeklyReportAt: new Date() },
          });

          sent++;
        } catch (error) {
          console.error(`[EmailReportCron] Failed to send weekly report to ${user.email}:`, error);
          failed++;
          captureException(error as Error, {
            component: 'EmailReportCron',
            operation: 'sendWeeklyReport',
            userId: user.id,
          });
        }
      }

      console.log(`[EmailReportCron] Weekly reports: ${sent} sent, ${failed} failed`);
    } catch (error) {
      console.error('[EmailReportCron] Error in sendWeeklyReports:', error);
      captureException(error as Error, {
        component: 'EmailReportCron',
        operation: 'sendWeeklyReports',
      });
    }
  }

  // ============================================
  // DAILY SUMMARIES
  // ============================================

  async sendDailySummaries(): Promise<void> {
    try {
      // Get users who have daily digest enabled
      const users = await this.prisma.user.findMany({
        where: {
          emailPrefs_dailyDigest: true,
          isActive: true,
          emailVerified: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailPrefs_timezone: true,
        },
      });

      console.log(`[EmailReportCron] Sending daily summaries to ${users.length} users`);

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          // Check if it's 9 AM in user's timezone
          if (!this.isTimeInTimezone(9, user.emailPrefs_timezone)) {
            continue;
          }

          const stats = await this.getUserDailyStats(user.id);

          // Skip if user has no activity
          if (stats.clicks === 0 && stats.revenue === 0) {
            continue;
          }

          const date = this.getYesterdayDate();
          const topLink = await this.getTopLink(user.id);
          const insight = this.generateDailyInsight(stats);

          await NotificationService.send(
            user.id,
            NotificationType.DAILY_REPORT,
            {
              locale: 'it',
              date,
              stats,
              topLink,
              insight,
            },
            [NotificationChannel.EMAIL]
          );

          // Update last sent timestamp
          await this.prisma.user.update({
            where: { id: user.id },
            data: { lastDailyDigestAt: new Date() },
          });

          sent++;
        } catch (error) {
          console.error(`[EmailReportCron] Failed to send daily summary to ${user.email}:`, error);
          failed++;
          captureException(error as Error, {
            component: 'EmailReportCron',
            operation: 'sendDailySummary',
            userId: user.id,
          });
        }
      }

      console.log(`[EmailReportCron] Daily summaries: ${sent} sent, ${failed} failed`);
    } catch (error) {
      console.error('[EmailReportCron] Error in sendDailySummaries:', error);
      captureException(error as Error, {
        component: 'EmailReportCron',
        operation: 'sendDailySummaries',
      });
    }
  }

  // ============================================
  // STATS HELPERS
  // ============================================

  private async getUserWeeklyStats(userId: string): Promise<UserStats> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get clicks from the last 7 days
    const clicksResult = await this.prisma.click.count({
      where: {
        link: { userId },
        clickedAt: { gte: weekAgo },
      },
    });

    // Get conversions with revenue
    const conversionsResult = await this.prisma.conversion.aggregate({
      where: {
        link: { userId },
        convertedAt: { gte: weekAgo },
      },
      _count: true,
      _sum: { commission: true },
    });

    const clicks = clicksResult || 0;
    const conversions = conversionsResult._count || 0;
    const revenue = conversionsResult._sum.commission || 0;
    const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;

    return {
      revenue,
      clicks,
      conversions,
      cvr,
    };
  }

  private async getUserDailyStats(userId: string): Promise<Omit<UserStats, 'cvr'>> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clicksResult = await this.prisma.click.count({
      where: {
        link: { userId },
        clickedAt: { gte: yesterday, lt: today },
      },
    });

    const conversionsResult = await this.prisma.conversion.aggregate({
      where: {
        link: { userId },
        convertedAt: { gte: yesterday, lt: today },
      },
      _count: true,
      _sum: { commission: true },
    });

    return {
      revenue: conversionsResult._sum.commission || 0,
      clicks: clicksResult || 0,
      conversions: conversionsResult._count || 0,
    };
  }

  private async getTopDeals(userId: string, days: number): Promise<TopDeal[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get top links by click count
    const topLinks = await this.prisma.click.groupBy({
      by: ['linkId'],
      where: {
        link: { userId },
        clickedAt: { gte: since },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const deals: TopDeal[] = [];

    for (const link of topLinks) {
      const affiliateLink = await this.prisma.affiliateLink.findUnique({
        where: { id: link.linkId },
        include: { product: { select: { title: true } } },
      });

      if (affiliateLink) {
        const conversions = await this.prisma.conversion.aggregate({
          where: {
            linkId: link.linkId,
            convertedAt: { gte: since },
          },
          _count: true,
          _sum: { commission: true },
        });

        deals.push({
          title: affiliateLink.product?.title || 'Unknown Product',
          clicks: link._count.id,
          revenue: conversions._sum.commission || 0,
        });
      }
    }

    return deals;
  }

  private async getChannelBreakdown(userId: string, days: number): Promise<ChannelBreakdown[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Group clicks by UTM source
    const channelStats = await this.prisma.click.groupBy({
      by: ['utmSource'],
      where: {
        link: { userId },
        clickedAt: { gte: since },
      },
      _count: { id: true },
    });

    const totalClicks = channelStats.reduce((sum: number, ch: { _count: { id: number } }) => sum + ch._count.id, 0);

    return channelStats.map((ch: { utmSource: string | null; _count: { id: number } }) => ({
      name: ch.utmSource || 'Direct',
      revenue: totalClicks > 0 ? (ch._count.id / totalClicks) * 100 * 0.25 : 0,
      percentage: totalClicks > 0 ? Math.round((ch._count.id / totalClicks) * 100) : 0,
    }));
  }

  private async getWeeklyComparison(userId: string): Promise<{ revenueChange: number; clicksChange: number }> {
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);

    const thisWeekClicks = await this.prisma.click.count({
      where: {
        link: { userId },
        clickedAt: { gte: thisWeekStart },
      },
    });

    const lastWeekClicks = await this.prisma.click.count({
      where: {
        link: { userId },
        clickedAt: { gte: lastWeekStart, lt: thisWeekStart },
      },
    });

    const clicksChange = lastWeekClicks > 0
      ? Math.round(((thisWeekClicks - lastWeekClicks) / lastWeekClicks) * 100)
      : 0;

    // Revenue change is proportional to clicks change for simplicity
    return {
      revenueChange: clicksChange,
      clicksChange,
    };
  }

  private async getTopLink(userId: string): Promise<TopDeal | undefined> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const topLink = await this.prisma.click.groupBy({
      by: ['linkId'],
      where: {
        link: { userId },
        clickedAt: { gte: yesterday, lt: today },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    });

    if (topLink.length === 0) return undefined;

    const affiliateLink = await this.prisma.affiliateLink.findUnique({
      where: { id: topLink[0].linkId },
      include: { product: { select: { title: true } } },
    });

    const conversions = await this.prisma.conversion.aggregate({
      where: {
        linkId: topLink[0].linkId,
        convertedAt: { gte: yesterday, lt: today },
      },
      _count: true,
      _sum: { commission: true },
    });

    return {
      title: affiliateLink?.product?.title || 'Unknown Product',
      clicks: topLink[0]._count.id,
      revenue: conversions._sum.commission || 0,
    };
  }

  // ============================================
  // UTILITIES
  // ============================================

  private isTimeInTimezone(hour: number, timezone: string): boolean {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      });
      const userHour = parseInt(formatter.format(now), 10);
      return userHour === hour;
    } catch {
      // Default to server time if timezone is invalid
      return new Date().getHours() === hour;
    }
  }

  private getWeekRange(): string {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    const formatDate = (d: Date) => {
      return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  private getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  private generateInsight(stats: UserStats, channels: ChannelBreakdown[]): string {
    if (channels.length === 0) return '';

    const topChannel = channels.reduce((max, ch) =>
      ch.percentage > max.percentage ? ch : max, channels[0]);

    if (topChannel.percentage > 70) {
      return `${topChannel.name} ha generato l'${topChannel.percentage}% del traffico. Considera di diversificare i canali.`;
    }

    if (stats.cvr > 5) {
      return `Ottimo CVR del ${stats.cvr.toFixed(1)}%! Il tuo pubblico è molto coinvolto.`;
    }

    if (stats.cvr < 1) {
      return `CVR al ${stats.cvr.toFixed(1)}%. Prova a migliorare le descrizioni dei prodotti.`;
    }

    return '';
  }

  private generateDailyInsight(stats: Omit<UserStats, 'cvr'>): string {
    if (stats.conversions > 5) {
      return `Giornata eccezionale con ${stats.conversions} conversioni!`;
    }

    if (stats.clicks > 100) {
      return `Ottimo traffico oggi con ${stats.clicks} click!`;
    }

    return '';
  }

  // ============================================
  // MANUAL TRIGGERS (for testing)
  // ============================================

  async sendTestWeeklyReport(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, emailPrefs_timezone: true },
      });

      if (!user) return false;

      const stats = await this.getUserWeeklyStats(userId);
      const weekRange = this.getWeekRange();
      const topDeals = await this.getTopDeals(userId, 7);
      const channelBreakdown = await this.getChannelBreakdown(userId, 7);
      const comparison = await this.getWeeklyComparison(userId);
      const insight = this.generateInsight(stats, channelBreakdown);

      const result = await NotificationService.send(
        userId,
        NotificationType.WEEKLY_REPORT,
        {
          locale: 'it',
          weekRange,
          stats: stats.clicks === 0 && stats.revenue === 0
            ? { revenue: 125.50, clicks: 1234, conversions: 45, cvr: 3.6 }
            : stats,
          topDeals: topDeals.length > 0 ? topDeals : [
            { title: 'Apple AirPods Pro (2nd Gen)', revenue: 45.20, clicks: 234 },
            { title: 'Samsung Galaxy Watch 6', revenue: 32.10, clicks: 189 },
            { title: 'Logitech MX Master 3S', revenue: 28.50, clicks: 156 },
          ],
          channelBreakdown: channelBreakdown.length > 0 ? channelBreakdown : [
            { name: 'Telegram', revenue: 82.50, percentage: 65 },
            { name: 'Email', revenue: 28.00, percentage: 22 },
            { name: 'Direct', revenue: 15.00, percentage: 13 },
          ],
          comparison: comparison.clicksChange !== 0 ? comparison : { revenueChange: 15, clicksChange: 12 },
          insight: insight || 'Telegram ha generato il 65% del traffico questa settimana!',
        },
        [NotificationChannel.EMAIL]
      );

      return result.success;
    } catch (error) {
      console.error('[EmailReportCron] Test weekly report failed:', error);
      return false;
    }
  }

  async sendTestDailySummary(userId: string): Promise<boolean> {
    try {
      const stats = await this.getUserDailyStats(userId);
      const date = this.getYesterdayDate();
      const topLink = await this.getTopLink(userId);
      const insight = this.generateDailyInsight(stats);

      const result = await NotificationService.send(
        userId,
        NotificationType.DAILY_REPORT,
        {
          locale: 'it',
          date,
          stats: stats.clicks === 0
            ? { revenue: 18.75, clicks: 156, conversions: 7 }
            : stats,
          topLink: topLink || { title: 'Apple AirPods Pro (2nd Gen)', revenue: 8.50, clicks: 42 },
          insight: insight || 'Ottimo traffico oggi con 156 click!',
        },
        [NotificationChannel.EMAIL]
      );

      return result.success;
    } catch (error) {
      console.error('[EmailReportCron] Test daily summary failed:', error);
      return false;
    }
  }
}
