/**
 * Handles the jobs.html application form: validates the submission,
 * stores the CV in Vercel Blob, and records the application in Postgres.
 * No payment is involved — this is a free "register your interest" form.
 *
 * Port of the original api/apply.php.
 */
import { randomUUID } from 'node:crypto';
import Busboy from 'busboy';
import { put, del } from '@vercel/blob';
import { getDb } from '../lib/db.js';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB — keep in sync with js/main.js
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];

// Vercel does not parse multipart bodies — keep the raw stream for Busboy.
export const config = { api: { bodyParser: false } };

function respond(res, status, success, message) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success, message }));
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({
      headers: req.headers,
      limits: { fileSize: MAX_BYTES + 1, files: 1, fields: 20 },
    });
    const fields = {};
    let file = null;
    let tooLarge = false;

    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('file', (name, stream, info) => {
      if (name !== 'cv') { stream.resume(); return; }
      const chunks = [];
      stream.on('data', (c) => chunks.push(c));
      stream.on('limit', () => { tooLarge = true; });
      stream.on('close', () => {
        file = {
          buffer: Buffer.concat(chunks),
          filename: info.filename || '',
          mimeType: info.mimeType || 'application/octet-stream',
        };
      });
    });
    bb.on('close', () => resolve({ fields, file, tooLarge }));
    bb.on('error', reject);
    req.pipe(bb);
  });
}

// Lightweight magic-byte check (replaces PHP's finfo).
function sniff(buffer) {
  if (buffer.length >= 4 && buffer.toString('latin1', 0, 4) === '%PDF') return 'pdf';
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) return 'zip'; // docx
  if (buffer.length >= 8 && buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) return 'ole'; // legacy doc
  return null;
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return respond(res, 405, false, 'Method not allowed.');

  let parsed;
  try {
    parsed = await parseForm(req);
  } catch {
    return respond(res, 400, false, 'There was a problem uploading your CV. Please try again.');
  }
  const { fields, file, tooLarge } = parsed;

  // Honeypot — real visitors never see or fill this field.
  if (fields.website) return respond(res, 200, true, 'Thank you.');

  const fullName = (fields.full_name || '').trim();
  const email = (fields.email || '').trim();
  const phone = (fields.phone || '').trim();
  const roleInterest = (fields.role_interest || '').trim();
  const experience = (fields.experience || '').trim();
  const linkedinUrl = (fields.linkedin_url || '').trim();
  const message = (fields.message || '').trim();
  const consent = fields.consent != null && fields.consent !== '' && fields.consent !== 'false';

  if (!fullName || !email || !phone || !roleInterest) {
    return respond(res, 400, false, 'Please complete all required fields.');
  }
  if (!isValidEmail(email)) {
    return respond(res, 400, false, 'Please provide a valid email address.');
  }
  if (!consent) {
    return respond(res, 400, false, 'Please confirm you agree to the Privacy Policy.');
  }
  if (linkedinUrl && !/^https?:\/\/[^\s]+$/i.test(linkedinUrl)) {
    return respond(res, 400, false, 'Please provide a valid LinkedIn / portfolio URL.');
  }

  // --- CV upload validation --------------------------------------------------
  if (!file || !file.buffer || file.buffer.length === 0) {
    return respond(res, 400, false, 'Please attach your CV.');
  }
  if (tooLarge || file.buffer.length > MAX_BYTES) {
    return respond(res, 400, false, 'Your CV is too large — please keep it under 5MB.');
  }

  const ext = (file.filename.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return respond(res, 400, false, 'Please upload a PDF, DOC or DOCX file.');
  }

  const kind = sniff(file.buffer);
  const mimeOk =
    (ext === 'pdf' && kind === 'pdf') ||
    (ext === 'docx' && kind === 'zip') ||
    (ext === 'doc' && (kind === 'ole' || kind === 'zip'));
  if (!mimeOk) {
    return respond(res, 400, false, 'That file does not look like a valid PDF or Word document.');
  }

  // --- Store the CV --------------------------------------------------------
  let blob;
  try {
    blob = await put(`cvs/${randomUUID()}.${ext}`, file.buffer, {
      access: 'private',
      addRandomSuffix: true,
      contentType: file.mimeType,
    });
  } catch (err) {
    console.error('CV blob upload failed:', err);
    return respond(res, 500, false, 'We could not save your CV. Please try again.');
  }

  // --- Persist to the database --------------------------------------------
  try {
    const sql = getDb();
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null;
    const origName = file.filename.split(/[\\/]/).pop().slice(0, 255);
    await sql`
      INSERT INTO job_applications
        (full_name, email, phone, role_interest, experience, linkedin_url, message,
         cv_url, cv_original_name, cv_size, ip_address)
      VALUES
        (${fullName.slice(0, 150)}, ${email.slice(0, 190)}, ${phone.slice(0, 40)},
         ${roleInterest.slice(0, 120)}, ${experience ? experience.slice(0, 40) : null},
         ${linkedinUrl ? linkedinUrl.slice(0, 255) : null}, ${message || null},
         ${blob.url}, ${origName}, ${file.buffer.length}, ${ip})
    `;
  } catch (err) {
    console.error('DB insert failed:', err);
    // Roll back the file we already saved so we don't leak orphaned uploads.
    try { await del(blob.url); } catch { /* ignore */ }
    return respond(res, 500, false, 'We could not save your application. Please try again shortly.');
  }

  return respond(res, 200, true, 'Application received.');
}
