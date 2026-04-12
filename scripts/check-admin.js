const prisma = require('../lib/prisma');

async function check() {
  // Find admin user
  const adminUser = await prisma.user.findFirst({
    where: { OR: [{ email: 'admin@stratix.com' }, { email: 'admin@startix.ai' }] }
  });
  console.log('Admin user:', adminUser?.email, 'systemRole:', adminUser?.systemRole, 'id:', adminUser?.id);

  if (adminUser) {
    const memberships = await prisma.member.findMany({
      where: { userId: adminUser.id }
    });
    console.log('Admin memberships:', memberships.length);
    memberships.forEach(m => console.log(`  entityId=${m.entityId} role=${m.role} userType=${m.userType}`));
  }

  // Also check what entity ENTITY_ID is
  const entity = await prisma.entity.findUnique({
    where: { id: 'cmncvw3mn000igp98e9dhxq4k' },
    select: { id: true, legalName: true, displayName: true }
  });
  console.log('\nEntity:', entity);

  await prisma.$disconnect();
}

check().catch(e => { console.error(e.message); process.exit(1); });
