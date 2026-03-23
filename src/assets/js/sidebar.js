/**
 * Stratix — Sidebar v2 (الخيط الذهبي)
 * الهيكل الجديد — 6 مراحل (RBV):
 *   🏢 تشخيص الداخل → 🔍 تشخيص الخارج → 🎯 التركيب
 *   📌 الاختيار → 🏆 البناء → 🚀 التنفيذ → 📊 المتابعة
 *
 * المراحل والأدوات تُقرأ من journey-steps.js (مصدر مركزي واحد)
 */


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

function getUserRoleLabel(userData) {
  if (!userData) return '';
  if (userData.systemRole === 'SUPER_ADMIN') return ROLE_LABELS.SUPER_ADMIN;

  // إعطاء الأولوية لدور مدخل البيانات والمشاهد حتى لو كان تابعاً لإدارة
  if (userData.role === 'DATA_ENTRY') return ROLE_LABELS.DATA_ENTRY;
  if (userData.role === 'VIEWER') return ROLE_LABELS.VIEWER;

  if (userData.userType === 'DEPT_MANAGER') {
    const deptName = userData.department?.name || DEPT_LABELS[userData.department?.key] || '';
    return deptName ? `مدير ${deptName}` : ROLE_LABELS.DEPT_MANAGER;
  }
  return ROLE_LABELS[userData.userType] || ROLE_LABELS[userData.role] || userData.role || '';
}

async function initSidebar() {
  // 1. حماية ضد عطل الـ Load Order
  if (!window.api || !window.api.getCurrentUser) {
    console.error('⚠️ api.js لم يُحمّل أولاً! برجاء التأكد من استدعاء <script src="/assets/js/api.js"> قبل sidebar.js.');
    return;
  }

  // 2. الجلب الموثوق لبيانات المستخدم من الكاش الآمن للسيرفر 
  const userData = await window.api.getCurrentUser();
  if (!userData) {
    console.warn('⚠️ المستخدم غير مسجل دخول. السايدبار لن يُستكمل بناؤه لحين معالجة التوجيه.');
    return;
  }

  const currentPath = window.location.pathname;
  const fullPath = currentPath + window.location.search;
  const currentSearch = window.location.search;

  const token = localStorage.getItem('token') || '';
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
  const _uCat = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').userCategory || ''; } catch (e) { return ''; } })();
  const isInvestorUser = _diagRole === 'investor' || _uCat === 'INVESTOR' || _uCat.startsWith('INVESTOR_');

  const homeHref = isViewerOrDE ? '/viewer-hub.html'
    : (userType === 'BOARD_VIEWER' && isInvestorUser) ? '/investor-dashboard.html'
      : userType === 'BOARD_VIEWER' ? '/board-dashboard.html'
        : userType === 'DEPT_MANAGER' ? '/dept-dashboard.html'
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
      { label: 'التقارير الذكية', href: '/auto-reports.html', icon: 'bi-file-earmark-bar-graph', color: '#22c55e' },
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
      <a href="#" class="stx-item stx-logout" onclick="event.preventDefault(); localStorage.clear(); fetch('/api/auth/logout', {method:'POST', credentials:'same-origin'}).finally(()=>location.href='/login.html');" style="color:#ef4444;margin-top:4px">
        <i class="bi bi-box-arrow-right" style="color:#ef4444"></i>
        <span>تسجيل الخروج</span>
      </a>
      <div style="height:20px"></div>
    `;

    return html;
  }

  // === استخراج: سايدبار مدير الإدارة ===
  function buildDeptManagerSidebar() {
    let html = '';
    // === قراءة تقدم الرحلة من localStorage ===
    let mgrJourney = { steps: [false, false, false, false, false] };
    try {
      const saved = localStorage.getItem('stratix_mgr_journey');
      if (saved) {
        const parsed = JSON.parse(saved);
        // ترقية تلقائية: لو كانت 4 خطوات → وسّعها لـ 5
        if (parsed.steps && parsed.steps.length === 4) {
          parsed.steps.splice(1, 0, false); // أضف خطوة التحليل العميق كـ false
        }
        mgrJourney = parsed;
      }
    } catch (e) { /* ignore */ }

    // أسماء الإدارات للعرض
    const _deptNames = { hr: 'الموارد البشرية', finance: 'المالية', marketing: 'التسويق', operations: 'العمليات', sales: 'المبيعات', it: 'تقنية المعلومات', cs: 'خدمة العملاء', compliance: 'الامتثال', quality: 'الجودة', projects: 'المشاريع', support: 'الخدمات المساندة' };
    const _mgrDept = _v10Dept || 'compliance';
    const _mgrDeptName = _deptNames[_mgrDept] || 'إدارتك';

    // Fix for custom deep links
    let deepLink = `/dept-deep.html?dept=${_mgrDept}&single=1`;
    if (_mgrDept === 'hr') deepLink = '/hr-deep.html';
    if (_mgrDept === 'finance') deepLink = '/finance-deep.html';

    const journeySteps = [
      { num: 1, label: `بيئة ${_mgrDeptName}`, href: `/internal-env.html?dept=${_mgrDept}`, icon: 'bi-heart-pulse' },
      { num: 2, label: `تحليل ${_mgrDeptName} العميق`, href: deepLink, icon: 'bi-search-heart' },
      { num: 3, label: 'تحليل SWOT', href: `/swot.html?dept=${_mgrDept}`, icon: 'bi-grid-3x3-gap-fill' },
      { num: 4, label: 'التوجهات', href: `/directions.html?dept=${_mgrDept}`, icon: 'bi-compass-fill' },
      { num: 5, label: 'مؤشرات الأداء', href: `/kpis.html?dept=${_mgrDept}`, icon: 'bi-graph-up-arrow' },
    ];

    // حساب التقدم
    const completedCount = mgrJourney.steps.filter(Boolean).length;
    const journeyPercent = Math.round((completedCount / 5) * 100);

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

    const _wDept = _v10Dept || '';
    const workItems = [
      { label: 'المهام', href: _wDept ? `/tasks.html?dept=${_wDept}` : '/tasks.html', icon: 'bi-check2-square', color: '#f59e0b' },
      { label: 'إدخال المؤشرات', href: _wDept ? `/kpi-entries.html?dept=${_wDept}` : '/kpi-entries.html', icon: 'bi-pencil-square', color: '#3b82f6' },
      { label: 'ذكاء إدارتي', href: _wDept ? `/intelligence.html?dept=${_wDept}` : '/intelligence.html', icon: 'bi-robot', color: '#667eea' },
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
      <a href="#" class="stx-item stx-logout" onclick="event.preventDefault(); localStorage.clear(); fetch('/api/auth/logout', {method:'POST', credentials:'same-origin'}).finally(()=>location.href='/login.html');" style="color:#ef4444;margin-top:4px">
        <i class="bi bi-box-arrow-right" style="color:#ef4444"></i>
        <span>تسجيل الخروج</span>
      </a>
      <div style="height:20px"></div>
    `;

    // تعريض دالة إكمال الخطوة للصفحات
    window.stratixMgrComplete = function (stepNum) {
      try {
        let j = { steps: [false, false, false, false, false] };
        const s = localStorage.getItem('stratix_mgr_journey');
        if (s) {
          j = JSON.parse(s);
          // ترقية تلقائية: لو كانت 4 خطوات → وسّعها لـ 5
          if (j.steps && j.steps.length === 4) {
            j.steps.splice(1, 0, false);
          }
        }
        if (stepNum >= 1 && stepNum <= 5) {
          j.steps[stepNum - 1] = true;
        }
        localStorage.setItem('stratix_mgr_journey', JSON.stringify(j));
        console.log('[Sidebar] ✅ Manager journey step ' + stepNum + ' completed');
      } catch (e) { /* ignore */ }
    };

    return html;
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
  ];

  // === فلترة: مدير الإدارة يشوف إدارته فقط + مسار مخصص ===
  let filteredDeptItems;
  let _deptJourneyOverride = null; // مراحل مخصصة لمدير الإدارة

  if (userType === 'DEPT_MANAGER' && _v10Dept) {
    const deptItem = ALL_DEPT_ITEMS.find(d => d.key === _v10Dept);
    const deptNames = { hr: 'الموارد البشرية', finance: 'المالية', operations: 'العمليات', marketing: 'التسويق', sales: 'المبيعات', compliance: 'الامتثال والحوكمة', support: 'الخدمات المساندة' };
    const dName = deptNames[_v10Dept] || _v10Dept;

    if (deptItem) {
      let customDeepLink = `/dept-deep.html?dept=${_v10Dept}&single=1`;
      if (_v10Dept === 'hr') customDeepLink = '/hr-deep.html';
      if (_v10Dept === 'finance') customDeepLink = '/finance-deep.html';

      // أدوات التحليل الوظيفي لإدارته
      filteredDeptItems = [
        { label: 'تشخيص سريع', href: `/dept-diagnostic.html?dept=${_v10Dept}`, icon: 'bi-lightning-charge-fill' },
        { label: 'تشخيص عميق', href: customDeepLink, icon: 'bi-search-heart' },
      ];

      // === أدوات مخصصة لكل إدارة ===
      const deptSpecificTools = {
        hr: [
          { label: 'فحص HR التفاعلي', href: '/internal-env.html?dept=hr', icon: 'bi-fingerprint' },
          { label: 'تحليل HR العميق', href: '/hr-deep.html', icon: 'bi-people-fill' },
          { label: 'فحص الامتثال HR', href: '/hr-audit.html', icon: 'bi-shield-check' },
        ],
        finance: [
          { label: 'التحليل المالي العميق', href: '/finance-deep.html', icon: 'bi-cash-coin' },
          { label: 'لوحة التحليلات التنبؤية', href: '/analytics-dashboard.html', icon: 'bi-graph-up-arrow' },
        ],
        operations: [
          { label: 'تحليل العمليات', href: '/dept-deep.html?dept=operations&single=1', icon: 'bi-gear-wide-connected' },
        ],
        marketing: [
          { label: 'تحليل التسويق', href: '/dept-deep.html?dept=marketing&single=1', icon: 'bi-megaphone-fill' },
        ],
        sales: [
          { label: 'تحليل المبيعات', href: '/dept-deep.html?dept=sales&single=1', icon: 'bi-graph-up-arrow' },
        ],
        compliance: [
          { label: 'تحليل الامتثال', href: '/dept-deep.html?dept=compliance&single=1', icon: 'bi-shield-fill-check' },
        ],
        support: [
          { label: 'الخدمات المساندة', href: '/dept-deep.html?dept=support&single=1', icon: 'bi-wrench-adjustable' },
        ],
      };

      // بناء مراحل مخصصة لمدير الإدارة
      _deptJourneyOverride = [
        {
          id: 'INTERNAL_DEEP',
          nameAr: `تحليل ${dName}`,
          icon: deptItem.icon || 'bi-building-fill-gear',
          emoji: '📂',
          color: '#3b82f6',
          items: [
            ...filteredDeptItems,
            ...(deptSpecificTools[_v10Dept] || []),
          ]
        },
        {
          id: 'UNIFIED_SWOT',
          nameAr: `تحليل SWOT — ${dName}`,
          icon: 'bi-grid-fill',
          emoji: '🧩',
          color: '#10b981',
          items: [
            { label: 'تحليل SWOT', href: `/swot.html?dept=${_v10Dept}`, icon: 'bi-grid-3x3-gap-fill' },
            { label: 'التوجهات الاستراتيجية', href: `/directions.html?dept=${_v10Dept}`, icon: 'bi-compass-fill' },
          ]
        },
        {
          id: 'FORMULATION',
          nameAr: `مؤشرات ${dName}`,
          icon: 'bi-graph-up-arrow',
          emoji: '📊',
          color: '#ec4899',
          items: [
            { label: 'مؤشرات الأداء (KPIs)', href: `/kpis.html?dept=${_v10Dept}`, icon: 'bi-graph-up-arrow' },
            { label: 'المهام', href: '/tasks.html', icon: 'bi-check2-square' },
          ]
        },
      ];
    } else {
      filteredDeptItems = ALL_DEPT_ITEMS;
    }
  } else {
    filteredDeptItems = ALL_DEPT_ITEMS;
  }

  // ═══ المراحل — تُقرأ من الملف المركزي journey-steps.js ═══
  // خارجي أولاً → داخلي → تركيب → اختيار → بناء → تنفيذ → متابعة
  const journeyPhases = (window.StratixJourney && window.StratixJourney.phases)
    ? window.StratixJourney.phases
    : [
      {
        id: 'DIAGNOSIS_EXTERNAL', nameAr: 'تشخيص — الخارج', icon: 'bi-globe2', emoji: '🔍', color: '#ef4444',
        items: [
          { label: 'PESTEL (بيئة كلية)', href: '/analysis.html', icon: 'bi-binoculars-fill' },
          { label: 'قوى بورتر', href: '/tool-detail.html?code=PORTER', icon: 'bi-shield-exclamation' },
        ]
      },
      {
        id: 'DIAGNOSIS_INTERNAL', nameAr: 'تشخيص — الداخل', icon: 'bi-building-gear', emoji: '🏢', color: '#0d9488',
        items: [
          { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-building-fill-check' },
          { label: 'سلسلة القيمة', href: '/tool-detail.html?code=VALUE_CHAIN', icon: 'bi-link-45deg' },
          { label: 'استكشاف الإدارات', href: '/dept-deep.html', icon: 'bi-diagram-3-fill' },
        ]
      },
      {
        id: 'SYNTHESIS', nameAr: 'التركيب', icon: 'bi-grid-3x3-gap-fill', emoji: '🎯', color: '#22c55e',
        items: [
          { label: 'تحليل SWOT', href: '/swot.html', icon: 'bi-grid-3x3-gap-fill' },
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
      { label: 'مركز القيادة', href: '/command-center.html', icon: 'bi-shield-check', roles: ['OWNER', 'ADMIN'] },
      { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-building-fill-check', roles: [] },
      { label: 'الذكاء الاستراتيجي', href: '/intelligence.html', icon: 'bi-bell-fill', roles: [] },
      { type: 'header', label: '🧭 التخطيط والتوجه' },
      { label: 'خريطة الاستراتيجية', href: '/strategy-map.html', icon: 'bi-map-fill', roles: [] },
      { label: 'التقويم الاستراتيجي', href: '/strategic-calendar.html', icon: 'bi-calendar-range-fill', roles: [] },
      { label: 'الهيكل الديناميكي', href: '/dynamic-structure.html', icon: 'bi-diagram-3-fill', roles: ['OWNER', 'ADMIN'] },
      { type: 'header', label: '🔍 التحليل والتعمق' },
      { label: 'تقاريري', href: '/auto-reports.html', icon: 'bi-file-earmark-bar-graph', roles: [] },
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
      { label: 'التقارير التلقائية', href: '/auto-reports.html', icon: 'bi-file-earmark-bar-graph', roles: [] },
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
      { label: 'مؤشرات الأداء', href: '/kpis.html' + deptParam, icon: 'bi-speedometer2', roles: [] },
      { type: 'header', label: '📋 تنفيذ' },
      { label: 'إدخال المؤشرات', href: '/kpi-entries.html' + deptParam, icon: 'bi-pencil-square', roles: [] },
      { label: 'المبادرات', href: '/initiatives.html' + deptParam, icon: 'bi-kanban-fill', roles: [] },
      { label: 'تقرير ' + deptLabel, href: '/auto-reports.html' + deptParam, icon: 'bi-file-earmark-bar-graph', roles: [] },
    ];

    // ═══ مستشار ═══
    var consultantItems = [
      { type: 'header', label: '🔴 المدخلات الاستراتيجية' },
      { label: 'مركز القيادة', href: '/command-center.html', icon: 'bi-shield-check', roles: [] },
      { label: 'الكيانات', href: '/entities.html', icon: 'bi-building-fill', roles: [] },
      { label: 'صحة الشركة', href: '/company-health.html', icon: 'bi-building-fill-check', roles: [] },
      { type: 'header', label: '🔍 التحليل والتعمق' },
      { label: 'تقاريري', href: '/auto-reports.html', icon: 'bi-file-earmark-bar-graph', roles: [] },
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
    { label: 'الكيانات', href: '/entities.html', icon: 'bi-building-fill', roles: [] },
    { label: 'الفريق الاستراتيجي', href: '/team.html', icon: 'bi-person-lines-fill', roles: [] },
    { label: 'القطاعات والأنشطة', href: '/sectors.html', icon: 'bi-grid-3x3-gap-fill', roles: [] },
    { label: 'إدخال المؤشرات', href: '/kpi-entries.html', icon: 'bi-pencil-square', roles: [] },
    { label: 'معمل الاجتماعات', href: '/meeting-lab.html', icon: 'bi-people-fill', roles: [] },
    { label: 'المشاريع', href: '/projects.html', icon: 'bi-folder2-open', roles: [] },
    { label: 'التقييمات', href: '/assessments.html', icon: 'bi-clipboard-check-fill', roles: [] },
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

  // === بناء HTML السايدبار ===
  function buildSidebar(progressData) {
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
    // تحديد هل مستثمر أو عضو مجلس
    const _diagRole = (() => { try { return JSON.parse(localStorage.getItem('stratix_diagnostic_payload') || '{}').role || ''; } catch (e) { return ''; } })();
    const _uCat = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').userCategory || ''; } catch (e) { return ''; } })();
    const isInvestorUser = _diagRole === 'investor' || _uCat === 'INVESTOR' || _uCat.startsWith('INVESTOR_');

    const homeHref = isViewerOrDE ? '/viewer-hub.html'
      : (userType === 'BOARD_VIEWER' && isInvestorUser) ? '/investor-dashboard.html'
        : userType === 'BOARD_VIEWER' ? '/board-dashboard.html'
          : userType === 'DEPT_MANAGER' ? '/dept-dashboard.html'
            : '/dashboard.html';
    const isHomeActive = isActive('/dashboard.html') || isActive('/ceo-dashboard.html') || isActive('/viewer-hub.html') || isActive('/board-dashboard.html') || isActive('/dept-dashboard.html') || isActive('/investor-dashboard.html');
    html += `
      <a href="${homeHref}" class="stx-item stx-home-btn ${isHomeActive ? 'active' : ''}">
        <i class="bi bi-house-door-fill" style="color:#667eea;font-size:16px"></i>
        <span>الرئيسية</span>
      </a>
    `;

    // ╔═══════════════════════════════════════════════════════════╗
    // ║  🎯 مسار مدير الإدارة — سايدبار نظيف (٣ أقسام فقط)      ║
    // ╚═══════════════════════════════════════════════════════════╝
    // ╔═══════════════════════════════════════════════════════════════╗
    // ║  👁️ مسار المستثمر / عضو المجلس — قراءة فقط (3 أقسام)       ║
    // ╚═══════════════════════════════════════════════════════════════╝
    if (userType === 'BOARD_VIEWER' && !isViewerOrDE && !isSuperAdmin) {
      html += buildBoardViewerSidebar(isInvestorUser);
      return html;
    }

    // ╔═══════════════════════════════════════════════════════════╗
    // ║  🎯 مسار مدير الإدارة — سايدبار نظيف (٣ أقسام فقط)      ║
    // ╚═══════════════════════════════════════════════════════════╝
    if (userType === 'DEPT_MANAGER' && !isViewerOrDE) {
      html += buildDeptManagerSidebar();
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
        { label: 'مؤشرات الأداء', href: `/kpis.html${_v10Dept ? '?dept=' + _v10Dept : ''}`, icon: 'bi-graph-up-arrow' },
        { label: 'إدخال المؤشرات', href: `/kpi-entries.html${_v10Dept ? '?dept=' + _v10Dept : ''}`, icon: 'bi-pencil-square' },
        { label: 'المهام', href: '/tasks.html', icon: 'bi-check2-square' },
        { label: `تقرير ${_myDeptName}`, href: `/auto-reports.html${_v10Dept ? '?dept=' + _v10Dept : ''}`, icon: 'bi-file-earmark-bar-graph' },
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
      var roleFilteredPhases = (window.StratixJourney && window.StratixJourney.filterForRole)
        ? window.StratixJourney.filterForRole(userType)
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

    // --- عرض مبسّط للمشاهد/مدخل البيانات ---
    if (isViewerOrDE) {
      html += '<div class="stx-divider"></div>';
      if (userRole === 'DATA_ENTRY') {
        html += `
        <a href="/kpi-entries.html" class="stx-item ${isActive('/kpi-entries.html') ? 'active' : ''}">
            <i class="bi bi-input-cursor-text" style="color:#22c55e"></i>
            <span>إدخال المؤشرات</span>
          </a>
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
      const stFiltered = supportToolsItems.filter(item => hasAccess(item.roles));
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
        <a href="#" class="stx-item stx-logout" onclick="event.preventDefault(); localStorage.clear(); fetch('/api/auth/logout', {method:'POST', credentials:'same-origin'}).finally(()=>location.href='/login.html');" style="color:#ef4444;margin-top:4px">
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
      script.src = '/assets/js/path-engine.js?v=3';
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
      script.src = '/assets/js/suggested-tools.js?v=3';
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
      if (window.StratixProgress) { resolve(); return; }
      const script = document.createElement('script');
      script.src = '/assets/js/progress-engine.js?v=3';
      script.onload = () => resolve();
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

    // === تحميل SuggestedTools + ProgressEngine + بيانات التقدم ← إعادة بناء ===
    Promise.all([loadSuggestedTools(), loadProgressEngine()]).then(async () => {
      if (token && entityId && window.StratixProgress) {
        try {
          const progressResult = await window.StratixProgress.fetch();
          // Transform to API-compatible shape for buildSidebar
          const apiShape = progressResult ? {
            entityId: progressResult.entityId,
            versionId: progressResult.versionId,
            versionNumber: progressResult.versionNumber,
            overall: progressResult.overall,
            stages: window.StratixProgress.STAGE_IDS.map(id => ({
              id: id,
              nameAr: progressResult.phases[id]?.nameAr || '',
              percent: progressResult.phases[id]?.percent || 0,
              completed: progressResult.phases[id]?.completed || false,
              locked: progressResult.phases[id]?.locked || false,
              unlockAt: progressResult.phases[id]?.unlockAt || 0,
              unlockMsg: progressResult.phases[id]?.unlockMsg || ''
            }))
          } : null;
          newSidebar.innerHTML = buildSidebar(apiShape);
        } catch (err) {
          console.warn('[Sidebar] ProgressEngine error:', err);
          newSidebar.innerHTML = buildSidebar(null);
        }
      } else if (token && entityId) {
        // Fallback: direct API call if ProgressEngine failed to load
        try {
          const res = await fetch(`/api/user-progress/entity/${entityId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = res.ok ? await res.json() : null;
          newSidebar.innerHTML = buildSidebar(data);
        } catch {
          newSidebar.innerHTML = buildSidebar(null);
        }
      } else {
        // No token/entity — rebuild with SuggestedTools anyway
        newSidebar.innerHTML = buildSidebar(null);
      }
    });

    // 🔧 إصلاح شامل: بعد بناء الـ sidebar، أضف ?dept= لكل الروابط اللي ما فيها
    if (_v10Dept && userType === 'DEPT_MANAGER') {
      setTimeout(() => {
        const _deptPages = ['/kpis.html', '/kpis', '/swot.html', '/swot', '/directions.html', '/directions',
          '/objectives.html', '/objectives', '/initiatives.html', '/initiatives',
          '/internal-env.html', '/dept-deep.html', '/company-health.html',
          '/intelligence.html', '/intelligence', '/kpi-entries.html', '/tasks.html',
          '/auto-reports.html', '/choices.html'];
        document.querySelectorAll('a').forEach(a => {
          if (!a.href || a.href.startsWith('javascript:')) return;
          try {
            const url = new URL(a.href, location.origin);
            // dashboard → dept-dashboard
            if (url.pathname === '/dashboard.html' || url.pathname === '/dashboard') {
              a.href = '/dept-dashboard.html?dept=' + _v10Dept;
              return;
            }
            if (_deptPages.includes(url.pathname) && !url.searchParams.get('dept')) {
              url.searchParams.set('dept', _v10Dept);
              a.href = url.toString();
            }
          } catch (e) { }
        });
        console.log('[Sidebar] ✅ sidebar links patched with dept:', _v10Dept);
      }, 500);
    }

    // === CSS ===
    const style = document.createElement('style');
    style.textContent = getSidebarCSS(isDark);
    document.head.appendChild(style);

    // === Toggle Functions ===
    window.togglePhase = function (idx) {
      const phase = document.querySelector(`.stx-phase[data-phase="${idx}"]`);
      if (phase) phase.classList.toggle('open');
    };

    window.toggleSection = function (name) {
      const section = document.querySelector(`.stx-section[data-section="${name}"]`);
      if (section) section.classList.toggle('open');
    };

    // === Lock Toast ===
    window.showLockToast = function (msg) {
      const old = document.getElementById('stx-lock-toast');
      if (old) old.remove();

      const toast = document.createElement('div');
      toast.id = 'stx-lock-toast';
      toast.innerHTML = `<i class="bi bi-lock-fill"></i> ${msg}`;
      toast.style.cssText = `
        position: fixed; bottom: 24px; left: 24px; z-index: 99999;
        background: rgba(239, 68, 68, 0.92); color: #fff;
        padding: 14px 22px; border-radius: 14px;
        font-family: 'Tajawal', sans-serif; font-size: 14px; font-weight: 600;
        display: flex; align-items: center; gap: 8px;
        backdrop-filter: blur(10px);
        animation: toastSlide 0.4s ease;
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
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
      aiScript.src = '/assets/js/ai-advisor.js?v=3';
      aiScript.defer = true;
      document.body.appendChild(aiScript);
    }
  }); // end loadPathEngine().then()

}

// ════════ الـ Bootstrapper (التشغيل النهائي للسايدبار) ════════
// تم تأجيل استدعائه لأسفل الملف لمنع الرفع (Hoisting) وتطبيق أفضل الممارسات
if (!window.StratixJourney) {
  var _jScript = document.createElement('script');
  _jScript.src = '/assets/js/journey-steps.js?v=3';
  _jScript.async = true; // استخدام async مع onload لضمان التحميل
  _jScript.onload = () => initSidebar();
  document.head.appendChild(_jScript);
} else {
  initSidebar();
}
