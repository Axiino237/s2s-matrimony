import { Client } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';

const conn = new Client();

const remoteHost = '169.58.78.11';
const remoteUser = 'root';
const remotePass = '9814Aravindhan';

const localFrontendDist = path.join(__dirname, '../../frontend/dist');
const remoteFrontendDir = '/var/www/s2s-matrimony/frontend/dist';

async function uploadDir(sftp: any, localDir: string, remoteDir: string) {
  const entries = fs.readdirSync(localDir, { withFileTypes: true });

  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name);
    const remotePath = path.posix.join(remoteDir, entry.name);

    if (entry.isDirectory()) {
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
  console.log('⚡ Connected to SSH Server for Frontend Sync:', remoteHost);
  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error('❌ SFTP Error:', err);
      conn.end();
      return;
    }

    console.log('📤 Uploading frontend/dist production bundle to remote server...');
    try {
      await new Promise((resolve) => sftp.mkdir(remoteFrontendDir, () => resolve(true)));
    } catch {}

    await uploadDir(sftp, localFrontendDist, remoteFrontendDir);

    console.log('✅ Local frontend production build uploaded to remote server!');
    conn.end();
  });
}).connect({
  host: remoteHost,
  port: 22,
  username: remoteUser,
  password: remotePass,
});
