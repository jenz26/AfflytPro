/**
 * Map affiliate links and stats to existing channels
 * Run: npx tsx scripts/seed-channel-stats.ts
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

  // Get all existing channels
  const channels = await prisma.channel.findMany({
    where: { userId: user.id }
  });

  console.log(`\n📢 Found ${channels.length} channels:`);
  channels.forEach(c => console.log(`   - ${c.name} (${c.id})`));

  if (channels.length === 0) {
    console.error('No channels found!');
    process.exit(1);
  }

  // Get all affiliate links for this user
  const links = await prisma.affiliateLink.findMany({
    where: { userId: user.id },
    include: { product: true }
  });

  console.log(`\n🔗 Found ${links.length} affiliate links`);

  // Get all automation rules
  const rules = await prisma.automationRule.findMany({
    where: { userId: user.id }
  });

  console.log(`⚙️ Found ${rules.length} automation rules`);

  // ═══════════════════════════════════════════════════════════════
  // 1. UPDATE AFFILIATE LINKS WITH CHANNEL IDS
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n📊 Distributing links across channels...`);

  let linkIndex = 0;
  for (const link of links) {
    // Distribute links evenly across channels
    const channelIndex = linkIndex % channels.length;
    const channel = channels[channelIndex];

    await prisma.affiliateLink.update({
      where: { id: link.id },
      data: { channelId: channel.id }
    });

    linkIndex++;
  }
  console.log(`  ✓ Updated ${links.length} links with channel IDs`);

  // ═══════════════════════════════════════════════════════════════
  // 2. SKIP CLICK UPDATES (too slow for 20k+ clicks)
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n📈 Skipping click updates (channel stats work via link association)`);

  // ═══════════════════════════════════════════════════════════════
  // 3. CREATE CHANNEL DEAL HISTORY
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n📢 Creating channel deal history...`);

  // Clear existing
  await prisma.channelDealHistory.deleteMany({
    where: { channel: { userId: user.id } }
  });

  // Get products
  const products = await prisma.product.findMany({ take: 20 });

  const dealHistoryRecords = [];

  // Create deals for each channel over last 14 days
  for (const channel of channels) {
    // Find a rule for this channel
    const rule = rules.find(r => r.channelId === channel.id) || rules[0];

    for (let daysAgo = 0; daysAgo < 14; daysAgo++) {
      // 2-6 deals per day per channel
      const dealsToday = Math.floor(Math.random() * 5) + 2;

      for (let i = 0; i < dealsToday; i++) {
        const product = products[Math.floor(Math.random() * products.length)];

        const publishedAt = new Date();
        publishedAt.setDate(publishedAt.getDate() - daysAgo);
        publishedAt.setHours(Math.floor(Math.random() * 14) + 8);
        publishedAt.setMinutes(Math.floor(Math.random() * 60));

        const expiresAt = new Date(publishedAt);
        expiresAt.setDate(expiresAt.getDate() + 7);

        dealHistoryRecords.push({
          channelId: channel.id,
          asin: `${product.asin}-${channel.id.slice(0, 4)}-${daysAgo}-${i}`,
          ruleId: rule?.id || null,
          publishedAt,
          expiresAt,
          generatedCopy: `🔥 *${product.title}*\n\n💰 €${product.currentPrice} invece di €${product.originalPrice}\n💸 Risparmi ${product.discount}%!\n\n👉 https://afflyt.io/r/${Math.random().toString(36).substring(2, 8)}`,
          copySource: ['TEMPLATE', 'LLM', 'LLM_CACHE'][Math.floor(Math.random() * 3)],
          copyGeneratedAt: publishedAt,
          priceAtGeneration: product.currentPrice,
          telegramMessageId: `${Math.floor(Math.random() * 100000)}`
        });
      }
    }
  }

  await prisma.channelDealHistory.createMany({
    data: dealHistoryRecords,
    skipDuplicates: true
  });

  console.log(`  ✓ Created ${dealHistoryRecords.length} deal history records`);
  console.log(`     (~${Math.round(dealHistoryRecords.length / channels.length)} deals per channel)`);

  // ═══════════════════════════════════════════════════════════════
  // 4. UPDATE AUTOMATION RULES WITH CHANNEL MAPPINGS
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n⚙️ Mapping automation rules to channels...`);

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const channel = channels[i % channels.length];

    await prisma.automationRule.update({
      where: { id: rule.id },
      data: {
        channelId: channel.id,
        lastRunAt: new Date(Date.now() - Math.floor(Math.random() * 4) * 60 * 60 * 1000),
        nextRunAt: new Date(Date.now() + rule.intervalMinutes * 60 * 1000),
        dealsPublished: Math.floor(Math.random() * 500) + 100,
        clicksGenerated: Math.floor(Math.random() * 5000) + 1000
      }
    });
  }
  console.log(`  ✓ Updated ${rules.length} rules with channel mappings`);

  // ═══════════════════════════════════════════════════════════════
  // 5. CALCULATE AND SHOW CHANNEL STATS
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n📊 Channel Stats Summary:`);
  console.log('═'.repeat(60));

  for (const channel of channels) {
    // Count deals
    const dealCount = await prisma.channelDealHistory.count({
      where: { channelId: channel.id }
    });

    // Count clicks (from links associated with this channel)
    const channelLinks = await prisma.affiliateLink.findMany({
      where: { channelId: channel.id },
      select: { clicks: true, totalRevenue: true, conversionCount: true }
    });

    const totalClicks = channelLinks.reduce((sum, l) => sum + l.clicks, 0);
    const totalRevenue = channelLinks.reduce((sum, l) => sum + l.totalRevenue, 0);
    const totalConversions = channelLinks.reduce((sum, l) => sum + l.conversionCount, 0);

    console.log(`\n📢 ${channel.name}`);
    console.log(`   Posts: ${dealCount}`);
    console.log(`   Clicks: ${totalClicks.toLocaleString()}`);
    console.log(`   Revenue: €${totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
    console.log(`   Conversions: ${totalConversions}`);
    if (totalClicks > 0) {
      console.log(`   CVR: ${((totalConversions / totalClicks) * 100).toFixed(2)}%`);
      console.log(`   EPC: €${(totalRevenue / totalClicks).toFixed(2)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('✅ CHANNEL STATS SEEDED SUCCESSFULLY!');
  console.log('═'.repeat(60));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
