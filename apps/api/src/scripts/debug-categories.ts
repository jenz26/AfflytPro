/**
 * Debug script to see what category IDs Keepa returns in deals
 */

import axios from 'axios';

const KEEPA_API_KEY = 'a6qm3eukr335ktjbko0r5vqfhvoqgnnscbrin2ddgh3lr3t09sn6cl1c4innl5tm';
const KEEPA_DOMAIN_IT = 8;

async function debugCategories() {
    console.log('Fetching deals from Keepa to see category IDs...\n');

    const response = await axios.get('https://api.keepa.com/deal', {
        params: {
            key: KEEPA_API_KEY,
            selection: JSON.stringify({
                page: 0,
                domainId: KEEPA_DOMAIN_IT,
                priceTypes: [0],
                hasReviews: true,
                isRangeEnabled: true,
                deltaPercentRange: [5, 100]
            })
        }
    });

    const deals = response.data.deals?.dr || [];
    console.log(`Got ${deals.length} deals\n`);

    // Collect unique rootCat values
    const categoryCount: Record<number, number> = {};

    for (const deal of deals) {
        const rootCat = deal.rootCat || deal.categories?.[0] || 0;
        categoryCount[rootCat] = (categoryCount[rootCat] || 0) + 1;
    }

    // Sort by count
    const sorted = Object.entries(categoryCount)
        .map(([id, count]) => ({ id: Number(id), count }))
        .sort((a, b) => b.count - a.count);

    console.log('Category IDs found in deals:');
    console.log('ID\t\t\tCount');
    console.log('-'.repeat(40));

    for (const { id, count } of sorted) {
        console.log(`${id}\t\t${count}`);
    }

    console.log(`\nTotal unique categories: ${sorted.length}`);

    // Also show first 3 deals for debugging
    console.log('\n\nSample deals:');
    for (const deal of deals.slice(0, 3)) {
        console.log(`- ASIN: ${deal.asin}`);
        console.log(`  rootCat: ${deal.rootCat}`);
        console.log(`  categories: ${JSON.stringify(deal.categories?.slice(0, 5))}`);
        console.log('');
    }
}

debugCategories().catch(console.error);
