/**
 * marketing-handlers.js — أدوات التسويق المشتركة
 * يُستخدم في: marketing-deep.html, swot.html?dept=marketing, risk-map.html?dept=marketing
 */

const MARKETING_KEYS = {
    deep_results: 'stratix_marketing_deep_data',
    strengths: 'stratix_marketing_strengths',
    weaknesses: 'stratix_marketing_weaknesses',
    swot: 'stratix_marketing_swot',
    directions: 'stratix_marketing_directions',
    kpis: 'stratix_marketing_kpis',
    completed_steps: 'stratix_marketing_completed_steps'
};

// ═══════════════════════════════════════════════════
// 1. استخلاص المخاطر المقترحة (Marketing Risks)
// ═══════════════════════════════════════════════════
function generateMarketingRisks(towsData = {}) {
    return [
        {
            name: "انفصال الحملات عن الأهداف البيعية (Sales Lag)",
            category: "سوق",
            probability: 3,
            impact: 5,
            owner: "مدير التسويق",
            desc: "تحقيق تفاعل عالي (Impressions/Clicks) دون تحويل فعلي للمبيعات، مما يؤدي لهدر الميزانية.",
            mitigation: ["ربط الـ KPIs بنهاية القمع (Revenue)", "تحسين استهداف الجمهور"],
            contingency: "إيقاف الحملات غير المربحة فوراً وإعادة توجيه الموارد للمنتجات الأعلى طلباً."
        },
        {
            name: "تراجع سمعة العلامة التجارية (Brand Reputation)",
            category: "سوق",
            probability: 2,
            impact: 5,
            owner: "مدير التواصل",
            desc: "حدوث أزمة علاقات عامة أو حملة سلبية من العملاء تؤدي لتآكل الحصة السوقية.",
            mitigation: ["تفعيل نظام مراقبة المنصات (Social Listening)", "خطة تواصل للأزمات جاهزة"],
            contingency: "إطلاق حملة 'بناء ثقة' واعتذار رسمي أو معالجة جذرية لمصدر الشكوى."
        },
        {
            name: "ارتفاع تكلفة الاستحواذ (High CAC)",
            category: "مالي",
            probability: 4,
            impact: 4,
            owner: "أخصائي التسويق الرقمي",
            desc: "تجاوز تكلفة الحصول على عميل جديد للقيمة الدائمة للعميل (LTV)، مما يهدد الاستدامة المالية.",
            mitigation: ["تحسين معدل التحويل (CRO)", "التركيز على القنوات العضوية (SEO)"],
            contingency: "تغيير استراتيجية القنوات الإعلانية والانتقال لمنصات أقل تكلفة."
        },
        {
            name: "تغير خوارزميات المنصات الإعلانية",
            category: "تقني",
            probability: 4,
            impact: 3,
            owner: "فريق الإعلانات",
            desc: "تغيير مفاجئ في سياسات Meta أو Google يؤدي لانخفاض الأداء وزيادة التكاليف.",
            mitigation: ["تنويع القنوات (Omnichannel)", "بناء قاعدة بيانات عملاء مملوكة (Email List)"],
            contingency: "إعادة توزيع الميزانية يدوياً وفق الأداء الجديد خلال 48 ساعة."
        },
        {
            name: "سرقة المحتوى أو تقليد الحملات",
            category: "قانوني",
            probability: 3,
            impact: 2,
            owner: "المستشار القانوني",
            desc: "قيام المنافسين بتقليد الأفكار الإبداعية أو استخدام العلامة التجارية بشكل غير قانوني.",
            mitigation: ["تسجيل العلامة التجارية وحقوق الملكية", "إضافة ميزات حصرية للمنتج"],
            contingency: "إرسال خطاب تحذير قانوني (Cease & Desist) وتوضيح التفرد للعملاء."
        }
    ];
}

// ═══════════════════════════════════════════════════
// 2. توليد الرؤية والرسالة (Vision & Mission)
// ═══════════════════════════════════════════════════
function generateMarketingVisionMission() {
    return {
        vision: [
            "أن تصبح علامتنا التجارية الخيار الأول والأكثر ثقة في قلوب وعقول عملائنا.",
            "الريادة في الابتكار التسويقي الرقمي وبناء علاقات مستدامة تربط القيمة بالعميل.",
            "التحول نحو تسويق مبني على البيانات كلياً يضمن كفاءة الاستثمار 100%."
        ],
        mission: [
            "تقديم قيمة استثنائية وبناء وعي عميق بالعلامة التجارية يحفز النمو المستدام للمبيعات.",
            "فهم احتياجات العملاء بعمق وتقديم حلول مبتكرة تفوق توقعاتهم عبر كافة القنوات.",
            "تحسين تجربة العميل وبناء الولاء من خلال تواصل شفاف وهادف ومستمر."
        ],
        values: [
            "• الإبداع والابتكار المستمر في كل ما نقدمه.",
            "• النزاهة والشفافية في الوعود التسويقية.",
            "• المرجعية العلمية والبيانات في اتخاذ القرارات.",
            "• الشغف بالعميل ووضع احتياجاته كأولوية قصوى.",
            "• السرعة والمرونة في مواكبة تغيرات السوق."
        ]
    };
}

/**
 * توليد سيناريوهات التسويق
 */
function generateMarketingScenarios(towsData = {}) {
    return {
        optimistic: "تحقيق انتشار فيروسي (Viral Growth) للعلامة التجارية يؤدي لخفض تكلفة الاستحواذ بنسبة 50% وتحقيق نمو في المبيعات يتجاوز المستهدفات عبر قنوات عضوية مستدامة.",
        realistic: "نمو مستقر في الوعي بالعلامة التجارية وتحقيق عائد على الاستثمار الإعلاني (ROAS) بنسبة 4:1 عبر تحسين المحتوى والاستهداف الدقيق.",
        pessimistic: "تراجع أداء الحملات نتيجة تغير الخوارزميات أو زيادة المنافسة، مما يستدعي تغيير الاستراتيجية والتركيز على الاحتفاظ بالعملاء (Retention) بدلاً من الاستحواذ المكلف."
    };
}

// ═══════════════════════════════════════════════════
// 3. أهداف تسويقية (BSC Objectives)
// ═══════════════════════════════════════════════════
function generateMarketingObjectives(towsData = {}) {
    return {
        financial: [
            "خفض تكلفة الاستحواذ على العميل (CAC) بنسبة 20%.",
            "زيادة العائد على الاستثمار الإعلاني (ROAS) ليصل إلى 4x.",
            "رفع مساهمة القنوات الرقمية في الإيراد الإجمالي لتصل إلى 50%."
        ],
        customer: [
            "رفع مستوى الوعي بالعلامة التجارية (Brand Awareness) بنسبة 30%.",
            "تحسين مؤشر رضا العملاء عن الخدمة التسويقية.",
            "بناء قاعدة بيانات عملاء نشطة تزيد عن 50,000 مستخدم."
        ],
        internal: [
            "أتمتة دورة حياة العميل (Marketing Automation) بنسبة 80%.",
            "إطلاق 4 حملات استراتيجية كبرى سنوياً.",
            "تحسين جودة المحتوى الرقمي ومعدل التفاعل العضوي."
        ],
        learning: [
            "تدريب الفريق على أحدث تقنيات الذكاء الاصطناعي في التسويق.",
            "بناء نظام لوحات بيانات (Dashboards) لحظية لمراقبة الأداء.",
            "تطوير مهارات تحليل البيانات الاستباقي لسلوك العميل."
        ]
    };
}

function generateMarketingKeyResults(obj) {
    const text = (obj || '').toLowerCase();
    if (text.includes('وعي') || text.includes('براند') || text.includes('وصول')) {
        return [
            { text: 'زيادة الوصول العضوي (Reach) عبر المنصات.', target: '500k' },
            { text: 'تحسين مؤشر قوة العلامة التجارية (Brand Equity).', target: '+20%' },
            { text: 'رفع نسبة التفاعل على المحتوى التعليمي.', target: '5%' }
        ];
    }
    if (text.includes('تحويل') || text.includes('إعلانات') || text.includes('روي')) {
        return [
            { text: 'تحقيق العائد المستهدف على الاستثمار الإعلاني (ROAS).', target: '4:1' },
            { text: 'زيادة عدد العملاء المحتملين المؤهلين للتسويق (MQLs).', target: '5000' },
            { text: 'خفض تكلفة الاستحواذ على العميل (CAC).', target: '15%' }
        ];
    }
    return [
        { text: 'إطلاق عدد محدد من الحملات الاستراتيجية الكبرى.', target: '4 حملات' },
        { text: 'تحسين دقة استهداف الجمهور في الحملات الرقمية.', target: '95%' },
        { text: 'بناء قاعدة بيانات عملاء (Email list) نشطة.', target: '+10,000' }
    ];
}

// تصدير للنافذة العامة
if (typeof window !== 'undefined') {
    window.MARKETING_KEYS = MARKETING_KEYS;
    window.generateMarketingRisks = generateMarketingRisks;
    window.generateMarketingVisionMission = generateMarketingVisionMission;
    window.generateMarketingObjectives = generateMarketingObjectives;
    window.getDeptObjectives = generateMarketingObjectives;
    window.generateMarketingScenarios = generateMarketingScenarios;
    window.generateMarketingKeyResults = generateMarketingKeyResults;
}
