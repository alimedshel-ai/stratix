/**
 * sales-handlers.js — أدوات المبيعات المشتركة 
 * يُستخدم في: sales-deep.html, swot.html?dept=sales, risk-map.html?dept=sales
 */

const SALES_KEYS = {
    deep_results: 'stratix_sales_deep_data',
    strengths: 'stratix_sales_strengths',
    weaknesses: 'stratix_sales_weaknesses',
    swot: 'stratix_sales_swot',
    directions: 'stratix_sales_directions',
    kpis: 'stratix_sales_kpis',
    completed_steps: 'stratix_sales_completed_steps'
};

// ═══════════════════════════════════════════════════
// 1. استخلاص المخاطر المقترحة (Sales Risks)
// ═══════════════════════════════════════════════════
function generateSalesRisks(towsData = {}) {
    return [
        {
            name: "ضعف القمع البيعي (Sales Pipeline)",
            category: "سوق",
            probability: 4,
            impact: 5,
            owner: "مدير المبيعات",
            desc: "نقص حاد في الفرص المؤهلة (Qualified Leads) وصعوبة تحقيق المستهدفات الشهرية.",
            mitigation: ["تفعيل حملات جذب مكثفة", "تحسين مهارات التفاوض للفريق"],
            contingency: "مراجعة فورية للقمع وتحليل أسباب الرفض (Lost Reasons) وتغيير الاستهداف."
        },
        {
            name: "فقدان مندوبي المبيعات المميزين (Stars)",
            category: "بشري",
            probability: 3,
            impact: 4,
            owner: "المدير التنفيذي",
            desc: "انتقال الكفاءات البيعية للمنافسين، مما يؤدي لفقدان علاقات عملاء حرجة.",
            mitigation: ["نظام عمولات وحوافز تنافسي", "ربط العملاء بالشركة بدلاً من المندوب"],
            contingency: "تفعيل مندوب بديل فوراً وإعادة التواصل المباشر مع العملاء المتأثرين."
        },
        {
            name: "حرب الأسعار مع المنافسين",
            category: "سوق",
            probability: 4,
            impact: 4,
            owner: "قسم التسعير",
            desc: "قيام المنافسين بخفض حاد في الأسعار يستدعي التنازل عن هوامش الربح للبقاء.",
            mitigation: ["التركيز على القيمة بدلاً من السعر", "بناء ولاء العملاء بالأداء النوعي"],
            contingency: "إطلاق عروض قيمة مضافة (Bundling) لا تعتمد على خفض السعر المباشر."
        },
        {
            name: "اعتماد كلي على عميل استراتيجي واحد",
            category: "مالي",
            probability: 2,
            impact: 5,
            owner: "مدير كبار العملاء",
            desc: "تحقيق 40% من المبيعات من عميل واحد، مما يهدد استمرارية القسم في حال فقدانه.",
            mitigation: ["تنويع المحفظة البيعية", "تطوير عقود طويلة الأمد"],
            contingency: "تفعيل خطة الاستقطاب السريع لعملاء بديلين ذوي وزن مماثل."
        },
        {
            name: "تأخر دورة الإغلاق البيعي (Sales Cycle)",
            category: "تشغيلي",
            probability: 3,
            impact: 3,
            owner: "مدير العمليات البيعية",
            desc: "تمدد الوقت المستغرق من الاهتمام حتى الإغلاق، مما يسبب عجزا في السيولة.",
            mitigation: ["أتمتة الفوترة والمتابعات", "تبسيط إجراءات التعاقد"],
            contingency: "تقديم خصومات سداد معجل أو تسهيلات تحفز على الإغلاق الفوري."
        }
    ];
}

// ═══════════════════════════════════════════════════
// 2. أهداف بيعية (BSC Objectives)
// ═══════════════════════════════════════════════════
function generateSalesObjectives(towsData = {}) {
    return {
        financial: [
            "تحقيق نمو في الإيرادات السنوية بنسبة 25%.",
            "رفع نسبة الإغلاق (Closing Rate) لتصل إلى 30%.",
            "زيادة القيمة المتوسطة لكل عملية بيع (Avg Deal Size)."
        ],
        customer: [
            "رفع تقييم رضا العميل بعد التجربة البيعية.",
            "زيادة عدد العملاء الجدد شهرياً بنسبة 15%.",
            "تحسين معدل تكرار الشراء لدى العملاء الحاليين."
        ],
        internal: [
            "تفعيل نظام الـ CRM لمتابعة كافة الفرص بنسبة 100%.",
            "تقليص دورة المبيعات من 60 يوماً إلى 45 يوماً.",
            "تمتة عملية إدخال البيانات البيعية وتوحيد التقارير."
        ],
        learning: [
            "تدريب فريق المبيعات على مهارات التفاوض المتقدمة.",
            "فهم أعمق لاحتياجات السوق وتحليل المنافسين دورياً.",
            "بناء مهارات البيع الاستشاري (Consultative Selling)."
        ]
    };
}

/**
 * توليد سيناريوهات المبيعات
 */
function generateSalesScenarios(towsData = {}) {
    return {
        optimistic: "تحقيق اختراق سوقي كبير عبر حملات بيعية ناجحة وشراكات استراتيجية، مما يؤدي لمشاريع تتجاوز المستهدف بنسبة 40% وتوسع في مناطق جغرافية جديدة.",
        realistic: "نمو مستقر بنسبة 20% في الإيرادات عبر التركيز على العملاء الحاليين (Upselling) وتحسين قمع المبيعات الرقمي.",
        pessimistic: "انخفاض المبيعات نتيجة دخول منافسين جدد أو تراجع القوة الشرائية، مما يستدعي إعادة هيكلة العمولات والتركيز فقط على المبادرات الأعلى ربحية."
    };
}

/**
 * توليد رؤية ورسالة المبيعات
 */
function generateSalesVisionMission() {
    return {
        vision: [
            "أن نكون القوة البيعية الأكثر تأثيراً ونمواً في قطاعنا الاستثماري.",
            "الوصول بالحصة السوقية إلى الريادة عبر بناء علاقات عملاء لا تقهر.",
            "أن نصبح المرجع الأول للعملاء في توفير الحلول الاستراتيجية ذات القيمة المضافة."
        ],
        mission: [
            "تحويل الفرص إلى نجاحات مستدامة وزيادة القيمة السوقية للمنشأة.",
            "تقديم تجربة شراء استثنائية تبني ولاءً طويلاً وتحقق نمواً متصاعداً.",
            "تمكين العملاء من اتخاذ أفضل القرارات عبر مبيعات استشارية ومهنية عالية."
        ],
        values: [
            "• النزاهة: الصدق التام مع العميل هو أساس النجاح.",
            "• العميل أولاً: نحن ننجح عندما ينجح عملاؤنا.",
            "• الإنجاز: التركيز على النتائج والمخرجات الملموسة.",
            "• العمل بروح الفريق: قمع المبيعات هو جهد جماعي.",
            "• التعلم المستمر: مواكبة تقنيات البيع الحديثة (Inside Sales)."
        ]
    };
}

function generateSalesKeyResults(obj) {
    const text = (obj || '').toLowerCase();
    if (text.includes('نمو') || text.includes('إيراد') || text.includes('مبيعات')) {
        return [
            { text: 'تحقيق إجمالي المبيعات الربع سنوية المستهدفة.', target: '10M ر.س' },
            { text: 'زيادة حجم الصفقات الكبرى (Enterprise).', target: '5 صفقات' },
            { text: 'رفع مساهمة المبيعات من العملاء الجدد.', target: '30%' }
        ];
    }
    if (text.includes('إغلاق') || text.includes('تحويل') || text.includes('عملاء')) {
        return [
            { text: 'رفع معدل إغلاق الفرص البيعية (Win Rate).', target: '25%' },
            { text: 'تقليص متوسط دورة الإغلاق البيعي بالأيام.', target: '30 يوم' },
            { text: 'زيادة عدد العملاء النشطين في المحفظة.', target: '+15%' }
        ];
    }
    return [
        { text: 'تحسين دقة التوقعات البيعية (Sales Forecast).', target: '90%' },
        { text: 'زيادة عدد الاجتماعات مع عملاء محتملين مؤهلين.', target: '50 مؤهل' },
        { text: 'رفع مستوى رضا العميل عن تجربة البيع.', target: '4.5/5' }
    ];
}

// ═══════════════════════════════════════════════════
// 6. توليد استراتيجيات TOWS للمبيعات
// ═══════════════════════════════════════════════════
function generateSalesStrategies(strengths, weaknesses, opportunities, threats) {
    const strats = { so: [], wo: [], st: [], wt: [] };

    if (strengths.length && opportunities.length) {
        strats.so.push('استثمار قاعدة العملاء النشطة لفتح قنوات بيع جديدة وزيادة الحصة السوقية');
        strats.so.push('توظيف نظام CRM والأتمتة لتسريع دورة المبيعات وتحسين معدل الإغلاق');
        strats.so.push('استغلال سمعة الفريق القوية لاختراق شرائح عملاء جديدة (B2B / B2C)');
        strats.so.push('تعزيز التسعير التنافسي المبني على بيانات السوق لاغتنام فرص النمو');
        if (strengths.some(s => s.includes('CRM') || s.includes('أتمتة')))
            strats.so.push('توسيع أتمتة المبيعات لتشمل التنبؤ الذكي وتوزيع العملاء المحتملين تلقائياً');
    }

    if (weaknesses.length && opportunities.length) {
        strats.wo.push('معالجة ضعف تتبع Pipeline عبر أدوات تحليل البيانات البيعية');
        strats.wo.push('سد فجوة التدريب على مهارات البيع والتفاوض لرفع معدل التحويل');
        strats.wo.push('إنشاء برنامج ولاء عملاء لتحويل نقطة الضعف في الاحتفاظ إلى فرصة نمو');
        strats.wo.push('بناء هيكل فريق مبيعات واضح (SDR → AE → AM) لتحسين الكفاءة التشغيلية');
        if (weaknesses.some(w => w.includes('Pipeline') || w.includes('تتبع')))
            strats.wo.push('اعتماد منهجية Pipeline Management لتقليل الصفقات الضائعة بنسبة 30%');
    }

    if (strengths.length && threats.length) {
        strats.st.push('استخدام العلاقات القوية مع العملاء كحاجز ضد دخول منافسين جدد');
        strats.st.push('تنويع قنوات البيع (رقمي + ميداني) لتقليل مخاطر الاعتماد على قناة واحدة');
        strats.st.push('تعزيز خدمة ما بعد البيع لحماية قاعدة العملاء من عروض المنافسين');
        strats.st.push('استثمار بيانات المبيعات في التنبؤ بتقلبات السوق والاستعداد المبكر');
    }

    if (weaknesses.length && threats.length) {
        strats.wt.push('خطة طوارئ لتعويض ضعف أداء المبيعات في حالات الانكماش الاقتصادي');
        strats.wt.push('إعادة هيكلة حوافز الفريق لمواجهة مخاطر فقدان الكفاءات البيعية');
        strats.wt.push('تقليص دورة البيع الطويلة لتجنب خسارة الصفقات أمام منافسين أسرع');
        strats.wt.push('معالجة فجوات التقييم والمتابعة لمنع تسرب الإيرادات المتكررة');
    }

    return strats;
}

// تصدير للنافذة العامة
if (typeof window !== 'undefined') {
    window.SALES_KEYS = SALES_KEYS;
    window.generateSalesRisks = generateSalesRisks;
    window.generateSalesObjectives = generateSalesObjectives;
    window.getDeptObjectives = generateSalesObjectives;
    window.generateSalesScenarios = generateSalesScenarios;
    window.generateSalesVisionMission = generateSalesVisionMission;
    window.generateSalesKeyResults = generateSalesKeyResults;
    window.generateSalesStrategies = generateSalesStrategies;
}
