const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5433/s2s_matrimony?schema=public',
});

async function main() {
  console.log('--- Inspecting all tables in s2s_postgres ---');
  const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public';`);
  console.log('Tables in DB:', tables.rows.map(r => r.table_name));

  // Inspect communities, castes, sub_castes, educations, occupations, horoscopes, families
  for (const t of ['communities', 'castes', 'sub_castes', 'horoscopes', 'families', 'educations', 'occupations']) {
    if (tables.rows.some(r => r.table_name === t)) {
      const res = await pool.query(`SELECT * FROM "${t}" LIMIT 5;`);
      console.log(`Table ${t} rows (${res.rows.length}):`, res.rows);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => pool.end());
