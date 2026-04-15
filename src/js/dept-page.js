// js/dept-page.js - النسخة المعززة لمعالجة مزامنة البيانات
(function () {
    // إضافة CSS اللازم للـ toast
    if (!document.getElementById('dept-page-styles')) {
        const style = document.createElement('style');
        style.id = 'dept-page-styles';
        style.textContent = `
            .dept-toast {
                position: fixed;
                bottom: 25px;
                right: 25px;
                padding: 14px 24px;
                border-radius: 12px;
                font-weight: 700;
                z-index: 9999;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                animation: dept-fadeInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                color: white;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            @keyframes dept-fadeInUp {
                from { opacity: 0; transform: translateY(30px) scale(0.9); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    window.DeptPage = {
        _dept: null,

        // هل المستخدم الحالي مدير إدارة (DEPT_MANAGER)?
        // يُستخدم لمنع تحميل بيانات localStorage غير معزولة
        // 🛡️ نعتمد على userType فقط (لا role) — لأن COMPANY_MANAGER قد يملك role='MANAGER' في العضوية
        isDeptManager() {
            const user = window._cachedUser;
            return !!(user?.userType === 'DEPT_MANAGER');
        },

        // قراءة آمنة من localStorage — تُرجع {} للمدير الإداري
        safeGetLocal(key, fallback = {}) {
            if (this.isDeptManager()) return fallback;
            try {
                return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
            } catch (e) { return fallback; }
        },

        // كتابة آمنة في localStorage — تتجاهل طلب المدير الإداري
        safeSetLocal(key, value) {
            if (this.isDeptManager()) return; // DEPT_MANAGER لا يكتب في raw localStorage
            try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { }
        },

        // Getter ذكي للقسم (يتحقق من السياق أو الرابط)
        get dept() {
            if (this._dept) return this._dept;
            if (window.Context && typeof Context.getDept === 'function') {
                this._dept = Context.getDept();
            } else {
                const params = new URLSearchParams(window.location.search);
                this._dept = params.get('dept');
            }
            return this._dept;
        },

        set dept(val) {
            this._dept = val;
        },

        escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/[&<>"']/g, m => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;',
                '"': '&quot;', "'": '&#039;'
            }[m]));
        },

        showMessage(message, isError = false) {
            const existing = document.querySelector('.dept-toast');
            if (existing) existing.remove();
            const div = document.createElement('div');
            div.className = 'dept-toast';
            div.style.background = isError ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #22c55e, #15803d)';
            div.innerHTML = `<i class="bi bi-${isError ? 'exclamation-circle' : 'check-circle'}-fill"></i> ${message}`;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 4000);
        },

        async init(configOrDept, requiredRole = 'dept_manager') {
            let config = {};
            if (typeof configOrDept === 'object' && configOrDept !== null) {
                config = configOrDept;
                this.dept = config.dept || this.dept;
            } else {
                this.dept = configOrDept || this.dept;
            }

            // 🛡️ التحقق من الاستثناءات (مثلاً: الامتثال لا يحتاج أهدافاً مستقلة)
            if (this._checkExclusions()) return false;

            // 🛡️ محاولة جلب بيانات المستخدم ولكن دون جعلها عائقاً
            (async () => {
                try {
                    if (window.api && typeof api.getCurrentUser === 'function') {
                        await api.getCurrentUser();
                    }
                } catch (e) { console.warn('[DeptPage] Context fetch error', e); }
            })();

            // إذا كان هناك Config، نقوم بالتحميل التلقائي فوراً لضمان وجود preventDefault
            if (config.formId && config.saveKey) {
                this.handleAutoFlow(config);
            }

            // ✅ إصلاح تلقائي لروابط التنقل — يضيف ?dept= لكل رابط يفتقده
            // يعمل بعد تحميل DOM بالكامل
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.fixNavLinks());
            } else {
                // DOM جاهز — انتظر frame واحد لضمان رسم الروابط الديناميكية
                requestAnimationFrame(() => this.fixNavLinks());
            }

            return true;
        },

        _checkExclusions() {
            if (!this.dept || !window.STEPS_CONFIG) return false;
            const currentPath = window.location.pathname;
            const dept = this.dept.toLowerCase();
            const exclusions = (STEPS_CONFIG.DEPT_EXCLUSIONS && STEPS_CONFIG.DEPT_EXCLUSIONS[dept]) || [];

            if (exclusions.length === 0) return false;

            // تحديد المعرف الخاص بالأداة الحالية
            const currentTool = STEPS_CONFIG.DEPARTMENT_TOOLS.find(t => {
                const toolUrl = t.path.replace('{dept}', dept).split('?')[0];
                return currentPath.endsWith(toolUrl);
            });

            if (currentTool && exclusions.includes(currentTool.id)) {
                console.warn(`[DeptPage] Access denied: Tool ${currentTool.id} is excluded for department ${dept}`);
                this.showMessage(`عذراً، إدارة ${STEPS_CONFIG.deptNames[dept] || dept} تتبع مسار المالك مباشرة ولا تحتاج لهذه الأداة بشكل منفصل.`, true);
                setTimeout(() => {
                    window.location.href = `/dept-dashboard.html?dept=${dept}`;
                }, 3000);
                return true;
            }
            return false;
        },

        async handleAutoFlow(config) {
            const { formId, saveKey, onLoad, onBeforeSave, type = 'DEEP_ANALYSIS' } = config;
            const form = document.getElementById(formId);
            if (!form) return;

            // 1. محاولة التحميل من API
            let data = await this.loadFromAPI(type);

            // 2. Fallback للمستخدمين غير الإداريين فقط
            // ⚠️ DEPT_MANAGER لا يستخدم Context/localStorage أبداً — API فقط
            // السبب: legacy fallback قد يجلب بيانات مدير آخر من مفاتيح قديمة (stratix_hr_deep_data)
            const currentUser = window._cachedUser;
            // 🛡️ نعتمد على userType فقط — role قد يكون 'MANAGER' لـ COMPANY_MANAGER أيضاً
            const isDeptMgr = currentUser?.userType === 'DEPT_MANAGER';

            if (!data && !isDeptMgr && window.Context) {
                data = Context.getItem(type + '_' + (this.dept || 'HR').toUpperCase());
                if (data) console.log(`[DeptPage] Loaded ${type} from secure context.`);
            }

            // 3. ملء النموذج
            if (data) {
                this.fillForm(data);
                if (typeof onLoad === 'function') onLoad(data);
            }

            // 4. ربط حدث الحفظ (Submit)
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> جاري الحفظ...';
                }

                let formData = {};
                const fd = new FormData(form);
                fd.forEach((val, key) => formData[key] = val);

                // معالجة الراديو (نعم/لا) بشكل يدوي لضمان التقاطها
                form.querySelectorAll('input[type="radio"]:checked').forEach(r => {
                    formData[r.name] = r.value;
                });

                if (typeof onBeforeSave === 'function') {
                    formData = onBeforeSave(formData) || formData;
                }

                // 🔒 الحفظ في السياق المعزول (Context) كنسخة احتياطية فورية
                if (window.Context) {
                    Context.setItem(type + '_' + (this.dept || 'HR').toUpperCase(), formData);
                } else {
                    localStorage.setItem(saveKey, JSON.stringify(formData));
                }

                // إعطاء انطباع بالنجاح فوري لتحسين التجربة
                this.showMessage('جاري المزامنة والحفظ... ✅');

                // الحفظ في API — يجب الانتظار لضمان المزامنة قبل الانتقال
                try {
                    const success = await this.saveToAPI(type, formData);
                    if (!success) {
                        console.warn('[DeptPage] Cloud save failed, but local copy is safe.');
                    }
                } catch (apiErr) {
                    console.error('[DeptPage] Background API Save Failed:', apiErr);
                }

                if (config.nextUrl) {
                    // الانتقال بعد التأكد من انتهاء محاولة الحفظ
                    window.location.href = config.nextUrl;
                }
            });
        },

        async loadFromAPI(type) {
            // التأكد من جلب بيانات المستخدم لضمان صحة السياق (Context)
            if (window.api && typeof api.getCurrentUser === 'function') {
                await api.getCurrentUser().catch(() => null);
            }

            const currentDept = this.dept;
            if (!currentDept) {
                console.warn('DeptPage: No department found for loadFromAPI');
                return null;
            }

            // 🛡️ Guard against excluded tools
            if (this._checkExclusions()) return null;

            const versionId = window.Context?.getActiveVersionId?.();
            const versionQuery = versionId ? `&versionId=${versionId}` : '';

            try {
                let rData = null;
                if (window.api?.get) {
                    const response = await window.api.get(`/api/dept/analysis?dept=${currentDept}&type=${type}${versionQuery}`);
                    rData = response?.success ? (response.data?.data || response.data) : null;
                } else if (typeof window.callApiWithTimeout === 'function') {
                    const response = await window.callApiWithTimeout(`/api/dept/analysis?dept=${currentDept}&type=${type}${versionQuery}`);
                    rData = response?.success ? (response.data?.data || response.data) : null;
                }

                // 🛡️ Guard: كائن فارغ {} يُعامل كـ null (بعض APIs ترجع {} بدل null)
                if (rData && typeof rData === 'object' && !Array.isArray(rData) && Object.keys(rData).length === 0) {
                    rData = null;
                }

                if (rData) {
                    // مزامنة الكاش المحلي المعزول — مفتاح يشمل userId لمنع تسرب البيانات بين المستخدمين
                    if (window.Context) Context.setItem(type + '_' + currentDept.toUpperCase(), rData);
                    else {
                        const _uid = window._cachedUser?.id || window.__currentUser?.id || 'local';
                        localStorage.setItem(`stratix_${_uid}_${currentDept}_${type}`, JSON.stringify(rData));
                    }
                    return rData;
                }
                return null;
            } catch (e) {
                console.warn(`[DeptPage] API Load failed for ${type}`);
                // ⚠️ DEPT_MANAGER لا يستخدم localStorage fallback — قد يجلب بيانات مدير آخر
                const usr = window._cachedUser;
                // 🛡️ userType فقط — COMPANY_MANAGER قد يملك role='MANAGER'
                const isDM = usr?.userType === 'DEPT_MANAGER';
                if (isDM) return null;

                if (window.Context) return Context.getItem(type + '_' + currentDept.toUpperCase());
                const _uid = window._cachedUser?.id || window.__currentUser?.id || 'local';
                const cached = localStorage.getItem(`stratix_${_uid}_${currentDept}_${type}`);
                if (cached) {
                    try { return JSON.parse(cached); } catch (err) { }
                }
                return null;
            }
        },

        async saveToAPI(type, data) {
            const currentDept = this.dept;
            if (!currentDept) {
                this.showMessage('خطأ: لم يتم تحديد الإدارة لحفظ البيانات', true);
                return false;
            }
            // 🛡️ Always save locally using secure context as a primary fail-safe — مع عزل بـ userId
            if (window.Context) Context.setItem(type + '_' + currentDept.toUpperCase(), data);
            else {
                const _uid = window._cachedUser?.id || window.__currentUser?.id || 'local';
                localStorage.setItem(`stratix_${_uid}_${currentDept}_${type}`, JSON.stringify(data));
            }

            const saveVersionId = window.Context?.getActiveVersionId?.();
            try {
                const payload = { type, dept: currentDept, data, ...(saveVersionId ? { versionId: saveVersionId } : {}) };
                if (window.api?.post) {
                    const response = await window.api.post('/api/dept/analysis', payload);
                    return !!response?.success;
                }
                if (typeof window.callApiWithTimeout === 'function') {
                    const response = await window.callApiWithTimeout('/api/dept/analysis', {
                        method: 'POST',
                        body: payload
                    });
                    return !!response?.success;
                }
                const response = await window.api.post('/api/dept/analysis', payload);
                return !!response?.success;
            } catch (e) {
                console.warn(`[DeptPage] Background API Save Failed for ${type}. Local cache is secured.`, e);
                // Return true to safely proceed to next step even if offline
                return true;
            }
        },

        fillForm(data) {
            if (!data) return;
            for (const [key, value] of Object.entries(data)) {
                // البحث بالاسم (للبروتوكولات مثل الراديو) أو المعرف
                const elements = document.getElementsByName(key);
                if (elements.length > 0) {
                    elements.forEach(el => {
                        if (el.type === 'radio' || el.type === 'checkbox') {
                            el.checked = (el.value === value);
                        } else {
                            el.value = value;
                        }
                    });
                } else {
                    const el = document.getElementById(key);
                    if (el) {
                        if (el.type === 'radio' || el.type === 'checkbox') {
                            el.checked = (el.value === value);
                        } else {
                            el.value = value;
                        }
                    }
                }
            }
        },

        migrateFromLocalStorage(key) {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    console.warn(`DeptPage: Failed to parse local storage key ${key}`, e);
                }
            }
            return null;
        },

        // ════════════════════════════════════════════════════
        // loadDeepSummary — يعرض ملخص التحليل العميق السابق
        // يُستخدم في صفحات audit لإظهار السياق للمدير
        // ════════════════════════════════════════════════════
        async loadDeepSummary(containerId) {
            const el = document.getElementById(containerId);
            if (!el) return;
            try {
                const data = await this.loadFromAPI('DEEP_ANALYSIS');
                if (!data) { el.style.display = 'none'; return; }

                // استخراج أبرز الحقول من التحليل العميق
                const fields = [];
                const picks = [
                    ['main_challenge', 'أبرز تحدي'],
                    ['mainChallenge', 'أبرز تحدي'],
                    ['top_priority', 'الأولوية الحالية'],
                    ['priority', 'الأولوية'],
                    ['growth_target', 'هدف النمو'],
                    ['growthTarget', 'هدف النمو'],
                    ['team_size', 'حجم الفريق'],
                    ['teamSize', 'حجم الفريق'],
                    ['main_kpi', 'المؤشر الرئيسي'],
                    ['compliance_level', 'مستوى الامتثال'],
                ];
                picks.forEach(([key, label]) => {
                    if (data[key] && !fields.find(f => f.label === label)) {
                        fields.push({ label, value: data[key] });
                    }
                });

                if (fields.length === 0) { el.style.display = 'none'; return; }

                el.style.display = 'block';
                el.innerHTML = `
                    <div style="background:rgba(102,126,234,0.06);border:1px solid rgba(102,126,234,0.15);border-radius:12px;padding:14px 18px;margin-bottom:16px">
                        <div style="font-size:12px;font-weight:700;color:#667eea;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                            <span>📊</span> ملخص التحليل العميق السابق
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">
                            ${fields.slice(0, 4).map(f => `
                                <div style="background:rgba(255,255,255,0.5);border-radius:8px;padding:8px 12px">
                                    <div style="font-size:10px;color:#64748b;margin-bottom:2px">${f.label}</div>
                                    <div style="font-size:13px;font-weight:700;color:#1e293b">${f.value}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } catch (e) {
                console.warn('[DeptPage] loadDeepSummary error:', e);
                if (el) el.style.display = 'none';
            }
        },

        // ════════════════════════════════════════════════════
        // loadStrategicMemory — المستوى الأول من "التناغم الاستراتيجي"
        // يربط الأدوات ببعضها عبر عرض "ذاكرة ذكية" بسيطة للسياق السابق
        // ════════════════════════════════════════════════════
        async loadStrategicMemory(containerId, sourceToolId) {
            const el = document.getElementById(containerId);
            if (!el) return;

            const dept = (this.dept || 'HR').toUpperCase();

            try {
                // الربط 1: SWOT -> TOWS 
                if (sourceToolId === 'swot' && window.location.pathname.includes('tows')) {
                    const data = await this.loadFromAPI('SWOT_' + dept);
                    if (!data) return;
                    const sCount = (data.strengths || []).length;
                    const oCount = (data.opportunities || []).length;
                    if (sCount === 0 && oCount === 0) return;

                    el.innerHTML = `
                        <div class="context-memory-banner">
                            <div class="context-memory-icon"><i class="bi bi-link-45deg"></i></div>
                            <div class="context-memory-content">
                                <div class="context-memory-title">من تحليل SWOT السابق</div>
                                <p class="context-memory-text">لديك <strong>${sCount} نقاط قوة</strong> و <strong>${oCount} فرصة</strong> متاحة. استغلها هنا لبناء استراتيجيات الهجوم (SO).</p>
                            </div>
                        </div>
                    `;
                }

                // الربط 2: TOWS -> Directions
                if (sourceToolId === 'tows') {
                    const data = await this.loadFromAPI('TOWS_' + dept);
                    if (!data) return;
                    const topStrats = [];
                    if (data.so) topStrats.push({ label: 'الهجومية (SO)', val: data.so });
                    if (data.wo) topStrats.push({ label: 'العلاجية (WO)', val: data.wo });
                    if (topStrats.length === 0) return;

                    const top = topStrats[0];
                    el.innerHTML = `
                        <div class="context-memory-banner">
                            <div class="context-memory-icon"><i class="bi bi-lightbulb-fill"></i></div>
                            <div class="context-memory-content">
                                <div class="context-memory-title">من مصفوفة TOWS السابقة</div>
                                <p class="context-memory-text">استراتيجيتك المقترحة هي <strong>${top.label}</strong>: "${top.val.substring(0, 120)}${top.val.length > 120 ? '...' : ''}"</p>
                            </div>
                        </div>
                    `;
                }

                // الربط 3: Directions -> Objectives
                if (sourceToolId === 'directions') {
                    const data = await this.loadFromAPI('DIRECTIONS_' + dept);
                    if (!data || !data.vision) return;

                    el.innerHTML = `
                        <div class="context-memory-banner">
                            <div class="context-memory-icon"><i class="bi bi-compass-fill"></i></div>
                            <div class="context-memory-content">
                                <div class="context-memory-title">بوصلة الهوية الاستراتيجية</div>
                                <p class="context-memory-text">رؤيتك المعتمدة: "<strong>${data.vision}</strong>". تأكد أن أهدافك القادمة تدعم هذا التوجه.</p>
                            </div>
                        </div>
                    `;
                }
            } catch (e) {
                console.warn('[DeptPage] Strategic Memory load failed:', e);
            }
        },

        renderDeptSwitcher(containerId = 'dept-switcher-container') {
            // محاولة الحصول على المستخدم من كل المصادر المتاحة
            const user = window._cachedUser
                || (window.api && typeof window.api.getCachedUser === 'function' ? window.api.getCachedUser() : null)
                || (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; } })();

            if (!user) {
                // retry بعد تحميل الـ API
                if (window.api && typeof window.api.getCurrentUser === 'function') {
                    window.api.getCurrentUser().then(() => {
                        this.renderDeptSwitcher(containerId);
                    }).catch(() => { });
                } else {
                    // retry بعد 500ms كـ fallback أخير
                    setTimeout(() => this.renderDeptSwitcher(containerId), 500);
                }
                return;
            }

            const role = (user.userType || user.role || '').toUpperCase();
            const privileged = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_MANAGER', 'CEO', 'EXEC_MANAGER'];
            if (!privileged.includes(role)) return;

            const container = document.getElementById(containerId);
            if (!container) return;

            const currentDept = this.dept || 'hr';

            // ── القائمة الموحدة للإدارات ──
            const DEPTS_LIST = [
                { code: 'hr', name: 'الموارد البشرية', icon: '👥', color: '#3b82f6' },
                { code: 'finance', name: 'المالية', icon: '💰', color: '#f59e0b' },
                { code: 'sales', name: 'المبيعات', icon: '📈', color: '#10b981' },
                { code: 'marketing', name: 'التسويق', icon: '📣', color: '#8b5cf6' },
                { code: 'operations', name: 'العمليات', icon: '⚙️', color: '#6366f1' },
                { code: 'compliance', name: 'الامتثال', icon: '⚖️', color: '#ef4444' },
                { code: 'it', name: 'تقنية المعلومات', icon: '💻', color: '#06b6d4' },
                { code: 'support', name: 'الخدمات المساندة', icon: '🛠️', color: '#64748b' },
                { code: 'governance', name: 'الحوكمة', icon: '🏛️', color: '#8b5cf6' },
                { code: 'quality', name: 'الجودة', icon: '✅', color: '#10b981' },
                { code: 'cs', name: 'خدمة العملاء', icon: '🎧', color: '#3b82f6' },
            ];

            const activeDept = DEPTS_LIST.find(d => d.code === currentDept) || DEPTS_LIST[0];
            const panelId = 'stx-dept-panel-' + containerId;

            // ── قراءة درجات الصحة والتقدم ──
            let healthScores = {};
            const tools = ['PESTEL', 'SWOT', 'TOWS', 'SCENARIOS', 'DIRECTIONS', 'OBJECTIVES', 'OKRS', 'KPIS', 'INITIATIVES'];

            DEPTS_LIST.forEach(d => {
                const dk = d.code.toUpperCase();
                let count = 0;
                tools.forEach(t => {
                    const data = localStorage.getItem(`${t}_${dk}`)
                        || localStorage.getItem(`stratix_${user.id}_${d.code}_${t}`);
                    if (data && data !== '[]' && data !== '{}') count++;
                });

                // إذا كان القسم الحالي هو النشط، نضمن إظهار تقدم بدلاً من "لم يتم تقييمه"
                if (d.code === currentDept && count === 0) count = 1;

                if (count > 0) healthScores[d.code] = Math.round((count / tools.length) * 100);
            });

            try {
                const ch = JSON.parse(localStorage.getItem('stratix_company_health') || 'null');
                if (ch && ch.departments) {
                    Object.keys(ch.departments).forEach(k => {
                        // الأولوية للصحة إذا كانت موجودة وكاملة
                        if (ch.departments[k]?.score > (healthScores[k] || 0)) {
                            healthScores[k] = ch.departments[k].score;
                        }
                    });
                }
            } catch (e) { }

            function scoreRing(score, isCurrent = false) {
                if (score == null && !isCurrent) return `<span style="width:8px;height:8px;border-radius:50%;background:#334155;display:inline-block;flex-shrink:0"></span>`;
                if (score == null && isCurrent) return `<span style="width:8px;height:8px;border-radius:50%;background:#818cf8;display:inline-block;flex-shrink:0;box-shadow:0 0 5px #818cf880"></span>`;
                const c = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
                return `<span style="width:8px;height:8px;border-radius:50%;background:${c};display:inline-block;flex-shrink:0;box-shadow:0 0 5px ${c}80"></span>`;
            }

            // ── CSS (مرة واحدة فقط) ──
            if (!document.getElementById('stx-dept-switcher-css')) {
                const style = document.createElement('style');
                style.id = 'stx-dept-switcher-css';
                style.textContent = `
                    .stx-ds-trigger {
                        display:flex; align-items:center; gap:8px;
                        background:rgba(255,255,255,0.05);
                        border:1px solid rgba(255,255,255,0.1);
                        border-radius:12px; padding:7px 14px;
                        cursor:pointer; font-size:13px; font-weight:700;
                        color:#f1f5f9; transition:all 0.2s; white-space:nowrap;
                        font-family:'Tajawal',sans-serif;
                    }
                    .stx-ds-trigger:hover { background:rgba(255,255,255,0.09); border-color:rgba(255,255,255,0.2); }
                    .stx-ds-trigger .arrow { font-size:9px; opacity:0.5; transition:transform 0.2s; }
                    .stx-ds-trigger.open .arrow { transform:rotate(180deg); }

                    .stx-ds-panel {
                        position:absolute; top:calc(100% + 15px); right: 50%;
                        transform: translateX(50%);
                        background: rgba(15, 23, 42, 0.98);
                        backdrop-filter: blur(25px);
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        border-radius: 24px; padding:22px;
                        width:380px; z-index:9999;
                        box-shadow:0 30px 80px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.08);
                        display:none;
                        animation: stxDsIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
                    }
                    .stx-ds-panel.open { display:block; }
                    @keyframes stxDsIn {
                        from { opacity:0; transform:translateY(-15px) translateX(50%) scale(0.92); }
                        to   { opacity:1; transform:translateY(0) translateX(50%) scale(1); }
                    }

                    .stx-ds-grid {
                        display:grid; grid-template-columns:1fr 1fr;
                        gap:10px; margin-top:15px;
                    }
                    .stx-ds-item {
                        display:flex; align-items:center; gap:10px;
                        padding:12px; border-radius:18px;
                        cursor:pointer; transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        border:1px solid transparent;
                        font-family:'Tajawal',sans-serif;
                    }
                    .stx-ds-item:hover {
                        background:rgba(255, 255, 255, 0.05);
                        border-color:rgba(255, 255, 255, 0.1);
                        transform: translateY(-2px);
                    }
                    .stx-ds-item.active {
                        border-color:var(--dept-color, #6366f1);
                        background:color-mix(in srgb, var(--dept-color, #6366f1) 15%, transparent);
                        box-shadow: 0 5px 15px color-mix(in srgb, var(--dept-color, #6366f1) 15%, transparent);
                    }
                    .stx-ds-icon {
                        width:36px; height:36px; border-radius:12px;
                        display:flex; align-items:center; justify-content:center;
                        font-size:16px; flex-shrink:0;
                        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
                    }
                    .stx-ds-info { flex:1; min-width:0; }
                    .stx-ds-name {
                        font-size:12px; font-weight:800;
                        color:#f8fafc; line-height:1.2;
                    }
                    .stx-ds-score {
                        font-size:9px; color:#94a3b8;
                        margin-top:2px; display:flex; align-items:center; gap:4px;
                        font-weight: 700;
                    }
                    .stx-ds-header {
                        font-size:11px; color:#64748b; font-weight:800;
                        text-transform:uppercase; letter-spacing:1px;
                        padding-bottom:12px;
                        border-bottom:1px solid rgba(255,255,255,0.06);
                        display:flex; align-items:center; justify-content:space-between;
                        font-family:'Tajawal',sans-serif;
                    }
                `;
                document.head.appendChild(style);
            }

            // ── بناء الـ HTML ──
            const gridItems = DEPTS_LIST.map(d => {
                const isActive = d.code === currentDept;
                const score = healthScores[d.code];
                let scoreText = score != null ? `${score}%` : 'لم يُقيَّم';
                if (isActive && score == null) scoreText = 'قيد العمل';

                return `
                <div class="stx-ds-item ${isActive ? 'active' : ''}"
                     style="--dept-color:${d.color}"
                     onclick="window.DeptPage.switchDept('${d.code}'); event.stopPropagation();">
                    <div class="stx-ds-icon" style="background:${d.color}18; color:${d.color}">${d.icon}</div>
                    <div class="stx-ds-info">
                        <div class="stx-ds-name">${d.name}</div>
                        <div class="stx-ds-score">${scoreRing(score, isActive)} ${scoreText}</div>
                    </div>
                    ${isActive ? `<i class="bi bi-check-circle-fill" style="color:${d.color};font-size:13px;flex-shrink:0"></i>` : ''}
                </div>`;
            }).join('');

            container.style.position = 'relative';
            container.innerHTML = `
                <button class="stx-ds-trigger" onclick="
                    var p = document.getElementById('${panelId}');
                    var t = this;
                    var isOpen = p.classList.contains('open');
                    document.querySelectorAll('.stx-ds-panel.open').forEach(function(el){ el.classList.remove('open'); });
                    document.querySelectorAll('.stx-ds-trigger.open').forEach(function(el){ el.classList.remove('open'); });
                    if (!isOpen) { p.classList.add('open'); t.classList.add('open'); }
                    event.stopPropagation();
                ">
                    <span style="font-size:16px">${activeDept.icon}</span>
                    <span>${activeDept.name}</span>
                    <i class="bi bi-chevron-down arrow"></i>
                </button>

                <div class="stx-ds-panel" id="${panelId}">
                    <div class="stx-ds-header">
                        <span>اختر الإدارة</span>
                        <span style="background:rgba(99,102,241,0.1);color:#818cf8;padding:2px 8px;border-radius:20px;font-size:10px;">${DEPTS_LIST.length} إدارات</span>
                    </div>
                    <div class="stx-ds-grid">${gridItems}</div>
                </div>
            `;

            // إغلاق البانل عند الضغط خارجه
            if (!window._stxDsOutsideHandlerAdded) {
                window._stxDsOutsideHandlerAdded = true;
                document.addEventListener('click', () => {
                    document.querySelectorAll('.stx-ds-panel.open').forEach(el => el.classList.remove('open'));
                    document.querySelectorAll('.stx-ds-trigger.open').forEach(el => el.classList.remove('open'));
                });
            }
        },

        switchDept(newDept) {
            if (!newDept) return;
            const url = new URL(window.location.href);
            url.searchParams.set('dept', newDept);
            window.location.replace(url.toString());
        },

        // ══════════════════════════════════════════════════════
        // fixNavLinks() — يُصلح كل روابط التنقل تلقائياً
        // يضيف ?dept=X لأي رابط في تسلسل التخطيط لا يحمل dept
        // استدعِها مرة واحدة في init() لكل صفحة تخطيط
        // ══════════════════════════════════════════════════════
        fixNavLinks() {
            const dept = this.dept
                || new URLSearchParams(window.location.search).get('dept')
                || 'hr';
            if (!dept) return;

            // صفحات تسلسل التخطيط — هذه هي التي تحتاج ?dept=
            const PLANNING_PAGES = [
                'pestel', 'swot', 'tows', 'scenarios', 'directions',
                'objectives', 'okrs', 'kpis', 'initiatives',
                'projects', 'reviews', 'reports',
                'dept-health', 'dept-dashboard', 'dept-report',
                'hr-deep', 'finance-deep', 'sales-deep',
                'marketing-deep', 'operations-deep', 'compliance-deep',
                'it-deep', 'support-deep', 'governance-deep', 'quality-deep'
            ];

            const pattern = new RegExp(
                '^\\/(' + PLANNING_PAGES.join('|').replace(/-/g, '[-]') + ')(\\.html)?(\\?|$)',
                'i'
            );

            document.querySelectorAll('a[href]').forEach(a => {
                const href = a.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('javascript')) return;

                try {
                    const u = new URL(href, window.location.origin);
                    const path = u.pathname;

                    // هل الرابط يؤدي لصفحة تخطيط؟
                    if (!pattern.test(path)) return;

                    // هل يحمل dept بالفعل؟
                    if (u.searchParams.has('dept')) return;

                    // أضف dept
                    u.searchParams.set('dept', dept);
                    a.setAttribute('href', u.pathname + '?' + u.searchParams.toString());
                } catch (e) { }
            });

            // أيضاً: أصلح history.back() في أزرار الرجوع التي تعتمد عليه
            // عبر استبدالها بـ href صريح عند وجود referrer مناسب
            if (document.referrer) {
                try {
                    const ref = new URL(document.referrer);
                    if (pattern.test(ref.pathname)) {
                        if (!ref.searchParams.has('dept')) {
                            ref.searchParams.set('dept', dept);
                        }
                        // أحدّث أزرار history.back الصريحة إذا وُجدت
                        document.querySelectorAll('[onclick*="history.back"]').forEach(btn => {
                            btn.removeAttribute('onclick');
                            btn.setAttribute('href', ref.pathname + '?' + ref.searchParams.toString());
                            btn.tagName !== 'A' && btn.addEventListener('click', () => {
                                window.location.href = ref.pathname + '?' + ref.searchParams.toString();
                            });
                        });
                    }
                } catch (e) { }
            }
        }
    };
})();
