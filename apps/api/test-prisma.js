const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing Prisma connection...');
        const count = await prisma.collection.count();
        console.log('Collection count:', count);
    } catch (err) {
        console.error('Prisma error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
