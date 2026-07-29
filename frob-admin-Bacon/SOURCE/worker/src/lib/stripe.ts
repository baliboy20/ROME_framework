// FOB payments — Stripe Embedded Checkout client + fulfilment + refunds.
//
// satisfies: TDR-06 (Stripe Embedded Checkout, `ui_mode:'embedded'` +
// `initEmbeddedCheckout`, pinned apiVersion, fulfilment driven only by
// `checkout.session.completed`), TDR-05 (idempotency: `payments` insert
// `INSERT OR IGNORE` on `session_id`, `webhook_events` `INSERT OR IGNORE`
// on the provider event id).
//
// Pattern adapted (REFERENCE ONLY, no code copied — DEV-4 greenfield) from
// `_user_input/reference/stripe-poc/SOURCE/worker/src/lib/stripeClient.ts`,
// `routes/checkoutSession.ts`, `routes/webhook.ts`. Divergences from the
// PoC: (1) email via Postmark, not Resend (TDR-09) — left to the
// core-notifications module via `db.reminders`/`message` tables, not
// implemented here; (2) admin/refund access is a core-auth operator
// session, not a static admin key (DR-B9, see `src/lib/auth.ts`).

import Stripe from "stripe";
import type { Db } from "../db/client";
import { confirmCapacity } from "../modules/booking/capacity";

/** Pinned per the stripe-poc reference and TDR-06 — never left to the SDK default. */
const STRIPE_API_VERSION = "2025-02-24.acacia" as const;

export function getStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export interface CreateCheckoutSessionInput {
  bookingId: string;
  amountPence: number;
  returnUrlBase: string;
  customerEmail?: string | null;
  idempotencyKey: string;
}

export interface CreateCheckoutSessionResult {
  clientSecret: string | null;
  sessionId: string;
}

/**
 * Creates (or, on a retried idempotency key, returns the existing) Stripe
 * Embedded Checkout session for a booking's total price, and records the
 * pending payment attempt. `payments.session_id` and
 * `payments.idempotency_key` are both UNIQUE, so a retried submission with
 * the same idempotency key that raced past Stripe's own dedupe still can't
 * create a second payment row (satisfies: TDR-05, REQ-BOOK04's "at most
 * one active, non-superseded payment attempt" invariant).
 */
export async function createCheckoutSession(
  stripe: Stripe,
  db: Db,
  input: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionResult> {
  // Stripe itself dedupes session.create on a repeated Idempotency-Key
  // within its idempotency window and returns the original session
  // (REQ-BOOK04's "repeated identical submission" case). We additionally
  // guard the local `payments` write below with INSERT-OR-IGNORE semantics
  // so a retried request can never produce two payment rows for one
  // session (satisfies: TDR-05).
  const session = await stripe.checkout.sessions.create(
    {
      ui_mode: "embedded",
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: `Friends on Bikes — booking ${input.bookingId}` },
            unit_amount: input.amountPence,
          },
          quantity: 1,
        },
      ],
      client_reference_id: input.bookingId,
      metadata: { booking_id: input.bookingId },
      return_url: `${input.returnUrlBase}/return?session_id={CHECKOUT_SESSION_ID}`,
      ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
    },
    { idempotencyKey: input.idempotencyKey }
  );

  // `session_id` and `idempotency_key` are both UNIQUE (migrations/0001_init.sql)
  // so a retry that raced past Stripe's own dedupe throws a constraint
  // violation here rather than duplicating the row — treat that as the
  // OR-IGNORE case and return the already-recorded session.
  try {
    await db.payments.create({
      id: crypto.randomUUID(),
      booking_id: input.bookingId,
      session_id: session.id,
      status: "pending",
      amount_pence: input.amountPence,
      refund_amount_pence: 0,
      idempotency_key: input.idempotencyKey,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    const alreadyRecorded = await db.payments.getBySessionId(session.id);
    if (!alreadyRecorded) throw err;
  }

  return { clientSecret: session.client_secret, sessionId: session.id };
}

export interface WebhookResult {
  received: true;
  deduped?: true;
  /** Set when this event newly confirmed a booking — the route dispatches the
   *  confirmation email for it (kept out of this lib so stripe.ts stays free of
   *  the notifications dependency). */
  confirmedBookingId?: string;
}

/**
 * Verifies and processes a Stripe webhook event. Fulfilment (booking
 * confirmation + capacity confirm) happens ONLY on `checkout.session.completed`
 * (satisfies: TDR-06) — no other event type mutates booking/capacity state.
 * Idempotent via `webhook_events` INSERT OR IGNORE keyed on the Stripe
 * event id (satisfies: TDR-05) — a redelivered event is deduped before any
 * side effect runs, so a booking is confirmed and capacity decremented
 * exactly once per payment (REQ-BOOK05 invariant).
 */
export async function handleStripeWebhook(
  stripe: Stripe,
  db: Db,
  rawDb: D1Database,
  rawBody: string,
  signature: string | null,
  webhookSecret: string
): Promise<{ status: number; body: WebhookResult | { error: string } }> {
  if (!signature) {
    return { status: 400, body: { error: "missing_signature" } };
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch {
    return { status: 400, body: { error: "invalid_signature" } };
  }

  const isNew = await db.claimIdempotencyKey(event.id);
  if (!isNew) {
    return { status: 200, body: { received: true, deduped: true } };
  }

  let confirmedBookingId: string | undefined;
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        confirmedBookingId = (await fulfilCheckoutSession(db, rawDb, session)) ?? undefined;
      }
    }
    // All other event types are recorded (idempotency claimed above) but do
    // not drive fulfilment — satisfies TDR-06's "only checkout.session.completed".
  } catch {
    // FINDING-007 (REQ-BOOK05): the claim above was taken BEFORE fulfilment.
    // If fulfilment fails (e.g. a transient D1 error) the claim must be
    // RELEASED and a non-2xx returned, so Stripe's redelivery of this same
    // event id is processed rather than wrongly deduped — otherwise the
    // booking is stuck `draft` forever behind a permanently-claimed key.
    // A redelivery after a SUCCESSFUL first processing is still deduped.
    await db.releaseIdempotencyKey(event.id);
    return { status: 500, body: { error: "fulfilment_failed" } };
  }

  return { status: 200, body: { received: true, confirmedBookingId } };
}

/**
 * Confirms a paid booking exactly once: marks the payment succeeded,
 * confirms the booking, and atomically moves the departure's held capacity
 * to confirmed (REQ-BOOK05 invariant: "capacity is decremented exactly
 * once per confirmed booking"). Safe to call only after the caller has
 * already claimed the webhook event's idempotency key — a redelivered
 * event never reaches here twice.
 */
async function fulfilCheckoutSession(
  db: Db,
  rawDb: D1Database,
  session: Stripe.Checkout.Session
): Promise<string | null> {
  const payment = await db.payments.getBySessionId(session.id);
  if (!payment) return null; // unknown session — nothing to fulfil

  const booking = await db.bookings.get(payment.booking_id);
  if (!booking) return null;

  if (payment.status !== "succeeded") {
    await db.payments.update(payment.id, { status: "succeeded" });
  }

  if (booking.status !== "confirmed") {
    await confirmCapacity(rawDb, booking.departure_id, booking.party_size);
    await db.bookings.update(booking.id, {
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    });
  }
  // Signal the route to dispatch the confirmation email for this booking.
  return booking.id;
}

export interface RefundResult {
  refundId: string;
  cumulativeRefundedPence: number;
  fullyRefunded: boolean;
}

/**
 * Issues a Stripe refund and returns the CUMULATIVE refunded-so-far amount
 * sourced from `charge.amount_refunded` (the authoritative Stripe total,
 * not a locally-summed value) — satisfies: TDR-06, UXD-01 ("cumulative
 * refunded after this" must never be misread as the latest single refund).
 */
export async function issueRefund(
  stripe: Stripe,
  sessionId: string,
  refundAmountPence: number
): Promise<RefundResult> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  const paymentIntent = session.payment_intent;
  const paymentIntentId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
  if (!paymentIntentId) {
    throw new Error("no_payment_intent_for_session");
  }

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: refundAmountPence,
  });

  // Re-read the charge for the authoritative cumulative total (UXD-01) —
  // never sum refunds locally, Stripe is the source of truth.
  const chargeId = typeof refund.charge === "string" ? refund.charge : refund.charge?.id;
  const charge = chargeId ? await stripe.charges.retrieve(chargeId) : null;
  const cumulativeRefundedPence = charge?.amount_refunded ?? refundAmountPence;
  const fullyRefunded = charge ? charge.refunded : false;

  return { refundId: refund.id, cumulativeRefundedPence, fullyRefunded };
}
