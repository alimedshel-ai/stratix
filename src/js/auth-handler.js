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
        // المدير المستقل: جاي من التشخيص المجاني → pro-dashboard مباشرة
        const diagCat = sessionStorage.getItem('diagnosticCategory');
        if (diagCat === 'manager') return '/pro-dashboard.html';

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

    // 4. مدير الإدارة (DEPT_MANAGER)
    // 🛡️ المستقل: role=OWNER (أنشأ entities بنفسه) → pro-dashboard دائماً
    // الداخلي: role≠OWNER (مدعو من المالك) → dept-dashboard
    if (uType === 'DEPT_MANAGER') {
      if (role === 'OWNER') return '/pro-dashboard.html'; // مدير مستقل (حتى لو عنده entity)
      return hasEntity ? '/dept-dashboard.html' : '/pro-dashboard.html';
    }

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

    // 🧹 التنظيف الأمني: شطب كل آثار الجلسة السابقة لمنع Data Bleed بين الحسابات
    // ⚠️ لا تمسح stratix_manager_diagnostic — بيانات التشخيص المجاني تُستخدم بعد التسجيل
    ['stratix_diagnostic_payload', 'painAmbition', 'stratix_user_type',
     'stratix_category', 'onboarding_completed', 'stratix_v10_dept',
     'stratix_return_url'].forEach(k => localStorage.removeItem(k));
    // إزالة كاش المستخدم القديم لمنع getUserRole() من قراءة بيانات الحساب السابق
    window._cachedUser = null;

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
