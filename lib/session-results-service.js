/**
 * SessionResultsService - حساب نتائج الجلسة (درجات الصحة، الضغط، السيناريوهات)
 */
'use strict';

const prisma = require('./prisma');
const { getSessionByTempId } = require('./diag-session-service');

/**
 * تحويل JSON string إلى كائن (للـ options والـ requirements)
 */
function parseOptions(raw) {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

/**
 * حساب درجات الصحة لكل فئة (admin, finance, operations)
 */
function calculateHealthScores(responsesMap, questionsMap) {
    const categories = ['admin', 'finance', 'operations', 'strategy', 'market'];
    const scores = {};
    const weights = {};

    // تهيئة
    categories.forEach(cat => {
        scores[cat] = 0;
        weights[cat] = 0;
    });

    for (const [questionId, answerValue] of responsesMap.entries()) {
        const question = questionsMap.get(questionId);
        if (!question) continue;

        const category = question.category;
        if (!categories.includes(category)) continue;

        let answerScore = 0;
        if (question.options) {
            const options = parseOptions(question.options);
            if (options) {
                // البحث عن درجة الإجابة المختارة
                const selected = options.find(opt => String(opt.value) === String(answerValue));
                if (selected) {
                    answerScore = Number(selected.score) || 0;
                }
            }
        }

        const weight = Number(question.weight) || 1.0;
        scores[category] += answerScore * weight;
        weights[category] += weight;
    }

    // حساب المتوسط المرجح لكل فئة
    const finalScores = {};
    for (const cat of categories) {
        if (weights[cat] > 0) {
            finalScores[cat] = Math.round(scores[cat] / weights[cat]);
        } else {
            finalScores[cat] = 0;
        }
    }
    return finalScores;
}

/**
 * حساب مستوى الضغط باستخدام المفاتيح المالية
 */
function calculateStressLevel(keyResponsesMap) {
    const profit = keyResponsesMap.get('profit_last_month');
    const runway = keyResponsesMap.get('runway_months');
    const payroll = keyResponsesMap.get('payroll_next_month');

    let score = 100;

    if (profit === 'loss') score -= 30;

    if (runway === 'less_3') score -= 40;
    else if (runway === '3_6') score -= 20;
    else if (runway === '6_12') score -= 10;

    if (payroll === 'no') score -= 30;
    else if (payroll === 'hard') score -= 15;

    if (score <= 20) return 'critical';
    if (score <= 50) return 'high';
    if (score <= 75) return 'medium';
    return 'low';
}

/**
 * توليد السيناريوهات (3 سيناريوهات افتراضية بناءً على النتائج)
 */
function generateScenarios(sessionId, healthScores, stressLevel, entitySector, sessionLevel) {
    const isScreeningOnly = sessionLevel === 'screening';
    const scenarios = [];

    // 1. السيناريو الواقعي (Realistic)
    scenarios.push({
        sessionId,
        type: 'realistic',
        title: 'التطوير التدريجي',
        description: `بناءً على نتائجك الحالية (إداري: ${healthScores.admin}، مالي: ${healthScores.finance}، تشغيلي: ${healthScores.operations})، يمكنك تحسين الأداء عبر التركيز على الأولوياتك الأضعف.`,
        probability: 70,
        impactScore: 30,
        timelineMonths: 6,
        requirements: JSON.stringify([{ item: 'تخصيص وقت أسبوعي لمراجعة الأداء', cost: 0 }]),
        risks: JSON.stringify([{ risk: 'قد لا يلتزم الفريق', mitigation: 'وضع مؤشرات أداء واضحة' }]),
        isRecommended: true,
    });

    // 2. السيناريو المتفائل (Optimistic)
    if (isScreeningOnly || healthScores.admin > 70 || healthScores.operations > 70) {
        scenarios.push({
            sessionId,
            type: 'optimistic',
            title: 'النمو المتسارع',
            description: isScreeningOnly
                ? 'بناءً على إجاباتك الأولية، نتوقع إمكانية نمو قوية. هذه نتيجة تقديرية تعتمد على تحليلنا الأولي.'
                : 'مع تحسينات بسيطة في نقاط القوة الحالية، يمكنك تحقيق نمو ملحوظ خلال سنة.',
            probability: isScreeningOnly ? 50 : 40,
            impactScore: 70,
            timelineMonths: 12,
            requirements: JSON.stringify([{ item: 'توظيف مدير تنفيذي متمرس', cost: 120000 }]),
            risks: JSON.stringify([{ risk: 'تكاليف عالية', mitigation: 'اختبار الحملة أولاً' }]),
            isRecommended: false,
        });
    }

    // 3. السيناريو المتشائم (Pessimistic)
    if (stressLevel === 'high' || stressLevel === 'critical' || healthScores.finance < 40) {
        scenarios.push({
            sessionId,
            type: 'pessimistic',
            title: 'ترشيد النفقات',
            description: 'في ظل التحديات المالية الحالية، يُنصح بخفض التكاليف غير الأساسية وتحسين التدفق النقدي.',
            probability: 60,
            impactScore: -20,
            timelineMonths: 3,
            requirements: JSON.stringify([{ item: 'مراجعة جميع المصروفات', cost: 0 }]),
            risks: JSON.stringify([{ risk: 'تأثير على الروح المعنوية', mitigation: 'إشراك الفريق' }]),
            isRecommended: false,
        });
    }

    //Fallback في حال لم يتحقق أي شرط
    if (scenarios.length === 0) {
        scenarios.push({
            sessionId,
            type: 'fallback',
            title: 'البداية الذكية',
            description: 'ابدأ بتحسين عملياتك الأساسية خطوة بخطوة.',
            probability: 50,
            impactScore: 20,
            timelineMonths: 3,
            requirements: JSON.stringify([]),
            risks: JSON.stringify([]),
            isRecommended: true,
        });
    }

    return scenarios;
}

/**
 * الوظيفة الرئيسية: استخراج النتائج المجانية للجلسة
 */
async function getFreeResults(tempSessionId) {
    // 1. جلب الجلسة
    const session = await getSessionByTempId(tempSessionId);
    if (!session) throw new Error('SESSION_NOT_FOUND');

    // 2. جلب جميع الإجابات الخاصة بالجلسة
    const responses = await prisma.diagnosticResponse.findMany({
        where: { sessionId: session.id },
        include: { question: true }
    });

    const responsesMap = new Map();
    const keyResponsesMap = new Map();
    const questionsMap = new Map();

    responses.forEach(r => {
        responsesMap.set(r.questionId, r.answerValue);
        keyResponsesMap.set(r.question.questionKey, r.answerValue);
        questionsMap.set(r.questionId, r.question);
    });

    // 3. حساب درجات الصحة
    const healthScores = calculateHealthScores(responsesMap, questionsMap);

    // 4. جلب قطاع المنشأة (إذا كان متاحاً)
    let entitySector = null;
    if (session.entityId) {
        const entity = await prisma.entity.findUnique({
            where: { id: session.entityId },
            include: { sector: true }
        });
        entitySector = entity?.sector?.nameAr || null;
    }

    // 5. حساب مستوى الضغط
    const stressLevel = calculateStressLevel(keyResponsesMap);

    // 6. توليد السيناريوهات
    const scenariosData = generateScenarios(
        session.id,
        healthScores,
        stressLevel,
        entitySector,
        session.level
    );

    // 7. تخزين السيناريوهات وتحديث الجلسة (Transaction)
    // ملاحظة: SQLite لا يدعم createMany في بعض إصدارات Prisma، لذا نستخدم الخيار الأكثر أماناً
    const scenarioPromises = scenariosData.map(s => prisma.diagnosticScenario.create({ data: s }));

    await prisma.$transaction([
        prisma.diagnosticScenario.deleteMany({ where: { sessionId: session.id } }),
        ...scenarioPromises,
        prisma.diagSession.update({
            where: { id: session.id },
            data: {
                healthScoreAdmin: healthScores.admin,
                healthScoreFinance: healthScores.finance,
                healthScoreOps: healthScores.operations,
                stressLevel,
            },
        }),
    ]);

    // 8. إرجاع النتائج لمعالجة العرض
    return {
        sessionId: session.id,
        tempSessionId: session.tempSessionId,
        level: session.level,
        healthScores,
        stressLevel,
        scenarios: scenariosData.map(s => ({
            type: s.type,
            title: s.title,
            description: s.description,
            probability: s.probability,
            impactScore: s.impactScore,
            timelineMonths: s.timelineMonths,
            requirements: parseOptions(s.requirements),
            risks: parseOptions(s.risks),
            isRecommended: s.isRecommended,
        })),
    };
}

module.exports = {
    getFreeResults
};
