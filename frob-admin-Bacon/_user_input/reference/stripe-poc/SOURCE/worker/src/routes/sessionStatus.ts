import type { Env } from '../index';
import { getStripeClient } from '../lib/stripeClient';

/**
 * UI-only status lookup for the return page. This is NEVER the source of truth for fulfilment —
 * that's the checkout.session.completed webhook (see routes/webhook.ts). A customer can pay and
 * lose their connection before this endpoint is ever called; the booking is still confirmed
 * server-side via the webhook regardless.
 */
export async function handleSessionStatus(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return Response.json({ error: 'session_id is required' }, { status: 400 });
  }

  const stripe = getStripeClient(env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return Response.json({
    status: session.status,
    payment_status: session.payment_status,
  });
}
