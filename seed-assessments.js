const prisma = require('./lib/prisma');

async function seed() {
    try {
        const entity = await prisma.entity.findFirst();
        const version = await prisma.strategyVersion.findFirst({ where: { entityId: entity.id } });

        console.log('Entity:', entity.displayName, '| Version:', version.name);

        const assessments = [
            {
                versionId: version.id,
                title: 'تقييم البيئة الداخلية Q1-2026',
                description: 'تحليل شامل لنقاط القوة والضعف الداخلية للمنظمة خلال الربع الأول',
                type: 'INTERNAL',
                status: 'COMPLETED',
                progress: 100,
                score: 78.5,
            },
            {
                versionId: version.id,
                title: 'تقييم البيئة الخارجية Q1-2026',
                description: 'تحليل الفرص والتهديدات في البيئة الخارجية مع التركيز على السوق المحلي',
                type: 'EXTERNAL',
                status: 'COMPLETED',
                progress: 100,
                score: 65.0,
            },
            {
                versionId: version.id,
                title: 'تقييم الأداء المالي',
                description: 'مراجعة الأداء المالي وتحليل مؤشرات الربحية والسيولة والعائد على الاستثمار',
                type: 'INTERNAL',
                status: 'IN_PROGRESS',
                progress: 72,
            },
            {
                versionId: version.id,
                title: 'تحليل تنافسية السوق',
                description: 'دراسة الموقع التنافسي للمنظمة مقارنة بالمنافسين الرئيسيين في القطاع',
                type: 'EXTERNAL',
                status: 'IN_PROGRESS',
                progress: 45,
            },
            {
                versionId: version.id,
                title: 'تقييم رأس المال البشري',
                description: 'تقييم كفاءات الموارد البشرية والاحتياجات التدريبية وخطط التطوير',
                type: 'INTERNAL',
                status: 'DRAFT',
                progress: 10,
            },
            {
                versionId: version.id,
                title: 'تحليل PESTEL — البيئة الكلية',
                description: 'تقييم العوامل السياسية والاقتصادية والاجتماعية والتقنية والبيئية والقانونية',
                type: 'EXTERNAL',
                status: 'DRAFT',
                progress: 0,
            },
        ];

        for (const a of assessments) {
            const created = await prisma.assessment.create({ data: a });
            console.log('✅', created.title);
        }

        console.log('\n🎉 Created', assessments.length, 'sample assessments!');
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

seed();
