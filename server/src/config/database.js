import mysql from 'mysql2/promise';
import { env } from './env.js';

export const databasePool = env.databaseConfigured
  ? mysql.createPool(env.database)
  : null;

export async function checkDatabaseConnection() {
  if (!databasePool) {
    return { configured: false, connected: false };
  }

  await databasePool.query('SELECT 1');
  return { configured: true, connected: true };
}
