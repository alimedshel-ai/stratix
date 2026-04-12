const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const qs = await prisma.diagQuestion.findMany({
        select: { id: true, questionKey: true, level: true }
    });
    console.log(JSON.stringify(qs, null, 2));
    process.exit(0);
}

main();
