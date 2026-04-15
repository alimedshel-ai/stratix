/**
 * Stratix Synthesis Engine v2.0
 * ═══════════════════════════════════════════════════════════
 * Responsible for Level 3 "Strategic Integrity" logic.
 * Analyzes cross-tool alignment and detects gaps.
 *
 * v2.0 changes:
 *  - Fetches from BOTH DeptPage (local) AND real API endpoints
 *  - KPIs: uses objectiveId from API + parent from local
 *  - Initiatives: fuzzy title matching + parent field
 *  - Merged + deduped data for accurate analysis
 * ═══════════════════════════════════════════════════════════
 */
const SynthesisEngine = {

    /**
     * Fuzzy match: does text B relate to text A?
     * Checks: exact match, contains, or 50%+ keyword overlap
     */
    _fuzzyMatch(objTitle, itemParentOrTitle) {
        if (!objTitle || !itemParentOrTitle) return false;
        const a = objTitle.trim();
        const b = itemParentOrTitle.trim();
        if (a === b) return true;
        if (a.includes(b) || b.includes(a)) return true;

        // Keyword overlap — split by spaces, check 50%+ match
        const wordsA = a.split(/\s+/).filter(w => w.length > 2);
        const wordsB = b.split(/\s+/).filter(w => w.length > 2);
        if (wordsA.length === 0) return false;
        const matches = wordsA.filter(w => wordsB.some(wb => wb.includes(w) || w.includes(wb)));
        return matches.length >= Math.ceil(wordsA.length * 0.5);
    },

    /**
     * Safe API fetch — returns null on failure
     */
    async _apiGet(url) {
        try {
            if (window.api && window.api.get) return await window.api.get(url);
            const token = localStorage.getItem('token');
            const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
            if (!res.ok) return null;
            return await res.json();
        } catch { return null; }
    },

    async analyzeAlignment(dept) {
        const d = dept.toUpperCase();
        const entityId = localStorage.getItem('entityId') || '';

        try {
            // ═══ 1. Load from BOTH sources in parallel ═══
            const [
                localSwot, localTows, localDirections, localObjectives, localKpis, localInitiatives,
                apiKpisRes, apiInitiativesRes, apiObjectivesRes
            ] = await Promise.all([
                window.DeptPage ? DeptPage.loadFromAPI('SWOT_' + d).catch(() => null) : null,
                window.DeptPage ? DeptPage.loadFromAPI('TOWS_' + d).catch(() => null) : null,
                window.DeptPage ? DeptPage.loadFromAPI('DIRECTIONS_' + d).catch(() => null) : null,
                window.DeptPage ? DeptPage.loadFromAPI('OBJECTIVES_' + d).catch(() => null) : null,
                window.DeptPage ? DeptPage.loadFromAPI('KPIS_' + d).catch(() => null) : null,
                window.DeptPage ? DeptPage.loadFromAPI('INITIATIVES_' + d).catch(() => null) : null,
                this._apiGet(`/api/kpis?entityId=${entityId}`),
                this._apiGet(`/api/initiatives/${dept}`),
                this._apiGet(`/api/dept/analysis?dept=${dept}&type=OBJECTIVES_${d}`)
            ]);

            // ═══ 2. Merge data — API is truth, local is supplement ═══
            const swot = localSwot || {};
            const tows = localTows || {};
            const directions = localDirections || {};

            // Objectives: prefer local DeptPage (user-created), supplement with API
            const localObjs = Array.isArray(localObjectives) ? localObjectives : [];
            const apiObjs = Array.isArray(apiObjectivesRes?.data) ? apiObjectivesRes.data : [];
            const objectives = this._mergeByTitle(localObjs, apiObjs);

            // KPIs: merge local + API (API has objectiveId!)
            const localKpiArr = Array.isArray(localKpis) ? localKpis : [];
            const apiKpiArr = Array.isArray(apiKpisRes?.kpis) ? apiKpisRes.kpis : (Array.isArray(apiKpisRes) ? apiKpisRes : []);
            const kpis = this._mergeByField(localKpiArr, apiKpiArr, 'name');

            // Initiatives: merge local + API
            const localInitArr = Array.isArray(localInitiatives) ? localInitiatives : [];
            const apiInitArr = (() => {
                const r = apiInitiativesRes;
                if (Array.isArray(r)) return r;
                if (r?.initiatives) return r.initiatives;
                return [];
            })();
            const initiatives = this._mergeByTitle(localInitArr, apiInitArr);

            // ═══ 3. Analysis ═══
            const analysis = {
                score: 0,
                gaps: [],
                strengths: [],
                stats: {
                    objectives: objectives.length,
                    kpis: kpis.length,
                    initiatives: initiatives.length
                }
            };

            const objTitles = objectives.map(o => o.title || o.name || '').filter(Boolean);

            // ── Check 1: BSC Perspective Coverage ──
            const perspectives = ['financial', 'customer', 'internal', 'learning'];
            const covered = new Set(objectives.map(o => (o.perspective || '').toLowerCase()));
            const missing = perspectives.filter(p => !covered.has(p));

            if (missing.length === 0 && objectives.length > 0) {
                analysis.strengths.push('تغطية شاملة لجميع مناظير بطاقة الأداء المتوازن (BSC).');
                analysis.score += 25;
            } else if (objectives.length > 0) {
                const persLabels = { financial: 'المالي', customer: 'العملاء', internal: 'العمليات الداخلية', learning: 'النمو والتعلم' };
                const missingAr = missing.map(p => persLabels[p] || p);
                analysis.gaps.push({
                    severity: 'medium',
                    text: `فجوة في المناظير: تفتقر الخطة لأهداف في منظور ${missingAr.join(' و ')}.`
                });
            }

            // ── Check 2: Execution Chain (Objectives → Initiatives) ──
            // Match by: initiative.parent === obj.title OR fuzzy title match
            const linkedObjsByInit = new Set();
            for (const init of initiatives) {
                const initTitle = init.title || init.name || '';
                const initParent = init.parent || '';
                for (const objTitle of objTitles) {
                    if (this._fuzzyMatch(objTitle, initParent) || this._fuzzyMatch(objTitle, initTitle)) {
                        linkedObjsByInit.add(objTitle);
                    }
                }
            }
            // If there are any initiatives at all, give partial credit
            const isolatedFromInit = objTitles.filter(t => !linkedObjsByInit.has(t));

            if (isolatedFromInit.length === 0 && objTitles.length > 0) {
                analysis.strengths.push('سلسلة تنفيذ مكتملة: جميع الأهداف مدعومة بمبادرات تنفيذية.');
                analysis.score += 25;
            } else if (objTitles.length > 0 && initiatives.length > 0) {
                // Partial credit: some objectives are linked
                const linked = objTitles.length - isolatedFromInit.length;
                const ratio = linked / objTitles.length;
                const partialScore = Math.round(25 * ratio);
                analysis.score += partialScore;

                if (isolatedFromInit.length > 0) {
                    analysis.gaps.push({
                        severity: isolatedFromInit.length > objTitles.length * 0.5 ? 'high' : 'medium',
                        text: `أهداف بدون مبادرات: ${isolatedFromInit.length} من ${objTitles.length} هدف لا ترتبط بمبادرات تنفيذية مباشرة.`,
                        details: isolatedFromInit.slice(0, 5)
                    });
                }
            } else if (objTitles.length > 0 && initiatives.length === 0) {
                analysis.gaps.push({
                    severity: 'high',
                    text: 'لا توجد مبادرات تنفيذية. جميع الأهداف الاستراتيجية معزولة بدون خطة تنفيذ.'
                });
            }

            // ── Check 3: Measurement (Objectives → KPIs) ──
            // Match by: kpi.objectiveId, kpi.parent, or fuzzy name match
            const linkedObjsByKPI = new Set();

            // Build objective ID → title map from API objectives
            const objIdMap = {};
            for (const obj of objectives) {
                if (obj.id) objIdMap[obj.id] = obj.title || obj.name || '';
            }

            for (const kpi of kpis) {
                // Check objectiveId (from real API)
                if (kpi.objectiveId && objIdMap[kpi.objectiveId]) {
                    linkedObjsByKPI.add(objIdMap[kpi.objectiveId]);
                    continue;
                }
                // Check objective relation (if populated)
                if (kpi.objective?.title) {
                    linkedObjsByKPI.add(kpi.objective.title);
                    continue;
                }
                // Check parent string (from DeptPage)
                const kpiParent = kpi.parent || '';
                const kpiName = kpi.name || kpi.nameAr || '';
                for (const objTitle of objTitles) {
                    if (this._fuzzyMatch(objTitle, kpiParent) || this._fuzzyMatch(objTitle, kpiName)) {
                        linkedObjsByKPI.add(objTitle);
                    }
                }
            }

            const unmeasured = objTitles.filter(t => !linkedObjsByKPI.has(t));

            if (unmeasured.length === 0 && objTitles.length > 0) {
                analysis.strengths.push('دقة القياس: جميع الأهداف مرتبطة بمؤشرات أداء رقمية (KPIs).');
                analysis.score += 25;
            } else if (objTitles.length > 0 && kpis.length > 0) {
                const linked = objTitles.length - unmeasured.length;
                const ratio = linked / objTitles.length;
                const partialScore = Math.round(25 * ratio);
                analysis.score += partialScore;

                if (unmeasured.length > 0) {
                    analysis.gaps.push({
                        severity: unmeasured.length > objTitles.length * 0.5 ? 'high' : 'medium',
                        text: `فجوة قياس: ${unmeasured.length} من ${objTitles.length} هدف بدون مؤشرات أداء مرتبطة.`,
                        details: unmeasured.slice(0, 5)
                    });
                }
            } else if (objTitles.length > 0 && kpis.length === 0) {
                analysis.gaps.push({
                    severity: 'high',
                    text: 'لا توجد مؤشرات أداء (KPIs). لا يمكن قياس تقدم الأهداف الاستراتيجية.'
                });
            }

            // ── Check 4: Strategic Consistency (TOWS → Directions) ──
            const towsStrategies = tows.strategies || tows;
            const hasTowsData = towsStrategies && (towsStrategies.so || towsStrategies.wo || towsStrategies.st || towsStrategies.wt);

            if (hasTowsData && (directions && Object.keys(directions).length > 0)) {
                // Determine dominant strategy
                const stratEntries = ['so', 'wo', 'st', 'wt'].map(k => {
                    const val = towsStrategies[k];
                    const len = Array.isArray(val) ? val.length : (typeof val === 'string' ? val.split('\n').filter(l => l.trim()).length : 0);
                    return [k.toUpperCase(), len];
                }).sort((a, b) => b[1] - a[1]);

                const topStrat = stratEntries[0][0];
                const stratLabels = { SO: 'هجومية', WO: 'تحسينية', ST: 'تنافسية', WT: 'علاجية' };
                analysis.strengths.push(`التزام بالتموضع: الخطة تتبع استراتيجية ${stratLabels[topStrat] || topStrat} متسقة مع تحليل SWOT.`);
                analysis.score += 25;
            } else if (hasTowsData) {
                analysis.score += 10; // Partial: TOWS done but no directions
            }

            // ── Final ──
            analysis.score = Math.min(100, analysis.score);
            if (objTitles.length === 0) {
                analysis.score = 0;
                analysis.gaps = [{
                    severity: 'high',
                    text: 'لا توجد أهداف استراتيجية. ابدأ بتحديد أهدافك لقياس جودة التخطيط.'
                }];
            }

            return analysis;
        } catch (e) {
            console.error('[SynthesisEngine] Analysis failed', e);
            return null;
        }
    },

    /**
     * Merge two arrays by title, preferring source A
     */
    _mergeByTitle(arrA, arrB) {
        const result = [...(arrA || [])];
        const existingTitles = new Set(result.map(x => (x.title || x.name || '').trim().toLowerCase()));
        for (const item of (arrB || [])) {
            const t = (item.title || item.name || '').trim().toLowerCase();
            if (t && !existingTitles.has(t)) {
                result.push(item);
                existingTitles.add(t);
            }
        }
        return result;
    },

    /**
     * Merge two arrays by a specific field, preferring source A
     */
    _mergeByField(arrA, arrB, field) {
        const result = [...(arrA || [])];
        const existing = new Set(result.map(x => (x[field] || '').trim().toLowerCase()));
        for (const item of (arrB || [])) {
            const val = (item[field] || '').trim().toLowerCase();
            if (val && !existing.has(val)) {
                result.push(item);
                existing.add(val);
            }
        }
        return result;
    },

    renderSynthesisModal(analysis) {
        if (!analysis) return;

        const modalId = 'synthesisModal';
        let modal = document.getElementById(modalId);

        const scoreColor = this.getScoreColor(analysis.score);
        const strengthsHTML = analysis.strengths.length > 0
            ? analysis.strengths.map(s => `<div class="mb-2 small"><i class="bi bi-check2 text-success me-2"></i> ${s}</div>`).join('')
            : '<div class="text-muted small">لا توجد نقاط قوة مكتملة حالياً</div>';

        const gapsHTML = analysis.gaps.length > 0
            ? analysis.gaps.map(g => {
                const borderColor = g.severity === 'high' ? '#ef4444' : '#f59e0b';
                const detailsHTML = g.details && g.details.length > 0
                    ? `<div class="mt-1 opacity-50" style="font-size:0.75rem">${g.details.map(d => '· ' + d).join('<br>')}</div>`
                    : '';
                return `<div class="p-2 rounded-3 mb-2 small" style="background: rgba(245,158,11,0.05); border-right: 3px solid ${borderColor}">
                    ${g.text}${detailsHTML}
                </div>`;
            }).join('')
            : '<div class="text-muted small">تم حل جميع فجوات الارتباط المكتشفة! 🎉</div>';

        const statsHTML = `
            <div class="d-flex justify-content-center gap-4 mb-3 small opacity-50">
                <span><i class="bi bi-bullseye me-1"></i> ${analysis.stats.objectives} أهداف</span>
                <span><i class="bi bi-speedometer2 me-1"></i> ${analysis.stats.kpis} مؤشرات</span>
                <span><i class="bi bi-rocket-takeoff me-1"></i> ${analysis.stats.initiatives} مبادرات</span>
            </div>
        `;

        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content text-white" style="background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;">
                        <div class="modal-header border-0">
                            <h5 class="modal-title fw-900">تقرير التناغم الاستراتيجي (AI Synthesis)</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="text-center mb-4">
                                <div class="integrity-score" style="font-size: 3.5rem; font-weight: 900; color: ${scoreColor}">${analysis.score}%</div>
                                <div class="text-muted fw-800">مؤشر جودة التخطيط والارتباط</div>
                                ${statsHTML}
                            </div>

                            <div class="row g-4">
                                <div class="col-md-6">
                                    <h6 class="fw-900 text-success mb-3"><i class="bi bi-patch-check-fill"></i> نقاط القوة</h6>
                                    <div class="strength-list">${strengthsHTML}</div>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="fw-900 text-warning mb-3"><i class="bi bi-exclamation-triangle-fill"></i> فجوات الارتباط</h6>
                                    <div class="gap-list">${gapsHTML}</div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-primary rounded-pill px-4 fw-800" data-bs-dismiss="modal">فهمت، سأقوم بالتحسين</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.querySelector('.integrity-score').textContent = analysis.score + '%';
            modal.querySelector('.integrity-score').style.color = scoreColor;
            modal.querySelector('.strength-list').innerHTML = strengthsHTML;
            modal.querySelector('.gap-list').innerHTML = gapsHTML;
        }

        new bootstrap.Modal(modal).show();
    },

    getScoreColor(score) {
        if (score >= 80) return '#10b981';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    }
};

window.SynthesisEngine = SynthesisEngine;
