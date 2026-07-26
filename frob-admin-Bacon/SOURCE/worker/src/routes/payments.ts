// FOB api-worker — payment routes (REQ-BOOK04/05/07 money path).
//
// satisfies: TDR-06 (Stripe Embedded Checkout, fulfilment only on
// checkout.session.completed), TDR-05 (idempotency), DR-B9 (operator
// session guards admin refund access, not a static admin key).

import { Hono, type Context } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { createDb } from "../db/client";
import { type AuthedVariables, requireCustomerSession, requireOperatorSession } from "../lib/auth";
import { createCheckoutSession, getStripeClient, handleStripeWebhook, issueRefund } from "../lib/stripe";
import { confirmCapacity } from "../modules/booking/capacity";
import { sendBookingOutcome } from "../modules/notifications/booking-outcome";

export const paymentRoutes = new Hono<{ Bindings: Env; Variables: AuthedVariables }>();

type AppContext = Context<{ Bindings: Env; Variables: AuthedVariables }>;

// ---------------------------------------------------------------------------
// REQ-BOOK04 — POST /bookings/:id/checkout-session
// ---------------------------------------------------------------------------

// customerEmail is only a Stripe Checkout *prefill* — Stripe Embedded Checkout
// collects and validates the real payer email itself. A malformed or missing
// prefill must therefore never 422 the whole payment: .catch(undefined) drops
// an invalid value instead of failing the request.
const checkoutSessionSchema = z.object({
  customerEmail: z.string().email().optional().catch(undefined),
});

paymentRoutes.post("/bookings/:id/checkout-session", requireCustomerSession, async (c: AppContext) => {
  const bookingId = c.req.param("id")!;
  const parsed = checkoutSessionSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const idempotencyKey = c.req.header("Idempotency-Key");
  if (!idempotencyKey) {
    return c.json({ error: "missing_idempotency_key", message: "Idempotency-Key header is required" }, 422);
  }

  const db = createDb(c.env.DB);
  const booking = await db.bookings.get(bookingId);
  if (!booking) return c.json({ error: "booking_not_found", message: "Booking not found" }, 404);
  if (booking.status !== "draft") {
    return c.json({ error: "not_payable", message: "This booking is not awaiting payment" }, 409);
  }

  const stripe = getStripeClient(c.env.STRIPE_SECRET_KEY);
  try {
    const session = await createCheckoutSession(stripe, db, {
      bookingId,
      amountPence: booking.price_total_pence,
      returnUrlBase: c.env.ALLOWED_ORIGIN ?? "https://friendsonbikes.uk",
      customerEmail: parsed.data.customerEmail ?? null,
      idempotencyKey,
    });
    return c.json(session);
  } catch (err) {
    // Card declined and other Stripe-side failures — REQ-BOOK04 error case.
    return c.json({ error: "card_declined", message: err instanceof Error ? err.message : "Payment failed" }, 402);
  }
});

// ---------------------------------------------------------------------------
// REQ-BOOK05 — POST /webhooks/stripe
// ---------------------------------------------------------------------------

paymentRoutes.post("/webhooks/stripe", async (c: AppContext) => {
  const signature = c.req.header("Stripe-Signature") ?? null;
  const rawBody = await c.req.text();

  const db = createDb(c.env.DB);
  const stripe = getStripeClient(c.env.STRIPE_SECRET_KEY);

  const result = await handleStripeWebhook(stripe, db, c.env.DB, rawBody, signature, c.env.STRIPE_WEBHOOK_SECRET);
  // A newly-confirmed booking triggers its outcome email (paid-in-full flavour).
  // Idempotency-keyed inside the dispatcher, so redelivery never double-sends.
  const confirmedBookingId =
    "confirmedBookingId" in result.body ? result.body.confirmedBookingId : undefined;
  if (confirmedBookingId) {
    await sendBookingOutcome(db, c.env, confirmedBookingId);
  }
  return c.json(result.body, result.status as 200);
});

// ---------------------------------------------------------------------------
// REQ-BOOK07 (payment leg) — POST /admin/bookings/:id/refund
//
// The cancellation decision (auto >48h vs owner-manual <=48h) lives in
// modules/booking/service.ts::cancelBooking. This route is the operator
// action that actually moves money once a refund amount is decided —
// guarded by a core-auth operator session (DR-B9), never a static key.
// Cumulative refund math (UXD-01) is sourced from Stripe's own
// charge.amount_refunded, never summed locally.
// ---------------------------------------------------------------------------

const refundSchema = z.object({
  refundAmountPence: z.number().int().positive(),
});

paymentRoutes.post("/admin/bookings/:id/refund", requireOperatorSession, async (c: AppContext) => {
  const parsed = refundSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid_body", message: parsed.error.message }, 422);

  const bookingId = c.req.param("id")!;
  const db = createDb(c.env.DB);
  const payments = await db.payments.listByBooking(bookingId);
  const payment = payments.find((p) => p.status === "succeeded" || p.status === "partially_refunded");
  if (!payment) {
    return c.json({ error: "no_paid_payment", message: "No paid payment found for this booking" }, 404);
  }

  const alreadyRefunded = payment.refund_amount_pence;
  const wouldExceed = alreadyRefunded + parsed.data.refundAmountPence > payment.amount_pence;
  if (wouldExceed) {
    return c.json({ error: "refund_exceeds_paid", message: "A refund never exceeds the amount paid" }, 422);
  }

  const stripe = getStripeClient(c.env.STRIPE_SECRET_KEY);
  try {
    const refund = await issueRefund(stripe, payment.session_id, parsed.data.refundAmountPence);

    await db.payments.update(payment.id, {
      refund_amount_pence: refund.cumulativeRefundedPence,
      status: refund.fullyRefunded ? "refunded" : "partially_refunded",
    });

    return c.json({
      refundId: refund.refundId,
      cumulativeRefundedPence: refund.cumulativeRefundedPence,
      fullyRefunded: refund.fullyRefunded,
    });
  } catch (err) {
    // Refund-provider failure never blocks capacity restoration, which
    // happens in cancelBooking regardless (REQ-BOOK07 reliability note).
    return c.json(
      { error: "refund_failed", message: "We couldn't process the refund — William will follow up within one business day" },
      502
    );
  }
});

// ---------------------------------------------------------------------------
// Reconciliation sweep — repairs payments left `pending` by an undelivered
// webhook (belt-and-braces for TDR-06/REQ-BOOK05's "provider report never
// arrives" case). Operator-triggered here; also callable from cron-workers.
// ---------------------------------------------------------------------------

paymentRoutes.post("/admin/payments/reconcile", requireOperatorSession, async (c: AppContext) => {
  const db = createDb(c.env.DB);
  const stripe = getStripeClient(c.env.STRIPE_SECRET_KEY);

  const pending = await c.env.DB.prepare(
    `SELECT session_id FROM payments WHERE status = 'pending' ORDER BY created_at ASC LIMIT 100`
  ).all<{ session_id: string }>();

  const repaired: string[] = [];
  const stillPending: string[] = [];
  for (const row of pending.results ?? []) {
    const session = await stripe.checkout.sessions.retrieve(row.session_id);
    if (session.status === "complete" && session.payment_status === "paid") {
      const payment = await db.payments.getBySessionId(row.session_id);
      if (payment) {
        await db.payments.update(payment.id, { status: "succeeded" });
        const booking = await db.bookings.get(payment.booking_id);
        if (booking && booking.status !== "confirmed") {
          await confirmCapacity(c.env.DB, booking.departure_id, booking.party_size);
          await db.bookings.update(booking.id, { status: "confirmed", confirmed_at: new Date().toISOString() });
          // Catch-up confirmation email for bookings a missed webhook left pending.
          await sendBookingOutcome(db, c.env, booking.id);
        }
      }
      repaired.push(row.session_id);
    } else if (session.status === "expired") {
      const payment = await db.payments.getBySessionId(row.session_id);
      if (payment) await db.payments.update(payment.id, { status: "failed" });
      repaired.push(row.session_id);
    } else {
      stillPending.push(row.session_id);
    }
  }

  return c.json({ checked: pending.results?.length ?? 0, repaired, stillPending });
});

export default paymentRoutes;
