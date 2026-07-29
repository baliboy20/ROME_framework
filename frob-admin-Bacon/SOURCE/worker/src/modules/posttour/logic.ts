// FOB post-tour — pure business logic.
//
// satisfies: REQ-POST01 (thank-you eligibility), REQ-POST03 (low-rating
// owner-alert threshold).

import type { Booking } from "../../types";

/**
 * REQ-POST01: the thank-you never sends for a no-show or an
 * operator-cancelled booking. We model "no-show" and "operator
 * cancellation" as booking states surfaced via status + source, matching
 * the fields actually present on `Booking` in this schema slice.
 */
export function isEligibleForThankYou(booking: Pick<Booking, "status">): boolean {
  return booking.status === "confirmed";
}

/** REQ-POST03: a rating of 3 stars or below always alerts the Owner. */
export function isLowRating(overallRating: number): boolean {
  return overallRating <= 3;
}
