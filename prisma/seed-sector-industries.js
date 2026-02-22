const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * ربط الأنشطة بالقطاعات المناسبة
 * 
 * القطاعات الموجودة:
 * - PVT: القطاع الخاص
 * - GOV: القطاع الحكومي
 * - NPO: القطاع غير الربحي
 */

const sectorIndustryMap = {
    // ===== القطاع الخاص (PVT) =====
    PVT: [
        // تجاري
        'RETAIL', 'WHOLESALE', 'ECOM', 'IMPEXP', 'FRANCHISE',
        // صناعي
        'MANUFACT', 'PETROCHEM', 'MINING', 'FOOD_IND', 'PHARMA', 'AUTO', 'RENEW_E', 'OIL_GAS',
        // خدمي
        'HOSP', 'TOURISM', 'ENTERTAIN', 'F_AND_B', 'LOGISTICS', 'FINANCE', 'INSURANCE',
        'BANKING', 'REALESTATE', 'CONSTRUCT', 'CONSULT', 'LEGAL', 'ACCOUNTING',
        'HR', 'MARKETING', 'PR_MEDIA', 'PVT_EDU', 'TRAINING', 'PVT_HEALTH',
        // تقني
        'TECH', 'SOFTWARE', 'CYBER', 'AI', 'CLOUD', 'TELECOM', 'FINTECH',
        'HEALTHTECH', 'EDTECH', 'IOT', 'DATA',
        // مشترك
        'R_AND_D', 'QUALITY', 'GOV_COMP', 'DIG_TRANS',
        // موجود مسبقاً
        'HEALTH', 'EDU',
    ],

    // ===== القطاع الحكومي (GOV) =====
    GOV: [
        // حكومي مباشر
        'GOV_ADMIN', 'DEFENSE', 'GOV_EDU', 'GOV_HEALTH', 'INFRA', 'MUNICIPAL',
        'JUSTICE', 'SOCIAL', 'ENVIRON', 'CULTURE', 'SPORTS', 'PLANNING',
        'FOREIGN', 'AGRI',
        // شبه حكومي
        'REGULATOR', 'PUB_CORP', 'SWF', 'GOV_RES', 'PORTS',
        // تقني حكومي
        'CYBER', 'AI', 'CLOUD', 'DIG_TRANS', 'DATA', 'TELECOM',
        // مشترك
        'R_AND_D', 'QUALITY', 'GOV_COMP',
        // موجود مسبقاً
        'HEALTH', 'EDU', 'TECH',
    ],

    // ===== القطاع غير الربحي (NPO) =====
    NPO: [
        // غير ربحي تخصصي
        'CHARITY', 'WAQF', 'SOC_ENT', 'ADVOCACY', 'COMMUNITY',
        'WELFARE', 'VOLUNTEER', 'NPO_EDU', 'NPO_HEALTH', 'SUSTAIN', 'RELIEF',
        // يمكن للقطاع غير الربحي العمل في هذه المجالات
        'TRAINING', 'SOCIAL', 'CULTURE',
        // مشترك
        'R_AND_D', 'QUALITY', 'GOV_COMP', 'DIG_TRANS',
        // موجود مسبقاً
        'HEALTH', 'EDU',
    ],
};

async function linkSectorIndustries() {
    console.log('🔗 بدء ربط الأنشطة بالقطاعات...\n');

    // Get all sectors
    const sectors = await prisma.sector.findMany();
    console.log(`📂 القطاعات الموجودة: ${sectors.map(s => s.code).join(', ')}\n`);

    for (const sector of sectors) {
        const industryCodes = sectorIndustryMap[sector.code];
        if (!industryCodes) {
            console.log(`⚠️  لا يوجد ربط محدد للقطاع: ${sector.nameAr} (${sector.code})`);
            continue;
        }

        // Find matching industries
        const industries = await prisma.industry.findMany({
            where: { code: { in: industryCodes } }
        });

        const foundCodes = industries.map(i => i.code);
        const missingCodes = industryCodes.filter(c => !foundCodes.includes(c));

        if (missingCodes.length > 0) {
            console.log(`⚠️  رموز لم تُعثر عليها في ${sector.nameAr}: ${missingCodes.join(', ')}`);
        }

        // Connect industries to sector
        await prisma.sector.update({
            where: { id: sector.id },
            data: {
                industries: {
                    set: industries.map(i => ({ id: i.id }))
                }
            }
        });

        console.log(`✅ ${sector.nameAr} (${sector.code}): ربط ${industries.length} نشاط`);
    }

    // Summary
    console.log('\n📊 ملخص الربط:');
    for (const sector of sectors) {
        const count = await prisma.industry.count({
            where: { sectors: { some: { id: sector.id } } }
        });
        console.log(`   ${sector.nameAr}: ${count} نشاط`);
    }

    console.log('\n✅ تم الربط بنجاح!');
    await prisma.$disconnect();
}

linkSectorIndustries().catch(console.error);
