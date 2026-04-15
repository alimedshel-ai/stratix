/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Stratix — DataBridge v1.0                                   ║
 * ║  جسر البيانات الموحد بين جميع مراحل المنصة                   ║
 * ║                                                              ║
 * ║  المسار الكامل للبيانات:                                      ║
 * ║  التشخيص الأولي → التسجيل → dept-deep → dept-smart          ║
 * ║  → SWOT/TOWS → الاهداف (OKRs/BSC) → KPIs → التقارير         ║
 * ║                                                              ║
 * ║  الاستخدام: أضف هذا الملف في كل صفحة تحتاج بيانات مترابطة   ║
 * ║  <script src="/js/data-bridge.js"></script>                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

(function (global) {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // 📦 مخطط مفاتيح localStorage الموحّد (Single Source of Truth)
    // ═══════════════════════════════════════════════════════
    const KEYS = {
        // المصادر الأولية
        DIAGNOSTIC: 'stratix_diagnostic_payload',   // التشخيص المجاني (الفانيل)
        MGR_DIAG: 'stratix_manager_diagnostic',   // تشخيص مدير الإدارة المستقل
        PAIN_AMBITION: 'painAmbition',                  // الألم والطموح (onboarding step 1)
        USER: 'user',                          // بيانات المستخدم من API
        ENTITY_ID: 'entityId',                      // معرف الشركة/المنشأة
        DEPT: 'stratix_v10_dept',              // الإدارة الحالية

        // التحليل العميق (dept-deep)
        deptDeep: (dept) => `DEEP_${dept.toUpperCase()}`,
        deptDeepPayload: 'stratix_dept_deep_payload',

        // التشخيص الذكي (dept-smart)
        deptSmart: (dept) => `stratix_smart_${dept}`,

        // التحليل الاستراتيجي
        SWOT: (dept) => dept ? `SWOT_${dept.toUpperCase()}` : 'stratix_swot_data',
        TOWS: (dept) => dept ? `TOWS_${dept.toUpperCase()}` : 'stratix_tows_data',
        PESTEL: (dept) => dept ? `PESTEL_${dept.toUpperCase()}` : 'stratix_pestel',
        BCG: 'stratix_bcg_data',
        RISK: 'stratix_risk_history',

        // التخطيط والتنفيذ
        DIRECTIONS: (dept) => dept ? `DIRECTIONS_${dept.toUpperCase()}` : 'stratix_directions',
        OBJECTIVES: (dept) => dept ? `OBJECTIVES_${dept.toUpperCase()}` : 'stratix_objectives',
        OKRS: (dept) => dept ? `OKRS_${dept.toUpperCase()}` : 'stratix_okrs',
        KPIS: (dept) => dept ? `KPIS_${dept.toUpperCase()}` : 'stratix_kpis',
        INITIATIVES: (dept) => dept ? `INITIATIVES_${dept.toUpperCase()}` : 'stratix_initiatives',

        // صحة الشركة
        COMPANY_HEALTH: 'stratix_company_health',
        AUDIT_HISTORY: 'stratix_audit_history',
    };

    // ═══════════════════════════════════════════════════════
    // 🔧 أدوات مساعدة
    // ═══════════════════════════════════════════════════════
    function _parse(raw, fallback = null) {
        if (!raw) return fallback;
        try { return JSON.parse(raw); } catch (e) { return fallback; }
    }

    function _get(key) {
        return _parse(localStorage.getItem(key));
    }

    function _set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('[DataBridge] Storage failed:', e);
            return false;
        }
    }

    function _now() { return new Date().toISOString(); }

    // ═══════════════════════════════════════════════════════
    // 👤 قراءة بيانات المستخدم والسياق
    // ═══════════════════════════════════════════════════════
    function getUser() {
        return _get(KEYS.USER) || {};
    }

    function getEntityId() {
        const user = getUser();
        return user.entity?.id || user.activeEntityId || user.entityId
            || localStorage.getItem(KEYS.ENTITY_ID) || null;
    }

    function getDept(fallback = null) {
        const url = new URLSearchParams(window.location.search).get('dept');
        return url
            || localStorage.getItem(KEYS.DEPT)
            || getUser().department?.key
            || fallback;
    }

    function getUserRole() {
        const user = getUser();
        return {
            role: user.role || 'VIEWER',
            userType: user.userType || 'EXPLORER',
            sysRole: user.systemRole || 'USER',
            isOwner: ['OWNER', 'ADMIN', 'COMPANY_MANAGER'].includes(user.role),
            isDeptMgr: user.userType === 'DEPT_MANAGER'
                || (user.userCategory && user.userCategory.startsWith('DEPT_')),
            isIndependent: user.isProManager === true
                || (user.userType === 'DEPT_MANAGER'
                    && ['OWNER', 'ADMIN'].includes(user.role))
        };
    }

    // ═══════════════════════════════════════════════════════
    // 🔍 مرحلة ١: التشخيص الأولي (الفانيل / onboarding)
    // ═══════════════════════════════════════════════════════
    function getDiagnostic() {
        // اقرأ من كل المصادر الممكنة وادمجها
        const main = _get(KEYS.DIAGNOSTIC) || {};
        const mgr = _get(KEYS.MGR_DIAG) || {};
        const pain = _get(KEYS.PAIN_AMBITION) || {};
        const user = getUser();

        return {
            // بيانات الشركة
            companyName: main.companyName || mgr.companyName || user.entity?.company?.nameAr || '',
            sector: main.sector || main.activity || mgr.sector || user.entity?.sector || '',
            teamSize: main.teamSize || mgr.teamSize || '',
            revenue: main.revenue || mgr.revenue || '',

            // بيانات الألم والطموح
            mainPain: main.mainPain || pain.pain || mgr.mainPain || '',
            ambition: main.ambition || pain.ambition || mgr.ambition || '',
            urgency: main.urgency || pain.urgency || '',

            // التصنيف
            category: main.category || main.userType || mgr.category || '',
            department: main.department || mgr.department || getDept() || '',
            diagScore: main.diagScore || mgr.diagScore || null,

            // المصدر الأصلي (للمراجعة)
            _sources: { main, mgr, pain }
        };
    }

    // ═══════════════════════════════════════════════════════
    // 🏗️ مرحلة ٢: التحليل العميق (dept-deep)
    // ═══════════════════════════════════════════════════════
    function getDeptDeep(dept) {
        dept = dept || getDept('hr');
        const upperDept = dept.toUpperCase();

        // 3 مصادر بالأولوية
        let data = _get(KEYS.deptDeep(dept));                     // DEEP_SALES
        if (!data) {
            const payload = _get(KEYS.deptDeepPayload) || {};
            data = payload[dept] || null;                          // stratix_dept_deep_payload.sales
        }
        if (!data) {
            data = _get(`DEEP_ANALYSIS_${upperDept}`);            // DEEP_ANALYSIS_SALES
        }

        return data;
    }

    function saveDeptDeep(dept, data) {
        dept = dept || getDept('hr');
        const enriched = { ...data, dept, savedAt: _now() };

        // احفظ في المفتاحين
        _set(KEYS.deptDeep(dept), enriched);

        const payload = _get(KEYS.deptDeepPayload) || {};
        payload[dept] = enriched;
        _set(KEYS.deptDeepPayload, payload);

        // ربط مع صحة الشركة
        _syncToCompanyHealth(dept, { deepCompleted: true, deepSavedAt: _now() });

        console.log(`[DataBridge] ✅ dept-deep [${dept}] saved`);
        return enriched;
    }

    // ═══════════════════════════════════════════════════════
    // 🧠 مرحلة ٣: التشخيص الذكي (dept-smart)
    // ═══════════════════════════════════════════════════════
    function getDeptSmart(dept) {
        dept = dept || getDept('hr');
        return _get(KEYS.deptSmart(dept));
    }

    function saveDeptSmart(dept, data) {
        dept = dept || getDept('hr');
        const enriched = { ...data, dept, savedAt: _now() };
        _set(KEYS.deptSmart(dept), enriched);

        // ربط مع صحة الشركة
        _syncToCompanyHealth(dept, {
            smartScore: enriched.health || null,
            smartCompleted: true,
            smartSavedAt: _now()
        });

        console.log(`[DataBridge] ✅ dept-smart [${dept}] saved`);
        return enriched;
    }

    // ═══════════════════════════════════════════════════════
    // 🎯 قراءة SWOT/TOWS
    // ═══════════════════════════════════════════════════════
    function getSWOT(dept) {
        dept = dept || getDept();
        return _get(KEYS.SWOT(dept)) || _get('stratix_swot_data');
    }

    function getTOWS(dept) {
        dept = dept || getDept();
        return _get(KEYS.TOWS(dept)) || _get('stratix_tows_data');
    }

    // ═══════════════════════════════════════════════════════
    // 📊 مرحلة ٤: الصورة الكاملة لإدارة محددة
    // ═══════════════════════════════════════════════════════
    function getDeptFullProfile(dept) {
        dept = dept || getDept('hr');

        const diagnostic = getDiagnostic();
        const deep = getDeptDeep(dept);
        const smart = getDeptSmart(dept);
        const swot = getSWOT(dept);
        const tows = getTOWS(dept);
        const directions = _get(KEYS.DIRECTIONS(dept));
        const objectives = _get(KEYS.OBJECTIVES(dept));
        const okrs = _get(KEYS.OKRS(dept));
        const kpis = _get(KEYS.KPIS(dept));

        // حساب النقطة الإجمالية
        const scores = [
            deep?.overallScore || deep?.health || null,
            smart?.health || null,
        ].filter(s => s !== null);
        const avgScore = scores.length
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null;

        // تقييم الاكتمال
        const completion = {
            diagnostic: !!diagnostic.sector,
            deep: !!deep,
            smart: !!smart,
            swot: !!swot,
            tows: !!tows,
            directions: !!directions,
            objectives: !!objectives,
            okrs: !!okrs,
            kpis: !!kpis
        };
        const completedCount = Object.values(completion).filter(Boolean).length;
        const completionPct = Math.round((completedCount / Object.keys(completion).length) * 100);

        return {
            dept,
            score: avgScore,
            completionPct,
            completion,

            // البيانات الكاملة
            diagnostic,
            deep,
            smart,
            swot,
            tows,
            directions,
            objectives,
            okrs,
            kpis,

            // ملخص للعرض
            summary: buildSummary(dept, { diagnostic, deep, smart, swot, avgScore })
        };
    }

    // ═══════════════════════════════════════════════════════
    // 🔗 ربط الخطوة السابقة بالخطوة التالية (Auto-prefill)
    // ═══════════════════════════════════════════════════════
    /**
     * يُستدعى في بداية كل صفحة تحليل لجلب البيانات من المراحل السابقة
     * ويعيد كائناً به كل القيم الجاهزة للحقن في الـ UI
     */
    function getPrefillData(dept, targetModule) {
        dept = dept || getDept('hr');

        const diag = getDiagnostic();
        const deep = getDeptDeep(dept);
        const smart = getDeptSmart(dept);
        const swot = getSWOT(dept);

        const prefill = {};

        // ── بيانات مشتركة دائماً ──
        prefill.companyName = diag.companyName || '';
        prefill.sector = diag.sector || '';
        prefill.dept = dept;
        prefill.teamSize = diag.teamSize || deep?.answers?.teamSize || null;
        prefill.mainPain = diag.mainPain || '';
        prefill.ambition = diag.ambition || '';

        switch (targetModule) {

            case 'dept-smart':
                // من dept-deep → الأرقام والمحاور
                if (deep) {
                    prefill.kpis = _extractKpis(deep, dept);
                    prefill.axes = _extractAxes(deep);
                    prefill.score = deep.overallScore || deep.health || null;
                }
                break;

            case 'swot':
                // من dept-smart + dept-deep → الأرقام والمحاور كـ SWOT inputs
                if (smart) {
                    prefill.health = smart.health;
                    prefill.strengths = _findStrengths(smart.axes, dept);
                    prefill.weaknesses = _findWeaknesses(smart.axes, dept);
                }
                if (deep) {
                    prefill.kpis = _extractKpis(deep, dept);
                }
                break;

            case 'tows':
                // من SWOT → TOWS
                if (swot) {
                    prefill.strengths = swot.strengths || [];
                    prefill.weaknesses = swot.weaknesses || [];
                    prefill.opportunities = swot.opportunities || [];
                    prefill.threats = swot.threats || [];
                }
                break;

            case 'directions':
                // من SWOT/TOWS → التوجهات
                if (swot) {
                    prefill.strategicPosition = swot.position || null;
                }
                break;

            case 'objectives':
            case 'okrs':
                // من التوجهات والأهداف العليا
                const dirs = _get(KEYS.DIRECTIONS(dept));
                if (dirs) {
                    prefill.strategicDirection = dirs.selected || dirs.direction || '';
                    prefill.vision = dirs.vision || diag.ambition || '';
                }
                if (smart) {
                    prefill.healthScore = smart.health;
                    prefill.priorities = smart.priorities || [];
                }
                break;

            case 'kpis':
                // من OKRs + dept-smart
                const okrs = _get(KEYS.OKRS(dept));
                if (okrs) {
                    prefill.objectives = okrs.objectives || [];
                }
                if (smart) {
                    prefill.baseline = _extractKpis(smart.kpis || {}, dept);
                }
                break;

            case 'reports':
                // كل شيء
                Object.assign(prefill, getDeptFullProfile(dept));
                break;
        }

        return prefill;
    }

    // ═══════════════════════════════════════════════════════
    // 🏢 مزامنة مع صحة الشركة الإجمالية
    // ═══════════════════════════════════════════════════════
    function _syncToCompanyHealth(dept, updates) {
        try {
            const health = _get(KEYS.COMPANY_HEALTH) || {
                departments: {}, overallScore: null, updatedAt: null
            };
            if (!health.departments) health.departments = {};
            if (!health.departments[dept]) health.departments[dept] = {};

            Object.assign(health.departments[dept], updates, { updatedAt: _now() });

            // إعادة حساب النقطة الإجمالية
            const scores = Object.values(health.departments)
                .map(d => d.smartScore || d.deepScore || d.score)
                .filter(s => s != null && s > 0);
            if (scores.length) {
                health.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            }
            health.updatedAt = _now();

            _set(KEYS.COMPANY_HEALTH, health);
        } catch (e) {
            console.warn('[DataBridge] health sync error:', e);
        }
    }

    // ═══════════════════════════════════════════════════════
    // 🔄 استخراج محوّل: dept-deep → dept-smart KPIs
    // ═══════════════════════════════════════════════════════
    const _KPI_MAP_BY_DEPT = {
        sales: {
            totalRevenue: 'k_revenue', annual_sales: 'k_revenue', monthly_revenue: 'k_revenue',
            conversionRate: 'k_conversion', conversion_rate: 'k_conversion', win_rate: 'k_conversion',
            teamSize: 'k_team_size', team_size: 'k_team_size',
            newCustomers: 'k_customers', active_customers: 'k_customers',
            pipeline: 'k_pipeline', sales_cycle: 'k_sales_cycle', avg_deal_size: 'k_deal_size'
        },

        hr: {
            headcount: 'k_headcount', total_employees: 'k_headcount',
            turnoverRate: 'k_turnover', turnover_rate: 'k_turnover',
            satisfactionScore: 'k_satisfaction', trainingHours: 'k_training'
        },
        finance: {
            netProfit: 'k_profit', net_profit: 'k_profit',
            cashFlow: 'k_cashflow', cash_flow: 'k_cashflow',
            operatingCosts: 'k_costs', revenue: 'k_revenue'
        },
        marketing: {
            leadsGenerated: 'k_leads', leads: 'k_leads',
            cac: 'k_cac', roi: 'k_roi',
            brandAwareness: 'k_brand', social_engagement: 'k_social'
        },
        operations: {
            efficiency: 'k_efficiency', defectRate: 'k_defects',
            onTimeDelivery: 'k_delivery', utilization: 'k_utilization'
        },
        it: {
            uptime: 'k_uptime', incidents: 'k_incidents',
            resolutionTime: 'k_resolution', securityScore: 'k_security'
        }
    };

    function _extractKpis(sourceObj, dept) {
        const mapping = _KPI_MAP_BY_DEPT[dept] || {};
        const result = {};

        const sources = [
            sourceObj?.kpis, sourceObj?.numbers, sourceObj?.data,
            sourceObj?.answers, sourceObj?.metrics, sourceObj
        ];

        sources.forEach(src => {
            if (!src || typeof src !== 'object') return;
            Object.entries(src).forEach(([key, val]) => {
                const targetId = mapping[key];
                if (targetId && val != null && val !== '') {
                    result[targetId] = val;
                }
            });
        });

        return result;
    }

    function _extractAxes(deepData) {
        if (!deepData) return {};
        return deepData.axes || deepData.sections || deepData.pillars || {};
    }

    function _findStrengths(axes, dept) {
        if (!axes || typeof axes !== 'object') return [];
        return Object.entries(axes)
            .filter(([, score]) => score >= 2)
            .map(([axId]) => axId);
    }

    function _findWeaknesses(axes, dept) {
        if (!axes || typeof axes !== 'object') return [];
        return Object.entries(axes)
            .filter(([, score]) => score <= 1)
            .map(([axId]) => axId);
    }

    // ═══════════════════════════════════════════════════════
    // 📝 ملخص نصي للإدارة (للتقارير والـ AI)
    // ═══════════════════════════════════════════════════════
    function buildSummary(dept, data) {
        const { diagnostic, deep, smart, swot, avgScore } = data;
        const DEPT_NAMES = {
            sales: 'المبيعات', hr: 'الموارد البشرية', finance: 'المالية',
            marketing: 'التسويق', operations: 'العمليات', compliance: 'الامتثال',
            it: 'تقنية المعلومات', quality: 'الجودة', cs: 'خدمة العملاء',
            projects: 'المشاريع', support: 'الخدمات المساندة'
        };
        const deptName = DEPT_NAMES[dept] || dept;

        let summary = `تحليل إدارة ${deptName}`;
        if (avgScore !== null) {
            const health = avgScore >= 70 ? 'جيد' : avgScore >= 45 ? 'متوسط' : 'يحتاج تحسين';
            summary += ` — مستوى الصحة: ${avgScore}% (${health})`;
        }
        if (diagnostic.mainPain) {
            summary += `. التحدي الرئيسي: ${diagnostic.mainPain}`;
        }
        if (smart?.axes) {
            const weakAxes = _findWeaknesses(smart.axes, dept);
            if (weakAxes.length) {
                summary += `. نقاط الضعف: ${weakAxes.slice(0, 3).join('، ')}`;
            }
        }
        return summary;
    }

    // ═══════════════════════════════════════════════════════
    // 🚀 INIT (يُستدعى تلقائياً في كل صفحة)
    // ═══════════════════════════════════════════════════════
    function init() {
        const dept = getDept();
        if (dept) {
            localStorage.setItem(KEYS.DEPT, dept);
        }

        // اكشف الـ module الحالي من الـ URL
        const page = window.location.pathname.split('/').pop().replace('.html', '');
        const moduleMap = {
            'dept-smart': 'dept-smart',
            'swot': 'swot',
            'tows': 'tows',
            'directions': 'directions',
            'objectives': 'objectives',
            'okrs': 'okrs',
            'kpis': 'kpis',
            'reports': 'reports'
        };
        const currentModule = moduleMap[page] || null;

        if (currentModule && dept) {
            // تحضير البيانات الجاهزة وتخزينها في context مؤقت
            const prefill = getPrefillData(dept, currentModule);
            window._stratixPrefill = prefill;
            console.log(`[DataBridge] 🔗 Prefill ready for [${currentModule}/${dept}]:`, prefill);
        }

        console.log('[DataBridge] ✅ Initialized. Dept:', dept || 'none');
        return { dept, module: currentModule };
    }

    // ═══════════════════════════════════════════════════════
    // 🌐 Public API
    // ═══════════════════════════════════════════════════════
    global.DataBridge = {
        KEYS,
        init,

        // قراءة
        getUser,
        getEntityId,
        getDept,
        getUserRole,
        getDiagnostic,
        getDeptDeep,
        getDeptSmart,
        getSWOT,
        getTOWS,
        getDeptFullProfile,
        getPrefillData,
        buildSummary,

        // كتابة
        saveDeptDeep,
        saveDeptSmart,

        // مساعدات
        _get,
        _set,
        _extractKpis,
        _extractAxes,
        _syncToCompanyHealth
    };

    // تشغيل تلقائي عند التحميل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window);
