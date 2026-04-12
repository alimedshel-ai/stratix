/**
 * Stratix Synthesis Engine
 * Responsible for Level 3 "Strategic Integrity" logic.
 * Analyzes cross-tool alignment and detects gaps.
 */
const SynthesisEngine = {
    async analyzeAlignment(dept) {
        const d = dept.toUpperCase();
        try {
            // Load all relevant strategic assets
            const [swot, tows, directions, objectives, kpis, initiatives] = await Promise.all([
                window.DeptPage.loadFromAPI('SWOT_' + d),
                window.DeptPage.loadFromAPI('TOWS_' + d),
                window.DeptPage.loadFromAPI('DIRECTIONS_' + d),
                window.DeptPage.loadFromAPI('OBJECTIVES_' + d),
                window.DeptPage.loadFromAPI('KPIS_' + d),
                window.DeptPage.loadFromAPI('INITIATIVES_' + d)
            ]);

            const analysis = {
                score: 0,
                gaps: [],
                strengths: [],
                stats: {
                    objectives: (objectives || []).length,
                    kpis: (kpis || []).length,
                    initiatives: (initiatives || []).length
                }
            };

            // 1. Coverage Check (BSC Perspectives)
            const perspectives = ['financial', 'customer', 'internal', 'learning'];
            const covered = new Set((objectives || []).map(o => o.perspective));
            const missing = perspectives.filter(p => !covered.has(p));

            if (missing.length === 0) {
                analysis.strengths.push("تغطية شاملة لجميع مناظير بطاقة الأداء المتوازن (BSC).");
                analysis.score += 25;
            } else {
                analysis.gaps.push({
                    severity: 'medium',
                    text: `فجوة في المناظير: تفتقر الخطة لأهداف في ${missing.length} مناظير (${missing.join(', ')}).`
                });
            }

            // 2. Execution Chain Check (Objectives -> Initiatives)
            const objTitles = (objectives || []).map(o => o.title);
            const initParents = new Set((initiatives || []).map(i => i.parent));
            const isolatedObjectives = objTitles.filter(title => !initParents.has(title));

            if (isolatedObjectives.length === 0 && objTitles.length > 0) {
                analysis.strengths.push("سلسلة تنفيذ مكتملة: جميع الأهداف الاستراتيجية مدعومة بمبادرات تنفيذية.");
                analysis.score += 25;
            } else if (objTitles.length > 0) {
                analysis.gaps.push({
                    severity: 'high',
                    text: `أهداف معزولة: يوجد ${isolatedObjectives.length} أهداف استراتيجية بدون مبادرات تدعم تحقيقها.`
                });
            }

            // 3. Measurement Check (Objectives -> KPIs)
            const kpiParents = new Set((kpis || []).map(k => k.parent));
            const unmeasuredObjectives = objTitles.filter(title => !kpiParents.has(title));

            if (unmeasuredObjectives.length === 0 && objTitles.length > 0) {
                analysis.strengths.push("دقة القياس: جميع الأهداف مرتبطة بمؤشرات أداء رقمية (KPIs).");
                analysis.score += 25;
            } else if (objTitles.length > 0) {
                analysis.gaps.push({
                    severity: 'medium',
                    text: `فجوة قياس: يوجد ${unmeasuredObjectives.length} أهداف لا تملك مؤشرات أداء دقيقة لمراقبتها.`
                });
            }

            // 4. Strategic Consistency (TOWS -> Directions)
            // If TOWS says "Aggressive" but Mission is too passive.
            if (tows && tows.strategies && directions) {
                const topStrat = Object.entries(tows.strategies)
                    .sort(([, a], [, b]) => (b?.length || 0) - (a?.length || 0))[0][0];

                analysis.strengths.push(`التزام بالتموضع: الخطة تتبع استراتيجية ${topStrat === 'SO' ? 'هجومية' : topStrat === 'ST' ? 'تنافسية' : 'علاجية'} متسقة مع تحليل SWOT.`);
                analysis.score += 25;
            }

            // Final score cap
            analysis.score = Math.min(100, analysis.score);
            if (objTitles.length === 0) analysis.score = 0;

            return analysis;
        } catch (e) {
            console.error('[SynthesisEngine] Analysis failed', e);
            return null;
        }
    },

    renderSynthesisModal(analysis) {
        if (!analysis) return;

        const modalId = 'synthesisModal';
        let modal = document.getElementById(modalId);
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
                                <div class="integrity-score" style="font-size: 3.5rem; font-weight: 900; color: ${this.getScoreColor(analysis.score)}">${analysis.score}%</div>
                                <div class="text-muted fw-800">مؤشر جودة التخطيط والارتباط</div>
                            </div>
                            
                            <div class="row g-4">
                                <div class="col-md-6">
                                    <h6 class="fw-900 text-success mb-3"><i class="bi bi-patch-check-fill"></i> نقاط القوة</h6>
                                    <div class="strength-list">
                                        ${analysis.strengths.map(s => `<div class="mb-2 small"><i class="bi bi-check2 text-success me-2"></i> ${s}</div>`).join('')}
                                        ${analysis.strengths.length === 0 ? '<div class="text-muted small">لا توجد نقاط قوة مكتملة حالياً</div>' : ''}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="fw-900 text-warning mb-3"><i class="bi bi-exclamation-triangle-fill"></i> فجوات الارتباط</h6>
                                    <div class="gap-list">
                                        ${analysis.gaps.map(g => `
                                            <div class="p-2 rounded-3 mb-2 small" style="background: rgba(245, 158, 11, 0.05); border-right: 3px solid ${g.severity === 'high' ? '#ef4444' : '#f59e0b'}">
                                                ${g.text}
                                            </div>
                                        `).join('')}
                                        ${analysis.gaps.length === 0 ? '<div class="text-muted small">تم حل جميع فجوات الارتباط المكتشفة!</div>' : ''}
                                    </div>
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
            // Update existing modal content
            modal.querySelector('.integrity-score').textContent = analysis.score + '%';
            modal.querySelector('.integrity-score').style.color = this.getScoreColor(analysis.score);
            modal.querySelector('.strength-list').innerHTML = analysis.strengths.map(s => `<div class="mb-2 small"><i class="bi bi-check2 text-success me-2"></i> ${s}</div>`).join('') || '<div class="text-muted small">لا توجد نقاط قوة مكتملة حالياً</div>';
            modal.querySelector('.gap-list').innerHTML = analysis.gaps.map(g => `<div class="p-2 rounded-3 mb-2 small" style="background: rgba(245, 158, 11, 0.05); border-right: 3px solid ${g.severity === 'high' ? '#ef4444' : '#f59e0b'}">${g.text}</div>`).join('') || '<div class="text-muted small">تم حل جميع فجوات الارتباط المكتشفة!</div>';
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
