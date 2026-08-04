import { Client } from 'ssh2';

const conn = new Client();

const commands = [
  'echo "=== SYSTEM UPTIME & LOAD ===" && uptime',
  'echo "=== MEMORY / RAM USAGE ===" && free -h',
  'echo "=== DISK SPACE USAGE ===" && df -h',
  'echo "=== CPU & TOP PROCESSES ===" && ps aux --sort=-%cpu | head -n 12',
  'echo "=== TOP MEMORY PROCESSES ===" && ps aux --sort=-%mem | head -n 12',
  'echo "=== RUNNING DOCKER CONTAINERS ===" && (docker ps 2>/dev/null || echo "Docker not running / not installed")',
  'echo "=== PM2 PROCESS STATUS ===" && (pm2 status 2>/dev/null || echo "PM2 not installed / not running")',
  'echo "=== ACTIVE LISTENING PORTS ===" && (ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null || echo "Network ports check unavailable")',
].join(' && ');

console.log('Connecting to SSH server 169.58.78.11 as root...');

conn.on('ready', () => {
  console.log('✅ SSH Connection established successfully!');
  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error('Execution error:', err);
      conn.end();
      return;
    }
    let output = '';
    stream
      .on('close', (code: number, signal: string) => {
        console.log('\n=================== SERVER STATUS REPORT ===================\n');
        console.log(output);
        console.log('\n============================================================\n');
        conn.end();
      })
      .on('data', (data: Buffer) => {
        output += data.toString();
      })
      .stderr.on('data', (data: Buffer) => {
        output += '[STDERR] ' + data.toString();
      });
  });
}).on('error', (err) => {
  console.error('❌ SSH Connection Failed:', err.message);
}).connect({
  host: '169.58.78.11',
  port: 22,
  username: 'root',
  password: '9814Aravindhan',
  readyTimeout: 20000,
});
