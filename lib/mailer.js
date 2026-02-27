/**
 * lib/mailer.js
 * Nodemailer utility — sends transactional emails
 * Configure via environment variables:
 *   MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM
 */

const nodemailer = require('nodemailer');

// Create transporter lazily (only when needed)
function createTransporter() {
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT || '587'),
        secure: process.env.MAIL_PORT === '465',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });
}

const FROM = () => process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@stratix.app';

/**
 * Send an email. Fails silently if mail is not configured.
 * @param {object} opts - { to, subject, html, text? }
 * @returns {Promise<boolean>} true if sent, false if skipped/failed
 */
async function sendMail({ to, subject, html, text }) {
    const transporter = createTransporter();
    if (!transporter) {
        console.log(`📧 [Mailer] Not configured — skipping email to ${to}`);
        return false;
    }

    try {
        await transporter.sendMail({
            from: `"ستارتكس" <${FROM()}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]+>/g, ''),
        });
        console.log(`📧 [Mailer] Sent: ${subject} → ${to}`);
        return true;
    } catch (err) {
        console.error(`📧 [Mailer] Failed to send to ${to}:`, err.message);
        return false;
    }
}

// ============================================================
// Email Templates
// ============================================================

/**
 * Invitation email
 */
function invitationEmail({ inviteeName, invitedByName, entityName, role, inviteLink, message, expiresAt }) {
    const expiry = expiresAt
        ? new Date(expiresAt).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })
        : '7 أيام';

    return {
        subject: `دعوة للانضمام إلى ${entityName} على منصة ستارتكس`,
        html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>دعوة ستارتكس</title>
  <style>
    body { margin:0; padding:0; background:#0f1219; font-family:'Segoe UI',Tahoma,Arial,sans-serif; direction:rtl; }
    .wrapper { max-width:560px; margin:40px auto; background:#1a1f2e; border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.07); }
    .header { background:linear-gradient(135deg,#7c3aed,#a78bfa); padding:32px 32px 24px; text-align:center; }
    .header h1 { color:#fff; font-size:22px; margin:0 0 4px; }
    .header p { color:rgba(255,255,255,0.8); font-size:13px; margin:0; }
    .body { padding:28px 32px; color:#e2e8f0; }
    .body p { font-size:14px; line-height:1.8; margin:0 0 16px; }
    .entity-badge { background:rgba(167,139,250,0.1); border:1px solid rgba(167,139,250,0.2); border-radius:10px; padding:14px 18px; margin:20px 0; }
    .entity-badge .name { font-size:17px; font-weight:700; color:#a78bfa; }
    .entity-badge .role { font-size:12px; color:#8b8ba7; margin-top:4px; }
    .message-box { background:rgba(255,255,255,0.03); border-right:3px solid #a78bfa; border-radius:6px; padding:12px 16px; margin:16px 0; font-size:13px; color:#c4c4d4; font-style:italic; }
    .cta { text-align:center; margin:28px 0; }
    .cta a { display:inline-block; background:linear-gradient(135deg,#7c3aed,#a78bfa); color:#fff; text-decoration:none; padding:14px 36px; border-radius:12px; font-size:15px; font-weight:700; }
    .expiry { text-align:center; font-size:12px; color:#8b8ba7; margin-top:8px; }
    .footer { padding:20px 32px; border-top:1px solid rgba(255,255,255,0.06); text-align:center; font-size:11px; color:#8b8ba7; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🚀 ستارتكس</h1>
      <p>منصة التخطيط الاستراتيجي الذكي</p>
    </div>
    <div class="body">
      <p>مرحباً ${inviteeName ? inviteeName : ''}،</p>
      <p>قام <strong>${invitedByName || 'أحد الأعضاء'}</strong> بدعوتك للانضمام إلى:</p>

      <div class="entity-badge">
        <div class="name">🏢 ${entityName}</div>
        <div class="role">الدور: ${role}</div>
      </div>

      ${message ? `<div class="message-box">"${message}"</div>` : ''}

      <p>انقر على الزر أدناه لقبول الدعوة وإنشاء حسابك:</p>

      <div class="cta">
        <a href="${inviteLink}">قبول الدعوة والانضمام</a>
      </div>
      <div class="expiry">⏳ تنتهي صلاحية الدعوة: ${expiry}</div>
    </div>
    <div class="footer">
      إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد.<br>
      © 2025 ستارتكس — جميع الحقوق محفوظة
    </div>
  </div>
</body>
</html>`,
    };
}

module.exports = { sendMail, invitationEmail };
