## TODO: إصلاح صفحة dept-smart الكبيرة (2415 سطر)

### المشاكل المكتشفة:
1. تحفظ بـ POST /api/dept-smart — الـ route غير موجود
2. تقرأ من localStorage فقط (restoreState)
3. لا تحمّل بيانات من API عند الفتح
4. موجودة في main لكن ليست في الـ worktree 
5. تعترض fetch لـ /api/auth/me للعمل بـ standalone mode

### الحل المقترح (للجلسة القادمة):
- ربطها بـ dept-data.js والبيانات المركزية.
- إنشاء POST /api/dept-smart route أو توجيهها للـ Unified Tables.
- إضافة GET للتحميل الأولي.
- الاحتفاظ بـ localStorage كـ fallback (مخزن احتياطي) فقط.
- إزالة عملية التشويش (fetch interception) بعد إتمام الربط الصحيح بالـ Context.
