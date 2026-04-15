/**
 * Startix — Progress Engine v1.0
 * ═══════════════════════════════════════════════════════════
 * محرك التقدم الموحّد
 * مصدر حقيقة واحد (Single Source of Truth) لحالة تقدم المستخدم.
 *
 * الاعتماد الأساسي: API `/api/user-progress/entity/:entityId`
 * الاحتياطي: localStorage (مع تحذير — بيانات قد تكون غير دقيقة)
 *
 * الاستخدام:
 *   const progress = await StartixProgress.fetch();
 *   console.log(progress.currentPhase);   // 2
 *   console.log(progress.overall);        // 42
 *   console.log(progress.phases.DIAGNOSIS.percent); // 65
 * ═══════════════════════════════════════════════════════════
 */
(function () {
    'use strict';

    // ═══ Stage IDs (mapped to API response) ═══
    const STAGE_IDS = ['FOUNDATION', 'DIAGNOSIS', 'PLANNING', 'EXECUTION', 'ADAPTATION'];

    // ═══ Stage → Phase number mapping ═══
    const STAGE_TO_PHASE = {
        FOUNDATION: 1,
        DIAGNOSIS: 2,
        PLANNING: 3,
        EXECUTION: 4,
        ADAPTATION: 5
    };

    // ═══ Cache ═══
    let _cachedProgress = null;
    let _cacheTimestamp = 0;
    const CACHE_TTL_MS = 60 * 1000; // 1 min cache

    // ═══════════════════════════════════════════
    // 1. FETCH FROM API (Primary)
    // ═══════════════════════════════════════════
    async function fetchFromAPI() {
        const token = localStorage.getItem('token');
        // entityId من JWT (آمن بعد switch-entity) — fallback لـ localStorage
        let entityId = '';
        try {
            if (window.api?.getCurrentUser) {
                const u = await window.api.getCurrentUser();
                entityId = u?.activeEntityId || '';
            }
        } catch(e) {}
        if (!entityId) entityId = localStorage.getItem('entityId') || '';

        if (!token || !entityId) return null;

        try {
            const res = await fetch(`/api/user-progress/entity/${entityId}`, {
                credentials: 'include',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            const data = await res.json();

            // Transform API response to normalized format
            return normalizeAPIResponse(data);
        } catch (err) {
            console.warn('[ProgressEngine] API failed, falling back to localStorage:', err.message);
            return null;
        }
    }

    // ═══════════════════════════════════════════
    // 2. NORMALIZE API RESPONSE
    // ═══════════════════════════════════════════
    function normalizeAPIResponse(data) {
        const phases = {};

        STAGE_IDS.forEach((stageId, idx) => {
            const stage = (data.stages || []).find(s => s.id === stageId);
            if (stage) {
                phases[stageId] = {
                    id: stageId,
                    phase: idx + 1,
                    nameAr: stage.nameAr,
                    percent: stage.percent || 0,
                    completed: stage.completed || false,
                    locked: stage.locked || false,
                    unlockAt: stage.unlockAt || 0,
                    unlockMsg: stage.unlockMsg || ''
                };
            } else {
                phases[stageId] = {
                    id: stageId,
                    phase: idx + 1,
                    nameAr: '',
                    percent: 0,
                    completed: false,
                    locked: idx > 0, // first unlocked, rest locked
                    unlockAt: 0,
                    unlockMsg: ''
                };
            }
        });

        return {
            entityId: data.entityId,
            versionId: data.versionId,
            versionNumber: data.versionNumber,
            overall: data.overall || 0,
            phases: phases,
            source: 'api'
        };
    }

    // ═══════════════════════════════════════════
    // 3. FALLBACK: localStorage (Inaccurate)
    // ═══════════════════════════════════════════
    function buildFromLocalStorage() {
        console.warn('[ProgressEngine] ⚠️ Using localStorage fallback — progress may be inaccurate');

        // — Foundation indicators —
        const hasEntity = !!localStorage.getItem('entityId');
        const hasOnboarding = !!localStorage.getItem('onboarding_completed');
        const foundationPercent = [hasEntity, hasOnboarding].filter(Boolean).length * 50;

        // — Diagnosis indicators —
        const hasDiag = !!localStorage.getItem('stratix_diagnostic_payload');
        const hasDeptDeep = (() => {
            try {
                const d = JSON.parse(localStorage.getItem('stratix_dept_deep_payload') || '{}');
                return Object.keys(d).some(k => d[k] && d[k].completed);
            } catch { return false; }
        })();
        const hasSwot = localStorage.getItem('swot_completed') === 'true';
        const hasPestel = localStorage.getItem('pestel_completed') === 'true';
        const hasInternal = localStorage.getItem('internal_env_completed') === 'true';
        const diagItems = [hasDiag, hasDeptDeep, hasSwot, hasPestel, hasInternal];
        const diagPercent = Math.round((diagItems.filter(Boolean).length / diagItems.length) * 100);

        // — Planning indicators —
        const hasIdentity = !!localStorage.getItem('stratix_identity_payload');
        const hasObjectives = localStorage.getItem('objectives_saved') === 'true';
        const hasKpis = !!localStorage.getItem('kpis_created');
        const planItems = [hasIdentity, hasObjectives, hasKpis];
        const planPercent = Math.round((planItems.filter(Boolean).length / planItems.length) * 100);

        // — Execution indicators —
        const hasInitiatives = !!localStorage.getItem('initiatives_created');
        const execPercent = hasInitiatives ? 50 : 0;

        // — Adaptation is hard to track from localStorage —
        const adaptPercent = 0;

        const phases = {
            FOUNDATION: { id: 'FOUNDATION', phase: 1, nameAr: 'التأسيس', percent: foundationPercent, completed: foundationPercent >= 100, locked: false },
            DIAGNOSIS: { id: 'DIAGNOSIS', phase: 2, nameAr: 'التشخيص', percent: diagPercent, completed: diagPercent >= 100, locked: foundationPercent < 60 },
            PLANNING: { id: 'PLANNING', phase: 3, nameAr: 'التخطيط', percent: planPercent, completed: planPercent >= 100, locked: diagPercent < 50 },
            EXECUTION: { id: 'EXECUTION', phase: 4, nameAr: 'التنفيذ', percent: execPercent, completed: execPercent >= 100, locked: planPercent < 50 },
            ADAPTATION: { id: 'ADAPTATION', phase: 5, nameAr: 'المتابعة', percent: adaptPercent, completed: false, locked: execPercent < 20 }
        };

        const percentages = STAGE_IDS.map(id => phases[id].percent);
        const overall = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);

        return {
            entityId: localStorage.getItem('entityId') || null,
            versionId: null,
            versionNumber: null,
            overall: overall,
            phases: phases,
            source: 'localStorage'
        };
    }

    // ═══════════════════════════════════════════
    // 4. DETERMINE CURRENT PHASE
    // ═══════════════════════════════════════════
    function determineCurrentPhase(progress) {
        // المرحلة الحالية = أول مرحلة غير مكتملة وغير مقفولة
        for (const stageId of STAGE_IDS) {
            const phase = progress.phases[stageId];
            if (!phase.completed && !phase.locked) {
                return STAGE_TO_PHASE[stageId];
            }
        }
        // إذا كل المراحل مكتملة
        return 5;
    }

    // ═══════════════════════════════════════════
    // 5. NEXT PHASE AVAILABILITY
    // ═══════════════════════════════════════════
    function isNextPhaseAvailable(progress, currentPhase) {
        if (currentPhase >= 5) return false;
        const currentStageId = STAGE_IDS[currentPhase - 1];
        const currentPercent = progress.phases[currentStageId]?.percent || 0;
        const nextStageId = STAGE_IDS[currentPhase];
        const nextLocked = progress.phases[nextStageId]?.locked;
        return currentPercent >= 50 && !nextLocked;
    }

    // ═══════════════════════════════════════════
    // 6. MAIN: FETCH PROGRESS (Public API)
    // ═══════════════════════════════════════════
    async function fetchProgress(forceRefresh) {
        // Check cache
        if (!forceRefresh && _cachedProgress && (Date.now() - _cacheTimestamp) < CACHE_TTL_MS) {
            return _cachedProgress;
        }

        // Try API first
        let progress = await fetchFromAPI();

        // Fallback to localStorage
        if (!progress) {
            progress = buildFromLocalStorage();
        }

        // Compute derived fields
        const currentPhase = determineCurrentPhase(progress);
        const nextPhaseAvailable = isNextPhaseAvailable(progress, currentPhase);

        // Build phase percent map (for convenience)
        const phasePercent = {};
        STAGE_IDS.forEach((id, idx) => {
            phasePercent[idx + 1] = progress.phases[id]?.percent || 0;
        });

        const result = {
            ...progress,
            currentPhase,
            currentStageId: STAGE_IDS[currentPhase - 1],
            nextPhaseAvailable,
            phasePercent,
            allCompleted: STAGE_IDS.every(id => progress.phases[id]?.completed),
            fetchedAt: new Date().toISOString()
        };

        // Cache
        _cachedProgress = result;
        _cacheTimestamp = Date.now();

        return result;
    }

    // ═══════════════════════════════════════════
    // 7. HELPERS (Public)
    // ═══════════════════════════════════════════

    /** Get cached progress synchronously (returns null if not yet fetched) */
    function getCached() {
        return _cachedProgress;
    }

    /** Clear cache (force next fetch to hit API) */
    function clearCache() {
        _cachedProgress = null;
        _cacheTimestamp = 0;
    }

    /** Check if a specific stage is accessible */
    function isStageAccessible(stageId) {
        if (!_cachedProgress) return true; // if no data, allow all
        const phase = _cachedProgress.phases[stageId];
        return phase && !phase.locked;
    }

    /** Get stage status string */
    function getStageStatus(stageId) {
        if (!_cachedProgress) return 'unknown';
        const phase = _cachedProgress.phases[stageId];
        if (!phase) return 'unknown';
        if (phase.locked) return 'locked';
        if (phase.completed) return 'completed';
        if (phase.percent > 0) return 'in-progress';
        return 'not-started';
    }

    // ═══════════════════════════════════════════
    // 8. EXPOSE AS GLOBAL
    // ═══════════════════════════════════════════
    window.StartixProgress = {
        fetch: fetchProgress,
        getCached: getCached,
        clearCache: clearCache,
        isStageAccessible: isStageAccessible,
        getStageStatus: getStageStatus,
        STAGE_IDS: STAGE_IDS,
        STAGE_TO_PHASE: STAGE_TO_PHASE
    };

})();
