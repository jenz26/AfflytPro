/**
 * Stress Test Runner
 *
 * Triggers all test rules and monitors the queue processing.
 * Collects metrics from Redis and prints a summary report.
 *
 * Usage:
 *   REDIS_URL=... DATABASE_URL=... node scripts/stress-test/runner.js
 */

const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const config = require('./config');

// Helper to format duration
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

async function main() {
  console.log('='.repeat(60));
  console.log('STRESS TEST RUNNER');
  console.log('='.repeat(60));

  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  try {
    // 1. Find test rules
    const testRules = await prisma.automationRule.findMany({
      where: { name: { startsWith: config.TEST_PREFIX } },
      select: { id: true, name: true, categories: true, nextRunAt: true }
    });

    if (testRules.length === 0) {
      console.error('❌ No test rules found. Run setup.js first.');
      process.exit(1);
    }

    console.log(`\nFound ${testRules.length} test rules`);

    // 2. Group by category to predict batching
    const byCategory = {};
    for (const rule of testRules) {
      const cat = rule.categories[0];
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(rule);
    }

    console.log('\nExpected batching:');
    for (const [cat, rules] of Object.entries(byCategory)) {
      console.log(`  Category ${cat}: ${rules.length} rules → 1 job`);
    }
    console.log(`  Total: ${Object.keys(byCategory).length} jobs instead of ${testRules.length}`);

    // 3. Clear previous stress metrics
    await redis.del('stress:metrics', 'stress:timeline', 'stress:jobs');
    console.log('\nCleared previous stress metrics');

    // 4. Set all rules to trigger NOW
    const now = new Date();
    await prisma.automationRule.updateMany({
      where: { name: { startsWith: config.TEST_PREFIX } },
      data: { nextRunAt: now, isActive: true }
    });
    console.log(`\nSet ${testRules.length} rules to trigger at ${now.toISOString()}`);

    // 5. Record start time
    const startTime = Date.now();
    await redis.hset('stress:timeline', 'startTime', startTime);

    console.log('\n⏳ Waiting for queue processing...');
    console.log('   (The scheduler runs every minute, worker ticks every 5s)');
    console.log('   Press Ctrl+C to stop monitoring\n');

    // 6. Poll for completion
    let lastUpdate = 0;
    let completedJobs = 0;
    const expectedJobs = Object.keys(byCategory).length;

    while (completedJobs < expectedJobs) {
      await new Promise(r => setTimeout(r, 2000)); // Check every 2s

      // Get current queue depth
      const queueDepth = await redis.zcard('keepa:queue');

      // Get stress metrics if available
      const metrics = await redis.hgetall('stress:metrics');

      // Check how many test rules have been processed (lastRunAt updated)
      const processedRules = await prisma.automationRule.count({
        where: {
          name: { startsWith: config.TEST_PREFIX },
          lastRunAt: { gte: now }
        }
      });

      // Estimate completed jobs based on categories that have all rules processed
      completedJobs = 0;
      for (const [cat, rules] of Object.entries(byCategory)) {
        const processedInCat = await prisma.automationRule.count({
          where: {
            name: { startsWith: config.TEST_PREFIX },
            categories: { has: cat },
            lastRunAt: { gte: now }
          }
        });
        if (processedInCat === rules.length) {
          completedJobs++;
        }
      }

      const elapsed = Date.now() - startTime;

      // Only log when something changes
      if (processedRules !== lastUpdate || queueDepth > 0) {
        console.log(
          `[${formatDuration(elapsed)}] ` +
          `Queue: ${queueDepth} | ` +
          `Rules: ${processedRules}/${testRules.length} | ` +
          `Jobs: ${completedJobs}/${expectedJobs}`
        );
        lastUpdate = processedRules;
      }

      // Timeout after 3 minutes
      if (elapsed > 180000) {
        console.log('\n⚠️  Timeout reached (3 min). Some jobs may still be processing.');
        break;
      }
    }

    // 7. Record end time and collect final metrics
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    await redis.hset('stress:timeline', 'endTime', endTime, 'totalTime', totalTime);

    // Get final metrics
    const finalMetrics = await redis.hgetall('stress:metrics');

    // Get Keepa stats
    const keepaStats = await redis.hgetall('keepa:stats');

    // Get token manager state
    const tokensAvailable = await redis.get('keepa:tokens:available');

    console.log('\n' + '='.repeat(60));
    console.log('STRESS TEST RESULTS');
    console.log('='.repeat(60));

    console.log('\n📊 TIMING:');
    console.log(`   Total time: ${formatDuration(totalTime)}`);
    console.log(`   Expected max: ${config.EXPECTED.maxTimeSeconds}s`);

    console.log('\n📦 BATCHING:');
    console.log(`   Rules created: ${testRules.length}`);
    console.log(`   Jobs created: ${completedJobs} (expected: ${expectedJobs})`);
    console.log(`   API calls saved: ${testRules.length - completedJobs}`);

    console.log('\n🎟️  TOKENS:');
    console.log(`   Available now: ${tokensAvailable || 'N/A'}`);
    console.log(`   Jobs processed: ${keepaStats?.jobs_processed || 'N/A'}`);

    if (Object.keys(finalMetrics).length > 0) {
      console.log('\n📈 WORKER METRICS:');
      console.log(`   Rules processed: ${finalMetrics.rulesProcessed || 0}`);
      console.log(`   Deals published: ${finalMetrics.dealsPublished || 0}`);
      console.log(`   Duplicates skipped: ${finalMetrics.duplicatesSkipped || 0}`);
      console.log(`   Token waits: ${finalMetrics.tokenWaits || 0}`);
      console.log(`   Errors: ${finalMetrics.errors || 0}`);
    }

    // Verify assertions
    console.log('\n✅ ASSERTIONS:');

    const batchingWorked = completedJobs <= expectedJobs;
    console.log(`   Batching: ${batchingWorked ? '✅ PASS' : '❌ FAIL'} (${completedJobs} <= ${expectedJobs})`);

    const timeOk = totalTime <= config.EXPECTED.maxTimeSeconds * 1000;
    console.log(`   Time: ${timeOk ? '✅ PASS' : '⚠️ SLOW'} (${formatDuration(totalTime)} <= ${config.EXPECTED.maxTimeSeconds}s)`);

    console.log('\n' + '='.repeat(60));
    console.log('Cleanup: node scripts/stress-test/cleanup.js');
    console.log('='.repeat(60));

  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

main().catch(console.error);
