import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { RuleExecutor } from '../services/RuleExecutor';
import { z } from 'zod';
import prisma from '../lib/prisma';
import {
    checkAutomationLimit,
    checkActiveAutomationLimit,
    checkMinScore,
    checkABTesting,
} from '../middleware/planGuard';

const triggerActionSchema = z.object({
    type: z.string().min(1),
    config: z.any(),
    order: z.number().int().nonnegative().optional()
});

const createRuleSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(500).optional(),
    categories: z.array(z.string()).min(1, 'At least one category is required'),
    minScore: z.number().min(0).max(100, 'Score must be between 0 and 100'),
    maxPrice: z.number().positive().optional(),
    channelId: z.string().uuid().optional(),
    splitId: z.string().uuid().optional(),
    triggers: z.array(triggerActionSchema).min(1, 'At least one trigger is required'),
    actions: z.array(triggerActionSchema.extend({ order: z.number().int().nonnegative() })).min(1, 'At least one action is required')
});

const updateRuleSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional(),
    minScore: z.number().min(0).max(100).optional(),
    maxPrice: z.number().positive().optional(),
    channelId: z.string().uuid().optional(),
    splitId: z.string().uuid().optional()
});

const idParamSchema = z.object({
    id: z.string().uuid('Invalid ID format')
});

const automationRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * GET /automation/rules
     * List all automation rules for authenticated user
     */
    fastify.get('/rules', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        const userId = (request.user as any).id;

        try {
            const rules = await prisma.automationRule.findMany({
                where: { userId },
                include: {
                    channel: true,
                    split: true,
                    triggers: true,
                    actions: true,
                    _count: {
                        select: {
                            triggers: true,
                            actions: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            return reply.send({ rules });
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to fetch automation rules'
            });
        }
    });

    /**
     * GET /automation/rules/:id
     * Get single automation rule by ID
     */
    fastify.get<{
        Params: { id: string };
    }>('/rules/:id', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        const userId = (request.user as any).id;

        try {
            const { id } = idParamSchema.parse(request.params);

            const rule = await prisma.automationRule.findFirst({
                where: { id, userId },
                include: {
                    channel: true,
                    split: true,
                    triggers: true,
                    actions: true
                }
            });

            if (!rule) {
                return reply.code(404).send({
                    error: 'Not found',
                    message: 'Automation rule not found'
                });
            }

            return reply.send({ rule });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    error: 'Validation error',
                    errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to fetch automation rule'
            });
        }
    });

    /**
     * POST /automation/rules
     * Create new automation rule with governance check
     */
    fastify.post<{
        Body: {
            name: string;
            description?: string;
            categories: string[];
            minScore: number;
            maxPrice?: number;
            channelId?: string;
            splitId?: string;
            triggers: Array<{ type: string; config: any }>;
            actions: Array<{ type: string; config: any; order: number }>;
        };
    }>('/rules', {
        preHandler: [
            fastify.authenticate,
            checkAutomationLimit,  // Check if user can create more rules
            checkMinScore,         // Check if minScore is allowed
            checkABTesting,        // Check if A/B testing is allowed
        ]
    }, async (request, reply) => {
        const userId = (request.user as any).id;

        try {
            const {
                name,
                description,
                categories,
                minScore,
                maxPrice,
                channelId,
                splitId,
                triggers,
                actions
            } = createRuleSchema.parse(request.body);

            // Create rule with triggers and actions (transactional)
            const rule = await prisma.automationRule.create({
                data: {
                    userId,
                    name,
                    description,
                    categories: JSON.stringify(categories),
                    minScore,
                    maxPrice,
                    ...(channelId && channelId.trim() !== '' ? { channelId } : {}),
                    ...(splitId && splitId.trim() !== '' ? { splitId } : {}),
                    triggers: {
                        create: triggers.map(t => ({
                            type: t.type,
                            config: JSON.stringify(t.config)
                        }))
                    },
                    actions: {
                        create: actions.map(a => ({
                            type: a.type,
                            config: JSON.stringify(a.config),
                            order: a.order
                        }))
                    }
                },
                include: {
                    triggers: true,
                    actions: true,
                    channel: true,
                    split: true
                }
            });

            fastify.log.info({ ruleId: rule.id, userId }, 'Automation rule created');

            return reply.code(201).send({ rule });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    error: 'Validation error',
                    errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to create automation rule'
            });
        }
    });

    /**
     * PUT /automation/rules/:id
     * Update automation rule
     */
    fastify.put<{
        Params: { id: string };
        Body: Partial<{
            name: string;
            description: string;
            isActive: boolean;
            minScore: number;
            maxPrice: number;
            channelId: string;
            splitId: string;
        }>;
    }>('/rules/:id', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        const userId = (request.user as any).id;

        try {
            const { id } = idParamSchema.parse(request.params);
            const updateData = updateRuleSchema.parse(request.body);

            // Verify ownership
            const existing = await prisma.automationRule.findFirst({
                where: { id, userId }
            });

            if (!existing) {
                return reply.code(404).send({
                    error: 'Not found',
                    message: 'Automation rule not found'
                });
            }

            // If activating a rule, check active automation limit
            if (updateData.isActive === true && !existing.isActive) {
                await checkActiveAutomationLimit(request, reply);
            }

            // If changing minScore, check if it's allowed
            if (updateData.minScore !== undefined) {
                await checkMinScore(request, reply);
            }

            const rule = await prisma.automationRule.update({
                where: { id },
                data: updateData,
                include: {
                    triggers: true,
                    actions: true,
                    channel: true,
                    split: true
                }
            });

            fastify.log.info({ ruleId: id, userId }, 'Automation rule updated');

            return reply.send({ rule });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    error: 'Validation error',
                    errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to update automation rule'
            });
        }
    });

    /**
     * DELETE /automation/rules/:id
     * Delete automation rule
     */
    fastify.delete<{
        Params: { id: string };
    }>('/rules/:id', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        const userId = (request.user as any).id;

        try {
            const { id } = idParamSchema.parse(request.params);

            // Verify ownership
            const existing = await prisma.automationRule.findFirst({
                where: { id, userId }
            });

            if (!existing) {
                return reply.code(404).send({
                    error: 'Not found',
                    message: 'Automation rule not found'
                });
            }

            // Delete rule (triggers and actions cascade delete automatically)
            await prisma.automationRule.delete({
                where: { id }
            });

            fastify.log.info({ ruleId: id, userId }, 'Automation rule deleted');

            return reply.send({
                success: true,
                message: 'Automation rule deleted successfully'
            });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    error: 'Validation error',
                    errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to delete automation rule'
            });
        }
    });

    /**
     * POST /automation/rules/:id/run
     * Manually execute automation rule (for testing)
     */
    fastify.post<{
        Params: { id: string };
    }>('/rules/:id/run', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        const userId = (request.user as any).id;

        try {
            const { id } = idParamSchema.parse(request.params);

            // Verify ownership
            const rule = await prisma.automationRule.findFirst({
                where: { id, userId }
            });

            if (!rule) {
                return reply.code(404).send({
                    error: 'Not found',
                    message: 'Automation rule not found'
                });
            }

            if (!rule.isActive) {
                return reply.code(400).send({
                    error: 'Rule inactive',
                    message: 'Cannot execute inactive automation rule'
                });
            }

            fastify.log.info({ ruleId: id, userId }, 'Manually executing automation rule');

            // Execute rule
            const result = await RuleExecutor.executeRule(id);

            return reply.send({
                ...result,
                ruleName: rule.name,
                message: result.success
                    ? 'Automation rule executed successfully'
                    : 'Automation rule execution failed'
            });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    error: 'Validation error',
                    errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to execute automation rule'
            });
        }
    });

    /**
     * GET /automation/templates
     * List all automation templates for marketplace
     */
    fastify.get('/templates', async (request, reply) => {
        try {
            const templates = await prisma.automationTemplate.findMany({
                where: { isActive: true },
                orderBy: [
                    { popularity: 'desc' },
                    { createdAt: 'desc' }
                ]
            });

            return reply.send({ templates });
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to fetch templates'
            });
        }
    });

    /**
     * POST /automation/from-template
     * Clone a template to create user automation
     */
    fastify.post<{
        Body: { templateId: string };
    }>('/from-template', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        const userId = (request.user as any).id;

        try {
            const { templateId } = z.object({
                templateId: z.string().uuid('Invalid template ID')
            }).parse(request.body);

            // Find template
            const template = await prisma.automationTemplate.findUnique({
                where: { id: templateId }
            });

            if (!template) {
                return reply.code(404).send({
                    error: 'Not found',
                    message: 'Template not found'
                });
            }

            // Parse categories
            const categories = JSON.parse(template.categories);

            // Create automation from template
            const automation = await prisma.automationRule.create({
                data: {
                    userId,
                    name: template.name,
                    description: template.description,
                    categories: template.categories,
                    minScore: template.minScore,
                    maxPrice: template.maxPrice || undefined,
                    isActive: false, // User must activate manually
                    triggers: {
                        create: [
                            {
                                type: 'SCHEDULE',
                                config: JSON.stringify({ cron: template.schedule })
                            }
                        ]
                    },
                    actions: {
                        create: [
                            {
                                type: 'PUBLISH_CHANNEL',
                                config: JSON.stringify({ template: 'default' }),
                                order: 1
                            }
                        ]
                    }
                },
                include: {
                    triggers: true,
                    actions: true
                }
            });

            fastify.log.info({ automationId: automation.id, templateId, userId }, 'Automation created from template');

            return reply.code(201).send({
                automation,
                message: 'Automation created successfully. Configure your channel and activate it!'
            });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    error: 'Validation error',
                    errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to create automation from template'
            });
        }
    });

    /**
     * POST /automation/rules/:id/preview
     * Preview deals that match automation criteria
     */
    fastify.post<{
        Params: { id: string };
    }>('/rules/:id/preview', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        const userId = (request.user as any).id;

        try {
            const { id } = idParamSchema.parse(request.params);

            // Verify ownership
            const rule = await prisma.automationRule.findFirst({
                where: { id, userId }
            });

            if (!rule) {
                return reply.code(404).send({
                    error: 'Not found',
                    message: 'Automation rule not found'
                });
            }

            // Parse categories
            const categories = JSON.parse(rule.categories);

            // Find matching products (preview mode - limit to 5)
            const products = await prisma.product.findMany({
                where: {
                    category: categories.includes('All') ? undefined : { in: categories },
                    ...(rule.maxPrice && { currentPrice: { lte: rule.maxPrice } }),
                    discount: { gte: rule.minScore / 2 } // Simplified scoring for preview
                },
                orderBy: { discount: 'desc' },
                take: 5
            });

            // Calculate preview metrics
            const previewMetrics = {
                matchingDeals: products.length,
                estimatedClicks: products.length * 50, // Mock estimation
                estimatedRevenue: products.length * 5, // Mock estimation
                averageDiscount: products.length > 0
                    ? Math.round(products.reduce((sum, p) => sum + p.discount, 0) / products.length)
                    : 0
            };

            return reply.send({
                automation: {
                    id: rule.id,
                    name: rule.name,
                    filters: {
                        categories,
                        minScore: rule.minScore,
                        maxPrice: rule.maxPrice
                    }
                },
                preview: {
                    metrics: previewMetrics,
                    sampleDeals: products.map(p => ({
                        asin: p.asin,
                        title: p.title,
                        currentPrice: p.currentPrice,
                        originalPrice: p.originalPrice,
                        discount: p.discount,
                        rating: p.rating,
                        imageUrl: p.imageUrl
                    }))
                }
            });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    error: 'Validation error',
                    errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to generate preview'
            });
        }
    });
};

export default automationRoutes;
