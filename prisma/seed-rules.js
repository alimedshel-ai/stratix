const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Journey Rules...');

    const rules = [
        {
            role: 'OWNER',
            category: 'emergency',
            condition: JSON.stringify({ logic: 'OR', conditions: [{ key: 'res', value: 'critical' }, { key: 'liquidityExact', operator: '<', value: 1 }] }),
            patternKey: 'emergency_risk',
            reasonAr: 'تنبيه: المنشأة تمر بمرحلة حرجة (نقص سيولة/تعثر). الأولوية القصوى لتأمين الوضع المالي وإدارة الأزمات.',
            priority: 100,
        },
        {
            role: 'OWNER',
            category: 'emergency',
            condition: JSON.stringify({ logic: 'AND', conditions: [{ key: 'stage', value: 'struggle' }] }),
            patternKey: 'emergency_risk',
            reasonAr: 'تعثر تشغيلي حاد يتطلب تدخل عاجل لإعادة هيكلة الأولويات وتفادي تفاقم المخاطر.',
            priority: 90,
        },
        {
            role: 'OWNER',
            category: 'scaling',
            condition: JSON.stringify({ logic: 'AND', conditions: [{ key: 'stage', value: 'scaling' }, { key: 'gov', in: ['none', 'partial'] }] }),
            patternKey: 'growing_chaotic',
            reasonAr: 'النمو سريع لكن النظام غائب. المسار يركز على بناء الهياكل واللوائح (SOPs) لدعم التوسع الآمن.',
            priority: 80,
        },
        {
            role: 'OWNER',
            category: 'mature',
            condition: JSON.stringify({ logic: 'AND', conditions: [{ key: 'scale', value: 'easy' }, { key: 'fin', value: 'perfect' }, { key: 'stage', value: 'stable' }] }),
            patternKey: 'mature_competitive',
            reasonAr: 'المعطيات تشير لفرصة ريادة حقيقية. المسار يركز على الابتكار، التوسع الدولي، وتعزيز التميز التنافسي.',
            priority: 70,
        },
        {
            role: 'OWNER',
            category: 'startup',
            condition: JSON.stringify({ key: 'stage', value: 'startup' }),
            patternKey: 'nascent_cautious',
            reasonAr: 'المرحلة تتطلب بناء أساسات صلبة من البداية. المسار يوفر خارطة طريق للتأسيس المستدام وتفادي أخطاء البدايات.',
            priority: 60,
        }
    ];

    for (const rule of rules) {
        await prisma.journeyRule.create({ data: rule });
    }

    console.log('Seeded 5 Journey Rules.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
