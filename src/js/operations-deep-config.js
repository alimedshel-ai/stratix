/**
 * Operations Strategic Deep Analysis Configuration
 * Consists of 8 logical consultation pillars (32 elements) tailored for Operations Managers.
 * Optimized for Startix 2.0 Forensic Logic.
 */
window.OPERATIONS_DEEP_CONFIG = {
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

    // ⚙️ The 8 Pillars of Operational Excellence (32 Elements)
    categories: [
        {
            id: 'supply_chain',
            name: 'سلسلة الإمداد والخدمات اللوجستية',
            icon: 'bi-truck',
            questions: [
                {
                    id: 'sc_vendor_integration', type: 'yes_no',
                    text: 'هل يوجد تكامل رقمي مع الموردين الرئيسيين لضمان تدفق المواد دون انقطاع؟',
                    tip: 'التكامل الرقمي يقلل من زمن التوريد (Lead Time) ويمنع نفاد المخزون المفاجئ.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'sc_inventory_accuracy', type: 'yes_no',
                    text: 'هل تطابق سجلات المخزون الرقمية الواقع الفعلي بنسبة تتجاوز 98%؟',
                    tip: 'دقة المخزون تمنع العشوائية في الشراء وتوفر سيولة مهدرة في مواد غير مطلوبة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'sc_logistics_cost', type: 'yes_no',
                    text: 'هل يتم مراقبة تكلفة الشحن والتوصيل كنسبة مئوية من قيمة المبيعات؟',
                    tip: 'الرقابة على تكاليف النقل تكشف عن فرص التوفير عبر دمج الشحنات أو تغيير الموردين.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'sc_risk_diversification', type: 'yes_no',
                    text: 'هل توجد مصادر توريد بديلة للمواد الحيوية لتجنب مخاطر الانقطاع العالمي؟',
                    tip: 'الاعتماد على مورد واحد هو مخاطرة استراتيجية قد توقف عمل المنشأة بالكامل.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'production_efficiency',
            name: 'كفاءة الإنتاج والتحكم في الهدر',
            icon: 'bi-cpu-fill',
            questions: [
                {
                    id: 'pe_lean_adoption', type: 'yes_no',
                    text: 'هل تتبع العمليات مبادئ "الإنتاج الرشيق" (Lean) لتقليل الهدر الزمني والمادي؟',
                    tip: 'تقليل الهدر (Muda) يرفع الربحية دون الحاجة لزيادة الأسعار على العميل.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'pe_oee_monitoring', type: 'yes_no',
                    text: 'هل يتم قياس فعالية المعدات الإجمالية (OEE) لضمان الاستغلال الأمثل للآلات؟',
                    tip: 'الـ OEE يكشف ما إذا كان تعطل الإنتاج سببه فني أو تنظيمي أو بسبب الجودة.',
                    priority: { small: 'optional', medium: 'advanced', large: 'essential' }
                },
                {
                    id: 'pe_capacity_loading', type: 'yes_no',
                    text: 'هل يتم تشغيل خطوط الإنتاج أو فرق العمل بنسبة تحميل تتناسب مع طاقتهم القصوى؟',
                    tip: 'التحميل الزائد يقلل الجودة، والتحميل المنخفض يرفع التكاليف الثابتة للمنتج.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'pe_bottleneck_id', type: 'yes_no',
                    text: 'هل تم تحديد "عنق الزجاجة" (Bottleneck) في العمليات والعمل على توسيعه؟',
                    tip: 'سرعة العملية بأكملها تتوقف على سرعة أبطأ نقطة فيها؛ حددها وحلها.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'ops_planning',
            name: 'التخطيط التشغيلي والجدولة',
            icon: 'bi-calendar-range-fill',
            questions: [
                {
                    id: 'op_master_schedule', type: 'yes_no',
                    text: 'هل يوجد جدول إنتاج رئيسي (MPS) يغطي احتياجات السوق لفترة 3 أشهر قادمة؟',
                    tip: 'التخطيط المسبق يضمن توفر الموارد والعمالة قبل بدء ذروة الطلب.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'op_mrp_usage', type: 'yes_no',
                    text: 'هل يتم استخدام أنظمة تخطيط موارد التصنيع (MRP) لحساب كميات المواد المطلوبة بدقة؟',
                    tip: 'الـ MRP يمنع تكدس المواد أو نقصها الحاد عبر ربط المبيعات بالمخزون والمشتريات.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'op_shift_opt', type: 'yes_no',
                    text: 'هل توزيع ورديات العمل (Shifts) مدروس لضمان تغطية ساعات الذروة بكفاءة؟',
                    tip: 'التوزيع الصحيح للعمالة يقلل من تكلفة العمل الإضافي (Overtime) غير المبرر.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'op_lead_time_eval', type: 'yes_no',
                    text: 'هل يتم قياس ومحاولة تقليل "زمن الدورة" (Cycle Time) لكل عملية تشغيلية؟',
                    tip: 'تقليل زمن الدورة يعني القدرة على خدمة عملاء أكثر في وقت أقل وبنفس الموارد.',
                    priority: { small: 'important', medium: 'important', large: 'important' }
                }
            ]
        },
        {
            id: 'ops_tech',
            name: 'التقنية في العمليات التشغيلية',
            icon: 'bi-robot',
            questions: [
                {
                    id: 'ot_automation_level', type: 'yes_no',
                    text: 'هل تم أتمتة المهام اليدوية المتكررة التي تستهلك وقتاً طويلاً من الموظفين؟',
                    tip: 'الأتمتة ترفع الدقة وتقلل الأخطاء البشرية وتسمح للموظفين بالتركيز على مهام إبداعية.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'ot_iot_sensors', type: 'yes_no',
                    text: 'هل يتم استخدام مستشعرات (IoT) لمراقبة أداء الماكينات أو درجات الحرارة لحظياً؟',
                    tip: 'المراقبة اللحظية تمنع فساد المواد أو تلف الماكينات عبر التدخل الاستباقي.',
                    priority: { small: 'optional', medium: 'optional', large: 'advanced' }
                },
                {
                    id: 'ot_paperless_ops', type: 'yes_no',
                    text: 'هل العمليات التشغيلية "بلا أوراق" (Paperless) وتعتمد على الأجهزة اللوحية/الأنظمة؟',
                    tip: 'التحول الرقمي في المصنع/الموقع يقلل الضياع المعلوماتي ويسرع توثيق البيانات.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'ot_remote_monitoring', type: 'yes_no',
                    text: 'هل تملك الإدارة القدرة على مراقبة أداء العمليات عن بُعد عبر لوحات بيانات حية؟',
                    tip: 'القدرة على المراقبة عن بُعد تسرع اتخاذ القرار عند حدوث توقفات مفاجئة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'ops_quality',
            name: 'الجودة في الإنتاج والخدمات',
            icon: 'bi-patch-check-fill',
            questions: [
                {
                    id: 'oq_error_proofing', type: 'yes_no',
                    text: 'هل تطبق المنشأة تقنيات "منع الخطأ" (Poka-Yoke) في مراحل التنفيذ الحرجة؟',
                    tip: 'منع الخطأ من الوقوع أجدى بكثير من محاولة تصحيحه بعد حدوثه.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'oq_statistical_control', type: 'yes_no',
                    text: 'هل يتم استخدام الرقابة الإحصائية (SPC) لتتبع الانحرافات في جودة المخرجات؟',
                    tip: 'الإحصاء يكشف إذا كان الخلل عارضاً أو ناتجاً عن مشكلة فنية مزمنة في النظام.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'oq_waste_segregation', type: 'yes_no',
                    text: 'هل يتم تصنيف ومعالجة الهالك (Scrap) بطريقة مهنية لتقليل الخسائر المالية؟',
                    tip: 'إدارة الهالك قد تحول "خسارة محققة" إلى "عائد مادي" عبر إعادة التدوير أو البيع.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'oq_standardization', type: 'yes_no',
                    text: 'هل كافة العمليات التشغيلية موحدة ومعيارية (Standardized) لضمان ثبات الجودة؟',
                    tip: 'التوحيد يضمن أن المنتج/الخدمة ستكون بنفس الجودة بغض النظر عن الشخص المنفذ.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'maint_reliability',
            name: 'الصيانة وموثوقية الأصول',
            icon: 'bi-wrench-adjustable-circle-fill',
            questions: [
                {
                    id: 'mr_preventive_maint', type: 'yes_no',
                    text: 'هل يوجد جدول صيانة وقائية صارم للأصول (CMMS) يتم الالتزام به فعلياً؟',
                    tip: 'الصيانة المخططة أرخص بـ 10 أضعاف من الصيانة التصحيحية الطارئة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mr_spare_parts', type: 'yes_no',
                    text: 'هل تتوفر قطع الغيار "الحرجة" في المستودع لضمان سرعة الإصلاح عند العطل؟',
                    tip: 'نقص قطعة غيار بسيطة قد يوقف خط إنتاج بملايين الريالات لأيام.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mr_breakdown_analysis', type: 'yes_no',
                    text: 'هل يتم تحليل "معدل تعطل المعدات" (MTBF) لمعرفة الأصول المتهالكة واستبدالها؟',
                    tip: 'تجاوز الأصل لعمره الافتراضي يرفع تكاليف تشغيله ويقلل من موثوقية العمليات.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'mr_tech_competence', type: 'yes_no',
                    text: 'هل فريق الصيانة يملك المهارات اللازمة للتعامل مع التقنيات الحديثة للأصول؟',
                    tip: 'تدريب فريق الصيانة يقلل من الاعتماد على عقود الصيانة الخارجية المكلفة.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                }
            ]
        },
        {
            id: 'ops_hse',
            name: 'الصحة والسلامة والبيئة (HSE)',
            icon: 'bi-shield-shaded',
            questions: [
                {
                    id: 'hs_ppe_compliance', type: 'yes_no',
                    text: 'هل يلتزم جميع الموظفين والزوار بارتداء أدوات الوقاية الشخصية (PPE) في المواقع؟',
                    tip: 'الالتزام بالوقاية هو خط الدفاع الأول لمنع الحوادث الجسيمة والغرامات.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'hs_incident_reporting', type: 'yes_no',
                    text: 'هل يتم التبليغ عن "الحوادث الوشيكة" (Near Misses) للتعلم منها قبل وقوع حادث حقيقي؟',
                    tip: 'تحليل الـ Near Misses يمنع 90% من الحوادث المستقبلية قبل وقوعها.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'hs_waste_disposal', type: 'yes_no',
                    text: 'هل يتم التخلص من النفايات التشغيلية بطريقة متوافقة مع الأنظمة البيئية؟',
                    tip: 'المخالفات البيئية عقوباتها مغلظة جداً وقد تؤدي لسحب تراخيص التشغيل.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'hs_emergency_drills', type: 'yes_no',
                    text: 'هل تُجرى تجارب إخلاء وحرائق افتراضية لتدريب الموظفين على التصرف في الأزمات؟',
                    tip: 'سرعة الاستجابة في الثواني الأولى من الحادث تحدد حجم الخسائر في الأرواح والأصول.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'ops_data_perf',
            name: 'البيانات التشغيلية والأداء',
            icon: 'bi-bar-chart-fill',
            questions: [
                {
                    id: 'od_kpi_tracking', type: 'yes_no',
                    text: 'هل يتم تتبع مؤشرات الأداء التشغيلية (مثل نسبة الإتلاف، سرعة الإنجاز) يومياً؟',
                    tip: 'ما لا يمكن قياسه، لا يمكن إدارته ولا يمكن تحسينه.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'od_shift_handover', type: 'yes_no',
                    text: 'هل توجد آلية رسمية وموثقة لتسليم واستلام الورديات لضمان استمرارية المعلومات؟',
                    tip: 'فجوة المعلومات عند تغيير الورديات هي أكبر مسبب للأخطاء والحوادث التشغيلية.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'od_actual_vs_target', type: 'yes_no',
                    text: 'هل يتم عرض النتائج الفعلية مقابل المستهدفة بشفافية أمام فرق العمل في الموقع؟',
                    tip: 'وضوح الأرقام أمام الفريق يحفز المنافسة الإيجابية والشعور بالمسؤولية تجاه الهدف.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'od_continuous_refinement', type: 'yes_no',
                    text: 'هل يتم عقد جلسات تحسين دورية (Kaizen) لمراجعة الأداء وحل المشكلات المزمنة؟',
                    tip: 'التحسين المستمر هو رحلة لا تنتهي لرفع كفاءة العمليات وتخفيض التكاليف.',
                    priority: { small: 'optional', medium: 'advanced', large: 'essential' }
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
