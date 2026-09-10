/** Contact enquiries + quote requests as JSON. Admin session required. */
import { getDb } from '../../lib/db.js';
import { getAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (!getAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const sql = getDb();
  const [contact, quotes] = await Promise.all([
    sql`
      SELECT id, name, company, email, phone, service, preferred_date, preferred_time,
             project_description, message, created_at
      FROM contact_enquiries
      ORDER BY created_at DESC
    `,
    sql`
      SELECT id, name, company, email, phone, service, project_description, message, created_at
      FROM quote_requests
      ORDER BY created_at DESC
    `,
  ]);

  return res.status(200).json({ contact, quotes });
}
