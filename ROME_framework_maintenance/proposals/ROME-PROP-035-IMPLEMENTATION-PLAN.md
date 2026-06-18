# ROME-PROP-035..040 — Plan of Action (Implementation)

| Field | Value |
|-------|-------|
| **UID** | ROME-PLAN-035 |
| **Title** | Implementation plan of action for the sub-agent orchestration re-architecture |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-06-18T00:00:00Z |
| **Implements** | ROME-PROP-035 (v1.2), 036, 037, 038, 039, 040 |
| **Depends on** | ROME-PROP-034 (phase-plugin consolidation), ROME-REV-006 (migration impact analysis) |
| **Branch** | `rearchitecture/prop-035-subagent-orchestration` |

---

## Guiding principles for the rollout

1. **Strangler pattern, not big-bang.** Old (session-switch) and new (orchestrator) coexist until each phase is proven; convert one vertical slice at a time.
2. **Guard before teardown.** The deterministic enforcement guard (035 §3.5) must exist and be proven *before* any log-enforcement hook is removed — never a window with zero enforcement (REV-006 risk #1).
3. **Prove on fixtures.** Every milestone is validated end-to-end against the existing test projects (`testapps/taskflow`, `testapps/pinnote`, `test-project-to-validate-framework-v1`) before moving on.
4. **Mechanical checks first.** Wherever a deterministic check exists (AORDL validate, build/test), wire it in early — it is the accuracy backbone (035 §3.5.3).

---

## Stage 0 — Decisions & safe pre-work (no behavior change)

**Objective:** unblock everything; do the reversible groundwork.

**0.1 DECIDE points (REV-006 §5) — CONFIRMED 2026-06-18 by sponsor:**
- **D1 — CONFIRMED:** migrate to **native skills**; retire custom `SkillInvoker`/`SkillRegistry` (verify no live dependency via grep before deletion).
- **D2 — CONFIRMED:** **`state.json` = source of truth**; activity-log = immutable audit copy; `state-builder.js` → audit verifier.
- **D3 — CONFIRMED:** one **consolidated (union) MCP set** for the orchestrator session, validated by `validate-mcp-dependencies.cjs`.
- **D4 — CONFIRMED:** **land PROP-034 first**, then remove phase-plugin shells.

**0.2 Safe removals (independent of migration):**
- Remove the broken `ROME_architect/addmcp.sh` symlink.

**0.3 Reference audits (grep before any later deletion):**
- `grep -rn "SkillInvoker\|SkillRegistry"` — map consumers (D1).
- `grep -rn "ActivityLogCoordinator"` — confirm only p5-hybrid uses it.
- Inventory every MCP server across the 10 `add-mcps-v4.sh` + `.mcp.json` files → build the union set (D3).

**0.4 Test harness:** define a repeatable "run a fixture through the lifecycle" script + an observation sheet (model on `testapps/*/_test-framework/`). This is the regression oracle for all later stages.

**Exit:** decisions recorded; symlink gone; reference map + MCP union set produced; harness runnable against the *current* framework (baseline).

---

## Stage 1 (M0) — Land PROP-034: standards extraction

**Objective:** give shared specs a neutral home so robots-as-sub-agents can consume them without phase plugins.

**Tasks:** execute PROP-034 — create `rome-core/docs/standards/` (AORDL standard, traceability format, gate-decision format, contract/security stubs); migrate operational content from phase plugins into owning robots' `modes/`/`procedures/`.

**Validate:** existing flow still runs against fixtures (no regression); standards docs resolve.

**Exit:** phase-plugin *content* lives in standards + robot modes; phase-plugin shells remain only as removable hooks.

---

## Stage 2 (M1) — Orchestrator skeleton + guard + state (the new runtime core)

**Objective:** build the spine of the new model. No phase converted yet.

**2.1 `state.json`** schema + read/write lib (035 §6a): phase status, dispatch records, gate ledger, blockers, traceability index pointer, budget counters (040 D).

**2.2 Deterministic guard** (035 §3.5) — the single most important new code: a hook/script over `state.json` writes that refuses phase-advance without a matching APPROVE record from the designated gate role; refuses entry when entry criteria unmet; rejects gate-skipping. *Build and unit-test in isolation.*

**2.3 Orchestrator (Roma) skeleton** — EDIT `roma/ROBOT.md` + `modes/orchestrator.md` into the active driver: phase state machine, sub-agent dispatch, fan-out/join, gate invocation. Drives only; the guard enforces.

**2.4 Sub-agent definition format** — define how a robot folder (`ROBOT.md`+`modes/`+`skills/`) is loaded as a sub-agent with scoped tools and a **structured return** schema (artifacts + summary + traceability deltas).

**Validate:** orchestrator can dispatch a trivial sub-agent and the guard correctly blocks an unauthorized advance (unit + one fixture dry-run). Old hooks still running in parallel.

**Exit:** runnable orchestrator + enforced state machine; nothing removed yet.

---

## Stage 3 (M2) — Prove on P3 (first real vertical slice)

**Objective:** convert one phase end-to-end to validate the whole pattern (separation of duties, gate enforcement, traceability).

**Tasks:**
- Convert P3: orchestrator calls **PMA** (produce architecture/API/data-dictionary) → **Clara** (domain validation) → **Sarah** (gate verdict) → guard enforces advance.
- Wire the mechanical upstream check available here: design artifacts validated; Clara/Sarah returns structured.
- Record traceability deltas into the index; emit audit-log entries centrally from returns.

**Validate (on fixtures):** P3 runs orchestrator-driven; a deliberately-bad design is BLOCKED by the guard (not just by model goodwill); traceability index updates; `state.json` reflects reality; resume works mid-phase. Remove P3's old SessionStart hook **after** the guard is proven for it.

**Exit:** one phase fully on the new model; EP-1/EP-3/EP-5 demonstrated mechanically. This is the go/no-go checkpoint for the whole re-architecture.

---

## Stage 4 (M3) — Parallel P5: topology, executability, resilience

**Objective:** deliver the highest-value capabilities — real parallelism and verified output.

**4.1 Topology (038):** PMA emits `component-graph.yaml` at P3; Clara validates (no cycles, every node→capability). Redefine generation roles as **capabilities instanced per component**; persona names become aliases.

**4.2 DAG fan-out (038 + 035 §3.5.2):** orchestrator topo-sorts and fans out concurrent sub-agents; append-only per-return work; worktree isolation only where paths conflict (035 §6c).

**4.3 Contracts (039 C):** contracts derived at P3; components generated against them; drift detection at GATE-P5.

**4.4 Executability + self-heal (039 A):** install/build/test per component → diagnostics → producer fix loop (bounded); **executability becomes a blocking GATE-P5 criterion**; verification records + "verified coverage" metric.

**4.5 Failure policy (039 B):** retry/timeout/escalate/isolate/partial-rollback; no silent recovery.

**Validate (on fixtures):** a multi-component fixture generates in parallel, builds, and passes its tests; an injected build error triggers self-heal; a contract mismatch is BLOCKED; one component failing isolates without aborting the run. **Now remove** `switch-robot.sh`, `init-workspace.sh`, `auto-parallel-generate-mcp.js`, `rome-p5-parallel-generate.sh`, `ROME_tools/orchestrators/p5-hybrid/`, `ActivityLogCoordinator.js`.

**Exit:** P5 produces verified, integrated, running code in parallel; the P5 emulation machinery is gone.

---

## Stage 5 — Convert remaining phases + layer optional features

**Objective:** complete the lifecycle and add the elective capabilities.

**5.1 Convert P0, P1, P2, P4** to orchestrator dispatch (pattern proven in M2). Wire the **mechanical P1 check**: keep `aordl-parser/validate-aordl.js` as the deterministic STRICT gate (035 §3.5.3). Parallelize P2 sub-tasks (wide workload).
**5.2 Input characterization (036):** add the optional **P0.5** intake stage + Surveyor role + input-quality gate + intent routing (greenfield vs brownfield reverse-then-forward) as part of the unified routing model (035 §4a).
**5.3 Visualization + optional prototyping (037):** standard diagram emission per phase (Mermaid MCP); elective **P3.5** UI/UX prototype + visual-approval gate.
**5.4 Governance & knowledge (040):** budget tracking + ceiling; expert-pack manifests on `Experts/` + injection by capability/stack; security standard + GATE-P4/P5 criteria + optional security pass; incremental impact-scoped re-gen wired to the change-request flow.

**Validate:** full P0→P5 run on every fixture, greenfield and a brownfield variant; optional phases correctly skipped when disabled; budget reported; expert anti-pattern rules enforced at a gate.

**Exit:** every phase and every proposal capability live and validated.

---

## Stage 6 (M4) — Cutover & cleanup

**Objective:** remove the rest of the old model; single source of truth.

**Tasks:**
- Remove remaining phase-plugin shells (`rome-p0..p5`, `rome-qa`) + their SessionStart hooks.
- Retire log-enforcement hooks (`check-activity-log*.sh`, downgrade `reject-zero-timestamps.sh`); the guard is now the sole enforcer.
- Demote activity-log to audit (D2): `state-builder.js` → audit verifier, not live state.
- Consolidate the triplicated flutter skills into `experts/` (REV-006 §4.1); collapse `ROME_tools/` survivors into `rome-core/lib`.
- Consolidate MCP setup to the single union set (D3); retire per-robot `add-mcps-v4.sh`.

**Validate:** full fixture runs with no old machinery present; no dangling references (grep clean); MCP set validated by `validate-mcp-dependencies.cjs`.

**Exit:** only the new model remains; tree matches REV-006 §4.3 target.

---

## Stage 7 (M5) — Terminology, docs, release

**Tasks:**
- Rename concept "robot" → "agent role" (persona names as aliases); rename `robot-plugins/` → `agents/`.
- Rewrite `INSTALLATION-GUIDE.md`, `USER-GUIDE.md` around `/rome-start`; update `ROME-DATA-FLOW.md`, `PLUGIN-MANIFEST.md`, regenerate/retire `*-plugins-complete.json`.
- Update `uid-registry.md` (removed/changed UIDs); bump `VERSION` (major) + `CHANGELOG.md`.
- Move PROP-035..040 to `implemented-proposals/`.

**Exit:** docs match reality; version released; proposals marked implemented.

---

## Dependency map (what blocks what)

```
Stage 0 (decisions/pre-work)
   └─ Stage 1 / M0 (PROP-034 standards)
        └─ Stage 2 / M1 (orchestrator + guard + state)   ← critical foundation
             └─ Stage 3 / M2 (P3 slice)                  ← GO/NO-GO gate
                  └─ Stage 4 / M3 (P5: 038+039)          ← highest value; removes P5 emulation
                       └─ Stage 5 (remaining phases + 036/037/040)
                            └─ Stage 6 / M4 (cutover)
                                 └─ Stage 7 / M5 (rename/docs/release)
```

## Cross-cutting tracks (run alongside)
- **Testing:** the fixture harness (Stage 0.4) gates every stage; add a brownfield fixture for 036.
- **Traceability:** keep `annotate-artifact.cjs` and the AORDL parser working throughout (EP-1 must never lapse).
- **Rollback safety:** because old+new coexist until M4, any stage can fall back to the previous flow until its exit criteria pass.

## Key risks (from REV-006) and where handled
| Risk | Handled at |
|------|-----------|
| Enforcement gap window | Stage 2 builds guard before Stage 3/4 remove hooks |
| Two-source-of-truth drift | D2 (Stage 0) + Stage 6 demotion |
| Premature deletion of referenced code | Stage 0.3 reference audits |
| Stale docs mislead | Stage 7 (and stamp "superseded" as touched) |
| MCP server dropped | Stage 0.3 union set + Stage 6 validation |
| PROP-034/035 conflict | Stage 1 (034 first) |

---

## First actionable steps (this week)
1. Confirm D1–D4 (or override).
2. Remove the broken `addmcp.sh` symlink.
3. Run the three reference audits (0.3) and produce the MCP union set.
4. Build the Stage 0.4 fixture harness and capture a **baseline** run of the *current* framework.
5. Begin Stage 1 (PROP-034).

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial plan of action — 8 stages (0–7) mapped to milestones M0–M5, strangler rollout, fixture-gated validation, dependency map, risk handling, first actionable steps. |
