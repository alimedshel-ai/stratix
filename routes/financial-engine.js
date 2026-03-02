const express = require('express');
const router = express.Router();

// ═══════════════════════════════════════════════════════════════════
// 🧠 Financial Translation Engine — محرك الترجمة المالية
// ═══════════════════════════════════════════════════════════════════
// يحوّل 5 أرقام مالية → 3 نسب → SWOT + توصيات + درجة
// هذا المحرك على الـ Server لحماية الملكية الفكرية (IP)
// Guest-accessible — لا يحتاج تسجيل دخول (صفحات 1-3)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// 1. مصفوفة الربط المعتمدة (The Mapping Matrix)
// ═══════════════════════════════════════════════════════════════════

const SWOT_RULES = [
    // --- CR (Current Ratio) ---
    {
        id: 'CR_THREAT',
        ratio: 'CR',
        condition: (cr) => cr < 1.0,
        category: 'threats',
        getText: (val) => `خطر سيولة حرج؛ قد تعجز المنشأة عن سداد التزاماتها قصيرة الأجل فوراً. (نسبة التداول: ${val.toFixed(2)})`,
        priority: 1,
    },
    {
        id: 'CR_STRENGTH',
        ratio: 'CR',
        condition: (cr) => cr >= 1.0 && cr <= 2.0,
        category: 'strengths',
        getText: (val) => `مركز مالي متوازن وقدرة جيدة على تغطية الالتزامات المالية. (نسبة التداول: ${val.toFixed(2)})`,
        priority: 5,
    },
    {
        id: 'CR_OPPORTUNITY',
        ratio: 'CR',
        condition: (cr) => cr > 3.0,
        category: 'opportunities',
        getText: (val) => `فائض نقدي غير مستغل؛ فرصة للتوسع أو الاستثمار لتوليد عوائد إضافية. (نسبة التداول: ${val.toFixed(2)})`,
        priority: 6,
    },

    // --- GM (Gross Margin) ---
    {
        id: 'GM_WEAKNESS',
        ratio: 'GM',
        condition: (gm) => gm < 0.20,
        category: 'weaknesses',
        getText: (val) => `هوامش ربح منخفضة؛ نحتاج لمراجعة استراتيجية التسعير أو تكاليف المبيعات. (هامش الربح الإجمالي: ${(val * 100).toFixed(1)}%)`,
        priority: 3,
    },
    {
        id: 'GM_STRENGTH',
        ratio: 'GM',
        condition: (gm) => gm > 0.40,
        category: 'strengths',
        getText: (val) => `قوة تسعيرية عالية تمنح المنشأة ميزة تنافسية صلبة في السوق. (هامش الربح الإجمالي: ${(val * 100).toFixed(1)}%)`,
        priority: 5,
    },

    // --- OM (Operating Margin) ---
    {
        id: 'OM_THREAT',
        ratio: 'OM',
        condition: (om) => om < 0,
        category: 'threats',
        getText: (val) => `نزيف مالي تشغيلي؛ المنشأة تخسر من نشاطها الأساسي ويجب التدخل الفوري. (هامش الربح التشغيلي: ${(val * 100).toFixed(1)}%)`,
        priority: 1,
    },
    {
        id: 'OM_WEAKNESS',
        ratio: 'OM',
        condition: (om) => om >= 0 && om < 0.05,
        category: 'weaknesses',
        getText: (val) => `كفاءة تشغيلية منخفضة؛ الأرباح تتلاشى بسبب تضخم المصاريف الإدارية. (هامش الربح التشغيلي: ${(val * 100).toFixed(1)}%)`,
        priority: 4,
    },
    {
        id: 'OM_STRENGTH',
        ratio: 'OM',
        condition: (om) => om > 0.15,
        category: 'strengths',
        getText: (val) => `نموذج تشغيلي عالي الكفاءة؛ المنشأة تنجح في تحويل المبيعات إلى أرباح فعلية. (هامش الربح التشغيلي: ${(val * 100).toFixed(1)}%)`,
        priority: 5,
    },
];

// ═══════════════════════════════════════════════════════════════════
// 2. محرك التوصيات (Recommendations Engine)
// ═══════════════════════════════════════════════════════════════════

const RECOMMENDATION_RULES = [
    // --- فوري (NOW) ---
    {
        id: 'REC_BLEEDING',
        condition: (ratios) => ratios.om < 0,
        priority: 'NOW',
        icon: '🔴',
        getText: (ratios) => `إيقاف النزيف فوراً: المنشأة تخسر ${(Math.abs(ratios.om) * 100).toFixed(1)}% من كل ريال إيراد. راجع كل بنود المصاريف الإدارية وأوقف الإنفاق غير الضروري.`,
    },
    {
        id: 'REC_LIQUIDITY_CRISIS',
        condition: (ratios) => ratios.cr < 1.0,
        priority: 'NOW',
        icon: '🔴',
        getText: (ratios) => `أزمة سيولة: الالتزامات (${ratios._raw.current_liabilities.toLocaleString('ar-SA')} ريال) تتجاوز الأصول المتداولة. حصّل الذمم المتأخرة فوراً وأخّر المدفوعات غير العاجلة.`,
    },

    // --- شهر (MONTH) ---
    {
        id: 'REC_HIGH_COGS',
        condition: (ratios) => ratios.gm < 0.20 && ratios.gm >= 0,
        priority: 'MONTH',
        icon: '🟡',
        getText: (ratios) => `هوامش مضغوطة (${(ratios.gm * 100).toFixed(1)}%). تفاوض مع الموردين لخفض تكلفة المبيعات 10% على الأقل، أو راجع سياسة التسعير.`,
    },
    {
        id: 'REC_HIGH_EXPENSES',
        condition: (ratios) => ratios.om >= 0 && ratios.om < 0.05 && ratios.gm >= 0.20,
        priority: 'MONTH',
        icon: '🟡',
        getText: (ratios) => {
            const expenseRatio = ((ratios._raw.admin_expenses / ratios._raw.total_revenue) * 100).toFixed(1);
            return `المصاريف الإدارية (${expenseRatio}% من الإيرادات) تأكل الهوامش. راجع كل بند إداري وحدد 20% منها للتخفيض.`;
        },
    },
    {
        id: 'REC_TIGHT_LIQUIDITY',
        condition: (ratios) => ratios.cr >= 1.0 && ratios.cr < 1.5,
        priority: 'MONTH',
        icon: '🟡',
        getText: () => `السيولة ضعيفة لكن ليست حرجة. ابنِ احتياطي نقدي يعادل 3 أشهر مصاريف تشغيلية على الأقل.`,
    },

    // --- 3 أشهر (QUARTER) ---
    {
        id: 'REC_GROWTH_OPPORTUNITY',
        condition: (ratios) => ratios.gm > 0.40 && ratios.cr > 2.0,
        priority: 'QUARTER',
        icon: '🟢',
        getText: (ratios) => `وضع مالي ممتاز (هامش ${(ratios.gm * 100).toFixed(1)}% + سيولة ${ratios.cr.toFixed(2)}). خطط للتوسع في منتج أو سوق جديد — الأرقام تدعمك.`,
    },
    {
        id: 'REC_IMPROVE_MARGINS',
        condition: (ratios) => ratios.gm >= 0.20 && ratios.gm <= 0.40,
        priority: 'QUARTER',
        icon: '🟢',
        getText: (ratios) => `هوامشك في المنطقة المتوسطة (${(ratios.gm * 100).toFixed(1)}%). حسّن التسعير أو خفّض تكاليف الإنتاج تدريجياً لرفعها فوق 40%.`,
    },
    {
        id: 'REC_UTILIZE_SURPLUS',
        condition: (ratios) => ratios.cr > 3.0,
        priority: 'QUARTER',
        icon: '🟢',
        getText: (ratios) => `فائض سيولة كبير (نسبة تداول ${ratios.cr.toFixed(2)}). هذا المال المعطّل فرصة ضائعة — استثمره في نمو المبيعات أو تطوير العمليات.`,
    },
];

// ═══════════════════════════════════════════════════════════════════
// 3. الروابط الذكية (Cross-Department Links)
// ═══════════════════════════════════════════════════════════════════

const CROSS_LINKS = [
    {
        id: 'LINK_BLEEDING',
        condition: (ratios) => ratios.om < 0,
        priority: 1,
        linkedDept: 'OPS',
        linkedDeptLabel: 'العمليات',
        linkedDeptIcon: '⚙️',
        getText: (ratios) => `المنشأة تخسر ${(Math.abs(ratios.om) * 100).toFixed(1)}% من نشاطها الأساسي. نحتاج نفحص: هل التكلفة من العمليات أم من الفريق؟`,
        ctaText: 'افحص العمليات',
    },
    {
        id: 'LINK_LIQUIDITY_SALES',
        condition: (ratios) => ratios.cr < 1.0,
        priority: 2,
        linkedDept: 'SALES',
        linkedDeptLabel: 'المبيعات',
        linkedDeptIcon: '📈',
        getText: (ratios) => `السيولة حرجة (نسبة تداول ${ratios.cr.toFixed(2)}). هل المشكلة في حجم المبيعات نفسه — أم أن المبيعات موجودة لكن التحصيل متأخر؟`,
        ctaText: 'افحص المبيعات',
    },
    {
        id: 'LINK_MARGINS_OPS',
        condition: (ratios) => ratios.gm < 0.20 && ratios.om >= 0,
        priority: 3,
        linkedDept: 'OPS',
        linkedDeptLabel: 'العمليات',
        linkedDeptIcon: '⚙️',
        getText: (ratios) => `هوامش الربح مضغوطة (${(ratios.gm * 100).toFixed(1)}%). التحليل يشير إلى احتمال وجود هدر تشغيلي يرفع التكاليف.`,
        ctaText: 'افحص العمليات',
    },
    {
        id: 'LINK_EXPENSES_HR',
        condition: (ratios) => ratios.om >= 0 && ratios.om < 0.05 && ratios.gm >= 0.20,
        priority: 4,
        linkedDept: 'HR',
        linkedDeptLabel: 'الموارد البشرية',
        linkedDeptIcon: '👥',
        getText: (ratios) => {
            const expenseRatio = ((ratios._raw.admin_expenses / ratios._raw.total_revenue) * 100).toFixed(1);
            return `المصاريف الإدارية تأكل ${expenseRatio}% من إيراداتك. غالباً السبب: عدد موظفين أكبر من الحاجة أو ضعف إنتاجية الفريق.`;
        },
        ctaText: 'افحص الموارد البشرية',
    },
    {
        id: 'LINK_SURPLUS_SALES',
        condition: (ratios) => ratios.cr > 3.0,
        priority: 5,
        linkedDept: 'SALES',
        linkedDeptLabel: 'المبيعات',
        linkedDeptIcon: '📈',
        getText: (ratios) => `لديك فائض سيولة كبير (نسبة تداول ${ratios.cr.toFixed(2)}). هذا الفائض فرصة ذهبية لتسريع النمو — استثمره في توسيع قنوات المبيعات.`,
        ctaText: 'استثمر في النمو',
    },
    {
        id: 'LINK_STRONG_SALES',
        condition: (ratios) => ratios.gm > 0.40 && ratios.cr > 2.0 && ratios.cr <= 3.0,
        priority: 6,
        linkedDept: 'SALES',
        linkedDeptLabel: 'المبيعات',
        linkedDeptIcon: '📈',
        getText: (ratios) => `وضعك المالي قوي (هامش ${(ratios.gm * 100).toFixed(1)}% وسيولة ${ratios.cr.toFixed(2)}). السؤال: هل تستثمر هذه القوة لتسريع نمو المبيعات؟`,
        ctaText: 'استكشف فرصة النمو',
    },
    {
        id: 'LINK_AVERAGE_OPS',
        condition: (ratios) => ratios.gm >= 0.20 && ratios.gm <= 0.40 && ratios.om >= 0.05,
        priority: 7,
        linkedDept: 'OPS',
        linkedDeptLabel: 'العمليات',
        linkedDeptIcon: '⚙️',
        getText: (ratios) => `هوامشك في المنطقة المتوسطة (${(ratios.gm * 100).toFixed(1)}%). تحسين كفاءة العمليات بنسبة 10% فقط سيرفع أرباحك بشكل ملموس.`,
        ctaText: 'حسّن العمليات',
    },
];

// ═══════════════════════════════════════════════════════════════════
// 4. طبقة التحقق (Validation Layer)
// ═══════════════════════════════════════════════════════════════════

function validateInputs(data) {
    const errors = [];
    const fields = [
        { key: 'total_revenue', label: 'إجمالي الإيرادات' },
        { key: 'cogs', label: 'تكلفة المبيعات' },
        { key: 'admin_expenses', label: 'المصاريف الإدارية' },
        { key: 'current_assets', label: 'الأصول المتداولة' },
        { key: 'current_liabilities', label: 'الالتزامات المتداولة' },
    ];

    // التحقق من وجود كل الحقول
    for (const field of fields) {
        const val = data[field.key];
        if (val === undefined || val === null || val === '') {
            errors.push({ field: field.key, message: `${field.label} مطلوب` });
        } else if (typeof val !== 'number' || isNaN(val)) {
            errors.push({ field: field.key, message: `${field.label} يجب أن يكون رقماً` });
        }
    }

    if (errors.length > 0) return errors;

    // التحقق من منطقية البيانات
    if (data.total_revenue <= 0) {
        errors.push({ field: 'total_revenue', message: 'الإيرادات يجب أن تكون أكبر من صفر' });
    }

    if (data.cogs < 0) {
        errors.push({ field: 'cogs', message: 'تكلفة المبيعات لا يمكن أن تكون سالبة' });
    }

    if (data.admin_expenses < 0) {
        errors.push({ field: 'admin_expenses', message: 'المصاريف الإدارية لا يمكن أن تكون سالبة' });
    }

    if (data.current_assets < 0) {
        errors.push({ field: 'current_assets', message: 'الأصول المتداولة لا يمكن أن تكون سالبة' });
    }

    if (data.current_liabilities < 0) {
        errors.push({ field: 'current_liabilities', message: 'الالتزامات المتداولة لا يمكن أن تكون سالبة' });
    }

    // تنبيه خاص: COGS > Revenue
    if (data.cogs > data.total_revenue && errors.length === 0) {
        errors.push({
            field: 'cogs',
            message: 'تكلفة المبيعات تتجاوز الإيرادات — هذا يعني خسارة إجمالية. تأكد من صحة الرقم.',
            severity: 'WARNING', // تنبيه وليس خطأ — يسمح بالاستمرار
        });
    }

    return errors;
}

// ═══════════════════════════════════════════════════════════════════
// 5. حساب النسب (Ratio Calculator)
// ═══════════════════════════════════════════════════════════════════

function calculateRatios(data) {
    const { total_revenue, cogs, admin_expenses, current_assets, current_liabilities } = data;

    // نسبة التداول (Current Ratio)
    // null = لا توجد التزامات (حالة خاصة — ليست رقماً)
    const cr = current_liabilities > 0
        ? current_assets / current_liabilities
        : current_assets > 0 ? null : 0;

    // هامش الربح الإجمالي (Gross Margin)
    const gm = total_revenue > 0
        ? (total_revenue - cogs) / total_revenue
        : 0;

    // هامش الربح التشغيلي (Operating Margin)
    const om = total_revenue > 0
        ? (total_revenue - cogs - admin_expenses) / total_revenue
        : 0;

    return {
        cr: cr === null ? null : Math.round(cr * 100) / 100,
        gm: Math.round(gm * 1000) / 1000,
        om: Math.round(om * 1000) / 1000,
        // قيم مشتقة مفيدة
        gross_profit: total_revenue - cogs,
        operating_profit: total_revenue - cogs - admin_expenses,
        working_capital: current_assets - current_liabilities,
        // الأرقام الخام (للاستخدام في الرسائل)
        _raw: data,
    };
}

// ═══════════════════════════════════════════════════════════════════
// 6. تطبيق مصفوفة SWOT
// ═══════════════════════════════════════════════════════════════════

function generateSWOT(ratios) {
    const swot = {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
    };

    // حالة خاصة: لا توجد التزامات متداولة (CR = null)
    if (ratios.cr === null) {
        swot.strengths.push({
            id: 'CR_DEBT_FREE',
            ratio: 'CR',
            value: 'لا التزامات',
            text: 'لا توجد التزامات متداولة — المنشأة خالية من الديون قصيرة الأجل. هذا يمنحها مرونة مالية عالية.',
            priority: 2,
        });
    }

    for (const rule of SWOT_RULES) {
        const ratioValue = ratios[rule.ratio.toLowerCase()];
        // تخطي قواعد CR إذا كانت null (تم معالجتها أعلاه)
        if (ratioValue === null) continue;
        if (rule.condition(ratioValue)) {
            swot[rule.category].push({
                id: rule.id,
                ratio: rule.ratio,
                value: rule.ratio === 'CR' ? ratioValue.toFixed(2) : `${(ratioValue * 100).toFixed(1)}%`,
                text: rule.getText(ratioValue),
                priority: rule.priority,
            });
        }
    }

    // الترتيب حسب الأولوية (الأكثر إلحاحاً أولاً)
    for (const category of Object.keys(swot)) {
        swot[category].sort((a, b) => a.priority - b.priority);
    }

    return swot;
}

// ═══════════════════════════════════════════════════════════════════
// 7. توليد التوصيات
// ═══════════════════════════════════════════════════════════════════

function generateRecommendations(ratios) {
    const recommendations = [];

    for (const rule of RECOMMENDATION_RULES) {
        if (rule.condition(ratios)) {
            recommendations.push({
                id: rule.id,
                priority: rule.priority,
                icon: rule.icon,
                text: rule.getText(ratios),
            });
        }
    }

    // ترتيب: NOW أولاً، ثم MONTH، ثم QUARTER
    const priorityOrder = { NOW: 1, MONTH: 2, QUARTER: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
}

// ═══════════════════════════════════════════════════════════════════
// 8. حساب الدرجة الإجمالية (Score /100)
// ═══════════════════════════════════════════════════════════════════

function calculateScore(ratios, swot) {
    let score = 50; // نقطة البداية المحايدة

    // CR contribution (0-25 نقطة)
    if (ratios.cr === null) score += 25; // لا التزامات = أفضل حالة
    else if (ratios.cr >= 2.0) score += 25;
    else if (ratios.cr >= 1.5) score += 20;
    else if (ratios.cr >= 1.0) score += 12;
    else if (ratios.cr >= 0.8) score += 5;
    else score -= 15;

    // GM contribution (0-25 نقطة)
    if (ratios.gm > 0.50) score += 25;
    else if (ratios.gm > 0.40) score += 20;
    else if (ratios.gm > 0.30) score += 12;
    else if (ratios.gm > 0.20) score += 5;
    else if (ratios.gm > 0.10) score -= 5;
    else score -= 15;

    // OM contribution (0-25 نقطة)
    if (ratios.om > 0.20) score += 25;
    else if (ratios.om > 0.15) score += 20;
    else if (ratios.om > 0.10) score += 12;
    else if (ratios.om > 0.05) score += 5;
    else if (ratios.om >= 0) score -= 5;
    else score -= 20;

    // تحديد المدى 0-100
    score = Math.max(0, Math.min(100, score));

    // التسمية
    let label;
    if (score >= 85) label = 'أداء مالي ممتاز — منشأة قوية ومستقرة';
    else if (score >= 70) label = 'أداء مالي جيد — مع فرص تحسين واضحة';
    else if (score >= 55) label = 'أداء مالي مقبول — يحتاج انتباه في بعض المحاور';
    else if (score >= 40) label = 'أداء مالي ضعيف — يحتاج تدخل في أكثر من محور';
    else label = 'وضع مالي حرج — يحتاج تدخل فوري وإعادة هيكلة';

    return { score, label };
}

// ═══════════════════════════════════════════════════════════════════
// 9. تحديد الرابط الذكي الأنسب (Cross-Link)
// ═══════════════════════════════════════════════════════════════════

function findCrossLink(ratios) {
    // ترتيب الروابط تصاعدياً حسب الأولوية (الأكثر إلحاحاً أولاً)
    const sortedLinks = [...CROSS_LINKS].sort((a, b) => a.priority - b.priority);
    for (const link of sortedLinks) {
        // تخطي الشروط التي تعتمد على CR إذا كانت null
        try {
            if (link.condition(ratios)) {
                return {
                    id: link.id,
                    linkedDept: link.linkedDept,
                    linkedDeptLabel: link.linkedDeptLabel,
                    linkedDeptIcon: link.linkedDeptIcon,
                    text: link.getText(ratios),
                    ctaText: link.ctaText,
                };
            }
        } catch (e) { /* condition threw on null — skip */ }
    }

    // Default fallback — لم ينطبق أي شرط
    return {
        id: 'LINK_DEFAULT',
        linkedDept: null,
        linkedDeptLabel: 'الإدارات الأخرى',
        linkedDeptIcon: '🏢',
        text: 'تحليلك المالي مكتمل. استكشف بقية إدارات منشأتك للحصول على الصورة الكاملة.',
        ctaText: 'استكشف الإدارات',
    };
}

// ═══════════════════════════════════════════════════════════════════
// 🔌 API ENDPOINT
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/financial-engine/analyze:
 *   post:
 *     summary: تحليل البيانات المالية وتوليد SWOT + توصيات
 *     tags: [Financial Engine]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [total_revenue, cogs, admin_expenses, current_assets, current_liabilities]
 *             properties:
 *               total_revenue:
 *                 type: number
 *                 description: إجمالي الإيرادات السنوية
 *                 example: 500000
 *               cogs:
 *                 type: number
 *                 description: تكلفة المبيعات
 *                 example: 200000
 *               admin_expenses:
 *                 type: number
 *                 description: المصاريف الإدارية والتشغيلية
 *                 example: 150000
 *               current_assets:
 *                 type: number
 *                 description: الأصول المتداولة
 *                 example: 300000
 *               current_liabilities:
 *                 type: number
 *                 description: الالتزامات المتداولة
 *                 example: 280000
 *     responses:
 *       200:
 *         description: نتيجة التحليل المالي الكامل
 *       400:
 *         description: بيانات غير صالحة
 */
router.post('/analyze', (req, res) => {
    try {
        const {
            total_revenue,
            cogs,
            admin_expenses,
            current_assets,
            current_liabilities,
        } = req.body;

        // تحويل القيم إلى أرقام
        const data = {
            total_revenue: Number(total_revenue),
            cogs: Number(cogs),
            admin_expenses: Number(admin_expenses),
            current_assets: Number(current_assets),
            current_liabilities: Number(current_liabilities),
        };

        // 1. Validation
        const errors = validateInputs(data);
        const warnings = errors.filter(e => e.severity === 'WARNING');
        const hardErrors = errors.filter(e => !e.severity);

        if (hardErrors.length > 0) {
            return res.status(400).json({
                success: false,
                errors: hardErrors,
            });
        }

        // 2. حساب النسب
        const ratios = calculateRatios(data);

        // 3. توليد SWOT
        const swot = generateSWOT(ratios);

        // 4. توليد التوصيات
        const recommendations = generateRecommendations(ratios);

        // 5. حساب الدرجة
        const { score, label: scoreLabel } = calculateScore(ratios, swot);

        // 6. الرابط الذكي
        const crossLink = findCrossLink(ratios);

        // 7. ملخص الأرقام المشتقة
        const summary = {
            gross_profit: ratios.gross_profit,
            operating_profit: ratios.operating_profit,
            working_capital: ratios.working_capital,
            expense_ratio: data.total_revenue > 0
                ? Math.round((data.admin_expenses / data.total_revenue) * 1000) / 10
                : 0,
            cogs_ratio: data.total_revenue > 0
                ? Math.round((data.cogs / data.total_revenue) * 1000) / 10
                : 0,
        };

        // Response
        res.json({
            success: true,
            ratios: {
                current_ratio: ratios.cr, // null = لا التزامات
                current_ratio_label: ratios.cr === null ? 'لا التزامات متداولة' : ratios.cr.toFixed(2),
                gross_margin: ratios.gm,
                operating_margin: ratios.om,
            },
            summary,
            swot,
            recommendations,
            crossLink,
            score,
            scoreLabel,
            warnings: warnings.length > 0 ? warnings : undefined,
            analyzedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('❌ [Financial Engine] Error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في محرك التحليل المالي',
        });
    }
});

/**
 * @swagger
 * /api/financial-engine/health:
 *   get:
 *     summary: فحص حالة محرك الترجمة المالية
 *     tags: [Financial Engine]
 *     security: []
 *     responses:
 *       200:
 *         description: المحرك يعمل
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        engine: 'financial-translation-engine',
        version: '1.0.0',
        rules: {
            swot: SWOT_RULES.length,
            recommendations: RECOMMENDATION_RULES.length,
            crossLinks: CROSS_LINKS.length,
        },
        ratios: ['CR (Current Ratio)', 'GM (Gross Margin)', 'OM (Operating Margin)'],
    });
});
// ═══════════════════════════════════════════════════════════════════
// 🔐 Save Result + Silent Account Creation
// ═══════════════════════════════════════════════════════════════════

let prisma, bcrypt, jwt;
try {
    prisma = require('../lib/prisma');
    bcrypt = require('bcryptjs');
    jwt = require('jsonwebtoken');
} catch (e) {
    console.warn('⚠️ [Financial Engine] Optional deps not available:', e.message);
}

/**
 * @swagger
 * /api/financial-engine/save-result:
 *   post:
 *     summary: حفظ نتيجة التحليل + إنشاء حساب صامت
 *     tags: [Financial Engine]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *               company_name: { type: string }
 *               sector: { type: string }
 *               country: { type: string }
 *               category: { type: string }
 *               pain: { type: string }
 *               redirected_from: { type: string }
 *               raw_inputs: { type: object }
 *               analysis_result: { type: object }
 *     responses:
 *       200:
 *         description: تم الحفظ + token
 */
router.post('/save-result', async (req, res) => {
    try {
        const {
            email,
            company_name,
            sector,
            country,
            category,
            pain,
            redirected_from,
            raw_inputs,
            analysis_result,
        } = req.body;

        // 1. التحقق من الإيميل
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني مطلوب وصحيح',
            });
        }

        // 2. التحقق من وجود الأدوات
        if (!prisma || !bcrypt || !jwt) {
            // Fallback: لو الأدوات مش متوفرة — نرجع نجاح بدون حساب
            console.warn('⚠️ [save-result] DB tools not available — returning success without account');
            return res.json({
                success: true,
                message: 'تم حفظ النتيجة محلياً',
                token: null,
                user: null,
                accountCreated: false,
            });
        }

        // 3. تجهيز بيانات التشخيص
        const diagnosticPayload = {
            source: 'pain-driven-flow-v4A',
            company_name: company_name || '',
            sector: sector || '',
            country: country || '',
            category: category || '',
            pain: pain || '',
            redirected_from: redirected_from || '',
            raw_inputs: raw_inputs || {},
            analysis_result: analysis_result || {},
            saved_at: new Date().toISOString(),
        };

        // 4. فحص هل الإيميل موجود مسبقاً
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            // المستخدم موجود — نحدّث بياناته التشخيصية فقط
            await prisma.user.update({
                where: { email },
                data: {
                    diagnosticData: JSON.stringify(diagnosticPayload),
                },
            });

            // إنشاء token جديد
            const token = jwt.sign(
                {
                    id: existingUser.id,
                    email: existingUser.email,
                    name: existingUser.name,
                    systemRole: existingUser.systemRole || 'USER',
                    role: 'OWNER',
                    userType: 'COMPANY_MANAGER',
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                message: 'تم تحديث بيانات التشخيص',
                token,
                user: {
                    id: existingUser.id,
                    email: existingUser.email,
                    name: existingUser.name,
                    isExisting: true,
                },
                accountCreated: false,
            });
        }

        // 5. إنشاء حساب صامت (كلمة مرور عشوائية)
        const silentPassword = require('crypto').randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(silentPassword, 10);

        // تحديد userType من category
        let userType = 'COMPANY_MANAGER';
        if (category === 'CONSULTANT_AGENCY') userType = 'CONSULTANT';

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: company_name ? `مدير ${company_name}` : 'مستخدم جديد',
                systemRole: 'USER',
                userCategory: category || null,
                diagnosticData: JSON.stringify(diagnosticPayload),
                onboardingCompleted: false,
            },
        });

        // 6. إنشاء JWT
        const token = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                systemRole: 'USER',
                role: 'OWNER',
                userType,
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log(`✅ [save-result] Silent account created: ${email} (${category})`);

        res.status(201).json({
            success: true,
            message: 'تم إنشاء حسابك وحفظ التحليل',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                isExisting: false,
            },
            accountCreated: true,
        });

    } catch (error) {
        console.error('❌ [save-result] Error:', error);

        // Prisma duplicate error (race condition) — عامل كمستخدم موجود
        if (error.code === 'P2002') {
            try {
                const existingUser = await prisma.user.findUnique({ where: { email: req.body.email } });
                if (existingUser) {
                    const token = jwt.sign(
                        {
                            id: existingUser.id,
                            email: existingUser.email,
                            name: existingUser.name,
                            systemRole: existingUser.systemRole || 'USER',
                            role: 'OWNER',
                            userType: 'COMPANY_MANAGER',
                        },
                        process.env.JWT_SECRET,
                        { expiresIn: '24h' }
                    );
                    return res.json({
                        success: true,
                        message: 'تم ربط التحليل بحسابك',
                        token,
                        user: { id: existingUser.id, email: existingUser.email, name: existingUser.name, isExisting: true },
                        accountCreated: false,
                    });
                }
            } catch (retryErr) {
                console.error('❌ [save-result] Retry failed:', retryErr);
            }
            return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
        }

        res.status(500).json({
            success: false,
            message: 'حدث خطأ في حفظ النتيجة',
        });
    }
});

module.exports = router;
