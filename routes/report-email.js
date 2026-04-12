/**
 * routes/report-email.js
 * إرسال تقارير PDF بالبريد الإلكتروني
 */

const express = require('express');
const router = express.Router();
const { sendMail } = require('../lib/mailer');

router.post('/send-email', async (req, res) => {
    try {
        const { to, subject, reportHtml, note } = req.body;

        if (!to || !to.includes('@')) {
            return res.json({ success: false, message: 'بريد إلكتروني غير صحيح' });
        }

        if (!reportHtml) {
            return res.json({ success: false, message: 'لا يوجد محتوى للتقرير' });
        }

        // بناء قالب الإيميل
        const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin:0; padding:0; background:#f8fafc; font-family:'Segoe UI',Tahoma,Arial,sans-serif; direction:rtl; }
        .wrapper { max-width:800px; margin:20px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        .email-header { background:linear-gradient(135deg,#6366f1,#818cf8); padding:24px 32px; color:#fff; }
        .email-header h1 { margin:0; font-size:18px; font-weight:800; }
        .email-header p { margin:4px 0 0; font-size:12px; opacity:0.85; }
        .email-body { padding:0; }
        .note-box { background:#fefce8; border-right:3px solid #eab308; padding:14px 20px; margin:20px 24px; border-radius:8px; font-size:13px; color:#854d0e; }
        .email-footer { background:#f1f5f9; padding:16px 32px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="email-header">
            <h1>📊 ${subject}</h1>
            <p>تقرير مُرسل من منصة ستارتكس للتخطيط الاستراتيجي</p>
        </div>
        <div class="email-body">
            ${note ? `<div class="note-box"><strong>ملاحظة:</strong> ${note}</div>` : ''}
            ${reportHtml}
        </div>
        <div class="email-footer">
            تم إرسال هذا التقرير عبر منصة ستارتكس © ${new Date().getFullYear()}<br>
            <a href="https://stratix.app" style="color:#6366f1;text-decoration:none;">stratix.app</a>
        </div>
    </div>
</body>
</html>`;

        const userName = req.user?.name || 'مستخدم ستارتكس';
        const sent = await sendMail({
            to,
            subject: `${subject} — من ${userName}`,
            html: emailHtml
        });

        if (sent) {
            res.json({ success: true, message: 'تم الإرسال بنجاح' });
        } else {
            res.json({ success: false, message: 'البريد الإلكتروني غير مُهيأ على الخادم — تواصل مع المسؤول' });
        }
    } catch (err) {
        console.error('[Report Email] Error:', err);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
});

module.exports = router;
