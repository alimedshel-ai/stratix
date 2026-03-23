// routes/webhooks.js
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { notifySlack } = require('../lib/slackService');

const router = express.Router();

// ──────────────────────────────────────────────────
// GET /api/webhooks/entity/:entityId — جلب كل webhooks
// ──────────────────────────────────────────────────
router.get('/entity/:entityId', verifyToken, async (req, res) => {
    try {
        const webhooks = await prisma.webhook.findMany({
            where: { entityId: req.params.entityId },
            include: {
                logs: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        const stats = {
            total: webhooks.length,
            active: webhooks.filter(w => w.active).length,
            totalCalls: webhooks.reduce((s, w) => s + w.calls, 0),
            avgSuccess: webhooks.length
                ? Math.round(webhooks.reduce((s, w) => s + (w.successRate || 100), 0) / webhooks.length)
                : 0
        };

        res.json({ webhooks, stats });
    } catch (err) {
        console.error('[Webhooks GET]', err);
        res.status(500).json({ error: 'Failed to fetch webhooks' });
    }
});

// ──────────────────────────────────────────────────
// POST /api/webhooks — إنشاء webhook جديد
// ──────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
    try {
        const { entityId, name, url, platform = 'custom', icon, color, events = [], secret } = req.body;

        if (!entityId || !name || !url) {
            return res.status(400).json({ error: 'entityId, name, and url are required' });
        }
        if (!url.startsWith('https://')) {
            return res.status(400).json({ error: 'URL must start with https://' });
        }

        const webhook = await prisma.webhook.create({
            data: {
                entityId,
                name,
                url,
                platform,
                icon: icon || (platform === 'slack' ? '💬' : platform === 'teams' ? '💼' : platform === 'zapier' ? '⚡' : '🔗'),
                color: color || (platform === 'slack' ? '#4A154B' : platform === 'teams' ? '#464EB8' : '#667eea'),
                events: JSON.stringify(events),
                secret: secret || null,
                createdBy: req.user?.id || null
            }
        });

        res.status(201).json(webhook);
    } catch (err) {
        console.error('[Webhooks POST]', err);
        res.status(500).json({ error: 'Failed to create webhook' });
    }
});

// ──────────────────────────────────────────────────
// PATCH /api/webhooks/:id — تعديل / تفعيل / إيقاف
// ──────────────────────────────────────────────────
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { name, url, events, active, secret, icon, color } = req.body;

        const existing = await prisma.webhook.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Webhook not found' });

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (url !== undefined) updateData.url = url;
        if (events !== undefined) updateData.events = JSON.stringify(events);
        if (active !== undefined) updateData.active = active;
        if (secret !== undefined) updateData.secret = secret;
        if (icon !== undefined) updateData.icon = icon;
        if (color !== undefined) updateData.color = color;

        const webhook = await prisma.webhook.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(webhook);
    } catch (err) {
        console.error('[Webhooks PATCH]', err);
        res.status(500).json({ error: 'Failed to update webhook' });
    }
});

// ──────────────────────────────────────────────────
// DELETE /api/webhooks/:id
// ──────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await prisma.webhook.delete({ where: { id: req.params.id } });
        res.json({ message: 'Webhook deleted' });
    } catch (err) {
        console.error('[Webhooks DELETE]', err);
        res.status(500).json({ error: 'Failed to delete webhook' });
    }
});

// ──────────────────────────────────────────────────
// POST /api/webhooks/:id/test — اختبار webhook
// ──────────────────────────────────────────────────
router.post('/:id/test', verifyToken, async (req, res) => {
    try {
        const webhook = await prisma.webhook.findUnique({ where: { id: req.params.id } });
        if (!webhook) return res.status(404).json({ error: 'Webhook not found' });
        if (!webhook.active) return res.status(400).json({ error: 'Webhook is inactive' });

        const start = Date.now();
        const ok = await notifySlack(webhook.url, {
            event: 'test.ping',
            title: '🔔 اختبار الإشعارات — ستارتكس',
            body: `تم إرسال هذا الإشعار للتأكد من صحة الربط مع *${webhook.name}* ✅`,
            emoji: '🧪',
            color: '#667eea',
            entity: 'ستارتكس'
        });
        const durationMs = Date.now() - start;
        const statusCode = ok ? 200 : 500;

        // تسجيل في الـ logs
        await prisma.webhookLog.create({
            data: {
                webhookId: webhook.id,
                event: 'test.ping',
                statusCode,
                ok,
                durationMs,
                error: ok ? null : 'Request failed'
            }
        });

        // تحديث الإحصاء
        await updateWebhookStats(webhook.id, ok);

        res.json({ ok, statusCode, durationMs, message: ok ? 'تم الإرسال بنجاح' : 'فشل الإرسال' });
    } catch (err) {
        console.error('[Webhooks TEST]', err);
        res.status(500).json({ error: 'Test failed' });
    }
});

// ──────────────────────────────────────────────────
// GET /api/webhooks/:id/logs
// ──────────────────────────────────────────────────
router.get('/:id/logs', verifyToken, async (req, res) => {
    try {
        const logs = await prisma.webhookLog.findMany({
            where: { webhookId: req.params.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// ──────────────────────────────────────────────────
// INTERNAL: triggerWebhooks — يُستدعى من routes أخرى
// مثال: await triggerWebhooks(entityId, 'kpi.threshold', {...})
// ──────────────────────────────────────────────────
async function triggerWebhooks(entityId, event, opts = {}) {
    try {
        const webhooks = await prisma.webhook.findMany({
            where: { entityId, active: true }
        });

        for (const webhook of webhooks) {
            let events = [];
            try { events = JSON.parse(webhook.events || '[]'); } catch { }

            if (!events.includes(event)) continue;

            const start = Date.now();
            const ok = await notifySlack(webhook.url, {
                event,
                title: opts.title || `حدث جديد: ${event}`,
                body: opts.body || '',
                emoji: opts.emoji || '📣',
                color: opts.color || '#667eea',
                link: opts.link,
                entity: opts.entity
            });
            const durationMs = Date.now() - start;

            // سجّل الاستدعاء
            await prisma.webhookLog.create({
                data: {
                    webhookId: webhook.id,
                    event,
                    statusCode: ok ? 200 : 500,
                    ok,
                    durationMs,
                    payload: JSON.stringify(opts).substring(0, 2000),
                    error: ok ? null : 'Dispatch failed'
                }
            });

            await updateWebhookStats(webhook.id, ok);
        }
    } catch (err) {
        console.error('[triggerWebhooks]', err.message);
    }
}

// helper: تحديث calls و successRate بعد كل استدعاء
async function updateWebhookStats(webhookId, ok) {
    try {
        const wh = await prisma.webhook.findUnique({ where: { id: webhookId } });
        if (!wh) return;

        const newCalls = wh.calls + 1;
        const prevSuccess = (wh.successRate || 100) / 100 * wh.calls;
        const newSuccess = Math.round(((prevSuccess + (ok ? 1 : 0)) / newCalls) * 100);

        await prisma.webhook.update({
            where: { id: webhookId },
            data: {
                calls: newCalls,
                successRate: newSuccess,
                lastCalledAt: new Date()
            }
        });
    } catch (e) { /* ignore */ }
}

module.exports = router;
module.exports.triggerWebhooks = triggerWebhooks;
