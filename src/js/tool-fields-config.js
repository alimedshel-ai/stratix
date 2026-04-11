/**
 * Startix — Tool Fields Config
 * تعريف حقول كل أداة تستخدم tool-detail.html
 */
window.TOOL_FIELDS = {
    PESTEL: {
        title: 'تحليل PESTEL',
        subtitle: 'حلل البيئة الخارجية من 6 أبعاد لاكتشاف الفرص والتهديدات',
        icon: 'bi-globe2',
        color: '#0891b2',
        phaseLabel: 'محطة التشخيص: البيئة الكلية',
        fields: [
            { id: 'political', label: 'العوامل السياسية (Political)', icon: 'bi-bank', placeholder: 'القوانين، اللوائح، السياسات الحكومية، الاستقرار السياسي، التجارة الدولية...' },
            { id: 'economic', label: 'العوامل الاقتصادية (Economic)', icon: 'bi-cash-stack', placeholder: 'التضخم، أسعار الفائدة، البطالة، القدرة الشرائية، النمو الاقتصادي...' },
            { id: 'social', label: 'العوامل الاجتماعية (Social)', icon: 'bi-people', placeholder: 'التركيبة السكانية، الثقافة، التعليم، الوعي الصحي، أنماط الاستهلاك...' },
            { id: 'technological', label: 'العوامل التقنية (Technological)', icon: 'bi-cpu', placeholder: 'الابتكار، الأتمتة، البنية التحتية الرقمية، التحول الرقمي...' },
            { id: 'environmental', label: 'العوامل البيئية (Environmental)', icon: 'bi-tree', placeholder: 'التغير المناخي، الاستدامة، اللوائح البيئية، الطاقة المتجددة...' },
            { id: 'legal', label: 'العوامل القانونية (Legal)', icon: 'bi-shield-check', placeholder: 'قوانين العمل، حماية المستهلك، الملكية الفكرية، الضرائب...' },
        ],
        saveKey: 'PESTEL',
        nextUrl: '/tool-detail.html?code=PORTER'
    },
    PORTER: {
        title: 'تحليل القوى الخمس (Porter)',
        subtitle: 'افهم ديناميكيات المنافسة في قطاعك',
        icon: 'bi-shield-lock',
        color: '#f59e0b',
        phaseLabel: 'محطة التشخيص: بورتر',
        fields: [
            { id: 'new_entrants', label: 'تهديد الداخلين الجدد', icon: 'bi-box-arrow-in-right', placeholder: 'ما هي سهولة دخول منافسين جدد لمجال عملك؟' },
            { id: 'buyers', label: 'قوة المشترين (العملاء)', icon: 'bi-people', placeholder: 'ما مدى تأثير العملاء على قراراتك وأسعارك؟' },
            { id: 'suppliers', label: 'قوة الموردين', icon: 'bi-truck', placeholder: 'ما مدى سيطرة مزودي الخدمة أو المواد على مدخلاتك؟' },
            { id: 'substitutes', label: 'تهديد البدائل', icon: 'bi-arrow-repeat', placeholder: 'هل هناك تقنيات أو طرق بديلة قد تلغي الحاجة لمنتجك/خدمتك؟' },
            { id: 'rivalry', label: 'شدة المنافسة الحالية', icon: 'bi-fire', placeholder: 'كيف هي المنافسة الحالية؟ كم عدد المنافسين وما قوتهم؟', fullWidth: true },
        ],
        saveKey: 'PORTER',
        nextUrl: '/benchmarking.html'
    },
    VALUE_CHAIN: {
        title: 'سلسلة القيمة',
        subtitle: 'فكك عملياتك لاكتشاف أين تخلق القيمة وأين تهدر',
        icon: 'bi-link-45deg',
        color: '#0891B2',
        phaseLabel: 'محطة التشخيص: سلسلة القيمة',
        fields: [
            { id: 'inbound', label: 'اللوجستيات الواردة (Inbound)', icon: 'bi-box-seam', placeholder: 'استلام المواد الخام، التخزين، إدارة المخزون...' },
            { id: 'operations', label: 'العمليات (Operations)', icon: 'bi-gear', placeholder: 'التصنيع، التجميع، التعبئة، الاختبار، الصيانة...' },
            { id: 'outbound', label: 'اللوجستيات الصادرة (Outbound)', icon: 'bi-truck', placeholder: 'التوزيع، التسليم، معالجة الطلبات...' },
            { id: 'marketing_sales', label: 'التسويق والمبيعات', icon: 'bi-megaphone', placeholder: 'الإعلان، الترويج، قنوات البيع، التسعير...' },
            { id: 'service', label: 'خدمة ما بعد البيع', icon: 'bi-headset', placeholder: 'الضمان، الدعم الفني، التدريب، قطع الغيار...' },
            { id: 'support', label: 'الأنشطة المساندة', icon: 'bi-building', placeholder: 'البنية التحتية، الموارد البشرية، التقنية، المشتريات...', fullWidth: true },
        ],
        saveKey: 'VALUE_CHAIN',
        nextUrl: '/dept-deep.html'
    },
    CUSTOMER_JOURNEY: {
        title: 'خريطة رحلة العميل',
        subtitle: 'تتبع خطوات عميلك من الوعي للولاء',
        icon: 'bi-person-walking',
        color: '#DB2777',
        phaseLabel: 'محطة التشخيص: تجربة العميل',
        fields: [
            { id: 'awareness', label: 'مرحلة الوعي (Awareness)', icon: 'bi-eye', placeholder: 'كيف يعرف العميل عنك لأول مرة؟ القنوات، الإعلانات...' },
            { id: 'consideration', label: 'مرحلة التفكير (Consideration)', icon: 'bi-search', placeholder: 'ماذا يقارن العميل قبل القرار؟ المنافسين، الأسعار...' },
            { id: 'purchase', label: 'مرحلة الشراء (Purchase)', icon: 'bi-cart-check', placeholder: 'كيف تتم عملية الشراء؟ السهولة، العقبات...' },
            { id: 'experience', label: 'مرحلة الاستخدام (Experience)', icon: 'bi-star', placeholder: 'كيف يستخدم المنتج/الخدمة؟ نقاط الألم، لحظات السعادة...' },
            { id: 'loyalty', label: 'مرحلة الولاء (Loyalty)', icon: 'bi-heart', placeholder: 'هل يعود العميل؟ هل يوصي بك؟ برامج الولاء...', fullWidth: true },
        ],
        saveKey: 'CUSTOMER_JOURNEY',
        nextUrl: '/swot.html'  // آخر أداة تشخيص داخلي → التركيب
    },
    EISENHOWER: {
        title: 'مصفوفة أيزنهاور',
        subtitle: 'رتب أولوياتك حسب الأهمية والإلحاح',
        icon: 'bi-grid-3x3',
        color: '#9333ea',
        phaseLabel: 'أداة مساندة: ترتيب الأولويات',
        fields: [
            { id: 'urgent_important', label: 'عاجل ومهم — نفّذ فوراً', icon: 'bi-exclamation-triangle', placeholder: 'المهام الحرجة التي تحتاج تنفيذ فوري...' },
            { id: 'not_urgent_important', label: 'مهم وغير عاجل — خطط له', icon: 'bi-calendar-check', placeholder: 'المهام الاستراتيجية التي تحتاج تخطيط وجدولة...' },
            { id: 'urgent_not_important', label: 'عاجل وغير مهم — فوّض', icon: 'bi-people', placeholder: 'المهام التي يمكن تفويضها لشخص آخر...' },
            { id: 'not_urgent_not_important', label: 'غير عاجل وغير مهم — احذف', icon: 'bi-trash', placeholder: 'المهام التي يمكن التخلي عنها...' },
        ],
        saveKey: 'EISENHOWER',
        nextUrl: '/dashboard.html'
    },
    BUSINESS_MODEL: {
        title: 'نموذج الأعمال (Canvas)',
        subtitle: 'ارسم خريطة متكاملة لكيف تخلق القيمة وتحصل على العوائد',
        icon: 'bi-grid-1x2',
        color: '#0369a1',
        phaseLabel: 'محطة الاختيار: نموذج الأعمال',
        fields: [
            { id: 'value_proposition', label: 'القيمة المقترحة', icon: 'bi-gem', placeholder: 'ما القيمة الفريدة التي تقدمها لعملائك؟' },
            { id: 'customer_segments', label: 'شرائح العملاء', icon: 'bi-people', placeholder: 'من هم عملاؤك المستهدفون؟' },
            { id: 'channels', label: 'قنوات التوصيل', icon: 'bi-truck', placeholder: 'كيف تصل منتجاتك/خدماتك للعملاء؟' },
            { id: 'revenue_streams', label: 'مصادر الإيرادات', icon: 'bi-cash-stack', placeholder: 'من أين تأتي أموالك؟' },
            { id: 'key_resources', label: 'الموارد الرئيسية', icon: 'bi-box', placeholder: 'ما الموارد الأساسية التي تحتاجها؟' },
            { id: 'key_activities', label: 'الأنشطة الرئيسية', icon: 'bi-gear', placeholder: 'ما الأنشطة الأساسية لتشغيل نموذجك؟' },
            { id: 'key_partners', label: 'الشركاء الرئيسيون', icon: 'bi-people-fill', placeholder: 'من هم شركاؤك الأساسيون؟' },
            { id: 'cost_structure', label: 'هيكل التكاليف', icon: 'bi-calculator', placeholder: 'ما أكبر تكاليفك؟ ثابتة أم متغيرة؟' },
            { id: 'customer_relationships', label: 'علاقات العملاء', icon: 'bi-chat-heart', placeholder: 'كيف تبني وتحافظ على علاقتك بالعملاء؟' },
        ],
        saveKey: 'BUSINESS_MODEL',
        nextUrl: '/directions.html'
    },
    PARETO: {
        title: 'تحليل باريتو (80/20)',
        subtitle: '20% من الأسباب تنتج 80% من النتائج — اكتشف أين',
        icon: 'bi-funnel',
        color: '#ea580c',
        phaseLabel: 'أداة مساندة: تحليل باريتو',
        fields: [
            { id: 'top_20_revenue', label: 'أعلى 20% مصادر إيراد', icon: 'bi-graph-up-arrow', placeholder: 'ما المنتجات/الخدمات/العملاء الذين يولّدون 80% من إيراداتك؟' },
            { id: 'top_20_problems', label: 'أعلى 20% مشاكل', icon: 'bi-exclamation-triangle', placeholder: 'ما المشاكل القليلة التي تسبب معظم الخسائر أو الشكاوى؟' },
            { id: 'top_20_customers', label: 'أعلى 20% عملاء', icon: 'bi-people', placeholder: 'من هم العملاء القلائل الذين يمثلون معظم مبيعاتك؟' },
            { id: 'action_plan', label: 'خطة العمل', icon: 'bi-lightning', placeholder: 'بناءً على التحليل — ما الإجراءات ذات الأثر الأكبر؟', fullWidth: true },
        ],
        saveKey: 'PARETO',
        nextUrl: '/dashboard.html'
    },
    DIGITAL_READINESS: {
        title: 'تقييم الجاهزية الرقمية',
        subtitle: 'قيّم مستوى التحول الرقمي في منشأتك',
        icon: 'bi-pc-display',
        color: '#06b6d4',
        phaseLabel: 'أداة مساندة: التحول الرقمي',
        fields: [
            { id: 'infrastructure', label: 'البنية التحتية', icon: 'bi-hdd-network', placeholder: 'مستوى الأنظمة والشبكات والأجهزة...' },
            { id: 'processes', label: 'رقمنة العمليات', icon: 'bi-gear', placeholder: 'نسبة العمليات المؤتمتة vs اليدوية...' },
            { id: 'skills', label: 'المهارات الرقمية', icon: 'bi-person-badge', placeholder: 'مستوى الفريق في التعامل مع التقنية...' },
            { id: 'data', label: 'إدارة البيانات', icon: 'bi-database', placeholder: 'كيف تجمع وتحلل وتستخدم بياناتك؟' },
            { id: 'security', label: 'الأمن السيبراني', icon: 'bi-shield-lock', placeholder: 'مستوى حماية البيانات والأنظمة...' },
        ],
        saveKey: 'DIGITAL_READINESS',
        nextUrl: '/dashboard.html'
    },
    STRESS_TEST: {
        title: 'اختبار الضغط الاستراتيجي',
        subtitle: 'اختبر متانة خطتك ضد الصدمات المالية والتشغيلية',
        icon: 'bi-lightning-charge',
        color: '#ef4444',
        phaseLabel: 'أداة مساندة: اختبار الضغط',
        fields: [
            { id: 'revenue_drop', label: 'سيناريو انخفاض الإيرادات 30%', icon: 'bi-graph-down-arrow', placeholder: 'ماذا سيحدث لو انخفضت إيراداتك 30%؟ هل تصمد؟' },
            { id: 'key_person_loss', label: 'فقدان شخص رئيسي', icon: 'bi-person-x', placeholder: 'ماذا لو غادر أهم شخص في المنظمة فجأة؟' },
            { id: 'market_disruption', label: 'تحوّل جذري في السوق', icon: 'bi-tsunami', placeholder: 'ماذا لو دخل منافس بتقنية تغيّر قواعد اللعبة؟' },
            { id: 'supply_chain', label: 'انقطاع سلسلة التوريد', icon: 'bi-x-octagon', placeholder: 'ماذا لو توقف موردك الأساسي لمدة 3 شهور؟' },
            { id: 'mitigation', label: 'خطط التخفيف', icon: 'bi-shield-plus', placeholder: 'ما الإجراءات الاستباقية لمواجهة هذه السيناريوهات؟', fullWidth: true },
        ],
        saveKey: 'STRESS_TEST',
        nextUrl: '/risk-map.html'
    },
};
