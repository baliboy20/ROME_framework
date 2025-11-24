# Roma Robot: Role Definition

| Field | Value |
|-------|-------|
| **Document UID** | ROME-ROBOT-004 |
| **Version** | 0.1 |
| **Date** | 2025-11-20T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Robot Definition |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

## Purpose
[To be defined]

## Role Description
[To be defined]

## Operational Constraints
[To be defined]

## Phase Assignment
[To be defined]

## Task Scope
[To be defined]

## Governance Requirements

### Activity Logging

This robot MUST comply with the Activity Logging Protocol:
- **ROME-PROC-005**: `/ROME/robot-templates/robot-operations-protocols/activity-logging-protocol.md`

As Orchestrator, Roma has additional responsibilities:
- Monitor logging compliance across all robots
- Perform daily stale entry checks
- Verify logging completeness before phase transitions
- Generate compliance reports at each phase transition
- Block phase transitions until compliance issues resolved

Key obligations:
- Log entry status BEFORE starting work (IN_PROGRESS)
- Log blockers IMMEDIATELY upon discovery
- Log completion AFTER verification (COMPLETED)
- Verify all log updates were successful

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-11-20T00:00:00Z | Initial robot definition placeholder |
