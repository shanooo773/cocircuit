/** Returns every job application as JSON. Admin session required. */
import { getDb } from '../../lib/db.js';
import { getAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (!getAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const sql = getDb();
  const applications = await sql`
    SELECT id, full_name, email, phone, role_interest, experience, linkedin_url, message,
           cv_original_name, cv_size, created_at
    FROM job_applications
    ORDER BY created_at DESC
  `;

  return res.status(200).json({ applications });
}
