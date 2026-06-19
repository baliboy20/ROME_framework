# Agent Roles Standard

| Field | Value |
|-------|-------|
| **UID** | ROME-STD-AGENT-ROLES |
| **Title** | How ROME agents are interpreted as sub-agent roles |
| **Status** | Active |
| **Created** | 2026-06-18T00:00:00Z |
| **Origin** | ROME-PROP-035 (§3.2, §4a), PROP-038; ROME-PLAN-035 Stage 5 |
| **Consumed by** | the orchestrator (`rome-core/orchestrator/subagent.js`) and every role definition under `agents/` |

Single source of truth for the agent layer under the single-session model. It
**reframes how existing `agents/` are used** — their content (`ROBOT.md`,
`modes/`, `skills/`) is unchanged; this standard governs interpretation, so the
per-robot docs do not each need rewriting.

---

## 1. Terms (binding; mirrors PROP-035 §4a)

| Term | Meaning |
|------|---------|
| **Role** (= capability) | A named specialization (system prompt + scoped skills). The *kind* of work. |
| **Instance** | One sub-agent the orchestrator spawns from a role for a unit of work. N UIs → N `generate-ui` instances. |
| **Persona name** | Human-readable alias (Roma, Talib, PMA, Clara, Lucien, Ashok, Reena, Charlie, Sarah, Bootstrap, Surveyor). Not an instance limit. |
| **Sub-agent** | A role instance with isolated context and scoped tools. NOT a separate human-driven session. |

The legacy notion of a "robot" as an independently-bootable Claude Code session
is **retired**. A robot is now a role the orchestrator instantiates.

## 2. How a role folder becomes a sub-agent

`subagent.js#loadRoleSpec(role, phase)` assembles, from `agents/<role>/`:

- **system prompt** = `ROBOT.md` (identity) + the matching `modes/<phase>*.md` (active mode) + the return contract (§4)
- **scoped skills** = the subdirectories of `skills/` (native skills per D1; the custom SkillInvoker/SkillRegistry is retired)

No `SessionStart` hooks, no `switch-robot`, no per-robot MCP setup. The
orchestrator session holds one consolidated MCP set (D3): `activity-log-file`
(audit), `Seez` (sponsor), and `Mermaid` (visualization).

## 3. Role catalog & ownership (responsibility matrix)

| Role | Kind | Phase(s) | Capability (PROP-038) |
|------|------|----------|------------------------|
| Roma | orchestrator | ALL | drives lifecycle (does not produce/approve) |
| Bootstrap | producer | P0 | scaffold |
| Surveyor | producer | P0.5 | input characterization / as-is derivation (PROP-036) |
| Talib | producer | P1, P2 | requirements, analysis |
| PMA | producer | P3 | design, contracts |
| Clara | validator | P3 | design-domain validation (advises; no gate authority) |
| Lucien | producer | P4 | config, secrets-as-config |
| Ashok / Reena / Charlie | producer (capability instances) | P5 | `generate-schema` / `generate-service` / `generate-ui` (+ shared-lib, integration) |
| Sarah | gate authority | all gates | issues APPROVE/BLOCK; the only role the guard accepts a verdict from |

**Separation of duties (EP-5):** producer ≠ validator ≠ gate authority. The guard
makes self-approval structurally impossible.

## 4. The structured-return contract (§6b)

A sub-agent **finishes by returning** a validated result — returning IS its
progress record; there is no separate logging step and no silent-finish path.

```json
{ "agent": "<id>", "role": "<role>", "phase": "<phase>",
  "status": "COMPLETE|FAILED|BLOCKED",
  "summary": "<one sentence>",
  "artifacts": [{ "path": "...", "kind": "..." }],
  "traceabilityDeltas": [{ "requirement": "REQ-###", "produces": "...", "component": "<opt>" }],
  "blockers": [] }
```

`subagent.js#validateReturn` rejects malformed returns (failure policy, PROP-039 B).
`processReturn` records the return into `state.json` and merges traceability deltas.

## 5. Migration note for existing robot docs

`agents/roma/` has been rewritten to v5.0 (orchestrator). The other role
docs remain content-valid and are interpreted through this standard; any
remaining "session"/"switch"/"log-coordination" wording in them is superseded by
this document and should be treated as historical until the Stage 7 rename pass.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial standard — reframes agents as sub-agent roles/capabilities under the single-session model; role catalog + responsibility matrix + return contract; retires the session/switch notion without rewriting each ROBOT.md. |
