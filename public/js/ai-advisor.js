/**
 * AI Advisor Widget — المستشار الذكي العائم 🤖
 * يظهر كـ FAB (Floating Action Button) في كل صفحة
 *
 * الميزات:
 *   - يجلب اقتراحات من /api/ai-advisor/context
 *   - يعرض nudge (نصيحة سريعة) في tooltip
 *   - يفتح panel جانبي مع اقتراحات مفصلة
 *   - يقترح الخطوة التالية حسب "الخيط الذهبي"
 *   - يعرض toast عند إكمال أداة
 */
(function () {
    'use strict';

    // === إعدادات ===
    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 دقائق
    let token = '';
    let entityId = '';
    let currentPage = window.location.pathname;

    try {
        token = localStorage.getItem('token') || '';
        const stored = localStorage.getItem('user');
        if (stored) {
            const u = JSON.parse(stored);
            entityId = u.entity?.id || u.activeEntityId || '';
        }
    } catch (e) { /* ignore */ }

    // لا تُظهر المستشار في صفحات لا تحتاجه
    const excludedPages = ['/login.html', '/signup.html', '/landing.html', '/'];
    if (excludedPages.includes(currentPage) || !token) return;

    // === حالة المكون ===
    let suggestions = [];
    let nudge = null;
    let context = {};
    let isPanelOpen = false;
    let hasNewSuggestions = false;

    // === CSS ===
    const style = document.createElement('style');
    style.textContent = `
    /* ════════ FAB Button ════════ */
    .ai-fab {
      position: fixed;
      bottom: 28px;
      left: 28px;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
      box-shadow: 0 6px 25px rgba(102,126,234,0.4), 0 2px 8px rgba(0,0,0,0.2);
      z-index: 99990;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      animation: ai-fab-entrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ai-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 8px 32px rgba(102,126,234,0.5);
    }
    .ai-fab.has-new::after {
      content: '';
      position: absolute;
      top: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid white;
      animation: ai-pulse 2s infinite;
    }
    .ai-fab.panel-open {
      transform: rotate(180deg) scale(0.9);
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }
    @keyframes ai-fab-entrance {
      from { transform: scale(0) translateY(20px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
    @keyframes ai-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.7; }
    }

    /* ════════ Nudge Tooltip ════════ */
    .ai-nudge {
      position: fixed;
      bottom: 96px;
      left: 28px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 14px;
      padding: 12px 18px;
      max-width: 300px;
      font-family: 'Tajawal', 'Inter', sans-serif;
      font-size: 13px;
      color: #e2e8f0;
      z-index: 99991;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.25s ease;
      animation: ai-nudge-slide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ai-nudge:hover {
      transform: translateY(-2px);
      border-color: rgba(102, 126, 234, 0.5);
      color: white;
    }
    .ai-nudge .nudge-icon {
      font-size: 20px;
      flex-shrink: 0;
    }
    .ai-nudge .nudge-text {
      flex: 1;
      font-weight: 600;
      line-height: 1.5;
    }
    .ai-nudge .nudge-close {
      flex-shrink: 0;
      opacity: 0.5;
      font-size: 16px;
      cursor: pointer;
      padding: 2px;
    }
    .ai-nudge .nudge-close:hover { opacity: 1; }
    @keyframes ai-nudge-slide {
      from { transform: translateX(-20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    /* ════════ Panel ════════ */
    .ai-panel-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 99992;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    .ai-panel-overlay.visible {
      opacity: 1;
      pointer-events: all;
    }
    .ai-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 420px;
      max-width: 95vw;
      max-height: 80vh;
      background: #0f172a;
      border-top-left-radius: 24px;
      border-top-right-radius: 24px;
      z-index: 99993;
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 -8px 40px rgba(0,0,0,0.4);
      border: 1px solid rgba(102, 126, 234, 0.2);
      border-bottom: none;
    }
    .ai-panel.visible {
      transform: translateY(0);
    }

    /* Panel Header */
    .ai-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .ai-panel-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'Tajawal', 'Inter', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #e2e8f0;
    }
    .ai-panel-title .ai-avatar {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .ai-panel-close {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: rgba(255,255,255,0.06);
      color: #94a3b8;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .ai-panel-close:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    /* Context Badge */
    .ai-context-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 24px;
      padding: 8px 14px;
      background: rgba(102, 126, 234, 0.08);
      border: 1px solid rgba(102, 126, 234, 0.15);
      border-radius: 10px;
      font-family: 'Tajawal', 'Inter', sans-serif;
      font-size: 12px;
      color: #94a3b8;
    }
    .ai-context-badge .ctx-icon { font-size: 14px; }
    .ai-context-badge .ctx-val {
      color: #a78bfa;
      font-weight: 700;
    }

    /* Panel Body */
    .ai-panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px 16px 20px;
    }

    /* Suggestion Cards */
    .ai-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 12px;
      transition: all 0.2s;
      font-family: 'Tajawal', 'Inter', sans-serif;
    }
    .ai-card:hover {
      background: rgba(255,255,255,0.05);
      border-color: rgba(102, 126, 234, 0.2);
    }
    .ai-card-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
    }
    .ai-card-icon {
      font-size: 22px;
      flex-shrink: 0;
      line-height: 1;
    }
    .ai-card-info { flex: 1; }
    .ai-card-title {
      font-size: 14px;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 4px;
    }
    .ai-card-msg {
      font-size: 12.5px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .ai-card-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .ai-card-time {
      font-size: 11px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ai-card-context {
      font-size: 11px;
      color: #667eea;
      background: rgba(102,126,234,0.08);
      padding: 2px 8px;
      border-radius: 6px;
    }
    .ai-card-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 10px;
      border: none;
      font-family: 'Tajawal', 'Inter', sans-serif;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      margin-top: 10px;
    }
    .ai-card-btn.primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }
    .ai-card-btn.primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(102,126,234,0.3);
    }
    .ai-card-btn.warning {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }
    .ai-card-btn.danger {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
    .ai-card-btn.success {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }

    /* Type-specific borders */
    .ai-card[data-type="START"] { border-right: 3px solid #667eea; }
    .ai-card[data-type="NEXT_STEP"] { border-right: 3px solid #22c55e; }
    .ai-card[data-type="WARNING"] { border-right: 3px solid #f59e0b; }
    .ai-card[data-type="ALERT"] { border-right: 3px solid #ef4444; }
    .ai-card[data-type="SUCCESS"] { border-right: 3px solid #22c55e; }

    /* Empty State */
    .ai-empty {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
      font-family: 'Tajawal', 'Inter', sans-serif;
    }
    .ai-empty-icon { font-size: 48px; margin-bottom: 12px; }
    .ai-empty-text { font-size: 14px; font-weight: 600; }

    /* Toast (للإشعارات) */
    .ai-toast {
      position: fixed;
      bottom: 96px;
      left: 28px;
      max-width: 340px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 14px;
      padding: 14px 18px;
      font-family: 'Tajawal', 'Inter', sans-serif;
      font-size: 13px;
      color: #e2e8f0;
      z-index: 99995;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      animation: ai-toast-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ai-toast-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .ai-toast-icon { font-size: 18px; }
    .ai-toast-title { font-weight: 700; font-size: 14px; }
    .ai-toast-body { font-size: 12.5px; color: #94a3b8; line-height: 1.5; }
    .ai-toast-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      padding: 6px 14px;
      border-radius: 8px;
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      transition: background 0.2s;
    }
    .ai-toast-action:hover { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    @keyframes ai-toast-in {
      from { transform: translateX(-20px) scale(0.95); opacity: 0; }
      to { transform: translateX(0) scale(1); opacity: 1; }
    }

    /* RTL Support */
    [dir="rtl"] .ai-fab { left: auto; right: 28px; }
    [dir="rtl"] .ai-nudge { left: auto; right: 28px; }
    [dir="rtl"] .ai-panel { left: auto; right: 0; }
    [dir="rtl"] .ai-toast { left: auto; right: 28px; }
    [dir="rtl"] .ai-card[data-type] { border-right: none; border-left: 3px solid; }
    [dir="rtl"] .ai-card[data-type="START"] { border-left-color: #667eea; }
    [dir="rtl"] .ai-card[data-type="NEXT_STEP"] { border-left-color: #22c55e; }
    [dir="rtl"] .ai-card[data-type="WARNING"] { border-left-color: #f59e0b; }
    [dir="rtl"] .ai-card[data-type="ALERT"] { border-left-color: #ef4444; }
    [dir="rtl"] .ai-card[data-type="SUCCESS"] { border-left-color: #22c55e; }

    @media (max-width: 480px) {
      .ai-panel { width: 100vw; max-width: 100vw; border-radius: 20px 20px 0 0; }
      .ai-fab { bottom: 16px; left: 16px; width: 50px; height: 50px; font-size: 20px; }
      [dir="rtl"] .ai-fab { left: auto; right: 16px; }
      .ai-nudge { bottom: 76px; left: 16px; max-width: calc(100vw - 32px); }
      [dir="rtl"] .ai-nudge { left: auto; right: 16px; }
    }
  `;
    document.head.appendChild(style);

    // === DOM: FAB ===
    const fab = document.createElement('button');
    fab.className = 'ai-fab';
    fab.innerHTML = '🤖';
    fab.title = 'المستشار الذكي';
    fab.onclick = togglePanel;
    document.body.appendChild(fab);

    // === DOM: Overlay ===
    const overlay = document.createElement('div');
    overlay.className = 'ai-panel-overlay';
    overlay.onclick = closePanel;
    document.body.appendChild(overlay);

    // === DOM: Panel ===
    const panel = document.createElement('div');
    panel.className = 'ai-panel';
    panel.innerHTML = `
    <div class="ai-panel-header">
      <div class="ai-panel-title">
        <div class="ai-avatar">🤖</div>
        <span>المستشار الذكي</span>
      </div>
      <button class="ai-panel-close" onclick="window.__aiAdvisor.close()">✕</button>
    </div>
    <div id="ai-context-area"></div>
    <div class="ai-panel-body" id="ai-body">
      <div class="ai-empty">
        <div class="ai-empty-icon">⏳</div>
        <div class="ai-empty-text">جاري التحليل...</div>
      </div>
    </div>
  `;
    document.body.appendChild(panel);

    // === DOM: Nudge (يُبنى لاحقاً) ===
    let nudgeEl = null;
    let nudgeTimeout = null;

    // === Functions ===
    function togglePanel() {
        if (isPanelOpen) { closePanel(); } else { openPanel(); }
    }

    function openPanel() {
        isPanelOpen = true;
        fab.classList.add('panel-open');
        fab.innerHTML = '✕';
        panel.classList.add('visible');
        overlay.classList.add('visible');
        hideNudge();
        hasNewSuggestions = false;
        fab.classList.remove('has-new');
        renderSuggestions();
    }

    function closePanel() {
        isPanelOpen = false;
        fab.classList.remove('panel-open');
        fab.innerHTML = '🤖';
        panel.classList.remove('visible');
        overlay.classList.remove('visible');
    }

    function showNudge(data) {
        if (isPanelOpen || !data) return;

        hideNudge();

        nudgeEl = document.createElement(data.href ? 'a' : 'div');
        nudgeEl.className = 'ai-nudge';
        if (data.href) nudgeEl.href = data.href;
        nudgeEl.innerHTML = `
      <span class="nudge-icon">${data.icon || '💡'}</span>
      <span class="nudge-text">${data.text}</span>
      <span class="nudge-close" onclick="event.preventDefault(); event.stopPropagation(); window.__aiAdvisor.hideNudge();">✕</span>
    `;
        document.body.appendChild(nudgeEl);

        // إخفاء تلقائي بعد 12 ثانية
        nudgeTimeout = setTimeout(hideNudge, 12000);
    }

    function hideNudge() {
        if (nudgeTimeout) clearTimeout(nudgeTimeout);
        if (nudgeEl && nudgeEl.parentNode) nudgeEl.remove();
        nudgeEl = null;
    }

    function showToast(data) {
        const old = document.querySelector('.ai-toast');
        if (old) old.remove();

        const toast = document.createElement('div');
        toast.className = 'ai-toast';
        toast.innerHTML = `
      <div class="ai-toast-header">
        <span class="ai-toast-icon">${data.icon || '✅'}</span>
        <span class="ai-toast-title">${data.title}</span>
      </div>
      <div class="ai-toast-body">${data.message}</div>
      ${data.action ? `<a href="${data.action.href}" class="ai-toast-action">${data.action.label} →</a>` : ''}
    `;
        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 8000);
    }

    function renderSuggestions() {
        const body = document.getElementById('ai-body');
        const ctxArea = document.getElementById('ai-context-area');
        if (!body) return;

        // Context Badge
        if (context.patternLabel && ctxArea) {
            ctxArea.innerHTML = `
        <div class="ai-context-badge">
          <span class="ctx-icon">🏢</span>
          <span>نمطك: <span class="ctx-val">${context.patternLabel}</span></span>
          <span style="margin-right:auto"></span>
          <span class="ctx-icon">📊</span>
          <span>التقدم: <span class="ctx-val">${context.totalProgress || 0}%</span></span>
        </div>
      `;
        }

        // Cards
        if (suggestions.length === 0) {
            body.innerHTML = `
        <div class="ai-empty">
          <div class="ai-empty-icon">🎉</div>
          <div class="ai-empty-text">ممتاز! لا توجد اقتراحات حالياً</div>
        </div>
      `;
            return;
        }

        body.innerHTML = suggestions.map(s => {
            const btnClass = s.type === 'ALERT' ? 'danger'
                : s.type === 'WARNING' ? 'warning'
                    : s.type === 'SUCCESS' ? 'success'
                        : 'primary';
            return `
        <div class="ai-card" data-type="${s.type}">
          <div class="ai-card-header">
            <span class="ai-card-icon">${s.icon}</span>
            <div class="ai-card-info">
              <div class="ai-card-title">${s.title}</div>
              <div class="ai-card-msg">${s.message}</div>
            </div>
          </div>
          <div class="ai-card-meta">
            ${s.estimatedTime ? `<span class="ai-card-time">⏱ ${s.estimatedTime}</span>` : ''}
            ${s.context ? `<span class="ai-card-context">${s.context}</span>` : ''}
          </div>
          ${s.action ? `<a href="${s.action.href}" class="ai-card-btn ${btnClass}">${s.action.label} ←</a>` : ''}
        </div>
      `;
        }).join('');
    }

    // === Fetch Suggestions ===
    async function fetchContext() {
        if (!token || !entityId) return;

        try {
            const url = `/api/ai-advisor/context?page=${encodeURIComponent(currentPage)}&entityId=${encodeURIComponent(entityId)}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;

            const data = await res.json();
            suggestions = data.suggestions || [];
            nudge = data.nudge || null;
            context = data.context || {};

            // Show nudge بعد 3 ثواني من التحميل
            if (nudge && !isPanelOpen) {
                setTimeout(() => showNudge(nudge), 3000);
            }

            // Show new badge
            if (suggestions.length > 0 && !isPanelOpen) {
                hasNewSuggestions = true;
                fab.classList.add('has-new');
            }

            // تحديث الـ panel إذا كان مفتوحاً
            if (isPanelOpen) {
                renderSuggestions();
            }

        } catch (e) {
            console.warn('AI Advisor fetch error:', e);
        }
    }

    // === Init ===
    // أول جلب بعد 2 ثانية
    setTimeout(fetchContext, 2000);

    // تحديث دوري
    setInterval(fetchContext, REFRESH_INTERVAL);

    // API عامة (يمكن استدعاؤها من صفحات أخرى)
    window.__aiAdvisor = {
        open: openPanel,
        close: closePanel,
        hideNudge: hideNudge,
        refresh: fetchContext,
        showToast: showToast,
        // يمكن استدعاؤها من أي صفحة عند إكمال أداة:
        onToolComplete(toolName, nextStep) {
            showToast({
                icon: '🎉',
                title: `أكملت ${toolName}!`,
                message: nextStep ? `الخطوة التالية المقترحة: ${nextStep.label}` : 'ممتاز! تقدمك يزداد',
                action: nextStep ? { label: nextStep.label, href: nextStep.href } : null,
            });
            // refresh بعد ثانية
            setTimeout(fetchContext, 1000);
        }
    };
})();
