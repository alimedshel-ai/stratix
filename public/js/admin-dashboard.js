/* ═══════════════════════════════════════════
   ستارتكس — لوحة تحكم النظام
   Admin Dashboard Controller
   ═══════════════════════════════════════════ */

// ═══ State ═══
const state = {
    currentSection: 'overview',
    stats: {},
    users: [],
    companies: [],
    alerts: [],
    currentUser: null,
    filters: {
        users: { search: '', role: '', status: '' },
        companies: { search: '', plan: '', status: '' },
        alerts: 'all'
    }
};

// ═══ Auth Token ═══
function getToken() {
    return localStorage.getItem('adminToken') || localStorage.getItem('token');
}

function getHeaders() {
    return {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
    };
}

// ═══ Initialize ═══
document.addEventListener('DOMContentLoaded', init);

async function init() {
    console.log('🏰 Admin Dashboard — Initializing...');

    // 1. تحقق من الصلاحيات
    const hasAccess = await checkAccess();
    if (!hasAccess) {
        showAccessDenied();
        return;
    }

    // 2. عرض الواجهة
    showApp();

    // 3. تحميل البيانات
    await loadAllData();

    // 4. تهيئة التنقل
    setupNavigation();

    // 5. عرض القسم الأول
    renderOverview();

    console.log('✅ Admin Dashboard — Ready');
}

// ═══ Access Check ═══
async function checkAccess() {
    try {
        const token = getToken();
        if (!token) return false;

        const res = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) return false;

        const data = await res.json();
        state.currentUser = data.data || data.user || data;
        return state.currentUser.systemRole === 'SUPER_ADMIN';
    } catch (error) {
        console.error('Access check failed:', error);
        return false;
    }
}

function showAccessDenied() {
    document.getElementById('access-denied').classList.remove('hidden');
}

function showApp() {
    document.getElementById('admin-app').classList.remove('hidden');
    const user = state.currentUser;
    document.getElementById('admin-name').textContent = user.name || 'مدير النظام';
    document.getElementById('admin-avatar').textContent = (user.name || 'SA').substring(0, 2);
}

// ═══ Load All Data ═══
async function loadAllData() {
    const btn = document.getElementById('btn-refresh');
    if (btn) btn.style.animation = 'spin 1s linear infinite';

    try {
        const [statsRes, usersRes, companiesRes, alertsRes] = await Promise.allSettled([
            fetch('/api/admin/stats', { headers: getHeaders() }).then(r => r.json()),
            fetch('/api/admin/users?limit=200', { headers: getHeaders() }).then(r => r.json()),
            fetch('/api/admin/companies?limit=200', { headers: getHeaders() }).then(r => r.json()),
            fetch('/api/admin/alerts', { headers: getHeaders() }).then(r => r.json())
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value.success) {
            state.stats = statsRes.value.data;
        }
        if (usersRes.status === 'fulfilled' && usersRes.value.success) {
            state.users = usersRes.value.data;
        }
        if (companiesRes.status === 'fulfilled' && companiesRes.value.success) {
            state.companies = companiesRes.value.data;
        }
        if (alertsRes.status === 'fulfilled' && alertsRes.value.success) {
            state.alerts = alertsRes.value.data;
        }

        // تحديث badges في الـ sidebar
        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        el('nav-users-count', state.stats.totalUsers || state.users.length || '0');
        el('nav-companies-count', state.stats.totalCompanies || state.companies.length || '0');
        const criticalCount = state.alerts.filter(a => a.level === 'critical').length;
        el('nav-alerts-count', criticalCount || '0');

    } catch (error) {
        console.error('Failed to load data:', error);
        showToast('فشل تحميل البيانات', 'error');
    }

    if (btn) btn.style.animation = '';
}

async function refreshData() {
    await loadAllData();
    showSection(state.currentSection);
    showToast('تم تحديث البيانات', 'success');
}

// ═══ Navigation ═══
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            if (section) showSection(section);
        });
    });

    // Hash navigation
    if (window.location.hash) {
        const section = window.location.hash.substring(1);
        showSection(section);
    }
}

function showSection(sectionId) {
    state.currentSection = sectionId;

    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`section-${sectionId}`);
    if (target) target.classList.remove('hidden');

    // Update nav
    document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Update header
    const titles = {
        overview: ['نظرة عامة', 'ملخص حالة النظام والإحصائيات'],
        users: ['إدارة المستخدمين', 'عرض وتعديل وإضافة المستخدمين'],
        companies: ['إدارة الشركات', 'عرض وإدارة الشركات والاشتراكات'],
        progress: ['العمليات الاستراتيجية', 'مراقبة تقدم الشركات في رحلتها الاستراتيجية'],
        alerts: ['التنبيهات المركزية', 'كل التنبيهات والإشعارات في مكان واحد'],
        settings: ['إعدادات النظام', 'أمان وسجلات ونسخ احتياطي']
    };

    const [title, subtitle] = titles[sectionId] || ['لوحة التحكم', ''];
    document.getElementById('section-title').textContent = title;
    document.getElementById('section-subtitle').textContent = subtitle;

    // Render section data
    switch (sectionId) {
        case 'overview': renderOverview(); break;
        case 'users': renderUsers(); break;
        case 'companies': renderCompanies(); break;
        case 'progress': renderProgress(); break;
        case 'alerts': renderAlerts(); break;
    }

    // Update hash
    window.location.hash = sectionId;
}

// ═══ Render Overview ═══
function renderOverview() {
    const s = state.stats;
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };

    // Main stats
    el('total-users', s.totalUsers || 0);
    el('users-trend', s.usersGrowth ? `+${s.usersGrowth}%` : '-');
    el('users-footer', `+${s.newUsersThisMonth || 0} هذا الشهر`);

    el('total-companies', s.totalCompanies || 0);
    el('companies-trend', s.companiesGrowth ? `+${s.companiesGrowth}%` : '-');
    el('companies-footer', `+${s.newCompaniesThisMonth || 0} هذا الشهر`);

    el('active-today', s.activeToday || 0);

    const criticalCount = state.alerts.filter(a => a.level === 'critical').length;
    el('critical-alerts', criticalCount);
    el('alerts-footer', `${state.alerts.length} تنبيه إجمالي`);

    // Tool stats
    el('stat-assessments', s.totalAssessments || 0);
    el('stat-objectives', s.totalObjectives || 0);
    el('stat-kpis', s.totalKpis || 0);
    el('stat-initiatives', s.totalInitiatives || 0);

    // Progress overview
    el('ov-completed', s.swotCompleted || 0);
    el('ov-in-progress', s.inDiagnosis || 0);
    el('ov-stuck', s.stuck || 0);
    el('ov-not-started', s.notStarted || 0);

    // Alerts preview
    renderAlertsPreview();
}

function renderAlertsPreview() {
    const container = document.getElementById('alerts-preview-list');
    if (!container) return;

    const topAlerts = state.alerts.slice(0, 4);
    if (topAlerts.length === 0) {
        container.innerHTML = '<div class="loading-placeholder">✅ لا توجد تنبيهات</div>';
        return;
    }

    container.innerHTML = topAlerts.map(alert => `
        <div class="alert-item ${alert.level}" style="padding: 0.75rem; margin-bottom: 0.5rem;">
            <div class="alert-indicator"></div>
            <div class="alert-content">
                <div class="alert-title" style="font-size: 0.85rem;">${alert.title}</div>
            </div>
        </div>
    `).join('');
}

// ═══ Render Users ═══
function renderUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    let filtered = [...state.users];

    // Apply filters
    const f = state.filters.users;
    if (f.search) {
        const q = f.search.toLowerCase();
        filtered = filtered.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }
    if (f.role) filtered = filtered.filter(u => u.role === f.role);
    if (f.status) filtered = filtered.filter(u => u.status === f.status);

    // Update count
    const countEl = document.getElementById('users-results-count');
    if (countEl) countEl.textContent = `${filtered.length} مستخدم`;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">لا يوجد مستخدمين مطابقين</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(user => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;">
                        ${(user.name || '?').substring(0, 2)}
                    </div>
                    <span>${user.name || '-'}</span>
                </div>
            </td>
            <td style="direction:ltr;text-align:right;">${user.email || '-'}</td>
            <td>${translateRole(user.role)}</td>
            <td>${user.company || '-'}</td>
            <td>${user.lastLogin ? formatDate(user.lastLogin) : 'لم يدخل'}</td>
            <td><span class="status-badge ${user.status}">${user.status === 'active' ? 'نشط' : 'غير نشط'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-table" onclick="editUser('${user.id}')">تعديل</button>
                    <button class="btn-table danger" onclick="deleteUser('${user.id}', '${user.name}')">حذف</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterUsers() {
    state.filters.users.search = document.getElementById('user-search')?.value || '';
    state.filters.users.role = document.getElementById('user-role-filter')?.value || '';
    state.filters.users.status = document.getElementById('user-status-filter')?.value || '';
    renderUsers();
}

// ═══ Render Companies ═══
function renderCompanies() {
    const tbody = document.getElementById('companies-tbody');
    if (!tbody) return;

    let filtered = [...state.companies];

    const f = state.filters.companies;
    if (f.search) {
        const q = f.search.toLowerCase();
        filtered = filtered.filter(c => c.name?.toLowerCase().includes(q) || c.nameEn?.toLowerCase().includes(q));
    }
    if (f.plan) filtered = filtered.filter(c => c.type === f.plan);
    if (f.status) {
        if (f.status === 'SUSPENDED') {
            filtered = filtered.filter(c => c.companyStatus === 'SUSPENDED');
        } else {
            filtered = filtered.filter(c => c.status === f.status);
        }
    }

    const countEl = document.getElementById('companies-results-count');
    if (countEl) countEl.textContent = `${filtered.length} شركة`;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">لا توجد شركات مطابقة</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(company => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--secondary),var(--accent));display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;">
                        ${(company.name || '?').substring(0, 2)}
                    </div>
                    <div>
                        <div>${company.name || '-'}</div>
                        <small style="color:var(--text-muted);">${company.entitiesCount || 0} كيان</small>
                    </div>
                </div>
            </td>
            <td><span class="status-badge ${company.type?.toLowerCase()}">${translatePlan(company.type)}</span></td>
            <td>${company.owner || '-'}</td>
            <td>
                <div class="progress-inline">
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${company.progress}%"></div>
                    </div>
                    <span class="progress-text">${company.progress}%</span>
                </div>
            </td>
            <td>${company.stage || '-'}</td>
            <td><span class="status-badge ${company.companyStatus === 'SUSPENDED' ? 'suspended' : company.status}">${company.companyStatus === 'SUSPENDED' ? '⏸️ معلّق' : translateStatus(company.status)}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-table" onclick="viewCompany('${company.id}')">عرض</button>
                    <button class="btn-table" onclick="impersonateCompany('${company.id}', '${company.name}')">🎭 دخول</button>
                    ${company.companyStatus === 'SUSPENDED'
            ? `<button class="btn-table success" onclick="toggleSuspend('${company.id}', '${company.name}', false)" title="إعادة تفعيل">✅ تفعيل</button>`
            : `<button class="btn-table danger" onclick="toggleSuspend('${company.id}', '${company.name}', true)" title="تعليق">⏸️ تعليق</button>`
        }
                </div>
            </td>
        </tr>
    `).join('');
}

function filterCompanies() {
    state.filters.companies.search = document.getElementById('company-search')?.value || '';
    state.filters.companies.plan = document.getElementById('company-plan-filter')?.value || '';
    state.filters.companies.status = document.getElementById('company-status-filter')?.value || '';
    renderCompanies();
}

// ═══ Render Progress ═══
function renderProgress() {
    const s = state.stats;
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };

    el('swot-completed', s.swotCompleted || 0);
    el('diagnosis-progress', s.inDiagnosis || 0);
    el('stuck-companies', s.stuck || 0);
    el('not-started', s.notStarted || 0);

    // Progress bar
    const total = s.totalEntities || (s.swotCompleted + s.inDiagnosis + s.stuck + s.notStarted) || 1;
    const percent = Math.round(((s.swotCompleted || 0) / total) * 100);
    const bar = document.getElementById('swot-bar');
    const percentEl = document.getElementById('swot-percent');
    if (bar) bar.style.width = `${percent}%`;
    if (percentEl) percentEl.textContent = `${percent}%`;
}

// ═══ Render Alerts ═══
function renderAlerts(filter) {
    const list = document.getElementById('alerts-list');
    if (!list) return;

    const activeFilter = filter || state.filters.alerts;
    state.filters.alerts = activeFilter;

    let filtered = [...state.alerts];
    if (activeFilter !== 'all') {
        filtered = filtered.filter(a => a.level === activeFilter);
    }

    if (filtered.length === 0) {
        list.innerHTML = '<div class="loading-placeholder">✅ لا توجد تنبيهات في هذا التصنيف</div>';
        return;
    }

    list.innerHTML = filtered.map(alert => `
        <div class="alert-item ${alert.level}">
            <div class="alert-indicator"></div>
            <div class="alert-content">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-desc">${alert.description}</div>
                <div class="alert-time">${formatDate(alert.date)}</div>
            </div>
        </div>
    `).join('');
}

function filterAlerts(level, btn) {
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderAlerts(level);
}

// ═══ Actions: Add User ═══
async function addUser() {
    const name = document.getElementById('new-user-name').value.trim();
    const email = document.getElementById('new-user-email').value.trim();
    const password = document.getElementById('new-user-password').value.trim();
    const role = document.getElementById('new-user-role').value;

    if (!name || !email) {
        showToast('الاسم والبريد مطلوبين', 'error');
        return;
    }

    try {
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, email, password: password || 'Stratix@2026', role })
        });

        const data = await res.json();

        if (data.success) {
            showToast(`تم إضافة "${name}" بنجاح ✅`, 'success');
            closeModal('add-user');
            // Clear form
            document.getElementById('new-user-name').value = '';
            document.getElementById('new-user-email').value = '';
            document.getElementById('new-user-password').value = '';
            // Refresh
            await loadAllData();
            if (state.currentSection === 'users') renderUsers();
            else renderOverview();
        } else {
            showToast(data.message || 'فشل إضافة المستخدم', 'error');
        }
    } catch (error) {
        showToast('خطأ في الاتصال', 'error');
    }
}

// ═══ Actions: Add Company ═══
async function addCompany() {
    const nameAr = document.getElementById('new-company-name-ar').value.trim();
    const nameEn = document.getElementById('new-company-name-en').value.trim();
    const code = document.getElementById('new-company-code').value.trim();
    const email = document.getElementById('new-company-email').value.trim();
    const plan = document.getElementById('new-company-plan').value;

    if (!nameAr) {
        showToast('اسم الشركة بالعربي مطلوب', 'error');
        return;
    }

    try {
        const res = await fetch('/api/companies', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ nameAr, nameEn, code, email, plan })
        });

        const data = await res.json();

        if (data.success) {
            showToast(`تم إنشاء "${nameAr}" بنجاح ✅`, 'success');
            closeModal('add-company');
            // Clear form
            document.getElementById('new-company-name-ar').value = '';
            document.getElementById('new-company-name-en').value = '';
            document.getElementById('new-company-code').value = '';
            document.getElementById('new-company-email').value = '';
            // Refresh
            await loadAllData();
            if (state.currentSection === 'companies') renderCompanies();
            else renderOverview();
        } else {
            showToast(data.message || 'فشل إنشاء الشركة', 'error');
        }
    } catch (error) {
        showToast('خطأ في الاتصال', 'error');
    }
}

// ═══ Actions: Delete User ═══
async function deleteUser(id, name) {
    if (!confirm(`هل تريد حذف المستخدم "${name}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;

    try {
        const res = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const data = await res.json();

        if (data.success) {
            showToast(`تم حذف "${name}" ✅`, 'success');
            await loadAllData();
            renderUsers();
        } else {
            showToast(data.message || 'فشل الحذف', 'error');
        }
    } catch (error) {
        showToast('خطأ في الاتصال', 'error');
    }
}

// ═══ Actions: Edit User ═══
function editUser(id) {
    const user = state.users.find(u => u.id === id);
    if (!user) return;
    // Simple edit via prompt
    const newName = prompt('تعديل اسم المستخدم:', user.name);
    if (!newName || newName === user.name) return;

    fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ name: newName })
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showToast('تم تعديل المستخدم ✅', 'success');
                loadAllData().then(() => renderUsers());
            } else {
                showToast(data.message || 'فشل التعديل', 'error');
            }
        })
        .catch(() => showToast('خطأ في الاتصال', 'error'));
}

// ═══ Actions: View/Impersonate Company ═══
function viewCompany(id) {
    window.open(`/companies.html?id=${id}`, '_blank');
}

function impersonateCompany(companyId, companyName) {
    if (!confirm(`هل تريد الدخول كـ "${companyName}"؟ سيتم تحويلك للوحة تحكم هذه الشركة.`)) return;

    // Save admin state
    localStorage.setItem('adminToken', getToken());
    localStorage.setItem('adminUser', JSON.stringify(state.currentUser));
    localStorage.setItem('impersonateCompanyId', companyId);
    localStorage.setItem('impersonateCompanyName', companyName);

    showToast(`جار الدخول كـ "${companyName}"...`, 'success');
    setTimeout(() => {
        window.location.href = '/dashboard.html';
    }, 1000);
}

// ═══ Settings Actions ═══
function viewLogs() {
    showToast('جار فتح السجلات...', 'success');
    window.open('/inspector.html', '_blank');
}

function viewAuditLog() {
    showToast('سجل الأمان — قريباً', 'warning');
}

function showSessions() {
    showToast('الجلسات النشطة — قريباً', 'warning');
}

function createBackup() {
    showToast('جار إنشاء نسخة احتياطية...', 'success');
    // Can trigger backup endpoint
}

function downloadDB() {
    showToast('تحميل قاعدة البيانات — قريباً', 'warning');
}

function viewSystemInfo() {
    const info = `
🖥️ معلومات النظام:
• المستخدمين: ${state.stats.totalUsers || 0}
• الشركات: ${state.stats.totalCompanies || 0}
• الكيانات: ${state.stats.totalEntities || 0}
• التقييمات: ${state.stats.totalAssessments || 0}
• الأهداف: ${state.stats.totalObjectives || 0}
• المؤشرات: ${state.stats.totalKpis || 0}
• المبادرات: ${state.stats.totalInitiatives || 0}
    `.trim();
    alert(info);
}

function exportData(type) {
    const data = type === 'users' ? state.users : state.companies;
    if (!data || data.length === 0) {
        showToast('لا توجد بيانات للتصدير', 'warning');
        return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).map(v => `"${v}"`).join(',')).join('\n');
    const csv = '\uFEFF' + headers + '\n' + rows;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stratix_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`تم تصدير ${type === 'users' ? 'المستخدمين' : 'الشركات'} ✅`, 'success');
}

// ═══ Modal Management ═══
function showModal(modalId) {
    const modal = document.getElementById(`modal-${modalId}`);
    if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
    const modal = document.getElementById(`modal-${modalId}`);
    if (modal) modal.classList.add('hidden');
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
    }
});

// Close modals on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }
});

// ═══ Sidebar Toggle (Mobile) ═══
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ═══ Logout ═══
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// ═══ Helpers ═══
function translateRole(role) {
    const roles = {
        'SUPER_ADMIN': '🛡️ مدير النظام',
        'OWNER': '👔 صاحب شركة',
        'CONSULTANT': '🎓 مستشار',
        'DEPT_MANAGER': '📋 مدير قسم',
        'EXPLORER': '🔍 مستكشف',
        'USER': '👤 مستخدم'
    };
    return roles[role] || role || '-';
}

function translatePlan(plan) {
    const plans = {
        'TRIAL': 'تجريبي',
        'BASIC': 'أساسي',
        'PRO': 'احترافي',
        'ENTERPRISE': 'مؤسسي'
    };
    return plans[plan] || plan || '-';
}

function translateStatus(status) {
    const statuses = {
        'active': '🟢 نشط',
        'inactive': '⚪ غير نشط',
        'stuck': '🔴 متعثر',
        'ACTIVE': '🟢 نشط',
        'INACTIVE': '⚪ غير نشط',
        'SUSPENDED': '⏸️ معلّق',
        'suspended': '⏸️ معلّق'
    };
    return statuses[status] || status || '-';
}

// ═══ Actions: Suspend/Activate Company ═══
async function toggleSuspend(companyId, companyName, suspend) {
    if (suspend) {
        const reason = prompt(`سبب تعليق "${companyName}":\n(مثال: تجاوز حدود الباقة، عدم السداد، طلب العميل)`);
        if (reason === null) return; // cancelled

        try {
            const res = await fetch(`/api/admin/companies/${companyId}/suspend`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ reason: reason || 'تجاوز حدود الباقة' })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`⏸️ تم تعليق "${companyName}"`, 'success');
                await loadAllData();
                renderCompanies();
            } else {
                showToast(data.message || 'فشل التعليق', 'error');
            }
        } catch (error) {
            showToast('خطأ في الاتصال', 'error');
        }
    } else {
        if (!confirm(`هل تريد إعادة تفعيل "${companyName}"؟`)) return;

        try {
            const res = await fetch(`/api/admin/companies/${companyId}/activate`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            const data = await res.json();
            if (data.success) {
                showToast(`✅ تم تفعيل "${companyName}"`, 'success');
                await loadAllData();
                renderCompanies();
            } else {
                showToast(data.message || 'فشل التفعيل', 'error');
            }
        } catch (error) {
            showToast('خطأ في الاتصال', 'error');
        }
    }
}

function formatDate(date) {
    if (!date) return '-';
    try {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;

        // Less than 1 hour
        if (diff < 3600000) return `منذ ${Math.floor(diff / 60000)} دقيقة`;
        // Less than 24 hours
        if (diff < 86400000) return `منذ ${Math.floor(diff / 3600000)} ساعة`;
        // Less than 7 days
        if (diff < 604800000) return `منذ ${Math.floor(diff / 86400000)} يوم`;
        // Otherwise
        return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '-';
    }
}

// ═══ Toast Notifications ═══
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
}

// ═══ CSS Animation for refresh ═══
const style = document.createElement('style');
style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
