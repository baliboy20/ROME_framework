# ROME-PROP-035..040 Migration Impact Analysis — Code, Utilities & Folder Trees

| Field | Value |
|-------|-------|
| **UID** | ROME-REV-006 |
| **Title** | What stays, what changes, what goes — codebase impact of the sub-agent orchestration re-architecture |
| **Status** | Draft |
| **Author** | Archie |
| **Created** | 2026-06-18T00:00:00Z |
| **Scope** | Whole repo, excluding `.git/`, `node_modules/`, `.idea/` |
| **Drives** | Implementation sequencing for PROP-035..040; coordinates with PROP-034 |

---

## Legend

- **KEEP** — survives unchanged; valuable under the new model.
- **EDIT** — survives but must be repurposed/reframed.
- **REMOVE** — retire; the new model deletes its reason to exist.
- **ARCHIVE** — move to archive; historical, not deleted.
- **DECIDE** — needs an explicit architectural decision before action.

The unifying principle: the re-architecture **deletes the emulation machinery** (human session-switching, multi-terminal launch, coordination-by-log-polling) and **keeps the deterministic utilities and the content** (validators, parsers, skills, expert knowledge, AORDL standard). The orchestrator + guard + call/return replaces the emulation.

---

## 1. REMOVE — the emulation machinery (the whole point of PROP-035)

These exist only to simulate multi-agent execution across separate human-driven sessions. The single-session orchestrator makes them obsolete.

| Path | Why remove |
|------|-----------|
| `ROME/rome-p5-generation/commands/switch-robot.sh` | Human session-switching by `cat`-ing a ROBOT.md. PROP-035 §4 explicitly drops this. |
| `ROME/rome-p5-generation/commands/auto-parallel-generate-mcp.js` | Launches 3 iTerm terminals, one robot each. Replaced by orchestrator fan-out (038). |
| `ROME/rome-p5-generation/commands/rome-p5-parallel-generate.sh` | Same multi-terminal launch mechanism. |
| `ROME/rome-p5-generation/.claude/hooks/init-workspace.sh` | Loads only Ashok (the PROP-021 gap). Replaced by orchestrator dispatch. |
| `ROME/rome-p5-generation/.claude/settings.json` (SessionStart hook) | Per-phase robot auto-load; obsolete under one session. |
| `ROME_tools/orchestrators/p5-hybrid/` (index.js, CommandHandlers.js, MonitoringDashboard.js, AlertSystem.js) | PROP-022 "Roma Command Center": iTerm agents + activity-log polling + a terminal dashboard. Superseded by the single-session orchestrator; monitoring becomes `/status` from `state.json` (035 §6a). |
| `ROME_tools/lib/ActivityLogCoordinator.js` | Heartbeat/liveness/dependency-timeout **polling** protocol — coordination-by-side-effect. Replaced by call/return + the failure policy (039 Part B). Its concerns survive as design; the code does not. |
| `ROME/robot-plugins/*/add-mcps-v4.sh` (×10) + `ROME/rome-core/scripts/add-mcps-v4.sh` | Per-robot/per-session MCP setup. One session needs one consolidated MCP set → collapse to a single setup (see §5 DECIDE). |
| `ROME_architect/addmcp.sh` (symlink) | **Already broken** — points to `/Users/will/flutterProjects/Exercises/nov/romev10/...`, a path that no longer matches this repo. Remove. |
| `ROME/robot-plugins/talib/skills/log-phase-start`, `log-phase-complete` | Manual "remember to log" skills. Under call/return the orchestrator records phase events; voluntary logging skills are the old weakness (035 §6b). |

---

## 2. EDIT — repurpose for the new model

### 2.1 Hooks (the most delicate change)

| Path | Change |
|------|--------|
| `ROME/rome-core/.claude/hooks/check-activity-log.sh` | Enforces voluntary logging as a *correctness* crutch. Under call/return logging is no longer correctness-critical (035 §3.3). Retire the enforcement role. |
| `ROME/rome-core/.claude/hooks/check-activity-log-pre.sh` | Same. |
| `ROME/rome-core/.claude/hooks/reject-zero-timestamps.sh` | Belt-and-suspenders for log integrity; downgrade to audit-quality check, not a gate. |
| **NEW** (replaces the above as the load-bearing hook) | The **deterministic phase-advance guard** (035 §3.5): refuse to mark a phase COMPLETE / advance the phase pointer in `state.json` without a matching APPROVE record from the gate role. This is the single most important new piece of code. |

> **Sequencing risk:** do not remove the log-enforcement hooks *before* the new guard exists, or there is a window with no deterministic enforcement at all.

### 2.2 Roma — from monitor to orchestrator (major)

| Path | Change |
|------|--------|
| `ROME/robot-plugins/roma/ROBOT.md` | "Coordinates, does not command" → active orchestrator with enforcement authority. Rewrite identity. |
| `ROME/robot-plugins/roma/modes/orchestrator.md` | Becomes the executable lifecycle spec (state machine, dispatch, fan-out/join, gate enforcement via guard). |
| `ROME/robot-plugins/roma/procedures/phase-transitions.md` | From prose-a-human-follows → the orchestrator's transition logic, backed by the guard. |
| `ROME/robot-plugins/roma/procedures/p5-capability-coordination.md` | Generalize from 3 fixed robots → the topology DAG fan-out (038). |
| `ROME/robot-plugins/roma/procedures/startup.md` | Becomes `/rome-start` + resume-from-`state.json` (035 §6d). |
| `ROME/robot-plugins/roma/procedures/logging-compliance.md` | Largely obsolete (coordination no longer log-based); reduce to audit-trail note. |
| `ROME/robot-plugins/roma/templates/daily-status-report.md`, `phase-transition-report.md` | KEEP-as-templates but generate from `state.json`, not log-scraping. |

### 2.3 Robot definitions → sub-agent definitions (light edit, ×9)

All `ROME/robot-plugins/{talib,pma,clara,lucien,ashok,reena,charlie,sarah,bootstrap}/ROBOT.md` + `modes/*`:
- **KEEP** the substantive role/skill content (this is the value).
- **EDIT** framing: remove session/switch language; convert Permitted/Prohibited lists into tool scoping; ensure each returns a **structured result** (artifacts + summary + traceability deltas).
- Ashok/Reena/Charlie modes: reframe from fixed seats → **capability instances** (038).
- Add capability metadata for topology instancing (038) and expert-pack applicability (040 Part F).

### 2.4 Activity-log MCP server — KEEP code, demote role

`ROME/rome-core/servers/activity-log/**` (index.js, event-parser.js, query-engine.js, state-builder.js):
- **KEEP** as the audit/traceability trail (EP-1/EP-4).
- **DECIDE/EDIT** `state-builder.js`: it reconstructs state *from the log*. The new model's source of truth is `state.json` (035 §6a). Two state sources = the exact risk 035 warns against. Decide: `state.json` is source-of-truth, log is audit copy; `state-builder` becomes an audit-verification tool, not the live state.

### 2.5 Docs & manifests describing the old model

| Path | Change |
|------|--------|
| `ROME-DATA-FLOW.md` | Add orchestrator, guard, optional phases (P0.5/P3.5), topology fan-out, executability gate. |
| `PLUGIN-MANIFEST.md`, `GENERATION-PLUGINS-MANIFEST.md` | Rewrite around agent roles, not phase/robot plugins. |
| `*-plugins-complete.json` (design/early/generation) | Regenerate or retire — they encode the phase-plugin model. |
| `INSTALLATION-GUIDE.md`, `USER-GUIDE.md` | Rewrite initiation around `/rome-start` (035 §6d); drop switch-robot workflow. |
| `ROME/rome-core/docs/operational/activity-log-format.md` | Note demoted role. |
| `ROME/rome-core/docs/operational/baseline-coordination.md` | Coordination is now call/return, not log. |
| `ROME/rome-core/docs/framework-maintenance/uid-registry.md` | Record removed/changed UIDs from this migration. |
| `CHANGELOG.md`, `ROME/rome-core/VERSION` | Bump (major) on cutover. |

---

## 3. KEEP — deterministic utilities & content (the durable value)

| Path | Why keep |
|------|----------|
| `ROME/rome-core/lib/aordl-parser/validate-aordl.js` | **Deterministic** AORDL validator = the mechanical P1 accuracy check (035 §3.5.3). Elevate, don't touch. |
| `ROME/rome-core/lib/aordl-parser/transform-aordl-to-bdd.js` | Deterministic transform. KEEP. |
| `ROME/rome-core/lib/annotate-artifact.cjs` (+ tests) | Code-traceability provenance annotation (EP-1). KEEP. |
| `ROME/rome-core/scripts/validate-mcp-dependencies.cjs`, `check-framework-fidelity.sh` | Utilities, still useful. KEEP (minor edits). |
| `ROME/rome-core/docs/foundation/lexicon.md` + most `framework-maintenance/*` | Standards/terminology; reconcile with 035 §4a glossary but KEEP. |
| `ROME/rome-core/templates/aordl/*` | Requirement templates/forms. KEEP. |
| **All `skills/*/SKILL.md` across robot-plugins** | The actual capabilities — the framework's working value. KEEP (see §4 for duplication). |
| `Experts/**` | Domain knowledge library; wire in as expert packs (040 Part F). KEEP. |
| `test-project-to-validate-framework-v1/`, `testapps/{pinnote,taskflow}/` | Test fixtures to validate the migration end-to-end. KEEP — and use to prove M2/M3. |

---

## 4. Folder-tree issues

### 4.1 Skill duplication across three locations
Flutter skills are triplicated:
- `ROME/robot-plugins/charlie/skills/flutter-*` and `generate-ui-*`
- `PLUGINS/standalone/flutter-dev/.claude/skills/*` (same names)
- `ROME_architect/.claude/skills/*` (flutter-best-practices, ui-design-patterns)

Three copies drift. **Consolidate** into the 040 expert-pack model: one source under `Experts/`, injected per capability/stack. Decide the canonical home and collapse the rest to references.

### 4.2 Two parallel plugin systems (coordinate with PROP-034)
`ROME/` holds both `robot-plugins/` (agent layer) and `rome-p0..p5` + `rome-qa` (phase plugins). PROP-034 already proposes retiring phase plugins; PROP-035 confirms it (their SessionStart hooks and commands are emulation). **Land PROP-034 first** (it elevates shared specs to standards), then the phase-plugin shells become removable.

### 4.3 Proposed target tree (post-migration)
```
ROME/
  rome-core/
    orchestrator/        # NEW — Roma orchestrator + state machine
    guard/               # NEW — deterministic phase-advance enforcement
    standards/           # from PROP-034 (AORDL, traceability, security, contracts)
    lib/                 # KEEP deterministic utils (aordl-parser, annotate)
    servers/activity-log # KEEP (audit trail)
    docs/, templates/    # KEEP/edit
  agents/                # renamed from robot-plugins/ (roles = capabilities)
  experts/               # consolidated from Experts/ + the 3 dup locations
# REMOVED: rome-p0..p5, rome-qa (phase-plugin shells)
# REMOVED/SHRUNK: ROME_tools/ (orchestrators/, coordinator gone)
```

### 4.4 `ROME_tools/` becomes nearly empty
After removing `orchestrators/p5-hybrid/` and `ActivityLogCoordinator.js`, what remains is `SkillInvoker.js` + `SkillRegistry.js` (see §5 DECIDE) and docs. Likely fold the survivors into `rome-core/lib` and retire the top-level `ROME_tools/` package.

### 4.5 `ROME_architect/`
Archie's framework-maintenance workspace (separate from the runtime). **KEEP** — but remove the broken `addmcp.sh` symlink and consolidate its duplicated skills (§4.1).

### 4.6 Vendored `node_modules`
Two on disk (`ROME_tools/`, activity-log server). Confirm `.gitignore` covers them; the activity-log server stays, so its deps stay.

---

## 5. DECIDE — explicit decisions needed before coding

| # | Decision | Recommendation |
|---|----------|----------------|
| D1 | **Custom skill runtime vs native skills.** `ROME_tools/lib/SkillInvoker.js` + `SkillRegistry.js` are a bespoke skill-invocation/validation framework. Native sub-agents + native agent skills may make them redundant — but other code references them. | Migrate to native skills; retire the custom invoker. Verify no runtime depends on it before deleting. |
| D2 | **State source of truth.** `state.json` (035) vs activity-log `state-builder.js`. | `state.json` = source of truth; log = audit; `state-builder` → audit verifier. |
| D3 | **MCP consolidation.** 10 `add-mcps-v4.sh` + multiple `.mcp.json`. | One consolidated MCP set for the orchestrator session; audit every server referenced before collapsing so none is dropped. |
| D4 | **Phase-plugin retirement ordering.** | PROP-034 first → then remove phase-plugin shells under 035. |

---

## 6. Issues / risks that may arise

1. **Enforcement gap window** — removing log-enforcement hooks before the new guard exists leaves zero deterministic enforcement. *Mitigation: build the guard first; remove old hooks last.*
2. **Two-source-of-truth drift** — `state.json` vs log-derived state (D2). *Mitigation: declare one source; demote the other.*
3. **Premature deletion of referenced code** — SkillInvoker/Registry, add-mcps scripts may be referenced by paths not obvious from reading. *Mitigation: grep for references before each removal.*
4. **Stale docs mislead implementers** — many manifests/guides describe the old model. *Mitigation: update in lockstep or stamp "superseded by PROP-035" immediately.*
5. **Skill-dedup breakage** — consolidating the triplicated flutter skills may break references from charlie / PLUGINS / architect. *Mitigation: replace copies with references, test resolution.*
6. **MCP server dropped in consolidation** — collapsing 10 setup scripts risks losing a server some role needs. *Mitigation: build the union set from all current scripts; validate with `validate-mcp-dependencies.cjs`.*
7. **PROP-034 / PROP-035 coordination** — both touch the plugin layout; uncoordinated they conflict. *Mitigation: 034 lands first.*
8. **Test fixtures expect old commands** — `testapps/*/_test-framework/TEST-PLAN.md` reference switch-robot/parallel-generate flows. *Mitigation: update test plans alongside; reuse fixtures to validate the new flow.*
9. **Broken symlink already present** — `ROME_architect/addmcp.sh`. *Mitigation: remove now (independent of migration).*
10. **UID hygiene** — removed components leave dangling UID references. *Mitigation: update `uid-registry.md` as part of cutover.*

---

## 7. Recommended sequencing (maps to PROP-035 migration milestones)

1. **Pre-work (safe now):** remove broken `addmcp.sh` symlink; grep-audit references for SkillInvoker/Registry and add-mcps (D1, D3); confirm `.gitignore` for node_modules.
2. **M0:** land PROP-034 (standards extraction, phase-plugin content elevation).
3. **M1:** build the orchestrator skeleton + **deterministic guard** + `state.json`; KEEP old hooks running in parallel.
4. **M2 (prove on P3):** PMA→Clara→Sarah via orchestrator; validate guard enforcement; remove that phase's old hooks once guard proven.
5. **M3 (prove parallel on P5):** topology fan-out (038); remove `switch-robot.sh`, `init-workspace.sh`, `auto-parallel-generate-mcp.js`, `p5-hybrid/`, `ActivityLogCoordinator.js`.
6. **M4 (cutover):** remove remaining phase-plugin shells + SessionStart hooks; demote activity-log; retire `ROME_tools/`; consolidate experts/skills.
7. **M5:** terminology rename (robot→agent role); rewrite manifests/guides; bump VERSION/CHANGELOG; update uid-registry.

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-18 | Initial migration impact analysis — KEEP/EDIT/REMOVE/DECIDE classification of code, utilities and folder trees for the PROP-035..040 re-architecture; risks and sequencing. |
