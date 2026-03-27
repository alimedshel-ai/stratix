const prisma = require('./lib/prisma');

(async () => {
    // تحديث manager@stratix.com ليكون DEPT_MANAGER لإدارة HR
    const member = await prisma.member.findFirst({
        where: { user: { email: 'manager@stratix.com' } },
        select: { id: true, userId: true }
    });

    if (!member) {
        console.log('لا يوجد عضوية لـ manager@stratix.com');
        return;
    }

    await prisma.member.update({
        where: { id: member.id },
        data: { userType: 'DEPT_MANAGER', role: 'EDITOR' }
    });

    await prisma.user.update({
        where: { id: member.userId },
        data: { userCategory: 'DEPT_HR', onboardingCompleted: true }
    });

    console.log('✅ تم: manager@stratix.com → DEPT_MANAGER (HR)');
    console.log('📧 Email: manager@stratix.com');
    console.log('🔑 Password: أي كلمة مرور موجودة في قاعدة البيانات');
})().finally(() => prisma.$disconnect());
