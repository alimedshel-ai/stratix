/**
 * Leads API — حفظ بيانات العملاء المحتملين
 * من صفحة "صدمة الواقع" (Ambition Gap Analysis)
 * 
 * ✅ Validation كاملة
 * ✅ Unique on email — upsert (تحديث لو موجود)
 * ✅ Error handling واضح → الفرونت يعرف يفرّق بين success و failure
 * ✅ PDPL consent tracking
 * ✅ Rate limiting (5 req/min per IP)
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');

const router = express.Router();

// ═══════════════════════════════════════════
//  Rate Limiting — 5 طلبات/دقيقة لكل IP
// ═══════════════════════════════════════════
const leadsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'too_many_requests',
        message: 'تجاوزت الحد المسموح — حاول بعد دقيقة',
    },
});

// ═══════════════════════════════════════════
//  POST /api/leads
//  حفظ lead جديد أو تحديث الموجود
// ═══════════════════════════════════════════
router.post('/', leadsLimiter, async (req, res) => {
    try {
        const { email, sector, currentSales, targetSales, gapPercent, pdplConsent } = req.body;

        // === Validation ===
        // Email
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'invalid_email', message: 'البريد الإلكتروني مطلوب' });
        }
        const trimmedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({ error: 'invalid_email', message: 'البريد الإلكتروني غير صالح' });
        }
        if (trimmedEmail.length > 255) {
            return res.status(400).json({ error: 'invalid_email', message: 'البريد الإلكتروني طويل جداً' });
        }

        // Sector
        const validSectors = ['retail', 'fnb', 'tech', 'services'];
        if (!sector || !validSectors.includes(sector)) {
            return res.status(400).json({ error: 'invalid_sector', message: 'القطاع غير صالح' });
        }

        // Sales numbers
        if (typeof currentSales !== 'number' || currentSales < 10000 || currentSales > 10000000000) {
            return res.status(400).json({ error: 'invalid_sales', message: 'المبيعات الحالية غير صالحة' });
        }
        if (typeof targetSales !== 'number' || targetSales <= currentSales) {
            return res.status(400).json({ error: 'invalid_sales', message: 'المبيعات المستهدفة يجب أن تكون أكبر' });
        }

        // Gap
        if (typeof gapPercent !== 'number' || gapPercent < 0 || gapPercent > 10000) {
            return res.status(400).json({ error: 'invalid_gap', message: 'نسبة الفجوة غير صالحة' });
        }

        // PDPL
        if (pdplConsent !== true) {
            return res.status(400).json({ error: 'pdpl_required', message: 'يجب الموافقة على سياسة الخصوصية' });
        }

        // === Upsert — تحديث لو الإيميل موجود ===
        const lead = await prisma.lead.upsert({
            where: { email: trimmedEmail },
            update: {
                sector,
                currentSales,
                targetSales,
                gapPercent,
                pdplConsent,
                updatedAt: new Date(),
            },
            create: {
                email: trimmedEmail,
                sector,
                currentSales,
                targetSales,
                gapPercent,
                pdplConsent,
                source: 'ambition_gap',
                status: 'new',
            },
        });

        console.log(`[Leads] Saved: ${trimmedEmail} | sector: ${sector} | gap: ${gapPercent}%`);

        res.status(201).json({
            success: true,
            message: 'تم الحجز بنجاح',
            leadId: lead.id,
        });

    } catch (error) {
        console.error('[Leads] Save error:', error.message);

        // Prisma unique constraint error (shouldn't happen with upsert, but safety)
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: 'duplicate',
                message: 'هذا البريد مسجل مسبقاً — سنتواصل معك قريباً',
            });
        }

        res.status(500).json({
            error: 'save_failed',
            message: 'حدث خطأ أثناء الحفظ — يرجى المحاولة مرة أخرى',
        });
    }
});

module.exports = router;
