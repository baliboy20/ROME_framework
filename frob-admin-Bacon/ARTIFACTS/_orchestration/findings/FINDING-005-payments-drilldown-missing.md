# FINDING-005 — Payments screen (A8) has no real drill-down; "View" silently opens the refund form

- **Increment:** 0
- **Component:** webapp-admin (`lib/screens/payments_screen.dart`) + api-worker (`routes/backoffice.ts` REQ-BO05)
- **Raised by:** sponsor review of the Payments & refunds screen, 2026-07-24
- **Severity:** MEDIUM — no data loss or money-safety issue (refunds themselves are correct,
  cumulative, and gated), but the screen misrepresents what it shows and hides real transaction
  history.

## Summary

Two compounding defects:

**1. The "View" button is mislabeled and unsafe.** `_PaymentsView` shows `'Refund'` when a row's
status is `succeeded`, else `'View'` — but both labels wire to the exact same
`_openRefundModal(context, cubit, r)` call. There is no read-only detail view. Tapping "View"
on a `failed`/`no_show`/`requires_payment` row opens the same refund-entry form a succeeded
payment gets, which is misleading at best (the label promises a look, not a refund attempt) and
should not be reachable at all for a payment that was never successfully taken.

**2. There's no real per-transaction data to drill into even if the button were fixed.**
`ApiClient.getPayments()` doesn't call a payments endpoint — there isn't one. It calls
`GET /admin/bookings` and reuses the booking-list shape. That query
(`backoffice.ts` REQ-BO05) pre-aggregates at the SQL level:

```sql
COALESCE((SELECT SUM(amount_pence) FROM payments WHERE booking_id = b.id), 0) AS paid_pence,
COALESCE((SELECT SUM(refund_amount_pence) FROM payments WHERE booking_id = b.id), 0) AS refunded_pence,
(SELECT session_id FROM payments WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) AS provider_ref,
(SELECT status FROM payments WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) AS payment_status
```

A booking with more than one payment attempt (a failed try then a successful one) or more than
one partial refund collapses into a single combined total and a single latest provider
reference — the individual events, timestamps, and per-transaction refs are invisible from this
screen. The real per-payment array already exists and is already returned correctly elsewhere —
`GET /admin/bookings/:id` (also `backoffice.ts`, REQ-BO06, used by the A19 booking browser)
returns a proper `payments: [{id, status, amount_pence, refund_amount_pence, provider_reference}, ...]`
array. A8 just never fetches or renders it.

## Root cause

Same class of gap as FINDING-001/004: a screen was built that looks complete (a table, a
button, a status pill) but the underlying data contract was never actually wired to show the
real multi-transaction reality — same "looks done, isn't" pattern the original P5 gate never
caught (no design-fidelity or data-completeness check, see FINDING-003's recommendation).

## Fix (2026-07-24)

- `payments_screen.dart`: split the single ambiguous button into two independent actions —
  **Refund** (only shown/enabled when refund is actually possible: latest payment status
  `succeeded` or `partially_refunded`) and **View** (always available, opens a new read-only
  `_PaymentDetailModal`).
- `_PaymentDetailModal` (new): fetches the real booking detail (`ApiClient.getBooking`, the
  same endpoint A19 already uses) and lists every payment record for that booking — status,
  amount, refund amount, provider reference, in order — instead of the single collapsed row.
- No backend change needed — `GET /admin/bookings/:id` already returns the correct per-payment
  array; this was purely a frontend gap (wrong endpoint called, no detail UI built).

### Follow-up (same day): payment → source booking link

Sponsor asked whether the payment detail could link back to the booking that generated it.
Added a **"View booking"** action to `_PaymentDetailModal`.

First cut navigated to the A19 booking browser (via a new app-level `NavCubit`). **Reverted**
on sponsor feedback: a route change unmounts the Payments & refunds screen, discarding its
filter/scroll state. The link should not disturb the screen the user came from.

Final design — **`_BookingDetailModal`, a read-only dialog**, not a navigation:
- "View booking" closes the payment-detail modal and opens `_BookingDetailModal` as its own
  dialog, layered over the (untouched) Payments screen. Closing it returns the user exactly
  where they were — same filter, same scroll.
- `_BookingDetailModal` fetches the same `GET /admin/bookings/:id` the A19 browser uses and
  renders the booking record read-only: lead name, ref/status/party, price, attendees with
  contact roles, emergency contact, consent timestamps, status history.
- The `NavCubit`/shell-route plumbing from the first cut was fully removed (no dead code):
  `main.dart`, `shell_screen.dart`, and `booking_browser_screen.dart` are back to their prior
  local-state form; `lib/bloc/nav_cubit.dart` deleted.

Rationale on record: keep cross-record "peeks" as modals over the current screen; reserve route
changes for deliberate top-level navigation, so a quick look never costs the user their place.

## Downstream note

`statusFromString()` (`models.dart`) has no case for `partially_refunded` — it silently falls
through to `draft`. Not fixed in this pass (out of scope for the drill-down defect) — flagging
so it isn't lost: a partially-refunded payment currently displays with the wrong status pill on
the aggregate row.
