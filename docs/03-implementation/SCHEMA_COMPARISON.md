# 🔬 تحليل ومقارنة الـ Schema — الحالي vs المقترح الجديد
**التاريخ:** 16 فبراير 2026

---

## 📊 مقارنة عامة

| البند | Schema الحالي | Schema المقترح |
|-------|--------------|----------------|
| عدد الـ Models | 16 model | 12 model |
| فلسفة التصميم | Entity-Centric (كل شي مرتبط بالكيان) | Version-Centric (كل شي مرتبط بالنسخة) |
| الـ Versioning | جزئي (StrategyVersion كحاوية فقط) | **أساسي** (Version = قلب النظام) |
| التصنيفات | جداول مرجعية منفصلة (Sector, Industry, EntityType) | حقول نصية في Entity |
| مؤشرات الأداء | KPI مرتبط بـ Version مباشرة + Objective اختياري | KPI مرتبط بـ Objective فقط (إجباري) |
| إدخال البيانات | ❌ غير موجود | ✅ `KPIEntry` model جديد |
| الهرم الاستراتيجي | ❌ غير موجود | ✅ `StrategicDirection` model |
| PESTEL | ❌ غير موجود | ✅ `ExternalAnalysis` model |
| قاعدة البيانات | SQLite | SQLite (لكن المقترح مكتوب بصيغة PostgreSQL!) |

---

## 🔴 مشكلة حرجة #1: توافق SQLite

**المقترح مكتوب بصيغة PostgreSQL وما يشتغل على SQLite!**

| العنصر في المقترح | المشكلة | الحل لـ SQLite |
|-------------------|---------|---------------|
| `@db.Uuid` | ❌ غير مدعوم في SQLite | إزالته، استخدام `@default(cuid())` |
| `@db.Text` | ❌ غير مدعوم في SQLite | إزالته (SQLite يعامل كل String كـ text) |
| `dbgenerated("gen_random_uuid()")` | ❌ PostgreSQL فقط | استبداله بـ `@default(cuid())` |
| `enum` types | ⚠️ Prisma يحوّلها لـ String في SQLite | يعمل لكن بدون validation حقيقي في DB |
| `@@unique([entityId, isActive])` مع Boolean | ⚠️ ممكن يسبب مشاكل | يحتاج logic في الكود بدلاً من constraint |

**✅ الحل:** نحتاج نعيد كتابة المقترح بصيغة SQLite-compatible. هذا سهل ومباشر.

---

## 📋 مقارنة تفصيلية — Model بـ Model

### 1. User (المستخدم)

| الحالي | المقترح | التغيير |
|--------|---------|---------|
| `id String @id @default(cuid())` | `id String @id @default(dbgenerated(...)) @db.Uuid` | تغيير ID strategy |
| `password String` | ❌ محذوف! | 🔴 **خطير** - بدونه ما يقدر يسجّل دخول |
| `name String` (إلزامي) | `name String?` (اختياري) | تغيير بسيط |
| `avatarUrl String?` | `avatarUrl String?` | بدون تغيير |
| `memberships Member[]` | `memberships Member[]` | بدون تغيير |
| `auditLogs AuditLog[]` | ❌ محذوف | AuditLog محذوف بالكامل |

**🔴 مشاكل:**
- **`password` محذوف!** — هذا خطأ واضح. لازم نرجّعه
- `name` اختياري في المقترح — ممكن يسبب مشاكل بالعرض

**✅ التحسين:** نبقي password + name إلزامي + نضيف `role` عام (SUPER_ADMIN vs عادي)

---

### 2. Entity (الكيان)

| الحالي | المقترح | الملاحظة |
|--------|---------|---------|
| `sectorId` → علاقة بـ `Sector` model | `sector String?` (نص حر) | ⚠️ تغيير جذري |
| `industryId` → علاقة بـ `Industry` model | `industry String?` (نص حر) | ⚠️ تغيير جذري |
| `typeId` → علاقة بـ `EntityType` model | ❌ محذوف | ⚠️ تغيير |
| ❌ لا يوجد | `size String?` | ✅ إضافة مفيدة |
| ❌ لا يوجد | `school String?` | ✅ إضافة مفيدة (المدرسة الإدارية) |
| `assessments Assessment[]` | ❌ محذوف من Entity | Assessment انتقل لـ Version |
| `financialDecisions` | ❌ محذوف | FinancialDecision محذوف بالكامل! |
| `integrations` | ❌ محذوف | Integration محذوف بالكامل! |

**🟡 تحليل:**
- **إلغاء جداول التصنيف (Sector, Industry, EntityType):** 
  - ✅ **إيجابي:** يبسّط الـ Schema ويقلل الجداول
  - ❌ **سلبي:** يفقد الـ referential integrity + يصعّب التقارير + بحث غير موحّد
  - 🤔 **رأيي:** الأفضل نبقي `Sector` كجدول مرجعي (لأنه ثابت) ونحوّل `industry` و `size` لنصوص حرة

**🔴 مشاكل:**
- `FinancialDecision` محذوف بالكامل — كان موجود وشغّال!
- `Integration` محذوف بالكامل — كان موجود وشغّال!

---

### 3. Member (العضوية)

| الحالي | المقترح | الملاحظة |
|--------|---------|---------|
| `role String @default("VIEWER")` | `role Role @default(VIEWER)` | تحويل لـ enum |
| Roles: SUPER_ADMIN, ENTITY_ADMIN, STRATEGY_MANAGER, VIEWER | Roles: OWNER, ADMIN, EDITOR, VIEWER | ⚠️ أدوار مختلفة |

**🟡 تحليل:**
- الأدوار الجديدة (OWNER, ADMIN, EDITOR, VIEWER) **أبسط وأوضح**
- لكن ينقصها **SUPER_ADMIN** (مدير النظام العام الذي يدير كل الكيانات)
- **✅ التحسين:** نضيف `role` عام في `User` (SUPER_ADMIN, USER) + `role` في `Member` للدور داخل الكيان

---

### 4. StrategyVersion (القلب الجديد) ⭐

| الحالي | المقترح | الملاحظة |
|--------|---------|---------|
| `versionNumber Int` | ❌ محذوف | المقترح يعتمد على name بدل رقم |
| ❌ لا يوجد | `name String` | ✅ **ممتاز** — اسم وصفي أفضل من رقم |
| ❌ لا يوجد | `description String?` | ✅ مفيد |
| `status String` | `status VersionStatus` (enum) | ✅ أفضل |
| `pivotedFromId` → Linked List | ❌ محذوف | 🟡 تغيير — فقدنا تتبع الـ Pivot |
| ❌ لا يوجد | `isActive Boolean` | ✅ ممتاز — أوضح من status فقط |
| ❌ لا يوجد | `createdBy`, `approvedBy`, `approvedAt` | ✅ **ممتاز للحوكمة** |
| `kpis KPI[]` | ❌ محذوف (KPI يمر عبر Objective فقط) | ⚠️ تغيير مهم |
| `initiatives` | ❌ محذوف بالكامل! | 🔴 StrategicInitiative محذوف! |
| ❌ لا يوجد | `directions StrategicDirection[]` | ✅ **ممتاز** — الهرم الاستراتيجي |
| ❌ لا يوجد | `analyses ExternalAnalysis[]` | ✅ **ممتاز** — PESTEL + Porter |
| `reviews StrategicReview[]` | ❌ محذوف! | 🔴 StrategicReview محذوف! |

**🟢 إيجابيات المقترح:**
- `name` + `description` بدل رقم جاف = **أفضل بكثير**
- `isActive` + constraint = **ضمان نسخة واحدة نشطة**
- `createdBy` + `approvedBy` + `approvedAt` = **حوكمة حقيقية**
- `StrategicDirection` = **حل ذكي** للهرم الاستراتيجي

**🔴 مشاكل:**
- `pivotedFromId` محذوف — **فقدنا Linked List** لتتبع تطور الاستراتيجيات!
- `StrategicInitiative` محذوف — **أين المبادرات؟** (خدمة 3 كاملة!)
- `StrategicReview` محذوف — **أين المراجعات الدورية؟** المقترح وضع `Assessment` بدلاً منها لكن الـ Assessment أصبح شيء مختلف تماماً

**✅ التحسينات المقترحة:**
1. نرجّع `pivotedFromId` — ضروري للحوكمة
2. نرجّع `StrategicInitiative` — ضروري لخدمة 3 (إدارة التنفيذ)
3. نفصل `StrategicReview` عن `Assessment` — لأنهم مفاهيم مختلفة

---

### 5. StrategicDirection (جديد) ✅

**غير موجود في الحالي — إضافة ممتازة!**

```
VISION   → الرؤية
MISSION  → الرسالة  
VALUES   → القيم
ISSUES   → القضايا الكبرى
```

**🟢 تقييم:** ممتاز. حقل `order` ذكي لأن القيم قد تكون متعددة.
**✅ تحسين:** إضافة `LONG_TERM_GOALS` (الأهداف العامة طويلة المدى)

---

### 6. ExternalAnalysis (جديد) ✅

**غير موجود في الحالي — إضافة ممتازة!**

يدعم PESTEL + Porter's Five Forces في model واحد عبر enum `AnalysisType`.

**🟢 تقييم:** تصميم ذكي وموفّر.
**✅ تحسين:** إضافة حقل `trend` (INCREASING, STABLE, DECREASING) لتتبع اتجاه العامل.

---

### 7. StrategicChoice (معدّل بشكل كبير)

| الحالي | المقترح | الملاحظة |
|--------|---------|---------|
| `title, description, status, priority` | `name, description, type, marketAttractiveness, ...` | تغيير شامل |
| بسيط: CRUD عام | **غني:** Ansoff Matrix + Porter's Generic + تقييم كمّي | ✅ أفضل بكثير |
| `risks StrategicRisk[]` (علاقة) | ❌ لا توجد علاقة مع Risk | ⚠️ فقدنا الربط |

**🟢 تقييم:**
- `ChoiceType` enum ممتاز — يربط بأطر نظرية حقيقية
- حقول التقييم (marketAttractiveness, competitiveAdvantage, feasibility) **ممتازة**
- `isSelected` — طريقة ذكية لتحديد الخيار المعتمد

**🔴 مشكلة:**
- فقدنا الربط بين Choice و Risk — **يجب إرجاعه!** كل خيار له مخاطر مرتبطة

---

### 8. StrategicObjective (معدّل)

| الحالي | المقترح | الملاحظة |
|--------|---------|---------|
| هرمية مسطحة | `parentId` → OKR hierarchy | ✅ **ممتاز** |
| بدون perspective | `perspective` → BSC | ✅ **ممتاز** |
| بدون weight | `weight Float` | ✅ مفيد |
| بدون baseline | `baselineValue Float?` | ✅ مفيد |
| بدون deadline | `deadline DateTime?` | ✅ مفيد |
| بدون owner | `ownerId String?` | ✅ مفيد |

**🟢 تقييم:** تحسينات ممتازة بالكامل! BSC + OKR في model واحد.

---

### 9. KPI (معدّل)

| الحالي | المقترح | الملاحظة |
|--------|---------|---------|
| `versionId` (مباشر) | ❌ محذوف — يمر عبر Objective فقط | ⚠️ تغيير مهم |
| `actual Float?` (قيمة واحدة) | ❌ محذوف — يتم عبر `KPIEntry` | ✅ **أفضل** — بيانات تاريخية |
| `nameAr String?` | ❌ محذوف | 🟡 الاسم العربي مهم! |
| `status String` | ❌ محذوف — يُحسب من Entries | ✅ منطقي |
| ❌ لا يوجد | `formula String?` | ✅ مفيد |
| ❌ لا يوجد | `dataSource String?` | ✅ مفيد |
| ❌ لا يوجد | `frequency ReportingFrequency` | ✅ **ضروري** |
| ❌ لا يوجد | `warningThreshold, criticalThreshold` | ✅ **ممتاز للتنبيهات** |
| `diagnoses KpiDiagnosis[]` | ❌ محذوف | 🔴 فقدنا التشخيصات! |

**🟢 إيجابيات:** الثبول والتكرار + الصيغة + المصدر + حدود التنبيه = **مكتمل حقاً**
**🔴 مشاكل:**
- `nameAr` محذوف — **لازم نرجّعه** (تطبيق عربي!)
- لا يوجد `versionId` مباشر — يعني KPI **لازم** يكون مرتبط بهدف. هل هذا مناسب دائماً؟
- `KpiDiagnosis` و `CorrectionAction` محذوفة — **فقدنا خدمة التشخيص والتصحيح بالكامل!**

---

### 10. KPIEntry (جديد) ✅

**غير موجود في الحالي — إضافة ضرورية!**

هذا يحل مشكلة كبيرة: بدل ما `actual` تكون قيمة واحدة في KPI، الآن عندنا **سجل تاريخي** لكل قيمة.

**🟢 تقييم:** تصميم ممتاز.
**✅ تحسين:** إضافة `status` (DRAFT, CONFIRMED) ليسمح بمراجعة البيانات قبل اعتمادها.

---

### 11. StrategicRisk (معدّل)

| الحالي | المقترح | الملاحظة |
|--------|---------|---------|
| `probability String` (HIGH/MED/LOW) | `probability Int` (1-5) | ✅ **أفضل** — كمّي |
| `impact String` (HIGH/MED/LOW) | `impact Int` (1-5) | ✅ **أفضل** — كمّي |
| ❌ لا يوجد | `riskScore Int` (محسوب) | ✅ **ممتاز** |
| ❌ لا يوجد | `category RiskCategory` | ✅ مفيد |
| ❌ لا يوجد | `contingency String?` | ✅ مفيد |
| `choiceId` → علاقة بـ Choice | ❌ محذوف | 🔴 فقدنا الربط! |

**🟢 تقييم:** التقييم الكمّي (1-5) + riskScore **أفضل من النوعي**.
**🔴 مشكلة:** يجب إرجاع `choiceId` لربط المخاطر بالخيارات الاستراتيجية.

---

### 12. Assessment (مختلف تماماً!)

| الحالي | المقترح | الملاحظة |
|--------|---------|---------|
| **تقييم مع أبعاد ومعايير** | **مراجعة دورية للحوكمة** | ⚠️ مفهوم مختلف كلياً! |
| مرتبط بـ Entity | مرتبط بـ Version | تغيير العلاقة |
| يحتوي Dimensions + Criteria | يحتوي findings + recommendations | كيان مختلف |
| يحتوي AnalysisPoint (SWOT) | ❌ محذوف | SWOT أصبح AnalysisPoint في analysis.js |

**🔴 مشكلة كبيرة:** المقترح **أعاد تعريف** Assessment ليصبح Quarterly Review.
- الـ Assessment الأصلي (تقييم مع أبعاد ومعايير) **ضروري** — هذا يُنتج الـ Gap Analysis والـ SWOT
- المراجعة الدورية (Quarterly Review) **يجب أن تكون model منفصل**

**✅ الحل:** نبقي كلاهما:
- `Assessment` = التقييم الأصلي (مع Dimensions + Criteria + AnalysisPoints)
- `StrategicReview` = المراجعة الدورية للحوكمة (ما وصفه المقترح)

---

## 🗑️ ماذا حُذف من الحالي ولم يظهر في المقترح؟

| Model المحذوف | هل نحتاجه؟ | التوصية |
|--------------|------------|---------|
| `Sector` (جدول مرجعي) | ✅ نعم | **نبقيه** — تصنيفات مهمة ومعيارية |
| `Industry` (جدول مرجعي) | 🟡 اختياري | يمكن تحويله لنص في Entity |
| `EntityType` (جدول مرجعي) | 🟡 اختياري | يمكن تحويله لنص في Entity |
| `Dimension` | ✅ نعم | **نبقيه** — ضروري لنظام التقييمات |
| `Criterion` | ✅ نعم | **نبقيه** — ضروري لنظام التقييمات |
| `AnalysisPoint` (SWOT) | ✅ نعم | **نبقيه** — مرتبط بالتقييمات |
| `StrategicInitiative` | ✅ نعم! | **نبقيه** — خدمة 3 كاملة (إدارة التنفيذ) |
| `StrategicReview` | ✅ نعم! | **نبقيه** — خدمة 5 (الحوكمة) |
| `KpiDiagnosis` | ✅ نعم! | **نبقيه** — خدمة 4 (التشخيص) |
| `CorrectionAction` | ✅ نعم! | **نبقيه** — خدمة 4 (التصحيحات) |
| `FinancialDecision` | ✅ نعم | **نبقيه** — خدمة 5 (القرارات المالية) |
| `Integration` | ✅ نعم | **نبقيه** — التكاملات الخارجية |
| `AuditLog` | ✅ نعم | **نبقيه** — الحوكمة والرقابة |

---

## 📊 أثر التغيير على الكود الحالي

### Routes (Backend APIs) — 14 ملف

| Route File | حالته الحالية | أثر التغيير |
|-----------|-------------|------------|
| `auth.js` | ✅ شغّال | ⚠️ يحتاج تعديل (password field) |
| `sectors.js` | ✅ شغّال | 🔴 يتأثر لو حذفنا Sector model |
| `industries.js` | ✅ شغّال | 🔴 يتأثر لو حذفنا Industry model |
| `entities.js` | ✅ شغّال | ⚠️ يحتاج تعديل (حقول جديدة) |
| `users.js` | ✅ شغّال | ⚠️ يحتاج تعديل طفيف |
| `assessments.js` | ✅ شغّال | ⚠️ يحتاج تعديل (إضافة versionId) |
| `strategic.js` | ✅ شغّال | 🔴 يحتاج تعديل كبير (Objectives + KPIs تغيّرت) |
| `reviews.js` | ✅ شغّال | ⚠️ يحتاج تعديل (حقول جديدة) |
| `versions.js` | ✅ شغّال | 🔴 يحتاج تعديل كبير (حقول جديدة كثيرة) |
| `choices.js` | ✅ شغّال | 🔴 يحتاج إعادة كتابة (enum + حقول جديدة) |
| `corrections.js` | ✅ شغّال | ✅ بدون تغيير (لو أبقيناه) |
| `analysis.js` | ✅ شغّال | ✅ بدون تغيير (لو أبقيناه) |
| `financial.js` | ✅ شغّال | ✅ بدون تغيير (لو أبقيناه) |
| `integrations.js` | ✅ شغّال | ✅ بدون تغيير (لو أبقيناه) |
| ❌ لا يوجد | — | 🆕 يحتاج: `directions.js` (جديد) |
| ❌ لا يوجد | — | 🆕 يحتاج: `external-analysis.js` (جديد) |
| ❌ لا يوجد | — | 🆕 يحتاج: `kpi-entries.js` (جديد) |
| ❌ لا يوجد | — | 🆕 يحتاج: `dashboard-api.js` (جديد) |

### Frontend Pages — 15 ملف HTML

| Page | أثر التغيير |
|------|------------|
| `login.html` | ✅ بدون تغيير |
| `dashboard.html` | ⚠️ يحتاج تعديل (Dashboard API) |
| `sectors.html` | 🟡 يعتمد على قرار Sector model |
| `industries.html` | 🟡 يعتمد على قرار Industry model |
| `entities.html` | ⚠️ يحتاج تعديل (حقول جديدة) |
| `users.html` | ⚠️ تعديل طفيف |
| `assessments.html` | ⚠️ يحتاج تعديل |
| `kpis.html` | 🔴 يحتاج تعديل كبير |
| `versions.html` | 🔴 يحتاج تعديل كبير |
| `choices.html` | 🔴 يحتاج إعادة كتابة |
| `corrections.html` | ✅ بدون تغيير |
| `analysis.html` | ✅ بدون تغيير |
| `financial.html` | ✅ بدون تغيير |
| `integrations.html` | ✅ بدون تغيير |

---

## ✅ التوصية النهائية: Schema المُحسَّن (Hybrid)

**الفلسفة: ندمج أفضل ما في المقترح + نحافظ على ما يشتغل حالياً**

### القواعد:
1. ✅ **نأخذ** من المقترح: StrategicDirection, ExternalAnalysis, KPIEntry, BSC/OKR في Objectives
2. ✅ **نحسّن** من الحالي: StrategyVersion (نضيف name, isActive, createdBy, approvedBy)
3. ✅ **نبقي** من الحالي: Sector, Assessment+Dimensions, Corrections, Financial, Integration, AuditLog
4. ✅ **نصلح** توافق SQLite
5. ✅ **نضيف** StrategicAlert model (ناقص من كلا الخيارين!)

### النتيجة المتوقعة:

| Model | المصدر | الحالة |
|-------|--------|--------|
| User | حالي + تحسين | يبقى مع password |
| Sector | حالي | يبقى كجدول مرجعي |
| Entity | **حالي + مقترح** | نضيف size, school كحقول نصية + نبقي sectorId |
| Member | مقترح | Role enum محسّن |
| StrategyVersion | **حالي + مقترح** | name, description, isActive, createdBy, approvedBy, pivotedFromId |
| StrategicDirection | **مقترح** ✨ | جديد — vision/mission/values |
| ExternalAnalysis | **مقترح** ✨ | جديد — PESTEL + Porter |
| StrategicChoice | **مقترح** ✨ | محسّن + نرجّع choiceId في Risk |
| StrategicObjective | **مقترح محسّن** | BSC + OKR + parentId |
| KPI | **حالي + مقترح** | formula, frequency, thresholds + نبقي nameAr + versionId |
| KPIEntry | **مقترح** ✨ | جديد — إدخال البيانات الدوري |
| StrategicRisk | **مقترح محسّن** | كمّي (1-5) + choiceId مرجّع |
| StrategicInitiative | **حالي محسّن** | نضيف startDate, endDate, progress, budget, kpiId |
| StrategicReview | **حالي + مقترح** | نضيف decision, summary, findings |
| Assessment | **حالي** | يبقى مع Dimensions + Criteria + AnalysisPoints |
| Dimension | حالي | يبقى |
| Criterion | حالي | يبقى |
| AnalysisPoint | حالي | يبقى (SWOT) |
| KpiDiagnosis | حالي | يبقى |
| CorrectionAction | حالي | يبقى |
| FinancialDecision | حالي | يبقى |
| Integration | حالي | يبقى |
| AuditLog | حالي | يبقى + نبني API |
| StrategicAlert | **جديد** ✨ | نظام التنبيهات (مفقود من كلا الخيارين!) |
| **المجموع** | | **23 model** |

---

## 🔄 خطة التنفيذ المقترحة

### المرحلة 1: تحديث Schema (بدون كسر الموجود) ⏱ ~4 ساعات
1. إضافة حقول جديدة على Models موجودة (non-breaking changes)
2. إضافة Models جديدة (StrategicDirection, ExternalAnalysis, KPIEntry, StrategicAlert)
3. تشغيل migration
4. تحديث seed data

### المرحلة 2: إنشاء APIs الجديدة ⏱ ~6 ساعات
1. `directions.js` — CRUD لـ StrategicDirection
2. `external-analysis.js` — CRUD لـ ExternalAnalysis
3. `kpi-entries.js` — CRUD لـ KPIEntry
4. `alerts.js` — نظام التنبيهات
5. `audit.js` — CRUD لـ AuditLog
6. `dashboard-api.js` — إحصائيات Dashboard

### المرحلة 3: تعديل APIs الموجودة ⏱ ~4 ساعات
1. تحديث `versions.js` (حقول جديدة)
2. تحديث `strategic.js` (Objectives + KPIs)
3. تحديث `choices.js` (enum + حقول)
4. تحديث `reviews.js` (حقول جديدة)

### المرحلة 4: إنشاء/تعديل الصفحات ⏱ ~8 ساعات
1. صفحة Dashboard بيانات حية
2. صفحة المراجعات الدورية
3. صفحة الأهداف الاستراتيجية
4. صفحة المبادرات
5. صفحة الاتجاه الاستراتيجي (رؤية/رسالة)
6. صفحة الإعدادات
7. تعديل صفحات choice + versions + kpis

**⏱ الإجمالي المُقدّر: ~22 ساعة (3-4 أيام عمل)**

---

## ❓ أسئلة تحتاج قرارك قبل البدء:

1. **Sector model:** نبقيه كجدول مرجعي أو نحوّله لنص حر في Entity؟
2. **Industry model:** نبقيه أو نحذفه ونكتفي بنص حر؟
3. **الأدوار:** نستخدم (OWNER, ADMIN, EDITOR, VIEWER) أو (SUPER_ADMIN, ENTITY_ADMIN, STRATEGY_MANAGER, VIEWER)؟
4. **هل نبدأ المرحلة 1 (Schema) الآن أو نعتمد التقرير أولاً؟**
