import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import leadRoutes from './routes/lead.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import chatRoutes from './routes/chat.routes.js';
import taskRoutes from './routes/task.routes.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('This origin is not allowed by the API CORS policy.'));
  }
}));
app.use(express.json({ limit: '100kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.'
    }
  }
});

app.get('/', (_req, res) => {
  res.json({ name: 'PropIntel API', health: '/api/health' });
});

app.use('/api', apiLimiter);
app.use('/api', healthRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/leads', analysisRoutes);
app.use('/api/leads', chatRoutes);
app.use('/api', taskRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
