import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { NotificationService } from '../services/NotificationService';
import prisma from '../lib/prisma';

// Email preferences schema
interface EmailPreferencesBody {
  weeklyReport?: boolean;
  dailyDigest?: boolean;
  automationAlerts?: boolean;
  dealDigest?: 'realtime' | 'hourly' | 'daily' | 'off';
  marketing?: boolean;
  timezone?: string;
}

export async function notificationRoutes(fastify: FastifyInstance) {
  // Get user notifications
  fastify.get(
    '/notifications',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.id;
      const query = request.query as { limit?: string; offset?: string; unreadOnly?: string };
      const limit = parseInt(query.limit || '20', 10);
      const offset = parseInt(query.offset || '0', 10);
      const unreadOnly = query.unreadOnly === 'true';

      const notifications = await NotificationService.getUserNotifications(userId, {
        limit,
        offset,
        unreadOnly,
      });

      return { notifications };
    }
  );

  // Get unread count
  fastify.get(
    '/notifications/unread-count',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.id;
      const count = await NotificationService.getUnreadCount(userId);
      return { count };
    }
  );

  // Mark notification as read
  fastify.post(
    '/notifications/:id/read',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.id;
      const params = request.params as { id: string };
      const { id } = params;

      await NotificationService.markAsRead(id, userId);
      return { success: true };
    }
  );

  // Mark all notifications as read
  fastify.post(
    '/notifications/read-all',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.id;
      await NotificationService.markAllAsRead(userId);
      return { success: true };
    }
  );

  // Dismiss/delete a notification
  fastify.delete(
    '/notifications/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.id;
      const params = request.params as { id: string };
      const { id } = params;

      await NotificationService.dismissNotification(id, userId);
      return { success: true };
    }
  );

  // ============================================
  // EMAIL PREFERENCES
  // ============================================

  // Get email preferences
  fastify.get(
    '/notifications/preferences',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          emailPrefs_weeklyReport: true,
          emailPrefs_dailyDigest: true,
          emailPrefs_automationAlerts: true,
          emailPrefs_dealDigest: true,
          emailPrefs_marketing: true,
          emailPrefs_timezone: true,
          lastWeeklyReportAt: true,
          lastDailyDigestAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return {
        preferences: {
          weeklyReport: user.emailPrefs_weeklyReport,
          dailyDigest: user.emailPrefs_dailyDigest,
          automationAlerts: user.emailPrefs_automationAlerts,
          dealDigest: user.emailPrefs_dealDigest,
          marketing: user.emailPrefs_marketing,
          timezone: user.emailPrefs_timezone,
        },
        lastSent: {
          weeklyReport: user.lastWeeklyReportAt,
          dailyDigest: user.lastDailyDigestAt,
        },
      };
    }
  );

  // Update email preferences
  fastify.patch(
    '/notifications/preferences',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.id;
      const body = request.body as EmailPreferencesBody;

      // Validate timezone if provided
      if (body.timezone) {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: body.timezone });
        } catch {
          return reply.status(400).send({ error: 'Invalid timezone' });
        }
      }

      // Validate dealDigest value
      if (body.dealDigest && !['realtime', 'hourly', 'daily', 'off'].includes(body.dealDigest)) {
        return reply.status(400).send({ error: 'Invalid dealDigest value' });
      }

      const updateData: Record<string, any> = {};

      if (typeof body.weeklyReport === 'boolean') {
        updateData.emailPrefs_weeklyReport = body.weeklyReport;
      }
      if (typeof body.dailyDigest === 'boolean') {
        updateData.emailPrefs_dailyDigest = body.dailyDigest;
      }
      if (typeof body.automationAlerts === 'boolean') {
        updateData.emailPrefs_automationAlerts = body.automationAlerts;
      }
      if (body.dealDigest) {
        updateData.emailPrefs_dealDigest = body.dealDigest;
      }
      if (typeof body.marketing === 'boolean') {
        updateData.emailPrefs_marketing = body.marketing;
      }
      if (body.timezone) {
        updateData.emailPrefs_timezone = body.timezone;
      }

      if (Object.keys(updateData).length === 0) {
        return reply.status(400).send({ error: 'No valid preferences to update' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return { success: true, updated: Object.keys(updateData).length };
    }
  );

  // Send test weekly report (for testing purposes)
  fastify.post(
    '/notifications/test/weekly-report',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.id;

      // Import dynamically to avoid circular dependencies
      const { EmailReportCron } = await import('../services/EmailReportCron');
      const emailCron = new EmailReportCron(prisma);

      const success = await emailCron.sendTestWeeklyReport(userId);

      if (success) {
        return { success: true, message: 'Test weekly report sent' };
      } else {
        return reply.status(500).send({ error: 'Failed to send test report' });
      }
    }
  );

  // Send test daily summary (for testing purposes)
  fastify.post(
    '/notifications/test/daily-summary',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.id;

      const { EmailReportCron } = await import('../services/EmailReportCron');
      const emailCron = new EmailReportCron(prisma);

      const success = await emailCron.sendTestDailySummary(userId);

      if (success) {
        return { success: true, message: 'Test daily summary sent' };
      } else {
        return reply.status(500).send({ error: 'Failed to send test summary' });
      }
    }
  );
}

export default notificationRoutes;
