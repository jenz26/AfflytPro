/**
 * Populate Deal Scores and unlock AI Insights
 * Run: npx tsx scripts/seed-deal-scores.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:TxuQnPSCjaUQchRMkejTlyxZauqsjWMV@metro.proxy.rlwy.net:48510/railway'
    }
  }
});

async function main() {
  const userEmail = 'marco.contin.92@gmail.com';

  const user = await prisma.user.findUnique({
    where: { email: userEmail }
  });

  if (!user) {
    console.error(`User ${userEmail} not found!`);
    process.exit(1);
  }

  console.log(`Found user: ${user.email}`);
  console.log(`Current plan: ${user.plan}`);

  // ═══════════════════════════════════════════════════════════════
  // 1. UPGRADE USER TO BETA_TESTER (unlocks AI Insights)
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n🔓 Upgrading user to BETA_TESTER plan...`);

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: 'BETA_TESTER' }
  });

  console.log(`  ✓ User upgraded to BETA_TESTER (AI Insights unlocked!)`);

  // ═══════════════════════════════════════════════════════════════
  // 2. ADD DEAL CONFIDENCE SCORES TO PRODUCTS
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n📊 Adding deal confidence scores to products...`);

  // Get all products
  const products = await prisma.product.findMany();
  console.log(`   Found ${products.length} products`);

  let updated = 0;
  for (const product of products) {
    // Generate realistic deal score with good distribution
    // Mix of factors: discount, random element, and spread
    const discount = product.discount || 0;

    // Create a more spread distribution:
    // 20% poor (25-45), 25% fair (46-65), 30% good (66-80), 20% great (81-92), 5% excellent (93-98)
    const rand = Math.random();
    let dealScore: number;

    if (rand < 0.20) {
      // Poor: 25-45
      dealScore = 25 + Math.floor(Math.random() * 21);
    } else if (rand < 0.45) {
      // Fair: 46-65
      dealScore = 46 + Math.floor(Math.random() * 20);
    } else if (rand < 0.75) {
      // Good: 66-80
      dealScore = 66 + Math.floor(Math.random() * 15);
    } else if (rand < 0.95) {
      // Great: 81-92
      dealScore = 81 + Math.floor(Math.random() * 12);
    } else {
      // Excellent: 93-98
      dealScore = 93 + Math.floor(Math.random() * 6);
    }

    // Boost score slightly for high discount products
    if (discount > 30) {
      dealScore = Math.min(98, dealScore + 5);
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { dealConfidence: dealScore }
    });

    updated++;
  }

  console.log(`  ✓ Updated ${updated} products with deal scores`);

  // ═══════════════════════════════════════════════════════════════
  // 3. SHOW DEAL SCORE DISTRIBUTION
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n📈 Deal Score Distribution:`);

  const ranges = [
    { min: 0, max: 40, label: '0-40 (Poor)' },
    { min: 41, max: 60, label: '41-60 (Fair)' },
    { min: 61, max: 80, label: '61-80 (Good)' },
    { min: 81, max: 90, label: '81-90 (Great)' },
    { min: 91, max: 100, label: '91-100 (Excellent)' }
  ];

  for (const range of ranges) {
    const count = await prisma.product.count({
      where: {
        dealConfidence: {
          gte: range.min,
          lte: range.max
        }
      }
    });
    const bar = '█'.repeat(Math.ceil(count / 2));
    console.log(`   ${range.label.padEnd(20)} ${count.toString().padStart(3)} ${bar}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. TOP DEALS PREVIEW
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n🏆 Top 5 Deals by Score:`);

  const topDeals = await prisma.product.findMany({
    orderBy: { dealConfidence: 'desc' },
    take: 5,
    select: {
      title: true,
      dealConfidence: true,
      discount: true,
      currentPrice: true
    }
  });

  topDeals.forEach((deal, i) => {
    const title = deal.title.length > 40 ? deal.title.substring(0, 40) + '...' : deal.title;
    console.log(`   ${i + 1}. [${deal.dealConfidence}] ${title}`);
    console.log(`      -${deal.discount}% → €${deal.currentPrice}`);
  });

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(50));
  console.log('✅ DEAL SCORES SEEDED SUCCESSFULLY!');
  console.log('═'.repeat(50));
  console.log(`
📊 Summary:
   • User upgraded to: BETA_TESTER
   • AI Insights: UNLOCKED
   • Products with scores: ${updated}
   • Deal Score tab: READY
  `);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
