# FOB — Wireframe & UI Mockup Handover Brief (All Modules)

| | |
|---|---|
| **Document** | Distilled mockup/wireframe handover — not a pipeline stage artifact (T0–T9); a derived paste-set for an external generative design tool |
| **Run/codename** | **Aristotle** (see `VERSIONING.md`) |
| **Version** | **0.2** — see Revision History at the foot of this document |
| **Covers** | All 51 surfaces across 7 analysed modules: Lean-6 core (AUTH, CNA, NOTIF, SEO, DATA, DS) + `booking`, `pre-sales`, `tour-operations`, `pre-tour`, `fleet-equipment`, `post-tour` |
| **Date** | 2026-07-21 (v0.2 correction same day) |
| **Sources** | `Surface_Journey_Coverage.md`, `Operational_Workflows.md`, `Data_Dictionary.md`, `core-design-system.md`, all seven module specs |
| **How to use** | Paste §1 (shared brief) once. Then paste one surface group at a time (§2–6), or one screen's brief at a time if the tool handles smaller batches better. |
| **Traceability note** | Whatever comes back gets checked against the REQ/UJ bindings in the source docs before being treated as the real Stage 6e wireframe sidecar — this package is an input to that check, not a replacement for it. |

---

## 1. Shared brief (paste once)

**Brand:** Forest palette (`--forest #5a9962` primary, `--charcoal #243320` text/dark), Syne for headings/display, DM Sans for body text, self-hosted variable fonts. Tokens are shared project-wide; **components are built per-app** (DR-11) — the customer webapp, back-office, and guide app each have their own component implementation on top of the same tokens.

**Devices:**
- **The public site** (W-prefixed **and** P-prefixed surfaces are the same site, not two separate properties): static HTML/CSS/JS pages (crawler-readable, no script required to read content — P1/P2 and most of W11–W15) with **Flutter Web widgets embedded as islands** for complex interactive functionality — booking/payment (W5–W10), consent capture (W4), attendee/detail forms (W6, W17), feedback (W21) — matching the already-built `admin-rome` pattern (DDD-architected Flutter islands compiled into static pages). Desktop + mobile browser, mobile-first. Simple content pages stay plain static HTML; anything stateful or transactional is a Flutter island.
- **Back-office** (A-prefixed surfaces): **PC/iMac only**, fixed wide-screen — multi-column tables and side-by-side panels are fine here, this is never a responsive/mobile concern.
- **Guide app** (G-prefixed surfaces): issued mobile/tablet device, extension of the existing GMT navigation PWA.
- **Messages** (E-prefixed): device-agnostic, render cleanly in email/SMS/WhatsApp as applicable.

**Global conventions:**
- Money in pounds (£45.00), never raw pence.
- Dates human-readable ("1 August 2026, 10:00"), not ISO, on any customer- or guide-facing surface.
- The Owner is "William" in copy, never "the Owner" or "admin."
- Marketing consent checkboxes are never pre-ticked, anywhere.
- Party size capped at 10 per departure — always show remaining capacity live.

**Canonical fixtures (reuse everywhere, don't invent new ones):**
- **Tom** — Customer, booking `BK-1001`, `tom@example.com`.
- **Marie** — Prospect, `PROSPECT-2001`, enquiry `ENQ-2001`.
- **Sarah** — Prospect, saved-tour `SAVE-2001`.
- **William** — Owner.
- **Emma** — Guide, device `DEV-EMMA-01`.
- **Hidden City** tour — `TOUR-HID`, £45, 90 min.
- **Departure** `DEP-HID-2026-08-01-1000` — 1 August 2026, 10:00, capacity 10.
- **Bike FOB-001**, **Helmet HEL-014**.
- **Feedback FB-1001** — Tom, 5★.

---

## 2. The public site — customer surfaces (W1–W21)

*Part of the same single site as §5 (P1–P2), not a separate app. Static HTML unless marked "Flutter island" below.*

### W1 — Booking access from signed link *(static)*
Purpose: let a customer open their booking without a password. States: verifying · expired link → "This link has expired — request a new one" · invalid → "This link isn't valid" · not found → "We couldn't find that booking." Shows: booking reference, tour name, date.

### W2 — Customer session sign-out *(static)*
Single action, idempotent — no error if already signed out.

### W3 — Marketing-preference / unsubscribe *(static; reused by `booking`'s CNA consent AND `post-tour`'s REQ-POST10)*
Purpose: granular preference control (newsletter / nudges / seasonal / all) + unsubscribe-all. Signed-link identified, no login. Error: expired/tampered link → "This link has expired — request a new one," rate-limited.

### W4 — Consent capture at enquiry/contact point *(Flutter island; owned by `pre-sales`, presumed surface)*
Marketing checkbox never pre-ticked. Error: no contact detail → "We need a contact detail to record your choice."

### W5 — Selection (tour/date/time/party-size) *(Flutter island — booking flow)*
Live capacity per slot ("10:00 — 4 spaces left"), date picker (90 days, sold-out greyed), running total. Errors: party exceeds capacity / no capacity left.

### W6 — Attendee details *(Flutter island — booking flow)*
One block per attendee (name, age band, notes), "same as lead booker" shortcut, one emergency contact per booking (not per attendee). In-progress entry survives interruption.

### W7 — Review, waiver, consent *(Flutter island — booking flow)*
Booking summary, inline scrollable waiver (not PDF), waiver + T&C checkboxes, unticked marketing checkbox. Error: waiver/T&C not accepted → Continue disabled. Note: this is the party-level digital waiver only — a separate individual paper-vs-digital on-day re-confirmation happens in the guide app (G6), not here.

### W8 — Payment (embedded) *(Flutter island — booking flow)*
Stripe Embedded Checkout — renders inline, no redirect, no popup. Card/Apple Pay/Google Pay. Error: declined → retry offered.

### W9 — Confirmation *(Flutter island — booking flow)*
Booking reference, tour/date/time, meeting point, total paid, add-to-calendar (both .ics attached to email AND a widget here — DR-T9), manage-booking link.

### W10 — Manage booking (modify date / cancel) *(Flutter island; also extended by `pre-tour` into the "tour hub")*
Lookup by ref+email. Modify: date-change only self-service (party-size/attendee changes → "Contact William"). Cancel: >48h auto full refund; within-48h shows "William will confirm your refund" (not a calculated amount — deliberate). Post-confirmation, this becomes the **tour hub**: status badges (Confirmed/Change pending/Weather watch/Cancelled), countdown to tour, "what to bring," meeting point + photo. Non-booker shared-link view redacts emergency contact.

### W11 — Tour catalogue (+ homepage/orientation) *(static)*
Empty state: no matches → reset + route to enquiry (W14).

### W12 — Tour detail *(static)*
Paused tour → status shown, no book action, enquiry route offered. Not found → similar-tours suggestion.

### W13 — Availability picker *(Flutter island)*
Party >10 → blocked, routed to W14. Date fully booked → next 3 alternatives suggested.

### W14 — Group/private/corporate enquiry *(Flutter island — form + consent)*
Explicit SLA on submit ("William will reply within one business day").

### W15 — Saved tours (drawer/strip + save-by-email) *(Flutter island — transactional + consent)*
Two checkboxes: transactional "send me this tour" (no consent needed) + opt-in nudge (never pre-ticked).

### W16 — Tour hub *(see W10 — same surface, post-confirmation mode)*

### W17 — Update attendee/special-requirements details *(Flutter island)*
Non-financial fields only. Safety-significant change (severe allergy, minor added) still saves but alerts William.

### W18 — Operator-change acknowledgement *(Flutter island — on the tour hub)*
Explicit old-vs-new comparison. No error state — booking proceeds regardless of acknowledgement.

### W19 — Cancellation remediation choice *(Flutter island)*
Three options: full refund / rebook / tour credit. No alternative date for rebook → credit auto-applied with apology.

### W20 — "Running late" notice *(static, within the tour hub)*
Only visible within the per-tour grace window. Fallback: William's business phone number shown if unreachable otherwise.

### W21 — Internal feedback capture *(Flutter island — on the tour hub)*
Ratings: overall/guide/value (1–5) + would-recommend (yes/maybe/no) + optional free text. A ≤3★ overall alerts William directly — no separate "recovery" tracking screen this pass.

---

## 3. Back-office / admin (A1–A16) — PC/iMac, wide-screen

### A1 — Operator sign-in · A2 — Operator sign-out
Standard credential sign-in; sign-out idempotent.

### A3 — Deliverability status
Bounced/complaint addresses. Empty: none yet.

### A4 — Owner alert inbox
Empty: no pending alerts. Channel unreachable → recorded here as fallback.

### A5 — Audit log viewer
Read-only. Incomplete entries (missing subject/actor) shown flagged, not hidden.

### A6 — Manual publish trigger + content-quality panel
Manual-only (no automatic publish). Second panel shows content-quality flags (incomplete tour content, unindexed pages).

### A7 — Booking creation (from enquiry, or provisional)
Two entry points, one form: enquiry-to-booking (agreed price, payment link) and provisional/pay-later (William sets hold duration/deposit/reminder cadence per booking, no defaults — genuinely per-instance). Wide-screen layout: enquiry/request details in a left panel, booking form in a right panel.

### A8 — Payment & refund management
Proper sign-in (reused operator session, not a separate admin key). Dense multi-column table: booking ref, customer, amount, status, refunded-so-far, action. Cumulative refund total shown (not just latest refund).

### A9 — Enquiry management
Owner alert via daily digest email (no WhatsApp — not built). Spam-flagged enquiries on a separate tab, no alert. Overdue enquiries stay visibly flagged, no auto-email to the prospect.

### A10 — Incident review & insurer dispatch
Insurer-dispatch mechanics are a stub — format not yet confirmed by William. Status: submitted → insurer_ack → reviewed → closed.

### A11 — Hazard log review & approval
Dedupes by street name; a duplicate bumps "last confirmed," doesn't create a new entry.

### A12 — Add bike
No photo capture. Duplicate identifier → blocked, next-sequential suggested.

### A13 — Add/replace equipment
Line-by-line entry, no bulk, no photo, with a description field per item. Helmet impact → immediate retirement regardless of review status.

### A14 — Fleet & equipment readiness view
Aggregated status counts + alerts (never buried).

### A15 — Flagged-bike maintenance (detail + event log + status update)
No photo, no external-repair logging (handled off-system). This is where a flagged bike gets cleared back to service — needs at least one logged maintenance event first.

### A16 — Compliance review & renewal
On-event alerts only (no recurring digest) — this view is the primary way to check current state between alerts.

---

## 4. Guide app (G1–G13) — issued mobile/tablet, extends the existing GMT navigation PWA

### G1 — Device-identity recognition
Implicit on every request, not a distinct screen.

### G2 — Tour-day home / playbook overview
Six-step status indicators; also shows a read-only bike-status snapshot (from Fleet & Equipment).

### G3 — Travel kit checklist
Typed-confirm sign-off (not full signature — routine check).

### G4 — Bike inspection grid
Full signature declaration. Every bike, every tour — no shortcut for same-day repeat fleets.

### G5 — Risk assessment + decisions log
Typed-confirm. Unresolved high-risk item blocks sign-off.

### G6 — Rider check-in card
Full signature for the on-day waiver re-confirmation (this is the "second layer" referenced at W7 — digital, not paper). Refusal cases (medical, intoxication, unaccompanied minor, waiver refused) → refused, flagged for William-processed refund (guide never handles money).

### G7 — Safety briefing script
Day-specific mitigations shown inline from G5.

### G8 — Pre-departure sign-off summary
Any outstanding flag blocks sign-off.

### G9 — Mid-tour event logger
Mechanical/illness/early-leave categories.

### G10 — Emergency/incident logger
No photo capture this pass.

### G11 — Post-ride review form
Draft-saved if not completed immediately; reminder before 24h deadline. No photo capture.

### G12 — Incident report form
Formal narrative, submitted to William.

### G13 — Hazard observation entry
No photo capture this pass.

---

## 5. The public site — marketing surfaces (P1–P2) — device-agnostic, no-script-required

*Part of the same single site as §2 (W1–W21), not a separate app. Plain static HTML.*

### P1 — Crawlable tour/marketing page
Incomplete content → still served, flagged in A6's content-quality panel.

### P2 — Crawlable index
Published-but-unindexed location → flagged in A6.

---

## 6. Messages (E1–E8) — device-agnostic

- **E1** — Transactional message (confirmation, reminder)
- **E2** — Marketing message (consent-gated)
- **E3** — Owner alert message
- **E4** — Save-tour transactional + nudge email (nudge gated by current consent, unsubscribe link prominent)
- **E5** — Pre-tour message (reminder — single T-1 only, weather advisory — informational-only for now, change/cancellation notice, no-show notice) — all bypass marketing consent
- **E6** — Compliance alert (on-event only, no recurring digest)
- **E7** — Thank-you message (transactional, always sent — not for no-shows or operator-cancellations)
- **E8** — Review-request message (TripAdvisor + Google + private-feedback option, equal visual weight — one-shot, no reminder)

---

## Known gaps to flag in any generated design (don't silently "fix" these)

- **W7/G6 split waiver:** two separate acceptance moments by design — don't merge them.
- **A6's within-48h refund** shows no calculated amount — that's deliberate (William decides case-by-case), not a missing feature.
- **G4:** no "same as this morning" shortcut for a second same-day tour — full re-inspection every time, by design.
- **A15/G4:** `retired` and `awaiting_external_service` bike states exist in the data model but have no screen/flow driving them yet — don't invent one.
- **UJ-TOUR-08** (day-of morning reminder) has no requirement behind it at all — a light-cadence policy choice removed it. Don't add a "day-of reminder" screen.
- **post-tour is intentionally minimal** — no in-system review-monitoring, no recovery-contact tracking, no repeat-booking/lapsed nudges, no marketing-campaign composer, no GDPR deletion screen. All deferred to a future phase — don't design these yet even if they seem like obvious gaps.

---

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-21T00:00:00Z | Initial all-modules handover: shared brief + 51 surfaces across 5 groups (customer webapp, back-office, guide app, public site, messages), distilled from all seven module specs and their Stage 6a–6c design docs. |
| 0.2 | 2026-07-21T00:00:00Z | Corrected an artificial split: customer webapp (§2, W1–W21) and public marketing site (§5, P1–P2) are the same site, not two properties — static HTML/CSS/JS with Flutter Web widgets embedded as islands for interactive surfaces, matching the built `admin-rome` pattern (F-09, `core-seo.md`). §1 Devices, §2/§5 headers, and every W-surface now carry a *(static)* / *(Flutter island)* tag so the design tool doesn't generate two disconnected properties. No REQ/UJ/surface content changed — this is a rendering-model correction only. Same correction cross-referenced in `Surface_Journey_Coverage.md` §1/§5. |
