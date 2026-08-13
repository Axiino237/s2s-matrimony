const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const connectionString = 'postgresql://postgres:password@localhost:5432/s2s_matrimony';
  console.log('Connecting to PostgreSQL at 5432...');
  
  const client = new Client({ connectionString });
  await client.connect();

  const dumpPath = path.join(__dirname, '..', 's2s_matrimony_dump.sql');
  if (!fs.existsSync(dumpPath)) {
    console.error('Dump file not found:', dumpPath);
    process.exit(1);
  }

  console.log('Reading s2s_matrimony_dump.sql...');
  let sql = fs.readFileSync(dumpPath, 'utf8');

  // Clean up pg_dump specific directives
  sql = sql.replace(/^\\restrict.*$/gm, '');

  console.log('Executing SQL dump queries...');
  try {
    await client.query(sql);
    console.log('Database dump executed successfully!');
  } catch (err) {
    console.error('Error during SQL dump execution:', err.message);
  }

  console.log('\n--- Checking Table Row Counts ---');
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  for (const row of res.rows) {
    const tableName = row.table_name;
    try {
      const countRes = await client.query(`SELECT count(*) FROM "${tableName}";`);
      const count = countRes.rows[0].count;
      if (parseInt(count, 10) > 0) {
        console.log(`Table "${tableName}": ${count} rows`);
      }
    } catch (cntErr) {
      console.error(`Could not count table "${tableName}":`, cntErr.message);
    }
  }

  await client.end();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Failed to import dump:', err);
  process.exit(1);
});
