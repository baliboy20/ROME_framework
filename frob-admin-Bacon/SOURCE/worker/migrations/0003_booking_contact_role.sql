-- DR-B12a — a booking party has one leader and zero-or-more co-leaders, not
-- just one lead booker. `is_lead_booker` is retained (kept in sync) for the
-- existing lead-name lookups in admin-lists.ts/backoffice.ts; new code
-- reads/writes contact_role, the source of truth going forward.

ALTER TABLE participants ADD COLUMN contact_role TEXT NOT NULL DEFAULT 'attendee'
  CHECK (contact_role IN ('leader', 'co-leader', 'attendee'));

UPDATE participants SET contact_role = 'leader' WHERE is_lead_booker = 1;

CREATE INDEX IF NOT EXISTS idx_participants_contact_role ON participants(booking_id, contact_role);
