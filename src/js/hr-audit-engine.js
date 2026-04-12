/**
 * Startix — HR Audit Pro Engine
 * منطق التقييم + الحفظ التلقائي + عرض المحاور
 * مطابق لـ sales-audit-engine.js مع تغيير المراجع
 */
window.HRAuditEngine = (function () {
    const CFG = window.HRAuditConfig;
    const STORAGE_KEY = 'startix_hr_audit';

    let state = {
        meta: { companyName: '', sector: '', companySize: '', analystName: '', auditDate: '', period: '' },
        responses: {},
        currentAxis: 1,
        startedAt: null,
        lastSaved: null
    };

    function save() {
        state.lastSaved = new Date().toISOString();
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); showSaveIndicator(); }
        catch (e) { console.warn('AutoSave failed:', e); }
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) { Object.assign(state, JSON.parse(raw)); return true; }
        } catch (e) { console.warn('Load failed:', e); }
        return false;
    }

    function clearData() {
        localStorage.removeItem(STORAGE_KEY);
        state = { meta: { companyName: '', sector: '', companySize: '', analystName: '', auditDate: '', period: '' }, responses: {}, currentAxis: 1, startedAt: null, lastSaved: null };
    }

    let _saveTimer = null;
    function autoSave() { clearTimeout(_saveTimer); _saveTimer = setTimeout(save, 400); }

    function showSaveIndicator() {
        const el = document.getElementById('saveIndicator');
        if (!el) return;
        el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), 1500);
    }

    function getItemScore(itemId) {
        const r = state.responses[itemId];
        if (!r) return 0;
        if (r.status === 'yes') return 1;
        if (r.status === 'partial') return 0.5;
        return 0;
    }

    function getAxisScore(axisId) {
        const axis = CFG.getAxisById(axisId);
        if (!axis || axis.items.length === 0) return { score: 0, max: 0, pct: 0 };
        const max = axis.items.length;
        const score = axis.items.reduce((sum, item) => sum + getItemScore(item.id), 0);
        return { score, max, pct: max > 0 ? Math.round((score / max) * 100) : 0 };
    }

    function getTotalScore() {
        const size = state.meta.companySize || 'large';
        const axes = CFG.getAxesForSize(size);
        let total = 0, max = 0;
        axes.forEach(a => { const s = getAxisScore(a.id); total += s.score; max += s.max; });
        return { score: total, max, pct: max > 0 ? Math.round((total / max) * 100) : 0 };
    }

    function getCompletionPct() {
        const size = state.meta.companySize || 'large';
        const axes = CFG.getAxesForSize(size);
        let answered = 0, total = 0;
        axes.forEach(a => { a.items.forEach(item => { total++; if (state.responses[item.id]?.status && state.responses[item.id].status !== 'none') answered++; }); });
        return total > 0 ? Math.round((answered / total) * 100) : 0;
    }

    function renderMetaForm() {
        const container = document.getElementById('metaSection');
        if (!container) return;
        container.innerHTML = `
            <a href="/pro-dashboard.html" class="back-link"><i class="bi bi-arrow-right"></i> العودة للوحة المدير</a>
            <div class="audit-card">
                <div class="card-header"><i class="bi bi-people"></i><h2>معلومات الفحص الأساسية</h2></div>
                <div class="meta-grid">
                    <div class="meta-field"><label>اسم الشركة</label><input type="text" id="metaCompany" placeholder="مثال: شركة النور للتقنية" value="${esc(state.meta.companyName)}"></div>
                    <div class="meta-field"><label>القطاع / الصناعة</label><select id="metaSector"><option value="">— اختر القطاع —</option></select></div>
                    <div class="meta-field"><label>حجم الشركة</label><select id="metaSize"><option value="">— اختر الحجم —</option><option value="small" ${state.meta.companySize === 'small' ? 'selected' : ''}>صغيرة (أقل من 20 موظف)</option><option value="medium" ${state.meta.companySize === 'medium' ? 'selected' : ''}>متوسطة (20–100 موظف)</option><option value="large" ${state.meta.companySize === 'large' ? 'selected' : ''}>كبيرة (أكثر من 100 موظف)</option></select></div>
                    <div class="meta-field"><label>اسم المُحلِّل</label><input type="text" id="metaAnalyst" placeholder="اسم المستشار / المحلل" value="${esc(state.meta.analystName)}"></div>
                    <div class="meta-field"><label>تاريخ الفحص</label><input type="date" id="metaDate" value="${state.meta.auditDate || new Date().toISOString().split('T')[0]}"></div>
                    <div class="meta-field"><label>الفترة المشمولة</label><input type="text" id="metaPeriod" placeholder="مثال: Q1 2026" value="${esc(state.meta.period)}"></div>
                </div>
                <div class="meta-actions"><button class="btn-audit-primary" id="btnStartAudit"><i class="bi bi-play-fill"></i> ابدأ الفحص</button></div>
            </div>`;
        loadSectors();
        bindMetaEvents();
    }

    async function loadSectors() {
        const sel = document.getElementById('metaSector');
        if (!sel) return;
        try {
            const res = await fetch('/assets/data/sector-benchmarks.json');
            const data = await res.json();
            Object.entries(data.sectors).forEach(([key, s]) => { const opt = document.createElement('option'); opt.value = key; opt.textContent = s.label; if (state.meta.sector === key) opt.selected = true; sel.appendChild(opt); });
        } catch (e) {
            ['saas:SaaS', 'retail:تجزئة', 'services:خدمات', 'industrial:صناعي', 'fnb:مطاعم', 'real_estate:عقارات', 'health:صحة', 'education:تعليم'].forEach(s => { const [k, l] = s.split(':'); const opt = document.createElement('option'); opt.value = k; opt.textContent = l; if (state.meta.sector === k) opt.selected = true; sel.appendChild(opt); });
        }
    }

    function bindMetaEvents() {
        const fields = { metaCompany: 'companyName', metaSector: 'sector', metaSize: 'companySize', metaAnalyst: 'analystName', metaDate: 'auditDate', metaPeriod: 'period' };
        Object.entries(fields).forEach(([elId, key]) => {
            const el = document.getElementById(elId);
            if (el) { el.addEventListener('input', () => { state.meta[key] = el.value; autoSave(); }); if (el.tagName === 'SELECT') el.addEventListener('change', () => { state.meta[key] = el.value; autoSave(); }); }
        });
        document.getElementById('btnStartAudit')?.addEventListener('click', () => {
            if (!state.meta.sector || !state.meta.companySize) { showToast('اختر القطاع وحجم الشركة أولاً', 'warn'); return; }
            state.startedAt = state.startedAt || new Date().toISOString(); save(); showAuditView();
        });
    }

    function showAuditView() {
        document.getElementById('metaSection').style.display = 'none';
        document.getElementById('auditSection').style.display = 'block';
        renderAxesNav(); renderCurrentAxis(); updateProgress();
    }

    function renderAxesNav() {
        const nav = document.getElementById('axesNav');
        if (!nav) return;
        nav.innerHTML = CFG.getAxesForSize(state.meta.companySize).map(a => {
            const s = getAxisScore(a.id);
            return `<div class="axis-nav-item ${a.id === state.currentAxis ? 'active' : ''}" data-axis="${a.id}" onclick="HRAuditEngine.goToAxis(${a.id})">
                <div class="axis-nav-icon" style="color:${a.color}"><i class="bi ${a.icon}"></i></div>
                <div class="axis-nav-label">${a.name}</div>
                <div class="axis-nav-score" style="color:${a.color}">${s.pct}%</div>
            </div>`;
        }).join('');
    }

    function renderCurrentAxis() {
        const axis = CFG.getAxisById(state.currentAxis);
        if (!axis) return;
        const container = document.getElementById('axisContent');
        if (!container) return;

        let html = `<div class="axis-header" style="--axis-color:${axis.color}">
            <div class="axis-icon" style="background:${axis.color}15"><i class="bi ${axis.icon}" style="color:${axis.color}"></i></div>
            <div><h2>المحور ${axis.id}: ${axis.name}</h2><span class="axis-count">${axis.items.length} بند</span></div>
            <div class="axis-score-badge" id="axisScoreBadge" style="color:${axis.color};background:${axis.color}12">${getAxisScore(axis.id).pct}%</div>
        </div>`;

        axis.items.forEach(item => { html += renderItem(item, axis.color); });

        html += `<div class="audit-card axis-notes"><label><i class="bi bi-pencil-square"></i> ملاحظات المُحلِّل على هذا المحور</label>
            <textarea id="axisNote_${axis.id}" placeholder="اكتب ملاحظاتك هنا..." rows="3">${esc(state.responses['_note_axis_' + axis.id]?.note || '')}</textarea></div>`;

        const axes = CFG.getAxesForSize(state.meta.companySize);
        const idx = axes.findIndex(a => a.id === state.currentAxis);
        html += `<div class="axis-nav-buttons">
            ${idx > 0 ? `<button class="btn-audit-secondary" onclick="HRAuditEngine.goToAxis(${axes[idx - 1].id})"><i class="bi bi-arrow-right"></i> المحور السابق</button>` : '<div></div>'}
            ${idx < axes.length - 1 ? `<button class="btn-audit-primary" onclick="HRAuditEngine.goToAxis(${axes[idx + 1].id})">المحور التالي <i class="bi bi-arrow-left"></i></button>` : `<button class="btn-audit-primary" onclick="HRAuditEngine.showSummary()"><i class="bi bi-file-earmark-bar-graph"></i> عرض الملخص</button>`}
        </div>`;

        container.innerHTML = html;

        const noteEl = document.getElementById('axisNote_' + axis.id);
        if (noteEl) noteEl.addEventListener('input', () => { if (!state.responses['_note_axis_' + axis.id]) state.responses['_note_axis_' + axis.id] = { status: 'none', note: '' }; state.responses['_note_axis_' + axis.id].note = noteEl.value; autoSave(); });
        axis.items.forEach(item => bindItemEvents(item.id, axis));
    }

    function renderItem(item, color) {
        const r = state.responses[item.id] || { status: 'none', note: '' };
        return `<div class="audit-item" data-item="${item.id}">
            <div class="item-main"><div class="item-label">${item.label}</div><div class="item-question">${item.question}</div><div class="item-evidence"><i class="bi bi-file-earmark-text"></i> ${item.evidence}</div></div>
            <div class="item-choices">
                <button class="choice-btn choice-yes ${r.status === 'yes' ? 'active' : ''}" data-item="${item.id}" data-status="yes" title="متوفر بالكامل"><i class="bi bi-check-circle-fill"></i></button>
                <button class="choice-btn choice-partial ${r.status === 'partial' ? 'active' : ''}" data-item="${item.id}" data-status="partial" title="متوفر جزئياً"><i class="bi bi-exclamation-triangle-fill"></i></button>
                <button class="choice-btn choice-no ${r.status === 'no' ? 'active' : ''}" data-item="${item.id}" data-status="no" title="غير متوفر"><i class="bi bi-x-circle-fill"></i></button>
            </div>
            <div class="item-note-toggle" onclick="HRAuditEngine.toggleNote('${item.id}')"><i class="bi bi-chat-dots"></i></div>
            <div class="item-note ${r.note ? 'has-note' : ''}" id="note_${item.id}" style="display:${r.note ? 'block' : 'none'}"><textarea placeholder="ملاحظة..." rows="2">${esc(r.note)}</textarea></div>
        </div>`;
    }

    function bindItemEvents(itemId, axis) {
        document.querySelectorAll(`.choice-btn[data-item="${itemId}"]`).forEach(btn => {
            btn.addEventListener('click', () => {
                const status = btn.dataset.status;
                if (!state.responses[itemId]) state.responses[itemId] = { status: 'none', note: '' };
                state.responses[itemId].status = state.responses[itemId].status === status ? 'none' : status;
                document.querySelectorAll(`.choice-btn[data-item="${itemId}"]`).forEach(b => b.classList.remove('active'));
                if (state.responses[itemId].status !== 'none') btn.classList.add('active');
                autoSave(); updateProgress();
                const badge = document.getElementById('axisScoreBadge');
                if (badge) badge.textContent = getAxisScore(axis.id).pct + '%';
                renderAxesNav();
            });
        });
        const noteArea = document.querySelector(`#note_${itemId} textarea`);
        if (noteArea) noteArea.addEventListener('input', () => { if (!state.responses[itemId]) state.responses[itemId] = { status: 'none', note: '' }; state.responses[itemId].note = noteArea.value; document.getElementById('note_' + itemId)?.classList.toggle('has-note', !!noteArea.value); autoSave(); });
    }

    function toggleNote(itemId) { const el = document.getElementById('note_' + itemId); if (!el) return; const v = el.style.display !== 'none'; el.style.display = v ? 'none' : 'block'; if (!v) el.querySelector('textarea')?.focus(); }

    function updateProgress() {
        const pct = getCompletionPct();
        const bar = document.getElementById('progressBar'); if (bar) bar.style.width = pct + '%';
        const txt = document.getElementById('progressText'); if (txt) txt.textContent = pct + '%';
        const total = getTotalScore();
        const scoreNum = document.getElementById('totalScoreNum'); if (scoreNum) scoreNum.textContent = Math.round(total.score);
        const scoreMax = document.getElementById('totalScoreMax'); if (scoreMax) scoreMax.textContent = '/ ' + total.max;
    }

    function goToAxis(axisId) {
        state.currentAxis = axisId; autoSave(); renderAxesNav(); renderCurrentAxis();
        document.getElementById('axisContent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function showSummary() {
        const total = getTotalScore();
        const level = CFG.getScoreLevel(Math.round(total.score));
        const container = document.getElementById('axisContent');
        if (!container) return;
        const axes = CFG.getAxesForSize(state.meta.companySize);
        container.innerHTML = `<div class="audit-card summary-card">
            <div class="summary-header"><i class="bi bi-bar-chart-line-fill" style="font-size:32px;color:${level.color}"></i><h2>ملخص فحص الموارد البشرية</h2></div>
            <div class="summary-score-ring" style="--ring-color:${level.color}"><div class="ring-num">${Math.round(total.score)}</div><div class="ring-max">/ ${total.max}</div></div>
            <div class="summary-level" style="color:${level.color}">${level.label}</div>
            <div class="summary-desc">${level.desc}</div>
            <div class="summary-axes-grid">${axes.map(a => { const s = getAxisScore(a.id); return `<div class="summary-axis-row"><div class="sa-icon" style="color:${a.color}"><i class="bi ${a.icon}"></i></div><div class="sa-name">${a.name}</div><div class="sa-bar"><div class="sa-bar-fill" style="width:${s.pct}%;background:${a.color}"></div></div><div class="sa-score">${s.score}/${s.max}</div></div>`; }).join('')}</div>
            <div class="summary-meta"><span><i class="bi bi-building"></i> ${esc(state.meta.companyName || '—')}</span><span><i class="bi bi-calendar"></i> ${state.meta.auditDate || '—'}</span><span><i class="bi bi-person"></i> ${esc(state.meta.analystName || '—')}</span></div>
            <div class="summary-actions"><button class="btn-audit-secondary" onclick="HRAuditEngine.goToAxis(1)"><i class="bi bi-arrow-right"></i> العودة للمحاور</button><button class="btn-audit-primary btn-disabled" title="سيتوفر في التحديث القادم"><i class="bi bi-file-pdf"></i> تصدير PDF (قريباً)</button></div>
        </div>`;
    }

    function showToast(msg, type) {
        let toast = document.getElementById('auditToast');
        if (!toast) { toast = document.createElement('div'); toast.id = 'auditToast'; toast.className = 'audit-toast'; document.body.appendChild(toast); }
        toast.textContent = msg; toast.className = 'audit-toast ' + (type || 'info'); toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 2500);
    }

    function esc(s) { if (!s) return ''; return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    function init() {
        const hasData = load();
        if (hasData && state.startedAt && state.meta.sector && state.meta.companySize) { renderMetaForm(); showAuditView(); }
        else { renderMetaForm(); }
    }

    return { init, goToAxis, toggleNote, showSummary, clearData, getState: () => state, save };
})();
