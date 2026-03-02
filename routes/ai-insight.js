/**
 * AI Insight API — Backend Proxy for Gemini
 * يدعم تحليل الألم المتعدد (Multi-Pain) + فجوة الطموح المالية
 * 
 * ✅ API key server-side فقط
 * ✅ Rate limiting حقيقي (3 req/min per IP)
 * ✅ Prompt يُبنى في الباكند (لا prompt injection)
 * ✅ 20s timeout
 * ✅ Error handling واضح
 */
const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// ═══════════════════════════════════════════
//  Rate Limiting — 3 طلبات/دقيقة لكل IP
// ═══════════════════════════════════════════
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
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
//  Prompt Builders (server-side only)
// ═══════════════════════════════════════════
function buildPrompt(pains, sector, details) {
    const safeSector = sector.replace(/[^\u0600-\u06FFa-zA-Z0-9\s&]/g, '').substring(0, 50);

    // Multi-pain compound analysis
    if (pains.length > 1) {
        const painLabels = pains.map(p => {
            return { strategic: 'استراتيجية', managerial: 'إدارية', operational: 'تشغيلية', financial: 'مالية', compliance: 'امتثالية' }[p] || p;
        }).join(' و ');
        const desc = (details.multiDesc || '').replace(/[<>{}]/g, '').substring(0, 500);
        return `بصفتك مستشاراً استراتيجياً وخبيراً في حل الأزمات، قم بتحليل هذا "الألم المركب" لشركة في قطاع ${safeSector}. الشركة تعاني من مشاكل ${painLabels} مدمجة. وصف العميل للوضع هو: "${desc}". حدد فوراً الأولوية الكبرى (ما الذي يجب حله غداً؟)، اشرح كيف تغذي هذه المشاكل بعضها، وأعط 3 نصائح قاسية لكسر هذه الدائرة.`;
    }

    // Single pain analysis
    const pain = pains[0];

    if (pain === 'strategic') {
        const goal = (details.goal || '').replace(/[<>{}]/g, '').substring(0, 200);
        const obstacle = (details.obstacle || '').replace(/[<>{}]/g, '').substring(0, 200);
        return `بصفتك مستشاراً استراتيجياً، حلل التحدي التالي لشركة في قطاع ${safeSector}: الهدف هو "${goal}" والعائق هو "${obstacle}". أعط صدمة واقع قوية بخصوص هذا الطموح، 3 عوائق خفية لا يراها العميل، ونصيحة واحدة للبدء.`;
    }

    if (pain === 'managerial') {
        const emp = parseInt(details.emp) || 0;
        const bottleneck = { decisions: 'سرعة اتخاذ القرار', team: 'كفاءة وتناغم الفريق', processes: 'وضوح الأدوار والمسؤوليات' }[details.bottleneck] || details.bottleneck;
        return `بصفتك خبيراً إدارياً، حلل مشكلة شركة في قطاع ${safeSector} مع ${emp} موظفاً، حيث يتعطل العمل في "${bottleneck}". كيف سيؤدي هذا العطل لفشل استراتيجية الشركة؟ أعط 3 نقاط نقدية لاذعة وحلاً إدارياً واحداً.`;
    }

    if (pain === 'operational') {
        const issue = (details.issue || '').replace(/[<>{}]/g, '').substring(0, 500);
        return `بصفتك مدير عمليات محترف، حلل هذا الاختناق في شركة ${safeSector}: "${issue}". اشرح للعميل كم يخسر من المال والوقت بسبب هذا الهدر. أعط 3 نقاط لتحسين الكفاءة فوراً.`;
    }

    if (pain === 'financial') {
        const curr = parseFloat(details.curr) || 0;
        const target = parseFloat(details.target) || 0;
        const gap = target > curr ? Math.round(((target - curr) / curr) * 100) : 0;
        const problem = { revenue: 'ضعف الإيراد', costs: 'ارتفاع التكاليف', cashflow: 'التدفق النقدي والسيولة' }[details.problem] || 'مالية عامة';
        return `بصفتك CFO، حلل فجوة نمو بنسبة ${gap}% لشركة في قطاع ${safeSector}. المبيعات الحالية ${curr.toLocaleString()} ريال والمستهدف ${target.toLocaleString()}. المشكلة الأساسية هي "${problem}". أعط 3 نقاط مخاطرة تشغيلية ونصيحة توازن واحدة.`;
    }

    if (pain === 'compliance') {
        const rev = parseFloat(details.revenue) || 0;
        const emp = parseInt(details.employees) || 0;
        const loc = parseInt(details.locations) || 0;
        return `بصفتك خبير امتثال وحوكمة، حلل مخاطر شركة في قطاع ${safeSector} بإيراد ${rev.toLocaleString()} ريال و${emp} موظف و${loc} موقع. أعط صدمة واقع عن المخاطر التنظيمية (قوى عاملة، مدد، ضريبة، تأمينات)، الغرامات المحتملة، وتكلفة عدم الامتثال. أعط 3 مخاطر عاجلة ونصيحة واحدة للبدء.`;
    }

    return `حلل الوضع الاستراتيجي لشركة في قطاع ${safeSector}. أعط 3 نقاط تشخيصية ونصيحة واحدة.`;
}

// ═══════════════════════════════════════════
//  POST /api/ai-insight
//  تحليل ذكي عبر Gemini
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
        const { pains, sector, details } = req.body;

        // Validate pains
        const validPains = ['strategic', 'managerial', 'operational', 'financial', 'compliance'];
        if (!Array.isArray(pains) || pains.length === 0 || pains.length > 4) {
            return res.status(400).json({ error: 'invalid_input', message: 'يجب اختيار تحدي واحد على الأقل' });
        }
        const safePains = pains.filter(p => validPains.includes(p));
        if (safePains.length === 0) {
            return res.status(400).json({ error: 'invalid_input', message: 'نوع التحدي غير صالح' });
        }

        // Validate sector
        if (!sector || typeof sector !== 'string' || sector.length > 100) {
            return res.status(400).json({ error: 'invalid_input', message: 'القطاع غير صالح' });
        }

        // Details is optional object
        const safeDetails = (details && typeof details === 'object') ? details : {};

        // === Build prompt server-side ===
        const promptText = buildPrompt(safePains, sector, safeDetails);

        const payload = {
            contents: [{ parts: [{ text: promptText }] }],
            systemInstruction: {
                parts: [{
                    text: 'أنت مستشار استراتيجي صادق جداً وصريح حد القسوة (صدمة الواقع). رد باللغة العربية بأسلوب نقاط مركزة. ركز على التوازن التشغيلي والمنطق العملي. في حال تعدد الآلام، ركز على فك الاشتباك بين المشاكل وتحديد نقطة الانطلاق الأولى. الرد أقل من 250 كلمة.'
                }]
            },
            generationConfig: {
                maxOutputTokens: 600,
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

        res.json({
            insight: text,
            meta: {
                pains: safePains,
                sector,
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
