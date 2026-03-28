// routes/scenarios.js
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/scenarios/:dept — جلب سيناريوهات القسم (Wizard)
router.get('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const entityId = req.user.entityId;

        const analysis = await prisma.departmentAnalysis.findFirst({
            where: {
                entityId,
                department: dept.toUpperCase(),
                type: 'SCENARIOS'
            }
        });

        if (!analysis) return res.json({ optimistic: '', realistic: '', pessimistic: '' });
        res.json(JSON.parse(analysis.data));
    } catch (error) {
        console.error('Error fetching scenarios:', error);
        res.status(500).json({ error: 'Failed to fetch scenarios' });
    }
});

// POST /api/scenarios/:dept — حفظ سيناريوهات القسم (Wizard)
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
                    type: 'SCENARIOS'
                }
            },
            update: {
                data: JSON.stringify(data),
                updatedAt: new Date()
            },
            create: {
                entityId,
                department: dept.toUpperCase(),
                type: 'SCENARIOS',
                data: JSON.stringify(data)
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving scenarios:', error);
        res.status(500).json({ error: 'Failed to save scenarios' });
    }
});

module.exports = router;
