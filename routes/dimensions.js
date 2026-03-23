const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// 📊 COMPANY DIMENSIONS (Phase 1)
// الأبعاد الثلاثة: المالي، الإداري، التوطين
// ============================================================

// GET /api/dimensions/:entityId
// جلب داتا الأبعاد الثلاثة لشركة معينة
router.get('/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;

        // Check entity exists & user has access
        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
            include: { dimensions: true }
        });

        if (!entity) {
            return res.status(404).json({ message: 'الكيان غير موجود' });
        }

        res.json({
            entityId: entity.id,
            dimensions: entity.dimensions || null
        });
    } catch (error) {
        console.error('Error fetching dimensions:', error);
        res.status(500).json({ message: 'حدث خطأ أثناء جلب الأبعاد', error: error.message });
    }
});

// POST|PUT /api/dimensions/:entityId
// حفط أو تحديث بيانات الأبعاد الثلاثة
router.post('/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;
        const payload = req.body;

        // Remove ID/dates from payload if provided
        delete payload.id;
        delete payload.entityId;
        delete payload.createdAt;
        delete payload.updatedAt;

        // Record evaluator details
        payload.evaluatedBy = req.user.id;
        payload.evaluatedAt = new Date();

        // Check if dimensions exist
        const existing = await prisma.companyDimension.findUnique({
            where: { entityId }
        });

        let dimension;
        if (existing) {
            dimension = await prisma.companyDimension.update({
                where: { entityId },
                data: payload
            });
        } else {
            dimension = await prisma.companyDimension.create({
                data: {
                    ...payload,
                    entityId
                }
            });
        }

        res.status(200).json({
            message: 'تم حفظ الأبعاد بنجاح',
            dimension
        });
    } catch (error) {
        console.error('Error saving dimensions:', error);
        res.status(500).json({ message: 'حدث خطأ أثناء الرفع', error: error.message });
    }
});

module.exports = router;
