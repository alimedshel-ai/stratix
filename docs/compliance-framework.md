# الإطار التنظيمي الشامل — تصنيف الكيانات والقطاعات والامتثال
> مرجع لربطه بـ MAT_BASE + Phase 6 (الامتثال) + Onboarding Wizard
> آخر تحديث: 2026-03-04

---

## المستوى الأول: تحديد طبيعة الكيان (Entity Classification)

| الكود | النوع | التعريف | الأنظمة المطبقة |
|-------|-------|---------|-----------------|
| **G** | **حكومي** | وزارات، هيئات، أمانات | نظام المنافسات، اللائحة المالية |
| **P** | **ربحي خاص** | شركات، مؤسسات، تضامنيات | نظام الشركات، الزكاة، الضريبة |
| **N** | **غير ربحي** | جمعيات، مؤسسات أهلية | نظام الجمعيات، لائحة حوكمة الجمعيات |
| **M** | **مختلط** | شركات حكومية/خاصة | حسب طبيعة النشاط الأغلب |

---

## المستوى الثاني: القطاع الاقتصادي (ISIC4) + الامتثال المخصص

| القطاع | الكود ISIC | الامتثال الإضافي المطلوب | الجهة المنظمة |
|--------|-----------|------------------------|--------------|
| **الزراعة والحراجة** | A | تراخيص بيئية، رقابة صحية | وزارة البيئة، SFDA |
| **التعدين** | B | تصاريح تعدين، تقييم بيئي | وزارة الصناعة والثروة المعدنية |
| **الصناعة التحويلية** | C | تراخيص صناعية، معايير SASO | الهيئة السعودية للمواصفات |
| **إمدادات الكهرباء** | D | تراخيص تشغيل، معايير أمنية | هيئة تنظيم الكهرباء |
| **الإنشاءات** | F | تأمين عمال، رخص بناء | وزارة الشؤون البلدية |
| **التجارة** | G | تراخيص تجارية، حماية مستهلك | وزارة التجارة |
| **النقل والتخزين** | H | تراخيص نقل، تأمين مركبات | وزارة النقل والخدمات اللوجستية |
| **الإقامة والطعام** | I | رخص صحية، تراخيص سياحية | الهيئة السياحية، البلدية |
| **الاتصالات والمعلومات** | J | **امتثال تقني مكثف (ECC)** | هيئة الاتصالات، NCA |
| **الأنشطة المالية** | K | **رقابة مالية مشددة** | البنك المركزي، هيئة السوق المالية |
| **الأنشطة العقارية** | L | تسجيل عقاري، رخص تطوير | وزارة العدل، البلدية |
| **الأنشطة المهنية** | M | تراخيص مزاولة مهنة | الهيئات المهنية (SOCPA، إلخ) |
| **الإدارة العامة** | O | امتثال حكومي داخلي | وزارة المالية |
| **التعليم** | P | اعتماد أكاديمي، رقابة نوعية | وزارة التعليم |
| **الصحة** | Q | **تراخيص صحية، CBAHI** | وزارة الصحة، الهيئة الصحية |
| **الفنون** | R | رخص محتوى، حقوق ملكية | وزارة الثقافة |

---

## المستوى الثالث: حجم المنشأة + متطلبات الامتثال

```json
{
  "size_classification": {
    "micro": {
      "employees": "1-4",
      "revenue": "< 3M SAR",
      "compliance_scope": "basic",
      "exemptions": ["audit_committee", "risk_committee", "external_audit"],
      "estimated_cost": "20,000 - 50,000 SAR/year"
    },
    "small": {
      "employees": "5-49",
      "revenue": "3M-40M SAR",
      "compliance_scope": "standard",
      "exemptions": ["audit_committee", "dpo_required"],
      "estimated_cost": "50,000 - 150,000 SAR/year"
    },
    "medium": {
      "employees": "50-249",
      "revenue": "40M-200M SAR",
      "compliance_scope": "full",
      "exemptions": [],
      "estimated_cost": "150,000 - 500,000 SAR/year"
    },
    "large": {
      "employees": "250+",
      "revenue": "> 200M SAR",
      "compliance_scope": "enhanced",
      "additional_requirements": ["ecc_certification", "cyber_insurance", "penetration_testing"],
      "estimated_cost": "500,000 - 2,000,000 SAR/year"
    }
  }
}
```

---

## ربط التصنيف بالـ Compliance Framework

### مثال: شركة تقنية مالية (Fintech) - كيان ربحي - قطاع J - حجم متوسط

```json
{
  "entity_profile": {
    "legal_type": "P",
    "sector_isic": "J620",
    "sub_sector": "fintech",
    "size": "medium",
    "risk_level": "high"
  },
  
  "compliance_matrix": {
    "financial": {
      "required": ["zakat_filing", "vat_filing", "gosi_contribution", "wage_protection"],
      "additional": ["sama_compliance", "aml_policy"],
      "frequency": "quarterly",
      "estimated_cost": "80,000 SAR"
    },
    "administrative": {
      "required": ["cr_renewal", "chamber_membership", "qiwa_subscription"],
      "additional": ["sama_license_renewal"],
      "frequency": "annual",
      "estimated_cost": "40,000 SAR"
    },
    "technical_cyber": {
      "required": ["pdpl_compliance", "dpo_appointment", "pia_assessment"],
      "additional": ["sama_cybersecurity", "ecc_certification", "penetration_testing"],
      "frequency": "continuous",
      "estimated_cost": "200,000 SAR"
    },
    "governance": {
      "required": ["org_structure", "policy_manual", "approval_matrix"],
      "additional": ["risk_committee", "compliance_committee"],
      "frequency": "quarterly",
      "estimated_cost": "100,000 SAR"
    }
  },
  
  "total_estimated_cost": "420,000 SAR/year",
  "critical_gaps": ["sama_license", "dpo_appointment"],
  "next_deadline": "2026-03-15"
}
```

---

## جدول الربط الكامل (Mapping Table)

| النشاط التفصيلي (ISIC4) | القطاع | الحجم | الامتثال المالي | الامتثال الإداري | الامتثال التقني | الحوكمة | التكلفة التقديرية |
|------------------------|--------|-------|----------------|-----------------|----------------|---------|------------------|
| **زراعة القمح (011101)** | A | صغير | زكاة، ضريبة | رخص بلدية، تراخيص بيئية | - | أساسي | 30,000 ﷼ |
| **صناعة أغذية (107111)** | C | متوسط | زكاة، ضريبة، GOSI | رخص صناعية، SASO | PDPL | متوسط | 150,000 ﷼ |
| **تجارة تجزئة (471111)** | G | صغير | زكاة، ضريبة | سجل تجاري، بلدية | - | أساسي | 40,000 ﷼ |
| **برمجة حاسب (620101)** | J | متوسط | زكاة، ضريبة، GOSI | سجل تجاري | **ECC، DPO، PIA** | متكامل | 300,000 ﷼ |
| **أنشطة مالية (641911)** | K | كبير | **رقابة SAMA** | تراخيص مالية | **ECC، اختبار اختراق** | متكامل | 800,000 ﷼ |
| **أنشطة صحية (861011)** | Q | متوسط | زكاة، ضريبة، GOSI | تراخيص صحية، CBAHI | حماية بيانات صحية | متوسط | 200,000 ﷼ |
| **تعليم خاص (852011)** | P | صغير | زكاة، ضريبة | اعتماد تعليمي | حماية بيانات الطلاب | أساسي | 60,000 ﷼ |
| **جمعية خيرية (949911)** | N | صغير | إعفاء زكاة | ترخيص جمعية | حماية بيانات المتبرعين | حوكمة جمعيات | 25,000 ﷼ |

---

## استبيان دخول المستفيد (Onboarding Wizard)

```javascript
const onboardingSteps = [
  {
    step: 1,
    question: "ما طبيعة الكيان؟",
    options: [
      {code: "G", label: "حكومي", next: "government_details"},
      {code: "P", label: "ربحي خاص", next: "commercial_details"},
      {code: "N", label: "غير ربحي", next: "nonprofit_details"}
    ]
  },
  {
    step: 2,
    question: "ما النشاط الاقتصادي الرئيسي؟",
    api: "fetch_isic_sectors",
    filter: "selected_entity_type"
  },
  {
    step: 3,
    question: "ما حجم المنشأة؟",
    options: [
      {code: "micro", label: "صغيرة جداً (1-4 موظفين)"},
      {code: "small", label: "صغيرة (5-49)"},
      {code: "medium", label: "متوسطة (50-249)"},
      {code: "large", label: "كبيرة (250+)"}
    ]
  },
  {
    step: 4,
    question: "هل لديك أنشطة خاصة؟",
    options: [
      {code: "fintech", label: "تقنية مالية"},
      {code: "healthcare", label: "خدمات صحية"},
      {code: "education", label: "تعليم"},
      {code: "industrial", label: "صناعي"},
      {code: "none", label: "لا شيء مما سبق"}
    ]
  }
];
```

---

## محرك التوصية (Recommendation Engine)

```python
def generate_compliance_plan(entity_type, sector, size, special_activities):
    base_requirements = get_base_requirements(entity_type, size)
    sector_requirements = get_sector_requirements(sector)
    special_requirements = get_special_requirements(special_activities)
    
    all_requirements = merge_requirements(
        base_requirements, 
        sector_requirements, 
        special_requirements
    )
    
    cost_estimate = calculate_cost(all_requirements, size)
    timeline = generate_timeline(all_requirements)
    risk_score = calculate_risk_score(all_requirements)
    
    return {
        "requirements": all_requirements,
        "estimated_cost": cost_estimate,
        "implementation_timeline": timeline,
        "risk_level": risk_score,
        "priority_actions": get_priority_actions(all_requirements)
    }
```

---

## API التكامل مع الجهات الحكومية (مستقبلي)

```javascript
const validationAPIs = {
  validateCR: async (crNumber) => {
    // التحقق من السجل التجاري
    const response = await fetch(`/api/mci/validate/${crNumber}`);
    return {
      isValid: response.status === 'active',
      expiryDate: response.expiry_date,
      activities: response.isic_codes,
      owner: response.owner_name
    };
  },
  validateTax: async (tin) => {
    // التحقق من حالة الزكاة والضريبة
    const response = await fetch(`/api/zatca/status/${tin}`);
    return {
      filingsUpToDate: response.compliant,
      penalties: response.penalties,
      nextFiling: response.next_due_date
    };
  },
  validateSaudization: async (establishmentId) => {
    // التحقق من التوطين (نطاقات)
    const response = await fetch(`/api/qiwa/saudization/${establishmentId}`);
    return {
      nitaqatLevel: response.level,
      complianceRate: response.percentage,
      violations: response.violations
    };
  }
};
```

---

## ملخص الأرقام

| البيان | القيمة |
|--------|--------|
| إجمالي التصنيفات الرئيسية | 21 قطاع (ISIC4) |
| الأنشطة التفصيلية | 2,753 نشاط |
| أنواع الكيانات القانونية | 4 أنواع |
| أحجام المنشآت | 4 فئات |
| متطلبات الامتثال الأساسية | 30+ بند |
| متطلبات الامتثال الخاصة بالقطاع | 20+ بند |
| إجمالي التكاليف (متوسط) | 50,000 - 800,000 ﷼/سنة |

---

## نقاط الربط مع المنصة

```
diagnostic-center.html → MAT_BASE: يستخدم entity + sector + size لتحديد البنود
diagnostic-center.html → SECTOR_ITEMS: يُحمّل البنود القطاعية حسب ISIC
diagnostic-center.html → prepareMAT(): يبني المصفوفة الديناميكية
Phase 6 (dept-deep) → القسم 1: يعرض تكلفة الامتثال التقديرية حسب الحجم+القطاع
Phase 6 (dept-deep) → القسم 5: المخاطر من جدول الغرامات (gov-fees.md)
Dashboard → تنبيهات: المواعيد + الجهات المنظمة
مستقبلاً → API: ربط مع الجهات للتحقق التلقائي
```
