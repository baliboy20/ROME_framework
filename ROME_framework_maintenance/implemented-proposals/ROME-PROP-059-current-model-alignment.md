# ROME-PROP-059: Current-Model Alignment — role prompts, model routing and orchestrator rules for the Claude 5 generation

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-059 |
| **Title** | Current-Model Alignment — model tiers by alias and passed at dispatch, one shared operating-rules block for every sub-agent, delegation and pause rules for Roma, obsolete and over-emphasised prompt text removed |
| **Status** | Implemented (v3.5.1, 2026-09-22) — AC8 proof run pending |
| **Author** | Archie |
| **Created** | 2026-09-21T00:00:00Z |
| **Origin** | Framework maintenance session, 2026-09-21. Appraisal of the framework at v3.5.0 against Anthropic's published prompting guides for Claude Opus 5, Claude Fable 5, Claude Fable 5.1 and the general best-practices page (URLs in §7). |
| **Targets** | `rome-core/docs/standards/agent-roles-standard.md` (§2, §3, §5), `rome-core/orchestrator/subagent.js` (`loadRoleSpec`), new `rome-core/orchestrator/model-tiers.json`, new `rome-core/orchestrator/prompts/operating-rules.md`, `agents/roma/modes/orchestrator.md`, the mode files listed in §2.4 and §2.5, `check-framework-fidelity.sh` (new check 8), `rome-core/orchestrator/tests/subagent.test.cjs`, `rome-core/migrations/3.5.0-3.5.1/step.md`, `rome-core/VERSION`, `CHANGELOG.md` |
| **Builds On** | ROME-PROP-035 (single-session model, `loadRoleSpec`), ROME-PROP-040 Part D (`budget.js`), ROME-PROP-054 (sponsor communication, consolidated MCP set), ROME-PROP-055 (migration ladder, ROME-AX-35), ROME-STD-AGENT-ROLES |
| **Supersedes** | ROME-STD-AGENT-ROLES §5 "Migration note for existing robot docs", for the five mode files in §2.4 |

---

## In Plain Terms

ROME's agents are told what to do by instruction files. Most of those files were written for older Claude models. Anthropic has published guidance on how the newest models behave, and some of ROME's instructions now work against it.

Four things are wrong.

1. The table that says which model each agent should use names models that are no longer the latest. The same document says to always use the latest. Nothing in the code reads the table, so the orchestrator is free to ignore it.
2. Five agent files still contain old step-by-step logging instructions. A notice at the top of each file says those instructions are obsolete. The newest models follow written instructions very closely, so a file that says "you must do X first" and also says "ignore X" is a real risk.
3. The agent files use shouted words such as CRITICAL and MANDATORY to stress a point. Anthropic's guidance says current models over-react to this, and that a plain instruction with its reason works better.
4. The newest models start helper agents more readily, write longer documents, and sometimes stop to ask permission for work they were already given. ROME has no written rules for any of these.

The fix has three parts. First, name models by tier, keep the tier list in one small file, and have the code hand the right model to the orchestrator each time it starts an agent. Second, write one short block of working rules and attach it to every agent automatically, and add a few rules to the orchestrator's own file. Third, delete the obsolete instructions and rewrite the shouted ones as plain sentences with reasons.

Nothing in the guard, the gates or a project's saved state changes. Existing projects need no migration work.

---

## 1. Problem

Evidence is from the master at v3.5.0, read on 2026-09-21.

| # | Fault | Evidence |
|---|---|---|
| P1 | The recommended-model table is stale and contradicts its own rule. | `agent-roles-standard.md:62-70` names Opus 4.8, Sonnet 4.6, Haiku 4.5. Line 94: "Always use the latest model in each tier". Current lineup: Fable 5.1, Opus 5, Sonnet 5, Haiku 4.5. |
| P2 | The model table is advisory only. | `subagent.js:45-73` `loadRoleSpec` returns `{ role, systemPrompt, skills, modeFile, sourceDir }`. No `model`. `orchestrator.md` step 2b does not mention a model. Whether a sub-agent runs on the intended model depends on Roma recalling a table in a standard it is not told to read. |
| P3 | Five mode files carry instructions their own banner declares obsolete. | `talib/modes/P1-aordl.md`, `talib/modes/P2-analysis.md`, `ashok/modes/P5-generation.md`, `reena/modes/P5-generation.md`, `charlie/modes/P5-generation.md`: lines 3-12 say the "MANDATORY FIRST ACTION" and `/log-phase-*` instructions are OBSOLETE and the skills were removed (PROP-035). The same files keep "⚠️ CRITICAL: MANDATORY FIRST ACTION" (line 25), "⚠️ MANDATORY FINAL ACTIONS", and exit-criteria checklists that require the log entries. 43 references to `mcp__activity_log__*` or `/log-phase-*` across the five files. |
| P4 | Emphasis by capitalisation in role prompts. | Under `agents/`: 49 `CRITICAL`, 33 `MANDATORY`. About 22 of the `CRITICAL` are severity or priority enum values (Sarah, Roma blocker table, PMA return schema) and are correct. The remainder are emphasis. The 43 `MUST` in `rome-core/docs/standards/` are normative specification keywords and are not a fault. |
| P5 | No delegation rule for Roma. | `orchestrator.md` dispatches "the phase owner role(s)" and fans out P5 by `topoBatches`. `budget.js` reduces parallelism only inside the degrade band, and only when a ceiling is set. No text says when Roma may or may not start an agent outside the routing. |
| P6 | No completion or pause rule for any agent. | Sub-agents cannot question the sponsor (ROME-AX-33: questions go through the structured return). No text tells a sub-agent that ending a turn on a question or a stated next step stalls the phase. Roma has a failure policy but no rule on when to stop for the sponsor outside gates. |
| P7 | No length or scope rule for produced artifacts. | No file under `agents/` bounds document length or forbids unrequested additions. Every phase reads the previous phase's output, so length compounds. |
| P8 | The standard claims role content is unchanged. | `agent-roles-standard.md` §intro and §5 describe existing role docs as unchanged and merely reinterpreted. P3 is the residue of that decision. |

Guide basis for each fault is in §7.

---

## 2. Design

### 2.1 Model tiers by alias (ROME-STD-AGENT-ROLES §3)

Replace the "Recommended model" column with "Model tier". Tier names are the Claude Code model aliases, which track the current model in each family without a framework release.

| Role | Tier |
|---|---|
| Roma | `opus` (session model; set by the sponsor when opening the session) |
| Sarah, PMA | `opus` |
| Talib, Clara, Lucien, Surveyor | `sonnet` |
| Ashok / Reena / Charlie | `sonnet` (`opus` for a component Roma marks difficult) |
| Bootstrap | `haiku` |

- The "Model-selection principle" text stays. Its last bullet becomes: "Tiers are aliases; the standard names no model version. `fable` may replace `opus` per §5 decision 1."
- Effort: the Agent tool accepts a model per dispatch but no effort level. Per-role effort is therefore not settable by the framework. The standard records one line: run the Roma session at `high`; revisit if Claude Code exposes effort per sub-agent.

### 2.2 `model-tiers.json` and `loadRoleSpec`

- New `rome-core/orchestrator/model-tiers.json`: `{ "default": "sonnet", "roles": { "sarah": "opus", "pma": "opus", "bootstrap": "haiku", ... } }`. It is the machine source; the §3 table mirrors it.
- `loadRoleSpec` adds `model` to its return: `roles[role]`, else `default`. Pure file read; no new dependency.
- `recordDispatch` stores the `model` passed, so the audit shows which tier ran each dispatch.
- `orchestrator.md` step 2b: "invoke the sub-agent with `spec.systemPrompt` and `model: spec.model`. Override upward to `opus` only for a P5 component that has exhausted one self-heal cycle."

### 2.3 Shared operating rules

New `rome-core/orchestrator/prompts/operating-rules.md`. `loadRoleSpec` appends it to every system prompt, between the active mode and the return contract, under `# Operating Rules`. One source; no copy in any ROBOT.md. Text:

```text
You are a sub-agent. No person is watching you work, and you cannot ask anyone a
question mid-task. Your return to the orchestrator is the only thing anyone reads.

Finish the whole task you were dispatched for. If your last paragraph is a plan, a
question, or a statement of what you will do next, do that work now instead. If you
are blocked on something only the sponsor can decide, complete every part that does
not depend on it, then return status BLOCKED with the question in `blockers`.

Deliver what the dispatch asked for, at that scope. If you notice a defect or an
improvement outside it, report it in `summary`; do not act on it. Do not start
further sub-agents.

Match the length of each document to what the next phase needs to act on. Do not add
summary sections, restated context, or boilerplate. When changing an existing file,
edit the affected lines; do not rewrite the file.

Every claim in your `summary` must correspond to a file you wrote or a command you
ran in this dispatch. If something is unverified or was skipped, say so.
```

Rationale per paragraph: P6 (paragraphs 1-2), P5 and P7 (3), P7 (4), grounded progress claims (5). The block gives reasons and uses no capitalised emphasis, per P4.

### 2.4 Remove obsolete instructions (P3)

In the five files named in P3:

- Delete the "MODE UPDATE — superseded" banner.
- Delete the "MANDATORY FIRST ACTION" section, the "MANDATORY FINAL ACTIONS" section, and the "ACTIVITY LOG REQUIREMENTS" group in Exit Criteria.
- Delete every remaining `mcp__activity_log__append` / `mcp__activity_log__query` / `/log-phase-*` instruction addressed to the producer. The `activity-log-file` MCP stays in the consolidated set (§2 of the standard); the orchestrator writes the audit trail.
- Replace "Before Notifying Reena" style hand-offs with nothing: sequencing is Roma's (`topoBatches`), and the return contract closes the dispatch.
- `sarah/modes/QA-validator.md` "Activity Log Validation (MANDATORY)" (lines 142, 193, 252, 315, 368, 564) queries those producer entries: see §5 decision 3.

ROME-STD-AGENT-ROLES §5 is rewritten to state that role docs were corrected by this proposal, and the intro's "content is unchanged" claim is removed (P8).

### 2.5 Emphasis rewrite (P4)

Scope: every `CRITICAL`, `MANDATORY`, `⚠️` used as emphasis under `agents/`. Out of scope: severity and priority enum values; `MUST` in standards.

Rule: state the instruction plainly and give the consequence that makes it matter. Where the guard or a gate already enforces the point, name the enforcer; that is the reason.

| Before | After |
|---|---|
| `**⚠️ CRITICAL:** Sarah will BLOCK at GATE-P5 if TRACEABILITY.md files are missing.` | `GATE-P5 checks for a TRACEABILITY.md per feature; a missing file blocks the gate.` |
| `**CRITICAL:** GATE-P1 must show 100% pass rate. No exceptions.` | `GATE-P1 passes only at 100%. The guard rejects a partial pass, so fix failures rather than reporting them as accepted.` |
| `### Step 2b: Publish Implementation Proposal (MANDATORY)` | `### Step 2b: Publish Implementation Proposal` (a numbered step is already required) |
| `- CRITICAL: Data dictionary is SINGLE SOURCE OF TRUTH` | `- The data dictionary is the single source of truth: schema, DTOs and UI forms are all generated from it, so a field defined elsewhere will diverge.` |

Files: the 27 emphasis `CRITICAL` lines and the `MANDATORY` lines listed by `grep -rnwE "CRITICAL|MANDATORY" agents --include='*.md'`, minus enum lines. The return-contract string in `subagent.js:63-69` keeps its wording; `MUST` there is a contract term.

### 2.6 Roma rules (`orchestrator.md`)

Add a section "Delegation, pausing and reporting":

```text
Start a sub-agent only for a role the routing assigns to the current phase, or a P5
component node. Do not start agents to explore, to double-check a producer, or to
verify a gate: Clara and Sarah are the verification, and the guard's mechanical checks
run in Node. Work you can finish in a few tool calls, do yourself.

In P5, dispatch every node of a batch in one message so they run concurrently, and
keep processing returns as they arrive rather than waiting for the slowest.

Stop for the sponsor only at a gate that needs their approval, on budget ESCALATE, on
a blocker the failure policy escalates, or before a destructive action. Otherwise
continue to the next action from driver.nextAction(state). Do not end a turn on a
statement of what you will do next.

Before telling the sponsor a phase or gate is done, read it from state.json or the
guard's output. Report failures with the guard's message.
```

The last paragraph restates ROME-DEF-002 point 2 (no completion by narration) as an operating rule. No axiom changes.

### 2.7 Fidelity check 8 — prompt hygiene

`check-framework-fidelity.sh`, runs in `--quick`:

- 8a: no file under `agents/` matches `MANDATORY FIRST ACTION`, `/log-phase-`, or `mcp__activity_log__append`.
- 8b: `agent-roles-standard.md` §3 contains no versioned model name (`(Opus|Sonnet|Haiku|Fable) [0-9]`).
- 8c: every role directory under `agents/` resolves to a tier in `model-tiers.json` (explicit or default), and every key in `roles` is an existing directory.

### 2.8 Lexicon and ontology

- ROME-LEX-001: add **Model Tier** — "the Claude Code model alias (`opus`, `sonnet`, `haiku`, `fable`) assigned to a Role in `model-tiers.json`; resolved by `loadRoleSpec`; names no model version." Add **Operating Rules** — "the shared prompt block appended to every sub-agent system prompt by `loadRoleSpec`."
- ROME-ONT-001: relation `Role —hasModelTier→ Model Tier` (cardinality 1). No new axiom: a wrong tier degrades quality but breaks no guarantee the guard enforces.

### 2.9 Release

- v3.5.1, PATCH: no state schema change, no guard or gate change, `loadRoleSpec` return is extended not altered.
- `migrations/3.5.0-3.5.1/step.md`: no project action; recorded so the ladder stays contiguous (ROME-AX-35, fidelity 7b).

---

## 3. Interaction with the proposal set

| Proposal | Interaction |
|---|---|
| PROP-035 | Completes its cutover: removes the pre-cutover logging instructions it left in place under a banner. |
| PROP-040 Part D | Unchanged. `budget.policy` remains the cost control; §2.6 adds a prose rule beside it. |
| PROP-054 | Unchanged. Operating rules route questions through `blockers`, as ROME-AX-33 requires. Fidelity 7a (MCP set in each ROBOT.md) is unaffected; the new prompt file is outside `agents/`. |
| PROP-058 | Unchanged. The annotation duty text in `orchestrator.md` and the standard stays. |
| ROME-DEFECT-002 | Independent. If D1–D7 touch the same files, land DEFECT-002 fixes first and rebase §2.4/§2.5. |

---

## 4. Out of Scope

- Shortening role prompts beyond §2.4. The Fable 5 guide says prompts written for older models are often too prescriptive, and the role files total about 50,000 words. Cutting procedure needs before/after evidence per role; raise after AC8 produces a baseline.
- Whether P5 producers should still write `TRACEABILITY.md` files now that the matrix is scanned from source (PROP-058). No orchestrator module reads them; Sarah checks them by hand. Separate question.
- Per-role effort (§2.1). Not settable through the Agent tool.
- A send-to-user tool. Seez already displays content to the sponsor verbatim (PROP-054).
- Conversation-history rules from the Fable 5.1 guide. They bind harnesses that call the API directly; ROME runs inside Claude Code.

---

## 5. Sponsor Decisions (2026-09-22)

Decided as recommended: (1) `opus` top tier; (2) `sonnet` producers; (3) Sarah's activity-log check rewritten to read `state.json` dispatch records; (4) v3.5.1 PATCH.

| # | Question | Recommendation | Options |
|---|---|---|---|
| 1 | Top tier: `opus` or `fable`? | `opus`. Fable 5 and 5.1 run safety classifiers that can refuse benign security work; Lucien, Reena and Sarah handle secrets and auth configuration. Opus 5 has no such classifier and the Opus 5 guide rates it strong on multi-agent coordination. | (a) `opus` everywhere top-tier. (b) `fable` for Roma only, `opus` for Sarah and PMA. (c) `fable` everywhere top-tier, accept occasional fallback. |
| 2 | Producers: `sonnet`, or `fable` at low effort? | `sonnet`. The Fable 5.1 guide claims low-effort Fable is cost-competitive with Sonnet, but the framework cannot set effort per sub-agent (§2.1), so the comparison cannot be run as described. | (a) `sonnet`. (b) defer until effort is settable. |
| 3 | Sarah's "Activity Log Validation" at every gate. It requires the producer log entries that PROP-035 made obsolete. | Rewrite it to read the dispatch records. The check's purpose is to confirm the phase's producer ran and returned. `state.json` holds that fact (`dispatch[]` with status COMPLETE, written by `recordDispatch` and `processReturn`). The guard binds a verdict to Sarah's own dispatch (PROP-045) but does not check the producer's, so removing the check outright would drop the only test of it. | (a) rewrite to check `state.json` dispatch records. (b) remove. (c) keep, and restore producer logging. |
| 4 | Version: v3.5.1 PATCH or v3.6.0 MINOR? | PATCH (§2.9). | (a) PATCH. (b) MINOR, on the ground that agent behaviour changes. |

---

## 6. Acceptance Criteria

1. `model-tiers.json` exists; `loadRoleSpec('sarah','P1').model === 'opus'`, `loadRoleSpec('bootstrap','P0').model === 'haiku'`, and a role absent from `roles` returns the default. Covered in `subagent.test.cjs`.
2. `loadRoleSpec(...).systemPrompt` contains the operating-rules text exactly once, after the active mode and before `# Return Contract`. Covered by test.
3. `recordDispatch` persists `model`; an existing state file without the field still loads.
4. `grep -rE "MANDATORY FIRST ACTION|/log-phase-|mcp__activity_log__append" agents` returns nothing.
5. `grep -rnwE "CRITICAL|MANDATORY" agents --include='*.md'` returns only severity or priority enum lines; the reviewer lists them in the implementation note.
6. `agent-roles-standard.md` §3 names no model version; §5 and the intro no longer claim role content is unchanged; revision row added.
7. Fidelity check 8 (8a–8c) passes, runs in `--quick`, and fails when a removed phrase is reintroduced (violation test, as for check 6b).
8. **Proof run.** `testapps/pinnote` is run from intake to GATE-P5 before and after on the same session model. The implementation note records, for each: dispatches per phase, sub-agents started outside routing, turns Roma ended without a tool call, gate outcomes, total tokens from `state.json` budget, and word count of each phase's primary artifact. The sponsor reads it before release. No pass threshold is set; a regression in gate outcomes blocks release.
9. Lexicon, ontology, uid-registry, CHANGELOG, VERSION and the 3.5.0→3.5.1 migration step are updated; the full fidelity check passes.
10. The framework's own suites pass, apart from the known failure in `impact-experts.test.cjs`.

---

## 7. Sources

Read 2026-09-21.

| Guide | Used for |
|---|---|
| `platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5` | P5 (delegates more readily; give a delegation rule or cap), P7 (longer written deliverables; add length calibration), removal of explicit re-verification instructions |
| `.../prompting-claude-fable-5` | P6 (checkpoint and early-stopping rules), grounded progress claims, "give the reason", over-prescriptive legacy prompts, safety classifiers (§5 decision 1) |
| `.../prompting-claude-fable-5-1` | P6 ("finish the whole task" block), P7 (scope, targeted edits), lead agent continues while sub-agents run, low-effort cost claim (§5 decision 2) |
| `.../claude-prompting-best-practices` | P4 ("dial back aggressive language"; explain why), state tracking in structured files and git (already met) |

---

## Revision Log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-22 | Implemented in v3.5.1 as specified, with these departures: (a) §2.4 also rewrote the P5 implementation-proposal approval step to return BLOCKED (the in-dispatch pause it replaced contradicted the operating rules and AX-33); (b) Sarah's blocker-logging call replaced by `blockers` in the return for the same reason; (c) Talib's numbered step lists renumbered after removals. Follow-ups recorded in CHANGELOG "Not done". AC1–AC7, AC9, AC10 met; AC8 (pinnote proof run) not yet executed — needs a Roma session at the repo root. |
| 0.2 | 2026-09-22 | Sponsor decided §5 questions 1–4 as recommended; status Approved for build. |
| 0.1 | 2026-09-21 | Draft for sponsor decision. |
