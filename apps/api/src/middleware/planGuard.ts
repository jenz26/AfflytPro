/**
 * Plan Guard Middleware
 * Enforces plan-based feature limits and access control
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  PLAN_LIMITS,
  PlanType,
  canCreateAutomation,
  canActivateAutomation,
  isScoreAllowed,
  canAddChannel,
  hasFeature,
  getUpgradeReason,
  getPlanLabel,
  getNextPlan,
  getPlanPrice,
} from '../config/planLimits';

const prisma = new PrismaClient();

/**
 * Custom error class for plan-related restrictions
 */
export class PlanGuardError extends Error {
  constructor(
    message: string,
    public currentPlan: string,
    public requiredFeature: string,
    public upgradeUrl: string = '/settings/subscription',
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'PlanGuardError';
  }

  toJSON() {
    const nextPlan = getNextPlan(this.currentPlan);
    const price = nextPlan ? getPlanPrice(nextPlan) : null;

    return {
      error: 'UPGRADE_REQUIRED',
      message: this.message,
      currentPlan: this.currentPlan,
      currentPlanLabel: getPlanLabel(this.currentPlan),
      requiredFeature: this.requiredFeature,
      suggestedPlan: nextPlan,
      suggestedPlanLabel: nextPlan ? getPlanLabel(nextPlan) : null,
      suggestedPlanPrice: price,
      upgradeUrl: this.upgradeUrl,
      upgradeReason: getUpgradeReason(this.currentPlan, this.requiredFeature as any),
    };
  }
}

/**
 * Check if user has reached automation creation limit
 */
export async function checkAutomationLimit(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    console.log('[checkAutomationLimit] Starting check for user');

    if (!request.user) {
      console.error('[checkAutomationLimit] No user on request!');
      return reply.code(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
    }

    const userId = request.user.id;
    const userPlan = request.user.plan as string || 'FREE';

    console.log('[checkAutomationLimit] User:', userId, 'Plan:', userPlan);

    const count = await prisma.automationRule.count({
      where: { userId },
    });

    console.log('[checkAutomationLimit] Current automation count:', count);

    if (!canCreateAutomation(userPlan, count)) {
      const limits = PLAN_LIMITS[userPlan as PlanType];
      console.log('[checkAutomationLimit] Limit exceeded');
      return reply.code(403).send(new PlanGuardError(
        `You've reached the limit of ${limits.automations.total} automations for ${getPlanLabel(userPlan)} plan`,
        userPlan,
        'more_automations'
      ).toJSON());
    }

    console.log('[checkAutomationLimit] Check passed');
  } catch (error) {
    console.error('[checkAutomationLimit] Error:', error);
    return reply.code(500).send({ error: 'Internal error', message: 'Failed to check automation limit' });
  }
}

/**
 * Check if user has reached active automation limit
 */
export async function checkActiveAutomationLimit(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;
  const userPlan = request.user.plan as string;

  const activeCount = await prisma.automationRule.count({
    where: { userId, isActive: true },
  });

  if (!canActivateAutomation(userPlan, activeCount)) {
    const limits = PLAN_LIMITS[userPlan as PlanType];
    throw new PlanGuardError(
      `You've reached the limit of ${limits.automations.active} active automations for ${getPlanLabel(userPlan)} plan`,
      userPlan,
      'more_active_automations'
    );
  }
}

/**
 * Check if requested minScore is allowed for user's plan
 */
export function checkMinScore(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userPlan = request.user.plan as string;
  const requestedScore = (request.body as any).minScore;

  if (!isScoreAllowed(userPlan, requestedScore)) {
    const limits = PLAN_LIMITS[userPlan as PlanType];
    throw new PlanGuardError(
      `${getPlanLabel(userPlan)} plan requires minScore >= ${limits.minScore}. You requested ${requestedScore}.`,
      userPlan,
      'lower_score_threshold'
    );
  }
}

/**
 * Check if user has reached channel limit
 */
export async function checkChannelLimit(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;
  const userPlan = request.user.plan as string;

  const count = await prisma.channel.count({
    where: { userId },
  });

  if (!canAddChannel(userPlan, count)) {
    const limits = PLAN_LIMITS[userPlan as PlanType];
    throw new PlanGuardError(
      `You've reached the limit of ${limits.channels} channels for ${getPlanLabel(userPlan)} plan`,
      userPlan,
      'more_channels'
    );
  }
}

/**
 * Check if AI Copy feature is available
 */
export function checkAIFeature(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userPlan = request.user.plan as string;

  if (!hasFeature(userPlan, 'aiCopy')) {
    throw new PlanGuardError(
      'AI Copy is available from PRO plan',
      userPlan,
      'ai_copy'
    );
  }
}

/**
 * Check if A/B Testing feature is available
 */
export function checkABTesting(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    console.log('[checkABTesting] Starting check');

    if (!request.user) {
      console.error('[checkABTesting] No user on request!');
      return reply.code(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
    }

    const userPlan = request.user.plan as string || 'FREE';
    const body = request.body as any;

    console.log('[checkABTesting] User plan:', userPlan, 'splitId:', body?.splitId);

    // Only check if user is trying to use A/B testing
    if (body?.splitId && !hasFeature(userPlan, 'abTesting')) {
      console.log('[checkABTesting] A/B testing not allowed for plan');
      return reply.code(403).send(new PlanGuardError(
        'A/B Testing is available from PRO plan',
        userPlan,
        'ab_testing'
      ).toJSON());
    }

    console.log('[checkABTesting] Check passed');
  } catch (error) {
    console.error('[checkABTesting] Error:', error);
    return reply.code(500).send({ error: 'Internal error', message: 'Failed to check A/B testing access' });
  }
}

/**
 * Check if Custom Templates feature is available
 */
export function checkCustomTemplates(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userPlan = request.user.plan as string;

  if (!hasFeature(userPlan, 'customTemplates')) {
    throw new PlanGuardError(
      'Custom Templates are available from PRO plan',
      userPlan,
      'custom_templates'
    );
  }
}

/**
 * Check if API Access feature is available
 */
export function checkAPIAccess(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userPlan = request.user.plan as string;

  if (!hasFeature(userPlan, 'apiAccess')) {
    throw new PlanGuardError(
      'API Access is available from BUSINESS plan',
      userPlan,
      'api_access'
    );
  }
}

/**
 * Check if Webhooks feature is available
 */
export function checkWebhooks(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userPlan = request.user.plan as string;

  if (!hasFeature(userPlan, 'webhooks')) {
    throw new PlanGuardError(
      'Webhooks are available from BUSINESS plan',
      userPlan,
      'webhooks'
    );
  }
}

/**
 * Global error handler for PlanGuardError
 * Add this to your Fastify app setup
 */
export function setupPlanGuardErrorHandler(app: any) {
  app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof PlanGuardError) {
      return reply.code(error.statusCode).send(error.toJSON());
    }

    // Let other errors be handled by default handler
    throw error;
  });
}

/**
 * Decorator to add plan info to request
 * Usage: app.decorateRequest('planLimits', null)
 */
export async function decorateRequestWithPlan(request: FastifyRequest) {
  if (!request.user) return;

  const userPlan = request.user.plan as string;
  (request as any).planLimits = PLAN_LIMITS[userPlan as PlanType];
  (request as any).planType = userPlan;
}
