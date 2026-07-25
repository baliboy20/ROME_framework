// FOB back-office routes — realizes REQ-BO04/05/06 (Owner-facing, read-only).
//
// satisfies: TDR-07 (core-auth KV session — every route here is guarded by
// an operator session; owner/secondary_operator only, per DR-B9). All
// persistence via core-data-access (TDR-03).

import { Hono } from "hono";
import { getSession } from "../kv/session";
import { createDb } from "../db/client";
import type { Env } from "../env";
import type { AuthSession } from "../types";

export const backoffice = new Hono<{ Bindings: Env; Variables: { session: AuthSession } }>();

// ---------------------------------------------------------------------------
// core-auth operator-session guard
// ---------------------------------------------------------------------------

function extractToken(c: { req: { header: (name: string) => string | undefined } }): string | null {
  const auth = c.req.header("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length);
  return null;
}

backoffice.use("*", async (c, next) => {
  const token = extractToken(c);
  if (!token) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const session = await getSession(c.env.SESSIONS, token);
  if (!session) {
    return c.json({ error: "unauthorized" }, 401);
  }
  if (session.actor_type !== "owner" && session.actor_type !== "secondary_operator") {
    return c.json({ error: "unauthorized" }, 401);
  }
  c.set("session", session);
  await next();
});

// ---------------------------------------------------------------------------
// REQ-BO04 — GET /admin/calendar
// ---------------------------------------------------------------------------

backoffice.get("/admin/calendar", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");
  const db = createDb(c.env.DB);

  // core-data-access exposes departures by id only; a range scan needs a
  // raw query, kept local to this read-only view.
  const rows = await c.env.DB.prepare(
    `SELECT * FROM departures
       WHERE (? IS NULL OR date >= ?) AND (? IS NULL OR date <= ?)
       ORDER BY date ASC, time ASC`
  )
    .bind(from ?? null, from ?? null, to ?? null, to ?? null)
    .all();
  const departures = rows.results ?? [];

  const enriched = await Promise.all(
    departures.map(async (d) => {
      const departureId = String((d as Record<string, unknown>).id);
      const bookings = await db.bookings.listByDeparture(departureId);
      const bikeAssignments = await db.bikeAssignments.listByDeparture(departureId);
      const readiness = await db.tourReadiness.getByDeparture(departureId);
      return {
        ...d,
        booked_count: bookings.filter((b) => b.status === "confirmed").length,
        bike_count: bikeAssignments.filter((a) => a.removed_at === null).length,
        readiness_status: readiness?.status ?? "in_progress",
      };
    })
  );

  if (enriched.length === 0) {
    return c.json({ departures: [], message: "No departures scheduled in this range." }, 200);
  }
  return c.json({ departures: enriched }, 200);
});

// ---------------------------------------------------------------------------
// REQ-BO05 — GET /admin/bookings (search)
// ---------------------------------------------------------------------------

backoffice.get("/admin/bookings", async (c) => {
  const reference = c.req.query("reference");
  const status = c.req.query("status");
  const tourId = c.req.query("tour_id");
  const date = c.req.query("date");

  const clauses: string[] = [];
  const params: unknown[] = [];

  if (reference) {
    clauses.push("b.id = ?");
    params.push(reference);
  }
  if (status) {
    clauses.push("b.status = ?");
    params.push(status);
  }
  if (tourId) {
    clauses.push("d.tour_id = ?");
    params.push(tourId);
  }
  if (date) {
    clauses.push("d.date = ?");
    params.push(date);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  // BO05 invariant: never expose card data — select only provider refs from
  // `payments`, never raw payment fields, and no card data exists in this
  // schema anyway (payments only ever stores provider session ids).
  // FINDING-001: enrich rows so the Payments screen (PaymentRow) is not hollow.
  // Still exposes only provider session refs (never card data) per BO05.
  const sql = `
    SELECT b.id, b.id AS booking_ref, b.status, b.source, b.party_size,
           b.price_total_pence, b.created_at, d.tour_id, d.date, d.time,
           (SELECT name FROM participants
              WHERE booking_id = b.id AND is_lead_booker = 1 LIMIT 1) AS customer_name,
           COALESCE((SELECT SUM(amount_pence) FROM payments
              WHERE booking_id = b.id), 0) AS paid_pence,
           COALESCE((SELECT SUM(refund_amount_pence) FROM payments
              WHERE booking_id = b.id), 0) AS refunded_pence,
           (SELECT session_id FROM payments
              WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) AS provider_ref,
           (SELECT status FROM payments
              WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) AS payment_status
      FROM bookings b
      JOIN departures d ON d.id = b.departure_id
      ${where}
     ORDER BY b.created_at DESC
     LIMIT 100`;
  const result = await c.env.DB.prepare(sql)
    .bind(...params)
    .all();
  const bookings = result.results ?? [];

  if (bookings.length === 0) {
    return c.json({ bookings: [], message: "No bookings match these criteria." }, 200);
  }
  return c.json({ bookings }, 200);
});

// ---------------------------------------------------------------------------
// REQ-BO06 — GET /admin/bookings/:id
// ---------------------------------------------------------------------------

backoffice.get("/admin/bookings/:id", async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  const booking = await db.bookings.get(id);
  if (!booking) {
    return c.json({ error: "the booking reference is not found", message: "No booking found for that reference." }, 404);
  }

  const [participants, payments, consents] = await Promise.all([
    db.participants.listByBooking(id),
    db.payments.listByBooking(id),
    // consents are keyed by prospect, not booking, in this schema; booking
    // itself carries waiver/terms acceptance timestamps directly.
    Promise.resolve([]),
  ]);

  // BO06 invariant: payment data shown only as provider references, never
  // card data — `payments.session_id` is the Stripe session reference.
  const paymentRefs = payments.map((p) => ({
    id: p.id,
    status: p.status,
    amount_pence: p.amount_pence,
    refund_amount_pence: p.refund_amount_pence,
    provider_reference: p.session_id,
  }));

  return c.json(
    {
      booking,
      attendees: participants,
      emergency_contact: {
        name: booking.emergency_contact_name,
        phone: booking.emergency_contact_phone,
        relationship: booking.emergency_contact_relationship,
      },
      payments: paymentRefs,
      consent: {
        waiver_accepted_at: booking.waiver_accepted_at,
        terms_accepted_at: booking.terms_accepted_at,
      },
      status_history: {
        created_at: booking.created_at,
        confirmed_at: booking.confirmed_at,
        cancelled_at: booking.cancelled_at,
      },
      consents,
    },
    200
  );
});
