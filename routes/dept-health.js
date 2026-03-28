// routes/dept-health.js
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dept-health/:dept — جلب البيانات المحفوظة
router.get('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const entityId = req.user.activeEntityId || req.user.entityId;

        const health = await prisma.departmentHealth.findUnique({
            where: {
                entityId_departmentKey: {
                    entityId,
                    departmentKey: dept.toUpperCase()
                }
            }
        });

        if (!health) return res.json({});
        res.json(health);
    } catch (error) {
        console.error('Error fetching Dept Health:', error);
        res.status(500).json({ error: 'Failed to fetch department health data' });
    }
});

// POST /api/dept-health/:dept — حفظ البيانات
router.post('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const { skills, processes, culture, resources, satisfaction, productivity } = req.body;
        const entityId = req.user.activeEntityId || req.user.entityId;

        await prisma.departmentHealth.upsert({
            where: {
                entityId_departmentKey: {
                    entityId,
                    departmentKey: dept.toUpperCase()
                }
            },
            update: {
                skills, processes, culture, resources, satisfaction, productivity,
                updatedAt: new Date()
            },
            create: {
                entityId,
                departmentKey: dept.toUpperCase(),
                skills, processes, culture, resources, satisfaction, productivity
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving Dept Health:', error);
        res.status(500).json({ error: 'Failed to save department health data' });
    }
});

module.exports = router;
