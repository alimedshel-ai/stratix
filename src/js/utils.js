// src/js/utils.js - دوال مساعدة موحدة للنظام

// -----------------------------------------------------------------
// دالة API مع مهلة زمنية (موحدة لجميع الصفحات)
// -----------------------------------------------------------------
window.callApiWithTimeout = async function (url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const finalOptions = { ...options, signal: controller.signal };
        // استخدام window.api.request إذا كان متاحاً، وإلا استخدم window.callApi (fallback)
        const requestFn = window.api?.request || window.callApi;
        const result = await requestFn(url, finalOptions);
        clearTimeout(timeout);
        return result;
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') throw new Error('انتهت مهلة الاتصال بالخادم');
        throw err;
    }
};

// -----------------------------------------------------------------
// إضافة كبسولة (chip) إلى أي حقل
// -----------------------------------------------------------------
window.addChip = function (containerId, text, targetId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const chip = document.createElement('span');
    chip.className = 'suggestion-chip';
    chip.textContent = text;
    chip.addEventListener('click', () => {
        const textarea = document.getElementById(targetId);
        if (!textarea) return;
        const current = textarea.value.trim();
        const newText = current ? (current.endsWith('،') || current.endsWith(',') ? current + ' ' + text : current + '، ' + text) : text;
        textarea.value = newText;
        chip.classList.add('chip-selected');
        setTimeout(() => chip.classList.remove('chip-selected'), 300);
    });
    container.appendChild(chip);
};

// -----------------------------------------------------------------
// تهيئة صفحة مدير الإدارة – تضمن تحميل المستخدم والقسم قبل أي عمل
// -----------------------------------------------------------------
window.initDeptPage = async function () {
    // 1. انتظار تحميل المستخدم (إذا لم يكن محملاً)
    if (!window._cachedUser && window.api?.getCurrentUser) {
        const user = await window.api.getCurrentUser().catch(() => null);
        if (!user) {
            // فشل تحميل المستخدم – إعادة توجيه لتسجيل الدخول
            window.location.href = '/login.html?session_expired=true';
            return null;
        }
    }
    // 2. الآن المستخدم موجود، نستدعي getDept() من Context
    const dept = window.Context?.getDept();
    if (!dept) {
        // لا يوجد قسم – إعادة توجيه للوحة الإدارة
        window.location.href = '/dept-dashboard.html';
        return null;
    }
    return dept;
};

// -----------------------------------------------------------------
// دالة Toast موحدة (تعمل حتى قبل DOMContentLoaded)
// -----------------------------------------------------------------
window.showGlobalToast = function (msg, type = 'success') {
    // التأكد من أن document.body موجود
    if (!document.body) {
        document.addEventListener('DOMContentLoaded', () => window.showGlobalToast(msg, type));
        return;
    }

    const containerId = 'globalToastContainer';
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;';
        document.body.appendChild(container);

        // إضافة CSS للـ animation إذا لم يكن موجوداً
        if (!document.getElementById('globalToastStyle')) {
            const style = document.createElement('style');
            style.id = 'globalToastStyle';
            style.textContent = `
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    const toast = document.createElement('div');
    const colors = { success: 'rgba(34,197,94,0.95)', error: 'rgba(239,68,68,0.95)', warn: 'rgba(250,204,21,0.95)', info: 'rgba(59,130,246,0.95)' };
    const icons = { success: 'check-circle', error: 'x-circle', warn: 'exclamation-triangle', info: 'info-circle' };
    toast.style.cssText = `background:${colors[type] || colors.success};color:white;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;margin-top:8px;display:flex;align-items:center;gap:8px;animation:slideUp 0.3s ease;box-shadow: 0 4px 12px rgba(0,0,0,0.15);`;
    toast.innerHTML = `<i class="bi bi-${icons[type] || icons.success}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
};

// -----------------------------------------------------------------
// (اختياري) دالة callApi الأساسية – يستخدمها window.api.request كـ fallback
// -----------------------------------------------------------------
window.callApi = async function (url, options = {}) {
    const { method = 'GET', body } = options;
    const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
        if (response.status === 401) {
            window.location.href = '/login.html?session_expired=true';
            return;
        }
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
};
