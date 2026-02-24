/**
 * ستارتكيس — مركز الإشعارات
 * يُحمّل في أي صفحة: <script src="/js/notifications.js"></script>
 * يضيف جرس الإشعارات تلقائياً في الهيدر/السايدبار
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'startix_notifications';
    const SEEN_KEY = 'startix_notif_seen';

    // === Default/Demo Notifications ===
    function getDefaultNotifications() {
        return [
            { id: 'n1', type: 'kpi_alert', title: 'مؤشر أداء منخفض', message: 'مؤشر "رضا العملاء" انخفض لـ 68% — أقل من المستهدف 80%', icon: '📉', color: '#ef4444', time: getRelativeTime(15), link: '/kpis.html', urgent: true },
            { id: 'n2', type: 'task_due', title: 'مهمة متأخرة', message: 'مهمة "تحديث الموقع الإلكتروني" تأخرت 3 أيام عن الموعد', icon: '⏰', color: '#f59e0b', time: getRelativeTime(45), link: '/tasks.html', urgent: true },
            { id: 'n3', type: 'review_due', title: 'مراجعة دورية قادمة', message: 'موعد مراجعة الربع الأول بعد 5 أيام — جهّز التقارير', icon: '📋', color: '#667eea', time: getRelativeTime(120), link: '/reviews.html', urgent: false },
            { id: 'n4', type: 'system', title: 'تحليل ذكي جاهز', message: 'النظام أكمل تحليل SWOT — 3 توصيات جديدة بانتظارك', icon: '🤖', color: '#8b5cf6', time: getRelativeTime(180), link: '/intelligence.html', urgent: false },
            { id: 'n5', type: 'achievement', title: 'إنجاز جديد! 🏆', message: 'حصلت على شارة "الخطوة الأولى" — +10 نقاط', icon: '🏆', color: '#facc15', time: getRelativeTime(5), link: '/achievements.html', urgent: false },
            { id: 'n6', type: 'initiative', title: 'تحديث مبادرة', message: 'مبادرة "التوسع الإقليمي" وصلت 75% من الإنجاز', icon: '🚀', color: '#22c55e', time: getRelativeTime(300), link: '/initiatives.html', urgent: false },
        ];
    }

    function getRelativeTime(minutesAgo) {
        const d = new Date(Date.now() - minutesAgo * 60000);
        return d.toISOString();
    }

    function formatTime(isoStr) {
        const diff = Math.floor((Date.now() - new Date(isoStr)) / 60000);
        if (diff < 1) return 'الآن';
        if (diff < 60) return `منذ ${diff} دقيقة`;
        if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`;
        return `منذ ${Math.floor(diff / 1440)} يوم`;
    }

    // === Storage ===
    function getNotifications() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return JSON.parse(stored);
        } catch { }
        const defaults = getDefaultNotifications();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
    }

    function getSeenIds() {
        try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; }
    }

    function markSeen(id) {
        const seen = getSeenIds();
        if (!seen.includes(id)) { seen.push(id); localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); }
        updateBadge();
    }

    function markAllSeen() {
        const all = getNotifications().map(n => n.id);
        localStorage.setItem(SEEN_KEY, JSON.stringify(all));
        updateBadge();
    }

    function getUnseenCount() {
        const notifs = getNotifications();
        const seen = getSeenIds();
        return notifs.filter(n => !seen.includes(n.id)).length;
    }

    function addNotification(notif) {
        const notifs = getNotifications();
        notif.id = notif.id || 'n_' + Date.now();
        notif.time = notif.time || new Date().toISOString();
        notifs.unshift(notif);
        if (notifs.length > 50) notifs.length = 50;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
        updateBadge();
        return notif;
    }

    // === INJECT BELL ICON ===
    function injectBell() {
        // Wait for DOM to be ready
        setTimeout(() => {
            // Try to find sidebar header or top area
            const sidebar = document.querySelector('.sidebar-nav, .sidebar, aside');

            // Inject floating bell if no sidebar
            const bell = document.createElement('div');
            bell.id = 'notifBell';
            bell.innerHTML = `
        <style>
          #notifBell { position:fixed; top:16px; left:16px; z-index:99990; }
          .notif-bell-btn { width:44px; height:44px; border-radius:14px; background:rgba(23,26,42,0.95); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.3s; color:#e2e8f0; font-size:20px; position:relative; }
          .notif-bell-btn:hover { background:rgba(30,34,54,0.95); transform:scale(1.05); border-color:rgba(102,126,234,0.3); }
          .notif-badge { position:absolute; top:-4px; right:-4px; width:20px; height:20px; border-radius:50%; background:#ef4444; color:white; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; border:2px solid var(--bg,#0a0b10); animation:notifPulse 2s infinite; }
          .notif-badge.hidden { display:none; }
          @keyframes notifPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }

          /* Panel */
          .notif-panel { position:fixed; top:0; left:0; width:380px; height:100vh; background:rgba(18,20,31,0.98); backdrop-filter:blur(16px); border-right:1px solid rgba(255,255,255,0.06); z-index:99999; transform:translateX(-110%); transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1); display:flex; flex-direction:column; }
          .notif-panel.open { transform:translateX(0); }
          .notif-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:99998; opacity:0; visibility:hidden; transition:all 0.3s; }
          .notif-overlay.open { opacity:1; visibility:visible; }

          .notif-panel-header { padding:20px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; }
          .notif-panel-title { font-size:18px; font-weight:800; display:flex; align-items:center; gap:8px; }
          .notif-panel-actions { display:flex; gap:8px; }
          .notif-panel-btn { background:rgba(255,255,255,0.05); border:none; color:#94a3b8; padding:6px 10px; border-radius:8px; cursor:pointer; font-family:inherit; font-size:11px; transition:all 0.2s; }
          .notif-panel-btn:hover { background:rgba(255,255,255,0.1); color:#e2e8f0; }

          .notif-list { flex:1; overflow-y:auto; padding:8px; }
          .notif-item { display:flex; gap:12px; padding:14px 12px; border-radius:12px; cursor:pointer; transition:all 0.2s; margin-bottom:4px; border:1px solid transparent; }
          .notif-item:hover { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.06); }
          .notif-item.unseen { background:rgba(102,126,234,0.04); border-color:rgba(102,126,234,0.1); }
          .notif-item.urgent .notif-icon-wrap { animation:notifShake 0.5s ease; }
          @keyframes notifShake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-5deg)} 75%{transform:rotate(5deg)} }
          .notif-icon-wrap { width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
          .notif-body { flex:1; min-width:0; }
          .notif-item-title { font-size:13px; font-weight:700; margin-bottom:2px; }
          .notif-item-msg { font-size:12px; color:#94a3b8; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
          .notif-item-time { font-size:10px; color:#64748b; margin-top:4px; display:flex; align-items:center; gap:4px; }
          .notif-dot { width:8px; height:8px; border-radius:50%; background:#667eea; flex-shrink:0; margin-top:4px; }
          .notif-dot.seen { opacity:0; }

          .notif-empty { text-align:center; padding:60px 20px; color:#64748b; }
          .notif-empty i { font-size:40px; display:block; margin-bottom:12px; opacity:0.3; }

          @media(max-width:500px) { .notif-panel { width:100%; } }
        </style>
        <div class="notif-bell-btn" onclick="toggleNotifPanel()">
          <i class="bi bi-bell"></i>
          <span class="notif-badge ${getUnseenCount() === 0 ? 'hidden' : ''}" id="notifBadge">${getUnseenCount()}</span>
        </div>
      `;
            document.body.appendChild(bell);

            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'notif-overlay';
            overlay.id = 'notifOverlay';
            overlay.onclick = () => toggleNotifPanel(false);
            document.body.appendChild(overlay);

            // Create panel
            const panel = document.createElement('div');
            panel.className = 'notif-panel';
            panel.id = 'notifPanel';
            panel.innerHTML = `
        <div class="notif-panel-header">
          <div class="notif-panel-title"><i class="bi bi-bell"></i> الإشعارات</div>
          <div class="notif-panel-actions">
            <button class="notif-panel-btn" onclick="markAllSeenUI()"><i class="bi bi-check2-all"></i> قراءة الكل</button>
            <button class="notif-panel-btn" onclick="toggleNotifPanel(false)"><i class="bi bi-x-lg"></i></button>
          </div>
        </div>
        <div class="notif-list" id="notifList"></div>
      `;
            document.body.appendChild(panel);

            renderNotifList();
        }, 300);
    }

    // === Render notification list ===
    window.renderNotifList = function () {
        const list = document.getElementById('notifList');
        if (!list) return;
        const notifs = getNotifications();
        const seen = getSeenIds();

        if (notifs.length === 0) {
            list.innerHTML = '<div class="notif-empty"><i class="bi bi-bell-slash"></i>لا توجد إشعارات</div>';
            return;
        }

        list.innerHTML = notifs.map(n => `
      <div class="notif-item ${seen.includes(n.id) ? '' : 'unseen'} ${n.urgent ? 'urgent' : ''}" onclick="handleNotifClick('${n.id}','${n.link || ''}')">
        <div class="notif-dot ${seen.includes(n.id) ? 'seen' : ''}"></div>
        <div class="notif-icon-wrap" style="background:${n.color}15;color:${n.color}">${n.icon}</div>
        <div class="notif-body">
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-msg">${n.message}</div>
          <div class="notif-item-time"><i class="bi bi-clock"></i> ${formatTime(n.time)}</div>
        </div>
      </div>
    `).join('');
    };

    window.handleNotifClick = function (id, link) {
        markSeen(id);
        renderNotifList();
        if (link) window.location.href = link;
    };

    window.markAllSeenUI = function () {
        markAllSeen();
        renderNotifList();
    };

    window.toggleNotifPanel = function (forceState) {
        const panel = document.getElementById('notifPanel');
        const overlay = document.getElementById('notifOverlay');
        if (!panel) return;
        const isOpen = typeof forceState === 'boolean' ? forceState : !panel.classList.contains('open');
        panel.classList.toggle('open', isOpen);
        overlay.classList.toggle('open', isOpen);
    };

    function updateBadge() {
        const badge = document.getElementById('notifBadge');
        if (!badge) return;
        const count = getUnseenCount();
        badge.textContent = count;
        badge.classList.toggle('hidden', count === 0);
    }

    // === Expose API ===
    window.StartixNotifications = {
        add: addNotification,
        getAll: getNotifications,
        markSeen,
        markAllSeen,
        getUnseenCount,
    };

    // Auto-inject
    injectBell();

})();
