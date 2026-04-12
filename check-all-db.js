
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAll() {
    try {
        const analyses = await prisma.departmentAnalysis.findMany({ take: 10, orderBy: { updatedAt: 'desc' } });
        console.log('--- Latest 10 Analyses ---');
        analyses.forEach(a => {
            console.log(`ID: ${a.id}, Dept: ${a.department}, Type: ${a.type}, EntityId: ${a.entityId}`);
        });
        if (analyses.length === 0) console.log('No data found in DepartmentAnalysis');
    } catch (err) {
        console.error('Fetch Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkAll();
