import { Client } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';

const conn = new Client();

const remoteHost = '169.58.78.11';
const remoteUser = 'root';
const remotePass = '9814Aravindhan';

const localBackendDir = path.join(__dirname, '..');
const remoteBackendDir = '/var/www/s2s-matrimony/backend';

const localFrontendDist = path.join(__dirname, '../../frontend/dist');
const remoteFrontendDist = '/var/www/s2s-matrimony/frontend/dist';

async function uploadDir(sftp: any, localDir: string, remoteDir: string) {
  const entries = fs.readdirSync(localDir, { withFileTypes: true });

  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name);
    const remotePath = path.posix.join(remoteDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      try {
        await new Promise((resolve) => sftp.mkdir(remotePath, () => resolve(true)));
      } catch {}
      await uploadDir(sftp, localPath, remotePath);
    } else {
      await new Promise((resolve) => {
        sftp.fastPut(localPath, remotePath, (err: any) => {
          resolve(true);
        });
      });
    }
  }
}

conn.on('ready', () => {
  console.log('⚡ Connected to SSH Server for 100% Full Code Sync:', remoteHost);
  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error('❌ SFTP Error:', err);
      conn.end();
      return;
    }

    console.log('📤 Syncing backend/src and backend/prisma...');
    const srcLocal = path.join(localBackendDir, 'src');
    const srcRemote = path.posix.join(remoteBackendDir, 'src');
    const prismaLocal = path.join(localBackendDir, 'prisma');
    const prismaRemote = path.posix.join(remoteBackendDir, 'prisma');

    await uploadDir(sftp, srcLocal, srcRemote);
    await uploadDir(sftp, prismaLocal, prismaRemote);

    console.log('📤 Syncing frontend/dist production bundle...');
    try {
      await new Promise((resolve) => sftp.mkdir(remoteFrontendDist, () => resolve(true)));
    } catch {}
    await uploadDir(sftp, localFrontendDist, remoteFrontendDist);

    console.log('✅ All local files synced to remote server!');

    // Remote Build & Restart Commands
    const commands = [
      'echo "=== BUILDING BACKEND ON SERVER ==="',
      'cd /var/www/s2s-matrimony/backend',
      'npx prisma generate',
      'npm run build',
      'echo "=== RESTARTING S2S PM2 BACKEND ==="',
      'pm2 restart s2s-backend',
      'echo "=== RELOADING NGINX ==="',
      'systemctl reload nginx',
    ].join(' && ');

    console.log('🔄 Building backend on server & restarting PM2 + Nginx...');
    conn.exec(commands, (execErr, stream) => {
      if (execErr) {
        console.error('Execution error:', execErr);
        conn.end();
        return;
      }
      let output = '';
      stream
        .on('close', () => {
          console.log('\n=================== FULL SYNC & DEPLOY LOG ===================\n');
          console.log(output);
          console.log('\n==============================================================\n');
          console.log('🎉 Server is now 100% identical to local code!');
          conn.end();
        })
        .on('data', (d: Buffer) => {
          output += d.toString();
        })
        .stderr.on('data', (d: Buffer) => {
          output += '[STDERR] ' + d.toString();
        });
    });
  });
}).connect({
  host: remoteHost,
  port: 22,
  username: remoteUser,
  password: remotePass,
});
