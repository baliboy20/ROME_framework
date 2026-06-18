# Traceability Standard

| Field | Value |
|-------|-------|
| **UID** | ROME-STD-TRACE |
| **Title** | Requirement→code traceability — chain, delta schema, coverage |
| **Status** | Active |
| **Created** | 2026-06-18T00:00:00Z |
| **Origin** | ROME-PROP-034 Track A; implements EP-1 for PROP-035..039 |
| **Implemented by** | `rome-core/orchestrator/subagent.js` (`processReturn`, `coverage`), `state.js` (`state.traceability`) |

Single source of truth for how ROME records and measures traceability under the
single-session model. Documents behavior the code already enforces.

---

## 1. The chain

```
user input → REQ-### (AORDL) → feature/entity → design (+contract) → component(s) → code → test
```

For multi-component apps (PROP-038) a requirement may land in several components,
so the chain branches at `component(s)` and coverage is measured per component.

## 2. Traceability delta (the unit recorded)

Sub-agents return deltas in their structured result (see agent-roles-standard §4);
`processReturn` merges them into `state.traceability.deltas`:

```json
{ "requirement": "REQ-001", "produces": "architecture.md", "component": "<optional>",
  "phase": "P3", "role": "pma", "agent": "pma-1" }
```

- `requirement` — the REQ-### this artifact serves (links the chain backward).
- `produces` — the artifact/file produced.
- `component` — for P5, which component (enables per-component coverage).
- `phase`/`role`/`agent` — provenance (who produced it, when in the lifecycle).

Provenance is mandatory: every delta records its producing role/agent (EP-1
authorship). Anonymous artifacts are not traceable.

## 3. Coverage metric

`coverage(state)` → `{ requirementsCovered, deltas }`:
- **requirementsCovered** = distinct `requirement` values with ≥1 delta.
- Headline progress metric = requirement coverage (not "phase N of 6").
- **Verified coverage** (P5) = requirements whose code-component deltas are also
  `VERIFIED` by the executability gate (PROP-039) — "traced to code that runs."

## 4. Audit copy

Each delta and dispatch/return is also mirrored to the activity-log MCP (audit
trail, D2). `state.json` is the source of truth; the log is the immutable record.

## 5. Gate use

- Per-phase gates (Sarah) check the phase's expected deltas exist before APPROVE.
- GATE-P5 additionally requires verified coverage + zero contract drift.
- The deterministic guard records the verdict; coverage is computed from deltas,
  not asserted by narration.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial standard — chain, delta schema, coverage/verified-coverage; documents the implemented traceability behavior (PROP-034 Track A). |
