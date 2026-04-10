// routes/progress.js
// ✅ Progress endpoint — يقبل تسجيل إكمال الخطوات لمديري الإدارات
// التخزين الفعلي يتم في localStorage عبر Context.markStepCompleted
// هذا الـ endpoint يوفر سجلاً خفيفاً فقط (لا DB حتى يُضاف Progress model)

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// POST /api/progress — تسجيل إكمال خطوة
router.post('/', verifyToken, async (req, res) => {
    try {
        const { stepId, dept } = req.body;
        if (!stepId) {
            return res.status(400).json({ error: 'stepId مطلوب' });
        }
        // سجّل في الـ console للمراجعة
        console.log(`[Progress] User ${req.user?.id} completed step "${stepId}" for dept "${dept || '—'}"`);
        res.json({ success: true, stepId, dept: dept || null });
    } catch (error) {
        console.error('[Progress] Error:', error);
        res.status(500).json({ error: 'حدث خطأ في تسجيل التقدم' });
    }
});

// GET /api/progress — جلب حالة خطوة (fallback — دائماً false من الـ API، اللوحة تقرأ من localStorage)
router.get('/', verifyToken, async (req, res) => {
    try {
        // اللوحة تعتمد على localStorage — هذا fallback فقط
        res.json({ completed: false });
    } catch (error) {
        console.error('[Progress] Error:', error);
        res.status(500).json({ error: 'حدث خطأ في جلب التقدم' });
    }
});

module.exports = router;
