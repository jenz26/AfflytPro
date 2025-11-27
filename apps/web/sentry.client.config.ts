// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://c79dee78d90e6fa585686dc031a02eb4@o4510437320491008.ingest.de.sentry.io/4510437327503440',

  // Define how likely traces are sampled. Adjust this value in production,
  // or use tracesSampler for greater control.
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Replay configuration for session recording
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out common noise
  ignoreErrors: [
    // Browser extensions
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    // Network errors that aren't actionable
    'Network Error',
    'Failed to fetch',
    'Load failed',
    // Common browser quirks
    'ResizeObserver loop',
    /^Non-Error promise rejection captured/,
  ],

  // Environment
  environment: process.env.NODE_ENV,
});
