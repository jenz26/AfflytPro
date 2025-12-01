import { PostHog } from 'posthog-node';

const POSTHOG_KEY = process.env.POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://eu.i.posthog.com';

/**
 * PostHog server-side client for tracking critical events
 * These events can't be blocked by ad blockers
 */
export const posthog = POSTHOG_KEY
  ? new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      // Flush events after 1 second or 20 events
      flushAt: 20,
      flushInterval: 1000,
    })
  : null;

/**
 * Server-side analytics helper
 */
export const ServerAnalytics = {
  /**
   * Track a server-side event
   */
  track: (distinctId: string, event: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture({
        distinctId,
        event,
        properties,
      });
    }
  },

  /**
   * Identify a user with properties
   */
  identify: (distinctId: string, properties: Record<string, any>) => {
    if (posthog) {
      posthog.identify({
        distinctId,
        properties,
      });
    }
  },

  // ==================== BILLING EVENTS ====================

  /**
   * Track subscription activated
   */
  trackSubscriptionActivated: (
    userId: string,
    plan: string,
    price: number,
    billingCycle: 'monthly' | 'yearly'
  ) => {
    ServerAnalytics.track(userId, 'subscription_activated', {
      plan,
      price,
      billing_cycle: billingCycle,
    });
  },

  /**
   * Track subscription canceled
   */
  trackSubscriptionCanceled: (
    userId: string,
    plan: string,
    tenureDays: number,
    reason?: string
  ) => {
    ServerAnalytics.track(userId, 'subscription_canceled', {
      plan,
      tenure_days: tenureDays,
      reason,
    });
  },

  /**
   * Track payment received
   */
  trackPaymentReceived: (userId: string, amount: number, plan: string) => {
    ServerAnalytics.track(userId, 'payment_received', {
      amount,
      plan,
    });
  },

  /**
   * Track payment failed
   */
  trackPaymentFailed: (userId: string, plan: string, errorType?: string) => {
    ServerAnalytics.track(userId, 'payment_failed', {
      plan,
      error_type: errorType,
    });
  },

  // ==================== CONVERSION EVENTS ====================

  /**
   * Track conversion (commission earned)
   */
  trackConversion: (
    userId: string,
    linkId: string,
    revenue: number,
    commission: number
  ) => {
    ServerAnalytics.track(userId, 'conversion_tracked', {
      link_id: linkId,
      revenue,
      commission,
    });
  },

  /**
   * Track link created (from automation or manual)
   */
  trackLinkCreated: (
    userId: string,
    source: 'manual' | 'automation',
    asin: string
  ) => {
    ServerAnalytics.track(userId, 'link_created', {
      source,
      asin,
    });
  },

  /**
   * Track deal published by automation
   */
  trackDealPublished: (
    userId: string,
    automationId: string,
    dealScore: number,
    channelType: string
  ) => {
    ServerAnalytics.track(userId, 'deal_published', {
      automation_id: automationId,
      score: dealScore,
      channel_type: channelType,
    });
  },

  // ==================== LIFECYCLE ====================

  /**
   * Flush pending events (call on server shutdown)
   */
  flush: async () => {
    if (posthog) {
      await posthog.flush();
    }
  },

  /**
   * Shutdown PostHog client
   */
  shutdown: async () => {
    if (posthog) {
      await posthog.shutdown();
    }
  },
};

export default ServerAnalytics;
