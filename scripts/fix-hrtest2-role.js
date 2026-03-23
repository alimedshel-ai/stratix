/**
 * fix-hrtest2-role.js
 * ─────────────────────────────────────────────────────────────
 * إصلاح فساد البيانات: hrtest2@test.com عنده role=OWNER
 * بينما يجب أن يكون EDITOR (مدير إدارة موارد بشرية)
 *
 * تشغيل: node scripts/fix-hrtest2-role.js
 * ─────────────────────────────────────────────────────────────
 */

const prisma = require('../lib/prisma');

async function main() {
    console.log('\n📋 فحص جميع المستخدمين بدور OWNER...\n');

    // 1. عرض كل OWNERs
    const owners = await prisma.member.findMany({
        where: { role: 'OWNER' },
        select: {
            id: true,
            role: true,
            userType: true,
            user: {
                select: { email: true, name: true, userCategory: true }
            }
        }
    });

    owners.forEach(m => {
        const flag = m.user.userCategory?.startsWith('DEPT_') ? '⚠️  يبدو خاطئاً' : '✅ يبدو صحيحاً';
        console.log(`${flag}  ${m.user.email} | userCategory: ${m.user.userCategory} | role: ${m.role} | userType: ${m.userType}`);
    });

    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('🔧 تصحيح hrtest2@test.com: OWNER → EDITOR + DEPT_MANAGER...\n');

    // 2. إصلاح hrtest2 — تغيير role من OWNER إلى EDITOR وuserType إلى DEPT_MANAGER
    const membership = await prisma.member.findFirst({
        where: { user: { email: 'hrtest2@test.com' } }
    });

    if (!membership) {
        console.log('❌ لم يُعثر على المستخدم hrtest2@test.com');
        return;
    }

    const updated = await prisma.member.update({
        where: { id: membership.id },
        data: {
            role: 'EDITOR',         // EDITOR = مدير إدارة (يرى dept-dashboard)
            userType: 'DEPT_MANAGER' // تأكيد userType الصحيح
        }
    });

    console.log(`✅ تم التحديث بنجاح:`);
    console.log(`   ID: ${updated.id}`);
    console.log(`   role القديم: OWNER  →  role الجديد: ${updated.role}`);
    console.log(`   userType: ${updated.userType}`);
    console.log('\n✅ انتهى — سجّل خروج ودخول بحساب hrtest2 للتحقق.\n');
}

main()
    .catch(e => {
        console.error('❌ خطأ:', e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
