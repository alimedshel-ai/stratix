/**
 * Sales Strategic Deep Analysis Configuration
 * Consists of 8 logical consultation pillars (32 elements) tailored for Sales Managers.
 * Optimized for Startix 2.0 Forensic Logic.
 */
window.SALES_DEEP_CONFIG = {
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

    // 💰 The 8 Pillars of Sales Excellence (32 Elements)
    categories: [
        {
            id: 'sales_strategy',
            name: 'استراتيجية المبيعات وتحديد الأهداف',
            icon: 'bi-bullseye',
            questions: [
                {
                    id: 'ss_clear_targets', type: 'yes_no',
                    text: 'هل توجد أهداف مبيعات (Quotas) واضحة وقابلة للقياس لكل موظف مبيعات؟',
                    tip: 'الأهداف غير المحددة تؤدي لتشتت الفريق وضعف المحاسبية على النتائج.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ss_market_segmentation', type: 'yes_no',
                    text: 'هل الاستراتيجية تفصل بين أنواع العملاء (B2B, B2C) وتركز على الأعلى ربحية؟',
                    tip: 'التركيز على عملاء "النخبة" يوفر مجهود الفريق ويرفع هوامش الأرباح الصافية.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ss_pricing_flexibility', type: 'yes_no',
                    text: 'هل يملك فريق المبيعات صلاحيات واضحة ومحددة للخصومات دون الرجوع للإدارة؟',
                    tip: 'سرعة القرار في الخصم قد تكون الفيصل في إغلاق الصفقة أمام المنافسين.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ss_territory_mgmt', type: 'yes_no',
                    text: 'هل يتم توزيع المناطق الجغرافية أو القطاعات على الفريق بشكل عادل يمنع التضارب؟',
                    tip: 'التوزيع العادل يحفز المنافسة الإيجابية ويضمن تغطية السوق بكافة جوانبه.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'lead_generation',
            name: 'استقطاب العملاء المحتملين (Prospecting)',
            icon: 'bi-magnet-fill',
            questions: [
                {
                    id: 'lg_sources_diversification', type: 'yes_no',
                    text: 'هل تعتمد المنشأة على أكثر من 3 مصادر مختلفة لجلب العملاء المحتملين؟',
                    tip: 'الاعتماد على مصدر واحد (مثل التوصيات فقط) يجعل التدفق النقدي في خطر دائم.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'lg_qualification', type: 'yes_no',
                    text: 'هل يتم فلترة العملاء (Lead Qualification) قبل إحالتهم لفريق المبيعات التنفيذي؟',
                    tip: 'إضاعة وقت فريق المبيعات مع عملاء غير جاهزين للشراء هو هدر مالي كبير.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'lg_referral_program', type: 'yes_no',
                    text: 'هل يوجد برنامج حوافز للمتعاونين أو العملاء الحاليين عند جلب عملاء جدد؟',
                    tip: 'التسويق بالإحالة هو الأقل تكلفة والأعلى في معدل التحويل للمبيعات.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                },
                {
                    id: 'lg_outbound_strategy', type: 'yes_no',
                    text: 'هل يقوم الفريق بمبادرات تواصل استباقية (Outbound) بدلاً من انتظار طلبات العملاء؟',
                    tip: 'المبيعات الاستباقية في القطاع التقليدي تمنحك ميزة الوصول قبل المنافسين.',
                    priority: { small: 'optional', medium: 'advanced', large: 'essential' }
                }
            ]
        },
        {
            id: 'pipeline_mgmt',
            name: 'إدارة مسار المبيعات (Pipeline)',
            icon: 'bi-funnel-fill',
            questions: [
                {
                    id: 'pm_defined_stages', type: 'yes_no',
                    text: 'هل مراحل البيع (Stages) محددة بوضوح (وعي، اهتمام، تفاوض، إغلاق)؟',
                    tip: 'معرفة أين يقع العميل في المسار يساعد في تقديم العرض المناسب في الوقت المناسب.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'pm_followup_discipline', type: 'yes_no',
                    text: 'هل يلتزم الفريق بنظام متابعة صارم (Follow-up) للعملاء الذين لم يردوا بعد؟',
                    tip: '80% من المبيعات تتم بعد المتابعة الخامسة، بينما يتوقف معظم المسوقين عند الأولى.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'pm_conversion_tracking', type: 'yes_no',
                    text: 'هل يتم قياس نسبة التحويل بين كل مرحلة وأخرى لتتبع أين يفقد الفريق العملاء؟',
                    tip: 'الاكتشاف الدقيق للمرحلة التي ينسحب فيها العميل يوجهك لتطوير المهارة الناقصة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'pm_velocity', type: 'yes_no',
                    text: 'هل يتم قياس سرعة البيع (Sales Velocity) من أول تواصل حتى تحصيل النقود؟',
                    tip: 'تقليل مدة الدورة البيعية يعزز التدفق النقدي ويسمح بخدمة عملاء أكثر بجهد أقل.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'closing_kam',
            name: 'الإغلاق وإدارة كبار العملاء (KAM)',
            icon: 'bi-hand-thumbs-up-fill',
            questions: [
                {
                    id: 'ck_objection_handling', type: 'yes_no',
                    text: 'هل يمتلك الفريق "دليل الرد على الاعتراضات" (Objection Handling Guide)؟',
                    tip: 'الاعتراض هو طلب للمعلومات؛ الرد الجاهز والمقنع يحول التردد إلى شراء.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ck_win_loss_analysis', type: 'yes_no',
                    text: 'هل يتم تحليل الصفقات الخاسرة لمعرفة الأسباب الحقيقية (سعر، جودة، تفاوض)؟',
                    tip: 'التعلم من الخسارة يمنع تكرارها ويرفع معدلات الإغلاق في المستقبل.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ck_kam_structure', type: 'yes_no',
                    text: 'هل يوجد مديرين حسابات مخصصين لكبار العملاء (Key Accounts) لضمان ولائهم؟',
                    tip: 'كبار العملاء يمثلون عادة 80% من الأرباح؛ خدمتهم تتطلب تركيزاً استثنائياً.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ck_cross_upsell', type: 'yes_no',
                    text: 'هل توجد استراتيجية لرفع قيمة مبيعات العميل الحالي عبر البيع التكميلي والارتقاء؟',
                    tip: 'البيع مرة ثانية لعميل حالي أسهل بـ 5 مرات من إقناع عميل جديد بالسعر الكامل.',
                    priority: { small: 'optional', medium: 'advanced', large: 'essential' }
                }
            ]
        },
        {
            id: 'sales_force',
            name: 'كفاءة وتحفيز فريق المبيعات',
            icon: 'bi-people-fill',
            questions: [
                {
                    id: 'sf_commission_plan', type: 'yes_no',
                    text: 'هل خطة العمولات (Commissions) محفزة وعادلة وترتبط مباشرة بالتحصيل المالي؟',
                    tip: 'العمولة هي المحرك الأساسي لرجل المبيعات؛ اربطها بالكاش في البنك وليس فقط بالعقود.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'sf_training_needs', type: 'yes_no',
                    text: 'هل يتلقى الفريق تدريبات دورية على فنون التفاوض والإقناع والذكاء العاطفي؟',
                    tip: 'رجل المبيعات الماهر هو أصل غير ملموس يضاعف أرباح المنشأة من خلال مهاراته الشخصية.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'sf_onboarding_speed', type: 'yes_no',
                    text: 'هل يستطيع موظف المبيعات الجديد الوصول للإنتاجية الكاملة في أقل من 3 أشهر؟',
                    tip: 'تقليل "زمن التمكين" (Time to Productivity) يوفر تكاليف التوظيف الضائعة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'sf_retention', type: 'yes_no',
                    text: 'هل لدى المنشأة خطة للاحتفاظ بأفضل الكوادر البيعية ومنع انتقاله للمنافسين؟',
                    tip: 'رحيل "نجم مبيعات" يعني رحيل أسرار العملاء وجزء كبير من الإيرادات.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'sales_tech_crm',
            name: 'تقنيات المبيعات وإدارة علاقات العملاء (CRM)',
            icon: 'bi-database-fill-check',
            questions: [
                {
                    id: 'st_crm_adoption', type: 'yes_no',
                    text: 'هل يتم تسجيل كافة بيانات وتواصل العملاء في نظام CRM مركزي؟',
                    tip: 'إدارة المبيعات عبر الواتساب الشخصي أو الإكسل هي فوضى تهدد أمن بيانات العملاء.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'st_automation_tools', type: 'yes_no',
                    text: 'هل يستخدم الفريق أدوات أتمتة الرسائل والجدولة وتذكيرات المتابعة؟',
                    tip: 'الأتمتة ترفع عدد العملاء الذين يمكن للموظف خدمتهم بنسبة تتجاوز 40%.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'st_visibility', type: 'yes_no',
                    text: 'هل البيانات في الـ CRM دقيقة ومحدثة وتسمح باستخراج توقعات مبيعات موثوقة؟',
                    tip: 'البيانات المضللة في النظام تؤدي لتوقعات مالية خاطئة وقرارات استثمارية فاشلة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'st_mobile_access', type: 'yes_no',
                    text: 'هل يستطيع الفريق الميداني الوصول لبيانات العملاء وتسجيل النتائج عبر هاتفه الجوال؟',
                    tip: 'سهولة إدخال البيانات في الميدان تضمن توثيق الصفقات فور حدوثها دون تأخير.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                }
            ]
        },
        {
            id: 'sales_analytics',
            name: 'تحليل أداء المبيعات والمقاييس',
            icon: 'bi-bar-chart-line-fill',
            questions: [
                {
                    id: 'sa_forecast_accuracy', type: 'yes_no',
                    text: 'هل تتطابق توقعات المبيعات الشهرية مع الأرقام الفعلية بنسبة دقة تتجاوز 85%؟',
                    tip: 'دقة التوقعات تساعد الإدارة المالية والإنتاجية في التخطيط السليم للموارد.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'sa_daily_dashboards', type: 'yes_no',
                    text: 'هل توجد لوحات بيانات (Dashboards) تعرض أداء المبيعات والتحصيل لحظياً للإدارة؟',
                    tip: 'وضوح الأرقام يشعل حماس الفريق ويسمح بالتدخل السريع عند هبوط المبيعات.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'sa_customer_segmentation', type: 'yes_no',
                    text: 'هل يتم تحليل ربحية كل عميل (Customer Profitability) لتحديد العملاء السامين؟',
                    tip: 'بعض العملاء يستهلكون وقداً وجهداً دون ربحية حقيقية؛ تخلص منهم بحكمة.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'sa_market_share', type: 'yes_no',
                    text: 'هل تقيس المنشأة حصتها السوقية مقارنة بالمنافسين المباشرين؟',
                    tip: 'معرفة موقعك في السوق يحدد ما إذا كانت استراتيجية النمو هجومية أو دفاعية.',
                    priority: { small: 'optional', medium: 'optional', large: 'advanced' }
                }
            ]
        },
        {
            id: 'retention_referral',
            name: 'الاحتفاظ بالعملاء واستراتيجية الإحالة',
            icon: 'bi-heart-fill',
            questions: [
                {
                    id: 'rr_churn_rate', type: 'yes_no',
                    text: 'هل تقيس المنشأة نسبة تسرب العملاء (Churn Rate) وتحلل أسباب مغادرتهم؟',
                    tip: 'إيقاف تسرب العملاء أرخص بكثير من محاولة استبدالهم بعملاء جدد.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'rr_loyalty_initiatives', type: 'yes_no',
                    text: 'هل توجد مبادرات خاصة (هدايا، زيارات) لتعميق العلاقة مع أفضل العملاء؟',
                    tip: 'العملاء الدائمون هم "الحصن المنيع" للإيرادات في أوقات الأزمات الاقتصادية.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'rr_referral_active', type: 'yes_no',
                    text: 'هل يتم تشجيع العملاء الراضين "نشطاً" على تقديم تزكيات مكتوبة ومصورة؟',
                    tip: 'التزكية (Testimonial) هي أقوى سلاح إقناع في يد رجل المبيعات الماهر.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'rr_after_sales', type: 'yes_no',
                    text: 'هل توجد عملية متابعة بعد البيع للتأكد من رضا العميل وحل مشكلاته فوراً؟',
                    tip: 'خدمة ما بعد البيع هي التي تبني السمعة الحقيقية وتضمن استمرار التعامل.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
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
                visible.push({ ...catVisible, hiddenCount: catHidden.length });
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
