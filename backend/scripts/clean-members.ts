import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { devStore } from '../src/common/dev-store';

dotenv.config();

async function main() {
  console.log('Cleaning up devStore & Database non-admin members...');

  // 1. Reset devStore in memory
  devStore.resetStore();
  console.log('devStore reset to initial Super Admin & Admin state.');

  // 2. Reset DB records if DB connection exists
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public';

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const adminRoles = await prisma.role.findMany({
      where: { name: { in: ['SUPER_ADMIN', 'ADMIN'] } },
    }).catch(() => []);

    const adminRoleIds = adminRoles.map((r) => r.id);

    const adminUserRoles = await prisma.userRole.findMany({
      where: { roleId: { in: adminRoleIds } },
    }).catch(() => []);

    const adminUserIds = adminUserRoles.map((ur) => ur.userId);

    // Remove any profiles attached to Admin accounts
    if (adminUserIds.length > 0) {
      await prisma.profile.deleteMany({
        where: { userId: { in: adminUserIds } },
      }).catch(() => null);
    }

    // Delete non-admin users
    const deleted = await prisma.user.deleteMany({
      where: {
        id: { notIn: adminUserIds.concat(['super-admin-001', 'admin-001']) },
      },
    }).catch(() => ({ count: 0 }));

    console.log(`Successfully removed ${deleted.count} member profiles & cleaned admin profile entries from database!`);
  } catch (err: any) {
    console.log('DB cleanup skipped or offline:', err?.message || err);
  } finally {
    await prisma.$disconnect().catch(() => null);
    await pool.end().catch(() => null);
  }
}

main();
