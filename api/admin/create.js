/**
 * One-time bootstrap: creates the first admin account.
 * Only works while the `admins` table is empty, and only when the caller
 * sends the correct X-Setup-Token header (matched against SETUP_TOKEN).
 *
 * After creating your account, remove the SETUP_TOKEN env var in Vercel so
 * this endpoint can never run again.
 */
import bcrypt from 'bcryptjs';
import { getDb } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const expected = process.env.SETUP_TOKEN;
  if (!expected || req.headers['x-setup-token'] !== expected) {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  const { username, password } = req.body || {};
  const user = typeof username === 'string' ? username.trim() : '';
  const pass = typeof password === 'string' ? password : '';

  if (user.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  if (pass.length < 10) return res.status(400).json({ error: 'Password must be at least 10 characters.' });

  const sql = getDb();
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM admins`;
  if (count > 0) return res.status(409).json({ error: 'An admin account already exists.' });

  const hash = await bcrypt.hash(pass, 12);
  await sql`INSERT INTO admins (username, password_hash) VALUES (${user}, ${hash})`;

  return res.status(201).json({ ok: true });
}
