/**
 * Support (Shared Services) Strategic Deep Analysis Configuration
 * Consists of 8 logical consultation pillars (32 elements) tailored for Support/Admin Managers.
 * Optimized for Startix 2.0 Forensic Logic.
 */
window.SUPPORT_DEEP_CONFIG = {
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

    // 🤝 The 8 Pillars of Support Excellence (32 Elements)
    categories: [
        {
            id: 'admin_efficiency',
            name: 'كفاءة العمليات الإدارية وسير العمل',
            icon: 'bi-briefcase-fill',
            questions: [
                {
                    id: 'ae_workflow_automation', type: 'yes_no',
                    text: 'هل يتم استخدام أنظمة تقنية لأتمتة الطلبات الإدارية (مثل الإجازات والعهد) بشكل كامل؟',
                    tip: 'الأتمتة تقلل من الاعتماد على الأوراق والبريد العشوائي وتسرع وتيرة الإنجاز.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ae_response_time', type: 'yes_no',
                    text: 'هل يوجد زمن استجابة محدد ومعلن للطلبات الإدارية الروتينية (مثل 24 ساعة للخطابات)؟',
                    tip: 'تحديد وقت الاستجابة ينظم التوقعات ويسمح بقياس أداء الفريق الإداري.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ae_archiving_system', type: 'yes_no',
                    text: 'هل يوجد نظام أرشفة رقمية منظم لجميع المعاملات الإدارية والعقود التاريخية؟',
                    tip: 'سهولة الوصول للمستندات التاريخية يوفر ساعات من البحث الضائع ويحمي الحقوق.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ae_process_review', type: 'yes_no',
                    text: 'هل يتم مراجعة الإجراءات الإدارية سنوياً لتقليل الخطوات غير الضرورية (Red Tape)؟',
                    tip: 'تبسيط الإجراءات يزيد من مرونة المنشأة ويقلل من استياء الموظفين.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                }
            ]
        },
        {
            id: 'facilities_mgmt',
            name: 'إدارة المرافق وبيئة العمل',
            icon: 'bi-building-fill-check',
            questions: [
                {
                    id: 'fm_preventive_maint', type: 'yes_no',
                    text: 'هل توجد خطة صيانة وقائية دورية للمقر والمرافق (تكييف، إضاءة، مصاعد)؟',
                    tip: 'الصيانة الوقائية تمنع الأعطال المفاجئة التي قد تعيق سير العمل المكتبي.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'fm_safety_compliance', type: 'yes_no',
                    text: 'هل المقر مستوفٍ لجميع اشتراطات الدفاع المدني والسلامة المهنية ولديه تصاريح سارية؟',
                    tip: 'الالتزام بمعايير السلامة يحمي الأرواح والممتلكات ويجنب المنشأة الإغلاق أو الغرامات.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'fm_workspace_opt', type: 'yes_no',
                    text: 'هل توزيع المكاتب والمساحات مدروس لضمان راحة الموظفين وتسهيل التواصل بين الفرق؟',
                    tip: 'بيئة العمل المريحة والمحفزة ترفع الإنتاجية بنسبة تصل إلى 20%.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'fm_green_initiatives', type: 'yes_no',
                    text: 'هل تتبنى المنشأة مبادرات لتقليل استهلاك الطاقة والورق (بيئة عمل خضراء)؟',
                    tip: 'تقليل الاستهلاك ليس مجرد مسؤولية مجتمعية، بل توفير مباشر في تكاليف التشغيل.',
                    priority: { small: 'optional', medium: 'optional', large: 'advanced' }
                }
            ]
        },
        {
            id: 'internal_customer',
            name: 'خدمة العملاء الداخليين (الموظفين)',
            icon: 'bi-people-fill',
            questions: [
                {
                    id: 'ic_satisfaction_survey', type: 'yes_no',
                    text: 'هل يتم قياس رضا الموظفين عن الخدمات المساندة (Support Services) بشكل دوري؟',
                    tip: 'الموظف هو عميلك الداخلي، ورضاه عن الخدمات الإدارية ينعكس على أدائه لمهامه.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ic_feedback_loop', type: 'yes_no',
                    text: 'هل توجد قناة رسمية ومستمرة لاستلام اقتراحات وشكاوى الموظفين بخصوص الخدمات؟',
                    tip: 'الاستماع للموظفين يكشف عن فجوات خدمية قد لا تراها الإدارة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ic_onboarding_support', type: 'yes_no',
                    text: 'هل يتم تجهيز كافة الأدوات (مكتب، أجهزة، إيميل) للموظف الجديد قبل وصوله في يومه الأول؟',
                    tip: 'جاهزية الأدوات تعطي انطباعاً احترافياً وتضمن بدء الإنتاجية من الساعة الأولى.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ic_hospitality_quality', type: 'yes_no',
                    text: 'هل جودة خدمات الضيافة والنظافة في المقر تلبي تطلعات الموظفين والزوار؟',
                    tip: 'التفاصيل الصغيرة مثل جودة القهوة ونظافة المرافق تعكس صورة العلامة التجارية الداخلية.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'knowledge_comm',
            name: 'تبادل المعرفة والتواصل الداخلي',
            icon: 'bi-chat-dots-fill',
            questions: [
                {
                    id: 'kc_internal_announcements', type: 'yes_no',
                    text: 'هل يتم إبلاغ الموظفين بكافة القرارات والتغييرات الهامة عبر قنوات تواصل رسمية موحدة؟',
                    tip: 'التواصل الشفاف يمنع الإشاعات ويضمن وصول المعلومة للجميع في نفس الوقت.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'kc_policy_handbook', type: 'yes_no',
                    text: 'هل يوجد دليل سياسات (Employee Handbook) سهل الوصول يشرح حقوق الالتزامات؟',
                    tip: 'وضوح القوانين الداخلية يقلل من الاستفسارات المكررة والنزاعات الإدارية.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'kc_knowledge_base', type: 'yes_no',
                    text: 'هل توجد قاعدة معرفة (Knowledge Base) تحتوي على إجابات للأسئلة الشائعة والتحميلات؟',
                    tip: 'الخدمة الذاتية (Self-Service) توفر وقت فريق الدعم وتسرع الحصول على المعلومة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'kc_team_gatherings', type: 'yes_no',
                    text: 'هل تُنظم فعاليات اجتماعية أو لقاءات دورية لتعزيز الترابط بين الأقسام المختلفة؟',
                    tip: 'الترابط الاجتماعي يكسر صوامع الأقسام (Silos) ويسهل التعاون المهني.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                }
            ]
        },
        {
            id: 'procurement_support',
            name: 'المشتريات ودعم الموردين',
            icon: 'bi-cart-check-fill',
            questions: [
                {
                    id: 'ps_vendor_database', type: 'yes_no',
                    text: 'هل يوجد قاعدة بيانات محدثة للموردين المعتمدين مع تقييم لجودة خدماتهم؟',
                    tip: 'معرفة تاريخ المورد تساعد في اتخاذ قرار الشراء الصحيح وتجنب المتلاعبين.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ps_purchase_approvals', type: 'yes_no',
                    text: 'هل يتم توثيق دورة الطلبات والموافقات المالية إلكترونياً لضمان الشفافية؟',
                    tip: 'التوثيق الرقمي يمنع التلاعب ويضمن وجود مسار تدقيق (Audit Trail) للمصروفات.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ps_inventory_control', type: 'yes_no',
                    text: 'هل يتم مراقبة مخزون المستلزمات المكتبية (Stationary) والعهد بشكل منظم؟',
                    tip: 'الرقابة على القرطاسية والعهد تمنع الهدر وتضمن توفر الأدوات عند الحاجة.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ps_payment_followup', type: 'yes_no',
                    text: 'هل يقوم فريق الدعم بمتابعة صرف مستحقات الموردين لضمان استمرارية توريد الخدمات؟',
                    tip: 'العلاقة الجيدة مع الموردين تعتمد على الالتزام بمواعيد الصرف المتفق عليها.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'shared_services',
            name: 'تحسين الخدمات المشتركة',
            icon: 'bi-intersect',
            questions: [
                {
                    id: 'ss_centralization', type: 'yes_no',
                    text: 'هل المهام المتشابهة (مثل السفر والمواصلات) ممركزة في قسم واحد لضمان الجودة؟',
                    tip: 'المركزية في الخدمات المشتركة توفر في التكاليف وتوحد معايير الخدمة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ss_cost_allocation', type: 'yes_no',
                    text: 'هل يتم تحميل تكاليف الخدمات المشتركة على الأقسام بناءً على استهلاكها الفعلي؟',
                    tip: 'توزيع التكاليف العادل يشجع الأقسام على الترشيد في استخدام الموارد العامة.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'ss_service_modernization', type: 'yes_no',
                    text: 'هل يتم تبني تقنيات حديثة (مثل تطبيقات توصيل أو حيازة) لتحسين الخدمات اللوجستية؟',
                    tip: 'التكنولوجيا ترفع كفاءة الخدمات اللوجستية وتقلل من الهدر الزمني والمكاني.',
                    priority: { small: 'optional', medium: 'advanced', large: 'advanced' }
                },
                {
                    id: 'ss_outsourcing_review', type: 'yes_no',
                    text: 'هل يتم مراجعة كفاءة شركات توريد الخدمات (نظافة، أمن) ومقارنة أسعارها سنوياً؟',
                    tip: 'المراجعة الدورية تضمن الحصول على أفضل جودة بأقل سعر متاح في السوق.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'resource_utilization',
            name: 'توزيع وتخصيص الموارد',
            icon: 'bi-box-seam-fill',
            questions: [
                {
                    id: 'ru_fleet_mgmt', type: 'yes_no',
                    text: 'هل يتم إدارة أسطول مركبات المنشأة (إن وجد) بنظام تتبع وصيانة منظم؟',
                    tip: 'متابعة المركبات يقلل من تكاليف الوقود، الصيانة، والمخالفات المرورية.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ru_stewardship', type: 'yes_no',
                    text: 'هل يوجد وعي عام لدى الموظفين بضرورة المحافظة على عهد وأدوات المنشأة؟',
                    tip: 'ثقافة الحفاظ على المال العام للمنشأة توفر الآلاف من تكاليف الاستبدال.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ru_meeting_rooms', type: 'yes_no',
                    text: 'هل توزيع وإدارة غرف الاجتماعات يتم بنظام حجز عادل ومنظم؟',
                    tip: 'التنظيم يمنع التعارض ويضمن الاستغلال الأمثل للمساحات المشتركة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ru_capacity_planning', type: 'yes_no',
                    text: 'هل يتم التخطيط لاحتياجات المقر والموارد بناءً على خطط التوظيف المستقبلية؟',
                    tip: 'الاستعداد المسبق يمنع الازدحام المفاجئ أو نقص الأدوات للموظفين الجدد.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'service_quality_sla',
            name: 'جودة الخدمة ومراقبة مستويات الأداء',
            icon: 'bi-clipboard-check-fill',
            questions: [
                {
                    id: 'sq_defined_slas', type: 'yes_no',
                    text: 'هل يوجد ميثاق مستوى خدمة (SLA) داخلي يحدد الحقوق والواجبات لكل قسم؟',
                    tip: 'الميثاق يزيل الضبابية ويحدد معايير واضحة للتميز في تقديم الخدمة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'sq_performance_reporting', type: 'yes_no',
                    text: 'هل يصدر قسم الدعم تقريراً شهرياً للإدارة يوضح حجم الإنجاز والمعوقات؟',
                    tip: 'الأرقام هي اللغة الوحيدة التي تقنع الإدارة بمطالبات قسم الدعم للموارد.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'sq_error_reduction', type: 'yes_no',
                    text: 'هل تراجع المنشأة الأخطاء الإدارية المتكررة لوضع حلول تمنع وقوعها مستقبلاً؟',
                    tip: 'التعلم من الأخطاء الإدارية يرفع احترافية المنظمة ويقلل من الهدر.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'sq_benchmarking', type: 'yes_no',
                    text: 'هل تتم مقارنة كفاءة الخدمات المساندة بمعايير السوق للشركات المماثلة؟',
                    tip: 'المقارنة تكشف ما إذا كانت خدماتك متأخرة أو رائدة في قطاعك.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
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
