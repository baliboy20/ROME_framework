CREATE TABLE IF NOT EXISTS payments (
  session_id TEXT PRIMARY KEY,
  payment_intent_id TEXT,
  reference TEXT NOT NULL,
  amount_pence INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'gbp',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  customer_email TEXT,
  refund_amount_pence INTEGER,
  refund_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'ok' CHECK (processing_status IN ('ok', 'error')),
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
