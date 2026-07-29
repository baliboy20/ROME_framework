# ROME-PROP-054 — Change-Type Taxonomy, Trace-Scoped Routing, and Sponsor Communication Standard

Document UID: ROME-PROP-054
Status: Implemented
Document Type: Framework Proposal
Depends on: PROP-036 (intent routing), PROP-047 (ICR/intake), PROP-048/049 (increments), ROME-GOV-001 v1.1 (accessibility convention)

---

## In Plain Terms

Today ROME only really knows how to build a new app from scratch. If you come
back later to fix a bug or adjust a requirement, there is no easy way in: the
labels that exist (refinement / extension / migration) all run the same full
heavyweight pipeline, "bug fix" isn't a concept at all, and the docs never
cover reopening a finished project.

This proposal fixes that in three parts:

1. **Five plain change types** — defect fix, minor amendment, requirement
   change, new capability, restructure — each defined by *what it forces you to
   redo* (code only? requirements too? the architecture?), each with a
   right-sized process. A bug fix no longer marches through seven phases.
2. **A simple way back in.** Open a session on an existing project, say what
   you want in plain words; Roma reads the traceability records, tells you what
   type of change it is and what it touches, you confirm, and it runs only the
   necessary path.
3. **Agents speak plainly to the sponsor.** Whenever any agent addresses the
   sponsor, it must use simple structured English — no framework jargon, no
   internal codes — and every sub-agent gets access to the Seez sponsor tools
   so sponsor conversations all flow through one channel.

---

## Problem

- P1. The intent taxonomy (`greenfield|refinement|extension|migration`,
  `routing.js`) classifies *relationship to an existing system*, not *scope of
  change*. All four intents route the identical phase sequence P0→P5; brownfield
  intents merely add P0.5. No lighter path exists.
- P2. `refinement` and `extension` are nowhere defined; their boundary is
  ambiguous — violates the framework's non-overlapping-terminology rule.
- P3. No concept of defect fix or minor amendment. Formally, a one-line bug
  fix is a `refinement` → full pipeline. In practice users would bypass the
  framework, losing traceability.
- P4. No session-start path onto an existing project. `rome-start.cjs` only
  scaffolds new projects; `rome-increment.cjs` only grows pre-planned stages.
  GETTING-STARTED.md and USER-GUIDE.md cover greenfield only.
- P5. Traceability (requirement→design→code→test) is recorded but never *used*
  to scope work: no blast-radius computation exists.
- P6. Sponsor-facing agent output has no register standard; agents leak
  framework jargon (UIDs, phase codes, axiom numbers) into sponsor dialogue.
- P7. Only the orchestrator session is guaranteed the Seez MCP toolset;
  sub-agent access to sponsor-channel tools is unspecified.

## Part A — Change-Type Taxonomy (CT)

Classification axis: **highest artifact tier the change forces to be reworked**
(code < design < requirements < architecture). Declared by the sponsor in plain
words; **verified against the trace before routing** (see Part B step 2).

| CT | Name | Definition (what must be redone) | Routed path |
|----|------|----------------------------------|-------------|
| CT-1 | Defect fix | Delivered code contradicts an existing, correct requirement. Rework: code + tests only. | Reproduce → fix → re-verify affected requirement(s) → gate once (build+tests+trace intact). |
| CT-2 | Minor amendment | Behaviour within the letter of requirements needs adjustment (wording, layout, tuning). Rework: code only; trace note appended. | Same path as CT-1. |
| CT-3 | Requirement change | An existing requirement is wrong or superseded. Rework: that requirement + everything downstream of it *per the trace*. | Amend requirement (P1-scoped) → recompute blast radius via trace → redo only impacted design/code/tests → gate. |
| CT-4 | New capability | New requirements; existing requirements keep their meaning. Rework: nothing existing; regression protection required. | Full pipeline scoped to the new requirements (≈ existing increment path, PROP-048/049) + regression check on delivered scope. |
| CT-5 | Restructure | System shape changes (stack, topology, module split); requirements semantically unchanged. Rework: design + code; requirements re-confirmed only. | P1 as confirmation pass → full P3→P5 on affected scope. |

Rules:
- **AX-31 (proposed) — verified classification.** Roma MUST verify the declared
  CT against the trace before routing. If the trace contradicts it (e.g. a
  "bug" traces to a requirement that specifies the observed behaviour), Roma
  reclassifies (CT-1 → CT-3) and tells the sponsor why, in plain terms, before
  proceeding. Sponsor confirms the final classification.
- **AX-32 (proposed) — no untraced delivery.** Every CT path, however light,
  ends at a guard-evidenced gate: build passes, tests pass, trace records
  updated. Urgency is a flag, not a type: an urgent CT-1 may fix first, but the
  gate and trace update happen in the same session, never skipped.
- Mapping to existing intents: `refinement` ≈ CT-3, `extension` ≈ CT-4,
  `migration` ≈ CT-5. The intent vocabulary is retained for project *creation*;
  CT classifies *work items against a delivered project*. Lexicon entries for
  both sets are added with this boundary stated.

### A.1 — Five labels, three mechanisms

The five CTs are the sponsor-facing vocabulary; they route onto exactly THREE
process mechanisms — no more machinery than the work requires:

| Mechanism | Serves | Nature |
|-----------|--------|--------|
| Light path | CT-1, CT-2 | NEW — fix → verify → single gate; recorded as a change record. |
| Trace-scoped rework | CT-3, CT-5 | NEW — amend upstream artifact, redo only the traced blast radius; change record. |
| Increment | CT-4 | EXISTING — `rome-increment.cjs` (PROP-048/049), unchanged. |

**CT-4 is delegated, not duplicated:** a new-capability item classified in
triage routes into the existing increment mechanism; `routeChange()` never
creates a change record for CT-4. This keeps ONE growth mechanism for the
project (increments) and ONE amendment mechanism (change records) — never two
parallel ways to add scope.

### A.2 — Blast-radius honesty (CT-3/CT-5 fallback)

The trace-scoped path is only as precise as the trace. Rule: if the trace
cannot isolate the impact of an amended requirement below a given artifact
granularity (e.g. it links only to "module X"), Roma reports that plainly and
the scope widens to full rework of that artifact. The path must degrade
honestly — it never asserts a precision the trace does not carry. The
computed radius (and its granularity ceiling, if hit) is recorded in the
change record.

## Part B — Session Re-entry ("resume path")

New entry point when a project already has `state.json` with delivered scope:

1. **Detect.** Roma (or the user's launch line) targets an existing project
   folder. Roma loads state via `state.js`; delivered scope present → re-entry
   mode, not greenfield.
2. **Classify.** Sponsor states the desired change in plain words. Roma
   inspects the trace, proposes a CT with its blast radius ("this touches
   requirement R-012, two files, one test"), sponsor confirms (AX-31).
3. **Route.** A new `routeChange(ct, blastRadius)` in `routing.js` emits the
   CT-scoped phase list (table above) into a **change record** appended to
   state — never overwriting the delivered increment's record (same
   append-only principle as PROP-048/049).
4. **Run.** Standard driver/guard loop over the scoped phases.

CLI support: `rome-change.cjs <projectDir> --ts <iso>` initializes a change
record shell (analogue of `rome-increment.cjs`); classification itself stays
with Roma+sponsor, not the CLI.

### B.1 — Session root rule

Re-entry preserves the existing working-directory invariant (ROME-DEF-002):

- **Project still inside the framework clone** → open the session in
  `ROME_framework/` (the repo root), exactly as for greenfield. The project
  stays a subfolder; all paths relative to the root.
- **Project relocated out of the clone** → open the session in the **project
  folder itself**; the vendored engine in `<project>/.rome/` is the framework.
  All orchestrator paths resolve against `.rome/` (resolves OQ-3: vendored).

**Sentinel CLAUDE.md.** `rome-start.cjs` scaffolds a `CLAUDE.md` into every
project folder. Its sole job: if a session is opened with the project folder
as cwd, the agent reads it first and (in plain sponsor language, per AX-33)
explains the root rule and does one of:
1. If `../ROME/` exists (project is inside a framework clone) → tell the
   sponsor to reopen the session at the framework root; do not proceed here.
2. Else (relocated project) → confirm vendored-engine mode and proceed under
   the re-entry flow, with `.rome/` as the framework root.
The sentinel never restates orchestrator logic; it points to
`.rome/agents/roma/modes/orchestrator.md`.

### B.2 — Live triage (changes spotted during a running session)

Defects, amendments, and enhancement ideas typically surface *while* the app
is being run in dev/test, inside an already-live session. Governing principle:
**the trace decides the path, the sponsor decides the order, the agent never
just starts editing.**

1. **Capture, don't chase.** Each sponsor observation ("that button is wrong",
   "it should also do X") is immediately recorded as a numbered entry in the
   project's change queue (in state, append-only). No immediate fixing — an
   untracked hack session is exactly what AX-32 forbids.
2. **Classify via trace** (AX-31). For each entry Roma inspects the trace and
   proposes a CT: contradicts a requirement → CT-1; outside all requirements →
   CT-4; the requirement itself is wrong → CT-3; etc. Stated to the sponsor in
   plain words with the blast radius.
3. **Batch and confirm.** At a natural pause Roma presents the queue ("3
   defects, 1 requirement change, 1 new feature") and the sponsor sets the
   order: fix now, park, or take all.
4. **Route each confirmed item** through its CT-scoped path (Part A). The
   queue persists in state, so unactioned items survive across sessions.

Docs: GETTING-STARTED.md gains "## Coming back to change something" (plain
English, mirroring the greenfield walkthrough); USER-GUIDE.md gains the CT
table in plain terms.

## Part C — Sponsor Communication Standard

- **AX-33 (proposed) — sponsor register.** Any agent output addressed to the
  sponsor MUST be simple structured English: short sentences, everyday words,
  no framework jargon or internal identifiers (phase codes, axiom numbers,
  UIDs, agent role names) unless the sponsor introduced them. Internal
  identifiers may appear once, in parentheses, when the sponsor will need them
  to reference an artifact. Applies to questions, briefs, gate summaries, and
  refusals. Agent-to-agent and audit output is unaffected (stays terse/LLM-optimized).
- **Seez access for all sub-agents — hybrid model.** The consolidated MCP set
  (`activity-log-file`, `Seez`, `Mermaid`) is inherited by every spawned
  sub-agent, not just the orchestrator session. Division of use:
  - **Display is direct.** Any sub-agent may push content to the sponsor's
    screen via Seez (documents, charts, prototypes, gate summaries) — no
    round-trip through Roma for showing things.
  - **Questions and approvals route through Roma.** Sponsor decisions are
    asked with one voice: sub-agents surface questions via their existing
    structured-return contract (`subagent.js`); Roma phrases and asks them
    (Seez `ask_questions`), enforcing AX-33 in one place. Ten agents
    interrogating the sponsor independently is the failure mode this
    prevents.
  Update `agent-roles-standard.md` §MCP and each `ROME/agents/*/ROBOT.md` to
  state the inheritance and the display/question split; remove any per-robot
  MCP setup language.
- Enforcement: sponsor-register phrasing is a review obligation on Roma (it
  relays or rewrites sub-agent sponsor messages that violate AX-33); Seez
  inheritance is configuration, checked by the fidelity script (new check:
  every ROBOT.md declares the consolidated set).

## Impacted artifacts

| Artifact | Change |
|----------|--------|
| `ROME/rome-core/orchestrator/routing.js` | Add CT constants + `routeChange()` |
| `ROME/rome-core/orchestrator/impact.js` | Blast-radius computation from trace records |
| `ROME/rome-core/orchestrator/state.js` | Append-only change records |
| New `rome-change.cjs` | Change-record shell CLI |
| `rome-start.cjs` | Scaffold sentinel `CLAUDE.md` into project folder (B.1) |
| `ROME/agents/roma/modes/orchestrator.md` | Re-entry mode + AX-31/32/33 duties |
| `ROME/rome-core/docs/standards/agent-roles-standard.md` | Sponsor register; MCP inheritance |
| `ROME/agents/*/ROBOT.md` | Consolidated MCP set; sponsor-register note |
| Lexicon | CT-1..CT-5; refinement/extension boundary |
| Axioms registry | AX-31, AX-32, AX-33 + violation tests |
| GETTING-STARTED.md / USER-GUIDE.md | Re-entry walkthrough; plain CT table |

## Open questions

- OQ-1. Should CT-2 be folded into CT-1 (identical path) or kept separate for
  audit semantics? (Recommend: keep — the trace note differs: "requirement met
  differently" vs "requirement now met".)
- OQ-2. Does an urgent CT-1 need a distinct state marker (`urgent: true`) for
  audit, or is the timestamp trail sufficient?
- ~~OQ-3~~ Resolved in B.1: relocated projects run on the vendored engine
  (`.rome/`); the framework-upgrade path is documented separately.

---

## Revision History

| Rev | Date (ISO 8601) | Summary |
|-----|------------------|---------|
| v1.0 | 2026-07-27 | Initial draft: CT-1..CT-5 taxonomy, trace-scoped re-entry path, sponsor plain-English register (AX-30), Seez MCP inheritance for all sub-agents. |
| v1.1 | 2026-07-27 | Added B.1 session root rule + sentinel project CLAUDE.md (resolves OQ-3: vendored engine for relocated projects); B.2 live triage flow (capture → classify → batch → route) for changes surfaced mid-session. |
| v1.2 | 2026-07-27 | Renumbered proposed axioms AX-28/29/30 → AX-31/32/33: AX-27..30 were already registered by PROP-051/052 (ontology v1.5). No semantic change. |
| v1.3 | 2026-07-27 | Pre-implementation review amendments: A.1 five labels route onto three mechanisms, CT-4 delegated to existing increments (no parallel growth mechanism); A.2 blast-radius fallback (honest degradation when trace granularity is coarse); Part C Seez hybrid — display direct from any sub-agent, sponsor questions/approvals one-voice through Roma. |
| v1.4 | 2026-07-29 | Sponsor amendment (shipped v3.3.1): queue entries carry a sponsor-set `priority` (HIGH/NORMAL/LOW, default NORMAL; `prioritizeChange`, audited) — an ordering signal only, never a routing/classification input; PARKED formalized as the stash with `reopenChange` (classification kept). `rome-change.cjs` gains `--priority/--prioritize/--reopen`; `--list` orders live work by priority, then stash, then delivered. Legacy entries default NORMAL on load. |
