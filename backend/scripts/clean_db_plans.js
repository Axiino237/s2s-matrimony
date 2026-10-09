const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

function sanitizePlanFeatures(rawFeatures, maxInterests, hasChat, hasAiMatch) {
  const list = Array.isArray(rawFeatures)
    ? rawFeatures
    : typeof rawFeatures === 'string'
    ? JSON.parse(rawFeatures || '[]')
    : [];

  const forbidden = [
    'whatsapp connect',
    'dedicated manager',
    'dedicated match manager',
    'dedicated relationship manager',
    'video profile',
    'video profile highlight',
    'video highlight',
    'advanced search',
    'chat messaging',
    'chat message',
  ];

  const result = [];
  const seen = new Set();
  let hasInterest = false;

  for (const item of list) {
    if (!item || typeof item !== 'string') continue;
    const trimmed = item.trim();
    const lower = trimmed.toLowerCase();
    if (forbidden.some((k) => lower.includes(k) || k.includes(lower))) continue;

    let norm = trimmed;
    if (lower === 'direct chat' || lower === 'live chat') {
      norm = 'Direct Live Chat';
    } else if (lower === 'ai-match recommendations' || lower === 'ai match recommendations') {
      norm = 'AI Match Score';
    } else if (lower === 'horoscope matching report') {
      norm = 'Horoscope matching';
    }

    if (norm.toLowerCase().includes('interest')) {
      if (hasInterest) continue;
      if (maxInterests === -1) {
        norm = 'Unlimited Interests';
      } else if (maxInterests !== undefined && maxInterests <= 0) {
        continue;
      } else if (lower === 'send interest' || lower === 'send interests') {
        norm = 'Send interests';
      }
      hasInterest = true;
    }

    const key = norm.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(norm);
    }
  }

  if (hasChat !== undefined) {
    const chatKey = 'direct live chat';
    if (hasChat) {
      if (!seen.has(chatKey)) {
        seen.add(chatKey);
        result.push('Direct Live Chat');
      }
    } else {
      const idx = result.findIndex((f) => f.toLowerCase().includes('chat'));
      if (idx !== -1) result.splice(idx, 1);
    }
  }

  if (hasAiMatch !== undefined) {
    const aiKey = 'ai match score';
    if (hasAiMatch) {
      if (!seen.has(aiKey)) {
        seen.add(aiKey);
        result.push('AI Match Score');
      }
    } else {
      const idx = result.findIndex((f) => f.toLowerCase().includes('ai match'));
      if (idx !== -1) result.splice(idx, 1);
    }
  }

  return result;
}

async function main() {
  try {
    require('dotenv').config();
  } catch {}

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL environment variable is required. Please set DATABASE_URL in your environment.');
    process.exit(1);
  }

  const isConfirmed = process.env.CONFIRM_CLEAN_PLANS === 'true' || process.argv.includes('--confirm');
  if (!isConfirmed) {
    console.warn(
      'Safety Check: Modifying membership plan records requires explicit confirmation.\n' +
      'To execute updates, run with CONFIRM_CLEAN_PLANS=true or pass the --confirm flag.\n' +
      'Aborting without modifying any database records.'
    );
    process.exit(0);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const plans = await prisma.membershipPlan.findMany();
    console.log(`Found ${plans.length} plans to sanitize.`);

    for (const p of plans) {
      const cleanFeatures = sanitizePlanFeatures(
        p.features,
        p.maxInterests ?? 0,
        Boolean(p.hasChat),
        Boolean(p.hasAiMatch)
      );

      console.log(`Updating ${p.id} (${p.name}):`);
      console.log('  OLD:', JSON.stringify(p.features));
      console.log('  NEW:', JSON.stringify(cleanFeatures));

      await prisma.membershipPlan.update({
        where: { id: p.id },
        data: { features: cleanFeatures }
      });
    }

    console.log('Successfully sanitized all plans in database.');
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
