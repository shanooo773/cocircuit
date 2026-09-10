/** Clears the admin session cookie and returns to the login page. */
import { clearSessionCookie } from '../../lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', clearSessionCookie());
  res.redirect(302, '/admin/login');
}
