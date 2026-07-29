// FOB core-auth — KV auth_session store.
//
// satisfies: TDR-07 (JWT/KV session — token key, 1h TTL, actor_type/
// actor_id/booking_id). Backed by the `SESSIONS` KV namespace binding
// (see wrangler.toml). This module is the single read/write path for
// session records — no other module touches `env.SESSIONS` directly.
//
// data-dictionary.md §3: `auth_session` (KV, not D1) — `token`(key),
// `actor_type`(enum auth_actor_type), `actor_id`, `booking_id`(nullable,
// customer scope), `created_at`, `expires_at`(=created+1h), `revoked_at`.
// Invariant: never outlives 1h; revoke deletes the KV record synchronously.

import type { AuthActorType, AuthSession } from "../types";

const SESSION_TTL_SECONDS = 60 * 60; // 1h — satisfies TDR-07
const KEY_PREFIX = "session:";

function keyFor(token: string): string {
  return `${KEY_PREFIX}${token}`;
}

export interface CreateSessionInput {
  token: string;
  actor_type: AuthActorType;
  actor_id: string;
  /** Non-null only for customer sessions — scopes access to one booking. */
  booking_id?: string | null;
  /** Injectable for tests; defaults to `new Date()`. */
  now?: Date;
}

/**
 * Create a new session record, keyed by `token`, expiring in exactly 1h.
 * Uses KV's `expirationTtl` so an expired session is also physically
 * evicted by the KV layer, not just logically stale.
 */
export async function putSession(kv: KVNamespace, input: CreateSessionInput): Promise<AuthSession> {
  const now = input.now ?? new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString();

  const session: AuthSession = {
    token: input.token,
    actor_type: input.actor_type,
    actor_id: input.actor_id,
    booking_id: input.booking_id ?? null,
    created_at: createdAt,
    expires_at: expiresAt,
    revoked_at: null,
  };

  await kv.put(keyFor(input.token), JSON.stringify(session), {
    expirationTtl: SESSION_TTL_SECONDS,
  });

  return session;
}

/**
 * Look up a session by token. Returns null if absent, expired (KV already
 * evicted it), or revoked.
 */
export async function getSession(kv: KVNamespace, token: string): Promise<AuthSession | null> {
  const raw = await kv.get(keyFor(token));
  if (!raw) return null;

  const session = JSON.parse(raw) as AuthSession;
  if (session.revoked_at) return null;

  // Belt-and-braces: KV's own TTL should have evicted this already, but
  // guard the invariant explicitly too (never outlives 1h).
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return session;
}

/**
 * Revoke a session synchronously — deletes the KV record outright
 * (satisfies TDR-07 invariant: "revoke deletes the KV record
 * synchronously").
 */
export async function revokeSession(kv: KVNamespace, token: string): Promise<void> {
  await kv.delete(keyFor(token));
}
