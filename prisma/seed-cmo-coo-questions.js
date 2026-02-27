/**
 * 📢 CMO + ⚙️ COO Questions Seed — أسئلة التسويق والعمليات القطاعية
 * Usage: node prisma/seed-cmo-coo-questions.js
 * 
 * يُحدّث القطاعات الموجودة بأسئلة CMO و COO المخصصة
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ═══════════════════════════════════════════
// CMO Questions حسب القطاع
// ═══════════════════════════════════════════

const CMO_QUESTIONS = {
    CONSTRUCTION: {
        title: 'بيانات التسويق — قطاع المقاولات',
        description: 'أدخل بيانات التسويق وتطوير الأعمال لشركة المقاولات',
        icon: '📢',
        sections: [
            {
                title: 'قنوات اكتساب العملاء',
                questions: [
                    { id: 'monthly_marketing_budget', label: 'ميزانية التسويق الشهرية', type: 'number', unit: 'ريال/شهر', placeholder: '15000', hint: 'إجمالي الإنفاق على التسويق والإعلان' },
                    { id: 'referral_pct', label: 'نسبة العملاء من التوصيات', type: 'percent', unit: '%', placeholder: '40', hint: 'العملاء القادمين عبر توصيات وعلاقات' },
                    { id: 'tender_pct', label: 'نسبة المناقصات الحكومية', type: 'percent', unit: '%', placeholder: '35', hint: 'المشاريع عبر بوابة المنافسات' },
                    { id: 'digital_pct', label: 'نسبة العملاء الرقميين', type: 'percent', unit: '%', placeholder: '15', hint: 'عبر الموقع وسوشيال ميديا' },
                ]
            },
            {
                title: 'أداء المبيعات',
                questions: [
                    { id: 'monthly_leads', label: 'عدد العملاء المحتملين شهرياً', type: 'number', unit: 'عميل', placeholder: '12' },
                    { id: 'conversion_rate', label: 'نسبة التحويل (Lead → عقد)', type: 'percent', unit: '%', placeholder: '25', hint: 'من الاستفسار حتى توقيع العقد' },
                    { id: 'avg_sales_cycle', label: 'متوسط دورة البيع', type: 'select', options: ['أقل من شهر', '1-3 أشهر', '3-6 أشهر', 'أكثر من 6 أشهر'] },
                    { id: 'repeat_client_pct', label: 'نسبة العملاء المتكررين', type: 'percent', unit: '%', placeholder: '30' },
                ]
            },
            {
                title: 'السمعة والعلامة',
                questions: [
                    { id: 'google_rating', label: 'تقييم Google Maps', type: 'number', unit: '/5', placeholder: '4.2' },
                    { id: 'social_followers', label: 'عدد المتابعين (كل المنصات)', type: 'number', unit: 'متابع', placeholder: '5000' },
                    { id: 'portfolio_projects', label: 'مشاريع معروضة في البورتفوليو', type: 'number', unit: 'مشروع', placeholder: '15' },
                ]
            }
        ]
    },

    RESTAURANT: {
        title: 'بيانات التسويق — قطاع المطاعم',
        description: 'أدخل بيانات التسويق وتجربة العملاء لمطعمك',
        icon: '📢',
        sections: [
            {
                title: 'القنوات التسويقية',
                questions: [
                    { id: 'monthly_marketing_budget', label: 'ميزانية التسويق الشهرية', type: 'number', unit: 'ريال/شهر', placeholder: '8000' },
                    { id: 'social_ad_spend', label: 'إعلانات سوشيال ميديا', type: 'number', unit: 'ريال/شهر', placeholder: '4000' },
                    { id: 'influencer_budget', label: 'مؤثرين ومراجعات', type: 'number', unit: 'ريال/شهر', placeholder: '2000' },
                    { id: 'app_commission_pct', label: 'عمولات تطبيقات التوصيل', type: 'percent', unit: '%', placeholder: '18', hint: 'هنقر، جاهز، مرسول...' },
                ]
            },
            {
                title: 'رضا العملاء',
                questions: [
                    { id: 'google_rating', label: 'تقييم Google/Foursquare', type: 'number', unit: '/5', placeholder: '4.3' },
                    { id: 'return_customer_pct', label: 'نسبة العملاء المتكررين', type: 'percent', unit: '%', placeholder: '45', hint: 'يزورون أكثر من مرة شهرياً' },
                    { id: 'avg_delivery_time', label: 'متوسط وقت التوصيل', type: 'number', unit: 'دقيقة', placeholder: '35' },
                    { id: 'complaint_rate', label: 'نسبة الشكاوى', type: 'percent', unit: '%', placeholder: '3' },
                ]
            },
            {
                title: 'مصادر الإيرادات',
                questions: [
                    { id: 'dine_in_pct', label: 'نسبة المبيعات داخل المطعم', type: 'percent', unit: '%', placeholder: '40' },
                    { id: 'delivery_pct', label: 'نسبة التوصيل', type: 'percent', unit: '%', placeholder: '45' },
                    { id: 'takeaway_pct', label: 'نسبة تيك أواي', type: 'percent', unit: '%', placeholder: '15' },
                ]
            }
        ]
    },

    RETAIL: {
        title: 'بيانات التسويق — تجارة التجزئة',
        description: 'أدخل بيانات التسويق وتجربة العملاء لمتجرك',
        icon: '📢',
        sections: [
            {
                title: 'الأداء التسويقي',
                questions: [
                    { id: 'monthly_marketing_budget', label: 'ميزانية التسويق', type: 'number', unit: 'ريال/شهر', placeholder: '10000' },
                    { id: 'foot_traffic', label: 'عدد الزوار اليومي', type: 'number', unit: 'زائر', placeholder: '200' },
                    { id: 'conversion_rate', label: 'نسبة التحويل (زائر → مشتري)', type: 'percent', unit: '%', placeholder: '30' },
                    { id: 'basket_size', label: 'متوسط حجم السلة', type: 'number', unit: 'منتج', placeholder: '3' },
                ]
            },
            {
                title: 'ولاء العملاء',
                questions: [
                    { id: 'loyalty_members', label: 'أعضاء برنامج الولاء', type: 'number', unit: 'عضو', placeholder: '500' },
                    { id: 'repeat_purchase_pct', label: 'نسبة الشراء المتكرر', type: 'percent', unit: '%', placeholder: '35' },
                    { id: 'online_sales_pct', label: 'نسبة المبيعات أونلاين', type: 'percent', unit: '%', placeholder: '15' },
                ]
            }
        ]
    },

    ECOMMERCE: {
        title: 'بيانات التسويق — التجارة الإلكترونية',
        description: 'أدخل بيانات التسويق الرقمي لمتجرك الإلكتروني',
        icon: '📢',
        sections: [
            {
                title: 'أداء القنوات الرقمية',
                questions: [
                    { id: 'monthly_marketing_budget', label: 'ميزانية التسويق الإجمالية', type: 'number', unit: 'ريال/شهر', placeholder: '20000' },
                    { id: 'google_ads_spend', label: 'إنفاق Google Ads', type: 'number', unit: 'ريال/شهر', placeholder: '8000' },
                    { id: 'social_ads_spend', label: 'إنفاق إعلانات سوشيال', type: 'number', unit: 'ريال/شهر', placeholder: '10000' },
                    { id: 'monthly_visitors', label: 'زوار الموقع شهرياً', type: 'number', unit: 'زائر', placeholder: '15000' },
                    { id: 'conversion_rate', label: 'نسبة التحويل', type: 'percent', unit: '%', placeholder: '2.5', hint: 'من زائر إلى مشتري' },
                ]
            },
            {
                title: 'مؤشرات النمو',
                questions: [
                    { id: 'cac', label: 'تكلفة اكتساب العميل (CAC)', type: 'number', unit: 'ريال', placeholder: '80' },
                    { id: 'ltv', label: 'القيمة الدائمة للعميل (LTV)', type: 'number', unit: 'ريال', placeholder: '600' },
                    { id: 'cart_abandonment_pct', label: 'نسبة ترك السلة', type: 'percent', unit: '%', placeholder: '70' },
                    { id: 'email_list_size', label: 'حجم قائمة البريد', type: 'number', unit: 'مشترك', placeholder: '5000' },
                    { id: 'repeat_purchase_pct', label: 'نسبة الشراء المتكرر', type: 'percent', unit: '%', placeholder: '25' },
                ]
            }
        ]
    },

    HEALTHCARE: {
        title: 'بيانات التسويق — القطاع الصحي',
        description: 'أدخل بيانات التسويق واكتساب المرضى',
        icon: '📢',
        sections: [
            {
                title: 'مصادر المرضى',
                questions: [
                    { id: 'monthly_marketing_budget', label: 'ميزانية التسويق', type: 'number', unit: 'ريال/شهر', placeholder: '12000' },
                    { id: 'insurance_network_count', label: 'عدد شركات التأمين المتعاقدة', type: 'number', unit: 'شركة', placeholder: '8' },
                    { id: 'referral_pct', label: 'نسبة التحويلات من أطباء آخرين', type: 'percent', unit: '%', placeholder: '20' },
                    { id: 'walk_in_pct', label: 'نسبة القادمين بدون موعد', type: 'percent', unit: '%', placeholder: '30' },
                    { id: 'online_booking_pct', label: 'نسبة الحجز الإلكتروني', type: 'percent', unit: '%', placeholder: '40' },
                ]
            },
            {
                title: 'رضا المرضى',
                questions: [
                    { id: 'patient_satisfaction', label: 'مؤشر رضا المرضى', type: 'number', unit: '/10', placeholder: '8.5' },
                    { id: 'google_rating', label: 'تقييم Google', type: 'number', unit: '/5', placeholder: '4.4' },
                    { id: 'no_show_rate', label: 'نسبة عدم الحضور', type: 'percent', unit: '%', placeholder: '12' },
                    { id: 'return_patient_pct', label: 'نسبة المرضى المتكررين', type: 'percent', unit: '%', placeholder: '60' },
                ]
            }
        ]
    },

    TECH: {
        title: 'بيانات التسويق — قطاع التقنية',
        description: 'أدخل بيانات التسويق والنمو لشركتك التقنية',
        icon: '📢',
        sections: [
            {
                title: 'مؤشرات النمو',
                questions: [
                    { id: 'monthly_marketing_budget', label: 'ميزانية التسويق', type: 'number', unit: 'ريال/شهر', placeholder: '25000' },
                    { id: 'monthly_signups', label: 'تسجيلات جديدة شهرياً', type: 'number', unit: 'مستخدم', placeholder: '100' },
                    { id: 'trial_to_paid_pct', label: 'تحويل تجريبي → مدفوع', type: 'percent', unit: '%', placeholder: '15' },
                    { id: 'churn_rate', label: 'معدل الانسحاب الشهري', type: 'percent', unit: '%', placeholder: '5', hint: 'نسبة العملاء اللي يلغون اشتراكهم' },
                ]
            },
            {
                title: 'كفاءة التسويق',
                questions: [
                    { id: 'cac', label: 'تكلفة اكتساب العميل (CAC)', type: 'number', unit: 'ريال', placeholder: '500' },
                    { id: 'ltv', label: 'القيمة الدائمة للعميل (LTV)', type: 'number', unit: 'ريال', placeholder: '12000' },
                    { id: 'nps_score', label: 'مؤشر NPS', type: 'number', unit: 'نقطة', placeholder: '45', hint: 'Net Promoter Score (-100 إلى 100)' },
                    { id: 'organic_traffic_pct', label: 'نسبة الترافيك العضوي', type: 'percent', unit: '%', placeholder: '40' },
                ]
            }
        ]
    },

    MANUFACTURING: {
        title: 'بيانات التسويق — قطاع التصنيع',
        description: 'أدخل بيانات المبيعات وتطوير الأعمال للمصنع',
        icon: '📢',
        sections: [
            {
                title: 'قنوات البيع',
                questions: [
                    { id: 'monthly_marketing_budget', label: 'ميزانية تسويق ومبيعات', type: 'number', unit: 'ريال/شهر', placeholder: '15000' },
                    { id: 'distributor_count', label: 'عدد الموزعين', type: 'number', unit: 'موزع', placeholder: '10' },
                    { id: 'direct_sales_pct', label: 'نسبة البيع المباشر', type: 'percent', unit: '%', placeholder: '30' },
                    { id: 'export_pct', label: 'نسبة التصدير', type: 'percent', unit: '%', placeholder: '10' },
                ]
            },
            {
                title: 'مؤشرات السوق',
                questions: [
                    { id: 'market_share_pct', label: 'الحصة السوقية التقديرية', type: 'percent', unit: '%', placeholder: '8' },
                    { id: 'top_clients', label: 'عدد العملاء الرئيسيين', type: 'number', unit: 'عميل', placeholder: '5', hint: 'العملاء اللي يمثلون 80%+ من الإيرادات' },
                    { id: 'client_concentration_pct', label: 'تركّز العملاء (أكبر عميل %)', type: 'percent', unit: '%', placeholder: '25' },
                ]
            }
        ]
    },

    SERVICES: {
        title: 'بيانات التسويق — الخدمات المهنية',
        description: 'أدخل بيانات تطوير الأعمال واكتساب العملاء',
        icon: '📢',
        sections: [
            {
                title: 'اكتساب العملاء',
                questions: [
                    { id: 'monthly_marketing_budget', label: 'ميزانية التسويق', type: 'number', unit: 'ريال/شهر', placeholder: '10000' },
                    { id: 'monthly_proposals', label: 'عدد العروض المقدمة شهرياً', type: 'number', unit: 'عرض', placeholder: '8' },
                    { id: 'win_rate', label: 'نسبة كسب العروض', type: 'percent', unit: '%', placeholder: '35' },
                    { id: 'referral_pct', label: 'نسبة العملاء من التوصيات', type: 'percent', unit: '%', placeholder: '50' },
                ]
            },
            {
                title: 'ولاء العملاء',
                questions: [
                    { id: 'repeat_client_pct', label: 'نسبة العملاء المتكررين', type: 'percent', unit: '%', placeholder: '60' },
                    { id: 'nps_score', label: 'مؤشر NPS', type: 'number', unit: 'نقطة', placeholder: '55' },
                    { id: 'avg_client_tenure', label: 'متوسط مدة العلاقة مع العميل', type: 'select', options: ['أقل من سنة', '1-3 سنوات', '3-5 سنوات', 'أكثر من 5 سنوات'] },
                ]
            }
        ]
    },
};

// ═══════════════════════════════════════════
// COO Questions حسب القطاع
// ═══════════════════════════════════════════

const COO_QUESTIONS = {
    CONSTRUCTION: {
        title: 'بيانات العمليات — قطاع المقاولات',
        description: 'أدخل بيانات تنفيذ المشاريع والعمليات التشغيلية',
        icon: '⚙️',
        sections: [
            {
                title: 'أداء التنفيذ',
                questions: [
                    { id: 'ontime_delivery_pct', label: 'نسبة تسليم المشاريع في الوقت', type: 'percent', unit: '%', placeholder: '70' },
                    { id: 'rework_pct', label: 'نسبة إعادة العمل (Rework)', type: 'percent', unit: '%', placeholder: '8', hint: 'نسبة الأعمال اللي تُعاد بسبب جودة أو خطأ' },
                    { id: 'safety_incidents', label: 'حوادث السلامة (سنوياً)', type: 'number', unit: 'حادثة', placeholder: '3' },
                    { id: 'active_sites', label: 'عدد المواقع النشطة حالياً', type: 'number', unit: 'موقع', placeholder: '4' },
                ]
            },
            {
                title: 'الموارد البشرية والمعدات',
                questions: [
                    { id: 'total_workers', label: 'إجمالي العمالة (دائمة + مؤقتة)', type: 'number', unit: 'عامل', placeholder: '80' },
                    { id: 'equipment_utilization', label: 'نسبة استخدام المعدات', type: 'percent', unit: '%', placeholder: '65', hint: 'وقت التشغيل الفعلي من الإجمالي' },
                    { id: 'worker_turnover_pct', label: 'معدل دوران العمالة', type: 'percent', unit: '%', placeholder: '20' },
                ]
            },
            {
                title: 'سلسلة التوريد',
                questions: [
                    { id: 'supplier_count', label: 'عدد الموردين المعتمدين', type: 'number', unit: 'مورد', placeholder: '12' },
                    { id: 'material_delay_pct', label: 'نسبة تأخر المواد', type: 'percent', unit: '%', placeholder: '15' },
                    { id: 'inventory_days', label: 'مخزون مواد (بالأيام)', type: 'number', unit: 'يوم', placeholder: '14' },
                ]
            }
        ]
    },

    RESTAURANT: {
        title: 'بيانات العمليات — قطاع المطاعم',
        description: 'أدخل بيانات العمليات التشغيلية والمطبخ',
        icon: '⚙️',
        sections: [
            {
                title: 'أداء المطبخ',
                questions: [
                    { id: 'avg_prep_time', label: 'متوسط وقت التحضير', type: 'number', unit: 'دقيقة', placeholder: '15' },
                    { id: 'food_waste_pct', label: 'نسبة الهدر الغذائي', type: 'percent', unit: '%', placeholder: '6', hint: 'مواد مهدرة / إجمالي المشتريات' },
                    { id: 'menu_items', label: 'عدد أصناف المنيو', type: 'number', unit: 'صنف', placeholder: '40' },
                    { id: 'tables_count', label: 'عدد الطاولات (جلوس)', type: 'number', unit: 'طاولة', placeholder: '20' },
                ]
            },
            {
                title: 'الموارد البشرية',
                questions: [
                    { id: 'total_staff', label: 'إجمالي الموظفين', type: 'number', unit: 'موظف', placeholder: '15' },
                    { id: 'staff_turnover_pct', label: 'معدل دوران الموظفين (سنوي)', type: 'percent', unit: '%', placeholder: '40' },
                    { id: 'training_hours', label: 'ساعات تدريب سنوياً (لكل موظف)', type: 'number', unit: 'ساعة', placeholder: '20' },
                ]
            }
        ]
    },

    ECOMMERCE: {
        title: 'بيانات العمليات — التجارة الإلكترونية',
        description: 'أدخل بيانات التشغيل واللوجستيات لمتجرك',
        icon: '⚙️',
        sections: [
            {
                title: 'أداء التوصيل',
                questions: [
                    { id: 'avg_shipping_time', label: 'متوسط وقت التوصيل', type: 'number', unit: 'يوم', placeholder: '3' },
                    { id: 'ontime_delivery_pct', label: 'نسبة التوصيل في الموعد', type: 'percent', unit: '%', placeholder: '85' },
                    { id: 'return_rate', label: 'نسبة المرتجعات', type: 'percent', unit: '%', placeholder: '8' },
                    { id: 'damaged_shipment_pct', label: 'نسبة الشحنات التالفة', type: 'percent', unit: '%', placeholder: '1.5' },
                ]
            },
            {
                title: 'المخزون',
                questions: [
                    { id: 'sku_count', label: 'عدد المنتجات (SKU)', type: 'number', unit: 'منتج', placeholder: '200' },
                    { id: 'stockout_rate', label: 'نسبة نفاد المخزون', type: 'percent', unit: '%', placeholder: '5' },
                    { id: 'inventory_turnover', label: 'معدل دوران المخزون (سنوي)', type: 'number', unit: 'مرة', placeholder: '8' },
                ]
            }
        ]
    },

    HEALTHCARE: {
        title: 'بيانات العمليات — القطاع الصحي',
        description: 'أدخل بيانات العمليات الطبية والتشغيل',
        icon: '⚙️',
        sections: [
            {
                title: 'أداء العيادة',
                questions: [
                    { id: 'avg_wait_time', label: 'متوسط وقت الانتظار', type: 'number', unit: 'دقيقة', placeholder: '20' },
                    { id: 'avg_consultation_time', label: 'متوسط مدة الاستشارة', type: 'number', unit: 'دقيقة', placeholder: '15' },
                    { id: 'beds_occupancy_pct', label: 'نسبة إشغال الأسرّة', type: 'percent', unit: '%', placeholder: '75' },
                    { id: 'digital_records_pct', label: 'نسبة السجلات الرقمية', type: 'percent', unit: '%', placeholder: '80' },
                ]
            },
            {
                title: 'الجودة',
                questions: [
                    { id: 'infection_rate', label: 'معدل العدوى', type: 'percent', unit: '%', placeholder: '0.5' },
                    { id: 'readmission_rate', label: 'نسبة إعادة الدخول', type: 'percent', unit: '%', placeholder: '3' },
                    { id: 'accreditations', label: 'عدد الاعتمادات الحاصل عليها', type: 'number', unit: 'شهادة', placeholder: '2' },
                ]
            }
        ]
    },

    TECH: {
        title: 'بيانات العمليات — قطاع التقنية',
        description: 'أدخل بيانات التشغيل التقني والبنية التحتية',
        icon: '⚙️',
        sections: [
            {
                title: 'أداء المنصة',
                questions: [
                    { id: 'uptime_pct', label: 'نسبة وقت التشغيل (Uptime)', type: 'percent', unit: '%', placeholder: '99.5' },
                    { id: 'avg_response_time', label: 'سرعة الاستجابة', type: 'number', unit: 'ميلي ثانية', placeholder: '200' },
                    { id: 'daily_active_users', label: 'المستخدمون النشطون يومياً', type: 'number', unit: 'مستخدم', placeholder: '500' },
                    { id: 'support_tickets_monthly', label: 'تذاكر الدعم شهرياً', type: 'number', unit: 'تذكرة', placeholder: '50' },
                ]
            },
            {
                title: 'التطوير',
                questions: [
                    { id: 'dev_team_size', label: 'حجم فريق التطوير', type: 'number', unit: 'مطور', placeholder: '6' },
                    { id: 'sprint_velocity', label: 'سرعة Sprint', type: 'number', unit: 'Story Points', placeholder: '30' },
                    { id: 'bug_rate', label: 'نسبة البقات (لكل Release)', type: 'number', unit: 'بق', placeholder: '5' },
                    { id: 'tech_debt_pct', label: 'نسبة الدين التقني', type: 'percent', unit: '%', placeholder: '20' },
                ]
            }
        ]
    },

    MANUFACTURING: {
        title: 'بيانات العمليات — قطاع التصنيع',
        description: 'أدخل بيانات خطوط الإنتاج والعمليات',
        icon: '⚙️',
        sections: [
            {
                title: 'أداء الإنتاج',
                questions: [
                    { id: 'oee', label: 'كفاءة المعدات الشاملة (OEE)', type: 'percent', unit: '%', placeholder: '65' },
                    { id: 'defect_rate', label: 'نسبة المنتجات المعيبة', type: 'percent', unit: '%', placeholder: '2' },
                    { id: 'downtime_hours', label: 'ساعات التوقف شهرياً', type: 'number', unit: 'ساعة', placeholder: '20' },
                    { id: 'production_capacity_pct', label: 'نسبة استغلال الطاقة', type: 'percent', unit: '%', placeholder: '70' },
                ]
            },
            {
                title: 'سلسلة التوريد',
                questions: [
                    { id: 'raw_material_lead_time', label: 'وقت توريد المواد الخام', type: 'number', unit: 'يوم', placeholder: '14' },
                    { id: 'inventory_days', label: 'أيام المخزون', type: 'number', unit: 'يوم', placeholder: '30' },
                    { id: 'supplier_count', label: 'عدد الموردين', type: 'number', unit: 'مورد', placeholder: '8' },
                    { id: 'quality_certified', label: 'شهادة ISO حاصل عليها؟', type: 'select', options: ['نعم - ISO 9001', 'نعم - ISO أخرى', 'قيد العمل', 'لا'] },
                ]
            }
        ]
    },

    RETAIL: {
        title: 'بيانات العمليات — تجارة التجزئة',
        description: 'أدخل بيانات عمليات المتجر والمخزون',
        icon: '⚙️',
        sections: [
            {
                title: 'أداء المتجر',
                questions: [
                    { id: 'store_area', label: 'مساحة المتجر', type: 'number', unit: 'م²', placeholder: '120' },
                    { id: 'sales_per_sqm', label: 'مبيعات لكل م²', type: 'number', unit: 'ريال/م²/شهر', placeholder: '800' },
                    { id: 'avg_customer_time', label: 'متوسط وقت التسوق', type: 'number', unit: 'دقيقة', placeholder: '20' },
                    { id: 'total_staff', label: 'عدد الموظفين', type: 'number', unit: 'موظف', placeholder: '8' },
                ]
            },
            {
                title: 'المخزون',
                questions: [
                    { id: 'sku_count', label: 'عدد المنتجات (SKU)', type: 'number', unit: 'منتج', placeholder: '500' },
                    { id: 'inventory_turnover', label: 'دوران المخزون (سنوي)', type: 'number', unit: 'مرة', placeholder: '6' },
                    { id: 'stockout_pct', label: 'نسبة نفاد المخزون', type: 'percent', unit: '%', placeholder: '5' },
                    { id: 'shrinkage_actual_pct', label: 'نسبة الهدر الفعلية', type: 'percent', unit: '%', placeholder: '2' },
                ]
            }
        ]
    },

    SERVICES: {
        title: 'بيانات العمليات — الخدمات المهنية',
        description: 'أدخل بيانات تنفيذ المشاريع وإدارة الفريق',
        icon: '⚙️',
        sections: [
            {
                title: 'أداء الفريق',
                questions: [
                    { id: 'utilization_rate', label: 'معدل الاستغلال (Utilization)', type: 'percent', unit: '%', placeholder: '70', hint: 'نسبة الساعات القابلة للفوترة من الإجمالي' },
                    { id: 'ontime_delivery_pct', label: 'نسبة تسليم المشاريع في الوقت', type: 'percent', unit: '%', placeholder: '80' },
                    { id: 'team_size', label: 'حجم الفريق', type: 'number', unit: 'شخص', placeholder: '10' },
                    { id: 'turnover_rate', label: 'معدل الدوران السنوي', type: 'percent', unit: '%', placeholder: '15' },
                ]
            },
            {
                title: 'جودة الخدمة',
                questions: [
                    { id: 'client_satisfaction', label: 'رضا العملاء', type: 'number', unit: '/10', placeholder: '8.5' },
                    { id: 'scope_creep_pct', label: 'نسبة تغيير النطاق', type: 'percent', unit: '%', placeholder: '20', hint: 'المشاريع التي يتغير نطاقها بعد البدء' },
                    { id: 'avg_project_profitability', label: 'ربحية المشروع الفعلية', type: 'percent', unit: '%', placeholder: '35' },
                ]
            }
        ]
    },
};

async function seedCmoCooQuestions() {
    console.log('📢 بدء تحديث أسئلة CMO و COO...\n');

    const sectors = Object.keys(CMO_QUESTIONS);
    let updated = 0;

    for (const code of sectors) {
        try {
            const cmoQ = CMO_QUESTIONS[code] ? JSON.stringify(CMO_QUESTIONS[code]) : null;
            const cooQ = COO_QUESTIONS[code] ? JSON.stringify(COO_QUESTIONS[code]) : null;

            await prisma.sectorConfig.update({
                where: { code },
                data: {
                    cmoQuestions: cmoQ,
                    cooQuestions: cooQ,
                }
            });

            console.log(`  ✅ ${code}: CMO ${cmoQ ? '✓' : '✗'} | COO ${cooQ ? '✓' : '✗'}`);
            updated++;
        } catch (err) {
            console.error(`  ❌ ${code}: ${err.message}`);
        }
    }

    console.log(`\n🎉 تم تحديث ${updated}/${sectors.length} قطاعات بأسئلة CMO و COO!`);
}

seedCmoCooQuestions()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
