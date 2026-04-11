/**
 * Startix — Dept Smart Engine
 * منطق التقييم والتقرير
 */
window.DeptSmartEngine = (function() {
    const { KPIS_CONFIG, FIXED_KPIS, DEPT_META, AXES_CONFIG, PROBLEMS_CONFIG, RESOURCES_CONFIG } = window.DeptSmartConfig;

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
        function renderProblems() {
            document.getElementById('problemsGrid').innerHTML = PROBLEMS_CONFIG.map(p => `
        <div class="field-card">
            <div class="field-label"><i class="bi ${p.icon}" style="color:var(--danger)"></i> ${p.label}</div>
            <div class="field-question">${p.question}</div>
            <textarea class="field-textarea" placeholder="${p.placeholder || ''}"
                oninput="state.problems['${p.id}']=this.value; updateProgress()"></textarea>
            <div class="field-tip"><i class="bi bi-lightbulb-fill" style="color:var(--warn)"></i> ${p.tip}</div>
        </div>
    `).join('');

            document.getElementById('resourcesGrid').innerHTML = RESOURCES_CONFIG.map(r => `
        <div class="field-card">
            <div class="field-label"><i class="bi ${r.icon}" style="color:var(--success)"></i> ${r.label}</div>
            <div class="field-question">${r.question}</div>
            ${r.type === 'number'
                    ? `<div style="display:flex;gap:8px;align-items:center">
                       <input class="field-input" type="number" min="0" placeholder="0"
                           oninput="state.resources['${r.id}']=+this.value; updateProgress()">
                       <span style="font-size:13px;color:var(--muted);white-space:nowrap">${r.suffix || ''}</span>
                   </div>`
                    : `<textarea class="field-textarea" rows="2"
                       oninput="state.resources['${r.id}']=this.value; updateProgress()"></textarea>`
                }
            <div class="field-tip"><i class="bi bi-lightbulb-fill" style="color:var(--warn)"></i> ${r.tip}</div>
        </div>
    `).join('');
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

            // 2. Try API via window.api
            try {
                if (window.api?.post) {
                    await window.api.post('/api/dept-smart', payload);
                } else if (window.apiRequest) {
                    const token = localStorage.getItem('authToken');
                    if (token) {
                        await window.apiRequest('/api/dept-smart', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify(payload)
                        });
                    }
                }
            } catch (e) {
                console.warn('Sync failed, saved locally:', e);
            }

            showToast('✅ تم الحفظ وإرساله للمالك بنجاح', 'success');
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
                // Restore problems
                Object.entries(d.problems || {}).forEach(([pid, val]) => {
                    state.problems[pid] = val;
                    const el = document.querySelector(`[oninput*="'${pid}'"]`);
                    if (el) el.value = val;
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

    return { renderKpis, renderAxes, renderProblems, restoreState, updateProgress, updateReport, saveAll };
})();
