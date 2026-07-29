# ROME Robot Baseline: Universal Operations (Tier A)

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-BASELINE-A |
| **Version** | 1.0 |
| **Date** | 2026-02-24T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Operational |
| **Author** | Framework Analyst & Architect |
| **Derived From** | ROME-GOV-BASELINE v1.1 |

---

## Purpose

Universal operational rules for ALL robots. Covers activity logging, startup/completion procedures, state access, MCP tool usage, working documents, and handover patterns.

---

## Scope

ALL 10 robots. Robot-specific ROBOT.md files reference this baseline and document only role-specific deviations.

---

## Dependencies

| UID | Document | Purpose |
|-----|----------|---------|
| ROME-PROC-005 | Activity Logging Protocol | Mandatory logging procedures |
| ROME-LEX-001 | Lexicon | Framework terminology |

---

## Universal Operational Rules

### Mandatory Behaviors

**ALL robots MUST:**
- Log activity per ROME-PROC-005 (no exceptions)
- Use state access patterns per ROME-PROC-005 §2
- Report blockers immediately when encountered
- Verify phase entry criteria before starting work
- Create handover documents when transitioning to downstream robots
- Use MCP tools for mutations (never edit activity files manually)

**ALL robots MUST NOT:**
- Work outside assigned phase(s)
- Skip activity logging
- Modify other robots' outputs without amendment approval
- Proceed when blocked (must log blocker and coordinate)
- Cache state across operations (always read fresh)
- Edit activity-log.txt manually

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

---

## State Access Patterns

Per ROME-PROC-005 §2 (State Access Standard):

### For Monitoring & Status Checks
```javascript
// Query activity log via MCP
const state = mcp__activity-log-file__query({})

// Query by status
const blockers = mcp__activity-log-file__query({status: "BLOCKED"})

// Query by robot
const myWork = mcp__activity-log-file__query({robot: "[robot_name]"})

// Query by phase
const phaseWork = mcp__activity-log-file__query({phase: "[N]"})
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
// Query activity log via MCP
const state = mcp__activity-log-file__query({})
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

## Working Documents vs Formal Artifacts

### Robot Workspace Structure

```
robots/<robot_name>/
  ├── CLAUDE.md           # Role definition (permanent)
  ├── .claude/            # Claude Code settings
  └── notes/              # Working documents (ephemeral)
      ├── current_work.md
      ├── completed.md
      └── blockers.md
```

### Working Documents (Ephemeral)

**Location:** `robots/<robot_name>/notes/`

**Use for:** Scratch analysis, drafts, temporary planning, reasoning traces, session state.

**Characteristics:** Not version-controlled, not referenced by other robots, not visible to sponsor, no formatting requirements.

### Formal Artifacts (Permanent)

**Location:** Phase-specific folders under `ARTIFACTS/`

**Use for:** Phase deliverables, documents consumed downstream, sponsor-visible artifacts.

**Phase Deliverable Locations:**
```
ARTIFACTS/
  ├── _requirements/    # P1 formal outputs
  ├── _analysis/        # P2 formal outputs
  ├── _design/          # P3 formal outputs
  └── _config/          # P4 formal outputs

SOURCE/                 # P5 formal outputs
```

### Decision Criteria

- "Will another robot need this?" → YES: `ARTIFACTS/` | NO: `notes/`
- "Does this meet phase exit criteria?" → YES: `ARTIFACTS/` | NO: `notes/`
- Draft in `notes/`, promote to `ARTIFACTS/` when ready

---

## Common Startup Procedure

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
  state = mcp__activity-log-file__query({})
  assignedPhase = state.phases["PHASE-[N]"]

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

```javascript
PHASE_COMPLETION:
  // 1. Verify all work completed
  state = mcp__activity-log-file__query({robot: MY_ROBOT_NAME})
  myWork = state
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

## Quality Standards

### Code Quality (P5 Robots)

- Follow language-specific best practices
- Include error handling at system boundaries
- Use environment variables for configuration
- Never hardcode secrets
- Write tests for critical logic

### Artifact Quality (All Robots)

- Artifacts MUST be complete (no TODOs, no placeholders)
- Artifacts MUST be valid (YAML validates, markdown renders)
- Artifacts MUST be traceable to source requirements

---

## References

- **ROME-PROC-005:** Activity Logging Protocol
- **ROME-LEX-001:** Lexicon
