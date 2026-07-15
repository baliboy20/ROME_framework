# ROME-PROP-042: Artifact-Graph Traceability Model

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-042 |
| **Title** | Artifact-Graph Traceability — First-Class Artifact Citizens, Bipartite Edge Store, and Reverse Index |
| **Status** | Implemented |
| **Implemented In** | v2.3.0 "Claudius" (commit 88cad4c6) |
| **Implemented By** | `subagent.js` (`processReturn`, `coverage`, `rebuildIndexes`), `state.js` (`state.traceability.edges`, `byArtifact` reverse index), `impact.js` (`markStale`, `applyChange`), `traceability-standard.md` |
| **Author** | Archie |
| **Created** | 2026-06-19T00:00:00Z |
| **Targets** | `rome-core/orchestrator/state.js`, `subagent.js`, `impact.js`, `traceability-standard.md` |
| **Companion to** | ROME-PROP-041 (link-level matrix — line/section references, sponsor-OQ gating) |
| **Builds On** | ROME-PROP-035 (state.json), ROME-PROP-038 (component topology), ROME-PROP-040 Part E (incremental re-gen) |

---

## Executive Summary

PROP-041 adds file:line evidence to `state.json` and closes the "count-level vs link-level" gap. It leaves two structural problems unaddressed:

1. **The current delta schema is 1:1** — one requirement → one artifact per record. Many-to-many relationships (one class satisfying several requirements; one requirement spread across several classes) cannot be expressed without duplicating records or losing information.
2. **Artifacts have no identity beyond their file path.** A rename or refactor silently breaks all traceability links. The system cannot distinguish "class was moved" from "class was deleted and a new one created."

This proposal introduces a **typed, identity-stable artifact graph** as the traceability substrate — replacing the flat delta list with a bipartite edge store (requirements ↔ artifacts) plus two derived indexes. PROP-041's line/section references become the `location` field on an edge; the graph model and the matrix model are complementary layers, not alternatives.

**Assessment:** MEDIUM VALUE, MEDIUM EFFORT. Additive to state.json; backward-compatible during transition. Unlocks correct change-impact analysis (PROP-040 Part E) by giving `impact.js` a graph it can actually traverse.

---

## Problem Statement

### P1 — Delta schema enforces 1:1, reality is M:N

The current traceability delta ([state.js:42](../../ROME/rome-core/orchestrator/state.js), [subagent.js:81](../../ROME/rome-core/orchestrator/subagent.js)):

```json
{ "requirement": "REQ-001", "produces": "organisation_service.dart",
  "phase": "P5", "role": "reena", "agent": "reena-1" }
```

`requirement` is singular. `produces` is a path string. To register that `OrganisationService` satisfies both REQ-001 and REQ-012, a sub-agent must emit two separate deltas pointing at the same path. The `coverage()` function counts distinct `requirement` values — so two deltas over the same file still looks like two covered requirements, even though a single shared class is doing the work.

The inverse case — REQ-012 satisfied by three classes (`OrganisationService`, `OrgRepository`, `OrgValidator`) — requires three deltas and no query can ask "give me all artifacts for REQ-012" without a full scan.

### P2 — Artifact identity is a file path; paths are unstable

When Charlie renames `organisation_service.dart` → `org_service.dart`, every delta referencing the old path becomes silently stale. There is no canonical identity for the class independent of its location. `impact.js` compares `d.requirement === req && d.component` — `component` is a topology component id, not the artifact itself. The link from requirement to code unit is implicit and fragile.

### P3 — `impact.js` needs a graph but operates on a list

`computeImpact()` ([impact.js:63](../../ROME/rome-core/orchestrator/impact.js)) scans `traceabilityDeltas` to find components implementing a changed requirement, then expands downstream through the topology DAG. This is a graph traversal written against a flat list. It works only if every (requirement, component) pair has exactly one delta — a constraint not enforced anywhere.

---

## Proposed Solution

### Core model: bipartite edge store

The unit of truth is a directed **edge** between a requirement node and an artifact node. Edges are stored in `state.traceability.edges[]`. Two derived indexes — `byReq` and `byArtifact` — are rebuilt from the edge list on every load; they are never written directly and can never drift.

```
REQ-node  ──[edge]──►  Artifact-node
```

Both node types are first-class. A requirement node is identified by its `REQ-ID` string (already stable — AORDL enforces uniqueness). An artifact node is identified by a logical `artifactId` that is **decoupled from its file path**.

### Artifact identity

```json
{
  "artifactId": "mobile:OrganisationService",
  "logicalName": "OrganisationService",
  "kind": "class",
  "path": "features/org_management/services/organisation_service.dart",
  "component": "mobile"
}
```

`artifactId` is the canonical key: `component:logicalName`. Two components may define identically named artifacts without collision (`mobile:AuthService` and `backend:AuthService` are distinct nodes). `logicalName` is the human-readable name within the component. `kind` constrains the vocabulary:

| Kind | Examples |
|------|----------|
| `class` | Service, Repository, Controller, BLoC |
| `widget` | Flutter widget/screen |
| `schema` | Database table / Parse class |
| `migration` | Database migration file |
| `test` | Test file or test group |
| `document` | Design doc, API spec section |
| `config` | CI config, env file |

`path` is metadata — it can change without invalidating the artifact's identity or its edges. A rename is a `path` update on the artifact node; edges are untouched.

### Edge schema

```json
{
  "req": "REQ-012",
  "reqField": "Invariants[0]",
  "artifactId": "OrganisationService",
  "satisfiesHow": "enforces",
  "location": "features/org_management/services/organisation_service.dart:42",
  "phase": "P5",
  "role": "reena",
  "agent": "reena-1",
  "reqVersion": "1.0",
  "stale": false
}
```

| Field | Purpose |
|-------|---------|
| `req` | REQ-ID (links to AORDL catalog) |
| `reqField` | Optional — which AORDL field this edge satisfies (e.g. `Invariants[0]`, `Postconditions[1]`) |
| `artifactId` | Logical identity of the artifact (stable across renames) |
| `satisfiesHow` | `implements` \| `enforces` \| `validates` \| `documents` |
| `location` | PROP-041 matrix reference — `path:line` or `doc.md#section` |
| `phase` / `role` / `agent` | Provenance (who asserted this edge) |
| `reqVersion` | Version of the requirement at assertion time (enables staleness detection) |
| `stale` | `true` when the upstream requirement has been amended since this edge was asserted |

`satisfiesHow` is a small, closed vocabulary:
- **implements** — primary fulfilment of the requirement intent
- **enforces** — guards an invariant, precondition, or postcondition
- **validates** — a test that proves the requirement is met
- **documents** — a design or specification artifact

### State schema

```json
{
  "traceability": {
    "artifacts": {
      "mobile:OrganisationService": { "logicalName": "OrganisationService", "kind": "class", "path": "features/org_management/services/organisation_service.dart", "component": "mobile" }
    },
    "edges": [
      {
        "req": "REQ-012", "reqField": "Invariants[0]",
        "artifactId": "mobile:OrganisationService", "satisfiesHow": "enforces",
        "location": "features/org_management/services/organisation_service.dart:42",
        "phase": "P5", "role": "reena", "agent": "reena-1",
        "reqVersion": "1.0", "stale": false
      }
    ],
    "byReq": { "REQ-012": ["mobile:OrganisationService", "mobile:OrgRepository", "mobile:OrgValidator"] },
    "byArtifact": { "mobile:OrganisationService": ["REQ-012", "REQ-003"] }
  }
}
```

`byReq` and `byArtifact` are derived; `processReturn()` rebuilds them after merging new edges.

### Sub-agent return contract

Sub-agents declare `traceabilityEdges` (replacing `traceabilityDeltas`) in their structured return. A single return can declare multiple edges across multiple artifacts and multiple requirements:

```json
"traceabilityEdges": [
  {
    "req": "REQ-012", "reqField": "Invariants[0]",
    "artifactId": "OrganisationService", "artifactKind": "class",
    "artifactPath": "features/org_management/services/organisation_service.dart",
    "satisfiesHow": "enforces", "location": "...dart:42"
  },
  {
    "req": "REQ-003",
    "artifactId": "OrganisationService", "artifactKind": "class",
    "artifactPath": "features/org_management/services/organisation_service.dart",
    "satisfiesHow": "implements"
  },
  {
    "req": "REQ-012",
    "artifactId": "OrgServiceTest", "artifactKind": "test",
    "artifactPath": "features/org_management/tests/organisation_service_test.dart",
    "satisfiesHow": "validates"
  }
]
```

`processReturn()` upserts the artifact node (creating it if new, updating `path` if renamed) and appends edges. No duplicate edge check is needed — an agent re-asserting an existing edge is idempotent.

### Staleness

When a CR mutates a requirement, `impact.js` marks all edges where `d.req === changedReq` as `stale: true`. Stale edges are preserved — the code still exists — but the gate (`coverage()`) excludes them from verified coverage until a sub-agent re-asserts them post-change. This is the `dvc status` equivalent: a diff between what was verified and what the current requirement says.

### Coverage metric (replaces current `coverage()`)

Three levels, each a strict superset of the previous:

| Level | Condition | Gate enforcement |
|-------|-----------|-----------------|
| **Linked** | ≥1 edge of any `satisfiesHow` | P3 WARN (aligns with PROP-041 A3) |
| **Implemented** | ≥1 edge with `satisfiesHow: implements` AND no stale edges | P5 entry check |
| **Verified** | ≥1 `implements` edge AND ≥1 `validates` edge AND no stale edges | GATE-P5 STRICT |

Sarah's gate check reads `coverage(state)` — a deterministic function over the edge list, not a sub-agent assertion.

---

## Backward Compatibility

The existing `state.traceability.deltas[]` array is retained during the transition period. `processReturn()` accepts either `traceabilityDeltas` (old) or `traceabilityEdges` (new) from a sub-agent return. Old-format deltas are stored as-is; only new-format edges populate the graph. This allows sub-agents to migrate incrementally without a flag day.

Once all sub-agents emit `traceabilityEdges`, the `deltas` array can be deprecated and eventually removed (separate proposal or minor version bump).

---

## Affected Components

| Component | Change |
|-----------|--------|
| `rome-core/orchestrator/state.js` | Add `traceability.artifacts`, `traceability.edges`, `byReq`, `byArtifact` to schema; retain `deltas` for transition |
| `rome-core/orchestrator/subagent.js` | `processReturn()` accepts `traceabilityEdges`; upserts artifact nodes; builds indexes; validates edge schema |
| `rome-core/orchestrator/subagent.js` | `coverage(state)` replaced with three-level metric (Linked / Implemented / Verified) |
| `rome-core/orchestrator/impact.js` | `computeImpact()` reads `byArtifact` reverse index for requirement → component lookup; marks stale on req mutation |
| Producer agent modes (P3 PMA/Clara, P5 Ashok/Reena/Charlie) | Return `traceabilityEdges` with `artifactId`, `artifactKind`, `satisfiesHow` |
| `rome-core/docs/standards/traceability-standard.md` | Document edge schema, artifact identity model, three-level coverage, staleness |

---

## Acceptance Criteria

1. A passing P5 run's `state.json` contains `traceability.edges` with at least one `implements` and one `validates` edge per in-scope REQ-ID.
2. `byReq["REQ-012"]` returns all artifact IDs whose edges reference REQ-012.
3. `byArtifact["OrganisationService"]` returns all REQ-IDs whose edges reference that artifact.
4. Renaming `organisation_service.dart` → `org_service.dart` requires only a `path` update on the artifact node; no edges change.
5. A CR that mutates REQ-012 sets `stale: true` on all edges where `req === "REQ-012"`; GATE-P5 blocks until those edges are re-asserted.
6. `coverage(state)` returns correct Linked / Implemented / Verified counts for each requirement.
7. A sub-agent returning the old `traceabilityDeltas` format is still accepted and recorded (backward-compat).

---

## Open Questions

All open questions resolved. Proposal is build-ready pending implementation scheduling.

| Ref | Question | Resolution |
|-----|----------|------------|
| ~~OQ-001~~ | Artifact id uniqueness scope | **RESOLVED (sponsor, 2026-06-19): scoped to `component`. Canonical artifact id is `component:artifactId` (e.g. `mobile:AuthService`, `backend:AuthService`). Two components may define identically named artifacts independently without collision.** |
| ~~OQ-002~~ | Edge deduplication vs accumulation | **RESOLVED (sponsor, 2026-06-19): upsert on natural key `(req, artifactId, satisfiesHow)` — latest assertion wins. Provenance fields (`phase`, `role`, `agent`, `reqVersion`) updated to the most recent assertion. No duplicate edges in the graph.** |

---

## Revision Log

| Version | Date | Summary |
|---------|------|---------|
| 0.1 | 2026-06-19T00:00:00Z | Initial draft. Bipartite edge store, artifact identity model, three-level coverage, staleness via `stale` flag, backward compat with `deltas`. |
| 0.2 | 2026-06-19T00:00:00Z | OQ-001 resolved (sponsor): canonical artifact id is `component:artifactId` — same name in different components = two distinct nodes. OQ-002 resolved (sponsor): upsert on `(req, artifactId, satisfiesHow)`, latest assertion wins. All OQs closed; proposal build-ready. |
| 1.0 | 2026-07-15T00:00:00Z | Status → Implemented. Bipartite edge store, `component:artifactId` identity, reverse index, and three-level coverage built in commit 88cad4c6; released in v2.3.0 "Claudius". Legacy `deltas[]` retained for backward compat. Moved to `implemented-proposals/`. |
