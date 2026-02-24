# 🐳 Docker Setup للـ PostgreSQL

## البدء السريع

### 1. تشغيل PostgreSQL
```bash
docker-compose up -d postgres
```

### 2. التحقق من حالة Database
```bash
docker-compose ps
docker-compose logs postgres
```

### 3. تشغيل PgAdmin (اختياري)
```bash
docker-compose up -d pgadmin
```
ثم افتح: `http://localhost:5050`
- Email: `admin@stratix.com`
- Password: `admin123`

---

## الانتقال من SQLite إلى PostgreSQL

### الخطوة 1: تحديث .env
```bash
# انسخ .env.example إلى .env
cp .env.example .env

# ثم عدل DATABASE_URL:
DATABASE_URL="postgresql://stratix:stratix123@localhost:5432/stratix_db?schema=public"
```

### الخطوة 2: تحديث schema.prisma
```prisma
datasource db {
  provider = "postgresql"  // بدلاً من sqlite
  url      = env("DATABASE_URL")
}
```

### الخطوة 3: تشغيل Migration
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### الخطوة 4: Seed البيانات
```bash
node scripts/seed.js
```

---

## الأوامر المفيدة

### Docker
```bash
# تشغيل جميع الخدمات
docker-compose up -d

# إيقاف جميع الخدمات
docker-compose down

# حذف البيانات (احذر!)
docker-compose down -v

# عرض Logs
docker-compose logs -f postgres
```

### Prisma
```bash
# إنشاء migration جديد
npx prisma migrate dev --name migration_name

# تطبيق migrations على production
npx prisma migrate deploy

# فتح Prisma Studio
npx prisma studio
```

### Database
```bash
# الدخول لـ PostgreSQL CLI
docker exec -it stratix-postgres psql -U stratix -d stratix_db

# عمل Backup
docker exec stratix-postgres pg_dump -U stratix stratix_db > backup.sql

# استعادة Backup
docker exec -i stratix-postgres psql -U stratix stratix_db < backup.sql
```

---

## المتغيرات البيئية

يمكنك تخصيص الإعدادات في ملف `.env`:

```env
# Database
POSTGRES_USER=stratix
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=stratix_db
POSTGRES_PORT=5432

# PgAdmin
PGADMIN_EMAIL=admin@stratix.com
PGADMIN_PASSWORD=your_admin_password
PGADMIN_PORT=5050
```

---

## استكشاف الأخطاء

### المشكلة: Port 5432 مستخدم بالفعل
```bash
# تحقق من العمليات المستخدمة للـ port
lsof -i :5432

# أو غير الـ port في .env
POSTGRES_PORT=5433
```

### المشكلة: Cannot connect to database
```bash
# تحقق من حالة Container
docker-compose ps

# تحقق من Logs
docker-compose logs postgres

# أعد تشغيل الخدمة
docker-compose restart postgres
```

---

## Production Deployment

للنشر على Production:

1. استخدم PostgreSQL مدار (AWS RDS, Digital Ocean, etc.)
2. لا تستخدم Docker للـ production database
3. احفظ `DATABASE_URL` في متغيرات البيئة على السيرفر
4. استخدم SSL connections:
```
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&sslmode=require"
```

---

## الفوائد من PostgreSQL

✅ **أداء أفضل** - خاصة للقراءات والكتابات المتزامنة
✅ **Scalability** - دعم ملايين السجلات
✅ **Advanced Features** - Full-text search, JSON support, transactions
✅ **Production Ready** - مستخدم في أكبر الشركات
✅ **Backup & Replication** - أدوات احترافية للنسخ الاحتياطي
