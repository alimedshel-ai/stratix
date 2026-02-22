const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

async function createUsers() {
    const pwd = await bcrypt.hash('User123!', 10);

    // Get entity id for وزارة الصحة
    const entity = await prisma.entity.findFirst({ where: { legalName: 'وزارة الصحة' } });
    if (!entity) { console.log('Entity not found!'); return; }

    // 1. Create OWNER user
    const ownerExists = await prisma.user.findUnique({ where: { email: 'owner@stratix.com' } });
    if (!ownerExists) {
        const owner = await prisma.user.create({
            data: { email: 'owner@stratix.com', password: pwd, name: 'مالك الشركة', systemRole: 'USER' }
        });
        await prisma.member.create({ data: { userId: owner.id, entityId: entity.id, role: 'OWNER' } });
        console.log('✅ Created OWNER: owner@stratix.com');
    } else {
        console.log('⏭️ OWNER already exists');
    }

    // 2. Create DATA_ENTRY user
    const deExists = await prisma.user.findUnique({ where: { email: 'dataentry@stratix.com' } });
    if (!deExists) {
        const de = await prisma.user.create({
            data: { email: 'dataentry@stratix.com', password: pwd, name: 'مُدخل البيانات', systemRole: 'USER' }
        });
        await prisma.member.create({ data: { userId: de.id, entityId: entity.id, role: 'DATA_ENTRY' } });
        console.log('✅ Created DATA_ENTRY: dataentry@stratix.com');
    } else {
        console.log('⏭️ DATA_ENTRY already exists');
    }

    console.log('\n📋 All test users:');
    console.log('─'.repeat(60));
    console.log('1. SUPER_ADMIN | admin@stratix.sa      | Admin123!');
    console.log('2. OWNER       | owner@stratix.com     | User123!');
    console.log('3. ADMIN       | manager@stratix.com   | User123!');
    console.log('4. EDITOR      | editor@stratix.com    | User123!');
    console.log('5. DATA_ENTRY  | dataentry@stratix.com | User123!');
    console.log('6. VIEWER      | viewer@stratix.com    | User123!');
    console.log('─'.repeat(60));

    await prisma.$disconnect();
}

createUsers().catch(e => { console.error(e); process.exit(1); });
