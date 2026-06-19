# ROME-PROP-035: Single-Session Orchestration on the Native Sub-Agent Model

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-035 |
| **Title** | Transfer and Enhance ROME Principles onto a Single-Session Orchestrator + Native Sub-Agent/Task Execution Model |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-06-18T00:00:00Z |
| **Targets** | `ROME/robot-plugins/`, `ROME/rome-core/`, framework execution model |
| **Supersedes (intent of)** | ROME-PROP-011 (subagent architecture), ROME-PROP-021 (multi-robot parallel execution), parts of ROME-PROP-003 (multi-agent optimization) |
| **Relates to** | ROME-PROP-019/020 (robot plugins own skills), ROME-PROP-034 (phase plugin consolidation) |
| **Companion** | ROME-PROP-036 (input characterization & intent-driven routing), ROME-PROP-037 (visualization & optional prototyping), ROME-PROP-038 (topology-driven capability instancing), ROME-PROP-039 (executability, resilience & contracts), ROME-PROP-040 (governance, knowledge & security) |

---

## Executive Summary

ROME was designed before Claude Code provided a native sub-agent primitive (the `Agent`/Task tool), before agent skills, and before current model context windows. Its multi-agent design is therefore **emulated**: each "robot" is a separate Claude Code session a human switches between, and the only coordination channel is an append-only activity-log MCP server that the orchestrator (Roma) can *read* but cannot *act on*.

This proposal transfers ROME's enduring principles — **formal traceability, structured requirements-to-code adaptation, quality control for accuracy and completeness, progress monitoring, and gate-based quality assessment** — onto a model where **one session orchestrates the entire lifecycle and invokes specialized sub-agents on demand**, each carrying its own skill set.

It also answers the governance question this raises directly: **we keep named specializations, but they stop being separate sessions and become sub-agent *types*.**

---

## 1. Enduring Principles (the invariants this proposal must preserve)

These are ROME's reason for existing. The execution model may change; these may not be weakened.

| # | Principle | Current Mechanism | Must Survive Re-architecture |
|---|-----------|-------------------|------------------------------|
| EP-1 | **Formal traceability** — every artifact traces user requirement → code | 7-link chain, TRACEABILITY.md, AORDL IDs | Yes — strengthened |
| EP-2 | **Structured adaptation** — requirements → analysis → design → config → code via defined phases | P0–P5 with entry/exit criteria | Yes |
| EP-3 | **Quality control** — accuracy + completeness enforced, not assumed | Sarah quality gates between phases | Yes — made enforceable |
| EP-4 | **Progress monitoring** — work is observable and auditable | activity-log MCP | Yes — repurposed |
| EP-5 | **Quality assessment** — independent review separated from production | Sarah ≠ producing robots | Yes |
| EP-6 | **Specialized expertise** — domain-focused agents, not one generalist | 10 named robots | Yes — as sub-agent types |
| EP-7 | **Optimal operation** — terse, LLM-optimized, low rework, parallel where possible | Phase plugins, parallel P5 (declared) | Yes — actually realized |

**Design rule:** any change that cannot demonstrate it preserves EP-1 through EP-5 is out of scope.

---

## 2. Why the Original Model Is Now Sub-Optimal

ROME's architecture is sound; its *runtime* is dated.

1. **No real orchestrator.** Roma is defined as "coordinates, does not command" and "only robot operating across all phases" — but it has no mechanism to launch, block, or sequence another robot. It observes the activity log. Orchestration is performed by a human switching sessions (`switch-robot.sh` `cat`s a `ROBOT.md` into context).

2. **Declared-but-unimplemented parallelism.** ROME-PROP-021 documents that the P5 phase plugin declares three robots with a dependency chain (Ashok → Reena → Charlie) but the SessionStart hook loads only one. True parallel execution never existed.

3. **Coordination by side-effect.** Robots communicate by appending to a shared log and reading it back. This is brittle: the framework needs hooks to *reject zero timestamps* and *enforce log writes* precisely because correctness depends on every agent voluntarily narrating itself. Gate decisions are inferred from log state rather than returned as values.

4. **Context fragmentation.** Each robot session reconstructs project state from disk/log on startup. There is no single context that holds the lifecycle.

5. **Pre-dates the right primitives.** Sub-agents (isolated context + scoped tools + own system prompt), agent skills, and large context windows now make the intended design directly expressible.

---

## 3. Target Model

### 3.1 One orchestrator session

**Roma becomes the single long-lived session** that owns the lifecycle state machine. It does not produce artifacts. It:

- holds project state (current phase, gate status, open blockers, traceability index) in its own context;
- invokes specialized sub-agents to perform each phase's work;
- invokes the quality sub-agent at each gate and **acts on the returned verdict** (BLOCK loops back, APPROVE advances) — enforcement in-process, not inferred;
- fans out independent work concurrently and joins on dependencies;
- writes the audit record.

This makes Roma's existing `procedures/phase-transitions.md` and the ROME-DATA-FLOW gates **executable control flow** instead of prose a human follows.

### 3.2 Robots become sub-agent types, not sessions

Each robot's existing plugin folder maps cleanly onto a sub-agent definition:

| Robot plugin asset | Becomes |
|--------------------|---------|
| `ROBOT.md` + `modes/<phase>.md` | Sub-agent **system prompt** |
| `skills/*/SKILL.md` | Sub-agent's **scoped tools/skills** |
| `procedures/*.md` | Reference material loaded into the sub-agent's context |
| Permitted/Prohibited list | Tool all-list / scoping |

The orchestrator invokes them as Task/Agent calls. Each gets an **isolated context window** (focused, no cross-contamination) and returns a **structured result** (artifacts written + a summary + traceability deltas) to Roma.

### 3.3 Coordination flips from log-pull to call/return

- **Control** travels through sub-agent invocation and return values (deterministic, enforceable).
- **The activity-log MCP is demoted to an audit/traceability trail** — still written for EP-1/EP-4, but no longer the coordination substrate. This deletes an entire class of failure ("robot worked outside log visibility") and removes the need for log-enforcement hooks as a *correctness* mechanism.

### 3.4 Real parallelism, finally

P5 is expressed as: Roma spawns Ashok, Reena, Charlie as concurrent sub-agents, honoring the `dependsOn` graph already declared in `plugin.json`, joining before the Sarah gate. This is exactly ROME-PROP-021's intent — though realized speedup scales with the *width* of the dependency graph, not its size (see §3.5.1).

---

## 3.5 Deterministic Enforcement (the orchestrator drives; code enforces)

**Critical design constraint.** The orchestrator (Roma) is itself an LLM session. An LLM does not *deterministically execute* a state machine — left to discretion it can skip a gate, advance on a soft BLOCK, mis-sequence a fan-out, or fail to persist state. If gate enforcement depends on the orchestrator model *choosing* to honor it, this re-creates the original "robot forgets to log" weakness one level up — at the most damaging point. §6b's "completion = return = record" guarantees *sub-agent* reporting; it does **not** cover the orchestrator's own control decisions.

**Rule:** the phase state machine and gate enforcement are **deterministic code, not model discretion.**

- The LLM orchestrator *drives* (decides what to do next, dispatches sub-agents, interprets results).
- A deterministic **guard** *enforces* (a script/hook that refuses to mark a phase `COMPLETE` or advance the phase pointer unless `state.json` holds a matching `APPROVE` record from the designated gate role; refuses to start a phase whose entry criteria are unmet; rejects a phase pointer that skips a gate).
- Gate verdicts are written by the **gate role's** return, not by the producer or the orchestrator's narration; the guard checks the record exists and matches before allowing advance.

This makes the quality guarantees structural (they hold even if the orchestrator model errs), not aspirational. Implementation: a `phase-advance` guard hook over writes to `state.json`, mirroring how the legacy framework already uses PreToolUse/PostToolUse hooks for log enforcement — repurposed from "did the robot log?" to "is this transition authorized?".

### 3.5.1 Speed expectations (honest scoping)

Parallel speedup is **topology-dependent**: it scales with the *width* (independent branches) of the dependency graph, not its total size. A wide graph (many independent components/sub-tasks) parallelizes well; a deep/linear chain (UI→BFF→service→lib→DB) is critical-path-bound and degenerates toward sequential regardless of fan-out. The framework should be benchmarked against critical-path length, not component count. Inherited PROP-003/011 figures (e.g. "60% faster") apply to wide, independent workloads (notably P2 analysis sub-tasks); they are not a universal guarantee.

### 3.5.2 Orchestrator as bottleneck and single point of failure

Because every sub-agent return funnels through one session, the orchestrator's per-return work must be **minimal and append-only** (record the delta; do not recompute the index) — otherwise central work serializes the fan-out (Amdahl's law) and caps the achievable speedup. Heavy aggregation (full traceability reconciliation, coverage computation) runs lazily at gates, not per return. The orchestrator holds only a **bounded working set** in context and externalizes aggressively to `state.json`, re-reading on demand; this must be a tested requirement against a defined largest-supported topology, not an aspiration. Resume (§6d) must survive a *mid-fan-out* crash, not only clean phase boundaries.

### 3.5.3 Where accuracy is mechanical vs. LLM-judged

Accuracy guarantees are strongest where checks are **mechanical** and weakest where they are **LLM-judged** — and early-phase errors propagate downstream at full cost:

| Phase | Strongest available check | Nature |
|-------|---------------------------|--------|
| P1 Requirements | AORDL STRICT validation | **Mechanical** (deterministic) |
| P2 Analysis | traceability coverage check | semi-mechanical |
| P3 Design | Clara/Sarah review; optional prototype gate (PROP-037) | LLM + optional human |
| P4 Config | build-config validity | semi-mechanical |
| P5 Generation | build + test execution (PROP-039) | **Mechanical** |

Implication: contracts and traceability are themselves LLM-generated, so a confidently-wrong contract can pass its own drift check. The framework must therefore lean on the cheapest *mechanical* checks upstream (AORDL STRICT at P1, build-config validity at P4) and on **human backstops** where machines cannot verify (sponsor confirmation of intent/contracts per PROP-036/039; the optional prototype gate per PROP-037). These human/mechanical accuracy checkpoints are **recommended-on for accuracy-critical projects**, not merely optional. "Structured returns + Sarah verification" (§6b) is LLM-verifying-LLM — a real but *bounded* mitigation, not a hard check.

---

## 4. The Core Question: Do We Still Need Named Robots?

**Yes — but the meaning of "robot" changes.** Drop "robot = a separate Claude session you switch into." Keep "robot = a named, specialized agent definition."

Named specializations still earn their place because they encode five things a single generalist prompt cannot:

1. **EP-6 specialization** — a focused system prompt + scoped skills produces better, more consistent output than one agent told to do everything. A backend sub-agent should not hold UI skills.
2. **EP-1 traceability authorship** — every artifact records *which specialization produced it*. "PMA produced architecture.md, Clara validated it" is provenance the chain depends on. Anonymous sub-agents erase authorship.
3. **EP-3/EP-5 separation of duties** — the producer must not be the gatekeeper. Sarah being a *distinct, named* reviewer agent is the structural guarantee of independent quality assessment. Collapsing roles collapses the gate.
4. **Context economy** — isolated, role-scoped contexts keep each invocation small and on-task; the orchestrator holds the only full-lifecycle context.
5. **Stable governance vocabulary** — ROME's documents, gates, and proposals reference roles by name. Names are the framework's coordination lexicon (a stated Core Objective in the Archie role).

**What to drop:** the human-driven session switching, per-robot SessionStart hooks, `switch-robot.sh`, and the idea that a robot is an independently bootable instance.

**Recommended reframing:** rename the runtime concept from **"robot" (an instance)** to **"agent role / sub-agent type" (a definition the orchestrator instantiates)**. The persona names (Roma, Talib, PMA, Clara, Lucien, Ashok, Reena, Charlie, Sarah, Bootstrap) are retained as **role identifiers**. They are now *roles the orchestrator dispatches*, not *seats a human occupies*.

> Decision for sponsor: keep persona names as-is, or migrate to functional names (e.g. `requirements-analyst`, `architect`, `design-validator`, `quality-gate`)? Persona names preserve continuity with all existing docs; functional names are more legible to new users and to the model. **Recommendation: keep persona names as role aliases, add functional descriptors in each definition's metadata** — zero doc churn, improved legibility.

---

## 4a. Shared Glossary & Responsibility Matrix (binding across PROP-035..040)

All proposals in this set resolve these terms identically. This is the authoritative glossary.

| Term | Definition |
|------|------------|
| **Role** (= capability) | A named, specialized agent definition (system prompt + scoped skills). The *kind* of work. E.g. Talib, PMA, Sarah; or in PROP-038 capability form, `generate-ui`. Role and capability are the same concept; PROP-038 uses "capability" when emphasizing per-component instancing. |
| **Instance** | One concrete sub-agent the orchestrator spawns from a role/capability for a specific unit of work. Three UIs → three instances of `generate-ui`. |
| **Persona name** | A human-readable alias for a role (Ashok, Reena, Charlie…), retained for doc continuity. Not an instance limit. |
| **Orchestrator** | The single long-lived Roma session that drives the lifecycle. |
| **Guard** | Deterministic code (hook/script) that enforces transitions (§3.5). Distinct from the orchestrator, which only drives. |
| **Gate** | A phase-transition checkpoint owned by a gate role; produces an APPROVE/BLOCK verdict the guard enforces. |
| **Component graph** | Machine-readable topology (PROP-038): nodes (components) + `dependsOn` edges. |
| **Contract** | An interface definition between components (PROP-039): API spec, shared types, event schema. |

**Phase model:** the fractional phases (P0.5 intake — PROP-036; P3.5 prototype — PROP-037) are not special cases. They are **optional phases in one routing model** the orchestrator reads from config + the Input Characterization Record. The orchestrator runs whatever phase sequence the routing resolves; "optional" means "may be absent from the resolved sequence," not "handled by bespoke logic."

### Responsibility Matrix (who owns what)

| Concern | Owner | Notes |
|---------|-------|-------|
| Lifecycle sequencing, dispatch, fan-out/join | Roma (orchestrator) | drives only |
| Transition enforcement (advance/block) | Guard (deterministic code) | §3.5 |
| Requirements (P1) | Talib | AORDL STRICT validation is mechanical |
| Analysis (P2) | Talib | parallel sub-tasks |
| Input characterization (P0.5) | Surveyor | PROP-036 |
| Design production (P3) | PMA | architecture, API, data dictionary, contracts |
| **Design-domain validation** (in-phase) | **Clara** | validates design artifacts, component graph, UX checklist *content* — domain correctness, not gate authority |
| **Gate authority** (phase transitions) | **Sarah** | issues APPROVE/BLOCK verdicts for every gate, including security and executability criteria |
| Configuration (P4) | Lucien | scaffolding, secrets-as-config |
| Generation (P5) | Ashok/Reena/Charlie (capability instances) | per-component |
| Prototyping (P3.5, optional) | Reena/Charlie (or Visualizer) | producer; Sarah+sponsor approve |
| Security review (optional) | dedicated security pass | producer-independent (EP-5); Sarah gates |

**Clara vs. Sarah, resolved:** Clara performs *domain validation within a phase* (is this design/graph/UX internally correct and complete?); Sarah holds *gate authority at phase transitions* (is this phase authorized to advance?). Clara advises; Sarah decides; the guard enforces.

---

## 5. How Each Enduring Principle Is Preserved or Enhanced

| Principle | Before | After |
|-----------|--------|-------|
| EP-1 Traceability | Log-pull, voluntary | Each sub-agent returns traceability deltas to the orchestrator, which maintains the index; log is the immutable audit copy. **Enhanced.** |
| EP-2 Structured phases | Human-sequenced | Orchestrator drives the phase sequence; a deterministic guard code-checks entry/exit criteria (§3.5). **Enhanced.** |
| EP-3 Quality control | Gate inferred from log | Gate role returns BLOCK/APPROVE; the guard enforces advance (not model discretion — §3.5). **Enhanced.** |
| EP-4 Progress monitoring | activity-log only | Orchestrator holds live state; activity-log retained as audit trail. **Preserved.** |
| EP-5 Quality assessment | Sarah session, separate | Sarah sub-agent, structurally separate from producers; cannot self-approve. **Preserved.** |
| EP-6 Specialization | 10 robot sessions | 10 sub-agent types, isolated contexts, scoped skills. **Preserved.** |
| EP-7 Optimal operation | Sequential; parallel declared only | True concurrent sub-agents on the dependency graph. **Enhanced.** |

No principle is weakened. Four of seven are strengthened by making them mechanically enforced rather than convention-dependent.

---

## 5a. Per-Phase Impact

How each ROME phase benefits from — or is affected by — the orchestrator + sub-agent model.

| Phase | Owner role(s) | Benefit / Effect under new model |
|-------|---------------|----------------------------------|
| **P0 — Bootstrap** | Bootstrap | Becomes a single orchestrator-invoked setup call instead of a bootable session. The orchestrator creates structure once and holds it in state; no per-robot SessionStart hook needed. Low-risk first conversion. |
| **P1 — AORDL Requirements** | Talib | Sub-agent receives the AORDL standard (post-PROP-034) as scoped reference and returns validated `REQ-*.yaml` + traceability seeds directly to the orchestrator. STRICT-validation results return as values, so the orchestrator can BLOCK before P2 instead of relying on a separate Sarah log read. Independent BDD-transformation work can fan out per requirement. |
| **P2 — Analysis** | Talib | Largest parallelism win in the early phases: entity extraction, dependency mapping, and user-story decomposition are independent sub-tasks the orchestrator can spawn concurrently — a genuinely *wide* workload, so PROP-003's projected speed-ups are realistic here (unlike deep, critical-path-bound phases; see §3.5.1). Each returns a traceability delta (REQ-###→FUNC-###) the orchestrator merges into one index. |
| **P3 — Design** | PMA (produce), Clara (validate) | Cleanest demonstration of separation of duties: orchestrator calls PMA to produce architecture/API/data-dictionary, then Clara as a *distinct* sub-agent to validate — producer cannot self-approve. Recommended M2 proof phase. Clara's findings return as a structured pass/fail the orchestrator acts on before the Sarah gate. |
| **P4 — Configuration** | Lucien | Scaffolding driven directly from the data-dictionary/tech-stack the orchestrator already holds in state — less re-reading from disk. Independent workspace/build/test-framework setup steps parallelize. Output manifest returns to orchestrator state, feeding P5 fan-out cleanly. |
| **P5 — Generation** | Ashok, Reena, Charlie | Biggest single beneficiary. Today's *declared-but-unimplemented* parallelism (PROP-021) becomes real: orchestrator fans out the three roles as concurrent sub-agents honoring the `dependsOn` graph and joins before the gate. Isolated contexts prevent backend/frontend skill bleed. Per-feature work can parallelize within each role. |
| **Quality Gates (all)** | Sarah | Most structurally improved. Gate verdicts become **returned BLOCK/APPROVE values the orchestrator enforces**, not log state inferred after the fact. Sarah stays a separate sub-agent (EP-5 intact) and structurally cannot self-approve any phase. Gate readiness checks run as orchestrator pre-conditions. |
| **Cross-phase (Roma)** | Roma | Transforms from passive log-watcher to the active orchestrator session — the one role whose nature changes most. Holds lifecycle state, sequences phases, enforces gates, fans out/joins parallel work. Gains real authority that the current "coordinates, does not command" definition lacked. |

**Net effect by phase group:** early phases (P0–P1) gain *enforceability and simplicity*; middle phases (P2–P4) gain *parallelism*; P5 gains *true concurrency*; gates gain *mechanical enforcement*; Roma gains *actual control*.

---

## 6. Migration Path (incremental, non-breaking)

The robot-plugin assets (`ROBOT.md`, `modes/`, `skills/`) are **already in the right shape** to become sub-agent definitions — this is largely a runtime change, not a content rewrite. PROP-034 (phase-plugin consolidation, elevating shared specs to framework standards) is a clean prerequisite.

- **M0 — Prerequisite.** Land ROME-PROP-034 so shared format specs live in framework standard docs, not phase plugins.
- **M1 — Orchestrator skeleton.** Define Roma as the orchestrator session with the phase state machine; no behavior change to robots yet.
- **M2 — One phase as proof.** Convert P3 (PMA produce → Clara validate → Sarah gate) to orchestrator-driven sub-agent calls. Validate EP-1/EP-3/EP-5 end-to-end on a test project.
- **M3 — Parallel proof.** Convert P5 to concurrent sub-agents on the dependency graph (delivers PROP-021).
- **M4 — Full cutover.** Remaining phases; retire SessionStart per-robot hooks and `switch-robot.sh`; demote activity-log to audit-only.
- **M5 — Terminology.** Rename "robot" → "agent role" across docs; persona names retained as aliases.

Old and new can coexist through M4: a phase not yet converted still runs the legacy way.

---

## 6a. Progress Recording & Tracking

Progress splits into two layers that the current framework conflates into one (the activity-log MCP).

### Layer 1 — Live state (new)

The orchestrator holds lifecycle state in context and persists it to a single file: `ARTIFACTS/_orchestration/state.json`. Contents:

- current phase + per-phase status (`PENDING / IN_PROGRESS / GATE / BLOCKED / COMPLETE`)
- sub-agents dispatched / running / returned
- open blockers and owners
- gate ledger (each gate's BLOCK/APPROVE verdict, timestamp, reviewing role)
- pointer into the traceability index

This makes progress queryable at any moment ("where are we?") rather than reconstructed from a log tail, and it is the **resume point** — if the orchestrator session ends, it rehydrates from this file.

### Layer 2 — Audit trail (repurposed activity-log)

The append-only activity-log MCP is retained (EP-1/EP-4) but demoted from coordination channel to **immutable audit record**. Write path changes: each sub-agent **returns** its summary + actions; the **orchestrator writes log entries centrally** from those returns.

### Progress as coverage (traceability index)

Each sub-agent returns traceability deltas; the orchestrator merges them into one index. The headline progress metric becomes **requirement coverage** (% of requirements with a complete 7-link chain to passing tests) — far more meaningful than "phase N of 6".

| Principle | Recorded as | Tracked by |
|-----------|-------------|------------|
| EP-2 structured phases | `state.json` phase machine | orchestrator (live) |
| EP-3/EP-5 quality gates | gate ledger | orchestrator (enforced, unskippable) |
| EP-4 progress monitoring | live state + audit log | orchestrator (live) + log (history) |
| EP-1 traceability | traceability index, % coverage | orchestrator merges deltas |

**Sponsor decisions:** (a) `state.json` = source of truth, log = immutable audit copy *(recommended)*; (b) track both phase-level and coverage-% progress, report coverage as headline *(recommended)*.

---

## 6b. Progress-Reporting Reliability

**Known weakness in legacy ROME:** robots did not reliably update progress after completing a task. Logging was a *voluntary side-channel* — a separate, discretionary act decoupled from doing the work. The framework had to add defensive hooks (`reject-zero-timestamps.sh`, `check-activity-log.sh`) and a "no work outside activity log visibility" prohibition precisely because completion and reporting were decoupled: an agent could finish and simply not report, detectable only by the *absence* of a log entry.

**Structural fix under this model:** reporting is no longer a separate act — **it is how a sub-agent finishes.** A sub-agent completes a task by *returning its result to the orchestrator*; the return value **is** the progress record. There is no silent-finish path: if control returns to the orchestrator, the record exists; if it does not return, the orchestrator knows the task did not complete. The orchestrator (one place, always in the loop) writes the record.

| Legacy failure mode | Status under PROP-035 |
|---------------------|------------------------|
| Robot finishes, forgets to log | **Eliminated** — return = record |
| No record because session never wrote | **Eliminated** — orchestrator writes centrally |
| Work done outside any phase | **Eliminated** — orchestrator dispatches all work |
| Robot returns vague/overstated summary | **Reduced** — mitigated, not eliminated |

**Residual risk** is *misreporting* (a sub-agent overstating what it did), not *non-reporting*. Mitigated by: (1) **structured returns** — a schema the sub-agent must populate, not free prose; (2) the **Sarah gate** independently verifying that claimed artifacts exist and meet criteria before APPROVE. Self-reporting accuracy is thus *checked*, not *trusted*. The legacy weakness is designed out rather than patched.

---

## 6c. Execution Isolation (git worktrees)

Worktrees matter only where concurrent sub-agents *mutate* files and would conflict — i.e. **P5 generation**. P0–P4 are sequential or fan out read-heavy work writing to distinct artifact files, so they share the one working tree.

In ROME, the P5 roles already write **disjoint subtrees** (`SOURCE/src/backend/`, `SOURCE/src/frontend/`, `SOURCE/tests/`), so they do not actually conflict — making full per-agent worktrees mostly overhead (each is a full checkout: disk + setup cost).

| Approach | When it wins |
|----------|--------------|
| **Shared tree, path-partitioned** *(v1 default)* | P5 roles own disjoint dirs → no conflicts. Simplest/cheapest; dependency graph already serializes the risky ordering. |
| **Worktree per parallel sub-agent** *(opt-in, P5 only)* | If roles write overlapping files, want isolated reviewable/revertable output before merge, or run speculative attempts. |
| **Worktree per feature/story** | If parallelizing *within* a role across features, each independently mergeable. |

**Recommendation:** v1 uses shared tree + path partitioning; worktree-per-agent is an opt-in for P5. Worktrees become genuinely attractive only with recursive/speculative generation (deferred PROP-011 Tier-3). **Constraint:** the orchestrator state, audit log, and traceability index (EP-1/EP-4) live in the **main** tree, never a per-agent worktree, so traceability is never fragmented across checkouts.

---

## 6d. Initiating a New Development

End-user flow. Key change from today: one orchestrator session runs the lifecycle — no per-robot terminal, no session switching.

0. **Provide input (human).** Place source material in `_user_input/raw-requirements/`. (See ROME-PROP-036 for non-document inputs — legacy code, existing apps, refinements.)
1. **Launch orchestrator (human).** Start one Roma orchestrator session (e.g. `/rome-start <project>`). It reads input, creates `state.json`, initializes the audit log and traceability index.
2. **P0 Bootstrap.** Orchestrator → Bootstrap sub-agent creates the directory skeleton; returns manifest; P0 `COMPLETE`.
3. **P1 Requirements.** Orchestrator → Talib returns validated `REQ-*.yaml` + traceability seeds → Sarah GATE-P1 (BLOCK loops back / APPROVE advances).
4. **P2 Analysis.** Fan out entities/dependencies/stories concurrently; merge deltas; GATE-P2.
5. **P3 Design.** PMA produces → Clara validates (distinct role) → GATE-P3.
6. **P4 Configuration.** Lucien scaffolds from held design state; GATE-P4.
7. **P5 Generation.** Fan out Ashok/Reena/Charlie on the `dependsOn` graph (optional worktrees); join; GATE-P5 (end-to-end traceability).
8. **Delivery.** Orchestrator confirms exit criteria from `state.json`, generates status/transition reports, writes final audit record.

**Human involvement throughout:** supply input, launch once, answer sponsor-clarification questions (via `Seez` MCP) when a sub-agent needs a decision, optionally review at gates.

**Sponsor decisions:** (a) **autonomous** run P0→P5 pausing only for blockers/sponsor questions, vs. `--gated` human-approval at every gate *(recommend: configurable, autonomous default)*; (b) provide `/rome-resume` to rehydrate from `state.json` across session boundaries *(recommended)*.

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| Orchestrator context bloat over a long lifecycle | Orchestrator holds *indexes and state*, not full artifacts; sub-agents read artifacts from disk on demand. |
| Loss of audit fidelity if log is demoted | Sub-agents still emit log entries as their audit return; orchestrator persists them. EP-4 intact. |
| Sub-agent can't self-coordinate mid-task | Keep coordination at the orchestrator (join points); avoid deep recursive spawning in v1 (defer PROP-011 Tier-3). |
| Doc churn from renaming | Persona names kept as aliases; functional names added as metadata only. |
| Sponsor expects separate-session model | This proposal is the decision record; require sign-off before M2. |

---

## 8. Recommendation

1. Approve the **single-session orchestrator + sub-agent-type** model as ROME's target execution model.
2. **Retain named specializations** as sub-agent roles (not sessions); rename the concept "robot" → "agent role."
3. Sequence: PROP-034 → M1 → prove on P3 → prove parallel on P5 → cut over.
4. Treat ROME-PROP-011 and ROME-PROP-021 as **subsumed by this proposal** (their intent is delivered here on the native primitive; Tier-3 recursive spawning deferred).

---

## Open Questions for Sponsor

1. Persona names vs. functional names (§4) — recommendation is keep-as-aliases.
2. Is recursive sub-agent spawning (PROP-011 Tier 3) in scope, or explicitly deferred? Recommendation: defer.
3. Should the activity-log MCP remain mandatory as the audit trail, or become optional once call/return is the control path? Recommendation: mandatory for EP-1/EP-4.
4. State source-of-truth: `state.json` vs. activity-log (§6a). Recommendation: `state.json` source, log = audit.
5. Worktree policy for P5 (§6c). Recommendation: shared tree v1, worktree opt-in.
6. Autonomous vs. gated run mode (§6d). Recommendation: configurable, autonomous default.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial draft — transfer ROME principles to single-session orchestrator + native sub-agent model; resolves named-robot question; subsumes PROP-011/021 intent. |
| 1.1 | 2026-06-18 | Added §5a per-phase impact, §6a progress recording/tracking, §6b reporting reliability, §6c git-worktree isolation, §6d new-development initiation; added PROP-036 companion reference. |
| 1.2 | 2026-06-18 | Pre-implementation critical review: added §3.5 deterministic enforcement (guard vs. orchestrator), §3.5.1 honest speed scoping (width not size), §3.5.2 bottleneck/SPOF constraints, §3.5.3 mechanical-vs-LLM accuracy map; added §4a shared glossary + responsibility matrix (resolves robot/role/capability and Clara/Sarah); unified fractional phases into one routing model; tempered speed claims. |
