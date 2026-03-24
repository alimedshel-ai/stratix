const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

// ═══════════════════════════════════════════════════════
// /api/tasks  — إدارة مهام المبادرات (InitiativeTask)
// يتبع نفس نمط initiatives.js
// ملاحظة: المهام في الـ Schema اسمها InitiativeTask
//          وترتبط بـ StrategicInitiative عبر initiativeId
// ═══════════════════════════════════════════════════════

function getVersionId(req) {
    return req.query.versionId || req.headers['x-version-id'];
}

function getEntityId(req) {
    return req.user?.activeEntityId || req.user?.entityId;
}

// ──────────────────────────────────────────────────────
// GET /api/tasks  — جلب المهام
// يدعم الفلترة بـ: versionId, initiativeId, status
// ──────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
    try {
        const { initiativeId, status, limit = 200 } = req.query;
        const versionId = getVersionId(req);
        const entityId = getEntityId(req);

        // بناء شرط الفلترة
        let where = {};

        if (initiativeId) {
            // الأبسط والأسرع: مهام مبادرة محددة
            where.initiativeId = initiativeId;
        } else if (versionId) {
            // مهام كل مبادرات نسخة معينة
            where.initiative = { versionId };
        } else if (entityId && !req.user?.isSuperAdmin) {
            // فلترة تلقائية عبر entity → version
            where.initiative = { version: { entityId } };
        }
        // SUPER_ADMIN: يرى كل شيء بدون فلتر

        if (status) where.status = status;

        const tasks = await prisma.initiativeTask.findMany({
            where,
            include: {
                initiative: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        owner: true,
                        version: { select: { id: true, entityId: true } }
                    }
                }
            },
            orderBy: [
                { initiative: { createdAt: 'desc' } },
                { order: 'asc' }
            ],
            take: parseInt(limit)
        });

        // تجميع إحصائيات سريعة
        const stats = {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'PENDING').length,
            active: tasks.filter(t => t.status === 'ACTIVE').length,
            completed: tasks.filter(t => t.status === 'COMPLETED').length,
        };

        res.json({ tasks, stats });

    } catch (err) {
        console.error('GET /api/tasks error:', err);
        res.status(500).json({ error: 'خطأ في جلب المهام' });
    }
});

// ──────────────────────────────────────────────────────
// GET /api/tasks/:id  — جلب مهمة واحدة
// ──────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const task = await prisma.initiativeTask.findUnique({
            where: { id: req.params.id },
            include: {
                initiative: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        versionId: true,
                        version: { select: { entityId: true } }
                    }
                }
            }
        });

        if (!task) return res.status(404).json({ error: 'المهمة غير موجودة' });

        // فحص الملكية يدوياً
        const userEntityId = getEntityId(req);
        if (userEntityId && task.initiative?.version?.entityId !== userEntityId && !req.user?.isSuperAdmin) {
            return res.status(403).json({ error: 'وصول غير مصرح لهذه المهمة' });
        }

        res.json(task);

    } catch (err) {
        console.error('GET /api/tasks/:id error:', err);
        res.status(500).json({ error: 'خطأ في جلب المهمة' });
    }
});

// ──────────────────────────────────────────────────────
// POST /api/tasks  — إنشاء مهمة جديدة
// ──────────────────────────────────────────────────────
router.post('/', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { initiativeId, title, dueDate, order } = req.body;

        if (!initiativeId || !title) {
            return res.status(400).json({ error: 'initiativeId و title مطلوبان' });
        }

        // التحقق أن المبادرة تتبع نفس الـ entity
        const initiative = await prisma.strategicInitiative.findUnique({
            where: { id: initiativeId },
            select: { id: true, version: { select: { entityId: true } } }
        });

        if (!initiative) return res.status(404).json({ error: 'المبادرة غير موجودة' });

        const userEntityId = getEntityId(req);
        if (userEntityId && initiative.version?.entityId !== userEntityId && !req.user?.isSuperAdmin) {
            return res.status(403).json({ error: 'غير مصرح لك بإضافة مهام في هذه المبادرة' });
        }

        // تحديد الترتيب تلقائياً لو ما تم تمريره
        let taskOrder = order;
        if (taskOrder === undefined) {
            const lastTask = await prisma.initiativeTask.findFirst({
                where: { initiativeId },
                orderBy: { order: 'desc' },
                select: { order: true }
            });
            taskOrder = (lastTask?.order ?? -1) + 1;
        }

        const task = await prisma.initiativeTask.create({
            data: {
                initiativeId,
                title,
                status: 'PENDING',
                dueDate: dueDate ? new Date(dueDate) : null,
                order: taskOrder
            },
            include: {
                initiative: { select: { id: true, title: true } }
            }
        });

        res.status(201).json(task);

    } catch (err) {
        console.error('POST /api/tasks error:', err);
        res.status(500).json({ error: 'خطأ في إنشاء المهمة' });
    }
});

// ──────────────────────────────────────────────────────
// PATCH /api/tasks/:id  — تعديل مهمة (status, title, dueDate)
// ──────────────────────────────────────────────────────
router.patch('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { title, status, dueDate, order } = req.body;

        // فحص الملكية
        const existing = await prisma.initiativeTask.findUnique({
            where: { id: req.params.id },
            include: { initiative: { select: { version: { select: { entityId: true } } } } }
        });

        if (!existing) return res.status(404).json({ error: 'المهمة غير موجودة' });

        const userEntityId = getEntityId(req);
        if (userEntityId && existing.initiative?.version?.entityId !== userEntityId && !req.user?.isSuperAdmin) {
            return res.status(403).json({ error: 'وصول غير مصرح لهذه المهمة' });
        }

        const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: `status يجب أن يكون: ${validStatuses.join(', ')}` });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (status !== undefined) updateData.status = status;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (order !== undefined) updateData.order = parseInt(order);

        const task = await prisma.initiativeTask.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(task);

    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'المهمة غير موجودة' });
        console.error('PATCH /api/tasks/:id error:', err);
        res.status(500).json({ error: 'خطأ في تحديث المهمة' });
    }
});

// ──────────────────────────────────────────────────────
// DELETE /api/tasks/:id  — حذف مهمة (ADMIN+)
// ──────────────────────────────────────────────────────
router.delete('/:id', verifyToken, checkPermission('ADMIN'), async (req, res) => {
    try {
        const existing = await prisma.initiativeTask.findUnique({
            where: { id: req.params.id },
            include: { initiative: { select: { version: { select: { entityId: true } } } } }
        });

        if (!existing) return res.status(404).json({ error: 'المهمة غير موجودة' });

        const userEntityId = getEntityId(req);
        if (userEntityId && existing.initiative?.version?.entityId !== userEntityId && !req.user?.isSuperAdmin) {
            return res.status(403).json({ error: 'وصول غير مصرح لهذه المهمة' });
        }

        await prisma.initiativeTask.delete({ where: { id: req.params.id } });
        res.json({ message: 'تم حذف المهمة بنجاح' });

    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'المهمة غير موجودة' });
        console.error('DELETE /api/tasks/:id error:', err);
        res.status(500).json({ error: 'خطأ في حذف المهمة' });
    }
});

module.exports = router;
