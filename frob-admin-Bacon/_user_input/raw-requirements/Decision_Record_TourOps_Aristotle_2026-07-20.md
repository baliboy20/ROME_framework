# Decision Record — tour-operations (OPS) — 2026-07-20

| | |
|---|---|
| **Status** | RATIFIED by William (sponsor), 2026-07-20 — until propagation completes, this record wins over any conflicting doc text |
| **Still open** | D-OPS-5 (deferred, stubbed), D-OPS-7 (parked), D-OPS-8 (parked) |
| **Sources** | `tour-operations.md` §3 (Decisions-needed) |

## Resolved

### DR-O1 · Signature capture mechanism *(closes D-OPS-1)*
Split: full signature (stylus/finger) for rider waivers and guide declarations; simple typed "I confirm" + timestamp for routine sign-offs (kit check, risk assessment).
**Rejected alternatives:** full signature capture for every sign-off (rejected — unnecessary friction for routine checks).
**Impacts:** REQ-OPS02/04's sign-off mechanism is typed-confirm; REQ-OPS03's bike-inspection declaration and REQ-OPS05/06's waiver re-confirmation/briefing confirmation use full signature. No REQ text change needed — this is a design-level (Stage 6) mechanism choice, not a requirement-level one; note for Stage 6d.

### DR-O2 · Per-bike inspection — full repeat, every tour, no shortcut *(closes D-OPS-2)*
Every bike is fully re-inspected before every tour, even same-day repeats on a shared fleet. No "confirm all OK from prior tour" shortcut.
**Rejected alternatives:** the shortcut-with-declaration option (the original recommendation, rejected in favour of full repeat only); delta check; skip-if-same-day.
**Impacts:** REQ-OPS03 already specifies per-bike, per-tour inspection — no text change needed; this closes the question in the strictest direction, so no shortcut should ever be designed in at Stage 6.

### DR-O3 · Bike-service-flag propagation — status workflow *(closes D-OPS-3)*
A small status workflow: in-service / flagged / out-of-service. A flagged bike cannot be assigned to a tour until the Owner clears it.
**Rejected alternatives:** manual owner tracking with no system enforcement.
**Impacts:** REQ-OPS03's `bikes` state table (already in `DOMAIN-LEXICON.md`) is confirmed as the enforced model; Stage 6a should design the `bikes.status` field and the assignment-blocking check explicitly.

### DR-O4 · Refusal-to-ride refund handling — guide flags, Owner processes *(closes D-OPS-4)*
When a guide refuses a rider at check-in, the guide flags it; the Owner processes any refund via `booking`'s existing admin surface (A8). Guides never trigger refunds directly.
**Rejected alternatives:** guide-triggered automatic refund (rejected — keeps guides out of handling money).
**Impacts:** REQ-OPS05's refusal error paths already describe "flagged for Owner-processed refund" — no REQ text change needed; Stage 6c workflow should show the flag landing on `booking`'s A8.

### DR-O5 · Photo capture — out of scope *(closes D-OPS-6)*
No photo capture in incidents or the hazard log this pass.
**Rejected alternatives:** in-scope-now-with-deferred-UX (the original recommendation, rejected).
**Impacts:** REQ-OPS10 (post-ride review) and REQ-OPS13 (hazard observation) both need their "optional photo" mentions removed at propagation — this is a real REQ text change, not just a status close.

## Still open

### D-OPS-5 · PLI insurer incident-report format — deferred, stubbed
No insurer format exists yet. **Interim default:** REQ-OPS11's conservative, generously-scoped field set stands as the internal record; REQ-OPS12's actual insurer-dispatch mechanics are a placeholder/stub until William supplies the real format. **Direction of safety:** over-capture rather than under-capture — safety/legal incident data can't be reconstructed after the fact, so the risky direction would be a narrow stub that's missing fields once the real format arrives.

### D-OPS-7 · Minor party-composition limit — parked, not applied to `booking`
Not added to `booking.md` REQ-BOOK02 now. **Interim default:** no system-level block at booking time; the existing operational safety net (REQ-OPS04's risk assessment, REQ-OPS05's check-in) already reviews minor/adult pairing before a tour departs, so this isn't an unguarded gap — just an unenforced one at the booking stage. **Direction of safety:** the pre-existing OPS-side check stands in as the safety net; nothing is removed, only left unenforced one stage earlier than it could be.

### D-OPS-8 · Formal Health Declaration section — parked, not applied to `booking`
Same treatment as D-OPS-7 — not added to `booking.md` now, parked for later reconsideration.

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial OPS Decision Record: 5 decisions resolved (DR-O1–O5), 3 carried open (D-OPS-5 deferred/stubbed, D-OPS-7 and D-OPS-8 parked against `booking`). |
