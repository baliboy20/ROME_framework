# ROME-PROP-030: Roma Documentation Restructure

| Field | Value |
|-------|-------|
| **UID** | ROME-PROP-030 |
| **Title** | Roma Robot Documentation Restructure |
| **Status** | Implemented |
| **Author** | Archie |
| **Created** | 2026-03-03T20:00:00Z |
| **Target** | `ROME/robot-plugins/roma/` |

---

## Problem Statement

Roma's documentation has six distinct defects:

1. **orchestrator.md is monolithic** — 860 lines mixing mode definition, phase procedures, report templates, compliance monitoring, amendment handling, and change management into a single file. LLM load cost is high; signal-to-noise is low.

2. **Duplication across ROBOT.md and orchestrator.md** — Core principles, P5 Completion Protocol, and Change Request Workflow summary appear in both files.

3. **Proposal references in operational content** — `ROME-PROP-015`, `ROME-PROP-026`, `ROME-PROP-025`, `ROME-PROP-029` are cited throughout orchestrator.md and all three skill files. Proposals are transient artifacts. Once implemented, the operational behaviour must stand on its own with stable references only.

4. **Phantom skill inventory** — orchestrator.md §Phase-Specific Skills lists ~20 skills; only 3 SKILL.md files exist. The gap creates false documentation.

5. **rollback-change hardcodes robot names** — `Charlie → Reena → Ashok` in fixed order contradicts the capability-based architecture (PROP-025). Rollback order must derive from `tech-stack.yaml` dependency graph reversed.

6. **plugin.json `modes: []` is empty** — orchestrator mode is unregistered.

---

## Proposed Changes

### A. Target Directory Structure

```
roma/
├── .claude-plugin/plugin.json          ← fix: register orchestrator mode
├── ROBOT.md                            ← identity only; remove all duplicated content
├── modes/
│   └── orchestrator.md                 ← slimmed: mode identity + phase transition table + AORDL checks + skills inventory (declared only)
├── procedures/
│   ├── startup.md                      ← extracted: Step 1-4 startup checks
│   ├── phase-transitions.md            ← extracted: P0→P1 through P5→Delivery transition logic
│   ├── p5-capability-coordination.md   ← extracted: dependency graph, assign layer work, monitor progress
│   ├── blocker-resolution.md           ← extracted: detect, triage, resolve pattern
│   ├── amendment-handling.md           ← extracted: amendment request pattern + triage rules
│   └── logging-compliance.md           ← extracted: daily compliance check procedure
├── templates/
│   ├── daily-status-report.md          ← extracted: report template
│   └── phase-transition-report.md      ← extracted: phase summary template
└── skills/
    ├── create-change-request/SKILL.md  ← fix: remove proposal refs
    ├── analyze-change-impact/SKILL.md  ← fix: remove proposal refs
    └── rollback-change/SKILL.md        ← fix: capability-based order + remove proposal refs
```

### B. ROBOT.md — Keep Only

- Identity table
- Purpose (2–3 lines)
- Core Capabilities / Scope / Out of Scope
- Operational Constraints (Permitted / Prohibited)
- Governance Baseline table
- Core Principles *(single source of truth — remove from orchestrator.md)*

**Remove from ROBOT.md:** P5 Completion Protocol (→ `procedures/phase-transitions.md`), Change Request Workflow summary (→ skills are the reference).

### C. orchestrator.md — Slim to Mode Concerns Only

Retain:
- Mode identity table
- Phase-specific purpose (2–3 lines)
- Skills inventory (declared names only — no implementation detail)
- AORDL phase transition table
- AORDL gate readiness check (compact)
- References to `procedures/` files (not inline procedures)

Remove (extract):
- All startup procedure code → `procedures/startup.md`
- All P#→P# transition code blocks → `procedures/phase-transitions.md`
- P5 capability coordination code → `procedures/p5-capability-coordination.md`
- Blocker resolution → `procedures/blocker-resolution.md`
- Amendment handling → `procedures/amendment-handling.md`
- Logging compliance → `procedures/logging-compliance.md`
- Report templates → `templates/`
- Duplicated core principles → already in ROBOT.md
- Change Management summary → skills are the reference
- Activity Logging section → already in ROBOT.md / baseline
- Exit criteria → already in ROBOT.md

### D. Proposal Reference Removal

Replace all `ROME-PROP-###` inline citations with stable operational references:

| Current Citation | Replace With |
|-----------------|--------------|
| `ROME-PROP-015` | `Change Request Protocol` |
| `ROME-PROP-026` | `Change Compliance Protocol` |
| `ROME-PROP-025` | `tech-stack.yaml capability declarations` |
| `ROME-PROP-029` | `P5 Composite Completion Protocol` |

No reference to any proposal document in any operational file after this change.

### E. rollback-change/SKILL.md — Capability-Based Order

Replace hardcoded `Charlie → Reena → Ashok` with:

```
1. Read tech-stack.yaml capabilities and dependencies
2. Build dependency graph
3. Derive rollback order = reverse of implementation order
   (capabilities with no dependents roll back first)
4. For each capability in rollback order:
   capability.robot reverts their workspace
```

This aligns with the capability-based architecture. Lucien reverses any CI/CD changes last.

### F. plugin.json — Register Mode

```json
"provides": {
  "robot": "roma",
  "modes": ["orchestrator"]
}
```

### G. Phantom Skills

Remove the phantom skill inventory listing (~20 skills) from orchestrator.md §Phase-Specific Skills. Replace with a compact table listing only skills that have SKILL.md files. Document the gap explicitly:

```
## Skills

| Skill | File | Status |
|-------|------|--------|
| /create-change-request | skills/create-change-request/SKILL.md | Active |
| /analyze-change-impact | skills/analyze-change-impact/SKILL.md | Active |
| /rollback-change | skills/rollback-change/SKILL.md | Active |
```

Orchestration verbs (assign-robot-to-phase, resolve-blocker, etc.) are inline procedures in `procedures/`, not skills requiring SKILL.md files.

---

## Out of Scope

- Resolving the amendment approval authority boundary (separate concern — see mission-creep analysis)
- AORDL monitoring boundary with Sarah (separate concern)
- Adding new skills or procedures beyond what currently exists

---

## Success Criteria

- [ ] orchestrator.md ≤ 150 lines
- [ ] ROBOT.md has zero duplicate content vs orchestrator.md
- [ ] Zero `ROME-PROP-###` references in any roma operational file
- [ ] rollback-change derives order from tech-stack.yaml (no hardcoded robot names)
- [ ] plugin.json modes array populated
- [ ] All extracted content in named procedure/template files
- [ ] No content lost — all existing procedures preserved, only relocated

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| v1.0 | 2026-03-03T20:00:00Z | Initial draft |
