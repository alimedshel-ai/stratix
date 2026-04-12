/**
 * js/dept-guard.js
 * ════════════════════════════════════════════════════════════════
 * حارس موحّد لكل صفحات مسار مدير الإدارة
 *
 * الاستخدام في كل صفحة — مباشرة بعد <body>:
 *
 *   صفحة خاصة بقسم محدد (مثل hr-audit):
 *     <script>window.__REQUIRED_DEPT = 'HR';</script>
 *     <script src="/js/dept-guard.js"></script>
 *
 *   صفحة عامة للأقسام (مثل dept-diagnostic):
 *     <script src="/js/dept-guard.js"></script>
 *
 * القواعد:
 *   ✅ DEPT_MANAGER — قسمه فقط
 *   🔄 مالك / مدير تنفيذي → ceo-dashboard.html (مسارهم المستقل)
 *   ❌ أي دور آخر → login.html
 * ════════════════════════════════════════════════════════════════
 */
(function () {
    document.body.style.visibility = 'hidden';

    const REQUIRED_DEPT = (window.__REQUIRED_DEPT || '').toUpperCase();
    const OWNER_TYPES = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_MANAGER', 'EXEC_MANAGER'];

    fetch('/api/auth/me', { credentials: 'include' })
        .then(function (r) { return r.ok ? r.json() : Promise.reject('unauth'); })
        .then(function (data) {
            var user = data.user || data;
            var uType = (user.userType || '').toUpperCase();
            var deptFromToken = (user.deptCode || '').toUpperCase();

            // ── المالك / المدير التنفيذي → مسموح له الدخول للتحليل والرقابة ───────────
            if (OWNER_TYPES.indexOf(uType) !== -1 ||
                (user.systemRole && /admin|supervisor/i.test(user.systemRole))) {
                // ✅ المالك مسموح له بمشاهدة وتحليل أي إدارة
                window.__currentUser = user;
                document.body.style.visibility = '';
                return;
            }

            // ── مدير إدارة فقط ───────────────────────────────────────────
            if (uType !== 'DEPT_MANAGER') {
                window.location.replace('/login.html');
                return;
            }

            if (!deptFromToken) {
                // توكن بدون قسم — غير صالح
                window.location.replace('/login.html');
                return;
            }

            // ── صفحة خاصة بقسم محدد (مثل hr-audit) ─────────────────────
            if (REQUIRED_DEPT && deptFromToken !== REQUIRED_DEPT) {
                // مدير قسم آخر يحاول الدخول → أعده للوحته
                window.location.replace('/dept-dashboard.html?dept=' + deptFromToken.toLowerCase());
                return;
            }

            // ── صفحة عامة: تحقق من ?dept= في URL ────────────────────────
            if (!REQUIRED_DEPT) {
                var urlParams = new URLSearchParams(window.location.search);
                var deptFromURL = (urlParams.get('dept') || '').toUpperCase();

                if (deptFromURL && deptFromURL !== deptFromToken) {
                    // يحاول قسم آخر → صحح الرابط
                    var fixed = new URL(window.location.href);
                    fixed.searchParams.set('dept', deptFromToken.toLowerCase());
                    window.location.replace(fixed.toString());
                    return;
                }

                if (!deptFromURL) {
                    // أضف القسم للرابط تلقائياً
                    var withDept = new URL(window.location.href);
                    withDept.searchParams.set('dept', deptFromToken.toLowerCase());
                    window.location.replace(withDept.toString());
                    return;
                }
            }

            // ✅ كل شيء صحيح
            window.__currentUser = user;
            document.body.style.visibility = '';
        })
        .catch(function () {
            window.location.replace('/login.html');
        });
})();
