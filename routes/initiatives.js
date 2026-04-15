const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
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
    let key = null;

    if (user.dept) key = user.dept.toLowerCase();
    else if (user.departmentRole) key = user.departmentRole.toLowerCase();
    else if (user.userCategory && user.userCategory.startsWith('DEPT_')) {
        key = user.userCategory.replace('DEPT_', '').toLowerCase();
    }

    if (!key) return null;

    const keyMapping = {
        'ops': 'operations',
        'service': 'cs',
        'legal': 'compliance',
        'pmo': 'projects'
    };

    return keyMapping[key] || key;
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

// ──────────────────────────────────────────────────────
// GET /api/initiatives/:dept — جلب مبادرات القسم (Wizard)
// ──────────────────────────────────────────────────────
router.get('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const entityId = req.user.entityId;

        const analysis = await prisma.departmentAnalysis.findFirst({
            where: {
                entityId,
                department: dept.toUpperCase(),
                type: 'INITIATIVES'
            }
        });

        if (!analysis) return res.json({ initiatives: [] });
        res.json(JSON.parse(analysis.data));
    } catch (error) {
        console.error('Error fetching departmental initiatives:', error);
        res.status(500).json({ error: 'Failed to fetch departmental initiatives' });
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


// ──────────────────────────────────────────────────────
// POST /api/initiatives/:dept — حفظ مبادرات القسم (Wizard)
// ──────────────────────────────────────────────────────
router.post('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const data = req.body;
        const entityId = req.user.entityId;

        await prisma.departmentAnalysis.upsert({
            where: {
                entityId_department_type: {
                    entityId,
                    department: dept.toUpperCase(),
                    type: 'INITIATIVES'
                }
            },
            update: {
                data: JSON.stringify(data),
                updatedAt: new Date()
            },
            create: {
                entityId,
                department: dept.toUpperCase(),
                type: 'INITIATIVES',
                data: JSON.stringify(data)
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving departmental initiatives:', error);
        res.status(500).json({ error: 'Failed to save departmental initiatives' });
    }
});

// ============================================================
// 1. إصلاح parseBudget — يتعامل مع "20,000 - 50,000 ر.س"
// ============================================================
function parseBudget(raw) {
    if (!raw || raw === 'قيد الدراسة') return null;
    if (typeof raw === 'number') return raw;

    // إزالة كل شيء ما عدا الأرقام والفواصل والنقاط والمسافات والشرطة
    const cleaned = String(raw).replace(/[^\d,.\s-]/g, '');
    const nums = cleaned.split('-')
        .map(s => parseFloat(s.replace(/,/g, '').trim()))
        .filter(n => !isNaN(n) && n > 0);

    if (nums.length === 0) return null;
    if (nums.length === 1) return nums[0];
    return Math.round((nums[0] + nums[nums.length - 1]) / 2);
}

/**
 * توحيد الأولويات حسب الـ Schema
 */
function normalizePriority(p) {
    const map = { 'عالية': 'HIGH', 'high': 'HIGH', 'متوسطة': 'MEDIUM', 'medium': 'MEDIUM', 'منخفضة': 'LOW', 'low': 'LOW' };
    return map[(p || '').toLowerCase()] || 'MEDIUM';
}

// ============================================================
// 2. إصلاح approve — حذف القديم قبل الإنشاء لمنع التكرار
// ============================================================
router.post('/approve/:dept', verifyToken, async (req, res) => {
    try {
        const dept = req.params.dept.toUpperCase();
        const entityId = req.user.activeEntityId || req.user.entityId;

        let activeVersion = await prisma.strategyVersion.findFirst({
            where: { entityId, isActive: true },
            select: { id: true },
        });
        if (!activeVersion) {
            activeVersion = await prisma.strategyVersion.create({
                data: {
                    entityId,
                    versionNumber: 1,
                    name: 'الخطة الاستراتيجية الأولى',
                    status: 'ACTIVE',
                    isActive: true,
                    createdBy: req.user.id,
                    activatedAt: new Date()
                },
                select: { id: true }
            });
        }
        const versionId = activeVersion.id;

        // جلب المسودة
        const draft = await prisma.departmentAnalysis.findUnique({
            where: {
                entityId_department_type: { entityId, department: dept, type: 'INITIATIVES' },
            },
        });
        if (!draft) return res.status(404).json({ error: 'لا توجد مسودة مبادرات' });

        let drafts = [];
        try {
            const parsed = JSON.parse(draft.data);
            drafts = Array.isArray(parsed) ? parsed : (parsed.initiatives || []);
        } catch {
            return res.status(400).json({ error: 'بيانات المسودة تالفة' });
        }
        if (drafts.length === 0) return res.status(400).json({ error: 'المسودة فارغة' });

        // ✅ حذف المبادرات والمشاريع القديمة المولّدة تلقائياً لمنع التكرار
        await prisma.strategicProject.deleteMany({
            where: { versionId, description: { contains: 'auto:' + dept } },
        });
        await prisma.strategicInitiative.deleteMany({
            where: { versionId, autoCreated: true, category: dept },
        });

        // إنشاء المبادرات الجديدة - مع معالجة التكرار
        const initiatives = [];
        const projects = [];
        const processedTitles = new Set();

        for (const d of drafts) {
            const title = (d.title || d.name || 'مبادرة غير مسماة').trim();

            // تخطي إذا تم معالجة هذا العنوان في هذه الدورة لمنع تكرار الـ Create في نفس الطلب
            if (processedTitles.has(title)) continue;
            processedTitles.add(title);

            const budget = parseBudget(d.budget);

            // استخدام upsert لضمان عدم الفشل في حالة وجود مبادرة يدوية بنفس الاسم
            const initiative = await prisma.strategicInitiative.upsert({
                where: {
                    versionId_title: { versionId, title }
                },
                update: {
                    description: d.description ?? null,
                    owner: d.owner ?? null,
                    budget,
                    priority: normalizePriority(d.priority),
                    startDate: d.startDate ? new Date(d.startDate) : null,
                    endDate: d.endDate ? new Date(d.endDate) : null,
                    category: dept,
                    autoCreated: true,
                },
                create: {
                    versionId,
                    title,
                    description: d.description ?? null,
                    owner: d.owner ?? null,
                    status: 'PLANNED',
                    budget,
                    priority: normalizePriority(d.priority),
                    startDate: d.startDate ? new Date(d.startDate) : null,
                    endDate: d.endDate ? new Date(d.endDate) : null,
                    category: dept,
                    autoCreated: true,
                },
            });
            initiatives.push(initiative);

            // إنشاء مشروع مرتبط (هنا نستخدم create لأن المشاريع ليس لها Unique Name بالدرورة في الـ Schema، 
            // ولكننا قمنا بحذف القديم الذي يحتوي على auto:dept في البداية)
            const project = await prisma.strategicProject.create({
                data: {
                    versionId,
                    name: `مشروع: ${title}`,
                    description: `auto:${dept}`,
                    initiative: initiative.id,
                    objective: d.parent ?? null,
                    status: 'planning',
                    progress: 0,
                    manager: d.owner ?? null,
                    startDate: d.startDate ? new Date(d.startDate) : null,
                    endDate: d.endDate ? new Date(d.endDate) : null,
                },
            });
            projects.push(project);
        }

        // تحديث المسودة
        await prisma.departmentAnalysis.update({
            where: {
                entityId_department_type: { entityId, department: dept, type: 'INITIATIVES' },
            },
            data: {
                data: JSON.stringify({
                    _approved: true,
                    _approvedAt: new Date().toISOString(),
                    initiatives: drafts,
                }),
            },
        });

        res.json({
            success: true,
            message: `تم اعتماد ${initiatives.length} مبادرة وإنشاء ${projects.length} مشروع`,
            initiativesCount: initiatives.length,
            projectsCount: projects.length,
        });

    } catch (err) {
        console.error('Initiative Approval Error:', err);
        res.status(500).json({ error: 'فشل الاعتماد', detail: err.message });
    }
});

module.exports = router;
