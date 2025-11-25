import { FastifyInstance } from 'fastify';
import { AnalyticsService } from '../services/AnalyticsService';
import prisma from '../lib/prisma';

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
}
