/**
 * Startix — Dept Smart Engine
 * منطق التقييم والتقرير
 */
window.DeptSmartEngine = (function() {
    const { KPIS_CONFIG, FIXED_KPIS, DEPT_META, AXES_CONFIG, DEFAULT_AXES, PROBLEMS_CONFIG, RESOURCES_CONFIG } = window.DeptSmartConfig;

        // ── STATE ─────────────────────────────────────────────
        const _params = new URLSearchParams(location.search);
        let dept = _params.get('dept');
        if (!dept && window.StateManager) {
            dept = window.StateManager.get(window.StateManager.KEYS.DEPT);
        }
        if (!dept) {
            console.warn('No department specified, falling back to compliance');
            dept = 'compliance';
        }

        const meta = DEPT_META[dept] || DEPT_META.compliance;
        const axes = AXES_CONFIG[dept] || DEFAULT_AXES;
        const deptKpis = [...(KPIS_CONFIG[dept] || KPIS_CONFIG.compliance), ...FIXED_KPIS];

        if (window.StateManager) window.StateManager.set(window.StateManager.KEYS.DEPT, dept);

        const state = {
            kpis: {},
            axes: {},
            notes: {},
            problems: {},
            resources: {}
        };

        if (window.StateManager) {
            const cached = window.StateManager.get(`stratix_smart_${dept}`);
            if (cached) {
                Object.assign(state, cached);
            }
        }

        // Apply dept color
        document.documentElement.style.setProperty('--dept-color', meta.color);
        const deptNameEl = document.getElementById('deptName');
        if (deptNameEl) deptNameEl.textContent = meta.icon + ' ' + meta.name;

        // ── COMPLIANCE FINES — صدمة الواقع ────────────────────
        async function loadAndRenderFines() {
            if (dept !== 'compliance') return;

            // قراءة النشاط الفرعي من التشخيص
            let activity = '';
            try {
                const diag = JSON.parse(localStorage.getItem('stratix_diagnostic_payload') || '{}');
                activity = diag.activity || diag.answers?.activity || '';
            } catch(e) {}

            if (!activity) {
                // عرض رسالة بسيطة
                const container = document.getElementById('finesSection');
                if (container) container.innerHTML = `
                    <div style="text-align:center;padding:16px;color:#94a3b8;font-size:13px">
                        <i class="bi bi-info-circle" style="color:#667eea"></i>
                        أكمل التشخيص أولاً لعرض الغرامات الخاصة بنشاطك
                    </div>`;
                return;
            }

            try {
                const response = await fetch('/assets/data/compliance-fines.json');
                if (!response.ok) throw new Error('File not found');
                const data = await response.json();
                const fines = data.fines[activity];

                if (!fines || fines.length === 0) {
                    console.log('No fines for activity:', activity);
                    return;
                }

                const totalCost = fines.reduce((s, f) => s + (f.cost || 0), 0);
                const totalRisk = fines.reduce((s, f) => s + (f.risk || 0), 0);

                // حقن القسم أعلى العقبات
                const container = document.getElementById('finesSection');
                if (!container) return;

                container.innerHTML = `
                    <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
                        <div style="font-size:15px;font-weight:800;color:#ef4444;display:flex;align-items:center;gap:8px">
                            <i class="bi bi-exclamation-triangle-fill"></i>
                            تحذيرات قانونية — ${activity.replace(/_/g,' ').replace(/^(comm|serv|ind|const|mix|npo|gov)\s/,'')}
                        </div>
                        <div style="display:flex;gap:12px">
                            <span style="font-size:12px;padding:4px 12px;border-radius:8px;background:rgba(239,68,68,0.1);color:#ef4444;font-weight:700">
                                تكلفة الامتثال: ${totalCost.toLocaleString()} ريال
                            </span>
                            <span style="font-size:12px;padding:4px 12px;border-radius:8px;background:rgba(239,68,68,0.2);color:#fca5a5;font-weight:700">
                                مخاطر المخالفة: ${totalRisk.toLocaleString()} ريال
                            </span>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">
                        ${fines.map(f => `
                            <div style="padding:14px;background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.15);border-radius:12px;border-right:3px solid #ef4444">
                                <div style="font-size:13px;font-weight:800;color:#fca5a5;margin-bottom:4px">
                                    ⚠️ ${f.label}
                                </div>
                                <div style="font-size:12px;color:#94a3b8;margin-bottom:8px">${f.desc}</div>
                                <div style="display:flex;gap:16px;font-size:11px">
                                    <span style="color:#f59e0b">💰 تكلفة: ${(f.cost || 0).toLocaleString()} ريال</span>
                                    <span style="color:#ef4444">🔴 مخاطرة: ${(f.risk || 0).toLocaleString()} ريال</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } catch (error) {
                console.warn('Fines data unavailable:', error.message);
                // الصفحة تكمل بدون قسم الغرامات
            }
        }

        // ── RENDER KPIs ────────────────────────────────────────
        function renderKpis() {
            document.getElementById('kpiGrid').innerHTML = deptKpis.map(k => `
        <div class="kpi-card${k.isbudget ? ' budget' : ''}">
            <div class="kpi-label"><i class="bi ${k.icon}"></i> ${k.label}</div>
            <input class="kpi-input" type="number" id="${k.id}"
                placeholder="${k.placeholder}" min="0" ${k.max ? `max="${k.max}"` : ''}
                oninput="onKpiChange()">
            <div class="kpi-hint">${k.hint}</div>
        </div>`).join('');
        }

        // ── RENDER AXES ────────────────────────────────────────
        function renderAxes() {
            const grid = document.getElementById('axesGrid');
            grid.innerHTML = axes.map(ax => `
        <div class="axis-card" id="axcard_${ax.id}">
            <div class="axis-title">
                <i class="bi ${ax.icon}"></i>
                ${ax.title}
            </div>
            <div class="axis-opts">
                ${ax.opts.map((opt, i) => `
                    <div class="axis-opt" data-score="${3 - i}" data-axis="${ax.id}" onclick="selectAxis('${ax.id}', ${3 - i}, this)">
                        <div class="opt-dot"></div>
                        <span>${opt}</span>
                    </div>
                `).join('')}
            </div>
            <div class="axis-footer">
                <textarea class="axis-note" rows="1" placeholder="ملاحظة اختيارية..."
                    oninput="state.notes['${ax.id}']=this.value; autoResize(this)"></textarea>
            </div>
        </div>
    `).join('');
        }

        function selectAxis(axId, score, el) {
            const card = document.getElementById('axcard_' + axId);
            card.querySelectorAll('.axis-opt').forEach(o => o.classList.remove('selected'));
            el.classList.add('selected');
            state.axes[axId] = score;
            card.classList.add('answered');
            card.classList.remove('unanswered');
            updateReport();
            updateProgress();
        }

        function autoResize(el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }

        // ── RENDER PROBLEMS + RESOURCES ───────────────────────
        function renderOptionField(item, stateKey) {
            const opts = item.options || [];
            const hasCustom = item.allowCustom !== false;
            return `
        <div class="field-card">
            <div class="field-label"><i class="bi ${item.icon}" style="color:${stateKey === 'problems' ? 'var(--danger)' : 'var(--success)'}"></i> ${item.label}</div>
            <div class="field-question">${item.question}</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0" id="opts_${item.id}">
                ${opts.map((opt, i) => `
                    <button type="button" class="opt-chip" data-field="${item.id}" data-value="${opt}"
                        onclick="selectOption('${item.id}','${stateKey}',this,'${opt.replace(/'/g, "\\'")}')"
                        style="padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:var(--card);color:var(--text);font-size:12px;font-family:Tajawal;cursor:pointer;transition:all 0.2s">${opt}</button>
                `).join('')}
            </div>
            ${hasCustom ? `<input type="text" class="field-input" id="custom_${item.id}" placeholder="${item.customPlaceholder || 'أو اكتب إجابتك...'}"
                style="width:100%;padding:10px 14px;background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:Tajawal;margin-top:4px"
                oninput="state.${stateKey}['${item.id}']=this.value; clearChips('${item.id}'); updateProgress()">` : ''}
            <div class="field-tip"><i class="bi bi-lightbulb-fill" style="color:var(--warn)"></i> ${item.tip}</div>
        </div>`;
        }

        function renderProblems() {
            document.getElementById('problemsGrid').innerHTML = PROBLEMS_CONFIG.map(p => renderOptionField(p, 'problems')).join('');
            document.getElementById('resourcesGrid').innerHTML = RESOURCES_CONFIG.map(r => renderOptionField(r, 'resources')).join('');
        }

        // ── KPI CHANGE ─────────────────────────────────────────
        function onKpiChange() {
            deptKpis.forEach(k => {
                const el = document.getElementById(k.id);
                if (el) state.kpis[k.id] = el.value !== '' ? +el.value : null;
            });
            updateReport();
            updateProgress();
        }

        // ── UPDATE PROGRESS ────────────────────────────────────
        function updateProgress() {
            // Auto-save to localStorage on every change
            try {
                const autoSave = {
                    dept, kpis: state.kpis, axes: state.axes,
                    notes: state.notes, problems: state.problems,
                    resources: state.resources, savedAt: new Date().toISOString()
                };
                localStorage.setItem(`stratix_smart_${dept}`, JSON.stringify(autoSave));
            } catch(e) {}

            const totalItems = deptKpis.length + axes.length + PROBLEMS_CONFIG.length + RESOURCES_CONFIG.length;
            const kpiDone = Object.values(state.kpis).filter(v => v !== null && v !== undefined && v !== '').length;
            const axesDone = Object.keys(state.axes).length;
            const probDone = Object.values(state.problems).filter(v => v && v.trim()).length;
            const resDone = Object.values(state.resources).filter(v => v !== null && v !== undefined && v !== '').length;
            const done = kpiDone + axesDone + probDone + resDone;
            const pct = Math.round((done / totalItems) * 100);

            // Side progress
            document.getElementById('sideProgress').textContent = toArabicNum(pct) + '٪';

            // Top ring
            const circ = 100.5;
            const offset = circ - (pct / 100) * circ;
            document.getElementById('topRingFg').style.strokeDashoffset = offset;
            document.getElementById('topScoreNum').textContent = toArabicNum(pct);

            // Step highlights
            const steps = ['ps1', 'ps2', 'ps3', 'ps4'];
            const navs = ['nav1', 'nav2', 'nav3', 'nav4'];
            const sec = getActiveSection();
            steps.forEach((id, i) => {
                const el = document.getElementById(id);
                el.classList.remove('active', 'done');
                if (i < sec - 1) el.classList.add('done');
                else if (i === sec - 1) el.classList.add('active');
            });
            navs.forEach((id, i) => {
                const el = document.getElementById(id);
                el.classList.remove('active', 'done');
                if (i < sec - 1) el.classList.add('done');
                else if (i === sec - 1) el.classList.add('active');
            });

            // Maturity pct
            if (axesDone > 0) {
                const axScoreSum = Object.values(state.axes).reduce((a, b) => a + b, 0);
                const axMax = axesDone * 3;
                const maturity = Math.round((axScoreSum / axMax) * 100);
                document.getElementById('maturityPct').textContent = toArabicNum(maturity) + '٪';
                const el = document.getElementById('maturityPct');
                el.style.color = maturity >= 70 ? 'var(--success)' : maturity >= 40 ? 'var(--warn)' : 'var(--danger)';
            }
        }

        function getActiveSection() {
            const sections = ['s1', 's2', 's3', 's4'];
            for (let i = sections.length - 1; i >= 0; i--) {
                const el = document.getElementById(sections[i]);
                const rect = el.getBoundingClientRect();
                if (rect.top <= 120) return i + 1;
            }
            return 1;
        }

        // ── UPDATE REPORT ──────────────────────────────────────
        function updateReport() {
            const answeredAxes = Object.keys(state.axes);
            if (answeredAxes.length === 0) return;

            // Calculate health score
            const kpiScore = calcKpiScore();
            const axeScore = calcAxesScore();
            const health = Math.round(kpiScore * 0.3 + axeScore * 0.7);

            // Update ring
            const circ = 238.76;
            const offset = circ - (health / 100) * circ;
            const ringColor = health >= 70 ? '#10b981' : health >= 40 ? '#f59e0b' : '#ef4444';
            const fgEl = document.getElementById('healthRingFg');
            fgEl.style.strokeDashoffset = offset;
            fgEl.setAttribute('stroke', ringColor);

            document.getElementById('healthNumBig').textContent = toArabicNum(health);
            document.getElementById('healthNumBig').style.color = ringColor;

            // Health label
            const { desc, tag, tagColor } = getHealthLabel(health);
            document.getElementById('healthDesc').textContent = desc;
            const tagEl = document.getElementById('healthTag');
            tagEl.textContent = tag;
            tagEl.style.background = tagColor + '22';
            tagEl.style.color = tagColor;

            // Strengths + Gaps
            renderStrengthsGaps();

            // Priorities
            renderPriorities();

            // Budget
            renderBudget(health);

            // Owner message
            renderOwnerMsg(health);
        }

        function calcKpiScore() {
            // kpi2 is always the main rate metric (0-100); kpi3 is usually "lower is better"
            const kpi2 = state.kpis['k_kpi2'];  // primary rate metric
            const kpi3 = state.kpis['k_kpi3'];  // secondary count/rate (context-dependent)
            const kpi4 = state.kpis['k_kpi4'];  // time/speed metric (lower = better for most)
            let score = 50; // baseline
            if (kpi2 !== null && kpi2 !== undefined) score = Math.min(100, kpi2);
            // kpi3: for most depts this is a "problems/defects/turnover" metric — lower is better
            if (kpi3 !== null && kpi3 !== undefined) {
                // sales: lead conversion (higher=better), marketing: leads count (higher=better)
                const higherBetter = ['sales', 'marketing', 'cs'].includes(dept);
                if (higherBetter) {
                    if (kpi3 > 50) score = Math.min(100, score + 5);
                } else {
                    if (kpi3 === 0) score = Math.min(100, score + 10);
                    else if (kpi3 > 5) score = Math.max(0, score - 15);
                    else score = Math.max(0, score - kpi3 * 2);
                }
            }
            if (kpi4 !== null && kpi4 !== undefined) {
                if (kpi4 <= 7) score = Math.min(100, score + 5);
                else if (kpi4 > 60) score = Math.max(0, score - 10);
            }
            return Math.max(0, Math.min(100, score));
        }

        function calcAxesScore() {
            const vals = Object.values(state.axes);
            if (!vals.length) return 50;
            return Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * 3)) * 100);
        }

        function getHealthLabel(health) {
            if (health >= 80) return { desc: 'الإدارة في وضع ممتاز — استمر في التطوير', tag: 'ممتاز', tagColor: '#10b981' };
            if (health >= 65) return { desc: 'أداء جيد مع فرص تحسين واضحة', tag: 'جيد', tagColor: '#3b82f6' };
            if (health >= 45) return { desc: 'مستوى مقبول لكن يحتاج تدخل في نقاط محددة', tag: 'يحتاج تحسين', tagColor: '#f59e0b' };
            if (health >= 25) return { desc: 'ضعف ملحوظ — مخاطر تشغيلية قائمة', tag: 'ضعيف', tagColor: '#f97316' };
            return { desc: 'وضع حرج — يستلزم تدخلاً فورياً من المالك', tag: 'حرج', tagColor: '#ef4444' };
        }

        function renderStrengthsGaps() {
            const strengths = [], gaps = [];
            axes.forEach(ax => {
                const score = state.axes[ax.id];
                if (score === undefined) return;
                if (score >= 2) strengths.push(ax.title);
                else if (score <= 1) gaps.push({ title: ax.title, score });
            });

            const sl = document.getElementById('strengthsList');
            sl.innerHTML = strengths.length
                ? strengths.map(t => `<div class="sg-item strength"><i class="bi bi-check-lg"></i>${t}</div>`).join('')
                : '<div class="sg-empty">لا توجد نقاط قوة محددة بعد</div>';

            const gl = document.getElementById('gapsList');
            gl.innerHTML = gaps.length
                ? gaps.map(g => `<div class="sg-item gap"><i class="bi bi-exclamation-lg"></i>${g.title}</div>`).join('')
                : '<div class="sg-empty" style="color:var(--success)">لا توجد فجوات — ممتاز!</div>';
        }

        function renderPriorities() {
            const sorted = Object.entries(state.axes)
                .sort((a, b) => a[1] - b[1])
                .slice(0, 3);
            if (!sorted.length) return;

            const PRIORITY_ACTIONS = {
                // Compliance
                ax_system: { action: 'بناء نظام رقابة داخلية رسمي', timeline: '٣٠ يوماً', cost: '١٥-٤٠ ألف' },
                ax_docs: { action: 'توثيق وتحديث السياسات والإجراءات', timeline: '٤٥ يوماً', cost: '٥-١٥ ألف' },
                ax_aware: { action: 'برنامج تدريبي للتوعية التنظيمية', timeline: '٦٠ يوماً', cost: '١٠-٢٥ ألف' },
                ax_risk: { action: 'إنشاء سجل مخاطر (Risk Register)', timeline: '٣٠ يوماً', cost: '٨-٢٠ ألف' },
                ax_report: { action: 'نظام تقارير رقابية منتظمة', timeline: '٤٥ يوماً', cost: '١٢-٣٠ ألف' },
                ax_viol: { action: 'نظام معالجة مخالفات منهجي', timeline: '٢١ يوماً', cost: '٥-١٥ ألف' },
                ax_tech: { action: 'أتمتة عمليات الامتثال', timeline: '٩٠ يوماً', cost: '٣٠-٨٠ ألف' },
                ax_culture: { action: 'برنامج بناء ثقافة النزاهة والمساءلة', timeline: '٦ أشهر', cost: '٢٠-٥٠ ألف' },
                // HR
                ax_recruit: { action: 'تطوير آلية الاستقطاب والتوظيف', timeline: '٤٥ يوماً', cost: '١٥-٣٠ ألف' },
                ax_perf: { action: 'تطبيق نظام تقييم أداء منهجي', timeline: '٦٠ يوماً', cost: '١٠-٢٥ ألف' },
                ax_train: { action: 'بناء خطة تدريبية سنوية شاملة', timeline: '٣٠ يوماً', cost: '٢٠-٦٠ ألف' },
                ax_retain: { action: 'برنامج الاحتفاظ بالمواهب وتحسين رضا الموظفين', timeline: '٩٠ يوماً', cost: '٣٠-٨٠ ألف' },
                ax_comp: { action: 'مراجعة هيكل التعويضات والمزايا', timeline: '٦٠ يوماً', cost: '١٥-٤٠ ألف' },
                ax_legal: { action: 'تصحيح وضع نطاقات والامتثال العمالي', timeline: '٣٠ يوماً', cost: '٢٠-٥٠ ألف' },
                ax_hris: { action: 'تطبيق نظام HRIS متكامل', timeline: '٣-٦ أشهر', cost: '٤٠-١٢٠ ألف' },
                // Finance
                ax_reports: { action: 'تطوير نظام التقارير المالية الآنية', timeline: '٤٥ يوماً', cost: '١٥-٤٠ ألف' },
                ax_cashflow: { action: 'بناء نموذج توقعات التدفق النقدي', timeline: '٣٠ يوماً', cost: '١٠-٢٥ ألف' },
                ax_budget: { action: 'تطبيق نظام رقابة ميزانية شهرية', timeline: '٣٠ يوماً', cost: '٨-٢٠ ألف' },
                ax_tax: { action: 'تصحيح الوضع الضريبي والزكوي', timeline: '٢١ يوماً', cost: '١٥-٤٠ ألف' },
                ax_costs: { action: 'مراجعة هيكل التكاليف وفرص التوفير', timeline: '٦٠ يوماً', cost: '١٠-٢٠ ألف' },
                ax_audit: { action: 'تطبيق نظام رقابة داخلية مالية', timeline: '٤٥ يوماً', cost: '٢٠-٥٠ ألف' },
                ax_forecast: { action: 'بناء نموذج التخطيط المالي والتوقعات', timeline: '٤٥ يوماً', cost: '١٢-٣٠ ألف' },
                // Sales
                ax_process: { action: 'توثيق وتطوير عملية المبيعات', timeline: '٣٠ يوماً', cost: '١٠-٢٥ ألف' },
                ax_crm: { action: 'تطبيق نظام CRM وتدريب الفريق', timeline: '٤٥ يوماً', cost: '٢٠-٦٠ ألف' },
                ax_pipeline: { action: 'بناء نظام متابعة pipeline وتوقعات المبيعات', timeline: '٣٠ يوماً', cost: '٨-٢٠ ألف' },
                ax_team: { action: 'برنامج تطوير الفريق البيعي وهيكل الحوافز', timeline: '٦٠ يوماً', cost: '٢٠-٥٠ ألف' },
                ax_pricing: { action: 'مراجعة استراتيجية التسعير', timeline: '٤٥ يوماً', cost: '١٥-٣٠ ألف' },
                ax_market: { action: 'تحليل تنافسي شامل وخريطة السوق', timeline: '٤٥ يوماً', cost: '١٠-٢٥ ألف' },
                ax_data: { action: 'بناء لوحة أداء المبيعات وتحليل البيانات', timeline: '٣٠ يوماً', cost: '١٢-٣٠ ألف' },
                // Marketing
                ax_brand: { action: 'تطوير هوية العلامة التجارية وإرشاداتها', timeline: '٦٠ يوماً', cost: '٢٠-٦٠ ألف' },
                ax_content: { action: 'بناء استراتيجية محتوى رقمي شهرية', timeline: '٣٠ يوماً', cost: '١٠-٢٥ ألف' },
                ax_social: { action: 'تطوير حضور وإدارة منصات التواصل الاجتماعي', timeline: '٤٥ يوماً', cost: '١٥-٤٠ ألف' },
                ax_leads: { action: 'بناء منظومة توليد العملاء المحتملين', timeline: '٦٠ يوماً', cost: '٢٥-٧٠ ألف' },
                ax_roi: { action: 'نظام قياس عائد الاستثمار التسويقي', timeline: '٣٠ يوماً', cost: '١٠-٢٠ ألف' },
                ax_web: { action: 'تطوير الموقع الإلكتروني وتحسين محركات البحث', timeline: '٩٠ يوماً', cost: '٣٠-١٠٠ ألف' },
                ax_collab: { action: 'تطوير آلية التنسيق بين التسويق والمبيعات', timeline: '٣٠ يوماً', cost: '٥-١٥ ألف' },
                // Operations
                ax_supply: { action: 'تطوير إدارة سلسلة الإمداد والموردين', timeline: '٦٠ يوماً', cost: '٢٠-٦٠ ألف' },
                ax_capacity: { action: 'تخطيط الطاقة الإنتاجية وتحسين الاستغلال', timeline: '٤٥ يوماً', cost: '١٥-٤٠ ألف' },
                ax_maintain: { action: 'برنامج الصيانة الوقائية للمعدات والأصول', timeline: '٤٥ يوماً', cost: '٢٠-٦٠ ألف' },
                ax_safety: { action: 'تطوير نظام السلامة المهنية', timeline: '٣٠ يوماً', cost: '١٥-٤٠ ألف' },
                ax_auto: { action: 'تطبيق حلول الأتمتة التشغيلية', timeline: '٩٠ يوماً', cost: '٤٠-١٢٠ ألف' },
                ax_kpi: { action: 'بناء لوحة مؤشرات الأداء التشغيلي', timeline: '٣٠ يوماً', cost: '١٢-٣٠ ألف' },
                // IT
                ax_security: { action: 'رفع مستوى الأمن السيبراني والحماية', timeline: '٦٠ يوماً', cost: '٤٠-١٢٠ ألف' },
                ax_infra: { action: 'تحسين موثوقية البنية التحتية', timeline: '٩٠ يوماً', cost: '٥٠-١٥٠ ألف' },
                ax_support: { action: 'تطوير خدمة دعم المستخدمين والـ Helpdesk', timeline: '٤٥ يوماً', cost: '٢٠-٥٠ ألف' },
                ax_backup: { action: 'تطبيق خطة استمرارية الأعمال والنسخ الاحتياطي', timeline: '٣٠ يوماً', cost: '٢٥-٧٠ ألف' },
                ax_cloud: { action: 'رسم خارطة طريق التحول السحابي', timeline: '٩٠ يوماً', cost: '٣٠-١٠٠ ألف' },
                ax_pm: { action: 'تطبيق منهجية Agile لإدارة المشاريع التقنية', timeline: '٦٠ يوماً', cost: '١٥-٤٠ ألف' },
                ax_integ: { action: 'مشروع تكامل الأنظمة والبيانات', timeline: '٣-٦ أشهر', cost: '٥٠-١٥٠ ألف' },
                // Quality
                ax_control: { action: 'تطوير إجراءات الرقابة على الجودة', timeline: '٤٥ يوماً', cost: '١٥-٤٠ ألف' },
                ax_complaints: { action: 'نظام إدارة شكاوى العملاء', timeline: '٣٠ يوماً', cost: '١٠-٢٥ ألف' },
                ax_improve: { action: 'برنامج التحسين المستمر Kaizen', timeline: '٦ أشهر', cost: '٢٠-٦٠ ألف' },
                ax_supplier: { action: 'نظام تقييم ورقابة جودة الموردين', timeline: '٤٥ يوماً', cost: '١٥-٤٠ ألف' },
                // CS
                ax_response: { action: 'تطوير SLA وسرعة الاستجابة', timeline: '٢١ يوماً', cost: '١٠-٢٥ ألف' },
                ax_csat: { action: 'برنامج تحسين رضا العملاء CSAT/NPS', timeline: '٦٠ يوماً', cost: '٢٠-٥٠ ألف' },
                ax_channels: { action: 'توسيع وتكامل قنوات الدعم', timeline: '٤٥ يوماً', cost: '٢٠-٦٠ ألف' },
                ax_ticketing: { action: 'تطبيق نظام CRM/Helpdesk', timeline: '٤٥ يوماً', cost: '٢٠-٦٠ ألف' },
                ax_knowledge: { action: 'بناء قاعدة المعرفة الداعمة', timeline: '٦٠ يوماً', cost: '١٠-٣٠ ألف' },
                ax_recovery: { action: 'بروتوكول التعافي من الأخطاء', timeline: '٣٠ يوماً', cost: '٥-١٥ ألف' },
                ax_metrics: { action: 'لوحة مؤشرات خدمة العملاء', timeline: '٣٠ يوماً', cost: '١٢-٣٠ ألف' },
                // Projects
                ax_method: { action: 'تأسيس PMO وتطبيق منهجية إدارة المشاريع', timeline: '٩٠ يوماً', cost: '٣٠-٨٠ ألف' },
                ax_planning: { action: 'تحسين دقة التخطيط وتقدير الجداول الزمنية', timeline: '٤٥ يوماً', cost: '١٥-٣٥ ألف' },
                ax_scope: { action: 'تطبيق نظام change control', timeline: '٣٠ يوماً', cost: '١٠-٢٥ ألف' },
                ax_comm: { action: 'تطوير خطة التواصل مع أصحاب المصلحة', timeline: '٣٠ يوماً', cost: '٨-٢٠ ألف' },
                ax_tools: { action: 'تطبيق أداة إدارة المشاريع وتدريب الفريق', timeline: '٤٥ يوماً', cost: '١٥-٤٠ ألف' },
                // Governance
                ax_structure: { action: 'مراجعة وتطوير هيكل الحوكمة', timeline: '٩٠ يوماً', cost: '٤٠-١٠٠ ألف' },
                ax_policies: { action: 'تحديث وتطبيق سياسات الحوكمة', timeline: '٦٠ يوماً', cost: '٢٠-٥٠ ألف' },
                ax_disclosure: { action: 'تطوير نظام الإفصاح والشفافية', timeline: '٤٥ يوماً', cost: '١٥-٣٥ ألف' },
                ax_coi: { action: 'تطبيق سياسة تضارب المصالح', timeline: '٣٠ يوماً', cost: '١٠-٢٥ ألف' },
                ax_compliance: { action: 'برنامج الامتثال التنظيمي', timeline: '٤٥ يوماً', cost: '٢٠-٥٠ ألف' },
                // Support
                ax_procure: { action: 'تطوير سياسة وإجراءات المشتريات', timeline: '٤٥ يوماً', cost: '١٠-٢٥ ألف' },
                ax_contracts: { action: 'نظام إدارة العقود الرقمي', timeline: '٦٠ يوماً', cost: '٢٠-٦٠ ألف' },
                ax_vendor: { action: 'نظام تقييم الموردين وقائمة الموردين المعتمدين', timeline: '٤٥ يوماً', cost: '١٢-٣٠ ألف' },
                ax_assets: { action: 'تطبيق نظام إدارة الأصول والمخزون', timeline: '٤٥ يوماً', cost: '٢٠-٦٠ ألف' },
                ax_facilities: { action: 'برنامج صيانة وقائية للمرافق', timeline: '٦٠ يوماً', cost: '٢٠-٥٠ ألف' },
                ax_coord: { action: 'تطوير آليات التنسيق بين الإدارات', timeline: '٣٠ يوماً', cost: '٨-٢٠ ألف' },
                ax_docs: { action: 'تطبيق نظام إدارة الوثائق والأرشفة', timeline: '٤٥ يوماً', cost: '١٥-٤٠ ألف' },
                ax_sustain: { action: 'بناء سياسة الاستدامة المؤسسية', timeline: '٩٠ يوماً', cost: '٢٠-٦٠ ألف' },
            };
            const classes = ['p1', 'p2', 'p3'];
            const container = document.getElementById('prioritiesList');
            container.innerHTML = sorted.map(([axId, score], i) => {
                const ax = axes.find(a => a.id === axId);
                const act = PRIORITY_ACTIONS[axId] || { action: 'مراجعة وتحسين المحور', timeline: '٦٠ يوماً', cost: 'يُحدد حسب الوضع' };
                return `
            <div class="priority-item">
                <div class="priority-num ${classes[i]}">${i + 1}</div>
                <div class="priority-body">
                    <div class="priority-title">${ax ? ax.title : axId}</div>
                    <div class="priority-desc">${act.action}</div>
                    <div class="priority-meta">
                        <span class="priority-tag"><i class="bi bi-clock"></i> ${act.timeline}</span>
                        <span class="priority-tag"><i class="bi bi-cash"></i> ${act.cost} ريال</span>
                        <span class="priority-tag" style="color:${score === 0 ? '#ef4444' : score === 1 ? '#f59e0b' : '#3b82f6'}">${score === 0 ? '🔴 عاجل جداً' : score === 1 ? '🟠 مهم' : '🔵 تحسين'}</span>
                    </div>
                </div>
            </div>`;
            }).join('');
        }

        function renderBudget(health) {
            const current = state.kpis['k_budget'];
            document.getElementById('budgetCurrent').textContent = current ? formatNum(current) : '—';
            const gaps = Object.values(state.axes).filter(s => s <= 1).length;
            let multiplier = 1;
            let priority = '—';
            if (health < 40) { multiplier = 1.7; priority = '🔴 عاجلة'; }
            else if (health < 60) { multiplier = 1.35; priority = '🟠 مرتفعة'; }
            else if (health < 75) { multiplier = 1.15; priority = '🟡 متوسطة'; }
            else { multiplier = 1.0; priority = '🟢 صيانة'; }

            if (current !== null && current !== undefined) {
                const needed = Math.round(current * multiplier);
                const gap = needed - current;
                document.getElementById('budgetNeeded').textContent = formatNum(needed);
                document.getElementById('budgetGap').textContent = gap > 0 ? '+' + formatNum(gap) : '✓ كافية';
                document.getElementById('budgetGap').style.color = gap > 0 ? 'var(--warn)' : 'var(--success)';
            } else {
                // Estimate based on team size + gaps
                const teamSize = state.kpis['k_team_size'] || 3;
                const base = teamSize * 15000;
                const estimate = Math.round(base * multiplier);
                document.getElementById('budgetNeeded').textContent = '~' + formatNum(estimate);
                document.getElementById('budgetGap').textContent = 'تقدير';
            }
            document.getElementById('budgetPriority').textContent = priority;
        }

        function renderOwnerMsg(health) {
            const dept_name = meta.name;
            const gaps = axes.filter(ax => state.axes[ax.id] !== undefined && state.axes[ax.id] <= 1);
            const top3 = gaps.slice(0, 3).map(ax => ax.title).join('، ');
            const recurringPain = state.problems.recurring_pain || '';
            const ownerDecision = state.problems.owner_decision || '';

            let msg = '';
            if (health >= 75) {
                msg = `إدارة ${dept_name} في وضع صحي بشكل عام (${health}/١٠٠). الفريق يعمل بكفاءة وأداؤه يتجاوز المتوسط. `;
                msg += gaps.length ? `نوصي بالتركيز على تطوير: ${top3} للوصول للمستوى المثالي.` : 'استمر في التطوير للحفاظ على هذا المستوى.';
            } else if (health >= 50) {
                msg = `إدارة ${dept_name} تحتاج تحسيناً منهجياً في ${gaps.length} محور${gaps.length > 1 ? 'ات' : ''}. `;
                if (top3) msg += `أهم المحاور المطلوب معالجتها: ${top3}. `;
                if (recurringPain) msg += `المشكلة الأكثر تكراراً: "${recurringPain}". `;
                if (ownerDecision) msg += `القرار المطلوب منك: ${ownerDecision}.`;
            } else {
                msg = `⚠️ إدارة ${dept_name} في وضع يستلزم تدخلاً فورياً من المالك (${health}/١٠٠). `;
                if (top3) msg += `أبرز الفجوات الحرجة: ${top3}. `;
                if (ownerDecision) msg += `القرار العاجل المطلوب: ${ownerDecision}. `;
                msg += `التأخر في المعالجة يرفع تكلفة الإصلاح بنسبة 30-50٪ كل شهر.`;
            }
            document.getElementById('ownerMsg').textContent = msg;
        }

        // ── SAVE ──────────────────────────────────────────────
        async function saveReport() {
            // Validate: all axes answered
            const unanswered = axes.filter(ax => state.axes[ax.id] === undefined);
            if (unanswered.length) {
                unanswered.forEach(ax => {
                    const card = document.getElementById('axcard_' + ax.id);
                    if (card) { card.classList.add('unanswered'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                });
                showToast('⚠️ أكمل تقييم جميع المحاور أولاً', 'warn');
                return;
            }

            const payload = {
                dept, meta,
                kpis: state.kpis,
                axes: state.axes,
                notes: state.notes,
                problems: state.problems,
                resources: state.resources,
                health: Math.round(calcKpiScore() * 0.3 + calcAxesScore() * 0.7),
                savedAt: new Date().toISOString()
            };

            // 1. Save to StateManager (localStorage)
            if (window.StateManager) {
                window.StateManager.set(`stratix_smart_${dept}`, payload);
                window.StateManager.markStepDone(`smart_dept_${dept}`);
            } else {
                localStorage.setItem(`stratix_smart_${dept}`, JSON.stringify(payload));
            }

            // 1b. ربط مع صحة الشركة (company-health)
            try {
                const healthRaw = localStorage.getItem('stratix_company_health');
                let health = healthRaw ? JSON.parse(healthRaw) : {
                    sizeCategory: 'medium', overallScore: null, completedTabs: [],
                    departments: {}, valueChain: { completed: false }, deepAnalysis: {}
                };

                if (!health.departments) health.departments = {};
                if (!health.departments[dept]) health.departments[dept] = {};

                health.departments[dept].smartScore = payload.health;
                health.departments[dept].smartCompleted = true;
                health.departments[dept].smartDate = payload.savedAt;
                health.departments[dept].completed = true;
                health.departments[dept].score = health.departments[dept].score || payload.health;

                // تحديث النقاط الشاملة
                const deptScores = Object.values(health.departments).filter(d => d.smartScore > 0).map(d => d.smartScore);
                if (deptScores.length > 0) {
                    health.overallScore = Math.round(deptScores.reduce((a, b) => a + b, 0) / deptScores.length);
                }

                localStorage.setItem('stratix_company_health', JSON.stringify(health));

                // ربط مع dept_deep_payload أيضاً
                const deepRaw = localStorage.getItem('stratix_dept_deep_payload');
                let deep = deepRaw ? JSON.parse(deepRaw) : {};
                if (!deep[dept]) deep[dept] = {};
                deep[dept].completed = true;
                deep[dept].smartScore = payload.health;
                deep[dept].smartDate = payload.savedAt;
                localStorage.setItem('stratix_dept_deep_payload', JSON.stringify(deep));
            } catch (e) {
                console.warn('Health sync error:', e);
            }

            // 2. Try saving via DeptPage API (existing route)
            let apiSaved = false;
            try {
                if (window.DeptPage) {
                    await DeptPage.init(dept);
                    apiSaved = await DeptPage.saveToAPI('SMART_' + dept.toUpperCase(), payload);
                } else if (window.api?.post) {
                    await window.api.post('/api/dept/analysis', { dept, type: 'SMART', data: JSON.stringify(payload) });
                    apiSaved = true;
                }
            } catch (e) {
                console.warn('API sync failed, saved locally:', e);
            }

            showToast(apiSaved ? '✅ تم الحفظ بنجاح' : '✅ تم الحفظ محلياً', 'success');
        }

        // ── HELPERS ────────────────────────────────────────────
        function scrollToSection(id) {
            document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(updateProgress, 400);
        }

        function showToast(msg, type = 'success') {
            const t = document.getElementById('toast');
            const icon = document.getElementById('toastIcon');
            document.getElementById('toastMsg').textContent = msg;
            icon.className = type === 'warn' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-check-circle-fill';
            icon.style.color = type === 'warn' ? 'var(--warn)' : 'var(--success)';
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 3000);
        }

        function toArabicNum(n) {
            return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
        }

        function formatNum(n) {
            return Number(n).toLocaleString('ar-SA');
        }

        // ── SCROLL SPY ────────────────────────────────────────
        window.addEventListener('scroll', () => requestAnimationFrame(updateProgress), { passive: true });

        // ── RESTORE SAVED DATA ────────────────────────────────
        function restoreState() {
            const saved = localStorage.getItem(`stratix_smart_${dept}`);
            if (!saved) return;
            try {
                const d = JSON.parse(saved);
                // Restore KPIs
                Object.entries(d.kpis || {}).forEach(([k, v]) => {
                    const el = document.getElementById(k);
                    if (el && v !== null) { el.value = v; state.kpis[k] = v; }
                });
                // Restore axes
                Object.entries(d.axes || {}).forEach(([axId, score]) => {
                    state.axes[axId] = score;
                    const opts = document.querySelectorAll(`[data-axis="${axId}"]`);
                    opts.forEach(o => {
                        if (+o.dataset.score === score) o.classList.add('selected');
                    });
                    const card = document.getElementById('axcard_' + axId);
                    if (card) card.classList.add('answered');
                });
                // Restore notes
                Object.entries(d.notes || {}).forEach(([axId, note]) => {
                    state.notes[axId] = note;
                    const card = document.getElementById('axcard_' + axId);
                    if (card) { const ta = card.querySelector('.axis-note'); if (ta) ta.value = note; }
                });
                // Restore problems (chips + custom text)
                Object.entries(d.problems || {}).forEach(([pid, val]) => {
                    state.problems[pid] = val;
                    if (!val) return;
                    const selectedValues = String(val).split(' | ');
                    // Re-select matching chips
                    const chips = document.querySelectorAll(`[data-field="${pid}"]`);
                    chips.forEach(c => {
                        if (selectedValues.includes(c.dataset.value)) {
                            c.style.background = 'rgba(102,126,234,0.2)';
                            c.style.borderColor = '#667eea';
                            c.style.color = '#a5b4fc';
                            c.dataset.selected = 'true';
                        }
                    });
                    // Check for custom text (values not in any chip)
                    const chipValues = Array.from(chips).map(c => c.dataset.value);
                    const customVals = selectedValues.filter(v => !chipValues.includes(v));
                    if (customVals.length > 0) {
                        const customInput = document.getElementById('custom_' + pid);
                        if (customInput) customInput.value = customVals.join(', ');
                    }
                });
                // Restore resources (same format)
                Object.entries(d.resources || {}).forEach(([rid, val]) => {
                    state.resources[rid] = val;
                    if (!val) return;
                    const selectedValues = String(val).split(' | ');
                    const chips = document.querySelectorAll(`[data-field="${rid}"]`);
                    chips.forEach(c => {
                        if (selectedValues.includes(c.dataset.value)) {
                            c.style.background = 'rgba(102,126,234,0.2)';
                            c.style.borderColor = '#667eea';
                            c.style.color = '#a5b4fc';
                            c.dataset.selected = 'true';
                        }
                    });
                    const chipValues = Array.from(chips).map(c => c.dataset.value);
                    const customVals = selectedValues.filter(v => !chipValues.includes(v));
                    if (customVals.length > 0) {
                        const customInput = document.getElementById('custom_' + rid);
                        if (customInput) customInput.value = customVals.join(', ');
                    }
                });
                updateReport();
                updateProgress();
            } catch (e) { }
        }

        // ── INIT ──────────────────────────────────────────────
        document.addEventListener('DOMContentLoaded', () => {
            renderKpis();
            renderAxes();
            renderProblems();
            restoreState();
            updateProgress();
        });

    // ── Option chips select/clear ──
    function selectOption(fieldId, stateKey, el, value) {
        // Multi-select: toggle this chip
        const isSelected = el.dataset.selected === 'true';

        if (isSelected) {
            // Deselect
            el.style.background = 'var(--card)';
            el.style.borderColor = 'var(--border)';
            el.style.color = 'var(--text)';
            el.dataset.selected = 'false';
        } else {
            // Select
            el.style.background = 'rgba(102,126,234,0.2)';
            el.style.borderColor = '#667eea';
            el.style.color = '#a5b4fc';
            el.dataset.selected = 'true';
        }

        // Collect all selected values for this field
        const chips = document.querySelectorAll(`[data-field="${fieldId}"]`);
        const selected = [];
        chips.forEach(c => {
            if (c.dataset.selected === 'true') selected.push(c.dataset.value);
        });

        // Add custom text if exists
        const custom = document.getElementById('custom_' + fieldId);
        if (custom && custom.value.trim()) {
            selected.push(custom.value.trim());
        }

        // Save as array or joined string
        state[stateKey][fieldId] = selected.length > 0 ? selected.join(' | ') : '';
        updateProgress();
    }

    function clearChips(fieldId) {
        // Don't clear chips when typing custom — allow both
    }

    // Export functions called from HTML onclick/oninput
    window.selectAxis = selectAxis;
    window.selectOption = selectOption;
    window.clearChips = clearChips;
    window.onKpiChange = onKpiChange;
    window.scrollToSection = scrollToSection;
    window.showToast = showToast;
    window.saveReport = saveReport;
    window.autoResize = autoResize;
    window.saveAll = typeof saveAll !== 'undefined' ? saveAll : saveReport;

    return { renderKpis, renderAxes, renderProblems, restoreState, updateProgress, updateReport, loadAndRenderFines };
})();
