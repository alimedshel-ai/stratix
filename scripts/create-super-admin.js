const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
    const email = 'superadmin@stratix.com';
    const password = 'Str@tix$uper2026!';
    const name = 'مدير النظام الأعلى';

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { systemRole: 'SUPER_ADMIN', password: hashed },
        create: {
            email,
            password: hashed,
            name,
            systemRole: 'SUPER_ADMIN',
        }
    });

    console.log('✅ SUPER_ADMIN جاهز!');
    console.log(`   📧 Email:    ${email}`);
    console.log(`   🔑 Password: ${password}`);
    console.log(`   👤 Name:     ${name}`);
    console.log(`   🆔 ID:       ${user.id}`);

    await prisma.$disconnect();
}

createSuperAdmin().catch(e => { console.error('❌ Error:', e); process.exit(1); });
