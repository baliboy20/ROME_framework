---
module: FLEET   status: PROPOSED   actors: [Owner, System, Guide]
depends-on: [core-data-access, core-auth, core-notifications]
presumes: [Cloudflare R2]
---

# fleet-equipment — Module Spec

| | |
|---|---|
| **Document** | fleet-equipment module spec (Stage 4) |
| **Version** | 0.1 |
| **Date** | 2026-07-21T00:00:00Z |
| **Status** | PROPOSED — not Reliable until ratification (`/and-ratify`). |
| **Sources** | `Intake_Note.md` §11 · `DOMAIN-LEXICON.md` (Asset/Maintenance event/Compliance item terms, `bikes`/`equipment`/`compliance_items` states) · `Journey_Index.md` (UJ-FLEET-*) · `Fleet_And_Equipment_User_Journeys_v1_0.md` · `core-auth.md`, `core-notifications.md` (depended-on modules) · `tour-operations.md` (consuming module, corrected 2026-07-21) |

## 1. Intent
Track every physical asset FOB uses to deliver tours — bikes and safety equipment — from acquisition through maintenance, compliance tracking, and retirement, with a permanent history and a real destination for service flags raised elsewhere. **Success:** a flagged bike always reaches repair and return to service (or retirement); no compliance item silently lapses; the Owner has one daily view sufficient to judge tomorrow's operational readiness.

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-41 | SendGrid/Twilio citations in the source doc are stale/open — Postmark canonical (KI-3); channel choice tied to D-NOTIF-1. | `Intake_Note.md` §11.2 |
| F-42 | **Ownership correction:** this module owns `bikes` (status, condition, maintenance history) — `tour-operations` calls into this module's flagging capability rather than owning bike status itself. | Sponsor decision, 2026-07-21 |
| F-43 | MVP scope: owned (not leased) bikes; in-house maintenance by the Owner; fleet ~10–15 bikes; single-operator UX. | `Intake_Note.md` §11.2 |
| F-44 | Photo capture is in-scope here (source doc D5) — a separate decision from `tour-operations`' DR-O5, which excluded photos specifically for incidents/hazards. | `Intake_Note.md` §11.2 |
| — | `bikes`, `equipment`, `maintenance_events`, `compliance_items` are New entities — no attribute table authored here; designed at Stage 6a. | `DOMAIN-LEXICON.md` §3 |
| — | Owner access reuses `core-auth` REQ-AUTH01 (operator session) — this module does not re-specify authentication. | `core-auth.md` REQ-AUTH01 |
| — | Compliance alerts and flagged-bike notifications route via `core-notifications` REQ-NOTIF04. | `core-notifications.md` REQ-NOTIF04 |

## 3. Decisions needed
All ten resolved — see `Decision_Record_Fleet_Aristotle_2026-07-21.md` (DR-F1–F10). Six rulings depart from the original recommendations, most substantially DR-F8 (removes the retire/restore workflow entirely).

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-FLEET-1 | Maintenance scheduling trigger (SQ-37). | time-based \| mileage-based \| both \| purely reactive | purely reactive | **CLOSED — DR-F1.** Both time and mileage, plus reactive. New REQ needed (not yet authored). |
| D-FLEET-2 | Helmet replacement policy (SQ-38). | 3yr \| 5yr \| impact-only | 5yr-or-impact | **CLOSED — DR-F2.** No fixed age policy; annual check reminder instead. |
| D-FLEET-3 | Bike status state machine (SQ-39). | proposed 6-state \| simplified | confirm proposed | **CLOSED — DR-F3.** Confirmed (see DR-F8 for a scope note on the `retired` state). |
| D-FLEET-4 | Compliance tracking scope (SQ-40). | core only \| wider | core only | **CLOSED — DR-F4.** Core set only. |
| D-FLEET-5 | Photo capture policy (SQ-41). | throughout \| selective | throughout | **CLOSED — DR-F5.** Not needed — no photo capture anywhere. |
| D-FLEET-6 | Pre-tour-day fleet certification gate (SQ-42). | combined gate \| individual checks | combined gate | **CLOSED — DR-F6.** Yes, combined gate. New REQ needed (not yet authored). |
| D-FLEET-7 | Compliance alert digest cadence (SQ-43). | daily \| weekly \| on-event | daily + immediate critical | **CLOSED — DR-F7.** On-event-only, no recurring digest. |
| D-FLEET-8 | Soft-retire grace period (SQ-44). | fixed days \| indefinite | 30 days | **CLOSED — DR-F8.** Retire/restore workflow dropped entirely — see REQ-FLEET09/10 removal below. |
| D-FLEET-9 | External service provider logging (SQ-45). | invoice upload \| separate workflow | invoice upload | **CLOSED — DR-F9.** Off-system, not modelled at all. |
| D-FLEET-10 | Bulk equipment onboarding (SQ-46). | bulk with shared defaults \| manual one-by-one | bulk with shared defaults | **CLOSED — DR-F10.** Line-by-line, no bulk, no photo. |

## 4. Requirements

### REQ-FLEET01 — Owner creates a bike record
intent:        create bike-record
actor:         Owner
preconditions: a bike has been physically acquired
conditions:    the identifier is unique; route eligibility (which tours can use this bike) is recorded; no photo capture (DR-F5)
postconditions: a bike record exists with status `in-service`, immediately available for tour assignment
outcomes:
  - Owner sees the new bike in the fleet view, eligible for tours
errors:
  - identifier already in use → blocked, a next-sequential identifier suggested
  - no serial number provided → allowed with a warning
invariants:    a bike identifier is unique across the fleet, always
non-functional: Reliability — a bike is available for assignment immediately on save
scope:         in: bike onboarding + route eligibility | out: equipment onboarding (REQ-FLEET02), photo capture (DR-F5, not built)
open-questions: none — D-FLEET-5 closed (DR-F5, no photo capture)
example:
  given:  William acquires a new bike
  when:   he creates the record as `FOB-016`, sets route eligibility to Hidden City
  then:   the bike is `in-service` and immediately available for Hidden City tour assignment

### REQ-FLEET02 — Owner creates an equipment record
intent:        create equipment-record
actor:         Owner
preconditions: equipment has been physically acquired, or an existing item needs replacement
conditions:    each item is entered individually with a description, one at a time (DR-F10, no bulk entry, no photo); a replacement links to the item it replaces, which is retired with a reason
postconditions: the equipment record exists and is tracked; if a replacement, the prior item is `retired`
outcomes:
  - Owner sees the new equipment available for use
  - a helmet enters an annual review reminder (DR-F2, no fixed age-based expiry) via compliance tracking (REQ-FLEET07)
errors:
  - a helmet has been involved in an impact → immediately retired regardless of age; a replacement record is required
invariants:    a helmet's annual review reminder is always scheduled at onboarding, never left unset
non-functional: Reliability — the review reminder is set correctly at the moment of onboarding
scope:         in: individual equipment onboarding and replacement | out: bike onboarding (REQ-FLEET01), bulk entry (DR-F10, not built), photo capture (DR-F5, not built)
open-questions: none — D-FLEET-2 closed (DR-F2, annual check not fixed policy), D-FLEET-10 closed (DR-F10, line-by-line only)
example:
  given:  William onboards a new helmet, manufacture date 2026-01-01
  when:   he saves the record
  then:   the helmet is `in-service`; its expiry alert enters compliance tracking per the replacement policy

### REQ-FLEET03 — Owner views the fleet & equipment readiness view
intent:        view fleet-readiness
actor:         Owner
preconditions: at least one asset exists
conditions:    the view reflects current status counts (bikes by status, equipment by type/status) and surfaces alerts (failed inspections, items expiring within 30 days, compliance dates approaching)
postconditions: the Owner has seen current fleet readiness
outcomes:
  - Owner can judge whether the fleet meets tomorrow's tour needs
errors:
  - none declared — this is a read view; a stale sync is shown with its timestamp, not treated as an error
invariants:    critical alerts (compliance lapse, no in-date helmets, most bikes flagged) are never hidden or buried
non-functional: Reliability — the view reflects the current state, not a stale cache, or clearly timestamps when it doesn't
scope:         in: read-only fleet/equipment status + alerts | out: acting on an alert (routes to REQ-FLEET04–10)
open-questions: none
example:
  given:  10 bikes (9 in-service, 1 flagged), all helmets in-date, PLI valid
  when:   William views the fleet readiness
  then:   he sees 9/10 bikes available, one flagged bike alert, no critical compliance alerts

### REQ-FLEET04 — System submits a bike service flag
intent:        submit service-flag
actor:         System
preconditions: a bike fails inspection (`tour-operations` REQ-OPS03), is flagged in a post-ride review, or the Owner flags it directly
conditions:    the flag records the reason, source (which inspection/review), and any note/photo attached
postconditions: the bike's status becomes `flagged-for-service`; it cannot be assigned to a tour until cleared
outcomes:
  - Owner sees the flagged bike with its reason in the fleet readiness view
  - `tour-operations` sees the bike as unavailable for assignment
errors:
  - none declared — every flag source is a valid trigger
invariants:    a flagged bike is never assignable to a tour until this module clears it (REQ-FLEET06)
non-functional: Reliability — the flag is visible immediately, not batched
scope:         in: recording a service flag from any valid source | out: the repair itself (REQ-FLEET05)
open-questions: none
example:
  given:  Bike FOB-001, `in-service`, fails Emma's inspection (brakes)
  when:   the System records the flag from `tour-operations`
  then:   FOB-001 becomes `flagged-for-service`; unavailable for tour assignment

### REQ-FLEET05 — Owner submits a maintenance event
intent:        submit maintenance-event
actor:         Owner
preconditions: a bike is `flagged-for-service` or `in-maintenance`
conditions:    the event records work performed, parts replaced, and time/cost (optional); no photo capture (DR-F5); external/off-system repairs are not logged here at all (DR-F9)
postconditions: the event is added to the bike's permanent history
outcomes:
  - Owner has a durable record of what was done and when
errors:
  - none declared — every in-house maintenance attempt, successful or not, is logged
invariants:    a maintenance event is never modified or deleted once saved
non-functional: Security — the event is timestamped and attributed to the Owner
scope:         in: logging in-house repair work against a flagged/in-maintenance bike | out: changing the bike's status itself (REQ-FLEET06), external-service logging (DR-F9, off-system), photo capture (DR-F5, not built)
open-questions: D-FLEET-1 (OPEN — scheduled-trigger REQ not yet authored, DR-F1)
example:
  given:  FOB-001, `flagged-for-service` for a brake issue
  when:   William logs a maintenance event (brakes serviced, £15 parts)
  then:   the event is added to FOB-001's permanent history

### REQ-FLEET06 — Owner updates a bike's status
intent:        update bike-status
actor:         Owner
preconditions: a bike is `flagged-for-service` or `in-maintenance`
conditions:    moving to `in-service` requires at least one in-house maintenance event has been logged since the flag (REQ-FLEET05)
postconditions: the bike's status reflects the Owner's decision; if returned to service, it is immediately re-eligible for tour assignment
outcomes:
  - Owner has cleared the bike back to service
  - `tour-operations` can assign the bike again once `in-service`
errors:
  - the same bike is flagged 3+ times in 90 days for the same issue → a pattern alert is surfaced, not blocking
invariants:    a bike returns to `in-service` only after at least one in-house maintenance event
non-functional: Reliability — the status change takes effect immediately, making the bike available/unavailable to `tour-operations` without delay
scope:         in: clearing a flagged/in-maintenance bike back to service | out: `awaiting-external-service` and `retired` transitions (DR-F9, DR-F8 — both declared holes, not modelled this pass)
open-questions: none — D-FLEET-3 closed (DR-F3, state machine confirmed)
example:
  given:  FOB-001, `in-maintenance`, one maintenance event logged
  when:   William sets it back to `in-service`
  then:   FOB-001 is immediately re-eligible for tour assignment

### REQ-FLEET07 — System submits a compliance alert
intent:        submit compliance-alert
actor:         System
preconditions: a tracked compliance item (PLI, EL, ICO, helmet expiry, first aid contents review) exists
conditions:    a daily check classifies each item: `pending` if within the configurable horizon (default 30 days) of expiry, `critical` if past expiry; an alert fires only at the moment an item's classification changes, not on a recurring schedule (DR-F7)
postconditions: alerts are current for every tracked item; a single on-event alert is sent when an item newly becomes `pending` or `critical`
outcomes:
  - Owner sees upcoming and overdue compliance items without having to track dates manually
errors:
  - none declared — this is itself the detection mechanism
invariants:    a critical (overdue) compliance item is never silently left unalerted
non-functional: Reliability — the daily evaluation runs every day without missed executions, even though the alert itself is on-event only
scope:         in: daily compliance evaluation + on-event alerting (core tracking scope: PLI, EL, ICO, helmet condition review, first aid contents — DR-F4) | out: the renewal action itself (REQ-FLEET08), a recurring digest (DR-F7, not built)
open-questions: none — D-FLEET-4 closed (DR-F4, core scope only), D-FLEET-7 closed (DR-F7, on-event only)
example:
  given:  PLI insurance expiring in 25 days
  when:   the System's daily check runs and this item newly enters `pending`
  then:   a `pending` alert is created and a single on-event notification is sent

### REQ-FLEET08 — Owner updates a compliance item's renewal
intent:        update compliance-item
actor:         Owner
preconditions: a compliance alert exists (`pending` or `critical`)
conditions:    renewal is recorded with a new expiry date; for insurance/ICO, a certificate/confirmation may be uploaded
postconditions: the item's expiry is updated; the alert clears; a new on-event alert will fire the next time this item's classification changes (DR-F7)
outcomes:
  - Owner sees the compliance item return to in-date status
errors:
  - none declared — renewal is a straightforward update once the Owner has acted externally (e.g. with a broker)
invariants:    a renewed item's new expiry date is always in the future relative to the renewal date
non-functional: Reliability — the alert clears immediately on renewal, not after the next daily check
scope:         in: recording a renewal | out: the external renewal process itself (broker, ICO portal — off-system)
open-questions: none
example:
  given:  PLI insurance `critical` (expired)
  when:   William renews via his broker and records the new expiry date
  then:   the compliance item returns to in-date; the critical alert clears

### *(REQ-FLEET09, REQ-FLEET10 — removed 2026-07-21, DR-F8)*
The retire/restore workflow (formal asset disposal + a reactivation grace period) is **dropped from core scope**, per sponsor ruling. A bike that fails inspection is simply flagged unusable with a reason (REQ-FLEET04), visible in the fleet inventory — there is no formal `retired` status transition authored here. Genuine permanent disposal (sold/scrapped) is handled off-system. The `retired` state remains in `DOMAIN-LEXICON.md`'s confirmed state machine (DR-F3) as a declared, deliberate hole — not deleted from the lexicon, just not driven by any REQ in this module.
  when:   William restores it with a note
  then:   FOB-001 returns to `in-service`

## 5. Journeys
| UJ id | Journey | Requirements (thread) |
|---|---|---|
| UJ-FLEET-01 | Onboard a bike to the fleet | REQ-FLEET01 |
| UJ-FLEET-02 | Onboard or replace safety equipment | REQ-FLEET02 |
| UJ-FLEET-03 | View fleet & equipment status | REQ-FLEET03 |
| UJ-FLEET-04 | Handle a flagged bike: out of service → maintain → return | REQ-FLEET04 · REQ-FLEET05 · REQ-FLEET06 |
| UJ-FLEET-05 | Track compliance dates and renewals | REQ-FLEET07 · REQ-FLEET08 |
| UJ-FLEET-06 | Retire or dispose of an asset | **DROPPED from core scope — DR-F8, 2026-07-21.** No REQ authored; handled off-system. |

## Revision History
| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-21T00:00:00Z | Initial module spec: 10 REQs across 6 core journeys (UJ-FLEET-04, 05, 06 each split into their constituent actions), 10 Decisions-needed, depends-on 2 Lean-6 modules. Formally resolves GAP-6b-3 (Owner-clears-flagged-bike) as REQ-FLEET06. |
| 0.2 | 2026-07-21T00:00:00Z | Stage 5 propagation (`Decision_Record_Fleet_Aristotle_2026-07-21.md`, DR-F1–F10): all 10 decisions closed, 6 depart from original recommendations. **REQ-FLEET09/10 removed** (retire/restore dropped, DR-F8) — UJ-FLEET-06 now has no REQ, core scope narrows to 8 REQs across 5 active journeys. REQ-FLEET01/02/05 corrected to remove photo capture (DR-F5). REQ-FLEET02 corrected: no fixed helmet-age policy (DR-F2), no bulk onboarding (DR-F10). REQ-FLEET07/08 corrected: on-event alerting, not digest cadence (DR-F7). Two new REQs identified as needed but not authored: a scheduled (time+mileage) maintenance trigger (DR-F1) and a combined fleet-certification gate (DR-F6). |
