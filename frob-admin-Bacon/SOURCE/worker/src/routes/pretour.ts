// FOB pre-tour — tour-hub / reminder / weather / change / cancellation /
// late-arrival / no-show routes.
//
// satisfies: REQ-TOUR01..10, api-contracts.md "Pre-tour (TOUR)" table.
// Customer-facing routes (`/tour-hub/*`, `/notices/*`) are booking-scoped
// JWT+KV sessions (AUTH02) — session/JWT verification middleware is
// core-auth's concern (not re-specified here per this module's own
// depends-on note); this module assumes `c.get("bookingId")` would be set
// by that middleware once wired at the app level and, absent it here,
// falls back to reading `:id`/`bookingId` from the route/body directly so
// this module is independently testable without core-auth's middleware.
// Advisory reads route via the Worker proxy (TDR-17) — see `../lib/advisory.ts`.

import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../db/client";
import type { Env } from "../env";

export const pretour = new Hono<{ Bindings: Env }>();

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function parseBody<T extends z.ZodTypeAny>(
  c: import("hono").Context<{ Bindings: Env }>,
  schema: T
): Promise<z.infer<T> | undefined> {
  const json = await c.req.json().catch(() => undefined);
  const result = schema.safeParse(json);
  if (!result.success) {
    c.res = c.json({ error: "invalid_body", issues: result.error.issues }, 400) as any;
    return undefined;
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// REQ-TOUR01 — GET /tour-hub/:bookingId
// ---------------------------------------------------------------------------
pretour.get("/tour-hub/:bookingId", async (c) => {
  const db = createDb(c.env.DB);
  const booking = await db.bookings.get(c.req.param("bookingId"));
  if (!booking) return c.json({ error: "not_found" }, 404);

  const departure = await db.departures.get(booking.departure_id);
  const participants = await db.participants.listByBooking(booking.id);

  // invariant: a non-booker attendee viewing via a shared link never sees
  // emergency contact / other sensitive fields. The caller is expected to
  // pass a `viewer` query flag once core-auth's session middleware
  // distinguishes booker vs shared-link viewer; default to the safe
  // (redacted) shape absent that signal.
  const viewer = c.req.query("viewer");
  const isBooker = viewer === "booker";

  // FINDING-002: surface change-notices (TOUR06 ack / TOUR08 remediation) and
  // payment status so the customer hub can render and act on them.
  const noticeRows = await c.env.DB.prepare(
    `SELECT id, type, old_value, new_value, material, status, remediation_choice, sent_at
       FROM operator_notices WHERE booking_id = ? ORDER BY sent_at DESC`
  ).bind(booking.id).all();
  const payRows = await c.env.DB.prepare(
    `SELECT status FROM payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1`
  ).bind(booking.id).all();

  return c.json({
    booking: isBooker
      ? booking
      : { ...booking, emergency_contact_name: undefined, emergency_contact_phone: undefined, emergency_contact_relationship: undefined },
    departure,
    participants,
    notices: noticeRows.results ?? [],
    payment_status: (payRows.results?.[0] as { status?: string } | undefined)?.status ?? null,
  });
});

// ---------------------------------------------------------------------------
// REQ-TOUR02 — cron send-reminders (T-1). Exposed as an internal function
// for the scheduled() handler to call — no public route (system actor).
// ---------------------------------------------------------------------------
export async function sendT1Reminder(db: ReturnType<typeof createDb>, bookingId: string): Promise<{ sent: boolean }> {
  const booking = await db.bookings.get(bookingId);
  if (!booking || booking.status !== "confirmed") return { sent: false };

  const existing = await db.reminders.listByBooking(bookingId);
  if (existing.some((r) => r.milestone === "t_minus_1")) return { sent: false };

  await db.reminders.create({
    id: newId("rem"),
    booking_id: bookingId,
    milestone: "t_minus_1",
    sent_at: nowIso(),
    channel: null,
  });
  return { sent: true };
}

// ---------------------------------------------------------------------------
// REQ-TOUR03 — cron weather advisory. Internal function; reads via the
// Worker advisory proxy (TDR-17) — see lib/advisory.ts.
// ---------------------------------------------------------------------------
export async function submitWeatherAdvisory(
  db: ReturnType<typeof createDb>,
  bookingId: string,
  forecastSummary: string
): Promise<{ id: string }> {
  const id = newId("wxa");
  await db.weatherAdvisories.create({
    id,
    booking_id: bookingId,
    classification: "informational",
    forecast_summary: forecastSummary,
    sent_at: nowIso(),
    superseded_by: null,
  });
  return { id };
}

// ---------------------------------------------------------------------------
// REQ-TOUR04 — PATCH /tour-hub/:id/details — non-financial self-service
// ---------------------------------------------------------------------------
const SAFETY_SIGNIFICANT_FIELDS = new Set(["severe_allergy", "accessibility_flag", "minor_added"]);

const detailsSchema = z.object({
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  safety_significant_flags: z.array(z.string()).default([]),
});

pretour.patch("/tour-hub/:id/details", async (c) => {
  const body = await parseBody(c, detailsSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const booking = await db.bookings.get(c.req.param("id"));
  if (!booking) return c.json({ error: "not_found" }, 404);

  const patch: Record<string, unknown> = {};
  if (body.emergency_contact_name !== undefined) patch.emergency_contact_name = body.emergency_contact_name;
  if (body.emergency_contact_phone !== undefined) patch.emergency_contact_phone = body.emergency_contact_phone;
  if (body.emergency_contact_relationship !== undefined)
    patch.emergency_contact_relationship = body.emergency_contact_relationship;

  if (Object.keys(patch).length > 0) {
    await db.bookings.update(booking.id, patch as any);
  }

  const isSafetySignificant = body.safety_significant_flags.some((f) => SAFETY_SIGNIFICANT_FIELDS.has(f));
  if (isSafetySignificant) {
    await db.messages.create({
      id: newId("msg"),
      message_type: "owner_alert",
      recipient: "owner",
      event: "safety_significant_detail_change",
      idempotency_key: `detail-change:${booking.id}:${nowIso()}`,
      provider: "pending", // real provider is set by send() on dispatch,
      provider_ref: null,
      status: "queued",
      created_at: nowIso(),
      sent_at: null,
    });
  }

  return c.json({ ok: true, owner_alerted: isSafetySignificant });
});

// ---------------------------------------------------------------------------
// REQ-TOUR05 — internal change-notice (BO-triggered). No public route.
// ---------------------------------------------------------------------------
export async function submitChangeNotice(
  db: ReturnType<typeof createDb>,
  bookingId: string,
  oldValue: string,
  newValue: string,
  material: boolean
): Promise<{ id: string }> {
  const id = newId("notice");
  await db.operatorNotices.create({
    id,
    booking_id: bookingId,
    type: "change",
    old_value: oldValue,
    new_value: newValue,
    material: material ? 1 : 0,
    status: "sent",
    sent_at: nowIso(),
    acknowledged_at: null,
    remediation_choice: null,
  });
  return { id };
}

// ---------------------------------------------------------------------------
// REQ-TOUR06 — POST /notices/:id/ack — customer acknowledgement
// ---------------------------------------------------------------------------
pretour.post("/notices/:id/ack", async (c) => {
  const db = createDb(c.env.DB);
  const id = c.req.param("id");
  await db.operatorNotices.update(id, { status: "acknowledged", acknowledged_at: nowIso() });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// REQ-TOUR07 — internal cancellation-notice (BO-triggered). No public route.
// ---------------------------------------------------------------------------
export async function submitCancellationNotice(
  db: ReturnType<typeof createDb>,
  bookingId: string,
  reason: string
): Promise<{ id: string }> {
  const id = newId("notice");
  await db.operatorNotices.create({
    id,
    booking_id: bookingId,
    type: "cancellation",
    old_value: null,
    new_value: reason,
    material: 1,
    status: "sent",
    sent_at: nowIso(),
    acknowledged_at: null,
    remediation_choice: null,
  });
  return { id };
}

// ---------------------------------------------------------------------------
// REQ-TOUR08 — POST /notices/:id/remediation — customer remediation choice
// ---------------------------------------------------------------------------
const remediationSchema = z.object({
  choice: z.enum(["refund", "rebook", "credit"]),
});

pretour.post("/notices/:id/remediation", async (c) => {
  const body = await parseBody(c, remediationSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const id = c.req.param("id");
  // triggers booking's own REQ-BOOK07 (refund) or an equivalent
  // rebook/credit path — that mechanic is `booking`'s concern; this route
  // records the choice and hands off.
  await db.operatorNotices.update(id, { remediation_choice: body.choice });
  return c.json({ ok: true, choice: body.choice });
});

// ---------------------------------------------------------------------------
// REQ-TOUR09 — POST /tour-hub/:id/late — late-arrival notice
// ---------------------------------------------------------------------------
const lateArrivalSchema = z.object({
  estimated_arrival: z.string().min(1),
  context: z.string().nullable().default(null),
});

pretour.post("/tour-hub/:id/late", async (c) => {
  const body = await parseBody(c, lateArrivalSchema);
  if (!body) return c.res;
  const db = createDb(c.env.DB);
  const booking = await db.bookings.get(c.req.param("id"));
  if (!booking) return c.json({ error: "not_found" }, 404);

  // Notifies the Guide + Owner (FOB ops number, D-TOUR-7) — implemented as
  // an owner_alert message row; Guide-side delivery mechanism (GMT/ops
  // number) is out of this module's scope to build.
  await db.messages.create({
    id: newId("msg"),
    message_type: "owner_alert",
    recipient: "guide_and_owner",
    event: "late_arrival_notice",
    idempotency_key: `late:${booking.id}:${nowIso()}`,
    provider: "pending", // real provider is set by send() on dispatch,
    provider_ref: null,
    status: "queued",
    created_at: nowIso(),
    sent_at: null,
  });

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// REQ-TOUR10 — cron no-show. Internal function; reads tour-operations'
// `rider_checkins` (this module does not own that data).
// ---------------------------------------------------------------------------
export async function applyNoShowPolicy(
  db: ReturnType<typeof createDb>,
  departureId: string,
  bookingId: string,
  gracePeriodPassed: boolean
): Promise<{ recorded: boolean }> {
  if (!gracePeriodPassed) return { recorded: false };

  const checkins = await db.riderCheckins.listByDeparture(departureId);
  const participants = await db.participants.listByBooking(bookingId);
  const checkedInIds = new Set(checkins.map((ci) => ci.participant_id));
  const missing = participants.filter((p) => !checkedInIds.has(p.id));
  if (missing.length === 0) return { recorded: false };

  await db.messages.create({
    id: newId("msg"),
    message_type: "transactional",
    recipient: bookingId,
    event: "no_show_recorded",
    idempotency_key: `no-show:${departureId}:${bookingId}`,
    provider: "pending", // real provider is set by send() on dispatch,
    provider_ref: null,
    status: "queued",
    created_at: nowIso(),
    sent_at: null,
  });

  return { recorded: true };
}

export default pretour;
