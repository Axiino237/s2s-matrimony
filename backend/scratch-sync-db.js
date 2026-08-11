const { Client } = require('pg');

async function sync() {
  const client = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5432/s2s_matrimony',
  });
  await client.connect();

  const familyColumnsInt = [
    'elderBrothers', 'elderBrothersMarried',
    'youngerBrothers', 'youngerBrothersMarried',
    'elderSisters', 'elderSistersMarried',
    'youngerSisters', 'youngerSistersMarried'
  ];
  for (const col of familyColumnsInt) {
    await client.query(`ALTER TABLE family_details ADD COLUMN IF NOT EXISTS "${col}" INTEGER DEFAULT 0`);
  }

  const horoscopeColumnsText = [
    'kuladeivam', 'dasaBalance', 'horoscopeFile'
  ];
  for (const col of horoscopeColumnsText) {
    await client.query(`ALTER TABLE horoscope ADD COLUMN IF NOT EXISTS "${col}" TEXT`);
  }

  await client.query(`ALTER TABLE horoscope ADD COLUMN IF NOT EXISTS "starPadam" INTEGER`);
  await client.query(`ALTER TABLE horoscope ADD COLUMN IF NOT EXISTS "horoscopeData" JSONB`);

  console.log('✅ ALL MISSING DB COLUMNS ADDED SUCCESSFULLY!');
  await client.end();
}

sync().catch(err => {
  console.error('SYNC ERROR:', err);
  process.exit(1);
});
