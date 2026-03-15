/**
 * 🔓 Dev Bypass Auth — تخطي تسجيل الدخول للتطوير
 * يحط token + user وهمي في localStorage عشان ما يرجعك لصفحة الدخول
 * ========================================================
 * ⚠️ احذف هذا الملف أو عطّله قبل النشر (Production)
 * ========================================================
 */
(function devBypassAuth() {
    // لا تطبق إذا المستخدم فعلاً مسجل
    if (localStorage.getItem('token') && localStorage.getItem('user')) return;

    console.warn('🔓 [DEV] Auth bypass active — auto-login with dev credentials');

    // Token وهمي
    localStorage.setItem('token', 'httponly-managed');

    // مستخدم وهمي بصلاحيات كاملة
    const devUser = {
        id: 'dev-user-001',
        name: 'مطور — وضع التطوير',
        email: 'dev@stratix.local',
        role: 'OWNER',
        systemRole: 'USER',
        userType: 'COMPANY_MANAGER',
        entity: { id: 'dev-entity-001', name: 'شركة التطوير' },
        activeEntityId: 'dev-entity-001',
    };

    localStorage.setItem('user', JSON.stringify(devUser));
})();
