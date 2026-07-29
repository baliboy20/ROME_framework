# FOB — Intake Note

| | |
|---|---|
| **Document** | FOB — Intake Note (Stage 0) |
| **Version** | 0.1 |
| **Date** | 2026-07-19T00:00:00Z |
| **Status** | PROPOSED — raw Stage-0 material, bounded to the Lean-6 core modules; nothing here is ratified scope. Rows marked `Reliable` derive from built code / the live site / the settled-decisions reconciliation. |
| **Sources** | `strategic/FOB_Product_Requirements_Document_v1_0.md` · `architecture/FOB_Modular_Architecture_v1_4.md` · `architecture/FOB_Design_Reconciliation_v1_0.md` · `technical-state/FOB_Technical_Context_Summary.md` · `data-model/Pre_Sales_Data_Model_v1_0.md` · `README.md` · session scoping decisions (Lean-6 set; bounded breadth) |

**Scope of this run.** Analysis (Stages 0–2) is normally project-wide; by sponsor decision this run is **bounded to six Tier-1 core-capability modules**: `core-data-access`, `core-auth`, `core-notifications`, `core-consent-audit` (merged), `core-seo`, `core-design-system`. Business-function domain journeys (PRE/BOOK/TOUR/OPS/POST/FLEET) are out of this run's scope and are analysed elsewhere.

---

## 1. Business goals
| ID | Goal (one sentence, outcome-shaped) | Confidence | Source |
|---|---|---|---|
| G-01 | Every business function reads and writes operational data through **one consistent D1 access pattern with versioned, ordered migrations**. | Reliable | Tech Context H, K (admin-rome 6-table migrations; route-pipeline schema.sql) |
| G-02 | **Each actor is authenticated through the session mechanism that fits their context** — customer via signed link, operator via login, guide via device — with no third-party access layer. | Reliable | PRD §7.4; Tech Context G |
| G-03 | Customers and the owner **receive every required message reliably and without duplication**. | Reliable | PRD §6.4, §6.6; Tech Context A, E |
| G-04 | **Every consent change and money-/safety-critical action is provable from an append-only record**, and dormant personal data is erased within the statutory window. | Reliable | PRD §10.7, §10.2; Data Model §2; Reconciliation §2 |
| G-05 | Public marketing and tour pages are **fully crawlable so prospects find FOB through search**, not paid OTA channels. | Reliable (strategy) / PROPOSED (helper module unbuilt) | Arch §3.1; PRD principle 2 |
| G-06 | **Every customer-facing surface renders from one set of brand tokens, type, and components.** | Reliable | PRD §10.1; Tech Context I |

## 2. Constraints & existing reality (facts — not negotiable, not buildable)
| ID | Fact | Confidence | Source |
|---|---|---|---|
| F-01 | Cloudflare-native stack at v1: Workers, Pages, D1 (UK), R2, KV, Cron. **No Durable Objects, no Queues, no AI Gateway, no Vectorize, no Cloudflare Access.** | Reliable | Reconciliation §3; Tech Context H |
| F-02 | The `admin-rome` booking site is **code-complete (ROME P5): 13 features, 15 endpoints, 31 tests, 6 D1 tables, real prod namespace IDs — not yet deployed.** | Reliable | Tech Context I |
| F-03 | D1 ownership today: admin-rome migrations own `tours, departures, bookings, participants, payments, enquiries`; route-pipeline `schema.sql` owns `guides, devices, captures, capture_pins, routes, route_geometry, waypoints, tour_sessions, session_pings`. | Reliable | Tech Context K |
| F-04 | Auth is **JWT (Web Crypto HS256, 1h) + KV** for booking/admin sessions; **`X-Device-ID`** header validated per-guide for the guide/route pipeline. No Cloudflare Access anywhere. | Reliable | Tech Context G; Reconciliation §3 |
| F-05 | Outbound email is split: **Postmark** (admin-rome `lib/email.ts`) + **Resend** (PoC modular email system with HTML templates + Stripe receipts). No MailChannels. SPF/DKIM/DMARC are delegated to the provider, not in-repo. | Reliable | Tech Context A, L |
| F-06 | `consents` is **append-only (never UPDATE)**; current state = most-recent row per `(prospect_id, consent_type)`. Types: `marketing_email, marketing_whatsapp, data_processing, cookies_analytics, cookies_marketing`. | Reliable | Data Model §2 |
| F-07 | GDPR retention is **settled at 90 days then anonymise**; `gdpr-cleanup` cron (03:00 UTC) exists; `prospects.deleted_at` soft-delete blanks PII but retains the row for referential integrity. | Reliable | Reconciliation §2; Data Model §1 |
| F-08 | An **idempotency pattern is already in use**: the Stripe PoC de-dups webhooks via a `webhook_events` table. | Reliable | Tech Context E, H |
| F-09 | Marketing site = **vanilla static HTML/CSS/JS served from a Hono Worker + Flutter Web widgets (islands)**; ~11 pages; **EN/FR/ES per-locale static directories**. SEO metadata is owned by the `marketing` BF and flows into the static HTML. | Reliable | Tech Context I; Arch §3.1, §4 |
| F-10 | Design system is **built**: forest-palette CSS tokens (e.g. `--forest #5a9962`, `--charcoal #243320`), **Syne** (display, self-hosted variable woff2) + **DM Sans** (body), `font-display: swap`; spec in `design-system.md`. | Reliable | Tech Context I |
| F-11 | Cron Triggers exist **only on the booking site**: `send-reminders` 08:00, `send-review-requests` 09:00, `gdpr-cleanup` 03:00 UTC. | Reliable | Tech Context H |
| F-12 | KV is used for **session tokens and rate-limit counters** on the booking site. | Reliable | Tech Context H |
| F-13 | There are **two copies of the booking site** — `rome-dev` (canonical, ~30 uncommitted changes) and `admin-rome` (carries CI). Divergent `jwt.ts`/`email.ts`/migrations. | Reliable | Tech Context I; R-D4 |

## 3. Existing assets inventory
| Asset | Type | Status | Where (maps to) |
|---|---|---|---|
| `backend/src/lib/jwt.ts` (HS256 + KV) | Running code | Built | → `core-auth` |
| `api/src/middleware/auth.ts` (X-Device-ID) | Running code | Built (deployed) | → `core-auth` |
| `backend/src/lib/email.ts` (Postmark) | Running code | Built (un-deployed) | → `core-notifications` |
| `pocs/email/` modular Resend system + HTML templates + `email_events` D1 | PoC | Built (PoC) | → `core-notifications` |
| `pocs/stripe/` `webhook_events` idempotency table | PoC | Built (PoC) | → `core-notifications` / webhooks (folded idempotency) |
| `consents` table + Pre-Sales Data Model | DDL + doc | Built (partial) | → `core-consent-audit` |
| `gdpr-cleanup` cron (03:00 UTC) | Running code | Built | → `core-consent-audit` |
| admin-rome `database/migrations/` (6 tables) + route-pipeline `schema.sql` | DDL | Built | → `core-data-access` |
| `styles.css` tokens + `design-system.md` | Design assets | Built | → `core-design-system` |
| Static HTML pages + `fr/`,`es/` dirs | Running code | Built (un-deployed) | → `core-seo` (base) |
| Dedicated sitemap / structured-data / meta-generation helper | — | **Not found / not built** | → `core-seo` (module) |
| Audit log entity | — | **Not found** (only `consents` is append-only today) | → `core-consent-audit` (New) |

## 4. Pain points / drivers
| ID | Pain | Who feels it | Evidence |
|---|---|---|---|
| P-01 | Auth checks, consent recording, and audit logging are **repeated glue at every BF boundary** — needs shared middleware. | Solo developer | Arch §13 |
| P-02 | **Two email providers** (Postmark + Resend) unconsolidated; no SPF/DKIM/DMARC in-repo → deliverability + divergence risk. | Owner, customers | Tech Context A, L |
| P-03 | No DOs/Queues → **concurrency, idempotency, and async must be carried by D1 transactions + KV + Cron**. | Developer | Reconciliation §3 |
| P-04 | **Two diverging copies of the booking site** (R-D4) — a pre-deploy blocker touching auth/email/migrations. | Developer | Tech Context I |
| P-05 | **No audit-log entity exists yet**; audit is required but only `consents` is append-only today. | Owner (compliance) | Corpus gap (RECONSTRUCTED) |
| P-06 | **Bus factor of 1** → lean, uniform patterns and minimum-viable tests matter more than completeness. | Owner/developer | PRD persona §4.2 |

## 5. Explicitly out of scope

**Declared by the corpus (Reliable):**
- Durable Objects, Cloudflare Queues, AI Gateway, Vectorize, Workers AI, Cloudflare Access — not v1 (F-01).
- Concierge / LLM stack — greenfield, deferred to v1.1+.
- Met Office severe-weather (paid tier); email consolidation to Cloudflare-native — deferred.
- Multilingual **booking/comms** — v1.1+; the site stays EN/FR/ES static.

**Declared by this run's scoping (PROPOSED — sponsor-chosen Lean-6 + tiering):**
- `core-slot-holds` **as a module** → folded into `booking` as a transactional capacity decrement. *(Conflicts with Reconciliation §4.4 / R-D2, which specify `held_until` + sweep — see KI-6.)*
- `core-idempotency` **as a module** → folded into webhooks/notifications (reuse the `webhook_events` pattern).
- `core-i18n` **runtime module** → per-locale static dirs only (matches built state).
- `core-rate-limiting` (platform rules), `core-observability`, `core-analytics` (module), `core-uploads`, `core-weather`, `core-transit`, `core-offline-sync`, `core-signature-capture` → deferred / not in Lean-6.

## 6. Seed questions (will become Decisions-needed downstream)
| ID | Question | Why it matters |
|---|---|---|
| SQ-01 *(R-D1)* | **Knock** workflow orchestration in front of Twilio, or **direct Twilio**? | Sets `core-notifications` routing/retry/template ownership; fan-out to transactional + marketing. |
| SQ-02 *(KI-2)* | Merge consent + audit into **one append-only ledger**, or keep `consents` (Built) separate from a new `audit_log`? | Determines the `core-consent-audit` entity model and query APIs. |
| SQ-03 *(F-D2)* | Which **schema.org** types for SEO structured data — TouristAttraction / LocalBusiness / Event / Product? | Bounds `core-seo` output and the marketing metadata fields. |
| SQ-04 *(F-D1)* | Static-site rebuild trigger — **automated on content change or manual publish**? | Couples `core-seo` output to a static-build mechanism (adjacent to Lean-6). |
| SQ-05 *(R-D4)* | Which booking-site copy (`rome-dev` vs `admin-rome`) is **canonical** for `jwt.ts` / `email.ts` / migrations? | Pre-deploy blocker; two divergent sources for three core modules. |
| SQ-06 | Email: **Postmark canonical at v1** with Resend PoC-only, or converge now — and who owns SPF/DKIM/DMARC? | Deliverability + single template source. |
| SQ-07 | Idempotency-key **home** now that the module is folded — reuse `webhook_events` across all webhooks/notifications/cron, in D1 or KV? | Correctness of once-only sends (G-03). |
| SQ-08 | Is `design-system.md` + `styles.css` the **single source of truth**, and does a Flutter component library exist yet or is it to-build? | `core-design-system` "full four" scope. |
| SQ-09 | Is **`X-Device-ID` sufficient** guide auth for v1, or is a per-guide credential needed? | Security posture of the guide surface in `core-auth`. |

**All nine seed questions ratified 2026-07-20 — see `Decision_Record_Aristotle_2026-07-20.md` (SQ-01/02 → DR-5/D-NOTIF-1 open; SQ-03 → DR-9; SQ-04 → DR-10; SQ-05 → DR-1; SQ-06 → D-NOTIF-2 open; SQ-07 → DR-8; SQ-08 → DR-11/12; SQ-09 → DR-3). This table is left as originally captured (Stage 0 raw material); the Decision Record is authoritative for current status.**

---

## 7. Addendum — `booking` (BOOK) module, Stage 0 (2026-07-20)

**Scope of this addendum.** First business-function module analysed beyond the Lean-6 core set. Bounded to the core booking flow: UJ-BOOK-01–07, 09, 10 (selection → attendee details → consent → payment → confirmation → modify/cancel → owner-created → abandonment). **Deferred, not resolved this pass:** UJ-BOOK-11 (gift vouchers, confirmed in-scope for the business but out of this analysis); UJ-BOOK-08 (OTA bookings, marked v2-sketch in the source doc itself). Decisions D1/D2/D5/D6/D7 from the source journey doc are carried forward as seed questions (SQ-10–14 below), not resolved here.

### 7.1 Business goals (BOOK)
| ID | Goal | Confidence | Source |
|---|---|---|---|
| G-07 | Customer completes a paid booking end-to-end (selection → attendee details → consent → payment → confirmation) without capacity ever being oversold. | Reliable (journey evidence) / PROPOSED (mechanism) | `Booking_And_Payment_User_Journeys_v1_0.md` UJ-BOOK-01–05 |
| G-08 | A booking is created **exactly once** despite webhook retries, replay, or network failure. | Reliable | Cross-cutting principle 9; `stripe_embedded_checkout` POC S1/S2 |
| G-09 | Customer can modify or cancel a confirmed booking within policy, self-service or assisted. | Reliable (journey evidence) / PROPOSED (policy depth, D1/D2 open) | UJ-BOOK-06, UJ-BOOK-07 |
| G-10 | Owner can convert an agreed enquiry into a paid booking outside self-service (group/corporate/phone). | Reliable | UJ-BOOK-09 |

### 7.2 Facts (BOOK)
| ID | Fact | Confidence | Source |
|---|---|---|---|
| F-14 | **Payment mechanism is Stripe Embedded Checkout** — Checkout Sessions API, `ui_mode: 'embedded'`; Worker creates the session, client mounts it via `stripe.createEmbeddedCheckoutPage()`. Fulfilment is driven strictly by the `checkout.session.completed` webhook, never the browser return page. **Supersedes** BOOK's own D3 and `FOB_Design_Reconciliation_v1_0.md` §2's "settled as Elements + PaymentIntents" row — both described a different mechanism than what was actually POC-verified. | Reliable | `pocs/stripe_embedded_checkout/README.md`, `LEARNINGS.md` — live-verified 2026-07-17 |
| F-15 | A client-supplied `Idempotency-Key` on checkout-session creation returns the same Stripe session on retry — but the local D1 insert keyed on the returned session id must **also** be made idempotent (`INSERT OR IGNORE`); an idempotent external API does not make the local write idempotent on its own. | Reliable | POC `LEARNINGS.md` Phase 2 |
| F-16 | The idempotency store is a D1 `webhook_events` table, deduped by Stripe event id — the same mechanism already ratified for `core-notifications`/`core-data-access` (DR-8). Reused, not a new pattern. | Reliable | POC `LEARNINGS.md`; `Decision_Record_Aristotle_2026-07-20.md` DR-8 |
| F-17 | The slot-hold mechanism is **not** a Durable Object (original BOOK doc's assumption) nor `held_until` + sweep cron (Reconciliation §5 R-D2's guess) — the direction on record is a **D1 transactional capacity decrement**, owned by `booking` itself (`Decision_Record_Aristotle_2026-07-20.md` D-DATA-3, a non-binding recommendation carried forward, not yet ratified for BOOK). | PROPOSED (recommendation, not yet ratified for this module) | `Decision_Record_Aristotle_2026-07-20.md` D-DATA-3 |
| F-18 | Manage-booking authentication is **JWT+KV via `core-auth`** (REQ-AUTH02) — booking-reference + email is only the *lookup* identifier presented to find the booking, not the session mechanism itself. Closes BOOK's own D9. | Reliable | `Decision_Record_Aristotle_2026-07-20.md` DR-2; `core-auth.md` REQ-AUTH02 |
| F-19 | Maximum group size is **10** per open tour (not 20) — corrects the >20 threshold implied elsewhere in the corpus. | Reliable | `FOB_Design_Reconciliation_v1_0.md` §2, §4.1 |
| F-20 | Cumulative refund total must be read from `charge.amount_refunded`/`charge.refunded`, never accumulated from a single refund call's own amount — a real bug (two partial refunds clobbering each other) was only caught by live two-step testing against a genuine Stripe charge. | Reliable | POC `LEARNINGS.md` Phase 4 |
| F-21 | The POC's admin payment/refund view uses a static `X-Admin-Key` header, explicitly flagged POC-only (visible in the compiled client bundle) — not a production auth pattern. | Reliable (as a POC-only limitation) | POC `README.md`, `LEARNINGS.md` Phase 4 |
| F-22 | Security alerts (≥3 declines in 5 min for the same email/reference; any dispute) are `console.error` only in the POC — no real paging/alerting channel exists yet at this layer. | Reliable (as a POC-only limitation) | POC `LEARNINGS.md` Phase 5 |

### 7.3 Existing assets inventory (BOOK)
| Asset | Type | Status | Where (maps to) |
|---|---|---|---|
| `pocs/stripe_embedded_checkout/` (Worker + Flutter Web) | POC, live-deployed & verified | Built (POC) | → `booking` (payment) |
| `Booking_And_Payment_User_Journeys_v1_0.md` | Design doc, 10 UJs | Design stage — **D3 within it is now superseded (F-14)** | → `booking` (source) |
| admin-rome `database/migrations/` — `bookings`, `departures`, `participants`, `payments`, `enquiries` tables | DDL | Built (un-deployed); columns not yet in this corpus | → `booking` (Referenced, not confirmed) |

### 7.4 Pain points / drivers (BOOK)
| ID | Pain | Who feels it | Evidence |
|---|---|---|---|
| P-07 | The payment-surface choice (Checkout vs Elements vs Embedded) was unsettled across two design docs and only resolved by **live browser testing** — vendor documentation itself proved unreliable twice in the same build. | Developer | POC `LEARNINGS.md` Phase 2, Phase 7 |
| P-08 | No slot-hold/capacity mechanism is built yet — booking's core anti-oversell guarantee (G-07) is still design-only. | Owner, customers | `Booking_And_Payment_User_Journeys_v1_0.md` UJ-BOOK-01; F-17 |

### 7.5 Explicitly out of scope (this BOOK pass)
- UJ-BOOK-11 (gift vouchers) — confirmed in business scope (live site), deferred from this analysis pass.
- UJ-BOOK-08 (OTA bookings via Viator/GetYourGuide) — the source doc itself marks this v2-sketch-only; carried as a deferred journey (§ Journey Index), not resolved here.
- D1, D2, D5, D6, D7 (self-service modification depth, cancellation-policy detail beyond 48h, per-attendee/emergency-contact depth, waiver timing, abandonment-recovery email) — carried forward as seed questions, not resolved this pass.

### 7.6 Seed questions (BOOK)
| ID | Question | Why it matters |
|---|---|---|
| SQ-10 *(D1)* | Self-service booking modification — full self-service, limited (date-only), or contact-owner-only? | Scopes UJ-BOOK-06's implementation. |
| SQ-11 *(D2)* | Cancellation policy within 48h of departure — full refund / partial / tour credit / none? | Drives UJ-BOOK-07's refund logic. |
| SQ-12 *(D5)* | Emergency contact — one per booking (whole party) or one per attendee? | Scopes UJ-BOOK-02's attendee-details depth; ties to the FOB Risk Assessment Pack. |
| SQ-13 *(D6)* | Waiver — digital inline at booking (UJ-BOOK-03), paper/QR at the meeting point, or both? | Affects both booking-flow design and on-tour guide process. |
| SQ-14 *(D7)* | Abandonment recovery email — send at +1h if an email was captured pre-abandonment? If yes, must be gated by marketing consent (`core-consent-audit` REQ-CNA05), not sent unconditionally. | Recovers abandoned bookings but adds a consent dimension. |
| SQ-15 *(from F-21)* | Should the production admin payment/refund view authenticate via `core-auth`'s operator session (REQ-AUTH01) rather than a static admin key? | The POC's static-key pattern is explicitly not production-grade. |
| SQ-16 *(from F-22)* | Should security alerts (repeated declines, disputes) route through `core-notifications`' owner-alert (REQ-NOTIF04) rather than a bespoke console/paging channel? | Avoids a second, undocumented alert path outside the already-ratified NOTIF module. |

---

## 8. Addendum — `pre-sales` (PRE) module, Stage 0 (2026-07-20)

**Scope of this addendum.** Bounded to the **non-AI** journeys: UJ-PRE-01 (land/orient), 02 (browse catalogue), 03 (tour detail), 05 (check availability), 06 (group/corporate/private enquiry), 08 (save/return later), 09 (convert to booking). **Deferred, not analysed this pass:** UJ-PRE-04 (ask the concierge) and UJ-PRE-07 (concierge handoff) — both depend on Durable Objects, Vectorize, and Claude API integration, all flagged elsewhere as 100% greenfield (Reconciliation R-D7), and warrant their own dedicated module pass rather than being folded in here.

### 8.1 Business goals (PRE)
| ID | Goal | Confidence | Source |
|---|---|---|---|
| G-11 | A prospect can discover, browse, and inspect the tour catalogue without friction, on any device. | Reliable (journey evidence) | `Pre_Sales_User_Journeys_v1_0.md` UJ-PRE-01–03 |
| G-12 | A prospect can check date/party-size availability before committing to book. | Reliable | UJ-PRE-05 |
| G-13 | Enquiries outside standard self-service booking (group/private/corporate/accessibility) reach the Owner with an explicit SLA, never silently. | Reliable | UJ-PRE-06 |
| G-14 | A prospect who isn't ready to book can save their interest and be found again, with at most one low-pressure follow-up, consent-gated. | Reliable | UJ-PRE-08 |
| G-15 | A prospect who commits enters the booking flow with maximum context pre-filled. | Reliable | UJ-PRE-09 |

### 8.2 Facts (PRE)
| ID | Fact | Confidence | Source |
|---|---|---|---|
| F-23 | Party/group size cap is **10**, not the >20 figure the Pre-Sales journey doc uses (UJ-PRE-05's "party size exceeds tour cap (>20)" and UJ-PRE-06's threshold are both stale). | Reliable | `FOB_Design_Reconciliation_v1_0.md` §2, §4.1 (already applied to `booking`, F-19) |
| F-24 | PRE's `enquiries` records are the direct input to `booking`'s owner-created-booking path (REQ-BOOK08) — an enquiry reaching `status=responded` with agreed terms is what that REQ's precondition expects. | Reliable | `Pre_Sales_Data_Model_v1_0.md` §3; `booking.md` REQ-BOOK08 |
| F-25 | `prospects` is Built (confirmed DDL), owned by `pre-sales` — already Referenced in the lexicon from the `core-consent-audit` side; PRE is the authoritative owner and its full attribute set is stated here. | Reliable | `Pre_Sales_Data_Model_v1_0.md` §1; `DOMAIN-LEXICON.md` §3 (prior partial reference) |
| F-26 | Anonymous tour saves (heart-click, no email) live in browser localStorage only and never reach D1. Only *identified* saves (email captured via "Email me this tour") persist as `saved_tours` rows. | Reliable | `Pre_Sales_Data_Model_v1_0.md` §4 |
| F-27 | The source data model cites a "SendGrid webhook" for save-tour bounce tracking — **stale**, per the project's already-established correction (KI-3): Postmark is canonical, never cite SendGrid. | Reliable | `Pre_Sales_Data_Model_v1_0.md` §4; `DOMAIN-LEXICON.md` KI-3 |
| F-28 | The concierge/chatbot stack (Durable Objects for live conversation state, Vectorize for RAG, Claude API) is **100% greenfield** — none of it exists yet, contradicting nothing (it was never claimed built), but confirming it's out of this pass's bound. | Reliable | `FOB_Design_Reconciliation_v1_0.md` §1(B), R-D7; F-01 |
| — | Consent decisions captured in Pre-Sales (enquiry form, save-by-email nudge opt-in) are recorded via `core-consent-audit` (REQ-CNA01) — PRE does **not** own or duplicate a `consents` table. | Reliable (sponsor decision, 2026-07-20) | this session |

### 8.3 Existing assets inventory (PRE)
| Asset | Type | Status | Where (maps to) |
|---|---|---|---|
| `Pre_Sales_User_Journeys_v1_0.md` | Design doc, 9 UJs | Design stage — UJ-PRE-04/07 (concierge) deferred; party-size figures stale (F-23) | → `pre-sales` (source) |
| `Pre_Sales_Data_Model_v1_0.md` | Data model doc | Design stage — `consents` table claim superseded (PRE depends on CNA instead); `enquiries`, `saved_tours`, `prospects` remain PRE's | → `pre-sales` (source) |
| `prospects` D1 table | DDL | Built, confirmed | → `pre-sales` |

### 8.4 Pain points / drivers (PRE)
| ID | Pain | Who feels it | Evidence |
|---|---|---|---|
| P-09 | Enquiries needing an SLA response currently have no owner-alert wiring specified — `core-notifications` REQ-NOTIF04 exists but isn't yet threaded to PRE's enquiry submission. | Owner | `Pre_Sales_User_Journeys_v1_0.md` UJ-PRE-06 step 4 |
| P-10 | The Pre-Sales data model independently re-describes a `consents` table already owned elsewhere — a documentation-drift risk now closed by this session's decision, but a reminder that cross-module docs authored independently need reconciling before ratification, not after. | Developer | `Pre_Sales_Data_Model_v1_0.md` §2 vs `DOMAIN-LEXICON.md`/DR-5 |

### 8.5 Explicitly out of scope (this PRE pass)
- UJ-PRE-04 (ask the concierge) and UJ-PRE-07 (concierge handoff) — deferred to a future dedicated module, per sponsor decision 2026-07-20.
- D1 (chatbot launch scope: general-only / +pricing / +availability) — deferred along with the concierge module itself.
- Voice mode, RAG/Vectorize knowledge base, fine-tuning corpus — all deferred with the concierge.

### 8.6 Seed questions (PRE)
| ID | Question | Why it matters |
|---|---|---|
| SQ-17 *(source doc D2)* | Owner alert routing for enquiries — immediate WhatsApp, daily digest email, or both, configurable per type? | Scopes how UJ-PRE-06 threads into `core-notifications` REQ-NOTIF04. |
| SQ-18 | Should Turnstile/spam-flagged enquiries (`status=spam`) suppress the owner alert entirely, or just deprioritise it? | Affects REQ-NOTIF04's trigger condition for this journey. |
| SQ-19 | Overdue-SLA handling (source doc: "an apology + extended-SLA email auto-sends to the prospect at 24h overdue") — is this in scope for this pass, or deferred alongside the concierge's SLA tracking? | Determines whether a new transactional-message REQ is needed now. |

---

## 9. Addendum — `tour-operations` (OPS) module, Stage 0 (2026-07-20)

**Scope of this addendum.** Bounded to OPS's 12 journeys (UJ-OPS-01–12): pre-tour kit/bike checks, dynamic risk assessment, rider check-in, safety briefing, pre-departure sign-off, mid-tour issue handling, incident response, post-ride review, incident/insurer reporting, hazard log. **GMT (navigation PWA, 10 journeys — map, GPS, waypoint content, hazard proximity alerts) is presumed as a separate, already-designed tool** that OPS extends with playbook flows; GMT's own journeys are not re-analysed here.

### 9.1 Business goals (OPS)
| ID | Goal | Confidence | Source |
|---|---|---|---|
| G-16 | Every tour departs only once all pre-tour compliance checks (kit, bikes, risk assessment, rider check-in, briefing) are signed off — no gate is skippable. | Reliable | `Tour_Operations_User_Journeys_v1_0.md` UJ-OPS-01–07, cross-cutting principle 3 |
| G-17 | Every signed step carries a full audit trail (timestamp, guide identity, signature, content snapshot) for insurer/regulator purposes. | Reliable | Cross-cutting principle 2 |
| G-18 | Mid-tour issues and incidents are handled with action prioritised over data capture, and escalate correctly (issue → incident → emergency services/insurer). | Reliable | UJ-OPS-08, 09, 11 |
| G-19 | Post-tour review data closes the loop into risk-assessment updates and the route hazard log. | Reliable | UJ-OPS-10, 12; cross-cutting principle 8 |

### 9.2 Facts (OPS)
| ID | Fact | Confidence | Source |
|---|---|---|---|
| F-29 | The playbook (FOB-PB-001) is the operational source of truth; every checklist/sign-off/form field in OPS derives from it. Currently a PDF, digitised "to the extent required for operational compliance" (settled, source doc D1). | Reliable | `Tour_Operations_User_Journeys_v1_0.md` module overview, D1 |
| F-30 | Waiver is signed twice: full read+sign at booking (`booking` REQ-BOOK03), brief re-confirmation with a **fresh digital signature** at the meeting point (OPS UJ-OPS-05) — settled, source doc D2. **This corrects DR-B7's "paper" framing** (already fixed in `Decision_Record_Booking_Aristotle_2026-07-20.md` and `Module_Map.md`). | Reliable | `Tour_Operations_User_Journeys_v1_0.md` D2; corrected `Decision_Record_Booking_Aristotle_2026-07-20.md` |
| F-31 | Max 2 minors (14–17) per party, each with a dedicated accompanying adult — a hard constraint the source doc says must be enforced at booking time (its own D6), not just checked on the day. | Reliable | `Tour_Operations_User_Journeys_v1_0.md` D6, UJ-OPS-04/05 |
| F-32 | A "Health Declaration" (FOB-HD-001) is referenced as captured at booking and consumed at guide check-in — the source doc's own D10 says this should be a labelled section in booking, not folded into a generic notes field. | Reliable | `Tour_Operations_User_Journeys_v1_0.md` D10 |
| F-33 | Safety blocks sign-off structurally: a failed bike not removed from service, an uncleared rider, or a missing critical kit item each blocks its respective step's sign-off — the system enforces what the guide already knows, it doesn't just advise. | Reliable | Cross-cutting principle 3 |
| F-34 | GMT is presumed as the existing app shell OPS extends — no GMT journeys are re-specified here; OPS's playbook flows are new surfaces within it. | Reliable | `Tour_Operations_User_Journeys_v1_0.md` "Digital scope at v1" |

### 9.3 Existing assets inventory (OPS)
| Asset | Type | Status | Where (maps to) |
|---|---|---|---|
| `Tour_Operations_User_Journeys_v1_0.md` | Design doc, 12 UJs | Design stage | → `tour-operations` (source) |
| FOB-PB-001 (City of London Tour Playbook) | External reference doc, PDF | Referenced, not in this corpus's text | → source of truth for every OPS checklist |
| FOB-RA-001 (Risk Assessment) | External reference doc | Referenced, not in this corpus's text | → baseline for UJ-OPS-04's dynamic assessment |
| GMT app | PWA, partially built (per Reconciliation) | Presumed, not re-analysed this pass | → app shell OPS extends |

### 9.4 Pain points / drivers (OPS)
| ID | Pain | Who feels it | Evidence |
|---|---|---|---|
| P-11 | Booking currently has no minor-party-composition limit and no formal Health Declaration section — both are hard operational requirements surfaced only once OPS was analysed. | Owner, guides | `Tour_Operations_User_Journeys_v1_0.md` D6, D10 |
| P-12 | Several OPS decisions (signature mechanism, per-bike vs per-fleet inspection, bike-service-flag propagation, refusal-refund handling, insurer report format) are explicitly unsettled in the source doc itself. | Guide, Owner | `Tour_Operations_User_Journeys_v1_0.md` D3–D8 |

### 9.5 Explicitly out of scope (this OPS pass)
- GMT's own 10 navigation journeys (UJ-GMT-01–10) — presumed as an existing, separately-designed tool.
- The two corrections to `booking.md` (minor-party limit, Health Declaration) are **emitted as new decisions**, not edited into the already-ratified `booking.md` directly (see §9.6).

### 9.6 Seed questions (OPS)
| ID | Question | Why it matters |
|---|---|---|
| SQ-20 *(source doc D3)* | Signature capture mechanism — full stylus/finger signature pad, or simpler typed "I confirm" + timestamp? | Legal robustness vs speed; source doc recommends stylus for waivers/declarations, typed-confirm for routine sign-offs. |
| SQ-21 *(source doc D4)* | Per-bike inspection when a fleet is shared across two same-day tours — full repeat, delta check, or skip? | Safety vs guide time; source doc recommends full repeat with a "tick all OK from prior tour" shortcut. |
| SQ-22 *(source doc D5)* | Bike-service-flag propagation — a flagged bike must not be assignable until an owner clears it; needs a small status workflow. | Prevents an unsafe bike being assigned to tomorrow's tour. |
| SQ-23 *(source doc D7)* | Refusal-to-ride refund handling — guide flags, Owner processes; or guide triggers an automatic refund directly? | Source doc recommends guide-flags/Owner-processes, to avoid guides handling money. |
| SQ-24 *(source doc D8)* | PLI insurer's required incident-report format — unconfirmed; structure is conservative until William confirms. | Drives UJ-OPS-11's report fields. |
| SQ-25 *(source doc D9)* | Photo capture scope in incidents/hazard log — in scope, but specific UX deferred to design. | Requires R2 storage + offline-cache-then-sync, already a pattern used elsewhere in the project. |
| SQ-26 *(new, from D6)* | Should `booking.md` REQ-BOOK02 be amended to enforce max-2-minors-per-party-with-dedicated-adult? | Emitted against an already-ratified module — needs its own mini-ratification, not a silent edit. |
| SQ-27 *(new, from D10)* | Should `booking.md` REQ-BOOK02 formalise a labelled "Health Declaration" section rather than a generic notes field? | Same as SQ-26 — a correction to already-ratified scope. |

---

## 10. Addendum — `pre-tour` (TOUR) module, Stage 0 (2026-07-20)

**Scope of this addendum.** Bounded to TOUR's 9 non-concierge journeys: UJ-TOUR-01 (tour hub), 02 (scheduled reminders), 03 (weather advisory), 04 (update details), 06 (operator-initiated change), 07 (operator-initiated cancellation), 08 (day-of prep/arrival), 09 (late-arrival notice), 10 (no-show handling). **Deferred:** UJ-TOUR-05 (booked-customer concierge) — depends on the same not-yet-built AI stack as the Pre-Sales concierge (F-28), joins the same future concierge module.

### 10.1 Business goals (TOUR)
| ID | Goal | Confidence | Source |
|---|---|---|---|
| G-20 | A confirmed customer has one durable, always-current place (the tour hub) to review booking details, meeting point, and status between payment and tour day. | Reliable | `Pre_Tour_User_Journeys_v1_0.md` UJ-TOUR-01 |
| G-21 | Customers receive timely, confidence-building reminders and weather advisories without the operator having to act manually. | Reliable | UJ-TOUR-02, 03 |
| G-22 | Non-financial detail corrections are self-service; anything financial routes back to `booking`. | Reliable | UJ-TOUR-04, cross-cutting principle 5 |
| G-23 | Operator-initiated changes and cancellations reach the customer through every relevant channel and are explicitly acknowledged when material. | Reliable | UJ-TOUR-06, 07, cross-cutting principle 7 |
| G-24 | Late arrivals and no-shows are handled predictably, with the guide informed before it matters. | Reliable | UJ-TOUR-09, 10, cross-cutting principle 6 |

### 10.2 Facts (TOUR)
| ID | Fact | Confidence | Source |
|---|---|---|---|
| F-35 | The source doc cites **SendGrid** for reminders/notices — stale, same class of error as KI-3/KI-14; Postmark is canonical. | Reliable | `Pre_Tour_User_Journeys_v1_0.md` module overview; `DOMAIN-LEXICON.md` KI-3 |
| F-36 | The source doc cites **Cloudflare Queue** retries for delivery failure — not in the stack; Cron Triggers + direct provider calls are the actual async mechanism (F-01, already established). | Reliable | `Pre_Tour_User_Journeys_v1_0.md` UJ-TOUR-02; `FOB_Design_Reconciliation_v1_0.md` §3 |
| F-37 | "Push notification" is mentioned (UJ-TOUR-03) but no push-notification mechanism is confirmed built anywhere in this project — treated as unconfirmed, not assumed available. | Reliable | `Pre_Tour_User_Journeys_v1_0.md` UJ-TOUR-03 |
| F-38 | Transactional reminders/advisories/changes bypass marketing-consent suppression — they are a distinct consent category from marketing (already established pattern, REQ-NOTIF01's invariant). | Reliable | `Pre_Tour_User_Journeys_v1_0.md` cross-cutting principle 3; `core-notifications.md` REQ-NOTIF01 |
| F-39 | Reminder channel choice (D2: email-always+preferred vs preferred-only) is the same underlying question as the still-open D-NOTIF-1 (channel orchestration) — not a new decision, a restatement against a different journey. | Reliable | `Pre_Tour_User_Journeys_v1_0.md` D2; `Decision_Record_Aristotle_2026-07-20.md` D-NOTIF-1 |
| F-40 | No-show policy (D8) is explicitly meant to align with the cancellation policy already ruled manual/Owner-decided for within-48h cases (DR-B5). | Reliable | `Pre_Tour_User_Journeys_v1_0.md` D8; `Decision_Record_Booking_Aristotle_2026-07-20.md` DR-B5 |

### 10.3 Existing assets inventory (TOUR)
| Asset | Type | Status | Where (maps to) |
|---|---|---|---|
| `Pre_Tour_User_Journeys_v1_0.md` | Design doc, 10 UJs | Design stage — SendGrid/Queue references stale (F-35, F-36) | → `pre-tour` (source) |
| `send-reminders` cron (08:00 UTC) | Running code | Built | → `pre-tour` (reuses existing NOTIF cron) |

### 10.4 Pain points / drivers (TOUR)
| ID | Pain | Who feels it | Evidence |
|---|---|---|---|
| P-13 | Several TOUR decisions restate already-open project-wide questions (D2≈D-NOTIF-1) or already-ratified patterns (D8≈DR-B5) without cross-referencing them — a documentation-drift risk if resolved independently. | Developer | F-39, F-40 |

### 10.5 Explicitly out of scope (this TOUR pass)
- UJ-TOUR-05 (booked-customer concierge) — deferred with the AI/concierge stack, per sponsor decision 2026-07-20.

### 10.6 Seed questions (TOUR)
| ID | Question | Why it matters |
|---|---|---|
| SQ-28 *(D1)* | Reminder cadence — light (T-1 only), standard (T-7/T-1/T-0), or heavy (T-14/T-7/T-3/T-1/T-0)? | Drives REQ authoring for scheduled reminders. |
| SQ-29 *(D2, = D-NOTIF-1)* | Reminder channels — email-always+preferred, or preferred-only? | Same underlying question as the still-open D-NOTIF-1; should not be ratified independently. |
| SQ-30 *(D3)* | Weather-alert thresholds — explicit numeric rules for informational/action-required/cancellation-candidate? | Owner/Risk Pack input needed; drives REQ-TOUR03. |
| SQ-31 *(D4)* | Self-service detail-update scope — which fields editable, which need Owner involvement (e.g. severe allergy, accessibility)? | Drives REQ-TOUR04's safety-significant-change handling. |
| SQ-32 *(D5)* | Cancellation remediation — single auto-refund, or choose-your-own (refund/rebook/credit)? | Materially affects REQ-TOUR07's customer experience. |
| SQ-33 *(D6)* | Late-arrival grace period — fixed (e.g. 15 min) or configurable per tour? | Drives REQ-TOUR09/10's timing. |
| SQ-34 *(D7)* | Day-of guide contact mechanism for a late/lost customer — direct guide mobile, FOB ops number, or in-app push via GMT? | Affects REQ-TOUR09's notification path; ties to `tour-operations`. |
| SQ-35 *(D8, ties to DR-B5)* | No-show policy — forfeit/partial credit/tour credit/nothing — aligned with the already-ratified manual within-48h cancellation approach? | Should be ratified with DR-B5's precedent in view, not independently. |
| SQ-36 *(D9)* | Calendar invite delivery — .ics only, add-to-calendar widget, or both? | Minor implementation choice, drives REQ-TOUR01/02. |

---

## 11. Addendum — `fleet-equipment` (FLEET) module, Stage 0 (2026-07-21)

**Scope of this addendum.** All 6 journeys: UJ-FLEET-01 (onboard bike), 02 (onboard/replace equipment), 03 (fleet dashboard), 04 (handle flagged bike), 05 (compliance tracking), 06 (retire asset). No AI/concierge dependency — nothing deferred within this module.

**Ownership correction surfaced (sponsor decision, 2026-07-21):** `tour-operations.md`'s REQ-OPS03 currently owns and writes `bikes.status` directly. This is corrected: **`fleet-equipment` owns bike condition/status**; `tour-operations` calls into FLEET's inspection-recording capability rather than maintaining its own copy. This resolves **GAP-6b-3** (the previously-missing "Owner clears a flagged bike" behavior) as FLEET's own UJ-FLEET-04, not a gap in OPS.

### 11.1 Business goals (FLEET)
| ID | Goal | Confidence | Source |
|---|---|---|---|
| G-25 | Every physical asset (bike or safety equipment) is tracked from acquisition through retirement, with a permanent, unbroken history. | Reliable | `Fleet_And_Equipment_User_Journeys_v1_0.md` cross-cutting principle 2 |
| G-26 | A bike flagged for service by `tour-operations` always has a destination — inspection, maintenance, and return to service, or retirement. | Reliable | UJ-FLEET-04; cross-cutting principle 3 |
| G-27 | Compliance items with legal/safety consequence (PLI, ICO, helmet expiry, first aid contents) are tracked to a schedule and never silently lapse. | Reliable | UJ-FLEET-05; cross-cutting principle 6 |
| G-28 | The Owner has one daily view of fleet readiness sufficient to judge whether tomorrow's tours can run. | Reliable | UJ-FLEET-03; cross-cutting principle 10 |

### 11.2 Facts (FLEET)
| ID | Fact | Source |
|---|---|---|
| F-41 | The source doc cites SendGrid and Twilio for alerts — same stale/open-decision pattern as elsewhere (Postmark canonical per KI-3; channel choice tied to the still-open D-NOTIF-1). | `Fleet_And_Equipment_User_Journeys_v1_0.md` module overview |
| F-42 | **Ownership correction:** `bikes` (status, condition, maintenance history) is owned by `fleet-equipment`, not `tour-operations`. `tour-operations`' REQ-OPS03 calls into FLEET's inspection-recording capability. | Sponsor decision, 2026-07-21; corrects `tour-operations.md` §2 |
| F-43 | MVP scope assumes: owned (not leased) bikes; in-house maintenance by the Owner; fleet size ~10–15 bikes; single-operator UX. | `Fleet_And_Equipment_User_Journeys_v1_0.md` module overview |
| F-44 | Photo capture (bike/equipment condition, certificates, repair receipts) is explicitly recommended in-scope here (source doc D5) — this is a **separate decision from** `tour-operations`' DR-O5 (which ruled photos out of scope for incidents/hazards specifically, not project-wide). | `Fleet_And_Equipment_User_Journeys_v1_0.md` D5; `Decision_Record_TourOps_Aristotle_2026-07-20.md` DR-O5 |

### 11.3 Existing assets inventory (FLEET)
| Asset | Type | Status | Where (maps to) |
|---|---|---|---|
| `Fleet_And_Equipment_User_Journeys_v1_0.md` | Design doc, 6 UJs | Design stage — flagged as "no changes required, MVP greenfield" in Reconciliation | → `fleet-equipment` (source) |

### 11.4 Pain points / drivers (FLEET)
| ID | Pain | Who feels it | Evidence |
|---|---|---|---|
| P-14 | Without this module, `tour-operations`' bike-service flags "go nowhere" — no destination exists for a flagged bike. | Owner, guides | `Fleet_And_Equipment_User_Journeys_v1_0.md` module overview |

### 11.5 Explicitly out of scope (this FLEET pass)
- None — all 6 journeys are core, MVP scope, no deferrals.

### 11.6 Seed questions (FLEET)
| ID | Question | Why it matters |
|---|---|---|
| SQ-37 *(D1)* | Maintenance scheduling trigger — time-based, mileage-based, both, or purely reactive at v1? | Source doc recommends purely reactive at v1. |
| SQ-38 *(D2)* | Helmet replacement policy — 3 years, 5 years, or impact-only? | Source doc recommends 5 years OR impact, whichever first. |
| SQ-39 *(D3)* | Bike status state machine — confirm the proposed states or simplify. | Drives the corrected `bikes` entity (now FLEET-owned). |
| SQ-40 *(D4)* | Compliance tracking scope — PLI/EL/ICO core; what else (business registration, accountant filings)? | Bounds UJ-FLEET-05. |
| SQ-41 *(D5)* | Photo capture policy for bikes/equipment — in scope throughout? | Source doc recommends yes; separate from `tour-operations`' DR-O5. |
| SQ-42 *(D6)* | Pre-launch/pre-tour-day fleet certification gate — a single "ready to trade" sign-off? | Ties to `tour-operations`' REQ-OPS04 risk assessment. |
| SQ-43 *(D7)* | Compliance alert digest cadence — daily/weekly/on-event? | Source doc recommends daily digest + immediate critical alerts. |
| SQ-44 *(D8)* | Soft-retire grace period — how many days before an accidental retirement locks permanently? | Source doc recommends 30 days. |
| SQ-45 *(D9)* | External service provider logging — invoice upload as a maintenance event, or a separate workflow? | Source doc recommends the simpler invoice-upload approach. |
| SQ-46 *(D10)* | Bulk onboarding workflow for equipment (e.g. 10 helmets at once) — bulk entry with shared defaults, or individual records? | Source doc recommends bulk entry with shared defaults. |

---

## 12. Addendum — `post-tour` (POST) module, Stage 0 (2026-07-21)

**Scope of this addendum.** Bounded to POST's 9 non-photo journeys: UJ-POST-01 (thank-you), 02 (public review request), 03 (internal feedback), 05 (negative-experience recovery), 06 (owner review monitoring), 07 (repeat-booking nudge), 08 (lapsed-customer re-engagement), 09 (seasonal marketing), 10 (preferences/unsubscribe/deletion). **Deferred:** UJ-POST-04 (shared tour photos) — the source doc's own "sketch only, v2" designation.

### 12.1 Business goals (POST)
| ID | Goal | Confidence | Source |
|---|---|---|---|
| G-29 | Every completed tour generates a thank-you touch and a genuine opportunity for public review or private feedback. | Reliable | `Post_Tour_Retention_User_Journeys_v1_0.md` UJ-POST-01–03 |
| G-30 | Negative experiences are caught and personally addressed before they become public, unresolved reviews. | Reliable | UJ-POST-05, cross-cutting principle 4 |
| G-31 | Public reviews are monitored and responded to within SLA, in William's own voice. | Reliable | UJ-POST-06 |
| G-32 | Customer lifecycle (active/lapsed/dormant) drives re-engagement — not a blanket schedule. | Reliable | UJ-POST-07, 08; cross-cutting principle 6 |
| G-33 | Marketing preferences are granular, one-click to change, and a GDPR deletion path is clean. | Reliable | UJ-POST-10; cross-cutting principle 7 |

### 12.2 Facts (POST)
| ID | Fact | Source |
|---|---|---|
| F-45 | SendGrid citations are stale — Postmark canonical (KI-3), same as elsewhere. | `Post_Tour_Retention_User_Journeys_v1_0.md` module overview |
| F-46 | **GDPR retention conflict (not resolved here):** POST's own D6 proposes 24 months from last interaction before anonymisation. `core-consent-audit`'s already-ratified DR-7 covers only `prospects`, at 90 days. These may legitimately be two different populations (prospect vs confirmed customer) with two different rules — or may need reconciling. Emitted as a decision, not silently adopted either way. | `Post_Tour_Retention_User_Journeys_v1_0.md` D6; `Decision_Record_Aristotle_2026-07-20.md` DR-7 |
| F-47 | **DR-7's deferred non-prospect PII erasure gap is directly what UJ-POST-10's "delete my data" flow needs to close** — DR-7's interim default (retain, never auto-erase) has been the safe placeholder; this module is the natural owner of finally authoring that erasure path for bookings/participants. | `Decision_Record_Aristotle_2026-07-20.md` DR-7; `Post_Tour_Retention_User_Journeys_v1_0.md` UJ-POST-10 |
| F-48 | Consent writes (marketing preference changes, unsubscribe) route via `core-consent-audit` REQ-CNA01 — POST does not own a `consents` table, same pattern as `booking`/`pre-sales`. | `core-consent-audit.md` REQ-CNA01 |
| F-49 | "Sentiment analysis" (source doc D1) is treated as a business rule (rating threshold + keyword detection in free text), not a dependency on the deferred AI/concierge stack — it's simple pattern-matching, not an LLM call. | `Post_Tour_Retention_User_Journeys_v1_0.md` D1 |
| F-50 | The trigger for this whole category is `tour-operations`' REQ-OPS10 (post-ride review) with its "review request" action ticked — POST depends on OPS for this handover. | `Post_Tour_Retention_User_Journeys_v1_0.md` module overview; `tour-operations.md` REQ-OPS10 |

### 12.3 Existing assets inventory (POST)
| Asset | Type | Status | Where (maps to) |
|---|---|---|---|
| `Post_Tour_Retention_User_Journeys_v1_0.md` | Design doc, 10 UJs | Design stage — UJ-POST-04 explicitly v2-sketch; SendGrid stale | → `post-tour` (source) |

### 12.4 Pain points / drivers (POST)
| ID | Pain | Who feels it | Evidence |
|---|---|---|---|
| P-15 | Two independently-drafted retention/erasure policies (POST's 24 months, CNA's 90 days) were never reconciled against each other. | Developer, Owner (compliance) | F-46 |

### 12.5 Explicitly out of scope (this POST pass)
- UJ-POST-04 (shared tour photos) — deferred, source doc's own v2-sketch designation.
- Referral programmes, loyalty tiers, birthday/anniversary touches, tour photographer/UGC pipeline — all explicitly deferred to v2 by the source doc itself.

### 12.6 Seed questions (POST)
| ID | Question | Why it matters |
|---|---|---|
| SQ-47 *(D1)* | Negative-experience trigger criteria — rating threshold only, keyword detection only, negative public review, or all three with priority weighting? | Source doc recommends all three, weighted. |
| SQ-48 *(D2)* | Repeat-booking nudge model — one-shot, or a sequence (soft then stronger)? Include a discount code (needs Stripe Coupon integration)? | Drives REQ authoring for UJ-POST-07. |
| SQ-49 *(D3)* | Lapsed-customer threshold — 6/9/12 months, possibly segment-dependent (tourist vs local)? | Drives UJ-POST-08. |
| SQ-50 *(D4)* | Public review response policy — respond to all, or only substantive ones? | Source doc recommends respond to all, varying depth, never templated word-for-word. |
| SQ-51 *(D5)* | Cross-tour promotion realism — only Hidden City confirmed live; UJ-POST-07 needs a fallback until more tours launch. | Affects REQ-POST07's content logic. |
| SQ-52 *(D6, = F-46)* | GDPR retention period — reconcile against DR-7's 90-day prospect rule, or confirm these are legitimately separate populations/policies? | The core reconciliation question this module surfaces. |
| SQ-53 *(D7)* | Newsletter cadence — quarterly, seasonal-only, or event-driven? | Drives UJ-POST-09. |
| SQ-54 *(D8)* | Review request reminder — single reminder at T+7d if no review, or one-and-done? | Drives REQ-POST02. |
| SQ-55 *(D9)* | Thank-you email classification — transactional (always sent) with consent-conditional marketing CTAs, or fully marketing? | Source doc recommends transactional with conditional CTAs. |
| SQ-56 *(D10)* | Testimonial consent — where does "share my comment as testimonial" flow (which surfaces can use it)? | Needs an explicit per-use consent record. |

---

*Gate 0 self-check is reported at the end of the analysis session, alongside Gates 1 and 2.*
