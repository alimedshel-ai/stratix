/**
 * Startix — Compliance Audit Pro Engine
 * منطق التقييم + الحفظ التلقائي + عرض المحاور
 */
window.ComplianceAuditEngine = (function () {
    const CFG = window.ComplianceAuditConfig;
    const STORAGE_KEY = 'startix_compliance_audit_pro';

    // ── STATE ──
    let state = {
        meta: {
            companyName: '',
            sector: '',
            companySize: '',
            activityType: '',   // service | commercial | industrial
            sectorType: '',     // private | government | nonprofit | mixed
            analystName: '',
            auditDate: '',
            period: ''
        },
        responses: {},   // { itemId: { status: 'yes'|'partial'|'no'|'none', note: '' } }
        currentAxis: 1,
        startedAt: null,
        lastSaved: null
    };

    // ── HYBRID AXES CACHE ──
    let _hybridAxes = null; // ناتج buildAuditAxes — يُبنى عند بدء الفحص

    /** بناء أو إعادة بناء المحاور حسب النشاط والقطاع */
    function rebuildHybridAxes() {
        if (CFG.buildAuditAxes) {
            var activity = state.meta.activityType || _detectActivityType();
            var sector = state.meta.sectorType || 'private';
            _hybridAxes = CFG.buildAuditAxes(activity, sector);
        } else {
            _hybridAxes = null;
        }
    }

    /** كشف نوع النشاط من localStorage */
    function _detectActivityType() {
        try {
            var diag = JSON.parse(localStorage.getItem('stratix_diagnostic_payload') || '{}');
            return diag.sector || diag.answers?.sector || 'service';
        } catch(e) { return 'service'; }
    }

    /** الحصول على كل المحاور (هجين أو legacy) */
    function getAllAxes() {
        if (_hybridAxes) return _hybridAxes.allAxes;
        var size = state.meta.companySize || 'large';
        return CFG.getAxesForSize(size);
    }

    /** البحث عن محور بأي نوع من المعرّف */
    function findAxis(id) {
        if (_hybridAxes) {
            return _hybridAxes.allAxes.find(function(a) {
                return a.numId === id || a.id === id;
            });
        }
        return CFG.getAxisById(id);
    }

    // ── PERSISTENCE ──
    function save() {
        state.lastSaved = new Date().toISOString();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            showSaveIndicator();
        } catch (e) {
            console.warn('AutoSave failed:', e);
        }
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                Object.assign(state, saved);
                return true;
            }
        } catch (e) {
            console.warn('Load failed:', e);
        }
        return false;
    }

    function clearData() {
        localStorage.removeItem(STORAGE_KEY);
        state = {
            meta: { companyName: '', sector: '', companySize: '', activityType: '', sectorType: '', analystName: '', auditDate: '', period: '' },
            responses: {},
            currentAxis: 1,
            startedAt: null,
            lastSaved: null
        };
        _hybridAxes = null;
    }

    // ── AUTO-SAVE DEBOUNCE ──
    let _saveTimer = null;
    function autoSave() {
        clearTimeout(_saveTimer);
        _saveTimer = setTimeout(save, 400);
    }

    function showSaveIndicator() {
        const el = document.getElementById('saveIndicator');
        if (!el) return;
        el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), 1500);
    }

    // ── SCORING ──
    function getItemScore(itemId) {
        const r = state.responses[itemId];
        if (!r) return 0;
        if (r.status === 'yes') return 1;
        if (r.status === 'partial') return 0.5;
        return 0;
    }

    function getAxisScore(axisId) {
        const axis = findAxis(axisId);
        if (!axis || axis.items.length === 0) return { score: 0, max: 0, pct: 0 };
        const max = axis.items.length;
        const score = axis.items.reduce((sum, item) => sum + getItemScore(item.id), 0);
        return { score, max, pct: max > 0 ? Math.round((score / max) * 100) : 0 };
    }

    function getTotalScore() {
        const axes = getAllAxes();
        let total = 0, max = 0;
        axes.forEach(a => {
            if (a.items.length === 0) return;
            const s = getAxisScore(a.numId || a.id);
            total += s.score;
            max += s.max;
        });
        return { score: total, max, pct: max > 0 ? Math.round((total / max) * 100) : 0 };
    }

    function getCompletionPct() {
        const axes = getAllAxes();
        let answered = 0, total = 0;
        axes.forEach(a => {
            a.items.forEach(item => {
                total++;
                if (state.responses[item.id]?.status && state.responses[item.id].status !== 'none') {
                    answered++;
                }
            });
        });
        return total > 0 ? Math.round((answered / total) * 100) : 0;
    }

    // ── RENDER: META FORM (step 0) ──
    function renderMetaForm() {
        const container = document.getElementById('metaSection');
        if (!container) return;

        container.innerHTML = `
            <a href="/pro-dashboard.html" class="back-link">
                <i class="bi bi-arrow-right"></i>
                العودة للوحة العملاء
            </a>
            <div class="audit-card">
                <div class="card-header">
                    <i class="bi bi-shield-lock-fill" style="color:#6366f1"></i>
                    <h2>معلومات فحص الامتثال</h2>
                </div>
                <div class="meta-grid">
                    <div class="meta-field">
                        <label>اسم الشركة</label>
                        <input type="text" id="metaCompany" placeholder="مثال: شركة النور للتقنية" value="${esc(state.meta.companyName)}">
                    </div>
                    <div class="meta-field">
                        <label>القطاع / الصناعة</label>
                        <select id="metaSector">
                            <option value="">— اختر القطاع —</option>
                        </select>
                    </div>
                    <div class="meta-field">
                        <label>حجم الشركة</label>
                        <select id="metaSize">
                            <option value="">— اختر الحجم —</option>
                            <option value="small" ${state.meta.companySize === 'small' ? 'selected' : ''}>صغيرة (أقل من 20 موظف)</option>
                            <option value="medium" ${state.meta.companySize === 'medium' ? 'selected' : ''}>متوسطة (20–100 موظف)</option>
                            <option value="large" ${state.meta.companySize === 'large' ? 'selected' : ''}>كبيرة (أكثر من 100 موظف)</option>
                        </select>
                    </div>
                    <div class="meta-field">
                        <label>نوع النشاط</label>
                        <select id="metaActivity">
                            <option value="">— اختر نوع النشاط —</option>
                            <option value="service" ${state.meta.activityType === 'service' ? 'selected' : ''}>خدمي</option>
                            <option value="commercial" ${state.meta.activityType === 'commercial' ? 'selected' : ''}>تجاري</option>
                            <option value="industrial" ${state.meta.activityType === 'industrial' ? 'selected' : ''}>صناعي</option>
                        </select>
                    </div>
                    <div class="meta-field">
                        <label>نوع القطاع</label>
                        <select id="metaSectorType">
                            <option value="private" ${state.meta.sectorType === 'private' || !state.meta.sectorType ? 'selected' : ''}>خاص</option>
                            <option value="government" ${state.meta.sectorType === 'government' ? 'selected' : ''}>حكومي</option>
                            <option value="nonprofit" ${state.meta.sectorType === 'nonprofit' ? 'selected' : ''}>غير ربحي</option>
                            <option value="mixed" ${state.meta.sectorType === 'mixed' ? 'selected' : ''}>مختلط</option>
                        </select>
                    </div>
                    <div class="meta-field">
                        <label>اسم المُحلِّل</label>
                        <input type="text" id="metaAnalyst" placeholder="اسم المستشار / المحلل" value="${esc(state.meta.analystName)}">
                    </div>
                    <div class="meta-field">
                        <label>تاريخ الفحص</label>
                        <input type="date" id="metaDate" value="${state.meta.auditDate || new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="meta-field">
                        <label>الفترة المشمولة</label>
                        <input type="text" id="metaPeriod" placeholder="مثال: Q1 2026" value="${esc(state.meta.period)}">
                    </div>
                </div>
                <div class="meta-actions">
                    <button class="btn-audit-primary" id="btnStartAudit" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
                        <i class="bi bi-play-fill"></i>
                        ابدأ الفحص
                    </button>
                </div>
            </div>
        `;

        loadSectors();
        bindMetaEvents();
    }

    async function loadSectors() {
        const sel = document.getElementById('metaSector');
        if (!sel) return;
        try {
            const res = await fetch('/assets/data/sector-benchmarks.json');
            const data = await res.json();
            Object.entries(data.sectors).forEach(([key, s]) => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = s.label;
                if (state.meta.sector === key) opt.selected = true;
                sel.appendChild(opt);
            });
        } catch (e) {
            ['saas:SaaS', 'retail:تجزئة', 'services:خدمات', 'industrial:صناعي', 'fnb:مطاعم', 'real_estate:عقارات', 'health:صحة', 'education:تعليم', 'finance:مالي', 'energy:طاقة'].forEach(s => {
                const [k, l] = s.split(':');
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = l;
                if (state.meta.sector === k) opt.selected = true;
                sel.appendChild(opt);
            });
        }
    }

    function bindMetaEvents() {
        const fields = {
            metaCompany: 'companyName',
            metaSector: 'sector',
            metaSize: 'companySize',
            metaActivity: 'activityType',
            metaSectorType: 'sectorType',
            metaAnalyst: 'analystName',
            metaDate: 'auditDate',
            metaPeriod: 'period'
        };
        Object.entries(fields).forEach(([elId, key]) => {
            const el = document.getElementById(elId);
            if (el) el.addEventListener('input', () => {
                state.meta[key] = el.value;
                autoSave();
            });
            if (el && el.tagName === 'SELECT') {
                el.addEventListener('change', () => {
                    state.meta[key] = el.value;
                    autoSave();
                });
            }
        });

        document.getElementById('btnStartAudit')?.addEventListener('click', () => {
            if (!state.meta.sector || !state.meta.companySize) {
                showToast('اختر القطاع وحجم الشركة أولاً', 'warn');
                return;
            }
            // تعيين القيم الافتراضية للنشاط والقطاع
            if (!state.meta.activityType) state.meta.activityType = _detectActivityType();
            if (!state.meta.sectorType) state.meta.sectorType = 'private';
            rebuildHybridAxes();
            state.startedAt = state.startedAt || new Date().toISOString();
            state.currentAxis = getAllAxes()[0]?.numId || 1;
            save();
            showAuditView();
        });
    }

    // ── RENDER: AUDIT VIEW ──
    function showAuditView() {
        document.getElementById('metaSection').style.display = 'none';
        document.getElementById('auditSection').style.display = 'block';
        renderAxesNav();
        renderCurrentAxis();
        updateProgress();
    }

    function renderAxesNav() {
        const nav = document.getElementById('axesNav');
        if (!nav) return;
        const axes = getAllAxes();
        nav.innerHTML = axes.map(a => {
            const axisKey = a.numId || a.id;
            const s = getAxisScore(axisKey);
            const active = axisKey === state.currentAxis ? 'active' : '';
            const empty = a.items.length === 0 ? 'disabled' : '';
            const layerBadge = a.layer && a.layer !== 'core' ? '<span class="axis-layer-badge" style="font-size:10px;opacity:0.7">سياقي</span>' : '';
            return `
                <div class="axis-nav-item ${active} ${empty}" data-axis="${axisKey}" onclick="ComplianceAuditEngine.goToAxis(${typeof axisKey === 'number' ? axisKey : "'" + axisKey + "'"})">
                    <div class="axis-nav-icon" style="color:${a.color}"><i class="bi ${a.icon}"></i></div>
                    <div class="axis-nav-label">${a.name} ${layerBadge}</div>
                    ${a.items.length > 0 ? `<div class="axis-nav-score" style="color:${a.color}">${s.pct}%</div>` : '<div class="axis-nav-score" style="color:var(--muted)">قريباً</div>'}
                </div>
            `;
        }).join('');
    }

    function renderCurrentAxis() {
        const axis = findAxis(state.currentAxis);
        if (!axis) return;
        const container = document.getElementById('axisContent');
        if (!container) return;
        const axisKey = axis.numId || axis.id;

        if (axis.items.length === 0) {
            container.innerHTML = `
                <div class="audit-card" style="text-align:center;padding:60px 20px">
                    <i class="bi ${axis.icon}" style="font-size:48px;color:${axis.color};opacity:0.5"></i>
                    <h3 style="margin-top:16px;color:var(--muted)">هذا المحور سيُضاف في التحديث القادم</h3>
                </div>
            `;
            return;
        }

        const axes = getAllAxes();
        const axisIndex = axes.findIndex(a => (a.numId || a.id) === state.currentAxis);
        const displayNum = axisIndex + 1;

        let html = `
            <div class="axis-header" style="--axis-color:${axis.color}">
                <div class="axis-icon" style="background:${axis.color}15"><i class="bi ${axis.icon}" style="color:${axis.color}"></i></div>
                <div>
                    <h2>المحور ${displayNum}: ${axis.name}</h2>
                    <span class="axis-count">${axis.items.length} بند</span>
                    ${axis.layer && axis.layer !== 'core' ? '<span style="margin-right:8px;font-size:12px;color:#6366f1;background:#eef2ff;padding:2px 8px;border-radius:8px">محور سياقي</span>' : ''}
                </div>
                <div class="axis-score-badge" id="axisScoreBadge" style="color:${axis.color};background:${axis.color}12">${getAxisScore(axisKey).pct}%</div>
            </div>
        `;

        axis.items.forEach(item => { html += renderItem(item, axis.color); });

        html += `
            <div class="audit-card axis-notes">
                <label><i class="bi bi-pencil-square"></i> ملاحظات المُحلِّل على هذا المحور</label>
                <textarea id="axisNote_${axisKey}" placeholder="اكتب ملاحظاتك هنا..." rows="3">${esc(state.responses['_note_axis_' + axisKey]?.note || '')}</textarea>
            </div>
        `;

        const currentIdx = axisIndex;
        const prevKey = currentIdx > 0 ? (axes[currentIdx - 1].numId || axes[currentIdx - 1].id) : null;
        const nextKey = currentIdx < axes.length - 1 ? (axes[currentIdx + 1].numId || axes[currentIdx + 1].id) : null;
        const goToArg = (k) => typeof k === 'number' ? k : "'" + k + "'";
        html += `
            <div class="axis-nav-buttons">
                ${prevKey !== null ? `<button class="btn-audit-secondary" onclick="ComplianceAuditEngine.goToAxis(${goToArg(prevKey)})"><i class="bi bi-arrow-right"></i> المحور السابق</button>` : '<div></div>'}
                ${nextKey !== null ? `<button class="btn-audit-primary" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)" onclick="ComplianceAuditEngine.goToAxis(${goToArg(nextKey)})">المحور التالي <i class="bi bi-arrow-left"></i></button>` : `<button class="btn-audit-primary" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)" onclick="ComplianceAuditEngine.showSummary()"><i class="bi bi-file-earmark-bar-graph"></i> عرض الملخص</button>`}
            </div>
        `;

        container.innerHTML = html;

        const noteEl = document.getElementById('axisNote_' + axisKey);
        if (noteEl) {
            noteEl.addEventListener('input', () => {
                if (!state.responses['_note_axis_' + axisKey]) {
                    state.responses['_note_axis_' + axisKey] = { status: 'none', note: '' };
                }
                state.responses['_note_axis_' + axisKey].note = noteEl.value;
                autoSave();
            });
        }

        axis.items.forEach(item => bindItemEvents(item.id, axis));
    }

    function renderItem(item, color) {
        const r = state.responses[item.id] || { status: 'none', note: '' };
        return `
            <div class="audit-item" data-item="${item.id}">
                <div class="item-main">
                    <div class="item-label">${item.label}</div>
                    <div class="item-question">${item.question}</div>
                    <div class="item-evidence"><i class="bi bi-file-earmark-text"></i> ${item.evidence}</div>
                </div>
                <div class="item-choices">
                    <button class="choice-btn choice-yes ${r.status === 'yes' ? 'active' : ''}" data-item="${item.id}" data-status="yes" title="متوفر بالكامل">
                        <i class="bi bi-check-circle-fill"></i>
                    </button>
                    <button class="choice-btn choice-partial ${r.status === 'partial' ? 'active' : ''}" data-item="${item.id}" data-status="partial" title="متوفر جزئياً">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                    </button>
                    <button class="choice-btn choice-no ${r.status === 'no' ? 'active' : ''}" data-item="${item.id}" data-status="no" title="غير متوفر">
                        <i class="bi bi-x-circle-fill"></i>
                    </button>
                </div>
                <div class="item-note-toggle" onclick="ComplianceAuditEngine.toggleNote('${item.id}')">
                    <i class="bi bi-chat-dots"></i>
                </div>
                <div class="item-note ${r.note ? 'has-note' : ''}" id="note_${item.id}" style="display:${r.note ? 'block' : 'none'}">
                    <textarea placeholder="ملاحظة..." rows="2">${esc(r.note)}</textarea>
                </div>
            </div>
        `;
    }

    function bindItemEvents(itemId, axis) {
        document.querySelectorAll(`.choice-btn[data-item="${itemId}"]`).forEach(btn => {
            btn.addEventListener('click', () => {
                const status = btn.dataset.status;
                if (!state.responses[itemId]) state.responses[itemId] = { status: 'none', note: '' };

                if (state.responses[itemId].status === status) {
                    state.responses[itemId].status = 'none';
                } else {
                    state.responses[itemId].status = status;
                }

                document.querySelectorAll(`.choice-btn[data-item="${itemId}"]`).forEach(b => b.classList.remove('active'));
                if (state.responses[itemId].status !== 'none') {
                    btn.classList.add('active');
                }

                autoSave();
                updateProgress();
                updateAxisScoreBadge(axis);
                renderAxesNav();
            });
        });

        const noteArea = document.querySelector(`#note_${itemId} textarea`);
        if (noteArea) {
            noteArea.addEventListener('input', () => {
                if (!state.responses[itemId]) state.responses[itemId] = { status: 'none', note: '' };
                state.responses[itemId].note = noteArea.value;
                const noteContainer = document.getElementById('note_' + itemId);
                if (noteContainer) noteContainer.classList.toggle('has-note', !!noteArea.value);
                autoSave();
            });
        }
    }

    function toggleNote(itemId) {
        const el = document.getElementById('note_' + itemId);
        if (!el) return;
        const visible = el.style.display !== 'none';
        el.style.display = visible ? 'none' : 'block';
        if (!visible) {
            el.querySelector('textarea')?.focus();
        }
    }

    function updateAxisScoreBadge(axis) {
        const badge = document.getElementById('axisScoreBadge');
        if (badge) badge.textContent = getAxisScore(axis.numId || axis.id).pct + '%';
    }

    function updateProgress() {
        const pct = getCompletionPct();
        const bar = document.getElementById('progressBar');
        if (bar) bar.style.width = pct + '%';
        const txt = document.getElementById('progressText');
        if (txt) txt.textContent = pct + '%';

        const total = getTotalScore();
        const scoreNum = document.getElementById('totalScoreNum');
        if (scoreNum) scoreNum.textContent = Math.round(total.score);
        const scoreMax = document.getElementById('totalScoreMax');
        if (scoreMax) scoreMax.textContent = '/ ' + total.max;
    }

    function goToAxis(axisId) {
        const axis = findAxis(axisId);
        if (!axis || axis.items.length === 0) {
            showToast('هذا المحور سيُضاف قريباً', 'info');
            return;
        }
        state.currentAxis = axis.numId || axis.id;
        autoSave();
        renderAxesNav();
        renderCurrentAxis();
        document.getElementById('axisContent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ── SUMMARY ──
    function showSummary() {
        const total = getTotalScore();
        const level = CFG.getScoreLevel(Math.round(total.score));
        const container = document.getElementById('axisContent');
        if (!container) return;

        const axes = getAllAxes();
        const firstAxisKey = axes[0] ? (axes[0].numId || axes[0].id) : 1;

        container.innerHTML = `
            <div class="audit-card summary-card">
                <div class="summary-header">
                    <i class="bi bi-shield-lock-fill" style="font-size:32px;color:${level.color}"></i>
                    <h2>ملخص فحص الامتثال</h2>
                    ${_hybridAxes ? `<div style="font-size:13px;color:var(--muted);margin-top:4px">${axes.length} محور (${_hybridAxes.coreAxes.length} أساسي + ${_hybridAxes.contextualAxes.length} سياقي)</div>` : ''}
                </div>
                <div class="summary-score-ring" style="--ring-color:${level.color}">
                    <div class="ring-num">${Math.round(total.score)}</div>
                    <div class="ring-max">/ ${total.max}</div>
                </div>
                <div class="summary-level" style="color:${level.color}">${level.label}</div>
                <div class="summary-desc">${level.desc}</div>

                <div class="summary-axes-grid">
                    ${axes.filter(a => a.items.length > 0).map(a => {
                        const s = getAxisScore(a.numId || a.id);
                        return `
                            <div class="summary-axis-row">
                                <div class="sa-icon" style="color:${a.color}"><i class="bi ${a.icon}"></i></div>
                                <div class="sa-name">${a.name}${a.layer && a.layer !== 'core' ? ' <small style="color:#6366f1">(سياقي)</small>' : ''}</div>
                                <div class="sa-bar">
                                    <div class="sa-bar-fill" style="width:${s.pct}%;background:${a.color}"></div>
                                </div>
                                <div class="sa-score">${s.score}/${s.max}</div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="summary-meta">
                    <span><i class="bi bi-building"></i> ${esc(state.meta.companyName || '—')}</span>
                    <span><i class="bi bi-calendar"></i> ${state.meta.auditDate || '—'}</span>
                    <span><i class="bi bi-person"></i> ${esc(state.meta.analystName || '—')}</span>
                </div>

                <div class="summary-actions">
                    <button class="btn-audit-secondary" onclick="ComplianceAuditEngine.goToAxis(${typeof firstAxisKey === 'number' ? firstAxisKey : "'" + firstAxisKey + "'"})">
                        <i class="bi bi-arrow-right"></i> العودة للمحاور
                    </button>
                    <button class="btn-audit-primary btn-disabled" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)" title="سيتوفر في التحديث القادم">
                        <i class="bi bi-file-pdf"></i> تصدير PDF (قريباً)
                    </button>
                </div>
            </div>
        `;
    }

    // ── TOAST ──
    function showToast(msg, type) {
        let toast = document.getElementById('auditToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'auditToast';
            toast.className = 'audit-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.className = 'audit-toast ' + (type || 'info');
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 2500);
    }

    // ── HELPERS ──
    function esc(s) {
        if (!s) return '';
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ── تعبئة تلقائية من كل المصادر المتاحة ──
    function prefillFromDiagnostic() {
        try {
            const companies = JSON.parse(localStorage.getItem('startix_pro_companies') || '[]');
            const activeId = localStorage.getItem('startix_pro_active');
            const client = companies.find(c => c.id === activeId) || companies[0] || {};
            const diag = JSON.parse(localStorage.getItem('stratix_manager_diagnostic') || '{}');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const entity = user.entity || {};

            const params = new URLSearchParams(window.location.search);

            if (!state.meta.companyName) {
                state.meta.companyName = entity.legalName || entity.displayName || client.name || diag.companyName || params.get('company') || '';
            }

            if (!state.meta.sector) {
                state.meta.sector = entity.sectorKey || client.sector || diag.sector || diag.activity || '';
            }

            if (!state.meta.companySize) {
                const sizeMap = { '<3': 'small', '3-10': 'small', '10-30': 'medium', '30+': 'large' };
                state.meta.companySize = entity.size || client.size || sizeMap[diag.teamSize] || '';
            }

            if (!state.meta.analystName) {
                state.meta.analystName = diag.analystName || user.name || '';
            }

            if (!state.meta.auditDate) {
                state.meta.auditDate = new Date().toISOString().split('T')[0];
            }
        } catch (e) { console.warn('Prefill failed:', e); }
    }

    // ── INIT ──
    function init() {
        const hasData = load();
        prefillFromDiagnostic();

        // Auto-detect activity type if not set
        if (!state.meta.activityType) state.meta.activityType = _detectActivityType();
        if (!state.meta.sectorType) state.meta.sectorType = 'private';

        // Build hybrid axes
        rebuildHybridAxes();

        if (hasData && state.startedAt && state.meta.sector && state.meta.companySize) {
            renderMetaForm();
            showAuditView();
        } else {
            renderMetaForm();
        }
    }

    // ── PUBLIC ──
    return {
        init,
        goToAxis,
        toggleNote,
        showSummary,
        clearData,
        getState: () => state,
        save
    };

})();