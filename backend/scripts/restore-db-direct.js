"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ssh2_1 = require("ssh2");
const conn = new ssh2_1.Client();
const commands = [
    'echo "=== STEP 1: PUSH PRISMA SCHEMA TO CREATE ALL 51 TABLES ==="',
    'cd /var/www/s2s-matrimony/backend && npx prisma db push --accept-data-loss',
    'echo "=== STEP 2: IMPORT ALL LOCAL DATA INTO s2s_postgres CONTAINER ==="',
    'docker exec -i s2s_postgres psql -U postgres -d s2s_matrimony < /var/www/s2s-matrimony/s2s_matrimony_dump.sql',
    'echo "=== STEP 3: RESTART S2S BACKEND ==="',
    'pm2 restart s2s-backend',
    'pm2 status s2s-backend',
].join(' && ');
conn.on('ready', () => {
    console.log('⚡ Pushing Prisma Schema and Restoring Data to Remote Database...');
    conn.exec(commands, (err, stream) => {
        if (err) {
            console.error('Execution error:', err);
            conn.end();
            return;
        }
        let output = '';
        stream
            .on('close', () => {
            console.log('\n=================== RESTORE RESULT ===================\n');
            console.log(output);
            console.log('\n======================================================\n');
            conn.end();
        })
            .on('data', (data) => {
            output += data.toString();
        })
            .stderr.on('data', (data) => {
            output += '[STDERR] ' + data.toString();
        });
    });
}).connect({
    host: '169.58.78.11',
    port: 22,
    username: 'root',
    password: '9814Aravindhan',
});
//# sourceMappingURL=restore-db-direct.js.map