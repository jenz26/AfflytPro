import { PrismaClient, PlanType, SubscriptionStatus, NotificationType } from '@prisma/client';
import { NotificationService } from './NotificationService';

const prisma = new PrismaClient();

// Stripe will be initialized when API keys are configured
let stripe: any = null;

// Try to initialize Stripe if key is available
if (process.env.STRIPE_SECRET_KEY) {
  try {
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    console.log('[StripeService] Stripe initialized successfully');
  } catch (error) {
    console.warn('[StripeService] Failed to initialize Stripe:', error);
  }
} else {
  console.log('[StripeService] Stripe not configured (STRIPE_SECRET_KEY not set)');
}

// Price IDs mapping (configure these in Stripe Dashboard)
const PRICE_IDS: Record<PlanType, { monthly: string; yearly: string }> = {
  FREE: { monthly: '', yearly: '' },
  PRO: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  },
  BUSINESS: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_monthly',
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || 'price_business_yearly',
  },
  BETA_TESTER: { monthly: '', yearly: '' }, // Beta testers don't pay
};

// Reverse mapping from price ID to plan
const getPlanFromPriceId = (priceId: string): PlanType => {
  for (const [plan, prices] of Object.entries(PRICE_IDS)) {
    if (prices.monthly === priceId || prices.yearly === priceId) {
      return plan as PlanType;
    }
  }
  return PlanType.FREE;
};

/**
 * StripeService - Handles all Stripe-related operations
 * This service is pre-configured and ready to use once you add Stripe API keys
 */
export class StripeService {
  /**
   * Check if Stripe is configured
   */
  static isConfigured(): boolean {
    return stripe !== null;
  }

  /**
   * Create or get Stripe customer for a user
   */
  static async getOrCreateCustomer(userId: string): Promise<string | null> {
    if (!stripe) {
      console.warn('[StripeService] Stripe not configured');
      return null;
    }

    // Check if user already has a subscription with customer ID
    const existingSub = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSub?.stripeCustomerId) {
      return existingSub.stripeCustomerId;
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) return null;

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId },
    });

    // Create or update subscription record
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: customer.id,
        status: SubscriptionStatus.ACTIVE,
        plan: PlanType.FREE,
      },
      update: {
        stripeCustomerId: customer.id,
      },
    });

    return customer.id;
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(
    userId: string,
    plan: PlanType,
    billingCycle: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string
  ): Promise<{ url: string } | { error: string }> {
    if (!stripe) {
      return { error: 'Stripe not configured' };
    }

    if (plan === PlanType.FREE) {
      return { error: 'Cannot checkout for FREE plan' };
    }

    const customerId = await this.getOrCreateCustomer(userId);
    if (!customerId) {
      return { error: 'Failed to create customer' };
    }

    const priceId = PRICE_IDS[plan][billingCycle];
    if (!priceId) {
      return { error: 'Invalid plan or billing cycle' };
    }

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId, plan, billingCycle },
      });

      return { url: session.url };
    } catch (error: any) {
      console.error('[StripeService] Checkout session error:', error);
      return { error: error.message };
    }
  }

  /**
   * Create a billing portal session
   */
  static async createBillingPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<{ url: string } | { error: string }> {
    if (!stripe) {
      return { error: 'Stripe not configured' };
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      return { error: 'No subscription found' };
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });

      return { url: session.url };
    } catch (error: any) {
      console.error('[StripeService] Billing portal error:', error);
      return { error: error.message };
    }
  }

  /**
   * Cancel subscription at period end
   */
  static async cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      return { success: false, error: 'No active subscription' };
    }

    try {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await prisma.subscription.update({
        where: { userId },
        data: { cancelAtPeriodEnd: true },
      });

      // Send notification
      await NotificationService.send(userId, NotificationType.SUBSCRIPTION_CANCELED, {});

      return { success: true };
    } catch (error: any) {
      console.error('[StripeService] Cancel subscription error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== WEBHOOK HANDLERS ====================

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(
    rawBody: string | Buffer,
    signature: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return { success: false, error: 'Webhook secret not configured' };
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error: any) {
      console.error('[StripeService] Webhook signature verification failed:', error.message);
      return { success: false, error: `Webhook error: ${error.message}` };
    }

    console.log(`[StripeService] Processing webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object);
          break;

        default:
          console.log(`[StripeService] Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error(`[StripeService] Error processing ${event.type}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle checkout.session.completed
   */
  private static async handleCheckoutCompleted(session: any) {
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    // Find user by customer ID
    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!subscription) {
      console.error('[StripeService] No subscription found for customer:', customerId);
      return;
    }

    // Get subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = stripeSubscription.items.data[0]?.price.id;
    const plan = getPlanFromPriceId(priceId);

    // Update local subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        status: SubscriptionStatus.ACTIVE,
        plan,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    // Update user plan
    await prisma.user.update({
      where: { id: subscription.userId },
      data: { plan },
    });

    // Send notification
    await NotificationService.send(subscription.userId, NotificationType.SUBSCRIPTION_ACTIVATED, {
      plan,
    });

    console.log(`[StripeService] Subscription activated for user ${subscription.userId}: ${plan}`);
  }

  /**
   * Handle customer.subscription.updated
   */
  private static async handleSubscriptionUpdated(stripeSubscription: any) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    const priceId = stripeSubscription.items.data[0]?.price.id;
    const plan = getPlanFromPriceId(priceId);

    // Map Stripe status to our status
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.UNPAID,
      trialing: SubscriptionStatus.TRIALING,
      paused: SubscriptionStatus.PAUSED,
    };

    const status = statusMap[stripeSubscription.status] || SubscriptionStatus.ACTIVE;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        stripePriceId: priceId,
        status,
        plan,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        trialStart: stripeSubscription.trial_start
          ? new Date(stripeSubscription.trial_start * 1000)
          : null,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
      },
    });

    // Update user plan
    await prisma.user.update({
      where: { id: subscription.userId },
      data: { plan },
    });

    // Send notification if plan changed
    await NotificationService.send(subscription.userId, NotificationType.SUBSCRIPTION_UPDATED, {
      plan,
      status,
    });
  }

  /**
   * Handle customer.subscription.deleted
   */
  private static async handleSubscriptionDeleted(stripeSubscription: any) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELED,
        plan: PlanType.FREE,
      },
    });

    // Downgrade user to FREE
    await prisma.user.update({
      where: { id: subscription.userId },
      data: { plan: PlanType.FREE },
    });

    await NotificationService.send(subscription.userId, NotificationType.SUBSCRIPTION_CANCELED, {});
  }

  /**
   * Handle invoice.paid
   */
  private static async handleInvoicePaid(invoice: any) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: invoice.customer },
    });

    if (!subscription) return;

    // Save invoice
    await prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      create: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'paid',
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        paidAt: new Date(),
      },
      update: {
        status: 'paid',
        paidAt: new Date(),
      },
    });

    // Send notification
    await NotificationService.send(subscription.userId, NotificationType.PAYMENT_SUCCESS, {
      amount: (invoice.amount_paid / 100).toFixed(2),
      plan: subscription.plan,
      invoiceUrl: invoice.hosted_invoice_url,
      nextBillingDate: subscription.currentPeriodEnd?.toLocaleDateString(),
    });
  }

  /**
   * Handle invoice.payment_failed
   */
  private static async handleInvoicePaymentFailed(invoice: any) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: invoice.customer },
    });

    if (!subscription) return;

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.PAST_DUE },
    });

    // Save failed invoice
    await prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      create: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'open',
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
      },
      update: {
        status: 'open',
      },
    });

    // Send urgent notification
    await NotificationService.send(subscription.userId, NotificationType.PAYMENT_FAILED, {
      amount: (invoice.amount_due / 100).toFixed(2),
    });
  }

  /**
   * Handle customer.subscription.trial_will_end
   */
  private static async handleTrialWillEnd(stripeSubscription: any) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    const trialEnd = new Date(stripeSubscription.trial_end * 1000);
    const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    await NotificationService.send(subscription.userId, NotificationType.TRIAL_ENDING, {
      daysLeft,
      trialEndDate: trialEnd.toLocaleDateString(),
    });
  }
}

export default StripeService;
