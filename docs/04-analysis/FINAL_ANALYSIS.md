# 🔬 التحليل النهائي: الوثيقة الشاملة vs الواقع الحالي
> التاريخ: 17 فبراير 2026 | الحالة: **في انتظار الاعتماد**

---

## 1. مقارنة Schema: الوثيقة vs الموجود

### ✅ متوافق (لا يحتاج تغيير)
| الوثيقة | الموجود | ملاحظة |
|---------|---------|--------|
| User (id, email, name) | User + password + systemRole + avatar | الموجود **أغنى** |
| Member (userId, entityId, role) | Member مع @@unique | **مطابق** |
| Role enum (OWNER/ADMIN/EDITOR/VIEWER) | حقل role نصي بنفس القيم | متوافق (String vs Enum) |
| StrategyVersion | موجود + pivotedFromId + approvedBy | الموجود **أغنى بكثير** |
| VersionStatus | حقل status نصي بنفس القيم | متوافق |
| StrategicObjective | موجود + parentId + perspective + weight | الموجود **أغنى** |
| BSC Perspectives | perspective حقل نصي بنفس الـ 4 قيم | متوافق |

### ⚠️ تعارض (يحتاج قرار)
| الوثيقة تقول | الموجود | التعارض | التوصية |
|---|---|---|---|
| `EntitySize` enum | `size` String | Enum vs String | **إبقاء String** — SQLite لا يدعم enum فعلياً |
| `BusinessCulture` enum (أمريكي/ياباني/أوروبي/إسلامي) | `school` String (BSC/OKR/HOSHIN) | **مفهومان مختلفان** — culture = فلسفة، school = منهجية | **إضافة `culture` كحقل جديد** بجانب `school` |
| `Entity.industry` String (ISIC Code) | `industryId` FK → Industry model | الوثيقة تبسّط، الموجود أصح | **إبقاء الموجود** — جدول مرجعي أفضل |
| `Entity.sector` String | `sectorId` FK → Sector model | نفس الشيء | **إبقاء الموجود** |
| `CompanyAnalysis.entityId` | غير موجود | الوثيقة تربط بـ Entity | **استخدام `versionId`** — لدعم المقارنة بين النسخ |
| `@@unique` على `[entityId, isActive]` | `@@unique([entityId, versionNumber])` | قيد فريد مختلف | **إبقاء الموجود** — أدق وأسلم |
| Objectives مربوطة بـ Entity + Version | Objectives مربوطة بـ Version فقط | الوثيقة تكرر الربط | **إبقاء الموجود** — Version ينتمي لـ Entity أصلاً |
| `ToolDefinition.configSchema` Json | غير موجود | الوثيقة تضيف validation schema | **نعم نضيفه** — مفيد لـ validation مستقبلاً |

### 🔴 غير موجود (يحتاج بناء)
| المطلوب | الأولوية | التفصيل |
|---------|---------|---------|
| `ToolDefinition` model | **P0** | 13 أداة مع code/nameAr/phase/isPrimary/order/icon |
| `CompanyAnalysis` model | **P0** | versionId + toolCode + status + data(JSON) + score |
| حقل `culture` في Entity | **P1** | AMERICAN/JAPANESE/EUROPEAN/ISLAMIC |
| حقل `towsStrategy` في AnalysisPoint | **P1** | SO/WO/ST/WT لربط TOWS |
| حقل `linkedPointId` في AnalysisPoint | **P2** | ربط S↔O لتوليد استراتيجيات |

### 🟢 موجود وغير مذكور بالوثيقة (نقاط قوة نحافظ عليها)
| Model | الوظيفة | القيمة |
|-------|---------|--------|
| Company + Subscription | نظام Multi-tenant + اشتراكات | **أساسي للـ SaaS** |
| Sector + Industry + EntityType | شجرة تصنيف مرجعية | **أفضل من String** |
| ExternalAnalysis | PESTEL + Porter مع trend/probability | **بيانات غنية** |
| KPIEntry | إدخال دوري لبيانات KPI | **تتبع زمني** |
| KpiDiagnosis + CorrectionAction | تشخيص وتصحيح | **حلقة PDCA** |
| StrategicReview | مراجعات + قرارات (CONTINUE/ADJUST/PIVOT) | **ذكاء مراجعات** |
| StrategicAlert | تنبيهات آلية (7 أنواع) | **نظام إنذار** |
| StrategicRisk | مخاطر مع scoring كمّي | **إدارة مخاطر** |
| FinancialDecision | قرارات مالية | **ربط مالي** |
| Integration | تكاملات خارجية (Webhooks/APIs) | **قابلية توسع** |
| AuditLog | حوكمة ورقابة | **امتثال** |

---

## 2. مقارنة APIs: 21 route موجود vs المطلوب

### الموجود (21 route file):
```
auth, sectors, industries, entities, users, assessments,
strategic (objectives+KPIs), reviews, versions, choices (choices+risks),
corrections, analysis (SWOT), financial, integrations, directions,
external-analysis (PESTEL+Porter), kpi-entries, alerts, audit,
dashboard-api, companies
```

### المطلوب إضافته:
| Route | الملف | المحتوى | الأولوية |
|-------|-------|---------|---------|
| `/api/tools` | tools.js | CRUD أدوات + seed + فلتر (phase/isPrimary) | P0 |
| `/api/company-analysis` | company-analysis.js | CRUD تحليلات + ربط تلقائي + summary | P0 |

### الربط التلقائي (الأهم):
```
GET /api/company-analysis/:versionId/SWOT_TOWS
  → يسحب من: prisma.analysisPoint.findMany({assessmentId})
  → يحسب: تقدم = عدد النقاط ≥ 4 ? "COMPLETED" : "IN_PROGRESS"

GET /api/company-analysis/:versionId/PESTEL
  → يسحب من: prisma.externalAnalysis.findMany({versionId, type: in PESTEL_TYPES})
  → يحسب: تقدم = 6 أنواع مغطاة = 100%

GET /api/company-analysis/:versionId/PORTER_5
  → يسحب من: prisma.externalAnalysis.findMany({versionId, type: in PORTER_TYPES})

GET /api/company-analysis/:versionId/BSC_OKRS
  → يسحب من: prisma.strategicObjective.findMany({versionId})
  → يجمع: KPIs + perspectives

GET /api/company-analysis/:versionId/ANSOFF
  → يسحب من: prisma.strategicChoice.findMany({versionId})
  → يصنف: حسب choiceType (MARKET_PENETRATION, etc.)
```

---

## 3. مقارنة الصفحات: 25 صفحة موجودة vs المطلوب

### الموجود (25 HTML):
```
landing✅, onboarding✅, login✅, dashboard✅, dashboard-improved,
admin, alerts, analysis(SWOT), assessments, choices, corrections,
directions, entities, financial, industries, initiatives,
integrations, kpi-entries, kpis, objectives, reviews,
sectors, settings, users, versions
```

### المطلوب إضافته:
| الصفحة | الوظيفة | الأولوية |
|--------|---------|---------|
| `tools.html` | المسار الاستراتيجي (4 مراحل + بطاقات) | **P0** |
| `tool-detail.html` | صفحة أداة واحدة (قالب ديناميكي) | **P0** |
| تحديث `onboarding.html` | إضافة سؤال culture (أمريكي/ياباني/...) | **P1** |
| تحديث `dashboard.html` | إضافة قسم تقدم المسار | **P1** |
| `compare.html` | مقارنة بين نسختين | **P2** |
| `report.html` | تقرير PDF شامل | **P2** |

### تحديث صفحات موجودة:
| الصفحة | التحديث المطلوب |
|--------|----------------|
| `analysis.html` | إضافة تبويب TOWS بجانب SWOT |
| `choices.html` | إضافة عرض Ansoff Matrix بصري |
| `objectives.html` | إضافة عرض BSC 4-perspectives |

---

## 4. خريطة الربط: كيف يتصل كل شيء

```
الطبقة 1 — البيانات الموجودة (لا نغيرها):
┌────────────────────────────────────────────────────────┐
│ AnalysisPoint │ ExternalAnalysis │ StrategicObjective  │
│ (SWOT)        │ (PESTEL+Porter)  │ (BSC+OKR)          │
│               │                  │                     │
│ StrategicChoice │ StrategicRisk │ StrategicInitiative  │
│ (Ansoff)        │ (المخاطر)    │ (المبادرات)          │
└───────┬────────────────┬──────────────────┬────────────┘
        │                │                  │
        ↓                ↓                  ↓
الطبقة 2 — الفهرس الموحد (CompanyAnalysis) — جديد:
┌────────────────────────────────────────────────────────┐
│ CompanyAnalysis                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ versionId + toolCode = مفتاح فريد               │   │
│ │ status: DRAFT → IN_PROGRESS → COMPLETED          │   │
│ │ progress: 0-100%                                 │   │
│ │ data: JSON (للأدوات الجديدة مثل VRIO/Blue Ocean) │   │
│ │ score: نتيجة التحليل                             │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ للأدوات الموجودة: data = null (يسحب من الجدول الأصلي)  │
│ للأدوات الجديدة: data = JSON كامل                     │
└───────────────────────┬────────────────────────────────┘
                        │
                        ↓
الطبقة 3 — التعريف (ToolDefinition) — جديد:
┌────────────────────────────────────────────────────────┐
│ 13 أداة معرّفة مع: code, nameAr, phase, isPrimary     │
│                                                        │
│ DIAGNOSIS: SWOT_TOWS✱ PESTEL✱ PORTER_5 VRIO✱          │
│ CHOICE:    TOWS✱ ANSOFF✱ BLUE_OCEAN✱ BCG GE           │
│ EXECUTION: BSC_OKRS✱ HOSHIN✱ MCKINSEY_7S              │
│ ADAPTATION: SCENARIO✱                                  │
│                                        ✱ = isPrimary   │
└────────────────────────────────────────────────────────┘
```

---

## 5. خطة العمل المرحلية (المعتمدة على الموجود)

### 🟢 المرحلة 1: الأساس (3 أيام) — Sprints يوم/يوم

**اليوم 1: Schema + Migration**
```
مهمة 1.1: إضافة ToolDefinition لـ schema.prisma
مهمة 1.2: إضافة CompanyAnalysis لـ schema.prisma  
مهمة 1.3: إضافة حقل culture لـ Entity
مهمة 1.4: prisma migrate dev --name add-tools-system
تحقق: prisma studio يعرض الجداول الجديدة فارغة
```

**اليوم 2: Seed + APIs**
```
مهمة 2.1: إنشاء prisma/seed-tools.js (13 أداة بالعربي والإنجليزي)
مهمة 2.2: إنشاء routes/tools.js (GET / + GET /:code + POST /seed)
مهمة 2.3: إنشاء routes/company-analysis.js (CRUD أساسي)
مهمة 2.4: ربط Routes بـ server.js
تحقق: GET /api/tools?primary=true يرجع 8 أدوات
```

**اليوم 3: صفحة المسار**
```
مهمة 3.1: إنشاء public/tools.html (4 مراحل + بطاقات)
مهمة 3.2: زر وضع متقدم (toggle) يظهر/يخفي الثانوية
مهمة 3.3: ربط route /tools بـ server.js
تحقق: فتح /tools يعرض 8 بطاقات في 4 مراحل
```

### 🟡 المرحلة 2: ربط الموجود (4 أيام)

**اليوم 4: ربط SWOT + PESTEL**
```
مهمة 4.1: API يسحب AnalysisPoint → يحسب تقدم SWOT
مهمة 4.2: API يسحب ExternalAnalysis (PESTEL) → يحسب التقدم
مهمة 4.3: تحديث بطاقات المسار بنسب التقدم الحقيقية
تحقق: بطاقة SWOT تعرض "مكتمل 80%" إذا فيه بيانات
```

**اليوم 5: ربط Porter + Ansoff + BSC**
```
مهمة 5.1: ربط Porter (ExternalAnalysis PORTER_*)
مهمة 5.2: ربط Ansoff (StrategicChoice.choiceType)
مهمة 5.3: ربط BSC/OKR (StrategicObjective.perspective)
تحقق: 5 أدوات موجودة تعرض تقدمها الحقيقي
```

**اليوم 6: تحديث Dashboard**
```
مهمة 6.1: إضافة قسم "المسار الاستراتيجي" بـ dashboard
مهمة 6.2: شريط تقدم إجمالي (% الأدوات المكتملة)
مهمة 6.3: أيقونات سريعة للأدوات مع حالتها
تحقق: Dashboard يعرض "التقدم: 40%" مع أيقونات
```

**اليوم 7: TOWS**
```
مهمة 7.1: إضافة towsStrategy لـ AnalysisPoint
مهمة 7.2: API إنشاء تقاطعات SO/WO/ST/WT
مهمة 7.3: واجهة مصفوفة TOWS (تبويب جديد في analysis.html)
تحقق: بعد إكمال SWOT → فتح TOWS يعرض التقاطعات
```

### 🔵 المرحلة 3: أدوات جديدة (5 أيام)

**اليوم 8: VRIO**
```
مهمة 8.1: JSON schema: resources[{name, V, R, I, O, result}]
مهمة 8.2: API لحفظ/استرجاع بيانات VRIO
مهمة 8.3: واجهة جدول تفاعلي مع checkboxes
مهمة 8.4: حساب تلقائي (Sustained/Temporary/Parity/Disadvantage)
تحقق: إدخال 3 موارد → النتيجة تُحسب تلقائياً
```

**اليوم 9-10: Blue Ocean**
```
مهمة 9.1: JSON schema: factors[] + ERRC actions
مهمة 9.2: API لحفظ/استرجاع
مهمة 9.3: Strategy Canvas (Chart.js — خطين: الصناعة vs الشركة)
مهمة 9.4: ERRC Grid (4 أقسام: استبعد/قلص/ارفع/ابتكر)
تحقق: إدخال 5 عوامل → رسم بياني يظهر الفجوة
```

**اليوم 11: Scenario Planning**
```
مهمة 11.1: JSON schema: scenarios[{name, probability, impacts[]}]
مهمة 11.2: API لحفظ/استرجاع
مهمة 11.3: واجهة بطاقات (متفائل/واقعي/متشائم)
تحقق: إنشاء 3 سيناريوهات → عرضها مع الاحتمالات
```

**اليوم 12: Hoshin Kanri**
```
مهمة 12.1: JSON schema: breakthroughObjectives[{annualTargets[], monthlyActions[]}]
مهمة 12.2: API + واجهة X-Matrix مبسطة
تحقق: هدف كبير → أهداف سنوية → إجراءات شهرية
```

### 🟣 المرحلة 4: التكامل والذكاء (4 أيام)

**اليوم 13: tool-detail.html**
```
مهمة 13.1: صفحة قالب ديناميكية تتكيف حسب الأداة
مهمة 13.2: كل أداة تُعرض بـ widget مناسب (جدول/مصفوفة/رسم)
تحقق: /tools/SWOT_TOWS يفتح SWOT، /tools/VRIO يفتح VRIO
```

**اليوم 14: Onboarding ذكي**
```
مهمة 14.1: إضافة سؤال culture للـ onboarding (خطوة جديدة أو ضمن خطوة 1)
مهمة 14.2: خوارزمية اقتراح أدوات حسب (size + culture + sector)
مهمة 14.3: عند إكمال Onboarding → إنشاء CompanyAnalysis entries فارغة
تحقق: مؤسس startup → يرى SWOT + OKR + Blue Ocean مقترحة
```

**اليوم 15: المقارنة**
```
مهمة 15.1: GET /api/company-analysis/compare?v1=X&v2=Y
مهمة 15.2: صفحة compare.html (جدول side-by-side)
تحقق: نسخة 1 vs نسخة 2 → الفروقات واضحة
```

**اليوم 16: الملخص + التقدم**
```
مهمة 16.1: GET /api/company-analysis/:versionId/summary
مهمة 16.2: حساب Health Score (0-100) بناءً على اكتمال الأدوات
مهمة 16.3: ربط Auto-link (SWOT مكتمل → اقتراح TOWS)
تحقق: Summary يعرض كل الأدوات + Score + اقتراحات
```

### ⚫ المرحلة 5: التميز (3 أيام) — P2

**اليوم 17: أدوات متقدمة**
```
BCG Matrix (Stars/Cash Cows/Dogs/Question Marks)
McKinsey 7S (7 عناصر + radar chart)
GE Matrix (3×3 grid)
```

**اليوم 18: PDF Export**
```
مهمة 18.1: تقرير PDF شامل (كل الأدوات المكتملة)
مهمة 18.2: ملخص تنفيذي + توصيات
```

**اليوم 19: اختبار شامل + تحسينات**

---

## 6. الاختبارات لكل مرحلة

### المرحلة 1 — اختبارات Unit:
| # | Test | Input | Expected |
|---|------|-------|----------|
| T1 | Seed tools | POST /api/tools/seed | 13 tools created |
| T2 | Filter primary | GET /api/tools?primary=true | 8 tools |
| T3 | Filter phase | GET /api/tools?phase=DIAGNOSIS | 3-4 tools |
| T4 | Create analysis | POST /api/company-analysis {versionId, toolCode:"VRIO"} | 201 |
| T5 | Prevent duplicate | POST same version+tool twice | 409 |
| T6 | Page /tools | Browser → /tools | 4 phases + 8 cards |

### المرحلة 2 — اختبارات Integration:
| # | Test | Steps | Expected |
|---|------|-------|----------|
| E1 | SWOT sync | إنشاء 4 AnalysisPoints → GET /company-analysis/SWOT_TOWS | status: COMPLETED |
| E2 | PESTEL sync | إنشاء 6 ExternalAnalysis → GET /company-analysis/PESTEL | progress: 100% |
| E3 | Dashboard | إكمال أداتين → فتح Dashboard | تقدم 25% يظهر |
| E4 | TOWS | إكمال SWOT → فتح TOWS | تقاطعات SO/WO/ST/WT |

### المرحلة 3 — اختبارات أدوات جديدة:
| # | Test | Input | Expected |
|---|------|-------|----------|
| E5 | VRIO calc | 3 resources (V✓R✓I✗O✓) | Temporary Advantage |
| E6 | Blue Ocean | 5 factors + scores | Strategy Canvas chart |
| E7 | Scenario | 3 scenarios + probabilities | Probabilities sum ≤ 1.0 |
| E8 | Full journey | SWOT→TOWS→Ansoff→BSC→Review | progress 100% |

### المرحلة 4 — اختبارات End-to-End:
| # | Test | Flow | Expected |
|---|------|------|----------|
| E9 | Onboarding→Tools | تسجيل (startup/أمريكي/تقنية) → /tools | 5 أدوات مقترحة |
| E10 | Compare | Version 1 (SWOT+PESTEL) → Version 2 (SWOT فقط) | فرق واضح |
| E11 | Health Score | إكمال 6/8 أدوات | Score ~75% |

---

## 7. القرارات المعلّقة (تحتاج اعتمادك)

| # | القرار | الخيارات | توصيتي | السبب |
|---|--------|---------|--------|-------|
| **Q1** | Enum vs String | Prisma enums / String حقول | **String** | SQLite compatibility + مرونة |
| **Q2** | CompanyAnalysis يرتبط بـ | entityId / versionId | **versionId** | يدعم مقارنة النسخ |
| **Q3** | بيانات الأدوات الموجودة | نسخ للـ JSON / إشارة (reference) | **إشارة** | لا تكرار بيانات |
| **Q4** | culture vs school | دمج / حقلين منفصلين | **حقلين** | culture = فلسفة، school = منهجية |
| **Q5** | عدد الأدوات الأساسية | 5 / 8 / كلها | **8** | التوازن بين البساطة والقوة |
| **Q6** | Tech Stack الواجهة | يبقى Vanilla JS / ننتقل لـ Next.js | **يبقى Vanilla JS** | لا نكسر الموجود |
| **Q7** | DB مستقبلاً | يبقى SQLite / PostgreSQL | **SQLite الآن** → PostgreSQL لاحقاً | JSON queries محدودة بـ SQLite |

---

## 8. المخاطر والتخفيف

| # | المخاطر | الاحتمال | الأثر | التخفيف |
|---|---------|---------|-------|---------|
| R1 | JSON في SQLite بطيء | عالي | متوسط | نخزن الملخصات في حقول عادية + JSON للتفاصيل |
| R2 | تعقيد الربط التلقائي | متوسط | عالي | نبدأ بربط يدوي (زر "مزامنة") ثم نأتمت |
| R3 | Chart.js ثقيل للرسوم | منخفض | منخفض | نحمّله lazily فقط في صفحات الأدوات |
| R4 | Migration تكسر البيانات | منخفض | عالي | Additive only — لا حذف أعمدة |
| R5 | 13 أداة = 13 واجهة مختلفة | عالي | عالي | قالب واحد ديناميكي (tool-detail.html) |

---

## 9. الملخص التنفيذي

**الموجود:** 17 model + 21 API route + 25 صفحة — أساس قوي جداً

**المطلوب إضافته:**
- **2 models** جديدة (ToolDefinition + CompanyAnalysis)
- **2 حقول** جديدة (Entity.culture + AnalysisPoint.towsStrategy)
- **2 route files** جديدة (tools.js + company-analysis.js)
- **3 صفحات** جديدة (tools.html + tool-detail.html + compare.html)
- **3 صفحات** تُحدَّث (dashboard + analysis + onboarding)
- **4 أدوات** جديدة بالكامل (VRIO + Blue Ocean + Scenario + Hoshin)
- **5 أدوات** تُربط بالموجود (SWOT + PESTEL + Porter + Ansoff + BSC)

**المدة الإجمالية:** ~19 يوم عمل (4 أسابيع واقعية)

**لا نكسر شيء** — كل التغييرات additive فوق الأساس الموجود.
