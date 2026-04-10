/**
 * Startix — Smart Path Engine v2 🚀
 * ══════════════════════════════════
 * نظام الحزم + المسارات الذكية
 *
 * الهيكل:
 *   الحزمة = حجم المنشأة (أساسي / احترافي / مؤسسي)
 *   المسار = 3 عوامل (حجم + سيولة + طموح)
 *   الأداة = موجودة فعلاً بالمنصة (لا نسخ مبتورة)
 *
 * المسارات الفعّالة: 5 فقط
 *   emergency_risk    → سيولة حرجة أو متعثرة
 *   nascent_cautious  → ناشئة / صغيرة
 *   growing_chaotic   → نمو سريع + حوكمة ضعيفة
 *   mature_competitive→ ناضجة + مستقرة مالياً
 *   default_strategic → الافتراضي (كل الأدوات)
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════
  // 1. تعريف الحزم حسب الحجم
  // ═══════════════════════════════════════════════

  const PACKAGES = {
    basic: {
      name: 'أساسي',
      emoji: '🌱',
      color: '#22c55e',
      maxEmployees: 30,
      toolCount: 12,
      // الأدوات المسموحة للحزمة الأساسية
      allowedPages: [
        // تشخيص
        '/tool-detail.html', '/company-health.html', '/pestel.html',
        // تركيب
        '/swot.html', '/risk-map.html',
        // اختيار
        '/directions.html',
        // بناء
        '/objectives.html', '/kpis.html',
        // تنفيذ
        '/initiatives.html', '/projects.html',
        // متابعة
        '/reviews.html',
        // نظام
        '/dashboard.html', '/settings.html', '/settings-data.html',
        '/entities.html', '/tools.html', '/onboarding.html',
        '/kpi-entries.html', '/tasks.html',
      ],
    },
    professional: {
      name: 'احترافي',
      emoji: '🚀',
      color: '#3b82f6',
      maxEmployees: 150,
      toolCount: 25,
      allowedPages: [
        // تشخيص خارجي
        '/tool-detail.html', '/pestel.html', '/benchmarking.html', '/stakeholders.html',
        // تشخيص داخلي
        '/company-health.html', '/dept-deep.html', '/org-dna.html',
        // تركيب
        '/swot.html', '/tows.html', '/risk-map.html', '/gap-analysis.html',
        // اختيار
        '/directions.html', '/scenarios.html', '/choices.html', '/bcg-matrix.html',
        // بناء
        '/objectives.html', '/kpis.html', '/okrs.html', '/ogsm.html', '/priority-matrix.html',
        // تنفيذ
        '/initiatives.html', '/projects.html', '/finance-audit.html',
        // متابعة
        '/reviews.html', '/corrections.html', '/reports.html',
        // نظام
        '/dashboard.html', '/ceo-dashboard.html', '/settings.html',
        '/settings-data.html', '/entities.html', '/tools.html',
        '/onboarding.html', '/kpi-entries.html', '/tasks.html',
        '/strategic-calendar.html',
      ],
    },
    enterprise: {
      name: 'مؤسسي',
      emoji: '🏢',
      color: '#8b5cf6',
      maxEmployees: Infinity,
      toolCount: 38,
      allowedPages: null, // كل شي مفتوح
    },
  };

  // ═══════════════════════════════════════════════
  // 2. تعريف المسارات — 5 فقط (لا كود ميّت)
  // ═══════════════════════════════════════════════

  const PATH_DEFINITIONS = {

    // ─── 1. مسار إدارة الأزمات 🆘 ───
    emergency_risk: {
      name: 'مسار الإنقاذ',
      nameEn: 'Crisis & Rescue Path',
      emoji: '🆘',
      color: '#ef4444',
      description: 'وقف النزيف + تقييم المخاطر + خطة بقاء 90 يوم',
      estimatedTime: '2-3 ساعات',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'خريطة المخاطر', href: '/risk-map.html', icon: 'bi-exclamation-triangle', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'التوجهات', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'التصحيحات', href: '/corrections.html', icon: 'bi-arrow-repeat', phase: 'ADAPTATION' },
      ],
      allowedPages: [
        '/onboarding.html', '/company-health.html', '/pestel.html', '/swot.html',
        '/risk-map.html', '/directions.html', '/objectives.html', '/kpis.html',
        '/initiatives.html', '/corrections.html', '/kpi-entries.html',
        '/break-even-result.html',
        '/dashboard.html', '/tools.html', '/tool-detail.html',
        '/settings.html', '/settings-data.html', '/entities.html',
      ],
    },

    // ─── 2. مسار التأسيس 🌱 ───
    nascent_cautious: {
      name: 'مسار التأسيس',
      nameEn: 'Foundation Path',
      emoji: '🌱',
      color: '#22c55e',
      description: 'أساس متين + خطة نمو مرحلية + مؤشرات قياس',
      estimatedTime: '3-4 ساعات',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'DNA المنظمة', href: '/org-dna.html', icon: 'bi-fingerprint', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'التوجهات', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'المهام', href: '/tasks.html', icon: 'bi-check2-square', phase: 'EXECUTION' },
        { label: 'إدخال المؤشرات', href: '/kpi-entries.html', icon: 'bi-pencil-square', phase: 'EXECUTION' },
      ],
      allowedPages: [
        '/onboarding.html', '/org-dna.html', '/company-health.html', '/swot.html',
        '/directions.html', '/objectives.html', '/kpis.html',
        '/initiatives.html', '/tasks.html', '/kpi-entries.html',
        '/dashboard.html', '/tools.html', '/tool-detail.html',
        '/settings.html', '/settings-data.html', '/entities.html',
      ],
    },

    // ─── 3. مسار النمو والتنظيم 🌪️ ───
    growing_chaotic: {
      name: 'مسار النمو',
      nameEn: 'Growth & Structure Path',
      emoji: '🚀',
      color: '#f59e0b',
      description: 'هيكلة العمليات + تحليل تنافسي + مؤشرات مركزية',
      estimatedTime: '4-6 ساعات',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'قوى بورتر', href: '/tool-detail.html?code=PORTER', icon: 'bi-shield-check', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'سلسلة القيمة', href: '/tool-detail.html?code=VALUE_CHAIN', icon: 'bi-link-45deg', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'مصفوفة TOWS', href: '/tows.html', icon: 'bi-arrows-fullscreen', phase: 'PLANNING' },
        { label: 'التوجهات', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'OKRs', href: '/okrs.html', icon: 'bi-layers', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'المراجعات', href: '/reviews.html', icon: 'bi-journal-check', phase: 'ADAPTATION' },
      ],
      allowedPages: [
        '/onboarding.html', '/company-health.html', '/swot.html', '/tows.html',
        '/stakeholders.html', '/dept-deep.html', '/benchmarking.html',
        '/directions.html', '/objectives.html', '/kpis.html', '/okrs.html',
        '/initiatives.html', '/tasks.html', '/kpi-entries.html', '/reviews.html',
        '/dashboard.html', '/tools.html', '/tool-detail.html',
        '/settings.html', '/settings-data.html', '/entities.html',
      ],
    },

    // ─── 4. مسار التميز 🏆 ───
    mature_competitive: {
      name: 'مسار التميز',
      nameEn: 'Market Leadership Path',
      emoji: '🏆',
      color: '#6366f1',
      description: 'تحليل تنافسي شامل + سيناريوهات + ذكاء استراتيجي',
      estimatedTime: '6-10 ساعات',
      steps: [
        { label: 'PESTEL', href: '/tool-detail.html?code=PESTEL', icon: 'bi-globe2', phase: 'DIAGNOSIS' },
        { label: 'قوى بورتر', href: '/tool-detail.html?code=PORTER', icon: 'bi-shield-check', phase: 'DIAGNOSIS' },
        { label: 'المقارنة المعيارية', href: '/benchmarking.html', icon: 'bi-bar-chart-line', phase: 'DIAGNOSIS' },
        { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-heart-pulse', phase: 'DIAGNOSIS' },
        { label: 'سلسلة القيمة', href: '/tool-detail.html?code=VALUE_CHAIN', icon: 'bi-link-45deg', phase: 'DIAGNOSIS' },
        { label: 'القدرات الجوهرية', href: '/tool-detail.html?code=CORE_COMPETENCY', icon: 'bi-trophy', phase: 'DIAGNOSIS' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap', phase: 'DIAGNOSIS' },
        { label: 'مصفوفة TOWS', href: '/tows.html', icon: 'bi-arrows-fullscreen', phase: 'PLANNING' },
        { label: 'التوجهات', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'OKRs', href: '/okrs.html', icon: 'bi-layers', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'السيناريوهات', href: '/scenarios.html', icon: 'bi-bezier2', phase: 'ADAPTATION' },
        { label: 'المراجعات', href: '/reviews.html', icon: 'bi-journal-check', phase: 'ADAPTATION' },
      ],
      allowedPages: null, // كل شي مفتوح
    },

    // ─── 5. المسار الاحترافي الشامل (الافتراضي) ───
    default_strategic: {
      name: 'المسار الشامل',
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
        { label: 'التوجهات', href: '/directions.html', icon: 'bi-compass', phase: 'PLANNING' },
        { label: 'الأهداف', href: '/objectives.html', icon: 'bi-bullseye', phase: 'PLANNING' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', phase: 'PLANNING' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban', phase: 'EXECUTION' },
        { label: 'المهام', href: '/tasks.html', icon: 'bi-check2-square', phase: 'EXECUTION' },
        { label: 'إدخال المؤشرات', href: '/kpi-entries.html', icon: 'bi-pencil-square', phase: 'EXECUTION' },
        { label: 'المراجعات', href: '/reviews.html', icon: 'bi-journal-check', phase: 'ADAPTATION' },
      ],
      allowedPages: null, // كل شي مفتوح
    },
  };

  // ═══════════════════════════════════════════════
  // 3. الدوال الأساسية
  // ═══════════════════════════════════════════════

  /**
   * تحديد الحزمة من حجم المنشأة
   */
  function getPackage() {
    let size = 0;
    try {
      // من بيانات التشخيص
      const diag = JSON.parse(localStorage.getItem('stratix_diagnostic_payload') || '{}');
      const sizeMap = { micro: 5, small: 15, medium: 60, large: 200 };
      size = sizeMap[diag.entity_size] || sizeMap[diag.teamSize] || 0;

      // من بيانات onboarding
      if (!size) {
        const ob = JSON.parse(localStorage.getItem('onboarding_data') || '{}');
        const obMap = { '1-10': 10, '1_10': 10, '11-50': 30, '11_50': 30, '51-200': 100, '51_200': 100, '200+': 250, '201-500': 350, '500+': 500 };
        size = obMap[ob.orgSize] || 0;
      }
    } catch (e) { /* ignore */ }

    if (size <= 30) return 'basic';
    if (size <= 150) return 'professional';
    return 'enterprise';
  }

  /**
   * قراءة نمط المسار من localStorage أو التشخيص
   */
  function getPatternKey() {
    try {
      const pa = window.Context ? JSON.stringify(Context.getItem('pain_ambition', {})) : localStorage.getItem('painAmbition');
      if (pa) {
        const parsed = JSON.parse(pa);
        const key = parsed.patternKey || 'default_strategic';
        // تأكد إن المسار موجود (لا نرجع مسار محذوف)
        return PATH_DEFINITIONS[key] ? key : 'default_strategic';
      }
    } catch (e) { /* ignore */ }
    return 'default_strategic';
  }

  /**
   * هل المسار الذكي مفعّل؟
   */
  function isPathMode() {
    const mode = localStorage.getItem('pathMode');
    if (mode === 'classic') return false;
    if (mode === 'smart') return true;
    return getPatternKey() !== 'default_strategic';
  }

  /**
   * تبديل بين الوضع الذكي والكلاسيكي
   */
  function toggleMode() {
    const current = isPathMode();
    localStorage.setItem('pathMode', current ? 'classic' : 'smart');
    window.location.reload();
  }

  /**
   * إرجاع تعريف المسار الحالي
   */
  function getPath() {
    if (!isPathMode()) return null;
    const key = getPatternKey();
    return PATH_DEFINITIONS[key] || PATH_DEFINITIONS.default_strategic;
  }

  /**
   * هل هذه الصفحة مسموح بها؟ (يجمع بين الحزمة والمسار)
   */
  function isPageAllowed(href) {
    const clean = href.split('?')[0];

    // فحص الحزمة أولاً
    const pkg = PACKAGES[getPackage()];
    if (pkg && pkg.allowedPages && !pkg.allowedPages.includes(clean)) {
      return false;
    }

    // فحص المسار الذكي
    if (!isPathMode()) return true;
    const path = getPath();
    if (!path || !path.allowedPages) return true;
    return path.allowedPages.includes(clean);
  }

  /**
   * دالة مساعدة لتصفية العناصر
   */
  function filterByAllowedPages(items, allowedPages) {
    if (!allowedPages) return items;
    return items.filter(item => {
      const clean = item.href.split('?')[0];
      return allowedPages.includes(clean);
    });
  }

  /**
   * فلترة عناصر phase بناءً على الحزمة + المسار
   */
  function filterPhaseItems(items) {
    let filtered = items;

    // فلتر الحزمة
    const pkg = PACKAGES[getPackage()];
    if (pkg && pkg.allowedPages) {
      filtered = filterByAllowedPages(filtered, pkg.allowedPages);
    }

    // فلتر المسار الذكي
    if (isPathMode()) {
      const path = getPath();
      if (path && path.allowedPages) {
        filtered = filterByAllowedPages(filtered, path.allowedPages);
      }
    }

    return filtered;
  }

  /**
   * فلترة مراحل الرحلة — إخفاء المراحل الفارغة
   */
  function filterPhases(phases) {
    return phases.map(phase => {
      return { ...phase, items: filterPhaseItems(phase.items) };
    }).filter(phase => phase.items.length > 0);
  }

  /**
   * حساب تقدم المسار الذكي
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
      if (visited.length > 50) visited.shift();
      localStorage.setItem('pathVisited', JSON.stringify(visited));
    }
  }

  function getVisitedPages() {
    try {
      return JSON.parse(localStorage.getItem('pathVisited') || '[]');
    } catch (e) { return []; }
  }

  // ═══════════════════════════════════════════════
  // 4. واجهة المستخدم — شريط التقدم
  // ═══════════════════════════════════════════════

  function buildProgressHTML() {
    const path = getPath();
    if (!path) return '';

    const progress = getSmartProgress();
    const pkg = PACKAGES[getPackage()];
    const phaseGroups = {};

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
            <span style="color:${pkg.color}">${pkg.emoji} ${pkg.name}</span>
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
  // 5. CSS
  // ═══════════════════════════════════════════════

  function injectStyles() {
    if (document.getElementById('spe-styles')) return;
    const style = document.createElement('style');
    style.id = 'spe-styles';
    style.textContent = `
      .spe-container {
        margin: 6px 10px;
        padding: 12px;
        border-radius: 12px;
        background: rgba(102, 126, 234, 0.06);
        border: 1px solid rgba(102, 126, 234, 0.15);
      }
      .spe-header { margin-bottom: 8px; }
      .spe-path-name { font-size: 13px; font-weight: 800; margin-bottom: 4px; }
      .spe-path-meta { display: flex; gap: 12px; font-size: 10.5px; color: var(--text-muted, #94a3b8); }
      .spe-progress-bar { height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; margin: 8px 0 4px; }
      .spe-progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
      .spe-progress-text { font-size: 10px; color: var(--text-muted, #94a3b8); text-align: center; margin-bottom: 8px; }
      .spe-phase-label { font-size: 10px; font-weight: 700; color: var(--text-muted, #94a3b8); margin: 8px 0 4px; padding-right: 4px; }
      .spe-step { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; text-decoration: none; color: var(--text, #e2e8f0); font-size: 12px; transition: all 0.2s; opacity: 0.7; }
      .spe-step:hover { background: rgba(255,255,255,0.06); opacity: 1; }
      .spe-step.done { opacity: 0.5; }
      .spe-step.current { background: rgba(102, 126, 234, 0.15); opacity: 1; font-weight: 700; border-right: 3px solid var(--primary, #667eea); }
      .spe-step-num { width: 22px; height: 22px; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
      .spe-step.done .spe-step-num { background: none; font-size: 14px; }
      .spe-step-label { flex: 1; }
      .spe-toggle { margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); }
      .spe-toggle-btn { width: 100%; padding: 7px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.04); color: var(--text-muted, #94a3b8); font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 6px; justify-content: center; transition: all 0.2s; font-family: inherit; }
      .spe-toggle-btn:hover { background: rgba(255,255,255,0.08); color: var(--text, #e2e8f0); }
      .spe-toggle-smart { background: rgba(102, 126, 234, 0.08); border-color: rgba(102, 126, 234, 0.2); color: #667eea; }
      .spe-toggle-smart:hover { background: rgba(102, 126, 234, 0.15); }
      .spe-classic-toggle { margin: 6px 10px; }
    `;
    document.head.appendChild(style);
  }

  // ═══════════════════════════════════════════════
  // 6. Dept-Deep Gating
  // ═══════════════════════════════════════════════

  const DEPT_GATE_MIN = 1;
  const GATED_PAGES = ['/pestel.html'];

  function getDeptDeepStatus() {
    const ALL_DEPT_KEYS = ['compliance', 'finance', 'hr', 'sales', 'marketing', 'operations', 'support'];
    var completed = [], pending = [];
    try {
      var data = window.Context ? Context.getItem('dept_deep_payload', {}) : JSON.parse(localStorage.getItem('stratix_dept_deep_payload') || '{}');
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

  function isDeptDeepGateOpen() {
    return getDeptDeepStatus().completed.length >= DEPT_GATE_MIN;
  }

  function isPageGated(href) {
    var clean = (href || '').split('?')[0];
    return GATED_PAGES.indexOf(clean) >= 0;
  }

  // ═══════════════════════════════════════════════
  // 7. تهيئة تلقائية
  // ═══════════════════════════════════════════════

  injectStyles();
  trackPageVisit();

  // ═══════════════════════════════════════════════
  // 8. تصدير API عام
  // ═══════════════════════════════════════════════

  window.PathEngine = {
    // الحزم
    PACKAGES,
    getPackage,

    // المسارات
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

    // Dept-Deep Gating
    getDeptDeepStatus,
    isDeptDeepGateOpen,
    isPageGated,
    DEPT_GATE_MIN,

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
        var prevClean = idx > 0 ? path.steps[idx - 1].href.split('?')[0] : null;
        var prevDone = idx === 0 || visited.indexOf(prevClean) >= 0;

        var status = 'locked';
        if (isDone) status = 'completed';
        else if (isCurrent) status = 'current';
        else if (prevDone) status = 'available';

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
          gated: isPageGated(clean) && !gateOpen
        };
      });
    },
  };

})();
