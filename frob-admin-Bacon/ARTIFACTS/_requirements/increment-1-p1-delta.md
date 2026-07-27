# Increment 1 — P1 requirements delta (A19 "Bookings" refinement)

**Date:** 2026-07-27
**Source:** `_user_input/raw-requirements/Refinement_A19_BookingBrowser_2026-07-27.md` (sponsor: William, Owner)
**Scope of this delta:** presentation/navigation only, no new capability. Amends REQ-BO05 and REQ-BO06 in place; no new REQ-* file added.

## What changed and why

1. **Master/Detail navigation split (REQ-BO05, REQ-BO06 Conditions/Outcomes/ScopeBoundary).**
   The sponsor confirmed A19 must become a true two-screen pattern — a "Bookings"
   search/results screen (Master) and a separate booking-detail screen (Detail) reached
   by selecting a result, with a back action returning to Master. REQ-BO05 now states
   the search screen is its own screen and that selecting a result navigates to the
   REQ-BO06 detail screen rather than rendering the record inline. REQ-BO06 now states
   the detail view is a distinct screen with a back action, and that no full record is
   shown on the search screen. This replaces the prior "one screen, two panes" reading
   with the sponsor's explicit two-route model. No data fields, search criteria, or
   payment/security invariants changed.

2. **Read-only conformance fix (REQ-BO06 Conditions/ScopeBoundary).**
   The currently-shipped Edit button on the detail panel was already out of scope per
   REQ-BO06's original OutOfScope ("editing a booking from this view... routes to the
   booking-update or payment-admin capability") — its presence is a conformance defect
   against an already-approved requirement, not a new decision. REQ-BO06 is amended to
   state explicitly that the detail screen presents no edit action, closing the gap so
   the requirement can be used to gate the fix. No new requirement was needed for this;
   it is a defect against existing REQ-BO06.

3. **Screen rename ("Booking browser" -> "Bookings").**
   Reflected in REQ-BO05's ScopeBoundary as the display name of the master screen.
   REQ-BO06 does not carry the screen name; no change needed there beyond the
   navigation-source reference.

## Traceability

- Binding of record unchanged: REQ-BO05 (search) / REQ-BO06 (detail). No binding to
  REQ-BOOK11/12/13 (create/edit/cancel, owned by A7/A8) — confirmed by sponsor as out
  of scope for this read-only screen.
- No change to Preconditions, Invariants, NonFunctional/Security, or Errors in either
  requirement — payment/security posture and data fields shown are unchanged per
  sponsor instruction.

## Open questions

None. All sponsor decisions were resolved at P0.5 intake (2026-07-27); both REQ-BO05
and REQ-BO06 carry `OpenQuestions: RESOLVED / No open questions for this requirement`,
unchanged by this delta.
