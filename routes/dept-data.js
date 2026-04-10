const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { entityGuard, deptGuard } = require('../middleware/entity-guard');

const router = express.Router();

// ============ DEPARTMENT DATA / QUESTIONNAIRES ============
// بيانات كل قسم — الأسئلة المخصصة حسب الدور الوظيفي

// ========== الأسئلة لكل قسم ==========
const QUESTIONNAIRES = {
    CFO: {
        title: 'البيانات المالية',
        description: 'أدخل المؤشرات المالية الأساسية لتحليل الصحة المالية',
        icon: '💰',
        questions: [
            { id: 'revenue_growth', label: 'معدل نمو الإيرادات', type: 'percent', unit: '%', placeholder: '15', hint: 'مقارنة بنفس الفترة من العام السابق' },
            { id: 'operating_margin', label: 'هامش الربح التشغيلي', type: 'percent', unit: '%', placeholder: '22', hint: 'صافي الربح التشغيلي ÷ الإيرادات' },
            { id: 'cash_runway', label: 'المدرج النقدي', type: 'number', unit: 'شهر', placeholder: '8', hint: 'كم شهر يمكن تشغيل الشركة بالسيولة الحالية؟' },
            { id: 'cac', label: 'تكلفة اكتساب العميل (CAC)', type: 'number', unit: 'ريال', placeholder: '500', hint: 'إجمالي تكلفة التسويق والمبيعات ÷ عدد العملاء الجدد' },
            { id: 'receivables_overdue', label: 'ذمم مدينة متأخرة (>30 يوم)', type: 'percent', unit: '%', placeholder: '18', hint: 'نسبة المستحقات المتأخرة من إجمالي الذمم' },
            { id: 'initiative_budget', label: 'ميزانية المبادرات الجديدة', type: 'number', unit: 'ريال', placeholder: '500000', hint: 'المبلغ المخصص لمبادرات وبرامج جديدة' },
            { id: 'debt_equity_ratio', label: 'نسبة الدين إلى حقوق الملكية', type: 'number', unit: 'x', placeholder: '0.5', hint: 'إجمالي الديون ÷ حقوق المساهمين' },
            { id: 'revenue_concentration', label: 'تركّز الإيرادات', type: 'select', options: ['متنوعة — لا عميل يتجاوز 15%', 'معتدلة — أكبر عميل 15-30%', 'مركّزة — أكبر عميل >30%'], hint: 'مدى الاعتماد على عدد محدود من العملاء' },
        ]
    },
    CMO: {
        title: 'بيانات التسويق',
        description: 'أدخل مؤشرات التسويق لتحليل فعالية الحملات والعلامة التجارية',
        icon: '📢',
        questions: [
            { id: 'market_share', label: 'الحصة السوقية', type: 'percent', unit: '%', placeholder: '12', hint: 'حصتك من إجمالي السوق المستهدف' },
            { id: 'cac', label: 'تكلفة اكتساب العميل (CAC)', type: 'number', unit: 'ريال', placeholder: '450', hint: 'تكلفة التسويق ÷ عدد العملاء الجدد' },
            { id: 'marketing_roi', label: 'عائد الاستثمار التسويقي', type: 'percent', unit: '%', placeholder: '180', hint: '(إيرادات التسويق - تكلفته) ÷ تكلفته × 100' },
            { id: 'brand_awareness', label: 'الوعي بالعلامة التجارية', type: 'percent', unit: '%', placeholder: '35', hint: 'نسبة الجمهور المستهدف الذي يعرف علامتك' },
            { id: 'conversion_rate', label: 'معدل التحويل', type: 'percent', unit: '%', placeholder: '3.5', hint: 'نسبة الزوار الذين يصبحون عملاء' },
            { id: 'digital_budget_pct', label: 'نسبة التسويق الرقمي', type: 'percent', unit: '%', placeholder: '60', hint: 'نسبة ميزانية التسويق المخصصة للقنوات الرقمية' },
        ]
    },
    COO: {
        title: 'بيانات العمليات',
        description: 'أدخل مؤشرات الكفاءة التشغيلية والطاقة الإنتاجية',
        icon: '⚙️',
        questions: [
            { id: 'capacity_utilization', label: 'استغلال الطاقة الإنتاجية', type: 'percent', unit: '%', placeholder: '72', hint: 'الإنتاج الفعلي ÷ الطاقة القصوى' },
            { id: 'operational_efficiency', label: 'الكفاءة التشغيلية', type: 'percent', unit: '%', placeholder: '85', hint: 'نسبة العمليات المنجزة بدون أخطاء' },
            { id: 'on_time_delivery', label: 'التسليم في الموعد', type: 'percent', unit: '%', placeholder: '91', hint: 'نسبة الطلبات المسلّمة في الوقت المحدد' },
            { id: 'defect_rate', label: 'معدل العيوب/الأخطاء', type: 'percent', unit: '%', placeholder: '2.5', hint: 'نسبة المنتجات/الخدمات المعيبة' },
            { id: 'supplier_count', label: 'عدد الموردين الرئيسيين', type: 'number', unit: 'مورد', placeholder: '8', hint: 'عدد الموردين الأساسيين للمواد الحرجة' },
            { id: 'automation_level', label: 'مستوى الأتمتة', type: 'select', options: ['منخفض — أغلب العمليات يدوية', 'متوسط — بعض العمليات مؤتمتة', 'عالي — أغلب العمليات مؤتمتة', 'متقدم — أتمتة ذكية مع AI'], hint: 'مستوى أتمتة العمليات الأساسية' },
        ]
    },
    CHRO: {
        title: 'بيانات الموارد البشرية',
        description: 'أدخل مؤشرات رأس المال البشري والتوظيف',
        icon: '👥',
        questions: [
            { id: 'turnover_rate', label: 'معدل دوران الموظفين', type: 'percent', unit: '%', placeholder: '12', hint: 'عدد المغادرين ÷ متوسط عدد الموظفين × 100' },
            { id: 'employee_satisfaction', label: 'رضا الموظفين', type: 'percent', unit: '%', placeholder: '72', hint: 'من آخر استبيان رضا أو eNPS' },
            { id: 'open_positions', label: 'الوظائف الشاغرة', type: 'number', unit: 'وظيفة', placeholder: '5', hint: 'عدد الوظائف المعلنة وغير المشغولة' },
            { id: 'avg_hiring_days', label: 'متوسط وقت التوظيف', type: 'number', unit: 'يوم', placeholder: '35', hint: 'من نشر الإعلان حتى المباشرة' },
            { id: 'training_hours', label: 'ساعات التدريب/موظف', type: 'number', unit: 'ساعة/سنة', placeholder: '24', hint: 'متوسط ساعات التدريب السنوية لكل موظف' },
            { id: 'saudization_rate', label: 'نسبة التوطين (السعودة)', type: 'percent', unit: '%', placeholder: '35', hint: 'نسبة الموظفين السعوديين من إجمالي القوى العاملة' },
            { id: 'pending_visas', label: 'تأشيرات/إقامات معلّقة', type: 'number', unit: 'تأشيرة', placeholder: '3', hint: 'عدد التأشيرات المعلقة أو قيد التجديد' },
        ]
    },
    CTO: {
        title: 'البيانات التقنية',
        description: 'أدخل مؤشرات البنية التحتية والابتكار التقني',
        icon: '💻',
        questions: [
            { id: 'system_uptime', label: 'توفّر الأنظمة (Uptime)', type: 'percent', unit: '%', placeholder: '99.5', hint: 'نسبة وقت عمل الأنظمة الأساسية' },
            { id: 'security_incidents', label: 'الحوادث الأمنية', type: 'number', unit: 'حادثة/ربع', placeholder: '2', hint: 'عدد الحوادث الأمنية في آخر ربع' },
            { id: 'active_rd_projects', label: 'مشاريع البحث والتطوير', type: 'number', unit: 'مشروع', placeholder: '3', hint: 'عدد مشاريع R&D النشطة' },
            { id: 'tech_debt', label: 'مستوى الدين التقني', type: 'select', options: ['ممتاز — كود نظيف ومحدّث', 'جيد — دين تقني محدود', 'متوسط — يحتاج صيانة', 'عالي — يعيق التطوير', 'حرج — يهدد الاستقرار'], hint: 'تقييمك لحالة الكود والبنية التحتية' },
            { id: 'digital_transformation', label: 'تقدم التحول الرقمي', type: 'percent', unit: '%', placeholder: '45', hint: 'نسبة إنجاز خطة التحول الرقمي' },
            { id: 'it_budget_pct', label: 'ميزانية IT كنسبة من الإيرادات', type: 'percent', unit: '%', placeholder: '8', hint: 'إجمالي إنفاق IT ÷ إجمالي الإيرادات' },
        ]
    },
    CSO: {
        title: 'بيانات المبيعات',
        description: 'أدخل مؤشرات أداء المبيعات وخط الأنابيب',
        icon: '📦',
        questions: [
            { id: 'sales_growth', label: 'نمو المبيعات', type: 'percent', unit: '%', placeholder: '18', hint: 'مقارنة بنفس الفترة من العام السابق' },
            { id: 'pipeline_value', label: 'قيمة خط الأنابيب', type: 'number', unit: 'ريال', placeholder: '2000000', hint: 'إجمالي قيمة الفرص المفتوحة' },
            { id: 'win_rate', label: 'معدل الإغلاق (Win Rate)', type: 'percent', unit: '%', placeholder: '28', hint: 'الصفقات المكسوبة ÷ إجمالي الفرص' },
            { id: 'avg_deal_size', label: 'متوسط حجم الصفقة', type: 'number', unit: 'ريال', placeholder: '75000', hint: 'متوسط قيمة الصفقة المكتملة' },
            { id: 'retention_rate', label: 'معدل الاحتفاظ بالعملاء', type: 'percent', unit: '%', placeholder: '85', hint: 'نسبة العملاء الذين جددوا/استمروا' },
            { id: 'new_vs_returning', label: 'توزيع الإيرادات', type: 'select', options: ['أغلبها من عملاء جدد (>60%)', 'متوازنة (40-60% جدد)', 'أغلبها من عملاء حاليين (>60%)'], hint: 'نسبة الإيرادات من العملاء الجدد مقابل الحاليين' },
        ]
    },
    CCO: {
        title: 'بيانات خدمة العملاء',
        description: 'أدخل مؤشرات رضا العملاء وجودة الخدمة',
        icon: '🎧',
        questions: [
            { id: 'csat_score', label: 'رضا العملاء (CSAT)', type: 'percent', unit: '%', placeholder: '82', hint: 'نتيجة استبيان الرضا الأخير' },
            { id: 'nps_score', label: 'صافي نقاط المروّج (NPS)', type: 'number', unit: 'نقطة', placeholder: '35', hint: 'من -100 إلى +100' },
            { id: 'avg_response_time', label: 'متوسط وقت الاستجابة', type: 'number', unit: 'ساعة', placeholder: '4', hint: 'متوسط الوقت للرد على استفسار العميل' },
            { id: 'first_contact_resolution', label: 'حل من أول تواصل', type: 'percent', unit: '%', placeholder: '68', hint: 'نسبة المشاكل المحلولة من أول تواصل' },
            { id: 'complaints_trend', label: 'اتجاه الشكاوى', type: 'select', options: ['تنازلي ↓ — الشكاوى تنخفض', 'مستقر → — ثابت', 'تصاعدي ↑ — الشكاوى تزداد'], hint: 'اتجاه عدد الشكاوى مقارنة بالفترة السابقة' },
            { id: 'churn_rate', label: 'معدل فقدان العملاء', type: 'percent', unit: '%', placeholder: '5', hint: 'نسبة العملاء المفقودين من إجمالي القاعدة' },
        ]
    },
    CLO: {
        title: 'البيانات القانونية والإدارية',
        description: 'أدخل مؤشرات الامتثال والتراخيص والمخاطر القانونية',
        icon: '📋',
        questions: [
            { id: 'active_legal_cases', label: 'القضايا القانونية النشطة', type: 'number', unit: 'قضية', placeholder: '2', hint: 'عدد القضايا المفتوحة حالياً' },
            { id: 'expiring_licenses', label: 'تراخيص تنتهي قريباً (<90 يوم)', type: 'number', unit: 'رخصة', placeholder: '1', hint: 'عدد التراخيص التي ستنتهي خلال 3 أشهر' },
            { id: 'compliance_score', label: 'نسبة الامتثال', type: 'percent', unit: '%', placeholder: '92', hint: 'نسبة الالتزام بالمتطلبات التنظيمية' },
            { id: 'pending_permits', label: 'تصاريح معلّقة', type: 'number', unit: 'تصريح', placeholder: '3', hint: 'عدد التصاريح/الإقامات قيد المعالجة' },
            { id: 'regulatory_risk', label: 'مستوى المخاطر التنظيمية', type: 'select', options: ['منخفض — لا تغييرات متوقعة', 'متوسط — تغييرات طفيفة قادمة', 'عالي — تغييرات جوهرية تؤثر علينا'], hint: 'تقييمك للتغييرات التنظيمية المتوقعة' },
            { id: 'contracts_pending', label: 'عقود تحتاج تجديد', type: 'number', unit: 'عقد', placeholder: '4', hint: 'عدد العقود المنتهية أو القابلة للتجديد' },
        ]
    }
};

// ========== GET questionnaire template ==========
// يدعم أسئلة مخصصة حسب القطاع (SectorConfig) مع fallback للأسئلة العامة
router.get('/questionnaire/:role', verifyToken, async (req, res) => {
    const { role } = req.params;
    const { entityId } = req.query;

    // 1. Try sector-specific questions if entityId provided
    if (entityId) {
        try {
            const entity = await prisma.entity.findUnique({
                where: { id: entityId },
                include: { sectorConfig: true }
            });

            if (entity?.sectorConfig) {
                const roleFieldMap = { CFO: 'cfoQuestions', CMO: 'cmoQuestions', COO: 'cooQuestions' };
                const fieldName = roleFieldMap[role.toUpperCase()];

                if (fieldName && entity.sectorConfig[fieldName]) {
                    const sectorQuestions = JSON.parse(entity.sectorConfig[fieldName]);
                    return res.json({
                        ...sectorQuestions,
                        _sectorConfig: {
                            code: entity.sectorConfig.code,
                            nameAr: entity.sectorConfig.nameAr,
                            icon: entity.sectorConfig.icon,
                            unitLabel: entity.sectorConfig.unitLabelAr,
                            benchmarks: entity.sectorConfig.benchmarks ? JSON.parse(entity.sectorConfig.benchmarks) : {},
                            formulas: entity.sectorConfig.formulas ? JSON.parse(entity.sectorConfig.formulas) : null,
                            breakEvenFields: entity.sectorConfig.breakEvenFields ? JSON.parse(entity.sectorConfig.breakEvenFields) : [],
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Sector questions lookup failed, falling back:', err.message);
        }
    }

    // 2. Fallback to generic questions
    const questionnaire = QUESTIONNAIRES[role.toUpperCase()];

    if (!questionnaire) {
        return res.status(404).json({
            error: 'استبيان غير موجود لهذا الدور',
            availableRoles: Object.keys(QUESTIONNAIRES)
        });
    }

    res.json(questionnaire);
});

// ========== GET saved data for a department ==========
router.get('/:departmentId', verifyToken, deptGuard('departmentId'), async (req, res) => {
    try {
        const { departmentId } = req.params;

        const dept = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true } }
                    }
                }
            }
        });

        if (!dept) return res.status(404).json({ error: 'القسم غير موجود' });

        const data = dept.dataSummary ? JSON.parse(dept.dataSummary) : {};

        res.json({
            department: {
                id: dept.id,
                code: dept.code,
                name: dept.name,
                dataStatus: dept.dataStatus,
                dataPercent: dept.dataPercent
            },
            data,
            members: dept.members
        });
    } catch (error) {
        console.error('Error fetching dept data:', error);
        res.status(500).json({ error: 'فشل في جلب بيانات القسم' });
    }
});

// ========== SAVE department questionnaire data ==========
router.post('/:departmentId', verifyToken, deptGuard('departmentId'), async (req, res) => {
    try {
        const { departmentId } = req.params;
        const { answers } = req.body; // { revenue_growth: '15', operating_margin: '22', ... }

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ error: 'البيانات مطلوبة' });
        }

        // Get department to know its code
        const dept = await prisma.department.findUnique({
            where: { id: departmentId }
        });

        if (!dept) return res.status(404).json({ error: 'القسم غير موجود' });

        // Determine role for this department code
        const CODE_TO_ROLE = {
            FINANCE: 'CFO', MARKETING: 'CMO', OPERATIONS: 'COO',
            HR: 'CHRO', TECH: 'CTO', SALES: 'CSO',
            SUPPORT: 'CCO', LEGAL: 'CLO'
        };
        const role = CODE_TO_ROLE[dept.code];
        const questionnaire = QUESTIONNAIRES[role];

        if (!questionnaire) {
            return res.status(400).json({ error: 'استبيان غير متوفر لهذا القسم' });
        }

        // Calculate completion percentage
        const totalQuestions = questionnaire.questions.length;
        const answeredQuestions = questionnaire.questions.filter(q => {
            const val = answers[q.id];
            return val !== undefined && val !== '' && val !== null;
        }).length;
        const dataPercent = Math.round((answeredQuestions / totalQuestions) * 100);

        // Determine status
        let dataStatus = 'EMPTY';
        if (dataPercent >= 100) dataStatus = 'COMPLETED';
        else if (dataPercent > 0) dataStatus = 'IN_PROGRESS';

        // Save with metadata
        const enrichedData = {
            ...answers,
            _meta: {
                savedBy: req.user.id,
                savedAt: new Date().toISOString(),
                completedQuestions: answeredQuestions,
                totalQuestions
            }
        };

        const updated = await prisma.department.update({
            where: { id: departmentId },
            data: {
                dataSummary: JSON.stringify(enrichedData),
                dataPercent,
                dataStatus
            }
        });

        res.json({
            message: dataStatus === 'COMPLETED'
                ? '✅ تم حفظ جميع البيانات بنجاح!'
                : `💾 تم الحفظ — ${answeredQuestions}/${totalQuestions} سؤال مكتمل`,
            dataPercent,
            dataStatus,
            answeredQuestions,
            totalQuestions
        });

        // Log activity (non-blocking)
        try {
            await prisma.activity.create({
                data: {
                    action: dataStatus === 'COMPLETED' ? 'COMPLETE' : 'SAVE',
                    targetType: 'DEPT_DATA',
                    targetId: departmentId,
                    targetName: dept.name,
                    details: JSON.stringify({ dataPercent, dataStatus, answeredQuestions, totalQuestions }),
                    userId: req.user.id,
                    userName: req.user.name || 'مستخدم',
                    entityId: dept.entityId
                }
            });
        } catch (actErr) { /* silent */ }
    } catch (error) {
        console.error('Error saving dept data:', error);
        res.status(500).json({ error: 'فشل في حفظ بيانات القسم' });
    }
});

// ========== GET all department data for entity (for rules engine) ==========
router.get('/entity/:entityId/all', verifyToken, entityGuard('entityId'), async (req, res) => {
    try {
        const { entityId } = req.params;

        const departments = await prisma.department.findMany({
            where: { entityId },
            select: {
                id: true,
                code: true,
                name: true,
                dataStatus: true,
                dataPercent: true,
                dataSummary: true
            }
        });

        const result = {};
        let completedCount = 0;

        for (const dept of departments) {
            const data = dept.dataSummary ? JSON.parse(dept.dataSummary) : {};
            const { _meta, ...answers } = data;

            result[dept.code] = {
                departmentId: dept.id,
                name: dept.name,
                status: dept.dataStatus,
                percent: dept.dataPercent,
                data: answers,
                meta: _meta || null
            };

            if (dept.dataStatus === 'COMPLETED') completedCount++;
        }

        res.json({
            entityId,
            departments: result,
            summary: {
                total: departments.length,
                completed: completedCount,
                ready: completedCount >= 3 // Rules engine needs at least 3 departments
            }
        });
    } catch (error) {
        console.error('Error fetching all dept data:', error);
        res.status(500).json({ error: 'فشل في جلب بيانات الأقسام' });
    }
});

module.exports = router;
