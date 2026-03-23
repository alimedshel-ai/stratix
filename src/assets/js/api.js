// ============================================================
// api.js – النسخة النهائية (بعد جميع التصحيحات)
// ============================================================

let _cachedUser = null;
let _userFetchPromise = null;

// -----------------------------------------------------------------
// دوال مساعدة أمنية
// -----------------------------------------------------------------
function escapeHtml(str) {
    if (str == null) return '';
    const s = String(str);
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function safeText(str) {
    return document.createTextNode(str || '');
}

// -----------------------------------------------------------------
// 1. دوال المستخدم (بدون localStorage)
// -----------------------------------------------------------------
async function getCurrentUser() {
    if (_cachedUser) return _cachedUser;
    if (_userFetchPromise) return _userFetchPromise;

    _userFetchPromise = (async () => {
        try {
            const res = await fetch('/api/user/me', { credentials: 'include' });
            if (!res.ok) {
                const err = await res.json();
                if (res.status === 403 && err.reason) {
                    window.location.href = `/suspended.html?reason=${encodeURIComponent(err.reason)}`;
                    throw new Error('Account suspended');
                }
                return null;
            }
            _cachedUser = await res.json();
            return _cachedUser;
        } catch (err) {
            console.error('getCurrentUser failed', err);
            if (err.message === 'Account suspended') throw err;
            return null;
        } finally {
            _userFetchPromise = null;
        }
    })();
    return _userFetchPromise;
}

function getUserData() {
    return _cachedUser || {};
}

// -----------------------------------------------------------------
// 2. دوال API الموحدة
// -----------------------------------------------------------------
async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (response.status === 401) {
        throw new Error('Unauthorized');
    }

    if (response.status === 403) {
        const err = await response.json();
        if (err.reason) {
            window.location.href = `/suspended.html?reason=${encodeURIComponent(err.reason)}`;
            throw new Error('Account suspended');
        }
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
        return text;
    }

    const data = await response.json();
    if (!response.ok) {
        const err = new Error(data.message || `HTTP ${response.status}`);
        err.status = response.status;
        err.data = data;
        throw err;
    }
    return data;
}

// تعريف window.api للتوافق مع الكود القديم
window.api = {
    get: (endpoint, options) => api(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body) => api(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => api(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => api(endpoint, { method: 'DELETE' }),
    request: api,
    getCurrentUser: getCurrentUser,
    getUserData: getUserData
};

// تعريف الاسم البديل الجديد الذي تم استخدامه في جميع الصفحات
window.apiRequest = (...args) => window.fetch(...args);

// -----------------------------------------------------------------
// 3. دوال UI (بانر الكيان والدور)
// -----------------------------------------------------------------
async function showEntityBanner() {
    const user = await getCurrentUser();
    if (!user || !user.entity) return;

    const orgName = user.entity.legalName || user.entity.displayName || user.entity.name;
    const container = document.getElementById('entity-banner');
    if (!container) return;

    container.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'stx-eb-name';
    div.appendChild(document.createTextNode(orgName));
    container.appendChild(div);
}

async function injectRoleContextBanner() {
    const user = await getCurrentUser();
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const dept = urlParams.get('dept');
    const isDeptManager = user.userType === 'DEPT_MANAGER';

    if (dept && isDeptManager) {
        const DEPT_NAMES = {
            hr: 'الموارد البشرية',
            finance: 'المالية',
            marketing: 'التسويق',
            operations: 'العمليات',
            sales: 'المبيعات',
            compliance: 'الامتثال',
            support: 'الخدمات المساندة'
        };
        const VALID_DEPTS = new Set(Object.keys(DEPT_NAMES));
        const safeDept = VALID_DEPTS.has(dept) ? DEPT_NAMES[dept] : 'غير محدد';
        const bannerDiv = document.getElementById('role-context-banner');
        if (bannerDiv) {
            bannerDiv.textContent = `بيانات قسم [${safeDept}]`;
        }
    }
}

function enforceRoleUI() {
    const user = getUserData();
    const role = user.userType;
    if (role === 'VIEWER') {
        document.querySelectorAll('.data-entry-only').forEach(el => el.style.display = 'none');
    } else if (role === 'DATA_ENTRY') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
}

// -----------------------------------------------------------------
// 4. تسجيل الخروج الآمن (يمسح الكوكيز من السيرفر)
// -----------------------------------------------------------------
window.globalLogout = async function () {
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
        console.warn('Logout API failed, proceeding to clear local data.');
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login.html';
};

// -----------------------------------------------------------------
// 4. تهيئة الصفحة
// -----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await showEntityBanner();
        await injectRoleContextBanner();
        enforceRoleUI();
    } catch (err) {
        console.warn('Failed to load user context', err);
    }

    // التقاط أي نقرة لتسجيل الخروج عالمياً لتنظيف הגلسات
    document.body.addEventListener('click', async (e) => {
        const target = e.target.closest('[data-action="logout"], .logout-btn, #logout-btn');
        if (target) {
            e.preventDefault();
            e.stopPropagation();
            if (window.globalLogout) {
                await window.globalLogout();
            }
        }
    });
});

// -----------------------------------------------------------------
// 5. تصدير للاختبارات
// -----------------------------------------------------------------
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getCurrentUser, getUserData, api, escapeHtml };
}


// Monkeypatch global fetch to automatically include credentials for internal APIs
const originalFetch = window.fetch;
window.fetch = async function () {
    let [resource, config] = arguments;
    if (!config) config = {};

    const urlStr = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
    const isInternal = urlStr.includes('/api/');
    if (isInternal) {
        config.credentials = 'include';
        // Avoid sending 'null' as Bearer token if it got pulled from empty localStorage
        if (config.headers) {
            if (config.headers instanceof Headers) {
                const auth = config.headers.get('Authorization');
                if (auth && (auth === 'Bearer null' || auth === 'Bearer ')) {
                    config.headers.delete('Authorization');
                }
            } else {
                const auth = config.headers['Authorization'] || config.headers['authorization'];
                if (auth && (auth === 'Bearer null' || auth === 'Bearer ')) {
                    delete config.headers['Authorization'];
                    delete config.headers['authorization'];
                }
            }
        }
    }

    // Also patch resource if it's a Request object with headers
    if (resource instanceof Request && isInternal) {
        const auth = resource.headers.get('Authorization');
        if (auth && (auth === 'Bearer null' || auth === 'Bearer ')) {
            resource.headers.delete('Authorization');
        }
    }

    const response = await originalFetch.call(this, resource, config);

    // 🛑 الحل الجذري المركزي: أي طلب داخلي يرجع 401 يطرد المستخدم فوراً دون تعارض
    if (isInternal && response.status === 401 && !window.location.pathname.includes('/login.html')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html?session_expired=true';
    }

    return response;
};
