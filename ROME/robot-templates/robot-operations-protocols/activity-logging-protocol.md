# Robot Operations Governance: Activity Logging Protocol

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROC-005 |
| **Version** | 1.0 |
| **Date** | 2025-11-21T00:00:00Z |
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
- activity-log MCP server - Database-backed activity tracking system

---

## Activity Log System

### Overview

ROME v10 uses the activity-log MCP server for activity tracking with the following amendments to align with the current phase model:

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

### After Every Log Update

You MUST verify the log update was successful:

```
→ mcp__activity-log__find_by_id(id: "[ENTRY-ID]")
→ Confirm returned entry reflects your changes
```

### If Verification Fails

1. **Retry** the update operation
2. **Report** failure to orchestrator (Roma)
3. **Do not proceed** with work until logging confirmed
4. **Document** logging failure in session notes

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
- VERIFY logging success before proceeding
- Include meaningful notes explaining decisions
- Reference related items (parent feature, blocked story)
- Use consistent ISO 8601 timestamps
- Query existing state before making updates

### Don't

- Delay logging until end of session
- Assume logging succeeded without verification
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
| 1.0 | 2025-11-21T00:00:00Z | Initial protocol definition for ROME v10 |
