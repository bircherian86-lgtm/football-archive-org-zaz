require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    try {
        const tables = await p.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
        console.log('Tables in database:');
        console.log(JSON.stringify(tables, null, 2));

        // Test user count
        const userCount = await p.user.count();
        console.log('User count:', userCount);

        const clipCount = await p.clip.count();
        console.log('Clip count:', clipCount);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await p.$disconnect();
    }
}

main();
