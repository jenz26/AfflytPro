/**
 * Script to manually trigger Keepa deal population
 *
 * Usage:
 *   npx ts-node src/scripts/repopulate-keepa.ts
 *
 * Or with custom options:
 *   npx ts-node src/scripts/repopulate-keepa.ts --max=100 --minDiscount=10
 */

import 'dotenv/config';
import { keepaPopulateService } from '../services/KeepaPopulateService';

async function main() {
    console.log('=== Keepa Repopulate Script ===\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const options: {
        maxDeals?: number;
        minRating?: number;
        minDiscountPercent?: number;
    } = {};

    args.forEach(arg => {
        const [key, value] = arg.replace('--', '').split('=');
        if (key === 'max') options.maxDeals = parseInt(value);
        if (key === 'minRating') options.minRating = parseInt(value);
        if (key === 'minDiscount') options.minDiscountPercent = parseInt(value);
    });

    console.log('Options:', {
        maxDeals: options.maxDeals || 50,
        minRating: options.minRating || 200,
        minDiscountPercent: options.minDiscountPercent || 5
    });
    console.log('');

    // Check Keepa API key
    if (!process.env.KEEPA_API_KEY) {
        console.error('ERROR: KEEPA_API_KEY not set in environment');
        process.exit(1);
    }

    // Check token status first
    console.log('Checking Keepa token status...');
    const tokenStatus = await keepaPopulateService.getTokenStatus();
    if (tokenStatus) {
        console.log(`Tokens available: ${tokenStatus.tokensLeft}`);
        console.log(`Refill rate: ${tokenStatus.refillRate} tokens/min`);
    } else {
        console.warn('Could not fetch token status');
    }
    console.log('');

    // Run the populate
    console.log('Starting Keepa deal population...');
    const startTime = Date.now();

    const result = await keepaPopulateService.populateDeals({
        maxDeals: options.maxDeals || 50,
        minRating: options.minRating || 200,
        minDiscountPercent: options.minDiscountPercent || 5
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('=== Results ===');
    console.log(`Saved: ${result.saved} deals`);
    console.log(`Skipped: ${result.skipped} deals`);
    console.log(`Tokens used: ${result.tokensUsed}`);
    console.log(`Duration: ${duration}s`);

    if (result.errors.length > 0) {
        console.log('');
        console.log('Errors:');
        result.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('');
    console.log('Done!');
}

main().catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
});
