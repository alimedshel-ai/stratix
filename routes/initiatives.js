const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');

// ── Middleware: extract entityId from token ──
function getEntityId(req) {
    return req.user?.activeEntityId || req.user?.entityId || req.query.entityId;
}

function getVersionId(req) {
    return req.query.versionId || req.headers['x-version-id'];
}

// ── helper: استخراج كود الإدارة من بيانات المستخدم في الـ JWT ──────────────
// يدعم عدة مصادر:
//   req.user.departmentRole → 'FINANCE', 'HR', 'SALES' ...
//   req.user.userCategory   → 'DEPT_FINANCE', 'DEPT_HR' ...
//   req.user.dept           → 'finance', 'hr' ...
function resolveDeptKey(user) {
    if (!user) return null;

    // الحقل المباشر (الأفضل)
    if (user.dept) return user.dept.toLowerCase();

    // departmentRole  → 'FINANCE' → 'finance'
    if (user.departmentRole) return user.departmentRole.toLowerCase();

    // userCategory → 'DEPT_FINANCE' → 'finance'
    if (user.userCategory && user.userCategory.startsWith('DEPT_')) {
        return user.userCategory.replace('DEPT_', '').toLowerCase();
    }

    return null;
}

// ── helper: بناء شرط فلترة Prisma لمدير الإدارة ──────────────────────────────
function buildDeptWhere(deptKey) {
    if (!deptKey) return null;
    // category أو owner يحتويان على كود الإدارة (case-insensitive)
    // SQLite لا يدعم mode: 'insensitive' — نستخدم contains فقط والـ deptKey بأحرف صغيرة
    return [
        { category: { contains: deptKey } },
        { category: { contains: deptKey.toUpperCase() } },
        { owner: { contains: deptKey } },
        { owner: { contains: deptKey.toUpperCase() } },
    ];
}

// ══════════════════════════════════════════
// GET /api/initiatives — جلب كل المبادرات
// ══════════════════════════════════════════
router.get('/', verifyToken, async (req, res) => {
    try {
        const versionId = getVersionId(req);
        if (!versionId) {
            return res.status(400).json({ error: 'versionId مطلوب' });
        }

        let where = { versionId };

        // 🛡️ فلترة قسرية لمدير الإدارة — يرى مبادراته فقط
        if (req.user?.userType === 'DEPT_MANAGER') {
            const deptKey = resolveDeptKey(req.user);
            if (deptKey) {
                const deptConditions = buildDeptWhere(deptKey);
                where.OR = deptConditions;
                console.debug(`[Initiatives] DEPT_MANAGER filter: dept=${deptKey}`);
            }
        }

        const initiatives = await prisma.strategicInitiative.findMany({
            where,
            include: {
                tasks: { orderBy: { order: 'asc' } },
                kpis: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            initiatives,
            meta: {
                total: initiatives.length,
                filteredByDept: req.user?.userType === 'DEPT_MANAGER'
            }
        });
    } catch (err) {
        console.error('GET /api/initiatives error:', err);
        res.status(500).json({ error: 'خطأ في جلب المبادرات' });
    }
});

// ══════════════════════════════════════════
// GET /api/initiatives/:id — جلب مبادرة واحدة
// ══════════════════════════════════════════
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const initiative = await prisma.strategicInitiative.findUnique({
            where: { id: req.params.id },
            include: {
                tasks: { orderBy: { order: 'asc' } },
                kpis: true
            }
        });

        if (!initiative) {
            return res.status(404).json({ error: 'المبادرة غير موجودة' });
        }

        res.json({ initiative });
    } catch (err) {
        console.error('GET /api/initiatives/:id error:', err);
        res.status(500).json({ error: 'خطأ في جلب المبادرة' });
    }
});

// ══════════════════════════════════════════
// POST /api/initiatives — إنشاء مبادرة جديدة
// ══════════════════════════════════════════
router.post('/', verifyToken, async (req, res) => {
    try {
        const versionId = getVersionId(req) || req.body.versionId;
        if (!versionId) {
            return res.status(400).json({ error: 'versionId مطلوب' });
        }

        const { title, description, owner, status, startDate, endDate, progress, budget, budgetSpent, priority, category, kpiId, departmentKey } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'اسم المبادرة مطلوب' });
        }

        const initiative = await prisma.strategicInitiative.create({
            data: {
                versionId,
                title,
                description: description || null,
                owner: owner || null,
                status: status || 'PLANNED',
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                progress: progress ? parseFloat(progress) : 0,
                budget: budget ? parseFloat(budget) : null,
                budgetSpent: budgetSpent ? parseFloat(budgetSpent) : 0,
                priority: priority || 'MEDIUM',
                category: category || null,
                kpiId: kpiId || null,
                // دعم مستقبلي: ربط صريح بالإدارة إذا أُضيف للـ schema
                // departmentKey: departmentKey || resolveDeptKey(req.user) || null,
            },
            include: { tasks: true, kpis: true }
        });

        res.status(201).json({ initiative });
    } catch (err) {
        console.error('POST /api/initiatives error:', err);
        res.status(500).json({ error: 'خطأ في إنشاء المبادرة' });
    }
});

// ══════════════════════════════════════════
// PUT /api/initiatives/:id — تعديل مبادرة
// ══════════════════════════════════════════
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { title, description, owner, status, startDate, endDate, progress, budget, budgetSpent, priority, category, kpiId } = req.body;

        const existing = await prisma.strategicInitiative.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'المبادرة غير موجودة' });
        }

        const initiative = await prisma.strategicInitiative.update({
            where: { id: req.params.id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(owner !== undefined && { owner }),
                ...(status !== undefined && { status }),
                ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(progress !== undefined && { progress: parseFloat(progress) }),
                ...(budget !== undefined && { budget: parseFloat(budget) }),
                ...(budgetSpent !== undefined && { budgetSpent: parseFloat(budgetSpent) }),
                ...(priority !== undefined && { priority }),
                ...(category !== undefined && { category }),
                ...(kpiId !== undefined && { kpiId }),
            },
            include: { tasks: true, kpis: true }
        });

        res.json({ initiative });
    } catch (err) {
        console.error('PUT /api/initiatives/:id error:', err);
        res.status(500).json({ error: 'خطأ في تعديل المبادرة' });
    }
});

// ══════════════════════════════════════════
// DELETE /api/initiatives/:id — حذف مبادرة
// ══════════════════════════════════════════
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const existing = await prisma.strategicInitiative.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'المبادرة غير موجودة' });
        }

        await prisma.strategicInitiative.delete({ where: { id: req.params.id } });

        res.json({ success: true, message: 'تم حذف المبادرة' });
    } catch (err) {
        console.error('DELETE /api/initiatives/:id error:', err);
        res.status(500).json({ error: 'خطأ في حذف المبادرة' });
    }
});

// ══════════════════════════════════════════
// GET /api/initiatives/stats/summary — ملخص الميزانية
// ══════════════════════════════════════════
router.get('/stats/summary', verifyToken, async (req, res) => {
    try {
        const versionId = getVersionId(req);
        if (!versionId) {
            return res.status(400).json({ error: 'versionId مطلوب' });
        }

        const initiatives = await prisma.strategicInitiative.findMany({
            where: { versionId }
        });

        const total = initiatives.length;
        const completed = initiatives.filter(i => i.status === 'COMPLETED').length;
        const inProgress = initiatives.filter(i => i.status === 'IN_PROGRESS').length;
        const totalBudget = initiatives.reduce((s, i) => s + (i.budget || 0), 0);
        const totalSpent = initiatives.reduce((s, i) => s + (i.budgetSpent || 0), 0);
        const avgProgress = total > 0 ? Math.round(initiatives.reduce((s, i) => s + (i.progress || 0), 0) / total) : 0;
        const burnRate = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

        // مبادرات في خطر ميزانية
        const atRisk = initiatives.filter(i => {
            if (!i.budget || i.budget === 0 || i.status === 'COMPLETED') return false;
            const burnPct = (i.budgetSpent || 0) / i.budget * 100;
            const ratio = (i.progress || 0) > 0 ? burnPct / i.progress : (burnPct > 0 ? 999 : 0);
            return burnPct > 100 || (ratio > 1.8 && burnPct >= 60);
        }).length;

        res.json({
            total,
            completed,
            inProgress,
            planned: initiatives.filter(i => i.status === 'PLANNED').length,
            totalBudget,
            totalSpent,
            avgProgress,
            burnRate,
            atRisk
        });
    } catch (err) {
        console.error('GET /api/initiatives/stats/summary error:', err);
        res.status(500).json({ error: 'خطأ في جلب الملخص' });
    }
});

module.exports = router;
