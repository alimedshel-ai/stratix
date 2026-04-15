const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const hrKeywords = ['توظيف', 'بشرية', 'موظف', 'توطين', 'دوران', 'تعيين', 'التعيين', 'قيادات', 'القيادات', 'استبقاء', 'إداري'];

async function main() {
    console.log('--- Scanning for HR keywords in non-HR departmental analysis ---');

    const analyses = await prisma.departmentAnalysis.findMany({
        where: {
            OR: [
                { type: { startsWith: 'OKRS' } },
                { type: { startsWith: 'OBJECTIVES' } }
            ]
        }
    });

    let totalAffected = 0;
    let affectedEntities = new Set();

    for (const item of analyses) {
        const dept = item.department.toLowerCase();
        if (dept === 'hr' || dept === 'company') continue;

        let data;
        try {
            data = JSON.parse(item.data);
        } catch (e) {
            console.warn(`[Warning] Could not parse data for ${item.department} (${item.type})`);
            continue;
        }

        const dataStr = JSON.stringify(data);
        const leakedKeywords = hrKeywords.filter(key => dataStr.includes(key));

        if (leakedKeywords.length > 0) {
            console.log(`[Leak Found] Dept: ${item.department}, Type: ${item.type}, Entity: ${item.entityId}`);
            console.log(`   Keywords: ${leakedKeywords.join(', ')}`);
            totalAffected++;
            affectedEntities.add(item.entityId);
        }
    }

    console.log('--------------------------------------------------');
    console.log(`Total Affected Records: ${totalAffected}`);
    console.log(`Total Affected Entities: ${affectedEntities.size}`);

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
