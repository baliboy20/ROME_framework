// FOB core-auth — request guards.
//
// satisfies: REQ-AUTH03 (X-Device-ID -> guide scoping), REQ-AUTH04 (server-
// side expiry re-checked on every request, independent of client claims).
// Exported for reuse by other P5 route modules (booking/fleet/tour-ops
// guard their own routes with these).

import type { Context, Next } from "hono";
import type { Env } from "../../env";
import { verifyJwt } from "./jwt";
import { getSession } from "../../kv/session";
import { createDb } from "../../db/client";

export interface AuthedActor {
  actorType: "owner" | "secondary_operator" | "customer";
  actorId: string;
  bookingId: string | null;
}

export interface AuthVariables {
  actor: AuthedActor;
  guideId: string;
}

type AuthedContext = Context<{ Bindings: Env; Variables: AuthVariables }>;

/** Extract the bearer token from the Authorization header, or null. */
function bearerToken(c: Context): string | null {
  const header = c.req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

/**
 * Resolve the current session: verifies the JWT signature+expiry AND the
 * server-side KV record (AUTH04 — the KV record, not the JWT's own `exp`
 * claim, is authoritative for revocation/expiry).
 */
export async function resolveSession(c: AuthedContext): Promise<AuthedActor | null> {
  const token = bearerToken(c);
  if (!token) return null;

  const payload = await verifyJwt(c.env.JWT_SECRET, token);
  if (!payload) return null;

  const session = await getSession(c.env.SESSIONS, token);
  if (!session) return null;

  return {
    actorType: session.actor_type,
    actorId: session.actor_id,
    bookingId: session.booking_id,
  };
}

/** Require any valid, unexpired session (owner, secondary-operator, or customer). */
export async function requireSession(c: AuthedContext, next: Next) {
  const actor = await resolveSession(c);
  if (!actor) {
    return c.json({ error: "expired session presented", message: "Your session has expired — please sign in again" }, 401);
  }
  c.set("actor", actor);
  await next();
}

/** Require an owner (or secondary-operator) session. */
export async function requireOwnerSession(c: AuthedContext, next: Next) {
  const actor = await resolveSession(c);
  if (!actor || (actor.actorType !== "owner" && actor.actorType !== "secondary_operator")) {
    return c.json({ error: "expired session presented", message: "Your session has expired — please sign in again" }, 401);
  }
  c.set("actor", actor);
  await next();
}

/** Require a booking-scoped customer session. */
export async function requireCustomerSession(c: AuthedContext, next: Next) {
  const actor = await resolveSession(c);
  if (!actor || actor.actorType !== "customer" || !actor.bookingId) {
    return c.json({ error: "expired session presented", message: "Your session has expired — please sign in again" }, 401);
  }
  c.set("actor", actor);
  await next();
}

/** Require a recognised guide device (X-Device-ID header). satisfies: REQ-AUTH03. */
export async function requireGuideDevice(c: AuthedContext, next: Next) {
  const deviceId = c.req.header("X-Device-ID");
  if (!deviceId) {
    return c.json(
      { error: "device identity missing", message: "This device can't be identified" },
      400
    );
  }

  const db = createDb(c.env.DB);
  const device = await db.devices.get(deviceId);
  if (!device) {
    return c.json(
      { error: "device identity not registered", message: "This device isn't registered — contact the owner" },
      403
    );
  }

  c.set("guideId", device.guide_id);
  await next();
}
