/**
 * Stratix — Sidebar v2 (الخيط الذهبي)
 * الهيكل الجديد:
 *   ⚡ مساري (أولويتي + لوحة القيادة + إشعارات)
 *   🧭 رحلتي الاستراتيجية (6 خطوات: الألم → بنيتنا → تشخيصي → خياراتي → تنفيذي → متابعتي)
 *   📈 رؤيتي (تقاريري + إصداراتي + محاكاة)
 *   💎 أدواتي المتقدمة (أدوات تحليلية)
 *   ⚙️ النظام (OWNER/ADMIN فقط)
 */
(function () {
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  const fullPath = currentPath + currentSearch;

  // === قراءة الدور ونوع المستخدم من localStorage ===
  let userRole = 'VIEWER';
  let systemRole = 'USER';
  let userType = 'COMPANY_MANAGER'; // افتراضي آمن
  let entityId = '';
  let token = '';
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      userRole = parsed.role || 'VIEWER';
      systemRole = parsed.systemRole || 'USER';
      userType = parsed.userType || 'COMPANY_MANAGER';
      entityId = (parsed.entity && parsed.entity.id) || parsed.activeEntityId || '';
    }
    token = localStorage.getItem('token') || '';
  } catch (e) { /* ignore */ }

  const isSuperAdmin = systemRole === 'SUPER_ADMIN';

  // === ربط أدوار V10 بنوع المستخدم (البوابة الذكية) ===
  // يقرأ الدور من التشخيص V10 ويربطه بالمسار المناسب
  let _v10Role = '';
  let _v10Size = '';
  try {
    const diagRaw = localStorage.getItem('stratix_diagnostic_payload');
    if (diagRaw) {
      const diag = JSON.parse(diagRaw);
      _v10Role = diag.role || '';   // founder, ceo, manager, cso, compliance, board
      _v10Size = diag.size || '';   // micro, small, medium, large, enterprise
    }
  } catch (e) { /* ignore */ }

  // ربط V10 role + size ← userType + المسار المناسب
  if (userType === 'COMPANY_MANAGER' || userType === 'EXPLORER') {
    if (_v10Role === 'founder') {
      // المسار يعتمد على الحجم
      if (_v10Size === 'micro' || _v10Size === 'small') {
        userType = 'EXPLORER';       // مسار ١ — الناشئة (مبسّط)
      } else {
        userType = 'COMPANY_MANAGER'; // مسار ٢ — متوسطة+
      }
    } else if (_v10Role === 'ceo' || _v10Role === 'cso') {
      userType = 'COMPANY_MANAGER'; // مسار ٢ أو ٤ حسب الحجم
    } else if (_v10Role === 'manager') {
      userType = 'DEPT_MANAGER';    // مسار ٣ — مدير إدارة
    } else if (_v10Role === 'compliance' || _v10Role === 'board') {
      userType = 'COMPANY_MANAGER'; // مسار ٢ أو ٤ حسب الحجم
    }
  }

  // === قواعد الرؤية حسب نوع المستخدم ===
  // EXPLORER:        المسار ١ — رحلة مبسطة (مالية + AI بسيط)
  // COMPANY_MANAGER:  المسار ٢ — كل الأدوات الاستراتيجية
  // DEPT_MANAGER:     المسار ٣ — أدوات الإدارة فقط
  // CONSULTANT:       المسار ٣ — كل شيء + multi-entity
  const typeRules = {
    EXPLORER: { showJourney: true, showVision: false, showAdvanced: false, limitedDiagnosis: true },
    COMPANY_MANAGER: { showJourney: true, showVision: true, showAdvanced: true, limitedDiagnosis: false },
    DEPT_MANAGER: { showJourney: false, showVision: true, showAdvanced: false, limitedDiagnosis: false },
    CONSULTANT: { showJourney: true, showVision: true, showAdvanced: true, limitedDiagnosis: false },
  };
  const currentRules = typeRules[userType] || typeRules.COMPANY_MANAGER;
  // SUPER_ADMIN and OWNER always see everything
  if (isSuperAdmin || userRole === 'OWNER') {
    currentRules.showJourney = true;
    currentRules.showVision = true;
    currentRules.showAdvanced = true;
    currentRules.limitedDiagnosis = false;
  }

  // === قراءة نمط الشركة ===
  let patternKey = 'default';
  try {
    const pa = localStorage.getItem('painAmbition');
    if (pa) {
      const parsed = JSON.parse(pa);
      patternKey = parsed.patternKey || 'default';
    }
  } catch (e) { /* ignore */ }

  // === كشف نوع المستخدم: 5 مستويات ===
  // INDIVIDUAL = فرد | FOUNDER = مؤسس (0-10) | SMALL = صغيرة (11-50) | MEDIUM = متوسطة (51-200) | LARGE = كبيرة (200+)
  let _sidebarIsIndividual = false; // [SIMPLIFIED] لا وضع شخصي حالياً
  let _sidebarCompanyLevel = 'MEDIUM'; // افتراضي آمن — كل الأدوات ظاهرة

  function _detectLevelFromCategory(cat) {
    // [SIMPLIFIED] تجاهل الوضع الشخصي حالياً
    // [BACKUP] if (cat.startsWith('INDIVIDUAL_') || cat === 'CONSULTANT_SOLO') { _sidebarIsIndividual = true; return; }
    if (cat.startsWith('INDIVIDUAL_') || cat === 'CONSULTANT_SOLO') { _sidebarIsIndividual = false; return; }
    if (cat === 'NEW_PROJECT') _sidebarCompanyLevel = 'FOUNDER';
    else if (cat === 'COMPANY_MICRO') _sidebarCompanyLevel = 'FOUNDER';
    else if (cat === 'COMPANY_SMALL') _sidebarCompanyLevel = 'SMALL';
    else if (cat === 'COMPANY_MEDIUM') _sidebarCompanyLevel = 'MEDIUM';
    else if (cat === 'COMPANY_LARGE') _sidebarCompanyLevel = 'LARGE';
    else if (cat === 'COMPANY_ENTERPRISE') _sidebarCompanyLevel = 'LARGE';
    else if (cat === 'CEO' || cat.startsWith('DEPT_')) _sidebarCompanyLevel = 'LARGE';
    else if (cat === 'CONSULTANT_AGENCY') _sidebarCompanyLevel = 'MEDIUM';
  }

  try {
    // 1. من بيانات Smart Guide
    const sgRaw = localStorage.getItem('stratix_smart_guide');
    if (sgRaw) {
      const sgParsed = JSON.parse(sgRaw);
      _detectLevelFromCategory(sgParsed.category || '');
    }
    // 2. من stratix_category
    if (!_sidebarIsIndividual) {
      const cat = localStorage.getItem('stratix_category') || '';
      if (cat) _detectLevelFromCategory(cat);
    }
    // 3. من onboarding_data (حجم المنظمة الفعلي)
    const obRaw = localStorage.getItem('onboarding_data');
    if (obRaw && !_sidebarIsIndividual) {
      const ob = JSON.parse(obRaw);
      const size = (ob.orgSize || '').toLowerCase();
      if (['1-10', 'micro', '1_10'].includes(size)) _sidebarCompanyLevel = 'FOUNDER';
      else if (['11-50', 'small', '11_50'].includes(size)) _sidebarCompanyLevel = 'SMALL';
      else if (['51-200', 'medium', '51_200'].includes(size)) _sidebarCompanyLevel = 'MEDIUM';
      else if (['200+', '201-500', '500+', 'large', 'enterprise', '201_500'].includes(size)) _sidebarCompanyLevel = 'LARGE';
    }
    // 4. من بيانات اليوزر المحفوظة من السيرفر
    if (!_sidebarIsIndividual) {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        const uCat = u.userCategory || u.category || '';
        if (uCat) _detectLevelFromCategory(uCat);
      }
    }
  } catch (e) { /* ignore */ }

  // حفظ المستوى للاستخدام في الداشبورد
  try { localStorage.setItem('_sidebarCompanyLevel', _sidebarIsIndividual ? 'INDIVIDUAL' : _sidebarCompanyLevel); } catch (e) { }

  // === ترتيب المستويات للفلترة ===
  const LEVEL_ORDER = { FOUNDER: 1, SMALL: 2, MEDIUM: 3, LARGE: 4 };
  const _lvl = LEVEL_ORDER[_sidebarCompanyLevel] || 3;

  // === محرك المسارات الذكية (يُقرأ ديناميكياً داخل buildSidebar) ===

  // === رحلتي الاستراتيجية: 4 مراحل (المنهجية المتكاملة الجديدة) ===
  const journeyPhases = [
    {
      id: 'DEPT_ANALYSIS',
      nameAr: 'تحليل الإدارات',
      icon: 'bi-building-fill-gear',
      emoji: '🏢',
      color: '#667eea',
      items: [
        { label: 'الامتثال والحوكمة', href: '/dept-deep.html?dept=compliance', icon: 'bi-shield-fill-check' },
        { label: 'المالية', href: '/dept-deep.html?dept=finance', icon: 'bi-cash-coin' },
        { label: 'المبيعات', href: '/dept-deep.html?dept=sales', icon: 'bi-graph-up-arrow' },
        { label: 'الموارد البشرية', href: '/dept-deep.html?dept=hr', icon: 'bi-people-fill' },
        { label: 'التسويق', href: '/dept-deep.html?dept=marketing', icon: 'bi-megaphone-fill' },
        { label: 'العمليات', href: '/dept-deep.html?dept=operations', icon: 'bi-gear-wide-connected' },
        { label: 'الخدمات المساندة', href: '/dept-deep.html?dept=support', icon: 'bi-wrench-adjustable' },
      ]
    },
    {
      id: 'ENVIRONMENT',
      nameAr: 'التحليل البيئي',
      icon: 'bi-globe-americas',
      emoji: '🌍',
      color: '#f59e0b',
      items: [
        // PESTEL — CEO فقط (مسار ٢)
        { label: 'PESTEL (خارجي)', href: '/analysis.html', icon: 'bi-binoculars-fill', pathOnly: ['COMPANY_MANAGER', 'CONSULTANT'] },
        { label: 'البيئة الداخلية', href: '/internal-env.html', icon: 'bi-building-fill-check' },
        // أصحاب المصلحة + المخاطر — CEO فقط + حجم كبير
        _lvl >= 4 ? { label: 'أصحاب المصلحة', href: '/stakeholders.html', icon: 'bi-people-fill', pathOnly: ['COMPANY_MANAGER', 'CONSULTANT'] } : null,
        _lvl >= 3 ? { label: 'خريطة المخاطر', href: '/risk-map.html', icon: 'bi-exclamation-triangle-fill', pathOnly: ['COMPANY_MANAGER', 'CONSULTANT'] } : null,
      ].filter(Boolean)
    },
    {
      id: 'UNIFIED_SWOT',
      nameAr: 'SWOT الموحد',
      icon: 'bi-grid-fill',
      emoji: '⚔️',
      color: '#10b981',
      items: [
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap-fill' },
        // TOWS — CEO فقط
        { label: 'مصفوفة TOWS', href: '/tows.html', icon: 'bi-arrows-fullscreen', pathOnly: ['COMPANY_MANAGER', 'CONSULTANT'] },
        { label: 'التوجهات الاستراتيجية', href: '/directions.html', icon: 'bi-compass-fill' },
      ]
    },
    {
      id: 'INTEGRATION',
      nameAr: 'الدمج الاستراتيجي',
      icon: 'bi-link-45deg',
      emoji: '🔗',
      color: '#8b5cf6',
      items: [
        // الأهداف + OKRs — CEO + Manager (مخفية للريادي)
        { label: 'الأهداف الاستراتيجية', href: '/objectives.html', icon: 'bi-bullseye', pathOnly: ['COMPANY_MANAGER', 'DEPT_MANAGER', 'CONSULTANT'] },
        { label: 'OKRs', href: '/okrs.html', icon: 'bi-layers-fill', pathOnly: ['COMPANY_MANAGER', 'DEPT_MANAGER', 'CONSULTANT'] },
        { label: 'مؤشرات الأداء (KPIs)', href: '/kpis.html', icon: 'bi-graph-up-arrow' },
        { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban-fill', pathOnly: ['COMPANY_MANAGER', 'DEPT_MANAGER', 'CONSULTANT'] },
        { label: 'المهام', href: '/tasks.html', icon: 'bi-check2-square' },
        { label: 'الخطة السنوية', href: '/annual-plan.html', icon: 'bi-calendar-range', pathOnly: ['COMPANY_MANAGER', 'CONSULTANT'] },
      ]
    },
  ];

  // === 📊 التقارير ===
  const reportsItems = [
    { label: 'تقاريري', href: '/auto-reports.html', icon: 'bi-file-earmark-bar-graph', roles: [] },
    { label: 'الفحص المالي', href: '/finance-audit.html', icon: 'bi-clipboard2-pulse-fill', roles: [] },
    { label: 'المقارنة المعيارية', href: '/benchmarking.html', icon: 'bi-bar-chart-line-fill', roles: [] },
  ];

  // === 💎 الأدوات ===
  const toolsItems = [
    // ـــ التأسيس والإعداد ـــ
    { label: 'الكيانات', href: '/entities.html', icon: 'bi-building-fill', roles: [] },
    { label: 'الفريق الاستراتيجي', href: '/team.html', icon: 'bi-person-lines-fill', roles: [] },
    { label: 'القطاعات والأنشطة', href: '/sectors.html', icon: 'bi-grid-3x3-gap-fill', roles: [] },
    // ـــ المتابعة والتنفيذ ـــ
    { label: 'إدخال المؤشرات', href: '/kpi-entries.html', icon: 'bi-pencil-square', roles: [] },
    { label: 'معمل الاجتماعات', href: '/meeting-lab.html', icon: 'bi-people-fill', roles: [] },
    { label: 'المشاريع', href: '/projects.html', icon: 'bi-folder2-open', roles: [] },
    { label: 'التقييمات', href: '/assessments.html', icon: 'bi-clipboard-check-fill', roles: [] },
    // ـــ أدوات ذكية ـــ
    { label: 'الأدوات الاستراتيجية', href: '/tools.html', icon: 'bi-tools', roles: [] },
    { label: 'الذكاء الاستراتيجي', href: '/intelligence.html', icon: 'bi-robot', roles: [] },
    { label: 'المستشار الاستراتيجي', href: '/strategic-advisor.html', icon: 'bi-cpu-fill', roles: [] },
    { label: 'مختبر المحاكاة', href: '/simulation-lab.html', icon: 'bi-bezier2', roles: ['OWNER', 'ADMIN', 'EDITOR'] },
    { label: 'اللوحة الحية', href: '/live-board.html', icon: 'bi-display-fill', roles: ['OWNER', 'ADMIN'] },
    { label: 'مركز الذكاء', href: '/ai-center.html', icon: 'bi-cpu-fill', roles: ['OWNER', 'ADMIN'] },
  ];

  // === ⚙️ النظام (OWNER/ADMIN فقط) ===
  const systemItems = [
    { label: 'لوحة الإدارة', href: '/admin-panel.html', icon: 'bi-shield-lock-fill' },
    { label: 'المستخدمون', href: '/users.html', icon: 'bi-people-fill' },
    { label: 'استيراد البيانات', href: '/import.html', icon: 'bi-cloud-upload-fill' },
    { label: 'سجل النشاطات', href: '/activity-feed.html', icon: 'bi-activity' },
    { label: 'الإعدادات', href: '/settings.html', icon: 'bi-gear-fill' },
    { label: 'البيانات الأساسية', href: '/settings-data.html', icon: 'bi-database-fill-gear' },
    { label: 'إعدادات النظام', href: '/admin-dashboard.html#settings', icon: 'bi-gear-wide-connected' },
  ];

  // === Helper: صلاحيات ===
  function hasAccess(allowedRoles) {
    if (isSuperAdmin) return true;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(userRole);
  }

  // === Helper: هل الرابط نشط؟ ===
  function isActive(href) {
    if (href === fullPath) return true;
    if (href === currentPath) return true;
    if (currentPath.endsWith('.html') && href === currentPath) return true;
    if (currentPath === '/' + href.replace('/', '')) return true;
    // Handle query parameter matching (e.g. /dept-deep.html?dept=hr)
    if (href.includes('?')) {
      const [hPath, hQuery] = href.split('?');
      if (currentPath === hPath && currentSearch === '?' + hQuery) return true;
    }
    return false;
  }

  // === بناء HTML السايدبار ===
  function buildSidebar(progressData) {
    // قراءة محرك المسارات في كل مرة يُبنى الـ sidebar
    const PE = window.PathEngine || null;
    const isSmartPath = PE ? PE.isPathMode() : false;

    let html = '';

    // --- بادج اليوزر + الجهة ---
    let userName = '';
    let userEmail = '';
    let entityLegalName = '';
    let companyNameAr = '';
    let userRoleLabel = '';
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        userName = u.name || '';
        userEmail = u.email || '';
        entityLegalName = u.entity?.legalName || u.entity?.displayName || '';
        companyNameAr = u.entity?.company?.nameAr || u.entity?.company?.nameEn || '';
        const roleMap = { OWNER: 'مالك', ADMIN: 'مدير', EDITOR: 'محرر', VIEWER: 'مشاهد' };
        // أولاً: التسمية حسب userType (أدق من role)
        const typeMap = { DEPT_MANAGER: 'مدير إدارة', CONSULTANT: 'مستشار', INDIVIDUAL: 'فرد', COMPANY_MANAGER: 'مالك' };
        userRoleLabel = typeMap[u.userType] || roleMap[u.role] || u.role || '';
        if (u.systemRole === 'SUPER_ADMIN') userRoleLabel = 'مدير النظام';
      }
    } catch (e) { /* ignore */ }

    const initial = userName ? userName[0] : 'S';
    const orgLine = companyNameAr || entityLegalName;

    html += `
      <div class="stx-user-card">
        <div class="stx-user-avatar">${initial}</div>
        <div class="stx-user-info">
          <div class="stx-user-name">${userName || 'المستخدم'}</div>
          ${userRoleLabel ? `<span class="stx-user-role">${userRoleLabel}</span>` : ''}
        </div>
      </div>
      ${(orgLine && !_sidebarIsIndividual) ? `
      <div class="stx-org-badge">
        <i class="bi bi-building"></i>
        <span>${orgLine}</span>
      </div>
      ` : ''}
    `;

    // --- detect viewer/data-entry early ---
    const isViewerOrDE = ['VIEWER', 'DATA_ENTRY'].includes(userRole) && systemRole !== 'SUPER_ADMIN';

    // ╔═══════════════════════════════════════════╗
    // ║  🏠 الرئيسية — زر العودة الدائم            ║
    // ╚═══════════════════════════════════════════╝
    const homeHref = isViewerOrDE ? '/viewer-hub.html' : '/dashboard.html';
    const isHomeActive = isActive('/dashboard.html') || isActive('/viewer-hub.html');
    html += `
      <a href="${homeHref}" class="stx-item stx-home-btn ${isHomeActive ? 'active' : ''}">
        <i class="bi bi-house-door-fill" style="color:#667eea;font-size:16px"></i>
        <span>الرئيسية</span>
      </a>
    `;

    // ╔═══════════════════════════════════════════════════════════╗
    // ║  🎯 مسار مدير الإدارة — سايدبار نظيف (٣ أقسام فقط)      ║
    // ╚═══════════════════════════════════════════════════════════╝
    if (userType === 'DEPT_MANAGER' && !isViewerOrDE) {

      // === قراءة تقدم الرحلة من localStorage ===
      let mgrJourney = { steps: [false, false, false, false] };
      try {
        const saved = localStorage.getItem('stratix_mgr_journey');
        if (saved) mgrJourney = JSON.parse(saved);
      } catch (e) { /* ignore */ }

      const journeySteps = [
        { num: 1, label: 'البيئة الداخلية', href: '/internal-env.html', icon: 'bi-building-fill-check' },
        { num: 2, label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap-fill' },
        { num: 3, label: 'التوجهات', href: '/directions.html', icon: 'bi-compass-fill' },
        { num: 4, label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow' },
      ];

      // حساب التقدم
      const completedCount = mgrJourney.steps.filter(Boolean).length;
      const journeyPercent = Math.round((completedCount / 4) * 100);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // القسم ١: 🏠 لوحتي
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      html += `<div class="stx-section-label"><i class="bi bi-house-heart-fill" style="color:#667eea;margin-left:4px"></i> لوحتي</div>`;
      const isDeptDashActive = isActive('/dept-dashboard.html');
      html += `
        <a href="/dept-dashboard.html" class="stx-item ${isDeptDashActive ? 'active' : ''}">
          <i class="bi bi-speedometer2" style="color:#f59e0b"></i>
          <span>لوحة الإدارة</span>
        </a>
      `;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // القسم ٢: ⚡ رحلتي (4 خطوات)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      html += `<div class="stx-divider"></div>`;
      html += `<div class="stx-section-label"><i class="bi bi-lightning-charge-fill" style="color:#f59e0b;margin-left:4px"></i> رحلتي</div>`;

      journeySteps.forEach((step, idx) => {
        const isDone = mgrJourney.steps[idx];
        const prevDone = idx === 0 ? true : mgrJourney.steps[idx - 1];
        const isCurrent = isActive(step.href);
        // استثناء: لو المستخدم سبق وزار الصفحة — ما نقفلها
        const hasVisited = mgrJourney.steps[idx] || isCurrent;
        const isLocked = !prevDone && !hasVisited && !isSuperAdmin && userRole !== 'OWNER';

        let statusIcon, statusClass, stepColor;
        if (isDone) {
          statusIcon = '✅';
          statusClass = 'mgr-done';
          stepColor = '#22c55e';
        } else if (isCurrent) {
          statusIcon = '🔵';
          statusClass = 'mgr-current';
          stepColor = '#3b82f6';
        } else if (isLocked) {
          statusIcon = '🔒';
          statusClass = 'mgr-locked';
          stepColor = '#64748b';
        } else {
          statusIcon = '⬜';
          statusClass = 'mgr-pending';
          stepColor = '#94a3b8';
        }

        if (isLocked) {
          html += `
            <div class="stx-item stx-mgr-step ${statusClass}" style="opacity:0.45;cursor:not-allowed;padding:10px 14px" title="أكمل الخطوة السابقة أولاً">
              <span style="font-size:14px;min-width:22px">${statusIcon}</span>
              <span class="stx-item-label" style="color:${stepColor}">${step.num}. ${step.label}</span>
            </div>
          `;
        } else {
          html += `
            <a href="${step.href}" class="stx-item stx-mgr-step ${statusClass} ${isCurrent ? 'active' : ''}" style="padding:10px 14px">
              <span style="font-size:14px;min-width:22px">${statusIcon}</span>
              <span class="stx-item-label" style="color:${isCurrent ? '#fff' : stepColor};font-weight:${isCurrent ? '700' : '500'}">${step.num}. ${step.label}</span>
              ${isCurrent ? '<span style="font-size:10px;color:#93c5fd;margin-right:auto">← أنت هنا</span>' : ''}
            </a>
          `;
        }
      });

      // شريط تقدم الرحلة
      const progressColor = journeyPercent === 100 ? '#22c55e' : journeyPercent > 0 ? '#3b82f6' : '#64748b';
      html += `
        <div style="margin:8px 14px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:11px;color:var(--text-muted,#94a3b8)">📊 تقدم الرحلة</span>
            <span style="font-size:12px;font-weight:700;color:${progressColor}">${journeyPercent}%</span>
          </div>
          <div style="height:4px;border-radius:4px;background:rgba(255,255,255,0.08)">
            <div style="height:100%;width:${journeyPercent}%;border-radius:4px;background:${progressColor};transition:width 0.5s ease"></div>
          </div>
        </div>
      `;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // القسم ٣: 📊 عملي
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      html += `<div class="stx-divider"></div>`;
      html += `<div class="stx-section-label"><i class="bi bi-clipboard2-check-fill" style="color:#22c55e;margin-left:4px"></i> عملي</div>`;

      const workItems = [
        { label: 'المهام', href: '/tasks.html', icon: 'bi-check2-square', color: '#f59e0b' },
        { label: 'إدخال المؤشرات', href: '/kpi-entries.html', icon: 'bi-pencil-square', color: '#3b82f6' },
        { label: 'تقرير إدارتي', href: '/auto-reports.html', icon: 'bi-file-earmark-bar-graph', color: '#22c55e' },
      ];
      workItems.forEach(item => {
        html += `
          <a href="${item.href}" class="stx-item ${isActive(item.href) ? 'active' : ''}">
            <i class="bi ${item.icon}" style="color:${item.color}"></i>
            <span class="stx-item-label">${item.label}</span>
          </a>
        `;
      });

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ⚙️ الإعدادات
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      html += `<div class="stx-divider"></div>`;
      const isSettingsActive = isActive('/settings.html');
      html += `
        <a href="/settings.html" class="stx-item ${isSettingsActive ? 'active' : ''}" style="opacity:0.7">
          <i class="bi bi-gear-fill" style="color:#64748b"></i>
          <span class="stx-item-label">الإعدادات</span>
        </a>
      `;

      // --- تسجيل الخروج ---
      html += `<div class="stx-divider"></div>`;
      html += `
        <a href="#" class="stx-item stx-logout" onclick="event.preventDefault(); localStorage.clear(); location.href='/login.html';" style="color:#ef4444;margin-top:4px">
          <i class="bi bi-box-arrow-right" style="color:#ef4444"></i>
          <span>تسجيل الخروج</span>
        </a>
        <div style="height:20px"></div>
      `;

      // تعريض دالة إكمال الخطوة للصفحات
      window.stratixMgrComplete = function (stepNum) {
        try {
          let j = { steps: [false, false, false, false] };
          const s = localStorage.getItem('stratix_mgr_journey');
          if (s) j = JSON.parse(s);
          if (stepNum >= 1 && stepNum <= 4) {
            j.steps[stepNum - 1] = true;
          }
          localStorage.setItem('stratix_mgr_journey', JSON.stringify(j));
          console.log('[Sidebar] ✅ Manager journey step ' + stepNum + ' completed');
        } catch (e) { /* ignore */ }
      };

      return html; // ← خروج مبكر — لا يكمل بناء الأقسام الباقية
    }
    // ╔═════════════════════════════════════════════════════╗
    // ║  ↓ باقي الكود: مسار CEO / ريادي / مستشار (كما هو)  ║
    // ╚═════════════════════════════════════════════════════╝

    // ╔═══════════════════════════════════════════╗
    // ║  ⚡ مساري — القسم الأول                     ║
    // ╚═══════════════════════════════════════════╝
    html += '<div class="stx-section-label"><i class="bi bi-lightning-charge-fill" style="color:#667eea;margin-left:4px"></i> مساري</div>';

    // === لوحة القيادة — حسب نوع المستخدم ===
    if (userType === 'DEPT_MANAGER') {
      // مدير إدارة ← لوحة الإدارة
      const isDeptActive = isActive('/dept-dashboard.html');
      html += `
        < a href = "/dept-dashboard.html" class="stx-item stx-mypath ${isDeptActive ? 'active' : ''}" >
        <i class="bi bi-building-fill-gear" style="color:#f59e0b"></i>
        <span>لوحة إدارتي</span>
      </a >
        `;
    } else if (userType === 'CONSULTANT') {
      // مستشار ← لوحة الاستشاري
      const isConsActive = isActive('/consultant-dashboard.html');
      html += `
        < a href = "/consultant-dashboard.html" class="stx-item stx-mypath ${isConsActive ? 'active' : ''}" >
        <i class="bi bi-briefcase-fill" style="color:#10b981"></i>
        <span>لوحة الاستشاري</span>
      </a >
        `;
    } else if (hasAccess(['OWNER', 'ADMIN'])) {
      // CEO / مؤسس / مدير عام ← لوحة القيادة
      const isCeoActive = isActive('/ceo-dashboard.html');
      html += `
        < a href = "/ceo-dashboard.html" class="stx-item stx-mypath ${isCeoActive ? 'active' : ''}" >
        <i class="bi bi-gem" style="color:#a78bfa"></i>
        <span>لوحة القيادة</span>
      </a >
        `;
    }

    // اللوحة التنفيذية (LARGE + OWNER/ADMIN)
    if (_lvl >= 4 && hasAccess(['OWNER', 'ADMIN'])) {
      const isExecActive = isActive('/exec-dashboard.html');
      html += `
        < a href = "/exec-dashboard.html" class="stx-item stx-mypath ${isExecActive ? 'active' : ''}" >
        <i class="bi bi-bar-chart-fill" style="color:#6366f1"></i>
        <span>اللوحة التنفيذية</span>
      </a >
        `;
    }

    // --- شريط التقدم (ذكي أو عام) ---
    if (!isViewerOrDE) {
      if (isSmartPath && PE) {
        // المسار الذكي — شريط تقدم مخصص
        html += PE.buildProgressHTML();
      } else {
        // المسار الكلاسيكي — شريط تقدم عام
        const overall = progressData ? progressData.overall : 0;
        html += `
        < div class="stx-progress-bar-container" >
          <div class="stx-progress-label">
            <span>التقدم الكلي</span>
            <span class="stx-progress-percent">${overall}%</span>
          </div>
          <div class="stx-progress-track">
            <div class="stx-progress-fill" style="width:${overall}%"></div>
          </div>
        </div >
        `;
        // زر التبديل للمسار الذكي (يظهر فقط لو عنده نمط محدد)
        if (PE) {
          html += PE.buildClassicToggleHTML();
        }
      }
    }

    // === رحلة مدير الإدارة (مسار ٣) ===
    if (!isViewerOrDE && userType === 'DEPT_MANAGER' && !isSmartPath) {
      html += '<div class="stx-divider"></div>';
      html += '<div class="stx-section-label"><i class="bi bi-building-fill-gear" style="color:#f59e0b;margin-left:4px"></i> إدارتي</div>';

      const deptItems = [
        { label: 'لوحة إدارتي', href: '/dept-dashboard.html', icon: 'bi-speedometer2' },
        { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap-fill' },
        { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow' },
        { label: 'إدخال المؤشرات', href: '/kpi-entries.html', icon: 'bi-pencil-square' },
        { label: 'المهام', href: '/tasks.html', icon: 'bi-check2-square' },
        { label: 'تقرير إدارتي', href: '/auto-reports.html', icon: 'bi-file-earmark-bar-graph' },
      ];
      deptItems.forEach(item => {
        html += `
        < a href = "${item.href}" class="stx-item ${isActive(item.href) ? 'active' : ''}" >
            <i class="bi ${item.icon}"></i>
            <span class="stx-item-label">${item.label}</span>
          </a >
        `;
      });
    }

    // ╔═══════════════════════════════════════════╗
    // ║  🧭 رحلتي الاستراتيجية                     ║
    // ╚═══════════════════════════════════════════╝
    if (!isViewerOrDE && currentRules.showJourney && !isSmartPath) {
      // === المسار الكلاسيكي: عرض كل المراحل ===
      html += '<div class="stx-divider"></div>';
      html += '<div class="stx-section-label"><i class="bi bi-compass-fill" style="color:#667eea;margin-left:4px"></i> رحلتي الاستراتيجية</div>';

      // --- حالة البيانات ---
      const isOnboardingActive = isActive('/onboarding.html');
      const isDnaActive = isActive('/org-dna.html');
      const isPainActive = isActive('/pain-screen.html');

      // الألم والطموح (نقطة الدخول)
      html += `
        < a href = "/pain-screen.html" class="stx-item stx-phase0 ${isPainActive ? 'active' : ''}" style = "margin:2px 10px 4px;border-radius:10px;padding:8px 14px !important;border-right:none !important;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);" >
        <i class="bi bi-heart-pulse-fill" style="font-size:14px;color:#ef4444"></i>
        <span style="font-weight:600;font-size:12px">الألم والطموح</span>
      </a >
        `;

      // إعداد المنظمة
      html += `
        < a href = "/onboarding.html" class="stx-item stx-phase0 ${isOnboardingActive ? 'active' : ''}" style = "margin:2px 10px 4px;border-radius:10px;padding:10px 14px !important;border-right:none !important;background:rgba(102,126,234,0.08);border:1px solid rgba(102,126,234,0.2);" >
        <i class="bi bi-rocket-takeoff-fill" style="font-size:15px;color:#667eea"></i>
        <span style="font-weight:700;font-size:12.5px">إعداد المنظمة</span>
      </a >
        <a href="/org-dna.html" class="stx-item stx-dna-link ${isDnaActive ? 'active' : ''}" style="margin:-2px 18px 4px;padding:6px 12px !important;border-radius:8px;font-size:11.5px;opacity:0.85">
          <i class="bi bi-fingerprint" style="color:#ec4899;font-size:13px"></i>
          <span>هوية المنظمة (DNA)</span>
        </a>
      `;

      // --- المراحل الخمس ---
      journeyPhases.forEach((phase, idx) => {
        const stageData = progressData && progressData.stages
          ? progressData.stages.find(s => s.id === phase.id)
          : null;
        const percent = stageData ? stageData.percent : 0;
        const completed = stageData ? stageData.completed : false;

        const isHighRole = systemRole === 'SUPER_ADMIN' || ['OWNER', 'ADMIN'].includes(userRole);
        const isLocked = isHighRole ? false : (stageData ? !!stageData.locked : (idx > 0));
        const unlockMsg = stageData ? (stageData.unlockMsg || '') : '';

        let statusIcon = '<i class="bi bi-square" style="font-size:13px;color:var(--text-muted,#94a3b8)"></i>';
        let statusClass = 'locked';
        if (isLocked) {
          statusIcon = '<i class="bi bi-lock-fill" style="font-size:13px;color:#ef4444"></i>';
          statusClass = 'phase-locked';
        } else if (completed) {
          statusIcon = '<i class="bi bi-check-circle-fill" style="font-size:13px;color:#22c55e"></i>';
          statusClass = 'completed';
        } else if (percent > 0) {
          statusIcon = '<i class="bi bi-circle-fill" style="font-size:10px;color:#3b82f6"></i>';
          statusClass = 'in-progress';
        }

        const hasActiveItem = !isLocked && phase.items.some(item => isActive(item.href));
        const isCurrentPhase = !isLocked && (statusClass === 'in-progress' || hasActiveItem);
        // ✅ مطوي افتراضياً — يفتح فقط إذا المستخدم في هالقسم أو فيه عنصر نشط
        const isOpen = hasActiveItem;

        if (isLocked) {
          html += `
        < div class="stx-phase phase-locked" data - phase="${idx}" >
          <div class="stx-phase-header" onclick="showLockToast('${unlockMsg || 'أكمل المرحلة السابقة أولاً'}')" style="--phase-color: ${phase.color}; opacity:0.45; cursor:not-allowed">
            <span class="stx-phase-status"><i class="bi bi-lock-fill" style="font-size:13px;color:#ef4444"></i></span>
            <span class="stx-phase-name">
              <i class="bi ${phase.icon}" style="color:${phase.color}"></i>
              ${phase.nameAr}
            </span>
            <span class="stx-phase-pct" style="color:var(--text-muted);font-size:10px">${unlockMsg || 'مقفل'}</span>
          </div>
          </div >
        `;
        } else {
          html += `
        < div class="stx-phase ${statusClass} ${isOpen ? 'open' : ''}" data - phase="${idx}" >
            <div class="stx-phase-header" onclick="togglePhase(${idx})" style="--phase-color: ${phase.color}">
              <span class="stx-phase-status">${statusIcon}</span>
              <span class="stx-phase-name">
                <i class="bi ${phase.icon}" style="color:${phase.color}"></i>
                ${phase.nameAr}
              </span>
              <span class="stx-phase-pct" style="color:${phase.color}">${percent}%</span>
              <i class="bi bi-chevron-down stx-chevron"></i>
            </div>
            <div class="stx-phase-items" ${isOpen ? 'style="max-height:500px"' : ''}>
              ${(PE && !isSmartPath ? PE.filterPhaseItems(phase.items) : phase.items)
              .filter(item => !item.pathOnly || item.pathOnly.includes(userType))
              .map(item => `
                <a href="${item.href}" class="stx-item ${isActive(item.href) ? 'active' : ''}" title="${item.label}">
                  <i class="bi ${item.icon}"></i>
                  <span class="stx-item-label">${item.label}</span>
                </a>
              `).join('')}
              <div class="stx-phase-progress-mini">
                <div class="stx-mini-track"><div class="stx-mini-fill" style="width:${percent}%;background:${phase.color}"></div></div>
              </div>
            </div>
          </div >
        `;
        }
      });

    } // end if (!isViewerOrDE)

    // --- عرض مبسّط للمشاهد/مدخل البيانات ---
    if (isViewerOrDE) {
      html += '<div class="stx-divider"></div>';
      if (userRole === 'DATA_ENTRY') {
        html += `
        < a href = "/kpi-entries.html" class="stx-item ${isActive('/kpi-entries.html') ? 'active' : ''}" >
            <i class="bi bi-input-cursor-text" style="color:#22c55e"></i>
            <span>إدخال المؤشرات</span>
          </a >
          <a href="/data-forms.html" class="stx-item ${isActive('/data-forms.html') ? 'active' : ''}">
            <i class="bi bi-clipboard2-data" style="color:#38bdf8"></i>
            <span>نماذج الأقسام</span>
          </a>
          <a href="/statistical-data.html" class="stx-item ${isActive('/statistical-data.html') ? 'active' : ''}">
            <i class="bi bi-bar-chart-steps" style="color:#a78bfa"></i>
            <span>البيانات الإحصائية</span>
          </a>
      `;
      }
    }

    // ╔═══════════════════════════════════════════╗
    // ║  🛠️ أدواتي المقترحة (Suggested Tools AI)   ║
    // ╚═══════════════════════════════════════════╝
    if (!isViewerOrDE && typeof window.SuggestedTools !== 'undefined') {
      html += '<div class="stx-divider"></div>';

      const sgtContent = window.SuggestedTools.render(progressData);
      html += `
        < div class="sgt-wrapper" id = "sgt-section" >
          <div class="sgt-header" onclick="document.getElementById('sgt-section').classList.toggle('collapsed')">
            <i class="bi bi-stars" style="color:#a78bfa"></i>
            أدواتي المقترحة
            <i class="bi bi-chevron-down" style="margin-right:auto"></i>
          </div>
          <div class="sgt-body">
            ${sgtContent}
          </div>
        </div >
        `;
    }

    // ╔═══════════════════════════════════════════╗
    // ║  📊 التقارير                                ║
    // ╚═══════════════════════════════════════════╝
    if (!isViewerOrDE) {
      html += '<div class="stx-divider"></div>';

      const rFiltered = reportsItems.filter(item => hasAccess(item.roles));
      const rHasActive = rFiltered.some(item => isActive(item.href));

      html += `
        < div class="stx-section ${rHasActive ? 'open' : ''}" data - section="reports" >
          <div class="stx-section-header" onclick="toggleSection('reports')">
            <span><i class="bi bi-file-earmark-bar-graph" style="color:#22c55e"></i> التقارير</span>
            <i class="bi bi-chevron-down stx-chevron"></i>
          </div>
          <div class="stx-section-items" ${rHasActive ? 'style="max-height:600px"' : ''}>
            ${rFiltered.map(item => `
              <a href="${item.href}" class="stx-item ${isActive(item.href) ? 'active' : ''}">
                <i class="bi ${item.icon}"></i>
                <span class="stx-item-label">${item.label}</span>
              </a>
            `).join('')}
          </div>
        </div >
        `;
    }

    // ╔═══════════════════════════════════════════╗
    // ║  🧰 الأدوات                                ║
    // ╚═══════════════════════════════════════════╝
    if (!isViewerOrDE) {
      const tFiltered = toolsItems.filter(item => hasAccess(item.roles));
      const tHasActive = tFiltered.some(item => isActive(item.href));

      html += `
        < div class="stx-section ${tHasActive ? 'open' : ''}" data - section="tools" >
          <div class="stx-section-header" onclick="toggleSection('tools')">
            <span><i class="bi bi-tools" style="color:#a78bfa"></i> الأدوات</span>
            <i class="bi bi-chevron-down stx-chevron"></i>
          </div>
          <div class="stx-section-items" ${tHasActive ? 'style="max-height:600px"' : ''}>
            ${tFiltered.map(item => `
              <a href="${item.href}" class="stx-item ${isActive(item.href) ? 'active' : ''}">
                <i class="bi ${item.icon}"></i>
                <span class="stx-item-label">${item.label}</span>
              </a>
            `).join('')}
          </div>
        </div >
        `;
    }

    // ╔═══════════════════════════════════════════╗
    // ║  ⚙️ النظام (OWNER/ADMIN)                   ║
    // ╚═══════════════════════════════════════════╝
    if (hasAccess(['OWNER', 'ADMIN'])) {
      const sysHasActive = systemItems.some(item => isActive(item.href)) || isActive('/webhooks.html');

      html += `
        < div class="stx-section ${sysHasActive ? 'open' : ''}" data - section="system" >
          <div class="stx-section-header" onclick="toggleSection('system')">
            <span><i class="bi bi-sliders2" style="color:#64748b"></i> النظام</span>
            <i class="bi bi-chevron-down stx-chevron"></i>
          </div>
          <div class="stx-section-items" ${sysHasActive ? 'style="max-height:600px"' : ''}>
            ${systemItems.map(item => `
              <a href="${item.href}" class="stx-item ${isActive(item.href) ? 'active' : ''}">
                <i class="bi ${item.icon}"></i>
                <span class="stx-item-label">${item.label}</span>
              </a>
            `).join('')}
          </div>
        </div >
        `;
    }

    // --- الإنجازات (مدمجة مع الخروج) ---
    html += '<div class="stx-divider"></div>';

    // --- تسجيل الخروج ---
    html += `
        < a href = "#" class="stx-item stx-logout" onclick = "event.preventDefault(); localStorage.clear(); location.href='/login.html';" style = "color:#ef4444;margin-top:4px" >
        <i class="bi bi-box-arrow-right" style="color:#ef4444"></i>
        <span>تسجيل الخروج</span>
      </a >
        <div style="height:20px"></div>
      `;

    return html;
  }

  // === كشف الثيم ===
  const rootStyle = getComputedStyle(document.documentElement);
  const bgValue = rootStyle.getPropertyValue('--bg').trim();
  const isDark = bgValue && (bgValue.startsWith('#0') || bgValue.startsWith('#1') || bgValue.startsWith('#2'));

  // === البحث عن الـ Sidebar القديم ===
  let oldSidebar = null;
  let replaceMode = 'inner';

  oldSidebar = document.querySelector('.list-group.bg-white');
  if (oldSidebar) replaceMode = 'inner';

  if (!oldSidebar) { oldSidebar = document.querySelector('nav.sidebar'); if (oldSidebar) replaceMode = 'replace'; }
  if (!oldSidebar) { oldSidebar = document.querySelector('aside.sidebar'); if (oldSidebar) replaceMode = 'replace'; }
  if (!oldSidebar) { oldSidebar = document.querySelector('div.sidebar'); if (oldSidebar) replaceMode = 'replace'; }

  if (!oldSidebar) {
    const listGroups = document.querySelectorAll('.list-group');
    for (const lg of listGroups) {
      if (lg.querySelector('a[href*="dashboard"], a[href*="kpis"], a[href*="sectors"]')) {
        oldSidebar = lg;
        replaceMode = 'inner';
        break;
      }
    }
  }

  if (!oldSidebar) return;

  // === تحميل محرك المسارات الذكية (ديناميكي) ===
  function loadPathEngine() {
    return new Promise((resolve) => {
      if (window.PathEngine) { resolve(); return; }
      const script = document.createElement('script');
      script.src = '/assets/js/path-engine.js';
      script.onload = () => resolve();
      script.onerror = () => resolve(); // fail silently
      document.head.appendChild(script);
    });
  }

  // === تحميل محرك الأدوات المقترحة (ديناميكي) ===
  function loadSuggestedTools() {
    return new Promise((resolve) => {
      if (window.SuggestedTools) { resolve(); return; }
      const script = document.createElement('script');
      script.src = '/assets/js/suggested-tools.js';
      script.onload = () => {
        if (window.SuggestedTools) window.SuggestedTools.injectCSS();
        resolve();
      };
      script.onerror = () => resolve(); // fail silently
      document.head.appendChild(script);
    });
  }

  // === تحميل PathEngine أولاً ثم بناء Sidebar ===
  loadPathEngine().then(() => {
    // إعادة تعيين PE بعد التحميل
    const PE_loaded = window.PathEngine || null;
    const isSmartPath_loaded = PE_loaded ? PE_loaded.isPathMode() : false;

    // === بناء Sidebar أولي (بدون progress data) ===
    const newSidebar = document.createElement('nav');
    newSidebar.className = 'stx-sidebar sidebar';
    newSidebar.innerHTML = buildSidebar(null);

    if (replaceMode === 'replace') {
      const oldStyles = window.getComputedStyle(oldSidebar);
      if (oldStyles.position === 'fixed') newSidebar.classList.add('stx-fixed');
      oldSidebar.replaceWith(newSidebar);
    } else {
      const container = oldSidebar.parentElement;
      if (!container) return;
      container.innerHTML = '';
      container.appendChild(newSidebar);
    }

    // === تحميل SuggestedTools + بيانات التقدم ← إعادة بناء ===
    loadSuggestedTools().then(() => {
      if (token && entityId) {
        fetch(`/ api / user - progress / entity / ${entityId} `, {
          headers: { 'Authorization': `Bearer ${token} ` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            newSidebar.innerHTML = buildSidebar(data || null);
          })
          .catch(() => {
            // Even on error, rebuild with SuggestedTools available
            newSidebar.innerHTML = buildSidebar(null);
          });
      } else {
        // No token/entity — rebuild with SuggestedTools anyway
        newSidebar.innerHTML = buildSidebar(null);
      }
    });

    // === CSS ===
    const style = document.createElement('style');
    style.textContent = `
        .stx - sidebar {
        width: 240px;
        background: ${isDark ? 'var(--bg-card, #1a1d2e)' : '#fff'};
        border - left: 1px solid ${isDark ? 'var(--border, rgba(255,255,255,0.08))' : '#eee'};
        overflow - y: auto;
        overflow - x: hidden;
        position: sticky;
        top: 60px;
        height: calc(100vh - 60px);
        flex - shrink: 0;
        padding: 8px 0;
        scrollbar - width: thin;
      }
    /* بادج المستخدم */
    .stx - user - card {
        display: flex;
        align - items: center;
        gap: 10px;
        padding: 12px 14px 6px;
        margin: 0 8px;
      }
    .stx - user - avatar {
        width: 36px;
        height: 36px;
        border - radius: 10px;
        background: linear - gradient(135deg, var(--primary, #667eea), #7c3aed);
        display: flex;
        align - items: center;
        justify - content: center;
        font - size: 15px;
        font - weight: 800;
        color: white;
        flex - shrink: 0;
      }
    .stx - user - info {
        min - width: 0;
        flex: 1;
      }
    .stx - user - name {
        font - size: 13px;
        font - weight: 700;
        color: ${isDark ? 'var(--text, #e2e8f0)' : '#333'};
        white - space: nowrap;
        overflow: hidden;
        text - overflow: ellipsis;
      }
    .stx - user - role {
        font - size: 10px;
        font - weight: 600;
        color: ${isDark ? '#a78bfa' : '#7c3aed'};
        background: ${isDark ? 'rgba(167,139,250,0.1)' : 'rgba(124,58,237,0.08)'};
        padding: 1px 8px;
        border - radius: 6px;
        display: inline - block;
        margin - top: 2px;
      }
    .stx - org - badge {
        display: flex;
        align - items: center;
        gap: 6px;
        margin: 4px 14px 8px;
        padding: 6px 10px;
        border - radius: 8px;
        background: ${isDark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.06)'};
        border: 1px solid ${isDark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.12)'};
        font - size: 11px;
        font - weight: 600;
        color: ${isDark ? '#f97316' : '#ea580c'};
        white - space: nowrap;
        overflow: hidden;
        text - overflow: ellipsis;
      }
    .stx - org - badge i { font - size: 12px; flex - shrink: 0; }
    .stx - sidebar.stx - fixed {
        position: fixed;
        right: 0;
        top: 0;
        width: 260px;
        height: 100vh;
        padding - top: 60px;
        z - index: 100;
        overflow - y: auto;
        box - shadow: -2px 0 10px rgba(0, 0, 0, 0.15);
      }

    /* زر الرئيسية — العودة الدائمة */
    .stx - home - btn {
        margin: 4px 10px 8px!important;
        padding: 10px 14px!important;
        border - radius: 12px!important;
        font - weight: 700!important;
        font - size: 13px!important;
        border - right: none!important;
        background: ${isDark ? 'rgba(102,126,234,0.08)' : 'rgba(102,126,234,0.06)'} !important;
        border: 1px solid ${isDark ? 'rgba(102,126,234,0.2)' : 'rgba(102,126,234,0.15)'} !important;
        display: flex;
        align - items: center;
        gap: 8px;
        transition: all 0.25s ease;
      }
    .stx - home - btn:hover {
        background: ${isDark ? 'rgba(102,126,234,0.18)' : 'rgba(102,126,234,0.12)'} !important;
        border - color: var(--primary, #667eea) !important;
        transform: translateX(-2px);
      }
    .stx - home - btn.active {
        background: linear - gradient(135deg, rgba(102, 126, 234, 0.15), rgba(124, 58, 237, 0.1))!important;
        border - color: var(--primary, #667eea) !important;
        color: var(--primary, #667eea) !important;
      }

    /* عنوان القسم الجديد */
    .stx - section - label {
        font - size: 11px;
        font - weight: 800;
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#888'};
        padding: 10px 16px 4px;
        text - transform: uppercase;
        letter - spacing: 0.5px;
      }

    /* عناصر مساري */
    .stx - mypath {
        margin: 2px 10px;
        padding: 9px 14px!important;
        border - radius: 10px!important;
        font - weight: 600!important;
        font - size: 12.5px!important;
        border - right: none!important;
      }
    .stx - mypath:hover {
        background: ${isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.06)'} !important;
      }
    .stx - mypath.active {
        background: ${isDark ? 'rgba(102,126,234,0.18)' : 'rgba(102,126,234,0.12)'} !important;
        color: var(--primary, #667eea) !important;
      }

    /* شريط التقدم العام */
    .stx - progress - bar - container {
        margin: 6px 14px 4px;
        padding: 10px 12px;
        background: ${isDark ? 'rgba(255,255,255,0.03)' : '#f8f9fb'};
        border - radius: 10px;
        border: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#eee'};
      }
    .stx - progress - label {
        display: flex;
        justify - content: space - between;
        font - size: 11px;
        font - weight: 600;
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#666'};
        margin - bottom: 6px;
      }
    .stx - progress - percent {
        color: var(--primary, #667eea);
        font - weight: 700;
      }
    .stx - progress - track {
        height: 6px;
        background: ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'};
        border - radius: 3px;
        overflow: hidden;
      }
    .stx - progress - fill {
        height: 100 %;
        background: linear - gradient(90deg, #667eea, #7c3aed);
        border - radius: 3px;
        transition: width .6s ease;
      }

    /* عنوان المسار (legacy — kept for compatibility) */
    .stx - journey - title {
        font - size: 11px;
        font - weight: 700;
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#888'};
        padding: 6px 16px 4px;
        text - transform: uppercase;
        letter - spacing: 0.5px;
      }

    /* المراحل */
    .stx - phase {
        margin: 2px 8px;
        border - radius: 8px;
        overflow: hidden;
      }
    .stx - phase - header {
        padding: 8px 12px;
        display: flex;
        align - items: center;
        gap: 6px;
        cursor: pointer;
        font - size: 13px;
        font - weight: 600;
        color: ${isDark ? 'var(--text, #e2e8f0)' : '#333'};
        border - radius: 8px;
        transition: background .2s;
        user - select: none;
      }
    .stx - phase - header:hover {
        background: ${isDark ? 'rgba(255,255,255,0.04)' : '#f4f5f7'};
      }
    .stx - phase.in - progress.stx - phase - header {
        background: ${isDark ? 'rgba(255,255,255,0.03)' : '#fafbff'};
      }
    .stx - phase - status { font - size: 14px; flex - shrink: 0; }
    .stx - phase - name {
        flex: 1;
        display: flex;
        align - items: center;
        gap: 5px;
      }
    .stx - phase - name i { font - size: 14px; }
    .stx - phase - pct {
        font - size: 11px;
        font - weight: 700;
        flex - shrink: 0;
      }
    .stx - chevron {
        font - size: 10px;
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#999'};
        transition: transform .25s ease;
        flex - shrink: 0;
      }
    .stx - phase.open.stx - chevron,
    .stx - section.open.stx - chevron { transform: rotate(180deg); }

    .stx - phase - items, .stx - section - items {
        max - height: 0;
        overflow: hidden;
        transition: max - height .3s ease;
      }
    .stx - phase.open.stx - phase - items { max - height: 500px; }
    .stx - section.open.stx - section - items { max - height: 1200px; }

    /* عناصر */
    .stx - item {
        display: flex;
        align - items: center;
        gap: 8px;
        padding: 8px 16px 8px 12px;
        font - size: 12.5px;
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#555'};
        text - decoration: none;
        transition: all .15s;
        border - right: 3px solid transparent;
      }
    .stx - item:hover {
        background: ${isDark ? 'rgba(255,255,255,0.04)' : '#f0f0ff'};
        color: ${isDark ? 'var(--text, #e2e8f0)' : '#333'};
      }
    .stx - item.active {
        background: ${isDark ? 'rgba(102,126,234,0.1)' : 'linear-gradient(90deg, rgba(102,126,234,0.08), rgba(102,126,234,0.02))'};
        color: var(--primary, #667eea);
        font - weight: 600;
        border - right - color: var(--primary, #667eea);
      }
    .stx - item i {
        font - size: 14px;
        width: 18px;
        text - align: center;
        flex - shrink: 0;
      }

    /* رابط DNA المرتبط */
    .stx - dna - link {
        border - right: none!important;
        font - size: 11.5px!important;
      }
    .stx - dna - link:hover {
        background: ${isDark ? 'rgba(236,72,153,0.08)' : 'rgba(236,72,153,0.05)'} !important;
      }
    .stx - dna - link.active {
        background: ${isDark ? 'rgba(236,72,153,0.12)' : 'rgba(236,72,153,0.08)'} !important;
        color: #ec4899!important;
        border - right - color: transparent!important;
      }

    /* شريط تقدم مصغر داخل كل مرحلة */
    .stx - phase - progress - mini {
        padding: 4px 16px 8px;
      }
    .stx - mini - track {
        height: 3px;
        background: ${isDark ? 'rgba(255,255,255,0.06)' : '#e8e8e8'};
        border - radius: 2px;
        overflow: hidden;
      }
    .stx - mini - fill {
        height: 100 %;
        border - radius: 2px;
        transition: width .6s ease;
      }

    /* فاصل */
    .stx - divider {
        height: 1px;
        margin: 8px 14px;
        background: ${isDark ? 'rgba(255,255,255,0.06)' : '#eee'};
      }

    /* أقسام (رؤيتي / متقدمة / نظام) */
    .stx - section { margin: 2px 8px; border - radius: 8px; }
    .stx - section - header {
        padding: 8px 12px;
        display: flex;
        justify - content: space - between;
        align - items: center;
        font - size: 12px;
        font - weight: 700;
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#666'};
        cursor: pointer;
        border - radius: 8px;
        transition: background .2s;
        user - select: none;
      }
    .stx - section - header:hover {
        background: ${isDark ? 'rgba(255,255,255,0.03)' : '#f8f8f8'};
      }
    .stx - section - header span {
        display: flex;
        align - items: center;
        gap: 6px;
      }
    .stx - section - header i: first - child { font - size: 14px; }

    /* الإنجازات */
    .stx - achievements {
        margin: 4px 10px;
        padding: 10px 14px!important;
        border - radius: 10px!important;
        font - weight: 600!important;
        border - right: none!important;
      }

      /* === ستايلات مسار المدير (٣ أقسام) === */
      .stx-mgr-step {
        display: flex !important;
        align-items: center;
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
        margin: 2px 0;
        border-radius: 8px;
        border-right: 3px solid transparent !important;
        transition: all 0.2s ease;
      }
      .stx-mgr-step.mgr-current {
        background: ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)'} !important;
        border-right-color: #3b82f6 !important;
      }
      .stx-mgr-step.mgr-done {
        opacity: 0.75;
      }
      .stx-mgr-step.mgr-done:hover {
        opacity: 1;
      }
      .stx-mgr-step.mgr-pending:hover {
        background: ${isDark ? 'rgba(255,255,255,0.04)' : '#f0f0ff'};
      }

      /* === Fix: CSS selectors without spaces (browsers need exact class names) === */
      .stx-sidebar {
        width: 240px;
        background: ${isDark ? 'var(--bg-card, #1a1d2e)' : '#fff'};
        border-left: 1px solid ${isDark ? 'var(--border, rgba(255,255,255,0.08))' : '#eee'};
        overflow-y: auto;
        overflow-x: hidden;
        position: sticky;
        top: 60px;
        height: calc(100vh - 60px);
        flex-shrink: 0;
        padding: 8px 0;
        scrollbar-width: thin;
      }
      .stx-sidebar.stx-fixed {
        position: fixed;
        right: 0;
        top: 0;
        width: 260px;
        height: 100vh;
        padding-top: 60px;
        z-index: 100;
        overflow-y: auto;
        box-shadow: -2px 0 10px rgba(0,0,0,0.15);
      }
      .stx-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px 8px 12px;
        font-size: 12.5px;
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#555'};
        text-decoration: none;
        transition: all .15s;
        border-right: 3px solid transparent;
        width: 100%;
        box-sizing: border-box;
      }
      .stx-item:hover {
        background: ${isDark ? 'rgba(255,255,255,0.04)' : '#f0f0ff'};
        color: ${isDark ? 'var(--text, #e2e8f0)' : '#333'};
      }
      .stx-item.active {
        background: ${isDark ? 'rgba(102,126,234,0.1)' : 'linear-gradient(90deg, rgba(102,126,234,0.08), rgba(102,126,234,0.02))'};
        color: var(--primary, #667eea);
        font-weight: 600;
        border-right-color: var(--primary, #667eea);
      }
      .stx-item i {
        font-size: 14px;
        width: 18px;
        text-align: center;
        flex-shrink: 0;
      }
      .stx-home-btn {
        margin: 4px 10px 8px !important;
        padding: 10px 14px !important;
        border-radius: 12px !important;
        font-weight: 700 !important;
        font-size: 13px !important;
        border-right: none !important;
        background: ${isDark ? 'rgba(102,126,234,0.08)' : 'rgba(102,126,234,0.06)'} !important;
        border: 1px solid ${isDark ? 'rgba(102,126,234,0.2)' : 'rgba(102,126,234,0.15)'} !important;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.25s ease;
      }
      .stx-home-btn:hover {
        background: ${isDark ? 'rgba(102,126,234,0.18)' : 'rgba(102,126,234,0.12)'} !important;
        border-color: var(--primary, #667eea) !important;
        transform: translateX(-2px);
      }
      .stx-home-btn.active {
        background: linear-gradient(135deg, rgba(102,126,234,0.15), rgba(124,58,237,0.1)) !important;
        border-color: var(--primary, #667eea) !important;
        color: var(--primary, #667eea) !important;
      }
      .stx-section-label {
        font-size: 11px;
        font-weight: 800;
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#888'};
        padding: 10px 16px 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .stx-divider {
        height: 1px;
        margin: 8px 14px;
        background: ${isDark ? 'rgba(255,255,255,0.06)' : '#eee'};
      }
      .stx-user-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px 6px;
        margin: 0 8px;
      }
      .stx-user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: linear-gradient(135deg, var(--primary, #667eea), #7c3aed);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: 800;
        color: white;
        flex-shrink: 0;
      }
      .stx-user-info {
        min-width: 0;
        flex: 1;
      }
      .stx-user-name {
        font-size: 13px;
        font-weight: 700;
        color: ${isDark ? 'var(--text, #e2e8f0)' : '#333'};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .stx-user-role {
        font-size: 10px;
        font-weight: 600;
        color: ${isDark ? '#a78bfa' : '#7c3aed'};
        background: ${isDark ? 'rgba(167,139,250,0.1)' : 'rgba(124,58,237,0.08)'};
        padding: 1px 8px;
        border-radius: 6px;
        display: inline-block;
        margin-top: 2px;
      }
      .stx-org-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 4px 14px 8px;
        padding: 6px 10px;
        border-radius: 8px;
        background: ${isDark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.06)'};
        border: 1px solid ${isDark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.12)'};
        font-size: 11px;
        font-weight: 600;
        color: ${isDark ? '#f97316' : '#ea580c'};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .stx-org-badge i { font-size: 12px; flex-shrink: 0; }
      .stx-logout:hover {
        background: rgba(239,68,68,0.08) !important;
      }

      @media(max-width: 768px) {
        .stx-sidebar { display: none; }
      }
      `;
    document.head.appendChild(style);

    // === Toggle Functions ===
    window.togglePhase = function (idx) {
      const phase = document.querySelector(`.stx - phase[data - phase="${idx}"]`);
      if (phase) phase.classList.toggle('open');
    };

    window.toggleSection = function (name) {
      const section = document.querySelector(`.stx - section[data - section="${name}"]`);
      if (section) section.classList.toggle('open');
    };

    // === Lock Toast ===
    window.showLockToast = function (msg) {
      const old = document.getElementById('stx-lock-toast');
      if (old) old.remove();

      const toast = document.createElement('div');
      toast.id = 'stx-lock-toast';
      toast.innerHTML = `< i class="bi bi-lock-fill" ></i > ${msg} `;
      toast.style.cssText = `
    position: fixed; bottom: 24px; left: 24px; z - index: 99999;
    background: rgba(239, 68, 68, 0.92); color: #fff;
    padding: 14px 22px; border - radius: 14px;
    font - family: 'Tajawal', sans - serif; font - size: 14px; font - weight: 600;
    display: flex; align - items: center; gap: 8px;
    backdrop - filter: blur(10px);
    animation: toastSlide 0.4s ease;
    box - shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
    `;

      if (!document.getElementById('stx-toast-anim')) {
        const animStyle = document.createElement('style');
        animStyle.id = 'stx-toast-anim';
        animStyle.textContent = '@keyframes toastSlide { from { transform:translateY(30px); opacity:0; } to { transform:translateY(0); opacity:1; } }';
        document.head.appendChild(animStyle);
      }

      document.body.appendChild(toast);
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
    };

    // === تحميل المستشار الذكي تلقائياً ===
    if (!document.querySelector('script[src*="ai-advisor"]')) {
      const aiScript = document.createElement('script');
      aiScript.src = '/js/ai-advisor.js';
      aiScript.defer = true;
      document.body.appendChild(aiScript);
    }
  }); // end loadPathEngine().then()

})();
