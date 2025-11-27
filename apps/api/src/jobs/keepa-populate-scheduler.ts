/**
 * Keepa Populate Scheduler
 *
 * Runs every 6 hours to populate the database with fresh deals from Keepa.
 * Budget-conscious: limits to ~40-50 deals per run (5 tokens)
 * Monthly budget: ~750 tokens = ~150 runs = ~5 runs/day
 */

import { keepaPopulateService } from '../services/KeepaPopulateService';

// Configuration
const POPULATE_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_DEALS_PER_RUN = 50;
const MIN_DISCOUNT_PERCENT = 5;  // 5% minimum discount
const MIN_RATING = 200; // 2 stars

let isRunning = false;
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Run the population job
 */
async function runPopulateJob(): Promise<void> {
    if (isRunning) {
        console.log('[KeepaScheduler] Job already running, skipping...');
        return;
    }

    isRunning = true;

    console.log('\n' + '🔄'.repeat(30));
    console.log('🔄 KEEPA POPULATE SCHEDULER - RUN');
    console.log('🔄'.repeat(30));
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log('');

    try {
        // Check if API key is configured
        if (!process.env.KEEPA_API_KEY) {
            console.log('⚠️  KEEPA_API_KEY not set, skipping populate job');
            return;
        }

        // Check token status
        const tokenStatus = await keepaPopulateService.getTokenStatus();
        if (tokenStatus) {
            console.log(`📊 Tokens available: ${tokenStatus.tokensLeft}`);

            // Don't run if tokens are too low
            if (tokenStatus.tokensLeft < 10) {
                console.log('⚠️  Token balance too low, skipping this run');
                return;
            }
        }

        // Run the populate job
        const result = await keepaPopulateService.populateDeals({
            maxDeals: MAX_DEALS_PER_RUN,
            minDiscountPercent: MIN_DISCOUNT_PERCENT,
            minRating: MIN_RATING
        });

        console.log('\n📈 Job completed:');
        console.log(`   Deals saved: ${result.saved}`);
        console.log(`   Deals skipped: ${result.skipped}`);
        console.log(`   Errors: ${result.errors.length}`);

    } catch (error: any) {
        console.error('❌ Keepa populate job failed:', error.message);
    } finally {
        isRunning = false;
    }

    console.log('🔄'.repeat(30) + '\n');
}

/**
 * Start the Keepa populate scheduler
 */
export function startKeepaPopulateScheduler(): void {
    console.log('\n🤖 Starting Keepa Populate Scheduler...');
    console.log(`   Interval: Every ${POPULATE_INTERVAL_MS / 3600000} hours`);
    console.log(`   Max deals per run: ${MAX_DEALS_PER_RUN}`);
    console.log(`   Min discount: ${MIN_DISCOUNT_PERCENT}%`);
    console.log(`   Min rating: ${MIN_RATING / 100} stars`);

    if (!process.env.KEEPA_API_KEY) {
        console.log('   ⚠️  KEEPA_API_KEY not set - scheduler will skip until configured');
    }

    console.log('');

    // Run immediately on start
    console.log('🔍 Running initial populate check...\n');
    runPopulateJob();

    // Schedule recurring runs
    schedulerInterval = setInterval(runPopulateJob, POPULATE_INTERVAL_MS);

    console.log('✅ Keepa Populate Scheduler started successfully\n');
}

/**
 * Stop the scheduler (for graceful shutdown)
 */
export function stopKeepaPopulateScheduler(): void {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log('🛑 Keepa Populate Scheduler stopped');
    }
}

/**
 * Manually trigger a populate run (for API endpoint)
 */
export async function triggerPopulateJob(options?: {
    maxDeals?: number;
    minDiscountPercent?: number;
}): Promise<{ saved: number; skipped: number; errors: string[] }> {
    console.log('[KeepaScheduler] Manual trigger requested');

    const result = await keepaPopulateService.populateDeals({
        maxDeals: options?.maxDeals || MAX_DEALS_PER_RUN,
        minDiscountPercent: options?.minDiscountPercent || MIN_DISCOUNT_PERCENT,
        minRating: MIN_RATING
    });

    return {
        saved: result.saved,
        skipped: result.skipped,
        errors: result.errors
    };
}
