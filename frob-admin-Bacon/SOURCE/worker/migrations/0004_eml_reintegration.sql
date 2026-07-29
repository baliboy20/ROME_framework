-- 0004_eml_reintegration.sql
-- EML → FOB Admin reintegration (DR-16..DR-19). Spec source:
-- ARTIFACTS/_orchestration/findings/EML-REINTEGRATION-2026-07-26.md and
-- ARTIFACTS/_design/data-dictionary.md Rev 3.

-- DR-19: participants gains notify_opted_in (meaningful only for co-leader;
-- a leader is always notified). Retires the EML co_leaders table.
ALTER TABLE participants ADD COLUMN notify_opted_in INTEGER NOT NULL DEFAULT 1
  CHECK (notify_opted_in IN (0, 1));

-- Reintegration finding (build): the recipient fan-out (F-18) and the inbound
-- categorisation cascade's sender-lookup (REQ-NOTIF05 step 4, DR-10) both need
-- a contactable address per person. The retired co_leaders table carried one;
-- participants did not. Add it (nullable — attendees may have none).
ALTER TABLE participants ADD COLUMN email TEXT;
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);

-- message gains template_id (set when a send was rendered from a template).
-- provider default stays for existing rows; new sends write 'cloudflare-email' (DR-18).
ALTER TABLE message ADD COLUMN template_id TEXT;

-- operator_notices gains the Explanation Block + single-use discount/voucher
-- fields folded from retired REQ-EML05/06 (F3).
ALTER TABLE operator_notices ADD COLUMN explanation_block_id TEXT;
ALTER TABLE operator_notices ADD COLUMN discount_code TEXT;
ALTER TABLE operator_notices ADD COLUMN discount_expires_at TEXT;

-- Email templates (REQ-NOTIF10 / REQ-EML10).
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  use_case TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables TEXT NOT NULL DEFAULT '[]',            -- JSON array of required merge fields
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'retired')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
-- Invariant: at most one active template per use_case (partial unique index).
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_active_use_case
  ON email_templates(use_case) WHERE status = 'active';

-- Explanation blocks — per-send cancellation rationale (F3), not a template.
CREATE TABLE IF NOT EXISTS explanation_blocks (
  id TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES bookings(id),
  notice_id TEXT REFERENCES operator_notices(id),
  author_actor_id TEXT,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Inbound email archive (REQ-NOTIF05-08 / REQ-EML11-14).
CREATE TABLE IF NOT EXISTS email_threads (
  id TEXT PRIMARY KEY,
  categorisation TEXT NOT NULL DEFAULT 'unlinked'
    CHECK (categorisation IN ('linked', 'unlinked', 'ambiguous')),
  booking_id TEXT REFERENCES bookings(id),
  enquiry_id TEXT REFERENCES enquiries(id),
  candidate_refs TEXT,                             -- JSON, recorded when ambiguous
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_threads_categorisation ON email_threads(categorisation);
CREATE INDEX IF NOT EXISTS idx_email_threads_booking_id ON email_threads(booking_id);

CREATE TABLE IF NOT EXISTS received_emails (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES email_threads(id),
  from_address TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  spam_flag INTEGER NOT NULL DEFAULT 0 CHECK (spam_flag IN (0, 1)),
  references_header TEXT,
  in_reply_to TEXT,
  provider_ref TEXT,
  received_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_received_emails_thread_id ON received_emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_received_emails_from ON received_emails(from_address);

-- Owner-configurable operational policy (DR-16). Single row.
CREATE TABLE IF NOT EXISTS operator_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  refund_cutoff_hours INTEGER NOT NULL DEFAULT 48,
  reminder_milestones TEXT NOT NULL DEFAULT '["t_minus_1"]',
  cancellation_remediation_options TEXT NOT NULL DEFAULT '["refund","rebook","credit"]',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT OR IGNORE INTO operator_settings (id) VALUES ('singleton');
