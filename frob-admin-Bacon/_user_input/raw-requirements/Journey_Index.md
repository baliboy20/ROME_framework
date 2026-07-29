# FOB — Journey Index

| | |
|---|---|
| **Document** | FOB — Journey Index (Stage 2) |
| **Version** | 0.1 |
| **Date** | 2026-07-19T00:00:00Z |
| **Status** | PROPOSED — journeys are evidence the intent is real; bounded to the Lean-6 core concerns plus the `booking` (BOOK) and `pre-sales` (PRE) addenda (2026-07-20), not yet threaded to REQs (that column is added at Stage 4). |
| **Sources** | `strategic/FOB_Product_Requirements_Document_v1_0.md` §5.8 (cross-cutting use cases) · `technical-state/FOB_Technical_Context_Summary.md` · `data-model/Pre_Sales_Data_Model_v1_0.md` · `DOMAIN-LEXICON.md` (actors) · `Intake_Note.md` (goals) |

**Note on core-module journeys.** These are cross-cutting *capability* flows (the PRD §5.8 "cross-cutting use cases"), not business-domain journeys. Actors and outcomes are stated at the business level — no surface, device, or layer named (Gate 2). Two journeys are **infrastructure** (no human surface) and are flagged for Stage 6d architecture rather than Stage 6b surface coverage — carried, not dropped.

---

## Core journeys — in scope

| ID | Journey | Actor(s) | Trigger | Outcome | Scope |
|---|---|---|---|---|---|
| **UJ-AUTH-01** | Operator signs in to administer operations | Owner | Owner needs to manage bookings/ops | A time-bounded authenticated session is established | core |
| **UJ-AUTH-02** | Booked customer opens their booking from a messaged link | Customer | Customer follows the signed link in their confirmation | An authenticated booking session is established without a password | core |
| **UJ-AUTH-03** | Guide's device is recognised on tour day | Guide | Guide opens the tour tool on an issued device | The device is validated and scoped to that guide | core |
| **UJ-AUTH-04** | An expired session is renewed | Owner, Customer | The bounded session lifetime elapses | The actor re-establishes identity before continuing | core |
| **UJ-CNA-01** | A prospect records a marketing-permission decision | Prospect | Prospect submits a form requesting marketing permission (never pre-selected) | The decision is appended immutably with evidence | core |
| **UJ-CNA-02** | A person withdraws a permission | Customer, Prospect | Person asks to stop marketing contact | A withdrawal is appended and future marketing is suppressed | core |
| **UJ-CNA-03** | A money- or safety-critical action is recorded for audit | Owner, System (cron/webhook) | A refund, consent change, override, or incident occurs | An immutable audit entry is written | core |
| **UJ-CNA-04** | Dormant personal data is erased on schedule | System (cron) | The 90-day retention window elapses for dormant records | Personal data is irreversibly anonymised, the row retained, and the erasure audited | core |
| **UJ-CNA-05** | Current permission state is checked before contact | System, Owner | A marketing message is about to be sent | The latest permission for that person and purpose is confirmed, or sending is blocked | core |
| **UJ-NOTIF-01** | A customer receives a required transactional message | System (cron) | A booking is confirmed or a reminder falls due | The message is delivered once via the person's channel | core |
| **UJ-NOTIF-02** | A delivery outcome updates contactability | System (webhook) | The provider reports delivery, bounce, or complaint | The person's deliverability state is updated | core |
| **UJ-NOTIF-03** | A duplicate send is prevented | System | A job or webhook is retried | The second attempt is recognised and suppressed | core |
| **UJ-NOTIF-04** | The owner is alerted to an actionable event | System | An enquiry, handoff, or incident needs owner attention | The owner receives an alert on their channel | core |
| **UJ-SEO-01** | A search crawler reads a tour page's full content | System (crawler, external) | A crawler requests a marketing/tour page | Complete content and structured descriptors are available without executing scripts | core |
| **UJ-SEO-02** | The catalogue of crawlable pages is advertised | System | Content is published or changed | An up-to-date index of crawlable locations is available to crawlers | core |
| **UJ-SEO-03** | Published content reflects the latest catalogue | System | Marketing or route content changes | The public pages regenerate with current descriptors | core |
| **UJ-DS-01** | A customer-facing surface presents the brand consistently | Customer, Prospect | A person views any customer-facing surface | Brand tokens, type, and components are applied uniformly from one source | core |
| **UJ-DS-02** | A brand-token change propagates everywhere | Owner | A token or component is updated | Dependent surfaces reflect the change from the single source | support |
| **UJ-DATA-01** | A schema change is applied in order | Owner | A new versioned migration is released | The change is applied once, in sequence, and recorded | core · infrastructure |
| **UJ-DATA-02** | A business function persists through one access pattern | System | Any business-function read or write | Data is accessed via a single shared layer, not ad-hoc per table | core · infrastructure |

## Core journeys — `booking` (BOOK), added 2026-07-20

| ID | Journey | Actor(s) | Trigger | Outcome | Scope |
|---|---|---|---|---|---|
| **UJ-BOOK-01** | Customer enters the booking flow and confirms selection | Customer | Customer commits to booking a tour/date/party-size | A slot hold is acquired and a booking draft is created | core |
| **UJ-BOOK-02** | Customer provides attendee details | Customer (lead booker) | Selection confirmed, slot hold active | Attendee and emergency-contact data is captured for the booking draft | core |
| **UJ-BOOK-03** | Customer reviews terms, signs the waiver, gives consent | Customer | Attendee details captured | Waiver acceptance and T&C consent are recorded; marketing consent optionally recorded via `core-consent-audit` | core |
| **UJ-BOOK-04** | Customer pays | Customer, System (webhook) | Consent given | Payment is captured exactly once and the booking is confirmed | core |
| **UJ-BOOK-05** | Customer receives confirmation | Customer, System | Payment succeeds | Customer holds a durable confirmation; the booking becomes operational | core |
| **UJ-BOOK-06** | Customer modifies an existing booking | Customer, Owner | Customer needs to change date/party-size/attendee details | The booking is updated within policy; customer notified | core |
| **UJ-BOOK-07** | Customer cancels a booking and requests a refund | Customer, Owner | Customer needs to cancel | The booking is cancelled, refunded per policy, and capacity restored | core |
| **UJ-BOOK-09** | Owner creates a booking from an enquiry | Owner, Customer | An enquiry has progressed to agreed terms | The enquiry converts to a confirmed, paid booking | core |
| **UJ-BOOK-10** | System handles payment failure or booking abandonment | Customer, System | Payment fails at Stripe, or the customer abandons mid-flow | Either the retry succeeds or the draft is cleanly abandoned with no held capacity | core |
| **UJ-BOOK-12** | Owner creates a provisional booking from a customer's emailed request | Owner (acting on a Customer's emailed request, handled off-system) | Customer emails requesting to book without paying now | A provisionally-confirmed booking exists with Owner-set hold/deposit/reminder terms, holding capacity | core *(DR-B1, DR-B2 — `Decision_Record_Booking_Aristotle_2026-07-20.md`)* |

## Core journeys — `pre-sales` (PRE), added 2026-07-20

| ID | Journey | Actor(s) | Trigger | Outcome | Scope |
|---|---|---|---|---|---|
| **UJ-PRE-01** | Prospect lands on site and orients | Prospect | Prospect follows any link to the site | Prospect understands FOB's positioning and chooses a next action | core |
| **UJ-PRE-02** | Prospect browses the tour catalogue and shortlists | Prospect | Prospect navigates to the catalogue | Prospect identifies one or more tours of interest | core |
| **UJ-PRE-03** | Prospect inspects a single tour in depth | Prospect | Prospect opens a tour's detail | Prospect books, saves, or seeks contact | core |
| **UJ-PRE-05** | Prospect checks availability for dates/party size | Prospect | Prospect wants to confirm a date before booking | Prospect knows whether their date works and proceeds with confidence | core |
| **UJ-PRE-06** | Prospect submits a group/corporate/private enquiry | Prospect, Owner | Prospect's needs exceed standard self-service booking | Enquiry is submitted, acknowledged, and reaches the Owner with an explicit SLA | core |
| **UJ-PRE-08** | Prospect saves interest and returns later | Prospect | Prospect is interested but not ready to commit | Prospect has a low-friction route back; at most one consent-gated follow-up | core |
| **UJ-PRE-09** | Prospect converts and enters the booking flow | Prospect | Prospect commits to booking | Prospect enters `booking` with maximum context pre-filled | core |

## Core journeys — `tour-operations` (OPS), added 2026-07-20

| ID | Journey | Actor(s) | Trigger | Outcome | Scope |
|---|---|---|---|---|---|
| **UJ-OPS-01** | Guide receives tour assignment and prepares | Guide | A tour is scheduled and assigned for today | Guide is oriented, rider list reviewed, ready to begin pre-tour checks | core |
| **UJ-OPS-02** | Guide performs travel kit check | Guide | Guide begins Step 1 | All kit items confirmed packed; signed sign-off recorded | core |
| **UJ-OPS-03** | Guide performs bike inspection | Guide | Guide begins Step 2 | Every assigned bike passed or removed from service; declaration signed | core |
| **UJ-OPS-04** | Guide performs dynamic risk assessment and records decisions | Guide | Guide begins Steps 3 + 3B | Conditions assessed, mitigations recorded, signed sign-off | core |
| **UJ-OPS-05** | Guide checks in each rider | Guide, Rider | Riders arrive at the meeting point | Every rider checked in, waiver re-confirmed, cleared to ride | core |
| **UJ-OPS-06** | Guide delivers the safety briefing | Guide, Rider | All riders checked in and cleared | Briefing fully delivered, questions answered, confirmation signed | core |
| **UJ-OPS-07** | Guide completes final pre-departure sign-off | Guide | Steps 1–4 complete | All operational gates passed; guide proceeds to start the tour | core |
| **UJ-OPS-08** | Guide manages a mid-tour participant issue | Guide, Rider | A rider has a mechanical failure, illness, or needs to leave early | Issue resolved or rider handed off safely; group continues; event logged | core |
| **UJ-OPS-09** | Guide responds to an incident | Guide, emergency services, Owner | A serious incident occurs (injury, RTC, medical emergency) | Casualty in care of emergency services; incident recorded; notifications dispatched | core |
| **UJ-OPS-10** | Guide completes the post-ride review | Guide | The tour has ended | Review complete and dispatched; downstream actions triggered | core |
| **UJ-OPS-11** | Guide files an incident report and insurer notification | Guide, Owner | A reportable incident occurred | Incident formally documented, dispatched within statutory windows | core |
| **UJ-OPS-12** | Guide updates the route hazard log | Guide, Owner | A new hazard is observed or flagged in review | Hazard logged, controls applied, future tours forewarned | core |

## Core journeys — `pre-tour` (TOUR), added 2026-07-20

| ID | Journey | Actor(s) | Trigger | Outcome | Scope |
|---|---|---|---|---|---|
| **UJ-TOUR-01** | Customer accesses the tour-day information hub | Customer | Customer wants to review booking/meeting-point/status | Customer has reviewed pre-tour info and acted or left informed | core |
| **UJ-TOUR-02** | Customer receives scheduled pre-tour reminders | System, Customer | A reminder milestone's Cron fires | Customer receives timely reminders that build confidence | core |
| **UJ-TOUR-03** | Customer receives a weather advisory | System, Owner, Customer | Forecast crosses a threshold rule, or Owner manually triggers | Customer is informed of weather impact before arrival | core |
| **UJ-TOUR-04** | Customer updates attendee details or special requirements | Customer | Customer needs to correct a non-financial detail | Detail corrected; guide sees updated info | core |
| **UJ-TOUR-06** | Customer receives an operator-initiated change | Owner, Customer, System | Owner edits a confirmed booking's meeting point/time/guide | Customer is aware of and has acknowledged the change | core |
| **UJ-TOUR-07** | Customer receives an operator-initiated cancellation | Owner, Customer, System | Owner cancels a tour (weather, illness, force majeure) | Customer is informed; remediation applied; trust preserved | core |
| **UJ-TOUR-08** | Customer prepares and arrives on tour day | System, Customer, Guide | Tour day arrives | Customer arrives on time, prepared | core |
| **UJ-TOUR-09** | Customer notifies the operator of late arrival | Customer, Guide, Owner | Customer realises they will be late | Guide is informed; customer arrives within grace or is recorded no-show | core |
| **UJ-TOUR-10** | System handles no-show / non-arrival | Guide, System, Owner | Tour starts with booked attendees missing beyond grace | No-show recorded; policy applied; customer informed | core |

## Core journeys — `fleet-equipment` (FLEET), added 2026-07-21

| ID | Journey | Actor(s) | Trigger | Outcome | Scope |
|---|---|---|---|---|---|
| **UJ-FLEET-01** | Owner onboards a bike to the fleet | Owner | A new bike is physically acquired | Bike registered, photographed, eligible for tours | core |
| **UJ-FLEET-02** | Owner onboards or replaces safety equipment | Owner | New equipment acquired or existing item needs replacement | Equipment registered, lifecycle tracked, available for use | core |
| **UJ-FLEET-03** | Owner views the fleet & equipment status dashboard | Owner | Owner wants fleet visibility | Owner has clear visibility of fleet readiness | core |
| **UJ-FLEET-04** | Owner handles a flagged bike through to return | Owner, System | A bike is flagged for service (from `tour-operations` or directly) | Bike repaired, work logged, returned to service (or retired) | core |
| **UJ-FLEET-05** | System tracks compliance dates and renewals | System, Owner | Daily scheduled check, or Owner opens the compliance dashboard | Compliance items current; alerts respected; renewals recorded | core |
| ~~UJ-FLEET-06~~ | ~~Owner retires or disposes of an asset~~ | Owner | An asset reaches end-of-life | **DROPPED from core scope — DR-F8 (`Decision_Record_Fleet_Aristotle_2026-07-21.md`), 2026-07-21.** Handled off-system; no REQ authored. | dropped |

## Core journeys — `post-tour` (POST), added 2026-07-21

| ID | Journey | Actor(s) | Trigger | Outcome | Scope |
|---|---|---|---|---|---|
| **UJ-POST-01** | Customer receives thank-you and tour summary | System, Customer | `tour-operations`' post-ride review ticks "review request" | Customer acknowledged | core |
| **UJ-POST-02** | Customer submits a public review | Customer | Scheduled trigger at T+24h | Customer leaves a review or routes to private feedback | core |
| **UJ-POST-03** | Customer submits internal feedback | Customer | Feedback link opened | Feedback captured; a low rating alerts the Owner directly | core |
| **UJ-POST-10** | Customer manages marketing preferences / unsubscribes | Customer | Preferences/unsubscribe link opened | Preferences updated; suppression applied | core |

## Core journeys — `back-office` (BO), added 2026-07-21 (run Bacon)

| ID | Journey | Actor(s) | Trigger | Outcome | Scope |
|---|---|---|---|---|---|
| **UJ-BO-01** | Owner schedules a departure | Owner | Owner needs a bookable date for a tour | A departure exists, open for booking *(owning REQ REQ-BOOK11 — departures owned by `booking`, DR-BO1)* | core |
| **UJ-BO-02** | Owner updates a departure | Owner | Time/capacity/guide needs changing | The departure is updated; material changes flagged for customer notice | core |
| **UJ-BO-03** | Owner cancels a departure | Owner | A scheduled departure must be called off | The departure is cancelled; every booking enters remediation | core |
| **UJ-BO-04** | Owner views the departure calendar | Owner | Owner wants an at-a-glance schedule | Owner sees departures across dates with fill + readiness | core |
| **UJ-BO-05** | Owner searches bookings | Owner | Owner needs to find a booking | The matching booking(s) are found | core |
| **UJ-BO-06** | Owner views a booking's details | Owner | Owner needs the full record of one booking | Owner sees attendees, payment refs, consent/waiver, status | core |
| **UJ-BO-07** | Owner allocates bikes to a tour | Owner | A departure needs bikes before it runs | Specific in-service bikes are assigned to the departure | core |

*Journey ownership: UJ-BO-01/02/03 are Owner planning journeys realised by `booking`'s relocated REQ-BOOK11/12/13 (DR-BO1); UJ-BO-04–07 are owned by `back-office`. Cross-module notice/remediation orchestration for BO-02/03 stays in `back-office` (the leaf) to keep dependencies acyclic.*

## Deferred / out-of-scope journeys (absence on record)

| ID | Journey | Actor(s) | Why deferred / out |
|---|---|---|---|
| UJ-AUTH-D1 | Concierge session identity (session token → prospect promotion) | Prospect | Deferred with the concierge (R-D7). |
| UJ-CNA-D1 | Article 30 records-of-processing (PII inventory) | Owner | Deferred — "to produce" (PRD §6.2). |
| UJ-NOTIF-D1 | Marketing / WhatsApp messages via workflow orchestration | System | Deferred pending Knock decision (R-D1 / SQ-01). |
| UJ-NOTIF-D2 | Email-stack consolidation to Cloudflare-native (MailChannels) | System | Deferred (Reconciliation §6). |
| UJ-SEO-D1 | Multilingual structured data beyond marketing pages | System (crawler) | Deferred to v1.1 (booking/comms English-only at v1). |
| UJ-CORE-OUT-1 | Offline write-sync for the guide surface | Guide | **Out** — `core-offline-sync` not in the Lean-6 set. |
| UJ-CORE-OUT-2 | Rate-limit enforcement on public forms | System | **Out** — handled by Cloudflare platform rules, not a module. |
| UJ-BOOK-08 | Receive an OTA booking (Viator/GetYourGuide) | OTA system, Owner | **Deferred** — v2 sketch only, per the source journey doc itself (`Booking_And_Payment_User_Journeys_v1_0.md`). |
| UJ-BOOK-11 | Purchase a gift voucher | Customer | **Deferred from this pass** — confirmed in business scope (live site), not analysed in this BOOK addendum (`Intake_Note.md` §7.5). |
| UJ-PRE-04 | Ask the concierge a blocking question | Prospect, Concierge | **Deferred** — depends on 100% greenfield AI stack (Durable Objects, Vectorize, Claude API); own future module pass (`Intake_Note.md` §8.1). |
| UJ-PRE-07 | Concierge hands off to owner | Prospect, Concierge, Owner | **Deferred** — same reason as UJ-PRE-04, escalation depends on the concierge existing first. |
| UJ-GMT-01…10 | GMT navigation journeys (install, sync, route preview, live tracking, waypoint content, hazard alerts, off-route recovery, GPS/screen-lock failure, end tour, post-tour notes) | Guide | **Presumed, not analysed this pass** — GMT is treated as an existing, separately-designed navigation tool that `tour-operations` extends (`Intake_Note.md` §9). |
| UJ-POST-04 | Access shared tour photos | Customer, Guide | **Deferred** — source doc's own "sketch only, v2" designation (`Intake_Note.md` §12.5). |
| UJ-POST-05 | Receive negative-experience recovery contact (formal in-system logging) | Owner, Customer | **Deferred to a future phase** — sponsor decision 2026-07-21, `post-tour.md` v0.2. William handles recovery personally, off-system, meanwhile (still covered by REQ-POST03's Owner alert). |
| UJ-POST-06 | Owner monitors and responds to public reviews (in-system logging) | Owner | **Deferred to a future phase** — same decision. William checks platforms manually, off-system. |
| UJ-POST-07 | Receive a repeat-booking nudge | System, Customer | **Deferred to a future phase** — same decision. |
| UJ-POST-08 | Receive a lapsed-customer re-engagement | System, Customer | **Deferred to a future phase** — same decision. |
| UJ-POST-09 | Receive seasonal/new-tour marketing | Owner, System, Customer | **Deferred to a future phase** — same decision. |
| UJ-TOUR-05 | Ask a pre-tour question (booked-customer concierge) | Customer, Concierge, Owner | **Deferred** — depends on the same not-yet-built AI stack as UJ-PRE-04/07 (`Intake_Note.md` §10.1). |

---

## Goal → journey coverage (Gate 2 check)

| Goal | Served by |
|---|---|
| G-01 (data access + migrations) | UJ-DATA-01, UJ-DATA-02 |
| G-02 (per-actor auth) | UJ-AUTH-01, UJ-AUTH-02, UJ-AUTH-03, UJ-AUTH-04 |
| G-03 (reliable, non-duplicated messaging) | UJ-NOTIF-01, UJ-NOTIF-02, UJ-NOTIF-03, UJ-NOTIF-04 |
| G-04 (append-only consent/audit + erasure) | UJ-CNA-01…05 |
| G-05 (crawlable public pages) | UJ-SEO-01, UJ-SEO-02, UJ-SEO-03 |
| G-06 (one design system) | UJ-DS-01, UJ-DS-02 |
| G-07 (end-to-end booking, no oversell) | UJ-BOOK-01, UJ-BOOK-02, UJ-BOOK-03, UJ-BOOK-04, UJ-BOOK-05 |
| G-08 (exactly-once booking creation) | UJ-BOOK-04, UJ-BOOK-10 |
| G-09 (modify/cancel within policy) | UJ-BOOK-06, UJ-BOOK-07 |
| G-10 (owner-created bookings) | UJ-BOOK-09 |
| G-11 (discover/browse/inspect catalogue) | UJ-PRE-01, UJ-PRE-02, UJ-PRE-03 |
| G-12 (check availability before booking) | UJ-PRE-05 |
| G-13 (enquiries reach Owner with SLA) | UJ-PRE-06 |
| G-14 (save + consent-gated follow-up) | UJ-PRE-08 |
| G-15 (convert with context pre-filled) | UJ-PRE-09 |
| G-16 (compliance gates, no skip) | UJ-OPS-01–07 |
| G-17 (audit trail on every sign-off) | UJ-OPS-02, 03, 04, 05, 06 |
| G-18 (issue/incident handling + escalation) | UJ-OPS-08, 09, 11 |
| G-19 (post-tour data closes the loop) | UJ-OPS-10, 12 |
| G-20 (durable tour hub) | UJ-TOUR-01 |
| G-21 (reminders + weather advisories + day-of prep) | UJ-TOUR-02, 03, 08 |
| G-22 (self-service non-financial updates) | UJ-TOUR-04 |
| G-23 (operator changes/cancellations, acknowledged) | UJ-TOUR-06, 07 |
| G-24 (late arrival + no-show handling) | UJ-TOUR-09, 10 |
| G-25 (asset history, acquisition onward) | UJ-FLEET-01, 02 *(retirement/disposal dropped — DR-F8; goal narrows to acquisition-through-active-use)* |
| G-26 (flagged bike has a destination) | UJ-FLEET-04 |
| G-27 (compliance tracked, never silently lapses) | UJ-FLEET-05 |
| G-28 (daily fleet-readiness visibility) | UJ-FLEET-03 |
| G-29 (thank-you + review/feedback opportunity) | UJ-POST-01, 02, 03 |
| G-30 (catch negative experiences before public) | *(deferred — UJ-POST-05's formal logging; REQ-POST03's direct alert is the interim mechanism)* |
| G-31 (public review monitoring + response) | *(deferred — UJ-POST-06)* |
| G-32 (lifecycle-driven re-engagement) | *(deferred — UJ-POST-07, 08, 09)* |
| G-33 (granular preferences) | UJ-POST-10 *(deletion/erasure process explicitly not built this pass)* |

Every Stage-0 goal is served by ≥1 journey.

---

*Gate 2 self-check is reported at the end of the analysis session. The "Requirements (thread)" column is added at Stage 4 in each module spec's §5.*
