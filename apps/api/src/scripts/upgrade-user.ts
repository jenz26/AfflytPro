/**
 * Script to upgrade a user to BUSINESS plan and ADMIN role
 * Run: npx ts-node src/scripts/upgrade-user.ts <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];

    if (!email) {
        // List all users if no email provided
        console.log('\n📋 Users in database:\n');
        const users = await prisma.user.findMany({
            select: { id: true, email: true, plan: true, role: true }
        });

        if (users.length === 0) {
            console.log('No users found.');
        } else {
            users.forEach(u => {
                console.log(`  ${u.email} | Plan: ${u.plan} | Role: ${u.role}`);
            });
        }

        console.log('\n💡 Usage: npx ts-node src/scripts/upgrade-user.ts <email>\n');
        return;
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error(`❌ User not found: ${email}`);
        return;
    }

    console.log(`\n📧 Found user: ${user.email}`);
    console.log(`   Current plan: ${user.plan}`);
    console.log(`   Current role: ${user.role}`);

    // Upgrade to BUSINESS + ADMIN
    const updated = await prisma.user.update({
        where: { email },
        data: {
            plan: 'BUSINESS',
            role: 'ADMIN'
        }
    });

    console.log(`\n✅ User upgraded!`);
    console.log(`   New plan: ${updated.plan}`);
    console.log(`   New role: ${updated.role}`);
    console.log('\n🚀 Full access unlocked!\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
