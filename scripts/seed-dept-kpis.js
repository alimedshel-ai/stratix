const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
    const versionId = 'cmlwkz1180003h956ojlhaze4';

    // Get existing objectives
    const objs = await p.strategicObjective.findMany({
        where: { versionId },
        select: { id: true, title: true, perspective: true }
    });
    const financial = objs.find(o => o.perspective === 'FINANCIAL');
    const internal = objs.find(o => o.perspective === 'INTERNAL_PROCESS');
    const learning = objs.find(o => o.perspective === 'LEARNING_GROWTH');

    // Check existing KPIs
    const existing = await p.kPI.findMany({
        where: { versionId },
        select: { name: true }
    });
    const existingNames = existing.map(k => k.name);

    const allKPIs = [
        // === FINANCIAL ===
        { name: 'Revenue', nameAr: 'الإيرادات', description: 'إجمالي الإيرادات الشهرية بالريال السعودي', unit: 'ريال', target: 5000000, frequency: 'MONTHLY', bscPerspective: 'FINANCIAL', objectiveId: financial?.id },
        { name: 'Expenses', nameAr: 'المصروفات', description: 'إجمالي المصروفات التشغيلية الشهرية', unit: 'ريال', target: 3500000, frequency: 'MONTHLY', direction: 'LOWER_IS_BETTER', bscPerspective: 'FINANCIAL', objectiveId: financial?.id },
        { name: 'Net Profit', nameAr: 'صافي الربح', description: 'الفرق بين الإيرادات والمصروفات', unit: 'ريال', target: 1500000, frequency: 'MONTHLY', bscPerspective: 'FINANCIAL', objectiveId: financial?.id },
        { name: 'Liquidity Ratio', nameAr: 'معدل السيولة', description: 'نسبة الأصول المتداولة للخصوم المتداولة', unit: 'نسبة', target: 1.5, frequency: 'MONTHLY', bscPerspective: 'FINANCIAL', objectiveId: financial?.id },
        { name: 'Cost per Patient', nameAr: 'تكلفة المريض الواحد', description: 'متوسط التكلفة لكل مريض', unit: 'ريال', target: 2000, frequency: 'MONTHLY', direction: 'LOWER_IS_BETTER', bscPerspective: 'FINANCIAL', objectiveId: financial?.id },

        // === HR ===
        { name: 'Employee Count', nameAr: 'عدد الموظفين', description: 'إجمالي عدد الموظفين الحاليين', unit: 'موظف', target: 500, frequency: 'MONTHLY', bscPerspective: 'LEARNING_GROWTH', objectiveId: learning?.id },
        { name: 'Resignations', nameAr: 'الاستقالات', description: 'عدد الاستقالات خلال الفترة', unit: 'موظف', target: 5, frequency: 'MONTHLY', direction: 'LOWER_IS_BETTER', bscPerspective: 'LEARNING_GROWTH', objectiveId: learning?.id },
        { name: 'New Hires', nameAr: 'التعيينات الجديدة', description: 'عدد الموظفين الجدد المعينين', unit: 'موظف', target: 10, frequency: 'MONTHLY', bscPerspective: 'LEARNING_GROWTH', objectiveId: learning?.id },
        { name: 'Absenteeism Rate', nameAr: 'معدل الغياب', description: 'نسبة أيام الغياب من إجمالي أيام العمل', unit: '%', target: 3, frequency: 'MONTHLY', direction: 'LOWER_IS_BETTER', bscPerspective: 'LEARNING_GROWTH', objectiveId: learning?.id },
        { name: 'Employee Satisfaction', nameAr: 'رضا الموظفين', description: 'نتيجة استبيان رضا الموظفين', unit: '%', target: 85, frequency: 'QUARTERLY', bscPerspective: 'LEARNING_GROWTH', objectiveId: learning?.id },

        // === OPERATIONS ===
        { name: 'Cases Count', nameAr: 'عدد الحالات', description: 'إجمالي الحالات المعالجة خلال الفترة', unit: 'حالة', target: 1500, frequency: 'MONTHLY', bscPerspective: 'INTERNAL_PROCESS', objectiveId: internal?.id },
        { name: 'Error Rate', nameAr: 'معدل الأخطاء الطبية', description: 'نسبة الأخطاء الطبية لكل 1000 إجراء', unit: 'لكل 1000', target: 1, frequency: 'MONTHLY', direction: 'LOWER_IS_BETTER', bscPerspective: 'INTERNAL_PROCESS', objectiveId: internal?.id },
        { name: 'Equipment Uptime', nameAr: 'جاهزية المعدات', description: 'نسبة وقت تشغيل المعدات الطبية الرئيسية', unit: '%', target: 98, frequency: 'MONTHLY', bscPerspective: 'INTERNAL_PROCESS', objectiveId: internal?.id },
    ];

    let created = 0;
    for (const kpi of allKPIs) {
        if (!existingNames.includes(kpi.name)) {
            await p.kPI.create({
                data: {
                    versionId,
                    objectiveId: kpi.objectiveId || null,
                    name: kpi.name,
                    nameAr: kpi.nameAr,
                    description: kpi.description,
                    unit: kpi.unit,
                    target: kpi.target,
                    frequency: kpi.frequency,
                    direction: kpi.direction || 'HIGHER_IS_BETTER',
                    bscPerspective: kpi.bscPerspective,
                    status: 'ON_TRACK',
                }
            });
            created++;
            console.log(`  ✅ ${kpi.nameAr}`);
        } else {
            console.log(`  ⏭️ ${kpi.nameAr} (موجود)`);
        }
    }

    console.log(`\n✅ Done! Created ${created} new KPIs`);
    await p.$disconnect();
})();
