// js/dept-page.js
(function () {
    // إضافة CSS اللازم للـ toast
    if (!document.getElementById('dept-page-styles')) {
        const style = document.createElement('style');
        style.id = 'dept-page-styles';
        style.textContent = `
            .dept-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 12px;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                animation: dept-fadeInUp 0.3s ease;
                color: white;
            }
            @keyframes dept-fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    window.DeptPage = {
        dept: null,

        escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/[&<>"']/g, m => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;',
                '"': '&quot;', "'": '&#039;'
            }[m]));
        },

        showMessage(message, isError = true) {
            const existing = document.querySelector('.dept-toast');
            if (existing) existing.remove();
            const div = document.createElement('div');
            div.className = 'dept-toast';
            div.style.background = isError ? '#ef4444' : '#22c55e';
            div.textContent = message;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 4000);
        },

        async init(dept, requiredRole = 'dept_manager') {
            this.dept = dept;
            if (!window.user) {
                try {
                    const res = await fetch('/api/auth/me', { credentials: 'include' });
                    if (res.ok) {
                        const data = await res.json();
                        window.user = data.user;
                    }
                } catch (e) { }
            }
            if (!window.Context) {
                this.showMessage('نظام Context Manager مفقود', true);
                return false;
            }
            // Allow OWNER / SYSTEM_ADMIN or DEPT_MANAGER
            const role = Context.getUserRole();
            if (role !== requiredRole && role !== 'owner' && role !== 'admin') {
                this.showMessage('هذه الصفحة غير مصرح لك بدخولها', true);
                setTimeout(() => window.location.href = '/dashboard.html', 1500);
                return false;
            }
            return true;
        },

        async loadFromAPI(type) {
            try {
                const res = await fetch(`/api/dept/analysis?dept=${this.dept}&type=${type}`, {
                    credentials: 'include'
                });
                if (res.ok) {
                    const json = await res.json();
                    return json.data;
                }
            } catch (e) { }
            return null;
        },

        async saveToAPI(type, data) {
            try {
                const res = await fetch('/api/dept/analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ type, dept: this.dept, data })
                });
                return res.ok;
            } catch (e) {
                return false;
            }
        },

        fillForm(data) {
            if (!data) return;
            for (const [key, value] of Object.entries(data)) {
                const el = document.querySelector(`[name="${key}"]`);
                if (el) el.value = value;
            }
        },

        migrateFromLocalStorage(key) {
            const old = localStorage.getItem(key);
            if (!old) return null;
            try {
                const data = JSON.parse(old);
                localStorage.removeItem(key);
                return data;
            } catch (e) {
                return null;
            }
        },

        // عرض ملخص التحليل الرقمي بطريقة آمنة
        async loadDeepSummary(targetId) {
            const deepData = await this.loadFromAPI('DEEP') || Context.getTemp('deep_results');
            const container = document.getElementById(targetId);
            if (!deepData || !container) return;
            // تنظيف المحتوى السابق
            container.innerHTML = '';
            const title = document.createElement('strong');
            title.textContent = '📊 ملخص التحليل الرقمي: ';
            container.appendChild(title);
            container.appendChild(document.createElement('br'));
            const fields = Object.keys(deepData).map(k => `${this.escapeHtml(k)}: ${this.escapeHtml(deepData[k])}`).join(' | ');
            const textNode = document.createTextNode(fields);
            container.appendChild(textNode);
            container.style.display = 'block';
        }
    };
})();
