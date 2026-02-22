/**
 * Stratix — لوحة البيانات الإحصائية المرجعية
 * =========================================
 * مكوّن مشترك يُضاف لأي صفحة تحليل (SWOT, PESTEL, Porter, التقييمات...)
 * يجلب البيانات الإحصائية المرتبطة بنوع التحليل تلقائياً ويعرضها كلوحة جانبية.
 *
 * الاستخدام:
 *   1. أضف <script src="/js/stats-panel.js"></script> في الصفحة
 *   2. استدعِ: StatsPanel.init('SWOT')  أو StatsPanel.init('PESTEL')  إلخ
 *   3. اختياري: أضف <div id="statsPanelAnchor"></div> حيث تريد اللوحة
 *
 * الأدوات المدعومة:
 *   SWOT, PESTEL, PORTER, ASSESSMENT, FINANCIAL, BENCHMARKING,
 *   GAP_ANALYSIS, VALUE_CHAIN, CORE_COMPETENCY, CUSTOMER_JOURNEY,
 *   THREE_HORIZONS, OGSM
 */

(function () {
    'use strict';

    const CATEGORY_ICONS = {
        MARKET: '📈',
        DEMOGRAPHIC: '👥',
        FINANCIAL: '💰',
        OPERATIONAL: '⚙️',
        INDUSTRY: '🏭',
        COMPETITIVE: '🏆',
        REGULATORY: '📋',
        CUSTOM: '📝',
    };

    const CATEGORY_COLORS = {
        MARKET: '#38bdf8',
        DEMOGRAPHIC: '#a78bfa',
        FINANCIAL: '#22c55e',
        OPERATIONAL: '#f97316',
        INDUSTRY: '#667eea',
        COMPETITIVE: '#ec4899',
        REGULATORY: '#ef4444',
        CUSTOM: '#94a3b8',
    };

    let panelData = null;
    let isOpen = false;

    // ============ PUBLIC API ============

    window.StatsPanel = {
        /**
         * Initialize the stats panel for a specific tool
         * @param {string} toolType - SWOT, PESTEL, PORTER, etc.
         */
        init: function (toolType) {
            injectStyles();
            createToggleButton(toolType);
            loadData(toolType);
        },

        /**
         * Open the panel programmatically
         */
        open: function () {
            const panel = document.getElementById('statsRefPanel');
            if (panel) { panel.classList.add('open'); isOpen = true; }
        },

        /**
         * Close the panel
         */
        close: function () {
            const panel = document.getElementById('statsRefPanel');
            if (panel) { panel.classList.remove('open'); isOpen = false; }
        },

        /**
         * Get loaded stats data (for use in analysis logic)
         * @returns {Object|null}
         */
        getData: function () {
            return panelData;
        },

        /**
         * Search records across all loaded data
         * @param {string} query
         * @returns {Array}
         */
        search: function (query) {
            if (!panelData || !panelData.data) return [];
            const q = query.toLowerCase();
            const results = [];

            Object.values(panelData.data).forEach(cat => {
                cat.datasets.forEach(ds => {
                    ds.records.forEach(r => {
                        if ((r.indicator && r.indicator.toLowerCase().includes(q)) ||
                            (r.textValue && r.textValue.toLowerCase().includes(q))) {
                            results.push({
                                ...r,
                                datasetName: ds.name,
                                source: ds.source,
                                year: ds.year,
                            });
                        }
                    });
                });
            });

            return results;
        },

        /**
         * Get records by category
         * @param {string} category - MARKET, FINANCIAL, etc.
         * @returns {Array}
         */
        getByCategory: function (category) {
            if (!panelData?.data?.[category]) return [];
            const results = [];
            panelData.data[category].datasets.forEach(ds => {
                ds.records.forEach(r => {
                    results.push({ ...r, datasetName: ds.name, source: ds.source, year: ds.year });
                });
            });
            return results;
        }
    };

    // ============ LOAD DATA ============

    async function loadData(toolType) {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`/api/stats/for-analysis?tool=${toolType}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) return;
            panelData = await res.json();

            renderPanel(toolType);
            updateBadge();
        } catch (e) {
            console.warn('📊 Stats panel: Could not load data', e);
        }
    }

    // ============ CREATE TOGGLE BUTTON ============

    function createToggleButton(toolType) {
        const btn = document.createElement('button');
        btn.id = 'statsToggleBtn';
        btn.innerHTML = `
            <span class="stats-btn-icon">📊</span>
            <span class="stats-btn-label">بيانات مرجعية</span>
            <span class="stats-btn-badge" id="statsBadge" style="display:none">0</span>
        `;
        btn.title = 'عرض البيانات الإحصائية المرتبطة بالتحليل';

        btn.addEventListener('click', () => {
            if (isOpen) {
                window.StatsPanel.close();
            } else {
                window.StatsPanel.open();
            }
        });

        document.body.appendChild(btn);

        // Create panel container
        const panel = document.createElement('div');
        panel.id = 'statsRefPanel';
        panel.innerHTML = '<div class="stats-panel-loading"><div class="stats-spinner"></div> جاري تحميل البيانات...</div>';
        document.body.appendChild(panel);

        // Close on Escape
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && isOpen) window.StatsPanel.close();
        });
    }

    // ============ RENDER PANEL ============

    function renderPanel(toolType) {
        const panel = document.getElementById('statsRefPanel');
        if (!panel || !panelData) return;

        const hasData = panelData.totalDatasets > 0;

        let html = `
            <div class="stats-panel-header">
                <div>
                    <h3>📊 بيانات مرجعية</h3>
                    <p class="stats-panel-sub">${panelData.tip}</p>
                </div>
                <button class="stats-panel-close" onclick="StatsPanel.close()">✕</button>
            </div>
        `;

        if (!hasData) {
            html += `
                <div class="stats-panel-empty">
                    <div style="font-size:40px;opacity:0.3;margin-bottom:12px">📊</div>
                    <strong>لا توجد بيانات إحصائية بعد</strong>
                    <p style="font-size:11px;margin-top:6px;opacity:0.6">
                        ارفع بيانات من صفحة <a href="/statistical-data.html" style="color:#667eea">البيانات الإحصائية</a>
                        لتظهر هنا تلقائياً أثناء التحليل
                    </p>
                </div>
            `;
        } else {
            // Search
            html += `
                <div class="stats-panel-search">
                    <input type="text" id="statsPanelSearch" placeholder="🔍 ابحث في البيانات..." onkeyup="StatsPanel._onSearch(this.value)">
                </div>
            `;

            // Category sections
            html += '<div class="stats-panel-body" id="statsPanelBody">';

            const categories = Object.keys(panelData.data);
            categories.forEach(cat => {
                const catData = panelData.data[cat];
                const emoji = CATEGORY_ICONS[cat] || '📝';
                const color = CATEGORY_COLORS[cat] || '#94a3b8';

                html += `
                    <div class="stats-cat-section">
                        <div class="stats-cat-header" onclick="StatsPanel._toggleCat('${cat}')">
                            <span>${emoji} ${catData.nameAr}</span>
                            <span class="stats-cat-count" style="color:${color}">${catData.totalRecords} سجل</span>
                        </div>
                        <div class="stats-cat-content" id="statsCat_${cat}">
                `;

                catData.datasets.forEach(ds => {
                    html += `
                        <div class="stats-ds-card">
                            <div class="stats-ds-name">${ds.name} ${ds.year ? `<small style="color:var(--text-muted,#94a3b8)">(${ds.year})</small>` : ''}</div>
                            ${ds.source ? `<div class="stats-ds-source">📌 ${ds.source}</div>` : ''}
                            <table class="stats-ds-table">
                    `;

                    ds.records.slice(0, 15).forEach(r => {
                        const val = r.value != null ?
                            `<strong style="color:${color}">${r.value.toLocaleString()}</strong> ${r.unit || ''}` :
                            (r.textValue || '-');
                        html += `
                            <tr>
                                <td class="stats-td-name">${r.indicator}</td>
                                <td class="stats-td-val">${val}</td>
                            </tr>
                        `;
                    });

                    if (ds.records.length > 15) {
                        html += `<tr><td colspan="2" style="text-align:center;font-size:10px;color:#94a3b8">+${ds.records.length - 15} سجل آخر</td></tr>`;
                    }

                    html += '</table></div>';
                });

                html += '</div></div>';
            });

            html += '</div>';

            // Footer link
            html += `
                <div class="stats-panel-footer">
                    <a href="/statistical-data.html">📊 إدارة كل البيانات الإحصائية →</a>
                </div>
            `;
        }

        panel.innerHTML = html;
    }

    // ============ SEARCH WITHIN PANEL ============

    window.StatsPanel._onSearch = function (query) {
        const body = document.getElementById('statsPanelBody');
        if (!body || !query.trim()) {
            // Show all
            body.querySelectorAll('.stats-cat-section').forEach(s => s.style.display = '');
            body.querySelectorAll('.stats-ds-card').forEach(c => c.style.display = '');
            body.querySelectorAll('tr').forEach(r => r.style.display = '');
            return;
        }

        const q = query.toLowerCase();

        body.querySelectorAll('tr').forEach(tr => {
            const text = tr.textContent.toLowerCase();
            tr.style.display = text.includes(q) ? '' : 'none';
        });
    };

    // ============ TOGGLE CATEGORY ============

    window.StatsPanel._toggleCat = function (cat) {
        const el = document.getElementById(`statsCat_${cat}`);
        if (el) {
            el.style.display = el.style.display === 'none' ? '' : 'none';
        }
    };

    // ============ UPDATE BADGE ============

    function updateBadge() {
        const badge = document.getElementById('statsBadge');
        if (!badge || !panelData) return;

        if (panelData.totalDatasets > 0) {
            badge.textContent = panelData.totalRecords;
            badge.style.display = 'flex';
        }
    }

    // ============ STYLES ============

    function injectStyles() {
        if (document.getElementById('statsPanelStyles')) return;

        const style = document.createElement('style');
        style.id = 'statsPanelStyles';
        style.textContent = `
            /* Toggle Button */
            #statsToggleBtn {
                position: fixed;
                bottom: 24px;
                left: 24px;
                z-index: 9000;
                background: linear-gradient(135deg, #1e293b, #0f172a);
                border: 1px solid rgba(102, 126, 234, 0.3);
                color: #e2e8f0;
                padding: 12px 20px;
                border-radius: 16px;
                cursor: pointer;
                font-family: 'Tajawal', sans-serif;
                font-size: 13px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                transition: all 0.3s;
            }

            #statsToggleBtn:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
                border-color: rgba(102, 126, 234, 0.5);
            }

            .stats-btn-icon { font-size: 18px; }

            .stats-btn-badge {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: #fff;
                font-size: 10px;
                min-width: 20px;
                height: 20px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 6px;
            }

            /* Panel */
            #statsRefPanel {
                position: fixed;
                top: 0;
                left: -420px;
                width: 400px;
                height: 100vh;
                z-index: 9500;
                background: #0f1629;
                border-right: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 10px 0 60px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            }

            #statsRefPanel.open {
                left: 0;
            }

            .stats-panel-header {
                padding: 20px 20px 14px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
            }

            .stats-panel-header h3 {
                font-size: 16px;
                font-weight: 800;
                color: #e2e8f0;
                margin: 0 0 4px 0;
            }

            .stats-panel-sub {
                font-size: 11px;
                color: #94a3b8;
                margin: 0;
            }

            .stats-panel-close {
                background: none;
                border: none;
                color: #94a3b8;
                font-size: 18px;
                cursor: pointer;
                padding: 4px;
            }

            .stats-panel-search {
                padding: 12px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            }

            .stats-panel-search input {
                width: 100%;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #e2e8f0;
                padding: 10px 14px;
                border-radius: 10px;
                font-family: 'Tajawal', sans-serif;
                font-size: 12px;
            }

            .stats-panel-search input:focus {
                outline: none;
                border-color: #667eea;
            }

            .stats-panel-body {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
            }

            .stats-panel-empty {
                text-align: center;
                padding: 60px 20px;
                color: #94a3b8;
            }

            .stats-panel-footer {
                padding: 14px 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.06);
                text-align: center;
            }

            .stats-panel-footer a {
                color: #667eea;
                text-decoration: none;
                font-size: 12px;
                font-weight: 700;
            }

            .stats-panel-footer a:hover { text-decoration: underline; }

            /* Category Section */
            .stats-cat-section {
                margin-bottom: 10px;
            }

            .stats-cat-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 12px;
                background: rgba(255, 255, 255, 0.04);
                border-radius: 10px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 700;
                color: #e2e8f0;
                transition: background 0.2s;
            }

            .stats-cat-header:hover {
                background: rgba(255, 255, 255, 0.07);
            }

            .stats-cat-count {
                font-size: 11px;
                font-weight: 700;
            }

            .stats-cat-content {
                padding: 8px 4px;
            }

            /* Dataset Card */
            .stats-ds-card {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 10px;
                padding: 10px 12px;
                margin-bottom: 8px;
            }

            .stats-ds-name {
                font-size: 12px;
                font-weight: 700;
                color: #e2e8f0;
                margin-bottom: 4px;
            }

            .stats-ds-source {
                font-size: 10px;
                color: #94a3b8;
                margin-bottom: 6px;
            }

            .stats-ds-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
            }

            .stats-td-name {
                padding: 4px 6px;
                color: #cbd5e1;
                border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            }

            .stats-td-val {
                padding: 4px 6px;
                text-align: left;
                border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                white-space: nowrap;
            }

            /* Loading */
            .stats-panel-loading {
                display: flex;
                align-items: center;
                gap: 10px;
                justify-content: center;
                padding: 40px;
                color: #94a3b8;
                font-size: 13px;
            }

            .stats-spinner {
                width: 18px;
                height: 18px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-top-color: #667eea;
                border-radius: 50%;
                animation: statsSpin 0.7s linear infinite;
            }

            @keyframes statsSpin { to { transform: rotate(360deg); } }

            /* Responsive */
            @media (max-width: 480px) {
                #statsRefPanel { width: 100%; left: -110%; }
                #statsRefPanel.open { left: 0; }
            }
        `;

        document.head.appendChild(style);
    }

})();
