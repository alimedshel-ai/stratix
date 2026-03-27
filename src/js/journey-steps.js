/**
 * ستارتكس — الملف المركزي لترتيب الرحلة الاستراتيجية
 * ═══════════════════════════════════════════════════════════
 * المصدر الوحيد (Single Source of Truth) لترتيب المراحل والأدوات.
 *
 * المنهجية: خارجي أولاً → داخلي → تركيب → اختيار → بناء → تنفيذ → متابعة
 *
 * الأدوار:
 *   OWNER / COMPANY_MANAGER / SUPER_ADMIN → يشوف كل شي (full)
 *   INVESTOR / BOARD_VIEWER               → أدوات محددة (full أو read)
 *   DEPT_MANAGER                          → أدوات إدارته فقط (full على إدارته)
 *
 * visibleTo: null = الكل يشوفه | ['OWNER','INVESTOR'] = هدول بس
 * permission: { INVESTOR: 'read' } = المستثمر يشوف بس ما يعدل
 */
(function () {
    'use strict';

    // ═══════════════════════════════════════════
    // المراحل السبع (للسايدبار)
    // ═══════════════════════════════════════════

    var phases = [
        // ── المرحلة 1: تشخيص الداخل 🏢 (أولاً — اعرف منظمتك) ──
        {
            id: 'DIAGNOSIS_INTERNAL',
            nameAr: 'تشخيص — الداخل',
            icon: 'bi-building-gear',
            emoji: '🏢',
            color: '#0d9488',
            visibleTo: null,
            items: [
                {
                    label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-building-fill-check',
                    visibleTo: null, permission: { INVESTOR: 'read' }
                },
                {
                    label: 'سلسلة القيمة', href: '/tool-detail.html?code=VALUE_CHAIN', icon: 'bi-link-45deg',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT', 'DEPT_MANAGER']
                },
                {
                    label: 'استكشاف الإدارات', href: '/dept-deep.html', icon: 'bi-diagram-3-fill',
                    visibleTo: null
                },
                {
                    label: 'القدرات الجوهرية', href: '/tool-detail.html?code=CORE_COMPETENCY', icon: 'bi-trophy-fill',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT']
                },
                {
                    label: 'DNA المنظمة', href: '/org-dna.html', icon: 'bi-fingerprint',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT']
                },
                {
                    label: 'رحلة العميل', href: '/tool-detail.html?code=CUSTOMER_JOURNEY', icon: 'bi-person-walking',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT']
                },
            ]
        },

        // ── المرحلة 2: تشخيص الخارج 🔍 (ثانياً — فهم السوق) ──
        {
            id: 'DIAGNOSIS_EXTERNAL',
            nameAr: 'تشخيص — الخارج',
            icon: 'bi-globe2',
            emoji: '🔍',
            color: '#ef4444',
            visibleTo: null, // الكل
            items: [
                {
                    label: 'PESTEL (بيئة كلية)', href: '/tool-detail.html?code=PESTEL', icon: 'bi-binoculars-fill',
                    visibleTo: null, permission: { INVESTOR: 'read', DEPT_MANAGER: 'hidden' }
                },
                {
                    label: 'قوى بورتر', href: '/tool-detail.html?code=PORTER', icon: 'bi-shield-exclamation',
                    visibleTo: null, permission: { INVESTOR: 'read', DEPT_MANAGER: 'hidden' }
                },
                {
                    label: 'المقارنة المعيارية', href: '/benchmarking.html', icon: 'bi-bar-chart-line-fill',
                    visibleTo: null, permission: { INVESTOR: 'read' }
                },
                {
                    label: 'أصحاب المصلحة', href: '/stakeholders.html', icon: 'bi-people-fill',
                    visibleTo: null, permission: { INVESTOR: 'read', DEPT_MANAGER: 'hidden' }
                },
            ]
        },

        // ── المرحلة 3: التركيب 🎯 ──
        {
            id: 'SYNTHESIS',
            nameAr: 'التركيب',
            icon: 'bi-grid-3x3-gap-fill',
            emoji: '🎯',
            color: '#22c55e',
            visibleTo: null,
            items: [
                {
                    label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap-fill',
                    visibleTo: null, permission: { INVESTOR: 'read' }
                },
                {
                    label: 'مصفوفة TOWS', href: '/tows.html', icon: 'bi-arrows-fullscreen',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT', 'DEPT_MANAGER']
                },
                {
                    label: 'خريطة المخاطر', href: '/risk-map.html', icon: 'bi-exclamation-triangle-fill',
                    visibleTo: null, permission: { INVESTOR: 'full' }
                },
                {
                    label: 'تحليل الفجوات', href: '/gap-analysis.html', icon: 'bi-arrow-left-right',
                    visibleTo: null, permission: { INVESTOR: 'read' }
                },
                {
                    label: 'التوترات الاستراتيجية', href: '/strategic-tensions.html', icon: 'bi-lightning-charge-fill',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT'],
                    permission: { INVESTOR: 'hidden', DEPT_MANAGER: 'hidden' }
                },
                {
                    label: 'الهيكل الديناميكي', href: '/dynamic-structure.html', icon: 'bi-diagram-3-fill',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT'],
                    permission: { INVESTOR: 'hidden', DEPT_MANAGER: 'hidden' }
                },
            ]
        },

        // ── المرحلة 4: الاختيار 📌 ──
        {
            id: 'DIRECTION_CHOICES',
            nameAr: 'الاختيار',
            icon: 'bi-compass-fill',
            emoji: '📌',
            color: '#8b5cf6',
            visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT', 'INVESTOR'],
            items: [
                {
                    label: 'التوجهات الاستراتيجية', href: '/directions.html', icon: 'bi-compass',
                    visibleTo: null, permission: { INVESTOR: 'read' }
                },
                {
                    label: 'مصفوفة BCG', href: '/bcg-matrix.html', icon: 'bi-star-fill',
                    visibleTo: null, permission: { INVESTOR: 'full' }
                },
                {
                    label: 'مصفوفة أنسوف', href: '/ansoff-matrix.html', icon: 'bi-graph-up-arrow',
                    visibleTo: null, permission: { INVESTOR: 'read' }
                },
                {
                    label: 'نموذج الأعمال', href: '/tool-detail.html?code=BUSINESS_MODEL', icon: 'bi-building',
                    visibleTo: null, permission: { INVESTOR: 'full' }
                },
                {
                    label: 'الخيارات الاستراتيجية', href: '/choices.html', icon: 'bi-signpost-split-fill',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT']
                },
                {
                    label: 'السيناريوهات', href: '/scenarios.html', icon: 'bi-bezier2',
                    visibleTo: null, permission: { INVESTOR: 'full' }
                },
                {
                    label: 'الآفاق الثلاثة', href: '/three-horizons.html', icon: 'bi-binoculars',
                    visibleTo: null, permission: { INVESTOR: 'read' }
                },
            ]
        },

        // ── المرحلة 5: البناء 🏆 ──
        {
            id: 'PLANNING',
            nameAr: 'البناء',
            icon: 'bi-bullseye',
            emoji: '🏆',
            color: '#38bdf8',
            visibleTo: null,
            items: [
                {
                    label: 'الأهداف (BSC)', href: '/objectives.html', icon: 'bi-bullseye',
                    visibleTo: null, permission: { INVESTOR: 'read' }
                },
                {
                    label: 'مؤشرات الأداء (KPIs)', href: '/kpis.html', icon: 'bi-speedometer2',
                    visibleTo: null, permission: { INVESTOR: 'full' }
                },
                {
                    label: 'OKRs', href: '/okrs.html', icon: 'bi-check2-circle',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT', 'DEPT_MANAGER']
                },
                {
                    label: 'OGSM', href: '/ogsm.html', icon: 'bi-file-earmark-text',
                    visibleTo: null, permission: { INVESTOR: 'read' }
                },
                {
                    label: 'خريطة الاستراتيجية', href: '/strategy-map.html', icon: 'bi-map-fill',
                    visibleTo: null, permission: { INVESTOR: 'read' }
                },
                {
                    label: 'مصفوفة الأولويات', href: '/priority-matrix.html', icon: 'bi-grid-fill',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT', 'DEPT_MANAGER']
                },
            ]
        },

        // ── المرحلة 6: التنفيذ 🚀 ──
        {
            id: 'EXECUTION',
            nameAr: 'التنفيذ',
            icon: 'bi-rocket-takeoff-fill',
            emoji: '🚀',
            color: '#f59e0b',
            visibleTo: null,
            items: [
                {
                    label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban-fill',
                    visibleTo: null, permission: { INVESTOR: 'read' }
                },
                {
                    label: 'القرارات المالية', href: '/finance-audit.html', icon: 'bi-clipboard2-pulse-fill',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT', 'INVESTOR'],
                    permission: { INVESTOR: 'full' }
                },
                {
                    label: 'خطة العمل', href: '/action-plan.html', icon: 'bi-list-check',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT', 'DEPT_MANAGER']
                },
            ]
        },

        // ── المرحلة 7: المتابعة 📊 ──
        {
            id: 'MONITORING',
            nameAr: 'المتابعة',
            icon: 'bi-bar-chart-line-fill',
            emoji: '📊',
            color: '#10b981',
            visibleTo: null,
            items: [
                {
                    label: 'المراجعات', href: '/reviews.html', icon: 'bi-journal-check',
                    visibleTo: null
                },
                {
                    label: 'التصحيحات', href: '/corrections.html', icon: 'bi-arrow-repeat',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT', 'DEPT_MANAGER']
                },
                {
                    label: 'التقارير', href: '/auto-reports.html', icon: 'bi-file-earmark-bar-graph',
                    visibleTo: null, permission: { INVESTOR: 'full' }
                },
                {
                    label: 'التقويم الاستراتيجي', href: '/strategic-calendar.html', icon: 'bi-calendar-range-fill',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT', 'DEPT_MANAGER']
                },
                {
                    label: 'مركز التعلم', href: '/learning-center.html', icon: 'bi-journal-bookmark-fill',
                    visibleTo: ['OWNER', 'COMPANY_MANAGER', 'CONSULTANT']
                },
            ]
        },
    ];

    // ═══════════════════════════════════════════
    // خطوات الداشبورد ("خطواتك القادمة")
    // ═══════════════════════════════════════════

    var dashboardSteps = [
        // ── 1. تشخيص الداخل أولاً ──
        {
            key: 'internal_env_completed',
            check: function () { return localStorage.getItem('internal_env_completed') === 'true'; },
            icon: 'bi-building-fill-check', iconBg: '#f0fdfa', iconColor: '#0d9488',
            title: 'صحة الشركة',
            desc: 'قيّم الموارد والقدرات الداخلية للمنشأة — تقييم شامل',
            link: '/company-health.html', priority: 1
        },
        {
            key: 'value_chain_completed',
            check: function () { return localStorage.getItem('value_chain_completed') === 'true'; },
            icon: 'bi-link-45deg', iconBg: '#ecfdf5', iconColor: '#059669',
            title: 'سلسلة القيمة',
            desc: 'حلل أنشطتك الأساسية والمساندة — أين تخلق القيمة؟',
            link: '/tool-detail.html?code=VALUE_CHAIN', priority: 2
        },
        {
            key: 'stratix_dept_deep_payload',
            check: function () {
                var d = JSON.parse(localStorage.getItem('stratix_dept_deep_payload') || '{}');
                return Object.keys(d).some(function (k) { return d[k] && d[k].completed; });
            },
            icon: 'bi-diagram-3-fill', iconBg: '#eef2ff', iconColor: '#667eea',
            title: 'استكشاف الإدارات',
            desc: 'حلّل كل إدارة بالتفصيل — البيئة الداخلية للمنشأة',
            link: '/dept-deep.html', priority: 3
        },
        // ── 2. تشخيص الخارج ثانياً ──
        {
            key: 'pestel_completed',
            check: function () { return localStorage.getItem('pestel_completed') === 'true'; },
            icon: 'bi-binoculars-fill', iconBg: '#fef2f2', iconColor: '#ef4444',
            title: 'PESTEL (بيئة كلية)',
            desc: 'ادرس البيئة الخارجية: سياسية، اقتصادية، اجتماعية، تقنية',
            link: '/tool-detail.html?code=PESTEL', priority: 4
        },
        {
            key: 'porter_completed',
            check: function () { return localStorage.getItem('porter_completed') === 'true'; },
            icon: 'bi-shield-exclamation', iconBg: '#fff7ed', iconColor: '#ea580c',
            title: 'قوى بورتر',
            desc: 'حلّل القوى التنافسية الخمس في سوقك',
            link: '/tool-detail.html?code=PORTER', priority: 5
        },
        // ── 3. التركيب ──
        {
            key: 'swot_completed',
            check: function () { return localStorage.getItem('swot_completed') === 'true'; },
            icon: 'bi-grid-3x3-gap-fill', iconBg: '#f0fdf4', iconColor: '#16a34a',
            title: 'تحليل SWOT',
            desc: 'لخّص نتائج التحليل: قوة، ضعف، فرص، تهديدات',
            link: '/swot.html', priority: 6
        },
        // ── 4. الاختيار ──
        {
            key: 'stratix_identity_payload',
            check: function () { return !!localStorage.getItem('stratix_identity_payload'); },
            icon: 'bi-compass', iconBg: '#faf5ff', iconColor: '#9333ea',
            title: 'التوجهات الاستراتيجية',
            desc: 'حدد الرؤية والرسالة والتوجهات المؤسسية',
            link: '/directions.html', priority: 7
        },
        // ── 5. البناء ──
        {
            key: 'objectives_saved',
            check: function () { return localStorage.getItem('objectives_saved') === 'true'; },
            icon: 'bi-bullseye', iconBg: '#eff6ff', iconColor: '#2563eb',
            title: 'الأهداف الاستراتيجية',
            desc: 'حدد أهدافك الاستراتيجية عبر منظورات BSC',
            link: '/objectives.html', priority: 8
        },
        {
            key: 'kpis_created',
            check: function () { return !!localStorage.getItem('kpis_created'); },
            icon: 'bi-speedometer2', iconBg: '#f0fdf4', iconColor: '#16a34a',
            title: 'مؤشرات الأداء (KPIs)',
            desc: 'اربط مؤشرات قياس لكل هدف استراتيجي',
            link: '/kpis.html', priority: 9
        },
        // ── 6. التنفيذ ──
        {
            key: 'initiatives_created',
            check: function () { return !!localStorage.getItem('initiatives_created'); },
            icon: 'bi-rocket-takeoff', iconBg: '#fefce8', iconColor: '#ca8a04',
            title: 'المبادرات والمشاريع',
            desc: 'أنشئ مبادرات تنفيذية مرتبطة بالأهداف',
            link: '/initiatives.html', priority: 10
        },
        {
            key: 'finance_audit_done',
            check: function () { return localStorage.getItem('finance_audit_done') === 'true'; },
            icon: 'bi-clipboard2-pulse-fill', iconBg: '#fef9c3', iconColor: '#a16207',
            title: 'القرارات المالية',
            desc: 'قيّم الجدوى المالية وخصص الميزانيات',
            link: '/finance-audit.html', priority: 11
        },
    ];


    // ═══════════════════════════════════════════
    // الأدوات الحرة (متاحة عند الحاجة)
    // ═══════════════════════════════════════════
    var freeTools = [
        { label: 'مصفوفة أيزنهاور', href: '/tool-detail.html?code=EISENHOWER', icon: 'bi-fire' },
        { label: 'تحليل باريتو 80/20', href: '/tool-detail.html?code=PARETO', icon: 'bi-funnel-fill' },
        { label: 'مصفوفة RACI', href: '/raci-matrix.html', icon: 'bi-people-fill' },
        { label: 'مخطط جانت', href: '/gantt-chart.html', icon: 'bi-calendar-range' },
    ];

    // ═══════════════════════════════════════════
    // دالة الفلترة حسب الدور
    // ═══════════════════════════════════════════
    function filterForRole(userType) {
        // OWNER, COMPANY_MANAGER, SUPER_ADMIN, CONSULTANT → كل شي
        if (!userType || userType === 'OWNER' || userType === 'COMPANY_MANAGER' ||
            userType === 'SUPER_ADMIN' || userType === 'CONSULTANT') {
            return phases;
        }

        // INVESTOR / BOARD_VIEWER → فلتر
        // DEPT_MANAGER → فلتر
        return phases.map(function (phase) {
            // فلتر المرحلة نفسها
            if (phase.visibleTo && phase.visibleTo.indexOf(userType) === -1) return null;

            // فلتر الأدوات داخل المرحلة
            var filteredItems = phase.items.filter(function (item) {
                if (!item.visibleTo) return true; // null = الكل
                return item.visibleTo.indexOf(userType) !== -1;
            }).filter(function (item) {
                // أخفي الأدوات اللي permission = 'hidden'
                if (item.permission && item.permission[userType] === 'hidden') return false;
                return true;
            });

            if (filteredItems.length === 0) return null;

            return {
                id: phase.id,
                nameAr: phase.nameAr,
                icon: phase.icon,
                emoji: phase.emoji,
                color: phase.color,
                items: filteredItems,
            };
        }).filter(Boolean);
    }

    // ═══════════════════════════════════════════
    // Export
    // ═══════════════════════════════════════════
    window.StratixJourney = {
        phases: phases,
        dashboardSteps: dashboardSteps,
        freeTools: freeTools,
        filterForRole: filterForRole,
    };
})();
