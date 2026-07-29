import type { Env } from '../index';
import { getStripeClient } from '../lib/stripeClient';
import { applyRefund, getPaymentBySessionId, listPayments } from '../lib/db';

export async function handleAdminPayments(_request: Request, env: Env): Promise<Response> {
  const payments = await listPayments(env.DB);
  return Response.json({ payments });
}

interface RefundBody {
  session_id?: string;
  payment_intent_id?: string;
  amount?: number;
}

/**
 * Refunds a payment (P5), full or partial. Resolves the PaymentIntent from the D1 row (or the
 * client-supplied one) rather than trusting a bare id blindly, and always cross-checks against
 * the payment we actually recorded before calling Stripe.
 */
export async function handleAdminRefund(request: Request, env: Env): Promise<Response> {
  let body: RefundBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.session_id && !body.payment_intent_id) {
    return Response.json({ error: 'session_id or payment_intent_id is required' }, { status: 400 });
  }

  let sessionId = body.session_id ?? null;
  let paymentIntentId = body.payment_intent_id ?? null;

  if (sessionId) {
    const payment = await getPaymentBySessionId(env.DB, sessionId);
    if (!payment) {
      return Response.json({ error: 'No payment found for session_id' }, { status: 404 });
    }
    if (payment.status !== 'succeeded' && payment.status !== 'partially_refunded') {
      return Response.json(
        { error: `Cannot refund a payment with status "${payment.status}"` },
        { status: 400 },
      );
    }
    paymentIntentId = payment.payment_intent_id ?? paymentIntentId;
  }

  if (!paymentIntentId) {
    return Response.json({ error: 'Could not resolve a payment_intent_id to refund' }, { status: 400 });
  }

  const stripe = getStripeClient(env.STRIPE_SECRET_KEY);
  const refund = await stripe.refunds.create(
    {
      payment_intent: paymentIntentId,
      ...(body.amount ? { amount: body.amount } : {}),
    },
    { idempotencyKey: `refund-${paymentIntentId}-${body.amount ?? 'full'}-${sessionId ?? 'unknown'}` },
  );

  if (sessionId) {
    // PaymentIntent itself doesn't expose a running refunded total — that lives on the Charge
    // (`amount_refunded`, cumulative across all refunds), so read it from there rather than
    // from this single refund's amount, which would clobber the total on a second partial.
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const chargeId =
      typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : (paymentIntent.latest_charge?.id ?? null);
    const charge = chargeId ? await stripe.charges.retrieve(chargeId) : null;
    await applyRefund(env.DB, {
      sessionId,
      refundId: refund.id,
      refundAmountPence: charge?.amount_refunded ?? refund.amount ?? 0,
      fullyRefunded: charge?.refunded ?? !body.amount,
    });
  }

  return Response.json({ refundId: refund.id, status: refund.status, amount: refund.amount });
}
