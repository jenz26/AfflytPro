import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';

const querySchema = z.object({
  locale: z.string().default('it'),
  bountyType: z.string().optional(),
});

export async function bountyTemplateRoutes(fastify: FastifyInstance) {
  // Protect all routes
  fastify.addHook('onRequest', fastify.authenticate);

  // Get all bounty templates
  fastify.get<{ Querystring: Record<string, string> }>('/', async (request, reply) => {
    try {
      const query = querySchema.parse(request.query);

      const where: any = {
        isActive: true,
        locale: query.locale,
      };

      if (query.bountyType) {
        where.bountyType = query.bountyType;
      }

      const templates = await prisma.bountyTemplate.findMany({
        where,
        orderBy: { bountyType: 'asc' },
      });

      return { templates };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to fetch bounty templates' });
    }
  });

  // Get single bounty template by type
  fastify.get<{ Params: { type: string }; Querystring: Record<string, string> }>('/:type', async (request, reply) => {
    try {
      const { type } = request.params;
      const locale = request.query.locale || 'it';

      const template = await prisma.bountyTemplate.findFirst({
        where: {
          bountyType: type.toUpperCase(),
          locale,
          isActive: true,
        },
      });

      if (!template) {
        return reply.code(404).send({ message: 'Bounty template not found' });
      }

      return template;
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to fetch bounty template' });
    }
  });
}
