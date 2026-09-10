/** Small shared helpers for the JSON contact/quote endpoints. */

export function readJson(req) {
  // Vercel parses application/json bodies into req.body already.
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

export function str(v, max) {
  const s = (typeof v === 'string' ? v : '').trim();
  return max ? s.slice(0, max) : s;
}

export function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null;
}

export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}
