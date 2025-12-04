import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:TxuQnPSCjaUQchRMkejTlyxZauqsjWMV@metro.proxy.rlwy.net:48510/railway'
    }
  }
});

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'marco.contin.92@gmail.com' },
    select: { email: true, plan: true }
  });
  console.log('User:', user);
}

main().finally(() => prisma.$disconnect());
