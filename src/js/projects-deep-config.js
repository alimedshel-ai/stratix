/**
 * Projects Strategic Deep Analysis Configuration
 * Consists of 8 logical consultation pillars (32 elements) tailored for PMO/Project Managers.
 * Optimized for Startix 2.0 Forensic Logic.
 */
window.PROJECTS_DEEP_CONFIG = {
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

    // 🏗️ The 8 Pillars of Project Excellence (32 Elements)
    categories: [
        {
            id: 'project_governance',
            name: 'منهجية إدارة المشاريع والحوكمة',
            icon: 'bi-pennant-fill',
            questions: [
                {
                    id: 'pg_methodology', type: 'yes_no',
                    text: 'هل تتبع المنشأة منهجية معتمدة لإدارة المشاريع (مثل PMP أو Agile)؟',
                    tip: 'اتباع منهجية موحدة يضمن لغة مشتركة بين الفرق ويقلل من احتمالية الفشل.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'pg_charter', type: 'yes_no',
                    text: 'هل يتم إصدار وثيقة ميثاق مشروع (Project Charter) رسمية قبل البدء بأي عمل؟',
                    tip: 'الميثاق يمنح الصلاحيات اللازمة لمدير المشروع ويحدد النطاق والأهداف بوضوح.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'pg_pmo', type: 'yes_no',
                    text: 'هل يوجد مكتب إدارة مشاريع (PMO) مركزي يتابع أداء كافة المشاريع في المنشأة؟',
                    tip: 'الـ PMO يضمن توحيد المعايير ويوفر رؤية شاملة للإدارة العليا عن حالة المشاريع.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'pg_authorization', type: 'yes_no',
                    text: 'هل توجد آلية واضحة للموافقة على البدء في المشاريع الجديدة بناءً على جدواها الاستراتيجية؟',
                    tip: 'بدء مشاريع غير مجدية يستنزف موارد المنشأة ويشتت الجهود عن الأهداف الحقيقية.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'resource_mgmt',
            name: 'تخطيط وإدارة الموارد',
            icon: 'bi-person-gear',
            questions: [
                {
                    id: 'rm_allocation', type: 'yes_no',
                    text: 'هل يتم تخصيص الموارد البشرية والمادية للمشاريع بناءً على توفرها الفعلي؟',
                    tip: 'التحميل الزائد على الموظفين يؤدي للاحتراق الوظيفي وتأخر تسليم المشاريع.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'rm_skills_match', type: 'yes_no',
                    text: 'هل يتم اختيار فرق العمل بناءً على مواءمة مهاراتهم مع متطلبات المشروع المحددة؟',
                    tip: 'وضع الشخص المناسب في المشروع المناسب يرفع من سرعة وجودة التنفيذ.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'rm_capacity_util', type: 'yes_no',
                    text: 'هل توجد رؤية واضحة لنسبة استغلال الموارد (Resource Utilization) عبر كافة المشاريع؟',
                    tip: 'معرفة الموارد المتاحة تساعد في التخطيط لاستلام مشاريع جديدة دون مخاطرة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'rm_training', type: 'yes_no',
                    text: 'هل يحصل مديرو المشاريع على تدريب مستمر لتطوير مهاراتهم القيادية والفنية؟',
                    tip: 'تطور قدرات الفريق ينعكس مباشرة على كفاءة إدارة المشاريع المعقدة.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                }
            ]
        },
        {
            id: 'risk_mgmt',
            name: 'إدارة المخاطر وتخفيف الأثر',
            icon: 'bi-exclamation-triangle-fill',
            questions: [
                {
                    id: 'rk_register', type: 'yes_no',
                    text: 'هل يتم إنشاء "سجل مخاطر" خاص بكل مشروع عند مرحلة التخطيط؟',
                    tip: 'توقع المشكلات قبل وقوعها يسمح بوضع خطط بديلة تقلل من زمن التوقف.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'rk_mitigation', type: 'yes_no',
                    text: 'هل توجد خطط استجابة (Mitigation Plans) مفعلة ومعروفة للمخاطر عالية الأثر؟',
                    tip: 'الخطة الجاهزة تحول الأزمة إلى موقف مدار باحترافية وتمنع خروج المشروع عن السيطرة.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'rk_contingency', type: 'yes_no',
                    text: 'هل يتم رصد ميزانية احتياطية (Contingency Reserve) للتعامل مع الأحداث غير المتوقعة؟',
                    tip: 'الاحتياطي المالي يحمي المشروع من التوقف عند ظهور مصروفات طارئة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'rk_monitoring', type: 'yes_no',
                    text: 'هل يتم مراجعة وتحديث سجل المخاطر بشكل أسبوعي خلال فترة تنفيذ المشروع؟',
                    tip: 'المخاطر تتغير مع تقدم عمر المشروع، والمتابعة تضمن عدم ظهور مفاجآت متأخرة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'stakeholder_comm',
            name: 'التواصل مع أصحاب المصلحة',
            icon: 'bi-megaphone-fill',
            questions: [
                {
                    id: 'sc_plan', type: 'yes_no',
                    text: 'هل يوجد خطة تواصل (Communication Plan) تحدد من يحتاج المعلومة ومتى وكيف؟',
                    tip: 'التواصل المنظم يقلل من سوء الفهم ويضمن دعم أصحاب المصلحة للمشروع.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'sc_reporting', type: 'yes_no',
                    text: 'هل يتم إصدار تقارير حالة المشروع (Status Reports) بانتظام للجهات المعنية؟',
                    tip: 'وضوح حالة المشروع أمام الإدارة يسهل الحصول على القرارات والدعم المطلوبين.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'sc_expectations', type: 'yes_no',
                    text: 'هل يتم إدارة توقعات أصحاب المصلحة (Expectation Management) بشكل استباقي؟',
                    tip: 'الفشل في إدارة التوقعات قد يؤدي لعدم الرضا عن المشروع حتى لو اكتمل فنياً.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'sc_feedback', type: 'yes_no',
                    text: 'هل توجد آلية رسمية لاستقبال ملاحظات أصحاب المصلحة ودمجها في مراحل المشروع؟',
                    tip: 'إشراك المعنيين يزيد من نسبة تبني مخرجات المشروع بعد التسليم.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                }
            ]
        },
        {
            id: 'budget_cost',
            name: 'الميزانية ومراقبة التكاليف',
            icon: 'bi-currency-exchange',
            questions: [
                {
                    id: 'bc_estimation', type: 'yes_no',
                    text: 'هل يتم تقدير تكاليف المشروع بناءً على دراسات تفصيلية وأسعار سوق حقيقية؟',
                    tip: 'التقدير العشوائي هو السبب الأول لتجاوز الميزانيات وفشل المشاريع مالياً.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'bc_tracking', type: 'yes_no',
                    text: 'هل يتم تتبع التكاليف الفعلية مقابل المخطط لها بشكل لحظي أو أسبوعي؟',
                    tip: 'الاكتشاف المبكر للانحراف السعري يسمح باتخاذ إجراءات تصحيحية قبل نفاد السيولة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'bc_earned_value', type: 'yes_no',
                    text: 'هل تستخدم المنشأة تقنية "القيمة المكتسبة" (Earned Value) لقياس أداء المشروع مالياً؟',
                    tip: 'القيمة المكتسبة تخبرك ما إذا كان العمل المنجز يستحق المبالغ المصروفة فعلاً.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'bc_change_control', type: 'yes_no',
                    text: 'هل توجد عملية رسمية للتحكم في التغيير (Change Control) لمراقبة تكاليف الإضافات؟',
                    tip: 'زحف النطاق (Scope Creep) دون ميزانية إضافية هو قاتل صامت لربحية المشاريع.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'qa_standards',
            name: 'ضمان الجودة ومعايير المشاريع',
            icon: 'bi-check-all',
            questions: [
                {
                    id: 'qa_defined_metrics', type: 'yes_no',
                    text: 'هل توجد معايير جودة واضحة وقابلة للقياس لكل مخرج من مخرجات المشروع؟',
                    tip: 'الجودة ليست وجهة نظر؛ يجب أن تكون أرقاماً ومواصفات متفق عليها مسبقاً.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'qa_reviews', type: 'yes_no',
                    text: 'هل يتم إجراء مراجعات فنية (Technical Reviews) للمخرجات قبل تسليمها للعميل؟',
                    tip: 'اكتشاف العيوب داخلياً يوفر تكاليف الإصلاح ويحفظ سمعة المنشأة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'qa_compliance', type: 'yes_no',
                    text: 'هل يلتزم فريق المشروع بالمعايير التنظيمية والبيئية والقانونية المرتبطة بالقطاع؟',
                    tip: 'المخالفات التنظيمية قد تؤدي لإيقاف المشروع بالكامل وفرض غرامات باهظة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'qa_continuous_improv', type: 'yes_no',
                    text: 'هل يتم استخدام نتائج الجودة لتحسين إجراءات المشاريع المستقبلية؟',
                    tip: 'الهدف من الجودة ليس فقط التصحيح، بل منع تكرار الأخطاء في المشاريع القادمة.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                }
            ]
        },
        {
            id: 'execution_perf',
            name: 'أداء التنفيذ والتسليم',
            icon: 'bi-speedometer2',
            questions: [
                {
                    id: 'ep_schedule_tracking', type: 'yes_no',
                    text: 'هل يتم استخدام أدوات احترافية (مثل Gantt Charts) لمتابعة الجدول الزمني؟',
                    tip: 'الرؤية البصرية للجدول الزمني تكشف عن تداخل المهام والمخاطر الزمنية بسهولة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ep_milestone_delivery', type: 'yes_no',
                    text: 'هل يتم الاحتفال بتحقيق المحطات الرئيسية (Milestones) لرفع معنويات الفريق؟',
                    tip: 'تقسيم المشروع لمحطات صغيرة يجعل الهدف النهائي يبدو قابلاً للتحقيق.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                },
                {
                    id: 'ep_critical_path', type: 'yes_no',
                    text: 'هل يعرف مدير المشروع "المسار الحرج" (Critical Path) الذي لا يحتمل أي تأخير؟',
                    tip: 'التركيز على المسار الحرج يضمن عدم تأخر موعد تسليم المشروع الإجمالي.',
                    priority: { small: 'optional', medium: 'advanced', large: 'essential' }
                },
                {
                    id: 'ep_productivity', type: 'yes_no',
                    text: 'هل يتم قياس إنتاجية الفريق ومقارنتها بالخطط الموضوعة أسبوعياً؟',
                    tip: 'متابعة الإنتاجية تمنحك فرصة لزيادة الموارد أو تعديل الخطة قبل فوات الأوان.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'closure_learning',
            name: 'الإغلاق والدروس المستفادة',
            icon: 'bi-archive-fill',
            questions: [
                {
                    id: 'cl_formal_signoff', type: 'yes_no',
                    text: 'هل يتم الحصول على موافقة مكتوبة (Sign-off) من العميل على اكتمال المشروع؟',
                    tip: 'الموافقة الرسمية تنهي المسؤولية التنفيذية وتبدأ مرحلة الضمان أو التشغيل.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'cl_lessons_learned', type: 'yes_no',
                    text: 'هل توجد جلسات "الدروس المستفادة" لتوثيق النجاحات والإخفاقات بعد كل مشروع؟',
                    tip: 'المنظمة الذكية هي التي لا تكرر أخطاء مشاريعها السابقة وتتعلم من تجاربها.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'cl_asset_archival', type: 'yes_no',
                    text: 'هل يتم أرشفة كافة وثائق وعقود وأكواد المشروع في مكان آمن وسهل الوصول؟',
                    tip: 'الأرشيف المنظم هو مرجع ذهبي للصيانة والتطوير المستقبلي.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'cl_resource_release', type: 'yes_no',
                    text: 'هل توجد آلية واضحة لتحرير الموارد البشرية والمادية فور انتهاء المشروع؟',
                    tip: 'بقاء الموارد عالقة في مشاريع منتهية يسبب هدراً مالياً وضياعاً لفرص أخرى.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
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
