"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ssh2_1 = require("ssh2");
const conn = new ssh2_1.Client();
const commands = [
    'echo "=== CHECKING NGINX SITE CONFIGS ==="',
    'cat /etc/nginx/sites-enabled/* 2>/dev/null || cat /etc/nginx/conf.d/* 2>/dev/null || cat /etc/nginx/nginx.conf',
].join(' && ');
conn.on('ready', () => {
    conn.exec(commands, (err, stream) => {
        if (err) {
            console.error(err);
            conn.end();
            return;
        }
        let output = '';
        stream
            .on('close', () => {
            console.log(output);
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
//# sourceMappingURL=get-nginx-url.js.map