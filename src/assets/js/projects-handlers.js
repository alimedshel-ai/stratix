/**
 * projects-handlers.js — أدوات إدارة المشاريع المشتركة (PMO)
 * يُستخدم في: projects-deep.html, swot.html?dept=projects, risk-map.html?dept=projects
 */

const PROJECTS_KEYS = {
    deep_results: 'stratix_projects_deep_results',
    strengths: 'stratix_projects_strengths',
    weaknesses: 'stratix_projects_weaknesses',
    swot: 'stratix_projects_swot',
    directions: 'stratix_projects_directions',
    kpis: 'stratix_projects_kpis',
    completed_steps: 'stratix_projects_completed_steps'
};

// ═══════════════════════════════════════════════════
// 1. استخلاص المخاطر المقترحة (Project Risks)
// ═══════════════════════════════════════════════════
function generateProjectsRisks(towsData = {}) {
    return [
        {
            name: "زحف النطاق (Scope Creep)",
            category: "تشغيلي",
            probability: 5,
            impact: 4,
            owner: "مدير المشروع",
            desc: "إضافة متطلبات جديدة للمشروع دون تعديل الجدول الزمني أو الميزانية، مما يسبب تأخراً حاداً.",
            mitigation: ["تفعيل عملية رسمية للتحكم في التغيير", "تعريف دقيق للنطاق في البداية"],
            contingency: "وقف الإضافات فوراً وجدولة المتطلبات الجديدة في مرحلة لاحقة (Phase 2)."
        },
        {
            name: "نقص الموارد البشرية المتخصصة",
            category: "بشري",
            probability: 4,
            impact: 5,
            owner: "مدير الموارد",
            desc: "انشغال الكفاءات الأساسية في مهام تشغيلية أو مشاريع أخرى، مما يعطل مسار المشروع الحرج.",
            mitigation: ["خطة تخصيص موارد مسبقة", "توزيع هرمي للمسؤوليات"],
            contingency: "الاستعانة بمصادر خارجية (Outsourcing) أو إعادة ترتيب أولويات المحفظة."
        },
        {
            name: "تأخر الموردين أو المقاولين",
            category: "سوق",
            probability: 3,
            impact: 5,
            owner: "مدير المشتريات",
            desc: "عدم التزام الجهات الخارجية بمواعيد التسليم، مما يؤثر على ترابط المهام (Dependencies).",
            mitigation: ["اتفاقيات مستوى خدمة (SLA) صارمة", "متابعة دورية أسبوعية للموردين"],
            contingency: "تفعيل بنود الجزاءات والبحث عن مورد بديل بشكل عاجل."
        },
        {
            name: "تجاوز التكاليف التقديرية",
            category: "مالي",
            probability: 3,
            impact: 4,
            owner: "المدير المالي للمشروع",
            desc: "ظهور تكاليف غير متوقعة أو ارتفاع أسعار المواد، مما يهدد الجدوى الاقتصادية للمشروع.",
            mitigation: ["إضافة هامش احتياطي للطوارئ (Contingency Buffer)", "مراقبة التكاليف اللحظية"],
            contingency: "إعادة هندسة القيمة (Value Engineering) أو تقليص بعض الميزات غير الجوهرية."
        },
        {
            name: "ضعف التواصل بين أصحاب المصلحة",
            category: "تشغيلي",
            probability: 4,
            impact: 3,
            owner: "مدير مكتب المشاريع",
            desc: "عدم وضوح الأهداف أو سوء الفهم بين الفريق والإدارة، مما يؤدي لإعادة العمل (Rework).",
            mitigation: ["خطة تواصل رسمية", "اجتماعات دورية قصيرة (Daily Stand-ups)"],
            contingency: "عقد ورشة عمل 'تصحيح مسار' لتوحيد الرؤية وإعادة تأكيد المستهدفات."
        }
    ];
}

// ═══════════════════════════════════════════════════
// 2. أهداف مكتب المشاريع (PMO Objectives)
// ═══════════════════════════════════════════════════
function generateProjectsObjectives(towsData = {}) {
    return {
        financial: [
            "تحقيق وفر مالي في تنفيذ المشاريع بنسبة 10%.",
            "زيادة دقة نظام تقدير التكاليف (Estimating Accuracy).",
            "تحقيق العائد المتوقع من الاستثمار (ROI) للمشاريع الرأسمالية."
        ],
        customer: [
            "رفع تقييم رضا أصحاب المصلحة عن تسليمات المشروع.",
            "تحقيق نسبة 90% من معايير قبول المخرجات من المرة الأولى.",
            "تحسين الشفافية عبر لوحات بيانات حية للشركاء."
        ],
        internal: [
            "رفع نسبة التسليم في الوقت المحدد (On-time Delivery) إلى 85%.",
            "أتمتة تقرير الحالة الأسبوعي لتقليل الجهد اليدوي.",
            "تحسين عملية إدارة المخاطر وتوقع العثرات قبل وقوعها."
        ],
        learning: [
            "حصول 80% من مديري المشاريع على شهادة PMP أو Agile.",
            "بناء قاعدة معرفية (Knowledge Base) للدروس المستفادة.",
            "تطوير مهارات القيادة وإدارة الفرق الافتراضية."
        ]
    };
}

// تصدير للنافذة العامة
if (typeof window !== 'undefined') {
    window.PROJECTS_KEYS = PROJECTS_KEYS;
    window.generateProjectsRisks = generateProjectsRisks;
    window.generateProjectsObjectives = generateProjectsObjectives;
    window.getDeptObjectives = generateProjectsObjectives;
}
