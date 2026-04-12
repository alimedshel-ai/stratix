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
  let entityId = '';
  let currentPage = window.location.pathname + window.location.search;
  let user = null;

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
    .ai-card[data-type="SUGGESTIONS"] { border-right: 3px solid #667eea; }

    /* === اقتراحات عملية (Suggestions Chips) === */
    .ai-card-suggestions .ai-card-msg {
      font-size: 12px;
      margin-bottom: 4px;
    }
    .ai-suggest-body {
      padding: 4px 0;
      max-height: 400px;
      overflow-y: auto;
    }
    .ai-suggest-section {
      margin-bottom: 10px;
    }
    .ai-suggest-section-label {
      font-size: 12px;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 6px;
      padding-right: 2px;
      font-family: 'Tajawal', 'Inter', sans-serif;
    }
    .ai-suggest-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .ai-suggest-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 12px;
      font-size: 12px;
      font-family: 'Tajawal', 'Inter', sans-serif;
      color: #cbd5e1;
      background: rgba(100, 116, 139, 0.12);
      border: 1px solid rgba(100, 116, 139, 0.25);
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      line-height: 1.4;
    }
    .ai-suggest-chip:hover {
      background: rgba(102, 126, 234, 0.2);
      border-color: rgba(102, 126, 234, 0.5);
      color: #e2e8f0;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
    }
    .ai-suggest-chip:active {
      transform: scale(0.97);
    }
    .ai-suggest-chip.added {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(34, 197, 94, 0.4);
      color: #22c55e;
      cursor: default;
      opacity: 0.8;
    }
    .ai-suggest-chip.added:hover {
      transform: none;
      box-shadow: none;
    }

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

    /* ════════ Contextual Tip Card (Task 1.2) ════════ */
    .ai-ctx-tip {
      position: fixed;
      bottom: 96px;
      left: 28px;
      max-width: 380px;
      background: rgba(15, 23, 42, 0.97);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(139, 92, 246, 0.35);
      border-radius: 18px;
      padding: 0;
      font-family: 'Tajawal', 'Inter', sans-serif;
      color: #e2e8f0;
      z-index: 99996;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(139,92,246,0.1);
      animation: ai-ctx-tip-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;
    }
    .ai-ctx-tip-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .ai-ctx-tip-avatar {
      width: 32px; height: 32px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; flex-shrink: 0;
    }
    .ai-ctx-tip-label {
      font-size: 13px; font-weight: 700; color: #a78bfa;
      flex: 1;
    }
    .ai-ctx-tip-close {
      width: 24px; height: 24px; border-radius: 6px;
      border: none; background: rgba(255,255,255,0.06);
      color: #64748b; font-size: 13px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .ai-ctx-tip-close:hover { background: rgba(239,68,68,0.15); color: #ef4444; }
    .ai-ctx-tip-body {
      padding: 12px 18px 6px;
    }
    .ai-ctx-tip-msg {
      font-size: 13.5px; font-weight: 600; line-height: 1.7;
      margin-bottom: 10px; color: #e2e8f0;
    }
    .ai-ctx-tip-points {
      list-style: none; padding: 0; margin: 0 0 10px;
    }
    .ai-ctx-tip-points li {
      font-size: 12.5px; color: #94a3b8; line-height: 1.6;
      padding: 4px 0;
      display: flex; align-items: flex-start; gap: 8px;
    }
    .ai-ctx-tip-points li .tip-bullet {
      flex-shrink: 0; margin-top: 2px;
    }
    .ai-ctx-tip-tool {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; margin: 4px 0 8px;
      background: rgba(102,126,234,0.08);
      border: 1px solid rgba(102,126,234,0.15);
      border-radius: 10px;
      font-size: 12px; color: #94a3b8;
    }
    .ai-ctx-tip-tool .tool-name {
      color: #667eea; font-weight: 700;
    }
    .ai-ctx-tip-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 18px 12px;
      border-top: 1px solid rgba(255,255,255,0.04);
    }
    .ai-ctx-tip-feedback {
      display: flex; gap: 6px;
    }
    .ai-ctx-tip-fb-btn {
      padding: 5px 12px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.08);
      background: transparent; color: #64748b;
      font-family: 'Tajawal', 'Inter', sans-serif;
      font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; gap: 4px;
    }
    .ai-ctx-tip-fb-btn:hover {
      border-color: rgba(255,255,255,0.15);
      color: #94a3b8;
    }
    .ai-ctx-tip-fb-btn.positive:hover {
      border-color: rgba(34,197,94,0.3);
      background: rgba(34,197,94,0.08);
      color: #22c55e;
    }
    .ai-ctx-tip-fb-btn.negative:hover {
      border-color: rgba(239,68,68,0.3);
      background: rgba(239,68,68,0.08);
      color: #ef4444;
    }
    .ai-ctx-tip-fb-btn.active {
      border-color: rgba(34,197,94,0.4);
      background: rgba(34,197,94,0.12);
      color: #22c55e;
    }
    .ai-ctx-tip-dismiss {
      font-size: 11px; color: #475569;
      background: none; border: none; cursor: pointer;
      font-family: 'Tajawal', 'Inter', sans-serif;
    }
    .ai-ctx-tip-dismiss:hover { color: #64748b; }
    @keyframes ai-ctx-tip-in {
      from { transform: translateY(20px) scale(0.95); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes ai-ctx-tip-out {
      from { transform: translateY(0) scale(1); opacity: 1; }
      to { transform: translateY(20px) scale(0.9); opacity: 0; }
    }
    [dir="rtl"] .ai-ctx-tip { left: auto; right: 28px; }
    @media (max-width: 480px) {
      .ai-ctx-tip { left: 12px; right: 12px; max-width: calc(100vw - 24px); bottom: 80px; }
      [dir="rtl"] .ai-ctx-tip { left: 12px; right: 12px; }
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
      // === بطاقة الاقتراحات العملية (عناصر قابلة للنقر) ===
      if (s.type === 'SUGGESTIONS' && s.sections) {
        let sectionsHTML = '';
        for (const [key, sec] of Object.entries(s.sections)) {
          const chipsHTML = sec.items.map(item =>
            `<button class="ai-suggest-chip" data-section="${key}" data-tool="${s.toolCode}" data-text="${item.replace(/"/g, '&quot;')}" 
                     onclick="window.__aiAdvisor.applySuggestion('${key}', this.dataset.text, this)"
                     title="اضغط لإضافة هذا العنصر">${item}</button>`
          ).join('');
          sectionsHTML += `
            <div class="ai-suggest-section">
              <div class="ai-suggest-section-label">${sec.label}</div>
              <div class="ai-suggest-chips">${chipsHTML}</div>
            </div>
          `;
        }
        return `
          <div class="ai-card ai-card-suggestions" data-type="SUGGESTIONS">
            <div class="ai-card-header">
              <span class="ai-card-icon">${s.icon}</span>
              <div class="ai-card-info">
                <div class="ai-card-title">${s.title}</div>
                <div class="ai-card-msg">${s.message}</div>
              </div>
            </div>
            <div class="ai-suggest-body">${sectionsHTML}</div>
            <div class="ai-card-meta">
              ${s.context ? `<span class="ai-card-context">${s.context}</span>` : ''}
            </div>
          </div>
        `;
      }

      // === بطاقة عادية ===
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
    // إذا ما فيه entityId → نعطي نصائح محلية من الفرونتند
    if (!entityId) {
      const localSuggestions = getLocalSuggestions(currentPage);
      if (localSuggestions.length > 0) {
        suggestions = localSuggestions;
        // nudge مخصص حسب الصفحة
        if (currentPage.includes('pain-ambition')) {
          nudge = { icon: '👋', text: 'مرحباً! أنا هنا أساعدك — اختر تحدياتك وأنا أوجهك', href: null };
        } else {
          nudge = { icon: '💡', text: 'أنا هنا أساعدك — اضغط للنصائح', href: null };
        }
        if (!isPanelOpen) {
          hasNewSuggestions = true;
          fab.classList.add('has-new');
        }
        if (isPanelOpen) renderSuggestions();
      }
      return;
    }

    try {
      const url = `/api/ai-advisor/context?page=${encodeURIComponent(currentPage)}&entityId=${encodeURIComponent(entityId)}`;
      // No headers needed, monkey-patched fetch in api.js handles credentials
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      suggestions = data.suggestions || [];
      nudge = data.nudge || null;
      context = data.context || {};

      // Show nudge بعد 3 ثواني من التحميل
      if (nudge && !isPanelOpen) {
        setTimeout(() => showNudge(nudge), 3000);
      }

      // ✅ [REFACTOR] Expose context for other modules
      if (window.Startix) {
        window.Startix.advisorContext = context;
      } else {
        window.Startix = { advisorContext: context };
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

      // Fire an event to notify other scripts that context is ready
      document.dispatchEvent(new CustomEvent('startix:contextUpdated', { detail: context }));

    } catch (e) {
      console.warn('AI Advisor fetch error:', e);
    }
  }

  // === نصائح محلية + اقتراحات عناصر عند عدم وجود entityId ===
  function getLocalSuggestions(page) {
    const tips = [];
    const toolCode = page.includes('code=') ? page.split('code=')[1].split('&')[0] : '';

    // === اقتراحات عناصر عملية لكل أداة ===
    const TOOL_SUGGESTIONS = {
      PESTEL: {
        icon: '🌍', title: '🤖 اقتراحات لتحليل PESTEL',
        message: 'اختر العناصر المناسبة لشركتك — اضغط على أي عنصر لإضافته مباشرة:',
        sections: {
          political: { label: '🏛️ سياسي', items: ['تغيرات في السياسات الحكومية', 'قوانين الاستثمار الأجنبي', 'الاستقرار السياسي', 'السياسات الضريبية الجديدة', 'دعم الحكومة للقطاع الخاص', 'سياسات التوطين والتوظيف'] },
          economic: { label: '💰 اقتصادي', items: ['معدل التضخم وتأثيره', 'سعر صرف العملة', 'القدرة الشرائية للمستهلك', 'أسعار الفائدة البنكية', 'معدل البطالة', 'نمو الناتج المحلي'] },
          social: { label: '👥 اجتماعي', items: ['تغير أنماط الاستهلاك', 'التركيبة السكانية والنمو', 'ثقافة العمل عن بُعد', 'الوعي الصحي والبيئي', 'التحول الرقمي في المجتمع', 'تغير توقعات العملاء'] },
          technological: { label: '💻 تقني', items: ['الذكاء الاصطناعي وتطبيقاته', 'الأتمتة والروبوتات', 'الحوسبة السحابية', 'الأمن السيبراني', 'تطور التجارة الإلكترونية', 'إنترنت الأشياء IoT'] },
          environmental: { label: '🌿 بيئي', items: ['التغير المناخي وتأثيره', 'اشتراطات الاستدامة', 'إدارة النفايات والتدوير', 'استهلاك الطاقة والكفاءة', 'البصمة الكربونية', 'شهادات البيئة ISO 14001'] },
          legal: { label: '⚖️ قانوني', items: ['حماية البيانات والخصوصية', 'قوانين المنافسة', 'حقوق الملكية الفكرية', 'تشريعات العمل الجديدة', 'متطلبات الترخيص', 'قوانين حماية المستهلك'] }
        }
      },
      PORTER: {
        icon: '⚔️', title: '🤖 اقتراحات لقوى بورتر',
        message: 'حلل القوى التنافسية — اختر العناصر الملائمة:',
        sections: {
          rivalry: { label: '⚔️ حدة المنافسة', items: ['عدد المنافسين المباشرين', 'تشابه المنتجات والأسعار', 'حروب الأسعار في السوق', 'معدل نمو الصناعة', 'حواجز الخروج العالية'] },
          newEntrants: { label: '🚪 تهديد الداخلين', items: ['سهولة دخول السوق', 'رأس المال المطلوب', 'العلامات التجارية المسيطرة', 'اللوائح التنظيمية', 'الوصول لقنوات التوزيع'] },
          substitutes: { label: '🔄 تهديد البدائل', items: ['توفر بدائل أرخص', 'تكلفة التحول للبديل', 'جودة البدائل المتاحة', 'الابتكار في حلول بديلة', 'تحول رقمي', 'ميل العملاء للتجربة'] },
          supplierPower: { label: '📦 قوة الموردين', items: ['عدد الموردين المتاحين', 'تكلفة تغيير المورد', 'تفرد المواد الخام', 'إمكانية التكامل الأمامي', 'اعتمادية سلسلة التوريد'] },
          buyerPower: { label: '🛒 قوة المشترين', items: ['حجم مشتريات العميل', 'توفر البدائل للعميل', 'حساسية السعر', 'معلومات العميل عن السوق', 'تكلفة التحول للمنافس'] }
        }
      },
      SWOT: {
        icon: '📊', title: '🤖 اقتراحات لتحليل SWOT',
        message: 'قيّم شركتك بصراحة — اختر ما يناسب:',
        sections: {
          strengths: { label: '💪 نقاط القوة', items: ['فريق عمل مؤهل', 'علامة تجارية قوية', 'تقنية متقدمة', 'خدمة عملاء متميزة', 'شراكات استراتيجية', 'كفاءة تشغيلية عالية'] },
          weaknesses: { label: '⚠️ نقاط الضعف', items: ['محدودية الموارد المالية', 'ضعف التسويق الرقمي', 'اعتماد على عدد قليل من العملاء', 'بطء في اتخاذ القرارات', 'نقص في الكفاءات', 'ضعف البنية التحتية'] },
          opportunities: { label: '🎯 الفرص', items: ['أسواق جديدة غير مستغلة', 'شراكات محتملة', 'تحول رقمي في القطاع', 'دعم حكومي للقطاع', 'تغير سلوك المستهلك', 'ضعف المنافسين'] },
          threats: { label: '🔴 التهديدات', items: ['دخول منافسين جدد', 'تغيرات تنظيمية', 'تقلبات اقتصادية', 'تطور تقني سريع', 'تغير تفضيلات العملاء', 'ارتفاع تكاليف التشغيل'] }
        }
      },
      VALUE_CHAIN: {
        icon: '🔗', title: '🤖 اقتراحات لسلسلة القيمة',
        message: 'حدد أنشطة القيمة في شركتك:',
        sections: {
          inbound: { label: '📥 اللوجستيات الداخلة', items: ['استلام المواد الخام', 'إدارة المخزون', 'جدولة الإمداد', 'فحص الجودة'] },
          operations: { label: '⚙️ العمليات', items: ['التصنيع/الإنتاج', 'مراقبة الجودة', 'التعبئة والتغليف', 'صيانة المعدات'] },
          outbound: { label: '📤 اللوجستيات الخارجة', items: ['التوزيع والتسليم', 'معالجة الطلبات', 'إدارة المستودعات', 'النقل'] },
          marketing: { label: '📢 التسويق والمبيعات', items: ['الإعلان والترويج', 'التسعير', 'قنوات البيع', 'إدارة العلاقات'] },
          service: { label: '🛠️ خدمة ما بعد البيع', items: ['الدعم الفني', 'الضمان والصيانة', 'التدريب', 'إدارة الشكاوى'] }
        }
      },
      BLUE_OCEAN: {
        icon: '🌊', title: '🤖 اقتراحات للمحيط الأزرق',
        message: 'أعد تشكيل السوق — اختر العناصر:',
        sections: {
          eliminate: { label: '❌ حذف', items: ['ميزات لا يستخدمها العميل', 'تكاليف تشغيلية غير ضرورية', 'عمليات معقدة بلا قيمة', 'وسطاء يمكن الاستغناء عنهم'] },
          reduce: { label: '⬇️ تقليل', items: ['التعقيد في المنتج', 'وقت الانتظار', 'المستويات الإدارية', 'التكاليف الثابتة'] },
          raise: { label: '⬆️ رفع', items: ['جودة خدمة العملاء', 'سرعة التسليم', 'سهولة الاستخدام', 'الشفافية مع العميل'] },
          create: { label: '💡 ابتكار', items: ['تجربة رقمية جديدة', 'خدمة اشتراك مبتكرة', 'نموذج عمل مختلف', 'قيمة لم تُقدم من قبل'] }
        }
      }
    };

    // === بناء بطاقة الاقتراحات بعناصر قابلة للنقر ===
    if (toolCode && TOOL_SUGGESTIONS[toolCode]) {
      const tool = TOOL_SUGGESTIONS[toolCode];
      tips.push({
        id: `suggestions-${toolCode}`,
        type: 'SUGGESTIONS',
        priority: 95,
        icon: tool.icon,
        title: tool.title,
        message: tool.message,
        sections: tool.sections,  // بيانات الاقتراحات
        toolCode: toolCode,
        action: null,
        context: 'اقتراحات ذكية'
      });
    }

    // === بطاقة ترحيبية لصفحة الألم والطموح ===
    if (page.includes('pain-ambition')) {
      tips.push({
        id: 'welcome-pain-ambition',
        type: 'START',
        priority: 100,
        icon: '🤖',
        title: 'مرحباً! أنا مساعدك الاستراتيجي',
        message: 'سأرافقك في كل خطوة — من تحديد التحديات إلى بناء خطتك. هالخطوة تأخذ 3 دقائق وتوفر عليك ساعات من التخبط.',
        action: null,
        estimatedTime: '3 دقائق',
        context: 'نقطة البداية'
      });
      tips.push({
        id: 'pain-ambition-guide',
        type: 'TIP',
        priority: 90,
        icon: '📝',
        title: 'كيف تختار بذكاء؟',
        message: '① اختر 1-3 تحديات تواجهها شركتك فعلاً\n② حدد طموحك — وين تبي توصل؟\n③ أنا أحلل النمط وأقترح لك مسار مخصص',
        action: null,
        context: 'دليل سريع'
      });
    }

    // صفحات التحليل العامة
    if (page.includes('swot') && !toolCode) {
      tips.push({ id: 'local-swot', type: 'TIP', priority: 90, icon: '📊', title: 'نصيحة: تحليل SWOT', message: 'كن صريحاً مع نفسك — اكتب نقاط الضعف الحقيقية وليس المثالية.', action: null, context: 'نصيحة سياقية' });
    }
    if (page.includes('tows')) {
      tips.push({ id: 'local-tows', type: 'TIP', priority: 90, icon: '🎯', title: 'نصيحة: مصفوفة TOWS', message: 'حوّل تحليل SWOT إلى استراتيجيات عملية — كل ربع يعطيك نوع مختلف من الاستراتيجيات.', action: null, context: 'نصيحة سياقية' });
    }

    // معلومة تكميلية بدون رابط (لا تطلّع المستخدم من صفحته)
    if (page.includes('tool-detail') || page.includes('swot') || page.includes('tows') || page.includes('analysis')) {
      tips.push({
        id: 'setup-entity',
        type: 'INFO',
        priority: 30,
        icon: '💡',
        title: 'نصيحة إضافية',
        message: 'أكمل التحليل هنا أولاً — بعدها ممكن تربط البيانات بألمك وطموحك من القائمة الجانبية لتحصل على توصيات مخصصة.',
        action: null,
      });
    }

    // صفحات Dashboard عامة
    if (page.includes('dashboard')) {
      const pa = JSON.parse(localStorage.getItem('painAmbition') || 'null');
      if (!pa) {
        tips.push({
          id: 'setup-company',
          type: 'START',
          priority: 80,
          icon: '🚀',
          title: 'أعد شركتك للبدء',
          message: 'حدد ألمك وطموحك وأنا أبني لك مسار استراتيجي مخصص',
          action: { label: 'ابدأ الآن', href: '/select-type' },
          estimatedTime: '5 دقائق',
        });
      } else {
        tips.push({
          id: 'pattern-dashboard-tip',
          type: 'TIP',
          priority: 75,
          icon: '🧬',
          title: `نمطك: ${pa.pattern || 'عام'}`,
          message: `بناءً على تشخيصك (${pa.pains?.length || 0} تحديات، ${pa.ambitions?.length || 0} طموحات) — التوصيات أعلاه مخصصة لنمط شركتك. تابع الخطوات المقترحة.`,
          action: null,
          context: 'تحليل النمط'
        });
      }
    }

    // === اقتراحات مخصصة حسب النمط في صفحات التحليل ===
    const pa = JSON.parse(localStorage.getItem('painAmbition') || 'null');
    if (pa && pa.patternKey) {
      const PATTERN_TIPS = {
        nascent_struggling: {
          pages: ['swot', 'tool-detail', 'directions', 'objectives'],
          tip: 'شركتك في مرحلة تأسيسية مع تحديات — ركّز على تحديد 3 أولويات فقط بدل تبعثر الجهود.',
          icon: '🎯'
        },
        nascent_cautious: {
          pages: ['swot', 'tool-detail', 'directions', 'objectives'],
          tip: 'شركتك حذرة وتبدأ بخطى ثابتة — استغل هالمرحلة لبناء أساس قوي قبل التوسع.',
          icon: '🏗️'
        },
        growing_chaotic: {
          pages: ['swot', 'tool-detail', 'directions', 'initiatives', 'kpis'],
          tip: 'نموك سريع بس بدون نظام! الأولوية: مؤشرات أداء واضحة + هيكلة العمليات قبل الفوضى تزيد.',
          icon: '⚡'
        },
        growing_ambitious: {
          pages: ['swot', 'tool-detail', 'directions', 'objectives', 'initiatives'],
          tip: 'طموحك كبير ونموك قوي 💪 ركّز على التخطيط الاستراتيجي طويل المدى وبناء ميزة تنافسية.',
          icon: '🚀'
        },
        financial_struggling: {
          pages: ['swot', 'tool-detail', 'kpis', 'initiatives'],
          tip: 'الضغط المالي يحتاج تشخيص سريع — ركّز على خفض التكاليف غير الضرورية وزيادة الكفاءة.',
          icon: '💰'
        },
        mature_renewing: {
          pages: ['swot', 'tool-detail', 'directions', 'objectives'],
          tip: 'شركتك ناضجة وتجدد نفسها — استثمر في الابتكار وافتح أسواق جديدة للنمو الثاني.',
          icon: '🔄'
        },
        mature_competitive: {
          pages: ['swot', 'tool-detail', 'directions', 'initiatives'],
          tip: 'أنت في وضع تنافسي قوي — ركّز على الاستدامة والتحول الرقمي للحفاظ على تفوقك.',
          icon: '🏆'
        },
        default_strategic: {
          pages: ['swot', 'tool-detail', 'directions', 'objectives', 'kpis', 'initiatives'],
          tip: 'وضعك يحتاج نظرة استراتيجية شاملة — ابدأ بتحليل SWOT ثم حدد أولوياتك بوضوح.',
          icon: '🧭'
        }
      };

      const patternTip = PATTERN_TIPS[pa.patternKey];
      if (patternTip) {
        const isRelevantPage = patternTip.pages.some(p => page.includes(p));
        if (isRelevantPage) {
          tips.push({
            id: `pattern-tip-${pa.patternKey}`,
            type: 'TIP',
            priority: 70,
            icon: patternTip.icon,
            title: `💡 نصيحة لنمط "${pa.pattern}"`,
            message: patternTip.tip,
            action: null,
            context: 'نصيحة حسب النمط'
          });
        }
      }
    }

    return tips;
  }
  // === Contextual Tips Data (Task 1.2) ===
  const CONTEXTUAL_TIPS = {
    // ══ Pain Tips ══
    pain: {
      no_strategy: {
        emoji: '🧭',
        msg: 'فهمتك... شركتك تشتغل بدون بوصلة واضحة',
        points: [
          'بدون خطة، القرارات تكون ردّات فعل — مو خيارات استراتيجية',
          '72% من الشركات الصغيرة اللي تفشل ما كان عندها رؤية مكتوبة',
          'الخبر الحلو: ستارتكس راح يساعدك تبني خطة خطوة بخطوة'
        ],
        tool: { name: 'التخطيط الاستراتيجي', icon: '🗺️' }
      },
      no_measurement: {
        emoji: '📊',
        msg: 'أكبر مشكلة: "ما تقدر تحسّن شي ما تقدر تقيسه"',
        points: [
          'بدون مؤشرات أداء، ما تعرف هل أنت تتقدم أو تتراجع',
          'أول خطوة: حدد 3-5 مؤشرات بسيطة ومربوطة بأهدافك',
          'ستارتكس يعطيك Dashboard لحظي يوريك صحة شركتك'
        ],
        tool: { name: 'مؤشرات الأداء KPIs', icon: '📈' }
      },
      plan_vs_execution: {
        emoji: '🔄',
        msg: 'المشكلة المعتادة: خطط كثيرة والتنفيذ ضعيف',
        points: [
          'الفجوة بين الخطة والتنفيذ عادةً سببها: غياب المتابعة الدورية',
          'الحل: حوّل كل هدف لمبادرات صغيرة ومشاريع بمواعيد واضحة',
          'نظام التنفيذ في ستارتكس يربط الأهداف بالمهام اليومية'
        ],
        tool: { name: 'إدارة المبادرات', icon: '🚀' }
      },
      team_alignment: {
        emoji: '👥',
        msg: 'فريقك مو على نفس الموجة — وهذا يبطّئ كل شي',
        points: [
          'لما كل قسم يشتغل لحاله، تضيع الموارد وتتكرر الجهود',
          'المحاذاة تبدأ بمشاركة الأهداف — الكل يعرف "ليش نسوي هالشي"',
          'ستارتكس يوزّع الأهداف على الإدارات ويربط الكل برؤية واحدة'
        ],
        tool: { name: 'محاذاة الفرق', icon: '🤝' }
      },
      market_pressure: {
        emoji: '⚡',
        msg: 'المنافسة تشتد — وأنت تحتاج تعرف موقعك بالضبط',
        points: [
          'بدون تحليل تنافسي، ردّات فعلك تكون متأخرة ومكلفة',
          'تحليل SWOT + Porter يعطيك صورة واضحة عن موقعك في السوق',
          'ستارتكس يساعدك تكتشف التهديدات قبل ما توصلك'
        ],
        tool: { name: 'التحليل التنافسي', icon: '🔍' }
      },
      growth_stuck: {
        emoji: '📉',
        msg: 'النمو توقف — لازم نعرف السبب الجذري',
        points: [
          'النمو المتوقف غالباً سببه: السوق تغير أو النموذج ما يتوسع',
          'أول خطوة: تشخيص شامل — SWOT + تحليل المنافسين + مراجعة مالية',
          'ستارتكس يعطيك أدوات التشخيص المناسبة لوضعك'
        ],
        tool: { name: 'التشخيص الشامل', icon: '🔬' }
      }
    },
    // ══ Ambition Tips ══
    amb: {
      clear_strategy: {
        emoji: '🗺️',
        msg: 'ممتاز! الخطة الواضحة = قرارات أسرع وأذكى',
        points: [
          'الخطة الجيدة: رؤية + أهداف + مؤشرات + مبادرات = نظام متكامل',
          'ابدأ بالتشخيص (SWOT) → حدد توجهات → ضع أهداف SMART',
          'ستارتكس يمشيك بالترتيب — ما تحتاج تضيع وقت تفكر وش الخطوة'
        ],
        tool: { name: 'البناء الاستراتيجي', icon: '🏗️' }
      },
      data_decisions: {
        emoji: '📈',
        msg: 'القرارات بالبيانات > القرارات بالحدس',
        points: [
          'حدد KPIs واضحة → قِسها دورياً → خذ قرارات مبنية على أرقام',
          'Dashboard واحد يغنيك عن 10 اجتماعات "وش آخر الأخبار؟"',
          'نظام التنبيهات الذكي يخبرك لما تحتاج تتحرك — قبل فوات الأوان'
        ],
        tool: { name: 'لوحة المؤشرات', icon: '📊' }
      },
      team_ownership: {
        emoji: '🤝',
        msg: 'الفريق المتحمس = تنفيذ أقوى 10 مرات',
        points: [
          'المسؤولية الواضحة = كل واحد يعرف "أنا مسؤول عن وش بالضبط"',
          'شارك الفريق في وضع الأهداف — اللي يشارك في القرار يلتزم فيه',
          'المراجعات الدورية تحوّل المساءلة من "عقاب" إلى "تطوير"'
        ],
        tool: { name: 'توزيع المسؤوليات', icon: '👥' }
      },
      market_lead: {
        emoji: '🏆',
        msg: 'التفوق التنافسي يبدأ بفهم السوق بعمق',
        points: [
          'اعرف منافسيك — نقاط قوتهم وضعفهم وتحركاتهم الأخيرة',
          'ابحث عن "الفجوة" اللي ما أحد يملأها — هذي فرصتك الذهبية',
          'تحليل Porter + PESTEL يعطونك خارطة السوق الكاملة'
        ],
        tool: { name: 'التحليل التنافسي', icon: '🔍' }
      },
      sustainable_growth: {
        emoji: '🌱',
        msg: 'النمو المدروس > النمو السريع',
        points: [
          'النمو العشوائي يأكل الموارد. النمو المُخطط يبني قيمة',
          'حدد 2-3 فرص نمو واستثمر فيها — لا تشتت مواردك',
          'تابع مؤشرات النمو شهرياً — وعدّل المسار قبل فوات الأوان'
        ],
        tool: { name: 'تخطيط النمو', icon: '📈' }
      },
      execution_machine: {
        emoji: '⚙️',
        msg: 'من "نقول بنسوي" إلى "سوينا وانتهينا" ✓',
        points: [
          'حوّل كل هدف لمبادرة → كل مبادرة لمشروع → كل مشروع لمهام',
          'المتابعة اليومية/الأسبوعية هي سر الفرق اللي تنفّذ',
          'ستارتكس يتابع التأخيرات ويطلق تنبيهات تلقائية'
        ],
        tool: { name: 'نظام التنفيذ', icon: '🚀' }
      }
    }
  };

  // === Feedback Storage ===
  function saveFeedback(type, key, isPositive) {
    try {
      const feedbackStore = JSON.parse(localStorage.getItem('aiAdvisorFeedback') || '{}');
      if (!feedbackStore[type]) feedbackStore[type] = {};
      feedbackStore[type][key] = { positive: isPositive, timestamp: Date.now() };
      localStorage.setItem('aiAdvisorFeedback', JSON.stringify(feedbackStore));
    } catch (e) { /* ignore */ }
  }

  // === Contextual Tip Element ===
  let ctxTipEl = null;
  let ctxTipTimeout = null;

  function showContextualTip(type, key) {
    const tips = CONTEXTUAL_TIPS[type];
    if (!tips || !tips[key]) return;
    const tip = tips[key];

    // Remove existing tip
    hideContextualTip();
    hideNudge();

    const el = document.createElement('div');
    el.className = 'ai-ctx-tip';
    el.innerHTML = `
            <div class="ai-ctx-tip-header">
                <div class="ai-ctx-tip-avatar">🤖</div>
                <div class="ai-ctx-tip-label">المستشار الذكي يحلل اختيارك...</div>
                <button class="ai-ctx-tip-close" onclick="window.__aiAdvisor.hideCtxTip()">✕</button>
            </div>
            <div class="ai-ctx-tip-body">
                <div class="ai-ctx-tip-msg">${tip.emoji} ${tip.msg}</div>
                <ul class="ai-ctx-tip-points">
                    ${tip.points.map(p => `<li><span class="tip-bullet">▸</span><span>${p}</span></li>`).join('')}
                </ul>
                ${tip.tool ? `
                <div class="ai-ctx-tip-tool">
                    <span>${tip.tool.icon}</span>
                    <span>الأداة المقترحة:</span>
                    <span class="tool-name">${tip.tool.name}</span>
                </div>` : ''}
            </div>
            <div class="ai-ctx-tip-footer">
                <div class="ai-ctx-tip-feedback">
                    <button class="ai-ctx-tip-fb-btn positive" onclick="window.__aiAdvisor.feedbackTip('${type}','${key}',true,this)">
                        ✓ مفيد
                    </button>
                    <button class="ai-ctx-tip-fb-btn negative" onclick="window.__aiAdvisor.feedbackTip('${type}','${key}',false,this)">
                        ✗ غير مفيد
                    </button>
                </div>
                <button class="ai-ctx-tip-dismiss" onclick="window.__aiAdvisor.hideCtxTip()">إخفاء</button>
            </div>
        `;

    document.body.appendChild(el);
    ctxTipEl = el;

    // Auto-dismiss after 15 seconds
    ctxTipTimeout = setTimeout(hideContextualTip, 15000);
  }

  function hideContextualTip() {
    if (ctxTipTimeout) clearTimeout(ctxTipTimeout);
    if (ctxTipEl && ctxTipEl.parentNode) {
      ctxTipEl.style.animation = 'ai-ctx-tip-out 0.3s ease forwards';
      setTimeout(() => {
        if (ctxTipEl && ctxTipEl.parentNode) ctxTipEl.remove();
        ctxTipEl = null;
      }, 300);
    } else {
      ctxTipEl = null;
    }
  }

  function feedbackTip(type, key, isPositive, btnEl) {
    saveFeedback(type, key, isPositive);
    // Visual feedback
    const container = btnEl.parentElement;
    container.querySelectorAll('.ai-ctx-tip-fb-btn').forEach(b => {
      b.classList.remove('active');
      b.style.opacity = '0.4';
    });
    btnEl.classList.add('active');
    btnEl.style.opacity = '1';
    // Dismiss after 2 seconds
    setTimeout(hideContextualTip, 2000);
  }

  // === Pattern Diagnosis Card (Task 1.3) ===
  let diagEl = null;
  let diagTimeout = null;

  function showPatternDiagnosis(data) {
    if (!data || !data.patternName) return;

    // Remove existing tips/diagnosis
    hideContextualTip();
    hidePatternDiagnosis();
    hideNudge();

    const el = document.createElement('div');
    el.className = 'ai-ctx-tip';
    el.style.borderColor = data.patternColor + '55';
    el.style.maxWidth = '420px';
    el.innerHTML = `
      <div class="ai-ctx-tip-header" style="border-bottom-color:${data.patternColor}15">
        <div class="ai-ctx-tip-avatar">🤖</div>
        <div class="ai-ctx-tip-label" style="color:${data.patternColor}">🔗 المستشار يربط تحدياتك بطموحاتك...</div>
        <button class="ai-ctx-tip-close" onclick="window.__aiAdvisor.hideDiagnosis()">✕</button>
      </div>
      <div class="ai-ctx-tip-body">
        <!-- الربط -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <span style="background:rgba(239,68,68,0.1);color:#ef4444;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600">
            😓 ${data.pains.slice(0, 2).join('، ')}
          </span>
          <span style="font-size:16px;color:#64748b">←→</span>
          <span style="background:rgba(34,197,94,0.1);color:#22c55e;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600">
            🎯 ${data.ambs.slice(0, 2).join('، ')}
          </span>
        </div>

        <!-- النمط -->
        <div style="background:${data.patternColor}10;border:1.5px solid ${data.patternColor}30;border-radius:14px;padding:14px 16px;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span style="font-size:28px">${data.patternEmoji}</span>
            <div>
              <div style="font-size:11px;color:#64748b;margin-bottom:2px">النمط المُكتشف</div>
              <div style="font-size:16px;font-weight:800;color:${data.patternColor}">${data.patternName}</div>
            </div>
          </div>
          <div style="font-size:13px;color:#94a3b8;line-height:1.7">${data.patternTip}</div>
        </div>

        <!-- رسالة المستشار -->
        <div style="font-size:12.5px;color:#a78bfa;font-weight:600;line-height:1.6;display:flex;align-items:flex-start;gap:8px">
          <span style="flex-shrink:0">💡</span>
          <span>أكمل معلومات شركتك في الخطوة التالية — وراح أجهّز لك مسار مخصص بناءً على نمطك!</span>
        </div>
      </div>
      <div class="ai-ctx-tip-footer" style="justify-content:center">
        <button class="ai-ctx-tip-dismiss" onclick="window.__aiAdvisor.hideDiagnosis()" style="font-size:12px;color:#64748b">
          فهمت ✓ — أكمل
        </button>
      </div>
    `;

    document.body.appendChild(el);
    diagEl = el;

    // Auto-dismiss after 20 seconds
    diagTimeout = setTimeout(hidePatternDiagnosis, 20000);
  }

  function hidePatternDiagnosis() {
    if (diagTimeout) clearTimeout(diagTimeout);
    if (diagEl && diagEl.parentNode) {
      diagEl.style.animation = 'ai-ctx-tip-out 0.3s ease forwards';
      setTimeout(() => {
        if (diagEl && diagEl.parentNode) diagEl.remove();
        diagEl = null;
      }, 300);
    } else {
      diagEl = null;
    }
  }

  // ✅ [REFACTOR] Async initialization to get user from API
  async function initializeAdvisor() {
    try {
      user = await window.api.getCurrentUser();
      if (!user) {
        console.log('[AI-Advisor] No authenticated user. Advisor will not run.');
        return;
      }
      entityId = user.entityId || user.entity?.id || user.activeEntityId || '';
      console.log('[AI-Advisor] Init:', { currentPage, entityId: entityId || 'NONE', hasUser: !!user });

      const excludedPages = ['/login.html', '/signup.html', '/landing.html', '/'];
      if (excludedPages.includes(window.location.pathname)) return;

      document.body.appendChild(fab);
      document.body.appendChild(overlay);
      document.body.appendChild(panel);
      setTimeout(fetchContext, 2000);
      setInterval(fetchContext, REFRESH_INTERVAL);
    } catch (e) { /* ignore */ }
  }
  // === دالة إضافة اقتراح من المستشار للتحليل ===
  function applySuggestion(sectionKey, text, chipEl) {
    if (!text || chipEl.classList.contains('added')) return;

    const colorMap = {
      political: '#ef4444', economic: '#22c55e', social: '#3b82f6',
      technological: '#8b5cf6', environmental: '#10b981', legal: '#f59e0b',
      strengths: '#22c55e', weaknesses: '#ef4444', opportunities: '#3b82f6', threats: '#f59e0b',
      rivalry: '#ef4444', newEntrants: '#f97316', substitutes: '#eab308',
      supplierPower: '#3b82f6', buyerPower: '#8b5cf6',
      eliminate: '#ef4444', reduce: '#f97316', raise: '#3b82f6', create: '#22c55e',
      inbound: '#3b82f6', operations: '#f97316', outbound: '#22c55e',
      marketing: '#8b5cf6', service: '#ef4444',
      so: '#22c55e', wo: '#3b82f6', st: '#f97316', wt: '#ef4444'
    };
    const color = colorMap[sectionKey] || '#667eea';

    // تحقق: هل يمكن الإضافة المباشرة؟ (يحتاج versionId + addItem)
    const hasVersion = typeof window.state !== 'undefined' && window.state?.versionId;
    const hasAddItem = typeof window.addItem === 'function';

    if (hasAddItem && hasVersion) {
      chipEl.classList.add('adding');
      chipEl.innerHTML = `⏳ جاري الإضافة...`;

      try {
        const result = window.addItem(sectionKey, text, color);
        if (result && typeof result.then === 'function') {
          result.then(() => {
            chipEl.classList.remove('adding');
            chipEl.classList.add('added');
            chipEl.innerHTML = `✓ ${text}`;
            chipEl.disabled = true;
          }).catch(() => {
            chipEl.classList.remove('adding');
            fillInput(sectionKey, text, chipEl);
          });
        } else {
          chipEl.classList.remove('adding');
          chipEl.classList.add('added');
          chipEl.innerHTML = `✓ ${text}`;
          chipEl.disabled = true;
        }
      } catch (e) {
        chipEl.classList.remove('adding');
        fillInput(sectionKey, text, chipEl);
      }
    } else {
      // لا يوجد نسخة مختارة → ننسخ النص في الحقل
      fillInput(sectionKey, text, chipEl);
    }
  }

  function fillInput(sectionKey, text, chipEl) {
    const input = document.getElementById(`input-${sectionKey}`);
    if (input) {
      input.value = text;
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // highlight animation
      input.style.transition = 'box-shadow 0.3s';
      input.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.5)';
      setTimeout(() => { input.style.boxShadow = ''; }, 2000);
      chipEl.classList.add('added');
      chipEl.innerHTML = `📋 ${text}`;
      chipEl.disabled = true;
      showToast({ icon: '📋', title: 'تم النسخ', message: 'النص جاهز في الحقل — اضغط Enter أو + لإضافته' });
    } else {
      showToast({ icon: '⚠️', title: 'خطأ', message: 'لم يتم العثور على حقل الإدخال' });
    }
  }

  // API عامة (يمكن استدعاؤها من صفحات أخرى)
  window.__aiAdvisor = {
    open: openPanel,
    close: closePanel,
    hideNudge: hideNudge,
    refresh: fetchContext,
    showToast: showToast,
    // Task 1.2: عرض نصيحة سياقية عند اختيار ألم/طموح
    showContextualTip: showContextualTip,
    hideCtxTip: hideContextualTip,
    feedbackTip: feedbackTip,
    // Task 1.3: تشخيص النمط وربط الألم بالطموح
    showPatternDiagnosis: showPatternDiagnosis,
    hideDiagnosis: hidePatternDiagnosis,
    // اقتراحات الأدوات
    applySuggestion: applySuggestion,
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

  // Run initialization
  initializeAdvisor();
})();
