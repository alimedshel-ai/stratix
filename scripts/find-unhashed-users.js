const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUsersWithPasswordIssues() {
    try {
        console.log('🔍 جاري فحص قاعدة البيانات للبحث عن كلمات المرور غير المشفرة...');

        // جلب جميع المستخدمين
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, password: true }
        });

        const affectedUsers = [];
        // نمط التشفير القياسي لـ bcrypt يبدأ بـ $2a$, $2b$, أو $2y$ ويكون طوله 60 حرف
        const bcryptPattern = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

        for (const user of users) {
            // إذا لم يكن هناك كلمة مرور، أو لا تتطابق مع نمط التشفير المعتمد
            if (!user.password || !bcryptPattern.test(user.password)) {
                affectedUsers.push(user);
            }
        }

        console.log('\n===============================================================');
        console.log(`⚠️  تم العثور على ${affectedUsers.length} مستخدم لديهم مشكلة في كلمة المرور`);
        console.log('===============================================================\n');

        affectedUsers.forEach((u, index) => {
            console.log(`${index + 1}. الاسم: ${u.name}`);
            console.log(`   البريد: ${u.email}`);
            console.log(`   كلمة المرور الحالية في القاعدة: ${u.password || 'فارغة'}`);
            console.log('---');
        });

    } catch (error) {
        console.error('❌ حدث خطأ أثناء الفحص:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findUsersWithPasswordIssues();