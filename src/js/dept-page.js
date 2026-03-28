// js/dept-page.js - النسخة المعززة لمعالجة مزامنة البيانات
(function () {
    // إضافة CSS اللازم للـ toast
    if (!document.getElementById('dept-page-styles')) {
        const style = document.createElement('style');
        style.id = 'dept-page-styles';
        style.textContent = `
            .dept-toast {
                position: fixed;
                bottom: 25px;
                right: 25px;
                padding: 14px 24px;
                border-radius: 12px;
                font-weight: 700;
                z-index: 9999;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                animation: dept-fadeInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                color: white;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            @keyframes dept-fadeInUp {
                from { opacity: 0; transform: translateY(30px) scale(0.9); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    window.DeptPage = {
        _dept: null,

        // Getter ذكي للقسم (يتحقق من السياق أو الرابط)
        get dept() {
            if (this._dept) return this._dept;
            if (window.Context && typeof Context.getDept === 'function') {
                this._dept = Context.getDept();
            } else {
                const params = new URLSearchParams(window.location.search);
                this._dept = params.get('dept');
            }
            return this._dept;
        },

        set dept(val) {
            this._dept = val;
        },

        escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/[&<>"']/g, m => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;',
                '"': '&quot;', "'": '&#039;'
            }[m]));
        },

        showMessage(message, isError = false) {
            const existing = document.querySelector('.dept-toast');
            if (existing) existing.remove();
            const div = document.createElement('div');
            div.className = 'dept-toast';
            div.style.background = isError ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #22c55e, #15803d)';
            div.innerHTML = `<i class="bi bi-${isError ? 'exclamation-circle' : 'check-circle'}-fill"></i> ${message}`;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 4000);
        },

        async init(dept, requiredRole = 'dept_manager') {
            // 🛡️ الانتظار الصارم لتحميل بيانات المستخدم قبل أي عملية
            if (window.api && typeof api.getCurrentUser === 'function') {
                console.log('[DeptPage] Waiting for user context...');
                await api.getCurrentUser();
            }

            // محاولة الحصول على القسم إذا لم يتم تمريره
            if (!dept) dept = this.dept;
            if (dept) this.dept = dept;

            // التحقق من الصلاحيات
            const role = (window.Context && typeof Context.getUserRole === 'function') ? Context.getUserRole() : 'owner';
            if (role !== requiredRole && role !== 'owner' && role !== 'admin' && role !== 'system_admin') {
                this.showMessage('هذه الصفحة مخصصة لمديري الإدارات والمسؤولين فقط', true);
                setTimeout(() => window.location.href = '/dept-dashboard.html', 2000);
                return false;
            }
            return true;
        },

        async loadFromAPI(type) {
            if (!this.dept) {
                // محاولة أخيرة للجلب قبل الفشل
                if (window.api && typeof api.getCurrentUser === 'function') await api.getCurrentUser();
            }

            const currentDept = this.dept;
            if (!currentDept) {
                console.warn('DeptPage: No department found for loadFromAPI');
                return null;
            }
            try {
                // استخدام نافذة الـ API الموحدة إذا توفرت
                if (window.api?.get) {
                    const response = await window.api.get(`/api/dept/analysis?dept=${currentDept}&type=${type}`);
                    return response?.success ? response.data : null;
                }

                // Fallback للـ callApiWithTimeout القديمة
                if (typeof window.callApiWithTimeout === 'function') {
                    const response = await window.callApiWithTimeout(`/api/dept/analysis?dept=${currentDept}&type=${type}`);
                    return response?.success ? response.data : null;
                }

                const res = await fetch(`/api/dept/analysis?dept=${currentDept}&type=${type}`, { credentials: 'include' });
                const json = await res.json();
                return json.data;
            } catch (e) {
                console.error(`DeptPage: Failed to load ${type}`, e);
                return null;
            }
        },

        async saveToAPI(type, data) {
            if (!this.dept) {
                if (window.api && typeof api.getCurrentUser === 'function') await api.getCurrentUser();
            }

            const currentDept = this.dept;
            if (!currentDept) {
                this.showMessage('خطأ: لم يتم تحديد الإدارة لحفظ البيانات', true);
                return false;
            }
            try {
                // استخدام نافذة الـ API الموحدة (POST) إذا توفرت
                if (window.api?.post) {
                    const response = await window.api.post('/api/dept/analysis', { type, dept: currentDept, data });
                    return !!response?.success;
                }

                // Fallback للـ callApiWithTimeout القديمة
                if (typeof window.callApiWithTimeout === 'function') {
                    const response = await window.callApiWithTimeout('/api/dept/analysis', {
                        method: 'POST',
                        body: { type, dept: currentDept, data }
                    });
                    return !!response?.success;
                }

                const res = await fetch('/api/dept/analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ type, dept: currentDept, data })
                });
                return res.ok;
            } catch (e) {
                console.error(`DeptPage: Failed to save ${type}`, e);
                this.showMessage('فشل حفظ البيانات على الخادم', true);
                return false;
            }
        },

        fillForm(data) {
            if (!data) return;
            for (const [key, value] of Object.entries(data)) {
                const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                if (el) el.value = value;
            }
        }
    };
})();
