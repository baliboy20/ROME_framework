# ROME Framework Changelog

All notable changes to the ROME Framework will be documented in this file.

## [2026-07-17] - v3.0.0 "Antoninus" — first-class increments + input staging (MAJOR)

Codename **Antoninus** — the builder of the long peace. Implements PROP-048 and
PROP-049 together: a project can now GROW (increments) and the sponsor decides the
build-out's shape through the inputs (staging, core subsystems, declared stubs).
Closes fob-admin D15 and the program-planning gap from the sponsor design session.

### BREAKING — state schema v1 → v2 (ROME-MIG-002, auto-migrating)
Lifecycle fields (`routing`, `currentPhase`, `phases`, `gateLedger`, `blockers`,
`dispatch`, `budget`, `verification`, `oq`, `testManifest`, `inputReliability`)
now live per-increment under `state.increments[]`; `activeIncrement` selects the
live one. Shared at project level: `traceability` (edges tagged by increment),
`audit`, plus new `stubs[]` and `stagePlan`. **`load()` migrates v1 states
automatically and losslessly** (wrapped as increment 0 — nothing deleted, per
AX-19); no user action. Tool authors: read lifecycle via `state.js#active(state)`.
Existing projects keep running on their vendored ≤ v2.8 framework regardless.

### Added — increments (PROP-048)
- `state.js`: `active()`, `sealActive()`, `beginIncrement()`, `migrateV1()`.
  Sealed increments are immutable — the guard refuses verdicts and advances on
  them (**AX-19**, append-only preservation).
- One shared traceability store; coverage is the union across increments
  (**AX-20** — edges tagged by producing increment).
- `isComplete` is per-increment; the project has no terminal state (**AX-21**).
- **`rome-increment.cjs`** — grow an existing project: seals the completed
  increment, begins the next (Surveyor intake by default, PROP-047), never
  overwrites. Refuses to grow past an incomplete increment.

### Added — staging & build-out decisions (PROP-049)
- Staging convention: `raw-requirements/stage-N/` (stage 0 = foundation, stage 1
  = the product MVP *by curation*); each stage binds to one increment.
- `routing.js#validateStagePlan`: **AX-23** — no stage presumes a core subsystem
  no same-or-earlier stage provides or stubs (sponsor-authorizable); forward
  stage dependencies WARN at intake.
- `verification.js#checkStageConsistency`: **AX-22** STRICT at P2 — new required
  P2 fact `stageConsistency` (unstaged projects pass trivially).
- Stub ledger `state.stubs[]` + `checkStubs`; the guard blocks the P5 delivery
  edge on any ACTIVE stub past its `implementBy` increment (**AX-24**, no silent
  stubs — the rule that would have caught fob-admin's shipped fake token).

### Framework alignment
- Ontology v1.3 (ENT-15..19, REL-14..21, AX-19..24) and lexicon v1.3 (Increment,
  Project, Stage, Core Subsystem, Stub, Build-Out Decision). ROME-STD-GATE v1.2.
  Check 6b now demands tagged violation tests for 15 ENFORCED axioms.
- ROME-MIG-002 migration guide (plain-terms + tool-author notes).

### Verify
- 313 tests pass (+29 increment/staging, incl. per-axiom tags and a v1→v2
  migration round-trip). E2E: rome-start → complete → rome-increment verified
  live (refusal on incomplete project; seal preserves all 5 gate records).

## [2026-07-16] - v2.8.0 "Hadrian" — input characterization & reliability gating (D3/D4/D16)

Codename **Hadrian**. Implements PROP-047 — the input-side blind spot, the
fob-admin run's largest source of rework. The fix is mostly *wiring up the
Surveyor role that already existed but was bypassed*, plus one real extension.

### Fixed
- **D3 — `rome-start` fabricated Surveyor's verdict.** It hardcoded
  `qualityVerdict: 'SUFFICIENT'` and routed on it, certifying an empty folder
  before any input was staged — making `routeFromICR`'s `INSUFFICIENT` refusal dead
  code. Now `rome-start` emits **no** verdict: it scaffolds, routes *provisionally
  through intake* (`routeInitial`), and stops. Surveyor's P0.5 pass produces the real
  ICR from staged inputs; `routeFromICR` enforces **AX-17** (route only on a present
  `SUFFICIENT` verdict over a non-empty input set). The dead guard is now live.
- **D4 — greenfield could never invoke Surveyor.** Intake ran only for brownfield.
  `rome-start` now routes greenfield through intake by default and exposes
  `--force-intake` / `--no-intake`; `intake.js#classifyInputs` flags heterogeneous
  input sets (mixed formats, binaries, many files) as the ones most needing it.
- **D16 — the sponsor's reliability markers were ignored.** New
  `intake.js#parseReliability` reads `**Status:** Reliable/PROPOSED/RECONSTRUCTED/
  UNDEFINED` markers; **AX-18** blocks routing a shaky input into requirements unless
  the sponsor sets `sponsorAuthorized: true`. Surface, don't silently build on sand.

### Framework alignment (companion changes)
- **Lexicon v1.2 + Ontology v1.2**: defined the previously-missing terms (Input,
  Surveyor, ICR, Quality Verdict, Input Reliability); added ENT-13 (Input), ENT-14
  (ICR), REL-11/12/13, and **AX-17/AX-18** — both ENFORCED via `routing.js#routeFromICR`,
  both with tagged violation tests. Fidelity check 6b extended to cover routing-time
  ENFORCED axioms (now 10). `state.inputReliability[]` added (additive; no schema break).

### Honest limits
- Surveyor *running* and *reading files* is orchestrator-driven (like the integration
  fact) — the framework enforces the gate; the agent does the reading. `--no-intake`
  is an explicit, audited escape for confidently-clean inputs.

### Verify
- Tests: 284 pass (was 267; +17). All six fidelity checks green (6a: 12 citations, 6b: 10 axioms).

## [2026-07-16] - v2.7.0 "Trajan" — verdict binding (D1) + integration fact (D2/D8b)

Codename **Trajan**. Implements PROP-045 and PROP-046 — the two architectural
fob-admin defects where the framework asserted something was fine when it wasn't.

### Fixed
- **D1 — gate verdicts were forgeable (PROP-045).** `recordGateVerdict` trusted a
  caller-supplied `role` string, so one line forged any gate without a Sarah
  sub-agent ever running — collapsing PROP-035's core "holds even if the
  orchestrator errs" claim. Verdicts now bind to a **completed gate-role dispatch**
  cited by `dispatchId`; the role is **derived from the dispatch record**, not
  trusted. A forged verdict must now forge a whole dispatch, not a string. Legacy
  unbound `role` verdicts are accepted for one release with a `VERDICT_LEGACY_UNBOUND`
  audit flag. AX-03 restated to match what it now guarantees. `guard-cli verdict`
  gains `--dispatch`.
- **D2/D8b — the framework certified browser-broken products VERIFIED (PROP-046).**
  P5 checked six component-level facts; nothing ran the integrated system, and the
  contracts gate compared route strings, not payloads (a producer/consumer agreed on
  all 25 URLs and disagreed on nearly every field — every booking rendered blank).
  - **`integration`** is now a STRICT P5 fact: start the real system, drive one
    requirement across the seam, assert the response against the contract shape.
    Un-runnable stacks record it `WAIVED (sponsor-authorized)` with an audit entry —
    never a silent skip.
  - **`contracts.js` fails closed (D8):** a consumer evaluated to zero usage is
    flagged `consumer-no-usage` instead of passing vacuously (the broken-extractor
    signature). `kind:'api'` contract members MUST be field-level (`Booking.partySize`);
    `detectDrift` already compares arbitrary member strings, so no comparison-code
    change is needed — only that extraction emit fields.
  - `executability`'s component-only scope is documented (not renamed) in ROME-STD-GATE.

### Honest limits
- PROP-045 raises forgery cost from one line to a fabricated dispatch+return; a fully
  dishonest orchestrator still needs an out-of-process transcript check (scoped as a
  non-goal, pairs with D18). AX-03 says so.
- PROP-046 Part B is doc-level: the framework now *requires* field-level members and
  fails closed on empty extraction, but emitting field members is the generator's job.

### Verify
- Tests: 267 pass (was 256; +11). All six fidelity checks green.

## [2026-07-16] - v2.6.0 "Nerva" — fob-admin defect fixes (cheap tier: D6, D7, D17)

Codename **Nerva** — restorer of stability. Fixes three silent-corruption defects
found in the fob-admin Module-1 live run (`FRAMEWORK-DEFECTS-2026-07-15.md`),
verified still live against v2.5.0 before fixing. All three failed *silently* —
green checks over broken state.

### Fixed
- **D17 — traceability and matrix disagreed on what counts as "code".**
  `checkTraceability` counted only `implements`; `buildMatrix` counted
  `implements`+`enforces`. A control-type requirement satisfied via `enforces`
  (e.g. "the API MUST reject non-owners") passed `matrix` STRICT and failed
  `traceability` requireTest on identical edges — the phase both satisfied and
  failed its own P5 preconditions. Extracted the verb set to a single
  `lifecycle.js#CODE_SATISFIES` constant now read by both checks **and** by
  `axioms.js#checkP5NoNewRequirements` (AX-15) — which had the same bug,
  introduced in v2.5.0. They can no longer drift.
- **D6 — a valid return could not close its own dispatch.** `processReturn`
  matches the RUNNING dispatch by `ret.agent`, but `validateReturn` never
  required `agent`, so a schema-valid return left its dispatch RUNNING forever
  (8 phantom dispatches on the live run). `agent` is now required and named in
  the return contract; an unmatched return emits a `RETURN_UNMATCHED` audit event
  instead of silently no-op'ing.
- **D7 — `testManifest` was invented, unvalidated, unmerged, misnamed.**
  `processReturn` never merged it (so `checkTestAdequacy` saw nothing and reported
  "no tests" for every requirement) and its key disagreed with `traceabilityEdges`.
  Now a first-class part of the return: validated by `validateReturn`, merged into
  `state.testManifest`, keyed by `req` (canonical, matching edges; `requirement`
  accepted as a legacy alias).

### Added
- `state.testManifest[]` (additive; old states default to `[]` — no schema break).
- 11 regression tests (verification + subagent suites) pinning D6/D7/D17.

### Not addressed (still open, need proposals + design input)
Per the sponsor's "cheap tier only" scope. The architectural defects remain:
D1 (gate verdicts are forgeable — not bound to a real Sarah dispatch; note this
bounds what v2.5.0's AX-03 actually guarantees), D2/D8b (no integration or
payload-schema check — the framework certifies browser-broken products VERIFIED),
D3/D4/D16 (input reliability never assessed), D5 (Clara role contradiction),
D15 (no first-class increments), and the D8/D9/D11/D12/D18 foot-guns. The report's
thesis stands: ROME checks internal consistency, not correspondence to reality.

### Verify
- Tests: 256 pass (was 245; +11). All six fidelity checks green.

## [2026-07-16] - v2.5.0 "Titus" — axiom enforcement (ONT-001 ASSERTED tier → CHECKED)

Codename **Titus** — Vespasian's successor. Implements PROP-044: empties the
ontology's ASSERTED tier and makes the ENFORCED tier self-auditing.

### Added
- **`axioms.js`** — five CHECKED axiom functions promoting ROME-AX-12..16 out of
  ASSERTED (pure functions over state, `guard.js` style):
  - AX-12 one Role per Instance (`dispatch[]`),
  - AX-13 role-level separation of duties — a producing Role does not also hold
    gate authority in the same phase (sponsor OQ-2: role-level, not instance),
  - AX-14 orchestrator-only spawn (`dispatch[].spawnedBy`),
  - AX-15 P5 introduces no requirement absent upstream (traceability edges),
  - AX-16 no silent recovery — no phase completes over a non-terminal blocker
    (sponsor OQ-1: CHECKED, not ENFORCED).
- **`tests/axioms.test.cjs`** (22 tests) — Part A maps one violation test to each
  ENFORCED axiom (AX-01..08), tagged by ID; Part B covers AX-12..16.
- **`guard-cli.cjs axioms <state.json>`** — reports CHECKED-axiom violations
  without blocking (they are detect-after-the-fact, not gate preconditions).
- **Fidelity check 6b** — asserts every ENFORCED axiom keeps a tagged violation
  test. With 6a (citation existence) this closes the "function exists but no
  longer enforces" gap PROP-043 had left open (its OQ-2 tail). Verified: 6b fails
  when a tag is removed.

### Changed
- **`recordDispatch`** gains an additive `spawnedBy` field (defaults to the
  orchestrator role) — the only new state AX-14 needs. No schema break.
- **ROME-ONT-001 → v1.1**: AX-12..16 moved to the CHECKED tier with per-axiom
  scope limits stated inline; ASSERTED tier now empty; AX-11 deepened to cover 6b.
- **activity-log-format.md**: `role` documented as canonical; `robot` retained as
  a **backward-compatible legacy alias** (sponsor OQ-3: alias, not hard rename).
  Existing `robot:` entries and the 103 agent-mode examples remain valid as
  aliases and may migrate to `role:` opportunistically — no mass rename, no break.

### Notes
- All three PROP-044 parts are additive → single MINOR release, no v3.0.0 split.
- Tests: 245 pass (was 223; +22). Fidelity: all six checks green.

## [2026-07-16] - v2.4.1 "Vespasian" — terminology drift cleanup

PATCH. Documentation corrections + fidelity-script fix; no functional change.

### Fixed
- **Deprecated `Layer` terminology drift** (fidelity check 3, long-standing WARN).
  The term was retired in favour of `Capability`, but survived in four places:
  `activity-log-format.md` (`layer`/`layer:database` field → `capability`),
  `document-taxonomy.md` (a fixed Layer/Robot→Database/Backend/Frontend table →
  illustrative Capability/Role rows), `terminology-management.md` (listed `Layer`
  as current → marked deprecated), and three P4/P5 agent-mode log examples
  (`layer:frontend`/`layer:backend` → `capability:ui-app`/`capability:api`) that
  would otherwise propagate the dead syntax into real project logs at runtime.
- **Fidelity check 3 sharpened.** It matched the bare word `Layer`, firing on
  ordinary architectural English ("system layers") and on the deprecation notes
  themselves. Now matches only the deprecated value syntax `layer:database|backend|frontend`.
  Verified it still catches a reintroduced `layer:` and no longer false-positives.
  Full fidelity run is now green on all six checks.

### Known drift (flagged, not fixed — needs a proposal)
- The activity-log format defines a **`robot` field** (`robot:ashok`), used 58×
  in the spec and 103× across agent modes. This is internally consistent but
  inconsistent with the lexicon's retirement of "Robot" → Role/Instance. Renaming
  it (`robot:` → `role:`) is a functional format migration touching what agents
  emit and what parsers read — out of scope for a patch. Candidate for a future
  proposal alongside the PROP-044 enforcement work.

## [2026-07-15] - v2.4.0 "Vespasian" — ontology, axiom set, and verified provenance

Codename **Vespasian** — restorer of order after a chaotic interval. Nero skipped, as
Caligula was before him. This release makes the framework's invariants explicit and,
for the first time, mechanically checkable.

### Added
- **Ontology & Axiom Set (ROME-ONT-001, PROP-043)**: new foundation document defining
  the entity set (12), the relation set with cardinalities (10), and a numbered axiom
  set (16). Each axiom carries enforcement provenance — `ENFORCED` (deterministic code
  refuses the violation), `CHECKED` (a script detects it after the fact), or `ASSERTED`
  (intent only, explicitly *not* a guarantee). Standards, gates, and reviews can now
  cite `ROME-AX-###` instead of restating prose. The `ASSERTED` rows are the enforcement
  backlog.
- **Fidelity check 6 — axiom provenance (ROME-AX-11)**: every `<module>.js#<function>`
  cited by an axiom must exist; the check fails on renames and deletions. Verified
  against a deliberate rename. This is the answer to PROP-043 OQ2, taken now rather
  than deferred: an unverified `ENFORCED` claim reads as a guarantee while decaying
  silently.

### Changed
- **ROME-LEX-001 → v1.1** (companion fix, PROP-043 §P3). The phase table claimed P0–P5
  with a gate at every boundary; the implemented model is P0 (ungated) → P0.5 → P1 → P2
  → P3 → P3.5 → P4 → P5, rebuilt from `lifecycle.js` with gate and optional columns.
  "Robot" re-labeled a retired legacy alias → Role/Instance per ROME-STD-AGENT-ROLES;
  Role and Instance added. Logging Trigger repointed from the retired ROME-PROC-005 to
  ROME-GOV-008. Revision log added — the document had none since initial issue,
  contrary to ROME-GOV-001. Term definitions otherwise unchanged.
- **UID registry → v4.2**: added the ONT type code, registered ROME-ONT-001, and noted
  ROME-ENT/REL/AX as sub-document patterns that take no UID of their own.

### Fixed
- **ROME-STD-GATE → v1.1**: the §3 `requires` table had drifted from `lifecycle.js`.
  P2 requires `sponsorOq`, P3/P3.5 require `matrix`, and P5 requires `matrix` as a
  sixth fact — all landed with PROP-041/042 in v2.3.0 without the standard following.
  `matrix` and `sponsorOq` were named by the table but never defined; now defined.
  §3 rule 8 had been added in v2.1.0 with no revision entry; logged retrospectively.
  `lifecycle.js` (`PHASES[].requires`) named authoritative to stop the table drifting
  again. Found by verifying PROP-043's axiom provenance against the code, and fixed
  first — an ontology built on a drifted standard institutionalizes the drift.

### Note on PROP-043 as drafted
Implementation verified all eight `ENFORCED` claims against the code. Three did not
survive contact and were corrected before issue: AX-06 asserted "phases cannot be
skipped", which ROME does not guarantee (`resolveRouting` rejects reordering but
permits omitting optional phases by design — intent routing, PROP-036); the
`guard.js r1..r8` citations referenced markers that do not exist, against a numbering
that conflicts with the standard's; and AX-08's fact table inherited the STD-GATE
staleness above. See the proposal's revision log for detail.

## [2026-07-15] - v2.3.0 "Claudius" — link-level + artifact-graph traceability

Codename **Claudius** — the emperor known for compiling the records; a traceability release.

### Added
- **Artifact-graph traceability (PROP-042)**: requirements and artifacts are now both
  first-class nodes in a bipartite graph with typed, directed edges. Sub-agents return
  `traceabilityEdges[]`; `processReturn` upserts them on natural key
  `(req, artifactId, satisfiesHow)` — latest assertion wins, no duplicate accumulation.
  Canonical artifact id is `component:artifactId`, so two components may define
  identically named artifacts without collision. A `byArtifact` reverse index (rebuilt
  by `rebuildIndexes()`) backs `computeImpact()` and `guard-cli.cjs trace`. Three-level
  coverage: declared / linked (P3 WARN) / implemented (P5 entry). Renames update `path`
  metadata only and leave the canonical id and its edges intact.
- **Link-level traceability matrix (PROP-041 Part A)**: `buildMatrix()` projects located
  edges into per-requirement design/code/tests buckets. Granularity is section anchors
  at P3 (stable across prose edits), line-level at P5. Enforcement is phased —
  WARN-only at P3, STRICT at P5.
- **Sponsor-OQ gating (PROP-041 Part B)**: `state.oq` tracks open questions from Talib's
  P2 return. No new gate verdict — a gate APPROVEs with `provisional: true` plus a
  `deferrals[]` ledger, and a deferral is valid ONLY with explicit `sponsorAuthorized: true`.
  `resolveDeferral()` clears the provisional flag once answered.

### Changed
- `traceability-standard.md` rewritten around the edge store, coverage levels, and matrix.
- Agent modes updated to emit edges: talib P2, clara/pma P3, ashok/charlie/reena P5,
  sarah QA-validator.
- `state.traceability.deltas[]` retained as a legacy flat list for backward compat
  during the PROP-042 transition.

### Docs
- Added GETTING-STARTED.md — newbie walkthrough (PRD → app).

## [2026-06-19] - v2.2.0 "Tiberius" — vendoring + skill/expert dedup

### Added
- **Per-project framework vendoring**: rome-start copies a frozen framework snapshot
  into <projectDir>/.rome/ by default (--no-vendor to skip) and records provenance
  {version, commit, vendored} in state.json. Each project is self-contained and
  reproducible as the framework evolves.

### Changed
- **Skill/Expert dedup**: removed 9 Flutter knowledge-as-skills from charlie (covered
  by Experts/expert_flutter, injected via experts.js); kept the action skills
  generate-ui-screens/components + an expertPacks reference. agent-roles-standard §3b
  documents the rule: knowledge → expert pack, never a skill.
- Fixed a pre-existing JSON error in charlie plugin.json; dropped retired iterm2-terminal.

## [2026-06-19] - v2.1.0 "Augustus" — Enforcement hardening + tree cleanup

Codename **Augustus** (the founder) — the foundational sub-agent architecture line.

### Fixed
- **Guard now requires mechanical evidence, not just a verdict** (PROP-035 §3.5
  hardening). Each phase declares `requires`; the guard refuses to advance unless
  every required fact (executability, contracts, secrets, traceability, MVP
  test-adequacy, AORDL) is recorded AND passing in `state.verification`. An LLM
  gate role can no longer APPROVE without the checks having run. New `verification.js`
  + `driver` VERIFY step. Traceability is always-enforced (iterative safety);
  test-adequacy follows the MVP rule (only declared Outcomes/Errors must be tested).

### Added
- Per-role **recommended-model** guidance in `agent-roles-standard.md` (Opus on
  Roma/Sarah/PMA; Sonnet producers; Haiku intake/scaffold).

### Removed (cleanup)
- `ROME_tools/` (gutted in cutover), `PLUGINS/` (Flutter skills now in `Experts/`),
  `GENERATION-PLUGINS-MANIFEST.md` + `PLUGIN-MANIFEST.md` (retired phase-plugin model),
  and the M2/M3/037 proof scratch dirs (results preserved in
  `ROME_framework_maintenance/reviews/`). Top-level tree is now: ROME, Experts,
  ROME_framework_maintenance, ROME_architect, testapps, test-project + current docs.

### Tests
- 154 orchestrator + 45 lib, all green.

## [2026-06-19] - v2.0.0 — Single-Session Sub-Agent Orchestration (ROME-PROP-035..040)

Major re-architecture: from human-switched multi-session "robots" to a single
**orchestrator session that drives native sub-agents**, with deterministic
enforcement. **BREAKING.**

### Added
- **Orchestrator core** (`rome-core/orchestrator/`): `state.js` (state.json = source of truth), `guard.js`/`guard-cli.cjs` (deterministic phase-advance enforcement — self-approval structurally impossible), `subagent.js` (role→sub-agent loader + structured-return contract), `lifecycle.js`, `driver.js`, `rome-start.cjs` (project entry point).
- `topology.js` (PROP-038 DAG fan-out), `executability.js` (PROP-039 build/verify/self-heal), `contracts.js` (PROP-039 drift), `routing.js` (PROP-036 intent routing), `budget.js`/`impact.js`/`experts.js`/`security.js` (PROP-040), `visualize.js` (PROP-037 Mermaid).
- Framework **standards** (`rome-core/docs/standards/`): aordl, agent-roles, traceability, gate-decision, security. Repaired the AORDL validator (was non-runnable).
- New **Surveyor** role (PROP-036 intake) and **Charlie P3.5** prototype mode (PROP-037).
- ~190 automated tests; live end-to-end proofs (M2 design triad, M3 parallel build, 036 intake, 037 prototype).

### Changed
- `robot-plugins/` → **`agents/`**. Roma rewritten (v5.0) as the lifecycle driver. Activity-log demoted to audit-only.

### Removed
- All emulation machinery: `rome-p5-generation/`, the 6 phase-plugin shells (`rome-p0..p4`, `rome-qa`), the custom skill runtime (`SkillInvoker`/`SkillRegistry`), `p5-hybrid` orchestrator, `ActivityLogCoordinator`, per-robot `add-mcps-v4.sh`, log-enforcement hooks, stale `*-plugins-complete.json` manifests (~5,600 lines).

### Decisions
- D1 native skills · D2 state.json source of truth · D3 consolidated MCP set · D4 PROP-034 first · Path-A operation (live session, no SDK runner).

## [2026-01-28] - Robot Plugins Architecture (ROME-PROP-019)

### Implemented
- **Robot Plugins Directory Structure**
  - Created `/ROME/robot-plugins/` with 10 robot subdirectories
  - Each robot contains: `ROBOT.md` (identity), `.claude-plugin/plugin.json` (metadata), `modes/` (phase-specific behavior)
  - Robots: bootstrap, talib, roma, pma, clara, lucien, ashok, reena, charlie, sarah

- **Robot Identity Separation**
  - **bootstrap**: P0 bootup robot with `modes/P0-bootup.md`
  - **talib**: Multi-phase robot (P1-aordl, P2-analysis) - single ROBOT.md replaces duplicate agent definitions
  - **roma**: Phase-agnostic orchestrator across all phases
  - **pma**: P3 design architect
  - **clara**: P3 UX designer
  - **lucien**: P4 configuration specialist
  - **ashok**: P5 backend engineer
  - **reena**: P5 frontend engineer
  - **charlie**: P5 integration engineer
  - **sarah**: Phase-agnostic QA validator

- **Phase Plugin Updates**
  - Updated 8 phase `plugin.json` files (rome-p0-bootup through rome-qa, rome-core)
  - Removed `agents` array from `provides` section
  - Added robot dependencies to `dependencies` section
  - Added `requires.robots` array with mode specifications
  - Removed agent exports from `exports` section

- **Documentation Updates**
  - **USER-GUIDE.md**: Updated all robot locations to `robot-plugins/{robot}/ROBOT.md`
  - Added mode information in parentheses for clarity
  - Updated typical session flow examples with new paths
  - Changed terminology from "agent" to "robot" throughout

### Rationale
- **Eliminates Duplication**: Talib previously existed in 2 locations with 2 separate Agent UIDs (`rome-p1-aordl:talib`, `rome-p2-analysis:talib`)
- **Single Source of Truth**: Each robot now defined once with phase-specific modes
- **Clear Separation of Concerns**:
  - Robot plugins define WHO (identity, role, capabilities)
  - Phase plugins define WHAT (skills, commands, phase logic)
  - Mode files define HOW (phase-specific behavior overlays)
- **Scalability**: Adding new phase for existing robot only requires new mode file
- **Framework Intent Alignment**: USER-GUIDE.md documented "Talib (P1 mode)" and "Talib (P2 mode)" - architecture now matches

### Architecture Transformation

**Before (Phase-Embedded Agents):**
```
/ROME/
  rome-p1-aordl/
    agents/talib/AGENT.md         # Agent UID: rome-p1-aordl:talib
  rome-p2-analysis/
    agents/talib/AGENT.md         # Agent UID: rome-p2-analysis:talib (DUPLICATE)
  rome-p3-design/
    agents/pma/AGENT.md
    agents/clara/AGENT.md
```

**After (Robot Plugins):**
```
/ROME/
  robot-plugins/
    talib/
      ROBOT.md                    # Robot UID: talib (SINGLE SOURCE)
      .claude-plugin/plugin.json
      modes/
        P1-aordl.md              # Phase-specific behavior
        P2-analysis.md           # Phase-specific behavior
    pma/
      ROBOT.md
      .claude-plugin/plugin.json
    clara/
      ROBOT.md
      .claude-plugin/plugin.json

  rome-p1-aordl/
    .claude-plugin/plugin.json    # References: robot-plugins/talib (P1 mode)
    skills/                       # Phase owns skills

  rome-p2-analysis/
    .claude-plugin/plugin.json    # References: robot-plugins/talib (P2 mode)
    skills/
```

### Pattern Changes

```json
// OLD: Phase plugin.json (rome-p1-aordl)
{
  "provides": {
    "agents": ["talib"],
    "skills": [...]
  },
  "dependencies": {
    "rome-core": "^1.0.0"
  },
  "exports": {
    "agents/talib/AGENT.md": "Talib agent for AORDL",
    "skills/...": "..."
  }
}

// NEW: Phase plugin.json (rome-p1-aordl)
{
  "provides": {
    "skills": [...]
  },
  "dependencies": {
    "rome-core": "^1.0.0",
    "robot-plugins/talib": "^1.0.0"
  },
  "requires": {
    "robots": [
      {
        "name": "talib",
        "mode": "P1-aordl",
        "source": "robot-plugins/talib"
      }
    ]
  },
  "exports": {
    "skills/...": "..."
  }
}
```

### Impact
- **All Phases**: Robot identity now centralized in robot-plugins directory
- **Talib (P1/P2)**: Single robot definition replaces duplicate agent definitions
- **USER-GUIDE.md**: All paths updated from `agents/{robot}/AGENT.md` to `robot-plugins/{robot}/ROBOT.md`
- **Plugin Dependencies**: Phase plugins explicitly declare robot dependencies with mode specifications
- **Developer Experience**: Clear separation between robot identity (WHO) and phase behavior (HOW)
- **Discoverability**: `ls robot-plugins/` shows all available robots, `ls robot-plugins/talib/modes/` shows robot's phase capabilities

### Implementation Statistics
- **Files Created**: 23 files (10 ROBOT.md, 10 plugin.json, 1 P0-bootup.md mode file, 1 proposal, 1 proposal update)
- **Files Modified**: 9 files (8 phase plugin.json, 1 USER-GUIDE.md)
- **Total Changes**: 68 files changed, +2962 lines, -25835 lines
- **Commits**: 3 commits (implementation, proposal marking, documentation fix)
  - 982b614: feat(architecture): implement robot-plugins architecture (ROME-PROP-019)
  - 7d260c5: docs(proposal): mark ROME-PROP-019 as implemented
  - d0c4e3a: fix(docs): complete USER-GUIDE.md migration to robot-plugins

### Success Criteria Met
✓ Talib exists in ONE location: `robot-plugins/talib/ROBOT.md`
✓ Talib P1 mode activates via rome-p1-aordl plugin reference
✓ Talib P2 mode activates via rome-p2-analysis plugin reference
✓ No duplication of robot identity metadata
✓ Phase plugins declare robot dependencies explicitly
✓ USER-GUIDE.md structure matches actual architecture
✓ All 10 robots migrated to robot-plugins

### Related Documents
- ROME-PROP-019: Robot Plugins Architecture Proposal
- ROME-DEF-001: Framework Analyst & Architect Role Definition
- USER-GUIDE.md: Framework user documentation

### Known Limitations
- Mode files only created for Bootstrap (`modes/P0-bootup.md`)
- Talib P1-aordl.md and P2-analysis.md mode files not yet created (procedural logic remains in phase plugin AGENT.md files)
- Other robots rely on phase plugin AGENT.md files for detailed procedures
- Future work: Extract phase-specific procedures from AGENT.md to mode files

---

## [2025-12-30] - Project-Level MCP Configuration & Activity Log Server Update (ROME-PROP-014)

### Implemented
- **Project-Level MCP Configuration**
  - Created `.mcp.json` template in `robot-templates/` for project-level MCP server configuration
  - Updated `ignite-rome.sh` to initialize `.mcp.json` during bootstrap
  - All robot templates maintain `addmcp.sh` symlink for MCP server setup

- **Activity Log Server Migration**
  - Updated from `activity-log` (MongoDB) to `activity-log-file` (file-based) v2.0.0
  - **ROME-PHASE-001 v1.2**: P00-bootup operations-guidelines.md
    - Updated MCP server reference to `activity-log-file`
    - Changed validation tool from `list_available_databases` to `get_statistics`
    - Updated exit criteria: database → file initialization
    - Updated outputs table: MongoDB reference → file path
    - Added `.mcp.json` initialization to project structure
  - **ROME-PROC-005 v2.0**: Activity Logging Protocol (breaking change)
    - Updated dependencies from database-backed to file-backed system
    - Replaced "Database Discovery" section with "File System Architecture"
    - Documented event log (`ARTIFACTS/activity-log.txt`) and state index (`ARTIFACTS/activity-state.yaml`)
    - Clarified MCP server name as `activity-log-file` throughout

- **Bootstrap Script Enhancement**
  - Added `.mcp.json` template copy step to `ignite-rome.sh`
  - Added MCP configuration note to completion message

### Rationale
- **Standardized MCP Configuration**: Project-level `.mcp.json` eliminates per-robot MCP setup confusion
- **Simplified Bootstrap**: Single initialization point for all MCP servers
- **Updated References**: Removed stale MongoDB references, aligned with current file-based system
- **Breaking Change**: activity-log-file v2.0.0 uses different tools than MongoDB version

### Tool Changes
```javascript
// Validation (operations-guidelines.md)
OLD: mcp__activity-log__list_available_databases
NEW: mcp__activity-log__get_statistics

// Storage Location
OLD: MongoDB database: rome_[project_name]
NEW: File: ARTIFACTS/activity-log.txt
```

### Architecture
**Before:**
- No standardized `.mcp.json` initialization
- MCP servers configured ad-hoc per robot
- Documentation referenced obsolete MongoDB system

**After:**
- `.mcp.json` template created during bootstrap
- Single project-level MCP configuration
- Documentation aligned with file-based activity-log-file v2.0.0

### Impact
- **P00-bootup**: Bootstrap now initializes `.mcp.json` automatically
- **All Phases**: Updated references to activity-log-file MCP server
- **Documentation**: Removed all stale database references
- **Developer Experience**: Clear guidance on MCP server configuration

### Related Documents
- ROME-PROP-014: MCP Configuration and Activity Log Migration Proposal
- ROME-PHASE-001 v1.2: P00-bootup Operations Guidelines
- ROME-PROC-005 v2.0: Activity Logging Protocol

---

## [2025-12-18] - Event Log Activity Tracking System (ROME-PROP-007)

### Implemented
- **All 10 Robot Templates → v2.0**: Complete migration to event log system
  - **ROME-ROBOT-001 v2.0**: Bootstrap - Project initialization with event log
  - **ROME-ROBOT-002 v4.0**: Talib - Analysis phase (P1-P2)
  - **ROME-ROBOT-003 v2.0**: PMA - Design phase (P3)
  - **ROME-ROBOT-004 v2.0**: Roma - Orchestrator across all phases
  - **ROME-ROBOT-005 v2.0**: Sarah - QA gates (P2-P5)
  - **ROME-ROBOT-006 v2.0**: Clara - UX design (P3)
  - **ROME-ROBOT-007 v2.0**: Charlie - Frontend generation (P5)
  - **ROME-ROBOT-008 v2.0**: Reena - Backend generation (P5)
  - **ROME-ROBOT-009 v2.0**: Lucien - DevOps configuration (P4)
  - **ROME-ROBOT-010 v2.0**: Ashok - Database generation (P5)

- **Activity Logging Protocol v2.0** (ROME-PROC-005)
  - Replaced `update_entry()` with `append()` pattern
  - Replaced `add_entry()` with `append({type, id, attributes})`
  - Replaced `find_by_*()` queries with `query()` and direct YAML reads
  - Field renames: `startDate→started`, `completionDate→completed`, `createdDate→created`
  - Type capitalization: `"feature"→"FEATURE"`, `"blocker"→"BLOCKER"`
  - Added mandatory `robot` identifier to all events

- **Event Log Format Specification** (ROME-GOV-008)
  - Pipe-delimited format: `TIMESTAMP | TYPE | ID | ATTRIBUTES`
  - Auto-generated state index: `ARTIFACTS/activity-state.yaml`
  - Support for PHASE, FEATURE, STORY, BLOCKER, AMENDMENT event types

- **MCP Server Implementation**: Complete Dart implementation
  - `append({type, id, attributes})` - Write events to log
  - `rebuild_state()` - Regenerate state index from log
  - `query({filters})` - Query current state
  - `get_history({id})` - Get event history for specific ID
  - `get_statistics()` - Get activity statistics

- **Migration Guide** (ROME-MIG-001)
  - 7-step procedure for MongoDB → Event log migration
  - Complete rollback procedures (immediate and gradual)
  - Troubleshooting guide with 6 common issues

- **ROME-GOV-002 v2.5**: UID Registry
  - Added MIG type code for migration documents
  - Registered ROME-MIG-001

### Rationale
- **Eliminates MongoDB dependency**: No database setup required for new projects
- **40x faster writes**: 1-5ms vs 50-200ms (MongoDB)
- **5-20x faster reads**: Direct file access vs database queries
- **Git-trackable**: Text-based event log enables version control
- **Complete audit trail**: Append-only log preserves full history
- **Zero connection overhead**: No database connections or connection pooling
- **Portable projects**: Just copy directory, no database export/import

### Pattern Changes
```javascript
// OLD: MongoDB update pattern
mcp__activity-log__update_entry(
  id: "PHASE-1",
  updates: {status: "IN_PROGRESS", startDate: "2025-12-18T10:00:00Z"}
)

// NEW: Append event pattern
mcp__activity-log__append({
  type: "PHASE",
  id: "PHASE-1",
  attributes: {
    status: "IN_PROGRESS",
    robot: "talib",
    started: "2025-12-18T10:00:00Z"
  }
})

// OLD: MongoDB query pattern
mcp__activity-log__find_by_status("BLOCKED")

// NEW: Query state or direct YAML read
mcp__activity-log__query({status: "BLOCKED"})
// OR
const state = Read("ARTIFACTS/activity-state.yaml")
const blocked = state.by_status.BLOCKED
```

### Architecture Transformation
**Before (MongoDB):**
- Database dependency required
- Point-in-time state only
- Complex queries needed
- 100-500ms connection time
- Binary format (not git-trackable)

**After (Event Log):**
- No database needed
- Complete audit trail
- Simple file reads
- 0ms connection time
- Text format (git-trackable)

### Performance Improvements
| Metric | MongoDB | Event Log | Improvement |
|--------|---------|-----------|-------------|
| Write Speed | 50-200ms | 1-5ms | **40x faster** |
| Read Speed | 20-100ms | 1-20ms | **5-20x faster** |
| Connection | 100-500ms | 0ms | **instant** |
| Git Tracking | No | Yes | **+version control** |

### Impact
- **All Phases (P0-P5)**: All robots now use consistent event log pattern
- **New Projects**: No MongoDB setup required - Bootstrap v2.0 creates event log automatically
- **Existing Projects**: Can migrate using ROME-MIG-001 (7-step process with rollback)
- **Performance**: 40x faster writes, 5-20x faster reads
- **DevOps**: Simpler deployment (no database infrastructure)
- **Version Control**: Full project history in git including activity tracking

### Related Documents
- ROME-PROP-007: Event Log Activity Tracking Proposal
- ROME-PROP-007-IMPL: Implementation Plan
- ROME-PROP-007-100-PERCENT-COMPLETE: Final completion report
- ROME-MIG-001: MongoDB to Event Log Migration Guide
- ROME-PROC-005: Activity Logging Protocol v2.0
- ROME-GOV-008: Activity Log Format Specification

### Implementation Statistics
- **Files Created**: 22 (MCP server, documentation, guides)
- **Files Modified**: 14 (10 robots + 4 governance docs)
- **Total Edits**: ~111 edits across all robot templates
- **Implementation Time**: ~8 hours (across 2 sessions)
- **Status**: 100% COMPLETE - PRODUCTION READY

---

## [2025-12-18] - Story ID Semantic Correction (ROME-PROP-005)

### Implemented
- **ROME-LEX-001 v1.1**: Added Work Decomposition section
  - Defined Epic, Feature, Story hierarchy (Epic > Feature > Story)
  - Story ID pattern: `STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER]`
  - Added comprehensive hierarchy example
  - Updated alignment section with Agile/Scrum/SAFe/Jira terminology

- **ROME-PHASE-004 v2.1**: Updated Story ID pattern in actionlist schema
  - Changed from `STORY-###` to `STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER]`

- **ROME-ROBOT-003 v1.6**: Updated PMA procedures
  - Added Step 12.1: Epic identification guidance
  - Updated actionlist schema with Epic field in features
  - Updated story ID pattern in robot assignment
  - Renumbered subsequent steps

### Rationale
- Aligns with Principle 8 (Terminological Integrity): standard domain language
- Corrects semantic inversion (Feature contained Epic in old pattern)
- Matches universal hierarchy: Epic (months) > Feature (weeks) > Story (hours)
- Compatible with Agile, Scrum, SAFe, Jira, Azure DevOps

### Pattern Change
```
OLD: STORY-[FEAT]-[EPIC]-[SEQ]-[LAYER]
     STORY-001-1-2-api (Feature 001, Epic 1, Story 2)

NEW: STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER]
     STORY-001-001-2-api (Epic 001, Feature 001, Story 2)
```

### Impact
- **Phase P03 (Design)**: PMA uses new pattern for work breakdown
- **Phases P04/P05**: Robots reference new Story IDs
- **Zero migration cost**: Framework in draft, no production usage

### Related Documents
- ROME-PROP-005: Story ID Semantic Correction Proposal
- ROME-LEX-001: Lexicon
- ROME-PHASE-004: Phase 3 Design Operations Guidelines
- ROME-ROBOT-003: PMA Robot Definition

---

## [2025-12-18] - Design Artifact Conciseness (ROME-PROP-004)

### Implemented
- **ROME-PHASE-004 v2.0**: Phase 3 Design Operations Guidelines
  - Converted technology stack schema to declarative YAML format (70% size reduction)
  - Streamlined use case schema to concise action → response flow format (40% reduction)
  - Added API design schema with pattern references instead of full payload examples (80% reduction)
  - Removed justification requirements from Exit Criteria and Quality Gate 2
  - Maintained data dictionary completeness (single source of truth)

- **Artifact Templates Created**: `/ROME/life-cycle/P03-design/artifact-templates/`
  - `tech-stack-template.yaml`: Reference implementation of declarative tech stack
  - `use-case-template.md`: Concise use case format with examples
  - `api-design-template.md`: Pattern-based API design with format guidelines

- **ROME-ROBOT-003 v1.5**: PMA Robot Definition
  - Updated Step 5 (Tech Stack) to reference declarative YAML format
  - Updated Step 8 (API Design) to use concise pattern-based format
  - Updated Step 9 (Use Cases) to use action → response flow format
  - Added template file references for all artifacts
  - Updated Architecture Review template to remove "Alternatives Considered" column

- **ROME-ROBOT-006 v1.1**: Clara Robot Definition
  - Updated use case format reference to align with concise schema
  - Adjusted UI Requirements integration format

- **ROME-GOV-002 v2.0**: UID Registry
  - Added PROP type code for framework proposals
  - Registered ROME-PROP-001 through ROME-PROP-004

### Rationale
- Aligns with ROME-DEF-001 LLM optimization principle (terse, high-signal output)
- Reduces P03 document bloat by 40-60%
- Accelerates design phase completion by ~20%
- Eliminates justification/rationale requirements (context preserved in git history)
- No downstream impact: P04/P05 phases consume decisions only, not rationale

### Impact
- **Phase P03 (Design)**: Direct impact - PMA uses new schemas immediately
- **Phases P04/P05**: No impact - consume decisions, not rationale
- **Token Efficiency**: 40% reduction in LLM token consumption for design artifacts

### Related Documents
- ROME-PROP-004: Design Artifact Conciseness Proposal
- ROME-PHASE-004: Phase 3 Design Operations Guidelines
- ROME-ROBOT-003: PMA Robot Definition
- ROME-ROBOT-006: Clara Robot Definition
