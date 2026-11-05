import { app } from './app.js';
import { env } from './config/env.js';
import { databasePool } from './config/database.js';

// Keep the API private to the VPS. Nginx is the only public entry point.
const server = app.listen(env.port, '127.0.0.1', () => {
  console.log('PropIntel API listening on http://127.0.0.1:' + env.port);
});

async function shutdown(signal) {
  console.log(signal + ' received. Shutting down PropIntel API...');

  server.close(async () => {
    try {
      if (databasePool) await databasePool.end();
      process.exit(0);
    } catch (error) {
      console.error('Error while closing database pool:', error);
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
