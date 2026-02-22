# 🚀 Stratix — خارطة طريق التطوير
> آخر تحديث: 2026-02-19

---

## 📊 نظرة عامة على الحالة

| المرحلة | الحالة | التقدم |
|---------|--------|--------|
| Pre-Day 0: فحص Schema | ✅ مكتمل | 100% |
| Day 0: الإطلاق والـ Seeding | 🔄 جاري | 0% |
| Day 1: التدقيق والاختبار | ✅ مكتمل (سابقاً) | 100% |
| Day 2: تحسينات MVP | ⏳ قادم | 0% |
| Day 3: توحيد التجربة | ⏳ قادم | 0% |
| Phase 2: Enterprise Features | 📋 مخطط | 0% |

---

## ✅ Pre-Day 0: فحص Schema (مكتمل)
> **الهدف:** التأكد إن الـ Schema جاهز قبل زرع البيانات

- [x] فحص جدول `User` — `systemRole` (SUPER_ADMIN/USER) ✅ كافي للـ MVP
- [x] فحص جدول `Member` — `role` (OWNER/ADMIN/EDITOR/VIEWER/DATA_ENTRY) ✅
- [x] فحص جدول `KPI` — حقل `direction` (HIGHER_IS_BETTER/LOWER_IS_BETTER) ✅ موجود
- [x] فحص `StrategicAlert` — severity SUCCESS + أنواع KPI_ACHIEVED ✅
- [x] **القرار:** Schema جاهز 100% — لا يحتاج تعديل

---

## 🔄 Day 0: الإطلاق والـ Seeding (جاري)
> **الهدف:** تنظيف قاعدة البيانات وزرع بيانات تجريبية نظيفة

### المهام:
- [ ] إيقاف السيرفر الحالي
- [ ] `npx prisma migrate reset` — تنظيف قاعدة البيانات
- [ ] `npm run seed` — زرع البيانات التجريبية (`scripts/seed.js`)
- [ ] تشغيل السيرفر `node server.js`
- [ ] فحص سريع: تسجيل دخول + Dashboard يعمل

### ملفات مرتبطة:
- `prisma/schema.prisma` — 956 سطر، 20 جدول
- `scripts/seed.js` — 634 سطر
- `prisma/seed-tools.js` — أدوات التحليل الاستراتيجي

---

## ✅ Day 1: التدقيق والاختبار (مكتمل سابقاً)
> **الهدف:** فحص شامل لكل الصفحات والـ APIs

### النتائج السابقة:
- [x] السيرفر يعمل على المنفذ 3000
- [x] المصادقة (Login) تعمل
- [x] 33/34 API ناجح
- [x] جميع الصفحات تعمل (Dashboard, KPIs, Versions, Objectives, Initiatives, Assessments, Analysis, TOWS, Choices, Reviews)
- [x] التنبيهات الإيجابية (KPI_ACHIEVED, OBJECTIVE_ACHIEVED) تعمل
- [x] Health Score: 68/100 (GOOD, STABLE)
- [x] Alert Engine Scan: 3 تنبيهات + closed loop actions
- [x] Recommendations: قرار ADJUST + توصيتين

---

## ⏳ Day 2: تحسينات MVP
> **الهدف:** إضافة ميزات أساسية وتحسين الواجهة

### المهام المخططة:
- [ ] **مؤشرات نوعية (Qualitative KPIs):**
  - [ ] دعم `direction: LOWER_IS_BETTER` في معادلات الأداء
  - [ ] تحديث `alert-engine.js` لدعم الاتجاهين
  - [ ] تحديث عرض المؤشرات في الواجهة

- [ ] **توحيد الواجهة:**
  - [ ] مراجعة تناسق الألوان والتصميم عبر الصفحات
  - [ ] التأكد من عمل الـ Sidebar الموحد (`sidebar.js`) في كل الصفحات

- [ ] **ربط المخاطر بالأهداف:**
  - [ ] ربط `StrategicRisk` بـ `StrategicObjective` (اختياري)

---

## ⏳ Day 3: توحيد التجربة
> **الهدف:** تنظيم السايدبار وتحسين تجربة المستخدم

### تنظيم السايدبار (تم الاتفاق عليه):

```
🏠 الرئيسية
├── لوحة التحكم

🎯 استوديو الاستراتيجية
├── 📋 التقييمات                  bi-clipboard-data
├── 🔬 التحليل الاستراتيجي         bi-search
│   ├── SWOT / PESTEL / Porter   bi-grid-1x2
│   ├── مصفوفة TOWS              bi-arrow-left-right
│   ├── تحليل الفجوات             bi-bar-chart-steps
│   └── OKRs                     bi-trophy
├── 🧭 التوجه الاستراتيجي          bi-compass
├── ⚖️ القرارات الاستراتيجية       bi-scale (بدل "الخيارات والمخاطر")
├── 📑 إصدارات الاستراتيجية        bi-clock-history
├── 🔧 التصحيحات                  bi-wrench-adjustable
└── 🗺️ من الألم للوضوح            bi-map

⚙️ محرك العمليات
├── الأهداف
├── المبادرات
├── مصفوفة الأولويات
├── الخريطة الاستراتيجية
├── المراجعات الدورية
└── القرارات المالية

📊 مركز البيانات
├── مؤشرات الأداء
├── إدخال المؤشرات
├── الذكاء الاستراتيجي
├── استيراد البيانات
└── التكاملات

🔧 النظام
├── البيانات الأساسية
├── الكيانات
├── المستخدمون
├── الإعدادات
└── مفتش النظام
```

### قرارات تصميمية:
- [x] **choices.html** = خيارات + مخاطر معاً (✅ صحيح — مرتبطين عبر `riskChoice`)
- [x] **تسمية جديدة:** "القرارات الاستراتيجية" بدل "الخيارات والمخاطر"
- [ ] تطبيق تغيير الأيقونات في `sidebar.js`
- [ ] تحسين ترتيب العناصر

---

## 📋 Phase 2: Enterprise Features (مستقبلي)
> **الهدف:** ميزات متقدمة بعد إطلاق MVP

### مخطط:
- [ ] **3 مستويات استراتيجية:** إضافة `strategicLevel` في `Member`
  - `STRATEGIC` — القيادة العليا
  - `TACTICAL` — المدراء التنفيذيون
  - `OPERATIONAL` — فرق العمل
- [ ] **قوائم ديناميكية:** فلترة الصفحات حسب المستوى الاستراتيجي
- [ ] **لوحات مخصصة:** Dashboard مختلف لكل مستوى
- [ ] **تقارير PDF:** تصدير تقارير احترافية
- [ ] **إشعارات بريدية:** تنبيهات عبر البريد الإلكتروني
- [ ] **REST API Documentation:** توثيق Swagger/OpenAPI

---

## 🏗️ البنية التقنية الحالية

| المكون | التقنية | الملاحظات |
|--------|---------|-----------|
| Backend | Node.js + Express.js | `server.js` |
| Database | SQLite + Prisma ORM | `prisma/schema.prisma` (20 جدول) |
| Frontend | HTML + Vanilla JS + Bootstrap Icons | `/public/` |
| Sidebar | Modular JS | `public/js/sidebar.js` (فلترة بالأدوار) |
| Charts | Chart.js 4.4.0 | مصفوفة مخاطر + تقييم خيارات |
| Auth | JWT + bcryptjs | Token-based |
| Port | 3000 | `http://localhost:3000` |

---

## 📝 ملاحظات مهمة

1. **الـ Sidebar الموحد:** `public/js/sidebar.js` يستبدل أي sidebar قديم تلقائياً
2. **الأدوار:** 5 أدوار (OWNER/ADMIN/EDITOR/VIEWER/DATA_ENTRY) + systemRole (SUPER_ADMIN/USER)
3. **التنبيهات:** SUCCESS severity مضاف — يعمل في Backend + Frontend
4. **حقل `direction`:** موجود في KPI — `HIGHER_IS_BETTER` (افتراضي) و `LOWER_IS_BETTER`
5. **الحماية:** Backend يحمي الـ APIs حسب الأدوار — Frontend يفلتر السايدبار فقط
