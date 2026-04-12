/**
 * Compliance Strategic Deep Analysis Configuration
 * Consists of 8 logical consultation pillars (32 elements) tailored for Compliance/Legal Managers.
 * Optimized for Startix 2.0 Forensic Logic.
 */
window.COMPLIANCE_DEEP_CONFIG = {
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

    // 🛡️ The 8 Pillars of Strategic Compliance (32 Elements)
    categories: [
        {
            id: 'compliance_oversight',
            name: 'نظام الامتثال والرقابة التشغيلية',
            icon: 'bi-shield-shaded',
            questions: [
                {
                    id: 'co_internal_control', type: 'yes_no',
                    text: 'هل تمتلك المنشأة نظاماً متكاملاً للرقابة الداخلية (Internal Control) يضمن مواءمة العمليات مع القوانين؟',
                    tip: 'الرقابة الداخلية هي خط الدفاع الأول لمنع وقوع المخلفات النظامية.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'co_periodic_audit', type: 'yes_no',
                    text: 'هل يتم إجراء مراجعة (Audit) شاملة للامتثال مرة كل 6 أشهر على الأقل بشكل مستقل؟',
                    tip: 'المراجعة الدورية تضمن عدم تراكم المخالفات وتكشف الأخطاء قبل تضخمها.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'co_license_tracker', type: 'yes_no',
                    text: 'هل توجد آلية مركزية لتتبع تواريخ انتهاء وتجديد كافة التراخيص الحكومية والسجلات؟',
                    tip: 'نسيان تجديد ترخيص واحد قد يؤدي لإيقاف خدمات المنشأة بالكامل.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'co_compliance_manager', type: 'yes_no',
                    text: 'هل يوجد مسؤول محدد (أو لجنة) بصلاحيات واضحة لمتابعة ملف الامتثال والالتزام؟',
                    tip: 'تحديد المسؤولية يضمن وجود مرجعية عند حدوث أي تقصير نظامي.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'reg_awareness',
            name: 'الوعي التنظيمي وإدارة المعرفة',
            icon: 'bi-info-circle-fill',
            questions: [
                {
                    id: 'ra_reg_updates', type: 'yes_no',
                    text: 'هل يتم متابعة التحديثات التنظيمية الجديدة من منصة استطلاع أو منصة قوى بانتظام؟',
                    tip: 'الأنظمة في المملكة تتطور بسرعة، والبقاء على اطلاع يحميك من الغرامات المفاجئة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ra_staff_training', type: 'yes_no',
                    text: 'هل يتلقى الموظفون تدريباً دورياً على الأنظمة القانونية المرتبطة بمهام عملهم المباشرة؟',
                    tip: 'وعي الموظف يقلل من احتمالية ارتكاب مخالفات عن جهل قد تتحملها المنشأة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ra_legal_advisors', type: 'yes_no',
                    text: 'هل يوجد قنوات استشارية قانونية (داخلية أو خارجية) متاحة للإدارة لاتخاذ قرارات سليمة؟',
                    tip: 'استشارة المحامي قبل القرار أرخص بكثير من توكيل المحامي بعد وقوع المشكلة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ra_reg_map', type: 'yes_no',
                    text: 'هل تمتلك المنشأة خريطة تنظيمية (Regulatory Map) توضح كافة الجهات الرقابية التي تخضع لها؟',
                    tip: 'معرفة جميع "أصحاب المصلحة" الرقابيين يضمن عدم إغفال أي متطلب نظامي.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                }
            ]
        },
        {
            id: 'policy_docs',
            name: 'السياسات والتوثيق الداخلي',
            icon: 'bi-file-earmark-medical-fill',
            questions: [
                {
                    id: 'pd_labor_regulation', type: 'yes_no',
                    text: 'هل لائحة تنظيم العمل الداخلية معتمدة رسمياً ومحدثة حسب آخر تعديلات نظام العمل؟',
                    tip: 'اللائحة المعتمدة هي المرجع القانوني في أي نزاع عمالي وهي ملزمة نظاماً.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'pd_privacy_policy', type: 'yes_no',
                    text: 'هل تتوفر سياسة خصوصية وحماية بيانات (NDPL) منشورة للمتعاملين مع المنشأة؟',
                    tip: 'حماية بيانات العملاء لم تعد خياراً، بل أصبحت متطلباً قانونياً صارماً وعقوباته مغلظة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'pd_procurement_guide', type: 'yes_no',
                    text: 'هل يوجد سياسة واضحة للمشتريات والتعاقدات تضمن تكافؤ الفرص والعدالة؟',
                    tip: 'وضوح سياسات الشراء يقلل من فرص الفساد الإداري ويحمي ميزانية الشركة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'pd_retention_policy', type: 'yes_no',
                    text: 'هل يوجد سياسة لإتلاف وحفظ السجلات (Records Retention) تلتزم بالمدد النظامية؟',
                    tip: 'الحفاظ على السجلات المالية والقانونية للمدد المطلوبة يجنبك المشاكل عند الفحص الرقابي.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'risk_monitoring',
            name: 'مراقبة المخاطر وتقييم الثغرات',
            icon: 'bi-exclamation-octagon-fill',
            questions: [
                {
                    id: 'rm_risk_register', type: 'yes_no',
                    text: 'هل يوجد سجل مخاطر نظامية (Compliance Risk Register) يحدد احتمالية وأثر المخالفات؟',
                    tip: 'تحديد المخاطر استباقياً يسمح للإدارة بتوجيه الموارد للأماكن الأكثر هشاشة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'rm_gap_analysis', type: 'yes_no',
                    text: 'هل يتم إجراء تحليل فجوات (Gap Analysis) عند صدور قوانين جديدة لمعرفة مدى الجاهزية؟',
                    tip: 'تحليل الفجوات يساعد في تخطيط عملية الانتقال للامتثال بالنظام الجديد دون ارتباك.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'rm_security_audit', type: 'yes_no',
                    text: 'هل يتم فحص مستوى أمن المعلومات والوصول للبيانات الحساسة كجزء من الامتثال؟',
                    tip: 'ثغرات أمن المعلومات هي ثغرات في الامتثال القانوني والتقني للمنشأة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'rm_business_continuity', type: 'yes_no',
                    text: 'هل تؤخذ المخاطر القانونية في الاعتبار عند وضع خطط استمرارية الأعمال؟',
                    tip: 'خطة الطوارئ يجب أن تتضمن كيفية التعامل مع الالتزامات التعاقدية عند الكوارث.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                }
            ]
        },
        {
            id: 'reporting_integrity',
            name: 'جودة التقارير وسلامة البيانات',
            icon: 'bi-file-bar-graph-fill',
            questions: [
                {
                    id: 'ri_accurate_returns', type: 'yes_no',
                    text: 'هل التقارير مراجعة بدقة قبل رفعها للجهات الحكومية (زكاة، تأمينات، قوى)؟',
                    tip: 'الخطأ في رفع البيانات قد يعتبر تضليلاً للجهات الرقابية ويستوجب عقوبات.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ri_periodic_dashboard', type: 'yes_no',
                    text: 'هل يحصل مجلس الإدارة على تقارير دورية تلخص حالة الامتثال وأهم الفجوات؟',
                    tip: 'وصول تقارير الامتثال للقيادة يشركهم في المسؤولية ويسرع من عملية التصحيح.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ri_data_audit', type: 'yes_no',
                    text: 'هل يتم فحص جودة البيانات (Data Integrity) المدخلة في الأنظمة لضمان دقتها؟',
                    tip: 'الامتثال يعتمد على أرقام حقيقية؛ البيانات الضعيفة تؤدي لامتثال هش وغير حقيقي.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                },
                {
                    id: 'ri_historical_records', type: 'yes_no',
                    text: 'هل يتم الاحتفاظ بأرشفة رقمية منظمة ومحمية لمراسلات الجهات الرقابية السابقة؟',
                    tip: 'الرجوع للتاريخ الرقابي يساعد في فهم توجهات المشرع وتجنب الأخطاء السابقة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'violations_mgmt',
            name: 'إدارة المخالفات والتحقيق المؤسسي',
            icon: 'bi-shield-exclamation',
            questions: [
                {
                    id: 'vm_incident_plan', type: 'yes_no',
                    text: 'هل توجد خطة استجابة سريعة للتعامل مع "الزيارات التفتيشية" المفاجئة؟',
                    tip: 'الاستعداد للتفتيش يمنع الارتباك ويضمن تقديم المعلومات الصحيحة للمفتشين.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'vm_investigation_protocol', type: 'yes_no',
                    text: 'هل يوجد بروتوكول محدد لإجراء التحقيقات الداخلية عند اكتشاف تجاوز شرعي أو نظامي؟',
                    tip: 'التحقيق المهني يحمي حقوق الموظف والمنشأة ويؤدي لنتائج قانونية سليمة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'vm_remediation_tracking', type: 'yes_no',
                    text: 'هل توجد متابعة دقيقة لسداد الغرامات وتصحيح مسبباتها لضمان عدم تكرارها؟',
                    tip: 'تكرار نفس المخالفة يؤدي لتضاعف العقوبات وإدراج المنشأة في القوائم السوداء.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'vm_appeals_process', type: 'yes_no',
                    text: 'هل المنشأة تملك القدرة على الاعتراض (Appeals) على القرارات الرقابية غير العادلة نظاماً؟',
                    tip: 'استخدام الحق القانوني في الاعتراض يحمي مصالح المنشأة المالية والاعتبارية.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                }
            ]
        },
        {
            id: 'digital_regtech',
            name: 'التحول الرقمي وأتمتة الامتثال',
            icon: 'bi-cpu-fill',
            questions: [
                {
                    id: 'dr_automation', type: 'yes_no',
                    text: 'هل يتم استخدام أنظمة تقنية لأتمتة عمليات الرقابة والامتثال بدلاً من العمل اليدوي؟',
                    tip: 'الأتمتة تقلل من "الخطأ البشري" وتوفر حماية مستمرة على مدار الساعة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'dr_secure_access', type: 'yes_no',
                    text: 'هل يتم التحكم في صلاحيات الوصول للأنظمة الحكومية (قوى، زكاة) بشكل صارم ومراقب؟',
                    tip: 'تسريب كلمات مرور الحسابات الحكومية هو كارثة أمنية وقانونية للمنشأة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'dr_realtime_alerts', type: 'yes_no',
                    text: 'هل تصل تنبيهات فورية للإدارة عند اقتراب انتهاء التراخيص أو حدوث مخالفة في النظام؟',
                    tip: 'التنبه المبكر يعطي فرصة للتصحيح قبل فوات الأوان القانوني.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'dr_digital_archiving', type: 'yes_no',
                    text: 'هل يتم أرشفة كافة الأوراق الثبوتية والتعاقدية رقمياً ومعزولاً؟',
                    tip: 'النسخة الرقمية المعزولة هي ضمان استرداد الحقوق عند ضياع الأصول المادية.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'culture_integrity',
            name: 'ثقافة النزاهة والالتزام المؤسسي',
            icon: 'bi-star-fill',
            questions: [
                {
                    id: 'ci_ethics_code', type: 'yes_no',
                    text: 'هل يوجد ميثاق أخلاقي (Code of Ethics) موقّع من كافة الموظفين عند التعيين؟',
                    tip: 'الميثاق الأخلاقي يحدد المعيار القيمي الذي تلتزم به المنظمة أمام الجميع.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ci_whistleblower_safety', type: 'yes_no',
                    text: 'هل يشعر الموظفون بالأمان الكافي للتبليغ عن التجاوزات دون خوف من الانتقام؟',
                    tip: 'بيئة العمل الآمنة للتبليغ هي أكبر رادع للفساد الداخلي.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ci_leadership_example', type: 'yes_no',
                    text: 'هل تعتبر القيادات العليا مثالاً يحتذى به في الالتزام بالأنظمة والسياسات الداخلية؟',
                    tip: 'الامتثال يبدأ من القمة؛ إذا تهاونت القيادة، تهاون الجميع.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ci_reward_compliance', type: 'yes_no',
                    text: 'هل يتم ربط التزام الأقسام بالأنظمة بمكافآت التميز السنوية؟',
                    tip: 'تحفيز الالتزام يجعله قيمة مضافة وليس مجرد عبء رقابي ثقيل.',
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
