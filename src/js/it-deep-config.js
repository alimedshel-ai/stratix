// js/it-deep-config.js — مصفوفة التشخيص العميق لتقنية المعلومات
// الأولويات: essential=🔴 | important=🟠 | advanced=🟡 | optional=⚪

window.IT_DEEP_CONFIG = {

    // تصنيف الحجم بناءً على teamSize أو الإيرادات
    sizeFromTeam(teamSize) {
        if (!teamSize) return 'small';
        const map = { micro: 'small', small: 'small', medium: 'medium', large: 'large' };
        return map[teamSize] || 'small';
    },

    PRIORITY_LABELS: {
        essential: { emoji: '🔴', label: 'أساسي', color: '#ef4444', desc: 'مخاطرة توقف العمليات الحيوية' },
        important: { emoji: '🟠', label: 'مهم', color: '#f59e0b', desc: 'يضمن كفاءة الأداء الرقمي' },
        advanced: { emoji: '🟡', label: 'متقدم', color: '#eab308', desc: 'ابتكار وتحول رقمي منافس' },
        optional: { emoji: '⚪', label: 'اختياري', color: '#64748b', desc: 'ممارسات تقنية تكميلية' }
    },

    // 💻 المحاور الثمانية لتقنية المعلومات (32 عنصراً استراتيجياً)
    categories: [
        {
            id: 'it_governance',
            name: 'الاستراتيجية وحوكمة التقنية',
            icon: 'bi-gear-wide-connected',
            questions: [
                {
                    id: 'it_strategy_alignment', type: 'yes_no',
                    text: 'هل يوجد استراتيجية تقنية واضحة مرتبطة بالأهداف العامة للمنشأة؟',
                    tip: 'التقنية يجب أن تخدم نمو العمل وليس مجرد إدارة أجهزة الحاسب.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'it_budget_planning', type: 'yes_no',
                    text: 'هل يتم تخصيص ميزانية سنوية ثابتة للتقنية تشمل الصيانة والتحديث؟',
                    tip: 'الميزانية العشوائية للتقنية تؤدي دائماً لفشل المشاريع في منتصف الطريق.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'it_policies', type: 'yes_no',
                    text: 'هل توجد سياسات واضحة لاستخدام الأجهزة والأنظمة (AUP) موقّعة من الموظفين؟',
                    tip: 'السياسات تحمي حقوق المنشأة وتنظم سلوك الموظفين في الفضاء الرقمي.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'it_asset_register', type: 'yes_no',
                    text: 'هل يوجد سجل موثق لجميع الأصول التقنية (أجهزة، رخص برامج) ومواقع توزيعها؟',
                    tip: 'غياب السجل يؤدي لضياع الأصول وصعوبة تتبع تكاليف الاستهلاك.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'infrastructure_cloud',
            name: 'البنية التحتية والجاهزية السحابية',
            icon: 'bi-cloud-check-fill',
            questions: [
                {
                    id: 'it_infrastructure_stability', type: 'yes_no',
                    text: 'هل البنية التحتية (شبكات، خوادم) مستقرة وتعمل بفاعلية دون أعطال متكررة؟',
                    tip: 'البنية المهتزة تقتل الإنتاجية وتزيد من تكاليف الصيانة الطارئة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'it_cloud_adoption', type: 'yes_no',
                    text: 'هل تعتمد المنشأة على حلول سحابية للملفات والبريد لضمان العمل بمرونة من أي مكان؟',
                    tip: 'السحابة توفر أماناً أعلى وتكلفة أقل من الخوادم المحلية التقليدية.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'it_internet_redundancy', type: 'yes_no',
                    text: 'هل يوجد خط إنترنت بديل (Backup Link) لضمان عدم توقف العمل عند تعطل الخط الأساسي؟',
                    tip: 'توقف الإنترنت في عصر الرقمنة يعني توقف الإيرادات والخدمة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'it_scalability', type: 'yes_no',
                    text: 'هل الأنظمة والأجهزة الحالية قادرة على دعم نمو عدد الموظفين بنسبة 50% مستقبلاً؟',
                    tip: 'التخطيط للتوسع يوفر عليك إعادة شراء المعدات عند حدوث أي نمو مفاجئ.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                }
            ]
        },
        {
            id: 'cybersecurity',
            name: 'الأمن السيبراني وحماية البيانات',
            icon: 'bi-shield-lock-fill',
            questions: [
                {
                    id: 'it_backups', type: 'yes_no',
                    text: 'هل يتم أخذ نسخ احتياطية دورية ومعزولة للبيانات الحيوية (خارجياً أو سحابياً)؟',
                    tip: 'النسخة الاحتياطية هي طوق النجاة الأخير عند هجمات الفدية أو الكوارث.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'it_antivirus', type: 'yes_no',
                    text: 'هل جميع الأجهزة مزودة ببرامج حماية محدثة وأصلية يتم تفعيلها مركزياً؟',
                    tip: 'استخدام برامج غير أصلية هو دعوة مفتوحة للفيروسات واختراق البيانات.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'it_access_control', type: 'yes_no',
                    text: 'هل يتم سحب الصلاحيات وإغلاق الحسابات فوراً عند مغادرة أي موظف للمنشأة؟',
                    tip: 'الحسابات المهجورة هي ثغرة أمنية كبرى ومصدر لتسريب أسرار المنشأة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'it_pass_policy', type: 'yes_no',
                    text: 'هل يوجد سياسة صارمة لكلمات المرور وتطبيق التحقق الثنائي (MFA) للحسابات الحساسة؟',
                    tip: 'التحقق الثنائي يقلل من مخاطر اختراق الحسابات بنسبة تتجاوز 90%.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'software_systems',
            name: 'الأعمال والتطبيقات البرمجية',
            icon: 'bi-grid-3x3-gap-fill',
            questions: [
                {
                    id: 'it_erp_crm', type: 'yes_no',
                    text: 'هل تمتلك المنشأة نظاماً مركزياً (ERP أو CRM) لإدارة العمليات والعملاء؟',
                    tip: 'تشتت البيانات في ملفات إكسل منفصلة يمنع نمو الشركة المنظم.',
                    priority: { small: 'optional', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'it_system_int', type: 'yes_no',
                    text: 'هل الأنظمة المختلفة في المنشأة تتكامل فيما بينها (بربط ذكي) دون تكرار إدخال البيانات؟',
                    tip: 'التكامل يقلل الأخطاء البشرية ويوفر الوقت ويضمن دقة التقارير الموحدة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'it_custom_apps', type: 'yes_no',
                    text: 'هل يوجد تطبيقات مخصصة تدعم العمليات الفريدة للمنشأة التي لا تغطيها البرامج الجاهزة؟',
                    tip: 'التطبيقات المخصصة قد تشكل ميزة تنافسية كبرى للمنشأة في قطاعها.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'it_licensing', type: 'yes_no',
                    text: 'هل جميع البرامج المستخدمة قانونية (Original Licenses) ومسجلة باسم المنشأة؟',
                    tip: 'استخدام برامج مسروقة يعرض المنشأة لملاحقات قانونية وغرامات باهظة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'it_ops_support',
            name: 'العمليات التشغيلية وخدمات الدعم',
            icon: 'bi-headset',
            questions: [
                {
                    id: 'it_help_desk', type: 'yes_no',
                    text: 'هل يوجد نظام تذاكر (Help Desk) لمتابعة وحل المشكلات التقنية للموظفين؟',
                    tip: 'نظام التذاكر يحسن سرعة الاستجابة ويقيس إنتاجية الفريق التقني.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'it_sla', type: 'yes_no',
                    text: 'هل يوجد اتفاقية مستوى خدمة (SLA) تحدد زمن حل الأعطال للخدمات الحيوية؟',
                    tip: 'تحديد وقت الحل يقلل من وقت تعطل الموظفين ويحدد سقف التوقعات.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'it_maintenance', type: 'yes_no',
                    text: 'هل يتم إجراء صيانة وقائية دورية للأجهزة الحساسة والشبكات؟',
                    tip: 'الصيانة الوقائية تمنع حدوث الأعطال الكبرى المفاجئة وتطيل عمر الأصول.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'it_itil', type: 'yes_no',
                    text: 'هل تتبع عمليات تقنية المعلومات معايير عالمية (مثل ITIL) في إدارة التغيير والحوادث؟',
                    tip: 'اتباع المعايير يضمن تقديم خدمات تقنية بمستوى احترافي وقابل للقياس.',
                    priority: { small: 'optional', medium: 'optional', large: 'important' }
                }
            ]
        },
        {
            id: 'data_bi',
            name: 'البيانات وذكاء الأعمال',
            icon: 'bi-database-fill',
            questions: [
                {
                    id: 'it_data_viz', type: 'yes_no',
                    text: 'هل تتوفر لوحات بيانات (Dashboards) تفاعلية للإدارة لعرض الأداء لحظياً؟',
                    tip: 'وضوح الأرقام في لوحات مرئية يسهل اتخاذ القرارات الاستراتيجية السريعة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'it_data_management', type: 'yes_no',
                    text: 'هل هناك "مالك للبيانات" يضمن دقة البيانات ويمنع التكرار والتضارب؟',
                    tip: 'البيانات هي الذهب الجديد للمنشأة، وحسن إدارتها يحولها لميزة استراتيجية.',
                    priority: { small: 'optional', medium: 'advanced', large: 'essential' }
                },
                {
                    id: 'it_advanced_analytics', type: 'yes_no',
                    text: 'هل تستخدم المنشأة تحليلات متقدمة (تنبؤية) لتوقع سلوك العملاء أو الطلب؟',
                    tip: 'التنبوء بالبيانات يساعد في إدارة المخزون والمبيعات بكفاءة مذهلة.',
                    priority: { small: 'optional', medium: 'optional', large: 'advanced' }
                },
                {
                    id: 'it_data_source', type: 'yes_no',
                    text: 'هل يتم الاعتماد على مصدر واحد للحقيقة (Single Source of Truth) في تقارير المنشأة؟',
                    tip: 'تضارب الأرقام بين الأقسام هو علامة على فوضى في إدارة البيانات.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'it_innovation',
            name: 'الابتكار الرقمي والتطوير',
            icon: 'bi-lightbulb-fill',
            questions: [
                {
                    id: 'it_digital_culture', type: 'yes_no',
                    text: 'هل يوجد وعي وتشجيع عام على التحول الرقمي وتبني الحلول التقنية الجديدة؟',
                    tip: 'مقاومة الموظفين للتغيير التقني هو أكبر عائق أمام نجاح التحول الرقمي.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'it_ai_adoption', type: 'yes_no',
                    text: 'هل بدأت المنشأة بتبني حلول الذكاء الاصطناعي لأتمتة المهام المتكررة؟',
                    tip: 'الذكاء الاصطناعي يرفع الإنتاجية ويقلل التكاليف التشغيلية بشكل لافت.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'it_integration_api', type: 'yes_no',
                    text: 'هل تملك المنشأة مرونة في الربط مع أنظمة خارجية عبر (APIs)؟',
                    tip: 'القدرة على الربط تفتح آفاقاً للتعاون مع شركاء ومزودي خدمات جدد.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'it_modernization_plan', type: 'yes_no',
                    text: 'هل توجد خطة دائمة لتحديث الأنظمة القديمة (Legacy Systems) التي تعيق النمو؟',
                    tip: 'التمسك بالأنظمة القديمة يبطئ الحركة ويزيد من مخاطر الثغرات الأمنية.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'it_human_capital',
            name: 'الكفاءات التقنية وثقافة الابتكار',
            icon: 'bi-person-vcard-fill',
            questions: [
                {
                    id: 'it_internal_team', type: 'yes_no',
                    text: 'هل الفريق التقني الداخلي يملك المهارات الكافية لإدارة ودعم الأنظمة الحالية؟',
                    tip: 'الاعتماد الكلي على جهات خارجية يضعف السيطرة ويزيد من تكاليف الدعم.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'it_outsourcing', type: 'yes_no',
                    text: 'هل يتم اختيار شركات الدعم الفني الخارجية بناءً على خبرة مثبتة وليس السعر فقط؟',
                    tip: 'المزود الضعيف قد يكلفك أضعاف ما وفرته عند حدوث أي أزمة تقنية.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'it_cont_training', type: 'yes_no',
                    text: 'هل يحصل الفريق التقني على دورات تدريبية لمواكبة التطورات التقنية المتسارعة؟',
                    tip: 'الجمود المعرفي للفريق التقني يجعل أنظمة المنشأة خارج إطار المنافسة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'it_retention', type: 'yes_no',
                    text: 'هل لدى المنشأة خطة للاحتفاظ بالمواهب التقنية المتميزة ومنع تسربهم؟',
                    tip: 'فقدان الكوادر التقنية يعني فقدان المعرفة بأسرار الأنظمة وقواعد البيانات.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        }
    ],

    getVisibleQuestions(size) {
        const visible = [];
        const hidden = [];

        for (const cat of this.categories) {
            const catVisible = [];
            const catHidden = [];

            for (const q of cat.questions) {
                const priority = q.priority[size] || 'optional';
                if (priority === 'essential' || priority === 'important') {
                    catVisible.push({ ...q, currentPriority: priority });
                } else {
                    catHidden.push({ ...q, currentPriority: priority });
                }
            }

            if (catVisible.length > 0) {
                visible.push({ ...cat, questions: catVisible, hiddenCount: catHidden.length });
            }
            if (catHidden.length > 0) {
                hidden.push({ ...cat, questions: catHidden });
            }
        }

        return { visible, hidden };
    },

    getStats(size) {
        let total = 0, essential = 0, important = 0, advanced = 0, optional = 0;
        for (const cat of this.categories) {
            for (const q of cat.questions) {
                total++;
                const p = q.priority[size] || 'optional';
                if (p === 'essential') essential++;
                else if (p === 'important') important++;
                else if (p === 'advanced') advanced++;
                else optional++;
            }
        }
        return { total, essential, important, advanced, optional, visible: essential + important };
    }
};
