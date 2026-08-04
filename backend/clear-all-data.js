/**
 * clear-all-data.js
 * Starts embedded PostgreSQL, clears all user/profile data, then stops.
 * Run: node clear-all-data.js
 */
const { default: EmbeddedPostgres } = require('embedded-postgres');
const path = require('path');
const fs = require('fs');

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

async function main() {
  const dataDir = path.join(__dirname, 'data', 'postgres');

  if (!fs.existsSync(dataDir)) {
    console.error('❌ No database data found at:', dataDir);
    console.error('   Run the backend first to initialize the database.');
    process.exit(1);
  }

  const pg = new EmbeddedPostgres({
    port: 5433, // use different port so it doesn't conflict with running backend
    databaseDir: dataDir,
    user: 'postgres',
    password: 'password',
    persistent: true,
    dbName: 's2s_matrimony',
  });

  console.log('🚀 Starting embedded PostgreSQL on port 5433...');
  try {
    await pg.initialise();
  } catch (e) {
    // Already initialized
  }
  await pg.start();
  console.log('✅ PostgreSQL started.\n');

  const client = pg.getPgClient();
  await client.connect();

  try {
    console.log('🗑️  Clearing ALL user/profile data...\n');
    await client.query("SET session_replication_role = 'replica'");

    for (const table of TABLES_TO_CLEAR) {
      try {
        await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`  ✓ Cleared: ${table}`);
      } catch (err) {
        console.log(`  ⚠ Skipped ${table}: ${err.message}`);
      }
    }

    await client.query("SET session_replication_role = 'origin'");

    console.log('\n✅ All data cleared successfully!');
    console.log('ℹ️  Roles, Permissions, Communities, Religions are preserved.');
    console.log('ℹ️  Restart the backend — it will auto-seed Admin & Super Admin.\n');
  } catch (err) {
    console.error('❌ Error during clear:', err.message);
  } finally {
    await client.end();
    await pg.stop();
    console.log('🛑 PostgreSQL stopped.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
