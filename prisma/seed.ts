import Prisma from '@prisma/client';
const { PrismaClient } = Prisma;
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const dbUrl = process.env.DATABASE_URL || 'file:./data.db';
const dbPath = dbUrl.replace('file:', '');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

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
