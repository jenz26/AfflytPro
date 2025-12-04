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

// Filter params interface
interface AnalyticsFilterParams {
  channelId?: string;
  amazonTag?: string;
  category?: string;
  dealScoreMin?: number;
  dealScoreMax?: number;
}

// Helper to parse filter params from query
function parseFilterParams(query: any): AnalyticsFilterParams {
  return {
    channelId: query.channelId || undefined,
    amazonTag: query.amazonTag || undefined,
    category: query.category || undefined,
    dealScoreMin: query.dealScoreMin ? Number(query.dealScoreMin) : undefined,
    dealScoreMax: query.dealScoreMax ? Number(query.dealScoreMax) : undefined
  };
}

// Helper to build link filter with params
async function getFilteredLinkIds(
  prismaClient: typeof prisma,
  userId: string,
  filters: AnalyticsFilterParams
): Promise<string[]> {
  const whereClause: any = { userId };

  if (filters.channelId) {
    whereClause.channelId = filters.channelId;
  }

  if (filters.amazonTag) {
    whereClause.amazonTag = filters.amazonTag;
  }

  // For category and dealScore (using dealConfidence), we need to filter through the product relation
  const needsProductFilter = filters.category || filters.dealScoreMin !== undefined || filters.dealScoreMax !== undefined;

  const links = await prismaClient.affiliateLink.findMany({
    where: whereClause,
    select: {
      id: true
    },
    ...(needsProductFilter ? {
      include: {
        product: {
          select: {
            category: true,
            dealConfidence: true
          }
        }
      }
    } : {})
  }) as Array<{ id: string; product?: { category: string; dealConfidence: number | null } | null }>;

  // Apply category and dealScore filters in memory
  let filteredLinks = links;

  if (filters.category) {
    filteredLinks = filteredLinks.filter(l => l.product?.category === filters.category);
  }

  if (filters.dealScoreMin !== undefined) {
    filteredLinks = filteredLinks.filter(l =>
      l.product?.dealConfidence !== null &&
      l.product?.dealConfidence !== undefined &&
      l.product.dealConfidence >= filters.dealScoreMin!
    );
  }

  if (filters.dealScoreMax !== undefined) {
    filteredLinks = filteredLinks.filter(l =>
      l.product?.dealConfidence !== null &&
      l.product?.dealConfidence !== undefined &&
      l.product.dealConfidence <= filters.dealScoreMax!
    );
  }

  return filteredLinks.map(l => l.id);
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
   * Supports filters: channelId, amazonTag, category, dealScoreMin, dealScoreMax
   */
  app.get('/overview', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '7d' } = req.query as { period?: string };
    const filters = parseFilterParams(req.query);

    // Calculate date ranges
    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const now = new Date();
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get filtered affiliate link IDs
    const linkIds = await getFilteredLinkIds(prisma, userId, filters);

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
   * Supports filters: channelId, amazonTag, category, dealScoreMin, dealScoreMax
   */
  app.get('/time-series', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '7d', granularity = 'day' } = req.query as { period?: string; granularity?: string };
    const filters = parseFilterParams(req.query);

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const now = new Date();
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get filtered link IDs
    const linkIds = await getFilteredLinkIds(prisma, userId, filters);

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
   * Supports filters: channelId, amazonTag, category, dealScoreMin, dealScoreMax
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
    const filters = parseFilterParams(req.query);

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get filtered link IDs
    const filteredLinkIds = await getFilteredLinkIds(prisma, userId, filters);

    if (filteredLinkIds.length === 0) {
      return { links: [], total: 0, period: periodDays };
    }

    // Get links with aggregated stats
    const links = await prisma.affiliateLink.findMany({
      where: { id: { in: filteredLinkIds } },
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
        product: link.product ? {
          title: link.product.title,
          imageUrl: link.product.imageUrl,
          asin: link.product.asin
        } : null,
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
   * Uses UTM params when available, falls back to link's channelId
   * Supports filters: channelId, amazonTag, category, dealScoreMin, dealScoreMax
   */
  app.get('/channels', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '7d' } = req.query as { period?: string };
    const filters = parseFilterParams(req.query);

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get filtered links WITH channelId for fallback attribution
    const filteredLinkIds = await getFilteredLinkIds(prisma, userId, filters);

    // Get links with channelId
    const userLinks = await prisma.affiliateLink.findMany({
      where: { id: { in: filteredLinkIds } },
      select: { id: true, channelId: true }
    });
    const linkIds = userLinks.map(l => l.id);

    // Build a map of linkId -> channelId for fallback
    const linkChannelMap = new Map<string, string>();
    userLinks.forEach(l => {
      if (l.channelId) {
        linkChannelMap.set(l.id, l.channelId);
      }
    });

    if (linkIds.length === 0) {
      return {
        channels: [],
        totals: { clicks: 0, revenue: 0 },
        period: periodDays
      };
    }

    // Get all user's channels for name/platform lookup
    const userChannels = await prisma.channel.findMany({
      where: { userId },
      select: { id: true, name: true, platform: true }
    });
    const channelInfoMap = new Map(userChannels.map(c => [c.id, { name: c.name, platform: c.platform }]));

    // Get clicks with UTM data
    const clicks = await prisma.click.findMany({
      where: {
        linkId: { in: linkIds },
        clickedAt: { gte: startDate },
        isBot: false // Exclude bot clicks
      },
      select: {
        utmSource: true,
        utmMedium: true,
        linkId: true
      }
    });

    // Get conversions for revenue calculation
    const conversions = await prisma.conversion.findMany({
      where: {
        linkId: { in: linkIds },
        convertedAt: { gte: startDate }
      },
      select: {
        linkId: true,
        revenue: true,
        commission: true
      }
    });

    // Group clicks by channel
    // Priority: 1. UTM params, 2. Link's channelId, 3. 'direct'
    const channelMap = new Map<string, {
      clicks: number;
      conversions: number;
      revenue: number;
      linkIds: Set<string>;
      channelName: string;
      platform: string;
    }>();

    clicks.forEach(click => {
      let channelKey = 'direct';
      let channelName = 'Direct';
      let platform = 'direct';

      // Priority 1: UTM params (new clicks after UTM fix)
      if (click.utmMedium && click.utmSource) {
        platform = click.utmMedium.toLowerCase();
        channelName = click.utmSource;
        channelKey = `${platform}:${channelName}`;
      }
      // Priority 2: Link's channelId (fallback for old clicks)
      else if (linkChannelMap.has(click.linkId)) {
        const chId = linkChannelMap.get(click.linkId)!;
        const chInfo = channelInfoMap.get(chId);
        if (chInfo) {
          platform = chInfo.platform.toLowerCase();
          channelName = chInfo.name;
          channelKey = `${platform}:${channelName}`;
        }
      }
      // Priority 3: Direct (no attribution)

      const entry = channelMap.get(channelKey) || {
        clicks: 0,
        conversions: 0,
        revenue: 0,
        linkIds: new Set<string>(),
        channelName,
        platform
      };
      entry.clicks++;
      entry.linkIds.add(click.linkId);
      channelMap.set(channelKey, entry);
    });

    // Add conversion data
    conversions.forEach(conv => {
      // Find which channel this conversion belongs to (by linkId)
      let attributed = false;
      channelMap.forEach((data) => {
        if (data.linkIds.has(conv.linkId)) {
          data.conversions++;
          data.revenue += conv.commission || conv.revenue * 0.05;
          attributed = true;
        }
      });
      // If not attributed, add to direct
      if (!attributed) {
        const direct = channelMap.get('direct') || {
          clicks: 0,
          conversions: 0,
          revenue: 0,
          linkIds: new Set<string>(),
          channelName: 'Direct',
          platform: 'direct'
        };
        direct.conversions++;
        direct.revenue += conv.commission || conv.revenue * 0.05;
        channelMap.set('direct', direct);
      }
    });

    // Calculate totals
    let totalClicks = 0;
    let totalRevenue = 0;

    const channels = Array.from(channelMap.entries()).map(([key, data]) => {
      totalClicks += data.clicks;
      totalRevenue += data.revenue;

      // Format display name: "ChannelName (platform)" or just "Direct"
      const displayName = data.platform === 'direct'
        ? 'Direct'
        : `${data.channelName} (${data.platform})`;

      return {
        channel: data.platform, // Use platform for icon matching
        displayName,
        channelNames: [data.channelName],
        clicks: data.clicks,
        conversions: data.conversions,
        revenue: Math.round(data.revenue * 100) / 100,
        links: data.linkIds.size,
        cvr: data.clicks > 0 ? Math.round((data.conversions / data.clicks) * 1000) / 10 : 0,
        epc: data.clicks > 0 ? Math.round((data.revenue / data.clicks) * 100) / 100 : 0
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
   * Supports filters: channelId, amazonTag, category, dealScoreMin, dealScoreMax
   */
  app.get('/heatmap', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '30d' } = req.query as { period?: string };
    const filters = parseFilterParams(req.query);

    const periodDays = period === '30d' ? 30 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get filtered link IDs
    const linkIds = await getFilteredLinkIds(prisma, userId, filters);

    if (linkIds.length === 0) {
      return { heatmap: [], bestTime: null, totalClicks: 0, period: periodDays };
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

  /**
   * GET /analytics/products
   * Returns product performance by category and price range
   * Supports filters: channelId, amazonTag, category, dealScoreMin, dealScoreMax
   */
  app.get('/products', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '7d' } = req.query as { period?: string };
    const filters = parseFilterParams(req.query);

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get filtered link IDs
    const filteredLinkIds = await getFilteredLinkIds(prisma, userId, filters);

    if (filteredLinkIds.length === 0) {
      return {
        byCategory: [],
        byPriceRange: [],
        topPerformers: [],
        totals: { products: 0, clicks: 0, revenue: 0 },
        period: periodDays
      };
    }

    // Get links with product info and performance data
    const links = await prisma.affiliateLink.findMany({
      where: { id: { in: filteredLinkIds } },
      include: {
        product: {
          select: {
            asin: true,
            title: true,
            category: true,
            currentPrice: true,
            imageUrl: true
          }
        },
        clickRecords: {
          where: {
            clickedAt: { gte: startDate },
            isBot: false // Exclude bot clicks
          },
          select: { id: true }
        },
        conversions: {
          where: { convertedAt: { gte: startDate } },
          select: { revenue: true, commission: true }
        }
      }
    });

    // Calculate metrics per link (include all links with clicks, even without product)
    const productMetrics = links
      .filter(link => link.clickRecords.length > 0 || link.conversions.length > 0)
      .map(link => {
        const clicks = link.clickRecords.length;
        const conversions = link.conversions.length;
        const revenue = link.conversions.reduce((sum, c) => sum + (c.commission || c.revenue * 0.05), 0);

        // Use link title/shortCode if no product
        const title = link.product?.title || link.shortCode || 'Direct Link';

        return {
          asin: link.product?.asin || link.shortCode || '',
          title,
          category: link.product?.category || 'Uncategorized',
          price: link.product?.currentPrice || 0,
          imageUrl: link.product?.imageUrl,
          clicks,
          conversions,
          revenue: Math.round(revenue * 100) / 100,
          cvr: clicks > 0 ? Math.round((conversions / clicks) * 1000) / 10 : 0,
          epc: clicks > 0 ? Math.round((revenue / clicks) * 100) / 100 : 0
        };
      });

    // Group by category
    const categoryMap = new Map<string, { clicks: number; conversions: number; revenue: number; products: number }>();
    productMetrics.forEach(p => {
      const cat = p.category || 'Other';
      const entry = categoryMap.get(cat) || { clicks: 0, conversions: 0, revenue: 0, products: 0 };
      entry.clicks += p.clicks;
      entry.conversions += p.conversions;
      entry.revenue += p.revenue;
      entry.products++;
      categoryMap.set(cat, entry);
    });

    const byCategory = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        ...data,
        revenue: Math.round(data.revenue * 100) / 100,
        cvr: data.clicks > 0 ? Math.round((data.conversions / data.clicks) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate total for percentages
    const totalRevenue = byCategory.reduce((sum, c) => sum + c.revenue, 0);
    const categoriesWithPercent = byCategory.map(c => ({
      ...c,
      percent: totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0
    }));

    // Group by price range
    const priceRanges = [
      { label: '€0-25', min: 0, max: 25 },
      { label: '€25-50', min: 25, max: 50 },
      { label: '€50-100', min: 50, max: 100 },
      { label: '€100-200', min: 100, max: 200 },
      { label: '€200+', min: 200, max: Infinity }
    ];

    const byPriceRange = priceRanges.map(range => {
      const products = productMetrics.filter(p => p.price >= range.min && p.price < range.max);
      const clicks = products.reduce((sum, p) => sum + p.clicks, 0);
      const conversions = products.reduce((sum, p) => sum + p.conversions, 0);
      const revenue = products.reduce((sum, p) => sum + p.revenue, 0);

      return {
        range: range.label,
        clicks,
        conversions,
        revenue: Math.round(revenue * 100) / 100,
        products: products.length,
        cvr: clicks > 0 ? Math.round((conversions / clicks) * 1000) / 10 : 0
      };
    });

    // Top performers
    const topPerformers = [...productMetrics]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      byCategory: categoriesWithPercent,
      byPriceRange,
      topPerformers,
      totals: {
        products: productMetrics.length,
        clicks: productMetrics.reduce((sum, p) => sum + p.clicks, 0),
        revenue: Math.round(totalRevenue * 100) / 100
      },
      period: periodDays
    };
  });

  /**
   * GET /analytics/insights
   * Returns AI-generated insights based on user's data patterns
   * PRO feature - requires tier check
   */
  app.get('/insights', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '30d' } = req.query as { period?: string };

    // Check user plan (PRO feature)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    if (!user || user.plan === 'FREE') {
      return reply.status(403).send({
        error: 'PRO_REQUIRED',
        message: 'AI Insights is a PRO feature. Upgrade to access personalized recommendations.'
      });
    }

    const periodDays = period === '30d' ? 30 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get user's links
    const userLinks = await prisma.affiliateLink.findMany({
      where: { userId },
      include: {
        product: { select: { title: true, category: true, currentPrice: true } },
        clickRecords: {
          where: { clickedAt: { gte: prevStartDate } },
          select: { clickedAt: true }
        },
        conversions: {
          where: { convertedAt: { gte: prevStartDate } },
          select: { convertedAt: true, revenue: true, commission: true }
        }
      }
    });

    if (userLinks.length === 0) {
      return {
        insights: [{
          type: 'info',
          category: 'getting_started',
          title: 'Get Started with Affiliate Links',
          description: 'Create your first affiliate links to start receiving personalized AI insights.',
          priority: 'high',
          actionable: true,
          action: { label: 'Create Link', href: '/dashboard/links/new' }
        }],
        score: 0,
        period: periodDays
      };
    }

    const insights: Array<{
      type: 'success' | 'warning' | 'info' | 'opportunity';
      category: string;
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      actionable: boolean;
      action?: { label: string; href: string };
      metric?: { value: number; unit: string; trend?: 'up' | 'down' };
    }> = [];

    // Calculate current and previous period metrics
    const currentClicks = userLinks.reduce((sum, l) =>
      sum + l.clickRecords.filter(c => c.clickedAt >= startDate).length, 0);
    const prevClicks = userLinks.reduce((sum, l) =>
      sum + l.clickRecords.filter(c => c.clickedAt < startDate).length, 0);

    const currentConversions = userLinks.reduce((sum, l) =>
      sum + l.conversions.filter(c => c.convertedAt >= startDate).length, 0);
    const prevConversions = userLinks.reduce((sum, l) =>
      sum + l.conversions.filter(c => c.convertedAt < startDate).length, 0);

    const currentRevenue = userLinks.reduce((sum, l) =>
      sum + l.conversions
        .filter(c => c.convertedAt >= startDate)
        .reduce((s, c) => s + (c.commission || c.revenue * 0.05), 0), 0);
    const prevRevenue = userLinks.reduce((sum, l) =>
      sum + l.conversions
        .filter(c => c.convertedAt < startDate)
        .reduce((s, c) => s + (c.commission || c.revenue * 0.05), 0), 0);

    const currentCvr = currentClicks > 0 ? (currentConversions / currentClicks) * 100 : 0;
    const prevCvr = prevClicks > 0 ? (prevConversions / prevClicks) * 100 : 0;

    // Insight 1: Revenue Trend
    const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    if (revenueChange > 20) {
      insights.push({
        type: 'success',
        category: 'revenue',
        title: 'Revenue Growing Strong',
        description: `Your revenue has increased by ${Math.round(revenueChange)}% compared to the previous period. Keep promoting the same products and channels!`,
        priority: 'high',
        actionable: false,
        metric: { value: Math.round(revenueChange), unit: '%', trend: 'up' }
      });
    } else if (revenueChange < -20) {
      insights.push({
        type: 'warning',
        category: 'revenue',
        title: 'Revenue Declining',
        description: `Your revenue has dropped by ${Math.abs(Math.round(revenueChange))}%. Consider refreshing your content or trying different products.`,
        priority: 'high',
        actionable: true,
        action: { label: 'View Top Products', href: '/dashboard/analytics?tab=products' },
        metric: { value: Math.abs(Math.round(revenueChange)), unit: '%', trend: 'down' }
      });
    }

    // Insight 2: CVR Analysis
    const benchmarkCvr = 4.2;
    if (currentCvr > benchmarkCvr * 1.5) {
      insights.push({
        type: 'success',
        category: 'conversion',
        title: 'Exceptional Conversion Rate',
        description: `Your CVR of ${currentCvr.toFixed(1)}% is ${Math.round((currentCvr / benchmarkCvr - 1) * 100)}% above the industry benchmark. Your audience trusts your recommendations!`,
        priority: 'medium',
        actionable: false,
        metric: { value: parseFloat(currentCvr.toFixed(1)), unit: '%' }
      });
    } else if (currentCvr < benchmarkCvr * 0.5 && currentClicks > 50) {
      insights.push({
        type: 'warning',
        category: 'conversion',
        title: 'Low Conversion Rate',
        description: `Your CVR of ${currentCvr.toFixed(1)}% is below the ${benchmarkCvr}% benchmark. Try promoting products more relevant to your audience.`,
        priority: 'high',
        actionable: true,
        action: { label: 'Analyze Channels', href: '/dashboard/analytics?tab=channels' }
      });
    }

    // Insight 3: Best performing category
    const categoryMap = new Map<string, { clicks: number; conversions: number; revenue: number }>();
    userLinks.forEach(link => {
      const cat = link.product?.category || 'Other';
      const entry = categoryMap.get(cat) || { clicks: 0, conversions: 0, revenue: 0 };
      entry.clicks += link.clickRecords.filter(c => c.clickedAt >= startDate).length;
      entry.conversions += link.conversions.filter(c => c.convertedAt >= startDate).length;
      entry.revenue += link.conversions
        .filter(c => c.convertedAt >= startDate)
        .reduce((s, c) => s + (c.commission || c.revenue * 0.05), 0);
      categoryMap.set(cat, entry);
    });

    const categories = Array.from(categoryMap.entries())
      .filter(([_, data]) => data.clicks > 0)
      .map(([category, data]) => ({
        category,
        ...data,
        cvr: data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    if (categories.length >= 2) {
      const bestCategory = categories[0];
      const worstCategory = categories[categories.length - 1];

      if (bestCategory.cvr > worstCategory.cvr * 2 && worstCategory.clicks > 20) {
        insights.push({
          type: 'opportunity',
          category: 'optimization',
          title: `Focus on ${bestCategory.category}`,
          description: `${bestCategory.category} products convert ${Math.round(bestCategory.cvr / worstCategory.cvr)}x better than ${worstCategory.category}. Consider shifting focus to higher-converting categories.`,
          priority: 'medium',
          actionable: true,
          action: { label: 'View Category Stats', href: '/dashboard/analytics?tab=products' }
        });
      }
    }

    // Insight 4: Click timing optimization
    const clicksByHour = new Array(24).fill(0);
    userLinks.forEach(link => {
      link.clickRecords.forEach(click => {
        if (click.clickedAt >= startDate) {
          clicksByHour[click.clickedAt.getHours()]++;
        }
      });
    });

    const maxHour = clicksByHour.indexOf(Math.max(...clicksByHour));
    const totalClicks = clicksByHour.reduce((a, b) => a + b, 0);
    const peakPercent = totalClicks > 0 ? (clicksByHour[maxHour] / totalClicks) * 100 : 0;

    if (peakPercent > 15 && totalClicks > 50) {
      insights.push({
        type: 'info',
        category: 'timing',
        title: 'Optimal Posting Time',
        description: `Your audience is most active around ${maxHour}:00. Schedule your posts during this window for maximum engagement.`,
        priority: 'low',
        actionable: true,
        action: { label: 'View Heatmap', href: '/dashboard/analytics?tab=time' }
      });
    }

    // Insight 5: Underperforming links opportunity
    const underperformers = userLinks
      .filter(l => {
        const clicks = l.clickRecords.filter(c => c.clickedAt >= startDate).length;
        const conversions = l.conversions.filter(c => c.convertedAt >= startDate).length;
        return clicks > 30 && conversions === 0;
      });

    if (underperformers.length > 0) {
      insights.push({
        type: 'warning',
        category: 'links',
        title: `${underperformers.length} Links Need Attention`,
        description: `You have ${underperformers.length} link${underperformers.length > 1 ? 's' : ''} with clicks but no conversions. Consider updating the products or targeting.`,
        priority: 'medium',
        actionable: true,
        action: { label: 'View Links', href: '/dashboard/links' }
      });
    }

    // Insight 6: Growth opportunity
    if (currentClicks > 100 && currentConversions > 0 && insights.length < 3) {
      const estimatedPotential = Math.round(currentRevenue * 1.5);
      insights.push({
        type: 'opportunity',
        category: 'growth',
        title: 'Unlock More Revenue',
        description: `Based on your current performance, you could earn up to €${estimatedPotential} by expanding to more channels. Try Telegram or Discord for new audiences.`,
        priority: 'low',
        actionable: true,
        action: { label: 'Add Channel', href: '/dashboard/channels' }
      });
    }

    // Calculate health score (0-100)
    let score = 50; // Base score
    if (currentRevenue > 0) score += 10;
    if (currentCvr >= benchmarkCvr) score += 15;
    if (revenueChange > 0) score += 10;
    if (underperformers.length === 0) score += 10;
    if (currentClicks > 100) score += 5;
    score = Math.min(100, Math.max(0, score));

    // Sort insights by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return {
      insights: insights.slice(0, 6), // Max 6 insights
      score,
      summary: {
        totalLinks: userLinks.length,
        activeLinks: userLinks.filter(l => l.clickRecords.some(c => c.clickedAt >= startDate)).length,
        totalClicks: currentClicks,
        totalConversions: currentConversions,
        totalRevenue: Math.round(currentRevenue * 100) / 100,
        cvr: Math.round(currentCvr * 100) / 100
      },
      period: periodDays
    };
  });

  /**
   * GET /analytics/audience
   * Returns audience analytics: device breakdown, geo distribution, browser/OS stats
   * Based on Click tracking data
   * Supports filters: channelId, amazonTag, category, dealScoreMin, dealScoreMax
   */
  app.get('/audience', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '7d' } = req.query as { period?: string };
    const filters = parseFilterParams(req.query);

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get filtered link IDs
    const linkIds = await getFilteredLinkIds(prisma, userId, filters);

    if (linkIds.length === 0) {
      return {
        devices: [],
        browsers: [],
        operatingSystems: [],
        countries: [],
        languages: [],
        connections: [],
        visitors: { total: 0, unique: 0, returning: 0, botClicks: 0 },
        screens: { mobile: 0, tablet: 0, desktop: 0 },
        period: periodDays
      };
    }

    // Get all clicks with tracking data
    const clicks = await prisma.click.findMany({
      where: {
        linkId: { in: linkIds },
        clickedAt: { gte: startDate }
      },
      select: {
        deviceType: true,
        browser: true,
        browserVersion: true,
        os: true,
        osVersion: true,
        screenWidth: true,
        screenHeight: true,
        country: true,
        countryName: true,
        region: true,
        city: true,
        language: true,
        timezone: true,
        connectionType: true,
        connectionSpeed: true,
        visitorId: true,
        isUniqueVisitor: true,
        isBot: true
      }
    });

    const totalClicks = clicks.length;

    // Filter out bot clicks for accurate stats
    const humanClicks = clicks.filter(c => !c.isBot);
    const botClicks = clicks.filter(c => c.isBot).length;

    // Device Type Distribution
    const deviceMap = new Map<string, number>();
    humanClicks.forEach(c => {
      const device = c.deviceType || 'unknown';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });

    const devices = Array.from(deviceMap.entries())
      .map(([device, count]) => ({
        device,
        count,
        percent: humanClicks.length > 0 ? Math.round((count / humanClicks.length) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Browser Distribution
    const browserMap = new Map<string, number>();
    humanClicks.forEach(c => {
      const browser = c.browser || 'unknown';
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    });

    const browsers = Array.from(browserMap.entries())
      .map(([browser, count]) => ({
        browser,
        count,
        percent: humanClicks.length > 0 ? Math.round((count / humanClicks.length) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    // OS Distribution
    const osMap = new Map<string, number>();
    humanClicks.forEach(c => {
      const os = c.os || 'unknown';
      osMap.set(os, (osMap.get(os) || 0) + 1);
    });

    const operatingSystems = Array.from(osMap.entries())
      .map(([os, count]) => ({
        os,
        count,
        percent: humanClicks.length > 0 ? Math.round((count / humanClicks.length) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    // Country Distribution
    const countryMap = new Map<string, { count: number; name: string }>();
    humanClicks.forEach(c => {
      if (c.country) {
        const entry = countryMap.get(c.country) || { count: 0, name: c.countryName || c.country };
        entry.count++;
        countryMap.set(c.country, entry);
      }
    });

    const countries = Array.from(countryMap.entries())
      .map(([code, data]) => ({
        code,
        name: data.name,
        count: data.count,
        percent: humanClicks.length > 0 ? Math.round((data.count / humanClicks.length) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Top 15

    // Language Distribution
    const langMap = new Map<string, number>();
    humanClicks.forEach(c => {
      if (c.language) {
        // Extract base language (e.g., "it" from "it-IT")
        const baseLang = c.language.split('-')[0];
        langMap.set(baseLang, (langMap.get(baseLang) || 0) + 1);
      }
    });

    const languages = Array.from(langMap.entries())
      .map(([language, count]) => ({
        language,
        count,
        percent: humanClicks.length > 0 ? Math.round((count / humanClicks.length) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    // Connection Type Distribution
    const connMap = new Map<string, number>();
    humanClicks.forEach(c => {
      if (c.connectionType) {
        connMap.set(c.connectionType, (connMap.get(c.connectionType) || 0) + 1);
      }
    });

    const connections = Array.from(connMap.entries())
      .map(([type, count]) => ({
        type,
        count,
        percent: humanClicks.length > 0 ? Math.round((count / humanClicks.length) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Visitor Stats
    const uniqueVisitors = new Set(humanClicks.map(c => c.visitorId).filter(Boolean)).size;
    const uniqueClickCount = humanClicks.filter(c => c.isUniqueVisitor).length;

    // Screen Size Categories
    const screenCategories = { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
    humanClicks.forEach(c => {
      if (c.screenWidth) {
        if (c.screenWidth < 768) screenCategories.mobile++;
        else if (c.screenWidth < 1024) screenCategories.tablet++;
        else screenCategories.desktop++;
      } else {
        // Fallback to deviceType
        if (c.deviceType === 'mobile') screenCategories.mobile++;
        else if (c.deviceType === 'tablet') screenCategories.tablet++;
        else if (c.deviceType === 'desktop') screenCategories.desktop++;
        else screenCategories.unknown++;
      }
    });

    // Top Regions (within countries)
    const regionMap = new Map<string, { count: number; country: string }>();
    humanClicks.forEach(c => {
      if (c.region && c.country) {
        const key = `${c.country}:${c.region}`;
        const entry = regionMap.get(key) || { count: 0, country: c.country };
        entry.count++;
        regionMap.set(key, entry);
      }
    });

    const regions = Array.from(regionMap.entries())
      .map(([key, data]) => {
        const [country, region] = key.split(':');
        return {
          region,
          country,
          count: data.count,
          percent: humanClicks.length > 0 ? Math.round((data.count / humanClicks.length) * 1000) / 10 : 0
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    // Top Cities
    const cityMap = new Map<string, { count: number; country: string; region: string }>();
    humanClicks.forEach(c => {
      if (c.city && c.country) {
        const key = `${c.country}:${c.city}`;
        const entry = cityMap.get(key) || { count: 0, country: c.country, region: c.region || '' };
        entry.count++;
        cityMap.set(key, entry);
      }
    });

    const cities = Array.from(cityMap.entries())
      .map(([key, data]) => {
        const [country, city] = key.split(':');
        return {
          city,
          country,
          region: data.region,
          count: data.count,
          percent: humanClicks.length > 0 ? Math.round((data.count / humanClicks.length) * 1000) / 10 : 0
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    return {
      devices,
      browsers,
      operatingSystems,
      countries,
      regions,
      cities,
      languages,
      connections,
      visitors: {
        total: humanClicks.length,
        unique: uniqueVisitors,
        returning: humanClicks.length - uniqueClickCount,
        botClicks
      },
      screens: {
        mobile: screenCategories.mobile,
        tablet: screenCategories.tablet,
        desktop: screenCategories.desktop
      },
      period: periodDays
    };
  });

  /**
   * GET /analytics/export
   * Export analytics data as CSV or JSON
   */
  app.get('/export', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '30d', format = 'csv' } = req.query as { period?: string; format?: 'csv' | 'json' };

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get user's links with full data
    const links = await prisma.affiliateLink.findMany({
      where: { userId },
      include: {
        product: {
          select: { title: true, asin: true, category: true, currentPrice: true }
        },
        clickRecords: {
          where: { clickedAt: { gte: startDate } },
          select: { clickedAt: true }
        },
        conversions: {
          where: { convertedAt: { gte: startDate } },
          select: { convertedAt: true, revenue: true, commission: true }
        }
      }
    });

    // Build export data
    const exportData = links.map(link => {
      const clicks = link.clickRecords.length;
      const conversions = link.conversions.length;
      const revenue = link.conversions.reduce((sum: number, c: { commission: number | null; revenue: number }) =>
        sum + (c.commission || c.revenue * 0.05), 0);
      const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const epc = clicks > 0 ? revenue / clicks : 0;

      return {
        shortCode: link.shortCode,
        shortUrl: link.shortUrl,
        productTitle: link.product?.title || 'N/A',
        productAsin: link.product?.asin || 'N/A',
        category: link.product?.category || 'N/A',
        price: link.product?.currentPrice || 0,
        clicks,
        conversions,
        revenue: Math.round(revenue * 100) / 100,
        cvr: Math.round(cvr * 100) / 100,
        epc: Math.round(epc * 100) / 100,
        createdAt: link.createdAt.toISOString().split('T')[0]
      };
    });

    if (format === 'json') {
      return {
        period: periodDays,
        exportedAt: new Date().toISOString(),
        totalLinks: exportData.length,
        data: exportData
      };
    }

    // Generate CSV
    const headers = [
      'Short Code',
      'Short URL',
      'Product Title',
      'ASIN',
      'Category',
      'Price (€)',
      'Clicks',
      'Conversions',
      'Revenue (€)',
      'CVR (%)',
      'EPC (€)',
      'Created At'
    ];

    const csvRows = [
      headers.join(','),
      ...exportData.map(row => [
        row.shortCode,
        row.shortUrl,
        `"${(row.productTitle || '').replace(/"/g, '""')}"`,
        row.productAsin,
        row.category,
        row.price,
        row.clicks,
        row.conversions,
        row.revenue,
        row.cvr,
        row.epc,
        row.createdAt
      ].join(','))
    ];

    const csv = csvRows.join('\n');

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', `attachment; filename="afflyt-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv"`);

    return csv;
  });

  /**
   * GET /analytics/deal-score
   * Returns deal score analytics: distribution, correlation with conversions, top deals
   * Supports filters: channelId, amazonTag, category, dealScoreMin, dealScoreMax
   */
  app.get('/deal-score', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '7d' } = req.query as { period?: string };
    const filters = parseFilterParams(req.query);

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get filtered link IDs
    const filteredLinkIds = await getFilteredLinkIds(prisma, userId, filters);

    if (filteredLinkIds.length === 0) {
      return {
        distribution: [],
        scoreConversionCorrelation: [],
        topScoringDeals: [],
        scoreTrends: [],
        summary: {
          avgScore: 0,
          totalDeals: 0,
          dealsAbove80: 0,
          dealsAbove90: 0,
          bestPerformingScoreRange: 'N/A'
        },
        period: periodDays
      };
    }

    // Get links with product deal scores and performance data
    const links = await prisma.affiliateLink.findMany({
      where: { id: { in: filteredLinkIds } },
      include: {
        product: {
          select: {
            asin: true,
            title: true,
            dealConfidence: true,
            discount: true,
            imageUrl: true
          }
        },
        clickRecords: {
          where: {
            clickedAt: { gte: startDate },
            isBot: false
          },
          select: { id: true }
        },
        conversions: {
          where: { convertedAt: { gte: startDate } },
          select: { revenue: true, commission: true }
        }
      }
    });

    // Filter links with valid deal scores
    const linksWithScores = links.filter(l => l.product?.dealConfidence !== null && l.product?.dealConfidence !== undefined);

    // Score distribution (0-20, 21-40, 41-60, 61-80, 81-100)
    const scoreRanges = [
      { label: '0-20', min: 0, max: 20 },
      { label: '21-40', min: 21, max: 40 },
      { label: '41-60', min: 41, max: 60 },
      { label: '61-80', min: 61, max: 80 },
      { label: '81-100', min: 81, max: 100 }
    ];

    const distribution = scoreRanges.map(range => {
      const count = linksWithScores.filter(l =>
        l.product!.dealConfidence! >= range.min && l.product!.dealConfidence! <= range.max
      ).length;
      return {
        range: range.label,
        count,
        percentage: linksWithScores.length > 0 ? Math.round((count / linksWithScores.length) * 100) : 0
      };
    });

    // Score vs conversion correlation
    const scoreConversionCorrelation = scoreRanges.map(range => {
      const rangeLinks = linksWithScores.filter(l =>
        l.product!.dealConfidence! >= range.min && l.product!.dealConfidence! <= range.max
      );

      const totalClicks = rangeLinks.reduce((sum, l) => sum + l.clickRecords.length, 0);
      const totalConversions = rangeLinks.reduce((sum, l) => sum + l.conversions.length, 0);
      const totalRevenue = rangeLinks.reduce((sum, l) =>
        sum + l.conversions.reduce((s, c) => s + (c.commission || c.revenue * 0.05), 0), 0
      );

      const avgClicks = rangeLinks.length > 0 ? totalClicks / rangeLinks.length : 0;
      const avgConversions = rangeLinks.length > 0 ? totalConversions / rangeLinks.length : 0;
      const avgRevenue = rangeLinks.length > 0 ? totalRevenue / rangeLinks.length : 0;
      const cvr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      return {
        scoreRange: range.label,
        avgClicks: Math.round(avgClicks * 10) / 10,
        avgConversions: Math.round(avgConversions * 10) / 10,
        avgRevenue: Math.round(avgRevenue * 100) / 100,
        cvr: Math.round(cvr * 100) / 100,
        totalLinks: rangeLinks.length
      };
    });

    // Top scoring deals (sorted by score, with performance data)
    const topScoringDeals = linksWithScores
      .map(link => ({
        productId: link.product!.asin,
        title: link.product!.title || 'Unknown',
        asin: link.product!.asin,
        score: link.product!.dealConfidence!,
        discount: link.product!.discount || 0,
        imageUrl: link.product!.imageUrl,
        clicks: link.clickRecords.length,
        conversions: link.conversions.length,
        revenue: Math.round(link.conversions.reduce((s, c) => s + (c.commission || c.revenue * 0.05), 0) * 100) / 100
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Score trends over time (from ChannelDealHistory if available, otherwise aggregate by day)
    const dealHistory = await prisma.channelDealHistory.findMany({
      where: {
        channel: { userId },
        publishedAt: { gte: startDate }
      },
      orderBy: { publishedAt: 'asc' }
    });

    // Get unique ASINs from deal history and fetch their deal confidence scores
    const historyAsins = [...new Set(dealHistory.map(d => d.asin))];
    const productsForHistory = await prisma.product.findMany({
      where: { asin: { in: historyAsins } },
      select: { asin: true, dealConfidence: true }
    });
    const asinToScore = new Map(
      productsForHistory
        .filter(p => p.dealConfidence !== null)
        .map(p => [p.asin, p.dealConfidence!])
    );

    // Group by day
    const trendMap = new Map<string, { scores: number[]; count: number }>();

    dealHistory.forEach(deal => {
      const score = asinToScore.get(deal.asin);
      if (score !== undefined) {
        const date = deal.publishedAt.toISOString().split('T')[0];
        const entry = trendMap.get(date) || { scores: [], count: 0 };
        entry.scores.push(score);
        entry.count++;
        trendMap.set(date, entry);
      }
    });

    const scoreTrends = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        maxScore: Math.max(...data.scores),
        dealsFound: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Summary stats
    const allScores = linksWithScores.map(l => l.product!.dealConfidence!);
    const avgScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    const dealsAbove80 = allScores.filter(s => s >= 80).length;
    const dealsAbove90 = allScores.filter(s => s >= 90).length;

    // Find best performing score range (by CVR)
    const bestRange = scoreConversionCorrelation
      .filter(r => r.totalLinks > 0)
      .sort((a, b) => b.cvr - a.cvr)[0];

    return {
      distribution,
      scoreConversionCorrelation,
      topScoringDeals,
      scoreTrends,
      summary: {
        avgScore,
        totalDeals: linksWithScores.length,
        dealsAbove80,
        dealsAbove90,
        bestPerformingScoreRange: bestRange?.scoreRange || 'N/A'
      },
      period: periodDays
    };
  });

  /**
   * GET /analytics/filters
   * Returns available filter options for the analytics page
   */
  app.get('/filters', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;

    // Get user's channels
    const channels = await prisma.channel.findMany({
      where: { userId },
      select: { id: true, name: true, platform: true },
      orderBy: { name: 'asc' }
    });

    // Get unique Amazon tags from user's links
    const links = await prisma.affiliateLink.findMany({
      where: { userId },
      select: { amazonTag: true },
      distinct: ['amazonTag']
    });
    const tags = [...new Set(links.map(l => l.amazonTag).filter(Boolean))].sort();

    // Get unique categories from products linked to user's affiliate links
    const productsWithCategories = await prisma.affiliateLink.findMany({
      where: { userId },
      select: {
        product: {
          select: { category: true }
        }
      }
    });
    const categories = [...new Set(
      productsWithCategories
        .map(l => l.product?.category)
        .filter(Boolean)
    )].sort() as string[];

    // Get deal score range from products
    const productStats = await prisma.product.aggregate({
      _min: { dealConfidence: true },
      _max: { dealConfidence: true },
      _avg: { dealConfidence: true }
    });

    return {
      channels,
      tags,
      categories,
      dealScoreRange: {
        min: productStats._min.dealConfidence ?? 0,
        max: productStats._max.dealConfidence ?? 100,
        avg: Math.round(productStats._avg.dealConfidence ?? 50)
      }
    };
  });

  /**
   * GET /analytics/telegram-channels
   * Returns detailed analytics per Telegram channel
   * Uses telegramChannelId tracking from clicks
   */
  app.get('/telegram-channels', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '7d' } = req.query as { period?: string };

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get user's links
    const userLinks = await prisma.affiliateLink.findMany({
      where: { userId },
      select: { id: true }
    });
    const linkIds = userLinks.map(l => l.id);

    if (linkIds.length === 0) {
      return {
        channels: [],
        totals: { clicks: 0, uniqueClicks: 0, conversions: 0, revenue: 0 },
        period: periodDays
      };
    }

    // Get clicks with Telegram tracking data
    const clicks = await prisma.click.findMany({
      where: {
        linkId: { in: linkIds },
        clickedAt: { gte: startDate },
        telegramChannelId: { not: null },
        isBot: false
      },
      select: {
        telegramChannelId: true,
        telegramMessageId: true,
        postTimestamp: true,
        clickedAt: true,
        isUniqueVisitor: true,
        linkId: true
      }
    });

    // Get conversions for these links
    const conversions = await prisma.conversion.findMany({
      where: {
        linkId: { in: linkIds },
        convertedAt: { gte: startDate }
      },
      select: {
        linkId: true,
        revenue: true,
        commission: true
      }
    });

    // Build conversion map by linkId
    const conversionMap = new Map<string, { count: number; revenue: number }>();
    conversions.forEach(c => {
      const entry = conversionMap.get(c.linkId) || { count: 0, revenue: 0 };
      entry.count++;
      entry.revenue += c.commission || c.revenue * 0.05;
      conversionMap.set(c.linkId, entry);
    });

    // Get user's channels for name lookup
    const userChannels = await prisma.channel.findMany({
      where: { userId, platform: 'TELEGRAM' },
      select: { channelId: true, name: true }
    });
    const channelNameMap = new Map(userChannels.map(c => [c.channelId, c.name]));

    // Group by Telegram channel
    const channelMap = new Map<string, {
      clicks: number;
      uniqueClicks: number;
      linkIds: Set<string>;
      messageIds: Set<string>;
      timeToClicks: number[]; // in minutes
      clicksByHour: number[];
    }>();

    clicks.forEach(click => {
      const chId = click.telegramChannelId!;
      const entry = channelMap.get(chId) || {
        clicks: 0,
        uniqueClicks: 0,
        linkIds: new Set(),
        messageIds: new Set(),
        timeToClicks: [],
        clicksByHour: new Array(24).fill(0)
      };

      entry.clicks++;
      if (click.isUniqueVisitor) entry.uniqueClicks++;
      entry.linkIds.add(click.linkId);
      if (click.telegramMessageId) entry.messageIds.add(click.telegramMessageId);
      entry.clicksByHour[click.clickedAt.getHours()]++;

      // Calculate time-to-click if we have post timestamp
      if (click.postTimestamp) {
        const ttc = (click.clickedAt.getTime() - click.postTimestamp.getTime()) / (1000 * 60);
        if (ttc >= 0 && ttc < 60 * 24 * 7) { // Only count if within 7 days
          entry.timeToClicks.push(ttc);
        }
      }

      channelMap.set(chId, entry);
    });

    // Build channel stats
    const channels = Array.from(channelMap.entries()).map(([channelId, data]) => {
      // Calculate conversions and revenue for this channel's links
      let channelConversions = 0;
      let channelRevenue = 0;
      data.linkIds.forEach(linkId => {
        const conv = conversionMap.get(linkId);
        if (conv) {
          channelConversions += conv.count;
          channelRevenue += conv.revenue;
        }
      });

      // Calculate average time-to-click
      const avgTimeToClick = data.timeToClicks.length > 0
        ? Math.round(data.timeToClicks.reduce((a, b) => a + b, 0) / data.timeToClicks.length)
        : null;

      // Find best posting hour (most clicks)
      const bestHour = data.clicksByHour.indexOf(Math.max(...data.clicksByHour));

      // CVR and EPC
      const cvr = data.clicks > 0 ? (channelConversions / data.clicks) * 100 : 0;
      const epc = data.clicks > 0 ? channelRevenue / data.clicks : 0;

      return {
        channelId,
        channelName: channelNameMap.get(channelId) || channelId,
        clicks: data.clicks,
        uniqueClicks: data.uniqueClicks,
        conversions: channelConversions,
        revenue: Math.round(channelRevenue * 100) / 100,
        cvr: Math.round(cvr * 100) / 100,
        epc: Math.round(epc * 100) / 100,
        uniqueMessages: data.messageIds.size,
        linksPromoted: data.linkIds.size,
        avgClicksPerMessage: data.messageIds.size > 0
          ? Math.round((data.clicks / data.messageIds.size) * 10) / 10
          : 0,
        avgTimeToClickMinutes: avgTimeToClick,
        bestPostingHour: bestHour,
        clicksByHour: data.clicksByHour
      };
    });

    // Sort by clicks
    channels.sort((a, b) => b.clicks - a.clicks);

    // Calculate totals
    const totals = {
      clicks: channels.reduce((sum, c) => sum + c.clicks, 0),
      uniqueClicks: channels.reduce((sum, c) => sum + c.uniqueClicks, 0),
      conversions: channels.reduce((sum, c) => sum + c.conversions, 0),
      revenue: Math.round(channels.reduce((sum, c) => sum + c.revenue, 0) * 100) / 100
    };

    return {
      channels,
      totals,
      period: periodDays
    };
  });

  /**
   * GET /analytics/telegram-channel/:channelId
   * Returns detailed analytics for a specific Telegram channel
   */
  app.get('/telegram-channel/:channelId', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { channelId } = req.params as { channelId: string };
    const { period = '7d' } = req.query as { period?: string };

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Verify user owns this channel
    const channel = await prisma.channel.findFirst({
      where: { userId, channelId, platform: 'TELEGRAM' }
    });

    if (!channel) {
      return reply.code(404).send({ error: 'Channel not found' });
    }

    // Get user's links
    const userLinks = await prisma.affiliateLink.findMany({
      where: { userId },
      select: { id: true }
    });
    const linkIds = userLinks.map(l => l.id);

    // Get clicks for this specific channel
    const clicks = await prisma.click.findMany({
      where: {
        linkId: { in: linkIds },
        clickedAt: { gte: startDate },
        telegramChannelId: channelId,
        isBot: false
      },
      select: {
        telegramMessageId: true,
        postTimestamp: true,
        clickedAt: true,
        isUniqueVisitor: true,
        linkId: true,
        deviceType: true,
        country: true
      }
    });

    // Get deal history for this channel (via ChannelDealHistory)
    const dealHistory = await prisma.channelDealHistory.findMany({
      where: {
        channelId: channel.id,
        publishedAt: { gte: startDate }
      },
      select: {
        asin: true,
        publishedAt: true,
        telegramMessageId: true,
        generatedCopy: true
      },
      orderBy: { publishedAt: 'desc' }
    });

    // Group clicks by message
    const messageMap = new Map<string, {
      clicks: number;
      uniqueClicks: number;
      timeToClicks: number[];
      firstClickAt: Date | null;
      publishedAt: Date | null;
    }>();

    clicks.forEach(click => {
      const msgId = click.telegramMessageId || 'unknown';
      const entry = messageMap.get(msgId) || {
        clicks: 0,
        uniqueClicks: 0,
        timeToClicks: [],
        firstClickAt: null,
        publishedAt: click.postTimestamp
      };

      entry.clicks++;
      if (click.isUniqueVisitor) entry.uniqueClicks++;

      if (!entry.firstClickAt || click.clickedAt < entry.firstClickAt) {
        entry.firstClickAt = click.clickedAt;
      }

      if (click.postTimestamp) {
        const ttc = (click.clickedAt.getTime() - click.postTimestamp.getTime()) / (1000 * 60);
        if (ttc >= 0 && ttc < 60 * 24 * 7) {
          entry.timeToClicks.push(ttc);
        }
      }

      messageMap.set(msgId, entry);
    });

    // Build message stats
    const messages = Array.from(messageMap.entries())
      .filter(([msgId]) => msgId !== 'unknown')
      .map(([messageId, data]) => ({
        messageId,
        clicks: data.clicks,
        uniqueClicks: data.uniqueClicks,
        avgTimeToClickMinutes: data.timeToClicks.length > 0
          ? Math.round(data.timeToClicks.reduce((a, b) => a + b, 0) / data.timeToClicks.length)
          : null,
        publishedAt: data.publishedAt?.toISOString() || null,
        firstClickAt: data.firstClickAt?.toISOString() || null
      }))
      .sort((a, b) => b.clicks - a.clicks);

    // Device breakdown
    const deviceMap = new Map<string, number>();
    clicks.forEach(c => {
      const device = c.deviceType || 'unknown';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });

    const devices = Array.from(deviceMap.entries())
      .map(([device, count]) => ({
        device,
        count,
        percent: clicks.length > 0 ? Math.round((count / clicks.length) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Country breakdown
    const countryMap = new Map<string, number>();
    clicks.forEach(c => {
      if (c.country) {
        countryMap.set(c.country, (countryMap.get(c.country) || 0) + 1);
      }
    });

    const countries = Array.from(countryMap.entries())
      .map(([country, count]) => ({
        country,
        count,
        percent: clicks.length > 0 ? Math.round((count / clicks.length) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Time series (clicks by day)
    const dayMap = new Map<string, number>();
    clicks.forEach(c => {
      const day = c.clickedAt.toISOString().split('T')[0];
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });

    const timeSeries = Array.from(dayMap.entries())
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      channel: {
        id: channel.id,
        channelId: channel.channelId,
        name: channel.name
      },
      summary: {
        totalClicks: clicks.length,
        uniqueClicks: clicks.filter(c => c.isUniqueVisitor).length,
        totalMessages: messageMap.size,
        dealsPublished: dealHistory.length
      },
      topMessages: messages.slice(0, 10),
      devices,
      countries,
      timeSeries,
      period: periodDays
    };
  });

  /**
   * GET /analytics/export/summary
   * Export summary report as JSON (for PDF generation on client)
   */
  app.get('/export/summary', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    const userId = (req.user as any).userId;
    const { period = '30d' } = req.query as { period?: string };

    const periodDays = period === '30d' ? 30 : period === 'today' ? 1 : 7;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get user's links
    const links = await prisma.affiliateLink.findMany({
      where: { userId },
      include: {
        product: { select: { title: true, category: true, currentPrice: true } },
        clickRecords: {
          where: { clickedAt: { gte: prevStartDate } },
          select: { clickedAt: true }
        },
        conversions: {
          where: { convertedAt: { gte: prevStartDate } },
          select: { convertedAt: true, revenue: true, commission: true }
        }
      }
    });

    // Calculate metrics
    const currentClicks = links.reduce((sum, l) =>
      sum + l.clickRecords.filter(c => c.clickedAt >= startDate).length, 0);
    const prevClicks = links.reduce((sum, l) =>
      sum + l.clickRecords.filter(c => c.clickedAt < startDate).length, 0);

    const currentConversions = links.reduce((sum, l) =>
      sum + l.conversions.filter(c => c.convertedAt >= startDate).length, 0);

    const currentRevenue = links.reduce((sum, l) =>
      sum + l.conversions
        .filter(c => c.convertedAt >= startDate)
        .reduce((s, c) => s + (c.commission || c.revenue * 0.05), 0), 0);
    const prevRevenue = links.reduce((sum, l) =>
      sum + l.conversions
        .filter(c => c.convertedAt < startDate)
        .reduce((s, c) => s + (c.commission || c.revenue * 0.05), 0), 0);

    const currentCvr = currentClicks > 0 ? (currentConversions / currentClicks) * 100 : 0;
    const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const clicksChange = prevClicks > 0 ? ((currentClicks - prevClicks) / prevClicks) * 100 : 0;

    // Top performers
    const topLinks = links
      .map(l => ({
        title: l.product?.title || 'Unknown',
        clicks: l.clickRecords.filter(c => c.clickedAt >= startDate).length,
        conversions: l.conversions.filter(c => c.convertedAt >= startDate).length,
        revenue: l.conversions
          .filter(c => c.convertedAt >= startDate)
          .reduce((s, c) => s + (c.commission || c.revenue * 0.05), 0)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Category breakdown
    const categoryMap = new Map<string, { clicks: number; revenue: number }>();
    links.forEach(l => {
      const cat = l.product?.category || 'Other';
      const entry = categoryMap.get(cat) || { clicks: 0, revenue: 0 };
      entry.clicks += l.clickRecords.filter(c => c.clickedAt >= startDate).length;
      entry.revenue += l.conversions
        .filter(c => c.convertedAt >= startDate)
        .reduce((s, c) => s + (c.commission || c.revenue * 0.05), 0);
      categoryMap.set(cat, entry);
    });

    const categories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });

    return {
      generatedAt: new Date().toISOString(),
      period: {
        days: periodDays,
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      user: {
        name: user?.name || 'User',
        email: user?.email || ''
      },
      summary: {
        totalLinks: links.length,
        totalClicks: currentClicks,
        totalConversions: currentConversions,
        totalRevenue: Math.round(currentRevenue * 100) / 100,
        cvr: Math.round(currentCvr * 100) / 100,
        epc: currentClicks > 0 ? Math.round((currentRevenue / currentClicks) * 100) / 100 : 0
      },
      trends: {
        revenueChange: Math.round(revenueChange * 10) / 10,
        clicksChange: Math.round(clicksChange * 10) / 10
      },
      topLinks: topLinks.map(l => ({
        ...l,
        revenue: Math.round(l.revenue * 100) / 100
      })),
      categories: categories.map(c => ({
        ...c,
        revenue: Math.round(c.revenue * 100) / 100
      }))
    };
  });
}
