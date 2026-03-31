/**
 * Startix — Dashboard Path Filter v1.0
 * ────────────────────────────────────
 * يقرأ patternKey + size من localStorage ويتحكم في إظهار/إخفاء أقسام الداشبورد.
 * 
 * الفكرة:
 *   - الناشئ/المتعثر (nascent_struggling, nascent_cautious) → لوحة مبسطة
 *   - النامي (growing_chaotic, growing_ambitious) → لوحة متوسطة
 *   - الناضج (mature_renewing, mature_competitive) → لوحة كاملة
 *   - الخاص (financial_struggling, emergency_risk) → لوحة إنقاذ مركّزة
 *   - default_strategic → لوحة شاملة
 * 
 * الاستخدام:
 *   <script src="/assets/js/dashboard-filter.js"></script>
 *   يجب تحميله بعد اكتمال DOM
 */

(function () {
    'use strict';

    // ══════════════════════════════════════════
    //  1. قراءة البيانات من localStorage
    // ══════════════════════════════════════════
    let patternKey = '';
    let size = '';
    let userType = '';

    try {
        // من نتائج التشخيص
        const diagRaw = localStorage.getItem('stratix_diagnostic_payload');
        if (diagRaw) {
            const diag = JSON.parse(diagRaw);
            patternKey = diag.patternKey || diag.pattern_key || '';
            size = diag.size || diag.companySize || '';
        }

        // من path-engine
        const pathRaw = localStorage.getItem('stratix_path_result');
        if (pathRaw) {
            const path = JSON.parse(pathRaw);
            patternKey = patternKey || path.patternKey || '';
            size = size || path.size || '';
        }

        // من بيانات المستخدم
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
            const user = JSON.parse(userRaw);
            userType = user.userType || user.type || '';
        }

        // من الـ sidebar level
        const sidebarLevel = localStorage.getItem('_sidebarCompanyLevel');
        if (sidebarLevel && !size) {
            const levelMap = { 'SMALL': 'small', 'MEDIUM': 'medium', 'LARGE': 'large' };
            size = levelMap[sidebarLevel] || '';
        }
    } catch (e) {
        console.warn('[DashFilter] Error reading localStorage:', e);
    }

    // ══════════════════════════════════════════
    //  2. تعريف مستويات العرض لكل مسار
    // ══════════════════════════════════════════

    /**
     * مستويات العرض:
     *   BASIC    = الناشئ والمتعثر → أساسيات فقط
     *   STANDARD = النامي الفوضوي + مسارات الطوارئ → معظم الأدوات
     *   ADVANCED = النامي الطموح + الناضج → كل الأدوات
     *   FULL     = المسار الافتراضي الشامل → كل شيء
     */
    const LEVELS = {
        BASIC: 'BASIC',
        STANDARD: 'STANDARD',
        ADVANCED: 'ADVANCED',
        FULL: 'FULL'
    };

    const PATTERN_LEVEL_MAP = {
        // ── ناشئة ──
        'nascent_struggling': LEVELS.BASIC,
        'nascent_cautious': LEVELS.BASIC,

        // ── نامية ──
        'growing_chaotic': LEVELS.STANDARD,
        'growing_ambitious': LEVELS.ADVANCED,

        // ── ناضجة ──
        'mature_renewing': LEVELS.ADVANCED,
        'mature_competitive': LEVELS.FULL,

        // ── مسارات خاصة ──
        'financial_struggling': LEVELS.STANDARD,
        'emergency_risk': LEVELS.STANDARD,

        // ── افتراضي ──
        'default_strategic': LEVELS.FULL,
        'operational_tactical': LEVELS.STANDARD, // مدير الإدارة
    };

    // تحديد المستوى
    const currentLevel = PATTERN_LEVEL_MAP[patternKey] || LEVELS.FULL;

    // ══════════════════════════════════════════
    //  3. تعريف ما يظهر في كل مستوى
    // ══════════════════════════════════════════

    /**
     * الأقسام المتاحة في dashboard.html
     * كل قسم يحدد بـ data-dash-section="sectionName"
     * أو بـ ID معروف
     */
    const SECTION_VISIBILITY = {
        // ── قسم ── : [ BASIC?, STANDARD?, ADVANCED?, FULL? ]
        'smartGuideCard': [true, true, true, true],   // دليل البدء — دائماً
        'roadmapWidget': [true, true, true, true],   // مسار النضج — دائماً
        'liveStats': [true, true, true, true],   // الإحصائيات السريعة — دائماً
        'journeyWidget': [true, true, true, true],   // رحلتك الاستراتيجية — دائماً
        'patternInsight': [true, true, true, true],   // بطاقة المسار — دائماً

        'simulationLab': [false, false, true, true],   // مختبر المحاكاة — متقدم فقط
        'diagHub': [false, true, true, true],   // Executive Summary — معياري+
        'smartRecs': [true, true, true, true],   // توصيات — دائماً
        'paSummaryCard': [true, true, true, true],   // ملخص التشخيص — دائماً
        'budgetWidget': [false, false, true, true],   // الميزانية — متقدم+
        'bscSection': [false, true, true, true],   // BSC الأداء المتوازن — معياري+
        'deptInsights': [false, false, true, true],   // رؤى الإدارات — متقدم+
        'socialProofBanner': [false, false, false, true],   // البانر الترويجي — شامل فقط
    };

    // ══════════════════════════════════════════
    //  4. تطبيق الفلترة
    // ══════════════════════════════════════════

    const levelIndex = {
        [LEVELS.BASIC]: 0,
        [LEVELS.STANDARD]: 1,
        [LEVELS.ADVANCED]: 2,
        [LEVELS.FULL]: 3
    };

    const idx = levelIndex[currentLevel];

    function applyFilter() {
        for (const [sectionId, visibility] of Object.entries(SECTION_VISIBILITY)) {
            const el = document.getElementById(sectionId);
            if (!el) continue;

            const shouldShow = visibility[idx];
            if (!shouldShow) {
                el.style.display = 'none';
                el.setAttribute('data-filtered', 'hidden');
            }
        }

        // أيضاً ابحث عن عناصر بـ data-dash-level
        document.querySelectorAll('[data-dash-level]').forEach(el => {
            const requiredLevel = el.getAttribute('data-dash-level');
            const requiredIdx = levelIndex[requiredLevel];
            if (requiredIdx !== undefined && idx < requiredIdx) {
                el.style.display = 'none';
                el.setAttribute('data-filtered', 'hidden');
            }
        });
    }

    // ══════════════════════════════════════════
    //  5. إضافة بادج المستوى + رسالة مخصصة
    // ══════════════════════════════════════════

    const LEVEL_CONFIG = {
        [LEVELS.BASIC]: {
            label: 'مسار مبسّط',
            labelEn: 'BASIC',
            color: '#f59e0b',
            bg: '#fefce8',
            border: '#fef3c7',
            icon: '🌱',
            message: 'لوحتك مخصصة لمرحلتك — ركّز على الأساسيات أولاً',
            upgradeMsg: 'أكمل الخطوات الأساسية لفتح أدوات متقدمة'
        },
        [LEVELS.STANDARD]: {
            label: 'مسار متوسط',
            labelEn: 'STANDARD',
            color: '#3b82f6',
            bg: '#eff6ff',
            border: '#dbeafe',
            icon: '⚡',
            message: 'لوحتك توفّر الأدوات الأساسية + أدوات التنظيم',
            upgradeMsg: 'أكمل التشخيص العميق لفتح مختبر المحاكاة والميزانية التفاعلية'
        },
        [LEVELS.ADVANCED]: {
            label: 'مسار متقدم',
            labelEn: 'ADVANCED',
            color: '#8b5cf6',
            bg: '#f5f3ff',
            border: '#e9d5ff',
            icon: '🚀',
            message: 'لوحتك الكاملة — كل الأدوات الاستراتيجية متاحة',
            upgradeMsg: null
        },
        [LEVELS.FULL]: {
            label: 'مسار احترافي',
            labelEn: 'FULL',
            color: '#10b981',
            bg: '#f0fdf4',
            border: '#dcfce7',
            icon: '🏆',
            message: 'لوحتك الاحترافية — كل شيء مفتوح',
            upgradeMsg: null
        }
    };

    function renderLevelBadge() {
        const config = LEVEL_CONFIG[currentLevel];
        if (!config) return;

        // تحديث الـ badge في الهيدر
        const levelBadge = document.getElementById('entityLevelBadge');
        if (levelBadge) {
            levelBadge.textContent = config.icon + ' ' + config.labelEn;
            levelBadge.style.color = config.color;
            levelBadge.style.background = config.bg;
            levelBadge.style.border = '1px solid ' + config.border;
        }

        // تحديث الرسالة الترحيبية
        const welcomeDesc = document.getElementById('welcomeDesc');
        if (welcomeDesc) {
            welcomeDesc.textContent = config.message;
        }

        // إضافة بانر الترقية (إذا المستوى أقل من ADVANCED)
        if (config.upgradeMsg && (currentLevel === LEVELS.BASIC || currentLevel === LEVELS.STANDARD)) {
            const upgradeContainer = document.getElementById('liveStats');
            if (upgradeContainer && upgradeContainer.parentElement) {
                const banner = document.createElement('div');
                banner.id = 'levelUpgradeBanner';
                banner.style.cssText = `
          background: linear-gradient(135deg, ${config.bg}, #fff);
          border: 1px solid ${config.border};
          border-radius: 16px;
          padding: 16px 20px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          animation: fadeIn 0.5s ease;
        `;
                banner.innerHTML = `
          <div style="font-size:28px;flex-shrink:0;">${config.icon}</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:2px;">${config.label}</div>
            <div style="font-size:11px;color:#64748b;">${config.upgradeMsg}</div>
          </div>
          <button onclick="this.parentElement.style.display='none'" 
            style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:4px;">
            <i class="bi bi-x-lg"></i>
          </button>
        `;
                upgradeContainer.parentElement.insertBefore(banner, upgradeContainer);
            }
        }
    }

    // ══════════════════════════════════════════
    //  6. تخصيص dept-dashboard.html حسب الإدارة
    // ══════════════════════════════════════════

    function customizeDeptDashboard() {
        // تحقق إننا في dept-dashboard
        if (!window.location.pathname.includes('dept-dashboard')) return;

        let dept = '';
        try {
            dept = localStorage.getItem('stratix_v10_dept') || '';
            if (!dept) {
                const diagRaw = localStorage.getItem('stratix_diagnostic_payload');
                if (diagRaw) {
                    const diag = JSON.parse(diagRaw);
                    dept = diag.dept || diag.department || '';
                }
            }
        } catch (e) { /* ignore */ }

        if (!dept) return;

        const DEPT_CONFIG = {
            hr: {
                name: 'الموارد البشرية',
                icon: '👥',
                color: '#3b82f6',
                gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                quickActions: [
                    { icon: 'bi-building-fill-check', label: 'بيئة العمل', href: '/company-health.html?dept=hr', color: '#10b981' },
                    { icon: 'bi-people-fill', label: 'تحليل HR العميق', href: '/hr-deep.html', color: '#3b82f6' },
                    { icon: 'bi-graph-up', label: 'مؤشرات HR', href: '/kpis.html?dept=hr', color: '#22c55e' },
                    { icon: 'bi-list-task', label: 'مبادرات HR', href: '/initiatives.html?dept=hr', color: '#f59e0b' },
                ],
                kpiLabels: ['معدل الدوران الوظيفي', 'رضا الموظفين', 'ساعات التدريب', 'نسبة التوطين', 'تكلفة التوظيف']
            },
            finance: {
                name: 'المالية',
                icon: '💰',
                color: '#f59e0b',
                gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                quickActions: [
                    { icon: 'bi-building-fill-check', label: 'البيئة المالية', href: '/company-health.html?dept=finance', color: '#10b981' },
                    { icon: 'bi-cash-stack', label: 'التحليل المالي', href: '/dept-deep.html?dept=finance&single=1', color: '#f59e0b' },
                    { icon: 'bi-graph-up', label: 'مؤشرات مالية', href: '/kpis.html?dept=finance', color: '#22c55e' },
                    { icon: 'bi-receipt', label: 'الميزانية', href: '/initiatives.html?dept=finance', color: '#3b82f6' },
                ],
                kpiLabels: ['هامش الربح الصافي', 'نسبة السيولة', 'العائد على الاستثمار', 'نسبة الديون', 'تكلفة التمويل']
            },
            marketing: {
                name: 'التسويق',
                icon: '📣',
                color: '#8b5cf6',
                gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                quickActions: [
                    { icon: 'bi-building-fill-check', label: 'بيئة التسويق', href: '/company-health.html?dept=marketing', color: '#10b981' },
                    { icon: 'bi-megaphone', label: 'تحليل التسويق', href: '/dept-deep.html?dept=marketing&single=1', color: '#8b5cf6' },
                    { icon: 'bi-person-walking', label: 'رحلة العميل', href: '/tool-detail.html?code=CUSTOMER_JOURNEY&dept=marketing', color: '#ec4899' },
                    { icon: 'bi-graph-up', label: 'مؤشرات التسويق', href: '/kpis.html?dept=marketing', color: '#22c55e' },
                ],
                kpiLabels: ['حصة السوق', 'تكلفة اكتساب العميل', 'عائد التسويق ROI', 'معدل التحويل', 'التفاعل الرقمي']
            },
            operations: {
                name: 'العمليات',
                icon: '⚙️',
                color: '#6366f1',
                gradient: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                quickActions: [
                    { icon: 'bi-building-fill-check', label: 'بيئة العمليات', href: '/company-health.html?dept=operations', color: '#10b981' },
                    { icon: 'bi-gear-wide-connected', label: 'تحليل العمليات', href: '/dept-deep.html?dept=operations&single=1', color: '#6366f1' },
                    { icon: 'bi-link-45deg', label: 'سلسلة القيمة', href: '/tool-detail.html?code=VALUE_CHAIN&dept=operations', color: '#3b82f6' },
                    { icon: 'bi-graph-up', label: 'مؤشرات العمليات', href: '/kpis.html?dept=operations', color: '#22c55e' },
                ],
                kpiLabels: ['الكفاءة التشغيلية', 'الإنتاجية', 'وقت التسليم', 'معدل الأخطاء', 'تكلفة العملية']
            },
            sales: {
                name: 'المبيعات',
                icon: '📈',
                color: '#10b981',
                gradient: 'linear-gradient(135deg, #10b981, #22c55e)',
                quickActions: [
                    { icon: 'bi-building-fill-check', label: 'بيئة المبيعات', href: '/company-health.html?dept=sales', color: '#3b82f6' },
                    { icon: 'bi-graph-up-arrow', label: 'تحليل المبيعات', href: '/dept-deep.html?dept=sales&single=1', color: '#10b981' },
                    { icon: 'bi-person-walking', label: 'رحلة العميل', href: '/tool-detail.html?code=CUSTOMER_JOURNEY&dept=sales', color: '#ec4899' },
                    { icon: 'bi-speedometer2', label: 'مؤشرات المبيعات', href: '/kpis.html?dept=sales', color: '#22c55e' },
                ],
                kpiLabels: ['إجمالي المبيعات', 'معدل التحويل', 'متوسط قيمة الصفقة', 'نسبة العملاء المتكررين', 'دورة البيع']
            },
            compliance: {
                name: 'الامتثال والحوكمة',
                icon: '⚖️',
                color: '#ef4444',
                gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
                quickActions: [
                    { icon: 'bi-building-fill-check', label: 'بيئة الامتثال', href: '/company-health.html?dept=compliance', color: '#10b981' },
                    { icon: 'bi-shield-fill-check', label: 'فحص الامتثال', href: '/dept-deep.html?dept=compliance&single=1', color: '#ef4444' },
                    { icon: 'bi-graph-up', label: 'مؤشرات الامتثال', href: '/kpis.html?dept=compliance', color: '#22c55e' },
                    { icon: 'bi-exclamation-diamond', label: 'المخاطر', href: '/risk-map.html', color: '#f59e0b' },
                ],
                kpiLabels: ['نسبة الامتثال', 'المخالفات القائمة', 'التراخيص المحدّثة', 'تكلفة الامتثال', 'الحوكمة']
            },
            support: {
                name: 'الخدمات المساندة',
                icon: '🛠️',
                color: '#64748b',
                gradient: 'linear-gradient(135deg, #64748b, #475569)',
                quickActions: [
                    { icon: 'bi-building-fill-check', label: 'بيئة الدعم', href: '/company-health.html?dept=support', color: '#10b981' },
                    { icon: 'bi-wrench-adjustable', label: 'تحليل الخدمات', href: '/dept-deep.html?dept=support&single=1', color: '#64748b' },
                    { icon: 'bi-graph-up', label: 'المؤشرات', href: '/kpis.html?dept=support', color: '#22c55e' },
                    { icon: 'bi-kanban-fill', label: 'المبادرات', href: '/initiatives.html?dept=support', color: '#f59e0b' },
                ],
                kpiLabels: ['وقت الاستجابة', 'رضا المستخدمين', 'uptime الأنظمة', 'تكلفة الصيانة', 'مشاريع IT']
            }
        };

        const config = DEPT_CONFIG[dept];
        if (!config) return;

        // ── إرسال إشعار ترحيبي للمرة الأولى فقط ──
        const welcomeKey = 'welcome_notif_sent_' + dept;
        if (!localStorage.getItem(welcomeKey)) {
            // 1. إظهار Toast ترحيبي سريع
            if (typeof window.showToast === 'function') {
                window.showToast(`أهلاً بك في فريق ${config.name} 👋`, 'success');
            }

            // 2. إضافة إشعار دائم في مركز الإشعارات (الجرس)
            if (window.StartixNotifications) {
                window.StartixNotifications.add({
                    type: 'system',
                    title: `مرحباً بك في ${config.name} 🎉`,
                    message: `تم تخصيص هذه اللوحة والأدوات الذكية لتناسب احتياجات ومؤشرات إدارة ${config.name}. نتمنى لك تجربة قيادية ناجحة!`,
                    icon: config.emoji || '👋',
                    color: config.color || '#667eea',
                });
            }
            localStorage.setItem(welcomeKey, 'true');
        }

        // تحديث عنوان الصفحة
        document.title = `ستارتكس — لوحة ${config.name}`;

        // تحديث الهيدر
        const pageHeader = document.querySelector('.page-header h1');
        if (pageHeader) {
            pageHeader.innerHTML = `${config.icon} <span>لوحة ${config.name}</span>`;
        }

        // تحديث الترحيب
        const welcomeTitle = document.getElementById('wbTitle');
        if (welcomeTitle) {
            const userName = JSON.parse(localStorage.getItem('user') || '{}').name || '';
            welcomeTitle.textContent = userName
                ? `أهلاً ${userName}! 🎉 لوحة ${config.name} جاهزة`
                : `أهلاً بك في لوحة ${config.name}!`;
        }

        // تحديث Quick Actions
        const quickActionsEl = document.getElementById('quickActions');
        if (quickActionsEl && config.quickActions) {
            quickActionsEl.innerHTML = config.quickActions.map(a => `
        <a class="quick-action" href="${a.href}">
          <i class="bi ${a.icon}" style="color:${a.color}"></i>
          <span>${a.label}</span>
        </a>
      `).join('');
        }

        // تحديث لون الهيدر
        const welcomeHero = document.querySelector('.welcome-hero');
        if (welcomeHero) {
            welcomeHero.style.background = `linear-gradient(135deg, ${config.color}12, ${config.color}08)`;
            welcomeHero.style.borderColor = `${config.color}25`;
        }

        // تحديث ستايل العنوان
        const welTitle = document.querySelector('.welcome-title');
        if (welTitle) {
            welTitle.style.background = config.gradient;
            welTitle.style.webkitBackgroundClip = 'text';
            welTitle.style.backgroundClip = 'text';
            welTitle.style.webkitTextFillColor = 'transparent';
        }

        // تحديث رابط الخطوة 2 (التحليل العميق)
        const step2Card = document.getElementById('step2Card');
        if (step2Card) {
            step2Card.href = `/dept-deep.html?dept=${dept}&single=1`;
        }
    }

    // ══════════════════════════════════════════
    //  7. تنفيذ الفلترة عند تحميل الصفحة
    // ══════════════════════════════════════════

    function init() {
        // تطبيق الفلترة فقط في dashboard.html
        if (window.location.pathname.includes('dashboard.html') &&
            !window.location.pathname.includes('dept-dashboard') &&
            !window.location.pathname.includes('ceo-dashboard') &&
            !window.location.pathname.includes('board-dashboard') &&
            !window.location.pathname.includes('consultant-dashboard')) {
            applyFilter();
            renderLevelBadge();
        }

        // تخصيص dept-dashboard
        customizeDeptDashboard();

        // تسجيل معلومات مفيدة
        console.log(`[DashFilter] patternKey=${patternKey}, size=${size}, level=${currentLevel}`);
    }

    // انتظر DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM جاهز (defer أو بعد التحميل)
        setTimeout(init, 100); // تأخير بسيط لضمان تحميل العناصر
    }

    // ══════════════════════════════════════════
    //  8. تصدير API عام للاستخدام في صفحات أخرى
    // ══════════════════════════════════════════

    window.DashFilter = {
        patternKey: patternKey,
        size: size,
        currentLevel: currentLevel,
        LEVELS: LEVELS,
        isBasic: function () { return currentLevel === LEVELS.BASIC; },
        isStandard: function () { return currentLevel === LEVELS.STANDARD; },
        isAdvanced: function () { return currentLevel === LEVELS.ADVANCED; },
        isFull: function () { return currentLevel === LEVELS.FULL; },
        canShowSection: function (sectionId) {
            const vis = SECTION_VISIBILITY[sectionId];
            if (!vis) return true;
            return vis[idx];
        },
        getLevelConfig: function () { return LEVEL_CONFIG[currentLevel]; }
    };

})();
