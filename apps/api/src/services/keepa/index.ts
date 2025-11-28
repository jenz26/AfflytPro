/**
 * Keepa Queue System v2 - Singleton exports
 *
 * This module exports singleton instances of the Keepa v2 system
 * for use in routes and other services.
 */

import { AutomationScheduler } from './AutomationScheduler';

// Global scheduler instance (set in app.ts)
let schedulerInstance: AutomationScheduler | null = null;

export function setSchedulerInstance(scheduler: AutomationScheduler): void {
  schedulerInstance = scheduler;
}

export function getSchedulerInstance(): AutomationScheduler | null {
  return schedulerInstance;
}

// Re-export components
export { AutomationScheduler } from './AutomationScheduler';
export { KeepaWorker } from './KeepaWorker';
export { KeepaClient } from './KeepaClient';
export { KeepaQueue } from './KeepaQueue';
export { KeepaCache } from './KeepaCache';
export { KeepaTokenManager } from './KeepaTokenManager';
export { KeepaPrefetch } from './KeepaPrefetch';
