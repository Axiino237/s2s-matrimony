const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('path');

async function startDatabase() {
  const pg = new EmbeddedPostgres({
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 's2s_matrimony',
    persistent: true,
    dataDir: path.join(__dirname, 'pgdata'),
  });

  try {
    console.log('Initializing PostgreSQL database...');
    await pg.initialise();
  } catch (e) {
    console.log('Database already initialized or notice:', e.message);
  }

  console.log('Starting PostgreSQL database on port 5432...');
  await pg.start();

  try {
    await pg.createDatabase('s2s_matrimony');
    console.log('Created database s2s_matrimony');
  } catch (e) {
    console.log('Database s2s_matrimony already exists or notice:', e.message);
  }

  console.log('PostgreSQL database server is running and healthy on port 5432!');
}

startDatabase().catch((err) => {
  console.error('Failed to start embedded PostgreSQL:', err);
});
