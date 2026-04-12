/**
 * Customer Success Strategic Deep Analysis Configuration
 * Consists of 8 logical consultation pillars (32 elements) tailored for CS Managers.
 * Optimized for Startix 2.0 Forensic Logic.
 */
window.CS_DEEP_CONFIG = {
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

    // 🌟 The 8 Pillars of Customer Success (32 Elements)
    categories: [
        {
            id: 'cs_onboarding',
            name: 'التأهيل والوصول للقيمة الأولى (Onboarding)',
            icon: 'bi-rocket-takeoff-fill',
            questions: [
                {
                    id: 'on_time_to_value', type: 'yes_no',
                    text: 'هل يوجد مسار محدد يضمن وصول العميل للنتائج المرجوة (TTV) في أسرع وقت ممكن؟',
                    tip: 'سرعة وصول العميل للقيمة الأولى هي التي تمنع انسحابه المبكر وتثبت جدوى الشراء.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'on_welcome_process', type: 'yes_no',
                    text: 'هل يتم عقد "اجتماع انطلاق" (Kick-off) رسمي لتعريف العميل بكيفية النجاح معك؟',
                    tip: 'الاجتماع الأول يرسم خارطة الطريق ويحدد التوقعات ويخلق رابطاً شخصياً مع العميل.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'on_success_plan', type: 'yes_no',
                    text: 'هل يتم بناء "خطة نجاح" (Success Plan) مخصصة لكل عميل بناءً على أهدافه هو؟',
                    tip: 'خطة النجاح تعني أنك شريك للعميل في تحقيق أهدافه وليس مجرد بائع لخدمة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'on_onboarding_kpis', type: 'yes_no',
                    text: 'هل تقيس المنشأة نسبة اكتمال مراحل التأهيل (Onboarding Completion Rate)؟',
                    tip: 'معرفة أين يتوقف العملاء خلال البدايات يسمح لك بتبسيط الإجراءات وتسهيل الرحلة.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'cs_health_monitoring',
            name: 'مراقبة صحة ومعطيات العميل',
            icon: 'bi-heart-pulse-fill',
            questions: [
                {
                    id: 'hm_health_score', type: 'yes_no',
                    text: 'هل يوجد "مؤشر صحة العميل" (Health Score) يجمع بيانات الاستخدام والتفاعل والرضا؟',
                    tip: 'المؤشر الصحي يحذرك من العميل "المعرض للخطر" قبل أن يقرر المغادرة فعلياً.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'hm_proactive_outreach', type: 'yes_no',
                    text: 'هل يتم التواصل مع العميل "استباقياً" (Proactive) قبل أن يشتكي هو من مشكلة؟',
                    tip: 'التواصل الاستباقي يثبت اهتمامك ويمنع تراكم الاستياء الصامت لدى العميل.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'hm_usage_analysis', type: 'yes_no',
                    text: 'هل يتابع فريق نجاح العملاء معدلات استخدام (Usage) الميزات الأساسية للمنتج؟',
                    tip: 'عدم استخدام الميزات الأساسية هو أكبر مؤشر على أن العميل سيلغي اشتراكه قريباً.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'hm_qbr_meetings', type: 'yes_no',
                    text: 'هل تُعقد مراجعات عمل ربع سنوية (QBR) مع كبار العملاء لمناقشة القيمة المحققة؟',
                    tip: 'الـ QBR يثبت العائد من الاستثمار (ROI) للعميل ويجدد التزامه بالاستمرار معك.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                }
            ]
        },
        {
            id: 'cs_renewal_churn',
            name: 'إدارة التجديد ومنع التسرب',
            icon: 'bi-arrow-repeat',
            questions: [
                {
                    id: 'rc_renewal_process', type: 'yes_no',
                    text: 'هل تبدأ عملية التجديد (Renewal) قبل 90 يوماً على الأقل من انتهاء العقد؟',
                    tip: 'البدء المبكر يمنحك وقتاً لحل أي مشكلات عالقة وضمان التجديد دون ضغوط اللحظة الأخيرة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'rc_churn_analysis', type: 'yes_no',
                    text: 'هل يتم تحليل أسباب التسرب (Churn Root Cause) ووضع خطط لمنع تكرارها؟',
                    tip: 'التعلم من "وداع العميل" هو أهم درس لتطوير المنتج وتحسين تجربة البقاء.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'rc_at_risk_protocol', type: 'yes_no',
                    text: 'هل يوجد بروتوكول "إنقاذ" خاص بالعملاء الذين تظهر عليهم علامات المغادرة الوشيكة؟',
                    tip: 'بروتوكول الإنقاذ قد يتضمن خصومات خاصة أو تدخل إدارة عليا لاستعادة الثقة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'rc_revenue_retention', type: 'yes_no',
                    text: 'هل تقيس المنشأة نسبة الاحتفاظ بالإيرادات الصافية (NRR)؟',
                    tip: 'الـ NRR يخبرك بمدى قدرتك على النمو من خلال قاعدتك الحالية بعيداً عن العملاء الجدد.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'cs_education',
            name: 'تعليم وتدريب العملاء',
            icon: 'bi-mortarboard-fill',
            questions: [
                {
                    id: 'ed_knowledge_base', type: 'yes_no',
                    text: 'هل تتوفر قاعدة معرفة (Knowledge Base) شاملة وسهلة البحث للعملاء؟',
                    tip: 'تمكين العميل من حل مشكلاته بنفسه يرفع رضاه ويقلل الضغط على فريق الدعم.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ed_webinars_training', type: 'yes_no',
                    text: 'هل يتم تنظيم لقاءات تدريبية (Webinars) دورية لتعليم العملاء الميزات المتقدمة؟',
                    tip: 'التدريب المستمر يرفع من كفاءة العميل في استخدام المنتج ويزيد من ارتباطه به.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ed_certification', type: 'yes_no',
                    text: 'هل توجد برامج اعتماد أو شهادات للعملاء الذين يتقنون استخدام منصتكم؟',
                    tip: 'الشهادات تخلق خبراء "سفراء" لمنتجك داخل شركاتهم مما يصعب عملية الاستغناء عنك.',
                    priority: { small: 'optional', medium: 'optional', large: 'important' }
                },
                {
                    id: 'ed_contextual_help', type: 'yes_no',
                    text: 'هل يحصل العميل على نصائح تعليمية داخل المنتج (In-app Guides) بناءً على سلوكه؟',
                    tip: 'التوجيه في اللحظة المناسبة يحسن تجربة الاستخدام ويقلل من منحنى التعلم.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                }
            ]
        },
        {
            id: 'cs_adoption',
            name: 'تبني المنتج واستخدام الميزات',
            icon: 'bi-app-indicator',
            questions: [
                {
                    id: 'ad_sticky_features', type: 'yes_no',
                    text: 'هل تم تحديد "الميزات اللاصقة" (Sticky Features) التي تجعل العميل لا يستطيع العودة للخلف؟',
                    tip: 'دفع العميل لاستخدام هذه الميزات هو الضمان الحقيقي لبقائه لسنوات طويلة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ad_feedback_loop', type: 'yes_no',
                    text: 'هل توجد قناة رسمية لنقل طلبات الميزات (Feature Requests) من العميل لفريق المنتج؟',
                    tip: 'إشعار العميل بأن رأيه يُسمح ويُنفذ يبني ولاءً استثنائياً لا تشتريه الأموال.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ad_cross_functional', type: 'yes_no',
                    text: 'هل يتعاون فريق نجاح العملاء مع فريق التطوير لتحسين تجربة المستخدم (UX)؟',
                    tip: 'نجاح العميل هو المرآة الحقيقية لعيوب المنتج؛ نقل هذه العيوب للتطوير يرفع الجودة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ad_benchmarking', type: 'yes_no',
                    text: 'هل تقيس المنشأة أداء العميل مقارنة بأقرانه (Benchmarking) وتقدم له نصائح للتحسن؟',
                    tip: 'المقارنة مع السوق تجعل العميل يرى قيمتك كخبير استشاري وليس مجرد مزود تقني.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                }
            ]
        },
        {
            id: 'cs_voc',
            name: 'صوت العميل وردود الأفعال (VOC)',
            icon: 'bi-chat-quote-fill',
            questions: [
                {
                    id: 'vo_nps_tracking', type: 'yes_no',
                    text: 'هل يتم قياس صافي نقاط الترويج (NPS) بشكل دوري لمعرفة مدى ولاء العملاء؟',
                    tip: 'الـ NPS هو المعيار العالمي لقياس رغبة العميل في تزكيتك لآخرين.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'vo_csat_surveys', type: 'yes_no',
                    text: 'هل يتم إرسال استبيانات رضا (CSAT) فور إغلاق أي تذكرة دعم أو محطة مشروع؟',
                    tip: 'الرضا اللحظي يخبرك بجودة الخدمة اليومية ويسمح بتصحيح الأخطاء فوراً.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'vo_customer_council', type: 'yes_no',
                    text: 'هل يوجد مجلس استشاري للعملاء (CAB) يشارك في رسم رؤية المنتج المستقبلية؟',
                    tip: 'إشراك كبار العملاء في الرؤية يجعلهم "مستثمرين معنويين" في نجاحك.',
                    priority: { small: 'optional', medium: 'optional', large: 'advanced' }
                },
                {
                    id: 'vo_closed_loop', type: 'yes_no',
                    text: 'هل يتم الرد على كل عميل قدم ملاحظة سلبية لشرح الإجراء التصحيحي المتخذ؟',
                    tip: 'إغلاق الحلقة (Closing the Loop) يحول العميل الغاضب إلى عميل وفيّ جداً.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'cs_tech_analytics',
            name: 'تقنيات ومقاييس نجاح العملاء',
            icon: 'bi-cpu-fill',
            questions: [
                {
                    id: 'ta_cs_platform', type: 'yes_no',
                    text: 'هل تستخدم المنشأة منصة متخصصة لنجاح العملاء (مثل Gainsight/Totango) أو CRM مهيأ؟',
                    tip: 'إدارة مئات العملاء في الإكسل مستحيلة؛ التقنية تمنحك الرؤية الشاملة والقدرة على التوسع.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ta_segmentation', type: 'yes_no',
                    text: 'هل يتم تصنيف العملاء (Segmentation) لتقديم مستويات دعم تتناسب مع حجمهم (High/Tech Touch)؟',
                    tip: 'توزيع الجهد بناءً على حجم العميل يضمن كفاءة الفريق وربحية العمليات.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ta_predictive_churn', type: 'yes_no',
                    text: 'هل تستخدم المنشأة تحليلات تنبؤية لتوقع التسرب بناءً على أنماط الاستخدام؟',
                    tip: 'التنبؤ المبكر يمنحك فرصة ذهبية للتدخل قبل أن يصل العميل لنقطة اللاعودة.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'ta_dashboard_visibility', type: 'yes_no',
                    text: 'هل تتوفر لوحات بيانات نجاح العملاء للقيادة العليا لمتابعة الاستقرار والنمو؟',
                    tip: 'وضوح أرقام الاحتفاظ أمام القيادة يضمن تخصيص الموارد اللازمة لنجاح العملاء.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'cs_advocacy',
            name: 'سفراء العلامة التجارية والإحالات',
            icon: 'bi-award-fill',
            questions: [
                {
                    id: 'av_case_studies', type: 'yes_no',
                    text: 'هل يتم إنتاج دراسات حالة (Case Studies) موثقة لقصص نجاح عملائكم؟',
                    tip: 'دراسة الحالة هي الدليل الاجتماعي الأقوى الذي يساعد فريق المبيعات في إقناع الجدد.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'av_referral_active', type: 'yes_no',
                    text: 'هل يطلب فريق نجاح العملاء "نشطاً" إحالات من العملاء الراضين جداً؟',
                    tip: 'العميل الناجح هو أفضل مسوق لك؛ لا تتردد في طلب تزكيته لجهات أخرى.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'av_review_platforms', type: 'yes_no',
                    text: 'هل يتم تشجيع العملاء على تقييم المنشأة في المنصات العالمية (مثل G2/Capterra)؟',
                    tip: 'التقييمات الإيجابية في المنصات المستقلة ترفع من موثوقية علامتك التجارية عالمياً.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                },
                {
                    id: 'av_community_building', type: 'yes_no',
                    text: 'هل تملك المنشأة "مجتمع عملاء" (Community) يتبادلون فيه الخبرات والحلول؟',
                    tip: 'المجتمع النشط يخلق ارتباطاً عاطفياً ومكانياً بالمنتج يصعب على المنافسين اختراقه.',
                    priority: { small: 'optional', medium: 'optional', large: 'advanced' }
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
