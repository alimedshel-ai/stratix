/**
 * Startix — Department Deep Analysis Config
 * تعريف حقول التحليل الرقمي لكل قسم
 * صفحة واحدة ديناميكية بدل 11 صفحة مكررة
 */
window.DEPT_DEEP_CONFIG = {
    compliance: {
        title: 'التحليل الرقمي – الامتثال',
        emoji: '📋',
        color: '#ef4444',
        fields: [
            { name: 'licenses', label: 'عدد التراخيص والتصاريح النشطة', placeholder: 'مثال: 15' },
            { name: 'policy_compliance', label: 'نسبة الالتزام بالسياسات الداخلية (%)', placeholder: 'مثال: 85' },
            { name: 'violations', label: 'عدد المخالفات التنظيمية المسجلة', placeholder: 'مثال: 2' },
            { name: 'resolution_time', label: 'متوسط مدة حل المخالفات (أيام)', placeholder: 'مثال: 10' },
            { name: 'compliance_cost', label: 'تكلفة الامتثال السنوية (ريال)', placeholder: 'مثال: 80000' },
        ],
        redirect: '/compliance-audit.html?dept=compliance'
    },
    cs: {
        title: 'التحليل الرقمي – خدمة العملاء',
        emoji: '🎧',
        color: '#ec4899',
        fields: [
            { name: 'tickets_volume', label: 'حجم التذاكر والطلبات شهرياً', placeholder: 'مثال: 1000' },
            { name: 'resolution_time', label: 'متوسط وقت الحل (ساعات)', placeholder: 'مثال: 24' },
            { name: 'csat_score', label: 'نسبة رضا العملاء CSAT (%)', placeholder: 'مثال: 88' },
            { name: 'retention_rate', label: 'معدل الاحتفاظ بالعملاء (%)', placeholder: 'مثال: 92' },
            { name: 'first_contact_resolution', label: 'نسبة الحل من أول اتصال FCR (%)', placeholder: 'مثال: 75' },
        ],
        redirect: '/cs-audit.html?dept=cs'
    },
    finance: {
        title: 'التحليل الرقمي – المالية',
        emoji: '💰',
        color: '#f59e0b',
        fields: [
            { name: 'revenue', label: 'الإيرادات السنوية (ريال)', placeholder: 'مثال: 5000000' },
            { name: 'net_profit', label: 'صافي الربح (ريال)', placeholder: 'مثال: 750000' },
            { name: 'profit_margin', label: 'هامش الربح (%)', placeholder: 'مثال: 15', step: '0.1' },
            { name: 'current_ratio', label: 'نسبة السيولة (Current Ratio)', placeholder: 'مثال: 1.5', step: '0.1' },
            { name: 'debt_to_equity', label: 'نسبة الدين إلى حقوق الملكية', placeholder: 'مثال: 0.8', step: '0.1' },
        ],
        redirect: '/finance-audit.html?dept=finance'
    },
    governance: {
        title: 'التحليل الرقمي – الحوكمة',
        emoji: '🏛️',
        color: '#6366f1',
        fields: [
            { name: 'board_meetings', label: 'عدد اجتماعات مجلس الإدارة سنوياً', placeholder: 'مثال: 4' },
            { name: 'policy_updates', label: 'عدد السياسات المراجعة والمحدثة', placeholder: 'مثال: 5' },
            { name: 'risk_assessments', label: 'عدد تقييمات المخاطر المؤسسية المنفذة', placeholder: 'مثال: 2' },
            { name: 'audit_findings', label: 'عدد ملاحظات التدقيق المعلقة', placeholder: 'مثال: 8' },
            { name: 'training_hours', label: 'ساعات التدريب على الحوكمة للفريق', placeholder: 'مثال: 40' },
        ],
        redirect: '/governance-audit.html?dept=governance'
    },
    hr: {
        title: 'التحليل الرقمي – الموارد البشرية',
        emoji: '👥',
        color: '#10b981',
        fields: [
            { name: 'total_employees', label: 'إجمالي عدد الموظفين', placeholder: 'مثال: 150' },
            { name: 'turnover_rate', label: 'نسبة دوران الموظفين (%)', placeholder: 'مثال: 12', step: '0.1' },
            { name: 'training_hours', label: 'متوسط ساعات التدريب لكل موظف سنوياً', placeholder: 'مثال: 24' },
            { name: 'satisfaction_score', label: 'نسبة رضا الموظفين (%)', placeholder: 'مثال: 75' },
            { name: 'hr_cost_per_employee', label: 'تكلفة الموارد البشرية لكل موظف (ريال)', placeholder: 'مثال: 5000' },
        ],
        redirect: '/hr-audit.html?dept=hr'
    },
    it: {
        title: 'التحليل الرقمي – تقنية المعلومات',
        emoji: '💻',
        color: '#06b6d4',
        fields: [
            { name: 'it_budget', label: 'ميزانية تقنية المعلومات السنوية (ريال)', placeholder: 'مثال: 200000' },
            { name: 'system_uptime', label: 'نسبة توفر وجاهزية الأنظمة Uptime (%)', placeholder: 'مثال: 99.5', step: '0.1' },
            { name: 'tickets_resolved', label: 'عدد التذاكر التقنية المحلولة شهرياً', placeholder: 'مثال: 150' },
            { name: 'user_satisfaction', label: 'رضا المستخدمين عن الخدمات التقنية (%)', placeholder: 'مثال: 85' },
            { name: 'security_incidents', label: 'عدد الحوادث الأمنية المسجلة سنوياً', placeholder: 'مثال: 2' },
        ],
        redirect: '/it-audit.html?dept=it'
    },
    marketing: {
        title: 'التحليل الرقمي – التسويق',
        emoji: '📢',
        color: '#8b5cf6',
        fields: [
            { name: 'budget', label: 'الميزانية التسويقية السنوية (ريال)', placeholder: 'مثال: 500000' },
            { name: 'roi', label: 'نسبة العائد على الاستثمار التسويقي (%)', placeholder: 'مثال: 15', step: '0.1' },
            { name: 'new_customers', label: 'عدد العملاء الجدد شهرياً', placeholder: 'مثال: 200' },
            { name: 'brand_awareness', label: 'نسبة الوعي بالعلامة التجارية (%)', placeholder: 'مثال: 45' },
            { name: 'engagement_rate', label: 'معدل التفاعل على وسائل التواصل (%)', placeholder: 'مثال: 3.5', step: '0.1' },
        ],
        redirect: '/marketing-audit.html?dept=marketing'
    },
    operations: {
        title: 'التحليل الرقمي – العمليات',
        emoji: '⚙️',
        color: '#3b82f6',
        fields: [
            { name: 'process_efficiency', label: 'كفاءة العمليات (%)', placeholder: 'مثال: 85' },
            { name: 'defect_rate', label: 'نسبة الهدر والعيوب (%)', placeholder: 'مثال: 2.5', step: '0.1' },
            { name: 'cycle_time', label: 'زمن الدورة التشغيلية (أيام)', placeholder: 'مثال: 5' },
            { name: 'resource_utilization', label: 'استغلال الموارد (%)', placeholder: 'مثال: 78' },
            { name: 'on_time_delivery', label: 'نسبة التسليم في الوقت المحدد (%)', placeholder: 'مثال: 92' },
        ],
        redirect: '/operations-audit.html?dept=operations'
    },
    projects: {
        title: 'التحليل الرقمي – المشاريع',
        emoji: '📁',
        color: '#f97316',
        fields: [
            { name: 'active_projects', label: 'عدد المشاريع النشطة حالياً', placeholder: 'مثال: 12' },
            { name: 'on_time_rate', label: 'نسبة التسليم في الوقت المحدد (%)', placeholder: 'مثال: 85' },
            { name: 'on_budget_rate', label: 'نسبة الالتزام بميزانية المشاريع (%)', placeholder: 'مثال: 90' },
            { name: 'stakeholder_satisfaction', label: 'رضا أصحاب المصلحة عن المشاريع (%)', placeholder: 'مثال: 80' },
            { name: 'resource_utilization', label: 'استغلال موارد الفريق (%)', placeholder: 'مثال: 78' },
        ],
        redirect: '/projects-audit.html?dept=projects'
    },
    quality: {
        title: 'التحليل الرقمي – الجودة',
        emoji: '🏅',
        color: '#14b8a6',
        fields: [
            { name: 'audit_score', label: 'نتيجة آخر تدقيق داخلي (%)', placeholder: 'مثال: 85' },
            { name: 'nonconformities', label: 'عدد حالات عدم المطابقة', placeholder: 'مثال: 12' },
            { name: 'corrective_actions', label: 'عدد الإجراءات التصحيحية المفتوحة', placeholder: 'مثال: 8' },
            { name: 'quality_complaints', label: 'عدد شكاوى العملاء المتعلقة بالجودة شهرياً', placeholder: 'مثال: 5' },
            { name: 'quality_costs', label: 'تكلفة الجودة السنوية (ريال)', placeholder: 'مثال: 50000' },
        ],
        redirect: '/quality-audit.html?dept=quality'
    },
    sales: {
        title: 'التحليل الرقمي – المبيعات',
        emoji: '🎯',
        color: '#ef4444',
        fields: [
            { name: 'annual_sales', label: 'قيمة المبيعات السنوية (ريال)', placeholder: 'مثال: 3000000' },
            { name: 'active_customers', label: 'عدد العملاء النشطين', placeholder: 'مثال: 500' },
            { name: 'avg_deal_size', label: 'متوسط قيمة الصفقة (ريال)', placeholder: 'مثال: 6000' },
            { name: 'sales_cycle', label: 'دورة المبيعات (أيام)', placeholder: 'مثال: 30' },
            { name: 'win_rate', label: 'نسبة نجاح الصفقات (%)', placeholder: 'مثال: 25' },
        ],
        redirect: '/sales-audit.html?dept=sales'
    },
    support: {
        title: 'التحليل الرقمي – الخدمات المساندة',
        emoji: '🔧',
        color: '#64748b',
        fields: [
            { name: 'support_requests', label: 'عدد طلبات الدعم الداخلي شهرياً', placeholder: 'مثال: 300' },
            { name: 'response_time', label: 'متوسط وقت الاستجابة (ساعات)', placeholder: 'مثال: 4' },
            { name: 'resolution_time', label: 'متوسط وقت الحل الكامل (ساعات)', placeholder: 'مثال: 24' },
            { name: 'satisfaction_score', label: 'نسبة رضا المستخدمين الداخليين (%)', placeholder: 'مثال: 82' },
            { name: 'cost_per_ticket', label: 'تكلفة الطلب الواحد (ريال)', placeholder: 'مثال: 45' },
        ],
        redirect: '/support-audit.html?dept=support'
    },
};
