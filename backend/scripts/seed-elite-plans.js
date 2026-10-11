/**
 * Safe, idempotent seed script to upsert the 3 ELITE Membership Plans.
 * Keyed on unique [category, name]. Does not touch existing plans or other tables.
 */
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const ELITE_PLANS = [
  {
    name: 'Silver Plan',
    tier: 'SILVER',
    category: 'ELITE',
    price: 1499,
    originalPrice: 1999,
    durationMonths: 3,
    features: [
      '100 Daily Interests',
      '100 Contact Views',
      'Direct Live Chat',
      'Verified Elite Badge',
      'AI Match Score',
    ],
    maxInterests: 100,
    maxContacts: 100,
    hasChat: true,
    hasAiMatch: true,
    hasVideoProfile: false,
    isPopular: false,
    isActive: true,
    displayOrder: 1,
  },
  {
    name: 'Gold Plan',
    tier: 'GOLD',
    category: 'ELITE',
    price: 2999,
    originalPrice: 3999,
    durationMonths: 6,
    features: [
      'Unlimited Interests',
      '250 Contact Unlocks',
      'Direct Live Chat',
      'AI Match Score',
      'VIP Support',
      'Horoscope matching',
    ],
    maxInterests: -1,
    maxContacts: 250,
    hasChat: true,
    hasAiMatch: true,
    hasVideoProfile: false,
    isPopular: true,
    isActive: true,
    displayOrder: 2,
  },
  {
    name: 'Platinum Plan',
    tier: 'PLATINUM',
    category: 'ELITE',
    price: 4999,
    originalPrice: 6999,
    durationMonths: 12,
    features: [
      'Everything in Elite Gold',
      'Unlimited Contact Unlocks',
      'Horoscope matching',
      'VIP 24/7 Priority Support',
      'View contact details',
      'Unlimited Interests',
      'AI Match Score',
      'Direct Live Chat',
    ],
    maxInterests: -1,
    maxContacts: -1,
    hasChat: true,
    hasAiMatch: true,
    hasVideoProfile: false,
    isPopular: false,
    isActive: true,
    displayOrder: 3,
  },
];

async function seedElitePlans() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public';

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🌱 Starting safe, idempotent seed for ELITE membership plans...');

  try {
    for (const plan of ELITE_PLANS) {
      const result = await prisma.membershipPlan.upsert({
        where: {
          category_name: {
            category: plan.category,
            name: plan.name,
          },
        },
        update: {
          tier: plan.tier,
          price: plan.price,
          originalPrice: plan.originalPrice,
          durationMonths: plan.durationMonths,
          features: plan.features,
          maxInterests: plan.maxInterests,
          maxContacts: plan.maxContacts,
          hasChat: plan.hasChat,
          hasAiMatch: plan.hasAiMatch,
          hasVideoProfile: plan.hasVideoProfile,
          isPopular: plan.isPopular,
          isActive: plan.isActive,
          displayOrder: plan.displayOrder,
        },
        create: {
          name: plan.name,
          tier: plan.tier,
          category: plan.category,
          price: plan.price,
          originalPrice: plan.originalPrice,
          durationMonths: plan.durationMonths,
          features: plan.features,
          maxInterests: plan.maxInterests,
          maxContacts: plan.maxContacts,
          hasChat: plan.hasChat,
          hasAiMatch: plan.hasAiMatch,
          hasVideoProfile: plan.hasVideoProfile,
          isPopular: plan.isPopular,
          isActive: plan.isActive,
          displayOrder: plan.displayOrder,
        },
      });
      console.log(`✅ Upserted ELITE plan: [${result.id}] ${result.name} - ₹${result.price} (${result.durationMonths} months)`);
    }

    const totalPlans = await prisma.membershipPlan.count();
    const eliteCount = await prisma.membershipPlan.count({ where: { category: 'ELITE' } });
    const generalCount = await prisma.membershipPlan.count({ where: { category: 'GENERAL' } });

    console.log(`🎉 Seeding complete. Total plans: ${totalPlans} (GENERAL: ${generalCount}, ELITE: ${eliteCount})`);
  } catch (err) {
    console.error('❌ Error seeding ELITE plans:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (require.main === module) {
  seedElitePlans()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedElitePlans, ELITE_PLANS };
