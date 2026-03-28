const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// =========================================
// خريطة الأنماط
// =========================================
const PATTERNS = {
    'growth-stopped+rapid-growth': 'ناشئة متعثرة',
    'growth-stopped+stability': 'ناشئة حذرة',
    'team-chaos+system-run': 'نامية فوضوية',
    'team-chaos+differentiation': 'نامية طموحة',
    'cash-burn+stability': 'متعثرة مالية',
    'no-direction+differentiation': 'ناشئة ضائعة',
    'competition+differentiation': 'نامية تنافسية',
    'burnout+system-run': 'ناضجة مرهقة',
};

// بيانات المبادرات التلقائية لكل نمط
const AUTO_INITIATIVES = {
    'ناشئة متعثرة': {
        title: 'إنقاذ السيولة Q3',
        description: 'مبادرة عاجلة لتحسين التدفق النقدي وإعادة هيكلة الإيرادات',
        category: 'financial_rescue',
        durationDays: 90,
        budgetMultiplier: 3,
        priority: 'HIGH',
        tasks: [
            { title: 'تحليل مصادر الإيرادات الحالية', days: 3, order: 1 },
            { title: 'إيقاف المصاريف غير الضرورية', days: 7, order: 2 },
            { title: 'إطلاق حملة تحصيل مستحقات', days: 14, order: 3 },
            { title: 'إعادة تسعير المنتجات والخدمات', days: 21, order: 4 },
            { title: 'إطلاق منتج/خدمة سريعة الإيراد', days: 30, order: 5 },
        ],
        kpis: [
            { name: 'التدفق النقدي الشهري', targetMultiplier: 0.5, unit: 'ريال' },
            { name: 'نسبة المصاريف للإيرادات', target: 70, unit: '%' },
            { name: 'عملاء جدد طارئون', target: 10, unit: 'عميل' },
        ],
    },
    'ناشئة حذرة': {
        title: 'بناء الأساس المستدام',
        description: 'مبادرة لبناء نموذج عمل مستقر قبل التوسع',
        category: 'foundation',
        durationDays: 90,
        budgetMultiplier: 3,
        priority: 'HIGH',
        tasks: [
            { title: 'توثيق نموذج العمل الحالي', days: 7, order: 1 },
            { title: 'تحليل العملاء الأكثر ربحية', days: 14, order: 2 },
            { title: 'ضبط التكاليف التشغيلية', days: 21, order: 3 },
            { title: 'بناء خط مبيعات منظم', days: 30, order: 4 },
            { title: 'قياس صافي ربح كل منتج/خدمة', days: 45, order: 5 },
        ],
        kpis: [
            { name: 'هامش الربح الصافي', target: 20, unit: '%' },
            { name: 'معدل الاحتفاظ بالعملاء', target: 80, unit: '%' },
            { name: 'تكلفة اكتساب عميل', targetMultiplier: 0.1, unit: 'ريال' },
        ],
    },
    'نامية فوضوية': {
        title: 'هيكلة وتنظيم Q3',
        description: 'بناء نظام إداري محكم يعمل بدون تدخل يومي',
        category: 'organization',
        durationDays: 90,
        budgetMultiplier: 3,
        priority: 'HIGH',
        tasks: [
            { title: 'تقييم الإدارات (البيئة الداخلية)', days: 7, order: 1 },
            { title: 'توثيق العمليات الرئيسية', days: 14, order: 2 },
            { title: 'اختيار وتطبيق أدوات الأتمتة', days: 21, order: 3 },
            { title: 'تدريب الفريق على النظام الجديد', days: 30, order: 4 },
            { title: 'تفويض صلاحيات واضحة', days: 45, order: 5 },
        ],
        kpis: [
            { name: 'ساعات العمل اليدوي', target: 20, unit: 'ساعة/أسبوع' },
            { name: 'رضا الموظفين', target: 7, unit: '/10' },
            { name: 'معدل أخطاء العمليات', target: 2, unit: '%' },
        ],
    },
    'نامية طموحة': {
        title: 'التميز التنافسي Q3',
        description: 'مبادرة لبناء ميزة تنافسية واضحة في السوق',
        category: 'differentiation',
        durationDays: 90,
        budgetMultiplier: 3,
        priority: 'HIGH',
        tasks: [
            { title: 'تحليل المنافسين الرئيسيين', days: 7, order: 1 },
            { title: 'تحديد نقاط التميز الفريدة', days: 14, order: 2 },
            { title: 'تطوير عرض القيمة المميز', days: 21, order: 3 },
            { title: 'إطلاق حملة تموضع في السوق', days: 30, order: 4 },
            { title: 'قياس حصة السوق وصوت العلامة', days: 60, order: 5 },
        ],
        kpis: [
            { name: 'حصة السوق', target: 15, unit: '%' },
            { name: 'معدل إحالة العملاء (NPS)', target: 50, unit: 'نقطة' },
            { name: 'معدل نمو الإيرادات', target: 30, unit: '%/ربع' },
        ],
    },
    'متعثرة مالية': {
        title: 'مسار الربحية',
        description: 'التركيز على الإيرادات عالية الهامش وخفض التكاليف',
        category: 'profitability',
        durationDays: 90,
        budgetMultiplier: 2,
        priority: 'HIGH',
        tasks: [
            { title: 'تحليل ربحية كل منتج/خدمة', days: 5, order: 1 },
            { title: 'إيقاف المنتجات غير المربحة', days: 14, order: 2 },
            { title: 'رفع الأسعار على العملاء المميزين', days: 21, order: 3 },
            { title: 'تخفيض تكاليف التشغيل ٢٠٪', days: 30, order: 4 },
            { title: 'بناء باقات ذات هامش عالٍ', days: 45, order: 5 },
        ],
        kpis: [
            { name: 'هامش الإسهام', target: 40, unit: '%' },
            { name: 'خفض التكاليف', target: 20, unit: '%' },
            { name: 'إيرادات المنتجات المربحة', targetMultiplier: 0.6, unit: 'ريال' },
        ],
    },
};

// fallback للأنماط غير المعرّفة
const DEFAULT_INITIATIVE = {
    title: 'مبادرة التطوير الاستراتيجي',
    description: 'خطة تطوير شاملة مبنية على تشخيص وضع الشركة',
    category: 'strategic_development',
    durationDays: 90,
    budgetMultiplier: 3,
    priority: 'MEDIUM',
    tasks: [
        { title: 'تشخيص الوضع الحالي (SWOT)', days: 7, order: 1 },
        { title: 'تحديد الأولويات الاستراتيجية', days: 14, order: 2 },
        { title: 'وضع خطة تنفيذ مع مؤشرات', days: 21, order: 3 },
        { title: 'تشكيل فريق التنفيذ', days: 28, order: 4 },
        { title: 'أول مراجعة دورية', days: 45, order: 5 },
    ],
    kpis: [
        { name: 'نسبة تنفيذ الخطة', target: 80, unit: '%' },
        { name: 'مؤشرات أداء مفعّلة', target: 5, unit: 'KPI' },
        { name: 'رضا الفريق', target: 7, unit: '/10' },
    ],
};

// =========================================
// POST /api/company-pattern — حفظ النمط + إنشاء مبادرة تلقائية
// =========================================
router.post('/', async (req, res) => {
    try {
        const { pain, ambition, budget, companyId } = req.body;
        const userId = req.user?.id;

        if (!pain || !ambition || !companyId) {
            return res.status(400).json({ success: false, message: 'pain و ambition و companyId مطلوبة' });
        }

        const key = `${pain}+${ambition}`;
        const patternLabel = PATTERNS[key] || 'نمط عام';
        const finalBudget = budget || 20000;

        // 1. حفظ/تحديث نمط الشركة في جدول الأنماط
        const companyPattern = await prisma.companyPattern.upsert({
            where: { companyId },
            update: { pain, ambition, budget: finalBudget, pattern: patternLabel },
            create: { companyId, pain, ambition, budget: finalBudget, pattern: patternLabel },
        });

        // 🔥 تحديث الـ Entity Metadata لمزامنة "المستشار الذكي"
        const painAmbitionPayload = {
            pain,
            ambition,
            patternKey: key,
            patternLabel,
            budget: finalBudget,
            updatedAt: new Date().toISOString()
        };

        const entity = await prisma.entity.findFirst({
            where: { companyId, isActive: true },
            select: { id: true, metadata: true }
        });

        if (entity) {
            let metadata = {};
            try {
                if (entity.metadata) {
                    metadata = (typeof entity.metadata === 'string') ? JSON.parse(entity.metadata) : entity.metadata;
                }
            } catch (e) {
                console.error('[Sync] Metadata parse error:', e);
            }

            await prisma.entity.update({
                where: { id: entity.id },
                data: {
                    metadata: JSON.stringify({
                        ...metadata,
                        painAmbition: painAmbitionPayload
                    })
                }
            });
            console.log(`[Sync] Updated AI Advisor metadata for entity ${entity.id}`);
        }

        // 2. إنشاء مبادرة تلقائية (إذا وُجدت نسخة استراتيجية نشطة)
        let initiative = null;
        try {
            const activeEntity = await prisma.entity.findFirst({
                where: { companyId, isActive: true },
                include: {
                    strategyVersions: {
                        where: { isActive: true },
                        take: 1,
                    },
                },
            });

            const version = activeEntity?.strategyVersions?.[0];

            if (version) {
                const initiativeTemplate = AUTO_INITIATIVES[patternLabel] || DEFAULT_INITIATIVE;
                const initBudget = Math.round(finalBudget * initiativeTemplate.budgetMultiplier);
                const now = new Date();
                const endDate = new Date(now.getTime() + initiativeTemplate.durationDays * 86400000);

                initiative = await prisma.strategicInitiative.create({
                    data: {
                        versionId: version.id,
                        title: initiativeTemplate.title,
                        description: initiativeTemplate.description,
                        category: initiativeTemplate.category,
                        status: 'PLANNED',
                        priority: initiativeTemplate.priority,
                        budget: initBudget,
                        budgetSpent: 0,
                        autoCreated: true,
                        startDate: now,
                        endDate,
                        progress: 0,
                        owner: userId || null,

                        tasks: {
                            create: initiativeTemplate.tasks.map(t => ({
                                title: t.title,
                                status: 'PENDING',
                                dueDate: new Date(now.getTime() + t.days * 86400000),
                                order: t.order,
                            })),
                        },

                        kpis: {
                            create: initiativeTemplate.kpis.map(k => ({
                                name: k.name,
                                target: k.targetMultiplier ? Math.round(finalBudget * k.targetMultiplier) : k.target,
                                current: 0,
                                unit: k.unit || '',
                            })),
                        },
                    },
                    include: {
                        tasks: { orderBy: { order: 'asc' } },
                        kpis: true,
                    },
                });
            }
        } catch (initErr) {
            console.warn('Auto-initiative creation skipped:', initErr.message);
        }

        res.json({
            success: true,
            pattern: patternLabel,
            data: companyPattern,
            initiative: initiative ? {
                id: initiative.id,
                title: initiative.title,
                budget: initiative.budget,
                tasksCount: initiative.tasks.length,
                kpisCount: initiative.kpis.length,
            } : null,
        });
    } catch (error) {
        console.error('Error saving pattern:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =========================================
// GET /api/company-pattern?companyId=xxx — جلب النمط والتوصيات
// =========================================
router.get('/', async (req, res) => {
    try {
        const { companyId } = req.query;

        if (!companyId) {
            return res.status(400).json({ success: false, message: 'companyId مطلوب' });
        }

        const pattern = await prisma.companyPattern.findUnique({ where: { companyId } });

        if (!pattern) {
            return res.status(404).json({ success: false, message: 'لم يتم تحديد النمط بعد' });
        }

        const recommendations = getRecommendations(pattern.pattern);
        const growthPlan = generateGrowthPlan(pattern.pain, pattern.ambition, pattern.budget);

        res.json({
            success: true,
            pattern: pattern.pattern,
            pain: pattern.pain,
            ambition: pattern.ambition,
            budget: pattern.budget,
            ...recommendations,
            growthPlan,
        });
    } catch (error) {
        console.error('Error fetching pattern:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =========================================
// GET /api/company-pattern/initiative/:id — تفاصيل المبادرة
// =========================================
router.get('/initiative/:id', async (req, res) => {
    try {
        const initiative = await prisma.strategicInitiative.findUnique({
            where: { id: req.params.id },
            include: {
                tasks: { orderBy: { order: 'asc' } },
                kpis: true,
                version: {
                    include: {
                        entity: { select: { id: true, displayName: true, legalName: true } },
                    },
                },
            },
        });

        if (!initiative) {
            return res.status(404).json({ success: false, message: 'المبادرة غير موجودة' });
        }

        res.json({ success: true, data: initiative });
    } catch (error) {
        console.error('Error fetching initiative:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =========================================
// GET /api/company-pattern/recommendations/:companyId — توصيات الأدوات الذكية
// =========================================
router.get('/recommendations/:companyId', async (req, res) => {
    try {
        const cp = await prisma.companyPattern.findUnique({
            where: { companyId: req.params.companyId },
        });

        if (!cp) {
            return res.json({
                success: true,
                pattern: null,
                recommendations: getRecommendations('نمط عام'),
            });
        }

        const recommendations = getRecommendations(cp.pattern);

        res.json({
            success: true,
            pattern: cp.pattern,
            pain: cp.pain,
            ambition: cp.ambition,
            recommendations,
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =========================================
// دوال المساعدة
// =========================================
function getRecommendations(pattern) {
    const map = {
        // ===== 1. ناشئة متعثرة (growth-stopped + rapid-growth) =====
        'ناشئة متعثرة': {
            focus: 'إنقاذ مالي عاجل',
            priorityTools: [
                { code: 'SWOT', name: 'تحليل SWOT', reason: 'فهم الأزمة الحالية', priority: 'عالي' },
                { code: 'BUSINESS_MODEL', name: 'نموذج العمل', reason: 'إعادة هيكلة الإيرادات', priority: 'عالي' },
                { code: 'PARETO', name: 'تحليل باريتو', reason: 'التركيز على 20% تؤثر على 80% من النتائج', priority: 'متوسط' },
            ],
            lockedTools: [
                { code: 'THREE_HORIZONS', name: 'الآفاق الثلاثة', reason: 'التركيز على الحاضر أولاً' },
                { code: 'SCENARIO', name: 'تخطيط السيناريوهات', reason: 'ليس أولوية في الأزمة' },
            ],
            nextStep: 'أكمل SWOT خلال ٢٤ ساعة ثم أعد هيكلة نموذج العمل',
        },

        // ===== 2. ناشئة حذرة (growth-stopped + stability) =====
        'ناشئة حذرة': {
            focus: 'بناء أساس متين',
            priorityTools: [
                { code: 'SWOT', name: 'تحليل SWOT', reason: 'فهم الوضع الحالي بوضوح', priority: 'عالي' },
                { code: 'INTERNAL_ENV', name: 'البيئة الداخلية', reason: 'تقييم جاهزية الإدارات', priority: 'عالي' },
                { code: 'BSC', name: 'بطاقة الأداء المتوازن', reason: 'بناء نظام أهداف ومؤشرات متوازن', priority: 'متوسط' },
            ],
            lockedTools: [
                { code: 'BLUE_OCEAN', name: 'المحيط الأزرق', reason: 'الاستقرار أولاً قبل الابتكار' },
                { code: 'ANSOFF', name: 'مصفوفة أنسوف', reason: 'ليس وقت التوسع بعد' },
            ],
            nextStep: 'أكمل SWOT + البيئة الداخلية ثم حدد 5 KPIs أساسية',
        },

        // ===== 3. نامية فوضوية (team-chaos + system-run) =====
        'نامية فوضوية': {
            focus: 'هيكلة وتنظيم',
            priorityTools: [
                { code: 'INTERNAL_ENV', name: 'البيئة الداخلية', reason: 'تقييم الفوضى التنظيمية', priority: 'عالي' },
                { code: 'VALUE_CHAIN', name: 'سلسلة القيمة', reason: 'تحديد أين الهدر وأين القيمة', priority: 'عالي' },
                { code: 'SEVEN_S', name: 'نموذج 7S', reason: 'فحص التوافق بين الهيكل والأنظمة والكوادر', priority: 'متوسط' },
            ],
            lockedTools: [
                { code: 'BENCHMARKING', name: 'المقارنة المعيارية', reason: 'رتّب بيتك أولاً قبل ما تقارن' },
            ],
            nextStep: 'حلل البيئة الداخلية + سلسلة القيمة لتعرف أين الخلل',
        },

        // ===== 4. نامية طموحة (team-chaos + differentiation) =====
        'نامية طموحة': {
            focus: 'التميز التنافسي',
            priorityTools: [
                { code: 'PORTER', name: 'قوى بورتر الخمس', reason: 'فهم ديناميكيات المنافسة', priority: 'عالي' },
                { code: 'CORE_COMPETENCY', name: 'القدرات الجوهرية', reason: 'تحديد ما يميزك حقاً', priority: 'عالي' },
                { code: 'ANSOFF', name: 'مصفوفة أنسوف', reason: 'تحديد مسار النمو الأمثل', priority: 'متوسط' },
                { code: 'BLUE_OCEAN', name: 'المحيط الأزرق', reason: 'خلق مساحة سوقية بلا منافسة', priority: 'متوسط' },
            ],
            lockedTools: [
                { code: 'PARETO', name: 'تحليل باريتو', reason: 'ركّز على النمو أولاً' },
            ],
            nextStep: 'حلل المنافسة (Porter) ثم حدد قدراتك الجوهرية',
        },

        // ===== 5. متعثرة مالية (cash-burn + stability) =====
        'متعثرة مالية': {
            focus: 'الربحية أولاً',
            priorityTools: [
                { code: 'PARETO', name: 'تحليل باريتو', reason: 'التركيز على 20% تحقق 80% من الأرباح', priority: 'عالي' },
                { code: 'VALUE_CHAIN', name: 'سلسلة القيمة', reason: 'اكتشاف مصادر الهدر المالي', priority: 'عالي' },
                { code: 'SWOT', name: 'تحليل SWOT', reason: 'تحديد نقاط القوة للبناء عليها', priority: 'متوسط' },
            ],
            lockedTools: [
                { code: 'THREE_HORIZONS', name: 'الآفاق الثلاثة', reason: 'الحاضر أهم من المستقبل الآن' },
                { code: 'BLUE_OCEAN', name: 'المحيط الأزرق', reason: 'أوقف النزيف أولاً' },
            ],
            nextStep: 'حلل باريتو لتعرف أين تتركز خسائرك ثم سلسلة القيمة',
        },

        // ===== 6. ناشئة ضائعة (no-direction + differentiation) =====
        'ناشئة ضائعة': {
            focus: 'تحديد الاتجاه',
            priorityTools: [
                { code: 'SWOT', name: 'تحليل SWOT', reason: 'فهم الوضع الحالي كنقطة بداية', priority: 'عالي' },
                { code: 'BUSINESS_MODEL', name: 'نموذج الأعمال', reason: 'رسم نموذج عمل واضح', priority: 'عالي' },
                { code: 'TOWS', name: 'مصفوفة TOWS', reason: 'تحويل التشخيص لخيارات استراتيجية', priority: 'متوسط' },
            ],
            lockedTools: [
                { code: 'HOSHIN', name: 'هوشين كانري', reason: 'حدد الاتجاه أولاً' },
                { code: 'EISENHOWER', name: 'مصفوفة أيزنهاور', reason: 'لا مبادرات لترتيبها بعد' },
            ],
            nextStep: 'حلل SWOT + ارسم نموذج العمل لتعرف وجهتك',
        },

        // ===== 7. نامية تنافسية (competition + differentiation) =====
        'نامية تنافسية': {
            focus: 'قيادة السوق',
            priorityTools: [
                { code: 'PORTER', name: 'قوى بورتر الخمس', reason: 'فهم القوى التنافسية في سوقك', priority: 'عالي' },
                { code: 'PESTEL', name: 'تحليل PESTEL', reason: 'رصد الفرص والتهديدات الخارجية', priority: 'عالي' },
                { code: 'CUSTOMER_JOURNEY', name: 'رحلة العميل', reason: 'التفوق في تجربة العميل', priority: 'متوسط' },
                { code: 'CORE_COMPETENCY', name: 'القدرات الجوهرية', reason: 'بناء ميزة تنافسية مستدامة', priority: 'متوسط' },
            ],
            lockedTools: [
                { code: 'PARETO', name: 'تحليل باريتو', reason: 'ركّز على المنافسة أولاً' },
            ],
            nextStep: 'حلل المنافسة (Porter + PESTEL) ثم ارسم رحلة العميل',
        },

        // ===== 8. ناضجة مرهقة (burnout + system-run) =====
        'ناضجة مرهقة': {
            focus: 'التجديد والابتكار',
            priorityTools: [
                { code: 'CUSTOMER_JOURNEY', name: 'رحلة العميل', reason: 'اكتشاف فرص تحسين التجربة', priority: 'عالي' },
                { code: 'SEVEN_S', name: 'نموذج 7S', reason: 'فحص التوافق الداخلي وتحديد مصادر الإرهاق', priority: 'عالي' },
                { code: 'INTERNAL_ENV', name: 'البيئة الداخلية', reason: 'تشخيص ضغط العمل على الإدارات', priority: 'متوسط' },
                { code: 'THREE_HORIZONS', name: 'الآفاق الثلاثة', reason: 'التخطيط للمستقبل مع حماية الحاضر', priority: 'متوسط' },
            ],
            lockedTools: [
                { code: 'ANSOFF', name: 'مصفوفة أنسوف', reason: 'حل الإرهاق أولاً قبل التوسع' },
            ],
            nextStep: 'حلل رحلة العميل + نموذج 7S لتعرف مصدر الإرهاق',
        },
    };

    return map[pattern] || {
        focus: 'تطوير استراتيجي',
        priorityTools: [
            { code: 'SWOT', name: 'تحليل SWOT', reason: 'نقطة البداية', priority: 'عالي' },
            { code: 'INTERNAL_ENV', name: 'البيئة الداخلية', reason: 'فهم الوضع الداخلي', priority: 'متوسط' },
        ],
        lockedTools: [],
        nextStep: 'أكمل SWOT ثم البيئة الداخلية',
    };
}

function generateGrowthPlan(pain, ambition, budget) {
    const plans = {
        'growth-stopped+rapid-growth': {
            name: 'أنبوب السرعة — إغلاق في ١٤ يوم',
            type: 'sales-heavy',
            duration: '٩٠ يوم',
            budget,
            marketing: {
                focus: 'دعم المبيعات فقط',
                channels: [
                    { name: 'LinkedIn Ads', budget: Math.round(budget * 0.15), goal: '٥٠ lead جودة عالية' },
                    { name: 'Content Marketing', budget: Math.round(budget * 0.10), goal: 'مصداقية وثقة' },
                ],
                kpis: ['Cost per Lead < ١٠٠ ريال', '٥٠% من Leads يتحولون لـ Meeting'],
            },
            sales: {
                focus: 'إغلاق سريع',
                activities: [
                    { name: 'LinkedIn Outreach', daily: '٢٠ رسالة مخصصة', target: '٥ meetings/أسبوع' },
                    { name: 'Cold Calling', daily: '١٠ مكالمات', target: '٣ meetings/أسبوع' },
                    { name: 'Referrals', weekly: 'طلب إحالة', target: '٢ عميل/شهر' },
                ],
                kpis: ['Conversion ١٥%', 'Deal Size ٥,٠٠٠ ريال', 'Sales Cycle ١٤ يوم'],
            },
            budgetSplit: {
                ads: Math.round(budget * 0.25),
                team: Math.round(budget * 0.60),
                tools: Math.round(budget * 0.15),
            },
        },
        'team-chaos+system-run': {
            name: 'الآلة الآلية — تسويق يشتغل لوحده',
            type: 'automation-heavy',
            duration: '٩٠ يوم',
            budget,
            marketing: {
                focus: 'أتمتة كاملة',
                channels: [
                    { name: 'SEO', budget: Math.round(budget * 0.20), goal: 'ترتيب أول في ٥ كلمات' },
                    { name: 'Email Automation', budget: Math.round(budget * 0.15), goal: 'نظام ١٠ رسائل تلقائية' },
                    { name: 'Google Ads', budget: Math.round(budget * 0.25), goal: '١٠٠ lead شهرياً' },
                ],
                kpis: ['MQLs ١٠٠/شهر', 'Cost per MQL < ٥٠ ريال', 'Automation Rate ٨٠%'],
            },
            budgetSplit: {
                tools: Math.round(budget * 0.30),
                ads: Math.round(budget * 0.40),
                team: Math.round(budget * 0.30),
            },
        },
    };

    const key = `${pain}+${ambition}`;
    return plans[key] || plans['growth-stopped+rapid-growth'];
}

module.exports = router;
