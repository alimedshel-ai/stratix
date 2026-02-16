# مقارنة الـ Schema - التصميم الحالي vs التصميم الجديد

## 🔴 الفروقات الرئيسية

| الميزة | التصميم الحالي | التصميم الجديد |
|-------|-------------|-------------|
| **قاعدة البيانات** | SQLite | PostgreSQL |
| **Roles** | SUPER_ADMIN, ENTITY_ADMIN, STRATEGY_MANAGER, VIEWER | OWNER, ADMIN, EDITOR, VIEWER |
| **العلاقة User-Entity** | مباشرة (userId في Entity) | عبر Member model |
| **شجرة التصنيف** | Sector → Industry → Entity | Sector + Industry + EntityType (منفصلة) |
| **التصنيفات** | ثابتة في كود البيانات | Reference tables (ref_sectors, ref_industries) |
| **Strategy Tracking** | StrategyVersion مع Pivot | StrategyVersion مع Linked List pivot tracking |
| **Division/Department** | إلغاء الـ Department layer | لا يوجد Department (مباشر) |
| **Audit Log** | غير موجود | موجود (تتبع الإجراءات) |

---

## 📊 مقارنة Models

### التصميم الحالي:
```
User (4 records)
  ├─ Entity (2 records)
  │   └─ Industry (2 records)
  │       └─ Sector (1 record)
  ├─ StrategyVersion
  │   ├─ StrategicObjective
  │   ├─ KPI
  │   ├─ StrategicInitiative
  │   └─ StrategicReview
  └─ Assessment
      ├─ Dimension
      └─ Criterion
```

### التصميم الجديد:
```
User (بدون Entity مباشر)
  └─ Member (ربط عبر Member model)
      └─ Entity
          ├─ Sector (reference table)
          ├─ Industry (reference table)
          └─ EntityType (reference table)

Entity
  └─ StrategyVersion
      └─ pivotedFrom (Linked List للتتبع التاريخي)

AuditLog (تتبع الإجراءات)
  ├─ Entity
  └─ User
```

---

## 🔑 الفروقات الرئيسية

### 1️⃣ **نموذج الأدوار (Roles)**

**الحالي:**
```prisma
enum UserRole {
  SUPER_ADMIN
  ENTITY_ADMIN
  STRATEGY_MANAGER
  VIEWER
}
```

**الجديد:**
```prisma
enum Role {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}
```

### 2️⃣ **العلاقة بين User و Entity**

**الحالي:**
```prisma
model User {
  id       String
  entityId String  // مباشر
  entity   Entity  @relation(...)
}
```

**الجديد:**
```prisma
model User {
  id          String
  memberships Member[]  // عبر Member model
}

model Member {
  id       String
  userId   String
  entityId String
  role     Role
  user     User     @relation(...)
  entity   Entity   @relation(...)
}
```

### 3️⃣ **شجرة التصنيف**

**الحالي:**
```prisma
Sector (1)
  ├─ Industry (2)
      └─ Entity (2)
```

**الجديد:**
```prisma
// Reference tables منفصلة
Sector     // حكومي، خاص، غير ربحي
Industry   // صحي، تعليمي، صناعي
EntityType // مستشفى، وزارة، جمعية

Entity
  ├─ sectorId (اختياري)
  ├─ industryId (اختياري)
  └─ typeId (اختياري)
```

### 4️⃣ **Audit Log**

**الحالي:** لا يوجد

**الجديد:**
```prisma
model AuditLog {
  id        String
  entityId  String
  userId    String
  action    String      // 'STRATEGY_PIVOT', 'ENTITY_UPDATE'
  details   String?
  oldData   Json?
  newData   Json?
  createdAt DateTime
}
```

### 5️⃣ **Strategy Version Tracking**

**الحالي:**
```prisma
model StrategyVersion {
  id        String
  entityId  String
  versionNumber Int
  // لا توجد تتبع Pivot
}
```

**الجديد:**
```prisma
model StrategyVersion {
  id            String
  entityId      String
  versionNumber Int
  pivotedFromId String?      // ربط مع النسخة السابقة
  prevVersion   StrategyVersion? @relation("VersionLineage", ...)
  nextVersion   StrategyVersion? @relation("VersionLineage")
  // Linked List في التتبع التاريخي
}
```

---

## ✅ نقاط القوة في التصميم الجديد

1. **Flexibility أكثر** - Reference tables منفصلة تسمح بتنوع البيانات
2. **Audit Trail** - تتبع شامل لجميع الإجراءات
3. **Scalability** - دعم PostgreSQL بدل SQLite
4. **Better Pivot Tracking** - Linked List لفهم سلسلة التطور
5. **Proper Multi-Tenancy** - Member model يسمح بمستخدم واحد في عدة entities

---

## ⚠️ الخسائر في التصميم الجديد

1. **لا توجد Strategic Models** - لا Objectives, KPIs, Initiatives, Reviews
2. **لا توجد Assessment Models** - لا Dimensions, Criteria
3. **لا توجد الحقول المتخصصة** - مثل actual/target للـ KPIs

---

## 🤔 ماذا تريد؟

اختر واحد:

### Option A: الاستمرار بالتصميم الحالي
- الحفاظ على
: SQLite + Prisma
- الاستمرار بـ Strategic Models و Assessment Models
- تحديث الـ Roles ليطابق الجديد (اختياري)

### Option B: الانتقال للتصميم الجديد
- تحويل قاعدة البيانات من SQLite ← PostgreSQL
- إعادة هيكلة User-Entity relations عبر Member model
- إضافة Audit Log tracking
- **لكن** ستحتاج لإضافة Strategy Models و Assessment Models إليه

### Option C: دمج الاثنين
- استخدام الاساس الجديد (Sector, Industry, EntityType, Member, Audit Log)
- إضافة Strategic Models و Assessment Models عليه
- تحسين Pivot Tracking

---

**ما رأيك؟**
