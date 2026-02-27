const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// 🧠 STRATEGIC RULES ENGINE — محرك القواعد التقاطعية
// ============================================================
// يحلل بيانات الأقسام الثمانية ويكتشف فرص ومخاطر بينها
// IF (condition from Dept A) AND (condition from Dept B) → INSIGHT
// ============================================================

// ========== القواعد العشر الأساسية ==========
const CROSS_FUNCTIONAL_RULES = [

    // ═══════ 🚀 قواعد الفرص (OPPORTUNITY) ═══════

    {
        id: 'RULE_01_GROWTH_OPPORTUNITY',
        name: 'فرصة نمو غير مستغلة',
        type: 'OPPORTUNITY',
        severity: 'HIGH',
        departments: ['COO', 'CMO', 'CFO'],
        deptCodes: ['OPERATIONS', 'MARKETING', 'FINANCE'],
        icon: '🚀',
        evaluate: (data) => {
            const ops = data.OPERATIONS?.data || {};
            const mkt = data.MARKETING?.data || {};
            const fin = data.FINANCE?.data || {};

            const capacityUnused = ops.capacity_utilization && parseFloat(ops.capacity_utilization) < 75;
            const highCAC = mkt.cac && parseFloat(mkt.cac) > 400;
            const stableCash = fin.cash_runway && parseFloat(fin.cash_runway) >= 6;

            if (capacityUnused && highCAC && stableCash) {
                return {
                    triggered: true,
                    title: 'فرصة نمو غير مستغلة — طاقة فائضة مع سيولة كافية',
                    description: `الطاقة الإنتاجية مستغلة ${ops.capacity_utilization}% فقط، تكلفة اكتساب العميل مرتفعة (${mkt.cac} ريال)، والمدرج النقدي ${fin.cash_runway} أشهر. فرصة لتوجيه ميزانية التسويق نحو العملاء الحاليين (Upsell) بدلاً من اكتساب جدد.`,
                    evidence: [
                        { dept: 'العمليات', metric: 'استغلال الطاقة', value: `${ops.capacity_utilization}%`, status: 'warning' },
                        { dept: 'التسويق', metric: 'CAC', value: `${mkt.cac} ريال`, status: 'danger' },
                        { dept: 'المالية', metric: 'المدرج النقدي', value: `${fin.cash_runway} شهر`, status: 'good' },
                    ],
                    suggestedOKR: {
                        objective: 'استغلال الطاقة الفائضة لزيادة الإيرادات بدون تكلفة تسويق إضافية',
                        keyResults: [
                            `رفع استغلال الطاقة من ${ops.capacity_utilization}% إلى 85%`,
                            `خفض CAC من ${mkt.cac} إلى ${Math.round(parseFloat(mkt.cac) * 0.7)} ريال`,
                            'إطلاق حملة Upsell للعملاء الحاليين — هدف: 20% زيادة في قيمة العميل',
                        ],
                        timeline: '3 أشهر',
                        owner: 'CMO + COO'
                    }
                };
            }
            return { triggered: false };
        }
    },

    {
        id: 'RULE_10_EXPANSION_READY',
        name: 'جاهزية التوسع',
        type: 'OPPORTUNITY',
        severity: 'HIGH',
        departments: ['CFO', 'CSO', 'COO', 'CHRO'],
        deptCodes: ['FINANCE', 'SALES', 'OPERATIONS', 'HR'],
        icon: '🌍',
        evaluate: (data) => {
            const fin = data.FINANCE?.data || {};
            const sales = data.SALES?.data || {};
            const ops = data.OPERATIONS?.data || {};
            const hr = data.HR?.data || {};

            const healthyMargin = fin.operating_margin && parseFloat(fin.operating_margin) > 15;
            const strongGrowth = sales.sales_growth && parseFloat(sales.sales_growth) > 15;
            const capacityOk = ops.capacity_utilization && parseFloat(ops.capacity_utilization) > 70;
            const lowTurnover = hr.turnover_rate && parseFloat(hr.turnover_rate) < 12;

            if (healthyMargin && strongGrowth && capacityOk && lowTurnover) {
                return {
                    triggered: true,
                    title: 'الشركة جاهزة للتوسع — كل المؤشرات إيجابية',
                    description: `هامش ربح ${fin.operating_margin}%، نمو مبيعات ${sales.sales_growth}%، طاقة مستغلة ${ops.capacity_utilization}%، ودوران موظفين منخفض ${hr.turnover_rate}%. الوقت مناسب للتوسع.`,
                    evidence: [
                        { dept: 'المالية', metric: 'هامش الربح', value: `${fin.operating_margin}%`, status: 'good' },
                        { dept: 'المبيعات', metric: 'نمو المبيعات', value: `${sales.sales_growth}%`, status: 'good' },
                        { dept: 'العمليات', metric: 'استغلال الطاقة', value: `${ops.capacity_utilization}%`, status: 'good' },
                        { dept: 'HR', metric: 'دوران الموظفين', value: `${hr.turnover_rate}%`, status: 'good' },
                    ],
                    suggestedOKR: {
                        objective: 'إطلاق خطة توسع إقليمي مدروسة',
                        keyResults: [
                            'تحديد 2 أسواق جديدة مع دراسة جدوى خلال 6 أسابيع',
                            'تخصيص 15% من الأرباح لصندوق التوسع',
                            'توظيف فريق توسع (3 أشخاص) خلال شهرين',
                        ],
                        timeline: '6 أشهر',
                        owner: 'CEO + CFO'
                    }
                };
            }
            return { triggered: false };
        }
    },

    // ═══════ ⚠️ قواعد المخاطر (RISK) ═══════

    {
        id: 'RULE_02_OPERATIONAL_RISK',
        name: 'خطر تشغيلي متقاطع',
        type: 'RISK',
        severity: 'HIGH',
        departments: ['CHRO', 'CLO', 'CCO'],
        deptCodes: ['HR', 'LEGAL', 'SUPPORT'],
        icon: '⚠️',
        evaluate: (data) => {
            const hr = data.HR?.data || {};
            const legal = data.LEGAL?.data || {};
            const support = data.SUPPORT?.data || {};

            const highTurnover = hr.turnover_rate && parseFloat(hr.turnover_rate) > 15;
            const pendingVisas = hr.pending_visas && parseInt(hr.pending_visas) > 3;
            const lowCSAT = support.csat_score && parseFloat(support.csat_score) < 70;

            if (highTurnover && (pendingVisas || lowCSAT)) {
                return {
                    triggered: true,
                    title: 'خطر تشغيلي — تسرب وظيفي يهدد جودة الخدمة',
                    description: `معدل دوران الموظفين ${hr.turnover_rate}% (مرتفع)${pendingVisas ? `، ${hr.pending_visas} تأشيرات معلّقة` : ''}${lowCSAT ? `، ورضا العملاء منخفض ${support.csat_score}%` : ''}. سلسلة مترابطة: نقص موظفين → ضغط على الفريق → تراجع جودة الخدمة.`,
                    evidence: [
                        { dept: 'HR', metric: 'دوران الموظفين', value: `${hr.turnover_rate}%`, status: 'danger' },
                        pendingVisas ? { dept: 'HR', metric: 'تأشيرات معلّقة', value: `${hr.pending_visas}`, status: 'warning' } : null,
                        lowCSAT ? { dept: 'خدمة العملاء', metric: 'CSAT', value: `${support.csat_score}%`, status: 'danger' } : null,
                    ].filter(Boolean),
                    suggestedOKR: {
                        objective: 'معالجة أزمة الاحتفاظ بالموظفين وتحسين جودة الخدمة',
                        keyResults: [
                            `خفض معدل الدوران من ${hr.turnover_rate}% إلى ${Math.max(8, parseFloat(hr.turnover_rate) - 5)}%`,
                            'إجراء استبيان رضا موظفين + خطة تحسين خلال أسبوعين',
                            lowCSAT ? `رفع CSAT من ${support.csat_score}% إلى ${Math.min(85, parseFloat(support.csat_score) + 10)}%` : 'تسريع معالجة التأشيرات المعلّقة',
                        ],
                        timeline: 'شهرين',
                        owner: 'CHRO + COO'
                    }
                };
            }
            return { triggered: false };
        }
    },

    {
        id: 'RULE_04_COMPLIANCE_RISK',
        name: 'خطر امتثال',
        type: 'RISK',
        severity: 'HIGH',
        departments: ['CLO', 'CFO'],
        deptCodes: ['LEGAL', 'FINANCE'],
        icon: '📋',
        evaluate: (data) => {
            const legal = data.LEGAL?.data || {};
            const fin = data.FINANCE?.data || {};

            const expiringLicenses = legal.expiring_licenses && parseInt(legal.expiring_licenses) > 0;
            const lowCompliance = legal.compliance_score && parseFloat(legal.compliance_score) < 85;
            const noBudget = fin.initiative_budget && parseFloat(fin.initiative_budget) < 100000;

            if (expiringLicenses && (lowCompliance || noBudget)) {
                return {
                    triggered: true,
                    title: 'خطر امتثال — تراخيص تنتهي مع ضعف الجاهزية',
                    description: `${legal.expiring_licenses} رخصة تنتهي خلال 90 يوم${lowCompliance ? `، نسبة الامتثال ${legal.compliance_score}% (أقل من المطلوب)` : ''}${noBudget ? '، وميزانية المبادرات محدودة' : ''}. يجب التحرك فوراً لتجنب غرامات أو إيقاف.`,
                    evidence: [
                        { dept: 'القانونية', metric: 'تراخيص تنتهي', value: `${legal.expiring_licenses} رخصة`, status: 'danger' },
                        lowCompliance ? { dept: 'القانونية', metric: 'الامتثال', value: `${legal.compliance_score}%`, status: 'warning' } : null,
                        noBudget ? { dept: 'المالية', metric: 'ميزانية المبادرات', value: `${fin.initiative_budget} ريال`, status: 'warning' } : null,
                    ].filter(Boolean),
                    suggestedOKR: {
                        objective: 'ضمان الامتثال الكامل وتجديد التراخيص قبل انتهائها',
                        keyResults: [
                            `تجديد ${legal.expiring_licenses} رخصة خلال 30 يوم`,
                            lowCompliance ? `رفع نسبة الامتثال من ${legal.compliance_score}% إلى 95%` : 'إنشاء نظام تنبيه آلي للتراخيص',
                            'تخصيص ميزانية طوارئ للامتثال',
                        ],
                        timeline: 'شهر',
                        owner: 'CLO + CFO'
                    }
                };
            }
            return { triggered: false };
        }
    },

    {
        id: 'RULE_05_TECH_RISK',
        name: 'خطر تقني',
        type: 'RISK',
        severity: 'MEDIUM',
        departments: ['CTO', 'CCO'],
        deptCodes: ['TECH', 'SUPPORT'],
        icon: '💻',
        evaluate: (data) => {
            const tech = data.TECH?.data || {};
            const support = data.SUPPORT?.data || {};

            const lowUptime = tech.system_uptime && parseFloat(tech.system_uptime) < 99;
            const complaints = support.complaints_trend && support.complaints_trend.includes('تصاعدي');
            const securityIssues = tech.security_incidents && parseInt(tech.security_incidents) > 3;

            if ((lowUptime && complaints) || securityIssues) {
                return {
                    triggered: true,
                    title: 'خطر تقني — عدم استقرار الأنظمة يؤثر على العملاء',
                    description: `${lowUptime ? `توفّر الأنظمة ${tech.system_uptime}% (أقل من 99%)` : ''}${complaints ? '، الشكاوى في تصاعد' : ''}${securityIssues ? `، ${tech.security_incidents} حوادث أمنية في الربع الأخير` : ''}. الأنظمة غير المستقرة تفقد ثقة العملاء.`,
                    evidence: [
                        lowUptime ? { dept: 'التقنية', metric: 'Uptime', value: `${tech.system_uptime}%`, status: 'danger' } : null,
                        complaints ? { dept: 'خدمة العملاء', metric: 'اتجاه الشكاوى', value: 'تصاعدي ↑', status: 'danger' } : null,
                        securityIssues ? { dept: 'التقنية', metric: 'حوادث أمنية', value: `${tech.security_incidents}`, status: 'warning' } : null,
                    ].filter(Boolean),
                    suggestedOKR: {
                        objective: 'تحسين استقرار وأمن الأنظمة التقنية',
                        keyResults: [
                            lowUptime ? `رفع Uptime من ${tech.system_uptime}% إلى 99.5%` : 'تحقيق 99.5% uptime',
                            securityIssues ? 'خفض الحوادث الأمنية إلى صفر خلال الربع القادم' : 'إجراء فحص أمني شامل',
                            'تخصيص فريق دعم تقني 24/7 للقضايا الحرجة',
                        ],
                        timeline: 'شهرين',
                        owner: 'CTO'
                    }
                };
            }
            return { triggered: false };
        }
    },

    {
        id: 'RULE_06_HR_CRISIS',
        name: 'أزمة موارد بشرية',
        type: 'RISK',
        severity: 'CRITICAL',
        departments: ['CHRO', 'COO'],
        deptCodes: ['HR', 'OPERATIONS'],
        icon: '🚨',
        evaluate: (data) => {
            const hr = data.HR?.data || {};
            const ops = data.OPERATIONS?.data || {};

            const highTurnover = hr.turnover_rate && parseFloat(hr.turnover_rate) > 20;
            const lowSatisfaction = hr.employee_satisfaction && parseFloat(hr.employee_satisfaction) < 60;
            const slowHiring = hr.avg_hiring_days && parseInt(hr.avg_hiring_days) > 45;
            const lowEfficiency = ops.operational_efficiency && parseFloat(ops.operational_efficiency) < 75;

            if (highTurnover && lowSatisfaction) {
                return {
                    triggered: true,
                    title: '🚨 أزمة موارد بشرية — تسرب عالي + رضا منخفض',
                    description: `معدل الدوران ${hr.turnover_rate}% (خطير) ورضا الموظفين ${hr.employee_satisfaction}% (منخفض جداً)${slowHiring ? `، والتوظيف يستغرق ${hr.avg_hiring_days} يوم` : ''}${lowEfficiency ? `، الكفاءة التشغيلية تأثرت (${ops.operational_efficiency}%)` : ''}. حلقة مفرغة: موظفون يغادرون → ضغط على الباقين → مزيد من المغادرات.`,
                    evidence: [
                        { dept: 'HR', metric: 'دوران الموظفين', value: `${hr.turnover_rate}%`, status: 'danger' },
                        { dept: 'HR', metric: 'رضا الموظفين', value: `${hr.employee_satisfaction}%`, status: 'danger' },
                        slowHiring ? { dept: 'HR', metric: 'وقت التوظيف', value: `${hr.avg_hiring_days} يوم`, status: 'warning' } : null,
                        lowEfficiency ? { dept: 'العمليات', metric: 'الكفاءة', value: `${ops.operational_efficiency}%`, status: 'warning' } : null,
                    ].filter(Boolean),
                    suggestedOKR: {
                        objective: 'إيقاف نزيف المواهب وتحسين بيئة العمل خلال 60 يوم',
                        keyResults: [
                            'إجراء مقابلات خروج لآخر 10 مغادرين وتحديد الأنماط',
                            `رفع رضا الموظفين من ${hr.employee_satisfaction}% إلى 70% خلال 90 يوم`,
                            `تقليل وقت التوظيف إلى ${Math.min(30, parseInt(hr.avg_hiring_days || 45) - 15)} يوم`,
                            'إطلاق برنامج مكافآت وتقدير شهري',
                        ],
                        timeline: 'شهرين — عاجل',
                        owner: 'CHRO + CEO'
                    }
                };
            }
            return { triggered: false };
        }
    },

    {
        id: 'RULE_07_MARKETING_WASTE',
        name: 'هدر تسويقي',
        type: 'RISK',
        severity: 'MEDIUM',
        departments: ['CMO', 'CFO', 'CSO'],
        deptCodes: ['MARKETING', 'FINANCE', 'SALES'],
        icon: '💸',
        evaluate: (data) => {
            const mkt = data.MARKETING?.data || {};
            const sales = data.SALES?.data || {};

            const lowROI = mkt.marketing_roi && parseFloat(mkt.marketing_roi) < 100;
            const flatShare = mkt.market_share && parseFloat(mkt.market_share) < 10;
            const lowConversion = mkt.conversion_rate && parseFloat(mkt.conversion_rate) < 2;
            const lowWinRate = sales.win_rate && parseFloat(sales.win_rate) < 20;

            if (lowROI && (flatShare || lowConversion || lowWinRate)) {
                return {
                    triggered: true,
                    title: 'هدر تسويقي — عائد منخفض مع حصة سوقية ضعيفة',
                    description: `عائد التسويق ${mkt.marketing_roi}% (أقل من المتوسط)${flatShare ? `، حصة سوقية ${mkt.market_share}%` : ''}${lowConversion ? `، معدل تحويل ${mkt.conversion_rate}%` : ''}${lowWinRate ? `، معدل إغلاق مبيعات ${sales.win_rate}%` : ''}. الميزانية لا تترجم لنتائج.`,
                    evidence: [
                        { dept: 'التسويق', metric: 'ROI', value: `${mkt.marketing_roi}%`, status: 'danger' },
                        flatShare ? { dept: 'التسويق', metric: 'حصة سوقية', value: `${mkt.market_share}%`, status: 'warning' } : null,
                        lowWinRate ? { dept: 'المبيعات', metric: 'Win Rate', value: `${sales.win_rate}%`, status: 'warning' } : null,
                    ].filter(Boolean),
                    suggestedOKR: {
                        objective: 'تحسين كفاءة الإنفاق التسويقي وتحقيق عائد ملموس',
                        keyResults: [
                            `رفع Marketing ROI من ${mkt.marketing_roi}% إلى ${Math.round(parseFloat(mkt.marketing_roi) * 1.5)}%`,
                            lowConversion ? `تحسين معدل التحويل من ${mkt.conversion_rate}% إلى ${(parseFloat(mkt.conversion_rate) + 1.5).toFixed(1)}%` : 'تحسين استهداف الحملات',
                            'إجراء تحليل A/B لأفضل 3 قنوات تسويقية',
                        ],
                        timeline: '3 أشهر',
                        owner: 'CMO + CSO'
                    }
                };
            }
            return { triggered: false };
        }
    },

    // ═══════ 🚨 قواعد حرجة (CRITICAL) ═══════

    {
        id: 'RULE_03_CASH_CRISIS',
        name: 'إنذار سيولة حرج',
        type: 'CRITICAL',
        severity: 'CRITICAL',
        departments: ['CSO', 'CFO'],
        deptCodes: ['SALES', 'FINANCE'],
        icon: '🚨',
        evaluate: (data) => {
            const fin = data.FINANCE?.data || {};
            const sales = data.SALES?.data || {};

            const highGrowth = sales.sales_growth && parseFloat(sales.sales_growth) > 10;
            const shortRunway = fin.cash_runway && parseFloat(fin.cash_runway) < 4;
            const highReceivables = fin.receivables_overdue && parseFloat(fin.receivables_overdue) > 25;

            if (shortRunway && (highGrowth || highReceivables)) {
                return {
                    triggered: true,
                    title: '🚨 إنذار سيولة — النمو يستنزف النقد',
                    description: `المدرج النقدي ${fin.cash_runway} أشهر فقط (خطر)${highGrowth ? `، بينما المبيعات تنمو ${sales.sales_growth}% (تستهلك السيولة)` : ''}${highReceivables ? `، و${fin.receivables_overdue}% من الذمم متأخرة >30 يوم` : ''}. الشركة قد تنمو نفسها حتى الإفلاس.`,
                    evidence: [
                        { dept: 'المالية', metric: 'المدرج النقدي', value: `${fin.cash_runway} شهر`, status: 'danger' },
                        highGrowth ? { dept: 'المبيعات', metric: 'نمو المبيعات', value: `${sales.sales_growth}%`, status: 'warning' } : null,
                        highReceivables ? { dept: 'المالية', metric: 'ذمم متأخرة', value: `${fin.receivables_overdue}%`, status: 'danger' } : null,
                    ].filter(Boolean),
                    suggestedOKR: {
                        objective: 'حماية السيولة النقدية — أولوية قصوى',
                        keyResults: [
                            `تمديد المدرج النقدي من ${fin.cash_runway} إلى 8 أشهر`,
                            highReceivables ? `تحصيل الذمم المتأخرة — خفضها من ${fin.receivables_overdue}% إلى 10%` : 'تسريع دورة التحصيل',
                            'مراجعة شروط الدفع مع أكبر 5 عملاء',
                            'تأمين خط ائتمان احتياطي',
                        ],
                        timeline: '30 يوم — عاجل جداً',
                        owner: 'CFO + CEO'
                    }
                };
            }
            return { triggered: false };
        }
    },

    {
        id: 'RULE_08_SUPPLY_CHAIN_RISK',
        name: 'خطر سلسلة الإمداد',
        type: 'RISK',
        severity: 'MEDIUM',
        departments: ['COO', 'CSO'],
        deptCodes: ['OPERATIONS', 'SALES'],
        icon: '📦',
        evaluate: (data) => {
            const ops = data.OPERATIONS?.data || {};
            const sales = data.SALES?.data || {};

            const fewSuppliers = ops.supplier_count && parseInt(ops.supplier_count) < 3;
            const highCapacity = ops.capacity_utilization && parseFloat(ops.capacity_utilization) > 90;
            const strongDemand = sales.sales_growth && parseFloat(sales.sales_growth) > 10;

            if (fewSuppliers && (highCapacity || strongDemand)) {
                return {
                    triggered: true,
                    title: 'خطر سلسلة إمداد — اعتماد على موردين محدودين مع طلب عالي',
                    description: `${ops.supplier_count} موردين فقط${highCapacity ? `، الطاقة مستغلة ${ops.capacity_utilization}%` : ''}${strongDemand ? `، والمبيعات تنمو ${sales.sales_growth}%` : ''}. أي تعطل في مورد واحد سيوقف العمليات.`,
                    evidence: [
                        { dept: 'العمليات', metric: 'عدد الموردين', value: `${ops.supplier_count} فقط`, status: 'danger' },
                        highCapacity ? { dept: 'العمليات', metric: 'استغلال الطاقة', value: `${ops.capacity_utilization}%`, status: 'warning' } : null,
                        strongDemand ? { dept: 'المبيعات', metric: 'نمو المبيعات', value: `${sales.sales_growth}%`, status: 'good' } : null,
                    ].filter(Boolean),
                    suggestedOKR: {
                        objective: 'تنويع سلسلة الإمداد وتقليل مخاطر الاعتماد',
                        keyResults: [
                            `زيادة الموردين المعتمدين من ${ops.supplier_count} إلى ${parseInt(ops.supplier_count) + 3} على الأقل`,
                            'إنشاء مخزون أمان استراتيجي يكفي 30 يوم',
                            'توقيع عقود بديلة مع موردين احتياطيين',
                        ],
                        timeline: '3 أشهر',
                        owner: 'COO'
                    }
                };
            }
            return { triggered: false };
        }
    },

    {
        id: 'RULE_09_INNOVATION_GAP',
        name: 'فجوة ابتكار',
        type: 'RISK',
        severity: 'MEDIUM',
        departments: ['CTO', 'CMO'],
        deptCodes: ['TECH', 'MARKETING'],
        icon: '💡',
        evaluate: (data) => {
            const tech = data.TECH?.data || {};
            const mkt = data.MARKETING?.data || {};

            const fewProjects = tech.active_rd_projects && parseInt(tech.active_rd_projects) < 2;
            const highDebt = tech.tech_debt && (tech.tech_debt.includes('عالي') || tech.tech_debt.includes('حرج'));
            const losingShare = mkt.market_share && parseFloat(mkt.market_share) < 10;
            const lowDigital = tech.digital_transformation && parseFloat(tech.digital_transformation) < 30;

            if ((fewProjects || highDebt) && (losingShare || lowDigital)) {
                return {
                    triggered: true,
                    title: 'فجوة ابتكار — توقف التطوير يمنح المنافسين الأفضلية',
                    description: `${fewProjects ? `${tech.active_rd_projects} مشاريع R&D فقط` : ''}${highDebt ? `، دين تقني ${tech.tech_debt}` : ''}${losingShare ? `، حصة سوقية ${mkt.market_share}%` : ''}${lowDigital ? `، التحول الرقمي ${tech.digital_transformation}%` : ''}. بدون ابتكار، المنافسون سيتقدمون.`,
                    evidence: [
                        fewProjects ? { dept: 'التقنية', metric: 'مشاريع R&D', value: `${tech.active_rd_projects}`, status: 'warning' } : null,
                        highDebt ? { dept: 'التقنية', metric: 'الدين التقني', value: tech.tech_debt, status: 'danger' } : null,
                        losingShare ? { dept: 'التسويق', metric: 'حصة سوقية', value: `${mkt.market_share}%`, status: 'warning' } : null,
                    ].filter(Boolean),
                    suggestedOKR: {
                        objective: 'تسريع الابتكار وتقليل الدين التقني',
                        keyResults: [
                            `إطلاق ${3 - parseInt(tech.active_rd_projects || 0)} مشاريع R&D جديدة`,
                            highDebt ? 'تخفيض الدين التقني بـ Sprint مخصص كل أسبوعين' : 'تخصيص 20% من وقت الفريق التقني للابتكار',
                            `رفع التحول الرقمي من ${tech.digital_transformation || 0}% إلى ${Math.min(60, parseFloat(tech.digital_transformation || 0) + 20)}%`,
                        ],
                        timeline: '4 أشهر',
                        owner: 'CTO + CMO'
                    }
                };
            }
            return { triggered: false };
        }
    },
];

// ========== API: Run Analysis ==========
router.post('/analyze/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;

        // 1. Fetch all department data
        const departments = await prisma.department.findMany({
            where: { entityId },
            select: {
                id: true, code: true, name: true,
                dataStatus: true, dataPercent: true, dataSummary: true
            }
        });

        if (departments.length === 0) {
            return res.json({
                status: 'NO_DATA',
                message: 'لا توجد أقسام لهذا الكيان',
                insights: []
            });
        }

        // Parse department data
        const deptData = {};
        let completedCount = 0;
        let totalAnswers = 0;

        for (const dept of departments) {
            const raw = dept.dataSummary ? JSON.parse(dept.dataSummary) : {};
            const { _meta, ...answers } = raw;
            deptData[dept.code] = {
                data: answers,
                status: dept.dataStatus,
                percent: dept.dataPercent,
                name: dept.name
            };
            if (dept.dataStatus === 'COMPLETED') completedCount++;
            totalAnswers += Object.keys(answers).length;
        }

        // 2. Check minimum data
        if (completedCount < 2 && totalAnswers < 6) {
            return res.json({
                status: 'INSUFFICIENT_DATA',
                message: `تم جمع ${totalAnswers} إجابة من ${completedCount} قسم. المحرك يحتاج بيانات من قسمين على الأقل لاكتشاف التقاطعات.`,
                completedDepartments: completedCount,
                totalAnswers,
                insights: []
            });
        }

        // 3. Run all rules
        const insights = [];

        for (const rule of CROSS_FUNCTIONAL_RULES) {
            try {
                const result = rule.evaluate(deptData);
                if (result.triggered) {
                    insights.push({
                        ruleId: rule.id,
                        name: rule.name,
                        type: rule.type,
                        severity: rule.severity,
                        icon: rule.icon,
                        departments: rule.departments,
                        ...result
                    });
                }
            } catch (evalError) {
                console.error(`Rule ${rule.id} evaluation error:`, evalError.message);
            }
        }

        // 4. Sort: CRITICAL first, then HIGH, then MEDIUM
        const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        insights.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

        // 5. Overall strategic recommendation
        const criticalCount = insights.filter(i => i.severity === 'CRITICAL').length;
        const riskCount = insights.filter(i => i.type === 'RISK' || i.type === 'CRITICAL').length;
        const oppCount = insights.filter(i => i.type === 'OPPORTUNITY').length;

        let overallRecommendation;
        if (criticalCount > 0) {
            overallRecommendation = {
                decision: 'ACT_NOW',
                label: 'تحرّك فوراً',
                icon: '🚨',
                color: '#ef4444',
                description: `يوجد ${criticalCount} تحذير حرج يتطلب تدخل فوري قبل أي قرار استراتيجي آخر`
            };
        } else if (riskCount > oppCount) {
            overallRecommendation = {
                decision: 'FIX_FIRST',
                label: 'عالج المخاطر أولاً',
                icon: '🔧',
                color: '#f59e0b',
                description: `${riskCount} مخاطر تحتاج معالجة. ركّز على المخاطر التشغيلية قبل التوسع`
            };
        } else if (oppCount > 0) {
            overallRecommendation = {
                decision: 'GROW',
                label: 'اغتنم الفرص',
                icon: '🚀',
                color: '#22c55e',
                description: `${oppCount} فرصة نمو مكتشفة! الوضع مواتي للتوسع والاستثمار`
            };
        } else {
            overallRecommendation = {
                decision: 'STEADY',
                label: 'استمر بثبات',
                icon: '✅',
                color: '#3b82f6',
                description: 'لم يكتشف المحرك مخاطر كبيرة أو فرص فورية. واصل مع تحسينات تدريجية'
            };
        }

        res.json({
            status: 'ANALYZED',
            entityId,
            analyzedAt: new Date().toISOString(),
            dataQuality: {
                totalDepartments: departments.length,
                completedDepartments: completedCount,
                totalAnswers,
                coverage: `${Math.round((completedCount / departments.length) * 100)}%`
            },
            overallRecommendation,
            summary: {
                totalInsights: insights.length,
                opportunities: oppCount,
                risks: riskCount,
                critical: criticalCount
            },
            insights,
            rulesEvaluated: CROSS_FUNCTIONAL_RULES.length
        });

    } catch (error) {
        console.error('Rules engine error:', error);
        res.status(500).json({ error: 'فشل في تشغيل محرك القواعد' });
    }
});

// ========== GET available rules (for documentation) ==========
router.get('/rules', verifyToken, (req, res) => {
    res.json({
        totalRules: CROSS_FUNCTIONAL_RULES.length,
        rules: CROSS_FUNCTIONAL_RULES.map(r => ({
            id: r.id,
            name: r.name,
            type: r.type,
            severity: r.severity,
            icon: r.icon,
            departments: r.departments,
            deptCodes: r.deptCodes
        }))
    });
});

module.exports = router;
