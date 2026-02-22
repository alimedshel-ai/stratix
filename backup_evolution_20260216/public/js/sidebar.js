/**
 * Unified Sidebar Component
 * يُحقن في كل الصفحات لتوحيد القائمة الجانبية
 */
(function () {
    const currentPath = window.location.pathname;

    const menuItems = [
        { href: '/dashboard', icon: 'bi-speedometer2', label: 'لوحة التحكم' },
        { href: '/sectors', icon: 'bi-diagram-3', label: 'القطاعات' },
        { href: '/industries', icon: 'bi-grid', label: 'الأنشطة' },
        { href: '/entities', icon: 'bi-building', label: 'الكيانات' },
        { href: '/users', icon: 'bi-people', label: 'المستخدمون' },
        { href: '/assessments', icon: 'bi-clipboard-check', label: 'التقييمات' },
        { href: '/kpis', icon: 'bi-graph-up', label: 'المؤشرات' },
        { divider: true },
        { href: '/versions', icon: 'bi-clock-history', label: 'إصدارات الاستراتيجية' },
        { href: '/choices', icon: 'bi-signpost-split', label: 'الخيارات والمخاطر' },
        { href: '/corrections', icon: 'bi-tools', label: 'التصحيحات' },
        { href: '/analysis', icon: 'bi-lightbulb', label: 'التحليل الاستراتيجي' },
        { href: '/financial', icon: 'bi-cash-stack', label: 'القرارات المالية' },
        { href: '/integrations', icon: 'bi-plug', label: 'التكاملات' },
        { divider: true },
        { href: '/settings', icon: 'bi-gear', label: 'الإعدادات' }
    ];

    function isActive(href) {
        if (href === '/dashboard' && (currentPath === '/dashboard' || currentPath === '/')) return true;
        if (href !== '/dashboard' && currentPath.startsWith(href)) return true;
        return false;
    }

    function renderSidebar() {
        const container = document.getElementById('unified-sidebar');
        if (!container) return;

        let html = '';
        menuItems.forEach(item => {
            if (item.divider) {
                html += '<hr style="margin:8px 16px;border-color:rgba(0,0,0,0.1);">';
                return;
            }
            const active = isActive(item.href) ? 'active' : '';
            html += `<a href="${item.href}" class="${active}"><i class="bi ${item.icon}"></i> ${item.label}</a>`;
        });

        container.innerHTML = html;
    }

    // Inject sidebar styles if not already present
    function injectStyles() {
        if (document.getElementById('unified-sidebar-styles')) return;

        const style = document.createElement('style');
        style.id = 'unified-sidebar-styles';
        style.textContent = `
      #unified-sidebar {
        position: fixed;
        right: 0;
        top: 0;
        width: 250px;
        height: 100vh;
        background: #fff;
        box-shadow: -2px 0 10px rgba(0,0,0,0.1);
        padding-top: 55px;
        z-index: 100;
        overflow-y: auto;
      }
      #unified-sidebar a {
        display: block;
        padding: 11px 20px;
        color: #555;
        text-decoration: none;
        transition: all 0.3s;
        font-size: 0.9rem;
      }
      #unified-sidebar a:hover {
        background: #667eea;
        color: #fff;
      }
      #unified-sidebar a.active {
        background: #667eea;
        color: #fff;
        font-weight: 600;
      }
      #unified-sidebar a i {
        margin-left: 8px;
        width: 20px;
        text-align: center;
      }

      .unified-top-bar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 50px;
        background: rgba(255,255,255,0.97);
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        z-index: 200;
      }
      .unified-top-bar .brand {
        font-weight: 700;
        font-size: 1.1rem;
        color: #667eea;
      }

      .unified-main-content {
        margin-right: 250px;
        padding: 20px;
        margin-top: 60px;
      }

      @media (max-width: 768px) {
        #unified-sidebar {
          width: 200px;
        }
        .unified-main-content {
          margin-right: 200px;
        }
      }
    `;
        document.head.appendChild(style);
    }

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { injectStyles(); renderSidebar(); });
    } else {
        injectStyles();
        renderSidebar();
    }
})();
