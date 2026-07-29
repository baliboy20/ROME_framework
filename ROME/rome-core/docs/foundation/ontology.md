# ROME Framework: Ontology & Axiom Set

| Field | Value |
|-------|-------|
| **Document UID** | ROME-ONT-001 |
| **Version** | 1.7 |
| **Date** | 2026-07-16T00:00:00Z |
| **Status** | Active |
| **Document Type** | Foundation |
| **Author** | Archie |
| **Origin** | ROME-PROP-043 |
| **Companion** | ROME-LEX-001 (lexicon owns term *definitions*; this document owns *structure*) |
| **Builds On** | ROME-STD-GATE, ROME-STD-AGENT-ROLES, ROME-STD-TRACE, ROME-STD-AORDL, ROME-STD-SECURITY |

---

## Purpose

The lexicon defines terms in isolation. This document defines how they relate and what the framework guarantees is always true.

Three sections: the **entity set** (what exists), the **relation set** (how entities connect, with cardinalities), and the **axiom set** (invariants, each carrying enforcement provenance).

**Division of authority:** the lexicon is the source of truth for what a term *means*. This document is the source of truth for structure and invariants. Where a standard and this document disagree, the standard governs and this document is defective — file a correction.

---

## 1. Entity Set

| Ent ID | Entity | Source of truth |
|--------|--------|-----------------|
| ENT-01 | Phase (incl. half-phases P0.5, P3.5) | ROME-STD-GATE §1 |
| ENT-02 | Quality Gate | ROME-STD-GATE |
| ENT-03 | Role (= capability; producer / validator / gate authority / orchestrator) | ROME-STD-AGENT-ROLES §1 |
| ENT-04 | Instance (sub-agent spawned from a Role) | ROME-STD-AGENT-ROLES §1 |
| ENT-05 | Orchestrator (Roma — distinguished Role) | ROME-STD-AGENT-ROLES §3 |
| ENT-06 | Sponsor (external approval/escalation actor; Seez MCP) | GATE-P3.5, PROP-039 B, PROP-041 |
| ENT-07 | Requirement (AORDL) | ROME-STD-AORDL |
| ENT-08 | Artifact (identity-stable; `component:artifactId`) | ROME-STD-TRACE |
| ENT-09 | Component (topology node) | PROP-038 |
| ENT-10 | Gate Verdict / Gate Ledger entry | ROME-STD-GATE §2 |
| ENT-11 | Blocker | ROME-STD-GATE §3 |
| ENT-12 | Document (UID-bearing) | ROME-GOV-002 |
| ENT-13 | Input (raw material a project starts from — doc/idea/codebase/asset) | ROME-LEX-001; PROP-036/047 |
| ENT-14 | ICR (Input Characterization Record — Surveyor's output) | ROME-STD-AGENT-ROLES (Surveyor); PROP-036 |
| ENT-15 | Increment (one added unit of work with its own lifecycle over the shared traceability store) | ROME-LEX-001; PROP-048 |
| ENT-16 | Project (the whole — one or more Increments sharing traceability, audit, provenance) | ROME-LEX-001; PROP-048 |
| ENT-17 | Stage (sponsor-ordered group of Inputs; stage 0 = foundation, stage 1 = product MVP) | ROME-LEX-001; PROP-049 |
| ENT-18 | Core Subsystem (cross-cutting capability multiple Stages presume — auth, schema, design system, …) | ROME-LEX-001; PROP-049 |
| ENT-19 | Stub (sponsor-declared contract-shaped stand-in with an `implementBy` due Stage) | ROME-LEX-001; PROP-049 |
| ENT-20 | TDR (Technical Decision Record — one made technical decision with status, scope, binds) | ROME-STD-TECHSPEC; PROP-052 |

**Deprecation note:** "Robot" is not an entity. ROME-STD-AGENT-ROLES §1 retires it in favour of **Role** + **Instance**. It survives in the lexicon only as a legacy alias, and in filenames (`ROBOT.md`) which are deliberately not renamed.

---

## 2. Relation Set

| Rel ID | Relation | Cardinality |
|--------|----------|-------------|
| REL-01 | Phase `guarded-by` Gate | Phase(1) → Gate(0..1) — P0 ungated; every other phase gated |
| REL-02 | Instance `fills` Role | Instance(N) → Role(1) |
| REL-03 | Orchestrator `spawns/coordinates` Instance | Orchestrator(1) → Instance(N) |
| REL-04 | Gate `authorized-by` Role | Gate(N) → gate-authority Role(1) (currently Sarah for every gate) |
| REL-05 | Artifact `traces-to` Requirement | Artifact(N) ↔ Requirement(M) — bipartite edge store |
| REL-06 | Artifact `belongs-to` Component | Artifact(N) → Component(1) — component scopes artifact identity |
| REL-07 | Requirement `depends-on` Requirement | N ↔ M (P2 dependency graph) |
| REL-08 | Document `identified-by` UID | Document(1) → UID(1), stable across revisions |
| REL-09 | Verdict `recorded-for` Gate `by` Role | append-only ledger; N verdicts per gate |
| REL-10 | Sponsor `approves/escalated-to` Gate/Failure | GATE-P3.5 approval; PROP-039 B exhaustion; PROP-041 deferral authorization |
| REL-11 | Surveyor `characterizes` Input → ICR | Surveyor(1) → Input(N) → ICR(1) (P0.5; PROP-036/047) |
| REL-12 | Orchestrator `routes-from` ICR | routing derives from ICR(1) (`routeFromICR`; PROP-047) |
| REL-13 | Sponsor `declares-reliability-of` Input | Sponsor(1) → Input(N) (`**Status:**` markers; PROP-047) |
| REL-14 | Project `contains` Increment | Project(1) → Increment(N) — append-only (PROP-048) |
| REL-15 | Increment `has` Lifecycle (routing/phases/gates/verification) | Increment(1) → Lifecycle(1) |
| REL-16 | Increment `shares` Traceability store | Increment(N) → Traceability(1) — project-wide, edges tagged by increment |
| REL-17 | Requirement `belongs-to` Increment | Requirement(N) → Increment(1) |
| REL-18 | Stage `contains` Input | Stage(1) → Input(N) (PROP-049) |
| REL-19 | Increment `builds` Stage | Increment(1) → Stage(0..1) — unstaged increments permitted |
| REL-20 | Stage `provides/presumes` Core Subsystem | N ↔ M — basis of AX-23 |
| REL-21 | Stub `stands-in-for` Core Subsystem/Contract `until` Stage | Stub(1) → Subsystem(1), due Stage(1) |
| REL-22 | TDR `constrains` Phase-producer | TDR(N) → Phase(1..3) per `binds` (PROP-052) |
| REL-23 | Deviation `supersedes` TDR `by` Sponsor | Deviation(1) → TDR(1); sponsor-approved only (PROP-052 §2.5) |
| REL-24 | Sponsor `confirms/redirects/delegates` AIB | Sponsor(1) → AIB(1 per P3/P4), bound to AIB revision (PROP-051) |

---

## 3. Axiom Set

Axioms are **hard invariants (MUST)**. SHOULD-level guidance stays in standards.

Each axiom carries **enforcement provenance**:

| Tier | Meaning |
|------|---------|
| `ENFORCED` | Deterministic code refuses the violation. Cites `<module>.js#<function>`. |
| `CHECKED` | A script detects the violation after the fact. Cites the check. |
| `ASSERTED` | No mechanical check. Intent only — **not a guarantee**. (Empty as of PROP-044.) |

**Provenance is verified, at two levels.** Fidelity check 6 asserts every cited module and function still exists, **and** (PROP-044 Part A) that every ENFORCED axiom retains a violation test tagged with its ID somewhere under `orchestrator/tests/`. This closes the "function exists but no longer enforces" gap to "a violation test guards it". It still is not a proof of correctness — a rewrite that kept the test green but broke the behaviour would pass — but an axiom cannot silently lose its enforcement without a test failing.

### Tier 1 — ENFORCED

AX-01..08 are the gate-time rules harvested from ROME-STD-GATE §3 (`guard.js`).
AX-17..18 are routing-time invariants (`routing.js`, PROP-047). AX-19..24 are the
increment/staging invariants (PROP-048/049) — same enforcement style throughout:
deterministic refusal. (AX-20 is CHECKED, listed here to keep the numbering
contiguous with its siblings.)

| ID | Axiom | Provenance |
|----|-------|------------|
| AX-01 | Only the current routed phase may advance. | ENFORCED (`guard.js#canAdvance`; STD-GATE §3 r1) |
| AX-02 | A gated phase advances only on an APPROVE verdict for its gate. | ENFORCED (`guard.js#canAdvance`; STD-GATE §3 r2) |
| AX-03 | A verdict is accepted only when bound to a completed dispatch of the gate's designated role for that phase; the role is derived from the dispatch, not trusted from a parameter. Self-approval requires forging a gate-role dispatch, not a string (EP-5). | ENFORCED (`guard.js#recordGateVerdict`; STD-GATE §3 r3; PROP-045). *Transitional: a legacy unbound verdict is accepted with a `VERDICT_LEGACY_UNBOUND` audit flag; a fully dishonest orchestrator can still fabricate a dispatch — transcript-level proof is out of scope (PROP-045 non-goal).* |
| AX-04 | Latest verdict wins — a later BLOCK overrides an earlier APPROVE. | ENFORCED (`guard.js#latestVerdict`; STD-GATE §3 r4) |
| AX-05 | Open blockers on a phase prevent advance. | ENFORCED (`guard.js#canAdvance`; STD-GATE §3 r5) |
| AX-06 | Routing is a subset of the canonical phase catalog in canonical relative order; advance moves exactly one step along the routing. Phases may not be **reordered**. Optional phases (P0.5, P3.5) may be **omitted** at routing time — see the note below. | ENFORCED (`lifecycle.js#resolveRouting` rejects reordering; `guard.js#advance` moves one step; STD-GATE §3 r6) |
| AX-07 | A verdict on an ungated phase is rejected. | ENFORCED (`guard.js#recordGateVerdict`; STD-GATE §3 r7) |
| AX-08 | A verdict is insufficient alone: every mechanical fact the phase declares in `requires` must be recorded AND passing in `state.verification[phase]` before advance. An LLM gate role cannot approve past an unrun check. | ENFORCED (`guard.js#canAdvance` over `lifecycle.js` `PHASES[].requires`; STD-GATE §3 r8) |
| AX-17 | A project routes only on a Surveyor-produced ICR whose `qualityVerdict` is `SUFFICIENT`, over a non-empty input set. Absent or `INSUFFICIENT` quality blocks routing (`rome-start` no longer fabricates the verdict). | ENFORCED (`routing.js#routeFromICR`; PROP-047). Routing-time, not gate-time. |
| AX-18 | An Input the sponsor marked shaky (`PROPOSED` / `RECONSTRUCTED` / `UNDEFINED`) routes into requirements only with `sponsorAuthorized: true`. | ENFORCED (`routing.js#routeFromICR`; PROP-047). The sponsor's own reliability call, surfaced not overridden. |
| AX-19 | Adding an Increment preserves every prior Increment's gate ledger, traceability, and audit — append-only, never overwrite; a sealed Increment's records are immutable. | ENFORCED (`state.js#sealActive`/`beginIncrement` append-only by construction; `guard.js#recordGateVerdict`/`canAdvance` refuse sealed increments; PROP-048) |
| AX-20 | Whole-project requirement coverage is the union across all Increments — one shared traceability store, edges tagged by producing increment. | CHECKED (`verification.js#checkTraceability` over the shared store; PROP-048) |
| AX-21 | A Project has no terminal state: `isComplete` is per-Increment, and a new Increment may always begin once the prior is sealed. | ENFORCED (`guard.js#isComplete`, `state.js#beginIncrement`; PROP-048) |
| AX-22 | On a staged project, no requirement depends on a requirement in a later Stage. WARN at intake (judgement); STRICT at P2 (`stageConsistency` required fact over the mechanical requirement graph). | ENFORCED (`verification.js#checkStageConsistency` + `guard.js#canAdvance` P2 requires; PROP-049) |
| AX-23 | No Stage presumes a Core Subsystem that no same-or-earlier Stage provides or stubs, absent recorded sponsor authorization. | ENFORCED (`routing.js#validateStagePlan`; PROP-049) |
| AX-24 | Every Stub is sponsor-declared with an `implementBy` Stage; an ACTIVE stub past due blocks the P5 delivery edge — no silent stubs. | ENFORCED (`guard.js#canAdvance` over `state.stubs[]`; `verification.js#checkStubs`; PROP-049) |
| AX-26 | A project with a ui capability does not pass GATE-P3 without produced design assets (design system + user flows); "optional if requested" does not apply to ui-app projects. Non-UI projects pass trivially. | ENFORCED (`verification.js#checkDesignAssets` as required P3 fact via `guard.js#canAdvance`; D5 fix) |
| AX-27 | On a routing that includes the sponsor P3/P4 checkpoint (default-on), GATE-P3/GATE-P4 do not pass without a recorded sponsor response (CONFIRM/DELEGATE, or resolved REDIRECT) bound to the current AIB revision; DELEGATE never auto-extends across phases. Omitting the checkpoint requires recorded sponsor authorization. | ENFORCED (`verification.js#checkSponsorAib` as required `sponsorArch`/`sponsorInfra` facts via `guard.js#canAdvance`; `routing.js#routeFromICR` omission guard; PROP-051) |
| AX-28 | Any intentional divergence between the configured production environment and the delivered runtime/dev default is declared (`devRuntimeDiffers` required manifest field + note); an undeclared divergence is a P5 blocker. | CHECKED (`verification.js#checkEnvDivergence`; failing check filed as a blocker per AX-05; PROP-051) |
| AX-29 | An APPROVED TDR from a Reliable spec input binds its `binds` phases: GATE-P3/P4/P5 do not pass while any binding TDR is uncited and undeviated, or has an OPEN deviation, in the produced artifacts — absent a sponsor-approved deviation. Citation-level, not semantic proof. | ENFORCED (`verification.js#checkTdrConformance` as required `tdrConformance` fact via `guard.js#canAdvance`; PROP-052) |
| AX-30 | TDR authority never exceeds carrier reliability (APPROVED in a non-Reliable input → PROPOSED at extraction), and only the sponsor resolves a deviation from an APPROVED TDR. | ENFORCED (`intake.js#applyCarrierReliability` at extraction; `guard.js#resolveTdrDeviation` refuses non-sponsor resolution; PROP-052) |
| AX-31 | A Change routes only on a trace-verified classification: the declared Change Type is checked against the trace (blast radius computed, `verified:true`), reclassified if contradicted, and sponsor-confirmed before any change-scoped run begins. A guess is not a classification. | ENFORCED (`routing.js#routeChange` refuses an unverified blast radius; `state.js#classifyChange`/`#beginChange` refuse unverified/unconfirmed entries; PROP-054) |
| AX-32 | Every Change path, however light, ends at a guard-evidenced gate with trace records updated — urgency is a flag, never a licence to skip the record. Change-scoped runs reuse the increment container, so gate/seal machinery applies unchanged. | ENFORCED (change-scoped runs carry full phase `requires` via `guard.js#canAdvance`; `state.js#sealActive` delivers the queue entry only on seal; PROP-054) |
| AX-33 | Agent output addressed to the sponsor is simple structured English — no framework jargon or internal identifiers unless the sponsor introduced them (one parenthetical reference allowed where the sponsor needs it). Sponsor questions/approvals are asked with one voice (Roma); any sub-agent may display content directly. | ASSERTED (register is prose, not mechanically checkable; Roma review obligation per orchestrator.md; Seez-set inheritance checked by fidelity; PROP-054) |
| AX-34 | Every project state declares its `conventionLevel` (= framework version at last build/upgrade). An engine refuses artifacts above its version; below its version it runs in compatibility read mode — no gating against post-level rules, no new work until the level is raised by migration. No mixed-level increments. | ENFORCED (`state.js#createState`/`#load` declare/default the level; `rome-upgrade.cjs` refuses newer-than-target and raises the level only through the ladder; PROP-055) |
| AX-35 | No unreachable version: a release that changes artifact conventions or state semantics ships its migration step (transforms/gaps/semantics + postconditions) in the same release; convention-neutral releases declare a no-op boundary. The upgrade ladder refuses any boundary without a step — never guesses. | ENFORCED (`rome-upgrade.cjs#composeLadder` refuses holes; fidelity boundary-coverage check; PROP-055) |
| AX-36 | The TDR register never shrinks silently: intake input with no `tdrs` key leaves it unchanged; a replacement that drops ids is refused unless `clearTdrs:true`, and any accepted reduction audits every lost id. A register that was ever populated and is now empty fails `tdrConformance` — "nothing to check" is a failure, not conformance. Deviation ids are minted from a persisted monotonic counter, never from list length. | ENFORCED (`state.js#finalizeIntake` shrink refusal + `TDR_REGISTER_REDUCED` audit; `verification.js#checkTdrConformance` empty-after-populated failure; `guard.js#recordTdrDeviation` seq ids; PROP-056) |
| AX-37 | A deviation strips a TDR's authority only within its declared scope: scoped sponsor approval records a carve-out and the TDR remains APPROVED and binding for every other scope; only an unscoped (whole-TDR) approval supersedes it. A fully superseded TDR refuses further deviations; an already-carved scope refuses re-deviation. | ENFORCED (`guard.js#recordTdrDeviation`/`#resolveTdrDeviation` scope handling; `verification.js#checkTdrConformance` counts only unscoped approvals as exemption; PROP-056) |

> **AX-06 — skipping vs reordering.** These are not the same invariant and the framework treats them differently. `resolveRouting` rejects any routing whose phases are out of canonical relative order, but accepts any *subset*: a routing that omits an optional phase is valid, by design (intent routing, PROP-036). "Phases cannot be skipped" is therefore **false** as a framework guarantee and must not be stated as one. What holds is: order is fixed, membership is chosen once at routing time, and thereafter no phase in the routing may be jumped.

**AX-08 — required facts by phase.** ROME-STD-GATE §3 documents this table; `lifecycle.js` (`PHASES[].requires`) is authoritative.

| Phase | Required mechanical facts |
|-------|---------------------------|
| P0 / P0.5 | — |
| P1 | `aordl`, `traceability` |
| P2 | `traceability`, `sponsorOq`, `stageConsistency` |
| P3 | `traceability`, `matrix`, `designAssets`, `sponsorArch`, `tdrConformance` |
| P3.5 | `traceability`, `matrix` |
| P4 | `secrets`, `traceability`, `sponsorInfra`, `tdrConformance` |
| P5 | `executability`, `integration`, `testAdequacy`, `secrets`, `contracts`, `traceability`, `matrix`, `tdrConformance` |

### Tier 2 — CHECKED

| ID | Axiom | Provenance |
|----|-------|------------|
| AX-09 | Every Document has exactly one UID, stable across revisions, resolvable in the UID registry. | CHECKED (fidelity check 1 + 2) |
| AX-10 | Every generated Artifact traces to ≥1 Requirement; at P5 every in-scope Requirement traces to code AND test. | CHECKED (`verification.js#checkTraceability`) — promotes to ENFORCED at a gate via AX-08 |
| AX-11 | Every axiom's cited enforcement module and function exists, and every ENFORCED axiom retains a tagged violation test. | CHECKED (fidelity check 6) |
| AX-12 | Every Instance fills exactly one Role for its lifetime; roles do not blend within an instance. | CHECKED (`axioms.js#checkOneRolePerInstance`) |
| AX-13 | Separation of duties at Role level: a producing Role does not also hold gate authority in the same phase. | CHECKED (`axioms.js#checkSeparationOfDuties`); gate-verdict portion also ENFORCED via AX-03 |
| AX-14 | Every Instance is spawned by the Orchestrator; no instance spawns peers. | CHECKED (`axioms.js#checkOrchestratorSpawns` over `dispatch[].spawnedBy`) |
| AX-15 | P5 introduces no requirement absent upstream: every requirement on a P5 code edge (`implements`\|`enforces`, per `CODE_SATISFIES`) appears on an upstream (P0–P4) edge. | CHECKED (`axioms.js#checkP5NoNewRequirements`); contract-drift portion also ENFORCED via AX-08 `contracts` |
| AX-16 | No silent recovery (EP-4): a phase does not complete over a non-terminal blocker, and every blocker is in a recorded lifecycle state. | CHECKED (`axioms.js#checkNoSilentRecovery`) |

**Scope of AX-13..16 (honest limits).** AX-13 binds at Role level (sponsor decision, PROP-044 OQ-2), not instance level. AX-14's spawner is `dispatch[].spawnedBy`, stamped by `recordDispatch` — it catches a dispatch constructed with a non-orchestrator spawner, not an out-of-band spawn that never calls `recordDispatch`. AX-16 covers the blocker lifecycle; uniform retry/escalation *audit-event* coverage is a later extension. None of AX-12..16 is ENFORCED — the guard does not refuse advance on their basis (AX-16 target = CHECKED, PROP-044 OQ-1). Surfaced by `guard-cli.cjs axioms`.

### Tier 3 — ASSERTED (enforcement backlog)

*Empty as of PROP-044.* All previously-asserted axioms (AX-12..16) are now CHECKED. New invariants added here in future must state their provenance tier explicitly.

---

## 4. Sub-Document ID Patterns

`ROME-ENT-##`, `ROME-REL-##`, and `ROME-AX-##` are sub-document identifiers scoped to ROME-ONT-001. They are **not** standalone registry entries and take no UID of their own. Cite them as `ROME-AX-06`.

---

## Revision Log

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 1.7 | 2026-07-28T00:00:00Z | PROP-056 implemented (v3.3.1). Added AX-36 TDR register integrity — no silent shrink, empty-after-populated fails conformance, monotonic DEV ids (ENFORCED) and AX-37 scope-bounded deviation authority — carve-outs, whole-TDR supersession only when unscoped (ENFORCED). Tagged violation tests in `tdr-integrity.test.cjs`. Field defect source: frob-admin-Bacon (ROME-DEFECT-001). |
| 1.6 | 2026-07-27T00:00:00Z | PROP-054/055 implemented (v3.3.0). Added AX-31..35: AX-31 trace-verified change classification (ENFORCED via `routeChange`/`classifyChange`/`beginChange` refusals), AX-32 no untraced delivery — every change path ends at a guard-evidenced gate (ENFORCED via change-scoped increments), AX-33 sponsor register + one-voice questions (ASSERTED; Seez inheritance fidelity-checked), AX-34 declared conventionLevel + compatibility read mode (ENFORCED), AX-35 no unreachable version — per-boundary migration steps, ladder refuses holes (ENFORCED). Tagged violation tests in `changes-upgrade.test.cjs`. |
| 1.6 | 2026-07-17T00:00:00Z | v3.2.1 consistency pass (post-implementation review): AX-08 table P2 row corrected (+`stageConsistency` — was self-contradicting AX-22; lifecycle.js was always right). |
| 1.5 | 2026-07-17T00:00:00Z | PROP-051/052 implemented (v3.2.0). Added ENT-20 (TDR), REL-22..24, and AX-27..30: AX-27 sponsor P3/P4 checkpoint (ENFORCED via `sponsorArch`/`sponsorInfra` facts + routing omission guard), AX-28 declared dev/prod divergence (CHECKED, required `devRuntimeDiffers` manifest field), AX-29 TDR conformance (ENFORCED via `tdrConformance` fact at P3/P4/P5), AX-30 carrier reliability + sponsor-only deviation (ENFORCED). AX-25 remains reserved by PROP-050 (Draft) — numbering deliberately skips it. AX-08 fact table updated. Tagged violation tests in `sponsor-tdr.test.cjs`; check 6b extended. |
| 1.4 | 2026-07-17T00:00:00Z | v3.1.0 (D5 fix): AX-26 — design assets required at P3 for ui-app projects (ENFORCED, tagged test). AX-25 remains reserved by PROP-050 (Draft). AX-08 fact table updated (P3 += designAssets). |
| 1.3 | 2026-07-17T00:00:00Z | PROP-048/049 implemented (v3.0.0). Added ENT-15..19 (Increment, Project, Stage, Core Subsystem, Stub), REL-14..21, and AX-19..24: AX-19 append-only preservation, AX-20 union coverage (CHECKED), AX-21 no terminal project, AX-22 stage dependency-consistency, AX-23 no dangling presumption, AX-24 no silent stubs. All ENFORCED axioms carry tagged violation tests (increments.test.cjs); check 6b extended. |
| 1.2 | 2026-07-16T00:00:00Z | PROP-047 implemented (v2.8.0). Added ENT-13 (Input), ENT-14 (ICR); REL-11 (Surveyor characterizes Input→ICR), REL-12 (Orchestrator routes-from ICR), REL-13 (Sponsor declares-reliability-of Input); AX-17 (route only on SUFFICIENT ICR over non-empty inputs — converts routing.js's dead guard to a live invariant) and AX-18 (shaky inputs route only with sponsor authorization), both ENFORCED via `routing.js#routeFromICR`, both with tagged tests. Check 6b extended to cover routing-time ENFORCED axioms. |
| 1.1 | 2026-07-16T00:00:00Z | PROP-044 implemented (v2.5.0). ASSERTED tier emptied: AX-12..16 promoted to CHECKED via `axioms.js` (AX-13 role-level per OQ-2; AX-16 CHECKED per OQ-1). AX-11 deepened — check 6 now also asserts each ENFORCED axiom keeps a tagged violation test in `tests/axioms.test.cjs` (behavioural provenance, PROP-044 Part A). Scope limits stated inline. |
| 1.0 | 2026-07-15T00:00:00Z | Initial issue per ROME-PROP-043. Entity set (12), relation set (10), axiom set (16) across three provenance tiers. Corrections applied during implementation against verified code: AX-06 restated (the guard enforces one-step-along-routing and rejects reordering, but permits omission of optional phases — the drafted "phases cannot be skipped" was not a guarantee the framework makes); provenance cites STD-GATE §3 rule numbers + `<module>.js#<function>` rather than guard.js line IDs, which do not exist and whose nearest numbering conflicts with the standard's; AX-08 fact table taken from `lifecycle.js` per ROME-STD-GATE v1.1. Added AX-11 (provenance existence, fidelity check 6) — drafted axiom count 15 → 16 with renumbering below AX-10. |
