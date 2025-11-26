import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { NotificationService } from '../services/NotificationService';

export async function notificationRoutes(fastify: FastifyInstance) {
  // Get user notifications
  fastify.get(
    '/notifications',
    { preHandler: [fastify.authenticate] },
    async (
      request: FastifyRequest<{
        Querystring: { limit?: string; offset?: string; unreadOnly?: string };
      }>,
      reply: FastifyReply
    ) => {
      const userId = (request as any).user.id;
      const limit = parseInt(request.query.limit || '20', 10);
      const offset = parseInt(request.query.offset || '0', 10);
      const unreadOnly = request.query.unreadOnly === 'true';

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
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const userId = (request as any).user.id;
      const { id } = request.params;

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
}

export default notificationRoutes;
