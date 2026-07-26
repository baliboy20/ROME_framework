// FOB core-notifications — booking-outcome dispatcher.
//
// Decides which confirmation "flavour" a booking is in from its payment
// position and sends the matching template to the lead booker:
//   paid == 0            -> booking_reserved_unpaid   (finish + pay link)
//   0 < paid < total     -> booking_deposit_received  (deposit, balance due)
//   paid >= total        -> booking_confirmed_paid    (all set)
//
// "Allocate a template to a process" = activate a template for the matching
// use_case (one-active-per-use_case invariant, enforced in the DB). If no
// active template exists for the flavour, a built-in plain-text fallback is
// sent — a booking outcome must never send nothing. Idempotency-keyed per
// (booking, flavour) so webhook redelivery / reconcile can't double-send, and
// an unpaid -> paid transition still sends each flavour exactly once.

import type { Db } from "../../db/client";
import { query } from "../../db/client";
import type { Env } from "../../env";
import { send } from "./send";

export type BookingFlavour =
  | "booking_confirmed_paid"
  | "booking_deposit_received"
  | "booking_reserved_unpaid";

export const BOOKING_FLAVOURS: BookingFlavour[] = [
  "booking_confirmed_paid",
  "booking_deposit_received",
  "booking_reserved_unpaid",
];

/**
 * Per-process merge-field catalogue: the variable names each flavour supplies,
 * plus sample values used for admin test-sends. This is the contract a template
 * for that use_case may rely on — the editor surfaces these as available fields.
 */
export const OUTCOME_FIELDS: Record<
  BookingFlavour,
  { label: string; fields: string[]; sample: Record<string, string> }
> = {
  booking_confirmed_paid: {
    label: "Booking confirmed — paid in full",
    fields: ["name", "tour", "date", "time", "party_size", "amount_paid", "booking_ref", "meeting_point"],
    sample: {
      name: "Alex Rivers", tour: "Golden Hour City", date: "2026-08-15", time: "18:30",
      party_size: "2", amount_paid: "£110.00", booking_ref: "FOB-8K2M4Q",
      meeting_point: "Barbican Centre, Silk Street, London EC2Y 8DS",
    },
  },
  booking_deposit_received: {
    label: "Deposit received — balance due",
    fields: ["name", "tour", "date", "party_size", "amount_paid", "balance_due", "completion_link"],
    sample: {
      name: "Alex Rivers", tour: "Golden Hour City", date: "2026-08-15", party_size: "2",
      amount_paid: "£30.00", balance_due: "£80.00",
      completion_link: "https://friendsonbikes.uk/en/book/?mode=complete&token=…",
    },
  },
  booking_reserved_unpaid: {
    label: "Reserved — awaiting payment",
    fields: ["name", "tour", "date", "party_size", "completion_link", "meeting_point"],
    sample: {
      name: "Alex Rivers", tour: "Golden Hour City", date: "2026-08-15", party_size: "2",
      completion_link: "https://friendsonbikes.uk/en/book/?mode=complete&token=…",
      meeting_point: "Barbican Centre, Silk Street, London EC2Y 8DS",
    },
  },
};

function money(pence: number): string {
  return "£" + (pence / 100).toFixed(2);
}

export interface DispatchResult {
  flavour: BookingFlavour | null;
  status: string;
  recipient?: string | null;
}

/**
 * Send the confirmation email that matches a booking's current payment
 * position. Safe to call repeatedly — the idempotency key guards duplicates.
 */
export async function sendBookingOutcome(
  db: Db,
  env: Env,
  bookingId: string,
  opts?: { completionLink?: string }
): Promise<DispatchResult> {
  const booking = await db.bookings.get(bookingId);
  if (!booking) return { flavour: null, status: "booking_not_found" };

  const payments = await db.payments.listByBooking(bookingId);
  const paid = payments
    .filter((p) => p.status === "succeeded" || p.status === "partially_refunded")
    .reduce((sum, p) => sum + p.amount_pence, 0);
  const total = booking.price_total_pence;

  const flavour: BookingFlavour =
    paid <= 0 ? "booking_reserved_unpaid" : paid < total ? "booking_deposit_received" : "booking_confirmed_paid";

  // Recipient: the lead booker's email (never a co-leader here).
  const leaders = await query<{ name: string; email: string | null }>(
    env.DB,
    `SELECT name, email FROM participants
       WHERE booking_id = ? AND contact_role = 'leader' AND email IS NOT NULL AND email <> ''
       LIMIT 1`,
    [bookingId]
  );
  const recipient = leaders[0]?.email ?? null;
  if (!recipient) return { flavour, status: "no_contact_address", recipient: null };

  const departure = await db.departures.get(booking.departure_id);
  const balance = Math.max(0, total - paid);
  const vars: Record<string, string> = {
    name: leaders[0]?.name ?? "there",
    tour: departure?.tour_id ?? "",
    date: departure?.date ?? "",
    time: departure?.time ?? "",
    party_size: String(booking.party_size),
    amount_paid: money(paid),
    balance_due: money(balance),
    booking_ref: booking.id,
    meeting_point: "Barbican Centre, Silk Street, London EC2Y 8DS",
    completion_link: opts?.completionLink ?? "",
  };

  const fallback = fallbackText(flavour, vars);
  const result = await send(db, env, {
    messageType: "transactional",
    recipient,
    event: `booking-outcome:${bookingId}:${flavour}`,
    idempotencyKey: `booking-outcome:${bookingId}:${flavour}`,
    subject: fallback.subject,
    textBody: fallback.body,
    // Renders from the active template for this use_case when one exists;
    // otherwise the plain-text fallback above is sent (never nothing).
    template: { useCase: flavour, vars },
  });

  return { flavour, status: result.status, recipient };
}

/** Built-in copy used only when a flavour has no active template. */
export function fallbackText(flavour: BookingFlavour, v: Record<string, string>): { subject: string; body: string } {
  switch (flavour) {
    case "booking_confirmed_paid":
      return {
        subject: `You're booked — ${v.tour}`,
        body:
          `Hi ${v.name},\n\nYour place on ${v.tour} (${v.date}${v.time ? ` at ${v.time}` : ""}) is confirmed and ` +
          `paid in full (${v.amount_paid}). Booking reference ${v.booking_ref}.\n\n` +
          `Meet us at ${v.meeting_point}, 10 minutes before your start time. Bike, helmet, hi-vis and route ` +
          `map are provided — just bring yourself.\n\nSee you there,\nFriends on Bikes`,
      };
    case "booking_deposit_received":
      return {
        subject: `Deposit received — ${v.tour}`,
        body:
          `Hi ${v.name},\n\nThanks — we've received ${v.amount_paid} towards your ${v.tour} ride on ${v.date}. ` +
          `Balance still due: ${v.balance_due}.\n\n` +
          (v.completion_link ? `Pay the balance here: ${v.completion_link}\n\n` : "") +
          `Friends on Bikes`,
      };
    case "booking_reserved_unpaid":
      return {
        subject: `Your booking is reserved — ${v.tour}`,
        body:
          `Hi ${v.name},\n\nWe've reserved your place on ${v.tour} (${v.date}). To confirm it, please complete ` +
          `your booking and payment here:\n\n${v.completion_link}\n\nFriends on Bikes`,
      };
  }
}
