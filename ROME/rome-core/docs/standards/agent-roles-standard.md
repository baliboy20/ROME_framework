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
`modes/`, `skills/`) is interpreted through this standard. PROP-059 (2026-09-22)
removed the pre-cutover logging and hand-off instructions that had remained in
the role docs under a superseded banner.

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
(audit), `Seez` (sponsor), and `Mermaid` (visualization). **Every spawned
sub-agent inherits this set** (PROP-054 Part C) — declared in each ROBOT.md,
checked by fidelity 7a.

### 2.1 Sponsor communication (PROP-054 / ROME-AX-33)

- **Register.** All output addressed to the sponsor is simple structured
  English: short sentences, everyday words, no framework jargon or internal
  identifiers (phase codes, axiom numbers, UIDs, role names) unless the
  sponsor introduced them; one parenthetical reference is allowed where the
  sponsor needs it to find an artifact. Agent-to-agent and audit output stays
  terse/LLM-optimized.
- **Hybrid channel split.** Any sub-agent may DISPLAY content to the sponsor
  directly via Seez (documents, charts, prototypes, gate summaries).
  QUESTIONS and approvals are asked with one voice: sub-agents surface them
  through the structured-return contract (§4); Roma phrases and asks
  (Seez `ask_questions`), enforcing the register in one place.

## 3. Role catalog & ownership (responsibility matrix)

| Role | Kind | Phase(s) | Capability (PROP-038) | Model tier |
|------|------|----------|------------------------|-------------------|
| Roma | orchestrator | ALL | drives lifecycle (does not produce/approve) | `opus` (session model) |
| Bootstrap | producer | P0 | scaffold | `haiku` |
| Surveyor | producer | P0.5 | input characterization / as-is derivation (PROP-036) | `sonnet` |
| Talib | producer | P1, P2 | requirements, analysis | `sonnet` |
| PMA | producer | P3 | design, contracts | `opus` |
| Clara | validator | P3 | design-domain validation (advises; no gate authority) | `sonnet` |
| Lucien | producer | P4 | config, secrets-as-config | `sonnet` |
| Ashok / Reena / Charlie | producer (capability instances) | P5 | `generate-schema` / `generate-service` / `generate-ui` (+ shared-lib, integration) | `sonnet` (`opus` for a component Roma marks difficult) |
| Sarah | gate authority | all gates | issues APPROVE/BLOCK; the only role the guard accepts a verdict from | `opus` |

**Separation of duties (EP-5):** producer ≠ validator ≠ gate authority. The guard
makes self-approval structurally impossible.

### Model-selection principle

Put the strongest model where **judgment is irreversible or high-leverage**
(orchestrator, gate, architecture); use a cheaper model where output is
**mechanically checked** (P5 codegen → caught by the executability / contracts /
secrets gates) or **low-stakes** (intake classification, scaffolding). The
mechanical gate-preconditions (gate-decision-standard §3) are what make running
producers on Sonnet safe — the system verifies their work rather than trusting it.

- **Never weaken Roma or Sarah** — the orchestrator and the gate are the two
  load-bearing judgment roles. Tight-budget economy = Opus only on those two,
  Sonnet everywhere else.
- **Cost concentrates in P5** (many concurrent instances × self-heal retries) —
  hence Sonnet there, bounded by `budget.js`.
- The deterministic core (guard, state machine, validators, executability,
  topology, etc.) uses **no model** — it is plain Node.
- These are **starting defaults, not measured tunings**: downshift any role that
  proves reliable, upshift any that produces weak output. Override per project /
  per sub-agent (the Agent tool / subagent definitions support a per-agent model).
- Tiers are Claude Code model aliases (`opus`, `sonnet`, `haiku`); the standard
  names no model version. The machine source is
  `rome-core/orchestrator/model-tiers.json`, read by `loadRoleSpec` and passed by
  Roma at dispatch; this table mirrors it (fidelity 8b/8c). `fable` may replace
  `opus` by sponsor decision (PROP-059 §5.1: declined for v3.5.1 because its
  safety classifiers can refuse benign security work in P4/P5 and at gates).
- Effort is not settable per sub-agent through the Agent tool. Run the Roma
  session at `high`; revisit if per-agent effort becomes available.

## 3b. Skills vs Expert packs (no duplication)

- **Skill** = an *action* a role performs (verb): e.g. `generate-ui-screens`, `design-data-dictionary`. Lives in `agents/<role>/skills/`; invoked as the role's tool.
- **Expert pack** = domain *knowledge/standards* (patterns, approved libraries, anti-patterns). Lives in `Experts/<pack>/`; **injected** into a sub-agent by `experts.js` (by capability/stack) and its `enforce` rules become gate criteria.
- Rule: knowledge belongs in an expert pack, never duplicated as a skill. (E.g. Flutter patterns/standards live in `expert_flutter`, not as charlie skills; charlie keeps only the action skills `generate-ui-*` + an `expertPacks` reference.)

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

`agents/roma/` was rewritten to v5.0 (orchestrator) under PROP-035. The
producer mode docs kept their pre-cutover "log phase start/complete" and
robot-to-robot hand-off steps under a superseded banner until PROP-059 removed
them (2026-09-22). Every sub-agent prompt now ends with the shared operating
rules (`rome-core/orchestrator/prompts/operating-rules.md`, appended by
`loadRoleSpec`) and the return contract. A role doc that still tells a producer
to log coordination events or to notify another role is a defect.

---


## Annotation duty (PROP-058 / AX-42)

Every producer that writes or edits a source or test file writes the requirement id(s) it satisfies in a comment in that file, in any comment form (`// REQ-BO06`, `/// CHG-044 (REQ-CNA03)`, `# REQ-NOTIF11`). The framework derives code/test traceability by scanning for these; a return that declares `implements`, `enforces` or `validates` edges is rejected. `documents` edges are still returned for design artifacts and may not cite the producer's own artifact.

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial standard — reframes agents as sub-agent roles/capabilities under the single-session model; role catalog + responsibility matrix + return contract; retires the session/switch notion without rewriting each ROBOT.md. |
| 1.1 | 2026-06-19 | Added recommended-model column + model-selection principle (Opus on Roma/Sarah/PMA; Sonnet producers; Haiku intake/scaffold). |
| 1.3 | 2026-09-22 | PROP-059: model column by tier alias (`model-tiers.json`, passed at dispatch); shared operating rules appended to every sub-agent prompt; §5 rewritten (pre-cutover logging removed from role docs); intro no longer claims role content unchanged. |
| 1.2 | 2026-07-27 | PROP-054 Part C: consolidated MCP set inherited by every sub-agent (fidelity 7a); §2.1 sponsor communication — plain-English register (ROME-AX-33) + hybrid channel split (display direct via Seez, questions one-voice through Roma). |
