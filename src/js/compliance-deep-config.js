/**
 * Compliance Strategic Deep Analysis Configuration (نموذج هجين v3)
 * ============================================================
 * 44 سؤال أساسي (Core) ثابت + 7-12 سؤال سياقي حسب النشاط
 * مع فلترة حسب حجم المنشأة + نظام تقييم الخطورة (3 مستويات)
 * ============================================================
 */
window.COMPLIANCE_DEEP_CONFIG = (function () {

    // Priority labels with consistent aesthetics
    var PRIORITY_LABELS = {
        essential: { label: 'أساسي (Essential)', color: '#ef4444', emoji: '🚨' },
        important: { label: 'مهم (Important)', color: '#f59e0b', emoji: '🟠' },
        advanced:  { label: 'متقدم (Advanced)', color: '#6366f1', emoji: '🔵' },
        optional:  { label: 'اختياري (Optional)', color: '#94a3b8', emoji: '⚪' }
    };

    // ══════════════════════════════════════════════════════════
    // مستويات الخطورة — 3 فئات حسب الأثر القانوني والتشغيلي
    // ══════════════════════════════════════════════════════════
    var SEVERITY_TIERS = {
        1: { label: 'حرج', en: 'Critical', color: '#dc2626', bg: '#fef2f2', icon: '🔴', desc: 'إيقاف نشاط أو عقوبة جنائية' },
        2: { label: 'مهم', en: 'Important', color: '#f59e0b', bg: '#fffbeb', icon: '🟡', desc: 'غرامات مالية أو خلل تشغيلي' },
        3: { label: 'تحسيني', en: 'Improvement', color: '#3b82f6', bg: '#eff6ff', icon: '🔵', desc: 'أفضل الممارسات والتميز' }
    };

    // أنواع المخاطر
    var RISK_TYPES = {
        legal:       { label: 'قانوني', icon: '⚖️' },
        financial:   { label: 'مالي', icon: '💰' },
        operational: { label: 'تشغيلي', icon: '⚙️' },
        reputational:{ label: 'سمعة', icon: '📢' }
    };

    var SIZE_ORDER = ['micro', 'small', 'medium', 'large'];

    function sizeFromTeam(teamSize) {
        if (!teamSize) return 'small';
        var map = { micro: 'small', small: 'small', medium: 'medium', large: 'large' };
        return map[teamSize] || 'small';
    }

    // ══════════════════════════════════════════════════════════
    // severity = { tier, weight(1-10), minPct, warnPct, riskType, penalty, regulator }
    //   tier 1 = حرج: إيقاف/جنائي  |  tier 2 = مهم: غرامات  |  tier 3 = تحسيني
    //   minPct = الحد الأدنى المقبول (أقل = أحمر)
    //   warnPct = حد التنبيه (أقل = أصفر)
    //   yn questions: minPct/warnPct لا تنطبق (نعم=100, لا=0)
    // ══════════════════════════════════════════════════════════

    // ══════════════════════════════════════════════════════════
    // 1) الأسئلة الأساسية (Core) — 44 سؤال تنطبق على الجميع
    // ══════════════════════════════════════════════════════════
    var CORE_QUESTIONS = [
        // -- الحوكمة (4)
        { id: 'gov1', axis: 'governance', q: 'هل لديكم هيكل تنظيمي معتمد ومحدّث خلال آخر 12 شهر؟', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 6, minPct: 0, warnPct: 0, riskType: 'operational', penalty: 'ضعف تنظيمي يؤثر على القرارات', regulator: 'داخلي' } },

        { id: 'gov2', axis: 'governance', q: 'هل توجد سياسة معتمدة لتفويض الصلاحيات المالية والإدارية؟', sizeMin: 'small',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 5, minPct: 0, warnPct: 0, riskType: 'operational', penalty: 'تداخل صلاحيات واحتيال محتمل', regulator: 'داخلي' } },

        { id: 'gov3', axis: 'governance', q: 'هل يوجد مجلس إدارة أو لجنة تنفيذية تجتمع بانتظام؟', mode: 'pct', pctLabel: 'نسبة الانتظام في الاجتماعات', sizeMin: 'medium',
          priority: { small: 'optional', medium: 'important', large: 'essential' },
          severity: { tier: 3, weight: 3, minPct: 40, warnPct: 70, riskType: 'operational', penalty: 'ضعف الرقابة الإدارية', regulator: 'هيئة السوق المالية' } },

        { id: 'gov4', axis: 'governance', q: 'هل توجد لائحة حوكمة معتمدة ومنشورة داخلياً؟', sizeMin: 'medium',
          priority: { small: 'optional', medium: 'advanced', large: 'essential' },
          severity: { tier: 3, weight: 2, minPct: 0, warnPct: 0, riskType: 'reputational', penalty: 'ضعف الشفافية المؤسسية', regulator: 'وزارة التجارة' } },

        // -- الموارد البشرية (8)
        { id: 'hr1', axis: 'hr_labor', q: 'نسبة العقود المسجلة في منصة قوى', mode: 'pct', pctLabel: 'نسبة التسجيل', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 8, minPct: 80, warnPct: 95, riskType: 'legal', penalty: 'غرامة 10,000 ريال/عقد + إيقاف خدمات', regulator: 'وزارة الموارد البشرية' } },

        { id: 'hr2', axis: 'hr_labor', q: 'نسبة السعودة الحالية مقارنة بمتطلبات نطاقات', mode: 'pct', pctLabel: 'نسبة السعودة', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 10, minPct: 80, warnPct: 95, riskType: 'legal', penalty: 'حظر استقدام + إيقاف تأشيرات + نطاق أحمر', regulator: 'وزارة الموارد البشرية' } },

        { id: 'hr3', axis: 'hr_labor', q: 'نسبة الالتزام بسداد اشتراكات التأمينات في موعدها', mode: 'pct', pctLabel: 'نسبة الالتزام بالسداد', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 10, minPct: 90, warnPct: 100, riskType: 'financial', penalty: 'غرامة 2% شهرياً + إيقاف خدمات حكومية', regulator: 'التأمينات الاجتماعية' } },

        { id: 'hr4', axis: 'hr_labor', q: 'هل توجد لائحة تنظيم عمل معتمدة من الوزارة؟', sizeMin: 'small',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 6, minPct: 0, warnPct: 0, riskType: 'legal', penalty: 'غرامة حتى 10,000 ريال', regulator: 'وزارة الموارد البشرية' } },

        { id: 'hr5', axis: 'hr_labor', q: 'إقامات العمل (إجمالي وساري)', mode: 'count', countLabels: ['إجمالي الإقامات', 'الساري منها'], sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 9, minPct: 90, warnPct: 100, riskType: 'legal', penalty: 'ترحيل + غرامة 10,000 ريال/عامل + سجن', regulator: 'الجوازات' } },

        { id: 'hr6', axis: 'hr_labor', q: 'نسبة تغطية التأمين الصحي للموظفين وعائلاتهم', mode: 'pct', pctLabel: 'نسبة التغطية', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 9, minPct: 95, warnPct: 100, riskType: 'legal', penalty: 'غرامة 500 ريال/شخص/شهر + إيقاف خدمات', regulator: 'مجلس الضمان الصحي' } },

        { id: 'hr7', axis: 'hr_labor', q: 'رسوم الإقامات ورخص العمل المسدّدة في موعدها', mode: 'pct', pctLabel: 'نسبة الالتزام بالسداد', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 8, minPct: 90, warnPct: 100, riskType: 'financial', penalty: 'تراكم غرامات + إيقاف خدمات قوى', regulator: 'وزارة الموارد البشرية' } },

        { id: 'hr8', axis: 'hr_labor', q: 'نسبة الموظفين المسجّلين في نظام حماية الأجور (WPS)', mode: 'pct', pctLabel: 'نسبة التسجيل', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 9, minPct: 90, warnPct: 100, riskType: 'legal', penalty: 'إيقاف خدمات + نطاق أحمر', regulator: 'وزارة الموارد البشرية' } },

        // -- المالية والزكاة (4)
        { id: 'fin1', axis: 'finance_zakat', q: 'نسبة الالتزام بتقديم الإقرارات الزكوية/الضريبية في مواعيدها', mode: 'pct', pctLabel: 'نسبة الالتزام', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 10, minPct: 90, warnPct: 100, riskType: 'financial', penalty: 'غرامة 5-25% من الضريبة + حجز أرصدة', regulator: 'هيئة الزكاة والضريبة' } },

        { id: 'fin2', axis: 'finance_zakat', q: 'نسبة تفعيل الفوترة الإلكترونية (المرحلة الثانية)', mode: 'pct', pctLabel: 'نسبة التفعيل', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 9, minPct: 85, warnPct: 100, riskType: 'financial', penalty: 'غرامة تبدأ من 5,000 حتى 50,000 ريال', regulator: 'هيئة الزكاة والضريبة' } },

        { id: 'fin3', axis: 'finance_zakat', q: 'هل القوائم المالية مدققة من مكتب معتمد؟', sizeMin: 'small',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 6, minPct: 0, warnPct: 0, riskType: 'financial', penalty: 'رفض تمويل بنكي + مخالفة وزارة التجارة', regulator: 'وزارة التجارة' } },

        { id: 'fin4', axis: 'finance_zakat', q: 'هل توجد سياسة لمكافحة غسل الأموال (AML)؟', sizeMin: 'medium',
          priority: { small: 'optional', medium: 'important', large: 'essential' },
          severity: { tier: 2, weight: 5, minPct: 0, warnPct: 0, riskType: 'legal', penalty: 'عقوبات جنائية في حال ثبوت إهمال', regulator: 'البنك المركزي' } },

        // -- البيانات (4)
        { id: 'data1', axis: 'data_privacy', q: 'هل تم تعيين مسؤول حماية بيانات (DPO)؟', sizeMin: 'medium',
          priority: { small: 'optional', medium: 'important', large: 'essential' },
          severity: { tier: 3, weight: 4, minPct: 0, warnPct: 0, riskType: 'legal', penalty: 'مخالفة PDPL', regulator: 'سدايا' } },

        { id: 'data2', axis: 'data_privacy', q: 'هل توجد سياسة خصوصية منشورة ومتوافقة مع PDPL؟', sizeMin: 'micro',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 7, minPct: 0, warnPct: 0, riskType: 'legal', penalty: 'غرامة حتى 5 مليون ريال (PDPL)', regulator: 'سدايا' } },

        { id: 'data3', axis: 'data_privacy', q: 'نسبة البيانات المصنّفة حسب الحساسية', mode: 'pct', pctLabel: 'نسبة التصنيف', sizeMin: 'small',
          priority: { small: 'optional', medium: 'important', large: 'essential' },
          severity: { tier: 3, weight: 4, minPct: 30, warnPct: 60, riskType: 'operational', penalty: 'تسرب بيانات وعدم معرفة الأثر', regulator: 'سدايا' } },

        { id: 'data4', axis: 'data_privacy', q: 'نسبة جمع موافقات أصحاب البيانات بآلية معتمدة', mode: 'pct', pctLabel: 'نسبة التغطية', sizeMin: 'micro',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 6, minPct: 60, warnPct: 85, riskType: 'legal', penalty: 'مخالفة نظام حماية البيانات الشخصية', regulator: 'سدايا' } },

        // -- الأمن السيبراني (4)
        { id: 'cyber1', axis: 'cybersecurity', q: 'نسبة تغطية النسخ الاحتياطية الدورية والمُختبرة', mode: 'pct', pctLabel: 'نسبة التغطية', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 7, minPct: 70, warnPct: 90, riskType: 'operational', penalty: 'فقدان بيانات كامل + توقف أعمال', regulator: 'الهيئة الوطنية للأمن السيبراني' } },

        { id: 'cyber2', axis: 'cybersecurity', q: 'نسبة تفعيل المصادقة الثنائية (MFA) على الأنظمة الحرجة', mode: 'pct', pctLabel: 'نسبة التفعيل', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 6, minPct: 60, warnPct: 85, riskType: 'operational', penalty: 'اختراق أنظمة حرجة', regulator: 'الهيئة الوطنية للأمن السيبراني' } },

        { id: 'cyber3', axis: 'cybersecurity', q: 'هل توجد خطة استجابة للحوادث السيبرانية؟', sizeMin: 'small',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 5, minPct: 0, warnPct: 0, riskType: 'operational', penalty: 'عدم القدرة على الاستجابة للاختراق', regulator: 'الهيئة الوطنية للأمن السيبراني' } },

        { id: 'cyber4', axis: 'cybersecurity', q: 'هل تم إجراء فحص اختراق خلال آخر 12 شهر؟', sizeMin: 'medium',
          priority: { small: 'optional', medium: 'important', large: 'essential' },
          severity: { tier: 3, weight: 3, minPct: 0, warnPct: 0, riskType: 'operational', penalty: 'ثغرات غير مكتشفة', regulator: 'الهيئة الوطنية للأمن السيبراني' } },

        // -- التراخيص والشهادات (8)
        { id: 'lic1', axis: 'licenses', q: 'السجلات التجارية (رئيسية + فرعية)', mode: 'count', countLabels: ['إجمالي السجلات', 'الساري منها'], sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 10, minPct: 100, warnPct: 100, riskType: 'legal', penalty: 'إغلاق فوري + غرامة حتى 100,000 ريال', regulator: 'وزارة التجارة' } },

        { id: 'lic2', axis: 'licenses', q: 'رُخص البلدية (فروع ومناطق)', mode: 'count', countLabels: ['إجمالي الرخص', 'الساري منها'], sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 9, minPct: 90, warnPct: 100, riskType: 'legal', penalty: 'إغلاق الفرع + غرامة', regulator: 'البلدية' } },

        { id: 'lic3', axis: 'licenses', q: 'شهادات الدفاع المدني', mode: 'count', countLabels: ['إجمالي الشهادات', 'الساري منها'], sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 9, minPct: 90, warnPct: 100, riskType: 'legal', penalty: 'إغلاق + مسؤولية جنائية في حال حادث', regulator: 'الدفاع المدني' } },

        { id: 'lic4', axis: 'licenses', q: 'التراخيص القطاعية والمهنية والمتخصصة', mode: 'count', countLabels: ['إجمالي التراخيص', 'الساري منها'], sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 8, minPct: 85, warnPct: 100, riskType: 'legal', penalty: 'إيقاف نشاط قطاعي', regulator: 'الجهة القطاعية' } },

        { id: 'lic5', axis: 'licenses', q: 'شهادات الأيزو (ISO 9001, 14001, 45001, إلخ)', mode: 'count', countLabels: ['إجمالي الشهادات المطلوبة', 'الحاصل عليها'], sizeMin: 'small',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 5, minPct: 50, warnPct: 80, riskType: 'reputational', penalty: 'فقدان عقود حكومية وتنافسية', regulator: 'SASO / جهات الاعتماد' } },

        { id: 'lic6', axis: 'licenses', q: 'شهادات المطابقة والجودة (SASO / شهادات المؤامة)', mode: 'count', countLabels: ['إجمالي الشهادات المطلوبة', 'الساري منها'], sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 8, minPct: 85, warnPct: 100, riskType: 'legal', penalty: 'سحب منتجات + غرامات SASO', regulator: 'هيئة المواصفات SASO' } },

        { id: 'lic7', axis: 'licenses', q: 'شهادة الغرفة التجارية (سارية ومجدّدة)', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 7, minPct: 0, warnPct: 0, riskType: 'legal', penalty: 'إيقاف معاملات حكومية', regulator: 'الغرفة التجارية' } },

        { id: 'lic8', axis: 'licenses', q: 'شهادة الزكاة والدخل (سارية)', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 9, minPct: 0, warnPct: 0, riskType: 'financial', penalty: 'حجز أرصدة + إيقاف مناقصات حكومية', regulator: 'هيئة الزكاة والضريبة' } },

        // -- التأمين (4)
        { id: 'ins1', axis: 'insurance', q: 'تأمين المركبات (إجمالي وساري)', mode: 'count', countLabels: ['إجمالي المركبات', 'المؤمّن عليها'], sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 8, minPct: 90, warnPct: 100, riskType: 'legal', penalty: 'مخالفة مرورية + تحمل كامل أضرار الحوادث', regulator: 'المرور / البنك المركزي' } },

        { id: 'ins2', axis: 'insurance', q: 'تأمين الممتلكات والأصول الثابتة', sizeMin: 'small',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 6, minPct: 0, warnPct: 0, riskType: 'financial', penalty: 'خسائر مالية كارثية في حال حريق/كارثة', regulator: 'داخلي' } },

        { id: 'ins3', axis: 'insurance', q: 'تأمين المسؤولية تجاه الغير', sizeMin: 'small',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 5, minPct: 0, warnPct: 0, riskType: 'financial', penalty: 'تحمل تعويضات ضخمة في حال ضرر للغير', regulator: 'داخلي' } },

        { id: 'ins4', axis: 'insurance', q: 'نسبة تغطية وثائق التأمين للمخاطر التشغيلية', mode: 'pct', pctLabel: 'نسبة التغطية', sizeMin: 'medium',
          priority: { small: 'optional', medium: 'important', large: 'essential' },
          severity: { tier: 3, weight: 4, minPct: 40, warnPct: 70, riskType: 'financial', penalty: 'فجوة تأمينية في المخاطر التشغيلية', regulator: 'داخلي' } },

        // -- العقود (4)
        { id: 'con1', axis: 'contracts', q: 'نسبة العقود المستخدمة لقوالب موحّدة معتمدة قانونياً', mode: 'pct', pctLabel: 'نسبة التغطية', sizeMin: 'small',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 5, minPct: 50, warnPct: 75, riskType: 'legal', penalty: 'نزاعات قانونية مكلفة', regulator: 'داخلي' } },

        { id: 'con2', axis: 'contracts', q: 'نسبة الموردين الحرجين الموقّعين على اتفاقيات السرية (NDA)', mode: 'pct', pctLabel: 'نسبة التوقيع', sizeMin: 'small',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 5, minPct: 50, warnPct: 80, riskType: 'legal', penalty: 'تسرب معلومات حساسة', regulator: 'داخلي' } },

        { id: 'con3', axis: 'contracts', q: 'نسبة العقود المراجَعة قانونياً قبل التوقيع', mode: 'pct', pctLabel: 'نسبة المراجعة', sizeMin: 'medium',
          priority: { small: 'optional', medium: 'important', large: 'essential' },
          severity: { tier: 3, weight: 4, minPct: 40, warnPct: 70, riskType: 'legal', penalty: 'بنود غير عادلة أو ثغرات قانونية', regulator: 'داخلي' } },

        { id: 'con4', axis: 'contracts', q: 'هل يوجد سجل مركزي للعقود وتواريخ انتهائها؟', sizeMin: 'small',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 5, minPct: 0, warnPct: 0, riskType: 'operational', penalty: 'فوات تجديد عقود حرجة', regulator: 'داخلي' } },

        // -- التقارير (4)
        { id: 'rep1', axis: 'reporting', q: 'نسبة التقارير الدورية المقدّمة للجهات الرقابية في موعدها', mode: 'pct', pctLabel: 'نسبة الالتزام', sizeMin: 'micro',
          priority: { small: 'essential', medium: 'essential', large: 'essential' },
          severity: { tier: 1, weight: 8, minPct: 85, warnPct: 95, riskType: 'legal', penalty: 'غرامات تأخير + إجراءات تنظيمية', regulator: 'جهات رقابية متعددة' } },

        { id: 'rep2', axis: 'reporting', q: 'هل القوائم المالية تُنشر/تُقدَّم وفق المعايير السعودية؟', sizeMin: 'small',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 6, minPct: 0, warnPct: 0, riskType: 'financial', penalty: 'رفض تمويل + مخالفة وزارة التجارة', regulator: 'وزارة التجارة / SOCPA' } },

        { id: 'rep3', axis: 'reporting', q: 'هل توجد آلية لمتابعة المواعيد التنظيمية؟', sizeMin: 'small',
          priority: { small: 'important', medium: 'essential', large: 'essential' },
          severity: { tier: 2, weight: 6, minPct: 0, warnPct: 0, riskType: 'operational', penalty: 'فوات مواعيد وتراكم غرامات', regulator: 'داخلي' } },

        { id: 'rep4', axis: 'reporting', q: 'نسبة التقارير الإدارية الداخلية المنتظمة', mode: 'pct', pctLabel: 'نسبة الانتظام', sizeMin: 'medium',
          priority: { small: 'optional', medium: 'important', large: 'essential' },
          severity: { tier: 3, weight: 2, minPct: 30, warnPct: 60, riskType: 'operational', penalty: 'ضعف اتخاذ القرار الإداري', regulator: 'داخلي' } }
    ];

    // ══════════════════════════════════════════════════════════
    // 2) الأسئلة السياقية حسب النشاط
    // ══════════════════════════════════════════════════════════
    var CONTEXTUAL_QUESTIONS_BY_ACTIVITY = {
        industrial: [
            { id: 'ind1', axis: 'occupational_safety', q: 'نسبة العمال المزوّدين بمعدات الوقاية الشخصية المناسبة', mode: 'pct', pctLabel: 'نسبة التغطية', sizeMin: 'micro',
              priority: { small: 'essential', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 9, minPct: 90, warnPct: 100, riskType: 'legal', penalty: 'غرامة + مسؤولية جنائية عند إصابة', regulator: 'وزارة الموارد البشرية' } },

            { id: 'ind2', axis: 'occupational_safety', q: 'نسبة العاملين المدرَّبين على السلامة المهنية بشكل دوري', mode: 'pct', pctLabel: 'نسبة التدريب', sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 8, minPct: 70, warnPct: 90, riskType: 'legal', penalty: 'مسؤولية جنائية في حال حادث', regulator: 'وزارة الموارد البشرية' } },

            { id: 'ind3', axis: 'occupational_safety', q: 'هل توجد آلية موثّقة للتحقيق في حوادث العمل؟', sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 2, weight: 6, minPct: 0, warnPct: 0, riskType: 'legal', penalty: 'تكرار حوادث + مسؤولية قانونية', regulator: 'وزارة الموارد البشرية' } },

            { id: 'ind4', axis: 'environment', q: 'هل لديكم تصريح بيئي ساري من المركز الوطني للرقابة البيئية؟', sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 8, minPct: 0, warnPct: 0, riskType: 'legal', penalty: 'إيقاف نشاط + غرامة حتى 10 مليون ريال', regulator: 'المركز الوطني للرقابة البيئية' } },

            { id: 'ind5', axis: 'environment', q: 'نسبة الالتزام بقياس وتسجيل الانبعاثات والنفايات', mode: 'pct', pctLabel: 'نسبة الالتزام', sizeMin: 'medium',
              priority: { small: 'optional', medium: 'important', large: 'essential' },
              severity: { tier: 2, weight: 6, minPct: 50, warnPct: 80, riskType: 'legal', penalty: 'مخالفات بيئية + إيقاف مؤقت', regulator: 'المركز الوطني للرقابة البيئية' } },

            { id: 'ind6', axis: 'hazmat', q: 'نسبة المواد الكيميائية المخزّنة وفق الاشتراطات', mode: 'pct', pctLabel: 'نسبة الامتثال', sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 9, minPct: 85, warnPct: 95, riskType: 'legal', penalty: 'كارثة + مسؤولية جنائية + إغلاق', regulator: 'الدفاع المدني / البيئة' } },

            { id: 'ind7', axis: 'hazmat', q: 'نسبة توفّر بطاقات السلامة (MSDS) للمواد الخطرة', mode: 'pct', pctLabel: 'نسبة التوفّر', sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 7, minPct: 80, warnPct: 95, riskType: 'legal', penalty: 'مخالفة سلامة + خطر على العاملين', regulator: 'وزارة الموارد البشرية' } },

            { id: 'ind8', axis: 'product_quality', q: 'نسبة المنتجات المطابقة لمواصفات SASO', mode: 'pct', pctLabel: 'نسبة المطابقة', sizeMin: 'micro',
              priority: { small: 'essential', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 8, minPct: 85, warnPct: 95, riskType: 'legal', penalty: 'سحب منتجات + غرامات + حظر تصدير', regulator: 'SASO' } },

            { id: 'ind9', axis: 'product_quality', q: 'شهادات أيزو صناعية (ISO 9001 جودة / ISO 14001 بيئة / ISO 45001 سلامة)', mode: 'count', countLabels: ['المطلوبة للنشاط', 'الحاصل عليها'], sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 2, weight: 6, minPct: 50, warnPct: 80, riskType: 'reputational', penalty: 'خسارة عقود صناعية كبرى', regulator: 'جهات الاعتماد' } },

            { id: 'ind10', axis: 'occupational_safety', q: 'نسبة الفحوصات الطبية الدورية للعاملين في بيئات خطرة', mode: 'pct', pctLabel: 'نسبة التغطية', sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 7, minPct: 80, warnPct: 95, riskType: 'legal', penalty: 'مسؤولية أمراض مهنية + تعويضات', regulator: 'وزارة الموارد البشرية' } },

            { id: 'ind11', axis: 'environment', q: 'نسبة الالتزام بمعالجة النفايات الصناعية وفق الاشتراطات', mode: 'pct', pctLabel: 'نسبة الالتزام', sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 2, weight: 7, minPct: 60, warnPct: 85, riskType: 'legal', penalty: 'غرامات بيئية + تلويث', regulator: 'المركز الوطني للرقابة البيئية' } },

            { id: 'ind12', axis: 'occupational_safety', q: 'رخص تشغيل المعدات الثقيلة والرافعات (إجمالي/ساري)', mode: 'count', countLabels: ['إجمالي المعدات', 'المرخّصة منها'], sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 8, minPct: 90, warnPct: 100, riskType: 'legal', penalty: 'حادث + إيقاف + مسؤولية جنائية', regulator: 'الدفاع المدني' } }
        ],
        commercial: [
            { id: 'com1', axis: 'consumer_protection', q: 'هل سياسة الإرجاع والاستبدال معلنة وواضحة؟', sizeMin: 'micro',
              priority: { small: 'essential', medium: 'essential', large: 'essential' },
              severity: { tier: 2, weight: 6, minPct: 0, warnPct: 0, riskType: 'legal', penalty: 'شكاوى عملاء + غرامة وزارة التجارة', regulator: 'وزارة التجارة' } },

            { id: 'com2', axis: 'consumer_protection', q: 'هل توجد قناة موثّقة لاستقبال شكاوى العملاء؟', sizeMin: 'micro',
              priority: { small: 'essential', medium: 'essential', large: 'essential' },
              severity: { tier: 2, weight: 5, minPct: 0, warnPct: 0, riskType: 'reputational', penalty: 'تصعيد شكاوى لوزارة التجارة', regulator: 'وزارة التجارة' } },

            { id: 'com3', axis: 'consumer_protection', q: 'نسبة الالتزام بمصداقية الإعلانات والعروض الترويجية', mode: 'pct', pctLabel: 'نسبة الالتزام', sizeMin: 'micro',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 7, minPct: 80, warnPct: 95, riskType: 'legal', penalty: 'غرامة غش تجاري حتى 1,000,000 ريال', regulator: 'وزارة التجارة' } },

            { id: 'com4', axis: 'pricing_practices', q: 'نسبة المنتجات ذات الأسعار المعروضة بشكل واضح', mode: 'pct', pctLabel: 'نسبة التغطية', sizeMin: 'micro',
              priority: { small: 'essential', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 7, minPct: 85, warnPct: 95, riskType: 'legal', penalty: 'مخالفة نظام التسعير + غرامات', regulator: 'وزارة التجارة' } },

            { id: 'com5', axis: 'pricing_practices', q: 'هل تتجنّبون الممارسات الاحتكارية أو التواطؤ في الأسعار؟', sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 8, minPct: 0, warnPct: 0, riskType: 'legal', penalty: 'غرامة حتى 10% من الإيرادات', regulator: 'هيئة المنافسة' } },

            { id: 'com6', axis: 'trademarks_ip', q: 'نسبة العلامات التجارية المسجلة لدى الهيئة السعودية للملكية الفكرية', mode: 'pct', pctLabel: 'نسبة التسجيل', sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 2, weight: 5, minPct: 50, warnPct: 80, riskType: 'legal', penalty: 'فقدان حق العلامة + تقليد', regulator: 'SAIP' } },

            { id: 'com7', axis: 'ecommerce', q: 'هل المتجر الإلكتروني موثّق ومسجّل وفق نظام التجارة الإلكترونية؟', sizeMin: 'micro',
              priority: { small: 'essential', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 8, minPct: 0, warnPct: 0, riskType: 'legal', penalty: 'إغلاق المتجر + غرامة حتى 1,000,000 ريال', regulator: 'وزارة التجارة' } },

            { id: 'com8', axis: 'ecommerce', q: 'نسبة الالتزام بعرض كافة شروط البيع قبل إتمام الطلب', mode: 'pct', pctLabel: 'نسبة الالتزام', sizeMin: 'micro',
              priority: { small: 'essential', medium: 'essential', large: 'essential' },
              severity: { tier: 2, weight: 6, minPct: 70, warnPct: 90, riskType: 'legal', penalty: 'مخالفة نظام التجارة الإلكترونية', regulator: 'وزارة التجارة' } }
        ],
        service: [
            { id: 'srv1', axis: 'service_quality', q: 'نسبة العملاء المغطّين باتفاقيات مستوى خدمة (SLA) موثّقة', mode: 'pct', pctLabel: 'نسبة التغطية', sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 2, weight: 5, minPct: 50, warnPct: 80, riskType: 'operational', penalty: 'نزاعات عملاء + فقدان عقود', regulator: 'داخلي' } },

            { id: 'srv2', axis: 'service_quality', q: 'هل يتم قياس رضا العملاء بشكل دوري؟', sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 3, weight: 3, minPct: 0, warnPct: 0, riskType: 'reputational', penalty: 'عدم اكتشاف مشاكل الخدمة مبكراً', regulator: 'داخلي' } },

            { id: 'srv3', axis: 'service_quality', q: 'نسبة الالتزام بأوقات الاستجابة الموثّقة للعملاء', mode: 'pct', pctLabel: 'نسبة الالتزام', sizeMin: 'micro',
              priority: { small: 'essential', medium: 'essential', large: 'essential' },
              severity: { tier: 2, weight: 5, minPct: 60, warnPct: 85, riskType: 'operational', penalty: 'خسارة عملاء + سمعة سيئة', regulator: 'داخلي' } },

            { id: 'srv4', axis: 'customer_data', q: 'نسبة الموظفين الموقّعين على اتفاقيات سرّية بخصوص بيانات العملاء', mode: 'pct', pctLabel: 'نسبة التوقيع', sizeMin: 'micro',
              priority: { small: 'essential', medium: 'essential', large: 'essential' },
              severity: { tier: 2, weight: 6, minPct: 70, warnPct: 90, riskType: 'legal', penalty: 'مخالفة PDPL + دعاوى عملاء', regulator: 'سدايا' } },

            { id: 'srv5', axis: 'customer_data', q: 'نسبة الأنظمة المطبّقة لتقييد صلاحيات الوصول حسب الحاجة', mode: 'pct', pctLabel: 'نسبة التقييد', sizeMin: 'small',
              priority: { small: 'important', medium: 'essential', large: 'essential' },
              severity: { tier: 2, weight: 5, minPct: 50, warnPct: 80, riskType: 'operational', penalty: 'تسرب بيانات عملاء', regulator: 'داخلي' } },

            { id: 'srv6', axis: 'professional_licensing', q: 'نسبة الكوادر الفنية الحاملين للتراخيص المهنية اللازمة', mode: 'pct', pctLabel: 'نسبة الترخيص', sizeMin: 'micro',
              priority: { small: 'essential', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 8, minPct: 85, warnPct: 95, riskType: 'legal', penalty: 'ممارسة بدون ترخيص + إغلاق', regulator: 'الجهة المهنية' } },

            { id: 'srv7', axis: 'professional_licensing', q: 'نسبة التراخيص المهنية المجدّدة في مواعيدها', mode: 'pct', pctLabel: 'نسبة التجديد', sizeMin: 'micro',
              priority: { small: 'essential', medium: 'essential', large: 'essential' },
              severity: { tier: 1, weight: 7, minPct: 85, warnPct: 95, riskType: 'legal', penalty: 'إيقاف خدمات مهنية', regulator: 'الجهة المهنية' } }
        ]
    };

    // ══════════════════════════════════════════════════════════
    // 3) دالة البناء — حسب الحجم والنشاط
    // ══════════════════════════════════════════════════════════
    function buildDeepQuestions(activityType, enterpriseSize) {
        activityType = activityType || 'service';
        enterpriseSize = enterpriseSize || 'medium';
        var sizeIndex = SIZE_ORDER.indexOf(enterpriseSize);
        if (sizeIndex < 0) sizeIndex = 1;

        var filterBySize = function (q) {
            return SIZE_ORDER.indexOf(q.sizeMin) <= sizeIndex;
        };

        var coreFiltered = CORE_QUESTIONS.filter(filterBySize);
        var contextualFiltered = (CONTEXTUAL_QUESTIONS_BY_ACTIVITY[activityType] || []).filter(filterBySize);

        return {
            activity: activityType,
            size: enterpriseSize,
            coreQuestions: coreFiltered,
            contextualQuestions: contextualFiltered,
            allQuestions: coreFiltered.concat(contextualFiltered),
            totalCore: coreFiltered.length,
            totalContextual: contextualFiltered.length,
            grandTotal: coreFiltered.length + contextualFiltered.length
        };
    }

    // ══════════════════════════════════════════════════════════
    // Legacy compat — categories + getVisibleQuestions
    // ══════════════════════════════════════════════════════════

    function _buildCategories(questions) {
        var catMap = {};
        var catOrder = [];
        var axisIcons = {
            governance: 'bi-shield-shaded', hr_labor: 'bi-people-fill', finance_zakat: 'bi-cash-stack',
            data_privacy: 'bi-shield-lock', cybersecurity: 'bi-cpu-fill', licenses: 'bi-file-earmark-medical-fill',
            contracts: 'bi-file-bar-graph-fill', reporting: 'bi-file-bar-graph-fill', insurance: 'bi-shield-plus',
            occupational_safety: 'bi-exclamation-octagon-fill', environment: 'bi-tree',
            hazmat: 'bi-radioactive', product_quality: 'bi-patch-check',
            consumer_protection: 'bi-person-check', pricing_practices: 'bi-tags',
            trademarks_ip: 'bi-award', ecommerce: 'bi-cart3',
            service_quality: 'bi-star-half', customer_data: 'bi-database-lock',
            professional_licensing: 'bi-person-badge'
        };
        var axisNames = {
            governance: 'الحوكمة والقيادة', hr_labor: 'الموارد البشرية والعمل',
            finance_zakat: 'المالية والزكاة والضريبة', data_privacy: 'حماية البيانات والخصوصية',
            cybersecurity: 'الأمن السيبراني', licenses: 'التراخيص والاشتراطات',
            contracts: 'العقود والالتزامات', reporting: 'الإفصاح والتقارير', insurance: 'التأمين وإدارة المخاطر',
            occupational_safety: 'السلامة المهنية', environment: 'البيئة والاستدامة',
            hazmat: 'المواد الخطرة', product_quality: 'جودة المنتج',
            consumer_protection: 'حماية المستهلك', pricing_practices: 'الأسعار والممارسات',
            trademarks_ip: 'العلامات التجارية', ecommerce: 'التجارة الإلكترونية',
            service_quality: 'جودة الخدمة', customer_data: 'بيانات العملاء',
            professional_licensing: 'التراخيص المهنية'
        };

        questions.forEach(function (q) {
            var axisId = q.axis;
            if (!catMap[axisId]) {
                catMap[axisId] = {
                    id: axisId,
                    name: axisNames[axisId] || axisId,
                    icon: axisIcons[axisId] || 'bi-question-circle',
                    questions: []
                };
                catOrder.push(axisId);
            }
            catMap[axisId].questions.push({
                id: q.id,
                type: q.mode === 'count' ? 'count' : q.mode === 'pct' ? 'pct' : 'yes_no',
                pctLabel: q.pctLabel || '',
                countLabels: q.countLabels || [],
                text: q.q,
                tip: '',
                priority: q.priority || { small: 'important', medium: 'essential', large: 'essential' },
                severity: q.severity || null
            });
        });

        return catOrder.map(function (k) { return catMap[k]; });
    }

    // ── PUBLIC API ──
    return {
        PRIORITY_LABELS: PRIORITY_LABELS,
        SEVERITY_TIERS: SEVERITY_TIERS,
        RISK_TYPES: RISK_TYPES,
        sizeFromTeam: sizeFromTeam,
        SIZE_ORDER: SIZE_ORDER,

        // New hybrid API
        CORE_QUESTIONS: CORE_QUESTIONS,
        CONTEXTUAL_QUESTIONS_BY_ACTIVITY: CONTEXTUAL_QUESTIONS_BY_ACTIVITY,
        buildDeepQuestions: buildDeepQuestions,

        // Legacy compat
        get categories() {
            var built = buildDeepQuestions('service', 'large');
            return _buildCategories(built.allQuestions);
        },

        getCategoriesFor: function (activityType, size) {
            var built = buildDeepQuestions(activityType, size);
            return _buildCategories(built.allQuestions);
        },

        getVisibleQuestions: function (size, activityType) {
            var cats = activityType ? this.getCategoriesFor(activityType, size) : this.categories;
            var visible = [];
            var hidden = [];
            cats.forEach(function (cat) {
                var catVisible = { id: cat.id, name: cat.name, icon: cat.icon, questions: [] };
                var catHidden = { id: cat.id, name: cat.name, icon: cat.icon, questions: [] };
                cat.questions.forEach(function (q) {
                    var priority = (q.priority && q.priority[size]) || 'optional';
                    q.currentPriority = priority;
                    if (priority === 'essential' || priority === 'important') {
                        catVisible.questions.push(q);
                    } else {
                        catHidden.questions.push(q);
                    }
                });
                if (catVisible.questions.length > 0) {
                    visible.push(Object.assign({}, catVisible, { hiddenCount: catHidden.questions.length }));
                }
                if (catHidden.questions.length > 0) {
                    hidden.push(catHidden);
                }
            });
            return { visible: visible, hidden: hidden };
        },

        getStats: function (size, activityType) {
            var cats = activityType ? this.getCategoriesFor(activityType, size) : this.categories;
            var stats = { total: 0, essential: 0, important: 0, advanced: 0, optional: 0, visible: 0 };
            cats.forEach(function (cat) {
                cat.questions.forEach(function (q) {
                    stats.total++;
                    var p = (q.priority && q.priority[size]) || 'optional';
                    stats[p] = (stats[p] || 0) + 1;
                    if (p === 'essential' || p === 'important') stats.visible++;
                });
            });
            return stats;
        }
    };

})();
