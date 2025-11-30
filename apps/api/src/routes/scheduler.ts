import { FastifyInstance } from 'fastify';
import { ScheduledPostType, ExecutionStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { calculateNextRunAt } from '../lib/scheduler-utils';
import { TelegramBotService } from '../services/TelegramBotService';
import { SecurityService } from '../services/SecurityService';

// ==================== VALIDATION SCHEMAS ====================

const createScheduledPostSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  channelId: z.string().min(1, 'Channel is required'),
  type: z.enum(['CUSTOM', 'BOUNTY', 'RECAP', 'CROSS_PROMO', 'WELCOME', 'SPONSORED']),
  content: z.string().min(1, 'Content is required').max(4096, 'Content too long (max 4096)'),
  mediaUrl: z.string().url().optional().nullable().or(z.literal('')).transform(v => v || null),
  schedule: z.string().min(1, 'Schedule is required'), // Cron expression
  timezone: z.string().default('Europe/Rome'),
  // Bounty-specific fields
  bountyTemplate: z.string().optional(),
  bountyUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  affiliateTag: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  conflictSettings: z.object({
    skipIfDealPending: z.boolean().default(true),
    bufferMinutes: z.number().min(1).max(120).default(10),
    rescheduleOnConflict: z.boolean().default(false),
    maxRescheduleMinutes: z.number().min(1).max(180).default(60),
  }).optional(),
});

const updateScheduledPostSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(4096).optional(),
  mediaUrl: z.string().url().optional().nullable(),
  schedule: z.string().optional(),
  timezone: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  conflictSettings: z.record(z.string(), z.unknown()).optional(),
});

const idParamSchema = z.object({
  id: z.string().min(1, 'Invalid ID'),
});

const listQuerySchema = z.object({
  type: z.enum(['CUSTOM', 'BOUNTY', 'RECAP', 'CROSS_PROMO', 'WELCOME', 'SPONSORED']).optional(),
  channelId: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0),
});

// ==================== SECURITY HELPERS ====================

/**
 * Validate that user owns the channel
 */
async function validateChannelOwnership(userId: string, channelId: string): Promise<boolean> {
  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      userId: userId,
    },
  });
  return !!channel;
}

/**
 * Validate that user owns the scheduled post
 */
async function validateScheduledPostOwnership(userId: string, postId: string) {
  const post = await prisma.scheduledPost.findFirst({
    where: {
      id: postId,
      userId: userId,
    },
    include: {
      channel: true,
    },
  });
  return post;
}

/**
 * Sanitize content - basic XSS prevention
 */
function sanitizeContent(content: string): string {
  // Remove potential script tags and dangerous HTML
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

/**
 * Validate cron expression
 */
function validateCronExpression(expression: string): { valid: boolean; error?: string } {
  // Basic cron validation (5 parts: minute, hour, day, month, weekday)
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { valid: false, error: 'Cron expression must have 5 parts' };
  }

  // Basic format check for each part
  const patterns = [
    /^(\*|[0-5]?\d)(-[0-5]?\d)?(\/\d+)?(,(\*|[0-5]?\d)(-[0-5]?\d)?(\/\d+)?)*$/, // minute
    /^(\*|[01]?\d|2[0-3])(-([01]?\d|2[0-3]))?(\/\d+)?(,(\*|[01]?\d|2[0-3])(-([01]?\d|2[0-3]))?(\/\d+)?)*$/, // hour
    /^(\*|[1-9]|[12]\d|3[01])(-([1-9]|[12]\d|3[01]))?(\/\d+)?(,(\*|[1-9]|[12]\d|3[01])(-([1-9]|[12]\d|3[01]))?(\/\d+)?)*$/, // day
    /^(\*|[1-9]|1[0-2])(-([1-9]|1[0-2]))?(\/\d+)?(,(\*|[1-9]|1[0-2])(-([1-9]|1[0-2]))?(\/\d+)?)*$/, // month
    /^(\*|[0-6])(-[0-6])?(\/\d+)?(,(\*|[0-6])(-[0-6])?(\/\d+)?)*$/, // weekday
  ];

  for (let i = 0; i < 5; i++) {
    if (!patterns[i].test(parts[i])) {
      return { valid: false, error: `Invalid cron part at position ${i + 1}` };
    }
  }

  return { valid: true };
}

// ==================== RATE LIMITS ====================

const PLAN_LIMITS = {
  FREE: 10,
  PRO: 50,
  BUSINESS: 100,
};

async function checkScheduledPostLimit(userId: string, userPlan: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limit = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
  const current = await prisma.scheduledPost.count({
    where: { userId },
  });
  return {
    allowed: current < limit,
    current,
    limit,
  };
}

// ==================== ROUTES ====================

export async function schedulerRoutes(fastify: FastifyInstance) {
  // Protect all routes
  fastify.addHook('onRequest', fastify.authenticate);

  // ==================== LIST SCHEDULED POSTS ====================
  fastify.get<{ Querystring: Record<string, string> }>('/', async (request, reply) => {
    const userId = request.user.id;

    try {
      const query = listQuerySchema.parse(request.query);

      const where: any = { userId };
      if (query.type) where.type = query.type;
      if (query.channelId) where.channelId = query.channelId;
      if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

      const [posts, total] = await Promise.all([
        prisma.scheduledPost.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: query.limit,
          skip: query.offset,
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                platform: true,
                channelId: true,
              },
            },
            _count: {
              select: {
                executions: true,
              },
            },
          },
        }),
        prisma.scheduledPost.count({ where }),
      ]);

      return {
        posts,
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + posts.length < total,
        },
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to fetch scheduled posts' });
    }
  });

  // ==================== GET SINGLE SCHEDULED POST ====================
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const userId = request.user.id;

    try {
      const { id } = idParamSchema.parse(request.params);

      const post = await validateScheduledPostOwnership(userId, id);
      if (!post) {
        return reply.code(404).send({ message: 'Scheduled post not found' });
      }

      // Get recent executions
      const recentExecutions = await prisma.scheduledPostExecution.findMany({
        where: { scheduledPostId: id },
        orderBy: { executedAt: 'desc' },
        take: 10,
      });

      return {
        ...post,
        recentExecutions,
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to fetch scheduled post' });
    }
  });

  // ==================== CREATE SCHEDULED POST ====================
  fastify.post<{ Body: z.infer<typeof createScheduledPostSchema> }>('/', async (request, reply) => {
    const userId = request.user.id;
    const userPlan = request.user.plan || 'FREE';

    try {
      const data = createScheduledPostSchema.parse(request.body);

      // Check limit
      const limitCheck = await checkScheduledPostLimit(userId, userPlan);
      if (!limitCheck.allowed) {
        return reply.code(403).send({
          message: `Scheduled post limit reached (${limitCheck.current}/${limitCheck.limit}). Upgrade your plan for more.`,
          code: 'LIMIT_REACHED',
        });
      }

      // Validate channel ownership (SEC-001)
      const ownsChannel = await validateChannelOwnership(userId, data.channelId);
      if (!ownsChannel) {
        return reply.code(403).send({ message: 'You do not own this channel' });
      }

      // Validate cron expression (SEC-004)
      const cronValidation = validateCronExpression(data.schedule);
      if (!cronValidation.valid) {
        return reply.code(400).send({ message: cronValidation.error });
      }

      // Sanitize content (SEC-003)
      const sanitizedContent = sanitizeContent(data.content);

      // Calculate next run time
      const nextRunAt = calculateNextRunAt(data.schedule, data.timezone);

      // Merge bounty settings into settings object
      const mergedSettings = {
        ...(data.settings || {}),
        ...(data.type === 'BOUNTY' ? {
          bountyTemplate: data.bountyTemplate,
          bountyUrl: data.bountyUrl,
          affiliateTag: data.affiliateTag,
        } : {}),
      };

      const post = await prisma.scheduledPost.create({
        data: {
          userId,
          channelId: data.channelId,
          type: data.type as ScheduledPostType,
          name: data.name,
          content: sanitizedContent,
          mediaUrl: data.mediaUrl,
          schedule: data.schedule,
          timezone: data.timezone,
          settings: mergedSettings as Prisma.InputJsonValue,
          conflictSettings: (data.conflictSettings || {
            skipIfDealPending: true,
            bufferMinutes: 10,
            rescheduleOnConflict: false,
            maxRescheduleMinutes: 60,
          }) as Prisma.InputJsonValue,
          nextRunAt,
          isActive: true,
        },
        include: {
          channel: {
            select: {
              id: true,
              name: true,
              platform: true,
            },
          },
        },
      });

      return reply.code(201).send(post);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to create scheduled post' });
    }
  });

  // ==================== UPDATE SCHEDULED POST ====================
  fastify.put<{ Params: { id: string }; Body: z.infer<typeof updateScheduledPostSchema> }>('/:id', async (request, reply) => {
    const userId = request.user.id;

    try {
      const { id } = idParamSchema.parse(request.params);
      const data = updateScheduledPostSchema.parse(request.body);

      const post = await validateScheduledPostOwnership(userId, id);
      if (!post) {
        return reply.code(404).send({ message: 'Scheduled post not found' });
      }

      // Validate cron if updating schedule
      if (data.schedule) {
        const cronValidation = validateCronExpression(data.schedule);
        if (!cronValidation.valid) {
          return reply.code(400).send({ message: cronValidation.error });
        }
      }

      // Sanitize content if updating
      if (data.content) {
        data.content = sanitizeContent(data.content);
      }

      // Calculate new next run if schedule or timezone changed
      let nextRunAt = post.nextRunAt;
      if (data.schedule || data.timezone) {
        nextRunAt = calculateNextRunAt(
          data.schedule || post.schedule,
          data.timezone || post.timezone
        );
      }

      // Build update data with proper typing
      const updateData: Prisma.ScheduledPostUpdateInput = {
        nextRunAt,
      };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.mediaUrl !== undefined) updateData.mediaUrl = data.mediaUrl;
      if (data.schedule !== undefined) updateData.schedule = data.schedule;
      if (data.timezone !== undefined) updateData.timezone = data.timezone;
      if (data.settings !== undefined) updateData.settings = data.settings as Prisma.InputJsonValue;
      if (data.conflictSettings !== undefined) updateData.conflictSettings = data.conflictSettings as Prisma.InputJsonValue;

      const updatedPost = await prisma.scheduledPost.update({
        where: { id },
        data: updateData,
        include: {
          channel: {
            select: {
              id: true,
              name: true,
              platform: true,
            },
          },
        },
      });

      return updatedPost;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to update scheduled post' });
    }
  });

  // ==================== DELETE SCHEDULED POST ====================
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const userId = request.user.id;

    try {
      const { id } = idParamSchema.parse(request.params);

      const post = await validateScheduledPostOwnership(userId, id);
      if (!post) {
        return reply.code(404).send({ message: 'Scheduled post not found' });
      }

      await prisma.scheduledPost.delete({
        where: { id },
      });

      return { message: 'Scheduled post deleted successfully' };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to delete scheduled post' });
    }
  });

  // ==================== TOGGLE SCHEDULED POST ====================
  fastify.post<{ Params: { id: string } }>('/:id/toggle', async (request, reply) => {
    const userId = request.user.id;

    try {
      const { id } = idParamSchema.parse(request.params);

      const post = await validateScheduledPostOwnership(userId, id);
      if (!post) {
        return reply.code(404).send({ message: 'Scheduled post not found' });
      }

      const newIsActive = !post.isActive;

      // Recalculate next run if activating
      let nextRunAt = post.nextRunAt;
      if (newIsActive) {
        nextRunAt = calculateNextRunAt(post.schedule, post.timezone);
      }

      const updatedPost = await prisma.scheduledPost.update({
        where: { id },
        data: {
          isActive: newIsActive,
          nextRunAt,
          failCount: newIsActive ? 0 : post.failCount, // Reset fail count on activation
        },
      });

      return {
        id: updatedPost.id,
        isActive: updatedPost.isActive,
        nextRunAt: updatedPost.nextRunAt,
        message: newIsActive ? 'Scheduled post activated' : 'Scheduled post paused',
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to toggle scheduled post' });
    }
  });

  // ==================== PREVIEW SCHEDULED POST ====================
  fastify.post<{ Params: { id: string } }>('/:id/preview', async (request, reply) => {
    const userId = request.user.id;

    try {
      const { id } = idParamSchema.parse(request.params);

      const post = await validateScheduledPostOwnership(userId, id);
      if (!post) {
        return reply.code(404).send({ message: 'Scheduled post not found' });
      }

      // Generate preview content (replace variables, etc.)
      let previewContent = post.content;

      // Replace common variables
      const now = new Date();
      previewContent = previewContent
        .replace(/\{\{date\}\}/g, now.toLocaleDateString('it-IT'))
        .replace(/\{\{time\}\}/g, now.toLocaleTimeString('it-IT'))
        .replace(/\{\{channelName\}\}/g, post.channel.name);

      // For BOUNTY type, replace {{link}} with placeholder
      if (post.type === 'BOUNTY') {
        previewContent = previewContent.replace(/\{\{link\}\}/g, 'https://afflyt.io/r/PREVIEW');
      }

      return {
        content: previewContent,
        mediaUrl: post.mediaUrl,
        estimatedLength: previewContent.length,
        channel: post.channel,
        type: post.type,
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to generate preview' });
    }
  });

  // ==================== TEST SCHEDULED POST ====================
  fastify.post<{ Params: { id: string } }>('/:id/test', async (request, reply) => {
    const userId = request.user.id;

    try {
      const { id } = idParamSchema.parse(request.params);

      const post = await prisma.scheduledPost.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          channel: {
            include: {
              credential: true,
            },
          },
        },
      });

      if (!post) {
        return reply.code(404).send({ message: 'Scheduled post not found' });
      }

      if (!post.channel) {
        return reply.code(400).send({ message: 'Channel not found' });
      }

      if (!post.channel.credential) {
        return reply.code(400).send({ message: 'Channel has no credential configured' });
      }

      // Decrypt bot token
      const securityService = new SecurityService();
      let botToken: string;
      try {
        botToken = securityService.decrypt(post.channel.credential.key);
      } catch {
        return reply.code(400).send({ message: 'Failed to decrypt channel credential' });
      }

      // Generate test content (replace variables)
      let testContent = post.content;
      const now = new Date();
      testContent = testContent
        .replace(/\{\{date\}\}/g, now.toLocaleDateString('it-IT'))
        .replace(/\{\{time\}\}/g, now.toLocaleTimeString('it-IT'))
        .replace(/\{\{channelName\}\}/g, post.channel.name);

      // Add test prefix
      testContent = `🧪 TEST - ${post.name}\n\n${testContent}\n\n⚠️ Questo è un messaggio di test`;

      // Send to channel
      const result = await TelegramBotService.sendMessage(
        post.channel.channelId,
        botToken,
        {
          text: testContent,
          parseMode: 'HTML',
        }
      );

      if (!result.success) {
        return reply.code(500).send({
          message: 'Failed to send test message',
          error: result.error,
        });
      }

      // Record test execution (no isTest field - just mark in error field)
      await prisma.scheduledPostExecution.create({
        data: {
          scheduledPostId: id,
          status: 'SUCCESS',
          messageId: result.messageId,
          chatId: post.channel.channelId,
          error: '[TEST]', // Mark as test execution
        },
      });

      return {
        success: true,
        messageId: result.messageId,
        channel: {
          id: post.channel.id,
          name: post.channel.name,
          channelId: post.channel.channelId,
        },
        message: 'Test message sent successfully',
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to send test message' });
    }
  });

  // ==================== GET EXECUTION LOGS ====================
  fastify.get<{ Params: { id: string }; Querystring: Record<string, string> }>('/:id/logs', async (request, reply) => {
    const userId = request.user.id;

    try {
      const { id } = idParamSchema.parse(request.params);
      const limit = parseInt(request.query.limit || '20', 10);
      const offset = parseInt(request.query.offset || '0', 10);

      const post = await validateScheduledPostOwnership(userId, id);
      if (!post) {
        return reply.code(404).send({ message: 'Scheduled post not found' });
      }

      const [logs, total] = await Promise.all([
        prisma.scheduledPostExecution.findMany({
          where: { scheduledPostId: id },
          orderBy: { executedAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.scheduledPostExecution.count({
          where: { scheduledPostId: id },
        }),
      ]);

      return {
        logs,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + logs.length < total,
        },
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to fetch execution logs' });
    }
  });
}
