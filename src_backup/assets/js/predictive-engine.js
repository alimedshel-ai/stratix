/**
 * ═══════════════════════════════════════════════════════════════
 * Predictive Risk & Analytics Engine
 * محرك التنبؤ بالمخاطر والتحليلات المتقدم
 * يعتمد على: interactive-audit.js (auditEngine)
 * ═══════════════════════════════════════════════════════════════
 */

class PredictiveRiskEngine {
    constructor(auditEngine) {
        this.auditEngine = auditEngine;
        this.riskModels = new Map();
        this.predictions = new Map();
        this.scenarios = new Map();
        this.historicalData = this.loadHistoricalData();
        this._monitorInterval = null;

        this.initRiskModels();
    }

    init() {
        this.updatePredictions();
        this.renderDashboard();
        this.startRealTimeMonitoring();
        console.log('🧠 Predictive Risk Engine initialized —', this.riskModels.size, 'models loaded');
    }

    // ═══════════════════════════════════════════════
    // ⚙️ نماذج المخاطر (Risk Models)
    // ═══════════════════════════════════════════════
    initRiskModels() {
        this.registerRiskModel('financial_fraud', {
            name: 'الاحتيال المالي',
            icon: '💳',
            indicators: [
                { name: 'payroll', label: 'ضعف الرواتب', weight: 0.4 },
                { name: 'attendance', label: 'ضعف الحضور', weight: 0.35 },
                { name: 'integration', label: 'فصل الأنظمة', weight: 0.25 }
            ],
            thresholds: { critical: 0.75, high: 0.50, medium: 0.25 },
            correlation: 0.85
        });

        this.registerRiskModel('talent_crisis', {
            name: 'أزمة المواهب',
            icon: '👥',
            indicators: [
                { name: 'talent', label: 'ارتفاع الاستقطاب', weight: 0.45 },
                { name: 'succession', label: 'ضعف التعاقب', weight: 0.30 },
                { name: 'training', label: 'فجوة التدريب', weight: 0.25 }
            ],
            thresholds: { critical: 0.70, high: 0.45, medium: 0.20 },
            correlation: 0.70
        });

        this.registerRiskModel('compliance_failure', {
            name: 'فشل الامتثال',
            icon: '⚖️',
            indicators: [
                { name: 'compliance', label: 'ضعف الامتثال', weight: 0.50 },
                { name: 'documentation', label: 'فجوات توثيق', weight: 0.30 },
                { name: 'audit_trail', label: 'كسر مسار التدقيق', weight: 0.20 }
            ],
            thresholds: { critical: 0.80, high: 0.55, medium: 0.30 },
            correlation: 0.90
        });

        this.registerRiskModel('productivity_collapse', {
            name: 'انهيار الإنتاجية',
            icon: '📉',
            indicators: [
                { name: 'performance', label: 'ضعف الأداء', weight: 0.40 },
                { name: 'engagement', label: 'انخفاض المشاركة', weight: 0.35 },
                { name: 'systems', label: 'عدم استقرار الأنظمة', weight: 0.25 }
            ],
            thresholds: { critical: 0.70, high: 0.50, medium: 0.25 },
            correlation: 0.65
        });
    }

    registerRiskModel(id, config) {
        this.riskModels.set(id, {
            id,
            currentRisk: 0,
            trend: 'stable',
            predictions: [],
            ...config
        });
    }

    // ═══════════════════════════════════════════════
    // 🧮 محرك حساب المخاطر
    // ═══════════════════════════════════════════════
    calculateRisk() {
        const systemScores = this.getCurrentSystemScores();
        const risks = [];

        this.riskModels.forEach((model, id) => {
            let riskScore = 0;
            const triggeredIndicators = [];

            model.indicators.forEach(indicator => {
                const sysScore = systemScores[indicator.name];
                const score = typeof sysScore === 'number' ? sysScore : 50;
                const weakness = (100 - score) / 100;
                riskScore += weakness * indicator.weight;

                if (weakness > 0.5) triggeredIndicators.push(indicator.label);
            });

            // ارتباطات إضافية
            riskScore += this.calculateCorrelationBonus(id, systemScores);
            riskScore = Math.min(1, Math.max(0, riskScore));

            // تحديد المستوى
            let level = 'low';
            if (riskScore >= model.thresholds.critical) level = 'critical';
            else if (riskScore >= model.thresholds.high) level = 'high';
            else if (riskScore >= model.thresholds.medium) level = 'medium';

            // تحديد الاتجاه
            const trend = this.predictTrend(id, riskScore);
            model.currentRisk = riskScore;
            model.trend = trend;

            risks.push({
                id,
                name: model.name,
                icon: model.icon,
                level,
                probability: riskScore,
                trend,
                triggeredIndicators,
                timeToImpact: this.estimateTimeToImpact(riskScore, trend),
                financialImpact: this.estimateFinancialImpact(id, riskScore),
                recommendation: this.generateRecommendation(id, level)
            });
        });

        return risks.sort((a, b) => b.probability - a.probability);
    }

    calculateCorrelationBonus(modelId, scores) {
        const bonuses = {
            'financial_fraud': () => {
                let b = 0;
                if ((scores.payroll || 50) < 60 && (scores.attendance || 50) < 60) b += 0.15;
                return b;
            },
            'talent_crisis': () => {
                let b = 0;
                if ((scores.succession || 50) < 50) b += 0.1;
                return b;
            },
            'compliance_failure': () => {
                let b = 0;
                if ((scores.documentation || 50) < 40) b += 0.12;
                return b;
            },
            'productivity_collapse': () => {
                let b = 0;
                if ((scores.performance || 50) < 40 && (scores.engagement || 50) < 40) b += 0.15;
                return b;
            }
        };
        return bonuses[modelId] ? bonuses[modelId]() : 0;
    }

    predictTrend(modelId, currentScore) {
        const history = this.historicalData[modelId] || [];
        if (history.length < 3) return 'stable';
        const recent = history.slice(-3);
        const avgChange = (recent[2] - recent[0]) / 2;
        if (avgChange > 0.05) return 'increasing';
        if (avgChange < -0.05) return 'decreasing';
        return 'stable';
    }

    estimateTimeToImpact(riskScore, trend) {
        const baseTime = riskScore > 0.7 ? 30 : riskScore > 0.5 ? 90 : 180;
        const mult = trend === 'increasing' ? 0.7 : trend === 'decreasing' ? 1.4 : 1;
        return Math.round(baseTime * mult);
    }

    estimateFinancialImpact(riskType, probability) {
        const base = {
            'financial_fraud': 500000,
            'talent_crisis': 300000,
            'compliance_failure': 800000,
            'productivity_collapse': 400000
        };
        return Math.round((base[riskType] || 200000) * probability);
    }

    generateRecommendation(riskId, level) {
        const recs = {
            'financial_fraud': {
                critical: 'فصل فوري لنظامي الرواتب والحضور + تدقيق قانوني عاجل',
                high: 'تفعيل رقابة مزدوجة على الرواتب + مراجعة شهرية',
                medium: 'تحسين آليات التحقق في نظام الحضور',
                low: 'مراقبة دورية للأنظمة المالية'
            },
            'talent_crisis': {
                critical: 'تجميد الاستقطاب + خطة استبقاء طارئة + تسريع التعاقب',
                high: 'مراجعة سياسات التعويض + خارطة مهارات عاجلة',
                medium: 'تحسين برامج التدريب المستمر',
                low: 'متابعة مؤشرات الرضا الوظيفي'
            },
            'compliance_failure': {
                critical: 'توقيف العمليات الحرجة + تدقيق شامل + استشارة قانونية',
                high: 'إصلاح فجوات التوثيق + تدريب امتثال عاجل',
                medium: 'تحديث سياسات الامتثال',
                low: 'مراجعة سنوية للامتثال'
            },
            'productivity_collapse': {
                critical: 'إعادة هيكلة فريق الأداء + تدخل إداري مباشر',
                high: 'تحسين أدوات العمل + مسح بيئة العمل',
                medium: 'برامج تحفيز قصيرة المدى',
                low: 'الحفاظ على المستوى الحالي'
            }
        };
        return recs[riskId]?.[level] || 'مراقبة مستمرة';
    }

    // ═══════════════════════════════════════════════
    // 🎛️ محاكاة السيناريوهات
    // ═══════════════════════════════════════════════
    simulateScenario(scenarioName, params) {
        const handlers = {
            'reduce_turnover': (p) => this.simTurnover(p),
            'automate_payroll': (p) => this.simAutomation(p),
            'invest_training': (p) => this.simTraining(p),
            'upgrade_systems': (p) => this.simUpgrade(p)
        };
        const result = handlers[scenarioName] ? handlers[scenarioName](params) : null;
        if (result) {
            this.scenarios.set(result.scenario, result);
            this.renderInsights();
        }
        return result;
    }

    simTurnover(p) {
        const reduction = p.reduction_percent || 20;
        const investment = p.investment || 100000;
        const savingsPerEmp = 45000;
        const empSaved = Math.round((reduction / 100) * 100);
        const totalSavings = empSaved * savingsPerEmp;
        const productivityGain = reduction * 0.8;

        return {
            scenario: 'خفض الاستقطاب',
            investment,
            savings: totalSavings,
            netBenefit: totalSavings - investment,
            roi: ((totalSavings - investment) / investment * 100).toFixed(1),
            productivityGain: productivityGain.toFixed(1) + '%',
            paybackPeriod: Math.round(investment / (totalSavings / 12)),
            riskReduction: { 'talent_crisis': reduction * 0.9, 'productivity_collapse': reduction * 0.4 },
            confidence: 0.85
        };
    }

    simAutomation(p) {
        const level = p.automation_level || 0.8;
        const investment = p.investment || 200000;
        const errorReduction = level * 0.95;
        const monthly = 15000 + (errorReduction * 50000);
        const annual = monthly * 12;

        return {
            scenario: 'أتمتة الرواتب',
            investment,
            savings: annual,
            netBenefit: annual - investment,
            roi: ((annual - investment) / investment * 100).toFixed(1),
            errorReduction: (errorReduction * 100).toFixed(1) + '%',
            paybackPeriod: Math.round(investment / monthly),
            riskReduction: { 'financial_fraud': level * 80, 'compliance_failure': level * 60 },
            confidence: 0.90
        };
    }

    simTraining(p) {
        const hours = p.hours_per_employee || 40;
        const investment = p.investment || 150000;
        const productivityGain = Math.min(hours * 0.5, 25);
        const annualBenefit = productivityGain * 3000;

        return {
            scenario: 'الاستثمار في التدريب',
            investment,
            savings: annualBenefit,
            netBenefit: annualBenefit - investment,
            roi: ((annualBenefit - investment) / investment * 100).toFixed(1),
            paybackPeriod: Math.round(investment / (annualBenefit / 12)),
            riskReduction: { 'talent_crisis': hours * 0.5, 'productivity_collapse': hours * 0.6 },
            confidence: 0.75
        };
    }

    simUpgrade(p) {
        const scope = p.scope_percent || 80;
        const investment = p.investment || 300000;
        const efficiencyGain = scope * 0.3;
        const annualSavings = efficiencyGain * 5000;

        return {
            scenario: 'ترقية الأنظمة',
            investment,
            savings: annualSavings,
            netBenefit: annualSavings - investment,
            roi: ((annualSavings - investment) / investment * 100).toFixed(1),
            paybackPeriod: Math.round(investment / (annualSavings / 12)),
            riskReduction: { 'compliance_failure': scope * 0.7, 'financial_fraud': scope * 0.5 },
            confidence: 0.80
        };
    }

    // ═══════════════════════════════════════════════
    // 💡 الرؤى التنفيذية
    // ═══════════════════════════════════════════════
    generateInsights() {
        const risks = this.predictions.get('current') || [];
        const scenarios = Array.from(this.scenarios.values());
        const insights = [];

        // من المخاطر الحرجة
        const critical = risks.filter(r => r.level === 'critical');
        if (critical.length > 0) {
            insights.push({
                type: 'urgent', icon: 'bi-exclamation-triangle-fill',
                title: `${critical.length} مخاطر حرجة تتطلب تدخل فوري`,
                description: `أعلى خطر: ${critical[0].name} باحتمالية ${(critical[0].probability * 100).toFixed(0)}% — ${critical[0].recommendation}`,
                action: 'عرض خطة الطوارئ', priority: 1
            });
        }

        // من المخاطر المتصاعدة
        const rising = risks.find(r => r.trend === 'increasing');
        if (rising) {
            insights.push({
                type: 'prediction', icon: 'bi-graph-up-arrow',
                title: `تنبيه اتجاهي: ${rising.name} في تصاعد`,
                description: `متوقع الوصول لمستوى حرج خلال ${rising.timeToImpact} يوم — تأثير مالي: ${rising.financialImpact.toLocaleString()} ر.س`,
                action: 'إجراء وقائي', priority: 2
            });
        }

        // من السيناريوهات
        if (scenarios.length > 0) {
            const best = scenarios.reduce((b, c) => parseFloat(c.roi) > parseFloat(b.roi) ? c : b);
            insights.push({
                type: 'opportunity', icon: 'bi-lightbulb-fill',
                title: `فرصة: ${best.scenario}`,
                description: `عائد استثمار ${best.roi}% خلال ${best.paybackPeriod} شهر — صافي عائد ${best.netBenefit.toLocaleString()} ر.س`,
                action: 'تفاصيل السيناريو', priority: 3
            });
        }

        // نقاط قوة
        const lowRisks = risks.filter(r => r.level === 'low');
        if (lowRisks.length > 0) {
            insights.push({
                type: 'success', icon: 'bi-shield-check',
                title: `${lowRisks.length} أنظمة مستقرة ومنخفضة المخاطر`,
                description: lowRisks.map(r => r.name).join('، ') + ' — في وضع آمن',
                action: 'الحفاظ على المستوى', priority: 4
            });
        }

        return insights.sort((a, b) => a.priority - b.priority);
    }

    // ═══════════════════════════════════════════════
    // 📊 التصور البصري (Rendering)
    // ═══════════════════════════════════════════════
    renderDashboard() {
        this.renderRiskAlerts();
        this.renderHeatMap();
        this.renderPredictions();
        this.renderSystemGraph();
        this.renderInsights();
        this.updateTimestamp();
    }

    renderRiskAlerts() {
        const el = document.getElementById('risk-alerts');
        if (!el) return;
        const risks = this.predictions.get('current') || [];
        if (risks.length === 0) {
            el.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-repeat"></i><p>لا توجد بيانات — قم بتشغيل الفحص التفاعلي أولاً</p></div>';
            return;
        }

        el.innerHTML = risks.map(r => `
            <div class="alert-item ${r.level}">
                <div class="alert-icon">${r.icon}</div>
                <div class="alert-content">
                    <div class="alert-title">${r.name}</div>
                    <div class="alert-meta">
                        <span>الاحتمالية: ${(r.probability * 100).toFixed(0)}%</span>
                        <span>الاتجاه: ${this.getTrendText(r.trend)}</span>
                        <span>التأثير: ${r.financialImpact.toLocaleString()} ر.س</span>
                        <span>الوقت: ${r.timeToImpact} يوم</span>
                    </div>
                    <div class="alert-recommendation">💡 ${r.recommendation}</div>
                </div>
                <span class="probability-badge ${r.level}">${this.getLevelText(r.level)}</span>
            </div>
        `).join('');
    }

    renderHeatMap() {
        const el = document.getElementById('risk-heatmap');
        if (!el) return;

        const systems = this.auditEngine?.systems ? Array.from(this.auditEngine.systems.values()) : [];
        if (systems.length === 0) {
            // عرض بيانات افتراضية
            const demo = [
                { name: 'الرواتب', icon: '💰', score: 72 },
                { name: 'الحضور', icon: '⏰', score: 45 },
                { name: 'التوظيف', icon: '👥', score: 83 },
                { name: 'الأداء', icon: '📊', score: 58 },
                { name: 'التدريب', icon: '🎓', score: 35 },
                { name: 'العقود', icon: '📋', score: 91 },
                { name: 'الامتثال', icon: '⚖️', score: 67 },
                { name: 'التعاقب', icon: '🔄', score: 42 }
            ];
            el.innerHTML = demo.map(s => {
                const level = this.getRiskLevelFromScore(s.score);
                return `<div class="heatmap-cell ${level}">
                    <div class="cell-icon">${s.icon}</div>
                    <div class="cell-system">${s.name}</div>
                    <div class="cell-score">${s.score}%</div>
                    <div class="cell-risk">${this.getLevelText(level)}</div>
                </div>`;
            }).join('');
            return;
        }

        el.innerHTML = systems.map(sys => {
            const level = this.getRiskLevelFromScore(sys.score);
            return `<div class="heatmap-cell ${level}" onclick="showSystemDetails('${sys.id}')">
                <div class="cell-icon">${sys.icon || '⚙️'}</div>
                <div class="cell-system">${sys.name}</div>
                <div class="cell-score">${Math.round(sys.score)}%</div>
                <div class="cell-risk">${this.getLevelText(level)}</div>
            </div>`;
        }).join('');
    }

    renderPredictions() {
        const el = document.getElementById('predictions-container');
        if (!el) return;

        const risks = this.predictions.get('current') || [];
        const predictions = risks.length > 0 ? risks.slice(0, 4).map(r => ({
            title: r.name,
            icon: r.icon,
            trend: r.trend === 'increasing' ? 'up' : r.trend === 'decreasing' ? 'down' : 'stable',
            chartClass: r.trend === 'increasing' ? 'increasing' : r.trend === 'decreasing' ? 'decreasing' : 'stable',
            value: (r.probability * 100).toFixed(0) + '%',
            confidence: r.trend === 'increasing' ? 0.87 : r.trend === 'decreasing' ? 0.91 : 0.78,
            impact: r.financialImpact,
            days: r.timeToImpact
        })) : [
            { title: 'مخاطر الاحتيال المالي', icon: '💳', trend: 'up', chartClass: 'increasing', value: '68%', confidence: 0.87, impact: 340000, days: 45 },
            { title: 'أزمة المواهب', icon: '👥', trend: 'up', chartClass: 'increasing', value: '52%', confidence: 0.72, impact: 210000, days: 75 },
            { title: 'فشل الامتثال', icon: '⚖️', trend: 'stable', chartClass: 'stable', value: '35%', confidence: 0.91, impact: 280000, days: 120 },
            { title: 'انهيار الإنتاجية', icon: '📉', trend: 'down', chartClass: 'decreasing', value: '23%', confidence: 0.82, impact: 92000, days: 180 }
        ];

        el.innerHTML = predictions.map(p => `
            <div class="prediction-card">
                <div class="prediction-header">
                    <span class="prediction-title">${p.icon} ${p.title}</span>
                    <span class="prediction-trend trend-${p.trend}">
                        <i class="bi bi-arrow-${p.trend === 'up' ? 'up-right' : p.trend === 'down' ? 'down-right' : 'right'}"></i>
                        ${p.trend === 'up' ? 'تصاعد' : p.trend === 'down' ? 'تناقص' : 'مستقر'}
                    </span>
                </div>
                <div class="prediction-chart"><div class="chart-line ${p.chartClass}"></div></div>
                <div class="prediction-value">${p.value}</div>
                <div class="prediction-confidence">ثقة التنبؤ: ${(p.confidence * 100).toFixed(0)}%</div>
                <div class="prediction-detail">
                    <span>التأثير: ${p.impact.toLocaleString()} ر.س</span>
                    <span>خلال ${p.days} يوم</span>
                </div>
            </div>
        `).join('');
    }

    renderSystemGraph() {
        const canvas = document.getElementById('system-graph-canvas');
        if (!canvas) return;
        canvas.innerHTML = '';

        const nodes = [
            { id: 'payroll', name: 'الرواتب', icon: '💰', score: 72 },
            { id: 'attendance', name: 'الحضور', icon: '⏰', score: 45 },
            { id: 'talent', name: 'التوظيف', icon: '👥', score: 83 },
            { id: 'performance', name: 'الأداء', icon: '📊', score: 58 },
            { id: 'training', name: 'التدريب', icon: '🎓', score: 35 },
            { id: 'contracts', name: 'العقود', icon: '📋', score: 91 },
            { id: 'compliance', name: 'الامتثال', icon: '⚖️', score: 67 },
            { id: 'succession', name: 'التعاقب', icon: '🔄', score: 42 }
        ];

        // Override with real data if available
        if (this.auditEngine?.systems) {
            this.auditEngine.systems.forEach((sys) => {
                const n = nodes.find(x => x.id === sys.id);
                if (n) { n.score = Math.round(sys.score); n.icon = sys.icon || n.icon; }
            });
        }

        const w = canvas.offsetWidth || 700;
        const h = canvas.offsetHeight || 350;
        const cx = w / 2, cy = h / 2, radius = Math.min(w, h) * 0.37;
        const positions = {};

        // Connection lines (draw first, behind nodes)
        const connections = [
            ['payroll', 'attendance'],
            ['payroll', 'compliance'],
            ['attendance', 'performance'],
            ['talent', 'succession'],
            ['talent', 'training'],
            ['performance', 'training'],
            ['contracts', 'compliance']
        ];

        // Calculate positions
        nodes.forEach((n, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
            positions[n.id] = {
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            };
        });

        // Draw connections
        connections.forEach(([from, to]) => {
            const p1 = positions[from], p2 = positions[to];
            if (!p1 || !p2) return;
            const dx = p2.x - p1.x, dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            const fromNode = nodes.find(n => n.id === from);
            const toNode = nodes.find(n => n.id === to);
            const avgScore = ((fromNode?.score || 50) + (toNode?.score || 50)) / 2;
            const cls = avgScore < 50 ? 'weak' : avgScore > 75 ? 'strong' : '';

            const line = document.createElement('div');
            line.className = 'connection-line ' + cls;
            line.style.cssText = `
                left: ${p1.x}px; top: ${p1.y}px;
                width: ${length}px;
                transform: rotate(${angle}deg);
            `;
            canvas.appendChild(line);
        });

        // Draw nodes
        nodes.forEach(n => {
            const pos = positions[n.id];
            const cls = n.score < 50 ? 'weak' : n.score > 80 ? 'strong' : '';

            const node = document.createElement('div');
            node.className = 'system-node-graph ' + cls;
            node.style.cssText = `left: ${pos.x - 42}px; top: ${pos.y - 42}px;`;
            node.innerHTML = `
                <div class="node-icon">${n.icon}</div>
                <div class="node-name">${n.name}</div>
                <div class="node-score">${n.score}%</div>
            `;
            node.onclick = () => showSystemDetails(n.id);
            canvas.appendChild(node);
        });
    }

    renderInsights() {
        const el = document.getElementById('insights-panel');
        if (!el) return;

        const insights = this.generateInsights();
        if (insights.length === 0) {
            el.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8">قم بتشغيل الفحص أو المحاكاة لعرض الرؤى</div>';
            return;
        }

        el.innerHTML = insights.map(i => `
            <div class="insight-item ${i.type}">
                <div class="insight-icon"><i class="bi ${i.icon}"></i></div>
                <div class="insight-content">
                    <h4>${i.title}</h4>
                    <p>${i.description}</p>
                    <button class="insight-action" onclick="handleInsightAction('${i.type}')">
                        ${i.action} <i class="bi bi-arrow-left"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateTimestamp() {
        const el = document.getElementById('last-update');
        if (el) el.textContent = 'آخر تحديث: ' + new Date().toLocaleTimeString('ar-SA');
    }

    // ═══════════════════════════════════════════════
    // 🔄 المراقبة اللحظية
    // ═══════════════════════════════════════════════
    startRealTimeMonitoring() {
        if (this._monitorInterval) clearInterval(this._monitorInterval);
        this._monitorInterval = setInterval(() => {
            this.updatePredictions();
            this.renderDashboard();
        }, 30000);
    }

    updatePredictions() {
        const risks = this.calculateRisk();
        this.predictions.set('current', risks);

        // تحديث بيانات تاريخية
        risks.forEach(r => {
            if (!this.historicalData[r.id]) this.historicalData[r.id] = [];
            this.historicalData[r.id].push(r.probability);
            if (this.historicalData[r.id].length > 20) this.historicalData[r.id].shift();
        });

        this.saveHistoricalData();
    }

    getCurrentSystemScores() {
        const scores = {};
        if (this.auditEngine?.systems) {
            this.auditEngine.systems.forEach((sys, id) => { scores[id] = sys.score; });
        }
        return scores;
    }

    // ═══════════════════════════════════════════════
    // 💾 بيانات تاريخية
    // ═══════════════════════════════════════════════
    loadHistoricalData() {
        try {
            return JSON.parse(localStorage.getItem('stratix_risk_history') || 'null') || this.generateDefaultHistory();
        } catch { return this.generateDefaultHistory(); }
    }

    saveHistoricalData() {
        try {
            localStorage.setItem('stratix_risk_history', JSON.stringify(this.historicalData));
        } catch (e) { console.warn('Failed to save risk history'); }
    }

    generateDefaultHistory() {
        return {
            'financial_fraud': [0.20, 0.25, 0.30, 0.35, 0.45],
            'talent_crisis': [0.30, 0.35, 0.40, 0.38, 0.42],
            'compliance_failure': [0.15, 0.20, 0.22, 0.25, 0.30],
            'productivity_collapse': [0.25, 0.28, 0.30, 0.35, 0.40]
        };
    }

    // ═══════════════════════════════════════════════
    // 🔧 أدوات مساعدة
    // ═══════════════════════════════════════════════
    getRiskLevelFromScore(score) {
        if (score < 40) return 'critical';
        if (score < 60) return 'high';
        if (score < 80) return 'medium';
        return 'low';
    }

    getLevelText(level) {
        return { critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' }[level] || level;
    }

    getTrendText(trend) {
        return { increasing: 'متصاعد ↗', decreasing: 'متناقص ↘', stable: 'مستقر →' }[trend] || trend;
    }
}

// ═══════════════════════════════════════════════
// 🎮 دوال التحكم العامة
// ═══════════════════════════════════════════════
function runScenario(type) {
    if (!predictiveEngine) return;

    const params = {};
    if (type === 'turnover') {
        params.reduction_percent = parseInt(document.getElementById('turnover-slider')?.value || 20);
        params.investment = parseInt(document.getElementById('turnover-investment')?.value || 100000);
    } else if (type === 'automation') {
        params.automation_level = parseInt(document.getElementById('automation-slider')?.value || 80) / 100;
        params.investment = parseInt(document.getElementById('automation-investment')?.value || 200000);
    }

    const scenarioMap = { 'turnover': 'reduce_turnover', 'automation': 'automate_payroll' };
    const result = predictiveEngine.simulateScenario(scenarioMap[type] || type, params);
    if (result) displayScenarioResult(result);
}

function displayScenarioResult(result) {
    const el = document.getElementById('scenario-results');
    if (!el) return;

    const roiPositive = parseFloat(result.roi) > 0;

    el.innerHTML = `
        <div class="scenario-metric ${roiPositive ? 'positive' : 'negative'}">
            <div class="metric-value ${roiPositive ? 'positive' : 'negative'}">${result.roi}%</div>
            <div class="metric-label">عائد الاستثمار (ROI)</div>
        </div>
        <div class="scenario-metric ${roiPositive ? 'positive' : 'negative'}">
            <div class="metric-value ${roiPositive ? 'positive' : 'negative'}">${result.netBenefit.toLocaleString()} ر.س</div>
            <div class="metric-label">صافي العائد</div>
        </div>
        <div class="scenario-metric">
            <div class="metric-value">${result.paybackPeriod} شهر</div>
            <div class="metric-label">فترة الاسترداد</div>
        </div>
    `;
}

function showSystemDetails(systemId) {
    if (typeof auditEngine !== 'undefined' && auditEngine?.systems) {
        const sys = auditEngine.systems.get(systemId);
        if (sys) {
            if (typeof showToast === 'function') {
                showToast(`${sys.name}: النضج ${Math.round(sys.score)}%`, 'info');
            }
            return;
        }
    }
    if (typeof showToast === 'function') showToast('اضغط على النظام بعد تشغيل الفحص التفاعلي', 'info');
}

function handleInsightAction(type) {
    const messages = {
        'urgent': 'يتم تحضير خطة الطوارئ — راجع التوصيات أعلاه',
        'prediction': 'يتم تحليل الاتجاه — اتخذ إجراءات وقائية',
        'opportunity': 'يتم عرض تفاصيل أفضل سيناريو محاكاة',
        'success': 'النظام مستقر — حافظ على المستوى الحالي'
    };
    if (typeof showToast === 'function') showToast(messages[type] || '...', 'info');
}

function exportAnalyticsReport() {
    if (!predictiveEngine) return;

    const report = {
        title: 'تقرير التحليلات التنبؤية — ستارتكس',
        timestamp: new Date().toISOString(),
        predictions: predictiveEngine.predictions.get('current') || [],
        scenarios: Object.fromEntries(predictiveEngine.scenarios),
        insights: predictiveEngine.generateInsights(),
        historicalData: predictiveEngine.historicalData
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictive-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (typeof showToast === 'function') showToast('تم تصدير التقرير التنبؤي ✅', 'success');
}

// ═══════════════════════════════════════════════
// 🚀 التهيئة
// ═══════════════════════════════════════════════
let predictiveEngine;

document.addEventListener('DOMContentLoaded', () => {
    const audit = (typeof auditEngine !== 'undefined') ? auditEngine : null;
    predictiveEngine = new PredictiveRiskEngine(audit);
    predictiveEngine.init();
});
