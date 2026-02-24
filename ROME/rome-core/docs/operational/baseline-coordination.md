# ROME Robot Baseline: Coordination (Tier B)

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-BASELINE-B |
| **Version** | 1.0 |
| **Date** | 2026-02-24T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Operational |
| **Author** | Framework Analyst & Architect |
| **Derived From** | ROME-GOV-BASELINE v1.1 |

---

## Purpose

Coordination patterns for robots that manage phase transitions, sponsor interactions, or cross-robot dependencies. Extends Tier A (baseline-universal.md).

---

## Scope

Roma, Sarah, Talib, PMA, Lucien. These robots coordinate with other robots, interact with the sponsor, or manage phase boundaries.

---

## Prerequisites

| UID | Document | Purpose |
|-----|----------|---------|
| ROME-GOV-BASELINE-A | baseline-universal.md | Universal operations (required) |
| ROME-GOV-006 | sponsor-interaction.md | Sponsor interaction governance |

---

## Coordination Patterns

### Upstream Robot Handoff

**Receiving work from upstream robot:**
1. Read handover document (e.g., `phase2-handover.md`)
2. Verify all required artifacts present
3. If missing artifacts: Create blocker, report to Roma
4. Log phase start in activity log
5. Begin work

### Downstream Robot Handoff

**Handing off to downstream robot:**
1. Create handover document (e.g., `phase3-handover.md`)
2. List all artifacts produced
3. Document any blockers/issues encountered
4. Document decisions made and rationale
5. Log phase completion
6. Notify Roma

### Cross-Robot Dependencies (P5)

**If dependent on another robot's output:**
1. Check activity-state.yaml for dependency status
2. If dependency COMPLETED: Proceed
3. If dependency BLOCKED or IN_PROGRESS: Create blocker, wait
4. Coordinate via state file polling (not direct communication)
5. Roma escalates critical cross-robot issues

---

## Sponsor Interaction Protocol

Per ROME-GOV-006 (Sponsor Interaction):

### When to Engage Sponsor

- Ambiguous requirements (cannot proceed without clarification)
- Conflicting requirements (discovered contradictions)
- Missing critical information (blockers preventing progress)
- Design decisions with significant impact (requires sponsor approval)
- Phase gate approvals (Roma coordinates, specific robots may support)

### How to Engage

**Via Roma:**
Most sponsor interactions coordinated through Roma (orchestrator)

**Direct (if authorized):**
```javascript
// Use Seez for questions
mcp__Seez__ask_questions({
  label, title,
  questions: [
    {id, type, label, required, options},
    // MANDATORY: Alternative answer field
    {
      id: "question_id_alt",
      type: "textarea",
      label: "Alternative or additional context",
      required: false
    }
  ]
})

// Use show_doc for status updates
mcp__Seez__show_doc({label: "Status Update", content: "..."})
```

**Always log interaction:**
```javascript
mcp__activity-log__append({
  type: "SPONSOR_INTERACTION",
  id: "SPONSOR-[NUM]",
  attributes: {
    question: "[question asked]",
    response: "[sponsor response]",
    robot: "[robot_name]",
    created: NOW
  }
})
```

---

## Amendment Handling

When robot needs to amend prior phase output:

```javascript
REQUEST_AMENDMENT:
  // 1. Create amendment entry
  mcp__activity-log__append({
    type: "AMENDMENT",
    id: "AMD-[NUM]",
    attributes: {
      title: "[What needs changing]",
      description: "[Why needed]",
      requestedBy: MY_ROBOT_NAME,
      targetPhase: "[PHASE-NUMBER]",
      status: PENDING_REVIEW,
      created: NOW
    }
  })

  // 2. Coordinate with Roma
  REPORT_TO_ROMA("Amendment requested: AMD-[NUM]")

  // 3. Wait for approval
  WAIT_FOR_STATUS(AMD-[NUM], APPROVED)

  // 4. If approved, make change and log
  if amendment.status == APPROVED:
    MAKE_CHANGE()
    mcp__activity-log__append({
      type: "AMENDMENT_COMPLETE",
      id: "AMD-[NUM]",
      attributes: {status: COMPLETED, completed: NOW}
    })
```

---

## Conflicting Requirements

**If conflicting requirements discovered:**
1. Create blocker entry
2. Request sponsor clarification via Roma
3. Log in activity log for traceability

---

## References

- **ROME-GOV-BASELINE-A:** Universal Operations (Tier A)
- **ROME-GOV-006:** Sponsor Interaction
- **ROME-PRIN-001:** Core Principles
