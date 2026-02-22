# 📋 خطة التنفيذ — 4 أسابيع
> **تاريخ:** 2026-02-18
> **القاعدة:** لا تبني ما لا تحتاجه الآن — قوّي ما تملكه
> **الحالة:** 🚀 قيد التنفيذ — اعتمد في 2026-02-18

---

## 📊 نقطة الانطلاق (الوضع الحالي)

```
المنهجيات الكاملة (6):  #1, #2, #3, #5, #6, #7
المنهجيات الجزئية (4):  #4, #12, #14, #15
المنهجيات المفقودة (5): #8, #9, #10, #11, #13  ← لن نبنيها الآن

Backend Routes: 33 ملف (API تغطية ~80%)
Frontend Pages: 37 صفحة
Schema Models:  30+ موديل (953 سطر)
Tests:          1 ملف فقط ❌
```

---

# 🗓️ الأسبوع 1: تقوية المنهجيات الـ 6 الكاملة → 100%

## الهدف: ضمان أن كل منهجية كاملة تعمل بلا أخطاء ومتكاملة

---

### المرحلة 1.1: منهجية #1 — إدارة التقييمات (Closed Loop) ✅ مكتمل
**الحالة الحالية:** ✅ CRUD كامل + Dimensions + Criteria
**الملفات:** `routes/assessments.js` (812 سطر ← كان 397) + `public/assessments.html` (50KB)
**الاختبارات:** `tests/assessment-tests.js` — **59/59 اختبار نجحوا ✅**

| # | المهمة | النوع | الحالة | التفاصيل |
|---|--------|-------|--------|----------|
| 1.1.1 | إصلاح validation | Backend | ✅ مكتمل | status whitelist، title min length، score range 0-5، entityId existence check |
| 1.1.2 | حساب نسبة التقييم تلقائياً | Backend | ✅ مكتمل | `calculateAssessmentScore()` → criteria → dimension → overall مع grades A-F |
| 1.1.3 | Gap Analysis endpoint | Backend | ✅ مكتمل | `GET /api/assessments/:id/gaps?target=80` — كشف الفجوات مع severity + recommendations |
| 1.1.4 | Assessment Score endpoint | Backend | ✅ مكتمل | `GET /api/assessments/:id/score` — نتائج التقييم فقط |
| 1.1.5 | Assessment Summary endpoint | Backend | ✅ مكتمل | `GET /api/assessments/:id/summary` — ملخص مع SWOT counts |
| 1.1.6 | Delete Protection | Backend | ✅ مكتمل | لا يمكن حذف تقييم مكتمل بدون `?force=true` |
| 1.1.7 | اختبار End-to-End | Test | ✅ مكتمل | 59 اختبار: CRUD + validation + scoring + gaps + delete protection |

**المخرج:** تقييم يُنشأ → يُقيَّم (0-5) → يحسب الدرجة تلقائياً (A-F) → يكشف الفجوات → حماية الحذف ✅

**Endpoints الجديدة:**
- `GET /api/assessments/:id/score`
- `GET /api/assessments/:id/gaps?target=80`
- `GET /api/assessments/:id/summary`

---

### المرحلة 1.2: منهجية #2 — ربط القطاعات (ISIC) ✅ مكتمل
**الحالة الحالية:** ✅ CRUD كامل + Companies + Industries + Entities
**الملفات:** `routes/sectors.js` (560 سطر ← كان 172) + `routes/industries.js` + `routes/entities.js`
**الاختبارات:** `tests/sector-tests.js` — **55/55 اختبار نجحوا ✅**

| # | المهمة | النوع | الحالة | التفاصيل |
|---|--------|-------|--------|----------|
| 1.2.1 | Hierarchy Validation | Backend | ✅ مكتمل | `GET /api/sectors/hierarchy` — شجرة كاملة + integrity checks (orphan entities, empty sectors, no strategy) |
| 1.2.2 | إحصائيات القطاع | Backend | ✅ مكتمل | `GET /api/sectors/:id/stats` — عدد الكيانات + تغطية + KPI performance + health score (A-F) |
| 1.2.3 | اختبار التسلسل | Test | ✅ مكتمل | 55 اختبار: CRUD + hierarchy + stats + delete protection |

**المخرج:** تسلسل هرمي مرئي: company → sector → entity + integrity checks + health per entity ✅

**Endpoints الجديدة:**
- `GET /api/sectors/hierarchy` — كشف المشاكل: orphans, empty sectors, no strategy
- `GET /api/sectors/:id/stats` — إحصائيات شاملة: KPIs, initiatives, health score

---

### المرحلة 1.3: منهجية #3 — مصفوفة الأولويات (MCDA) ✅ مكتمل
**الحالة الحالية:** ✅ MCDA كامل مع Calculation Engine + Report + Batch + Sensitivity
**الملفات:** `routes/priority-matrix.js` (580 سطر ← كان 317) + `public/priority-matrix.html`
**الاختبارات:** `tests/priority-matrix-tests.js` — **99/99 اختبار نجحوا ✅**

| # | المهمة | النوع | الحالة | التفاصيل |
|---|--------|-------|--------|----------|
| 1.3.1 | Calculation Engine | Backend | ✅ مكتمل | `calculateWeightedScore()` مع grades A-F + `validateWeights()` + `classifyPriority()` |
| 1.3.2 | تقرير الأولوية | Backend | ✅ مكتمل | `GET /api/priority-matrix/report` — summary + distribution + budget + category analysis + recommendations |
| 1.3.3 | Batch Evaluate | Backend | ✅ مكتمل | `POST /api/priority-matrix/evaluate-batch` — تقييم جماعي مع error handling |
| 1.3.4 | Validate Endpoint | Backend | ✅ مكتمل | `GET /api/priority-matrix/validate` — تحقق من سلامة الحساب (perfect=100, zero=0) |
| 1.3.5 | اختبار شامل | Test | ✅ مكتمل | 99 اختبار: criteria + validation + evaluate + ordering + report + sensitivity + batch |

**المخرج:** مبادرات مرتبة حسب الأولوية مع تقرير واضح + dominance analysis + sensitivity ✅

**Endpoints الجديدة:**
- `GET /api/priority-matrix/report?versionId=x` — تقرير شامل
- `GET /api/priority-matrix/validate` — تحقق من المعادلة
- `POST /api/priority-matrix/evaluate-batch` — تقييم جماعي

---

### المرحلة 1.4: منهجية #5 — إدارة المخاطر
**الحالة الحالية:** ✅ Risks CRUD + ربط بـ Choices + تقييم (probability × impact)
**الملفات:** `routes/choices.js` (340 سطر — choices + risks معاً)

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 1.4.1 | Risk Score Calculation | Backend | التأكد: probabilityScore × impactScore = riskScore مع تصنيف (LOW/MED/HIGH/CRITICAL) | 30 دق |
| 1.4.2 | Risk Heat Map Data | Backend | endpoint: `GET /api/choices/risks/heatmap?versionId=x` — بيانات لعرض heat map | 1 ساعة |
| 1.4.3 | Mitigation Tracking | Backend | التأكد: كل risk عنده mitigation plan + contingency + owner | 30 دق |
| 1.4.4 | ربط بـ Alert Engine | Backend | التأكد: alert-engine يكشف high risks وينبه تلقائياً (موجود → تحقق فقط) | 30 دق |

**المخرج:** سجل مخاطر كامل مع heat map + تنبيهات تلقائية ✅

---

### المرحلة 1.5: منهجية #6 — التشخيص التنظيمي (SWOT+PESTEL+Porter)
**الحالة الحالية:** ✅ SWOT (analysis.js) + PESTEL + Porter (external-analysis.js) + TOWS (tows.js) + Company Analysis (company-analysis.js)

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 1.5.1 | تحقق من SWOT Codes | Backend | التأكد: auto-coding (S1, W1, O1, T1) يعمل صح + backfill | 30 دق |
| 1.5.2 | PESTEL ↔ SWOT ربط | Backend | التأكد: عوامل PESTEL مربوطة بـ Opportunities/Threats في SWOT | 45 دق |
| 1.5.3 | Company Analysis Pipeline | Backend | التأكد: 13 أداة تحليل → كل واحدة بحالتها ونسبة إنجازها | 30 دق |
| 1.5.4 | اختبار التكامل | Test | SWOT → TOWS crossing → strategies → objectives | 45 دق |

**المخرج:** تشخيص متكامل: SWOT + PESTEL + Porter → TOWS → أهداف ✅

---

### المرحلة 1.6: منهجية #7 — من الألم للوضوح (Root Cause)
**الحالة الحالية:** ✅ Tool Definitions + Phases (4 مراحل) + Company Analysis
**الملفات:** `routes/tools.js` (161 سطر) + `routes/company-analysis.js` (388 سطر)

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 1.6.1 | تحقق من Seed | Backend | التأكد: 13 أداة مزروعة بشكل صحيح (SWOT, PESTEL, Porter, BCG, etc.) | 15 دق |
| 1.6.2 | Progress Calculation | Backend | التأكد: `calculateProgress()` يحسب نسبة التقدم لكل أداة صح | 30 دق |
| 1.6.3 | Pipeline View | Frontend | التأكد: 4 مراحل (تشخيص → اختيار → تنفيذ → تكيف) تعرض صح | 30 دق |

**المخرج:** خط أنابيب الأدوات الـ 13 يعمل ويعرض التقدم ✅

---

### المرحلة 1.7: تحسين Alert Engine
**الحالة الحالية:** ✅ شامل (794 سطر) — 5 أنواع فحص + health score + closed loop

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 1.7.1 | مراجعة شاملة | Backend | مراجعة الـ 5 أنواع: KPI warnings, initiative delays, review overdue, risk high, health low | 1 ساعة |
| 1.7.2 | Performance Drop Detection | Backend | التأكد: مقارنة KPI entries الأخيرة مع السابقة لكشف الانخفاض | 45 دق |
| 1.7.3 | Health Score Formula | Backend | تحقق: وزن التقييم = Alignment(30%) + Completeness(20%) + Performance(40%) + Freshness(10%) | 30 دق |
| 1.7.4 | اختبار Alert Engine | Test | اختبار: scan → generate alerts → dismiss → re-scan | 45 دق |

**المخرج:** محرك تنبيهات موثوق ومختبر ✅

---

### المرحلة 1.8: Tests أساسية
| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 1.8.1 | Setup Jest/Vitest | Config | تثبيت + إعداد ملف الاختبار الأساسي | 30 دق |
| 1.8.2 | API Tests | Test | اختبار CRUD لأهم 5 routes (assessments, sectors, strategic, choices, analysis) | 2 ساعة |
| 1.8.3 | Inspector Test | Test | اختبار: scan API → النتائج → golden thread | 45 دق |

**المخرج:** 15-20 اختبار أساسي يمر بنجاح ✅

---

## 📊 ملخص الأسبوع 1

| البُعد | قبل | بعد |
|--------|------|------|
| المنهجيات الكاملة | 6 (أساسي) | 6 (متين ومختبر) |
| الاختبارات | 1 ملف | 20+ اختبار |
| Endpoints جديدة | 0 | ~5 endpoints إضافية |
| أخطاء محتملة | غير معروفة | مكتشفة ومصلحة |

**المدة التقديرية:** 3-4 أيام عمل

---

# 🗓️ الأسبوع 2: إكمال المنهجيات الـ 4 الجزئية

## الهدف: رفع المنهجيات الجزئية لمستوى مقبول (80%+)

---

### المرحلة 2.1: منهجية #4 — الخيط الذهبي (Golden Thread)
**الحالة الحالية:** ⚡ Causal Links (210 سطر) + Strategy Map (47KB frontend) + Auto-suggest BSC
**ما ينقص:** visualization أفضل + integrity checks

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 2.1.1 | Thread Integrity Check | Backend | endpoint جديد: `GET /api/causal-links/integrity?versionId=x` — يفحص: هل كل هدف مربوط بـ KPI؟ هل كل KPI مربوط بمبادرة؟ | 2 ساعة |
| 2.1.2 | Orphan Detection | Backend | كشف العناصر اليتيمة: أهداف بدون KPIs، KPIs بدون أهداف، مبادرات بدون KPIs | 1 ساعة |
| 2.1.3 | Thread Score | Backend | حساب نسبة اكتمال الخيط الذهبي: (مربوط / إجمالي) × 100 | 45 دق |
| 2.1.4 | تحسين Strategy Map | Frontend | تحسين عرض الخريطة السببية: BSC perspectives + ألوان حسب الحالة | 2 ساعة |
| 2.1.5 | ربط بـ Inspector | Backend | التأكد: Inspector methodology #4 يقرأ البيانات الصحيحة | 30 دق |

**المخرج:** خيط ذهبي مرئي: رؤية → هدف → KPI → مبادرة → مراجعة ✅

---

### المرحلة 2.2: منهجية #12 — المواءمة والتنزيل (Cascading)
**الحالة الحالية:** ⚡ OKRs (304 سطر) + Objectives hierarchy + BSC perspectives
**ما ينقص:** الربط التلقائي بين OKRs والأهداف الاستراتيجية

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 2.2.1 | OKR ↔ Objective الربط | Backend | تعزيز: عند إنشاء OKR، اقتراح ربط تلقائي مع أقرب هدف استراتيجي (بالـ perspective) | 1.5 ساعة |
| 2.2.2 | Cascading View | Backend | endpoint: `GET /api/okrs/:versionId/cascade` — شجرة: Objective → KR → KPI → Initiative | 2 ساعة |
| 2.2.3 | Progress Rollup | Backend | حساب: تقدم OKR يتأثر بالـ KPIs المربوطة (actual/target) | 1 ساعة |
| 2.2.4 | Alignment Score | Backend | حساب: نسبة OKRs المربوطة بأهداف / الإجمالي | 45 دق |
| 2.2.5 | اختبار Cascading | Test | اختبار: إنشاء هدف → KR → ربط KPI → تحديث actual → تحقق من rollup | 1 ساعة |

**المخرج:** OKRs مربوطة بالأهداف + تقدم يتدفق تلقائياً ✅

---

### المرحلة 2.3: منهجية #14 — الموازنة المبنية على الأداء
**الحالة الحالية:** ⚡ Financial Decisions CRUD (173 سطر) — مستقل عن الاستراتيجية
**ما ينقص:** ربط القرارات المالية بالمبادرات + تتبع ROI

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 2.3.1 | Initiative Budget | Backend | إضافة: ربط financial decisions بـ initiatives (عبر schema أو reference) | 1.5 ساعة |
| 2.3.2 | Budget vs Actual | Backend | endpoint: `GET /api/financial/budget-tracking?entityId=x` — مقارنة الميزانية المخطط vs المنفذ | 1.5 ساعة |
| 2.3.3 | ROI Calculation | Backend | حساب: (performance improvement / budget spent) لكل مبادرة | 1 ساعة |
| 2.3.4 | Financial Dashboard Data | Backend | endpoint: `GET /api/financial/summary?entityId=x` — ملخص مالي: إجمالي، حسب النوع، حسب الحالة | 1 ساعة |
| 2.3.5 | ربط بـ Alert Engine | Backend | تنبيه: مبادرة تجاوزت 80% من ميزانيتها مع تقدم أقل من 50% | 45 دق |

**المخرج:** كل مبادرة بميزانية + تتبع الإنفاق + ROI ✅

---

### المرحلة 2.4: منهجية #15 — بناء المسار (Kanban + دورة 14 يوم)
**الحالة الحالية:** ⚡ Initiatives CRUD + Reviews مع Decision Engine (CONTINUE/ADJUST/PIVOT)
**ما ينقص:** Kanban board + sprint/cycle tracking

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 2.4.1 | Kanban Data Structure | Backend | endpoint: `GET /api/strategic/initiatives/kanban?versionId=x` — مبادرات مجمعة حسب status (PLANNED, IN_PROGRESS, COMPLETED) | 1 ساعة |
| 2.4.2 | Status Transitions | Backend | endpoint: `PATCH /api/strategic/initiatives/:id/move` — نقل مبادرة بين الأعمدة مع validation | 1 ساعة |
| 2.4.3 | Sprint/Cycle Tracking | Backend | إضافة: تتبع دورات 14 يوم — cycle start/end + مبادرات كل دورة | 2 ساعة |
| 2.4.4 | Review Cycle Integration | Backend | ربط: المراجعة الاستراتيجية ترتبط بالدورة الحالية | 1 ساعة |
| 2.4.5 | Kanban Board UI | Frontend | صفحة kanban بسيطة: 3 أعمدة + drag (اختياري، ممكن بدون drag) | 3 ساعات |
| 2.4.6 | اختبار Flow | Test | اختبار: إنشاء مبادرة → نقل → مراجعة → قرار | 45 دق |

**المخرج:** لوحة Kanban + دورات 14 يوم + مراجعات ربع سنوية ✅

---

### المرحلة 2.5: ربط كل شيء بالـ Alert Engine + Inspector

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 2.5.1 | Inspector Sync | Backend | التأكد: كل الـ 10 منهجيات تُقيَّم صح في Inspector | 1 ساعة |
| 2.5.2 | Alert Engine Expansion | Backend | إضافة تنبيهات: budget overrun, low alignment score, orphan detection | 1.5 ساعة |
| 2.5.3 | Dashboard Integration | Frontend | التأكد: Dashboard يعرض ملخص من كل المنهجيات العاملة | 1 ساعة |

---

## 📊 ملخص الأسبوع 2

| البُعد | قبل | بعد |
|--------|------|------|
| المنهجيات الكاملة | 6 | 10 |
| المنهجيات الجزئية | 4 | 0 |
| Endpoints جديدة | ~5 | +15 endpoint |
| التكامل | أجزاء منفصلة | نظام متصل |

**المدة التقديرية:** 4-5 أيام عمل

---

# 🗓️ الأسبوع 3: Claude API — PESTEL Auto-update

## الهدف: إضافة ذكاء اصطناعي واحد فقط — تحديث PESTEL تلقائياً

---

### المرحلة 3.1: إعداد Claude API

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 3.1.1 | تثبيت SDK | Config | `npm install @anthropic-ai/sdk` | 10 دق |
| 3.1.2 | إنشاء AI Service | Backend | `middleware/ai-service.js` — wrapper بسيط لـ Claude API مع retry + error handling | 1.5 ساعة |
| 3.1.3 | إعداد .env | Config | إضافة `ANTHROPIC_API_KEY=xxx` + `AI_ENABLED=true/false` | 10 دق |
| 3.1.4 | Rate Limiting | Backend | حد أقصى: 10 طلبات AI في الساعة لكل entity (لتقليل التكلفة) | 30 دق |

**الملفات الجديدة:**
```
middleware/ai-service.js    ← Claude API wrapper
```

---

### المرحلة 3.2: PESTEL Auto-update

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 3.2.1 | AI Route | Backend | `routes/ai.js` — API route جديد للذكاء الاصطناعي | 1 ساعة |
| 3.2.2 | PESTEL Analysis Prompt | Backend | بناء prompt ذكي: يأخذ sector + country + existing PESTEL → يقترح تحديثات | 2 ساعة |
| 3.2.3 | Response Parser | Backend | تحويل رد Claude لـ structured data: [{type, factor, impact, trend}] | 1.5 ساعة |
| 3.2.4 | Auto-save to DB | Backend | حفظ الاقتراحات في `ExternalAnalysis` كـ DRAFT (المستخدم يعتمدها) | 1 ساعة |
| 3.2.5 | Manual Trigger | Frontend | زر في صفحة PESTEL: "تحديث ذكي" → يستدعي Claude → يعرض الاقتراحات | 2 ساعة |

**API Endpoint:**
```
POST /api/ai/pestel-update
Body: { versionId, country?, sector? }
Response: { suggestions: [...], appliedCount: 0, status: "DRAFT" }
```

**Claude Prompt Structure:**
```
أنت محلل استراتيجي. أنا أعمل في قطاع [X] في [البلد].
هذه العوامل الخارجية الموجودة لدي: [PESTEL الحالي]
بناءً على أحدث التطورات، اقترح:
1. عوامل جديدة يجب إضافتها
2. عوامل موجودة تغير تأثيرها
3. عوامل لم تعد ذات صلة
أجب بصيغة JSON.
```

---

### المرحلة 3.3: Cron Job (أسبوعي)

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 3.3.1 | Scheduler | Backend | في `server.js`: إضافة cron job أسبوعي يفحص كل entity + يشغّل PESTEL update | 1 ساعة |
| 3.3.2 | Notification | Backend | إشعار: "تم اقتراح 5 عوامل PESTEL جديدة — اعتمد أو ارفض" | 45 دق |
| 3.3.3 | Cost Tracking | Backend | تتبع: عدد استدعاءات Claude + التكلفة التقديرية | 30 دق |

---

### المرحلة 3.4: اختبار AI

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 3.4.1 | Mock Test | Test | اختبار بدون API حقيقي: mock response → parse → save | 1 ساعة |
| 3.4.2 | Integration Test | Test | اختبار حقيقي: استدعاء Claude → تحقق من الاقتراحات | 1 ساعة |
| 3.4.3 | Error Handling | Test | اختبار: ماذا يحصل لو Claude لم يرد؟ أو رد بصيغة خاطئة؟ | 45 دق |

---

## 📊 ملخص الأسبوع 3

| البُعد | قبل | بعد |
|--------|------|------|
| AI Integration | 0 | Claude API جاهز |
| AI Features | 0 | PESTEL auto-update |
| ملفات جديدة | 0 | 2 (ai-service.js + ai.js) |
| تكلفة AI شهرية | $0 | ~$5-15 (حسب الاستخدام) |

**المدة التقديرية:** 3-4 أيام عمل

---

# 🗓️ الأسبوع 4: الاختبار والتجهيز للإطلاق

## الهدف: نظام مختبر وجاهز لأول 3-5 شركات حقيقية

---

### المرحلة 4.1: اختبار داخلي شامل

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 4.1.1 | Full Flow Test | Test | اختبار الرحلة الكاملة: تسجيل → إعداد كيان → تقييم → أهداف → KPIs → مبادرات → مراجعة | 3 ساعات |
| 4.1.2 | Inspector Full Scan | Test | فحص Inspector لكل الـ 10 منهجيات والتأكد من الدرجات المنطقية | 1 ساعة |
| 4.1.3 | Alert Engine Full Scan | Test | تشغيل scan كامل → التأكد من التنبيهات المنطقية | 1 ساعة |
| 4.1.4 | UI Review | Frontend | مراجعة كل الصفحات الـ 37: تحميل صحيح + responsive + لا أخطاء console | 3 ساعات |

---

### المرحلة 4.2: إصلاح الأخطاء

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 4.2.1 | Bug Fixes | Backend + Frontend | إصلاح كل الأخطاء المكتشفة في 4.1 | 4 ساعات (تقدير) |
| 4.2.2 | Error Handling | Backend | مراجعة كل route: error messages واضحة + لا 500 errors غير متوقعة | 2 ساعة |
| 4.2.3 | Sidebar Consistency | Frontend | التأكد: كل الصفحات تستخدم sidebar.js الموحد | 1 ساعة |

---

### المرحلة 4.3: بيانات تجريبية للعرض

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 4.3.1 | Demo Seed Script | Script | `scripts/demo-seed.js` — يزرع بيانات واقعية لشركة تجريبية واحدة | 2 ساعة |
| 4.3.2 | Demo Data | Data | بيانات: رؤية + 5 أهداف + 10 KPIs + 5 مبادرات + SWOT كامل + PESTEL | ضمن 4.3.1 |
| 4.3.3 | Demo Walk-through | Doc | وثيقة: كيف تعرض النظام لعميل في 10 دقائق | 1 ساعة |

---

### المرحلة 4.4: تجهيز الإطلاق

| # | المهمة | النوع | التفاصيل | المدة |
|---|--------|-------|----------|-------|
| 4.4.1 | Environment Variables | Config | التأكد: كل المتغيرات في `.env.example` موثقة | 30 دق |
| 4.4.2 | README Update | Doc | تحديث README: كيف تشغّل المشروع + ما هي الميزات | 1 ساعة |
| 4.4.3 | Backup Script | Script | `scripts/backup.sh` — نسخ احتياطي لقاعدة البيانات | 30 دق |
| 4.4.4 | Performance Check | Test | التأكد: الصفحات تحمّل في أقل من 3 ثوانٍ | 1 ساعة |

---

## 📊 ملخص الأسبوع 4

| البُعد | قبل | بعد |
|--------|------|------|
| أخطاء معروفة | ? | 0 |
| بيانات تجريبية | لا | شركة واحدة كاملة |
| وثائق | 10+ ملفات قديمة | README محدث + demo guide |
| جاهزية الإطلاق | لا | ✅ جاهز لـ 3-5 شركات |

**المدة التقديرية:** 4-5 أيام عمل

---

# 📈 النتيجة النهائية بعد 4 أسابيع

```
╔══════════════════════════════════════════════════════════╗
║                    قبل                →        بعد      ║
╠══════════════════════════════════════════════════════════╣
║  المنهجيات الكاملة    6 (47%)        →   10 (67%)      ║
║  الاختبارات           1 ملف          →   30+ اختبار     ║
║  AI Integration       ❌              →   Claude PESTEL  ║
║  الـ Golden Thread     جزئي           →   كامل ومرئي    ║
║  Kanban Board         ❌              →   ✅ يعمل       ║
║  Budget Tracking      ❌              →   ✅ مربوط       ║
║  Demo Data            ❌              →   ✅ شركة كاملة  ║
║  جاهزية الإطلاق       ❌              →   ✅ جاهز       ║
╚══════════════════════════════════════════════════════════╝
```

---

# ⚠️ المخاطر والمعالجة

| المخاطر | الاحتمال | المعالجة |
|---------|----------|---------|
| Claude API Key غير متوفر | منخفض | يمكن تأجيل الأسبوع 3 بالكامل |
| أخطاء schema غير متوقعة | متوسط | عمل migration احتياطي قبل كل تعديل |
| وقت التنفيذ أطول من المتوقع | متوسط | الأسبوع 4 فيه مرونة 30% |
| SQLite performance limitations | منخفض | لن تظهر مع 5 شركات فقط |

---

# ✅ اعتماد المراحل

> **هل توافق على هذه الخطة بالكامل؟**
> أم تبي نعدّل شيء قبل البدء؟

**خيارات:**
- [ ] **اعتماد كامل** — نبدأ من المرحلة 1.1
- [ ] **اعتماد أسبوع أسبوع** — اعتمد الأسبوع 1 فقط، ثم نراجع
- [ ] **تعديل** — حدد وش تبي يتغير
- [ ] **إعادة ترتيب** — غيّر ترتيب الأولويات
