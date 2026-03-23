/**
 * ═══════════════════════════════════════════
 *  Smart Pings — Phase 13A
 *  الإشارة الذكية للمدير التنفيذي
 *  قرارات في ٣٠ ثانية — Push + Quick Decision
 * ═══════════════════════════════════════════
 */
const SmartPings = (() => {
    'use strict';

    // ── Config ──
    const SEVERITY = {
        URGENT: { label: '🔴 عاجل', color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)' },
        WARNING: { label: '🟡 تنبيه', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)' },
        INFO: { label: '🟢 معلومة', color: '#22c55e', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.2)' }
    };

    let _container = null;
    let _pings = [];
    let _dismissed = JSON.parse(localStorage.getItem('stratix_dismissed_pings') || '[]');

    // ── API helper ──
    async function api(url) {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;
            const res = await fetch(url, { headers });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    // ── Scan Data Sources & Generate Pings ──
    async function scanAndGenerate() {
        _pings = [];

        // جلب versionId النشط أولاً (مطلوب للمبادرات)
        const versionData = await api('/api/versions?limit=1');
        const versions = Array.isArray(versionData) ? versionData : (versionData?.versions || []);
        const activeVersion = versions.find(v => v.isActive) || versions[0];
        const versionId = activeVersion?.id;

        // 1. Scan Initiatives (Budget burn)
        await scanInitiatives(versionId);

        // 2. Scan Tasks — endpoint غير موجود، تجاهل بصمت
        // await scanTasks();

        // 3. Scan KPIs (Below target)
        await scanKPIs(versionId);

        // 4. Scan Company Health
        await scanHealth();

        // Filter dismissed
        _pings = _pings.filter(p => !_dismissed.includes(p.id));

        // Sort: urgent first
        const order = { URGENT: 0, WARNING: 1, INFO: 2 };
        _pings.sort((a, b) => (order[a.severity] || 2) - (order[b.severity] || 2));

        return _pings;
    }

    // ── 1. Initiative Budget Burn ──
    async function scanInitiatives(versionId) {
        if (!versionId) return; // بدون versionId لا يمكن جلب المبادرات
        const data = await api('/api/initiatives?versionId=' + versionId);
        // الـ API يرجع { initiatives: [], meta: {} }
        const initiatives = Array.isArray(data) ? data : (data?.initiatives || []);
        if (!initiatives.length) return;

        initiatives.forEach(init => {
            const budget = parseFloat(init.budget) || 0;
            const spent = parseFloat(init.spent) || 0;
            const progress = parseFloat(init.progress) || 0;

            if (budget > 0) {
                const burnRate = (spent / budget) * 100;
                // 🔴 Over-budget
                if (burnRate > 100) {
                    _pings.push({
                        id: 'init-overbudget-' + init.id,
                        severity: 'URGENT',
                        icon: '💸',
                        title: `مبادرة "${s(init.title)}" تجاوزت الميزانية`,
                        desc: `صُرف ${Math.round(burnRate)}% من الميزانية والإنجاز ${Math.round(progress)}%`,
                        actions: [
                            { label: '⏸️ إيقاف', href: '/initiatives.html?id=' + init.id },
                            { label: '📊 التفاصيل', href: '/initiatives.html?id=' + init.id }
                        ]
                    });
                }
                // 🟡 High burn, low progress
                else if (burnRate > 70 && progress < 40) {
                    _pings.push({
                        id: 'init-burnwarn-' + init.id,
                        severity: 'WARNING',
                        icon: '⚠️',
                        title: `مبادرة "${s(init.title)}" — استنزاف ميزانية`,
                        desc: `صُرف ${Math.round(burnRate)}% لكن الإنجاز ${Math.round(progress)}% فقط`,
                        actions: [
                            { label: '🔍 مراجعة', href: '/initiatives.html?id=' + init.id }
                        ]
                    });
                }
            }

            // Stalled initiative (no progress update in 14+ days)
            if (init.updatedAt) {
                const daysSince = (Date.now() - new Date(init.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSince > 14 && progress < 90) {
                    _pings.push({
                        id: 'init-stalled-' + init.id,
                        severity: 'WARNING',
                        icon: '🐌',
                        title: `مبادرة "${s(init.title)}" متوقفة`,
                        desc: `لم تُحدّث منذ ${Math.round(daysSince)} يوم — هل يحتاج تدخل؟`,
                        actions: [
                            { label: '📋 متابعة', href: '/initiatives.html' }
                        ]
                    });
                }
            }
        });
    }

    // ── 2. Overdue Tasks ──
    async function scanTasks() {
        const data = await api('/api/tasks');
        if (!data || !Array.isArray(data)) return;

        const overdue = data.filter(t => {
            if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
            if (!t.dueDate) return false;
            return new Date(t.dueDate) < new Date();
        });

        if (overdue.length >= 5) {
            _pings.push({
                id: 'tasks-overdue-batch',
                severity: 'URGENT',
                icon: '🔥',
                title: `${overdue.length} مهمة متأخرة عن موعدها`,
                desc: 'مهام لم تُنجز في وقتها — تحتاج متابعة فورية',
                actions: [
                    { label: '📋 عرض المتأخرة', href: '/tasks.html?filter=overdue' }
                ]
            });
        } else if (overdue.length > 0) {
            _pings.push({
                id: 'tasks-overdue-' + overdue.length,
                severity: 'WARNING',
                icon: '⏰',
                title: `${overdue.length} مهمة متأخرة`,
                desc: overdue.slice(0, 2).map(t => s(t.title || 'مهمة')).join('، ') + (overdue.length > 2 ? '...' : ''),
                actions: [
                    { label: '📋 المهام', href: '/tasks.html' }
                ]
            });
        }
    }

    // ── 3. KPIs Below Target ──
    async function scanKPIs(versionId) {
        // /api/kpis غير موجود — نستخدم kpi-entries كبديل
        if (!versionId) return;
        const data = await api('/api/kpi-entries?versionId=' + versionId + '&limit=50');
        if (!data) return;
        const entries = Array.isArray(data) ? data : (data.entries || data.kpiEntries || []);
        if (!entries.length) return;

        const belowTarget = entries.filter(k => {
            const actual = parseFloat(k.actualValue ?? k.value) || 0;
            const target = parseFloat(k.targetValue ?? k.target) || 1;
            return target > 0 && actual < target * 0.6; // below 60% of target
        });

        if (belowTarget.length > 0) {
            _pings.push({
                id: 'kpis-below-' + belowTarget.length,
                severity: belowTarget.length >= 3 ? 'URGENT' : 'WARNING',
                icon: '📉',
                title: `${belowTarget.length} مؤشر أداء دون المستهدف`,
                desc: belowTarget.slice(0, 2).map(k => s(k.name || 'مؤشر')).join('، '),
                actions: [
                    { label: '📊 المؤشرات', href: '/kpis.html' }
                ]
            });
        }
    }

    // ── 4. Company Health ──
    async function scanHealth() {
        const data = await api('/api/company-health/summary');
        if (!data || !data.dimensions) return;

        const _dimMap = {
            financial: 'المالية',
            operational: 'العمليات',
            cultural: 'الثقافة المؤسسية',
            marketing: 'التسويق',
            hr: 'الموارد البشرية'
        };

        data.dimensions.forEach(dim => {
            const dimNameAr = dim.dimensionAr || _dimMap[dim.dimension] || dim.dimension;
            if (dim.score < 40) {
                _pings.push({
                    id: 'health-critical-' + dim.dimension,
                    severity: 'URGENT',
                    icon: '🏥',
                    title: `صحة "${s(dimNameAr)}" حرجة: ${Math.round(dim.score)}%`,
                    desc: 'هذا البعد أقل من 40% — يحتاج خطة تدخل عاجلة',
                    actions: [
                        { label: '🏥 صحة الشركة', href: '/company-health.html' }
                    ]
                });
            } else if (dim.score < 60) {
                _pings.push({
                    id: 'health-warn-' + dim.dimension,
                    severity: 'WARNING',
                    icon: '🩺',
                    title: `صحة "${s(dimNameAr)}" تحتاج تحسين: ${Math.round(dim.score)}%`,
                    desc: 'مستوى متوسط — خطة تحسين مقترحة',
                    actions: [
                        { label: '🩺 التفاصيل', href: '/company-health.html' }
                    ]
                });
            }
        });

        // Overall health
        if (data.overallScore && data.overallScore > 80) {
            _pings.push({
                id: 'health-great',
                severity: 'INFO',
                icon: '🎉',
                title: `صحة الشركة ممتازة: ${Math.round(data.overallScore)}%`,
                desc: 'كل الأبعاد في المنطقة الخضراء — استمر!',
                actions: []
            });
        }
    }



    // ── Safe string (prevent XSS in title/desc) ──
    function s(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[<>"'&]/g, c => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c]));
    }

    // ── Render Pings ──
    function render(containerId) {
        _container = document.getElementById(containerId);
        if (!_container) return;

        scanAndGenerate().then(pings => {
            if (pings.length === 0) {
                _container.style.display = 'none';
                return;
            }

            _container.style.display = 'block';
            const maxShow = 4; // Show max 4 pings
            const visible = pings.slice(0, maxShow);
            const hidden = pings.length - maxShow;

            let html = `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:0 4px;margin-bottom:12px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <h5 style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin:0;">
                            ⚡ الإشارة الذكية — Smart Pings</h5>
                        <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:${pings.some(p => p.severity === 'URGENT') ? 'rgba(239,68,68,0.1);color:#ef4444' : 'rgba(34,197,94,0.1);color:#22c55e'}">${pings.length} إشارة</span>
                    </div>
                    <button data-ping-action="dismiss-all" style="font-size:10px;color:#94a3b8;background:none;border:1px solid #e2e8f0;padding:4px 12px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:600;">
                        <i class="bi bi-check-all"></i> تجاهل الكل
                    </button>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;" id="pingsListInner">
            `;

            visible.forEach(ping => {
                const sev = SEVERITY[ping.severity] || SEVERITY.INFO;
                html += `
                    <div class="smart-ping-card" data-ping-id="${ping.id}" style="
                        background:${sev.bg};
                        border:1px solid ${sev.border};
                        border-radius:16px;
                        padding:16px 20px;
                        display:flex;
                        align-items:flex-start;
                        gap:14px;
                        transition:all .3s;
                        animation:pingSlideIn .4s ease;
                    ">
                        <div style="font-size:24px;flex-shrink:0;margin-top:2px;">${ping.icon}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                                <span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:6px;background:${sev.color}20;color:${sev.color}">${sev.label}</span>
                            </div>
                            <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:4px;line-height:1.5;">${ping.title}</div>
                            <div style="font-size:12px;color:#64748b;line-height:1.6;">${ping.desc}</div>
                            ${ping.actions && ping.actions.length > 0 ? `
                                <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                                    ${ping.actions.map(a => `
                                        <a href="${a.href}" style="
                                            font-size:11px;font-weight:700;padding:6px 14px;
                                            border-radius:10px;text-decoration:none;
                                            background:${sev.color}12;color:${sev.color};
                                            border:1px solid ${sev.color}30;
                                            transition:all .2s;font-family:inherit;
                                        " onmouseover="this.style.background='${sev.color}20'" onmouseout="this.style.background='${sev.color}12'">
                                            ${a.label}
                                        </a>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        <button data-ping-action="dismiss" data-ping-id="${ping.id}" style="
                            background:none;border:none;color:#94a3b8;cursor:pointer;
                            font-size:14px;padding:4px;flex-shrink:0;transition:color .2s;
                        " title="تجاهل" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                `;
            });

            if (hidden > 0) {
                html += `
                    <div style="text-align:center;padding:8px;">
                        <a href="#" data-ping-action="show-all" style="font-size:11px;color:#667eea;font-weight:700;text-decoration:none;">
                            + ${hidden} إشارة أخرى
                        </a>
                    </div>
                `;
            }

            html += '</div>';
            _container.innerHTML = html;

            // Attach event listeners (delegation)
            _container.addEventListener('click', handlePingAction);
        });
    }

    // ── Event Handler ──
    function handlePingAction(e) {
        const target = e.target.closest('[data-ping-action]');
        if (!target) return;

        const action = target.dataset.pingAction;

        if (action === 'dismiss') {
            e.preventDefault();
            const id = target.dataset.pingId;
            dismissPing(id);
        } else if (action === 'dismiss-all') {
            e.preventDefault();
            dismissAll();
        } else if (action === 'show-all') {
            e.preventDefault();
            // Remove limit — show all
            const inner = document.getElementById('pingsListInner');
            if (inner) {
                target.parentElement.remove();
                // Re-render without limit (simplified: just hide the "show more" link)
            }
        }
    }

    // ── Dismiss Single Ping ──
    function dismissPing(id) {
        _dismissed.push(id);
        localStorage.setItem('stratix_dismissed_pings', JSON.stringify(_dismissed));

        const card = _container?.querySelector(`[data-ping-id="${id}"].smart-ping-card`);
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateX(20px)';
            setTimeout(() => {
                card.remove();
                // Check if any pings left
                const remaining = _container?.querySelectorAll('.smart-ping-card');
                if (!remaining || remaining.length === 0) {
                    _container.style.display = 'none';
                }
            }, 300);
        }
    }

    // ── Dismiss All ──
    function dismissAll() {
        _pings.forEach(p => _dismissed.push(p.id));
        localStorage.setItem('stratix_dismissed_pings', JSON.stringify(_dismissed));

        const cards = _container?.querySelectorAll('.smart-ping-card');
        cards?.forEach((card, i) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateX(20px)';
            }, i * 80);
        });

        setTimeout(() => {
            if (_container) _container.style.display = 'none';
        }, (cards?.length || 0) * 80 + 300);
    }

    // ── Reset dismissed (for dev/testing) ──
    function resetDismissed() {
        _dismissed = [];
        localStorage.removeItem('stratix_dismissed_pings');
    }

    // ── CSS Animation (inject once) ──
    function injectStyles() {
        if (document.getElementById('smartPingsStyles')) return;
        const style = document.createElement('style');
        style.id = 'smartPingsStyles';
        style.textContent = `
            @keyframes pingSlideIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .smart-ping-card:hover {
                box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                transform: translateX(-2px);
            }
        `;
        document.head.appendChild(style);
    }

    // ── Public API ──
    return {
        render(containerId) {
            injectStyles();
            render(containerId);
        },
        refresh() {
            if (_container) render(_container.id);
        },
        reset: resetDismissed
    };
})();
