const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5433/s2s_matrimony'
  });
  await c.connect();

  const res = await c.query(`
    SELECT h.id, p."firstName", p."lastName", p.gender, p."membershipCategory", p."netWorth",
           h.star, h.rasi,
           h."horoscopeData"->>'rasiChart' as rasi_chart_raw,
           h."horoscopeData"->>'amsamChart' as amsam_chart_raw
    FROM horoscope h
    JOIN profiles p ON p.id = h."profileId"
  `);
  console.log('=== HOROSCOPE RECORDS ===');
  for (const r of res.rows) {
    console.log({
      name: `${r.firstName} ${r.lastName}`,
      gender: r.gender,
      category: r.membershipCategory,
      netWorth: r.netWorth,
      star: r.star,
      rasi: r.rasi,
      hasRasiChart: Boolean(r.rasi_chart_raw && r.rasi_chart_raw !== '{}'),
      hasAmsamChart: Boolean(r.amsam_chart_raw && r.amsam_chart_raw !== '{}'),
    });
  }

  await c.end();
}

main().catch(console.error);
