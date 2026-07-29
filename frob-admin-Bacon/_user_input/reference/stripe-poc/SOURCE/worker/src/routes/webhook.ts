import type Stripe from 'stripe';
import type { Env } from '../index';
import { getStripeClient } from '../lib/stripeClient';
import { markPaymentStatus, recordWebhookEventIfNew } from '../lib/db';
import { sendConfirmationEmail } from '../lib/resend';

const SUCCESS_TYPES = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
]);
const FAILURE_TYPES = new Set(['checkout.session.async_payment_failed', 'checkout.session.expired']);

// P6: security alerting. A POC has no real paging/Slack channel, so "alert" means a structured,
// grep-able console.error a reviewer would wire to actual alerting in production.
const DECLINE_ALERT_THRESHOLD = 3;
const DECLINE_ALERT_WINDOW_MS = 5 * 60_000;
const declineTimestamps = new Map<string, number[]>();

function recordDeclineAndMaybeAlert(key: string): void {
  const now = Date.now();
  const timestamps = (declineTimestamps.get(key) ?? []).filter((t) => now - t < DECLINE_ALERT_WINDOW_MS);
  timestamps.push(now);
  declineTimestamps.set(key, timestamps);
  if (timestamps.length >= DECLINE_ALERT_THRESHOLD) {
    console.error(
      `[SECURITY ALERT] ${timestamps.length} declined payments for "${key}" within ${DECLINE_ALERT_WINDOW_MS / 60_000}min — possible card testing / fraud`,
    );
  }
}

/**
 * Fulfilment lives here, not in the browser return page. Every event is verified via the
 * signing secret (rejects unverified), deduped by Stripe event id in D1 (S2), and processed
 * idempotently — replaying the same event twice must not send a second email.
 *
 * Workers' runtime doesn't expose Node's synchronous crypto APIs the Stripe SDK's default
 * `constructEvent` relies on, so this uses `constructEventAsync` (SubtleCrypto-based) per
 * Stripe's Cloudflare Workers guide.
 */
export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('Stripe-Signature');
  const rawBody = await request.text();

  if (!signature) {
    return Response.json({ error: 'Missing Stripe-Signature header' }, { status: 400 });
  }

  const stripe = getStripeClient(env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const isNew = await recordWebhookEventIfNew(env.DB, {
    eventId: event.id,
    type: event.type,
    payload: rawBody,
  });

  if (!isNew) {
    // Already processed this event id — acknowledge without repeating side effects.
    return Response.json({ received: true, deduped: true });
  }

  if (SUCCESS_TYPES.has(event.type) || FAILURE_TYPES.has(event.type)) {
    const session = event.data.object as Stripe.Checkout.Session;
    const succeeded = SUCCESS_TYPES.has(event.type) && session.payment_status === 'paid';

    await markPaymentStatus(env.DB, {
      sessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null),
      status: succeeded ? 'succeeded' : 'failed',
    });

    if (succeeded) {
      const email = session.customer_details?.email ?? session.customer_email;
      const reference = session.client_reference_id ?? session.metadata?.reference ?? 'unknown';
      if (email) {
        await sendConfirmationEmail(env.RESEND_API_KEY, env.RESEND_FROM_EMAIL, {
          to: email,
          reference,
          amountPence: session.amount_total ?? 0,
        });
      }
    } else if (FAILURE_TYPES.has(event.type)) {
      // P6: repeated declines against the same reference/customer within a short window is a
      // card-testing/fraud signal worth surfacing, even though a single decline is normal.
      const key = session.customer_email ?? session.client_reference_id ?? 'unknown';
      recordDeclineAndMaybeAlert(key);
    }
  } else if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object as Stripe.Dispute;
    console.error(
      `[SECURITY ALERT] Dispute opened: charge=${dispute.charge} amount=${dispute.amount} reason=${dispute.reason}`,
    );
  }

  return Response.json({ received: true });
}
