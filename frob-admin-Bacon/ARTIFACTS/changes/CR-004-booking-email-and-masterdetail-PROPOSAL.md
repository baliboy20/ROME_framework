# CR-004 (PROPOSAL) — Bookings master/detail à la Emails + send-email-from-booking

| | |
|---|---|
| **ID** | CR-004 |
| **Type** | UI_CHANGE + BEHAVIOUR_CHANGE |
| **Status** | RATIFIED (CHG-012, build authorized) |
| **Requested by** | sponsor |
| **Date** | 2026-07-28 |
| **Scope** | (A) Rework the A19 Bookings screen's master/detail layout and navigation to follow the Emails console (A5d) pattern. (B) From a booking, send an email to the booking lead's address, choosing a template and adding a message. |

Plain-English proposal. Decisions for the sponsor are marked **[DECIDE]**.

## 1. Where we are
- **Bookings (A19)** is a searchable list; selecting a row opens the read-only record, editing routes to A23. The layout/navigation idiom differs from the Emails console, which the sponsor prefers.
- **Emails (A5d)** shows a sortable table with in-place detail popovers/panel — select a row, see the record beside/over the list without leaving it.
- Today there is **no way to email a booking's lead from the booking**: emails go out only via automatic triggers (confirmation etc.) or a template test-send to the owner.

## 2. What changes

### A. Bookings layout follows the Emails pattern (UI only)
- A19 becomes the same master/detail idiom as A5d: the list stays on screen; selecting a booking opens its detail in the adjacent panel (not a separate page), with the same sort/scan affordances the Emails table has.
- The read-only record content is unchanged; "Edit" still routes to A23.

### B. "Email the lead" from a booking (new behaviour)
- The booking detail gains a **Send email** action:
  1. Pick a **template** (from the active templates catalogue; both text-only and HTML templates offered).
  2. Merge fields prefill from THIS booking (name, tour, date, amount…) — the same per-use_case catalogue the templates already declare.
  3. Add an optional **personal message** — inserted into a dedicated merge slot so it renders inside the house shell for HTML templates and as a paragraph in text. **[DECIDE-2]**
  4. Preview, then send to the **lead's address on the booking** (editable before sending, e.g. to correct a typo).
- The sent message is recorded like every other email (appears in A5d/archive, linked to the booking) and is sent via the normal transport (Resend), never idempotency-suppressed.

## 3. Decisions needed **[DECIDE]**
- **[DECIDE-1] Which templates are offered?** All active templates · only templates whose use_case declares booking merge fields (recommended — others would render blank fields) · a new dedicated "ad-hoc" use_case.
- **[DECIDE-2] Personal message mechanics:** a `{{ personal_message }}` merge slot templates may include (recommended; templates without it simply don't show the box) · always appended as a closing paragraph.
- **[DECIDE-3] Free-form option:** also allow a no-template "plain email" compose from the booking, or template-only to start (recommended: template-only, keeps everything on-brand).

## 4. Impact (for the executable CR once approved)
- **Requirement:** amends the booking-management/notification scope (likely REQ-NOTIF10/NOTIF11 + the A19 requirement) — manual, booking-scoped templated send. → **CT-3** (requirement change; design impacted).
- **Design:** A19 screen spec reworked to the A5d idiom; new send-email flow spec; merge-slot note in the template model if DECIDE-2 = merge slot.
- **Worker:** one new endpoint (send templated email for booking X with overrides) reusing renderTemplate + send(); message row linked to the booking.
- **Admin:** A19 master/detail rework; send-email dialog (template picker, prefilteed merge data, message box, preview, recipient field).
- **Risk:** LOW/MEDIUM — reuses the delivered CR-002/CHG-008 rendering + transport machinery end to end.

Once the decisions are set, Roma queues the change (CT-3: P1 → P3 → P5), and Sarah gates it.

## Decisions (ratified by sponsor, 2026-07-28)
- **[DECIDE-1] Templates offered:** booking-aware only (use_case declares booking merge fields).
- **[DECIDE-2] Personal message:** `{{ personal_message }}` merge slot; templates without it show no message box.
- **[DECIDE-3] Free-form:** template-only to start.
