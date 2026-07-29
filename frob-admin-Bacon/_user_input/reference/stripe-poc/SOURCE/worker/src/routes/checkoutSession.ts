import type Stripe from 'stripe';
import type { Env } from '../index';
import { getStripeClient } from '../lib/stripeClient';
import { insertPendingPayment } from '../lib/db';

interface CreateSessionBody {
  amount?: number;
  reference?: string;
  customer_email?: string;
}

/**
 * Creates a Stripe Checkout Session with ui_mode: 'embedded' (the lightweight embedded-form
 * mode). The client mounts it via `stripe.createEmbeddedCheckoutPage(...)` — NOT
 * `initEmbeddedCheckout`, which Stripe has removed client-side despite still describing it in
 * docs fetched 2026-07-17 (https://docs.stripe.com/checkout/embedded/quickstart); confirmed by a
 * live browser error, see LEARNINGS.md. The session's `ui_mode: 'embedded'` is still correct —
 * only the JS method name changed.
 *
 * The amount is entirely server-side (from the trusted request body validated here, never from
 * a client-supplied Stripe object); the client only ever receives `clientSecret`.
 */
export async function handleCheckoutSession(request: Request, env: Env): Promise<Response> {
  let body: CreateSessionBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const amountPence = body.amount;
  const reference = body.reference;
  const customerEmail = body.customer_email ?? null;

  if (!Number.isInteger(amountPence) || amountPence == null || amountPence <= 0) {
    return Response.json({ error: 'amount must be a positive integer (pence)' }, { status: 400 });
  }
  if (!reference || typeof reference !== 'string') {
    return Response.json({ error: 'reference is required' }, { status: 400 });
  }

  const stripe = getStripeClient(env.STRIPE_SECRET_KEY);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    ui_mode: 'embedded',
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: { name: `Friends on Bikes — ${reference}` },
          unit_amount: amountPence,
        },
        quantity: 1,
      },
    ],
    client_reference_id: reference,
    metadata: { reference },
    return_url: `${env.ALLOWED_ORIGIN}/return?session_id={CHECKOUT_SESSION_ID}`,
    ...(customerEmail ? { customer_email: customerEmail } : {}),
  };

  // Idempotency (S1): the caller supplies a stable key per submit attempt (e.g. a UUID
  // generated once when the user clicks "Pay") via the Idempotency-Key header. Retrying the
  // same request with the same key returns the original session instead of creating a new one.
  // If the caller omits it, fall back to a key derived from the request body only — repeats of
  // an identical body within Stripe's idempotency window are still deduped, though a caller that
  // wants retry-safety across truly distinct clicks should always send its own key.
  const idempotencyKey =
    request.headers.get('Idempotency-Key') ?? `checkout-session-${reference}-${amountPence}`;

  const session = await stripe.checkout.sessions.create(sessionParams, { idempotencyKey });

  await insertPendingPayment(env.DB, {
    sessionId: session.id,
    reference,
    amountPence,
    customerEmail,
  });

  return Response.json({ clientSecret: session.client_secret, sessionId: session.id });
}
