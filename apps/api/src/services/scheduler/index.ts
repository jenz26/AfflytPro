/**
 * Scheduler Module Exports
 *
 * BullMQ-based scheduled post system.
 * Completely separate from the Keepa automation system.
 */

export { SchedulerQueue } from './SchedulerQueue';
export { SchedulerCron } from './SchedulerCron';

// Global instance for route access
let schedulerCronInstance: import('./SchedulerCron').SchedulerCron | null = null;

export function setSchedulerCronInstance(instance: import('./SchedulerCron').SchedulerCron): void {
  schedulerCronInstance = instance;
}

export function getSchedulerCronInstance(): import('./SchedulerCron').SchedulerCron | null {
  return schedulerCronInstance;
}
