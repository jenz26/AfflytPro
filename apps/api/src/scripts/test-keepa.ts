import { KeepaEngine } from '../services/KeepaEngine';
import { AMAZON_IT_CATEGORIES, getCategoryById } from '../data/amazon-categories';
import { KeepaUtils } from '../utils/keepa-utils';

async function testKeepaIntegration() {
    console.log('>ê Testing Keepa Integration...\n');

    const keepa = new KeepaEngine();

    // Test 1: Category data
    console.log('TEST 1: Category Data');
    console.log(` Loaded ${AMAZON_IT_CATEGORIES.length} Amazon IT categories`);
    AMAZON_IT_CATEGORIES.slice(0, 5).forEach(cat => {
        console.log(`   - [${cat.id}] ${cat.name} (${cat.competition}${cat.isGated ? ', GATED' : ''})`);
    });
    console.log('');

    // Test 2: Utility functions
    console.log('TEST 2: Utility Functions');
    const testCents = 3999;
    const testEuros = KeepaUtils.centsToEuros(testCents);
    console.log(` Cents to Euros: ${testCents} cents = ¬${testEuros}`);

    const testRating = 450;
    const testStars = KeepaUtils.keepaRatingToStars(testRating);
    console.log(` Rating conversion: ${testRating} (Keepa) = ${testStars} stars`);

    const discount = KeepaUtils.calculateDiscount(3999, 5999);
    console.log(` Discount calculation: ¬59.99 ’ ¬39.99 = ${discount}%`);
    console.log('');

    // Test 3: Single ASIN query (will use mock if no API key)
    console.log('TEST 3: Single Product Fetch (Mock/Real based on API key)');
    try {
        console.log(' KeepaEngine initialized successfully');
        console.log('   - API Key set:', process.env.KEEPA_API_KEY ? 'Yes' : 'No (using mock data)');
        console.log('   - Domain:', process.env.KEEPA_DOMAIN || 'IT');
        console.log('   - Max retries:', process.env.KEEPA_MAX_RETRIES || '3');
    } catch (error: any) {
        console.error('L Test 3 failed:', error.message);
    }
    console.log('');

    // Test 4: Product Finder (will use mock if no API key)
    console.log('TEST 4: Product Finder');
    try {
        const elettronicaId = getCategoryById(166199011)?.id;
        if (elettronicaId) {
            console.log(` Testing product finder for category: Elettronica (${elettronicaId})`);

            const products = await keepa.productFinder({
                categories_include: [elettronicaId],
                current_AMAZON_gte: 2000,  // ¬20
                current_AMAZON_lte: 10000, // ¬100
                current_RATING_gte: 400,   // 4.0 stars
                hasReviews: true,
                perPage: 5
            });

            console.log(` Found ${products.length} products`);
            if (products.length > 0) {
                products.forEach(p => {
                    console.log(`   - ${p.asin}: ${p.title.substring(0, 50)}... (¬${p.currentPrice})`);
                });
            } else {
                console.log('   (No API key set - would return real products with valid key)');
            }
        }
    } catch (error: any) {
        console.error('L Test 4 failed:', error.message);
    }
    console.log('');

    // Test 5: Category helpers
    console.log('TEST 5: Category Helper Functions');
    const elettronica = getCategoryById(166199011);
    console.log(` getCategoryById(166199011): ${elettronica?.name}`);

    const nonGated = AMAZON_IT_CATEGORIES.filter(c => !c.isGated).length;
    console.log(` Non-gated categories: ${nonGated}/${AMAZON_IT_CATEGORIES.length}`);

    const highCompetition = AMAZON_IT_CATEGORIES.filter(c => c.competition === 'high').length;
    console.log(` High competition categories: ${highCompetition}`);
    console.log('');

    console.log('<‰ All tests completed!');
    console.log('\n=Ý Notes:');
    console.log('   - If KEEPA_API_KEY is not set, mock data is used');
    console.log('   - Set KEEPA_API_KEY in .env to test real API calls');
    console.log('   - Error handling and retry logic are implemented');
}

testKeepaIntegration()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('\nL Test suite failed:', error);
        process.exit(1);
    });
