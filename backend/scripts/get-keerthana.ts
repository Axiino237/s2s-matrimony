import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'keerthana', mode: 'insensitive' } },
        { email: { contains: 'kavitha', mode: 'insensitive' } },
        { profile: { firstName: { contains: 'keerthana', mode: 'insensitive' } } },
        { profile: { firstName: { contains: 'kavitha', mode: 'insensitive' } } },
      ],
    },
    include: {
      profile: {
        include: {
          community: true,
        },
      },
      memberships: {
        include: {
          plan: true,
        },
      },
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  console.log('=== MATCHING DB USER & PROFILE RECORDS ===');
  console.log(JSON.stringify(users, null, 2));

  if (users.length === 0) {
    const allUsers = await prisma.user.findMany({
      take: 5,
      include: {
        profile: true,
      },
    });
    console.log('=== SAMPLE USERS IN DB ===');
    console.log(JSON.stringify(allUsers, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
