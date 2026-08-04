import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { devStore } from '../src/common/dev-store';

dotenv.config();

async function main() {
  console.log('=== USERS IN DEV STORE ===');
  const devUsers = devStore.getAll();
  console.log(JSON.stringify(devUsers, null, 2));

  console.log('\n=== USERS IN POSTGRESQL DATABASE ===');
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public';

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.findMany({
      include: {
        profile: {
          include: {
            horoscope: true,
            education: true,
            occupation: true,
            family: true,
          },
        },
        userRoles: {
          include: { role: true },
        },
      },
    });

    console.log(`Total DB Users: ${users.length}`);
    users.forEach((u, i) => {
      console.log(`\n--- [User #${i + 1}] ---`);
      console.log(`ID: ${u.id}`);
      console.log(`Email: ${u.email}`);
      console.log(`Phone: ${u.phone}`);
      console.log(`Roles: ${u.userRoles.map((ur) => ur.role.name).join(', ') || 'None'}`);
      if (u.profile) {
        console.log(`Profile Name: ${u.profile.displayName || `${u.profile.firstName} ${u.profile.lastName}`}`);
        console.log(`Gender: ${u.profile.gender}`);
        console.log(`DOB: ${u.profile.dateOfBirth?.toISOString().split('T')[0]}`);
        console.log(`Gothram: ${u.profile.gothram || 'N/A'}`);
        if (u.profile.horoscope) {
          console.log(`Horoscope -> Star: ${u.profile.horoscope.star || 'N/A'}, Rasi: ${u.profile.horoscope.rasi || 'N/A'}, Lagnam: ${u.profile.horoscope.lagnam || 'N/A'}`);
        } else {
          console.log(`Horoscope: (None)`);
        }
      } else {
        console.log(`Profile: (None)`);
      }
    });
  } catch (err: any) {
    console.log('PostgreSQL DB Error:', err?.message || err);
  } finally {
    await prisma.$disconnect().catch(() => null);
    await pool.end().catch(() => null);
  }
}

main();
