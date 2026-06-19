# ROME-PROP-039: Executability, Resilience & Inter-Component Contracts

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-039 |
| **Title** | Proving Generated Software Runs — Build/Verify/Self-Heal, Orchestration Failure Policy, and Inter-Component Contract Management |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-06-18T00:00:00Z |
| **Targets** | ROME phase model (P5 generation, GATE-P5), orchestrator, `ARTIFACTS/_design/` |
| **Companion to** | ROME-PROP-035 (single-session orchestration), ROME-PROP-038 (topology-driven capability instancing) |
| **Relates to** | ROME-PROP-029 (P5 completion enforcement), ROME-PROP-026 (change-compliance-completeness) |

---

## Executive Summary

ROME-PROP-035..038 define **how generation work is structured**. This proposal addresses **whether the output is real software** — the gap between "generates plausible, fully-traceable code" and "delivers working software." It covers the three Tier-1 concerns:

- **A. Executability (Build/Verify/Self-Heal).** ROME proves traceability (requirement → code) but never proves the code compiles, runs, or passes its own tests. The exit criterion "application runs end-to-end" has no mechanism behind it. This adds a generate → build → test → diagnose → fix loop.
- **B. Orchestration Failure Policy.** The orchestrator has no defined behavior when a sub-agent fails, hangs, loops, or returns garbage — or when one component fails mid-fan-out while others succeed. This defines retry, escalation, isolation, and partial-rollback policy.
- **C. Inter-Component Contracts.** PROP-038 introduced multiple services/UIs, creating a problem it does not solve: API/type contracts between components must stay consistent. This adds contract-first generation and drift detection.

Together these turn ROME from a *traceable code generator* into a *deliverer of verified, running software*.

---

## Part A — Executability: Build / Verify / Self-Heal

### A.1 Problem

Sarah's gates verify artifacts exist and trace correctly. Nothing executes the toolchain. The framework can deliver code with **perfect traceability and zero executability** — the most dangerous failure mode, because every audit signal is green.

### A.2 Solution — the self-heal loop

After P5 generation (per component and at integration), the orchestrator runs the **real toolchain** and feeds failures back to the producing sub-agent:

```
For each buildable unit (component, then integrated system):
  1. INSTALL   dependencies
  2. BUILD     compile / typecheck
  3. TEST      run the unit's own generated tests
  4. If all pass → mark unit VERIFIED
  5. If fail → capture diagnostics (errors, stack traces, failing tests)
              → return to the producing sub-agent with diagnostics
              → sub-agent fixes → re-run from step 2
  6. Bounded by max_heal_iterations; on exhaustion → escalate (Part B)
```

The producing sub-agent receives **structured diagnostics**, not "it failed" — exact compiler/test output scoped to its component.

### A.3 Executability becomes a gate criterion (EP-3)

GATE-P5 is extended: a unit cannot be APPROVED unless `VERIFIED` (builds + its tests pass). This makes "the application runs" an **enforced** exit criterion, not an aspiration. Sarah validates the verification record, not the developer's claim.

### A.4 Verification record (traceability, EP-1)

Each unit's build/test result is recorded: `ARTIFACTS/_verification/<component>.json` (build status, test pass/fail counts, coverage, heal iterations used). Progress coverage (PROP-035 §6a) now includes **verified** coverage: % of requirements traced to code that *demonstrably runs*.

### A.5 Test adequacy

Self-heal against trivially-passing tests is meaningless. Gate criteria include minimum test adequacy (coverage threshold + presence of negative/edge cases), validated by Sarah — preventing "passes because it tests nothing."

---

## Part B — Orchestration Failure Policy

### B.1 Problem

PROP-035 §6a covers resume-from-state, but not in-run failure: a sub-agent that fails, hangs, loops, or returns garbage; partial failure mid-fan-out (e.g. 6 of 7 components succeed, one crashes); when to retry vs. escalate vs. abort. Failure behavior is currently undefined.

### B.2 Failure taxonomy

| Failure | Detection | Default policy |
|---------|-----------|----------------|
| Sub-agent error/crash | non-return / error result | retry up to N with same inputs |
| Hang / no progress | timeout | abort instance, retry once, then escalate |
| Loop (no convergence) | heal iterations exhausted (Part A) | escalate to sponsor with diagnostics |
| Garbage / schema-invalid return | structured-return validation fails | reject, retry with corrective prompt |
| Quality-gate BLOCK | Sarah verdict | loop back to producer (existing) |

### B.3 Partial-failure handling (fan-out)

When one component fails mid-fan-out:

- **Isolate-and-continue (default):** independent components proceed; the failed component and its dependents are quarantined, not aborted globally. The orchestrator state marks them `BLOCKED`.
- **Join with partial result:** at GATE-P5, the orchestrator reports verified / blocked components explicitly — no silent partial delivery (EP-4). A run with blocked components cannot reach DONE.

### B.4 Escalation & partial rollback

- **Escalation:** on policy exhaustion, surface to sponsor via `Seez` MCP with full diagnostics and options (provide guidance / change requirement / accept reduced scope / abort).
- **Rollback:** per-component isolation (PROP-035 §6c worktrees) enables reverting a single failed component without discarding verified ones. Orchestrator state + audit log record every retry/escalation/rollback (no silent recovery — EP-4).

### B.5 Configuration

`failure_policy: { max_retries, timeout, max_heal_iterations, on_exhaustion: escalate|abort, partial: isolate|abort_all }`. Defaults favor isolate-and-escalate over abort-all.

---

## Part C — Inter-Component Contracts

### C.1 Problem

PROP-038 generates multiple services and UIs in parallel. Each consumes others' interfaces (a UI calls the auth service; services share types). With independent concurrent generation, nothing guarantees the **contract** between them is consistent — the auth service's response shape and the UI's expectation can silently diverge, producing code that builds in isolation but fails on integration.

### C.2 Solution — contract-first generation

Contracts are defined **before** component fan-out and are the shared source of truth all components generate against:

1. **Derive contracts at P3 (design).** PMA produces interface contracts as design artifacts: `ARTIFACTS/_design/contracts/` — API specs (OpenAPI/GraphQL schema), shared type/data definitions, event schemas. Each contract has a stable UID and is referenced by component-graph nodes.
2. **Generate against the contract (P5).** Each component sub-agent receives the relevant contracts as a binding input — the service implements its contract; the UI consumes the same contract. The shared-lib capability (PROP-038) generates the shared types **from** the contract, so producers and consumers share one definition.
3. **Contract drift detection (GATE-P5).** The orchestrator verifies each component's generated interface matches its declared contract (e.g. generated API vs. OpenAPI spec; UI client types vs. shared types). Drift → BLOCK, return to producer.

### C.3 Contract changes during self-heal

If self-heal (Part A) or sponsor change requires a contract modification, it is changed **at the contract artifact**, then all dependent components re-verify against the new contract (ties to incremental re-generation). A component may not unilaterally diverge from a contract to make its own build pass — the orchestrator rejects local contract edits.

### C.4 Traceability (EP-1)

Contracts join the chain: `requirement → feature → contract → component(s) → code → test`. Coverage records which components satisfy each contract, so integration completeness is measurable, not assumed.

---

## Principle Alignment

| Principle | Effect |
|-----------|--------|
| EP-1 Traceability | Adds verification records + contracts to the chain; "verified" coverage metric. **Enhanced.** |
| EP-3 Quality control | Executability and contract-conformance become enforced gate criteria, not assumptions. **Enhanced.** |
| EP-4 Progress monitoring | Failures, retries, escalations, partial results all recorded; no silent recovery. **Enhanced.** |
| EP-5 Separation of duties | Orchestrator runs the toolchain; Sarah validates the record; producers fix. **Preserved.** |
| EP-7 Optimal operation | Catches non-running code and contract drift before delivery, not after. **Enhanced.** |

---

## Migration Path

Builds on PROP-035 orchestrator and PROP-038 component graph.

- **E1** — Add the build/verify step (install/build/test) at GATE-P5 as a *reporting* check (record VERIFIED, no self-heal yet).
- **E2** — Add the self-heal loop (diagnostics → producer → re-run, bounded).
- **E3** — Make executability a *blocking* GATE-P5 criterion + test-adequacy thresholds.
- **F1** — Define the failure taxonomy + `failure_policy` config; implement retry/timeout/escalation.
- **F2** — Implement partial-failure isolation + per-component rollback.
- **C1** — Add `contracts/` design artifacts at P3; generate components against them.
- **C2** — Add contract-drift detection at GATE-P5.

E1 is non-breaking (report only). Each subsequent step tightens enforcement once proven.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Self-heal loops indefinitely | `max_heal_iterations` cap → escalate with diagnostics. |
| Toolchain unavailable / environment mismatch | P4 (Lucien) provisions the build/test environment; verification runs in it. |
| Self-heal "fixes" by weakening tests | Test-adequacy gate (A.5); Sarah validates tests weren't gutted. |
| Contract-first too rigid for exploratory work | Contracts versioned; contract change is an explicit, tracked step, not forbidden. |
| Partial delivery mistaken for complete | Blocked components block DONE; gate reports verified-vs-blocked explicitly. |
| Verification cost (build/test every heal iteration) | Per-component scoping; cap iterations; budget governance (future). |

---

## Recommendation

1. Add the **build/verify/self-heal loop** and make **executability a blocking GATE-P5 criterion** — the highest-value addition in the set.
2. Define an explicit **orchestration failure policy** (retry/timeout/escalate/isolate/rollback) with no silent recovery.
3. Adopt **contract-first generation** with drift detection so parallel components integrate correctly.
4. Sequence E1→E3 (executability) first as it delivers the most value; F* and C* follow.

---

## Open Questions for Sponsor

1. Test-adequacy threshold for the executability gate (coverage %, mandatory edge cases)? Recommend a configurable floor.
2. Default partial-failure behavior — isolate-and-continue vs. abort-all? Recommend isolate-and-continue.
3. Are contracts mandatory for all multi-component apps, or only above a node threshold? Recommend mandatory whenever ≥2 components share an interface.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial draft — Tier-1 concerns: build/verify/self-heal executability gate, orchestration failure policy (retry/escalate/isolate/rollback), and contract-first generation with drift detection. |
