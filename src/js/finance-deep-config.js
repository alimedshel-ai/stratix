// js/finance-deep-config.js — مصفوفة التشخيص العميق للمالية (حسب حجم الشركة)
// الأولويات: essential=🔴 | important=🟠 | advanced=🟡 | optional=⚪

window.FINANCE_DEEP_CONFIG = {

    // تصنيف الحجم بناءً على teamSize أو الإيرادات
    sizeFromTeam(teamSize) {
        if (!teamSize) return 'small';
        const map = { micro: 'small', small: 'small', medium: 'medium', large: 'large' };
        return map[teamSize] || 'small';
    },

    // ترجمة الأولويات والمسميات
    PRIORITY_LABELS: {
        essential: { emoji: '🔴', label: 'أساسي', color: '#ef4444', desc: 'مخاطرة عالية حال الإهمال' },
        important: { emoji: '🟠', label: 'مهم', color: '#f59e0b', desc: 'يفصل بين العشوائية والنظام' },
        advanced: { emoji: '🟡', label: 'متقدم', color: '#eab308', desc: 'ممارسات استثنائية للنمو' },
        optional: { emoji: '⚪', label: 'غير ضروري', color: '#64748b', desc: 'ممارسات الشركات الكبرى والمساهمة' }
    },

    // 💰 المحاور المالية الثمانية الأساسية (32 عنصراً استشارياً)
    categories: [
        {
            id: 'compliance_tax',
            name: 'الامتثال المالي والضريبي (Tax & Compliance)',
            icon: 'bi-bank',
            questions: [
                {
                    id: 'fc_vat', type: 'yes_no',
                    text: 'هل يتم رفع إقرارات القيمة المضافة (VAT) في وقتها دون دفع غرامات تأخير؟',
                    tip: 'الالتزام بمواعيد الرفع يجنبك المفاجآت الموجعة من الجهات الرقابية.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'fc_audited', type: 'yes_no',
                    text: 'هل تمتلك المنشأة قوائم مالية مدققة ومُعتمدة للسنة المالية الماضية؟',
                    tip: 'دون قوائم مدققة لن تقبلك البنوك لمعاملات التمويل والتوسع الحقيقية.',
                    priority: { small: 'optional', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'fc_einvoice', type: 'yes_no',
                    text: 'هل نظام المبيعات/الفوترة لديكم مرتبط ببوابة (فاتورة) للمرحلة الثانية؟',
                    tip: 'الربط أصبح إلزامياً على أطوار؛ عدم التجاوب يعرضك لغرامات مغلظة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'fc_reconcile', type: 'yes_no',
                    text: 'هل يتم عمل تسويات بنكية (Bank Reconciliation) شهرية مطابقة للدفاتر؟',
                    tip: 'التسوية هي خط الدفاع الأول ضد التسرب النقدي والأخطاء الدفترية.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'structure_policy',
            name: 'الهيكل المحاسبي والسياسات (Structure & Policies)',
            icon: 'bi-diagram-3',
            questions: [
                {
                    id: 'fs_chart', type: 'yes_no',
                    text: 'هل دليل الحسابات (Chart of Accounts) مفصل بمراكز تكلفة صحيحة تفصل نشاطاتكم؟',
                    tip: 'افصل إيرادات كل قطاع لتعرف بالضبط من يحقق أرباحاً ومن يستنزفك.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'fs_erp', type: 'yes_no',
                    text: 'هل تستخدمون نظام ERP سحابي متكامل للإدارة المالية بدلاً من الجداول اليدوية؟',
                    tip: 'الاعتماد على الإكسل في المحاسبة يجعلك كالطيار الذي يطير معصوب العينين.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'fs_pettycash', type: 'yes_no',
                    text: 'هل النثريات تُدار عبر سياسات وبطاقات مسبقة الدفع لضمان الرقابة؟',
                    tip: 'غياب السيطرة على الكاش المباشر يخلق بيئة خصبة للفواتير غير المبررة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'fs_auth', type: 'yes_no',
                    text: 'هل توجد "مصفوفة صلاحيات مالية" معتمدة للمصادقة على كافة المدفوعات؟',
                    tip: 'تعيين حدود واضحة للصرف يمنع التجاوزات ويوزع المسؤولية بشكل سليم.',
                    priority: { small: 'optional', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'cash_liquidity',
            name: 'إدارة النقد والسيولة (Cash & Liquidity)',
            icon: 'bi-droplet-fill',
            questions: [
                {
                    id: 'cl_receivables', type: 'yes_no',
                    text: 'هل يتم تحصيل المديونيات من العملاء (Receivables) بمتوسط يقل عن 60 يوماً؟',
                    tip: 'تسريع التحصيل هو أرخص وسيلة لتوفير سيولة إضافية في المنشأة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'cl_payables', type: 'yes_no',
                    text: 'هل تطلبون فترات سماح ائتمانية من الموردين تتناسب مع دورة مبيعاتكم؟',
                    tip: 'مزامنة الدفع للموردين مع استلام مستحقاتك يحمي الكاش من النفاد فجأة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'cl_forecast', type: 'yes_no',
                    text: 'هل يوجد توقع للتدفقات النقدية (Cash Flow Forecast) للأشهر الثلاثة القادمة؟',
                    tip: 'التوقع يحذرك من العجز المالي قبل وقوعه، مما يمنحك وقتاً للحل.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'cl_reserve', type: 'yes_no',
                    text: 'هل تحتفظ المنشأة باحتياطي نقدي يغطي مصروفات التشغيل لـ 3 أشهر على الأقل؟',
                    tip: 'الاحتياطي هو الوسادة الأمنية التي تحمي المنشأة من تقلبات السوق المفاجئة.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                }
            ]
        },
        {
            id: 'budget_performance',
            name: 'الميزانية التقديرية ومراقبة الأداء',
            icon: 'bi-clipboard-data-fill',
            questions: [
                {
                    id: 'bp_annual_budget', type: 'yes_no',
                    text: 'هل يتم وضع ميزانية تقديرية (Budget) سنوية معتمدة قبل بدء العام المالي؟',
                    tip: 'الميزانية هي الخارطة المالية التي توجه بوصلة المنشأة خلال العام.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'bp_variance_analysis', type: 'yes_no',
                    text: 'هل يتم تحليل الانحرافات (Variance Report) بين المخطط والفعلي ربع سنوياً؟',
                    tip: 'معرفة أين صرفتم أكثر مما يجب تسمح لكم بالفرملة أو إعادة التوجيه قبل فوات الأوان.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'bp_kpis_financial', type: 'yes_no',
                    text: 'هل يتم تتبع مؤشرات الأداء المالية (مثل نسبة العائد، نسبة السيولة) دورياً؟',
                    tip: 'المؤشرات تعطيك صورة حية عن نبض الصحة المالية للمنظمة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'bp_scenario_planning', type: 'yes_no',
                    text: 'هل يتم عمل نماذج مالية للسيناريوهات المختلفة (متفائل، واقعي، متشائم)؟',
                    tip: 'الاستعداد المالي لأسوأ السيناريوهات يضمن استدامة المنشأة في الأزمات.',
                    priority: { small: 'optional', medium: 'advanced', large: 'advanced' }
                }
            ]
        },
        {
            id: 'cost_profitability',
            name: 'الربحية وتحليل التكاليف (Profitability)',
            icon: 'bi-percent',
            questions: [
                {
                    id: 'cp_gross_margin', type: 'yes_no',
                    text: 'هل يتم حساب إجمالي الربح (Gross Margin) لكل منتج/خدمة بشكل منفصل؟',
                    tip: 'قد تبحث عن البيع كثيراً ولكنك تخسر في كل عملية بيع بسبب انخفاض الهامش.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'cp_overhead_control', type: 'yes_no',
                    text: 'هل تراجع المنشأة المصاريف الإدارية والعمومية لتقليل الهدر غير المنتج؟',
                    tip: 'كل ريال توفره من المصاريف غير الضرورية هو ريال يضاف مباشرة للأرباح الصافية.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'cp_break_even', type: 'yes_no',
                    text: 'هل تعرف "نقطة التعادل" (Break-even Point) بدقة لكل شهر مالي؟',
                    tip: 'نقطة التعادل هي التي تخبرك بالحد الأدنى المطلوب من المبيعات لتبدأ بالربح.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'cp_pricing_strategy', type: 'yes_no',
                    text: 'هل يتم مراجعة الأسعار بناءً على تكاليف التشغيل الحقيقية وليس فقط أسعار المنافسين؟',
                    tip: 'الانسياق خلف أسعار المنافسين دون دراسة تكاليفك قد يؤدي لتبخر أرباحك الصافية.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'audit_controls',
            name: 'التدقيق المالي والرقابة الداخلية',
            icon: 'bi-shield-check',
            questions: [
                {
                    id: 'ac_internal_audit', type: 'yes_no',
                    text: 'هل يتم إجراء تدقيق مالي داخلي مفاجئ على العمليات والمخازن والنقد؟',
                    tip: 'الرقابة المفاجئة هي أكبر رادع للتلاعب المالي والسرقات الداخلية.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ac_segregation_duties', type: 'yes_no',
                    text: 'هل يوجد فصل للواجبات (من يسجل، من يعتمد، من يدفع) لشخصيات مختلفة؟',
                    tip: 'تركيز الصلاحيات المالية في يد شخص واحد هو أكبر مخاطرة تزوير في المنظمات.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ac_external_auditor', type: 'yes_no',
                    text: 'هل يتم تغيير مكتب التدقيق الخارجي بشكل دوري (كل 3-5 سنوات) لضمان حياديته؟',
                    tip: 'تغيير المدقق يضمن "عيوناً جديدة" وقدرة أكبر على رصد الخلل المالي.',
                    priority: { small: 'optional', medium: 'optional', large: 'important' }
                },
                {
                    id: 'ac_fraud_prevention', type: 'yes_no',
                    text: 'هل توجد سياسات واضحة لمكافحة الاحتيال وتطبيق العقوبات الرادعة؟',
                    tip: 'وضوح السياسة وقوة التنفيذ يحميان أصول المنشأة من أي محاولات تلاعب.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'investment_assets',
            name: 'إدارة الاستثمار والأصول (Assets)',
            icon: 'bi-gem',
            questions: [
                {
                    id: 'ia_asset_depreciation', type: 'yes_no',
                    text: 'هل يتم حساب إهلاك الأصول (Depreciation) بشكل صحيح لتعكس قيمتها الحقيقية؟',
                    tip: 'الإهلاك يساعدك على التخطيط المالي لاستبدال الأصول عندما تنتهي حياتها المهنية.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ia_inventory_turnover', type: 'yes_no',
                    text: 'هل يتم مراقبة معدل دوران المخزون لتقليل "رأس المال العاطل" في المستودعات؟',
                    tip: 'البضاعة المكدسة هي "نقود محبوسة" يمكن استغلالها في استثمارات أخرى.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ia_funding_cost', type: 'yes_no',
                    text: 'هل يتم حساب "تكلفة الأموال" (Cost of Capital) عند طلب القروض أو التمويلات؟',
                    tip: 'معرفة تكلفة التمويل تساعدك في تقرير ما إذا كان المشروع سيحقق عائداً يستحق القرض.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'ia_strategic_investment', type: 'yes_no',
                    text: 'هل يتم مراجعة العائد من الاستثمار (ROI) في الأصول الكبرى لتصحيح المسار؟',
                    tip: 'المراجعة الاستثمارية تضمن عدم استنزاف الموارد في مشروعات غير مربحة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'reporting_decision',
            name: 'التقارير المالية ودعم القرار',
            icon: 'bi-file-earmark-bar-graph-fill',
            questions: [
                {
                    id: 'rd_mgt_accounts', type: 'yes_no',
                    text: 'هل يتم إصدار تقارير مالية إدارية (Management Reports) شهرية مفصلة؟',
                    tip: 'التقرير الشهري هو "لوحة التحكم" التي تمكّن القائد من المناورة السريعة في السوق.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'rd_data_viz', type: 'yes_no',
                    text: 'هل تستخدم المنشأة لوحات بيانية تفاعلية (Financial Dashboards) لعرض الأداء؟',
                    tip: 'وضوح الأرقام بصرياً يسرع من فهم التحديات المالية وتبني حلول جماعية.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'rd_debt_ratio', type: 'yes_no',
                    text: 'هل يتم مراقبة نسبة الديون إلى حقوق الملكية (Debt-to-Equity) لضمان الاستقرار؟',
                    tip: 'الحفاظ على توازن الدين يحمي المنشأة من مخاطر التعثر المالي والإفلاس.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'rd_strategic_advice', type: 'yes_no',
                    text: 'هل يشارك المدير المالي في الاجتماعات الاستراتيجية لصنع قرار مبني على الأرقام؟',
                    tip: 'دور المالية ليس مجرد دفع الفواتير، بل هو التوجيه الحكيم للموارد لخدمة الأهداف.',
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
