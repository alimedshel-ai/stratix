// src/js/steps-config.js
/**
 * ⚙️ تكوين مسارات الإدارات — النسخة المتقدمة (Logic v2.0)
 * الترتيب: التشخيص (5) -> التخطيط (3) -> التنفيذ (3) -> المتابعة (4)
 */

const STEPS_CONFIG = {
    /** القائمة الشاملة لجميع أدوات الإدارات (15 أداة) */
    DEPARTMENT_TOOLS: [
        // 🔍 المرحلة 1: التشخيص (Diagnostic) - مفتوحة دائماً
        { id: 'deep', name: 'التشخيص العميق', path: '/{dept}-deep.html', icon: 'bi-search-heart', phase: 'diagnostic', category: 'diagnostic', available: true },
        { id: 'audit', name: 'التقييم الوصفي', path: '/{dept}-audit.html', icon: 'bi-clipboard2-pulse-fill', phase: 'diagnostic', category: 'diagnostic', available: true },
        { id: 'pestel', name: 'تحليل PESTEL', path: '/pestel.html', icon: 'bi-globe2', phase: 'diagnostic', category: 'diagnostic', available: true },
        { id: 'dept-health', name: 'صحة الإدارة', path: '/dept-health.html', icon: 'bi-heart-pulse', phase: 'diagnostic', category: 'diagnostic', available: true },
        { id: 'swot', name: 'تحليل SWOT', path: '/swot.html', icon: 'bi-grid-3x3-gap-fill', phase: 'diagnostic', category: 'diagnostic', available: true },
        { id: 'tows', name: 'مصفوفة TOWS', path: '/tows.html', icon: 'bi-grid-1x2-fill', phase: 'diagnostic', category: 'diagnostic', available: true },

        // 🧭 المرحلة 2: التخطيط (Planning) - تفتح بعد اكتمال التشخيص
        { id: 'scenarios', name: 'السيناريوهات الاستراتيجية', path: '/scenarios.html', icon: 'bi-layers', phase: 'planning', category: 'planning', available: true },
        { id: 'directions', name: 'التوجهات الاستراتيجية', path: '/directions.html', icon: 'bi-compass-fill', phase: 'planning', category: 'planning', available: true },
        { id: 'strategic-objectives', name: 'الأهداف الاستراتيجية', path: '/objectives.html', icon: 'bi-bullseye', phase: 'planning', category: 'planning', available: true },

        // 🚀 المرحلة 3: التنفيذ (Execution) - تفتح بعد اكتمال التخطيط
        { id: 'okrs', name: 'نظام OKRs', path: '/okrs.html', icon: 'bi-award', phase: 'execution', category: 'execution', available: true },
        { id: 'kpis', name: 'مؤشرات الأداء (KPIs)', path: '/kpis.html', icon: 'bi-speedometer2', phase: 'execution', category: 'execution', available: true },
        { id: 'initiatives', name: 'المبادرات والمشاريع', path: '/initiatives.html', icon: 'bi-rocket-takeoff', phase: 'execution', category: 'execution', available: true },

        // 📊 المرحلة 4: المتابعة (Monitoring) - تفتح بعد اكتمال التنفيذ
        { id: 'reviews', name: 'مراجعات الأداء', path: '/reviews.html', icon: 'bi-card-checklist', phase: 'monitoring', category: 'monitoring', available: true },
        { id: 'corrections', name: 'الإجراءات التصحيحية', path: '/corrections.html', icon: 'bi-tools', phase: 'monitoring', category: 'monitoring', available: true },
        { id: 'reports', name: 'التقارير الدورية', path: '/reports.html', icon: 'bi-file-earmark-bar-graph', phase: 'monitoring', category: 'monitoring', available: true },
        { id: 'risk-map', name: 'خريطة المخاطر', path: '/risk-map.html', icon: 'bi-exclamation-triangle', phase: 'monitoring', category: 'monitoring', available: true }
    ],

    /** ترتيب المراحل */
    PHASE_ORDER: ['diagnostic', 'planning', 'execution', 'monitoring'],

    /** الفئات وتنسيقها */
    CATEGORIES: {
        diagnostic: { title: '🔍 التشخيص', color: '#6f42c1' },
        planning: { title: '🧭 التخطيط', color: '#0dcaf0' },
        execution: { title: '🚀 التنفيذ', color: '#198754' },
        monitoring: { title: '📊 المتابعة', color: '#ffc107' }
    },

    /** الإدارات */
    deptNames: {
        hr: 'الموارد البشرية', finance: 'المالية', marketing: 'التسويق', sales: 'المبيعات',
        operations: 'العمليات', it: 'تقنية المعلومات', cs: 'خدمة العملاء', quality: 'الجودة',
        projects: 'المشاريع', compliance: 'الامتثال', support: 'الدعم', governance: 'الحوكمة'
    },

    /** استثناءات التشخيص */
    deepOverrides: {
        hr: '/hr-deep.html',
        finance: '/finance-deep.html'
    },
    /** استثناءات التقييم الوصفي */
    auditOverrides: {
        hr: '/hr-audit.html',
        finance: '/finance-audit.html'
    }
};

// ─── محرك المنطق والتحقق ───────────────────────────────────────

/**
 * دالة التحقق من القفل الناتجة عن تسلسل المراحل الاستراتيجية
 * @param {Object} tool الأداة المطلوب فحصها
 * @param {Array} completedIds قائمة المعرفات التي أكملها المستخدم
 */
window.isToolLocked = function (tool, completedIds = []) {
    const phaseIndex = STEPS_CONFIG.PHASE_ORDER.indexOf(tool.phase);
    if (phaseIndex <= 0) return false; // المرحلة الأولى مفتوحة دائماً

    // تحقق من أن المرحلة السابقة اكتملت بالكامل
    const prevPhase = STEPS_CONFIG.PHASE_ORDER[phaseIndex - 1];
    const prevPhaseTools = STEPS_CONFIG.DEPARTMENT_TOOLS.filter(t => t.phase === prevPhase);

    // يجب أن تكون جميع أدوات المرحلة السابقة موجودة في قائمة المعرفات المكتملة
    return !prevPhaseTools.every(t => completedIds.includes(t.id));
};

/** جلب الأدوات مقسمة حسب الفئة */
window.getToolsByCategory = function () {
    const grouped = {};
    for (const [key, cat] of Object.entries(STEPS_CONFIG.CATEGORIES)) {
        grouped[key] = {
            ...cat,
            tools: STEPS_CONFIG.DEPARTMENT_TOOLS.filter(t => t.phase === key)
        };
    }
    return grouped;
};

/** محرك توليد الروابط الذكي لكل إدارة */
window.getToolLink = function (tool, dept) {
    let path = tool.path;

    // 1. معالجة الاستثناءات العميقة والتدقيق
    if (tool.id === 'deep' && STEPS_CONFIG.deepOverrides[dept]) {
        path = STEPS_CONFIG.deepOverrides[dept];
    } else if (tool.id === 'audit' && STEPS_CONFIG.auditOverrides[dept]) {
        path = STEPS_CONFIG.auditOverrides[dept];
    }

    // 2. معالجة الأنماط الديناميكية {dept} في المسار
    path = path.replace('{dept}', dept);

    // 3. إضافة Query Parameter للقسم (لضمان العزل التام)
    const connector = path.includes('?') ? '&' : '?';
    return `${path}${connector}dept=${encodeURIComponent(dept)}`;
};

window.getDeptName = function (dept) {
    return STEPS_CONFIG.deptNames[dept] || dept || 'الإدارة';
};

// للتوافق مع الأنظمة الخارجية
window.getDepartmentSteps = function (dept) {
    return STEPS_CONFIG.DEPARTMENT_TOOLS.map(tool => ({
        ...tool,
        path: window.getToolLink(tool, dept)
    }));
};
