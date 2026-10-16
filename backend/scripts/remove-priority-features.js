/**
 * Clean up existing database membership_plans by stripping out
 * 'Priority listing', 'Priority highlighting', 'Profile highlighting',
 * 'Priority Profile Ranking', 'Top Priority Search Listing', etc.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const FORBIDDEN_PATTERNS = [
  'priority listing',
  'priority highlighting',
  'profile highlighting',
  'profile highlight',
  'priority highlight',
  'priority profile ranking',
  'top priority search listing',
  'priority search',
  'priority ranking',
  'priority profile',
  'video profile highlight',
  'video highlight',
];

function shouldRemoveFeature(feat) {
  if (!feat || typeof feat !== 'string') return false;
  const lower = feat.toLowerCase().trim();
  // Note: don't match 'priority support'
  if (lower.includes('support')) return false;
  return FORBIDDEN_PATTERNS.some((p) => lower.includes(p) || p.includes(lower));
}

async function cleanPlans() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public';

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Connecting to database...');
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    console.log(`Found ${plans.length} plans in DB.`);
    let updatedCount = 0;

    for (const plan of plans) {
      const currentFeatures = Array.isArray(plan.features)
        ? plan.features
        : typeof plan.features === 'string'
        ? JSON.parse(plan.features || '[]')
        : [];

      const cleanedFeatures = currentFeatures.filter((f) => !shouldRemoveFeature(f));

      const hasChanged =
        cleanedFeatures.length !== currentFeatures.length ||
        JSON.stringify(cleanedFeatures) !== JSON.stringify(currentFeatures);

      if (hasChanged) {
        console.log(`\nModifying Plan [${plan.id}] - ${plan.name} (${plan.category || 'GENERAL'}):`);
        console.log('  BEFORE:', JSON.stringify(currentFeatures));
        console.log('  AFTER: ', JSON.stringify(cleanedFeatures));

        await prisma.membershipPlan.update({
          where: { id: plan.id },
          data: { features: cleanedFeatures },
        });
        updatedCount++;
      } else {
        console.log(`Plan [${plan.id}] - ${plan.name}: No changes needed.`);
      }
    }

    console.log(`\nDone! Successfully updated ${updatedCount} plan(s).`);
  } finally {
    await pool.end();
  }
}

cleanPlans().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
