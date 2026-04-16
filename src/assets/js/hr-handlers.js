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
    let deep = {};
    try {
        const raw = localStorage.getItem(HR_KEYS.deep_results) || localStorage.getItem(HR_LEGACY_KEYS.deep_results);
        if (raw && raw !== 'undefined') {
            deep = JSON.parse(raw);
        }
    } catch (e) {
        console.warn('[hr-handlers] Error parsing deep_results', e);
    }
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
            { sKey: 'توطين', oKey: 'دعم', text: 'الاستفادة من نسبة التوطين العالية للحصول على دعم حكومي إضافي (هدف، تمهير)' },
            { sKey: 'تدريب', oKey: 'تقنية', text: 'ربط برامج التدريب القوية بمنصات التعلم الرقمي لرفع الكفاءة بتكلفة أقل' },
            { sKey: 'امتثال', oKey: 'سمعة', text: 'استغلال الامتثال العالي لتعزيز سمعة الشركة كجهة عمل مفضلة واستقطاب المواهب' },
            { sKey: 'مستقر', oKey: 'توسع', text: 'استثمار استقرار الفريق وخبرته في قيادة خطط التوسع والنمو المستقبلي' },
            { sKey: 'رضا', oKey: 'استقطاب', text: 'استغلال الرضا الوظيفي العالي لموظفينا الحاليين كأداة جذب للكفاءات النادرة' }
        ],
        wo: [
            { wKey: 'دوران', oKey: 'برامج', text: 'استخدام برامج الدعم الحكومي لتحسين الحوافز ومعالجة الدوران الوظيفي' },
            { wKey: 'تدريب', oKey: 'منصات', text: 'الاستفادة من المنصات الرقمية المتاحة لسد فجوة التدريب بتكلفة منخفضة' },
            { wKey: 'يدوي', oKey: 'أتمتة', text: 'التحول الرقمي للعمليات اليدوية في HR لتقليل الأخطاء البشرية' }
        ],
        st: [
            { sKey: 'امتثال', tKey: 'غرامة', text: 'تعزيز الامتثال الحالي لتجنب المخاطر القانونية والتشديد الرقابي' },
            { sKey: 'مستقر', tKey: 'منافسة', text: 'تعزيز ثقافة الانتماء والحوافز غير المادية لمواجهة إغراءات المنافسين' },
            { sKey: 'خبرة', tKey: 'تقلب', text: 'استغلال خبرة القيادات الحالية في وضع خطط طوارئ لمواجهة التقلبات' }
        ],
        wt: [
            { wKey: 'دوران', tKey: 'منافسة', text: 'خطة عاجلة لتحسين بيئة العمل لمنع هجرة الكفاءات للمنافسين' },
            { wKey: 'توطين', tKey: 'غرامة', text: 'رفع التوطين فوراً لتجنب الغرامات وإيقاف الخدمات الحكومية' }
        ]
    };

    function generateType(listA, listB, typeTemplates, code, max) {
        const results = [];
        if (typeTemplates) {
            typeTemplates.forEach(t => {
                const keys = Object.entries(t).filter(([k]) => k !== 'text');
                const matchA = listA.find(item => item.includes(keys[0][1]));
                const matchB = listB.find(item => item.includes(keys[1][1]));
                if (matchA && matchB && results.length < max) results.push(t.text);
            });
        }
        if (results.length < max) {
            for (const a of listA) {
                for (const b of listB) {
                    if (results.length >= max) break;
                    let gen = "";
                    const s = a.replace(/\[.*?\]\s*/g, '');
                    const o = b.replace(/\[.*?\]\s*/g, '');
                    if (code === 'so') gen = `توظيف قوة "${s}" لاغتنام فرصة "${o}"`;
                    else if (code === 'wo') gen = `استخدام "${o}" لمعالجة التحدي في "${s}"`;
                    else if (code === 'st') gen = `الاعتماد على "${s}" كحصن دفاعي ضد تهديد "${o}"`;
                    else if (code === 'wt') gen = `تقليص الضعف في "${s}" للحد من أثر "${o}"`;
                    if (gen && !results.includes(gen)) results.push(gen);
                }
            }
        }
        return results.slice(0, max);
    }
    return {
        so: generateType(strengths, opportunities, hrTemplates.so, 'so', maxPerType),
        wo: generateType(weaknesses, opportunities, hrTemplates.wo, 'wo', maxPerType),
        st: generateType(strengths, threats, hrTemplates.st, 'st', maxPerType),
        wt: generateType(weaknesses, threats, hrTemplates.wt, 'wt', maxPerType)
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

// ═══════════════════════════════════════════════════
// 7. توليد السيناريوهات (Scenarios)
// ═══════════════════════════════════════════════════
function generateHRScenarios(towsData = {}) {
    return {
        optimistic: [
            "تحقيق قفزة نوعية في الإنتاجية بفضل أتمتة العمليات (SO) واكتمال برامج التدريب.",
            "استقطاب كفاءات عالمية المستوى بفضل سمعة الشركة المتميزة وتنافسية الحوافز.",
            "التحول إلى إدارة استباقية تساهم في أرباح الشركة عبر تحسين كفاءة الموارد البشربة."
        ],
        realistic: [
            "استقرار معدلات الدوران الوظيفي ضمن الحدود الطبيعية نتيجة تحسين السياسات والارتباط.",
            "إنجاز التحول الرقمي الأساسي بنجاح مع استمرار تحديات طفيفة في تبني التقنيات المتقدمة.",
            "زيادة نسبة التوطين والالتزام التام بكافة الأنظمة والتشريعات العمالية الجديدة."
        ],
        pessimistic: [
            "ظهور فجوات مهارية حادة نتيجة تسارع المنافسة في السوق وضعف ميزانية التدريب.",
            "ارتفاع تكاليف التشغيل والارتباط نتيجة تغييرات نظامية أو اقتصادية غير متوقعة.",
            "فقدان بعض الكوادر الرئيسية لصالح المنافسين في حال تأخر تحسين بيئة العمل."
        ]
    };
}

// ═══════════════════════════════════════════════════
// 8. هوية القسم (Vision, Mission, Values)
// ═══════════════════════════════════════════════════
function generateHRVisionMission(dept = 'hr') {
    return {
        vision: [
            "أن نكون الشريك الاستراتيجي الأول في تمكين رأس المال البشري وتحقيق التميز المؤسسي.",
            "الريادة في صناعة بيئة عمل محفزة ومبتكرة تضع الموظف في قلب النجاح.",
            "تطوير نموذج إدارة موارد بشرية ذكي ومستدام يدعم رؤية وتوسع المنظمة عالمياً."
        ],
        mission: [
            "تمكين موظفينا عبر تقديم خدمات إدارية وتطويرية متميزة تدعم الإنتاجية والارتباط.",
            "استقطاب وتطوير أفضل المواهب وبناء قيادات فاعلة تساهم في تحقيق أهداف الشركة.",
            "ضمان الامتثال التام والحوكمة الفاعلة لكافة ممارسات الموارد البشرية وفق أحدث الأنظمة."
        ],
        values: [
            "• الشفافية والنزاهة في كافة التعاملات والمساواة في الفرص.",
            "• الابتكار المستمر في تطوير السياسات والإجراءات.",
            "• التركيز على العميل الداخلي (الموظف) كأولوية قصوى.",
            "• العمل بروح الفريق والمسؤولية الجماعية عن النجاح.",
            "• التميز في الأداء والنتائج وسرعة الاستجابة للمتغيرات."
        ]
    };
}


// ═══════════════════════════════════════════════════
// 9. توليد أهداف استراتيجية (BSC Objectives)
// ═══════════════════════════════════════════════════
function generateHRObjectives(towsData = {}) {
    return {
        financial: [
            "حوكمة وترشيد تكاليف التوظيف بنسبة 15% عبر تحسين القنوات المباشرة.",
            "تحسين العائد على الاستثمار في رأس المال البشري (HCROI) بمقدار 0.5 نقطة.",
            "خفض التكاليف الناتجة عن دوران الموظفين والامتثال القانوني."
        ],
        customer: [
            "رفع مؤشر رضا الموظفين (eNPS) إلى +40 نقطة كأولوية قصوى.",
            "تقليل زمن الاستجابة لطلبات الموظفين (SLA) بنسبة 30%.",
            "تحسين تجربة استقطاب المرشحين وتعزيز العلامة التجارية لجهة العمل."
        ],
        internal: [
            "أتمتة كافة العمليات اليدوية المتبقية بنسبة 100% بنهاية الربع.",
            "تطوير وتفعيل نظام متقدم لإدارة الأداء والتعاقب الوظيفي.",
            "تحديث كافة الأوصاف الوظيفية والهياكل التنظيمية لتتواءم مع الاستراتيجية."
        ],
        learning: [
            "إتمام 40 ساعة تدريبية تقنية لكل موظف سنوياً في المجالات الحرجة.",
            "بناء مهارات القيادة الرقمية لمديري الصف الأول والوسط.",
            "تفعيل ثقافة الابتكار عبر إطلاق مبادرة 'صوت الموظف' للأفكار التطويرية."
        ]
    };
}

// ═══════════════════════════════════════════════════
// 10. توليد نتائج رئيسية (Key Results - OKRs)
// ═══════════════════════════════════════════════════
function generateHRKeyResults(objective = "") {
    const templates = [
        { text: "خفض معدل الدوران الوظيفي من 25% إلى 15% بنهاية العام.", target: "15%" },
        { text: "إتمام توثيق 100% من عقود الموظفين في منصة قوى.", target: "100%" },
        { text: "رفع نسبة التوطين في الوظائف القيادية لتصل إلى 40%.", target: "40%" },
        { text: "تحقيق درجة 85% في استبيان رضا الموظفين ربع السنوي.", target: "85%" },
        { text: "أتمتة 5 عمليات يدوية رئيسية في شؤون الموظفين.", target: "5 عمليات" },
        { text: "إتمام برنامج تطوير القيادات لـ 15 مديراً تنفيذياً.", target: "15 مديراً" },
        { text: "خفض متوسط وقت التوظيف من 45 يوماً إلى 30 يوماً.", target: "30 يوم" }
    ];

    // محرك التحليل الديناميكي: استخراج النسب المئوية من عنوان الهدف
    const matches = objective.match(/(\d+)%/);
    const userPercent = matches ? matches[1] + "%" : "15%"; // الافتراضي 15% لو لم يجد

    // استجابة ذكية لترشيد التكاليف والتوظيف
    if (objective.includes("تكاليف") && objective.includes("التوظيف")) {
        return [
            { text: "تخفيض الاعتماد على شركات التوظيف الخارجية (Headhunters) بنسبة كبيرة.", target: "40%" },
            { text: "تفعيل قنوات التوظيف المباشرة (مثل LinkedIn) لزيادة المتقدمين المباشرين.", target: "60%" },
            { text: "تحقيق ترشيد حقيقي في ميزانية التوظيف السنوية.", target: userPercent }
        ];
    }

    if (objective.includes("أتمتة") || objective.includes("حوكمة")) {
        return [
            { text: "أتمتة 100% من طلبات التوظيف عبر نظام الـ ATS المعتمد.", target: "100%" },
            { text: "تقليص فترة الاعتماد الإداري لطلبات التعيين من 10 أيام إلى يومين.", target: "2 يوم" },
            { text: "نشر دليل سياسات وإجراءات التوظيف المحدث بنسبة 100%.", target: "100%" }
        ];
    }

    // التبديل العشوائي في حال عدم وجود تطابق دقيق
    return templates.sort(() => 0.5 - Math.random()).slice(0, 3);
}

// ═══════════════════════════════════════════════════
// 11. حساب الوزن النسبي المقترح (Strategic Weighting)
// ═══════════════════════════════════════════════════
function calculateSuggestedWeight(title = "", perspective = "") {
    let deep = {};
    try {
        const raw = localStorage.getItem(HR_KEYS.deep_results) || localStorage.getItem(HR_LEGACY_KEYS.deep_results);
        if (raw && raw !== 'undefined') deep = JSON.parse(raw);
    } catch (e) { }

    let weight = 10; // Default base

    // 1. تحليل الفجوات الحرجة لزيادة الثقل
    if (title.includes("التوطين") && deep.saudizationRate < 20) weight += 15;
    if (title.includes("الدوران") && deep.turnoverRate > 25) weight += 15;
    if (title.includes("التوظيف") && deep.vacancyRate > 15) weight += 10;
    if (title.includes("الامتثال") && deep.complianceScore < 60) weight += 10;
    if (title.includes("الأداء") && deep.perfScore < 40) weight += 5;

    // 2. توزيع حسب المنظور (في حال عدم وجود فجوة حادة)
    if (perspective === 'financial' && weight === 10) weight = 15;
    if (perspective === 'customer' && weight === 10) weight = 20; // رضا الموظفين غالباً عالي الأهمية

    return Math.min(40, weight); // سقف 40% لهدف واحد لضمان التوازن
}

function getPerspectiveMetrics(p = "") {
    const metrics = {
        financial: { label: "الأثر المالي المتوقع / الميزانية (ر.س)", unit: "ر.س", placeholder: "مثال: 50,000 ر.س" },
        customer: { label: "المستهدف الزمني / عدد الموظفين", unit: "يوم / عدد", placeholder: "مثال: 3 أيام للرد / 100 موظف" },
        internal: { label: "مدة التنفيذ / عدد العمليات", unit: "يوم / عدد", placeholder: "مثال: 90 يوم للانتقال للتحول الرقمي" },
        learning: { label: "ساعات التدريب / عدد الكوادر", unit: "ساعة / موظف", placeholder: "مثال: 40 ساعة / 15 موظف" }
    };
    return metrics[p] || metrics.internal;
}

function getRationaleBullets(title = "") {
    const t = (title || "").toLowerCase();
    if (!t.trim()) return "• اكتب عنوان الهدف أولاً حتى يقترح النظام مبررات مخصصة.";

    if (t.includes("التوظيف") || t.includes("استقطاب")) return "• تقليل الاعتماد على جهات التوظيف الخارجية بنسبة 80%.\n• توجيه الموارد المالية نحو استقطاب الكفاءات النادرة.\n• تحسين جودة المرشحين عبر قنوات متخصصة.";
    if (t.includes("رضا") || t.includes("تجربة الموظف") || t.includes("ارتباط")) return "• خفض معدل الدوران الوظيفي بنسبة 10%.\n• رفع إنتاجية الفرد عبر بيئة محفزة.\n• تعزيز صورة الشركة كوجهة عمل مفضلة.";
    if (t.includes("أتمتة") || t.includes("رقمي") || t.includes("نظام")) return "• تقليل الوقت المستغرق للإجراءات بنسبة 40%.\n• تقليص الأخطاء البشرية وضمان الامتثال.\n• توفير 3 ساعات عمل يومية لكل موظف HR.";
    if (t.includes("توطين") || t.includes("سعودة") || t.includes("نطاقات")) return "• رفع نسبة التوطين للوصول إلى النطاق الأعلى في 'نطاقات'.\n• تقليل الاعتماد على العمالة الوافدة بنسبة 30%.\n• تفادي عقوبات إيقاف التأشيرات والاستقدام.";
    if (t.includes("دوران") || t.includes("استبقاء") || t.includes("احتفاظ")) return "• خفض معدل الدوران السنوي إلى أقل من 10%.\n• توفير تكاليف الاستبدال والتدريب المتكرر.\n• الحفاظ على الرأس المال الفكري داخل المنشأة.";
    if (t.includes("تدريب") || t.includes("تطوير") || t.includes("مهارات") || t.includes("تأهيل")) return "• سد الفجوات المهارية الحرجة بنسبة 70%.\n• رفع جاهزية الكوادر للمستقبل الرقمي.\n• تقليل فجوة الأداء بين الكوادر الجديدة والخبيرة.";
    if (t.includes("أداء") || t.includes("تقييم") || t.includes("إنتاجية")) return "• رفع إنتاجية الفرد بنسبة قابلة للقياس.\n• ربط الحوافز بالنتائج الفعلية لا بالأقدمية.\n• كشف الفجوات التشغيلية مبكراً وتصحيحها.";
    if (t.includes("امتثال") || t.includes("مخالفات") || t.includes("لوائح")) return "• تجنب الغرامات المالية ومخاطر الإيقاف التنظيمي.\n• حماية سمعة المنشأة أمام الجهات الرقابية.\n• تقليل احتمال التعرض للمساءلة القانونية.";
    if (t.includes("ثقافة") || t.includes("قيم") || t.includes("انتماء")) return "• ترسيخ قيم المنشأة في السلوك اليومي للموظفين.\n• رفع مؤشر الانتماء والولاء الوظيفي.\n• بناء بيئة جاذبة للكفاءات من خارج المنشأة.";
    if (t.includes("مكافآت") || t.includes("حوافز") || t.includes("رواتب") || t.includes("تعويضات")) return "• ربط المكافآت بمؤشرات الأداء الفعلية.\n• تحقيق العدالة الداخلية في هيكل الرواتب.\n• جذب وإبقاء المواهب النادرة بحزمة تنافسية.";
    if (t.includes("إحلال") || t.includes("تعاقب") || t.includes("تخطيط الكوادر")) return "• تهيئة بدلاء جاهزين للمواقع الحرجة.\n• تقليل مخاطر الفجوة القيادية عند الشواغر.\n• حماية استمرارية الأعمال عبر الأجيال الوظيفية.";
    if (t.includes("سلامة") || t.includes("صحة") || t.includes("بيئة العمل")) return "• تقليل حوادث العمل والإصابات المهنية.\n• الامتثال لاشتراطات الدفاع المدني والصحة المهنية.\n• رفع مؤشر رضا الموظفين عن بيئة العمل.";

    // fallback ديناميكي مشتق من العنوان نفسه بدلاً من نص ثابت
    const clean = title.trim().replace(/\.$/, "");
    return `• دعم تحقيق "${clean}" كأولوية استراتيجية للإدارة.\n• تحويل هذا الهدف إلى مبادرات قابلة للقياس والمتابعة.\n• ربط نتائجه بمؤشرات أداء واضحة لضمان التنفيذ.`;
}

function getObjectiveRationale(title = "") {
    const t = title.toLowerCase();
    if (t.includes("توطين") || t.includes("سعوية")) return "يعد رفع التوطين أولوية استراتيجية لضمان الامتثال لضوابط 'نطاقات' وتقليل مخاطر الاعتماد على العمالة الوافدة، مما يعزز الاستدامة التشغيلية للشركة.";
    if (t.includes("دوران") || t.includes("استبقاء")) return "خفض الدوران الوظيفي يقلل من تكاليف الاستبدال التدريب المتكرر، ويحمي الرأس المال الفكري للشركة، مما يؤدي لاستقرار الإنتاجية على المدى الطويل.";
    if (t.includes("رضا") || t.includes("تجربة")) return "تحسين تجربة الموظف هو المحرك الرئيسي للارتباط الوظيفي، والذي ينعكس مباشرة على جودة الخدمة المقدمة للعملاء النهائيين وكفاءة العمليات.";
    if (t.includes("أتمتة") || t.includes("نظام") || t.includes("رقمي")) return "التحول الرقمي لعمليات الموارد البشرية يقلل من التدخل البشري والبيروقراطية، مما يتيح للإدارة التركيز على المهام الاستراتيجية بدلاً من الأعباء الإدارية.";
    if (t.includes("تدريب") || t.includes("تطوير") || t.includes("مهارات")) return "الاستثمار في تدريب الكوادر يسد الفجوات المهارية الحرجة ويجهز الشركة للتعامل مع المتغيرات التقنية المتسارعة في السوق.";
    return "هذا الهدف يدعم التوجه الاستراتيجي العام للإدارة ويساعد في تحقيق التوازن المطلوب بين الأداء المالي والتميز التشغيلي.";
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
    window.generateHRScenarios = generateHRScenarios;
    window.generateHRVisionMission = generateHRVisionMission;
    window.generateHRObjectives = generateHRObjectives;
    window.generateHRKeyResults = generateHRKeyResults;
    window.calculateSuggestedWeight = calculateSuggestedWeight;
    window.getObjectiveRationale = getObjectiveRationale;
    window.getPerspectiveMetrics = getPerspectiveMetrics;
    window.getRationaleBullets = getRationaleBullets;
    window.getDeptObjectives = generateHRObjectives;
    window.getDeptFromURL = getDeptFromURL;
    window.updateCompletedSteps = updateCompletedSteps;
    window.getCompletedSteps = getCompletedSteps;
    window.isStepCompleted = isStepCompleted;
    window.dualWrite = dualWrite;
    window.validateHRData = validateHRData;
    window.HR_KPI_SUGGESTIONS = HR_KPI_SUGGESTIONS;
}


