/**
 * Stress Test Setup Script
 *
 * Creates test automation rules for stress testing the Queue v2 system.
 * Runs LOCALLY but connects to Railway's Redis/Postgres.
 *
 * Usage:
 *   REDIS_URL=... DATABASE_URL=... node scripts/stress-test/setup.js
 */

const { PrismaClient } = require('@prisma/client');
const config = require('./config');

async function main() {
  console.log('='.repeat(60));
  console.log('STRESS TEST SETUP');
  console.log('='.repeat(60));

  const prisma = new PrismaClient();

  try {
    // 1. Find a business user to use for tests (or use yours)
    const user = await prisma.user.findFirst({
      where: { plan: 'BUSINESS' },
      select: { id: true, email: true, plan: true }
    });

    if (!user) {
      console.error('❌ No BUSINESS user found. Create one first.');
      process.exit(1);
    }

    console.log(`\nUsing user: ${user.email} (${user.id})`);

    // 2. Check for existing test rules
    const existingRules = await prisma.automationRule.findMany({
      where: { name: { startsWith: config.TEST_PREFIX } }
    });

    if (existingRules.length > 0) {
      console.log(`\n⚠️  Found ${existingRules.length} existing test rules.`);
      console.log('   Run cleanup.js first or they will be skipped.');
    }

    // 3. Create test rules for each category
    let createdCount = 0;
    const now = new Date();
    // Set nextRunAt to 1 minute from now so they're immediately due
    const nextRunAt = new Date(now.getTime() + 60000);

    for (const category of config.CATEGORIES) {
      console.log(`\nCategory: ${category.name} (ID: ${category.id})`);

      for (let i = 0; i < category.rulesCount; i++) {
        const variation = config.RULE_VARIATIONS[i % config.RULE_VARIATIONS.length];
        const ruleName = `${config.TEST_PREFIX}${category.name}_${i + 1}`;

        // Check if already exists
        const exists = await prisma.automationRule.findFirst({
          where: { name: ruleName }
        });

        if (exists) {
          console.log(`  ⏭️  ${ruleName} already exists, skipping`);
          continue;
        }

        const rule = await prisma.automationRule.create({
          data: {
            userId: user.id,
            name: ruleName,
            isActive: true,
            // Use TEST_ channel ID - mocked in TelegramBotService
            channelId: `${config.TEST_CHANNEL_PREFIX}${category.id}`,
            // Category as string array (Keepa category ID)
            categories: [category.id.toString()],
            // Filters from variation
            minScore: variation.minScore,
            minDiscount: variation.minDiscount,
            maxPrice: variation.maxPrice,
            // Defaults
            dealsPerRun: 2,
            schedulePreset: 'ONCE',
            dealPublishMode: 'BOTH',
            copyMode: 'TEMPLATE',
            // Trigger immediately
            nextRunAt: nextRunAt,
            lastRunAt: null
          }
        });

        console.log(`  ✅ Created: ${ruleName} (score: ${variation.minScore}, disc: ${variation.minDiscount}%)`);
        createdCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`SETUP COMPLETE`);
    console.log('='.repeat(60));
    console.log(`\nCreated ${createdCount} test rules`);
    console.log(`Expected jobs after batching: ${config.EXPECTED.totalJobs}`);
    console.log(`Token savings: ${config.EXPECTED.tokensSaved} API calls`);
    console.log(`\nRules will trigger at: ${nextRunAt.toISOString()}`);
    console.log(`\nNext step: Run the stress test with:`);
    console.log(`  node scripts/stress-test/runner.js`);

  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
