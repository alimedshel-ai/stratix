const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function extractSectors() {
    try {
        const sectors = await prisma.sector.findMany({
            select: {
                id: true,
                nameAr: true,
                nameEn: true,
                code: true,
                _count: {
                    select: { entities: true, industries: true }
                }
            },
            orderBy: {
                nameAr: 'asc'
            }
        });

        console.log('====== قائمة القطاعات المستخرجة من قاعدة البيانات ======');
        console.log(JSON.stringify(sectors, null, 2));
        console.log(`\nإجمالي القطاعات المُستخرجة: ${sectors.length}`);
        console.log('========================================================');
    } catch (error) {
        console.error('❌ حدث خطأ أثناء الاتصال بقاعدة البيانات:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

extractSectors();
