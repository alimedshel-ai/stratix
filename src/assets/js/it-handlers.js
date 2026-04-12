/**
 * it-handlers.js — أدوات تقنية المعلومات المشتركة
 */

const IT_KEYS = {
    deep_results: 'stratix_it_deep_data',
    swot: 'stratix_it_swot',
    directions: 'stratix_it_directions',
    objectives: 'stratix_it_objectives',
    kpis: 'stratix_it_kpis'
};

function generateITObjectives(towsData = {}) {
    return {
        financial: [
            "تقليل التكاليف التشغيلية للبنية التحتية بنسبة 15%.",
            "تحسين العائد على الاستثمار في الأصول التقنية (ROA).",
            "خفض الهدر في استهلاك الخدمات السحابية (Cloud Waste)."
        ],
        customer: [
            "رفع نسبة رضا المستخدمين الداخليين عن الدعم الفني.",
            "تقليل وقت الاستجابة لطلبات الخدمة (SLA Compliance).",
            "ضمان توافر الأنظمة (Uptime) بنسبة 99.9%."
        ],
        internal: [
            "أتمتة 30% من العمليات اليدوية المتكررة.",
            "تحديث البنية التحتية للأمان السيبراني.",
            "تسريع وتيرة إطلاق التحديثات البرمجية (DevOps)."
        ],
        learning: [
            "تدريب فريق التقنية على مهارات الحوسبة السحابية.",
            "الحصول على شهادة ISO 27001 لأمن المعلومات.",
            "بناء ثقافة الابتكار التقني داخل المنشأة."
        ]
    };
}

function generateITRisks() {
    return [
        { name: "اختراق أمني أو تسريب بيانات", category: "تقني", probability: 3, impact: 5, owner: "مدير التقنية", desc: "خطر تعرض الأنظمة لهجوم سيبراني يؤدي لفقدان البيانات.", mitigation: ["تحديث جدران الحماية", "تفعيل MFA"], contingency: "تفعيل خطة التعافي من الكوارث" },
        { name: "تعطل الخوادم الرئيسية", category: "تشغيلي", probability: 2, impact: 5, owner: "مهندس النظم", desc: "توقف الأنظمة الحرجة عن العمل.", mitigation: ["حلول النسخ المتماثل", "صيانة دورية"], contingency: "الانتقال للسيرفر البديل" },
        { name: "نقص مهارات الفريق التقني", category: "بشري", probability: 4, impact: 3, owner: "مدير التقنية", desc: "عدم القدرة على مواكبة التقنيات الحديثة.", mitigation: ["خطة تدريب مكثفة"], contingency: "الاستعانة بمستشارين خارجيين" }
    ];
}

function generateITStrategies(s, w, o, t) {
    return {
        so: ["استثمار البنية التحتية القوية للتوسع في الأسواق الرقمية الجديدة."],
        wo: ["أتمتة العمليات اليدوية الضعيفة لزيادة الكفاءة التشغيلية."],
        st: ["تعزيز بروتوكولات الأمان لمواجهة الهجمات السيبرانية المتزايدة."],
        wt: ["تحديث الأنظمة القديمة المتهالكة لتقليل مخاطر التوقف المفاجئ."]
    };
}

function generateITScenarios(towsData = {}) {
    return {
        optimistic: "تحول رقمي شامل وريادة تقنية عبر تبني أحدث تقنيات الذكاء الاصطناعي والحوسبة السحابية، مما يحقق كفاءة 100% في الأنظمة وصفر حوادث أمنية.",
        realistic: "استقرار وثبات في الأداء التقني مع تحديث تدريجي للبنية التحتية، وتحسين وقت الاستجابة للدعم الفني بنسبة 30%.",
        pessimistic: "توقف جزئي في الأنظمة نتيجة نقص في الميزانية أو هجمات سيبرانية، مما يستدعي خطة طوارئ تقشفية والتركيز على الأساسيات لضمان استمرارية العمل."
    };
}

function generateITVisionMission() {
    return {
        vision: ["أن نكون المحرك التقني الرائد للابتكار والنمو المستدام للمنظمة."],
        mission: ["تقديم حلول تقنية آمنة ومبتكرة تدعم أهداف العمل وتسهل حياة المستخدمين."],
        values: ["• الابتكار المستمر", "• الأمان والموثوقية", "• التميز في الدعم"]
    };
}

function generateITKeyResults(obj) {
    const text = (obj || '').toLowerCase();
    if (text.includes('أمان') || text.includes('حماية') || text.includes('اختراق')) {
        return [
            { text: 'إغلاق كافة الثغرات الأمنية الحرجة المكتشفة.', target: '100%' },
            { text: 'إجراء اختبار اختراق (Penetration Test) شامل.', target: '1' },
            { text: 'تفعيل نظام الحماية متعدد العوامل لكافة الموظفين.', target: '100%' }
        ];
    }
    if (text.includes('استمرارية') || text.includes('توقف') || text.includes('أداء')) {
        return [
            { text: 'ضمان استمرارية عمل الأنظمة الحرجة (Uptime).', target: '99.9%' },
            { text: 'تقليل زمن التعافي من الكوارث (RTO).', target: '4 ساعات' },
            { text: 'تحسين زمن استجابة الأنظمة للمستخدمين.', target: '0.5 ثانية' }
        ];
    }
    return [
        { text: 'تسريع زمن إغلاق تذاكر الدعم الفني (SLA).', target: '2 ساعة' },
        { text: 'أتمتة المهام التقنية الروتينية المتفق عليها.', target: '30%' },
        { text: 'إنجاز ترحيل البيانات للسحابة حسب الجدول الزمني.', target: '100%' }
    ];
}

// تصدير للنافذة العامة
if (typeof window !== 'undefined') {
    window.IT_KEYS = IT_KEYS;
    window.generateITObjectives = generateITObjectives;
    window.getDeptObjectives = generateITObjectives;
    window.generateITRisks = generateITRisks;
    window.generateITStrategies = generateITStrategies;
    window.generateITScenarios = generateITScenarios;
    window.generateITVisionMission = generateITVisionMission;
    window.generateITKeyResults = generateITKeyResults;
}
