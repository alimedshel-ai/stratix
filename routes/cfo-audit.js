// routes/cfo-audit.js
// API Routes — الفحص المالي + خطاب مجلس الإدارة
// ─────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { runInferenceEngine, validateAuditNumbers } = require('../lib/inference-engine');

// ─────────────────────────────────────────────
// POST /api/cfo/audit
// حفظ إدخالات المدير المالي وتشغيل المحرك
// ─────────────────────────────────────────────
router.post('/audit', verifyToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const {
            departmentId: rawDeptId,
            // الأرقام الثلاثة
            netMargin,
            collectionDays,
            cashRunwayMonths,
            // الاستبيان النوعي
            automationLevel,
            dataSpeed,
            strategicRole,
            teamSkill,
            executionBarrier,
        } = req.body;

        // البحث عن departmentId صحيح
        let departmentId = rawDeptId;

        if (departmentId) {
            // تحقق هل هو department فعلي أم entityId
            const dept = await prisma.department.findUnique({ where: { id: departmentId } });
            if (!dept) {
                // ربما أرسل entityId — نبحث عن إدارة المالية في هذا الكيان
                const financeDept = await prisma.department.findFirst({
                    where: { entityId: departmentId, code: 'FINANCE' },
                });
                if (financeDept) {
                    departmentId = financeDept.id;
                } else {
                    // نأخذ أي department من هذا الكيان
                    const anyDept = await prisma.department.findFirst({
                        where: { entityId: departmentId },
                    });
                    if (anyDept) {
                        departmentId = anyDept.id;
                    } else {
                        return res.status(400).json({ success: false, message: 'لم يتم العثور على إدارة مرتبطة بكيانك' });
                    }
                }
            }
        } else {
            // لا يوجد departmentId — نبحث من عضوية المستخدم
            const member = await prisma.member.findFirst({
                where: { userId },
                include: { department: true },
            });
            if (member?.departmentId) {
                departmentId = member.departmentId;
            } else {
                return res.status(400).json({ success: false, message: 'لم يتم العثور على إدارة مرتبطة بحسابك' });
            }
        }

        // التحقق من صحة الأرقام
        const alerts = validateAuditNumbers({
            netMargin: parseFloat(netMargin),
            collectionDays: parseInt(collectionDays),
            cashRunwayMonths: parseFloat(cashRunwayMonths),
        });

        if (alerts.length > 0) {
            return res.status(422).json({ success: false, alerts });
        }

        // حفظ الفحص
        const audit = await prisma.financialAudit.create({
            data: {
                departmentId,
                userId,
                netMargin: parseFloat(netMargin),
                collectionDays: parseInt(collectionDays),
                cashRunwayMonths: parseFloat(cashRunwayMonths),
                automationLevel: automationLevel || 'medium',
                dataSpeed: dataSpeed || 'days',
                strategicRole: strategicRole || 'limited',
                teamSkill: teamSkill || 'basic',
                executionBarrier: executionBarrier || 'resources',
            },
        });

        // تشغيل محرك الاستنتاج
        const plan = await runInferenceEngine(audit.id);

        res.json({
            success: true,
            auditId: audit.id,
            planId: plan.id,
            score: plan.score,
            maturityLevel: plan.maturityLevel,
        });
    } catch (err) {
        console.error('CFO Audit Error:', err);
        res.status(500).json({ success: false, message: 'خطأ في معالجة الفحص المالي' });
    }
});

// ─────────────────────────────────────────────
// GET /api/cfo/plan/:auditId
// جلب الخطة المولّدة لعرضها للمدير
// ─────────────────────────────────────────────
router.get('/plan/:auditId', verifyToken, async (req, res) => {
    try {
        const plan = await prisma.autoStrategicPlan.findUnique({
            where: { auditId: req.params.auditId },
        });

        if (!plan) {
            return res.status(404).json({ success: false, message: 'الخطة غير موجودة' });
        }

        // Parse JSON strings back to arrays/objects
        res.json({
            success: true,
            plan: {
                ...plan,
                strengths: JSON.parse(plan.strengths || '[]'),
                weaknesses: JSON.parse(plan.weaknesses || '[]'),
                opportunities: JSON.parse(plan.opportunities || '[]'),
                threats: JSON.parse(plan.threats || '[]'),
                suggestedGoals: JSON.parse(plan.suggestedGoals || '[]'),
            },
        });
    } catch (err) {
        console.error('CFO Plan Fetch Error:', err);
        res.status(500).json({ success: false, message: 'خطأ في جلب الخطة' });
    }
});

// ─────────────────────────────────────────────
// PATCH /api/cfo/plan/:planId/approve
// اعتماد الخطة — اختياري للمدير
// ─────────────────────────────────────────────
router.patch('/plan/:planId/approve', verifyToken, async (req, res) => {
    try {
        const updated = await prisma.autoStrategicPlan.update({
            where: { id: req.params.planId },
            data: { isApproved: true, approvedAt: new Date() },
        });

        res.json({
            success: true,
            plan: updated,
            message: 'تم اعتماد الخطة بنجاح ✅',
        });
    } catch (err) {
        console.error('CFO Plan Approve Error:', err);
        res.status(500).json({ success: false, message: 'خطأ في اعتماد الخطة' });
    }
});

// ─────────────────────────────────────────────
// PATCH /api/cfo/plan/:planId/edit
// تعديل نص الخطاب أو الأهداف يدوياً
// ─────────────────────────────────────────────
router.patch('/plan/:planId/edit', verifyToken, async (req, res) => {
    try {
        const { boardPitchText, suggestedGoals } = req.body;

        const updateData = {};
        if (boardPitchText) updateData.boardPitchText = boardPitchText;
        if (suggestedGoals) updateData.suggestedGoals = JSON.stringify(suggestedGoals);

        const updated = await prisma.autoStrategicPlan.update({
            where: { id: req.params.planId },
            data: updateData,
        });

        res.json({ success: true, plan: updated });
    } catch (err) {
        console.error('CFO Plan Edit Error:', err);
        res.status(500).json({ success: false, message: 'خطأ في تعديل الخطة' });
    }
});

// ─────────────────────────────────────────────
// GET /api/cfo/latest/:departmentId
// جلب آخر فحص وخطة لإدارة محددة
// ─────────────────────────────────────────────
router.get('/latest/:departmentId', verifyToken, async (req, res) => {
    try {
        const latestAudit = await prisma.financialAudit.findFirst({
            where: { departmentId: req.params.departmentId },
            orderBy: { createdAt: 'desc' },
            include: { strategicPlan: true },
        });

        if (!latestAudit) {
            return res.status(404).json({ success: false, message: 'لم يتم إجراء فحص بعد' });
        }

        // Parse JSON in plan if exists
        let plan = latestAudit.strategicPlan;
        if (plan) {
            plan = {
                ...plan,
                strengths: JSON.parse(plan.strengths || '[]'),
                weaknesses: JSON.parse(plan.weaknesses || '[]'),
                opportunities: JSON.parse(plan.opportunities || '[]'),
                threats: JSON.parse(plan.threats || '[]'),
                suggestedGoals: JSON.parse(plan.suggestedGoals || '[]'),
            };
        }

        res.json({
            success: true,
            audit: latestAudit,
            plan,
        });
    } catch (err) {
        console.error('CFO Latest Fetch Error:', err);
        res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
    }
});

module.exports = router;
