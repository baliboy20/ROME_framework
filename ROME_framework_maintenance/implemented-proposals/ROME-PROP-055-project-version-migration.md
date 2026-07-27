# ROME-PROP-055 — Migrating Existing Projects to Newer Framework Versions

Document UID: ROME-PROP-055
Status: Implemented
Document Type: Framework Proposal
Depends on: PROP-054 (re-entry, change types, vendored-engine rule), ROME-MIG-002 (state schema auto-migration precedent), PROP-048/049 (append-only increments)

---

## In Plain Terms

Every project ROME builds carries a frozen copy of the framework inside it
(`.rome/`), so it keeps working forever exactly as built. The downside: a
project built with an older framework never benefits from newer features —
better design checks, the new bug-fix path, and so on.

This proposal defines how to **upgrade a project to the current framework
without losing anything**: none of its records, none of the reasoning behind
what was built, and no misreading of old documents by new rules. The short
answer to "will it need specific version migration paths?" is **yes — one
small documented step per framework version**, but you never run them by
hand: an upgrade command walks the ladder from your version to the latest,
checks fidelity at every rung, and refuses to continue rather than guess.
Upgrading is always optional, always reversible, and the sponsor approves it
before anything changes.

---

## Problem

- P1. **Vendoring freezes projects in time.** `rome-start` vendors the engine
  into `<project>/.rome/`; PROP-054 B.1 makes re-entry run on that vendored
  copy. Correct for stability — but there is no path to newer capabilities
  (e.g. PROP-054's light change paths, v3.1's design-authority gates).
- P2. **Three version surfaces exist and only one migrates.** (a) the state
  schema (`schemaVersion`, currently 2, auto-migrates v1→v2 on load —
  ROME-MIG-002); (b) the vendored engine (`ROME_FRAMEWORK_VERSION`, e.g.
  3.2.1); (c) **artifact conventions** — the formats and required facts of
  generated documents (requirements, tech-stack.yaml, design-assets, TDRs).
  Surfaces (b) and (c) have no migration story at all.
- P3. **Semantic drift risk.** A newer engine reading older artifacts can
  silently misinterpret them: a field that was optional is now required
  (e.g. `testing` block, v3.1.1; `designAssets`, AX-26), a term was
  redefined, a gate demands evidence the old project never produced.
  Loss of fidelity = the new engine no longer understands *why* an artifact
  is the way it is.
- P4. **No record of the convention level artifacts were written to.** State
  records the engine version, but individual artifacts don't declare which
  rules produced them; a migrator must currently infer.

## Part A — Version model

Three declared surfaces, each with its own compatibility rule:

| Surface | Where declared | Rule |
|---------|----------------|------|
| State schema | `state.json#schemaVersion` | Auto-migrates on load (existing ROME-MIG pattern). Never blocks. |
| Engine | `state.json#framework.version` + `.rome/rome-core/VERSION` | Project runs on its vendored engine until explicitly upgraded (PROP-054 B.1). |
| Artifact conventions | NEW: `state.json#conventionLevel` (single project-wide value = engine version at last build/upgrade) | A newer engine MUST NOT apply newer conventions to artifacts below their level; the gap is closed only by migration (Part B). |

- **AX-34 (proposed) — declared convention level.** Every project state
  declares `conventionLevel`. An engine encountering artifacts above its own
  version refuses (no forward compatibility). An engine encountering a lower
  `conventionLevel` runs in **compatibility read mode**: it may read and
  reason over the artifacts but may not gate them against post-level rules,
  and any new work it produces is blocked until the level is raised — no
  mixed-level increments.

### A.1 — The version number declares the rule-set

`conventionLevel` is not a new number: it IS the framework version string.
The framework version is therefore the authoritative declaration of the
rule-set (artifact conventions, required facts, term definitions) in force.
Versioning rule, binding on all future releases:

- **MAJOR or MINOR bump ⇔ the rule-set changed** (a migration step is
  mandatory — AX-35).
- **PATCH bump ⇔ convention-neutral by definition** (engine/doc fixes only;
  the boundary's migration step is a declared `no-op`).

Historical exception: v3.1.1 was released as a PATCH yet added a required
convention (`testing` block in tech-stack.yaml) — it predates this rule and
receives a real retro-authored step (MIG-3.1.0→3.1.1). No future PATCH may
do this.

## Part B — Migration paths: yes, per-version, but laddered

Specific paths are required — a single generic upgrader cannot know that,
e.g., v3.1 introduced a required `designAssets` fact. But paths are small,
declarative, and chained:

1. **One migration step per version boundary** (`MIG-3.0→3.1`, `MIG-3.1→3.2`,
   …), shipped inside the framework at
   `ROME/rome-core/migrations/<from>-<to>/`. Each step declares:
   - `transforms` — mechanical artifact/state rewrites (rename field, add
     default, move file);
   - `gaps` — facts the new version requires that old projects cannot
     mechanically supply (e.g. missing design assets, missing testing block).
     Each gap states **who closes it**: `derive` (an agent reconstructs it
     from existing artifacts, marked RECONSTRUCTED per PROP-047 reliability
     levels), or `sponsor` (only the sponsor can decide);
   - `semantics` — term/rule redefinitions the agents must be told about when
     reading pre-migration artifacts (the anti-drift ledger, P3).
2. **The ladder.** `rome-upgrade.cjs <projectDir> --to <version> --ts <iso>`
   composes all steps from `conventionLevel` to the target and runs them in
   order. No step for a boundary → upgrade refuses (never guesses). Skipping
   rungs is impossible.
3. **Fidelity checks at every rung.** After each step: state loads clean,
   all trace links still resolve, every artifact still parses under the new
   conventions, and the step's own postconditions hold. Any failure → halt,
   report, nothing further applied.
4. **Gap closure is a routed change.** Non-mechanical gaps are queued as
   change-queue items (PROP-054 B.2) and routed as CT-scoped work — e.g.
   "reconstruct design-assets" runs as a scoped design task with sponsor
   sign-off. The upgrade is COMPLETE only when all gaps are closed;
   until then state carries `upgrade: { target, pending: [...] }` and the
   project remains fully usable at its old level.
5. **Reversible and append-only.** The old vendored engine is retained at
   `.rome-prev/<version>/` and the pre-upgrade state snapshot is kept as an
   append-only record (PROP-048/049 principle). Rollback = restore both.
   The engine swap (`.rome/` replacement) happens **last**, only after all
   mechanical steps and fidelity checks pass.
6. **Sponsor approval, in plain terms** (PROP-054 AX-33). Before anything runs, the
   sponsor sees: current version → target, what changes mechanically, which
   gaps need their input, expected effort, and the rollback guarantee. No
   approval, no upgrade.
7. **Escape hatch — re-intake instead of laddering.** The ladder is optimal
   for small jumps; a project far behind accumulates a long chain of gaps. The
   framework already has an alternative: a fresh `migration`-intent intake in
   which Surveyor reads the old project's artifacts as inputs (RECONSTRUCTED
   where confidence is low, per PROP-047) and the delta is built forward.
   `rome-upgrade` MUST compare the composed ladder (boundary count, open gap
   count, sponsor-input count) against this alternative and, when the ladder
   is the worse deal, say so and recommend re-intake in the pre-approval
   brief (step 6). The sponsor chooses; the tool never silently assumes
   laddering is always right.

## Part C — Preserving understanding, not just data

Fidelity is more than files surviving a rewrite:

- **Reconstructed facts are marked.** Anything an agent derives during
  migration (not stated by the original sponsor/inputs) carries the existing
  `RECONSTRUCTED` reliability level — later work knows it is inference, and
  AX-18 sponsor authorization applies before building on it.
- **The semantics ledger travels with the project.** Each applied step's
  `semantics` notes accumulate in
  `ARTIFACTS/_orchestration/migration-log.md` — the authoritative "these
  artifacts predate rule X" record any agent consults when reading old
  artifacts. This is what prevents a v3.2 agent from flagging a compliant
  v3.0 artifact as defective, or worse, silently "fixing" it.
- **Intent is never rewritten.** Migrations may reformat artifacts; they may
  not alter recorded decisions, TDRs, sponsor approvals, or gate evidence.
  Those are historical facts (append-only). A convention change that would
  invalidate a past decision becomes a `sponsor` gap, never a rewrite.

## Maintenance obligation (framework side)

- **AX-35 (proposed) — no unreachable version.** A release that changes
  artifact conventions or state semantics MUST ship its migration step +
  fidelity postconditions + a violation test, in the same release. The
  fidelity script gains a check: for every version boundary in CHANGELOG.md
  that declares convention changes, a migration step exists. Releases that
  change neither (pure engine fixes) declare `no-op` for the boundary.

## Impacted artifacts

| Artifact | Change |
|----------|--------|
| New `ROME/rome-core/migrations/<from>-<to>/` | Per-boundary step definitions |
| New `rome-upgrade.cjs` | Ladder runner + fidelity checks + rollback |
| `state.js` | `conventionLevel`, `upgrade` block, pre-upgrade snapshot |
| `rome-start.cjs` | Stamp `conventionLevel` at creation |
| `ROME/agents/roma/modes/orchestrator.md` | Compatibility read mode; migration-log consultation duty |
| Axioms registry | AX-34, AX-35 + violation tests |
| Fidelity script | Boundary-coverage check (AX-35) |
| CHANGELOG.md convention | Each release marks convention-changing vs no-op |
| USER-GUIDE.md / GETTING-STARTED.md | "Upgrading an old project" section (plain terms) |

## Open questions

- OQ-1. Should `conventionLevel` be per-artifact rather than project-wide?
  (Recommend: project-wide + the migration log; per-artifact stamps add
  bookkeeping the ladder makes unnecessary — a project is always at exactly
  one level between upgrades.)
- ~~OQ-2~~ Resolved: retro-authored now. Steps for all four boundaries since
  v3.0.0 exist at `ROME/rome-core/migrations/` (3.0.0→3.1.0, 3.1.0→3.1.1,
  3.1.1→3.2.0, 3.2.0→3.2.1 no-op) — the proving ground for the mechanism.
- OQ-3. Does upgrade of a *relocated* project (running standalone on `.rome/`,
  PROP-054 B.1) fetch the new engine from the public repo, or require the
  sponsor to supply a framework copy? (Recommend: sponsor supplies/points to
  a clone; no network side-effects.)

---

## Revision History

| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-27 | Initial draft: three-surface version model, per-boundary laddered migration paths with fidelity checks and rollback, RECONSTRUCTED marking + semantics ledger for understanding-preservation. |
| v1.1 | 2026-07-27 | Axioms renumbered to AX-34/35 (AX-27..30 already claimed by PROP-051/052). Added A.1: the framework version number IS the conventionLevel and declares the rule-set (MAJOR/MINOR ⇔ convention change; PATCH convention-neutral; v3.1.1 grandfathered). OQ-2 resolved: retro steps authored for 3.0.0→3.1.0, 3.1.0→3.1.1, 3.1.1→3.2.0, 3.2.0→3.2.1 (no-op). |
| v1.2 | 2026-07-27 | Pre-implementation review amendment: Part B step 7 escape hatch — `rome-upgrade` compares the ladder against a fresh `migration`-intent re-intake and recommends the better path in the pre-approval brief; sponsor chooses. |
