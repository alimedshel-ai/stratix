// dept-config.js
export const ACTIVITIES = {
    // القطاعات الستة الأصلية + الجديدة
    service: [
        { v: 'consulting', i: '📋', n: 'استشارات إدارية' },
        { v: 'it_services', i: '💻', n: 'خدمات تقنية' },
        { v: 'marketing_agency', i: '📢', n: 'تسويق وإعلان' },
        { v: 'legal', i: '⚖️', n: 'خدمات قانونية' },
        { v: 'accounting', i: '📊', n: 'محاسبة وتدقيق' },
        { v: 'construction', i: '🚧', n: 'مقاولات بناء' },
    ],
    commercial: [
        { v: 'retail', i: '🏬', n: 'تجزئة (بيع بالتجزئة)' },
        { v: 'wholesale', i: '📦', n: 'جملة (بيع بالجملة)' },
        { v: 'ecommerce', i: '🛒', n: 'تجارة إلكترونية' },
        { v: 'franchise', i: '🏢', n: 'امتياز تجاري' },
    ],
    industrial: [
        { v: 'manufacturing', i: '🏭', n: 'صناعة تحويلية' },
        { v: 'mining', i: '⛏️', n: 'تعدين' },
        { v: 'energy', i: '⚡', n: 'طاقة' },
    ],
    gov: [
        { v: 'ministry', i: '🏛️', n: 'وزارة / هيئة حكومية' },
        { v: 'municipality', i: '🏙️', n: 'بلدية' },
        { v: 'public_agency', i: '📜', n: 'هيئة عامة' },
    ],
    sectoral: [
        { v: 'chamber', i: '🏢', n: 'غرفة تجارية' },
        { v: 'professional_assoc', i: '👥', n: 'جمعية مهنية' },
        { v: 'industry_group', i: '🏭', n: 'مجموعة صناعية' },
    ],
    non_profit: [
        { v: 'charity', i: '🤲', n: 'جمعية خيرية' },
        { v: 'foundation', i: '🎗️', n: 'مؤسسة غير ربحية' },
        { v: 'ngo', i: '🌍', n: 'منظمة مجتمع مدني' },
    ]
};

export const DEPT_LOGIC = {
    finance: {
        q8: { t: 'مدى اعتماد القسم على أدوات المحاسبة الإلكترونية؟', k: 'finance_tools', o: [{ v: 'full', i: '💻', n: 'أنظمة متكاملة (ERP)' }, { v: 'partial', i: '📊', n: 'برامج محاسبة أساسية' }, { v: 'none', i: '📝', n: 'دفاتر يدوية' }] },
        q9: { t: 'كم مرة تُعد التقارير المالية الدورية؟', k: 'finance_reports', o: [{ v: 'weekly', i: '📅', n: 'أسبوعياً' }, { v: 'monthly', i: '📆', n: 'شهرياً' }, { v: 'quarterly', i: '🗓️', n: 'ربع سنوي' }, { v: 'rarely', i: '⚠️', n: 'نادراً' }] },
        q10: { t: 'ما مدى دقة التوقعات المالية؟', k: 'finance_forecast', o: [{ v: 'high', i: '🎯', n: 'دقة عالية (>90%)' }, { v: 'medium', i: '📈', n: 'متوسطة (70-90%)' }, { v: 'low', i: '📉', n: 'منخفضة (<70%)' }] }
    },
    hr: {
        q8: { t: 'ما هي نسبة دوران الموظفين السنوية؟', k: 'hr_turnover', o: [{ v: 'low', i: '📉', n: 'أقل من 10%' }, { v: 'medium', i: '📊', n: '10-20%' }, { v: 'high', i: '📈', n: 'أكثر من 20%' }] },
        q9: { t: 'هل هناك خطط تطوير فردية للموظفين؟', k: 'hr_development', o: [{ v: 'yes', i: '✅', n: 'نعم' }, { v: 'partial', i: '🔄', n: 'جزئياً' }, { v: 'no', i: '❌', n: 'لا' }] },
        q10: { t: 'مدى جاهزية البدلاء للمناصب القيادية؟', k: 'hr_succession', o: [{ v: 'high', i: '🏆', n: 'جاهزية عالية' }, { v: 'medium', i: '⚖️', n: 'متوسطة' }, { v: 'low', i: '⚠️', n: 'ضعيفة' }] }
    },
    sales: {
        q8: { t: 'هل لديك نظام إدارة علاقات العملاء (CRM)؟', k: 'sales_crm', o: [{ v: 'advanced', i: '🚀', n: 'نظام متقدم' }, { v: 'basic', i: '📇', n: 'نظام بسيط' }, { v: 'none', i: '📝', n: 'لا يوجد' }] },
        q9: { t: 'ما هو متوسط دورة المبيعات؟', k: 'sales_cycle', o: [{ v: 'short', i: '⚡', n: 'أقل من أسبوع' }, { v: 'medium', i: '📅', n: 'أسبوع - شهر' }, { v: 'long', i: '🐢', n: 'أكثر من شهر' }] },
        q10: { t: 'نسبة الإغلاق (Conversion Rate) من العملاء المحتملين؟', k: 'sales_conversion', o: [{ v: 'high', i: '🎯', n: 'أكثر من 30%' }, { v: 'medium', i: '📊', n: '10-30%' }, { v: 'low', i: '📉', n: 'أقل من 10%' }] }
    },
    marketing: {
        q8: { t: 'ما هي قنوات التسويق الرئيسية؟', k: 'marketing_channels', o: [{ v: 'digital', i: '📱', n: 'رقمية (SEO, وسائل تواصل)' }, { v: 'traditional', i: '📺', n: 'تقليدية (تلفزيون، مطبوعات)' }, { v: 'mixed', i: '🔄', n: 'مزيج' }] },
        q9: { t: 'هل تقيس عائد الاستثمار التسويقي (ROMI)؟', k: 'marketing_romi', o: [{ v: 'yes', i: '✅', n: 'نعم بشكل منتظم' }, { v: 'partial', i: '🔄', n: 'أحياناً' }, { v: 'no', i: '❌', n: 'لا' }] },
        q10: { t: 'مدى تكامل التسويق مع المبيعات؟', k: 'marketing_sales', o: [{ v: 'high', i: '🤝', n: 'تكامل عالٍ' }, { v: 'medium', i: '⚖️', n: 'متوسط' }, { v: 'low', i: '🔀', n: 'ضعيف' }] }
    },
    operations: {
        q8: { t: 'هل تطبق منهجيات التحسين المستمر؟', k: 'ops_improvement', o: [{ v: 'lean', i: '📉', n: 'Lean / Six Sigma' }, { v: 'kaizen', i: '🔄', n: 'كايزن' }, { v: 'none', i: '⚠️', n: 'لا' }] },
        q9: { t: 'ما مدى أتمتة العمليات التشغيلية؟', k: 'ops_automation', o: [{ v: 'full', i: '🤖', n: 'أتمتة شاملة' }, { v: 'partial', i: '⚙️', n: 'جزئية' }, { v: 'manual', i: '📝', n: 'يدوية بالكامل' }] },
        q10: { t: 'مستوى الجودة (مثلاً نسبة العيوب)؟', k: 'ops_quality', o: [{ v: 'high', i: '✅', n: 'ممتاز (<1%)' }, { v: 'medium', i: '📊', n: 'مقبول (1-5%)' }, { v: 'low', i: '⚠️', n: 'ضعيف (>5%)' }] }
    },
    logistics: {
        q8: { t: 'نظام إدارة المستودعات (WMS)؟', k: 'logistics_wms', o: [{ v: 'advanced', i: '📦', n: 'نظام متقدم' }, { v: 'basic', i: '🗄️', n: 'نظام بسيط' }, { v: 'none', i: '📝', n: 'يدوي' }] },
        q9: { t: 'متوسط وقت التسليم للعميل؟', k: 'logistics_delivery', o: [{ v: 'same_day', i: '⚡', n: 'نفس اليوم' }, { v: 'next_day', i: '📅', n: 'اليوم التالي' }, { v: 'long', i: '🐢', n: 'أكثر من يومين' }] },
        q10: { t: 'نسبة تكلفة النقل إلى إجمالي التكاليف؟', k: 'logistics_cost', o: [{ v: 'low', i: '📉', n: 'أقل من 10%' }, { v: 'medium', i: '📊', n: '10-20%' }, { v: 'high', i: '📈', n: 'أكثر من 20%' }] }
    },
    governance: {
        q8: { t: 'هل لديك لجنة حوكمة مستقلة؟', k: 'gov_committee', o: [{ v: 'yes', i: '✅', n: 'نعم' }, { v: 'partial', i: '🔄', n: 'جزئياً' }, { v: 'no', i: '❌', n: 'لا' }] },
        q9: { t: 'مدى التزام القسم بالسياسات الداخلية؟', k: 'gov_compliance', o: [{ v: 'high', i: '🏆', n: 'التزام عالٍ' }, { v: 'medium', i: '⚖️', n: 'متوسط' }, { v: 'low', i: '⚠️', n: 'ضعيف' }] },
        q10: { t: 'هل تُجرى تقييمات مخاطر دورية؟', k: 'gov_risk', o: [{ v: 'quarterly', i: '📅', n: 'ربع سنوي' }, { v: 'annual', i: '🗓️', n: 'سنوي' }, { v: 'never', i: '❌', n: 'لا' }] }
    }
};
