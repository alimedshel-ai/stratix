/**
 * Startix — Smart Navigation Helper
 * يوجّه المستخدم للصفحة الصحيحة حسب دوره:
 *   المالك → company-health.html أو ceo-dashboard.html
 *   مدير القسم → dept-dashboard.html?dept=X
 */
(function() {
    'use strict';

    function isOwner() {
        try {
            // من التشخيص
            var diag = JSON.parse(localStorage.getItem('stratix_diagnostic_payload') || '{}');
            if (diag.category === 'owner' || diag.userType === 'OWNER') return true;
            // من painAmbition
            var pa = JSON.parse(localStorage.getItem('painAmbition') || '{}');
            if (pa.category === 'owner') return true;
            // من user type
            var ut = localStorage.getItem('stratix_user_type');
            if (ut === 'BUSINESS') return true;
        } catch(e) {}
        return false;
    }

    function getHomeUrl(dept) {
        if (isOwner()) return '/ceo-dashboard.html';
        return dept ? '/dept-dashboard.html?dept=' + dept : '/dashboard.html';
    }

    function getBackUrl(dept) {
        if (isOwner()) return '/company-health.html';
        return dept ? '/dept-dashboard.html?dept=' + dept : '/dashboard.html';
    }

    function getHomeLabel() {
        return isOwner() ? 'لوحة القيادة' : 'لوحة الإدارة';
    }

    function getBackLabel() {
        return isOwner() ? 'صحة الشركة' : 'لوحة الإدارة';
    }

    window.SmartNav = {
        isOwner: isOwner,
        getHomeUrl: getHomeUrl,
        getBackUrl: getBackUrl,
        getHomeLabel: getHomeLabel,
        getBackLabel: getBackLabel
    };
})();
