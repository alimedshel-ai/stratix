// js/marketing-deep-config.js — مصفوفة التشخيص العميق للتسويق (Marketing Consulting)
// الأولويات: essential=🔴 | important=🟠 | advanced=🟡 | optional=⚪

window.MARKETING_DEEP_CONFIG = {

    // تصنيف الحجم بناءً على إجمالي الميزانية المرصودة أو فريق التسويق (نعتمد على الفريق)
    sizeFromTeam(teamSize) {
        if (!teamSize) return 'small';
        const map = { micro: 'small', small: 'small', medium: 'medium', large: 'large' };
        return map[teamSize] || 'small';
    },

    // ترجمة الأولويات والمسميات
    PRIORITY_LABELS: {
        essential: { emoji: '🔴', label: 'أساسي', color: '#ef4444', desc: 'مخاطرة بهدر الميزانية إن لم يطبق' },
        important: { emoji: '🟠', label: 'مهم', color: '#f59e0b', desc: 'يفرق بين التسويق الاحترافي ودفع الأموال العشوائي' },
        advanced: { emoji: '🟡', label: 'متقدم', color: '#eab308', desc: 'لتوسيع الحصة السوقية الكبرى' },
        optional: { emoji: '⚪', label: 'غير ضروري', color: '#64748b', desc: 'ممارسة اختيارية للنمو التراكمي' }
    },

    // 📣 المحاور الثمانية الأساسية لقطاع التسويق (32 عنصراً استشارياً)
    categories: [
        {
            id: 'strategy_positioning',
            name: 'الاستراتيجية وتحديد التموضع (Strategy & Positioning)',
            icon: 'bi-bullseye',
            questions: [
                {
                    id: 'mk_persona', type: 'yes_no',
                    text: 'هل تم بناء ما يسمى بـ (شخصية العميل - Buyer Persona) لمعرفة من تستهدف إعلاناتكم بدقة؟',
                    tip: 'إذا استهدفت "الجميع" في الإعلان، فلن يشعر به "أحد" بعينه.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mk_brand', type: 'yes_no',
                    text: 'هل تمتلك الشركة ميزة تنافسية (USP) واضحة في كل رسائلها تبرر للعميل اختيارها بدل المنافس؟',
                    tip: 'لا تسوّق منتجك بأنه (عالي الجودة وممتاز)، ابحث عن رسالة مختلفة صريحة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mk_budget_def', type: 'yes_no',
                    text: 'هل يتم تخصيص ميزانية تسويقية واضحة بنسبة (X%) من الإيرادات أو كأولوية استثمارية قبل بدء العام؟',
                    tip: 'طريقة الصرف (حين تتوفر السيولة نصرف للإعلان) تجعلك تغيب وقت ذروة السوق.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mk_market_research', type: 'yes_no',
                    text: 'هل يتم إجراء دراسة للمنافسين (Competitor Analysis) وتتبع أسعارهم وعروضهم شهرياً؟',
                    tip: 'معرفة تحركات المنافسين تمكنك من الابتكار في العرض السعري أو القيمة المضافة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'paid_campaigns',
            name: 'الحملات الرقمية والمبيعات (Paid Campaigns)',
            icon: 'bi-megaphone',
            questions: [
                {
                    id: 'mk_paid_ads', type: 'yes_no',
                    text: 'هل تعتمدون بشكل نشط ومخطط على الإعلانات الممولة (Meta, Google, TikTok, Snap) لجلب المبيعات؟',
                    tip: 'الاعتماد فقط على المتابعين للمبيعات هو انتحار صامت؛ الإعلان الممول هو وقود المبيعات.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mk_ab_test', type: 'yes_no',
                    text: 'هل يقوم فريق إطلاق الحملات باختبار الإعلانات (A/B Testing) بمبالغ صغيرة أولاً؟',
                    tip: 'إطلاق إعلان واحد بمبلغ ضخم دون اختباره مسبقاً هي مخاطرة عالية وحرق للأموال.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'mk_funnel', type: 'yes_no',
                    text: 'هل لديكم مسار تسويق يحوّل المتابع إلى عميل محتمل، ثم لعميل يدفع (Marketing Funnel)؟',
                    tip: 'ليس كل من يرى الإعلان سيشتري فورا، قدّم له شيء للحصول على بياناته لتسوّقه لاحقاً.',
                    priority: { small: 'optional', medium: 'advanced', large: 'essential' }
                },
                {
                    id: 'mk_ad_fatigue', type: 'yes_no',
                    text: 'هل يتم تغيير التصاميم والرسائل الإعلانية كل أسبوعين لمنع ملل الجمهور (Ad Fatigue)؟',
                    tip: 'ثبات الإعلان لفترة طويلة يقلل من نسبة النقر ويزيد من تكلفة العميل بشكل ملحوظ.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                }
            ]
        },
        {
            id: 'content_brand',
            name: 'المحتوى والهوية البصرية (Content & Brand)',
            icon: 'bi-palette',
            questions: [
                {
                    id: 'mk_visual_identity', type: 'yes_no',
                    text: 'هل تمتلكون دليلاً للهوية البصرية (Brand Guidelines) يضمن توحيد الألوان والخطوط والشعارات؟',
                    tip: 'التشتت البصري بين التصاميم يضعف من قوة العلامة التجارية في ذهن العميل.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mk_educational_content', type: 'yes_no',
                    text: 'هل يوفر المحتوى "قيمة مضافة" وفوائد للعميل قبل أن يحاول بيعه المنتج؟',
                    tip: 'الناس تشتري من الخبير! قدم المعرفة المرتبطة بمنتجك لتُرسَخ كعلامة مرجعية.',
                    priority: { small: 'important', medium: 'important', large: 'essential' }
                },
                {
                    id: 'mk_video_marketing', type: 'yes_no',
                    text: 'هل يتم إنتاج محتوى مرئي (Reels/TikToks) يعكس كواليس العمل أو تجربة المنتج؟',
                    tip: 'الفيديو هو اللغة الأكثر تأثيراً حالياً؛ كواليس العمل تبني الثقة و "أنسنة" العلامة التجارية.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'mk_copywriting', type: 'yes_no',
                    text: 'هل النصوص التسويقية (Copy) مكتوبة بأسلوب جذاب يستهدف "مشاعر" واحتياجات العميل؟',
                    tip: 'العميل لا يشتري "سريراً"، بل يشتري "نوماً مريحاً"؛ ركّز على النتائج وليس المميزات فقط.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'social_engagement',
            name: 'التواجد الرقمي والتفاعل (Social Media)',
            icon: 'bi-chat-heart',
            questions: [
                {
                    id: 'mk_response_speed', type: 'yes_no',
                    text: 'هل هناك استجابة ومتابعة سريعة لتعليقات ورسائل المتابعين (خلال أقل من ساعتين)؟',
                    tip: 'التأخر في الرد يقتل الرغبة الشرائية ويُشعر العميل بضعف خدمة العملاء.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mk_social_calendar', type: 'yes_no',
                    text: 'هل يوجد تقويم محتوى (Content Calendar) يخطط لما سيتم نشره لمدة شهر مقدمأ؟',
                    tip: 'النشر العشوائي "حسب المزاج" يمنع بناء قصة مترابطة للعلامة التجارية.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'mk_ugc', type: 'yes_no',
                    text: 'هل تقومون بإعادة نشر محتوى العملاء (UGC) الذين جربوا منتجاتكم وأثنوا عليها؟',
                    tip: 'شهادة العميل الحقيقي هي أقوى إعلان يمكنك الحصول عليه وبشكل مجاني.',
                    priority: { small: 'optional', medium: 'advanced', large: 'important' }
                },
                {
                    id: 'mk_influencers', type: 'yes_no',
                    text: 'هل تعتمدون على التعاون مع "مؤثري النخبة" أو الصغار (Micro-Influencers) لزيادة الوصول؟',
                    tip: 'المؤثرون الصغار يملكون ثقة أعلى وتفاعلاً أصدق مع جمهورهم.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                }
            ]
        },
        {
            id: 'analytics_roi',
            name: 'المقاييس وتحليل العائد (Analytics & ROI)',
            icon: 'bi-graph-up-arrow',
            questions: [
                {
                    id: 'mk_roi', type: 'yes_no',
                    text: 'هل يتم إحصاء (العائد من الاستثمار التسويقي - ROMI) بوضوح شهرياً؟',
                    tip: 'التسويق استثمار! صرفت 10 وأتت بـ 250.. هكذا يُقاس نجاح الحملة وليس بـ "حلوة".',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mk_pixels', type: 'yes_no',
                    text: 'هل تم زرع أدوات تتبع (Pixel/G-Tags) في مواقعكم لمعرفة مصادر المبيعات بدقة؟',
                    tip: 'بدون بيكسل التتبع، أنت تصرف وتبيع، ولكنك لا تعرف أبداً أي الإعلانات هي التي جلبت هذا العميل.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mk_cac', type: 'yes_no',
                    text: 'هل يتم قياس (تكلفة الاستحواذ على العميل - CAC) ومقارنتها بقيمته العمرية (LTV)؟',
                    tip: 'يجب أن تكون قيمة العميل على المدى البعيد أعلى بكثير من تكلفة جرة للمنصة أول مرة.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'mk_conversion_rate', type: 'yes_no',
                    text: 'هل تتابعون نسبة التحويل (Conversion Rate) في متجركم أو صفحة الهبوط وتحاولون تحسينها؟',
                    tip: 'تحسين نسبة التحويل من 1% إلى 2% يعني مضاعفة مبيعاتك بنفس ميزانية الإعلان.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                }
            ]
        },
        {
            id: 'retention_loyalty',
            name: 'تسويق الاحتفاظ والولاء (Retention)',
            icon: 'bi-heart-fill',
            questions: [
                {
                    id: 'mk_retargeting', type: 'yes_no',
                    text: 'هل يتم إعادة استهداف الزوار الذين لم يشتروا (Retargeting) عبر إعلانات مخصصة؟',
                    tip: 'الأشخاص الذين زاروا موقعك هم "صيد ثمين" ويحتاجون لسبب إضافي ليُتمموا الشراء.',
                    priority: { small: 'optional', medium: 'advanced', large: 'essential' }
                },
                {
                    id: 'mk_email_automation', type: 'yes_no',
                    text: 'هل لديكم رسائل بريد أو واتساب مؤتمتة تُرسل للعملاء بعد الشراء (Review/Cross-sell)؟',
                    tip: 'البيع مرة ثانية لعميل حالي أسهل وأرخص بكثير من جلب عميل جديد.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'mk_loyalty_program', type: 'yes_no',
                    text: 'هل لديكم برنامج ولاء حقيقي أو قائمة حصرية لعملائكم المخلصين؟',
                    tip: 'مخاطبة عملائك الحاليين بحصرية قبل الجمهور العادي هو أرخص عملية تسويق تقوم بها.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'mk_upsell', type: 'yes_no',
                    text: 'هل يتم تقديم عروض "رفع قيمة السلة" (Upsell) عند إتمام عملية الشراء؟',
                    tip: 'تقديم منتج مكمل في اللحظة الأخيرة يرفع متوسط قيمة الطلب دون تكلفة إضافية.',
                    priority: { small: 'optional', medium: 'advanced', large: 'essential' }
                }
            ]
        },
        {
            id: 'seo_organic',
            name: 'SEO والوصول المجاني (Organic)',
            icon: 'bi-search',
            questions: [
                {
                    id: 'mk_seo_keywords', type: 'yes_no',
                    text: 'هل يتم تحسين متجركم/موقعكم للظهور في الصفحة الأولى لقوقل لكلماتكم المفتاحية؟',
                    tip: 'البحث المجاني عبر قوقل يقدم لك مشترين جاهزين بنسبة 100% دون أن تدفع رسوم النقر.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'mk_site_speed', type: 'yes_no',
                    text: 'هل سرعة تحميل الموقع ممتازة (أقل من 3 ثوانٍ) لضمان عدم خروج الزائر سريعاً؟',
                    tip: 'تأخر الموقع لثانية واحدة قد يكلفك 7% من المبيعات المحتملة.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mk_link_building', type: 'yes_no',
                    text: 'هل يتم الحصول على روابط خلفية (Backlinks) من مواقع أخرى لرفع موثوقية موقعكم؟',
                    tip: 'الروابط الخلفية هي "شهادات تزكية" لموقعك ترفع من ترتيبك في محركات البحث.',
                    priority: { small: 'optional', medium: 'optional', large: 'advanced' }
                },
                {
                    id: 'mk_blogging', type: 'yes_no',
                    text: 'هل يتم كتابة مقالات تعليمية مرتبطة بقطاعكم لجذب الزيارات المجانية؟',
                    tip: 'المحتوى التعليمي النصي هو مغناطيس دائم لجلب عملاء عبر محركات البحث.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                }
            ]
        },
        {
            id: 'ops_team',
            name: 'العمليات وفريق التسويق (Ops & Team)',
            icon: 'bi-people',
            questions: [
                {
                    id: 'mk_in_house_vs_agency', type: 'yes_no',
                    text: 'هل تملك المنشأة فريقاً داخلياً قادراً على إدارة العمليات التسويقية الحيوية؟',
                    tip: 'الاعتماد الكامل على الوكالات قد يضعف الشخصية الحقيقية لرسائلكم التسويقية.',
                    priority: { small: 'optional', medium: 'important', large: 'essential' }
                },
                {
                    id: 'mk_marketing_tools', type: 'yes_no',
                    text: 'هل يتم استخدام أدوات احترافية لإدارة المهام والتواصل بين الفريق الإبداعي والتنفيذي؟',
                    tip: 'تشتت المهام في الواتساب يمنع التخطيط السليم ويؤدي لضياع الفرص الموسمية.',
                    priority: { small: 'important', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mk_data_driven', type: 'yes_no',
                    text: 'هل القرارات التسويقية تُبنى على "الأرقام والنتائج" وليس على "الآراء الشخصية"؟',
                    tip: 'في التسويق، الأرقام لا تكذب ولكن الآراء الشخصية قد تكون مضللة ومكلفة.',
                    priority: { small: 'essential', medium: 'essential', large: 'essential' }
                },
                {
                    id: 'mk_agile_marketing', type: 'yes_no',
                    text: 'هل يتميز فريق التسويق بالمرونة والقدرة على مواكبة الترندات والأحداث الجارية فوراً؟',
                    tip: 'الاستجابة السريعة للأحداث (Real-time Marketing) تضاعف من وصولكم المجاني.',
                    priority: { small: 'optional', medium: 'important', large: 'important' }
                }
            ]
        }
    ],

    // فلترة الأسئلة
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

    // الإحصائيات العامة
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
