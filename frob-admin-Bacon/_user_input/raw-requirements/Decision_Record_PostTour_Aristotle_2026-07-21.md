# Decision Record — post-tour (POST) — 2026-07-21

| | |
|---|---|
| **Status** | RATIFIED by William (sponsor), 2026-07-21 — until propagation completes, this record wins over any conflicting doc text |
| **Still open** | none — remaining decisions deferred wholesale with their journeys, not carried as open questions against built scope |
| **Sources** | `post-tour.md` v0.2 §3 (Decisions-needed) |

## Resolved

### DR-PT1 · Scope narrowed to 4 journeys, 5 deferred to a future phase *(the primary ratification event this session)*
The original 9-journey analysis (thank-you, review request, feedback, recovery contact, review monitoring, repeat-booking nudge, lapsed re-engagement, marketing campaigns, preferences/deletion) is narrowed to **4 journeys built now**: UJ-POST-01 (thank-you), UJ-POST-02 (review request), UJ-POST-03 (feedback with direct low-rating alert), UJ-POST-10 (preferences/unsubscribe). **5 journeys deferred to a future phase**, not dropped from the roadmap: UJ-POST-05 (formal recovery logging), UJ-POST-06 (public review monitoring/response), UJ-POST-07 (repeat-booking nudge), UJ-POST-08 (lapsed re-engagement), UJ-POST-09 (marketing campaigns). UJ-POST-04 (photos) stays deferred as already established (source doc's own v2-sketch designation).
**Rejected alternatives:** building the full 9-journey/12-REQ scope as originally specced.
**Impacts:** `post-tour.md` rewritten to v0.2 (12 REQs → 4, REQ-POST04–09/11/12 removed); `Journey_Index.md` updated (4 core rows, 5 new deferred rows); `Module_Map.md` updated (depends-on drops `pre-sales`, dependency diagram simplified, journey allocation and unowned-ground tables updated).

### DR-PT2 · Negative-feedback trigger simplified — rating threshold only *(closes D-POST-1)*
A ≤3★ overall rating in internal feedback alerts the Owner directly. No keyword detection, no sentiment analysis, no multi-signal weighting.
**Rejected alternatives:** the original multi-signal, weighted recommendation.
**Impacts:** REQ-POST03 already reflects this — no further text change needed.

### DR-PT3 · Thank-you email classification confirmed *(closes D-POST-9)*
Transactional, always sent, never gated by marketing consent.
**Rejected alternatives:** none — confirmed as originally recommended.
**Impacts:** none — REQ-POST01 already reflects this.

### DR-PT4 · GDPR retention — policy stated, process not built
`post-tour` states its retention policy as aligning with `core-consent-audit`'s already-ratified DR-7 (90 days, prospects, then anonymised) — no separate 24-month figure is introduced. Crucially, **no deletion-request or erasure mechanism is built in this module this pass** — the module states the policy as a fact rather than implementing management processes around it, per explicit sponsor instruction.
**Rejected alternatives:** adopting a separate 24-month retention figure for confirmed customers (the original source-doc proposal); building REQ-POST11 (deletion request capture) and REQ-POST12 (erasure execution) now.
**Impacts:** REQ-POST10's scope explicitly excludes a deletion mechanism. DR-7's non-prospect PII erasure gap (bookings/participants) **remains open and unowned** — `post-tour` was considered as its natural future owner but does not claim it this pass. `Module_Map.md`'s unowned-ground entry reverts to "still deferred," not "proposed resolution."

## Still open
None as live decisions against built scope. The decisions belonging to deferred journeys (D-POST-2 through D-POST-8, D-POST-10 — repeat-booking nudge model, lapsed threshold, review response policy, cross-tour promotion, newsletter cadence, review reminder, testimonial consent) are not carried as open questions here — they simply don't apply to anything ratified in this pass. They'll be re-opened when the deferred journeys are picked up in a future phase.

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-21T00:00:00Z | Initial POST Decision Record: scope narrowed from 9 to 4 journeys (DR-PT1), 2 decisions resolved inline (DR-PT2, DR-PT3), GDPR retention resolved as policy-stated-not-built (DR-PT4). DR-7's non-prospect erasure gap remains open and unowned. |
