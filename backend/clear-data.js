/**
 * clear-data.js
 * Clears ALL user/profile data from the embedded PostgreSQL.
 * Run: node clear-data.js
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 's2s_matrimony',
});

const TABLES_TO_CLEAR = [
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
];

async function clearAllData() {
  const client = await pool.connect();
  console.log('🗑️  Clearing ALL data (keeping schema + roles + communities)...\n');
  try {
    await client.query('BEGIN');
    await client.query("SET session_replication_role = 'replica'");

    for (const table of TABLES_TO_CLEAR) {
      try {
        await client.query('SAVEPOINT sp');
        await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
        await client.query('RELEASE SAVEPOINT sp');
        console.log(`  ✓ Cleared: ${table}`);
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT sp');
        console.log(`  ⚠ Skipped ${table}: ${err.message}`);
      }
    }

    await client.query("SET session_replication_role = 'origin'");
    await client.query('COMMIT');

    console.log('\n✅ All user/profile data cleared!');
    console.log('ℹ️  Roles, Permissions, Communities, Religions are preserved.');
    console.log('ℹ️  Now run:  npm run db:seed   to re-seed admin & super-admin.\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

clearAllData();
