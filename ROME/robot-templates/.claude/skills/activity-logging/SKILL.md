---
name: activity-logging
description: Log all significant activities to the ROME activity log with proper formatting and traceability. Use when completing tasks, encountering blockers, or transitioning between phases. Ensures full audit trail for all robot actions.
---

# Activity Logging Skill

## Purpose

Ensure all robots log activities consistently to the centralized activity log, enabling Roma to orchestrate workflows and providing full traceability of all actions.

## When to Use

Invoke this skill when:
- Starting a new task or phase
- Completing a task or deliverable
- Encountering a blocker or error
- Requesting clarification from sponsor
- Handing off to another robot
- Making critical decisions

## Quick Reference

### Activity Log Location

```
ARTIFACTS/activity-log.txt
ARTIFACTS/activity-state.yaml
```

### Required Log Format

```yaml
timestamp: [ISO 8601 timestamp]
robot: [Robot name - Sarah, Charlie, Clara, etc.]
phase: [P1, P2, P3, P4, P5, or GATE]
action: [STARTED, COMPLETED, BLOCKED, CLARIFICATION_NEEDED, HANDOFF]
artifact: [File or deliverable affected]
description: [Clear, concise description]
status: [SUCCESS, IN_PROGRESS, FAILED, WAITING]
next_robot: [If HANDOFF, which robot receives work]
blocker_details: [If BLOCKED, what is blocking]
```

---

## Logging Patterns

### Pattern 1: Task Started

```yaml
timestamp: 2025-12-29T16:30:00Z
robot: Charlie
phase: P5
action: STARTED
artifact: lib/features/project_management/
description: Starting code generation for Project Management feature (REQ-001 to REQ-006)
status: IN_PROGRESS
```

### Pattern 2: Task Completed

```yaml
timestamp: 2025-12-29T18:45:00Z
robot: Charlie
phase: P5
action: COMPLETED
artifact: lib/features/project_management/
description: Completed code generation for Project Management feature. All widgets, BLoCs, and repositories implemented. Tests passing.
status: SUCCESS
next_robot: Sarah
```

### Pattern 3: Blocked

```yaml
timestamp: 2025-12-29T17:15:00Z
robot: Clara
phase: P3
action: BLOCKED
artifact: ARTIFACTS/07-design-artifacts/api-spec.yaml
description: Cannot complete API design - missing authentication requirements
status: BLOCKED
blocker_details: REQ-005 NonFunctional.Security section is incomplete. Need sponsor clarification on OAuth vs JWT.
next_robot: Roma
```

### Pattern 4: Handoff

```yaml
timestamp: 2025-12-29T19:00:00Z
robot: Reena
phase: P2
action: HANDOFF
artifact: ARTIFACTS/02-analysis/
description: Phase 2 analysis complete. All requirements analyzed, data dictionary created, API specs generated. Ready for design phase.
status: SUCCESS
next_robot: Clara
```

### Pattern 5: Clarification Needed

```yaml
timestamp: 2025-12-29T16:50:00Z
robot: Talib
phase: P1
action: CLARIFICATION_NEEDED
artifact: ARTIFACTS/01-requirements/REQ-015.yaml
description: Ambiguity detected in REQ-015 Actor field. Is "Manager" a ProjectManager or TeamManager?
status: WAITING
blocker_details: OpenQuestions field has unresolved question about Manager role specificity.
```

---

## Validation Checklist

Before logging an activity, verify:

### ✅ Required Fields

- [ ] **timestamp**: ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
- [ ] **robot**: Your robot name (exact match to CLAUDE.md)
- [ ] **phase**: Correct phase (P1, P2, P3, P4, P5, GATE)
- [ ] **action**: Valid action type
- [ ] **description**: Clear, concise, actionable
- [ ] **status**: Accurate current status

### ✅ Conditional Fields

- [ ] **next_robot**: Required if action=HANDOFF or COMPLETED (when work passes to another robot)
- [ ] **blocker_details**: Required if status=BLOCKED or action=CLARIFICATION_NEEDED
- [ ] **artifact**: Included when work affects specific files/deliverables

### ✅ Description Quality

- [ ] Describes WHAT was done (or blocked)
- [ ] Describes WHY (if decision made)
- [ ] Includes relevant IDs (REQ-###, FUNC-###, UC-###, CR-###)
- [ ] Is concise (1-2 sentences)
- [ ] Is actionable (Roma can understand next steps)

---

## Common Mistakes to Avoid

❌ **Don't log trivial actions** (e.g., "Read file X")
✅ **Do log significant milestones** (e.g., "Completed all Tier 1 requirements analysis")

❌ **Don't use vague descriptions** (e.g., "Working on stuff")
✅ **Do be specific** (e.g., "Implementing authentication BLoC for REQ-012")

❌ **Don't forget timestamps**
✅ **Always use ISO 8601** (YYYY-MM-DDTHH:MM:SSZ)

❌ **Don't leave out next_robot on handoffs**
✅ **Always specify who receives work** (enables Roma orchestration)

---

## Activity State Tracking

In addition to activity log, update `activity-state.yaml`:

```yaml
current_phase: P3
active_robot: Clara
last_update: 2025-12-29T16:30:00Z
status: IN_PROGRESS

blockers:
  - robot: Clara
    artifact: api-spec.yaml
    blocker: Missing auth requirements
    reported: 2025-12-29T17:15:00Z

completed_phases:
  - phase: P1
    completed_by: Talib
    completed_at: 2025-12-20T10:00:00Z
  - phase: P2
    completed_by: Reena
    completed_at: 2025-12-25T15:30:00Z

pending_handoffs:
  - from: Reena
    to: Clara
    artifact: ARTIFACTS/02-analysis/
    timestamp: 2025-12-29T19:00:00Z
```

---

## Integration with Roma

Roma (Orchestrator) reads activity logs to:
- Determine which robot to activate next
- Identify blockers requiring sponsor escalation
- Track phase completion
- Validate quality gates
- Coordinate parallel work
- Monitor progress against timeline

**Your logging enables Roma to orchestrate effectively.**

---

## Examples by Robot

### Sarah (Quality Auditor) - Gate Validation

```yaml
timestamp: 2025-12-29T20:00:00Z
robot: Sarah
phase: GATE
action: COMPLETED
artifact: GATE-P2-TO-P3-DECISION.yaml
description: GATE-P2→P3 validation complete. All requirements have full traceability (REQ→FUNC→UC). Data dictionary complete with 60 entities. 2 WARNINGS issued (missing NFR quantification in REQ-018, REQ-022). Overall status: APPROVED with conditions.
status: SUCCESS
next_robot: Clara
```

### Charlie (Code Generator) - Implementation

```yaml
timestamp: 2025-12-29T21:30:00Z
robot: Charlie
phase: P5
action: COMPLETED
artifact: lib/features/task_management/
description: Task Management feature code complete (REQ-007 to REQ-012). Implemented 6 screens, 6 BLoCs, 3 repositories. All widget tests passing (45/45). Integration tests passing (12/12). Applied flutter-best-practices skill for validation.
status: SUCCESS
next_robot: Sarah
```

### Clara (Design Architect) - Design

```yaml
timestamp: 2025-12-29T19:45:00Z
robot: Clara
phase: P3
action: COMPLETED
artifact: ARTIFACTS/07-design-artifacts/
description: Design phase complete. Created component structure (18 screens, 32 widgets), architecture diagram (5-layer), class diagrams (9 entities), API design (25 endpoints). Applied ui-design-patterns skill for cross-platform validation. All ADRs documented (ADR-001 to ADR-005).
status: SUCCESS
next_robot: Talib
```

### Talib (Requirements Engineer) - AORDL

```yaml
timestamp: 2025-12-29T16:00:00Z
robot: Talib
phase: P1
action: COMPLETED
artifact: ARTIFACTS/01-requirements/
description: AORDL requirements complete. Created 25 requirements (REQ-001 to REQ-025) across 4 tiers. All requirements pass STRICT validation. 0 anti-patterns detected. All ambiguities resolved. Requirements catalog and index generated.
status: SUCCESS
next_robot: Sarah
```

### Reena (Analysis Robot) - Analysis

```yaml
timestamp: 2025-12-29T18:00:00Z
robot: Reena
phase: P2
action: COMPLETED
artifact: ARTIFACTS/02-analysis/
description: Analysis phase complete. Analyzed all 25 requirements. Generated data dictionary (60 entities: 9 primary, 51 secondary). Created unified API spec (25 endpoints). Generated test scenarios (75 total). Dependency analysis complete (18 dependencies mapped).
status: SUCCESS
next_robot: Sarah
```

---

## Output Traceability

When this skill is applied, append to activity log:

```yaml
timestamp: [current ISO 8601]
robot: [your robot name]
phase: [current phase]
action: [STARTED|COMPLETED|BLOCKED|etc.]
artifact: [artifact affected]
description: [clear description]
status: [current status]
```

---

## Related Skills

- `rome-protocols` - Understand ROME framework protocols
- `artifact-reading` - Read ROME artifacts correctly

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-12-29
**Applicable To**: All robots
**Priority**: CRITICAL
