// ═══════════════════════════════════════════════════════════════════
// 💰 Financial Mapping Layer — v3.3
// ═══════════════════════════════════════════════════════════════════
// يربط بين تسميات v3.3 (شهرية، بسيطة) وتسميات الكود (سنوية، تقنية)
// يُستخدم في: financial-input.html, dept-deep.html, financial-result.html
// ═══════════════════════════════════════════════════════════════════

const FinancialMapping = (() => {

    // ──────────────────────────────────────────────
    // 1. تحويل من v3.3 (شهري) → كود (سنوي)
    // ──────────────────────────────────────────────
    function toCodeFormat(v33Data) {
        const monthlyRev = Number(v33Data.monthlyRevenue) || 0;
        const monthlyExp = Number(v33Data.monthlyExpenses) || 0;
        const cash = Number(v33Data.cashBalance) || 0;
        const recv = Number(v33Data.receivables) || 0;
        const pay = Number(v33Data.payables) || 0;
        const inventory = Number(v33Data.inventory) || 0;

        // تقسيم المصروف الشهري: 60% تكلفة مبيعات + 40% إدارية (تقدير أولي)
        // يُعدّل لاحقاً في البوابة العميقة عند إدخال التفاصيل
        const cogsRatio = v33Data._cogsRatio || 0.6;
        const adminRatio = 1 - cogsRatio;

        return {
            total_revenue: monthlyRev * 12,
            cogs: monthlyExp * cogsRatio * 12,
            admin_expenses: monthlyExp * adminRatio * 12,
            current_assets: cash + recv + inventory,
            current_liabilities: pay,
            // بيانات إضافية يحتاجها النظام
            _monthly: {
                revenue: monthlyRev,
                expenses: monthlyExp,
                cash: cash,
                receivables: recv,
                payables: pay,
                inventory: inventory,
            },
        };
    }

    // ──────────────────────────────────────────────
    // 2. تحويل من كود (سنوي) → v3.3 (شهري)
    // ──────────────────────────────────────────────
    function fromCodeFormat(codeData) {
        const rev = Number(codeData.total_revenue) || 0;
        const cogs = Number(codeData.cogs) || 0;
        const admin = Number(codeData.admin_expenses) || 0;
        const assets = Number(codeData.current_assets) || 0;
        const liab = Number(codeData.current_liabilities) || 0;
        const inventory = Number(codeData.inventory) || 0;

        return {
            monthlyRevenue: Math.round(rev / 12),
            monthlyExpenses: Math.round((cogs + admin) / 12),
            cashBalance: assets - inventory,
            receivables: 0, // غير متوفر في الكود القديم
            payables: liab,
            inventory: inventory,
            // نسبة COGS الفعلية (للدقة)
            _cogsRatio: rev > 0 ? cogs / (cogs + admin) : 0.6,
        };
    }

    // ──────────────────────────────────────────────
    // 3. التصنيف الذكي حسب الحجم
    // ──────────────────────────────────────────────

    const SIZE_THRESHOLDS = {
        micro: { maxRevenue: 50000, maxEmployees: 9 },
        small: { maxRevenue: 500000, maxEmployees: 49 },
        // medium = كل ما فوق
    };

    function classifySize(monthlyRevenue, employeeCount) {
        const rev = Number(monthlyRevenue) || 0;
        const emp = Number(employeeCount) || estimateEmployees(rev);

        if (rev < SIZE_THRESHOLDS.micro.maxRevenue && emp <= SIZE_THRESHOLDS.micro.maxEmployees) {
            return {
                key: 'micro',
                label: 'متناهية الصغر',
                emoji: '🏪',
                depthInvite: 'none',        // لا عمق
                depthMessage: 'وضعك واضح — ركّز على التنفيذ',
                depthMinutes: 0,
                focus: 'خفض التكاليف والبقاء',
            };
        }

        if (rev < SIZE_THRESHOLDS.small.maxRevenue && emp <= SIZE_THRESHOLDS.small.maxEmployees) {
            return {
                key: 'small',
                label: 'صغيرة',
                emoji: '🏢',
                depthInvite: 'optional',     // اختياري
                depthMessage: 'لتحليل أعمق (نقطة تعادل دقيقة، سيناريوهات)',
                depthMinutes: 10,
                focus: 'السيولة ونمو العملاء',
            };
        }

        return {
            key: 'medium',
            label: 'متوسطة',
            emoji: '🏗️',
            depthInvite: 'recommended',  // موصى به
            depthMessage: 'وضعك يحتاج تحليلاً مالياً مفصلاً',
            depthMinutes: 25,
            focus: 'اختبارات الإجهاد وهيكلة النمو',
        };
    }

    // تقدير ذكي لعدد الموظفين من الإيراد
    function estimateEmployees(monthlyRevenue) {
        if (monthlyRevenue < 20000) return 2;
        if (monthlyRevenue < 50000) return 6;
        if (monthlyRevenue < 100000) return 15;
        if (monthlyRevenue < 300000) return 30;
        if (monthlyRevenue < 500000) return 45;
        return 60;
    }

    // ──────────────────────────────────────────────
    // 4. المحرك التحليلي — v3.3 Enhanced
    // ──────────────────────────────────────────────

    function analyze(v33Data) {
        const rev = Number(v33Data.monthlyRevenue) || 0;
        const exp = Number(v33Data.monthlyExpenses) || 0;
        const cash = Number(v33Data.cashBalance) || 0;
        const recv = Number(v33Data.receivables) || 0;
        const pay = Number(v33Data.payables) || 0;

        // المؤشرات الأساسية
        const netProfit = rev - exp;
        const profitMargin = rev > 0 ? (netProfit / rev) * 100 : 0;
        const currentRatio = pay > 0 ? (cash + recv) / pay : (cash + recv > 0 ? null : 0);

        // نقطة التعادل (تقدير أولي — 85% من المصاريف ثابتة)
        const fixedCostRatio = 0.85;
        const estimatedBreakEven = exp * fixedCostRatio;

        // ⭐ هامش الأمان (جديد في v3.3)
        const safetyMargin = rev > 0
            ? ((rev - estimatedBreakEven) / rev) * 100
            : 0;

        // Runway — كم شهر يكفي الكاش إذا توقف الإيراد
        const runway = exp > 0 ? cash / exp : null;

        // selfFundMonths — أشهر التمويل الذاتي
        const selfFundMonths = netProfit > 0 ? null : null; // يحتاج investmentNeeded

        // التقييم الصحي
        let healthStatus, healthLabel, healthColor;
        if (profitMargin >= 20 && (currentRatio === null || currentRatio >= 1.5)) {
            healthStatus = 'good';
            healthLabel = 'وضع مالي جيد';
            healthColor = '#22c55e';
        } else if (profitMargin >= 10 && (currentRatio === null || currentRatio >= 1.0)) {
            healthStatus = 'warning';
            healthLabel = 'يحتاج انتباه';
            healthColor = '#f59e0b';
        } else {
            healthStatus = 'critical';
            healthLabel = 'وضع حرج';
            healthColor = '#ef4444';
        }

        // التنبيهات
        const alerts = [];
        if (cash < exp) alerts.push({ flag: 'cashLow', text: 'النقد أقل من مصاريف شهر', severity: 'red' });
        if (profitMargin < 10 && profitMargin >= 0) alerts.push({ flag: 'marginThin', text: 'هامش ربح ضعيف', severity: 'yellow' });
        if (profitMargin < 0) alerts.push({ flag: 'loss', text: 'المنشأة تخسر حالياً', severity: 'red' });
        if (recv > rev * 2) alerts.push({ flag: 'receivablesHigh', text: 'مستحقات الآجل عالية جداً', severity: 'yellow' });
        if (currentRatio !== null && currentRatio < 1.0) alerts.push({ flag: 'liquidityCrisis', text: 'أزمة سيولة — الالتزامات تتجاوز الأصول', severity: 'red' });

        return {
            // المؤشرات
            netProfit: Math.round(netProfit),
            profitMargin: Math.round(profitMargin * 10) / 10,
            currentRatio: currentRatio !== null ? Math.round(currentRatio * 100) / 100 : null,
            estimatedBreakEven: Math.round(estimatedBreakEven),
            safetyMargin: Math.round(safetyMargin * 10) / 10,
            runway: runway !== null ? Math.round(runway * 10) / 10 : null,

            // التقييم الصحي
            health: {
                status: healthStatus,
                label: healthLabel,
                color: healthColor,
            },

            // التنبيهات
            alerts: alerts,

            // العمق الموصى
            recommendedDepth: alerts.filter(a => a.severity === 'red').length > 0 ? 'suggested' : 'optional',
        };
    }

    // ──────────────────────────────────────────────
    // 5. Benchmarks حسب الحجم
    // ──────────────────────────────────────────────

    const BENCHMARKS = {
        micro: {
            profitMargin: { good: 15, danger: 10 },
            cashReserve: { safe: 1, excellent: 3 },     // أشهر
            clientConcentration: { safe: 40, danger: 60 },
            expenseRatio: { max: 80 },
            currentRatio: { min: 1.0 },
        },
        small: {
            profitMargin: { good: 20, danger: 12 },
            cashReserve: { safe: 3, excellent: 6 },
            clientConcentration: { safe: 30, danger: 50 },
            expenseRatio: { max: 75 },
            currentRatio: { min: 1.5 },
            runway: { safe: 6, danger: 3 },
        },
        medium: {
            profitMargin: { good: 18, danger: 10 },
            cashReserve: { safe: 6, excellent: 12 },
            clientConcentration: { safe: 20, danger: 40 },
            expenseRatio: { max: 70 },
            currentRatio: { min: 2.0 },
            runway: { safe: 12, danger: 6 },
        },
    };

    function getBenchmarks(sizeKey) {
        return BENCHMARKS[sizeKey] || BENCHMARKS.small;
    }

    // ──────────────────────────────────────────────
    // 6. حفظ واسترجاع من localStorage
    // ──────────────────────────────────────────────

    const STORAGE_KEYS = {
        v33Data: 'stratix_financial_v33',
        codeData: 'stratix_raw_inputs',
        analysis: 'stratix_analysis',
        sizeCategory: 'stratix_financial_size',
    };

    function saveV33Data(v33Data) {
        localStorage.setItem(STORAGE_KEYS.v33Data, JSON.stringify(v33Data));

        // حفظ نسخة بتنسيق الكود القديم (backward compatibility)
        const codeFormat = toCodeFormat(v33Data);
        localStorage.setItem(STORAGE_KEYS.codeData, JSON.stringify(codeFormat));

        // حفظ التصنيف
        const size = classifySize(v33Data.monthlyRevenue, v33Data.employeeCount);
        localStorage.setItem(STORAGE_KEYS.sizeCategory, size.key);

        return { codeFormat, size };
    }

    function loadV33Data() {
        // أولاً: نحاول v3.3
        const v33Raw = localStorage.getItem(STORAGE_KEYS.v33Data);
        if (v33Raw) {
            try { return JSON.parse(v33Raw); } catch (e) { /* ignore */ }
        }

        // Fallback: نحوّل من الكود القديم
        const codeRaw = localStorage.getItem(STORAGE_KEYS.codeData);
        if (codeRaw) {
            try {
                const codeData = JSON.parse(codeRaw);
                return fromCodeFormat(codeData);
            } catch (e) { /* ignore */ }
        }

        return null;
    }

    function loadSizeCategory() {
        return localStorage.getItem(STORAGE_KEYS.sizeCategory) || null;
    }

    // ──────────────────────────────────────────────
    // 7. Format Helpers
    // ──────────────────────────────────────────────

    function formatMoney(num, currency) {
        if (num === null || num === undefined || isNaN(num)) return '—';
        const cur = currency || '﷼';
        const abs = Math.abs(num);
        let formatted;
        if (abs >= 1000000) {
            formatted = (num / 1000000).toFixed(1) + 'M';
        } else if (abs >= 1000) {
            formatted = num.toLocaleString('en-US');
        } else {
            formatted = num.toString();
        }
        return formatted + ' ' + cur;
    }

    function formatPercent(num) {
        if (num === null || num === undefined || isNaN(num)) return '—';
        return num.toFixed(1) + '%';
    }

    // ──────────────────────────────────────────────
    // Public API
    // ──────────────────────────────────────────────

    return {
        // التحويل
        toCodeFormat,
        fromCodeFormat,

        // التصنيف
        classifySize,
        estimateEmployees,

        // التحليل
        analyze,

        // المعايير
        getBenchmarks,
        BENCHMARKS,

        // التخزين
        saveV33Data,
        loadV33Data,
        loadSizeCategory,
        STORAGE_KEYS,

        // أدوات العرض
        formatMoney,
        formatPercent,

        // الإصدار
        VERSION: '3.3',
    };

})();

// تصدير إذا كان Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinancialMapping;
}
