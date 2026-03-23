/**
 * dept-theme.js — تطبيق هوية الإدارة ديناميكياً
 * أضفه في <head> كأول <script> في أي صفحة تدعم التخصيص بالإدارة
 *
 * يعمل عبر:
 *   ?dept=hr  في الـ URL
 *   أو  localStorage['stratix_v10_dept']
 */
(function applyDeptTheme() {
    const DEPT_CONFIG = {
        hr: { color: '#10b981', name: 'الموارد البشرية', icon: 'bi-people', emoji: '👥' },
        finance: { color: '#f59e0b', name: 'المالية', icon: 'bi-cash-coin', emoji: '💰' },
        marketing: { color: '#8b5cf6', name: 'التسويق', icon: 'bi-megaphone', emoji: '📣' },
        operations: { color: '#3b82f6', name: 'العمليات', icon: 'bi-gear', emoji: '⚙️' },
        sales: { color: '#ef4444', name: 'المبيعات', icon: 'bi-graph-up-arrow', emoji: '📈' },
        it: { color: '#06b6d4', name: 'تقنية المعلومات', icon: 'bi-laptop', emoji: '💻' },
        cs: { color: '#f97316', name: 'خدمة العملاء', icon: 'bi-headset', emoji: '🎧' },
        compliance: { color: '#dc2626', name: 'الامتثال', icon: 'bi-shield-check', emoji: '⚖️' },
        quality: { color: '#22c55e', name: 'الجودة', icon: 'bi-patch-check', emoji: '✅' },
        projects: { color: '#a855f7', name: 'إدارة المشاريع', icon: 'bi-kanban', emoji: '📋' },
        support: { color: '#64748b', name: 'الخدمات المساندة', icon: 'bi-wrench', emoji: '🔧' },
        legal: { color: '#6366f1', name: 'الشؤون القانونية', icon: 'bi-briefcase-fill', emoji: '📜' },
    };

    // تصدير الـ config عالمياً لاستخدامه في الصفحات الأخرى
    window.DEPT_CONFIG = DEPT_CONFIG;

    const urlParams = new URLSearchParams(window.location.search);
    let dept = urlParams.get('dept')
        || localStorage.getItem('stratix_v10_dept')
        || localStorage.getItem('stratix_dept');

    // ── fallback: بيانات المستخدم المخزّنة (لمديري الإدارات بلا URL param) ──
    if (!dept) {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            if (u.userType === 'DEPT_MANAGER' || (u.userCategory && u.userCategory.startsWith('DEPT_'))) {
                dept = u.department?.key
                    || (u.userCategory && u.userCategory.replace('DEPT_', '').toLowerCase())
                    || null;
            }
        } catch (e) { /* JSON parse error — ignore */ }
    }

    if (!dept || !DEPT_CONFIG[dept]) return;

    const cfg = DEPT_CONFIG[dept];
    window.currentDept = { key: dept, ...cfg };

    // ── 1) تطبيق CSS فوري (قبل DOMContentLoaded) ──────────────────
    document.documentElement.style.setProperty('--primary', cfg.color);
    document.documentElement.style.setProperty('--secondary', cfg.color);
    document.documentElement.style.setProperty('--accent', cfg.color);

    // ── 2) تحديثات DOM بعد التحميل ────────────────────────────────
    window.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('dept-themed');
        document.body.dataset.dept = dept;

        // العنوان الرئيسي h1 في .page-header
        const h1 = document.querySelector('.page-header h1');
        if (h1 && !h1.dataset.deptApplied) {
            const originalText = h1.textContent.trim();
            h1.innerHTML = `<i class="${cfg.icon}" style="color:${cfg.color}"></i> ${originalText} — <span style="color:${cfg.color}">${cfg.name}</span>`;
            h1.dataset.deptApplied = '1';
        }

        // breadcrumb إدارة إن وُجد
        const deptBreadcrumb = document.getElementById('deptBreadcrumb');
        if (deptBreadcrumb) {
            deptBreadcrumb.textContent = cfg.name;
            deptBreadcrumb.style.color = cfg.color;
        }

        // badge الإدارة في الـ header إن وُجد
        const deptBadge = document.getElementById('deptBadge');
        if (deptBadge) {
            deptBadge.textContent = `${cfg.emoji} ${cfg.name}`;
            deptBadge.style.background = cfg.color + '20';
            deptBadge.style.color = cfg.color;
            deptBadge.style.border = `1px solid ${cfg.color}40`;
            deptBadge.style.display = 'inline-block';
        }

        // الـ gradient في الـ top-nav والـ modal-header
        const gradientEls = document.querySelectorAll('.top-nav, .modal-header[data-dept-gradient]');
        gradientEls.forEach(el => {
            el.style.background = `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`;
        });

        // تحديث عنوان المتصفح
        const titleEl = document.querySelector('title');
        if (titleEl && !titleEl.dataset.deptApplied) {
            titleEl.textContent = titleEl.textContent.replace('ستارتكس - ', `ستارتكس — ${cfg.name} | `);
            titleEl.dataset.deptApplied = '1';
        }
    });

    // ── 3) helper: إنشاء deep-link محافظ على الـ dept في URL ──────
    window.deptLink = function (path) {
        return `${path}?dept=${dept}`;
    };

})();
