# ROME Robot Baseline: Common Governance & Operations

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-BASELINE |
| **Version** | 1.0 |
| **Date** | 2025-12-19T17:00:00Z |
| **Status** | Draft |
| **Document Type** | Governance |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Consolidates common governance rules, operational patterns, and standards shared by ALL robots. Robot CLAUDE.md files reference this baseline to eliminate repetitive boilerplate (40% token reduction target).

---

## Scope

Applies to ALL robots operating within ROME framework. Robot-specific CLAUDE.md files MUST reference this baseline and document only role-specific deviations and procedures.

---

## Dependencies

| UID | Document | Content |
|-----|----------|---------|
| ROME-PRIN-001 | Core Principles | Framework principles all robots must follow |
| ROME-LEX-001 | Lexicon | Framework terminology |
| ROME-PROC-005 | Activity Logging Protocol | Mandatory logging procedures |
| ROME-GOV-001 | Document Standards | Document formatting and structure |

---

## Robot Definition Structure

All robot CLAUDE.md files MUST follow this structure:

```markdown
# [Robot Name] Robot: Role Definition

[Metadata Table]

## Purpose
[Robot-specific purpose - HOW this robot executes its assigned phase(s)]

## Dependencies
[Phase-specific + ROME-GOV-BASELINE]

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

**Reference this baseline:**
```markdown
## Governance Baseline

This robot operates under ROME-GOV-BASELINE. Common rules:
- Activity logging per ROME-PROC-005
- State access per ROME-PROC-005 §2 (State Access Standard)
- MCP tool usage per ROME-GOV-BASELINE §6
- Coordination patterns per ROME-GOV-BASELINE §7
```

---

## Common Dependencies

All robots inherit these dependencies (no need to repeat in individual CLAUDE.md):

| UID | Document | Purpose |
|-----|----------|---------|
| ROME-GOV-BASELINE | robot-baseline.md | Common governance (this doc) |
| ROME-PROC-005 | activity-logging-protocol.md | Logging requirements |
| ROME-LEX-001 | lexicon.md | Framework terminology |
| ROME-PRIN-001 | Core Principles | Framework principles |

---

## Universal Operational Rules

### Mandatory Behaviors

**ALL robots MUST:**
- Log activity per ROME-PROC-005 (no exceptions)
- Use state access patterns per ROME-PROC-005 §2
- Report blockers immediately when encountered
- Verify phase entry criteria before starting work
- Create handover documents when transitioning to downstream robots
- Coordinate via Roma for cross-robot dependencies
- Use MCP tools for mutations (never edit files manually)

**ALL robots MUST NOT:**
- Work outside assigned phase(s)
- Skip activity logging
- Modify other robots' outputs without amendment approval
- Proceed when blocked (must log blocker and coordinate)
- Cache state across operations (always read fresh)
- Edit activity-log.txt or activity-state.yaml manually

### Logging Triggers

Per ROME-PROC-005, log events for:
- Work start (status → IN_PROGRESS)
- Blocker encountered (create BLOCKER entry, status → BLOCKED)
- Blocker resolved (status → IN_PROGRESS)
- Work completion (status → COMPLETED)
- Amendment requests (create AMENDMENT entry)
- Phase transitions (PHASE entry → COMPLETED)

### Error Handling

**If MCP tools fail:**
1. Retry operation once
2. If retry fails, create blocker entry
3. Report to Roma
4. Do not proceed until resolved

**If phase entry criteria not met:**
1. Create blocker entry documenting missing criteria
2. Report to Roma
3. Wait for resolution (do not proceed)

**If conflicting requirements discovered:**
1. Create blocker entry
2. Request sponsor clarification via Roma
3. Log in activity log for traceability

---

## State Access Patterns

Per ROME-PROC-005 §2 (State Access Standard):

### For Monitoring & Status Checks
```javascript
// Read state file directly (10x faster)
const state = Read("ARTIFACTS/activity-state.yaml")

// Query by status
const blockers = state.by_status.BLOCKED

// Query by robot
const myWork = state.by_robot.[robot_name]

// Query by phase
const phaseWork = state.by_phase["[N]"]
```

### For Mutations
```javascript
// ALWAYS use MCP for mutations
mcp__activity-log__append({
  type: "[TYPE]",
  id: "[ID]",
  attributes: {[key]: [value]}
})
// State automatically rebuilt
```

### For Historical Analysis
```javascript
// Use MCP to query event log
const history = mcp__activity-log__get_history({id: "[ID]"})
```

---

## MCP Tool Usage

### Activity Log

**Recommended (Fast):**
```javascript
// Direct YAML read for monitoring
const state = Read("ARTIFACTS/activity-state.yaml")
```

**Required (Mutations):**
```javascript
// Append event
mcp__activity-log__append({type, id, attributes})

// Get history
mcp__activity-log__get_history({id})

// Get statistics
mcp__activity-log__get_statistics()
```

### Seez (Sponsor Interaction)

```javascript
// Show document
mcp__Seez__show_doc({label, content})

// Show chart
mcp__Seez__show_chart({content, label})

// Ask questions (with alternative answer support per ROME-PRIN-002)
mcp__Seez__ask_questions({
  label,
  title,
  questions: [
    {
      id, type, label, required, options,
      multiSelect: false
    },
    // MANDATORY: Alternative answer field
    {
      id: "question_id_alt",
      type: "textarea",
      label: "Alternative or additional context",
      required: false
    }
  ]
})
```

### File Operations

**Read:**
```javascript
Read("path/to/file")
```

**Edit (existing files only):**
```javascript
Edit({
  file_path: "absolute/path",
  old_string: "[exact text]",
  new_string: "[replacement]"
})
```

**Write (new files):**
```javascript
Write({
  file_path: "absolute/path",
  content: "[file contents]"
})
```

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

Per ROME-PROC-002 (Sponsor Interaction Protocol):

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
mcp__Seez__ask_questions({...})

// Use show_doc for status updates
mcp__Seez__show_doc({
  label: "Status Update",
  content: "..."
})
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

## Quality Standards

### Code Quality (P5 Robots)

- Follow language-specific best practices
- Include error handling at system boundaries
- Use environment variables for configuration
- Never hardcode secrets
- Write tests for critical logic
- Document non-obvious decisions

### Artifact Quality (All Robots)

- Artifacts MUST be complete (no TODOs, no placeholders)
- Artifacts MUST be valid (YAML validates, markdown renders)
- Artifacts MUST follow framework formatting standards
- Artifacts MUST be traceable to source requirements

### Documentation Quality

- Handover documents MUST be complete
- Decisions MUST be documented with rationale
- Complex logic MUST be explained
- Assumptions MUST be stated explicitly

---

## Success Criteria Template

Robot CLAUDE.md files SHOULD include success criteria following this pattern:

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

## Common Startup Procedure

All robots follow this pattern on initialization:

```javascript
ROBOT_STARTUP:
  // 1. Verify project structure
  projectConfig = Read(".rome-project.json")
  if !projectConfig.exists:
    FAIL("Project not initialized")

  // 2. Verify MCP connection
  stats = mcp__activity-log__get_statistics()
  if !stats.success:
    FAIL("Activity log MCP not responding")

  // 3. Check phase assignment
  state = Read("ARTIFACTS/activity-state.yaml")
  assignedPhase = state.phases["PHASE-[N]"]
  if assignedPhase.robot != MY_ROBOT_NAME:
    FAIL("Not assigned to this phase")

  // 4. Verify entry criteria
  CHECK_ENTRY_CRITERIA_PER_PHASE_GUIDELINES()

  // 5. Log phase start
  mcp__activity-log__append({
    type: "PHASE_START",
    id: "PHASE-[N]",
    attributes: {
      status: IN_PROGRESS,
      robot: MY_ROBOT_NAME,
      start: NOW
    }
  })

  PROCEED_WITH_PHASE_WORK
```

---

## Common Completion Procedure

All robots follow this pattern on phase completion:

```javascript
PHASE_COMPLETION:
  // 1. Verify all work completed
  state = Read("ARTIFACTS/activity-state.yaml")
  myWork = state.by_robot[MY_ROBOT_NAME]
  openWork = myWork.filter(w => w.status != COMPLETED)
  if openWork.length > 0:
    FAIL("Cannot complete phase with open work items")

  // 2. Verify no open blockers
  blockers = state.by_status.BLOCKED
  myBlockers = blockers.filter(b => b.robot == MY_ROBOT_NAME)
  if myBlockers.length > 0:
    FAIL("Cannot complete phase with open blockers")

  // 3. Create handover document
  CREATE_HANDOVER_DOCUMENT()

  // 4. Log phase completion
  mcp__activity-log__append({
    type: "PHASE_COMPLETE",
    id: "PHASE-[N]",
    attributes: {
      status: COMPLETED,
      robot: MY_ROBOT_NAME,
      completed: NOW,
      handover: "[handover-file-path]"
    }
  })

  // 5. Notify Roma
  NOTIFY_ROMA_PHASE_COMPLETE()
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

## References

- **ROME-PRIN-001:** Core Principles
- **ROME-LEX-001:** Lexicon
- **ROME-PROC-005:** Activity Logging Protocol
- **ROME-PROC-002:** Sponsor Interaction Protocol
- **ROME-GOV-001:** Document Standards
