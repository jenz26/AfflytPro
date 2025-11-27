/**
 * Script to fetch all Keepa category IDs for Amazon Italy
 *
 * Usage: npx ts-node src/scripts/fetch-keepa-categories.ts
 */

import axios from 'axios';

const KEEPA_API_KEY = 'a6qm3eukr335ktjbko0r5vqfhvoqgnnscbrin2ddgh3lr3t09sn6cl1c4innl5tm';
const KEEPA_DOMAIN_IT = 8; // Italy

interface KeepaCategory {
    domainId: number;
    catId: number;
    name: string;
    children: number[];
    parent: number;
    highestRank: number;
    productCount: number;
}

async function fetchRootCategories(): Promise<void> {
    console.log('🔍 Fetching Keepa categories for Amazon Italy (domain 8)...\n');

    try {
        // Fetch root categories (parent = 0)
        const response = await axios.get('https://api.keepa.com/category', {
            params: {
                key: KEEPA_API_KEY,
                domain: KEEPA_DOMAIN_IT,
                category: 0,  // 0 = get all root categories
                parents: 1    // Include parent info
            }
        });

        const data = response.data;
        console.log(`Tokens left: ${data.tokensLeft}`);
        console.log(`Refill rate: ${data.refillRate}/min\n`);

        if (!data.categories) {
            console.log('No categories returned. Response:', JSON.stringify(data, null, 2));
            return;
        }

        const categories: Record<string, KeepaCategory> = data.categories;

        console.log('='.repeat(80));
        console.log('AMAZON ITALY - ROOT CATEGORIES');
        console.log('='.repeat(80));
        console.log('');

        // Sort by product count (most popular first)
        const sortedCategories = Object.entries(categories)
            .map(([id, cat]) => ({ id: Number(id), ...cat }))
            .filter(cat => cat.parent === 0 || cat.parent === undefined) // Root categories
            .sort((a, b) => (b.productCount || 0) - (a.productCount || 0));

        console.log('ID\t\t\tName\t\t\t\t\tProducts');
        console.log('-'.repeat(80));

        for (const cat of sortedCategories) {
            const name = cat.name.padEnd(40);
            const count = cat.productCount?.toLocaleString() || 'N/A';
            console.log(`${cat.catId}\t\t${name}\t${count}`);
        }

        console.log('\n' + '='.repeat(80));
        console.log(`Total root categories: ${sortedCategories.length}`);
        console.log('='.repeat(80));

        // Output in format ready for code
        console.log('\n\n// Ready-to-use TypeScript array:');
        console.log('export const KEEPA_IT_CATEGORIES = [');
        for (const cat of sortedCategories) {
            console.log(`    { id: ${cat.catId}, name: '${cat.name.replace(/'/g, "\\'")}', productCount: ${cat.productCount || 0} },`);
        }
        console.log('];');

    } catch (error: any) {
        console.error('Error fetching categories:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Also fetch subcategories for main categories
async function fetchAllCategories(): Promise<void> {
    console.log('\n\n🔍 Fetching ALL categories (including subcategories)...\n');

    try {
        // Keepa's search endpoint can find categories by keyword
        // Or we can iterate through known root categories

        const knownRootIds = [
            166199011,   // Elettronica
            16427032011, // Casa e Cucina
            16345581011, // Abbigliamento
            133140011,   // Libri
            10954551011, // Giochi e Giocattoli
            11032804011, // Bellezza
            16352651011, // Salute
            11040321011, // Sport
            16347621011, // Automotive
            2619529011,  // Giardino
            166199031,   // Informatica
            10981697011, // Ufficio
            1482149031,  // Alimentari
            163856011,   // Musica
            11051271011, // Videogiochi
            16347721011, // Fai da Te
        ];

        const allCategories: any[] = [];

        for (const rootId of knownRootIds) {
            console.log(`Fetching subcategories for ${rootId}...`);

            const response = await axios.get('https://api.keepa.com/category', {
                params: {
                    key: KEEPA_API_KEY,
                    domain: KEEPA_DOMAIN_IT,
                    category: rootId,
                    parents: 1
                }
            });

            if (response.data.categories) {
                const cats = Object.entries(response.data.categories).map(([id, cat]: [string, any]) => ({
                    id: Number(id),
                    ...cat
                }));
                allCategories.push(...cats);
            }

            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`\nTotal categories found: ${allCategories.length}`);

        // Group by parent
        const byParent: Record<number, any[]> = {};
        for (const cat of allCategories) {
            const parent = cat.parent || 0;
            if (!byParent[parent]) byParent[parent] = [];
            byParent[parent].push(cat);
        }

        console.log('\nCategories grouped by parent:');
        for (const [parent, cats] of Object.entries(byParent)) {
            console.log(`\nParent ${parent}: ${cats.length} categories`);
            for (const cat of cats.slice(0, 5)) {
                console.log(`  - ${cat.catId}: ${cat.name}`);
            }
            if (cats.length > 5) console.log(`  ... and ${cats.length - 5} more`);
        }

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

// Run
async function main() {
    await fetchRootCategories();
    // Uncomment to also fetch subcategories (uses more tokens):
    // await fetchAllCategories();
}

main();
