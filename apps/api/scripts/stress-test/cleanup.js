/**
 * Stress Test Cleanup Script
 *
 * Removes all test automation rules and clears stress test metrics.
 *
 * Usage:
 *   REDIS_URL=... DATABASE_URL=... node scripts/stress-test/cleanup.js
 */

const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const config = require('./config');

async function main() {
  console.log('='.repeat(60));
  console.log('STRESS TEST CLEANUP');
  console.log('='.repeat(60));

  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  try {
    // 1. Delete test automation rules
    const deleteResult = await prisma.automationRule.deleteMany({
      where: { name: { startsWith: config.TEST_PREFIX } }
    });
    console.log(`\n✅ Deleted ${deleteResult.count} test automation rules`);

    // 2. Clear stress test Redis keys
    const stressKeys = await redis.keys('stress:*');
    if (stressKeys.length > 0) {
      await redis.del(...stressKeys);
      console.log(`✅ Deleted ${stressKeys.length} stress test Redis keys`);
    } else {
      console.log('   No stress test Redis keys found');
    }

    // 3. Clear test deduplication keys
    const dedupKeys = await redis.keys('dedup:TEST_*');
    if (dedupKeys.length > 0) {
      await redis.del(...dedupKeys);
      console.log(`✅ Deleted ${dedupKeys.length} test deduplication keys`);
    }

    // 4. Clear pending job markers for test categories
    for (const category of config.CATEGORIES) {
      const pendingKey = `keepa:pending:${category.id}`;
      const deleted = await redis.del(pendingKey);
      if (deleted) {
        console.log(`✅ Cleared pending job for category ${category.name}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('CLEANUP COMPLETE');
    console.log('='.repeat(60));
    console.log('\nThe system is ready for another stress test.');
    console.log('Run: node scripts/stress-test/setup.js');

  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

main().catch(console.error);
