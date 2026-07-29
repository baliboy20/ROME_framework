// FOB booking/payments — operator-session guard.
//
// satisfies: DR-B9 (admin/owner payment actions guarded by a core-auth
// operator session, NOT a static admin key — divergence from the
// stripe-poc reference's `X-Admin-Key` header guard).
//
// FINDING-008 item 4 — guard convergence. This module previously treated the
// bearer token as an opaque KV key and never verified its signature, while
// `modules/auth/middleware.ts#resolveSession` did. Two guards for one concept,
// and the *dominant* one (used by nearly every route) was the weaker — yet
// `api-contracts.md` documents the verifying behaviour as universal, so the
// contract described the minority implementation.
//
// Both now verify the JWT signature before the KV lookup, which is exactly what
// `resolveSession` does. This is additive, not a behaviour change: every
// `putSession` call site in the worker (routes/auth.ts owner login + customer
// link, routes/booking.ts booking session) mints its token with `signJwt`
// first, so no legitimate session token can fail verification. What it stops is
// a forged or tampered token being accepted purely because a matching KV key
// happens to exist.
//
// KV remains authoritative for expiry and revocation (AUTH04) — the JWT's own
// `exp` is never trusted on its own.

import type { Context, Next } from "hono";
import { getSession } from "../kv/session";
import { verifyJwt } from "../modules/auth/jwt";
import type { AuthSession } from "../types";
import type { Env } from "../env";

export type AuthedVariables = {
  session: AuthSession;
};

function bearerToken(c: Context): string | null {
  const header = c.req.header("Authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

/** Requires a valid, non-expired session for an Owner or secondary operator. */
export async function requireOperatorSession(
  c: Context<{ Bindings: Env; Variables: AuthedVariables }>,
  next: Next
) {
  const token = bearerToken(c);
  if (!token) {
    return c.json({ error: "unauthorized" }, 401);
  }
  // FINDING-008: verify the signature before trusting the token as a KV key.
  if (!(await verifyJwt(c.env.JWT_SECRET, token))) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const session = await getSession(c.env.SESSIONS, token);
  if (!session || (session.actor_type !== "owner" && session.actor_type !== "secondary_operator")) {
    return c.json({ error: "unauthorized" }, 401);
  }
  c.set("session", session);
  await next();
}

/**
 * Requires a valid customer session scoped to the booking in the route's
 * `:id` (or `:bookingId`) param, per AUTH02. Used by self-service booking
 * routes (BOOK02/03/06/07).
 */
export async function requireCustomerSession(
  c: Context<{ Bindings: Env; Variables: AuthedVariables }>,
  next: Next
) {
  const token = bearerToken(c);
  if (!token) {
    return c.json({ error: "unauthorized" }, 401);
  }
  // FINDING-008: verify the signature before trusting the token as a KV key.
  if (!(await verifyJwt(c.env.JWT_SECRET, token))) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const session = await getSession(c.env.SESSIONS, token);
  if (!session || session.actor_type !== "customer") {
    return c.json({ error: "unauthorized" }, 401);
  }
  const bookingId = c.req.param("id") ?? c.req.param("bookingId");
  if (bookingId && session.booking_id && session.booking_id !== bookingId) {
    return c.json({ error: "unauthorized" }, 401);
  }
  c.set("session", session);
  await next();
}
