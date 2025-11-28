import { FastifyPluginAsync } from 'fastify';
import { TriggerType, ActionType } from '@prisma/client';
import { RuleExecutor } from '../services/RuleExecutor';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { checkActiveAutomationLimit, checkMinScore } from '../middleware/planGuard';

// ═══════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const triggerActionSchema = z.object({
    type: z.string().min(1),
    config: z.any(),
    order: z.number().int().nonnegative().optional()
});

// Schedule presets with their values
const SCHEDULE_PRESETS = {
    relaxed: { intervalMinutes: 360, dealsPerRun: 3 },   // 6 ore
    active: { intervalMinutes: 120, dealsPerRun: 3 },    // 2 ore
    intensive: { intervalMinutes: 60, dealsPerRun: 5 },  // 1 ora
    custom: { intervalMinutes: 360, dealsPerRun: 3 },    // default, user sets values
} as const;

/**
 * Calculate next run time with jitter to avoid bot-like behavior
 */
function calculateNextRunWithJitter(intervalMinutes: number): Date {
    // Jitter ±15% dell'intervallo (max ±30 min)
    const jitterMax = Math.min(intervalMinutes * 0.15, 30);
    const jitter = (Math.random() - 0.5) * 2 * jitterMax;
    return new Date(Date.now() + (intervalMinutes + jitter) * 60 * 1000);
}

/**
 * Full create rule schema - includes all tier filters
 * Actual tier validation happens in validateFiltersForPlan()
 */
const createRuleSchema = z.object({
    // Basic info
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(500).optional(),

    // FREE tier filters
    categories: z.array(z.string()).min(1, 'At least one category is required'),
    minScore: z.number().min(0).max(100, 'Score must be between 0 and 100').default(70),

    // PRO tier filters
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    minDiscount: z.number().min(0).max(100).optional(),
    minRating: z.number().min(0).max(500).optional(), // 0-500 scale (400 = 4.0 stars)
    minReviews: z.number().int().nonnegative().optional(),
    maxSalesRank: z.number().int().positive().optional(),

    // BUSINESS tier filters
    amazonOnly: z.boolean().optional(),
    fbaOnly: z.boolean().optional(),
    hasCoupon: z.boolean().optional(),
    primeOnly: z.boolean().optional(),
    brandInclude: z.array(z.string()).optional(),
    brandExclude: z.array(z.string()).optional(),
    listedAfter: z.string().datetime().optional(),

    // Scheduling (NEW)
    schedulePreset: z.enum(['relaxed', 'active', 'intensive', 'custom']).default('relaxed'),
    intervalMinutes: z.number().int().min(30).max(1440).optional(), // 30min - 24h
    dealsPerRun: z.number().int().min(1).max(30).optional(),

    // Publishing
    channelId: z.string().uuid().optional().or(z.literal('')),
    splitId: z.string().uuid().optional().or(z.literal('')),

    // Deal Publish Mode
    dealPublishMode: z.enum(['DISCOUNTED_ONLY', 'LOWEST_PRICE', 'BOTH']).default('DISCOUNTED_ONLY'),
    includeKeepaChart: z.boolean().default(false),

    // Triggers/Actions (optional - will use defaults if not provided)
    triggers: z.array(triggerActionSchema).optional(),
    actions: z.array(triggerActionSchema.extend({ order: z.number().int().nonnegative() })).optional(),

    // Activation
    isActive: z.boolean().default(true),
});

const updateRuleSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional(),

    // FREE tier
    categories: z.array(z.string()).min(1).optional(),
    minScore: z.number().min(0).max(100).optional(),

    // PRO tier
    minPrice: z.number().positive().nullable().optional(),
    maxPrice: z.number().positive().nullable().optional(),
    minDiscount: z.number().min(0).max(100).nullable().optional(),
    minRating: z.number().min(0).max(500).nullable().optional(),
    minReviews: z.number().int().nonnegative().nullable().optional(),
    maxSalesRank: z.number().int().positive().nullable().optional(),

    // BUSINESS tier
    amazonOnly: z.boolean().optional(),
    fbaOnly: z.boolean().optional(),
    hasCoupon: z.boolean().optional(),
    primeOnly: z.boolean().optional(),
    brandInclude: z.array(z.string()).optional(),
    brandExclude: z.array(z.string()).optional(),
    listedAfter: z.string().datetime().nullable().optional(),

    // Scheduling (NEW)
    schedulePreset: z.enum(['relaxed', 'active', 'intensive', 'custom']).optional(),
    intervalMinutes: z.number().int().min(30).max(1440).optional(),
    dealsPerRun: z.number().int().min(1).max(30).optional(),

    // Publishing
    channelId: z.string().uuid().optional().or(z.literal('')),
    splitId: z.string().uuid().optional().or(z.literal('')),

    // Deal Publish Mode (NEW)
    dealPublishMode: z.enum(['DISCOUNTED_ONLY', 'LOWEST_PRICE', 'BOTH']).optional(),
    includeKeepaChart: z.boolean().optional(),
});

const idParamSchema = z.object({
    id: z.string().uuid('Invalid ID format')
});

// ═══════════════════════════════════════════════════════════════
// TIER-BASED FILTER LIMITS
// ═══════════════════════════════════════════════════════════════

interface PlanFilterLimits {
    allowedFilters: string[];
    maxCategories: number;
    maxResultsPerRun: number;
    defaultCron: string;
    // Scheduling limits (NEW)
    allowedPresets: string[];
    minIntervalMinutes: number;
    maxDealsPerRun: number;
}

const PLAN_FILTER_LIMITS: Record<string, PlanFilterLimits> = {
    FREE: {
        allowedFilters: ['categories', 'minScore'],
        maxCategories: 3,
        maxResultsPerRun: 5,
        defaultCron: '0 */6 * * *', // Every 6 hours
        // Scheduling
        allowedPresets: ['relaxed', 'active'],
        minIntervalMinutes: 120, // Min 2 ore
        maxDealsPerRun: 3,
    },
    PRO: {
        allowedFilters: [
            'categories', 'minScore',
            'minPrice', 'maxPrice', 'minDiscount',
            'minRating', 'minReviews', 'maxSalesRank'
        ],
        maxCategories: 8,
        maxResultsPerRun: 15,
        defaultCron: '0 */2 * * *', // Every 2 hours
        // Scheduling
        allowedPresets: ['relaxed', 'active', 'intensive', 'custom'],
        minIntervalMinutes: 60, // Min 1 ora
        maxDealsPerRun: 10,
    },
    BUSINESS: {
        allowedFilters: [
            'categories', 'minScore',
            'minPrice', 'maxPrice', 'minDiscount',
            'minRating', 'minReviews', 'maxSalesRank',
            'amazonOnly', 'fbaOnly', 'hasCoupon', 'primeOnly',
            'brandInclude', 'brandExclude', 'listedAfter'
        ],
        maxCategories: 16,
        maxResultsPerRun: 30,
        defaultCron: '*/30 * * * *', // Every 30 minutes
        // Scheduling
        allowedPresets: ['relaxed', 'active', 'intensive', 'custom'],
        minIntervalMinutes: 30, // Min 30 minuti
        maxDealsPerRun: 30,
    },
};

/**
 * Validate and filter mission config based on user plan
 * Strips unauthorized filters and enforces limits
 */
function validateFiltersForPlan(
    filters: Record<string, any>,
    userPlan: string
): { valid: Record<string, any>; stripped: string[]; warnings: string[] } {
    const limits = PLAN_FILTER_LIMITS[userPlan] || PLAN_FILTER_LIMITS.FREE;
    const valid: Record<string, any> = {};
    const stripped: string[] = [];
    const warnings: string[] = [];

    // Filter fields to check
    const filterFields = [
        'categories', 'minScore',
        'minPrice', 'maxPrice', 'minDiscount',
        'minRating', 'minReviews', 'maxSalesRank',
        'amazonOnly', 'fbaOnly', 'hasCoupon', 'primeOnly',
        'brandInclude', 'brandExclude', 'listedAfter'
    ];

    for (const key of filterFields) {
        const value = filters[key];

        if (value === undefined || value === null || value === '') {
            continue;
        }

        if (limits.allowedFilters.includes(key)) {
            // Special handling for categories limit
            if (key === 'categories' && Array.isArray(value)) {
                if (value.length > limits.maxCategories) {
                    valid[key] = value.slice(0, limits.maxCategories);
                    warnings.push(`categories limited to ${limits.maxCategories} for ${userPlan} plan`);
                } else {
                    valid[key] = value;
                }
            } else {
                valid[key] = value;
            }
        } else {
            // Filter not allowed for this plan
            stripped.push(key);
        }
    }

    // Always include defaults if not set
    if (!valid.minScore) {
        valid.minScore = 70;
    }

    return { valid, stripped, warnings };
}

/**
 * Get default cron expression based on plan
 */
function getDefaultCronForPlan(plan: string): string {
    return PLAN_FILTER_LIMITS[plan]?.defaultCron || PLAN_FILTER_LIMITS.FREE.defaultCron;
}

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
                    errors: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
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
     * Create new automation rule (mission) with tier-based filter validation
     */
    fastify.post<{
        Body: z.infer<typeof createRuleSchema>;
    }>('/rules', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        console.log('[POST /rules] Handler starting');
        const userId = (request.user as any)?.id;
        const userPlan = (request.user as any)?.plan || 'FREE';

        console.log('[POST /rules] User ID:', userId, 'Plan:', userPlan);

        // Check automation limit inline
        try {
            const automationCount = await prisma.automationRule.count({ where: { userId } });
            console.log('[POST /rules] Current automation count:', automationCount);

            const limits = PLAN_FILTER_LIMITS[userPlan] || PLAN_FILTER_LIMITS.FREE;
            const maxAutomations = userPlan === 'BUSINESS' ? 50 : userPlan === 'PRO' ? 20 : 10;

            if (automationCount >= maxAutomations) {
                console.log('[POST /rules] Automation limit exceeded');
                return reply.code(403).send({
                    error: 'LIMIT_EXCEEDED',
                    message: `You have reached the maximum of ${maxAutomations} automations for your ${userPlan} plan`,
                });
            }
        } catch (err) {
            console.error('[POST /rules] Error checking automation limit:', err);
            return reply.code(500).send({ error: 'Internal error', message: 'Failed to check automation limit' });
        }

        console.log('[POST /rules] Request body:', JSON.stringify(request.body, null, 2));

        try {
            const parsed = createRuleSchema.parse(request.body);
            console.log('[POST /rules] Validation passed');

            // Validate filters based on user plan
            const { valid: validFilters, stripped, warnings } = validateFiltersForPlan(parsed, userPlan);

            // Log if filters were stripped
            if (stripped.length > 0) {
                fastify.log.info({
                    userId,
                    userPlan,
                    strippedFilters: stripped,
                }, 'Some filters were stripped due to plan limitations');
            }

            // Get plan limits for max results
            const planLimits = PLAN_FILTER_LIMITS[userPlan] || PLAN_FILTER_LIMITS.FREE;

            // Validate and apply scheduling settings
            let schedulePreset = parsed.schedulePreset || 'relaxed';
            let intervalMinutes: number;
            let dealsPerRun: number;

            // Check if preset is allowed for this plan
            if (!planLimits.allowedPresets.includes(schedulePreset)) {
                schedulePreset = 'relaxed'; // Fallback to allowed preset
                warnings.push(`Preset '${parsed.schedulePreset}' not available for ${userPlan} plan, using 'relaxed'`);
            }

            // Get values from preset or custom
            if (schedulePreset === 'custom') {
                intervalMinutes = Math.max(
                    parsed.intervalMinutes || SCHEDULE_PRESETS.custom.intervalMinutes,
                    planLimits.minIntervalMinutes
                );
                dealsPerRun = Math.min(
                    parsed.dealsPerRun || SCHEDULE_PRESETS.custom.dealsPerRun,
                    planLimits.maxDealsPerRun
                );
            } else {
                const presetValues = SCHEDULE_PRESETS[schedulePreset as keyof typeof SCHEDULE_PRESETS];
                intervalMinutes = presetValues.intervalMinutes;
                dealsPerRun = Math.min(presetValues.dealsPerRun, planLimits.maxDealsPerRun);
            }

            // Calculate first nextRunAt with jitter (if rule is active)
            const nextRunAt = parsed.isActive ? calculateNextRunWithJitter(intervalMinutes) : null;

            // Use provided triggers/actions or create defaults
            const triggers = parsed.triggers && parsed.triggers.length > 0
                ? parsed.triggers
                : [{ type: 'SCHEDULE', config: { cron: getDefaultCronForPlan(userPlan) } }];

            const actions = parsed.actions && parsed.actions.length > 0
                ? parsed.actions
                : [{ type: 'PUBLISH_CHANNEL', config: { maxDeals: dealsPerRun }, order: 0 }];

            // Create rule with validated filters
            const rule = await prisma.automationRule.create({
                data: {
                    userId,
                    name: parsed.name,
                    description: parsed.description,
                    isActive: parsed.isActive,

                    // Apply validated filters
                    categories: validFilters.categories || [],
                    minScore: validFilters.minScore || 70,

                    // PRO filters (will be null if stripped)
                    minPrice: validFilters.minPrice,
                    maxPrice: validFilters.maxPrice,
                    minDiscount: validFilters.minDiscount,
                    minRating: validFilters.minRating,
                    minReviews: validFilters.minReviews,
                    maxSalesRank: validFilters.maxSalesRank,

                    // BUSINESS filters (will be default/null if stripped)
                    amazonOnly: validFilters.amazonOnly || false,
                    fbaOnly: validFilters.fbaOnly || false,
                    hasCoupon: validFilters.hasCoupon || false,
                    primeOnly: validFilters.primeOnly || false,
                    brandInclude: validFilters.brandInclude || [],
                    brandExclude: validFilters.brandExclude || [],
                    listedAfter: validFilters.listedAfter ? new Date(validFilters.listedAfter) : null,

                    // Scheduling (NEW)
                    schedulePreset,
                    intervalMinutes,
                    dealsPerRun,
                    nextRunAt,

                    // Publishing
                    ...(parsed.channelId && parsed.channelId.trim() !== '' ? { channelId: parsed.channelId } : {}),
                    ...(parsed.splitId && parsed.splitId.trim() !== '' ? { splitId: parsed.splitId } : {}),

                    // Deal Publish Mode
                    dealPublishMode: parsed.dealPublishMode,
                    includeKeepaChart: parsed.includeKeepaChart,

                    // Triggers and actions
                    triggers: {
                        create: triggers.map(t => ({
                            type: t.type as TriggerType,
                            config: t.config
                        }))
                    },
                    actions: {
                        create: actions.map((a, index) => ({
                            type: a.type as ActionType,
                            config: a.config,
                            order: a.order ?? index
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

            fastify.log.info({ ruleId: rule.id, userId, userPlan }, 'Automation rule (mission) created');

            return reply.code(201).send({
                success: true,
                rule,
                planLimits: {
                    maxCategories: planLimits.maxCategories,
                    maxResultsPerRun: planLimits.maxResultsPerRun,
                    frequency: planLimits.defaultCron,
                    // Scheduling limits
                    allowedPresets: planLimits.allowedPresets,
                    minIntervalMinutes: planLimits.minIntervalMinutes,
                    maxDealsPerRun: planLimits.maxDealsPerRun,
                },
                scheduling: {
                    preset: schedulePreset,
                    intervalMinutes,
                    dealsPerRun,
                    nextRunAt,
                    estimatedDealsPerDay: Math.round((24 * 60 / intervalMinutes) * dealsPerRun),
                },
                warnings: stripped.length > 0 || warnings.length > 0 ? {
                    message: 'Some filters were adjusted based on your plan',
                    strippedFilters: stripped,
                    adjustments: warnings,
                    upgradeTip: stripped.length > 0 ? `Upgrade to ${userPlan === 'FREE' ? 'PRO' : 'BUSINESS'} to unlock more filters` : undefined,
                } : undefined,
            });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    error: 'Validation error',
                    errors: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
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

            // Debug logging
            console.log('[PUT /rules/:id] Raw body:', JSON.stringify(request.body, null, 2));

            const updateData = updateRuleSchema.parse(request.body);

            console.log('[PUT /rules/:id] Parsed updateData:', JSON.stringify(updateData, null, 2));
            console.log('[PUT /rules/:id] dealPublishMode:', updateData.dealPublishMode);
            console.log('[PUT /rules/:id] includeKeepaChart:', updateData.includeKeepaChart);

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
                    errors: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
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
                    errors: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
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
                    errors: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
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

            // Categories is now a native array in PostgreSQL
            const categories = template.categories;

            // Create automation from template
            const automation = await prisma.automationRule.create({
                data: {
                    userId,
                    name: template.name,
                    description: template.description,
                    categories: categories,
                    minScore: template.minScore,
                    maxPrice: template.maxPrice || undefined,
                    isActive: false, // User must activate manually
                    triggers: {
                        create: [
                            {
                                type: 'SCHEDULE' as TriggerType,
                                config: { cron: template.schedule }
                            }
                        ]
                    },
                    actions: {
                        create: [
                            {
                                type: 'PUBLISH_CHANNEL' as ActionType,
                                config: { template: 'default' },
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
                    errors: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
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

            // Categories is now a native array in PostgreSQL
            const categories = rule.categories;

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
                    errors: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to generate preview'
            });
        }
    });

    /**
     * GET /automation/wizard-config
     * Get configuration for mission wizard (categories, plan limits, etc.)
     */
    fastify.get('/wizard-config', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        const userPlan = (request.user as any).plan || 'FREE';

        try {
            // Import categories from data file
            const { AMAZON_IT_CATEGORIES } = await import('../data/amazon-categories');

            const planLimits = PLAN_FILTER_LIMITS[userPlan] || PLAN_FILTER_LIMITS.FREE;

            return reply.send({
                categories: AMAZON_IT_CATEGORIES.map(cat => ({
                    id: cat.id.toString(),
                    name: cat.name,
                    nameEN: cat.nameEN,
                    isGated: cat.isGated,
                    avgDiscount: cat.avgDiscount,
                    priceRange: cat.priceRange,
                    competition: cat.competition,
                })),
                planLimits: {
                    plan: userPlan,
                    maxCategories: planLimits.maxCategories,
                    maxResultsPerRun: planLimits.maxResultsPerRun,
                    frequency: planLimits.defaultCron,
                    frequencyLabel: userPlan === 'BUSINESS' ? 'Every 30 minutes' :
                                    userPlan === 'PRO' ? 'Every 2 hours' : 'Every 6 hours',
                    allowedFilters: planLimits.allowedFilters,
                    // Scheduling limits
                    allowedPresets: planLimits.allowedPresets,
                    minIntervalMinutes: planLimits.minIntervalMinutes,
                    maxDealsPerRun: planLimits.maxDealsPerRun,
                },
                filterTiers: {
                    FREE: ['categories', 'minScore'],
                    PRO: ['minPrice', 'maxPrice', 'minDiscount', 'minRating', 'minReviews', 'maxSalesRank'],
                    BUSINESS: ['amazonOnly', 'fbaOnly', 'hasCoupon', 'primeOnly', 'brandInclude', 'brandExclude', 'listedAfter'],
                },
                scorePresets: [
                    { value: 0, label: 'all', labelIT: 'Tutte le Offerte' },
                    { value: 50, label: 'decent', labelIT: 'Offerte Discrete' },
                    { value: 70, label: 'good', labelIT: 'Buone Offerte', recommended: true },
                    { value: 85, label: 'excellent', labelIT: 'Solo Eccellenti' },
                ],
                // Schedule presets (NEW)
                schedulePresets: [
                    {
                        id: 'relaxed',
                        label: 'Rilassato',
                        labelEN: 'Relaxed',
                        emoji: '🐢',
                        intervalMinutes: 360,
                        dealsPerRun: 3,
                        estimatedPerDay: 12,
                        description: '3 offerte ogni 6 ore',
                        descriptionEN: '3 deals every 6 hours',
                        availableFor: ['FREE', 'PRO', 'BUSINESS'],
                    },
                    {
                        id: 'active',
                        label: 'Attivo',
                        labelEN: 'Active',
                        emoji: '⚡',
                        intervalMinutes: 120,
                        dealsPerRun: 3,
                        estimatedPerDay: 36,
                        description: '3 offerte ogni 2 ore',
                        descriptionEN: '3 deals every 2 hours',
                        availableFor: ['FREE', 'PRO', 'BUSINESS'],
                    },
                    {
                        id: 'intensive',
                        label: 'Intensivo',
                        labelEN: 'Intensive',
                        emoji: '🔥',
                        intervalMinutes: 60,
                        dealsPerRun: 5,
                        estimatedPerDay: 120,
                        description: '5 offerte ogni ora',
                        descriptionEN: '5 deals every hour',
                        availableFor: ['PRO', 'BUSINESS'],
                    },
                    {
                        id: 'custom',
                        label: 'Personalizzato',
                        labelEN: 'Custom',
                        emoji: '⚙️',
                        intervalMinutes: null, // User sets
                        dealsPerRun: null, // User sets
                        estimatedPerDay: null,
                        description: 'Configura manualmente',
                        descriptionEN: 'Configure manually',
                        availableFor: ['PRO', 'BUSINESS'],
                    },
                ],
            });
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to fetch wizard configuration'
            });
        }
    });
};

export default automationRoutes;
