import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@afflyt.io';
    const userEmail = 'user@afflyt.io';
    const password = 'password123';

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log(`Created admin user: ${admin.email}`);

    // Create Standard User
    const user = await prisma.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
            email: userEmail,
            name: 'Standard User',
            password: hashedPassword,
            role: 'USER',
        },
    });

    console.log(`Created standard user: ${user.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
