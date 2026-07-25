import type { Env } from '../index';
import { getStripeClient } from '../lib/stripeClient';
import { markPaymentStatus } from '../lib/db';

/**
 * S3: sweeps D1 for payments still `pending` and repairs them by asking Stripe directly for the
 * session's current status. Covers the case where a webhook was never delivered (network blip,
 * endpoint briefly down) and the payment silently never got fulfilled server-side. Safe to run
 * repeatedly — for genuinely-open sessions it's a no-op each time until they resolve.
 */
export async function handleReconcile(_request: Request, env: Env): Promise<Response> {
  const pending = await env.DB.prepare(
    `SELECT session_id FROM payments WHERE status = 'pending' ORDER BY created_at ASC LIMIT 100`,
  ).all<{ session_id: string }>();

  const stripe = getStripeClient(env.STRIPE_SECRET_KEY);
  const repaired: string[] = [];
  const stillPending: string[] = [];
  const errors: { session_id: string; error: string }[] = [];

  for (const row of pending.results) {
    try {
      const session = await stripe.checkout.sessions.retrieve(row.session_id);

      if (session.status === 'complete' && session.payment_status === 'paid') {
        await markPaymentStatus(env.DB, {
          sessionId: row.session_id,
          paymentIntentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          status: 'succeeded',
        });
        repaired.push(row.session_id);
      } else if (session.status === 'expired') {
        await markPaymentStatus(env.DB, {
          sessionId: row.session_id,
          paymentIntentId: null,
          status: 'failed',
        });
        repaired.push(row.session_id);
      } else {
        stillPending.push(row.session_id);
      }
    } catch (err) {
      errors.push({ session_id: row.session_id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return Response.json({ checked: pending.results.length, repaired, stillPending, errors });
}
