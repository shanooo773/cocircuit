/**
 * Streams a stored CV as an attachment. Admin session required.
 * The Blob URL is never exposed to the browser — it is proxied here so the
 * download stays behind the admin login.
 */
import { getDb } from '../../lib/db.js';
import { getAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (!getAdmin(req)) return res.status(401).send('Unauthorized');

  const id = parseInt(req.query.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).send('Invalid request.');

  const sql = getDb();
  const rows = await sql`SELECT cv_url, cv_original_name FROM job_applications WHERE id = ${id} LIMIT 1`;
  const app = rows[0];
  if (!app) return res.status(404).send('Not found.');

  const upstream = await fetch(app.cv_url);
  if (!upstream.ok) return res.status(404).send('File no longer available.');
  const buf = Buffer.from(await upstream.arrayBuffer());

  const downloadName = String(app.cv_original_name).replace(/[^A-Za-z0-9._-]/g, '_');

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  res.setHeader('Content-Length', buf.length);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).end(buf);
}
