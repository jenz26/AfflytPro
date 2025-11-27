/**
 * Script to manually populate deals from Keepa
 *
 * Usage:
 *   npx ts-node src/scripts/populate-deals.ts
 *   npx ts-node src/scripts/populate-deals.ts --max=100
 *   npx ts-node src/scripts/populate-deals.ts --min-discount=20
 */

import { keepaPopulateService } from '../services/KeepaPopulateService';
import { getNonGatedCategories } from '../data/amazon-categories';

async function main() {
    console.log('\n🚀 KEEPA DEAL POPULATION SCRIPT\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const getArg = (name: string, defaultValue: number) => {
        const arg = args.find(a => a.startsWith(`--${name}=`));
        return arg ? parseInt(arg.split('=')[1]) : defaultValue;
    };

    const maxDeals = getArg('max', 50);
    const minDiscount = getArg('min-discount', 10);
    const minRating = getArg('min-rating', 200); // 2 stars

    console.log('Configuration:');
    console.log(`  Max deals: ${maxDeals}`);
    console.log(`  Min discount: ${minDiscount}%`);
    console.log(`  Min rating: ${minRating / 100} stars`);
    console.log(`  Categories: ${getNonGatedCategories().length} non-gated`);
    console.log('');

    // Check token status first
    const tokenStatus = await keepaPopulateService.getTokenStatus();
    if (tokenStatus) {
        console.log(`📊 Token Status:`);
        console.log(`   Available: ${tokenStatus.tokensLeft}`);
        console.log(`   Refill rate: ${tokenStatus.refillRate}/min`);
        console.log('');

        if (tokenStatus.tokensLeft < 10) {
            console.error('❌ Not enough tokens! Wait for refill.');
            process.exit(1);
        }
    } else {
        console.warn('⚠️  Could not fetch token status (API key may be invalid)');
    }

    // Run population
    const result = await keepaPopulateService.populateDeals({
        maxDeals,
        minDiscountPercent: minDiscount,
        minRating
    });

    console.log('\n📈 Final Results:');
    console.log(`   Saved: ${result.saved}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Errors: ${result.errors.length}`);
    console.log(`   Tokens used: ~${result.tokensUsed}`);

    if (result.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        result.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
        if (result.errors.length > 10) {
            console.log(`   ... and ${result.errors.length - 10} more`);
        }
    }

    process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
});
