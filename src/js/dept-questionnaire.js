// dept-questionnaire.js — منفصل عن HTML لتجنب مشاكل encoding

(function () {
    'use strict';

    // ============================================================
    // CONSTANTS
    // ============================================================
    const CODE_TO_ROLE = {
        FINANCE: 'CFO', MARKETING: 'CMO', OPERATIONS: 'COO',
        HR: 'CHRO', TECH: 'CTO', SALES: 'CSO', IT: 'CTO',
        CS: 'CCO', SUPPORT: 'CCO', LEGAL: 'CLO', COMPLIANCE: 'CLO',
        QUALITY: 'COO', PROJECTS: 'COO'
    };

    const DEPT_COLORS = {
        FINANCE: '#f59e0b', MARKETING: '#8b5cf6', OPERATIONS: '#3b82f6',
        HR: '#10b981', TECH: '#06b6d4', IT: '#06b6d4', SALES: '#ef4444',
        CS: '#ec4899', SUPPORT: '#ec4899', LEGAL: '#6366f1', COMPLIANCE: '#6366f1'
    };

    // ============================================================
    // STATE
    // ============================================================
    const params = new URLSearchParams(location.search);
    let deptCode = (params.get('dept') || '').toUpperCase();
    const deptRole = params.get('role') || '';
    const deptId = params.get('id') || '';

    let questionnaire = null;
    let currentDeptId = deptId || null;
    let autoSaveTimer = null;
    let user = {};
    let entityId = null;

    // ============================================================
    // INIT
    // ============================================================
    async function init() {


        // 1. Get user via window.api (handles caching + no-cache header)
        try {
            let attempts = 0;
            while ((!window.api || !window.api.getCurrentUser) && attempts < 40) {
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }

            if (!window.api || !window.api.getCurrentUser) {
                console.error('[Q] window.api unavailable after 4s');
                window.location.href = '/login.html';
                return;
            }

            user = await window.api.getCurrentUser();
            if (!user || !user.id) {
                console.warn('[Q] no user, redirecting to login');
                window.location.href = '/login.html';
                return;
            }
            entityId = user.entity?.id || user.entityId || null;

        } catch (e) {
            console.warn('[Q] getCurrentUser error:', e.message);
            window.location.href = '/login.html';
            return;
        }

        // 2. Determine dept code
        if (!deptCode) {
            const uCat = user.userCategory || '';
            if (uCat.startsWith('DEPT_')) {
                let code = uCat.replace('DEPT_', '').toUpperCase();
                const catMap = { OPS: 'OPERATIONS', SERVICE: 'CS', PMO: 'PROJECTS' };
                deptCode = catMap[code] || code;
            }
        }

        // 3. Determine role
        const role = deptRole || CODE_TO_ROLE[deptCode];


        if (!role) {
            document.getElementById('qContainer').innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--muted)">
                    <i class="bi bi-exclamation-triangle" style="font-size:48px;display:block;margin-bottom:12px;color:#eab308"></i>
                    <h3>لم يتم تحديد القسم</h3>
                    <p style="font-size:13px">أضف <code>?dept=HR</code> أو <code>?dept=FINANCE</code> للرابط</p>
                    <a href="/dept-dashboard.html" style="color:var(--primary)">العودة للوحة الإدارة</a>
                </div>`;
            return;
        }

        // 4. Load questionnaire template
        try {
            const qUrl = '/api/dept-data/questionnaire/' + role + (entityId ? '?entityId=' + entityId : '');
            const res = await fetch(qUrl, { credentials: 'include' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            questionnaire = await res.json();
        } catch (e) {
            document.getElementById('qContainer').innerHTML =
                '<div style="text-align:center;padding:40px;color:#ef4444">خطأ في تحميل الاستبيان: ' + e.message + '</div>';
            return;
        }

        // 5. Find department ID
        if (!currentDeptId && entityId) {
            try {
                const dRes = await fetch('/api/departments/' + entityId, { credentials: 'include' });
                if (dRes.ok) {
                    const depts = await dRes.json();
                    if (Array.isArray(depts)) {
                        const found = depts.find(d => d.code === deptCode);
                        if (found) currentDeptId = found.id;
                    }
                }
            } catch (e) {
                console.warn('[Q] dept lookup failed:', e.message);
            }
        }

        // 6. Load existing answers
        let savedData = {};
        if (currentDeptId) {
            try {
                const dRes = await fetch('/api/dept-data/' + currentDeptId, { credentials: 'include' });
                if (dRes.ok) {
                    const d = await dRes.json();
                    savedData = d.data || {};
                }
            } catch (e) { }
        }

        // 7. Back link
        const backLink = document.getElementById('backLink');
        if (backLink && (user.userType === 'DEPT_MANAGER' || (user.userCategory && user.userCategory.startsWith('DEPT_')))) {
            backLink.href = '/dept-dashboard.html?dept=' + (deptCode ? deptCode.toLowerCase() : '');
            backLink.innerHTML = '<i class="bi bi-arrow-right"></i> العودة للوحة الإدارة';
        }

        // 8. Render
        const color = DEPT_COLORS[deptCode] || '#667eea';
        const iconEl = document.getElementById('qIcon');
        if (iconEl) {
            iconEl.textContent = questionnaire.icon || questionnaire._sectorConfig?.icon || 'BI';
            iconEl.style.background = color + '20';
            iconEl.style.color = color;
        }
        const titleEl = document.getElementById('qTitle');
        if (titleEl) titleEl.textContent = questionnaire.title || '';
        const subtitleEl = document.getElementById('qSubtitle');
        if (subtitleEl) subtitleEl.textContent = questionnaire.description || '';

        if (questionnaire._sectorConfig) {
            const badge = document.getElementById('sectorBadge');
            if (badge) {
                badge.style.display = 'block';
                badge.style.background = (questionnaire._sectorConfig.color || color) + '15';
                badge.style.color = questionnaire._sectorConfig.color || color;
                badge.textContent = (questionnaire._sectorConfig.icon || '') + ' ' + questionnaire._sectorConfig.nameAr;
            }
        }

        renderQuestions(savedData);
        const qActions = document.getElementById('qActions');
        if (qActions) qActions.style.display = 'flex';
    }

    // ============================================================
    // RENDER
    // ============================================================
    function renderQuestions(saved) {
        const container = document.getElementById('qContainer');
        if (!container) return;

        let allQuestions = [];
        const benchmarks = (questionnaire._sectorConfig && questionnaire._sectorConfig.benchmarks) || questionnaire.benchmarks || {};

        if (questionnaire.sections) {
            let html = '';
            questionnaire.sections.forEach(function (section, si) {
                html += '<div style="margin-top:' + (si > 0 ? '28' : '0') + 'px;margin-bottom:12px;font-size:14px;font-weight:800;color:var(--primary)">' + section.title + '</div>';
                section.questions.forEach(function (q) {
                    allQuestions.push(q);
                    html += renderSingleQuestion(q, allQuestions.length, saved, benchmarks);
                });
            });
            container.innerHTML = html;
        } else if (questionnaire.questions) {
            allQuestions = questionnaire.questions;
            container.innerHTML = allQuestions.map(function (q, i) {
                return renderSingleQuestion(q, i + 1, saved, benchmarks);
            }).join('');
        }

        questionnaire._allQuestions = allQuestions;
        updateProgress();
    }

    function renderSingleQuestion(q, index, saved, benchmarks) {
        const val = saved[q.id] || '';
        const isFilled = val !== '' && val !== undefined && val !== null;
        const total = (questionnaire._allQuestions && questionnaire._allQuestions.length) || (questionnaire.questions && questionnaire.questions.length) || '?';
        const bm = benchmarks[q.id];

        let benchmarkHtml = '';
        if (bm && isFilled && q.type !== 'select') {
            const numVal = parseFloat(val);
            const status = numVal <= bm.good ? 'good' : numVal >= bm.bad ? 'bad' : 'avg';
            const statusColors = { good: '#22c55e', avg: '#f59e0b', bad: '#ef4444' };
            const statusLabels = { good: 'أفضل من المتوسط', avg: 'ضمن المتوسط', bad: 'أعلى من المتوسط' };
            benchmarkHtml = '<div style="margin-top:8px;font-size:11px;color:' + statusColors[status] + '">' + statusLabels[status] + ' (متوسط: ' + bm.avg + (q.unit || '') + ')</div>';
        }

        let inputHtml = '';
        if (q.type === 'select') {
            const options = (q.options || []).map(function (opt) {
                return '<option value="' + opt + '"' + (val === opt ? ' selected' : '') + '>' + opt + '</option>';
            }).join('');
            inputHtml = '<select class="q-select" id="q-' + q.id + '" onchange="window.__qChange(\'' + q.id + '\')"><option value="">اختر...</option>' + options + '</select>';
        } else {
            inputHtml = '<div class="q-input-row"><input type="number" class="q-input" id="q-' + q.id + '" value="' + val + '" placeholder="' + (q.placeholder || '') + '" step="' + (q.type === 'percent' ? '0.1' : '1') + '" oninput="window.__qChange(\'' + q.id + '\')"><span class="q-unit">' + (q.unit || '') + '</span></div>';
        }

        return '<div class="q-card ' + (isFilled ? 'filled' : '') + '" id="card-' + q.id + '">' +
            '<div class="q-label-row"><span class="q-label">' + q.label + '</span>' +
            '<div style="display:flex;align-items:center;gap:8px"><div class="q-filled-dot"></div><span class="q-number">' + index + '/' + total + '</span></div></div>' +
            inputHtml +
            (q.hint ? '<div class="q-hint"><i class="bi bi-info-circle"></i> ' + q.hint + '</div>' : '') +
            benchmarkHtml +
            '</div>';
    }

    // ============================================================
    // INTERACTION
    // ============================================================
    window.__qChange = function (questionId) {
        const card = document.getElementById('card-' + questionId);
        const input = document.getElementById('q-' + questionId);
        if (!input || !card) return;
        if (input.value && input.value !== '') {
            card.classList.add('filled');
        } else {
            card.classList.remove('filled');
        }
        updateProgress();
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(function () { saveDraft(true); }, 3000);
    };

    function updateProgress() {
        const questions = (questionnaire && (questionnaire._allQuestions || questionnaire.questions)) || [];
        const total = questions.length;
        let filled = 0;
        questions.forEach(function (q) {
            const input = document.getElementById('q-' + q.id);
            if (input && input.value && input.value !== '') filled++;
        });
        const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
        const fill = document.getElementById('progressFill');
        const label = document.getElementById('progressLabel');
        const text = document.getElementById('progressText');
        if (fill) fill.style.width = pct + '%';
        if (label) label.textContent = pct + '%';
        if (text) text.textContent = filled + ' من ' + total + ' سؤال مكتمل';
        if (fill) {
            if (pct >= 100) fill.style.background = 'linear-gradient(90deg,#22c55e,#16a34a)';
            else if (pct >= 50) fill.style.background = 'linear-gradient(90deg,#f59e0b,#eab308)';
            else fill.style.background = 'linear-gradient(90deg,var(--primary),var(--secondary))';
        }
    }

    function collectAnswers() {
        const answers = {};
        const questions = (questionnaire && (questionnaire._allQuestions || questionnaire.questions)) || [];
        questions.forEach(function (q) {
            const input = document.getElementById('q-' + q.id);
            if (input && input.value) answers[q.id] = input.value;
        });
        return answers;
    }

    window.__saveAnswers = async function () {
        if (!currentDeptId) { showToast('خطأ: لم يتم تحديد القسم', 'error'); return; }
        const btn = document.getElementById('saveBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> جاري الحفظ...'; }
        try {
            const res = await fetch('/api/dept-data/' + currentDeptId, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: collectAnswers() })
            });
            const data = await res.json();
            if (!res.ok) { showToast(data.error || 'فشل في الحفظ', 'error'); return; }
            showToast(data.message || 'تم الحفظ', 'success');
            const pFill = document.getElementById('progressFill');
            const pLabel = document.getElementById('progressLabel');
            const pText = document.getElementById('progressText');
            if (pFill) pFill.style.width = data.dataPercent + '%';
            if (pLabel) pLabel.textContent = data.dataPercent + '%';
            if (pText) pText.textContent = data.answeredQuestions + ' من ' + data.totalQuestions + ' سؤال مكتمل';
        } catch (e) {
            showToast('خطأ في الاتصال بالخادم', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check2-circle"></i> حفظ البيانات'; }
        }
    };

    window.__saveDraft = async function () { return saveDraft(false); };

    async function saveDraft(isAuto) {
        if (!currentDeptId) return;
        try {
            await fetch('/api/dept-data/' + currentDeptId, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: collectAnswers() })
            });
            if (isAuto) {
                const indicator = document.getElementById('autosaveIndicator');
                if (indicator) {
                    indicator.style.display = 'block';
                    setTimeout(function () { indicator.style.display = 'none'; }, 2000);
                }
            }
        } catch (e) { }
    }

    function showToast(msg, type) {
        const t = document.getElementById('toastBox');
        if (!t) return;
        t.textContent = msg;
        t.style.background = type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)';
        t.style.display = 'block';
        setTimeout(function () { t.style.display = 'none'; }, 3500);
    }

    // ============================================================
    // START
    // ============================================================
    window.__initQuestionnaire = init;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
