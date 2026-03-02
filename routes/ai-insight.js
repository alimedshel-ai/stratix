/**
 * AI Insight API — Backend Proxy for Gemini
 * يستخدم في صفحة "صدمة الواقع" (Ambition Gap Analysis)
 * 
 * ✅ API key server-side فقط
 * ✅ Rate limiting حقيقي (3 req/min per IP)
 * ✅ Input validation + sanitization
 * ✅ 20s timeout للباكند
 * ✅ Error handling واضح
 */
const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// ═══════════════════════════════════════════
//  Rate Limiting — 3 طلبات/دقيقة لكل IP
// ═══════════════════════════════════════════
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 دقيقة
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'too_many_requests',
        message: 'تجاوزت الحد المسموح — حاول بعد دقيقة',
        retryAfterMs: 60000,
    },
});

// ═══════════════════════════════════════════
//  POST /api/ai-insight
//  تحليل فجوة الطموح عبر Gemini
// ═══════════════════════════════════════════
router.post('/', aiLimiter, async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('[AI-Insight] GEMINI_API_KEY not configured');
            return res.status(503).json({
                error: 'service_unavailable',
                message: 'خدمة التحليل الذكي غير متاحة حالياً',
            });
        }

        // === Input Validation ===
        const { sector, currentSales, targetSales, gapPercent } = req.body;

        if (!sector || typeof sector !== 'string' || sector.length > 100) {
            return res.status(400).json({ error: 'invalid_input', message: 'القطاع غير صالح' });
        }
        if (!currentSales || !targetSales || typeof currentSales !== 'number' || typeof targetSales !== 'number') {
            return res.status(400).json({ error: 'invalid_input', message: 'أرقام المبيعات مطلوبة' });
        }
        if (currentSales < 10000 || currentSales > 10000000000) {
            return res.status(400).json({ error: 'invalid_input', message: 'المبيعات الحالية خارج النطاق المدعوم' });
        }
        if (targetSales <= currentSales) {
            return res.status(400).json({ error: 'invalid_input', message: 'المستهدف يجب أن يكون أكبر من الحالي' });
        }
        if (typeof gapPercent !== 'number' || gapPercent < 0 || gapPercent > 10000) {
            return res.status(400).json({ error: 'invalid_input', message: 'نسبة الفجوة غير صالحة' });
        }

        // === Sanitize sector name (prevent prompt injection) ===
        const safeSector = sector.replace(/[^\u0600-\u06FFa-zA-Z0-9\s&]/g, '').substring(0, 50);

        // === Build Gemini Prompt ===
        const payload = {
            contents: [{
                parts: [{
                    text: `بصفتك CFO، حلل فجوة نمو بنسبة ${gapPercent}% لشركة في قطاع ${safeSector}. المبيعات الحالية ${currentSales.toLocaleString()} ريال. أعط 3 نقاط مخاطرة تشغيلية ونصيحة توازن واحدة باللغة العربية بأسلوب نقاط مختصرة.`
                }]
            }],
            systemInstruction: {
                parts: [{
                    text: 'أنت مستشار مالي صادق جداً. ركز على التوازن التشغيلي الداخلي فقط. لا تقترح حلولاً تسويقية عشوائية، ركز على الكفاءة والقدرة التشغيلية. الرد أقل من 200 كلمة.'
                }]
            },
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
            }
        };

        // === Call Gemini with 20s timeout ===
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errBody = await response.text().catch(() => '');
            console.error(`[AI-Insight] Gemini API error: ${response.status}`, errBody.substring(0, 200));
            return res.status(502).json({
                error: 'ai_error',
                message: 'المستشار مشغول حالياً، يرجى المحاولة بعد قليل',
            });
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!text) {
            return res.status(502).json({
                error: 'empty_response',
                message: 'لم يتم الحصول على تحليل — حاول مرة أخرى',
            });
        }

        // === Success ===
        res.json({
            insight: text,
            meta: {
                sector: safeSector,
                gapPercent,
                timestamp: new Date().toISOString(),
            }
        });

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('[AI-Insight] Gemini timeout (20s)');
            return res.status(504).json({
                error: 'timeout',
                message: 'استغرق التحليل وقتاً طويلاً — حاول مرة أخرى',
            });
        }

        console.error('[AI-Insight] Unexpected error:', error.message);
        res.status(500).json({
            error: 'internal_error',
            message: 'حدث خطأ غير متوقع',
        });
    }
});

module.exports = router;
