import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { checkAIFeature } from '../middleware/planGuard';

const prisma = new PrismaClient();

/**
 * Message Templates API Routes
 *
 * GET    /templates          - Get all templates for current user
 * POST   /templates          - Create new template
 * GET    /templates/:id      - Get template by ID
 * PUT    /templates/:id      - Update template
 * DELETE /templates/:id      - Delete template
 * PUT    /templates/:id/default - Set as default template
 */
const templatesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all templates for current user
  fastify.get(
    '/templates',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      try {
        const userId = (request.user as any).id;

        const templates = await prisma.messageTemplate.findMany({
          where: { userId },
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' },
          ],
        });

        reply.send({ templates });
      } catch (error: any) {
        request.log.error(error);
        reply.status(500).send({
          error: 'Failed to fetch templates',
          message: error.message,
        });
      }
    }
  );

  // Create new template
  fastify.post<{
    Body: {
      name?: string;
      template: string;
      useAI?: boolean;
      aiPrompt?: string;
      aiTone?: string;
      isDefault?: boolean;
    };
  }>(
    '/templates',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      try {
        const userId = (request.user as any).id;
        const {
          name = 'Untitled Template',
          template,
          useAI = false,
          aiPrompt,
          aiTone,
          isDefault = false,
        } = request.body;

        // Check if AI feature is available for user's plan
        if (useAI) {
          await checkAIFeature(request, reply);
        }

        // If setting as default, unset other defaults
        if (isDefault) {
          await prisma.messageTemplate.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
          });
        }

        const newTemplate = await prisma.messageTemplate.create({
          data: {
            userId,
            name,
            template,
            useAI,
            aiPrompt: useAI ? aiPrompt : null,
            aiTone: useAI ? aiTone : null,
            isDefault,
          },
        });

        reply.status(201).send({ template: newTemplate });
      } catch (error: any) {
        request.log.error(error);
        reply.status(500).send({
          error: 'Failed to create template',
          message: error.message,
        });
      }
    }
  );

  // Get template by ID
  fastify.get<{
    Params: { id: string };
  }>(
    '/templates/:id',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      try {
        const userId = (request.user as any).id;
        const { id } = request.params;

        const template = await prisma.messageTemplate.findFirst({
          where: { id, userId },
        });

        if (!template) {
          return reply.status(404).send({ error: 'Template not found' });
        }

        reply.send({ template });
      } catch (error: any) {
        request.log.error(error);
        reply.status(500).send({
          error: 'Failed to fetch template',
          message: error.message,
        });
      }
    }
  );

  // Update template
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      template?: string;
      useAI?: boolean;
      aiPrompt?: string;
      aiTone?: string;
    };
  }>(
    '/templates/:id',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      try {
        const userId = (request.user as any).id;
        const { id } = request.params;
        const { name, template, useAI, aiPrompt, aiTone } = request.body;

        // Check if template exists and belongs to user
        const existing = await prisma.messageTemplate.findFirst({
          where: { id, userId },
        });

        if (!existing) {
          return reply.status(404).send({ error: 'Template not found' });
        }

        // Check if AI feature is available for user's plan
        if (useAI) {
          await checkAIFeature(request, reply);
        }

        const updated = await prisma.messageTemplate.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(template && { template }),
            ...(useAI !== undefined && { useAI }),
            ...(aiPrompt !== undefined && { aiPrompt: useAI ? aiPrompt : null }),
            ...(aiTone !== undefined && { aiTone: useAI ? aiTone : null }),
          },
        });

        reply.send({ template: updated });
      } catch (error: any) {
        request.log.error(error);
        reply.status(500).send({
          error: 'Failed to update template',
          message: error.message,
        });
      }
    }
  );

  // Delete template
  fastify.delete<{
    Params: { id: string };
  }>(
    '/templates/:id',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      try {
        const userId = (request.user as any).id;
        const { id } = request.params;

        // Check if template exists and belongs to user
        const existing = await prisma.messageTemplate.findFirst({
          where: { id, userId },
        });

        if (!existing) {
          return reply.status(404).send({ error: 'Template not found' });
        }

        // Don't allow deleting the default template
        if (existing.isDefault) {
          return reply.status(400).send({
            error: 'Cannot delete default template',
            message: 'Set another template as default first',
          });
        }

        await prisma.messageTemplate.delete({
          where: { id },
        });

        reply.send({ success: true });
      } catch (error: any) {
        request.log.error(error);
        reply.status(500).send({
          error: 'Failed to delete template',
          message: error.message,
        });
      }
    }
  );

  // Set template as default
  fastify.put<{
    Params: { id: string };
  }>(
    '/templates/:id/default',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      try {
        const userId = (request.user as any).id;
        const { id } = request.params;

        // Check if template exists and belongs to user
        const existing = await prisma.messageTemplate.findFirst({
          where: { id, userId },
        });

        if (!existing) {
          return reply.status(404).send({ error: 'Template not found' });
        }

        // Unset all other defaults
        await prisma.messageTemplate.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });

        // Set this template as default
        const updated = await prisma.messageTemplate.update({
          where: { id },
          data: { isDefault: true },
        });

        reply.send({ template: updated });
      } catch (error: any) {
        request.log.error(error);
        reply.status(500).send({
          error: 'Failed to set default template',
          message: error.message,
        });
      }
    }
  );
};

export default templatesRoutes;
