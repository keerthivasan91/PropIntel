import { getAdminSession, isAdminAuthConfigured } from '../services/auth.service.js';

export function requireAdmin(req, res, next) {
  if (!isAdminAuthConfigured()) {
    return res.status(503).json({
      error: {
        code: 'ADMIN_AUTH_NOT_CONFIGURED',
        message: 'Set ADMIN_USERNAME, ADMIN_PASSWORD and SESSION_SECRET in server/.env.'
      }
    });
  }

  const session = getAdminSession(req.headers.cookie);
  if (!session) {
    return res.status(401).json({
      error: {
        code: 'ADMIN_AUTH_REQUIRED',
        message: 'Please sign in to access the admin workspace.'
      }
    });
  }

  req.admin = session;
  return next();
}
