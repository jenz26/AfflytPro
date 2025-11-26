import { FastifyInstance } from 'fastify';
import { AnalyticsService } from '../services/AnalyticsService';
import prisma from '../lib/prisma';

// Helper to calculate percentage change
function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// Helper to determine trend
function getTrend(change: number): 'up' | 'down' | 'stable' {
  if (change > 2) return 'up';
  if (change < -2) return 'down';
  return 'stable';
}

export default async function analyticsRoutes(app: FastifyInstance) {
  // Track event (allow anonymous)
  app.post('/track', async (req, reply) => {
    const { sessionId, eventName, eventCategory, properties, userAgent, referrer } = req.body as any;

    let userId: string | undefined;
    try {
      const decoded = await req.jwtVerify() as any;
      userId = decoded.userId;
    } catch {
      // Anonymous OK
    }

    await AnalyticsService.trackEvent({
      userId,
      sessionId,
      eventName,
      eventCategory,
      properties,
      userAgent,
      referrer,
      ip: req.ip
    });

    return { success: true };
  });

  // Get funnel (admin only - add role check later)
  app.get('/funnel', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const { from, to } = req.query as any;

    const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = to ? new Date(to) : new Date();

    const metrics = await AnalyticsService.getFunnelMetrics(dateFrom, dateTo);
    const dropOff = await AnalyticsService.getDropOffAnalysis(dateFrom, dateTo);

    return { metrics, dropOff };
  });

  // Get my progress
  app.get('/my-progress', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;

    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId }
    });

    return progress;
  });

  // ==================== NEW ANALYTICS ENDPOINTS ====================

  /**
   * GET /analytics/overview
   * Returns KPI overview: revenue, clicks, CVR, EPC with trends
   */
  app.get('/overview', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '7d' } = req.query as { period?: string };

    // Calculate date ranges
    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const now = new Date();
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get user's affiliate links
    const userLinks = await prisma.affiliateLink.findMany({
      where: { userId },
      select: { id: true }
    });
    const linkIds = userLinks.map(l => l.id);

    if (linkIds.length === 0) {
      return {
        revenue: { current: 0, change: 0, trend: 'stable' as const },
        clicks: { current: 0, change: 0, trend: 'stable' as const },
        cvr: { current: 0, change: 0, benchmark: 4.2, trend: 'stable' as const },
        epc: { current: 0, change: 0, industry: 0.32, trend: 'stable' as const },
        conversions: { current: 0, change: 0, trend: 'stable' as const },
        period: periodDays
      };
    }

    // Current period stats
    const [currentClicks, currentConversions] = await Promise.all([
      prisma.click.count({
        where: {
          linkId: { in: linkIds },
          clickedAt: { gte: startDate }
        }
      }),
      prisma.conversion.findMany({
        where: {
          linkId: { in: linkIds },
          convertedAt: { gte: startDate }
        },
        select: { revenue: true, commission: true }
      })
    ]);

    // Previous period stats
    const [prevClicks, prevConversions] = await Promise.all([
      prisma.click.count({
        where: {
          linkId: { in: linkIds },
          clickedAt: { gte: prevStartDate, lt: startDate }
        }
      }),
      prisma.conversion.findMany({
        where: {
          linkId: { in: linkIds },
          convertedAt: { gte: prevStartDate, lt: startDate }
        },
        select: { revenue: true, commission: true }
      })
    ]);

    // Calculate metrics
    const currentRevenue = currentConversions.reduce((sum, c) => sum + (c.commission || c.revenue * 0.05), 0);
    const prevRevenue = prevConversions.reduce((sum, c) => sum + (c.commission || c.revenue * 0.05), 0);

    const currentCvr = currentClicks > 0 ? (currentConversions.length / currentClicks) * 100 : 0;
    const prevCvr = prevClicks > 0 ? (prevConversions.length / prevClicks) * 100 : 0;

    const currentEpc = currentClicks > 0 ? currentRevenue / currentClicks : 0;
    const prevEpc = prevClicks > 0 ? prevRevenue / prevClicks : 0;

    const revenueChange = calcChange(currentRevenue, prevRevenue);
    const clicksChange = calcChange(currentClicks, prevClicks);
    const cvrChange = calcChange(currentCvr, prevCvr);
    const epcChange = calcChange(currentEpc, prevEpc);
    const conversionsChange = calcChange(currentConversions.length, prevConversions.length);

    return {
      revenue: {
        current: Math.round(currentRevenue * 100) / 100,
        change: revenueChange,
        trend: getTrend(revenueChange)
      },
      clicks: {
        current: currentClicks,
        change: clicksChange,
        trend: getTrend(clicksChange)
      },
      cvr: {
        current: Math.round(currentCvr * 100) / 100,
        change: Math.round(cvrChange * 10) / 10,
        benchmark: 4.2,
        trend: getTrend(cvrChange)
      },
      epc: {
        current: Math.round(currentEpc * 100) / 100,
        change: Math.round(epcChange * 100) / 100,
        industry: 0.32,
        trend: getTrend(epcChange)
      },
      conversions: {
        current: currentConversions.length,
        change: conversionsChange,
        trend: getTrend(conversionsChange)
      },
      period: periodDays
    };
  });

  /**
   * GET /analytics/time-series
   * Returns data for charts (revenue and clicks over time)
   */
  app.get('/time-series', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '7d', granularity = 'day' } = req.query as { period?: string; granularity?: string };

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const now = new Date();
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get user's links
    const userLinks = await prisma.affiliateLink.findMany({
      where: { userId },
      select: { id: true }
    });
    const linkIds = userLinks.map(l => l.id);

    if (linkIds.length === 0) {
      return { data: [], period: periodDays };
    }

    // Get clicks with timestamps
    const clicks = await prisma.click.findMany({
      where: {
        linkId: { in: linkIds },
        clickedAt: { gte: startDate }
      },
      select: { clickedAt: true }
    });

    // Get conversions with timestamps
    const conversions = await prisma.conversion.findMany({
      where: {
        linkId: { in: linkIds },
        convertedAt: { gte: startDate }
      },
      select: { convertedAt: true, revenue: true, commission: true }
    });

    // Group by day
    const dataMap = new Map<string, { clicks: number; revenue: number; conversions: number }>();

    // Initialize all days
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      dataMap.set(key, { clicks: 0, revenue: 0, conversions: 0 });
    }

    // Aggregate clicks
    clicks.forEach(c => {
      const key = c.clickedAt.toISOString().split('T')[0];
      const entry = dataMap.get(key);
      if (entry) entry.clicks++;
    });

    // Aggregate conversions
    conversions.forEach(c => {
      const key = c.convertedAt.toISOString().split('T')[0];
      const entry = dataMap.get(key);
      if (entry) {
        entry.conversions++;
        entry.revenue += c.commission || c.revenue * 0.05;
      }
    });

    // Convert to array
    const data = Array.from(dataMap.entries())
      .map(([date, values]) => ({
        date,
        clicks: values.clicks,
        revenue: Math.round(values.revenue * 100) / 100,
        conversions: values.conversions
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { data, period: periodDays };
  });

  /**
   * GET /analytics/top-links
   * Returns top performing links
   */
  app.get('/top-links', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '7d', limit = 5, sortBy = 'clicks' } = req.query as {
      period?: string;
      limit?: number;
      sortBy?: 'clicks' | 'revenue' | 'cvr';
    };

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get links with aggregated stats
    const links = await prisma.affiliateLink.findMany({
      where: { userId },
      include: {
        product: {
          select: { title: true, imageUrl: true, asin: true }
        },
        clickRecords: {
          where: { clickedAt: { gte: startDate } },
          select: { id: true }
        },
        conversions: {
          where: { convertedAt: { gte: startDate } },
          select: { revenue: true, commission: true }
        }
      }
    });

    // Calculate metrics for each link
    const linksWithMetrics = links.map(link => {
      const clicks = link.clickRecords.length;
      const conversions = link.conversions.length;
      const revenue = link.conversions.reduce((sum, c) => sum + (c.commission || c.revenue * 0.05), 0);
      const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const epc = clicks > 0 ? revenue / clicks : 0;

      return {
        id: link.id,
        shortCode: link.shortCode,
        shortUrl: link.shortUrl,
        product: {
          title: link.product.title,
          imageUrl: link.product.imageUrl,
          asin: link.product.asin
        },
        metrics: {
          clicks,
          conversions,
          revenue: Math.round(revenue * 100) / 100,
          cvr: Math.round(cvr * 100) / 100,
          epc: Math.round(epc * 100) / 100
        }
      };
    });

    // Sort by selected metric
    const sorted = linksWithMetrics.sort((a, b) => {
      if (sortBy === 'revenue') return b.metrics.revenue - a.metrics.revenue;
      if (sortBy === 'cvr') return b.metrics.cvr - a.metrics.cvr;
      return b.metrics.clicks - a.metrics.clicks;
    });

    return {
      links: sorted.slice(0, Number(limit)),
      total: links.length,
      period: periodDays
    };
  });

  /**
   * GET /analytics/channels
   * Returns performance breakdown by channel/source
   */
  app.get('/channels', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '7d' } = req.query as { period?: string };

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get ShortLinks with source tracking
    const shortLinks = await prisma.shortLink.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      select: {
        source: true,
        clicks: true,
        conversions: true
      }
    });

    // Group by source
    const channelMap = new Map<string, { clicks: number; conversions: number; links: number }>();

    shortLinks.forEach(link => {
      const source = link.source || 'direct';
      const entry = channelMap.get(source) || { clicks: 0, conversions: 0, links: 0 };
      entry.clicks += link.clicks;
      entry.conversions += link.conversions;
      entry.links++;
      channelMap.set(source, entry);
    });

    // Also get from AffiliateLinks (which track through Click/Conversion models)
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: { userId },
      include: {
        clickRecords: {
          where: { clickedAt: { gte: startDate } }
        },
        conversions: {
          where: { convertedAt: { gte: startDate } },
          select: { revenue: true, commission: true }
        }
      }
    });

    // Calculate totals for percentage
    let totalClicks = 0;
    let totalRevenue = 0;

    const channels = Array.from(channelMap.entries()).map(([channel, data]) => {
      // Estimate revenue (would need to join with conversions properly in production)
      const estimatedRevenue = data.conversions * 15; // Assume €15 avg commission
      totalClicks += data.clicks;
      totalRevenue += estimatedRevenue;

      return {
        channel,
        clicks: data.clicks,
        conversions: data.conversions,
        revenue: estimatedRevenue,
        links: data.links,
        cvr: data.clicks > 0 ? Math.round((data.conversions / data.clicks) * 1000) / 10 : 0,
        epc: data.clicks > 0 ? Math.round((estimatedRevenue / data.clicks) * 100) / 100 : 0
      };
    });

    // Add percentage
    const channelsWithPercent = channels.map(ch => ({
      ...ch,
      clicksPercent: totalClicks > 0 ? Math.round((ch.clicks / totalClicks) * 100) : 0,
      revenuePercent: totalRevenue > 0 ? Math.round((ch.revenue / totalRevenue) * 100) : 0
    }));

    // Sort by clicks
    channelsWithPercent.sort((a, b) => b.clicks - a.clicks);

    return {
      channels: channelsWithPercent,
      totals: {
        clicks: totalClicks,
        revenue: Math.round(totalRevenue * 100) / 100
      },
      period: periodDays
    };
  });

  /**
   * GET /analytics/heatmap
   * Returns click data grouped by hour and day of week
   */
  app.get('/heatmap', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '30d' } = req.query as { period?: string };

    const periodDays = period === '30d' ? 30 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get user's links
    const userLinks = await prisma.affiliateLink.findMany({
      where: { userId },
      select: { id: true }
    });
    const linkIds = userLinks.map(l => l.id);

    if (linkIds.length === 0) {
      return { heatmap: [], bestTime: null, period: periodDays };
    }

    // Get all clicks
    const clicks = await prisma.click.findMany({
      where: {
        linkId: { in: linkIds },
        clickedAt: { gte: startDate }
      },
      select: { clickedAt: true }
    });

    // Build heatmap data
    const heatmapData: { [key: string]: number } = {};
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Initialize all cells
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmapData[`${day}-${hour}`] = 0;
      }
    }

    // Count clicks
    clicks.forEach(c => {
      const day = c.clickedAt.getDay();
      const hour = c.clickedAt.getHours();
      heatmapData[`${day}-${hour}`]++;
    });

    // Find best time
    let maxClicks = 0;
    let bestTime = { day: 0, hour: 0 };
    Object.entries(heatmapData).forEach(([key, count]) => {
      if (count > maxClicks) {
        maxClicks = count;
        const [day, hour] = key.split('-').map(Number);
        bestTime = { day, hour };
      }
    });

    // Convert to array format
    const heatmap = Object.entries(heatmapData).map(([key, value]) => {
      const [day, hour] = key.split('-').map(Number);
      return {
        day: days[day],
        dayIndex: day,
        hour,
        value,
        intensity: maxClicks > 0 ? Math.round((value / maxClicks) * 100) : 0
      };
    });

    return {
      heatmap,
      bestTime: maxClicks > 0 ? {
        day: days[bestTime.day],
        hour: bestTime.hour,
        clicks: maxClicks
      } : null,
      totalClicks: clicks.length,
      period: periodDays
    };
  });
}
