-- 0007 — CHG-008 (CT-3): Resend outbound transport (REQ-NOTIF01, 2026-07-28).
-- Additive only (data-dictionary.md #chg-008): record a transport failure
-- reason on the message row so failures are never silently dropped. NULL =
-- no transport failure recorded. Status stays 'delivery_pending' (existing
-- enum value reused — no CHECK rebuild).
ALTER TABLE message ADD COLUMN failure_reason TEXT;
