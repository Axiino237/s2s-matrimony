import { Client } from 'ssh2';

const conn = new Client();

const commands = [
  'echo "=== CHECKING /var/www/s2s-matrimony ===" && ls -la /var/www/s2s-matrimony',
  'echo "=== CHECKING GIT IN /var/www/s2s-matrimony ===" && (cd /var/www/s2s-matrimony && git status 2>/dev/null || echo "Not a git repo or no git")',
  'echo "=== CHECKING DOCKER / POSTGRES ENV ===" && (cat /var/www/s2s-matrimony/backend/.env 2>/dev/null || echo "No .env found")',
].join(' && ');

conn.on('ready', () => {
  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error('Execution error:', err);
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
