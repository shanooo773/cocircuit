/**
 * Streams a stored CV as an attachment. Admin session required.
 * CVs live in a PRIVATE Vercel Blob store — the bytes are pulled here with
 * the store's read-write token, so nothing is ever publicly reachable.
 */
import { get } from '@vercel/blob';
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

  let result;
  try {
    result = await get(app.cv_url, { access: 'private' });
  } catch (err) {
    console.error('Blob get failed:', err);
    return res.status(502).send('Could not retrieve the file.');
  }
  if (!result || result.statusCode !== 200) {
    return res.status(404).send('File no longer available.');
  }

  const buf = Buffer.from(await new Response(result.stream).arrayBuffer());
  const downloadName = String(app.cv_original_name).replace(/[^A-Za-z0-9._-]/g, '_');

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  res.setHeader('Content-Length', buf.length);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).end(buf);
}
