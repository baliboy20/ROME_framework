# ROME Robot Baseline: Framework Governance (Tier C)

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-BASELINE-C |
| **Version** | 1.0 |
| **Date** | 2026-02-24T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Governance |
| **Author** | Framework Analyst & Architect |
| **Derived From** | ROME-GOV-BASELINE v1.1 |

---

## Purpose

Framework governance standards for the Framework Analyst & Architect (Archie). Covers document standards enforcement, robot definition structure, success criteria templates, and documentation quality requirements. Extends Tier A + B.

---

## Scope

Archie (ROME-DEF-001) only. Project robots do not need this tier.

---

## Prerequisites

| UID | Document | Purpose |
|-----|----------|---------|
| ROME-GOV-BASELINE-A | baseline-universal.md | Universal operations |
| ROME-GOV-BASELINE-B | baseline-coordination.md | Coordination patterns |
| ROME-GOV-001 | document-standards.md | Document formatting |
| ROME-GOV-003 | amendment-procedures.md | Change control |

---

## Robot Definition Structure

All robot ROBOT.md files MUST follow this structure:

```markdown
# [Robot Name] Robot: Role Definition

[Metadata Table]

## Purpose
[Robot-specific purpose - HOW this robot executes its assigned phase(s)]

## Dependencies
[Phase-specific + baseline tier reference]

## Role Description
[Robot name, role, phase assignment, upstream/downstream, orchestrator]

## Operational Constraints
### Permitted
[Robot-specific permissions]

### Prohibited
[Robot-specific prohibitions]

## [Phase-Specific Procedures]
[Robot's unique operational procedures]

## Success Criteria
[Robot-specific success metrics]
```

**Baseline reference pattern in ROBOT.md:**
```markdown
## Governance Baseline

This robot operates under ROME-GOV-BASELINE-A (Universal Operations).
[If coordination robot: Also ROME-GOV-BASELINE-B (Coordination).]
```

---

## Common Dependencies

All robots inherit these dependencies (no need to repeat in individual ROBOT.md):

| UID | Document | Purpose |
|-----|----------|---------|
| ROME-GOV-BASELINE-A | baseline-universal.md | Universal operations |
| ROME-PROC-005 | activity-logging-protocol.md | Logging requirements |
| ROME-LEX-001 | lexicon.md | Framework terminology |

---

## Success Criteria Template

Robot ROBOT.md files SHOULD include success criteria following this pattern:

```markdown
## Success Criteria

### Phase Completion
- [ ] All entry criteria verified
- [ ] All required artifacts created
- [ ] All work items logged and COMPLETED
- [ ] No OPEN blockers
- [ ] Handover document created
- [ ] Phase exit criteria met

### Quality Metrics
- [ ] [Robot-specific quality checks]
- [ ] All artifacts validated
- [ ] Downstream robot can proceed without questions

### Activity Logging Compliance
- [ ] All work logged in activity log
- [ ] All status transitions recorded
- [ ] All blockers documented
- [ ] Handover logged
```

---

## Documentation Quality Standards

- Handover documents MUST be complete
- Decisions MUST be documented with rationale
- Complex logic MUST be explained
- Assumptions MUST be stated explicitly
- Artifacts MUST follow framework formatting standards (ROME-GOV-001)

---

## References

- **ROME-GOV-BASELINE-A:** Universal Operations (Tier A)
- **ROME-GOV-BASELINE-B:** Coordination (Tier B)
- **ROME-GOV-001:** Document Standards
- **ROME-GOV-003:** Amendment Procedures
- **ROME-PRIN-001:** Core Principles
- **ROME-GOV-007:** Framework Fidelity
