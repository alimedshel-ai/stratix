/**
 * ═══════════════════════════════════════════════════════
 * Stratix Path Tracker — جمع بيانات المسارات بدون تغيير UX
 * ═══════════════════════════════════════════════════════
 *
 * يتتبع:
 *   1. completion rate — كم خطوة أكملها المستخدم
 *   2. time_per_step — كم وقت قضى في كل خطوة
 *   3. drop_off — وين توقف ولا رجع
 *   4. jumps — هل قفز خطوات (بدون تسلسل)
 *   5. return_visits — هل رجع لنفس الخطوة
 *
 * الملف يُضاف لكل صفحة أداة (swot, gap, kpis, etc.)
 * ولا يغيّر أي شي في الـ UX
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'stratix_path_tracking';
    const SESSION_KEY = 'stratix_tracking_session';

    // ═══ تحديد المسار والخطوة الحالية تلقائياً ═══
    const PAGE_MAP = {
        // مسار 1: رحلة المدير (4 خطوات)
        '/internal-env': { path: 'manager_journey', step: 1, name: 'البيئة الداخلية' },
        '/internal-env.html': { path: 'manager_journey', step: 1, name: 'البيئة الداخلية' },
        '/swot': { path: 'manager_journey', step: 2, name: 'SWOT' },
        '/swot.html': { path: 'manager_journey', step: 2, name: 'SWOT' },
        '/directions': { path: 'manager_journey', step: 3, name: 'التوجهات' },
        '/directions.html': { path: 'manager_journey', step: 3, name: 'التوجهات' },
        '/kpis': { path: 'manager_journey', step: 4, name: 'KPIs' },
        '/kpis.html': { path: 'manager_journey', step: 4, name: 'KPIs' },

        // مسار 2: الإنقاذ المالي (6 خطوات)
        '/break-even-result': { path: 'rescue_path', step: 1, name: 'نقطة التعادل' },
        '/break-even-result.html': { path: 'rescue_path', step: 1, name: 'نقطة التعادل' },
        '/gap-analysis': { path: 'rescue_path', step: 3, name: 'تحليل الفجوات' },
        '/gap-analysis.html': { path: 'rescue_path', step: 3, name: 'تحليل الفجوات' },
        '/priority-matrix': { path: 'rescue_path', step: 4, name: 'مصفوفة الأولويات' },
        '/priority-matrix.html': { path: 'rescue_path', step: 4, name: 'مصفوفة الأولويات' },
        '/initiatives': { path: 'rescue_path', step: 5, name: 'مبادرات الطوارئ' },
        '/initiatives.html': { path: 'rescue_path', step: 5, name: 'مبادرات الطوارئ' },
        '/okrs': { path: 'rescue_path', step: 6, name: 'OKRs إنقاذ' },
        '/okrs.html': { path: 'rescue_path', step: 6, name: 'OKRs إنقاذ' },
        '/rescue-path': { path: 'rescue_path', step: 0, name: 'لوحة الإنقاذ' },
        '/rescue-path.html': { path: 'rescue_path', step: 0, name: 'لوحة الإنقاذ' },

        // صفحات مشتركة
        '/dept-dashboard': { path: 'manager_journey', step: 0, name: 'لوحة المدير' },
        '/dept-dashboard.html': { path: 'manager_journey', step: 0, name: 'لوحة المدير' },
    };

    // ═══ الدوال الأساسية ═══

    function getData() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (e) { return {}; }
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function getSession() {
        try {
            return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
        } catch (e) { return {}; }
    }

    function saveSession(sess) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    }

    function now() {
        return Date.now();
    }

    function today() {
        return new Date().toISOString().split('T')[0];
    }

    // ═══ التعرف على الصفحة الحالية ═══

    function detectPage() {
        const path = window.location.pathname;
        // Try exact match first
        if (PAGE_MAP[path]) return PAGE_MAP[path];
        // Try without trailing slash
        const clean = path.replace(/\/$/, '');
        if (PAGE_MAP[clean]) return PAGE_MAP[clean];
        // Check for rescue mode in SWOT
        if ((path === '/swot' || path === '/swot.html') && window.location.search.includes('mode=rescue')) {
            return { path: 'rescue_path', step: 2, name: 'Quick SWOT' };
        }
        return null;
    }

    // ═══ تسجيل الدخول للصفحة ═══

    function trackPageEnter(pageInfo) {
        const data = getData();
        const pathKey = pageInfo.path;

        // Initialize path if needed
        if (!data[pathKey]) {
            data[pathKey] = {
                firstVisit: now(),
                visits: [],
                steps: {},
                completions: {},
                totalSessions: 0,
                dropOffs: {},
                jumps: []
            };
        }

        const pathData = data[pathKey];
        pathData.totalSessions = (pathData.totalSessions || 0) + 1;
        pathData.lastVisit = now();

        // Initialize step data
        const stepKey = 'step_' + pageInfo.step;
        if (!pathData.steps[stepKey]) {
            pathData.steps[stepKey] = {
                name: pageInfo.name,
                firstVisit: now(),
                visitCount: 0,
                totalTimeMs: 0,
                completed: false,
                completedAt: null
            };
        }

        const stepData = pathData.steps[stepKey];
        stepData.visitCount = (stepData.visitCount || 0) + 1;
        stepData.lastVisit = now();

        // Record visit
        pathData.visits.push({
            step: pageInfo.step,
            name: pageInfo.name,
            at: now(),
            date: today()
        });

        // Keep only last 100 visits
        if (pathData.visits.length > 100) {
            pathData.visits = pathData.visits.slice(-100);
        }

        // Detect jump (skipped steps)
        const sess = getSession();
        if (sess.lastStep !== undefined && pageInfo.step > 0) {
            const expectedNext = sess.lastStep + 1;
            if (pageInfo.step > expectedNext && sess.lastPath === pathKey) {
                pathData.jumps.push({
                    from: sess.lastStep,
                    to: pageInfo.step,
                    at: now()
                });
            }
        }

        // Update session
        saveSession({
            lastStep: pageInfo.step,
            lastPath: pathKey,
            enterTime: now(),
            pageName: pageInfo.name
        });

        saveData(data);
    }

    // ═══ تسجيل الخروج من الصفحة ═══

    function trackPageExit(pageInfo) {
        const sess = getSession();
        if (!sess.enterTime) return;

        const timeSpent = now() - sess.enterTime;
        const data = getData();
        const pathKey = pageInfo.path;

        if (data[pathKey] && data[pathKey].steps) {
            const stepKey = 'step_' + pageInfo.step;
            if (data[pathKey].steps[stepKey]) {
                data[pathKey].steps[stepKey].totalTimeMs =
                    (data[pathKey].steps[stepKey].totalTimeMs || 0) + timeSpent;
                data[pathKey].steps[stepKey].lastTimeMs = timeSpent;
            }

            // Check for drop-off (time < 10 seconds = probable bounce)
            if (timeSpent < 10000 && pageInfo.step > 0) {
                const dropKey = 'step_' + pageInfo.step;
                data[pathKey].dropOffs[dropKey] =
                    (data[pathKey].dropOffs[dropKey] || 0) + 1;
            }
        }

        saveData(data);
    }

    // ═══ تسجيل إكمال خطوة (تُستدعى يدوياً من الصفحات) ═══

    window.stratixTrackComplete = function (stepOverride) {
        const pageInfo = detectPage();
        if (!pageInfo) return;

        const step = stepOverride || pageInfo.step;
        const data = getData();
        const pathKey = pageInfo.path;

        if (!data[pathKey]) return;

        const stepKey = 'step_' + step;
        if (data[pathKey].steps[stepKey]) {
            data[pathKey].steps[stepKey].completed = true;
            data[pathKey].steps[stepKey].completedAt = now();
        }

        // Update completions summary
        if (!data[pathKey].completions) data[pathKey].completions = {};
        data[pathKey].completions[stepKey] = {
            at: now(),
            date: today()
        };

        saveData(data);

        // Also mark rescue step if applicable
        if (pageInfo.path === 'rescue_path' && step > 0) {
            const rescueStepIds = ['', 'breakeven', 'quickswot', 'gap', 'priority', 'initiatives', 'okrs'];
            if (rescueStepIds[step]) {
                localStorage.setItem('rescue_' + rescueStepIds[step] + '_done', Date.now());
            }
        }
    };

    // ═══ قراءة التقرير (للتحليل) ═══

    window.stratixTrackingReport = function () {
        const data = getData();
        const report = {};

        Object.keys(data).forEach(pathKey => {
            const p = data[pathKey];
            const steps = p.steps || {};
            const stepKeys = Object.keys(steps).sort();
            const totalSteps = pathKey === 'manager_journey' ? 4 : 6;

            const completedSteps = stepKeys.filter(k => steps[k].completed).length;
            const totalVisits = stepKeys.reduce((sum, k) => sum + (steps[k].visitCount || 0), 0);
            const totalTimeMin = stepKeys.reduce((sum, k) => sum + (steps[k].totalTimeMs || 0), 0) / 60000;

            // Find drop-off point
            let dropOffStep = null;
            for (let i = 1; i <= totalSteps; i++) {
                const sk = 'step_' + i;
                if (!steps[sk] || !steps[sk].completed) {
                    dropOffStep = i;
                    break;
                }
            }

            report[pathKey] = {
                name: pathKey === 'manager_journey' ? 'رحلة المدير (4 خطوات)' : 'مسار الإنقاذ (6 خطوات)',
                completionRate: Math.round((completedSteps / totalSteps) * 100) + '%',
                completedSteps: completedSteps + '/' + totalSteps,
                totalVisits: totalVisits,
                totalTimeMinutes: Math.round(totalTimeMin * 10) / 10,
                avgTimePerStep: Math.round((totalTimeMin / Math.max(1, totalVisits)) * 10) / 10 + ' دقيقة',
                dropOffAt: dropOffStep ? 'الخطوة ' + dropOffStep : 'مكتمل ✅',
                jumps: (p.jumps || []).length,
                bounces: Object.values(p.dropOffs || {}).reduce((a, b) => a + b, 0),
                firstVisit: p.firstVisit ? new Date(p.firstVisit).toLocaleDateString('ar-SA') : '—',
                lastVisit: p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('ar-SA') : '—',
                stepDetails: {}
            };

            stepKeys.forEach(sk => {
                const s = steps[sk];
                report[pathKey].stepDetails[sk] = {
                    name: s.name,
                    visits: s.visitCount,
                    timeMinutes: Math.round((s.totalTimeMs || 0) / 60000 * 10) / 10,
                    completed: s.completed ? '✅' : '❌',
                    bounces: p.dropOffs?.[sk] || 0
                };
            });
        });

        console.log('═══ Stratix Path Tracking Report ═══');
        console.table(report);
        Object.keys(report).forEach(k => {
            console.log('\n📊 ' + report[k].name);
            console.table(report[k].stepDetails);
        });

        return report;
    };

    // ═══ Boot ═══

    const pageInfo = detectPage();
    if (pageInfo) {
        trackPageEnter(pageInfo);

        // Track exit on page leave
        window.addEventListener('beforeunload', () => {
            trackPageExit(pageInfo);
        });

        // Track exit on visibility change (mobile)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) trackPageExit(pageInfo);
        });

        // Log for debugging
        console.log('[Tracker] 📍 ' + pageInfo.name + ' (مسار: ' + pageInfo.path + ', خطوة: ' + pageInfo.step + ')');
    }

})();
