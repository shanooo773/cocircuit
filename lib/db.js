import { neon } from '@neondatabase/serverless';

/**
 * Shared Neon (Postgres) client. Uses the pooled connection string in
 * DATABASE_URL. `neon()` is cheap to call per-invocation — it holds no
 * socket — so there is no connection to reuse across warm invocations.
 */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Attach the Neon integration in Vercel.');
  }
  return neon(url);
}
