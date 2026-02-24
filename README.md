# ستراتكيس — Stratix Strategic Management Platform

> منصة إدارة استراتيجية متكاملة | 79 صفحة | 67+ أداة تحليل | 45 API | محرك ذكاء اصطناعي

## 🚀 نظرة سريعة

**Stratix** هي منصة SaaS عربية متكاملة لإدارة التخطيط الاستراتيجي، من التشخيص والتحليل إلى التنفيذ والمتابعة. مبنية بـ Express.js مع واجهة HTML5/Bootstrap 5 RTL.

---

## ⚡ البدء السريع

```bash
# 1. تثبيت المكتبات
npm install

# 2. تهيئة قاعدة البيانات
npx prisma db push

# 3. بيانات تجريبية
node scripts/seed.js

# 4. تشغيل السيرفر
npm run dev
```

المنصة على: `http://localhost:3000`

---

## 🔐 بيانات الدخول (Demo)

| الدور | البريد | كلمة المرور |
|:------|:-------|:------------|
| 🔒 Super Admin | `superadmin@stratix.com` | `Str@tix$uper2026!` |
| 👑 Admin (OWNER) | `admin@stratix.com` | `Adm!n@Str4tix2026` |
| 📊 Manager (ADMIN) | `manager@stratix.com` | `Mgr@Str4tix2026!` |
| ✏️ Editor (EDITOR) | `editor@stratix.com` | `Ed!t@Str4tix2026` |
| 👁️ Viewer (VIEWER) | `viewer@stratix.com` | `V!ew@Str4tix2026` |

---

## 📊 إحصائيات المنصة

| العنصر | العدد |
|:-------|------:|
| صفحات HTML | 79 |
| أدوات تحليل استراتيجي | 67+ |
| API Routes | 45 |
| مسارات استراتيجية ذكية | 12 |
| وحدات (Modules) | 20+ |

---

## 🏛️ الهيكل العام

```
Sector → Industry → Entity → Users (Members)
                              ↓
                    Strategy Version → Objectives → KPIs → Entries
                                    → Initiatives → Tasks
                                    → Directions (Vision/Mission/Values)
                                    → Reviews → Decisions
                                    → Risks + Choices
```

---

## 🔧 Tech Stack

| الطبقة | التقنية |
|:-------|:--------|
| **Backend** | Express.js (Node.js) |
| **Frontend** | HTML5 + Vanilla JS + Bootstrap 5 RTL |
| **Database** | SQLite + Prisma ORM |
| **Auth** | JWT + bcryptjs |
| **Security** | Helmet + Rate Limiting + CORS + CSP |
| **Docs** | Swagger/OpenAPI |

---

## 📦 الوحدات الرئيسية

### 🏗️ التأسيس
- **Onboarding** — تأسيس المنظمة
- **Pain & Ambition** — تحديد الألم والطموح
- **Entity Management** — إدارة الكيانات والقطاعات

### 🔍 التشخيص والتحليل
- **SWOT Analysis** — تحليل نقاط القوة والضعف والفرص والتهديدات
- **PESTEL Analysis** — التحليل الخارجي (6 عوامل)
- **TOWS Matrix** — مصفوفة الاستراتيجيات
- **67+ أداة تحليل** — Porter, McKinsey, BCG, Ansoff, وغيرها

### 🎯 التخطيط
- **Strategic Directions** — الرؤية والرسالة والقيم
- **Objectives (BSC)** — الأهداف (بطاقة الأداء المتوازن)
- **KPIs** — مؤشرات الأداء + إدخال القيم الدورية
- **OKRs** — الأهداف والنتائج الرئيسية

### 🚀 التنفيذ
- **Initiatives** — المبادرات الاستراتيجية
- **Tasks** — المهام
- **Priority Matrix** — مصفوفة الأولويات (MCDA)
- **Projects** — إدارة المشاريع

### 📊 المتابعة والذكاء
- **Reviews** — المراجعات الدورية مع محرك القرارات
- **Intelligence** — مركز الذكاء الاستراتيجي
- **Alert Engine** — التنبيهات الآلية
- **CEO Dashboard** — لوحة القيادة التنفيذية
- **Risk Map** — خريطة المخاطر

### 🤖 الذكاء الاصطناعي
- **AI Advisor** — المستشار الذكي
- **Auto Reports** — التقارير التلقائية
- **Smart Recommendations** — التوصيات الذكية

---

## 🛡️ الأمان

- ✅ **Helmet** — حماية HTTP headers + CSP مفعّل
- ✅ **Rate Limiting** — 3 مستويات (عام 500/15min + Auth 10 prod + Sensitive 50 prod)
- ✅ **CORS** — محدود بالـ origins المسموحة
- ✅ **JWT** — توثيق بـ tokens (مفتاح 128 حرف)
- ✅ **bcryptjs** — تشفير كلمات المرور (salt 10 rounds)
- ✅ **Input Sanitizer** — حماية XSS (تنظيف body/query/params)
- ✅ **Suspicious Pattern Detector** — كشف SQLi + Script injection
- ✅ **Security Headers** — HSTS + X-Frame + X-Content-Type + DNS Prefetch
- ✅ **Security Logger** — تسجيل محاولات 401/403 + طلبات بطيئة
- ✅ **Referrer-Policy** — `strict-origin-when-cross-origin`
- ✅ **API Key Guard** — حماية إضافية في البيئة الإنتاجية

---

## 🗂️ هيكل المشروع

```
├── server.js              # Express app الرئيسي
├── prisma/
│   └── schema.prisma      # Prisma data model (25+ جدول)
├── routes/                # 45 API route files
├── middleware/
│   ├── auth.js            # JWT authentication
│   ├── permission.js      # RBAC role-based access
│   ├── validation.js      # express-validator rules
│   └── security.js        # XSS/SQLi protection + headers
├── lib/                   # Prisma client
├── config/                # Swagger config
├── scripts/
│   ├── seed.js            # بيانات تجريبية شاملة (v4.0)
│   └── create-super-admin.js
├── public/                # 79 صفحة HTML
│   ├── js/                # مكتبات JS (sidebar, path-engine, api)
│   ├── css/               # أنماط CSS
│   └── *.html             # صفحات المنصة
├── .env                   # متغيرات البيئة
└── package.json
```

---

## 🌐 متغيرات البيئة

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-256-bit-secret"
PORT=3000
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:3000"
```

---

## 📋 بيانات Seed التجريبية

بعد تشغيل `node scripts/seed.js`:

| البيانات | العدد |
|:---------|------:|
| القطاعات | 3 |
| الصناعات | 3 |
| أنواع الكيانات | 3 |
| المستخدمين | 5 (بأدوار مختلفة) |
| الكيانات | 2 |
| التوجهات (رؤية + رسالة + قيم + قضايا) | 8 |
| PESTEL | 8 نقاط |
| الأهداف الاستراتيجية (BSC — 4 منظورات) | 8 |
| مؤشرات الأداء KPIs | 10 |
| بيانات KPI تاريخية | 30 (5 KPIs × 6 أشهر) |
| المبادرات | 5 |
| المراجعات | 2 |
| الخيارات الاستراتيجية | 2 |
| السيناريوهات | 3 (متفائل + أساسي + متحفظ) |
| SWOT | 16 نقطة (4 لكل فئة) |
| المخاطر | 3 (مع تسجيل كمّي) |
| التنبيهات | 6 |
| سجلات التدقيق | 5 |

---

## 🛣️ المسارات الاستراتيجية الذكية

12 مسار ذكي يتكيف مع نمط المنظمة:

**مسارات الأفراد (تدفق مباشر — سؤال واحد):**
1. **🧑‍💻 التطوير الشخصي** — خارطة طريق شخصية/مهنية
2. **💡 من الفكرة إلى البداية** — تحويل فكرة لخطة مشروع

**مسارات المشاريع الجديدة (أسئلة مكيّفة):**
3. **🌱 مشروع ناشئ متعثر** — إنقاذ سريع
4. **🌿 مشروع ناشئ حذر** — بناء تدريجي
5. **🔥 مشروع نامي فوضوي** — تنظيم وتوجيه
6. **🚀 مشروع نامي طموح** — نمو سريع

**مسارات الشركات (أسئلة حسب الحجم):**
7. **💰 المتعثرة مالياً** — إعادة هيكلة
8. **🔄 الناضجة المتجددة** — تحول استراتيجي
9. **⚔️ الناضجة التنافسية** — حماية الحصة
10. **🧭 المسار الشامل** — كل الأدوات مفتوحة
11. **🏆 المسار الذهبي** — 11 خطوة مركزة (Express Path)
12. **📋 مسار المبتدئ** — تشخيص ذكي في 3 خطوات

---

## 📝 الترخيص

ISC
