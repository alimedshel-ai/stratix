const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ──────────────────────────────────────────────────────
// GET /api/dept/analysis — جلب أي تحليل للقسم (Generic)
// ──────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
    try {
        const { dept, type } = req.query;
        const entityId = req.user.activeEntityId || req.user.entityId;

        if (!dept || !type) {
            return res.status(400).json({ error: 'dept and type are required' });
        }

        // تنظيف النوع من لاحقة القسم إذا وُجدت (مثلاً PESTEL_HR -> PESTEL)
        const cleanType = type.split('_')[0].toUpperCase();

        const analysis = await prisma.departmentAnalysis.findFirst({
            where: {
                entityId,
                department: dept.toUpperCase(),
                type: cleanType
            }
        });

        if (!analysis) return res.json({ success: true, data: null });

        res.json({
            success: true,
            data: JSON.parse(analysis.data),
            updatedAt: analysis.updatedAt
        });
    } catch (error) {
        console.error('Error fetching department analysis:', error);
        res.status(500).json({ error: 'Failed to fetch department analysis' });
    }
});

// ──────────────────────────────────────────────────────
// POST /api/dept/analysis — حفظ أي تحليل للقسم (Generic)
// ──────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
    try {
        const { dept, type, data } = req.body;
        const entityId = req.user.activeEntityId || req.user.entityId;

        if (!dept || !type) {
            return res.status(400).json({ error: 'dept and type are required' });
        }

        const cleanType = type.split('_')[0].toUpperCase();

        await prisma.departmentAnalysis.upsert({
            where: {
                entityId_department_type: {
                    entityId,
                    department: dept.toUpperCase(),
                    type: cleanType
                }
            },
            update: {
                data: JSON.stringify(data),
                updatedAt: new Date()
            },
            create: {
                entityId,
                department: dept.toUpperCase(),
                type: cleanType,
                data: JSON.stringify(data)
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving department analysis:', error);
        res.status(500).json({ error: 'Failed to save department analysis' });
    }
});

module.exports = router;
