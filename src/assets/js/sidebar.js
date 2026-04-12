/**
 * Startix — Sidebar v2 (الخيط الذهبي)
 * الهيكل الجديد — 6 مراحل (RBV):
 *   🏢 تشخيص الداخل → 🔍 تشخيص الخارج → 🎯 التركيب
 *   📌 الاختيار → 🏆 البناء → 🚀 التنفيذ → 📊 المتابعة
 *
 * المراحل والأدوات تُقرأ من journey-steps.js (مصدر مركزي واحد)
 */

// ─────────────────────────────────────────────────────────────
// دالة مساعدة لتنصيف النصوص (أمان)
// ─────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function (m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}


// TODO: الانتقال إلى ES modules بعد توحيد جميع صفحات المشروع
// المرحلة المستهدفة: بعد الانتهاء من sidebar.js وregister.html

// القاموس المركزي للمسميات المترجمة (توصية معمارية 100/100)
const ROLE_LABELS = {
  DEPT_MANAGER: 'مدير إدارة',
  CONSULTANT: 'مستشار',
  INDIVIDUAL: 'فرد',
  COMPANY_MANAGER: 'مالك',
  BOARD_VIEWER: 'عضو مجلس / مستثمر',
  SUPER_ADMIN: 'مدير النظام',
  OWNER: 'مالك', // إضافة OWNER للتوافق مع القيم القديمة
  DATA_ENTRY: 'مُدخل بيانات',
  VIEWER: 'مشاهد'
};

const DEPT_LABELS = {
  hr: 'الموارد البشرية',
  finance: 'المالية',
  marketing: 'التسويق',
  operations: 'العمليات',
  sales: 'المبيعات',
  it: 'تقنية المعلومات',
  cs: 'خدمة العملاء',
  compliance: 'الامتثال',
  quality: 'الجودة',
  projects: 'المشاريع',
  support: 'الخدمات المساندة'
};

const DEPT_ICONS = {
  hr: 'bi-people', finance: 'bi-cash-stack', marketing: 'bi-megaphone',
  operations: 'bi-gear', sales: 'bi-graph-up-arrow', it: 'bi-pc-display',
  cs: 'bi-headset', compliance: 'bi-shield-check', quality: 'bi-award',
  projects: 'bi-kanban', support: 'bi-tools'
};

const DEPT_COLORS = {
  hr: '#3b82f6', finance: '#f59e0b', marketing: '#8b5cf6',
  operations: '#6366f1', sales: '#10b981', it: '#0ea5e9',
  cs: '#ec4899', compliance: '#ef4444', quality: '#14b8a6',
  projects: '#f97316', support: '#64748b'
};

function getUserRoleLabel(userData) {
  if (!userData) return '';
  const isPrivileged = userData.role === 'OWNER' || userData.role === 'ADMIN' || userData.role === 'COMPANY_MANAGER';
  let deptKey = userData.department?.key || '';
  if (!isPrivileged && !deptKey && userData.userCategory && userData.userCategory.startsWith('DEPT_')) {
    const catDept = userData.userCategory.replace('DEPT_', '').toLowerCase();
    const MAP = { hr: 'hr', finance: 'finance', marketing: 'marketing', ops: 'operations', service: 'cs', sales: 'sales', it: 'it', legal: 'compliance', quality: 'quality', pmo: 'projects' };
    deptKey = MAP[catDept] || catDept;
  }
  const deptName = userData.department?.name || DEPT_LABELS[deptKey] || (typeof getDeptName !== 'undefined' ? getDeptName(deptKey) : '');

  if (userData.role === 'DATA_ENTRY') return deptName ? `${ROLE_LABELS.DATA_ENTRY} — ${deptName}` : ROLE_LABELS.DATA_ENTRY;
  if (!isPrivileged && (userData.userType === 'DEPT_MANAGER' || (userData.userCategory && userData.userCategory.startsWith('DEPT_')))) {
    return deptName ? `مدير ${deptName}` : ROLE_LABELS.DEPT_MANAGER;
  }
  return ROLE_LABELS[userData.userType] || ROLE_LABELS[userData.role] || userData.role || '';
}

function getUserRoleIcon(userData) {
  if (!userData) return 'bi-person';
  if (userData.systemRole === 'SUPER_ADMIN') return 'bi-shield-check-fill';
  const isPrivileged = userData.role === 'OWNER' || userData.role === 'ADMIN' || userData.role === 'COMPANY_MANAGER';
  if (isPrivileged) return 'bi-person-badge-fill';

  if (userData.userType === 'DEPT_MANAGER' || (userData.userCategory && userData.userCategory.startsWith('DEPT_'))) {
    const cat = userData.userCategory ? userData.userCategory.replace('DEPT_', '').toLowerCase() : '';
    const MAP = { hr: 'hr', finance: 'finance', marketing: 'marketing', ops: 'operations', service: 'cs', sales: 'sales', it: 'it', legal: 'compliance', quality: 'quality', pmo: 'projects' };
    const deptKey = MAP[cat] || cat;
    return DEPT_ICONS[deptKey] || 'bi-briefcase-fill';
  }
  return 'bi-person';
}

function getUserRoleColor(userData) {
  if (!userData) return '#64748b';
  if (userData.systemRole === 'SUPER_ADMIN') return '#ef4444';
  const isPrivileged = userData.role === 'OWNER' || userData.role === 'ADMIN' || userData.role === 'COMPANY_MANAGER';
  if (isPrivileged) return '#667eea';

  const cat = userData.userCategory ? userData.userCategory.replace('DEPT_', '').toLowerCase() : '';
  const MAP = { hr: 'hr', finance: 'finance', marketing: 'marketing', ops: 'operations', service: 'cs', sales: 'sales', it: 'it', legal: 'compliance', quality: 'quality', pmo: 'projects' };
  const deptKey = MAP[cat] || cat;
  return DEPT_COLORS[deptKey] || '#10b981';
}

function isDeptStepDone(labelOrId, deptKey) {
  if (!labelOrId) return false;
  const upperDept = (deptKey || 'hr').toUpperCase();
  const storageMap = {
    // أدوات التشخيص
    'deep': `DEEP_${upperDept}`, 'audit': `AUDIT_${upperDept}`, 'hr-audit': `AUDIT_${upperDept}`,
    'dept-health': `HEALTH_${upperDept}`, 'pestel': `PESTEL_${upperDept}`,
    'swot': `SWOT_${upperDept}`, 'tows': `TOWS_${upperDept}`,
    // أدوات التخطيط
    'scenarios': `SCENARIOS_${upperDept}`, 'directions': `DIRECTIONS_${upperDept}`,
    'objectives': `OBJECTIVES_${upperDept}`, 'strategic-objectives': `OBJECTIVES_${upperDept}`,
    // أدوات التنفيذ
    'okrs': `OKRS_${upperDept}`, 'kpis': `KPIS_${upperDept}`,
    'initiatives': `INITIATIVES_${upperDept}`, 'projects': `PROJECTS_${upperDept}`,
    // أدوات المتابعة
    'reviews': `REVIEWS_${upperDept}`, 'corrections': `CORRECTIONS_${upperDept}`,
    'reports': `REPORTS_${upperDept}`, 'risk-map': `RISK_MAP_${upperDept}`
  };
  const key = storageMap[labelOrId];
  if (key) {
    const data = localStorage.getItem(key);
    return (data && data !== '[]' && data !== '{}');
  }
  // fallback: Context manager (يدعم entity-scoped keys)
  if (window.Context?.isStepCompletedSync) {
    return window.Context.isStepCompletedSync(labelOrId);
  }
  return false;
}

async function initSidebar(sidebarContainer) {
  console.log('🚀 [Sidebar] Starting initialization...');

  // 1. حماية ضد عطل الـ Load Order
  if (!window.api || !window.api.getCurrentUser) {
    console.warn('⚠️ [Sidebar] api.js not found! Waiting for window.api...');
    return;
  }

  // 2. الجلب الموثوق لبيانات المستخدم
  let userData = null;
  try {
    userData = await window.api.getCurrentUser();
    console.log('👤 [Sidebar] User detected:', userData?.role || 'null');
  } catch (err) {
    console.error('⚠️ [Sidebar] Error fetching user:', err);
  }

  if (!userData) {
    console.warn('⚠️ [Sidebar] User not logged in. Aborting build.');
    return;
  }

  const currentPath = window.location.pathname;
  const fullPath = currentPath + window.location.search;
  const currentSearch = window.location.search;

  // 🧱 العثور على حاوية السايدبار مبكراً لضمان توفرها
  const mainTarget = sidebarContainer || document.getElementById('stx-sidebar') || document.getElementById('sidebar') || document.querySelector('.stx-sidebar-container, .stx-sidebar, .sidebar');
  if (mainTarget) console.log('🏗️ [Sidebar] Primary target detected:', mainTarget.id || mainTarget.className);

  // ✅ النظام يعتمد على HttpOnly Cookie — نعرف أن المستخدم موثّق إذا رجع userData
  const token = localStorage.getItem('token') || ''; // backward compat فقط
  const isAuthenticated = !!userData; // المصدر الحقيقي: نتيجة API
  const _urlDeptParam = new URLSearchParams(currentSearch).get('dept') || '';
  let _v10Dept = userData.department?.key || _urlDeptParam || localStorage.getItem('stratix_v10_dept') || '';

  // === قراءة الدور من السيرفر مباشرة ===
  let userRole = userData.role || 'VIEWER';
  let systemRole = userData.systemRole || 'USER';
  let userType = userData.userType || 'COMPANY_MANAGER';
  let entityId = userData.entity?.id || '';
  let isSuperAdmin = systemRole === 'SUPER_ADMIN';

  if (!_v10Dept && userData.userCategory && userData.userCategory.startsWith('DEPT_')) {
    const catDept = userData.userCategory.replace('DEPT_', '').toLowerCase();
    const MAP = { hr: 'hr', finance: 'finance', marketing: 'marketing', ops: 'operations', service: 'cs', sales: 'sales', it: 'it', legal: 'compliance', quality: 'quality', pmo: 'projects' };
    _v10Dept = MAP[catDept] || catDept;
  }
  if (_v10Dept) {
    _v10Dept = _v10Dept.toLowerCase();
    localStorage.setItem('stratix_v10_dept', _v10Dept);
  }

  // تحديد الصلاحيات والمسار الرئيسي (تم رفعه ليصبح متاحاً على مستوى الملف بالكامل)
  const isViewerOrDE = ['VIEWER', 'DATA_ENTRY'].includes(userRole) && systemRole !== 'SUPER_ADMIN';
  const _diagRole = (() => { try { return JSON.parse(localStorage.getItem('stratix_diagnostic_payload') || '{}').role || ''; } catch (e) { return ''; } })();
  // ⚠️ الأولوية: نقرأ userCategory من userData (API) — لا من localStorage
  const _uCat = (() => { try { return userData?.userCategory || JSON.parse(localStorage.getItem('user') || '{}').userCategory || ''; } catch (e) { return ''; } })();
  const isInvestorUser = _diagRole === 'investor' || _uCat === 'INVESTOR' || _uCat.startsWith('INVESTOR_');

  // 🛡️ المستقل (DEPT_MANAGER + role=OWNER) → pro-dashboard | الداخلي → dept-dashboard
  const _isProMgr = userType === 'DEPT_MANAGER' && (userRole === 'OWNER' || userRole === 'ADMIN');
  const homeHref = isViewerOrDE ? '/viewer-hub.html'
    : (userType === 'BOARD_VIEWER' && isInvestorUser) ? '/investor-dashboard.html'
      : userType === 'BOARD_VIEWER' ? '/board-dashboard.html'
        : (userType === 'DEPT_MANAGER' && _isProMgr) ? '/pro-dashboard.html'
          : userType === 'DEPT_MANAGER' ? `/dept-dashboard.html${_v10Dept ? '?dept=' + _v10Dept : ''}`
            : '/dashboard.html';

  // === قواعد الرؤية حسب نوع المستخدم ===
  // EXPLORER:        المسار ١ — رحلة مبسطة (مالية + AI بسيط)
  // COMPANY_MANAGER:  المسار ٢ — كل الأدوات الاستراتيجية
  // DEPT_MANAGER:     المسار ٣ — أدوات الإدارة فقط
  // CONSULTANT:       المسار ٣ — كل شيء + multi-entity
  const typeRules = {
    EXPLORER: { showJourney: true, showVision: false, showAdvanced: false, limitedDiagnosis: true, limitedJourney: false },
    COMPANY_MANAGER: { showJourney: true, showVision: true, showAdvanced: true, limitedDiagnosis: false, limitedJourney: false },
    DEPT_MANAGER: { showJourney: true, showVision: true, showAdvanced: false, limitedDiagnosis: false, limitedJourney: true },
    BOARD_VIEWER: { showJourney: false, showVision: true, showAdvanced: false, limitedDiagnosis: true, limitedJourney: false },
    CONSULTANT: { showJourney: true, showVision: true, showAdvanced: true, limitedDiagnosis: false, limitedJourney: false },
  };
  const currentRules = typeRules[userType] || typeRules.COMPANY_MANAGER;
  // ==========================================
  // NOTE: Unification - All roles use buildSidebar() for v2 shell consistency
  // ==========================================

  // SUPER_ADMIN و OWNER يشوفون كل شي (لأننا ألغينا الفوضى القديمة Storage Storage)
  if (isSuperAdmin || (userRole === 'OWNER' && userType !== 'DEPT_MANAGER')) {
    currentRules.showJourney = true;
    currentRules.showVision = true;
    currentRules.showAdvanced = true;
    currentRules.limitedDiagnosis = false;
  }

  // === قراءة نمط الشركة من السيرفر ===
  let patternKey = userData.entity?.patternKey || userData.entity?.path || 'default';

  // === كشف نوع المستخدم: 5 مستويات ===
  // INDIVIDUAL = فرد | FOUNDER = مؤسس (0-10) | SMALL = صغيرة (11-50) | MEDIUM = متوسطة (51-200) | LARGE = كبيرة (200+)
  let _sidebarIsIndividual = false; // [SIMPLIFIED] لا وضع شخصي حالياً
  let _sidebarCompanyLevel = 'MEDIUM'; // افتراضي آمن — كل الأدوات ظاهرة

  function _detectLevelFromCategory(cat) {
    // Individual categories → لا يُفعّل وضع الفرد (الأدوار المبسّطة أُلغيت)
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
    // 4. من userData المُجلَب من السيرفر (المصدر الموثوق)
    if (!_sidebarIsIndividual && userData) {
      const uCat = userData.userCategory || userData.category || '';
      if (uCat) _detectLevelFromCategory(uCat);
    }
  } catch (e) { /* ignore */ }

  // حفظ المستوى للاستخدام في الداشبورد
  try { localStorage.setItem('_sidebarCompanyLevel', _sidebarIsIndividual ? 'INDIVIDUAL' : _sidebarCompanyLevel); } catch (e) { }

  // === ترتيب المستويات للفلترة ===
  const LEVEL_ORDER = { FOUNDER: 1, SMALL: 2, MEDIUM: 3, LARGE: 4 };
  const _lvl = LEVEL_ORDER[_sidebarCompanyLevel] || 3;

  // === استخراج تنسيقات السايدبار (CSS) في دالة مستقلة ===
  function getSidebarCSS(isDark) {
    return `
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
      
      /* ── Context Switcher ─────────────────────────── */
      .stx-ctx-wrap {
        position: relative;
        margin: 4px 14px 8px;
      }
      .stx-ctx-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        padding: 6px 10px;
        border-radius: 8px;
        background: ${isDark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.06)'};
        border: 1px solid ${isDark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.12)'};
        font-size: 11px;
        font-weight: 600;
        color: ${isDark ? '#f97316' : '#ea580c'};
        cursor: pointer;
        text-align: right;
        transition: background 0.2s;
      }
      .stx-ctx-btn:hover { background: ${isDark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.1)'}; }
      .stx-ctx-btn--dept {
        background: ${isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)'} !important;
        border-color: ${isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.25)'} !important;
        color: #10b981 !important;
        padding: 8px 10px !important;
        align-items: flex-start !important;
      }
      .stx-ctx-btn--dept:hover { background: ${isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.14)'} !important; }
      .stx-ctx-btn .stx-ctx-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .stx-ctx-btn .stx-ctx-chevron { font-size: 10px; transition: transform 0.2s; flex-shrink: 0; margin-top: 2px; }
      .stx-ctx-btn.open .stx-ctx-chevron { transform: rotate(180deg); }
      .stx-ctx-dropdown {
        display: none;
        position: absolute;
        top: calc(100% + 4px);
        right: 0; left: 0;
        background: ${isDark ? '#1e2135' : '#fff'};
        border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        z-index: 9999;
        overflow: hidden;
        max-height: 260px;
        overflow-y: auto;
      }
      .stx-ctx-dropdown.open { display: block; }
      .stx-ctx-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        cursor: pointer;
        font-size: 12px;
        color: ${isDark ? '#e2e8f0' : '#1e293b'};
        border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
        transition: background 0.15s;
      }
      .stx-ctx-item:last-child { border-bottom: none; }
      .stx-ctx-item:hover { background: ${isDark ? 'rgba(102,126,234,0.12)' : 'rgba(102,126,234,0.08)'}; }
      .stx-ctx-item.current { background: ${isDark ? 'rgba(249,115,22,0.1)' : 'rgba(249,115,22,0.07)'}; }
      .stx-ctx-item .ctx-dot {
        width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        background: ${isDark ? '#334155' : '#cbd5e1'};
      }
      .stx-ctx-item.current .ctx-dot { background: #f97316; }
      .stx-ctx-item .ctx-info { flex: 1; overflow: hidden; }
      .stx-ctx-item .ctx-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .stx-ctx-item .ctx-role { font-size: 10px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-top: 1px; }
      .stx-ctx-loading { padding: 12px; text-align: center; color: ${isDark ? '#94a3b8' : '#64748b'}; font-size: 11px; }
      .stx-ctx-add {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 11px 14px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
        color: #10b981;
        border-top: 1px solid ${isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)'};
        background: ${isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.04)'};
        transition: background 0.15s;
      }
      .stx-ctx-add:hover { background: ${isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.09)'}; }
      .stx-ctx-add i { font-size: 13px; }
      
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
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(124, 58, 237, 0.1)) !important;
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

      .stx-mypath {
        margin: 2px 10px;
        padding: 9px 14px !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        font-size: 12.5px !important;
        border-right: none !important;
      }
      .stx-mypath:hover {
        background: ${isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.06)'} !important;
      }
      .stx-mypath.active {
        background: ${isDark ? 'rgba(102,126,234,0.18)' : 'rgba(102,126,234,0.12)'} !important;
        color: var(--primary, #667eea) !important;
      }

      .stx-progress-bar-container {
        margin: 6px 14px 4px;
        padding: 10px 12px;
        background: ${isDark ? 'rgba(255,255,255,0.03)' : '#f8f9fb'};
        border-radius: 10px;
        border: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#eee'};
      }
      .stx-progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        font-weight: 600;
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#666'};
        margin-bottom: 6px;
      }
      .stx-progress-percent {
        color: var(--primary, #667eea);
        font-weight: 700;
      }
      .stx-progress-track {
        height: 6px;
        background: ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'};
        border-radius: 3px;
        overflow: hidden;
      }
      .stx-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #7c3aed);
        border-radius: 3px;
        transition: width .6s ease;
      }

      .stx-journey-title {
        font-size: 11px;
        font-weight: 700;
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#888'};
        padding: 6px 16px 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stx-phase {
        margin: 2px 8px;
        border-radius: 8px;
        overflow: hidden;
      }
      .stx-phase-header {
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        color: ${isDark ? 'var(--text, #e2e8f0)' : '#333'};
        border-radius: 8px;
        transition: background .2s;
        user-select: none;
      }
      .stx-phase-header:hover {
        background: ${isDark ? 'rgba(255,255,255,0.04)' : '#f4f5f7'};
      }
      .stx-phase.in-progress .stx-phase-header {
        background: ${isDark ? 'rgba(255,255,255,0.03)' : '#fafbff'};
      }
      .stx-phase-status { font-size: 14px; flex-shrink: 0; }
      .stx-phase-name {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .stx-phase-name i { font-size: 14px; }
      .stx-phase-pct {
        font-size: 11px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .stx-chevron {
        font-size: 10px;
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#999'};
        transition: transform .25s ease;
        flex-shrink: 0;
      }
      .stx-phase.open .stx-chevron,
      .stx-section.open .stx-chevron { transform: rotate(180deg); }

      .stx-phase-items, .stx-section-items {
        max-height: 0;
        overflow: hidden;
        transition: max-height .3s ease;
      }
      .stx-phase.open .stx-phase-items { max-height: 500px; }
      .stx-section.open .stx-section-items { max-height: 1200px; }

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

      .stx-dna-link {
        border-right: none !important;
        font-size: 11.5px !important;
      }
      .stx-dna-link:hover {
        background: ${isDark ? 'rgba(236,72,153,0.08)' : 'rgba(236,72,153,0.05)'} !important;
      }
      .stx-dna-link.active {
        background: ${isDark ? 'rgba(236,72,153,0.12)' : 'rgba(236,72,153,0.08)'} !important;
        color: #ec4899 !important;
        border-right-color: transparent !important;
      }

      .stx-phase-progress-mini {
        padding: 4px 16px 8px;
      }
      .stx-mini-track {
        height: 3px;
        background: ${isDark ? 'rgba(255,255,255,0.06)' : '#e8e8e8'};
        border-radius: 2px;
        overflow: hidden;
      }
      .stx-mini-fill {
        height: 100%;
        border-radius: 2px;
        transition: width .6s ease;
      }

      .stx-divider {
        height: 1px;
        margin: 8px 14px;
        background: ${isDark ? 'rgba(255,255,255,0.06)' : '#eee'};
      }

      .stx-section { margin: 2px 8px; border-radius: 8px; }
      .stx-section-header {
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        font-weight: 700;
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#666'};
        cursor: pointer;
        border-radius: 8px;
        transition: background .2s;
        user-select: none;
      }
      .stx-section-header:hover {
        background: ${isDark ? 'rgba(255,255,255,0.03)' : '#f8f8f8'};
      }
      .stx-section-header span {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .stx-section-header i:first-child { font-size: 14px; }

      .stx-achievements {
        margin: 4px 10px;
        padding: 10px 14px !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        border-right: none !important;
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

      .stx-logout:hover {
        background: rgba(239,68,68,0.08) !important;
      }

      /* زر العودة للرئيسية (يتم حقنه برمجياً) */
      .stx-global-back-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 10px;
        background: ${isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8f9fa'};
        border: 1px solid ${isDark ? 'var(--border, rgba(255, 255, 255, 0.08))' : '#e2e8f0'};
        color: ${isDark ? 'var(--text-muted, #94a3b8)' : '#64748b'};
        font-family: 'Tajawal', sans-serif;
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.2s;
        margin-bottom: 20px;
        width: fit-content;
      }
      .stx-global-back-btn:hover {
        background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'};
        color: ${isDark ? 'var(--text, #e2e8f0)' : '#1e293b'};
        border-color: ${isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'};
      }

      @media(max-width: 768px) {
        .stx-sidebar { display: none; }
      }
    `;
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

  // === Helper: صلاحيات ===
  function hasAccess(allowedRoles) {
    if (isSuperAdmin) return true;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(userRole);
  }

  // === استخراج: سايدبار المستثمر ===
  function buildBoardViewerSidebar(isInvestorUser) {
    let html = '';
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // القسم ١: 📊 النظرة الاستراتيجية
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    html += `<div class="stx-section-label"><i class="bi bi-eye-fill" style="color:#a78bfa;margin-left:4px"></i> النظرة الاستراتيجية</div>`;

    const boardViewItems = isInvestorUser ? [
      { label: 'لوحة المستثمر', href: '/investor-dashboard.html', icon: 'bi-briefcase', color: '#f093fb' },
      { label: 'تقديم فرصة', href: '/deal-submit.html', icon: 'bi-plus-circle', color: '#667eea' },
      { label: 'لوحة المجلس', href: '/board-dashboard.html', icon: 'bi-speedometer2', color: '#a78bfa' },
      { label: 'الذكاء الاستراتيجي', href: '/intelligence.html', icon: 'bi-robot', color: '#667eea' },
    ] : [
      { label: 'لوحة المجلس', href: '/board-dashboard.html', icon: 'bi-speedometer2', color: '#a78bfa' },
      { label: 'الذكاء الاستراتيجي', href: '/intelligence.html', icon: 'bi-robot', color: '#667eea' },
      { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-graph-up-arrow', color: '#22c55e' },
    ];
    boardViewItems.forEach(item => {
      html += `
        <a href="${item.href}" class="stx-item ${isActive(item.href) ? 'active' : ''}">
          <i class="bi ${item.icon}" style="color:${item.color}"></i>
          <span class="stx-item-label">${item.label}</span>
        </a>
      `;
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // القسم ٢: 📋 التقارير
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    html += `<div class="stx-divider"></div>`;
    html += `<div class="stx-section-label"><i class="bi bi-file-earmark-bar-graph" style="color:#f59e0b;margin-left:4px"></i> التقارير</div>`;

    const boardReportItems = [
      { label: 'التقارير الذكية', href: '/reports.html', icon: 'bi-file-earmark-bar-graph', color: '#22c55e' },
      { label: 'العرض التقديمي', href: '/ai-presentation.html', icon: 'bi-easel3-fill', color: '#3b82f6' },
      { label: 'التقويم الاستراتيجي', href: '/strategic-calendar.html', icon: 'bi-calendar-range', color: '#f59e0b' },
    ];
    boardReportItems.forEach(item => {
      html += `
        <a href="${item.href}" class="stx-item ${isActive(item.href) ? 'active' : ''}">
          <i class="bi ${item.icon}" style="color:${item.color}"></i>
          <span class="stx-item-label">${item.label}</span>
        </a>
      `;
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // القسم ٣: ⚙️ الإعدادات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    html += `<div class="stx-divider"></div>`;
    const isBoardSettingsActive = isActive('/settings.html');
    html += `
      <a href="/settings.html" class="stx-item ${isBoardSettingsActive ? 'active' : ''}" style="opacity:0.7">
        <i class="bi bi-gear-fill" style="color:#64748b"></i>
        <span class="stx-item-label">الإعدادات</span>
      </a>
    `;

    // --- تسجيل الخروج ---
    html += `<div class="stx-divider"></div>`;
    html += `
      <a href="#" class="stx-item stx-logout" onclick="event.preventDefault(); ['token','user','stratix_v10_dept','stratix_smart_guide','stratix_category','onboarding_data','stratix_diagnostic_payload','stratix_return_url'].forEach(k=>localStorage.removeItem(k)); fetch('/api/auth/logout', {method:'POST', credentials:'include'}).finally(()=>location.href='/login.html');" style="color:#ef4444;margin-top:4px">
        <i class="bi bi-box-arrow-right" style="color:#ef4444"></i>
        <span>تسجيل الخروج</span>
      </a>
      <div style="height:20px"></div>
    `;

    return html;
  }

  // ─────────────────────────────────────────────────────────────
  // بناء السايدبار لمدير الإدارة (15 أداة من steps-config.js)
  // ─────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────
  // NOTE: buildDeptManagerSidebar is now merged into buildSidebar for shell consistency
  // ─────────────────────────────────────────────────────────────

  // تحديث علامات الصح بعد تحميل السايدبار (async)
  function updateDeptStepStatuses() {
    var icons = document.querySelectorAll('.stx-step-status[data-tool-id]');
    if (!icons.length || typeof window.Context === 'undefined') return;
    icons.forEach(function (icon) {
      var toolId = icon.getAttribute('data-tool-id');
      if (!toolId) return;
      try {
        var result = Context.isStepCompleted(toolId);
        if (result && typeof result.then === 'function') {
          result.then(function (done) {
            if (done) {
              icon.className = 'bi bi-check-circle-fill stx-step-status';
              icon.style.color = '#22c55e';
            }
          }).catch(function () { });
        } else if (result) {
          icon.className = 'bi bi-check-circle-fill stx-step-status';
          icon.style.color = '#22c55e';
        }
      } catch (e) { }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // الدالة الاحتياطية (Fallback) في حال عدم تحميل steps-config.js
  // ─────────────────────────────────────────────────────────────
  function buildDeptManagerSidebarFallback(dept) {
    const safeDept = encodeURIComponent(dept);
    const rawDeptName = DEPT_LABELS[dept] || dept;
    const safeDeptName = escapeHtml(rawDeptName);
    const safeDeptForBadge = escapeHtml(dept.toUpperCase());

    return `
        <div class="stx-section-label">🏢 ${safeDeptName} (${safeDeptForBadge})</div>
        <a href="/company-health.html?dept=${safeDept}" class="stx-item">🏢 بيئة الإدارة</a>
        <a href="/${dept}-deep.html?dept=${safeDept}" class="stx-item">🔍 التحليل العميق</a>
        <a href="/swot.html?dept=${safeDept}" class="stx-item">📊 تحليل SWOT</a>
        <a href="/directions.html?dept=${safeDept}" class="stx-item">🧭 التوجهات الاستراتيجية</a>
        <a href="/objectives.html?dept=${safeDept}" class="stx-item">🎯 الأهداف الاستراتيجية</a>
    `;
  }

  // === محرك المسارات الذكية (يُقرأ ديناميكياً داخل buildSidebar) ===

  // === رحلتي الاستراتيجية: 4 مراحل (المنهجية المتكاملة الجديدة) ===
  // === كل الإدارات المتاحة ===
  const ALL_DEPT_ITEMS = [
    { label: 'الامتثال والحوكمة', href: '/dept-deep.html?dept=compliance', icon: 'bi-shield-fill-check', key: 'compliance' },
    { label: 'المالية', href: '/finance-deep.html', icon: 'bi-cash-coin', key: 'finance' },
    { label: 'المبيعات', href: '/dept-deep.html?dept=sales', icon: 'bi-graph-up-arrow', key: 'sales' },
    { label: 'الموارد البشرية', href: '/hr-deep.html', icon: 'bi-people-fill', key: 'hr' },
    { label: 'التسويق', href: '/dept-deep.html?dept=marketing', icon: 'bi-megaphone-fill', key: 'marketing' },
    { label: 'العمليات', href: '/dept-deep.html?dept=operations', icon: 'bi-gear-wide-connected', key: 'operations' },
    { label: 'الخدمات المساندة', href: '/dept-deep.html?dept=support', icon: 'bi-wrench-adjustable', key: 'support' },
    { label: 'تقنية المعلومات', href: '/dept-deep.html?dept=it', icon: 'bi-laptop', key: 'it' },
    { label: 'خدمة العملاء', href: '/dept-deep.html?dept=cs', icon: 'bi-headset', key: 'cs' },
    { label: 'الجودة', href: '/dept-deep.html?dept=quality', icon: 'bi-patch-check-fill', key: 'quality' },
    { label: 'المشاريع', href: '/dept-deep.html?dept=projects', icon: 'bi-kanban-fill', key: 'projects' },
  ];

  // === فلترة: مدير الإدارة يشوف إدارته فقط + مسار مخصص ===
  let filteredDeptItems;
  let _deptJourneyOverride = null; // مراحل مخصصة لمدير الإدارة

  if (userType === 'DEPT_MANAGER' && _v10Dept) {
    const currentDept = _v10Dept;

    // 🛡️ المنهجية الجديدة 2.0: بناء مراحل مخصصة لمدير الإدارة بناءً على 15 أداة
    _deptJourneyOverride = STEPS_CONFIG.PHASE_ORDER.map(phaseId => {
      const phaseTools = STEPS_CONFIG.DEPARTMENT_TOOLS.filter(t => t.phase === phaseId);
      const phaseNames = { diagnostic: 'التشخيص الاستراتيجي', planning: 'التخطيط الاستراتيجي', execution: 'التنفيذ والمتابعة' };
      const phaseIcons = { diagnostic: 'bi-search-heart', planning: 'bi-compass-fill', execution: 'bi-rocket-takeoff-fill' };

      return {
        id: phaseId.toUpperCase(),
        nameAr: phaseNames[phaseId] || phaseId,
        icon: phaseIcons[phaseId] || 'bi-grid-fill',
        items: phaseTools.map(t => ({
          label: t.name,
          href: `${t.path}${t.path.includes('?') ? '&' : '?'}dept=${currentDept}&v=${Date.now()}`,
          icon: t.icon,
          id: t.id,
          done: isDeptStepDone(t.id, currentDept)
        }))
      };
    });
  }

  // ═══ المراحل — تُقرأ من الملف المركزي ═══
  const journeyPhases = (userType === 'DEPT_MANAGER' && _deptJourneyOverride)
    ? _deptJourneyOverride
    : (window.StartixJourney && window.StartixJourney.phases)
      ? window.StartixJourney.phases
      : [
        {
          id: 'DIAGNOSIS_INTERNAL', nameAr: 'تشخيص — الداخل', icon: 'bi-building-gear', emoji: '🏢', color: '#0d9488',
          items: [
            { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-building-fill-check' },
            { label: 'سلسلة القيمة', href: '/tool-detail.html?code=VALUE_CHAIN', icon: 'bi-link-45deg' },
            { label: 'استكشاف الإدارات', href: '/dept-deep.html', icon: 'bi-diagram-3-fill' },
          ]
        },
        {
          id: 'DIAGNOSIS_EXTERNAL', nameAr: 'تشخيص — الخارج', icon: 'bi-globe2', emoji: '🔍', color: '#ef4444',
          items: [
            { label: 'PESTEL (بيئة كلية)', href: '/tool-detail.html?code=PESTEL', icon: 'bi-binoculars-fill' },
            { label: 'قوى بورتر', href: '/tool-detail.html?code=PORTER', icon: 'bi-shield-exclamation' },
          ]
        },
        {
          id: 'SYNTHESIS', nameAr: 'التركيب', icon: 'bi-grid-3x3-gap-fill', emoji: '🎯', color: '#22c55e',
          items: [
            { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap-fill' },
            { label: 'مصفوفة TOWS', href: '/tows.html', icon: 'bi-arrows-fullscreen' },
            { label: 'خريطة المخاطر', href: '/risk-map.html', icon: 'bi-exclamation-triangle-fill' },
          ]
        },
        {
          id: 'DIRECTION_CHOICES', nameAr: 'الاختيار', icon: 'bi-compass-fill', emoji: '📌', color: '#8b5cf6',
          items: [
            { label: 'التوجهات', href: '/directions.html', icon: 'bi-compass' },
          ]
        },
        {
          id: 'PLANNING', nameAr: 'البناء', icon: 'bi-bullseye', emoji: '🏆', color: '#38bdf8',
          items: [
            { label: 'الأهداف (BSC)', href: '/objectives.html', icon: 'bi-bullseye' },
            { label: 'مؤشرات الأداء (KPIs)', href: '/kpis.html', icon: 'bi-speedometer2' },
          ]
        },
        {
          id: 'EXECUTION', nameAr: 'التنفيذ', icon: 'bi-rocket-takeoff-fill', emoji: '🚀', color: '#f59e0b',
          items: [
            { label: 'المبادرات', href: '/initiatives.html', icon: 'bi-kanban-fill' },
            { label: 'القرارات المالية', href: '/finance-audit.html', icon: 'bi-clipboard2-pulse-fill' },
          ]
        },
        {
          id: 'MONITORING', nameAr: 'المتابعة', icon: 'bi-bar-chart-line-fill', emoji: '📊', color: '#10b981',
          items: [
            { label: 'المراجعات', href: '/reviews.html', icon: 'bi-journal-check' },
            { label: 'التصحيحات', href: '/corrections.html', icon: 'bi-arrow-repeat' },
          ]
        },
      ];

  // === ⚡ مركز القيادة — مخصص حسب الدور ===
  // كل دور يشوف الأدوات الأهم له أولاً
  // userType: COMPANY_MANAGER, DEPT_MANAGER, BOARD_VIEWER, EXPLORER, CONSULTANT

  function getCommandCenterItems(uType, dept) {
    // الأدوات المشتركة لكل الأدوار
    var commonItems = [
      { label: 'الذكاء الاستراتيجي', href: '/intelligence.html', icon: 'bi-robot', roles: [] },
      { label: 'المستشار الاستراتيجي', href: '/strategic-advisor.html', icon: 'bi-cpu-fill', roles: [] },
    ];

    // ═══ CEO / مالك ═══
    var ceoItems = [
      { type: 'header', label: '🔴 المدخلات الاستراتيجية' },
      { label: 'مركز القيادة', href: '/ceo-dashboard.html', icon: 'bi-shield-check', roles: ['OWNER', 'ADMIN'] },
      { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-building-fill-check', roles: [] },
      { label: 'الذكاء الاستراتيجي', href: '/intelligence.html', icon: 'bi-bell-fill', roles: [] },
      { type: 'header', label: '🧭 التخطيط والتوجه' },
      { label: 'خريطة الاستراتيجية', href: '/strategy-map.html', icon: 'bi-map-fill', roles: [] },
      { label: 'التقويم الاستراتيجي', href: '/strategic-calendar.html', icon: 'bi-calendar-range-fill', roles: [] },
      { label: 'الهيكل الديناميكي', href: '/dynamic-structure.html', icon: 'bi-diagram-3-fill', roles: ['OWNER', 'ADMIN'] },
      { type: 'header', label: '🔍 التحليل والتعمق' },
      { label: 'تقاريري', href: '/reports.html', icon: 'bi-file-earmark-bar-graph', roles: [] },
      { label: 'التوترات الاستراتيجية', href: '/strategic-tensions.html', icon: 'bi-lightning-charge-fill', roles: ['OWNER', 'ADMIN'] },
      { label: 'مختبر المحاكاة', href: '/simulation-lab.html', icon: 'bi-bezier2', roles: ['OWNER', 'ADMIN'] },
      { label: 'المقارنة المعيارية', href: '/benchmarking.html', icon: 'bi-bar-chart-line-fill', roles: [] },
      { type: 'header', label: '⚙️ الإجراءات والتحسين' },
      { label: 'المراجعات الدورية', href: '/reviews.html', icon: 'bi-journal-check', roles: ['OWNER', 'ADMIN'] },
      { label: 'الإصدارات', href: '/versions.html', icon: 'bi-collection-fill', roles: ['OWNER', 'ADMIN'] },
      { label: 'مركز التعلم', href: '/learning-center.html', icon: 'bi-journal-bookmark-fill', roles: ['OWNER', 'ADMIN'] },
      { label: 'مركز الذكاء', href: '/ai-center.html', icon: 'bi-cpu-fill', roles: ['OWNER', 'ADMIN'] },
    ];

    // ═══ مستثمر / مجلس إدارة ═══
    var investorItems = [
      { type: 'header', label: '💰 العناية الواجبة' },
      { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-building-fill-check', roles: [] },
      { label: 'خريطة المخاطر', href: '/risk-map.html', icon: 'bi-exclamation-triangle-fill', roles: [] },
      { label: 'القرارات المالية', href: '/finance-audit.html', icon: 'bi-clipboard2-pulse-fill', roles: [] },
      { type: 'header', label: '📊 تقييم الأداء' },
      { label: 'مصفوفة BCG', href: '/bcg-matrix.html', icon: 'bi-star-fill', roles: [] },
      { label: 'نموذج الأعمال', href: '/tool-detail.html?code=BUSINESS_MODEL', icon: 'bi-building', roles: [] },
      { label: 'مؤشرات الأداء', href: '/kpis.html', icon: 'bi-speedometer2', roles: [] },
      { type: 'header', label: '📈 تقارير' },
      { label: 'التقارير التلقائية', href: '/reports.html', icon: 'bi-file-earmark-bar-graph', roles: [] },
      { label: 'السيناريوهات', href: '/scenarios.html', icon: 'bi-bezier2', roles: [] },
    ];

    // ═══ مدير إدارة ═══
    var deptNames = { hr: 'الموارد البشرية', finance: 'المالية', operations: 'العمليات', marketing: 'التسويق', sales: 'المبيعات', compliance: 'الامتثال', support: 'الخدمات المساندة' };
    var deptLabel = deptNames[dept] || dept || 'إدارتي';
    var deptParam = dept ? '?dept=' + dept : '';

    var deptManagerItems = [
      { type: 'header', label: '🏢 ' + deptLabel },
      { label: 'لوحة ' + deptLabel, href: '/dept-dashboard.html' + deptParam, icon: 'bi-speedometer2', roles: [] },
      { label: 'تحليل SWOT', href: '/swot.html' + deptParam, icon: 'bi-grid-3x3-gap-fill', roles: [] },
      { label: 'مصفوفة TOWS', href: '/tows.html' + deptParam, icon: 'bi-arrows-fullscreen', roles: [] },
      { label: 'مؤشرات الأداء', href: '/kpis.html' + deptParam, icon: 'bi-speedometer2', roles: [] },
      { type: 'header', label: '📋 تنفيذ' },
      { label: 'إدخال المؤشرات', href: '/kpi-entries.html' + deptParam, icon: 'bi-pencil-square', roles: [] },
      { label: 'المبادرات', href: '/initiatives.html' + deptParam, icon: 'bi-kanban-fill', roles: [] },
      { label: 'تقرير ' + deptLabel, href: '/reports.html' + deptParam, icon: 'bi-file-earmark-bar-graph', roles: [] },
    ];

    // ═══ مستشار ═══
    var consultantItems = [
      { type: 'header', label: '🔴 المدخلات الاستراتيجية' },
      { label: 'مركز القيادة', href: '/ceo-dashboard.html', icon: 'bi-shield-check', roles: [] },
      { label: 'الكيانات', href: '/entities.html', icon: 'bi-building-fill', roles: [] },
      { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-building-fill-check', roles: [] },
      { type: 'header', label: '🔍 التحليل والتعمق' },
      { label: 'تقاريري', href: '/reports.html', icon: 'bi-file-earmark-bar-graph', roles: [] },
      { label: 'التوترات الاستراتيجية', href: '/strategic-tensions.html', icon: 'bi-lightning-charge-fill', roles: [] },
      { label: 'الهيكل الديناميكي', href: '/dynamic-structure.html', icon: 'bi-diagram-3-fill', roles: [] },
      { label: 'المقارنة المعيارية', href: '/benchmarking.html', icon: 'bi-bar-chart-line-fill', roles: [] },
      { label: 'مختبر المحاكاة', href: '/simulation-lab.html', icon: 'bi-bezier2', roles: [] },
      { type: 'header', label: '⚙️ الإجراءات والتحسين' },
      { label: 'المراجعات الدورية', href: '/reviews.html', icon: 'bi-journal-check', roles: [] },
      { label: 'الإصدارات', href: '/versions.html', icon: 'bi-collection-fill', roles: [] },
      { label: 'مركز التعلم', href: '/learning-center.html', icon: 'bi-journal-bookmark-fill', roles: [] },
      { label: 'مركز الذكاء', href: '/ai-center.html', icon: 'bi-cpu-fill', roles: [] },
    ];

    // اختار القائمة حسب الدور
    var roleItems;
    if (uType === 'BOARD_VIEWER') {
      roleItems = investorItems;
    } else if (uType === 'DEPT_MANAGER') {
      roleItems = deptManagerItems;
    } else if (uType === 'CONSULTANT') {
      roleItems = consultantItems;
    } else {
      roleItems = ceoItems; // OWNER, COMPANY_MANAGER, EXPLORER, default
    }

    return roleItems.concat(commonItems);
  }

  // fallback للتوافقية مع الكود القديم
  const commandCenterItems = getCommandCenterItems('COMPANY_MANAGER', '');

  // === 🛠️ أدوات مساندة (إعداد مساحة العمل + إدخال بيانات) ===
  const supportToolsItems = [
    { label: 'الأدوات الاستراتيجية', href: '/tools.html', icon: 'bi-tools', roles: [] },
    { label: 'الكيانات', href: '/entities.html', icon: 'bi-building-fill', roles: [], hideFromDeptManager: true },
    { label: 'الفريق الاستراتيجي', href: '/team.html', icon: 'bi-person-lines-fill', roles: [], hideFromDeptManager: true },
    { label: 'القطاعات والأنشطة', href: '/sectors.html', icon: 'bi-grid-3x3-gap-fill', roles: [], hideFromDeptManager: true },
    { label: 'إدخال المؤشرات', href: '/kpi-entries.html', icon: 'bi-pencil-square', roles: [] },
    { label: 'معمل الاجتماعات', href: '/meeting-lab.html', icon: 'bi-people-fill', roles: [] },
    { label: 'المشاريع', href: '/projects.html', icon: 'bi-folder2-open', roles: [] },
    { label: 'التقييمات', href: '/assessments.html', icon: 'bi-clipboard-check-fill', roles: [] },
  ];

  // === ⚙️ النظام (OWNER/ADMIN فقط) ===
  const systemItems = [
    { label: 'لوحة الإدارة', href: '/admin-dashboard.html', icon: 'bi-shield-lock-fill' },
    { label: 'المستخدمون', href: '/users.html', icon: 'bi-people-fill' },
    { label: 'استيراد البيانات', href: '/import.html', icon: 'bi-cloud-upload-fill' },
    { label: 'سجل النشاطات', href: '/activity-feed.html', icon: 'bi-activity' },
    { label: 'الإعدادات', href: '/settings.html', icon: 'bi-gear-fill' },
    { label: 'البيانات الأساسية', href: '/settings-data.html', icon: 'bi-database-fill-gear' },
    { label: 'إعدادات النظام', href: '/admin-dashboard.html#settings', icon: 'bi-gear-wide-connected' },
  ];

  // === بناء HTML السايدبار (Async 2.0) ===
  async function buildSidebar(progressData) {
    // قراءة محرك المسارات في كل مرة يُبنى الـ sidebar
    const PE = window.PathEngine || null;
    const isSmartPath = PE ? PE.isPathMode() : false;

    let html = '';

    // --- بادج اليوزر + الجهة ---
    let userName = userData.name || '';
    let userEmail = userData.email || '';
    let entityLegalName = userData.entity?.legalName || userData.entity?.displayName || '';
    let companyNameAr = userData.entity?.company?.nameAr || userData.entity?.company?.nameEn || '';

    // استدعاء المسمى الوظيفي باستخدام الدالة النظيفة (حسب توجيه الـ 100/100)
    let userRoleLabel = getUserRoleLabel(userData);
    let userRoleIcon = getUserRoleIcon(userData);
    let userRoleColor = getUserRoleColor(userData);

    const initial = userName ? userName[0] : 'S';
    const orgLine = companyNameAr || entityLegalName;
    const logoUrl = userData.entity?.logoUrl || userData.entity?.company?.logoUrl || null;

    let roleStyle = userRoleColor ? `color: ${userRoleColor}; background: ${userRoleColor}1A;` : '';
    let avatarStyle = userRoleColor && !logoUrl ? `background: linear-gradient(135deg, ${userRoleColor}, ${userRoleColor}CC);` : '';

    if (logoUrl) avatarStyle += 'background: transparent; padding: 0; border: 1px solid rgba(255,255,255,0.1);';

    const avatarContent = logoUrl
      ? `<img src="${logoUrl}" alt="Logo" style="width:100%; height:100%; object-fit:contain; border-radius:10px;">`
      : initial;

    html += `
      <div class="stx-user-card">
        <div class="stx-user-avatar" style="${avatarStyle}">${avatarContent}</div>
        <div class="stx-user-info">
          <div class="stx-user-name">${userName || 'المستخدم'}</div>
          ${userRoleLabel ? `<span class="stx-user-role" style="${roleStyle}"><i class="bi ${userRoleIcon}" style="margin-left: 3px;"></i>${userRoleLabel}</span>` : ''}
        </div>
      </div>
      ${(orgLine && !_sidebarIsIndividual) ? `
      <div class="stx-ctx-wrap" id="stxCtxWrap">
        <button class="stx-ctx-btn ${userType === 'DEPT_MANAGER' ? 'stx-ctx-btn--dept' : ''}" id="stxCtxBtn" onclick="window._stxCtxToggle(event)">
          <i class="bi bi-building${userType === 'DEPT_MANAGER' ? '-fill' : ''}" style="flex-shrink:0;${userType === 'DEPT_MANAGER' ? 'color:#10b981' : ''}"></i>
          <div style="flex:1;min-width:0;text-align:right">
            <div class="stx-ctx-name" id="stxCtxName" style="font-weight:${userType === 'DEPT_MANAGER' ? '700' : '500'}">${orgLine}</div>
            ${userType === 'DEPT_MANAGER' ? `<div style="font-size:10px;color:${userRoleColor || '#10b981'};opacity:0.85;line-height:1.2;margin-top:1px">${userRoleLabel || 'مدير الإدارة'}</div>` : ''}
          </div>
          <i class="bi bi-chevron-down stx-ctx-chevron" id="stxCtxChevron"></i>
        </button>
        <div class="stx-ctx-dropdown" id="stxCtxDropdown">
          <div class="stx-ctx-loading">⏳ جاري التحميل...</div>
        </div>
      </div>
      ` : ''}
    `;

    // --- detect viewer/data-entry early ---
    const isViewerOrDE = ['VIEWER', 'DATA_ENTRY'].includes(userRole) && systemRole !== 'SUPER_ADMIN';

    // ╔═══════════════════════════════════════════╗
    // ║  🏠 الرئيسية — زر العودة الدائم            ║
    // ╚═══════════════════════════════════════════╝
    const homeHref = isViewerOrDE ? '/viewer-hub.html'
      : (userType === 'BOARD_VIEWER' && isInvestorUser) ? '/investor-dashboard.html'
        : userType === 'BOARD_VIEWER' ? '/board-dashboard.html'
          : userType === 'DEPT_MANAGER' ? `/dept-dashboard.html${_v10Dept ? '?dept=' + _v10Dept : ''}`
            : '/dashboard.html';
    const isHomeActive = isActive('/dashboard.html') || isActive('/ceo-dashboard.html') || isActive('/viewer-hub.html') || isActive('/board-dashboard.html') || isActive('/dept-dashboard.html') || isActive('/investor-dashboard.html');

    // لا تُظهر "الرئيسية" لمدير الإدارة وهو على نفس الصفحة (dept-dashboard) لتقليل الزحام
    const isDeptMgrOnDash = userType === 'DEPT_MANAGER' && isActive('/dept-dashboard.html');
    if (!isDeptMgrOnDash) {
      html += `
        <a href="${homeHref}" class="stx-item stx-home-btn ${isHomeActive ? 'active' : ''}">
          <i class="bi bi-house-door-fill" style="color:#667eea;font-size:16px"></i>
          <span>الرئيسية</span>
        </a>
      `;
    }

    // 🎯 مسار المستثمر / عضو المجلس — قراءة فقط
    if (userType === 'BOARD_VIEWER' && !isViewerOrDE && !isSuperAdmin) {
      html += buildBoardViewerSidebar(isInvestorUser);
      return html;
    }

    // 🎯 مسار مدير الإدارة (داخلي أو مستقل)
    if (userType === 'DEPT_MANAGER' && !isViewerOrDE) {
      const currentDept = _v10Dept || 'hr';
      const safeDept = encodeURIComponent(currentDept);

      // 🛡️ التمييز: المستقل (role=OWNER, أنشأ entities بنفسه) vs الداخلي (مدعو من المالك)
      const _isProManager = userRole === 'OWNER' || userRole === 'ADMIN';

      if (_isProManager) {
        // ═══ المدير المستقل: رابط pro-dashboard + 17 أداة كاملة ═══
        html += `
          <a href="/pro-dashboard.html" class="stx-item stx-home-btn ${isActive('/pro-dashboard.html') ? 'active' : ''}">
            <i class="bi bi-gem" style="color:#6366f1;font-size:16px"></i>
            <span>لوحة العملاء</span>
          </a>
        `;

        // عرض كل الأدوات من steps-config (4 مراحل × 17 أداة)
        const _proCats = (window.getToolsByCategory) ? window.getToolsByCategory() : null;
        if (_proCats) {
          for (const [catKey, cat] of Object.entries(_proCats)) {
            html += `<div class="stx-section-label">${escapeHtml(cat.title)}</div>`;
            for (const tool of cat.tools) {
              const link = window.getToolLink ? window.getToolLink(tool, currentDept) : (tool.path.replace('{dept}', currentDept) + '?dept=' + safeDept);
              const done = isDeptStepDone ? isDeptStepDone(tool.id, currentDept) : false;
              const isToolActive = isActive(link);
              html += `
                <a href="${link}" class="stx-item ${isToolActive ? 'active' : ''}" style="padding:8px 14px" data-tool-id="${tool.id}">
                  <i class="bi ${done ? 'bi-check-circle-fill' : tool.icon}" style="color:${done ? '#22c55e' : '#cbd5e1'};margin-left:8px"></i>
                  <span class="stx-item-label" style="font-size:12.5px">${escapeHtml(tool.name)}</span>
                </a>
              `;
            }
          }
        }

        // القسم "عملي"
        html += `<div class="stx-divider"></div><div class="stx-section-label">📋 عملي</div>`;
        [
          { label: 'إدخال المؤشرات', href: '/kpi-entries.html?dept=' + safeDept, icon: 'bi-pencil-square' },
          { label: 'تقرير إدارتي', href: '/reports.html?dept=' + safeDept, icon: 'bi-file-earmark-bar-graph' },
        ].forEach(pt => {
          html += `
            <a href="${pt.href}" class="stx-item ${isActive(pt.href) ? 'active' : ''}" style="padding:8px 14px">
              <i class="bi ${pt.icon}" style="color:#22c55e"></i>
              <span class="stx-item-label" style="font-size:12.5px">${pt.label}</span>
            </a>
          `;
        });

      } else {
        // ═══ المدير الداخلي: 3 أدوات تشخيص + عملي ═══
        html += `<div class="stx-section-label">🔍 التحليل والتشخيص</div>`;
        const diagTools = [
          { label: 'التحليل الرقمي', href: '/' + currentDept + '-deep.html?dept=' + safeDept, icon: 'bi-search-heart', id: 'deep' },
          { label: 'التقييم الوصفي', href: '/' + currentDept + '-audit.html?dept=' + safeDept, icon: 'bi-clipboard2-pulse-fill', id: 'audit' },
          { label: 'صحة الإدارة', href: '/dept-health.html?dept=' + safeDept, icon: 'bi-heart-pulse', id: 'dept-health' },
        ];
        diagTools.forEach(tool => {
          const done = isDeptStepDone ? isDeptStepDone(tool.id, currentDept) : false;
          html += `
            <a href="${tool.href}" class="stx-item ${isActive(tool.href) ? 'active' : ''}" style="padding:8px 14px" data-tool-id="${tool.id}">
              <i class="bi ${done ? 'bi-check-circle-fill' : tool.icon}" style="color:${done ? '#22c55e' : '#cbd5e1'};margin-left:8px"></i>
              <span class="stx-item-label" style="font-size:12.5px">${tool.label}</span>
            </a>`;
        });

        // القسم "عملي"
        html += `<div class="stx-divider"></div><div class="stx-section-label">📋 عملي</div>`;
        [
          { label: 'إدخال المؤشرات', href: '/kpi-entries.html?dept=' + safeDept, icon: 'bi-pencil-square' },
          { label: 'تقرير إدارتي', href: '/reports.html?dept=' + safeDept, icon: 'bi-file-earmark-bar-graph' },
        ].forEach(pt => {
          html += `
            <a href="${pt.href}" class="stx-item ${isActive(pt.href) ? 'active' : ''}" style="padding:8px 14px">
              <i class="bi ${pt.icon}" style="color:#22c55e"></i>
              <span class="stx-item-label" style="font-size:12.5px">${pt.label}</span>
            </a>
          `;
        });

        // زر تغيير الإدارة (للداخلي فقط)
        html += `
          <div style="padding:15px; margin-top:auto;">
            <button onclick="localStorage.removeItem('stratix_v10_dept'); window.location.href='/select-dept.html';" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:#94a3b8; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
            <i class="bi bi-arrow-left-right"></i> تغيير الإدارة</button>
          </div>
        `;
      }

      // --- تسجيل الخروج (مشترك) ---
      html += '<div class="stx-divider"></div>';
      html += `
        <a href="#" class="stx-item stx-logout" onclick="event.preventDefault(); ['token','user','stratix_v10_dept','stratix_smart_guide','stratix_category','onboarding_data','stratix_diagnostic_payload','stratix_return_url'].forEach(k=>localStorage.removeItem(k)); fetch('/api/auth/logout', {method:'POST', credentials:'include'}).finally(()=>location.href='/login.html');" style="color:#ef4444;margin-top:4px">
          <i class="bi bi-box-arrow-right" style="color:#ef4444"></i>
          <span>تسجيل الخروج</span>
        </a>
        <div style="height:20px"></div>
      `;

      return html;
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
        <a href="/dept-dashboard.html" class="stx-item stx-mypath ${isDeptActive ? 'active' : ''}">
        <i class="bi bi-building-fill-gear" style="color:#f59e0b"></i>
        <span>لوحة إدارتي</span>
      </a>
        `;
    } else if (userType === 'BOARD_VIEWER') {
      // مستثمر / عضو مجلس ← لوحة المجلس
      const isBoardActive = isActive('/board-dashboard.html');
      html += `
        <a href="/board-dashboard.html" class="stx-item stx-mypath ${isBoardActive ? 'active' : ''}">
        <i class="bi bi-eye-fill" style="color:#a78bfa"></i>
        <span>لوحة المجلس</span>
      </a>
        `;
    } else if (userType === 'CONSULTANT') {
      // مستشار ← لوحة الاستشاري
      const isConsActive = isActive('/consultant-dashboard.html');
      html += `
        <a href="/consultant-dashboard.html" class="stx-item stx-mypath ${isConsActive ? 'active' : ''}">
        <i class="bi bi-briefcase-fill" style="color:#10b981"></i>
        <span>لوحة الاستشاري</span>
      </a>
        `;
    } else if (hasAccess(['OWNER', 'ADMIN', 'COMPANY_MANAGER'])) {
      // CEO / مؤسس / مدير عام ← لوحة القيادة
      const isCeoActive = isActive('/ceo-dashboard.html');
      html += `
        <a href="/ceo-dashboard.html" class="stx-item stx-mypath ${isCeoActive ? 'active' : ''}">
        <i class="bi bi-gem" style="color:#a78bfa"></i>
        <span>لوحة القيادة</span>
      </a>
        `;
    }

    // اللوحة التنفيذية (LARGE + OWNER/ADMIN/COMPANY_MANAGER)
    if (_lvl >= 4 && hasAccess(['OWNER', 'ADMIN', 'COMPANY_MANAGER'])) {
      const isExecActive = isActive('/exec-dashboard.html');
      html += `
        <a href="/exec-dashboard.html" class="stx-item stx-mypath ${isExecActive ? 'active' : ''}">
        <i class="bi bi-bar-chart-fill" style="color:#6366f1"></i>
        <span>اللوحة التنفيذية</span>
      </a>
        `;
    }

    // --- شريط التقدم (ذكي أو عام) ---
    if (!isViewerOrDE) {
      if (isSmartPath && PE) {
        // المسار الذكي — شريط تقدم + خطوات مع gating
        html += PE.buildProgressHTML();

        // عرض الخطوات مع gating (🔒 مقفل / ⬜ متاح / 🔵 أنت هنا / ✅ مكتمل)
        const _gatedSteps = PE.calculateAllowedSteps ? PE.calculateAllowedSteps() : null;
        if (_gatedSteps && _gatedSteps.length > 0) {
          html += `<div style="margin:4px 10px 8px;padding:0">`;
          _gatedSteps.forEach(function (step) {
            const statusIcons = { completed: '✅', current: '🔵', available: '⬜', locked: '🔒' };
            const icon = statusIcons[step.status] || '⬜';

            if (step.status === 'locked') {
              html += `
                <div class="stx-item" style="opacity:0.35;cursor:not-allowed;padding:7px 12px" title="أكمل الخطوة السابقة أولاً">
                  <span style="font-size:13px;min-width:20px">${icon}</span>
                  <span class="stx-item-label" style="color:#64748b;font-size:12px">${step.index}. ${step.label}</span>
                </div>
              `;
            } else {
              const isHere = step.status === 'current';
              const isDone = step.status === 'completed';
              html += `
                <a href="${step.href}" class="stx-item ${isHere ? 'active' : ''}" style="padding:7px 12px;${isDone ? 'opacity:0.6' : ''}">
                  <span style="font-size:13px;min-width:20px">${icon}</span>
                  <span class="stx-item-label" style="font-size:12px;font-weight:${isHere ? '700' : '500'};color:${isHere ? '#fff' : isDone ? '#4ade80' : 'var(--text,#e2e8f0)'}">${step.index}. ${step.label}</span>
                  ${isHere ? '<span style="font-size:9px;color:#93c5fd;margin-right:auto">← هنا</span>' : ''}
                </a>
              `;
            }
          });
          html += `</div>`;
        }
      } else {
        // المسار الكلاسيكي — شريط تقدم عام
        const overall = progressData ? progressData.overall : 0;
        html += `
        <div class="stx-progress-bar-container">
          <div class="stx-progress-label">
            <span>التقدم الكلي</span>
            <span class="stx-progress-percent">${overall}%</span>
          </div>
          <div class="stx-progress-track">
            <div class="stx-progress-fill" style="width:${overall}%"></div>
          </div>
        </div>
        `;
        // زر التبديل للمسار الذكي (يظهر فقط لو عنده نمط محدد)
        if (PE) {
          html += PE.buildClassicToggleHTML();
        }
      }
    }

    // === رحلة مدير الإدارة (مسار ٣) ===
    if (!isViewerOrDE && userType === 'DEPT_MANAGER' && !isSmartPath) {
      const _dn2 = { hr: 'الموارد البشرية', finance: 'المالية', operations: 'العمليات', marketing: 'التسويق', sales: 'المبيعات', compliance: 'الامتثال والحوكمة', support: 'الخدمات المساندة' };
      const _myDeptName = _dn2[_v10Dept] || _v10Dept || 'إدارتي';

      html += '<div class="stx-divider"></div>';
      html += `<div class="stx-section-label"><i class="bi bi-building-fill-gear" style="color:#f59e0b;margin-left:4px"></i> ${_myDeptName}</div>`;

      const deptItems = [
        { label: `لوحة ${_myDeptName}`, href: `/dept-dashboard.html${_v10Dept ? '?dept=' + _v10Dept : ''}`, icon: 'bi-speedometer2' },
        { label: 'تحليل SWOT', href: `/swot.html${_v10Dept ? '?dept=' + _v10Dept : ''}`, icon: 'bi-grid-3x3-gap-fill' },
        { label: 'مصفوفة TOWS', href: `/tows.html${_v10Dept ? '?dept=' + _v10Dept : ''}`, icon: 'bi-arrows-fullscreen' },
        { label: 'مؤشرات الأداء', href: `/kpis.html${_v10Dept ? '?dept=' + _v10Dept : ''}`, icon: 'bi-graph-up-arrow' },
        { label: 'إدخال المؤشرات', href: `/kpi-entries.html${_v10Dept ? '?dept=' + _v10Dept : ''}`, icon: 'bi-pencil-square' },
        { label: 'المراجعات', href: '/reviews.html', icon: 'bi-journal-check' },
        { label: `تقرير ${_myDeptName}`, href: `/reports.html${_v10Dept ? '?dept=' + _v10Dept : ''}`, icon: 'bi-file-earmark-bar-graph' },
      ];
      deptItems.forEach(item => {
        html += `
        <a href="${item.href}" class="stx-item ${isActive(item.href) ? 'active' : ''}">
            <i class="bi ${item.icon}"></i>
            <span class="stx-item-label">${item.label}</span>
          </a>
        `;
      });
    }

    // ╔═══════════════════════════════════════════╗
    // ║  🧭 رحلتي الاستراتيجية                     ║
    // ╚═══════════════════════════════════════════╝
    if (!isViewerOrDE && currentRules.showJourney && !isSmartPath) {
      // === المسار الكلاسيكي: عرض المراحل ===
      html += '<div class="stx-divider"></div>';

      // مدير الإدارة: عنوان مخصص
      if (currentRules.limitedJourney && _v10Dept) {
        const _dn = { hr: 'الموارد البشرية', finance: 'المالية', operations: 'العمليات', marketing: 'التسويق', sales: 'المبيعات', compliance: 'الامتثال والحوكمة', support: 'الخدمات المساندة' };
        html += `<div class="stx-section-label"><i class="bi bi-building-fill-gear" style="color:#3b82f6;margin-left:4px"></i> أدوات إدارة ${_dn[_v10Dept] || _v10Dept}</div>`;
      } else {
        html += '<div class="stx-section-label"><i class="bi bi-compass-fill" style="color:#667eea;margin-left:4px"></i> رحلتي الاستراتيجية</div>';
      }

      // مدير الإدارة: مراحل مخصصة | المستثمر: مراحل مفلترة | غيره: كل المراحل
      var roleFilteredPhases = (window.StartixJourney && window.StartixJourney.filterForRole)
        ? window.StartixJourney.filterForRole(userType)
        : journeyPhases;

      const displayPhases = (currentRules.limitedJourney && _deptJourneyOverride)
        ? _deptJourneyOverride
        : roleFilteredPhases;

      // --- المراحل ---
      displayPhases.forEach((phase, idx) => {
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
        <div class="stx-phase phase-locked" data-phase="${idx}">
          <div class="stx-phase-header" onclick="showLockToast('${(unlockMsg || 'أكمل المرحلة السابقة أولاً').replace(/'/g, "\\'")}')" style="--phase-color: ${phase.color}; opacity:0.45; cursor:not-allowed">
            <span class="stx-phase-status"><i class="bi bi-lock-fill" style="font-size:13px;color:#ef4444"></i></span>
            <span class="stx-phase-name">
              <i class="bi ${phase.icon}" style="color:${phase.color}"></i>
              ${phase.nameAr}
            </span>
            <span class="stx-phase-pct" style="color:var(--text-muted);font-size:10px">${unlockMsg || 'مقفل'}</span>
          </div>
          </div>
        `;
        } else {
          html += `
        <div class="stx-phase ${statusClass} ${isOpen ? 'open' : ''}" data-phase="${idx}">
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
          </div>
        `;
        }
      });

    } // end if (!isViewerOrDE)

    // --- عرض مشاهد/مدخل البيانات: روابط حسب الإدارة ---
    if (isViewerOrDE) {
      const _vDept = _v10Dept || '';
      if (_vDept && DEPT_LABELS[_vDept]) {
        html += '<div class="stx-divider"></div>';
        html += `<div class="stx-section-label"><i class="bi bi-eye-fill" style="color:#a78bfa;margin-left:4px"></i> إدارة ${DEPT_LABELS[_vDept]}</div>`;
        html += `
          <a href="/dept-dashboard.html?dept=${_vDept}" class="stx-item ${isActive('/dept-dashboard.html') ? 'active' : ''}">
            <i class="bi bi-speedometer2" style="color:#f59e0b"></i><span>لوحة الإدارة</span>
          </a>
          <a href="/swot.html?dept=${_vDept}" class="stx-item ${isActive('/swot.html') ? 'active' : ''}">
            <i class="bi bi-grid-3x3-gap-fill" style="color:#667eea"></i><span>تحليل SWOT</span>
          </a>
          <a href="/kpis.html?dept=${_vDept}" class="stx-item ${isActive('/kpis.html') ? 'active' : ''}">
            <i class="bi bi-graph-up-arrow" style="color:#22c55e"></i><span>مؤشرات الأداء</span>
          </a>
          <a href="/okrs.html?dept=${_vDept}" class="stx-item ${isActive('/okrs.html') ? 'active' : ''}">
            <i class="bi bi-bullseye" style="color:#3b82f6"></i><span>الأهداف (OKRs)</span>
          </a>
          <a href="/intelligence.html?dept=${_vDept}" class="stx-item ${isActive('/intelligence.html') ? 'active' : ''}">
            <i class="bi bi-robot" style="color:#8b5cf6"></i><span>الذكاء الاستراتيجي</span>
          </a>
        `;
      }
      html += '<div class="stx-divider"></div>';
      html += `<div class="stx-section-label"><i class="bi bi-file-earmark-bar-graph" style="color:#f59e0b;margin-left:4px"></i> التقارير</div>`;
      html += `
        <a href="/reports.html" class="stx-item ${isActive('/reports.html') ? 'active' : ''}">
          <i class="bi bi-file-earmark-bar-graph" style="color:#22c55e"></i><span>التقارير الذكية</span>
        </a>
        <a href="/company-health.html" class="stx-item ${isActive('/company-health.html') ? 'active' : ''}">
          <i class="bi bi-heart-pulse-fill" style="color:#ef4444"></i><span>صحة الشركة</span>
        </a>
      `;
      if (userRole === 'DATA_ENTRY') {
        html += '<div class="stx-divider"></div>';
        html += `<div class="stx-section-label"><i class="bi bi-pencil-square" style="color:#22c55e;margin-left:4px"></i> الإدخال</div>`;
        html += `
          <a href="/kpi-entries.html" class="stx-item ${isActive('/kpi-entries.html') ? 'active' : ''}">
            <i class="bi bi-input-cursor-text" style="color:#22c55e"></i><span>إدخال المؤشرات</span>
          </a>
          <a href="/data-forms.html" class="stx-item ${isActive('/data-forms.html') ? 'active' : ''}">
            <i class="bi bi-clipboard2-data" style="color:#38bdf8"></i><span>نماذج الأقسام</span>
          </a>
          <a href="/statistical-data.html" class="stx-item ${isActive('/statistical-data.html') ? 'active' : ''}">
            <i class="bi bi-bar-chart-steps" style="color:#a78bfa"></i><span>البيانات الإحصائية</span>
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
        <div class="sgt-wrapper" id="sgt-section">
          <div class="sgt-header" onclick="document.getElementById('sgt-section').classList.toggle('collapsed')">
            <i class="bi bi-stars" style="color:#a78bfa"></i>
            أدواتي المقترحة
            <i class="bi bi-chevron-down" style="margin-right:auto"></i>
          </div>
          <div class="sgt-body">
            ${sgtContent}
          </div>
        </div>
        `;
    }

    // ╔═══════════════════════════════════════════╗
    // ║  ⚡ مركز القيادة — مخصص حسب الدور          ║
    // ╚═══════════════════════════════════════════╝
    if (!isViewerOrDE) {
      html += '<div class="stx-divider"></div>';

      const ccItems = getCommandCenterItems(userType, _v10Dept);
      const ccFiltered = ccItems.filter(item => item.type === 'header' || hasAccess(item.roles || []));
      // حذف headers بدون عناصر بعدها
      const ccClean = ccFiltered.filter((item, idx) => {
        if (item.type !== 'header') return true;
        // تحقق إن فيه عنصر غير header بعده
        return ccFiltered.slice(idx + 1).some(next => next.type !== 'header');
      });
      const ccHasActive = ccClean.some(item => item.href && isActive(item.href));

      // عنوان مركز القيادة مخصص حسب الدور
      var ccTitle = 'مركز القيادة';
      if (userType === 'BOARD_VIEWER') ccTitle = 'لوحة المستثمر';
      else if (userType === 'DEPT_MANAGER') ccTitle = 'أدواتي السريعة';
      else if (userType === 'CONSULTANT') ccTitle = 'مركز الاستشارات';

      html += `
        <div class="stx-section ${ccHasActive ? 'open' : ''}" data-section="command-center">
          <div class="stx-section-header" onclick="toggleSection('command-center')">
            <span><i class="bi bi-lightning-charge-fill" style="color:#f59e0b"></i> ${ccTitle}</span>
            <i class="bi bi-chevron-down stx-chevron"></i>
          </div>
          <div class="stx-section-items" ${ccHasActive ? 'style="max-height:800px"' : ''}>
            ${ccClean.map(item => {
        if (item.type === 'header') {
          return `<div style="font-size:10px;font-weight:700;color:var(--text-muted,#94a3b8);padding:10px 14px 4px;letter-spacing:0.3px">${item.label}</div>`;
        }
        return `
                <a href="${item.href}" class="stx-item ${isActive(item.href) ? 'active' : ''}">
                  <i class="bi ${item.icon}"></i>
                  <span class="stx-item-label">${item.label}</span>
                </a>
              `;
      }).join('')}
          </div>
        </div>
        `;
    }

    // ╔═══════════════════════════════════════════╗
    // ║  🛠️ أدوات مساندة                           ║
    // ╚═══════════════════════════════════════════╝
    if (!isViewerOrDE) {
      const stFiltered = supportToolsItems.filter(item => {
        if (!hasAccess(item.roles)) return false;
        if (item.hideFromDeptManager && userType === 'DEPT_MANAGER') return false;
        return true;
      });
      const stHasActive = stFiltered.some(item => isActive(item.href));

      html += `
        <div class="stx-section ${stHasActive ? 'open' : ''}" data-section="support-tools">
          <div class="stx-section-header" onclick="toggleSection('support-tools')">
            <span><i class="bi bi-wrench-adjustable" style="color:#64748b"></i> أدوات مساندة</span>
            <i class="bi bi-chevron-down stx-chevron"></i>
          </div>
          <div class="stx-section-items" ${stHasActive ? 'style="max-height:600px"' : ''}>
            ${stFiltered.map(item => `
              <a href="${item.href}" class="stx-item ${isActive(item.href) ? 'active' : ''}">
                <i class="bi ${item.icon}"></i>
                <span class="stx-item-label">${item.label}</span>
              </a>
            `).join('')}
          </div>
        </div>
        `;
    }

    // ╔═══════════════════════════════════════════╗
    // ║  ⚙️ النظام (OWNER/ADMIN/COMPANY_MANAGER)   ║
    // ╚═══════════════════════════════════════════╝
    if (hasAccess(['OWNER', 'ADMIN', 'COMPANY_MANAGER'])) {
      const sysHasActive = systemItems.some(item => isActive(item.href)) || isActive('/webhooks.html');

      html += `
        <div class="stx-section ${sysHasActive ? 'open' : ''}" data-section="system">
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
        </div>
        `;
    }

    // --- الإنجازات (مدمجة مع الخروج) ---
    html += '<div class="stx-divider"></div>';

    // --- تسجيل الخروج ---
    html += `
        <a href="#" class="stx-item stx-logout" onclick="event.preventDefault(); ['token','user','stratix_v10_dept','stratix_smart_guide','stratix_category','onboarding_data','stratix_diagnostic_payload','stratix_return_url'].forEach(k=>localStorage.removeItem(k)); fetch('/api/auth/logout', {method:'POST', credentials:'include'}).finally(()=>location.href='/login.html');" style="color:#ef4444;margin-top:4px">
        <i class="bi bi-box-arrow-right" style="color:#ef4444"></i>
        <span>تسجيل الخروج</span>
      </a>
        <div style="height:20px"></div>
      `;

    return html;
  }

  // === كشف الثيم ===
  const rootStyle = getComputedStyle(document.documentElement);
  const bgValue = rootStyle.getPropertyValue('--bg').trim();
  const isDark = bgValue && (bgValue.startsWith('#0') || bgValue.startsWith('#1') || bgValue.startsWith('#2'));

  // 🧱 استخدام الحاوية التي تم اكتشافها
  const target = mainTarget || sidebarContainer || document.getElementById('stx-sidebar') || document.getElementById('sidebar') || document.querySelector('.stx-sidebar-container, .stx-sidebar, .sidebar');

  if (!target || !(target instanceof HTMLElement)) {
    console.warn('⚠️ [Sidebar] No valid HTML container found to inject sidebar! Aborting build.');
  } else {
    console.log('🏗️ [Sidebar] Active target confirmed:', target.id || target.className);
    try {
      // حقن التنسيقات فوراً
      if (!document.getElementById('stx-sidebar-styles')) {
        const style = document.createElement('style');
        style.id = 'stx-sidebar-styles';
        style.innerHTML = getSidebarCSS(true);
        document.head.appendChild(style);
        console.log('🎨 [Sidebar] CSS injected.');
      }

      // بناء المحتوى النهائي (Async)
      const sidebarHtml = await buildSidebar(null);
      target.innerHTML = sidebarHtml;
      target.classList.add('stx-sidebar');
      if (!target.id) target.id = 'sidebar';

      // تفعيل السلوكيات (فتح الأقسام النشطة)
      attachSidebarBehaviors(target);

    } catch (e) {
      console.error('⚠️ [Sidebar] Failed to build:', e);
    }
    return;
  }

  // --- Fallback for extremely legacy pages ---
  let oldSidebar = document.querySelector('.list-group.bg-white, nav.sidebar, aside.sidebar');
  if (!oldSidebar) return;

  // === تحميل محرك المسارات الذكية (ديناميكي) ===
  function loadPathEngine() {
    return new Promise((resolve) => {
      if (window.PathEngine) { resolve(); return; }
      const script = document.createElement('script');
      script.src = '/assets/js/path-engine.js?v=6';
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
      script.src = '/assets/js/suggested-tools.js?v=6';
      script.onload = () => {
        if (window.SuggestedTools) window.SuggestedTools.injectCSS();
        resolve();
      };
      script.onerror = () => resolve(); // fail silently
      document.head.appendChild(script);
    });
  }

  // === تحميل محرك التقدم (ديناميكي) ===
  function loadProgressEngine() {
    return new Promise((resolve) => {
      if (window.StartixProgress) { resolve(); return; }
      const script = document.createElement('script');
      script.src = '/assets/js/progress-engine.js?v=6';
      script.onload = () => resolve();
      script.onerror = () => resolve(); // fail silently
      document.head.appendChild(script);
    });
  }

  // ═══════════════════════════════════════════════
  // attachSidebarBehaviors — تفتح الأقسام النشطة بعد كل innerHTML
  // ═══════════════════════════════════════════════
  function attachSidebarBehaviors(sidebarEl) {
    const el = sidebarEl || document.querySelector('.stx-sidebar');
    if (!el) return;

    // فتح كل مرحلة / قسم يحتوي رابطاً نشطاً (class="active")
    el.querySelectorAll('.stx-item.active').forEach(function (activeLink) {
      // stx-phase
      const phase = activeLink.closest('.stx-phase');
      if (phase && !phase.classList.contains('phase-locked')) {
        phase.classList.add('open');
        const phaseItems = phase.querySelector('.stx-phase-items');
        if (phaseItems) phaseItems.style.maxHeight = '500px';
      }
      // stx-section
      const section = activeLink.closest('.stx-section');
      if (section) {
        section.classList.add('open');
        const sectionItems = section.querySelector('.stx-section-items');
        if (sectionItems) sectionItems.style.maxHeight = '800px';
      }
    });
  }

  /** 
   * 🏢 محرك تبديل السياق (Context Switcher) 
   * لتمكين المدير من التنقل بين المنشآت بسهولة
   */
  window._stxCtxToggle = async function (e) {
    if (e) e.stopPropagation();
    const btn = document.getElementById('stxCtxBtn');
    const dropdown = document.getElementById('stxCtxDropdown');
    if (!btn || !dropdown) return;

    const isOpen = dropdown.classList.contains('open');
    // إغلاق أي دروب داون أخرى
    document.querySelectorAll('.stx-ctx-dropdown.open').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.stx-ctx-btn.open').forEach(b => b.classList.remove('open'));

    if (!isOpen) {
      btn.classList.add('open');
      dropdown.classList.add('open');
      await refreshEntitiesList();
    }
  };

  async function refreshEntitiesList() {
    const dropdown = document.getElementById('stxCtxDropdown');
    if (!dropdown) return;

    try {
      const res = await fetch('/api/auth/my-entities', { credentials: 'include' });
      const data = await res.json();
      const entities = data.entities || [];
      const currentId = userData.activeEntityId || (userData.entity ? userData.entity.id : null);

      let html = '';
      entities.forEach(ent => {
        const isCurrent = ent.id === currentId;
        const nameAr = ent.company?.nameAr || ent.legalName || ent.displayName;
        const role = ent.members && ent.members[0] ? ent.members[0].role : (userData.role || 'مدير');

        html += `
          <div class="stx-ctx-item ${isCurrent ? 'current' : ''}" onclick="window._stxCtxSwitch('${ent.id}')">
            <div class="ctx-dot"></div>
            <div class="ctx-info">
              <div class="ctx-name">${escapeHtml(nameAr)}</div>
              <div class="ctx-role">${ROLE_LABELS[role] || role}</div>
            </div>
            ${isCurrent ? '<i class="bi bi-check2 text-primary"></i>' : ''}
          </div>
        `;
      });

      // زر إضافة منشأة جديدة
      html += `
        <div class="stx-ctx-add" onclick="window.location.href='/add-entity.html'">
          <i class="bi bi-plus-circle-dotted"></i>
          <span>إضافة منشأة جديدة</span>
        </div>
      `;

      dropdown.innerHTML = html;
    } catch (err) {
      console.error('Failed to load entities:', err);
      dropdown.innerHTML = '<div class="stx-ctx-loading text-danger">⚠️ فشل تحميل المنشآت</div>';
    }
  }

  window._stxCtxSwitch = async function (entityId) {
    try {
      const res = await fetch('/api/auth/switch-entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId }),
        credentials: 'include'
      });
      if (res.ok) {
        // تنظيف الكاش المحلي وتحديث الصفحة
        localStorage.removeItem('stratix_v10_dept');
        location.reload();
      } else {
        alert('فشل تبديل المنشأة');
      }
    } catch (err) {
      console.error('Switch error:', err);
    }
  };

  // إغلاق القائمة عند النقر خارجها
  document.addEventListener('click', () => {
    document.querySelectorAll('.stx-ctx-dropdown.open').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.stx-ctx-btn.open').forEach(b => b.classList.remove('open'));
  });
}

// ════════ الـ Bootstrapper (التشغيل النهائي للسايدبار) ════════
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    if (window.api && window.api.getCurrentUser) await window.api.getCurrentUser().catch(() => null);
    initSidebar();
  });
} else {
  (async () => {
    if (window.api && window.api.getCurrentUser) await window.api.getCurrentUser().catch(() => null);
    initSidebar();
  })();
}
