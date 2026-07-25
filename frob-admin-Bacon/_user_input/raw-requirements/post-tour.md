---
module: POST   status: PROPOSED   actors: [Customer, Owner, System]
depends-on: [core-data-access, core-consent-audit, core-notifications, tour-operations, booking]
presumes: [TripAdvisor, Google Reviews]
---

# post-tour — Module Spec

| | |
|---|---|
| **Document** | post-tour module spec (Stage 4) |
| **Version** | 0.2 (tight scope) |
| **Date** | 2026-07-21T00:00:00Z |
| **Status** | PROPOSED — not Reliable until ratification (`/and-ratify`). **Deliberately narrow scope** (sponsor decision, 2026-07-21): 4 of 9 originally-analysed journeys are built now; the rest are deferred to a future phase, not this pass. |
| **Sources** | `Intake_Note.md` §12 · `DOMAIN-LEXICON.md` (Internal feedback term, KI-16) · `Journey_Index.md` (UJ-POST-*) · `Post_Tour_Retention_User_Journeys_v1_0.md` · `core-consent-audit.md`, `core-notifications.md`, `tour-operations.md`, `booking.md` (depended-on modules) |

## 1. Intent
Close the loop that `tour-operations`' post-ride review opens: thank the customer, offer a review or private-feedback path, and let them manage their preferences — nothing more, this pass. **Success:** every completed tour with a review request gets a thank-you and a review opportunity; a low internal rating reaches the Owner directly; preferences stay granular and one-click to change.

**Scope note (2026-07-21):** the original analysis covered 9 journeys (thank-you, review request, feedback, recovery contact, review monitoring, repeat-booking nudge, lapsed re-engagement, marketing campaigns, preferences/deletion). Sponsor decision narrowed this module to 4 — UJ-POST-01, 02, 03, 10. The remaining 5 are **deferred to a future phase**, not dropped from the business's actual roadmap — see §5.

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-45 | SendGrid citations are stale — Postmark canonical (KI-3). | `Intake_Note.md` §12.2 |
| F-46/F-51 | **GDPR retention policy (stated as fact, not built as a process this pass):** personal data retention aligns with `core-consent-audit`'s already-ratified DR-7 — 90 days of dormancy for prospects, then anonymised. No separate 24-month rule, no deletion-request mechanism authored in this module. Non-prospect (booking/participant) erasure remains DR-7's declared, deferred gap — unchanged by this pass. | Sponsor decision 2026-07-21; `Decision_Record_Aristotle_2026-07-20.md` DR-7 |
| F-48 | Consent writes (preference changes, unsubscribe) route via `core-consent-audit` REQ-CNA01 — this module does not own a `consents` table. | `core-consent-audit.md` REQ-CNA01 |
| F-50 | This module's trigger is `tour-operations`' REQ-OPS10 with its "review request" action ticked. | `tour-operations.md` REQ-OPS10 |

## 3. Decisions needed
| ID | Question | Options | Recommendation |
|---|---|---|---|
| D-POST-1 | Negative-feedback trigger (simplified). | rating threshold only (≤3★) \| multi-signal (dropped this pass) | Rating threshold only — a ≤3★ overall rating alerts the Owner directly. No keyword detection, no sentiment analysis. |
| D-POST-9 | Thank-you email classification. | transactional, always sent \| fully marketing (consent-gated) | Transactional, always sent — it's part of the operational post-tour cycle, not marketing. |

*All other decisions from the original 9-journey analysis (D-POST-2–8, D-POST-10) apply only to the deferred journeys and are not ratified this pass — see §5.*

## 4. Requirements

### REQ-POST01 — System submits a thank-you message
intent:        submit thankyou-message
actor:         System
preconditions: a booking is marked `completed`; `tour-operations`' post-ride review ticked "review request"; the booking was not a no-show or operator cancellation
conditions:    sent at a configurable delay after completion (default T+12h); includes a review link and a private-feedback link; transactional, sent regardless of marketing consent (D-POST-9)
postconditions: the thank-you message is sent and recorded
outcomes:
  - Customer is acknowledged and offered a next step
errors:
  - the booking was a no-show → no thank-you sent, no-show comms apply instead
  - the booking was operator-cancelled → no thank-you sent, the refund/credit confirmation already covers it
invariants:    the thank-you always sends for a genuinely completed, reviewed booking; never gated by marketing consent (D-POST-9)
non-functional: Reliability — sent exactly once per completed booking
scope:         in: thank-you message + review/feedback links | out: the review submission itself (REQ-POST02), feedback capture (REQ-POST03)
open-questions: none — D-POST-9 closed inline (transactional, confirmed)
example:
  given:  Tom's Hidden City booking marked `completed`, review request ticked in the post-ride review
  when:   the System sends the thank-you at T+12h
  then:   Tom receives the message with a review link and a private-feedback link

### REQ-POST02 — System submits a review request
intent:        submit review-request
actor:         System
preconditions: a booking is `completed`; the thank-you (REQ-POST01) has been sent
conditions:    sent at T+24h with links to both TripAdvisor and Google, with a privately-routed feedback option shown with equal visual weight; one-and-done, no reminder
postconditions: the request is sent
outcomes:
  - Customer leaves a public review or is routed to private feedback
errors:
  - none declared — every customer response (public review, private route, no action) is a valid outcome
invariants:    the private-feedback option is never visually subordinate to the public review links
non-functional: Reliability — the request is sent exactly once at T+24h regardless of retries
scope:         in: review-request message, sent once | out: a follow-up reminder (deferred — see §5), the review itself (happens off-FOB-site), feedback capture (REQ-POST03)
open-questions: none
example:
  given:  Tom's completed booking, thank-you already sent
  when:   the System sends the review request at T+24h
  then:   Tom sees TripAdvisor, Google, and "tell us privately" links with equal visual weight

### REQ-POST03 — Customer submits internal feedback
intent:        submit feedback
actor:         Customer
preconditions: a completed booking exists and is accessible (booking ref + email, or a link from REQ-POST01/02)
conditions:    ratings captured (overall, guide, value, would-recommend); optional free text; a ≤3★ overall rating alerts the Owner directly (D-POST-1)
postconditions: the feedback is stored; the Owner is alerted if the rating is ≤3★
outcomes:
  - Customer sees a confirmation of their feedback
  - Owner is alerted immediately for a low rating, with full context, to follow up personally (off-system — no in-system recovery-tracking this pass)
errors:
  - none declared — every rating and any accompanying text is accepted as submitted
invariants:    a ≤3★ rating always alerts the Owner; the alert is never delayed or batched
non-functional: Reliability — the rating threshold check never silently misses a ≤3★ submission
scope:         in: rating + free text capture, Owner alert on low rating | out: formal recovery-contact logging, public review monitoring, testimonial consent handling (all deferred — see §5)
open-questions: none — D-POST-1 closed inline (rating threshold only)
example:
  given:  Tom's completed Hidden City booking
  when:   Tom submits feedback rating overall 2
  then:   the feedback is stored; William is alerted directly with the booking/tour context

### REQ-POST10 — Customer updates marketing preferences
intent:        update marketing-preferences
actor:         Customer
preconditions: a signed preferences link is presented (from any retention message)
conditions:    granular controls; changes take effect immediately for future sends
postconditions: marketing preferences are updated; a consent record is appended via `core-consent-audit` REQ-CNA01
outcomes:
  - Customer sees their updated preferences confirmed
  - future sends respect the new preferences immediately
errors:
  - the signed link is expired or tampered → "This link has expired — request a new one," rate-limited
invariants:    transactional messages (booking confirmations, refunds, weather advisories, this module's thank-you) are never affected by a marketing-only unsubscribe
non-functional: Security — the preference link identifies the customer without requiring login
scope:         in: granular preference management + unsubscribe-all | out: a data-deletion request/erasure mechanism (deliberately not built this pass — F-46/F-51)
open-questions: none
example:
  given:  Tom opens "manage preferences" from a retention email
  when:   Tom unsubscribes from all marketing
  then:   a consent record is appended; Tom receives no further marketing, but transactional messages (like REQ-POST01's thank-you) are unaffected

## 5. Journeys
| UJ id | Journey | Requirements (thread) |
|---|---|---|
| UJ-POST-01 | Receive thank-you and tour summary | REQ-POST01 |
| UJ-POST-02 | Submit a public review | REQ-POST02 |
| UJ-POST-03 | Submit internal feedback | REQ-POST03 |
| UJ-POST-10 | Manage marketing preferences / unsubscribe | REQ-POST10 |
| *(deferred to a future phase)* | UJ-POST-04 (photos), UJ-POST-05 (formal recovery logging), UJ-POST-06 (public review monitoring/response), UJ-POST-07 (repeat-booking nudge), UJ-POST-08 (lapsed re-engagement), UJ-POST-09 (marketing campaigns) | **not authored this pass — sponsor decision 2026-07-21** |

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-21T00:00:00Z | Initial module spec: 12 REQs across 9 core journeys. |
| 0.2 | 2026-07-21T00:00:00Z | **Scope narrowed by sponsor decision** to 4 REQs across 4 journeys (UJ-POST-01, 02, 03, 10). Removed REQ-POST04–09, 11, 12. GDPR retention (D-POST-6/KI-16) resolved as "state the policy, don't build the process" — aligns with DR-7's 90-day rule, no separate figure, no deletion-request mechanism. D-POST-1 simplified to rating-threshold-only. 5 journeys (UJ-POST-05–09) and photos (UJ-POST-04) deferred to a future phase — not dropped from the roadmap, just not this pass. |
