/**
 * Sentry Error Tracking Configuration for API
 */

import * as Sentry from '@sentry/node';

const SENTRY_DSN = 'https://6fc678f2979a0db796ee56109ccbd09d@o4510437320491008.ingest.de.sentry.io/4510437334319184';

/**
 * Initialize Sentry for the API
 */
export function initSentry() {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of traces in development, reduce in production

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Release tracking (set via CI/CD)
    release: process.env.SENTRY_RELEASE,

    // Filter out common noise
    ignoreErrors: [
      // Network errors that aren't actionable
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      // Common expected errors
      'JWT expired',
      'Invalid token',
    ],

    // Before sending, we can modify or drop events
    beforeSend(event, hint) {
      // Don't send 4xx errors (client errors) to reduce noise
      const statusCode = (hint.originalException as any)?.statusCode;
      if (statusCode && statusCode >= 400 && statusCode < 500) {
        return null;
      }
      return event;
    },
  });

  console.log('[Sentry] Initialized for API');
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message (for non-error events)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry events
 */
export function setUser(user: { id: string; email?: string; plan?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      plan: user.plan,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

// Re-export Sentry for direct access if needed
export { Sentry };
