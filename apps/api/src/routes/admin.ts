/**
 * Admin Routes
 * Protected routes for admin dashboard - requires ADMIN role
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma';
import { requireAdmin } from '../middleware/adminGuard';
import { getRedis } from '../lib/redis';
import { randomBytes } from 'crypto';

// Types for request bodies
interface GenerateBetaCodesBody {
  count: number;
  prefix?: string;
  notes?: string;
}

interface UpdateUserBody {
  plan?: string;
  role?: string;
  isActive?: boolean;
}

interface BroadcastMessageBody {
  message: string;
  type: 'info' | 'warning' | 'success';
}

export async function adminRoutes(fastify: FastifyInstance) {
  // All routes require authentication + admin role
  fastify.addHook('onRequest', fastify.authenticate);
  fastify.addHook('preHandler', requireAdmin);

  // ==================== OVERVIEW STATS ====================

  /**
   * GET /admin/stats/overview
   * Returns all KPI stats for admin dashboard
   */
  fastify.get('/stats/overview', async (request: FastifyRequest, reply: FastifyReply) => {
    const [
      totalUsers,
      activeUsers,
      totalChannels,
      totalAutomations,
      activeAutomations,
      totalClicks,
      totalConversions,
      totalBetaCodes,
      usedBetaCodes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.channel.count(),
      prisma.automationRule.count(),
      prisma.automationRule.count({ where: { isActive: true } }),
      prisma.click.count(),
      prisma.conversion.count(),
      prisma.betaInviteCode.count(),
      prisma.betaInviteCode.count({ where: { usedAt: { not: null } } }),
    ]);

    // Users by plan
    const usersByPlan = await prisma.user.groupBy({
      by: ['plan'],
      _count: true,
    });

    // Calculate revenue (placeholder - would need actual billing data)
    const revenue = {
      mrr: 0, // Would calculate from actual subscriptions
      arr: 0,
    };

    // Recent signups (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSignups = await prisma.user.count({
      where: { createdAt: { gte: weekAgo } },
    });

    // Clicks today - through affiliateLink relation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clicksToday = await prisma.click.count({
      where: { clickedAt: { gte: today } },
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        recentSignups,
        byPlan: usersByPlan.reduce((acc, p) => {
          acc[p.plan] = p._count;
          return acc;
        }, {} as Record<string, number>),
      },
      channels: {
        total: totalChannels,
      },
      automations: {
        total: totalAutomations,
        active: activeAutomations,
      },
      clicks: {
        total: totalClicks,
        today: clicksToday,
      },
      conversions: {
        total: totalConversions,
      },
      betaCodes: {
        total: totalBetaCodes,
        used: usedBetaCodes,
        available: totalBetaCodes - usedBetaCodes,
      },
      revenue,
    };
  });

  // ==================== SYSTEM HEALTH ====================

  /**
   * GET /admin/health
   * System health check
   */
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const health: Record<string, any> = {
      api: { status: 'healthy', timestamp: new Date() },
      database: { status: 'unknown' },
      redis: { status: 'unknown' },
      keepa: { status: 'unknown' },
    };

    // Database health
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.database = { status: 'healthy' };
    } catch (error) {
      health.database = { status: 'unhealthy', error: String(error) };
    }

    // Redis health
    try {
      const redis = getRedis();
      if (redis) {
        await redis.ping();
        health.redis = { status: 'healthy' };
      } else {
        health.redis = { status: 'not_configured' };
      }
    } catch (error) {
      health.redis = { status: 'unhealthy', error: String(error) };
    }

    // Keepa worker health (check last job execution)
    try {
      const redis = getRedis();
      if (redis) {
        const lastProcessed = await redis.get('keepa:last_processed');
        const queueDepth = await redis.llen('keepa:queue');
        health.keepa = {
          status: 'healthy',
          lastProcessed: lastProcessed ? new Date(parseInt(lastProcessed)) : null,
          queueDepth,
        };
      }
    } catch (error) {
      health.keepa = { status: 'unknown', error: String(error) };
    }

    return health;
  });

  // ==================== KEEPA MONITOR ====================

  /**
   * GET /admin/keepa/stats
   * Keepa token and queue statistics
   */
  fastify.get('/keepa/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const redis = getRedis();
      if (!redis) {
        return { error: 'Redis not configured' };
      }

      // Get token stats
      const tokensAvailable = await redis.get('keepa:tokens:available');
      const tokensUsed = await redis.get('keepa:tokens:used_today');
      const lastRefill = await redis.get('keepa:tokens:last_refill');

      // Get queue stats
      const queueDepth = await redis.llen('keepa:queue');
      const processing = await redis.get('keepa:processing');

      // Get cache stats
      const cacheKeys = await redis.keys('keepa:cache:*');
      const cacheStats = {
        totalCategories: cacheKeys.length,
        fresh: 0,
        stale: 0,
      };

      // Check cache freshness
      for (const key of cacheKeys.slice(0, 50)) { // Limit to avoid performance issues
        const ttl = await redis.ttl(key);
        if (ttl > 1800) { // More than 30 min = fresh
          cacheStats.fresh++;
        } else {
          cacheStats.stale++;
        }
      }

      return {
        tokens: {
          available: tokensAvailable ? parseInt(tokensAvailable) : 0,
          usedToday: tokensUsed ? parseInt(tokensUsed) : 0,
          lastRefill: lastRefill ? new Date(parseInt(lastRefill)) : null,
        },
        queue: {
          depth: queueDepth,
          processing: processing === 'true',
        },
        cache: cacheStats,
      };
    } catch (error) {
      return { error: String(error) };
    }
  });

  // ==================== USERS MANAGEMENT ====================

  /**
   * GET /admin/users
   * List all users with pagination
   */
  fastify.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = '1', limit = '20', search = '' } = request.query as {
      page?: string;
      limit?: string;
      search?: string;
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          plan: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              channels: true,
              automationRules: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  });

  /**
   * GET /admin/users/:id
   * Get single user details
   */
  fastify.get('/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        channels: true,
        automationRules: true,
        credentials: {
          select: {
            id: true,
            provider: true,
            createdAt: true,
          },
        },
        betaInviteCode: true,
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Get user stats - clicks/conversions are through affiliateLinks
    const [clickCount, conversionCount] = await Promise.all([
      prisma.click.count({ where: { link: { userId: id } } }),
      prisma.conversion.count({ where: { link: { userId: id } } }),
    ]);

    return {
      ...user,
      password: undefined, // Never expose password
      stats: {
        clicks: clickCount,
        conversions: conversionCount,
      },
    };
  });

  /**
   * PATCH /admin/users/:id
   * Update user (plan, role, status)
   */
  fastify.patch('/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateUserBody;

    const updateData: any = {};
    if (body.plan) updateData.plan = body.plan;
    if (body.role) updateData.role = body.role;
    if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        isActive: true,
      },
    });

    return user;
  });

  // ==================== BETA CODES ====================

  /**
   * GET /admin/beta-codes
   * List all beta codes
   */
  fastify.get('/beta-codes', async (request: FastifyRequest, reply: FastifyReply) => {
    const codes = await prisma.betaInviteCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return { codes };
  });

  /**
   * POST /admin/beta-codes/generate
   * Generate new beta codes
   */
  fastify.post('/beta-codes/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { count = 1, prefix = 'AFFLYT', notes = '' } = request.body as GenerateBetaCodesBody;

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const randomPart = randomBytes(4).toString('hex').toUpperCase();
      const code = `${prefix}-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}`;
      codes.push(code);
    }

    // Create codes in database
    await prisma.betaInviteCode.createMany({
      data: codes.map((code) => ({
        code,
        notes: notes || null,
        isActive: true,
      })),
    });

    return { codes, count: codes.length };
  });

  /**
   * PATCH /admin/beta-codes/:id
   * Update beta code (assign email, notes, active status)
   */
  fastify.patch('/beta-codes/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { assignedEmail, notes, isActive } = request.body as {
      assignedEmail?: string | null;
      notes?: string | null;
      isActive?: boolean;
    };

    const updateData: Record<string, unknown> = {};
    if (assignedEmail !== undefined) updateData.assignedEmail = assignedEmail || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const code = await prisma.betaInviteCode.update({
      where: { id },
      data: updateData,
    });

    return code;
  });

  /**
   * DELETE /admin/beta-codes/:id
   * Delete a beta code
   */
  fastify.delete('/beta-codes/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prisma.betaInviteCode.delete({ where: { id } });

    return { success: true };
  });

  // ==================== CHANNELS & AUTOMATIONS ====================

  /**
   * GET /admin/channels
   * List all channels across all users
   */
  fastify.get('/channels', async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = '1', limit = '20' } = request.query as {
      page?: string;
      limit?: string;
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [channels, total] = await Promise.all([
      prisma.channel.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          _count: {
            select: { automationRules: true },
          },
        },
      }),
      prisma.channel.count(),
    ]);

    return {
      channels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  });

  /**
   * GET /admin/automations
   * List all automations across all users
   */
  fastify.get('/automations', async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = '1', limit = '20', status = '' } = request.query as {
      page?: string;
      limit?: string;
      status?: string;
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = status ? { isActive: status === 'active' } : {};

    const [automations, total] = await Promise.all([
      prisma.automationRule.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          channel: {
            select: { id: true, name: true, platform: true },
          },
        },
      }),
      prisma.automationRule.count({ where }),
    ]);

    return {
      automations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  });

  // ==================== QUICK ACTIONS ====================

  /**
   * POST /admin/actions/clear-cache
   * Clear Keepa cache
   */
  fastify.post('/actions/clear-cache', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const redis = getRedis();
      if (!redis) {
        return reply.code(400).send({ error: 'Redis not configured' });
      }

      // Delete all cache keys
      const cacheKeys = await redis.keys('keepa:cache:*');
      if (cacheKeys.length > 0) {
        await redis.del(...cacheKeys);
      }

      return {
        success: true,
        message: `Cleared ${cacheKeys.length} cache entries`,
      };
    } catch (error) {
      return reply.code(500).send({ error: String(error) });
    }
  });

  /**
   * POST /admin/actions/trigger-prefetch
   * Trigger Keepa prefetch for popular categories
   */
  fastify.post('/actions/trigger-prefetch', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const redis = getRedis();
      if (!redis) {
        return reply.code(400).send({ error: 'Redis not configured' });
      }

      // Set flag to trigger prefetch on next tick
      await redis.set('keepa:trigger_prefetch', '1', 'EX', 60);

      return {
        success: true,
        message: 'Prefetch triggered',
      };
    } catch (error) {
      return reply.code(500).send({ error: String(error) });
    }
  });

  // ==================== ANALYTICS ====================

  /**
   * GET /admin/analytics/daily
   * Get daily stats for charts
   */
  fastify.get('/analytics/daily', async (request: FastifyRequest, reply: FastifyReply) => {
    const { days = '30' } = request.query as { days?: string };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get daily clicks
    const clicks = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Click"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Get daily signups
    const signups = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Get daily conversions
    const conversions = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Conversion"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return {
      clicks: clicks.map((c) => ({ date: c.date, count: Number(c.count) })),
      signups: signups.map((s) => ({ date: s.date, count: Number(s.count) })),
      conversions: conversions.map((c) => ({ date: c.date, count: Number(c.count) })),
    };
  });

  // ==================== LOGS ====================

  /**
   * GET /admin/logs/auth
   * Get recent auth events
   */
  fastify.get('/logs/auth', async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit = '50' } = request.query as { limit?: string };

    const logs = await prisma.authEvent.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return { logs };
  });

  /**
   * GET /admin/logs/automation
   * Get recent automation run stats
   */
  fastify.get('/logs/automation', async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit = '50' } = request.query as { limit?: string };

    const logs = await prisma.automationRunStats.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        rule: {
          select: {
            id: true,
            name: true,
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    return { logs };
  });
}

export default adminRoutes;
