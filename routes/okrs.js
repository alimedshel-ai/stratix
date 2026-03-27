// routes/okrs.js
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/okrs/:dept — جلب الأهداف والنتائج الرئيسية
router.get('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const entityId = req.user.entityId;

        const objectives = await prisma.departmentObjective.findMany({
            where: {
                entityId,
                departmentKey: dept.toUpperCase()
            },
            include: {
                keyResults: true
            }
        });

        res.json(objectives);
    } catch (error) {
        console.error('Error fetching OKRs:', error);
        res.status(500).json({ error: 'Failed to fetch OKR data' });
    }
});

// POST /api/okrs/:dept — حفظ الأهداف (مسح القديم وإضافة الجديد لسرعة التزامن)
router.post('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        const objectives = req.body; // مصفوفة من الأهداف
        const entityId = req.user.entityId;

        // تنفيذ كعملية واحدة (Transaction)
        await prisma.$transaction(async (tx) => {
            // 1. حذف الأهداف القديمة لهذا القسم
            await tx.departmentObjective.deleteMany({
                where: {
                    entityId,
                    departmentKey: dept.toUpperCase()
                }
            });

            // 2. إضافة الأهداف الجديدة مع نتائجها الرئيسية
            for (const obj of objectives) {
                if (!obj.title) continue;

                await tx.departmentObjective.create({
                    data: {
                        entityId,
                        departmentKey: dept.toUpperCase(),
                        title: obj.title,
                        description: obj.description,
                        keyResults: {
                            create: (obj.keyResults || []).map(kr => ({
                                title: kr.title,
                                targetValue: kr.targetValue
                            }))
                        }
                    }
                });
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving OKRs:', error);
        res.status(500).json({ error: 'Failed to save OKR data' });
    }
});

module.exports = router;
