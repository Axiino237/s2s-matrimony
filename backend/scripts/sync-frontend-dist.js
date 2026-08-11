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
const localFrontendDist = path.join(__dirname, '../../frontend/dist');
const remoteFrontendDir = '/var/www/s2s-matrimony/frontend/dist';
async function uploadDir(sftp, localDir, remoteDir) {
    const entries = fs.readdirSync(localDir, { withFileTypes: true });
    for (const entry of entries) {
        const localPath = path.join(localDir, entry.name);
        const remotePath = path.posix.join(remoteDir, entry.name);
        if (entry.isDirectory()) {
            try {
                await new Promise((resolve) => sftp.mkdir(remotePath, () => resolve(true)));
            }
            catch { }
            await uploadDir(sftp, localPath, remotePath);
        }
        else {
            await new Promise((resolve, reject) => {
                sftp.fastPut(localPath, remotePath, (err) => {
                    if (err)
                        resolve(false);
                    else
                        resolve(true);
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
        }
        catch { }
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
//# sourceMappingURL=sync-frontend-dist.js.map