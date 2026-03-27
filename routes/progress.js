// routes/progress.js
// ✅ Progress endpoint — يقبل تسجيل إكمال الخطوات لمديري الإدارات
// التخزين الفعلي يتم في localStorage عبر Context.markStepCompleted
// هذا الـ endpoint يوفر سجلاً خفيفاً فقط (لا DB حتى يُضاف Progress model)

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// POST /api/progress — تسجيل إكمال خطوة
router.post('/', verifyToken, (req, res) => {
    const { stepId, dept } = req.body;
    if (!stepId) {
        return res.status(400).json({ error: 'stepId مطلوب' });
    }
    // سجّل في الـ console للمراجعة
    console.log(`[Progress] User ${req.user?.id} completed step "${stepId}" for dept "${dept || '—'}"`);
    res.json({ success: true, stepId, dept: dept || null });
});

// GET /api/progress — جلب حالة خطوة (fallback — دائماً false من الـ API، اللوحة تقرأ من localStorage)
router.get('/', verifyToken, (req, res) => {
    // اللوحة تعتمد على localStorage — هذا fallback فقط
    res.json({ completed: false });
});

module.exports = router;
