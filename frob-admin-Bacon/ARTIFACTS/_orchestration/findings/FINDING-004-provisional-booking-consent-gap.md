# FINDING-004 — Provisional bookings (REQ-BOOK10) never acquire participants/consent

- **Increment:** 0
- **Component:** requirements (raw-input) — `booking.md` / `Decision_Record_Booking_Aristotle_2026-07-20.md` — propagating to `ARTIFACTS/_requirements/REQ-BOOK10.yaml`, then design (A7) and code
- **Raised by:** manual review of admin console "New booking" screen (A7) against the booking domain model
- **Date:** 2026-07-24
- **Severity:** HIGH (upgraded 2026-07-24) — confirmed to be **two** live gaps, not one design
  deferral: neither REQ-BOOK08 nor REQ-BOOK10 sends any completion/payment link today. Both
  owner-created booking paths can create a booking that holds real departure capacity while
  no mechanism exists — requirement, design, or code — for the customer to ever supply
  attendee details, waiver/terms acceptance, or an emergency contact for it.

## Summary

`REQ-BOOK08` (owner-created confirmed booking) correctly defers participant/consent capture
to the customer: its postcondition is "a booking draft exists... pending a payment link sent
to the customer," and the customer completes REQ-BOOK02 (attendees) → REQ-BOOK03 (consent) →
REQ-BOOK04 (payment) themselves.

`REQ-BOOK10` (owner-created provisional booking) has no equivalent. It goes straight to
`provisionally-confirmed` with capacity held "exactly as a paid confirmation would" — but the
original `booking.md`/Decision Record never asked how it acquires participants, waiver/terms
acceptance, or an emergency contact. This was **silently unowned ground**, the same class of
gap as DR-B7's on-day waiver or DR-B8's abandonment email before those were closed — not a
decision this record actually closed, despite `booking.md` claiming "ten decisions... all
resolved."

The admin console's A7 "New Booking" screen (`webapp-admin/lib/screens/new_booking_screen.dart`)
faithfully implements exactly what the backend contract supports (departure + party size +
price + confirmed/provisional toggle) — it is not a UI bug. The backend itself
(`POST /admin/bookings`, `POST /admin/bookings/provisional`) never asks for participants,
consent, or emergency contact either. The only endpoints that write those fields
(`PATCH /bookings/:id/participants`, `POST /bookings/:id/consent`) are gated by
`requireCustomerSession` and reachable only through the customer-facing draft-booking flow.

## Two candidate fixes considered

1. **Owner-side entry** — add operator-session variants of the participant/consent endpoints,
   let the Owner type them in during a phone call. **Rejected**: DR-B7's waiver invariant
   requires the *customer's own* digital acceptance ("the lead booker accepts... on behalf of
   the party"). An Owner ticking that box on the customer's behalf isn't the customer
   accepting anything — it would silently weaken the exact consent record REQ-BOOK03 exists to
   protect.
2. **Customer-facing completion link, mirroring REQ-BOOK08** — chosen. REQ-BOOK10 generates
   and sends the customer the same kind of link REQ-BOOK08 already sends for payment; the
   customer completes REQ-BOOK02 → REQ-BOOK03 themselves, unchanged. "Provisionally-confirmed"
   is redefined as capacity-status only, not full-record-complete. No new consent semantics, no
   new data model, reuses the already-tested customer-session flow.

## Resolution

Recorded as **DR-B11** in `_user_input/raw-requirements/Decision_Record_Booking_Aristotle_2026-07-20.md`
(v0.2). `booking.md` REQ-BOOK10 source text and `ARTIFACTS/_requirements/REQ-BOOK10.yaml`
(propagated AORDL) both updated 2026-07-24 to require the completion-link postcondition,
updated invariant, and revised scope boundary.

## Fix implemented — 2026-07-24

**Backend** (`SOURCE/worker`):
- `signBookingLink(secret, bookingId)` already existed (`modules/auth/jwt.ts:135`) but was never
  called anywhere — confirmed dead code. Wired it into a new `sendBookingCompletionLink()`
  helper (`routes/booking.ts`) that signs a 7-day link, builds a `CUSTOMER_APP_URL`-based URL
  (new optional `Env` var, `env.ts`), and emails it via the existing `notifications.send()`
  (transactional, idempotency-keyed on `booking-completion-link:${bookingId}`).
- Both `POST /admin/bookings` (BOOK08) and `POST /admin/bookings/provisional` (BOOK10) now
  require `customerEmail` (Zod, 422 if missing/invalid) and call the helper after a successful
  create; response now includes `completionLinkSent: boolean`.
- New `test/booking.routes.test.ts` (4 tests, route-level via Hono + real D1-backed test env):
  rejects missing `customerEmail` for both endpoints; verifies a real Postmark-shaped send call
  with a link containing a token that `verifyBookingLink()` resolves back to the created
  booking id. Full suite: **124/124 passing** (was 120/120; +4 new, 0 regressions).

**Admin UI** (`SOURCE/apps/webapp-admin`):
- `new_booking_screen.dart`: added a required "Customer email" field (client-side format
  validation before submit) passed as `customerEmail` in both create calls; confirmation
  snackbar now reports whether the completion link actually sent
  (`result['completionLinkSent']`) rather than just "Booking created."
- `flutter analyze`: clean (1 unrelated pre-existing lint in a different file). `flutter test`:
  16/17 — the 1 failure is the pre-existing, unrelated sign-in-validation test flagged in the
  P5 re-gate; not introduced or affected by this change.

## Customer-side landing page implemented — 2026-07-24

Built as a new **magic-link landing page**: a route inside the existing `webapp-customer`
Flutter island (not a separate microsite), matching the project's existing "multi-island,
mode-switched-by-query-param" pattern (`?mode=hub&...` already existed for the manage-booking
hub; this adds `?mode=complete&token=<link_token>`).

- `main.dart`: new `CompletionApp` host, wired behind `?mode=complete&token=...`.
- `widgets/completion_flow.dart` (new): exchanges the link token via
  `BookingApi.verifyCompletionLink()` (new — calls the already-existing
  `POST /auth/customer/verify-link`, REQ-AUTH02), shows an "invalid/expired link" state on
  failure, otherwise reuses the existing `AttendeesStep` → `ConsentStep` → `ReviewStep` →
  (`PaymentStep` | direct finish) → `ConfirmationStep` widgets unchanged — no new consent UI
  was built, the existing tested REQ-BOOK02/03 flow is reused verbatim.
- `widgets/booking_flow_controller.dart`: new `startFromCompletionLink()` entry point that
  skips REQ-BOOK01 selection (departure/party/price were already set by the Owner), loads them
  from `GET /bookings/:id` instead, and records `bookingSource`.
- `widgets/steps.dart` (`ReviewStep`): now branches on `bookingSource == 'provisional'` —
  provisional bookings (REQ-BOOK10/DR-B2 "payment not required at creation") finish directly;
  owner-created confirmed bookings (REQ-BOOK08) still route to payment, unchanged.
- `SOURCE/worker/src/routes/booking.ts`: fixed the mailed link to point at `/?mode=complete&
  token=...` (root path — the app is a single-page island that reads query params off wherever
  it's served, there is no `/booking/complete` route) rather than the placeholder path used
  when the backend piece was first built.
- Tests: 3 new controller-level tests (`booking_flow_test.dart`, using `http/testing.dart`'s
  `MockClient` — success path, provisional-skips-payment, invalid-link-error). Full customer
  app suite: **9/9 passing** (was 6/6). `flutter analyze`: clean.

**Loop is now end-to-end closed**: Owner creates booking → email sent with real link →
customer clicks it → lands on a working page → supplies attendees + consent themselves →
(pays, if REQ-BOOK08) → confirmed. Worker suite re-confirmed **124/124** after these changes
(no backend logic changed in this pass, only the link path string).

## Downstream re-verification still owed

- [ ] **P2 (analysis)** — re-check `REQ-BOOK10`'s coverage in `requirements-coverage.md` /
      8-dimension analysis for the new postcondition; confirm `REQ-NOTIF01` doesn't need an
      explicit outcome line for the completion-link send.
- [ ] **P3 (design)** — no "link sent / awaiting customer completion" status is surfaced later
      on the booking browser (A19 — already flagged OPEN in FINDING-003) once the Owner
      navigates away from the A7 creation snackbar; the only feedback is the one-time toast.
- [ ] **Resend affordance** — no way today to re-send the link if it fails or the customer
      loses it; the booking browser (A19) should get a "resend completion link" action calling
      a new endpoint (none exists yet — `sendBookingCompletionLink` is currently only called
      inline from booking creation).
- [ ] **DEFERRED BY SPONSOR DECISION (2026-07-24):** traceability register rebuild — parked
      until the completion-link/emailing workflow above is satisfactorily integrated end-to-end
      into the admin app; revisit then, not part of this pass.
