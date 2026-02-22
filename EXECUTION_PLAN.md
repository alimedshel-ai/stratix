# 🗺️ خطة التنفيذ المرحلية — Stratix Schema Upgrade
**التاريخ:** 16 فبراير 2026
**المنهجية:** Build → Test → Approve → Continue

---

## 📐 القاعدة الذهبية

> **كل مرحلة تنتهي بفحص + اعتماد قبل البدء بالتالية.**
> لا ننتقل لمرحلة جديدة إلا بعد ما نتأكد إن الموجود شغّال 100%.

---

## المرحلة 0: النسخ الاحتياطي ⏱ 5 دقائق
**المهمة:** حماية الكود الحالي قبل أي تعديل

- [ ] نسخ قاعدة البيانات `prisma/dev.db`
- [ ] نسخ الـ Schema الحالي `prisma/schema.prisma`

**✅ نقطة الفحص:** الملفات محفوظة ونقدر نرجع لأي لحظة

---

## المرحلة 1: تحديث Schema (الأساس) ⏱ ~30 دقيقة

**الهدف:** تحديث Schema بدون كسر أي شي شغّال

**المهام:**
1. إضافة حقول جديدة على Models موجودة (additive — لا تكسر الكود):
   - `StrategyVersion` ← name, description, isActive, createdBy, approvedBy, approvedAt
   - `StrategicObjective` ← parentId, perspective, weight, baselineValue, deadline, ownerId
   - `KPI` ← formula, dataSource, frequency, warningThreshold, criticalThreshold
   - `StrategicInitiative` ← startDate, endDate, progress, budget
   - `StrategicReview` ← decision, summary, findings, recommendations
   - `StrategicRisk` ← category, riskScore, contingency (+ تحويل probability/impact لأرقام)
   - `Entity` ← size, school

2. إضافة Models جديدة بالكامل:
   - `StrategicDirection` (رؤية/رسالة/قيم)
   - `ExternalAnalysis` (PESTEL + Porter)
   - `KPIEntry` (إدخال البيانات الدوري)
   - `StrategicAlert` (نظام التنبيهات)

3. تشغيل Migration
4. تحديث Seed Data

**✅ نقطة الفحص (فحص المرحلة 1):**
- [ ] `npx prisma migrate dev` ينجح بدون أخطاء
- [ ] `npx prisma generate` ينجح
- [ ] السيرفر يشتغل `node server.js`
- [ ] كل الـ APIs الحالية لا تزال تعمل (نفحص 3-4 endpoints أساسية)
- [ ] البيانات القديمة ما ضاعت

**⏸️ توقف هنا ← أرسل لك النتائج ← تعتمد ← نكمل**

---

## المرحلة 2: APIs الجديدة ⏱ ~2 ساعة

**الهدف:** بناء الـ APIs للـ Models الجديدة (بدون لمس القديم)

**المهام:**
1. `routes/directions.js` — CRUD لـ StrategicDirection (vision/mission/values)
2. `routes/external-analysis.js` — CRUD لـ ExternalAnalysis (PESTEL + Porter)
3. `routes/kpi-entries.js` — CRUD لـ KPIEntry (إدخال البيانات)
4. `routes/alerts.js` — نظام التنبيهات
5. `routes/audit.js` — CRUD لـ AuditLog
6. `routes/dashboard-api.js` — إحصائيات Dashboard
7. تسجيل كل الـ routes في `server.js`

**✅ نقطة الفحص (فحص المرحلة 2):**
- [ ] كل API جديد يرد 200 (نفحص بـ curl)
- [ ] CRUD يعمل (Create → Read → Update → Delete)
- [ ] الـ APIs القديمة لا تزال تعمل
- [ ] السيرفر مستقر

**⏸️ توقف هنا ← أرسل لك النتائج ← تعتمد ← نكمل**

---

## المرحلة 3: تعديل APIs الموجودة ⏱ ~2 ساعة

**الهدف:** تحديث الـ APIs الحالية لتدعم الحقول والمنطق الجديد

**المهام:**
1. تحديث `versions.js` — دعم الحقول الجديدة (name, isActive, createdBy, approvedBy)
2. تحديث `strategic.js` — Objectives (BSC perspective, parentId) + KPIs (frequency, thresholds)
3. تحديث `choices.js` — ChoiceType + حقول التقييم الكمّي
4. تحديث `reviews.js` — decision (CONTINUE/ADJUST/PIVOT) + findings
5. تحديث `entities.js` — حقول size, school
6. إصلاح `settings` route — صفحة حقيقية بدل redirect

**✅ نقطة الفحص (فحص المرحلة 3):**
- [ ] كل API معدّل يرد 200
- [ ] الحقول الجديدة تظهر في الـ response
- [ ] البيانات القديمة ما تأثرت
- [ ] لا أخطاء في console

**⏸️ توقف هنا ← أرسل لك النتائج ← تعتمد ← نكمل**

---

## المرحلة 4: الصفحات الجديدة ⏱ ~3 ساعات

**الهدف:** بناء الصفحات الناقصة

**المهام (بالترتيب):**
1. `dashboard.html` — تعديل ليجلب بيانات حية من Dashboard API
2. `reviews.html` — صفحة المراجعات الدورية (جديدة)
3. `objectives.html` — صفحة الأهداف الاستراتيجية (جديدة)
4. `initiatives.html` — صفحة المبادرات (جديدة)
5. `settings.html` — صفحة الإعدادات (جديدة)

**✅ نقطة الفحص (فحص المرحلة 4):**
- [ ] كل صفحة جديدة تُفتح بدون أخطاء
- [ ] البيانات تظهر من الـ API
- [ ] CRUD يعمل من الواجهة
- [ ] فحص بصري (التصميم متناسق مع باقي الصفحات)

**⏸️ توقف هنا ← أرسل لك النتائج ← تعتمد ← نكمل**

---

## المرحلة 5: تعديل الصفحات الموجودة ⏱ ~2 ساعة

**الهدف:** تحديث الصفحات الحالية لتدعم الحقول الجديدة

**المهام:**
1. `versions.html` — حقول name, description, approval
2. `choices.html` — ChoiceType enum + تقييم كمّي
3. `kpis.html` — frequency, thresholds, data entry link
4. `entities.html` — حقول size, school
5. توحيد Sidebar في كل الصفحات الجديدة

**✅ نقطة الفحص (فحص المرحلة 5):**
- [ ] كل الصفحات المعدّلة تعمل
- [ ] الحقول الجديدة تظهر وتحفظ
- [ ] Sidebar موحّد في كل الصفحات
- [ ] فحص بصري شامل

**⏸️ توقف هنا ← أرسل لك النتائج ← تعتمد ← نكمل**

---

## المرحلة 6: الذكاء والأتمتة ⏱ ~2 ساعة

**الهدف:** إضافة المنطق الذكي

**المهام:**
1. محرك التنبيهات — Auto-generate alerts عند انحراف KPI
2. Health Score API — حساب صحة الكيان
3. محرك القرارات — Continue/Adjust/Pivot recommendations
4. حساب riskScore تلقائي في StrategicRisk

**✅ نقطة الفحص النهائية:**
- [ ] التنبيهات تُنشأ تلقائياً
- [ ] Health Score يُحسب صح
- [ ] كل الخدمات الستة مغطّاة
- [ ] فحص شامل نهائي

---

## المرحلة 7: الجهاز العصبي الاستراتيجي ⏱ ~5 ساعات ✅ مكتمل

**الهدف:** توصيل "الأسلاك" بين الأنظمة الموجودة — تحويل المنصة من أدوات منفصلة لمنظومة ذكية

### 7.1 الحلقة المغلقة: Correction ↔ SWOT (1 ساعة) ✅
**المهام:**
1. ✅ إضافة حقل `analysisPointId` في `CorrectionAction` (ربط بنقطة SWOT)
2. ✅ عند إنشاء تصحيح → النظام يقترح ربطه بنقطة ضعف موجودة (`GET /api/corrections/suggest-swot/:diagnosisId`)
3. ✅ عند إغلاق تصحيح ناجح → تنبيه "نقطة ضعف W3 قد عُولجت" (StrategicAlert type: CORRECTION_SUCCESS)
4. ✅ Migration (`prisma db push`)

### 7.2 Root Cause عبر BSC (2 ساعة) ✅
**المهام:**
1. ✅ عند انخفاض KPI في منظور CUSTOMER:
   - تتبع CausalLinks للخلف: Customer ← Internal ← Learning
   - عرض "السبب المحتمل: فجوة في [هدف التعلم X]"
2. ✅ إضافة endpoint: `GET /api/alert-engine/root-cause/:kpiId`
3. ✅ تحديث Intelligence dashboard لعرض Root Cause مع كل تنبيه

### 7.3 توصيل الأسلاك (2 ساعة) ✅
**المهام:**
1. ✅ TOWS → Initiatives: لما تُعتمد استراتيجية TOWS → تتحول لمبادرة تلقائياً (`POST /api/alert-engine/tows-to-initiative`)
2. ✅ Alert → CausalLink: التنبيه يشمل "الأهداف المتأثرة" عبر السلسلة السببية (`GET /api/alert-engine/impact-chain/:objectiveId`)
3. ✅ Correction → Review: التصحيحات تظهر تلقائياً في المراجعة الدورية (`GET /api/corrections/for-review/:versionId`)
4. ✅ Intelligence → تحليل: نتائج الذكاء تربط بنقاط SWOT (Root Cause + TOWS convert في intelligence.html)

**✅ نقطة الفحص:**
- [x] إنشاء تصحيح → النظام يقترح نقطة ضعف مرتبطة
- [x] انخفاض KPI → يظهر السبب الجذري عبر BSC
- [x] اعتماد TOWS → تتولد مبادرة تلقائياً
- [x] المراجعة الدورية تعرض التصحيحات التابعة لها

**⏸️ توقف ← نتائج ← اعتماد ← نكمل**

---

## المرحلة 8: الصلاحيات + دور مُدخل البيانات ⏱ ~4 ساعات ✅ مكتمل

**الهدف:** إضافة نظام صلاحيات مرن للـ Sidebar + دور DATA_ENTRY الجديد

### 8.1 تحديث Schema ✅
**المهام:**
1. ✅ إضافة قيمة `DATA_ENTRY` لـ `Member.role`
2. ✅ إضافة جدول `DataEntryPermission` — صلاحيات مرنة لكل مُدخل:
   ```
   DataEntryPermission {
     id, memberId,
     canEnterKPI, canEnterFinancial, canEnterReviews,
     canEnterAnalysis, canUploadFiles,
     departmentScope
   }
   ```
3. ✅ تشغيل Migration (`prisma db push`)

### 8.2 فلترة الـ Sidebar بناءً على الدور ✅
**المهام:**
1. ✅ تحديث `sidebar.js` — قراءة الدور من localStorage وفلترة العناصر
2. ✅ خريطة صلاحيات:
   - `SUPER_ADMIN` → كل شي
   - `OWNER` / `ADMIN` → كل شي ماعدا إدارة النظام
   - `EDITOR` → التنفيذ + التحليل الأساسي
   - `VIEWER` → مشاهدة فقط (Dashboard + الرئيسية)
   - `DATA_ENTRY` → مركز البيانات فقط (إدخال مؤشرات)

### 8.3 حماية الـ APIs ✅
**المهام:**
1. ✅ إنشاء middleware `checkPermission(role)` — تسلسل هرمي
2. ✅ إنشاء middleware `checkDataEntryPermission(field)` — فحص دقيق لـ DATA_ENTRY
3. ✅ إنشاء middleware `requireRole(...roles)` — قائمة أدوار محددة
4. ✅ حماية routes المستخدمين (users.js) — ADMIN+ فقط للـ write
5. ✅ حماية routes الكيانات (entities.js) — ADMIN+ فقط للـ write
6. ✅ حماية routes إدخال KPI (kpi-entries.js) — DATA_ENTRY+ مع فحص الصلاحية

**✅ نقطة الفحص:**
- [x] مستخدم VIEWER ما يشوف صفحات الإدارة في Sidebar
- [x] مستخدم DATA_ENTRY يشوف sidebar مبسط (مركز البيانات فقط)
- [x] APIs محمية — رفض 403 للعمليات غير المصرح بها
- [x] SUPER_ADMIN يتجاوز كل الفحوصات

---

## المرحلة 9: رفع الملفات + الاستيراد الذكي ⏱ ~6 ساعات ✅ مكتمل

**الهدف:** تمكين المستخدمين من رفع ملفات Excel/Word والنظام يقرأها تلقائياً

### 9.1 البنية التحتية للرفع ✅
**المهام:**
1. ✅ تركيب المكتبات: `xlsx` (SheetJS) + `mammoth` + `multer`
2. ✅ إنشاء مجلد `uploads/` مع تنظيف تلقائي (كل 30 دقيقة)
3. ✅ إنشاء `routes/import.js`:
   - `POST /api/import/upload` → رفع + تحليل أولي (preview)
   - `POST /api/import/confirm` → تأكيد وحفظ
   - `GET /api/import/templates/:type` → تحميل قالب فارغ
   - `GET /api/import/history` → سجل الاستيراد

### 9.2 محرك القراءة ✅
**المهام:**
1. ✅ **Excel Parser** — `.xlsx`, `.xls`, `.csv` → JSON + fuzzy matching للمؤشرات
2. ✅ **Word Parser** — `.docx` → نصوص + جداول → استخراج بنية
3. ✅ **Validation** — أرقام، تواريخ، حقول مطلوبة، أنواع صحيحة
4. ✅ **Auto-Detection** — كشف نوع البيانات من عناوين الأعمدة

### 9.3 قوالب Excel جاهزة ✅
✅ 4 قوالب مع بيانات نموذجية:
- KPI Entry (إدخال المؤشرات)
- Financial (القرارات المالية)
- SWOT (تحليل SWOT)
- Initiatives (المبادرات)

### 9.4 صفحة الرفع ✅
**المهام:**
1. ✅ `import.html` — Drag & Drop + اختيار نوع البيانات
2. ✅ شاشة Preview (✅ صحيح | ⚠️ تحذير | ❌ خطأ)
3. ✅ شاشة النتيجة مع تفاصيل الأخطاء
4. ✅ Context Selector (كيان + نسخة استراتيجية)
5. ✅ تكامل مع Sidebar

### 9.5 دوال الحفظ ✅
- ✅ `saveKPIEntries` — حفظ مؤشرات مع fuzzy name matching
- ✅ `saveFinancialData` — حفظ قرارات مالية
- ✅ `saveSWOTData` — حفظ نقاط SWOT + ترميز تلقائي
- ✅ `saveInitiatives` — حفظ مبادرات استراتيجية

**✅ نقطة الفحص:**
- [x] رفع Excel → معاينة → حفظ ناجح
- [x] رفع Word → استخراج نص + جداول
- [x] قالب فارغ → تعبئة → رفع → بيانات صحيحة
- [x] Validation يكشف الأخطاء قبل الحفظ

---

## المرحلة 10: واجهات الأدوات الناقصة ⏱ ~8 ساعات ✅ مكتمل

**الهدف:** بناء واجهات الإدخال للأدوات اللي عندها Schema بدون UI

### 10.1 أداة VRIO (2 ساعة)
- واجهة إدخال الموارد (4 أسئلة: V/R/I/O)
- حساب النتيجة: تكافؤ / ميزة مؤقتة / مستدامة / مستغلّة
- ربط مع CompanyAnalysis (toolCode = VRIO)

### 10.2 أداة Blue Ocean (2 ساعة)
- Strategy Canvas (رسم بياني: صناعة vs شركة)
- مصفوفة 4 إجراءات: Eliminate / Reduce / Raise / Create
- ربط مع CompanyAnalysis (toolCode = BLUE_OCEAN)

### 10.3 أداة Hoshin Kanri (2 ساعة)
- X-Matrix مبسط: أهداف اختراقية → سنوية → شهرية
- ربط مع StrategicObjective الموجودة
- ربط مع CompanyAnalysis (toolCode = HOSHIN)

### 10.4 أداة Scenario Planning (2 ساعة)
- سيناريوهات (متفائل / متوسط / متشائم)
- استيراد عوامل PESTEL تلقائياً
- ربط مع CompanyAnalysis (toolCode = SCENARIO)

**✅ نقطة الفحص:**
- [x] كل أداة: إدخال → حساب → عرض بصري
- [x] كل الأدوات تسجّل في CompanyAnalysis
- [x] الأدوات الأربع مدمجة في `strategic-tools.html`

---

## المرحلة 11: OKRs (الأهداف والنتائج الرئيسية) ⏱ ~4 ساعات ✅ مكتمل

**الهدف:** بناء نظام OKRs يعمل بالتوازي مع BSC الموجود

### 11.1 Schema + API (2 ساعة)
**المهام:**
1. استخدام StrategicObjective الموجود مع `parentId` كهيكل OKR:
   - Objective = هدف بدون parent (أو parent = vision)
   - Key Result = هدف فرعي مع `targetValue` + `baselineValue`
2. إضافة حقل `framework` في StrategicObjective: `BSC` | `OKR` | `BOTH`
3. API endpoints:
   - `GET /api/okrs/:versionId` → عرض شجرة OKRs
   - `POST /api/okrs` → إنشاء Objective + Key Results
   - `PATCH /api/okrs/:id/progress` → تحديث التقدم
4. حساب تقدم الـ Objective تلقائياً من Key Results

### 11.2 واجهة OKRs (2 ساعة)
**المهام:**
1. صفحة `okrs.html` — عرض شجري (Objective → Key Results)
2. شريط تقدم لكل Key Result (0-100%)
3. تقدم الـ Objective = متوسط Key Results
4. فلترة بالربع (Q1, Q2, Q3, Q4)
5. ربط اختياري: Key Result ↔ KPI موجود

**✅ نقطة الفحص:**
- [x] إنشاء Objective + 3 Key Results
- [x] تحديث تقدم KR → يتحدث تقدم Objective تلقائياً
- [x] العرض الشجري يعمل
- [x] صفحة `okrs.html` + `routes/okrs.js` مكتملة

---

## المرحلة 12: تحليل الفجوات (Gap Analysis) ⏱ ~3 ساعات ✅ مكتمل

**الهدف:** أداة تحدد الفجوة بين "وين أنت" و"وين تبي توصل" — وتقترح كيف تسدها

### 12.1 Schema + API (1.5 ساعة)
**المهام:**
1. استخدام CompanyAnalysis (toolCode = GAP_ANALYSIS)
2. هيكل بيانات JSON:
   ```json
   {
     "dimensions": [
       {
         "name": "الموارد البشرية",
         "currentState": 3,
         "targetState": 5,
         "gap": 2,
         "actions": ["توظيف 5 مختصين", "برنامج تدريب"]
       }
     ]
   }
   ```
3. API: حساب الفجوة تلقائياً + اقتراح إجراءات من SWOT weaknesses

### 12.2 واجهة Gap Analysis (1.5 ساعة)
**المهام:**
1. صفحة ضمن tool-detail أو مستقلة
2. لكل بُعد: slider (الحالي 1-5) + slider (المستهدف 1-5)
3. رسم بياني: الحالي vs المستهدف (radar أو bar)
4. الفجوات مرتبة من الأكبر للأصغر
5. اقتراح إجراءات من نقاط الضعف في SWOT

**✅ نقطة الفحص:**
- [x] إدخال 5 أبعاد → حساب الفجوات → ترتيب
- [x] Radar chart + Bar chart يعرض الفرق
- [x] الاقتراحات تسحب من SWOT weaknesses
- [x] صفحة `gap-analysis.html` مكتملة

---

## المرحلة 13: Three Horizons + OGSM ⏱ ~4 ساعات

**الهدف:** أداتين بسيطتين تكملان منظومة التخطيط

### 13.1 Three Horizons (2 ساعة)
**أفق التخطيط الثلاثي — متى تحصد كل مبادرة؟**

**المهام:**
1. استخدام CompanyAnalysis (toolCode = THREE_HORIZONS)
2. هيكل بيانات:
   ```json
   {
     "H1_maintain": [{"title": "...", "revenue": "%", "timeframe": "0-12 شهر"}],
     "H2_grow": [{"title": "...", "investment": "...", "timeframe": "12-36 شهر"}],
     "H3_create": [{"title": "...", "vision": "...", "timeframe": "36+ شهر"}]
   }
   ```
3. واجهة: 3 أعمدة (حافظ | نمّي | ابتكر)
4. سحب المبادرات الموجودة وتوزيعها على الآفاق
5. رسم بياني: منحنى S لكل أفق

### 13.2 OGSM — صفحة واحدة تجمع الكل (2 ساعة)
**Objectives, Goals, Strategies, Measures — ملخص على صفحة واحدة**

**المهام:**
1. استخدام CompanyAnalysis (toolCode = OGSM)
2. OGSM يسحب تلقائياً:
   - **O** (Objectives) ← من StrategicObjective
   - **G** (Goals) ← من KPI targets
   - **S** (Strategies) ← من TOWS strategies المُعتمدة
   - **M** (Measures) ← من KPI actuals
3. واجهة: جدول أنيق صفحة واحدة
4. زر "حمّل كـ PDF" (يُفعّل في المرحلة 17)
5. إمكانية التعديل اليدوي + الحفظ

**✅ نقطة الفحص:**
- [x] Three Horizons: 3 آفاق مع مبادرات موزعة ✅
- [x] OGSM: يسحب O/G/S/M تلقائياً من البيانات الموجودة ✅
- [x] كلاهما يسجّل في CompanyAnalysis ✅

**⏸️ توقف ← نتائج ← اعتماد ← نكمل**

---

## المرحلة 14: ربط الأدوات + المستشار الذكي ⏱ ~8 ساعات

**الهدف:** كل أداة تتكلم مع اللي قبلها واللي بعدها + محرك اقتراحات ذكي حسب القطاع

### 14.1 جدول التبعيات (1 ساعة)
إضافة `dependsOn` في ToolDefinition:
```
TOWS ← SWOT | SCENARIO ← PESTEL | BLUE_OCEAN ← PORTER
ANSOFF ← TOWS | BSC ← TOWS + ANSOFF | HOSHIN ← BSC
GAP_ANALYSIS ← SWOT | PRIORITY_MATRIX ← TOWS + ANSOFF
THREE_HORIZONS ← BSC | OGSM ← BSC + TOWS
```

### 14.2 زر "استورد من" (2 ساعة)
- فتح أداة → يتحقق `dependsOn`
- الأداة مكتملة → زر "📥 استورد"
- ما مكتملة → تنبيه "أكمل [الأداة] أولاً"
- منطق الاستيراد لكل تقاطع (SWOT→TOWS, PESTEL→Scenario...)

### 14.3 المستشار الذكي — محرك الاقتراحات (3 ساعات) 🆕
**"✨ اقترح لي" — اقتراحات ذكية حسب قطاع الشركة**

**المهام:**
1. إنشاء `public/js/suggestions-engine.js`:
   - قاعدة بيانات اقتراحات JSON لكل قطاع (صحة، تعليم، تقنية، تجزئة، حكومة، صناعة، طاقة...)
   - `getSuggestions(sectorCode, toolType)` → اقتراحات SWOT/PESTEL/Porter/VRIO حسب القطاع
   - اقتراحات عامة (GENERAL) كـ fallback
2. إضافة زر "✨ اقترح لي" في كل أداة تحليل:
   - `analysis.html` (SWOT) — اقتراحات لكل ربع (قوة/ضعف/فرص/تهديدات)
   - `strategic-tools.html` (VRIO/Blue Ocean) — اقتراحات موارد وأبعاد
   - `gap-analysis.html` — اقتراحات أبعاد للتقييم
3. الاقتراحات تظهر كـ chips قابلة للنقر (لا تُفرض على المستخدم)
4. قراءة قطاع الكيان المختار تلقائياً من API
5. حساب التقدم التلقائي: `filledSections / totalSections * 100`

### 14.4 المسار الذكي (2 ساعة)
- اقتراحات: "✅ أكملت SWOT → جرب TOWS الآن"
- Dashboard يعرض المسار المقترح
- شريط تقدم ذكي في tools.html
- إشعارات: "عندك أداتين جاهزتين للبدء"
- تذكيرات إدخال KPI الدورية

**✅ نقطة الفحص:**
- [ ] فتح TOWS → "استورد من SWOT" → البيانات تتعبى
- [ ] زر "✨ اقترح لي" يعرض اقتراحات حسب قطاع الشركة
- [ ] إكمال أداة → اقتراح الأداة التالية
- [ ] وقت الإدخال أقل بـ 60%

**⏸️ توقف ← نتائج ← اعتماد ← نكمل**

---

## المرحلة 15: بوصلة الأولويات (Priority Matrix) ⏱ ~4 ساعات

**الهدف:** أداة قرار تحدد "أي هدف أولاً" بـ 4 معايير مبسطة

### 15.1 منطق التقييم (1 ساعة)
- toolCode = PRIORITY_MATRIX, category = CHOICE
- 4 معايير: الأثر | الربح | السرعة | الاستمرارية (★ 1-5)
- خوارزمية: (مجموع × أوزان ÷ أقصى) × 100
- ترتيب تلقائي

### 15.2 واجهة البوصلة (2 ساعة)
- سحب الأهداف من StrategicObjective تلقائياً
- تقييم نجوم لكل معيار
- رسم بياني مقارن + توصية
- تعديل الأوزان (اختياري)

### 15.3 الربط (1 ساعة)
- تحديث `weight` + `priority` في StrategicObjective تلقائياً
- ربط: TOWS → بوصلة → BSC

**✅ نقطة الفحص:**
- [ ] تقييم 4 معايير → ترتيب صحيح → توصية
- [ ] النتيجة تُحدّث priority في الأهداف

**⏸️ توقف ← نتائج ← اعتماد ← نكمل**

---

## المرحلة 16: نظام المهام + التقسيم الإداري (Cases) ⏱ ~8 ساعات

**الهدف:** نظام إدارة مهام يربط الاستراتيجي بالتشغيلي — مع تقسيم حسب الإدارات

### 16.1 Schema + API (3 ساعات)
**المهام:**
1. إضافة model `Case`:
   ```
   Case {
     id, entityId, title, description,
     type: TASK | ISSUE | ACTION_ITEM,
     status: OPEN | IN_PROGRESS | RESOLVED | CLOSED,
     priority: CRITICAL | HIGH | MEDIUM | LOW,
     assigneeId, reporterId,
     departmentId,           ← 🆕 ربط بالإدارة
     initiativeId,           ← 🆕 ربط بالمبادرة
     dueDate, completedAt,
     sourceType: ALERT | CORRECTION | REVIEW | INITIATIVE | MANUAL,
     sourceId,
     tags, notes
   }
   ```
2. إضافة model `Department` (اختياري — أو استخدام tags):
   ```
   Department {
     id, entityId, name, managerId, parentId
   }
   ```
3. إنشاء `routes/cases.js`:
   - `GET /api/cases` → قائمة (فلترة بالحالة/الأولوية/المسؤول/الإدارة)
   - `POST /api/cases` → إنشاء
   - `GET /api/cases/:id` → تفاصيل
   - `PATCH /api/cases/:id` → تحديث
   - `DELETE /api/cases/:id` → حذف
   - `GET /api/cases/stats` → إحصائيات (مفتوح/مغلق/متأخر)
   - `GET /api/cases/by-department/:deptId` → مهام الإدارة
4. Migration + تسجيل Route

### 16.2 واجهة المهام (3 ساعات)
**المهام:**
1. `cases.html`:
   - قائمة المهام مع فلترة وبحث
   - بطاقة لكل مهمة (العنوان + الحالة + المسؤول + الموعد + الإدارة)
   - Modal إنشاء/تعديل
   - Kanban view: أعمدة حسب الحالة
   - عرض حسب الإدارة: كل إدارة تشوف مهامها
2. Dashboard widget: "عندك 5 مهام مفتوحة"

### 16.3 الربط التلقائي (2 ساعة)
**المهام:**
1. تنبيه → مهمة: لما ينشأ alert → يتحول لمهمة تلقائياً
2. تصحيح → مهمة: CorrectionAction يولّد Case
3. مراجعة → مهام: توصيات المراجعة تتحول لمهام
4. مبادرة → مهام: تقسيم المبادرة لمهام تنفيذية على الإدارات

**✅ نقطة الفحص:**
- [ ] CRUD مهام كامل
- [ ] فلترة بالحالة/المسؤول/الأولوية/الإدارة
- [ ] تنبيه → مهمة تلقائياً
- [ ] مبادرة → مهام على الإدارات
- [ ] إحصائيات المهام في Dashboard

**⏸️ توقف ← نتائج ← اعتماد ← نكمل**

---

## المرحلة 17: تقارير PDF + تصدير ⏱ ~5 ساعات

**الهدف:** تصدير البيانات والتحليلات كملفات PDF احترافية

### 17.1 بنية التصدير (1.5 ساعة)
**المهام:**
1. تركيب مكتبة `puppeteer` أو `pdfkit`
2. إنشاء `routes/reports.js`:
   - `GET /api/reports/strategic-plan/:versionId` → الخطة الاستراتيجية
   - `GET /api/reports/health/:entityId` → تقرير الصحة
   - `GET /api/reports/analysis/:assessmentId` → تقرير SWOT/TOWS
   - `GET /api/reports/ogsm/:versionId` → ملخص OGSM
   - `GET /api/reports/board-pack/:entityId` → ملخص تنفيذي للمجلس
3. تسجيل Route في server.js

### 17.2 قوالب التقارير (2.5 ساعة)
**المهام:**
1. **تقرير الخطة الاستراتيجية** (Strategic Plan):
   - غلاف + فهرس + رؤية/رسالة/قيم
   - SWOT + TOWS + الأهداف + KPIs + المبادرات
2. **تقرير الصحة** (Health Report):
   - Health Score + Breakdown + التنبيهات + التوصيات
3. **تقرير التحليل** (Analysis Report):
   - SWOT + TOWS Matrix + نقاط القوة/الضعف
4. **ملخص OGSM** (صفحة واحدة):
   - O + G + S + M في جدول مُنسّق
5. **Board Pack** (ملخص تنفيذي):
   - 3-5 صفحات للمجلس: الوضع العام + القرارات المطلوبة

### 17.3 واجهة التصدير (1 ساعة)
**المهام:**
1. زر "📄 تصدير PDF" في كل صفحة ذات صلة
2. اختيار نوع التقرير
3. شاشة تحميل → تنزيل الملف
4. تفعيل زر "حمّل كـ PDF" في صفحة OGSM

**✅ نقطة الفحص:**
- [ ] تقرير الخطة → PDF منسّق مع غلاف
- [ ] تقرير الصحة → Health Score + توصيات
- [ ] OGSM → صفحة واحدة مُنسّقة
- [ ] Board Pack → 3-5 صفحات ملخص تنفيذي

**⏸️ توقف ← نتائج ← اعتماد ← نكمل**

---

## المرحلة 18: الإدارة التشغيلية والتكتيكية ⏱ ~10 ساعات 🆕

**الهدف:** سد الفجوة بين الاستراتيجي والتنفيذ اليومي — تحويل الأهداف لخطط عمل على مستوى الإدارات

```
الاستراتيجي (عندنا ✅)  →  التكتيكي (🆕)  →  التشغيلي (🆕)
رؤية + SWOT + BSC        خطة سنوية         مهام يومية
أهداف استراتيجية          برامج الإدارات     متابعة أسبوعية
KPIs عالية المستوى        ميزانيات           اجتماعات + محاضر
```

### 18.1 الخطة التشغيلية السنوية (Annual Plan) (3 ساعات)
**المهام:**
1. إضافة model `AnnualPlan`:
   ```
   AnnualPlan {
     id, entityId, versionId, year,
     title, description,
     status: DRAFT | ACTIVE | COMPLETED,
     createdBy, approvedBy, approvedAt
   }
   ```
2. إضافة model `PlanItem`:
   ```
   PlanItem {
     id, annualPlanId,
     title, description,
     quarter: Q1 | Q2 | Q3 | Q4 | ALL,
     departmentId,
     objectiveId,          ← ربط بالهدف الاستراتيجي
     initiativeId,         ← ربط بالمبادرة
     priority: HIGH | MEDIUM | LOW,
     budget, actualCost,
     status: NOT_STARTED | IN_PROGRESS | COMPLETED | DELAYED,
     progress, dueDate, completedAt,
     assigneeId
   }
   ```
3. إنشاء `routes/annual-plans.js`:
   - CRUD للخطط السنوية
   - `GET /api/annual-plans/:id/items` → بنود الخطة
   - `POST /api/annual-plans/:id/generate` → توليد تلقائي من المبادرات والأهداف
4. صفحة `annual-plan.html`:
   - عرض الخطة حسب الأرباع (Q1-Q4)
   - عرض حسب الإدارة
   - شريط تقدم لكل بند
   - ربط مباشر بالأهداف والمبادرات

### 18.2 عرض الإدارات (Department View) (2.5 ساعة)
**المهام:**
1. صفحة `departments.html`:
   - قائمة الإدارات مع المدير المسؤول
   - لكل إدارة: أهدافها + KPIs + مهامها + ميزانيتها
   - "لوحة قيادة الإدارة" — mini-dashboard لكل إدارة
2. فلترة البيانات الموجودة حسب الإدارة:
   - KPIs → حسب الإدارة المسؤولة
   - المبادرات → حسب الإدارة المنفذة
   - المهام (Cases) → حسب الإدارة المكلفة
3. تقرير أداء الإدارة: نقطة قوة + نقطة تحسين

### 18.3 إدارة الاجتماعات والمحاضر (2.5 ساعة)
**المهام:**
1. إضافة model `Meeting`:
   ```
   Meeting {
     id, entityId, title,
     type: STRATEGIC_REVIEW | DEPARTMENTAL | WEEKLY_STANDUP | BOARD,
     date, duration,
     attendees,             ← JSON array
     agenda,                ← JSON array
     minutes,               ← نص المحضر
     decisions,             ← JSON array
     actionItems,           ← تتحول لـ Cases تلقائياً
     linkedReviewId,        ← ربط بالمراجعة الدورية
     status: SCHEDULED | COMPLETED | CANCELLED
   }
   ```
2. إنشاء `routes/meetings.js`:
   - CRUD اجتماعات
   - `POST /api/meetings/:id/generate-cases` → تحويل قرارات لمهام
3. صفحة `meetings.html`:
   - تقويم الاجتماعات
   - قالب جاهز لكل نوع اجتماع
   - محضر مع قرارات قابلة للتحويل لمهام
   - ربط مع المراجعات الدورية

### 18.4 لوحة القيادة التشغيلية (2 ساعات)
**المهام:**
1. `operational-dashboard.html` — مختلف عن Dashboard الاستراتيجي:
   - **هذا الأسبوع:** المهام المتأخرة + المهام القادمة
   - **هذا الشهر:** تقدم بنود الخطة السنوية
   - **هذا الربع:** KPIs بحاجة إدخال + المبادرات المتأخرة
   - **ملخص الإدارات:** أداء كل إدارة (شريط مقارن)
   - **الاجتماعات القادمة:** أقرب 3 اجتماعات
   - **منبّهات تشغيلية:** مهام متأخرة، KPIs بدون إدخال، اجتماعات قادمة

**✅ نقطة الفحص:**
- [ ] خطة سنوية تُولّد من المبادرات والأهداف
- [ ] عرض حسب الإدارات يعمل
- [ ] اجتماع → محضر → قرارات → مهام تلقائياً
- [ ] لوحة قيادة تشغيلية تعرض الوضع اليومي/الأسبوعي
- [ ] الربط بين الاستراتيجي والتشغيلي واضح

**⏸️ توقف ← نتائج ← اعتماد ← نكمل**

---

## 📊 ملخص المراحل الكامل

### 🟢 الموجة 1: الأساس (مكتمل ✅)
| # | المرحلة | الوقت | الحالة | المُخرج |
|:-:|---------|:-----:|:------:|---------|
| 0 | نسخ احتياطي | 5 د | ✅ | ملفات محفوظة |
| 1 | تحديث Schema | 30 د | ✅ | قاعدة بيانات محدّثة |
| 2 | APIs جديدة | 2 س | ✅ | 15+ endpoint |
| 3 | تعديل APIs | 2 س | ✅ | حقول جديدة تعمل |
| 4 | صفحات جديدة | 3 س | ✅ | CRUD كامل |
| 5 | تعديل صفحات | 2 س | ✅ | كل شي متناسق |
| 6 | ذكاء وأتمتة | 2 س | ✅ | تنبيهات + Health Score |
| | **إجمالي الموجة 1** | **~12 س** | ✅ | **المنصة تعمل** |

### 🟢 الموجة 2: الجهاز العصبي + التشغيل (مكتمل ✅)
| # | المرحلة | الوقت | الحالة | المُخرج |
|:-:|---------|:-----:|:------:|---------|
| 7 | الجهاز العصبي | 5 س | ✅ | حلقة مغلقة + Root Cause |
| 8 | الصلاحيات | 4 س | ✅ | Sidebar محمي + DATA_ENTRY |
| 9 | رفع ملفات | 6 س | ✅ | Excel/Word → بيانات |
| | **إجمالي الموجة 2** | **~15 س** | ✅ | **المنصة تحمي وتستورد** |

### 🔵 الموجة 3: الأدوات + الذكاء
| # | المرحلة | الوقت | الحالة | المُخرج |
|:-:|---------|:-----:|:------:|---------|
| 10 | واجهات الأدوات | 8 س | ✅ | VRIO + Blue Ocean + Hoshin + Scenario |
| 11 | OKRs | 4 س | ✅ | شجرة Objectives + Key Results |
| 12 | Gap Analysis | 3 س | ✅ | الحالي vs المستهدف + إجراءات |
| 13 | Three Horizons + OGSM | 4 س | 🔴 | 3 آفاق + صفحة ملخص واحدة |
| 14 | ربط الأدوات + المستشار الذكي | 8 س | 🔴 | "استورد من" + ✨ اقترح لي + مسار ذكي |
| 15 | بوصلة الأولويات | 4 س | 🔴 | تقييم + ترتيب الأهداف |
| | **إجمالي الموجة 3** | **~31 س** | 🟡 جزئي | **المنصة تفكر وتقرر** |

### 🟡 الموجة 4: التشغيل + الإنتاج
| # | المرحلة | الوقت | الحالة | المُخرج |
|:-:|---------|:-----:|:------:|---------|
| 16 | نظام المهام + التقسيم الإداري | 8 س | 🔴 | مهام + إدارات + ربط تلقائي |
| 17 | تقارير PDF | 5 س | 🔴 | 5 أنواع تقارير PDF |
| | **إجمالي الموجة 4** | **~13 س** | 🔴 | **المنصة تُدير وتطبع** |

### 🟣 الموجة 5: الإدارة التشغيلية والتكتيكية 🆕
| # | المرحلة | الوقت | الحالة | المُخرج |
|:-:|---------|:-----:|:------:|---------|
| 18 | الخطة التشغيلية + الإدارات + الاجتماعات | 10 س | 🔴 | خطة سنوية + إدارات + اجتماعات + Dashboard تشغيلي |
| | **إجمالي الموجة 5** | **~10 س** | 🔴 | **المنصة تشتغل يومياً** |

### 📈 الإجمالي
| الموجة | الساعات | الحالة |
|:------:|:-------:|:------:|
| 🟢 الأساس | ~12 س | ✅ مكتمل |
| 🟢 الجهاز العصبي + التشغيل | ~15 س | ✅ مكتمل |
| 🔵 الأدوات + الذكاء | ~31 س | 🟡 جزئي (10-12 ✅) |
| 🟡 التشغيل + الإنتاج | ~13 س | 🔴 |
| 🟣 الإدارة التشغيلية | ~10 س | 🔴 |
| **الإجمالي** | **~81 ساعة** | |

---

## 🗺️ خارطة الطريق

```
الموجة 1 ✅        الموجة 2 ✅       الموجة 3 🔵         الموجة 4 🟡         الموجة 5 🟣
━━━━━━━━━━        ━━━━━━━━━━       ━━━━━━━━━━         ━━━━━━━━━━         ━━━━━━━━━━

Schema → APIs     الجهاز العصبي    VRIO ✅             Cases + إدارات     خطة سنوية
→ Pages → AI      → الصلاحيات      Blue Ocean ✅       → PDF Reports      → إدارات
                  → رفع ملفات      OKRs ✅                                → اجتماعات
                                   Gap Analysis ✅                        → Dashboard
                                   Three Horizons                           تشغيلي
                                   OGSM
                                   المستشار الذكي ✨
                                   بوصلة الأولويات

المنصة تعمل ✅    المنصة تحمي ✅    المنصة تفكر        المنصة تُدير        المنصة تشتغل
                                                                          يومياً 🏢
```

---

## 🔗 السلسلة الكاملة: من الرؤية إلى المهمة اليومية

```
رؤية (Vision) ← التوجه الاستراتيجي ✅
  └── تحليل (SWOT/PESTEL/Porter/VRIO) ✅
        └── خيارات (TOWS/Choices) ✅
              └── هدف استراتيجي (BSC Objective) ✅
                    └── KPI (مؤشر أداء) ✅
                    └── مبادرة (Initiative) ✅
                          └── 🆕 بند خطة سنوية (Annual Plan Item)
                                └── 🆕 مهمة إدارية (Department Case)
                                      └── 🆕 محضر اجتماع (Meeting Minutes)
                                            └── 🆕 قرار → مهمة تنفيذية (Action Item)
```

---

## 🗓️ الجدول الزمني المتوقع (بدوام 6 ساعات/يوم)

| الموجة | الأيام | من | إلى | الحالة |
|:------:|:------:|:--:|:---:|:------:|
| 🟢 الأساس | — | — | — | ✅ مكتمل |
| 🟢 الموجة 2 | — | — | — | ✅ مكتمل |
| 🔵 الموجة 3 | ~5 أيام | المرحلة 10 ✅ | المرحلة 15 | 🟡 جزئي |
| 🟡 الموجة 4 | ~2 أيام | المرحلة 16 | المرحلة 17 | 🔴 |
| 🟣 الموجة 5 | ~2 أيام | المرحلة 18 | المرحلة 18 | 🔴 |
| **الإجمالي** | **~9 أيام متبقية** | | | |

---

## ⚡ قواعد مهمة

1. **لا نحذف أي شي شغّال** — نضيف فقط
2. **كل migration تكون additive** — حقول optional بـ default values
3. **الـ Seed data يتحدّث** مع كل مرحلة
4. **لو مرحلة فشلت** — نرجع للنسخة الاحتياطية
5. **الصلاحيات لا تكسر الموجود** — نفعّل الفلترة تدريجياً
6. **الملفات المرفوعة تُحذف بعد المعالجة**
7. **الأدوات تُبنى قبل ما تُربط** (المرحلة 10 قبل 14)
8. **CompanyAnalysis هي الطبقة الموحدة** — كل أداة جديدة تسجّل فيها
9. **OGSM يسحب البيانات تلقائياً** — ما يدخلها المستخدم يدوياً
10. **الخطة التشغيلية تتولّد من الاستراتيجية** — ما تبدأ من الصفر 🆕
11. **كل قرار اجتماع يتحول لمهمة قابلة للمتابعة** 🆕

