# 📦 دليل الانتقال من SQLite إلى PostgreSQL

## ⚠️ قبل البدء

هذا المشروع حالياً يستخدم **SQLite**. إذا كنت تريد الانتقال لـ **PostgreSQL** (موصى به للإنتاج)، اتبع هذه الخطوات.

---

## 🎯 متى تحتاج للانتقال؟

✅ **ابق مع SQLite إذا:**
- لا تزال في مرحلة التطوير
- تطبيق صغير (< 1000 مستخدم)
- لا تحتاج لـ concurrent writes كثيرة

✅ **انتقل لـ PostgreSQL إذا:**
- جاهز للنشر في Production
- تحتاج scalability أكبر
- تحتاج advanced features (Full-text search, JSON queries, etc.)
- تتوقع أكثر من 1000 مستخدم متزامن

---

## 📋 خطوات الانتقال

### 1️⃣ تشغيل PostgreSQL

**باستخدام Docker (موصى به):**
```bash
docker-compose up -d postgres
```

**أو باستخدام PostgreSQL محلي:**
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt install postgresql
sudo systemctl start postgresql
```

---

### 2️⃣ تحديث .env

انسخ `.env.example` وعدّل المتغيرات:

```bash
cp .env.example .env
```

في `.env`:
```env
# عطّل SQLite
# DATABASE_URL="file:./dev.db"

# فعّل PostgreSQL
DATABASE_URL="postgresql://stratix:stratix123@localhost:5432/stratix_db?schema=public"
```

---

### 3️⃣ تحديث schema.prisma

في [prisma/schema.prisma](prisma/schema.prisma#L11-L14):

```prisma
datasource db {
  provider = "postgresql"  // بدلاً من "sqlite"
  url      = env("DATABASE_URL")
}
```

---

### 4️⃣ عمل Migration

```bash
# حذف migrations القديمة (SQLite)
rm -rf prisma/migrations

# إنشاء migration جديد للـ PostgreSQL
npx prisma migrate dev --name init

# توليد Prisma Client
npx prisma generate
```

---

### 5️⃣ نقل البيانات (اختياري)

إذا كان لديك بيانات في SQLite وتريد نقلها:

**الطريقة 1: Export/Import يدوي**
```bash
# 1. Export البيانات من SQLite
sqlite3 prisma/dev.db .dump > data_export.sql

# 2. حوّل SQL من SQLite إلى PostgreSQL format
# (تحتاج تعديل يدوي للـ syntax differences)

# 3. Import للـ PostgreSQL
psql -h localhost -U stratix -d stratix_db < data_export_pg.sql
```

**الطريقة 2: Seed Script**
```bash
# استخدم seed script الموجود
node scripts/seed.js
```

---

### 6️⃣ اختبار التطبيق

```bash
# أعد تشغيل السيرفر
npm run dev

# تحقق من الاتصال بقاعدة البيانات
# يجب أن يعمل كل شيء بنفس الطريقة
```

---

## 🔄 التراجع للـ SQLite

إذا واجهت مشاكل وتريد العودة:

### 1. أعد تفعيل SQLite في .env
```env
DATABASE_URL="file:./dev.db"
```

### 2. أعد تفعيل SQLite في schema.prisma
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### 3. أعد توليد Prisma Client
```bash
npx prisma generate
npx prisma db push
```

---

## 📊 الفروقات الرئيسية

| الميزة | SQLite | PostgreSQL |
|--------|--------|------------|
| **نوع الملف** | ملف واحد `dev.db` | Server منفصل |
| **Concurrent Writes** | محدود | ممتاز |
| **حجم البيانات** | < 1 GB | Unlimited |
| **Full-text Search** | محدود | ممتاز |
| **JSON Support** | محدود | Native |
| **Deployment** | سهل | يحتاج setup |
| **Production** | ❌ غير موصى به | ✅ موصى به |

---

## 🛠️ التعديلات المطلوبة في الكود

**الخبر السار:** لا تحتاج تغيير أي كود!

Prisma يتعامل مع الفروقات تلقائياً. فقط:
1. غيّر `provider` في schema.prisma
2. غيّر `DATABASE_URL` في .env
3. شغّل `npx prisma migrate dev`

**كل شيء آخر يعمل بنفس الطريقة!** 🎉

---

## 📝 ملاحظات مهمة

### Types الخاصة بـ PostgreSQL

بعد الانتقال لـ PostgreSQL، يمكنك استخدام ميزات إضافية:

```prisma
model Example {
  id       String   @id @default(uuid())  // UUIDs بدلاً من cuid()
  data     Json     // JSON أفضل في PostgreSQL
  tags     String[] // Arrays (غير متوفر في SQLite)
}
```

### Enums

PostgreSQL يدعم Enums مباشرة:

```prisma
enum UserRole {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}

model Member {
  role UserRole  // بدلاً من String
}
```

---

## ✅ Checklist

- [ ] قرأت الدليل كاملاً
- [ ] شغّلت PostgreSQL (Docker أو محلي)
- [ ] حدّثت .env
- [ ] حدّثت schema.prisma
- [ ] حذفت migrations القديمة
- [ ] شغّلت `npx prisma migrate dev --name init`
- [ ] شغّلت seed script
- [ ] اختبرت التطبيق
- [ ] كل APIs تعمل بشكل صحيح

---

**بالتوفيق!** 🚀
