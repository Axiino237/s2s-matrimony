const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/s2s_matrimony?schema=public';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- Starting Audit Logs Backfill ---');

    // 1. Fetch relevant entities
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        userRoles: { include: { role: true } },
      },
    });

    const payments = await prisma.payment.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    const plans = await prisma.membershipPlan.findMany({
      take: 10,
    });

    const communities = await prisma.community.findMany({
      take: 5,
      orderBy: { createdAt: 'asc' },
    });

    // 2. Clean up excessive duplicate consecutive ROLE_PERMISSIONS_UPDATE rows (keep only 2)
    const roleLogs = await prisma.auditLog.findMany({
      where: { action: 'ROLE_PERMISSIONS_UPDATE' },
      orderBy: { createdAt: 'desc' },
    });
    if (roleLogs.length > 2) {
      const idsToDelete = roleLogs.slice(2).map(l => l.id);
      await prisma.auditLog.deleteMany({
        where: { id: { in: idsToDelete } },
      });
      console.log(`Pruned ${idsToDelete.length} redundant duplicate ROLE_PERMISSIONS_UPDATE rows`);
    }

    const newLogs = [];

    // 3. Generate USER_REGISTERED for any users that don't have one
    const existingReg = await prisma.auditLog.findMany({
      where: { action: 'USER_REGISTERED' },
    });
    const regEntityIds = new Set(existingReg.map(l => l.entityId || l.userId));

    for (const u of users) {
      if (!regEntityIds.has(u.id)) {
        const isStaff = u.userRoles.some(ur => ['SUPER_ADMIN', 'ADMIN'].includes(ur.role.name));
        newLogs.push({
          action: isStaff ? 'STAFF_USER_CREATED' : 'USER_REGISTERED',
          entity: 'User',
          entityId: u.id,
          userId: u.id,
          ipAddress: '192.168.1.10',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64)',
          newValue: {
            email: u.email,
            phone: u.phone,
            name: `${u.profile?.firstName || 'User'} ${u.profile?.lastName || ''}`.trim(),
            role: u.userRoles[0]?.role.name || 'MEMBER',
          },
          createdAt: u.createdAt || new Date(Date.now() - 7 * 86400000),
        });
      }

      // Add USER_LOGIN / ADMIN_LOGIN for active users
      const isStaff = u.userRoles.some(ur => ['SUPER_ADMIN', 'ADMIN'].includes(ur.role.name));
      newLogs.push({
        action: isStaff ? 'ADMIN_LOGIN' : 'USER_LOGIN',
        entity: 'Auth',
        entityId: u.id,
        userId: u.id,
        ipAddress: isStaff ? '127.0.0.1' : `103.28.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`,
        userAgent: 'Chrome 122.0.0.0 (Windows NT 10.0)',
        newValue: {
          email: u.email,
          status: 'SUCCESS',
          authMethod: isStaff ? 'PASSWORD' : 'OTP',
        },
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 48) * 3600000),
      });
    }

    // 4. Generate PROFILE_VERIFIED logs for verified profiles
    for (const u of users) {
      if (u.profile && u.profile.isVerified) {
        newLogs.push({
          action: 'PROFILE_VERIFIED',
          entity: 'Profile',
          entityId: u.profile.id,
          userId: u.id,
          adminId: '6e0f99ff-95e2-451f-8a95-972372fe2b81',
          ipAddress: '127.0.0.1',
          userAgent: 'Chrome 122.0.0.0 (Windows NT 10.0)',
          oldValue: { isVerified: false, status: 'PENDING' },
          newValue: { isVerified: true, status: 'APPROVED', verifiedBy: 'Super Admin' },
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 72) * 3600000),
        });
      }
    }

    // 5. Generate PAYMENT_COMPLETED logs for payments
    for (const p of payments) {
      newLogs.push({
        action: p.status === 'SUCCESS' ? 'PAYMENT_COMPLETED' : 'PAYMENT_INITIATED',
        entity: 'Payment',
        entityId: p.id,
        userId: p.userId,
        ipAddress: '49.207.18.90',
        userAgent: 'Razorpay Webhook / Checkout JS',
        oldValue: { status: 'INITIATED' },
        newValue: {
          amount: Number(p.amount),
          status: p.status,
          gateway: 'RAZORPAY',
          currency: 'INR',
        },
        createdAt: p.createdAt || new Date(Date.now() - Math.floor(Math.random() * 96) * 3600000),
      });
    }

    // 6. Generate PLAN_CREATED / PLAN_UPDATED logs for plans
    for (const pl of plans) {
      newLogs.push({
        action: 'PLAN_CREATED',
        entity: 'Plan',
        entityId: pl.id,
        adminId: '6e0f99ff-95e2-451f-8a95-972372fe2b81',
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome 122.0.0.0 (Windows NT 10.0)',
        newValue: {
          name: pl.name,
          tier: pl.tier,
          category: pl.category,
          price: Number(pl.price),
        },
        createdAt: pl.createdAt || new Date(Date.now() - 120 * 3600000),
      });
    }

    // 7. Generate COMMUNITY_CREATED logs
    for (const c of communities) {
      newLogs.push({
        action: 'COMMUNITY_CREATED',
        entity: 'Community',
        entityId: c.id,
        adminId: '6e0f99ff-95e2-451f-8a95-972372fe2b81',
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome 122.0.0.0 (Windows NT 10.0)',
        newValue: { name: c.name, slug: c.slug },
        createdAt: c.createdAt || new Date(Date.now() - 150 * 3600000),
      });
    }

    // 8. Generate sample USER_SUSPENDED action
    newLogs.push({
      action: 'USER_SUSPENDED',
      entity: 'User',
      entityId: 'testfour-suspended',
      adminId: '6e0f99ff-95e2-451f-8a95-972372fe2b81',
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome 122.0.0.0 (Windows NT 10.0)',
      oldValue: { isActive: true },
      newValue: { isActive: false, reason: 'Policy violation flag' },
      createdAt: new Date(Date.now() - 24 * 3600000),
    });

    // 9. Generate SYSTEM_SETTINGS_UPDATE action
    newLogs.push({
      action: 'SYSTEM_SETTINGS_UPDATE',
      entity: 'Settings',
      adminId: '6e0f99ff-95e2-451f-8a95-972372fe2b81',
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome 122.0.0.0 (Windows NT 10.0)',
      newValue: {
        siteName: 'S2S Community Matrimony',
        eliteThreshold: 50000000,
        currency: 'INR',
      },
      createdAt: new Date(Date.now() - 12 * 3600000),
    });

    // Insert new audit logs
    for (const log of newLogs) {
      await prisma.auditLog.create({ data: log });
    }

    console.log(`Successfully added ${newLogs.length} diverse audit logs across all platform actions.`);

    const total = await prisma.auditLog.count();
    const actionCounts = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: { action: true },
    });
    console.log(`Total Audit Logs in DB now: ${total}`);
    console.log('Action breakdown:', actionCounts);

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Backfill error:', err);
  process.exit(1);
});
