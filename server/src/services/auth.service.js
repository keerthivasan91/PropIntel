import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

export const ADMIN_COOKIE_NAME = 'propintel_admin';
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left ?? ''));
  const rightBuffer = Buffer.from(String(right ?? ''));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminAuthConfigured() {
  return Boolean(
    env.adminUsername &&
    env.adminPassword.length >= 12 &&
    env.adminPassword !== 'replace_with_a_strong_unique_password' &&
    env.sessionSecret.length >= 32 &&
    env.sessionSecret !== 'replace_with_at_least_32_random_characters'
  );
}

export function verifyAdminCredentials(username, password) {
  if (!isAdminAuthConfigured()) return 'not_configured';
  return safeEqual(username, env.adminUsername) && safeEqual(password, env.adminPassword)
    ? 'valid'
    : 'invalid';
}

function signPayload(payload) {
  return createHmac('sha256', env.sessionSecret).update(payload).digest('base64url');
}

export function createAdminSession(username) {
  if (!isAdminAuthConfigured()) {
    throw new Error('Admin authentication is not configured.');
  }

  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000
  })).toString('base64url');

  return payload + '.' + signPayload(payload);
}

function readCookie(cookieHeader, name) {
  for (const part of String(cookieHeader ?? '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return '';
    }
  }
  return '';
}

export function getAdminSession(cookieHeader) {
  if (!isAdminAuthConfigured()) return null;

  const token = readCookie(cookieHeader, ADMIN_COOKIE_NAME);
  const separator = token.lastIndexOf('.');
  if (separator < 1) return null;

  const payload = token.slice(0, separator);
  const providedSignature = token.slice(separator + 1);
  const expectedSignature = signPayload(payload);
  if (!safeEqual(providedSignature, expectedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
      session.username !== env.adminUsername ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }
    return { username: session.username };
  } catch {
    return null;
  }
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_SESSION_TTL_SECONDS * 1000
  };
}

export function clearAdminCookieOptions() {
  return {
    ...adminCookieOptions(),
    maxAge: 0
  };
}
