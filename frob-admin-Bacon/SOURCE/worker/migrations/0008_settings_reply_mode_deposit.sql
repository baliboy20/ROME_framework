-- FR-001 workstream 3 — settings console.
--
-- Two Owner-configurable settings on the singleton operator_settings row.
--
-- 1. reply_mode — 'auto' | 'manual'.
--    Governs WHEN the booking confirmation goes out, never WHETHER it does.
--    'auto'   : sent by the payment path the moment the outcome is known
--               (current behaviour — payments.ts calls sendBookingOutcome).
--    'manual' : the automatic send is skipped; the Owner sends the same
--               template from the booking screen via the existing
--               POST /admin/bookings/:id/send-email route.
--    Both modes use the same templates, so the customer receives identical
--    content either way. REQ-NOTIF11 / UXC-FBK-1 remain satisfied: there is no
--    setting that results in the customer being told nothing.
--    Default 'auto' — the behaviour before this column existed.
--
-- 2. deposit_default_pence — the deposit amount offered by default when the
--    Owner creates a booking. Bookings already carry their own
--    deposit_required_pence (0001_init.sql); this only supplies its default,
--    so any individual booking can still differ.
--    Stored in PENCE, consistent with TDR-04 (money is always pence, never
--    floats). 0 means "no default deposit" — the Owner enters one per booking,
--    which is today's behaviour.
--
--    NOTE: this is a FLAT amount, matching the sponsor's wording ("pay
--    deposit, amount configurable in setting"). Because tour prices differ, the
--    booking path must clamp it so a default deposit can never exceed the
--    booking total. If a PERCENTAGE would suit the business better, that is a
--    one-column change — flagged rather than assumed.

ALTER TABLE operator_settings
  ADD COLUMN reply_mode TEXT NOT NULL DEFAULT 'auto';

ALTER TABLE operator_settings
  ADD COLUMN deposit_default_pence INTEGER NOT NULL DEFAULT 0;
