# 🧠 خطة أدوات التحليل الاستراتيجي — Stratix Smart Tools
> **التاريخ:** 17 فبراير 2026  
> **الاستراتيجية:** 8 أدوات أساسية ظاهرة + 12 أداة متقدمة مخفية  
> **المبدأ:** Additive Only — لا كسر للموجود

---

## 📊 الوضع الحالي (ما عندنا)

### الـ Schema الموجود:
| Model | الوظيفة | الحالة |
|-------|---------|--------|
| `AnalysisPoint` | SWOT (S/W/O/T) | ✅ يعمل - مربوط بـ Assessment |
| `ExternalAnalysis` | PESTEL + Porter | ✅ يعمل - مربوط بـ StrategyVersion |
| `StrategicObjective` | أهداف BSC + OKR | ✅ يعمل - مع hierarchy |
| `KPI` + `KPIEntry` | مؤشرات أداء | ✅ يعمل - مع entries دورية |
| `StrategicChoice` | Ansoff + Porter Generic | ✅ يعمل - مع تقييم كمّي |
| `StrategicRisk` | مخاطر | ✅ يعمل - مع scoring |
| `StrategicDirection` | رؤية/رسالة/قيم | ✅ يعمل |
| `StrategicInitiative` | مبادرات | ✅ يعمل |
| `StrategicReview` | مراجعات + قرارات | ✅ يعمل |

### الـ Routes الموجودة:
| Route | الملف | APIs |
|-------|-------|------|
| `/api/analysis` | `analysis.js` | CRUD + SWOT matrix |
| `/api/external-analysis` | `external-analysis.js` | CRUD + grouped by framework |
| `/api/strategic` | `strategic.js` | Objectives + KPIs CRUD |
| `/api/choices` | `choices.js` | Choices + Risks CRUD |
| `/api/assessments` | `assessments.js` | Assessments + Dimensions + Criteria |

### الصفحات الموجودة:
`analysis.html`, `assessments.html`, `choices.html`, `objectives.html`, `kpis.html`, `directions.html`

---

## 🎯 الأدوات المطلوبة (8 أساسية + 5 متقدمة)

### المرحلة 1: التشخيص (DIAGNOSIS)
| الأداة | الكود | أساسية؟ | الوضع |
|--------|-------|---------|-------|
| SWOT + TOWS | `SWOT_TOWS` | ✅ | ⚡ **موجود جزئياً** — SWOT يعمل، TOWS يحتاج إضافة |
| PESTEL | `PESTEL` | ✅ | ⚡ **موجود** — يعمل بالكامل |
| VRIO | `VRIO` | ✅ | 🔴 **غير موجود** — يحتاج بناء |
| Porter's 5 | `PORTER_5` | 🔒 متقدم | ⚡ **موجود** — ضمن ExternalAnalysis |
| Value Chain | `VALUE_CHAIN` | 🔒 متقدم | 🔴 **غير موجود** |

### المرحلة 2: الاختيار (CHOICE)
| الأداة | الكود | أساسية؟ | الوضع |
|--------|-------|---------|-------|
| Ansoff Matrix | `ANSOFF` | ✅ | ⚡ **موجود جزئياً** — choiceType يدعمه |
| Blue Ocean | `BLUE_OCEAN` | ✅ | 🔴 **غير موجود** |
| BCG Matrix | `BCG_MATRIX` | 🔒 متقدم | 🔴 **غير موجود** |

### المرحلة 3: التنفيذ (EXECUTION)
| الأداة | الكود | أساسية؟ | الوضع |
|--------|-------|---------|-------|
| BSC + OKRs | `BSC_OKRS` | ✅ | ⚡ **موجود** — perspective + hierarchy |
| Hoshin Kanri | `HOSHIN_KANRI` | ✅ | 🔴 **غير موجود** |
| McKinsey 7S | `MCKINSEY_7S` | 🔒 متقدم | 🔴 **غير موجود** |

### المرحلة 4: التكيف (ADAPTATION)
| الأداة | الكود | أساسية؟ | الوضع |
|--------|-------|---------|-------|
| Scenario Planning | `SCENARIO_PLANNING` | ✅ | 🔴 **غير موجود** |
| AI Simulation | `AI_SIMULATION` | ✅ | 🔴 **غير موجود** — مستقبلي |
| GE Matrix | `GE_MATRIX` | 🔒 متقدم | 🔴 **غير موجود** |

---

## 🏗️ التغييرات المطلوبة على Schema

### إضافة 1: جدول تعريف الأدوات (ToolDefinition)
```prisma
// Enums جديدة
enum StrategyPhase {
  DIAGNOSIS
  CHOICE
  EXECUTION
  ADAPTATION
}

enum AnalysisToolType {
  SWOT_TOWS
  PESTEL
  VRIO
  PORTER_5
  VALUE_CHAIN
  ANSOFF
  BLUE_OCEAN
  BCG_MATRIX
  BSC_OKRS
  HOSHIN_KANRI
  MCKINSEY_7S
  SCENARIO_PLANNING
  AI_SIMULATION
  GE_MATRIX
}

model ToolDefinition {
  id          String           @id @default(cuid())
  code        String           @unique  // AnalysisToolType value
  nameAr      String
  nameEn      String
  phase       String           // StrategyPhase value
  isPrimary   Boolean          @default(true)
  icon        String?
  description String?
  order       Int              @default(0)
  isActive    Boolean          @default(true)
  createdAt   DateTime         @default(now())
  
  analyses    CompanyAnalysis[]
  
  @@map("tool_definitions")
}
```

### إضافة 2: جدول التحليل المرن (CompanyAnalysis)
```prisma
model CompanyAnalysis {
  id          String    @id @default(cuid())
  versionId   String
  toolCode    String    // يشير لـ ToolDefinition.code
  status      String    @default("DRAFT")  // DRAFT, IN_PROGRESS, COMPLETED
  data        String    // JSON — بيانات مرنة حسب نوع الأداة
  score       Float?    // نتيجة التحليل (0-100)
  summary     String?   // ملخص تنفيذي
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  version     StrategyVersion @relation(fields: [versionId], references: [id], onDelete: Cascade)
  tool        ToolDefinition  @relation(fields: [toolCode], references: [code])

  @@unique([versionId, toolCode])
  @@index([versionId])
  @@index([toolCode])
  @@map("company_analyses")
}
```

### إضافة 3: ربط TOWS بـ AnalysisPoint الموجود
```prisma
// إضافة حقل للـ AnalysisPoint الموجود
model AnalysisPoint {
  // ... الحقول الموجودة ...
  towsStrategy  String?  // SO, WO, ST, WT — ربط نقطة SWOT بإستراتيجية TOWS
  linkedPointId String?  // ربط بنقطة أخرى (S مع O مثلاً)
}
```

### ملاحظة مهمة:
> **لا نغير** الـ Models الموجودة (AnalysisPoint, ExternalAnalysis, etc.)
> **نضيف** CompanyAnalysis كطبقة موحدة فوقها
> الأدوات الموجودة (SWOT, PESTEL, Porter) تبقى تعمل كما هي + تُسجَّل في CompanyAnalysis

---

## 🔌 خطة الـ APIs

### ملف جديد: `routes/tools.js`

```
GET    /api/tools                         → قائمة الأدوات (مع فلتر isPrimary)
GET    /api/tools/:code                   → تفاصيل أداة واحدة
GET    /api/tools/phases                  → الأدوات مجمّعة بالمراحل
POST   /api/tools/seed                    → تعبئة بيانات الأدوات الأولية

GET    /api/company-analysis/:versionId   → كل التحليلات لنسخة معينة
GET    /api/company-analysis/:versionId/:toolCode → تحليل معين
POST   /api/company-analysis              → إنشاء/تحديث تحليل
PATCH  /api/company-analysis/:id          → تحديث
DELETE /api/company-analysis/:id          → حذف

GET    /api/company-analysis/:versionId/summary → ملخص شامل لكل الأدوات
GET    /api/company-analysis/:versionId/compare → مقارنة بين النسخ
```

### الربط مع الموجود:
```
عند إنشاء CompanyAnalysis بـ toolCode = "SWOT_TOWS":
  → يسحب بيانات AnalysisPoint الموجودة تلقائياً
  → يضيف طبقة TOWS فوقها

عند إنشاء CompanyAnalysis بـ toolCode = "PESTEL":
  → يسحب بيانات ExternalAnalysis (PESTEL types) تلقائياً

عند إنشاء CompanyAnalysis بـ toolCode = "PORTER_5":
  → يسحب بيانات ExternalAnalysis (PORTER types) تلقائياً

عند إنشاء CompanyAnalysis بـ toolCode = "BSC_OKRS":
  → يسحب بيانات StrategicObjective + KPI تلقائياً

عند إنشاء CompanyAnalysis بـ toolCode = "ANSOFF":
  → يسحب بيانات StrategicChoice تلقائياً
```

---

## 🎨 تجربة المستخدم (UI Flow)

### الشاشة الرئيسية: "المسار الاستراتيجي" (`/tools` أو `/strategy-pipeline`)

```
┌─────────────────────────────────────────────────────────────┐
│  🧭 المسار الاستراتيجي                     [وضع متقدم 🔧]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ① التشخيص        ② الاختيار       ③ التنفيذ      ④ التكيف │
│  ━━━━━━━━━        ─────────       ─────────      ───────── │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐│
│  │ SWOT+TOWS│   │  Ansoff  │   │ BSC/OKRs │   │ سيناريو  ││
│  │ ✅ مكتمل │   │ 🔶 جاري  │   │ ⬜ لم يبدأ│   │ ⬜ لم يبدأ││
│  │ 85%      │   │ 40%      │   │          │   │          ││
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘│
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐│
│  │  PESTEL  │   │Blue Ocean│   │  Hoshin  │   │ AI Sim   ││
│  │ ✅ مكتمل │   │ ⬜ لم يبدأ│   │ ⬜ لم يبدأ│   │ 🔒 قريباً ││
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘│
│  ┌──────────┐                                              │
│  │   VRIO   │      [🔒 BCG]       [🔒 7S]     [🔒 GE]     │
│  │ ⬜ لم يبدأ│   ← تظهر فقط في                             │
│  └──────────┘     الوضع المتقدم                            │
│                                                             │
│  ───────────────────────────────────────────────────────── │
│  📊 التقدم الإجمالي: ████████░░░░░░░ 35%                   │
└─────────────────────────────────────────────────────────────┘
```

### عند الضغط على أداة → يفتح صفحة الأداة:

```
┌─────────────────────────────────────────────────────────────┐
│  ← رجوع    SWOT + TOWS Analysis      [حفظ] [تصدير PDF]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [تبويبات: SWOT | TOWS | ملخص]                              │
│                                                             │
│  ┌─── نقاط القوة (S) ──────┐  ┌─── نقاط الضعف (W) ────────┐│
│  │ + إضافة نقطة            │  │ + إضافة نقطة              ││
│  │ • بنية تحتية قوية  HIGH │  │ • نقص الكوادر       HIGH  ││
│  │ • سمعة ممتازة     MED  │  │ • أنظمة قديمة       MED   ││
│  └─────────────────────────┘  └────────────────────────────┘│
│  ┌─── الفرص (O) ───────────┐  ┌─── التهديدات (T) ─────────┐│
│  │ + إضافة نقطة            │  │ + إضافة نقطة              ││
│  │ • رؤية 2030        HIGH │  │ • منافسة شديدة     HIGH   ││
│  └─────────────────────────┘  └────────────────────────────┘│
│                                                             │
│  [التالي: إنشاء استراتيجيات TOWS ←]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 هيكل بيانات JSON لكل أداة

### VRIO (جديد):
```json
{
  "resources": [
    {
      "name": "البنية التحتية الرقمية",
      "valuable": true,
      "rare": true,
      "imitable": false,
      "organized": true,
      "result": "SUSTAINED_ADVANTAGE"
    }
  ]
}
```

### Blue Ocean (جديد):
```json
{
  "factors": [
    { "name": "السعر", "industry": 8, "company": 3, "action": "REDUCE" },
    { "name": "الجودة", "industry": 6, "company": 9, "action": "RAISE" },
    { "name": "الابتكار", "industry": 3, "company": 8, "action": "CREATE" }
  ],
  "actions": {
    "eliminate": ["عمولات الوسطاء"],
    "reduce": ["فترة الانتظار"],
    "raise": ["تجربة العميل"],
    "create": ["خدمة ذاتية رقمية"]
  }
}
```

### Hoshin Kanri (جديد):
```json
{
  "breakthroughObjectives": [
    {
      "objective": "التحول الرقمي الكامل",
      "annualTargets": [
        { "year": 2026, "target": "رقمنة 50% من العمليات", "owner": "CTO" }
      ],
      "monthlyActions": [
        { "month": "مارس", "action": "تنفيذ ERP", "status": "IN_PROGRESS" }
      ]
    }
  ]
}
```

### Scenario Planning (جديد):
```json
{
  "scenarios": [
    {
      "name": "السيناريو المتفائل",
      "probability": 0.3,
      "description": "نمو اقتصادي + دعم حكومي",
      "impacts": [
        { "area": "الإيرادات", "effect": "+40%", "severity": "POSITIVE" }
      ],
      "actions": ["توسيع الفريق", "فتح أسواق جديدة"]
    }
  ]
}
```

---

## 📅 مراحل التنفيذ

### 🟢 Sprint 1 (3-4 أيام): الأساسيات
1. إضافة `ToolDefinition` + `CompanyAnalysis` للـ Schema
2. تشغيل Migration
3. إنشاء `routes/tools.js` (CRUD + seed)
4. إنشاء Seed script لتعبئة الـ 13 أداة
5. إنشاء صفحة المسار الاستراتيجي (`tools.html`)
6. **اختبار:** التأكد من ظهور 8 أدوات أساسية + إخفاء 5 متقدمة

### 🟡 Sprint 2 (3-4 أيام): ربط الموجود + TOWS + VRIO
1. ربط SWOT الموجود → CompanyAnalysis تلقائياً
2. إضافة TOWS matrix (SO/WO/ST/WT) فوق SWOT
3. بناء VRIO كأداة جديدة بالكامل
4. ربط PESTEL + Porter الموجودين → CompanyAnalysis
5. **اختبار:** إنشاء تحليل SWOT → ظهوره في المسار → إضافة TOWS

### 🔵 Sprint 3 (3-4 أيام): أدوات الاختيار + التنفيذ
1. بناء Blue Ocean (Strategy Canvas + 4 Actions)
2. ربط Ansoff الموجود → CompanyAnalysis
3. بناء Hoshin Kanri (X-Matrix مبسط)
4. ربط BSC/OKRs الموجود → CompanyAnalysis
5. **اختبار:** رحلة كاملة من التشخيص للتنفيذ

### 🟣 Sprint 4 (2-3 أيام): التكيف + المقارنة
1. بناء Scenario Planning
2. إنشاء صفحة المقارنة (Compare Dashboard)
3. إنشاء ملخص تنفيذي يجمع كل الأدوات
4. تفعيل زر "الوضع المتقدم" للأدوات المخفية
5. **اختبار:** مقارنة بين نسختين + تصدير ملخص

---

## ✅ خطة الاختبار

### Unit Tests (لكل أداة):
| # | الاختبار | المدخل | المتوقع |
|---|---------|--------|---------|
| T1 | Seed الأدوات | POST `/api/tools/seed` | 13 أداة في DB |
| T2 | فلتر أساسي | GET `/api/tools?primary=true` | 8 أدوات فقط |
| T3 | فلتر متقدم | GET `/api/tools?primary=false` | 5 أدوات |
| T4 | فلتر بالمرحلة | GET `/api/tools?phase=DIAGNOSIS` | 3 أساسية + 2 متقدمة |
| T5 | إنشاء تحليل VRIO | POST `/api/company-analysis` | status 201 + data JSON |
| T6 | منع تكرار | POST تحليل VRIO لنفس Version | status 409 (conflict) |
| T7 | سحب SWOT | GET `/api/company-analysis/:v/SWOT_TOWS` | بيانات AnalysisPoint |
| T8 | سحب PESTEL | GET `/api/company-analysis/:v/PESTEL` | بيانات ExternalAnalysis |

### Integration Tests (رحلة كاملة):
| # | السيناريو | الخطوات |
|---|----------|---------|
| E1 | رحلة تشخيص | إنشاء Entity → Version → SWOT → PESTEL → VRIO → ملخص التشخيص |
| E2 | رحلة كاملة | التشخيص → اختيار Ansoff → هدف BSC → مبادرة → مراجعة |
| E3 | ربط تلقائي | إضافة AnalysisPoint → التحقق من ظهوره في CompanyAnalysis |
| E4 | مقارنة | إنشاء Version 1 + تحليلات → Version 2 → مقارنة الفروقات |
| E5 | وضع متقدم | تفعيل → ظهور Porter + BCG + 7S → إنشاء تحليل Porter |

### UI Tests (Browser):
| # | الاختبار | التحقق |
|---|---------|--------|
| U1 | صفحة المسار | ظهور 4 مراحل + 8 بطاقات أدوات |
| U2 | الوضع المتقدم | ضغط الزر → ظهور 5 أدوات إضافية |
| U3 | فتح أداة SWOT | عرض 4 أرباع + زر TOWS |
| U4 | إدخال VRIO | إضافة 3 موارد → حساب النتيجة تلقائياً |
| U5 | شريط التقدم | إكمال أداتين → التقدم = 25% |
| U6 | القوائم المنسدلة | dropdown للمرحلة + النوع + الأثر |

---

## 🔗 ملخص الملفات المطلوبة

### ملفات جديدة:
```
prisma/schema.prisma          → إضافة ToolDefinition + CompanyAnalysis
prisma/seed-tools.js          → بذر 13 أداة
routes/tools.js               → APIs الأدوات + التحليلات
public/tools.html             → صفحة المسار الاستراتيجي
public/tool-detail.html       → صفحة تفاصيل أداة واحدة
```

### ملفات معدّلة:
```
server.js                     → إضافة routes جديدة
routes/analysis.js            → إضافة towsStrategy للـ SWOT
public/analysis.html          → إضافة تبويب TOWS
```

---

## 💡 قواعد ذهبية

1. **لا نكسر الموجود** — كل التغييرات additive
2. **JSON مرن** — كل أداة تخزن بياناتها في حقل `data` (JSON)
3. **Unique constraint** — أداة واحدة لكل Version (لا تكرار)
4. **السحب التلقائي** — الأدوات الموجودة تُسحب بياناتها تلقائياً
5. **isPrimary** — الفلتر السحري: `true` = أساسية، `false` = متقدمة
