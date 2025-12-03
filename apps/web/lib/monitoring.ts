/**
 * Unified Monitoring & Analytics
 * Sets user context across all monitoring services (Sentry, PostHog)
 */

import * as Sentry from '@sentry/nextjs';
import { Analytics } from '@/components/analytics/PostHogProvider';

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
}
