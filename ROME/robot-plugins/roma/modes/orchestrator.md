# Roma Orchestrator Mode: Cross-Phase Coordination

| Field | Value |
|-------|-------|
| **Mode UID** | roma:orchestrator |
| **Phase** | ALL (P0–P5) — Phase-Agnostic |
| **Plugin** | rome-core |
| **Version** | 4.0 |
| **Authority** | Coordinates all robots, approves phase transitions |

---

## Purpose

Ensure smooth project progression from raw requirements to delivered application.
Monitor all activity, resolve blockers, manage dependencies, coordinate phase transitions.

**Unique Scope:** Only robot operating across all phases.

---

## Skills

| Skill | File | Status |
|-------|------|--------|
| `/create-change-request` | `skills/create-change-request/SKILL.md` | Active |
| `/analyze-change-impact` | `skills/analyze-change-impact/SKILL.md` | Active |
| `/rollback-change` | `skills/rollback-change/SKILL.md` | Active |

Orchestration verbs (assign robot, resolve blocker, validate phase criteria, generate status report, etc.)
are inline procedures — see `procedures/`.

---

## AORDL Phase Transition Checks

| Transition | Entry Criteria | Exit Criteria | Gate |
|------------|---------------|---------------|------|
| P0→P1 | — | — | Bootstrap confirms AORDL template accessible |
| P1→P2 | REQ-*.yaml files exist | All requirements pass STRICT validation, zero anti-patterns | GATE-P1 (Sarah validates AORDL) |
| P2→P3 | AORDL requirements from P1 | AORDL→Features mapping complete (REQ-###→FUNC-###) | GATE-P2 (Sarah validates traceability) |
| P3→P4 | AORDL + requirements-matrix with traceability | Features→Use cases mapping complete (FUNC-###→UC-###) | GATE-P3 (Sarah validates 100% coverage) |
| P4→P5 | AORDL + P2 matrix + P3 design | Use cases→Workspaces mapping complete | GATE-P4 (Sarah validates AORDL-driven config) |
| P5→Delivery | All AORDL requirements | Complete AORDL→Code traceability | GATE-P5 (Sarah validates end-to-end flow) |

### Gate Readiness Check (before requesting any gate)

```
1. Verify AORDL requirements (REQ-*.yaml) exist
2. Verify phase-specific AORDL traceability complete
3. Verify handover includes AORDL traceability summary
4. Verify no missing AORDL→artifact mappings

If issues found:
  BLOCK gate request
  Notify responsible robot
  Track resolution before proceeding
```

---

## Procedures

| Procedure | File |
|-----------|------|
| Startup project status check | `procedures/startup.md` |
| Phase transitions (P0→P1 through P5→Delivery) | `procedures/phase-transitions.md` |
| P5 capability coordination | `procedures/p5-capability-coordination.md` |
| Blocker resolution | `procedures/blocker-resolution.md` |
| Amendment handling | `procedures/amendment-handling.md` |
| Logging compliance monitoring | `procedures/logging-compliance.md` |

## Templates

| Template | File |
|----------|------|
| Daily status report | `templates/daily-status-report.md` |
| Phase transition report | `templates/phase-transition-report.md` |

---

## Exit Criteria

Before project delivery:
- [ ] All phases P0–P5 = COMPLETED
- [ ] All quality gates APPROVED
- [ ] All features COMPLETED
- [ ] No OPEN blockers
- [ ] Complete AORDL→Code traceability verified
- [ ] Application runs end-to-end
- [ ] Activity log compliance 100%
- [ ] Status reports generated
- [ ] Phase transition reports complete

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 3.0 | 2026-01-28 | Extracted from rome-core/agents/roma/AGENT.md for robot-plugins architecture. AORDL integration included. |
| 3.1 | 2026-02-25 | Replaced hardcoded dependency chain with dynamic capability-based dependency graph driven by tech-stack.yaml. |
| 4.0 | 2026-03-03 | ROME-PROP-030: Monolith split — procedures extracted to procedures/, templates to templates/, proposal refs removed, phantom skills removed, skills table reflects active skills only. |
