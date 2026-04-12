// js/hr-deep-config.js — مصفوفة التشخيص العميق للموارد البشرية (حسب حجم الشركة)
// الأولويات: essential=🔴 | important=🟠 | advanced=🟡 | optional=⚪

window.HR_DEEP_CONFIG = {

    // تصنيف الحجم بناءً على teamSize من التشخيص المجاني
    sizeFromTeam(teamSize) {
        if (!teamSize) return 'small';
        const map = { micro: 'small', small: 'small', medium: 'medium', large: 'large' };
        return map[teamSize] || 'small';
    },

    // ترجمة الأولويات
    PRIORITY_LABELS: {
        essential: { emoji: '🔴', label: 'أساسي', color: '#ef4444', desc: 'إلزامي لأي شركة' },
        important: { emoji: '🟠', label: 'مهم', color: '#f59e0b', desc: 'موصى به للشركات المتوسطة+' },
        advanced:  { emoji: '🟡', label: 'متقدم', color: '#eab308', desc: 'للشركات الكبيرة فقط' },
        optional:  { emoji: '⚪', label: 'غير ضروري', color: '#64748b', desc: 'يمكن تجاهله حالياً' }
    },

    // المحاور الثمانية
    categories: [
        {
            id: 'strategic_planning',
            name: 'التخطيط الاستراتيجي للموارد البشرية',
            icon: 'bi-compass',
            questions: [
                {
                    id: 'sp_workforce', type: 'yes_no',
                    text: 'هل لديكم تحليل واضح للقوى العاملة الحالية (أعداد، مهارات، توزيع)؟',
                    tip: 'احصِ عدد الموظفين ومهاراتهم الأساسية في جدول بسيط.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'sp_alignment', type: 'yes_no',
                    text: 'هل خطة التوظيف مرتبطة باستراتيجية نمو الشركة؟',
                    tip: 'ركّز على سؤال واحد: هل نوظف لدعم نمو المبيعات؟',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'sp_succession', type: 'yes_no',
                    text: 'هل يوجد تخطيط للتعاقب الوظيفي للمناصب الحرجة؟',
                    tip: 'اكتفِ بتدريب شخصين على المهام الحرجة (من يدير الحسابات إذا غادر المحاسب؟).',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'sp_competency', type: 'yes_no',
                    text: 'هل يوجد نموذج كفاءات أو أوصاف وظيفية محدّثة؟',
                    tip: 'استخدم وصفاً وظيفياً بسيطاً من سطرين بدلاً من نموذج كفاءات معقد.',
                    priority: { small: 'optional', medium: 'advanced', large: 'essential' }
                }
            ]
        },
        {
            id: 'talent_acquisition',
            name: 'الاستقطاب والمواهب',
            icon: 'bi-person-plus',
            questions: [
                {
                    id: 'ta_time_to_fill', type: 'yes_no',
                    text: 'هل تقيسون متوسط وقت تعبئة الشواغر (Time to Fill)؟',
                    tip: 'لا تقسه — ركّز على جودة المرشح أكثر من السرعة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ta_cost', type: 'yes_no',
                    text: 'هل تتابعون تكلفة التوظيف لكل شاغر؟',
                    tip: 'احسب فقط التكاليف المباشرة الكبيرة (عمولة مكتب توظيف).',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ta_quality', type: 'yes_no',
                    text: 'هل يتم تقييم جودة التوظيف بعد فترة التجربة؟',
                    tip: 'اسأل المدير المباشر بعد 3 أشهر: هل الموظف الجديد يلبي التوقعات؟',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ta_channels', type: 'yes_no',
                    text: 'هل تستخدمون قنوات استقطاب متنوعة (لينكد إن، بوابات، إحالات)؟',
                    tip: 'اعتمد على الإحالات والمعارف الشخصية ولينكد إن المجاني.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'hr_operations',
            name: 'عمليات الموارد البشرية',
            icon: 'bi-gear',
            questions: [
                {
                    id: 'op_payroll', type: 'yes_no',
                    text: 'هل الرواتب تُصرف بدقة وفي موعدها بدون أخطاء متكررة؟',
                    tip: 'استخدم قالب إكسل بسيط وراجعه مع محاسب خارجي كل شهر.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'op_processing', type: 'yes_no',
                    text: 'هل يتم معالجة طلبات الموظفين (إجازات، خطابات) خلال 48 ساعة؟',
                    tip: 'حدد مهلة بسيطة: الرد على طلب الإجازة خلال 48 ساعة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'op_compliance', type: 'yes_no',
                    text: 'هل المنشأة ملتزمة بنظام العمل ومنصة قوى وحماية الأجور؟',
                    tip: 'تعاقد مع مستشار قانوني جزئي أو استخدم منصة قوى لفهم الالتزامات.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'op_automation', type: 'yes_no',
                    text: 'هل تستخدمون نظام HRIS لأتمتة عمليات الموارد البشرية؟',
                    tip: 'لا حاجة للأتمتة الآن — البريد أو الواتساب يكفي للإجراءات البسيطة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'performance',
            name: 'إدارة الأداء',
            icon: 'bi-graph-up-arrow',
            questions: [
                {
                    id: 'pf_cycles', type: 'yes_no',
                    text: 'هل يتم إجراء تقييم أداء دوري لجميع الموظفين؟',
                    tip: 'لقاء غير رسمي مع المدير كل شهرين بدل نموذج معقد.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'pf_goals', type: 'yes_no',
                    text: 'هل لكل موظف أهداف واضحة وقابلة للقياس؟',
                    tip: 'اجعلها بسيطة: ما هي أهم 3 مهام هذا الشهر؟',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'pf_feedback', type: 'yes_no',
                    text: 'هل هناك تغذية راجعة مستمرة بين المدير والموظف؟',
                    tip: 'اجتماع أسبوعي قصير (15 دقيقة) لكل فريق.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'pf_rewards_link', type: 'yes_no',
                    text: 'هل المكافآت والحوافز مرتبطة بنتائج الأداء الفعلية؟',
                    tip: 'قدّم مكافأة فورية لأداء استثنائي بدل نظام معقد.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'training',
            name: 'التدريب والتطوير',
            icon: 'bi-mortarboard',
            questions: [
                {
                    id: 'tr_needs', type: 'yes_no',
                    text: 'هل يتم تحديد الاحتياجات التدريبية بشكل منهجي؟',
                    tip: 'اسأل الموظفين مباشرة: ما المهارة التي تحتاجها لتؤدي عملك أفضل؟',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'tr_hours', type: 'yes_no',
                    text: 'هل يحصل كل موظف على حد أدنى من ساعات التدريب سنوياً؟',
                    tip: 'لا تحسب الساعات — ركّز على حضور دورة واحدة مفيدة في السنة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'tr_roi', type: 'yes_no',
                    text: 'هل تقيسون العائد على الاستثمار التدريبي (ROI)؟',
                    tip: 'تجاهل هذا القياس تماماً في البداية.',
                    priority: { small: 'optional', medium: 'advanced', large: 'essential' }
                },
                {
                    id: 'tr_leadership', type: 'yes_no',
                    text: 'هل يوجد برنامج لتطوير القيادات والمديرين؟',
                    tip: 'القيادة هي المؤسس نفسه — اكتفِ بتدريب شخص ليكون مساعداً.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'compensation',
            name: 'التعويضات والمزايا',
            icon: 'bi-cash-stack',
            questions: [
                {
                    id: 'cm_external', type: 'yes_no',
                    text: 'هل الرواتب تنافسية مقارنة بالسوق؟',
                    tip: 'اسأل أصدقاءك في السوق أو اطّلع على إعلانات الوظائف المشابهة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'cm_internal', type: 'yes_no',
                    text: 'هل هناك عدالة داخلية في الرواتب بين الموظفين بنفس المستوى؟',
                    tip: 'تأكد أن الموظفين في نفس المستوى يحصلون على رواتب متقاربة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'cm_incentives', type: 'yes_no',
                    text: 'هل نظام الحوافز فعّال ويحفّز الأداء العالي؟',
                    tip: 'استخدم حوافز بسيطة: مكافأة شهرية بناءً على الأهداف.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'cm_satisfaction', type: 'yes_no',
                    text: 'هل الموظفون راضون عن حزمة المزايا والتعويضات؟',
                    tip: 'اسأل شفهياً في الاجتماعات الأسبوعية بدل استبيان رسمي.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'labor_relations',
            name: 'العلاقات العمالية والامتثال',
            icon: 'bi-shield-check',
            questions: [
                {
                    id: 'lr_complaints', type: 'yes_no',
                    text: 'هل يتم تسجيل ومتابعة شكاوى الموظفين بشكل منظم؟',
                    tip: 'سجّل أي شكوى في ملف بسيط وحاول حلها ودياً فوراً.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'lr_nitaqat', type: 'yes_no',
                    text: 'هل المنشأة ملتزمة بنسب نطاقات التوطين المطلوبة؟',
                    tip: 'استخدم منصة قوى للتأكد من النسب — عدم الامتثال يعني غرامات.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'lr_awareness', type: 'yes_no',
                    text: 'هل الموظفون على دراية بحقوقهم وواجباتهم النظامية؟',
                    tip: 'اطبع ملخصاً من صفحتين لحقوق وواجبات الموظف ووزّعه.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'lr_disputes', type: 'yes_no',
                    text: 'هل يتم حل النزاعات العمالية خلال 3 أيام عمل؟',
                    tip: 'حُل في خلال 3 أيام عمل ولا تترك الأمور تتراكم.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'culture',
            name: 'الثقافة ورضا الموظفين',
            icon: 'bi-heart',
            questions: [
                {
                    id: 'cu_enps', type: 'scale',
                    text: 'على مقياس 1-10، كم يوصي موظفوك بالعمل في شركتك لصديق؟',
                    tip: 'سؤال واحد يكفي — لا تعقّد بنموذج طويل.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' },
                    scale: { min: 1, max: 10 }
                },
                {
                    id: 'cu_turnover_vol', type: 'yes_no',
                    text: 'هل تتابعون أسباب الاستقالات عبر مقابلات خروج؟',
                    tip: 'اسألهم ببساطة عن السبب عند الخروج — بدون نموذج معقد.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'cu_morale', type: 'yes_no',
                    text: 'هل الروح المعنوية للفريق إيجابية وواضحة في التفاعل اليومي؟',
                    tip: 'لاحظ الحضور والتفاعل في الاجتماعات واسأل مباشرة: كيف تشعر؟',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'cu_retention', type: 'yes_no',
                    text: 'هل لديكم برنامج أو ممارسات للاحتفاظ بالموظفين المميزين؟',
                    tip: 'قدّم شهادة شكر أو مكافأة بسيطة لمن يكمل سنة في الشركة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        }
    ],

    // فلترة الأسئلة حسب الحجم — يرجع الأسئلة المرئية فقط
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

    // إحصائيات سريعة
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
