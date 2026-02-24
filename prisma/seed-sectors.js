/**
 * 🏗️ Seed: القطاعات والأنشطة (الصناعات) — بيانات سعودية حقيقية
 * مبني على تصنيف ISIC + هيئة الإحصاء السعودية
 *
 * التشغيل: node prisma/seed-sectors.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SECTORS_DATA = [
    {
        nameAr: 'الصحة',
        nameEn: 'Healthcare',
        code: 'HEALTH',
        industries: [
            { nameAr: 'المستشفيات', nameEn: 'Hospitals', code: 'HOSP' },
            { nameAr: 'العيادات والمراكز الطبية', nameEn: 'Clinics & Medical Centers', code: 'CLINIC' },
            { nameAr: 'الصيدلة والأدوية', nameEn: 'Pharmaceuticals', code: 'PHARMA' },
            { nameAr: 'التأمين الصحي', nameEn: 'Health Insurance', code: 'HEALTH_INS' },
            { nameAr: 'الأجهزة الطبية', nameEn: 'Medical Devices', code: 'MED_DEV' },
        ]
    },
    {
        nameAr: 'التعليم',
        nameEn: 'Education',
        code: 'EDU',
        industries: [
            { nameAr: 'التعليم العام', nameEn: 'General Education', code: 'GEN_EDU' },
            { nameAr: 'التعليم العالي', nameEn: 'Higher Education', code: 'HIGH_EDU' },
            { nameAr: 'التدريب والتطوير المهني', nameEn: 'Training & Development', code: 'TRAINING' },
            { nameAr: 'التعليم الإلكتروني', nameEn: 'E-Learning', code: 'ELEARN' },
        ]
    },
    {
        nameAr: 'التقنية والاتصالات',
        nameEn: 'Technology & Telecom',
        code: 'TECH',
        industries: [
            { nameAr: 'تطوير البرمجيات', nameEn: 'Software Development', code: 'SOFTWARE' },
            { nameAr: 'الاتصالات', nameEn: 'Telecommunications', code: 'TELECOM' },
            { nameAr: 'الأمن السيبراني', nameEn: 'Cybersecurity', code: 'CYBER' },
            { nameAr: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', code: 'AI' },
            { nameAr: 'الحوسبة السحابية', nameEn: 'Cloud Computing', code: 'CLOUD' },
        ]
    },
    {
        nameAr: 'المالية والبنوك',
        nameEn: 'Finance & Banking',
        code: 'FIN',
        industries: [
            { nameAr: 'البنوك التجارية', nameEn: 'Commercial Banks', code: 'COMM_BANK' },
            { nameAr: 'التمويل الإسلامي', nameEn: 'Islamic Finance', code: 'ISLAMIC_FIN' },
            { nameAr: 'التقنية المالية (فنتك)', nameEn: 'FinTech', code: 'FINTECH' },
            { nameAr: 'التأمين', nameEn: 'Insurance', code: 'INSURANCE' },
            { nameAr: 'إدارة الأصول والاستثمار', nameEn: 'Asset Management', code: 'ASSET_MGMT' },
        ]
    },
    {
        nameAr: 'الطاقة',
        nameEn: 'Energy',
        code: 'ENERGY',
        industries: [
            { nameAr: 'النفط والغاز', nameEn: 'Oil & Gas', code: 'OIL_GAS' },
            { nameAr: 'الطاقة المتجددة', nameEn: 'Renewable Energy', code: 'RENEWABLE' },
            { nameAr: 'البتروكيماويات', nameEn: 'Petrochemicals', code: 'PETROCHEM' },
            { nameAr: 'الكهرباء والمياه', nameEn: 'Electricity & Water', code: 'ELEC_WATER' },
        ]
    },
    {
        nameAr: 'العقارات والبناء',
        nameEn: 'Real Estate & Construction',
        code: 'REALESTATE',
        industries: [
            { nameAr: 'التطوير العقاري', nameEn: 'Real Estate Development', code: 'RE_DEV' },
            { nameAr: 'المقاولات والإنشاء', nameEn: 'Construction', code: 'CONSTRUCT' },
            { nameAr: 'إدارة المرافق', nameEn: 'Facility Management', code: 'FACILITY' },
            { nameAr: 'الهندسة المعمارية', nameEn: 'Architecture', code: 'ARCH' },
        ]
    },
    {
        nameAr: 'التجزئة والتجارة',
        nameEn: 'Retail & Commerce',
        code: 'RETAIL',
        industries: [
            { nameAr: 'التجارة الإلكترونية', nameEn: 'E-Commerce', code: 'ECOMM' },
            { nameAr: 'المتاجر والسوبرماركت', nameEn: 'Stores & Supermarkets', code: 'STORES' },
            { nameAr: 'التجارة بالجملة', nameEn: 'Wholesale Trade', code: 'WHOLESALE' },
            { nameAr: 'الامتيازات التجارية', nameEn: 'Franchises', code: 'FRANCHISE' },
        ]
    },
    {
        nameAr: 'الصناعة والتصنيع',
        nameEn: 'Manufacturing & Industry',
        code: 'MANUF',
        industries: [
            { nameAr: 'الصناعات الغذائية', nameEn: 'Food Manufacturing', code: 'FOOD_MFG' },
            { nameAr: 'صناعة المعادن', nameEn: 'Metal Manufacturing', code: 'METAL_MFG' },
            { nameAr: 'الصناعات البلاستيكية', nameEn: 'Plastics Manufacturing', code: 'PLASTIC_MFG' },
            { nameAr: 'صناعة الأثاث', nameEn: 'Furniture Manufacturing', code: 'FURN_MFG' },
        ]
    },
    {
        nameAr: 'السياحة والضيافة',
        nameEn: 'Tourism & Hospitality',
        code: 'TOURISM',
        industries: [
            { nameAr: 'الفنادق والمنتجعات', nameEn: 'Hotels & Resorts', code: 'HOTELS' },
            { nameAr: 'المطاعم والمقاهي', nameEn: 'Restaurants & Cafes', code: 'RESTAURANTS' },
            { nameAr: 'السياحة الدينية (الحج والعمرة)', nameEn: 'Religious Tourism', code: 'HAJJ_UMRAH' },
            { nameAr: 'الترفيه والفعاليات', nameEn: 'Entertainment & Events', code: 'ENTERTAIN' },
        ]
    },
    {
        nameAr: 'النقل والخدمات اللوجستية',
        nameEn: 'Transport & Logistics',
        code: 'TRANSPORT',
        industries: [
            { nameAr: 'الشحن والتوصيل', nameEn: 'Shipping & Delivery', code: 'SHIPPING' },
            { nameAr: 'النقل العام', nameEn: 'Public Transport', code: 'PUB_TRANS' },
            { nameAr: 'الطيران', nameEn: 'Aviation', code: 'AVIATION' },
            { nameAr: 'إدارة سلسلة الإمداد', nameEn: 'Supply Chain', code: 'SUPPLY_CHAIN' },
        ]
    },
    {
        nameAr: 'الزراعة والأغذية',
        nameEn: 'Agriculture & Food',
        code: 'AGRI',
        industries: [
            { nameAr: 'الإنتاج الزراعي', nameEn: 'Agricultural Production', code: 'AGRI_PROD' },
            { nameAr: 'الثروة الحيوانية', nameEn: 'Livestock', code: 'LIVESTOCK' },
            { nameAr: 'الأمن الغذائي', nameEn: 'Food Security', code: 'FOOD_SEC' },
            { nameAr: 'الاستزراع السمكي', nameEn: 'Aquaculture', code: 'AQUA' },
        ]
    },
    {
        nameAr: 'الحكومة والقطاع العام',
        nameEn: 'Government & Public Sector',
        code: 'GOV',
        industries: [
            { nameAr: 'الوزارات والهيئات', nameEn: 'Ministries & Authorities', code: 'MINISTRIES' },
            { nameAr: 'الإمارات والمناطق', nameEn: 'Regional Governance', code: 'REGIONAL' },
            { nameAr: 'البلديات', nameEn: 'Municipalities', code: 'MUNICIPAL' },
            { nameAr: 'صناديق التنمية', nameEn: 'Development Funds', code: 'DEV_FUND' },
        ]
    },
    {
        nameAr: 'الدفاع والأمن',
        nameEn: 'Defense & Security',
        code: 'DEFENSE',
        industries: [
            { nameAr: 'الصناعات العسكرية', nameEn: 'Military Industries', code: 'MIL_IND' },
            { nameAr: 'الأمن الخاص', nameEn: 'Private Security', code: 'PRIV_SEC' },
            { nameAr: 'أنظمة المراقبة', nameEn: 'Surveillance Systems', code: 'SURVEILLANCE' },
        ]
    },
    {
        nameAr: 'الإعلام والترفيه',
        nameEn: 'Media & Entertainment',
        code: 'MEDIA',
        industries: [
            { nameAr: 'الإنتاج المرئي والسينما', nameEn: 'Film & Visual Production', code: 'FILM' },
            { nameAr: 'الإعلام الرقمي', nameEn: 'Digital Media', code: 'DIG_MEDIA' },
            { nameAr: 'النشر والطباعة', nameEn: 'Publishing & Print', code: 'PUBLISH' },
            { nameAr: 'الألعاب الإلكترونية', nameEn: 'Gaming', code: 'GAMING' },
        ]
    },
    {
        nameAr: 'القطاع غير الربحي',
        nameEn: 'Non-Profit Sector',
        code: 'NONPROFIT',
        industries: [
            { nameAr: 'الجمعيات الخيرية', nameEn: 'Charitable Organizations', code: 'CHARITY' },
            { nameAr: 'المؤسسات الوقفية', nameEn: 'Endowments', code: 'WAQF' },
            { nameAr: 'المنظمات التطوعية', nameEn: 'Volunteer Organizations', code: 'VOLUNTEER' },
        ]
    },
    {
        nameAr: 'البيئة والاستدامة',
        nameEn: 'Environment & Sustainability',
        code: 'ENV',
        industries: [
            { nameAr: 'إدارة النفايات', nameEn: 'Waste Management', code: 'WASTE' },
            { nameAr: 'المياه والتحلية', nameEn: 'Water & Desalination', code: 'WATER' },
            { nameAr: 'الاستشارات البيئية', nameEn: 'Environmental Consulting', code: 'ENV_CONSULT' },
        ]
    },
    {
        nameAr: 'الرياضة',
        nameEn: 'Sports',
        code: 'SPORTS',
        industries: [
            { nameAr: 'الأندية الرياضية', nameEn: 'Sports Clubs', code: 'SPORT_CLUBS' },
            { nameAr: 'اللياقة البدنية', nameEn: 'Fitness & Wellness', code: 'FITNESS' },
            { nameAr: 'إدارة الفعاليات الرياضية', nameEn: 'Sports Event Management', code: 'SPORT_EVENT' },
        ]
    },
    {
        nameAr: 'الخدمات المهنية والاستشارية',
        nameEn: 'Professional Services',
        code: 'PROF_SERV',
        industries: [
            { nameAr: 'الاستشارات الإدارية', nameEn: 'Management Consulting', code: 'MGMT_CONSULT' },
            { nameAr: 'المحاماة والخدمات القانونية', nameEn: 'Legal Services', code: 'LEGAL' },
            { nameAr: 'المحاسبة والمراجعة', nameEn: 'Accounting & Auditing', code: 'ACCOUNTING' },
            { nameAr: 'الموارد البشرية', nameEn: 'Human Resources', code: 'HR_SERV' },
        ]
    },
    {
        nameAr: 'التعدين',
        nameEn: 'Mining',
        code: 'MINING',
        industries: [
            { nameAr: 'استخراج المعادن', nameEn: 'Metal Mining', code: 'METAL_MINE' },
            { nameAr: 'المحاجر ومواد البناء', nameEn: 'Quarrying & Building Materials', code: 'QUARRY' },
            { nameAr: 'معالجة المعادن', nameEn: 'Metal Processing', code: 'METAL_PROC' },
        ]
    },
    {
        nameAr: 'التجارة الخارجية والاستيراد',
        nameEn: 'Foreign Trade & Import',
        code: 'TRADE',
        industries: [
            { nameAr: 'الاستيراد والتصدير', nameEn: 'Import & Export', code: 'IMP_EXP' },
            { nameAr: 'التخليص الجمركي', nameEn: 'Customs Clearance', code: 'CUSTOMS' },
            { nameAr: 'المناطق الحرة', nameEn: 'Free Zones', code: 'FREE_ZONES' },
        ]
    },
];

async function seed() {
    console.log('🌱 بدء إضافة القطاعات والأنشطة...\n');

    let sectorsCreated = 0;
    let industriesCreated = 0;
    let skippedSectors = 0;
    let skippedIndustries = 0;

    for (const sectorData of SECTORS_DATA) {
        // Check if sector exists
        const existing = await prisma.sector.findFirst({
            where: { OR: [{ code: sectorData.code }, { nameAr: sectorData.nameAr }] }
        });

        let sector;
        if (existing) {
            sector = existing;
            skippedSectors++;
            console.log(`  ⏭️  القطاع موجود: ${sectorData.nameAr}`);
        } else {
            sector = await prisma.sector.create({
                data: {
                    nameAr: sectorData.nameAr,
                    nameEn: sectorData.nameEn,
                    code: sectorData.code,
                }
            });
            sectorsCreated++;
            console.log(`  ✅ قطاع جديد: ${sectorData.nameAr} (${sectorData.code})`);
        }

        // Add industries for this sector
        for (const indData of sectorData.industries) {
            const existingInd = await prisma.industry.findFirst({
                where: { OR: [{ code: indData.code }, { nameAr: indData.nameAr }] }
            });

            let industry;
            if (existingInd) {
                industry = existingInd;
                skippedIndustries++;
            } else {
                industry = await prisma.industry.create({
                    data: {
                        nameAr: indData.nameAr,
                        nameEn: indData.nameEn,
                        code: indData.code,
                    }
                });
                industriesCreated++;
                console.log(`     📂 نشاط: ${indData.nameAr}`);
            }

            // Connect industry to sector (many-to-many)
            try {
                await prisma.sector.update({
                    where: { id: sector.id },
                    data: {
                        industries: { connect: { id: industry.id } }
                    }
                });
            } catch (e) {
                // Already connected, ignore
            }
        }
    }

    console.log('\n' + '═'.repeat(50));
    console.log(`✅ القطاعات: ${sectorsCreated} جديد + ${skippedSectors} موجود`);
    console.log(`✅ الأنشطة:  ${industriesCreated} جديد + ${skippedIndustries} موجود`);
    console.log('═'.repeat(50));

    // Final counts
    const totalSectors = await prisma.sector.count();
    const totalIndustries = await prisma.industry.count();
    console.log(`\n📊 الإجمالي: ${totalSectors} قطاع | ${totalIndustries} نشاط`);
}

seed()
    .catch(e => {
        console.error('❌ خطأ:', e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
