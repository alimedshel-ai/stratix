---
description: إجراءات التنقل بين المنشآت لمديري الإدارات (Context Switching for DEPT_MANAGER)
---

# التنقل بين المنشآت — إجراءات مدير الإدارة

## المتطلبات الأساسية
- المستخدم نوعه `DEPT_MANAGER` (مدير إدارة: موارد بشرية، مالية، عمليات...)
- المستخدم مسجل كـ `Member` في أكثر من كيان (منشأة)
- لكل كيان: `departmentRole` محدد في جدول `Member` (مثال: CHRO لـ HR)

## آلية العمل (Flow)

### ١. عرض قائمة المنشآت
1. عند تحميل الـ sidebar، يُجلب `/api/auth/my-entities` تلقائيًا عند أول ضغط على زر "منشأتي"
2. إذا كان لديه **منشأة واحدة فقط** → يُخفى الـ chevron ولا تُفتح قائمة
3. إذا كان لديه **منشأتان أو أكثر** → تظهر القائمة بأسماء المنشآت مع علامة ✅ للمنشأة الحالية

### ٢. التبديل إلى منشأة أخرى
```
المستخدم يضغط على المنشأة في القائمة
   ↓
POST /api/auth/switch-entity { entityId }
   ↓
السيرفر يتحقق من وجود Membership
   ↓
يولّد JWT جديد يحتوي:
  - entityId الجديد
  - role + userType المحددَين في الـ Membership
  - userCategory من User model
  - deptCode مستنتج من departmentRole (CHRO→hr, CFO→finance...)
   ↓
يحدّث الـ HttpOnly Cookie بالـ token الجديد
   ↓
الـ Client يستلم { user: { userType, deptCode } } في الـ response
   ↓
التوجيه الذكي:
  - DEPT_MANAGER + deptCode → /dept-dashboard.html?dept={deptCode}
  - BOARD_VIEWER           → /board-dashboard.html
  - غير ذلك               → /dashboard.html
```

### ٣. خريطة departmentRole → deptCode
| departmentRole | صفحة الوجهة |
|---------------|-------------|
| CHRO          | `/dept-dashboard.html?dept=hr` |
| CFO           | `/dept-dashboard.html?dept=finance` |
| CMO           | `/dept-dashboard.html?dept=marketing` |
| COO           | `/dept-dashboard.html?dept=operations` |
| CTO           | `/dept-dashboard.html?dept=tech` |
| CSO           | `/dept-dashboard.html?dept=sales` |
| CCO           | `/dept-dashboard.html?dept=cs` |
| CLO           | `/dept-dashboard.html?dept=legal` |

## إضافة مستخدم لعدة منشآت (Setup)
لكي يتمكن مدير الإدارة من التنقل بين المنشآت، يجب:
1. إنشاء `Member` record لكل منشأة مع:
   - `userType: 'DEPT_MANAGER'`
   - `departmentRole: 'CHRO'` (أو الدور المناسب)
2. التأكد أن كل `Entity` مرتبط بـ `Company` نشطة (ليس `SUSPENDED`)

## التصميم البصري
- زر "منشأتي" يظهر **تحت اسم المستخدم مباشرة** في الـ sidebar
- لمدير الموارد البشرية: يُضاف **badge** باللون الأخضر (#10b981) يوضح إدارته
- الـ chevron يظهر فقط إذا كان عنده أكثر من منشأة واحدة
- عند التبديل: optimistic UI — اسم المنشأة يتغير فورًا قبل إعادة التحميل

## قواعد الأمان
- `switch-entity` يتطلب وجود `Member` record مطابق (userId + entityId)
- SUPER_ADMIN فقط يستطيع التبديل لأي كيان بدون membership
- الـ Cookie: `HttpOnly` + `Secure` + `SameSite: strict`
- لا يُكتب شيء في `localStorage` — النظام يعتمد على Cookie حصرًا

## ملاحظات التطوير المستقبلي
- [ ] إضافة `userCategory` كحقل في `Member` model لاستقلالية أكبر
- [ ] دعم تبديل الإدارة (dept switching) داخل نفس المنشأة
- [ ] إشعار عبر email عند إضافة مستخدم لمنشأة جديدة
