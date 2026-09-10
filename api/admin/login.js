/** Admin login — verifies credentials and sets a signed session cookie. */
import bcrypt from 'bcryptjs';
import { getDb } from '../../lib/db.js';
import { makeSessionCookie } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const { username, password } = req.body || {};
  const user = typeof username === 'string' ? username.trim() : '';
  const pass = typeof password === 'string' ? password : '';

  if (!user || !pass) {
    return res.status(400).json({ error: 'Please enter your username and password.' });
  }

  const sql = getDb();
  const rows = await sql`SELECT id, password_hash FROM admins WHERE username = ${user} LIMIT 1`;
  const admin = rows[0];

  if (!admin || !(await bcrypt.compare(pass, admin.password_hash))) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  res.setHeader('Set-Cookie', makeSessionCookie({ admin_id: admin.id, admin_username: user }));
  return res.status(200).json({ ok: true });
}
