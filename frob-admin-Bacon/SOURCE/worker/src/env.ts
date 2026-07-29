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
  // Cloudflare Email Sending binding (DR-18, supersedes Postmark/TDR-09).
  // Optional so tests/local dev without the binding still typecheck; send()
  // falls back to a logged "delivery_pending" when absent.
  EMAIL?: SendEmail;
  JWT_SECRET: string;
  // Legacy Postmark token — retained for backward compatibility only; the
  // send path now targets EMAIL (DR-18). Optional.
  POSTMARK_TOKEN?: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  MET_OFFICE_KEY: string;
  TFL_APP_KEY: string;
  // Non-secret vars declared in wrangler.toml [vars] — optional here since
  // not every environment sets every var explicitly.
  ALLOWED_ORIGIN?: string;
  STRIPE_MODE?: string;
  NOTIFICATIONS_EMAIL_FROM?: string;
  /** CHG-008 (CT-3): outbound email transport selector — `resend`
   *  (production/staging default), `cloudflare` (DR-18 rollback path), or
   *  `debug`/unset (local simulated send). wrangler.toml [vars]. */
  EMAIL_TRANSPORT?: string;
  /** CHG-008: Resend API key — secret, set via `wrangler secret put
   *  RESEND_API_KEY [--env …]` / .dev.vars. Missing key under the `resend`
   *  transport is a recorded transport failure, never a throw. */
  RESEND_API_KEY?: string;
  /** Dev only: when set, the rendered outgoing email is logged to the console
   *  (Cloudflare Email cannot deliver from local `wrangler dev`). */
  EMAIL_DEBUG?: string;
  // EML reintegration (DR-7): inbound mail is forwarded here after capture,
  // flagged if spam, never withheld.
  OWNER_PERSONAL_EMAIL?: string;
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
