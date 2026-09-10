/** Contact enquiry form (index.html #contact) → contact_enquiries table. */
import { getDb } from '../lib/db.js';
import { readJson, str, isEmail, clientIp, sendJson } from '../lib/forms.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { success: false, message: 'Method not allowed.' });

  const body = readJson(req);

  // Honeypot — if a hidden "website" field is ever added and filled, drop it silently.
  if (body.website) return sendJson(res, 200, { success: true, message: 'Thank you.' });

  const name = str(body.name, 150);
  const company = str(body.company, 150);
  const email = str(body.email, 190);
  const phone = str(body.phone, 40);
  const service = str(body.service, 120);
  const preferredDate = str(body.preferred_date, 10);   // YYYY-MM-DD or ''
  const preferredTime = str(body.preferred_time, 10);
  const projectDescription = str(body.project_description);
  const message = str(body.message);

  if (!name || !email || !phone || !service || !message) {
    return sendJson(res, 400, { success: false, message: 'Please complete all required fields.' });
  }
  if (!isEmail(email)) {
    return sendJson(res, 400, { success: false, message: 'Please provide a valid email address.' });
  }
  const dateVal = /^\d{4}-\d{2}-\d{2}$/.test(preferredDate) ? preferredDate : null;

  try {
    const sql = getDb();
    await sql`
      INSERT INTO contact_enquiries
        (name, company, email, phone, service, preferred_date, preferred_time,
         project_description, message, ip_address)
      VALUES
        (${name}, ${company || null}, ${email}, ${phone}, ${service}, ${dateVal},
         ${preferredTime || null}, ${projectDescription || null}, ${message}, ${clientIp(req)})
    `;
  } catch (err) {
    console.error('contact insert failed:', err);
    return sendJson(res, 500, { success: false, message: 'Something went wrong. Please try again shortly.' });
  }

  return sendJson(res, 200, { success: true, message: 'Message received.' });
}
