/**
 * compliance-analyzer-highlight-patch.js
 * ============================================================
 * Patch لإضافة منطق "تمييز الجهات ذات الصلة بالنشاط"
 * يُدمج داخل compliance-analyzer.html بعد قراءة compliance-fines.json
 * ============================================================
 */
(function () {
    'use strict';

    // خريطة الجهات الرقابية ↔ الأنشطة
    var REGULATOR_ACTIVITY_MAP = {
        // جهات تنطبق على الكل
        'وزارة التجارة': ['service', 'commercial', 'industrial'],
        'هيئة الزكاة والضريبة': ['service', 'commercial', 'industrial'],
        'وزارة الموارد البشرية': ['service', 'commercial', 'industrial'],
        'التأمينات الاجتماعية': ['service', 'commercial', 'industrial'],
        'سدايا (هيئة البيانات)': ['service', 'commercial', 'industrial'],
        'هيئة البيانات والذكاء الاصطناعي (سدايا)': ['service', 'commercial', 'industrial'],
        'الهيئة الوطنية للأمن السيبراني': ['service', 'commercial', 'industrial'],
        'الدفاع المدني': ['industrial', 'commercial', 'service'],
        'البلديات': ['service', 'commercial', 'industrial'],

        // جهات صناعية
        'المركز الوطني للرقابة على الالتزام البيئي': ['industrial'],
        'الهيئة العامة للأمن الصناعي': ['industrial'],
        'هيئة المواصفات والمقاييس (SASO)': ['industrial', 'commercial'],
        'المواصفات والمقاييس': ['industrial', 'commercial'],

        // جهات تجارية
        'الهيئة العامة للمنافسة': ['commercial'],
        'جمعية حماية المستهلك': ['commercial'],
        'الهيئة السعودية للملكية الفكرية': ['commercial', 'industrial'],
        'المركز السعودي للأعمال': ['commercial'],

        // جهات قطاعية
        'هيئة كفاءة الإنفاق': ['gov'],
        'وزارة المالية': ['gov'],
        'هيئة الرقابة ومكافحة الفساد (نزاهة)': ['gov'],
        'نزاهة': ['gov'],
        'المركز الوطني لتنمية القطاع غير الربحي': ['nonprofit'],

        // جهات عامة
        'هيئة السوق المالية': ['service', 'commercial', 'industrial'],
        'البنك المركزي': ['service', 'commercial', 'industrial'],
        'وزارة العدل': ['service', 'commercial', 'industrial'],
        'النيابة العامة': ['service', 'commercial', 'industrial'],
        'هدف': ['service', 'commercial', 'industrial']
    };

    /**
     * تصنيف الجهات إلى مجموعات حسب الصلة بالنشاط
     */
    function classifyRegulators(regulators, activityType, sectorType) {
        return regulators.map(function (reg) {
            var name = reg.name || reg;
            var linked = REGULATOR_ACTIVITY_MAP[name] || [];
            var isActivityMatch = linked.indexOf(activityType) !== -1;
            var isSectorMatch = linked.indexOf(sectorType) !== -1;
            var isUniversal = linked.length >= 3;

            var relevance, badge, sortOrder;
            if (isActivityMatch || isSectorMatch) {
                relevance = 'high';
                badge = '🎯 ذات صلة عالية بنشاطك';
                sortOrder = 1;
            } else if (isUniversal) {
                relevance = 'universal';
                badge = '📋 جهة عامة (تنطبق على الجميع)';
                sortOrder = 2;
            } else {
                relevance = 'low';
                badge = 'ℹ️ مرجعية';
                sortOrder = 3;
            }

            var result = typeof reg === 'object' ? Object.assign({}, reg) : { name: reg };
            result.relevance = relevance;
            result.badge = badge;
            result.sortOrder = sortOrder;
            return result;
        }).sort(function (a, b) { return a.sortOrder - b.sortOrder; });
    }

    /**
     * عرض الجهات مقسّمة حسب الصلة
     */
    function renderRegulatorsByRelevance(classified, container) {
        var high = classified.filter(function (r) { return r.relevance === 'high'; });
        var universal = classified.filter(function (r) { return r.relevance === 'universal'; });
        var low = classified.filter(function (r) { return r.relevance === 'low'; });

        var html = '';

        if (high.length) {
            html += '<section class="relevance-high">' +
                '<h3>🎯 جهات ذات صلة عالية بنشاطك (' + high.length + ')</h3>' +
                '<div class="regulators-grid">' + high.map(renderRegCard).join('') + '</div>' +
                '</section>';
        }

        if (universal.length) {
            html += '<section class="relevance-universal" style="margin-top:24px">' +
                '<h3>📋 جهات عامة تنطبق على جميع المنشآت (' + universal.length + ')</h3>' +
                '<div class="regulators-grid">' + universal.map(renderRegCard).join('') + '</div>' +
                '</section>';
        }

        if (low.length) {
            html += '<details style="margin-top:24px">' +
                '<summary>عرض ' + low.length + ' جهة مرجعية إضافية</summary>' +
                '<div class="regulators-grid">' + low.map(renderRegCard).join('') + '</div>' +
                '</details>';
        }

        container.innerHTML = html;
    }

    function renderRegCard(reg) {
        return '<div class="reg-card relevance-' + reg.relevance + '">' +
            '<span class="reg-badge">' + reg.badge + '</span>' +
            '<h4>' + (reg.name || '') + '</h4>' +
            '<p>' + (reg.description || '') + '</p>' +
            '<p class="fine-range">نطاق الغرامات: ' + (reg.fineRange || 'غير محدد') + '</p>' +
            '</div>';
    }

    // CSS للتمييز البصري
    var HIGHLIGHT_CSS =
        '.reg-card { border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin:8px 0; }' +
        '.reg-card.relevance-high { border-color:#10b981; background:#ecfdf5; border-width:2px; }' +
        '.reg-card.relevance-universal { border-color:#6366f1; background:#eef2ff; }' +
        '.reg-card.relevance-low { opacity:0.7; }' +
        '.reg-badge { display:inline-block; font-size:12px; padding:2px 8px; border-radius:12px; background:rgba(0,0,0,0.05); margin-bottom:8px; }';

    // حقن الـ CSS
    var style = document.createElement('style');
    style.textContent = HIGHLIGHT_CSS;
    document.head.appendChild(style);

    // تصدير
    window.ComplianceHighlightPatch = {
        REGULATOR_ACTIVITY_MAP: REGULATOR_ACTIVITY_MAP,
        classifyRegulators: classifyRegulators,
        renderRegulatorsByRelevance: renderRegulatorsByRelevance,
        HIGHLIGHT_CSS: HIGHLIGHT_CSS
    };

})();
