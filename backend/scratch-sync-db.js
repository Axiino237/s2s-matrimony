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
  await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "familyWorth" TEXT`);
  await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "individualWorth" TEXT`);
  await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "annualIncome" TEXT`);
  await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "propertyDetails" TEXT`);
  await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "biodataJson" TEXT`);
  await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "memberId" TEXT`);
  await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "branch" TEXT`);
  await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "residentStatus" TEXT`);

  // family_details
  await client.query(`ALTER TABLE family_details ADD COLUMN IF NOT EXISTS "familyWorth" TEXT`);
  await client.query(`ALTER TABLE family_details ADD COLUMN IF NOT EXISTS "propertyDetails" TEXT`);
  await client.query(`ALTER TABLE family_details ADD COLUMN IF NOT EXISTS "familyDescription" TEXT`);
  await client.query(`ALTER TABLE family_details ADD COLUMN IF NOT EXISTS "fatherAlive" BOOLEAN DEFAULT true`);
  await client.query(`ALTER TABLE family_details ADD COLUMN IF NOT EXISTS "motherAlive" BOOLEAN DEFAULT true`);
  await client.query(`ALTER TABLE family_details ADD COLUMN IF NOT EXISTS "nativePlace" TEXT`);

  // education
  await client.query(`ALTER TABLE education ADD COLUMN IF NOT EXISTS "college" TEXT`);
  await client.query(`ALTER TABLE education ADD COLUMN IF NOT EXISTS "educationDetail" TEXT`);

  // occupation
  await client.query(`ALTER TABLE occupation ADD COLUMN IF NOT EXISTS "company" TEXT`);
  await client.query(`ALTER TABLE occupation ADD COLUMN IF NOT EXISTS "companyName" TEXT`);
  await client.query(`ALTER TABLE occupation ADD COLUMN IF NOT EXISTS "workLocation" TEXT`);
  await client.query(`ALTER TABLE occupation ADD COLUMN IF NOT EXISTS "occupationDetail" TEXT`);

  console.log('✅ ALL MISSING DB COLUMNS ADDED SUCCESSFULLY!');
  await client.end();
}

sync().catch(err => {
  console.error('SYNC ERROR:', err);
  process.exit(1);
});
