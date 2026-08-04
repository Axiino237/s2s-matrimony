import { Client } from 'ssh2';

const conn = new Client();

const commands = [
  'echo "=== TESTING SUPERADMIN LOGIN ON /api/v1/auth/login ==="',
  `curl -s -X POST http://127.0.0.1:3001/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"superadmin@s2smatrimony.com","password":"admin123"}'`,
  'echo ""',
  'echo "=== TESTING ADMIN LOGIN ON /api/v1/auth/login ==="',
  `curl -s -X POST http://127.0.0.1:3001/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@s2smatrimony.com","password":"admin123"}'`,
  'echo ""',
].join(' && ');

conn.on('ready', () => {
  console.log('⚡ Testing /api/v1/auth/login endpoint...');
  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    let output = '';
    stream
      .on('close', () => {
        console.log('\n=================== LOGIN API TEST RESPONSE ===================\n');
        console.log(output);
        console.log('\n================================================================\n');
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
