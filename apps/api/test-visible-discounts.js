const https = require('https');
const zlib = require('zlib');
require('dotenv').config();

const KEEPA_API_KEY = process.env.KEEPA_API_KEY;

// Parametri Deal API - stessi parametri che usiamo in produzione
const params = {
    key: KEEPA_API_KEY,
    domain: 8, // Amazon.it
    selection: JSON.stringify({
        domainId: 8, // Amazon.it
        includeCategories: [524015031], // Casa e cucina
        priceTypes: [0], // Amazon price
        deltaPercentRange: [15, 90], // 15-90% sconto
        currentRange: [1000, 30000], // €10-€300
        salesRankRange: [1, 100000], // Top 100k
        isRangeEnabled: true,
        dateRange: 0
    }),
    page: 0
};

const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

const url = `https://api.keepa.com/deal?${queryString}`;

console.log('Fetching deals with visible discounts...\n');

function fetchWithGzip(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                let data;
                try {
                    data = zlib.gunzipSync(buffer).toString();
                } catch {
                    data = buffer.toString();
                }
                resolve(JSON.parse(data));
            });
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function main() {
    try {
        const result = await fetchWithGzip(url);

        console.log('Raw response keys:', Object.keys(result));
        console.log('tokensConsumed:', result.tokensConsumed);
        console.log('timestamp:', result.timestamp);

        if (result.error) {
            console.log('API Error:', result.error);
            return;
        }

        console.log('deals structure:', JSON.stringify(result.deals, null, 2).substring(0, 2000));

        // Il formato Deal API restituisce deals.dr (deal results)
        const dealsArray = result.deals?.dr || [];

        if (!dealsArray || dealsArray.length === 0) {
            console.log('No deals found in dr array');
            return;
        }

        console.log(`Found ${dealsArray.length} deals total\n`);

        // Mostra struttura primo deal
        if (dealsArray[0]) {
            console.log('First deal structure:', JSON.stringify(dealsArray[0], null, 2).substring(0, 1500));
        }

        result.deals = dealsArray;

        // Filtra solo quelli con listPrice valido (prezzo barrato visibile)
        const visibleDiscounts = result.deals.filter(deal => {
            // deal.current[4] è il LIST_PRICE (index 4)
            // deal.current[0] è il prezzo Amazon attuale
            const listPrice = deal.current?.[4];
            const currentPrice = deal.current?.[0] > 0 ? deal.current[0] : deal.current?.[1];

            return listPrice > 0 && currentPrice > 0 && listPrice > currentPrice;
        });

        console.log(`Deals with VISIBLE discount (listPrice > currentPrice): ${visibleDiscounts.length}\n`);
        console.log('='.repeat(80));

        // Mostra i primi 10
        visibleDiscounts.slice(0, 10).forEach((deal, i) => {
            const listPrice = deal.current[4] / 100;
            const currentPrice = (deal.current[0] > 0 ? deal.current[0] : deal.current[1]) / 100;
            const discount = ((listPrice - currentPrice) / listPrice * 100).toFixed(0);

            console.log(`\n${i + 1}. ${deal.title?.substring(0, 70)}...`);
            console.log(`   ASIN: ${deal.asin}`);
            console.log(`   Prezzo attuale: €${currentPrice.toFixed(2)}`);
            console.log(`   Prezzo listino (barrato): €${listPrice.toFixed(2)}`);
            console.log(`   Sconto visibile: -${discount}%`);
            console.log(`   🔗 https://www.amazon.it/dp/${deal.asin}`);
        });

        console.log('\n' + '='.repeat(80));

        // Mostra anche alcuni senza listPrice per confronto
        const noVisibleDiscount = result.deals.filter(deal => {
            const listPrice = deal.current?.[4];
            const currentPrice = deal.current?.[0] > 0 ? deal.current[0] : deal.current?.[1];
            return !listPrice || listPrice <= 0 || listPrice <= currentPrice;
        });

        console.log(`\nDeals SENZA sconto visibile (solo minimo storico): ${noVisibleDiscount.length}`);

        if (noVisibleDiscount.length > 0) {
            console.log('\nEsempi (primi 3):');
            noVisibleDiscount.slice(0, 3).forEach((deal, i) => {
                const currentPrice = (deal.current[0] > 0 ? deal.current[0] : deal.current[1]) / 100;
                const listPrice = deal.current?.[4];

                console.log(`\n${i + 1}. ${deal.title?.substring(0, 70)}...`);
                console.log(`   ASIN: ${deal.asin}`);
                console.log(`   Prezzo attuale: €${currentPrice.toFixed(2)}`);
                console.log(`   ListPrice: ${listPrice > 0 ? '€' + (listPrice/100).toFixed(2) : 'N/A'}`);
                console.log(`   deltaPercent (vs storico): ${deal.deltaPercent}%`);
                console.log(`   🔗 https://www.amazon.it/dp/${deal.asin}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
