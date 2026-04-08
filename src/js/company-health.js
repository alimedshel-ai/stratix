/**
 * company-health.js — صحة الشركة
 * Extracted from company-health.html for maintainability
 * v1.0.0
 */
(function () {
    'use strict';

    // ═══ Event Delegation (CSP Safe) ═══
    document.body.addEventListener('click', function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        switch (action) {
            case 'wiz-select':
                selectWizAnswer(parseInt(target.dataset.qi), parseInt(target.dataset.val));
                break;
            case 'wiz-next':
                nextWizQ();
                break;
            case 'wiz-prev':
                prevWizQ();
                break;
            case 'wiz-finish':
                finishWizDept();
                break;
            case 'wiz-cancel':
                cancelWizDept();
                break;
            case 'wiz-start':
                startWizDept(target.dataset.dept);
                break;
            case 'dept-navigate':
                window.location.href = target.dataset.href;
                break;
            case 'dept-mode-summary':
                setDeptMode('summary');
                break;
            case 'dept-mode':
                setDeptMode(target.dataset.mode);
                break;
        }
    });

    // ==================== الإعدادات العامة ====================
    // ⚠️ القائمة الموحدة — هذه هي المرجع لكل أجزاء المنصة
    const DEPTS = [
        { key: 'compliance', label: 'الامتثال', icon: '⚖️', color: '#ef4444' },
        { key: 'finance', label: 'المالية', icon: '💰', color: '#f59e0b' },
        { key: 'sales', label: 'المبيعات', icon: '📈', color: '#10b981' },
        { key: 'hr', label: 'الموارد البشرية', icon: '👥', color: '#3b82f6' },
        { key: 'marketing', label: 'التسويق', icon: '📣', color: '#8b5cf6' },
        { key: 'operations', label: 'العمليات', icon: '⚙️', color: '#6366f1' },
        { key: 'it', label: 'تقنية المعلومات', icon: '💻', color: '#06b6d4' },
        { key: 'support', label: 'الخدمات المساندة', icon: '🛠️', color: '#64748b' },
        { key: 'governance', label: 'الحوكمة', icon: '🏛️', color: '#8b5cf6' },
        { key: 'quality', label: 'الجودة', icon: '✅', color: '#10b981' },
        { key: 'cs', label: 'خدمة العملاء', icon: '🎧', color: '#3b82f6' },
    ];

    // مراحل النمو حسب حجم الشركة (للإدارات)
    const SIZE_DEPTS = {
        small: DEPTS.map(d => d.key), // عرض كافة الإدارات السبع دائماً بناءً على رغبة المالك
        medium: DEPTS.map(d => d.key), // 7 إدارات
        large: DEPTS.map(d => d.key)  // 7 إدارات فأكثر
    };

    const AXIS_MAP = {
        compliance: 'تنظيمي', finance: 'مالي', sales: 'قطاعي',
        hr: 'عمالة', marketing: 'قطاعي', operations: 'إداري', support: 'إداري',
        it: 'تقني', governance: 'حوكمة', quality: 'جودة', cs: 'عملاء',
    };

    // ==================== قراءة البيانات الموحدة ====================
    function calculateScoreFromDeepData(data) {
        if (!data) return null;
        let yes = 0, partial = 0, total = 0;
        Object.keys(data).forEach(k => {
            if (k === 'meta' || k.includes('metadata') || k.startsWith('_')) return;
            const val = data[k];
            if (val === 'yes') { yes++; total++; }
            else if (val === 'partial') { partial++; total++; }
            else if (val === 'no') { total++; }
        });
        if (total === 0) return null;
        return Math.round(((yes + (partial * 0.5)) / total) * 100);
    }

    function resolveDeepResults(key) {
        // الأولوية 1: الكونتيكست الجديد (DEEP_ANALYSIS_HR)
        let data = window.Context ? Context.getItem('DEEP_ANALYSIS_' + key.toUpperCase(), null) : null;

        // أولوية 2: LocalStorage الجديد (stratix_hr_deep_data)
        if (!data) {
            try { data = JSON.parse(localStorage.getItem('stratix_' + key.toLowerCase() + '_deep_data') || 'null'); } catch (e) { }
        }

        // أولوية 3: LocalStorage البديل (stratix_hr_DEEP_ANALYSIS)
        if (!data) {
            try { data = JSON.parse(localStorage.getItem('stratix_' + key.toLowerCase() + '_DEEP_ANALYSIS') || 'null'); } catch (e) { }
        }

        // أولوية 4: الكونتيكست القديم (hr_deep_results)
        if (!data) {
            data = window.Context ? Context.getItem(key.toLowerCase() + '_deep_results', null) : null;
        }

        // أولوية 5: LocalStorage القديم (hrDeepResults)
        if (!data) {
            try { data = JSON.parse(localStorage.getItem(key.toLowerCase() + 'DeepResults') || 'null'); } catch (e) { }
        }

        if (!data) return null;

        // لو كان كائن يحتوي على score جاهز (القديم)
        if (data.score != null) return data;

        // لو كان بيانات خام (الجديد)، نحسب النتيجة
        const score = calculateScoreFromDeepData(data);
        if (score === null) return null;

        return {
            score,
            data,
            updatedAt: data._updatedAt || new Date().toISOString()
        };
    }

    // ── حساب نقاط التقييم الوصفي (audit) ──
    function calculateAuditScore(auditState) {
        if (!auditState || typeof auditState !== 'object') return null;
        const items = Object.values(auditState).filter(v => v && v.val !== undefined && v.val !== '');
        if (items.length === 0) return null;
        const score = items.reduce((acc, v) => acc + (3 - parseInt(v.val || 3)), 0);
        return Math.round((score / (items.length * 3)) * 100);
    }

    // ── قراءة بيانات التقييم الوصفي (audit) لكل إدارة ──
    function resolveAuditData(key) {
        const K = key.toUpperCase();
        let data = null;

        // أولوية 1: Context بمفتاح AUDIT_HR
        if (window.Context) data = Context.getItem(`AUDIT_${K}`, null);

        // أولوية 2: LocalStorage مباشرة
        if (!data) {
            try { data = JSON.parse(localStorage.getItem(`AUDIT_${K}`) || 'null'); } catch (e) { }
        }

        // أولوية 3: مفتاح قديم AUDIT (generic)
        if (!data && window.Context) {
            const generic = Context.getItem('AUDIT', null);
            if (generic && generic._dept === key) data = generic;
        }

        // أولوية 4: LocalStorage قديم
        if (!data) {
            try { data = JSON.parse(localStorage.getItem(`stratix_${key}_audit_v2`) || 'null'); } catch (e) { }
        }

        // أولوية 5: مفتاح DeptPage بـ userId (stratix_uid_dept_AUDIT_DEPT)
        if (!data) {
            const uid = window._cachedUser?.id || window.__currentUser?.id || 'local';
            const K2 = key.toUpperCase();
            try { data = JSON.parse(localStorage.getItem(`stratix_${uid}_${key.toLowerCase()}_AUDIT_${K2}`) || 'null'); } catch (e) { }
        }

        // أولوية 6: بحث شامل في localStorage عن أي مفتاح يحتوي على _dept_AUDIT_DEPT
        // يغطي مفاتيح Context المُعزَّزة: ent_entityId_compliance_AUDIT_COMPLIANCE
        if (!data) {
            const suffix = `_${key.toLowerCase()}_AUDIT_${K}`;
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const lk = localStorage.key(i);
                    if (lk && lk.endsWith(suffix)) {
                        const parsed = JSON.parse(localStorage.getItem(lk) || 'null');
                        if (parsed && typeof parsed === 'object') { data = parsed; break; }
                    }
                }
            } catch (e) { }
        }

        if (!data) return null;

        const score = calculateAuditScore(data);
        if (score === null) return null;

        const strengths = Object.values(data).filter(v => v && (v.val === '0' || v.val === '1')).map(v => v.label || '');
        const weaknesses = Object.values(data).filter(v => v && (v.val === '2' || v.val === '3')).map(v => v.label || '');

        return { score, strengths, weaknesses, raw: data, updatedAt: new Date().toISOString() };
    }

    // ── بناء المخرج المدمج لكل إدارة ──
    function buildIntegrated(key) {
        const deep = resolveDeepResults(key);
        const audit = resolveAuditData(key);

        if (!deep && !audit) return null;

        const deepScore = deep?.score ?? null;
        const auditScore = audit?.score ?? null;

        // المخرج المدمج: متوسط مرجح (deep 40% + audit 60%)
        let overallScore = null;
        if (deepScore != null && auditScore != null)
            overallScore = Math.round(deepScore * 0.4 + auditScore * 0.6);
        else if (deepScore != null) overallScore = deepScore;
        else if (auditScore != null) overallScore = auditScore;

        const budgetDone = !!localStorage.getItem(`BUDGET_${key.toUpperCase()}_completed`);

        return {
            deepScore,
            auditScore,
            overallScore,
            strengths: audit?.strengths || [],
            weaknesses: audit?.weaknesses || [],
            completedSteps: [
                deep       ? 'deep'   : null,
                audit      ? 'audit'  : null,
                budgetDone ? 'budget' : null,
            ].filter(Boolean),
        };
    }

    function loadUnifiedHealth() {
        // محاولة قراءة الكائن الموحد الجديد
        let health = window.Context ? Context.getItem('company_health', null) : JSON.parse(localStorage.getItem('stratix_company_health') || 'null');
        if (health) {
            // ملاحظة: النتيجة (score) تأتي في الأساس من API
            // ولكن للمزامنة السريعة، نقرأ من الـ local data المكتشف
            const deptDeep = window.Context ? Context.getItem('dept_deep_payload', {}) : JSON.parse(localStorage.getItem('stratix_dept_deep_payload') || '{}');
            DEPTS.forEach(dept => {
                const d = deptDeep[dept.key] || {};
                if (Object.keys(d).length > 0) {
                    health.departments[dept.key] = {
                        score: health.departments[dept.key]?.score || null,
                        answers: d.answers || health.departments[dept.key]?.answers || {},
                        manager: d.deptManagerInfo || health.departments[dept.key]?.manager || {},
                        challenges: d.challenges || health.departments[dept.key]?.challenges || [],
                        goals: d.goals || health.departments[dept.key]?.goals || [],
                        completed: health.departments[dept.key]?.completed || false
                    };
                }
            });

            // مزامنة مستمرة دائمًا لكل الإدارات — deep + audit + مخرج مدمج
            DEPTS.forEach(dept => {
                const key = dept.key;
                const integrated = buildIntegrated(key);
                if (!integrated) return;

                if (!health.deepAnalysis[key]) health.deepAnalysis[key] = {};
                health.deepAnalysis[key] = { ...health.deepAnalysis[key], score: integrated.deepScore };

                if (!health.departments[key]) health.departments[key] = {};
                // المخرج المدمج يُغذّي القمع مباشرة
                health.departments[key].score = integrated.overallScore;
                health.departments[key].deepScore = integrated.deepScore;
                health.departments[key].auditScore = integrated.auditScore;
                health.departments[key].overallScore = integrated.overallScore;
                health.departments[key].strengths = integrated.strengths;
                health.departments[key].weaknesses = integrated.weaknesses;
                health.departments[key].completedSteps = integrated.completedSteps;
                health.departments[key].completed = integrated.completedSteps.length >= 2;
                health.departments[key].answers = health.departments[key].answers || { completed: true };
            });

            saveUnifiedHealth(health);
            return health;
        }

        // إذا لم يوجد، نقوم بترحيل البيانات القديمة (migration)
        return migrateOldData();
    }

    function migrateOldData() {
        console.log('ترحيل البيانات القديمة إلى الكيان الموحد...');
        const health = {
            sizeCategory: 'medium', // default
            overallScore: null,
            completedTabs: [],
            departments: {},
            valueChain: { completed: false, primary: {}, support: {} },
            deepAnalysis: {},
            lastUpdated: new Date().toISOString(),
            version: '2.0'
        };

        // 1. الحجم من painAmbition + نتائج تشخيص المالك (Strategic Path)
        const paStr = window.Context ? JSON.stringify(Context.getItem('pain_ambition', {})) : (localStorage.getItem('painAmbition') || '{}');
        const pa = JSON.parse(paStr);
        health.sizeCategory = pa.sizeCategory || 'medium';
        const ownerAnswers = pa.diagnosticAnswers || {};

        // 2. ترحيل بيانات الإدارات — مع تمييز المصدر
        DEPTS.forEach(dept => {
            // أولوية 1: نتيجة تشخيص المالك (Strategic Score)
            const ownerScore = ownerAnswers[dept.key + 'Score'] || ownerAnswers[dept.key + '_score'];

            // أولوية 2: الفحص العميق (قد يكون من المدير أو المالك) بأي مفتاح
            const deep = resolveDeepResults(dept.key);

            health.departments[dept.key] = {
                score: ownerScore != null ? parseFloat(ownerScore) : (deep?.score || null),
                source: ownerScore != null ? 'STRATEGIC' : (deep ? 'OPERATIONAL' : 'NONE'),
                lastReport: deep?.updatedAt || null,
                manager: deep?.managerName || '—',
                deepScore: deep?.score || null
            };

            if (deep) {
                if (!health.deepAnalysis[dept.key]) health.deepAnalysis[dept.key] = {};
                health.deepAnalysis[dept.key] = deep;
            }
        });

        // حفظ الكيان الموحد
        if (window.Context) { Context.setItem('company_health', health); } else { localStorage.setItem('stratix_company_health', JSON.stringify(health)); }
        return health;
    }

    function saveUnifiedHealth(health) {
        if (window.Context) {
            Context.setItem('company_health', health);
        } else {
            localStorage.setItem('stratix_company_health', JSON.stringify(health));
        }
    }

    const healthData = loadUnifiedHealth();
    const sizeCategory = healthData.sizeCategory; // 'small', 'medium', 'large'

    // اسم الشركة من التشخيص القديم (أو من health)
    const diagPayload = window.Context ? Context.getItem('diagnostic_payload', null) : JSON.parse(localStorage.getItem('stratix_diagnostic_payload') || 'null');
    const companyName = diagPayload?.company?.name || (window.Context ? Context.getItem('company_name', '') : localStorage.getItem('stratix_company_name')) || '';
    if (companyName) {
        document.getElementById('companyName').textContent = `${companyName} — تحليل متكامل حسب حجم المنشأة`;
    }

    // ==================== دعم URL Parameters وربط دور مدير الإدارة ====================
    const urlParams = new URLSearchParams(window.location.search);
    try {
        const _user = JSON.parse(localStorage.getItem('user'));
        if (!urlParams.get('dept') && _user && (_user.userType === 'DEPT_MANAGER' || _user.userCategory === 'DEPT_MANAGER')) {
            const matchedDept = _user.department?.key || _user.userCategory.replace('DEPT_', '').toLowerCase();
            if (matchedDept) {
                urlParams.set('dept', matchedDept);
                // Update visual URL without reloading so sharing links work correctly
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('dept', matchedDept);
                window.history.replaceState({}, '', newUrl);
            }
        }
    } catch (e) { }

    const requestedTab = urlParams.get('tab') || 'overview';
    const _finalDept = urlParams.get('dept');
    const isDeptMode = !!_finalDept;

    // ==================== تخصيص العناوين للمدير ====================
    if (isDeptMode) {
        const _dt = DEPTS.find(d => d.key === _finalDept);
        if (_dt) {
            document.title = `ستارتكس — صحة إدارة ${_dt.label}`;
            const cName = document.getElementById('companyName');
            if (cName) cName.innerHTML = `<i class="bi bi-diagram-3-fill"></i> لوحة عمل إدارة ${_dt.label}`;

            const heroP = document.querySelector('.company-health-desc');
            if (heroP) heroP.textContent = `تحليل شامل لإدارة ${_dt.label} من الفحص إلى الخطة`;
        }
    }

    // ==================== بناء التبويبات ====================
    const tabs = [
        { id: 'overview', label: 'نظرة عامة', icon: 'bi-eye-fill', condition: !isDeptMode },
        { id: 'departments', label: isDeptMode ? 'التقييم التشغيلي' : 'الإدارات', icon: 'bi-grid-3x3-gap-fill', always: true },
        { id: 'deep', label: 'تعمق', icon: 'bi-search-heart', condition: sizeCategory === 'large' && !isDeptMode }
    ];

    const tabsContainer = document.getElementById('tabsContainer');
    tabsContainer.innerHTML = '';

    // تحديد التبويب الافتراضي (من URL أو أول تبويب متاح)
    const availableTabs = tabs.filter(t => t.condition !== false);
    const fallbackTab = availableTabs.length > 0 ? availableTabs[0].id : 'overview';
    const defaultTab = availableTabs.find(t => t.id === requestedTab) ? requestedTab : fallbackTab;

    tabs.forEach(tab => {
        if (tab.condition === false) return; // لا يظهر
        const btn = document.createElement('button');
        btn.className = `tab-btn ${tab.id === defaultTab ? 'active' : ''}`;
        btn.setAttribute('data-tab', tab.id);
        btn.innerHTML = `<i class="bi ${tab.icon}"></i> ${tab.label}`;
        btn.addEventListener('click', () => switchTab(tab.id));
        tabsContainer.appendChild(btn);
    });

    // إخفاء كل التبويبات وإظهار المطلوب
    function switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        const tabEl = document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
        if (tabEl) tabEl.classList.add('active');

        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // تحديث URL بدون reload
        const url = new URL(window.location);
        url.searchParams.set('tab', tabId);
        history.replaceState(null, '', url);

        if (tabId === 'overview') renderOverview();
        else if (tabId === 'departments') renderDepartments();
        else if (tabId === 'deep') renderDeep();
    }

    // ==================== دالات مساعدة ====================
    function getDeptScore(key) {
        return healthData.departments[key]?.score ?? null;
    }

    function scoreColor(s) {
        if (s == null) return 'var(--text-muted)';
        return s >= 70 ? 'var(--green)' : s >= 45 ? 'var(--yellow)' : 'var(--red)';
    }

    function scoreStatus(s) {
        if (s == null) return { text: 'لم يُقيّم', cls: 'empty' };
        if (s >= 70) return { text: '🟢 جيد', cls: 'completed' };
        if (s >= 45) return { text: '🟡 يحتاج تطوير', cls: 'pending' };
        return { text: '🔴 حرج', cls: 'pending' };
    }

    // 🛡️ دالة ذكية لتوجيه الإدارات ذات الصفحات المخصصة
    function getDeptDeepLink(deptKey) {
        const customPages = ['hr', 'finance', 'marketing', 'sales', 'operations', 'compliance', 'it', 'projects', 'support', 'quality', 'governance', 'cs'];
        return customPages.includes(deptKey) ? `/${deptKey}-deep.html` : `/dept-deep.html?dept=${deptKey}`;
    }

    // ==================== عرض النظرة العامة (Overview) ====================
    function renderOverview() {
        const deptsThisSize = SIZE_DEPTS[sizeCategory] || DEPTS.map(d => d.key);
        const relevantDepts = DEPTS.filter(d => deptsThisSize.includes(d.key));

        // حساب المتوسط
        let totalScore = 0, scoredCount = 0, completedCount = 0;
        relevantDepts.forEach(dept => {
            const d = healthData.departments[dept.key] || {};
            if (d.completed) completedCount++;
            const score = getDeptScore(dept.key);
            if (score != null) { totalScore += score; scoredCount++; }
        });

        const avgScore = scoredCount ? Math.round(totalScore / scoredCount) : null;
        const avgColor = scoreColor(avgScore);
        const avgStatus = avgScore >= 70 ? 'أداء جيد' : avgScore >= 45 ? 'يحتاج تطوير' : avgScore != null ? 'يحتاج اهتمام عاجل' : 'لم يُقيّم';
        const managersAssigned = relevantDepts.filter(d => healthData.departments[d.key]?.manager?.name).length;

        // جلب نتيجة الفحص العام (إن وجدت)
        let genAssessmentScore = null;
        try {
            const genData = JSON.parse(localStorage.getItem('generalAssessment'));
            if (genData && genData.results && genData.results._overall) {
                genAssessmentScore = genData.results._overall.pct;
            }
        } catch (e) { }

        const circumference = 2 * Math.PI * 42;
        const offset = avgScore != null ? circumference - (avgScore / 100) * circumference : circumference;

        document.getElementById('overallBanner').innerHTML = `
                <!-- 1. CEO General Assessment (Strategic) -->
                <div style="background:rgba(255,255,255,0.02); border:1px solid var(--stx-border); border-radius:24px; padding:28px; margin-bottom:24px; position:relative; overflow:hidden;">
                    <div style="position:absolute; top:0; right:0; width:6px; height:100%; background:linear-gradient(to bottom, #818cf8, #c084fc);"></div>
                    
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:24px;">
                        <div style="flex:1; min-width:300px;">
                            <div style="display:inline-flex; align-items:center; gap:8px; padding:6px 12px; background:rgba(129, 140, 248, 0.1); color:#818cf8; border-radius:30px; font-size:11px; font-weight:800; margin-bottom:16px;">
                                <i class="bi bi-shield-check"></i> تقييم القيادة العليا — استراتيجي
                            </div>
                            <h2 style="font-size:22px; font-weight:900; margin:0 0 10px 0; color:#fff;">الفحص الداخلي للشركة</h2>
                            <p style="font-size:14px; color:var(--text-muted); margin:0; line-height:1.6; max-width:600px;">مؤشر يعكس مدى النضج المؤسسي، قوة نموذج العمل، والجاهزية الرقمية للشركة ككل بناءً على مدخلات الإدارة العليا.</p>
                        </div>

                        ${genAssessmentScore != null
                ? `<div style="display:flex; align-items:center; gap:24px; background:rgba(0,0,0,0.2); padding:20px; border-radius:20px; border:1px solid rgba(255,255,255,0.05); min-width:240px; justify-content:center;">
                                     <div style="text-align:center;">
                                         <div style="font-size:11px; color:var(--text-muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:1px;">النتيجة الاستراتيجية</div>
                                         <div style="font-size:36px; font-weight:900; line-height:1; color:${scoreColor(genAssessmentScore)}">${genAssessmentScore}%</div>
                                     </div>
                                     <div style="width:1px; height:50px; background:rgba(255,255,255,0.1);"></div>
                                     <a href="/internal-env.html" class="wiz-btn" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); color:#fff; text-decoration:none;">إعادة الفحص</a>
                                   </div>`
                : `<div style="align-self:center;"><a href="/internal-env.html" class="wiz-btn" style="background:linear-gradient(135deg, #6366f1, #a855f7); color:#fff; text-decoration:none; padding:16px 32px; font-size:15px; box-shadow:0 10px 20px rgba(99,102,241,0.2);"><i class="bi bi-lightning-charge-fill"></i> ابدأ الفحص الشامل لشركتك</a></div>`
            }
                    </div>
                </div>

                <!-- 2. Departments Average Health (Operational) -->
                <div class="overall-banner" style="display:block;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.04);">
                         <div style="padding:6px 14px; background:rgba(255,255,255,0.05); color:var(--text-muted); border-radius:30px; font-size:11px; font-weight:800;">
                                <i class="bi bi-gear-wide-connected"></i> المسار التشغيلي — صحة الإدارات
                         </div>
                    </div>

                    <div style="display:flex; align-items:flex-start; gap:32px; flex-wrap:wrap;">
                        <div class="overall-score-circle">
                            <svg width="100" height="100" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="6"/>
                                <circle cx="50" cy="50" r="42" fill="none" stroke="${avgColor}" stroke-width="6"
                                    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                                    stroke-linecap="round" style="transition:stroke-dashoffset 1s ease"/>
                            </svg>
                            <div class="overall-score-num" style="color:${avgColor}">${avgScore ?? '—'}</div>
                            <div class="overall-score-label">${avgScore != null ? 'متوسط' : ''}</div>
                        </div>

                        <div style="flex:1; min-width:300px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                                <h2 style="font-size:22px; font-weight:900; margin:0; color:#fff;">مستوى تفعيل وإنجاز الإدارات <span style="font-size:16px; color:${avgColor}; font-weight:700; opacity:0.8;">• ${avgStatus}</span></h2>
                                <a href="/team.html" class="wiz-btn" style="padding:6px 16px; font-size:12px; background:rgba(102, 126, 234, 0.1); color:var(--stx-accent); border:1px solid rgba(102, 126, 234, 0.2); text-decoration:none;">
                                    <i class="bi bi-people-fill"></i> إدارة الفِرَق والأقسام
                                </a>
                            </div>
                            <p style="font-size:14px; color:var(--text-muted); margin:0 0 24px 0; line-height:1.6;">
                                المرحلة الأولى (التشخيص): ابدأ بتفعيل الإدارات ودعوة المديرين لجمع البيانات الضرورية لعملية التوليف الاستراتيجي.
                            </p>
                            
                            <div class="overall-stats" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px;">
                                <div class="overall-stat" style="text-align:right; display:flex; align-items:center; gap:12px; padding:12px 20px;">
                                    <div class="val" style="color:var(--green); font-size:24px;">${completedCount}</div>
                                    <div class="lbl" style="font-size:11px; text-align:right;">أقسام<br>مكتملة</div>
                                </div>
                                <div class="overall-stat" style="text-align:right; display:flex; align-items:center; gap:12px; padding:12px 20px;">
                                    <div class="val" style="color:var(--blue); font-size:24px;">${managersAssigned}</div>
                                    <div class="lbl" style="font-size:11px; text-align:right;">مدراء<br>مُعينين</div>
                                </div>
                                <div class="overall-stat" style="text-align:right; display:flex; align-items:center; gap:12px; padding:12px 20px;">
                                    <div class="val" style="color:var(--purple); font-size:24px;">${scoredCount}</div>
                                    <div class="lbl" style="font-size:11px; text-align:right;">أقسام<br>مُقيّمة</div>
                                </div>
                                <div class="overall-stat" style="text-align:right; display:flex; align-items:center; gap:12px; padding:12px 20px;">
                                    <div class="val" style="color:var(--yellow); font-size:24px;">${relevantDepts.length - completedCount}</div>
                                    <div class="lbl" style="font-size:11px; text-align:right;">أقسام<br>متبقية</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 3. Strategic Synthesis & Cross-Dept Analysis -->
                <div id="synthesisSection" style="margin-top:32px; animation: slideUp .5s ease;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
                         <div class="section-title"><i class="bi bi-diagram-3-fill"></i> محرك التوليف الاستراتيجي الذكي</div>
                         <div style="background:rgba(34, 197, 94, 0.1); color:#22c55e; border-radius:30px; font-size:11px; font-weight:800; padding:6px 14px;">
                            <i class="bi bi-lightning-fill"></i> توليف حي نشط
                         </div>
                    </div>

                    <div style="background:rgba(22, 27, 34, 0.4); border:1px solid var(--stx-border); border-radius:24px; padding:28px; position:relative; overflow:hidden;">
                        <div style="position:absolute; bottom:0; left:0; width:100%; height:1px; background:linear-gradient(to right, transparent, rgba(99, 102, 241, 0.5), transparent);"></div>
                        
                        <div class="row g-4 align-items-center">
                            <div class="col-lg-7">
                                <h3 style="font-size:18px; font-weight:800; margin-bottom:12px; color:#fff;">التوليف الشامل للمنشأة (Corporate Synthesis)</h3>
                                <p style="font-size:13px; color:var(--text-muted); line-height:1.7; margin-bottom:24px;">
                                    يعمل هذا المحرك على جمع مخرجات الإدارات المختلفة ودمجها في رؤية واحدة. يقوم بتحويل المشاكل التشغيلية إلى نقاط ضعف استراتيجية، ونتائج التدقيق إلى مخاطر، والفرص القطاعية إلى مسارات نمو.
                                </p>
                                                                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-bottom:24px;">
                                    <div class="overall-stat" style="background:rgba(255,255,255,0.02); text-align:right;">
                                        <div id="sync-swot-count" style="font-size:18px; font-weight:900; color:#fff;">0</div>
                                        <div style="font-size:10px; color:var(--text-muted);">عناصر SWOT الإدارات</div>
                                    </div>
                                    <div class="overall-stat" style="background:rgba(255,255,255,0.02); text-align:right;">
                                        <div id="sync-audit-count" style="font-size:18px; font-weight:900; color:#fff;">0</div>
                                        <div style="font-size:10px; color:var(--text-muted);">مخاطر تدقيق مكتشفة</div>
                                    </div>
                                    <div class="overall-stat" style="background:rgba(255,255,255,0.02); text-align:right;">
                                        <div id="sync-pestel-count" style="font-size:18px; font-weight:900; color:#fff;">0</div>
                                        <div style="font-size:10px; color:var(--text-muted);">إشارات سوق خارجية</div>
                                    </div>
                                </div>

                                <div id="synthesisGuidance" style="margin-bottom:24px; display:none;">
                                    <div style="padding:16px; background:rgba(102, 126, 234, 0.05); border:1px dashed rgba(102, 126, 234, 0.3); border-radius:16px;">
                                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                                            <div style="width:10px; height:10px; border-radius:50%; background:#6366f1; box-shadow: 0 0 10px #6366f1;"></div>
                                            <span style="font-size:13px; font-weight:800; color:#fff;">المرحلة الحالية: تفعيل الإدارات</span>
                                        </div>
                                        <p style="font-size:12px; color:var(--text-muted); margin:0; line-height:1.6;">
                                            التوليف الاستراتيجي يعتمد على مخرجات تشخيص الإدارات. ابدأ بتعيين مدراء الإدارات أو البدء بتقييم الأقسام لتفعيل المحرك الذكي وتوليد الرؤية الموحدة.
                                        </p>
                                    </div>
                                </div>

                                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                                    <a href="/team.html" id="activateDeptBtn" class="wiz-btn" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; text-decoration:none;">
                                        <i class="bi bi-people-fill"></i> تفعيل الإدارات والفرق
                                    </a>
                                    <a href="/swot.html?dept=company" id="reviewSwotBtn" class="wiz-btn" style="background:linear-gradient(135deg, #6366f1, #a855f7); color:#fff; text-decoration:none; display:none;">
                                        <i class="bi bi-grid-3x3-gap-fill"></i> مراجعة لوحة SWOT الموحدة
                                    </a>
                                    <button class="wiz-btn" style="background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1);" onclick="showSynthesisLogic()">
                                        <i class="bi bi-info-circle"></i> كيف يعمل التوليف؟
                                    </button>
                                </div>
                            </div>
                            
                            <div class="col-lg-5 order-first order-lg-last">
                                <div style="background:rgba(0,0,0,0.3); border-radius:20px; padding:20px; border:1px solid rgba(139, 92, 246, 0.2); position:relative;">
                                    <div style="font-size:11px; color:#a78bfa; font-weight:800; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                                        <i class="bi bi-diagram-2"></i> خارطة الترابط الاستراتيجي
                                    </div>
                                    
                                    <div style="display:flex; flex-direction:column; gap:10px;">
                                        <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px;">
                                            <span style="color:var(--text-muted)">تحليل SWOT الإدارات</span>
                                            <i class="bi bi-arrow-left-short"></i>
                                            <span style="color:#22c55e; font-weight:700;">نقاط القوة/الضعف</span>
                                        </div>
                                        <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px;">
                                            <span style="color:var(--text-muted)">التدقيق والامتثال</span>
                                            <i class="bi bi-arrow-left-short"></i>
                                            <span style="color:#ef4444; font-weight:700;">التهديدات والمخاطر</span>
                                        </div>
                                        <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px;">
                                            <span style="color:var(--text-muted)">تحليل PESTEL للسوق</span>
                                            <i class="bi bi-arrow-left-short"></i>
                                            <span style="color:#06b6d4; font-weight:700;">الفرص والمسارات</span>
                                        </div>
                                    </div>

                                    <div style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05); text-align:center;">
                                        <div style="font-size:10px; color:var(--text-muted);">جميع المخرجات تصب في <strong>Strategic Core</strong></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;

        // Fetch initial synthesis counts
        if (window.StrategicSynthesis) {
            StrategicSynthesis.fetchAggregatedSwot('company').then(res => {
                const totalItems = res.strengths.length + res.weaknesses.length + res.opportunities.length + res.threats.length;

                // Update counts
                if (document.getElementById('sync-swot-count'))
                    document.getElementById('sync-swot-count').textContent = res.strengths.length + res.weaknesses.length;
                if (document.getElementById('sync-audit-count'))
                    document.getElementById('sync-audit-count').textContent = res.weaknesses.filter(w => w.includes('امتثال') || w.includes('تدقيق')).length;
                if (document.getElementById('sync-pestel-count'))
                    document.getElementById('sync-pestel-count').textContent = res.opportunities.length + res.threats.length;

                // Toggle Guidance vs Actions
                const guidance = document.getElementById('synthesisGuidance');
                const reviewBtn = document.getElementById('reviewSwotBtn');
                const activateBtn = document.getElementById('activateDeptBtn');

                if (totalItems === 0) {
                    if (guidance) guidance.style.display = 'block';
                    if (reviewBtn) reviewBtn.style.display = 'none';
                    if (activateBtn) {
                        activateBtn.style.display = 'inline-flex';
                        activateBtn.innerHTML = '<i class="bi bi-people-fill"></i> تفعيل الإدارات والفرق';
                    }
                } else {
                    if (guidance) guidance.style.display = 'none';
                    if (reviewBtn) reviewBtn.style.display = 'inline-flex';
                    if (activateBtn) {
                        activateBtn.style.display = 'inline-flex';
                        activateBtn.style.background = 'rgba(16, 185, 129, 0.1)';
                        activateBtn.style.color = '#10b981';
                        activateBtn.style.border = '1px solid rgba(16, 185, 129, 0.2)';
                        activateBtn.innerHTML = '<i class="bi bi-person-gear"></i> إدارة الفِرَق';
                    }
                }
            });
        }

        // Radar chart
        const scoredDepts = relevantDepts.filter(d => getDeptScore(d.key) != null);
        if (scoredDepts.length >= 3) {
            document.getElementById('radarSection').style.display = '';
            drawRadar(scoredDepts);
        } else {
            document.getElementById('radarSection').style.display = 'none';
        }

        // Ranking table
        const DEPT_ROLE_MAP = {
            compliance: 'CCO_COMPLIANCE', finance: 'CFO', sales: 'CSO',
            hr: 'CHRO', marketing: 'CMO', operations: 'COO', support: 'CSUPPORT',
            it: 'CTO', tech: 'CTO', legal: 'CLO', governance: 'CGO',
            projects: 'CPO', logistics: 'CLG'
        };

        if (relevantDepts.length > 0) {
            document.getElementById('rankingSection').style.display = '';
            const allScored = relevantDepts.map(d => {
                const deptData = healthData.departments[d.key] || {};
                return {
                    ...d,
                    score: getDeptScore(d.key),
                    source: deptData.source || 'OPERATIONAL',
                    hasManager: deptData.manager && deptData.manager !== '—'
                };
            }).sort((a, b) => (a.score ?? -1) - (b.score ?? -1));

            const tbody = document.getElementById('rankBody');
            tbody.innerHTML = allScored.map((d, i) => {
                const rankCls = d.score == null ? '' : (i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-ok');
                const statusColor = scoreColor(d.score);
                const sourceLabel = d.source === 'STRATEGIC' ?
                    '<span style="font-size:10px; padding:2px 6px; background:rgba(99,102,241,0.2); color:#818cf8; border-radius:4px; font-weight:700;">🎯 تشخيص استراتيجي</span>' :
                    (d.source === 'OPERATIONAL' ? '<span style="font-size:10px; padding:2px 6px; background:rgba(255,255,255,0.05); color:var(--text-muted); border-radius:4px;">⚙️ تدقيق تشغيلي</span>' : '<span style="color:var(--text-muted)">—</span>');

                const roleKey = DEPT_ROLE_MAP[d.key];
                const _user = (window.Context && Context.getUser) ? Context.getUser() : JSON.parse(localStorage.getItem('user') || '{}');
                const isOwner = ['OWNER', 'ADMIN', 'EXEC_MANAGER', 'SUPER_ADMIN'].includes((_user.userType || '').toUpperCase());

                const actionBtn = isOwner ? `
                                    <div style="display:flex; gap:6px;">
                                        <button onclick="event.stopPropagation(); window.location.href='${getDeptDeepLink(d.key)}'" 
                                                class="wiz-btn" 
                                                title="تحليل المالك المباشر"
                                                style="padding:5px 12px; font-size:11px; background:rgba(34, 197, 94, 0.1); color:#22c55e; border:1px solid rgba(34, 197, 94, 0.3); border-radius:6px; font-weight:700;">
                                            <i class="bi bi-search"></i> تحليل
                                        </button>
                                        <button onclick="event.stopPropagation(); window.location.href='/dept-report.html?dept=${d.key}'" 
                                                class="wiz-btn" 
                                                title="رابط التقرير السريع للمدير الداخلي"
                                                style="padding:5px 8px; font-size:11px; background:rgba(99, 102, 241, 0.1); color:#818cf8; border:1px solid rgba(99, 102, 241, 0.3); border-radius:6px; font-weight:700;">
                                            📄 تقرير
                                        </button>
                                    </div>` : `
                                    <button onclick="event.stopPropagation(); window.location.href='/team.html?role=${roleKey}'" 
                                            class="wiz-btn" 
                                            style="padding:5px 12px; font-size:11px; background:rgba(102,126,234,0.1); color:var(--stx-accent); border:1px solid rgba(102,126,234,0.3); border-radius:6px; font-weight:700;">
                                        <i class="bi bi-person-plus"></i> دعوة
                                    </button>`;

                return `<tr onclick="location.href='${getDeptDeepLink(d.key)}'" style="cursor:pointer">
                                    <td><span class="rank-num ${rankCls}">${i + 1}</span></td>
                                    <td style="font-weight:700">${d.icon} ${d.label}</td>
                                    <td>${sourceLabel}</td>
                                    <td style="font-weight:900;color:${statusColor}">${d.score != null ? d.score + '%' : '—'}</td>
                                    <td><span style="font-size:11px;padding:3px 10px;border-radius:20px;background:${statusColor}22;color:${statusColor};font-weight:700">
                                        ${d.score != null ? scoreStatus(d.score).text : 'لم يُقيّم'}
                                    </span></td>
                                    <td>${actionBtn}</td>
                                </tr>`;
            }).join('');
        } else {
            document.getElementById('rankingSection').style.display = 'none';
        }
    }

    window.showSynthesisLogic = function () {
        const html = `
                            <div style="text-align:right; font-family:'Tajawal', sans-serif; direction:rtl;">
                                <h4 style="font-weight:900; color:#fff; margin-bottom:16px;">آلية عمل التوليف الاستراتيجي الذكي 🧠</h4>
                                <p style="font-size:14px; color:#94a3b8; line-height:1.6; margin-bottom:20px;">
                                    يقوم نظام ستارتكس بربط الطبقات المختلفة للمنشأة لضمان عدم وجود فجوة بين "ما تراه الإدارة العليا" و "ما يحدث في الإدارات".
                                </p>
                                
                                <div style="display:flex; flex-direction:column; gap:16px;">
                                    <div style="padding:12px; background:rgba(34, 197, 94, 0.05); border-radius:12px; border:1px solid rgba(34, 197, 94, 0.2);">
                                        <div style="font-weight:800; color:#22c55e; font-size:13px; margin-bottom:4px;">1. دمج الـ SWOT الإداري</div>
                                        <div style="font-size:12px; color:#cbd5e1;">يتم سحب أهم نقاط القوة والضعف التي حددها مديرو الإدارات وإسقاطها في لوحة SWOT الشركة لضمان وعي القيادة بالتحديات الميدانية.</div>
                                    </div>
                                    
                                    <div style="padding:12px; background:rgba(239, 68, 68, 0.05); border-radius:12px; border:1px solid rgba(239, 68, 68, 0.2);">
                                        <div style="font-weight:800; color:#ef4444; font-size:13px; margin-bottom:4px;">2. تحويل المخاطر والتدقيق</div>
                                        <div style="font-size:12px; color:#cbd5e1;">أي مخالفات في التدقيق التشغيلي (Audit) أو ضعف في الامتثال يتم تحويلها تلقائياً إلى "تهديدات" (Threats) في مصفوفة SWOT العامة.</div>
                                    </div>
                                    
                                    <div style="padding:12px; background:rgba(14, 165, 233, 0.05); border-radius:12px; border:1px solid rgba(14, 165, 233, 0.2);">
                                        <div style="font-weight:800; color:#0ea5e9; font-size:13px; margin-bottom:4px;">3. توليف إشارات السوق (PESTEL)</div>
                                        <div style="font-size:12px; color:#cbd5e1;">يتم تحليل مخرجات PESTEL لتحديد الفرص الخارجية والتهديدات الكلية التي تؤثر على المنشأة ككيان واحد.</div>
                                    </div>
                                </div>
                                
                                <div style="margin-top:20px; padding:12px; background:rgba(255,255,255,0.02); border-radius:12px; font-size:11px; color:var(--text-muted);">
                                    💡 <strong>ملاحظة:</strong> يمكنك مراجعة وتعديل هذا التوليف في أي وقت عبر صفحة SWOT الموحدة لتعديل الصياغة أو إضافة لمستك الاستراتيجية الخاصة.
                                </div>
                            </div>
                        `;

        if (window.showGlobalModal) {
            window.showGlobalModal(html, 'آلية التوليف الاستراتيجي');
        } else {
            console.log('آلية التوليف: يتم دمج SWOT الإدارات، نتائج التدقيق، وتحليل PESTEL في لوحة واحدة للقيادة.');
        }
    };

    function drawRadar(items) {
        const canvas = document.getElementById('radarCanvas');
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2;
        const maxR = 160;
        const n = items.length;
        const step = (2 * Math.PI) / n;

        ctx.clearRect(0, 0, w, h);

        // Grid circles
        [20, 40, 60, 80, 100].forEach(pct => {
            const r = (pct / 100) * maxR;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255,255,255,.06)';
            ctx.lineWidth = 1;
            ctx.stroke();
            if (pct % 40 === 0 || pct === 100) {
                ctx.fillStyle = 'rgba(255,255,255,.2)';
                ctx.font = '10px Tajawal';
                ctx.fillText(pct + '%', cx + 4, cy - r + 12);
            }
        });

        // Grid lines
        items.forEach((_, i) => {
            const angle = -Math.PI / 2 + i * step;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
            ctx.strokeStyle = 'rgba(255,255,255,.06)';
            ctx.stroke();
        });

        // Data polygon
        ctx.beginPath();
        items.forEach((item, i) => {
            const angle = -Math.PI / 2 + i * step;
            const r = (getDeptScore(item.key) / 100) * maxR;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(102,126,234,.15)';
        ctx.fill();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Points & labels
        items.forEach((item, i) => {
            const angle = -Math.PI / 2 + i * step;
            const r = (getDeptScore(item.key) / 100) * maxR;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = item.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            const lx = cx + Math.cos(angle) * (maxR + 22);
            const ly = cy + Math.sin(angle) * (maxR + 22);
            ctx.fillStyle = 'var(--text)';
            ctx.font = '700 12px Tajawal';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(`${item.icon} ${item.label}`, lx, ly - 8);
            ctx.fillStyle = item.color;
            ctx.font = '900 13px Tajawal';
            ctx.fillText(getDeptScore(item.key) + '%', lx, ly + 8);
        });
    }

    // ==================== عرض الإدارات (Departments) ====================
    function renderDepartments() {
        const deptsThisSize = SIZE_DEPTS[sizeCategory] || DEPTS.map(d => d.key);
        let filteredDepts = DEPTS.filter(d => deptsThisSize.includes(d.key));

        // === فلتر لمدير الإدارة: إدارته فقط ===
        const _deptParam = urlParams.get('dept');
        if (_deptParam) {
            filteredDepts = filteredDepts.filter(d => d.key === _deptParam);
            // لو ما لقينا الإدارة، جرّب بالاسم العربي
            if (filteredDepts.length === 0) {
                filteredDepts = DEPTS.filter(d => d.key === _deptParam);
            }
        }

        const html = filteredDepts.map(dept => {
            const d = healthData.departments[dept.key] || {};
            const mgr = d.manager || {};
            const score = getDeptScore(dept.key);
            const status = scoreStatus(score);
            const isCompleted = d.completed === true;
            const ansCount = Object.keys(d.answers || {}).length;

            // متوسط لعدد الأسئلة التقريبي هو 15-20 سؤال
            const estimatedTotal = 15;
            let progressVal = isCompleted ? 100 : (ansCount === 0 ? 0 : Math.min(Math.round((ansCount / estimatedTotal) * 100), 95));

            const metrics = [];
            if (d.challenges?.length) metrics.push(`${d.challenges.length} تحديات`);
            if (d.goals?.length) metrics.push(`${d.goals.length} أهداف`);
            if (d.model) metrics.push(d.model);

            return `
                    <div class="dept-card" data-action="dept-navigate" data-href="${getDeptDeepLink(dept.key)}" style="--accent:${dept.color}${_deptParam ? ';grid-column:1/-1;max-width:600px;cursor:pointer;margin:0 auto' : ';cursor:pointer'}">
                        <div style="position:absolute;top:0;right:0;width:100%;height:3px;background:${dept.color};opacity:.6;border-radius:16px 16px 0 0"></div>
                        <div class="dept-card-header">
                            <div class="dept-icon-box" style="background:${dept.color}22">${dept.icon}</div>
                            <div>
                                <div class="dept-card-name">${dept.label}</div>
                                <div style="font-size:11px; color:var(--text-muted); margin-top:4px; font-weight:700;">مُنجز ${progressVal}%</div>
                            </div>
                            <span class="dept-card-status ${isCompleted ? 'completed' : (ansCount ? 'pending' : 'empty')}">
                                ${isCompleted ? '✓ التقييم' : (ansCount ? 'تقييم مستمر' : 'لم يبدأ')}
                            </span>
                        </div>

                        ${mgr.name ? `
                        <div class="dept-mgr">
                            <div class="dept-mgr-avatar" style="background:${dept.color}">${mgr.name[0]}</div>
                            <div class="dept-mgr-info">
                                <div class="dept-mgr-name">${mgr.name}</div>
                                <div class="dept-mgr-contact">${mgr.phone || ''} ${mgr.phone && mgr.email ? '·' : ''} ${mgr.email || ''}</div>
                            </div>
                        </div>` : `
                        <div class="dept-mgr" style="opacity:.5">
                            <div class="dept-mgr-avatar" style="background:${dept.color}44"><i class="bi bi-person-fill" style="font-size:14px;color:var(--text-muted)"></i></div>
                            <div class="dept-mgr-info"><div class="dept-mgr-name" style="color:var(--text-muted)">لم يُعيّن مدير</div></div>
                        </div>`}

                        <div class="dept-score-row">
                            <div class="dept-score-bar">
                                <div class="dept-score-fill" style="width:${score ?? 0}%;background:${scoreColor(score)}"></div>
                            </div>
                            <div class="dept-score-num" style="color:${scoreColor(score)}">${score != null ? score + '%' : '—'}</div>
                        </div>

                        ${(d.deepScore != null || d.auditScore != null) ? `
                        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
                            ${d.deepScore != null ? `<span style="font-size:10px;background:rgba(99,102,241,0.1);color:#818cf8;padding:3px 8px;border-radius:6px;font-weight:700;">🔍 عميق ${d.deepScore}%</span>` : ''}
                            ${d.auditScore != null ? `<span style="font-size:10px;background:rgba(16,185,129,0.1);color:#34d399;padding:3px 8px;border-radius:6px;font-weight:700;">📋 وصفي ${d.auditScore}%</span>` : ''}
                            ${d.completedSteps?.includes('budget') ? `<span style="font-size:10px;background:rgba(245,158,11,0.1);color:#fbbf24;padding:3px 8px;border-radius:6px;font-weight:700;">💰 ميزانية</span>` : ''}
                            ${d.completedSteps?.length >= 3 ? `<span style="font-size:10px;background:rgba(16,185,129,0.15);color:#34d399;padding:3px 8px;border-radius:6px;font-weight:800;border:1px solid rgba(16,185,129,0.2);">🎯 مخرج مدمج</span>` : ''}
                        </div>` : ''}

                        ${(d.weaknesses?.length > 0) ? `
                        <div style="margin-top:8px;padding:8px 10px;background:rgba(239,68,68,0.05);border-right:2px solid rgba(239,68,68,0.3);border-radius:6px;">
                            <div style="font-size:10px;color:#f87171;font-weight:700;margin-bottom:4px;">⚠️ أبرز الفجوات (${d.weaknesses.length})</div>
                            <div style="font-size:10px;color:#94a3b8;line-height:1.5;">${d.weaknesses.slice(0, 2).map(w => `• ${w}`).join('<br>')}</div>
                        </div>` : ''}

                        ${metrics.length ? `<div class="dept-metrics">${metrics.map(m => `<span class="dept-metric">${m}</span>`).join('')}</div>` : ''}
                        
                        ${['OWNER', 'ADMIN', 'EXEC_MANAGER', 'SUPER_ADMIN'].includes((JSON.parse(localStorage.getItem('user') || '{}').userType || '').toUpperCase()) ? `
                        <div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                            <span onclick="event.stopPropagation(); window.location.href='/dept-report.html?dept=${dept.key}'" 
                                  style="font-size:10px; color:var(--stx-accent); font-weight:700; background:rgba(99,102,241,0.1); padding:4px 8px; border-radius:4px; cursor:pointer;">
                                  📄 طلب تقرير المدير
                            </span>
                            <span style="font-size:11px; color:#22c55e; font-weight:700;">تحليل المالك المباشر <i class="bi bi-arrow-left-short"></i></span>
                        </div>` : ''}
                    </div>`;
        }).join('');

        const addDeptCard = _deptParam ? '' : `
                    <div class="dept-card" onclick="alert('ميزة إضافة (إدارات مخصصة) غير قياسية ستكون متاحة قريباً في إصدار خطة المؤسسات (Enterprise Plan).')" style="border: 2px dashed var(--border); background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; cursor: pointer; min-height: 180px; transition: all 0.2s;" onmouseover="this.style.borderColor='rgba(99,102,241,0.5)'; this.querySelector('.plus-icon').style.background='rgba(99,102,241,0.1)'; this.querySelector('.plus-icon').style.color='#6366f1';" onmouseout="this.style.borderColor='var(--border)'; this.querySelector('.plus-icon').style.background='rgba(255,255,255,0.05)'; this.querySelector('.plus-icon').style.color='var(--text-muted)';">
                        <div class="plus-icon" style="width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.05); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-size: 24px; transition: all 0.2s;">
                            <i class="bi bi-plus-lg"></i>
                        </div>
                        <div style="font-weight: 700; color: var(--text-muted); font-size: 14px;">إضافة إدارة جديدة</div>
                        <div style="font-size: 11px; color: var(--text-muted); text-align: center;">إدارات مخصصة، مصانع، أو فروع</div>
                    </div>
                `;

        document.getElementById('deptsGrid').innerHTML = html + addDeptCard;
    }

    // ==================== عرض التعمق (Deep) ====================
    function renderDeep() {
        const deptsWithDeep = DEPTS.filter(d => {
            return healthData.deepAnalysis[d.key] || healthData.departments[d.key]?.deepScore;
        });

        if (deptsWithDeep.length === 0) {
            // عرض كل الإدارات المتاحة مع خيار البدء
            const deptsThisSize = SIZE_DEPTS[sizeCategory] || DEPTS.map(d => d.key);
            const relevantDepts = DEPTS.filter(d => deptsThisSize.includes(d.key));

            const deptLinks = relevantDepts.map(dept => `
                        <a href="${getDeptDeepLink(dept.key)}" class="deep-card" style="text-decoration:none">
                            <div class="deep-card-header">
                                <div class="deep-icon" style="background:${dept.color}22; color:${dept.color}">${dept.icon}</div>
                                <div class="deep-title">تحليل ${dept.label}</div>
                            </div>
                            <div class="deep-desc">ابدأ التحليل العميق لإدارة ${dept.label}</div>
                            <div class="deep-meta">
                                <span style="color:var(--text-muted)">لم يبدأ بعد</span>
                                <span style="color:${dept.color}"><i class="bi bi-arrow-left"></i> ابدأ</span>
                            </div>
                        </a>
                    `).join('');

            document.getElementById('deepContent').innerHTML = `
                        <div style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.15);border-radius:16px;padding:20px;margin-bottom:20px;text-align:center">
                            <div style="font-size:32px;margin-bottom:8px">🔍</div>
                            <div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:6px">التحليل الوظيفي العميق</div>
                            <div style="font-size:13px;color:var(--text-muted)">اختر إدارة للبدء بتحليل متعمق — مؤشرات، KPIs، وتوصيات مفصلة</div>
                        </div>
                        <div class="deep-grid">${deptLinks}</div>`;
            return;
        }

        const deepCards = deptsWithDeep.map(dept => {
            const deep = healthData.deepAnalysis[dept.key] || {};
            const deptData = healthData.departments[dept.key] || {};
            const score = deep.score || deptData.deepScore || getDeptScore(dept.key) || 0;
            const status = scoreStatus(score);
            return `
                    <a href="${getDeptDeepLink(dept.key)}" class="deep-card" style="text-decoration:none">
                        <div class="deep-card-header">
                            <div class="deep-icon" style="background:${dept.color}22; color:${dept.color}">${dept.icon}</div>
                            <div class="deep-title">تحليل ${dept.label}</div>
                        </div>
                        <div class="deep-desc">
                            ${deep.indicators?.length ? `${deep.indicators.length} مؤشر` : ''} 
                            ${deep.kpis?.length ? `• ${deep.kpis.length} KPI` : ''}
                            ${!deep.indicators?.length && !deep.kpis?.length ? 'تقييم متعمق مكتمل' : ''}
                        </div>
                        <div class="deep-meta">
                            <span>الدرجة: <strong style="color:${scoreColor(score)}">${score}%</strong></span>
                            <span style="color:${dept.color}"><i class="bi bi-arrow-left"></i> عرض التفاصيل</span>
                        </div>
                    </a>`;
        }).join('');

        // إدارات لم تبدأ بعد
        const deptsThisSize = SIZE_DEPTS[sizeCategory] || DEPTS.map(d => d.key);
        const unstarted = DEPTS.filter(d =>
            deptsThisSize.includes(d.key) && !deptsWithDeep.find(dw => dw.key === d.key)
        );
        const unstartedHtml = unstarted.length > 0 ? unstarted.map(dept => `
                    <a href="${getDeptDeepLink(dept.key)}" class="deep-card" style="text-decoration:none;opacity:0.6">
                        <div class="deep-card-header">
                            <div class="deep-icon" style="background:${dept.color}12; color:${dept.color}88">${dept.icon}</div>
                            <div class="deep-title" style="color:var(--text-muted)">تحليل ${dept.label}</div>
                        </div>
                        <div class="deep-desc" style="color:var(--text-muted)">لم يبدأ بعد — اضغط للبدء</div>
                        <div class="deep-meta">
                            <span></span>
                            <span style="color:${dept.color}88"><i class="bi bi-plus-lg"></i> ابدأ</span>
                        </div>
                    </a>`).join('') : '';

        document.getElementById('deepContent').innerHTML = `<div class="deep-grid">${deepCards}${unstartedHtml}</div>`;
    }

    // ==================== Inline Department Assessment Wizard ====================
    const WIZ_QUESTIONS = {
        compliance: [
            {
                q: 'هل عندكم شهادة جودة معتمدة (ISO 9001 أو ما يعادلها)؟', opts: [
                    { v: 1, t: 'لا — ما نحتاجها', icon: '🔴' }, { v: 2, t: 'نخطط لها', icon: '🟡' },
                    { v: 3, t: 'حاصلين عليها ونجدد سنوياً', icon: '🟢' }, { v: 4, t: 'ISO 9001 + شهادات تخصصية + TQM', icon: '⭐' }
                ]
            },
            {
                q: 'كم مرة تسوون تدقيق داخلي في السنة؟', opts: [
                    { v: 1, t: 'أبداً — أو فقط لما يجينا تفتيش', icon: '🔴' }, { v: 2, t: 'مرة سنوياً — للشهادة فقط', icon: '🟡' },
                    { v: 3, t: 'ربعي — مع خطط تصحيحية', icon: '🟢' }, { v: 4, t: 'مستمر — digital audit trail', icon: '⭐' }
                ]
            },
            {
                q: 'هل أنتم ملتزمون بجميع الأنظمة واللوائح؟', opts: [
                    { v: 1, t: 'لا نعرف ما المطلوب', icon: '🔴' }, { v: 2, t: 'نلتزم بالأساسي', icon: '🟡' },
                    { v: 3, t: 'ملتزمون بالكامل + مراجعة دورية', icon: '🟢' }, { v: 4, t: 'RegTech + تنبيهات آلية + فريق امتثال', icon: '⭐' }
                ]
            },
            {
                q: 'هل عندكم نظام إدارة مخاطر فعّال؟', opts: [
                    { v: 1, t: 'لا — نتعامل مع المشاكل لما تصير', icon: '🔴' }, { v: 2, t: 'سجل مخاطر عام بدون متابعة', icon: '🟡' },
                    { v: 3, t: 'تقييم دوري + خطط استجابة', icon: '🟢' }, { v: 4, t: 'ERM framework + stress testing', icon: '⭐' }
                ]
            },
            {
                q: 'هل ثقافة الجودة منتشرة في كل الإدارات؟', opts: [
                    { v: 1, t: 'لا يوجد قسم جودة أصلاً', icon: '🔴' }, { v: 2, t: 'قسم جودة يعمل بمعزل', icon: '🟡' },
                    { v: 3, t: 'الجودة مسؤولية مشتركة', icon: '🟢' }, { v: 4, t: 'TQM culture — كل موظف مفتش جودة', icon: '⭐' }
                ]
            }
        ],
        finance: [
            {
                q: 'لو سألتك "كم أرباحك الشهر الماضي؟" — كم تحتاج وقت؟', opts: [
                    { v: 1, t: 'أسبوع+ — نجمع من ملفات مختلفة', icon: '🔴' }, { v: 2, t: 'يومين — تقرير يدوي', icon: '🟡' },
                    { v: 3, t: 'ساعات — النظام يطلع التقرير', icon: '🟢' }, { v: 4, t: 'فوراً — Dashboard حي ومحدّث', icon: '⭐' }
                ]
            },
            {
                q: 'هل تعرف نقطة التعادل (Break-even) لشركتك؟', opts: [
                    { v: 1, t: 'لا — ما نعرف متى نربح', icon: '🔴' }, { v: 2, t: 'تقريبياً — بدون تحديث', icon: '🟡' },
                    { v: 3, t: 'محسوبة ومحدّثة كل ربع', icon: '🟢' }, { v: 4, t: 'لكل منتج + سيناريوهات', icon: '⭐' }
                ]
            },
            {
                q: 'كم شهر تستمر لو توقفت الإيرادات تماماً؟', opts: [
                    { v: 1, t: 'أقل من شهر', icon: '🔴' }, { v: 2, t: '1-3 أشهر', icon: '🟡' },
                    { v: 3, t: '3-6 أشهر', icon: '🟢' }, { v: 4, t: '6+ أشهر + خطوط ائتمان', icon: '⭐' }
                ]
            },
            {
                q: 'هل كل إدارة عندها ميزانية محددة ومتابعة؟', opts: [
                    { v: 1, t: 'لا — إنفاق بدون سقف', icon: '🔴' }, { v: 2, t: 'ميزانية سنوية بدون متابعة', icon: '🟡' },
                    { v: 3, t: 'ميزانيات + تقارير انحراف شهرية', icon: '🟢' }, { v: 4, t: 'Zero-based budgeting + تنبيهات', icon: '⭐' }
                ]
            },
            {
                q: 'هل تستخدمون تحليلات مالية متقدمة؟', opts: [
                    { v: 1, t: 'لا — قرارات بالحدس', icon: '🔴' }, { v: 2, t: 'تقارير Excel أساسية', icon: '🟡' },
                    { v: 3, t: 'تحليل نسب مالية + Benchmarking', icon: '🟢' }, { v: 4, t: 'نماذج تنبؤية + AI-assisted', icon: '⭐' }
                ]
            }
        ],
        sales: [
            {
                q: 'مدير المبيعات يعرف كم فرصة في الـ Pipeline؟', opts: [
                    { v: 1, t: 'لا يوجد Pipeline أصلاً', icon: '🔴' }, { v: 2, t: 'تقريبياً — ذاكرة وواتساب', icon: '🟡' },
                    { v: 3, t: 'CRM محدّث + تصنيف مراحل', icon: '🟢' }, { v: 4, t: '+ قيمة واحتمالية إغلاق', icon: '⭐' }
                ]
            },
            {
                q: 'كم نسبة تحويل العملاء المحتملين إلى صفقات؟', opts: [
                    { v: 1, t: 'لا نقيس التحويل', icon: '🔴' }, { v: 2, t: 'ضعيفة بدون أرقام', icon: '🟡' },
                    { v: 3, t: 'مقاسة 15-25%', icon: '🟢' }, { v: 4, t: 'محللة بكل مرحلة 25%+', icon: '⭐' }
                ]
            },
            {
                q: 'هل كل مندوب عنده هدف واضح يتابعه يومياً؟', opts: [
                    { v: 1, t: '"بيعوا أكثر" هو الهدف', icon: '🔴' }, { v: 2, t: 'أهداف شهرية بدون متابعة', icon: '🟡' },
                    { v: 3, t: 'أهداف SMART + coaching', icon: '🟢' }, { v: 4, t: 'أهداف يومية + gamification', icon: '⭐' }
                ]
            },
            {
                q: 'أكبر عميل كم يمثل من إيراداتك؟', opts: [
                    { v: 1, t: 'أكثر من 40%', icon: '🔴' }, { v: 2, t: '20-40%', icon: '🟡' },
                    { v: 3, t: '10-20% — تنويع جيد', icon: '🟢' }, { v: 4, t: 'أقل من 10% — متنوعة وصحية', icon: '⭐' }
                ]
            },
            {
                q: 'تكلفة اكتساب العميل مقارنة بقيمته طول العمر؟', opts: [
                    { v: 1, t: 'لا نحسب CAC ولا LTV', icon: '🔴' }, { v: 2, t: 'CAC تقريبي بدون LTV', icon: '🟡' },
                    { v: 3, t: 'LTV/CAC أكثر من 3x', icon: '🟢' }, { v: 4, t: 'محسوبة لكل قناة + تحسين', icon: '⭐' }
                ]
            }
        ],
        hr: [
            {
                q: 'لو موظف أساسي استقال — كم تحتاج لتعويضه؟', opts: [
                    { v: 1, t: '6+ أشهر — لا توثيق', icon: '🔴' }, { v: 2, t: '3-6 أشهر', icon: '🟡' },
                    { v: 3, t: 'شهر — وثائق + مرشحين', icon: '🟢' }, { v: 4, t: 'أسبوع — خطة تعاقب مفعّلة', icon: '⭐' }
                ]
            },
            {
                q: 'كيف تقيّمون أداء الموظفين؟', opts: [
                    { v: 1, t: 'لا يوجد تقييم', icon: '🔴' }, { v: 2, t: 'تقييم سنوي شكلي', icon: '🟡' },
                    { v: 3, t: 'تقييم ربعي بأهداف SMART', icon: '🟢' }, { v: 4, t: 'OKR/KPI + تقييم 360°', icon: '⭐' }
                ]
            },
            {
                q: 'ما نسبة دوران الموظفين السنوي؟', opts: [
                    { v: 1, t: 'أكثر من 30%', icon: '🔴' }, { v: 2, t: '15-30%', icon: '🟡' },
                    { v: 3, t: '8-15% — ونحسّن', icon: '🟢' }, { v: 4, t: 'أقل من 8% — بيئة جاذبة', icon: '⭐' }
                ]
            },
            {
                q: 'كم موظف يعرف مساره الوظيفي هنا؟', opts: [
                    { v: 1, t: '0-2 من 10', icon: '🔴' }, { v: 2, t: '3-5 من 10', icon: '🟡' },
                    { v: 3, t: '6-8 من 10', icon: '🟢' }, { v: 4, t: '9-10 — مسارات مرسومة', icon: '⭐' }
                ]
            },
            {
                q: 'كيف تقيسون رضا الموظفين؟', opts: [
                    { v: 1, t: 'لا نقيسه', icon: '🔴' }, { v: 2, t: 'استبيان سنوي شكلي', icon: '🟡' },
                    { v: 3, t: 'Pulse surveys + خطط تحسين', icon: '🟢' }, { v: 4, t: 'eNPS مستمر + برامج رفاهية', icon: '⭐' }
                ]
            }
        ],
        marketing: [
            {
                q: 'لو سألت عملاءك "ما يميّزكم؟" — كم يعطيك نفس الإجابة؟', opts: [
                    { v: 1, t: '0-2 من 10', icon: '🔴' }, { v: 2, t: '3-5 من 10', icon: '🟡' },
                    { v: 3, t: '6-8 يعرفون قيمتنا', icon: '🟢' }, { v: 4, t: '9-10 — USP واضح', icon: '⭐' }
                ]
            },
            {
                q: 'كم تنفق على التسويق — وهل تعرف عائده؟', opts: [
                    { v: 1, t: 'لا ميزانية ولا قياس', icon: '🔴' }, { v: 2, t: 'ميزانية بدون ROI', icon: '🟡' },
                    { v: 3, t: 'ROI مقاس لكل حملة', icon: '🟢' }, { v: 4, t: 'Attribution modeling + أتمتة', icon: '⭐' }
                ]
            },
            {
                q: 'هل عندكم استراتيجية محتوى واضحة؟', opts: [
                    { v: 1, t: 'ننشر عشوائياً', icon: '🔴' }, { v: 2, t: 'تقويم بدون استراتيجية', icon: '🟡' },
                    { v: 3, t: 'استراتيجية + personas + funnel', icon: '🟢' }, { v: 4, t: 'Thought leadership + SEO', icon: '⭐' }
                ]
            },
            {
                q: 'كم نسبة عملائك من قنوات رقمية؟', opts: [
                    { v: 1, t: 'أقل من 10%', icon: '🔴' }, { v: 2, t: '10-30%', icon: '🟡' },
                    { v: 3, t: '30-60%', icon: '🟢' }, { v: 4, t: '60%+ — omni-channel', icon: '⭐' }
                ]
            },
            {
                q: 'هل العلامة التجارية متسقة عبر كل نقاط اللمس؟', opts: [
                    { v: 1, t: 'كل موظف يستخدم شيء مختلف', icon: '🔴' }, { v: 2, t: 'Guidelines بدون التزام', icon: '🟡' },
                    { v: 3, t: 'هوية موحدة + صوت واضح', icon: '🟢' }, { v: 4, t: 'Brand bible + تدقيق دوري', icon: '⭐' }
                ]
            }
        ],
        operations: [
            {
                q: 'لو غاب مسؤول العمليات شهر — هل العمل يستمر؟', opts: [
                    { v: 1, t: 'يتوقف — كل شيء برأسه', icon: '🔴' }, { v: 2, t: 'يتعثر — توثيق جزئي', icon: '🟡' },
                    { v: 3, t: 'يستمر — SOPs واضحة', icon: '🟢' }, { v: 4, t: 'لا يتأثر — أنظمة آلية', icon: '⭐' }
                ]
            },
            {
                q: 'كم نسبة الهدر في عملياتكم الأساسية؟', opts: [
                    { v: 1, t: 'لا نقيس الهدر', icon: '🔴' }, { v: 2, t: 'موجود بدون أرقام', icon: '🟡' },
                    { v: 3, t: 'أقل من 10% ومتابع', icon: '🟢' }, { v: 4, t: 'Lean/Six Sigma — أقل من 3%', icon: '⭐' }
                ]
            },
            {
                q: 'كم مرة تتكرر نفس المشكلة التشغيلية؟', opts: [
                    { v: 1, t: 'دائماً — نفس الحرائق', icon: '🔴' }, { v: 2, t: 'أحياناً — بدون RCA', icon: '🟡' },
                    { v: 3, t: 'نادراً — RCA ثقافة', icon: '🟢' }, { v: 4, t: 'لا تتكرر — نظام وقائي', icon: '⭐' }
                ]
            },
            {
                q: 'هل تقدرون تزيدون الإنتاج 50% بدون توظيف؟', opts: [
                    { v: 1, t: 'مستحيل — مثقلين', icon: '🔴' }, { v: 2, t: 'نحتاج إعادة هيكلة', icon: '🟡' },
                    { v: 3, t: 'ممكن — طاقة فائضة', icon: '🟢' }, { v: 4, t: 'نعم — scalable + أتمتة', icon: '⭐' }
                ]
            },
            {
                q: 'هل مؤشرات الأداء التشغيلي حية ومتابعة؟', opts: [
                    { v: 1, t: 'لا نقيس', icon: '🔴' }, { v: 2, t: 'تقارير شهرية يدوية', icon: '🟡' },
                    { v: 3, t: 'Dashboards أسبوعية', icon: '🟢' }, { v: 4, t: 'Real-time + تنبيهات + تحليل', icon: '⭐' }
                ]
            }
        ],
        support: [
            {
                q: 'لو عميل أرسل شكوى — كم وقت تحتاج لحلها؟', opts: [
                    { v: 1, t: 'أيام — لا نظام واضح', icon: '🔴' }, { v: 2, t: 'يوم — بدون تتبع', icon: '🟡' },
                    { v: 3, t: 'ساعات — نظام تذاكر + SLA', icon: '🟢' }, { v: 4, t: 'دقائق — AI + أتمتة', icon: '⭐' }
                ]
            },
            {
                q: 'هل تعرف درجة رضا عملائك (NPS) الآن؟', opts: [
                    { v: 1, t: 'لا — "اللي ما شكا = راضي"', icon: '🔴' }, { v: 2, t: 'نقيس أحياناً', icon: '🟡' },
                    { v: 3, t: 'NPS/CSAT ربعي + تحسين', icon: '🟢' }, { v: 4, t: 'Real-time CSAT + closed-loop', icon: '⭐' }
                ]
            },
            {
                q: 'كم نسبة العملاء المتكررين (Retention)؟', opts: [
                    { v: 1, t: 'لا نتتبع', icon: '🔴' }, { v: 2, t: 'أقل من 30%', icon: '🟡' },
                    { v: 3, t: '30-60% — برامج ولاء', icon: '🟢' }, { v: 4, t: '60%+ — عملاء أوفياء', icon: '⭐' }
                ]
            },
            {
                q: 'هل فريق الخدمة مدرب ومؤهل؟', opts: [
                    { v: 1, t: 'لا تدريب', icon: '🔴' }, { v: 2, t: 'تدريب أولي فقط', icon: '🟡' },
                    { v: 3, t: 'برنامج + Quality monitoring', icon: '🟢' }, { v: 4, t: 'أكاديمية + مسارات ترقية', icon: '⭐' }
                ]
            },
            {
                q: 'كم قناة تواصل متاحة لعملائك؟', opts: [
                    { v: 1, t: 'هاتف فقط — وأحياناً لا أحد يرد', icon: '🔴' }, { v: 2, t: 'هاتف + واتساب غير منظم', icon: '🟡' },
                    { v: 3, t: 'متعدد القنوات منظم', icon: '🟢' }, { v: 4, t: 'Omni-channel + chatbot', icon: '⭐' }
                ]
            }
        ]
    };

    // ── Wizard State ──
    const wizState = { activeDept: null, currentQ: 0, answers: {} };

    // ── Mode Toggle (exposed globally) ──
    window.setDeptMode = function (mode) {
        document.querySelectorAll('.wiz-mode-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === mode);
        });
        document.getElementById('deptSummaryMode').style.display = mode === 'summary' ? '' : 'none';
        document.getElementById('deptAssessMode').style.display = mode === 'assess' ? '' : 'none';
        if (mode === 'assess') renderWizDeptSelect();
    };

    function renderWizDeptSelect() {
        const deptsThisSize = SIZE_DEPTS[sizeCategory] || DEPTS.map(d => d.key);
        let relevant = DEPTS.filter(d => deptsThisSize.includes(d.key));

        // === فلتر لمدير الإدارة: إدارته فقط ===
        const _deptParam = urlParams.get('dept');
        if (_deptParam) {
            relevant = relevant.filter(d => d.key === _deptParam);
            if (relevant.length === 0) {
                relevant = DEPTS.filter(d => d.key === _deptParam);
            }
        }

        document.getElementById('wizQuestionArea').innerHTML = '';
        document.getElementById('wizResultArea').innerHTML = '';

        const html = relevant.map(dept => {
            const d = healthData.departments[dept.key] || {};
            const isDone = d.completed === true;
            const score = getDeptScore(dept.key);
            return `<div class="wiz-dept-chip ${isDone ? 'done' : ''}" data-action="wiz-start" data-dept="${dept.key}" ${_deptParam ? 'style="max-width:400px;margin:0 auto"' : ''}>
                        <div class="wiz-chip-emoji">${dept.icon}</div>
                        <div class="wiz-chip-name">${dept.label}</div>
                        <div class="wiz-chip-status">${isDone ? '✅ ' + (score != null ? score + '%' : 'مكتمل') : 'ابدأ التقييم'}</div>
                    </div>`;
        }).join('');

        document.getElementById('wizDeptSelect').innerHTML = `
                    <div style="margin-bottom:12px;font-size:14px;color:var(--text-muted)">${_deptParam ? 'قيّم إدارتك — 5 أسئلة (دقيقة واحدة)' : 'اختر الإدارة لتقييمها — 5 أسئلة (دقيقة واحدة)'}</div>
                    <div class="wiz-dept-select-grid">${html}</div>`;
    }

    window.startWizDept = function (deptKey) {
        const dept = DEPTS.find(d => d.key === deptKey);
        if (!dept || !WIZ_QUESTIONS[deptKey]) return;
        wizState.activeDept = deptKey;
        wizState.currentQ = 0;
        // Load existing answers if any
        const existing = healthData.departments[deptKey]?.answers || {};
        wizState.answers = { ...existing };
        document.getElementById('wizDeptSelect').style.display = 'none';
        document.getElementById('wizResultArea').innerHTML = '';
        renderWizQuestion();
    };

    function renderWizQuestion() {
        const deptKey = wizState.activeDept;
        const dept = DEPTS.find(d => d.key === deptKey);
        const qs = WIZ_QUESTIONS[deptKey];
        const qi = wizState.currentQ;
        const q = qs[qi];
        const ansKey = `q${qi}`;
        const currentAns = wizState.answers[ansKey];

        document.getElementById('wizQuestionArea').innerHTML = `
                <div class="wiz-q-card">
                    <div class="wiz-q-badge" style="background:${dept.color}15;color:${dept.color};border:1px solid ${dept.color}30">
                        ${dept.icon} ${dept.label} — السؤال ${qi + 1}/${qs.length}
                    </div>
                    <div class="wiz-q-text">"${q.q}"</div>
                    <div class="wiz-q-options">
                        ${q.opts.map(opt => `
                            <div class="wiz-q-opt ${currentAns === opt.v ? 'selected' : ''}"
                                 data-action="wiz-select"
                                 data-qi="${qi}"
                                 data-val="${opt.v}">
                                <div class="wiz-radio"></div>
                                <span>${opt.icon} ${opt.t}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="wiz-progress-row">
                        <div class="wiz-progress-track">
                            <div class="wiz-progress-fill" style="width:${Math.round(((qi + 1) / qs.length) * 100)}%;background:${dept.color}"></div>
                        </div>
                        <div class="wiz-progress-text">${qi + 1} / ${qs.length}</div>
                    </div>
                    <div class="wiz-nav">
                        <button class="wiz-btn prev" data-action="${qi === 0 ? 'wiz-cancel' : 'wiz-prev'}" >
                            <i class="bi bi-arrow-right"></i> ${qi === 0 ? 'رجوع' : 'السابق'}
                        </button>
                        ${qi < qs.length - 1 ? `
                            <button class="wiz-btn next" data-action="wiz-next" ${!currentAns ? 'disabled' : ''}>
                                التالي <i class="bi bi-arrow-left"></i>
                            </button>
                        ` : `
                            <button class="wiz-btn next" data-action="wiz-finish" ${!currentAns ? 'disabled' : ''}
                                    style="background:linear-gradient(135deg,#22c55e,#16a34a)">
                                🎯 شوف النتيجة <i class="bi bi-arrow-left"></i>
                            </button>
                        `}
                    </div>
                </div>`;
    }

    window.selectWizAnswer = function (qi, v) {
        wizState.answers[`q${qi}`] = v;
        renderWizQuestion();
    };
    window.nextWizQ = function () { wizState.currentQ++; renderWizQuestion(); };
    window.prevWizQ = function () { wizState.currentQ--; renderWizQuestion(); };
    window.cancelWizDept = function () {
        wizState.activeDept = null;
        document.getElementById('wizQuestionArea').innerHTML = '';
        document.getElementById('wizDeptSelect').style.display = '';
        renderWizDeptSelect();
    };

    window.finishWizDept = function () {
        const deptKey = wizState.activeDept;
        const dept = DEPTS.find(d => d.key === deptKey);
        const qs = WIZ_QUESTIONS[deptKey];
        let total = 0;
        qs.forEach((_, i) => { total += (wizState.answers[`q${i}`] || 1); });
        const maxScore = qs.length * 4;
        const pct = Math.round((total / maxScore) * 100);

        // Save to healthData
        if (!healthData.departments[deptKey]) healthData.departments[deptKey] = {};
        healthData.departments[deptKey].score = pct;
        healthData.departments[deptKey].answers = { ...wizState.answers };
        healthData.departments[deptKey].completed = true;
        healthData.departments[deptKey].completedAt = new Date().toISOString();
        healthData.lastUpdated = new Date().toISOString();
        saveUnifiedHealth(healthData);

        // Show result
        const statusColor = scoreColor(pct);
        const statusText = pct >= 70 ? '🟢 أداء جيد' : pct >= 45 ? '🟡 يحتاج تطوير' : '🔴 وضع حرج';
        const verdict = pct >= 70
            ? `إدارة ${dept.label} في وضع قوي. حافظ على هذا المستوى وركّز على التميز.`
            : pct >= 45
                ? `إدارة ${dept.label} تحتاج تطوير في بعض المحاور. راجع الأسئلة الحمراء.`
                : `إدارة ${dept.label} في وضع حرج وتحتاج تدخل فوري. ابدأ بالأولويات.`;

        document.getElementById('wizQuestionArea').innerHTML = '';
        document.getElementById('wizResultArea').innerHTML = `
                <div class="wiz-result-card" style="border-right:4px solid ${dept.color}">
                    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
                        <span style="font-size:32px">${dept.icon}</span>
                        <div style="flex:1">
                            <div style="font-size:16px;font-weight:800">${dept.label}</div>
                            <div style="font-size:12px;color:var(--text-muted)">تم التقييم — ${qs.length} أسئلة</div>
                        </div>
                        <div style="font-size:28px;font-weight:900;color:${statusColor}">${pct}%</div>
                    </div>
                    <div style="height:10px;border-radius:5px;background:rgba(255,255,255,.06);overflow:hidden;margin-bottom:12px">
                        <div style="height:100%;width:${pct}%;background:${statusColor};border-radius:5px;transition:width 1s"></div>
                    </div>
                    <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:${statusColor}">${statusText}</div>
                    <div style="font-size:13px;color:var(--text-muted);line-height:1.7;margin-bottom:16px">${verdict}</div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap">
                        <button class="wiz-btn next" data-action="wiz-cancel" style="background:var(--bg-card);color:var(--text);border:1px solid var(--border)">
                            <i class="bi bi-${urlParams.get('dept') ? 'arrow-repeat' : 'grid-3x3-gap'}"></i> ${urlParams.get('dept') ? 'إعادة التقييم' : 'تقييم إدارة أخرى'}
                        </button>
                        <button class="wiz-btn next" data-action="dept-mode-summary" style="background:linear-gradient(135deg,#667eea,#764ba2)">
                            <i class="bi bi-eye"></i> عرض الملخص
                        </button>
                    </div>
                </div>`;
    };

    // ==================== بدء التشغيل ====================
    switchTab(defaultTab);

    // ==================== 🔴 المؤشرات الحية من API ====================
    // جلب ملخص صحة الشركة من الإدارات (لا يعتمد على localStorage)
    (async function loadLiveHealth() {
        try {
            // ✅ استخدام الموزع المركزي للـ API
            const res = await window.apiRequest('/api/company-health/summary');
            if (!res.ok) return;

            const data = await res.json();
            const cardsContainer = document.getElementById('liveHealthCards');
            const section = document.getElementById('liveHealthSection');

            if (!data.dimensions || data.dimensions.every(d => d.status === 'no_data')) {
                section.style.display = '';
                cardsContainer.innerHTML = `
                                    <div style="grid-column: 1/-1; background: rgba(255,255,255,0.02); border: 2px dashed var(--stx-border); border-radius: 16px; padding: 40px; text-align: center;">
                                        <div style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;">📉</div>
                                        <div style="font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 8px;">لا تتوفر بيانات مؤشرات حية حالياً</div>
                                        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">يمكنك البدء بتقييم الأبعاد الأساسية للإدارات لإظهار النتائج الحية هنا</p>
                                        <button onclick="switchTab('departments')" class="wiz-btn" style="background: var(--stx-accent); color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700;">ابدأ التقييم الآن</button>
                                    </div>
                                `;
                return;
            }

            // أسماء وأيقونات — كائنان منفصلان (لا slice)
            const dimNames = { financial: 'المالي', operational: 'التشغيلي', cultural: 'الثقافي', marketing: 'التسويقي', hr: 'البشري' };
            const dimIcons = { financial: '💰', operational: '⚙️', cultural: '🧬', marketing: '📢', hr: '👥' };
            const dimColors = { financial: '#f59e0b', operational: '#6366f1', cultural: '#8b5cf6', marketing: '#ec4899', hr: '##3b82f6' };

            const statusLabels = {
                excellent: { text: 'ممتاز', color: 'var(--green, #22c55e)' },
                good: { text: 'جيد', color: '#3b82f6' },
                warning: { text: 'يحتاج تطوير', color: 'var(--yellow, #eab308)' },
                critical: { text: 'حرج', color: 'var(--red, #ef4444)' },
                no_data: { text: 'لا بيانات', color: 'var(--text-muted, #94a3b8)' },
            };

            cardsContainer.innerHTML = '';

            data.dimensions.forEach(dim => {
                const card = document.createElement('div');
                card.className = 'dept-card';
                card.style.cursor = dim.status === 'no_data' ? 'default' : 'pointer';

                const name = dimNames[dim.dimension] || dim.dimension;
                const icon = dimIcons[dim.dimension] || '📌';
                const color = dimColors[dim.dimension] || '#64748b';
                const st = statusLabels[dim.status] || statusLabels.no_data;
                const score = dim.score || 0;
                const capped = Math.min(score, 100);

                // بناء البطاقة بـ textContent (لا innerHTML مع user input)
                const header = document.createElement('div');
                header.className = 'dept-card-header';
                header.innerHTML = `
                            <div class="dept-card-icon" style="background:${color}22;color:${color}">${icon}</div>
                            <div>
                                <div class="dept-card-name"></div>
                                <div class="dept-card-status" style="background:${st.color}22;color:${st.color}"></div>
                            </div>
                            <div class="dept-card-score" style="color:${st.color}"></div>
                        `;
                // textContent للنصوص
                header.querySelector('.dept-card-name').textContent = name;
                header.querySelector('.dept-card-status').textContent = st.text;
                header.querySelector('.dept-card-score').textContent = dim.status !== 'no_data' ? score.toFixed(0) + '%' : '—';

                card.appendChild(header);

                // شريط التقدم
                if (dim.status !== 'no_data') {
                    const bar = document.createElement('div');
                    bar.style.cssText = 'height:6px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden;margin:8px 0 4px';
                    const fill = document.createElement('div');
                    fill.style.cssText = `height:100%;width:${capped}%;background:${st.color};border-radius:3px;transition:width 1s`;
                    bar.appendChild(fill);
                    card.appendChild(bar);

                    // عدد المؤشرات + آخر تحديث
                    const meta = document.createElement('div');
                    meta.style.cssText = 'display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:4px';
                    const countEl = document.createElement('span');
                    countEl.textContent = dim.indicatorCount + ' مؤشر';
                    const dateEl = document.createElement('span');
                    if (dim.lastUpdate) {
                        const d = new Date(dim.lastUpdate);
                        dateEl.textContent = '📅 ' + d.toLocaleDateString('ar-EG');
                    }
                    meta.appendChild(countEl);
                    meta.appendChild(dateEl);
                    card.appendChild(meta);
                } else {
                    const empty = document.createElement('div');
                    empty.style.cssText = 'font-size:11px;color:var(--text-muted);margin-top:8px;text-align:center';
                    empty.textContent = 'لم يتم إدخال بيانات بعد';
                    card.appendChild(empty);
                }

                cardsContainer.appendChild(card);
            });

            // عرض السكشن
            document.getElementById('liveHealthSection').style.display = '';

            // تحديث البانر الكلي إذا فيه بيانات
            if (data.overallScore > 0) {
                const existingBanner = document.querySelector('.overall-banner .overall-info h2');
                if (existingBanner) {
                    const liveNote = document.createElement('div');
                    liveNote.style.cssText = 'margin-top:8px;font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px';
                    liveNote.innerHTML = '<i class="bi bi-activity" style="color:#22c55e"></i>';
                    const noteText = document.createElement('span');
                    noteText.textContent = 'النتيجة الحية من ' + data.activeDimensions + ' أبعاد: ' + data.overallScore + '%';
                    liveNote.appendChild(noteText);
                    existingBanner.parentElement.appendChild(liveNote);
                }
            }

            console.log('[CompanyHealth] ✅ Live health data loaded:', data.activeDimensions, 'dimensions');
        } catch (e) {
            console.log('[CompanyHealth] ℹ️ No live data available (offline or no token)');
        }
    })();

    // 🏁 تشغيل التبويب الافتراضي عند التحميل
    if (typeof switchTab === 'function') {
        switchTab(defaultTab);
    }
})();

// ═══ DEPT DETECTION ═══
(function () {
    const _dp = new URLSearchParams(window.location.search).get('dept');
    if (!_dp) return;

    const _deptNames = { hr: 'الموارد البشرية', finance: 'المالية', operations: 'العمليات', marketing: 'التسويق', sales: 'المبيعات', compliance: 'الامتثال', it: 'تقنية المعلومات', cs: 'خدمة العملاء', quality: 'الجودة', support: 'الخدمات المساندة', governance: 'الحوكمة' };
    const _dn = _deptNames[_dp] || _dp;

    // 1. تحديث العنوان
    document.title = 'ستارتكس — صحة إدارة ' + _dn;
    const _pageTitle = document.querySelector('.page-header h1, .logo-text');
    if (_pageTitle) {
        const h1 = document.querySelector('.page-header h1');
        if (h1) h1.textContent = '🏥 صحة إدارة ' + _dn;
    }
    const _subtitle = document.getElementById('companyName');
    if (_subtitle) _subtitle.textContent = 'تحليل شامل لإدارة ' + _dn;

    // 2. إخفاء تبويبات النظرة العامة وسلسلة القيمة (خاصة بـ CEO)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const tabId = btn.getAttribute('data-tab');
        if (tabId === 'overview' || tabId === 'valuechain') {
            btn.style.display = 'none';
        }
    });

    // 3. تعديل عنوان قسم الإدارات
    const _deptSectionTitle = document.querySelector('#tabDepartments .section-title');
    if (_deptSectionTitle) _deptSectionTitle.innerHTML = '<i class="bi bi-building"></i> إدارتي — ' + _dn;

    // 4. إخفاء زر "العودة لمركز القيادة الاستراتيجية" وتغييره للوحة الإدارة
    const _backBtn = document.querySelector('a[href*="ceo-dashboard.html"]');
    if (_backBtn && !_backBtn.href.includes('dept-dashboard')) {
        _backBtn.href = '/dept-dashboard.html?dept=' + _dp;
        _backBtn.innerHTML = '← العودة للوحة إدارتي';
    }

    // 5. تعديل رابط شعار ستارتكس
    const _bl = document.querySelector('a.brand, .navbar-brand');
    if (_bl) _bl.href = '/dept-dashboard.html?dept=' + _dp;

    console.log('[CompanyHealth] ✅ dept mode applied:', _dn);
})();
