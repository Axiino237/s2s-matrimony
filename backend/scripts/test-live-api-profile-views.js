const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/s2s_matrimony?schema=public' });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-s2s-matrimony';
const BASE_URL = 'http://localhost:3001/api/v1';

function createToken(user, roles = ['MEMBER']) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function getStartOfDayUtc(timeZone = 'Asia/Kolkata', refDate = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(refDate);
  const getPart = (type) => parts.find((p) => p.type === type)?.value;

  const hour = parseInt(getPart('hour') || '0', 10);
  const minute = parseInt(getPart('minute') || '0', 10);
  const second = parseInt(getPart('second') || '0', 10);

  const msSinceMidnight =
    ((hour * 60 + minute) * 60 + second) * 1000 + (refDate.getTime() % 1000);
  return new Date(refDate.getTime() - msSinceMidnight);
}

async function main() {
  console.log('===========================================================');
  console.log('LIVE HTTP ENDPOINT TEST: GET /api/v1/profiles/:id LIMITS');
  console.log('===========================================================\n');

  // 1. Find a Free member
  const freeUser = await prisma.user.findFirst({
    where: {
      userRoles: { some: { role: { name: 'MEMBER' } } },
      memberships: { none: { isActive: true, tier: { not: 'FREE' } } },
      profile: { isNot: null },
    },
    include: { profile: true },
  });

  if (!freeUser) throw new Error('No free user found');
  const token = createToken(freeUser, ['MEMBER']);
  console.log(`Free User: ${freeUser.email} (${freeUser.id})`);

  // 2. Find 7 candidate verified profiles
  const candidateProfiles = await prisma.profile.findMany({
    where: {
      userId: { not: freeUser.id },
      user: { isActive: true, deletedAt: null },
      status: 'ACTIVE',
      isVerified: true,
      verificationStatus: 'VERIFIED',
    },
    take: 10,
  });

  if (candidateProfiles.length < 7) {
    throw new Error(`Need at least 7 verified profiles, found ${candidateProfiles.length}`);
  }

  // Ensure setting is 5
  const sysSetting = await prisma.setting.findUnique({ where: { key: 'system_settings' } });
  let settings = {};
  if (sysSetting?.value) {
    try { settings = JSON.parse(sysSetting.value); } catch {}
  }
  settings.freeDailyProfileViewLimit = 5;
  await prisma.setting.upsert({
    where: { key: 'system_settings' },
    update: { value: JSON.stringify(settings) },
    create: { key: 'system_settings', value: JSON.stringify(settings), group: 'GLOBAL', isPublic: true },
  });

  // Clean today's views for this user
  const startOfDay = getStartOfDayUtc('Asia/Kolkata');
  await prisma.profileView.deleteMany({
    where: {
      viewerId: freeUser.id,
      createdAt: { gte: startOfDay },
    },
  });

  console.log('--- TEST A: View first 5 profiles via HTTP API ---');
  for (let i = 0; i < 5; i++) {
    const prof = candidateProfiles[i];
    const res = await fetch(`${BASE_URL}/profiles/${prof.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log(`  HTTP GET /profiles/${prof.id}: status=${res.status}, name="${data.firstName || data.displayName || 'OK'}"`);
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    }
  }
  console.log('PASS: First 5 distinct profile view API requests succeeded (200 OK).\n');

  console.log('--- TEST B: Attempt 6th distinct profile via HTTP API ---');
  const prof6 = candidateProfiles[5];
  const res6 = await fetch(`${BASE_URL}/profiles/${prof6.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data6 = await res6.json();
  console.log(`  HTTP GET /profiles/${prof6.id}: status=${res6.status}, body=`, data6);
  if (res6.status !== 403 || !data6.message?.includes('daily profile view limit')) {
    throw new Error(`Expected 403 Forbidden with limit message, got ${res6.status}`);
  }
  console.log('PASS: 6th distinct profile view blocked with 403 Forbidden via HTTP API!\n');

  console.log('--- TEST C: Refresh previously viewed profile via HTTP API ---');
  const prof1 = candidateProfiles[0];
  const resRepeat = await fetch(`${BASE_URL}/profiles/${prof1.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const dataRepeat = await resRepeat.json();
  console.log(`  HTTP GET (Refresh) /profiles/${prof1.id}: status=${resRepeat.status}, name="${dataRepeat.firstName || dataRepeat.displayName || 'OK'}"`);
  if (resRepeat.status !== 200) {
    throw new Error(`Expected 200 on refresh, got ${resRepeat.status}`);
  }
  console.log('PASS: Refreshing previously viewed profile allowed without extra limit consumption.\n');

  console.log('--- TEST D: Paid user via HTTP API ---');
  const paidUser = await prisma.user.findFirst({
    where: {
      memberships: { some: { isActive: true, tier: { not: 'FREE' }, plan: { price: { gt: 0 } } } },
    },
  });
  if (paidUser) {
    const paidToken = createToken(paidUser, ['MEMBER']);
    const resPaid = await fetch(`${BASE_URL}/profiles/${prof6.id}`, {
      headers: { Authorization: `Bearer ${paidToken}` },
    });
    console.log(`  HTTP GET /profiles/${prof6.id} by Paid User: status=${resPaid.status}`);
    if (resPaid.status !== 200) throw new Error(`Paid user view failed with ${resPaid.status}`);
    console.log('PASS: Paid user successfully viewed profile that was blocked for Free user.\n');
  }

  console.log('===========================================================');
  console.log('ALL LIVE HTTP ENDPOINT TESTS PASSED! ✅');
  console.log('===========================================================');
}

main()
  .catch((e) => {
    console.error('LIVE API TEST FAILED:', e);
    process.exit(1);
  })
  .finally(() => pool.end());
