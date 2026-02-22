const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');

// Apply auth to all routes
router.use(verifyToken);

// ============================================
// GET /api/activities?entityId=xxx&limit=50
// جلب سجل النشاطات
// ============================================
router.get('/', async (req, res) => {
    try {
        const { entityId, userId, targetType, limit = 50, offset = 0 } = req.query;

        const where = {};
        if (entityId) where.entityId = entityId;
        if (userId) where.userId = userId;
        if (targetType) where.targetType = targetType;

        const [activities, total] = await Promise.all([
            prisma.activity.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset),
            }),
            prisma.activity.count({ where }),
        ]);

        res.json({ success: true, data: activities, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب النشاطات' });
    }
});

// ============================================
// POST /api/activities
// تسجيل نشاط جديد (يُستدعى من Routes أخرى)
// ============================================
router.post('/', async (req, res) => {
    try {
        const { action, targetType, targetId, targetName, details, entityId } = req.body;

        if (!action || !targetType || !targetId) {
            return res.status(400).json({ success: false, message: 'البيانات الأساسية مطلوبة' });
        }

        const activity = await prisma.activity.create({
            data: {
                action,
                targetType,
                targetId,
                targetName: targetName || null,
                details: details ? JSON.stringify(details) : null,
                userId: req.user.id,
                userName: req.user.name,
                userAvatar: req.user.avatarUrl || null,
                entityId: entityId || null,
            },
        });

        res.status(201).json({ success: true, data: activity });
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({ success: false, message: 'خطأ في تسجيل النشاط' });
    }
});

// ============================================
// GET /api/activities/stats
// إحصائيات النشاط (للداشبورد)
// ============================================
router.get('/stats', async (req, res) => {
    try {
        const { entityId } = req.query;
        const where = {};
        if (entityId) where.entityId = entityId;

        // Last 7 days
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekWhere = { ...where, createdAt: { gte: weekAgo } };

        const [totalActivities, weekActivities, topUsers] = await Promise.all([
            prisma.activity.count({ where }),
            prisma.activity.count({ where: weekWhere }),
            prisma.activity.groupBy({
                by: ['userName'],
                where: weekWhere,
                _count: true,
                orderBy: { _count: { userName: 'desc' } },
                take: 5,
            }),
        ]);

        res.json({
            success: true,
            data: {
                totalActivities,
                weekActivities,
                topUsers: topUsers.map(u => ({ name: u.userName, count: u._count })),
            },
        });
    } catch (error) {
        console.error('Error fetching activity stats:', error);
        res.status(500).json({ success: false, message: 'خطأ في إحصائيات النشاط' });
    }
});

module.exports = router;
