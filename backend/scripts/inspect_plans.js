const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/s2s_matrimony?schema=public';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    console.log('Current plans count:', plans.length);
    for (const p of plans) {
      console.log(`Plan [${p.id}] (${p.name}, tier: ${p.tier}, category: ${p.category}, maxInterests: ${p.maxInterests}):`);
      console.log('  Features:', JSON.stringify(p.features));
    }
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
