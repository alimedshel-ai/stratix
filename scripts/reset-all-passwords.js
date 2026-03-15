const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAllPasswords() {
    try {
        const defaultPassword = 'Startix@123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        console.log(`⏳ جاري إعادة تعيين كلمات المرور لجميع المستخدمين إلى: ${defaultPassword}`);

        const result = await prisma.user.updateMany({
            data: {
                password: hashedPassword
            }
        });

        console.log(`✅ تم بنجاح! تم تحديث ${result.count} مستخدم.`);
        console.log('💡 يمكن للمستخدمين الآن تسجيل الدخول باستخدام كلمة المرور الموحدة.');

    } catch (error) {
        console.error('❌ حدث خطأ:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAllPasswords();