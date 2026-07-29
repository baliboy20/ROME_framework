# Flow Standard

| Field | Value |
|-------|-------|
| **UID** | ROME-STD-FLOW |
| **Title** | FLOW (Formal Workflow Artifact) — Authoritative Standard |
| **Status** | Active |
| **Created** | 2026-07-29T00:00:00Z |
| **Origin** | ROME-PROP-057 |
| **Library** | `ROME/rome-core/lib/flow/flow-lib.cjs` (uses js-yaml when present; bundled YAML-subset fallback in vendored engines, which exclude node_modules — fallback dumps JSON, which is valid YAML) |
| **CLIs** | `validate-flow.cjs`, `flow-draft.cjs`, `flow-render.cjs` (same folder) |
| **Companion** | ROME-STD-AORDL (flows sit ABOVE requirements; never restate them) |

Single source of truth for FLOW artifact structure and validation. Design
position: statechart discipline underneath, journey presentation on top.
AORDL atomicity is untouched — a flow composes requirements by reference.

## 1. Location & naming

`<project>/ARTIFACTS/_requirements/flows/FLOW-###.yaml`. The derived reverse
index `flow-index.json` lives alongside — written by the validator, NEVER
hand-authored (it cannot go stale; a hand edit is meaningless).

## 2. Schema (normative)

| Field | Rule |
|-------|------|
| `ID` | `FLOW-###`, stable |
| `Name` | business journey name |
| `Status` | `DRAFT` \| `SPONSOR_CONFIRMED` |
| `Trigger` | what starts the flow (plain language) |
| `Steps[]` | `{id, kind: req\|system\|decision\|end}`; `kind: req` → `req: REQ-###` (reference ONLY — content stays in the REQ); `kind: system` → `action` (plain language — system behaviour lives ONLY here, AORDL's actor rule is untouched); `kind: end` → `label` |
| `Transitions[]` | `{from, to, on, guard?}`; `on` ∈ `actor` \| `system:<event>` \| `timer:<duration>` \| `error:<req>/<condition>` |
| `ErrorRouting[]` | `{req, error, route}` — one entry per declared error of every referenced REQ; `route` = a step id or `UNROUTED` (permitted ONLY while DRAFT) |
| `Confirmation` | `{sponsor: true, timestamp}` — REQUIRED when Status is SPONSOR_CONFIRMED |
| `Invariants`, `OpenQuestions` | as in AORDL |

## 3. Validation (deterministic; backs GATE-P1 fact `flowValidation`)

| Rule | Violation |
|------|-----------|
| V0 | malformed ID/Status/empty Steps |
| V1 | step references a REQ that does not exist |
| V2 | step unreachable from the entry step (error routes count as arrows) |
| V3 | non-end step with no path to any end state |
| V4a | a declared REQ error with no ErrorRouting entry (AX-39) |
| V4b | an ErrorRouting entry for an error the REQ does not declare (stale route) |
| V5 | duplicate/undeclared step ids; malformed step kinds |
| V6 | free-form trigger (`on` outside the grammar); system step without plain-language action |
| V7 | `SPONSOR_CONFIRMED` without recorded `Confirmation` (AX-38) |

`UNROUTED` is a warning while DRAFT and a failure once confirmed (AX-39).

## 4. Gate integration (ROME-AX-38)

`flowValidation` is a required mechanical fact at GATE-P1. It passes only when
(a) every FLOW is validator-clean AND `SPONSOR_CONFIRMED`, or (b) the sponsor's
flows-omission is recorded on the increment (`state.js#recordFlowsOmission` —
the AX-27 pattern: absence is a decision, never a default). A DRAFT at the
gate is unfinished sponsor work, not a pass.

## 5. Lifecycle

- **P1 (Talib):** after requirements, `flow-draft.cjs` pre-populates DRAFT
  skeletons from pre/postcondition chains (heuristic; every inference carries
  `confidence`, every error starts `UNROUTED`). The sponsor fills the arrows
  AORDL never contained — triggers, timers, failure routes — and confirms.
  `flow-draft` refuses to overwrite existing flows: once authored, they are
  sponsor-owned.
- **Rendering:** `flow-render.cjs` generates Mermaid FROM the artifact for
  Seez display. Diagrams are views; they are never edited and never authored.
- **P2:** the dependency graph is seeded from confirmed flows where present —
  authored order outranks inferred order.
- **P3 (PMA/Clara):** confirmed flows are binding inputs; Clara's
  `user-flows.md` is a rendering of FLOW artifacts, not an independent drawing.
- **Changes:** flow edits are requirement-tier rework (CT-3, PROP-054).
- **Orphans:** requirements referenced by no flow are surfaced by the
  validator for sponsor disposition (missing journey or dead requirement).

## 6. Source-of-truth boundaries

A flow never restates a requirement's content — it points. The reverse index
is derived. The diagram is generated. Disagreement between a flow and a
requirement (V4b) is a validation failure for the sponsor to resolve, never a
precedence rule applied silently.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-07-29 | Initial standard (PROP-057): schema, V0–V7 validation, GATE-P1 fact, draft-and-confirm lifecycle, source-of-truth boundaries. |
