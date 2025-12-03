'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';

/**
 * Initialize PostHog
 * - Direct connection to PostHog EU
 * - Session recording disabled by default, enabled for beta users
 */
if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: 'https://eu.i.posthog.com',
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    persistence: 'localStorage+cookie',
    respect_dnt: true,
    // Enable PostHog Surveys for beta feedback
    disable_surveys: false,
    // Load surveys immediately for faster display
    bootstrap: {
      distinctID: undefined,
      featureFlags: {},
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
      posthog.capture('$pageview', { $current_url: url });
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

  /**
   * Enable session recording for beta users (10% sampling)
   */
  enableSessionRecordingForBeta: () => {
    if (posthog) {
      // 10% sampling for beta users
      if (Math.random() < 0.1) {
        posthog.startSessionRecording();
      }
    }
  },

  /**
   * Full user identification with all properties (call after login)
   */
  identifyUser: (user: {
    id: string;
    email: string;
    name?: string;
    plan: string;
    personaType?: string;
    createdAt: string;
    channelsCount?: number;
    automationsCount?: number;
    totalRevenue?: number;
  }) => {
    if (posthog) {
      const isBetaUser = user.plan === 'BETA_TESTER';

      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        plan: user.plan,
        persona_type: user.personaType,
        signup_date: user.createdAt,
        channels_count: user.channelsCount || 0,
        automations_count: user.automationsCount || 0,
        total_revenue: user.totalRevenue || 0,
        is_beta_user: isBetaUser,
      });

      // Enable session recording for beta users with 10% sampling
      if (isBetaUser) {
        Analytics.enableSessionRecordingForBeta();
      }
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

  // ==================== ADDITIONAL CORE EVENTS ====================

  /**
   * Track user signed up
   */
  trackUserSignedUp: (method: 'magic_link' | 'password', betaCode?: string) => {
    Analytics.track('user_signed_up', {
      method,
      beta_code: betaCode,
    });
  },

  /**
   * Track user logged out
   */
  trackUserLoggedOut: () => {
    Analytics.track('user_logged_out');
    Analytics.reset();
  },

  /**
   * Track automation toggled (on/off)
   */
  trackAutomationToggled: (automationId: string, newState: boolean) => {
    Analytics.track('automation_toggled', {
      automation_id: automationId,
      new_state: newState ? 'active' : 'paused',
    });
  },

  /**
   * Track dashboard viewed
   */
  trackDashboardViewed: (section?: string) => {
    Analytics.track('dashboard_viewed', { section });
  },

  /**
   * Track analytics viewed
   */
  trackAnalyticsViewed: (period: string) => {
    Analytics.track('analytics_viewed', { period });
  },

  // ==================== FEEDBACK EVENTS ====================

  /**
   * Track feedback submitted
   */
  trackFeedbackSubmitted: (type: 'bug' | 'idea' | 'question', rating?: number) => {
    Analytics.track('feedback_submitted', {
      type,
      rating,
    });
  },

  /**
   * Track feature requested
   */
  trackFeatureRequested: (featureName: string) => {
    Analytics.track('feature_requested', { feature_name: featureName });
  },

  /**
   * Track bug reported
   */
  trackBugReported: (context: string) => {
    Analytics.track('bug_reported', { context });
  },

  // ==================== SURVEY EVENTS (BETA) ====================

  /**
   * Track first automation milestone - triggers survey
   */
  trackFirstAutomationMilestone: () => {
    Analytics.track('beta_milestone_first_automation', {
      milestone: 'first_automation',
      trigger_survey: true,
    });
  },

  /**
   * Track first deal found milestone - triggers survey
   */
  trackFirstDealMilestone: (dealScore: number) => {
    Analytics.track('beta_milestone_first_deal', {
      milestone: 'first_deal',
      deal_score: dealScore,
      trigger_survey: true,
    });
  },

  /**
   * Track first week milestone - triggers NPS survey
   */
  trackFirstWeekMilestone: (automationsCount: number, channelsCount: number) => {
    Analytics.track('beta_milestone_first_week', {
      milestone: 'first_week',
      automations_count: automationsCount,
      channels_count: channelsCount,
      trigger_nps: true,
    });
  },

  /**
   * Track feature discovery - triggers contextual survey
   */
  trackFeatureDiscovery: (feature: string) => {
    Analytics.track('beta_feature_discovery', {
      feature,
      trigger_survey: true,
    });
  },

  /**
   * Track friction point - triggers help survey
   */
  trackFrictionPoint: (context: string, errorType?: string) => {
    Analytics.track('beta_friction_point', {
      context,
      error_type: errorType,
      trigger_survey: true,
    });
  },

  /**
   * Get surveys from PostHog
   */
  getSurveys: () => {
    if (posthog) {
      return posthog.getActiveMatchingSurveys((surveys) => surveys, false);
    }
    return [];
  },

  /**
   * Capture survey shown event
   */
  captureSurveyShown: (surveyId: string) => {
    if (posthog) {
      posthog.capture('survey shown', { $survey_id: surveyId });
    }
  },

  /**
   * Capture survey dismissed event
   */
  captureSurveyDismissed: (surveyId: string) => {
    if (posthog) {
      posthog.capture('survey dismissed', { $survey_id: surveyId });
    }
  },

  /**
   * Capture survey response
   */
  captureSurveyResponse: (surveyId: string, response: Record<string, any>) => {
    if (posthog) {
      posthog.capture('survey sent', {
        $survey_id: surveyId,
        ...response,
      });
    }
  },
};

// Export posthog instance for advanced usage
export { posthog };
