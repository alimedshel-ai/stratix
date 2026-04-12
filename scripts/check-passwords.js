const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

async function check() {
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@stratix.com' }
  });
  console.log('Admin found:', !!admin, 'id:', admin?.id);

  // Test common passwords
  const pwds = ['Admin123!', 'admin123', 'password', 'Admin1234', 'admin@123', 'Stratix123!', 'startix123'];
  for (const p of pwds) {
    if (admin?.password) {
      const match = await bcrypt.compare(p, admin.password);
      if (match) {
        console.log('Password match:', p);
        break;
      }
    }
  }

  await prisma.$disconnect();
}

check().catch(e => { console.error(e.message); process.exit(1); });
