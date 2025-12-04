/**
 * Seed Dashboard Data - Recent Deals, Activity
 * Run: npx tsx scripts/seed-dashboard.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:TxuQnPSCjaUQchRMkejTlyxZauqsjWMV@metro.proxy.rlwy.net:48510/railway'
    }
  }
});

// Realistic products for deals
const demoDeals = [
  { asin: 'B0BSHF7WHW', title: 'Apple AirPods Pro (2ª generazione)', price: 229, originalPrice: 279, discount: 18, score: 78, imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg' },
  { asin: 'B0D1XD1ZV3', title: 'Samsung Galaxy S24 Ultra 5G 256GB', price: 1099, originalPrice: 1499, discount: 27, score: 85, imageUrl: 'https://m.media-amazon.com/images/I/71Sa3dqTqzL._AC_SL1500_.jpg' },
  { asin: 'B09V3KXJPB', title: 'Sony WH-1000XM5 Cuffie Wireless', price: 289, originalPrice: 419, discount: 31, score: 82, imageUrl: 'https://m.media-amazon.com/images/I/61vJtKbAssL._AC_SL1500_.jpg' },
  { asin: 'B0BDJYKVGJ', title: 'Dyson V15 Detect Absolute', price: 549, originalPrice: 749, discount: 27, score: 76, imageUrl: 'https://m.media-amazon.com/images/I/61ZPTkHOe0L._AC_SL1500_.jpg' },
  { asin: 'B0CHJGLMJT', title: 'Kindle Paperwhite Signature 32GB', price: 169, originalPrice: 199, discount: 15, score: 71, imageUrl: 'https://m.media-amazon.com/images/I/61Hk13+MwwL._AC_SL1000_.jpg' },
  { asin: 'B0BT9CXXXX', title: 'Logitech MX Master 3S Mouse', price: 79, originalPrice: 129, discount: 38, score: 88, imageUrl: 'https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg' },
  { asin: 'B0C9S8XXXX', title: 'LEGO Technic Ferrari Daytona SP3', price: 329, originalPrice: 449, discount: 27, score: 74, imageUrl: 'https://m.media-amazon.com/images/I/81QpkIctqPL._AC_SL1500_.jpg' },
  { asin: 'B0BN9XXXXX', title: 'iRobot Roomba j7+ Robot Aspirapolvere', price: 599, originalPrice: 899, discount: 33, score: 81, imageUrl: 'https://m.media-amazon.com/images/I/61YwZSUMlUL._AC_SL1500_.jpg' },
  { asin: 'B0BTXXXXXX', title: 'Apple Watch Series 9 GPS 45mm', price: 399, originalPrice: 499, discount: 20, score: 79, imageUrl: 'https://m.media-amazon.com/images/I/71675xnD8EL._AC_SL1500_.jpg' },
  { asin: 'B0DCXXXXXX', title: 'iPad Air M2 11" 256GB WiFi', price: 749, originalPrice: 899, discount: 17, score: 83, imageUrl: 'https://m.media-amazon.com/images/I/61NGnpjoRDL._AC_SL1500_.jpg' },
  { asin: 'B0CSXXXXXX', title: 'Bose QuietComfort Ultra Earbuds', price: 249, originalPrice: 329, discount: 24, score: 77, imageUrl: 'https://m.media-amazon.com/images/I/51QnRYXeqvL._AC_SL1500_.jpg' },
  { asin: 'B0CBXXXXXX', title: 'Samsung TV OLED 55" S95C', price: 1299, originalPrice: 1899, discount: 32, score: 91, imageUrl: 'https://m.media-amazon.com/images/I/71RiQZ0J2ML._AC_SL1500_.jpg' },
  { asin: 'B0DGXXXXXX', title: 'DJI Mini 4 Pro Fly More Combo', price: 999, originalPrice: 1199, discount: 17, score: 75, imageUrl: 'https://m.media-amazon.com/images/I/61n+CqSDVsL._AC_SL1500_.jpg' },
  { asin: 'B0CFXXXXXX', title: 'SanDisk Extreme Pro 2TB SSD', price: 149, originalPrice: 249, discount: 40, score: 89, imageUrl: 'https://m.media-amazon.com/images/I/71vbPRNv7nL._AC_SL1500_.jpg' },
  { asin: 'B0CHXXXXXX', title: 'Anker 737 Power Bank 24000mAh', price: 89, originalPrice: 149, discount: 40, score: 86, imageUrl: 'https://m.media-amazon.com/images/I/61f1YfTkTDL._AC_SL1500_.jpg' },
];

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

  // Get channels
  const channels = await prisma.channel.findMany({
    where: { userId: user.id }
  });

  if (channels.length === 0) {
    console.error('No channels found! Run seed-demo-data.ts first.');
    process.exit(1);
  }

  // Get automation rules
  const rules = await prisma.automationRule.findMany({
    where: { userId: user.id }
  });

  console.log(`\n📦 Creating/updating products...`);

  // Create products if they don't exist
  for (const deal of demoDeals) {
    await prisma.product.upsert({
      where: { asin: deal.asin },
      update: {
        currentPrice: deal.price,
        originalPrice: deal.originalPrice,
        discount: deal.discount,
        scoreComponents: { dealScore: deal.score }
      },
      create: {
        asin: deal.asin,
        title: deal.title,
        category: 'Electronics',
        imageUrl: deal.imageUrl,
        currentPrice: deal.price,
        originalPrice: deal.originalPrice,
        discount: deal.discount,
        rating: 4.5 + Math.random() * 0.4,
        reviewCount: Math.floor(Math.random() * 50000) + 1000,
        salesRank: Math.floor(Math.random() * 500) + 1,
        brandName: deal.title.split(' ')[0],
        isPrime: true,
        isFBA: true,
        scoreComponents: { dealScore: deal.score }
      }
    });
  }
  console.log(`  ✓ Created/updated ${demoDeals.length} products`);

  // ═══════════════════════════════════════════════════════════════
  // CREATE CHANNEL DEAL HISTORY (Recent published deals)
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n📢 Creating recent deal history...`);

  // Clear existing deal history for clean screenshots
  await prisma.channelDealHistory.deleteMany({
    where: {
      channel: { userId: user.id }
    }
  });

  const dealHistoryRecords = [];
  const copySources = ['TEMPLATE', 'LLM', 'LLM_CACHE'];
  const copyTemplates = [
    '🔥 *{title}*\n\n💰 €{price} invece di €{originalPrice}\n💸 Risparmi {discount}%!\n\n👉 {link}',
    '⚡ OFFERTA LAMPO!\n\n{title}\n\n✅ Prezzo: €{price}\n❌ Prima: €{originalPrice}\n\n🛒 {link}',
    '🎯 Deal Score: {score}/100\n\n{title}\n€{price} (-{discount}%)\n\n{link}'
  ];

  // Create deals for the last 7 days
  for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
    // 3-8 deals per day
    const dealsToday = Math.floor(Math.random() * 6) + 3;

    for (let i = 0; i < dealsToday; i++) {
      const deal = demoDeals[Math.floor(Math.random() * demoDeals.length)];
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const rule = rules.length > 0 ? rules[Math.floor(Math.random() * rules.length)] : null;

      const publishedAt = new Date();
      publishedAt.setDate(publishedAt.getDate() - daysAgo);
      publishedAt.setHours(Math.floor(Math.random() * 14) + 8); // 8:00 - 22:00
      publishedAt.setMinutes(Math.floor(Math.random() * 60));

      const expiresAt = new Date(publishedAt);
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 day dedup window

      dealHistoryRecords.push({
        channelId: channel.id,
        asin: `${deal.asin}-${daysAgo}-${i}`, // Make unique for demo
        ruleId: rule?.id || null,
        publishedAt,
        expiresAt,
        generatedCopy: copyTemplates[Math.floor(Math.random() * copyTemplates.length)]
          .replace('{title}', deal.title)
          .replace('{price}', deal.price.toString())
          .replace('{originalPrice}', deal.originalPrice.toString())
          .replace('{discount}', deal.discount.toString())
          .replace('{score}', deal.score.toString())
          .replace('{link}', `https://afflyt.io/r/${Math.random().toString(36).substring(2, 8)}`),
        copySource: copySources[Math.floor(Math.random() * copySources.length)],
        copyGeneratedAt: publishedAt,
        priceAtGeneration: deal.price,
        telegramMessageId: `${Math.floor(Math.random() * 100000)}`
      });
    }
  }

  await prisma.channelDealHistory.createMany({
    data: dealHistoryRecords,
    skipDuplicates: true
  });
  console.log(`  ✓ Created ${dealHistoryRecords.length} deal history records`);

  // ═══════════════════════════════════════════════════════════════
  // CREATE AUTOMATION RUN STATS (Telemetry)
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n📊 Creating automation run stats...`);

  // Clear existing stats
  await prisma.automationRunStats.deleteMany({
    where: {
      rule: { userId: user.id }
    }
  });

  const runStatsRecords = [];

  for (const rule of rules) {
    // Create stats for last 7 days, multiple runs per day
    for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
      const runsToday = rule.isActive ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 2);

      for (let run = 0; run < runsToday; run++) {
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);
        createdAt.setHours(Math.floor(Math.random() * 24));

        const dealsFetched = Math.floor(Math.random() * 150) + 50;
        const dealsAfterFilters = Math.floor(dealsFetched * (0.3 + Math.random() * 0.4));
        const dealsAfterMode = Math.floor(dealsAfterFilters * (0.5 + Math.random() * 0.3));
        const dealsPassingScore = Math.floor(dealsAfterMode * (0.4 + Math.random() * 0.3));
        const dealsPublished = Math.min(rule.dealsPerRun, dealsPassingScore);

        runStatsRecords.push({
          ruleId: rule.id,
          dealsFetched,
          dealsAfterFilters,
          dealsAfterMode,
          dealsPassingScore,
          dealsPublished,
          avgScore: 50 + Math.random() * 30,
          minScore: 35 + Math.random() * 15,
          maxScore: 75 + Math.random() * 20,
          stdDev: 8 + Math.random() * 7,
          minScoreThreshold: rule.minScore,
          dealPublishMode: 'DISCOUNTED_ONLY',
          durationMs: Math.floor(Math.random() * 3000) + 500,
          cacheHit: Math.random() > 0.3,
          createdAt
        });
      }
    }
  }

  await prisma.automationRunStats.createMany({
    data: runStatsRecords
  });
  console.log(`  ✓ Created ${runStatsRecords.length} run stats records`);

  // ═══════════════════════════════════════════════════════════════
  // UPDATE AUTOMATION RULES WITH RECENT STATS
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n⚙️ Updating automation rules...`);

  for (const rule of rules) {
    const recentRuns = runStatsRecords.filter(r => r.ruleId === rule.id);
    const totalDealsPublished = recentRuns.reduce((sum, r) => sum + r.dealsPublished, 0);

    await prisma.automationRule.update({
      where: { id: rule.id },
      data: {
        lastRunAt: new Date(Date.now() - Math.floor(Math.random() * 3) * 60 * 60 * 1000), // 0-3 hours ago
        nextRunAt: new Date(Date.now() + rule.intervalMinutes * 60 * 1000),
        totalRuns: rule.totalRuns + recentRuns.length,
        dealsPublished: rule.dealsPublished + totalDealsPublished
      }
    });
  }
  console.log(`  ✓ Updated ${rules.length} automation rules`);

  // ═══════════════════════════════════════════════════════════════
  // CREATE KEEPA BUDGET USAGE
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n🔑 Creating Keepa budget...`);

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await prisma.keepaMonthlyBudget.upsert({
    where: {
      userId_month: { userId: user.id, month }
    },
    update: {
      tokensUsed: 7523,
      tokensLimit: 10000
    },
    create: {
      userId: user.id,
      month,
      tokensUsed: 7523,
      tokensLimit: 10000,
      resetAt
    }
  });
  console.log(`  ✓ Keepa budget: 7,523 / 10,000 tokens used`);

  // ═══════════════════════════════════════════════════════════════
  // CREATE ONBOARDING PROGRESS (Completed)
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n🎯 Creating onboarding progress...`);

  await prisma.onboardingProgress.upsert({
    where: { userId: user.id },
    update: {
      welcomeSurveyCompleted: true,
      channelsSelected: ['telegram'],
      telegramSetupCompleted: true,
      firstAutomationCreated: true,
      goal: 'monetize',
      audienceSize: 'medium',
      experienceLevel: 'intermediate',
      completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    create: {
      userId: user.id,
      welcomeSurveyCompleted: true,
      channelsSelected: ['telegram'],
      telegramSetupCompleted: true,
      firstAutomationCreated: true,
      goal: 'monetize',
      audienceSize: 'medium',
      experienceLevel: 'intermediate',
      completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  });
  console.log(`  ✓ Onboarding completed`);

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(50));
  console.log('✅ DASHBOARD DATA SEEDED SUCCESSFULLY!');
  console.log('═'.repeat(50));
  console.log(`
📊 Summary:
   • Products: ${demoDeals.length}
   • Deal History: ${dealHistoryRecords.length} (last 7 days)
   • Automation Run Stats: ${runStatsRecords.length}
   • Keepa Budget: 7,523 / 10,000 tokens

🎯 Dashboard should now show:
   • Recent deals published
   • Automation activity
   • Budget usage
   • Completed onboarding
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
