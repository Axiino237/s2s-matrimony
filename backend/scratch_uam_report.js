const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: 'postgresql://postgres:password@localhost:5432/s2s_matrimony' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: {
        include: { permission: true },
      },
      userRoles: {
        include: { user: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log('=== ROLES & ASSIGNED USERS & PERMISSIONS ===');
  roles.forEach((r) => {
    console.log(`\n🔹 Role: [${r.name}] (${r.displayName})`);
    console.log(`   - Is System: ${r.isSystem}`);
    console.log(`   - Users assigned (${r.userRoles.length}): ${r.userRoles.map((ur) => ur.user.email || ur.user.phone).join(', ')}`);
    console.log(`   - Permissions count: ${r.rolePermissions.length}`);
  });

  const perms = await prisma.permission.findMany({
    include: { module: true },
    orderBy: [{ group: 'asc' }, { name: 'asc' }],
  });

  console.log(`\n=== ALL PERMISSIONS IN DB (${perms.length}) ===`);
  const groupedPerms = {};
  perms.forEach((p) => {
    const grp = p.group || 'General';
    if (!groupedPerms[grp]) groupedPerms[grp] = [];
    groupedPerms[grp].push(`${p.name} (${p.displayName}) [Module: ${p.module?.name || 'N/A'}]`);
  });

  Object.entries(groupedPerms).forEach(([grp, list]) => {
    console.log(`\n📁 Group: ${grp} (${list.length} perms)`);
    list.forEach((item) => console.log(`   • ${item}`));
  });

  const modules = await prisma.module.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  console.log(`\n=== ALL SCREEN MODULES IN DB (${modules.length}) ===`);
  modules.forEach((m) => {
    console.log(`[Order: ${m.sortOrder}] Slug: ${m.slug.padEnd(20)} | Name: ${m.name.padEnd(32)} | Path: ${m.path.padEnd(30)} | Icon: ${m.icon || 'N/A'}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
