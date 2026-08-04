import { Client } from 'ssh2';

const conn = new Client();

const commands = [
  'echo "=== CHECKING REMOTE POSTGRES ROLES & USER_ROLES ==="',
  `docker exec -i s2s_postgres psql -U postgres -d s2s_matrimony -c 'SELECT u.id, u.email, r.name as role_name FROM users u LEFT JOIN user_roles ur ON u.id = ur."userId" LEFT JOIN roles r ON ur."roleId" = r.id;'`,
  'echo "=== CHECKING REMOTE ROLES TABLE ==="',
  `docker exec -i s2s_postgres psql -U postgres -d s2s_matrimony -c "SELECT * FROM roles;"`,
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
