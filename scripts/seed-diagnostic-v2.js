const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding Initial Diagnostic V2 Questions (Level 1: Screening)...');

    // 1. Role Question
    await prisma.diagQuestion.upsert({
        where: { questionKey: 'q_user_role' },
        update: {},
        create: {
            questionKey: 'q_user_role',
            questionText: 'ما هو دورك في المنشأة؟',
            questionTextEn: 'What is your role in the organization?',
            level: 'SCREENING',
            category: 'ADMIN',
            type: 'SINGLE_CHOICE',
            orderIndex: 1,
            options: JSON.stringify([
                { value: 'OWNER', label: 'مالك / مؤسس', score: 10, weight: 1.0 },
                { value: 'MANAGER', label: 'مدير تنفيذي / إداري', score: 8, weight: 1.0 },
                { value: 'INVESTOR', label: 'مستثمر', score: 5, weight: 1.0 }
            ])
        }
    });

    // 2. Stage Question
    await prisma.diagQuestion.upsert({
        where: { questionKey: 'q_business_stage' },
        update: {},
        create: {
            questionKey: 'q_business_stage',
            questionText: 'في أي مرحلة تمر منشأتك حالياً؟',
            questionTextEn: 'What stage is your business currently in?',
            level: 'SCREENING',
            category: 'STRATEGY',
            type: 'SINGLE_CHOICE',
            orderIndex: 2,
            options: JSON.stringify([
                { value: 'STARTUP', label: 'ناشئة (0-2 سنة)', score: 6, weight: 1.5 },
                { value: 'GROWTH', label: 'صاعدة / نمو (2-5 سنوات)', score: 9, weight: 1.5 },
                { value: 'MID', label: 'متوسطة / استقرار (5-10 سنوات)', score: 10, weight: 1.5 },
                { value: 'MATURE', label: 'ناضجة (10+ سنة)', score: 10, weight: 1.5 },
                { value: 'TURNAROUND', label: 'إعادة هيكلة / تعثر', score: 4, weight: 2.0 }
            ])
        }
    });

    // 3. Sector Question
    await prisma.diagQuestion.upsert({
        where: { questionKey: 'q_business_sector' },
        update: {},
        create: {
            questionKey: 'q_business_sector',
            questionText: 'ما هو القطاع الذي تعمل فيه؟',
            questionTextEn: 'In which sector do you operate?',
            level: 'SCREENING',
            category: 'MARKET',
            type: 'SINGLE_CHOICE',
            orderIndex: 3,
            options: JSON.stringify([
                { value: 'TECH_SAAS', label: 'تقني (SaaS)', score: 10, weight: 1.0 },
                { value: 'RETAIL', label: 'تجزئة / تجارة', score: 9, weight: 1.2 },
                { value: 'MANUFACTURING', label: 'صناعة / إنتاج', score: 8, weight: 1.5 },
                { value: 'HOSPITALITY', label: 'سياحة / مطاعم', score: 7, weight: 1.5 },
                { value: 'PROFESSIONAL_SERVICES', label: 'خدمات مهنية / استشارات', score: 9, weight: 1.0 }
            ])
        }
    });

    console.log('✅ Level 1 Questions Seeding Completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
