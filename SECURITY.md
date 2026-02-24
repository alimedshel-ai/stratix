# 🛡️ دليل أمان Stratix — Security Guide

## نظرة عامة

Stratix تستخدم نموذج **دفاع متعدد الطبقات** (Defense in Depth) لحماية المنصة والبيانات.

---

## 🔐 طبقات الأمان

### 1. Helmet (HTTP Headers)
```
✅ Content-Security-Policy (CSP)
✅ X-Content-Type-Options: nosniff
✅ X-Frame-Options: SAMEORIGIN
✅ X-DNS-Prefetch-Control: off
✅ Strict-Transport-Security (HSTS)
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ X-Download-Options: noopen
```

### 2. Rate Limiting (3 مستويات)
| المستوى | الحد | التطبيق |
|:--------|:-----|:--------|
| عام | 500 req/15min | كل الـ `/api/` |
| Auth | 10 req/15min (prod) | `/api/auth/login`, `/api/auth/register` |
| Sensitive | 50 req/15min (prod) | عمليات حساسة |

### 3. CORS
- **Development**: `localhost:3000` فقط
- **Production**: من `ALLOWED_ORIGINS` في `.env`

### 4. Input Sanitizer (`middleware/security.js`)
- تنظيف `<`, `>` إلى HTML entities
- إزالة `javascript:`, `vbscript:`
- إزالة `on*=` event handlers
- إزالة `data:text/html` payloads
- يعمل على `req.body`, `req.query`, `req.params`

### 5. Suspicious Pattern Detector
يكشف ويحظر الأنماط المشبوهة:
- `' OR 1=1` — SQL Injection
- `UNION SELECT` — SQL Injection
- `<script>` — XSS
- `../` — Path Traversal
- `eval(`, `exec(` — Code Injection
- `DROP TABLE`, `DELETE FROM` — SQL DDL/DML

### 6. Security Logger
يسجل تلقائياً:
- كل طلبات 401 Unauthorized
- كل طلبات 403 Forbidden
- الطلبات البطيئة (> 5 ثوانٍ)
- تفاصيل: IP, Method, URL, User-Agent

### 7. Authentication (JWT)
- Token: HS256 مع مفتاح 128+ حرف
- Expires: حسب الإعداد
- bcrypt: 10 salt rounds

### 8. Authorization (RBAC)
```
SUPER_ADMIN → كل الصلاحيات + admin-dashboard
OWNER       → كل صلاحيات الكيان
ADMIN       → إدارة المستخدمين والإعدادات
EDITOR      → تعديل المحتوى والبيانات
DATA_ENTRY  → إدخال بيانات KPI فقط
VIEWER      → قراءة فقط
```

---

## 🔑 إدارة كلمات المرور

### سياسة كلمات المرور (موصى بها للإنتاج)
- طول 10+ حروف
- حرف كبير + حرف صغير
- رقم + رمز خاص
- تغيير دوري كل 90 يوم

### كلمات المرور التجريبية
| الحساب | كلمة المرور |
|:-------|:------------|
| Super Admin | `Str@tix$uper2026!` |
| Admin | `Adm!n@Str4tix2026` |
| Manager | `Mgr@Str4tix2026!` |
| Editor | `Ed!t@Str4tix2026` |
| Viewer | `V!ew@Str4tix2026` |

> ⚠️ **غيّر كلمات المرور فوراً في بيئة الإنتاج!**

---

## 🌐 متغيرات البيئة للأمان

```env
# مفتاح JWT — يجب أن يكون فريداً وقوياً (128+ حرف)
JWT_SECRET=your-secure-random-string-here

# البيئة
NODE_ENV=production

# Origins المسموحة (مفصولة بفاصلة)
ALLOWED_ORIGINS=https://yourdomain.com

# API Key (اختياري — للحماية الإضافية)
API_KEY=your-api-key-here
```

---

## 📋 قائمة فحص الأمان (Security Checklist)

### قبل الإنتاج ✅
- [ ] تغيير `JWT_SECRET` إلى مفتاح عشوائي قوي
- [ ] تعيين `NODE_ENV=production`
- [ ] تعيين `ALLOWED_ORIGINS` بالنطاقات المسموحة فقط
- [ ] تغيير كلمات المرور التجريبية
- [ ] تفعيل HTTPS
- [ ] تعيين `API_KEY` إذا لزم الأمر
- [ ] مراجعة CSP directives حسب الحاجة
- [ ] تفعيل حدود Rate Limiting المشددة
- [ ] إعداد نسخ احتياطي للقاعدة
- [ ] مراجعة CORS origins

### دورياً 🔄
- [ ] فحص سجلات الأمان
- [ ] تحديث المكتبات (`npm audit`)
- [ ] مراجعة صلاحيات المستخدمين
- [ ] اختبار اختراق دوري
- [ ] تحديث كلمات المرور
