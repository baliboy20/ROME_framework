# Robot Operations Governance: Activity Logging Protocol

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROC-005 |
| **Version** | 2.0 |
| **Date** | 2025-12-30T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Procedure |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines mandatory procedures for all robots to record activity status using the activity-log system. Ensures accurate project state visibility, enables effective robot coordination, and maintains traceability as required by ROME-PRIN-001 Principle 2.

## Scope

Applies to ALL robots during ALL phases. This protocol is NON-OPTIONAL.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Principle 2: Traceability, Principle 5: Central Orchestration
- ROME-PROC-002 (Sponsor Interaction) - Sponsor interaction logging requirements
- ROME-LEX-001 (Lexicon) - Activity tracking terminology
- activity-log-file MCP server - File-backed activity tracking system (v2.0.0)

---

## Activity Log System

### Overview

ROME v10 uses the activity-log-file MCP server (v2.0.0) for file-based activity tracking. This replaces the previous MongoDB-based system with an event-sourced architecture providing git-trackable, human-readable activity logs.

### File System Architecture

**Event Log (Source of Truth):**
- Location: `ARTIFACTS/activity-log.txt`
- Format: Append-only timestamped events
- Structure: `TIMESTAMP | TYPE | ID | ATTR1:VALUE1 | ATTR2:VALUE2 | ...`
- Never manually edit previous lines
- Git-trackable for complete audit trail

**State Index (Query Optimization):**
- Location: `ARTIFACTS/activity-state.yaml`
- Auto-generated from event log via `rebuild_state()`
- Disposable (regenerate anytime from event log)
- Provides fast queries by status, robot, phase, etc.

Bootstrap creates both files during project initialization (P00-bootup). The MCP server automatically maintains synchronization between event log and state index.

**Phase Mapping (activity-log → ROME v10):**

| activity-log Phase | ROME v10 Phase | Phase Name |
|--------------------|----------------|------------|
| 1 | P1 | Ingest |
| 2 | P2 | Analysis |
| 2a | P3 | Design |
| 2b | P3 (exit gate) | Design Quality Gate |
| 3 | P4 + P5 | Config + Generation |

**Robot Mapping:**

| activity-log Robot | ROME v10 Assignment |
|-------------------|---------------------|
| roma | Orchestrator (all phases) |
| talib | P1 Ingest, P2 Analysis |
| pma | P3 Design |
| clara | P3 Design (UI/UX) |
| sarah | P3 Design (Quality Gate) |
| charlie | P4 Config, P5 Generation (Backend) |
| reena | P4 Config, P5 Generation (Backend) |
| ashok | P4 Config, P5 Generation (Database) |

**Note:** `bootstrap` robot activities should be logged using `roma` with appropriate notes indicating bootstrap context.

### Entry Types

| Type | Description | ID Pattern |
|------|-------------|------------|
| feature | Feature work across a layer | FEAT-###-db\|api\|ui |
| story | User story within a feature | STORY-###-#-#-db\|api\|ui |
| blocker | Issue preventing progress | BLOCK-### |
| amendment | Change request to prior phase | AMD-### |
| phase | Phase-level status | PHASE-# |

### Status Values

| Entry Type | Valid Statuses |
|------------|----------------|
| feature, story | PENDING, IN_PROGRESS, COMPLETED, BLOCKED |
| blocker | OPEN, ESCALATED, RESOLVED |
| amendment | PENDING_REVIEW, APPROVED, REJECTED |
| phase | NOT_STARTED, IN_PROGRESS, COMPLETED |

---

## State Access Standard

### Purpose

Defines optimal methods for accessing activity state to maximize performance while maintaining data integrity.

### Access Patterns

| Operation Type | Method | Tool/File | Rationale |
|----------------|--------|-----------|-----------|
| **Mutations** | MCP append | `mcp__activity-log__append()` | Maintains event log integrity, triggers state rebuild |
| **Real-time monitoring** | Direct file read | `ARTIFACTS/activity-state.yaml` | 10x faster than MCP query, zero network latency |
| **Historical queries** | MCP query | `mcp__activity-log__query()` | Access complete event history from log file |
| **Bulk status checks** | Direct file read | `ARTIFACTS/activity-state.yaml` | Efficient for checking multiple items |
| **Single item verification** | Direct file read | `ARTIFACTS/activity-state.yaml` | Faster than MCP for simple reads |

### Implementation Guidelines

**For Mutations (All Robots):**
```javascript
// ALWAYS use MCP for mutations
mcp__activity-log__append({
  type: "STATUS_UPDATE",
  id: work_id,
  attributes: {status: IN_PROGRESS, start: NOW}
})
// State automatically rebuilt by MCP server
```

**For Monitoring (Primarily Roma):**
```javascript
// Read state file directly (fast path)
const state = Read("ARTIFACTS/activity-state.yaml")

// Query by status
const blockers = state.by_status.BLOCKED

// Query by robot
const romaWork = state.by_robot.roma

// Query by phase
const phase2Work = state.by_phase["2"]
```

**For Historical Analysis:**
```javascript
// Use MCP to query event log when you need history
const history = mcp__activity-log__get_history({id: "FEAT-001"})
// Returns: All events for FEAT-001 across time
```

### Performance Characteristics

| Method | Latency | Use Case |
|--------|---------|----------|
| Direct YAML read | <10ms | Monitoring, status checks, coordination |
| MCP query (state) | ~100ms | Legacy queries, compatibility |
| MCP query (history) | ~200ms | Audit trails, historical analysis |
| MCP append | ~50ms | All mutations (required) |

### Rules

**MUST:**
- Use MCP append for ALL mutations
- Use direct YAML reads for monitoring and status checks
- Verify YAML file exists before reading

**MUST NOT:**
- Edit `activity-log.txt` or `activity-state.yaml` manually
- Use MCP queries when YAML read suffices
- Cache state across multiple operations (always read fresh)

**MAY:**
- Use MCP queries for complex historical analysis
- Read event log file directly for grep-based searches
- Parse YAML programmatically for custom queries

---

## Mandatory Logging Events

### Trigger Points

| Event | Required Action | Timing |
|-------|-----------------|--------|
| Work assigned | Create/verify entry exists | BEFORE starting work |
| Start work | Status → IN_PROGRESS | IMMEDIATELY when starting |
| Progress milestone | Update lastUpdate | At significant milestones |
| Blocker encountered | Create blocker + Status → BLOCKED | IMMEDIATELY upon discovery |
| Blocker resolved | Resolve blocker + Status → IN_PROGRESS | IMMEDIATELY upon resolution |
| Work completed | Status → COMPLETED | AFTER verification, SAME turn |
| Amendment needed | Create amendment entry | BEFORE requesting approval |
| Phase transition | Phase entry → COMPLETED | AFTER exit criteria verified |

### Timing Rules

**Immediate (Same Conversation Turn):**
- ALL status transitions
- Blocker creation
- Amendment creation

**Pre-Action (Before Starting):**
- Work item entry creation
- Work claim/assignment

**Post-Action (After Verification):**
- Work completion

---

## Logging Procedures

### 1. Starting Work on an Entry

**Before beginning ANY implementation work:**

```
Step 1: Query for existing entry
  → mcp__activity-log__find_by_id(id: "[ENTRY-ID]")

Step 2: If entry exists and status is PENDING:
  → mcp__activity-log__update_entry(
      id: "[ENTRY-ID]",
      updates: {
        status: "IN_PROGRESS",
        startDate: "[ISO-8601-TIMESTAMP]",
        robot: "[YOUR-ROBOT-NAME]"
      }
    )

Step 3: Verify update successful
  → mcp__activity-log__find_by_id(id: "[ENTRY-ID]")
  → Confirm status is "IN_PROGRESS"

Step 4: THEN begin implementation work
```

### 2. Encountering a Blocker

**IMMEDIATELY upon discovering a blocker:**

```
Step 1: Create blocker entry
  → mcp__activity-log__add_entry(entry: {
      id: "BLOCK-[NEXT-NUMBER]",
      type: "blocker",
      severity: "[CRITICAL|HIGH|MEDIUM|LOW]",
      feature: "[FEAT-###]",
      story: "[STORY-###-#-#]",
      description: "[What is blocked and why]",
      robot: "[YOUR-ROBOT-NAME]",
      status: "OPEN",
      createdDate: "[ISO-8601-TIMESTAMP]"
    })

Step 2: Update blocked entry status
  → mcp__activity-log__update_entry(
      id: "[BLOCKED-ENTRY-ID]",
      updates: {
        status: "BLOCKED",
        blocker: "BLOCK-[NUMBER]",
        lastUpdate: "[ISO-8601-TIMESTAMP]"
      }
    )

Step 3: Report blocker to orchestrator (Roma)
```

### 3. Resolving a Blocker

**IMMEDIATELY upon resolving a blocker:**

```
Step 1: Update blocker entry
  → mcp__activity-log__update_entry(
      id: "BLOCK-[NUMBER]",
      updates: {
        status: "RESOLVED",
        resolvedDate: "[ISO-8601-TIMESTAMP]"
      }
    )

Step 2: Update previously blocked entry
  → mcp__activity-log__update_entry(
      id: "[PREVIOUSLY-BLOCKED-ENTRY-ID]",
      updates: {
        status: "IN_PROGRESS",
        blocker: null,
        lastUpdate: "[ISO-8601-TIMESTAMP]",
        notes: "[Resolution summary]"
      }
    )

Step 3: Resume work on entry
```

### 4. Completing Work

**AFTER verifying implementation is complete:**

```
Step 1: Verify work meets acceptance criteria
  → (Implementation verification)

Step 2: Update entry to COMPLETED
  → mcp__activity-log__update_entry(
      id: "[ENTRY-ID]",
      updates: {
        status: "COMPLETED",
        completionDate: "[ISO-8601-TIMESTAMP]",
        lastUpdate: "[ISO-8601-TIMESTAMP]"
      }
    )

Step 3: Verify update successful
  → mcp__activity-log__find_by_id(id: "[ENTRY-ID]")
  → Confirm status is "COMPLETED"

Step 4: Report completion to orchestrator
```

### 5. Requesting an Amendment

**BEFORE seeking approval for a change:**

```
Step 1: Create amendment entry
  → mcp__activity-log__add_entry(entry: {
      id: "AMD-[NEXT-NUMBER]",
      type: "amendment",
      severity: "[CRITICAL|HIGH|MEDIUM|LOW]",
      feature: "[FEAT-###]",
      description: "[What needs to change and why]",
      requestedBy: "[YOUR-ROBOT-NAME]",
      targetPhase: "[PHASE-NUMBER]",
      status: "PENDING_REVIEW",
      createdDate: "[ISO-8601-TIMESTAMP]"
    })

Step 2: Update affected entry (if applicable)
  → mcp__activity-log__update_entry(
      id: "[AFFECTED-ENTRY-ID]",
      updates: {
        amendment: "AMD-[NUMBER]",
        lastUpdate: "[ISO-8601-TIMESTAMP]"
      }
    )

Step 3: Request approval from Roma or relevant robot
```

---

## Verification Requirements

### Verification Strategy

**Inline verification after appends is NOT required.** Event log appends are atomic and fail-fast.

**Rationale:**
- File append operations are synchronous and atomic
- MCP tool returns error immediately on failure
- State rebuild is automatic after successful append
- Inline verification adds 50% latency without preventing failures

### Verification Timing

**Phase Gates (Comprehensive):**
- Verify state integrity before phase transitions
- Verify event log consistency
- Validate all work items accounted for
- Check for orphaned entries or status mismatches

**On Append Failure:**
If `mcp__activity-log__append()` returns error:
1. Retry operation once
2. If retry fails, create blocker entry
3. Report to Roma
4. Do not proceed until resolved

---

## Orchestrator Compliance Monitoring

### Roma's Responsibilities

Roma (Orchestrator) monitors logging compliance through:

1. **Daily Stale Entry Check**
   - Query entries with lastUpdate > 24 hours old
   - Query entries in IN_PROGRESS with no recent activity
   - Flag for robot follow-up

2. **Phase Transition Audit**
   - Before approving phase transition:
     - All entries for phase must be COMPLETED or explicitly deferred
     - No OPEN blockers
     - No PENDING_REVIEW amendments
     - All timestamps valid

3. **Compliance Report**
   - Generated at each phase transition
   - Lists: stale entries, status mismatches, unresolved blockers
   - Phase transition BLOCKED until issues resolved

### Compliance Queries

```
# Find stale entries
mcp__activity-log__list_all_entries(
  status: "IN_PROGRESS"
)
→ Filter: lastUpdate > 24 hours ago

# Find orphaned blockers
mcp__activity-log__find_by_status(status: "OPEN")
→ Check each has corresponding BLOCKED entry

# Find pending amendments
mcp__activity-log__list_all_entries(
  type: "amendment",
  status: "PENDING_REVIEW"
)
```

---

## Quality Gate Integration

### Phase Exit Criteria: Logging Completeness

Before ANY phase transition, Roma verifies:

| Check | Requirement | Blocking? |
|-------|-------------|-----------|
| Entry Completeness | All work items have entries | Yes |
| Status Accuracy | No IN_PROGRESS without recent update | Yes |
| Blocker Resolution | All blockers RESOLVED or ESCALATED | Yes |
| Amendment Disposition | All amendments APPROVED or REJECTED | Yes |
| Timestamp Integrity | All entries have valid timestamps | Warning |

**Phase transition is BLOCKED until all blocking checks pass.**

### Gate Verification Procedures

**Comprehensive verification at phase gates:**

```javascript
GATE_VERIFICATION:
  // 1. State consistency check
  state = Read("ARTIFACTS/activity-state.yaml")
  eventLog = Read("ARTIFACTS/activity-log.txt")

  // Verify state was rebuilt from log
  stateTimestamp = state.metadata.generated
  if stateTimestamp <15 minutes old:
    WARN("State may be stale, rebuild recommended")

  // 2. Work completeness
  phaseWork = state.by_phase[CURRENT_PHASE]
  incomplete = phaseWork.filter(w => w.status != COMPLETED)
  if incomplete.length > 0:
    GATE_BLOCKED("Incomplete work items: " + incomplete.map(w => w.id))

  // 3. Blocker resolution
  blockers = state.by_status.BLOCKED || []
  openBlockers = blockers.filter(b => b.status == OPEN)
  if openBlockers.length > 0:
    GATE_BLOCKED("Unresolved blockers: " + openBlockers.map(b => b.id))

  // 4. Amendment disposition
  amendments = state.by_type.AMENDMENT || []
  pendingAmendments = amendments.filter(a => a.status == PENDING_REVIEW)
  if pendingAmendments.length > 0:
    GATE_BLOCKED("Pending amendments: " + pendingAmendments.map(a => a.id))

  // 5. Event log integrity
  eventCount = count_lines(eventLog)
  if eventCount < state.metadata.event_count:
    GATE_BLOCKED("Event log/state mismatch - possible corruption")

  GATE_APPROVED
```

---

## Error Handling

### Activity-Log System Unavailable

If activity-log MCP is unavailable:

1. **Buffer** intended log entries (note in session)
2. **Report** to orchestrator immediately
3. **Continue** critical work if blocking
4. **Reconcile** logs when system available
5. **Backdate** entries with accurate timestamps

### Duplicate Entry Error

If entry ID already exists:

1. **Query** existing entry to understand state
2. **Update** existing entry instead of creating new
3. **Never** create duplicate IDs

### Missing Entry

If work performed without entry:

1. **Create** entry retroactively
2. **Backdate** timestamps based on evidence (commits, reports)
3. **Add note** indicating retroactive creation
4. **Report** to orchestrator

---

## Best Practices

### Do

- Log status changes IMMEDIATELY, within same conversation turn
- Handle MCP errors immediately (retry, create blocker if persistent)
- Include meaningful notes explaining decisions
- Reference related items (parent feature, blocked story)
- Use consistent ISO 8601 timestamps
- Read state file directly for status checks (faster than MCP queries)

### Don't

- Delay logging until end of session
- Verify every append inline (done at phase gates instead)
- Leave entries in IN_PROGRESS when blocked
- Create blocker entries AFTER attempting workarounds
- Forget to resolve blockers when issue fixed
- Skip logging for "small" tasks

---

## Reference: MCP Tool Usage

### Query Tools

```
mcp__activity-log__find_by_id(id)
mcp__activity-log__find_by_feature(featureId)
mcp__activity-log__find_by_robot(robot)
mcp__activity-log__find_by_status(status)
mcp__activity-log__find_by_phase(phase)
mcp__activity-log__find_by_layer(layer)
mcp__activity-log__list_all_entries(filters)
mcp__activity-log__get_statistics()
```

### Mutation Tools

```
mcp__activity-log__add_entry(entry)
mcp__activity-log__update_entry(id, updates)
mcp__activity-log__delete_entry(id)
```

### Schema Tools

```
mcp__activity-log__list_entry_types()
mcp__activity-log__get_entry_instructions(type)
mcp__activity-log__validate_entry(entry)
```

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-24T00:00:00Z | Initial activity logging protocol |
| 1.1 | 2025-11-24T00:00:00Z | Added state access standard and performance guidelines |
| 2.0 | 2025-12-30T00:00:00Z | Migrated from MongoDB to file-based system; breaking change in tool names and architecture (ROME-PROP-014) |
