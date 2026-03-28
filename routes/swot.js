// routes/swot.js — نقطة نهاية SWOT لمديري الإدارات
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/swot/:dept — جلب بيانات SWOT
router.get('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const entityId = req.user.activeEntityId || req.user.entityId;

        const analysis = await prisma.departmentAnalysis.findFirst({
            where: {
                entityId,
                department: dept.toUpperCase(),
                type: 'SWOT'
            }
        });

        if (!analysis) return res.json({});
        res.json(JSON.parse(analysis.data));
    } catch (error) {
        console.error('Error fetching SWOT:', error);
        res.status(500).json({ error: 'Failed to fetch SWOT data' });
    }
});

// POST /api/swot/:dept — حفظ بيانات SWOT
router.post('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const data = req.body;
        const entityId = req.user.activeEntityId || req.user.entityId;

        await prisma.departmentAnalysis.upsert({
            where: {
                entityId_department_type: {
                    entityId,
                    department: dept.toUpperCase(),
                    type: 'SWOT'
                }
            },
            update: {
                data: JSON.stringify(data),
                updatedAt: new Date()
            },
            create: {
                entityId,
                department: dept.toUpperCase(),
                type: 'SWOT',
                data: JSON.stringify(data)
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving SWOT:', error);
        res.status(500).json({ error: 'Failed to save SWOT data' });
    }
});

module.exports = router;
