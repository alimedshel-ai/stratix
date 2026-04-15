/**
 * Startix — Smart Navigation Helper
 * يوجّه المستخدم للصفحة الصحيحة حسب دوره:
 *   المالك → company-health.html أو ceo-dashboard.html
 *   المدير المستقل → pro-dashboard.html
 *   مدير القسم الداخلي → dept-dashboard.html?dept=X
 */
(function() {
    'use strict';

    function isProManager() {
        try {
            // من API cache
            if (window._cachedUser?.isProManager === true) return true;
            // من localStorage user
            var u = JSON.parse(localStorage.getItem('user') || '{}');
            if (u.isProManager === true) return true;
            // من بيانات التشخيص المجاني
            if (localStorage.getItem('stratix_manager_diagnostic')) return true;
        } catch(e) {}
        return false;
    }

    function isOwner() {
        try {
            var diag = JSON.parse(localStorage.getItem('stratix_diagnostic_payload') || '{}');
            if (diag.category === 'owner' || diag.userType === 'OWNER') return true;
            var pa = JSON.parse(localStorage.getItem('painAmbition') || '{}');
            if (pa.category === 'owner') return true;
            var ut = localStorage.getItem('stratix_user_type');
            if (ut === 'BUSINESS') return true;
        } catch(e) {}
        return false;
    }

    /**
     * getHomeUrl — الصفحة الرئيسية حسب السياق:
     * إذا فيه dept → لوحة الإدارة (dept-dashboard) — الرجوع من أدوات الرحلة
     * إذا ما فيه dept → أعلى مستوى (pro-dashboard / ceo-dashboard / dashboard)
     */
    function getHomeUrl(dept) {
        if (dept) return '/dept-dashboard.html?dept=' + dept;
        if (isProManager()) return '/pro-dashboard.html';
        if (isOwner()) return '/ceo-dashboard.html';
        return '/dashboard.html';
    }

    /**
     * getDeptDashUrl — لوحة قيادة الإدارة (المستوى الثاني)
     * هذا هو الرابط اللي ترجع له من أي أداة في الرحلة
     */
    function getDeptDashUrl(dept) {
        return dept ? '/dept-dashboard.html?dept=' + dept : '/dashboard.html';
    }

    function getBackUrl(dept) {
        // من أدوات الرحلة → لوحة الإدارة (مو لوحة العملاء)
        return dept ? '/dept-dashboard.html?dept=' + dept : (isProManager() ? '/pro-dashboard.html' : '/dashboard.html');
    }

    function getHomeLabel() {
        if (isProManager()) return 'لوحة العملاء';
        return isOwner() ? 'لوحة القيادة' : 'لوحة الإدارة';
    }

    function getBackLabel() {
        return 'لوحة الإدارة';
    }

    /** getDeptDashLabel — عنوان لوحة الإدارة */
    function getDeptDashLabel() {
        return 'لوحة القيادة';
    }

    window.SmartNav = {
        isOwner: isOwner,
        isProManager: isProManager,
        getHomeUrl: getHomeUrl,
        getDeptDashUrl: getDeptDashUrl,
        getBackUrl: getBackUrl,
        getHomeLabel: getHomeLabel,
        getBackLabel: getBackLabel,
        getDeptDashLabel: getDeptDashLabel
    };
})();
