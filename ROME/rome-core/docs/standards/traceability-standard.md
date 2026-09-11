# Traceability Standard

| Field | Value |
|-------|-------|
| **UID** | ROME-STD-TRACE |
| **Title** | Requirement→artifact traceability — edge store, coverage, matrix, OQ gating |
| **Status** | Active |
| **Created** | 2026-06-18T00:00:00Z |
| **Updated** | 2026-06-19T00:00:00Z |
| **Origin** | ROME-PROP-034 Track A; extended by PROP-042 (graph model) and PROP-041 (matrix + OQ gating) |
| **Implemented by** | `subagent.js` (`processReturn`, `coverage`, `rebuildIndexes`), `verification.js` (`checkTraceability`, `buildMatrix`, `checkMatrix`, `checkSponsorOq`), `impact.js` (`markStale`, `applyChange`, `resolveDeferral`), `state.js` (`state.traceability`, `state.oq`) |

Single source of truth for how ROME records and measures traceability. Documents behaviour the code already enforces.

---

## 1. The chain

```
user input → REQ-### (AORDL) → feature/entity → design (+contract) → component(s) → code → test
```

A requirement may be satisfied by multiple artifacts (M:N). The traceability graph is bipartite — requirements on one side, artifacts on the other — with typed, directed edges between them.

---

## 2. Artifact identity

Every artifact is a first-class node, identified by a **canonical id** that is stable across file renames:

```
canonicalId = component:logicalName   (e.g. "mobile:OrganisationService")
```

- `component` — topology component (PROP-038). Scopes the id so two components may define identically named artifacts without collision.
- `logicalName` — class, widget, schema, service, test suite, document, etc.
- `path` — file location; metadata only. A rename updates `path` but leaves the canonical id and all its edges unchanged.

**Artifact kinds:** `class` | `widget` | `schema` | `migration` | `test` | `document` | `config`

---

## 3. Edge schema (the unit recorded)

Two kinds of edge live in `state.traceability.edges`, distinguished by `source` (PROP-058 / AX-42):

- **Scanned** (`source: "scan"`) — every `implements`, `enforces` and `validates` edge. Written only by `guard-cli scan`, which reads the requirement ids out of comments in the source tree (`orchestrator/scan.js`) and replaces the previous scan wholesale. Producers never declare these; a return that does is rejected.
- **Declared** — `documents` edges only. Sub-agents return them in `traceabilityEdges[]`; `processReturn` upserts them. A declared edge may not cite an artifact of the same return (no self-citation).

A scanned edge:

```json
{
  "req": "REQ-012",
  "artifactId": "mobile:features/org/services/org_service.dart",
  "satisfiesHow": "implements",
  "location": "features/org/services/org_service.dart:42",
  "phase": "P5", "role": "scanner", "agent": "scan",
  "increment": 3,
  "source": "scan",
  "stale": false
}
```

A declared (design) edge:

```json
{
  "req": "REQ-012",
  "reqField": "Invariants[0]",
  "artifactId": "design:api-design",
  "satisfiesHow": "documents",
  "location": "ARTIFACTS/_design/api-design.md#create-organisation",
  "phase": "P3", "role": "pma", "agent": "pma-1",
  "reqVersion": "1.0",
  "stale": false
}
```

| Field | Required | Purpose |
|-------|----------|---------|
| `req` | Yes | REQ-### this edge satisfies |
| `reqField` | No | Which AORDL field (e.g. `Invariants[0]`, `Postconditions[1]`) |
| `artifactId` | Yes | Canonical id (`component:logicalName`) |
| `satisfiesHow` | Yes | `implements` \| `enforces` \| `validates` (scanned only) \| `documents` (declared only) |
| `source` | Auto | `scan` on scanned edges; absent on declared |
| `location` | Scanned: always; declared: Yes | `path:line` (code/test, from the annotation line) or `doc.md#section` (design) |
| `phase` / `role` / `agent` | Auto | Provenance — set by `processReturn` from the return envelope |
| `reqVersion` | No | Requirement version at assertion time; enables staleness detection |
| `stale` | Auto | `true` when the upstream requirement has been amended since assertion |

**`satisfiesHow` vocabulary:**
- `implements` — primary fulfilment of the requirement intent
- `enforces` — guards an invariant, precondition, or postcondition
- `validates` — a test that proves the requirement is met
- `documents` — a design or specification artifact (section anchor)

**Upsert rule:** natural key is `(req, artifactId, satisfiesHow)`. Latest assertion wins — provenance fields update; no duplicate edges accumulate.

---

## 4. Indexes (derived, never written directly)

```json
"byReq":      { "REQ-012": ["mobile:OrganisationService", "mobile:OrgRepository"] },
"byArtifact": { "mobile:OrganisationService": ["REQ-012", "REQ-003"] }
```

Rebuilt by `rebuildIndexes()` after every edge write. Used by `impact.js:computeImpact()` and `guard-cli.cjs trace`.

---

## 5. Coverage metric — three levels

`coverage(state)` returns:

| Level | Condition | Gate enforcement |
|-------|-----------|-----------------|
| **linked** | ≥1 non-stale edge (any `satisfiesHow`) | P3 WARN |
| **implemented** | ≥1 non-stale `implements` edge | P5 entry |
| **verified** | ≥1 `implements` AND ≥1 `validates`, both non-stale | GATE-P5 STRICT |

`requirementsCovered` is retained for backward compat (= `linked` count + legacy delta reqs).

---

## 6. Link-level matrix (PROP-041, restored by PROP-058)

`buildMatrix(state, requirements)` projects edges into per-requirement buckets and **returns** the result. Nothing stores it. (The field `state.traceability.matrix` that earlier revisions of this section described was never written by any version of the framework; `state.js#load` removes it and audits `MATRIX_FIELD_DROPPED`.)

```json
{
  "REQ-012": {
    "design": ["ARTIFACTS/_design/api-design.md#create-organisation"],
    "code":   ["features/org/services/org_service.dart:42"],
    "tests":  ["features/org/tests/org_service_test.dart:30"],
    "status": "linked"
  }
}
```

- `design` — declared `documents` edges with a location
- `code` — **scanned** `implements` / `enforces` edges
- `tests` — **scanned** `validates` edges

Declared code/test edges are not evidence and are ignored.

**Status:** `linked` (code + tests present) | `partial` (one missing) | `unlinked` (neither)

`checkMatrix(state, requirements?, { phase })` — `requirements` is an override for reports and tests; the gate path reads the increment scope (§9):
- **P3 / P3.5: WARN-only** — always `pass: true`; warns on requirements with no design link.
- **P5: STRICT** — `pass: false` if any in-scope requirement is `partial` or `unlinked`, **or** if any requirement recorded `linked` at the previous sealed increment is no longer `linked` (regression, whatever this increment's scope).
- **No scope recorded → INCONCLUSIVE** (`pass: false`, `state: 'INCONCLUSIVE'`).

**Annotation (the producer's duty).** A source or test file satisfies a requirement when a comment in it contains the requirement id, matching `id_pattern` in `lib/registry/validate-aordl.yaml`. Any comment form counts; abbreviated runs (`REQ-FLEET09/10/11`) expand. Ids in string literals or code do not count. A file under the project's test paths (`state.traceability.testPaths`, default `test/`, `tests/`, `__tests__/`, `*_test.*`, `*.test.*`, `*.spec.*`) yields `validates`; any other file yields `implements`. Component comes from `state.traceability.componentRoots` (`{ component: pathPrefix }`), null when unmapped.

Commands:

```
guard-cli.cjs scope  <state.json> --ts <iso> (--from-corpus | --req REQ-A,REQ-B)   # set increment scope
guard-cli.cjs scan   <state.json> --ts <iso> [--req REQ-012] [--json]              # derive + persist code/test links
guard-cli.cjs verify <state.json> --ts <iso> --phase P5                            # compute + record traceability/matrix/testAdequacy
guard-cli.cjs trace  <state.json> --req REQ-012                                    # computed view, sources labelled
```

`scan` also reports **unattributed** files (source with no requirement id — WARN at v3.5.0, FAIL from the next MINOR) and **unknown ids** (annotations naming no requirement file — FAIL at P5).

---

## 7. Staleness and change-requests (PROP-042 / PROP-040 E)

A change-request is routed through one deterministic entry, `impact.js:applyChange(state, change, opts)`:

1. **Stale** — `markStale(state, change.requirements)` sets `stale: true` on every edge of each changed requirement. Stale edges are preserved (the code still exists) but excluded from all coverage metrics and matrix checks, so they **block GATE-P5** until the affected sub-agents re-assert fresh edges post-change.
2. **Scope** — when a topology graph is available, `computeImpact()` returns the affected component set (changed components + downstream closure + contract consumers + components implementing the changed requirement), so re-generation runs only where needed.

`applyChange` returns `{ staled: [REQ], impact: { components, seeds, reasons } | null }`. This is the `dvc status` equivalent — a diff between what was verified and what the current requirement says. `markStale` keeps stale artifacts in `byReq` (impact analysis still needs to know what *was* implementing the changed requirement).

---

## 8. Sponsor-OQ gating (PROP-041)

P2 OQs are classified by Talib as `owner: talib` (resolvable from PRD) or `owner: sponsor` (business fact requiring sponsor confirmation).

Talib returns `openQuestions: { resolvedByTalib, awaitingSponsor, deferrals[] }`.  
`processReturn` merges into `state.oq`; `awaitingSponsor` replaces on each return (latest wins), `resolvedByTalib` accumulates, `deferrals` append.

`checkSponsorOq(state)` passes only when **both**:
- `state.oq.awaitingSponsor === 0`, AND
- there are **no unauthorized deferrals** — every provisional deferral carries `sponsorAuthorized: true`.

GATE-P2 requires `sponsorOq` to pass before advance.

**Deferral authorization (B3).** A sponsor may explicitly defer a non-critical OQ via the PRIN-002 Seez interface. The deferral is recorded in `state.oq.deferrals[]` with `provisional: true`, `sponsorAuthorized: true`, and `affectedReqs[]`. An unauthorized deferral (one missing `sponsorAuthorized: true`) is an **invalid escape hatch**: `checkSponsorOq` blocks the gate on it even if `awaitingSponsor` was zeroed — preventing a sub-agent from closing a sponsor OQ unilaterally by recording an unauthorized deferral.

**Deferral resolution (B4 / A5).** When the sponsor later answers a deferred OQ, `impact.js:resolveDeferral(state, oqId)` marks the deferral `resolved: true` (no longer provisional) and stales the edges of its `affectedReqs`, scoping PROP-039 re-generation to exactly those requirements.

---

## 9. Gate summary

| Gate | Required mechanical checks |
|------|---------------------------|
| GATE-P1 | `aordl`, `traceability` |
| GATE-P2 | `traceability`, `sponsorOq` |
| GATE-P3 | `traceability`, `matrix` (warn-only) |
| GATE-P3.5 | `traceability`, `matrix` (warn-only) |
| GATE-P4 | `secrets`, `traceability` |
| GATE-P5 | `executability`, `testAdequacy`, `secrets`, `contracts`, `traceability`, `matrix` (strict) |

**Scope and recording (PROP-058).** `traceability`, `matrix` and `testAdequacy` run over `active(state).scope.requirements`, set by `guard-cli scope` (or automatically at intake from the corpus, and at change-begin from the change's traced requirements). They are computed and recorded by `guard-cli verify`; `guard-cli check`/`advance` recomputes them and refuses a record that disagrees (AX-40). `testAdequacy` reads `state.traceability.testCoverage`, the union of every increment's `testManifest`, so a mature requirement's earlier tests count. Each returns a third state, `INCONCLUSIVE`, when scope is unset or empty or nothing was assessed; the guard treats it as not passing.

---

## 10. Backward compatibility

`state.traceability.deltas[]` is retained. Sub-agents may return `traceabilityDeltas` (old format) during the transition period; `processReturn` records them in the legacy array. `checkTraceability` uses the edge store when populated, falls back to deltas. Once all sub-agents emit `traceabilityEdges`, deltas may be deprecated.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial standard — chain, delta schema, coverage; documents PROP-034 Track A behaviour. |
| 3.0 | 2026-09-11 | PROP-058: code/test edges are scanned from source comments (`source: scan`), never declared; `documents` edges may not self-cite; matrix computed only (`state.traceability.matrix` dropped on load — it never had a writer); scope from increment record; `INCONCLUSIVE` state; regression rule at P5; `testCoverage` union; `scope`/`scan`/`verify` commands. |
| 2.0 | 2026-06-19 | PROP-042: bipartite edge store, artifact identity (component:logicalName), typed edges, three-level coverage (linked/implemented/verified), staleness via `stale` flag, byReq/byArtifact indexes. PROP-041: link-level matrix (buildMatrix/checkMatrix), sponsor-OQ gating (checkSponsorOq, state.oq), `trace` CLI command. Backward compat with delta format retained. |
| 2.1 | 2026-06-20 | Wired change-handling enforcement: `applyChange` (CR entry — stales changed-requirement edges + computes impact, AC5), `resolveDeferral` (sponsor answer → stale affectedReqs for scoped re-gen, B4/A5), and deferral-authorization enforcement in `checkSponsorOq` (`sponsorAuthorized` required; unauthorized deferral blocks the gate, B3). Corrected gate table (P4 has no matrix check; added P3.5). |
