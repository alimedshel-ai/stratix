const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * الأنشطة المثالية الشاملة لجميع أنواع القطاعات:
 * - القطاع الخاص (التجاري، الصناعي، الخدمي، التقني)
 * - القطاع العام (الحكومي، شبه الحكومي)
 * - القطاع غير الربحي
 * - القطاع الربحي
 */

const industries = [
    // ===== القطاع الخاص — التجاري =====
    { nameAr: 'التجزئة', nameEn: 'Retail', code: 'RETAIL' },
    { nameAr: 'الجملة والتوزيع', nameEn: 'Wholesale & Distribution', code: 'WHOLESALE' },
    { nameAr: 'التجارة الإلكترونية', nameEn: 'E-Commerce', code: 'ECOM' },
    { nameAr: 'الاستيراد والتصدير', nameEn: 'Import & Export', code: 'IMPEXP' },
    { nameAr: 'الامتيازات التجارية', nameEn: 'Franchising', code: 'FRANCHISE' },

    // ===== القطاع الخاص — الصناعي =====
    { nameAr: 'التصنيع', nameEn: 'Manufacturing', code: 'MANUFACT' },
    { nameAr: 'البتروكيماويات', nameEn: 'Petrochemicals', code: 'PETROCHEM' },
    { nameAr: 'التعدين والمعادن', nameEn: 'Mining & Metals', code: 'MINING' },
    { nameAr: 'الصناعات الغذائية', nameEn: 'Food Industry', code: 'FOOD_IND' },
    { nameAr: 'الصناعات الدوائية', nameEn: 'Pharmaceuticals', code: 'PHARMA' },
    { nameAr: 'صناعة المركبات', nameEn: 'Automotive Industry', code: 'AUTO' },
    { nameAr: 'الطاقة المتجددة', nameEn: 'Renewable Energy', code: 'RENEW_E' },
    { nameAr: 'النفط والغاز', nameEn: 'Oil & Gas', code: 'OIL_GAS' },

    // ===== القطاع الخاص — الخدمي =====
    { nameAr: 'الضيافة والفندقة', nameEn: 'Hospitality & Hotels', code: 'HOSP' },
    { nameAr: 'السياحة والسفر', nameEn: 'Tourism & Travel', code: 'TOURISM' },
    { nameAr: 'الترفيه والفعاليات', nameEn: 'Entertainment & Events', code: 'ENTERTAIN' },
    { nameAr: 'المطاعم والأغذية', nameEn: 'Food & Beverage', code: 'F_AND_B' },
    { nameAr: 'النقل والخدمات اللوجستية', nameEn: 'Transport & Logistics', code: 'LOGISTICS' },
    { nameAr: 'الخدمات المالية', nameEn: 'Financial Services', code: 'FINANCE' },
    { nameAr: 'التأمين', nameEn: 'Insurance', code: 'INSURANCE' },
    { nameAr: 'البنوك والمصارف', nameEn: 'Banking', code: 'BANKING' },
    { nameAr: 'العقارات والتطوير العقاري', nameEn: 'Real Estate & Development', code: 'REALESTATE' },
    { nameAr: 'المقاولات والبناء', nameEn: 'Construction & Contracting', code: 'CONSTRUCT' },
    { nameAr: 'الاستشارات الإدارية', nameEn: 'Management Consulting', code: 'CONSULT' },
    { nameAr: 'الخدمات القانونية', nameEn: 'Legal Services', code: 'LEGAL' },
    { nameAr: 'المحاسبة والتدقيق', nameEn: 'Accounting & Auditing', code: 'ACCOUNTING' },
    { nameAr: 'الموارد البشرية والتوظيف', nameEn: 'HR & Recruitment', code: 'HR' },
    { nameAr: 'التسويق والإعلان', nameEn: 'Marketing & Advertising', code: 'MARKETING' },
    { nameAr: 'العلاقات العامة والإعلام', nameEn: 'Public Relations & Media', code: 'PR_MEDIA' },
    { nameAr: 'التعليم الخاص', nameEn: 'Private Education', code: 'PVT_EDU' },
    { nameAr: 'التدريب والتطوير', nameEn: 'Training & Development', code: 'TRAINING' },
    { nameAr: 'الرعاية الصحية الخاصة', nameEn: 'Private Healthcare', code: 'PVT_HEALTH' },

    // ===== القطاع الخاص — التقني =====
    // (TECH موجود مسبقاً)
    { nameAr: 'تطوير البرمجيات', nameEn: 'Software Development', code: 'SOFTWARE' },
    { nameAr: 'الأمن السيبراني', nameEn: 'Cybersecurity', code: 'CYBER' },
    { nameAr: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', code: 'AI' },
    { nameAr: 'الحوسبة السحابية', nameEn: 'Cloud Computing', code: 'CLOUD' },
    { nameAr: 'الاتصالات', nameEn: 'Telecommunications', code: 'TELECOM' },
    { nameAr: 'التقنية المالية (فينتك)', nameEn: 'FinTech', code: 'FINTECH' },
    { nameAr: 'التقنية الصحية', nameEn: 'HealthTech', code: 'HEALTHTECH' },
    { nameAr: 'التقنية التعليمية', nameEn: 'EdTech', code: 'EDTECH' },
    { nameAr: 'إنترنت الأشياء', nameEn: 'Internet of Things (IoT)', code: 'IOT' },
    { nameAr: 'البيانات والتحليلات', nameEn: 'Data & Analytics', code: 'DATA' },

    // ===== القطاع العام — الحكومي =====
    { nameAr: 'الإدارة العامة والحوكمة', nameEn: 'Public Administration & Governance', code: 'GOV_ADMIN' },
    { nameAr: 'الدفاع والأمن', nameEn: 'Defense & Security', code: 'DEFENSE' },
    { nameAr: 'التعليم الحكومي', nameEn: 'Public Education', code: 'GOV_EDU' },
    { nameAr: 'الصحة العامة', nameEn: 'Public Health', code: 'GOV_HEALTH' },
    { nameAr: 'البنية التحتية', nameEn: 'Infrastructure', code: 'INFRA' },
    { nameAr: 'الخدمات البلدية', nameEn: 'Municipal Services', code: 'MUNICIPAL' },
    { nameAr: 'العدل والقضاء', nameEn: 'Justice & Judiciary', code: 'JUSTICE' },
    { nameAr: 'الشؤون الاجتماعية', nameEn: 'Social Affairs', code: 'SOCIAL' },
    { nameAr: 'البيئة والمياه', nameEn: 'Environment & Water', code: 'ENVIRON' },
    { nameAr: 'الثقافة والتراث', nameEn: 'Culture & Heritage', code: 'CULTURE' },
    { nameAr: 'الرياضة والشباب', nameEn: 'Sports & Youth', code: 'SPORTS' },
    { nameAr: 'التخطيط والتنمية', nameEn: 'Planning & Development', code: 'PLANNING' },
    { nameAr: 'الشؤون الخارجية والدبلوماسية', nameEn: 'Foreign Affairs & Diplomacy', code: 'FOREIGN' },
    { nameAr: 'الزراعة والأمن الغذائي', nameEn: 'Agriculture & Food Security', code: 'AGRI' },

    // ===== القطاع العام — شبه الحكومي =====
    { nameAr: 'الهيئات التنظيمية', nameEn: 'Regulatory Authorities', code: 'REGULATOR' },
    { nameAr: 'المؤسسات العامة', nameEn: 'Public Corporations', code: 'PUB_CORP' },
    { nameAr: 'صناديق الاستثمار السيادية', nameEn: 'Sovereign Wealth Funds', code: 'SWF' },
    { nameAr: 'المراكز البحثية الحكومية', nameEn: 'Government Research Centers', code: 'GOV_RES' },
    { nameAr: 'الموانئ والمطارات', nameEn: 'Ports & Airports', code: 'PORTS' },

    // ===== القطاع غير الربحي =====
    { nameAr: 'الجمعيات الخيرية', nameEn: 'Charitable Organizations', code: 'CHARITY' },
    { nameAr: 'الأوقاف', nameEn: 'Endowments (Awqaf)', code: 'WAQF' },
    { nameAr: 'المؤسسات الاجتماعية', nameEn: 'Social Enterprises', code: 'SOC_ENT' },
    { nameAr: 'حقوق الإنسان والمناصرة', nameEn: 'Human Rights & Advocacy', code: 'ADVOCACY' },
    { nameAr: 'التنمية المجتمعية', nameEn: 'Community Development', code: 'COMMUNITY' },
    { nameAr: 'رعاية الأيتام والمحتاجين', nameEn: 'Orphan & Welfare Care', code: 'WELFARE' },
    { nameAr: 'العمل التطوعي', nameEn: 'Volunteering', code: 'VOLUNTEER' },
    { nameAr: 'التعليم غير الربحي', nameEn: 'Non-Profit Education', code: 'NPO_EDU' },
    { nameAr: 'الصحة غير الربحية', nameEn: 'Non-Profit Healthcare', code: 'NPO_HEALTH' },
    { nameAr: 'البيئة والاستدامة', nameEn: 'Environment & Sustainability', code: 'SUSTAIN' },
    { nameAr: 'الإغاثة والطوارئ', nameEn: 'Relief & Emergency', code: 'RELIEF' },

    // ===== أنشطة عامة مشتركة =====
    { nameAr: 'البحث والتطوير', nameEn: 'Research & Development', code: 'R_AND_D' },
    { nameAr: 'الجودة والتميز المؤسسي', nameEn: 'Quality & Excellence', code: 'QUALITY' },
    { nameAr: 'الحوكمة والامتثال', nameEn: 'Governance & Compliance', code: 'GOV_COMP' },
    { nameAr: 'التحول الرقمي', nameEn: 'Digital Transformation', code: 'DIG_TRANS' },
];

async function seedIndustries() {
    console.log('🚀 بدء تعبئة الأنشطة الشاملة...\n');

    let created = 0;
    let skipped = 0;

    for (const ind of industries) {
        try {
            // Check if exists by code or nameAr
            const existing = await prisma.industry.findFirst({
                where: {
                    OR: [
                        { code: ind.code },
                        { nameAr: ind.nameAr },
                        { nameEn: ind.nameEn }
                    ]
                }
            });

            if (existing) {
                console.log(`⏭️  موجود: ${ind.nameAr} (${ind.code})`);
                skipped++;
                continue;
            }

            await prisma.industry.create({ data: ind });
            console.log(`✅ أُضيف: ${ind.nameAr} — ${ind.nameEn} (${ind.code})`);
            created++;
        } catch (err) {
            console.error(`❌ خطأ: ${ind.nameAr} — ${err.message}`);
        }
    }

    console.log(`\n📊 النتيجة: ${created} أُضيفت | ${skipped} موجودة مسبقاً`);
    console.log(`📦 إجمالي الأنشطة في قاعدة البيانات: ${await prisma.industry.count()}`);

    await prisma.$disconnect();
}

seedIndustries().catch(console.error);
