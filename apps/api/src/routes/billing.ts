import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PlanType } from '@prisma/client';
import { StripeService } from '../services/StripeService';
import prisma from '../lib/prisma';

const APP_URL = process.env.APP_URL || 'https://afflyt.io';

export async function billingRoutes(fastify: FastifyInstance) {
  // Check if Stripe is configured
  fastify.get('/billing/status', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      configured: StripeService.isConfigured(),
      message: StripeService.isConfigured()
        ? 'Stripe is configured and ready'
        : 'Stripe is not configured. Add STRIPE_SECRET_KEY to enable billing.',
    };
  });

  // Create checkout session
  fastify.post(
    '/billing/checkout',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as { plan: string; billingCycle: 'monthly' | 'yearly' };
      const { plan, billingCycle } = body;
      const userId = (request as any).user.id;

      if (!['PRO', 'BUSINESS'].includes(plan)) {
        return reply.status(400).send({ error: 'Invalid plan' });
      }

      const result = await StripeService.createCheckoutSession(
        userId,
        plan as PlanType,
        billingCycle,
        `${APP_URL}/settings/billing?success=true`,
        `${APP_URL}/settings/billing?canceled=true`
      );

      if ('error' in result) {
        return reply.status(400).send({ error: result.error });
      }

      return { url: result.url };
    }
  );

  // Create billing portal session
  fastify.post(
    '/billing/portal',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.id;

      const result = await StripeService.createBillingPortalSession(
        userId,
        `${APP_URL}/settings/billing`
      );

      if ('error' in result) {
        return reply.status(400).send({ error: result.error });
      }

      return { url: result.url };
    }
  );

  // Cancel subscription
  fastify.post(
    '/billing/cancel',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.id;

      const result = await StripeService.cancelSubscription(userId);

      if (!result.success) {
        return reply.status(400).send({ error: result.error });
      }

      return { success: true, message: 'Subscription will be canceled at period end' };
    }
  );

  // Get subscription info
  fastify.get(
    '/billing/subscription',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.id;

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: {
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          paymentMethods: true,
        },
      });

      if (!subscription) {
        // Return default FREE subscription info
        return {
          plan: 'FREE',
          status: 'ACTIVE',
          invoices: [],
          paymentMethods: [],
        };
      }

      return subscription;
    }
  );

  // Stripe webhook handler
  fastify.post(
    '/billing/webhook',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const signature = request.headers['stripe-signature'] as string;

      if (!signature) {
        return reply.status(400).send({ error: 'Missing stripe-signature header' });
      }

      // Get raw body - Fastify stores it in rawBody when configured
      const rawBody = (request as any).rawBody || JSON.stringify(request.body);

      const result = await StripeService.handleWebhook(rawBody, signature);

      if (!result.success) {
        console.error('[Webhook] Error:', result.error);
        return reply.status(400).send({ error: result.error });
      }

      return { received: true };
    }
  );
}

export default billingRoutes;
