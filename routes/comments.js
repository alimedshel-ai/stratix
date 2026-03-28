const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// Apply auth to all routes
router.use(verifyToken);

// ============================================
// GET /api/comments?targetType=OBJECTIVE&targetId=xxx
// جلب التعليقات لعنصر معين
// ============================================
router.get('/', async (req, res) => {
    try {
        const { targetType, targetId, entityId } = req.query;

        const where = {};
        if (targetType) where.targetType = targetType;
        if (targetId) where.targetId = targetId;
        if (entityId) where.entityId = entityId;

        const comments = await prisma.comment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        // Group replies under parents
        const topLevel = comments.filter(c => !c.parentId);
        const replies = comments.filter(c => c.parentId);

        const result = topLevel.map(c => ({
            ...c,
            replies: replies.filter(r => r.parentId === c.id),
        }));

        res.json({ success: true, data: result, total: topLevel.length });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب التعليقات' });
    }
});

// ============================================
// POST /api/comments
// إضافة تعليق جديد
// ============================================
router.post('/', async (req, res) => {
    try {
        const { content, targetType, targetId, targetName, mentions, parentId, entityId } = req.body;

        if (!content || !targetType || !targetId) {
            return res.status(400).json({ success: false, message: 'المحتوى ونوع العنصر مطلوبين' });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                targetType,
                targetId,
                targetName: targetName || null,
                userId: req.user.id,
                userName: req.user.name,
                userAvatar: req.user.avatarUrl || null,
                mentions: mentions || null,
                parentId: parentId || null,
                entityId: entityId || null,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'COMMENTED',
                targetType,
                targetId,
                targetName: targetName || null,
                details: JSON.stringify({ commentId: comment.id, preview: content.substring(0, 100) }),
                userId: req.user.id,
                userName: req.user.name,
                userAvatar: req.user.avatarUrl || null,
                entityId: entityId || null,
            },
        });

        res.status(201).json({ success: true, data: comment });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ success: false, message: 'خطأ في إنشاء التعليق' });
    }
});

// ============================================
// PUT /api/comments/:id
// تعديل تعليق
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        const existing = await prisma.comment.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ success: false, message: 'التعليق غير موجود' });
        if (existing.userId !== req.user.id) return res.status(403).json({ success: false, message: 'غير مصرح' });

        const comment = await prisma.comment.update({
            where: { id },
            data: { content },
        });

        res.json({ success: true, data: comment });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ success: false, message: 'خطأ في تعديل التعليق' });
    }
});

// ============================================
// DELETE /api/comments/:id
// حذف تعليق
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.comment.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ success: false, message: 'التعليق غير موجود' });
        if (existing.userId !== req.user.id && req.user.systemRole !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'غير مصرح' });
        }

        // Delete replies first
        await prisma.comment.deleteMany({ where: { parentId: id } });
        await prisma.comment.delete({ where: { id } });

        res.json({ success: true, message: 'تم حذف التعليق' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ success: false, message: 'خطأ في حذف التعليق' });
    }
});

module.exports = router;
