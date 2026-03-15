const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin(email, password) {
    try {
        console.log(`🔍 جاري اختبار الدخول للإيميل: ${email}`);
        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (!user) {
            console.log('❌ الإيميل غير موجود في قاعدة البيانات!');
            return;
        }

        const isValid = await bcrypt.compare(password, user.password);
        console.log(isValid ? '✅ كلمة المرور صحيحة وتعمل 100%!' : '❌ كلمة المرور خاطئة في قاعدة البيانات!');
    } catch (error) {
        console.error('❌ حدث خطأ غير متوقع:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// استخدام معاملات أو متغيرات بيئة
testLogin(process.env.TEST_EMAIL || 'admin@stratix.com', process.env.TEST_PASSWORD || 'Startix@123');