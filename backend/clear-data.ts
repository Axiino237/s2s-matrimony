/**
 * clear-data.ts
 * Connects to the embedded PostgreSQL and truncates ALL data tables
 * (keeps schema intact — only removes rows)
 * Run: npx ts-node clear-data.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearAllData() {
  console.log('🗑️  Clearing ALL data from database (keeping schema)...\n');

  try {
    // Disable FK constraints temporarily, truncate all tables, re-enable
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);

    const tables = [
      'audit_logs',
      'profile_views',
      'contact_unlocks',
      'reports',
      'notifications',
      'messages',
      'chats',
      'interests',
      'favorites',
      'blocks',
      'sessions',
      'otp_tokens',
      'match_scores',
      'partner_preferences',
      'privacy_settings',
      'horoscopes',
      'family_details',
      'occupation',
      'education',
      'profile_photos',
      'memberships',
      'payments',
      'profiles',
      'user_roles',
      'users',
      // Reference tables — keep unless you want to re-seed communities too
      // 'sub_castes', 'castes', 'communities',
      // 'religions', 'cities', 'states', 'countries',
      // 'role_permissions', 'permissions', 'roles',
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
        console.log(`  ✓ Cleared: ${table}`);
      } catch (err: any) {
        console.log(`  ⚠ Skipped ${table}: ${err.message}`);
      }
    }

    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);

    console.log('\n✅ All data cleared successfully!');
    console.log('ℹ️  Roles, Permissions, Communities, Religions are preserved.');
    console.log('ℹ️  Now run: npm run db:seed   to re-seed admin/super-admin.');
  } catch (err: any) {
    console.error('❌ Error clearing data:', err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

clearAllData();
