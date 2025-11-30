import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';

// Validation schemas
const createTagSchema = z.object({
  tag: z.string().min(1, 'Tag is required').max(50, 'Tag too long'),
  label: z.string().min(1, 'Label is required').max(100, 'Label too long'),
  marketplace: z.enum(['IT', 'DE', 'FR', 'ES', 'UK', 'US']).default('IT'),
  isDefault: z.boolean().default(false),
});

const updateTagSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  marketplace: z.enum(['IT', 'DE', 'FR', 'ES', 'UK', 'US']).optional(),
  isDefault: z.boolean().optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export async function affiliateTagRoutes(fastify: FastifyInstance) {
  // Protect all routes
  fastify.addHook('onRequest', fastify.authenticate);

  // ==================== GET ALL TAGS ====================
  fastify.get('/', async (request, reply) => {
    const userId = request.user.id;

    try {
      const tags = await prisma.affiliateTag.findMany({
        where: { userId },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'asc' },
        ],
        include: {
          _count: {
            select: {
              automationRules: true,
              scheduledPosts: true,
              affiliateLinks: true,
            },
          },
        },
      });

      // Format response with usage counts
      const formattedTags = tags.map((tag) => ({
        id: tag.id,
        tag: tag.tag,
        label: tag.label,
        marketplace: tag.marketplace,
        isDefault: tag.isDefault,
        createdAt: tag.createdAt,
        usage: {
          automations: tag._count.automationRules,
          scheduledPosts: tag._count.scheduledPosts,
          links: tag._count.affiliateLinks,
          total: tag._count.automationRules + tag._count.scheduledPosts + tag._count.affiliateLinks,
        },
      }));

      return { tags: formattedTags };
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to fetch affiliate tags' });
    }
  });

  // ==================== GET SINGLE TAG ====================
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const userId = request.user.id;

    try {
      const { id } = idParamSchema.parse(request.params);

      const tag = await prisma.affiliateTag.findFirst({
        where: { id, userId },
        include: {
          _count: {
            select: {
              automationRules: true,
              scheduledPosts: true,
              affiliateLinks: true,
            },
          },
        },
      });

      if (!tag) {
        return reply.code(404).send({ message: 'Tag not found' });
      }

      return {
        id: tag.id,
        tag: tag.tag,
        label: tag.label,
        marketplace: tag.marketplace,
        isDefault: tag.isDefault,
        createdAt: tag.createdAt,
        usage: {
          automations: tag._count.automationRules,
          scheduledPosts: tag._count.scheduledPosts,
          links: tag._count.affiliateLinks,
          total: tag._count.automationRules + tag._count.scheduledPosts + tag._count.affiliateLinks,
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
      return reply.code(500).send({ message: 'Failed to fetch affiliate tag' });
    }
  });

  // ==================== CREATE TAG ====================
  fastify.post<{ Body: z.infer<typeof createTagSchema> }>('/', async (request, reply) => {
    const userId = request.user.id;

    try {
      const data = createTagSchema.parse(request.body);

      // Check for duplicate tag
      const existing = await prisma.affiliateTag.findFirst({
        where: { userId, tag: data.tag },
      });

      if (existing) {
        return reply.code(409).send({ message: 'Tag already exists' });
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await prisma.affiliateTag.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // If this is the first tag, make it default
      const tagCount = await prisma.affiliateTag.count({ where: { userId } });
      const shouldBeDefault = data.isDefault || tagCount === 0;

      const tag = await prisma.affiliateTag.create({
        data: {
          userId,
          tag: data.tag,
          label: data.label,
          marketplace: data.marketplace,
          isDefault: shouldBeDefault,
        },
      });

      return reply.code(201).send(tag);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to create affiliate tag' });
    }
  });

  // ==================== UPDATE TAG ====================
  fastify.put<{ Params: { id: string }; Body: z.infer<typeof updateTagSchema> }>('/:id', async (request, reply) => {
    const userId = request.user.id;

    try {
      const { id } = idParamSchema.parse(request.params);
      const data = updateTagSchema.parse(request.body);

      // Check ownership
      const existing = await prisma.affiliateTag.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return reply.code(404).send({ message: 'Tag not found' });
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await prisma.affiliateTag.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const tag = await prisma.affiliateTag.update({
        where: { id },
        data,
      });

      return tag;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to update affiliate tag' });
    }
  });

  // ==================== DELETE TAG ====================
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const userId = request.user.id;

    try {
      const { id } = idParamSchema.parse(request.params);

      // Check ownership
      const existing = await prisma.affiliateTag.findFirst({
        where: { id, userId },
        include: {
          _count: {
            select: {
              automationRules: true,
              scheduledPosts: true,
            },
          },
        },
      });

      if (!existing) {
        return reply.code(404).send({ message: 'Tag not found' });
      }

      // Check if tag is in use
      if (existing._count.automationRules > 0 || existing._count.scheduledPosts > 0) {
        return reply.code(409).send({
          message: 'Cannot delete tag that is in use',
          usage: {
            automations: existing._count.automationRules,
            scheduledPosts: existing._count.scheduledPosts,
          },
        });
      }

      // If deleting default, set another as default
      if (existing.isDefault) {
        const nextTag = await prisma.affiliateTag.findFirst({
          where: { userId, id: { not: id } },
          orderBy: { createdAt: 'asc' },
        });

        if (nextTag) {
          await prisma.affiliateTag.update({
            where: { id: nextTag.id },
            data: { isDefault: true },
          });
        }
      }

      await prisma.affiliateTag.delete({ where: { id } });

      return { message: 'Tag deleted successfully' };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to delete affiliate tag' });
    }
  });

  // ==================== SET DEFAULT TAG ====================
  fastify.post<{ Params: { id: string } }>('/:id/default', async (request, reply) => {
    const userId = request.user.id;

    try {
      const { id } = idParamSchema.parse(request.params);

      // Check ownership
      const existing = await prisma.affiliateTag.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return reply.code(404).send({ message: 'Tag not found' });
      }

      // Unset other defaults
      await prisma.affiliateTag.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      // Set this as default
      const tag = await prisma.affiliateTag.update({
        where: { id },
        data: { isDefault: true },
      });

      return tag;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to set default tag' });
    }
  });

  // ==================== GET DEFAULT TAG ====================
  fastify.get('/default', async (request, reply) => {
    const userId = request.user.id;

    try {
      const tag = await prisma.affiliateTag.findFirst({
        where: { userId, isDefault: true },
      });

      if (!tag) {
        return reply.code(404).send({ message: 'No default tag set' });
      }

      return tag;
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to fetch default tag' });
    }
  });
}
