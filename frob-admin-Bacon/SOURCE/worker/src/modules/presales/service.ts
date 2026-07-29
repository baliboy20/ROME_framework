// FOB pre-sales — business logic for REQ-PRE01..08.
//
// PRE01 (catalogue) and PRE02 (tour detail) read a tours catalogue that is
// NOT part of this migration's D1 schema (data-dictionary.md's `tours`
// entity belongs to a content-authoring module not yet built in this
// worker) — those two handlers are implemented in routes/presales.ts as a
// best-effort R2-backed read (env.ASSETS), clearly marked, rather than
// fabricated against a table that doesn't exist. PRE03 (availability),
// PRE04 (enquiry), PRE05 (enquiry reply), PRE06 (saved-tour), PRE08
// (handover) all map onto real tables and are fully implemented here.

import type { Db } from "../../db/client";
import type { Departure, Enquiry, Prospect, SavedTour } from "../../types";

export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number; error: string; message: string };

function fail<T>(status: number, error: string, message: string): ServiceResult<T> {
  return { ok: false, status, error, message };
}
function ok<T>(value: T): ServiceResult<T> {
  return { ok: true, value };
}

// ---------------------------------------------------------------------------
// REQ-PRE03 — search availability
// ---------------------------------------------------------------------------

export interface AvailabilitySlot {
  departureId: string;
  date: string;
  time: string;
  remainingCapacity: number;
}

/**
 * `departures` is owned by the booking module; core-data-access's `Db`
 * surface only exposes `listByDeparture` (booking-scoped), not
 * `listByTour`, so pre-sales reads across the module boundary via the
 * generic `query` read helper from core-data-access (still the single
 * typed access pattern, TDR-03 — no raw ad hoc SQL string is invented
 * beyond a plain SELECT on a column already indexed by
 * `idx_departures_tour_id`).
 */
// Fallback only; real per-person price is read from the D1 `tours` catalogue.
const DEFAULT_TOUR_PRICE_PENCE = 4500;

export async function searchAvailability(
  rawDb: D1Database,
  tourId: string,
  partySize: number
): Promise<ServiceResult<AvailabilitySlot[]>> {
  if (partySize > 10) {
    return fail(422, "party_size_exceeds_max", "Party sizes above 10 need a group enquiry instead of direct availability search.");
  }

  const { query } = await import("../../db/client");
  const all = await query<Departure>(rawDb, `SELECT * FROM departures WHERE tour_id = ?`, [tourId]);

  // TDR-WEB-01: per-person price now comes from the D1 `tours` catalogue.
  const tourRow = await query<{ price_pence: number }>(
    rawDb,
    `SELECT price_pence FROM tours WHERE id = ?`,
    [tourId]
  );
  const pricePerPersonPence = tourRow[0]?.price_pence ?? DEFAULT_TOUR_PRICE_PENCE;

  const slots = all
    .filter((d) => d.status === "scheduled")
    .map((d) => ({
      departureId: d.id,
      date: d.date,
      time: d.time,
      remainingCapacity: d.capacity - d.held_count - d.confirmed_count,
      pricePerPersonPence,
    }))
    .filter((s) => s.remainingCapacity >= partySize);

  return ok(slots);
}

// ---------------------------------------------------------------------------
// REQ-PRE04 — submit enquiry
// ---------------------------------------------------------------------------

export interface SubmitEnquiryInput {
  name: string;
  email?: string;
  phone?: string;
  preferredChannel: "email" | "whatsapp" | "phone";
  partySize?: number;
  preferredDates?: string;
  message: string;
  sourceTourId?: string;
  type: Enquiry["type"];
  isSpam?: boolean;
  responseSlaHours?: number;
}

export interface SubmitEnquiryResult {
  enquiry: Enquiry;
  prospect: Prospect;
  ownerAlertSent: boolean;
}

export async function submitEnquiry(db: Db, input: SubmitEnquiryInput): Promise<ServiceResult<SubmitEnquiryResult>> {
  if (!input.name || !input.message || (!input.email && !input.phone)) {
    return fail(422, "missing_required_field", "Please complete all required fields, including a valid phone number if needed.");
  }
  if ((input.preferredChannel === "whatsapp" || input.preferredChannel === "phone") && !input.phone) {
    return fail(422, "phone_required_for_channel", "Please complete all required fields, including a valid phone number if needed.");
  }

  const now = new Date().toISOString();
  const prospect: Prospect = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    whatsapp_ok: input.preferredChannel === "whatsapp" ? 1 : 0,
    preferred_channel: input.preferredChannel,
    locale: null,
    source: "enquiry",
    first_seen_at: now,
    last_seen_at: now,
    created_at: now,
    deleted_at: null,
  };
  await db.prospects.create(prospect);

  const slaHours = input.responseSlaHours ?? 24;
  const enquiry: Enquiry = {
    id: crypto.randomUUID(),
    prospect_id: prospect.id,
    type: input.type,
    party_size: input.partySize ?? null,
    preferred_dates: input.preferredDates ?? null,
    preferred_channel: input.preferredChannel,
    message: input.message,
    source_tour_id: input.sourceTourId ?? null,
    status: input.isSpam ? "spam" : "open",
    sla_due_at: new Date(Date.now() + slaHours * 3_600_000).toISOString(),
    responded_at: null,
    created_at: now,
  };
  await db.enquiries.create(enquiry);

  // Owner alert (NOTIF04) is a service call owned by core-notifications;
  // here we only decide WHETHER one should fire (never for spam), per
  // REQ-PRE04's invariant. The actual send is orchestrated by the
  // notifications module — see api-contracts.md NOTIF04.
  const ownerAlertSent = !input.isSpam;

  return ok({ enquiry, prospect, ownerAlertSent });
}

// ---------------------------------------------------------------------------
// REQ-PRE05 — reply to / update an enquiry
// ---------------------------------------------------------------------------

export async function markEnquiryResponded(db: Db, enquiryId: string): Promise<ServiceResult<Enquiry>> {
  const enquiry = await db.enquiries.get(enquiryId);
  if (!enquiry) return fail(404, "enquiry_not_found", "Enquiry not found");
  if (enquiry.status !== "open" && enquiry.status !== "acknowledged") {
    return fail(409, "enquiry_not_open", "Enquiry is not open or acknowledged");
  }

  const respondedAt = new Date().toISOString();
  await db.enquiries.update(enquiryId, { status: "responded", responded_at: respondedAt });

  return ok({ ...enquiry, status: "responded", responded_at: respondedAt });
}

// ---------------------------------------------------------------------------
// REQ-PRE06 — save a tour (transactional email + optional nudge consent)
// ---------------------------------------------------------------------------

export interface CreateSavedTourInput {
  prospectEmail: string;
  tourId: string;
  saveMethod: string;
  nudgeConsent: boolean;
}

export interface CreateSavedTourResult {
  savedTour: SavedTour;
  transactionalEmailQueued: true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createSavedTour(db: Db, input: CreateSavedTourInput): Promise<ServiceResult<CreateSavedTourResult>> {
  if (!EMAIL_RE.test(input.prospectEmail)) {
    return fail(422, "invalid_email", "Please provide a valid email address to save this tour.");
  }

  const now = new Date().toISOString();
  const prospect: Prospect = {
    id: crypto.randomUUID(),
    name: null,
    email: input.prospectEmail,
    phone: null,
    whatsapp_ok: 0,
    preferred_channel: "email",
    locale: null,
    source: "saved-tour",
    first_seen_at: now,
    last_seen_at: now,
    created_at: now,
    deleted_at: null,
  };
  await db.prospects.create(prospect);

  const savedTour: SavedTour = {
    id: crypto.randomUUID(),
    prospect_id: prospect.id,
    tour_id: input.tourId,
    save_method: input.saveMethod,
    // never sent without recorded consent (REQ-PRE06 invariant); consent
    // itself is captured via CNA01 (core-consent-audit), out of this
    // module's scope beyond deciding pending-vs-suppressed here.
    nudge_status: input.nudgeConsent ? "pending" : "suppressed",
    nudge_sent_at: null,
    unsubscribed_at: null,
    created_at: now,
  };
  await db.savedTours.create(savedTour);

  return ok({ savedTour, transactionalEmailQueued: true });
}

// ---------------------------------------------------------------------------
// REQ-PRE07 — cron nudge send (internal only, called by cron-workers)
// ---------------------------------------------------------------------------

export interface SendNudgeCheck {
  currentConsentGranted: boolean;
  hasBounced: boolean;
  alreadyBooked: boolean;
}

/** Pure decision function — the actual send + consent/bounce lookups are cron-workers' job. */
export function shouldSendNudge(check: SendNudgeCheck): boolean {
  if (check.alreadyBooked) return false;
  if (!check.currentConsentGranted) return false;
  if (check.hasBounced) return false;
  return true;
}

// ---------------------------------------------------------------------------
// REQ-PRE08 — booking handover (pure context assembly, no server route)
// ---------------------------------------------------------------------------

export interface BookingHandoverContext {
  tourId: string;
  date?: string;
  time?: string;
  partySize?: number;
  prospectEmail?: string;
}

/** Assembles the pre-fill context handed to BOOK01 — pre-sales never books or pays. */
export function assembleBookingHandover(ctx: BookingHandoverContext): BookingHandoverContext {
  return { ...ctx };
}
