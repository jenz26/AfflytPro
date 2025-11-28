/**
 * Script to fix "Altro" categories in existing products
 * Fetches product details from Keepa and updates the category
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { AMAZON_IT_CATEGORIES } from '../data/amazon-categories';

const prisma = new PrismaClient();
const KEEPA_API_KEY = 'a6qm3eukr335ktjbko0r5vqfhvoqgnnscbrin2ddgh3lr3t09sn6cl1c4innl5tm';
const KEEPA_DOMAIN_IT = 8;

function getCategoryName(rootCatId: number): string {
    const category = AMAZON_IT_CATEGORIES.find(c => c.id === rootCatId);
    return category?.name || 'Altro';
}

async function fixCategories() {
    // Find products with "Altro" category
    const productsToFix = await prisma.product.findMany({
        where: { category: 'Altro' },
        select: { asin: true },
        take: 100  // Limit to 100 per run (1 token each)
    });

    console.log(`Found ${productsToFix.length} products with "Altro" category\n`);

    if (productsToFix.length === 0) {
        console.log('Nothing to fix!');
        await prisma.$disconnect();
        return;
    }

    const asins = productsToFix.map(p => p.asin);
    console.log(`Fetching ${asins.length} products from Keepa Product API...`);

    try {
        // Fetch from Keepa Product API
        const response = await axios.get('https://api.keepa.com/product', {
            params: {
                key: KEEPA_API_KEY,
                domain: KEEPA_DOMAIN_IT,
                asin: asins.join(',')
            }
        });

        const products = response.data.products || [];
        console.log(`Got ${products.length} products from Keepa`);
        console.log(`Tokens left: ${response.data.tokensLeft}\n`);

        let fixed = 0;
        let stillAltro = 0;
        const categoryStats: Record<string, number> = {};

        for (const kProduct of products) {
            const rootCat = kProduct.rootCategory;
            const categoryName = getCategoryName(rootCat);

            categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;

            if (categoryName !== 'Altro') {
                await prisma.product.update({
                    where: { asin: kProduct.asin },
                    data: { category: categoryName }
                });
                fixed++;
            } else {
                stillAltro++;
                // Log the rootCategory that doesn't match
                console.log(`  Unknown rootCat ${rootCat} for ASIN ${kProduct.asin}`);
            }
        }

        console.log('\nCategory distribution:');
        for (const [cat, count] of Object.entries(categoryStats).sort((a, b) => b[1] - a[1])) {
            console.log(`  ${cat}: ${count}`);
        }

        console.log('\n' + '='.repeat(50));
        console.log(`Fixed: ${fixed} products`);
        console.log(`Still "Altro": ${stillAltro} products`);
        console.log('='.repeat(50));

    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data: ${JSON.stringify(error.response.data)}`);
        }
    }

    await prisma.$disconnect();
}

// Show current stats first
async function showStats() {
    const total = await prisma.product.count();
    const altro = await prisma.product.count({ where: { category: 'Altro' } });

    const byCategory = await prisma.product.groupBy({
        by: ['category'],
        _count: true,
        orderBy: { _count: { category: 'desc' } }
    });

    console.log('Current DB stats:');
    console.log(`Total products: ${total}`);
    console.log(`"Altro" category: ${altro} (${((altro/total)*100).toFixed(1)}%)\n`);

    console.log('Category distribution:');
    for (const cat of byCategory.slice(0, 15)) {
        console.log(`  ${cat.category}: ${cat._count}`);
    }
    console.log('\n');
}

showStats().then(fixCategories).catch(console.error);
