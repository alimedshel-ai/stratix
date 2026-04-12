const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const data = await prisma.departmentAnalysis.findMany({
        take: 50,
    });
    console.log(JSON.stringify(data, null, 2));
}
main();
