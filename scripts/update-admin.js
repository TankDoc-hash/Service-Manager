const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Tankdocindia25!', 12);
  const result = await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { email: 'Admin@tankdoc.in', password: hash }
  });
  console.log('Updated:', result.count, 'user(s)');

  const user = await prisma.user.findUnique({ where: { email: 'Admin@tankdoc.in' } });
  const match = await bcrypt.compare('Tankdocindia25!', user.password);
  console.log('Verify - Email:', user.email, '| Password match:', match);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
