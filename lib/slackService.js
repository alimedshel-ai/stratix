// lib/slackService.js
// Node.js 18+ (native fetch) — or install: npm install node-fetch

/**
 * إرسال رسالة إلى Slack عبر Incoming Webhook
 * @param {string} webhookUrl  - رابط الـ Webhook الخاص بـ Slack
 * @param {object} payload     - محتوى الرسالة (text بسيط أو Slack Blocks)
 * @returns {boolean}          - true إذا نجح الإرسال
 */
async function sendSlackNotification(webhookUrl, payload) {
    if (!webhookUrl) return false;

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const body = await response.text().catch(() => '');
            console.error(`[Slack] ❌ HTTP ${response.status} ${response.statusText} — ${body}`);
            return false;
        }

        console.log('[Slack] ✅ تم إرسال الإشعار بنجاح');
        return true;
    } catch (error) {
        console.error('[Slack] ❌ فشل الإرسال:', error.message);
        return false;
    }
}

// ─────────────────────────────────────────────────
// بانيات رسائل جاهزة للأحداث الاستراتيجية
// ─────────────────────────────────────────────────

/**
 * بناء رسالة Slack Block Kit لحدث استراتيجي
 * @param {object} opts
 * @param {string} opts.event     - اسم الحدث  (kpi.threshold, objective.completed ...)
 * @param {string} opts.title     - العنوان الرئيسي
 * @param {string} opts.body      - التفاصيل
 * @param {string} [opts.emoji]   - emoji يُعرض في المقدمة
 * @param {string} [opts.color]   - لون الشريط الجانبي (#ef4444 للخطر)
 * @param {string} [opts.link]    - رابط "عرض التفاصيل"
 * @param {string} [opts.entity]  - اسم الشركة / الكيان
 */
function buildSlackPayload({ event, title, body, emoji = '📣', color = '#667eea', link, entity }) {
    const fields = [
        { type: 'mrkdwn', text: `*الحدث:*\n\`${event}\`` },
    ];
    if (entity) fields.push({ type: 'mrkdwn', text: `*الكيان:*\n${entity}` });

    const blocks = [
        {
            type: 'section',
            text: { type: 'mrkdwn', text: `${emoji} *${title}*\n${body}` }
        },
        { type: 'divider' },
        { type: 'section', fields }
    ];

    if (link) {
        blocks.push({
            type: 'actions',
            elements: [{
                type: 'button',
                text: { type: 'plain_text', text: '🔗 عرض التفاصيل', emoji: true },
                url: link,
                style: 'primary'
            }]
        });
    }

    return {
        attachments: [{
            color,
            blocks,
            footer: `ستارتكس — ${new Date().toLocaleString('ar-SA')}`,
        }]
    };
}

/**
 * إرسال إشعار جاهز لحدث استراتيجي
 * @param {string} webhookUrl
 * @param {object} opts  — نفس opts في buildSlackPayload
 */
async function notifySlack(webhookUrl, opts) {
    const payload = buildSlackPayload(opts);
    return sendSlackNotification(webhookUrl, payload);
}

module.exports = { sendSlackNotification, buildSlackPayload, notifySlack };
