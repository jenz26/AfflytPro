/**
 * Keepa Populate Scheduler
 * Runs every 6 hours to populate the database with fresh deals from Keepa.
 */

import { keepaPopulateService } from '../services/KeepaPopulateService';

const POPULATE_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_DEALS_PER_RUN = 50;
const MIN_DISCOUNT_PERCENT = 5;
const MIN_RATING = 200;

let isRunning = false;
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Run the population job
 */
async function runPopulateJob(): Promise<void> {
    if (isRunning || !process.env.KEEPA_API_KEY) return;

    isRunning = true;
    try {
        const tokenStatus = await keepaPopulateService.getTokenStatus();
        if (tokenStatus && tokenStatus.tokensLeft < 10) return;

        await keepaPopulateService.populateDeals({
            maxDeals: MAX_DEALS_PER_RUN,
            minDiscountPercent: MIN_DISCOUNT_PERCENT,
            minRating: MIN_RATING
        });
    } catch (error: any) {
        console.error('[KeepaScheduler] Job failed:', error.message);
    } finally {
        isRunning = false;
    }
}

/**
 * Start the Keepa populate scheduler
 */
export function startKeepaPopulateScheduler(): void {
    console.log('[KeepaScheduler] Started');
    runPopulateJob();
    schedulerInterval = setInterval(runPopulateJob, POPULATE_INTERVAL_MS);
}

/**
 * Stop the scheduler
 */
export function stopKeepaPopulateScheduler(): void {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
}

/**
 * Manually trigger a populate run
 */
export async function triggerPopulateJob(options?: {
    maxDeals?: number;
    minDiscountPercent?: number;
}): Promise<{ saved: number; skipped: number; errors: string[] }> {
    const result = await keepaPopulateService.populateDeals({
        maxDeals: options?.maxDeals || MAX_DEALS_PER_RUN,
        minDiscountPercent: options?.minDiscountPercent || MIN_DISCOUNT_PERCENT,
        minRating: MIN_RATING
    });
    return { saved: result.saved, skipped: result.skipped, errors: result.errors };
}
