const https = require('https');
const zlib = require('zlib');
require('dotenv').config();

const KEEPA_API_KEY = process.env.KEEPA_API_KEY;
const ASIN = 'B0BCR8Z7QL';

const url = `https://api.keepa.com/product?key=${KEEPA_API_KEY}&domain=8&asin=${ASIN}&stats=180&history=1&offers=20`;

console.log('Fetching ASIN:', ASIN);

https.get(url, (res) => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        let data;
        try {
            // Try to decompress if gzipped
            data = zlib.gunzipSync(buffer).toString();
        } catch {
            data = buffer.toString();
        }
        const result = JSON.parse(data);
        if (result.products && result.products[0]) {
            const p = result.products[0];

            console.log('\n========== PRODUCT INFO ==========');
            console.log('Title:', p.title);
            console.log('Brand:', p.brand);
            console.log('Category:', p.categoryTree?.map(c => c.name).join(' > '));

            console.log('\n========== CURRENT PRICES (from csv) ==========');
            const csvTypes = {
                0: 'AMAZON',
                1: 'NEW',
                2: 'USED',
                3: 'SALES_RANK',
                4: 'LIST_PRICE',
                5: 'COLLECTIBLE',
                7: 'NEW_FBM_SHIPPING',
                10: 'LIGHTNING_DEAL',
                11: 'WAREHOUSE',
                16: 'BUY_BOX_SHIPPING',
                18: 'USED_NEW_SHIPPING'
            };

            for (const [idx, name] of Object.entries(csvTypes)) {
                if (p.csv && p.csv[idx] && p.csv[idx].length > 0) {
                    const arr = p.csv[idx];
                    const lastValue = arr[arr.length - 1];
                    const lastTime = arr[arr.length - 2];
                    if (lastValue > 0) {
                        console.log(`  ${name} (csv[${idx}]): EUR ${(lastValue/100).toFixed(2)} (time: ${lastTime})`);
                    }
                }
            }

            console.log('\n========== STATS OBJECT ==========');
            if (p.stats) {
                console.log('Current prices:');
                console.log('  stats.current:', JSON.stringify(p.stats.current, null, 2));
                console.log('\nAverage prices (90 days):');
                console.log('  stats.avg90:', JSON.stringify(p.stats.avg90, null, 2));
                console.log('\nMin prices (90 days):');
                console.log('  stats.min90:', JSON.stringify(p.stats.min90, null, 2));
                console.log('\nBuy Box stats:');
                console.log('  buyBoxPrice:', p.stats.buyBoxPrice);
                console.log('  buyBoxShipping:', p.stats.buyBoxShipping);
                console.log('  buyBoxIsAmazon:', p.stats.buyBoxIsAmazon);
                console.log('  buyBoxIsFBA:', p.stats.buyBoxIsFBA);
                console.log('\n30-day stats:');
                console.log('  avg30:', JSON.stringify(p.stats.avg30, null, 2));
                console.log('  min30:', JSON.stringify(p.stats.min30, null, 2));
            }

            console.log('\n========== KEY DEAL FIELDS ==========');
            console.log('listPrice:', p.listPrice, '-> EUR ' + (p.listPrice > 0 ? (p.listPrice/100).toFixed(2) : 'N/A'));
            console.log('referencePrice:', p.referencePrice);
            console.log('lowestPrice:', p.lowestPrice);
            console.log('lowestPriceTypes:', p.lowestPriceTypes);

            console.log('\n========== COUPON INFO ==========');
            console.log('coupon:', p.coupon);
            console.log('couponHistory:', p.couponHistory);

            console.log('\n========== DEAL DETECTION FIELDS ==========');
            console.log('isDealAvailable:', p.isDealAvailable);
            console.log('dealStartTime:', p.dealStartTime);
            console.log('dealEndTime:', p.dealEndTime);
            console.log('lightningDeal:', p.lightningDeal);
            console.log('lightningEnd:', p.lightningEnd);

            console.log('\n========== PROMO/DISCOUNT FIELDS ==========');
            console.log('promotions:', p.promotions);
            console.log('promoDiscountType:', p.promoDiscountType);
            console.log('promoDiscountValue:', p.promoDiscountValue);

            console.log('\n========== PRICE DROPS ==========');
            if (p.stats) {
                const current = p.stats.current?.[0] || p.stats.current?.[1];
                const avg90 = p.stats.avg90?.[0] || p.stats.avg90?.[1];
                const listPrice = p.listPrice;

                if (current && avg90) {
                    const dropVsAvg = ((avg90 - current) / avg90 * 100).toFixed(1);
                    console.log(`  Drop vs avg90: ${dropVsAvg}%`);
                }
                if (current && listPrice > 0) {
                    const dropVsList = ((listPrice - current) / listPrice * 100).toFixed(1);
                    console.log(`  Drop vs listPrice: ${dropVsList}%`);
                }
            }

            console.log('\n========== RAW OFFERS (first 3) ==========');
            if (p.offers && p.offers.length > 0) {
                p.offers.slice(0, 3).forEach((o, i) => {
                    console.log(`Offer ${i+1}:`, JSON.stringify(o, null, 2));
                });
            }

            console.log('\n========== ALL OTHER TOP-LEVEL FIELDS ==========');
            const knownFields = ['title', 'brand', 'csv', 'stats', 'offers', 'categoryTree', 'listPrice', 'coupon', 'couponHistory', 'promotions'];
            const otherFields = Object.keys(p).filter(k => !knownFields.includes(k));
            otherFields.forEach(k => {
                const val = p[k];
                if (val !== null && val !== undefined && val !== -1 && !(Array.isArray(val) && val.length === 0)) {
                    if (typeof val === 'object') {
                        console.log(`${k}:`, JSON.stringify(val).substring(0, 300));
                    } else {
                        console.log(`${k}:`, val);
                    }
                }
            });

        } else {
            console.log('No product found or error:', result);
        }
    });
}).on('error', console.error);
