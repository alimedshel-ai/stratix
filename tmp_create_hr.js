const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function create() {
    const hash = await bcrypt.hash('11223344', 10);
    const existing = await prisma.user.findUnique({ where: { email: 'hrtest2@test.com' } });
    if (!existing) {
        await prisma.user.create({
            data: {
                email: 'hrtest2@test.com',
                name: 'HR Test 2',
                password: hash,
                userCategory: 'DEPT_HR',
                onboardingCompleted: true,
                memberships: {
                    create: {
                        entityId: 'cmncvw3mn000igp98e9dhxq4k',
                        role: 'EDITOR',
                        userType: 'DEPT_MANAGER',
                        departmentRole: 'CHRO'
                    }
                }
            }
        });
        console.log('✅ تم إنشاء الحساب hrtest2@test.com بنجاح!');
    } else {
        await prisma.user.update({
            where: { email: 'hrtest2@test.com' },
            data: { password: hash }
        });
        console.log('🔄 الحساب موجود، وتم تحديث كلمة المرور إلى 11223344');
    }
}

create()
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1); });
