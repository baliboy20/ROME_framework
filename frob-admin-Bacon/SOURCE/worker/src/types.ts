// FOB core-data-access — shared entity + enum types.
//
// satisfies: TDR-03 (single typed access surface), TDR-04 (money = integer
// pence; timestamps ISO-8601 UTC string).
// Source of truth: ARTIFACTS/_design/data-dictionary.md §3, §4.

// ---------------------------------------------------------------------------
// Enum registry (data-dictionary.md §4 / Data_Dictionary.md §3)
// ---------------------------------------------------------------------------

export type ConsentType =
  | "marketing_email"
  | "marketing_whatsapp"
  | "data_processing"
  | "cookies_analytics"
  | "cookies_marketing";

export type AuditActorType =
  | "owner"
  | "secondary_operator"
  | "customer"
  | "guide"
  | "system_cron"
  | "system_webhook";

export type AuthActorType = "owner" | "secondary_operator" | "customer";

export type MessageType = "transactional" | "marketing" | "owner_alert";

export type MessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "bounced"
  | "failed_complaint"
  | "delivery_pending";

export type SchemaOrgType = "TouristAttraction" | "LocalBusiness" | "Product";

export type BookingStatus =
  | "draft"
  | "confirmed"
  | "provisionally-confirmed"
  | "cancelled"
  | "abandoned";

export type BookingSource = "direct" | "owner-created" | "provisional" | "ota";

export type PaymentStatus =
  | "pending"
  | "succeeded"
  | "partially_refunded"
  | "refunded"
  | "failed";

export type DepartureStatus = "scheduled" | "cancelled";

export type EnquiryType =
  | "group"
  | "private"
  | "corporate"
  | "charity"
  | "accessibility"
  | "general";

export type EnquiryStatus =
  | "open"
  | "acknowledged"
  | "responded"
  | "converted"
  | "closed"
  | "spam";

export type NudgeStatus =
  | "pending"
  | "sent"
  | "suppressed"
  | "unsubscribed"
  | "converted";

export type BikeStatus =
  | "in_service"
  | "flagged_for_service"
  | "in_maintenance"
  | "awaiting_external_service"
  | "out_of_service"
  | "retired";

export type ReadinessStatus = "in_progress" | "ready" | "blocked";

export type IncidentType = "injury" | "rtc" | "medical";

export type IncidentStatus = "submitted" | "insurer_ack" | "reviewed" | "closed";

export type HazardStatus = "pending_review" | "approved" | "archived";

export type AdvisoryClassification = "informational";

export type OperatorNoticeStatus = "sent" | "acknowledged" | "unacknowledged_overdue";

export type EquipmentType =
  | "helmet"
  | "first_aid_kit"
  | "hi_vis"
  | "poncho"
  | "gloves"
  | "other";

export type EquipmentStatus = "in_service" | "lost" | "retired";

export type ComplianceItemType = "pli" | "el" | "ico" | "helmet_review" | "first_aid_review";

export type ComplianceStatus = "in_date" | "pending" | "critical" | "revoked";

export type PreferredChannel = "email" | "whatsapp" | "phone";

export type AgeBand = "under-12" | "12-17" | "18+" | "60+";

export type WouldRecommend = "yes" | "maybe" | "no";

export type ReplacementReason = "impact" | "expiry" | "damage" | "lost" | "annual_rotation";

export type OperatorNoticeType = "change" | "cancellation";

export type RemediationChoice = "refund" | "rebook" | "credit";

// ---------------------------------------------------------------------------
// Entities — D1 tables
// ---------------------------------------------------------------------------

export interface Guide {
  id: string;
  name: string;
  created_at: string;
}

export interface Device {
  device_id: string;
  guide_id: string;
  status: string;
  created_at: string;
}

export interface Prospect {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_ok: 0 | 1;
  preferred_channel: PreferredChannel | null;
  locale: string | null;
  source: string | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  deleted_at: string | null;
}

export interface Enquiry {
  id: string;
  prospect_id: string;
  type: EnquiryType;
  party_size: number | null;
  preferred_dates: string | null;
  preferred_channel: PreferredChannel;
  message: string | null;
  source_tour_id: string | null;
  status: EnquiryStatus;
  sla_due_at: string;
  responded_at: string | null;
  created_at: string;
}

export interface SavedTour {
  id: string;
  prospect_id: string;
  tour_id: string;
  save_method: string;
  nudge_status: NudgeStatus;
  nudge_sent_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}

export interface Consent {
  id: string;
  prospect_id: string;
  consent_type: ConsentType;
  granted: 0 | 1;
  source: string;
  evidence: string | null;
  ip_address_hash: string | null;
  granted_at: string;
}

export interface AuditLogEntry {
  id: string;
  occurred_at: string;
  actor_type: AuditActorType;
  actor_id: string | null;
  subject_type: string;
  subject_id: string | null;
  action: string;
  detail: string | null;
  complete: 0 | 1;
}

export interface Message {
  id: string;
  message_type: MessageType;
  recipient: string;
  event: string;
  idempotency_key: string;
  provider: string;
  provider_ref: string | null;
  status: MessageStatus;
  created_at: string;
  sent_at: string | null;
}

export interface EmailEvent {
  id: string;
  message_id: string;
  event_type: string;
  occurred_at: string;
}

export interface WebhookEvent {
  idempotency_key: string;
  processed_at: string;
}

export interface Bike {
  id: string;
  make: string;
  model: string;
  frame_size: string;
  colour: string;
  serial_number: string | null;
  purchase_date: string | null;
  route_eligibility: string; // JSON-encoded list
  spare: 0 | 1;
  status: BikeStatus;
  last_inspected_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  description: string;
  size: string | null;
  purchase_date: string;
  manufacture_date: string | null;
  review_due_at: string | null;
  status: EquipmentStatus;
  replacement_of: string | null;
  replacement_reason: ReplacementReason | null;
  created_at: string;
}

export interface MaintenanceEvent {
  id: string;
  bike_id: string;
  work_performed: string;
  parts_replaced: string | null;
  time_taken: string | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
}

export interface ComplianceItem {
  id: string;
  type: ComplianceItemType;
  related_equipment_id: string | null;
  expiry_or_due_at: string;
  status: ComplianceStatus;
  last_alert_sent_at: string | null;
  renewed_at: string | null;
}

export interface Departure {
  id: string;
  tour_id: string;
  date: string;
  time: string;
  capacity: number;
  held_count: number;
  confirmed_count: number;
  grace_period_minutes: number;
  guide_id: string | null;
  status: DepartureStatus;
}

export interface Booking {
  id: string;
  departure_id: string;
  status: BookingStatus;
  source: BookingSource;
  party_size: number;
  price_total_pence: number;
  waiver_accepted_at: string | null;
  terms_accepted_at: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  hold_expires_at: string | null;
  deposit_required_pence: number | null;
  reminder_cadence: string | null;
  created_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
}

export type ContactRole = "leader" | "co-leader" | "attendee";

export interface Participant {
  id: string;
  booking_id: string;
  name: string;
  age_band: AgeBand;
  // Deprecated (DR-B12a) — derived from contact_role === "leader", kept in
  // sync for admin-lists.ts/backoffice.ts's existing lead-name lookups.
  // New code reads/writes contact_role.
  is_lead_booker: 0 | 1;
  contact_role: ContactRole;
  notes: string | null;
}

export interface Payment {
  id: string;
  booking_id: string;
  session_id: string;
  status: PaymentStatus;
  amount_pence: number;
  refund_amount_pence: number;
  idempotency_key: string;
  created_at: string;
}

export interface BikeAssignment {
  id: string;
  departure_id: string;
  bike_id: string;
  assigned_at: string;
  removed_at: string | null;
}

export interface TourReadiness {
  id: string;
  departure_id: string;
  guide_id: string;
  kit_check_signed_at: string | null;
  bike_inspection_signed_at: string | null;
  risk_assessment_signed_at: string | null;
  all_riders_cleared_at: string | null;
  briefing_confirmed_at: string | null;
  final_signoff_at: string | null;
  status: ReadinessStatus;
}

export interface RiderCheckin {
  id: string;
  departure_id: string;
  participant_id: string;
  bike_id: string | null;
  waiver_reconfirmed_at: string | null;
  cleared: 0 | 1;
  refusal_reason: string | null;
  guide_notes: string | null;
  created_at: string;
}

export interface Incident {
  id: string;
  departure_id: string;
  occurred_at: string;
  location: string;
  type: IncidentType;
  severity: string;
  preliminary_description: string;
  formal_report: string | null;
  status: IncidentStatus;
  insurer_dispatch_at: string | null;
}

export interface HazardLogEntry {
  id: string;
  street_name: string;
  hazard_type: string;
  description: string;
  severity: string | null;
  observed_at: string;
  status: HazardStatus;
  last_confirmed_at: string | null;
}

export interface MidTourEvent {
  id: string;
  departure_id: string;
  occurred_at: string;
  issue: string;
  resolution: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  booking_id: string;
  milestone: "t_minus_1";
  sent_at: string;
  channel: string | null;
}

export interface WeatherAdvisory {
  id: string;
  booking_id: string;
  classification: AdvisoryClassification;
  forecast_summary: string;
  sent_at: string;
  superseded_by: string | null;
}

export interface OperatorNotice {
  id: string;
  booking_id: string;
  type: OperatorNoticeType;
  old_value: string | null;
  new_value: string | null;
  material: 0 | 1;
  status: OperatorNoticeStatus;
  sent_at: string;
  acknowledged_at: string | null;
  remediation_choice: RemediationChoice | null;
}

export interface Feedback {
  id: string;
  booking_id: string;
  overall_rating: number;
  guide_rating: number;
  value_rating: number;
  would_recommend: WouldRecommend;
  free_text: string | null;
  owner_alerted: 0 | 1;
  created_at: string;
}

// ---------------------------------------------------------------------------
// KV — auth_session (TDR-07). Not a D1 table.
// ---------------------------------------------------------------------------

export interface AuthSession {
  token: string;
  actor_type: AuthActorType;
  actor_id: string;
  booking_id: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
}
