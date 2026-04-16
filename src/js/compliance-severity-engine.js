/**
 * Compliance Severity Engine — محرك تقييم خطورة الامتثال
 * ============================================================
 * يقرأ إجابات الـ checklist + بيانات severity من COMPLIANCE_DEEP_CONFIG
 * ويُنتج تقرير خطورة شامل مع ألوان وأولويات
 * ============================================================
 */
window.COMPLIANCE_SEVERITY_ENGINE = (function () {

    var CDC = window.COMPLIANCE_DEEP_CONFIG;

    // ── مستويات الخطر العامة ──
    var DANGER_ZONES = {
        safe:     { label: 'آمن',    en: 'Safe',     color: '#16a34a', bg: '#f0fdf4', min: 0,  max: 25 },
        caution:  { label: 'تنبيه',  en: 'Caution',  color: '#f59e0b', bg: '#fffbeb', min: 26, max: 50 },
        high:     { label: 'مرتفع',  en: 'High',     color: '#f97316', bg: '#fff7ed', min: 51, max: 75 },
        critical: { label: 'حرج',    en: 'Critical', color: '#dc2626', bg: '#fef2f2', min: 76, max: 100 }
    };

    // ── Default severity إذا السؤال ما عنده ──
    var DEFAULT_SEVERITY = { tier: 2, weight: 5, minPct: 50, warnPct: 75, riskType: 'operational', penalty: '', regulator: '' };

    /**
     * تحويل الإجابة إلى نسبة مئوية (0-100)
     */
    function answerToPct(question, answer) {
        if (!answer) return null; // ما أجاب

        var mode = question.mode || question.type;
        // yn / yes_no
        if (!mode || mode === 'yn' || mode === 'yes_no') {
            var ans = (typeof answer === 'object') ? answer.answer : answer;
            if (ans === 'yes') return 100;
            if (ans === 'no') return 0;
            return null;
        }
        // pct
        if (mode === 'pct') {
            var pVal = (typeof answer === 'object') ? answer.pct : answer;
            var p = parseFloat(pVal);
            return isNaN(p) ? null : Math.min(100, Math.max(0, p));
        }
        // count
        if (mode === 'count') {
            var total, valid;
            if (typeof answer === 'object') {
                total = parseFloat(answer.total) || 0;
                valid = parseFloat(answer.valid) || 0;
            } else {
                return null;
            }
            if (total <= 0) return null;
            return Math.min(100, (valid / total) * 100);
        }
        return null;
    }

    /**
     * تقييم سؤال واحد → zone + dangerPoints
     */
    function evaluateQuestion(question, answer) {
        var sev = question.severity || DEFAULT_SEVERITY;
        var pct = answerToPct(question, answer);
        var answered = pct !== null;

        var zone = 'unanswered';
        var dangerPoints = 0;

        if (answered) {
            var mode = question.mode || question.type;
            var isYN = (!mode || mode === 'yn' || mode === 'yes_no');

            if (isYN) {
                // نعم/لا: 0 أو 100
                zone = pct >= 100 ? 'green' : 'red';
                dangerPoints = pct >= 100 ? 0 : sev.weight;
            } else {
                // pct/count: مقارنة بالحدود
                if (pct >= sev.warnPct) {
                    zone = 'green';
                    dangerPoints = 0;
                } else if (pct >= sev.minPct) {
                    zone = 'yellow';
                    // خطر جزئي نسبي
                    var range = sev.warnPct - sev.minPct;
                    var gap = sev.warnPct - pct;
                    dangerPoints = range > 0 ? (gap / range) * sev.weight * 0.5 : sev.weight * 0.3;
                } else {
                    zone = 'red';
                    // خطر كامل نسبي
                    var below = sev.minPct - pct;
                    var maxBelow = sev.minPct;
                    dangerPoints = maxBelow > 0 ? (0.5 + (below / maxBelow) * 0.5) * sev.weight : sev.weight;
                }
            }
        }

        return {
            id: question.id,
            q: question.q || question.text,
            axis: question.axis,
            tier: sev.tier,
            weight: sev.weight,
            riskType: sev.riskType,
            penalty: sev.penalty,
            regulator: sev.regulator,
            pct: answered ? Math.round(pct) : null,
            zone: zone,
            dangerPoints: Math.round(dangerPoints * 100) / 100,
            maxPoints: sev.weight,
            answered: answered,
            minPct: sev.minPct,
            warnPct: sev.warnPct
        };
    }

    /**
     * بناء تقرير الخطورة الكامل
     * @param {Object} savedChecklist - إجابات المستخدم { qId: answer }
     * @param {string} activityType - industrial/commercial/service
     * @param {string} companySize - micro/small/medium/large
     */
    function calculateDangerReport(savedChecklist, activityType, companySize) {
        if (!CDC) return null;

        var built = CDC.buildDeepQuestions(activityType || 'service', companySize || 'medium');
        var allQ = built.allQuestions;
        var checklist = savedChecklist || {};

        // تقييم كل سؤال
        var evaluations = [];
        allQ.forEach(function (q) {
            var answer = checklist[q.id];
            evaluations.push(evaluateQuestion(q, answer));
        });

        // ── تجميع حسب المحاور ──
        var axisMap = {};
        evaluations.forEach(function (ev) {
            if (!axisMap[ev.axis]) {
                axisMap[ev.axis] = { id: ev.axis, items: [], totalDanger: 0, maxDanger: 0, answered: 0, total: 0 };
            }
            var ax = axisMap[ev.axis];
            ax.items.push(ev);
            ax.total++;
            ax.maxDanger += ev.maxPoints;
            if (ev.answered) {
                ax.answered++;
                ax.totalDanger += ev.dangerPoints;
            }
        });

        var axes = Object.keys(axisMap).map(function (k) {
            var ax = axisMap[k];
            var dangerPct = ax.maxDanger > 0 ? Math.round((ax.totalDanger / ax.maxDanger) * 100) : 0;
            return {
                id: ax.id,
                dangerPct: dangerPct,
                zone: pctToZone(dangerPct),
                totalDanger: ax.totalDanger,
                maxDanger: ax.maxDanger,
                answered: ax.answered,
                total: ax.total,
                tier1Failing: ax.items.filter(function (i) { return i.tier === 1 && i.zone === 'red'; }).length,
                tier2Failing: ax.items.filter(function (i) { return i.tier === 2 && i.zone === 'red'; }).length,
                items: ax.items
            };
        });

        // ترتيب المحاور حسب الخطورة (الأعلى أولاً)
        axes.sort(function (a, b) { return b.dangerPct - a.dangerPct; });

        // ── تجميع حسب المستوى (Tier) ──
        var tiers = { 1: { total: 0, passing: 0, failing: 0, unanswered: 0, items: [] },
                      2: { total: 0, passing: 0, failing: 0, unanswered: 0, items: [] },
                      3: { total: 0, passing: 0, failing: 0, unanswered: 0, items: [] } };

        evaluations.forEach(function (ev) {
            var t = tiers[ev.tier] || tiers[2];
            t.total++;
            if (!ev.answered) {
                t.unanswered++;
            } else if (ev.zone === 'red') {
                t.failing++;
                t.items.push(ev);
            } else {
                t.passing++;
            }
        });

        // ── المجموع الكلي ──
        var totalDanger = 0, totalMax = 0, totalAnswered = 0;
        evaluations.forEach(function (ev) {
            totalMax += ev.maxPoints;
            if (ev.answered) {
                totalDanger += ev.dangerPoints;
                totalAnswered++;
            }
        });

        var overallDangerPct = totalMax > 0 ? Math.round((totalDanger / totalMax) * 100) : 0;

        // ── أولويات العمل (tier 1 أحمر أولاً) ──
        var priorityActions = evaluations
            .filter(function (ev) { return ev.answered && ev.zone === 'red'; })
            .sort(function (a, b) {
                if (a.tier !== b.tier) return a.tier - b.tier;
                return b.dangerPoints - a.dangerPoints;
            })
            .slice(0, 15);

        // ── Yellow warnings ──
        var warnings = evaluations
            .filter(function (ev) { return ev.answered && ev.zone === 'yellow'; })
            .sort(function (a, b) {
                if (a.tier !== b.tier) return a.tier - b.tier;
                return b.dangerPoints - a.dangerPoints;
            })
            .slice(0, 10);

        var overallZone = pctToZone(overallDangerPct);
        var zoneInfo = DANGER_ZONES[overallZone];

        return {
            overall: {
                dangerPct: overallDangerPct,
                zone: overallZone,
                label: zoneInfo.label,
                color: zoneInfo.color,
                bg: zoneInfo.bg,
                totalAnswered: totalAnswered,
                totalQuestions: allQ.length,
                completionPct: Math.round((totalAnswered / allQ.length) * 100)
            },
            axes: axes,
            tiers: tiers,
            priorityActions: priorityActions,
            warnings: warnings,
            evaluations: evaluations
        };
    }

    function pctToZone(dangerPct) {
        if (dangerPct <= 25) return 'safe';
        if (dangerPct <= 50) return 'caution';
        if (dangerPct <= 75) return 'high';
        return 'critical';
    }

    /**
     * HTML لعرض ملخص الخطورة (مكوّن مستقل)
     */
    function renderDangerSummary(report) {
        if (!report) return '<div class="text-muted text-center py-3">لا توجد بيانات كافية</div>';

        var o = report.overall;
        var tiers = report.tiers;
        var TIERS = CDC.SEVERITY_TIERS;

        var html = '';

        // ── مؤشر الخطورة العام ──
        html += '<div class="card border-0 shadow-sm mb-3" style="background:' + o.bg + '">';
        html += '<div class="card-body text-center py-4">';
        html += '<h5 class="mb-2" style="color:' + o.color + '">تقييم خطورة وضع المنشأة</h5>';

        // Gauge circle
        var circumference = 2 * Math.PI * 54;
        var offset = circumference - (o.dangerPct / 100) * circumference;
        html += '<svg width="140" height="140" viewBox="0 0 120 120" class="mx-auto d-block mb-2">';
        html += '<circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" stroke-width="10"/>';
        html += '<circle cx="60" cy="60" r="54" fill="none" stroke="' + o.color + '" stroke-width="10" ';
        html += 'stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '" ';
        html += 'stroke-linecap="round" transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 1s ease"/>';
        html += '<text x="60" y="55" text-anchor="middle" font-size="24" font-weight="bold" fill="' + o.color + '">' + o.dangerPct + '%</text>';
        html += '<text x="60" y="72" text-anchor="middle" font-size="11" fill="#6b7280">' + o.label + '</text>';
        html += '</svg>';

        html += '<div class="text-muted small">تم الإجابة على ' + o.totalAnswered + ' من ' + o.totalQuestions + ' سؤال (' + o.completionPct + '%)</div>';
        html += '</div></div>';

        // ── ملخص المستويات الثلاثة ──
        html += '<div class="row g-2 mb-3">';
        [1, 2, 3].forEach(function (t) {
            var tier = tiers[t];
            var info = TIERS[t];
            var failPct = tier.total > 0 ? Math.round((tier.failing / tier.total) * 100) : 0;
            html += '<div class="col-4">';
            html += '<div class="card border-0 h-100" style="background:' + info.bg + '">';
            html += '<div class="card-body text-center p-2">';
            html += '<div style="font-size:1.4rem">' + info.icon + '</div>';
            html += '<div class="fw-bold small" style="color:' + info.color + '">' + info.label + '</div>';
            html += '<div class="mt-1">';
            if (tier.failing > 0) {
                html += '<span class="badge" style="background:' + info.color + ';color:#fff">' + tier.failing + ' مخالف</span>';
            } else if (tier.total > 0) {
                html += '<span class="badge bg-success">✓ ملتزم</span>';
            } else {
                html += '<span class="badge bg-secondary">—</span>';
            }
            html += '</div>';
            html += '<div class="text-muted mt-1" style="font-size:0.7rem">' + tier.passing + '/' + tier.total + ' ناجح</div>';
            html += '</div></div></div>';
        });
        html += '</div>';

        // ── أخطر المحاور ──
        if (report.axes.length > 0) {
            html += '<div class="card border-0 shadow-sm mb-3"><div class="card-body p-3">';
            html += '<h6 class="mb-2"><i class="bi bi-bar-chart-fill text-danger me-1"></i> المحاور حسب الخطورة</h6>';
            report.axes.forEach(function (ax) {
                var axName = (CDC.CORE_QUESTIONS.concat(
                    CDC.CONTEXTUAL_QUESTIONS_BY_ACTIVITY.industrial || [],
                    CDC.CONTEXTUAL_QUESTIONS_BY_ACTIVITY.commercial || [],
                    CDC.CONTEXTUAL_QUESTIONS_BY_ACTIVITY.service || []
                ).find(function (q) { return q.axis === ax.id; }) || {}).axis || ax.id;
                // Get display name from categories
                var zoneColor = DANGER_ZONES[ax.zone] ? DANGER_ZONES[ax.zone].color : '#6b7280';
                html += '<div class="d-flex align-items-center mb-2">';
                html += '<div class="text-truncate me-2" style="width:140px;font-size:0.8rem">' + ax.id + '</div>';
                html += '<div class="flex-grow-1 me-2">';
                html += '<div class="progress" style="height:8px"><div class="progress-bar" style="width:' + ax.dangerPct + '%;background:' + zoneColor + '"></div></div>';
                html += '</div>';
                html += '<div style="width:40px;font-size:0.75rem;color:' + zoneColor + '" class="text-end fw-bold">' + ax.dangerPct + '%</div>';
                if (ax.tier1Failing > 0) html += '<span class="badge bg-danger ms-1" style="font-size:0.65rem">' + ax.tier1Failing + ' حرج</span>';
                html += '</div>';
            });
            html += '</div></div>';
        }

        // ── أولويات العمل العاجلة ──
        if (report.priorityActions.length > 0) {
            html += '<div class="card border-0 shadow-sm mb-3 border-start border-danger border-3"><div class="card-body p-3">';
            html += '<h6 class="text-danger mb-2"><i class="bi bi-exclamation-triangle-fill me-1"></i> أولويات عاجلة (' + report.priorityActions.length + ')</h6>';
            report.priorityActions.forEach(function (item, i) {
                var tierInfo = TIERS[item.tier];
                html += '<div class="d-flex align-items-start mb-2 p-2 rounded" style="background:' + tierInfo.bg + ';border-right:3px solid ' + tierInfo.color + '">';
                html += '<span class="me-2" style="font-size:0.85rem">' + tierInfo.icon + '</span>';
                html += '<div class="flex-grow-1">';
                html += '<div style="font-size:0.8rem;font-weight:600">' + item.q + '</div>';
                html += '<div class="text-muted" style="font-size:0.7rem">';
                if (item.pct !== null) html += 'الحالي: <strong style="color:' + tierInfo.color + '">' + item.pct + '%</strong> — المطلوب: ' + item.minPct + '%+ ';
                html += '| ' + item.penalty;
                html += '</div>';
                html += '</div></div>';
            });
            html += '</div></div>';
        }

        // ── تنبيهات أصفر ──
        if (report.warnings.length > 0) {
            html += '<div class="card border-0 shadow-sm mb-3 border-start border-warning border-3"><div class="card-body p-3">';
            html += '<h6 class="text-warning mb-2"><i class="bi bi-info-circle-fill me-1"></i> تحتاج تحسين (' + report.warnings.length + ')</h6>';
            report.warnings.forEach(function (item) {
                html += '<div class="small mb-1">🟡 ' + item.q;
                if (item.pct !== null) html += ' <span class="text-muted">(' + item.pct + '% — المطلوب ' + item.warnPct + '%)</span>';
                html += '</div>';
            });
            html += '</div></div>';
        }

        return html;
    }

    /**
     * حفظ التقرير في localStorage
     */
    function saveReport(report) {
        if (report) {
            try {
                localStorage.setItem('stratix_compliance_danger_report', JSON.stringify(report));
            } catch (e) { /* ignore */ }
        }
    }

    function loadReport() {
        try {
            var raw = localStorage.getItem('stratix_compliance_danger_report');
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    // ── PUBLIC API ──
    return {
        DANGER_ZONES: DANGER_ZONES,
        calculateDangerReport: calculateDangerReport,
        evaluateQuestion: evaluateQuestion,
        answerToPct: answerToPct,
        renderDangerSummary: renderDangerSummary,
        saveReport: saveReport,
        loadReport: loadReport
    };

})();
