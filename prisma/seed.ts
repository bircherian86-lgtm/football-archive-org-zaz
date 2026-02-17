import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@example.com';
    const hashedPassword = await bcrypt.hash('bedwars2133', 10);

    const admin = await prisma.user.upsert({
        where: { id: 'admin' },
        update: {},
        create: {
            id: 'admin',
            email: adminEmail,
            name: 'Admin',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log('Seeded admin user:', admin);

    // Also seed a user for 'zazaep21' if that's what's used in auth.ts
    const zaza = await prisma.user.upsert({
        where: { email: 'zazaep21' },
        update: {},
        create: {
            email: 'zazaep21',
            name: 'Zaza',
            password: hashedPassword,
            role: 'ADMIN',
        },
    }).catch(() => null);

    if (zaza) console.log('Seeded zaza user');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
