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
import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import { requireAdmin } from './middleware/requireAdmin.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Trust only the local Nginx reverse proxy. This lets rate limiters use the
// original client IP without trusting arbitrary forwarded headers from the internet.
// In container deployments, the backend port is published on host loopback only,
// so only the local Nginx reverse proxy can supply trusted forwarded headers.
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? true : 'loopback');

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('This origin is not allowed by the API CORS policy.'));
  },
  credentials: true
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
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);

// All customer records and internal sales tools are protected at the API layer.
app.use('/api/leads', requireAdmin, leadRoutes);
app.use('/api/leads', requireAdmin, analysisRoutes);
app.use('/api/leads', requireAdmin, chatRoutes);
app.use('/api', (req, res, next) => {
  // The task router also owns lead-scoped task/activity URLs, already protected
  // by the /api/leads middleware above. Guard only its global /tasks routes here.
  if (req.path === '/tasks' || req.path.startsWith('/tasks/')) {
    return requireAdmin(req, res, next);
  }
  return next();
}, taskRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
