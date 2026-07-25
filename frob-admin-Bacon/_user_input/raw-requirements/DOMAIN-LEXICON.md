# FOB — Domain Lexicon

| | |
|---|---|
| **Document** | FOB — Domain Lexicon (Stage 1) |
| **Version** | 0.1 |
| **Date** | 2026-07-19T00:00:00Z |
| **Status** | PROPOSED — `Reliable` where a term/entity is sourced from built code or confirmed DDL; `PROPOSED` for the merged consent-audit model and the folded modules (see KI-2, KI-5, KI-6). |
| **Sources** | `data-model/Pre_Sales_Data_Model_v1_0.md` (confirmed DDL) · `technical-state/FOB_Technical_Context_Summary.md` · `architecture/FOB_Modular_Architecture_v1_4.md` · `architecture/FOB_Design_Reconciliation_v1_0.md` · `strategic/FOB_Product_Requirements_Document_v1_0.md` |

**Precedence rule:** where a module doc and this doc disagree, **this doc wins**. Where this doc and the **live D1 DDL** disagree, the DDL wins (it is rank-1 ground truth per pipeline §6).

**Scope:** vocabulary for the six Lean-6 core modules only. Business-domain terms (tour, booking, departure, participant, waypoint…) are owned by the business-function lexicons and are referenced, not redefined, here.

---

## 1. Terms
| Term | Definition (one sentence) | Distinct from | Notes |
|---|---|---|---|
| **Consent** | A recorded, purpose-scoped permission a person gives to process their data. | **Audit event** — consent is a permission *state*; an audit event is a record of *any* state-changing action. | Held append-only in `consents`; current state = latest row per `(prospect_id, consent_type)`. |
| **Audit event** | An append-only, immutable record of a money- or safety-critical state change (refund, consent change, override, incident). | **Application log** — audit is business-durable in D1; logs are operational/ephemeral in Workers Logs. | Entity is **New** — not yet built (P-05). |
| **Transactional message** | A message required to fulfil a booking (confirmation, reminder, change notice). | **Marketing message** — transactional needs no marketing consent; marketing is opt-in only. | PRD §10.2. |
| **Marketing message** | An opt-in promotional message (nudge, seasonal, re-engagement). | **Transactional message** — see above. | Gated by `consent` check (UJ-CNA-05). |
| **Auth session** | A KV-stored, time-bounded token record proving an actor's identity. | **Tour session** (`tour_sessions`) — GMT live-tour state in D1, unrelated to identity. | Name collision → KI-1. HS256, 1h TTL. |
| **Signed email link** | A short-lived tokened URL that lets a booked customer open their booking without a password. | **JWT** — the link carries a token that *mints* a JWT+KV auth session. | Booking-ref + email is the lookup; session is JWT (Reconciliation §4.4). |
| **Device identity** | A per-guide device, asserted by the `X-Device-ID` header and validated against `devices`. | **Auth session / JWT** — guides do not use JWT or KV sessions. | Tech Context G. |
| **Migration** | A versioned, ordered D1 schema change run once by the migration runner. | **Seed/fixture data** — a migration changes shape; seed data populates rows. | admin-rome `database/migrations/`. |
| **Structured data** | Machine-readable schema.org descriptors embedded in a crawlable page for search engines. | **Meta tags** (title/description/OG) — both serve SEO via different mechanisms. | Scope open — F-D2 / SQ-03. |
| **Anonymisation** | Irreversible scrubbing of personal fields once past the retention window, keeping the row. | **Deletion** — anonymisation retains the row (referential integrity); deletion removes it. | `prospects.deleted_at`, 90-day cron. |
| **Design token** | A named brand primitive (colour, space, type) consumed by both CSS and Flutter. | **Component** — a token is a *value*; a component is a *composed UI unit* built from tokens. | `styles.css` forest palette. |
| **Idempotency key** | A stored identifier that lets a retried webhook/job/send be recognised and executed once. | **Primary key** — an idempotency key guards an *operation*; a PK identifies a *row*. | Reuses the `webhook_events` pattern (F-08). |
| **Deliverability state** | The known contactability of an address, updated from provider delivery/bounce/complaint events. | **Consent** — deliverability is *technical* reachability; consent is *permission*. | Postmark webhook → D1. |
| **Booking** | A confirmed, paid commitment to a tour, created exactly once, distinct from the enquiry/prospect that preceded it. | **Enquiry** (`pre-sales`) — an enquiry is unpaid interest; a booking is paid and confirmed. | `bookings` (admin-rome, Referenced). Status `confirmed`/`cancelled`/`abandoned`. |
| **Booking draft** | A not-yet-paid, in-progress booking record created when a slot hold is acquired. | **Booking** — a draft has no payment yet and expires with its slot hold. | Retained 24h if abandoned, then purged. |
| **Slot hold** | A time-bounded, transactional reservation of one unit of departure capacity while a customer completes checkout. | **Booking** — a hold is provisional and expires; a booking is a paid, permanent record. | D1 transactional decrement (F-17); **not** a Durable Object, **not** `held_until`+sweep — both superseded guesses. |
| **Departure** | One scheduled date/time instance of a tour, with its own remaining capacity. | **Tour** — a tour is the product; a departure is one bookable occurrence of it. | `departures` (admin-rome, Referenced); max party size 10 (F-19). |
| **Attendee** | One person named on a booking, distinct from the lead booker who may or may not also be riding. | **Lead booker** — the attendee who completes the booking flow and accepts terms on behalf of the party. | `participants` (admin-rome, Referenced). |
| **Checkout Session** | The Stripe object representing one payment attempt for one booking, created with `ui_mode: 'embedded'`. | **Payment** — a session can fail/expire without ever becoming a payment; a payment exists once the session completes. | F-14. Client mounts via `stripe.createEmbeddedCheckoutPage()`. |
| **Idempotency-Key (client-supplied)** | A key generated per submit attempt so a retried checkout-session request returns the same Stripe session rather than creating a duplicate. | **Idempotency key** (server-side, `webhook_events`) — the client-supplied key guards *session creation*; the server-side key guards *webhook processing*. Distinct guards, same discipline. | F-15, F-16. |
| **Enquiry** | A request for group/private/corporate/accessibility booking that falls outside standard self-service, submitted by a Prospect. | **Booking** — an enquiry is unconverted interest; a booking is paid/confirmed. **Handoff** (deferred with the concierge) — an enquiry is a direct form submission, a handoff is a concierge escalation. | `enquiries` (New, owned by `pre-sales`). Feeds `booking` REQ-BOOK08. |
| **Saved tour** | An identified (email-captured) record of a prospect's interest in a specific tour, eligible for one follow-up nudge. | **Anonymous save** — a heart-click with no email lives only in the browser (localStorage), never reaches D1; a saved tour is the identified, server-side counterpart. | `saved_tours` (New, owned by `pre-sales`). One nudge per `(prospect, tour)`, consent-gated. |
| **Playbook step** | One of the six operational stages a guide works through on tour day (kit check, bike inspection, risk assessment, rider check-in, briefing, sign-off), each requiring a sign-off before the next unlocks. | **Journey** — a playbook step is a compliance gate within OPS; a journey (UJ) is this pipeline's own analysis unit. Multiple journeys can map to one playbook step. | FOB-PB-001 (external playbook doc, referenced not reproduced). |
| **Sign-off** | A guide's (or rider's) recorded declaration — signature + timestamp — that a playbook step's requirements are met. | **Consent** — a sign-off attests to a completed check; consent is a data-processing permission. Both are evidentiary but for different purposes. | Signature mechanism itself is open (SQ-20). |
| **Waiver re-confirmation** | The brief, fresh-signature re-acceptance of the liability waiver each rider gives at the meeting point on tour day. | **Waiver acceptance** (at booking, `booking` REQ-BOOK03) — the full read+sign; re-confirmation is a lighter, second layer, not a replacement. | Corrects DR-B7's original "paper" assumption — this is digital, via OPS/GMT signature pad. |
| **Hazard log entry** | A recorded, owner-approved observation of a route-specific danger (traffic, surface, crowd, etc.), distinct from a real-time GMT hazard alert. | **GMT hazard alert** — a live, proximity-triggered warning during a tour; a hazard log entry is the durable record that (once approved) can generate future GMT alerts. | Reviewed/deduplicated by the Owner before entering the log. |
| **Incident** | A serious tour-day event (injury, road traffic collision, medical emergency) requiring the 999 protocol and formal reporting. | **Mid-tour issue** (UJ-OPS-08) — a non-emergency operational event (mechanical failure, illness, early leave); an incident is categorically more severe and escalates differently. | Playbook "Emergency Reference"; target <1% of tours. |
| **Tour hub** | The durable, always-current information surface a confirmed customer uses between payment and tour day — extends `booking`'s manage-booking surface (W10). | **Manage-booking (W10)** — W10 is booking-specific (modify/cancel); the tour hub adds status, reminders, weather, and day-of content on top. | `pre-tour` UJ-TOUR-01. |
| **Reminder milestone** | One scheduled point in the reminder cadence (e.g. T-7, T-1, T-0) at which a booking-specific reminder is due. | **Nudge** (`saved_tours`, `pre-sales`) — a nudge targets an unconverted prospect; a reminder milestone targets an already-confirmed booking. | Cadence itself is open (SQ-28). |
| **Weather advisory** | A system- or Owner-triggered message informing a customer of forecast conditions affecting their tour, classified informational / action-required / cancellation-candidate. | **Operator-initiated cancellation** (UJ-TOUR-07) — an advisory can escalate into a cancellation, but is not one itself. | Threshold rules open (SQ-30). |
| **Operator-initiated change** | An Owner-made edit to a confirmed booking's meeting point, time, or guide, that the customer must be notified of and may need to acknowledge. | **Customer-initiated modification** (`booking` REQ-BOOK06) — same booking, opposite initiating actor; different notification/refund consequences. | `pre-tour` UJ-TOUR-06. |
| **Asset** | Any physical item FOB owns to deliver tours — a bike or a piece of safety equipment (helmet, first aid kit, hi-vis, poncho, gloves) — tracked from acquisition to retirement. | **Bike** — a bike is one specific kind of asset with its own richer maintenance lifecycle; "asset" is the umbrella term covering both bikes and equipment. | `fleet-equipment` module scope. |
| **Maintenance event** | A logged instance of repair work performed on a bike — what was done, parts, cost, photos. | **Inspection** (`tour-operations` REQ-OPS03) — an inspection *finds* a fault; a maintenance event *fixes* it. | Permanent part of the bike's history (cross-cutting principle 2). |
| **Compliance item** | A tracked date-bound obligation (PLI insurance, ICO registration, helmet expiry, first aid contents review) whose lapse creates legal/safety exposure. | **Maintenance event** — compliance is date-driven and often external (insurance renewal); maintenance is condition-driven and in-house. | `fleet-equipment` UJ-FLEET-05. |
| **Internal feedback** | A private rating + optional free-text submission a customer gives directly to FOB, not visible publicly. | **Public review** (TripAdvisor/Google) — internal feedback is private and always seen by the Owner; a public review is visible to anyone and only "seen" by the Owner when they check the platform. | `post-tour` UJ-POST-03. |
| **Customer lifecycle status** | A customer's engagement state — `active` / `lapsed` / `dormant` / `unsubscribed` — driving what retention comms they're eligible for. | **Consent state** (`consents`) — lifecycle status is about engagement timing; consent state is about permission. Both gate sends, independently. | `post-tour` UJ-POST-07/08. |
| **Recovery contact** | A personal, non-templated outreach from the Owner to a customer who had a negative experience, aiming to resolve it before/despite a public review. | **Public review response** (UJ-POST-06) — a recovery contact is private and personal; a review response is public and platform-hosted, though a negative review triggers both. | `post-tour` UJ-POST-05. |
| **Departure calendar** | The Owner's date-ranged view of scheduled departures, each showing fill (booked/capacity) and readiness (guide + bikes assigned). | **Availability check** (`pre-sales` REQ-PRE03) — the calendar is the Owner's internal planning view; an availability check is the customer-facing "can I book this date?" query. | `back-office` UJ-BO-04 (run Bacon). |
| **Bike assignment** | The allocation of a specific `in-service` bike to a departure for a tour-day, done by the Owner before the tour runs. | **Rider bike-fit at check-in** (`tour-operations` REQ-OPS05) — an assignment decides *which bikes go out* on a departure (pre-tour planning); the check-in fit decides *which rider gets which* of those bikes (on the day). | `back-office` UJ-BO-07 (run Bacon); write is `booking` REQ-BOOK14 on surface A20. Manual only — auto-assignment retired (DR-BO2). Entity `bike_assignments` owned by `booking` (DR-BO2a resolved 2026-07-21). |

## 2. Actors
| Actor | Who they are | Distinct from |
|---|---|---|
| **Prospect** | Anyone who has given contact details but has no booking. | **Customer** — a prospect has no booking; identity is consent-only. |
| **Customer** | A person with a confirmed booking, authenticated via a signed email link. | **Prospect** — see above; **Owner** — a customer authenticates per-booking, not by login. |
| **Owner** | William — founder/operator; authenticates by login to a JWT+KV admin session. | **Guide** — the owner authenticates by credential; a guide by device. |
| **Secondary operator** | Emma — same access as the Owner; growing operational role. | **Owner** — role parity at v1; distinct person for audit attribution. |
| **Guide** | The on-tour actor, recognised by `X-Device-ID` on an issued device. | **Owner/Secondary operator** — no JWT/KV session; device-scoped only. |
| **System (cron)** | The scheduled runner that sends reminders and anonymises dormant data. | **System (webhook)** — cron is time-triggered; webhook is event-triggered. |
| **System (webhook)** | The event-driven handler for provider callbacks (Stripe, Postmark). | **System (cron)** — see above. |
| **Lead booker** | The Customer who completes the booking flow and accepts terms on behalf of the whole party. | **Attendee** — every attendee including the lead booker is a party member; only the lead booker interacts with the booking flow itself. |
| **OTA system** | An external online-travel-agency platform (Viator, GetYourGuide) that notifies FOB of a booking via webhook. | **System (webhook)** — FOB's own webhook handlers; OTA is a *third-party* system, not FOB's. Journey UJ-BOOK-08 involving this actor is **deferred** (v2 sketch). |
| **Rider** | A Customer's party member physically present at the tour, checked in and cleared to ride by the Guide. | **Customer** — the Customer is whoever completed the booking (may or may not be riding); a Rider is specifically a person present on the day, checked in individually. | OPS's UJ-OPS-05; up to 10 per tour (party size cap, F-19). |

<!-- Banned generic roles (user/admin/stakeholder/end-user/person/role) are not used above. -->

## 3. Entity catalogue
| Entity | Status | Note |
|---|---|---|
| `consents` | **Built** | Confirmed DDL (Data Model §2). Owned by `core-consent-audit`. Append-only. |
| `prospects` | **Built** | Confirmed DDL (Data Model §1). Owned by `pre-sales`; **Referenced** here for consent + anonymisation linkage. |
| `devices` | **Referenced** | Exists in deployed `schema.sql`; columns not in corpus → attributes inferred. Owned by `core-auth`. |
| `guides` | **Referenced** | Exists in deployed `schema.sql`; columns not in corpus → attributes inferred. |
| `email_events` | **Referenced** | PoC email system schema (Tech Context A/K); columns not in corpus. → `core-notifications`. |
| `email templates` | **Referenced** | PoC `templates.ts` + `0004_templates_html.sql`; columns not in corpus. → `core-notifications`. |
| `webhook_events` | **Referenced** | Stripe PoC idempotency table; columns not in corpus. → folded idempotency. |
| KV auth-session record | **Referenced** | Lives in KV, **not D1** — token → session payload, 1h TTL. → `core-auth`. |
| `audit_log` | **New** | Not built (P-05). No attribute table authored — designer's job. → `core-consent-audit`. |
| `bookings` | **Referenced** | admin-rome migration table; columns not yet in this corpus. → `booking`. |
| `departures` | **Referenced** | admin-rome migration table (tour-date instances + capacity); columns not yet in this corpus. → `booking`. |
| `participants` | **Referenced** | admin-rome migration table (attendees); columns not yet in this corpus. → `booking`. |
| `payments` | **Referenced** | Schema pattern verified via `stripe_embedded_checkout` POC (`session_id`, `status`, `refund_amount_pence`, ...) — POC schema, not confirmed against admin-rome's actual production table. → `booking`. |
| `webhook_events` (booking's checkout-session flow) | **Referenced** | Same idempotency pattern as `core-notifications`' table (DR-8) — deduped by Stripe event id. → `booking`, shared mechanism with `core-notifications`. |
| `enquiries` | **New** | Not previously attribute-tabled at this pipeline's level (source doc has DDL, but PRE's own Stage 4/6a should design against requirements, not import DDL verbatim per ROME-GUIDE-001 Part 5). → `pre-sales`. |
| `saved_tours` | **New** | Same note as `enquiries`. → `pre-sales`. |
| `bikes` | **New** | **CORRECTED 2026-07-21 (F-42):** owned by `fleet-equipment`, not `tour-operations` — full lifecycle tracking (onboarding, maintenance, retirement), not just an inspection target. |
| `tour_readiness` | **New** | Aggregated per-tour sign-off record (kit/bike/RA/check-in/briefing). No DDL exists yet. → `tour-operations`. |
| `rider_checkins` | **New** | Per-rider, per-tour check-in record. No DDL exists yet. → `tour-operations`. |
| `incidents` | **New** | Injury/RTC/medical incident record. No DDL exists yet. → `tour-operations`. |
| `hazard_log` | **New** | Owner-approved route hazard entries; can feed GMT proximity alerts once approved. No DDL exists yet. → `tour-operations`. |
| `reminders` | **New** | Per-booking, per-milestone reminder send record. No DDL exists yet. → `pre-tour`. |
| `weather_advisories` | **New** | Per-booking weather advisory record. No DDL exists yet. → `pre-tour`. |
| `operator_notices` | **New** | Per-booking operator-initiated change/cancellation notice + acknowledgement record. No DDL exists yet. → `pre-tour`. |
| `equipment` | **New** | Helmets, first aid kits, hi-vis, ponchos, gloves — individualised (helmets, kits) or batch (hi-vis, ponchos, gloves). No DDL exists yet. → `fleet-equipment`. |
| `maintenance_events` | **New** | Permanent log of repair work per bike. No DDL exists yet. → `fleet-equipment`. |
| `compliance_items` | **New** | Tracked date-bound obligations (PLI, ICO, helmet expiry, first aid review). No DDL exists yet. → `fleet-equipment`. |
| `feedback` | **New** | Private internal ratings + free text per completed booking. No DDL exists yet. → `post-tour`. |
| `public_reviews` | **New — deferred, not built this pass** | Logged TripAdvisor/Google reviews with Owner response tracking. Belongs to UJ-POST-06, deferred to a future phase (sponsor decision 2026-07-21). → `post-tour` (future). |
| `recovery_contacts` | **New — deferred, not built this pass** | Personal Owner outreach log for negative experiences. Belongs to UJ-POST-05, deferred to a future phase. → `post-tour` (future). |

## 4. Attribute tables — Built entities (facts, not design)

### `consents` — attributes (Built; confirmed DDL — Data Model §2)
| Field | Meaning | Constraint |
|---|---|---|
| `id` | Primary key | UUID, not null |
| `prospect_id` | The prospect this consent pertains to | FK → `prospects(id)`, not null |
| `consent_type` | Purpose scope of the permission | not null; one of `marketing_email` / `marketing_whatsapp` / `data_processing` / `cookies_analytics` / `cookies_marketing` |
| `granted` | Whether consent was granted (1) or withdrawn (0) | not null, 0/1 |
| `source` | Which form/page/mechanism captured it (e.g. `enquiry_form_v1`) | not null |
| `evidence` | Human-readable description of how consent was given | not null |
| `ip_address_hash` | Hashed IP at capture (audit, not tracking) | nullable |
| `granted_at` | When this consent state began | ISO-8601, not null |
| — | **Append-only — never UPDATE.** Current state = latest row per `(prospect_id, consent_type)`. | invariant |

### `prospects` — attributes (Built; confirmed DDL — Data Model §1; **owned and authored by `pre-sales`**)
| Field | Meaning | Constraint |
|---|---|---|
| `id` | Primary key | UUID, not null |
| `name` | Captured at point of contact | nullable |
| `email` | Primary contact address | nullable; `CHECK (email IS NOT NULL OR phone IS NOT NULL)` |
| `phone` | Normalised with country code | nullable; see check above |
| `whatsapp_ok` | Explicit opt-in for WhatsApp contact | not null, default 0 |
| `preferred_channel` | `email` / `whatsapp` / `phone` | nullable |
| `locale` | For multi-language follow-up (e.g. `en-GB`, `fr-FR`) | nullable |
| `source` | Analytics source path (organic/paid/OTA/direct) | nullable |
| `first_seen_at` | First contact timestamp | ISO-8601, not null |
| `last_seen_at` | Most recent interaction | ISO-8601, not null |
| `created_at` | Row creation | ISO-8601, not null |
| `deleted_at` | Soft-delete for GDPR — PII fields blanked, row retained | ISO-8601, nullable |
| `lifecycle_status` | `active` / `lapsed` / `dormant` / `unsubscribed` — **proposed 2026-07-21 for `post-tour`'s repeat-booking/lapsed nudges (UJ-POST-07/08), deferred to a future phase along with those journeys — not written by anything built this pass** | not null, default `active` |

### Referenced entities (inferred, **not confirmed DDL** — do not build from these)
- `devices` / `guides` — identity rows in the deployed route-pipeline schema; presumed columns: guide identifier, device identifier / `X-Device-ID` value, scoping/status. *Confirm against `api/src/db/schema.sql` before use.*
- `email_events`, `email templates`, `webhook_events` — presumed to carry message/event id, type/status, timestamp, and (for `webhook_events`) the provider event id used as the idempotency key. *Confirm against the PoC schemas before use.*

<!-- New entity `audit_log`: NO attribute table — that is the designer's job at Stage 6a. -->

## 5. State / lifecycle tables

### `consents` — states (per `(prospect_id, consent_type)`)
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | granted | prospect opts in on a form → UJ-CNA-01 |
| (none) | withheld | prospect declines / leaves unticked → UJ-CNA-01 |
| granted | withdrawn | person withdraws / unsubscribes → UJ-CNA-02 |
| withdrawn | granted | person re-opts-in (new append row) → UJ-CNA-01 |
| any | anonymised | 90-day dormancy → UJ-CNA-04 |

### Auth session (KV) — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | active | operator login / signed-link exchange → UJ-AUTH-01, UJ-AUTH-02 |
| active | expired | 1h TTL elapses → UJ-AUTH-04 |
| active | revoked | explicit logout → UJ-AUTH-05 / REQ-AUTH05 (DR-4) |

### `enquiries` — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | open | Prospect submits an enquiry → PRE's own Stage 4, not yet authored |
| open | acknowledged | Owner acknowledges (or auto-ack on submit) | — |
| acknowledged | responded | Owner replies via the prospect's preferred channel | — |
| responded | converted | Owner creates a booking from the enquiry → `booking` REQ-BOOK08 |
| open | spam | Turnstile/heuristic flag | — |
| open / acknowledged | closed | Enquiry does not convert | — |

### `saved_tours` (nudge) — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | pending | Identified save captured (email given) → PRE's own Stage 4, not yet authored |
| pending | sent | +3-day nudge sent (gated by marketing consent — via `core-consent-audit` REQ-CNA05) | — |
| pending | suppressed | Suppression rule applies (already booked / consent withdrawn / bounced) | — |
| sent | unsubscribed | Prospect unsubscribes from the nudge | — |
| pending / sent | converted | Prospect books the saved tour | — |

### `bikes` — states *(owned by `fleet-equipment`, corrected 2026-07-21 — F-42; supersedes the earlier OPS-only version)*
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | in-service | Bike onboarded → `fleet-equipment`'s own Stage 4, not yet authored |
| in-service | flagged-for-service | `tour-operations` inspection finds a fault (REQ-OPS03), or post-tour review flags it, or Owner flags directly | FLEET's own Stage 4 |
| flagged-for-service | in-maintenance | Owner begins work | FLEET's own Stage 4 |
| in-maintenance | awaiting-external-service | Repair beyond in-house capability | FLEET's own Stage 4 |
| in-maintenance / awaiting-external-service | in-service | Owner clears after successful repair | FLEET's own Stage 4 |
| any | retired | Safety-critical damage, beyond economic repair, or end-of-life | FLEET's own Stage 4 |

### `incidents` — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | submitted | Guide files the incident report → OPS's own Stage 4, not yet authored |
| submitted | insurer_ack | Insurer acknowledges | — |
| insurer_ack | reviewed | Post-incident review completed | — |
| reviewed | closed | Owner closes the record | — |

### `hazard_log` — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | pending_review | Guide submits a hazard observation → OPS's own Stage 4, not yet authored |
| pending_review | approved | Owner confirms + sets severity | — |
| approved | archived | Hazard is transient and expires | — |

### `reminders` — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | sent | the scheduled milestone's Cron fires and the reminder is dispatched → TOUR's own Stage 4, not yet authored |
| sent | *(terminal)* | no further transition — one row per `(booking, milestone)` | — |

### `weather_advisories` — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | sent | forecast crosses a threshold rule → TOUR's own Stage 4, not yet authored |
| sent | superseded | a later advisory for the same booking supersedes it (severity escalation) | — |

### `operator_notices` — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | sent | Owner-initiated change or cancellation is saved → TOUR's own Stage 4, not yet authored |
| sent | acknowledged | Customer acknowledges (material changes only) | — |
| sent | unacknowledged_overdue | 24h elapses without acknowledgement | — |

### `equipment` (individualised: helmets, first aid kits) — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | in-service | Onboarded → `fleet-equipment`'s own Stage 4, not yet authored |
| in-service | lost | Lost during a tour, not retired | — |
| in-service | retired | Impact (helmet), expiry, damage, end-of-cycle | — |

### `compliance_items` — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| in-date | pending | Within the configurable expiry horizon (default 30 days) | — |
| pending | critical | Past expiry | — |
| critical / pending | in-date | Renewed, new expiry date set | — |
| in-date / pending / critical | revoked | Certificate revoked (rare) | — |

### `recovery_contacts` — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | initiated | Owner reaches out after a negative signal → `post-tour`'s own Stage 4, not yet authored |
| initiated | resolved / partial / escalated / ignored | Outcome tracked after contact | — |

### `public_reviews` — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | unresponded | New review discovered → `post-tour`'s own Stage 4, not yet authored |
| unresponded | responded | Owner posts a platform response | — |

### `prospects.lifecycle_status` — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| active | lapsed | No engagement within the re-engagement window (D3) → `post-tour`'s own Stage 4, not yet authored |
| lapsed | active | Customer engages with a lapsed re-engagement, or rebooks | — |
| lapsed | dormant | No engagement within X weeks of lapsed re-engagement | — |
| active/lapsed/dormant | unsubscribed | Customer unsubscribes from all marketing | — |

### `prospects` PII — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| active | soft-deleted (PII blanked, row retained) | 90-day dormancy, `deleted_at` set → UJ-CNA-04 |

### Notification/message — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| queued | sent | dispatch to provider → UJ-NOTIF-01 |
| sent | delivered | provider delivery event → UJ-NOTIF-02 |
| sent | bounced | provider bounce event → UJ-NOTIF-02 |
| sent | failed/complaint | provider failure/complaint event → UJ-NOTIF-02 |

### `audit_log` — states
*Append-only, immutable — **no transitions** (a row is never modified). Declared here so the absence is on record.*

### `booking` — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | draft | slot hold acquired → REQ-BOOK01 |
| draft | confirmed | payment succeeds (webhook) → REQ-BOOK05 |
| draft | provisionally-confirmed | customer completes booking without payment (D-BOOK-1) → REQ-BOOK10 |
| provisionally-confirmed | confirmed | outstanding payment collected → REQ-BOOK10 *(collection trigger/timing itself is D-BOOK-2, still open)* |
| provisionally-confirmed | cancelled *(no-show/non-payment)* | policy-driven — **hole, D-BOOK-2 still open** |
| draft | abandoned | slot hold expires, no payment, no provisional option taken → REQ-BOOK09 |
| confirmed / provisionally-confirmed | cancelled | customer/owner cancels → REQ-BOOK07 |
| confirmed / provisionally-confirmed | confirmed *(modified)* | date/party-size/attendee change accepted → REQ-BOOK06 |

### Checkout Session — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| (none) | open | session created → UJ-BOOK-04 |
| open | complete | Stripe reports `checkout.session.completed` (webhook) → UJ-BOOK-04 |
| open | expired | session lifetime elapses, no payment → UJ-BOOK-10 |

### `payments` — states (POC-verified pattern, F-20)
| From | To | Trigger (→ requirement) |
|---|---|---|
| pending | succeeded | webhook confirms payment | UJ-BOOK-04 |
| succeeded | partially_refunded | a partial refund is issued | UJ-BOOK-07 (modification/cancellation path) |
| partially_refunded | refunded | cumulative refunds reach the full amount | UJ-BOOK-07 |
| pending | failed | payment fails or session expires unrecovered | UJ-BOOK-10 |

### `departures` capacity — states
| From | To | Trigger (→ requirement) |
|---|---|---|
| available | held | a slot hold is acquired (D1 transactional decrement, F-17) → UJ-BOOK-01 |
| held | available | hold expires without payment → UJ-BOOK-10 |
| held | confirmed *(decremented)* | payment succeeds → UJ-BOOK-04 |
| confirmed *(decremented)* | available *(restored)* | booking cancelled → UJ-BOOK-07 |

## 6. Relationships
| Parent | Child | Cardinality | Note |
|---|---|---|---|
| `prospects` | `consents` | 1 : N | append-only history per prospect |
| `guides` | `devices` | 1 : N | device-scoped auth |
| `departures` | `bookings` | 1 : N | one departure holds many bookings up to its capacity |
| `bookings` | `participants` | 1 : N | one booking has one or more attendees |
| `bookings` | `payments` | 1 : N | a booking may have multiple payment attempts (retries) but at most one `succeeded` |
| `prospects` | `enquiries` | 1 : N | one prospect may submit multiple enquiries over time |
| `prospects` | `saved_tours` | 1 : N | one nudge per `(prospect, tour)` — unique pair |
| `enquiries` | `bookings` | 0/1 : 1 | a converted enquiry links to exactly one booking (REQ-BOOK08) |
| actor / entity | `audit_log` | 1 : N | every audited action references its subject |
| message | delivery event (`email_events`) | 1 : N | multiple provider callbacks per send |

## 7. Known inconsistencies
| ID | Conflict | Sources | Resolution needed |
|---|---|---|---|
| KI-1 | **"Session" collision** — auth session (KV, identity) vs `tour_sessions` (D1, GMT live state). | PRD §7.4/§7.5; Tech Context K | Adopt "auth session" / "login session" in all Tier-1 docs. |
| KI-2 | **Consent + audit module count** — architecture lists `core-consent` and `core-audit` as two modules; this run merges them. | Arch §5.1 vs session scoping | **RESOLVED — DR-5 (`Decision_Record_Aristotle_2026-07-20.md`).** Merged `core-consent-audit`: `consents` kept as-is (Built), new `audit_log` table added. One module, two tables. |
| KI-3 | **Email provider** — Postmark (site) vs Resend (PoCs) vs **SendGrid** (UJ Summary legend + Data Model `saved_tours` note) vs MailChannels (older). | Tech Context A; UJ Summary; Data Model §4 | Postmark canonical at v1; **"SendGrid" is stale** and must not be cited → SQ-06. |
| KI-4 | **SMS/WhatsApp** — Twilio direct (older docs) vs Knock→Twilio (proposal). | Reconciliation §3; Tech Context F | Pending R-D1 → SQ-01. |
| KI-5 | **Idempotency location** — `core-idempotency` module (Arch) vs folded into webhooks/notifications (this run). | Arch §5.1 vs session scoping | Confirm folded; name the key store → SQ-07. |
| KI-6 | **Slot holds** — `held_until` + sweep cron (Reconciliation §4.4 / R-D2) vs transactional decrement, no module (this run). Touches `core-data-access` transaction semantics. | Reconciliation §4.4 vs session scoping | **DEFERRED — D-DATA-3, still open (`Decision_Record_Aristotle_2026-07-20.md`).** Out of Lean-6 scope; belongs to the `booking` module's own Stage 4/5. A non-binding suggestion (transactional decrement) is carried forward for that future session. |
| KI-7 | **i18n approach** — per-locale static dirs, EN/FR/ES (built) vs runtime i18n PoC, EN/DE/JA/ZH. | Tech Context I/§I | Static dirs canonical at v1; PoC is an alternative pattern only. |
| KI-8 | **Save-link auth** — Data Model says v1 uses "stateless JWTs" and *skips KV* for save-links, but manage-booking uses **JWT + KV**. | Data Model §Non-D1; Tech Context G | **RESOLVED — DR-2 (`Decision_Record_Aristotle_2026-07-20.md`).** JWT+KV adopted throughout (revocable); the "stateless JWTs" Data Model text is superseded. |
| KI-9 | **Payment surface (BOOK D3)** — the source journey doc frames this as "Checkout vs Elements"; the Reconciliation doc claims it "settled as Elements+PaymentIntents"; live POC testing shows the actual mechanism is a third option, **Embedded Checkout** (`ui_mode: 'embedded'`), neither doc named. | `Booking_And_Payment_User_Journeys_v1_0.md` D3; `FOB_Design_Reconciliation_v1_0.md` §2; `pocs/stripe_embedded_checkout/` | **RESOLVED — F-14 (`Intake_Note.md` §7.2).** Embedded Checkout is the mechanism; both prior docs' D3 answer is superseded, not merely "still open." |
| KI-10 | **Slot-hold mechanism** — three divergent descriptions: Durable Object (original BOOK doc), `held_until`+sweep cron (Reconciliation §5 R-D2), D1 transactional decrement (D-DATA-3 recommendation). | `Booking_And_Payment_User_Journeys_v1_0.md`; `FOB_Design_Reconciliation_v1_0.md` §5; `Decision_Record_Aristotle_2026-07-20.md` D-DATA-3 | **Direction set, not yet ratified for `booking`** — D1 transactional decrement (F-17) is the recommendation on record; booking's own Stage 5 must formally ratify it before it's Reliable. |
| KI-11 | **Confirmation email provider for bookings** — admin-rome's built path uses Postmark; the `stripe_embedded_checkout` POC uses Resend. Neither is booking's ratified final answer — project-wide D-NOTIF-2 is still open. | `backend/src/lib/email.ts`; `pocs/stripe_embedded_checkout/`; `Decision_Record_Aristotle_2026-07-20.md` D-NOTIF-2 | **Deferred with D-NOTIF-2** — do not pick either for booking ahead of the project-wide decision. |
| KI-12 | **`consents` ownership** — the Pre-Sales data model independently describes its own `consents` table, near-identical in shape to the one already owned by `core-consent-audit` (DR-5). | `Pre_Sales_Data_Model_v1_0.md` §2 vs `core-consent-audit.md` | **RESOLVED (sponsor, 2026-07-20).** PRE has no `consents` table of its own — it depends on `core-consent-audit` (REQ-CNA01) for every consent write, same pattern as `booking`. |
| KI-13 | **Group/party-size cap** — the Pre-Sales journey doc uses >20 as the enquiry-routing threshold; the corrected figure (already applied to `booking`, F-19) is 10. | `Pre_Sales_User_Journeys_v1_0.md` UJ-PRE-05/06; `FOB_Design_Reconciliation_v1_0.md` §4.1 | **RESOLVED — F-23** (`Intake_Note.md` §8.2). 10 is canonical everywhere, not just `booking`. |
| KI-14 | **SendGrid webhook** cited for `saved_tours` bounce-tracking in the Pre-Sales data model — stale, same class of error as KI-3. | `Pre_Sales_Data_Model_v1_0.md` §4 | **RESOLVED — F-27.** Postmark is canonical; never cite SendGrid, consistent with KI-3. |
| KI-15 | **Concierge/AI stack** (Durable Objects, Vectorize, Claude API) assumed live in the Pre-Sales data model — actually 100% greenfield (F-01, R-D7). | `Pre_Sales_Data_Model_v1_0.md` (Durable Object rows, Vectorize row); `FOB_Design_Reconciliation_v1_0.md` §1(B) | **Not a contradiction, a scope boundary** — the concierge (UJ-PRE-04/07) is deferred out of this pass entirely (sponsor decision, 2026-07-20), not designed against these non-existent primitives here. |
| KI-16 | **GDPR retention conflict** — `post-tour`'s own D6 proposes 24 months from last interaction before anonymisation; `core-consent-audit`'s already-ratified DR-7 covers `prospects` at 90 days. Possibly two legitimately different populations (prospect vs confirmed customer), possibly a genuine conflict. | `Post_Tour_Retention_User_Journeys_v1_0.md` D6; `Decision_Record_Aristotle_2026-07-20.md` DR-7 | **Not resolved at Stage 0–2** — emitted as a Stage 5 decision (SQ-52) for `post-tour`, not silently adopted either way. |

## 8. Canonical named fixtures
| Fixture | Value |
|---|---|
| **Tom** | International tourist; **Customer**; booking `BK-1001`; `tom@example.com`; locale `en-GB`. |
| **Marie** | French repeat visitor; **Prospect** `PROSPECT-2001`; locale `fr-FR`; `marketing_email` granted. |
| **Sarah** | UK gift purchaser; **Prospect**; `marketing_email` withheld. |
| **William** | **Owner**; authenticates to an admin auth session. |
| **Emma** | **Secondary operator / Guide**; guide device `DEV-EMMA-01`. |
| **Tour "Hidden City"** | `TOUR-HID`, £45, 90 min (settled catalogue — Reconciliation §2). |
| **Consent CON-1001** | Tom · `marketing_email` · `granted=1` · source `enquiry_form_v1` · `2026-06-01`. |
| **Message MSG-1001** | Booking-confirmation (transactional) to Tom, sent via Postmark, delivered. |
| **Booking BK-1001** | Tom · Hidden City tour · confirmed · £45 · 1 attendee (Tom himself). |
| **Departure DEP-HID-2026-08-01-1000** | Hidden City, 2026-08-01, 10:00 slot, capacity 10. |
| **Enquiry ENQ-2001** | Marie · group enquiry, party size 8, Hidden City, status `open`. |
| **Saved tour SAVE-2001** | Sarah · Hidden City · saved via email modal, nudge `pending`. |
| **Guide Emma** | Guide, tour-day operational actor (reuses the `core-auth` fixture). |
| **Tour-day TD-2026-08-01-HID** | Hidden City departure DEP-HID-2026-08-01-1000, Emma assigned, 2 riders (Tom + 1). |
| **Reminder milestone T-1 for BK-1001** | Tom's Hidden City booking, 1 day before departure. |
| **Bike FOB-001** | In-service, assigned to Hidden City tours. |
| **Helmet HEL-014** | Size M, in-service, expiry per DR (5yr-or-impact policy). |
| **Feedback FB-1001** | Tom · Hidden City tour · overall 5★ · positive · testimonial consent granted. |

---

*Gate 1 self-check is reported at the end of the analysis session.*
