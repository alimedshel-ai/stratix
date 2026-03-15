const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listEmails() {
    try {
        const users = await prisma.user.findMany({
            select: { email: true, name: true, systemRole: true }
        });

        console.log('\n===============================================================');
        console.log(`📋 قائمة بجميع المستخدمين المسجلين (${users.length} مستخدم)`);
        console.log('===============================================================\n');

        users.forEach((u, index) => {
            console.log(`${index + 1}. الاسم: ${u.name || 'غير محدد'}`);
            console.log(`   البريد: ${u.email}`);
            console.log(`   الدور: ${u.systemRole}`);
            console.log('---');
        });

    } catch (error) {
        console.error('❌ حدث خطأ:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listEmails();