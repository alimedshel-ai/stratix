// sidebar.js — Shared sidebar navigation for all pages
(function () {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    const navItems = [
        { href: '/dashboard.html', icon: 'bi-grid-1x2-fill', label: 'لوحة القيادة' },
        { href: '/analysis.html', icon: 'bi-bar-chart-fill', label: 'استوديو الاستراتيجية' },
        { href: '/objectives.html', icon: 'bi-bullseye', label: 'الأهداف الاستراتيجية' },
        { href: '/kpis.html', icon: 'bi-speedometer2', label: 'المؤشرات' },
        { href: '/initiatives.html', icon: 'bi-rocket-takeoff', label: 'المبادرات' },
        { href: '/reviews.html', icon: 'bi-clipboard-check', label: 'المراجعات' },
        { href: '/ai-center.html', icon: 'bi-lightning-charge-fill', label: 'مركز الذكاء' },
        { href: '/inspector.html', icon: 'bi-search', label: 'مفتش النظام' },
    ];

    const bottomItems = [
        { href: '/entities.html', icon: 'bi-building', label: 'الكيانات' },
        { href: '/users.html', icon: 'bi-people', label: 'المستخدمين' },
        { href: '/settings.html', icon: 'bi-gear-fill', label: 'الإعدادات' },
    ];

    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Build sidebar HTML
    let html = '<div class="brand-logo">ستارتكيس</div>';

    navItems.forEach(item => {
        const isActive = currentPage === item.href.replace('/', '');
        html += `<a href="${item.href}" class="nav-item ${isActive ? 'active' : ''}"><i class="bi ${item.icon}"></i> ${item.label}</a>`;
    });

    html += '<div style="margin-top: auto;">';
    bottomItems.forEach(item => {
        const isActive = currentPage === item.href.replace('/', '');
        html += `<a href="${item.href}" class="nav-item ${isActive ? 'active' : ''}"><i class="bi ${item.icon}"></i> ${item.label}</a>`;
    });
    html += '<a href="/login.html" class="nav-item text-danger" onclick="localStorage.clear()"><i class="bi bi-box-arrow-right"></i> تسجيل الخروج</a>';
    html += '</div>';

    sidebar.innerHTML = html;
    // Progress placeholder
    const prog = document.createElement('div');
    prog.id = 'sidebarProgress';
    prog.style.padding = '12px';
    prog.style.borderTop = '1px solid rgba(255,255,255,0.04)';
    prog.style.marginTop = '12px';
    prog.style.fontSize = '13px';
    prog.textContent = 'جارٍ تحميل التقدم...';
    sidebar.appendChild(prog);

    // Fetch and render strategy progress (uses /api/user-progress)
    async function loadProgress() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = localStorage.getItem('token');
            const entityId = user?.entity?.id || localStorage.getItem('entityId');
            if (!entityId) {
                prog.textContent = 'حدد الكيان لعرض التقدم';
                return;
            }

            const res = await fetch(`/api/user-progress/entity/${entityId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) {
                prog.textContent = 'فشل تحميل التقدم';
                return;
            }
            const data = await res.json();
            const overall = data.overall || 0;
            const current = data.stages.find(s => !s.completed) || data.stages[data.stages.length - 1] || null;
            const next = data.stages.find(s => !s.completed && s.id !== (current && current.id)) || null;

            prog.innerHTML = `<div style="font-weight:700;margin-bottom:6px">تقدم الاستراتيجية — ${overall}%</div>` +
                `<div style="height:8px;background:rgba(255,255,255,0.06);border-radius:6px;overflow:hidden;margin-bottom:6px"><div style="width:${overall}%;height:100%;background:linear-gradient(90deg,var(--primary),var(--secondary))"></div></div>` +
                `<div style="font-size:12px;color:var(--text-muted)">` +
                `${current ? `أنت هنا: ${current.nameAr}` : ''}` +
                `${next ? ` — التالي: ${next.nameAr}` : ''}` +
                `</div>`;
        } catch (e) {
            prog.textContent = 'خطأ عند جلب التقدم';
        }
    }

    loadProgress();
})();
