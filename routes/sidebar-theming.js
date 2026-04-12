/**
 * Startix Sidebar Theming Engine
 * يطبق هوية بصرية مخصصة للشريط الجانبي حسب قسم المدير الحالي
 */
window.SidebarTheming = (function () {
    // مصدر الحقيقة للألوان والأيقونات
    const DEPT_THEMES = {
        'finance': { name: 'المالية', icon: '💰', color: '#f59e0b' },
        'marketing': { name: 'التسويق', icon: '📢', color: '#8b5cf6' },
        'operations': { name: 'العمليات', icon: '⚙️', color: '#3b82f6' },
        'hr': { name: 'الموارد البشرية', icon: '👥', color: '#10b981' },
        'tech': { name: 'التقنية', icon: '💻', color: '#06b6d4' },
        'sales': { name: 'المبيعات', icon: '📈', color: '#ef4444' },
        'cs': { name: 'خدمة العملاء', icon: '🎧', color: '#ec4899' },
        'legal': { name: 'القانونية', icon: '⚖️', color: '#6366f1' },
        'support': { name: 'الخدمات المساندة', icon: '🛠️', color: '#64748b' },
        'quality': { name: 'الجودة', icon: '✅', color: '#10b981' },
        'compliance': { name: 'الامتثال', icon: '🛡️', color: '#6366f1' },
    };

    function hexToRgb(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    }

    /**
     * يطبق الهوية البصرية على الشريط الجانبي
     * @param {HTMLElement} sidebarElement - عنصر الشريط الجانبي
     * @param {object} user - كائن المستخدم الحالي من API
     */
    function applyTheme(sidebarElement, user) {
        if (!sidebarElement || !user) return;

        // 1. إعادة تعيين أي هوية سابقة
        document.documentElement.style.removeProperty('--sidebar-accent-color');
        document.documentElement.style.removeProperty('--sidebar-accent-color-rgb');
        const existingBadge = sidebarElement.querySelector('.sidebar-dept-badge');
        if (existingBadge) existingBadge.remove();

        // 2. التحقق من أن المستخدم مدير إدارة
        if (user.userType !== 'DEPT_MANAGER' || !user.deptCode) {
            return;
        }

        const theme = DEPT_THEMES[user.deptCode.toLowerCase()];
        if (!theme) return;

        // 3. حقن متغيرات CSS باللون الجديد
        document.documentElement.style.setProperty('--sidebar-accent-color', theme.color);
        const rgb = hexToRgb(theme.color);
        if (rgb) {
            document.documentElement.style.setProperty('--sidebar-accent-color-rgb', rgb);
        }

        // 4. إنشاء وحقن "شارة القسم"
        const badge = document.createElement('div');
        badge.className = 'sidebar-dept-badge';
        badge.innerHTML = `
            <div class="dept-badge-icon" style="background: ${theme.color};">${theme.icon}</div>
            <div class="dept-badge-info">
                <div class="dept-badge-label" style="color: ${theme.color};">إدارة</div>
                <div class="dept-badge-name">${theme.name}</div>
            </div>
        `;

        // حقن الشارة بعد قسم المستخدم مباشرة
        const userProfileSection = sidebarElement.querySelector('.sidebar-user');
        if (userProfileSection && userProfileSection.nextSibling) {
            userProfileSection.parentNode.insertBefore(badge, userProfileSection.nextSibling);
        } else {
            sidebarElement.prepend(badge);
        }
    }

    return { applyTheme };
})();