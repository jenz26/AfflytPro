const https = require('https');
const zlib = require('zlib');
require('dotenv').config();

const KEEPA_API_KEY = process.env.KEEPA_API_KEY;

const params = {
    key: KEEPA_API_KEY,
    domain: 8,
    selection: JSON.stringify({
        domainId: 8,
        includeCategories: [524015031], // Casa e cucina
        priceTypes: [0],
        deltaPercentRange: [15, 90],
        currentRange: [1000, 30000],
        salesRankRange: [1, 100000],
        isRangeEnabled: true,
        dateRange: 0
    }),
    page: 0
};

const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

const url = `https://api.keepa.com/deal?${queryString}`;

console.log('Fetching deals from Keepa Deal API...\n');

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
        const result = JSON.parse(data);

        if (result.error) {
            console.log('API Error:', result.error);
            return;
        }

        const deals = result.deals?.dr || [];
        console.log(`Total deals returned: ${deals.length}\n`);

        if (deals.length === 0) {
            console.log('No deals found');
            return;
        }

        // Prendi un deal con listPrice e uno senza
        const dealWithListPrice = deals.find(d => d.current?.[4] > 0 && d.current[4] > (d.current[0] || d.current[1]));
        const dealWithoutListPrice = deals.find(d => !d.current?.[4] || d.current[4] <= 0);

        console.log('='.repeat(80));
        console.log('DEAL CON SCONTO VISIBILE (listPrice > currentPrice)');
        console.log('='.repeat(80));
        if (dealWithListPrice) {
            console.log('\nRAW DEAL STRUCTURE:');
            console.log(JSON.stringify(dealWithListPrice, null, 2));

            console.log('\n--- CAMPI CHIAVE ---');
            console.log('asin:', dealWithListPrice.asin);
            console.log('title:', dealWithListPrice.title);
            console.log('');
            console.log('current array (prezzi attuali):');
            console.log('  [0] AMAZON:', dealWithListPrice.current?.[0], '-> €' + (dealWithListPrice.current?.[0] / 100).toFixed(2));
            console.log('  [1] NEW:', dealWithListPrice.current?.[1], '-> €' + ((dealWithListPrice.current?.[1] || 0) / 100).toFixed(2));
            console.log('  [3] SALES_RANK:', dealWithListPrice.current?.[3]);
            console.log('  [4] LIST_PRICE:', dealWithListPrice.current?.[4], '-> €' + ((dealWithListPrice.current?.[4] || 0) / 100).toFixed(2));
            console.log('  [18] BUY_BOX:', dealWithListPrice.current?.[18], '-> €' + ((dealWithListPrice.current?.[18] || 0) / 100).toFixed(2));
            console.log('');
            console.log('deltaPercent (% sconto vs storico):');
            if (dealWithListPrice.deltaPercent) {
                console.log('  [0] day:', JSON.stringify(dealWithListPrice.deltaPercent[0]));
                console.log('  [1] week:', JSON.stringify(dealWithListPrice.deltaPercent[1]));
                console.log('  [2] month:', JSON.stringify(dealWithListPrice.deltaPercent[2]));
                console.log('  [3] 90days:', JSON.stringify(dealWithListPrice.deltaPercent[3]));
            }
            console.log('');
            console.log('avg (prezzi medi):');
            if (dealWithListPrice.avg) {
                console.log('  [0] day avg:', JSON.stringify(dealWithListPrice.avg[0]?.slice(0, 5)));
                console.log('  [3] 90day avg:', JSON.stringify(dealWithListPrice.avg[3]?.slice(0, 5)));
            }
            console.log('');
            console.log('Altri campi:');
            console.log('  rootCat:', dealWithListPrice.rootCat);
            console.log('  categories:', dealWithListPrice.categories);
            console.log('  image:', typeof dealWithListPrice.image === 'object' ? 'char array' : dealWithListPrice.image);
        } else {
            console.log('Nessun deal con listPrice trovato');
        }

        console.log('\n' + '='.repeat(80));
        console.log('DEAL SENZA SCONTO VISIBILE (solo minimo storico)');
        console.log('='.repeat(80));
        if (dealWithoutListPrice) {
            console.log('\nRAW DEAL STRUCTURE:');
            console.log(JSON.stringify(dealWithoutListPrice, null, 2));

            console.log('\n--- CAMPI CHIAVE ---');
            console.log('asin:', dealWithoutListPrice.asin);
            console.log('title:', dealWithoutListPrice.title);
            console.log('');
            console.log('current array:');
            console.log('  [0] AMAZON:', dealWithoutListPrice.current?.[0], '-> €' + ((dealWithoutListPrice.current?.[0] || 0) / 100).toFixed(2));
            console.log('  [1] NEW:', dealWithoutListPrice.current?.[1], '-> €' + ((dealWithoutListPrice.current?.[1] || 0) / 100).toFixed(2));
            console.log('  [4] LIST_PRICE:', dealWithoutListPrice.current?.[4], '-> €' + ((dealWithoutListPrice.current?.[4] || 0) / 100).toFixed(2));
            console.log('');
            console.log('deltaPercent:');
            if (dealWithoutListPrice.deltaPercent) {
                console.log('  [2] month:', JSON.stringify(dealWithoutListPrice.deltaPercent[2]));
                console.log('  [3] 90days:', JSON.stringify(dealWithoutListPrice.deltaPercent[3]));
            }
        } else {
            console.log('Tutti i deal hanno listPrice!');
        }

        // Statistiche
        console.log('\n' + '='.repeat(80));
        console.log('STATISTICHE');
        console.log('='.repeat(80));
        const withVisible = deals.filter(d => d.current?.[4] > 0 && d.current[4] > (d.current[0] || d.current[1])).length;
        const withoutVisible = deals.length - withVisible;
        console.log(`Deal con sconto visibile (listPrice > currentPrice): ${withVisible} (${(withVisible/deals.length*100).toFixed(1)}%)`);
        console.log(`Deal senza sconto visibile: ${withoutVisible} (${(withoutVisible/deals.length*100).toFixed(1)}%)`);
    });
}).on('error', console.error);
