---
name: rome-protocols
description: Follow ROME framework protocols for phase transitions, quality gates, handoffs, and sponsor interactions. Use when coordinating with other robots, passing through quality gates, or escalating to sponsor. Ensures consistent framework compliance.
---

# ROME Protocols Skill

## Purpose

Ensure all robots follow standardized ROME framework protocols for coordination, quality assurance, and communication.

## When to Use

Invoke this skill when:
- Transitioning between phases
- Passing through a quality gate
- Handing off work to another robot
- Escalating to sponsor
- Making critical architectural decisions
- Encountering blockers

## Quick Reference

### ROME Phase Flow

```
P0 (Bootup) → P1 (AORDL) → GATE-P1 → P2 (Analysis) → GATE-P2 →
P3 (Design) → GATE-P3 → P4 (Configuration) → GATE-P4 →
P5 (Code Generation) → GATE-P5 → Delivery
```

### Quality Gates (Sarah validates all transitions)

- **GATE-P1**: AORDL validation (all 13 fields, no anti-patterns, ambiguities resolved)
- **GATE-P2**: Requirements coverage (100% AORDL→Features, acceptance criteria defined)
- **GATE-P3**: Design completeness (architecture, API, database, all requirements mapped to use cases)
- **GATE-P4**: Configuration readiness (environment, deployment, security configs valid)
- **GATE-P5**: Code quality (all tests passing, traceability complete, production-ready)

---

## Protocol 1: Phase Handoff

### When Completing Your Phase

1. **Log completion** to activity log
2. **Create handoff document** in your phase artifacts
3. **Notify Roma** (orchestrator)
4. **Wait for quality gate** (Sarah validation)
5. **Do not proceed** until gate approved

### Handoff Document Format

```markdown
# Phase [X] Handoff

**From Robot**: [Your name]
**To Robot**: [Next robot name]
**Phase Completed**: P[X]
**Date**: [ISO 8601 timestamp]

## Deliverables

- [Artifact 1]: [Description]
- [Artifact 2]: [Description]
- [Artifact 3]: [Description]

## Key Decisions

1. [Decision 1]: [Rationale]
2. [Decision 2]: [Rationale]

## Open Items

- [Item 1]: [Status]
- [Item 2]: [Status]

## Next Robot Instructions

[Specific guidance for next robot based on deliverables]
```

---

## Protocol 2: Quality Gate Process

### Before Gate (Your Responsibility)

1. **Self-validate** against gate criteria
2. **Complete all deliverables** for your phase
3. **Resolve all blockers** or escalate
4. **Log completion** with all artifacts listed
5. **Create handoff** document

### At Gate (Sarah's Responsibility)

Sarah validates:
- Deliverable completeness
- Traceability intact (REQ→FUNC→UC→Code chain)
- Quality standards met
- No critical gaps

### Gate Outcomes

**APPROVED**: Proceed to next phase
**APPROVED WITH CONDITIONS**: Proceed but address warnings in parallel
**BLOCKED**: Fix issues before proceeding

### After Gate

If BLOCKED:
1. Review Sarah's gate decision document
2. Address all violations
3. Re-submit for validation
4. Do not proceed until APPROVED

---

## Protocol 3: Sponsor Interaction

### When to Escalate

✅ **Do escalate** when:
- Requirements ambiguous (AORDL OpenQuestions unresolved)
- Conflicting requirements detected
- Critical decision needs business input
- Scope change requested
- Budget/timeline concerns

❌ **Don't escalate** for:
- Technical implementation details (your expertise)
- Minor clarifications (infer from context)
- Standard framework decisions (follow ROME)

### Escalation Format

```yaml
escalation:
  type: [AMBIGUITY | CONFLICT | DECISION | SCOPE_CHANGE | BUDGET]
  priority: [CRITICAL | HIGH | MEDIUM | LOW]
  reported_by: [Your robot name]
  phase: [Current phase]
  artifact: [Affected requirement/deliverable]

  question: |
    [Clear, specific question for sponsor]

  context: |
    [Background: what you're working on, why this matters]

  options: |
    [If applicable: Option A vs Option B with trade-offs]

  recommended_action: |
    [Your professional recommendation with rationale]

  impact_if_unresolved: |
    [What happens if this isn't clarified]
```

---

## Protocol 4: Robot Coordination

### Parallel Work

When multiple robots work in parallel (e.g., Charlie on frontend + Lucien on backend):

1. **Coordinate via activity log**: Log your actions
2. **Share decisions**: Document in shared artifacts
3. **Avoid conflicts**: Claim specific artifacts before working
4. **Sync regularly**: Check activity log for updates from other robots

### Sequential Work

When work is sequential (Talib → Reena → Clara → Talib → Charlie):

1. **Wait for handoff**: Don't start until previous robot completes
2. **Read handoff document**: Understand context and decisions
3. **Validate inputs**: Ensure you received what you need
4. **Ask questions**: If handoff unclear, request clarification via Roma

---

## Protocol 5: Artifact Management

### Artifact Locations

```
ARTIFACTS/
├── 01-requirements/       # P1 (Talib)
├── 02-analysis/           # P2 (Reena)
├── 03-bdd-features/       # P1/P2 (Talib/Reena)
├── 04-test-scenarios/     # P2 (Reena)
├── 05-api-specs/          # P2 (Reena)
├── 06-database-schema/    # P2 (Reena)
├── 07-design-artifacts/   # P3 (Clara)
├── 08-configuration/      # P4 (Talib)
├── 09-code-generation/    # P5 (Charlie/Lucien)
├── activity-log.txt       # All robots
├── activity-state.yaml    # All robots
└── gate-decisions/        # Sarah
```

### Artifact Naming

- Requirements: `REQ-###.yaml` (3-digit zero-padded)
- Features: `FUNC-###` (from analysis)
- Use Cases: `UC-###` (from design)
- Change Requests: `CR-###.yaml`
- Gate Decisions: `GATE-P[X]-TO-P[Y]-DECISION.yaml`

### Artifact Ownership

- **Read-only**: Other robots' deliverables (don't modify)
- **Read-write**: Your phase artifacts
- **Append-only**: activity-log.txt, activity-state.yaml

---

## Protocol 6: Traceability

### Requirement Traceability Chain

```
REQ-### (P1) → FUNC-### (P2) → UC-### (P3) → Workspace (P4) → Code (P5)
```

### Maintaining Traceability

**In AORDL (P1 - Talib)**:
```yaml
ID: REQ-001
Intent: create project
# ... other fields
```

**In Features (P2 - Reena)**:
```yaml
feature:
  id: FUNC-001
  source_requirement: REQ-001
  # ...
```

**In Use Cases (P3 - Clara)**:
```yaml
use_case:
  id: UC-001
  implements_feature: FUNC-001
  source_requirement: REQ-001
  # ...
```

**In Code (P5 - Charlie)**:
```dart
/// Project creation screen
/// Implements UC-001 (Create Project Use Case)
/// Source: REQ-001 (create project)
class ProjectCreateScreen extends StatefulWidget {
  // ...
}
```

### Traceability Validation

At each gate, Sarah verifies:
- All REQ-### have corresponding FUNC-###
- All FUNC-### have corresponding UC-###
- All UC-### have corresponding code
- No orphaned artifacts (code without traceability)

---

## Protocol 7: Change Management (ROME-PROP-015)

### When Requirements Change

1. **Create Change Request** (CR-###.yaml)
2. **Impact Analysis**: Which REQ/FUNC/UC/Code affected?
3. **Approval**: Roma coordinates, Sarah approves
4. **Implementation**: Responsible robots update artifacts
5. **Embed Metadata**: Add changeHistory to all affected files
6. **Validation**: Sarah verifies traceability intact

### Change Metadata Format

```yaml
changeHistory:
  - changeRequest: CR-001
    date: 2025-12-26T14:00:00Z
    type: TERMINOLOGY_CHANGE
    changes:
      - field: Intent
        oldValue: manage_company
        newValue: manage_organisation
```

---

## Common Mistakes to Avoid

❌ **Don't skip quality gates** (Sarah must validate all transitions)
❌ **Don't modify other robots' artifacts** (read-only unless coordinated)
❌ **Don't proceed without handoff** (wait for previous robot to complete)
❌ **Don't forget activity logging** (Roma needs visibility)
❌ **Don't break traceability** (always link REQ→FUNC→UC→Code)

✅ **Do wait for gate approval** before starting next phase
✅ **Do log all significant actions** to activity log
✅ **Do maintain traceability** in all artifacts
✅ **Do escalate ambiguities** to sponsor via Roma
✅ **Do coordinate** with other robots via activity log

---

## Robot-Specific Protocol Notes

### Talib (Requirements Engineer)
- Creates REQ-### in P1
- Creates configuration in P4
- Must pass GATE-P1 before Reena starts P2
- Must pass GATE-P4 before Charlie starts P5

### Reena (Analysis Robot)
- Consumes REQ-### from P1
- Creates FUNC-### in P2
- Must pass GATE-P2 before Clara starts P3

### Clara (Design Architect)
- Consumes FUNC-### from P2
- Creates UC-### in P3
- Must pass GATE-P3 before Talib starts P4

### Charlie (Code Generator)
- Consumes UC-### from P3
- Consumes configuration from P4
- Creates code in P5
- Must pass GATE-P5 before delivery

### Sarah (Quality Auditor)
- Validates all gates
- Can BLOCK any phase transition
- Reports to Roma
- Approves final delivery

### Roma (Orchestrator)
- Coordinates all robots
- Monitors activity log
- Escalates to sponsor
- Manages timeline and priorities

---

## Related Skills

- `activity-logging` - Log activities correctly
- Robot-specific skills for each robot's role

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-12-29
**Applicable To**: All robots
**Priority**: CRITICAL
