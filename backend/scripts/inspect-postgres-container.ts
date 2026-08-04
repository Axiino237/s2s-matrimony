import { Client } from 'ssh2';

const conn = new Client();

const commands = [
  'echo "=== CHECKING POSTGRES CONTAINER ENV ==="',
  'docker inspect s2s_postgres | grep -i POSTGRES',
  'echo "=== ALTERING POSTGRES USER PASSWORD TO password ==="',
  'docker exec -i s2s_postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD \'password\';"',
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
