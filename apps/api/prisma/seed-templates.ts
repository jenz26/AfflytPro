import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Onboarding Templates - Based on UX Study
 * These are the 3 main templates shown in the onboarding flow
 */
const ONBOARDING_TEMPLATES = [
    {
        name: '🔥 Bestseller Hunter',
        description: 'Trova i prodotti più venduti con sconti nascosti',
        category: 'popular',
        difficulty: 'easy',
        popularity: 92,
        estimatedRevenue: '€500-2000/mese',
        schedule: '0 */6 * * *', // Every 6 hours
        minScore: 85,
        categories: JSON.stringify(['Electronics', 'Home']),
        maxPrice: 100,
        successStories: JSON.stringify([
            { user: '@techdeals', metric: 'Revenue/mese', value: '€1,847' },
            { user: '@offerte24', metric: 'Click rate', value: '12.3%' }
        ])
    },
    {
        name: '☀️ Morning Deal Drop',
        description: 'Pubblica i migliori deal ogni mattina alle 9:00',
        category: 'scheduled',
        difficulty: 'easy',
        popularity: 87,
        estimatedRevenue: '€300-1000/mese',
        schedule: '0 9 * * *', // Every day at 9:00
        minScore: 75,
        categories: JSON.stringify(['All']),
        maxPrice: null,
        successStories: JSON.stringify([
            { user: '@dailydeals', metric: 'Iscritti +', value: '+2.3k/mese' }
        ])
    },
    {
        name: '💎 Luxury for Less',
        description: 'Prodotti premium con sconti sopra il 50%',
        category: 'premium',
        difficulty: 'medium',
        popularity: 76,
        estimatedRevenue: '€800-3000/mese',
        schedule: '0 */12 * * *', // Every 12 hours
        minScore: 90,
        categories: JSON.stringify(['Fashion', 'Beauty', 'Watches']),
        maxPrice: 500,
        successStories: JSON.stringify([
            { user: '@luxdeals', metric: 'Conv. rate', value: '8.7%' }
        ])
    }
];

/**
 * Additional Advanced Templates
 */
const ADVANCED_TEMPLATES = [
    {
        name: '⚡ Flash Deals Only',
        description: 'Solo deal lampo e offerte a tempo limitato',
        category: 'popular',
        difficulty: 'easy',
        popularity: 91,
        estimatedRevenue: '€400-1500/mese',
        schedule: '*/30 * * * *', // Every 30 minutes
        minScore: 80,
        categories: JSON.stringify(['All']),
        maxPrice: null,
        successStories: JSON.stringify([
            { user: '@flashdeals_it', metric: 'Engagement', value: '15.2%' }
        ])
    },
    {
        name: '🎮 Gaming Deals',
        description: 'Specializzato in videogiochi e accessori gaming',
        category: 'specialized',
        difficulty: 'medium',
        popularity: 83,
        estimatedRevenue: '€600-2500/mese',
        schedule: '0 */8 * * *', // Every 8 hours
        minScore: 82,
        categories: JSON.stringify(['Video Games', 'Computers', 'Electronics']),
        maxPrice: 200,
        successStories: JSON.stringify([
            { user: '@gamingdeals', metric: 'CTR', value: '9.8%' }
        ])
    },
    {
        name: '🏠 Home & Living',
        description: 'Deal per casa, cucina e lifestyle',
        category: 'specialized',
        difficulty: 'easy',
        popularity: 79,
        estimatedRevenue: '€300-1200/mese',
        schedule: '0 10,18 * * *', // 10:00 and 18:00
        minScore: 78,
        categories: JSON.stringify(['Home & Kitchen', 'Home', 'Furniture']),
        maxPrice: 150,
        successStories: JSON.stringify([
            { user: '@homedecor_deals', metric: 'Revenue/mese', value: '€892' }
        ])
    },
    {
        name: '💪 Fitness & Wellness',
        description: 'Deal su fitness, sport e benessere',
        category: 'specialized',
        difficulty: 'medium',
        popularity: 74,
        estimatedRevenue: '€500-1800/mese',
        schedule: '0 7,19 * * *', // 7:00 and 19:00
        minScore: 80,
        categories: JSON.stringify(['Sports', 'Health & Household', 'Beauty']),
        maxPrice: 120,
        successStories: JSON.stringify([
            { user: '@fitdeals', metric: 'Conversion', value: '7.2%' }
        ])
    },
    {
        name: '🎁 Gift Ideas',
        description: 'Idee regalo perfette per ogni occasione',
        category: 'seasonal',
        difficulty: 'easy',
        popularity: 86,
        estimatedRevenue: '€700-2800/mese',
        schedule: '0 12 * * *', // Every day at 12:00
        minScore: 85,
        categories: JSON.stringify(['All']),
        maxPrice: 80,
        successStories: JSON.stringify([
            { user: '@giftideas_it', metric: 'Iscritti +', value: '+1.8k/mese' }
        ])
    },
    {
        name: '📱 Tech Gadgets',
        description: 'Gli ultimi gadget tech a prezzi incredibili',
        category: 'premium',
        difficulty: 'medium',
        popularity: 89,
        estimatedRevenue: '€900-3500/mese',
        schedule: '0 */6 * * *', // Every 6 hours
        minScore: 88,
        categories: JSON.stringify(['Electronics', 'Computers', 'Cell Phones & Accessories']),
        maxPrice: 300,
        successStories: JSON.stringify([
            { user: '@techgadgets', metric: 'Revenue/mese', value: '€2,134' }
        ])
    },
    {
        name: '👶 Baby & Kids',
        description: 'Deal per bambini e neonati',
        category: 'specialized',
        difficulty: 'easy',
        popularity: 77,
        estimatedRevenue: '€400-1400/mese',
        schedule: '0 9,16 * * *', // 9:00 and 16:00
        minScore: 80,
        categories: JSON.stringify(['Baby Products', 'Toys & Games']),
        maxPrice: 100,
        successStories: JSON.stringify([
            { user: '@mamme_risparmio', metric: 'Engagement', value: '11.3%' }
        ])
    }
];

async function seedTemplates() {
    console.log('🌱 Seeding automation templates...');

    try {
        // Clear existing templates
        const deletedCount = await prisma.automationTemplate.deleteMany({});
        console.log(`🗑️  Cleared ${deletedCount.count} existing templates`);

        const ALL_TEMPLATES = [...ONBOARDING_TEMPLATES, ...ADVANCED_TEMPLATES];

        // Insert new templates
        let insertedCount = 0;
        for (const template of ALL_TEMPLATES) {
            await prisma.automationTemplate.create({
                data: template
            });
            insertedCount++;
            console.log(`✅ Created template: ${template.name}`);
        }

        console.log(`\n🎉 Successfully seeded ${insertedCount} automation templates!`);
        console.log(`\nTemplates by category:`);
        console.log(`  Popular: ${ALL_TEMPLATES.filter(t => t.category === 'popular').length}`);
        console.log(`  Scheduled: ${ALL_TEMPLATES.filter(t => t.category === 'scheduled').length}`);
        console.log(`  Premium: ${ALL_TEMPLATES.filter(t => t.category === 'premium').length}`);
        console.log(`  Specialized: ${ALL_TEMPLATES.filter(t => t.category === 'specialized').length}`);
        console.log(`  Seasonal: ${ALL_TEMPLATES.filter(t => t.category === 'seasonal').length}`);

        console.log(`\n⭐ Onboarding templates (shown first): ${ONBOARDING_TEMPLATES.length}`);

    } catch (error) {
        console.error('❌ Error seeding templates:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedTemplates();
