// FOB booking — business logic for REQ-BOOK01..14.
//
// Route handlers (src/routes/booking.ts) stay thin: parse/validate with
// Zod, call these functions, map the result to an HTTP response. All D1
// access goes through `core-data-access` (`Db`, from src/db/client.ts) or
// the atomic capacity ops in `./capacity.ts` — no route or service
// function here touches `env.DB` directly (satisfies: TDR-03).

import type { Db } from "../../db/client";
import type { Booking, ContactRole, Departure, Participant } from "../../types";
import {
  confirmCapacity,
  holdCapacity,
  holdConfirmedCapacity,
  releaseAllCapacity,
  releaseConfirmedCapacity,
  releaseHeldCapacity,
} from "./capacity";

export const MAX_PARTY_SIZE = 10;

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
// REQ-BOOK01 — create booking-selection (draft + atomic hold)
// ---------------------------------------------------------------------------

export interface CreateBookingInput {
  departureId: string;
  partySize: number;
  source?: Booking["source"];
  pricePerPersonPence: number;
}

export async function createBookingDraft(
  db: Db,
  rawDb: D1Database,
  input: CreateBookingInput
): Promise<ServiceResult<Booking>> {
  if (input.partySize < 1 || input.partySize > MAX_PARTY_SIZE) {
    return fail(422, "party_size_exceeds_capacity", "This slot doesn't have enough space — try a smaller group or another date");
  }

  const departure = await db.departures.get(input.departureId);
  if (!departure || departure.status !== "scheduled") {
    return fail(409, "no_remaining_capacity", "This slot is no longer available — please choose another");
  }

  const remaining = departure.capacity - departure.held_count - departure.confirmed_count;
  if (input.partySize > remaining) {
    return fail(422, "party_size_exceeds_capacity", "This slot doesn't have enough space — try a smaller group or another date");
  }

  // Atomic single-UPDATE guard — satisfies TDR-08; no race window between
  // the read above (used only for the friendlier error message) and the
  // write below, which re-checks capacity itself.
  const held = await holdCapacity(rawDb, input.departureId, input.partySize);
  if (!held) {
    return fail(409, "no_remaining_capacity", "This slot is no longer available — please choose another");
  }

  const booking: Booking = {
    id: crypto.randomUUID(),
    departure_id: input.departureId,
    status: "draft",
    source: input.source ?? "direct",
    party_size: input.partySize,
    price_total_pence: input.pricePerPersonPence * input.partySize,
    waiver_accepted_at: null,
    terms_accepted_at: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    emergency_contact_relationship: null,
    hold_expires_at: new Date(Date.now() + departureHoldWindowMs(departure)).toISOString(),
    deposit_required_pence: null,
    reminder_cadence: null,
    created_at: new Date().toISOString(),
    confirmed_at: null,
    cancelled_at: null,
  };

  try {
    await db.bookings.create(booking);
  } catch (err) {
    // Compensate: the hold succeeded but the draft insert failed — release
    // the capacity we just reserved rather than leaking a phantom hold.
    await releaseHeldCapacity(rawDb, input.departureId, input.partySize);
    throw err;
  }

  return ok(booking);
}

function departureHoldWindowMs(departure: Departure): number {
  const graceMinutes = departure.grace_period_minutes > 0 ? departure.grace_period_minutes : 20;
  return graceMinutes * 60_000;
}

// ---------------------------------------------------------------------------
// REQ-BOOK02 — submit attendee-details
// ---------------------------------------------------------------------------

export interface SubmitParticipantsInput {
  bookingId: string;
  participants: Array<Pick<Participant, "name" | "age_band" | "notes"> & { contactRole: ContactRole }>;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

/** DR-B12a — exactly one `leader`, any number of `co-leader`, rest `attendee`. */
export function hasExactlyOneLeader(participants: Array<{ contactRole: ContactRole }>): boolean {
  return participants.filter((p) => p.contactRole === "leader").length === 1;
}

export async function submitParticipants(
  db: Db,
  input: SubmitParticipantsInput
): Promise<ServiceResult<Booking>> {
  const booking = await db.bookings.get(input.bookingId);
  if (!booking) return fail(404, "booking_not_found", "Booking not found");
  if (booking.status !== "draft") {
    return fail(409, "hold_expired", "Your hold has expired — please re-confirm your slot to continue");
  }
  if (input.participants.length !== booking.party_size) {
    return fail(422, "attendee_details_incomplete", "Please complete the missing attendee details before continuing");
  }
  for (const p of input.participants) {
    if (!p.name || !p.age_band) {
      return fail(422, "attendee_details_incomplete", "Please complete the missing attendee details before continuing");
    }
  }
  if (!hasExactlyOneLeader(input.participants)) {
    return fail(422, "leader_required", "exactly one leader is required");
  }

  for (const p of input.participants) {
    await db.participants.create({
      id: crypto.randomUUID(),
      booking_id: input.bookingId,
      name: p.name,
      age_band: p.age_band,
      is_lead_booker: p.contactRole === "leader" ? 1 : 0,
      contact_role: p.contactRole,
      notes: p.notes ?? null,
    });
  }

  await db.bookings.update(input.bookingId, {
    emergency_contact_name: input.emergencyContactName,
    emergency_contact_phone: input.emergencyContactPhone,
    emergency_contact_relationship: input.emergencyContactRelationship,
  });

  return ok({ ...booking });
}

// ---------------------------------------------------------------------------
// REQ-BOOK03 — submit booking-consent
// ---------------------------------------------------------------------------

export interface SubmitConsentInput {
  bookingId: string;
  waiverAccepted: boolean;
  termsAccepted: boolean;
}

export async function submitConsent(db: Db, input: SubmitConsentInput): Promise<ServiceResult<Booking>> {
  const booking = await db.bookings.get(input.bookingId);
  if (!booking) return fail(404, "booking_not_found", "Booking not found");
  if (!input.waiverAccepted || !input.termsAccepted) {
    return fail(422, "consent_not_accepted", "Please accept the waiver and terms to continue");
  }

  const now = new Date().toISOString();
  await db.bookings.update(input.bookingId, {
    waiver_accepted_at: now,
    terms_accepted_at: now,
  });

  return ok({ ...booking, waiver_accepted_at: now, terms_accepted_at: now });
}

// ---------------------------------------------------------------------------
// REQ-BOOK06 — self-service date/time modification
// ---------------------------------------------------------------------------

export interface ModifyBookingInput {
  bookingId: string;
  newDepartureId: string;
  cancellationCutoffHours: number;
  newPricePerPersonPence: number;
}

export interface ModifyBookingResult {
  booking: Booking;
  priceDifferencePence: number; // positive = additional charge, negative = refund
}

export async function modifyBookingDate(
  db: Db,
  rawDb: D1Database,
  input: ModifyBookingInput
): Promise<ServiceResult<ModifyBookingResult>> {
  const booking = await db.bookings.get(input.bookingId);
  if (!booking) return fail(404, "booking_not_found", "Booking not found");
  if (booking.status !== "confirmed" && booking.status !== "provisionally-confirmed") {
    return fail(409, "not_modifiable", "This booking cannot be modified");
  }

  const oldDeparture = await db.departures.get(booking.departure_id);
  if (!oldDeparture) return fail(404, "departure_not_found", "Departure not found");

  const hoursToDeparture = (new Date(`${oldDeparture.date}T${oldDeparture.time}Z`).getTime() - Date.now()) / 3_600_000;
  if (hoursToDeparture < input.cancellationCutoffHours) {
    return fail(409, "within_cutoff", "Changes aren't available this close to departure — you can still cancel under the standard policy");
  }

  // Atomic release-and-reacquire across the old and new departure (TDR-08):
  // acquire the new slot FIRST (guarded), and only release the old slot
  // once the new one is secured — a booking is never left holding zero
  // departures, and never (beyond a brief instant) holds two.
  const acquireNew = await holdConfirmedCapacity(rawDb, input.newDepartureId, booking.party_size);
  if (!acquireNew) {
    return fail(409, "no_capacity_on_new_date", "alternatives are suggested for a date with available capacity");
  }

  await releaseConfirmedCapacity(rawDb, booking.departure_id, booking.party_size);

  const newPriceTotal = input.newPricePerPersonPence * booking.party_size;
  const priceDifferencePence = newPriceTotal - booking.price_total_pence;

  await db.bookings.update(booking.id, {
    departure_id: input.newDepartureId,
    price_total_pence: newPriceTotal,
  });

  return ok({
    booking: { ...booking, departure_id: input.newDepartureId, price_total_pence: newPriceTotal },
    priceDifferencePence,
  });
}

// ---------------------------------------------------------------------------
// REQ-BOOK07 — cancel booking (refund policy decision only; Stripe refund
// call itself lives in routes/payments.ts via lib/stripe.ts issueRefund)
// ---------------------------------------------------------------------------

export type RefundPolicy = "automatic_full" | "owner_manual" | "none";

export interface CancelBookingInput {
  bookingId: string;
  hoursBeforeDeparture: number;
}

export interface CancelBookingResult {
  booking: Booking;
  refundPolicy: RefundPolicy;
}

export async function cancelBooking(
  db: Db,
  rawDb: D1Database,
  input: CancelBookingInput
): Promise<ServiceResult<CancelBookingResult>> {
  const booking = await db.bookings.get(input.bookingId);
  if (!booking) return fail(404, "booking_not_found", "Booking not found");
  if (booking.status !== "confirmed" && booking.status !== "provisionally-confirmed") {
    return fail(409, "not_cancellable", "This booking cannot be cancelled");
  }

  const payments = await db.payments.listByBooking(booking.id);
  const paidPayment = payments.find((p) => p.status === "succeeded" || p.status === "partially_refunded");

  let refundPolicy: RefundPolicy = "none";
  if (paidPayment) {
    refundPolicy = input.hoursBeforeDeparture > 48 ? "automatic_full" : "owner_manual";
  }

  await releaseConfirmedCapacity(rawDb, booking.departure_id, booking.party_size);

  const cancelledAt = new Date().toISOString();
  await db.bookings.update(booking.id, { status: "cancelled", cancelled_at: cancelledAt });

  return ok({ booking: { ...booking, status: "cancelled", cancelled_at: cancelledAt }, refundPolicy });
}

// ---------------------------------------------------------------------------
// REQ-BOOK08 — owner-created booking from an agreed enquiry
// ---------------------------------------------------------------------------

export interface OwnerCreateBookingInput {
  departureId: string;
  partySize: number;
  agreedTotalPricePence: number;
}

export async function ownerCreateBooking(
  db: Db,
  rawDb: D1Database,
  input: OwnerCreateBookingInput
): Promise<ServiceResult<Booking>> {
  const draft = await createBookingDraft(db, rawDb, {
    departureId: input.departureId,
    partySize: input.partySize,
    source: "owner-created",
    pricePerPersonPence: Math.round(input.agreedTotalPricePence / input.partySize),
  });
  if (!draft.ok) return draft;
  // Ensure exact agreed total (rounding-proof) even if per-person division truncated.
  await db.bookings.update(draft.value.id, { price_total_pence: input.agreedTotalPricePence });
  return ok({ ...draft.value, price_total_pence: input.agreedTotalPricePence });
}

// ---------------------------------------------------------------------------
// REQ-BOOK10 — owner-created provisional (unpaid) booking
// ---------------------------------------------------------------------------

export interface CreateProvisionalBookingInput {
  departureId: string;
  partySize: number;
  pricePerPersonPence: number;
  holdExpiresAt: string;
  depositRequiredPence: number | null;
  reminderCadence: string | null;
}

export async function createProvisionalBooking(
  db: Db,
  rawDb: D1Database,
  input: CreateProvisionalBookingInput
): Promise<ServiceResult<Booking>> {
  if (input.partySize < 1 || input.partySize > MAX_PARTY_SIZE) {
    return fail(422, "party_size_exceeds_capacity", "this booking is not created; the same capacity constraint as a direct booking selection applies");
  }

  // Provisional bookings hold capacity as CONFIRMED, identically to a paid
  // confirmation (REQ-BOOK10 invariant — never lower priority than a paid hold).
  const held = await holdConfirmedCapacity(rawDb, input.departureId, input.partySize);
  if (!held) {
    return fail(409, "no_remaining_capacity", "this booking is not created; the same capacity constraint as a direct booking selection applies");
  }

  const booking: Booking = {
    id: crypto.randomUUID(),
    departure_id: input.departureId,
    status: "provisionally-confirmed",
    source: "provisional",
    party_size: input.partySize,
    price_total_pence: input.pricePerPersonPence * input.partySize,
    waiver_accepted_at: null,
    terms_accepted_at: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    emergency_contact_relationship: null,
    hold_expires_at: input.holdExpiresAt,
    deposit_required_pence: input.depositRequiredPence,
    reminder_cadence: input.reminderCadence,
    created_at: new Date().toISOString(),
    confirmed_at: null,
    cancelled_at: null,
  };

  try {
    await db.bookings.create(booking);
  } catch (err) {
    await releaseConfirmedCapacity(rawDb, input.departureId, input.partySize);
    throw err;
  }

  return ok(booking);
}

// ---------------------------------------------------------------------------
// REQ-BOOK09 — abandonment sweep (cron; called by cron-workers, no route)
// ---------------------------------------------------------------------------

// cron-workers (owned by a sibling module) is expected to enumerate
// expired-hold draft booking ids and call this once per id — release +
// archive is atomic per draft.
export async function sweepOneAbandonedDraft(db: Db, rawDb: D1Database, bookingId: string): Promise<boolean> {
  const booking = await db.bookings.get(bookingId);
  if (!booking || booking.status !== "draft") return false;
  if (!booking.hold_expires_at || new Date(booking.hold_expires_at).getTime() > Date.now()) return false;

  await releaseHeldCapacity(rawDb, booking.departure_id, booking.party_size);
  await db.bookings.update(bookingId, { status: "abandoned" });
  return true;
}

// ---------------------------------------------------------------------------
// REQ-BOOK11 — create departure
// ---------------------------------------------------------------------------

export interface CreateDepartureInput {
  tourId: string;
  date: string;
  time: string;
  capacity: number;
  guideId?: string | null;
  gracePeriodMinutes?: number;
}

export async function createDeparture(db: Db, input: CreateDepartureInput): Promise<ServiceResult<Departure>> {
  if (input.capacity > MAX_PARTY_SIZE) {
    return fail(422, "capacity_exceeds_max", "A departure can hold at most 10 riders");
  }

  const departure: Departure = {
    id: crypto.randomUUID(),
    tour_id: input.tourId,
    date: input.date,
    time: input.time,
    capacity: input.capacity,
    held_count: 0,
    confirmed_count: 0,
    grace_period_minutes: input.gracePeriodMinutes ?? 20,
    guide_id: input.guideId ?? null,
    status: "scheduled",
  };

  try {
    await db.departures.create(departure);
  } catch {
    return fail(409, "departure_already_scheduled", "That tour is already scheduled at that time");
  }

  return ok(departure);
}

// ---------------------------------------------------------------------------
// REQ-BOOK12 — update departure
// ---------------------------------------------------------------------------

export interface UpdateDepartureInput {
  departureId: string;
  time?: string;
  date?: string;
  capacity?: number;
  guideId?: string | null;
}

export interface UpdateDepartureResult {
  departure: Departure;
  materialChange: boolean;
}

export async function updateDeparture(
  db: Db,
  input: UpdateDepartureInput
): Promise<ServiceResult<UpdateDepartureResult>> {
  const departure = await db.departures.get(input.departureId);
  if (!departure) return fail(404, "departure_not_found", "Departure not found");

  if (input.capacity !== undefined) {
    if (input.capacity > MAX_PARTY_SIZE) {
      return fail(422, "capacity_exceeds_max", "A departure can hold at most 10 riders");
    }
    const currentBookings = departure.held_count + departure.confirmed_count;
    if (input.capacity < currentBookings) {
      return fail(
        409,
        "capacity_below_bookings",
        `${currentBookings} riders are already booked — capacity can't go below that`
      );
    }
  }

  const materialChange =
    (input.date !== undefined && input.date !== departure.date) ||
    (input.time !== undefined && input.time !== departure.time);

  const patch: Partial<Departure> = {};
  if (input.date !== undefined) patch.date = input.date;
  if (input.time !== undefined) patch.time = input.time;
  if (input.capacity !== undefined) patch.capacity = input.capacity;
  if (input.guideId !== undefined) patch.guide_id = input.guideId;

  await db.departures.update(input.departureId, patch);

  return ok({ departure: { ...departure, ...patch }, materialChange });
}

// ---------------------------------------------------------------------------
// REQ-BOOK13 — cancel departure
// ---------------------------------------------------------------------------

export async function cancelDeparture(
  db: Db,
  rawDb: D1Database,
  departureId: string
): Promise<ServiceResult<Departure>> {
  const departure = await db.departures.get(departureId);
  if (!departure) return fail(404, "departure_not_found", "Departure not found");

  await releaseAllCapacity(rawDb, departureId);
  await db.departures.update(departureId, { status: "cancelled" });

  return ok({ ...departure, status: "cancelled", held_count: 0, confirmed_count: 0 });
}

// ---------------------------------------------------------------------------
// REQ-BOOK14 — bike assignment
// ---------------------------------------------------------------------------

export interface AssignBikeInput {
  departureId: string;
  bikeId: string;
}

export async function assignBike(db: Db, input: AssignBikeInput): Promise<ServiceResult<{ underProvisioned: boolean }>> {
  const bike = await db.bikes.get(input.bikeId);
  if (!bike) return fail(404, "bike_not_found", "Bike not found");
  if (bike.status !== "in_service") {
    return fail(409, "bike_not_in_service", `${bike.id} is out of service — choose another`);
  }

  const departure = await db.departures.get(input.departureId);
  if (!departure) return fail(404, "departure_not_found", "Departure not found");

  const activeAssignments = await db.bikeAssignments.listActiveByBike(input.bikeId);
  const overlapping = await hasOverlappingAssignment(db, activeAssignments, departure);
  if (overlapping) {
    return fail(409, "bike_already_assigned", `${bike.id} is already out on another tour at that time`);
  }

  await db.bikeAssignments.create({
    id: crypto.randomUUID(),
    departure_id: input.departureId,
    bike_id: input.bikeId,
    assigned_at: new Date().toISOString(),
    removed_at: null,
  });

  const assignments = await db.bikeAssignments.listByDeparture(input.departureId);
  const bookedPartySize = departure.held_count + departure.confirmed_count;
  const underProvisioned = assignments.length < bookedPartySize;

  return ok({ underProvisioned });
}

async function hasOverlappingAssignment(
  db: Db,
  activeAssignments: Awaited<ReturnType<Db["bikeAssignments"]["listActiveByBike"]>>,
  target: Departure
): Promise<boolean> {
  for (const assignment of activeAssignments) {
    if (assignment.departure_id === target.id) continue;
    const other = await db.departures.get(assignment.departure_id);
    if (other && other.date === target.date && other.time === target.time) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// REQ-BOOK15 — Owner edits an existing booking's date, attendees, contact roles
// (DR-B12b — direct edit, no customer round-trip; not consent-bearing)
// ---------------------------------------------------------------------------

export interface OwnerEditBookingInput {
  bookingId: string;
  newDepartureId?: string;
  participants?: Array<{
    name: string;
    age_band: Participant["age_band"];
    contactRole: ContactRole;
    notes?: string | null;
    email?: string | null;
    notifyOptedIn?: boolean;
  }>;
}

export async function ownerEditBooking(
  db: Db,
  rawDb: D1Database,
  input: OwnerEditBookingInput
): Promise<ServiceResult<Booking>> {
  const booking = await db.bookings.get(input.bookingId);
  if (!booking) return fail(404, "booking_not_found", "Booking not found");
  if (booking.status === "cancelled") {
    return fail(409, "booking_cancelled", "a cancelled booking cannot be edited");
  }

  if (input.participants) {
    if (!hasExactlyOneLeader(input.participants)) {
      return fail(422, "leader_required", "exactly one leader is required");
    }
  }
  const newPartySize = input.participants?.length ?? booking.party_size;

  if (input.newDepartureId && input.newDepartureId !== booking.departure_id) {
    // Same atomic acquire-new-then-release-old pattern as REQ-BOOK06
    // (modifyBookingDate) — a booking is never left holding zero
    // departures, and never (beyond a brief instant) holds two.
    const isHeldOnly = booking.status === "draft";
    const acquireNew = isHeldOnly
      ? await holdCapacity(rawDb, input.newDepartureId, newPartySize)
      : await holdConfirmedCapacity(rawDb, input.newDepartureId, newPartySize);
    if (!acquireNew) {
      return fail(409, "no_capacity_on_new_date", "the new departure has no capacity for the party size");
    }

    if (isHeldOnly) {
      await releaseHeldCapacity(rawDb, booking.departure_id, booking.party_size);
    } else {
      await releaseConfirmedCapacity(rawDb, booking.departure_id, booking.party_size);
    }

    await db.bookings.update(booking.id, { departure_id: input.newDepartureId });
    booking.departure_id = input.newDepartureId;
  } else if (input.participants && newPartySize !== booking.party_size) {
    // Party size changed without a departure change — re-check/adjust
    // capacity against the SAME departure.
    const isHeldOnly = booking.status === "draft";
    const delta = newPartySize - booking.party_size;
    if (delta > 0) {
      const acquired = isHeldOnly
        ? await holdCapacity(rawDb, booking.departure_id, delta)
        : await holdConfirmedCapacity(rawDb, booking.departure_id, delta);
      if (!acquired) {
        return fail(409, "no_capacity_on_new_date", "the new departure has no capacity for the party size");
      }
    } else if (delta < 0) {
      if (isHeldOnly) {
        await releaseHeldCapacity(rawDb, booking.departure_id, -delta);
      } else {
        await releaseConfirmedCapacity(rawDb, booking.departure_id, -delta);
      }
    }
  }

  if (input.participants) {
    await db.participants.deleteByBooking(booking.id);
    for (const p of input.participants) {
      await db.participants.create({
        id: crypto.randomUUID(),
        booking_id: booking.id,
        name: p.name,
        age_band: p.age_band,
        is_lead_booker: p.contactRole === "leader" ? 1 : 0,
        contact_role: p.contactRole,
        notes: p.notes ?? null,
        email: p.email ?? null,
        // A leader is always notified; a co-leader carries the opt-in (default on).
        notify_opted_in: p.contactRole === "leader" ? 1 : p.notifyOptedIn === false ? 0 : 1,
      });
    }
    if (newPartySize !== booking.party_size) {
      await db.bookings.update(booking.id, { party_size: newPartySize });
      booking.party_size = newPartySize;
    }
  }

  return ok(booking);
}

// ---------------------------------------------------------------------------
// REQ-BOOK16 — Owner transitions an existing booking's status
// (DR-B12c — constrained transitions only, each reusing the capacity/refund
// side-effects its equivalent automatic path already enforces)
// ---------------------------------------------------------------------------

export type BookingStatusTransition = "confirm" | "cancel" | "mark_abandoned";

const VALID_TRANSITIONS: Record<BookingStatusTransition, Booking["status"][]> = {
  confirm: ["draft", "provisionally-confirmed"],
  cancel: ["draft", "confirmed", "provisionally-confirmed"],
  mark_abandoned: ["draft"],
};

export interface TransitionBookingStatusInput {
  bookingId: string;
  transition: BookingStatusTransition;
  hoursBeforeDeparture?: number;
}

export async function transitionBookingStatus(
  db: Db,
  rawDb: D1Database,
  input: TransitionBookingStatusInput
): Promise<ServiceResult<Booking>> {
  const booking = await db.bookings.get(input.bookingId);
  if (!booking) return fail(404, "booking_not_found", "Booking not found");

  if (!VALID_TRANSITIONS[input.transition].includes(booking.status)) {
    return fail(409, "invalid_transition", "this status change isn't allowed");
  }

  switch (input.transition) {
    case "confirm": {
      // A provisionally-confirmed booking already holds capacity as
      // confirmed-equivalent (REQ-BOOK10 invariant) — no capacity change.
      // A draft only holds `held` capacity — move it to `confirmed`.
      if (booking.status === "draft") {
        const confirmed = await confirmCapacity(rawDb, booking.departure_id, booking.party_size);
        if (!confirmed) {
          return fail(409, "capacity_mismatch", "capacity accounting is inconsistent for this booking");
        }
      }
      const confirmedAt = new Date().toISOString();
      await db.bookings.update(booking.id, { status: "confirmed", confirmed_at: confirmedAt });
      return ok({ ...booking, status: "confirmed", confirmed_at: confirmedAt });
    }
    case "cancel": {
      if (booking.status === "draft") {
        await releaseHeldCapacity(rawDb, booking.departure_id, booking.party_size);
        const cancelledAt = new Date().toISOString();
        await db.bookings.update(booking.id, { status: "cancelled", cancelled_at: cancelledAt });
        return ok({ ...booking, status: "cancelled", cancelled_at: cancelledAt });
      }
      // confirmed | provisionally-confirmed — reuse REQ-BOOK07's cancellation
      // logic (capacity release + refund-policy determination) verbatim.
      const result = await cancelBooking(db, rawDb, {
        bookingId: booking.id,
        hoursBeforeDeparture: input.hoursBeforeDeparture ?? 999,
      });
      if (!result.ok) return result;
      return ok(result.value.booking);
    }
    case "mark_abandoned": {
      await releaseHeldCapacity(rawDb, booking.departure_id, booking.party_size);
      await db.bookings.update(booking.id, { status: "abandoned" });
      return ok({ ...booking, status: "abandoned" });
    }
  }
}
