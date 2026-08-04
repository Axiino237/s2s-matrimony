import { Client } from 'ssh2';

const conn = new Client();

const commands = [
  'echo "=== TESTING NGINX CONFIG & RELOADING ==="',
  'nginx -t',
  'systemctl reload nginx',
  'echo "=== CHECKING S2S BACKEND PM2 STATUS ==="',
  'pm2 status s2s-backend',
].join(' && ');

conn.on('ready', () => {
  console.log('⚡ Reloading Nginx on remote server...');
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
