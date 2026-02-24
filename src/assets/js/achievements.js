/**
 * ستارتكس — نظام الإنجازات (Gamification)
 * يُستورد في أي صفحة: <script src="/js/achievements.js"></script>
 * يعتمد على sidebar.js (يُحمّل بعده)
 */
(function () {
    'use strict';

    // === تعريف الإنجازات ===
    const ACHIEVEMENTS = [
        // 🏁 البداية
        { id: 'first_login', title: 'الخطوة الأولى', desc: 'سجّلت دخولك لأول مرة', icon: 'bi-rocket-takeoff', category: 'start', points: 10 },
        { id: 'first_entity', title: 'مؤسس', desc: 'أنشأت أول كيان', icon: 'bi-building', category: 'start', points: 20 },
        { id: 'first_vision', title: 'صاحب رؤية', desc: 'حددت الرؤية والرسالة والقيم', icon: 'bi-compass', category: 'start', points: 20 },
        { id: 'journey_complete', title: 'رحّالة', desc: 'أكملت الرحلة الموجهة كاملة', icon: 'bi-map', category: 'start', points: 50 },

        // 🎯 الأهداف
        { id: 'first_objective', title: 'أول هدف', desc: 'أنشأت أول هدف استراتيجي', icon: 'bi-bullseye', category: 'strategy', points: 15 },
        { id: 'five_objectives', title: 'مخطط طموح', desc: 'أنشأت 5 أهداف استراتيجية', icon: 'bi-star-fill', category: 'strategy', points: 30 },
        { id: 'ten_objectives', title: 'استراتيجي محترف', desc: 'أنشأت 10 أهداف استراتيجية', icon: 'bi-gem', category: 'strategy', points: 50 },
        { id: 'bsc_complete', title: 'البطاقة المتوازنة', desc: 'أهداف في كل منظورات BSC الأربعة', icon: 'bi-bar-chart-line-fill', category: 'strategy', points: 40 },

        // 📈 المؤشرات
        { id: 'first_kpi', title: 'قياس أول', desc: 'أنشأت أول مؤشر أداء', icon: 'bi-graph-up-arrow', category: 'data', points: 15 },
        { id: 'first_kpi_entry', title: 'بيانات حية', desc: 'أدخلت أول قيمة فعلية لمؤشر', icon: 'bi-pencil-fill', category: 'data', points: 15 },
        { id: 'kpi_on_track', title: 'في المسار', desc: 'مؤشر وصل 100% من المستهدف', icon: 'bi-check-circle-fill', category: 'data', points: 25 },
        { id: 'ten_kpis', title: 'مراقب متمرس', desc: '10 مؤشرات أداء نشطة', icon: 'bi-clipboard-data-fill', category: 'data', points: 40 },

        // 🔬 التحليل
        { id: 'first_swot', title: 'محلل مبتدئ', desc: 'أكملت أول تحليل SWOT', icon: 'bi-search', category: 'analysis', points: 20 },
        { id: 'three_tools', title: 'محلل متقدم', desc: 'استخدمت 3 أدوات تحليل مختلفة', icon: 'bi-wrench-adjustable-circle-fill', category: 'analysis', points: 35 },
        { id: 'all_analyses', title: 'عالم استراتيجي', desc: 'استخدمت كل أدوات التحليل الـ 15', icon: 'bi-trophy-fill', category: 'analysis', points: 100 },

        // 🚀 التنفيذ
        { id: 'first_initiative', title: 'منفّذ', desc: 'أنشأت أول مبادرة', icon: 'bi-send-fill', category: 'execution', points: 15 },
        { id: 'first_project', title: 'مدير مشروع', desc: 'أنشأت أول مشروع', icon: 'bi-folder-fill', category: 'execution', points: 15 },
        { id: 'first_task_done', title: 'إنجاز أول', desc: 'أكملت أول مهمة', icon: 'bi-check2-square', category: 'execution', points: 10 },
        { id: 'ten_tasks_done', title: 'منجز متميز', desc: 'أكملت 10 مهام', icon: 'bi-stars', category: 'execution', points: 30 },

        // 🔄 المراجعات
        { id: 'first_review', title: 'مراجع', desc: 'أكملت أول مراجعة دورية', icon: 'bi-journal-check', category: 'review', points: 20 },
        { id: 'four_reviews', title: 'منضبط', desc: '4 مراجعات متتالية في الوقت', icon: 'bi-award-fill', category: 'review', points: 50 },

        // 👥 الفريق
        { id: 'invite_member', title: 'قائد فريق', desc: 'أضفت أول عضو للفريق', icon: 'bi-people-fill', category: 'team', points: 20 },
        { id: 'five_members', title: 'بانٍ', desc: 'فريق من 5 أعضاء', icon: 'bi-person-plus-fill', category: 'team', points: 35 },

        // 🏆 خاصة
        { id: 'week_streak', title: 'ملتزم', desc: 'دخلت المنصة 7 أيام متتالية', icon: 'bi-fire', category: 'special', points: 40 },
        { id: 'night_owl', title: 'بومة الليل', desc: 'عملت بعد منتصف الليل', icon: 'bi-moon-stars-fill', category: 'special', points: 10 },
        { id: 'early_bird', title: 'عصفور الصباح', desc: 'عملت قبل السادسة صباحاً', icon: 'bi-brightness-high-fill', category: 'special', points: 10 },
        { id: 'explorer', title: 'مستكشف', desc: 'زرت 20 صفحة مختلفة', icon: 'bi-signpost-split-fill', category: 'special', points: 25 },
    ];

    const CATEGORIES = {
        start: { label: 'البداية', color: '#667eea' },
        strategy: { label: 'الاستراتيجية', color: '#7c3aed' },
        data: { label: 'البيانات', color: '#0891b2' },
        analysis: { label: 'التحليل', color: '#d946ef' },
        execution: { label: 'التنفيذ', color: '#059669' },
        review: { label: 'المراجعات', color: '#ea580c' },
        team: { label: 'الفريق', color: '#2563eb' },
        special: { label: 'خاصة', color: '#f59e0b' },
    };

    // === Maturity Levels ===
    const LEVELS = [
        { name: 'مبتدئ', minPoints: 0, color: '#94a3b8', icon: 'bi-flower1', emoji: '🌱' },
        { name: 'مستكشف', minPoints: 50, color: '#38bdf8', icon: 'bi-binoculars-fill', emoji: '🔍' },
        { name: 'محلل', minPoints: 150, color: '#8b5cf6', icon: 'bi-bar-chart-fill', emoji: '📊' },
        { name: 'مخطط', minPoints: 300, color: '#667eea', icon: 'bi-crosshair', emoji: '🎯' },
        { name: 'منفذ', minPoints: 500, color: '#059669', icon: 'bi-rocket-takeoff-fill', emoji: '🚀' },
        { name: 'استراتيجي', minPoints: 750, color: '#f59e0b', icon: 'bi-gem', emoji: '💎' },
        { name: 'خبير', minPoints: 1000, color: '#ef4444', icon: 'bi-trophy-fill', emoji: '🏆' },
    ];

    // === Storage ===
    const STORAGE_KEY = 'startix_achievements';

    function getUnlocked() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
    }

    function saveUnlocked(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function getTotalPoints() {
        const unlocked = getUnlocked();
        let total = 0;
        ACHIEVEMENTS.forEach(a => { if (unlocked[a.id]) total += a.points; });
        return total;
    }

    function getCurrentLevel() {
        const points = getTotalPoints();
        let level = LEVELS[0];
        for (const l of LEVELS) { if (points >= l.minPoints) level = l; }
        return level;
    }

    function getNextLevel() {
        const points = getTotalPoints();
        for (const l of LEVELS) { if (points < l.minPoints) return l; }
        return null;
    }

    function getProgress() {
        const unlocked = Object.keys(getUnlocked()).length;
        return { unlocked, total: ACHIEVEMENTS.length, percent: Math.round(unlocked / ACHIEVEMENTS.length * 100) };
    }

    // === Unlock an achievement ===
    function unlock(achievementId) {
        const unlocked = getUnlocked();
        if (unlocked[achievementId]) return false; // Already unlocked

        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return false;

        unlocked[achievementId] = { unlockedAt: new Date().toISOString() };
        saveUnlocked(unlocked);

        // Show notification
        showAchievementPopup(achievement);

        return true;
    }

    // === Icon HTML Helper ===
    function iconHTML(icon, size) {
        size = size || '24px';
        return `<i class="bi ${icon}" style="font-size:${size}"></i>`;
    }

    // === Achievement Popup ===
    function showAchievementPopup(achievement) {
        const existing = document.getElementById('achievementPopup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'achievementPopup';
        popup.innerHTML = `
      <style>
        #achievementPopup { position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:100000; animation:achIn 0.6s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes achIn { from{opacity:0;transform:translateX(-50%) translateY(-30px) scale(0.8)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
        .ach-card { background:linear-gradient(135deg,#1a1d2e,#232640); border:2px solid rgba(250,204,21,0.3); border-radius:16px; padding:16px 24px; display:flex; align-items:center; gap:14px; box-shadow:0 8px 40px rgba(0,0,0,0.5),0 0 30px rgba(250,204,21,0.1); min-width:320px; }
        .ach-icon-wrap { font-size:36px; animation:achBounce 0.6s ease 0.3s; color:#facc15; }
        @keyframes achBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
        .ach-info { flex:1; }
        .ach-badge { font-size:10px; font-weight:700; color:#facc15; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
        .ach-name { font-size:16px; font-weight:800; color:#e2e8f0; }
        .ach-desc { font-size:12px; color:#94a3b8; }
        .ach-points { background:rgba(250,204,21,0.15); color:#facc15; padding:4px 12px; border-radius:20px; font-size:13px; font-weight:700; }
      </style>
      <div class="ach-card">
        <span class="ach-icon-wrap">${iconHTML(achievement.icon, '36px')}</span>
        <div class="ach-info">
          <div class="ach-badge">🏆 إنجاز جديد!</div>
          <div class="ach-name">${achievement.title}</div>
          <div class="ach-desc">${achievement.desc}</div>
        </div>
        <span class="ach-points">+${achievement.points}</span>
      </div>
    `;
        document.body.appendChild(popup);
        setTimeout(() => { popup.style.transition = 'all 0.4s ease'; popup.style.opacity = '0'; popup.style.transform = 'translateX(-50%) translateY(-20px)'; setTimeout(() => popup.remove(), 400); }, 4000);
    }

    // === Auto-check achievements ===
    function autoCheck() {
        const hour = new Date().getHours();

        // First login
        unlock('first_login');

        // Time-based
        if (hour >= 0 && hour < 5) unlock('night_owl');
        if (hour >= 4 && hour < 6) unlock('early_bird');

        // Page tracking
        const pages = JSON.parse(localStorage.getItem('startix_visited_pages') || '[]');
        const current = window.location.pathname;
        if (!pages.includes(current)) { pages.push(current); localStorage.setItem('startix_visited_pages', JSON.stringify(pages)); }
        if (pages.length >= 20) unlock('explorer');

        // Login streak
        const today = new Date().toDateString();
        let streak = JSON.parse(localStorage.getItem('startix_login_streak') || '{"days":[],"lastDate":""}');
        if (streak.lastDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (streak.lastDate === yesterday) { streak.days.push(today); } else { streak.days = [today]; }
            streak.lastDate = today;
            localStorage.setItem('startix_login_streak', JSON.stringify(streak));
        }
        if (streak.days.length >= 7) unlock('week_streak');
    }

    // === Level Badge for sidebar ===
    function injectLevelBadge() {
        const level = getCurrentLevel();
        const progress = getProgress();
        const nextLevel = getNextLevel();
        const points = getTotalPoints();

        // Find sidebar bottom to inject
        setTimeout(() => {
            const sidebar = document.querySelector('.sidebar-nav, .sidebar, aside');
            if (!sidebar) return;

            const badge = document.createElement('div');
            badge.id = 'achievementBadge';
            badge.style.cssText = 'padding:12px 16px;margin:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;cursor:pointer;transition:all 0.3s;';
            badge.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="font-size:22px;color:${level.color}">${iconHTML(level.icon, '22px')}</span>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:700;color:${level.color}">${level.name}</div>
            <div style="font-size:10px;color:#94a3b8">${points} نقطة — ${progress.unlocked}/${progress.total} إنجاز</div>
          </div>
        </div>
        <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${nextLevel ? ((points - getCurrentLevel().minPoints) / (nextLevel.minPoints - getCurrentLevel().minPoints) * 100) : 100}%;background:${level.color};border-radius:2px;transition:width 0.5s"></div>
        </div>
        ${nextLevel ? `<div style="font-size:9px;color:#7a8599;margin-top:4px;text-align:center">${nextLevel.minPoints - points} نقطة للمستوى التالي: ${iconHTML(nextLevel.icon, '11px')} ${nextLevel.name}</div>` : '<div style="font-size:9px;color:#f59e0b;margin-top:4px;text-align:center"><i class="bi bi-trophy-fill"></i> أعلى مستوى!</div>'}
      `;
            badge.onclick = () => window.location.href = '/achievements.html';
            badge.onmouseenter = () => { badge.style.background = 'rgba(255,255,255,0.06)'; badge.style.borderColor = level.color + '44'; };
            badge.onmouseleave = () => { badge.style.background = 'rgba(255,255,255,0.03)'; badge.style.borderColor = 'rgba(255,255,255,0.06)'; };
            sidebar.appendChild(badge);
        }, 500);
    }

    // === Expose API ===
    window.StartixAchievements = {
        unlock,
        getUnlocked,
        getTotalPoints,
        getCurrentLevel,
        getNextLevel,
        getProgress,
        iconHTML,
        ACHIEVEMENTS,
        CATEGORIES,
        LEVELS,
    };

    // Auto-run
    autoCheck();
    injectLevelBadge();

})();
