const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// ===================================================
// PATH 1 API — رحلة "أعمل بجد ولا أتقدم"
// NO AUTH REQUIRED — جلسات مجهولة
// ===================================================

// Mapping: ساعات يومية → رقم
const HOURS_MAP = {
    'less_than_2': 1.5,
    '2_to_4': 3,
    'more_than_4': 4.5,
    'most_of_day': 6
};

// Mapping: تشخيص حسب Q2 (أسعار) × Q4 (ساعات)
function getDiagnosisLine(priceAnswer, hoursAnswer) {
    const priceLow = ['never', 'lowered'].includes(priceAnswer);
    const hoursHigh = ['more_than_4', 'most_of_day'].includes(hoursAnswer);

    if (priceLow && hoursHigh) return 'تعمل أكثر بسعر أقل ومجهود مضاعف';
    if (priceLow && !hoursHigh) return 'تعمل أكثر لتحصل على أقل';
    if (!priceLow && hoursHigh) return 'وقتك الثمين يذهب في الاتجاه الخطأ';
    return 'طاقتك تستحق عائداً أعلى';
}

// ─────────────────────────────────────
// POST /api/path/submit
// يرسل كل الإجابات ← ينشئ session + result
// ─────────────────────────────────────
router.post('/submit', async (req, res) => {
    try {
        const { painChoice, email, answers } = req.body;

        if (!painChoice || !answers || !answers.Q2 || !answers.Q3 || !answers.Q4 || !answers.Q5) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Create session with answers
        const session = await prisma.pathSession.create({
            data: {
                pathCode: 'PATH_1',
                painChoice,
                email: email || null,
                status: 'COMPLETED',
                completedAt: new Date(),
                currentStep: 8,
                answers: {
                    create: [
                        { questionId: 'Q2', answer: answers.Q2 },
                        { questionId: 'Q3', answer: answers.Q3 },
                        { questionId: 'Q4', answer: answers.Q4 },
                        { questionId: 'Q5', answer: answers.Q5 }
                    ]
                }
            }
        });

        // 2. Calculate the single number
        const dailyHours = HOURS_MAP[answers.Q4] || 3;
        const weeklyHours = dailyHours * 5;
        const monthlyHours = weeklyHours * 4;
        const yearlyHours = monthlyHours * 12;
        const yearlyDays = Math.round(yearlyHours / 8);

        // 3. Generate diagnosis
        const diagnosisLine = getDiagnosisLine(answers.Q2, answers.Q4);

        // 4. Save result
        const result = await prisma.pathResult.create({
            data: {
                sessionId: session.id,
                diagnosisText: diagnosisLine,
                singleNumber: weeklyHours,
                numberLabel: 'ساعة أسبوعياً تذهب في أعمال يمكن لغيرك فعلها'
            }
        });

        res.json({
            sessionId: session.id,
            result: {
                diagnosisLine,
                weeklyHours,
                monthlyHours,
                yearlyHours,
                yearlyDays
            }
        });

    } catch (error) {
        console.error('Path submit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─────────────────────────────────────
// POST /api/path/:id/feedback
// حفظ رد فعل المستخدم على الكشف
// ─────────────────────────────────────
router.post('/:id/feedback', async (req, res) => {
    try {
        const { feedback } = req.body;
        await prisma.pathResult.update({
            where: { sessionId: req.params.id },
            data: { feedbackChoice: feedback }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Path feedback error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─────────────────────────────────────
// GET /api/path/:id/actions
// جلب بيانات الخطوة المؤمنة
// ─────────────────────────────────────
router.get('/:id/actions', async (req, res) => {
    try {
        const result = await prisma.pathResult.findUnique({
            where: { sessionId: req.params.id }
        });
        if (!result) return res.status(404).json({ error: 'Session not found' });

        const data = result.actionData ? JSON.parse(result.actionData) : { activities: [], checklist: [false, false, false, false] };
        res.json(data);
    } catch (error) {
        console.error('Path actions get error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─────────────────────────────────────
// PUT /api/path/:id/actions
// حفظ/تحديث بيانات الخطوة المؤمنة
// ─────────────────────────────────────
router.put('/:id/actions', async (req, res) => {
    try {
        const { activities, checklist } = req.body;
        await prisma.pathResult.update({
            where: { sessionId: req.params.id },
            data: {
                actionData: JSON.stringify({ activities, checklist }),
                actionStarted: true
            }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Path actions save error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─────────────────────────────────────
// GET /api/path/:id
// جلب الجلسة الكاملة مع جميع البيانات
// ─────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const session = await prisma.pathSession.findUnique({
            where: { id: req.params.id },
            include: {
                answers: true,
                result: true
            }
        });
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    } catch (error) {
        console.error('Path session get error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
