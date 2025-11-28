import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const byCategory = await prisma.product.groupBy({
        by: ['category'],
        _count: true,
        orderBy: { _count: { category: 'desc' } }
    });
    console.log('\nCategory distribution:');
    let total = 0;
    for (const cat of byCategory) {
        console.log(`  ${cat.category}: ${cat._count}`);
        total += cat._count;
    }
    console.log(`\nTotal: ${total} products`);
    await prisma.$disconnect();
}
main();
