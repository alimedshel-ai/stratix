# خطة نقل JWT من localStorage إلى HttpOnly Cookie — النسخة المصححة v2
## الحل الشامل: بدون كسر أي صفحة

---

## 🎯 الاكتشاف الجوهري

المشكلة **ليست** في طلبات `fetch()` — هذه سهلة بإضافة `credentials`.
المشكلة في **الفحص المتزامن (synchronous)** الموجود في بداية كل صفحة:

```javascript
const token = localStorage.getItem('token');   // ← هذا السطر
if (!token) { location.href = '/login'; }      // ← يعيد التوجيه فوراً!
```

لو مسحنا localStorage → كل الصفحات تطرد المستخدم فوراً → **كسر كارثي**.

---

## ✅ الاستراتيجية المعدلة: 3 عناصر تعمل معاً

### العنصر 1: Middleware يقرأ Cookie أولاً (ليس header)

**المشكلة الحالية:**
```javascript
// middleware/auth.js — الترتيب الحالي 🔴
let token = req.headers.authorization?.split(' ')[1] || req.query.token;  // ← أولاً: Header
if (!token && req.cookies) token = req.cookies.token;                     // ← ثانياً: Cookie
```

لو الصفحة أرسلت `Authorization: Bearer httponly-marker` (قيمة وهمية)، الـ middleware
يأخذها أولاً → يحاول يتحقق منها → تفشل → 401 ❌

**الحل — قلب الأولوية:**
```javascript
// middleware/auth.js — الترتيب الجديد 🟢
let token = null;
// 1. Cookie أولاً (المصدر الأساسي الآمن)
if (req.cookies && req.cookies.token) {
  token = req.cookies.token;
} else if (req.headers.cookie) {
  const cookies = Object.fromEntries(req.headers.cookie.split('; ').map(c => c.split('=')));
  token = cookies.token;
}
// 2. Authorization header (fallback للتوافق)
if (!token) {
  token = req.headers.authorization?.split(' ')[1] || req.query.token;
}
```

**النتيجة:** حتى لو الصفحة القديمة أرسلت `Bearer httponly-marker`، الـ middleware
يتجاهله لأنه وجد الكوكي الحقيقي أولاً ✅

---

### العنصر 2: Login يخزن "علامة" في localStorage (ليس JWT الحقيقي)

**الوضع الحالي:**
```javascript
// login.html سطر 559-560
if (res.ok && data.token) {
    localStorage.setItem('token', data.token);  // ← يخزن JWT الحقيقي!
```

**الحل — في مرحلة لاحقة نغيره إلى:**
```javascript
if (res.ok) {
    // الكوكي الحقيقي أُضبط تلقائياً من السيرفر (HttpOnly)
    // نخزن "علامة" فقط لتمرير فحوصات if (!token) في الصفحات القديمة
    localStorage.setItem('token', 'httponly-managed');
    localStorage.setItem('user', JSON.stringify(data.user));
```

**لماذا هذا آمن؟**
- `'httponly-managed'` **ليس** JWT — لا يمكن استخدامه للمصادقة
- لو سرقه مهاجم عبر XSS، **لا يساوي شي** — الـ JWT الحقيقي في HttpOnly Cookie
- الصفحات القديمة تشوف `token = 'httponly-managed'` → truthy → لا تطرد المستخدم ✅
- حتى لو أرسلت `Authorization: Bearer httponly-managed`، المعدل middleware يتجاهله ✅

---

### العنصر 3: auth-bridge.js (اختياري — تنظيف)

هذا الملف **ليس ضروري للصحة** بل لتنظيف الطلبات:

```javascript
// auth-bridge.js — يُحمّل قبل أي script في الصفحة
(function() {
  const _fetch = window.fetch;
  window.fetch = function(url, opts = {}) {
    // فقط طلبات API
    if (typeof url === 'string' && url.startsWith('/api')) {
      opts.credentials = opts.credentials || 'same-origin';
      // حذف Authorization header الوهمي — الكوكي يكفي
      if (opts.headers) {
        if (opts.headers instanceof Headers) {
          opts.headers.delete('Authorization');
        } else if (typeof opts.headers === 'object') {
          const h = { ...opts.headers };
          delete h['Authorization'];
          delete h['authorization'];
          opts.headers = h;
        }
      }
    }
    return _fetch.call(this, url, opts);
  };
})();
```

**السبب:** بدونه، كل طلب fetch يرسل `Authorization: Bearer httponly-managed` وهمي
→ الـ middleware يتجاهله (لأن الكوكي يأتي أولاً) → لكنه "ضوضاء" في الـ headers.
مع الجسر: الـ header الوهمي يُحذف نظيفاً ✅

---

## 📊 جدول المقارنة الشامل: ماذا يحصل بالضبط

### سيناريو 1: صفحة قديمة (لم تُعدّل) بعد المرحلة 1+2

| الخطوة | ماذا يحصل | النتيجة |
|--------|-----------|---------|
| 1. `const token = localStorage.getItem('token')` | يحصل `'httponly-managed'` | ✅ لا يتوجه لـ login |
| 2. `if (!token) { location.href = '/login' }` | token truthy → يتخطى | ✅ يستمر |
| 3. `headers['Authorization'] = 'Bearer ' + token` | يضبط header وهمي | ⚠️ ضوضاء لكن ما تأثر |
| 4. `fetch(url, { headers })` | يُرسل بدون credentials | ⚠️ لكن... |
| 5. المتصفح يرسل الطلب | الكوكي يُرسل تلقائياً* | ✅ |
| 6. Middleware يستقبل | يقرأ Cookie أولاً → يجد JWT حقيقي | ✅ يمر |
| 7. API يعالج الطلب | طبيعي | ✅ |

> * الكوكيز مع `sameSite: 'strict'` و `path: '/'` تُرسل تلقائياً لنفس الدومين
> حتى بدون `credentials: 'same-origin'` في الطلبات العادية (non-CORS).
> لكن `credentials: 'same-origin'` أوضح وأكثر أماناً.

### سيناريو 2: صفحة محدّثة (بعد المرحلة 4)

| الخطوة | ماذا يحصل | النتيجة |
|--------|-----------|---------|
| 1. `await StartixAPI.requireAuth()` | يستدعي `/api/user/me` | ✅ |
| 2. Server يتحقق من Cookie | JWT صالح → يعيد بيانات المستخدم | ✅ |
| 3. `fetch(url, { credentials: 'same-origin' })` | نظيف بدون Authorization | ✅ |

---

## 📋 خطة التنفيذ المرحلية المصححة

### المرحلة 1: السيرفر فقط (لا تأثير على الصفحات) ⏱️ 45 دقيقة

| # | المهمة | الملف | التفاصيل |
|---|--------|-------|----------|
| 1.1 | **قلب أولوية Middleware** | `middleware/auth.js` | Cookie أولاً → Header ثانياً |
| 1.2 | **إنشاء `/api/user/me`** | `routes/auth.js` | نسخة مبسطة من `/auth/profile` الموجودة + ملاحظة: `/auth/profile` موجودة سطر 443 |
| 1.3 | **إيقاف إرسال token في Response Body** | `routes/auth.js` | حذف `token` من `res.json()` في login + signup (+keep cookie) |

> **ملاحظة 1.3**: لا نحذفه فوراً — نحتاج أولاً تعديل login.html. نؤجل لـ 2.2.

### المرحلة 2: صفحتا Login + Signup فقط ⏱️ 30 دقيقة

| # | المهمة | الملف | التفاصيل |
|---|--------|-------|----------|
| 2.1 | **تعديل login.html** | `src/login.html` | `localStorage.setItem('token', 'httponly-managed')` + إضافة `credentials: 'include'` لطلب Login |
| 2.2 | **تعديل signup.html** | `src/signup.html` | نفس التعديل |
| 2.3 | **حذف `token` من Response** | `routes/auth.js` | الآن آمن — login.html لا تعتمد على `data.token` |
| 2.4 | **تعديل join.html** | `src/join.html` | نفس النمط |

### المرحلة 3: api.js + auth-bridge.js ⏱️ 45 دقيقة

| # | المهمة | الملف | التفاصيل |
|---|--------|-------|----------|
| 3.1 | **إنشاء `getCurrentUser()`** | `api.js` | دالة مركزية مع caching |
| 3.2 | **تحديث `requireAuth()`** | `api.js` | تستخدم `/api/user/me` |
| 3.3 | **إنشاء `auth-bridge.js`** | ملف جديد | اعتراض fetch + حذف Authorization |
| 3.4 | **إضافة auth-bridge.js للصفحات** | `server.js` أو يدوي | يُحمّل بعد api.js |

### المرحلة 4: تنظيف الصفحات تدريجياً ⏱️ 3-4 ساعات

**الطريقة:** في كل صفحة:
```diff
- const token = localStorage.getItem('token');
- if (!token) { location.href = '/login'; }
- const headers = { 'Authorization': `Bearer ${token}`, ... };
- fetch(url, { headers });
+ // التحقق يتم عبر /api/user/me (في auth-bridge أو يدوياً)
+ const headers = { 'Content-Type': 'application/json' };
+ fetch(url, { headers, credentials: 'same-origin' });
```

**الترتيب:** login → dashboard → dept-dashboard → kpis → باقي الصفحات

### المرحلة 5: إزالة Legacy ⏱️ 30 دقيقة

- حذف `getToken()`, `setToken()` من api.js
- حذف Authorization fallback من middleware
- حذف auth-bridge.js
- حذف `localStorage.setItem('token', 'httponly-managed')` من login (لم يعد مطلوباً)

---

## 🔒 تحليل الأمان لكل مرحلة

| المرحلة | هل JWT في localStorage؟ | هل JWT في Cookie؟ | مستوى الأمان |
|---------|------------------------|-------------------|--------------|
| **قبل البدء** | ✅ JWT حقيقي | ✅ | 🔴 XSS يسرق التوكن |
| **بعد 1+2** | `'httponly-managed'` فقط | ✅ JWT حقيقي | 🟢 XSS يجد علامة لا قيمة لها |
| **بعد 3** | `'httponly-managed'` + لا Authorization | ✅ | 🟢🟢 أنظف |
| **بعد 4+5** | ❌ لا شي | ✅ JWT حقيقي | 🟢🟢🟢 الأمان الكامل |

---

## 🎯 ملخص: ليش هذا الحل يعمل

1. **Middleware يقرأ Cookie أولاً** → حتى لو الصفحة أرسلت header وهمي، يُتجاهل
2. **`'httponly-managed'` في localStorage** → كل فحوصات `if (!token)` تمر
3. **الـ JWT الحقيقي فقط في الكوكي** → XSS لا يقدر يسرقه
4. **auth-bridge.js** → ينظف الـ headers الوهمية (تحسين، ليس ضرورة)
5. **تنظيف تدريجي** → كل صفحة تُحدّث على حدة بدون كسر الباقي
