const { Client } = require('pg');
const { default: EmbeddedPostgres } = require('embedded-postgres');
const fs = require('fs');
const path = require('path');

async function main() {
  const dataDir = path.join(__dirname, 'data', 'postgres');
  let pgServer = null;

  // Try connecting first
  let client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/s2s_matrimony' });
  let connected = false;

  try {
    await client.connect();
    connected = true;
    console.log('Connected to existing PostgreSQL server on port 5432.');
  } catch (err) {
    console.log('No active PostgreSQL on 5432. Starting Embedded PostgreSQL...');
    pgServer = new EmbeddedPostgres({
      port: 5432,
      databaseDir: dataDir,
      user: 'postgres',
      password: 'password',
      persistent: true,
      dbName: 's2s_matrimony',
    });
    try {
      await pgServer.initialise();
    } catch (e) {
      // already initialized
    }
    await pgServer.start();
    console.log('Embedded PostgreSQL started.');

    client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/s2s_matrimony' });
    await client.connect();
    connected = true;
  }

  const targetDir = 'D:\\projects\\Aravindhan\\Aravindhan\\dumb db';
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const filename = `s2s_matrimony_dump_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.sql`;
  const fullPath = path.join(targetDir, filename);

  console.log(`Generating DB Dump to: ${fullPath}`);

  let dumpContent = `-- ========================================================\n`;
  dumpContent += `-- S2S Matrimony Database Dump\n`;
  dumpContent += `-- Exported at: ${now.toLocaleString()} (${now.toISOString()})\n`;
  dumpContent += `-- ========================================================\n\n`;

  dumpContent += `SET statement_timeout = 0;\n`;
  dumpContent += `SET lock_timeout = 0;\n`;
  dumpContent += `SET client_encoding = 'UTF8';\n`;
  dumpContent += `SET standard_conforming_strings = on;\n`;
  dumpContent += `SET check_function_bodies = false;\n`;
  dumpContent += `SET xmloption = content;\n`;
  dumpContent += `SET client_min_messages = warning;\n`;
  dumpContent += `SET row_security = off;\n`;
  dumpContent += `SET session_replication_role = 'replica';\n\n`;

  // Fetch all public tables
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  const tables = tablesRes.rows.map(r => r.table_name);
  console.log(`Found ${tables.length} tables to dump...`);

  for (const tableName of tables) {
    const rowsRes = await client.query(`SELECT * FROM "${tableName}";`);
    const rows = rowsRes.rows;

    dumpContent += `-- --------------------------------------------------------\n`;
    dumpContent += `-- Table Data: "${tableName}" (${rows.length} rows)\n`;
    dumpContent += `-- --------------------------------------------------------\n`;
    dumpContent += `TRUNCATE TABLE "${tableName}" CASCADE;\n`;

    if (rows.length > 0) {
      const cols = Object.keys(rows[0]).map(c => `"${c}"`).join(', ');

      for (const row of rows) {
        const vals = Object.values(row).map(val => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean') return val ? 'true' : 'false';
          if (typeof val === 'number') return val;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        }).join(', ');

        dumpContent += `INSERT INTO "${tableName}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
      }
    }
    dumpContent += `\n`;
  }

  fs.writeFileSync(fullPath, dumpContent, 'utf8');
  console.log(`Dump successfully created!\nFile: ${fullPath}\nSize: ${(fs.statSync(fullPath).size / 1024).toFixed(2)} KB`);

  await client.end();
  if (pgServer) {
    await pgServer.stop();
    console.log('Embedded PostgreSQL stopped.');
  }
}

main().catch(err => {
  console.error('Failed to export dump:', err);
  process.exit(1);
});

