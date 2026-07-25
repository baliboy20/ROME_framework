---
module: CNA
status: PROPOSED
actors: [Prospect, Customer, Owner, System]
depends-on: [core-data-access]
presumes: [Cloudflare Cron]
---

# core-consent-audit — Module Spec

| | |
|---|---|
| **Document** | core-consent-audit module spec (Stage 4) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — not Reliable until ratification. This module is the **merged** consent + audit capability (KI-2); the merge itself is D-CNA-1. |
| **Sources** | `DOMAIN-LEXICON.md` (`consents` DDL, states) · `data-model/Pre_Sales_Data_Model_v1_0.md` §1–2 · `Intake_Note.md` (F-06, F-07) · `architecture/FOB_Design_Reconciliation_v1_0.md` §2 · `ROME-GUIDE-001` |

## 1. Intent
Record every consent decision and every money-/safety-critical action **append-only and provable**, gate marketing on current consent, and erase dormant personal data on schedule. **Success:** the exact consent state at any past moment is provable, no marketing reaches a withheld/withdrawn person, and dormant personal data is anonymised within the statutory window.

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-06 | `consents` is append-only (never UPDATE); current state = latest row per `(prospect_id, consent_type)`; types are enumerated in the lexicon. | Data Model §2 |
| F-07 | Retention is 90 days then anonymise; the `gdpr-cleanup` cron exists; `prospects.deleted_at` blanks PII but retains the row. | Reconciliation §2; Data Model §1 |
| — | `consents` (Built) attributes and the consent/PII state tables are in the lexicon; `audit_log` is **New** (no DDL). | DOMAIN-LEXICON §3–5 |

## 3. Decisions needed
| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-CNA-1 | Merge shape (KI-2/SQ-02). | one append-only ledger \| keep `consents` + new `audit_log` | Keep `consents` as-is (Built) + add `audit_log`; one module, two tables. | **CLOSED — DR-5.** Option confirmed as recommended. |
| D-CNA-2 | `audit_log` schema (New). | design at Stage 6a | Defer to 6a; do not author DDL here (GUIDE Part 5). | **CLOSED — DR-6.** Deferred to Stage 6a. |
| D-CNA-3 | PII erasure for non-prospect entities (bookings/participants) — unowned. | in v1 \| defer | Defer; v1 covers `prospects` only. | **CLOSED — DR-7.** Deferred; interim default = retain (never auto-erase) until designed. |

## 4. Requirements

### REQ-CNA01 — Prospect submits a consent decision
intent:        submit consent-decision
actor:         Prospect
preconditions: a data-capture point requests a marketing or processing permission; the option is not pre-selected
conditions:    each decision is appended, never overwriting a prior one; current state is the latest decision per person and purpose
postconditions: a new immutable consent record exists with its capture source, evidence, and timestamp
outcomes:
  - Prospect sees their choice recorded and honoured
  - Owner can later prove the exact consent state at any past time
errors:
  - neither email nor phone identifies the prospect → decision not recorded; "We need a contact detail to record your choice"
  - capture source not supplied → decision not recorded; no marketing proceeds
invariants:    a consent record is never updated or deleted; a marketing permission is never pre-granted (default is withheld)
non-functional: Security — the capturing source and hashed evidence are stored with every decision
scope:         in: append-only capture of marketing/processing consent with evidence | out: cookie-banner layout, preference-centre design
open-questions: none — D-CNA-1 closed (DR-5)
example:
  given:  Marie (Prospect PROSPECT-2001) submits a group enquiry, marketing-email left unticked-by-default and ticked by her
  when:   Marie submits her consent decision
  then:   a row is appended — marketing_email, granted=1, source enquiry_form_v1, evidence + timestamp; prior rows untouched

### REQ-CNA02 — Customer cancels a marketing permission
intent:        cancel marketing-permission
actor:         Customer
preconditions: a prior granted marketing permission exists for the person and purpose
conditions:    withdrawal is recorded as a new appended decision; suppression takes effect by the next send cycle at latest
postconditions: current consent state for that purpose is withdrawn; future marketing is suppressed
outcomes:
  - Customer sees they will no longer receive that marketing
  - System suppresses that person from future marketing of that purpose
errors:
  - no prior permission on record → still append a withdrawal; treat as already-suppressed (no error shown)
invariants:    withdrawal is append-only; suppression is honoured on the next send cycle at latest
non-functional: Reliability — a withdrawal is effective for subsequent sends
scope:         in: one-step withdrawal/unsubscribe per purpose | out: partial or paused subscriptions
open-questions: none
example:
  given:  Tom (Customer) with marketing_email currently granted
  when:   Tom cancels the marketing-email permission
  then:   a withdrawal row is appended; current state = withdrawn; Tom receives no further marketing_email

### REQ-CNA03 — System submits an audit entry
intent:        submit audit-entry
actor:         System
preconditions: a money- or safety-critical action has occurred (refund, consent change, owner override, incident)
conditions:    audit entries are append-only and reference the subject and the acting identity
postconditions: an immutable audit entry records what happened, to what, by whom, and when
outcomes:
  - Owner can reconstruct the sequence of money- and safety-critical actions
errors:
  - subject or acting identity missing → entry still written with the available detail flagged incomplete (never dropped)
invariants:    an audit entry is never modified or deleted
non-functional: Security — audit entries are tamper-evident and retained independently of the audited record
scope:         in: append-only audit of refunds, consent changes, overrides, incidents | out: general application logging, analytics events
open-questions: D-CNA-2 carried to Stage 6a (DR-6 — schema design, not open as a decision)
example:
  given:  William (Owner) issues a refund on booking BK-1001
  when:   the System submits an audit entry for the refund
  then:   an immutable entry records booking BK-1001, refund amount, actor William, timestamp

### REQ-CNA04 — System deletes dormant personal-data
intent:        delete personal-data
actor:         System
preconditions: a person's record has been dormant beyond the 90-day retention window
conditions:    personal fields are irreversibly blanked while the row is retained for referential integrity
postconditions: the record holds no personal data; the erasure is itself audited
outcomes:
  - Owner can show that dormant personal data is erased on schedule
  - related records remain internally consistent after erasure
errors:
  - record shows recent activity (not truly dormant) → skip; leave personal data intact
invariants:    erasure is irreversible; the row is never removed, only its personal fields cleared; every erasure is audited
non-functional: Security — erasure runs on schedule without operator action
scope:         in: 90-day anonymisation of dormant prospect personal data | out: non-prospect entities, on-demand right-to-be-forgotten
open-questions: none — D-CNA-3 closed as deferred (DR-7); scope already prospects-only above
example:
  given:  Sarah (Prospect) with no activity for 91 days
  when:   the System deletes her personal-data
  then:   Sarah's personal fields are blanked, her row retained with deleted_at set, and the erasure audited

### REQ-CNA05 — System reads current consent state
intent:        read consent-state
actor:         System
preconditions: a marketing message is about to be sent to a person for a purpose
conditions:    current state is the latest decision for that person and purpose
postconditions: the send proceeds only if the current state is granted
outcomes:
  - System sends marketing only to people whose current permission is granted
  - Owner is assured no marketing goes to a withdrawn or never-granted person
errors:
  - no decision on record → treat as not granted; suppress the send
invariants:    marketing is never sent against a withheld or withdrawn current state
non-functional: Reliability — the check reflects the most recent decision
scope:         in: pre-send consent gate by person + purpose | out: frequency capping, content selection
open-questions: none
example:
  given:  Marie (Prospect) with current marketing_email=granted, and Sarah with marketing_email=withheld
  when:   the System reads consent state before a campaign send
  then:   Marie is eligible; Sarah is suppressed

## 5. Journeys
| UJ id | Journey | Requirements (thread) |
|---|---|---|
| UJ-CNA-01 | Record marketing permission | REQ-CNA01 |
| UJ-CNA-02 | Withdraw permission | REQ-CNA02 |
| UJ-CNA-03 | Audit money/safety action | REQ-CNA03 |
| UJ-CNA-04 | Erase dormant PII (90d) | REQ-CNA04 |
| UJ-CNA-05 | Check permission before contact | REQ-CNA05 *(consulted by NOTIF · REQ-NOTIF-marketing path)* |
