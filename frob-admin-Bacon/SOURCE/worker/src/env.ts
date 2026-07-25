// FOB api-worker — shared Cloudflare Worker bindings + secrets.
//
// Single source of truth for the `Env` type used by every route module
// (`Hono<{ Bindings: Env }>`). Mirrors the bindings declared in
// wrangler.toml ([[d1_databases]], [[kv_namespaces]], [[r2_buckets]]) plus
// the secrets documented in .dev.vars.example (wrangler secret put).
//
// Keep this stable — other P5 module agents (booking, fleet, tour-ops,
// back-office) import this same type rather than declaring their own.

export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  IDEMPOTENCY: KVNamespace;
  ASSETS: R2Bucket;
  JWT_SECRET: string;
  POSTMARK_TOKEN: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  MET_OFFICE_KEY: string;
  TFL_APP_KEY: string;
  // Non-secret vars declared in wrangler.toml [vars] — optional here since
  // not every environment sets every var explicitly.
  ALLOWED_ORIGIN?: string;
  STRIPE_MODE?: string;
  NOTIFICATIONS_EMAIL_FROM?: string;
  // Base URL of the customer-facing webapp, used to build booking
  // completion links (DR-B11 / REQ-BOOK08 / REQ-BOOK10). Falls back to the
  // local dev customer app port if unset.
  CUSTOMER_APP_URL?: string;
  // Owner credential (single-operator v1, REQ-AUTH01) — secrets, set via
  // `wrangler secret put`. OWNER_PASSWORD_HASH is a hex SHA-256 digest;
  // credentials are never stored in the session record (TDR-07).
  OWNER_EMAIL?: string;
  OWNER_PASSWORD_HASH?: string;
}
