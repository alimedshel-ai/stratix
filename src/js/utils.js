// src/js/utils.js - دوال مساعدة موحدة للنظام

window.callApi = async function (url, options = {}) {
    const { method = 'GET', body } = options;

    // إذا كان api.js قد تم تحميله وفر window.apiCall، استخدمه للاستفادة من الـ interceptors
    if (typeof window.apiCall === 'function') {
        return await window.apiCall(url, { method, body });
    }

    // fallback آمن ومباشر
    const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
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

// دالة التحقق من الجلسة (Auth Check)
window.validateUserSession = async function () {
    if (window.user) return window.user;

    try {
        const res = await fetch('/api/user/me', { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            window.user = data;
            return data;
        } else {
            window.location.href = '/login.html';
            return null;
        }
    } catch (e) {
        window.location.href = '/login.html';
        return null;
    }
};

// ── دالة API مع مهلة زمنية (موحدة لجميع الصفحات) ──
window.callApiWithTimeout = async function (url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const finalOptions = { ...options, signal: controller.signal };
        const result = await window.callApi(url, finalOptions);
        clearTimeout(timeout);
        return result;
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') throw new Error('انتهت مهلة الاتصال بالخادم');
        throw err;
    }
};

// ── دالة Toast موحدة ──
window.showGlobalToast = function (msg, type = 'success') {
    const containerId = 'globalToastContainer';
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const colors = { success: 'rgba(34,197,94,0.95)', error: 'rgba(239,68,68,0.95)', warn: 'rgba(250,204,21,0.95)' };
    const icons = { success: 'check-circle', error: 'x-circle', warn: 'exclamation-triangle' };
    toast.style.cssText = `background:${colors[type] || colors.success};color:white;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;margin-top:8px;display:flex;align-items:center;gap:8px;animation:slideUp 0.3s ease;`;
    toast.innerHTML = `<i class="bi bi-${icons[type] || icons.success}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
};
