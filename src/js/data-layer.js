/**
 * 📊 data-layer.js — Startix Unified Data Access Layer
 * 
 * طبقة موحّدة لقراءة/كتابة البيانات.
 * DB أولاً → localStorage كـ fallback → خطأ واضح إذا لا يوجد بيانات.
 * 
 * الاستخدام:
 *   const data = await StartixData.getDeptDeep(entityId);
 *   const swot = await StartixData.getDeptDeep(entityId, 'hr');
 *   await StartixData.saveDeptDeep(entityId, allData);
 * 
 * يدعم: ES modules + plain scripts (IIFE)
 */
(function (global) {
    'use strict';

    const API_BASE = '/api';
    const TOKEN_KEY = 'token'; // مفتاح JWT في localStorage

    // ═══════════════════════════════════
    //  CORE — API FETCH
    // ═══════════════════════════════════

    /**
     * استدعاء API مع JWT + error handling
     * @param {string} endpoint - مسار API (بدون /api)
     * @param {object} options - fetch options
     * @returns {Promise<object|null>}
     */
    async function apiFetch(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                credentials: 'same-origin', // 🔒 إرسال HttpOnly Cookie تلقائياً
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn('🔒 [data-layer] Token expired — redirecting to login');
                    window.location.href = '/login';
                    return null;
                }
                throw new Error(`API ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (err) {
            throw err; // يُعالج في الدوال الأعلى
        }
    }

    // ═══════════════════════════════════
    //  AUTH HELPERS
    // ═══════════════════════════════════

    /** استخراج entityId من JWT token */
    function getEntityId() {
        try {
            // 🔒 الاعتماد على كائن المستخدم بدلاً من التوكن الذي أصبح مخفياً
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.entity?.id || user.activeEntityId || user.entityId || null;
        } catch (e) {
            return null;
        }
    }

    /** استخراج userId من JWT token */
    function getUserId() {
        try {
            // 🔒 الاعتماد على كائن المستخدم المحفوظ
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.id || null;
        } catch (e) {
            return null;
        }
    }

    // ═══════════════════════════════════
    //  DEPT-DEEP DATA
    // ═══════════════════════════════════

    const DEPT_DEEP_CACHE_KEY = 'stratix_dept_deep_payload';

    /**
     * جلب بيانات الفحص العميق — DB أولاً، localStorage كـ fallback
     * @param {string} [entityId] - إذا لم يُحدد، يُستخرج من JWT
     * @param {string} [deptKey] - إدارة محددة (اختياري — بدونه يجيب الكل)
     * @returns {Promise<object>} - البيانات مع metadata (_source, _synced, _warning, _error)
     */
    async function getDeptDeep(entityId, deptKey) {
        entityId = entityId || getEntityId();

        if (!entityId) {
            return { _error: 'NO_ENTITY', _message: 'لا يوجد entity — تأكد من تسجيل الدخول' };
        }

        // ── محاولة 1: DB ──
        try {
            const endpoint = deptKey
                ? `/dept-deep/${entityId}/${deptKey}`
                : `/dept-deep/${entityId}`;

            const result = await apiFetch(endpoint);

            if (result && result.success) {
                const data = result.data;

                // تحديث localStorage cache مع الحفاظ على البيانات غير المرفوعة
                // لا نقوم بالمسح لمجرد أن قاعدة البيانات أعادت نتيجة فارغة
                if (data && Object.keys(data).length > 0) {
                    try {
                        const cached = JSON.parse(localStorage.getItem(DEPT_DEEP_CACHE_KEY) || '{}');
                        if (deptKey) {
                            // دمج الإدارة المحددة فقط وتكون الأولوية للبيانات المحلية الأحدث
                            cached[deptKey] = { ...data, ...(cached[deptKey] || {}) };
                            localStorage.setItem(DEPT_DEEP_CACHE_KEY, JSON.stringify(cached));
                        } else {
                            // دمج كل الإدارات مع الحفاظ على الأولوية المحلية للمسودات المتأخرة الرفع
                            const merged = { ...cached };
                            for (const k in data) {
                                merged[k] = { ...data[k], ...(cached[k] || {}) };
                            }
                            localStorage.setItem(DEPT_DEEP_CACHE_KEY, JSON.stringify(merged));
                        }
                    } catch (e) { }
                }

                return {
                    ...data,
                    _source: 'db',
                    _synced: Date.now(),
                };
            }
        } catch (err) {
            console.warn('⚠️ [data-layer] DB fetch failed:', err.message);
        }

        // ── محاولة 2: localStorage fallback ──
        try {
            const cached = localStorage.getItem(DEPT_DEEP_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                const data = deptKey ? (parsed[deptKey] || null) : parsed;

                if (data && Object.keys(data).length > 0) {
                    return {
                        ...data,
                        _source: 'cache',
                        _warning: 'البيانات من ذاكرة المتصفح — قد لا تكون محدّثة',
                    };
                }
            }
        } catch (e) { }

        // ── لا بيانات ──
        return { _error: 'NO_DATA', _message: 'لا توجد بيانات — أكمل الفحص العميق أولاً' };
    }

    /**
     * حفظ بيانات الفحص العميق — DB + localStorage معاً
     * @param {string} [entityId] - إذا لم يُحدد، يُستخرج من JWT
     * @param {object} data - بيانات كل الإدارات { compliance: {...}, finance: {...}, ... }
     * @returns {Promise<object>} - نتيجة الحفظ
     */
    async function saveDeptDeep(entityId, data) {
        entityId = entityId || getEntityId();

        // 1. حفظ فوري في localStorage
        localStorage.setItem(DEPT_DEEP_CACHE_KEY, JSON.stringify(data));

        // 2. حفظ في DB
        if (!entityId) return { saved: false, reason: 'no_entity' };

        try {
            const result = await apiFetch(`/dept-deep/${entityId}`, {
                method: 'POST',
                body: JSON.stringify({ data }),
            });

            if (result && result.success) {
                return { saved: true, _source: 'db', count: result.saved };
            }
        } catch (err) {
            console.warn('⚠️ [data-layer] DB save failed:', err.message);
            return { saved: false, _source: 'cache_only', _warning: 'حُفظ محلياً فقط' };
        }

        return { saved: false };
    }

    // ═══════════════════════════════════
    //  GENERIC LOCALSTORAGE READER
    //  (لبقية الصفحات اللي لسا على localStorage)
    // ═══════════════════════════════════

    /**
     * قراءة من localStorage مع type safety
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    function getLocal(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            return defaultValue;
        }
    }

    /**
     * كتابة إلى localStorage
     * @param {string} key 
     * @param {*} value 
     */
    function setLocal(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // ═══════════════════════════════════
    //  OKRs & OTHER TOOLS DATA
    // ═══════════════════════════════════

    const OKRS_CACHE_KEY = 'stratix_okrs';

    async function getOKRs() {
        try {
            const data = await apiFetch('/okrs');
            if (data && Array.isArray(data)) return data;
        } catch (e) {
            console.warn('⚠️ [data-layer] API getOKRs failed, falling back to local storage.');
        }
        return getLocal(OKRS_CACHE_KEY, []);
    }

    async function saveOKRs(okrsData) {
        setLocal(OKRS_CACHE_KEY, okrsData);
        try {
            await apiFetch('/okrs', { method: 'PUT', body: JSON.stringify(okrsData) });
            return true;
        } catch (e) {
            console.warn('⚠️ [data-layer] API saveOKRs failed, saved local only');
            return true;
        }
    }

    async function getIdentity() {
        try { return await apiFetch('/assessment/active'); } catch (e) { return getLocal('stratix_identity_payload'); }
    }

    async function getSwot() {
        try { return await apiFetch('/analysis/active'); } catch (e) { return getLocal('stratix_swot_payload'); }
    }

    // ═══════════════════════════════════
    //  EXPORT
    // ═══════════════════════════════════

    const StartixData = {
        // Auth
        getEntityId,
        getUserId,

        // Dept-Deep
        getDeptDeep,
        saveDeptDeep,

        // OKRs & Others
        getOKRs,
        saveOKRs,
        getIdentity,
        getSwot,

        // Generic
        getLocal,
        setLocal,

        // Low-level (للاستخدام المتقدم)
        apiFetch,
    };

    // ES modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = StartixData;
    }

    // Global for plain scripts
    global.StartixData = StartixData;

})(typeof window !== 'undefined' ? window : globalThis);
