/**
 * Real Automation Test
 *
 * Tests the full pipeline with a REAL Telegram channel:
 * - Keepa API fetch
 * - LLM copy generation
 * - Telegram message send
 * - Short link creation
 * - Keepa chart (if enabled)
 *
 * Usage:
 *   DATABASE_URL=... REDIS_URL=... node scripts/stress-test/real-test.js
 */

const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

// Janus channel config
const JANUS_CHANNEL_ID = '-1002882115796';
const JANUS_BOT_TOKEN = '7282919437:AAGUnujka2qXSc0R6u3PdOcWZ2LYg5UqmD8';

async function main() {
  console.log('='.repeat(60));
  console.log('REAL AUTOMATION TEST - JANUS CHANNEL');
  console.log('='.repeat(60));

  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  try {
    // 1. Find the business user
    const user = await prisma.user.findFirst({
      where: { plan: 'BUSINESS' },
      select: { id: true, email: true }
    });

    if (!user) {
      console.error('❌ No BUSINESS user found');
      process.exit(1);
    }
    console.log(`\nUsing user: ${user.email}`);

    // 2. Find or create credential for the bot token
    let credential = await prisma.credential.findFirst({
      where: {
        userId: user.id,
        platform: 'TELEGRAM',
        botToken: JANUS_BOT_TOKEN
      }
    });

    if (!credential) {
      credential = await prisma.credential.create({
        data: {
          userId: user.id,
          platform: 'TELEGRAM',
          botToken: JANUS_BOT_TOKEN,
          botUsername: 'janus_test_bot',
          isValid: true
        }
      });
      console.log('✅ Created credential for Janus bot');
    } else {
      console.log('Using existing credential');
    }

    // 3. Find or create the Janus channel
    let channel = await prisma.channel.findFirst({
      where: {
        userId: user.id,
        channelId: JANUS_CHANNEL_ID
      }
    });

    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          userId: user.id,
          name: 'Janus Test Channel',
          platform: 'TELEGRAM',
          channelId: JANUS_CHANNEL_ID,
          credentialId: credential.id,
          status: 'CONNECTED',
          amazonTag: 'afflyt-21'
        }
      });
      console.log('✅ Created Janus channel');
    } else {
      // Update credential if needed
      if (channel.credentialId !== credential.id) {
        await prisma.channel.update({
          where: { id: channel.id },
          data: { credentialId: credential.id }
        });
        console.log('✅ Updated channel credential');
      }
      console.log(`Using existing channel: ${channel.name}`);
    }

    console.log(`   Channel ID: ${channel.channelId}`);

    // 4. Create a single test rule (will send 1 deal)
    const ruleName = 'REAL_TEST_Janus_SingleDeal';

    // Delete any existing test rule
    await prisma.automationRule.deleteMany({
      where: { name: ruleName }
    });

    const rule = await prisma.automationRule.create({
      data: {
        userId: user.id,
        name: ruleName,
        isActive: true,
        channelId: channel.id,
        categories: ['524015031'], // Casa e cucina
        minScore: 30,
        minDiscount: 10,
        maxPrice: 100,
        dealsPerRun: 1, // Just 1 deal to test
        schedulePreset: 'ONCE',
        dealPublishMode: 'BOTH',
        copyMode: 'LLM', // Use LLM for copy
        includeKeepaChart: true, // Include the chart
        nextRunAt: new Date()
      }
    });

    console.log(`\n✅ Created test rule: ${ruleName}`);
    console.log('   Category: Casa e cucina');
    console.log('   Deals per run: 1');
    console.log('   Copy mode: LLM');
    console.log('   Keepa chart: YES');

    // 5. Trigger the rule manually via API
    console.log('\n⏳ Triggering rule execution...');
    console.log('   Check Railway logs for processing details');
    console.log('   Check Janus Telegram channel for the message');

    // Set nextRunAt to now so scheduler picks it up
    await prisma.automationRule.update({
      where: { id: rule.id },
      data: { nextRunAt: new Date() }
    });

    // Wait and check for completion
    console.log('\n⏳ Waiting for processing (max 60s)...');

    let completed = false;
    const startTime = Date.now();

    while (!completed && (Date.now() - startTime) < 60000) {
      await new Promise(r => setTimeout(r, 3000));

      const updatedRule = await prisma.automationRule.findUnique({
        where: { id: rule.id },
        select: { lastRunAt: true, nextRunAt: true }
      });

      if (updatedRule.lastRunAt && updatedRule.lastRunAt > rule.createdAt) {
        completed = true;
        console.log(`\n✅ Rule executed at ${updatedRule.lastRunAt.toISOString()}`);
      } else {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        process.stdout.write(`\r   [${elapsed}s] Waiting...`);
      }
    }

    if (!completed) {
      console.log('\n⚠️  Timeout - check Railway logs for status');
    }

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\nCheck:');
    console.log('1. Janus Telegram channel for the deal message');
    console.log('2. Railway logs for [KeepaWorker] and [Telegram] entries');
    console.log('3. The message should have:');
    console.log('   - LLM-generated copy (Italian, engaging)');
    console.log('   - Product image');
    console.log('   - Tracked short link');
    console.log('   - Keepa price history chart');

    // Cleanup option
    console.log('\nTo cleanup this test rule:');
    console.log(`  DELETE FROM "AutomationRule" WHERE name = '${ruleName}';`);

  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

main().catch(console.error);
