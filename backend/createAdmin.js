const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@shopbd.com',
      password: hashedPassword,
      role: 'admin'
    }
  });
  console.log('✅ Admin created:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());