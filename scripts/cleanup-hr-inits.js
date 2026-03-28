const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    try {
        const dept = 'HR';
        const analysis = await prisma.departmentAnalysis.findFirst({
            where: { department: dept, type: 'INITIATIVES' }
        });

        if (analysis && analysis.data) {
            let data = JSON.parse(analysis.data);
            if (Array.isArray(data)) {
                const unique = [];
                const seen = new Set();
                data.forEach(item => {
                    if (!seen.has(item.title)) {
                        unique.push(item);
                        seen.add(item.title);
                    }
                });

                await prisma.departmentAnalysis.update({
                    where: { id: analysis.id },
                    data: { data: JSON.stringify(unique) }
                });
                console.log(`Successfully deduplicated HR initiatives. Reduced from ${data.length} to ${unique.length}.`);
            }
        }
    } catch (err) {
        console.error('Cleanup failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
