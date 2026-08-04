import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = 'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public';
const pool = new Pool({ connectionString });

async function generateDump() {
  console.log('📦 Starting Local PostgreSQL Data Extraction...');
  const client = await pool.connect();

  try {
    // Fetch all public table names
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map((r) => r.table_name);
    console.log(`Found ${tableNames.length} tables in local database:`, tableNames);

    let sqlDump = `-- S2S Matrimony Local Database Dump\n-- Generated at ${new Date().toISOString()}\n\n`;
    sqlDump += `SET statement_timeout = 0;\nSET lock_timeout = 0;\nSET client_encoding = 'UTF8';\nSET standard_conforming_strings = on;\nSET check_function_bodies = false;\nSET xmloption = content;\nSET client_min_messages = warning;\nSET row_security = off;\n\n`;

    // Disable triggers / foreign keys during import
    sqlDump += `SET session_replication_role = 'replica';\n\n`;

    for (const tableName of tableNames) {
      const rowsRes = await client.query(`SELECT * FROM "${tableName}"`);
      const rows = rowsRes.rows;

      if (rows.length === 0) continue;

      sqlDump += `-- Data for table "${tableName}" (${rows.length} rows)\n`;
      sqlDump += `TRUNCATE TABLE "${tableName}" CASCADE;\n`;

      const columns = Object.keys(rows[0]).map((c) => `"${c}"`).join(', ');

      for (const row of rows) {
        const values = Object.values(row).map((val) => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number' || typeof val === 'boolean') return val;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        }).join(', ');

        sqlDump += `INSERT INTO "${tableName}" (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
      }
      sqlDump += `\n`;
    }

    // Re-enable triggers / foreign keys
    sqlDump += `SET session_replication_role = 'origin';\n`;

    const outputPath = path.join(__dirname, '../../s2s_matrimony_dump.sql');
    fs.writeFileSync(outputPath, sqlDump, 'utf8');

    console.log(`✅ Local Database Dump successfully generated at: ${outputPath}`);
    console.log(`Size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
  } catch (err: any) {
    console.error('❌ Error generating DB dump:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

generateDump();
