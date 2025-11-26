/**
 * Test Script: Automation Scheduler
 *
 * Tests the complete automation workflow:
 * 1. Setup test data (user, credentials, channel, products)
 * 2. Create automation rule with SCHEDULE trigger
 * 3. Manually execute rule to test
 * 4. Verify deal published to Telegram
 */

import { PrismaClient } from '@prisma/client';
import { RuleExecutor } from './src/services/RuleExecutor';
import { ProductCacheService } from './src/services/ProductCacheService';
import { SecurityService } from './src/services/SecurityService';

const prisma = new PrismaClient();
const securityService = new SecurityService();

// Test credentials (configure in .env file)
const TEST_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TEST_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

if (!TEST_BOT_TOKEN || !TEST_CHANNEL_ID) {
  console.error('❌ Errore: TELEGRAM_BOT_TOKEN e TELEGRAM_CHANNEL_ID devono essere configurati in .env');
  process.exit(1);
}

async function setupTestData() {
  console.log('\n📦 Setting up test data...\n');

  // 1. Create or get test user
  let user = await prisma.user.findUnique({
    where: { email: 'test@afflyt.io' }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test@afflyt.io',
        name: 'Test User',
        plan: 'PRO'
      }
    });
    console.log('✅ Created test user');
  } else {
    console.log('✅ Test user already exists');
  }

  // 2. Create or get Telegram bot credential
  let telegramCred = await prisma.credential.findFirst({
    where: {
      userId: user.id,
      provider: 'TELEGRAM_BOT'
    }
  });

  if (!telegramCred) {
    telegramCred = await prisma.credential.create({
      data: {
        userId: user.id,
        provider: 'TELEGRAM_BOT',
        key: securityService.encrypt(TEST_BOT_TOKEN),
        label: 'Test Bot'
      }
    });
    console.log('✅ Created Telegram bot credential');
  } else {
    console.log('✅ Telegram credential already exists');
  }

  // 3. Create or get Telegram channel
  let channel = await prisma.channel.findFirst({
    where: {
      userId: user.id,
      platform: 'TELEGRAM'
    }
  });

  if (!channel) {
    channel = await prisma.channel.create({
      data: {
        userId: user.id,
        name: 'Test Channel',
        platform: 'TELEGRAM',
        channelId: TEST_CHANNEL_ID,
        credentialId: telegramCred.id,
        status: 'CONNECTED'
      }
    });
    console.log('✅ Created Telegram channel');
  } else {
    console.log('✅ Telegram channel already exists');
  }

  // 4. Create test products in cache (if not exist)
  const cacheService = new ProductCacheService();

  const testProducts = [
    {
      asin: 'B08N5WRWNW',
      title: 'Apple AirPods Pro (2ª generazione) con Custodia di Ricarica MagSafe',
      currentPrice: 199.99,
      originalPrice: 299.00,
      category: 'Electronics',
      imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
      rating: 4.7,
      reviewCount: 45234,
      salesRank: 50
    },
    {
      asin: 'B0BSHF7WHW',
      title: 'Samsung Galaxy Buds2 Pro, Cuffie Bluetooth',
      currentPrice: 149.99,
      originalPrice: 229.00,
      category: 'Electronics',
      imageUrl: 'https://m.media-amazon.com/images/I/51KK9rKGdvL._AC_SL1500_.jpg',
      rating: 4.5,
      reviewCount: 12350,
      salesRank: 120
    },
    {
      asin: 'B09G9BL5CP',
      title: 'Sony WH-1000XM5 Cuffie Bluetooth Wireless',
      currentPrice: 299.99,
      originalPrice: 419.00,
      category: 'Electronics',
      imageUrl: 'https://m.media-amazon.com/images/I/51K7V8gZJaL._AC_SL1500_.jpg',
      rating: 4.8,
      reviewCount: 23456,
      salesRank: 25
    }
  ];

  for (const product of testProducts) {
    const existing = await prisma.product.findUnique({
      where: { asin: product.asin }
    });

    if (!existing) {
      await cacheService.updateProduct(product.asin, product);
      console.log(`✅ Created product: ${product.title.substring(0, 50)}...`);
    } else {
      console.log(`✅ Product already exists: ${product.asin}`);
    }
  }

  return { user, channel, telegramCred };
}

async function createTestRule(userId: string, channelId: string) {
  console.log('\n🤖 Creating test automation rule...\n');

  // Check if rule already exists
  let rule = await prisma.automationRule.findFirst({
    where: {
      userId,
      name: 'Test Automation - Electronics Deals'
    }
  });

  if (rule) {
    console.log('✅ Test rule already exists');
    console.log(`   ID: ${rule.id}`);
    console.log(`   Name: ${rule.name}`);
    return rule;
  }

  // Create new rule
  rule = await prisma.automationRule.create({
    data: {
      userId,
      name: 'Test Automation - Electronics Deals',
      description: 'Automatically publish top electronics deals every 6 hours',
      isActive: true,
      categories: JSON.stringify(['Electronics']),
      minScore: 70,
      maxPrice: 500,
      channelId,
      triggers: {
        create: {
          type: 'SCHEDULE',
          config: JSON.stringify({ cron: '0 */6 * * *' }) // Every 6 hours
        }
      },
      actions: {
        create: {
          type: 'PUBLISH_CHANNEL',
          config: JSON.stringify({ template: 'default' }),
          order: 1
        }
      }
    },
    include: {
      triggers: true,
      actions: true
    }
  });

  console.log('✅ Created automation rule');
  console.log(`   ID: ${rule.id}`);
  console.log(`   Name: ${rule.name}`);
  console.log(`   Categories: ${rule.categories}`);
  console.log(`   Min Score: ${rule.minScore}`);
  console.log(`   Max Price: €${rule.maxPrice}`);
  console.log(`   Schedule: Every 6 hours`);

  return rule;
}

async function testRuleExecution(ruleId: string) {
  console.log('\n🚀 Executing automation rule...\n');
  console.log('='.repeat(70));

  const result = await RuleExecutor.executeRule(ruleId);

  console.log('='.repeat(70));
  console.log('\n📊 EXECUTION RESULT');
  console.log('='.repeat(70));
  console.log(`Success: ${result.success}`);
  console.log(`Deals Processed: ${result.dealsProcessed}`);
  console.log(`Deals Published: ${result.dealsPublished}`);
  console.log(`Execution Time: ${result.executionTime}ms`);
  console.log(`Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('='.repeat(70));

  if (result.success && result.dealsPublished > 0) {
    console.log('\n✅ SUCCESS! Check your Telegram channel for published deals.');
  } else if (result.success && result.dealsPublished === 0) {
    console.log('\n⚠️  Rule executed but no deals met the criteria.');
    console.log('   Try lowering minScore or increasing maxPrice in the rule.');
  } else {
    console.log('\n❌ Rule execution failed. Check errors above.');
  }
}

async function main() {
  console.log('\n' + '🤖'.repeat(35));
  console.log('🤖 AUTOMATION SCHEDULER TEST');
  console.log('🤖'.repeat(35) + '\n');

  try {
    // Setup test data
    const { user, channel } = await setupTestData();

    // Create test rule
    const rule = await createTestRule(user.id, channel.id);

    // Execute rule
    await testRuleExecution(rule.id);

    console.log('\n✅ Test completed!\n');
    console.log('💡 Next steps:');
    console.log('   1. Check Telegram channel for published deals');
    console.log('   2. View deal tracking in Prisma Studio (http://localhost:5555)');
    console.log('   3. Test scheduler: wait 5 minutes to see if scheduler picks up the rule');
    console.log('   4. Or manually trigger: POST http://localhost:3001/automation/rules/:id/run\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
if (require.main === module) {
  main();
}

export { main as testAutomationScheduler };
