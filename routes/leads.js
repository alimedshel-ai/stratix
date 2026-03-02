/**
 * Leads API — حفظ بيانات العملاء المحتملين
 * يدعم الألم المتعدد (Multi-Pain) + الألم المالي فقط
 * 
 * ✅ Validation كاملة
 * ✅ Unique on email — upsert
 * ✅ Error handling واضح
 * ✅ PDPL consent tracking
 * ✅ Rate limiting (5 req/min per IP)
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');

const router = express.Router();

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

router.post('/', leadsLimiter, async (req, res) => {
    try {
        const { email, sector, pains, currentSales, targetSales, gapPercent, details, pdplConsent } = req.body;

        // === Email Validation ===
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'invalid_email', message: 'البريد الإلكتروني مطلوب' });
        }
        const trimmedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 255) {
            return res.status(400).json({ error: 'invalid_email', message: 'البريد الإلكتروني غير صالح' });
        }

        // === Sector Validation ===
        const validSectors = ['retail', 'fnb', 'tech', 'services'];
        if (!sector || !validSectors.includes(sector)) {
            return res.status(400).json({ error: 'invalid_sector', message: 'القطاع غير صالح' });
        }

        // === Pains Validation (optional, for multi-pain flow) ===
        let safePains = '';
        if (pains && Array.isArray(pains)) {
            const validPains = ['strategic', 'managerial', 'operational', 'financial'];
            const filtered = pains.filter(p => validPains.includes(p));
            safePains = JSON.stringify(filtered);
        }

        // === Sales Validation (optional) ===
        let safeCurrent = null;
        let safeTarget = null;
        let safeGap = null;

        if (currentSales !== undefined && currentSales !== null) {
            if (typeof currentSales !== 'number' || currentSales < 10000 || currentSales > 10000000000) {
                return res.status(400).json({ error: 'invalid_sales', message: 'المبيعات الحالية غير صالحة' });
            }
            safeCurrent = currentSales;
        }
        if (targetSales !== undefined && targetSales !== null) {
            if (typeof targetSales !== 'number' || (safeCurrent && targetSales <= safeCurrent)) {
                return res.status(400).json({ error: 'invalid_sales', message: 'المبيعات المستهدفة يجب أن تكون أكبر' });
            }
            safeTarget = targetSales;
        }
        if (gapPercent !== undefined && gapPercent !== null) {
            if (typeof gapPercent !== 'number' || gapPercent < 0 || gapPercent > 10000) {
                return res.status(400).json({ error: 'invalid_gap', message: 'نسبة الفجوة غير صالحة' });
            }
            safeGap = gapPercent;
        }

        // === Details (optional JSON) ===
        let safeDetails = null;
        if (details && typeof details === 'object') {
            safeDetails = JSON.stringify(details).substring(0, 2000);
        }

        // === PDPL ===
        if (pdplConsent !== true) {
            return res.status(400).json({ error: 'pdpl_required', message: 'يجب الموافقة على سياسة الخصوصية' });
        }

        // === Upsert ===
        const lead = await prisma.lead.upsert({
            where: { email: trimmedEmail },
            update: {
                sector,
                pains: safePains,
                currentSales: safeCurrent,
                targetSales: safeTarget,
                gapPercent: safeGap,
                details: safeDetails,
                pdplConsent,
                updatedAt: new Date(),
            },
            create: {
                email: trimmedEmail,
                sector,
                pains: safePains,
                currentSales: safeCurrent,
                targetSales: safeTarget,
                gapPercent: safeGap,
                details: safeDetails,
                pdplConsent,
                source: 'ambition_gap',
                status: 'new',
            },
        });

        console.log(`[Leads] Saved: ${trimmedEmail} | sector: ${sector} | pains: ${safePains}`);

        res.status(201).json({
            success: true,
            message: 'تم الحجز بنجاح',
            leadId: lead.id,
        });

    } catch (error) {
        console.error('[Leads] Save error:', error.message);

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
