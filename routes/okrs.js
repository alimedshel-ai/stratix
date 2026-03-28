// routes/okrs.js
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/okrs/:dept — جلب OKRs القسم (Wizard)
router.get('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const entityId = req.user.entityId;

        const analysis = await prisma.departmentAnalysis.findFirst({
            where: {
                entityId,
                department: dept.toUpperCase(),
                type: 'OKRS'
            }
        });

        if (!analysis) return res.json([]);
        res.json(JSON.parse(analysis.data));
    } catch (error) {
        console.error('Error fetching OKRs:', error);
        res.status(500).json({ error: 'Failed to fetch OKR data' });
    }
});

// POST /api/okrs/:dept — حفظ OKRs القسم (Wizard)
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
                    type: 'OKRS'
                }
            },
            update: {
                data: JSON.stringify(data),
                updatedAt: new Date()
            },
            create: {
                entityId,
                department: dept.toUpperCase(),
                type: 'OKRS',
                data: JSON.stringify(data)
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving OKRs:', error);
        res.status(500).json({ error: 'Failed to save OKR data' });
    }
});

module.exports = router;
