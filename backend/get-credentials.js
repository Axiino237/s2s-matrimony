const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/s2s_matrimony' });
  await client.connect();

  console.log('\n=== USERS WITH ROLES ===');
  const users = await client.query(`
    SELECT u.id, u.email, u.phone, u."isActive", u."passwordHash",
           COALESCE(r.name, 'MEMBER') as role
    FROM users u
    LEFT JOIN user_roles ur ON ur."userId" = u.id
    LEFT JOIN roles r ON r.id = ur."roleId"
    ORDER BY r.name DESC NULLS LAST
    LIMIT 20
  `);
  users.rows.forEach(row => {
    console.log(`Role: ${row.role} | Phone: ${row.phone} | Email: ${row.email} | Active: ${row.isActive} | HasPassword: ${!!row.passwordHash}`);
  });

  console.log('\n=== ROLES TABLE ===');
  const roles = await client.query(`SELECT id, name, "displayName", "isSystem" FROM roles ORDER BY name`);
  roles.rows.forEach(row => console.log(JSON.stringify(row)));

  await client.end();
}

main().catch(console.error);
