// FINDING-008 — ownership check for `/notices/:id/*`.
//
// `requireCustomerSession` scopes a request by comparing the route's
// `:id`/`:bookingId` against the session's own `booking_id`. That works for
// `/tour-hub/:bookingId`, where the param IS the booking. It does NOT work for
// `/notices/:id/ack` and `/notices/:id/remediation`, whose `:id` is a notice
// id — the generic check would compare a notice id against a booking id and
// 401 every legitimate caller.
//
// So this runs AFTER `requireCustomerSession` (which establishes that the
// caller holds a valid customer session) and answers the remaining question:
// does this notice belong to that caller's booking? Without it an
// authenticated customer could acknowledge or choose remediation on another
// customer's notice by id.
import type { Context, Next } from "hono";
import type { Env } from "../env";
import type { AuthedVariables } from "./auth";
import { createDb } from "../db/client";

export async function requireNoticeOwner(
  c: Context<{ Bindings: Env; Variables: AuthedVariables }>,
  next: Next
) {
  const noticeId = c.req.param("id");
  // No `:id` on this route — nothing to scope; the session check already ran.
  if (!noticeId) return next();

  const session = c.get("session");
  const bookingId = session?.booking_id;
  // A customer session with no booking cannot own any notice.
  if (!bookingId) return c.json({ error: "unauthorized" }, 401);

  const db = createDb(c.env.DB);
  const notice = await db.operatorNotices.getById(noticeId);
  // Deliberately 401, not 404: distinguishing "does not exist" from "not
  // yours" would let a caller enumerate valid notice ids.
  if (!notice || notice.booking_id !== bookingId) {
    return c.json({ error: "unauthorized" }, 401);
  }

  await next();
}
