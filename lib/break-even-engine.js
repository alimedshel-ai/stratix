/**
 * 📊 Break-Even Engine — محرك حساب نقطة التعادل
 * يعمل مع أي قطاع عبر معادلات SectorConfig الديناميكية
 */

/**
 * Safe math expression evaluator — بديل آمن لـ eval()
 * يدعم: + - * / () وأرقام فقط
 */
function safeMathEval(expression) {
    // Remove whitespace
    const cleaned = expression.replace(/\s+/g, '');

    // Validate: only allow numbers, operators, parentheses, and decimal points
    if (!/^[\d\+\-\*\/\(\)\.]+$/.test(cleaned)) {
        throw new Error(`Invalid math expression: ${expression}`);
    }

    // Use Function constructor instead of eval for slight safety improvement
    try {
        const result = new Function(`return (${cleaned})`)();
        if (typeof result !== 'number' || !isFinite(result)) {
            return null;
        }
        return result;
    } catch (e) {
        return null;
    }
}

/**
 * حساب نقطة التعادل
 * @param {Object} formulas - المعادلات من SectorConfig (key: formula string)
 * @param {Object} answers  - إجابات المستخدم (key: value)
 * @returns {Object} - النتائج المحسوبة
 */
function calculateBreakEven(formulas, answers) {
    if (!formulas || !answers) {
        return { error: 'البيانات أو المعادلات غير متوفرة', success: false };
    }

    const results = {};
    const errors = [];

    // Parse formulas if string
    const formulaObj = typeof formulas === 'string' ? JSON.parse(formulas) : formulas;

    // Parse all answer values to numbers
    const values = {};
    for (const [key, val] of Object.entries(answers)) {
        const num = parseFloat(val);
        values[key] = isNaN(num) ? 0 : num;
    }

    // Calculate each formula in order (order matters — later formulas can reference earlier results)
    for (const [key, formula] of Object.entries(formulaObj)) {
        try {
            let expression = formula;

            // Replace variable names with their values (answers first, then calculated results)
            // Sort by length descending to avoid partial replacements
            const allVars = { ...values, ...results };
            const sortedKeys = Object.keys(allVars).sort((a, b) => b.length - a.length);

            for (const varName of sortedKeys) {
                const varValue = allVars[varName];
                if (varValue !== null && varValue !== undefined) {
                    // Use word boundary replacement to avoid partial matches
                    expression = expression.replace(new RegExp(`\\b${varName}\\b`, 'g'), String(varValue));
                }
            }

            const result = safeMathEval(expression);
            results[key] = result !== null ? Math.round(result * 100) / 100 : null;

            if (result === null) {
                errors.push({ formula: key, expression, error: 'حساب غير صالح' });
            }
        } catch (e) {
            results[key] = null;
            errors.push({ formula: key, error: e.message });
        }
    }

    return {
        success: errors.length === 0,
        results,
        errors: errors.length > 0 ? errors : undefined,
    };
}

/**
 * توليد التوصيات بناءً على نتائج Break-Even
 */
function generateInsights(results, benchmarks, sectorConfig) {
    const insights = [];
    const parsedBenchmarks = typeof benchmarks === 'string' ? JSON.parse(benchmarks) : (benchmarks || {});

    // 1. Safety margin analysis
    if (results.safetyMargin !== null && results.safetyMargin !== undefined) {
        if (results.safetyMargin < 0) {
            insights.push({
                type: 'CRITICAL',
                icon: '🔴',
                title: 'تحت نقطة التعادل!',
                description: `إيراداتك الحالية أقل من نقطة التعادل بنسبة ${Math.abs(results.safetyMargin).toFixed(1)}%. الشركة تخسر حالياً.`,
                action: 'يجب زيادة الإيرادات أو تخفيض المصاريف الثابتة فوراً.'
            });
        } else if (results.safetyMargin < 15) {
            insights.push({
                type: 'WARNING',
                icon: '🟡',
                title: 'هامش أمان منخفض',
                description: `هامش الأمان ${results.safetyMargin.toFixed(1)}% فقط. أي انخفاض بسيط في المبيعات قد يؤدي لخسائر.`,
                action: 'تنويع مصادر الإيرادات وبناء احتياطي مالي.'
            });
        } else {
            insights.push({
                type: 'GOOD',
                icon: '🟢',
                title: 'وضع مالي مستقر',
                description: `هامش الأمان ${results.safetyMargin.toFixed(1)}%. لديك مساحة جيدة فوق نقطة التعادل.`,
                action: 'فرصة للنمو والتوسع بحذر.'
            });
        }
    }

    // 2. Contribution margin analysis
    if (results.contributionMarginPct !== null && results.contributionMarginPct !== undefined) {
        const cmBench = parsedBenchmarks.contributionMarginPct;
        if (cmBench) {
            if (results.contributionMarginPct < cmBench.bad) {
                insights.push({
                    type: 'WARNING',
                    icon: '⚠️',
                    title: 'هامش المساهمة منخفض',
                    description: `هامش المساهمة ${results.contributionMarginPct.toFixed(1)}% وهو أقل من متوسط القطاع (${cmBench.avg}%).`,
                    action: 'راجع التكاليف المتغيرة — هل يمكن التفاوض مع الموردين؟'
                });
            }
        }
    }

    // 3. Break-even units context
    if (results.breakEvenUnits !== null && results.breakEvenUnits !== undefined && sectorConfig) {
        const unitLabel = sectorConfig.unitLabelAr || 'وحدة';
        insights.push({
            type: 'INFO',
            icon: '📊',
            title: `نقطة التعادل: ${Math.ceil(results.breakEvenUnits)} ${unitLabel}`,
            description: `تحتاج تحقيق ${Math.ceil(results.breakEvenUnits)} ${unitLabel} سنوياً لتغطية جميع التكاليف.`,
            action: null
        });
    }

    return insights;
}

/**
 * تنسيق الأرقام بالعربي
 */
function formatCurrency(num, currency = 'ريال') {
    if (num === null || num === undefined) return '—';
    return new Intl.NumberFormat('ar-SA').format(Math.round(num)) + ' ' + currency;
}

module.exports = {
    calculateBreakEven,
    generateInsights,
    formatCurrency,
    safeMathEval
};
