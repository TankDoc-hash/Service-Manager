const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@tankdoc.com' } });
  if (!user) {
    console.log('User not found');
    return;
  }
  console.log('User found:', user.name, '| Status:', user.status, '| Role:', user.role);
  console.log('Hash starts with:', user.password.substring(0, 10));
  const match = await bcrypt.compare('Test@1234!', user.password);
  console.log('Password match:', match);
}
main().then(() => prisma.$disconnect());
