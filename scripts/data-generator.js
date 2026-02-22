/**
 * Stratix — Data Generator
 * توليد بيانات وهمية كل 5 دقائق لمدة ساعة
 */

const prisma = require('../lib/prisma');

const KPI_IDS = [
    'cmls7b8bi001ks6z7xhqgvavg',
    'cmls7b8bi001ms6z7v75xapgp',
    'cmls7b8bj001os6z7dzwlce92'
];

async function generateHourlyData() {
    const startTime = Date.now();
    const oneHour = 60 * 60 * 1000;
    let count = 0;

    console.log('🔄 [Data Generator] بدأ توليد البيانات:', new Date().toLocaleTimeString('ar-SA'));

    // Verify KPIs exist
    for (const id of KPI_IDS) {
        const kpi = await prisma.kPI.findUnique({ where: { id }, select: { id: true, name: true } });
        if (kpi) {
            console.log(`  ✅ KPI: ${kpi.name}`);
        } else {
            console.log(`  ⚠️ KPI ${id} غير موجود`);
        }
    }

    async function createEntry(kpiId) {
        const kpi = await prisma.kPI.findUnique({ where: { id: kpiId }, select: { name: true, target: true } });
        if (!kpi) {
            console.log(`  ⚠️ تخطي — KPI غير موجود`);
            return;
        }

        const target = kpi.target || 80;
        const variance = (Math.random() - 0.3) * target * 0.4;
        const actualValue = Math.max(0, Math.round(target + variance));

        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const entry = await prisma.kPIEntry.create({
            data: {
                kpiId,
                value: actualValue,
                periodStart,
                periodEnd,
                notes: `بيانات تلقائية — ${now.toLocaleTimeString('ar-SA')}`,
                status: 'CONFIRMED'
            }
        });

        count++;
        const elapsed = Math.round((Date.now() - startTime) / 60000);
        console.log(`  ✅ Entry #${count} | ${kpi.name}: ${actualValue}/${target} | ${elapsed} دقيقة`);
    }

    // Generate first one immediately
    try {
        await createEntry(KPI_IDS[0]);
    } catch (err) {
        console.error('  ❌ خطأ في أول إدخال:', err.message);
    }

    const interval = setInterval(async () => {
        try {
            const kpiId = KPI_IDS[count % KPI_IDS.length];
            await createEntry(kpiId);

            if (Date.now() - startTime > oneHour) {
                clearInterval(interval);
                console.log(`\n🎉 [Data Generator] انتهى — ${count} إدخالات في ساعة`);
                await prisma.$disconnect();
                process.exit(0);
            }
        } catch (err) {
            console.error(`  ❌ خطأ:`, err.message);
        }
    }, 5 * 60 * 1000); // كل 5 دقائق
}

generateHourlyData().catch(console.error);
