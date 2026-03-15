/**
 * ستارتكس — API Helper المشترك
 * يُستخدم في كل الصفحات: <script src="/js/api.js"></script>
 */
(function () {
    'use strict';

    // === Token Management ===
    // ⚠️ DEPRECATED: التوكن الآن في HttpOnly Cookie — لا يُقرأ من الفرونتند
    // هذه الدوال موجودة فقط للتوافق مع الصفحات القديمة
    function getToken() {
        return localStorage.getItem('token') || '';
    }

    function setToken(token) {
        // 🔒 لا نخزن التوكن الحقيقي — العلامة فقط لتمرير فحوصات if (!token)
        if (token) localStorage.setItem('token', 'httponly-managed');
    }

    function clearToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('selectedVersionId');
        // مسح الكوكي من السيرفر
        fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => { });
    }

    // === Authentication via /api/user/me ===
    let _cachedUser = null;
    let _userFetchPromise = null;

    /**
     * جلب بيانات المستخدم الحالي من السيرفر (عبر HttpOnly Cookie)
     * النتيجة تُخزّن في الذاكرة — لا تُخزّن في localStorage
     * @param {boolean} force - إعادة الجلب حتى لو موجودة في الكاش
     * @returns {Promise<object|null>} بيانات المستخدم أو null
     */
    async function getCurrentUser(force = false) {
        if (_cachedUser && !force) return _cachedUser;
        // تجنب طلبات متزامنة متعددة لنفس الـ endpoint
        if (_userFetchPromise && !force) return _userFetchPromise;

        _userFetchPromise = (async () => {
            try {
                const res = await fetch('/api/user/me', { credentials: 'same-origin' });
                if (res.status === 401) {
                    _cachedUser = null;
                    return null;
                }
                if (res.status === 403) {
                    // حساب معلّق
                    const errData = await res.json().catch(() => ({}));
                    if (errData.suspended) {
                        localStorage.setItem('suspendReason', errData.reason || '');
                        window.location.href = '/account-suspended.html';
                        return null;
                    }
                }
                if (!res.ok) {
                    _cachedUser = null;
                    return null;
                }
                _cachedUser = await res.json();
                return _cachedUser;
            } catch (err) {
                console.warn('[getCurrentUser] Network error:', err.message);
                _cachedUser = null;
                return null;
            } finally {
                _userFetchPromise = null;
            }
        })();

        return _userFetchPromise;
    }

    /**
     * التحقق من أن المستخدم مسجل الدخول
     * لو غير مسجل → يتم توجيهه لصفحة تسجيل الدخول
     * @returns {Promise<boolean>} true لو مسجل، false لو تم التوجيه
     */
    async function requireAuth() {
        const user = await getCurrentUser();
        if (!user) {
            sessionStorage.setItem('stratix_return_url', location.pathname + location.search);
            window.location.href = '/login?from=restore';
            return false;
        }
        return true;
    }

    // === API Call ===
    async function api(url, opts = {}) {
        const token = getToken();

        // Offline check
        if (!navigator.onLine) {
            showToast('⚡ لا يوجد اتصال بالإنترنت — سنحاول تلقائياً عند عودة الاتصال', 5000);
            await waitForOnline();
        }

        // Auto-inject entity context for SUPER_ADMIN impersonation
        const extraHeaders = {};
        const userData = getUserData();
        if (userData.systemRole === 'SUPER_ADMIN' && userData.entity?.id) {
            extraHeaders['X-Entity-Id'] = userData.entity.id;
        }
        // 🔒 لا نرسل Authorization header — الكوكي HttpOnly يُرسل تلقائياً
        // نبقي كـ fallback فقط للصفحات التي لا تستخدم api()
        // if (token) extraHeaders['Authorization'] = `Bearer ${token}`;

        const maxRetries = opts._noRetry ? 0 : 2;
        let lastError = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const res = await fetch(url, {
                    ...opts,
                    credentials: 'same-origin', // 🔒 إرسال HttpOnly Cookie تلقائياً
                    headers: {
                        'Content-Type': 'application/json',
                        ...extraHeaders,
                        ...opts.headers
                    }
                });

                if (res.status === 401) {
                    clearToken();
                    window.location.href = '/login.html';
                    return;
                }

                // فحص تعليق الحساب
                if (res.status === 403) {
                    try {
                        const errData = await res.clone().json();
                        if (errData.suspended) {
                            localStorage.setItem('suspendReason', errData.reason || '');
                            window.location.href = '/account-suspended.html';
                            return;
                        }
                    } catch (e) { /* not JSON */ }
                }

                if (!res.ok) {
                    const errorText = await res.text().catch(() => '');
                    let errorMsg = `API ${res.status}: ${url}`;
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorMsg = errorJson.error || errorJson.message || errorMsg;
                    } catch (e) { /* not JSON */ }
                    // Don't retry 4xx client errors (except 408, 429)
                    if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
                        throw new Error(errorMsg);
                    }
                    throw new Error(errorMsg);
                }

                return res.json();
            } catch (err) {
                lastError = err;
                if (attempt < maxRetries) {
                    // Exponential backoff: 500ms, 1500ms
                    const delay = 500 * Math.pow(3, attempt);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
            }
        }

        throw lastError || new Error(`فشل الاتصال: ${url}`);
    }

    // === Wait for Online ===
    function waitForOnline() {
        return new Promise(resolve => {
            if (navigator.onLine) return resolve();
            const handler = () => {
                window.removeEventListener('online', handler);
                showToast('✅ عاد الاتصال — يتم استئناف العملية');
                resolve();
            };
            window.addEventListener('online', handler);
        });
    }

    // === Entity Context ===
    function getEntityContext() {
        const u = getUserData();
        let entityId = u.entity?.id || u.activeEntityId || localStorage.getItem('entityId') || '';

        // Safety: auto-save entityId if found in user data but missing from localStorage
        if (entityId && !localStorage.getItem('entityId')) {
            localStorage.setItem('entityId', entityId);
        }

        return {
            entityId,
            entityName: u.entity?.displayName || u.entity?.legalName || '',
            companyName: u.entity?.company?.nameAr || u.entity?.company?.nameEn || '',
            sectorName: u.entity?.sector?.nameAr || '',
        };
    }

    /**
     * يعرض بانر اسم الجهة في أعلى الصفحة تلقائياً
     * يُضاف داخل أول .main-content أو .page-content
     */
    function showEntityBanner(options = {}) {
        const ctx = getEntityContext();
        const container = document.querySelector(options.container || '.main-content');
        if (!container) return;

        const orgName = ctx.companyName || ctx.entityName || 'غير محدد';
        const hasEntity = !!(ctx.entityId);
        const toolName = options.toolName || '';

        const banner = document.createElement('div');
        banner.className = 'stx-entity-banner';
        banner.innerHTML = `
            <div class="stx-eb-icon">${hasEntity ? '🏢' : '⚠️'}</div>
            <div class="stx-eb-info">
                <div class="stx-eb-name">${orgName}</div>
                <div class="stx-eb-meta">${hasEntity ? (toolName ? toolName + ' — ' : '') + 'البيانات مرتبطة بهذه الجهة' : 'لم يتم تحديد الجهة — اختر من الإعدادات'}</div>
            </div>
            ${hasEntity ? '<div class="stx-eb-badge">✅ مرتبط</div>' : '<div class="stx-eb-badge stx-eb-warn">⚠️ غير مرتبط</div>'}
        `;

        // Inject styles if not present
        if (!document.getElementById('stxEntityBannerCSS')) {
            const style = document.createElement('style');
            style.id = 'stxEntityBannerCSS';
            style.textContent = `
                .stx-entity-banner{display:flex;align-items:center;gap:14px;padding:14px 20px;margin-bottom:20px;border-radius:14px;background:linear-gradient(135deg,rgba(102,126,234,0.06),rgba(118,75,162,0.04));border:1px solid rgba(102,126,234,0.15);animation:stxFadeIn .3s ease}
                .stx-entity-banner.stx-no-entity{background:rgba(245,158,11,0.06);border-color:rgba(245,158,11,0.2)}
                .stx-eb-icon{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#667eea,#a78bfa);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
                .stx-eb-info{flex:1}
                .stx-eb-name{font-size:15px;font-weight:800;color:var(--text,#e2e8f0)}
                .stx-eb-meta{font-size:11px;color:var(--text-muted,#94a3b8);margin-top:2px}
                .stx-eb-badge{padding:5px 12px;border-radius:8px;font-size:11px;font-weight:700;background:rgba(34,197,94,0.1);color:#22c55e;white-space:nowrap}
                .stx-eb-badge.stx-eb-warn{background:rgba(245,158,11,0.1);color:#f59e0b}
                @keyframes stxFadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
            `;
            document.head.appendChild(style);
        }

        if (!hasEntity) banner.classList.add('stx-no-entity');

        // Insert as first child of container
        const firstChild = container.querySelector('.page-header');
        if (firstChild && firstChild.nextSibling) {
            container.insertBefore(banner, firstChild.nextSibling);
        } else {
            container.prepend(banner);
        }
    }

    // === Convenience Methods ===
    async function apiGet(url) {
        return api(url);
    }

    async function apiPost(url, data) {
        return api(url, { method: 'POST', body: JSON.stringify(data) });
    }

    async function apiPatch(url, data) {
        return api(url, { method: 'PATCH', body: JSON.stringify(data) });
    }

    async function apiDelete(url) {
        return api(url, { method: 'DELETE' });
    }

    // === Version Helper ===
    function getSelectedVersionId() {
        return localStorage.getItem('selectedVersionId') || '';
    }

    function setSelectedVersionId(id) {
        localStorage.setItem('selectedVersionId', id);
    }

    async function ensureVersionId() {
        let vId = getSelectedVersionId();
        if (vId) return vId;

        try {
            const data = await api('/api/versions');
            const versions = data.versions || data || [];
            if (Array.isArray(versions) && versions.length > 0) {
                vId = versions[0].id;
                setSelectedVersionId(vId);
                return vId;
            }
        } catch (e) {
            console.warn('Could not load versions:', e.message);
        }
        return null;
    }

    // === Toast Notification ===
    function showToast(msg, duration = 3000) {
        const existing = document.getElementById('startixToast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'startixToast';
        toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#1a1d2e,#232640);color:#e2e8f0;padding:14px 28px;border-radius:14px;font-family:Tajawal,sans-serif;font-size:14px;font-weight:600;z-index:99999;border:1px solid rgba(255,255,255,0.1);box-shadow:0 8px 30px rgba(0,0,0,0.5);animation:toastIn .3s ease';
        toast.textContent = msg;

        // Add animation
        if (!document.getElementById('toastStyles')) {
            const style = document.createElement('style');
            style.id = 'toastStyles';
            style.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'all .3s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // === Role & Permission Helpers ===
    function getUserData() {
        try { return JSON.parse(localStorage.getItem('user')) || {}; } catch (e) { return {}; }
    }

    function getUserRole() {
        const u = getUserData();
        return u.role || 'VIEWER';
    }

    function getSystemRole() {
        const u = getUserData();
        return u.systemRole || 'USER';
    }

    // ROLE_HIERARCHY matching backend
    const ROLE_LEVELS = { OWNER: 5, ADMIN: 4, EDITOR: 3, DATA_ENTRY: 1, VIEWER: 0 };

    function hasMinRole(minRole) {
        if (getSystemRole() === 'SUPER_ADMIN') return true;
        const userLevel = ROLE_LEVELS[getUserRole()] || 0;
        const requiredLevel = ROLE_LEVELS[minRole] || 0;
        return userLevel >= requiredLevel;
    }

    // Convenience shortcuts
    function canEdit() { return hasMinRole('EDITOR'); }
    function canAdmin() { return hasMinRole('ADMIN'); }
    function canEnterData() { return hasMinRole('DATA_ENTRY'); } // DATA_ENTRY+ يقدر يدخل بيانات KPI
    function isViewer() { return getUserRole() === 'VIEWER' && getSystemRole() !== 'SUPER_ADMIN'; }
    function isDataEntry() { return getUserRole() === 'DATA_ENTRY' && getSystemRole() !== 'SUPER_ADMIN'; }

    /**
     * إخفاء عناصر الإنشاء/التعديل/الحذف تلقائياً للمشاهدين
     * يتم تشغيلها تلقائياً عند تحميل الصفحة
     * العناصر المستهدفة:
     *   - .btn-add, .btn-delete, .btn-edit
     *   - [data-requires-edit]
     *   - أي عنصر فيه class "role-edit-only"
     */
    function enforceRoleUI() {
        if (canEdit()) return; // المحرر+ يشوف كل شي

        const isDataEntryPage = location.pathname.includes('kpi-entries') || location.pathname.includes('data-forms') || location.pathname.includes('statistical-data');
        const isDE = isDataEntry();

        // DATA_ENTRY في صفحة إدخال KPI — يشوف أزرار الإضافة
        if (isDE && isDataEntryPage) {
            // فقط نخفي أزرار الحذف (EDITOR+ فقط)
            const style = document.createElement('style');
            style.textContent = `
                .btn-delete, [data-requires-edit] { display: none !important; }
                .data-entry-badge::after {
                    content: '📝 وضع إدخال البيانات';
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(34,197,94,0.85);
                    color: #fff;
                    padding: 8px 20px;
                    border-radius: 20px;
                    font-size: 12px;
                    z-index: 9999;
                    pointer-events: none;
                }
            `;
            document.head.appendChild(style);
            document.body.classList.add('data-entry-badge');
            return;
        }

        // VIEWER أو DATA_ENTRY خارج صفحة الإدخال — إخفاء كل أزرار التعديل
        const selectors = [
            '.btn-add',
            '.btn-delete',
            '.btn-edit',
            '[data-requires-edit]',
            '.role-edit-only'
        ];

        const badgeText = isDE ? '📝 مُدخل بيانات' : '🔒 وضع المشاهدة';
        const badgeBg = isDE ? 'rgba(34,197,94,0.85)' : 'rgba(0,0,0,0.7)';

        const style = document.createElement('style');
        style.textContent = `
            ${selectors.join(', ')} { display: none !important; }
            .viewer-badge::after {
                content: '${badgeText}';
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: ${badgeBg};
                color: #fff;
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 9999;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
        document.body.classList.add('viewer-badge');
    }

    // === Global Fallback Routing (حارس البوابات) ===
    const STRATEGIC_PAGES = [
        '/swot.html', '/swot',
        '/tows.html', '/tows',
        '/directions.html', '/directions',
        '/objectives.html', '/objectives',
        '/kpis.html', '/kpis',
        '/initiatives.html', '/initiatives',
        '/risk-map.html', '/risk-map',
        '/strategy-map.html', '/strategy-map',
        '/action-plan.html', '/action-plan'
    ];

    async function enforceStrategicContext() {
        const path = window.location.pathname;
        const needsContext = STRATEGIC_PAGES.some(p => path.endsWith(p));

        // إذا كانت الصفحة تتطلب سياقاً استراتيجياً (versionId)
        if (needsContext && getToken()) {
            const vId = await ensureVersionId();
            if (!vId) {
                // إخفاء المحتوى فوراً لمنع الوميض وظهور أخطاء Console
                const main = document.querySelector('.main-content');
                if (main) main.style.opacity = '0';

                showToast('⚠️ فقدنا سياق العمل أو لا يوجد إصدار نشط. جاري إعادتك للرئيسية...', 4000);
                setTimeout(() => {
                    const u = getUserData();
                    window.location.href = u.userType === 'DEPT_MANAGER' ? '/dept-dashboard.html' : '/dashboard.html';
                }, 2000);
            }
        }
    }

    // === Global Link Patcher (معترض الروابط الذكي) ===
    function patchLinksOnFly() {
        document.addEventListener('click', (e) => {
            const u = getUserData();
            // 🚨 حماية المالك والمستثمر من الاحتجاز داخل مسار الإدارة
            if (u.userType !== 'DEPT_MANAGER') return;

            const link = e.target.closest('a');
            if (!link || !link.href || link.href.startsWith('javascript:')) return;

            try {
                const targetUrl = new URL(link.href, window.location.origin);
                // تجاهل الروابط الخارجية
                if (targetUrl.origin !== window.location.origin) return;

                const currentParams = new URLSearchParams(window.location.search);
                const dept = currentParams.get('dept');

                if (dept) {
                    const STRATEGIC_PAGES = [
                        '/swot', '/tows', '/directions', '/objectives', '/kpis',
                        '/initiatives', '/risk-map', '/strategy-map', '/action-plan',
                        '/internal-env', '/dept-deep', '/dept-dashboard', '/intelligence',
                        '/kpi-entries', '/tasks', '/auto-reports', '/choices', '/analysis'
                    ];

                    // إذا كانت الصفحة وجهة استراتيجية، احقن سياق الإدارة قبل الانتقال
                    const needsDept = STRATEGIC_PAGES.some(p => targetUrl.pathname.includes(p));
                    if (needsDept && !targetUrl.searchParams.has('dept')) {
                        targetUrl.searchParams.set('dept', dept);
                        link.href = targetUrl.toString();
                    }
                }
            } catch (err) { /* ignore */ }
        }, true); // Use capture phase to intercept early
    }

    // === Role & Context Banner (شريط الهوية السياقي) ===
    function injectRoleContextBanner() {
        const u = getUserData();
        const urlParams = new URLSearchParams(window.location.search);
        const deptParam = urlParams.get('dept');

        const isOwner = u.role === 'OWNER' || u.role === 'ADMIN' || u.systemRole === 'SUPER_ADMIN';
        const isDeptManager = u.userType === 'DEPT_MANAGER';

        const DEPT_NAMES = {
            'hr': 'الموارد البشرية', 'finance': 'المالية', 'marketing': 'التسويق',
            'operations': 'العمليات', 'sales': 'المبيعات', 'it': 'تقنية المعلومات',
            'cs': 'خدمة العملاء', 'compliance': 'الامتثال والحوكمة', 'quality': 'الجودة',
            'projects': 'إدارة المشاريع', 'support': 'الخدمات المساندة'
        };

        let bannerHtml = '';
        let bannerClass = '';

        if (isOwner && deptParam) {
            const dName = DEPT_NAMES[deptParam] || deptParam;
            bannerHtml = `<i class="bi bi-shield-lock-fill"></i> <strong>صلاحية الإدارة العليا:</strong> أنت تتصفح وتدير بيانات قسم <strong>[${dName}]</strong> نيابة عنهم.`;
            bannerClass = 'role-banner-owner';
        } else if (isDeptManager) {
            const myDept = DEPT_NAMES[deptParam || localStorage.getItem('stratix_v10_dept')] || 'إدارتك';
            bannerHtml = `<i class="bi bi-person-badge-fill"></i> <strong>صلاحية مدير إدارة:</strong> أنت تتصفح ضمن المسار المخصص لـ <strong>[${myDept}]</strong>.`;
            bannerClass = 'role-banner-dept';
        } else {
            return; // لا نعرض الشريط في الصفحات العامة للمالك
        }

        const banner = document.createElement('div');
        banner.className = `stx-role-banner ${bannerClass}`;
        banner.innerHTML = bannerHtml;

        if (!document.getElementById('stxRoleBannerCSS')) {
            const style = document.createElement('style');
            style.id = 'stxRoleBannerCSS';
            style.textContent = `
                .stx-role-banner { padding: 10px 24px; font-size: 13px; display: flex; align-items: center; gap: 8px; z-index: 99; position: relative; font-family: 'Tajawal', sans-serif; }
                .stx-role-banner strong { font-weight: 800; }
                .role-banner-owner { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-bottom: 1px solid rgba(56, 189, 248, 0.3); }
                .role-banner-dept { background: rgba(167, 139, 250, 0.15); color: #c4b5fd; border-bottom: 1px solid rgba(167, 139, 250, 0.3); }
                .stx-role-banner i { font-size: 16px; }
            `;
            document.head.appendChild(style);
        }

        const topNav = document.querySelector('.top-nav') || document.querySelector('header');
        if (topNav && topNav.nextSibling) {
            topNav.parentNode.insertBefore(banner, topNav.nextSibling);
        } else {
            document.body.prepend(banner);
        }
    }

    // Auto-run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { enforceRoleUI(); enforceStrategicContext(); patchLinksOnFly(); injectRoleContextBanner(); });
    } else {
        enforceRoleUI(); enforceStrategicContext(); patchLinksOnFly(); injectRoleContextBanner();
    }

    // === 🔒 XSS Prevention Helpers ===
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttr(str) {
        return escapeHtml(str);
    }

    /**
     * 🔒 آمن: يضبط نص عنصر عبر textContent (لا innerHTML)
     * @param {string} id - معرف العنصر
     * @param {string} text - النص الآمن
     */
    function safeText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text ?? '';
    }

    // 🔒 اختصارات عالمية لسهولة الاستخدام في كل الصفحات
    window.esc = escapeHtml;
    window.escA = escapeAttr;
    window.safeText = safeText;

    // === Expose API ===
    window.StartixAPI = {
        api,
        apiGet,
        apiPost,
        apiPatch,
        apiDelete,
        getToken,
        setToken,
        clearToken,
        requireAuth,
        getCurrentUser,
        getSelectedVersionId,
        setSelectedVersionId,
        ensureVersionId,
        showToast,
        // Entity context
        getEntityContext,
        showEntityBanner,
        // Role helpers
        getUserData,
        getUserRole,
        getSystemRole,
        hasMinRole,
        canEdit,
        canAdmin,
        canEnterData,
        isViewer,
        isDataEntry,
        enforceRoleUI,
        enforceStrategicContext,
        // 🔒 XSS helpers
        escapeHtml,
        escapeAttr,
        safeText,
    };

    // Shortcut — backward compatible
    window.startixApi = api;

})();
