import { config } from './config.js';
import { createDatabase } from './db.js';
import { createApp } from './app.js';

const db = createDatabase();
const app = createApp(db);

const server = app.listen(config.port, config.host, () => {
  console.log(`Habit tracker API listening on http://${config.host}:${config.port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
