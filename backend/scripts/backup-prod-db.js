const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const YYYY = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const DD = pad(now.getDate());
  const HH = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${YYYY}${MM}${DD}_${HH}${mm}${ss}`;
}

async function runBackup() {
  const timestamp = getTimestamp();
  const dumpFilename = `s2s_matrimony_${timestamp}.dump`;
  const remoteTempPath = `/tmp/${dumpFilename}`;
  const localBackupDir = path.resolve('D:/s2s-matrimony/backups');
  const localDumpPath = path.join(localBackupDir, dumpFilename);

  console.log('====================================================');
  console.log('🚀 S2S Matrimony Database Backup Process Initiated');
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Target Filename: ${dumpFilename}`);
  console.log(`Remote Temp Path: ${remoteTempPath}`);
  console.log(`Local Backup Path: ${localDumpPath}`);
  console.log('====================================================');

  if (!fs.existsSync(localBackupDir)) {
    fs.mkdirSync(localBackupDir, { recursive: true });
  }

  if (fs.existsSync(localDumpPath)) {
    throw new Error(`Safety violation: Local backup file ${localDumpPath} already exists! Aborting.`);
  }

  const deployPassword = process.env.DEPLOY_PASSWORD;

  if (!deployPassword) {
    throw new Error('DEPLOY_PASSWORD environment variable is required.');
  }

  const conn = new Client();

  await new Promise((resolve, reject) => {
    conn.on('ready', () => {
      console.log('✅ Connected to production server (169.58.37.167) via SSH');
      resolve();
    });
    conn.on('error', (err) => {
      reject(new Error(`SSH Connection failed: ${err.message}`));
    });
    conn.connect({
      host: '169.58.37.167',
      port: 22,
      username: 'root',
      password: deployPassword,
      readyTimeout: 20000,
    });
  });

  const execRemote = (command) => {
    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) return reject(err);
        let stdout = '';
        let stderr = '';
        stream
          .on('close', (code) => {
            if (code !== 0) {
              return reject(new Error(`Command failed with exit code ${code}: ${stderr || stdout}`));
            }
            resolve({ stdout, stderr, code });
          })
          .on('data', (d) => { stdout += d.toString(); })
          .stderr.on('data', (d) => { stderr += d.toString(); });
      });
    });
  };

  try {
    // 1. Verify remote file does not exist
    console.log('\n[1/5] Checking remote server safety prerequisites...');
    const checkFile = await execRemote(`[ -f "${remoteTempPath}" ] && echo "EXISTS" || echo "CLEAN"`);
    if (checkFile.stdout.trim() === 'EXISTS') {
      throw new Error(`Safety violation: Remote path ${remoteTempPath} already exists!`);
    }

    // 2. Run pg_dump on server
    console.log('\n[2/5] Creating consistent PostgreSQL dump on server via pg_dump...');
    // We use sudo -u postgres pg_dump -d s2s_matrimony -F c -b -v -f ...
    const dumpCmd = `sudo -u postgres pg_dump -d s2s_matrimony -F c -b -f "${remoteTempPath}"`;
    await execRemote(dumpCmd);
    console.log('✅ Database dump completed successfully on remote server.');

    // Check remote file size
    const statRes = await execRemote(`stat -c %s "${remoteTempPath}"`);
    const remoteSizeBytes = parseInt(statRes.stdout.trim(), 10);
    console.log(`Remote dump file size: ${remoteSizeBytes} bytes (${(remoteSizeBytes / 1024 / 1024).toFixed(2)} MB)`);

    if (isNaN(remoteSizeBytes) || remoteSizeBytes <= 0) {
      throw new Error(`Remote dump created but file size is invalid: ${statRes.stdout}`);
    }

    // 3. SFTP transfer
    console.log('\n[3/5] Transferring dump file to local machine via SFTP...');
    await new Promise((resolve, reject) => {
      conn.sftp((err, sftp) => {
        if (err) return reject(err);
        sftp.fastGet(remoteTempPath, localDumpPath, {}, (downloadErr) => {
          if (downloadErr) return reject(downloadErr);
          resolve();
        });
      });
    });
    console.log(`✅ File transferred successfully to ${localDumpPath}`);

    // 4. Verify local file
    console.log('\n[4/5] Verifying local backup file and inspecting archive...');
    if (!fs.existsSync(localDumpPath)) {
      throw new Error(`Local file ${localDumpPath} does not exist after transfer!`);
    }

    const localStats = fs.statSync(localDumpPath);
    console.log(`Local file size: ${localStats.size} bytes (${(localStats.size / 1024 / 1024).toFixed(2)} MB)`);

    if (localStats.size !== remoteSizeBytes) {
      throw new Error(`Size mismatch: Remote is ${remoteSizeBytes} bytes, but Local is ${localStats.size} bytes!`);
    }

    // Inspect dump with pg_restore --list using local docker postgres:16-alpine
    console.log('\nInspecting archive table of contents with pg_restore --list...');
    const dockerCmd = `docker run --rm -v "${localBackupDir}:/backups" postgres:16-alpine pg_restore --list "/backups/${dumpFilename}"`;
    const restoreListOutput = execSync(dockerCmd, { encoding: 'utf8' });

    const lines = restoreListOutput.split('\n').filter(l => l.trim().length > 0 && !l.startsWith(';'));
    console.log(`✅ pg_restore --list successfully parsed archive.`);
    console.log(`Total database objects in TOC: ${lines.length}`);

    // Print object breakdown
    const tables = lines.filter(l => l.includes(' TABLE '));
    const sequences = lines.filter(l => l.includes(' SEQUENCE '));
    const constraints = lines.filter(l => l.includes(' CONSTRAINT '));
    const indexes = lines.filter(l => l.includes(' INDEX '));

    console.log(`  - Tables: ${tables.length}`);
    console.log(`  - Sequences: ${sequences.length}`);
    console.log(`  - Constraints / Foreign Keys: ${constraints.length}`);
    console.log(`  - Indexes: ${indexes.length}`);

    // 5. Cleanup temporary server-side dump
    console.log('\n[5/5] Cleaning up temporary server-side dump file...');
    await execRemote(`rm -f "${remoteTempPath}"`);

    // Verify it is gone
    const verifyRemoval = await execRemote(`[ -f "${remoteTempPath}" ] && echo "STILL_EXISTS" || echo "REMOVED"`);
    if (verifyRemoval.stdout.trim() !== 'REMOVED') {
      console.warn(`⚠️ Warning: Server temporary file might still exist at ${remoteTempPath}`);
    } else {
      console.log('✅ Temporary server-side file successfully removed.');
    }

    console.log('\n====================================================');
    console.log('🎉 SUCCESS: Database backup and verification complete!');
    console.log(`Local backup path: ${localDumpPath}`);
    console.log(`Local file size: ${(localStats.size / 1024 / 1024).toFixed(2)} MB (${localStats.size} bytes)`);
    console.log(`Server temporary file removed: YES`);
    console.log('====================================================');
  } finally {
    conn.end();
  }
}

runBackup().catch((err) => {
  console.error('\n❌ Backup pipeline failed:', err);
  process.exit(1);
});
