/**
 * =========================================
 * Notifications API — نظام الإشعارات
 * قراءة + تحديث حالة القراءة + عدّاد
 * =========================================
 */
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ═══ GET /api/notifications — إشعارات المستخدم الحالي ═══
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = { userId: req.user.id };
        if (unreadOnly === 'true') where.isRead = false;

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: { userId: req.user.id, isRead: false },
            }),
        ]);

        res.json({
            notifications,
            total,
            unreadCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        });
    } catch (error) {
        console.error('[Notifications] List error:', error.message);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// ═══ GET /api/notifications/count — عدد الإشعارات غير المقروءة ═══
router.get('/count', verifyToken, async (req, res) => {
    try {
        const count = await prisma.notification.count({
            where: { userId: req.user.id, isRead: false },
        });
        res.json({ unreadCount: count });
    } catch (error) {
        console.error('[Notifications] Count error:', error.message);
        res.status(500).json({ error: 'Failed to count notifications' });
    }
});

// ═══ PATCH /api/notifications/:id/read — تعليم كمقروء ═══
router.patch('/:id/read', verifyToken, async (req, res) => {
    try {
        const notification = await prisma.notification.findUnique({
            where: { id: req.params.id },
        });

        if (!notification || notification.userId !== req.user.id) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        const updated = await prisma.notification.update({
            where: { id: req.params.id },
            data: { isRead: true, readAt: new Date() },
        });

        res.json({ success: true, notification: updated });
    } catch (error) {
        console.error('[Notifications] Read error:', error.message);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// ═══ POST /api/notifications/read-all — تعليم الكل كمقروء ═══
router.post('/read-all', verifyToken, async (req, res) => {
    try {
        const result = await prisma.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });

        res.json({
            success: true,
            message: `تم تعليم ${result.count} إشعار كمقروء`,
            count: result.count,
        });
    } catch (error) {
        console.error('[Notifications] Read-all error:', error.message);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

// ═══ DELETE /api/notifications/:id — حذف إشعار ═══
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const notification = await prisma.notification.findUnique({
            where: { id: req.params.id },
        });

        if (!notification || notification.userId !== req.user.id) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await prisma.notification.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'تم حذف الإشعار' });
    } catch (error) {
        console.error('[Notifications] Delete error:', error.message);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

module.exports = router;
