-- FOB D1 schema — migration 0001 (P5/Ashok — authored fresh, DEV-4 greenfield)
--
-- satisfies: TDR-03 (D1 UK via core-data-access + run-once in-order
-- migration runner), TDR-04 (money = integer pence; timestamps ISO-8601
-- UTC TEXT), TDR-05 (D1 idempotency — webhook_events), TDR-08 (atomic
-- capacity decrement on departures).
--
-- Source of truth: ARTIFACTS/_design/data-dictionary.md §3 (entities),
-- §4 (enum registry, cross-referenced against
-- _user_input/raw-requirements/Data_Dictionary.md §3 for full value lists).
--
-- Conventions:
--   - UUID TEXT primary keys (app-generated) unless noted.
--   - Money columns: INTEGER, pence.
--   - Timestamps: TEXT, ISO-8601 UTC (e.g. 2026-07-20T14:03:00Z).
--   - Booleans: INTEGER 0/1.
--   - Enums enforced via CHECK constraints per data-dictionary.md §4.
--   - auth_session is KV, not D1 — no table here (see src/kv/session.ts).

-- ---------------------------------------------------------------------------
-- Migration bookkeeping (satisfies: TDR-03 run-once-in-order runner)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ===========================================================================
-- Auth & identity (core-auth) — auth_session itself lives in KV (TDR-07)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS guides (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY,
  guide_id TEXT NOT NULL REFERENCES guides(id),
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_devices_guide_id ON devices(guide_id);

-- ===========================================================================
-- Pre-sales (pre-sales)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS prospects (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp_ok INTEGER NOT NULL DEFAULT 0 CHECK (whatsapp_ok IN (0,1)),
  preferred_channel TEXT CHECK (preferred_channel IN ('email','whatsapp','phone')),
  locale TEXT,
  source TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);
CREATE INDEX IF NOT EXISTS idx_prospects_phone ON prospects(phone);

CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects(id),
  type TEXT NOT NULL CHECK (type IN (
    'group','private','corporate','charity','accessibility','general'
  )),
  party_size INTEGER,
  preferred_dates TEXT,
  preferred_channel TEXT NOT NULL CHECK (preferred_channel IN ('email','whatsapp','phone')),
  message TEXT,
  source_tour_id TEXT,
  status TEXT NOT NULL CHECK (status IN (
    'open','acknowledged','responded','converted','closed','spam'
  )),
  sla_due_at TEXT NOT NULL,
  responded_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_enquiries_prospect_id ON enquiries(prospect_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);

CREATE TABLE IF NOT EXISTS saved_tours (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects(id),
  tour_id TEXT NOT NULL,
  save_method TEXT NOT NULL,
  nudge_status TEXT NOT NULL CHECK (nudge_status IN (
    'pending','sent','suppressed','unsubscribed','converted'
  )),
  nudge_sent_at TEXT,
  unsubscribed_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (prospect_id, tour_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_tours_prospect_id ON saved_tours(prospect_id);

-- ===========================================================================
-- Consent & audit (core-consent-audit)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects(id),
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'marketing_email','marketing_whatsapp','data_processing',
    'cookies_analytics','cookies_marketing'
  )),
  granted INTEGER NOT NULL CHECK (granted IN (0,1)),
  source TEXT NOT NULL,
  evidence TEXT,
  ip_address_hash TEXT,
  granted_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_consents_prospect_id ON consents(prospect_id);
CREATE INDEX IF NOT EXISTS idx_consents_prospect_type ON consents(prospect_id, consent_type);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  occurred_at TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN (
    'owner','secondary_operator','customer','guide','system_cron','system_webhook'
  )),
  actor_id TEXT,
  subject_type TEXT NOT NULL,
  subject_id TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  complete INTEGER NOT NULL DEFAULT 1 CHECK (complete IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_audit_log_subject ON audit_log(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_occurred_at ON audit_log(occurred_at);

-- ===========================================================================
-- Notifications (core-notifications)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS message (
  id TEXT PRIMARY KEY,
  message_type TEXT NOT NULL CHECK (message_type IN (
    'transactional','marketing','owner_alert'
  )),
  recipient TEXT NOT NULL,
  event TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'postmark',
  provider_ref TEXT,
  status TEXT NOT NULL CHECK (status IN (
    'queued','sent','delivered','bounced','failed_complaint','delivery_pending'
  )),
  created_at TEXT NOT NULL,
  sent_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_message_status ON message(status);
CREATE INDEX IF NOT EXISTS idx_message_recipient ON message(recipient);

CREATE TABLE IF NOT EXISTS email_events (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES message(id),
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_events_message_id ON email_events(message_id);

-- Idempotency store — satisfies: TDR-05 (INSERT OR IGNORE pattern).
CREATE TABLE IF NOT EXISTS webhook_events (
  idempotency_key TEXT PRIMARY KEY,
  processed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ===========================================================================
-- Fleet (fleet-equipment) — created before booking/tour-operations, which
-- both FK into bikes.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS bikes (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  frame_size TEXT NOT NULL,
  colour TEXT NOT NULL,
  serial_number TEXT,
  purchase_date TEXT,
  route_eligibility TEXT NOT NULL DEFAULT '[]',
  spare INTEGER NOT NULL DEFAULT 0 CHECK (spare IN (0,1)),
  status TEXT NOT NULL CHECK (status IN (
    'in_service','flagged_for_service','in_maintenance',
    'awaiting_external_service','out_of_service','retired'
  )),
  last_inspected_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bikes_status ON bikes(status);

CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN (
    'helmet','first_aid_kit','hi_vis','poncho','gloves','other'
  )),
  description TEXT NOT NULL,
  size TEXT,
  purchase_date TEXT NOT NULL,
  manufacture_date TEXT,
  review_due_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('in_service','lost','retired')),
  replacement_of TEXT REFERENCES equipment(id),
  replacement_reason TEXT CHECK (replacement_reason IN (
    'impact','expiry','damage','lost','annual_rotation'
  )),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_replacement_of ON equipment(replacement_of);

CREATE TABLE IF NOT EXISTS maintenance_events (
  id TEXT PRIMARY KEY,
  bike_id TEXT NOT NULL REFERENCES bikes(id),
  work_performed TEXT NOT NULL,
  parts_replaced TEXT,
  time_taken TEXT,
  cost INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maintenance_events_bike_id ON maintenance_events(bike_id);

CREATE TABLE IF NOT EXISTS compliance_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN (
    'pli','el','ico','helmet_review','first_aid_review'
  )),
  related_equipment_id TEXT REFERENCES equipment(id),
  expiry_or_due_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_date','pending','critical','revoked')),
  last_alert_sent_at TEXT,
  renewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_compliance_items_status ON compliance_items(status);
CREATE INDEX IF NOT EXISTS idx_compliance_items_related_equipment_id ON compliance_items(related_equipment_id);

-- ===========================================================================
-- Booking (booking)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS departures (
  id TEXT PRIMARY KEY,
  tour_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity <= 10),
  held_count INTEGER NOT NULL DEFAULT 0,
  confirmed_count INTEGER NOT NULL DEFAULT 0,
  grace_period_minutes INTEGER NOT NULL DEFAULT 0,
  guide_id TEXT REFERENCES guides(id),
  status TEXT NOT NULL CHECK (status IN ('scheduled','cancelled')),
  UNIQUE (tour_id, date, time),
  CHECK (held_count + confirmed_count <= capacity)
);
CREATE INDEX IF NOT EXISTS idx_departures_guide_id ON departures(guide_id);
CREATE INDEX IF NOT EXISTS idx_departures_tour_id ON departures(tour_id);
CREATE INDEX IF NOT EXISTS idx_departures_status ON departures(status);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  departure_id TEXT NOT NULL REFERENCES departures(id),
  status TEXT NOT NULL CHECK (status IN (
    'draft','confirmed','provisionally-confirmed','cancelled','abandoned'
  )),
  source TEXT NOT NULL CHECK (source IN ('direct','owner-created','provisional','ota')),
  party_size INTEGER NOT NULL CHECK (party_size BETWEEN 1 AND 10),
  price_total_pence INTEGER NOT NULL,
  waiver_accepted_at TEXT,
  terms_accepted_at TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  hold_expires_at TEXT,
  deposit_required_pence INTEGER,
  reminder_cadence TEXT,
  created_at TEXT NOT NULL,
  confirmed_at TEXT,
  cancelled_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_bookings_departure_id ON bookings(departure_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  name TEXT NOT NULL,
  age_band TEXT NOT NULL CHECK (age_band IN ('under-12','12-17','18+','60+')),
  is_lead_booker INTEGER NOT NULL DEFAULT 0 CHECK (is_lead_booker IN (0,1)),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_participants_booking_id ON participants(booking_id);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  session_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN (
    'pending','succeeded','partially_refunded','refunded','failed'
  )),
  amount_pence INTEGER NOT NULL,
  refund_amount_pence INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS bike_assignments (
  id TEXT PRIMARY KEY,
  departure_id TEXT NOT NULL REFERENCES departures(id),
  bike_id TEXT NOT NULL REFERENCES bikes(id),
  assigned_at TEXT NOT NULL,
  removed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_bike_assignments_departure_id ON bike_assignments(departure_id);
CREATE INDEX IF NOT EXISTS idx_bike_assignments_bike_id ON bike_assignments(bike_id);
CREATE INDEX IF NOT EXISTS idx_bike_assignments_active ON bike_assignments(bike_id, removed_at);

-- ===========================================================================
-- Tour operations (tour-operations)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS tour_readiness (
  id TEXT PRIMARY KEY,
  departure_id TEXT NOT NULL UNIQUE REFERENCES departures(id),
  guide_id TEXT NOT NULL REFERENCES guides(id),
  kit_check_signed_at TEXT,
  bike_inspection_signed_at TEXT,
  risk_assessment_signed_at TEXT,
  all_riders_cleared_at TEXT,
  briefing_confirmed_at TEXT,
  final_signoff_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('in_progress','ready','blocked'))
);
CREATE INDEX IF NOT EXISTS idx_tour_readiness_status ON tour_readiness(status);

CREATE TABLE IF NOT EXISTS rider_checkins (
  id TEXT PRIMARY KEY,
  departure_id TEXT NOT NULL REFERENCES departures(id),
  participant_id TEXT NOT NULL REFERENCES participants(id),
  bike_id TEXT REFERENCES bikes(id),
  waiver_reconfirmed_at TEXT,
  cleared INTEGER NOT NULL DEFAULT 0 CHECK (cleared IN (0,1)),
  refusal_reason TEXT,
  guide_notes TEXT,
  created_at TEXT NOT NULL,
  CHECK (cleared = 0 OR waiver_reconfirmed_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_rider_checkins_departure_id ON rider_checkins(departure_id);
CREATE INDEX IF NOT EXISTS idx_rider_checkins_participant_id ON rider_checkins(participant_id);
CREATE INDEX IF NOT EXISTS idx_rider_checkins_bike_id ON rider_checkins(bike_id);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  departure_id TEXT NOT NULL REFERENCES departures(id),
  occurred_at TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('injury','rtc','medical')),
  severity TEXT NOT NULL,
  preliminary_description TEXT NOT NULL,
  formal_report TEXT,
  status TEXT NOT NULL CHECK (status IN ('submitted','insurer_ack','reviewed','closed')),
  insurer_dispatch_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_incidents_departure_id ON incidents(departure_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

CREATE TABLE IF NOT EXISTS hazard_log (
  id TEXT PRIMARY KEY,
  street_name TEXT NOT NULL,
  hazard_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT,
  observed_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_review','approved','archived')),
  last_confirmed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_hazard_log_street_name ON hazard_log(street_name);
CREATE INDEX IF NOT EXISTS idx_hazard_log_status ON hazard_log(status);

CREATE TABLE IF NOT EXISTS mid_tour_events (
  id TEXT PRIMARY KEY,
  departure_id TEXT NOT NULL REFERENCES departures(id),
  occurred_at TEXT NOT NULL,
  issue TEXT NOT NULL,
  resolution TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mid_tour_events_departure_id ON mid_tour_events(departure_id);

-- ===========================================================================
-- Pre-tour (pre-tour)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  milestone TEXT NOT NULL CHECK (milestone = 't_minus_1'),
  sent_at TEXT NOT NULL,
  channel TEXT
);
CREATE INDEX IF NOT EXISTS idx_reminders_booking_id ON reminders(booking_id);

CREATE TABLE IF NOT EXISTS weather_advisories (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  classification TEXT NOT NULL CHECK (classification = 'informational'),
  forecast_summary TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  superseded_by TEXT REFERENCES weather_advisories(id)
);
CREATE INDEX IF NOT EXISTS idx_weather_advisories_booking_id ON weather_advisories(booking_id);

CREATE TABLE IF NOT EXISTS operator_notices (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  type TEXT NOT NULL CHECK (type IN ('change','cancellation')),
  old_value TEXT,
  new_value TEXT,
  material INTEGER NOT NULL CHECK (material IN (0,1)),
  status TEXT NOT NULL CHECK (status IN ('sent','acknowledged','unacknowledged_overdue')),
  sent_at TEXT NOT NULL,
  acknowledged_at TEXT,
  remediation_choice TEXT CHECK (remediation_choice IN ('refund','rebook','credit'))
);
CREATE INDEX IF NOT EXISTS idx_operator_notices_booking_id ON operator_notices(booking_id);
CREATE INDEX IF NOT EXISTS idx_operator_notices_status ON operator_notices(status);

-- ===========================================================================
-- Post-tour (post-tour)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  guide_rating INTEGER NOT NULL CHECK (guide_rating BETWEEN 1 AND 5),
  value_rating INTEGER NOT NULL CHECK (value_rating BETWEEN 1 AND 5),
  would_recommend TEXT NOT NULL CHECK (would_recommend IN ('yes','maybe','no')),
  free_text TEXT,
  owner_alerted INTEGER NOT NULL DEFAULT 0 CHECK (owner_alerted IN (0,1)),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feedback_booking_id ON feedback(booking_id);
