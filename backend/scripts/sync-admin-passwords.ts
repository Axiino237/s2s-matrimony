import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  const res = await prisma.user.updateMany({
    where: {
      email: { in: ['admin@s2smatrimony.com', 'superadmin@s2smatrimony.com'] },
    },
    data: {
      passwordHash: hash,
    },
  });
  console.log(`✅ Admin passwords updated to admin123 for ${res.count} user(s).`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
