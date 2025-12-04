/**
 * Member Tracking Routes
 *
 * API endpoints for Telegram channel member tracking.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MemberTrackingService } from '../services/MemberTrackingService';
import prisma from '../lib/prisma';

// Validation schemas
const channelIdParamsSchema = z.object({
  channelId: z.string().cuid(),
});

const historyQuerySchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
});

export async function memberTrackingRoutes(fastify: FastifyInstance) {
  // Authenticate all routes
  fastify.addHook('onRequest', fastify.authenticate);

  /**
   * GET /channels/:channelId/members/history
   * Get member count history for charting
   */
  fastify.get<{ Params: { channelId: string }; Querystring: { days?: string } }>(
    '/channels/:channelId/members/history',
    async (request, reply) => {
      const userId = request.user.id;

      try {
        const params = channelIdParamsSchema.parse(request.params);
        const query = historyQuerySchema.parse(request.query);

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
          where: {
            id: params.channelId,
            userId,
          },
          select: { id: true },
        });

        if (!channel) {
          return reply.code(404).send({ error: 'Channel not found' });
        }

        const history = await MemberTrackingService.getMemberHistory(
          params.channelId,
          query.days
        );

        return reply.send({
          success: true,
          channelId: params.channelId,
          days: query.days,
          dataPoints: history.length,
          history,
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Validation error',
            errors: error.issues.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to get member history' });
      }
    }
  );

  /**
   * GET /channels/:channelId/members/stats
   * Get comprehensive member stats
   */
  fastify.get<{ Params: { channelId: string } }>(
    '/channels/:channelId/members/stats',
    async (request, reply) => {
      const userId = request.user.id;

      try {
        const params = channelIdParamsSchema.parse(request.params);

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
          where: {
            id: params.channelId,
            userId,
          },
          select: { id: true, name: true },
        });

        if (!channel) {
          return reply.code(404).send({ error: 'Channel not found' });
        }

        const stats = await MemberTrackingService.getChannelStats(params.channelId);
        const churnCorrelation = await MemberTrackingService.detectChurnAfterPosts(
          params.channelId
        );

        return reply.send({
          success: true,
          channelId: params.channelId,
          channelName: channel.name,
          stats: {
            ...stats,
            churnCorrelation,
          },
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Validation error',
            errors: error.issues.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to get member stats' });
      }
    }
  );

  /**
   * POST /channels/:channelId/members/refresh
   * Manually trigger a member count refresh
   */
  fastify.post<{ Params: { channelId: string } }>(
    '/channels/:channelId/members/refresh',
    async (request, reply) => {
      const userId = request.user.id;

      try {
        const params = channelIdParamsSchema.parse(request.params);

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
          where: {
            id: params.channelId,
            userId,
            platform: 'TELEGRAM',
          },
          select: { id: true, name: true },
        });

        if (!channel) {
          return reply.code(404).send({ error: 'Telegram channel not found' });
        }

        // Record new snapshot
        const success = await MemberTrackingService.recordMemberSnapshot(params.channelId);

        if (!success) {
          return reply.code(500).send({
            error: 'Failed to refresh member count',
            message: 'Check that the bot token is valid and the bot is an admin in the channel',
          });
        }

        // Get updated stats
        const stats = await MemberTrackingService.getChannelStats(params.channelId);

        return reply.send({
          success: true,
          channelId: params.channelId,
          channelName: channel.name,
          message: 'Member count refreshed successfully',
          stats,
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Validation error',
            errors: error.issues.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to refresh member count' });
      }
    }
  );

  /**
   * POST /channels/:channelId/members/update-metrics
   * Manually trigger a metrics recalculation
   */
  fastify.post<{ Params: { channelId: string } }>(
    '/channels/:channelId/members/update-metrics',
    async (request, reply) => {
      const userId = request.user.id;

      try {
        const params = channelIdParamsSchema.parse(request.params);

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
          where: {
            id: params.channelId,
            userId,
          },
          select: { id: true, name: true },
        });

        if (!channel) {
          return reply.code(404).send({ error: 'Channel not found' });
        }

        // Update metrics
        await MemberTrackingService.updateChannelGrowthMetrics(params.channelId);

        // Get updated stats
        const stats = await MemberTrackingService.getChannelStats(params.channelId);

        return reply.send({
          success: true,
          channelId: params.channelId,
          channelName: channel.name,
          message: 'Metrics updated successfully',
          stats,
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Validation error',
            errors: error.issues.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to update metrics' });
      }
    }
  );
}

export default memberTrackingRoutes;
