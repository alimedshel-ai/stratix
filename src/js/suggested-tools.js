/**
 * Startix — Suggested Tools Engine
 * يقترح 2-3 أدوات ذكية حسب مرحلة المستخدم والتقدم الحالي
 * 
 * المنطق:
 *   1. يحدد المرحلة الحالية من progressData
 *   2. يكتشف الأدوات المكتملة/الناقصة
 *   3. يقترح الخطوة التالية المنطقية
 *   4. يعرض في السايدبار قسم "🛠️ أدواتي المقترحة"
 */
(function () {
  'use strict';

  // ====================================================================
  //  TOOL DEFINITIONS — كل الأدوات مع ربطها بالمراحل والشروط
  // ====================================================================
  const ALL_TOOLS = [
    // ── تشخيصي (بالترتيب المنهجي: خارج → داخل → تركيب) ──
    { id: 'pestel', name: 'تحليل PESTEL', emoji: '🌍', href: '/tool-detail.html?code=PESTEL', phase: 'DIAGNOSIS', order: 1, checkKey: 'pestel' },
    { id: 'porter', name: 'قوى بورتر الخمس', emoji: '⚔️', href: '/tool-detail.html?code=PORTER', phase: 'DIAGNOSIS', order: 2, checkKey: 'porter' },
    { id: 'vchain', name: 'سلسلة القيمة', emoji: '🔗', href: '/tool-detail.html?code=VALUE_CHAIN', phase: 'DIAGNOSIS', order: 3, checkKey: 'vchain' },
    { id: 'vrio', name: 'تحليل VRIO', emoji: '💎', href: '/tool-detail.html?code=VRIO', phase: 'DIAGNOSIS', order: 4, checkKey: 'vrio' },
    { id: 'core', name: 'القدرات الجوهرية', emoji: '🏆', href: '/tool-detail.html?code=CORE_COMPETENCY', phase: 'DIAGNOSIS', order: 5, checkKey: 'core' },
    { id: 'swot', name: 'تحليل SWOT', emoji: '📊', href: '/swot.html', phase: 'DIAGNOSIS', order: 6, checkKey: 'swot' },
    { id: 'journey', name: 'رحلة العميل', emoji: '👥', href: '/tool-detail.html?code=CUSTOMER_JOURNEY', phase: 'DIAGNOSIS', order: 7, checkKey: 'journey' },
    { id: 'gap', name: 'تحليل الفجوات', emoji: '📉', href: '/gap-analysis.html', phase: 'DIAGNOSIS', order: 8, checkKey: 'gap' },
    { id: 'bench', name: 'المقارنة المعيارية', emoji: '📊', href: '/benchmarking.html', phase: 'DIAGNOSIS', order: 9, checkKey: 'bench' },

    // ── خياراتي وخطتي ──
    { id: 'tows', name: 'مصفوفة TOWS', emoji: '🎯', href: '/tows.html', phase: 'PLANNING', order: 1, checkKey: 'tows' },
    { id: 'directions', name: 'التوجهات الاستراتيجية', emoji: '🧭', href: '/directions.html', phase: 'PLANNING', order: 2, checkKey: 'directions' },
    { id: 'objectives', name: 'الأهداف', emoji: '🎯', href: '/objectives.html', phase: 'PLANNING', order: 3, checkKey: 'objectives' },
    { id: 'kpis', name: 'مؤشرات الأداء', emoji: '📈', href: '/kpis.html', phase: 'PLANNING', order: 4, checkKey: 'kpis' },
    { id: 'bmodel', name: 'نموذج الأعمال', emoji: '🏢', href: '/tool-detail.html?code=BUSINESS_MODEL', phase: 'PLANNING', order: 5, checkKey: 'bmodel' },

    // ── تنفيذي ──
    { id: 'initiatives', name: 'المبادرات', emoji: '🚀', href: '/initiatives.html', phase: 'EXECUTION', order: 1, checkKey: 'initiatives' },
    { id: 'eisenhower', name: 'مصفوفة أيزنهاور', emoji: '📐', href: '/tool-detail.html?code=EISENHOWER', phase: 'EXECUTION', order: 2, checkKey: 'eisenhower' },

    // ── متابعتي ──
    { id: 'reviews', name: 'المراجعات الدورية', emoji: '📋', href: '/reviews.html', phase: 'ADAPTATION', order: 1, checkKey: 'reviews' },
    { id: 'pareto', name: 'تحليل باريتو 80/20', emoji: '📊', href: '/tool-detail.html?code=PARETO', phase: 'ADAPTATION', order: 2, checkKey: 'pareto' },

    // ── أدوات عامة متقدمة ──
    { id: 'riskmap', name: 'خريطة المخاطر', emoji: '🛡️', href: '/risk-map.html', phase: 'ADVANCED', order: 1, checkKey: 'riskmap' },
    { id: 'stratmap', name: 'الخريطة الاستراتيجية', emoji: '🗺️', href: '/strategy-map.html', phase: 'ADVANCED', order: 2, checkKey: 'stratmap' },
    { id: 'ogsm', name: 'ملخص OGSM', emoji: '📋', href: '/ogsm.html', phase: 'ADVANCED', order: 3, checkKey: 'ogsm' },
    { id: 'horizons', name: 'الآفاق الثلاثة', emoji: '🔭', href: '/three-horizons.html', phase: 'ADVANCED', order: 4, checkKey: 'horizons' },
    { id: 'stakeholders', name: 'أصحاب المصلحة', emoji: '👥', href: '/stakeholders.html', phase: 'ADVANCED', order: 5, checkKey: 'stakeholders' },
    { id: 'calendar', name: 'التقويم الاستراتيجي', emoji: '📅', href: '/strategic-calendar.html', phase: 'ADVANCED', order: 6, checkKey: 'calendar' },
    { id: 'priority', name: 'مصفوفة الأولويات', emoji: '⚖️', href: '/priority-matrix.html', phase: 'ADVANCED', order: 7, checkKey: 'priority' },
  ];

  // ====================================================================
  //  SUGGESTION RULES — قواعد الاقتراح الذكي (ترتيب: خارج → داخل → تركيب)
  // ====================================================================
  const SUGGESTION_RULES = [
    // المرحلة 0: لم يبدأ بعد — ابدأ بالبيئة الكلية (PESTEL)
    {
      condition: (ctx) => ctx.diagnosisPercent === 0 && ctx.completed.length === 0,
      suggestions: [
        { toolId: 'pestel', reason: 'ابدأ بتحليل البيئة الكلية أولاً' },
        { toolId: 'porter', reason: 'ثم حلل البيئة التنافسية القطاعية' }
      ]
    },
    // أكمل PESTEL → اقترح Porter + داخلي
    {
      condition: (ctx) => ctx.completed.includes('pestel') && !ctx.completed.includes('porter'),
      suggestions: [
        { toolId: 'porter', reason: 'PESTEL جاهز — حلل البيئة التنافسية الآن' },
        { toolId: 'vchain', reason: 'أو انتقل لتحليل سلسلة القيمة الداخلية' }
      ]
    },
    // أكمل PESTEL + Porter → اقترح الداخلي + SWOT
    {
      condition: (ctx) => ctx.completed.includes('pestel') && ctx.completed.includes('porter') && !ctx.completed.includes('swot'),
      suggestions: [
        { toolId: 'vchain', reason: 'حلل سلسلة القيمة الداخلية', skip: ctx => ctx.completed.includes('vchain') },
        { toolId: 'swot', reason: 'اجمع كل شيء في تحليل SWOT' }
      ]
    },
    // أكمل التشخيص → اقترح التخطيط
    {
      condition: (ctx) => ctx.diagnosisPercent >= 60 && !ctx.completed.includes('objectives'),
      suggestions: [
        { toolId: 'tows', reason: 'حوّل تحليلك إلى خيارات استراتيجية', skip: ctx => ctx.completed.includes('tows') },
        { toolId: 'objectives', reason: 'حدد أهدافك الاستراتيجية بناءً على التحليل' }
      ]
    },
    // أكمل الأهداف → اقترح KPIs + مبادرات
    {
      condition: (ctx) => ctx.completed.includes('objectives') && !ctx.completed.includes('kpis'),
      suggestions: [
        { toolId: 'kpis', reason: 'اربط أهدافك بمؤشرات قابلة للقياس' },
        { toolId: 'initiatives', reason: 'حوّل أهدافك إلى مبادرات تنفيذية' }
      ]
    },
    // أكمل KPIs → اقترح المبادرات + المراجعات
    {
      condition: (ctx) => ctx.completed.includes('kpis') && !ctx.completed.includes('initiatives'),
      suggestions: [
        { toolId: 'initiatives', reason: 'ابدأ تنفيذ خطتك بمبادرات محددة' }
      ]
    },
    // في مرحلة التنفيذ → اقترح أدوات المتابعة
    {
      condition: (ctx) => ctx.completed.includes('initiatives') && !ctx.completed.includes('reviews'),
      suggestions: [
        { toolId: 'reviews', reason: 'راجع تقدمك بشكل دوري' },
        { toolId: 'eisenhower', reason: 'رتب أولويات مهامك بذكاء' }
      ]
    },
    // أدوات متقدمة — للمستخدمين المتقدمين
    {
      condition: (ctx) => ctx.diagnosisPercent >= 80 && ctx.planningPercent >= 50,
      suggestions: [
        { toolId: 'riskmap', reason: 'خطتك متقدمة — حدد المخاطر المحتملة', skip: ctx => ctx.completed.includes('riskmap') },
        { toolId: 'stratmap', reason: 'ابنِ خريطة استراتيجية بصرية', skip: ctx => ctx.completed.includes('stratmap') }
      ]
    },
  ];

  // ====================================================================
  //  CONTEXT BUILDER — بناء سياق المستخدم
  // ====================================================================
  function buildContext(progressData) {
    const ctx = {
      hasPainAmbition: !!localStorage.getItem('painAmbition'),
      completed: [],
      diagnosisPercent: 0,
      planningPercent: 0,
      executionPercent: 0,
      adaptationPercent: 0,
      overall: 0,
      userRole: 'VIEWER',
      systemRole: 'USER',
      accountAge: 0, // days
    };

    // User info
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      ctx.userRole = u.role || 'VIEWER';
      ctx.systemRole = u.systemRole || 'USER';
      if (u.createdAt) {
        ctx.accountAge = Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      }
    } catch (e) { /* silent */ }

    // Progress data
    if (progressData) {
      ctx.overall = progressData.overall || 0;
      if (progressData.stages) {
        progressData.stages.forEach(s => {
          if (s.id === 'DIAGNOSIS') ctx.diagnosisPercent = s.percent || 0;
          if (s.id === 'PLANNING') ctx.planningPercent = s.percent || 0;
          if (s.id === 'EXECUTION') ctx.executionPercent = s.percent || 0;
          if (s.id === 'ADAPTATION') ctx.adaptationPercent = s.percent || 0;
        });
      }

      // Detect completed tools from progress data
      if (progressData.completedTools) {
        ctx.completed = progressData.completedTools;
      }
    }

    // Also check localStorage for any tool completions
    try {
      const toolStatus = JSON.parse(localStorage.getItem('stx_tool_status') || '{}');
      Object.entries(toolStatus).forEach(([key, val]) => {
        if (val && !ctx.completed.includes(key)) {
          ctx.completed.push(key);
        }
      });
    } catch (e) { /* silent */ }

    // Heuristic: if diagnosis > 30%, assume SWOT is done
    if (ctx.diagnosisPercent >= 30 && !ctx.completed.includes('swot')) {
      ctx.completed.push('swot');
    }
    if (ctx.planningPercent >= 20 && !ctx.completed.includes('objectives')) {
      ctx.completed.push('objectives');
    }
    if (ctx.planningPercent >= 40 && !ctx.completed.includes('kpis')) {
      ctx.completed.push('kpis');
    }
    if (ctx.executionPercent >= 20 && !ctx.completed.includes('initiatives')) {
      ctx.completed.push('initiatives');
    }

    return ctx;
  }

  // ====================================================================
  //  SUGGESTION ENGINE — محرك الاقتراحات
  // ====================================================================
  function getSuggestions(ctx) {
    const suggestions = [];

    for (const rule of SUGGESTION_RULES) {
      if (rule.condition(ctx)) {
        for (const sug of rule.suggestions) {
          // Skip if already completed
          if (ctx.completed.includes(sug.toolId)) continue;
          // Skip if custom skip condition
          if (sug.skip && sug.skip(ctx)) continue;

          const tool = ALL_TOOLS.find(t => t.id === sug.toolId);
          if (tool) {
            suggestions.push({
              ...tool,
              reason: sug.reason,
              status: 'suggested'
            });
          }
        }
        // Take first matching rule only (priority order)
        if (suggestions.length > 0) break;
      }
    }

    // Fallback: if no rules matched, suggest based on phase
    if (suggestions.length === 0) {
      const phaseOrder = ['DIAGNOSIS', 'PLANNING', 'EXECUTION', 'ADAPTATION'];
      for (const phase of phaseOrder) {
        const phaseTools = ALL_TOOLS.filter(t => t.phase === phase && !ctx.completed.includes(t.id));
        if (phaseTools.length > 0) {
          suggestions.push({
            ...phaseTools[0],
            reason: 'الخطوة التالية في رحلتك الاستراتيجية',
            status: 'suggested'
          });
          break;
        }
      }
    }

    // Limit to 3 suggestions max
    return suggestions.slice(0, 3);
  }

  // ====================================================================
  //  DETERMINE CURRENT STAGE — تحديد المرحلة الحالية
  // ====================================================================
  function getCurrentStage(ctx) {
    if (ctx.overall >= 80) return { name: 'التحسين المستمر', emoji: '🏅', color: '#22c55e' };
    if (ctx.executionPercent >= 30) return { name: 'التنفيذ والمتابعة', emoji: '🚀', color: '#059669' };
    if (ctx.planningPercent >= 30) return { name: 'التخطيط والبناء', emoji: '🎯', color: '#7c3aed' };
    if (ctx.diagnosisPercent >= 20) return { name: 'التشخيص والتحليل', emoji: '🔍', color: '#f59e0b' };
    if (ctx.hasPainAmbition) return { name: 'البداية', emoji: '🌱', color: '#3b82f6' };
    return { name: 'الخطوة الأولى', emoji: '👣', color: '#8b8ba7' };
  }

  // ====================================================================
  //  RENDER — عرض القسم في السايدبار
  // ====================================================================
  function renderSuggestedTools(progressData) {
    const ctx = buildContext(progressData);
    const suggestions = getSuggestions(ctx);
    const stage = getCurrentStage(ctx);

    // Recently completed (show up to 2)
    const recentDone = ctx.completed.slice(-2).map(id => ALL_TOOLS.find(t => t.id === id)).filter(Boolean);

    let html = '';

    // Stage badge
    html += `
      <div class="sgt-stage" style="--stg-color: ${stage.color}">
        <span class="sgt-stage-emoji">${stage.emoji}</span>
        <span class="sgt-stage-name">${stage.name}</span>
      </div>
    `;

    // Completed tools (recent)
    if (recentDone.length > 0) {
      recentDone.forEach(tool => {
        html += `
          <a href="${tool.href}" class="sgt-tool sgt-done" title="${tool.name}">
            <span class="sgt-tool-status">✅</span>
            <span class="sgt-tool-name">${tool.emoji} ${tool.name}</span>
          </a>
        `;
      });
    }

    // Suggested tools
    if (suggestions.length > 0) {
      suggestions.forEach(sug => {
        html += `
          <a href="${sug.href}" class="sgt-tool sgt-suggested" title="${sug.reason}">
            <span class="sgt-tool-status">⏳</span>
            <div class="sgt-tool-info">
              <span class="sgt-tool-name">${sug.emoji} ${sug.name}</span>
              <span class="sgt-tool-reason">🤖 ${sug.reason}</span>
            </div>
            <span class="sgt-tool-go"><i class="bi bi-arrow-left"></i></span>
          </a>
        `;
      });
    } else {
      html += `
        <div class="sgt-empty">
          <span>🎉</span>
          <small>أحسنت! أنجزت المطلوب لهذه المرحلة</small>
        </div>
      `;
    }

    return html;
  }

  // ====================================================================
  //  CSS — التنسيق
  // ====================================================================
  function injectCSS() {
    if (document.getElementById('sgt-css')) return;
    const style = document.createElement('style');
    style.id = 'sgt-css';
    style.textContent = `
      /* ===== Suggested Tools Section ===== */
      .sgt-wrapper {
        margin: 4px 10px 8px;
        background: rgba(167, 139, 250, 0.04);
        border: 1px solid rgba(167, 139, 250, 0.1);
        border-radius: 12px;
        padding: 10px;
        overflow: hidden;
      }

      .sgt-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 6px 8px;
        font-size: 11.5px;
        font-weight: 700;
        color: #c4b5fd;
        cursor: pointer;
        user-select: none;
      }

      .sgt-header i {
        font-size: 12px;
        transition: transform 0.2s;
      }

      .sgt-wrapper.collapsed .sgt-body {
        max-height: 0;
        padding: 0;
        overflow: hidden;
      }

      .sgt-wrapper.collapsed .sgt-header i.bi-chevron-down {
        transform: rotate(-90deg);
      }

      .sgt-body {
        max-height: 400px;
        transition: max-height 0.3s ease;
      }

      /* Stage badge */
      .sgt-stage {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        margin-bottom: 8px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 11px;
        font-weight: 600;
      }

      .sgt-stage-emoji {
        font-size: 14px;
      }

      .sgt-stage-name {
        color: var(--stg-color, #a78bfa);
      }

      /* Tool items */
      .sgt-tool {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        margin-bottom: 4px;
        border-radius: 8px;
        text-decoration: none;
        color: inherit;
        transition: all 0.2s;
        font-size: 12px;
      }

      .sgt-tool:hover {
        background: rgba(255, 255, 255, 0.05);
        text-decoration: none;
        color: inherit;
        transform: translateX(-2px);
      }

      .sgt-tool-status {
        font-size: 12px;
        flex-shrink: 0;
      }

      .sgt-tool-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .sgt-tool-name {
        font-size: 11.5px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sgt-tool-reason {
        font-size: 9.5px;
        color: #8b8ba7;
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sgt-tool-go {
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        border-radius: 6px;
        background: rgba(167, 139, 250, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: #a78bfa;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .sgt-tool:hover .sgt-tool-go {
        opacity: 1;
      }

      /* Done state */
      .sgt-done {
        opacity: 0.6;
      }

      .sgt-done .sgt-tool-name {
        text-decoration: line-through;
        text-decoration-color: rgba(34, 197, 94, 0.4);
      }

      /* Suggested state */
      .sgt-suggested {
        background: rgba(167, 139, 250, 0.04);
        border: 1px solid rgba(167, 139, 250, 0.08);
        border-radius: 10px;
        padding: 8px 10px;
        margin-bottom: 6px;
      }

      .sgt-suggested:hover {
        background: rgba(167, 139, 250, 0.08);
        border-color: rgba(167, 139, 250, 0.15);
      }

      /* Empty state */
      .sgt-empty {
        text-align: center;
        padding: 12px 8px;
        font-size: 11px;
        color: #8b8ba7;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .sgt-empty span {
        font-size: 20px;
      }

      /* All tools button */
      .sgt-all-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 8px;
        padding: 7px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        font-size: 11px;
        font-weight: 600;
        color: #8b8ba7;
        text-decoration: none;
        transition: all 0.2s;
      }

      .sgt-all-btn:hover {
        background: rgba(167, 139, 250, 0.08);
        color: #c4b5fd;
        text-decoration: none;
        border-color: rgba(167, 139, 250, 0.15);
      }

      /* Locked hint */
      .sgt-locked-hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 6px;
        font-size: 9.5px;
        color: #64748b;
        text-align: center;
      }

      /* Animation */
      @keyframes sgtSlideIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .sgt-suggested {
        animation: sgtSlideIn 0.3s ease-out both;
      }

      .sgt-suggested:nth-child(2) { animation-delay: 0.1s; }
      .sgt-suggested:nth-child(3) { animation-delay: 0.2s; }
      .sgt-suggested:nth-child(4) { animation-delay: 0.3s; }
    `;
    document.head.appendChild(style);
  }

  // ====================================================================
  //  PUBLIC API — واجهة عامة
  // ====================================================================
  window.SuggestedTools = {
    render: renderSuggestedTools,
    injectCSS: injectCSS,
    getContext: buildContext,
    getSuggestions: function (progressData) {
      const ctx = buildContext(progressData);
      return getSuggestions(ctx);
    },
    ALL_TOOLS: ALL_TOOLS
  };

})();
