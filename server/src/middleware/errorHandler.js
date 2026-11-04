import { env } from '../config/env.js';

export function errorHandler(error, _req, res, _next) {
  const statusCode = Number.isInteger(error.status) ? error.status : 500;

  if (statusCode >= 500) {
    console.error('[PropIntel API]', error);
  }

  res.status(statusCode).json({
    error: {
      code: error.code ?? (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
      message: statusCode >= 500 && env.nodeEnv === 'production'
        ? 'An unexpected server error occurred.'
        : error.message ?? 'An unexpected error occurred.'
    }
  });
}
