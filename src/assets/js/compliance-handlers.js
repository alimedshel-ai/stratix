/**
 * compliance-handlers.js — أدوات الامتثال (نموذج هجين v2)
 * ============================================================
 * مولّد المخاطر + أهداف BSC + سيناريوهات + رؤية/رسالة
 * يعمل مع buildAuditAxes (جديد) أو بشكل مستقل (legacy)
 * يُستخدم في: compliance-deep.html, compliance-audit.html, risk-map.html?dept=compliance,
 *              swot.html, tows.html, scenarios.html, directions.html, objectives.html, okrs.html
 * ============================================================
 */

var COMPLIANCE_KEYS = {
    deep_results: 'stratix_compliance_deep_data',
    swot: 'stratix_compliance_swot',
    directions: 'stratix_compliance_directions',
    objectives: 'stratix_compliance_objectives',
    kpis: 'stratix_compliance_kpis',
    completed_steps: 'stratix_compliance_completed_steps'
};

// ══════════════════════════════════════════════════════════
// 1) قاعدة المخاطر — مرتبطة بالمحاور (core + contextual)
// ══════════════════════════════════════════════════════════
var RISKS_BY_AXIS = {
    // -- المحاور الأساسية
    governance: {
        name: 'ضعف الحوكمة والقرارات غير الموثّقة',
        category: 'حوكمة',
        probability: 3, impact: 4,
        owner: 'مجلس الإدارة / المالك',
        desc: 'عدم وجود سياسات واضحة لاتخاذ القرار أو تداخل الصلاحيات بشكل يضر بمصلحة المنشأة.',
        mitigation: ['اعتماد لائحة حوكمة', 'توثيق محاضر القرارات', 'تفعيل مصفوفة الصلاحيات (DOA)'],
        contingency: 'تشكيل لجنة تدقيق مستقلة للمراجعة وإعادة هيكلة الصلاحيات.'
    },
    hr_labor: {
        name: 'مخالفات نظام العمل والسعودة',
        category: 'تشغيلي',
        probability: 4, impact: 4,
        owner: 'مدير الموارد البشرية',
        desc: 'عدم الالتزام بنظام العمل أو متطلبات نطاقات أو حماية الأجور.',
        mitigation: ['مراجعة دورية لنطاقات', 'تحديث العقود في قوى', 'نظام تنبيهات لمواعيد التأمينات'],
        contingency: 'تصحيح المخالفات فوراً والتقدم لبرنامج حماية الأجور العاجل.'
    },
    finance_zakat: {
        name: 'تأخر الإقرارات الضريبية والغرامات',
        category: 'مالي',
        probability: 3, impact: 5,
        owner: 'المدير المالي',
        desc: 'مخالفة مواعيد الإقرارات الزكوية/الضريبية أو أخطاء في الفوترة الإلكترونية.',
        mitigation: ['تقويم تنبيهات للمواعيد', 'تفويض محاسب معتمد', 'مراجعة شهرية للفوترة'],
        contingency: 'سداد فوري للمستحقات وتقديم اعتراض إذا كانت الغرامات غير مستحقة.'
    },
    data_privacy: {
        name: 'انتهاك نظام حماية البيانات الشخصية (PDPL)',
        category: 'تقني (Q3)',
        probability: 2, impact: 5,
        owner: 'مسؤول حماية البيانات (DPO)',
        desc: 'انتهاك سياسات حماية البيانات الشخصية. العقوبة تصل لـ 5 مليون ريال وسجن في حالات التسريب العمد.',
        mitigation: ['تعيين DPO قانوني', 'تقييم أثر الخصوصية (DPIA)', 'تشفير قواعد البيانات الحساسة'],
        contingency: 'تفعيل خطة الاستجابة للخرقات وتعيين مستشار قانوني متخصص للبلاغ.'
    },
    anti_concealment: {
        name: 'شبهة التستر التجاري (Anti-Concealment)',
        category: 'قانوني (Q4)',
        probability: 2, impact: 5,
        owner: 'مجلس الإدارة / المالك',
        desc: 'مخالفة نظام مكافحة التستر. العقوبة تصل لـ 5 مليون ريال وسجن 5 سنوات ومصادرة الأموال.',
        mitigation: ['حوكمة العمليات المالية', 'تجنب الحسابات البنكية الشخصية', 'التدقيق في الشركاء الفعليين'],
        contingency: 'الدخول في برنامج التصحيح الوطني فوراً أو تصحيح وضع الملكية.'
    },
    cybersecurity: {
        name: 'هجمات سيبرانية وتسرّب بيانات',
        category: 'تقني',
        probability: 4, impact: 5,
        owner: 'مدير أمن المعلومات',
        desc: 'تعرض الأنظمة لاختراق أو تسرب بيانات نتيجة ضعف الضوابط الأمنية.',
        mitigation: ['تطبيق ضوابط NCA الأساسية', 'خطة استجابة للحوادث', 'فحص اختراق سنوي'],
        contingency: 'عزل الأنظمة المتضررة وتفعيل خطة الطوارئ السيبرانية.'
    },
    licenses: {
        name: 'انتهاء التراخيص دون تجديد',
        category: 'تشغيلي',
        probability: 3, impact: 5,
        owner: 'مسؤول العلاقات الحكومية',
        desc: 'نسيان أو تأخير تجديد تراخيص النشاط أو الشهادات، مما يوقف العمل قانونياً.',
        mitigation: ['سجل تراخيص مركزي', 'تنبيهات قبل 60 يوم', 'فريق مخصص للتعقيب'],
        contingency: 'وقف العمل في المناطق المتأثرة وبدء إجراءات التجديد الطارئة.'
    },
    contracts: {
        name: 'نزاعات تعاقدية وغياب التوثيق',
        category: 'قانوني',
        probability: 3, impact: 3,
        owner: 'المستشار القانوني',
        desc: 'غياب العقود الموثّقة أو ضعف بنود الحماية القانونية.',
        mitigation: ['قوالب عقود معتمدة', 'مراجعة قانونية قبل التوقيع', 'سجل عقود مركزي'],
        contingency: 'التحكيم أو الوساطة لحل النزاعات مع توثيق الدروس المستفادة.'
    },
    reporting: {
        name: 'تأخر التقارير الرقابية',
        category: 'تنظيمي',
        probability: 3, impact: 4,
        owner: 'مسؤول الإفصاح',
        desc: 'عدم تقديم التقارير والإفصاحات المطلوبة للجهات الرقابية في مواعيدها.',
        mitigation: ['جدول مواعيد آلي', 'مسؤول إفصاح معيّن', 'مراجعة قبل التقديم'],
        contingency: 'تقديم فوري مع خطاب اعتذار وخطة لمنع التكرار.'
    },
    insurance: {
        name: 'نقص التغطية التأمينية وتحمّل خسائر مباشرة',
        category: 'مالي',
        probability: 3, impact: 4,
        owner: 'المدير المالي / مدير المشتريات',
        desc: 'عدم وجود تأمين كافٍ على المركبات أو الممتلكات أو المسؤولية تجاه الغير يعرّض المنشأة لخسائر مالية كبيرة.',
        mitigation: ['جرد سنوي لوثائق التأمين', 'تجديد تلقائي قبل 30 يوم', 'مراجعة التغطيات مع وسيط تأمين'],
        contingency: 'إصدار وثائق تأمين طارئة وتقييم الأضرار غير المغطّاة.'
    },

    // -- المحاور السياقية (نشاط صناعي)
    occupational_safety: {
        name: 'إصابات عمل وحوادث في موقع الإنتاج',
        category: 'تشغيلي',
        probability: 4, impact: 5,
        owner: 'مدير السلامة (HSE)',
        desc: 'حوادث عمل نتيجة ضعف إجراءات السلامة أو نقص معدات الوقاية.',
        mitigation: ['برنامج HSE شامل', 'تدريب دوري', 'معدات وقاية كافية'],
        contingency: 'تحقيق فوري في الحادث وتفعيل خطة الطوارئ الطبية.'
    },
    environment: {
        name: 'مخالفات بيئية وعقوبات المركز الوطني للرقابة',
        category: 'بيئي',
        probability: 3, impact: 4,
        owner: 'مسؤول البيئة',
        desc: 'تجاوز حدود الانبعاثات أو سوء إدارة النفايات الصناعية.',
        mitigation: ['تصاريح بيئية محدّثة', 'قياس انبعاثات منتظم', 'إدارة نفايات معتمدة'],
        contingency: 'إيقاف النشاط المتسبب وتصحيح المخالفة البيئية فوراً.'
    },
    hazmat: {
        name: 'حوادث تسرّب أو تخزين خاطئ لمواد خطرة',
        category: 'تشغيلي',
        probability: 3, impact: 5,
        owner: 'مسؤول المواد الخطرة',
        desc: 'تسرب مواد كيميائية أو تخزين غير آمن يهدد سلامة العاملين والبيئة.',
        mitigation: ['بطاقات MSDS', 'تخزين معتمد', 'تدريب متخصص'],
        contingency: 'إخلاء فوري وتفعيل فريق الاستجابة للطوارئ الكيميائية.'
    },
    product_quality: {
        name: 'استدعاء منتجات أو رفض مطابقة SASO',
        category: 'تجاري',
        probability: 2, impact: 4,
        owner: 'مدير الجودة',
        desc: 'رفض المنتجات لعدم مطابقتها للمواصفات القياسية.',
        mitigation: ['فحص جودة دوري', 'شهادات مطابقة SASO', 'نظام تتبع الدُفعات'],
        contingency: 'سحب المنتج من السوق وإصدار بيان استدعاء فوري.'
    },

    // -- المحاور السياقية (نشاط تجاري)
    consumer_protection: {
        name: 'شكاوى المستهلكين وعقوبات وزارة التجارة',
        category: 'تجاري',
        probability: 4, impact: 3,
        owner: 'مدير خدمة العملاء',
        desc: 'تراكم شكاوى العملاء أو مخالفة أنظمة حماية المستهلك.',
        mitigation: ['سياسة إرجاع واضحة', 'قناة شكاوى فعّالة', 'رد خلال 48 ساعة'],
        contingency: 'تعويض العميل فوراً والتواصل مع وزارة التجارة استباقياً.'
    },
    pricing_practices: {
        name: 'عقوبات الغش التجاري والممارسات السعرية',
        category: 'قانوني',
        probability: 3, impact: 4,
        owner: 'المدير التجاري',
        desc: 'مخالفة أنظمة التسعير أو الغش التجاري أو المنافسة غير المشروعة.',
        mitigation: ['مراجعة دورية للأسعار', 'تدريب الموظفين', 'سياسة منافسة عادلة'],
        contingency: 'تصحيح السعر فوراً والتعاون مع هيئة المنافسة.'
    },
    trademarks_ip: {
        name: 'انتهاك علامات تجارية أو تقليد منتجات',
        category: 'قانوني',
        probability: 2, impact: 4,
        owner: 'المستشار القانوني',
        desc: 'استخدام غير مصرح لعلامات تجارية أو تقليد منتجات.',
        mitigation: ['تسجيل العلامات', 'فحص الموردين', 'مراقبة السوق'],
        contingency: 'إيقاف بيع المنتج المخالف واتخاذ إجراء قانوني.'
    },
    ecommerce: {
        name: 'مخالفات نظام التجارة الإلكترونية',
        category: 'تنظيمي',
        probability: 3, impact: 3,
        owner: 'مدير التجارة الإلكترونية',
        desc: 'عدم الالتزام بنظام التجارة الإلكترونية أو توثيق المتجر.',
        mitigation: ['توثيق المتجر', 'شروط بيع واضحة', 'حماية بيانات الدفع'],
        contingency: 'إيقاف المتجر مؤقتاً وتصحيح المخالفات فوراً.'
    },

    // -- المحاور السياقية (نشاط خدمي)
    service_quality: {
        name: 'انتهاكات SLA وفقدان عملاء',
        category: 'تشغيلي',
        probability: 4, impact: 4,
        owner: 'مدير العمليات',
        desc: 'عدم الالتزام باتفاقيات مستوى الخدمة وتراجع رضا العملاء.',
        mitigation: ['مراقبة مؤشرات الخدمة', 'تقارير شهرية للعملاء', 'خطة تحسين مستمر'],
        contingency: 'تعويض العملاء المتضررين ووضع خطة تصحيحية عاجلة.'
    },
    customer_data: {
        name: 'تسرّب بيانات عملاء حساسة',
        category: 'قانوني',
        probability: 3, impact: 5,
        owner: 'مسؤول أمن المعلومات',
        desc: 'تسرب بيانات العملاء نتيجة ضعف الصلاحيات أو غياب التشفير.',
        mitigation: ['صلاحيات مقيّدة', 'تشفير البيانات', 'اتفاقيات سرية'],
        contingency: 'إبلاغ العملاء المتضررين وسدايا وتفعيل خطة الاستجابة.'
    },
    professional_licensing: {
        name: 'ممارسة المهنة بكوادر غير مرخّصة',
        category: 'قانوني',
        probability: 3, impact: 4,
        owner: 'مدير الموارد البشرية',
        desc: 'عمل كوادر فنية بدون تراخيص مهنية سارية.',
        mitigation: ['سجل تراخيص الكوادر', 'تجديد دوري', 'تحقق قبل التعيين'],
        contingency: 'إيقاف الممارسة فوراً وتسريع إصدار التراخيص.'
    },

    // -- المحاور السياقية (قطاع)
    gov_procurement: {
        name: 'مخالفات نظام المنافسات والمشتريات',
        category: 'تنظيمي',
        probability: 3, impact: 5,
        owner: 'مدير المشتريات',
        desc: 'مخالفة إجراءات المنافسات الحكومية أو التأهيل.',
        mitigation: ['تدريب فريق المشتريات', 'مراجعة كل ترسية', 'التحقق من منصة اعتماد'],
        contingency: 'إيقاف العملية والتصحيح فوراً مع إبلاغ الجهة المتعاقدة.'
    },
    gov_transparency: {
        name: 'قصور في الإفصاح والشفافية',
        category: 'حوكمة',
        probability: 3, impact: 4,
        owner: 'مسؤول الحوكمة',
        desc: 'عدم الإفصاح عن العقود والأداء وفق متطلبات نزاهة.',
        mitigation: ['لوحة شفافية منشورة', 'إفصاحات دورية', 'سياسة مكافحة فساد'],
        contingency: 'نشر فوري للإفصاحات المتأخرة والتواصل مع نزاهة.'
    },
    nonprofit_governance: {
        name: 'مخالفات لائحة الجمعيات والمؤسسات',
        category: 'تنظيمي',
        probability: 3, impact: 4,
        owner: 'أمين مجلس الإدارة',
        desc: 'عدم الالتزام بلائحة الجمعيات أو التأخر في عقد الجمعية العمومية.',
        mitigation: ['جمعية عمومية منتظمة', 'إفصاح عن التبرعات', 'تقرير مالي سنوي'],
        contingency: 'عقد جمعية عمومية طارئة وتقديم التقارير المتأخرة.'
    },
    mixed_disclosure: {
        name: 'إخفاء شراكات أو تضارب مصالح',
        category: 'حوكمة',
        probability: 3, impact: 4,
        owner: 'المدير العام',
        desc: 'عدم الإفصاح عن الشراكات ومصادر التمويل المتنوعة.',
        mitigation: ['سياسة إفصاح', 'سجل تضارب مصالح', 'حسابات منفصلة'],
        contingency: 'إفصاح فوري والتعاون مع الجهات الرقابية.'
    }
};

// ══════════════════════════════════════════════════════════
// 2) أهداف BSC مرتبطة بالمحاور
// ══════════════════════════════════════════════════════════
var BSC_OBJECTIVES_BY_AXIS = {
    governance: { perspective: 'العمليات الداخلية', objective: 'تعزيز ثقافة الحوكمة المؤسسية', kpi: 'نسبة القرارات الموثّقة' },
    hr_labor: { perspective: 'التعلم والنمو', objective: 'الالتزام الكامل بأنظمة العمل', kpi: 'نسبة عقود قوى المحدّثة' },
    finance_zakat: { perspective: 'المالية', objective: 'صفر غرامات ضريبية', kpi: 'عدد الغرامات السنوية' },
    data_privacy: { perspective: 'العمليات الداخلية', objective: 'حماية بيانات العملاء وفق PDPL', kpi: 'نسبة الموافقات المُجمعة' },
    cybersecurity: { perspective: 'العمليات الداخلية', objective: 'صفر اختراقات سيبرانية', kpi: 'عدد الحوادث/السنة' },
    licenses: { perspective: 'العمليات الداخلية', objective: 'استمرارية التراخيص', kpi: 'نسبة التراخيص السارية' },
    contracts: { perspective: 'العمليات الداخلية', objective: 'تقليل النزاعات التعاقدية', kpi: 'عدد النزاعات/السنة' },
    reporting: { perspective: 'العمليات الداخلية', objective: 'الإفصاح في الموعد', kpi: 'نسبة التقارير في موعدها' },
    occupational_safety: { perspective: 'التعلم والنمو', objective: 'بيئة عمل آمنة', kpi: 'معدل الإصابات لكل 1000 ساعة عمل' },
    environment: { perspective: 'العمليات الداخلية', objective: 'الاستدامة البيئية', kpi: 'مستوى الانبعاثات السنوي' },
    hazmat: { perspective: 'العمليات الداخلية', objective: 'صفر حوادث مواد خطرة', kpi: 'عدد الحوادث الكيميائية/السنة' },
    product_quality: { perspective: 'العملاء', objective: 'منتجات مطابقة 100%', kpi: 'نسبة مطابقة SASO' },
    consumer_protection: { perspective: 'العملاء', objective: 'رضا المستهلكين', kpi: 'معدل الشكاوى الشهرية' },
    pricing_practices: { perspective: 'المالية', objective: 'ممارسات تسعير عادلة', kpi: 'صفر مخالفات تسعير' },
    trademarks_ip: { perspective: 'العمليات الداخلية', objective: 'حماية الملكية الفكرية', kpi: 'نسبة العلامات المسجلة' },
    ecommerce: { perspective: 'العملاء', objective: 'متجر إلكتروني ممتثل', kpi: 'نسبة التوافق مع النظام' },
    service_quality: { perspective: 'العملاء', objective: 'تجاوز توقعات العملاء', kpi: 'مؤشر NPS' },
    customer_data: { perspective: 'العملاء', objective: 'حماية بيانات العملاء', kpi: 'صفر تسرّبات' },
    professional_licensing: { perspective: 'التعلم والنمو', objective: 'كوادر مرخّصة 100%', kpi: 'نسبة الكوادر المرخّصة' },
    gov_procurement: { perspective: 'العمليات الداخلية', objective: 'امتثال المنافسات', kpi: 'نسبة الالتزام باعتماد' },
    gov_transparency: { perspective: 'العمليات الداخلية', objective: 'شفافية كاملة', kpi: 'نسبة الإفصاحات المنشورة' },
    nonprofit_governance: { perspective: 'العمليات الداخلية', objective: 'حوكمة القطاع غير الربحي', kpi: 'عقد الجمعيات العمومية في موعدها' },
    mixed_disclosure: { perspective: 'العمليات الداخلية', objective: 'إفصاح شامل عن الأنشطة', kpi: 'نسبة الشراكات المفصح عنها' }
};

// ══════════════════════════════════════════════════════════
// 3) المولّدات (تعمل مع buildAuditAxes الجديد + legacy)
// ══════════════════════════════════════════════════════════

/**
 * توليد المخاطر — إذا مُرر auditConfig (ناتج buildAuditAxes) يولّد ديناميكياً
 */
function generateComplianceRisks(towsDataOrConfig) {
    // محاور الحوكمة الصرفة — تُدار في generateGovernanceRisks
    var governanceOnlyAxes = ['governance', 'mixed_disclosure', 'gov_transparency', 'gov_procurement', 'nonprofit_governance'];
    if (towsDataOrConfig && towsDataOrConfig.allAxes) {
        return towsDataOrConfig.allAxes
            .filter(function (axis) { return governanceOnlyAxes.indexOf(axis.id) === -1; })
            .map(function (axis) { return RISKS_BY_AXIS[axis.id]; })
            .filter(Boolean)
            .map(function (risk, i) {
                return Object.assign({}, risk, { id: 'R' + String(i + 1).padStart(3, '0') });
            });
    }
    // Legacy: المخاطر الأساسية للامتثال فقط (بدون حوكمة)
    var coreIds = ['hr_labor', 'finance_zakat', 'data_privacy', 'cybersecurity', 'licenses', 'contracts', 'reporting'];
    return coreIds.map(function (id, i) {
        var risk = RISKS_BY_AXIS[id];
        return risk ? Object.assign({}, risk, { id: 'R' + String(i + 1).padStart(3, '0') }) : null;
    }).filter(Boolean);
}

/**
 * أهداف الامتثال (BSC)
 */
function generateComplianceObjectives(towsDataOrConfig) {
    if (towsDataOrConfig && towsDataOrConfig.allAxes) {
        var result = { financial: [], customer: [], internal: [], learning: [] };
        var perspectiveMap = { 'المالية': 'financial', 'العملاء': 'customer', 'العمليات الداخلية': 'internal', 'التعلم والنمو': 'learning' };
        // استثناء محاور الحوكمة الصرفة (توجد في generateGovernanceObjectives)
        var governanceOnlyAxes = ['governance', 'mixed_disclosure', 'gov_transparency', 'gov_procurement', 'nonprofit_governance'];
        towsDataOrConfig.allAxes.forEach(function (axis) {
            if (governanceOnlyAxes.indexOf(axis.id) !== -1) return;
            var obj = BSC_OBJECTIVES_BY_AXIS[axis.id];
            if (obj) {
                var key = perspectiveMap[obj.perspective] || 'internal';
                result[key].push(obj.objective + ' — KPI: ' + obj.kpi);
            }
        });
        return result;
    }
    return {
        financial: [
            'صفر غرامات ناتجة عن عدم الامتثال التنظيمي بنسبة 100%.',
            'تقليل تكاليف التدقيق الخارجي عبر رفع جاهزية الامتثال الداخلي.',
            'خفض تكلفة عدم الامتثال السنوية (Cost of Non-Compliance).'
        ],
        customer: [
            'ضمان امتثال كامل لحقوق المستهلكين وحماية بياناتهم وفق PDPL.',
            'تحقيق نسبة 100% من مطابقة المنتجات والخدمات لاشتراطات SASO/الجهات الرقابية.',
            'تقليل شكاوى الجهات التنظيمية إلى الحد الأدنى.'
        ],
        internal: [
            'تحديث سجل اللوائح والأنظمة المُنطبقة وربطها بإجراءات داخلية.',
            'تجديد وتحديث كافة التراخيص قبل تاريخ الانتهاء بـ 30 يوماً.',
            'أتمتة نظام إدارة الوثائق القانونية وإقرارات الامتثال.',
            'إغلاق 100% من ملاحظات التدقيق الداخلي والخارجي في موعدها.'
        ],
        learning: [
            'تدريب 100% من الموظفين على متطلبات الامتثال التنظيمية السنوية.',
            'رفع نسبة اجتياز اختبارات الوعي بالامتثال إلى 90% فأعلى.',
            'تأهيل فريق الامتثال على الشهادات المهنية (CCEP / CAMS / ICA).'
        ]
    };
}

/**
 * سيناريوهات الامتثال
 */
function generateComplianceScenarios(towsDataOrConfig) {
    if (towsDataOrConfig && towsDataOrConfig.allAxes) {
        var criticalAxes = towsDataOrConfig.allAxes.filter(function (a) { return a.weight >= 1.1; }).length;
        return {
            optimistic: 'تطبيق فوري لـ ' + towsDataOrConfig.totalAxes + ' محور خلال 6 أشهر — درجة امتثال مستهدفة 90% مع الحصول على شهادات تميز عالمية.',
            realistic: 'تطبيق تدريجي يبدأ بـ ' + criticalAxes + ' محور حرج — درجة امتثال 70% مع تحديث مستمر لسجل اللوائح.',
            pessimistic: 'تأخر التنفيذ وظهور مخالفات إضافية — درجة امتثال 45% تستدعي خطة معالجة عاجلة لإعادة الثقة مع الجهات الرقابية.'
        };
    }
    return {
        optimistic: 'تحقيق امتثال كامل وشامل (Perfect Compliance) مع الحصول على شهادات تميز عالمية في الحوكمة، مما يفتح آفاقاً جديدة للاستثمار والشراكات الكبرى.',
        realistic: 'الاحتفاظ بمستوى امتثال جيد مع صفر مخالفات جوهرية، وتحديث مستمر لسجل اللوائح لمواكبة التغيرات التنظيمية.',
        pessimistic: 'التعرض لعقوبات أو غرامات نتيجة ثغرات في الحوكمة أو تأخر في التراخيص، مما يستدعي خطة معالجة عاجلة لإعادة الثقة مع الجهات الرقابية.'
    };
}

/**
 * رؤية ورسالة الامتثال
 */
function generateComplianceVisionMission() {
    return {
        vision: [
            'أن نكون المرجع الأول في النزاهة والحوكمة الرشيدة على مستوى القطاع.',
            'الوصول بالمنشأة إلى أعلى معايير الامتثال العالمي والشفافية التامة.',
            'بناء بيئة عمل قائمة على العدالة والمسؤولية تصون حقوق الجميع.'
        ],
        mission: [
            'حماية المنشأة من المخاطر القانونية وتعزيز ثقة كافة أصحاب المصلحة.',
            'ترسيخ مبادئ الحوكمة والامتثال في كافة مفاصل القرار والعمليات.',
            'ضمان استدامة الأعمال عبر بيئة قانونية آمنة ومدروسة المخاطر.'
        ],
        values: [
            '• النزاهة: العمل بمعايير أخلاقية لا تتجزأ.',
            '• الشفافية: الوضوح التام في كافة القرارات والتقارير.',
            '• المسؤولية: كل فرد مسؤول عن الامتثال في نطاقه.',
            '• التحوط: الاستباقية في اكتشاف ومعالجة المخاطر.',
            '• العدالة: تطبيق الأنظمة بحيادية تامة.'
        ]
    };
}

function generateComplianceKeyResults(obj) {
    var text = (obj || '').toLowerCase();
    if (text.includes('مخالفات') || text.includes('غرامات') || text.includes('امتثال')) {
        return [
            { text: 'صفر غرامات ناتجة عن عدم الامتثال التنظيمي.', target: '0 ر.س' },
            { text: 'إغلاق 100% من ملاحظات التدقيق الداخلي والخارجي.', target: '100%' },
            { text: 'رفع درجة الالتزام في التقرير التنظيمي السنوي.', target: '≥ 95%' }
        ];
    }
    if (text.includes('ترخيص') || text.includes('لوائح') || text.includes('تنظيمي')) {
        return [
            { text: 'تجديد كافة التراخيص قبل تاريخ الانتهاء بـ 30 يوماً.', target: '100%' },
            { text: 'تحديث سجل اللوائح والأنظمة المنطبقة ومطابقتها دورياً.', target: 'ربع سنوي' },
            { text: 'أتمتة نظام إدارة الوثائق القانونية والتراخيص.', target: '100%' }
        ];
    }
    if (text.includes('بيانات') || text.includes('خصوصية') || text.includes('pdpl')) {
        return [
            { text: 'نسبة مطابقة معالجة البيانات الشخصية مع PDPL.', target: '≥ 98%' },
            { text: 'صفر حوادث تسرب لبيانات العملاء أو الموظفين.', target: '0 حادثة' },
            { text: 'إجراء تقييم أثر الخصوصية (DPIA) لكل نظام جديد.', target: '100%' }
        ];
    }
    if (text.includes('تدريب') || text.includes('وعي') || text.includes('ثقافة الالتزام')) {
        return [
            { text: 'تغطية 100% من الموظفين بالتدريب السنوي على الامتثال.', target: '100%' },
            { text: 'رفع نسبة اجتياز اختبارات الوعي بالامتثال.', target: '≥ 90%' },
            { text: 'تأهيل فريق الامتثال على شهادات مهنية معتمدة.', target: '3 شهادات/سنة' }
        ];
    }
    // Default — pure compliance (لا توجد مفاهيم حوكمة هنا)
    return [
        { text: 'إغلاق كافة فجوات الامتثال المرصودة في خطة التصحيح.', target: '100%' },
        { text: 'إنجاز عمليات التدقيق الميداني للفروع بصفر تجاوزات.', target: '0 ملاحظات' },
        { text: 'قياس مؤشر نضج الامتثال (Compliance Maturity) سنوياً.', target: '≥ Level 4' }
    ];
}

// ══════════════════════════════════════════════════════════
// تصدير للنافذة العامة
// ══════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
    window.COMPLIANCE_KEYS = COMPLIANCE_KEYS;
    window.RISKS_BY_AXIS = RISKS_BY_AXIS;
    window.BSC_OBJECTIVES_BY_AXIS = BSC_OBJECTIVES_BY_AXIS;
    window.generateComplianceRisks = generateComplianceRisks;
    window.generateComplianceObjectives = generateComplianceObjectives;
    window.getDeptObjectives = generateComplianceObjectives;
    window.generateComplianceScenarios = generateComplianceScenarios;
    window.generateComplianceVisionMission = generateComplianceVisionMission;
    window.generateComplianceKeyResults = generateComplianceKeyResults;

    // ══════════════════════════════════════════════════════════
    // 🛡️ استراتيجيات TOWS للامتثال (مستقلة — قوالب امتثال صرفة)
    // ══════════════════════════════════════════════════════════
    window.generateComplianceStrategies = function (s, w, o, t) {
        var templates = {
            so: [
                { sKey: 'امتثال', oKey: 'تحول', text: 'توظيف فاعلية منظومة الامتثال الحالية لاقتناص فرص الأتمتة الرقابية (RegTech)' },
                { sKey: 'PDPL', oKey: 'ثقة', text: 'استثمار الجاهزية في نظام حماية البيانات (PDPL) لبناء ثقة العملاء والدخول في صفقات B2B كبرى' },
                { sKey: 'ترخيص', oKey: 'توسع', text: 'الاعتماد على التراخيص السارية كميزة تنافسية لفتح أسواق/قطاعات جديدة' },
                { sKey: 'تدقيق', oKey: 'تنظيمي', text: 'توظيف سجل التدقيق النظيف كمصداقية أمام الجهات التنظيمية الجديدة' },
                { sKey: 'سياسات', oKey: 'تكامل', text: 'توحيد السياسات الداخلية لتسريع التكامل مع منصات الجهات الحكومية الرقمية' }
            ],
            wo: [
                { wKey: 'غرامات', oKey: 'تقنية', text: 'تبنّي حلول Compliance Tech لسد ثغرات الغرامات المتكررة قبل تحوّلها لمخاطر مادية' },
                { wKey: 'متابعة', oKey: 'أتمتة', text: 'أتمتة متابعة التراخيص والعقود للخروج من دائرة التجديد اليدوي والتأخر' },
                { wKey: 'وعي', oKey: 'تدريب', text: 'إطلاق برنامج وعي مؤسسي بالامتثال لمعالجة ضعف الثقافة التنظيمية' },
                { wKey: 'توثيق', oKey: 'رقمنة', text: 'رقمنة توثيق السياسات والإجراءات لمعالجة الفجوات في سجل التدقيق' }
            ],
            st: [
                { sKey: 'امتثال', tKey: 'غرامات', text: 'تعزيز منظومة الامتثال كحائط صد استباقي ضد الغرامات التنظيمية المتزايدة (SAMA/ZATCA/PDPL)' },
                { sKey: 'PDPL', tKey: 'بيانات', text: 'تشديد ضوابط حماية البيانات لمنع انتهاكات PDPL والسمعة المرتبطة بها' },
                { sKey: 'سياسات', tKey: 'مخالفات', text: 'تفعيل السياسات المعتمدة بصرامة لمنع المخالفات العمالية (نظام العمل)' },
                { sKey: 'تدقيق', tKey: 'سايبر', text: 'توظيف منظومة التدقيق الداخلي للكشف المبكر عن التهديدات السيبرانية' },
                { sKey: 'ترخيص', tKey: 'إيقاف', text: 'إبقاء التراخيص سارية لتفادي مخاطر إيقاف النشاط أو الغرامات الإدارية' }
            ],
            wt: [
                { wKey: 'مراقبة', tKey: 'مخاطر', text: 'بناء نظام مراقبة مخاطر متكامل (GRC) لسد العشوائية الحالية ومعالجة التهديدات التنظيمية' },
                { wKey: 'تراخيص', tKey: 'إيقاف', text: 'معالجة فجوات التراخيص فوراً لتفادي إيقاف النشاط أو العقوبات المباشرة' },
                { wKey: 'وعي', tKey: 'مخالفات', text: 'رفع وعي الموظفين بالأنظمة للحد من المخالفات غير المقصودة وما يترتب عليها من غرامات' },
                { wKey: 'توثيق', tKey: 'تدقيق', text: 'إغلاق فجوات التوثيق قبل أي تدقيق خارجي لتفادي الملاحظات الجوهرية' }
            ]
        };

        var gen = function (listA, listB, typeTemplates, code) {
            var res = [];
            if (typeTemplates) {
                typeTemplates.forEach(function (tmpl) {
                    var keyA = tmpl.sKey || tmpl.wKey;
                    var keyB = tmpl.oKey || tmpl.tKey;
                    var matchA = listA.find(function (item) { return item.includes(keyA); });
                    var matchB = listB.find(function (item) { return item.includes(keyB); });
                    if (matchA && matchB) res.push(tmpl.text);
                });
            }
            if (res.length < 3) {
                listA.slice(0, 2).forEach(function (a) {
                    listB.slice(0, 2).forEach(function (b) {
                        var text = '';
                        var itemA = a.replace(/\[.*?\]\s*/g, '');
                        var itemB = b.replace(/\[.*?\]\s*/g, '');
                        if (code === 'so') text = 'توظيف قوة "' + itemA + '" في اقتناص فرصة "' + itemB + '" لتعزيز الامتثال';
                        else if (code === 'wo') text = 'معالجة ضعف "' + itemA + '" باستثمار فرصة "' + itemB + '"';
                        else if (code === 'st') text = 'توظيف "' + itemA + '" كحائط صد امتثالي ضد "' + itemB + '"';
                        else if (code === 'wt') text = 'تقليص ضعف "' + itemA + '" للحد من خطر "' + itemB + '" على الامتثال';
                        if (text && res.indexOf(text) === -1) res.push(text);
                    });
                });
            }
            return res.slice(0, 5);
        };

        return {
            so: gen(s, o, templates.so, 'so'),
            wo: gen(w, o, templates.wo, 'wo'),
            st: gen(s, t, templates.st, 'st'),
            wt: gen(w, t, templates.wt, 'wt')
        };
    };

    window.generateGovernanceStrategies = function (s, w, o, t) {
        var templates = {
            so: [
                { sKey: 'حوكمة', oKey: 'استثمار', text: 'استثمار قوة الحوكمة (Q4) الحالية لجذب شركاء استراتيجيين ومستثمرين جدد' },
                { sKey: 'رقابة', oKey: 'تقنية', text: 'توظيف أنظمة الرقابة التقنية (Q3) في تبني تقنيات رقابية حديثة (RegTech)' },
                { sKey: 'شفافية', oKey: 'سمعة', text: 'استغلال الشفافية الإدارية (Q2) لتعزيز مكانة المنشأة في السوق وكسب ثقة الجهات التنظيمية' },
                { sKey: 'مالي', oKey: 'توسع', text: 'استثمار المتانة المالية (Q1) في تمويل خطط التوسع والنمو السريع' }
            ],
            wo: [
                { wKey: 'تضارب', oKey: 'أتمتة', text: 'استخدام أدوات الأتمتة لمعالجة ثغرات تضارب المصالح وضمان استقلالية القرار' },
                { wKey: 'لوائح', oKey: 'تحديث', text: 'تحديث اللوائح الداخلية لتتوافق مع الفرص التنظيمية الجديدة وتسهيل العمليات' },
                { wKey: 'اتصال', oKey: 'شفافية', text: 'تحسين قنوات الاتصال المؤسسي لرفع مستوى الشفافية أمام المساهمين' }
            ],
            st: [
                { sKey: 'امتثال', tKey: 'غرامات', text: 'تعزيز آليات الامتثال الحالية كحائط صد ضد المخاطر القانونية والغرامات المتزايدة' },
                { sKey: 'مجلس', tKey: 'تقلب', text: 'استخدام خبرة المجلس في وضع خطط استباقية لمواجهة التقلبات الاقتصادية والسياسية' },
                { sKey: 'دليل', tKey: 'تجاوز', text: 'تفعيل دليل الصلاحيات بصرامة لمنع أي تجاوزات إدارية في ظل ظروف السوق غير المستقرة' }
            ],
            wt: [
                { wKey: 'مخاطر', tKey: 'أزمة', text: 'خطة عاجلة لإعادة هيكلة إدارة المخاطر لتجنب الأزمات التشغيلية المحتملة' },
                { wKey: 'ترخيص', tKey: 'إيقاف', text: 'معالجة فجوات التراخيص فوراً لتجنب مخاطر إيقاف النشاط قانونياً' },
                { wKey: 'تبليغ', tKey: 'فساد', text: 'تفعيل نظام الحماية للمبلغين (Whistleblowing) للحد من مخاطر التجاوزات الأخلاقية' }
            ]
        };

        var gen = function (listA, listB, typeTemplates, code) {
            var res = [];
            if (typeTemplates) {
                typeTemplates.forEach(function (tmpl) {
                    var keyA = tmpl.sKey || tmpl.wKey;
                    var keyB = tmpl.oKey || tmpl.tKey;
                    var matchA = listA.find(function (item) { return item.includes(keyA); });
                    var matchB = listB.find(function (item) { return item.includes(keyB); });
                    if (matchA && matchB) res.push(tmpl.text);
                });
            }
            if (res.length < 3) {
                listA.slice(0, 2).forEach(function (a) {
                    listB.slice(0, 2).forEach(function (b) {
                        var text = '';
                        var itemA = a.replace(/\[.*?\]\s*/g, '');
                        var itemB = b.replace(/\[.*?\]\s*/g, '');
                        if (code === 'so') text = 'توظيف قوة "' + itemA + '" لاقتنام فرصة "' + itemB + '"';
                        else if (code === 'wo') text = 'استخدام "' + itemB + '" لمعالجة التحدي في "' + itemA + '"';
                        else if (code === 'st') text = 'الاعتماد على "' + itemA + '" كحصن دفاعي ضد تهديد "' + itemB + '"';
                        else if (code === 'wt') text = 'تقليص الضعف في "' + itemA + '" للحد من أثر "' + itemB + '"';
                        if (text && res.indexOf(text) === -1) res.push(text);
                    });
                });
            }
            return res.slice(0, 5);
        };

        return {
            so: gen(s, o, templates.so, 'so'),
            wo: gen(w, o, templates.wo, 'wo'),
            st: gen(s, t, templates.st, 'st'),
            wt: gen(w, t, templates.wt, 'wt')
        };
    };
    // ملاحظة: generateComplianceStrategies معرّف أعلاه بشكل مستقل عن الحوكمة

    // ══════════════════════════════════════════════════════════
    // 🏛️ الحوكمة (Governance) — مولّدات مستقلة عن الامتثال
    // الحوكمة = هيكل اتخاذ القرار، المجلس، الصلاحيات، الشفافية الداخلية
    // الامتثال = الالتزام بالأنظمة الخارجية + اللوائح + التراخيص
    // ══════════════════════════════════════════════════════════
    window.generateGovernanceObjectives = function (towsDataOrConfig) {
        if (towsDataOrConfig && towsDataOrConfig.allAxes) {
            var result = { financial: [], customer: [], internal: [], learning: [] };
            var perspectiveMap = { 'المالية': 'financial', 'العملاء': 'customer', 'العمليات الداخلية': 'internal', 'التعلم والنمو': 'learning' };
            // محاور الحوكمة الأساسية فقط
            var govAxes = ['governance', 'mixed_disclosure', 'gov_transparency', 'gov_procurement', 'nonprofit_governance'];
            towsDataOrConfig.allAxes.forEach(function (axis) {
                if (govAxes.indexOf(axis.id) === -1) return;
                var obj = BSC_OBJECTIVES_BY_AXIS[axis.id];
                if (obj) {
                    var key = perspectiveMap[obj.perspective] || 'internal';
                    result[key].push(obj.objective + ' — KPI: ' + obj.kpi);
                }
            });
            return result;
        }
        // أهداف حوكمة افتراضية (نقية)
        return {
            financial: [
                'ربط قرارات الصرف بمصفوفة الصلاحيات المعتمدة (DOA).',
                'رفع كفاءة قرارات الاستثمار عبر لجنة استثمار مفعّلة.',
                'إقرار ميزانية سنوية من المجلس قبل بداية السنة المالية.'
            ],
            customer: [
                'رفع ثقة المستثمرين والشركاء عبر إفصاحات دورية شفافة.',
                'ترسيخ سمعة المنشأة ككيان محوكم وموثوق أمام السوق.',
                'ضمان حماية حقوق الشركاء والمساهمين الأقلية.'
            ],
            internal: [
                'عقد اجتماعات مجلس الإدارة/المديرين بانتظام (≥ 4 سنوياً) وتوثيقها.',
                'اعتماد لائحة حوكمة داخلية تُحدد الأدوار والصلاحيات.',
                'تفعيل لجنة تدقيق مستقلة ولجنة مكافآت وترشيحات.',
                'تطبيق سياسة تضارب المصالح وسجل الإفصاح السنوي.',
                'تفعيل نظام الإبلاغ عن المخالفات (Whistleblowing) بسرية تامة.'
            ],
            learning: [
                'تأهيل أعضاء المجلس على معايير الحوكمة المؤسسية (IoD / OECD).',
                'نشر ثقافة النزاهة وأخلاقيات القرار بين القيادات.',
                'تقييم أداء المجلس والرئيس التنفيذي سنوياً عبر آلية رسمية.'
            ]
        };
    };

    window.generateGovernanceKeyResults = function (obj) {
        var text = (obj || '').toLowerCase();
        if (text.includes('مجلس') || text.includes('اجتماع') || text.includes('قرار')) {
            return [
                { text: 'عقد ≥ 4 اجتماعات موثّقة للمجلس خلال السنة.', target: '≥ 4 محاضر' },
                { text: 'توثيق 100% من القرارات الاستراتيجية في محاضر رسمية.', target: '100%' },
                { text: 'تنفيذ قرارات المجلس خلال المهل المحددة.', target: '≥ 90% في الوقت' }
            ];
        }
        if (text.includes('صلاحيات') || text.includes('doa') || text.includes('تفويض')) {
            return [
                { text: 'اعتماد مصفوفة الصلاحيات (DOA) وتحديثها سنوياً.', target: '100%' },
                { text: 'صفر تجاوزات للصلاحيات المعتمدة.', target: '0 تجاوز' },
                { text: 'مراجعة سنوية لشجرة التفويض والتوقيعات.', target: 'مرة/سنة' }
            ];
        }
        if (text.includes('شفافية') || text.includes('إفصاح') || text.includes('تقرير')) {
            return [
                { text: 'نشر التقرير السنوي للحوكمة في موعده.', target: '100% التزام' },
                { text: 'إفصاح عن تضارب المصالح لجميع القياديين.', target: '100%' },
                { text: 'مؤشر الشفافية المؤسسية.', target: '≥ 85%' }
            ];
        }
        if (text.includes('تضارب') || text.includes('نزاهة') || text.includes('أخلاق')) {
            return [
                { text: 'سجل تضارب المصالح محدّث لجميع القياديين.', target: '100%' },
                { text: 'توقيع ميثاق الأخلاقيات من 100% من الموظفين.', target: '100%' },
                { text: 'عدد بلاغات Whistleblowing المعالجة.', target: '100% خلال 30 يوماً' }
            ];
        }
        if (text.includes('تقييم') || text.includes('أداء المجلس') || text.includes('لجنة')) {
            return [
                { text: 'تقييم أداء المجلس سنوياً عبر أداة رسمية.', target: 'تقرير سنوي' },
                { text: 'تفعيل لجان المجلس (تدقيق، مكافآت، ترشيحات).', target: '3 لجان فاعلة' },
                { text: 'تنوع مهارات وخبرات أعضاء المجلس.', target: '≥ 3 تخصصات' }
            ];
        }
        return [
            { text: 'رفع مؤشر نضج الحوكمة (Governance Maturity).', target: '≥ Level 4' },
            { text: 'اعتماد ونشر لائحة الحوكمة الداخلية.', target: '100%' },
            { text: 'توثيق محاضر القرارات الاستراتيجية.', target: '100%' }
        ];
    };

    window.generateGovernanceScenarios = function (towsDataOrConfig) {
        return {
            optimistic: 'تأسيس منظومة حوكمة راسخة — مجلس إدارة فاعل، لجان مستقلة، قرارات موثّقة بنسبة 100% ومؤشر نضج حوكمة يتجاوز Level 4.',
            realistic: 'تشغيل لائحة حوكمة أساسية وعقد اجتماعات مجلس ربع سنوية، مع توثيق معظم القرارات وتفعيل لجنة تدقيق واحدة على الأقل.',
            pessimistic: 'ضعف توثيق القرارات وتداخل صلاحيات التنفيذ مع المجلس، مما يفتح الباب للنزاعات بين الشركاء وإضعاف ثقة المستثمرين.'
        };
    };

    window.generateGovernanceVisionMission = function () {
        return {
            vision: [
                'أن نكون نموذجاً رائداً في الحوكمة المؤسسية على مستوى القطاع.',
                'منظومة حوكمة متكاملة تضمن عدالة القرار واستدامة الأعمال.',
                'قرارات موثّقة وشفافة تعزز ثقة الشركاء والمستثمرين.'
            ],
            mission: [
                'ترسيخ هيكل واضح لصناعة القرار وتفعيل دور المجلس واللجان.',
                'حماية حقوق الشركاء والمساهمين عبر شفافية كاملة.',
                'بناء ثقافة النزاهة وأخلاقيات القرار في كافة مستويات المنشأة.'
            ],
            values: [
                '• الاستقلالية: فصل واضح بين الملكية والإدارة والرقابة.',
                '• التوثيق: كل قرار موثّق وقابل للتتبع.',
                '• الشفافية: إفصاحات دورية وسجل تضارب مصالح فاعل.',
                '• المساءلة: كل صلاحية تقابلها مسؤولية محددة.',
                '• التنوع: قدرات وخبرات متنوعة في المجلس واللجان.'
            ]
        };
    };

    window.generateGovernanceRisks = function (towsDataOrConfig) {
        // مخاطر الحوكمة فقط (وليست مخاطر الامتثال)
        var govIds = ['governance', 'mixed_disclosure', 'nonprofit_governance'];
        if (towsDataOrConfig && towsDataOrConfig.allAxes) {
            return towsDataOrConfig.allAxes
                .filter(function (a) { return govIds.indexOf(a.id) !== -1; })
                .map(function (axis, i) {
                    var r = RISKS_BY_AXIS[axis.id];
                    return r ? Object.assign({}, r, { id: 'G' + String(i + 1).padStart(3, '0') }) : null;
                })
                .filter(Boolean);
        }
        return govIds.map(function (id, i) {
            var r = RISKS_BY_AXIS[id];
            return r ? Object.assign({}, r, { id: 'G' + String(i + 1).padStart(3, '0') }) : null;
        }).filter(Boolean);
    };

    /**
     * 🏁 Step 5: Strategic Reform Plan — مولّد خطة الإصلاح الاستراتيجي
     * يحوّل نتائج الفحص (الثغرات) إلى خريطة طريق زمنية (Roadmap)
     */
    window.generateStrategicReformPlan = function (auditState) {
        if (!auditState || !auditState.responses) return null;

        var plan = {
            metadata: auditState.meta || {},
            summary: { critical: 0, high: 0, medium: 0, total: 0 },
            timeline: [] // array of { week, category, task, owner, impact, action }
        };

        var responses = auditState.responses;
        var axes = [];
        if (window.ComplianceAuditConfig) {
            // استخدام النشاط والقطاع من الحالة
            var activity = auditState.meta.activityType || 'service';
            var sector = auditState.meta.sectorType || 'private';
            axes = window.ComplianceAuditConfig.buildAuditAxes(activity, sector).allAxes;
        }

        // KB + Smart KO references
        var KB = window.ComplianceRemediationKB || null;
        var ENGINE = window.ComplianceAuditEngine || null;

        // 1) جمع الفجوات (Gaps) مع إثراء بيانات KB و Smart KO
        var gaps = [];
        axes.forEach(function (axis) {
            axis.items.forEach(function (item) {
                var res = responses[item.id];
                // نعتبر الـ no والـ partial فجوات تحتاج إصلاح
                // + نعتبر البنود المنتهية (expired/overdue) فجوات حتى لو status=yes
                var isGap = res && (res.status === 'no' || res.status === 'partial');
                var koLevel = null;
                if (res && res.expiryDate && ENGINE && ENGINE.getSmartKOLevel) {
                    koLevel = ENGINE.getSmartKOLevel(res.expiryDate);
                    if (koLevel && (koLevel.score === 0)) isGap = true; // expired/overdue = gap
                }
                if (isGap) {
                    var kbEntry = KB && KB.getRemediation ? KB.getRemediation(item.id) : null;
                    gaps.push({
                        id: item.id,
                        label: item.label,
                        question: item.question,
                        axisId: axis.id,
                        axisName: axis.name,
                        status: res.status,
                        priority: _calculatePriority(item, axis),
                        koLevel: koLevel,
                        expiryDate: res.expiryDate || null,
                        kb: kbEntry,
                        incentive: item.incentive || (kbEntry && kbEntry.incentive) || null
                    });
                }
            });
        });

        // 2) ترتيب الفجوات حسب الأولوية وتوزيعها زمنياً
        gaps.sort(function (a, b) { return a.priority - b.priority; });

        gaps.forEach(function (gap, index) {
            var week = 1;
            if (gap.priority === 0) {
                // الأولوية القصوى (KO) في أول أسبوعين
                week = index < 4 ? 1 : 2;
                plan.summary.critical++;
            } else if (gap.priority === 1) {
                // أولوية عالية (High) من الأسبوع 3 إلى 6
                week = 3 + Math.floor(index / 5);
                plan.summary.high++;
            } else {
                // أولوية متوسطة (Medium) من الأسبوع 7 إلى 12
                week = Math.min(12, 7 + Math.floor(index / 3));
                plan.summary.medium++;
            }

            var axisRisk = RISKS_BY_AXIS[gap.axisId] || {};
            var kb = gap.kb || {};
            plan.timeline.push({
                week: week,
                priority: gap.priority === 0 ? 'KO' : (gap.priority === 1 ? 'عالية' : 'متوسطة'),
                task: gap.label,
                axis: gap.axisName,
                desc: gap.question,
                owner: axisRisk.owner || 'مدير الإدارة',
                impact: axisRisk.name || 'مخاطرة تنظيمية',
                action: kb.action || (axisRisk.mitigation && axisRisk.mitigation[0]) || 'مراجعة وتوثيق المتطلبات',
                // بيانات KB المُثرية
                platform: kb.platform || null,
                docs: kb.docs || null,
                costRange: kb.costRange || null,
                duration: kb.duration || null,
                // Smart KO
                koLevel: gap.koLevel || null,
                expiryDate: gap.expiryDate || null,
                // حوافز
                incentive: gap.incentive || null
            });
        });

        // ترتيب التايملاين حسب الأسبوع
        plan.timeline.sort(function (a, b) { return a.week - b.week; });

        plan.summary.total = gaps.length;
        return plan;

        function _calculatePriority(item, axis) {
            // الموازين الاستراتيجية:
            // 0: بنود KO (تراخيص، أجور، نطاقات، سعودة)
            // 1: بنود قانونية وتقنية حرجة (PDPL, ZATCA, Cyber)
            // 2: بنود تنظيمية وإجرائية (عقود، إفصاحات)

            var koAxes = ['licenses', 'hr_labor', 'finance_zakat'];
            var criticalKeywords = ['سجل', 'رخصة', 'زكاة', 'نطاقات', 'أجور', 'تأمين', 'مقيم', 'قوى'];

            var isKO = koAxes.indexOf(axis.id) !== -1;
            var isCritical = criticalKeywords.some(function (k) {
                return item.label.toLowerCase().includes(k) || item.question.toLowerCase().includes(k);
            });

            if (isKO && isCritical) return 0;
            if (axis.id === 'data_privacy' || axis.id === 'cybersecurity' || isKO) return 1;
            return 2;
        }
    };
}
