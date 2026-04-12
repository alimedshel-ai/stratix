/**
 * operations-handlers.js — أدوات العمليات المشتركة
 * يُستخدم في: operations-deep.html, swot.html?dept=operations, risk-map.html?dept=operations
 */

const OPERATIONS_KEYS = {
    deep_results: 'stratix_operations_deep_data',
    strengths: 'stratix_operations_strengths',
    weaknesses: 'stratix_operations_weaknesses',
    swot: 'stratix_operations_swot',
    directions: 'stratix_operations_directions',
    kpis: 'stratix_operations_kpis',
    completed_steps: 'stratix_operations_completed_steps'
};

// ═══════════════════════════════════════════════════
// 1. استخلاص المخاطر المقترحة (Operations Risks)
// ═══════════════════════════════════════════════════
function generateOperationsRisks(towsData = {}) {
    return [
        {
            name: "تعطل سلسلة الإمداد (Supply Chain Disruption)",
            category: "سوق",
            probability: 3,
            impact: 5,
            owner: "مدير المشتريات",
            desc: "تأخر وصول المواد الخام أو نقص الموردين، مما يؤدي لتوقف خطوط الإنتاج أو الخدمة.",
            mitigation: ["توفير موردين بديلين سلفاً", "بناء مخزون آمن (Safety Stock)"],
            contingency: "تفعيل العقود مع الموردين الجغرافيين القريبين أو التحول لخط منتجات بديل."
        },
        {
            name: "فشل الأنظمة التقنية الحرجة",
            category: "تقني",
            probability: 2,
            impact: 5,
            owner: "مدير تقنية المعلومات",
            desc: "توقف الأنظمة المركزية (ERP/Server) لأكثر من 4 ساعات عمل متصلة.",
            mitigation: ["تفعيل النسخ الاحتياطي اللحظي", "صيانة دورية دورية للأجهزة"],
            contingency: "تفعيل العمل اليدوي أو الورقي فوراً لضمان الحد الأدنى من الإنتاجية حتى عودة النظام."
        },
        {
            name: "انخفاض جودة المخرجات (Quality Drop)",
            category: "تشغيلي",
            probability: 3,
            impact: 4,
            owner: "مدير الجودة",
            desc: "ظهور أخطاء تصنيعية أو قصور في الخدمة المقدمة للعملاء، مما يؤدي لاستياء عام.",
            mitigation: ["تفعيل نظام رقابة صارم", "تدريب مستمر للموظفين على المعايير"],
            contingency: "إيقاف العمل فوراً وسحب المنتج المعيب أو تقديم تعويض فوري للعملاء المتأثرين."
        },
        {
            name: "مخاطر الصحة والسلامة المهنية",
            category: "تشغيلي",
            probability: 2,
            impact: 5,
            owner: "أخصائي السلامة",
            desc: "وقوع إصابات عمل جسيمة أو حرائق نتيجة إهمال معايير الأمن والسلامة.",
            mitigation: ["تطبيق معايير ISO 45001", "تدريبات إخلاء وفحص دوري لمعدات الحريق"],
            contingency: "إخلاء المنشأة فوراً وتقديم الإسعافات الأولية والتواصل مع الدفاع المدني."
        },
        {
            name: "تجاوز الميزانيات التشغيلية (Overbudgeting)",
            category: "مالي",
            probability: 4,
            impact: 3,
            owner: "المدير المالي لقطاع العمليات",
            desc: "ارتفاع تكاليف الصيانة أو الهالك التشغيلي عن النسب المعتمدة، مما يقلل هوامش الربح.",
            mitigation: ["تطبيق أتمتة لتقليل الهدر", "مراقبة المخزون بنظام (FIFO)"],
            contingency: "خطة عاجلة لتقنين المصاريف المتغيرة ووقف أي طلبات شراء غير عاجلة."
        }
    ];
}

// ═══════════════════════════════════════════════════
// 2. أهداف تشغيلية (BSC Objectives)
// ═══════════════════════════════════════════════════
function generateOperationsObjectives(towsData = {}) {
    return {
        financial: [
            "تقليل التكاليف التشغيلية بنسبة 15% عبر الكفاءة التقنية.",
            "خفض نسبة الهالك (Waste) من 8% إلى 3%.",
            "تحسين العائد على الأصول (ROA) للمعدات الثقيلة."
        ],
        customer: [
            "تحسين زمن التسليم النهائي (Lead Time) بنسبة 20%.",
            "رفع دقة تنفيذ الطلبات بنسبة 100%.",
            "تقليل عدد الشكاوى التشغيلية للحد الأدنى."
        ],
        internal: [
            "أتمتة 70% من العمليات الروتينية اليدوية.",
            "تطبيق معايير الجودة العالمية بشكل كامل.",
            "تحسين كفاءة استغلال المساحات والموارد المادية."
        ],
        learning: [
            "تدريب الفريق على أساليب 'اللين' (Lean Management).",
            "تطوير مهارات الصيانة الوقائية الاستباقية.",
            "بناء ثقافة التحسين المستمر (Kaizen) في بيئة العمل."
        ]
    };
}

/**
 * توليد سيناريوهات العمليات
 */
function generateOperationsScenarios(towsData = {}) {
    return {
        optimistic: "أتمتة كاملة لخطوط الإنتاج/الخدمة مع صفر أخطاء تشغيلية وتحقيق كفاءة قصوى في استهلاك الموارد + توسع في القدرة الانتاجية بنسبة 50%.",
        realistic: "استقرار سلاسل الإمداد وتحسين الإنتاجية بنسبة 15% عبر رقمنة العمليات الأساسية مع الحفاظ على معايير الجودة العالمية.",
        pessimistic: "توقف جزئي نتيجة تعطل أنظمة حرجة أو نقص في الموارد الأساسية، مما يرفع التكاليف التشغيلية بنسبة 20% ويؤدي لتأخر تسليم المخرجات."
    };
}

/**
 * توليد رؤية ورسالة العمليات
 */
function generateOperationsVisionMission() {
    return {
        vision: [
            "أن نكون النموذج العالمي في الكفاءة التشغيلية والابتكار المستدام.",
            "الوصول إلى عمليات ذكية ومستدامة تحقق قيمة قصوى بأقل موارد.",
            "الريادة في تقديم مخرجات ذات جودة فائقة عبر سلاسل إمداد مرنة."
        ],
        mission: [
            "حوكمة وتطوير العمليات لضمان تسليم المخرجات بأعلى كفاءة وأقل هدر.",
            "تمكين النمو عبر بنية تحتية تشغيلية مرنة وقابلة للتوسع.",
            "تحويل التحديات التشغيلية إلى فرص للتميز والريادة السوقية."
        ],
        values: [
            "• الكفاءة: القيام بالأشياء بشكل صحيح من المرة الأولى.",
            "• الابتكار: البحث المستمر عن طرق أفضل للعمل.",
            "• الجودة: لا تنازل عن المعايير في كافة الظروف.",
            "• السلامة: أمن الفريق والموارد هو الأولوية القصوى.",
            "• الرشاقة: الاستجابة السريعة لمتغيرات السوق."
        ]
    };
}

function generateOperationsKeyResults(obj) {
    const text = (obj || '').toLowerCase();
    if (text.includes('كفاءة') || text.includes('تكاليف') || text.includes('هدر')) {
        return [
            { text: 'خفض الهالك التشغيلي (Waste) في العمليات.', target: '3%' },
            { text: 'تحسين إنتاجية الموارد البشرية بالساعة.', target: '+15%' },
            { text: 'تحسين العائد على الأصول (ROA).', target: '+10%' }
        ];
    }
    if (text.includes('أتمتة') || text.includes('رقمنة') || text.includes('جودة')) {
        return [
            { text: 'أتمتة العمليات الأساسية المحددة في الخطة.', target: '100%' },
            { text: 'تقليل نسبة الأخطاء في تسليم المخرجات.', target: '0.1%' },
            { text: 'تحقيق متطلبات شهادة ISO للجودة.', target: '100%' }
        ];
    }
    return [
        { text: 'تحقيق أهداف خطة الإنتاج/الخدمة ربع السنوية.', target: '100%' },
        { text: 'خفض الحوادث التشغيلية المسببة للتوقف.', target: '0' },
        { text: 'تحسين زمن التسليم النهائي (Lead Time).', target: '-20%' }
    ];
}

// تصدير للنافذة العامة
if (typeof window !== 'undefined') {
    window.OPERATIONS_KEYS = OPERATIONS_KEYS;
    window.generateOperationsRisks = generateOperationsRisks;
    window.generateOperationsObjectives = generateOperationsObjectives;
    window.getDeptObjectives = generateOperationsObjectives;
    window.generateOperationsScenarios = generateOperationsScenarios;
    window.generateOperationsVisionMission = generateOperationsVisionMission;
    window.generateOperationsKeyResults = generateOperationsKeyResults;
}
