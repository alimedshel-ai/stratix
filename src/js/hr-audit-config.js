/**
 * Startix — HR Audit Pro Config
 * بيانات المحاور والبنود لأداة فحص الموارد البشرية الاحترافية
 * 9 محاور × 51 بند — مسار المدير المستقل
 * مصدر: hr-audit.html (التقييم الوصفي الجنائي)
 */
window.HRAuditConfig = (function () {

    const SIZE_MAP = {
        small:  { label: 'صغيرة (أقل من 20 موظف)', axes: [1, 2, 3, 4, 5] },
        medium: { label: 'متوسطة (20–100 موظف)',    axes: [1, 2, 3, 4, 5, 6, 7] },
        large:  { label: 'كبيرة (أكثر من 100 موظف)', axes: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
    };

    const AXES = [

        // ═══ المحور 1: التنظيم والقيادة ═══
        {
            id: 1, key: 'organization', name: 'التنظيم والقيادة',
            icon: 'bi-diagram-3', color: '#6366f1',
            items: [
                { id: 'management_style', label: 'نمط الإدارة والقيادة', question: 'هل نمط القيادة تحويلي أو ديمقراطي يدعم الابتكار والمشاركة؟', evidence: 'تقييم 360 للقادة / استبيان بيئة العمل' },
                { id: 'org_chart', label: 'الهيكل التنظيمي', question: 'هل الهيكل التنظيمي محدّث وشامل ومعتمد رسمياً؟', evidence: 'وثيقة الهيكل التنظيمي المحدثة' },
                { id: 'span_control', label: 'نطاق الإشراف (Span of Control)', question: 'هل نطاق الإشراف مثالي (3-7 موظفين لكل مدير)؟', evidence: 'تحليل نطاق الإشراف لكل مدير' },
                { id: 'hr_planning', label: 'تخطيط الموارد البشرية السنوي', question: 'هل توجد خطة سنوية للقوى العاملة مرتبطة بخطة النمو؟', evidence: 'خطة الموارد البشرية السنوية' },
                { id: 'succession_plan', label: 'خطة التعاقب للمناصب الحرجة', question: 'هل خطة التعاقب موثقة ومحدثة لكل منصب حرج؟', evidence: 'وثيقة خطة التعاقب + قائمة المناصب الحرجة' }
            ]
        },

        // ═══ المحور 2: الاستقطاب والمواهب ═══
        {
            id: 2, key: 'talent', name: 'الاستقطاب والمواهب',
            icon: 'bi-person-plus', color: '#2563eb',
            items: [
                { id: 'job_descriptions', label: 'بطاقات الوصف الوظيفي', question: 'هل بطاقات الوصف الوظيفي مكتملة 100% لجميع الأدوار؟', evidence: 'ملفات JD لكل الوظائف' },
                { id: 'competency_framework', label: 'إطار الجدارات والكفاءات', question: 'هل يوجد إطار جدارات معتمد وفعّال للوظائف الرئيسية؟', evidence: 'وثيقة إطار الجدارات' },
                { id: 'recruitment_strategy', label: 'استراتيجية الاستقطاب والتعيين', question: 'هل عملية الاستقطاب ممنهجة واحترافية مع قنوات متنوعة؟', evidence: 'وثيقة استراتيجية الاستقطاب + تقارير القنوات' },
                { id: 'onboarding_process', label: 'برنامج تهيئة الموظفين الجدد', question: 'هل يوجد برنامج تهيئة مهيكل وفعّال (أول 90 يوم)؟', evidence: 'وثيقة برنامج التهيئة + checklist' },
                { id: 'selection_criteria', label: 'معايير الاختيار والمقابلات', question: 'هل معايير الاختيار مبنية على الجدارات مع مقابلات منظمة؟', evidence: 'نموذج التقييم + أدلة المقابلات' }
            ]
        },

        // ═══ المحور 3: التعويضات والرواتب ═══
        {
            id: 3, key: 'compensation', name: 'التعويضات والرواتب',
            icon: 'bi-cash-stack', color: '#16a34a',
            items: [
                { id: 'payroll_accuracy', label: 'دقة حساب الرواتب والبدلات', question: 'هل حساب الرواتب دقيق بدون أخطاء مع تدقيق من شخصين؟', evidence: 'تقرير دقة الرواتب الشهري' },
                { id: 'incentive_schemes', label: 'أنظمة الحوافز والمكافآت', question: 'هل الحوافز مرتبطة بالأداء مع نظام شفاف ومعلن؟', evidence: 'وثيقة نظام الحوافز + ربطها بالـ KPIs' },
                { id: 'allowances_benchmarking', label: 'مقارنة البدلات بالسوق', question: 'هل تُجرى مسوحات رواتب سنوية ومقارنة مع المنافسين؟', evidence: 'تقرير مسح الرواتب السنوي' },
                { id: 'mudad_compliance', label: 'الالتزام بنظام حماية الأجور (مدد)', question: 'هل يتم الالتزام 100% بنظام حماية الأجور في مواعيد الصرف؟', evidence: 'تقرير مدد + سجل التحويلات' }
            ]
        },

        // ═══ المحور 4: إدارة الأداء ═══
        {
            id: 4, key: 'performance', name: 'إدارة الأداء',
            icon: 'bi-graph-up-arrow', color: '#7c3aed',
            items: [
                { id: 'performance_management', label: 'دورية تقييم أداء الموظفين', question: 'هل يتم تقييم الأداء بشكل ربع سنوي أو نصف سنوي بنموذج واضح؟', evidence: 'نموذج التقييم + سجل الدورات' },
                { id: 'kpi_alignment', label: 'ربط أهداف الموظف بأهداف الشركة', question: 'هل أهداف كل موظف مرتبطة مباشرة بأهداف القسم والشركة (OKRs)؟', evidence: 'خريطة الأهداف المتتالية' },
                { id: 'feedback_culture', label: 'ثقافة التغذية الراجعة', question: 'هل توجد ثقافة تغذية راجعة مستمرة وبناءة (1-on-1 شهري)؟', evidence: 'جدول الاجتماعات + نموذج الملاحظات' }
            ]
        },

        // ═══ المحور 5: التدريب والتطوير ═══
        {
            id: 5, key: 'training', name: 'التدريب والتطوير',
            icon: 'bi-book', color: '#0891b2',
            items: [
                { id: 'training_needs_analysis', label: 'تحديد الاحتياجات التدريبية', question: 'هل يُجرى تحليل احتياجات تدريبية سنوي بناءً على فجوات الأداء؟', evidence: 'تقرير TNA السنوي' },
                { id: 'training_roi', label: 'قياس أثر التدريب على الإنتاجية', question: 'هل يُقاس أثر كل برنامج تدريبي بعد 90 يوم على KPIs؟', evidence: 'تقرير ROI للتدريب' },
                { id: 'digital_learning', label: 'تبني منصات التعلم الإلكتروني', question: 'هل تُستخدم منصة تعلم إلكتروني مفعّلة ونشطة؟', evidence: 'اشتراك + معدلات الاستخدام' },
                { id: 'internal_promotion', label: 'سياسة الترقية الداخلية', question: 'هل سياسة الترقية واضحة وعادلة ومبنية على معايير معلنة؟', evidence: 'وثيقة سياسة الترقيات' },
                { id: 'career_pathing', label: 'سُلّم المسار الوظيفي والنمو', question: 'هل يوجد مسار وظيفي واضح لكل عائلة وظيفية؟', evidence: 'خرائط المسار الوظيفي' }
            ]
        },

        // ═══ المحور 6: الامتثال والقانون ═══
        {
            id: 6, key: 'compliance', name: 'الامتثال والقانون',
            icon: 'bi-shield-check', color: '#dc2626',
            items: [
                { id: 'employment_contracts', label: 'توثيق العقود في منصة قوى', question: 'هل جميع العقود موثقة 100% في منصة قوى؟', evidence: 'تقرير منصة قوى' },
                { id: 'labor_law_compliance', label: 'الالتزام بنظام العمل السعودي', question: 'هل يتم الامتثال الكامل والمحدث لنظام العمل؟', evidence: 'تقرير المراجعة القانونية' },
                { id: 'medical_insurance', label: 'جودة التغطية والاستحقاق الطبي', question: 'هل التغطية الطبية من فئة ممتازة تنافس السوق؟', evidence: 'عقد التأمين + مقارنة بالسوق' },
                { id: 'gosi_status', label: 'صحة السجلات في التأمينات', question: 'هل سجلات التأمينات الاجتماعية (GOSI) مطابقة 100%؟', evidence: 'تقرير تدقيق GOSI' },
                { id: 'safety_committee', label: 'لجنة الصحة والسلامة المهنية', question: 'هل لجنة السلامة مفعّلة مع تدريبات دورية كل 3 أشهر؟', evidence: 'محاضر اللجنة + سجل التدريبات' },
                { id: 'grievance_policy', label: 'سياسة التظلم والاعتراض', question: 'هل توجد سياسة تظلم واضحة تحمي الموظف وتضمن السرية؟', evidence: 'وثيقة سياسة التظلم' },
                { id: 'disciplinary_code', label: 'لائحة الجزاءات والمخالفات', question: 'هل لائحة الجزاءات معتمدة ومطبقة بعدالة على الجميع؟', evidence: 'لائحة الجزاءات + سجل التطبيق' }
            ]
        },

        // ═══ المحور 7: العمليات والأدوات ═══
        {
            id: 7, key: 'operations', name: 'العمليات والأدوات',
            icon: 'bi-gear', color: '#d97706',
            items: [
                { id: 'attendance_tracking', label: 'نظام تتبع الحضور والانصراف', question: 'هل يُستخدم نظام حضور إلكتروني دقيق (بصمة/تطبيق)؟', evidence: 'تقرير النظام + نسبة الالتزام' },
                { id: 'overtime_policy', label: 'إدارة العمل الإضافي', question: 'هل العمل الإضافي منظم مع اعتماد مسبق وحد أقصى واضح؟', evidence: 'سياسة العمل الإضافي + تقرير الصرف' },
                { id: 'vacation_management', label: 'تخطيط وإدارة رصيد الإجازات', question: 'هل يُدار رصيد الإجازات آلياً مع سياسة استخدام سنوي إلزامي؟', evidence: 'نظام الإجازات + تقرير الأرصدة' },
                { id: 'hr_dashboard', label: 'لوحات بيانات الموارد (Analytics)', question: 'هل توجد لوحة بيانات HR ذكية فورية لأهم 10 مؤشرات؟', evidence: 'لوحة HR Dashboard' },
                { id: 'cost_per_employee', label: 'تحليل تكلفة الموظف (TCO)', question: 'هل تُحسب التكلفة الإجمالية لكل موظف بدقة (راتب + بدلات + تأمين + تدريب)؟', evidence: 'جدول TCO لكل مستوى وظيفي' },
                { id: 'hiring_cost', label: 'تكلفة الاستقطاب (Cost/Hire)', question: 'هل تُتتبع تكلفة التوظيف لكل شاغر وتُقارن بالمعيار؟', evidence: 'تقرير Cost per Hire' },
                { id: 'internal_communication', label: 'قنوات التواصل الداخلي', question: 'هل تُستخدم قناة تواصل رسمية فعالة (Slack/Teams) للقسم؟', evidence: 'تقرير استخدام أدوات التواصل' },
                { id: 'office_tools', label: 'توفر الأدوات والبرمجيات', question: 'هل الأدوات والبرمجيات حديثة ومكتملة تلبي احتياجات الفريق؟', evidence: 'تقييم احتياجات الأدوات' }
            ]
        },

        // ═══ المحور 8: الثقافة والابتكار ═══
        {
            id: 8, key: 'culture', name: 'الثقافة والابتكار',
            icon: 'bi-lightbulb', color: '#ec4899',
            items: [
                { id: 'work_environment', label: 'جودة بيئة العمل المادية', question: 'هل بيئة العمل المادية ممتازة ومريحة (إضاءة، مساحة، تهوية)؟', evidence: 'تقييم بيئة العمل + استبيان الموظفين' },
                { id: 'employee_engagement', label: 'مستوى ارتباط الموظفين', question: 'هل مستوى ارتباط الموظفين عالٍ جداً بناءً على استبيانات دورية؟', evidence: 'نتائج استبيان الارتباط السنوي' },
                { id: 'innovation_culture', label: 'دعم الأفكار والابتكار', question: 'هل توجد برامج تحفيز واضحة لدعم الأفكار الجديدة؟', evidence: 'وثيقة برنامج الابتكار + أمثلة' },
                { id: 'diversity_inclusion', label: 'تنوع القوى العاملة والشمول', question: 'هل التنوع مثمر ومنظم مع معايير توظيف تضمن الشمول؟', evidence: 'تقرير التنوع + سياسة الشمول' },
                { id: 'women_empowerment', label: 'تمكين المرأة في المناصب القيادية', question: 'هل توجد سياسة تمكين فعالة للمرأة في المناصب القيادية؟', evidence: 'نسبة التمثيل + خطة التمكين' },
                { id: 'employer_branding', label: 'هوية جهة العمل كعلامة', question: 'هل سمعة الشركة كجهة عمل قوية في السوق؟', evidence: 'تقييمات Glassdoor/LinkedIn + استبيان المرشحين' },
                { id: 'mental_health', label: 'صحة ورفاهية الموظفين النفسية', question: 'هل تُقدم برامج دعم نفسي مفعّلة (EAP) ومبادرات رفاهية؟', evidence: 'برنامج EAP + معدلات الاستخدام' },
                { id: 'remote_work_readiness', label: 'جاهزية العمل عن بعد/الهجين', question: 'هل البنية التقنية جاهزة تماماً للعمل عن بعد؟', evidence: 'خطة العمل عن بعد + البنية التقنية' }
            ]
        },

        // ═══ المحور 9: الاستبقاء والخروج ═══
        {
            id: 9, key: 'retention', name: 'الاستبقاء والخروج',
            icon: 'bi-door-open', color: '#ea580c',
            items: [
                { id: 'exit_interviews', label: 'تحليل مقابلات نهاية الخدمة', question: 'هل تُجرى مقابلة خروج إلزامية لكل مستقيل مع تحليل ربع سنوي؟', evidence: 'نموذج مقابلة الخروج + تقرير التحليل' },
                { id: 'future_skills_gap', label: 'تحليل فجوة مهارات المستقبل', question: 'هل يُجرى تحليل فجوة مهارات المستقبل سنوياً مع خطة تطوير؟', evidence: 'تقرير تحليل الفجوة السنوي' },
                { id: 'employee_handbook', label: 'دليل الموظف (SOPs)', question: 'هل دليل الموظف شامل وسهل الوصول (رقمي + مطبوع)؟', evidence: 'دليل الموظف الرقمي' },
                { id: 'hr_budget_control', label: 'الرقابة على ميزانية HR', question: 'هل توجد ميزانية HR سنوية مع مراجعة شهرية للصرف؟', evidence: 'تقرير الميزانية الشهري' },
                { id: 'expats_management', label: 'إدارة شؤون الوافدين', question: 'هل إدارة التأشيرات والإقامات منظمة مع تنبيهات قبل 60 يوم؟', evidence: 'نظام التنبيهات + سجل التجديد' }
            ]
        }
    ];

    const SCORE_LEVELS = [
        { min: 0,  max: 15, key: 'chaos',      label: 'فجوات جوهرية',    color: '#ef4444', desc: 'عمليات HR غير منظمة — تحتاج إعادة هيكلة شاملة وعاجلة' },
        { min: 16, max: 30, key: 'growth',      label: 'يحتاج تحسين',     color: '#f59e0b', desc: 'أساسيات موجودة لكن مع فجوات كبيرة في العمليات والامتثال' },
        { min: 31, max: 42, key: 'mature',      label: 'نضج مؤسسي جيد',   color: '#10b981', desc: 'ممارسات HR جيدة مع فرص واضحة للتحسين والأتمتة' },
        { min: 43, max: 51, key: 'excellence',  label: 'تميز مؤسسي',      color: '#6366f1', desc: 'منظومة موارد بشرية متقدمة — قيادة في القطاع' }
    ];

    return {
        SIZE_MAP,
        AXES,
        SCORE_LEVELS,
        getAxesForSize(size) {
            const allowed = SIZE_MAP[size]?.axes || SIZE_MAP.large.axes;
            return AXES.filter(a => allowed.includes(a.id));
        },
        getAxisById(id) {
            return AXES.find(a => a.id === id);
        },
        getTotalItems(size) {
            return this.getAxesForSize(size).reduce((sum, a) => sum + a.items.length, 0);
        },
        getScoreLevel(score) {
            return SCORE_LEVELS.find(l => score >= l.min && score <= l.max) || SCORE_LEVELS[0];
        }
    };

})();
