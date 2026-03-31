/**
 * Startix Audit Engine v2.3
 * Standardized Intelligence with Explicit Value Mapping.
 */

export const MAX_SCORE = 72;

/**
 * 💡 المرجع الاستراتيجي للقيم (Methodology Reference)
 * Positive (1.0): high, advanced, full, auto, strict, ready, clear, perfect
 * Neutral  (0.5): mid, part, basic, foggy, vague, fuzzy, normal
 * Negative (0.1/0): none, bad, personal, low, manual, fragile, loose, risk, critical
 */

export const AuditEngine = {
    weights: { gov: 30, financial: 30, team: 20, digital: 20 },

    getVal(v, context = 'general') {
        if (!v) return 0;

        // ١. سياق السيولة المالية
        if (context === 'liquidity') {
            const liqMap = { high: 1, mid: 0.6, normal: 0.5, low: 0.1, none: 0, tight: 0 };
            return liqMap[v] !== undefined ? liqMap[v] : 0;
        }

        // ٢. سياق الرقابة والحوكمة
        if (context === 'control') {
            const ctrlMap = { tight: 1, strict: 1, clear: 1, full: 1, advanced: 1, ready: 1, manual: 0, none: 0 };
            return ctrlMap[v] !== undefined ? ctrlMap[v] : 0;
        }
        // ٣. سياق الدوران الوظيفي (Inverse Logic)
        if (context === 'turnover') {
            const turnMap = { high: 0.1, medium: 0.5, low: 1 };
            return turnMap[v] !== undefined ? turnMap[v] : 0.5;
        }

        // ٤. الخارطة العامة (Explicit Mapping)
        const genMap = {
            // Positive
            high: 1, advanced: 1, full: 1, auto: 1, ready: 1, clear: 1, perfect: 1, board: 1, strict: 1,
            // Neutral
            mid: 0.4, part: 0.4, basic: 0.4, foggy: 0.3, vague: 0.3, fuzzy: 0.3, normal: 0.4,
            // Negative
            low: 0.1, manual: 0, fragile: 0, loose: 0.1, personal: 0, none: 0, bad: 0, risk: 0, critical: 0
        };

        return genMap[v] !== undefined ? genMap[v] : 0;
    },

    calculate(ans, category = 'owner') {
        if (!ans || typeof ans !== 'object' || Object.keys(ans).length === 0) {
            return { total: 0, scores: { gov: 0, financial: 0, team: 0, digital: 0 }, reasons: { gov: 'لا توجد بيانات.' }, weights: this.weights, maxScore: MAX_SCORE };
        }

        const scores = { gov: 0, financial: 0, team: 0, digital: 0 };
        const reasons = { gov: '', financial: '', team: '', digital: '' };

        // الحوكمة
        let govBase, govBonus;
        if (category === 'owner') {
            govBase = this.getVal(ans.gov, 'control');
            govBonus = (ans.exit === 'm_a' || ans.exit === 'ipo') ? 1 : 0.1;
        } else {
            const managerGovKey = ans.dept_governance ?? ans.matrix ?? ans.gov;
            govBase = this.getVal(managerGovKey, 'control');
            govBonus = (ans.legal_comp === 'strict') ? 1 : 0.1;
        }
        scores.gov = Math.round(this.weights.gov * (govBase * 0.7 + govBonus * 0.3));
        reasons.gov = (govBase < 0.5) ? 'ضعف الحوكمة يرفع مخاطر الاعتماد الفردي.' : 'هيكل الحوكمة يدعم الشفافية والقابلية للتوسع.';

        // المالية
        const financialDataKey = (category === 'owner') ? ans.fin_quality : (ans.fin_quality ?? ans.ops_quality ?? ans.data);
        let finBase = this.getVal(financialDataKey, 'control');
        let finBonus = this.getVal(ans.cash, 'liquidity');
        scores.financial = Math.round(this.weights.financial * (finBase * 0.6 + finBonus * 0.4));
        reasons.financial = (finBonus < 0.4) ? 'مخاطر عالية في التدفق النقدي والسيولة.' : 'الاستقرار المالي الحالي يدعم النمو المدروس.';

        // الفريق
        let teamBase = (ans.dependency === 'low' || ans.teamSize === 'large' || ans.teamSize === 'medium') ? 1 : 0.1;
        let teamBonus = this.getVal(ans.turnover, 'turnover');
        scores.team = Math.round(this.weights.team * (teamBase * 0.6 + teamBonus * 0.4));
        reasons.team = (teamBonus < 0.4) ? 'عدم استقرار الفريق يهدر المعرفة المؤسسية.' : 'توازن الفريق يضمن استدامة العمليات.';

        // الرقمية
        let digBase = this.getVal(ans.digital, 'general');
        let digBonus = (ans.digital_niche === 'full' || ans.pipeline === 'clear' || ans.warehouse === 'auto') ? 1 : 0.1;
        scores.digital = Math.round(this.weights.digital * (digBase * 0.6 + digBonus * 0.4));
        reasons.digital = (digBase < 0.4) ? 'الفجوة التقنية تسبب هدراً في الوقت التشغيلي.' : 'النضج الرقمي الحالى يرفع من كفاءة المنشأة.';

        const total = Math.min(MAX_SCORE, scores.gov + scores.financial + scores.team + scores.digital);
        return { total, scores, reasons, weights: this.weights, maxScore: MAX_SCORE };
    }
};