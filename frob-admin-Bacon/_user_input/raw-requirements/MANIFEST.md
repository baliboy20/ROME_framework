# FOB — Design Document Manifest

| | |
|---|---|
| **As of** | 2026-07-21, post run **Bacon** + Stages 7–8 validation (BASELINE-READY) |
| **Rule of precedence** | On conflict, higher wins: **live D1 DDL → Decision Records + `FOB-TSPEC-001` (TDRs) → module specs → Domain Lexicon → Data Dictionary → Surface×Journey Coverage → Operational Workflows → Architecture Allocation → Claude Design handovers.** DRs bind *business* scope; the TDRs bind the *technical* build (P3–P5). A SUPERSEDED file is history, never a source. |

The single index to the aligned set. If you read nothing else, read this to know which doc answers which question.

---

## Current documents

### Governance / spine
1. `VERSIONING.md` — **Run ledger** (philosopher codenames). Which run produced which doc.
2. `Decision_Record_Aristotle_2026-07-20.md` + `_Booking_` / `_PreSales_` / `_TourOps_` / `_PreTour_` / `_Fleet_` / `_PostTour_` + `Decision_Record_Bacon_2026-07-21.md` — **The tie-breakers.** Every ratified decision (DR-###). *Read when* two docs seem to disagree, or before changing anything.
3. `FOB-TSPEC-001_Technical_Spec.md` — **The binding technical decisions (TDRs).** Stack, vendor, deployment, dev-env, patterns. *Read when* the build must know *how* it's built (Cloudflare/D1/Stripe/Postmark/JWT/Flutter). Companion to the AORDL requirements; `prose suggests, TDRs bind`.
4. `Propagation_Plan_2026-07-20.md` — how a ratified decision was threaded through the docs.

### Analysis (what the business needs)
4. `Intake_Note.md` — goals, facts, seed questions. *Read when* you need the why behind a requirement.
5. `DOMAIN-LEXICON.md` — **Vocabulary + entity/state model.** Terms with "distinct-from", actors, Built-entity attributes, state tables, fixtures. *Read first, always.*
6. `Journey_Index.md` — every UJ-### (actor, trigger, outcome, scope). *Read when* you need the thread a requirement lives on.

### Requirements (normative behaviour)
7. `Module_Map.md` — **modules, dependency graph, journey→module allocation, unowned ground.** *Read when* you need boundaries or what a module presumes.
8. Module specs (Stage 4, normative): `core-auth`, `core-consent-audit`, `core-notifications`, `core-seo`, `core-data-access`, `core-design-system`, `booking`, `pre-sales`, `tour-operations`, `pre-tour`, `fleet-equipment`, `post-tour`, `back-office`. *Read* the one you're building; read others' **headers only**.

### Design (derived, non-normative except where noted)
9. `Data_Dictionary.md` (6a) — **field-level truth + enum registry.** *Read when* you need a field, type, or enum. The registry is the single source for closed value sets.
10. `Surface_Journey_Coverage.md` (6b) — the screen/email/page inventory (`W/A/G/E/P` codes) mapped to journeys + REQs, with states.
11. `Operational_Workflows.md` (6c) — one step-table per journey; each step tagged surface + REQ. *Read when* you need the flow.
12. `Architecture_Allocation.md` (6d) — every REQ across frontend/middle/data; a named provider for every `presumes`.
13. Handovers: `Handover_Booking_ClaudeDesign_*`, `Handover_AllModules_ClaudeDesign_*`, `Handover_BackOffice_ClaudeDesign_Bacon_*` — distilled paste-sets for the visual tool (not pipeline artifacts).

### Gate / handoff
14. `Alignment_And_Validation_2026-07-21.md` (7–8) — traceability audit + STRICT verdict = **BASELINE-READY**.
15. `BASELINE_ROME_Handoff_2026-07-21.md` (9) — frozen set + per-module build paste sets.
16. `SESSION-STATE.md` — resume handoff for a cold session.

---

## Reading orders by task

| If you are… | Read in this order |
|---|---|
| **Building a module** | that module's spec → `FOB-TSPEC-001` (the technical constraints) → `DOMAIN-LEXICON` → its Decision Record(s) → `Data_Dictionary` → its `Operational_Workflows` step-tables → `Architecture_Allocation` rows → **other modules' spec headers only** |
| **Resolving a conflict** | the relevant Decision Record → the module spec → this Manifest's precedence rule |
| **Designing a screen** | `Surface_Journey_Coverage` (the surface) → `Operational_Workflows` (its flow) → the REQ in the module spec → the Claude Design handover |
| **Adding scope** | `Journey_Index` → `Module_Map` (does it fit a module? create unowned-ground row) → `/and-ratify` → then design |
| **Orienting cold** | `SESSION-STATE.md` → this Manifest → `Module_Map` |

## Maintenance rules (change control)
1. **New decision → Decision Record first** → propagate → stale-reference sweep.
2. **New field/enum → Data-Dictionary revision first** → specs reference it.
3. **New surface → must earn a `Surface_Journey_Coverage` row** (journey + REQ) or it isn't built.
4. **Version bump = file rename + companion header refs updated in the same pass.**
5. Superseded docs are banner-marked and retained for audit, never cited as a source.

## Known outstanding (content, not structure — carried, not hidden)
- `UJ-TOUR-08` has no REQ (DR-T1 consequence); 2 undriven bike states (DR-F8/F9); 3 ratified-but-unauthored REQs (DR-B8 recovery email, DR-F1 maintenance trigger, DR-F6 certification gate).
- 6 open decisions carried with interim defaults (D-NOTIF-1/2, D-TOUR-2/3, D-OPS-5, DR-BO4/6) — see `Alignment_And_Validation_2026-07-21.md` §2.
- Deferred scope: OTA (v2), gift vouchers, concierge/AI, POST retention journeys UJ-POST-05–09 — all marked out-of-scope, not missing.
