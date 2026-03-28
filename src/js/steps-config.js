// src/js/steps-config.js
/**
 * ⚙️ تكوين مسارات الإدارات — النسخة المتقدمة (Logic v2.0)
 * الترتيب: التشخيص (5) -> التخطيط (3) -> التنفيذ (3) -> المتابعة (4)
 */

const STEPS_CONFIG = {
    DEPARTMENT_TOOLS: [
        { id: 'deep', name: 'التشخيص العميق', path: '/{dept}-deep.html', icon: 'bi-search-heart', phase: 'diagnostic', category: 'diagnostic', available: true },
        { id: 'audit', name: 'التقييم الوصفي', path: '/{dept}-audit.html', icon: 'bi-clipboard2-pulse-fill', phase: 'diagnostic', category: 'diagnostic', available: true },
        { id: 'pestel', name: 'تحليل PESTEL', path: '/pestel.html', icon: 'bi-globe2', phase: 'diagnostic', category: 'diagnostic', available: true },
        { id: 'dept-health', name: 'صحة الإدارة', path: '/dept-health.html', icon: 'bi-heart-pulse', phase: 'diagnostic', category: 'diagnostic', available: true },
        { id: 'swot', name: 'تحليل SWOT', path: '/swot.html', icon: 'bi-grid-3x3-gap-fill', phase: 'diagnostic', category: 'diagnostic', available: true },
        { id: 'tows', name: 'مصفوفة TOWS', path: '/tows.html', icon: 'bi-grid-1x2-fill', phase: 'diagnostic', category: 'diagnostic', available: true },

        { id: 'scenarios', name: 'السيناريوهات الاستراتيجية', path: '/scenarios.html', icon: 'bi-layers', phase: 'planning', category: 'planning', available: true },
        { id: 'directions', name: 'التوجهات الاستراتيجية', path: '/directions.html', icon: 'bi-compass-fill', phase: 'planning', category: 'planning', available: true },
        { id: 'strategic-objectives', name: 'الأهداف الاستراتيجية', path: '/objectives.html', icon: 'bi-bullseye', phase: 'planning', category: 'planning', available: true },

        { id: 'okrs', name: 'نظام OKRs', path: '/okrs.html', icon: 'bi-award', phase: 'execution', category: 'execution', available: true },
        { id: 'kpis', name: 'مؤشرات الأداء (KPIs)', path: '/kpis.html', icon: 'bi-speedometer2', phase: 'execution', category: 'execution', available: true },
        { id: 'initiatives', name: 'المبادرات الاستراتيجية', path: '/initiatives.html', icon: 'bi-rocket-takeoff', phase: 'execution', category: 'execution', available: true },
        { id: 'projects', name: 'المشاريع التنفيذية', path: '/projects.html', icon: 'bi-folder2-open', phase: 'execution', category: 'execution', available: true },

        { id: 'reviews', name: 'مراجعات الأداء', path: '/reviews.html', icon: 'bi-card-checklist', phase: 'monitoring', category: 'monitoring', available: true },
        { id: 'corrections', name: 'الإجراءات التصحيحية', path: '/corrections.html', icon: 'bi-tools', phase: 'monitoring', category: 'monitoring', available: true },
        { id: 'reports', name: 'التقارير الدورية', path: '/reports.html', icon: 'bi-file-earmark-bar-graph', phase: 'monitoring', category: 'monitoring', available: true },
        { id: 'risk-map', name: 'خريطة المخاطر', path: '/risk-map.html', icon: 'bi-exclamation-triangle', phase: 'monitoring', category: 'monitoring', available: true }
    ],
    PHASE_ORDER: ['diagnostic', 'planning', 'execution', 'monitoring'],
    CATEGORIES: {
        diagnostic: { title: '🔍 التشخيص', color: '#6f42c1' },
        planning: { title: '🧭 التخطيط', color: '#0dcaf0' },
        execution: { title: '🚀 التنفيذ', color: '#198754' },
        monitoring: { title: '📊 المتابعة', color: '#ffc107' }
    },
    deptNames: {
        hr: 'الموارد البشرية', finance: 'المالية', marketing: 'التسويق', sales: 'المبيعات',
        operations: 'العمليات', it: 'تقنية المعلومات', cs: 'خدمة العملاء', quality: 'الجودة',
        projects: 'المشاريع', compliance: 'الامتثال', support: 'الدعم', governance: 'الحوكمة'
    },
    deepOverrides: { hr: '/hr-deep.html', finance: '/finance-deep.html' },
    auditOverrides: { hr: '/hr-audit.html', finance: '/finance-audit.html' }
};

/** جلب اسم القسم بالعربي */
function getDeptName(dept) {
    if (!dept) return '';
    const d = dept.toLowerCase();
    return STEPS_CONFIG.deptNames[d] || d;
}
window.getDeptName = getDeptName;

/** محرك توليد الروابط الذكي لكل إدارة */
window.getToolLink = function (tool, dept) {
    let path = tool.path;
    if (tool.id === 'deep' && STEPS_CONFIG.deepOverrides[dept]) path = STEPS_CONFIG.deepOverrides[dept];
    else if (tool.id === 'audit' && STEPS_CONFIG.auditOverrides[dept]) path = STEPS_CONFIG.auditOverrides[dept];

    path = path.replace('{dept}', dept);
    if (!path.includes('?')) path += `?dept=${dept}`;
    return path;
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

/** دالة التحقق من القفل */
window.isToolLocked = function (tool, completedIds = []) {
    const phaseIndex = STEPS_CONFIG.PHASE_ORDER.indexOf(tool.phase);
    if (phaseIndex <= 0) return false;

    const GATES = {
        planning: ['swot', 'tows'],
        execution: ['strategic-objectives'],
        monitoring: ['okrs', 'initiatives']
    };

    const prevPhase = STEPS_CONFIG.PHASE_ORDER[phaseIndex - 1];
    const gateTools = GATES[tool.phase] || [];
    if (gateTools.length > 0) return !gateTools.some(id => completedIds.includes(id));

    const prevPhaseTools = STEPS_CONFIG.DEPARTMENT_TOOLS.filter(t => t.phase === prevPhase);
    return !prevPhaseTools.some(t => completedIds.includes(t.id));
};
// Expose to window for global access
window.STEPS_CONFIG = STEPS_CONFIG;
window.DEPARTMENT_TOOLS = STEPS_CONFIG.DEPARTMENT_TOOLS;
window.PHASE_ORDER = STEPS_CONFIG.PHASE_ORDER;
window.CATEGORIES = STEPS_CONFIG.CATEGORIES;
