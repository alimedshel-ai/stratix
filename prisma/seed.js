const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Enums as constants for seed script (since SQLite doesn't support them natively in Prisma)
const SessionLevelEnum = { screening: 'screening', diagnostic: 'diagnostic', analysis: 'analysis' };
const QuestionCategoryEnum = { admin: 'admin', finance: 'finance', operations: 'operations', strategy: 'strategy', market: 'market' };
const QuestionTypeEnum = { single_choice: 'single_choice', multiple_choice: 'multiple_choice', text: 'text', number: 'number' };

async function main() {
    console.log('🌱 Seeding diagnostic data...');

    // ---------- 1. Screening Questions (8) ----------
    const screeningQuestions = [
        {
            key: 'sector',
            text: 'تحت أي قطاع يندرج نشاط منشأتك؟',
            level: SessionLevelEnum.screening,
            category: QuestionCategoryEnum.admin,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'tech', label: 'التقنية والبرمجيات', score: 0 },
                { value: 'retail', label: 'التجارة والتجزئة', score: 0 },
                { value: 'service', label: 'الخدمات والاستشارات', score: 0 },
                { value: 'industrial', label: 'الصناعة واللوجستيات', score: 0 },
                { value: 'other', label: 'قطاع آخر', score: 0 },
            ]),
            orderIndex: 1,
            weight: 0,
        },
        {
            key: 'maturity',
            text: 'ما هي دورة حياة منشأتك في الوقت الراهن؟',
            level: SessionLevelEnum.screening,
            category: QuestionCategoryEnum.strategy,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'nascent', label: 'تأسيس (أقل من سنتين)', score: 30 },
                { value: 'growing', label: 'نمو متسارع (2-5 سنوات)', score: 60 },
                { value: 'mature', label: 'استقرار وريادة (أكثر من 5 سنوات)', score: 100 },
            ]),
            orderIndex: 2,
            weight: 0,
        },
        {
            key: 'team_size',
            text: 'ما هو حجم الكادر البشري الذي تديره حالياً؟',
            level: SessionLevelEnum.screening,
            category: QuestionCategoryEnum.operations,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: '1-5', label: '1 - 5 (فريق مرن)', score: 0 },
                { value: '6-20', label: '6 - 20 (فريق صغير منظم)', score: 0 },
                { value: '21-50', label: '21 - 50 (منظمة متوسطة)', score: 0 },
                { value: '51+', label: 'أكثر من 50 (منظمة متنامية)', score: 0 },
            ]),
            orderIndex: 3,
            weight: 0,
        },
        {
            key: 'org_name',
            text: 'ما هو الاسم التجاري لمنشأتك؟',
            level: SessionLevelEnum.screening,
            category: QuestionCategoryEnum.admin,
            type: QuestionTypeEnum.text,
            options: null,
            orderIndex: 4,
            weight: 0,
        },
        {
            key: 'main_pain',
            text: 'ما هو التحدي الجوهري الذي تسعى لمعالجته؟',
            level: SessionLevelEnum.screening,
            category: QuestionCategoryEnum.strategy,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'cashflow', label: 'استقرار التدفقات النقدية', score: 0 },
                { value: 'growth', label: 'توسيع الحصة السوقية', score: 0 },
                { value: 'team', label: 'كفاءة الفريق والثقافة', score: 0 },
                { value: 'ops', label: 'أتمتة وتنظيم العمليات', score: 0 },
            ]),
            orderIndex: 5,
            weight: 0,
        },
        {
            key: 'cash_position',
            text: 'كيف تصف وضع السيولة والتدفق النقدي حالياً؟',
            level: SessionLevelEnum.screening,
            category: QuestionCategoryEnum.finance,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'safe', label: 'سيولة جيدة', score: 100 },
                { value: 'tight', label: 'سيولة محدودة', score: 50 },
                { value: 'danger', label: 'عجز مستمر', score: 10 },
            ]),
            orderIndex: 7,
            weight: 0,
        },
        {
            key: 'digital_maturity',
            text: 'ما مدى اعتماد منشأتك على التقنية والذكاء الاصطناعي؟',
            level: SessionLevelEnum.screening,
            category: QuestionCategoryEnum.operations,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'low', label: 'اعتماد يدوي', score: 20 },
                { value: 'mid', label: 'تحول جزئي', score: 60 },
                { value: 'high', label: 'منشأة رقمية', score: 100 },
            ]),
            orderIndex: 8,
            weight: 0,
        },
        // Dept Manager Specific (Screening)
        {
            key: 'dept_governance',
            text: 'ما مستوى توثيق السياسات والإجراءات في إدارتك؟',
            level: SessionLevelEnum.screening,
            category: QuestionCategoryEnum.operations,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'high', label: 'كاملة وموثقة', score: 100 },
                { value: 'partial', label: 'بعض الإجراءات مكتوبة', score: 50 },
                { value: 'none', label: 'غير موثقة (عفوية)', score: 0 },
            ]),
            orderIndex: 9,
            weight: 0,
        },
        {
            key: 'dept_kpi_tracking',
            text: 'كيف يتم قياس أداء الفريق حالياً؟',
            level: SessionLevelEnum.screening,
            category: QuestionCategoryEnum.operations,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'automated', label: 'مؤشرات آلية (Dashboards)', score: 100 },
                { value: 'manual', label: 'متابعة يدوية (Excel)', score: 60 },
                { value: 'vague', label: 'تقييم وصفي (غير رقمي)', score: 20 },
            ]),
            orderIndex: 10,
            weight: 0,
        },
    ];



    // ---------- 2. Diagnostic Questions (7) ----------
    const diagnosticQuestions = [
        {
            key: 'profit_last_month',
            text: 'هل كان شهرك الماضي ربحاً أم خسارة؟',
            level: SessionLevelEnum.diagnostic,
            category: QuestionCategoryEnum.finance,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'profit', label: 'ربح', score: 100 },
                { value: 'loss', label: 'خسارة', score: 0 },
            ]),
            orderIndex: 1,
            weight: 0.25,
        },
        {
            key: 'runway_months',
            text: 'كم شهراً تستطيع الاستمرار بدون إيرادات؟',
            level: SessionLevelEnum.diagnostic,
            category: QuestionCategoryEnum.finance,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'more_12', label: 'أكثر من 12 شهراً', score: 100 },
                { value: '6_12', label: '6-12 شهراً', score: 70 },
                { value: '3_6', label: '3-6 أشهر', score: 40 },
                { value: 'less_3', label: 'أقل من 3 أشهر', score: 10 },
            ]),
            orderIndex: 2,
            weight: 0.35,
        },
        {
            key: 'payroll_next_month',
            text: 'هل تستطيع دفع رواتب الشهر القادم بسهولة؟',
            level: SessionLevelEnum.diagnostic,
            category: QuestionCategoryEnum.finance,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'yes', label: 'نعم بسهولة', score: 100 },
                { value: 'hard', label: 'بصعوبة', score: 50 },
                { value: 'no', label: 'لا', score: 0 },
            ]),
            orderIndex: 3,
            weight: 0.20,
        },
        {
            key: 'decision_delegation',
            text: 'هل تفوض القرارات للفريق؟',
            level: SessionLevelEnum.diagnostic,
            category: QuestionCategoryEnum.admin,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'always', label: 'دائماً', score: 100 },
                { value: 'sometimes', label: 'أحياناً', score: 60 },
                { value: 'rarely', label: 'نادراً', score: 20 },
            ]),
            orderIndex: 4,
            weight: 0.15,
        },
        {
            key: 'strategy_clarity',
            text: 'هل هناك استراتيجية واضحة للـ 12 شهراً القادمة؟',
            level: SessionLevelEnum.diagnostic,
            category: QuestionCategoryEnum.strategy,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'yes', label: 'نعم', score: 100 },
                { value: 'partial', label: 'جزئياً', score: 50 },
                { value: 'no', label: 'لا', score: 0 },
            ]),
            orderIndex: 5,
            weight: 0.20,
        },
        {
            key: 'tech_readiness',
            text: 'ما مدى استخدامك للتقنية في العمليات؟',
            level: SessionLevelEnum.diagnostic,
            category: QuestionCategoryEnum.operations,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'high', label: 'متقدم', score: 100 },
                { value: 'medium', label: 'متوسط', score: 50 },
                { value: 'low', label: 'محدود', score: 0 },
            ]),
            orderIndex: 6,
            weight: 0.10,
        },
        {
            key: 'customer_feedback',
            text: 'كيف تجمع ملاحظات العملاء؟',
            level: SessionLevelEnum.diagnostic,
            category: QuestionCategoryEnum.market,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'structured', label: 'نظام منظم', score: 100 },
                { value: 'ad_hoc', label: 'عشوائياً', score: 40 },
                { value: 'none', label: 'لا نجمع', score: 0 },
            ]),
            orderIndex: 7,
            weight: 0.10,
        },
    ];

    // ---------- 3. Analysis Questions (18) — New in Phase 5 ----------
    const analysisQuestions = [
        {
            key: 'mission_alignment',
            text: 'إلى أي مدى يتماشى الفريق مع رؤية ورسالة المنشأة؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.strategy,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'perfect', label: 'تناسق كامل', score: 100 },
                { value: 'good', label: 'فهم جيد للاستراتيجية', score: 70 },
                { value: 'poor', label: 'تواصل ضعيف للأهداف', score: 30 },
                { value: 'none', label: 'لا توجد رؤية معلنة', score: 0 },
            ]),
            orderIndex: 1,
            weight: 0.1,
        },
        {
            key: 'growth_levers',
            text: 'ما هو المحرك الأساسي للنمو في عملك حالياً؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.strategy,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'product', label: 'الابتكار في المنتج', score: 100 },
                { value: 'sales', label: 'كفاءة فريق المبيعات', score: 80 },
                { value: 'market', label: 'التوسع الجغرافي', score: 70 },
                { value: 'referral', label: 'سمعة العلامة التجارية', score: 90 },
            ]),
            orderIndex: 2,
            weight: 0.1,
        },
        {
            key: 'risk_management',
            text: 'هل لديكم سجل مخاطر محدث دورياً؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.strategy,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'yes', label: 'نعم، مع خطط طوارئ', score: 100 },
                { value: 'partial', label: 'نعم، بشكل غير رسمي', score: 50 },
                { value: 'no', label: 'لا يتم رصد المخاطر', score: 0 },
            ]),
            orderIndex: 3,
            weight: 0.05,
        },
        {
            key: 'competitive_advantage',
            text: 'ما مدى قوة ميزتكم التنافسية في السوق؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.strategy,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'moat', label: 'صعبة التقليد (خندق مائي)', score: 100 },
                { value: 'strong', label: 'قوية ومتميزة', score: 80 },
                { value: 'average', label: 'مشابهة للمنافسين', score: 40 },
                { value: 'weak', label: 'نعتمد على السعر فقط', score: 10 },
            ]),
            orderIndex: 4,
            weight: 0.1,
        },
        {
            key: 'standardization_level',
            text: 'ما هي نسبة العمليات التي تم توثيقها (SOPs)؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.operations,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'full', label: 'أكثر من 80%', score: 100 },
                { value: 'high', label: '50-80%', score: 70 },
                { value: 'low', label: 'أقل من 50%', score: 30 },
                { value: 'none', label: 'نعتمد على اجتهاد الأشخاص', score: 0 },
            ]),
            orderIndex: 5,
            weight: 0.1,
        },
        {
            key: 'supply_chain_resilience',
            text: 'مدى اعتمادكم على مصدر توريد واحد؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.operations,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'diversified', label: 'مصادر متعددة ومؤمنة', score: 100 },
                { value: 'low_risk', label: 'مصادر أساسية مع بدائل', score: 70 },
                { value: 'high_risk', label: 'اعتماد كلي على مورد واحد', score: 20 },
            ]),
            orderIndex: 6,
            weight: 0.05,
        },
        {
            key: 'ops_automation',
            text: 'نسبة الأتمتة في المهام الروتينية لعملياتكم؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.operations,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'automated', label: 'أتمتة عالية عبر الأنظمة', score: 100 },
                { value: 'semi', label: 'أتمتة جزئية', score: 50 },
                { value: 'manual', label: 'عمل يدوي بالكامل', score: 0 },
            ]),
            orderIndex: 7,
            weight: 0.05,
        },
        {
            key: 'customer_support_efficiency',
            text: 'سرعة الاستجابة لطلبات أو شكاوى العملاء؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.operations,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'instant', label: 'فورية (أقل من ساعة)', score: 100 },
                { value: 'fast', label: 'خلال يوم عمل', score: 70 },
                { value: 'slow', label: 'أكثر من يومين', score: 20 },
            ]),
            orderIndex: 8,
            weight: 0.05,
        },
        {
            key: 'revenue_concentration',
            text: 'ما مدى تركز الإيرادات لدى عميل واحد أو منتج واحد؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.finance,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'safe', label: 'إيرادات متنوعة بشكل صحي', score: 100 },
                { value: 'moderate', label: 'تركز بنسبة 30-50%', score: 50 },
                { value: 'danger', label: 'تركز عالٍ (أكثر من 60%)', score: 10 },
            ]),
            orderIndex: 9,
            weight: 0.1,
        },
        {
            key: 'budget_discipline',
            text: 'مدى الالتزام بالميزانية التقديرية المعتمدة؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.finance,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'strict', label: 'انضباط عالٍ ومراجعة شهرية', score: 100 },
                { value: 'loose', label: 'انحرافات بسيطة متكررة', score: 60 },
                { value: 'none', label: 'لا توجد ميزانية معتمدة', score: 0 },
            ]),
            orderIndex: 10,
            weight: 0.05,
        },
        {
            key: 'ar_aging',
            text: 'حالة تحصيل الذمم المدينة (المستحقات من العملاء)؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.finance,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'on_time', label: 'تحصيل سريع ومنتظم', score: 100 },
                { value: 'delayed', label: 'تأخير متوسط (30-60 يوم)', score: 60 },
                { value: 'laggard', label: 'تأخير يتجاوز 90 يوماً', score: 20 },
            ]),
            orderIndex: 11,
            weight: 0.05,
        },
        {
            key: 'gross_margin_health',
            text: 'مدى استقرار ورضاكم عن هامش الربح الإجمالي؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.finance,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'healthy', label: 'صحي وأعلى من معايير السوق', score: 100 },
                { value: 'fair', label: 'مقبول وضمن المعايير', score: 70 },
                { value: 'thin', label: 'هامش منخفض جداً (تحت ضغط)', score: 20 },
            ]),
            orderIndex: 12,
            weight: 0.1,
        },
        {
            key: 'customer_loyalty',
            text: 'ما مدى تكرار الشراء لدى عملائكم (Retention)؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.market,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'very_high', label: 'ولاء عالٍ جداً وتكرار دائم', score: 100 },
                { value: 'moderate', label: 'تكرار شراء عشوائي', score: 50 },
                { value: 'low', label: 'العميل يشتري مرة واحدة فقط', score: 20 },
            ]),
            orderIndex: 13,
            weight: 0.05,
        },
        {
            key: 'brand_positioning',
            text: 'تصور العملاء لعلامتكم التجارية مقارنة بالمنافسين؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.market,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'premium', label: 'خيار النخبة / الجودة العالية', score: 100 },
                { value: 'utility', label: 'خيار عملي واقتصادي', score: 70 },
                { value: 'unclear', label: 'صورة غير واضحة في السوق', score: 20 },
            ]),
            orderIndex: 14,
            weight: 0.05,
        },
        {
            key: 'market_feedback_loop',
            text: 'مدى سرعة تعديل المنتج بناءً على رأي السوق؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.market,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'agile', label: 'تطوير سريع وتكيف دائم', score: 100 },
                { value: 'slow', label: 'تحديثات سنوية أو أبطأ', score: 40 },
                { value: 'reactive', label: 'رد فعل فقط بعد فوات الأوان', score: 10 },
            ]),
            orderIndex: 15,
            weight: 0.05,
        },
        {
            key: 'employee_burnout',
            text: 'مدى شعور الفريق بضغط العمل (Burnout)؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.admin,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'low', label: 'بيئة عمل مريحة وصحية', score: 100 },
                { value: 'moderate', label: 'ضغط طبيعي محفز', score: 70 },
                { value: 'high', label: 'إرهاق ملحوظ وتدني روح معنوية', score: 20 },
            ]),
            orderIndex: 16,
            weight: 0.05,
        },
        {
            key: 'talent_retention',
            text: 'مدى قدرتكم على الاحتفاظ بالكفاءات المفتاحية؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.admin,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'high', label: 'نادر ما يغادرنا المبدعون', score: 100 },
                { value: 'average', label: 'دوران وظيفي طبيعي', score: 50 },
                { value: 'low', label: 'دوران وظيفي عالٍ ومقلق', score: 10 },
            ]),
            orderIndex: 17,
            weight: 0.05,
        },
        {
            key: 'org_culture_strength',
            text: 'مدى وضوح الثقافة التنظيمية والقيم في التعامل اليومي؟',
            level: SessionLevelEnum.analysis,
            category: QuestionCategoryEnum.admin,
            type: QuestionTypeEnum.single_choice,
            options: JSON.stringify([
                { value: 'crystal', label: 'ثقافة حية وواضحة للجميع', score: 100 },
                { value: 'written', label: 'موجودة في الأوراق فقط', score: 40 },
                { value: 'none', label: 'لا توجد ثقافة محددة', score: 0 },
            ]),
            orderIndex: 18,
            weight: 0.05,
        },
    ];

    const allQuestions = [...screeningQuestions, ...diagnosticQuestions, ...analysisQuestions];

    for (const q of allQuestions) {
        await prisma.diagQuestion.upsert({
            where: { questionKey: q.key },
            update: {
                questionText: q.text,
                level: q.level,
                category: q.category,
                type: q.type,
                options: q.options,
                orderIndex: q.orderIndex,
                weight: q.weight,
                isActive: true,
            },
            create: {
                questionKey: q.key,
                questionText: q.text,
                level: q.level,
                category: q.category,
                type: q.type,
                options: q.options,
                orderIndex: q.orderIndex,
                weight: q.weight,
                isActive: true,
            },
        });
    }

    // ---------- 4. Benchmarks ----------
    const benchmarks = [
        {
            sector: 'saas',
            region: 'saudi',
            companySize: '6-20',
            metricName: 'gross_margin',
            valueMin: 70,
            valueMax: 85,
            unit: '%',
            dataYear: 2024,
        },
        {
            sector: 'saas',
            region: 'saudi',
            companySize: '6-20',
            metricName: 'churn_rate',
            valueMin: 3,
            valueMax: 8,
            unit: '%',
            dataYear: 2024,
        },
        {
            sector: 'retail',
            region: 'saudi',
            companySize: '21-50',
            metricName: 'inventory_turnover',
            valueMin: 4,
            valueMax: 6,
            unit: 'times/year',
            dataYear: 2024,
        },
    ];

    for (const b of benchmarks) {
        await prisma.benchmarkBench.upsert({
            where: {
                sector_region_metricName_dataYear_companySize: {
                    sector: b.sector,
                    region: b.region,
                    metricName: b.metricName,
                    dataYear: b.dataYear,
                    companySize: b.companySize
                }
            },
            update: b,
            create: b
        });
    }

    console.log('✅ Seeding completed.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
