# 📋 دليل قواعد محرك التنبيهات (Alert Engine Rules)

**النظام:** Startix Strategic OS  
**الملف:** `routes/alert-engine.js`  
**آخر تحديث:** 17 فبراير 2026

---

## 🔍 نظرة عامة

محرك التنبيهات يقوم بـ **فحص تلقائي** لجميع الكيانات ويولّد تنبيهات بناءً على قواعد محددة.  
يعمل عبر: `POST /api/alert-engine/scan`

---

## ⚙️ قواعد التنبيه (Trigger Rules)

### 1. 📊 مؤشرات الأداء (KPI Alerts)

| القاعدة | الشرط | نوع التنبيه | الشدة | الإجراء التلقائي |
|---------|-------|------------|-------|-----------------|
| أداء حرج | `actual/target ≤ criticalThreshold` (افتراضي: 0.50) | `KPI_CRITICAL` | 🔴 CRITICAL | تحديث KPI → OFF_TRACK |
| أداء ضعيف | `actual/target ≤ warningThreshold` (افتراضي: 0.75) | `KPI_WARNING` | 🟡 WARNING | تحديث KPI → AT_RISK |
| تجاهل | `actual/target ≥ 0.90` | — | — | لا شيء (مؤشر صحي) |

**شروط التخطي:**
- KPI بدون `target` أو `actual` → يُتجاهل
- `target = 0` → يُتجاهل (تجنب القسمة على صفر)
- تنبيه موجود (مكرر) خلال آخر 7 أيام → يُتجاهل

**العتبات:**
- `warningThreshold`: قابلة للتعديل لكل KPI (حقل في قاعدة البيانات)
- `criticalThreshold`: قابلة للتعديل لكل KPI (حقل في قاعدة البيانات)
- القيم الافتراضية: warning = 0.75 (75%)، critical = 0.50 (50%)

### 🔄 الحلقة المغلقة (Closed Loop):
عند اكتشاف KPI حرج ومرتبط بهدف استراتيجي:
- تحديث حالة الهدف المرتبط → **AT_RISK** (إذا لم يكن OFF_TRACK بالفعل)
- تسجيل الإجراء في `closedLoopActions`

---

### 2. ⏰ تأخر المبادرات (Initiative Delays)

| القاعدة | الشرط | نوع التنبيه | الشدة |
|---------|-------|------------|-------|
| تأخر خطير | `endDate < now` + تأخر > 30 يوم | `INITIATIVE_DELAYED` | 🔴 CRITICAL |
| تأخر عادي | `endDate < now` + تأخر ≤ 30 يوم | `INITIATIVE_DELAYED` | 🟡 WARNING |

**شروط التخطي:**
- المبادرة بحالة `COMPLETED` أو `CANCELLED` → يُتجاهل
- لا يوجد `endDate` → يُتجاهل
- `endDate` في المستقبل → يُتجاهل
- تنبيه مكرر خلال 7 أيام → يُتجاهل

### 🔄 الحلقة المغلقة:
عند تأخر مبادرة > 30 يوم:
- تصعيد احتمالية المخاطر المفتوحة (+1 لـ `probabilityScore`، حد أقصى 5)
- خطر واحد فقط يُصعّد لكل مبادرة متأخرة

---

### 3. 📋 تأخر المراجعات (Review Overdue)

| القاعدة | الشرط | نوع التنبيه | الشدة |
|---------|-------|------------|-------|
| تأخر خطير | لا مراجعة لأكثر من 180 يوم | `REVIEW_OVERDUE` | 🔴 CRITICAL |
| تأخر عادي | لا مراجعة لأكثر من 90 يوم | `REVIEW_OVERDUE` | 🟡 WARNING |

**شروط التخطي:**
- تنبيه مكرر خلال 14 يوم → يُتجاهل
- آخر مراجعة خلال 90 يوم → لا تنبيه

---

### 4. 🚨 مخاطر عالية (High Risks)

| القاعدة | الشرط | نوع التنبيه | الشدة |
|---------|-------|------------|-------|
| خطر حرج | `riskScore ≥ 20` | `RISK_HIGH` | 🔴 CRITICAL |
| خطر مرتفع | `15 ≤ riskScore < 20` | `RISK_HIGH` | 🟡 WARNING |

**حساب درجة الخطر:**
```
riskScore = probabilityScore × impactScore
```
- `probabilityScore`: 1-5 (الافتراضي: 3)
- `impactScore`: 1-5 (الافتراضي: 3)
- الحد الأقصى: 25 (5×5)

**شروط التخطي:**
- المخاطر بحالة `MITIGATED` أو `CLOSED` → يُتجاهل
- `riskScore < 15` → يُتجاهل
- تنبيه مكرر خلال 14 يوم → يُتجاهل

---

## 🔄 نموذج الحلقة المغلقة (Closed Loop Model)

```
اكتشاف ← تنبيه ← إجراء تصحيحي تلقائي
   ↓         ↓              ↓
   KPI    تنبيه     تحديث حالة الهدف
   أقل    للمدير        المرتبط
   من                     ↓
   50%              الهدف → AT_RISK

مبادرة    تنبيه     تصعيد احتمالية
متأخرة   للفريق        المخاطر
> 30                     ↓
يوم              probabilityScore + 1
```

---

## 📊 مخرجات الفحص (Scan Output)

```json
{
  "message": "تم فحص 2 كيان وتوليد 3 تنبيه + 1 إجراء تصحيحي تلقائي",
  "scanned": 2,
  "alertsGenerated": 3,
  "cascadingActions": 1,
  "breakdown": {
    "kpiWarnings": 0,
    "kpiCritical": 1,
    "initiativeDelayed": 1,
    "reviewOverdue": 0,
    "riskHigh": 1,
    "healthLow": 0
  },
  "closedLoopActions": [
    {
      "type": "OBJECTIVE_STATUS_UPDATE",
      "action": "تحديث حالة الهدف \"تحسين جودة الخدمات\" إلى تحت المراقبة",
      "reason": "مؤشر \"رضا العملاء\" في وضع حرج (45.0%)",
      "objectiveId": "...",
      "kpiId": "..."
    }
  ]
}
```

---

## 🧠 التوصيات الذكية (Recommendations Engine)

**المسار:** `POST /api/alert-engine/recommendations/:entityId`

### قواعد التوصيات:

| القاعدة | المدخل | المخرج |
|---------|--------|--------|
| KPI ضعيف + نقطة ضعف | KPIs بحالة AT_RISK/OFF_TRACK + WEAKNESS | "يجب تعديل المبادرات أو تخصيص موارد" |
| فرصة عالية | OPPORTUNITY بأثر HIGH | "يُنصح بإنشاء مبادرة لاستغلالها" |
| قرار استراتيجي | نسبة KPIs الضعيفة | CONTINUE (<25%) / ADJUST (25-50%) / PIVOT (>50%) |

---

## 🗂️ أنواع التنبيهات (Alert Types Reference)

| النوع | الوصف | referenceType |
|-------|-------|--------------|
| `KPI_WARNING` | مؤشر أداء تحت المتوقع | KPI |
| `KPI_CRITICAL` | مؤشر أداء في وضع حرج | KPI |
| `INITIATIVE_DELAYED` | مبادرة تجاوزت موعدها | INITIATIVE |
| `REVIEW_OVERDUE` | لم يتم إجراء مراجعة | REVIEW |
| `RISK_HIGH` | خطر بدرجة عالية | RISK |
| `HEALTH_LOW` | صحة الكيان منخفضة | ENTITY |

---

## 🔒 حماية من التكرار (Duplicate Protection)

| نوع التنبيه | فترة حماية التكرار |
|------------|-------------------|
| KPI (warning/critical) | 7 أيام |
| Initiative delayed | 7 أيام |
| Review overdue | 14 يوم |
| Risk high | 14 يوم |
