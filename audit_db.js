const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const data = await prisma.departmentAnalysis.findMany({
        select: { id: true, entityId: true, department: true, type: true }
    });
    console.log(JSON.stringify(data, null, 2));
}
main();
