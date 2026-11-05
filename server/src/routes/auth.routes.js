import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  clearAdminCookieOptions,
  createAdminSession,
  getAdminSession,
  isAdminAuthConfigured,
  verifyAdminCredentials
} from '../services/auth.service.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'LOGIN_RATE_LIMITED',
      message: 'Too many sign-in attempts. Please try again in 15 minutes.'
    }
  }
});

router.get('/me', (req, res) => {
  const session = getAdminSession(req.headers.cookie);
  res.json({
    data: {
      authenticated: Boolean(session),
      username: session?.username ?? null,
      configured: isAdminAuthConfigured()
    }
  });
});

router.post('/login', loginLimiter, (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!username || !password || username.length > 120 || password.length > 200) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Enter a valid username and password.' }
    });
  }

  const result = verifyAdminCredentials(username, password);
  if (result === 'not_configured') {
    return res.status(503).json({
      error: {
        code: 'ADMIN_AUTH_NOT_CONFIGURED',
        message: 'Admin sign-in is not configured. Set the required values in server/.env.'
      }
    });
  }
  if (result !== 'valid') {
    return res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'The username or password is incorrect.' }
    });
  }

  res.cookie(ADMIN_COOKIE_NAME, createAdminSession(username), adminCookieOptions());
  return res.json({ data: { authenticated: true, username } });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, clearAdminCookieOptions());
  return res.json({ data: { authenticated: false } });
});

export default router;
