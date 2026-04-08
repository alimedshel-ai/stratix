/**
 * ⚡ Startix Dept Report Logic
 * ==========================
 * v1.1.0 — إصلاحات: toast + red flags + draft saving + duplicate ID
 */

(function () {
    let currentStep = 1;
    let deptCode = new URLSearchParams(window.location.search).get('dept') || 'hr';
    const DRAFT_KEY = `fast_report_draft_${deptCode}`;

    let reportData = {
        meta: {
            dept: deptCode,
            manager_email: '',
            submitted_at: null
        },
        status: {},   // Section 1
        problems: {}, // Section 2
        resources: {} // Section 3
    };
    let suggestions = null;

    const config = window.FAST_REPORT_CONFIG;

    // =============================================
    // TOAST
    // =============================================
    function showToast(msg, type = 'info') {
        const toast = document.getElementById('stxToast');
        const icon = document.getElementById('toastIcon');
        const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-bell-fill' };
        toast.className = '';  // reset
        toast.classList.add('t-' + type);
        icon.className = 'bi ' + (icons[type] || icons.info);
        toast.querySelector('.toast-msg').textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
    }

    // =============================================
    // DRAFT — حفظ واسترجاع في sessionStorage
    // =============================================
    function saveDraft() {
        try {
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
                status: reportData.status,
                problems: reportData.problems,
                resources: reportData.resources
            }));
        } catch (e) { /* تجاهل إذا ممتلئ */ }
    }

    function loadDraft() {
        try {
            const saved = sessionStorage.getItem(DRAFT_KEY);
            if (!saved) return false;
            const parsed = JSON.parse(saved);
            if (parsed.status) reportData.status = parsed.status;
            if (parsed.problems) reportData.problems = parsed.problems;
            if (parsed.resources) reportData.resources = parsed.resources;
            return true;
        } catch (e) { return false; }
    }

    function clearDraft() {
        sessionStorage.removeItem(DRAFT_KEY);
    }

    function restoreDraftUI() {
        // استعادة المحاور
        Object.keys(reportData.status).forEach(id => {
            const d = reportData.status[id];
            const card = document.getElementById(`axis-${id}`);
            const label = document.getElementById(`val-${id}`);
            if (card && label) {
                card.classList.add('selected');
                label.textContent = d.label;
                label.style.color = d.color;
            }
        });

        // استعادة المشاكل
        config.PROBLEMS.forEach(p => {
            const val = reportData.problems[p.id];
            if (val) {
                const el = document.querySelector(`[data-field="${p.id}"]`);
                if (el) el.value = val;
            }
        });

        // استعادة الموارد
        config.RESOURCES.forEach(r => {
            const val = reportData.resources[r.id];
            if (val !== undefined && val !== '') {
                const el = document.querySelector(`[data-field="${r.id}"]`);
                if (el) el.value = val;
            }
        });

        checkRedFlags();
    }

    // =============================================
    // RED FLAGS — كشف المشاكل المزمنة والمحاور الحرجة
    // =============================================
    function checkRedFlags() {
        const flags = [];

        // مشكلة مزمنة
        const chronic = (reportData.problems.chronic_issue || '').trim();
        if (chronic.length > 3) {
            const preview = chronic.length > 55 ? chronic.substring(0, 55) + '...' : chronic;
            flags.push(`🔴 مشكلة مزمنة غير محلولة: "${preview}"`);
        }

        // قرار المالك المطلوب
        const ownerDecision = (reportData.problems.owner_decision || '').trim();
        if (ownerDecision.length > 3) {
            flags.push(`⚡ قرار عاجل مطلوب من المالك: "${ownerDecision.length > 45 ? ownerDecision.substring(0, 45) + '...' : ownerDecision}"`);
        }

        // محاور حرجة (val = 1)
        config.STATUS_AXES.forEach(axis => {
            if (reportData.status[axis.id]?.val === 1) {
                flags.push(`⚠️ ${axis.label} — في مستوى حرج يحتاج تدخلاً فورياً`);
            }
        });

        const panel = document.getElementById('redFlagPanel');
        const list = document.getElementById('redFlagList');
        if (!panel || !list) return;

        if (flags.length > 0) {
            list.innerHTML = flags.map(f => `<li>${f}</li>`).join('');
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }

    // =============================================
    // INIT
    // =============================================
    async function init() {
        await loadDiagnosticContext();

        renderStatusGrid();
        renderProblems();
        renderResources();

        // اسم المستخدم
        const _user = JSON.parse(localStorage.getItem('user') || '{}');
        reportData.meta.manager_email = _user.email || '';

        // اسم الإدارة — يحدّث كل العناصر التي تحمل dept-name-slot
        document.querySelectorAll('.dept-name-slot').forEach(el => {
            el.textContent = deptCode.toUpperCase();
        });

        // Navigation
        document.getElementById('btnNext').onclick = nextStep;
        document.getElementById('btnPrev').onclick = prevStep;
        document.getElementById('btnSubmit').onclick = submitReport;

        // استعادة مسودة محفوظة
        if (loadDraft()) {
            restoreDraftUI();
            showToast('تم استعادة مسودة محفوظة 📝', 'info');
        }

        updateUI();
        injectSmartSuggestions();
    }

    // =============================================
    // SMART SUGGESTIONS PER DEPARTMENT
    // =============================================
    const DEPT_HINTS = {
        'compliance': {
            'recurring_pain': ['تأخر استلام الردود القانونية من الإدارات', 'تداخل الصلاحيات بين الرقابة والتشغيل', 'تكرار مخالفات السلامة في المواقع الميدانية'],
            'root_cause': ['عدم وجود نظام GRC مؤتمت', 'ثقافة "تجاوز الإجراءات" في الإدارة الوسطى', 'نقص الكوادر المتخصصة في إدارة المخاطر'],
            'owner_decision': ['اعتماد ميزانية نظام الأتمتة الرقابي', 'إصدار تعميم بقطعية الالتزام بالمخالفات المرصودة', 'ربط الحوافز بمدى الالتزام بالمعايير'],
            'chronic_issue': ['دليل السياسات والإجراءات لم يتم تحديثه منذ عامين', 'تراكم الغرامات المتكررة من جهات الرقابة الخارجية']
        },
        'hr': {
            'recurring_pain': ['تأخر اعتماد طلبات التوظيف', 'دوران وظيفي مرتفع في الأقسام التقنية'],
            'root_cause': ['سلم الرواتب غير منافس للسوق الحالي', 'اعتماد كلي على التوظيف الخارجي بدلاً من الإحلال'],
            'owner_decision': ['اعتماد تحديث هيكل الأجور', 'الموافقة على برنامج "نظام المكافآت المرن"'],
            'chronic_issue': ['عدم وجود خطة تعاقب وظيفي للوظائف القيادية']
        }
    };

    function injectSmartSuggestions() {
        const hints = DEPT_HINTS[deptCode];
        if (!hints) return;

        Object.keys(hints).forEach(fieldId => {
            const container = document.querySelector(`[data-field="${fieldId}"]`)?.parentElement;
            if (container) {
                const optionsHtml = `
                    <div class="mt-2 d-flex flex-wrap gap-2">
                        ${hints[fieldId].map(h => `<span class="badge bg-secondary cursor-pointer hover-accent" onclick="applySuggestion('${fieldId}', '${h}')" style="font-size:10px; font-weight:400; background:rgba(255,255,255,0.05) !important; border:1px solid var(--stx-border); opacity:0.8">+ ${h}</span>`).join('')}
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', optionsHtml);
            }
        });
    }

    window.applySuggestion = function (fieldId, text) {
        const el = document.querySelector(`[data-field="${fieldId}"]`);
        if (el) {
            const current = el.value.trim();
            el.value = current ? current + '، ' + text : text;
            updateProblem(fieldId, el.value);
            showToast('تم إضافة المقترح ✅', 'success');
        }
    };

    async function loadDiagnosticContext() {
        try {
            const res = await window.apiRequest(`/api/dept/analysis/diagnostic-context/${deptCode}`);
            if (res.success && res.suggestions) {
                suggestions = res.suggestions;
                console.log('[FastReport] Suggestions loaded:', suggestions);

                if (suggestions.general_pain) {
                    const painArea = document.getElementById('root_cause');
                    if (painArea) {
                        painArea.placeholder = `مقترح المالك: ${suggestions.general_pain}`;
                    }
                }

                if (suggestions.red_flags && suggestions.red_flags.length > 0) {
                    const list = document.getElementById('suggestionList');
                    list.innerHTML = suggestions.red_flags.map(f => `<li>${f}</li>`).join('');
                    document.getElementById('smartPanel').style.display = 'block';
                }
            }
        } catch (error) {
            console.warn('[FastReport] No diagnostic context:', error.message);
        }
    }

    // =============================================
    // RENDERING
    // =============================================
    function renderStatusGrid() {
        const grid = document.getElementById('statusGrid');
        grid.innerHTML = config.STATUS_AXES.map(axis => {
            const suggestedVal = suggestions?.axes?.[axis.id];
            const suggestionBadge = suggestedVal
                ? `<div class="suggestion-badge" title="بناءً على تشخيص المالك">💡 مقترح</div>`
                : '';

            return `
            <div class="axis-card ${suggestedVal ? 'has-suggestion' : ''}" id="axis-${axis.id}" onclick="openAxisOverlay('${axis.id}')">
                ${suggestionBadge}
                <div class="axis-icon"><i class="bi bi-grid-fill"></i></div>
                <div class="axis-label">${axis.label}</div>
                <div class="axis-val-label" id="val-${axis.id}">لم يُقيّم بعد</div>
            </div>`;
        }).join('');
    }

    function renderProblems() {
        const container = document.getElementById('problemsList');
        container.innerHTML = config.PROBLEMS.map(p => `
            <div class="mb-4 d-flex flex-column">
                <label class="form-label">${p.label}</label>
                <div class="text-muted fs-8 mb-2">${p.question}</div>
                <textarea
                    class="form-control"
                    rows="3"
                    placeholder="${p.placeholder || ''}"
                    data-field="${p.id}"
                    oninput="updateProblem('${p.id}', this.value)"></textarea>
            </div>
        `).join('');
    }

    function renderResources() {
        const container = document.getElementById('resourcesList');
        container.innerHTML = config.RESOURCES.map(r => `
            <div class="resource-card-modern mb-4">
                <div class="row g-4 d-flex align-items-stretch">
                    <div class="col-md-7">
                        <label class="form-label d-flex align-items-center gap-2">
                            <span class="step-mini-num">${config.RESOURCES.indexOf(r) + 1}</span>
                            ${r.label}
                        </label>
                        <div class="text-muted fs-8 mb-3">${r.question}</div>
                        <div class="input-group input-group-lg shadow-sm">
                            <input
                                type="${r.type}"
                                class="form-control"
                                data-field="${r.id}"
                                oninput="updateResource('${r.id}', this.value)"
                                placeholder="أدخل البيانات هنا...">
                            ${r.suffix ? `<span class="input-group-text bg-dark border-secondary text-muted fs-7">${r.suffix}</span>` : ''}
                        </div>
                        
                        ${r.tip ? `
                        <div class="tactical-tip mt-3">
                            <i class="bi bi-lightbulb-fill text-warning"></i>
                            <span><strong>توصية:</strong> ${r.tip}</span>
                        </div>` : ''}
                    </div>
                    
                    <div class="col-md-5">
                        <div class="strategic-context h-100">
                            <div class="sc-title"><i class="bi bi-info-circle"></i> لماذا نسأل هذا السؤال؟</div>
                            <div class="sc-desc">${r.desc || 'لا يتوفر شرح حالياً.'}</div>
                            <div class="sc-impact">
                                <span class="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-1 mt-2">
                                    <i class="bi bi-graph-up-arrow me-1"></i> أثر استراتيجي مرتفع
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // =============================================
    // OVERLAY LOGIC
    // =============================================
    let activeAxisId = null;

    window.openAxisOverlay = function (id) {
        const axis = config.STATUS_AXES.find(a => a.id === id);
        activeAxisId = id;

        document.getElementById('qTitle').textContent = axis.label;
        document.getElementById('qText').textContent = axis.question;

        const optionsEl = document.getElementById('qOptions');
        const currentVal = reportData.status[id]?.val;

        optionsEl.innerHTML = axis.options.map(opt => `
            <div class="option-item ${currentVal === opt.val ? 'active' : ''}" onclick="selectOption(${opt.val})">
                <div style="width:12px; height:12px; border-radius:50%; background:${opt.color}; flex-shrink:0;"></div>
                <div style="flex:1; font-weight:700; font-size:13px;">${opt.label}</div>
                ${currentVal === opt.val ? '<i class="bi bi-check-circle-fill text-accent"></i>' : ''}
            </div>
        `).join('');

        document.getElementById('questionOverlay').style.display = 'flex';
    };

    window.closeOverlay = function () {
        document.getElementById('questionOverlay').style.display = 'none';
        activeAxisId = null;
    };

    window.selectOption = function (val) {
        const axis = config.STATUS_AXES.find(a => a.id === activeAxisId);
        const opt = axis.options.find(o => o.val === val);

        reportData.status[activeAxisId] = { val: val, label: opt.label, color: opt.color };

        const card = document.getElementById(`axis-${activeAxisId}`);
        const label = document.getElementById(`val-${activeAxisId}`);
        card.classList.add('selected');
        label.textContent = opt.label;
        label.style.color = opt.color;

        // تنبيه فوري إذا كان المحور حرجاً
        if (val === 1) {
            showToast(`⚠️ ${axis.label} في مستوى حرج!`, 'warning');
        }

        saveDraft();
        checkRedFlags();

        setTimeout(closeOverlay, 300);
    };

    // =============================================
    // DATA UPDATES
    // =============================================
    window.updateProblem = function (id, val) {
        reportData.problems[id] = val;
        saveDraft();
        // كشف Red Flags فقط للحقول المهمة — لا نعيد الرسم في كل حرف
        if (id === 'chronic_issue' || id === 'owner_decision') {
            checkRedFlags();
        }
    };

    window.updateResource = function (id, val) {
        reportData.resources[id] = val;
        saveDraft();
    };

    // =============================================
    // NAVIGATION
    // =============================================
    function nextStep() {
        if (currentStep === 1) {
            const unanswered = config.STATUS_AXES.filter(a => !reportData.status[a.id]);
            if (unanswered.length > 0) {
                showToast(`باقي ${unanswered.length} محور لم يُقيَّم بعد`, 'warning');
                // اهزّ الكروت الغير مقيَّمة
                unanswered.forEach(a => {
                    const card = document.getElementById(`axis-${a.id}`);
                    if (card) {
                        card.style.animation = 'none';
                        card.style.border = '1px solid #ef4444';
                        setTimeout(() => { card.style.border = ''; }, 2000);
                    }
                });
                return;
            }
        }

        if (currentStep < 3) {
            currentStep++;
            updateUI();
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
        }
    }

    function updateUI() {
        document.querySelectorAll('.report-section').forEach(s => s.classList.add('d-none'));
        document.getElementById(`section-${currentStep}`).classList.remove('d-none');

        document.querySelectorAll('.step-dot').forEach((dot, i) => {
            const stepNum = i + 1;
            dot.classList.toggle('active', stepNum === currentStep);
            dot.classList.toggle('done', stepNum < currentStep);
        });

        document.getElementById('btnPrev').classList.toggle('d-none', currentStep === 1);
        document.getElementById('btnNext').classList.toggle('d-none', currentStep === 3);
        document.getElementById('btnSubmit').classList.toggle('d-none', currentStep !== 3);

        window.scrollTo(0, 0);
    }

    // =============================================
    // SUBMIT
    // =============================================
    async function submitReport() {
        const btn = document.getElementById('btnSubmit');
        btn.disabled = true;
        btn.textContent = 'جارٍ الإرسال...';

        try {
            reportData.meta.submitted_at = new Date().toISOString();

            const res = await window.apiRequest('/api/dept/analysis/report/save', {
                method: 'POST',
                body: JSON.stringify(reportData)
            });

            if (res.success) {
                clearDraft();
                // حفظ علامة اكتمال الميزانية والتحديات للمخرج المدمج
                try { localStorage.setItem(`BUDGET_${deptCode.toUpperCase()}_completed`, '1'); } catch (e) { }
                showToast('✅ اكتمل المخرج المدمج! جاري الانتقال للوحة الإدارة', 'success');
                setTimeout(() => {
                    window.location.href = `/dept-dashboard.html?dept=${deptCode}`;
                }, 1200);
            } else {
                showToast('فشل الإرسال: ' + (res.message || 'خطأ غير معروف'), 'error');
                btn.disabled = false;
                btn.textContent = 'إرسال التقرير للمالك';
            }
        } catch (err) {
            console.error('[FastReport] Submit error:', err);
            showToast('حدث خطأ أثناء الإرسال، تحقق من الاتصال', 'error');
            btn.disabled = false;
            btn.textContent = 'إرسال التقرير للمالك';
        }
    }

    init();
})();
