// lib/inference-engine.js
// محرك الاستنتاج الاستراتيجي — يحول أرقام المدير المالي إلى خطة
// ─────────────────────────────────────────────

const prisma = require('./prisma');

// ─────────────────────────────────────────────
// البيانات المرجعية الافتراضية (fallback لو ما وجد قطاع)
// ─────────────────────────────────────────────
const DEFAULT_BENCHMARK = {
    collectionDays: 45,
    profitMargin: 0.15,
    cashRunwayMonths: 3,
};

// ─────────────────────────────────────────────
// 1. التحقق من صحة الأرقام (Validation Layer)
//    رسائل بلغة مستشار — لا رسائل تقنية
// ─────────────────────────────────────────────
function validateAuditNumbers(data) {
    const alerts = [];

    if (data.netMargin > 100 || data.netMargin < -100) {
        alerts.push({
            field: 'netMargin',
            message: 'هامش الربح يبدو خارج النطاق المنطقي (بين -100% و 100%). هل تأكدت من الرقم؟',
        });
    }

    if (data.collectionDays <= 0 || data.collectionDays > 365) {
        alerts.push({
            field: 'collectionDays',
            message: 'أيام التحصيل يجب أن تكون بين 1 و 365 يوماً.',
        });
    }

    if (data.cashRunwayMonths < 0) {
        alerts.push({
            field: 'cashRunwayMonths',
            message: 'عدد أشهر السيولة لا يمكن أن يكون سالباً.',
        });
    }

    return alerts;
}

// ─────────────────────────────────────────────
// 2. حساب الدرجة (Scoring Engine)
//    الهامش 40 نقطة + التحصيل 30 + السيولة 30 = 100
// ─────────────────────────────────────────────
function calculateScore(audit, benchmark) {
    let score = 0;

    // الهامش (40 نقطة)
    if (audit.netMargin >= benchmark.profitMargin * 100) score += 40;
    else if (audit.netMargin >= benchmark.profitMargin * 50) score += 20;
    else score += 5;

    // التحصيل (30 نقطة)
    if (audit.collectionDays <= benchmark.collectionDays) score += 30;
    else if (audit.collectionDays <= benchmark.collectionDays * 1.5) score += 15;
    else score += 0;

    // السيولة (30 نقطة)
    if (audit.cashRunwayMonths >= benchmark.cashRunwayMonths * 2) score += 30;
    else if (audit.cashRunwayMonths >= benchmark.cashRunwayMonths) score += 15;
    else score += 0;

    return Math.min(score, 100);
}

// ─────────────────────────────────────────────
// 3. تحديد مستوى النضج
// ─────────────────────────────────────────────
function getMaturityLevel(score, survey) {
    if (score >= 75 && survey.strategicRole === 'full') return 'Strategic';
    if (score >= 50 || survey.strategicRole === 'limited') return 'Tactical';
    return 'Operational';
}

// ─────────────────────────────────────────────
// 4. بناء SWOT من الأرقام الفعلية
// ─────────────────────────────────────────────
function buildSWOT(audit, benchmark) {
    const strengths = [];
    const weaknesses = [];
    const opportunities = [];
    const threats = [];

    // تحليل الهامش
    if (audit.netMargin >= benchmark.profitMargin * 100) {
        strengths.push(`هامش ربح صافٍ قوي عند ${audit.netMargin}% يتجاوز معيار القطاع (${benchmark.profitMargin * 100}%)`);
    } else {
        weaknesses.push(`هامش الربح الحالي ${audit.netMargin}% أقل من معيار القطاع ${benchmark.profitMargin * 100}%`);
        opportunities.push(`تحسين هامش الربح بنسبة ${(benchmark.profitMargin * 100 - audit.netMargin).toFixed(1)}% من خلال ضبط التكاليف التشغيلية`);
    }

    // تحليل التحصيل
    if (audit.collectionDays <= benchmark.collectionDays) {
        strengths.push(`كفاءة تحصيل ممتازة: ${audit.collectionDays} يوم مقابل معيار ${benchmark.collectionDays} يوم`);
    } else {
        const excessDays = audit.collectionDays - benchmark.collectionDays;
        weaknesses.push(`تأخر التحصيل بمعدل ${excessDays} يوم عن معيار القطاع`);
        threats.push(`تأخر التحصيل يهدد التدفق النقدي ويرفع تكلفة التمويل`);
    }

    // تحليل السيولة
    if (audit.cashRunwayMonths < benchmark.cashRunwayMonths) {
        threats.push(`السيولة الحالية تغطي ${audit.cashRunwayMonths} أشهر فقط — دون الحد الآمن ${benchmark.cashRunwayMonths} أشهر`);
        opportunities.push(`تحسين إدارة السيولة عبر برنامج تحصيل مسرّع`);
    } else {
        strengths.push(`مستوى سيولة آمن: ${audit.cashRunwayMonths} أشهر تغطية`);
    }

    // الأتمتة
    if (audit.automationLevel === 'low') {
        weaknesses.push('نسبة العمل اليدوي مرتفعة — مصدر رئيسي لضياع الوقت والأخطاء');
        opportunities.push('أتمتة العمليات المالية يمكن أن تختصر 40% من وقت الفريق');
    }

    // الدور الاستراتيجي
    if (audit.strategicRole === 'recorder') {
        weaknesses.push('الإدارة المالية غير مشاركة في صياغة القرار الاستراتيجي');
    }

    return { strengths, weaknesses, opportunities, threats };
}

// ─────────────────────────────────────────────
// 5. بناء الأهداف المقترحة بأرقام محسوبة فعلاً
// ─────────────────────────────────────────────
function buildGoals(audit, benchmark) {
    const goals = [];

    // هدف تحسين التحصيل
    if (audit.collectionDays > benchmark.collectionDays) {
        const targetDays = benchmark.collectionDays;
        const improvementDays = audit.collectionDays - targetDays;
        goals.push({
            goal: `تقليل دورة التحصيل من ${audit.collectionDays} إلى ${targetDays} يوماً`,
            action: 'مراجعة سياسة الائتمان وتفعيل نظام تذكير آلي للعملاء',
            priority: 'HIGH',
            calculatedImprovement: ((improvementDays / audit.collectionDays) * 100).toFixed(1),
        });
    }

    // هدف تحسين الهامش
    if (audit.netMargin < benchmark.profitMargin * 100) {
        const gap = (benchmark.profitMargin * 100 - audit.netMargin).toFixed(1);
        goals.push({
            goal: `رفع هامش الربح الصافي بمقدار ${gap}% خلال السنة المالية`,
            action: 'مراجعة بنود التكاليف التشغيلية وتحديد فرص خفض الإنفاق غير الأساسي',
            priority: 'HIGH',
            calculatedImprovement: gap,
        });
    }

    // هدف تحسين السيولة
    if (audit.cashRunwayMonths < benchmark.cashRunwayMonths) {
        goals.push({
            goal: `رفع احتياطي السيولة من ${audit.cashRunwayMonths} إلى ${benchmark.cashRunwayMonths} أشهر`,
            action: 'إعداد خطة تحصيل مسرّع للذمم المدينة المتأخرة',
            priority: 'CRITICAL',
            calculatedImprovement: ((benchmark.cashRunwayMonths - audit.cashRunwayMonths) / benchmark.cashRunwayMonths * 100).toFixed(1),
        });
    }

    // هدف الأتمتة
    if (audit.automationLevel === 'low') {
        goals.push({
            goal: 'رفع نسبة الأتمتة من أقل من 30% إلى أكثر من 70%',
            action: 'تقييم حلول ERP أو أدوات أتمتة مالية متخصصة',
            priority: 'MEDIUM',
            calculatedImprovement: '40',
        });
    }

    return goals;
}

// ─────────────────────────────────────────────
// 6. توليد خطاب مجلس الإدارة بأرقام حقيقية
// ─────────────────────────────────────────────
function generateBoardPitch(audit, benchmark, goals, swot) {
    const maturityAr = {
        Operational: 'تشغيلي (المستوى الأول)',
        Tactical: 'تحليلي (المستوى الثاني)',
        Strategic: 'استراتيجي (المستوى الثالث)',
    };

    const score = calculateScore(audit, benchmark);
    const maturity = getMaturityLevel(score, audit);

    // خطر محسوب فعلاً
    const mainRisk =
        audit.collectionDays > benchmark.collectionDays
            ? `تأخر التحصيل بمعدل ${audit.collectionDays - benchmark.collectionDays} يوماً عن المعيار يُقيّد التدفق النقدي`
            : audit.netMargin < benchmark.profitMargin * 100
                ? `هامش الربح ${audit.netMargin}% يقل عن معيار القطاع ${benchmark.profitMargin * 100}%`
                : `مستوى السيولة يغطي ${audit.cashRunwayMonths} أشهر فقط`;

    // بناء نقاط الضعف
    const weaknessLines = swot.weaknesses.slice(0, 2).map((w) => `- ${w}`).join('\n');

    // بناء الأهداف
    const goalLines = goals.map((g, i) =>
        `${i + 1}. ${g.goal}\n   الإجراء: ${g.action}\n   التحسن المتوقع: ${g.calculatedImprovement}%`
    ).join('\n\n');

    return `الموضوع: طلب الموافقة على خطة تطوير الإدارة المالية — ${new Date().getFullYear()}

السادة أعضاء مجلس الإدارة المحترمون،

تحية طيبة وبعد،

بناءً على التحليل المالي الدقيق لأداء إدارتنا المالية، يتضح أن الإدارة تعمل حالياً عند المستوى ${maturityAr[maturity]}، وتحقق درجة نضج ${score}/100.

أبرز ما كشف عنه التحليل:
- ${mainRisk}
${weaknessLines}

لذا، أقترح اعتماد الخطة التالية:
${goalLines}

العائد المتوقع من اعتماد هذه الخطة:
- تحسين مؤشر النضج المالي من ${score} إلى ${Math.min(score + 25, 100)}/100
- تقليص هدر الوقت التشغيلي المقدّر بـ 40% عبر الأتمتة

أطلب تفويضكم الكريم بالمضي في تنفيذ هذه الخطة خلال الربع القادم.

مقدمه باحترام،
المدير المالي`.trim();
}

// ─────────────────────────────────────────────
// 7. المحرك الرئيسي (Main Engine)
// ─────────────────────────────────────────────
async function runInferenceEngine(auditId) {
    // جلب بيانات الفحص
    const audit = await prisma.financialAudit.findUnique({ where: { id: auditId } });
    if (!audit) throw new Error('Audit not found');

    // جلب بيانات المعيار أو استخدام الافتراضي
    const benchmarkRecord = await prisma.financialBenchmark.findFirst();
    const benchmark = benchmarkRecord || DEFAULT_BENCHMARK;

    // تشغيل المحرك
    const score = calculateScore(audit, benchmark);
    const maturity = getMaturityLevel(score, audit);
    const swot = buildSWOT(audit, benchmark);
    const goals = buildGoals(audit, benchmark);
    const boardPitch = generateBoardPitch(audit, benchmark, goals, swot);

    // حفظ الخطة (JSON.stringify للتوافق مع SQLite)
    const plan = await prisma.autoStrategicPlan.upsert({
        where: { auditId },
        update: {
            strengths: JSON.stringify(swot.strengths),
            weaknesses: JSON.stringify(swot.weaknesses),
            opportunities: JSON.stringify(swot.opportunities),
            threats: JSON.stringify(swot.threats),
            suggestedGoals: JSON.stringify(goals),
            boardPitchText: boardPitch,
            calculatedRisk: swot.threats[0] || '',
            calculatedSaving: goals.reduce((acc, g) => acc + parseFloat(g.calculatedImprovement || 0), 0),
            calculatedImprovement: parseFloat(goals[0]?.calculatedImprovement || 0),
            maturityLevel: maturity,
            score,
        },
        create: {
            departmentId: audit.departmentId,
            auditId: audit.id,
            strengths: JSON.stringify(swot.strengths),
            weaknesses: JSON.stringify(swot.weaknesses),
            opportunities: JSON.stringify(swot.opportunities),
            threats: JSON.stringify(swot.threats),
            suggestedGoals: JSON.stringify(goals),
            boardPitchText: boardPitch,
            calculatedRisk: swot.threats[0] || '',
            calculatedSaving: goals.reduce((acc, g) => acc + parseFloat(g.calculatedImprovement || 0), 0),
            calculatedImprovement: parseFloat(goals[0]?.calculatedImprovement || 0),
            maturityLevel: maturity,
            score,
        },
    });

    return plan;
}

module.exports = { runInferenceEngine, validateAuditNumbers };
