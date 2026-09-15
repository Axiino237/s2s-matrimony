const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: 'postgresql://postgres:password@localhost:5432/s2s_matrimony' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: {
          include: {
            community: true,
            religion: true,
            caste: true,
            subCaste: true,
            city: true,
            state: true,
            country: true,
            photos: true,
            horoscope: true,
            family: true,
            education: { include: { educationMaster: true } },
            occupation: { include: { occupationMaster: true } },
          },
        },
        userRoles: { include: { role: true } },
      },
    });
    console.log('✅ Users found count:', users.length);
    console.log(users.map((u) => ({ id: u.id, email: u.email, profileName: u.profile?.displayName })));
  } catch (e) {
    console.error('❌ ERROR IN USER QUERY:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
