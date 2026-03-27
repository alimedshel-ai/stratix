// routes/scenarios.js
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/scenarios/:dept — جلب البيانات
router.get('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const entityId = req.user.entityId;

        const scenarios = await prisma.departmentScenario.findUnique({
            where: {
                entityId_departmentKey: {
                    entityId,
                    departmentKey: dept.toUpperCase()
                }
            }
        });

        if (!scenarios) return res.json({});
        res.json(scenarios);
    } catch (error) {
        console.error('Error fetching scenarios:', error);
        res.status(500).json({ error: 'Failed to fetch scenario data' });
    }
});

// POST /api/scenarios/:dept — حفظ البيانات
router.post('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const { optimistic, realistic, pessimistic } = req.body;
        const entityId = req.user.entityId;

        await prisma.departmentScenario.upsert({
            where: {
                entityId_departmentKey: {
                    entityId,
                    departmentKey: dept.toUpperCase()
                }
            },
            update: {
                optimistic, realistic, pessimistic,
                updatedAt: new Date()
            },
            create: {
                entityId,
                departmentKey: dept.toUpperCase(),
                optimistic, realistic, pessimistic
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving scenarios:', error);
        res.status(500).json({ error: 'Failed to save scenario data' });
    }
});

module.exports = router;
