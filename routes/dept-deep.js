/**
 * 📊 Dept-Deep Data API — المرحلة 3
 * نقل بيانات الفحص العميق من localStorage إلى DB
 * 
 * GET  /api/dept-deep/:entityId         → جلب كل الإدارات
 * GET  /api/dept-deep/:entityId/:dept   → جلب إدارة واحدة
 * POST /api/dept-deep/:entityId         → حفظ كل الإدارات (bulk)
 * PUT  /api/dept-deep/:entityId/:dept   → حفظ/تحديث إدارة واحدة
 */

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// ── GET /api/dept-deep/:entityId — جلب كل بيانات الفحص العميق ──
router.get('/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;

        const records = await prisma.deptDeepData.findMany({
            where: { entityId },
            orderBy: { deptKey: 'asc' },
        });

        // تحويل لنفس هيكل localStorage: { compliance: {...}, finance: {...}, ... }
        const data = {};
        for (const rec of records) {
            try {
                data[rec.deptKey] = JSON.parse(rec.payload);
            } catch (e) {
                data[rec.deptKey] = {};
            }
        }

        res.json({ success: true, data, lastUpdated: records[0]?.updatedAt || null });
    } catch (err) {
        console.error('❌ [dept-deep] GET error:', err.message);
        res.status(500).json({ success: false, error: 'فشل جلب البيانات' });
    }
});

// ── GET /api/dept-deep/:entityId/:dept — جلب إدارة واحدة ──
router.get('/:entityId/:dept', verifyToken, async (req, res) => {
    try {
        const { entityId, dept } = req.params;

        const record = await prisma.deptDeepData.findUnique({
            where: { entityId_deptKey: { entityId, deptKey: dept } },
        });

        if (!record) {
            return res.json({ success: true, data: null });
        }

        res.json({
            success: true,
            data: JSON.parse(record.payload),
            completed: record.completed,
            updatedAt: record.updatedAt,
        });
    } catch (err) {
        console.error('❌ [dept-deep] GET single error:', err.message);
        res.status(500).json({ success: false, error: 'فشل جلب البيانات' });
    }
});

// ── POST /api/dept-deep/:entityId — حفظ كل الإدارات (bulk) ──
// يستقبل: { data: { compliance: {...}, finance: {...}, ... } }
router.post('/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;
        const { data } = req.body;

        if (!data || typeof data !== 'object') {
            return res.status(400).json({ success: false, error: 'بيانات غير صالحة' });
        }

        const VALID_DEPTS = ['compliance', 'finance', 'sales', 'hr', 'marketing', 'operations', 'support'];
        const results = [];

        for (const [deptKey, payload] of Object.entries(data)) {
            if (!VALID_DEPTS.includes(deptKey)) continue;

            const completed = payload?.completed === true;
            const record = await prisma.deptDeepData.upsert({
                where: { entityId_deptKey: { entityId, deptKey } },
                update: {
                    payload: JSON.stringify(payload),
                    completed,
                    completedAt: completed ? new Date() : null,
                    userId: req.user?.id || null,
                },
                create: {
                    entityId,
                    deptKey,
                    payload: JSON.stringify(payload),
                    completed,
                    completedAt: completed ? new Date() : null,
                    userId: req.user?.id || null,
                },
            });
            results.push({ deptKey, id: record.id, completed });
        }

        res.json({ success: true, saved: results.length, results });
    } catch (err) {
        console.error('❌ [dept-deep] POST bulk error:', err.message);
        res.status(500).json({ success: false, error: 'فشل حفظ البيانات' });
    }
});

// ── PUT /api/dept-deep/:entityId/:dept — حفظ/تحديث إدارة واحدة ──
// يستقبل: { answers: {...}, challenges: [...], ... }
router.put('/:entityId/:dept', verifyToken, async (req, res) => {
    try {
        const { entityId, dept } = req.params;
        const payload = req.body;

        const VALID_DEPTS = ['compliance', 'finance', 'sales', 'hr', 'marketing', 'operations', 'support'];
        if (!VALID_DEPTS.includes(dept)) {
            return res.status(400).json({ success: false, error: 'إدارة غير صالحة' });
        }

        const completed = payload?.completed === true;
        const record = await prisma.deptDeepData.upsert({
            where: { entityId_deptKey: { entityId, deptKey: dept } },
            update: {
                payload: JSON.stringify(payload),
                completed,
                completedAt: completed ? new Date() : null,
                userId: req.user?.id || null,
            },
            create: {
                entityId,
                deptKey: dept,
                payload: JSON.stringify(payload),
                completed,
                completedAt: completed ? new Date() : null,
                userId: req.user?.id || null,
            },
        });

        res.json({ success: true, id: record.id, completed, updatedAt: record.updatedAt });
    } catch (err) {
        console.error('❌ [dept-deep] PUT error:', err.message);
        res.status(500).json({ success: false, error: 'فشل حفظ البيانات' });
    }
});

module.exports = router;
