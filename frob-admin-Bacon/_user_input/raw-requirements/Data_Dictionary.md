# FOB — Data Dictionary

| | |
|---|---|
| **Document** | FOB — Data Dictionary (Stage 6a) |
| **Version** | 0.1 |
| **Date** | 2026-07-20T00:00:00Z |
| **Status** | PROPOSED — derived from ratified module specs; Built-entity fields are `Reliable` (confirmed DDL), New/Referenced fields are `PROPOSED` design |
| **Sources** | `core-auth.md`, `core-consent-audit.md`, `core-notifications.md`, `core-seo.md`, `core-data-access.md` (all Stage 4, post Stage 5 propagation) · `booking.md`, `pre-sales.md`, `tour-operations.md`, `pre-tour.md`, `fleet-equipment.md`, `post-tour.md` (v0.2, tight scope) (Stage 4, post Stage 5 propagation) · `DOMAIN-LEXICON.md` §3–5 · `Decision_Record_Aristotle_2026-07-20.md` (DR-1, DR-2, DR-4, DR-5, DR-6, DR-8) · `Decision_Record_Booking_Aristotle_2026-07-20.md` (DR-B1–B10) · `Decision_Record_PreSales_Aristotle_2026-07-20.md` (DR-P1–P4) · `Decision_Record_TourOps_Aristotle_2026-07-20.md` (DR-O1–O5) · `Decision_Record_PreTour_Aristotle_2026-07-21.md` (DR-T1, T4–T9) · `Decision_Record_Fleet_Aristotle_2026-07-21.md` (DR-F1–F10) · `Decision_Record_PostTour_Aristotle_2026-07-21.md` (DR-PT1–PT4) · `Decision_Record_Bacon_2026-07-21.md` (DR-BO1–6, DR-BO2a — run Bacon) |

**Precedence:** where this dictionary and a module spec disagree, the module spec's REQ wins (this doc is derived, not authored ahead of it) — but where this dictionary and the Lexicon disagree, the Lexicon wins per its own precedence rule.

---

## 1. Conventions

- **Timestamps:** ISO-8601, UTC, e.g. `2026-07-20T14:03:00Z` — matches every module spec's fixtures.
- **Primary keys:** D1-table entities use UUID (matches the `consents`/`prospects` Built pattern). The KV auth-session record uses its **token string** as the natural key — it is not a D1 row.
- **Booleans:** stored as `0`/`1` in D1 (matches `consents.granted`), expressed as `true`/`false` in this dictionary for readability.
- **Ownership:** each table/record below names the module that writes it. No other module writes another's table directly — cross-module access is via the owning module's read API (Module_Map.md §2).
- **Enum discipline:** every closed value set used by a REQ is registered once in §3. A new value is a dictionary revision first (RULES.md R3 / pipeline change-control §9), never a spec-local addition.

---

## 2. Entities

### `consents` — owner: `core-consent-audit`
Append-only permission ledger, one row per decision (never updated). **Built**, confirmed DDL — unchanged by this run (DR-5 kept it as-is).

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | UUID | Row identity | — |
|  | `prospect_id` | UUID, FK → `prospects.id` | Whose consent this is | REQ-CNA01 |
|  | `consent_type` | enum `consent_type` (§3) | Purpose scope | REQ-CNA01 |
|  | `granted` | boolean | Granted (true) or withdrawn (false) | REQ-CNA01, REQ-CNA02 |
|  | `source` | string, not null | Capture mechanism (e.g. `enquiry_form_v1`) | REQ-CNA01 (error: missing source → not recorded) |
|  | `evidence` | string, not null | Human-readable how-consent-was-given | REQ-CNA01 |
|  | `ip_address_hash` | string, nullable | Hashed capture IP | REQ-CNA01 (non-functional: Security) |
|  | `granted_at` | timestamp, not null | When this state began | REQ-CNA01 |

**Invariant (→ REQ-CNA01, REQ-CNA02):** never `UPDATE`d or deleted; current state = latest row per `(prospect_id, consent_type)`, read by REQ-CNA05.

### `audit_log` — owner: `core-consent-audit`
**New** entity — designed here per DR-6 (deferred from Stage 5 to this stage). Append-only, immutable, no update/delete path — matches `consents`' discipline (DR-1 merge shape).

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | UUID | Row identity | REQ-CNA03 |
|  | `occurred_at` | timestamp, not null | When the audited action happened | REQ-CNA03 |
|  | `actor_type` | enum `actor_type` (§3) | Who performed the action | REQ-CNA03 |
|  | `actor_id` | string, nullable | Identifier of the acting identity (nullable only when missing — see error rule) | REQ-CNA03 |
|  | `subject_type` | string, not null | What kind of thing was acted on (e.g. `booking`, `consent`, `refund`) | REQ-CNA03 |
|  | `subject_id` | string, nullable | Identifier of the subject (nullable only when missing) | REQ-CNA03 |
|  | `action` | string, not null | What happened (e.g. `refund_issued`, `consent_withdrawn`, `owner_override`) | REQ-CNA03 |
|  | `detail` | text, nullable | Free-text/JSON detail of the action | REQ-CNA03 |
|  | `complete` | boolean, not null, default `true` | `false` when written with subject/actor missing (error path) | REQ-CNA03 (errors: subject/actor missing → still write, flagged incomplete) |

**Invariant (→ REQ-CNA03):** never modified or deleted; an entry is written even when `actor_id`/`subject_id` is unavailable, with `complete=false` rather than being dropped.

### `prospects` — owner: `pre-sales` — **Built**, confirmed DDL. Full set now authored here (PRE is the owning module); previously only partially restated under `core-consent-audit`'s reference.

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | UUID | Row identity | REQ-PRE04, REQ-PRE06, REQ-CNA01, REQ-CNA04 |
|  | `name` | string, nullable | Captured at point of contact | REQ-PRE04, REQ-PRE06 |
|  | `email` | string, nullable | Primary contact | REQ-PRE04 (error: neither email nor phone → not recorded), REQ-CNA01 |
|  | `phone` | string, nullable | Normalised with country code | REQ-PRE04 (same) |
|  | `whatsapp_ok` | boolean, default false | Explicit opt-in for WhatsApp contact | REQ-PRE04 |
|  | `preferred_channel` | enum (`email`/`whatsapp`/`phone`), nullable | Reply channel preference | REQ-PRE04, REQ-PRE05 |
|  | `locale` | string, nullable | For multi-language follow-up | REQ-PRE04 |
|  | `source` | string, nullable | Analytics source path | REQ-PRE01–03 (presumed telemetry, not this dictionary's concern) |
|  | `first_seen_at` | timestamp, not null | First contact | — |
|  | `last_seen_at` | timestamp, not null | Most recent interaction | — |
|  | `created_at` | timestamp, not null | Row creation | — |
|  | `deleted_at` | timestamp, nullable | PII-blanked marker; row retained | REQ-CNA04 |

**Invariant (→ REQ-PRE04):** `email` or `phone` is never both null. **Invariant (→ REQ-CNA04):** erasure blanks personal fields and sets `deleted_at`; the row is never removed. Erasure is scoped to `prospects` only at v1 (DR-7); bookings/participants PII is **not** erased under this rule — retained until a dedicated rule is designed.

### `enquiries` — owner: `pre-sales` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Enquiry identity (e.g. `ENQ-2001`) | REQ-PRE04 |
|  | `prospect_id` | UUID, FK → `prospects.id` | Who submitted it | REQ-PRE04 |
|  | `type` | enum `enquiry_type` (§3) | group/private/corporate/charity/accessibility/general | REQ-PRE04 |
|  | `party_size` | integer, nullable | Expected number of people | REQ-PRE04 |
|  | `preferred_dates` | string, nullable | Free text or ISO date(s) | REQ-PRE04 |
|  | `preferred_channel` | enum (`email`/`whatsapp`/`phone`) | Owner reply channel — the prospect's choice, not the Owner's | REQ-PRE04, REQ-PRE05 |
|  | `message` | text, nullable | Free-text enquiry body | REQ-PRE04 |
|  | `source_tour_id` | string, nullable | Tour being viewed at time of enquiry (presumed RCA `tours` read) | REQ-PRE04 |
|  | `status` | enum `enquiry_status` (§3) | Lifecycle state | REQ-PRE04, REQ-PRE05; `DOMAIN-LEXICON.md` `enquiries` state table |
|  | `sla_due_at` | timestamp, not null | When the Owner should have responded by | REQ-PRE04 |
|  | `responded_at` | timestamp, nullable | When the Owner actually responded | REQ-PRE05 |
|  | `created_at` | timestamp, not null | Row creation | REQ-PRE04 |

**Invariant (→ REQ-PRE04):** every non-spam enquiry has `sla_due_at` set at creation — never null. **Invariant (→ REQ-PRE05):** `responded_at` is never earlier than `created_at`.

### `saved_tours` — owner: `pre-sales` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Saved-tour identity (e.g. `SAVE-2001`) | REQ-PRE06 |
|  | `prospect_id` | UUID, FK → `prospects.id` | Whose save this is | REQ-PRE06 |
|  | `tour_id` | string | What was saved (presumed RCA `tours` read) | REQ-PRE06 |
|  | `save_method` | string | e.g. `email_modal` | REQ-PRE06 |
|  | `nudge_status` | enum `nudge_status` (§3) | Current follow-up state | REQ-PRE07; `DOMAIN-LEXICON.md` `saved_tours` state table |
|  | `nudge_sent_at` | timestamp, nullable | When the +3-day nudge was sent | REQ-PRE07 |
|  | `unsubscribed_at` | timestamp, nullable | If the prospect unsubscribed from this save's follow-up | REQ-PRE07 |
|  | `created_at` | timestamp, not null | Row creation | REQ-PRE06 |

**Invariant (→ REQ-PRE07):** unique per `(prospect_id, tour_id)` — at most one nudge per pair, ever.

### `bikes` — owner: `fleet-equipment` — **New**, designed here (**ownership corrected 2026-07-21, F-42** — previously drafted under `tour-operations`; ownership moved before this entity was ever built against)

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Bike identifier (e.g. `FOB-001`) | REQ-FLEET01 |
|  | `make` | string | Manufacturer | REQ-FLEET01 |
|  | `model` | string | Model | REQ-FLEET01 |
|  | `frame_size` | string | Frame size | REQ-FLEET01 |
|  | `colour` | string | Colour | REQ-FLEET01 |
|  | `serial_number` | string, nullable | Recommended but not required | REQ-FLEET01 (warning if absent) |
|  | `purchase_date` | date, nullable | — | REQ-FLEET01 |
|  | `route_eligibility` | list of tour ids | Which tours can use this bike | REQ-FLEET01 |
|  | `spare` | boolean, default false | Marks a reserve/spare bike (informational only — **no automated assignment rotation**; allocation is manual per DR-BO2, run Bacon) | REQ-FLEET01 |
|  | `status` | enum `bike_status` (§3) | Current assignability | REQ-FLEET03, 04, 06; DR-F3 (confirmed state machine) |
|  | `last_inspected_at` | timestamp, nullable | Most recent `tour-operations` inspection (read/write via that module's call into this one) | REQ-OPS03 (cross-module write), REQ-FLEET03 |
|  | `notes` | text, nullable | Free-text notes (e.g. unknown second-hand history) | REQ-FLEET01 |
|  | `created_at` | timestamp, not null | Row creation | REQ-FLEET01 |

**Invariant (→ REQ-FLEET04):** a bike with `status=flagged_for_service` is never assignable to a tour until REQ-FLEET06 clears it back to `in_service`. **Declared hole (→ DR-F8, DR-F9):** `retired` and `awaiting_external_service` are valid enum values (state machine confirmed, DR-F3) but no REQ in this module drives a transition into either — deliberate, not an oversight.

### `tour_readiness` — owner: `tour-operations` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Readiness record identity | REQ-OPS07 |
|  | `departure_id` | string, FK → `departures.id` (owned by `booking`) | Which tour-day this covers | REQ-OPS01 |
|  | `guide_id` | string | Assigned guide | REQ-OPS01 |
|  | `kit_check_signed_at` | timestamp, nullable | Step 1 sign-off (typed-confirm, DR-O1) | REQ-OPS02 |
|  | `bike_inspection_signed_at` | timestamp, nullable | Step 2 declaration (full signature, DR-O1) | REQ-OPS03 |
|  | `risk_assessment_signed_at` | timestamp, nullable | Steps 3+3B sign-off (typed-confirm, DR-O1) | REQ-OPS04 |
|  | `all_riders_cleared_at` | timestamp, nullable | Step 2B all-riders declaration (full signature, DR-O1) | REQ-OPS05 |
|  | `briefing_confirmed_at` | timestamp, nullable | Step 4 confirmation | REQ-OPS06 |
|  | `final_signoff_at` | timestamp, nullable | The departure gate itself | REQ-OPS07 |
|  | `status` | enum `readiness_status` (§3) | Aggregate state | REQ-OPS07 |

**Invariant (→ REQ-OPS07):** `status=ready` only when all six prior timestamps are non-null and no step recorded an unresolved flag.

### `rider_checkins` — owner: `tour-operations` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Check-in record identity | REQ-OPS05 |
|  | `departure_id` | string, FK → `departures.id` | Which tour-day | REQ-OPS05 |
|  | `participant_id` | string, FK → `participants.id` (owned by `booking`) | Which rider | REQ-OPS05 |
|  | `bike_id` | string, FK → `bikes.id`, nullable until assigned | Bike fitted to this rider | REQ-OPS05 |
|  | `waiver_reconfirmed_at` | timestamp, nullable | Fresh signature timestamp (F-30) | REQ-OPS05 |
|  | `cleared` | boolean, default false | Whether the rider is cleared to ride | REQ-OPS05 |
|  | `refusal_reason` | string, nullable | Set only if not cleared | REQ-OPS05 |
|  | `guide_notes` | text, nullable | Free-text observations | REQ-OPS05 |
|  | `created_at` | timestamp, not null | Row creation | REQ-OPS05 |

**Invariant (→ REQ-OPS05):** `cleared=true` requires `waiver_reconfirmed_at` to be non-null.

### `incidents` — owner: `tour-operations` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Incident identity | REQ-OPS09 |
|  | `departure_id` | string, FK → `departures.id` | Which tour-day | REQ-OPS09 |
|  | `occurred_at` | timestamp, not null | When the incident happened | REQ-OPS09 |
|  | `location` | string | Guide's position at the time (what3words/GPS, presumed GMT) | REQ-OPS09 |
|  | `type` | enum `incident_type` (§3) | injury/RTC/medical | REQ-OPS09 |
|  | `severity` | string | Guide's initial severity assessment | REQ-OPS09 |
|  | `preliminary_description` | text | Initial log content | REQ-OPS09 |
|  | `formal_report` | text, nullable | Full narrative once submitted | REQ-OPS11 |
|  | `status` | enum `incident_status` (§3) | Lifecycle state | REQ-OPS11, REQ-OPS12; `DOMAIN-LEXICON.md` `incidents` state table |
|  | `insurer_dispatch_at` | timestamp, nullable | **Stub, D-OPS-5 still open** — mechanics pending confirmed insurer format | REQ-OPS12 |

**Invariant (→ REQ-OPS09):** an incident record, once logged, is never modified or deleted (audited via `core-consent-audit` REQ-CNA03).

### `hazard_log` — owner: `tour-operations` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Hazard entry identity | REQ-OPS13 |
|  | `street_name` | string | Location, used for deduplication | REQ-OPS14 |
|  | `hazard_type` | string | e.g. traffic, surface, crowd | REQ-OPS13 |
|  | `description` | text | What was observed | REQ-OPS13 |
|  | `severity` | string, nullable until approved | Set by the Owner at approval | REQ-OPS14 |
|  | `observed_at` | timestamp, not null | When observed | REQ-OPS13 |
|  | `status` | enum `hazard_status` (§3) | Lifecycle state | REQ-OPS13, REQ-OPS14; `DOMAIN-LEXICON.md` `hazard_log` state table |
|  | `last_confirmed_at` | timestamp, nullable | Bumped on a duplicate observation | REQ-OPS14 |

**Invariant (→ REQ-OPS14):** the log never contains two separate approved entries for the same hazard on the same street — a duplicate observation bumps `last_confirmed_at` instead of creating a new row.

### `reminders` — owner: `pre-tour` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Reminder record identity | REQ-TOUR02 |
|  | `booking_id` | string, FK → `bookings.id` | Which booking | REQ-TOUR02 |
|  | `milestone` | string | Currently only `t_minus_1` (DR-T1, light cadence) | REQ-TOUR02 |
|  | `sent_at` | timestamp, not null | When the reminder was sent | REQ-TOUR02 |
|  | `channel` | string, nullable | **Pending D-TOUR-2** — channel choice not yet settled | REQ-TOUR02 |

**Invariant (→ REQ-TOUR02):** at most one `t_minus_1` reminder per booking, ever.

### `weather_advisories` — owner: `pre-tour` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Advisory record identity | REQ-TOUR03 |
|  | `booking_id` | string, FK → `bookings.id` | Which booking | REQ-TOUR03 |
|  | `classification` | enum `advisory_classification` (§3) | Currently only `informational` reachable — **D-TOUR-3 deferred**, no auto-escalation | REQ-TOUR03 |
|  | `forecast_summary` | text | What was forecast | REQ-TOUR03 |
|  | `sent_at` | timestamp, not null | When sent | REQ-TOUR03 |
|  | `superseded_by` | string, nullable, FK → `weather_advisories.id` | Set if a later advisory replaces this one | REQ-TOUR03 |

**Invariant (→ REQ-TOUR03):** `classification` never reaches `action_required` or `cancellation_candidate` until D-TOUR-3 supplies real thresholds — enforced as a design constraint, not just a policy note.

### `operator_notices` — owner: `pre-tour` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Notice identity | REQ-TOUR05 |
|  | `booking_id` | string, FK → `bookings.id` | Which booking | REQ-TOUR05 |
|  | `type` | enum (`change`, `cancellation`) | Which journey produced it | REQ-TOUR05, REQ-TOUR07 |
|  | `old_value` | text, nullable | Prior meeting point/time/guide (change only) | REQ-TOUR05 |
|  | `new_value` | text, nullable | New meeting point/time/guide (change only) | REQ-TOUR05 |
|  | `material` | boolean | Whether acknowledgement is required | REQ-TOUR05, REQ-TOUR06 |
|  | `status` | enum `operator_notice_status` (§3) | Lifecycle state | REQ-TOUR06; `DOMAIN-LEXICON.md` `operator_notices` state table |
|  | `sent_at` | timestamp, not null | When sent | REQ-TOUR05, REQ-TOUR07 |
|  | `acknowledged_at` | timestamp, nullable | When the Customer acknowledged (material changes only) | REQ-TOUR06 |
|  | `remediation_choice` | enum (`refund`, `rebook`, `credit`), nullable | Set only for `type=cancellation` (DR-T5) | REQ-TOUR08 |

**Invariant (→ REQ-TOUR06):** a booking proceeds under new details regardless of `status` — acknowledgement is confirmatory, never a gate.

### `equipment` — owner: `fleet-equipment` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Equipment identity | REQ-FLEET02 |
|  | `type` | enum `equipment_type` (§3) | helmet/first_aid_kit/hi_vis/poncho/gloves/other | REQ-FLEET02 |
|  | `description` | text | Free-text description, entered per item (DR-F10 — line-by-line, no bulk) | REQ-FLEET02 |
|  | `size` | string, nullable | For helmets | REQ-FLEET02 |
|  | `purchase_date` | date | — | REQ-FLEET02 |
|  | `manufacture_date` | date, nullable | Helmets only | REQ-FLEET02 |
|  | `review_due_at` | timestamp, nullable | Annual review reminder (helmets, first aid kits) — no fixed age-expiry (DR-F2) | REQ-FLEET02, REQ-FLEET07 |
|  | `status` | enum `equipment_status` (§3) | Lifecycle state | REQ-FLEET02; `DOMAIN-LEXICON.md` `equipment` state table |
|  | `replacement_of` | string, nullable, FK → `equipment.id` | Set if this item replaces another | REQ-FLEET02 |
|  | `replacement_reason` | string, nullable | impact/expiry/damage/lost/annual_rotation | REQ-FLEET02 |
|  | `created_at` | timestamp, not null | Row creation | REQ-FLEET02 |

**Invariant (→ REQ-FLEET02):** a helmet involved in an impact is retired immediately regardless of `review_due_at`. No photo field exists on this entity (DR-F5).

### `maintenance_events` — owner: `fleet-equipment` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Event identity | REQ-FLEET05 |
|  | `bike_id` | string, FK → `bikes.id` | Which bike | REQ-FLEET05 |
|  | `work_performed` | text | Free text + category (brakes/tyres/chain/gears/wheel/frame/cables/lights/other) | REQ-FLEET05 |
|  | `parts_replaced` | text, nullable | — | REQ-FLEET05 |
|  | `time_taken` | integer, nullable | Minutes, optional | REQ-FLEET05 |
|  | `cost` | integer, nullable | Pence, optional | REQ-FLEET05 |
|  | `notes` | text, nullable | — | REQ-FLEET05 |
|  | `created_at` | timestamp, not null | Row creation | REQ-FLEET05 |

**Invariant (→ REQ-FLEET05):** never modified or deleted once saved. No photo field, no external-service field (DR-F5, DR-F9 — both out of scope).

### `compliance_items` — owner: `fleet-equipment` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Item identity | REQ-FLEET07 |
|  | `type` | enum (`pli`, `el`, `ico`, `helmet_review`, `first_aid_review`) | Core tracking scope (DR-F4) | REQ-FLEET07 |
|  | `related_equipment_id` | string, nullable, FK → `equipment.id` | For helmet/first-aid-specific items | REQ-FLEET07 |
|  | `expiry_or_due_at` | timestamp, not null | When this item is due/expires | REQ-FLEET07 |
|  | `status` | enum `compliance_status` (§3) | Lifecycle state | REQ-FLEET07, REQ-FLEET08; `DOMAIN-LEXICON.md` `compliance_items` state table |
|  | `last_alert_sent_at` | timestamp, nullable | Guards the on-event alert (DR-F7) from re-firing without a status change | REQ-FLEET07 |
|  | `renewed_at` | timestamp, nullable | When last renewed | REQ-FLEET08 |

**Invariant (→ REQ-FLEET07):** an on-event alert fires only when `status` actually changes — `last_alert_sent_at` prevents a duplicate alert for an unchanged status on a subsequent daily check (DR-F7).

### `feedback` — owner: `post-tour` — **New**, designed here

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Feedback identity (e.g. `FB-1001`) | REQ-POST03 |
|  | `booking_id` | string, FK → `bookings.id` | Which booking | REQ-POST03 |
|  | `overall_rating` | integer, 1–5 | Overall rating | REQ-POST03 |
|  | `guide_rating` | integer, 1–5 | Guide rating | REQ-POST03 |
|  | `value_rating` | integer, 1–5 | Value-for-money rating | REQ-POST03 |
|  | `would_recommend` | enum (`yes`/`maybe`/`no`) | — | REQ-POST03 |
|  | `free_text` | text, nullable | Optional comments | REQ-POST03 |
|  | `owner_alerted` | boolean, default false | Set true when `overall_rating` ≤3 triggers the direct alert (DR-PT2) | REQ-POST03 |
|  | `created_at` | timestamp, not null | Row creation | REQ-POST03 |

**Invariant (→ REQ-POST03, DR-PT2):** `owner_alerted` is always true when `overall_rating` ≤3 — the alert is never skipped for a qualifying rating. *(Deferred, not modelled here: testimonial-consent, sentiment/keyword fields, and recovery-outcome linkage — all belong to journeys deferred to a future phase.)*

### `auth_session` — owner: `core-auth` — lives in **Cloudflare KV**, not D1
**New** — designed here; not previously in the lexicon's attribute tables (KV records were only Referenced). Keyed by its own token, per DR-2 (JWT+KV, revocable).

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `token` | string (KV key) | The session's own identifier, carried by the JWT | REQ-AUTH01, REQ-AUTH02 |
|  | `actor_type` | enum `auth_actor_type` (§3) | Owner / secondary-operator / customer | REQ-AUTH01, REQ-AUTH02 |
|  | `actor_id` | string, not null | Which Owner/secondary-operator/customer | REQ-AUTH01, REQ-AUTH02 |
|  | `booking_id` | string, nullable | Set only for customer (booking) sessions — scopes access to one booking | REQ-AUTH02 (invariant: grants access to exactly one booking) |
|  | `created_at` | timestamp, not null | Session start | REQ-AUTH01, REQ-AUTH02 |
|  | `expires_at` | timestamp, not null | `created_at` + 1h — fixed lifetime | REQ-AUTH04 (invariant: never outlives 1h) |
|  | `revoked_at` | timestamp, nullable | Set when explicitly revoked; record is deleted from KV at that point | REQ-AUTH05 |

**Invariant (→ REQ-AUTH04):** a session older than `expires_at` grants no access, enforced server-side. **Invariant (→ REQ-AUTH05):** revocation removes the KV record synchronously — `revoked_at` is transitional state only for audit purposes if logged via `audit_log`, not a queryable KV field once removed.

### `devices` — owner: `core-auth` — **Referenced** (deployed route-pipeline schema; columns inferred, not confirmed DDL)

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `device_id` | string | The `X-Device-ID` header value | REQ-AUTH03 |
|  | `guide_id` | string, FK → `guides.id` | Which guide the device is registered to | REQ-AUTH03 |
|  | `status` | string (presumed: active/inactive) | Whether the device is currently recognised | REQ-AUTH03 (error: not registered → refused) |

*Confirm against `api/src/db/schema.sql` before use — inferred, not confirmed DDL (per Lexicon §4).*

### `guides` — owner: `core-auth` — **Referenced**, same caveat as `devices`

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Guide identity | REQ-AUTH03 |
|  | `name` | string | Guide name (matches lexicon fixture "Emma") | REQ-AUTH03 |

### `message` — owner: `core-notifications`
**New** — designed here; implied by REQ-NOTIF01–04 (not previously an attribute table, only named as a concept in the Lexicon term list).

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | UUID | Message identity (e.g. `MSG-1001`) | REQ-NOTIF01 |
|  | `message_type` | enum `message_type` (§3) | transactional / marketing / owner_alert | REQ-NOTIF01, REQ-NOTIF04 |
|  | `recipient` | string, not null | Contact address/number | REQ-NOTIF01 (error: no contact address → not sent) |
|  | `event` | string, not null | Triggering event (e.g. `booking_confirmed`, `reminder_due`) | REQ-NOTIF01 |
|  | `idempotency_key` | string, not null, unique | Guards one-send-per-event-per-person | REQ-NOTIF01, REQ-NOTIF03 |
|  | `provider` | string | Delivery provider used (`postmark` at v1 — interim default, D-NOTIF-2 still open) | REQ-NOTIF01 |
|  | `provider_ref` | string, nullable | Provider's own reference, used to match callbacks | REQ-NOTIF02 |
|  | `status` | enum `message_status` (§3) | Current delivery state | REQ-NOTIF01, REQ-NOTIF02 |
|  | `created_at` | timestamp, not null | When the send was attempted | REQ-NOTIF01 |
|  | `sent_at` | timestamp, nullable | When handed to the provider | REQ-NOTIF01 |

**Invariant (→ REQ-NOTIF03):** at most one delivered message per `idempotency_key`; reuses the `webhook_events` pattern (DR-8) for the idempotency check itself, this table is the message log it guards.

### `webhook_events` — owner: `core-notifications` (idempotency store, DR-8) — **Referenced** (Stripe PoC schema; columns inferred)

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `idempotency_key` | string | The key being guarded | REQ-NOTIF03 (D-NOTIF-3 / DR-8: D1, not KV) |
|  | `processed_at` | timestamp | When this key was first honoured | REQ-NOTIF03 |

*Confirm against the PoC schema before use — inferred, not confirmed DDL.*

### `email_events` — owner: `core-notifications` — **Referenced** (PoC schema; columns inferred)

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Event identity | REQ-NOTIF02 |
|  | `message_id` | string, FK → `message.id` | Which message this callback concerns | REQ-NOTIF02 |
|  | `event_type` | string (presumed: delivered/bounced/complaint) | Provider outcome | REQ-NOTIF02 |
|  | `occurred_at` | timestamp | When the provider reported it | REQ-NOTIF02 |

**Invariant (→ REQ-NOTIF02):** an outcome referencing an unknown message is still recorded, flagged unmatched, never dropped.

### `departures` — owner: `booking` — **Referenced** (admin-rome migration table; columns not confirmed DDL)

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Departure identity (e.g. `DEP-HID-2026-08-01-1000`) | REQ-BOOK01 |
|  | `tour_id` | string | Which tour this is a dated instance of | REQ-BOOK01 |
|  | `date` | date | Departure date | REQ-BOOK01 |
|  | `time` | time | Departure time | REQ-BOOK01 |
|  | `capacity` | integer | Maximum party size across all bookings, max 10 (F-19) | REQ-BOOK01 |
|  | `held_count` | integer | Party size currently held (unpaid, in-flow) | REQ-BOOK01, DR-B3 (D1 transactional decrement) |
|  | `confirmed_count` | integer | Party size confirmed (paid or provisionally-confirmed) | REQ-BOOK04, REQ-BOOK10 |
|  | `grace_period_minutes` | integer | Per-tour late-arrival grace period, configurable (DR-T6) | REQ-TOUR09, REQ-TOUR10 *(field consumed by `pre-tour`, owned here by `booking`)* |
|  | `guide_id` | string, FK → `guides.id`, **nullable** | Assigned guide; null ⇒ derived "not ready to run" (DR-BO5) | **REQ-BOOK11** (set at/after create), **REQ-BOOK12** (reassign) |
|  | `status` | enum `departure_status` (§3) | Scheduling state | **REQ-BOOK11** (→ `scheduled`), **REQ-BOOK13** (→ `cancelled`) |

**Invariant (→ REQ-BOOK01, invariant):** `held_count + confirmed_count` never exceeds `capacity`. Decrement/restore on hold, confirm, cancel, and abandon are each one atomic D1 operation (DR-B3) — never a separate hold table plus sweep.
**Invariant (→ REQ-BOOK11, DR-BO4):** a departure is a single dated instance — no recurrence/series field (recurring patterns deferred). Uniqueness on `(tour_id, date, time)` (REQ-BOOK11 error case).
**Derived (→ REQ-BO04, run Bacon):** *readiness* on the departure calendar = `status = scheduled` AND `guide_id` is not null AND the departure has active `bike_assignments` covering its booked party size. Not a stored field.
**Note (→ REQ-BOOK12):** a *material* change (a change to `date`/`time` on a departure with bookings) is detected by comparison, not a stored flag; `back-office` orchestration drives the customer notice via `pre-tour` REQ-TOUR05 (kept off `booking` to preserve acyclic dependencies).

### `bookings` — owner: `booking` — **Referenced** (admin-rome migration table; columns not confirmed DDL)

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Booking identity (e.g. `BK-1001`) | all BOOK REQs |
|  | `departure_id` | string, FK → `departures.id` | Which departure this booking holds capacity against | REQ-BOOK01 |
|  | `status` | enum `booking_status` (§3) | Lifecycle state | REQ-BOOK01, 04, 05, 06, 07, 09, 10 |
|  | `source` | enum `booking_source` (§3) | How the booking originated | REQ-BOOK01, REQ-BOOK08, REQ-BOOK10 |
|  | `party_size` | integer, 1–10 | Number of attendees (F-19) | REQ-BOOK01 |
|  | `price_total_pence` | integer | Agreed total price (may differ from standard for owner-created bookings) | REQ-BOOK04, REQ-BOOK08 |
|  | `waiver_accepted_at` | timestamp, nullable | Party-level digital waiver acceptance (DR-B7) | REQ-BOOK03 |
|  | `terms_accepted_at` | timestamp, nullable | T&C acceptance | REQ-BOOK03 |
|  | `emergency_contact_name` | string, nullable | One emergency contact per booking, not per attendee (DR-B6) | REQ-BOOK02 |
|  | `emergency_contact_phone` | string, nullable | — | REQ-BOOK02 |
|  | `emergency_contact_relationship` | string, nullable | Relationship to lead booker | REQ-BOOK02 |
|  | `hold_expires_at` | timestamp, nullable | Owner-set for provisional bookings (DR-B2); slot-hold expiry for in-flow drafts otherwise | REQ-BOOK01, REQ-BOOK10 |
|  | `deposit_required_pence` | integer, nullable | Owner-set per provisional booking, no system-wide default (DR-B2) | REQ-BOOK10 |
|  | `reminder_cadence` | string, nullable | Owner-set per provisional booking, free-form until a pattern emerges (DR-B2) | REQ-BOOK10 |
|  | `created_at` | timestamp | — | REQ-BOOK01 |
|  | `confirmed_at` | timestamp, nullable | — | REQ-BOOK05 |
|  | `cancelled_at` | timestamp, nullable | — | REQ-BOOK07 |

**Invariant (→ REQ-BOOK05):** a booking transitions to `confirmed` at most once per payment, driven by the provider's success report, never by the customer's post-payment landing view (F-14). **Invariant (→ REQ-BOOK10):** `hold_expires_at` is never null for a `provisionally-confirmed` booking — no indefinite hold (DR-B2's safety direction).

### `participants` — owner: `booking` — **Referenced** (admin-rome migration table; columns not confirmed DDL)

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Attendee identity | REQ-BOOK02 |
|  | `booking_id` | string, FK → `bookings.id` | Which booking this attendee belongs to | REQ-BOOK02 |
|  | `name` | string | Attendee name | REQ-BOOK02 |
|  | `age_band` | enum (presumed: under-12/12–17/18+/60+) | Age band, per the source journey doc | REQ-BOOK02 |
|  | `contact_role` | enum (`leader`/`co-leader`/`attendee`) | The attendee's role as a party point of contact (DR-B12a). Exactly one `leader` (main contact) per booking; any number of `co-leader`s (additional contacts); the rest `attendee`. Replaces `is_lead_booker`. | REQ-BOOK02, REQ-BOOK15 |
|  | `is_lead_booker` | boolean | **Deprecated (DR-B12a)** — retained and kept in sync (`= contact_role == 'leader'`) for legacy lead-name lookups; new code reads `contact_role` | REQ-BOOK02 |
|  | `notes` | text, nullable | Mobility/fitness/dietary/medical notes relevant to safety | REQ-BOOK02 |

*Note: emergency contact is **not** a `participants` field (DR-B6 — one per booking, not per attendee); it lives on `bookings`.*

### `payments` — owner: `booking` — **Referenced** (POC-verified schema pattern, F-20; not confirmed against admin-rome's production table)

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Payment attempt identity | REQ-BOOK04 |
|  | `booking_id` | string, FK → `bookings.id` | Which booking this payment is for | REQ-BOOK04 |
|  | `session_id` | string | The Checkout Session id | REQ-BOOK04 |
|  | `status` | enum `payment_status` (§3) | Current payment state | REQ-BOOK04, REQ-BOOK05 |
|  | `amount_pence` | integer | Amount charged | REQ-BOOK04 |
|  | `refund_amount_pence` | integer, default 0 | **Cumulative** refunded total — read from the provider's `charge.amount_refunded`, never accumulated from a single refund's own amount (F-20) | REQ-BOOK07 |
|  | `idempotency_key` | string, unique | Client-supplied key guarding session creation (F-15) | REQ-BOOK04 |
|  | `created_at` | timestamp | — | REQ-BOOK04 |

**Invariant (→ REQ-BOOK04, F-15):** the D1 insert on `session_id` is itself idempotent (`INSERT OR IGNORE` or equivalent) — an idempotent provider API does not make the local write idempotent on its own.

### `bike_assignments` — owner: `booking` — **New**, designed here (DR-BO2a resolved 2026-07-21 — "the booking side holds the designated bike details")

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | string | Assignment identity | REQ-BOOK14 |
|  | `departure_id` | string, FK → `departures.id` | The tour-day this bike is allocated to | REQ-BOOK14 |
|  | `bike_id` | string, FK → `bikes.id` *(owned by `fleet-equipment`; read cross-module — `booking` `depends-on fleet-equipment`)* | The specific bike allocated | REQ-BOOK14 |
|  | `assigned_at` | timestamp | When the allocation was made | REQ-BOOK14 |
|  | `removed_at` | timestamp, nullable | Set if the bike is de-allocated before the tour; null = active | REQ-BOOK14 |

**Invariant (→ REQ-BOOK14):** a bike is never in two *active* (`removed_at IS NULL`) assignments whose departures overlap in time — this is REQ-BOOK14's "never assigned to two overlapping departures". Only an `in-service` bike (read from `fleet-equipment` at assignment time) is ever assigned.
**Surface/write split:** `back-office` A20 is the allocation surface; the write is REQ-BOOK14 (`booking`). The guide's pre-tour inspection (`tour-operations` REQ-OPS03) reads the active assignments for the departure — resolving the old "assigned bikes" presumption (F-BO-3).

---

## 3. Enum registry (single source for ALL closed value sets)

| Enum | Values | Used by | Governed by |
|---|---|---|---|
| `consent_type` | `marketing_email`, `marketing_whatsapp`, `data_processing`, `cookies_analytics`, `cookies_marketing` | `consents.consent_type` | Built DDL (Data Model §2) — unchanged |
| `actor_type` (audit) | `owner`, `secondary_operator`, `customer`, `guide`, `system_cron`, `system_webhook` | `audit_log.actor_type` | Lexicon §2 actor list |
| `auth_actor_type` | `owner`, `secondary_operator`, `customer` | `auth_session.actor_type` | REQ-AUTH01, REQ-AUTH02 (guides never hold a KV session — Lexicon "Device identity" distinct-from) |
| `message_type` | `transactional`, `marketing`, `owner_alert` | `message.message_type` | REQ-NOTIF01, REQ-NOTIF04; Lexicon "Transactional message"/"Marketing message" |
| `message_status` | `queued`, `sent`, `delivered`, `bounced`, `failed_complaint`, `delivery_pending` | `message.status` | REQ-NOTIF01, REQ-NOTIF02; Lexicon §5 Notification/message states |
| `schema_org_type` | `TouristAttraction`, `LocalBusiness`, `Product` | REQ-SEO01 structured-data output | DR-9 (`Decision_Record_Aristotle_2026-07-20.md`) — closed scope, `Event` explicitly excluded |
| `booking_status` | `draft`, `confirmed`, `provisionally-confirmed`, `cancelled`, `abandoned` | `bookings.status` | REQ-BOOK01, 04, 05, 06, 07, 09, 10; `DOMAIN-LEXICON.md` `booking` state table |
| `booking_source` | `direct`, `owner-created`, `provisional` *(`ota` reserved, not active — UJ-BOOK-08 deferred)* | `bookings.source` | REQ-BOOK01, REQ-BOOK08, REQ-BOOK10 |
| `payment_status` | `pending`, `succeeded`, `partially_refunded`, `refunded`, `failed` | `payments.status` | REQ-BOOK04, REQ-BOOK05, REQ-BOOK07; `DOMAIN-LEXICON.md` `payments` state table |
| `departure_status` | `scheduled`, `cancelled` | `departures.status` | **REQ-BOOK11** (→scheduled), **REQ-BOOK13** (→cancelled) — run Bacon |
| `enquiry_type` | `group`, `private`, `corporate`, `charity`, `accessibility`, `general` | `enquiries.type` | REQ-PRE04 |
| `enquiry_status` | `open`, `acknowledged`, `responded`, `converted`, `closed`, `spam` | `enquiries.status` | REQ-PRE04, REQ-PRE05; `DOMAIN-LEXICON.md` `enquiries` state table |
| `nudge_status` | `pending`, `sent`, `suppressed`, `unsubscribed`, `converted` | `saved_tours.nudge_status` | REQ-PRE06, REQ-PRE07; `DOMAIN-LEXICON.md` `saved_tours` state table |
| `bike_status` | `in_service`, `failed_out_of_service`, `flagged_for_service` | `bikes.status` | REQ-OPS03; DR-O3 |
| `readiness_status` | `in_progress`, `ready`, `blocked` | `tour_readiness.status` | REQ-OPS07 |
| `incident_type` | `injury`, `rtc`, `medical` | `incidents.type` | REQ-OPS09 |
| `incident_status` | `submitted`, `insurer_ack`, `reviewed`, `closed` | `incidents.status` | REQ-OPS11, REQ-OPS12; `DOMAIN-LEXICON.md` `incidents` state table |
| `hazard_status` | `pending_review`, `approved`, `archived` | `hazard_log.status` | REQ-OPS13, REQ-OPS14; `DOMAIN-LEXICON.md` `hazard_log` state table |
| `advisory_classification` | `informational` (only reachable value — DR-T3 defers the rest) | `weather_advisories.classification` | REQ-TOUR03 |
| `operator_notice_status` | `sent`, `acknowledged`, `unacknowledged_overdue` | `operator_notices.status` | REQ-TOUR06; `DOMAIN-LEXICON.md` `operator_notices` state table |
| `bike_status` | `in_service`, `flagged_for_service`, `in_maintenance`, `awaiting_external_service`, `out_of_service`, `retired` | `bikes.status` | DR-F3 (confirmed); REQ-FLEET03/04/06 reach only the first three + declared holes for the last two |
| `equipment_type` | `helmet`, `first_aid_kit`, `hi_vis`, `poncho`, `gloves`, `other` | `equipment.type` | REQ-FLEET02 |
| `equipment_status` | `in_service`, `lost`, `retired` | `equipment.status` | REQ-FLEET02; `DOMAIN-LEXICON.md` `equipment` state table |
| `compliance_status` | `in_date`, `pending`, `critical`, `revoked` | `compliance_items.status` | REQ-FLEET07, REQ-FLEET08; `DOMAIN-LEXICON.md` `compliance_items` state table |

---

## 4. Relationships (confirms/extends the Lexicon table)

| Parent | Child | Cardinality | Note |
|---|---|---|---|
| `prospects` | `consents` | 1 : N | append-only history per prospect (Lexicon §6, unchanged) |
| (any subject) | `audit_log` | 1 : N | every audited action references its subject via `subject_type`/`subject_id` |
| `guides` | `devices` | 1 : N | device-scoped auth (Lexicon §6, unchanged) |
| `message` | `email_events` | 1 : N | multiple provider callbacks per send (Lexicon §6, unchanged — renamed from generic "delivery event") |
| owner/secondary-operator/customer | `auth_session` | 1 : N (over time) | one active session per actor at a time in practice; not a DB-enforced constraint, a REQ-AUTH01/02 behavioural one |
| `departures` | `bookings` | 1 : N | one departure holds many bookings up to its capacity (DR-B3) |
| `guides` | `departures` | 1 : N | a guide is assigned to many departures over time; `departures.guide_id` nullable at creation (DR-BO5, run Bacon) |
| `bikes` ↔ `departures` | via `bike_assignments` (owner `booking`) | N : N | REQ-BOOK14 — a bike serves many departures over time; a departure has many assigned bikes; active-overlap forbidden (DR-BO2a resolved) |
| `bookings` | `participants` | 1 : N | one booking has one or more attendees; emergency contact is per-booking, not per-participant (DR-B6) |
| `bookings` | `payments` | 1 : N | a booking may have multiple payment attempts (retries) but at most one `succeeded` |
| `prospects` | `enquiries` | 1 : N | one prospect may submit multiple enquiries over time |
| `prospects` | `saved_tours` | 1 : N | one nudge per `(prospect, tour)` pair — unique |
| `enquiries` | `bookings` | 0/1 : 1 | a converted enquiry links to exactly one booking (REQ-BOOK08) |
| `departures` | `tour_readiness` | 1 : 1 | one readiness record per tour-day |
| `departures` | `rider_checkins` | 1 : N | one check-in row per rider present |
| `participants` | `rider_checkins` | 1 : N (typically 1) | a participant's on-day check-in record |
| `bikes` | `rider_checkins` | 1 : N | one bike may be assigned across multiple check-ins (different tour-days) |
| `departures` | `incidents` | 1 : N | most tours have none; rare when they occur |
| `bookings` | `reminders` | 1 : N (in practice 1, DR-T1 light cadence) | one T-1 reminder per booking |
| `bookings` | `weather_advisories` | 1 : N | 0–2 typically per booking |
| `bookings` | `operator_notices` | 1 : N | one row per change/cancellation event |
| `bikes` | `maintenance_events` | 1 : N | permanent history, never deleted |
| `equipment` | `equipment` (self) | 0/1 : N | a replacement links to the item it replaces |
| `equipment` | `compliance_items` | 0/1 : N | helmet/first-aid-specific compliance items link to their equipment row |

---

## 5. Known inconsistencies (target: zero, or explicitly deferred)

None found while deriving this dictionary from the ratified specs. The two still-open Decision Record items (D-NOTIF-1, D-NOTIF-2) are **not** dictionary inconsistencies — they're upstream architecture/vendor choices this dictionary correctly doesn't pre-empt (`message.provider` is left as a plain string, not an enum, precisely because D-NOTIF-2 hasn't settled the final vendor). D-DATA-3 is now resolved (DR-B3).

Two **unowned-ground gaps** surfaced during `booking`'s ratification are not dictionary inconsistencies either, but are worth restating here since they touch data that doesn't exist yet: the on-day individual paper waiver (DR-B7) has no owning module or table; the abandonment-recovery email (DR-B8) has no owning REQ in `core-notifications`/`core-consent-audit` yet. Neither is modelled in this dictionary — nothing to design against until they're authored.

---

## Revision History

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 0.1 | 2026-07-20T00:00:00Z | Initial data dictionary derived from the ratified Lean-6 module specs: 9 entities (2 Built, 3 New, 4 Referenced), 6 registered enums, relationships table, zero open inconsistencies. |
| 0.2 | 2026-07-20T00:00:00Z | Added `booking` module's 4 entities (`departures`, `bookings`, `participants`, `payments`, all Referenced), 3 new enums (`booking_status`, `booking_source`, `payment_status`), 3 new relationships. D-DATA-3 marked resolved (DR-B3). Two unowned-ground data gaps noted (on-day waiver, abandonment email) — not modelled, no owning REQ yet. |
| 0.3 | 2026-07-20T00:00:00Z | `prospects` promoted from partial reference to full entity, authored by its owning module `pre-sales`. Added 2 new entities (`enquiries`, `saved_tours`, both New), 3 new enums, 3 new relationships. |
| 0.4 | 2026-07-20T00:00:00Z | Added `tour-operations`'s 5 entities (`bikes`, `tour_readiness`, `rider_checkins`, `incidents`, `hazard_log`, all New), 5 new enums, 5 new relationships. `incidents.insurer_dispatch_at` explicitly flagged as a stub pending D-OPS-5. |
| 0.5 | 2026-07-21T00:00:00Z | Added `pre-tour`'s 3 entities (`reminders`, `weather_advisories`, `operator_notices`, all New), 2 new enums, 3 new relationships. `departures.grace_period_minutes` added (owned by `booking`, consumed by `pre-tour`, DR-T6). `weather_advisories.classification` constrained to `informational` only pending D-TOUR-3. |
| 0.6 | 2026-07-21T00:00:00Z | **Ownership correction:** `bikes` re-authored under `fleet-equipment` (was drafted under `tour-operations`, F-42) with a fuller field set. Added `equipment`, `maintenance_events`, `compliance_items` (all New, `fleet-equipment`-owned), 4 new enums, 3 new relationships. `retired`/`awaiting_external_service` on `bikes` explicitly marked as declared holes (DR-F8/F9 — confirmed states, no driving REQ). |
| 0.7 | 2026-07-21T00:00:00Z | Added `post-tour`'s 1 entity (`feedback`, New) for its tight-scope build. `public_reviews`, `recovery_contacts`, and `prospects.lifecycle_status` (all previously drafted) explicitly re-flagged as deferred, not built this pass. Fixed a Decision-Record ID collision — `post-tour`'s DR codes renamed DR-P1–P4 → DR-PT1–PT4 to avoid clashing with `pre-sales`'s existing DR-P1–P4. |
| 0.8 | 2026-07-21T00:00:00Z | **Run Bacon (`back-office`).** Extended `departures` with `guide_id` (nullable, DR-BO5) and `status` for the relocated scheduling REQs (REQ-BOOK11/12/13); added `departure_status` enum; added `guides→departures` relationship; readiness declared derived, material-change declared non-stored (acyclic-dependency note). `bike_assignments` added as a **deferred** New entity (DR-BO2a — ownership fleet-vs-booking unruled, not persisted until then). `bikes.spare` note corrected — auto-assignment rotation retired (DR-BO2). |
| 0.9 | 2026-07-21T00:00:00Z | **DR-BO2a resolved (booking owns).** `bike_assignments` designed as a real `booking`-owned entity (`id`, `departure_id`, `bike_id` cross-module FK, `assigned_at`, `removed_at`) with the active-overlap invariant (REQ-BOOK14); `bikes↔departures` relationship un-deferred; departure readiness now references active assignments. Resolves the F-BO-3 "assigned bikes" presumption. |
