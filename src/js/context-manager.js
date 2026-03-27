// js/context-manager.js
/**
 * 🛠️ Stratix Context Manager – النسخة النهائية المعدلة
 * يدير السياق بين جميع الأدوار: مالك، مدير قسم، مستثمر، مستشار، مسؤول، مشرف، زائر
 * يحافظ على توافق النظام القديم مع الإضافات الخاصة بالدروع (SessionStorage)
 */
(function (window) {
    // ======================
    // دوال مساعدة
    // ======================
    function safeParse(str, fallback = null) {
        if (!str) return fallback;
        try {
            return JSON.parse(str);
        } catch (e) {
            return fallback;
        }
    }

    // قراءة آمنة من localStorage
    function safeLocalParse(key, fallback = null) {
        const val = localStorage.getItem(key);
        return safeParse(val, fallback);
    }

    // الحصول على المستخدم (من window.user أو localStorage)
    function getUser() {
        if (window.user) return window.user;
        const localUser = safeLocalParse('user');
        if (localUser) {
            window.user = localUser;
            return localUser;
        }
        return null;
    }

    // تحديد الدور الحالي
    function getUserRole() {
        const user = getUser();
        if (user) {
            const role = (user.role || user.userType || user.systemRole || '').toUpperCase();
            const ownerRoles = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'COMPANY_MANAGER'];

            if (user.userType === 'DEPT_MANAGER' || (user.userCategory && user.userCategory.startsWith('DEPT_'))) return 'dept_manager';
            if (ownerRoles.includes(role)) return 'owner';
            if (role === 'INVESTOR') return 'investor';
            if (role === 'CONSULTANT' || user.userType === 'CONSULTANT') return 'consultant';
            if (role === 'SYSTEM_ADMIN') return 'system_admin';
            if (role === 'SUPERVISOR') return 'supervisor';

            return 'owner'; // افتراضي للمستخدمين المسجلين غير المحددين
        }
        // زائر: من sessionStorage
        const guestDiag = sessionStorage.getItem('stratix_guest_diagnosis');
        if (guestDiag) {
            try {
                const diag = JSON.parse(guestDiag);
                if (diag.role) return diag.role;
            } catch (e) { }
        }
        return 'guest';
    }

    // الحصول على القسم (للمدير أو المشرف)
    function getDept() {
        const role = getUserRole();
        if (!['dept_manager', 'supervisor'].includes(role)) return null;

        const urlParams = new URLSearchParams(window.location.search);
        let dept = urlParams.get('dept');
        if (!dept) dept = localStorage.getItem('stratix_v10_dept') || localStorage.getItem('stratix_current_dept');

        if (dept) return dept.toLowerCase();

        const user = getUser();
        if (user?.department?.key) return user.department.key.toLowerCase();
        if (user?.deptCode) return user.deptCode.toLowerCase();

        return null;
    }

    // الحصول على versionId (للمالك أو المشرف)
    function getActiveVersionId() {
        const role = getUserRole();
        if (!['owner', 'supervisor'].includes(role)) return null;

        if (role === 'supervisor') {
            const urlParams = new URLSearchParams(window.location.search);
            const version = urlParams.get('versionId');
            if (version) return version;
        }

        const user = getUser();
        let fallback = localStorage.getItem('stratix_last_version') || localStorage.getItem('selectedVersionId');
        return user?.entity?.activeVersionId || fallback || null;
    }

    // بناء المفتاح للتخزين (عزل تام)
    function buildKey(baseKey, isTemporary = false) {
        const role = getUserRole();
        if (role === 'owner') {
            const versionId = getActiveVersionId();
            return versionId ? `owner_${versionId}_${baseKey}` : `stratix_${baseKey}`; // Backward compat
        }
        if (role === 'dept_manager') {
            const dept = getDept();
            if (!dept) throw new Error('[Context] مدير قسم بدون تحديد القسم');
            return `stratix_${dept}_${baseKey}`;
        }
        if (role === 'investor') {
            const userId = getUser()?.id || 'unknown';
            return `investor_${userId}_${baseKey}`;
        }
        if (role === 'consultant') {
            const clientId = sessionStorage.getItem('stratix_active_client') || 'default';
            return `consultant_${clientId}_${baseKey}`;
        }
        if (role === 'system_admin') {
            const userId = getUser()?.id || 'unknown';
            return `admin_${userId}_${baseKey}`;
        }
        if (role === 'supervisor') {
            const userId = getUser()?.id || 'unknown';
            const versionId = getActiveVersionId();
            const suffix = versionId ? `_${versionId}` : '';
            return `supervisor_${userId}${suffix}_${baseKey}`;
        }
        return `guest_${baseKey}`;
    }

    // واجهة التخزين
    function setItem(key, value, isTemporary = false) {
        const fullKey = buildKey(key, isTemporary);
        const storage = isTemporary ? sessionStorage : localStorage;
        storage.setItem(fullKey, JSON.stringify(value));
        return value;
    }

    function getItem(key, defaultValue = null, isTemporary = false) {
        const fullKey = buildKey(key, isTemporary);
        const storage = isTemporary ? sessionStorage : localStorage;
        const raw = storage.getItem(fullKey);

        if (!raw && !isTemporary && getUserRole() === 'owner') {
            // Fallback for old stratix prefixes if strict versioning fails
            const fallbackKey = `stratix_${key}`;
            const fallbackRaw = storage.getItem(fallbackKey);
            if (fallbackRaw) return safeParse(fallbackRaw, defaultValue);
        }

        if (!raw) return defaultValue;
        return safeParse(raw, defaultValue);
    }

    function removeItem(key, isTemporary = false) {
        const fullKey = buildKey(key, isTemporary);
        const storage = isTemporary ? sessionStorage : localStorage;
        storage.removeItem(fullKey);
    }

    function setTemp(key, value) { return setItem(key, value, true); }
    function getTemp(key, defaultValue = null) { return getItem(key, defaultValue, true); }
    function removeTemp(key) { return removeItem(key, true); }

    // التحقق من اكتمال خطوة
    function isStepCompletedSync(stepName) {
        const userType = getUserRole();

        if (userType === 'owner') {
            switch (stepName) {
                case 'swot':
                    const swot = getItem('swot_data') || safeLocalParse('stratix_swot_payload');
                    return swot && (swot.strengths?.length > 0 || swot.weaknesses?.length > 0);
                case 'directions':
                    return getItem('directions_completed') === true;
                default:
                    return false;
            }
        } else if (userType === 'dept_manager') {
            switch (stepName) {
                case 'deep':
                    const deep = getItem('deep_results') || getItem('audit');
                    return deep && Object.keys(deep).length > 0;
                case 'audit':
                    return getItem('audit_answers') !== null || getItem('audit_completed') === true;
                case 'swot':
                    return getItem('swot') !== null;
                case 'directions':
                    const dirs = getItem('directions');
                    return dirs && dirs.length > 0;
                case 'objectives':
                    const objs = getItem('objectives') || getItem('okrs');
                    return objs && objs.length > 0;
                case 'initiatives':
                    const inits = getItem('initiatives');
                    return inits && inits.length > 0;
                default:
                    return false;
            }
        }
        return false;
    }

    async function isStepCompleted(stepName) {
        // Fallback for sync
        return isStepCompletedSync(stepName);
    }

    /**
     * تسجيل اكتمال خطوة — يحفظ محلياً أولاً، ثم يحاول API
     * @param {string} stepId - معرف الخطوة ('deep', 'audit', 'swot', ...)
     * @returns {Promise<boolean>}
     */
    async function markStepCompleted(stepId) {
        const dept = getDept();

        // ── 1. حفظ محلي فوري (لضمان عمل isStepCompleted بعدها) ──
        try {
            const raw = localStorage.getItem('stratix_mgr_journey');
            let journey = raw ? JSON.parse(raw) : { dept: dept || '', steps: [] };
            if (!Array.isArray(journey.steps)) journey.steps = [];

            // إضافة الخطوة إن لم تكن موجودة
            if (!journey.completedIds) journey.completedIds = [];
            if (!journey.completedIds.includes(stepId)) {
                journey.completedIds.push(stepId);
            }
            // دعم مصفوفة الخطوات بالترتيب (steps-config.js)
            if (typeof getDepartmentSteps !== 'undefined' && dept) {
                const allSteps = getDepartmentSteps(dept);
                const idx = allSteps.findIndex(s => s.id === stepId);
                while (journey.steps.length <= idx) journey.steps.push(false);
                if (idx >= 0) journey.steps[idx] = true;
            }
            journey.dept = dept || journey.dept;
            localStorage.setItem('stratix_mgr_journey', JSON.stringify(journey));
        } catch (e) {
            console.error('[Context] markStepCompleted - localStorage error:', e);
        }

        // ── 2. محاولة API (إن فشلت نرجع true لأن الحفظ المحلي نجح) ──
        try {
            const body = JSON.stringify({ stepId, dept: dept || '' });
            const headers = { 'Content-Type': 'application/json' };
            let res;

            if (typeof window.apiRequest === 'function') {
                // api.js موجود
                res = await window.apiRequest('/api/progress', { method: 'POST', body: { stepId, dept } });
                return !!res && (res.success === true || res.ok === true || res.status === 'done');
            } else {
                const fetchRes = await fetch('/api/progress', {
                    method: 'POST',
                    headers,
                    credentials: 'include',
                    body
                });
                if (!fetchRes.ok) {
                    // API غير موجود أو خطأ — الحفظ المحلي كافٍ
                    console.warn('[Context] markStepCompleted - API returned', fetchRes.status, '(local save OK)');
                    return true;
                }
                const data = await fetchRes.json();
                return !!data && (data.success === true || data.ok === true || data.status === 'done');
            }
        } catch (error) {
            // فشل الشبكة — الحفظ المحلي نجح فنرجع true
            console.warn('[Context] markStepCompleted - API unreachable, local save used:', error.message);
            return true;
        }
    }

    // التوجيه بعد التسجيل أو تسجيل الدخول
    function redirectAfterLogin() {
        const role = getUserRole();
        const user = getUser();

        if (role === 'system_admin') {
            window.location.href = '/admin-dashboard.html';
            return;
        }
        if (role === 'supervisor') {
            window.location.href = '/supervisor-dashboard.html';
            return;
        }
        if (role === 'owner') {
            // التوجيه الذكي باستخدام محرك التشخيص
            if (window.DiagnosticEngine && window.DiagnosticEngine.classifyOwner) {
                const diagnosis = user?.diagnosticData || user?.entity?.diagnosis || user?.diagnosis;
                if (diagnosis) {
                    const result = window.DiagnosticEngine.classifyOwner(diagnosis);
                    const pathKey = result.pathKey; // nascent_cautious, growing_ambitious, mature, etc.
                    // اذا كان هنالك صفحات مسارات مخصصة:
                    if (pathKey) {
                        // We map detailed diagnostic engine paths to the high-level funnels (beginner, rescue, growth)
                        const mapping = {
                            nascent_cautious: 'beginner',
                            nascent_promising: 'growth',
                            growing_struggling: 'rescue',
                            growing_ambitious: 'growth',
                            stable_stagnant: 'rescue',
                            stable_solid: 'growth',
                            mature_pioneering: 'growth',
                            mature_renewing: 'rescue'
                        };
                        const mappedPath = mapping[pathKey] || 'beginner';
                        if (mappedPath === 'growth') {
                            window.location.href = '/growth-plan.html';
                        } else {
                            window.location.href = `/${mappedPath}-path.html`;
                        }
                        return;
                    }
                }
            }

            // Fallback: Dashboard
            window.location.href = '/ceo-dashboard.html';
            return;
        }
        if (role === 'dept_manager') {
            const dept = getDept() || user?.department?.key || user?.deptCode;
            if (dept) window.location.href = `/${dept}-deep.html?dept=${dept}`;
            else window.location.href = '/dashboard.html';
            return;
        }
        if (role === 'investor') {
            const type = user?.investorType || 'general';
            window.location.href = `/investor-${type}-dashboard.html`;
            return;
        }
        if (role === 'consultant') {
            window.location.href = '/consultant-dashboard.html';
            return;
        }
        window.location.href = '/select-type.html';
    }

    window.Context = {
        getUserRole, getDept, getActiveVersionId, getUser,
        setItem, getItem, removeItem, setTemp, getTemp, removeTemp,
        isStepCompleted, isStepCompletedSync, markStepCompleted,
        redirectAfterLogin,
        getUserType: getUserRole, getVersionId: getActiveVersionId, buildKey,
    };
})(window);
