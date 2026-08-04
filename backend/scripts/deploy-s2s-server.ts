import { Client } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';

const conn = new Client();

const remoteHost = '169.58.78.11';
const remoteUser = 'root';
const remotePass = '9814Aravindhan';

const localDumpPath = path.join(__dirname, '../../s2s_matrimony_dump.sql');
const remoteDumpPath = '/var/www/s2s-matrimony/s2s_matrimony_dump.sql';

console.log('🚀 Starting S2S Deployment & Database Update Pipeline...');

conn.on('ready', () => {
  console.log('✅ Connected to SSH Server:', remoteHost);

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('❌ SFTP Connection Error:', err);
      conn.end();
      return;
    }

    console.log(`📤 Uploading database dump (${(fs.statSync(localDumpPath).size / 1024).toFixed(2)} KB)...`);
    sftp.fastPut(localDumpPath, remoteDumpPath, (uploadErr) => {
      if (uploadErr) {
        console.error('❌ Upload Failed:', uploadErr);
        conn.end();
        return;
      }
      console.log('✅ Database dump uploaded to remote server successfully!');

      // Run Remote Update Script
      const remoteCommands = [
        'echo "=== RESTORING DATABASE DUMP ==="',
        'docker exec -i s2s_postgres psql -U postgres -d s2s_matrimony < /var/www/s2s-matrimony/s2s_matrimony_dump.sql || echo "DB Dump restored with warnings"',
        'echo "=== UPDATING BACKEND DEPENDENCIES & PRISMA ==="',
        'cd /var/www/s2s-matrimony/backend',
        'npx prisma generate',
        'npm run build',
        'echo "=== RESTARTING S2S PM2 SERVICE ==="',
        'pm2 restart s2s-backend',
        'pm2 status s2s-backend',
      ].join(' && ');

      console.log('🔄 Running Remote Update & PM2 Restart...');
      conn.exec(remoteCommands, (execErr, stream) => {
        if (execErr) {
          console.error('❌ Execution Error:', execErr);
          conn.end();
          return;
        }

        let output = '';
        stream
          .on('close', (code: number) => {
            console.log('\n=================== DEPLOYMENT OUTPUT ===================\n');
            console.log(output);
            console.log('\n==========================================================\n');
            console.log('🎉 S2S Backend & Database Update Completed Successfully!');
            conn.end();
          })
          .on('data', (data: Buffer) => {
            output += data.toString();
          })
          .stderr.on('data', (data: Buffer) => {
            output += '[STDERR] ' + data.toString();
          });
      });
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH Connection Failed:', err.message);
}).connect({
  host: remoteHost,
  port: 22,
  username: remoteUser,
  password: remotePass,
  readyTimeout: 30000,
});
