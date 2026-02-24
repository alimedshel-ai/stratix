/**
 * config/plans.js — تعريف حدود كل باقة (Backend)
 * يتوافق مع limits.js في الفرونت
 */

const PLAN_LIMITS = {
    // ─── TRIAL / FREE ───
    TRIAL: {
        maxUsers: 3,
        maxEntities: 1,
        maxObjectives: 2,
        maxKpis: 3,
        maxInitiatives: 2,
        maxProjects: 1,
        maxAssessments: 1,
        maxScenarios: 0,
        maxVersions: 1,
        maxOkrs: 1,
        maxReports: 0,
        maxAiAnalysis: 1,
        maxIntegrations: 0,
    },

    // ─── BASIC / STARTER ───
    BASIC: {
        maxUsers: 5,
        maxEntities: 2,
        maxObjectives: 10,
        maxKpis: 20,
        maxInitiatives: 10,
        maxProjects: 10,
        maxAssessments: 5,
        maxScenarios: 3,
        maxVersions: 5,
        maxOkrs: 5,
        maxReports: 5,
        maxAiAnalysis: 10,
        maxIntegrations: 1,
    },

    // ─── PRO ───
    PRO: {
        maxUsers: 25,
        maxEntities: 5,
        maxObjectives: Infinity,
        maxKpis: Infinity,
        maxInitiatives: Infinity,
        maxProjects: Infinity,
        maxAssessments: Infinity,
        maxScenarios: 10,
        maxVersions: Infinity,
        maxOkrs: Infinity,
        maxReports: Infinity,
        maxAiAnalysis: 50,
        maxIntegrations: 3,
    },

    // ─── ENTERPRISE ───
    ENTERPRISE: {
        maxUsers: Infinity,
        maxEntities: Infinity,
        maxObjectives: Infinity,
        maxKpis: Infinity,
        maxInitiatives: Infinity,
        maxProjects: Infinity,
        maxAssessments: Infinity,
        maxScenarios: Infinity,
        maxVersions: Infinity,
        maxOkrs: Infinity,
        maxReports: Infinity,
        maxAiAnalysis: Infinity,
        maxIntegrations: Infinity,
    },
};

// أسماء الموارد بالعربي للرسائل
const RESOURCE_LABELS = {
    maxUsers: 'أعضاء الفريق',
    maxEntities: 'الكيانات',
    maxObjectives: 'الأهداف الاستراتيجية',
    maxKpis: 'مؤشرات الأداء',
    maxInitiatives: 'المبادرات',
    maxProjects: 'المشاريع',
    maxAssessments: 'التقييمات',
    maxScenarios: 'السيناريوهات',
    maxVersions: 'إصدارات الاستراتيجية',
    maxOkrs: 'أهداف OKR',
    maxReports: 'التقارير',
    maxAiAnalysis: 'تحليلات AI',
    maxIntegrations: 'التكاملات',
};

module.exports = { PLAN_LIMITS, RESOURCE_LABELS };
