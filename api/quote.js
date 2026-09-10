/** Request-a-quote form (quote.html) → quote_requests table. */
import { getDb } from '../lib/db.js';
import { readJson, str, isEmail, clientIp, sendJson } from '../lib/forms.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { success: false, message: 'Method not allowed.' });

  const body = readJson(req);

  if (body.website) return sendJson(res, 200, { success: true, message: 'Thank you.' });

  const name = str(body.name, 150);
  const company = str(body.company, 150);
  const email = str(body.email, 190);
  const phone = str(body.phone, 40);
  const service = str(body.service, 120);
  const projectDescription = str(body.project_description);
  const message = str(body.message);

  if (!name || !email || !phone || !service || !projectDescription) {
    return sendJson(res, 400, { success: false, message: 'Please complete all required fields.' });
  }
  if (!isEmail(email)) {
    return sendJson(res, 400, { success: false, message: 'Please provide a valid email address.' });
  }

  try {
    const sql = getDb();
    await sql`
      INSERT INTO quote_requests
        (name, company, email, phone, service, project_description, message, ip_address)
      VALUES
        (${name}, ${company || null}, ${email}, ${phone}, ${service},
         ${projectDescription}, ${message || null}, ${clientIp(req)})
    `;
  } catch (err) {
    console.error('quote insert failed:', err);
    return sendJson(res, 500, { success: false, message: 'Something went wrong. Please try again shortly.' });
  }

  return sendJson(res, 200, { success: true, message: 'Quote request received.' });
}
