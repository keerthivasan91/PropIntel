import { Router } from 'express';
import { checkDatabaseConnection } from '../config/database.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'propintel-api',
    timestamp: new Date().toISOString()
  });
});

router.get('/health/ready', async (_req, res, next) => {
  try {
    const database = await checkDatabaseConnection();

    if (!database.connected) {
      return res.status(503).json({
        status: 'not_ready',
        checks: { database: database.configured ? 'unavailable' : 'not_configured' }
      });
    }

    return res.status(200).json({
      status: 'ready',
      checks: { database: 'connected' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
