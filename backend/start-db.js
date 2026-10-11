require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { default: EmbeddedPostgres } = require('embedded-postgres');
const fs = require('fs');
const path = require('path');

async function main() {
  const dbUrl = process.env.DATABASE_URL || '';
  const portMatch = dbUrl.match(/:(\d+)\//);
  const port = portMatch ? parseInt(portMatch[1], 10) : 5433;

  console.log(`Starting Embedded PostgreSQL server on port ${port}...`);
  
  const dataDir = path.join(__dirname, 'data', 'postgres');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const pg = new EmbeddedPostgres({
    port,
    databaseDir: dataDir,
    user: 'postgres',
    password: 'password',
    persistent: true,
    dbName: 's2s_matrimony',
  });

  try {
    await pg.initialise();
    console.log('PostgreSQL initialized.');
  } catch (err) {
    console.log('Initialization notice (may already be initialized):', err.message);
  }

  try {
    await pg.start();
    console.log(`PostgreSQL started on port ${port}!`);
  } catch (err) {
    console.error('Error starting PostgreSQL:', err);
    process.exit(1);
  }

  try {
    await pg.createDatabase('s2s_matrimony');
    console.log('Database s2s_matrimony created/verified.');
  } catch (err) {
    console.log('Database notice:', err.message);
  }

  // Import SQL dump if database is fresh
  const client = pg.getPgClient();
  await client.connect();

  const dumpPath = path.join(__dirname, '..', 's2s_matrimony_dump.sql');
  if (fs.existsSync(dumpPath)) {
    const res = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';");
    if (parseInt(res.rows[0].count, 10) === 0) {
      console.log('Importing database dump s2s_matrimony_dump.sql...');
      let sql = fs.readFileSync(dumpPath, 'utf8');
      sql = sql.replace(/^\\restrict.*$/gm, '');
      try {
        await client.query(sql);
        console.log('Database dump imported successfully!');
      } catch (dumpErr) {
        console.error('Notice during SQL dump execution:', dumpErr.message);
      }
    } else {
      console.log(`Database already has ${res.rows[0].count} tables.`);
    }
  }

  await client.end();
  console.log(`✅ PostgreSQL is ready and running on port ${port}.`);

  // Keep process alive so embedded PostgreSQL stays running
  setInterval(() => {}, 60000);
}

main().catch(err => {
  console.error('Failed to start Embedded Postgres:', err);
});
