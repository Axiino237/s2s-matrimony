import { Client } from 'ssh2';

const conn = new Client();

const commands = [
  'echo "=== STEP 1: PUSH PRISMA SCHEMA ON REMOTE SERVER ==="',
  'cd /var/www/s2s-matrimony/backend && npx prisma db push --accept-data-loss',
  'echo "=== STEP 2: RESTORE LOCAL DATABASE DUMP ==="',
  'docker exec -i s2s_postgres psql -U postgres -d s2s_matrimony < /var/www/s2s-matrimony/s2s_matrimony_dump.sql',
  'echo "=== STEP 3: RESTART S2S PM2 BACKEND ==="',
  'pm2 restart s2s-backend',
  'pm2 status s2s-backend',
].join(' && ');

conn.on('ready', () => {
  console.log('⚡ Running Prisma DB Push & Data Import on Remote Server...');
  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error('Execution error:', err);
      conn.end();
      return;
    }
    let output = '';
    stream
      .on('close', () => {
        console.log('\n=================== DEPLOYMENT & RESTORE LOG ===================\n');
        console.log(output);
        console.log('\n=================================================================\n');
        conn.end();
      })
      .on('data', (data: Buffer) => {
        output += data.toString();
      })
      .stderr.on('data', (data: Buffer) => {
        output += '[STDERR] ' + data.toString();
      });
  });
}).connect({
  host: '169.58.78.11',
  port: 22,
  username: 'root',
  password: '9814Aravindhan',
});
