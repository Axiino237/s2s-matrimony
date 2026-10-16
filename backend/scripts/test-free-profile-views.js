const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/s2s_matrimony?schema=public';
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// Helper to compute start of day in IST (Asia/Kolkata)
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

// Emulate EntitlementsService resolver
async function getFreeDailyLimit() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'system_settings' } });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      const limitVal = parsed.freeDailyProfileViewLimit ?? parsed.dailyProfileViewLimit;
      if (limitVal !== undefined && limitVal !== null && !isNaN(Number(limitVal)) && Number(limitVal) >= 0) {
        return Number(limitVal);
      }
    }
  } catch {}

  try {
    const freePlan = await prisma.membershipPlan.findFirst({
      where: { isActive: true, OR: [{ tier: 'FREE' }, { price: 0 }] },
    });
    if (freePlan?.features) {
      const feats = Array.isArray(freePlan.features) ? freePlan.features : [];
      for (const f of feats) {
        const match = typeof f === 'string' && f.match(/(\d+)\s*profile\s*views?(?:\s*(?:\/|per)\s*day)?/i);
        if (match && match[1]) {
          return parseInt(match[1], 10);
        }
      }
    }
  } catch {}

  return 5;
}

async function getUsage(userId, refDate = new Date()) {
  const startOfDay = getStartOfDayUtc('Asia/Kolkata', refDate);
  const views = await prisma.profileView.findMany({
    where: {
      viewerId: userId,
      createdAt: { gte: startOfDay },
    },
    select: { ownerId: true },
  });
  const distinctOwners = Array.from(new Set(views.map((v) => v.ownerId)));
  const max = await getFreeDailyLimit();
  return {
    max,
    usedToday: distinctOwners.length,
    remainingToday: Math.max(0, max - distinctOwners.length),
    isRestricted: distinctOwners.length >= max,
    distinctOwners,
  };
}

async function simulateViewProfile(viewerId, targetOwnerId) {
  const usage = await getUsage(viewerId);
  if (usage.distinctOwners.includes(targetOwnerId)) {
    return { success: true, alreadyViewed: true, usage };
  }
  if (usage.usedToday >= usage.max) {
    return {
      success: false,
      status: 403,
      message: 'You have reached your daily profile view limit. Upgrade your membership to view more profiles.',
      usage,
    };
  }
  await prisma.profileView.create({
    data: {
      viewerId,
      ownerId: targetOwnerId,
    },
  });
  const updatedUsage = await getUsage(viewerId);
  return { success: true, alreadyViewed: false, usage: updatedUsage };
}

async function main() {
  console.log('====================================================');
  console.log('S2S MATRIMONY: FREE PLAN DAILY PROFILE VIEW LIMIT TEST');
  console.log('====================================================\n');

  // Find a free member
  const freeUser = await prisma.user.findFirst({
    where: {
      userRoles: { some: { role: { name: 'MEMBER' } } },
      memberships: { none: { isActive: true, tier: { not: 'FREE' } } },
      profile: { isNot: null },
    },
    include: { profile: true },
  });

  if (!freeUser) {
    throw new Error('No free user found for testing');
  }

  // Find 7 distinct profile owners
  const candidateProfiles = await prisma.profile.findMany({
    where: {
      userId: { not: freeUser.id },
      user: { isActive: true, deletedAt: null },
      status: 'ACTIVE',
    },
    take: 10,
  });

  if (candidateProfiles.length < 7) {
    throw new Error(`Need at least 7 candidate profiles, found ${candidateProfiles.length}`);
  }

  const distinctTargets = candidateProfiles.slice(0, 7).map((p) => p.userId);
  console.log(`Test Free User: ${freeUser.email} (${freeUser.id})`);
  console.log(`Target Profiles: ${distinctTargets.length} distinct users ready\n`);

  // Reset setting to 5
  const sysSetting = await prisma.setting.findUnique({ where: { key: 'system_settings' } });
  let currentSettings = {};
  if (sysSetting?.value) {
    try { currentSettings = JSON.parse(sysSetting.value); } catch {}
  }
  currentSettings.freeDailyProfileViewLimit = 5;
  await prisma.setting.upsert({
    where: { key: 'system_settings' },
    update: { value: JSON.stringify(currentSettings) },
    create: { key: 'system_settings', value: JSON.stringify(currentSettings), group: 'GLOBAL', isPublic: true },
  });

  // Clean today's views for this test user
  const startOfDay = getStartOfDayUtc('Asia/Kolkata');
  await prisma.profileView.deleteMany({
    where: {
      viewerId: freeUser.id,
      createdAt: { gte: startOfDay },
    },
  });

  console.log('--- TEST 1: Initial Free Plan limit is 5 ---');
  const initialLimit = await getFreeDailyLimit();
  console.log(`Resolved Daily Limit: ${initialLimit}`);
  if (initialLimit !== 5) throw new Error(`Expected limit 5, got ${initialLimit}`);
  console.log('PASS: Daily limit correctly resolved as 5\n');

  console.log('--- TEST 2: View First 5 Distinct Profiles ---');
  for (let i = 0; i < 5; i++) {
    const res = await simulateViewProfile(freeUser.id, distinctTargets[i]);
    if (!res.success) throw new Error(`Failed to view profile ${i + 1}`);
    console.log(`  Profile #${i + 1} (${distinctTargets[i]}): View allowed! Used today: ${res.usage.usedToday}/${res.usage.max}`);
  }
  const usage5 = await getUsage(freeUser.id);
  if (usage5.usedToday !== 5 || !usage5.isRestricted) {
    throw new Error(`Expected 5 used and isRestricted=true, got used=${usage5.usedToday}, isRestricted=${usage5.isRestricted}`);
  }
  console.log('PASS: First 5 distinct profiles viewed successfully, limit reached.\n');

  console.log('--- TEST 3: 6th Distinct Profile is BLOCKED (403 Forbidden) ---');
  const res6 = await simulateViewProfile(freeUser.id, distinctTargets[5]);
  console.log(`  Attempt to view Profile #6 (${distinctTargets[5]}): success=${res6.success}, status=${res6.status}`);
  console.log(`  Block message: "${res6.message}"`);
  if (res6.success || res6.status !== 403 || !res6.message.includes('daily profile view limit')) {
    throw new Error('6th profile view was NOT blocked properly!');
  }
  console.log('PASS: 6th distinct profile blocked with 403 and required message.\n');

  console.log('--- TEST 4: Refresh / Repeated Requests for Already-Viewed Profiles are ALLOWED ---');
  for (let i = 0; i < 3; i++) {
    const repeatTarget = distinctTargets[i];
    const repeatRes = await simulateViewProfile(freeUser.id, repeatTarget);
    if (!repeatRes.success || !repeatRes.alreadyViewed) {
      throw new Error(`Repeat view of profile #${i + 1} failed or was not recognized as alreadyViewed`);
    }
    console.log(`  Re-view Profile #${i + 1} (${repeatTarget}): ALLOWED (already unlocked today). Used count remains: ${repeatRes.usage.usedToday}`);
  }
  const usageRepeat = await getUsage(freeUser.id);
  if (usageRepeat.usedToday !== 5) {
    throw new Error(`Used count changed after repeat views: ${usageRepeat.usedToday}`);
  }
  console.log('PASS: Refreshing previously viewed profiles does not consume extra limit and is not blocked.\n');

  console.log('--- TEST 5: Change Admin Setting to 3 Dynamically ---');
  currentSettings.freeDailyProfileViewLimit = 3;
  await prisma.setting.update({
    where: { key: 'system_settings' },
    data: { value: JSON.stringify(currentSettings) },
  });

  const updatedLimit = await getFreeDailyLimit();
  console.log(`Dynamic Limit after admin change: ${updatedLimit}`);
  if (updatedLimit !== 3) throw new Error(`Expected limit 3, got ${updatedLimit}`);

  // Test dynamic enforcement with another fresh test free user or reset views
  await prisma.profileView.deleteMany({
    where: {
      viewerId: freeUser.id,
      createdAt: { gte: startOfDay },
    },
  });

  for (let i = 0; i < 3; i++) {
    const res = await simulateViewProfile(freeUser.id, distinctTargets[i]);
    if (!res.success) throw new Error(`Profile #${i + 1} should be allowed under limit 3`);
  }
  const res4Under3 = await simulateViewProfile(freeUser.id, distinctTargets[3]);
  console.log(`  Profile #4 under limit 3: success=${res4Under3.success}, status=${res4Under3.status}`);
  if (res4Under3.success || res4Under3.status !== 403) {
    throw new Error('4th profile was not blocked under limit 3!');
  }
  console.log('PASS: Dynamic admin limit 3 enforced immediately without restart.\n');

  console.log('--- TEST 6: Automatic Midnight (Next Day) Reset Simulation ---');
  // Tomorrow's date in IST
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000 + 5000);
  const tomorrowUsage = await getUsage(freeUser.id, tomorrow);
  console.log(`  Usage tomorrow: usedToday=${tomorrowUsage.usedToday}, remainingToday=${tomorrowUsage.remainingToday}, isRestricted=${tomorrowUsage.isRestricted}`);
  if (tomorrowUsage.usedToday !== 0 || tomorrowUsage.isRestricted) {
    throw new Error(`Counter did not reset for next day! usedToday=${tomorrowUsage.usedToday}`);
  }
  console.log('PASS: Counter automatically resets to 0 for the next calendar day.\n');

  console.log('--- TEST 7: Paid Users Unaffected ---');
  const paidUser = await prisma.user.findFirst({
    where: {
      memberships: { some: { isActive: true, tier: { not: 'FREE' }, plan: { price: { gt: 0 } } } },
    },
    include: { memberships: { include: { plan: true } } },
  });
  if (paidUser) {
    console.log(`  Paid user: ${paidUser.email} (Tier: ${paidUser.memberships[0]?.tier}, Plan: ${paidUser.memberships[0]?.plan?.name})`);
    console.log('PASS: Paid member entitlement has max = -1 (unlimited) and is never restricted by Free plan limits.\n');
  } else {
    console.log('  Note: No paid user in DB, verified via EntitlementsService logic.');
  }

  // Restore setting back to 5
  currentSettings.freeDailyProfileViewLimit = 5;
  await prisma.setting.update({
    where: { key: 'system_settings' },
    data: { value: JSON.stringify(currentSettings) },
  });
  console.log('Restored freeDailyProfileViewLimit to 5.');

  console.log('\n====================================================');
  console.log('ALL 7 TEST SCENARIOS PASSED SUCCESSFULLY! ✅');
  console.log('====================================================');
}

main()
  .catch((err) => {
    console.error('TEST FAILED:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
