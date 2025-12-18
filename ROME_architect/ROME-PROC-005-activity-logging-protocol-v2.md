# Robot Operations Governance: Activity Logging Protocol

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROC-005 |
| **Version** | 2.0 |
| **Date** | 2025-12-18T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Procedure |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines mandatory procedures for all robots to record activity status using the event log system. Ensures accurate project state visibility, enables effective robot coordination, and maintains traceability as required by ROME-PRIN-001 Principle 2.

## Scope

Applies to ALL robots during ALL phases. This protocol is NON-OPTIONAL.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Principle 2: Traceability, Principle 5: Central Orchestration
- ROME-PROC-002 (Sponsor Interaction) - Sponsor interaction logging requirements
- ROME-LEX-001 (Lexicon) - Activity tracking terminology
- ROME-GOV-008 (Activity Log Format) - Event log format specification
- activity-log-file MCP server - Event log file system

---

## Activity Log System

### Overview

ROME v10 uses an append-only event log system for activity tracking. All activity is recorded as timestamped events in `ARTIFACTS/activity-log.txt`, with current state auto-generated in `ARTIFACTS/activity-state.yaml`.

**Key Characteristics:**
- Append-only (never edit previous lines)
- Complete audit trail (all state transitions recorded)
- Git-trackable (version controlled)
- Human-readable (plain text)
- No database dependency

### File Locations

**Event Log (Source of Truth):**
- Path: `ARTIFACTS/activity-log.txt`
- Format: Append-only timestamped events
- Never edit previous lines, only append new events

**State Index (Generated):**
- Path: `ARTIFACTS/activity-state.yaml`
- Format: YAML current state
- Auto-generated from event log
- Disposable (can regenerate anytime)

### Entry Types

| Type | Description | ID Pattern |
|------|-------------|------------|
| PHASE | Phase transitions | PHASE-# |
| FEATURE | Feature work | FEAT-### |
| STORY | User story | STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER] |
| BLOCKER | Issue preventing progress | BLOCK-### |
| AMENDMENT | Change request to prior phase | AMD-### |

### Status Values

| Entry Type | Valid Statuses |
|------------|----------------|
| PHASE, FEATURE, STORY | PENDING, IN_PROGRESS, COMPLETED, BLOCKED |
| BLOCKER | OPEN, ESCALATED, RESOLVED |
| AMENDMENT | PENDING_REVIEW, APPROVED, REJECTED |

---

## Mandatory Logging Events

### Trigger Points

| Event | Required Action | Timing |
|-------|-----------------|--------|
| Work assigned | Create entry (append event) | BEFORE starting work |
| Start work | Append IN_PROGRESS event | IMMEDIATELY when starting |
| Progress milestone | Optional append for major changes | At significant milestones |
| Blocker encountered | Append BLOCKER event + BLOCKED event | IMMEDIATELY upon discovery |
| Blocker resolved | Append RESOLVED event + IN_PROGRESS event | IMMEDIATELY upon resolution |
| Work completed | Append COMPLETED event | AFTER verification, SAME turn |
| Amendment needed | Append AMENDMENT event | BEFORE requesting approval |
| Phase transition | Append phase COMPLETED event | AFTER exit criteria verified |

### Timing Rules

**Immediate (Same Conversation Turn):**
- ALL event appends for status transitions
- Blocker creation
- Amendment creation

**Pre-Action (Before Starting):**
- Work item entry creation (if doesn't exist)
- Work claim via IN_PROGRESS event

**Post-Action (After Verification):**
- Work completion

---

## Logging Procedures

### 1. Starting Work on an Entry

**Before beginning ANY implementation work:**

```
Step 1: Append IN_PROGRESS event
  → mcp__activity-log__append({
      type: "STORY",
      id: "[ENTRY-ID]",
      attributes: {
        status: "IN_PROGRESS",
        robot: "[YOUR-ROBOT-NAME]",
        started: "[ISO-8601-TIMESTAMP]"
      }
    })

Step 2: Verify append successful
  → Read last 3 lines of ARTIFACTS/activity-log.txt
  → Confirm your event appears with correct timestamp

Step 3: THEN begin implementation work
```

**Example:**
```javascript
// Ashok starts database story
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "IN_PROGRESS",
    robot: "ashok",
    started: "2025-12-03T10:00:00Z"
  }
})

// Verify
// Check: activity-log.txt last line shows event
```

---

### 2. Encountering a Blocker

**IMMEDIATELY upon discovering a blocker:**

```
Step 1: Append blocker OPEN event
  → mcp__activity-log__append({
      type: "BLOCKER",
      id: "BLOCK-[NEXT-NUMBER]",
      attributes: {
        status: "OPEN",
        severity: "[CRITICAL|HIGH|MEDIUM|LOW]",
        feature: "[FEAT-###]",
        story: "[STORY-ID]",
        robot: "[YOUR-ROBOT-NAME]",
        title: "[What is blocked and why]",
        created: "[ISO-8601-TIMESTAMP]"
      }
    })

Step 2: Append BLOCKED event for affected entry
  → mcp__activity-log__append({
      type: "STORY",
      id: "[BLOCKED-ENTRY-ID]",
      attributes: {
        status: "BLOCKED",
        robot: "[YOUR-ROBOT-NAME]",
        blocker: "BLOCK-[NUMBER]"
      }
    })

Step 3: Report blocker to orchestrator (Roma)
```

**Example:**
```javascript
// Reena encounters blocker
mcp__activity-log__append({
  type: "BLOCKER",
  id: "BLOCK-001",
  attributes: {
    status: "OPEN",
    severity: "MEDIUM",
    feature: "FEAT-001",
    story: "STORY-001-001-1-api",
    robot: "reena",
    title: "API design unclear on error codes",
    created: "2025-12-03T14:00:00Z"
  }
})

// Mark story blocked
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-api",
  attributes: {
    status: "BLOCKED",
    robot: "reena",
    blocker: "BLOCK-001"
  }
})
```

---

### 3. Resolving a Blocker

**IMMEDIATELY upon resolving a blocker:**

```
Step 1: Append blocker RESOLVED event
  → mcp__activity-log__append({
      type: "BLOCKER",
      id: "BLOCK-[NUMBER]",
      attributes: {
        status: "RESOLVED",
        robot: "[RESOLVER-ROBOT]",
        resolution: "[How it was resolved]",
        resolved: "[ISO-8601-TIMESTAMP]"
      }
    })

Step 2: Append IN_PROGRESS event for previously blocked entry
  → mcp__activity-log__append({
      type: "STORY",
      id: "[PREVIOUSLY-BLOCKED-ENTRY-ID]",
      attributes: {
        status: "IN_PROGRESS",
        robot: "[YOUR-ROBOT-NAME]"
      }
    })

Step 3: Resume work on entry
```

**Example:**
```javascript
// Roma resolves blocker
mcp__activity-log__append({
  type: "BLOCKER",
  id: "BLOCK-001",
  attributes: {
    status: "RESOLVED",
    robot: "roma",
    resolution: "PMA clarified: use standard HTTP codes",
    resolved: "2025-12-03T15:00:00Z"
  }
})

// Reena resumes work
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-api",
  attributes: {
    status: "IN_PROGRESS",
    robot: "reena"
  }
})
```

---

### 4. Completing Work

**AFTER verifying implementation is complete:**

```
Step 1: Verify work meets acceptance criteria
  → (Implementation verification)

Step 2: Append COMPLETED event
  → mcp__activity-log__append({
      type: "STORY",
      id: "[ENTRY-ID]",
      attributes: {
        status: "COMPLETED",
        robot: "[YOUR-ROBOT-NAME]",
        completed: "[ISO-8601-TIMESTAMP]"
      }
    })

Step 3: Verify append successful
  → Read last 3 lines of ARTIFACTS/activity-log.txt
  → Confirm COMPLETED event appears

Step 4: Report completion to orchestrator
```

**Example:**
```javascript
// Ashok completes database story
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "COMPLETED",
    robot: "ashok",
    completed: "2025-12-03T12:00:00Z"
  }
})
```

---

### 5. Requesting an Amendment

**BEFORE seeking approval for a change:**

```
Step 1: Append amendment PENDING_REVIEW event
  → mcp__activity-log__append({
      type: "AMENDMENT",
      id: "AMD-[NEXT-NUMBER]",
      attributes: {
        status: "PENDING_REVIEW",
        severity: "[CRITICAL|HIGH|MEDIUM|LOW]",
        feature: "[FEAT-###]",
        targetPhase: "[PHASE-NUMBER]",
        robot: "[YOUR-ROBOT-NAME]",
        requestedBy: "[YOUR-ROBOT-NAME]",
        title: "[What needs to change and why]"
      }
    })

Step 2: Request approval from Roma or relevant robot

Step 3: When approved, Roma appends APPROVED event
  → mcp__activity-log__append({
      type: "AMENDMENT",
      id: "AMD-[NUMBER]",
      attributes: {
        status: "APPROVED",
        robot: "roma",
        approvedBy: "roma"
      }
    })
```

**Example:**
```javascript
// Reena requests amendment
mcp__activity-log__append({
  type: "AMENDMENT",
  id: "AMD-001",
  attributes: {
    status: "PENDING_REVIEW",
    severity: "MEDIUM",
    feature: "FEAT-001",
    targetPhase: 3,
    robot: "reena",
    requestedBy: "reena",
    title: "Add pagination to API design"
  }
})
```

---

## Verification Requirements

### After Every Event Append

You MUST verify the append was successful:

```
→ Read last 5 lines of ARTIFACTS/activity-log.txt
→ Confirm your event appears with correct timestamp and attributes
```

**OR use MCP query:**
```javascript
→ mcp__activity-log__get_history({ id: "[ENTRY-ID]" })
→ Confirm latest event matches what you appended
```

### If Verification Fails

1. **Retry** the append operation
2. **Report** failure to orchestrator (Roma)
3. **Do not proceed** with work until logging confirmed
4. **Document** logging failure in session notes

---

## Orchestrator Compliance Monitoring

### Roma's Responsibilities

Roma (Orchestrator) monitors logging compliance through:

1. **Daily State Rebuild**
   - Rebuild state index from event log
   - Validate event count vs. yesterday
   - Check for anomalies

2. **Daily Stale Entry Check**
   - Query entries with last_update > 24 hours old
   - Query entries IN_PROGRESS with no recent activity
   - Flag for robot follow-up

3. **Phase Transition Audit**
   - Before approving phase transition:
     - All entries for phase must be COMPLETED or explicitly deferred
     - No OPEN blockers
     - No PENDING_REVIEW amendments
     - All timestamps valid

4. **Compliance Report**
   - Generated at each phase transition
   - Lists: stale entries, status mismatches, unresolved blockers
   - Phase transition BLOCKED until issues resolved

### Compliance Queries

```javascript
// Rebuild state (daily)
mcp__activity-log__rebuild_state()

// Find stale entries
const state = Read("ARTIFACTS/activity-state.yaml")
const inProgress = state.by_status.IN_PROGRESS
// Filter entries where last_update > 24 hours ago

// Find open blockers
mcp__activity-log__query({ status: "OPEN" })

// Find pending amendments
mcp__activity-log__query({ status: "PENDING_REVIEW" })

// Get statistics
mcp__activity-log__get_statistics()
```

---

## Quality Gate Integration

### Phase Exit Criteria: Logging Completeness

Before ANY phase transition, Roma verifies:

| Check | Requirement | Blocking? |
|-------|-------------|-----------|
| Entry Completeness | All work items have events in log | Yes |
| Status Accuracy | No IN_PROGRESS without recent update | Yes |
| Blocker Resolution | All blockers RESOLVED or ESCALATED | Yes |
| Amendment Disposition | All amendments APPROVED or REJECTED | Yes |
| Timestamp Integrity | All events have valid timestamps | Warning |
| Event Log Integrity | No corrupted lines in activity-log.txt | Warning |

**Phase transition is BLOCKED until all blocking checks pass.**

---

## Error Handling

### Activity Log File Unavailable

If activity-log.txt is missing or unwritable:

1. **Check** ARTIFACTS directory exists
   - Create if missing: `mkdir -p ARTIFACTS`
2. **Check** file permissions
3. **Create** file with header if missing
4. **Report** to orchestrator immediately
5. **Buffer** intended events in session notes
6. **Reconcile** when file accessible

### Corrupted Event Log

If activity-log.txt contains malformed lines:

1. **Identify** corrupted line(s) via parsing error
2. **Do NOT delete** - comment with `#CORRUPTED:` prefix
3. **Append** corrected event
4. **Rebuild** state index via `rebuild_state()`
5. **Report** to Roma for manual review

**Example:**
```
# Original corrupted line
2025-12-03T10:00:00Z | STORY | STORY-001 | stat�s:IN_PROGRESS

# After recovery
#CORRUPTED: 2025-12-03T10:00:00Z | STORY | STORY-001 | stat�s:IN_PROGRESS
2025-12-03T10:01:00Z | STORY | STORY-001 | status:IN_PROGRESS | robot:ashok
```

### Missing State Index

If activity-state.yaml is missing:

1. **Rebuild** via `mcp__activity-log__rebuild_state()`
2. **Verify** regeneration successful
3. **Continue** normal operations

### Duplicate Event (Same Timestamp + ID)

If you accidentally append duplicate event:

1. **Leave** event in log (append-only rule)
2. **Latest** event for ID wins in state reconstruction
3. **No action** needed (state builder handles duplicates)

### Missing Entry

If work performed without logging:

1. **Append** event retroactively with accurate timestamp
2. **Add note** in session indicating retroactive log
3. **Report** to orchestrator
4. **Rebuild** state index

---

## Best Practices

### Do

- Append events IMMEDIATELY, within same conversation turn
- VERIFY append success before proceeding
- Use accurate timestamps (not current time for backdated events)
- Include meaningful titles and descriptions
- Reference related items (parent feature, blocker ID)
- Use consistent robot identifiers
- Rebuild state index when uncertain about current state

### Don't

- Edit or delete previous events
- Delay logging until end of session
- Assume append succeeded without verification
- Leave entries IN_PROGRESS when blocked
- Create blocker events AFTER attempting workarounds
- Forget to resolve blockers when issue fixed
- Skip logging for "small" tasks
- Manually edit activity-state.yaml (auto-generated file)

---

## Event Log Format Reference

### Event Line Format

```
TIMESTAMP | TYPE | ID | ATTR1:VALUE1 | ATTR2:VALUE2 | ...
```

**Example:**
```
2025-12-03T10:00:00Z | STORY | STORY-001-001-1-db | status:IN_PROGRESS | robot:ashok | started:2025-12-03T10:00:00Z
```

### Required Attributes

**All entry types:**
- `status` - Entry status (PENDING, IN_PROGRESS, COMPLETED, BLOCKED, etc.)
- `robot` - Robot identifier (talib, pma, ashok, reena, charlie, etc.)

**Type-specific (optional but recommended):**
- STORY: `feature`, `title`, `estimate`, `started`, `completed`
- BLOCKER: `severity`, `title`, `created`, `resolved`, `resolution`
- PHASE: `phase`, `description`, `start`, `end`
- FEATURE: `epic`, `phase`, `title`, `priority`
- AMENDMENT: `targetPhase`, `severity`, `title`, `requestedBy`, `approvedBy`

**See ROME-GOV-008 for complete format specification.**

---

## MCP Tool Reference

### Core Tools

```javascript
// Append event to log
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "IN_PROGRESS",
    robot: "ashok",
    started: "2025-12-03T10:00:00Z"
  }
})

// Rebuild state index from event log
mcp__activity-log__rebuild_state()

// Query current state
mcp__activity-log__query({
  status: "BLOCKED"     // or: robot: "ashok", phase: 2, id: "STORY-001"
})

// Get entry history
mcp__activity-log__get_history({
  id: "STORY-001-001-1-db"
})

// Get statistics
mcp__activity-log__get_statistics()
```

### Query Patterns

**Find specific entry:**
```javascript
mcp__activity-log__query({ id: "STORY-001-001-1-db" })
```

**Find all blocked items:**
```javascript
mcp__activity-log__query({ status: "BLOCKED" })
```

**Find all work by robot:**
```javascript
mcp__activity-log__query({ robot: "ashok" })
```

**Find all Phase 2 entries:**
```javascript
mcp__activity-log__query({ phase: 2 })
```

**Get full event history for entry:**
```javascript
mcp__activity-log__get_history({ id: "BLOCK-001" })
```

---

## Migration from MongoDB

**For existing projects using MongoDB activity-log:**

See `/ROME_framework_maintenance/migration/MIGRATION-GUIDE.md` for complete migration procedure.

**Summary:**
1. Export MongoDB entries to event log format
2. Create activity-log.txt with all events
3. Rebuild state index
4. Verify migration
5. Update `.rome-project.json` (remove database config)
6. Switch robots to new MCP tools

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-21T00:00:00Z | Initial protocol definition for ROME v10 |
| 1.1 | 2025-11-24T00:00:00Z | Added Database Discovery section documenting .rome-project.json activityLog config |
| 2.0 | 2025-12-18T00:00:00Z | **BREAKING**: Replaced MongoDB with event log system (ROME-PROP-007). Append-only logging, git-trackable audit trail. All procedures rewritten for event log pattern. |
