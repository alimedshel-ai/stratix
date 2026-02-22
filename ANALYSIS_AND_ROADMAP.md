# 🔬 تحليل الفجوة + خارطة التطوير — Stratix
> التاريخ: 17 فبراير 2026

---

## 1️⃣ تحليل الفجوة: الوثيقة vs الواقع

### Schema — ماذا يوجد فعلاً؟

| العنصر في الوثيقة | الموجود في schema.prisma | الفجوة |
|---|---|---|
| `User` (id, email, name) | ✅ موجود + password + systemRole + avatarUrl | لا فجوة |
| `Entity` (legalName, size, culture) | ⚠️ موجود بدون `culture` — يوجد `school` بدلاً منها | `culture` → `school` (نفس المفهوم، اسم مختلف) |
| `EntitySize` enum | ❌ غير موجود كـ enum — حقل `size` نصي (MICRO/SMALL/MEDIUM/LARGE/ENTERPRISE) | يحتاج تحويل لـ enum أو يبقى String (أفضل لمرونة SQLite) |
| `BusinessCulture` enum | ❌ غير موجود — `school` نصي (BALANCED_SCORECARD/OKR/HOSHIN_KANRI) | الوثيقة تقترح (أمريكية/يابانية/أوروبية/إسلامية) — مفهوم جديد |
| `StrategyVersion` | ✅ موجود + حقول غنية (isActive, pivotedFromId, approvedBy) | أغنى من الوثيقة |
| `ToolDefinition` | ❌ **غير موجود** | 🔴 يحتاج بناء كامل |
| `CompanyAnalysis` (JSON مرن) | ❌ **غير موجود** | 🔴 يحتاج بناء كامل |
| `Member` (ربط User-Entity) | ✅ موجود مع roles | لا فجوة |
| `Company` + `Subscription` | ✅ موجود (غير مذكور بالوثيقة) | الواقع أغنى |
| `Sector/Industry/EntityType` | ✅ موجود (غير مذكور بالوثيقة) | الواقع أغنى |

### الأدوات — ماذا يعمل فعلاً؟

| الأداة | الوثيقة تقول | الواقع | التفصيل |
|---|---|---|---|
| **SWOT** | ✅ جاهزة | ✅ **يعمل** | `AnalysisPoint` (S/W/O/T) + API كامل + صفحة |
| **PESTEL** | ✅ جاهزة | ✅ **يعمل** | `ExternalAnalysis` (6 أنواع) + API + grouped endpoint |
| **Porter 5** | ✅ جاهزة | ✅ **يعمل** | `ExternalAnalysis` (5 أنواع PORTER_*) + API |
| **TOWS** | ✅ جاهزة | ❌ **لا يوجد** | لا حقل towsStrategy، لا ربط S↔O |
| **Blue Ocean** | ✅ جاهزة | ❌ **لا يوجد** | لا model ولا API |
| **Ansoff** | ✅ جاهزة | ⚠️ **جزئي** | `StrategicChoice.choiceType` يدعم 4 أنواع Ansoff لكن بدون واجهة matrix |
| **BSC/OKR** | ✅ جاهزة | ⚠️ **جزئي** | `StrategicObjective.perspective` (BSC) + `parentId` (OKR) — يعمل لكن بدون واجهة BSC رسمية |
| **VRIO** | Sprint 3 | ❌ **لا يوجد** | — |
| **Scenario** | Sprint 3 | ❌ **لا يوجد** | — |
| **Hoshin** | Sprint 4 | ❌ **لا يوجد** | — |
| **BCG** | Sprint 4 | ❌ **لا يوجد** | — |
| **McKinsey 7S** | Sprint 4 | ❌ **لا يوجد** | — |
| **GE Matrix** | Sprint 4 | ❌ **لا يوجد** | — |

### الصفحات — ماذا يوجد فعلاً؟

| الصفحة | الموجود | ما تحتاجه الوثيقة |
|---|---|---|
| `landing.html` | ✅ | ✅ متوافق |
| `onboarding.html` | ✅ (4 خطوات) | ⚠️ الوثيقة تطلب 3 أسئلة ذكية (حجم/هدف/قطاع) → الموجود أشمل |
| `dashboard.html` | ✅ إحصائيات عامة | ⚠️ الوثيقة تطلب لوحة أدوات بنسب تقدم — غير موجودة |
| `analysis.html` | ✅ SWOT | ⚠️ بدون TOWS |
| `assessments.html` | ✅ | ✅ |
| `choices.html` | ✅ جدول خيارات | ⚠️ بدون Ansoff matrix بصري |
| `objectives.html` | ✅ | ⚠️ بدون BSC 4-perspectives view |
| `tools.html` | ❌ | 🔴 **الصفحة الأهم — المسار الاستراتيجي** |
| `tool-detail.html` | ❌ | 🔴 صفحة تفاصيل كل أداة |
| صفحة المقارنة | ❌ | 🔴 مقارنة بين النسخ |
| تصدير PDF | ❌ | 🔴 التقرير النهائي |

### APIs — ماذا يوجد فعلاً؟

| Route | الملف | Endpoints | الحالة |
|---|---|---|---|
| `/api/analysis` | analysis.js | 5 (CRUD + SWOT matrix) | ✅ يعمل |
| `/api/external-analysis` | external-analysis.js | 6 (CRUD + grouped) | ✅ يعمل |
| `/api/strategic` | strategic.js | ~12 (Objectives + KPIs CRUD) | ✅ يعمل |
| `/api/choices` | choices.js | ~10 (Choices + Risks CRUD) | ✅ يعمل |
| `/api/assessments` | assessments.js | ~10 (+ Dimensions + Criteria) | ✅ يعمل |
| `/api/tools` | ❌ لا يوجد | — | 🔴 مطلوب |
| `/api/company-analysis` | ❌ لا يوجد | — | 🔴 مطلوب |

---

## 2️⃣ النقاط الحرجة

### 🔴 فجوات خطيرة (تمنع المنتج من الاكتمال):
1. **لا يوجد ToolDefinition** — لا طريقة لتعريف الأدوات وتصنيفها
2. **لا يوجد CompanyAnalysis** — لا طبقة موحدة تجمع كل التحليلات
3. **لا يوجد صفحة المسار** — المستخدم لا يرى "أين هو" في الرحلة
4. **لا ربط تلقائي** — SWOT لا يغذي TOWS، PESTEL لا يغذي القرارات

### 🟡 فجوات متوسطة (المنتج يعمل بدونها لكن ناقص):
1. **Onboarding لا يحدد الأدوات** — المستخدم يسجل لكن لا يعرف "ما بعد التسجيل"
2. **Dashboard عام** — لا يعرض تقدم الأدوات ولا المسار
3. **TOWS غير موجود** — وهو الجسر بين التحليل والتنفيذ
4. **لا تصدير** — لا PDF ولا تقرير

### 🟢 نقاط قوة (ما عندنا أفضل من الوثيقة):
1. **Schema أغنى** — Company/Subscription/Audit غير مذكورة بالوثيقة
2. **Versioning** — pivotedFromId يدعم تتبع التحولات (الوثيقة لا تذكره)
3. **Alert System** — StrategicAlert + Review Intelligence موجودة
4. **KPI Entries** — نظام إدخال دوري للبيانات (الوثيقة لا تذكره)
5. **Corrections/Diagnoses** — تشخيص وإجراءات تصحيحية (غير مذكورة)

---

## 3️⃣ القرارات المعمارية المطلوبة

### القرار 1: هل نستخدم Enum أو String؟
- **التوصية:** نبقى على **String** (الوضع الحالي)
- **السبب:** SQLite لا يدعم enum فعلياً، والمرونة أفضل للإضافات المستقبلية

### القرار 2: culture vs school؟
- **الوثيقة:** تقترح `BusinessCulture` (أمريكية/يابانية/أوروبية/إسلامية)
- **الموجود:** `school` (BALANCED_SCORECARD/OKR/HOSHIN_KANRI)
- **التوصية:** **ندمج الاثنين** — `school` يبقى كحقل للمنهجية، ونضيف `culture` كحقل جديد يحدد الأدوات المقترحة
- **العلاقة:** كل culture تقترح مجموعة أدوات، لكن المستخدم حر في تغييرها

### القرار 3: أين تُخزَّن بيانات الأدوات؟
- **الوثيقة:** `CompanyAnalysis.content` (JSON واحد)
- **الواقع:** بيانات مفرّقة (AnalysisPoint, ExternalAnalysis, etc.)
- **التوصية:** **نظام مزدوج** — الأدوات الموجودة تبقى في جداولها + CompanyAnalysis يعمل كـ "فهرس" يشير إليها + الأدوات الجديدة تستخدم JSON

### القرار 4: CompanyAnalysis مربوط بـ Entity أو Version؟
- **الوثيقة:** `entityId`
- **التوصية:** **`versionId`** — لأن نفس الكيان قد يكون له أكثر من نسخة استراتيجية
- **السبب:** يدعم المقارنة بين النسخ ويتوافق مع ExternalAnalysis الموجود

---

## 4️⃣ خطة التطوير المرحلية

### 🟢 Sprint 1: البنية التحتية (3 أيام)

**الهدف:** وضع الأساس الذي يُبنى عليه كل شيء

| المهمة | التفصيل | الأولوية |
|---|---|---|
| 1.1 إضافة ToolDefinition للـ Schema | كود + اسم عربي/إنجليزي + مرحلة + isPrimary + icon + configSchema | P0 |
| 1.2 إضافة CompanyAnalysis للـ Schema | versionId + toolCode + status + data(JSON) + score | P0 |
| 1.3 إضافة culture لـ Entity | حقل String اختياري (AMERICAN/JAPANESE/EUROPEAN/ISLAMIC) | P1 |
| 1.4 Migration | prisma migrate dev | P0 |
| 1.5 Seed script | بذر 13 أداة مع بياناتها العربية/الإنجليزية | P0 |
| 1.6 routes/tools.js | GET /api/tools (مع فلتر isPrimary + phase) + GET /:code + POST /seed | P0 |
| 1.7 routes/company-analysis.js | CRUD أساسي لـ CompanyAnalysis | P0 |
| 1.8 ربط Routes بـ server.js | app.use('/api/tools') + app.use('/api/company-analysis') | P0 |

**اختبارات Sprint 1:**
```
T1: POST /api/tools/seed → 13 أداة
T2: GET /api/tools?primary=true → 8 أدوات
T3: GET /api/tools?phase=DIAGNOSIS → 3-5 أدوات
T4: POST /api/company-analysis (VRIO) → 201 + JSON data
T5: GET /api/company-analysis/:versionId → كل التحليلات
T6: POST company-analysis مكرر (نفس version + tool) → 409
```

---

### 🟡 Sprint 2: صفحة المسار + ربط الموجود (4 أيام)

**الهدف:** المستخدم يرى رحلته الاستراتيجية كاملة

| المهمة | التفصيل | الأولوية |
|---|---|---|
| 2.1 tools.html | صفحة المسار الاستراتيجي — 4 مراحل + بطاقات الأدوات + شريط تقدم | P0 |
| 2.2 زر الوضع المتقدم | toggle يظهر/يخفي الأدوات الثانوية | P1 |
| 2.3 ربط SWOT | API يسحب AnalysisPoint → يعرضها في CompanyAnalysis | P0 |
| 2.4 ربط PESTEL | API يسحب ExternalAnalysis (PESTEL) → CompanyAnalysis | P0 |
| 2.5 ربط Porter | API يسحب ExternalAnalysis (PORTER) → CompanyAnalysis | P1 |
| 2.6 ربط Ansoff | API يسحب StrategicChoice → CompanyAnalysis | P1 |
| 2.7 ربط BSC/OKR | API يسحب StrategicObjective → CompanyAnalysis | P1 |
| 2.8 تحديث Dashboard | إضافة قسم "المسار الاستراتيجي" بنسب التقدم | P1 |

**اختبارات Sprint 2:**
```
E1: فتح /tools → ظهور 4 مراحل + 8 بطاقات
E2: ضغط "وضع متقدم" → ظهور 5 بطاقات إضافية
E3: بعد إضافة 4 نقاط SWOT → بطاقة SWOT تتحول لـ "مكتمل"
E4: فتح Dashboard → قسم المسار يعرض التقدم الإجمالي
```

---

### 🔵 Sprint 3: TOWS + VRIO + Blue Ocean (4 أيام)

**الهدف:** 3 أدوات جديدة كاملة الوظائف

| المهمة | التفصيل | الأولوية |
|---|---|---|
| 3.1 TOWS — Schema | إضافة towsStrategy + linkedPointId لـ AnalysisPoint | P0 |
| 3.2 TOWS — API | endpoint يسحب SWOT ويقترح تقاطعات SO/WO/ST/WT | P0 |
| 3.3 TOWS — UI | مصفوفة 2×2 تفاعلية + ربط بنقاط SWOT بالسحب | P0 |
| 3.4 VRIO — Data Schema | JSON: resources[{name, V, R, I, O, result}] | P0 |
| 3.5 VRIO — UI | جدول تفاعلي + حساب تلقائي للنتيجة (Competitive Advantage) | P0 |
| 3.6 Blue Ocean — Data Schema | JSON: factors[{name, industry, company, action}] + 4 actions | P0 |
| 3.7 Blue Ocean — UI | Strategy Canvas (رسم بياني خطي) + ERRC Grid | P0 |
| 3.8 tool-detail.html | صفحة قالب تتكيف حسب نوع الأداة | P0 |

**اختبارات Sprint 3:**
```
E5: إنشاء SWOT (4 نقاط) → فتح TOWS → ظهور التقاطعات
E6: إنشاء TOWS → ربط S1+O1 = استراتيجية SO
E7: إنشاء VRIO (3 موارد) → حساب: Sustained/Temporary/Parity
E8: إنشاء Blue Ocean (5 عوامل) → رسم Strategy Canvas
E9: إكمال 3 أدوات → التقدم الإجمالي يتحدث (~40%)
```

---

### 🟣 Sprint 4: Scenario + Hoshin + المقارنة (4 أيام)

**الهدف:** أدوات التكيف + التنفيذ المتقدمة

| المهمة | التفصيل | الأولوية |
|---|---|---|
| 4.1 Scenario Planning — Schema | JSON: scenarios[{name, probability, impacts[], actions[]}] | P0 |
| 4.2 Scenario Planning — UI | بطاقات سيناريوهات + تأثيرات + احتمالات | P0 |
| 4.3 Hoshin Kanri — Schema | JSON: breakthroughObjectives[{targets[], actions[]}] | P1 |
| 4.4 Hoshin Kanri — UI | X-Matrix مبسط (هدف → أهداف سنوية → إجراءات شهرية) | P1 |
| 4.5 صفحة المقارنة | مقارنة Version 1 vs Version 2 (كل الأدوات) | P1 |
| 4.6 API الملخص الشامل | GET /company-analysis/:versionId/summary → تقرير شامل | P0 |

**اختبارات Sprint 4:**
```
E10: إنشاء 3 سيناريوهات (متفائل/واقعي/متشائم) → عرضها
E11: إنشاء Hoshin (هدف → 4 أهداف سنوية → إجراءات) → X-Matrix
E12: إنشاء Version 2 → مقارنة مع Version 1 → الفروقات
E13: GET /summary → تقرير يجمع كل الأدوات المكتملة
```

---

### ⚫ Sprint 5: الأدوات المتقدمة + التقرير (3 أيام)

**الهدف:** الأدوات الثانوية + التصدير

| المهمة | التفصيل | الأولوية |
|---|---|---|
| 5.1 BCG Matrix | مصفوفة 2×2 (Growth vs Share) — Stars/Cash Cows/Dogs/? | P2 |
| 5.2 McKinsey 7S | 7 عناصر (Strategy/Structure/Systems/...) + radar chart | P2 |
| 5.3 GE Matrix | مصفوفة 3×3 (Attractiveness vs Strength) | P2 |
| 5.4 PDF Export | تقرير شامل (ملخص + كل أداة + توصيات) | P1 |
| 5.5 Onboarding ذكي | ربط 3 أسئلة الدخول → اقتراح أدوات تلقائياً | P1 |

---

### 🌟 Sprint 6: الذكاء + التحسين (3 أيام)

**الهدف:** الربط التلقائي + AI بسيط

| المهمة | التفصيل | الأولوية |
|---|---|---|
| 6.1 Auto-link | SWOT مكتمل → اقتراح TOWS → اقتراح Ansoff | P1 |
| 6.2 Smart Suggestions | بناءً على البيانات → اقتراح الأداة التالية | P1 |
| 6.3 Health Score | نتيجة شاملة (0-100) بناءً على اكتمال الأدوات وجودة البيانات | P2 |
| 6.4 تنبيهات ذكية | "SWOT لم يُحدَّث منذ 30 يوم" / "TOWS فارغ رغم اكتمال SWOT" | P2 |

---

## 5️⃣ جدول زمني ملخص

```
الأسبوع 1:  Sprint 1 (بنية تحتية) + بداية Sprint 2 (صفحة المسار)
الأسبوع 2:  Sprint 2 (ربط الموجود) + Sprint 3 (TOWS + VRIO)
الأسبوع 3:  Sprint 3 (Blue Ocean) + Sprint 4 (Scenario + Hoshin)
الأسبوع 4:  Sprint 4 (مقارنة) + Sprint 5 (أدوات متقدمة)
الأسبوع 5:  Sprint 5 (PDF) + Sprint 6 (ذكاء + تحسين)
الأسبوع 6:  اختبارات شاملة + تحسينات + إطلاق
```

---

## 6️⃣ مصفوفة الأولويات

| الأولوية | ماذا؟ | لماذا؟ |
|---|---|---|
| **P0 — حرج** | ToolDefinition + CompanyAnalysis + tools.html + TOWS + VRIO | بدونها المنتج ناقص جوهرياً |
| **P1 — مهم** | Blue Ocean + Scenario + Dashboard تقدم + PDF + Onboarding ذكي | يرفع قيمة المنتج بشكل كبير |
| **P2 — تحسين** | BCG + 7S + GE + AI Suggestions + Health Score | للباقة المتقدمة/الاستشارية |

---

## 7️⃣ المخاطر

| المخاطر | الاحتمال | الأثر | التخفيف |
|---|---|---|---|
| JSON المرن يصعّب الاستعلام | متوسط | عالي | فهرسة الحقول المهمة + views محسوبة |
| SQLite لا يدعم JSON queries | عالي | متوسط | استخدام JSON.parse في JS + ترحيل لـ PostgreSQL مستقبلاً |
| تعقيد الربط التلقائي | متوسط | متوسط | البدء بربط يدوي ثم أتمتة تدريجية |
| واجهات الأدوات معقدة (Canvas/Matrix) | عالي | متوسط | استخدام Chart.js + بناء component واحد قابل لإعادة الاستخدام |
