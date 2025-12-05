/**
 * Seed demo data for a specific user
 * Run: npx tsx scripts/seed-user-data.ts <email>
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
  const userEmail = process.argv[2] || 'angela.leone0606@gmail.com';

  const user = await prisma.user.findUnique({
    where: { email: userEmail }
  });

  if (!user) {
    console.error(`User ${userEmail} not found!`);
    process.exit(1);
  }

  console.log(`Found user: ${user.email}`);

  // Check existing data
  const existingLinks = await prisma.affiliateLink.count({
    where: { userId: user.id }
  });

  if (existingLinks > 10) {
    console.log(`User already has ${existingLinks} links. Skipping...`);
    return;
  }

  // Get some products
  const products = await prisma.product.findMany({
    take: 30,
    orderBy: { dealConfidence: 'desc' }
  });

  if (products.length === 0) {
    console.error('No products found! Run seed-demo-data.ts first.');
    process.exit(1);
  }

  console.log(`\n📦 Using ${products.length} products`);

  // ═══════════════════════════════════════════════════════════════
  // 1. CREATE CHANNELS
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n📢 Creating channels...`);

  const channels = await Promise.all([
    prisma.channel.upsert({
      where: { id: `${user.id}-telegram-1` },
      update: {},
      create: {
        id: `${user.id}-telegram-1`,
        userId: user.id,
        name: 'Offerte Tech',
        type: 'TELEGRAM',
        channelId: '@offertetech',
        isActive: true
      }
    }),
    prisma.channel.upsert({
      where: { id: `${user.id}-telegram-2` },
      update: {},
      create: {
        id: `${user.id}-telegram-2`,
        userId: user.id,
        name: 'Sconti Casa',
        type: 'TELEGRAM',
        channelId: '@sconticasa',
        isActive: true
      }
    })
  ]);

  console.log(`  ✓ Created ${channels.length} channels`);

  // ═══════════════════════════════════════════════════════════════
  // 2. CREATE AFFILIATE LINKS WITH CLICKS AND CONVERSIONS
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n🔗 Creating affiliate links...`);

  const linksToCreate = [];
  const clicksToCreate = [];
  const conversionsToCreate = [];

  for (let i = 0; i < 25; i++) {
    const product = products[i % products.length];
    const channel = channels[i % channels.length];
    const linkId = `${user.id}-link-${i}`;

    // Generate realistic clicks (50-500)
    const clicks = 50 + Math.floor(Math.random() * 450);

    // Generate realistic CVR (2-8%)
    const cvr = 0.02 + Math.random() * 0.06;
    const conversions = Math.max(1, Math.floor(clicks * cvr));

    // Calculate revenue
    const avgOrderValue = product.currentPrice * (1 + Math.random() * 0.5);
    const commissionRate = 0.03 + Math.random() * 0.05;
    const revenue = conversions * avgOrderValue * commissionRate;

    linksToCreate.push({
      id: linkId,
      userId: user.id,
      productId: product.id,
      channelId: channel.id,
      shortCode: `demo${i}${Math.random().toString(36).substring(2, 6)}`,
      clicks,
      conversionCount: conversions,
      totalRevenue: revenue,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
    });

    // Create click records (last 14 days)
    for (let c = 0; c < Math.min(clicks, 100); c++) {
      const daysAgo = Math.floor(Math.random() * 14);
      const hoursAgo = Math.floor(Math.random() * 24);
      clicksToCreate.push({
        linkId,
        clickedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000),
        ipHash: `hash-${Math.random().toString(36).substring(2, 10)}`,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        country: ['IT', 'IT', 'IT', 'DE', 'FR'][Math.floor(Math.random() * 5)],
        device: ['mobile', 'mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 4)],
        telegramChannelId: channel.channelId
      });
    }

    // Create conversion records
    for (let cv = 0; cv < conversions; cv++) {
      const daysAgo = Math.floor(Math.random() * 14);
      conversionsToCreate.push({
        linkId,
        trackingId: `AMZ-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        revenue: avgOrderValue * (0.8 + Math.random() * 0.4),
        commission: avgOrderValue * commissionRate,
        convertedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      });
    }
  }

  // Batch create
  await prisma.affiliateLink.createMany({
    data: linksToCreate,
    skipDuplicates: true
  });
  console.log(`  ✓ Created ${linksToCreate.length} affiliate links`);

  await prisma.click.createMany({
    data: clicksToCreate,
    skipDuplicates: true
  });
  console.log(`  ✓ Created ${clicksToCreate.length} click records`);

  await prisma.conversion.createMany({
    data: conversionsToCreate,
    skipDuplicates: true
  });
  console.log(`  ✓ Created ${conversionsToCreate.length} conversion records`);

  // ═══════════════════════════════════════════════════════════════
  // 3. CREATE AUTOMATION RULES
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n⚙️ Creating automation rules...`);

  await prisma.automationRule.createMany({
    data: [
      {
        userId: user.id,
        name: 'Tech Deals Auto',
        channelId: channels[0].id,
        isActive: true,
        intervalMinutes: 240,
        minDiscount: 25,
        minDealScore: 70,
        maxPrice: 500,
        dealsPublished: 45,
        clicksGenerated: 1200
      },
      {
        userId: user.id,
        name: 'Home Deals',
        channelId: channels[1].id,
        isActive: true,
        intervalMinutes: 360,
        minDiscount: 30,
        minDealScore: 65,
        maxPrice: 200,
        dealsPublished: 28,
        clicksGenerated: 800
      }
    ],
    skipDuplicates: true
  });

  console.log(`  ✓ Created 2 automation rules`);

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  const totalClicks = linksToCreate.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = linksToCreate.reduce((s, l) => s + l.conversionCount, 0);
  const totalRevenue = linksToCreate.reduce((s, l) => s + l.totalRevenue, 0);

  console.log('\n' + '═'.repeat(50));
  console.log('✅ USER DATA SEEDED SUCCESSFULLY!');
  console.log('═'.repeat(50));
  console.log(`
📊 Summary for ${userEmail}:
   • Channels: ${channels.length}
   • Affiliate Links: ${linksToCreate.length}
   • Total Clicks: ${totalClicks.toLocaleString()}
   • Total Conversions: ${totalConversions.toLocaleString()}
   • Total Revenue: €${totalRevenue.toFixed(2)}
   • CVR: ${((totalConversions / totalClicks) * 100).toFixed(2)}%
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
