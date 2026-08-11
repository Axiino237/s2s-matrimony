"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ssh2_1 = require("ssh2");
const pg_1 = require("pg");
const localPool = new pg_1.Pool({
    connectionString: 'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public',
});
async function fixLocalUserRoles() {
    console.log('🔧 Fixing user_roles in Local Database...');
    const client = await localPool.connect();
    try {
        const rolesRes = await client.query('SELECT id, name FROM roles');
        const rolesMap = {};
        rolesRes.rows.forEach((r) => {
            rolesMap[r.name] = r.id;
        });
        const usersRes = await client.query('SELECT id, email FROM users');
        for (const u of usersRes.rows) {
            let roleName = 'MEMBER';
            if (u.email === 'superadmin@s2smatrimony.com')
                roleName = 'SUPER_ADMIN';
            else if (u.email === 'admin@s2smatrimony.com')
                roleName = 'ADMIN';
            const roleId = rolesMap[roleName];
            if (roleId) {
                await client.query(`
          INSERT INTO user_roles ("id", "userId", "roleId")
          VALUES (gen_random_uuid(), $1, $2)
          ON CONFLICT ("userId", "roleId") DO NOTHING;
        `, [u.id, roleId]);
                console.log(`   ✓ Assigned role ${roleName} to ${u.email}`);
            }
        }
    }
    catch (e) {
        console.error('Error fixing local user_roles:', e);
    }
    finally {
        client.release();
        await localPool.end();
    }
}
function fixRemoteUserRoles() {
    return new Promise((resolve) => {
        console.log('🔧 Fixing user_roles in Remote Database (169.58.78.11)...');
        const conn = new ssh2_1.Client();
        const sqlCommands = `
      INSERT INTO user_roles ("id", "userId", "roleId")
      SELECT gen_random_uuid(), u.id, r.id 
      FROM users u, roles r 
      WHERE u.email = 'superadmin@s2smatrimony.com' AND r.name = 'SUPER_ADMIN'
      ON CONFLICT ("userId", "roleId") DO NOTHING;

      INSERT INTO user_roles ("id", "userId", "roleId")
      SELECT gen_random_uuid(), u.id, r.id 
      FROM users u, roles r 
      WHERE u.email = 'admin@s2smatrimony.com' AND r.name = 'ADMIN'
      ON CONFLICT ("userId", "roleId") DO NOTHING;

      INSERT INTO user_roles ("id", "userId", "roleId")
      SELECT gen_random_uuid(), u.id, r.id 
      FROM users u, roles r 
      WHERE u.email NOT IN ('superadmin@s2smatrimony.com', 'admin@s2smatrimony.com') AND r.name = 'MEMBER'
      ON CONFLICT ("userId", "roleId") DO NOTHING;
    `;
        const cmd = `docker exec -i s2s_postgres psql -U postgres -d s2s_matrimony -c "${sqlCommands.replace(/\n/g, ' ')}"`;
        conn.on('ready', () => {
            conn.exec(cmd, (err, stream) => {
                if (err) {
                    console.error(err);
                    conn.end();
                    resolve(false);
                    return;
                }
                let output = '';
                stream
                    .on('close', () => {
                    console.log('✅ Remote user_roles updated successfully!');
                    console.log(output);
                    conn.end();
                    resolve(true);
                })
                    .on('data', (d) => {
                    output += d.toString();
                })
                    .stderr.on('data', (d) => {
                    output += '[STDERR] ' + d.toString();
                });
            });
        }).connect({
            host: '169.58.78.11',
            port: 22,
            username: 'root',
            password: '9814Aravindhan',
        });
    });
}
async function main() {
    await fixLocalUserRoles();
    await fixRemoteUserRoles();
    console.log('🎉 Role assignments completed for both Local & Remote!');
}
main();
//# sourceMappingURL=fix-db-user-roles.js.map