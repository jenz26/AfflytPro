'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const POSTHOG_KEY = 'phc_jfMIDU4cty3HlgaBsY9f3FHjGnfPaASzn30u7XwvnFC';
const POSTHOG_HOST = 'https://eu.i.posthog.com';

/**
 * Initialize PostHog
 */
if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Capture pageviews automatically
    capture_pageview: false, // We'll handle this manually for Next.js
    // Session recording
    capture_pageleave: true,
    // Privacy settings
    persistence: 'localStorage+cookie',
    // Respect Do Not Track
    respect_dnt: true,
    // Disable in development (optional - remove if you want to test)
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        // Uncomment to disable in dev:
        // posthog.opt_out_capturing();
      }
    },
  });
}

/**
 * Track page views on route change
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + '?' + searchParams.toString();
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

/**
 * PostHog Provider Component
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}

/**
 * Helper functions for tracking events
 */
export const Analytics = {
  /**
   * Track a custom event
   */
  track: (eventName: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  },

  /**
   * Identify a user (call after login)
   */
  identify: (userId: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.identify(userId, properties);
    }
  },

  /**
   * Reset user identity (call on logout)
   */
  reset: () => {
    if (posthog) {
      posthog.reset();
    }
  },

  /**
   * Set user properties
   */
  setUserProperties: (properties: Record<string, any>) => {
    if (posthog) {
      posthog.people.set(properties);
    }
  },

  // ==================== AUTH EVENTS ====================

  /**
   * Track login page view
   */
  trackLoginPageView: () => {
    Analytics.track('login_page_viewed');
  },

  /**
   * Track magic link requested
   */
  trackMagicLinkRequested: (emailProvider: string, isNewUser: boolean) => {
    Analytics.track('magic_link_requested', {
      email_provider: emailProvider,
      is_new_user: isNewUser,
    });
  },

  /**
   * Track magic link clicked (from email)
   */
  trackMagicLinkClicked: () => {
    Analytics.track('magic_link_clicked');
  },

  /**
   * Track successful login
   */
  trackLoginSuccess: (method: 'magic_link' | 'password') => {
    Analytics.track('login_success', { method });
  },

  /**
   * Track login error
   */
  trackLoginError: (errorType: string) => {
    Analytics.track('login_error', { error_type: errorType });
  },

  /**
   * Track registration
   */
  trackRegistration: (method: 'magic_link' | 'password') => {
    Analytics.track('user_registered', { method });
  },

  // ==================== ONBOARDING EVENTS ====================

  /**
   * Track onboarding step
   */
  trackOnboardingStep: (step: number, stepName: string) => {
    Analytics.track('onboarding_step_viewed', { step, step_name: stepName });
  },

  /**
   * Track onboarding completed
   */
  trackOnboardingCompleted: () => {
    Analytics.track('onboarding_completed');
  },

  // ==================== FEATURE USAGE ====================

  /**
   * Track automation created
   */
  trackAutomationCreated: (automationType: string) => {
    Analytics.track('automation_created', { type: automationType });
  },

  /**
   * Track channel connected
   */
  trackChannelConnected: (channelType: string) => {
    Analytics.track('channel_connected', { type: channelType });
  },

  /**
   * Track deal found
   */
  trackDealFound: (dealScore: number) => {
    Analytics.track('deal_found', { score: dealScore });
  },

  // ==================== SUPPORT ====================

  /**
   * Track support chat opened
   */
  trackSupportOpened: (context: string) => {
    Analytics.track('support_chat_opened', { context });
  },
};

// Export posthog instance for advanced usage
export { posthog };
