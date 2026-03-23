/**
 * Stratix — Smart Path Engine 🚀
 * ================================
 * يربط الـ 8 أنماط من pain-ambition بمسارات مخصصة.
 * كل نمط يحدد: الصفحات المطلوبة + الخطوات + الوقت المتوقع.
 *
 * الاستخدام:
 *   const engine = window.PathEngine;
 *   const path = engine.getPath(); // يرجع المسار المناسب
 *   const filtered = engine.filterItems(items); // يفلتر روابط الـ sidebar
 *   engine.isPathMode(); // هل المسار الذكي مفعّل؟
 *   engine.toggleMode(); // تبديل بين ذكي ↔ كلاسيكي
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════
  // 1. تعريف المسارات لكل نمط من الـ 8 أنماط
  // ═══════════════════════════════════════════════

  const PATH_DEFINITIONS = {

    // ─── 1. ناشئة متعثرة ───
    nascent_struggling: {
      name: 'مسار الإنقاذ السريع',
      nameEn: 'Quick Rescue Path',
      emoji: '🆘',
      color: '#ef4444',
      description: 'خطة بقاء 90 يوم — وقف النزيف وتثبيت الأساس',
      estimatedTime: '2-3 ساعات',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'خريطة المخاطر', href: '/risk-map.html', icon: 'bi-exclamation-triangle', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'التوجهات الاستراتيجية', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
      ],
      // الصفحات المسموح بها (تشمل الخطوات + صفحات مساعدة)
      allowedPages: [
        '/onboarding.html', '/select-type', '/company-health.html', '/internal-env.html', '/analysis.html', '/swot.html', '/risk-map.html',
        '/directions.html', '/objectives.html', '/kpis.html', '/initiatives.html',
        '/kpi-entries.html', '/dashboard.html', '/tools.html', '/tool-detail.html',
        '/settings.html', '/settings-data.html', '/entities.html',
      ],
    },

    // ─── 2. ناشئة حذرة ───
    nascent_cautious: {
      name: 'مسار البناء المستدام',
      nameEn: 'Sustainable Build Path',
      emoji: '🌱',
      color: '#22c55e',
      description: 'أساس متين + خطة مرحلية + مؤشرات قياس',
      estimatedTime: '3-4 ساعات',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: '🧬 هوية المنظمة', href: '/org-dna.html', icon: 'bi-fingerprint', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'التوجهات الاستراتيجية', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'المهام', href: '/tasks.html', icon: 'bi-check2-square', phase: 'EXECUTION' },
        { label: 'إدخال المؤشرات', href: '/kpi-entries.html', icon: 'bi-pencil-square', phase: 'EXECUTION' },
      ],
      allowedPages: [
        '/onboarding.html', '/select-type', '/org-dna.html', '/company-health.html', '/internal-env.html', '/swot.html',
        '/directions.html', '/objectives.html', '/kpis.html',
        '/initiatives.html', '/tasks.html', '/kpi-entries.html',
        '/dashboard.html', '/tools.html', '/tool-detail.html',
        '/settings.html', '/settings-data.html', '/entities.html',
      ],
    },

    // ─── 3. نامية فوضوية ───
    growing_chaotic: {
      name: 'مسار الهيكلة والتنظيم',
      nameEn: 'Structure & Organize Path',
      emoji: '🌪️',
      color: '#f59e0b',
      description: 'هيكلة العمليات + مؤشرات أداء مركزية + محاذاة الفرق',
      estimatedTime: '4-5 ساعات',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'أصحاب المصلحة', href: '/stakeholders.html', icon: 'bi-people-fill', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'التوجهات الاستراتيجية', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'المهام', href: '/tasks.html', icon: 'bi-check2-square', phase: 'EXECUTION' },
        { label: 'المراجعات الدورية', href: '/reviews.html', icon: 'bi-journal-check', phase: 'ADAPTATION' },
      ],
      allowedPages: [
        '/onboarding.html', '/select-type', '/internal-env.html', '/dept-deep.html', '/company-health.html', '/swot.html', '/stakeholders.html',
        '/directions.html', '/objectives.html', '/kpis.html',
        '/initiatives.html', '/tasks.html', '/kpi-entries.html', '/reviews.html',
        '/dashboard.html', '/tools.html', '/tool-detail.html',
        '/settings.html', '/settings-data.html', '/entities.html',
      ],
    },

    // ─── 4. نامية طموحة ───
    growing_ambitious: {
      name: 'مسار التميز التنافسي',
      nameEn: 'Competitive Edge Path',
      emoji: '🚀',
      color: '#3b82f6',
      description: 'تحليل تنافسي + تخطيط التميز + تنفيذ سريع',
      estimatedTime: '4-6 ساعات',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'قوى بورتر', href: '/tool-detail.html?code=PORTER', icon: 'bi-shield-check', phase: 'DIAGNOSIS' },
        { label: 'المقارنة المعيارية', href: '/benchmarking.html', icon: 'bi-bar-chart-line', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'سلسلة القيمة', href: '/tool-detail.html?code=VALUE_CHAIN', icon: 'bi-link-45deg', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'مصفوفة TOWS', href: '/tows.html', icon: 'bi-arrows-fullscreen', phase: 'PLANNING' },
        { label: 'التوجهات الاستراتيجية', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'OKRs', href: '/okrs.html', icon: 'bi-layers', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
      ],
      allowedPages: [
        '/onboarding.html', '/select-type', '/internal-env.html', '/swot.html', '/dept-deep.html', '/company-health.html', '/analysis.html', '/tows.html',
        '/directions.html', '/objectives.html', '/kpis.html', '/okrs.html',
        '/initiatives.html', '/tasks.html', '/kpi-entries.html', '/benchmarking.html',
        '/dashboard.html', '/tools.html', '/tool-detail.html',
        '/settings.html', '/settings-data.html', '/entities.html',
      ],
    },

    // ─── 5. متعثرة مالياً ───
    financial_struggling: {
      name: 'مسار الإنقاذ المالي',
      nameEn: 'Financial Rescue Path',
      emoji: '💰',
      color: '#dc2626',
      description: 'وقف النزيف المالي + خفض تكاليف + تنويع إيرادات',
      estimatedTime: '3-4 ساعات',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'قوى بورتر', href: '/tool-detail.html?code=PORTER', icon: 'bi-shield-check', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'سلسلة القيمة', href: '/tool-detail.html?code=VALUE_CHAIN', icon: 'bi-link-45deg', phase: 'DIAGNOSIS' },
        { label: 'خريطة المخاطر', href: '/risk-map.html', icon: 'bi-exclamation-triangle', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'التوجهات الاستراتيجية', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'القرارات المالية', href: '/financial.html', icon: 'bi-cash-stack', phase: 'EXECUTION' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'التصحيحات', href: '/corrections.html', icon: 'bi-arrow-repeat', phase: 'ADAPTATION' },
      ],
      allowedPages: [
        '/onboarding.html', '/select-type', '/company-health.html', '/internal-env.html', '/swot.html', '/analysis.html', '/risk-map.html',
        '/directions.html', '/objectives.html', '/kpis.html', '/financial.html',
        '/initiatives.html', '/kpi-entries.html', '/corrections.html',
        '/dashboard.html', '/tools.html', '/tool-detail.html',
        '/settings.html', '/settings-data.html', '/entities.html',
      ],
    },

    // ─── 6. ناضجة تحتاج تجديد ───
    mature_renewing: {
      name: 'مسار التجديد الاستراتيجي',
      nameEn: 'Strategic Renewal Path',
      emoji: '🏢',
      color: '#8b5cf6',
      description: 'تشخيص فجوات + تخطيط تحوّلي + ابتكار',
      estimatedTime: '5-7 ساعات',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'التقييمات', href: '/assessments.html', icon: 'bi-clipboard-check', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'سلسلة القيمة', href: '/tool-detail.html?code=VALUE_CHAIN', icon: 'bi-link-45deg', phase: 'DIAGNOSIS' },
        { label: 'القدرات الجوهرية', href: '/tool-detail.html?code=CORE_COMPETENCY', icon: 'bi-trophy', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'مصفوفة TOWS', href: '/tows.html', icon: 'bi-arrows-fullscreen', phase: 'PLANNING' },
        { label: 'التوجهات الاستراتيجية', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'السيناريوهات', href: '/scenarios.html', icon: 'bi-bezier2', phase: 'ADAPTATION' },
      ],
      allowedPages: [
        '/onboarding.html', '/select-type', '/assessments.html', '/internal-env.html', '/dept-deep.html', '/company-health.html', '/swot.html',
        '/analysis.html', '/tows.html', '/directions.html', '/objectives.html', '/kpis.html',
        '/initiatives.html', '/tasks.html', '/kpi-entries.html', '/scenarios.html', '/reviews.html',
        '/dashboard.html', '/tools.html', '/tool-detail.html',
        '/settings.html', '/settings-data.html', '/entities.html',
      ],
    },

    // ─── 7. ناضجة تنافسية ───
    mature_competitive: {
      name: 'مسار قيادة السوق',
      nameEn: 'Market Leadership Path',
      emoji: '🏆',
      color: '#6366f1',
      description: 'تحليل تنافسي شامل + توسع مدروس + ذكاء تنافسي',
      estimatedTime: '6-8 ساعات',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'قوى بورتر', href: '/tool-detail.html?code=PORTER', icon: 'bi-shield-check', phase: 'DIAGNOSIS' },
        { label: 'المقارنة المعيارية', href: '/benchmarking.html', icon: 'bi-bar-chart-line', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'سلسلة القيمة', href: '/tool-detail.html?code=VALUE_CHAIN', icon: 'bi-link-45deg', phase: 'DIAGNOSIS' },
        { label: 'القدرات الجوهرية', href: '/tool-detail.html?code=CORE_COMPETENCY', icon: 'bi-trophy', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'مصفوفة TOWS', href: '/tows.html', icon: 'bi-arrows-fullscreen', phase: 'PLANNING' },
        { label: 'التوجهات الاستراتيجية', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'OKRs', href: '/okrs.html', icon: 'bi-layers', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'السيناريوهات', href: '/scenarios.html', icon: 'bi-bezier2', phase: 'ADAPTATION' },
        { label: 'المراجعات الدورية', href: '/reviews.html', icon: 'bi-journal-check', phase: 'ADAPTATION' },
      ],
      allowedPages: [
        '/onboarding.html', '/select-type', '/internal-env.html', '/dept-deep.html', '/company-health.html', '/swot.html', '/analysis.html', '/benchmarking.html',
        '/tows.html', '/directions.html', '/objectives.html', '/kpis.html', '/okrs.html',
        '/initiatives.html', '/tasks.html', '/kpi-entries.html', '/scenarios.html', '/reviews.html',
        '/dashboard.html', '/tools.html', '/tool-detail.html', '/intelligence.html',
        '/settings.html', '/settings-data.html', '/entities.html',
      ],
    },

    // ─── 8. المسار الاحترافي الشامل (كل الأدوات مفتوحة) ───
    default_strategic: {
      name: 'المسار الاحترافي الشامل',
      nameEn: 'Professional Comprehensive Path',
      emoji: '🧭',
      color: '#667eea',
      description: 'كل الأدوات والتحليلات متاحة — للمحترفين والاستشاريين',
      estimatedTime: '6-10 ساعات',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'استكشاف الإدارات', href: '/dept-deep.html', icon: 'bi-building-fill-gear', phase: 'DIAGNOSIS' },
        { label: 'سلسلة القيمة', href: '/tool-detail.html?code=VALUE_CHAIN', icon: 'bi-link-45deg', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'مصفوفة TOWS', href: '/tows.html', icon: 'bi-arrows-fullscreen', phase: 'PLANNING' },
        { label: 'التوجهات الاستراتيجية', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'المهام', href: '/tasks.html', icon: 'bi-check2-square', phase: 'EXECUTION' },
        { label: 'إدخال المؤشرات', href: '/kpi-entries.html', icon: 'bi-pencil-square', phase: 'EXECUTION' },
        { label: 'المراجعات الدورية', href: '/reviews.html', icon: 'bi-journal-check', phase: 'ADAPTATION' },
      ],
      allowedPages: null, // null = كل الصفحات مسموحة (المسار الكلاسيكي)
    },

    // ─── 9. المسار الذهبي (خيط ذهبي — 6 مراحل متكاملة) ───
    golden_express: {
      name: 'المسار الذهبي',
      nameEn: 'Golden Path',
      emoji: '✨',
      color: '#f59e0b',
      description: '6 مراحل متكاملة: البنية → التشخيص → التحليل → الخيارات → التنفيذ → المتابعة',
      estimatedTime: '4-6 ساعات',
      steps: [
        { label: '🏗️ بنيتنا', href: '/onboarding.html', icon: 'bi-building-gear', phase: 'FOUNDATION' },
        { label: '🔍 تشخيصي', href: '/analysis.html', icon: 'bi-search-heart', phase: 'DIAGNOSIS' },
        { label: '🎯 خياراتي', href: '/tows.html', icon: 'bi-signpost-split', phase: 'PLANNING' },
        { label: '🚀 تنفيذي', href: '/initiatives.html', icon: 'bi-rocket-takeoff', phase: 'EXECUTION' },
        { label: '📊 متابعتي', href: '/reviews.html', icon: 'bi-bar-chart-line', phase: 'ADAPTATION' },
      ],
      allowedPages: [
        // بنيتنا
        '/onboarding.html', '/entities.html', '/sectors.html', '/settings-data.html',
        // تشخيصي
        '/analysis.html', '/assessments.html', '/company-health.html', '/internal-env.html',
        '/stakeholders.html', '/risk-map.html', '/statistical-data.html',
        // خياراتي
        '/tows.html', '/directions.html', '/objectives.html', '/kpis.html', '/okrs.html',
        // تنفيذي
        '/initiatives.html', '/projects.html', '/tasks.html', '/kpi-entries.html',
        // متابعتي
        '/reviews.html', '/intelligence.html', '/corrections.html', '/strategic-calendar.html',
        // نظامية دائمة
        '/dashboard.html', '/settings.html', '/tools.html', '/tool-detail.html',
      ],
    },

    // ─── 10. مسار التحسين التشغيلي 🆕 ───
    operational_tactical: {
      name: 'مسار التحسين التشغيلي',
      nameEn: 'Operational Improvement Path',
      emoji: '⚙️',
      color: '#6b7280',
      description: 'تحسين العمليات + رفع الكفاءة + مؤشرات تشغيلية',
      estimatedTime: '3-5 أيام',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'سلسلة القيمة', href: '/tool-detail.html?code=VALUE_CHAIN', icon: 'bi-link-45deg', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'التوجهات الاستراتيجية', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'المهام', href: '/tasks.html', icon: 'bi-check2-square', phase: 'EXECUTION' },
      ],
      allowedPages: [
        '/onboarding.html', '/select-type', '/internal-env.html', '/dept-deep.html', '/company-health.html',
        '/directions.html', '/objectives.html', '/kpis.html',
        '/initiatives.html', '/tasks.html', '/kpi-entries.html',
        '/dashboard.html', '/tools.html', '/tool-detail.html',
        '/settings.html', '/settings-data.html', '/entities.html',
      ],
    },

    // ─── 11. مسار إدارة الأزمات والمخاطر 🆕 ───
    emergency_risk: {
      name: 'مسار إدارة الأزمات والمخاطر',
      nameEn: 'Crisis & Risk Management Path',
      emoji: '🛡️',
      color: '#b91c1c',
      description: 'تقييم المخاطر + سيناريوهات بديلة + خطة طوارئ',
      estimatedTime: '1-2 يوم',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'خريطة المخاطر', href: '/risk-map.html', icon: 'bi-exclamation-triangle', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'السيناريوهات', href: '/scenarios.html', icon: 'bi-bezier2', phase: 'PLANNING' },
        { label: 'التوجهات الاستراتيجية', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'التصحيحات', href: '/corrections.html', icon: 'bi-arrow-repeat', phase: 'ADAPTATION' },
      ],
      allowedPages: [
        '/onboarding.html', '/select-type', '/risk-map.html', '/company-health.html', '/internal-env.html', '/analysis.html', '/swot.html',
        '/scenarios.html', '/directions.html', '/objectives.html', '/kpis.html',
        '/initiatives.html', '/corrections.html', '/kpi-entries.html',
        '/dashboard.html', '/tools.html', '/tool-detail.html',
        '/settings.html', '/settings-data.html', '/entities.html',
      ],
    },

  };

  // ═══════════════════════════════════════════════
  // 2. الدوال الأساسية
  // ═══════════════════════════════════════════════

  /**
   * قراءة نمط الشركة من localStorage
   */
  function getPatternKey() {
    try {
      const pa = localStorage.getItem('painAmbition');
      if (pa) {
        const parsed = JSON.parse(pa);
        return parsed.patternKey || 'default_strategic';
      }
    } catch (e) { /* ignore */ }
    return 'default_strategic';
  }

  /**
   * هل المسار الذكي مفعّل؟
   */
  function isPathMode() {
    const mode = localStorage.getItem('pathMode');
    // افتراضياً مفعّل إذا عنده نمط محدد
    if (mode === 'classic') return false;
    if (mode === 'smart') return true;
    // إذا ما اختار — مفعّل تلقائياً إذا عنده patternKey
    return getPatternKey() !== 'default_strategic';
  }

  /**
   * تبديل بين الوضع الذكي والكلاسيكي
   */
  function toggleMode() {
    const current = isPathMode();
    localStorage.setItem('pathMode', current ? 'classic' : 'smart');
    // إعادة تحميل الصفحة لتحديث الـ Sidebar
    window.location.reload();
  }

  /**
   * إرجاع تعريف المسار الحالي
   */
  function getPath() {
    if (!isPathMode()) return null; // الوضع الكلاسيكي
    const key = getPatternKey();
    return PATH_DEFINITIONS[key] || PATH_DEFINITIONS.default_strategic;
  }

  /**
   * هل هذه الصفحة مسموح بها في المسار الحالي؟
   */
  function isPageAllowed(href) {
    if (!isPathMode()) return true; // الكلاسيكي = كل شي مسموح
    const path = getPath();
    if (!path || !path.allowedPages) return true; // null = كل شي مسموح
    // نتحقق من الصفحة (بدون query string)
    const clean = href.split('?')[0];
    return path.allowedPages.includes(clean);
  }

  /**
   * دالة مساعدة لتصفية العناصر بناءً على الصفحات المسموحة (تطبيق مبدأ DRY)
   */
  function filterByAllowedPages(items, path) {
    if (!path || !path.allowedPages) return items;
    return items.filter(item => {
      const clean = item.href.split('?')[0];
      return path.allowedPages.includes(clean);
    });
  }

  /**
   * فلترة عناصر phase بناءً على المسار
   */
  function filterPhaseItems(items) {
    if (!isPathMode()) return items;
    return filterByAllowedPages(items, getPath());
  }

  /**
   * فلترة مراحل الرحلة — إخفاء المراحل الفارغة
   */
  function filterPhases(phases) {
    if (!isPathMode()) return phases;
    const path = getPath();
    return phases.map(phase => {
      return { ...phase, items: filterByAllowedPages(phase.items, path) };
    }).filter(phase => phase.items.length > 0);
  }

  /**
   * حساب تقدم المسار الذكي
   * يعتمد على localStorage لتتبع الصفحات المزارة
   */
  function getSmartProgress() {
    const path = getPath();
    if (!path) return { percent: 0, completed: 0, total: 0, steps: [] };

    const visited = getVisitedPages();
    const steps = path.steps.map((step, idx) => {
      const clean = step.href.split('?')[0];
      const done = visited.includes(clean);
      return { ...step, index: idx + 1, done };
    });

    const completed = steps.filter(s => s.done).length;
    const total = steps.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { percent, completed, total, steps };
  }

  /**
   * تسجيل زيارة صفحة
   */
  function trackPageVisit() {
    if (!isPathMode()) return;
    const page = window.location.pathname;
    const visited = getVisitedPages();
    if (!visited.includes(page)) {
      visited.push(page);
      if (visited.length > 50) visited.shift(); // حماية الذاكرة: الاحتفاظ بآخر 50 زيارة فقط
      localStorage.setItem('pathVisited', JSON.stringify(visited));
    }
  }

  /**
   * إرجاع الصفحات المزارة
   */
  function getVisitedPages() {
    try {
      return JSON.parse(localStorage.getItem('pathVisited') || '[]');
    } catch (e) { return []; }
  }

  /**
   * بناء HTML شريط التقدم الذكي
   */
  function buildProgressHTML() {
    const path = getPath();
    if (!path) return '';

    const progress = getSmartProgress();
    const phaseGroups = {};

    // تجميع الخطوات حسب المرحلة
    progress.steps.forEach(step => {
      if (!phaseGroups[step.phase]) phaseGroups[step.phase] = [];
      phaseGroups[step.phase].push(step);
    });

    const PHASE_NAMES = {
      FOUNDATION: '🏗️ بنيتنا',
      DIAGNOSIS: '🔍 تشخيصي',
      PLANNING: '🎯 خياراتي',
      EXECUTION: '🚀 تنفيذي',
      ADAPTATION: '📊 متابعتي',
    };

    let stepsHTML = '';
    Object.entries(phaseGroups).forEach(([phase, steps]) => {
      stepsHTML += `<div class="spe-phase-label">${PHASE_NAMES[phase] || phase}</div>`;
      steps.forEach(step => {
        const isCurrentPage = window.location.pathname === step.href;
        stepsHTML += `
          <a href="${step.href}" class="spe-step ${step.done ? 'done' : ''} ${isCurrentPage ? 'current' : ''}">
            <span class="spe-step-num">${step.done ? '✅' : step.index}</span>
            <span class="spe-step-label">${step.label}</span>
          </a>
        `;
      });
    });

    return `
      <div class="spe-container" id="smartPathEngine">
        <div class="spe-header">
          <div class="spe-path-name" style="color:${path.color}">
            ${path.emoji} ${path.name}
          </div>
          <div class="spe-path-meta">
            <span>⏱️ ${path.estimatedTime}</span>
            <span>📊 ${progress.completed}/${progress.total}</span>
          </div>
        </div>

        <div class="spe-progress-bar">
          <div class="spe-progress-fill" style="width:${progress.percent}%;background:${path.color}"></div>
        </div>
        <div class="spe-progress-text">${progress.percent}% مكتمل</div>

        <div class="spe-steps">
          ${stepsHTML}
        </div>

        <div class="spe-toggle">
          <button onclick="window.PathEngine.toggleMode()" class="spe-toggle-btn">
            <i class="bi bi-arrows-expand"></i>
            عرض كل الأدوات (الكلاسيكي)
          </button>
        </div>
      </div>
    `;
  }

  /**
   * بناء HTML زر التبديل في الوضع الكلاسيكي
   */
  function buildClassicToggleHTML() {
    const key = getPatternKey();
    if (key === 'default_strategic') return '';

    const path = PATH_DEFINITIONS[key];
    if (!path) return '';

    return `
      <div class="spe-classic-toggle">
        <button onclick="window.PathEngine.toggleMode()" class="spe-toggle-btn spe-toggle-smart">
          <i class="bi bi-lightning-charge-fill"></i>
          العودة للمسار الذكي (${path.emoji} ${path.name})
        </button>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════
  // 3. CSS
  // ═══════════════════════════════════════════════

  function injectStyles() {
    if (document.getElementById('spe-styles')) return;
    const style = document.createElement('style');
    style.id = 'spe-styles';
    style.textContent = `
      /* Smart Path Engine */
      .spe-container {
        margin: 6px 10px;
        padding: 12px;
        border-radius: 12px;
        background: rgba(102, 126, 234, 0.06);
        border: 1px solid rgba(102, 126, 234, 0.15);
      }
      .spe-header {
        margin-bottom: 8px;
      }
      .spe-path-name {
        font-size: 13px;
        font-weight: 800;
        margin-bottom: 4px;
      }
      .spe-path-meta {
        display: flex;
        gap: 12px;
        font-size: 10.5px;
        color: var(--text-muted, #94a3b8);
      }
      .spe-progress-bar {
        height: 6px;
        background: rgba(255,255,255,0.08);
        border-radius: 3px;
        overflow: hidden;
        margin: 8px 0 4px;
      }
      .spe-progress-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.5s ease;
      }
      .spe-progress-text {
        font-size: 10px;
        color: var(--text-muted, #94a3b8);
        text-align: center;
        margin-bottom: 8px;
      }
      .spe-phase-label {
        font-size: 10px;
        font-weight: 700;
        color: var(--text-muted, #94a3b8);
        margin: 8px 0 4px;
        padding-right: 4px;
      }
      .spe-step {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 8px;
        text-decoration: none;
        color: var(--text, #e2e8f0);
        font-size: 12px;
        transition: all 0.2s;
        opacity: 0.7;
      }
      .spe-step:hover {
        background: rgba(255,255,255,0.06);
        opacity: 1;
      }
      .spe-step.done {
        opacity: 0.5;
      }
      .spe-step.current {
        background: rgba(102, 126, 234, 0.15);
        opacity: 1;
        font-weight: 700;
        border-right: 3px solid var(--primary, #667eea);
      }
      .spe-step-num {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(255,255,255,0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .spe-step.done .spe-step-num {
        background: none;
        font-size: 14px;
      }
      .spe-step-label {
        flex: 1;
      }
      .spe-toggle {
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .spe-toggle-btn {
        width: 100%;
        padding: 7px 12px;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        background: rgba(255,255,255,0.04);
        color: var(--text-muted, #94a3b8);
        font-size: 11px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        justify-content: center;
        transition: all 0.2s;
        font-family: inherit;
      }
      .spe-toggle-btn:hover {
        background: rgba(255,255,255,0.08);
        color: var(--text, #e2e8f0);
      }
      .spe-toggle-smart {
        background: rgba(102, 126, 234, 0.08);
        border-color: rgba(102, 126, 234, 0.2);
        color: #667eea;
      }
      .spe-toggle-smart:hover {
        background: rgba(102, 126, 234, 0.15);
      }
      .spe-classic-toggle {
        margin: 6px 10px;
      }
    `;
    document.head.appendChild(style);
  }

  // ═══════════════════════════════════════════════
  // 4. Dept-Deep Gating — قفل SWOT حتى تكتمل 3 إدارات
  // ═══════════════════════════════════════════════

  /** الحد الأدنى من الإدارات المكتملة لفتح البوابة (تم تعديله لـ 1 ليتناسب مع الشركات ذات الإدارة الواحدة) */
  const DEPT_GATE_MIN = 1;

  /** الصفحات المقفلة خلف بوابة الإدارات */
  const GATED_PAGES = ['/swot.html', '/analysis.html', '/tows.html'];

  /**
   * قراءة حالة الإدارات المكتملة في dept-deep
   * @returns {{ completed: string[], pending: string[], total: number }}
   */
  function getDeptDeepStatus() {
    const ALL_DEPT_KEYS = ['compliance', 'finance', 'hr', 'sales', 'marketing', 'operations', 'support'];
    var completed = [], pending = [];
    try {
      var data = JSON.parse(localStorage.getItem('stratix_dept_deep_payload') || '{}');
      ALL_DEPT_KEYS.forEach(function (key) {
        if (data[key] && data[key].completed === true) {
          completed.push(key);
        } else {
          pending.push(key);
        }
      });
    } catch (e) {
      pending = ALL_DEPT_KEYS.slice();
    }
    return { completed: completed, pending: pending, total: ALL_DEPT_KEYS.length };
  }

  /**
   * هل بوابة الإدارات مفتوحة؟ (إدارة واحدة مكتملة على الأقل)
   */
  function isDeptDeepGateOpen() {
    return getDeptDeepStatus().completed.length >= DEPT_GATE_MIN;
  }

  /**
   * هل هذه الصفحة مقفلة خلف بوابة الإدارات؟
   */
  function isPageGated(href) {
    var clean = (href || '').split('?')[0];
    return GATED_PAGES.indexOf(clean) >= 0;
  }

  // ═══════════════════════════════════════════════
  // 5. تهيئة تلقائية
  // ═══════════════════════════════════════════════

  injectStyles();
  trackPageVisit();

  // ═══ Gating: إعادة توجيه إذا الصفحة مقفلة ═══
  (async function enforceGating() {
    var currentPage = window.location.pathname;
    if (isPageGated(currentPage) && !isDeptDeepGateOpen()) {
      // 🔒 التحقق الآمن من الصلاحية (عبر Backend و HttpOnly Cookie) بدلاً من localStorage
      try {
        const res = await fetch('/api/auth/profile', { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.systemRole === 'SUPER_ADMIN') return; // تخطي آمن لمدير النظام
        }
      } catch (e) { /* proceed with block */ }

      // عرض رسالة قفل بدل إعادة التوجيه المفاجئ
      document.addEventListener('DOMContentLoaded', function () {
        var deptStatus = getDeptDeepStatus();
        var mainEl = document.querySelector('main') || document.querySelector('.content-area') || document.body;
        mainEl.innerHTML = '<div style="text-align:center;padding:80px 20px;max-width:500px;margin:0 auto;">'
          + '<div style="font-size:64px;margin-bottom:20px;">🔒</div>'
          + '<h2 style="font-size:20px;font-weight:800;color:var(--text,#e2e8f0);margin:0 0 12px;">هذه الخطوة مقفلة</h2>'
          + '<p style="font-size:14px;color:var(--text-muted,#94a3b8);line-height:1.8;margin:0 0 8px;">أكمل فحص <strong style="color:#f59e0b">إدارة واحدة</strong> على الأقل في التحليل العميق قبل فتح هذه الأداة.</p>'
          + '<p style="font-size:13px;color:var(--text-muted,#94a3b8);margin:0 0 24px;">حالياً: <strong style="color:#22c55e">' + deptStatus.completed.length + '</strong> مكتملة من أصل ' + deptStatus.total + '</p>'
          + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">'
          + '<a href="/dept-deep.html" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#f59e0b,#ea580c);color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(245,158,11,0.3);"><i class="bi bi-building-fill-gear"></i> استكشاف الإدارات</a>'
          + '<a href="/dashboard.html" style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.06);color:var(--text-muted,#94a3b8);padding:12px 24px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,0.08);"><i class="bi bi-house"></i> الرئيسية</a>'
          + '</div></div>';
      });
    }
  })();

  // ═══════════════════════════════════════════════
  // 6. تصدير API عام
  // ═══════════════════════════════════════════════

  window.PathEngine = {
    getPath,
    getPatternKey,
    isPathMode,
    toggleMode,
    isPageAllowed,
    filterPhaseItems,
    filterPhases,
    getSmartProgress,
    buildProgressHTML,
    buildClassicToggleHTML,
    PATH_DEFINITIONS,

    // ═══ Dept-Deep Gating API ═══
    getDeptDeepStatus,
    isDeptDeepGateOpen,
    isPageGated,
    DEPT_GATE_MIN,

    /**
     * حساب الخطوات مع Gating — مثل Manager Journey
     * كل خطوة: completed | available | locked
     * يُطبّق أيضاً بوابة الإدارات على صفحات SWOT
     * @returns {Array|null} خطوات مع status، أو null لو مو في المسار الذكي
     */
    calculateAllowedSteps: function () {
      var path = getPath();
      if (!path || !path.steps) return null;
      var visited = getVisitedPages();
      var currentPage = window.location.pathname;
      var gateOpen = isDeptDeepGateOpen();

      return path.steps.map(function (step, idx) {
        var clean = step.href.split('?')[0];
        var isDone = visited.indexOf(clean) >= 0;
        var isCurrent = currentPage === clean;
        // الخطوة الأولى دائماً متاحة، الباقي يعتمد على اللي قبلها
        var prevClean = idx > 0 ? path.steps[idx - 1].href.split('?')[0] : null;
        var prevDone = idx === 0 || visited.indexOf(prevClean) >= 0;

        var status = 'locked';
        if (isDone) status = 'completed';
        else if (isCurrent) status = 'current';
        else if (prevDone) status = 'available';

        // ═══ بوابة الإدارات: أقفل SWOT/Analysis/TOWS إذا ما كملت 3 إدارات ═══
        if (isPageGated(clean) && !gateOpen && status !== 'completed') {
          status = 'locked';
        }

        return {
          label: step.label,
          href: step.href,
          icon: step.icon,
          phase: step.phase,
          index: idx + 1,
          status: status,
          clickable: status !== 'locked',
          gated: isPageGated(clean) && !gateOpen // علامة إضافية للـ UI
        };
      });
    },
  };

})();
