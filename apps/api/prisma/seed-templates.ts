import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from api directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

/**
 * Amazon IT Category IDs (from apps/api/src/data/amazon-categories.ts)
 */
const CATEGORY_IDS = {
    ELECTRONICS: '412609031',      // Elettronica
    HOME_KITCHEN: '524015031',     // Casa e cucina
    FASHION: '5512286031',         // Moda (gated)
    BEAUTY: '6198082031',          // Bellezza (gated)
    SPORTS: '524012031',           // Sport e tempo libero
    TOYS: '523997031',             // Giochi e giocattoli
    COMPUTERS: '425916031',        // Informatica
    VIDEO_GAMES: '412603031',      // Videogiochi (gated)
    BABY: '1571286031',            // Prima infanzia
    HEALTH: '1571289031',          // Salute e cura della persona
    GARDEN: '635016031',           // Giardino e giardinaggio
};

/**
 * Onboarding Templates - Based on UX Study
 * These are the 3 main templates shown in the onboarding flow
 * Using numeric category IDs for Keepa API compatibility
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
        minScore: 65,
        categories: [CATEGORY_IDS.ELECTRONICS, CATEGORY_IDS.HOME_KITCHEN],
        maxPrice: 100,
        isActive: true,
        successStories: [
            { user: '@techdeals', metric: 'Revenue/mese', value: '€1,847' },
            { user: '@offerte24', metric: 'Click rate', value: '12.3%' }
        ]
    },
    {
        name: '☀️ Morning Deal Drop',
        description: 'Pubblica i migliori deal ogni mattina alle 9:00',
        category: 'scheduled',
        difficulty: 'easy',
        popularity: 87,
        estimatedRevenue: '€300-1000/mese',
        schedule: '0 9 * * *', // Every day at 9:00
        minScore: 60,
        categories: [CATEGORY_IDS.HOME_KITCHEN, CATEGORY_IDS.ELECTRONICS, CATEGORY_IDS.SPORTS],
        maxPrice: null,
        isActive: true,
        successStories: [
            { user: '@dailydeals', metric: 'Iscritti +', value: '+2.3k/mese' }
        ]
    },
    {
        name: '💎 Luxury for Less',
        description: 'Prodotti premium con sconti sopra il 50%',
        category: 'premium',
        difficulty: 'medium',
        popularity: 76,
        estimatedRevenue: '€800-3000/mese',
        schedule: '0 */12 * * *', // Every 12 hours
        minScore: 70,
        categories: [CATEGORY_IDS.ELECTRONICS, CATEGORY_IDS.COMPUTERS],
        maxPrice: 500,
        isActive: true,
        successStories: [
            { user: '@luxdeals', metric: 'Conv. rate', value: '8.7%' }
        ]
    }
];

/**
 * Additional Advanced Templates
 * Using numeric category IDs for Keepa API compatibility
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
        minScore: 60,
        categories: [CATEGORY_IDS.ELECTRONICS, CATEGORY_IDS.HOME_KITCHEN, CATEGORY_IDS.SPORTS],
        maxPrice: null,
        isActive: true,
        successStories: [
            { user: '@flashdeals_it', metric: 'Engagement', value: '15.2%' }
        ]
    },
    {
        name: '🎮 Gaming Deals',
        description: 'Specializzato in videogiochi e accessori gaming',
        category: 'specialized',
        difficulty: 'medium',
        popularity: 83,
        estimatedRevenue: '€600-2500/mese',
        schedule: '0 */8 * * *', // Every 8 hours
        minScore: 65,
        categories: [CATEGORY_IDS.COMPUTERS, CATEGORY_IDS.ELECTRONICS],
        maxPrice: 200,
        isActive: true,
        successStories: [
            { user: '@gamingdeals', metric: 'CTR', value: '9.8%' }
        ]
    },
    {
        name: '🏠 Home & Living',
        description: 'Deal per casa, cucina e lifestyle',
        category: 'specialized',
        difficulty: 'easy',
        popularity: 79,
        estimatedRevenue: '€300-1200/mese',
        schedule: '0 10,18 * * *', // 10:00 and 18:00
        minScore: 60,
        categories: [CATEGORY_IDS.HOME_KITCHEN, CATEGORY_IDS.GARDEN],
        maxPrice: 150,
        isActive: true,
        successStories: [
            { user: '@homedecor_deals', metric: 'Revenue/mese', value: '€892' }
        ]
    },
    {
        name: '💪 Fitness & Wellness',
        description: 'Deal su fitness, sport e benessere',
        category: 'specialized',
        difficulty: 'medium',
        popularity: 74,
        estimatedRevenue: '€500-1800/mese',
        schedule: '0 7,19 * * *', // 7:00 and 19:00
        minScore: 60,
        categories: [CATEGORY_IDS.SPORTS, CATEGORY_IDS.HEALTH],
        maxPrice: 120,
        isActive: true,
        successStories: [
            { user: '@fitdeals', metric: 'Conversion', value: '7.2%' }
        ]
    },
    {
        name: '🎁 Gift Ideas',
        description: 'Idee regalo perfette per ogni occasione',
        category: 'seasonal',
        difficulty: 'easy',
        popularity: 86,
        estimatedRevenue: '€700-2800/mese',
        schedule: '0 12 * * *', // Every day at 12:00
        minScore: 65,
        categories: [CATEGORY_IDS.TOYS, CATEGORY_IDS.HOME_KITCHEN, CATEGORY_IDS.ELECTRONICS],
        maxPrice: 80,
        isActive: true,
        successStories: [
            { user: '@giftideas_it', metric: 'Iscritti +', value: '+1.8k/mese' }
        ]
    },
    {
        name: '📱 Tech Gadgets',
        description: 'Gli ultimi gadget tech a prezzi incredibili',
        category: 'premium',
        difficulty: 'medium',
        popularity: 89,
        estimatedRevenue: '€900-3500/mese',
        schedule: '0 */6 * * *', // Every 6 hours
        minScore: 70,
        categories: [CATEGORY_IDS.ELECTRONICS, CATEGORY_IDS.COMPUTERS],
        maxPrice: 300,
        isActive: true,
        successStories: [
            { user: '@techgadgets', metric: 'Revenue/mese', value: '€2,134' }
        ]
    },
    {
        name: '👶 Baby & Kids',
        description: 'Deal per bambini e neonati',
        category: 'specialized',
        difficulty: 'easy',
        popularity: 77,
        estimatedRevenue: '€400-1400/mese',
        schedule: '0 9,16 * * *', // 9:00 and 16:00
        minScore: 60,
        categories: [CATEGORY_IDS.BABY, CATEGORY_IDS.TOYS],
        maxPrice: 100,
        isActive: true,
        successStories: [
            { user: '@mamme_risparmio', metric: 'Engagement', value: '11.3%' }
        ]
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
                data: {
                    name: template.name,
                    description: template.description,
                    category: template.category,
                    difficulty: template.difficulty,
                    popularity: template.popularity,
                    estimatedRevenue: template.estimatedRevenue,
                    schedule: template.schedule,
                    minScore: template.minScore,
                    categories: { set: template.categories },
                    maxPrice: template.maxPrice,
                    isActive: template.isActive,
                    successStories: template.successStories
                }
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
