/**
 * ═══════════════════════════════════════════════════════════════
 * Strategic Scoring Engine — محرك التقييم الاستراتيجي
 * ═══════════════════════════════════════════════════════════════
 * يحسب درجات الجاهزية لكل أداة ويربطها بالأدوات اللاحقة
 * يُستخدم في: SWOT, TOWS, Objectives, OKRs
 */

window.StratScore = (function () {
    'use strict';

    // ═══ ثوابت التقييم ═══
    const QUAD_TARGET = { min: 3, ideal: 5, max: 7 };
    const OBJ_TARGET = { min: 2, ideal: 3, max: 5 };

    // ═══ تصنيف الأهداف حسب الأثر والصعوبة ═══
    const OBJ_CLASSES = {
        quickWin:  { id: 'quick-win',  label: 'مكسب سريع',       icon: 'bi-lightning-charge-fill', color: '#22c55e', desc: 'أثر عالي + سهل التنفيذ — ابدأ فوراً' },
        strategic: { id: 'strategic',  label: 'مشروع استراتيجي',  icon: 'bi-trophy-fill',          color: '#6366f1', desc: 'أثر عالي + صعب — خطط بعناية وامنحه موارد' },
        routine:   { id: 'routine',    label: 'مهمة روتينية',     icon: 'bi-check2-circle',        color: '#94a3b8', desc: 'أثر منخفض + سهل — أنجزها بين المهام' },
        tough:     { id: 'tough',      label: 'مهمة شاقة',        icon: 'bi-exclamation-triangle', color: '#f97316', desc: 'أثر منخفض + صعب — أعد النظر في جدواها' }
    };

    // ═══════════════════════════════════════════
    //  1) SWOT Readiness Score — مقياس جاهزية SWOT
    // ═══════════════════════════════════════════
    function calcSwotScore(quadCounts) {
        // quadCounts = { strengths: N, weaknesses: N, opportunities: N, threats: N }
        let totalScore = 0;
        let maxScore = 0;
        const details = {};

        Object.entries(quadCounts).forEach(([quad, count]) => {
            maxScore += 100;
            let qScore = 0;

            if (count === 0) {
                qScore = 0; // فارغ
            } else if (count >= QUAD_TARGET.min && count <= QUAD_TARGET.ideal) {
                qScore = 100; // مثالي
            } else if (count < QUAD_TARGET.min) {
                qScore = Math.round((count / QUAD_TARGET.min) * 70); // ناقص
            } else if (count <= QUAD_TARGET.max) {
                qScore = 85; // مقبول لكن كثير
            } else {
                qScore = Math.max(50, 85 - (count - QUAD_TARGET.max) * 10); // مبالغ فيه
            }

            totalScore += qScore;
            details[quad] = { count, score: qScore, status: getQuadStatus(count) };
        });

        // مكافأة التوازن (balance bonus)
        const counts = Object.values(quadCounts);
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        const variance = counts.reduce((s, c) => s + Math.pow(c - avg, 2), 0) / counts.length;
        const balanceBonus = variance < 2 ? 10 : variance < 5 ? 5 : 0;

        const overall = Math.min(100, Math.round((totalScore / maxScore) * 100) + balanceBonus);

        return {
            overall,
            details,
            balanceBonus,
            label: getScoreLabel(overall),
            color: getScoreColor(overall)
        };
    }

    function getQuadStatus(count) {
        if (count === 0) return { label: 'فارغ', color: '#ef4444', icon: 'bi-x-circle' };
        if (count < QUAD_TARGET.min) return { label: 'ناقص', color: '#f97316', icon: 'bi-dash-circle' };
        if (count <= QUAD_TARGET.ideal) return { label: 'مثالي', color: '#22c55e', icon: 'bi-check-circle-fill' };
        if (count <= QUAD_TARGET.max) return { label: 'جيد', color: '#eab308', icon: 'bi-check-circle' };
        return { label: 'مبالغ', color: '#f97316', icon: 'bi-exclamation-circle' };
    }

    function getScoreLabel(score) {
        if (score >= 85) return 'ممتاز';
        if (score >= 70) return 'جيد';
        if (score >= 50) return 'مقبول';
        if (score >= 25) return 'ضعيف';
        return 'غير مكتمل';
    }

    function getScoreColor(score) {
        if (score >= 85) return '#22c55e';
        if (score >= 70) return '#10b981';
        if (score >= 50) return '#eab308';
        if (score >= 25) return '#f97316';
        return '#ef4444';
    }

    // ═══════════════════════════════════════════
    //  2) Objective Classification — تصنيف الأهداف
    // ═══════════════════════════════════════════
    function classifyObjective(impact, difficulty) {
        // impact: 1-5, difficulty: 1-5
        const highImpact = impact >= 4;
        const highDifficulty = difficulty >= 4;

        if (highImpact && !highDifficulty) return OBJ_CLASSES.quickWin;
        if (highImpact && highDifficulty) return OBJ_CLASSES.strategic;
        if (!highImpact && !highDifficulty) return OBJ_CLASSES.routine;
        return OBJ_CLASSES.tough;
    }

    // حساب الوزن المقترح بناءً على التصنيف والأثر
    function suggestWeight(impact, difficulty, totalObjectives) {
        const base = Math.round(100 / Math.max(totalObjectives, 1));
        const cls = classifyObjective(impact, difficulty);
        if (cls.id === 'quick-win') return Math.min(25, base + 5);
        if (cls.id === 'strategic') return Math.min(30, base + 10);
        if (cls.id === 'routine') return Math.max(5, base - 5);
        if (cls.id === 'tough') return Math.max(5, base - 3);
        return base;
    }

    // ═══════════════════════════════════════════
    //  3) Upstream Score Reader — قراءة درجات المراحل السابقة
    // ═══════════════════════════════════════════
    function getUpstreamScores(dept) {
        const scores = {};
        try {
            // SWOT
            const swotData = safeParse(`stratix_swot_${dept}`);
            if (swotData?._strategicScore) {
                scores.swot = swotData._strategicScore;
            } else if (swotData) {
                const counts = {};
                ['strengths', 'weaknesses', 'opportunities', 'threats'].forEach(q => {
                    const val = (swotData[q] || '').trim();
                    counts[q] = val ? val.split('\n').filter(l => l.trim().length > 2).length : 0;
                });
                scores.swot = calcSwotScore(counts);
            }

            // TOWS
            const towsData = safeParse(`stratix_tows_${dept}`);
            if (towsData) scores.tows = { filled: true };

            // Directions
            const dirData = safeParse(`stratix_directions_${dept}`);
            if (dirData) scores.directions = { filled: true };

        } catch (e) { console.warn('[StratScore] upstream read error', e); }
        return scores;
    }

    // تقييم مدى قوة الأساس الاستراتيجي
    function getFoundationStrength(dept) {
        const up = getUpstreamScores(dept);
        let strength = 0;
        let maxStrength = 0;

        // SWOT = 40% من القاعدة
        maxStrength += 40;
        if (up.swot) strength += Math.round(up.swot.overall * 0.4);

        // TOWS = 30%
        maxStrength += 30;
        if (up.tows?.filled) strength += 30;

        // Directions = 30%
        maxStrength += 30;
        if (up.directions?.filled) strength += 30;

        const pct = Math.round((strength / maxStrength) * 100);
        return {
            score: pct,
            label: getScoreLabel(pct),
            color: getScoreColor(pct),
            details: up
        };
    }

    // ═══════════════════════════════════════════
    //  4) Objectives Summary — ملخص تصنيف الأهداف
    // ═══════════════════════════════════════════
    function summarizeObjectives(objectives) {
        const summary = { quickWin: 0, strategic: 0, routine: 0, tough: 0, unclassified: 0, total: objectives.length };
        const avgImpact = { sum: 0, count: 0 };
        const avgDifficulty = { sum: 0, count: 0 };

        objectives.forEach(obj => {
            if (obj.impact && obj.difficulty) {
                const cls = classifyObjective(obj.impact, obj.difficulty);
                if (cls.id === 'quick-win') summary.quickWin++;
                else if (cls.id === 'strategic') summary.strategic++;
                else if (cls.id === 'routine') summary.routine++;
                else if (cls.id === 'tough') summary.tough++;
                avgImpact.sum += obj.impact;
                avgImpact.count++;
                avgDifficulty.sum += obj.difficulty;
                avgDifficulty.count++;
            } else {
                summary.unclassified++;
            }
        });

        summary.avgImpact = avgImpact.count > 0 ? (avgImpact.sum / avgImpact.count).toFixed(1) : 0;
        summary.avgDifficulty = avgDifficulty.count > 0 ? (avgDifficulty.sum / avgDifficulty.count).toFixed(1) : 0;

        // تقييم الخلطة الاستراتيجية
        summary.mixAdvice = getMixAdvice(summary);
        return summary;
    }

    function getMixAdvice(summary) {
        if (summary.total === 0) return { text: 'لم تُضف أهداف بعد', color: '#64748b' };
        if (summary.unclassified > summary.total * 0.5)
            return { text: 'صنّف أهدافك (أثر × صعوبة) للحصول على توصيات', color: '#f97316' };
        if (summary.tough > summary.strategic)
            return { text: 'لديك مهام شاقة أكثر من المشاريع الاستراتيجية — أعد ترتيب الأولويات', color: '#ef4444' };
        if (summary.quickWin === 0 && summary.total > 2)
            return { text: 'أضف مكسب سريع واحد على الأقل لتحقيق زخم مبكر', color: '#f97316' };
        if (summary.strategic === 0 && summary.total > 3)
            return { text: 'لا يوجد مشروع استراتيجي — أضف هدفاً طموحاً عالي الأثر', color: '#eab308' };
        if (summary.quickWin >= 1 && summary.strategic >= 1)
            return { text: 'خلطة متوازنة — مكاسب سريعة مع مشاريع استراتيجية', color: '#22c55e' };
        return { text: 'استمر في إضافة الأهداف وتصنيفها', color: '#94a3b8' };
    }

    // ═══ أدوات مساعدة ═══
    function safeParse(key) {
        try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
        catch { return null; }
    }

    // ═══ Public API ═══
    return {
        calcSwotScore,
        classifyObjective,
        suggestWeight,
        getUpstreamScores,
        getFoundationStrength,
        summarizeObjectives,
        OBJ_CLASSES,
        QUAD_TARGET,
        OBJ_TARGET
    };
})();
