// js/page-guard.js — حارس الصفحات المركزي (Startix v2)
// يمنع: تداخل الأدوار + تجاوز المراحل + تسرب البيانات
(function () {

    // ═══════════════════════════════════════════
    // 🔧 إعدادات المراحل والمتطلبات
    // ═══════════════════════════════════════════

    // ترتيب أدوات كل مرحلة (المرحلة لا تفتح إلا بعد اكتمال سابقتها بنسبة 80%)
    const PHASES = {
        diagnostic: {
            label: 'التشخيص',
            tools: ['dept-health', 'pestel', 'deep', 'audit'],
            minCompletion: 0 // أول مرحلة — مفتوحة دائماً
        },
        discovery: {
            label: 'الاكتشاف',
            tools: ['swot', 'tows', 'scenarios'],
            minCompletion: 0.5, // يحتاج 50% من التشخيص
            requires: 'diagnostic'
        },
        planning: {
            label: 'التخطيط',
            tools: ['directions', 'objectives', 'okrs', 'kpis'],
            minCompletion: 0.6, // يحتاج 60% من الاكتشاف
            requires: 'discovery'
        },
        execution: {
            label: 'التنفيذ',
            tools: ['initiatives', 'projects', 'reviews', 'reports'],
            minCompletion: 0.5, // يحتاج 50% من التخطيط
            requires: 'planning'
        }
    };

    // ربط كل صفحة بالمرحلة المطلوبة + الأدوار المسموحة
    const PAGE_RULES = {
        // لوحات القيادة
        'ceo-dashboard': { roles: ['owner', 'system_admin', 'supervisor', 'exec_manager'], phase: null },
        'company-health': { roles: ['owner', 'system_admin', 'supervisor', 'exec_manager'], phase: null },
        'dept-dashboard': { roles: ['dept_manager', 'pro_manager'], phase: null },
        'investor-dashboard': { roles: ['investor'], phase: null },
        'admin-dashboard': { roles: ['system_admin'], phase: null },

        // مرحلة التشخيص — صفحات الأقسام: متاحة للمدير (مسار مستقل) وللمالك (للرقابة والتحليل)
        'dept-diagnostic': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'dept-deep': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'dept-health': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'dept-questionnaire': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'dept-smart': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'pestel': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: null },
        'hr-audit': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'hr-deep': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'finance-audit': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'finance-deep': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'marketing-audit': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'marketing-deep': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'operations-audit': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'operations-deep': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'sales-audit': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'sales-deep': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'compliance-audit': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'cs-audit': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'governance-audit': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'it-audit': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'projects-audit': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'quality-audit': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },
        'support-audit': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: 'diagnostic' },

        // تحليل الفجوات — مشترك بين المسارين
        'gap-analysis': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: null },

        // مرحلة الاكتشاف — مشترك (كل مسار بمستواه)
        'swot': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: 'discovery' },
        'tows': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: 'discovery' },
        'scenarios': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: 'discovery' },

        // مرحلة التخطيط — مشترك
        'directions': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: 'planning' },
        'objectives': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: 'planning' },
        'okrs': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: 'planning' },
        'kpis': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: 'planning' },
        'hr-kpis': { roles: ['dept_manager', 'pro_manager'], phase: 'planning' },
        'compliance-kpis': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin'], phase: 'planning' },

        // مرحلة التنفيذ — مشترك
        'initiatives': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: 'execution' },
        'projects': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: 'execution' },
        'reviews': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: 'execution' },
        'reports': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: 'execution' },
        'risk-map': { roles: ['dept_manager', 'pro_manager', 'owner', 'exec_manager'], phase: 'execution' },
        'change-management': { roles: ['owner', 'system_admin', 'exec_manager'], phase: 'execution' },
        'annual-plan': { roles: ['owner', 'system_admin', 'exec_manager', 'dept_manager', 'pro_manager'], phase: 'execution' },

        // الأدوات الاستراتيجية المتقدمة ( discovery/planning )
        'space-matrix': { roles: ['owner', 'system_admin', 'exec_manager'], phase: 'discovery' },
        'grand-strategy': { roles: ['owner', 'system_admin', 'exec_manager'], phase: 'discovery' },
        'bcg-matrix': { roles: ['owner', 'system_admin', 'exec_manager', 'dept_manager', 'pro_manager'], phase: 'discovery' },
        'ansoff-matrix': { roles: ['owner', 'system_admin', 'exec_manager', 'dept_manager', 'pro_manager'], phase: 'discovery' },
        'qspm': { roles: ['owner', 'system_admin', 'exec_manager'], phase: 'discovery' },
        'three-horizons': { roles: ['owner', 'system_admin', 'exec_manager', 'dept_manager', 'pro_manager'], phase: 'discovery' },
        'simulation-lab': { roles: ['owner', 'system_admin', 'exec_manager', 'dept_manager', 'pro_manager'], phase: 'discovery' },
        'strategy-map': { roles: ['owner', 'system_admin', 'exec_manager', 'dept_manager', 'pro_manager'], phase: 'planning' },
        'ogsm': { roles: ['owner', 'system_admin', 'exec_manager', 'dept_manager', 'pro_manager'], phase: 'planning' },
        'stakeholders': { roles: ['owner', 'system_admin', 'exec_manager', 'dept_manager', 'pro_manager'], phase: 'diagnostic' },

        // صفحات المالك والإدارة العليا
        'versions': { roles: ['owner', 'system_admin', 'exec_manager', 'supervisor'], phase: null },
        'entities': { roles: ['owner', 'system_admin', 'exec_manager'], phase: null },
        'team': { roles: ['owner', 'system_admin', 'exec_manager', 'supervisor'], phase: null },
        'intelligence': { roles: ['owner', 'system_admin', 'exec_manager', 'supervisor'], phase: null },
        'strategic-advisor': { roles: ['dept_manager', 'pro_manager', 'owner', 'system_admin', 'exec_manager'], phase: null },

        // أدوات المدير المستقل (audit-pro) — بدون phase gating
        'sales-audit-pro': { roles: ['pro_manager', 'consultant', 'owner', 'system_admin'], phase: null },
        'marketing-audit-pro': { roles: ['pro_manager', 'consultant', 'owner', 'system_admin'], phase: null },
        'hr-audit-pro': { roles: ['pro_manager', 'consultant', 'owner', 'system_admin'], phase: null },
        'compliance-audit-pro': { roles: ['pro_manager', 'consultant', 'owner', 'system_admin'], phase: null },
        'pro-dashboard': { roles: ['pro_manager', 'consultant', 'owner', 'system_admin', 'dept_manager'], phase: null },

        // صفحات عامة (بدون حماية)
        'login': { roles: null, phase: null },
        'select-type': { roles: null, phase: null },
        'select-dept': { roles: ['dept_manager', 'pro_manager'], phase: null },
        'diagnostic-owner': { roles: null, phase: null },
        'diagnostic-manager': { roles: null, phase: null },
        'diagnostic-investor': { roles: null, phase: null },
        'diagnostic-result': { roles: null, phase: null },
        'onboarding': { roles: null, phase: null },
        'pending-invite': { roles: null, phase: null },
        'journey': { roles: null, phase: null },
    };

    // ═══════════════════════════════════════════
    // 🔍 تحديد الصفحة الحالية
    // ═══════════════════════════════════════════
    function getCurrentPageKey() {
        const path = window.location.pathname;
        // إزالة / و .html
        let key = path.replace(/^\//, '').replace(/\.html$/, '');
        if (!key || key === '') key = 'index';
        return key;
    }

    // ═══════════════════════════════════════════
    // 🔐 الحصول على بيانات المستخدم
    // ═══════════════════════════════════════════
    function getUser() {
        if (window.Context?.getUser) return window.Context.getUser();
        // Fallback safely handled in Context
        return null;
    }

    function getUserRole() {
        if (window.Context?.getUserRole) return window.Context.getUserRole();
        const user = getUser();
        if (!user) return 'guest';

        const uType = (user.userType || '').toUpperCase();
        const role = (user.role || '').toUpperCase();

        // مدير إدارة مستقل (pro) — يستخدم أدوات audit-pro
        // fallback: isProManager + userCategory كافي حتى لو userType ناقص
        if (user.isProManager && (uType === 'DEPT_MANAGER' || user.userCategory?.startsWith('DEPT_'))) return 'pro_manager';

        // مدير إدارة داخلي (تابع للمالك) — يستخدم dept-smart
        if (uType === 'DEPT_MANAGER' || user.userCategory?.startsWith('DEPT_')) return 'dept_manager';

        // مدير تنفيذي / مدير عام
        if (uType === 'EXEC_MANAGER') return 'exec_manager';

        // مستشار خاص
        if (uType === 'CONSULTANT') return 'consultant';

        // المستثمر
        if (uType === 'INVESTOR' || role === 'INVESTOR') return 'investor';

        // المالك والإدارة
        const ownerRoles = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_MANAGER'];
        if (ownerRoles.includes(uType) || ownerRoles.includes(role)) return 'owner';

        return 'guest';
    }

    function getUserDept() {
        if (window.Context?.getDept) return window.Context.getDept();
        const params = new URLSearchParams(window.location.search);
        return params.get('dept') || null;
    }

    // ═══════════════════════════════════════════
    // 📊 حساب اكتمال مرحلة (متزامن — من localStorage)
    // ═══════════════════════════════════════════
    function getPhaseCompletion(phaseId) {
        const phase = PHASES[phaseId];
        if (!phase) return 1;

        const tools = phase.tools;
        let completed = 0;
        const dept = getUserDept() || 'hr';

        for (const tool of tools) {
            let done = false;

            // 1. فحص من context-manager
            if (window.Context?.isStepCompletedSync) {
                done = window.Context.isStepCompletedSync(tool);
            }

            // 2. Fallback: journey
            if (!done) {
                try {
                    const journey = Context.getItem('mgr_journey') || {};
                    if (journey.completedIds?.includes(tool)) done = true;
                } catch { }
            }

            if (done) completed++;
        }

        return tools.length > 0 ? completed / tools.length : 1;
    }

    // فحص غير متزامن: يسأل API عن البيانات المحفوظة
    async function getPhaseCompletionAsync(phaseId) {
        const phase = PHASES[phaseId];
        if (!phase) return 1;

        const tools = phase.tools;
        let completed = 0;
        const dept = getUserDept() || 'hr';

        // نفحص محلي أولاً
        const syncResult = getPhaseCompletion(phaseId);
        if (syncResult >= 1) return syncResult;

        // نفحص API للأدوات الناقصة
        const TYPE_MAP = {
            'dept-health': 'HEALTH', 'pestel': 'PESTEL', 'deep': 'DEEP',
            'audit': 'AUDIT', 'swot': 'SWOT', 'tows': 'TOWS',
            'scenarios': 'SCENARIOS', 'directions': 'DIRECTIONS',
            'objectives': 'OBJECTIVES', 'okrs': 'OKRS', 'kpis': 'KPIS',
            'initiatives': 'INITIATIVES', 'projects': 'PROJECTS',
            'reviews': 'REVIEWS', 'reports': 'REPORTS'
        };

        for (const tool of tools) {
            let done = false;
            if (window.Context?.isStepCompletedSync) {
                done = window.Context.isStepCompletedSync(tool);
            }
            if (done) { completed++; continue; }

            // فحص API
            const apiType = TYPE_MAP[tool];
            if (apiType && window.api?.get) {
                try {
                    const res = await window.api.get(`/api/dept/analysis?dept=${dept}&type=${apiType}`);
                    if (res?.success && res.data && (Array.isArray(res.data) ? res.data.length > 0 : !!res.data)) {
                        completed++;
                        // نحفظ في journey حتى ما نسأل API مرة ثانية
                        try {
                            let journey = Context.getItem('mgr_journey') || {};
                            if (!journey.completedIds) journey.completedIds = [];
                            if (!journey.completedIds.includes(tool)) journey.completedIds.push(tool);
                            Context.setItem('mgr_journey', journey);
                        } catch { }
                    }
                } catch { }
            }
        }

        return tools.length > 0 ? completed / tools.length : 1;
    }

    // ═══════════════════════════════════════════
    // 🔒 فحص بوابة المرحلة
    // ═══════════════════════════════════════════
    function checkPhaseGate(requiredPhase) {
        if (!requiredPhase) return { allowed: true };

        // 🛡️ المالك والمدير التنفيذي: رحلتهم مختلفة — لا تطبق قفل مراحل القسم عليهم
        const currentRole = getUserRole();
        if (currentRole === 'owner' || currentRole === 'exec_manager' || currentRole === 'system_admin') {
            return { allowed: true };
        }

        const phase = PHASES[requiredPhase];
        if (!phase || !phase.requires) return { allowed: true };

        const prevPhaseId = phase.requires;
        const prevPhase = PHASES[prevPhaseId];
        const completion = getPhaseCompletion(prevPhaseId);
        const required = phase.minCompletion;

        if (completion >= required) {
            return { allowed: true, completion, required };
        }

        const allTools = getMissingTools(prevPhaseId);
        return {
            allowed: false,
            completion,
            required,
            prevPhaseId,
            prevPhaseLabel: prevPhase.label,
            currentPhaseLabel: phase.label,
            allTools: allTools,
            missingTools: allTools.filter(t => !t.done),
            completedTools: allTools.filter(t => t.done)
        };
    }

    function getMissingTools(phaseId) {
        const phase = PHASES[phaseId];
        if (!phase) return [];
        const dept = getUserDept() || 'hr';

        const TOOL_INFO = {
            'dept-health': { label: 'صحة القسم', icon: 'bi-heart-pulse', path: `/dept-health.html?dept=${dept}`, desc: 'تقييم الصحة العامة للقسم' },
            'pestel': { label: 'تحليل PESTEL', icon: 'bi-globe2', path: `/pestel.html?dept=${dept}`, desc: 'تحليل العوامل الخارجية (سياسية، اقتصادية، اجتماعية...)' },
            'deep': { label: 'التحليل العميق', icon: 'bi-search', path: `/${dept}-deep.html?dept=${dept}`, desc: 'تشخيص عميق ومفصّل لعمليات القسم' },
            'audit': { label: 'التدقيق', icon: 'bi-clipboard-check', path: `/${dept}-audit.html?dept=${dept}`, desc: 'تدقيق الامتثال والعمليات' },
            'swot': { label: 'مصفوفة SWOT', icon: 'bi-grid-3x3', path: `/swot.html?dept=${dept}`, desc: 'تحليل القوة والضعف والفرص والتهديدات' },
            'tows': { label: 'مصفوفة TOWS', icon: 'bi-diagram-3', path: `/tows.html?dept=${dept}`, desc: 'استراتيجيات مبنية على نتائج SWOT' },
            'scenarios': { label: 'السيناريوهات', icon: 'bi-bezier2', path: `/scenarios.html?dept=${dept}`, desc: 'بناء سيناريوهات مستقبلية' },
            'directions': { label: 'التوجهات', icon: 'bi-signpost-split', path: `/directions.html?dept=${dept}`, desc: 'تحديد الرؤية والرسالة والتوجهات' },
            'objectives': { label: 'الأهداف', icon: 'bi-bullseye', path: `/objectives.html?dept=${dept}`, desc: 'تحديد الأهداف الاستراتيجية' },
            'okrs': { label: 'النتائج المفتاحية', icon: 'bi-trophy', path: `/okrs.html?dept=${dept}`, desc: 'ربط الأهداف بنتائج قابلة للقياس' },
            'kpis': { label: 'المؤشرات', icon: 'bi-speedometer2', path: `/kpis.html?dept=${dept}`, desc: 'تحديد مؤشرات الأداء' },
            'initiatives': { label: 'المبادرات', icon: 'bi-rocket-takeoff', path: `/initiatives.html?dept=${dept}`, desc: 'تحويل الأهداف إلى مبادرات عملية' },
            'projects': { label: 'المشاريع', icon: 'bi-kanban', path: `/projects.html?dept=${dept}`, desc: 'إدارة المشاريع التنفيذية' },
            'reviews': { label: 'المراجعات', icon: 'bi-arrow-repeat', path: `/reviews.html?dept=${dept}`, desc: 'مراجعة دورية للتقدم' },
            'reports': { label: 'التقارير', icon: 'bi-file-earmark-bar-graph', path: `/reports.html?dept=${dept}`, desc: 'تقارير شاملة' }
        };

        const all = [];
        for (const tool of phase.tools) {
            let done = false;
            if (window.Context?.isStepCompletedSync) {
                done = window.Context.isStepCompletedSync(tool);
            }
            const info = TOOL_INFO[tool] || { label: tool, icon: 'bi-circle', path: '#', desc: '' };
            all.push({ id: tool, ...info, done });
        }
        return all;
    }

    // ═══════════════════════════════════════════
    // 🛡️ التحقق من صلاحية القسم
    // ═══════════════════════════════════════════
    function checkDeptAccess() {
        const role = getUserRole();
        if (role !== 'dept_manager') return { allowed: true }; // المالك والمشرف يشوفون كل الأقسام

        const user = getUser();
        const userDept = user?.deptCode || user?.userCategory?.replace('DEPT_', '').toLowerCase();
        const pageDept = getUserDept();

        if (!pageDept || !userDept) return { allowed: true }; // ما نقدر نتحقق — نسمح

        if (pageDept.toLowerCase() === userDept.toLowerCase()) {
            return { allowed: true };
        }

        return {
            allowed: false,
            userDept,
            pageDept,
            message: `ليس لديك صلاحية الوصول لبيانات هذا القسم`
        };
    }

    // ═══════════════════════════════════════════
    // 🎨 عرض شاشة المنع (Gate Screen)
    // ═══════════════════════════════════════════
    function showBlockScreen(type, data) {
        // إخفاء المحتوى الأصلي (كل الأبناء المباشرين)
        Array.from(document.body.children).forEach(el => {
            if (el.id !== 'page-guard-overlay') el.style.display = 'none';
        });

        const overlay = document.createElement('div');
        overlay.id = 'page-guard-overlay';
        overlay.style.cssText = `
            position:fixed; inset:0; z-index:99999;
            background:#0b0d12; color:#f8fafc;
            display:flex; align-items:center; justify-content:center;
            font-family:'Tajawal',sans-serif; direction:rtl;
        `;

        let content = '';

        if (type === 'role') {
            content = `
                <div style="text-align:center; max-width:450px; padding:2rem">
                    <div style="font-size:3rem; margin-bottom:1rem">🚫</div>
                    <h2 style="font-size:1.4rem; margin-bottom:0.5rem">صفحة غير مصرح لك بالوصول إليها</h2>
                    <p style="color:#94a3b8; margin-bottom:1.5rem">${data.message || 'ليس لديك الصلاحية المطلوبة لعرض هذه الصفحة'}</p>
                    <a href="${data.redirect}" style="display:inline-block; padding:0.75rem 2rem; background:#6366f1; color:#fff; border-radius:12px; text-decoration:none; font-weight:700">
                        <i class="bi bi-arrow-right"></i> العودة للوحتك
                    </a>
                </div>`;
        }

        else if (type === 'phase') {
            const pct = Math.round((data.completion || 0) * 100);
            const reqPct = Math.round((data.required || 0) * 100);
            const allTools = data.allTools || [];
            const completed = data.completedTools || [];
            const missing = data.missingTools || [];
            const total = allTools.length;
            const doneCount = completed.length;
            const needed = Math.ceil(total * data.required);

            const toolsHtml = allTools.map(t => {
                if (t.done) {
                    return `<a href="${t.path}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:10px;margin:5px 0;text-decoration:none;color:#e2e8f0">
                        <i class="bi ${t.icon}" style="font-size:1.1rem;color:#22c55e;width:28px;text-align:center"></i>
                        <div style="flex:1">
                            <div style="font-weight:700;font-size:0.88rem">${t.label}</div>
                            <div style="font-size:0.72rem;color:#64748b">${t.desc}</div>
                        </div>
                        <i class="bi bi-check-circle-fill" style="color:#22c55e;font-size:1.1rem"></i>
                    </a>`;
                } else {
                    return `<a href="${t.path}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin:5px 0;text-decoration:none;color:#e2e8f0;transition:all 0.2s" onmouseover="this.style.borderColor='#6366f1';this.style.background='rgba(99,102,241,0.08)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)';this.style.background='rgba(255,255,255,0.02)'">
                        <i class="bi ${t.icon}" style="font-size:1.1rem;color:#94a3b8;width:28px;text-align:center"></i>
                        <div style="flex:1">
                            <div style="font-weight:700;font-size:0.88rem">${t.label}</div>
                            <div style="font-size:0.72rem;color:#64748b">${t.desc}</div>
                        </div>
                        <span style="font-size:0.68rem;padding:3px 10px;border-radius:8px;background:rgba(245,158,11,0.12);color:#f59e0b;font-weight:700;white-space:nowrap">ابدأ الآن</span>
                    </a>`;
                }
            }).join('');

            content = `
                <div style="max-width:550px; padding:2rem">
                    <div style="text-align:center">
                        <div style="font-size:2.5rem; margin-bottom:0.5rem">🔒</div>
                        <h2 style="font-size:1.3rem; margin-bottom:0.3rem">مرحلة "${data.currentPhaseLabel}" مقفلة</h2>
                        <p style="color:#94a3b8; margin-bottom:1rem; font-size:0.85rem">أكمل <strong>${needed} أدوات</strong> على الأقل من مرحلة <strong>"${data.prevPhaseLabel}"</strong> (${reqPct}%)</p>
                    </div>

                    <div style="background:rgba(255,255,255,0.04); border-radius:14px; padding:14px 16px; margin-bottom:1rem">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                            <span style="font-size:0.82rem; font-weight:700; color:#94a3b8">التقدم:</span>
                            <span style="font-size:0.82rem; font-weight:800; color:${pct >= reqPct ? '#22c55e' : '#6366f1'}">${doneCount} / ${total} أدوات (${pct}%)</span>
                        </div>
                        <div style="background:rgba(255,255,255,0.08); border-radius:999px; height:10px; overflow:hidden; position:relative">
                            <div style="position:absolute;right:0;top:0;height:100%;width:${reqPct}%;border-left:2px dashed #f59e0b;z-index:1"></div>
                            <div style="background:linear-gradient(90deg,#6366f1,#a855f7); height:100%; width:${pct}%; border-radius:999px; transition:width 0.5s; position:relative; z-index:2"></div>
                        </div>
                        <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:0.68rem;color:#64748b">
                            <span>مكتمل: ${doneCount}</span>
                            <span style="color:#f59e0b">الحد الأدنى: ${needed}</span>
                            <span>الإجمالي: ${total}</span>
                        </div>
                    </div>

                    <div style="margin-bottom:1rem">
                        <div style="font-weight:700; margin-bottom:6px; font-size:0.82rem; color:#94a3b8; text-align:right">
                            <i class="bi bi-list-check"></i> اضغط على أي أداة لإكمالها:
                        </div>
                        ${toolsHtml}
                    </div>

                    <div style="text-align:center">
                        <a href="${data.redirect || '/dept-dashboard.html'}" style="display:inline-block; padding:0.5rem 1.5rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#94a3b8; border-radius:10px; text-decoration:none; font-weight:600; font-size:0.82rem">
                            <i class="bi bi-arrow-right"></i> العودة لمركز القيادة الاستراتيجية
                        </a>
                    </div>
                </div>`;
        }

        else if (type === 'dept') {
            content = `
                <div style="text-align:center; max-width:450px; padding:2rem">
                    <div style="font-size:3rem; margin-bottom:1rem">🔐</div>
                    <h2 style="font-size:1.4rem; margin-bottom:0.5rem">بيانات قسم آخر</h2>
                    <p style="color:#94a3b8; margin-bottom:1.5rem">${data.message}</p>
                    <a href="${data.redirect}" style="display:inline-block; padding:0.75rem 2rem; background:#6366f1; color:#fff; border-radius:12px; text-decoration:none; font-weight:700">
                        <i class="bi bi-arrow-right"></i> العودة لقسمك
                    </a>
                </div>`;
        }

        overlay.innerHTML = content;
        document.body.appendChild(overlay);
    }

    // ═══════════════════════════════════════════
    // 🚀 تشغيل الحارس
    // ═══════════════════════════════════════════
    async function runGuard() {
        const pageKey = getCurrentPageKey();
        const rule = PAGE_RULES[pageKey];

        // صفحة غير مسجلة في القواعد — نسمح (صفحات عامة)
        if (!rule) return;

        // صفحة عامة بدون حماية
        if (rule.roles === null && rule.phase === null) return;

        // 🛡️ إذا الكاش فارغ (بعد entity switch) — ننتظر السيرفر قبل أي قرار
        let user = getUser();
        if (!user && window.api?.getCurrentUser) {
            try {
                user = await window.api.getCurrentUser();
            } catch (e) {
                // Unauthorized فعلاً — نوجه للـ login
                if (!window._entitySwitching) {
                    window.location.href = '/login.html';
                }
                return;
            }
        }

        const role = getUserRole();
        const dept = getUserDept();

        // ═══ فحص 0: إذا مدير إدارة بدون ?dept= في الرابط → نضيفه تلقائياً ═══
        const urlHasDept = new URLSearchParams(window.location.search).has('dept');
        if (role === 'dept_manager' && !urlHasDept) {
            // نحاول نستخرج القسم من كل مصدر ممكن
            let autoDept = user?.deptCode
                || (user?.userCategory?.startsWith('DEPT_') ? user.userCategory.replace('DEPT_', '').toLowerCase() : null)
                || user?.department?.key?.toLowerCase()
                || (window._cachedUser?.deptCode)
                || (window._cachedUser?.userCategory?.startsWith('DEPT_') ? window._cachedUser.userCategory.replace('DEPT_', '').toLowerCase() : null);

            // fix mapped codes
            const catMap = { 'ops': 'operations', 'service': 'cs', 'pmo': 'projects' };
            if (autoDept && catMap[autoDept]) autoDept = catMap[autoDept];

            if (autoDept) {
                const url = new URL(window.location.href);
                url.searchParams.set('dept', autoDept);
                window.location.replace(url.toString());
                return;
            }
        }

        // ═══ فحص 1: الدور ═══
        if (rule.roles && rule.roles.length > 0) {
            if (!user) {
                window.location.href = '/login.html';
                return;
            }

            if (!rule.roles.includes(role)) {
                // توجيه للوحة الصحيحة
                let redirect = '/select-type.html';
                if (role === 'owner') redirect = '/ceo-dashboard.html';
                else if (role === 'pro_manager') redirect = '/pro-dashboard.html';
                else if (role === 'dept_manager') redirect = `/dept-dashboard.html?dept=${dept || ''}`;
                else if (role === 'consultant') redirect = '/consultant-dashboard.html';
                else if (role === 'investor') redirect = '/investor-dashboard.html';

                const roleLabels = { owner: 'مالك', dept_manager: 'مدير إدارة', pro_manager: 'مدير مستقل', consultant: 'مستشار', investor: 'مستثمر' };
                showBlockScreen('role', {
                    message: `هذه الصفحة مخصصة لدور آخر. دورك الحالي: ${roleLabels[role] || role}`,
                    redirect
                });
                return;
            }
        }

        // ═══ فحص 2: القسم (مدير الإدارة فقط) ═══
        if (role === 'dept_manager' && dept) {
            const deptCheck = checkDeptAccess();
            if (!deptCheck.allowed) {
                showBlockScreen('dept', {
                    message: deptCheck.message,
                    redirect: `/dept-dashboard.html?dept=${deptCheck.userDept}`
                });
                return;
            }
        }

        // ═══ فحص 3: بوابة المرحلة (sync أولاً، ثم async) ═══
        if (rule.phase) {
            const syncGate = checkPhaseGate(rule.phase);
            if (syncGate.allowed) return; // مفتوح — نسمح فوراً

            // الفحص المحلي يقول مقفل — نتأكد من API قبل ما نمنع
            (async () => {
                try {
                    const phase = PHASES[rule.phase];
                    if (phase?.requires) {
                        const asyncCompletion = await getPhaseCompletionAsync(phase.requires);
                        if (asyncCompletion >= phase.minCompletion) {
                            // API أكد الاكتمال — نسمح بالعرض (بدون reload لمنع حلقة لا نهائية)
                            console.log('[PageGuard] ✅ Async check passed for phase:', rule.phase);
                            return;
                        }
                    }
                } catch (e) {
                    console.warn('[PageGuard] Async check failed:', e);
                }

                // فعلاً ناقص — نعرض شاشة المنع
                console.error('[PageGuard] ❌ BLOCKING page:', pageKey, 'phase:', rule.phase);
                const gateCheck = checkPhaseGate(rule.phase);
                const redirectDept = dept ? `?dept=${dept}` : '';
                showBlockScreen('phase', {
                    ...gateCheck,
                    redirect: `/dept-dashboard.html${redirectDept}`
                });
            })();
        }
    }

    // ═══════════════════════════════════════════
    // 📤 واجهة عامة (للاستخدام من صفحات أخرى)
    // ═══════════════════════════════════════════
    window.PageGuard = {
        PHASES,
        PAGE_RULES,
        getPhaseCompletion,
        getPhaseCompletionAsync,
        checkPhaseGate,
        checkDeptAccess,
        getMissingTools,
        getUserRole,

        // للاستخدام في sidebar — هل المرحلة مفتوحة؟
        isPhaseUnlocked(phaseId) {
            const result = checkPhaseGate(phaseId);
            return result.allowed;
        },

        // هل أداة محددة متاحة؟
        isToolAccessible(toolName) {
            for (const [phaseId, phase] of Object.entries(PHASES)) {
                if (phase.tools.includes(toolName)) {
                    return this.isPhaseUnlocked(phaseId);
                }
            }
            return true; // أداة غير مسجلة — نسمح
        },

        // الحصول على ملخص كل المراحل (للداشبورد)
        getAllPhasesStatus() {
            const result = {};
            for (const [id, phase] of Object.entries(PHASES)) {
                const completion = getPhaseCompletion(id);
                const gate = checkPhaseGate(id);
                result[id] = {
                    label: phase.label,
                    completion: Math.round(completion * 100),
                    unlocked: gate.allowed,
                    missing: gate.allowed ? [] : (gate.missingTools || [])
                };
            }
            return result;
        }
    };

    // ═══════════════════════════════════════════
    // ⚡ تشغيل تلقائي عند تحميل الصفحة
    // ═══════════════════════════════════════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runGuard);
    } else {
        runGuard();
    }

})();
