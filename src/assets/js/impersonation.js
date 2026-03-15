/**
 * Stratix — Impersonation Bar
 * يُضاف تلقائياً لكل الصفحات
 * لو SUPER_ADMIN يتصفح كشركة، يظهر شريط أحمر في الأعلى
 */
(function () {
  const impersonating = localStorage.getItem('impersonating');
  const adminToken = localStorage.getItem('adminToken');

  if (!impersonating || !adminToken) return; // مو في وضع Impersonation

  // إنشاء الشريط الأحمر
  const bar = document.createElement('div');
  bar.id = 'impersonation-bar';
  bar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 99999;
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    color: white;
    padding: 8px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Segoe UI', Tahoma, sans-serif;
    font-size: 13px;
    box-shadow: 0 2px 10px rgba(220,38,38,0.4);
    direction: rtl;
  `;

  bar.innerHTML = `
    <span>
      <i class="bi bi-eye-fill" style="margin-left:6px;"></i>
      <strong>وضع المعاينة</strong> — أنت تتصفح النظام بصلاحية عميل
    </span>
    <button id="exitImpersonation" style="
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.4);
      padding: 4px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all .2s;
    ">
      <i class="bi bi-arrow-return-left" style="margin-left:4px;"></i>
      عودة لبرج المراقبة
    </button>
  `;

  document.body.prepend(bar);

  // إزاحة محتوى الصفحة للأسفل
  document.body.style.paddingTop = '40px';

  // زر العودة
  document.getElementById('exitImpersonation').addEventListener('click', function () {
    // استعادة جلسة الـ Admin
    const adminTokenValue = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    // 🔒 الكوكي الخاص بالأدمن يُرسل تلقائياً — نخزن علامة فقط
    localStorage.setItem('token', 'httponly-managed');
    localStorage.setItem('user', adminUser);

    // حذف بيانات الـ Impersonation
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('impersonating');

    // الرجوع لبرج المراقبة
    window.location.href = '/admin';
  });

  // Hover effect
  const btn = document.getElementById('exitImpersonation');
  btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.35)'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(255,255,255,0.2)'; });
})();
