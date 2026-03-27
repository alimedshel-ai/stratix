/**
 * Stratix — Smart Guide Card (بطاقة الإرشاد الذكي)
 * يكشف حالة المستخدم تلقائياً ويوجّهه للخطوة التالية
 * يُستخدم في: dashboard.html, ceo-dashboard.html, board-dashboard.html
 *
 * الاستخدام:
 *   <div id="smartGuideCard"></div>
 *   <script src="/assets/js/smart-guide.js"></script>
 *   <script>SmartGuide.render('smartGuideCard', 'owner');</script>
 *   // dashboardType: 'owner' | 'ceo' | 'board' | 'dept'
 */
window.SmartGuide = (function () {

    function render(containerId, dashboardType) {
        const card = document.getElementById(containerId);
        if (!card) return;

        // === قراءة حالة البيانات ===
        let hasEntity = false, hasDiagnostic = false, hasObjectives = false, hasKPIs = false;
        let hasSWOT = false, hasDirections = false, hasInitiatives = false, hasInternalEnv = false;
        let userCategory = '', patternKey = '', userName = '', companyLevel = '';
        let pendingDepts = [], completedDepts = [];
        let diagRole = '';

        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            userName = u.name || '';
            hasEntity = !!(u.entity && u.entity.id);
            userCategory = u.userCategory || '';
        } catch (e) { }

        try {
            const pa = window.Context ? Context.getItem('pain_ambition', {}) : JSON.parse(localStorage.getItem('painAmbition') || '{}');
            patternKey = pa.patternKey || '';
            hasDiagnostic = !!patternKey;

            // التأكد من جلب الأبعاد في حال عدم مرور المستخدم بصفحة الألم والطموح
            const dp = window.Context ? Context.getItem('diagnostic_payload', {}) : JSON.parse(localStorage.getItem('stratix_diagnostic_payload') || sessionStorage.getItem('diagnosticResult') || localStorage.getItem('diagnosticData') || '{}');
            if (!hasDiagnostic && (dp.dimensions || dp.radarData || dp.answers)) {
                hasDiagnostic = true;
            }
        } catch (e) { }

        try {
            const dp = window.Context ? Context.getItem('diagnostic_payload', {}) : JSON.parse(localStorage.getItem('stratix_diagnostic_payload') || '{}');
            diagRole = dp.role || '';
        } catch (e) { }

        companyLevel = localStorage.getItem('_sidebarCompanyLevel') || 'MEDIUM';

        // فحص الأدوات المكتملة
        try { hasObjectives = window.Context ? Context.getItem('objectives', []).length > 0 : JSON.parse(localStorage.getItem('stratix_objectives') || localStorage.getItem('objectives') || '[]').length > 0; } catch (e) { }
        try { hasKPIs = window.Context ? Context.getItem('kpis', []).length > 0 : JSON.parse(localStorage.getItem('stratix_kpis') || localStorage.getItem('kpis') || '[]').length > 0; } catch (e) { }
        try {
            const sw = window.Context ? Context.getItem('swot_data', {}) : JSON.parse(localStorage.getItem('stratix_swot_data') || localStorage.getItem('swotData') || localStorage.getItem('swot') || '{}');
            hasSWOT = !!(sw.strengths && sw.strengths.length > 0);
        } catch (e) { }
        try {
            let dirs = window.Context ? Context.getItem('directions', []) : JSON.parse(localStorage.getItem('stratix_directions') || localStorage.getItem('directions') || '[]');
            let identity = window.Context ? Context.getItem('identity_payload', null) : JSON.parse(localStorage.getItem('stratix_identity_payload') || 'null');
            hasDirections = dirs.length > 0 || !!identity;
        } catch (e) { }
        try { hasInitiatives = window.Context ? Context.getItem('initiatives', []).length > 0 : JSON.parse(localStorage.getItem('stratix_initiatives') || localStorage.getItem('initiatives') || '[]').length > 0; } catch (e) { }
        try {
            const ie = window.Context ? Context.getItem('internal_env', null) : (localStorage.getItem('internalEnvData') || localStorage.getItem('internal_env'));
            hasInternalEnv = !!ie;
        } catch (e) { }

        // فحص الإدارات المكتملة والمعلّقة
        const ALL_DEPTS = [
            { key: 'compliance', label: 'الامتثال والحوكمة', icon: '🛡️' },
            { key: 'finance', label: 'المالية', icon: '💰' },
            { key: 'hr', label: 'الموارد البشرية', icon: '👥' },
            { key: 'sales', label: 'المبيعات', icon: '📈' },
            { key: 'marketing', label: 'التسويق', icon: '📢' },
            { key: 'operations', label: 'العمليات', icon: '⚙️' },
            { key: 'support', label: 'الخدمات المساندة', icon: '🛠️' },
        ];
        try {
            const deptData = window.Context ? Context.getItem('dept_deep_payload', {}) : JSON.parse(localStorage.getItem('stratix_dept_deep_payload') || '{}');
            ALL_DEPTS.forEach(function (d) {
                if (deptData[d.key] && deptData[d.key].completed === true) {
                    completedDepts.push(d);
                } else {
                    pendingDepts.push(d);
                }
            });
        } catch (e) {
            pendingDepts = ALL_DEPTS.slice();
        }

        // === تحديد المرحلة والتوصيات ===
        var guideHTML = '';

        // ═══ المستثمر / عضو المجلس — رسائل خاصة ═══
        if (dashboardType === 'board') {
            // تحديد هل مستثمر أو عضو مجلس
            var isInvestor = (diagRole === 'investor')
                || (userCategory && (userCategory.indexOf('INVESTOR') !== -1));

            if (!hasObjectives && !hasSWOT && !hasInternalEnv && completedDepts.length === 0) {
                guideHTML = _buildBoardWaiting(pendingDepts, isInvestor);
            } else if (pendingDepts.length > 3) {
                guideHTML = _buildBoardPartial(completedDepts, pendingDepts, ALL_DEPTS, isInvestor);
            } else if (hasObjectives && hasKPIs) {
                guideHTML = _buildBoardReady(isInvestor);
            } else if (completedDepts.length > 0) {
                guideHTML = _buildBoardPartial(completedDepts, pendingDepts, ALL_DEPTS, isInvestor);
            } else {
                guideHTML = _buildBoardWaiting(pendingDepts, isInvestor);
            }
        }
        // ═══ CEO — رسائل تنفيذية ═══
        else if (dashboardType === 'ceo') {
            if (!hasEntity && !hasDiagnostic) {
                guideHTML = _buildSetup();
            } else if (hasDiagnostic && !hasInternalEnv && !hasSWOT) {
                guideHTML = _buildDiagnosis(patternKey);
            } else if (hasSWOT && !hasDirections && !hasObjectives) {
                guideHTML = _buildPlanning();
            } else if (hasObjectives && pendingDepts.length > 0) {
                guideHTML = _buildPendingDepts(pendingDepts, completedDepts, ALL_DEPTS);
            } else if (hasObjectives && hasKPIs && hasInitiatives) {
                guideHTML = _buildComplete();
            }
        }
        // ═══ مدراء الإدارات (Department Managers) ═══
        else if (dashboardType === 'dept') {
            let myDeptKey = '';
            if (userCategory && userCategory.startsWith('DEPT_')) {
                myDeptKey = userCategory.replace('DEPT_', '').toLowerCase();
            }

            let isDeptCompleted = false;
            try {
                const deptData = window.Context ? Context.getItem('dept_deep_payload', {}) : JSON.parse(localStorage.getItem('stratix_dept_deep_payload') || '{}');
                if (myDeptKey && deptData[myDeptKey] && deptData[myDeptKey].completed) {
                    isDeptCompleted = true;
                }
            } catch (e) { }

            if (!isDeptCompleted) {
                guideHTML = _buildDeptPendingGuide(myDeptKey);
            } else if (!hasKPIs) {
                guideHTML = _buildDeptKPIsGuide();
            } else {
                guideHTML = _buildDeptCompleteGuide();
            }
        }
        // ═══ Owner / Default ═══
        else {
            if (!hasEntity && !hasDiagnostic) {
                guideHTML = _buildSetup();
            } else if (hasDiagnostic && !hasInternalEnv && !hasSWOT) {
                guideHTML = _buildDiagnosis(patternKey);
            } else if (hasDiagnostic && completedDepts.length < 3 && !hasSWOT) {
                // ═══ بوابة الإدارات: لازم 3 إدارات قبل SWOT ═══
                guideHTML = _buildDeptGate(completedDepts, pendingDepts, ALL_DEPTS);
            } else if (hasSWOT && !hasDirections && !hasObjectives) {
                guideHTML = _buildPlanning();
            } else if (hasObjectives && pendingDepts.length > 0) {
                guideHTML = _buildPendingDepts(pendingDepts, completedDepts, ALL_DEPTS);
            } else if (hasObjectives && hasKPIs && hasInitiatives) {
                guideHTML = _buildComplete();
            }
        }

        if (guideHTML) {
            card.innerHTML = guideHTML;
            card.style.display = 'block';
        }
    }

    // ═══════════════════════════════════════
    // بطاقات المراحل
    // ═══════════════════════════════════════

    function _buildSetup() {
        return '<div style="background:linear-gradient(135deg, #667eea15, #764ba215); border:1px solid #667eea30; border-radius:20px; padding:28px 24px; position:relative; overflow:hidden;">'
            + '<div style="position:absolute;top:-20px;left:-20px;width:120px;height:120px;background:radial-gradient(circle,#667eea15,transparent);border-radius:50%;"></div>'
            + '<div style="display:flex; gap:20px; align-items:flex-start;">'
            + '<div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;box-shadow:0 4px 15px rgba(102,126,234,0.3);">🚀</div>'
            + '<div style="flex:1;">'
            + '<h3 style="font-size:16px;font-weight:800;color:#1e293b;margin:0 0 6px;">ابدأ رحلتك الاستراتيجية</h3>'
            + '<p style="font-size:13px;color:#64748b;margin:0 0 16px;line-height:1.7;">المنصة جاهزة لخدمتك — ابدأ بالتشخيص لتحصل على خطة عمل مخصصة لوضع شركتك</p>'
            + '<div style="display:flex;gap:10px;flex-wrap:wrap;">'
            + '<a href="/select-type" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:10px 20px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;box-shadow:0 4px 12px rgba(102,126,234,0.3);"><i class="bi bi-play-circle-fill"></i> ابدأ التشخيص الآن</a>'
            + '<a href="/onboarding.html" style="display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;color:#64748b;padding:10px 20px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600;"><i class="bi bi-building"></i> إعداد المنشأة أولاً</a>'
            + '</div></div></div></div>';
    }

    function _buildDiagnosis(patternKey) {
        var pathName = 'المسار الذكي';
        try {
            if (typeof PathEngine !== 'undefined' && PathEngine.PATH_DEFINITIONS && PathEngine.PATH_DEFINITIONS[patternKey]) {
                var pd = PathEngine.PATH_DEFINITIONS[patternKey];
                pathName = (pd.emoji || '') + ' ' + pd.name;
            }
        } catch (e) { }

        return '<div style="background:linear-gradient(135deg, #10b98115, #22c55e15); border:1px solid #10b98130; border-radius:20px; padding:28px 24px;">'
            + '<div style="display:flex; gap:20px; align-items:flex-start;">'
            + '<div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#10b981,#22c55e);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;box-shadow:0 4px 15px rgba(16,185,129,0.3);">🔍</div>'
            + '<div style="flex:1;">'
            + '<h3 style="font-size:16px;font-weight:800;color:#1e293b;margin:0 0 4px;">أكمل التشخيص — ' + pathName + '</h3>'
            + '<p style="font-size:13px;color:#64748b;margin:0 0 16px;line-height:1.7;">الخطوة القادمة: حلل البيئة الداخلية لشركتك لتحصل على صورة واضحة عن نقاط القوة والضعف</p>'
            + '<div style="display:flex;gap:10px;flex-wrap:wrap;">'
            + '<a href="/company-health.html" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#10b981,#22c55e);color:white;padding:10px 20px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;box-shadow:0 4px 12px rgba(16,185,129,0.3);"><i class="bi bi-heart-pulse"></i> صحة الشركة الشاملة</a>'
            + '</div></div></div></div>';
    }

    function _buildPlanning() {
        return '<div style="background:linear-gradient(135deg, #f59e0b15, #facc1515); border:1px solid #f59e0b30; border-radius:20px; padding:28px 24px;">'
            + '<div style="display:flex; gap:20px; align-items:flex-start;">'
            + '<div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#f59e0b,#dc2626);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;box-shadow:0 4px 15px rgba(245,158,11,0.3);">🎯</div>'
            + '<div style="flex:1;">'
            + '<h3 style="font-size:16px;font-weight:800;color:#1e293b;margin:0 0 4px;">حدد توجهاتك الاستراتيجية</h3>'
            + '<p style="font-size:13px;color:#64748b;margin:0 0 16px;line-height:1.7;">التشخيص مكتمل ✅ — الآن حدد الاتجاه الاستراتيجي وضع أهدافك</p>'
            + '<div style="display:flex;gap:10px;flex-wrap:wrap;">'
            + '<a href="/directions.html" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#f59e0b,#dc2626);color:white;padding:10px 20px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;"><i class="bi bi-compass-fill"></i> التوجهات الاستراتيجية</a>'
            + '<a href="/objectives.html" style="display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;color:#64748b;padding:10px 20px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600;"><i class="bi bi-bullseye"></i> الأهداف</a>'
            + '</div></div></div></div>';
    }

    function _buildPendingDepts(pendingDepts, completedDepts, allDepts) {
        var pendingHTML = '';
        var maxShow = Math.min(pendingDepts.length, 4);
        for (var i = 0; i < maxShow; i++) {
            var d = pendingDepts[i];
            pendingHTML += '<div style="display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #fed7aa;padding:8px 14px;border-radius:10px;font-size:12px;">'
                + '<span style="font-size:16px">' + d.icon + '</span>'
                + '<span style="color:#92400e;font-weight:600;">' + d.label + '</span>'
                + '<span style="margin-right:auto;color:#f59e0b;font-size:10px;font-weight:700;">⏳ بانتظار البيانات</span>'
                + '</div>';
        }
        var completedHTML = completedDepts.length > 0
            ? '<div style="margin-top:8px;font-size:11px;color:#16a34a;">✅ ' + completedDepts.length + ' إدارة مكتملة من أصل ' + allDepts.length + '</div>' : '';

        var firstDept = pendingDepts.length > 0 ? pendingDepts[0].key : 'compliance';

        return '<div style="background:linear-gradient(135deg, #fef3c715, #fff7ed); border:1px solid #fed7aa; border-radius:20px; padding:28px 24px;">'
            + '<div style="display:flex; gap:20px; align-items:flex-start;">'
            + '<div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#f59e0b,#ea580c);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;box-shadow:0 4px 15px rgba(245,158,11,0.3);">📂</div>'
            + '<div style="flex:1;">'
            + '<h3 style="font-size:16px;font-weight:800;color:#1e293b;margin:0 0 4px;">بانتظار بيانات الإدارات</h3>'
            + '<p style="font-size:13px;color:#64748b;margin:0 0 12px;line-height:1.7;">هذه الإدارات لم تكتمل بياناتها بعد — طلب البيانات من المديرين سيُفعّل التحليل الكامل</p>'
            + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-bottom:12px;">'
            + pendingHTML + '</div>' + completedHTML
            + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">'
            + '<a href="/dept-deep.html?dept=' + firstDept + '" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#f59e0b,#ea580c);color:white;padding:10px 20px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;"><i class="bi bi-pencil-square"></i> أدخل بيانات الإدارات</a>'
            + '<a href="/team.html" style="display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;color:#64748b;padding:10px 20px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600;"><i class="bi bi-person-plus"></i> أضف مدراء الإدارات</a>'
            + '</div></div></div></div>';
    }

    /**
     * بوابة الإدارات — تظهر عندما المالك أكمل التشخيص لكن ما فحص 3 إدارات بعد
     */
    function _buildDeptGate(completedDepts, pendingDepts, allDepts) {
        var minRequired = 3;
        var completed = completedDepts.length;
        var pct = Math.round((completed / minRequired) * 100);

        // شارات الإدارات المكتملة
        var completedBadges = '';
        for (var i = 0; i < completedDepts.length; i++) {
            completedBadges += '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(34,197,94,0.12);color:#22c55e;padding:4px 10px;border-radius:8px;font-size:11px;font-weight:600;">' + completedDepts[i].icon + ' ' + completedDepts[i].label + ' ✅</span> ';
        }

        // أول إدارة لم تكتمل
        var nextDept = pendingDepts.length > 0 ? pendingDepts[0] : { key: 'compliance', label: 'الامتثال', icon: '🛡️' };
        var remaining = minRequired - completed;

        return '<div style="background:linear-gradient(135deg, rgba(245,158,11,0.06), rgba(234,88,12,0.04)); border:1px solid rgba(245,158,11,0.2); border-radius:20px; padding:28px 24px; position:relative; overflow:hidden;">'
            + '<div style="position:absolute;top:-30px;left:-30px;width:140px;height:140px;background:radial-gradient(circle,rgba(245,158,11,0.08),transparent);border-radius:50%;"></div>'
            + '<div style="display:flex; gap:20px; align-items:flex-start;">'
            // حلقة التقدم
            + '<div style="width:56px;height:56px;border-radius:50%;background:conic-gradient(#f59e0b ' + Math.round((completed / minRequired) * 360) + 'deg, rgba(255,255,255,0.08) 0deg);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 15px rgba(245,158,11,0.2);">'
            + '<div style="width:42px;height:42px;border-radius:50%;background:var(--bg-card,#1a1d2e);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#f59e0b;">' + completed + '/' + minRequired + '</div>'
            + '</div>'
            + '<div style="flex:1;">'
            + '<h3 style="font-size:16px;font-weight:800;color:var(--text,#e2e8f0);margin:0 0 4px;">🔒 أكمل فحص الإدارات لفتح SWOT</h3>'
            + '<p style="font-size:13px;color:var(--text-muted,#94a3b8);margin:0 0 12px;line-height:1.8;">التشخيص الأولي مكتمل ✅ — لكن تحليل SWOT يحتاج بيانات <strong style="color:#f59e0b">' + minRequired + ' إدارات</strong> على الأقل. متبقي <strong style="color:#ef4444">' + remaining + '</strong> ' + (remaining === 1 ? 'إدارة' : 'إدارات') + '.</p>'
            + (completedBadges ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">' + completedBadges + '</div>' : '')
            + '<div style="display:flex;gap:10px;flex-wrap:wrap;">'
            + '<a href="/dept-deep.html?dept=' + nextDept.key + '" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#f59e0b,#ea580c);color:white;padding:12px 22px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;box-shadow:0 4px 12px rgba(245,158,11,0.3);"><i class="bi bi-building-fill-gear"></i> افحص ' + nextDept.label + ' ' + nextDept.icon + '</a>'
            + '<a href="/dept-deep.html" style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.06);color:var(--text-muted,#94a3b8);padding:12px 22px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600;border:1px solid rgba(255,255,255,0.08);"><i class="bi bi-list-columns-reverse"></i> اختر إدارة أخرى</a>'
            + '</div></div></div></div>';
    }

    function _buildComplete() {
        return '<div style="background:linear-gradient(135deg, #22c55e10, #10b98110); border:1px solid #22c55e30; border-radius:20px; padding:20px 24px;">'
            + '<div style="display:flex; gap:16px; align-items:center;">'
            + '<div style="font-size:32px;">🎉</div>'
            + '<div style="flex:1;">'
            + '<h3 style="font-size:14px;font-weight:800;color:#16a34a;margin:0 0 2px;">ممتاز! خطتك الاستراتيجية جاهزة</h3>'
            + '<p style="font-size:12px;color:#64748b;margin:0;">تابع المؤشرات وراجع الأداء من التقارير الذكية</p>'
            + '</div>'
            + '<a href="/auto-reports.html" style="display:inline-flex;align-items:center;gap:6px;background:#22c55e;color:white;padding:8px 16px;border-radius:10px;text-decoration:none;font-size:12px;font-weight:700;"><i class="bi bi-file-earmark-bar-graph"></i> التقارير</a>'
            + '</div></div>';
    }

    // ═══ بطاقات خاصة بالمستثمر / المجلس ═══

    function _buildBoardWaiting(pendingDepts, isInvestor) {
        var deptList = '';
        var maxShow = Math.min(pendingDepts.length, 6);
        for (var i = 0; i < maxShow; i++) {
            deptList += '<div style="display:flex;align-items:center;gap:6px;background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.15);padding:6px 12px;border-radius:8px;font-size:11px;">'
                + '<span style="font-size:14px">' + pendingDepts[i].icon + '</span>'
                + '<span style="color:#7c3aed;font-weight:600;">' + pendingDepts[i].label + '</span>'
                + '<span style="margin-right:auto;color:#a78bfa;font-size:9px;font-weight:700;">⏳ قيد التجهيز</span>'
                + '</div>';
        }

        // رسالة مخصصة حسب النوع
        var title = isInvestor
            ? 'وضع المراقبة — بانتظار بيانات الشركة'
            : 'وضع المراقبة — بانتظار بيانات الفريق';
        var desc = isInvestor
            ? 'البيانات الاستراتيجية تُعبّأ من قبل فريق الشركة — لست بحاجة لإدخال أي بيانات بنفسك.'
            + '<br><span style="color:#a78bfa;font-weight:600;">كيف تعمل؟</span> صاحب الشركة ومدراء الإدارات يُجرون التقييم عبر أدوات التشخيص، والنتائج تظهر لك تلقائياً هنا.'
            : 'البيانات الاستراتيجية تُعبّأ من قبل فريق الإدارة التنفيذية — ستظهر لك التقارير والمؤشرات فور اكتمالها.'
            + '<br><span style="color:#a78bfa;font-weight:600;">كيف تعمل؟</span> المالك يُعيّن مدراء الإدارات ← كل مدير يعبّئ بيانات إدارته ← النتائج تظهر لك للمراقبة.';

        var iconEmoji = isInvestor ? '📊' : '👁️';

        return '<div style="background:linear-gradient(135deg, #a78bfa10, #667eea10); border:1px solid #a78bfa25; border-radius:20px; padding:28px 24px;">'
            + '<div style="display:flex; gap:20px; align-items:flex-start;">'
            + '<div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#a78bfa,#667eea);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;box-shadow:0 4px 15px rgba(167,139,250,0.3);">' + iconEmoji + '</div>'
            + '<div style="flex:1;">'
            + '<h3 style="font-size:16px;font-weight:800;color:#e2e8f0;margin:0 0 4px;">' + title + '</h3>'
            + '<p style="font-size:13px;color:#94a3b8;margin:0 0 12px;line-height:1.8;">' + desc + '</p>'
            + '<div style="background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.12);border-radius:12px;padding:14px 16px;margin-bottom:14px;">'
            + '<div style="font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:10px;">📍 تدفّق البيانات في النظام:</div>'
            + '<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#94a3b8;flex-wrap:wrap;">'
            + '<span style="background:rgba(16,185,129,0.12);color:#10b981;padding:4px 10px;border-radius:6px;font-weight:600;">👤 صاحب المشروع</span>'
            + '<span>→</span>'
            + '<span style="background:rgba(59,130,246,0.12);color:#3b82f6;padding:4px 10px;border-radius:6px;font-weight:600;">📋 تشخيص + تقييم إدارات</span>'
            + '<span>→</span>'
            + '<span style="background:rgba(167,139,250,0.12);color:#a78bfa;padding:4px 10px;border-radius:6px;font-weight:600;">' + (isInvestor ? '📊 تظهر لك هنا' : '📋 تظهر لك هنا') + '</span>'
            + '</div></div>'
            + '<div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:8px;">الإدارات المنتظرة:</div>'
            + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;margin-bottom:12px;">'
            + deptList + '</div>'
            + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">'
            + '<a href="/auto-reports.html" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#a78bfa,#667eea);color:white;padding:10px 20px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;"><i class="bi bi-file-earmark-bar-graph"></i> عرض التقارير المتاحة</a>'
            + '<a href="/intelligence.html" style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.06);color:#94a3b8;padding:10px 20px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600;border:1px solid rgba(255,255,255,0.08);"><i class="bi bi-robot"></i> الذكاء الاستراتيجي</a>'
            + '</div></div></div></div>';
    }

    function _buildBoardPartial(completedDepts, pendingDepts, allDepts, isInvestor) {
        var pct = Math.round((completedDepts.length / allDepts.length) * 100);
        var title = isInvestor
            ? 'بيانات الشركة تُجمع — ' + completedDepts.length + ' من ' + allDepts.length + ' إدارات مكتملة'
            : 'فريق الإدارة يعمل — ' + completedDepts.length + ' من ' + allDepts.length + ' إدارات مكتملة';
        var desc = isInvestor
            ? 'فريق الشركة يعبّئ البيانات حالياً — بقي ' + pendingDepts.length + ' إدارات. المؤشرات المعروضة تعكس البيانات المتاحة.'
            : 'مدراء الإدارات يُدخلون بياناتهم — بقي ' + pendingDepts.length + ' إدارات. لوحتك تتحدّث تلقائياً مع كل إدارة جديدة.';

        // قائمة المكتملة والمعلّقة
        var completedHTML = '';
        for (var i = 0; i < completedDepts.length; i++) {
            completedHTML += '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(16,185,129,0.1);color:#10b981;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;">' + completedDepts[i].icon + ' ' + completedDepts[i].label + ' ✅</span> ';
        }
        var pendingHTML = '';
        for (var j = 0; j < pendingDepts.length; j++) {
            pendingHTML += '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(245,158,11,0.1);color:#f59e0b;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;">' + pendingDepts[j].icon + ' ' + pendingDepts[j].label + ' ⏳</span> ';
        }

        return '<div style="background:linear-gradient(135deg, rgba(245,158,11,0.04), rgba(255,247,237,0.02)); border:1px solid rgba(245,158,11,0.15); border-radius:20px; padding:24px;">'
            + '<div style="display:flex; gap:16px; align-items:flex-start;">'
            + '<div style="width:48px;height:48px;border-radius:50%;background:conic-gradient(#22c55e ' + Math.round((completedDepts.length / allDepts.length) * 360) + 'deg, rgba(255,255,255,0.08) 0deg);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
            + '<div style="width:36px;height:36px;border-radius:50%;background:var(--bg-card);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#e2e8f0;">' + pct + '%</div>'
            + '</div>'
            + '<div style="flex:1;">'
            + '<h3 style="font-size:14px;font-weight:800;color:#e2e8f0;margin:0 0 4px;">' + title + '</h3>'
            + '<p style="font-size:12px;color:#94a3b8;margin:0 0 10px;line-height:1.7;">' + desc + '</p>'
            + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px;">' + completedHTML + pendingHTML + '</div>'
            + '</div>'
            + '</div></div>';
    }

    function _buildBoardReady(isInvestor) {
        var title = isInvestor
            ? 'البيانات مكتملة — لوحة المراقبة جاهزة'
            : 'اللوحة جاهزة — جميع الإدارات مكتملة';
        var desc = isInvestor
            ? 'جميع بيانات الشركة متاحة — راجع المؤشرات والرادار والتنبيهات وأصدر التقارير'
            : 'فريق الإدارة أتمّ جميع التقييمات — جميع المؤشرات والتقارير متاحة لك';

        return '<div style="background:linear-gradient(135deg, rgba(34,197,94,0.06), rgba(16,185,129,0.04)); border:1px solid rgba(34,197,94,0.2); border-radius:20px; padding:20px 24px;">'
            + '<div style="display:flex; gap:16px; align-items:center;">'
            + '<div style="font-size:32px;">✅</div>'
            + '<div style="flex:1;">'
            + '<h3 style="font-size:14px;font-weight:800;color:#10b981;margin:0 0 2px;">' + title + '</h3>'
            + '<p style="font-size:12px;color:#94a3b8;margin:0;">' + desc + '</p>'
            + '</div>'
            + '<a href="/ai-presentation.html" style="display:inline-flex;align-items:center;gap:6px;background:#22c55e;color:white;padding:8px 16px;border-radius:10px;text-decoration:none;font-size:12px;font-weight:700;"><i class="bi bi-easel3-fill"></i> العرض التقديمي</a>'
            + '</div></div>';
    }

    function _buildDeptPendingGuide(deptKey) {
        var href = deptKey ? '/dept-deep.html?dept=' + deptKey : '/dept-deep.html';
        return '<div style="background:linear-gradient(135deg, #3b82f615, #2563eb15); border:1px solid #3b82f630; border-radius:20px; padding:28px 24px;">'
            + '<div style="display:flex; gap:20px; align-items:flex-start;">'
            + '<div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;box-shadow:0 4px 15px rgba(59,130,246,0.3);">📋</div>'
            + '<div style="flex:1;">'
            + '<h3 style="font-size:16px;font-weight:800;color:#1e293b;margin:0 0 4px;">مرحباً بك في لوحة إدارتك</h3>'
            + '<p style="font-size:13px;color:#64748b;margin:0 0 16px;line-height:1.7;">يرجى إكمال التقييم الخاص بإدارتك لتشخيص البيئة الداخلية ورفع التقارير للإدارة العليا.</p>'
            + '<div style="display:flex;gap:10px;flex-wrap:wrap;">'
            + '<a href="' + href + '" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;padding:10px 20px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;"><i class="bi bi-ui-checks"></i> إكمال التقييم الآن</a>'
            + '</div></div></div></div>';
    }

    function _buildDeptKPIsGuide() {
        return '<div style="background:linear-gradient(135deg, #f59e0b15, #facc1515); border:1px solid #f59e0b30; border-radius:20px; padding:28px 24px;">'
            + '<div style="display:flex; gap:20px; align-items:flex-start;">'
            + '<div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#f59e0b,#dc2626);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;box-shadow:0 4px 15px rgba(245,158,11,0.3);">🎯</div>'
            + '<div style="flex:1;">'
            + '<h3 style="font-size:16px;font-weight:800;color:#1e293b;margin:0 0 4px;">تقييم الإدارة مكتمل ✅</h3>'
            + '<p style="font-size:13px;color:#64748b;margin:0 0 16px;line-height:1.7;">الخطوة التالية هي تحديد وتحديث مؤشرات الأداء (KPIs) الخاصة بإدارتك لمتابعة تقدمها.</p>'
            + '<div style="display:flex;gap:10px;flex-wrap:wrap;">'
            + '<a href="/kpis.html" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#f59e0b,#dc2626);color:white;padding:10px 20px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;"><i class="bi bi-graph-up-arrow"></i> إضافة وتحديث المؤشرات</a>'
            + '</div></div></div></div>';
    }

    function _buildDeptCompleteGuide() {
        return '<div style="background:linear-gradient(135deg, #22c55e10, #10b98110); border:1px solid #22c55e30; border-radius:20px; padding:20px 24px;">'
            + '<div style="display:flex; gap:16px; align-items:center;">'
            + '<div style="font-size:32px;">🌟</div>'
            + '<div style="flex:1;">'
            + '<h3 style="font-size:14px;font-weight:800;color:#16a34a;margin:0 0 2px;">إدارتك على المسار الصحيح</h3>'
            + '<p style="font-size:12px;color:#64748b;margin:0;">تم إكمال التقييم والمؤشرات. يمكنك الآن متابعة المبادرات والمشاريع الخاصة بفريقك.</p>'
            + '</div>'
            + '<a href="/initiatives.html" style="display:inline-flex;align-items:center;gap:6px;background:#22c55e;color:white;padding:8px 16px;border-radius:10px;text-decoration:none;font-size:12px;font-weight:700;"><i class="bi bi-rocket"></i> متابعة المبادرات</a>'
            + '</div></div></div></div>';
    }

    return { render: render };
})();
