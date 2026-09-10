# CoCircuit Power Consultants — Project & Deployment Guide

This project is a marketing website plus a small backend for one feature:
the **"Find Jobs"** CV application form and an admin panel to review
submissions.

As of this rewrite the backend runs entirely on **Vercel** (Node.js
serverless functions), with **Neon Postgres** for data and **Vercel Blob**
for stored CVs. The original PHP/MySQL implementation is preserved, unused,
under [`_reference-old/php-backend/`](_reference-old/php-backend/).

---

## 1. Architecture

| Part | Type | Files |
|---|---|---|
| Marketing pages | Static HTML/CSS/JS | `index.html`, `services.html`, `team*.html`, `industry-*.html`, `privacy.html`, `terms.html`, `refund.html`, `success.html`, `quote.html`, `booking.html` |
| Job application form | Static page; its JS calls the API | `jobs.html` + handler in `js/main.js` |
| Application API | Node serverless function | `api/apply.js` |
| Admin panel | Static pages + JSON APIs, JWT cookie auth | `admin/login.html`, `admin/index.html`, `api/admin/*.js` |
| Shared code | DB client, auth helpers | `lib/db.js`, `lib/auth.js` |
| Contact / quote forms | Static pages; JS posts JSON | `index.html` (#contact), `quote.html` + `js/main.js` |
| Database schema | Postgres | `schema.postgres.sql` (tables: `job_applications`, `contact_enquiries`, `quote_requests`, `admins`) |
| Stored CVs | Vercel Blob objects (private store) | referenced by `cv_url` in `job_applications`; downloaded only via `api/admin/download.js` after login |

### How the job flow works

1. Visitor fills out `jobs.html`, attaches a CV (PDF/DOC/DOCX, max 5MB).
2. `js/main.js` submits it via `fetch('/api/apply')` (`FormData`, no reload).
3. `api/apply.js` validates everything server-side (required fields, real
   email, consent checkbox, honeypot `website` field, file extension **and**
   magic-byte sniff), uploads the CV to Vercel Blob under a random name, and
   inserts a row into `job_applications`.
4. On success the page shows a confirmation message.
5. You log in at `/admin/login`, and `/admin` lists every submission with a
   per-row CV download link (`/api/admin/download?id=…`), which streams the
   file from Blob only after checking the session cookie.

### Endpoints

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/apply` | Submit a job application (multipart form) | none |
| POST | `/api/contact` | Submit a contact enquiry (JSON) | none |
| POST | `/api/quote` | Submit a quote request (JSON) | none |
| POST | `/api/admin/login` | `{username,password}` → sets session cookie | none |
| GET | `/api/admin/logout` | Clears cookie, redirects to `/admin/login` | cookie |
| GET | `/api/admin/applications` | List all job applications as JSON | cookie |
| GET | `/api/admin/enquiries` | List contact enquiries + quote requests as JSON | cookie |
| GET | `/api/admin/download?id=N` | Stream one CV as an attachment | cookie |
| POST | `/api/admin/delete` | `{type,ids[]}` → delete selected rows (+ CV blobs) | cookie |
| POST | `/api/admin/create` | One-time: create the first admin | `X-Setup-Token` header |

---

## 2. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (and in
`.env.local` for `vercel dev`). See `.env.example`.

| Name | Where it comes from |
|---|---|
| `DATABASE_URL` | Neon integration (Vercel Marketplace). Pooled connection string. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store attached to the project (auto-injected). |
| `AUTH_SECRET` | You generate it: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `SETUP_TOKEN` | You generate it (same way). **Delete it after creating your admin.** |

---

## 3. First-time deployment

### Step 1 — Create the database (Neon)

1. Vercel dashboard → **Storage** (or **Integrations → Marketplace**) →
   add **Neon**. Connect it to this project. Vercel injects `DATABASE_URL`
   (and a few `PG*`/`DATABASE_URL_UNPOOLED` aliases) automatically.
2. In the Neon console → **SQL Editor**, paste the contents of
   `schema.postgres.sql` and run it. Confirm `admins` and
   `job_applications` now exist.

### Step 2 — Create the Blob store

Vercel dashboard → **Storage** → **Create Database → Blob** → connect to
this project. This injects `BLOB_READ_WRITE_TOKEN`.

### Step 3 — Set the remaining env vars

Add `AUTH_SECRET` and `SETUP_TOKEN` (Production + Preview + Development).

### Step 4 — Deploy

```powershell
npm install -g vercel
cd c:\Users\Shayan\Desktop\sample
vercel login
vercel --prod
```

No build step — Vercel serves the HTML statically and builds the functions
under `api/` automatically. `_reference-old/` and `uploads/` are excluded
via `.vercelignore`.

### Step 5 — Create your admin account

With `SETUP_TOKEN` set, POST once (replace the host and token):

```powershell
$body = @{ username = "admin"; password = "your-strong-password" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://your-project.vercel.app/api/admin/create" `
  -Headers @{ "X-Setup-Token" = "your-setup-token"; "Content-Type" = "application/json" } `
  -Body $body
```

Then **remove the `SETUP_TOKEN` env var** in Vercel and redeploy so the
endpoint can never run again. It also refuses once any admin row exists.

### Step 6 — Verify

1. Open `https://your-project.vercel.app/jobs` and submit a test
   application with a real PDF.
2. Log in at `/admin/login`, confirm the row appears, download the CV.

---

## 4. Local development

```powershell
cd c:\Users\Shayan\Desktop\sample
npm install
# put DATABASE_URL / BLOB_READ_WRITE_TOKEN / AUTH_SECRET / SETUP_TOKEN in .env.local
npx vercel dev
```

`vercel dev` serves the static pages and runs the functions locally at
`http://localhost:3000`. It can also pull deployed env vars with
`vercel env pull .env.local`.

You can point `DATABASE_URL` at the same Neon database (it has a generous
free tier and branching), or create a separate Neon branch for local work.

---

## 5. Everyday changes

- **Static pages / CSS / JS:** edit the file, `git push` (or `vercel --prod`).
  No build.
- **API logic:** edit `api/**` or `lib/**`, redeploy. Test with `vercel dev`
  first.
- **Schema change:** edit `schema.postgres.sql`, then run the new statements
  in the Neon SQL editor (the file uses `IF NOT EXISTS`, so re-running it is
  safe for additive changes; column changes need explicit `ALTER TABLE`).

---

## 6. Notes & trade-offs

- **CVs are in a private Blob store.** `api/apply.js` uploads with
  `access: 'private'`; `api/admin/download.js` pulls the bytes back with the
  store token and streams them only after the admin session check. The blob
  URLs are never exposed to the browser and are not publicly fetchable.
- **Sessions are stateless JWTs** in an `httpOnly; Secure; SameSite=Lax`
  cookie named `cocircuit_admin`, valid 8 hours. Rotating `AUTH_SECRET`
  logs everyone out.
- **`api/apply.js` reads the raw request stream** with `busboy`; the whole
  CV is buffered in memory (capped at 5MB) before upload — fine at this
  size, revisit if the limit grows.
- **No `.htaccess`.** Upload protection is the auth check in
  `api/admin/download.js`; `/admin` route rewrite is in `vercel.json`.
- The legacy PHP stack under `_reference-old/php-backend/` still contains a
  working XAMPP/Hostinger implementation if you ever need to go back — see
  the git history of this file for the old instructions.
