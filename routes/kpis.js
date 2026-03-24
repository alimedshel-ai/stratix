const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const { checkOwnership } = require('../middleware/ownership');

// ═══════════════════════════════════════════════════════
// /api/kpis  — CRUD كامل لمؤشرات الأداء الرئيسية (KPI)
// يتبع نفس نمط kpi-entries.js و initiatives.js
// ═══════════════════════════════════════════════════════

function getVersionId(req) {
    return req.query.versionId || req.body?.versionId || req.headers['x-version-id'];
}

function getEntityId(req) {
    return req.user?.activeEntityId || req.user?.entityId;
}

// ──────────────────────────────────────────────────────
// GET /api/kpis?versionId=xxx  — جلب كل مؤشرات الأداء
// ──────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
    try {
        const versionId = getVersionId(req);
        const entityId = getEntityId(req);
        const { objectiveId, status, perspective, limit = 100 } = req.query;

        let where = {};

        // ← يجب تمرير versionId أو entityId على الأقل
        if (versionId) {
            where.versionId = versionId;
        } else if (entityId) {
            // فلترة تلقائية عبر entity → version
            where.version = { entityId };
        } else if (!req.user?.isSuperAdmin) {
            return res.status(400).json({ error: 'versionId مطلوب' });
        }

        // فلاتر اختيارية
        if (objectiveId) where.objectiveId = objectiveId;
        if (status) where.status = status;
        if (perspective) where.bscPerspective = perspective;

        const kpis = await prisma.kPI.findMany({
            where,
            include: {
                objective: { select: { id: true, title: true } },
                entries: {
                    where: { status: 'CONFIRMED' },
                    orderBy: { periodEnd: 'desc' },
                    take: 1,
                    select: { value: true, periodEnd: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        res.json({ kpis, total: kpis.length });

    } catch (err) {
        console.error('GET /api/kpis error:', err);
        res.status(500).json({ error: 'خطأ في جلب مؤشرات الأداء' });
    }
});

// ──────────────────────────────────────────────────────
// GET /api/kpis/:id  — جلب مؤشر واحد مع سجله التاريخي
// ──────────────────────────────────────────────────────
router.get('/:id', verifyToken, checkOwnership('kPI'), async (req, res) => {
    try {
        const kpi = await prisma.kPI.findUnique({
            where: { id: req.params.id },
            include: {
                objective: { select: { id: true, title: true, perspective: true } },
                entries: {
                    where: { status: 'CONFIRMED' },
                    orderBy: { periodEnd: 'desc' },
                    take: 20
                },
                diagnoses: { orderBy: { createdAt: 'desc' }, take: 5 }
            }
        });

        if (!kpi) return res.status(404).json({ error: 'KPI غير موجود' });

        // حساب إحصائيات سريعة
        const values = kpi.entries.map(e => e.value);
        const latest = values[0] ?? null;
        const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
        const completion = kpi.target > 0 && latest !== null ? Math.round((latest / kpi.target) * 100) : null;

        res.json({ ...kpi, stats: { latest, avg, completion } });

    } catch (err) {
        console.error('GET /api/kpis/:id error:', err);
        res.status(500).json({ error: 'خطأ في جلب المؤشر' });
    }
});

// ──────────────────────────────────────────────────────
// POST /api/kpis  — إنشاء مؤشر جديد
// ──────────────────────────────────────────────────────
router.post('/', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const {
            versionId, objectiveId, name, nameAr, description,
            target, unit, frequency, dataSource, formula,
            warningThreshold, criticalThreshold, kpiType, bscPerspective, direction
        } = req.body;

        if (!versionId || !name || target === undefined) {
            return res.status(400).json({ error: 'versionId و name و target مطلوبة' });
        }

        // التحقق أن الـ version تتبع نفس الـ entity
        const version = await prisma.strategyVersion.findUnique({
            where: { id: versionId },
            select: { entityId: true }
        });
        if (!version) return res.status(404).json({ error: 'نسخة الاستراتيجية غير موجودة' });

        const userEntityId = getEntityId(req);
        if (userEntityId && version.entityId !== userEntityId && !req.user?.isSuperAdmin) {
            return res.status(403).json({ error: 'غير مصرح لك بإضافة مؤشرات في هذه النسخة' });
        }

        const kpi = await prisma.kPI.create({
            data: {
                versionId,
                objectiveId: objectiveId || null,
                name,
                nameAr: nameAr || null,
                description: description || null,
                target: parseFloat(target),
                unit: unit || '%',
                frequency: frequency || 'MONTHLY',
                dataSource: dataSource || null,
                formula: formula || null,
                warningThreshold: warningThreshold ? parseFloat(warningThreshold) : null,
                criticalThreshold: criticalThreshold ? parseFloat(criticalThreshold) : null,
                kpiType: kpiType || null,
                bscPerspective: bscPerspective || null,
                direction: direction || 'HIGHER_IS_BETTER',
                status: 'ON_TRACK'
            }
        });

        res.status(201).json(kpi);

    } catch (err) {
        console.error('POST /api/kpis error:', err);
        res.status(500).json({ error: 'خطأ في إنشاء المؤشر' });
    }
});

// ──────────────────────────────────────────────────────
// PATCH /api/kpis/:id  — تعديل مؤشر
// ──────────────────────────────────────────────────────
router.patch('/:id', verifyToken, checkPermission('EDITOR'), checkOwnership('kPI'), async (req, res) => {
    try {
        const allowed = [
            'name', 'nameAr', 'description', 'target', 'unit',
            'frequency', 'dataSource', 'formula', 'warningThreshold',
            'criticalThreshold', 'kpiType', 'bscPerspective', 'direction',
            'objectiveId', 'status'
        ];

        const updateData = {};
        allowed.forEach(field => {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        });

        if (['target', 'warningThreshold', 'criticalThreshold'].some(f => updateData[f] !== undefined)) {
            ['target', 'warningThreshold', 'criticalThreshold'].forEach(f => {
                if (updateData[f] !== undefined) updateData[f] = parseFloat(updateData[f]);
            });
        }

        const kpi = await prisma.kPI.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(kpi);

    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'KPI غير موجود' });
        console.error('PATCH /api/kpis/:id error:', err);
        res.status(500).json({ error: 'خطأ في تحديث المؤشر' });
    }
});

// ──────────────────────────────────────────────────────
// DELETE /api/kpis/:id  — حذف مؤشر (ADMIN+)
// ──────────────────────────────────────────────────────
router.delete('/:id', verifyToken, checkPermission('ADMIN'), checkOwnership('kPI'), async (req, res) => {
    try {
        await prisma.kPI.delete({ where: { id: req.params.id } });
        res.json({ message: 'تم حذف المؤشر بنجاح' });
    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'KPI غير موجود' });
        console.error('DELETE /api/kpis/:id error:', err);
        res.status(500).json({ error: 'خطأ في حذف المؤشر' });
    }
});

module.exports = router;
