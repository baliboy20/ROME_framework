---
module: NOTIF
status: PROPOSED
actors: [Customer, Owner, System]
depends-on: [core-data-access, core-consent-audit]
presumes: [Postmark, Twilio, Cloudflare Cron]
---

# core-notifications — Module Spec

| | |
|---|---|
| **Document** | core-notifications module spec (Stage 4) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — not Reliable until ratification. |
| **Sources** | `DOMAIN-LEXICON.md` · `Module_Map.md` (NOTIF→CNA edge) · `Intake_Note.md` (F-05, F-08, F-11) · `architecture/FOB_Design_Reconciliation_v1_0.md` §3 · `ROME-GUIDE-001` |

## 1. Intent
Deliver every required message **once**, on the right channel, and track deliverability — without ever sending marketing against a withheld consent. **Success:** a customer receives exactly one message per event despite retries; transactional messages are never blocked by marketing consent; marketing is never sent to a withdrawn recipient.

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-05 | Email is Postmark (site) + Resend (PoCs); no MailChannels; SPF/DKIM/DMARC delegated to the provider. | Tech Context §A |
| F-08 | An idempotency pattern is already in use (Stripe PoC `webhook_events`). | Tech Context §E |
| F-11 | Cron triggers `send-reminders` (08:00), `send-review-requests` (09:00), `gdpr-cleanup` (03:00) exist. | Tech Context §H |
| — | Transactional vs marketing message, deliverability state, and idempotency key are defined in the lexicon. | DOMAIN-LEXICON §1 |

## 3. Decisions needed
| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-NOTIF-1 | Knock orchestration vs direct Twilio (R-D1/SQ-01). | Knock→Twilio \| direct Twilio | Direct Twilio at v1 (lean); revisit if template fan-out grows. | **STILL OPEN (`Decision_Record_Aristotle_2026-07-20.md`).** Interim default: native integration validated by a PoC, no orchestration-layer dependency locked in. Revisit at Stage 6d. |
| D-NOTIF-2 | Email consolidation + SPF/DKIM/DMARC ownership (SQ-06). | Postmark canonical \| converge now | Postmark canonical at v1; Resend PoC-only. | **STILL OPEN (`Decision_Record_Aristotle_2026-07-20.md`).** Final direction: a home-rolled solution to be designed (neither Postmark nor Resend as the permanent answer). Interim default: live site keeps using Postmark meanwhile; Resend stays PoC-only. Revisit at Stage 6a/6d. |
| D-NOTIF-3 | Idempotency-key store (SQ-07). | D1 \| KV | Reuse the D1 `webhook_events` pattern. | **CLOSED — DR-8** (= D-DATA-2). D1, `webhook_events` pattern. |

## 4. Requirements

### REQ-NOTIF01 — System submits a transactional message
intent:        submit transactional-message
actor:         System
preconditions: a transactional trigger has fired (booking confirmed, reminder due) for a person with a contact address
conditions:    each trigger produces one message per person per event, carrying an idempotency key
postconditions: the message is handed to the delivery provider once and logged with its idempotency key
outcomes:
  - Customer receives the confirmation or reminder for their booking
  - Owner can see the message was sent
errors:
  - no contact address on record → message not sent; the gap is logged for the Owner
  - provider rejects the send → send marked failed and retried per provider policy; shown as "delivery pending", not "sent"
invariants:    a transactional message is not gated by marketing consent; one event yields at most one message per person
non-functional: Reliability — a transient provider failure does not duplicate a message
scope:         in: one-shot transactional email (and SMS/WhatsApp where opted in) | out: batching, marketing campaigns
open-questions: D-NOTIF-1 (OPEN — interim default: native integration, PoC-validated, no vendor lock); D-NOTIF-2 (OPEN — interim default: Postmark stays canonical meanwhile)
example:
  given:  Tom (Customer) with confirmed booking BK-1001 and email tom@example.com
  when:   the System submits the confirmation message
  then:   message MSG-1001 is sent once via Postmark and logged with its idempotency key

### REQ-NOTIF02 — System updates deliverability state
intent:        update deliverability-state
actor:         System
preconditions: the delivery provider reports an outcome (delivered, bounced, complaint) for a prior message
conditions:    the outcome is matched to the message by its provider reference
postconditions: the person's deliverability state reflects the latest provider outcome
outcomes:
  - Owner sees which addresses are bouncing or complaining
  - System avoids sending to an address known to hard-bounce
errors:
  - outcome references an unknown message → record the event and flag it unmatched (never dropped)
invariants:    deliverability state reflects the most recent provider outcome for an address
non-functional: Reliability — provider callbacks are processed idempotently
scope:         in: delivery/bounce/complaint ingestion and suppression | out: provider-side reputation management
open-questions: none
example:
  given:  message MSG-1001 previously sent to tom@example.com
  when:   the provider reports it delivered and the System updates deliverability state
  then:   tom@example.com is marked deliverable; a later hard-bounce would mark it undeliverable

### REQ-NOTIF03 — System rejects a duplicate send
intent:        reject duplicate-send
actor:         System
preconditions: a send is attempted carrying an idempotency key that has already been processed
conditions:    a key is honoured once; a repeat within the retention window is a duplicate
postconditions: the duplicate is not delivered; the original send stands
outcomes:
  - Customer receives exactly one message for one event despite retries
errors:
  - idempotency-key store unavailable → hold the send rather than risk a duplicate; shown as "delivery pending"
invariants:    at most one delivery per idempotency key
non-functional: Reliability — retried jobs and repeated provider callbacks never double-send
scope:         in: idempotent send suppression | out: exactly-once across multiple providers, cross-region dedup
open-questions: none — D-NOTIF-3 closed (DR-8)
example:
  given:  the confirmation for BK-1001 already sent under idempotency key k-1001
  when:   a retried job attempts the same send under k-1001
  then:   the second attempt is rejected; Tom still has exactly one confirmation

### REQ-NOTIF04 — System submits an owner alert
intent:        submit owner-alert
actor:         System
preconditions: an event needing the Owner's attention has occurred (new enquiry, handoff, incident)
conditions:    the alert goes to the Owner's configured channel; alerts are not subject to marketing consent
postconditions: the Owner has been notified once of the actionable event
outcomes:
  - Owner is alerted to an event that needs a response
errors:
  - Owner channel unreachable → retry; if still failing, record the alert for in-app pickup
invariants:    an owner alert is transactional, never gated by marketing consent
non-functional: Reliability — an actionable event is not silently lost
scope:         in: transactional owner alerts for actionable events | out: digest scheduling, escalation policies
open-questions: D-NOTIF-1 (OPEN — interim default: native integration, PoC-validated, no vendor lock)
example:
  given:  a new group enquiry from Marie (Prospect) needing William's response
  when:   the System submits an owner alert
  then:   William is alerted once on his configured channel

## 5. Journeys
| UJ id | Journey | Requirements (thread) |
|---|---|---|
| UJ-NOTIF-01 | Transactional send | REQ-NOTIF01 · *(reads REQ-CNA05 only on the marketing path)* |
| UJ-NOTIF-02 | Delivery outcome → contactability | REQ-NOTIF02 |
| UJ-NOTIF-03 | Suppress duplicate send | REQ-NOTIF03 |
| UJ-NOTIF-04 | Owner actionable alert | REQ-NOTIF04 |
