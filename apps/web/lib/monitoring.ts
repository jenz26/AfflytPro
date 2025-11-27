/**
 * Unified Monitoring & Analytics
 * Sets user context across all monitoring services (Sentry, PostHog, Tawk.to)
 */

import * as Sentry from '@sentry/nextjs';
import { Analytics, posthog } from '@/components/analytics/PostHogProvider';

export interface MonitoringUser {
  id: string;
  email?: string;
  name?: string;
  plan?: string;
}

/**
 * Set user context across all monitoring services
 * Call this after successful login
 */
export function setMonitoringUser(user: MonitoringUser) {
  // PostHog - User identification
  Analytics.identify(user.id, {
    email: user.email,
    name: user.name,
    plan: user.plan,
  });

  // Sentry - User context for error tracking
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });

  // Tawk.to - Set visitor info
  if (typeof window !== 'undefined' && window.Tawk_API?.setAttributes) {
    window.Tawk_API.setAttributes(
      {
        name: user.name || 'User',
        email: user.email || '',
        plan: user.plan || 'free',
        id: user.id,
      },
      (error) => {
        if (error) {
          console.error('[Tawk] Error setting user attributes:', error);
        }
      }
    );
  }

  console.log('[Monitoring] User context set:', user.id);
}

/**
 * Clear user context on logout
 */
export function clearMonitoringUser() {
  // PostHog - Reset
  Analytics.reset();

  // Sentry - Clear user
  Sentry.setUser(null);

  // Tawk.to doesn't have a clear method, but will reset on page reload

  console.log('[Monitoring] User context cleared');
}

/**
 * Track a custom event across all analytics
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  // PostHog
  Analytics.track(eventName, properties);

  // Sentry breadcrumb
  Sentry.addBreadcrumb({
    message: eventName,
    category: 'user_action',
    data: properties,
    level: 'info',
  });

  // Tawk.to custom event
  if (typeof window !== 'undefined' && window.Tawk_API?.addEvent) {
    window.Tawk_API.addEvent(eventName, properties);
  }
}

// Tawk_API types are declared in TawkChat.tsx
