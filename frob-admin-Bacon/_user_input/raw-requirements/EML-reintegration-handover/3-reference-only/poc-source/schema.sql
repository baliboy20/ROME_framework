-- Derived from Data_Dictionary.md v0.5. POC schema only — not product DDL.
-- `bookings` and `enquiries` are STUBS standing in for the external `booking`/`pre-sales`
-- modules (Referenced, not owned by EML) — just enough columns for this POC to function.

CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  party_leader_name TEXT NOT NULL,
  party_leader_email TEXT NOT NULL,
  tour_name TEXT NOT NULL,
  amount_paid_pence INTEGER NOT NULL,
  deposit_pence INTEGER NOT NULL,
  hours_until_departure REAL NOT NULL, -- POC stand-in for a real departure timestamp
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','completed'))
);

-- DR-19 (2026-07-25, reintegration data-model tidy-up): one unified attendee list per booking,
-- matching frob-admin-Bacon's `participants` table (contact_role enum, DR-B12a) instead of a
-- separate co_leaders table for the same people. `leader` is always notified (notify_opted_in
-- has no effect for that role); `notify_opted_in` only matters for `co-leader` rows — this is the
-- field frob-admin's own `participants` table was missing (F-19's opt-out had nowhere to live).
CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  name TEXT,
  email TEXT NOT NULL,
  contact_role TEXT NOT NULL CHECK (contact_role IN ('leader','co-leader')),
  notify_opted_in INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE email_templates (
  id TEXT PRIMARY KEY,
  use_case TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','active','retired')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  published_at TEXT,
  retired_at TEXT
);

CREATE TABLE explanation_blocks (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- REQ-EML01-08 sends. `recipients` is a JSON array (Party Leader + opted-in Co-leaders, F-18).
CREATE TABLE sent_emails (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES email_templates(id),
  booking_id TEXT REFERENCES bookings(id),
  use_case TEXT NOT NULL,
  recipients TEXT NOT NULL, -- JSON array of email addresses
  content_rendered TEXT NOT NULL,
  explanation_block_id TEXT REFERENCES explanation_blocks(id),
  sent_at TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'not-attempted' CHECK (delivery_status IN ('not-attempted','sent','failed')),
  delivery_error TEXT
);

CREATE TABLE cancellation_requests (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  hours_until_departure REAL NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  refund_kind TEXT,
  refund_pence INTEGER
);

CREATE TABLE enquiries (
  id TEXT PRIMARY KEY,
  prospect_name TEXT NOT NULL,
  prospect_email TEXT NOT NULL,
  question TEXT NOT NULL,
  replied INTEGER NOT NULL DEFAULT 0,
  acknowledged INTEGER NOT NULL DEFAULT 0 -- REQ-EML18/DR-15: set by the auto-acknowledge send, distinct from `replied`
);

-- Single-row Owner settings. enquiry_auto_acknowledge_enabled: REQ-EML18/DR-15 (resolves D-EML-5).
-- refund_cutoff_hours/reminder_milestones/cancellation_remediation_options: DR-16 (2026-07-25) —
-- turns findings F1/F2/F3 of the reintegration analysis into Owner-configurable settings instead
-- of a single hardcoded rule, since the "right" cutoff/cadence/remediation set is a business call,
-- not a fixed constant. New future settings should be added as columns here, not a new table.
CREATE TABLE notification_settings (
  id TEXT PRIMARY KEY,
  enquiry_auto_acknowledge_enabled INTEGER NOT NULL DEFAULT 0,
  refund_cutoff_hours INTEGER NOT NULL DEFAULT 48,
  reminder_milestones TEXT NOT NULL DEFAULT '["t_minus_1"]', -- JSON array
  cancellation_remediation_options TEXT NOT NULL DEFAULT '["refund","rebook","credit"]', -- JSON array
  updated_at TEXT NOT NULL
);

CREATE TABLE email_threads (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  booking_id TEXT REFERENCES bookings(id),
  categorisation_status TEXT NOT NULL CHECK (categorisation_status IN ('linked','unlinked','ambiguous')),
  categorisation_method TEXT,
  ambiguous_candidates TEXT, -- JSON array of booking ids
  created_at TEXT NOT NULL
);

CREATE TABLE received_emails (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES email_threads(id),
  from_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_spam INTEGER NOT NULL DEFAULT 0,
  received_at TEXT NOT NULL
);

-- Seed data: canonical fixtures (DOMAIN-LEXICON.md v0.2 §8) + a second concurrent booking
-- for the ambiguous-sender cascade case (Marie/BK-1002/BK-1003 pattern, simplified to two).

INSERT INTO bookings (id, party_leader_name, party_leader_email, tour_name, amount_paid_pence, deposit_pence, hours_until_departure, status) VALUES
  ('BK-1001', 'Tom', 'tom@example.com', 'Hidden City', 4500, 900, 120, 'confirmed'),
  ('BK-9002', 'Marie', 'marie@example.com', 'Countryside Loop', 6000, 1200, 12, 'confirmed'),
  ('BK-9003', 'Marie', 'marie@example.com', 'River Route', 5000, 1000, 200, 'confirmed');

INSERT INTO participants (id, booking_id, name, email, contact_role, notify_opted_in, created_at) VALUES
  ('p-1001-leader', 'BK-1001', 'Tom', 'tom@example.com', 'leader', 1, '2026-07-01'),
  ('p-9002-leader', 'BK-9002', 'Marie', 'marie@example.com', 'leader', 1, '2026-07-01'),
  ('p-9003-leader', 'BK-9003', 'Marie', 'marie@example.com', 'leader', 1, '2026-07-01'),
  ('cl1', 'BK-1001', 'Priya', 'priya@example.com', 'co-leader', 1, '2026-07-20');

INSERT INTO email_templates (id, use_case, status, content, created_at) VALUES
  ('t1', 'booking_confirmation', 'active', 'Hi {{first_name}}, your booking for {{tour_name}} is confirmed.', '2026-07-01'),
  ('t2', 'cancellation_approved', 'active', 'Hi {{first_name}}, your cancellation for {{tour_name}} is confirmed. {{refund_line}}', '2026-07-01'),
  ('t3', 'company_cancellation', 'active', 'Hi {{first_name}}, we are sorry to cancel {{tour_name}}. {{explanation}} {{remedy_line}}', '2026-07-01'),
  ('t4', 'weather_cancellation', 'active', 'Hi {{first_name}}, {{tour_name}} is cancelled due to weather. Full refund issued.', '2026-07-01'),
  ('t5', 'payment_receipt', 'active', 'Hi {{first_name}}, we have processed a {{event_kind}} of {{amount}} for {{tour_name}}.', '2026-07-01'),
  ('t6', 'review_request', 'active', 'Hi {{first_name}}, thanks for joining {{tour_name}}! Please leave a review.', '2026-07-01'),
  ('t7', 'reminder', 'draft', '', '2026-07-20');

INSERT INTO notification_settings (id, enquiry_auto_acknowledge_enabled, updated_at) VALUES
  ('default', 0, '2026-07-25T00:00:00.000Z');
