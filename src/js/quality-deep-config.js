/**
 * Quality Strategic Deep Analysis Configuration
 * Consists of 8 logical consultation pillars (32 elements) tailored for Quality Managers.
 * Optimized for Startix 2.0 Forensic Logic.
 */
window.QUALITY_DEEP_CONFIG = {
    // Priority labels with consistent aesthetics
    PRIORITY_LABELS: {
        essential: { label: 'أساسي (Essential)', color: '#ef4444', emoji: '🚨' },
        important: { label: 'مهم (Important)', color: '#f59e0b', emoji: '🟠' },
        advanced: { label: 'متقدم (Advanced)', color: '#6366f1', emoji: '🔵' },
        optional: { label: 'اختياري (Optional)', color: '#94a3b8', emoji: '⚪' }
    },

    // Logic to determine company size for scaling questions
    sizeFromTeam: (teamSize) => {
        if (!teamSize) return 'small';
        const map = { micro: 'small', small: 'small', medium: 'medium', large: 'large' };
        return map[teamSize] || 'small';
    },

    // 🏆 The 8 Pillars of Quality Excellence (32 Elements)
    categories: [
        {
            id: 'qms_standards',
            name: 'نظام إدارة الجودة والمعايير',
            icon: 'bi-patch-check-fill',
            questions: [
                {
                    id: 'qs_iso_cert', type: 'yes_no',
                    text: 'هل تتبع المنشأة مواصفة جودة عالمية (مثل ISO 9001) وحاصلة على شهادة معتمدة؟',
                    tip: 'الشهادة العالمية ليست مجرد ورقة، بل هي التزام بنظام يقلل الهدر ويزيد الثقة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'qs_manual', type: 'yes_no',
                    text: 'هل يوجد دليل جودة (Quality Manual) محدث يحدد سياسات وأهداف الجودة للمنشأة؟',
                    tip: 'الدليل هو الدستور الذي يرجع إليه الموظفون لضمان توحيد معايير المخرجات.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'qs_management_review', type: 'yes_no',
                    text: 'هل تُعقد اجتماعات مراجعة الإدارة لنظام الجودة بشكل دوري لتقييم مدى تحقيق الأهداف؟',
                    tip: 'دون مراجعة القيادة، يظل نظام الجودة مجرد إجراءات شكلية معزولة عن القرار الاستراتيجي.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'qs_doc_control', type: 'yes_no',
                    text: 'هل توجد آلية فعالة للتحكم في الوثائق لضمان استخدام أحدث النسخ المعتمدة فقط؟',
                    tip: 'العمل بنسخ قديمة من النماذج أو التعليمات هو أكبر مصدر للأخطاء التشغيلية.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'ops_compliance',
            name: 'الالتزام التشغيلي والرقابة',
            icon: 'bi-list-check',
            questions: [
                {
                    id: 'oc_daily_adherence', type: 'yes_no',
                    text: 'هل يلتزم الموظفون في العمليات اليومية بإجراءات العمل (SOPs) بشكل موثق ودقيق؟',
                    tip: 'الجودة تبدأ من الالتزام بالخطوات المحددة مسبقاً لكل مهمة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'oc_checkpoint', type: 'yes_no',
                    text: 'هل توجد نقاط فحص (Checkpoints) واضحة في كل مرحلة من مراحل الإنتاج أو تقديم الخدمة؟',
                    tip: 'اكتشاف الخطأ في مرحلة مبكرة يوفر تكاليف الإصلاح أو خسارة العميل.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'oc_calibration', type: 'yes_no',
                    text: 'هل يتم معايرة أدوات القياس والمعدات الحساسة بانتظام لضمان دقة النتائج؟',
                    tip: 'القياس الخاطئ يؤدي لقرارات خاطئة ومخرجات غير مطابقة للمواصفات.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'oc_safety_link', type: 'yes_no',
                    text: 'هل يتم دمج متطلبات السلامة والوقاية مع إجراءات الجودة لضمان بيئة عمل آمنة؟',
                    tip: 'لا جودة في بيئة عمل غير آمنة؛ الربط يقلل من الحوادث وتوقف العمليات.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'audit_review',
            name: 'التدقيق الداخلي ومراجعة العمليات',
            icon: 'bi-search',
            questions: [
                {
                    id: 'ar_internal_audit', type: 'yes_no',
                    text: 'هل يتم إجراء تدقيق داخلي (Internal Audit) دوري وشامل لجميع الأقسام؟',
                    tip: 'التدقيق الذاتي يكشف الثغرات قبل أن يكتشفها العميل أو الجهات الرقابية.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ar_auditor_competence', type: 'yes_no',
                    text: 'هل المدققون الداخليون مؤهلون ومدربون على طرق الفحص والتقييم الموضوعي؟',
                    tip: 'كفاءة المدقق تحدد مدى دقة النتائج وقيمة التوصيات الناتجة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ar_process_efficiency', type: 'yes_no',
                    text: 'هل يتم مراجعة كفاءة العمليات (Process Efficiency) لتقليل الهدر الزمني والمادي؟',
                    tip: 'الجودة تهتم ليس فقط بصحة المخرج، بل بكفاءة الطريقة أيضاً.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                },
                {
                    id: 'ar_follow_up', type: 'yes_no',
                    text: 'هل توجد متابعة دقيقة لتنفيذ التوصيات الناتجة عن عمليات التدقيق السابقة؟',
                    tip: 'التدقيق دون متابعة تصحيحية هو إهدار للوقت والجهد.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'nc_capa',
            name: 'معالجة عدم المطابقة والإجراءات التصحيحية',
            icon: 'bi-tools',
            questions: [
                {
                    id: 'nc_reporting', type: 'yes_no',
                    text: 'هل يتم توثيق جميع حالات عدم المطابقة (Non-conformities) فور اكتشافها؟',
                    tip: 'إخفاء الأخطاء يمنع التعلم ويؤدي لتكرارها بشكل أكبر وأخطر.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'nc_root_cause', type: 'yes_no',
                    text: 'هل يتم تحليل الأسباب الجذرية (Root Cause Analysis) للمشكلات المتكررة أو الجسيمة؟',
                    tip: 'حل أعراض المشكلة لا يكفي، يجب اقتلاع جذورها لضمان عدم العودة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'nc_effectiveness', type: 'yes_no',
                    text: 'هل يتم تقييم فعالية الإجراءات التصحيحية المتخذة بعد فترة من تطبيقها؟',
                    tip: 'الهدف هو التأكد من أن الإجراء التصحيحي قد نجح فعلاً في منع التكرار.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'nc_risk_mitigation', type: 'yes_no',
                    text: 'هل توجد إجراءات وقائية (Preventive Actions) لمنع وقوع المشكلات المحتملة قبل حدوثها؟',
                    tip: 'الوقاية دائماً أقل تكلفة من العلاج والتصحيح.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                }
            ]
        },
        {
            id: 'kpi_analysis',
            name: 'مؤشرات أداء الجودة وتحليل البيانات',
            icon: 'bi-bar-chart-fill',
            questions: [
                {
                    id: 'ka_defined_kpis', type: 'yes_no',
                    text: 'هل توجد مؤشرات أداء (KPIs) محددة وقابلة للقياس لكل قسم مرتبطة بالجودة؟',
                    tip: 'ما لا يمكن قياسه، لا يمكن إدارته ولا يمكن تحسينه.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ka_data_accuracy', type: 'yes_no',
                    text: 'هل البيانات التي يتم جمعها دقيقة وموثوقة وتستخدم في صنع القرار؟',
                    tip: 'البيانات المضللة تؤدي لقرارات استراتيجية كارثية.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ka_trend_analysis', type: 'yes_no',
                    text: 'هل يتم تحليل اتجاهات الجودة (Trend Analysis) عبر الزمن لاكتشاف الانحرافات؟',
                    tip: 'متابعة الاتجاه تساعد في توقع الفشل قبل وقوعه وتحفيز التحسين المستمر.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ka_report_viz', type: 'yes_no',
                    text: 'هل تتوفر تقارير جودة دورية (لوحات بيانات) سهلة الفهم أمام الإدارة العليا؟',
                    tip: 'وضوح الأرقام أمام القيادة يضمن الحصول على الموارد والدعم اللازمين.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'culture_training',
            name: 'ثقافة الجودة والتأهيل البشري',
            icon: 'bi-mortarboard-fill',
            questions: [
                {
                    id: 'ct_awareness_training', type: 'yes_no',
                    text: 'هل يحصل جميع الموظفين الجدد على تدريب توعوي بمفاهيم الجودة في المنشأة؟',
                    tip: 'زرع فكر الجودة منذ اليوم الأول يضمن مواءمة الموظف مع معايير الشركة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ct_skill_matrix', type: 'yes_no',
                    text: 'هل يوجد مصفوفة مهارات (Skill Matrix) تحدد الكفاءة المطلوبة لكل دور في الجودة؟',
                    tip: 'معرفة فجوات المهارات تساعد في توجيه ميزانية التدريب بشكل فعال.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ct_incentives', type: 'yes_no',
                    text: 'هل توجد حوافز أو برامج تقدير للموظفين الملتزمين بمعايير الجودة المتميزة؟',
                    tip: 'تقدير النجاح يعزز ثقافة الجودة ويجعلها مسؤولية الجميع وليس قسم الجودة فقط.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                },
                {
                    id: 'ct_error_culture', type: 'yes_no',
                    text: 'هل بيئة العمل تشجع على الشفافية في التبليغ عن الأخطاء دون خوف من العقاب غير المبرر؟',
                    tip: 'التعلم من الأخطاء يتطلب بيئة آمنة للمصارحة والتحسين.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'supplier_mgmt',
            name: 'جودة الموردين والمشتريات',
            icon: 'bi-box-seam',
            questions: [
                {
                    id: 'sm_selection_criteria', type: 'yes_no',
                    text: 'هل يتم اختيار الموردين بناءً على معايير جودة محددة وليس السعر الأقل فقط؟',
                    tip: 'المدخلات السيئة تنتج مخرجات سيئة حتماً مهما بلغت كفاءة الإنتاج.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'sm_performance_eval', type: 'yes_no',
                    text: 'هل يتم تقييم أداء الموردين بشكل دوري وتصنيفهم حسب التزامهم بالجودة؟',
                    tip: 'التقييم المستمر يضمن استمرارية توريد المواد المطابقة للمواصفات.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'sm_incoming_inspect', type: 'yes_no',
                    text: 'هل يتم فحص المواد الواردة (Incoming Inspection) قبل إدخالها في خطوط الإنتاج؟',
                    tip: 'منع دخول العيوب للمصنع يوفر تكاليف الهدر في مراحل لاحقة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'sm_agreements', type: 'yes_no',
                    text: 'هل تتضمن عقود الموردين بنوداً واضحة لضمان الجودة والتعويض في حال المخالفة؟',
                    tip: 'الحماية القانونية ضرورية لضمان حق المنشأة عند حدوث مشاكل في التوريد.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'customer_focus',
            name: 'الجودة متمحورة حول العميل',
            icon: 'bi-people',
            questions: [
                {
                    id: 'cf_voice_of_customer', type: 'yes_no',
                    text: 'هل توجد آليات واضحة لجمع "صوت العميل" ودمج ملاحظاته في تحسين المنتج/الخدمة؟',
                    tip: 'العميل هو الحكم النهائي على جودة مخرجاتك.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'cf_complaint_mgmt', type: 'yes_no',
                    text: 'هل تُدار شكاوى الجودة عبر نظام منهجي يضمن الرد السريع والحل الجذري؟',
                    tip: 'الشكوى هي فرصة ذهبية للتحسين واستعادة ولاء العميل.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'cf_satisfaction_survey', type: 'scale',
                    text: 'على مقياس 1-10، ما هو مستوى رضا العملاء عن جودة المخرجات حسب آخر استبيان؟',
                    tip: 'المؤشر الرقمي يعطيك تصوراً واضحاً عن موقعك في السوق مقارنة بالمنافسين.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' },
                    scale: { min: 1, max: 10 }
                },
                {
                    id: 'cf_product_testing', type: 'yes_no',
                    text: 'هل يتم إجراء اختبارات قبول نهائية (Final Testing) من منظور تجربة العميل قبل التسليم؟',
                    tip: 'الفحص من وجهة نظر العميل يكشف عيوباً قد تغفل عنها الفحوصات الفنية البحتة.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                }
            ]
        }
    ],

    // Priority mapping logic
    getVisibleQuestions: function (size) {
        const visible = [];
        const hidden = [];
        this.categories.forEach(cat => {
            const catVisible = { ...cat, questions: [] };
            const catHidden = { ...cat, questions: [] };
            cat.questions.forEach(q => {
                const priority = q.priority[size] || 'optional';
                q.currentPriority = priority;
                if (priority === 'essential' || priority === 'important') {
                    catVisible.questions.push(q);
                } else {
                    catHidden.questions.push(q);
                }
            });
            if (catVisible.questions.length > 0) {
                visible.push({ ...catVisible, hiddenCount: catHidden.questions.length });
            }
            if (catHidden.questions.length > 0) {
                hidden.push({ ...catHidden });
            }
        });
        return { visible, hidden };
    },

    getStats: function (size) {
        const stats = { total: 0, essential: 0, important: 0, advanced: 0, optional: 0, visible: 0 };
        this.categories.forEach(cat => {
            cat.questions.forEach(q => {
                stats.total++;
                const p = q.priority[size] || 'optional';
                stats[p]++;
                if (p === 'essential' || p === 'important') stats.visible++;
            });
        });
        return stats;
    }
};
