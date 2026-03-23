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
    const hasEntity = !!user.entity || !!user.companyId; // التأكد المطلق من الكيان
    const onboardingDone = user.onboardingCompleted || false;

    // 1. مدراء النظام
    if (sysRole === 'SUPER_ADMIN' || sysRole === 'ADMIN' || role === 'ADMIN') {
        return '/admin-dashboard.html';
    }

    // 2. مستخدم جديد لم يكمل التأسيس
    if (!hasEntity || !onboardingDone) {
        // إذا كان المستخدم جديداً ولكننا نعرف مساره مسبقاً (سجل عبر التشخيص)، نرسله لإكمال التأسيس بدلاً من إعادة اختياره للمسار
        if (uType === 'COMPANY_MANAGER' || uType === 'DEPT_MANAGER' || uType === 'BOARD_VIEWER' || (uCategory && uCategory !== 'EXPLORER')) {
            return '/onboarding.html';
        }
        return '/select-type.html';
    }

    // 3. التوجيه الديناميكي للداشبورد المخصص
    if (uCategory.startsWith('INVESTOR')) return '/investor-dashboard.html';
    if (uType === 'CONSULTANT' || uCategory.startsWith('CONSULTANT')) return '/consultant-dashboard.html';
    if (uCategory.startsWith('BOARD_')) return '/board-dashboard.html';

    // 🛡️ مدير الإدارة: يذهب لـ dept-dashboard فقط إذا كان غير OWNER/ADMIN
    // OWNER/ADMIN قد يملكون userCategory='DEPT_*' لكنهم يجب أن يذهبوا للـ CEO dashboard
    const isPrivilegedRole = role === 'OWNER' || role === 'ADMIN' || sysRole === 'SUPER_ADMIN';
    if (!isPrivilegedRole && (uType === 'DEPT_MANAGER' || uCategory.startsWith('DEPT_') || user.department?.key)) {
        return '/dept-dashboard.html';
    }

    if (['INDIVIDUAL', 'PERSONAL', 'CAREER'].includes(uCategory)) return '/individual-dashboard.html';

    // الأفراد بدون إدارة محددة (على مستوى الشركة)
    if (role === 'VIEWER' || role === 'DATA_ENTRY') return '/viewer-hub.html';

    // 4. الافتراضي الجذري (أصحاب الأعمال - CEOs)
    const size = user.entity?.size?.toLowerCase() || '';
    if (['large', 'enterprise', 'medium'].includes(size)) {
        return '/ceo-dashboard.html';
    }

    return '/ceo-dashboard.html';
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
    if (data.user.entityId) {
        localStorage.setItem('entityId', data.user.entityId);
    }
    if (data.token) {
        localStorage.setItem('token', data.token);
    } else {
        localStorage.setItem('token', 'secure-cookie-active'); // لتجنب إعادة التوجيه اللانهائية في الصفحات القديمة
    }

    // حساب الوجهة بناءً على الخصائص الأمنية
    const targetUrl = getRoutingDestination(data.user);
    console.log(`[Auth Handler] User successfully authenticated. Routing to: ${targetUrl}`);

    // التأكد التام من أمان الوجهة قبل التنفيذ الخطير
    if (isSafeRedirect(targetUrl)) {
        window.location.href = targetUrl;
    } else {
        console.error('🚨 السيرفر: محاولة التوجيه لمسار غير آمن رُفضت (Unsafe redirectTo blocked):', targetUrl);
        window.location.href = '/select-type.html';
    }
}
