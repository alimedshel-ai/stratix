/**
 * 🏭 Sector Configs Seed — بيانات 8 قطاعات مع أسئلة مخصصة + معادلات Break-Even
 * Usage: node prisma/seed-sector-configs.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SECTOR_CONFIGS = [
    // ═══════════════════════════════════════════
    // 1. المقاولات والبناء
    // ═══════════════════════════════════════════
    {
        code: 'CONSTRUCTION',
        nameAr: 'المقاولات والبناء',
        nameEn: 'Construction',
        icon: '🏗️',
        color: '#f59e0b',
        unitLabelAr: 'المشروع / المستخلص المالي',
        unitLabelEn: 'Project / Financial Statement',
        cfoQuestions: JSON.stringify({
            title: 'البيانات المالية — قطاع المقاولات',
            description: 'أدخل البيانات المالية لشركتك في قطاع المقاولات والبناء',
            icon: '💰',
            sections: [
                {
                    title: 'المصاريف الثابتة (السنوية)',
                    questions: [
                        { id: 'hq_salaries', label: 'رواتب الإدارة المركزية', type: 'number', unit: 'ريال/شهر', placeholder: '200000', hint: 'إجمالي رواتب المكتب الرئيسي (إدارة، محاسبة، مشتريات)' },
                        { id: 'office_rent', label: 'إيجار المكاتب والمستودعات', type: 'number', unit: 'ريال/سنة', placeholder: '240000', hint: 'إيجار المقر الرئيسي + أي مستودعات' },
                        { id: 'annual_licenses', label: 'تراخيص واشتراكات سنوية', type: 'number', unit: 'ريال/سنة', placeholder: '60000', hint: 'تراخيص بلدية، تأمينات، اشتراكات مهنية' },
                        { id: 'equipment_depreciation', label: 'إهلاك المعدات والآليات', type: 'number', unit: 'ريال/سنة', placeholder: '150000', hint: 'القسط السنوي لإهلاك المعدات المملوكة' },
                    ]
                },
                {
                    title: 'بيانات المشاريع',
                    questions: [
                        { id: 'avg_project_value', label: 'متوسط قيمة المشروع', type: 'number', unit: 'ريال', placeholder: '4500000', hint: 'متوسط قيمة العقود التي تنفذها' },
                        { id: 'annual_projects', label: 'عدد المشاريع المنفذة سنوياً', type: 'number', unit: 'مشروع', placeholder: '6', hint: 'العدد الفعلي أو المتوقع' },
                        { id: 'avg_project_duration', label: 'متوسط مدة المشروع', type: 'select', options: ['أقل من 3 أشهر', '3-6 أشهر', '6-12 شهر', 'أكثر من 12 شهر'], hint: 'من التعاقد حتى التسليم النهائي' },
                    ]
                },
                {
                    title: 'التكاليف المتغيرة (% من قيمة المشروع)',
                    questions: [
                        { id: 'materials_pct', label: 'مواد البناء المباشرة', type: 'percent', unit: '%', placeholder: '45', hint: 'حديد، إسمنت، رمل، بلاط... كنسبة من العقد' },
                        { id: 'subcontractor_pct', label: 'مقاولي الباطن', type: 'percent', unit: '%', placeholder: '20', hint: 'كهرباء، سباكة، تكييف... كنسبة من العقد' },
                        { id: 'labor_pct', label: 'أجور العمالة اليومية/المؤقتة', type: 'percent', unit: '%', placeholder: '12', hint: 'عمال الموقع غير الدائمين' },
                        { id: 'site_expenses_pct', label: 'مصاريف الموقع', type: 'percent', unit: '%', placeholder: '5', hint: 'نقل، تخزين، حراسة، سلامة' },
                    ]
                }
            ]
        }),
        formulas: JSON.stringify({
            fixedCosts: '(hq_salaries * 12) + office_rent + annual_licenses + equipment_depreciation',
            variableCostPct: 'materials_pct + subcontractor_pct + labor_pct + site_expenses_pct',
            contributionMarginPct: '100 - variableCostPct',
            breakEvenRevenue: 'fixedCosts / (contributionMarginPct / 100)',
            breakEvenUnits: 'breakEvenRevenue / avg_project_value',
            annualRevenue: 'avg_project_value * annual_projects',
            safetyMargin: '((annualRevenue - breakEvenRevenue) / annualRevenue) * 100'
        }),
        benchmarks: JSON.stringify({
            materials_pct: { avg: 45, good: 40, bad: 55 },
            subcontractor_pct: { avg: 20, good: 15, bad: 30 },
            labor_pct: { avg: 12, good: 10, bad: 18 },
            contributionMarginPct: { avg: 23, good: 30, bad: 15 },
            safetyMargin: { avg: 20, good: 30, bad: 10 }
        }),
        breakEvenFields: JSON.stringify(['hq_salaries', 'office_rent', 'annual_licenses', 'equipment_depreciation', 'avg_project_value', 'annual_projects', 'materials_pct', 'subcontractor_pct', 'labor_pct', 'site_expenses_pct']),
    },

    // ═══════════════════════════════════════════
    // 2. المطاعم والأغذية
    // ═══════════════════════════════════════════
    {
        code: 'RESTAURANT',
        nameAr: 'المطاعم والأغذية',
        nameEn: 'Restaurant & Food',
        icon: '🍽️',
        color: '#ef4444',
        unitLabelAr: 'الطلب / الكوفر',
        unitLabelEn: 'Order / Cover',
        cfoQuestions: JSON.stringify({
            title: 'البيانات المالية — قطاع المطاعم',
            description: 'أدخل البيانات المالية لمطعمك أو سلسلة مطاعمك',
            icon: '💰',
            sections: [
                {
                    title: 'المصاريف الثابتة (الشهرية)',
                    questions: [
                        { id: 'monthly_rent', label: 'الإيجار الشهري', type: 'number', unit: 'ريال/شهر', placeholder: '30000', hint: 'إيجار الموقع الرئيسي' },
                        { id: 'staff_salaries', label: 'رواتب الموظفين', type: 'number', unit: 'ريال/شهر', placeholder: '45000', hint: 'طباخين، كاشير، عمال نظافة، إدارة' },
                        { id: 'utilities', label: 'كهرباء وماء وغاز', type: 'number', unit: 'ريال/شهر', placeholder: '8000', hint: 'المرافق الشهرية' },
                        { id: 'monthly_licenses', label: 'تراخيص واشتراكات', type: 'number', unit: 'ريال/شهر', placeholder: '3000', hint: 'بلدية، صحة، نظام كاشير، توصيل' },
                    ]
                },
                {
                    title: 'بيانات المبيعات',
                    questions: [
                        { id: 'avg_order_value', label: 'متوسط قيمة الطلب', type: 'number', unit: 'ريال', placeholder: '65', hint: 'المتوسط لكل فاتورة' },
                        { id: 'daily_orders', label: 'عدد الطلبات اليومية', type: 'number', unit: 'طلب', placeholder: '120', hint: 'المتوسط اليومي (داين + تيك أواي + توصيل)' },
                    ]
                },
                {
                    title: 'التكاليف المتغيرة (% من المبيعات)',
                    questions: [
                        { id: 'food_cost_pct', label: 'تكلفة المواد الغذائية', type: 'percent', unit: '%', placeholder: '32', hint: 'Food Cost — كنسبة من الإيرادات' },
                        { id: 'packaging_pct', label: 'تغليف وأكياس', type: 'percent', unit: '%', placeholder: '3', hint: 'للطلبات الخارجية والتوصيل' },
                        { id: 'delivery_commission_pct', label: 'عمولات التوصيل', type: 'percent', unit: '%', placeholder: '12', hint: 'هنقرستيشن، جاهز، مرسول...' },
                    ]
                }
            ]
        }),
        formulas: JSON.stringify({
            fixedCosts: '(monthly_rent + staff_salaries + utilities + monthly_licenses) * 12',
            variableCostPct: 'food_cost_pct + packaging_pct + delivery_commission_pct',
            contributionMarginPct: '100 - variableCostPct',
            breakEvenRevenue: 'fixedCosts / (contributionMarginPct / 100)',
            dailyRevenue: 'avg_order_value * daily_orders',
            annualRevenue: 'dailyRevenue * 365',
            breakEvenDailyOrders: 'breakEvenRevenue / (avg_order_value * 365)',
            breakEvenUnits: 'breakEvenRevenue / avg_order_value',
            safetyMargin: '((annualRevenue - breakEvenRevenue) / annualRevenue) * 100'
        }),
        benchmarks: JSON.stringify({
            food_cost_pct: { avg: 32, good: 28, bad: 38 },
            delivery_commission_pct: { avg: 15, good: 10, bad: 20 },
            contributionMarginPct: { avg: 53, good: 60, bad: 45 },
        }),
        breakEvenFields: JSON.stringify(['monthly_rent', 'staff_salaries', 'utilities', 'monthly_licenses', 'avg_order_value', 'daily_orders', 'food_cost_pct', 'packaging_pct', 'delivery_commission_pct']),
    },

    // ═══════════════════════════════════════════
    // 3. التجزئة
    // ═══════════════════════════════════════════
    {
        code: 'RETAIL',
        nameAr: 'تجارة التجزئة',
        nameEn: 'Retail',
        icon: '🛒',
        color: '#8b5cf6',
        unitLabelAr: 'المنتج / الفاتورة',
        unitLabelEn: 'Product / Invoice',
        cfoQuestions: JSON.stringify({
            title: 'البيانات المالية — تجارة التجزئة',
            description: 'أدخل البيانات المالية لمتجرك أو سلسلة متاجرك',
            icon: '💰',
            sections: [
                {
                    title: 'المصاريف الثابتة',
                    questions: [
                        { id: 'monthly_rent', label: 'إيجار المحل/المعرض', type: 'number', unit: 'ريال/شهر', placeholder: '25000' },
                        { id: 'staff_salaries', label: 'رواتب الموظفين', type: 'number', unit: 'ريال/شهر', placeholder: '35000' },
                        { id: 'utilities_marketing', label: 'مرافق + تسويق ثابت', type: 'number', unit: 'ريال/شهر', placeholder: '10000' },
                    ]
                },
                {
                    title: 'بيانات المبيعات',
                    questions: [
                        { id: 'avg_transaction', label: 'متوسط الفاتورة', type: 'number', unit: 'ريال', placeholder: '180' },
                        { id: 'daily_transactions', label: 'عدد المعاملات اليومية', type: 'number', unit: 'معاملة', placeholder: '60' },
                    ]
                },
                {
                    title: 'التكاليف المتغيرة',
                    questions: [
                        { id: 'cogs_pct', label: 'تكلفة البضاعة المباعة', type: 'percent', unit: '%', placeholder: '60', hint: 'سعر الشراء كنسبة من سعر البيع' },
                        { id: 'shrinkage_pct', label: 'هدر وتالف', type: 'percent', unit: '%', placeholder: '3' },
                    ]
                }
            ]
        }),
        formulas: JSON.stringify({
            fixedCosts: '(monthly_rent + staff_salaries + utilities_marketing) * 12',
            variableCostPct: 'cogs_pct + shrinkage_pct',
            contributionMarginPct: '100 - variableCostPct',
            breakEvenRevenue: 'fixedCosts / (contributionMarginPct / 100)',
            annualRevenue: 'avg_transaction * daily_transactions * 365',
            breakEvenUnits: 'breakEvenRevenue / avg_transaction',
            safetyMargin: '((annualRevenue - breakEvenRevenue) / annualRevenue) * 100'
        }),
        benchmarks: JSON.stringify({
            cogs_pct: { avg: 60, good: 55, bad: 70 },
            contributionMarginPct: { avg: 37, good: 42, bad: 28 },
        }),
        breakEvenFields: JSON.stringify(['monthly_rent', 'staff_salaries', 'utilities_marketing', 'avg_transaction', 'daily_transactions', 'cogs_pct', 'shrinkage_pct']),
    },

    // ═══════════════════════════════════════════
    // 4. التصنيع
    // ═══════════════════════════════════════════
    {
        code: 'MANUFACTURING',
        nameAr: 'التصنيع',
        nameEn: 'Manufacturing',
        icon: '🏭',
        color: '#3b82f6',
        unitLabelAr: 'الوحدة المنتجة',
        unitLabelEn: 'Unit Produced',
        cfoQuestions: JSON.stringify({
            title: 'البيانات المالية — قطاع التصنيع',
            description: 'أدخل بيانات مصنعك أو خط الإنتاج',
            icon: '💰',
            sections: [
                {
                    title: 'المصاريف الثابتة',
                    questions: [
                        { id: 'factory_rent', label: 'إيجار المصنع', type: 'number', unit: 'ريال/شهر', placeholder: '50000' },
                        { id: 'admin_salaries', label: 'رواتب الإدارة', type: 'number', unit: 'ريال/شهر', placeholder: '80000' },
                        { id: 'equipment_cost', label: 'إهلاك معدات + صيانة', type: 'number', unit: 'ريال/شهر', placeholder: '25000' },
                    ]
                },
                {
                    title: 'بيانات الإنتاج',
                    questions: [
                        { id: 'unit_price', label: 'سعر بيع الوحدة', type: 'number', unit: 'ريال', placeholder: '50' },
                        { id: 'monthly_production', label: 'الإنتاج الشهري', type: 'number', unit: 'وحدة', placeholder: '10000' },
                    ]
                },
                {
                    title: 'التكاليف المتغيرة',
                    questions: [
                        { id: 'raw_materials_pct', label: 'مواد خام', type: 'percent', unit: '%', placeholder: '40' },
                        { id: 'direct_labor_pct', label: 'عمالة مباشرة', type: 'percent', unit: '%', placeholder: '15' },
                        { id: 'energy_pct', label: 'طاقة وكهرباء إنتاج', type: 'percent', unit: '%', placeholder: '8' },
                    ]
                }
            ]
        }),
        formulas: JSON.stringify({
            fixedCosts: '(factory_rent + admin_salaries + equipment_cost) * 12',
            variableCostPct: 'raw_materials_pct + direct_labor_pct + energy_pct',
            contributionMarginPct: '100 - variableCostPct',
            breakEvenRevenue: 'fixedCosts / (contributionMarginPct / 100)',
            annualRevenue: 'unit_price * monthly_production * 12',
            breakEvenUnits: 'breakEvenRevenue / unit_price',
            safetyMargin: '((annualRevenue - breakEvenRevenue) / annualRevenue) * 100'
        }),
        benchmarks: JSON.stringify({
            raw_materials_pct: { avg: 40, good: 35, bad: 50 },
            contributionMarginPct: { avg: 37, good: 45, bad: 28 },
        }),
        breakEvenFields: JSON.stringify(['factory_rent', 'admin_salaries', 'equipment_cost', 'unit_price', 'monthly_production', 'raw_materials_pct', 'direct_labor_pct', 'energy_pct']),
    },

    // ═══════════════════════════════════════════
    // 5. التجارة الإلكترونية
    // ═══════════════════════════════════════════
    {
        code: 'ECOMMERCE',
        nameAr: 'التجارة الإلكترونية',
        nameEn: 'E-Commerce',
        icon: '🛍️',
        color: '#ec4899',
        unitLabelAr: 'الطلب الإلكتروني',
        unitLabelEn: 'Online Order',
        cfoQuestions: JSON.stringify({
            title: 'البيانات المالية — التجارة الإلكترونية',
            description: 'أدخل بيانات متجرك الإلكتروني',
            icon: '💰',
            sections: [
                {
                    title: 'المصاريف الثابتة',
                    questions: [
                        { id: 'platform_cost', label: 'منصة + استضافة', type: 'number', unit: 'ريال/شهر', placeholder: '5000', hint: 'سلة، زد، شوبيفاي...' },
                        { id: 'team_salaries', label: 'رواتب الفريق', type: 'number', unit: 'ريال/شهر', placeholder: '30000' },
                        { id: 'marketing_fixed', label: 'تسويق ثابت (SEO/محتوى)', type: 'number', unit: 'ريال/شهر', placeholder: '8000' },
                        { id: 'warehouse_cost', label: 'مستودع + تخزين', type: 'number', unit: 'ريال/شهر', placeholder: '6000' },
                    ]
                },
                {
                    title: 'بيانات المبيعات',
                    questions: [
                        { id: 'avg_order_value', label: 'متوسط قيمة الطلب (AOV)', type: 'number', unit: 'ريال', placeholder: '220' },
                        { id: 'monthly_orders', label: 'عدد الطلبات الشهرية', type: 'number', unit: 'طلب', placeholder: '500' },
                    ]
                },
                {
                    title: 'التكاليف المتغيرة',
                    questions: [
                        { id: 'cogs_pct', label: 'تكلفة المنتج', type: 'percent', unit: '%', placeholder: '50' },
                        { id: 'shipping_pct', label: 'شحن وتوصيل', type: 'percent', unit: '%', placeholder: '8' },
                        { id: 'payment_pct', label: 'عمولة دفع إلكتروني', type: 'percent', unit: '%', placeholder: '3' },
                        { id: 'ads_pct', label: 'إعلانات مدفوعة (متغيرة)', type: 'percent', unit: '%', placeholder: '12' },
                        { id: 'returns_pct', label: 'مرتجعات', type: 'percent', unit: '%', placeholder: '5' },
                    ]
                }
            ]
        }),
        formulas: JSON.stringify({
            fixedCosts: '(platform_cost + team_salaries + marketing_fixed + warehouse_cost) * 12',
            variableCostPct: 'cogs_pct + shipping_pct + payment_pct + ads_pct + returns_pct',
            contributionMarginPct: '100 - variableCostPct',
            breakEvenRevenue: 'fixedCosts / (contributionMarginPct / 100)',
            annualRevenue: 'avg_order_value * monthly_orders * 12',
            breakEvenUnits: 'breakEvenRevenue / avg_order_value',
            safetyMargin: '((annualRevenue - breakEvenRevenue) / annualRevenue) * 100'
        }),
        benchmarks: JSON.stringify({
            cogs_pct: { avg: 50, good: 45, bad: 60 },
            shipping_pct: { avg: 8, good: 5, bad: 12 },
            returns_pct: { avg: 5, good: 3, bad: 10 },
            contributionMarginPct: { avg: 22, good: 30, bad: 15 },
        }),
        breakEvenFields: JSON.stringify(['platform_cost', 'team_salaries', 'marketing_fixed', 'warehouse_cost', 'avg_order_value', 'monthly_orders', 'cogs_pct', 'shipping_pct', 'payment_pct', 'ads_pct', 'returns_pct']),
    },

    // ═══════════════════════════════════════════
    // 6. الرعاية الصحية
    // ═══════════════════════════════════════════
    {
        code: 'HEALTHCARE',
        nameAr: 'الرعاية الصحية',
        nameEn: 'Healthcare',
        icon: '🏥',
        color: '#10b981',
        unitLabelAr: 'الحجز / الزيارة',
        unitLabelEn: 'Appointment / Visit',
        cfoQuestions: JSON.stringify({
            title: 'البيانات المالية — القطاع الصحي',
            description: 'أدخل بيانات العيادة أو المستشفى',
            icon: '💰',
            sections: [
                {
                    title: 'المصاريف الثابتة',
                    questions: [
                        { id: 'clinic_rent', label: 'إيجار العيادة/المركز', type: 'number', unit: 'ريال/شهر', placeholder: '40000' },
                        { id: 'medical_staff', label: 'رواتب الكادر الطبي', type: 'number', unit: 'ريال/شهر', placeholder: '120000' },
                        { id: 'admin_staff', label: 'رواتب الإدارة', type: 'number', unit: 'ريال/شهر', placeholder: '30000' },
                        { id: 'insurance_licenses', label: 'تأمين + تراخيص', type: 'number', unit: 'ريال/شهر', placeholder: '15000' },
                    ]
                },
                {
                    title: 'بيانات المرضى',
                    questions: [
                        { id: 'avg_visit_value', label: 'متوسط قيمة الزيارة', type: 'number', unit: 'ريال', placeholder: '350' },
                        { id: 'daily_patients', label: 'عدد المرضى اليومي', type: 'number', unit: 'مريض', placeholder: '40' },
                    ]
                },
                {
                    title: 'التكاليف المتغيرة',
                    questions: [
                        { id: 'medical_supplies_pct', label: 'مستلزمات طبية', type: 'percent', unit: '%', placeholder: '15' },
                        { id: 'lab_cost_pct', label: 'فحوصات ومختبر', type: 'percent', unit: '%', placeholder: '10' },
                        { id: 'insurance_discount_pct', label: 'خصومات التأمين', type: 'percent', unit: '%', placeholder: '20' },
                    ]
                }
            ]
        }),
        formulas: JSON.stringify({
            fixedCosts: '(clinic_rent + medical_staff + admin_staff + insurance_licenses) * 12',
            variableCostPct: 'medical_supplies_pct + lab_cost_pct + insurance_discount_pct',
            contributionMarginPct: '100 - variableCostPct',
            breakEvenRevenue: 'fixedCosts / (contributionMarginPct / 100)',
            annualRevenue: 'avg_visit_value * daily_patients * 300',
            breakEvenUnits: 'breakEvenRevenue / avg_visit_value',
            safetyMargin: '((annualRevenue - breakEvenRevenue) / annualRevenue) * 100'
        }),
        benchmarks: JSON.stringify({
            medical_supplies_pct: { avg: 15, good: 12, bad: 20 },
            insurance_discount_pct: { avg: 20, good: 15, bad: 30 },
            contributionMarginPct: { avg: 55, good: 65, bad: 45 },
        }),
        breakEvenFields: JSON.stringify(['clinic_rent', 'medical_staff', 'admin_staff', 'insurance_licenses', 'avg_visit_value', 'daily_patients', 'medical_supplies_pct', 'lab_cost_pct', 'insurance_discount_pct']),
    },

    // ═══════════════════════════════════════════
    // 7. التقنية والسوفتوير
    // ═══════════════════════════════════════════
    {
        code: 'TECH',
        nameAr: 'التقنية والبرمجيات',
        nameEn: 'Technology & Software',
        icon: '💻',
        color: '#06b6d4',
        unitLabelAr: 'الاشتراك / المشروع',
        unitLabelEn: 'Subscription / Project',
        cfoQuestions: JSON.stringify({
            title: 'البيانات المالية — قطاع التقنية',
            description: 'أدخل بيانات شركتك التقنية (SaaS، خدمات، تطوير)',
            icon: '💰',
            sections: [
                {
                    title: 'المصاريف الثابتة',
                    questions: [
                        { id: 'team_salaries', label: 'رواتب الفريق', type: 'number', unit: 'ريال/شهر', placeholder: '150000', hint: 'مطورين، مصممين، إدارة' },
                        { id: 'cloud_infra', label: 'بنية تحتية سحابية', type: 'number', unit: 'ريال/شهر', placeholder: '15000', hint: 'AWS, Azure, GCP...' },
                        { id: 'office_tools', label: 'مكتب + أدوات', type: 'number', unit: 'ريال/شهر', placeholder: '12000' },
                    ]
                },
                {
                    title: 'بيانات الإيرادات',
                    questions: [
                        { id: 'avg_contract_value', label: 'متوسط قيمة العقد/الاشتراك', type: 'number', unit: 'ريال', placeholder: '5000', hint: 'MRR لكل عميل أو متوسط مشروع' },
                        { id: 'active_clients', label: 'عدد العملاء النشطين', type: 'number', unit: 'عميل', placeholder: '80' },
                    ]
                },
                {
                    title: 'التكاليف المتغيرة',
                    questions: [
                        { id: 'hosting_per_client_pct', label: 'بنية تحتية لكل عميل', type: 'percent', unit: '%', placeholder: '5' },
                        { id: 'support_pct', label: 'دعم فني', type: 'percent', unit: '%', placeholder: '8' },
                        { id: 'sales_commission_pct', label: 'عمولات مبيعات', type: 'percent', unit: '%', placeholder: '10' },
                    ]
                }
            ]
        }),
        formulas: JSON.stringify({
            fixedCosts: '(team_salaries + cloud_infra + office_tools) * 12',
            variableCostPct: 'hosting_per_client_pct + support_pct + sales_commission_pct',
            contributionMarginPct: '100 - variableCostPct',
            breakEvenRevenue: 'fixedCosts / (contributionMarginPct / 100)',
            annualRevenue: 'avg_contract_value * active_clients * 12',
            breakEvenUnits: 'breakEvenRevenue / (avg_contract_value * 12)',
            safetyMargin: '((annualRevenue - breakEvenRevenue) / annualRevenue) * 100'
        }),
        benchmarks: JSON.stringify({
            support_pct: { avg: 8, good: 5, bad: 15 },
            contributionMarginPct: { avg: 77, good: 85, bad: 65 },
        }),
        breakEvenFields: JSON.stringify(['team_salaries', 'cloud_infra', 'office_tools', 'avg_contract_value', 'active_clients', 'hosting_per_client_pct', 'support_pct', 'sales_commission_pct']),
    },

    // ═══════════════════════════════════════════
    // 8. الخدمات المهنية
    // ═══════════════════════════════════════════
    {
        code: 'SERVICES',
        nameAr: 'الخدمات المهنية',
        nameEn: 'Professional Services',
        icon: '💼',
        color: '#6366f1',
        unitLabelAr: 'العقد / المشروع',
        unitLabelEn: 'Contract / Project',
        cfoQuestions: JSON.stringify({
            title: 'البيانات المالية — الخدمات المهنية',
            description: 'أدخل بيانات شركة الاستشارات أو الخدمات المهنية',
            icon: '💰',
            sections: [
                {
                    title: 'المصاريف الثابتة',
                    questions: [
                        { id: 'team_salaries', label: 'رواتب الفريق', type: 'number', unit: 'ريال/شهر', placeholder: '100000' },
                        { id: 'office_rent', label: 'إيجار المكتب', type: 'number', unit: 'ريال/شهر', placeholder: '15000' },
                        { id: 'tools_subscriptions', label: 'أدوات واشتراكات', type: 'number', unit: 'ريال/شهر', placeholder: '5000' },
                    ]
                },
                {
                    title: 'بيانات المشاريع',
                    questions: [
                        { id: 'avg_project_value', label: 'متوسط قيمة المشروع', type: 'number', unit: 'ريال', placeholder: '150000' },
                        { id: 'annual_projects', label: 'عدد المشاريع سنوياً', type: 'number', unit: 'مشروع', placeholder: '12' },
                    ]
                },
                {
                    title: 'التكاليف المتغيرة',
                    questions: [
                        { id: 'freelancer_pct', label: 'مستقلين ومتعاقدين', type: 'percent', unit: '%', placeholder: '20' },
                        { id: 'travel_pct', label: 'سفر وتنقلات', type: 'percent', unit: '%', placeholder: '5' },
                        { id: 'sales_commission_pct', label: 'عمولات مبيعات', type: 'percent', unit: '%', placeholder: '8' },
                    ]
                }
            ]
        }),
        formulas: JSON.stringify({
            fixedCosts: '(team_salaries + office_rent + tools_subscriptions) * 12',
            variableCostPct: 'freelancer_pct + travel_pct + sales_commission_pct',
            contributionMarginPct: '100 - variableCostPct',
            breakEvenRevenue: 'fixedCosts / (contributionMarginPct / 100)',
            annualRevenue: 'avg_project_value * annual_projects',
            breakEvenUnits: 'breakEvenRevenue / avg_project_value',
            safetyMargin: '((annualRevenue - breakEvenRevenue) / annualRevenue) * 100'
        }),
        benchmarks: JSON.stringify({
            freelancer_pct: { avg: 20, good: 15, bad: 30 },
            contributionMarginPct: { avg: 67, good: 75, bad: 55 },
        }),
        breakEvenFields: JSON.stringify(['team_salaries', 'office_rent', 'tools_subscriptions', 'avg_project_value', 'annual_projects', 'freelancer_pct', 'travel_pct', 'sales_commission_pct']),
    },
];

async function seedSectorConfigs() {
    console.log('🏭 بدء زراعة إعدادات القطاعات...\n');

    for (const config of SECTOR_CONFIGS) {
        try {
            const result = await prisma.sectorConfig.upsert({
                where: { code: config.code },
                update: {
                    nameAr: config.nameAr,
                    nameEn: config.nameEn,
                    icon: config.icon,
                    color: config.color,
                    unitLabelAr: config.unitLabelAr,
                    unitLabelEn: config.unitLabelEn,
                    cfoQuestions: config.cfoQuestions,
                    cmoQuestions: config.cmoQuestions || null,
                    cooQuestions: config.cooQuestions || null,
                    breakEvenFields: config.breakEvenFields,
                    formulas: config.formulas,
                    benchmarks: config.benchmarks,
                },
                create: config,
            });
            console.log(`  ✅ ${config.icon} ${config.nameAr} (${config.code}) — ${result.id}`);
        } catch (err) {
            console.error(`  ❌ ${config.nameAr}: ${err.message}`);
        }
    }

    console.log(`\n🎉 تمت زراعة ${SECTOR_CONFIGS.length} قطاعات بنجاح!`);
}

seedSectorConfigs()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
