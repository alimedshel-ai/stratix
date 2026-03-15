/**
 * hr-handlers.js — أدوات الموارد البشرية المشتركة
 * يُستخدم في: hr-deep.html, swot.html?dept=hr, directions.html?dept=hr, kpis.html?dept=hr
 * 
 * المحتويات:
 * 1. مفاتيح localStorage الموحدة
 * 2. showToast (إشعارات)
 * 3. استخلاص نقاط القوة والضعف
 * 4. اقتراحات التوجهات
 * 5. اقتراحات المؤشرات
 * 6. توليد استراتيجيات SWOT
 * 7. أدوات مساعدة
 */

// ═══════════════════════════════════════════════════
// 1. مفاتيح localStorage الموحدة
// ═══════════════════════════════════════════════════
const HR_KEYS = {
    deep_results: 'stratix_hr_deep_results',
    audit_results: 'stratix_hr_audit_results',
    strengths: 'stratix_hr_strengths',
    weaknesses: 'stratix_hr_weaknesses',
    swot: 'stratix_hr_swot',
    directions: 'stratix_hr_directions',
    kpis: 'stratix_hr_kpis',
    completed_steps: 'stratix_hr_completed_steps'
};

// مفاتيح قديمة (للتوافق مع company-health.html)
const HR_LEGACY_KEYS = {
    deep_results: 'hrDeepResults',
    company_health: 'companyHealth'
};

// ═══════════════════════════════════════════════════
// 2. showToast — إشعارات بصرية
// ═══════════════════════════════════════════════════
function showToast(message, type = 'info') {
    // تأكد من عدم وجود toast سابق
    const existing = document.getElementById('stratix-toast');
    if (existing) existing.remove();

    const colors = {
        success: 'linear-gradient(135deg, #22c55e, #16a34a)',
        warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    };

    const icons = {
        success: '✅',
        warning: '⚠️',
        error: '❌',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.id = 'stratix-toast';
    toast.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        padding: 14px 28px; border-radius: 14px; font-size: 14px; font-weight: 700;
        color: white; z-index: 99999; font-family: 'Tajawal', sans-serif;
        background: ${colors[type] || colors.info};
        box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        display: flex; align-items: center; gap: 10px;
        animation: toastSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        backdrop-filter: blur(8px);
        max-width: 90vw;
    `;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// إضافة أنيميشن CSS
(function injectToastStyles() {
    if (document.getElementById('hr-toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'hr-toast-styles';
    style.textContent = `
        @keyframes toastSlideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
    `;
    document.head.appendChild(style);
})();


// ═══════════════════════════════════════════════════
// 3. استخلاص نقاط القوة والضعف من نتائج التحليل العميق
// ═══════════════════════════════════════════════════
function extractHRInsights(deepResults) {
    if (!deepResults || !deepResults.data) return { strengths: [], weaknesses: [] };

    const strengths = [];
    const weaknesses = [];
    const d = deepResults;

    // ── التوطين ──
    if (d.saudizationRate >= 40) {
        strengths.push('نسبة توطين ممتازة (' + Math.round(d.saudizationRate) + '%) — متوافق مع نطاقات');
    } else if (d.saudizationRate >= 25) {
        strengths.push('نسبة توطين مقبولة (' + Math.round(d.saudizationRate) + '%)');
    } else if (d.saudizationRate < 20) {
        weaknesses.push('نسبة توطين ضعيفة (' + Math.round(d.saudizationRate) + '%) — خطر نطاقات أحمر');
    }

    // ── الدوران ──
    if (d.turnoverRate < 10) {
        strengths.push('معدل دوران منخفض (' + Math.round(d.turnoverRate) + '%) — فريق مستقر');
    } else if (d.turnoverRate > 25) {
        weaknesses.push('معدل دوران مرتفع (' + Math.round(d.turnoverRate) + '%) — نزيف كوادر');
    } else if (d.turnoverRate > 15) {
        weaknesses.push('معدل دوران أعلى من الطبيعي (' + Math.round(d.turnoverRate) + '%)');
    }

    // ── الشواغر ──
    if (d.vacancyRate < 5) {
        strengths.push('اكتمال شبه كامل في القوى العاملة (نسبة شواغر ' + Math.round(d.vacancyRate) + '%)');
    } else if (d.vacancyRate > 15) {
        weaknesses.push('نقص حاد في الكوادر — ' + Math.round(d.vacancyRate) + '% شواغر');
    }

    // ── الامتثال ──
    if (d.complianceScore >= 80) {
        strengths.push('امتثال نظامي عالي (' + d.complianceScore + '%) — عقود، تأمينات، مدد');
    } else if (d.complianceScore < 50) {
        weaknesses.push('امتثال ضعيف (' + d.complianceScore + '%) — خطر غرامات نظامية');
    } else if (d.complianceScore < 70) {
        weaknesses.push('امتثال جزئي (' + d.complianceScore + '%) — بنود مفقودة');
    }

    // ── إدارة الأداء ──
    if (d.perfScore >= 70) {
        strengths.push('نضج في إدارة الأداء — تقييمات، وصف وظيفي، هيكل تنظيمي');
    } else if (d.perfScore < 40) {
        weaknesses.push('غياب نظام تقييم أداء — لا تقييمات، لا وصف وظيفي');
    }

    // ── التدريب ──
    const trainingPerHead = d.data.trainingBudget / (d.data.total || 1);
    if (trainingPerHead > 2000) {
        strengths.push('استثمار قوي في التدريب (' + Math.round(trainingPerHead) + ' ر.س/موظف)');
    } else if (trainingPerHead < 500) {
        weaknesses.push('استثمار ضعيف في التدريب (' + Math.round(trainingPerHead) + ' ر.س/موظف فقط)');
    }

    // ── نطاق الإشراف ──
    const span = d.data.managers > 0 ? ((d.data.total - d.data.managers) / d.data.managers) : d.data.total;
    if (span >= 5 && span <= 10) {
        strengths.push('نطاق إشراف مثالي (' + Math.round(span) + ':1)');
    } else if (span > 15) {
        weaknesses.push('نطاق إشراف واسع جداً (' + Math.round(span) + ':1) — ضغط على المدراء');
    }

    // ── Toggles (الامتثال) ──
    const comp = d.compliance || [];
    if (!comp.includes('contracts_qiwa')) weaknesses.push('عقود غير موثقة في منصة قوى');
    if (!comp.includes('mudad')) weaknesses.push('حماية أجور (مدد) غير مفعّلة');
    if (!comp.includes('safety')) weaknesses.push('لا يوجد لجنة سلامة مهنية');
    if (!comp.includes('perf_review')) weaknesses.push('لا يوجد تقييم أداء سنوي منتظم');
    if (!comp.includes('succession')) weaknesses.push('لا توجد خطة تعاقب وظيفي');
    if (!comp.includes('training_plan')) weaknesses.push('لا توجد خطة تدريب سنوية');

    // ── الرضا الوظيفي ──
    if (d.data.hasSurvey === 'no') {
        weaknesses.push('غياب استبيان رضا الموظفين');
    } else if (d.data.satisfactionRate > 75) {
        strengths.push('رضا وظيفي عالي (' + d.data.satisfactionRate + '%)');
    } else if (d.data.satisfactionRate > 0 && d.data.satisfactionRate < 50) {
        weaknesses.push('رضا وظيفي منخفض (' + d.data.satisfactionRate + '%) — خطر دوران');
    }

    // ── فجوة الرواتب ──
    if (d.data.highestSalary > 0 && d.data.lowestSalary > 0) {
        const gap = d.data.highestSalary / d.data.lowestSalary;
        if (gap >= 10) {
            weaknesses.push('فجوة رواتب كبيرة (' + gap.toFixed(1) + 'x) — خطر استياء');
        }
    }

    return { strengths, weaknesses };
}


// ═══════════════════════════════════════════════════
// 4. اقتراحات التوجهات بناءً على نتائج الفحص
// ═══════════════════════════════════════════════════
function suggestHRDirections() {
    const deep = JSON.parse(localStorage.getItem(HR_KEYS.deep_results) ||
        localStorage.getItem(HR_LEGACY_KEYS.deep_results) || '{}');
    const suggestions = [];
    const ts = Date.now();

    // قواعد الاقتراح
    if (deep.saudizationRate < 25) {
        suggestions.push({
            id: 'dir_saudization_' + ts,
            title: 'رفع نسبة التوطين لتحقيق الامتثال',
            description: 'توظيف سعوديين جدد والاستفادة من برامج الدعم الحكومي (هدف، تمهير)',
            source: 'نسبة توطين ' + Math.round(deep.saudizationRate) + '%',
            priority: deep.saudizationRate < 15 ? 'حرجة' : 'عالية'
        });
    }

    if (deep.turnoverRate > 20) {
        suggestions.push({
            id: 'dir_retention_' + ts,
            title: 'خفض معدل الدوران الوظيفي',
            description: 'برامج استبقاء، مسارات وظيفية واضحة، تحسين بيئة العمل',
            source: 'معدل دوران ' + Math.round(deep.turnoverRate) + '%',
            priority: 'عالية'
        });
    }

    if (deep.complianceScore < 60) {
        suggestions.push({
            id: 'dir_compliance_' + ts,
            title: 'تحقيق الامتثال النظامي الكامل',
            description: 'توثيق العقود في قوى، تفعيل مدد، لوائح عمل معتمدة',
            source: 'امتثال ' + deep.complianceScore + '%',
            priority: 'حرجة'
        });
    }

    if (deep.perfScore < 50) {
        suggestions.push({
            id: 'dir_performance_' + ts,
            title: 'بناء نظام إدارة أداء متكامل',
            description: 'تقييمات سنوية، وصف وظيفي، هيكل تنظيمي محدّث',
            source: 'نضج إدارة الأداء ' + deep.perfScore + '%',
            priority: 'عالية'
        });
    }

    const tph = (deep.data?.trainingBudget || 0) / (deep.data?.total || 1);
    if (tph < 1000) {
        suggestions.push({
            id: 'dir_training_' + ts,
            title: 'تطوير برامج التدريب والتطوير',
            description: 'رفع استثمار التدريب لـ 2000+ ر.س/موظف سنوياً',
            source: 'استثمار تدريب ' + Math.round(tph) + ' ر.س/موظف',
            priority: 'متوسطة'
        });
    }

    if (deep.vacancyRate > 10) {
        suggestions.push({
            id: 'dir_recruitment_' + ts,
            title: 'سد الشواغر الحرجة',
            description: 'خطة استقطاب مكثفة خلال 90 يوم',
            source: 'نسبة شواغر ' + Math.round(deep.vacancyRate) + '%',
            priority: deep.vacancyRate > 20 ? 'حرجة' : 'عالية'
        });
    }

    const comp = deep.compliance || [];
    if (!comp.includes('succession')) {
        suggestions.push({
            id: 'dir_succession_' + ts,
            title: 'إعداد خطة تعاقب وظيفي',
            description: 'تحديد بديل لكل منصب قيادي — الحد من مخاطر الفراغ',
            source: 'غياب خطة تعاقب',
            priority: 'متوسطة'
        });
    }

    if (!comp.includes('safety')) {
        suggestions.push({
            id: 'dir_safety_' + ts,
            title: 'تفعيل السلامة والصحة المهنية',
            description: 'تأسيس لجنة سلامة، تدريبات إخلاء، سجل حوادث',
            source: 'غياب لجنة سلامة',
            priority: 'عالية'
        });
    }

    // افتراضي إذا كل شيء جيد
    if (suggestions.length === 0) {
        suggestions.push({
            id: 'dir_excellence_' + ts,
            title: 'الارتقاء نحو التميز المؤسسي في HR',
            description: 'الأنظمة الحالية جيدة — هدف التحسين المستمر والابتكار',
            source: 'جميع المؤشرات جيدة',
            priority: 'متوسطة'
        });
    }

    return suggestions;
}


// ═══════════════════════════════════════════════════
// 5. اقتراحات المؤشرات مرتبطة بـ directionId
// ═══════════════════════════════════════════════════
const HR_KPI_SUGGESTIONS = {
    'saudization': [
        { name: 'نسبة التوطين (%)', target: '25', unit: '%' },
        { name: 'عدد التعيينات السعودية ربعياً', target: '3', unit: 'موظف' },
        { name: 'نسبة الاحتفاظ بالسعوديين', target: '90', unit: '%' }
    ],
    'retention': [
        { name: 'معدل الدوران السنوي', target: '15', unit: '%' },
        { name: 'متوسط مدة الخدمة (سنوات)', target: '3', unit: 'سنة' },
        { name: 'نسبة الرضا الوظيفي', target: '75', unit: '%' },
        { name: 'تكلفة الاستبدال الشهرية', target: '0', unit: 'ر.س' }
    ],
    'compliance': [
        { name: 'نسبة العقود المسجلة في قوى', target: '100', unit: '%' },
        { name: 'عدد المخالفات النظامية', target: '0', unit: 'مخالفة' },
        { name: 'نسبة الامتثال لنظام مدد', target: '100', unit: '%' }
    ],
    'performance': [
        { name: 'نسبة الموظفين بتقييم أداء', target: '100', unit: '%' },
        { name: 'نسبة المناصب بوصف وظيفي', target: '100', unit: '%' },
        { name: 'عدد الترقيات السنوية', target: '5', unit: 'ترقية' }
    ],
    'training': [
        { name: 'ساعات التدريب لكل موظف/سنة', target: '40', unit: 'ساعة' },
        { name: 'استثمار التدريب لكل موظف', target: '2000', unit: 'ر.س' },
        { name: 'نسبة إتمام خطط التطوير', target: '80', unit: '%' }
    ],
    'recruitment': [
        { name: 'نسبة الشواغر', target: '5', unit: '%' },
        { name: 'متوسط وقت التوظيف (أيام)', target: '30', unit: 'يوم' },
        { name: 'جودة التوظيف (بقاء 6 أشهر)', target: '85', unit: '%' }
    ],
    'succession': [
        { name: 'نسبة المناصب القيادية ببديل', target: '80', unit: '%' },
        { name: 'جاهزية البديل (تقييم)', target: '70', unit: '%' }
    ],
    'safety': [
        { name: 'عدد حوادث العمل شهرياً', target: '0', unit: 'حادث' },
        { name: 'نسبة إتمام تدريب السلامة', target: '100', unit: '%' },
        { name: 'عدد تدريبات الإخلاء سنوياً', target: '4', unit: 'تدريب' }
    ],
    'excellence': [
        { name: 'درجة صحة HR الإجمالية', target: '80', unit: '/100' },
        { name: 'مؤشر تجربة الموظف (eNPS)', target: '30', unit: 'نقطة' }
    ]
};

function getSuggestedKPIs(directionId) {
    for (const pattern in HR_KPI_SUGGESTIONS) {
        if (directionId.includes(pattern)) {
            return HR_KPI_SUGGESTIONS[pattern];
        }
    }
    return [];
}


// ═══════════════════════════════════════════════════
// 6. توليد استراتيجيات SWOT
// ═══════════════════════════════════════════════════
function generateHRStrategies(strengths, weaknesses, opportunities, threats, maxPerType = 5) {

    const hrTemplates = {
        so: [
            { sKey: 'توطين', oKey: 'دعم', text: 'الاستفادة من نسبة التوطين العالية للحصول على دعم حكومي إضافي' },
            { sKey: 'تدريب', oKey: 'تقنية', text: 'ربط برامج التدريب القوية بمنصات التعلم الرقمي' },
            { sKey: 'امتثال', oKey: 'سمعة', text: 'استغلال الامتثال العالي لتعزيز سمعة الشركة كجهة عمل مفضلة' },
            { sKey: 'مستقر', oKey: 'توسع', text: 'استثمار استقرار الفريق في خطط التوسع والنمو' },
            { sKey: 'رضا', oKey: 'استقطاب', text: 'استغلال الرضا الوظيفي العالي لجذب كفاءات جديدة' }
        ],
        wo: [
            { wKey: 'دوران', oKey: 'برامج', text: 'استخدام برامج الدعم الحكومي لمعالجة الدوران الوظيفي' },
            { wKey: 'تدريب', oKey: 'منصات', text: 'الاستفادة من المنصات الرقمية لسد فجوة التدريب بتكلفة منخفضة' },
            { wKey: 'يدوي', oKey: 'أتمتة', text: 'التحول الرقمي للعمليات اليدوية في HR' },
            { wKey: 'تقييم', oKey: 'تقنية', text: 'تبني أنظمة تقييم أداء إلكترونية' }
        ],
        st: [
            { sKey: 'امتثال', tKey: 'غرامة', text: 'تعزيز الامتثال الحالي لمواجهة تشديد الرقابة النظامية' },
            { sKey: 'مستقر', tKey: 'منافسة', text: 'تعزيز ثقافة الانتماء لمواجهة محاولات استقطاب المنافسين' }
        ],
        wt: [
            { wKey: 'دوران', tKey: 'منافسة', text: 'خطة عاجلة لتحسين بيئة العمل لمنع هجرة الكفاءات للمنافسين' },
            { wKey: 'توطين', tKey: 'غرامة', text: 'رفع التوطين فوراً لتجنب الغرامات وإيقاف الخدمات' },
            { wKey: 'سلامة', tKey: 'حوادث', text: 'تفعيل السلامة المهنية لتجنب حوادث العمل والمسؤولية القانونية' }
        ]
    };

    function generateType(listA, listB, templateFn, templates, maxItems) {
        const results = [];

        // أولاً: القوالب المخصصة
        if (templates) {
            templates.forEach(t => {
                const keys = Object.entries(t).filter(([k]) => k !== 'text');
                const matchA = listA.find(item => item.includes(keys[0][1]));
                const matchB = listB.find(item => item.includes(keys[1][1]));
                if (matchA && matchB && results.length < maxItems) {
                    results.push(t.text);
                }
            });
        }

        // ثانياً: التوليد التلقائي
        if (results.length < maxItems) {
            for (const a of listA) {
                for (const b of listB) {
                    if (results.length >= maxItems) break;
                    const generated = templateFn(a, b);
                    if (!results.includes(generated)) {
                        results.push(generated);
                    }
                }
                if (results.length >= maxItems) break;
            }
        }

        return results.slice(0, maxItems);
    }

    return {
        so: generateType(strengths, opportunities,
            (s, o) => `استغل "${s}" لتحقيق "${o}"`,
            hrTemplates.so, maxPerType),
        wo: generateType(weaknesses, opportunities,
            (w, o) => `استخدم "${o}" لمعالجة "${w}"`,
            hrTemplates.wo, maxPerType),
        st: generateType(strengths, threats,
            (s, t) => `استخدم "${s}" لمواجهة "${t}"`,
            hrTemplates.st, maxPerType),
        wt: generateType(weaknesses, threats,
            (w, t) => `عالج "${w}" لتتجنب "${t}"`,
            hrTemplates.wt, maxPerType)
    };
}


// ═══════════════════════════════════════════════════
// 8. التحقق من صحة البيانات (Validation)
// ═══════════════════════════════════════════════════
function validateHRData(data) {
    const errors = [];
    if (!data) return { isValid: false, errors: ['لا توجد بيانات (Data is null or undefined)'] };

    // Check required top-level fields used in analysis
    const requiredFields = ['saudizationRate', 'turnoverRate', 'vacancyRate', 'complianceScore', 'perfScore'];
    requiredFields.forEach(field => {
        if (data[field] === undefined || data[field] === null) {
            errors.push(`حقل أساسي مفقود: ${field}`);
        }
    });

    // Check nested data object
    if (!data.data) {
        errors.push('كائن البيانات الفرعية (data) مفقود');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ═══════════════════════════════════════════════════
// 7. أدوات مساعدة
// ═══════════════════════════════════════════════════
function getDeptFromURL() {
    return new URLSearchParams(window.location.search).get('dept');
}

function updateCompletedSteps(step) {
    let steps = JSON.parse(localStorage.getItem(HR_KEYS.completed_steps) || '[]');
    if (!steps.includes(step)) {
        steps.push(step);
        steps.sort();
    }
    localStorage.setItem(HR_KEYS.completed_steps, JSON.stringify(steps));
}

function getCompletedSteps() {
    return JSON.parse(localStorage.getItem(HR_KEYS.completed_steps) || '[]');
}

function isStepCompleted(step) {
    return getCompletedSteps().includes(step);
}

/**
 * حفظ بنمط dual-write (localStorage + API)
 */
function dualWrite(localKey, data, apiEndpoint, dept = 'hr') {
    // 1. localStorage (فوري)
    try {
        localStorage.setItem(localKey, JSON.stringify(data));
    } catch (e) { console.warn('LocalStorage quota exceeded or restricted'); }

    // 2. API (في الخلفية — لا يحجب)
    const token = localStorage.getItem('token');
    if (token && apiEndpoint) {
        fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ dept: dept, data: data })
        }).catch(e => console.warn('API save failed (offline):', e));
    }
}

// تصدير (لو استُخدم كـ module)
if (typeof window !== 'undefined') {
    window.HR_KEYS = HR_KEYS;
    window.HR_LEGACY_KEYS = HR_LEGACY_KEYS;
    window.showToast = showToast;
    window.extractHRInsights = extractHRInsights;
    window.suggestHRDirections = suggestHRDirections;
    window.getSuggestedKPIs = getSuggestedKPIs;
    window.generateHRStrategies = generateHRStrategies;
    window.getDeptFromURL = getDeptFromURL;
    window.updateCompletedSteps = updateCompletedSteps;
    window.getCompletedSteps = getCompletedSteps;
    window.isStepCompleted = isStepCompleted;
    window.dualWrite = dualWrite;
    window.validateHRData = validateHRData;
    window.HR_KPI_SUGGESTIONS = HR_KPI_SUGGESTIONS;
}
