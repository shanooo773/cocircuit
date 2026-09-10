/**
 * Deletes selected submissions. Admin session required.
 * Body: { type: 'application' | 'contact' | 'quote', ids: number[] }
 * For job applications the stored CV is removed from Blob too.
 */
import { del } from '@vercel/blob';
import { getDb } from '../../lib/db.js';
import { getAdmin } from '../../lib/auth.js';

const TABLES = {
  application: 'job_applications',
  contact: 'contact_enquiries',
  quote: 'quote_requests',
};

export default async function handler(req, res) {
  if (!getAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  const table = TABLES[body.type];
  if (!table) return res.status(400).json({ error: 'Unknown type.' });

  const ids = Array.isArray(body.ids)
    ? body.ids.map((n) => parseInt(n, 10)).filter((n) => Number.isInteger(n) && n > 0)
    : [];
  if (!ids.length) return res.status(400).json({ error: 'No valid ids supplied.' });

  const sql = getDb();

  try {
    if (body.type === 'application') {
      const rows = await sql`SELECT cv_url FROM job_applications WHERE id = ANY(${ids})`;
      const urls = rows.map((r) => r.cv_url).filter(Boolean);
      if (urls.length) {
        try { await del(urls); } catch (err) { console.error('Blob delete failed:', err); }
      }
      await sql`DELETE FROM job_applications WHERE id = ANY(${ids})`;
    } else if (body.type === 'contact') {
      await sql`DELETE FROM contact_enquiries WHERE id = ANY(${ids})`;
    } else {
      await sql`DELETE FROM quote_requests WHERE id = ANY(${ids})`;
    }
  } catch (err) {
    console.error('delete failed:', err);
    return res.status(500).json({ error: 'Could not delete the selected items.' });
  }

  return res.status(200).json({ ok: true, deleted: ids.length });
}
