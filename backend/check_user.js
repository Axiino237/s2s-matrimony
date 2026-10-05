const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: { in: ['superadmin@s2smatrimony.com', 'admin@s2smatrimony.com'] }
    },
    include: {
      userRoles: { include: { role: true } }
    }
  });
  console.log('Found users:', users.length);
  for (const u of users) {
    console.log('User:', u.id, u.email, 'isActive:', u.isActive, 'hasPasswordHash:', !!u.passwordHash);
    const testAdmin123 = u.passwordHash ? await bcrypt.compare('admin123', u.passwordHash) : false;
    const testSuperadmin123 = u.passwordHash ? await bcrypt.compare('superadmin123', u.passwordHash) : false;
    const testAdmin = u.passwordHash ? await bcrypt.compare('admin', u.passwordHash) : false;
    console.log('Matches "admin123":', testAdmin123);
    console.log('Matches "superadmin123":', testSuperadmin123);
    console.log('Matches "admin":', testAdmin);
    console.log('Roles:', u.userRoles.map(ur => ur.role.name));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
