# ROME Orchestrator Core

| Field | Value |
|-------|-------|
| **UID** | ROME-ORCH-CORE |
| **Implements** | PROP-035 (§3.1/3.2/3.5/6a/6b), PROP-036, PROP-038, PROP-039, PROP-040 (ROME-PLAN-035 Stages 2–5) |
| **Deps** | none (pure Node + fs/child_process) |
| **Tests** | `node tests/run.cjs` (85: 20 guard + 17 subagent + 16 topology + 8 executability + 10 contracts + 14 routing/budget) |

The deterministic substrate beneath the Roma orchestrator. The orchestrator (an
LLM session) **drives**; this code **enforces and records**. Quality guarantees
hold even if the orchestrator model errs.

## Files

| File | Role |
|------|------|
| `lifecycle.js` | Canonical phase catalog + gate ownership (producer ≠ approver) + routing resolver (optional phases P0.5/P3.5 in one model). |
| `state.js` | `state.json` factory/load/save — the **source of truth** (D2). |
| `guard.js` | Pure enforcement: only-current advance, APPROVE-by-correct-role required, latest-verdict-wins, open-blocker block, ungated-verdict rejection. **Self-approval is structurally impossible.** |
| `guard-cli.cjs` | Enforcement entry point; non-zero exit = BLOCK (hook-ready). |
| `subagent.js` | Role→sub-agent spec loader (ROBOT.md+mode+skills) and the **structured-return contract** (`validateReturn`, `recordDispatch`, `processReturn`, `coverage`). |
| `topology.js` | Component-graph validation + DAG → concurrent fan-out batches (PROP-038). |
| `executability.js` | Build/verify by real execution + self-heal loop + escalation (PROP-039 A/B). |
| `contracts.js` | Inter-component contract conformance + drift detection at GATE-P5 (PROP-039 C). |
| `routing.js` | Intent-driven routing from an ICR — greenfield/brownfield, optional phases (PROP-036). |
| `budget.js` | Budget tracking + degrade-before-abort policy (PROP-040 D). |

## Operating contract (how Roma uses this)

```
1. createState(project) → state.json          (source of truth)
2. loop while not complete:
   a. spec = loadRoleSpec(role, phase)         (assemble sub-agent)
   b. recordDispatch(state, {agent,...})       (DISPATCH audit)
   c. <orchestrator invokes the sub-agent>     (LLM work — outside this lib)
   d. processReturn(state, ret)                (validate + merge + RETURN audit)
                                               (completion = return = record, §6b)
   e. <gate role sub-agent returns verdict>
   f. recordGateVerdict(state, {phase,verdict,role})  (rejects wrong role, §3.5)
   g. guard.advance(state)                     (throws unless APPROVE by correct role)
3. isComplete(state) → deliver
```

The orchestrator MUST route every transition through `guard-cli.cjs` /
`guard.advance`; it cannot mark a phase complete by narration.

## Invariants enforced (not assumed)

- A gated phase advances only on `APPROVE` by its designated gate role (EP-5: no self-approval).
- A later `BLOCK` overrides an earlier `APPROVE`.
- Phases cannot be skipped or reordered.
- Open blockers halt advance.
- Sub-agent returns must be schema-valid or they are rejected (failure policy, PROP-039 B).

## Not yet wired (later stages)

Live sub-agent invocation (Stage 3 / M2, P3 slice), topology fan-out (PROP-038),
executability/self-heal (PROP-039), budget enforcement (PROP-040). This core is
the deterministic foundation those build on.
