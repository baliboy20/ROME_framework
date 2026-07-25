// FOB api-worker — booking routes (REQ-BOOK01..14).
//
// satisfies: TDR-08 (atomic D1 capacity ops, see modules/booking/capacity.ts),
// DR-B9 (admin/departure/bike-assignment routes require a core-auth
// operator session, not a static admin key).

import { Hono, type Context } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { createDb } from "../db/client";
import { type AuthedVariables, requireCustomerSession, requireOperatorSession } from "../lib/auth";
import * as service from "../modules/booking/service";
import { signJwt, signBookingLink } from "../modules/auth/jwt";
import { putSession } from "../kv/session";
import { send } from "../modules/notifications/send";

export const bookingRoutes = new Hono<{ Bindings: Env; Variables: AuthedVariables }>();

type AppContext = Context<{ Bindings: Env; Variables: AuthedVariables }>;

function respond<T>(c: AppContext, result: service.ServiceResult<T>) {
  if (!result.ok) {
    return c.json({ error: result.error, message: result.message }, result.status as 400);
  }
  return c.json(result.value as object);
}

// DR-B11 (FINDING-004): owner-created bookings (REQ-BOOK08 confirmed,
// REQ-BOOK10 provisional) never collect participants/waiver/emergency-
// contact themselves — the customer supplies those via the existing
// REQ-BOOK02 -> REQ-BOOK03 draft-booking flow, reached through a signed
// completion link mailed to them. The customer's own acceptance is what
// satisfies DR-B7's consent invariant; the Owner never enters it for them.
async function sendBookingCompletionLink(
  c: AppContext,
  bookingId: string,
  customerEmail: string
): Promise<boolean> {
  const linkToken = await signBookingLink(c.env.JWT_SECRET, bookingId);
  const baseUrl = c.env.CUSTOMER_APP_URL ?? "http://localhost:5174";
  // Root path, not a subpath: the customer webapp is a single-page island
  // that reads `?mode=...` off whatever URL it's served at (see main.dart);
  // there is no separate `/booking/complete` route to hit.
  const link = `${baseUrl}/?mode=complete&token=${encodeURIComponent(linkToken)}`;

  const db = createDb(c.env.DB);
  const result = await send(db, c.env, {
    messageType: "transactional",
    recipient: customerEmail,
    event: "booking_completion_link",
    idempotencyKey: `booking-completion-link:${bookingId}`,
    subject: "Complete your Friends on Bikes booking",
    textBody: `Your booking is on hold. Finish it here (attendee details, waiver, and terms): ${link}`,
    htmlBody: `<p>Your booking is on hold.</p><p><a href="${link}">Finish your booking</a> — attendee details, waiver, and terms.</p>`,
  });
  return result.status === "sent";
}

// ---------------------------------------------------------------------------
// REQ-BOOK01 — POST /bookings
// ---------------------------------------------------------------------------

const createBookingSchema = z.object({
  departureId: z.string().min(1),
  partySize: z.number().int().min(1).max(10),
  pricePerPersonPence: z.number().int().positive(),
  source: z.enum(["direct", "owner-created", "provisional", "ota"]).optional(),
});

bookingRoutes.post("/bookings", async (c) => {
  const parsed = createBookingSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.createBookingDraft(db, c.env.DB, parsed.data);
  if (!result.ok) return respond(c, result);

  // AUTH02 (FINDING-002): the inline single-island booking flow has no email
  // round-trip, so the browser that created this draft is issued a
  // booking-scoped customer session immediately. The token authorises only
  // this booking id (subsequent participants/consent/checkout steps).
  const booking = result.value as { id: string };
  const token = await signJwt(c.env.JWT_SECRET, {
    actorId: booking.id,
    actorType: "customer",
    bookingId: booking.id,
  });
  await putSession(c.env.SESSIONS, {
    token,
    actor_type: "customer",
    actor_id: booking.id,
    booking_id: booking.id,
  });
  return c.json({ ...(result.value as object), token });
});

// GET /bookings/:id — customer confirmation/hub read (FINDING-002: was 404).
// Booking-scoped customer session only reads its own booking (never card data).
bookingRoutes.get("/bookings/:id", requireCustomerSession, async (c) => {
  const bookingId = c.req.param("id")!;
  const db = createDb(c.env.DB);
  const booking = await db.bookings.get(bookingId);
  if (!booking) return c.json({ error: "booking_not_found", message: "Booking not found" }, 404);
  const participants = await db.participants.listByBooking(bookingId);
  const payments = await db.payments.listByBooking(bookingId);
  const latestPayment = payments[payments.length - 1];
  return c.json({
    ...booking,
    participants,
    payment_status: latestPayment?.status ?? null,
    provider_ref: latestPayment?.session_id ?? null,
  });
});

// ---------------------------------------------------------------------------
// REQ-BOOK02 — PATCH /bookings/:id/participants
// ---------------------------------------------------------------------------

const participantsSchema = z.object({
  participants: z
    .array(
      z.object({
        name: z.string().min(1),
        age_band: z.enum(["under-12", "12-17", "18+", "60+"]),
        contact_role: z.enum(["leader", "co-leader", "attendee"]).default("attendee"),
        notes: z.string().nullable().default(null),
      })
    )
    .min(1),
  emergencyContactName: z.string().min(1),
  emergencyContactPhone: z.string().min(1),
  emergencyContactRelationship: z.string().min(1),
});

bookingRoutes.patch("/bookings/:id/participants", requireCustomerSession, async (c) => {
  const parsed = participantsSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.submitParticipants(db, {
    bookingId: c.req.param("id")!,
    participants: parsed.data.participants.map((p) => ({
      name: p.name,
      age_band: p.age_band,
      contactRole: p.contact_role,
      notes: p.notes,
    })),
    emergencyContactName: parsed.data.emergencyContactName,
    emergencyContactPhone: parsed.data.emergencyContactPhone,
    emergencyContactRelationship: parsed.data.emergencyContactRelationship,
  });
  return respond(c, result);
});

// ---------------------------------------------------------------------------
// REQ-BOOK03 — POST /bookings/:id/consent
// ---------------------------------------------------------------------------

const consentSchema = z.object({
  waiverAccepted: z.boolean(),
  termsAccepted: z.boolean(),
});

bookingRoutes.post("/bookings/:id/consent", requireCustomerSession, async (c) => {
  const parsed = consentSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.submitConsent(db, { bookingId: c.req.param("id")!, ...parsed.data });
  return respond(c, result);
});

// ---------------------------------------------------------------------------
// REQ-BOOK06 — PATCH /bookings/:id (self-service date/time modify)
// ---------------------------------------------------------------------------

const modifySchema = z.object({
  newDepartureId: z.string().min(1),
  newPricePerPersonPence: z.number().int().positive(),
  cancellationCutoffHours: z.number().nonnegative().default(48),
});

bookingRoutes.patch("/bookings/:id", requireCustomerSession, async (c) => {
  const parsed = modifySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.modifyBookingDate(db, c.env.DB, {
    bookingId: c.req.param("id")!,
    ...parsed.data,
  });
  return respond(c, result);
});

// ---------------------------------------------------------------------------
// REQ-BOOK07 — POST /bookings/:id/cancel
// ---------------------------------------------------------------------------

const cancelSchema = z.object({
  hoursBeforeDeparture: z.number().nonnegative(),
});

bookingRoutes.post("/bookings/:id/cancel", requireCustomerSession, async (c) => {
  const parsed = cancelSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.cancelBooking(db, c.env.DB, {
    bookingId: c.req.param("id")!,
    ...parsed.data,
  });
  return respond(c, result);
});

// ---------------------------------------------------------------------------
// REQ-BOOK08 — POST /admin/bookings (owner-created from an agreed enquiry)
// ---------------------------------------------------------------------------

const ownerCreateSchema = z.object({
  departureId: z.string().min(1),
  partySize: z.number().int().min(1).max(10),
  agreedTotalPricePence: z.number().int().positive(),
  customerEmail: z.string().email(),
});

bookingRoutes.post("/admin/bookings", requireOperatorSession, async (c) => {
  const parsed = ownerCreateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.ownerCreateBooking(db, c.env.DB, parsed.data);
  if (!result.ok) return respond(c, result);

  const completionLinkSent = await sendBookingCompletionLink(
    c,
    result.value.id,
    parsed.data.customerEmail
  );
  return c.json({ ...(result.value as object), completionLinkSent });
});

// ---------------------------------------------------------------------------
// REQ-BOOK10 — POST /admin/bookings/provisional
// ---------------------------------------------------------------------------

const provisionalSchema = z.object({
  departureId: z.string().min(1),
  partySize: z.number().int().min(1).max(10),
  pricePerPersonPence: z.number().int().positive(),
  holdExpiresAt: z.string().min(1),
  depositRequiredPence: z.number().int().nonnegative().nullable().default(null),
  reminderCadence: z.string().nullable().default(null),
  customerEmail: z.string().email(),
});

bookingRoutes.post("/admin/bookings/provisional", requireOperatorSession, async (c) => {
  const parsed = provisionalSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.createProvisionalBooking(db, c.env.DB, parsed.data);
  if (!result.ok) return respond(c, result);

  const completionLinkSent = await sendBookingCompletionLink(
    c,
    result.value.id,
    parsed.data.customerEmail
  );
  return c.json({ ...(result.value as object), completionLinkSent });
});

// ---------------------------------------------------------------------------
// REQ-BOOK11 — POST /admin/departures
// ---------------------------------------------------------------------------

const createDepartureSchema = z.object({
  tourId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  capacity: z.number().int().min(1).max(10),
  guideId: z.string().nullable().optional(),
  gracePeriodMinutes: z.number().int().nonnegative().optional(),
});

bookingRoutes.post("/admin/departures", requireOperatorSession, async (c) => {
  const parsed = createDepartureSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.createDeparture(db, parsed.data);
  return respond(c, result);
});

// ---------------------------------------------------------------------------
// REQ-BOOK12 — PATCH /admin/departures/:id
// ---------------------------------------------------------------------------

const updateDepartureSchema = z.object({
  date: z.string().min(1).optional(),
  time: z.string().min(1).optional(),
  capacity: z.number().int().min(1).max(10).optional(),
  guideId: z.string().nullable().optional(),
});

bookingRoutes.patch("/admin/departures/:id", requireOperatorSession, async (c) => {
  const parsed = updateDepartureSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.updateDeparture(db, { departureId: c.req.param("id")!, ...parsed.data });
  return respond(c, result);
});

// ---------------------------------------------------------------------------
// REQ-BOOK13 — POST /admin/departures/:id/cancel
// ---------------------------------------------------------------------------

bookingRoutes.post("/admin/departures/:id/cancel", requireOperatorSession, async (c) => {
  const db = createDb(c.env.DB);
  const result = await service.cancelDeparture(db, c.env.DB, c.req.param("id")!);
  return respond(c, result);
});

// ---------------------------------------------------------------------------
// REQ-BOOK14 — POST /admin/departures/:id/bike-assignments
// ---------------------------------------------------------------------------

const assignBikeSchema = z.object({
  bikeId: z.string().min(1),
});

bookingRoutes.post("/admin/departures/:id/bike-assignments", requireOperatorSession, async (c) => {
  const parsed = assignBikeSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.assignBike(db, { departureId: c.req.param("id")!, bikeId: parsed.data.bikeId });
  return respond(c, result);
});

// ---------------------------------------------------------------------------
// REQ-BOOK15 — PATCH /admin/bookings/:id (owner-assisted edit, DR-B12b)
// ---------------------------------------------------------------------------

const ownerEditBookingSchema = z.object({
  newDepartureId: z.string().min(1).optional(),
  participants: z
    .array(
      z.object({
        name: z.string().min(1),
        age_band: z.enum(["under-12", "12-17", "18+", "60+"]),
        contact_role: z.enum(["leader", "co-leader", "attendee"]),
        notes: z.string().nullable().optional(),
      })
    )
    .min(1)
    .optional(),
});

bookingRoutes.patch("/admin/bookings/:id", requireOperatorSession, async (c) => {
  const parsed = ownerEditBookingSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.ownerEditBooking(db, c.env.DB, {
    bookingId: c.req.param("id")!,
    newDepartureId: parsed.data.newDepartureId,
    participants: parsed.data.participants?.map((p) => ({
      name: p.name,
      age_band: p.age_band,
      contactRole: p.contact_role,
      notes: p.notes,
    })),
  });
  return respond(c, result);
});

// ---------------------------------------------------------------------------
// REQ-BOOK16 — POST /admin/bookings/:id/transition (DR-B12c)
// ---------------------------------------------------------------------------

const transitionSchema = z.object({
  transition: z.enum(["confirm", "cancel", "mark_abandoned"]),
  hoursBeforeDeparture: z.number().optional(),
});

bookingRoutes.post("/admin/bookings/:id/transition", requireOperatorSession, async (c) => {
  const parsed = transitionSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const db = createDb(c.env.DB);
  const result = await service.transitionBookingStatus(db, c.env.DB, {
    bookingId: c.req.param("id")!,
    transition: parsed.data.transition,
    hoursBeforeDeparture: parsed.data.hoursBeforeDeparture,
  });
  return respond(c, result);
});

export default bookingRoutes;
