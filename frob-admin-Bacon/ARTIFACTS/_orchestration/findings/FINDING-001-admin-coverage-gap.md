# FINDING-001 — webapp-admin: design→code coverage gap (P5 gate escape)

- **Increment:** 0
- **Component:** webapp-admin (Owner/operator console)
- **Raised by:** Roma (post-delivery audit), on sponsor report of missing features
- **Date:** 2026-07-22
- **Severity:** HIGH — gate escape; delivered app does not satisfy the majority of its owned requirements
- **Status:** OPEN → remediation in progress

## Summary

The P3 design specifies a **20-screen admin console (A1–A20)** implementing **25 admin-owned
requirements**. The delivered P5 build ships **7 nav screens + sign-in**, of which **only 1
(A17 Departure calendar) is functional end-to-end**. **11 of 20 designed screens were never
built**, despite the backing backend routes existing in api-worker.

GATE-P5 was recorded APPROVE ("78/78 code+test, independently verified"). That verdict verified
per-file unit tests but did **not** verify (a) UI-surface completeness against the design, nor
(b) frontend↔backend contract wiring. Both edges drifted.

## Evidence — coverage of the 20 designed surfaces

| A## | Screen | REQ(s) | Built | Status |
|-----|--------|--------|-------|--------|
| A1  | Operator sign-in | AUTH01/05 | yes | WORKS |
| A17 | Departure calendar | BO04 | yes | WORKS (drill-down overlay is a stub) |
| A8  | Payments & refunds | BOOK07/13 | yes | PARTIAL — rows render hollow (field mismatch); refund posts to wrong (customer) route |
| A9  | Enquiries | PRE05 | yes | DEAD — GET /admin/enquiries returns 404 (route missing) |
| A18 | Scheduler | BOOK11/12/13 | yes | FORM-ONLY — hard-coded create mode, date=now(), cancel id literal |
| A12 | Add bike | FLEET01 | yes | FORM-ONLY — duplicate guard defeated by /admin/fleet shape |
| A15 | Flagged-bike maintenance | FLEET05/06 | yes | FORM-ONLY — hard-coded bike FOB-004 |
| A20 | Bike allocation | BOOK14 | yes | BROKEN — hard-coded demo-departure; available bikes always empty |
| A3  | Deliverability status | NOTIF02 | no | NOT BUILT |
| A4  | Owner alerts inbox | NOTIF04 | no | NOT BUILT |
| A5  | Audit log viewer | CNA03 | no | NOT BUILT (GET /admin/audit orphaned) |
| A6  | Publish & content quality | SEO03 | no | NOT BUILT (POST /publish orphaned) |
| A7  | New booking | BOOK08/10 | no | NOT BUILT (POST /admin/bookings[/provisional] orphaned) |
| A10 | Incident review & dispatch | OPS12 | no | NOT BUILT |
| A11 | Hazard-log review | OPS14 | no | NOT BUILT |
| A13 | Equipment add/replace | FLEET02 | no | NOT BUILT (POST /admin/equipment orphaned) |
| A14 | Fleet & equipment readiness | FLEET03 | no | NOT BUILT (GET /admin/fleet orphaned) |
| A16 | Compliance review & renewal | FLEET07/08 | no | NOT BUILT |
| A19 | Booking browser (search+detail) | BO05/BO06 | no | NOT BUILT (GET /admin/bookings[/:id] orphaned) |

Tally: 1 working · 4 form-only/partial · 2 broken · 11 not built · (+ sign-in works).

## Requirements impact

Of 25 admin-owned requirements, only 3 are genuinely satisfied in the running app
(AUTH01, AUTH05, BO04). Backend endpoints for most others EXIST but are never called by any
screen ("backend built, frontend half-built").

## Contract-drift defects confirmed (frontend↔backend)

1. GET /admin/enquiries — route missing (404). [FIXED-LATER]
2. GET /admin/fleet — returns status COUNTS, not bike records; breaks Add-bike dedupe and
   Bike-allocation availability. No per-departure availability endpoint exists.
3. refundBooking() posts {refund_amount_pence} to POST /bookings/:id/cancel (customer-guarded,
   wrong schema); correct operator route POST /admin/bookings/:id/refund exists but is never called.
4. GET /admin/bookings rows lack the fields PaymentRow.fromJson reads (booking_ref, customer_name,
   paid_pence, refunded_pence, provider_ref) → hollow Payments table.
5. GET /admin/calendar object-vs-list cast. [FIXED — api_client.dart]
   GET /admin/bookings object-vs-list cast. [FIXED — api_client.dart]

## Root cause

GATE-P5 verification checked code+test existence per file, not:
- design surface coverage (screen count vs A1–A20 in component-specs.md / mockup), and
- API contract conformance between webapp-admin's ApiClient and api-worker routes
  (existence, shape, and auth-guard compatibility).

Recommend a framework-level gate amendment (candidate ROME-PROP): P5 must include a
design-surface coverage check and a client↔server contract conformance check, not only
per-component unit tests.

## Remediation plan (authorized by sponsor 2026-07-22)

1. Fix the 6 broken/partial built screens (enquiries route, payments refund+fields,
   scheduler/allocation/flagged-bike hard-coded ids, fleet shape).
2. Build the 11 missing screens, wiring the already-existing backend routes.
3. Re-audit coverage before considering increment 0 for seal.

Remediation progress is tracked in this file's changelog below.

## Changelog

- 2026-07-22 — Finding raised; api_client object-vs-list casts for calendar & bookings fixed;
  dev login prefill added (to be removed before non-local build). Remediation started.
- 2026-07-22 — Remediation COMPLETE (status OPEN → RESOLVED-pending-reaudit):
  - Backend: added route module `admin-lists.ts` with the missing operator-guarded
    list endpoints (enquiries, bikes[+available_for], departures, guides, equipment,
    incidents, hazards, compliance, alerts, deliverability, audit-log global, content).
    Enriched `/admin/bookings` with payment fields (customer_name, paid/refunded pence,
    provider_ref, payment_status) — no card data.
  - Contract fixes: refund now posts `{refundAmountPence}` to the operator route
    `/admin/bookings/:id/refund` (was `{refund_amount_pence}` to the customer cancel
    route); getFleet/getAvailableBikes read bike RECORDS from `/admin/bikes` (was the
    counts object); scheduler create posts `{tourId,date,time,capacity,guideId}` (was
    `{tour_id,datetime,has_guide}`); model field mappings for DepartureRow/EnquiryRow/
    PaymentRow aligned to actual backend fields; addEquipment uses `purchase_date`.
  - Frontend: built the 11 missing screens (A3,A4,A5,A6,A7,A10,A11,A13,A14,A16,A19);
    replaced hard-coded ids in Scheduler/Bike-allocation/Flagged-bike with real
    pickers. Nav regrouped to the mockup's 6 groups covering A3–A20.
  - Verification: worker `tsc --noEmit` clean; `flutter analyze` 0 issues; all list
    endpoints return 200 with seeded data; createDeparture 200, addEquipment 201,
    refund reaches Stripe (502 only due to placeholder local STRIPE_SECRET_KEY).
  - Coverage now: 20/20 designed admin surfaces present and wired; 3 built screens
    de-hard-coded. Residual: refund needs a real Stripe test key to complete locally;
    drill-down overlays remain summary-level; a full re-audit + P5 re-gate is still owed
    before increment 0 is considered for seal.
  - Gate recommendation stands (surface-coverage + contract-conformance + reachability
    checks) — candidate framework amendment.
