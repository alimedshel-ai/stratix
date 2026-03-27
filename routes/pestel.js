// routes/pestel.js
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/pestel/:dept — جلب البيانات المحفوظة
router.get('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const entityId = req.user.entityId;

        const analysis = await prisma.departmentAnalysis.findFirst({
            where: {
                entityId,
                department: dept.toUpperCase(),
                type: 'PESTEL'
            }
        });

        if (!analysis) return res.json({});
        res.json(JSON.parse(analysis.data));
    } catch (error) {
        console.error('Error fetching PESTEL:', error);
        res.status(500).json({ error: 'Failed to fetch PESTEL data' });
    }
});

// POST /api/pestel/:dept — حفظ البيانات
router.post('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const data = req.body;
        const entityId = req.user.entityId;

        // تحديث أو إنشاء
        await prisma.departmentAnalysis.upsert({
            where: {
                entityId_department_type: {
                    entityId,
                    department: dept.toUpperCase(),
                    type: 'PESTEL'
                }
            },
            update: {
                data: JSON.stringify(data),
                updatedAt: new Date()
            },
            create: {
                entityId,
                department: dept.toUpperCase(),
                type: 'PESTEL',
                data: JSON.stringify(data)
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving PESTEL:', error);
        res.status(500).json({ error: 'Failed to save PESTEL data' });
    }
});

module.exports = router;
