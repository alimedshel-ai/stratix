const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// 1. جلب جميع الـ Webhooks الخاصة بالكيان الحالي
router.get('/webhooks', verifyToken, async (req, res) => {
    try {
        const entityId = req.user.activeEntityId || req.user.entityId;
        if (!entityId) return res.status(400).json({ error: 'لا يوجد كيان مرتبط' });

        const webhooks = await prisma.integration.findMany({
            where: { entityId },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ webhooks });
    } catch (error) {
        console.error('Error fetching webhooks:', error);
        res.status(500).json({ error: 'فشل في جلب إعدادات الربط' });
    }
});

// 2. إضافة Webhook جديد
router.post('/webhooks', verifyToken, async (req, res) => {
    try {
        const { name, provider, webhookUrl, events } = req.body;
        const entityId = req.user.activeEntityId || req.user.entityId;

        if (!name || !webhookUrl) {
            return res.status(400).json({ error: 'الاسم والرابط مطلوبان' });
        }

        const newWebhook = await prisma.integration.create({
            data: {
                entityId,
                name,
                provider: provider || 'SLACK',
                webhookUrl,
                events: events || ['kpi.threshold'],
                isActive: true
            }
        });

        res.status(201).json({ message: 'تم حفظ الـ Webhook بنجاح', webhook: newWebhook });
    } catch (error) {
        console.error('Error creating webhook:', error);
        res.status(500).json({ error: 'فشل في إضافة الـ Webhook' });
    }
});

// 3. تفعيل وإيقاف (Toggle) الـ Webhook
router.patch('/webhooks/:id/toggle', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;

        const updated = await prisma.integration.update({
            where: { id },
            data: { isActive: active }
        });

        res.json({ message: 'تم تحديث حالة الـ Webhook', webhook: updated });
    } catch (error) {
        console.error('Error toggling webhook:', error);
        res.status(500).json({ error: 'فشل في تحديث الحالة' });
    }
});

// 4. حذف الـ Webhook
router.delete('/webhooks/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.integration.delete({
            where: { id }
        });

        res.json({ message: 'تم حذف الـ Webhook بنجاح' });
    } catch (error) {
        console.error('Error deleting webhook:', error);
        res.status(500).json({ error: 'فشل في عملية الحذف' });
    }
});

module.exports = router;