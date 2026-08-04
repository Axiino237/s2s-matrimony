import { Client } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';

const conn = new Client();

const remoteHost = '169.58.78.11';
const remoteUser = 'root';
const remotePass = '9814Aravindhan';

const localBackendDir = path.join(__dirname, '..');
const remoteBackendDir = '/var/www/s2s-matrimony/backend';

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
      await new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, (err: any) => {
          if (err) resolve(false);
          else resolve(true);
        });
      });
    }
  }
}

conn.on('ready', () => {
  console.log('⚡ Connected to SSH Server for Code Sync:', remoteHost);
  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error('❌ SFTP Error:', err);
      conn.end();
      return;
    }

    console.log('📤 Uploading backend/src and backend/prisma files to remote server...');
    const srcLocal = path.join(localBackendDir, 'src');
    const srcRemote = path.posix.join(remoteBackendDir, 'src');

    const prismaLocal = path.join(localBackendDir, 'prisma');
    const prismaRemote = path.posix.join(remoteBackendDir, 'prisma');

    await uploadDir(sftp, srcLocal, srcRemote);
    await uploadDir(sftp, prismaLocal, prismaRemote);

    console.log('✅ Local backend source code synced to remote server!');
    conn.end();
  });
}).connect({
  host: remoteHost,
  port: 22,
  username: remoteUser,
  password: remotePass,
});
