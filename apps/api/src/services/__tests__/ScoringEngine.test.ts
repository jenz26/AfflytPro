/**
 * ScoringEngine Verification Tests
 *
 * Run with: npx tsx src/services/__tests__/ScoringEngine.test.ts
 */

import {
    calculateDealScore,
    calculateDiscountScore,
    calculateSalesRankScore,
    calculateRatingScore,
    calculatePriceDropScore,
    DEFAULT_WEIGHTS,
    AUDIENCE_WEIGHTS,
    ProductScoreInput,
    ChannelScoreContext
} from '../ScoringEngine';

async function runTests() {
    console.log('=== ScoringEngine Verification Tests ===\n');

    // Test 1: Componenti individuali
    console.log('1. Test componenti singoli:');
    console.log('   Discount 37%:', calculateDiscountScore(37), '(expected: 37)');
    console.log('   Discount 70%:', calculateDiscountScore(70), '(expected: 70)');
    console.log('   SalesRank 500 (Elettronica):', calculateSalesRankScore(500, 'Elettronica').toFixed(1), '(expected: ~42)');
    console.log('   SalesRank 50000 (Elettronica):', calculateSalesRankScore(50000, 'Elettronica').toFixed(1), '(expected: 0)');
    console.log('   SalesRank 100 (Elettronica):', calculateSalesRankScore(100, 'Elettronica').toFixed(1), '(expected: ~57)');
    console.log('   Rating 4.5 (200 reviews):', calculateRatingScore(4.5, 200).toFixed(1), '(expected: ~72)');
    console.log('   Rating 3.8 (50 reviews):', calculateRatingScore(3.8, 50).toFixed(1), '(expected: ~57)');
    console.log('   PriceDrop 50->80:', calculatePriceDropScore(50, 80).toFixed(1), '(expected: ~37.5)');

    // Test 2: Prodotto buono standard (Logitech Mouse -37%, rank 500)
    console.log('\n2. Prodotto buono (Logitech Mouse -37%, rank 500):');
    const logitechMouse: ProductScoreInput = {
        currentPrice: 49.99,
        originalPrice: 79.99,
        discount: 37,
        salesRank: 500,
        rating: 4.5,
        reviewCount: 200,
        category: 'Elettronica'
    };
    const result1 = calculateDealScore(logitechMouse);
    console.log('   Base Score:', result1.baseScore, '(expected: 40-55)');
    console.log('   Label:', result1.label.emoji, result1.label.text);
    console.log('   Components:');
    console.log('     - Discount:', result1.components.discountScore.toFixed(1));
    console.log('     - SalesRank:', result1.components.salesRankScore.toFixed(1));
    console.log('     - Rating:', result1.components.ratingScore.toFixed(1));
    console.log('     - PriceDrop:', result1.components.priceDropScore.toFixed(1));

    // Test 3: Stesso prodotto con context product_hunters
    console.log('\n3. Stesso prodotto + product_hunters context:');
    const productHuntersContext: ChannelScoreContext = {
        channelId: 'test',
        audienceType: 'product_hunters',
        confidence: 0.8
    };
    const result2 = calculateDealScore(logitechMouse, productHuntersContext);
    console.log('   Base Score:', result2.baseScore, '(same as above)');
    console.log('   Final Score:', result2.finalScore, '(expected: different due to weight redistribution)');
    console.log('   Weights used:');
    console.log('     - discount:', result2.weightsUsed.discount.toFixed(2));
    console.log('     - salesRank:', result2.weightsUsed.salesRank.toFixed(2));
    console.log('     - rating:', result2.weightsUsed.rating.toFixed(2));
    console.log('     - priceDrop:', result2.weightsUsed.priceDrop.toFixed(2));

    // Test 4: Cinesata (alto sconto, rank pessimo)
    console.log('\n4. Cinesata (-75%, rank 150000, rating 3.8):');
    const cinesata: ProductScoreInput = {
        currentPrice: 9.99,
        originalPrice: 39.99,
        discount: 75,
        salesRank: 150000,
        rating: 3.8,
        reviewCount: 50,
        category: 'Elettronica'
    };

    const result3a = calculateDealScore(cinesata);
    console.log('   Senza context - Base:', result3a.baseScore, 'Label:', result3a.label.emoji, result3a.label.text);

    const result3b = calculateDealScore(cinesata, {
        channelId: 'test',
        audienceType: 'product_hunters',
        confidence: 0.8
    });
    console.log('   Product Hunters - Final:', result3b.finalScore, '(product_hunters prioritize discount -> higher)');

    const result3c = calculateDealScore(cinesata, {
        channelId: 'test',
        audienceType: 'niche_focused',
        confidence: 0.8
    });
    console.log('   Niche Focused - Final:', result3c.finalScore, '(niche_focused prioritize quality -> lower)');

    const result3d = calculateDealScore(cinesata, {
        channelId: 'test',
        audienceType: 'deal_explorers',
        confidence: 0.8
    });
    console.log('   Deal Explorers - Final:', result3d.finalScore, '(deal_explorers balanced)');

    // Test 5: Prodotto premium (basso sconto, ottimo rank)
    console.log('\n5. Prodotto premium (Sony -20%, rank 50, rating 4.9):');
    const sonyPremium: ProductScoreInput = {
        currentPrice: 799.99,
        originalPrice: 999.99,
        discount: 20,
        salesRank: 50,
        rating: 4.9,
        reviewCount: 5000,
        category: 'Elettronica'
    };

    const result4a = calculateDealScore(sonyPremium);
    console.log('   Senza context - Base:', result4a.baseScore, 'Label:', result4a.label.emoji, result4a.label.text);

    const result4b = calculateDealScore(sonyPremium, {
        channelId: 'test',
        audienceType: 'product_hunters',
        confidence: 0.8
    });
    console.log('   Product Hunters - Final:', result4b.finalScore, '(sconto basso penalizza)');

    const result4c = calculateDealScore(sonyPremium, {
        channelId: 'test',
        audienceType: 'niche_focused',
        confidence: 0.8
    });
    console.log('   Niche Focused - Final:', result4c.finalScore, '(qualità alta premia)');

    // Test 6: Category affinity
    console.log('\n6. Test Category Affinity:');
    const genericProduct: ProductScoreInput = {
        currentPrice: 50,
        originalPrice: 100,
        discount: 50,
        salesRank: 1000,
        rating: 4.2,
        reviewCount: 500,
        category: 'Elettronica'
    };

    const noAffinity = calculateDealScore(genericProduct, {
        channelId: 'test',
        audienceType: 'deal_explorers',
        confidence: 0.5
    });
    console.log('   No category affinity - Final:', noAffinity.finalScore);

    const lowAffinity = calculateDealScore(genericProduct, {
        channelId: 'test',
        audienceType: 'deal_explorers',
        categoryAffinity: { 'Elettronica': 0.2 },
        confidence: 0.5
    });
    console.log('   Low affinity (0.2) - Final:', lowAffinity.finalScore, 'Multiplier:', lowAffinity.affinityMultiplier?.toFixed(2));

    const highAffinity = calculateDealScore(genericProduct, {
        channelId: 'test',
        audienceType: 'deal_explorers',
        categoryAffinity: { 'Elettronica': 1.0 },
        confidence: 0.5
    });
    console.log('   High affinity (1.0) - Final:', highAffinity.finalScore, 'Multiplier:', highAffinity.affinityMultiplier?.toFixed(2));

    // Test 7: Verifica pesi
    console.log('\n7. Verifica pesi configurati:');
    console.log('   DEFAULT_WEIGHTS:', JSON.stringify(DEFAULT_WEIGHTS));
    console.log('   product_hunters:', JSON.stringify(AUDIENCE_WEIGHTS.product_hunters));
    console.log('   deal_explorers:', JSON.stringify(AUDIENCE_WEIGHTS.deal_explorers));
    console.log('   niche_focused:', JSON.stringify(AUDIENCE_WEIGHTS.niche_focused));

    // Verify weights sum to 1
    const checkSum = (w: typeof DEFAULT_WEIGHTS) => w.discount + w.salesRank + w.rating + w.priceDrop;
    console.log('\n   Sum check:');
    console.log('   - DEFAULT:', checkSum(DEFAULT_WEIGHTS).toFixed(2));
    console.log('   - product_hunters:', checkSum(AUDIENCE_WEIGHTS.product_hunters).toFixed(2));
    console.log('   - deal_explorers:', checkSum(AUDIENCE_WEIGHTS.deal_explorers).toFixed(2));
    console.log('   - niche_focused:', checkSum(AUDIENCE_WEIGHTS.niche_focused).toFixed(2));

    // Test 8: Minimal data (no rating, no salesRank)
    console.log('\n8. Test dati minimi (solo sconto):');
    const minimalData: ProductScoreInput = {
        currentPrice: 30,
        originalPrice: 100,
        discount: 70,
        category: 'Elettronica'
    };
    const minimalResult = calculateDealScore(minimalData);
    console.log('   Score:', minimalResult.baseScore, 'Label:', minimalResult.label.emoji, minimalResult.label.text);
    console.log('   Weights redistributed:', JSON.stringify(minimalResult.weightsUsed));

    console.log('\n=== Tests Complete ===\n');
}

runTests().catch(console.error);
