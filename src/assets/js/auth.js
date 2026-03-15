// Shared auth utilities
// ⚠️ التوكن الآن في HttpOnly Cookie — لا يُمكن قراءته من الفرونتند
// هذه الدالة تبقى للتوافق مع الصفحات القديمة
function getToken() {
    return localStorage.getItem('token') || '';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedVersionId');
    // 🔒 مسح HttpOnly Cookie من السيرفر
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
        .catch(() => { })
        .finally(() => {
            window.location.href = '/login.html';
        });
}

// 🔒 فحص هل المستخدم مسجل دخول عبر طلب للسيرفر
async function checkAuth() {
    try {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
        return res.ok;
    } catch {
        return false;
    }
}
