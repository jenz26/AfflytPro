import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:TxuQnPSCjaUQchRMkejTlyxZauqsjWMV@metro.proxy.rlwy.net:48510/railway'
    }
  }
});

async function main() {
  const email = process.argv[2] || 'angela.leone0606@gmail.com';

  const user = await prisma.user.update({
    where: { email },
    data: { plan: 'BETA_TESTER' },
    select: { email: true, plan: true }
  });

  console.log('✅ User upgraded:', user);
}

main()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
