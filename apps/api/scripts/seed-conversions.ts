/**
 * Add Conversions to existing affiliate links
 * Run: npx tsx scripts/seed-conversions.ts
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

  console.log(`Found user: ${user.email}`);

  // Get all affiliate links for this user
  const links = await prisma.affiliateLink.findMany({
    where: { userId: user.id },
    include: { product: true }
  });

  console.log(`\n💰 Adding conversions to ${links.length} links...`);

  let totalConversions = 0;
  let totalRevenue = 0;

  for (const link of links) {
    // Calculate realistic CVR (2-5%) based on clicks
    const clicks = link.clicks;
    const cvr = 0.02 + Math.random() * 0.03; // 2-5% CVR
    const conversions = Math.max(1, Math.floor(clicks * cvr));

    // Get product price for realistic revenue
    const productPrice = link.product?.currentPrice || 50;

    // Amazon commission is typically 1-10% depending on category
    const commissionRate = 0.03 + Math.random() * 0.05; // 3-8%

    const conversionRecords = [];
    let linkRevenue = 0;

    for (let i = 0; i < conversions; i++) {
      // Random date in last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const convertedAt = new Date();
      convertedAt.setDate(convertedAt.getDate() - daysAgo);
      convertedAt.setHours(convertedAt.getHours() - hoursAgo);

      // Some conversions are for different amounts (bundles, multiple items)
      const multiplier = Math.random() > 0.8 ? 1 + Math.random() : 1;
      const revenue = productPrice * multiplier;
      const commission = revenue * commissionRate;

      linkRevenue += revenue;

      conversionRecords.push({
        linkId: link.id,
        trackingId: `AMZ-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        revenue,
        commission,
        convertedAt
      });
    }

    // Create conversions
    await prisma.conversion.createMany({
      data: conversionRecords,
      skipDuplicates: true
    });

    // Update link stats
    await prisma.affiliateLink.update({
      where: { id: link.id },
      data: {
        conversionCount: conversions,
        totalRevenue: linkRevenue
      }
    });

    totalConversions += conversions;
    totalRevenue += linkRevenue;
  }

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(50));
  console.log('✅ CONVERSIONS ADDED SUCCESSFULLY!');
  console.log('═'.repeat(50));

  // Calculate totals
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const avgCvr = ((totalConversions / totalClicks) * 100).toFixed(2);
  const avgEpc = (totalRevenue / totalClicks).toFixed(2);

  console.log(`
📊 Summary:
   • Links updated: ${links.length}
   • Total Clicks: ${totalClicks.toLocaleString()}
   • Total Conversions: ${totalConversions.toLocaleString()}
   • Total Revenue: €${totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
   • Average CVR: ${avgCvr}%
   • Average EPC: €${avgEpc}
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
