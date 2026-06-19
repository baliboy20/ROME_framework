# ROME User Guide (v2.0)

ROME turns requirements into a working application through a single **orchestrator
session (Roma)** that dispatches specialized **sub-agents** and enforces quality
with a deterministic **guard**. This guide is for v2.0 (single-session sub-agent
model, ROME-PROP-035..040). The old multi-session "robot" workflow has been retired.

---

## Mental model

- **Roma** = the head chef: one long-lived session that drives the whole job. It
  never writes artifacts and never approves its own work.
- **Sub-agents** = specialists Roma calls in per phase (Talib requirements, PMA
  design, Sarah quality gate, etc.). Each returns a structured result.
- **The guard** = the rule-enforcer (code, not judgment): a phase can't advance
  without an `APPROVE` from the correct gate role. Self-approval is impossible.
- **state.json** = the single source of truth (progress, gates, traceability).

## The lifecycle

```
P0 bootstrap → [P0.5 intake] → P1 requirements → P2 analysis → P3 design
            → [P3.5 prototype] → P4 config → P5 generation → delivery
```
`[...]` phases are optional and chosen automatically from your inputs:
- **P0.5 intake** runs for brownfield (changing an existing app).
- **P3.5 prototype** runs when a UI mock-up is warranted.

Every transition is gated by **Sarah**; the guard enforces it.

## Running a project

1. **Provide inputs** — put your PRD/BRD/idea (or point at an existing codebase)
   under the project's `_user_input/raw-requirements/`.
2. **Start it:**
   ```bash
   node ROME/rome-core/orchestrator/rome-start.cjs <projectDir> \
        --intent greenfield --ts "$(date -u +%FT%TZ)" [--prototype] [--budget 200000]
   ```
   This scaffolds the workspace, characterizes inputs, resolves the routing,
   creates `state.json`, and prints the **next action**.
3. **Drive** — a Claude session running as Roma (`agents/roma/`) follows the
   operating loop in `rome-core/orchestrator/README.md`: dispatch the phase owner,
   process its return, request the gate verdict, advance via the guard.
4. **Answer questions** — when a sub-agent needs a decision, it surfaces a
   clarification (sponsor input). Bad/insufficient inputs are refused, not guessed.
5. **Delivery** — when all phases are COMPLETE with APPROVE gates and the code is
   verified (it builds and its tests pass), the project is done.

## What you get

- Working code with **full traceability** (requirement → code → test).
- **Verified** output — generation includes a real build/test gate (PROP-039).
- A complete **audit trail** and per-requirement **coverage** metric.

## Key guarantees

- **Quality is enforced, not assumed** — gates are mechanical where possible
  (AORDL validation at P1, executability + no-secrets + contract-drift at P4/P5).
- **Separation of duties** — producer ≠ validator ≠ gate authority.
- **It runs** — P5 doesn't pass until the generated code actually builds and tests pass.

## Reference

- Operating loop & modules: `ROME/rome-core/orchestrator/README.md`
- Standards: `ROME/rome-core/docs/standards/` (aordl, agent-roles, traceability, gate-decision, security)
- Agent roles: `ROME/agents/`
