/**
 * compliance-handlers.js — أدوات الامتثال والحوكمة
 * يُستخدم في: compliance-deep.html, compliance-audit.html, risk-map.html?dept=compliance
 */

const COMPLIANCE_KEYS = {
    deep_results: 'stratix_compliance_deep_data',
    swot: 'stratix_compliance_swot',
    directions: 'stratix_compliance_directions',
    objectives: 'stratix_compliance_objectives',
    kpis: 'stratix_compliance_kpis',
    completed_steps: 'stratix_compliance_completed_steps'
};

/**
 * استخلاص المخاطر المقترحة للامتثال
 */
function generateComplianceRisks(towsData = {}) {
    return [
        {
            name: "عدم الالتزام بالأنظمة واللوائح (Regulatory Breach)",
            category: "قانوني",
            probability: 2,
            impact: 5,
            owner: "مدير الامتثال",
            desc: "مخالفة الأنظمة الحكومية أو معايير الهيئة المشرفة، مما يعرض المنشأة لغرامات مالية باهظة.",
            mitigation: ["تحديث سجل اللوائح دورياً", "إجراء تدقيق داخلي ربع سنوي"],
            contingency: "تصحيح المخالفة فوراً والتواصل مع الجهات التنظيمية لتوضيح خطة المعالجة."
        },
        {
            name: "تأخر تجديد التراخيص الحكومية",
            category: "تشغيلي",
            probability: 3,
            impact: 5,
            owner: "مسؤول العلاقات الحكومية",
            desc: "نسيان أو تأخير تجديد تراخيص النشاط أو الشهادات المهنية، مما يوقف العمل قانونياً.",
            mitigation: ["نظام تنبيهات مبكر للتواريخ", "توظيف فريق مخصص للتعقيب"],
            contingency: "وقف العمل في المناطق المتأثرة فوراً وبدء إجراءات التجديد الطارئة."
        },
        {
            name: "ضعف الحوكمة الداخلية وتضارب المصالح",
            category: "حوكمة",
            probability: 3,
            impact: 4,
            owner: "مجلس الإدارة / المالك",
            desc: "عدم وجود سياسات واضحة لاتخاذ القرار أو تداخل الصلاحيات بشكل يضر بمصلحة المنشأة.",
            mitigation: ["تفعيل مصفوفة الصلاحيات (DOA)", "سياسة تضارب مصالح معتمدة"],
            contingency: "تشكيل لجنة تدقيق مستقلة للمراجعة وإعادة هيكلة الصلاحيات."
        },
        {
            name: "مخاطر غسيل الأموال وتمويل الإرهاب (AML)",
            category: "قانوني",
            probability: 1,
            impact: 5,
            owner: "مسؤول الالتزام",
            desc: "استغلال المنشأة في عمليات مالية مشبوهة نتيجة ضعف إجراءات 'اعرف عميلك' (KYC).",
            mitigation: ["نظام فحص آلي للعملاء", "تدريب مكثف للفريق المالي"],
            contingency: "تجميد الحسابات المشبوهة وإبلاغ وحدة الاستخبارات المالية فوراً."
        },
        {
            name: "تسرب المعلومات السرية أو انتهاك الخصوصية",
            category: "قانوني",
            probability: 3,
            impact: 5,
            owner: "مدير أمن المعلومات",
            desc: "انتهاك سياسات حماية البيانات الشخصية للعملاء، مما يؤدي لعقوبات قانونية وفقدان الثقة.",
            mitigation: ["تطبيق سياسة NDA صارمة", "تشفير البيانات الحساسة"],
            contingency: "تفعيل خطة الاستجابة للخرقات وإبلاغ هيئة البيانات والذكاء الاصطناعي (SDAIA)."
        }
    ];
}

/**
 * أهداف الامتثال (BSC)
 */
function generateComplianceObjectives(towsData = {}) {
    return {
        financial: [
            "صفر غرامات ناتجة عن عدم الامتثال بنسبة 100%.",
            "تقليل تكاليف التدقيق الخارجي عبر الجاهزية الداخلية.",
            "تحسين كفاءة الإنفاق في مبادرات الحوكمة."
        ],
        customer: [
            "تعزيز سمعة المنشأة في السوق ككيان محوكم وممتثل.",
            "زيادة ثقة المستثمرين والجهات التمويلية.",
            "ضمان حماية حقوق المستفيدين وكافة أصحاب المصلحة."
        ],
        internal: [
            "تطوير وأتمتة سجل المخاطر بنسبة 100%.",
            "تحديث كافة السياسات والإجراءات لتتوافق مع اللوائح الجديدة.",
            "تحقيق نسبة التزام 100% بكافة متطلبات الترخيص."
        ],
        learning: [
            "نشر ثقافة الالتزام والنزاهة بين كافة الموظفين.",
            "تدريب فريق العمل على أحدث معايير الحوكمة الدولية.",
            "إطلاق مبادرات توعوية دورية عن أخلاقيات العمل."
        ]
    };
}

/**
 * سيناريوهات الامتثال
 */
function generateComplianceScenarios(towsData = {}) {
    return {
        optimistic: "تحقيق امتثال كامل وشامل (Perfect Compliance) مع الحصول على شهادات تميز عالمية في الحوكمة، مما يفتح آفاقاً جديدة للاستثمار والشراكات الكبرى.",
        realistic: "الاحتفاظ بمستوى امتثال جيد مع صفر مخالفات جوهرية، وتحديث مستمر لسجل اللوائح لمواكبة التغيرات التنظيمية.",
        pessimistic: "التعرض لعقوبات أو غرامات نتيجة ثغرات في الحوكمة أو تأخر في التراخيص، مما يستدعي خطة معالجة عاجلة لإعادة الثقة مع الجهات الرقابية."
    };
}

/**
 * رؤية ورسالة الامتثال
 */
function generateComplianceVisionMission() {
    return {
        vision: [
            "أن نكون المرجع الأول في النزاهة والحوكمة الرشيدة على مستوى القطاع.",
            "الوصول بالمنشأة إلى أعلى معايير الامتثال العالمي والشفافية التامة.",
            "بناء بيئة عمل قائمة على العدالة والمسؤولية تصون حقوق الجميع."
        ],
        mission: [
            "حماية المنشأة من المخاطر القانونية وتعزيز ثقة كافة أصحاب المصلحة.",
            "ترسيخ مبادئ الحوكمة والامتثال في كافة مفاصل القرار والعمليات.",
            "ضمان استدامة الأعمال عبر بيئة قانونية آمنة ومدروسة المخاطر."
        ],
        values: [
            "• النزاهة: العمل بمعايير أخلاقية لا تتجزأ.",
            "• الشفافية: الوضوح التام في كافة القرارات والتقارير.",
            "• المسؤولية: كل فرد مسؤول عن الامتثال في نطاقه.",
            "• التحوط: الاستباقية في اكتشاف ومعالجة المخاطر.",
            "• العدالة: تطبيق الأنظمة بحيادية تامة."
        ]
    };
}

function generateComplianceKeyResults(obj) {
    const text = (obj || '').toLowerCase();
    if (text.includes('مخالفات') || text.includes('غرامات') || text.includes('امتثال')) {
        return [
            { text: 'صفر غرامات ناتجة عن عدم الامتثال بنسبة 100%.', target: '0 ر.س' },
            { text: 'إغلاق كافة ملاحظات التدقيق الداخلي والخارجي.', target: '100%' },
            { text: 'تحقيق درجة التزام عالية في التقرير التنظيمي السنوي.', target: '+95%' }
        ];
    }
    if (text.includes('ترخيص') || text.includes('حكومي') || text.includes('لوائح')) {
        return [
            { text: 'تجديد كافة التراخيص الحكومية قبل تاريخ الانتهاء بـ 30 يوم.', target: '100%' },
            { text: 'تحديث سجل اللوائح والأنظمة المنطبقة ومطابقتها.', target: 'ربع سنوي' },
            { text: 'أتمتة نظام إدارة الوثائق القانونية والتراخيص.', target: '100%' }
        ];
    }
    return [
        { text: 'تدريب 100% من كبار الموظفين على سياسة أخلاقيات العمل.', target: '15 قيادي' },
        { text: 'إنجاز خطة الجرد الدوري والتدقيق الميداني للفروع بصفر تجاوزات.', target: '0 ملاحظات' },
        { text: 'رفع مستوى الوعي بالامتثال عبر اختبارات دورية للموظفين.', target: '80% نجاح' }
    ];
}

// تصدير للنافذة العامة
if (typeof window !== 'undefined') {
    window.COMPLIANCE_KEYS = COMPLIANCE_KEYS;
    window.generateComplianceRisks = generateComplianceRisks;
    window.generateComplianceObjectives = generateComplianceObjectives;
    window.getDeptObjectives = generateComplianceObjectives;
    window.generateComplianceScenarios = generateComplianceScenarios;
    window.generateComplianceVisionMission = generateComplianceVisionMission;
    window.generateComplianceKeyResults = generateComplianceKeyResults;
}
