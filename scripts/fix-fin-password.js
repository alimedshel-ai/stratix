const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

(async () => {
  const user = await prisma.user.findUnique({ where: { email: 'fintest1@test.com' } });
  if (!user) {
    console.log('USER NOT FOUND');
    await prisma.$disconnect();
    return;
  }
  console.log('Found:', user.email, 'Category:', user.userCategory);
  const match = await bcrypt.compare('11223344', user.password);
  console.log('Password match:', match);
  if (!match) {
    const hashed = await bcrypt.hash('11223344', 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    console.log('Password RESET done');
  } else {
    console.log('Password already correct');
  }
  await prisma.$disconnect();
})();
