/**
 * Seed Demo Data for Screenshots
 * Run: npx tsx scripts/seed-demo-data.ts
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

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: userEmail }
  });

  if (!user) {
    console.error(`User ${userEmail} not found!`);
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (${user.id})`);

  // ═══════════════════════════════════════════════════════════════
  // 0. CLEANUP OLD INVALID IDs (non-UUID format)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🧹 Cleaning up old demo data with invalid IDs...');

  // Delete old automation rules with non-UUID IDs
  const oldRuleIds = ['rule-tech-deals', 'rule-flash-offers', 'rule-premium-only'];
  for (const id of oldRuleIds) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "AutomationRule" WHERE id = '${id}'`);
      console.log(`  ✓ Deleted old rule: ${id}`);
    } catch {
      // Ignore if not found
    }
  }

  // Delete old channels with non-UUID IDs
  const oldChannelIds = ['channel-tech-deals', 'channel-offerte-flash'];
  for (const id of oldChannelIds) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "Channel" WHERE id = '${id}'`);
      console.log(`  ✓ Deleted old channel: ${id}`);
    } catch {
      // Ignore if not found
    }
  }

  // Delete old scheduled posts with non-UUID IDs
  const oldPostIds = ['post-morning-bounty', 'post-weekend-recap'];
  for (const id of oldPostIds) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "ScheduledPost" WHERE id = '${id}'`);
      console.log(`  ✓ Deleted old post: ${id}`);
    } catch {
      // Ignore if not found
    }
  }

  // Delete old credential with non-UUID ID
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "Credential" WHERE id = 'demo-telegram-credential'`);
    console.log(`  ✓ Deleted old credential: demo-telegram-credential`);
  } catch {
    // Ignore if not found
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. CREATE AFFILIATE TAGS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📌 Creating affiliate tags...');

  const affiliateTags = await Promise.all([
    prisma.affiliateTag.upsert({
      where: { userId_tag: { userId: user.id, tag: 'afflyt-21' } },
      update: {},
      create: {
        userId: user.id,
        tag: 'afflyt-21',
        label: 'Tag Principale',
        marketplace: 'IT',
        isDefault: true
      }
    }),
    prisma.affiliateTag.upsert({
      where: { userId_tag: { userId: user.id, tag: 'afflyttech-21' } },
      update: {},
      create: {
        userId: user.id,
        tag: 'afflyttech-21',
        label: 'Tag Tech',
        marketplace: 'IT',
        isDefault: false
      }
    })
  ]);
  console.log(`  ✓ Created ${affiliateTags.length} affiliate tags`);

  // ═══════════════════════════════════════════════════════════════
  // 2. CREATE TELEGRAM CHANNELS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📢 Creating channels...');

  // Use deterministic UUIDs for demo data (so they can be updated/deleted)
  const DEMO_IDS = {
    credential: 'a0000000-0000-0000-0000-000000000001',
    channelTech: 'b0000000-0000-0000-0000-000000000001',
    channelFlash: 'b0000000-0000-0000-0000-000000000002',
    ruleTechDeals: 'c0000000-0000-0000-0000-000000000001',
    ruleFlashOffers: 'c0000000-0000-0000-0000-000000000002',
    rulePremiumOnly: 'c0000000-0000-0000-0000-000000000003',
    postMorningBounty: 'd0000000-0000-0000-0000-000000000001',
    postWeekendRecap: 'd0000000-0000-0000-0000-000000000002',
  };

  // First create a credential for the bot
  const credential = await prisma.credential.upsert({
    where: { id: DEMO_IDS.credential },
    update: {},
    create: {
      id: DEMO_IDS.credential,
      userId: user.id,
      provider: 'TELEGRAM_BOT',
      key: 'demo-encrypted-token',
      label: 'Afflyt Demo Bot'
    }
  });

  const channels = await Promise.all([
    prisma.channel.upsert({
      where: { id: DEMO_IDS.channelTech },
      update: {},
      create: {
        id: DEMO_IDS.channelTech,
        userId: user.id,
        name: 'Tech Deals Italia 🇮🇹',
        platform: 'TELEGRAM',
        channelId: '@techdealsita',
        credentialId: credential.id,
        status: 'CONNECTED',
        amazonTag: 'afflyttech-21'
      }
    }),
    prisma.channel.upsert({
      where: { id: DEMO_IDS.channelFlash },
      update: {},
      create: {
        id: DEMO_IDS.channelFlash,
        userId: user.id,
        name: 'Offerte Flash ⚡',
        platform: 'TELEGRAM',
        channelId: '@offerteflashit',
        credentialId: credential.id,
        status: 'CONNECTED',
        amazonTag: 'afflyt-21'
      }
    })
  ]);
  console.log(`  ✓ Created ${channels.length} channels`);

  // ═══════════════════════════════════════════════════════════════
  // 3. CREATE PRODUCTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📦 Creating products...');

  const products = [
    {
      asin: 'B0BSHF7WHW',
      title: 'Apple AirPods Pro (2ª generazione) con custodia MagSafe',
      category: 'Electronics',
      imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
      currentPrice: 229.00,
      originalPrice: 279.00,
      discount: 18,
      salesRank: 15,
      rating: 4.7,
      reviewCount: 45823,
      brandName: 'Apple',
      isPrime: true,
      isFBA: true
    },
    {
      asin: 'B0D1XD1ZV3',
      title: 'Samsung Galaxy S24 Ultra 5G, 256GB, Titanium Gray',
      category: 'Electronics',
      imageUrl: 'https://m.media-amazon.com/images/I/71Sa3dqTqzL._AC_SL1500_.jpg',
      currentPrice: 1099.00,
      originalPrice: 1499.00,
      discount: 27,
      salesRank: 8,
      rating: 4.6,
      reviewCount: 12456,
      brandName: 'Samsung',
      isPrime: true,
      isFBA: true
    },
    {
      asin: 'B09V3KXJPB',
      title: 'Sony WH-1000XM5 Cuffie Wireless con Noise Cancelling',
      category: 'Electronics',
      imageUrl: 'https://m.media-amazon.com/images/I/61vJtKbAssL._AC_SL1500_.jpg',
      currentPrice: 289.00,
      originalPrice: 419.00,
      discount: 31,
      salesRank: 42,
      rating: 4.5,
      reviewCount: 28934,
      brandName: 'Sony',
      isPrime: true,
      isFBA: true
    },
    {
      asin: 'B0BDJYKVGJ',
      title: 'Dyson V15 Detect Absolute Aspirapolvere Senza Fili',
      category: 'Home',
      imageUrl: 'https://m.media-amazon.com/images/I/61ZPTkHOe0L._AC_SL1500_.jpg',
      currentPrice: 549.00,
      originalPrice: 749.00,
      discount: 27,
      salesRank: 156,
      rating: 4.8,
      reviewCount: 8765,
      brandName: 'Dyson',
      isPrime: true,
      isFBA: true
    },
    {
      asin: 'B0CHJGLMJT',
      title: 'Kindle Paperwhite Signature Edition 32GB',
      category: 'Electronics',
      imageUrl: 'https://m.media-amazon.com/images/I/61Hk13+MwwL._AC_SL1000_.jpg',
      currentPrice: 169.99,
      originalPrice: 199.99,
      discount: 15,
      salesRank: 23,
      rating: 4.7,
      reviewCount: 34521,
      brandName: 'Amazon',
      isPrime: true,
      isFBA: true,
      isAmazonSeller: true
    },
    {
      asin: 'B0BT9CXXXX',
      title: 'Logitech MX Master 3S Mouse Wireless Ergonomico',
      category: 'Electronics',
      imageUrl: 'https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg',
      currentPrice: 79.99,
      originalPrice: 129.99,
      discount: 38,
      salesRank: 67,
      rating: 4.8,
      reviewCount: 15678,
      brandName: 'Logitech',
      isPrime: true,
      isFBA: true
    },
    {
      asin: 'B0C9S8XXXX',
      title: 'LEGO Technic Ferrari Daytona SP3 42143',
      category: 'Toys',
      imageUrl: 'https://m.media-amazon.com/images/I/81QpkIctqPL._AC_SL1500_.jpg',
      currentPrice: 329.99,
      originalPrice: 449.99,
      discount: 27,
      salesRank: 234,
      rating: 4.9,
      reviewCount: 5432,
      brandName: 'LEGO',
      isPrime: true,
      isFBA: true
    },
    {
      asin: 'B0BN9XXXXX',
      title: 'iRobot Roomba j7+ Robot Aspirapolvere WiFi',
      category: 'Home',
      imageUrl: 'https://m.media-amazon.com/images/I/61YwZSUMlUL._AC_SL1500_.jpg',
      currentPrice: 599.00,
      originalPrice: 899.00,
      discount: 33,
      salesRank: 89,
      rating: 4.4,
      reviewCount: 9876,
      brandName: 'iRobot',
      isPrime: true,
      isFBA: true
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { asin: product.asin },
      update: product,
      create: product
    });
  }
  console.log(`  ✓ Created ${products.length} products`);

  // ═══════════════════════════════════════════════════════════════
  // 4. CREATE AFFILIATE LINKS WITH CLICKS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🔗 Creating affiliate links with clicks...');

  const dbProducts = await prisma.product.findMany();
  let totalClicks = 0;
  let totalLinks = 0;

  for (const product of dbProducts) {
    const shortCode = `r${Math.random().toString(36).substring(2, 8)}`;

    const link = await prisma.affiliateLink.upsert({
      where: { shortCode },
      update: {},
      create: {
        productId: product.id,
        userId: user.id,
        amazonTag: 'afflyt-21',
        shortCode,
        shortUrl: `https://afflyt.io/r/${shortCode}`,
        fullUrl: `https://www.amazon.it/dp/${product.asin}?tag=afflyt-21`,
        destinationUrl: `https://www.amazon.it/dp/${product.asin}`,
        linkType: 'DEAL',
        clicks: Math.floor(Math.random() * 500) + 50,
        totalRevenue: Math.random() * 200 + 20,
        conversionCount: Math.floor(Math.random() * 15) + 1
      }
    });

    // Create click records for the last 30 days
    const clicksToCreate = Math.floor(Math.random() * 100) + 20;
    const clickRecords = [];

    for (let i = 0; i < clicksToCreate; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const clickedAt = new Date();
      clickedAt.setDate(clickedAt.getDate() - daysAgo);
      clickedAt.setHours(clickedAt.getHours() - hoursAgo);

      const devices = ['mobile', 'desktop', 'tablet'];
      const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
      const countries = ['IT', 'IT', 'IT', 'IT', 'DE', 'FR', 'ES']; // 80% Italy
      const cities = ['Milano', 'Roma', 'Napoli', 'Torino', 'Firenze', 'Bologna', 'Venezia'];

      clickRecords.push({
        linkId: link.id,
        ipHash: `hash_${Math.random().toString(36).substring(2, 10)}`,
        deviceType: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        city: cities[Math.floor(Math.random() * cities.length)],
        clickedAt,
        isUniqueVisitor: Math.random() > 0.3,
        isBot: false
      });
    }

    await prisma.click.createMany({ data: clickRecords });
    totalClicks += clicksToCreate;
    totalLinks++;
  }
  console.log(`  ✓ Created ${totalLinks} links with ${totalClicks} clicks`);

  // ═══════════════════════════════════════════════════════════════
  // 5. CREATE AUTOMATION RULES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n⚙️ Creating automation rules...');

  const automationRules = [
    {
      id: DEMO_IDS.ruleTechDeals,
      userId: user.id,
      name: 'Tech Deals Automatici',
      description: 'Pubblica automaticamente offerte tech con score > 60',
      isActive: true,
      categories: ['Electronics', 'Computers'],
      minScore: 60,
      minDiscount: 20,
      channelId: DEMO_IDS.channelTech,
      schedulePreset: 'active',
      intervalMinutes: 180,
      dealsPerRun: 5,
      lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      totalRuns: 342,
      dealsPublished: 1247,
      clicksGenerated: 15678
    },
    {
      id: DEMO_IDS.ruleFlashOffers,
      userId: user.id,
      name: 'Offerte Flash',
      description: 'Cattura offerte lampo con sconto > 30%',
      isActive: true,
      categories: ['Electronics', 'Home', 'Toys'],
      minScore: 45,
      minDiscount: 30,
      channelId: DEMO_IDS.channelFlash,
      schedulePreset: 'intensive',
      intervalMinutes: 60,
      dealsPerRun: 3,
      lastRunAt: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
      totalRuns: 1256,
      dealsPublished: 3421,
      clicksGenerated: 45231
    },
    {
      id: DEMO_IDS.rulePremiumOnly,
      userId: user.id,
      name: 'Solo Premium (Score 80+)',
      description: 'Offerte premium per pubblico esigente',
      isActive: false,
      categories: ['Electronics'],
      minScore: 80,
      minPrice: 100,
      minRating: 45, // 4.5 stars
      channelId: DEMO_IDS.channelTech,
      schedulePreset: 'relaxed',
      intervalMinutes: 360,
      dealsPerRun: 2,
      totalRuns: 89,
      dealsPublished: 156,
      clicksGenerated: 2341
    }
  ];

  for (const rule of automationRules) {
    await prisma.automationRule.upsert({
      where: { id: rule.id },
      update: rule,
      create: rule
    });
  }
  console.log(`  ✓ Created ${automationRules.length} automation rules`);

  // ═══════════════════════════════════════════════════════════════
  // 6. CREATE NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🔔 Creating notifications...');

  const notifications = [
    {
      userId: user.id,
      type: 'AUTOMATION_SUCCESS' as const,
      channel: 'IN_APP' as const,
      status: 'READ' as const,
      category: 'AUTOMATION' as const,
      priority: 'LOW' as const,
      title: 'Deal pubblicato con successo',
      body: 'AirPods Pro 2 pubblicato su Tech Deals Italia',
      icon: 'CheckCircle',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      readAt: new Date(Date.now() - 25 * 60 * 1000)
    },
    {
      userId: user.id,
      type: 'AUTOMATION_SUCCESS' as const,
      channel: 'IN_APP' as const,
      status: 'READ' as const,
      category: 'AUTOMATION' as const,
      priority: 'LOW' as const,
      title: '3 deal pubblicati',
      body: 'Offerte Flash ha pubblicato 3 nuovi deal',
      icon: 'Zap',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      userId: user.id,
      type: 'DAILY_REPORT' as const,
      channel: 'IN_APP' as const,
      status: 'PENDING' as const,
      category: 'ANALYTICS' as const,
      priority: 'MEDIUM' as const,
      title: 'Report giornaliero disponibile',
      body: 'Ieri hai generato 234 click e €45.67 di commissioni stimate',
      icon: 'BarChart3',
      actionUrl: '/it/dashboard/analytics',
      actionLabel: 'Vedi report'
    },
    {
      userId: user.id,
      type: 'LIMIT_WARNING' as const,
      channel: 'IN_APP' as const,
      status: 'PENDING' as const,
      category: 'SYSTEM' as const,
      priority: 'HIGH' as const,
      title: 'Quota Keepa al 75%',
      body: 'Hai usato 7,500 su 10,000 token Keepa questo mese',
      icon: 'AlertTriangle'
    }
  ];

  await prisma.notification.createMany({ data: notifications });
  console.log(`  ✓ Created ${notifications.length} notifications`);

  // ═══════════════════════════════════════════════════════════════
  // 7. CREATE SCHEDULED POSTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📅 Creating scheduled posts...');

  const scheduledPosts = [
    {
      id: DEMO_IDS.postMorningBounty,
      userId: user.id,
      channelId: DEMO_IDS.channelTech,
      type: 'BOUNTY' as const,
      name: 'Bounty Prime Mattina',
      content: '🎁 Non hai ancora Amazon Prime?\n\nProva 30 giorni GRATIS e scopri:\n✅ Spedizioni illimitate in 1 giorno\n✅ Prime Video incluso\n✅ Offerte esclusive\n\n👉 {{link}}',
      schedule: '0 9 * * *',
      timezone: 'Europe/Rome',
      isActive: true,
      lastRunAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextRunAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      runCount: 45,
      totalClicks: 1234
    },
    {
      id: DEMO_IDS.postWeekendRecap,
      userId: user.id,
      channelId: DEMO_IDS.channelFlash,
      type: 'RECAP' as const,
      name: 'Recap Weekend',
      content: '📊 TOP 5 OFFERTE DELLA SETTIMANA\n\n{{deals}}\n\n💡 Non perdere le prossime offerte, attiva le notifiche!',
      schedule: '0 10 * * 0',
      timezone: 'Europe/Rome',
      isActive: true,
      lastRunAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      nextRunAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      runCount: 12,
      totalClicks: 567
    }
  ];

  for (const post of scheduledPosts) {
    await prisma.scheduledPost.upsert({
      where: { id: post.id },
      update: post,
      create: post
    });
  }
  console.log(`  ✓ Created ${scheduledPosts.length} scheduled posts`);

  // ═══════════════════════════════════════════════════════════════
  // 8. UPDATE USER STATS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n👤 Updating user profile...');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: 'BETA_TESTER',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      personaType: 'creator',
      experienceLevel: 'intermediate',
      audienceSize: 'medium',
      primaryGoal: 'monetize',
      preferredChannels: ['telegram'],
      hasAmazonAssociates: true,
      onboardingCompletedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastLoginAt: new Date()
    }
  });
  console.log('  ✓ User profile updated');

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(50));
  console.log('✅ SEED COMPLETED SUCCESSFULLY!');
  console.log('═'.repeat(50));
  console.log(`
📊 Summary:
   • User: ${userEmail}
   • Plan: BETA_TESTER
   • Channels: ${channels.length}
   • Products: ${products.length}
   • Affiliate Links: ${totalLinks}
   • Total Clicks: ${totalClicks}
   • Automation Rules: ${automationRules.length}
   • Scheduled Posts: ${scheduledPosts.length}
   • Notifications: ${notifications.length}
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
