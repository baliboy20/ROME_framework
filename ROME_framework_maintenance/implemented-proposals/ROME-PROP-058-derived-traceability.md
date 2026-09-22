# ROME-PROP-058: Derived Traceability — the matrix is scanned from source, not declared by producers

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-058 |
| **Title** | Derived Traceability — requirement ids annotated in source, matrix built by scanning the tree, stored matrix removed, requirement scope taken from state |
| **Status** | Implemented (v3.5.0 "Aurelius", 2026-09-11) |
| **Author** | Archie (session Rome-archie-master) |
| **Created** | 2026-09-10T00:00:00Z |
| **Origin** | `frob-admin-Bacon`, 2026-09-08 to 2026-09-10. Sponsor test: "take a code file and trace it to a business requirement without reading documentation." `guard-cli trace --req REQ-BO06` answered with a fleet route and a bare directory for a booking-view requirement. Investigation (DISC-007 and the follow-up messages from the project orchestrator) found the stored matrix has had no writer in any version since v2.3.0, that every requirement-scoped fact takes its scope from whoever records it, and that `checkTestAdequacy` passes on an empty list. |
| **Targets** | `rome-core/orchestrator/verification.js` (scanner, rewired checks), `rome-core/orchestrator/state.js` (drop `traceability.matrix`, per-increment scope), `rome-core/orchestrator/guard-cli.cjs` (`trace` and new `scan` command), `rome-core/orchestrator/subagent.js` (accumulated test manifest), `rome-core/orchestrator/routing.js` (CHG-118/119), `rome-core/orchestrator/tests/run.cjs` (omitted suites), `rome-core/orchestrator/rome-start.cjs` and `rome-upgrade.cjs` (`npm install`), `rome-core/docs/standards/traceability-standard.md` (§3, §6, §9), `rome-core/docs/standards/agent-roles-standard.md` (annotation duty), `rome-core/lib/aordl-parser/validate-aordl.js` and `lib/registry/validate-aordl.yaml` (CLI, `id_pattern`, from the clone), ontology (AX-40, AX-41), lexicon, MIG-3.4.0→3.5.0 |
| **Builds On** | ROME-PROP-041 §A1/§A2 (the original design this proposal restores), ROME-PROP-042 (edge store, retained for design links), ROME-PROP-053 (reachability and seam checks, which consume the scanned edges), ROME-STD-TRACE, ROME-STD-AORDL |
| **Supersedes** | ROME-PROP-041 §A2 as implemented (declared edges feeding `buildMatrix`); DISC-007 Part 2 (the three fixes land here) |

---

## In Plain Terms

ROME already keeps one central record of which requirement each artifact serves. It is a graph in `ARTIFACTS/_orchestration/state.json`, and it spans every phase. The record is filled in by the agents that produced the artifacts, each declaring its own links, and the framework stores what it is told.

That is the fault. Nothing checks a declared link against the file it names. On the originating project the record holds a directory where a file should be, a fleet route against a booking requirement, and 82 rows in a table that no version of the framework has ever written. The gate checks that read the record take their list of requirements from whoever runs them, so the same increment can pass or fail depending on the scope the recorder chose, and one check passes automatically when given no requirements at all.

PROP-041 designed something better and it was never built: producers write the requirement id into each source and test file, and the guard scans the tree to build the matrix. This proposal builds it. After it, the code and test half of the matrix is read from the files, cannot drift from them, and cannot be widened or narrowed by the recorder. Design links stay declared, because there is nothing to scan, but a design link must reach a different artifact than the one that declares it. The stored matrix is deleted. Requirement scope for every check comes from the increment record, not from an argument.

---

## 1. Problem

Evidence is from the master at v3.4.0 and from the originating project's state file, read on 2026-09-10.

| # | Fault | Evidence |
|---|---|---|
| P1 | `state.traceability.matrix` is read by `guard-cli trace` in preference to the edges, and no code in any version writes it. | `git log -S'traceability.matrix'` over 311 commits finds two lines: the reader at `guard-cli.cjs:102` and a comment at `verification.js:118` claiming the orchestrator stores it. Both landed in `88cad4c6` (v2.3.0). |
| P2 | Declared edges are stored unverified. | `subagent.js:105-111` requires `req`, `artifactId`, `satisfiesHow` and validates only the verb. `location` is optional and unparsed. `processReturn` performs no filesystem access. Originating project: `SOURCE/apps/webapp-admin/lib/screens` recorded as an `implements` location for `REQ-BO06`. |
| P3 | Requirement scope is chosen by the recorder. | `checkTraceability(state, requirements)`, `checkMatrix(state, requirements)`, `checkStageConsistency(state, requirements)`, `checkTestAdequacy(testManifest, aordl)` all take the list as an argument. Originating project increment 56: gate role chose 105 requirements, recorded FAIL; 16 would have recorded PASS. Neither is detectably wrong from the record. |
| P4 | `checkTestAdequacy` passes on an empty list. | `verification.js:88-105`: `gaps` is empty when `aordl` is empty, so `pass: true`. Originating project: the audit holds a `VERIFY testAdequacy pass:true` at 2026-09-09T08:44Z followed by `pass:false` at 08:49Z; the orchestrator reports the first was recorded with an empty list and then corrected. The current record shows FAIL. |
| P5 | The test manifest is per-increment while the adequacy rule is per-requirement. | `subagent.js:256-263` merges into `inc.testManifest`. An increment claiming a mature requirement must re-report every error path tested in earlier increments. Two increments failed on honest claims; the gate role declined to block either. |
| P6 | `checkTraceability` and `checkMatrix` disagree on `location`. | `checkTraceability` (`verification.js:47`) counts an edge without a location; `buildMatrix` (`verification.js:124`) discards it. An increment can pass `traceability` with its new module unlocated. |
| P7 | A design link can cite its own document. | No rule prevents a `documents` edge whose `location` is inside the artifact that declared it. Originating project `REQ-PROMO01`: seven of eleven links are design-delta section to design-delta section, satisfying `checkMatrix` at P3. |
| P8 | The framework's stated intent and behaviour disagree in five further places found in the same investigation. | CHG-118 (`routing.js:114` turns an omitted `tdrs` key into `[]`, making the guard's own instruction impossible to follow), CHG-119 (`routing.js:114` sets `infraConstraints` to `null` unconditionally, erasing the sponsor's recorded constraints on every intake that omits them), CHG-120 (`clearTdrs` is named in an error message and reachable from no CLI path), `run.cjs` omits `axioms`, `increments` and `intake` suites, and `rome-start.cjs`/`rome-upgrade.cjs` copy `lib/package.json` but never run `npm install`, so every clone lacks `js-yaml` and the AORDL validator cannot load. |

The common shape, stated by the originating orchestrator and confirmed here: the framework describes a mechanism, the mechanism does not exist or does not do what is described, and nothing compares the description with the behaviour.

---

## 2. Design

### 2.1 Annotation — the producer's duty (ROME-STD-AGENT-ROLES)

Every source file and every test file that satisfies a requirement carries the requirement id in a comment. The id must match `id_pattern` from `validate-aordl.yaml`.

The originating project already does this, in 189 source files, without any framework rule asking for it. The form in use is a change or defect id followed by the requirement ids in parentheses:

```dart
/// DEF-008 (CHG-044, REQ-CNA03) — surface the trail on the admin booking
// ---- CHG-060 (REQ-FLEET09/10/11/12) ----
```

No file uses a dedicated keyword. So the scanner matches the bare requirement id wherever it appears in a comment, and that convention becomes the standard. A keyword form such as `Satisfies: REQ-X` is not required, because requiring it would make all 189 existing files unattributed on the day the scanner ships. The hazard of the bare form, that a comment saying "unlike REQ-BO06" attributes the file to REQ-BO06, is accepted and is open question 1.

Rules:

- Any comment containing one or more ids matching `id_pattern` attributes the enclosing file or block to those ids. Abbreviated runs such as `REQ-FLEET09/10/11/12` expand to four ids.
- A file-level annotation attributes the whole file. A function-level annotation attributes from that line to the next annotation or end of file. The scanner records the annotation line as the `location`.
- A test file annotation means `validates`. Any other file means `implements`. The distinction between `implements` and `enforces` is not recoverable from a scan and is not needed: `CODE_SATISFIES` already treats them as one class.
- A test file is one whose path matches the project's test convention, declared once in state (`traceability.testPaths`, default `["test/", "tests/", "__tests__/", "*_test.*", "*.test.*", "*.spec.*"]`) and set at intake.

Producers no longer emit `traceabilityEdges` with `satisfiesHow` of `implements`, `enforces` or `validates`. If they do, `validateReturn` rejects the return with a message naming the annotation duty. This is deliberate: two sources for the same fact is the fault being removed.

### 2.2 The scanner — `scanTraceability(projectDir, state)`

New in `verification.js`. Pure with respect to state; reads the filesystem.

- Walks `SOURCE/` (the root is `state.sourceRoot`, default `SOURCE`), skipping `node_modules`, `.git`, `build`, `.dart_tool` and any directory listed in `state.traceability.scanIgnore`.
- For each file, finds every requirement id matching `id_pattern` inside a comment and yields one edge per id: `{ req, artifactId, satisfiesHow, location, source: 'scan' }`, where `artifactId` is the canonical id of the file's component and relative path, and `location` is `path:line`.
- Yields a second list, `unattributed`, of source and test files that carry no annotation, so that a file with no requirement is visible rather than silent. This is the reachability input PROP-053 §2.4 asked for and never had.
- Yields a third list, `unknownIds`, of annotated ids that match no requirement in `ARTIFACTS/_requirements/`. An unknown id is a FAIL at P5.

Exposed as `guard-cli.cjs scan <state.json> [--json]` so a person can run it and see the same result the gate sees.

### 2.3 The matrix — computed, never stored

- `buildMatrix(state, requirements, scanned)` takes the scan result. The `design` bucket comes from declared `documents` edges as today. The `code` and `tests` buckets come only from scanned edges.
- `state.traceability.matrix` is removed from `createState`, from `migrateV1`, and from MIG-3.4.0→3.5.0, which deletes the key from existing state files and records `MATRIX_FIELD_DROPPED` in the audit with the row count removed.
- `guard-cli trace` calls the scanner and `buildMatrix`. The "no location links yet" branch is deleted. The output names its source: `code (scanned)`, `design (declared)`.
- The comment at `verification.js:118` is corrected.

### 2.4 Scope from state, not from the recorder

- Each increment carries `inc.scope.requirements`, the list of requirement ids in scope, set when the increment opens from the intake record or the change request, and immutable after the increment is sealed.
- `checkTraceability`, `checkMatrix`, `checkStageConsistency` and `checkTestAdequacy` read scope from `active(state).scope.requirements`. The `requirements` argument is removed. The `recordVerification` path that accepts a caller-supplied result for these four keys is closed: the guard records what the check returns and nothing else.
- Full-corpus checks, where the gate role wants to see all 105, are a separate CLI report, not a fact.
- Regression (sponsor decision 3): `checkMatrix` at P5 also fails if any requirement whose status was `linked` at the previous sealed increment is no longer `linked` in the current scan. The previous statuses are read from the sealed increment's recorded `matrix` fact detail, not from a stored table.

### 2.5 `checkTestAdequacy` — three states, accumulated coverage

- Returns `{ pass, state: 'PASS' | 'FAIL' | 'INCONCLUSIVE', gaps }`. `INCONCLUSIVE` is returned when the in-scope list is empty or no manifest entry exists for any in-scope requirement. The guard treats `INCONCLUSIVE` as not passing. This is Roma's fix 2: an absent assessment must not read as a clean one.
- Coverage is read from `state.traceability.testCoverage`, a project-level map `{ REQ-ID: { outcomesTested, errorsTested: [] } }` that `processReturn` merges each increment's manifest into, union on `errorsTested`. An increment claiming a mature requirement inherits the coverage earlier increments established and must add only what its own scope demands. This is Roma's fix 3.
- `checkTraceability` requires `location` on scanned edges, which it now always has. Fix 1 is a consequence of §2.2 rather than a separate change.

### 2.6 Design links — declared, but never self-citing

- `documents` edges remain declared, with `location` mandatory and of the form `path#anchor`.
- New rule in `validateReturn`: a `documents` edge whose `location` path equals the path of any artifact in the same return is rejected as self-citation. A design delta may not satisfy a requirement by pointing at itself.
- `checkMatrix` at P3 stays WARN-only but its warning now also names requirements whose only design link is to a file produced in the current increment, so the sponsor can see when design coverage is circular.

### 2.7 A derived-value check — the general fix

New axiom **AX-40**: every derived value the framework stores must have a named recomputation, and `guard-cli axioms` recomputes each and fails on difference. Initial coverage: `byReq`, `byArtifact` against `edges`; `testCoverage` against the union of increment manifests; every `verification[phase][key].pass` against a fresh run of its check. This is the check that would have found P1 the day it happened.

New axiom **AX-41**: a mechanical fact key listed in `lifecycle.js#requires` must have a checker function and a guard path that calls it. A test enumerates the keys and fails on any without both. Today that test would fail on `aordl`, `secrets`, `integration`, `contracts` and `executability`. The proposal does not build those five checkers; it makes their absence a failing test instead of a silent one, and each becomes its own proposal.

### 2.8 The line-level faults from the same investigation

Landed in the same release because each is a one-line disagreement between stated and actual behaviour, verified in the master:

| Ref | Change |
|---|---|
| CHG-118 | `routeFromICR` puts a `tdrs` key on its result only when the record had one. Adopted as written on the originating project, with its three tests. |
| CHG-119 | Same treatment for `infraConstraints`. Replacing recorded constraints requires `replaceInfraConstraints: true` on the record, mirroring `clearTdrs`, and audits the previous value. |
| CHG-120 | `guard-cli intake` gains `--clear-tdrs` and `--replace-infra`, so the escapes the error messages name exist. |
| Runner | `run.cjs` lists every `*.test.cjs` in its directory. The three omitted suites run. |
| Install | `rome-start.cjs` and `rome-upgrade.cjs` run `npm install --omit=dev` in `lib/` after copying. `lib/node_modules` is removed from git (done 2026-09-09, uncommitted). |
| Validator | The clone's `validate-aordl.js` CLI, `id_pattern` manifest key, and `aordl-standard.md` 1.1 are adopted. Subject-prefixed ids are accepted framework-wide. |

CHG-121, the conditional gate verdict, is out of scope. It is a change to what gate authority can express and deserves its own proposal.

---

## 3. Interaction with the proposal set

- **PROP-041 §A1/§A2** are implemented as originally written. §A2's "guard greps annotations" is §2.2.
- **PROP-042** stands. The edge store, artifact identity and indexes are unchanged. Scanned edges are stored in it with `source: 'scan'` and are rebuilt on every scan, never merged.
- **PROP-053 §2.4 reachability** gets its input from `unattributed` in §2.2.
- **PROP-056 AX-36** is the model for CHG-119's guard.
- **DISC-007** Part 1 lands via §2.8; Part 2 lands via §2.4 and §2.5. The four questions are answered: yes, by the master; after proof, which §6 requires; yes, framework-wide; yes, five keys, made visible by AX-41.

---

## 4. Out of Scope

- Building the five missing checkers (`aordl` as a fact, `secrets`, `integration`, `contracts`, `executability`). AX-41 makes each a failing test; each gets a proposal.
- CHG-121, conditional verdicts.
- Artifact-to-artifact links (design section to source file). The graph stays bipartite. The scanner makes this cheap to add later, since a source file's annotation could name a design anchor as well as a requirement, but no gate needs it yet.
- Language-aware parsing. The scanner matches comment text, not syntax trees.

---

## 5. Sponsor Decisions (2026-09-10)

All three questions were put to the sponsor and decided as recommended.

| # | Question | Decision |
|---|---|---|
| 1 | Annotation form | The scanner matches the bare requirement id anywhere in a comment. No keyword is required. A `Not:` marker excluding a comment from attribution is not built in 3.5.0; revisit if false attribution is observed. |
| 2 | Unattributed source files at P5 | WARN in 3.5.0. FAIL from the next MINOR release. |
| 3 | Whole-corpus regression | GATE-P5 fails if any requirement linked at the previous seal is unlinked by the current scan, regardless of increment scope. Added as §2.4 last bullet. |

---

## 6. Acceptance Criteria

1. No reader or writer of `traceability.matrix` remains in `rome-core/orchestrator`; the only mention is the load-time removal in `state.js`. `createState` has no `matrix` key. MIG-3.4.0→3.5.0 removes it from an existing state file and audits the removal.
2. `guard-cli scan` on a fixture tree with three annotated source files, two annotated test files, one unannotated file and one unknown id returns exactly those edges, that one unattributed path, and that one unknown id.
3. `guard-cli trace --req X` on the fixture reports code and tests from the scan and design from declared edges, labelled by source.
4. `checkTestAdequacy` with an empty in-scope list returns `INCONCLUSIVE`, and `canAdvance` refuses.
5. A second increment claiming a requirement whose error paths were covered in a first increment passes `testAdequacy` without re-reporting them.
6. A return containing a `documents` edge citing its own artifact is rejected by `validateReturn`.
7. A return containing an `implements`, `enforces` or `validates` edge is rejected by `validateReturn`.
8. `guard-cli axioms` fails when `byReq` is edited by hand to disagree with `edges`, and when a recorded `verification` fact disagrees with a fresh run.
9. The AX-41 test fails on the current master, naming the five keys, and the failure is recorded as expected in the release notes.
10. `run.cjs` executes nineteen suites. `rome-start` on a clean machine produces a clone in which `node lib/aordl-parser/validate-aordl.js --help` runs.
11. **Proof on the originating project.** The scanner is run against `frob-admin-Bacon` and a report lists every requirement whose matrix status differs between the 775 declared edges and the scan, with the reason. The sponsor reads that report before release. This is the "after proof" answer to DISC-007 question 2.
12. The framework's own suites pass, apart from the one pre-existing failure in `impact-experts.test.cjs`, which is recorded as a known defect.

---

## Revision Log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-11 | Implemented in v3.5.0. Delivered as specified except: `checkStageConsistency` keeps its object-list argument (requirement stages are not in state) and returns INCONCLUSIVE without one; §2.1 annotation form is the bare id (sponsor decision 1); a `Not:` marker is not built. AC1 reworded to admit the load-time removal. Proof on the originating project: ROME-REVIEW-PROP-058. |
| 0.2 | 2026-09-10 | Sponsor decided §5 questions 1–3 as recommended; §2.4 regression rule added; status Approved for build. |
| 0.1 | 2026-09-10 | Draft for sponsor decision. Consolidates DISC-007, CHG-118 to CHG-120, CHG-123, and the traceability investigation of 2026-09-10. |
