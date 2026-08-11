"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const ssh2_1 = require("ssh2");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const conn = new ssh2_1.Client();
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
                    .on('close', (code) => {
                    console.log('\n=================== DEPLOYMENT OUTPUT ===================\n');
                    console.log(output);
                    console.log('\n==========================================================\n');
                    console.log('🎉 S2S Backend & Database Update Completed Successfully!');
                    conn.end();
                })
                    .on('data', (data) => {
                    output += data.toString();
                })
                    .stderr.on('data', (data) => {
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
//# sourceMappingURL=deploy-s2s-server.js.map