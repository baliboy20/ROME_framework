# London Bike Tours — UX Interaction Specification (UXIS)

| Field | Value |
|-------|-------|
| **Document UID** | LBT-UXIS-001 |
| **Version** | 0.1 |
| **Date** | 2026-07-22T00:00:00Z |
| **Status** | DRAFT |
| **Document Type** | Project UXIS (authored from T6f template `ROME-PIPELINE-006` v0.1) |
| **Product** | friendsonbikes.uk — small-group guided cycling tours, Barbican, London |
| **Companion** | T6f template (`ROME-PIPELINE-006`) · wireframe sidecars (ROME-GUIDE-001 Part 3) |

---

## 0. Scope & surface inventory

This UXIS governs the public booking website. Surfaces referenced throughout carry stable ids:

| id | Surface | Kind |
|---|---|---|
| W1 | Home | marketing / entry |
| W2 | Tours index (all three routes) | listing |
| W3 | Tour detail (Hidden City / Icons & Insights / Golden Hour) | detail |
| W4 | Booking — step 1: choose tour | flow |
| W5 | Booking — step 2: choose date & time (live availability calendar) | flow |
| W6 | Booking — step 3: party & guest details | flow |
| W7 | Booking — step 4: payment (Stripe) | flow · money-critical |
| R1 | Booking confirmation | post-commit redirect target |
| W8 | Gift vouchers — purchase | flow · money-critical |
| W9 | Contact / private-group enquiry | form |
| W10 | FAQ | content |
| W11 | About | content |
| E1 | Sold-out / no-availability (empty state of W5) | empty |
| E2 | Payment-failed (error state of W7) | error |
| E3 | Session/hold expired (transient of W5–W7) | error |

> **Behavioural, not visual.** This document says *when* the calendar disables a date and *what*
> a failed payment preserves — never what green, which font, or how the card animates. Visual
> treatment lives in the design system (`London Bike Tours.dc.html` and its tokens).

---

## Part A — Universal Interaction Conventions

Rules that apply to **every** surface unless a Part B `UXD-*` record explicitly overrides them.
A surface with no Part B entry is governed entirely by Part A (the silence rule).

### A1 · Navigation (UXC-NAV-*)
| ID | Convention | Source |
|---|---|---|
| UXC-NAV-1 | Back (browser or in-app "← step") returns to the previous booking step with all entered state intact; it never re-submits a step or re-charges. | proposed default |
| UXC-NAV-2 | Post-commit surfaces (R1 confirmation, W8 voucher receipt) are redirect targets reached only after the charge succeeds; Back from them returns to the site, never re-triggers payment. | derived — Stripe one-charge guarantee |
| UXC-NAV-3 | Deep links carrying a tour (`?tour=hidden-city`) or date pre-fill the booking controls; missing or stale context renders empty controls at step 1, never an error. | proposed default |
| UXC-NAV-4 | The persistent top nav (Tours / About / Contact / Book) and language switch (EN·FR·ES) are reachable from every surface including mid-flow; leaving the flow keeps the in-progress booking recoverable per UXC-SCR-2. | ratified default |

### A2 · Screens & pages (UXC-SCR-*)
| ID | Convention | Source |
|---|---|---|
| UXC-SCR-1 | Initial focus on each booking step lands on the first incomplete interactive control (step 5: the calendar; step 6: first empty field). | proposed default |
| UXC-SCR-2 | In-progress booking input (tour, date, party size, guest details) is preserved across refresh, navigation away, and language switch, for the life of the capacity hold (UXD-01); return restores the same step. | proposed default |
| UXC-SCR-3 | Content surfaces (W1, W10, W11) are fully readable and navigable without JavaScript; scroll-reveal motion is progressive enhancement only (see UXC-MOT-2). | ratified default |

### A3 · Modals & popups (UXC-MOD-*)
| ID | Convention | Source |
|---|---|---|
| UXC-MOD-1 | Money-moving or destructive confirms (cancel a booking, confirm a refund) are blocking modals dismissed only by an explicit Confirm/Cancel choice — never by outside-click or Escape. | proposed default |
| UXC-MOD-2 | All modals trap focus and return it to the triggering control on close. | proposed default |
| UXC-MOD-3 | Informational overlays (route map preview, "what's included", cookie notice) dismiss freely — outside-click, Escape, or close button. | proposed default |

### A4 · Components (UXC-CMP-*)
| ID | Convention | Source |
|---|---|---|
| UXC-CMP-1 | Every interactive element has visible default / hover-or-press / disabled / keyboard-focus states. | derived — UXC-A11Y-1 |
| UXC-CMP-2 | Any control that triggers server work (check availability, pay, submit enquiry) shows an in-progress state and is non-re-triggerable while pending. | proposed default |
| UXC-CMP-3 | Calendar date cells expose four states — available, unavailable/past, sold-out, selected — distinguished by more than colour alone (UXC-A11Y-3). | derived — E1 |

### A5 · UI states (UXC-STA-*)
| ID | Convention | Source |
|---|---|---|
| UXC-STA-1 | Every surface that loads data (W5 availability, R1 confirmation, W8) defines loading / ready / empty / error states. | proposed default |
| UXC-STA-2 | UI states map to the booking lifecycle: `browsing → held → paying → confirmed → (cancelled/refunded)`. The capacity hold is a named client+server transient, not a persisted booking. | derived — booking entity |

### A6 · Forms & validation (UXC-FRM-*)
| ID | Convention | Source |
|---|---|---|
| UXC-FRM-1 | Format validation (email, phone) fires on blur; required-field validation fires on submit attempt; never on first keystroke. | proposed default |
| UXC-FRM-2 | Error messages are inline, adjacent to the field, using the REQ error-pair wording verbatim. | derived — REQ errors |
| UXC-FRM-3 | The step's continue/pay button is disabled only for unmet **blocking** conditions, with the reason stated beside it (e.g. "Select a date to continue"). | proposed default |
| UXC-FRM-4 | Party size is bounded to remaining capacity for the chosen departure (max 10 per open tour); the control cannot request more than is held. | derived — REQ capacity |

### A7 · Feedback & notifications (UXC-FBK-*)
| ID | Convention | Source |
|---|---|---|
| UXC-FBK-1 | Every actor-observable outcome has exactly one primary channel: booking success → R1 page **and** confirmation email; enquiry → inline success; payment failure → inline on W7. | proposed default |
| UXC-FBK-2 | Exception copy reassures — states what happened, what is preserved, and the next step (see E2, E3, UXC-ERR-1). | derived — UXC-ERR |
| UXC-FBK-3 | The booking reference is shown on R1 within the stated 60-second promise and repeated in the email; it is the single support-quotable id. | derived — marketing claim |

### A8 · Motion (UXC-MOT-*)
| ID | Convention | Source |
|---|---|---|
| UXC-MOT-1 | Motion uses the shared token set: durations {fast 250ms / base 600ms / slow 950ms}, easing `cubic-bezier(.16,1,.3,1)` for entrances. | ratified — design system |
| UXC-MOT-2 | `prefers-reduced-motion: reduce` replaces all movement (scroll reveals, ken-burns, parallax, count-ups) with the final resting state shown instantly — no exceptions. | derived — UXC-A11Y |
| UXC-MOT-3 | Marketing scroll-reveal / parallax on W1 is **decorative-permitted** on content surfaces only; inside the booking flow (W4–W8) motion is feedback-only (state change, validation, progress). | deviation-anchor — see UXD-04 |
| UXC-MOT-4 | A reveal animation plays once per element per page load (on enter); it never re-triggers on scroll-up. | ratified — design system |

### A9 · Errors & empty states (UXC-ERR-*)
| ID | Convention | Source |
|---|---|---|
| UXC-ERR-1 | Every declared error/empty state offers a recovery action; a dead end is a defect. E1 offers nearest alternative dates; E2 offers retry with card details preserved; E3 offers re-hold. | proposed default |
| UXC-ERR-2 | Payment and security failures show generic on-screen copy (no card-network internals, no enumeration of which field failed auth); detail goes to the Stripe dashboard / owner queue. | derived — PCI / anti-enumeration |

### A10 · Responsive & devices (UXC-RSP-*)
| ID | Convention | Source |
|---|---|---|
| UXC-RSP-1 | Target devices: mobile (360–430px), tablet (768–1024px), desktop (≥1200px). Booking is mobile-first — guests book on phones at the meeting point. | proposed default — needs DR |
| UXC-RSP-2 | Touch targets ≥ 44×44px on every surface, calendar date cells included. | derived — WCAG |
| UXC-RSP-3 | Apple Pay / Google Pay express buttons surface on W7 only on supporting devices; their absence never blocks card entry. | derived — Stripe |

### A11 · Accessibility (UXC-A11Y-*)
| ID | Convention | Source |
|---|---|---|
| UXC-A11Y-1 | Every interaction is keyboard-operable; the calendar is arrow-key navigable; no pointer-only affordances. | derived — WCAG 2.1 AA |
| UXC-A11Y-2 | State changes (date selected, hold started/expiring, payment result, form errors) announce via ARIA live regions, not visually alone. | derived — WCAG |
| UXC-A11Y-3 | WCAG AA contrast minimum; calendar/date and tour-availability states never rely on colour alone (icon + label). | derived — WCAG |

---

## Part B — Navigation map (UXD-NAV-MAP)

| Route | Surface | Device(s) | Entry points | Access guard → REQ |
|---|---|---|---|---|
| `/` | W1 Home | all | direct, search, nav | none (public) |
| `/tours` | W2 Tours index | all | nav, W1 CTAs | none |
| `/tours/{slug}` | W3 Tour detail | all | W2 cards, deep link | none |
| `/booking` | W4→W7 flow | all (mobile-first) | "Book" nav, W1/W3 CTAs, `?tour=` deep link | none to browse; hold required to reach W7 |
| `/booking/confirmation/{ref}` | R1 | all | redirect after charge only | valid booking ref; else → W4 |
| `/gift-vouchers` | W8 | all | nav, footer | none |
| `/contact` | W9 | all | nav, footer, "private tours" CTA | none |
| `/faq` | W10 | all | nav, footer | none |
| `/about` | W11 | all | nav, footer | none |

---

## Part B — Fine-Grained Definitions

Written only where one of the three triggers applies: **deviation**, **high-stakes**, **novel**.

#### UXD-01 — Capacity hold timer
surfaces:      W5, W6, W7
trigger:       novel
overrides:     none — addition
serves:        REQ-BOOK-capacity, UJ "book a place before it's gone"
behaviour:     Selecting a departure on W5 places a soft hold on the chosen number of seats and
               starts a countdown (proposed 10:00). A persistent, non-dismissible banner shows
               time remaining and announces politely via live region at start, at 2:00, and at
               0:30. On reaching 0:00 the hold releases, the booking transitions to state
               `expired` (E3), and any pending payment attempt is blocked before charge.
               Completing payment on W7 converts hold → `confirmed` and cancels the timer.
               Editing party size on W6 re-checks availability and re-issues the hold without
               resetting elapsed time unless the new size exceeds the held count.
states:        holding · expiring-soon (≤2:00) · expired (→E3)
rationale:     No Part A convention covers a time-boxed reservation; it is safety-for-capacity
               and directly shapes NAV/SCR state preservation.
mockup-ref:    none yet (pre-gate)

#### UXD-02 — Payment submission & failure (W7 / E2)
surfaces:      W7, E2
trigger:       high-stakes
overrides:     none — tightens UXC-CMP-2, UXC-ERR-1, UXC-ERR-2
serves:        REQ-PAY-charge, REQ-PAY-confirm
behaviour:     given a valid hold (UXD-01) and complete guest details,
               when the guest submits payment,
               then the Pay button enters a non-re-triggerable in-progress state, the card form
               locks, and no second charge can be issued while pending.
               On success → redirect to R1 with booking ref; confirmation email dispatched.
               On decline/failure → remain on W7, show generic inline failure copy (UXC-ERR-2),
               preserve entered card fields where PCI permits (Stripe Elements state), keep the
               hold alive if time remains, and offer immediate retry. If the hold has expired
               mid-attempt, route to E3 rather than charging.
states:        idle · submitting · succeeded(→R1) · declined · hold-expired(→E3)
rationale:     Money-critical; the one surface a build session must test hardest. Double-charge
               and charge-after-expiry are the failure modes precision must exclude.
mockup-ref:    none yet (pre-gate)

#### UXD-03 — Booking cancellation confirm (48-hour policy)
surfaces:      (post-booking, guest-initiated via email link / manage-booking)
trigger:       high-stakes
overrides:     conforms to UXC-MOD-1 — recorded for precision
serves:        REQ-CANCEL, cancellation-policy
behaviour:     Cancelling shows a blocking modal stating the refund outcome computed from the
               48-hour rule: >48h before departure → full refund; ≤48h → non-refundable, stated
               plainly before confirm. Dismissed only by explicit "Keep booking" / "Cancel &
               refund". On confirm, the seat returns to availability (feeds W5) and a
               cancellation email is sent (UXC-FBK-1). No outside-click/Escape dismissal.
states:        confirm-refundable · confirm-non-refundable · processing · done
rationale:     Money-moving and governed by a policy the guest must see the consequence of
               before acting; conforms to UXC-MOD-1 but stakes warrant an explicit record.
mockup-ref:    none yet (pre-gate)

#### UXD-04 — Marketing motion vs. flow motion
surfaces:      W1, W2, W3 (permitted) vs. W4–W8 (restricted)
trigger:       deviation
overrides:     UXC-MOT-3
serves:        brand / conversion; UJ "premium first impression"
behaviour:     On content surfaces (W1–W3), decorative motion is permitted — staggered
               scroll-reveals, image clip-wipe + ken-burns, hero parallax, stat count-ups —
               subject to UXC-MOT-1 tokens, UXC-MOT-2 reduced-motion, and UXC-MOT-4 play-once.
               Within the booking flow (W4–W8) this permission is withdrawn: motion is
               feedback-only (step transitions, validation shake/appear, hold-timer pulse,
               progress). No decorative reveals compete with the transaction.
states:        n/a (behavioural boundary)
rationale:     UXC-MOT-3 sets motion as feedback-only globally; the marketing surfaces
               deliberately deviate for brand, so the deviation is scoped and named rather than
               silently contradicting the convention on W1.
mockup-ref:    London Bike Tours.dc.html (home)

#### UXD-05 — Live availability calendar & sold-out (W5 / E1)
surfaces:      W5, E1
trigger:       novel
overrides:     none — addition (extends UXC-STA-1, UXC-CMP-3)
serves:        REQ-AVAIL, "live calendar shows real-time availability"
behaviour:     W5 loads real-time availability (loading skeleton → ready). Each date/time cell
               is available, sold-out, or unavailable/past, conveyed by icon+label not colour
               alone (UXC-A11Y-3), keyboard-arrow navigable (UXC-A11Y-1). Selecting an available
               slot triggers UXD-01. Golden Hour City shows only summer departures; out-of-season
               dates render unavailable with a "summer only" note, not an error.
               When a whole view has no availability → E1 empty state: reassuring copy plus the
               nearest available dates as one-tap alternatives (UXC-ERR-1) — never a dead end.
states:        loading · ready · date-selected · sold-out(cell) · empty(→E1) · error
rationale:     Real-time availability with seasonal and per-tour rules is novel and central; its
               empty state (E1) is a first-class, recovery-bearing surface.
mockup-ref:    none yet (pre-gate)

#### UXD-06 — Private / large-group enquiry (W9)
surfaces:      W9
trigger:       deviation
overrides:     UXC-FBK-1 (channel), UXC-STA-2 (not a booking)
serves:        REQ-ENQUIRY, "groups of 10–20 → ask about private tours"
behaviour:     Groups exceeding the 10-seat open-tour cap are routed here rather than through
               W4–W7. Submitting sends an enquiry (no charge, no hold, no booking lifecycle) and
               shows inline success confirming a human will reply — it does not mint a booking
               ref and must not imply a confirmed departure (session rule: no scope-by-picture).
states:        idle · submitting · sent · error
rationale:     Deviates from the payment/confirmation feedback model because it commits nothing;
               naming it prevents the enquiry being mistaken for a booking.
mockup-ref:    none yet (pre-gate)

---

## Coverage ledger

| Mockup / wireframe | Surfaces | Sidecar updated | UXD records touched | Conventions confirmed sufficient? | Date |
|---|---|---|---|---|---|
| London Bike Tours.dc.html (home) | W1 | pending | UXD-04 | A1,A8,A11 confirmed; A6–A7,A9 n/a on this surface | 2026-07-22 |
| Booking flow | W4–W7, R1, E2, E3 | not yet | UXD-01, UXD-02, UXD-05 | pending — flow not yet mocked | — |
| Gift vouchers | W8 | not yet | (reuses UXD-02) | pending | — |
| Contact / enquiry | W9 | not yet | UXD-06 | pending | — |

> **Gate 6 status: NOT READY.** Only the home surface (W1) has a mockup; the booking flow,
> vouchers, and enquiry surfaces are specified here ahead of their wireframes. Each remaining
> row must gain a sidecar and a mockup before it passes. The UXD records above are pre-gate
> (`mockup-ref: none yet`) and are the behavioural brief those mockups must satisfy.

---

## Open questions (session rule R2 — do not design into existence)

1. **Capacity-hold duration** — 10:00 is a proposed default; needs a Decision Record (too short frustrates, too long starves availability). → UXD-01
2. **Manage-booking surface** — UXD-03 assumes a guest-facing cancel path (email link vs. account). No account system is scoped; confirm the entry point. → UXD-03
3. **Responsive breakpoints** — UXC-RSP-1 values need ratification as a DR.
4. **Voucher redemption flow** — W8 covers *purchase*; redeeming a voucher against a booking (W4–W7) is unspecified. Emit as scope question before mocking.
5. **Multi-language parity** — do FR/ES localise validation/error copy (UXC-FRM-2 verbatim source), or English-only at launch?

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-22T00:00:00Z | Initial LBT UXIS authored from T6f template v0.1. Part A conventions ratified/proposed across all 11 concern areas; navigation map and six Part B records (capacity hold, payment/failure, cancellation confirm, marketing-vs-flow motion boundary, live-availability calendar, private-group enquiry). Coverage ledger seeded with the existing home mockup; booking/voucher/enquiry surfaces specified pre-gate. Five open questions routed per R2. |
