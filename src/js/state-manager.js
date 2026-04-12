/**
 * 🛰️ Stratix State Manager (Phase 2 — User-Scoped)
 * المركزي لإدارة حالة التطبيق وضمان ترابط البيانات بين الصفحات.
 *
 * المبادئ:
 * 1. مفاتيح مرتبطة بالمستخدم/المنشأة (User-Scoped Keys) — تمنع تسرب البيانات
 * 2. التحقق التلقائي (Automatic Validation)
 * 3. التخزين الدائم (localStorage focus)
 * 4. القيم البديلة (Fallbacks)
 * 5. Migration تلقائي للمفاتيح القديمة
 */

const StateManager = (() => {
    'use strict';

    // ==========================================
    // 1. تعريف المفاتيح الموحدة (Standard Keys)
    // ==========================================
    const KEYS = {
        USER: 'stratix_user_v2',                 // بيانات المستخدم الموثقة
        DIAGNOSTIC: 'stratix_owner_diagnostic',  // نتائج التشخيص
        PAYLOAD: 'stratix_diagnostic_payload',    // بيانات الإدخال
        DEPT: 'stratix_active_dept',             // القسم النشط حالياً
        JOURNEY: 'stratix_mgr_journey',          // مسار الرحلة الاستراتيجية
        VERSION: 'stratix_active_version',       // نسخة الإصدار النشطة
        ONBOARDING: 'stratix_onboarding_done',   // هل أكمل الأونبوردينج؟
        SETTINGS: 'stratix_app_settings'         // إعدادات المستخدم/النظام
    };

    // ==========================================
    // 2. مفتاح مرتبط بالمستخدم (User-Scoped Key)
    // ==========================================
    /**
     * يُضيف scopeId (entityId أو userId) كلاحقة للمفتاح.
     * يمنع تسرب بيانات المستخدم الأول للمستخدم الثاني.
     * @returns {string} المفتاح المُقيَّد بالمستخدم أو المفتاح الأصلي إن لم يوجد مستخدم
     */
    function getUserScopedKey(baseKey) {
        try {
            const raw = localStorage.getItem(KEYS.USER) || localStorage.getItem('user');
            if (!raw) return baseKey;
            const u = JSON.parse(raw);
            const scopeId = u?.entityId || u?.activeEntityId || u?.entity?.id || u?.id || null;
            if (!scopeId) return baseKey;
            return `${baseKey}_${scopeId}`;
        } catch (e) {
            return baseKey;
        }
    }

    // ==========================================
    // 3. التحويل والتحقق (Parsing & Validation)
    // ==========================================
    function safeParse(str, fallback = null) {
        if (!str || str === 'undefined' || str === 'null') return fallback;
        try {
            return JSON.parse(str);
        } catch (e) {
            console.warn('[StateManager] Corrupt data found, resetting to fallback.', e);
            return fallback;
        }
    }

    const Schemas = {
        user: (data) => data && typeof data === 'object' && (data.id || data.userId || data.email),
        diagnostic: (data) => data && typeof data === 'object' && (data.matrix || data.classification),
        payload: (data) => data && typeof data === 'object'
    };

    // ==========================================
    // 4. العمليات الأساسية (Core CRUD)
    // ==========================================
    function get(key, fallback = null, schema = null) {
        const raw = localStorage.getItem(key);
        if (!raw) {
            if (key === KEYS.USER) return safeParse(localStorage.getItem('user'), fallback);
            if (key === KEYS.DIAGNOSTIC) return safeParse(sessionStorage.getItem('diagnosticResult'), fallback);
            if (key === KEYS.DEPT) return localStorage.getItem('stratix_v10_dept') || localStorage.getItem('stratix_current_dept') || fallback;
            return fallback;
        }
        const data = safeParse(raw, fallback);
        if (schema && Schemas[schema] && !Schemas[schema](data)) {
            console.warn(`[StateManager] Validation failed for key: ${key}`);
            return fallback;
        }
        return data;
    }

    function set(key, value) {
        if (value === null || value === undefined) {
            localStorage.removeItem(key);
            return;
        }
        try {
            localStorage.setItem(key, JSON.stringify(value));
            syncLegacy(key, value);
        } catch (e) {
            console.error('[StateManager] Failed to save to localStorage:', e);
        }
    }

    function update(key, partial) {
        const current = get(key, {});
        if (typeof current !== 'object') return;
        set(key, { ...current, ...partial });
    }

    function syncLegacy(key, value) {
        if (key === KEYS.USER) localStorage.setItem('user', JSON.stringify(value));
        if (key === KEYS.DIAGNOSTIC) {
            // مزامنة مع جميع المفاتيح التراثية التي تقرأها الصفحات مباشرة
            sessionStorage.setItem('diagnosticResult', JSON.stringify(value));
            localStorage.setItem('painAmbition', JSON.stringify(value));
        }
    }

    // ==========================================
    // 5. الدوال المساعدة العالية (High-level Helpers)
    // ==========================================
    return {
        KEYS,

        // Generic methods
        get,
        set,
        update,
        remove: (key) => localStorage.removeItem(key),

        // ─── User Management ───────────────────────────
        getUser: () => get(KEYS.USER, null, 'user'),
        setUser: (user) => {
            set(KEYS.USER, user);
            if (user) window._cachedUser = user;
        },

        // ─── Diagnostic — مُقيَّد بالمستخدم ──────────
        getDiagnosis: () => {
            const scopedDiag    = getUserScopedKey(KEYS.DIAGNOSTIC);
            const scopedPayload = getUserScopedKey(KEYS.PAYLOAD);
            return get(scopedDiag, null)
                || get(scopedPayload, null)
                // Fallbacks للمفاتيح التراثية المشتركة
                || get(KEYS.DIAGNOSTIC, null)
                || get(KEYS.PAYLOAD, null)
                || safeParse(sessionStorage.getItem('diagnosticResult'), null)
                || safeParse(localStorage.getItem('painAmbition'), null);
        },
        saveDiagnosis: (result) => {
            const scopedDiag    = getUserScopedKey(KEYS.DIAGNOSTIC);
            const scopedPayload = getUserScopedKey(KEYS.PAYLOAD);
            set(scopedDiag, result);
            update(scopedPayload, { ...result, lastUpdated: new Date().toISOString() });
        },
        updatePayload: (subKey, data) => {
            // دالة مستخدَمة من space-matrix, qspm, grand-strategy, change-management
            const scopedPayload = getUserScopedKey(KEYS.PAYLOAD);
            update(scopedPayload, { [subKey]: data, lastUpdated: new Date().toISOString() });
        },
        clearDiagnosis: () => {
            const scopedDiag    = getUserScopedKey(KEYS.DIAGNOSTIC);
            const scopedPayload = getUserScopedKey(KEYS.PAYLOAD);
            [scopedDiag, scopedPayload, KEYS.DIAGNOSTIC, KEYS.PAYLOAD,
             'painAmbition', 'stratix_diagnostic_data', 'stratix_diagnostic_complete'
            ].forEach(k => localStorage.removeItem(k));
            sessionStorage.removeItem('diagnosticResult');
            console.log('[StateManager] Diagnostic data cleared from all keys.');
        },

        // ─── Department Context ───────────────────────
        getActiveDept: () => get(KEYS.DEPT, 'HR'),
        setActiveDept: (dept) => set(KEYS.DEPT, dept?.toLowerCase()),

        // ─── Journey Tracking — مُقيَّد بالمستخدم ────
        getJourneyKey: () => getUserScopedKey(KEYS.JOURNEY),
        markStepDone: (stepId) => {
            const scopedKey = getUserScopedKey(KEYS.JOURNEY);
            const journey = get(scopedKey, { completed: [] });
            if (!Array.isArray(journey.completed)) journey.completed = [];
            if (!journey.completed.includes(stepId)) {
                journey.completed.push(stepId);
                journey.lastStep = stepId;
                set(scopedKey, journey);
            }
        },
        isStepDone: (stepId) => {
            const scopedKey = getUserScopedKey(KEYS.JOURNEY);
            const journey = get(scopedKey, { completed: [] });
            return Array.isArray(journey.completed) && journey.completed.includes(stepId);
        },

        // ─── Global State Sync ────────────────────────
        init: () => {
            console.log('🚀 StateManager Initialized');
            const user = get(KEYS.USER);
            if (user) {
                window._cachedUser = user;
                const scopeId = user?.entityId || user?.activeEntityId || user?.entity?.id || user?.id;

                if (scopeId) {
                    // Migration: مفتاح الرحلة من القديم (بدون scope) إلى الجديد
                    const scopedJourneyKey = `${KEYS.JOURNEY}_${scopeId}`;
                    const bareJourney = localStorage.getItem(KEYS.JOURNEY);
                    if (bareJourney && !localStorage.getItem(scopedJourneyKey)) {
                        console.log('[StateManager] Migrating journey key to scoped key.');
                        localStorage.setItem(scopedJourneyKey, bareJourney);
                        localStorage.removeItem(KEYS.JOURNEY);
                    }

                    // Migration: مفتاح التشخيص من القديم إلى الجديد
                    const scopedDiagKey = `${KEYS.DIAGNOSTIC}_${scopeId}`;
                    const bareDiag = localStorage.getItem(KEYS.DIAGNOSTIC);
                    if (bareDiag && !localStorage.getItem(scopedDiagKey)) {
                        console.log('[StateManager] Migrating diagnostic key to scoped key.');
                        localStorage.setItem(scopedDiagKey, bareDiag);
                        localStorage.removeItem(KEYS.DIAGNOSTIC);
                    }
                }
            }

            // Migrate diagnosticResult from sessionStorage to localStorage (legacy)
            const sessionDiag = sessionStorage.getItem('diagnosticResult');
            if (sessionDiag && !localStorage.getItem(getUserScopedKey(KEYS.DIAGNOSTIC))) {
                console.log('[StateManager] Migrating diagnosticResult to localStorage');
                localStorage.setItem(getUserScopedKey(KEYS.DIAGNOSTIC), sessionDiag);
            }
        }
    };
})();

// Auto-init
StateManager.init();
window.StateManager = StateManager;
