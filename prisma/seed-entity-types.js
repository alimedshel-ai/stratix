const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * أنواع الكيانات الشاملة
 * تغطي القطاعات الثلاثة (خاص / حكومي / غير ربحي)
 */
const entityTypes = [
    // ===== القطاع الخاص =====
    { nameAr: 'شركة', nameEn: 'Company', code: 'COMP' },
    { nameAr: 'مؤسسة فردية', nameEn: 'Sole Proprietorship', code: 'SOLE_PROP' },
    { nameAr: 'شركة ذات مسؤولية محدودة', nameEn: 'LLC', code: 'LLC' },
    { nameAr: 'شركة مساهمة', nameEn: 'Joint Stock Company', code: 'JSC' },
    { nameAr: 'شركة تضامنية', nameEn: 'General Partnership', code: 'GP' },
    { nameAr: 'شركة توصية بسيطة', nameEn: 'Limited Partnership', code: 'LP' },
    { nameAr: 'شركة قابضة', nameEn: 'Holding Company', code: 'HOLDING' },
    { nameAr: 'مجموعة شركات', nameEn: 'Corporate Group', code: 'GROUP' },
    { nameAr: 'فرع شركة أجنبية', nameEn: 'Foreign Branch', code: 'FOREIGN_BR' },
    { nameAr: 'مكتب استشاري', nameEn: 'Consulting Office', code: 'CONSULT_OFF' },
    { nameAr: 'مكتب هندسي', nameEn: 'Engineering Office', code: 'ENG_OFF' },
    { nameAr: 'مكتب محاماة', nameEn: 'Law Firm', code: 'LAW_FIRM' },
    { nameAr: 'مكتب محاسبة', nameEn: 'Accounting Firm', code: 'ACCT_FIRM' },
    { nameAr: 'مصنع', nameEn: 'Factory', code: 'FACTORY' },
    { nameAr: 'مختبر', nameEn: 'Laboratory', code: 'LAB' },
    { nameAr: 'معهد تدريبي', nameEn: 'Training Institute', code: 'TRAIN_INST' },

    // ===== القطاع الصحي =====
    { nameAr: 'مستشفى', nameEn: 'Hospital', code: 'HOSP' },
    { nameAr: 'مركز طبي', nameEn: 'Medical Center', code: 'MED_CTR' },
    { nameAr: 'مستوصف', nameEn: 'Dispensary', code: 'DISP' },
    { nameAr: 'عيادة', nameEn: 'Clinic', code: 'CLINIC' },
    { nameAr: 'صيدلية', nameEn: 'Pharmacy', code: 'PHARMACY' },
    { nameAr: 'مركز تأهيل', nameEn: 'Rehabilitation Center', code: 'REHAB' },
    { nameAr: 'مركز صحي', nameEn: 'Health Center', code: 'HEALTH_CTR' },

    // ===== القطاع التعليمي =====
    { nameAr: 'جامعة', nameEn: 'University', code: 'UNIV' },
    { nameAr: 'كلية', nameEn: 'College', code: 'COLLEGE' },
    { nameAr: 'مدرسة', nameEn: 'School', code: 'SCHOOL' },
    { nameAr: 'معهد', nameEn: 'Institute', code: 'INST' },
    { nameAr: 'أكاديمية', nameEn: 'Academy', code: 'ACADEMY' },
    { nameAr: 'مركز بحثي', nameEn: 'Research Center', code: 'RES_CTR' },
    { nameAr: 'روضة أطفال', nameEn: 'Kindergarten', code: 'KG' },
    { nameAr: 'حضانة', nameEn: 'Nursery', code: 'NURSERY' },

    // ===== القطاع الحكومي =====
    { nameAr: 'وزارة', nameEn: 'Ministry', code: 'MIN' },
    { nameAr: 'هيئة حكومية', nameEn: 'Government Authority', code: 'GOV_AUTH' },
    { nameAr: 'مؤسسة حكومية', nameEn: 'Government Institution', code: 'GOV_INST' },
    { nameAr: 'إمارة منطقة', nameEn: 'Regional Emirate', code: 'EMIRATE' },
    { nameAr: 'أمانة', nameEn: 'Municipality (Amanah)', code: 'AMANAH' },
    { nameAr: 'بلدية', nameEn: 'Municipality', code: 'MUNICIPALITY' },
    { nameAr: 'مديرية', nameEn: 'Directorate', code: 'DIRECTORATE' },
    { nameAr: 'إدارة عامة', nameEn: 'General Directorate', code: 'GEN_DIR' },
    { nameAr: 'مجلس', nameEn: 'Council', code: 'COUNCIL' },
    { nameAr: 'ديوان', nameEn: 'Bureau (Diwan)', code: 'DIWAN' },
    { nameAr: 'صندوق حكومي', nameEn: 'Government Fund', code: 'GOV_FUND' },
    { nameAr: 'برنامج حكومي', nameEn: 'Government Program', code: 'GOV_PROG' },
    { nameAr: 'مركز حكومي', nameEn: 'Government Center', code: 'GOV_CTR' },
    { nameAr: 'قوة عسكرية', nameEn: 'Military Force', code: 'MILITARY' },
    { nameAr: 'جهاز أمني', nameEn: 'Security Agency', code: 'SECURITY' },

    // ===== القطاع غير الربحي =====
    { nameAr: 'جمعية خيرية', nameEn: 'Charitable Association', code: 'CHARITY_ASSOC' },
    { nameAr: 'جمعية تعاونية', nameEn: 'Cooperative Association', code: 'COOP' },
    { nameAr: 'جمعية مهنية', nameEn: 'Professional Association', code: 'PROF_ASSOC' },
    { nameAr: 'مؤسسة وقفية', nameEn: 'Endowment Foundation', code: 'WAQF_FOUND' },
    { nameAr: 'مؤسسة خيرية', nameEn: 'Charitable Foundation', code: 'CHAR_FOUND' },
    { nameAr: 'منظمة غير حكومية', nameEn: 'NGO', code: 'NGO' },
    { nameAr: 'اتحاد', nameEn: 'Federation', code: 'FED' },
    { nameAr: 'نادي رياضي', nameEn: 'Sports Club', code: 'SPORTS_CLUB' },
    { nameAr: 'نادي اجتماعي', nameEn: 'Social Club', code: 'SOCIAL_CLUB' },
    { nameAr: 'غرفة تجارية', nameEn: 'Chamber of Commerce', code: 'CHAMBER' },
    { nameAr: 'مؤسسة اجتماعية', nameEn: 'Social Enterprise', code: 'SOC_ENT' },

    // ===== أخرى =====
    { nameAr: 'فندق', nameEn: 'Hotel', code: 'HOTEL' },
    { nameAr: 'مطعم', nameEn: 'Restaurant', code: 'RESTAURANT' },
    { nameAr: 'مجمع تجاري', nameEn: 'Shopping Mall', code: 'MALL' },
    { nameAr: 'بنك', nameEn: 'Bank', code: 'BANK' },
    { nameAr: 'شركة تأمين', nameEn: 'Insurance Company', code: 'INSURANCE_CO' },
    { nameAr: 'شركة اتصالات', nameEn: 'Telecom Company', code: 'TELECOM_CO' },
    { nameAr: 'شركة طيران', nameEn: 'Airline', code: 'AIRLINE' },
    { nameAr: 'ميناء', nameEn: 'Port', code: 'PORT' },
    { nameAr: 'مطار', nameEn: 'Airport', code: 'AIRPORT' },
    { nameAr: 'مدينة صناعية', nameEn: 'Industrial City', code: 'IND_CITY' },
    { nameAr: 'منطقة حرة', nameEn: 'Free Zone', code: 'FREE_ZONE' },
    { nameAr: 'حاضنة أعمال', nameEn: 'Business Incubator', code: 'INCUBATOR' },
    { nameAr: 'مسرّعة أعمال', nameEn: 'Business Accelerator', code: 'ACCELERATOR' },
    { nameAr: 'مركز خدمة عملاء', nameEn: 'Customer Service Center', code: 'CS_CENTER' },
];

async function seedEntityTypes() {
    console.log('🏢 بدء تعبئة أنواع الكيانات الشاملة...\n');

    let created = 0;
    let skipped = 0;

    for (const et of entityTypes) {
        try {
            const existing = await prisma.entityType.findFirst({
                where: {
                    OR: [
                        { code: et.code },
                        { nameAr: et.nameAr },
                        { nameEn: et.nameEn }
                    ]
                }
            });

            if (existing) {
                console.log(`⏭️  موجود: ${et.nameAr} (${et.code})`);
                skipped++;
                continue;
            }

            await prisma.entityType.create({ data: et });
            console.log(`✅ أُضيف: ${et.nameAr} — ${et.nameEn} (${et.code})`);
            created++;
        } catch (err) {
            console.error(`❌ خطأ: ${et.nameAr} — ${err.message}`);
        }
    }

    console.log(`\n📊 النتيجة: ${created} أُضيفت | ${skipped} موجودة مسبقاً`);
    console.log(`📦 إجمالي الأنواع في قاعدة البيانات: ${await prisma.entityType.count()}`);

    await prisma.$disconnect();
}

seedEntityTypes().catch(console.error);
