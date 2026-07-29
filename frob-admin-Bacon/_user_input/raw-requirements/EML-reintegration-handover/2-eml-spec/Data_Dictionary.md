# Friends on Bikes — Email Workflows — Data Dictionary

| | |
|---|---|
| **Document** | Data Dictionary |
| **Version** | 0.7 |
| **Date** | 2026-07-25 |
| **Status** | PROPOSED — derived from `EML.md` v0.11 (Reliable for all 18 requirements, no open questions); New-entity fields are PROPOSED design, not Reliable, per ROME-GUIDE-001 Part 5 |
| **Sources** | `B-documentation/EML.md` v0.11, `B-documentation/Decision_Record_2026-07-23.md` (DR-1..DR-9), `B-documentation/Decision_Record_2026-07-24.md` (DR-10, DR-11, DR-12), `B-documentation/Decision_Record_2026-07-25.md` (DR-13, DR-14, DR-15), `A-gathering/DOMAIN-LEXICON.md` v0.2 §3–6; inherited `.../frob-admin-Bacon/_user_input/raw-requirements/Data_Dictionary.md` (pattern reference, cited not copied); bandy v0.10 |

**Precedence:** where this dictionary and `EML.md` disagree, `EML.md`'s REQs win (this doc is derived, not authored ahead of it). Where this dictionary and `DOMAIN-LEXICON.md` disagree, the lexicon wins per its own precedence rule.

## 1. Conventions
- **Timestamps:** ISO-8601, UTC — matches `EML.md`'s fixtures (e.g. `2026-08-01`).
- **Money:** pence, integer — inherited convention (FOB Data Dictionary §1); no money field is authored here yet (refund amounts are computed and owned by `booking`, not EML — see Module Map §4 unowned ground), but any future EML field carrying an amount must follow this convention.
- **Primary keys:** UUID, matching the inherited FOB convention.
- **Ownership:** both tables below are owned and written by `EML` only. `sent_emails.booking_id` references `bookings`, owned externally by `booking` (Referenced, not written here).
- **Enum discipline:** every closed value set used by a REQ is registered once in §3 below. A new value is a dictionary revision first, never a spec-local addition.
- **Business-rule enforcement (DR-6):** fields governed by a business rule (e.g. `sent_emails.status` transitions, `email_templates` lifecycle) are computed/validated by the presumed Cloudflare Workers API layer, not by any client (web admin module or the deferred Claude agent interface). This dictionary states the field-level facts; enforcement logic itself is Stage 6d/build territory, not authored here.

## 2. Entities

### `email_templates` — owner: `EML`
**New** entity (`DOMAIN-LEXICON.md` §3). One row per named template (e.g. "T-24hr Reminder", "Company Cancellation").

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | UUID | Row identity | REQ-EML10 |
|  | `use_case` | enum `template_use_case` (§3) | Which journey/send type this template serves | REQ-EML10 |
|  | `status` | enum `template_status` (§3) | Lifecycle state | REQ-EML10 (state table, `DOMAIN-LEXICON.md` §5) |
|  | `content` | text, not null | The template body/copy | REQ-EML10 |
|  | `created_at` | timestamp, not null | Row creation | REQ-EML10 |
|  | `published_at` | timestamp, nullable | When it moved draft→active | REQ-EML10 |
|  | `retired_at` | timestamp, nullable | When it moved active→retired | REQ-EML10 |

**Invariant (→ REQ-EML10):** at most one `active` template per `use_case` at a time.

### `sent_emails` — owner: `EML`
**New** entity. One row per dispatched instance of a template.

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | UUID | Row identity | REQ-EML01/02/05/06/07/08/09 |
|  | `template_id` | UUID, FK → `email_templates.id`, nullable | Which template this send used (nullable only for REQ-EML09's manual, non-templated enquiry replies) | REQ-EML01/02/05/06/07/08 |
|  | `booking_id` | UUID, FK → `bookings.id` (external, `booking` module), nullable | The Booking this send relates to (nullable for enquiry replies, which relate to an Enquiry not yet a Booking) | REQ-EML01/02/03/04/05/06/07/08 |
|  | `use_case` | enum `template_use_case` (§3) | Which send type this is | matches `email_templates.use_case` where `template_id` is set |
|  | `milestone` | enum `reminder_milestone` (§3), nullable | For reminder sends only — which cadence point (T-7 or T-24hr) | REQ-EML02 (DR-3) |
|  | `status` | enum `sent_email_status` (§3) | Delivery lifecycle state | REQ-EML01/02/05/06/07/08/09 for queued→sent; owned by presumed `core-notifications` subsystem for sent→delivered/bounced/failed (`DOMAIN-LEXICON.md` §5) |
|  | `explanation_block_id` | UUID, FK → `explanation_blocks.id`, nullable | Set only for company-initiated cancellation sends | REQ-EML05 |
|  | `thread_id` | UUID, FK → `email_threads.id`, nullable | Which conversation this send belongs to (nullable until threading is populated retroactively for pre-existing sends) | REQ-EML11/12 |
|  | `sent_at` | timestamp, nullable | When dispatched | REQ-EML01/02/05/06/07/08/09 |

**Invariant (→ REQ-EML01, REQ-EML08):** at most one `booking-confirmation` send and at most one `review-request` send per `booking_id`. **Invariant (→ REQ-EML02, DR-3):** at most one `reminder` send per `(booking_id, milestone)` pair.

**Thread-reply sends (→ REQ-EML17, DR-13):** a reply is a `sent_emails` row with `template_id = null` (free text, same non-templated pattern as REQ-EML09's enquiry replies) and `use_case = 'thread_reply'` — a value outside the closed `template_use_case` enum (§3) since it has no template, matching how REQ-EML09's sends are already handled. Its `booking_id` and thread association come from the Email Thread being replied to (already established by REQ-EML11/14), never computed fresh by the reply itself.

**Recipient-set fan-out (→ EML.md F-18/F-19, DR-10):** a `sent_emails` row records one *send event* for a Booking's use-case, not one address. At dispatch time, the message reaches the Booking's Party Leader (the existing single-recipient contact this field already assumed) plus every `co_leaders` row currently `opted_in = true` for that `booking_id`. This dictionary does not model a separate join table or per-recipient delivery row for that fan-out — recipient resolution (Party Leader address + opted-in Co-leader addresses) is a read at dispatch time against `bookings` (external) and `co_leaders` (below), not a new field on `sent_emails` itself. Any future need to track delivery per individual recipient (e.g. per-address bounce tracking) is a scope question for a later revision, not decided here.

### `co_leaders` — owner: `EML`
**New** entity (`DOMAIN-LEXICON.md` §3, added 2026-07-24). One row per additional recipient a Party Leader or Owner has added to a Booking. Storage is EML-owned (DR-11, `Decision_Record_2026-07-24.md`) — **not** an extension of the external `booking` module's schema.

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | UUID | Row identity | REQ-EML15/16 |
|  | `booking_id` | UUID, FK → `bookings.id` (external, `booking` module) | The Booking this Co-leader is attached to | REQ-EML15/16 |
|  | `name` | string, nullable | Co-leader's name, as supplied when added | REQ-EML15/16 |
|  | `email` | string, not null | Co-leader's address — the only required field | REQ-EML15/16 (error: empty → "Add an email address for this co-leader") |
|  | `opted_in` | boolean, not null, default true | Single all-or-nothing switch controlling whether this Co-leader receives the Booking's sends (F-18) — no per-email-type granularity | REQ-EML15/16 |
|  | `created_at` | timestamp, not null | When added | REQ-EML15/16 |

**Invariant (→ EML.md F-19):** a `co_leaders` row carries no reference to any action, reply, or request of its own anywhere in this schema — it is referenced only as a recipient, never as an actor. **Invariant (→ REQ-EML11, DR-10):** a `co_leaders.email` may also be recognised by the inbound categorisation cascade's sender-address-lookup step (REQ-EML11 step 4), on equal footing with the Booking's Party Leader address.

### `explanation_blocks` — owner: `EML`
**New** entity, a sub-record referenced by a cancellation `sent_emails` row.

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | UUID | Row identity | REQ-EML05 |
|  | `text` | text, not null | The free-text explanation, pasted in by the Owner (DR-2) | REQ-EML05 (error: empty text → send blocked) |
|  | `created_at` | timestamp, not null | When authored | REQ-EML05 |

### `email_threads` — owner: `EML`
**New** entity, sponsor scope 2026-07-23. Groups `sent_emails`/`received_emails` belonging to one conversation.

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | UUID | Row identity | REQ-EML11/12 |
|  | `subject` | text, not null | The (normalised) subject line shared by the thread | REQ-EML11 |
|  | `booking_id` | UUID, FK → `bookings.id` (external), nullable | Booking this thread relates to, set when `categorisation_status = linked` | REQ-EML11, REQ-EML12 (search), REQ-EML14 (manual set) |
|  | `enquiry_id` | UUID, FK → `enquiries.id` (external), nullable | Enquiry this thread relates to, set when `categorisation_status = linked` | REQ-EML11, REQ-EML12 (search), REQ-EML14 (manual set) |
|  | `categorisation_status` | enum `categorisation_status` (§3) | Outcome of the categorisation cascade — `linked`/`unlinked`/`ambiguous` | REQ-EML11 (state table, `DOMAIN-LEXICON.md` §5), REQ-EML14 (unlinked/ambiguous → linked) |
|  | `categorisation_method` | enum `categorisation_method` (§3), nullable | Which cascade step produced a `linked` result, or `manual` if set via REQ-EML14 | REQ-EML11, REQ-EML14 |
|  | `ambiguous_candidates` | JSON array of UUIDs, nullable | Candidate Booking/Enquiry ids recorded when `categorisation_status = ambiguous`; cleared once linked | REQ-EML11, REQ-EML14 |
|  | `created_at` | timestamp, not null | When the thread started | REQ-EML11 |

**Invariant (→ REQ-EML11):** `categorisation_status = linked` if and only if exactly one of `booking_id`/`enquiry_id` is set. **Invariant (→ REQ-EML11):** `categorisation_method` is never set by an ambiguous or absent match — only an exact, unambiguous cascade step (or a manual REQ-EML14 action) sets it.

### `received_emails` — owner: `EML`
**New** entity, sponsor scope 2026-07-23.

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | UUID | Row identity | REQ-EML11 |
|  | `thread_id` | UUID, FK → `email_threads.id`, not null | Which conversation this belongs to | REQ-EML11 |
|  | `from_address` | string, not null | Sender's address | REQ-EML11, REQ-EML12 (search by sender) |
|  | `subject` | text, not null | Message subject | REQ-EML12 (search) |
|  | `body` | text, not null | Message body (raw capture) | REQ-EML12 (search) |
|  | `status` | enum `received_email_status` (§3) | Capture/forward lifecycle state | REQ-EML11 (state table, `DOMAIN-LEXICON.md` §5) |
|  | `is_spam` | boolean, not null, default false | Spam-filter classification — a flag, not a gate (DR-7: never suppresses forwarding) | REQ-EML11 |
|  | `received_at` | timestamp, not null | When captured | REQ-EML11 |
|  | `forwarded_at` | timestamp, not null | When forwarded to the Owner's personal address — always set once `status=forwarded`, regardless of `is_spam` (DR-7) | REQ-EML11 |

**Invariant (→ REQ-EML11, DR-7):** every inbound message produces exactly one `received_emails` row and is always forwarded; `is_spam` never gates the forward.

### `notification_settings` — owner: `EML`
**New** entity (DR-15, `Decision_Record_2026-07-25.md`). A single row of Owner-controlled toggles — no per-booking or per-enquiry variant.

| ★ | Field | Type/shape | Meaning | Rule (→ REQ) |
|---|---|---|---|---|
| ★ | `id` | fixed singleton (e.g. `'default'`) | Row identity — exactly one row ever exists | REQ-EML18 |
|  | `enquiry_auto_acknowledge_enabled` | boolean, not null, default false | Whether REQ-EML18's holding acknowledgement fires on Enquiry arrival | REQ-EML18 |
|  | `updated_at` | timestamp, not null | Last time the Owner changed a setting | REQ-EML18 |

**Invariant (→ REQ-EML18, DR-15):** exactly one row exists; there is no per-Enquiry override. **Note:** `enquiries.acknowledged` and `enquiries.replied` are both externally-owned fields (the `enquiries` entity itself belongs to `pre-sales`, referenced but not defined here) — `acknowledged` is set by REQ-EML18, `replied` only by REQ-EML09; DR-15 is explicit that setting one never sets the other.

## 3. Enum registry
| Enum | Values | Used by | Governed by |
|---|---|---|---|
| `template_use_case` | `booking_confirmation`, `reminder`, `cancellation_approved`, `company_cancellation`, `weather_cancellation`, `payment_receipt`, `review_request` | `email_templates.use_case`, `sent_emails.use_case` | REQ-EML01/02/04/05/06/07/08 (one value per requirement's send type; `cancellation_approved` added for REQ-EML04's approval notice, distinct from REQ-EML05's company-initiated notice — same outcome shape (refund confirmed) but a different trigger/actor path, per BR-06 vs BR-04; REQ-EML09 enquiry replies are not templated, no value needed) |
| `template_status` | `draft`, `active`, `retired` | `email_templates.status` | REQ-EML10; matches `DOMAIN-LEXICON.md` §5 `email_templates` state table exactly |
| `sent_email_status` | `queued`, `sent`, `delivered`, `bounced`, `failed` | `sent_emails.status` | REQ-EML01/02/05/06/07/08/09 (queued, sent); presumed `core-notifications` (delivered, bounced, failed) — matches `DOMAIN-LEXICON.md` §5 `sent_emails` state table exactly |
| `reminder_milestone` | `t_minus_7`, `t_minus_24h` | `sent_emails.milestone` | REQ-EML02, DR-3 (`Decision_Record_2026-07-23.md`) |
| `received_email_status` | `captured`, `forwarded` | `received_emails.status` | REQ-EML11, DR-7 (`Decision_Record_2026-07-23.md`); matches `DOMAIN-LEXICON.md` §5 `received_emails` state table exactly — spam is the separate `is_spam` boolean field, not a status value |
| `categorisation_status` | `linked`, `unlinked`, `ambiguous` | `email_threads.categorisation_status` | REQ-EML11, REQ-EML14; matches `DOMAIN-LEXICON.md` §5 `email_threads` categorisation-states table exactly |
| `categorisation_method` | `thread_inheritance`, `reference_extraction`, `sender_lookup`, `manual` | `email_threads.categorisation_method` | REQ-EML11 (first three — cascade steps 2-4; step 1 alone, reply-reference threading, doesn't itself categorise — it only enables step 2), REQ-EML14 (`manual`) |

## 4. Relationships
Confirms/extends `DOMAIN-LEXICON.md` §6:
| Parent | Child | Cardinality | Note |
|---|---|---|---|
| `email_templates` | `sent_emails` | 1 : N | one template, many sends |
| `bookings` (external) | `sent_emails` | 1 : N | most sends are booking-triggered; nullable for enquiry replies |
| `sent_emails` (cancellation use-case only) | `explanation_blocks` | 1 : 0/1 | only company-initiated cancellation sends carry one |
| `email_threads` | `sent_emails` | 1 : N | outbound side of a conversation |
| `email_threads` | `received_emails` | 1 : N | inbound side of a conversation |
| `bookings` (external) | `co_leaders` | 1 : N (0 or more) | zero is the common case per sponsor (`DOMAIN-LEXICON.md` §6); each row is name+email+opt-in state, EML-owned (DR-11) |

## 5. Known inconsistencies
None found at this dictionary pass, following this revision's fix of the gap the 2026-07-25 alignment audit identified (F-A4/F-A9, `D-handover/Alignment_Audit_2026-07-25.md`): the `co_leaders` entity and the `sent_emails` recipient-set fan-out note were both missing prior to v0.5. Target: zero, maintained.

## 6. Revision note
**v0.2:** Added `received_emails`, `email_threads` entities, `sent_emails.thread_id`, and the `received_email_status` enum — new scope raised by the sponsor 2026-07-23 (inbound capture, threading, search, archive). REQ-EML11/12/13 were PROPOSED at this pass, pending D-EML-6/7.
**v0.3:** D-EML-6/7 ratified (DR-7/DR-8, `Decision_Record_2026-07-23.md`). `received_emails.status` enum simplified to `captured`/`forwarded` (spam is no longer a non-forwarding branch); added `is_spam` boolean field per DR-7.
**v0.4:** External mockup review surfaced a gap — no defined mechanism categorised an Email Thread against a Booking/Enquiry. Added `email_threads.categorisation_status`/`categorisation_method`/`ambiguous_candidates` fields and their enums, backing REQ-EML11's new categorisation cascade and the new REQ-EML14 (manual linking).
**v0.5:** Fixes alignment-audit finding F-A4/F-A9 (`D-handover/Alignment_Audit_2026-07-25.md`) — this document had never been re-walked against the Party Leader/Co-leader domain change (`DOMAIN-LEXICON.md` v0.2). Added the `co_leaders` entity (name, email, opt-in state, EML-owned storage per DR-11), a recipient-set fan-out note on `sent_emails` (F-18), the `bookings`→`co_leaders` relationship, and REQ-EML11's sender-lookup cross-reference (DR-10). Sources updated to `EML.md` v0.8 and DR-10/11/12.
**v0.7:** DR-15 (`Decision_Record_2026-07-25.md`) resolves D-EML-5, adding REQ-EML18 (enquiry auto-acknowledgement). Added the `notification_settings` entity (single-row Owner toggle) and a note clarifying `enquiries.acknowledged`/`enquiries.replied` are distinct, externally-owned fields set by different requirements. Sources updated to `EML.md` v0.11.
