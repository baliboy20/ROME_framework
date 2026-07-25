export interface PaymentRow {
  session_id: string;
  payment_intent_id: string | null;
  reference: string;
  amount_pence: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';
  customer_email: string | null;
  refund_amount_pence: number | null;
  refund_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function insertPendingPayment(
  db: D1Database,
  params: {
    sessionId: string;
    reference: string;
    amountPence: number;
    customerEmail: string | null;
  },
): Promise<void> {
  // OR IGNORE: an idempotent retry (same Idempotency-Key) returns the same Stripe session id,
  // which would otherwise violate the session_id primary key on the second insert attempt.
  await db
    .prepare(
      `INSERT OR IGNORE INTO payments (session_id, reference, amount_pence, currency, status, customer_email)
       VALUES (?, ?, ?, 'gbp', 'pending', ?)`,
    )
    .bind(params.sessionId, params.reference, params.amountPence, params.customerEmail)
    .run();
}

export async function getPaymentBySessionId(
  db: D1Database,
  sessionId: string,
): Promise<PaymentRow | null> {
  const row = await db
    .prepare('SELECT * FROM payments WHERE session_id = ?')
    .bind(sessionId)
    .first<PaymentRow>();
  return row ?? null;
}

export async function markPaymentStatus(
  db: D1Database,
  params: {
    sessionId: string;
    paymentIntentId: string | null;
    status: PaymentRow['status'];
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE payments
       SET status = ?, payment_intent_id = COALESCE(?, payment_intent_id), updated_at = datetime('now')
       WHERE session_id = ?`,
    )
    .bind(params.status, params.paymentIntentId, params.sessionId)
    .run();
}

export async function listPayments(db: D1Database, limit = 50): Promise<PaymentRow[]> {
  const result = await db
    .prepare('SELECT * FROM payments ORDER BY created_at DESC LIMIT ?')
    .bind(limit)
    .all<PaymentRow>();
  return result.results;
}

export async function applyRefund(
  db: D1Database,
  params: {
    sessionId: string;
    refundId: string;
    refundAmountPence: number;
    fullyRefunded: boolean;
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE payments
       SET status = ?, refund_id = ?, refund_amount_pence = ?, updated_at = datetime('now')
       WHERE session_id = ?`,
    )
    .bind(
      params.fullyRefunded ? 'refunded' : 'partially_refunded',
      params.refundId,
      params.refundAmountPence,
      params.sessionId,
    )
    .run();
}

/**
 * Records a webhook event for the audit log (S2), returning `true` if this is the first time
 * we've seen this event id (i.e. the caller should process it) or `false` if it's a dedupe hit
 * (Stripe redelivered the same event — already processed, skip side effects like the email).
 */
export async function recordWebhookEventIfNew(
  db: D1Database,
  params: { eventId: string; type: string; payload: string },
): Promise<boolean> {
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO webhook_events (event_id, type, payload, processing_status)
       VALUES (?, ?, ?, 'ok')`,
    )
    .bind(params.eventId, params.type, params.payload)
    .run();
  return result.meta.changes > 0;
}
