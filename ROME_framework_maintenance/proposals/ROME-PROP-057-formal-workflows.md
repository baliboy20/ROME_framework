# ROME-PROP-057 — Formal Workflows (FLOW artifacts above AORDL)

Document UID: ROME-PROP-057
Status: Draft
Document Type: Framework Proposal
Origin: Sponsor discussion 2026-07-29 (workflow/user-journey gap analysis)
Targets: new `ROME-STD-FLOW` standard, `validate-flow.js`, P1/P3 integration, ontology/lexicon companions
Axioms: introduces AX-38 (validated flows), AX-39 (no unrouted error)

---

## In Plain Terms

Today the framework records *what* the system must do (one requirement file
per action) but not *how the actions chain together*: what order they happen
in, what the system does by itself (send a confirmation email), and what
happens after something fails (retry? release the booking? notify someone?).
Designers currently re-guess that chain late, from fragments. This proposal
adds a second small file type — a workflow — written at requirements time and
approved by the sponsor like any requirement. Each workflow names its steps
(pointing at existing requirements), the arrows between them (who or what
triggers each move, including timers and system events), and the exit route
for every possible failure. A checker verifies the workflow mechanically —
every step reachable, every failure routed, every referenced requirement
real — and draws the diagram automatically, so the picture the sponsor
approves can never drift from the record the agents build from. Requirements
stay exactly as they are; workflows sit above them.

---

## 1. Problem

1. **The arrows are nowhere.** AORDL requirements are deliberately atomic
   (one actor, one verb, one object). Sequence is only implied by
   Preconditions/Postconditions free text; the P2 dependency graph derives it
   by LLM judgement — inferred, not sponsored.
2. **System-initiated and temporal behaviour has no home.** "Payment failure
   *triggers* an email", "release the reservation after 15 minutes" — AORDL
   (correctly) refuses a generic/system actor, so this logic is either
   contorted into a human-actor REQ or lost.
3. **Failure paths dangle.** A REQ's `Errors` field records *what went wrong*
   and the user message — never *what happens next*. Most business risk lives
   on exactly those arrows.
4. **Journeys exist but are decoration.** Clara's `user-flows.md` (P3,
   Mermaid, optional) arrives after requirements are locked, is drawn by
   inference, is not validated, gated, or traced, and is absent on non-visual
   projects.

## 2. Design position (best-practice alignment)

Adopt the established blend: **statechart discipline underneath, journey
presentation on top** — the same pattern AORDL itself uses (strict validated
text file; readable rendering). BPMN's content informs the vocabulary
(events, gateways, compensation) but its notation/XML is rejected as
sponsor- and LLM-hostile. Flows do NOT loosen AORDL atomicity; they compose
it.

## 3. The FLOW artifact

`ARTIFACTS/_requirements/flows/FLOW-###.yaml`, sibling tier to `REQ-###.yaml`.

### 3.1 Schema (normative fields)

| Field | Meaning |
|-------|---------|
| `ID` | `FLOW-###` — stable UID |
| `Name` | Business journey name ("Book and pay for a session") |
| `Trigger` | What starts the flow: actor intent, system event, or timer |
| `Steps[]` | Each: `id` (local), `kind: req \| system \| decision \| end`, and for `kind: req` a `req: REQ-###` reference; for `kind: system` a plain-language action ("send booking-confirmation email"); for `kind: end` an end-state label (SUCCESS / ABANDONED / …) |
| `Transitions[]` | Each: `from`, `to`, `on` (trigger: `actor` \| `system:<event>` \| `timer:<duration>` \| `error:<REQ-###>/<error-condition>`), optional `guard` (business condition, plain language) |
| `ErrorRouting[]` | Explicit map: every `Errors` entry of every referenced REQ → a transition or a declared terminal (`end: FAILED_PAYMENT`) |
| `Invariants` | Flow-level domain truths ("a reservation is never held unpaid past 15 minutes") |
| `OpenQuestions` | As in AORDL |
| `Status` | DRAFT → SPONSOR_CONFIRMED (only confirmed flows bind design) |

System steps live ONLY in flows — this legitimizes system behaviour without
touching AORDL's actor rule.

### 3.2 Validator (`validate-flow.js`, deterministic, no LLM)

FAIL conditions:
- V1 referenced `REQ-###` does not exist or fails AORDL validation
- V2 unreachable step; V3 step with no path to an `end`
- V4 any `Errors` entry of a referenced REQ absent from `ErrorRouting` (AX-39)
- V5 transition `from`/`to` not declared as steps; duplicate step ids
- V6 timer/system triggers without a plain-language description
- V7 `Status: SPONSOR_CONFIRMED` without a recorded sponsor confirmation

### 3.3 Rendering

Mermaid generated FROM the YAML (`flow-render.cjs`), displayed via Seez at
the sponsor checkpoint. Hand-drawn diagrams are non-artifacts; generated
diagrams are never edited.

## 4. Cross-referencing

- **Authored direction only: FLOW → REQ.** The reverse index (REQ → flows) is
  DERIVED by the validator and written to
  `ARTIFACTS/_requirements/flows/flow-index.json` — never hand-authored, so
  it cannot go stale. AORDL's 13 fields are untouched.
- Validator WARNS on **orphan REQs** (no flow references them — a missing
  journey or a dead requirement; sponsor dispositions at the P1 checkpoint).
- Traceability: flows register as artifacts (kind `flow`); edges
  `REQ → FLOW` recorded so blast radius (PROP-054) includes affected flows —
  a changed requirement lights up every journey that crosses it.

## 5. Lifecycle integration

- **P1 (Talib):** after REQ authoring, draft flow skeletons are GENERATED
  from the Pre/Postcondition chain (draft-and-confirm: the derivable half is
  pre-populated, dangling error exits explicitly marked `UNROUTED`). Sponsor
  fills/corrects the arrows via the checkpoint; confirmation sets
  `SPONSOR_CONFIRMED`.
- **GATE-P1:** new required fact `flowValidation` — every flow validates; no
  UNROUTED errors in confirmed flows. Projects with no flows (sponsor
  declares journey-less scope, e.g. pure library) record an explicit
  omission, AX-27-style — absence is a decision, never a default.
- **P2 (analysis):** dependency graph seeded from flows where present
  (authored order outranks inferred order).
- **P3 (PMA/Clara):** confirmed flows are binding inputs; Clara's
  `user-flows.md` becomes a RENDERING of FLOW artifacts, not an independent
  drawing.
- **Changes (PROP-054):** flow edits classify as CT-3 (requirement-tier
  rework) — flows are requirement-tier artifacts.

## 6. New axioms

| ID | Statement | Enforcement |
|----|-----------|-------------|
| AX-38 | Business flow is authored and sponsor-confirmed, never inferred: design phases consume only SPONSOR_CONFIRMED, validator-clean FLOW artifacts (or a recorded sponsor omission). Generated skeletons are drafts until confirmed. | ENFORCED (`validate-flow.js` via GATE-P1 required fact `flowValidation`; V7 sponsor-confirmation check) |
| AX-39 | No unrouted failure: every error declared by a requirement referenced in a flow has an explicit onward route (transition or declared terminal). A dangling failure fails validation, not review. | ENFORCED (`validate-flow.js` V4) |

## 7. Optional companion (recommended, separable)

A controlled **state vocabulary** per business object
(`ARTIFACTS/_requirements/states.yaml`: object → allowed states). REQ
Pre/Postconditions referencing declared states make skeleton generation
mechanical instead of inferred. Additive; AORDL fields unchanged; adopt in a
follow-up if PROP-057 proves out.

## 8. Versioning

MINOR (convention change: new artifact kind, new gate fact) → v3.4.0 with
migration step per AX-35. Existing projects: flows absent → the gate fact is
satisfied by a recorded sponsor omission at next re-entry; no retro-authoring
forced. Semantics note in migration-log.md: pre-3.4.0 designs derived flow
by inference — historical fact, not a violation.

## 9. Out of scope

- BPMN import/export; executable workflow engines (flows are requirements
  artifacts, not runtime orchestration).
- Loosening AORDL atomicity or its actor rule.
- Retroactive flow authoring for delivered projects.

---

## Revision History

| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-29 | Initial draft: FLOW artifact (statechart-disciplined, journey-presented), deterministic validator, derived reverse index, P1 draft-and-confirm integration, AX-38/39. |
