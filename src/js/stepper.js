(function () {
    const STEPS = [
        { id: 'swot', label: 'SWOT', href: '/swot.html', icon: 'bi-grid-3x3' },
        { id: 'tows', label: 'TOWS', href: '/tows.html', icon: 'bi-intersect' },
        { id: 'directions', label: 'التوجهات', href: '/directions.html', icon: '🧭' },
        { id: 'choices', label: 'الخيارات', href: '/choices.html', icon: '⚖️', ceoOnly: true },
        { id: 'objectives', label: 'الأهداف', href: '/objectives.html', icon: '🎯' },
        { id: 'kpis', label: 'المؤشرات', href: '/kpis.html', icon: '📊' },
        { id: 'initiatives', label: 'المبادرات', href: '/initiatives.html', icon: '🚀' }
    ];

    // تصدير الدالة لتحديث الحالة يدوياً من الصفحات بعد الحفظ
    window.markStepperDone = function (stepId) {
        if (window.Context) {
            Context.setTemp(stepId + '_completed', true);
        }
    };

    document.addEventListener('DOMContentLoaded', async () => {
        const container = document.getElementById('planStepperContainer');
        if (!container) return;

        let isDept = false;
        if (window.Context) {
            isDept = Context.getUserType() === 'dept_manager';
        } else {
            const _dp = new URLSearchParams(window.location.search).get('dept');
            isDept = !!_dp;
        }

        const currentPath = window.location.pathname;

        // فلترة خطوة الخيارات لأنها تظهر فقط للإدارة العليا
        let filteredSteps = STEPS.filter(s => !(isDept && s.ceoOnly));

        // فحص حالة الخطوات بشكل غير متزامن
        const stepsStatus = await Promise.all(filteredSteps.map(async s => {
            let done = false;
            if (window.Context) {
                done = await Context.isStepCompleted(s.id);
            }
            return { ...s, done };
        }));

        const completedCount = stepsStatus.filter(s => s.done).length;

        const progressPct = Math.round((completedCount / filteredSteps.length) * 100);

        // ترويسة ذكية مع شريط تقدم
        let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="font-size:13px; font-weight:800; color:var(--text);">🗺️ مسار التخطيط الاستراتيجي</div>
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:11px; color:var(--text-muted); font-weight:600;">الإنجاز</span>
                <span style="font-size:12px; font-weight:800; color:${progressPct === 100 ? 'var(--success)' : 'var(--primary)'};">${progressPct}%</span>
            </div>
        </div>
        <div style="height:4px; background:rgba(255,255,255,0.06); border-radius:4px; margin-bottom:16px; overflow:hidden;">
            <div style="height:100%; width:${progressPct}%; background:linear-gradient(90deg, var(--primary), var(--secondary)); border-radius:4px; transition:width 0.5s ease;"></div>
        </div>
        `;

        html += '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">';

        let pastCurrent = false;

        stepsStatus.forEach((s, idx) => {
            const isCurrent = currentPath.includes(s.href.split('?')[0]);
            if (isCurrent) pastCurrent = true;
            const isDone = s.done && !isCurrent;

            // الألوان والدلالات البصرية المحسّنة
            const bg = isCurrent ? 'rgba(102,126,234,0.1)' : (isDone ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)');
            const border = isCurrent ? '2px solid rgba(102,126,234,0.4)' : (isDone ? '1px solid rgba(34,197,94,0.2)' : '1px dashed var(--border)');
            const color = isCurrent ? '#667eea' : (isDone ? '#22c55e' : 'var(--text-muted)');
            const shadow = isCurrent ? 'box-shadow:0 6px 15px rgba(102,126,234,0.15); transform: translateY(-2px);' : '';
            const suffix = isCurrent ? ' 📍' : (isDone ? ' ✅' : '');
            const iconHtml = s.icon.startsWith('bi-') ? `<i class="bi ${s.icon}"></i>` : s.icon;

            const targetHref = s.href + (_dp ? '?dept=' + _dp : '');

            html += `<a href="${targetHref}" title="${s.label}" style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;background:${bg};border:${border};text-decoration:none;flex:1;min-width:100px;transition:all 0.3s;${shadow}" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='${isCurrent ? 'translateY(-2px)' : 'none'}'">`;
            html += `<span style="font-size:16px;color:${color}">${iconHtml}</span>`;
            html += `<div style="font-size:11px;font-weight:${isCurrent ? '800' : '600'};color:${color};white-space:nowrap;">${s.label}${suffix}</div></a>`;

            if (idx < stepsStatus.length - 1) {
                html += `<div style="font-size:14px;color:${isDone ? 'var(--success)' : 'var(--border)'}; opacity:0.6;">←</div>`;
            }
        });
        html += '</div>';
        container.innerHTML = html;
    });
})();