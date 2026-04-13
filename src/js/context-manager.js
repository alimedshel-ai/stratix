// js/context-manager.js
/**
 * 🛠️ Startix Context Manager – النسخة النهائية
 * يدير السياق بين الأدوار مع عزل بيانات الشركات (entityId) لمدير الإدارة
 * ويوفر قراءة متزامنة + استعلام API للتقدم
 */
(function (window) {
    // ======================
    // دوال مساعدة
    // ======================
    function safeParse(str, fallback = null) {
        if (!str) return fallback;
        try { return JSON.parse(str); } catch (e) { return fallback; }
    }

    function safeLocalParse(key, fallback = null) {
        return safeParse(localStorage.getItem(key), fallback);
    }

    // الحصول على المستخدم (تفضيل بيانات السيرفر المباشرة)
    function getUser() {
        if (window._cachedUser) return window._cachedUser;
        // 1. من api.js (الكاش النشط)
        const apiUser = window.api?.getCachedUser?.();
        if (apiUser && Object.keys(apiUser).length > 0) {
            window._cachedUser = apiUser;
            return apiUser;
        }
        // 2. من localStorage (للتوافق القديم)
        const localUser = safeLocalParse('user');
        if (localUser) {
            window._cachedUser = localUser;
            return localUser;
        }
        return null;
    }

    // الحصول على الدور الحالي
    function getUserRole() {
        const user = getUser();
        if (user) {
            if (user.userType === 'DEPT_MANAGER' && user.isProManager) {
                return 'pro_manager';
            }
            if (user.userType === 'DEPT_MANAGER' || user.userCategory?.startsWith('DEPT_')) {
                return 'dept_manager';
            }
            const ownerRoles = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'COMPANY_MANAGER'];
            const role = (user.role || user.userType || '').toUpperCase();
            if (ownerRoles.includes(role)) return 'owner';
            if (role === 'INVESTOR') return 'investor';
            if (user.userType === 'CONSULTANT') return 'consultant';
            if (user.userType === 'INDIVIDUAL') return 'individual';
            if (user.userType === 'EXPLORER') return 'explorer';
            return 'explorer';
        }
        // زائر: من sessionStorage
        return sessionStorage.getItem('stratix_guest_diagnosis') ? 'guest' : 'guest';
    }

    // الحصول على القسم (مرونة قصوى)
    function getDept() {
        // 1. من URL (أولوية قصوى للمعاينة والتنقل)
        const urlParams = new URLSearchParams(window.location.search);
        let dept = urlParams.get('dept');
        if (dept) return dept.toLowerCase();

        // 2. من بيانات المستخدم السيرفرية
        const user = (window.api?.getCachedUser?.() || window._cachedUser || window.api?.getUserData?.() || {});
        if (user.userCategory?.startsWith('DEPT_')) {
            let d = user.userCategory.replace('DEPT_', '').toLowerCase();
            if (d) return d;
        }
        if (user.department?.key) return user.department.key.toLowerCase();
        if (user.deptCode) return user.deptCode.toLowerCase();

        // 3. Fallback: localStorage (للتوافق مع النسخ القديمة)
        try {
            return localStorage.getItem('stratix_v10_dept')?.toLowerCase() ||
                localStorage.getItem('stratix_current_dept')?.toLowerCase() || null;
        } catch { return null; }
    }

    // الحصول على versionId (للمالك أو المشرف)
    function getActiveVersionId() {
        const role = getUserRole();
        if (!['owner', 'supervisor'].includes(role)) return null;
        if (role === 'supervisor') {
            const version = new URLSearchParams(window.location.search).get('versionId');
            if (version) return version;
        }
        const user = getUser();
        let fallback = localStorage.getItem('stratix_last_version') || localStorage.getItem('selectedVersionId');
        return user?.entity?.activeVersionId || fallback || null;
    }

    // بناء المفتاح للتخزين (عزل تام)
    function buildKey(baseKey, isTemporary = false) {
        const role = getUserRole();
        const user = getUser();
        const entityId = user?.activeEntityId || user?.entityId || user?.entity?.id;   // معرف الشركة الحالية (من بيانات السيرفر)
        const dept = getDept();

        if (role === 'dept_manager') {
            if (!dept) throw new Error('[Context] مدير قسم بدون تحديد القسم');
            // المفتاح يحتوي على entityId + dept لعزل بيانات الشركات
            const prefix = entityId ? `dept_${entityId}_${dept}` : `stratix_${dept}`;
            return `${prefix}_${baseKey}`;
        }
        if (role === 'owner') {
            const versionId = getActiveVersionId();
            return versionId ? `owner_${versionId}_${baseKey}` : `stratix_${baseKey}`;
        }
        if (role === 'investor') {
            const userId = user?.id || 'unknown';
            return `investor_${userId}_${baseKey}`;
        }
        if (role === 'consultant') {
            const clientId = sessionStorage.getItem('stratix_active_client') || 'default';
            return `consultant_${clientId}_${baseKey}`;
        }
        if (role === 'system_admin') {
            const userId = user?.id || 'unknown';
            return `admin_${userId}_${baseKey}`;
        }
        if (role === 'supervisor') {
            const userId = user?.id || 'unknown';
            const versionId = getActiveVersionId();
            const suffix = versionId ? `_${versionId}` : '';
            return `supervisor_${userId}${suffix}_${baseKey}`;
        }
        return `guest_${baseKey}`;
    }

    // واجهة التخزين
    function setItem(key, value, isTemporary = false) {
        try {
            const fullKey = buildKey(key, isTemporary);
            const storage = isTemporary ? sessionStorage : localStorage;
            storage.setItem(fullKey, JSON.stringify(value));
            return value;
        } catch (e) { console.error('[Context] Error setting item:', e); return null; }
    }

    function getItem(key, defaultValue = null, isTemporary = false) {
        try {
            const fullKey = buildKey(key, isTemporary);
            const storage = isTemporary ? sessionStorage : localStorage;
            const raw = storage.getItem(fullKey);
            if (!raw && !isTemporary && getUserRole() === 'owner') {
                const fallbackKey = `stratix_${key}`;
                const fallbackRaw = storage.getItem(fallbackKey);
                if (fallbackRaw) return safeParse(fallbackRaw, defaultValue);
            }
            if (!raw) return defaultValue;
            return safeParse(raw, defaultValue);
        } catch (e) { return defaultValue; }
    }

    function removeItem(key, isTemporary = false) {
        try {
            const fullKey = buildKey(key, isTemporary);
            const storage = isTemporary ? sessionStorage : localStorage;
            storage.removeItem(fullKey);
        } catch (e) { }
    }

    function setTemp(key, value) { return setItem(key, value, true); }
    function getTemp(key, defaultValue = null) { return getItem(key, defaultValue, true); }
    function removeTemp(key) { return removeItem(key, true); }

    // ─────────────────────────────────────────────────────
    // التحقق من اكتمال خطوة (متزامن) – يقرأ من localStorage
    // ─────────────────────────────────────────────────────
    function isStepCompletedSync(stepName) {
        const userType = getUserRole();
        const dept = getDept();
        const deptId = (dept || 'HR').toUpperCase();

        if (userType === 'owner') {
            switch (stepName) {
                case 'swot': {
                    const swot = getItem('swot_data') || safeLocalParse('stratix_swot_payload');
                    return swot && (swot.strengths?.length > 0 || swot.weaknesses?.length > 0);
                }
                case 'directions':
                    return getItem('directions_completed') === true;
                default:
                    return false;
            }
        } else if (userType === 'dept_manager') {
            switch (stepName) {
                // 🔍 Diagnostic Phase
                case 'deep':
                    return getItem('deep_results') || getItem('audit');
                case 'audit':
                    return getItem('audit_answers') || getItem('audit_completed');
                case 'pestel': {
                    const pestel = getItem('PESTEL_' + deptId);
                    return pestel && Object.keys(pestel).length > 0;
                }
                case 'dept-health':
                    return getItem('HEALTH_' + deptId) !== null;
                case 'swot': {
                    const swot = getItem('SWOT_' + deptId) || getItem('swot');
                    return swot && swot.length > 0;
                }
                case 'tows': {
                    const tows = getItem('TOWS_' + deptId);
                    return tows && tows.length > 0;
                }
                // 🧭 Planning Phase
                case 'scenarios':
                    return getItem('SCENARIOS_' + deptId) !== null;
                case 'directions': {
                    const dirs = getItem('DIRECTIONS_' + deptId);
                    return dirs && (dirs.vision || dirs.mission || (Array.isArray(dirs) && dirs.length > 0));
                }
                case 'objectives':
                case 'strategic-objectives': {
                    const objs = getItem('OBJECTIVES_' + deptId) || getItem('okrs');
                    return objs && (Array.isArray(objs) ? objs.length > 0 : !!objs);
                }
                // 🚀 Execution Phase
                case 'okrs': {
                    const okrs = getItem('OKRS_' + deptId);
                    return okrs && okrs.length > 0;
                }
                case 'kpis': {
                    const kpis = getItem('KPIS_' + deptId);
                    return kpis && kpis.length > 0;
                }
                case 'initiatives': {
                    const inits = getItem('INITIATIVES_' + deptId);
                    return inits && inits.length > 0;
                }
                case 'projects': {
                    const projs = getItem('PROJECTS_' + deptId);
                    return projs && projs.length > 0;
                }
                // 📊 Monitoring Phase
                case 'reviews':
                    return getItem('REVIEWS_' + deptId) || getItem('reviews_completed');
                case 'corrections':
                    return getItem('CORRECTIONS_' + deptId) || getItem('corrections_completed');
                case 'reports':
                    return getItem('REPORTS_' + deptId) !== null;
                case 'risk-map':
                    return getItem('RISK_MAP_' + deptId) !== null;
                default: {
                    try {
                        // 🛡️ مفتاح معزول بـ entityId لمنع تسرب التقدم بين العملاء
                        const _eid = user?.activeEntityId || user?.entityId || user?.entity?.id || '';
                        const _jKey = _eid ? `stratix_mgr_journey_${_eid}` : 'stratix_mgr_journey';
                        const journey = JSON.parse(localStorage.getItem(_jKey) || '{}');
                        // fallback: المفتاح القديم (للتوافق)
                        if (!journey.completedIds?.includes(stepName)) {
                            const oldJ = JSON.parse(localStorage.getItem('stratix_mgr_journey') || '{}');
                            return oldJ.completedIds?.includes(stepName) || false;
                        }
                        return true;
                    } catch { return false; }
                }
            }
        }
        return false;
    }

    // ─────────────────────────────────────────────────────
    // التحقق من اكتمال خطوة (غير متزامن) – يستعلم API أولاً
    // ─────────────────────────────────────────────────────
    async function isStepCompleted(stepName) {
        const dept = getDept();
        // 1. إذا كان هناك API متاح، نطلب الحالة من الخادم
        if (dept && typeof window.callApiWithTimeout === 'function') {
            try {
                const data = await window.callApiWithTimeout(
                    `/api/progress?dept=${encodeURIComponent(dept)}&stepId=${encodeURIComponent(stepName)}`
                );
                if (data?.completed !== undefined) {
                    return data.completed;
                }
            } catch (e) {
                // فشل الشبكة – ننتقل للـ fallback المحلي
                console.warn(`[Context] isStepCompleted API failed for ${stepName}:`, e);
            }
        }
        // 2. fallback إلى localStorage (للتوافق القديم)
        return isStepCompletedSync(stepName);
    }

    // ─────────────────────────────────────────────────────
    // تسجيل اكتمال خطوة – يحفظ محلياً أولاً ثم عبر API
    // ─────────────────────────────────────────────────────
    async function markStepCompleted(stepId) {
        const dept = getDept();

        // 1. حفظ محلي فوري (لضمان استجابة فورية) — معزول بـ entityId
        try {
            const _user = getUser();
            const _eid = _user?.activeEntityId || _user?.entityId || _user?.entity?.id || '';
            const _jKey = _eid ? `stratix_mgr_journey_${_eid}` : 'stratix_mgr_journey';
            let journey = JSON.parse(localStorage.getItem(_jKey) || '{}');
            if (!journey.completedIds) journey.completedIds = [];
            if (!journey.completedIds.includes(stepId)) journey.completedIds.push(stepId);
            localStorage.setItem(_jKey, JSON.stringify(journey));
        } catch (e) { console.warn('[Context] markStepCompleted local save failed:', e); }

        // 2. محاولة API (باستخدام callApiWithTimeout الموحدة)
        if (dept && typeof window.callApiWithTimeout === 'function') {
            try {
                const res = await window.callApiWithTimeout('/api/progress', {
                    method: 'POST',
                    body: { stepId, dept }
                });
                return !!res?.success;
            } catch (error) {
                console.warn('[Context] markStepCompleted API failed, local save used:', error);
                return true; // الحفظ المحلي نجح
            }
        } else {
            // في حال عدم توفر callApiWithTimeout، نحاول fetch مباشر
            try {
                const fetchRes = await fetch('/api/progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ stepId, dept })
                });
                if (!fetchRes.ok) return true;
                const data = await fetchRes.json();
                return !!data?.success;
            } catch (error) {
                console.warn('[Context] markStepCompleted fetch failed:', error);
                return true;
            }
        }
    }

    // ─────────────────────────────────────────────────────
    // التوجيه بعد تسجيل الدخول (محسن)
    // ─────────────────────────────────────────────────────
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
            // التوجيه الذكي باستخدام محرك التشخيص (إن وجد)
            if (window.DiagnosticEngine?.classifyOwner) {
                const diagnosis = user?.diagnosticData || user?.entity?.diagnosis || user?.diagnosis;
                if (diagnosis) {
                    const result = window.DiagnosticEngine.classifyOwner(diagnosis);
                    const pathKey = result.pathKey;
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
                    window.location.href = mappedPath === 'growth' ? '/growth-plan.html' : `/${mappedPath}-path.html`;
                    return;
                }
            }
            // Fallback: Dashboard
            window.location.href = '/ceo-dashboard.html';
            return;
        }
        if (role === 'pro_manager') {
            window.location.href = '/pro-dashboard.html';
            return;
        }
        if (role === 'dept_manager') {
            const dept = getDept() || user?.department?.key || user?.deptCode;
            window.location.href = dept ? `/dept-dashboard.html?dept=${dept}` : '/dept-dashboard.html';
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

    // تصدير الواجهة العامة
    window.Context = {
        getUserRole,
        getDept,
        getActiveVersionId,
        getUser,
        setItem,
        getItem,
        removeItem,
        setTemp,
        getTemp,
        removeTemp,
        isStepCompleted,
        isStepCompletedSync,
        markStepCompleted,
        redirectAfterLogin,
        // aliases للتوافق
        getUserType: getUserRole,
        getVersionId: getActiveVersionId,
        buildKey,
    };
})(window);
