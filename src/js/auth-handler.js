// src/assets/js/auth-handler.js

/**
 * التحقق من أمان الـ redirect (Open Redirect Prevention)
 * يسمح فقط بالمسارات النسبية داخل التطبيق (يمنع الروابط الخارجية أو حقن جافاسكربت)
 */
function isSafeRedirect(url) {
    if (!url || typeof url !== 'string') return false;
    // التأكد من أن المسار يبدأ بـ '/' وليس تعليمة '//' خارجية أو 'http'
    return url.startsWith('/') && !url.startsWith('//') && !url.startsWith('\\');
}

/**
 * دالة موحدة لحساب مسار التوجيه بناءً على بيانات المستخدم القادمة من السيرفر
 */
function getRoutingDestination(user) {
    if (!user) return '/select-type.html';

    const role = user.role || 'VIEWER';
    const sysRole = user.systemRole || 'USER';
    const uType = user.userType || 'EXPLORER';
    const uCategory = user.userCategory || '';
    const hasEntity = !!user.entity || !!user.companyId;
    const onboardingDone = user.onboardingCompleted || false;

    // 1. مدير النظام العام
    if (sysRole === 'SUPER_ADMIN' || sysRole === 'ADMIN' || role === 'ADMIN') {
        return '/admin-dashboard.html';
    }

    // 2. مستخدم جديد لم يكمل التأسيس
    if (!hasEntity || !onboardingDone) {
        if (uType === 'COMPANY_MANAGER' || uType === 'DEPT_MANAGER' || uType === 'BOARD_VIEWER' || (uCategory && uCategory !== 'EXPLORER')) {
            return '/onboarding.html';
        }
        return '/select-type.html';
    }

    // 3. توجيه حسب نوع المستفيد
    if (uCategory.startsWith('INVESTOR')) return '/investor-dashboard.html';
    if (uType === 'CONSULTANT' || uCategory.startsWith('CONSULTANT')) return '/consultant-dashboard.html';
    if (uCategory.startsWith('BOARD_')) return '/board-dashboard.html';
    if (role === 'VIEWER' || role === 'DATA_ENTRY') return '/viewer-hub.html';

    // 4. مدير الإدارة (EDITOR + DEPT_MANAGER)
    // 🛡️ آمن الآن: server.js يضمن OWNER/ADMIN → COMPANY_MANAGER (لا تعارض)
    if (uType === 'DEPT_MANAGER') return '/dept-dashboard.html';

    // 5. مالك الشركة / مدير عام (OWNER + COMPANY_MANAGER)
    if (uType === 'COMPANY_MANAGER' || role === 'OWNER') return '/ceo-dashboard.html';

    // 6. الافتراضي: المركز الاستراتيجي العام
    return '/dashboard.html';
}



/**
 * معالجة الاستجابة بعد نجاح تسجيل الدخول أو إنشاء حساب
 * @param {Object} data - البيانات العائدة من الـ API (يُفترض أن تحوي {user, token})
 */
function handleAuthResponse(data) {
    if (!data || !data.user) {
        console.error('Invalid auth response or missing user object', data);
        window.location.href = '/select-type.html'; // Fallback آمن 
        return;
    }

    // 🧹 التنظيف الأمني: شطب آثار التشخيص فقط إذا كان المستخدم قد أكمل التأسيس مسبقاً
    if (data.user && data.user.onboardingCompleted) {
        const oldPayload = localStorage.getItem('stratix_diagnostic_payload');
        if (oldPayload) {
            console.warn('Authentication Cleanup: Removing old diagnostic payload');
            localStorage.removeItem('stratix_diagnostic_payload');
        }
        localStorage.removeItem('painAmbition');
    }
    localStorage.removeItem('onboarding_completed'); // ضروري عند اختبار أكثر من حساب لتجنب تخطي الأونبوردنج

    // 🔄 ضمان تطابق الجلسات مع الصفحات القديمة (Data Bleed Fix)
    localStorage.setItem('user', JSON.stringify(data.user));
    window.user = data.user;

    if (data.user.entityId) {
        localStorage.setItem('entityId', data.user.entityId);
    }
    if (data.token) {
        localStorage.setItem('token', data.token);
    } else {
        localStorage.setItem('token', 'secure-cookie-active'); // لتجنب إعادة التوجيه اللانهائية في الصفحات القديمة
    }

    // 🚀 توجيه المالك والمدراء باستخدام محرك السياق الذكي الجديد 
    if (window.Context && typeof window.Context.redirectAfterLogin === 'function') {
        console.log('[Auth Handler] Delegating routing to Context.redirectAfterLogin()');
        window.Context.redirectAfterLogin();
        return;
    }

    // حساب الوجهة بناءً على الخصائص الأمنية
    const targetUrl = getRoutingDestination(data.user);
    console.log(`[Auth Handler] User successfully authenticated. Fallback routing to: ${targetUrl}`);

    // التأكد التام من أمان الوجهة قبل التنفيذ الخطير
    if (isSafeRedirect(targetUrl)) {
        window.location.href = targetUrl;
    } else {
        console.error('🚨 السيرفر: محاولة التوجيه لمسار غير آمن رُفضت (Unsafe redirectTo blocked):', targetUrl);
        window.location.href = '/select-type.html';
    }
}
