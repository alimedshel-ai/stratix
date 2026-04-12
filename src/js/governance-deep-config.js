// js/governance-deep-config.js — مصفوفة التشخيص العميق لمخاطر الحوكمة والامتثال
// الأولويات: essential=🔴 | important=🟠 | advanced=🟡 | optional=⚪

window.GOVERNANCE_DEEP_CONFIG = {

    // تصنيف الحجم بناءً على teamSize أو الإيرادات
    sizeFromTeam(teamSize) {
        if (!teamSize) return 'small';
        const map = { micro: 'small', small: 'small', medium: 'medium', large: 'large' };
        return map[teamSize] || 'small';
    },

    PRIORITY_LABELS: {
        essential: { emoji: '🔴', label: 'أساسي', color: '#ef4444', desc: 'مخاطرة توقف العمل أو غرامات قطعية' },
        important: { emoji: '🟠', label: 'مهم', color: '#f59e0b', desc: 'يحمي من التسرب والنزاعات القانونية' },
        advanced: { emoji: '🟡', label: 'متقدم', color: '#eab308', desc: 'حوكمة استباقية وتنافسية' },
        optional: { emoji: '⚪', label: 'اختياري', color: '#64748b', desc: 'متطلبات الشركات المساهمة والمدرجة' }
    },

    // ⚖️ المحاور الثمانية للحوكمة والامتثال (32 عنصراً استشارياً)
    categories: [
        {
            id: 'board_effectiveness',
            name: 'فعالية المجلس والقرار الاستراتيجي',
            icon: 'bi-people-fill',
            questions: [
                {
                    id: 'gov_board_meetings', type: 'scale',
                    text: 'كم عدد اجتماعات مجلس الإدارة / المديرين الموثقة التي تعقد سنوياً بمحاضر رسمية؟',
                    tip: 'الحد الأدنى المقبول حوكمياً هو 4 اجتماعات (ربعي)؛ التوثيق يحمي حقوق الشركاء.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' },
                    scale: { min: 0, max: 12 }
                },
                {
                    id: 'gov_board_competence', type: 'yes_no',
                    text: 'هل أعضاء المجلس يمتلكون مهارات متنوعة (مالية، قانونية، تقنية) تغطي احتياجات المنشأة؟',
                    tip: 'تنوع المهارات في المجلس يقلل من التحيز في اتخاذ القرارات ويوسع أفق الرؤية.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'gov_strategic_oversight', type: 'yes_no',
                    text: 'هل يقوم المجلس بمراجعة الأداء الفعلي مقابل الأهداف الاستراتيجية كل ربع سنة على الأقل؟',
                    tip: 'دور المجلس هو الرقابة على الاستراتيجية لضمان عدم الانحراف عن المسار المرسوم.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'gov_ceo_eval', type: 'yes_no',
                    text: 'هل توجد آلية رسمية ودورية لتقييم أداء الرئيس التنفيذي بناءً على نتائج محددة؟',
                    tip: 'الفصل بين الملكية والإدارة يتطلب نظام مراقبة وتقييم واضح للأداء التنفيذي.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'transparency_disclosure',
            name: 'الشفافية والإفصاح عن البيانات',
            icon: 'bi-eye-fill',
            questions: [
                {
                    id: 'gov_financial_transparency', type: 'yes_no',
                    text: 'هل يتم تزويد الشركاء/المساهمين بتقارير مالية شفافة بانتظام يتجاوز المتطلب النظامي؟',
                    tip: 'الشفافية المالية تبني جسور الثقة وتسهل الحصول على تمويل أو جولات استثمارية.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'gov_disclosure_policy', type: 'yes_no',
                    text: 'هل تمتلك المنشأة سياسة معتمدة للإفصاح تحدد المعلومات التي يجب إعلانها ومن هم المصرح لهم؟',
                    tip: 'التحكم في تدفق المعلومات يمنع الشائعات والتسريبات التي قد تضر بسمعة الشركة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'gov_website_governance', type: 'yes_no',
                    text: 'هل يوجد قسم مخصص للحوكمة على موقع المنشأة الإلكتروني يعرض الهيكل واللوائح الأساسية؟',
                    tip: 'هذا الإجراء يرفع من تصنيف المنشأة أمام المستثمرين والجهات الحكومية.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'gov_annual_report', type: 'yes_no',
                    text: 'هل تصدر المنشأة تقريراً سنوياً شاملاً يعرض الإنجازات، التحديات، والحوكمة؟',
                    tip: 'التقرير السنوي هو مرآة المنشأة أمام العالم، ويعتبر من أرقى ممارسات الحوكمة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'conflict_interest',
            name: 'تضارب المصالح والسلوك الأخلاقي',
            icon: 'bi-shield-exclamation',
            questions: [
                {
                    id: 'gov_conflict_policy', type: 'yes_no',
                    text: 'هل يوجد سياسة "تعارض المصالح" مُوقّعة من قبل الإدارة والموظفين ذوي الصلاحيات المالية؟',
                    tip: 'منع استغلال المنصب للمصلحة الشخصية هو أساس النزاهة المؤسسية.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'gov_ethics_code', type: 'yes_no',
                    text: 'هل تمتلك المنشأة "ميثاق الأخلاقيات والسلوك" (Code of Conduct) معمم على الجميع؟',
                    tip: 'الميثاق يحدد المعايير السلوكية المتوقعة ويحمي بيئة العمل من التجاوزات.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'gov_related_party', type: 'yes_no',
                    text: 'هل توجد سجلات توثق جميع التعاملات مع "الأطراف ذات العلاقة" (أقارب، شركات تابعة)؟',
                    tip: 'التعاملات مع الأقارب والشركات الزميلة يجب أن تكون بأسعار السوق العادلة وبشفافية تامة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'gov_anti_bribery', type: 'yes_no',
                    text: 'هل توجد سياسات واضحة لمكافحة الرشوة والفساد تتضمن إجراءات تبليغ محمية (Whistleblowing)؟',
                    tip: 'حماية المبلغين تشجع على كشف الفساد قبل أن يستشري ويدمر المنشأة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'governance_structure',
            name: 'هيكل الحوكمة ووضوح الأدوار',
            icon: 'bi-diagram-3',
            questions: [
                {
                    id: 'gov_doa', type: 'yes_no',
                    text: 'هل توجد "مصفوفة تفويض الصلاحيات" (DOA) تحدد بوضوح من يملك حق الاعتماد المالي؟',
                    tip: 'الـ DOA يمنع تركيز القوة في يد واحدة ويوزع المسؤوليات بشكل منهجي.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'gov_role_separation', type: 'yes_no',
                    text: 'هل هناك فصل واضح بين منصب رئيس مجلس الإدارة ومنصب المدير التنفيذي؟',
                    tip: 'الجمع بينهم يخل بمبدأ الرقابة وقد يؤدي لقرارات أحادية غير خاضعة للمساءلة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'gov_articles_assoc', type: 'yes_no',
                    text: 'هل النظام الأساسي للمنشأة محدث ومتوافق مع أحدث تعديلات نظام الشركات السعودي؟',
                    tip: 'الامتثال القانوني للهيكل التأسيسي هو المربع الأول للحوكمة السليمة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'gov_secretary', type: 'yes_no',
                    text: 'هل يوجد أمين سر للمجلس مؤهل بمهام محددة لتوثيق الاجتماعات والقرارات؟',
                    tip: 'أمين السر هو حافظ ذاكرة الحوكمة والضابط لإجراءات المجلس.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                }
            ]
        },
        {
            id: 'effective_committees',
            name: 'فعالية لجان الحوكمة المتخصصة',
            icon: 'bi-person-lines-fill',
            questions: [
                {
                    id: 'gov_audit_committee', type: 'yes_no',
                    text: 'هل تم تشكيل "لجنة تدقيق" مستقلة ترفع تقاريرها للمجلس (وليس للإدارة التنفيذية)؟',
                    tip: 'لجنة التدقيق تضمن سلامة التقارير المالية وكفاءة التدقيق الداخلي والخارجي.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'gov_risk_committee', type: 'yes_no',
                    text: 'هل توجد لجنة مخاطر (أو مهام مدمجة) تتابع استباقياً التهديدات التي قد تواجه استدامة المنشأة؟',
                    tip: 'المخاطر تتطور بسرعة، ووجود لجنة متخصصة يضمن الاستعداد الدائم للطوارئ.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'gov_nomination_remuneration', type: 'yes_no',
                    text: 'هل توجد لجنة ترشيحات ومكافآت لضمان عدالة التعيينات والمبالغ المدفوعة للقيادات؟',
                    tip: 'هذه اللجنة تمنع المحسوبية وتضمن جذب أفضل الكفاءات للمناصب القيادية.',
                    priority: { small: 'optional', medium: 'optional', large: 'important' }
                },
                {
                    id: 'gov_committee_charters', type: 'yes_no',
                    text: 'هل تملك اللجان لوائح داخلية (Charters) تحدد صلاحياتها وخطوط رفع تقاريرها؟',
                    tip: 'بدون لوائح، تظل اللجان مجرد لقاءات اجتماعية غير منتجة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'risk_management',
            name: 'إدارة المخاطر المؤسسية',
            icon: 'bi-graph-down-arrow',
            questions: [
                {
                    id: 'gov_risk_register', type: 'yes_no',
                    text: 'هل تمتلك المنشأة "سجل مخاطر" (Risk Register) مفصل ومحدث بشكل ربع سنوي؟',
                    tip: 'السجل هو رادار المنشأة للكشف عن العواصف قبل وصولها.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'gov_bcp_plan', type: 'yes_no',
                    text: 'هل توجد خطة معتمدة لاستمرارية الأعمال (BCP) تم اختبارها مؤخراً بشكل افتراضي؟',
                    tip: 'الخطة التي لم تُختبر لا تعتبر موجودة؛ التجربة تضمن سرعة التعافي عند الكوارث.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'gov_risk_appetite', type: 'yes_no',
                    text: 'هل قام المجلس بتحديد "شهية المخاطر" (Risk Appetite) التي تحدد سقوف القرارات الجريئة؟',
                    tip: 'معرفة حدود المخاطرة المسموح بها تحمي المدير التنفيذي والمساهمين معاً.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'gov_crisis_mgmt', type: 'yes_no',
                    text: 'هل توجد خلية إدارة أزمات مدربة ولديها بروتوكول تواصل في حالات الطوارئ القصوى؟',
                    tip: 'الارتباك في إدارة الأزمات يضاعف الأضرار؛ البروتوكول الواضح يمنع الفوضى.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'stakeholder_rights',
            name: 'حقوق وأصحاب المصلحة',
            icon: 'bi-award',
            questions: [
                {
                    id: 'gov_shareholder_rights', type: 'yes_no',
                    text: 'هل يتم تسهيل حق المساهمين في التصويت، طرح الأسئلة، والاطلاع على المحاضر؟',
                    tip: 'حماية حقوق الأقلية في المساهمة هو معيار الرقي في أنظمة الحوكمة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'gov_esg_aspects', type: 'yes_no',
                    text: 'هل تأخذ المنشأة في اعتبارها الأبعاد الاجتماعية والبيئية (ESG) في استراتيجيتها؟',
                    tip: 'المسؤولية المجتمعية لم تعد تبرعاً، بل جزءً من الاستدامة الاقتصادية للمنشأة.',
                    priority: { small: 'optional', medium: 'optional', large: 'advanced' }
                },
                {
                    id: 'gov_labor_rights', type: 'yes_no',
                    text: 'هل يتم الوفاء بجميع حقوق الموظفين المالية والنظامية لضمان عدم تعرض الشركة لدعاوى قضائية؟',
                    tip: 'العدالة الداخلية للموظفين هي خط الدفاع الأول ضد النزاعات القانونية المكلفة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'gov_reputation_risk', type: 'yes_no',
                    text: 'هل يتم قياس مستوى سمعة المنشأة في السوق لدى أصحاب المصلحة الرئيسيين؟',
                    tip: 'السمعة هي أصل غير ملموس قد تتجاوز قيمته الأصول المادية؛ حمايتها هي قمة الحوكمة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'culture_accountability',
            name: 'ثقافة الحوكمة والمساءلة',
            icon: 'bi-building',
            questions: [
                {
                    id: 'gov_accountability_system', type: 'yes_no',
                    text: 'هل يسود في المنشأة مبدأ "المحاسبة على الأهداف" دون استثناء لأي مستوى وظيفي؟',
                    tip: 'نظام الحوكمة يكون فعالاً عندما يشعر الجميع أنهم خاضعون للمساءلة والتقييم.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'gov_awareness_training', type: 'yes_no',
                    text: 'هل يتم تدريب القيادات الوسطى على مفاهيم الحوكمة والنزاهة المؤسسية؟',
                    tip: 'الحوكمة لا تنجح إذا ظلت محصورة في قاعة اجتماعات المجلس ولم تنتقل للتنفيذ.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                },
                {
                    id: 'gov_internal_control', type: 'yes_no',
                    text: 'هل يتم فحص كفاءة "أنظمة الرقابة الداخلية" (Internal Controls) بشكل مستقل دورياً؟',
                    tip: 'الرقابة هي الأداة التي تضمن أن القرارات تُنفذ حسب السياسات المعتمدة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'gov_continuous_improvement', type: 'yes_no',
                    text: 'هل يتم تطوير لوائح الحوكمة لتواكب نمو المنشأة وتغير البيئة التنظيمية؟',
                    tip: 'الحوكمة الجامدة تصبح عائقاً؛ الحوكمة الذكية تتطور لتسهل النمو المنضبط.',
                    priority: { small: 'optional', medium: 'advanced', large: 'essential' }
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
