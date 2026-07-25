// FOB booking/payments — operator-session guard.
//
// satisfies: DR-B9 (admin/owner payment actions guarded by a core-auth
// operator session, NOT a static admin key — divergence from the
// stripe-poc reference's `X-Admin-Key` header guard).
//
// This is a thin consumer of the KV session store owned by core-auth
// (src/kv/session.ts) — it does not mint or verify JWTs itself (that is
// core-auth's job); it looks up the bearer token in KV and checks the
// actor_type is an operator (owner or secondary_operator). If core-auth
// later adds JWT signature verification middleware ahead of this guard,
// this check remains valid as a defence-in-depth session check.

import type { Context, Next } from "hono";
import { getSession } from "../kv/session";
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
