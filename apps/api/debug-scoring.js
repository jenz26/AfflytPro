/**
 * Debug script per verificare come funziona lo scoring
 * Simula esattamente quello che fa KeepaWorker + ScoringEngine
 */

const https = require('https');
const zlib = require('zlib');
require('dotenv').config();

const KEEPA_API_KEY = process.env.KEEPA_API_KEY;

// ============================================
// SCORING ENGINE (copia esatta dal codice)
// ============================================

class ScoringEngine {
    calculateDealScore(product) {
        const hasRatingData = product.rating !== undefined && product.rating !== null;
        const hasSalesRankData = product.salesRank !== undefined && product.salesRank !== null;

        // Calculate raw component scores
        const rawDiscount = this.calculateDiscountScore(product.discount);
        const rawSalesRank = hasSalesRankData ? this.calculateSalesRankScore(product.salesRank, product.category) : 0;
        const rawRating = hasRatingData ? this.calculateRatingScore(product.rating, product.reviewCount) : 0;
        const rawPriceDrop = this.calculatePriceDropScore(product.currentPrice, product.originalPrice);

        let components;
        let mode;

        if (!hasRatingData && !hasSalesRankData) {
            // Minimal data mode: only discount and price drop available
            // Redistribute weights: discount 70%, price drop 30%
            mode = 'MINIMAL';
            const discountNormalized = (rawDiscount / 40) * 70;
            const priceDropNormalized = (rawPriceDrop / 15) * 30;

            components = {
                discountScore: discountNormalized,
                salesRankScore: 0,
                ratingScore: 0,
                priceDropScore: priceDropNormalized
            };
        } else if (!hasRatingData && hasSalesRankData) {
            // Deal API mode: salesRank available but no rating
            // Redistribute rating's 20% weight: discount 50%, salesRank 30%, priceDrop 20%
            mode = 'DEAL_API';
            const discountNormalized = (rawDiscount / 40) * 50;
            const salesRankNormalized = (rawSalesRank / 25) * 30;
            const priceDropNormalized = (rawPriceDrop / 15) * 20;

            components = {
                discountScore: discountNormalized,
                salesRankScore: salesRankNormalized,
                ratingScore: 0,
                priceDropScore: priceDropNormalized
            };
        } else {
            // Full data mode: use standard weights
            mode = 'FULL';
            components = {
                discountScore: rawDiscount,
                salesRankScore: rawSalesRank,
                ratingScore: rawRating,
                priceDropScore: rawPriceDrop
            };
        }

        const totalScore = Math.round(
            components.discountScore +
            components.salesRankScore +
            components.ratingScore +
            components.priceDropScore
        );

        return {
            score: Math.min(100, Math.max(0, totalScore)),
            components,
            rawScores: { rawDiscount, rawSalesRank, rawRating, rawPriceDrop },
            mode
        };
    }

    calculateDiscountScore(discount) {
        // Linear scaling: 0% = 0 points, 100% = 40 points
        return Math.min(40, (discount / 100) * 40);
    }

    calculateSalesRankScore(salesRank, category) {
        if (!salesRank || salesRank <= 0) return 0;

        // Category-specific thresholds (rank at which score becomes 0)
        const categoryThresholds = {
            'Elettronica': 50000,
            'Casa e cucina': 100000,
            'Sport e tempo libero': 75000,
            'Giardino e giardinaggio': 100000,
            'Fai da te': 75000,
            'Libri': 25000,
            'default': 75000
        };

        const maxRank = categoryThresholds[category] || categoryThresholds['default'];

        // Logarithmic scaling for better distribution
        if (salesRank <= 1) return 25;
        if (salesRank >= maxRank) return 0;

        // Use log scale: log(1) = 0, log(maxRank) = max
        const logRank = Math.log10(salesRank);
        const logMax = Math.log10(maxRank);

        // Score decreases as rank increases (higher rank = worse)
        const score = 25 * (1 - (logRank / logMax));

        return Math.max(0, score);
    }

    calculateRatingScore(rating, reviewCount) {
        if (!rating) return 0;
        const baseScore = (rating / 5) * 15;
        let reviewBonus = 0;
        if (reviewCount) {
            if (reviewCount >= 10000) reviewBonus = 5;
            else if (reviewCount >= 5000) reviewBonus = 4;
            else if (reviewCount >= 1000) reviewBonus = 3;
            else if (reviewCount >= 500) reviewBonus = 2;
            else if (reviewCount >= 100) reviewBonus = 1;
        }
        return Math.min(20, baseScore + reviewBonus);
    }

    calculatePriceDropScore(currentPrice, originalPrice) {
        if (currentPrice >= originalPrice) return 0;
        const dropPercentage = ((originalPrice - currentPrice) / originalPrice) * 100;
        return Math.min(15, (dropPercentage / 100) * 15);
    }
}

// ============================================
// TRANSFORM DEAL (copia esatta dal KeepaClient)
// ============================================

function transformDeal(raw) {
    const PRICE_TYPE = { AMAZON: 0, NEW: 1, LIST_PRICE: 4, BUY_BOX: 18 };

    const currentPriceCents = raw.current?.[PRICE_TYPE.BUY_BOX] ??
                              raw.current?.[PRICE_TYPE.AMAZON] ??
                              raw.current?.[PRICE_TYPE.NEW] ?? 0;
    const currentPrice = currentPriceCents > 0 ? currentPriceCents / 100 : 0;

    const listPriceCents = raw.current?.[PRICE_TYPE.LIST_PRICE] ?? 0;
    const listPrice = listPriceCents > 0 ? listPriceCents / 100 : 0;

    const hasVisibleDiscount = listPrice > 0 && listPrice > currentPrice;

    let discountPercent = 0;
    let originalPrice = currentPrice;

    if (hasVisibleDiscount) {
        discountPercent = Math.round(((listPrice - currentPrice) / listPrice) * 100);
        originalPrice = listPrice;
    } else {
        // Fall back to deltaPercent
        if (raw.deltaPercent && Array.isArray(raw.deltaPercent)) {
            const range90 = raw.deltaPercent[3];
            const rangeMonth = raw.deltaPercent[2];
            const deltaValue = range90?.[PRICE_TYPE.BUY_BOX] ?? range90?.[PRICE_TYPE.AMAZON] ?? range90?.[PRICE_TYPE.NEW] ??
                              rangeMonth?.[PRICE_TYPE.BUY_BOX] ?? rangeMonth?.[PRICE_TYPE.AMAZON] ?? rangeMonth?.[PRICE_TYPE.NEW] ?? 0;

            if (typeof deltaValue === 'number' && deltaValue > 0) {
                discountPercent = deltaValue;
            }
        }

        if (discountPercent > 0 && currentPrice > 0) {
            originalPrice = currentPrice / (1 - discountPercent / 100);
        }
    }

    discountPercent = Math.max(0, Math.min(99, Math.round(discountPercent)));

    return {
        asin: raw.asin,
        title: raw.title,
        currentPrice,
        originalPrice,
        discountPercent,
        listPrice,
        hasVisibleDiscount,
        salesRank: raw.current?.[3],
        // NO rating/reviewCount dalla Deal API!
        rating: null,
        reviewCount: null
    };
}

// ============================================
// MAIN
// ============================================

const params = {
    key: KEEPA_API_KEY,
    domain: 8,
    selection: JSON.stringify({
        domainId: 8,
        includeCategories: [524015031],
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

console.log('Fetching deals and debugging scoring...\n');

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
        const rawDeals = result.deals?.dr || [];

        console.log(`Total raw deals: ${rawDeals.length}\n`);

        const scoringEngine = new ScoringEngine();
        const scored = [];

        // Transform and score all deals
        for (const raw of rawDeals) {
            const deal = transformDeal(raw);
            const { score, components, rawScores, mode } = scoringEngine.calculateDealScore({
                currentPrice: deal.currentPrice,
                originalPrice: deal.originalPrice,
                discount: deal.discountPercent,
                salesRank: deal.salesRank,
                rating: deal.rating,
                reviewCount: deal.reviewCount,
                category: 'Casa e cucina'
            });

            scored.push({
                ...deal,
                score,
                components,
                rawScores,
                mode
            });
        }

        // Sort by score
        scored.sort((a, b) => b.score - a.score);

        // Show top 10 deals with full breakdown
        console.log('='.repeat(100));
        console.log('TOP 10 DEALS - FULL SCORE BREAKDOWN');
        console.log('='.repeat(100));

        scored.slice(0, 10).forEach((deal, i) => {
            console.log(`\n${i + 1}. ${deal.title?.substring(0, 60)}...`);
            console.log(`   ASIN: ${deal.asin}`);
            console.log(`   Prezzo: €${deal.currentPrice.toFixed(2)} (originale: €${deal.originalPrice.toFixed(2)})`);
            console.log(`   Sconto: ${deal.discountPercent}% | hasVisibleDiscount: ${deal.hasVisibleDiscount}`);
            console.log(`   SalesRank: ${deal.salesRank} | Rating: ${deal.rating ?? 'N/A'}`);
            console.log('');
            console.log(`   === SCORE BREAKDOWN [Mode: ${deal.mode}] ===`);
            console.log(`   Raw scores (before normalization):`);
            console.log(`     - rawDiscount: ${deal.rawScores.rawDiscount.toFixed(2)} (max 40)`);
            console.log(`     - rawSalesRank: ${deal.rawScores.rawSalesRank.toFixed(2)} (max 25)`);
            console.log(`     - rawRating: ${deal.rawScores.rawRating.toFixed(2)} (max 20)`);
            console.log(`     - rawPriceDrop: ${deal.rawScores.rawPriceDrop.toFixed(2)} (max 15)`);
            console.log('');
            console.log(`   Final components (${deal.mode} mode):`);
            console.log(`     - discountScore: ${deal.components.discountScore.toFixed(2)} (${deal.mode === 'DEAL_API' ? '50%' : deal.mode === 'MINIMAL' ? '70%' : '40%'} weight)`);
            console.log(`     - salesRankScore: ${deal.components.salesRankScore.toFixed(2)} (${deal.mode === 'DEAL_API' ? '30%' : deal.mode === 'MINIMAL' ? '0%' : '25%'} weight)`);
            console.log(`     - priceDropScore: ${deal.components.priceDropScore.toFixed(2)} (${deal.mode === 'DEAL_API' ? '20%' : deal.mode === 'MINIMAL' ? '30%' : '15%'} weight)`);
            console.log(`     - ratingScore: ${deal.components.ratingScore.toFixed(2)} (${deal.mode === 'FULL' ? '20%' : '0%'} weight)`);
            console.log('');
            console.log(`   ⭐ FINAL SCORE: ${deal.score}/100`);
        });

        // Statistics
        console.log('\n' + '='.repeat(100));
        console.log('SCORE DISTRIBUTION');
        console.log('='.repeat(100));

        const ranges = [
            { min: 0, max: 20, label: '0-20 (basso)' },
            { min: 20, max: 40, label: '20-40 (mediocre)' },
            { min: 40, max: 60, label: '40-60 (buono)' },
            { min: 60, max: 80, label: '60-80 (ottimo)' },
            { min: 80, max: 100, label: '80-100 (eccellente)' }
        ];

        ranges.forEach(range => {
            const count = scored.filter(d => d.score >= range.min && d.score < range.max).length;
            const pct = (count / scored.length * 100).toFixed(1);
            const bar = '█'.repeat(Math.round(pct / 2));
            console.log(`${range.label.padEnd(20)} ${count.toString().padStart(4)} (${pct.padStart(5)}%) ${bar}`);
        });

        // How many pass various minScore thresholds
        console.log('\n' + '='.repeat(100));
        console.log('DEALS PASSING VARIOUS minScore THRESHOLDS');
        console.log('='.repeat(100));

        [10, 20, 30, 40, 50, 60, 70, 80].forEach(threshold => {
            const passing = scored.filter(d => d.score >= threshold).length;
            const pct = (passing / scored.length * 100).toFixed(1);
            console.log(`minScore >= ${threshold}: ${passing.toString().padStart(4)} deals (${pct}%)`);
        });

        // Filter by hasVisibleDiscount
        console.log('\n' + '='.repeat(100));
        console.log('DEAL MODE FILTERING');
        console.log('='.repeat(100));

        const visible = scored.filter(d => d.hasVisibleDiscount);
        const notVisible = scored.filter(d => !d.hasVisibleDiscount);

        console.log(`\nDISCOUNTED_ONLY (hasVisibleDiscount = true): ${visible.length} deals`);
        console.log(`  Avg score: ${(visible.reduce((a, d) => a + d.score, 0) / visible.length).toFixed(1)}`);
        console.log(`  Pass minScore 50: ${visible.filter(d => d.score >= 50).length}`);
        console.log(`  Pass minScore 70: ${visible.filter(d => d.score >= 70).length}`);

        console.log(`\nLOWEST_PRICE (hasVisibleDiscount = false): ${notVisible.length} deals`);
        console.log(`  Avg score: ${(notVisible.reduce((a, d) => a + d.score, 0) / notVisible.length).toFixed(1)}`);
        console.log(`  Pass minScore 50: ${notVisible.filter(d => d.score >= 50).length}`);
        console.log(`  Pass minScore 70: ${notVisible.filter(d => d.score >= 70).length}`);
    });
}).on('error', console.error);
