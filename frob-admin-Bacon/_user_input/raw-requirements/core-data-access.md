---
module: DATA
status: PROPOSED
actors: [Owner, System]
depends-on: []
presumes: [Cloudflare D1]
---

# core-data-access — Module Spec

| | |
|---|---|
| **Document** | core-data-access module spec (Stage 4) |
| **Version** | 0.1 |
| **Status** | PROPOSED — **presumed shared subsystem**, no AORDL requirements (see §4). |
| **Sources** | `DOMAIN-LEXICON.md` · `Intake_Note.md` (F-01, F-02, F-03, F-13) · `technical-state/FOB_Technical_Context_Summary.md` §H, §K · `ROME-GUIDE-001` (Part 5) |

## 1. Intent
Provide one D1 access pattern and a versioned, run-once-in-order migration mechanism that every business function persists through. **Success:** no business function reaches around the shared layer, and a schema change applies exactly once, in order, atomically.

## 2. Facts
| ID | Fact | Source |
|---|---|---|
| F-01 | Cloudflare-native; D1 (UK) is the operational store; no Durable Objects/Queues. | Reconciliation §3 |
| F-02 | admin-rome is code-complete: 6 D1 tables via `database/migrations/`, real prod IDs, un-deployed. | Tech Context §I |
| F-03 | Table ownership across admin-rome + route-pipeline is enumerated in the lexicon/intake. | Tech Context §K |
| F-13 | Two divergent copies (`rome-dev` / `admin-rome`) — a pre-deploy blocker (R-D4). | Tech Context §I |

## 3. Decisions needed
| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-DATA-1 | Canonical source for migrations (R-D4/SQ-05). | `rome-dev` \| `admin-rome` | `admin-rome` (carries CI); reconcile before deploy. | **CLOSED — DR-1** (= D-AUTH-1, same question). `admin-rome` canonical; `rome-dev` spurious. |
| D-DATA-2 | Idempotency-key store home (SQ-07). | D1 \| KV | D1 (`webhook_events` pattern) — see `core-notifications` D-NOTIF-3. | **CLOSED — DR-8** (= D-NOTIF-3). D1, `webhook_events` pattern. |
| D-DATA-3 | Slot-hold transaction pattern (KI-6/R-D2). | `held_until`+sweep \| transactional decrement | Transactional decrement (lean); owned by `booking`, not here. | **RESOLVED — DR-B3** (`Decision_Record_Booking_Aristotle_2026-07-20.md`), ratified in `booking`'s own Stage 5, as anticipated here. D1 transactional decrement confirmed. |

## 4. Requirements
**None authored at business level — this is a presumed shared subsystem.** Per ROME-GUIDE-001 Rule 3 and Part 5, a "single access layer" and a "migration runner" are *solution/architecture* concerns (the banned vocabulary — schema, database, query — is inherent to them), not actor-level business behaviour. They are declared here as facts and allocated at **Stage 6d (architecture)**, and are consumed by every other module via `presumes: [core-data-access]` / `presumes: [Cloudflare D1]`.

*Migration integrity is stated as an invariant for the designer to honour (not a MUST-requirement): a migration applies at most once, in ascending version order, atomically — a failed migration leaves the schema unchanged.*

## 5. Journeys
| UJ id | Journey | Disposition |
|---|---|---|
| UJ-DATA-01 | Apply migration in order | **Infrastructure** — realised at Stage 6d; no actor-level REQ. |
| UJ-DATA-02 | Persist via one access pattern | **Infrastructure** — architecture constraint, not behaviour. |
