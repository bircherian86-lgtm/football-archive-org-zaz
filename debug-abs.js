const path = require('path');
require('dotenv').config();
const dbPath = path.resolve(process.cwd(), 'data.db');
const url = 'file:' + dbPath;
console.log('Absolute URL:', url);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasourceUrl: url
});

async function test() {
    try {
        const count = await prisma.user.count();
        console.log('User count:', count);
        process.exit(0);
    } catch (e) {
        console.error('Test failed:', e);
        process.exit(1);
    }
}

test();
