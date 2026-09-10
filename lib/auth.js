import jwt from 'jsonwebtoken';
import { parse, serialize } from 'cookie';

const COOKIE_NAME = 'cocircuit_admin';
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set.');
  return s;
}

/** Serialized Set-Cookie value that logs an admin in. */
export function makeSessionCookie(payload) {
  const token = jwt.sign(payload, secret(), { expiresIn: MAX_AGE_SECONDS });
  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Serialized Set-Cookie value that logs an admin out. */
export function clearSessionCookie() {
  return serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/** Returns the decoded admin payload, or null if not authenticated. */
export function getAdmin(req) {
  try {
    const token = parse(req.headers.cookie || '')[COOKIE_NAME];
    if (!token) return null;
    return jwt.verify(token, secret());
  } catch {
    return null;
  }
}
