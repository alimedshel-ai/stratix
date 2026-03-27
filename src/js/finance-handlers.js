/* ═══════════════════════════════════════════════════════════════
   finance-handlers.js — أدوات مشتركة لمسار التحليل المالي
   يُحمَّل في: finance-deep, swot?dept=finance, directions, kpis
   ═══════════════════════════════════════════════════════════════ */

// ── مفاتيح localStorage ──
const FINANCE_KEYS = {
    deep_results: 'stratix_finance_deep_results',
    strengths: 'stratix_finance_strengths',
    weaknesses: 'stratix_finance_weaknesses',
    swot: 'stratix_finance_swot',
    directions: 'stratix_finance_directions',
    kpis: 'stratix_finance_kpis',
    completed_steps: 'stratix_finance_completed_steps'
};

const FINANCE_LEGACY_KEYS = {
    deep_results: 'financeDeepResults'
};

// ═══════════════════════════════════════════════════
// showToast — إذا مو معرّفة من hr-handlers
// ═══════════════════════════════════════════════════
if (typeof showToast === 'undefined') {
    window.showToast = function (message, type) {
        type = type || 'info';
        const existing = document.getElementById('stratix-toast');
        if (existing) existing.remove();

        const colors = {
            success: 'linear-gradient(135deg, #22c55e, #16a34a)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };
        const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };

        const toast = document.createElement('div');
        toast.id = 'stratix-toast';
        toast.style.cssText =
            'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);' +
            'padding:14px 28px;border-radius:14px;font-size:14px;font-weight:700;' +
            'color:white;z-index:99999;font-family:Tajawal,sans-serif;' +
            'background:' + (colors[type] || colors.info) + ';' +
            'box-shadow:0 8px 32px rgba(0,0,0,0.35);' +
            'display:flex;align-items:center;gap:10px;backdrop-filter:blur(8px);max-width:90vw;';
        toast.innerHTML = '<span>' + (icons[type] || icons.info) + '</span> <span>' + message + '</span>';
        document.body.appendChild(toast);
        setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(function () { toast.remove(); }, 300);
        }, 3500);
    };
}

// ═══════════════════════════════════════════════════
// updateCompletedSteps — إذا مو معرّفة
// ═══════════════════════════════════════════════════
if (typeof updateCompletedSteps === 'undefined') {
    window.updateCompletedSteps = function (stepNumber) {
        var key = 'stratix_finance_completed_steps';
        var steps = JSON.parse(localStorage.getItem(key) || '[]');
        if (!steps.includes(stepNumber)) {
            steps.push(stepNumber);
            localStorage.setItem(key, JSON.stringify(steps));
        }
    };
}

// ═══════════════════════════════════════════════════
// extractFinanceInsights — استخلاص نقاط القوة/الضعف
// ════════════════════════════════════════════════════
function extractFinanceInsights(deepResults) {
    if (!deepResults) return { strengths: [], weaknesses: [] };

    var strengths = [];
    var weaknesses = [];
    var d = deepResults;

    // ── هامش الربح ──
    if (d.profitMargin >= 25) {
        strengths.push('هامش ربح ممتاز (' + Math.round(d.profitMargin) + '%) — متانة مالية عالية');
    } else if (d.profitMargin >= 15) {
        strengths.push('هامش ربح صحي (' + Math.round(d.profitMargin) + '%)');
    } else if (d.profitMargin >= 5) {
        weaknesses.push('هامش ربح ضعيف (' + Math.round(d.profitMargin) + '%) — مساحة أمان ضيقة');
    } else if (d.profitMargin < 0) {
        weaknesses.push('المنشأة تعمل بخسارة — هامش ربح سلبي (' + Math.round(d.profitMargin) + '%)');
    }

    // ── شهور البقاء (Runway) ──
    if (d.runway >= 12) {
        strengths.push('سيولة مريحة — ' + Math.round(d.runway) + ' شهر بقاء');
    } else if (d.runway >= 6) {
        // وضع مقبول
    } else if (d.runway < 3 && d.runway > 0) {
        weaknesses.push('سيولة حرجة — أقل من 3 أشهر بقاء');
    }

    // ── نسبة الديون ──
    if (d.debtRatio < 20) {
        strengths.push('مديونية منخفضة (' + Math.round(d.debtRatio) + '%) — حرية مالية عالية');
    } else if (d.debtRatio > 80) {
        weaknesses.push('مديونية مرتفعة جداً (' + Math.round(d.debtRatio) + '%) — خطر تعثر');
    } else if (d.debtRatio > 50) {
        weaknesses.push('مديونية متوسطة-عالية (' + Math.round(d.debtRatio) + '%)');
    }

    // ── اتجاه الإيرادات ──
    if (d.revTrend > 10) {
        strengths.push('نمو إيجابي في الإيرادات (+' + Math.round(d.revTrend) + '%)');
    } else if (d.revTrend < -10) {
        weaknesses.push('تراجع في الإيرادات (' + Math.round(d.revTrend) + '%) — اتجاه سلبي');
    }

    // ── من بيانات المدخلات (kpis) ──
    var k = d.kpis || {};

    // تركز العملاء
    if (k.topClientPct > 40) {
        weaknesses.push('تركز عملاء خطير — ' + k.topClientPct + '% من إيراد على عميل واحد');
    } else if (k.topClientPct < 20 && k.activeClients >= 5) {
        strengths.push('قاعدة عملاء متنوعة — لا يتجاوز أي عميل ' + k.topClientPct + '%');
    }

    // مدة التحصيل
    if (k.collectionDays < 30) {
        strengths.push('تحصيل سريع (' + k.collectionDays + ' يوم)');
    } else if (k.collectionDays > 90) {
        weaknesses.push('تحصيل بطيء (' + k.collectionDays + ' يوم) — سيولة مجمدة في الذمم');
    }

    // مصادر الإيراد
    if (k.revenueSources >= 3) {
        strengths.push('تنوع في مصادر الإيراد (' + k.revenueSources + ' مصادر)');
    } else if (k.revenueSources <= 1) {
        weaknesses.push('مصدر إيراد واحد فقط — خطر الاعتماد الكلي');
    }

    // نسبة الرواتب
    var avgRev = (k.annualRevenue || 0) / 12;
    var salaryRatio = avgRev > 0 ? (k.salaries / avgRev * 100) : 0;
    if (salaryRatio > 50) {
        weaknesses.push('الرواتب تستهلك ' + Math.round(salaryRatio) + '% من الإيراد — هيكل تكاليف ثقيل');
    } else if (salaryRatio < 30 && salaryRatio > 0) {
        strengths.push('نسبة رواتب صحية (' + Math.round(salaryRatio) + '% من الإيراد)');
    }

    return { strengths: strengths, weaknesses: weaknesses };
}

// ═══════════════════════════════════════════════════
// suggestFinanceDirections — اقتراحات توجهات استراتيجية
// ═══════════════════════════════════════════════════
function suggestFinanceDirections() {
    var deep = {};
    try {
        var raw = localStorage.getItem(FINANCE_KEYS.deep_results) || localStorage.getItem(FINANCE_LEGACY_KEYS.deep_results);
        if (raw && raw !== 'undefined') {
            deep = JSON.parse(raw);
        }
    } catch (e) {
        console.warn('[finance-handlers] Error parsing deep_results', e);
    }
    var suggestions = [];
    var ts = Date.now();

    if (deep.profitMargin < 10) {
        suggestions.push({
            id: 'dir_profit_' + ts,
            title: 'رفع هامش الربح التشغيلي',
            description: 'خفض التكاليف المتغيرة 10-15% + رفع الأسعار 5% + أتمتة العمليات المكلفة',
            source: 'هامش ربح ' + Math.round(deep.profitMargin) + '%',
            priority: deep.profitMargin < 0 ? 'حرجة' : 'عالية'
        });
    }

    if (deep.runway < 6 && deep.runway > 0) {
        suggestions.push({
            id: 'dir_cashflow_' + ts,
            title: 'تأمين السيولة النقدية',
            description: 'تسريع التحصيل + التفاوض على تمديد دفع الموردين + بناء احتياطي 6 أشهر',
            source: 'شهور البقاء: ' + Math.round(deep.runway),
            priority: deep.runway < 3 ? 'حرجة' : 'عالية'
        });
    }

    if (deep.debtRatio > 50) {
        suggestions.push({
            id: 'dir_debt_' + ts,
            title: 'إعادة هيكلة الديون',
            description: 'تحويل ديون قصيرة لطويلة + التفاوض على أسعار فائدة أقل + خطة سداد متسارعة',
            source: 'نسبة ديون: ' + Math.round(deep.debtRatio) + '%',
            priority: deep.debtRatio > 80 ? 'حرجة' : 'متوسطة'
        });
    }

    var k = deep.kpis || {};

    if (k.topClientPct > 30) {
        suggestions.push({
            id: 'dir_diversify_' + ts,
            title: 'تنويع قاعدة العملاء',
            description: 'استقطاب 5+ عملاء جدد خلال 6 أشهر + خفض الاعتماد على العميل الرئيسي',
            source: 'تركز ' + k.topClientPct + '% على عميل واحد',
            priority: k.topClientPct > 40 ? 'عالية' : 'متوسطة'
        });
    }

    if (k.collectionDays > 60) {
        suggestions.push({
            id: 'dir_collection_' + ts,
            title: 'تسريع دورة التحصيل',
            description: 'تفعيل متابعة أسبوعية + خصم سداد مبكر + أتمتة الفوترة والتذكيرات',
            source: 'مدة تحصيل: ' + k.collectionDays + ' يوم',
            priority: k.collectionDays > 90 ? 'عالية' : 'متوسطة'
        });
    }

    if (deep.revTrend < 0) {
        suggestions.push({
            id: 'dir_growth_' + ts,
            title: 'تحفيز نمو الإيرادات',
            description: 'مراجعة استراتيجية التسعير + إطلاق منتجات/خدمات جديدة + تعزيز فريق المبيعات',
            source: 'اتجاه الإيرادات: ' + Math.round(deep.revTrend) + '%',
            priority: deep.revTrend < -10 ? 'حرجة' : 'عالية'
        });
    }

    if (k.revenueSources <= 1) {
        suggestions.push({
            id: 'dir_revenue_streams_' + ts,
            title: 'تنويع مصادر الإيراد',
            description: 'بناء 2-3 مصادر إيراد جديدة: اشتراكات، خدمات إضافية، شراكات استراتيجية',
            source: 'مصدر إيراد واحد فقط',
            priority: 'عالية'
        });
    }

    var avgRev = (k.annualRevenue || 0) / 12;
    var salaryRatio = avgRev > 0 ? (k.salaries / avgRev * 100) : 0;
    if (salaryRatio > 50) {
        suggestions.push({
            id: 'dir_efficiency_' + ts,
            title: 'تحسين كفاءة القوى العاملة',
            description: 'أتمتة المهام الروتينية + تدريب الفريق + ربط الأداء بالحوافز',
            source: 'الرواتب ' + Math.round(salaryRatio) + '% من الإيراد',
            priority: 'متوسطة'
        });
    }

    return suggestions;
}

// ═══════════════════════════════════════════════════
// FINANCE_KPI_SUGGESTIONS — مؤشرات مقترحة حسب التوجه
// ═══════════════════════════════════════════════════
var FINANCE_KPI_SUGGESTIONS = {
    'profit': [
        { name: 'هامش الربح التشغيلي (%)', target: '15', unit: '%' },
        { name: 'هامش الربح الصافي (%)', target: '10', unit: '%' },
        { name: 'نسبة خفض التكاليف', target: '10', unit: '%' }
    ],
    'cashflow': [
        { name: 'شهور البقاء (Runway)', target: '12', unit: 'شهر' },
        { name: 'التدفق النقدي الشهري', target: '50000', unit: 'ر.س' },
        { name: 'نسبة السيولة السريعة', target: '1.5', unit: 'مرة' }
    ],
    'debt': [
        { name: 'نسبة الديون للإيرادات', target: '30', unit: '%' },
        { name: 'نسبة خدمة الدين', target: '20', unit: '%' },
        { name: 'عدد أشهر تغطية الأقساط', target: '6', unit: 'شهر' }
    ],
    'diversify': [
        { name: 'نسبة أكبر عميل من الإيراد', target: '20', unit: '%' },
        { name: 'عدد العملاء النشطين', target: '10', unit: 'عميل' },
        { name: 'نسبة العملاء الجدد ربعياً', target: '15', unit: '%' }
    ],
    'collection': [
        { name: 'متوسط أيام التحصيل (DSO)', target: '30', unit: 'يوم' },
        { name: 'نسبة الديون المعدومة', target: '2', unit: '%' },
        { name: 'نسبة التحصيل الآلي', target: '80', unit: '%' }
    ],
    'growth': [
        { name: 'نمو الإيرادات ربعياً (%)', target: '10', unit: '%' },
        { name: 'عدد المنتجات/الخدمات الجديدة', target: '2', unit: 'منتج' },
        { name: 'إيراد لكل موظف (سنوي)', target: '300000', unit: 'ر.س' }
    ],
    'revenue_streams': [
        { name: 'عدد مصادر الإيراد', target: '3', unit: 'مصدر' },
        { name: 'نسبة الإيراد المتكرر', target: '30', unit: '%' },
        { name: 'حجم أصغر مصدر إيراد', target: '15', unit: '%' }
    ],
    'efficiency': [
        { name: 'نسبة الرواتب من الإيراد', target: '35', unit: '%' },
        { name: 'إيراد لكل موظف (شهري)', target: '25000', unit: 'ر.س' },
        { name: 'نسبة الأتمتة المالية', target: '70', unit: '%' }
    ]
};

function getSuggestedFinanceKPIs(directionId) {
    if (!directionId) return [];
    var id = ('' + directionId).toLowerCase();
    for (var pattern in FINANCE_KPI_SUGGESTIONS) {
        if (id.indexOf(pattern) !== -1) return FINANCE_KPI_SUGGESTIONS[pattern];
    }
    // fallback — مؤشرات مالية عامة
    return [
        { name: 'هامش الربح التشغيلي', target: '15', unit: '%' },
        { name: 'التدفق النقدي الشهري', target: '50000', unit: 'ر.س' }
    ];
}

// ═══════════════════════════════════════════════════
// generateFinanceStrategies — SWOT مالي
// ═══════════════════════════════════════════════════
function generateFinanceStrategies(strengths, weaknesses, opportunities, threats, maxPerType) {
    maxPerType = maxPerType || 5;

    var templates = {
        so: [
            { s: /ربح/, o: /نمو|توسع/, text: 'استثمار الأرباح العالية في خطط التوسع المدروسة' },
            { s: /سيولة/, o: /فرص|استثمار/, text: 'توظيف السيولة الفائضة في فرص استثمارية بعائد مضمون' },
            { s: /متنوع/, o: /شراكات/, text: 'بناء شراكات استراتيجية مع قاعدة العملاء المتنوعة' },
            { s: /تحصيل/, o: /منتجات/, text: 'تمويل إطلاق منتجات جديدة من التدفق النقدي المنتظم' },
        ],
        wo: [
            { w: /خسارة|ضعيف/, o: /تسعير/, text: 'مراجعة استراتيجية التسعير لتحويل الخسارة لربح' },
            { w: /سيولة/, o: /تمويل/, text: 'الاستفادة من برامج تمويل المنشآت الصغيرة لتحسين السيولة' },
            { w: /مديونية/, o: /إعادة/, text: 'إعادة هيكلة الديون لتخفيف الأعباء والاستفادة من فرص النمو' },
            { w: /تركز/, o: /تسويق/, text: 'استخدام التسويق الرقمي لتنويع قاعدة العملاء' },
        ],
        st: [
            { s: /ربح/, t: /منافسة/, text: 'استخدام هوامش الربح كميزة تنافسية في التسعير' },
            { s: /سيولة/, t: /تراجع|ركود/, text: 'بناء احتياطي نقدي للصمود أمام التراجع الاقتصادي' },
            { s: /متنوع/, t: /فقدان/, text: 'الحفاظ على تنوع العملاء لتقليل خطر فقدان أي منهم' },
        ],
        wt: [
            { w: /خسارة/, t: /منافسة/, text: 'خطة طوارئ: خفض 20% من التكاليف + تمييز المنتج' },
            { w: /سيولة/, t: /تراجع/, text: 'رقابة نقدية أسبوعية + وقف المصاريف غير الضرورية فوراً' },
            { w: /مديونية/, t: /فائدة/, text: 'تسريع سداد الديون عالية الفائدة قبل ارتفاع الأسعار' },
        ]
    };

    function generateType(listA, listB, templateFn, tpls, max) {
        var results = [];
        // من القوالب
        tpls.forEach(function (tpl) {
            var a = listA.find(function (x) { return tpl.s ? tpl.s.test(x) : tpl.w.test(x); });
            var b = listB.find(function (x) { return tpl.o ? tpl.o.test(x) : tpl.t.test(x); });
            if (a && b) results.push(tpl.text);
        });
        // عام
        if (results.length < max && listA.length > 0 && listB.length > 0) {
            for (var i = 0; i < Math.min(listA.length, max - results.length); i++) {
                var txt = templateFn(listA[i], listB[i % listB.length]);
                if (!results.includes(txt)) results.push(txt);
            }
        }
        return results.slice(0, max);
    }

    return {
        so: generateType(strengths, opportunities,
            function (s, o) { return 'استغل "' + s + '" لتحقيق "' + o + '"'; },
            templates.so, maxPerType),
        wo: generateType(weaknesses, opportunities,
            function (w, o) { return 'عالج "' + w + '" بالاستفادة من "' + o + '"'; },
            templates.wo, maxPerType),
        st: generateType(strengths, threats,
            function (s, t) { return 'استخدم "' + s + '" لمواجهة "' + t + '"'; },
            templates.st, maxPerType),
        wt: generateType(weaknesses, threats,
            function (w, t) { return 'حذّر: "' + w + '" قد يتفاقم بسبب "' + t + '"'; },
            templates.wt, maxPerType)
    };
}

// ═══════════════════════════════════════════════════
// dualWrite — إذا مو معرّفة
// ═══════════════════════════════════════════════════
if (typeof dualWrite === 'undefined') {
    window.dualWrite = function (localKey, data, apiEndpoint, dept) {
        dept = dept || 'finance';
        localStorage.setItem(localKey, JSON.stringify(data));
        var token = localStorage.getItem('token');
        if (token && apiEndpoint) {
            fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ dept: dept, data: data })
            }).catch(function (e) { console.warn('API save failed (offline):', e); });
        }
    };
}

console.log('✅ finance-handlers.js loaded —', Object.keys(FINANCE_KPI_SUGGESTIONS).length, 'KPI categories');
