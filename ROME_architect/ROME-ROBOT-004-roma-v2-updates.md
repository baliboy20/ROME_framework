# ROME-ROBOT-004 (Roma) v2.0 Update Guide

## Key Changes for Event Log System

### Version Update

```markdown
| **Version** | 2.0 |
| **Date** | 2025-12-18T00:00:00Z |

Revision History:
| 2.0 | 2025-12-18T00:00:00Z | **BREAKING**: Updated for event log system (ROME-PROP-007). Replace all MongoDB queries with event log patterns. |
```

---

## Section Updates

### 1. Startup Procedures - Step 2: Verify MCP Connection

**BEFORE (v1.0):**
```javascript
mcp__activity-log__get_statistics()

Verify:
- Connected to correct database
- PHASE entries exist (P0, P1, P2, P3, P4, P5)
- No orphaned entries
```

**AFTER (v2.0):**
```javascript
// Test MCP connectivity
mcp__activity-log__get_statistics()

// Rebuild state index from event log
mcp__activity-log__rebuild_state()

Verify:
- Event log file exists: ARTIFACTS/activity-log.txt
- State index generated: ARTIFACTS/activity-state.yaml
- PHASE entries exist in state
- Statistics show correct event count
```

---

### 2. Startup Procedures - Step 3: Check Phase Status

**BEFORE (v1.0):**
```javascript
For each phase (P0-P5):
  mcp__activity-log__find_by_id("PHASE-[N]")

  Verify status is valid:
  - PENDING (not started)
  - IN_PROGRESS (active)
  - COMPLETED (done)
```

**AFTER (v2.0):**
```javascript
// Read current state
const state = Read("ARTIFACTS/activity-state.yaml")

For each phase (P0-P5):
  const phaseStatus = state.phases["PHASE-[N]"]

  Verify status is valid:
  - IN_PROGRESS (active)
  - COMPLETED (done)
  - undefined (not started)
```

---

### 3. Startup Procedures - Step 4: Check for Stale Entries

**BEFORE (v1.0):**
```javascript
Find entries with:
- status = IN_PROGRESS
- No updates in > 24 hours

Flag stale entries for robot follow-up
```

**AFTER (v2.0):**
```javascript
// Read current state
const state = Read("ARTIFACTS/activity-state.yaml")

// Get all in-progress entries
const inProgress = state.by_status.IN_PROGRESS || []

// Check each for staleness
const now = new Date()
const stale = []

for (const entryId of inProgress) {
  const entry = getEntry(state, entryId)
  if (!entry.last_update) continue

  const lastUpdate = new Date(entry.last_update)
  const ageHours = (now - lastUpdate) / (1000 * 60 * 60)

  if (ageHours > 24) {
    stale.push({ id: entryId, age_hours: ageHours })
  }
}

Flag stale entries for robot follow-up
```

---

### 4. Phase Coordination - NEW Daily State Rebuild

**ADD NEW SECTION:**

## Daily State Validation (Roma)

**Frequency:** Once per day, before daily status report

**Procedure:**

```javascript
## Step 1: Rebuild State Index

mcp__activity-log__rebuild_state()

// Verify rebuild successful
const stats = mcp__activity-log__get_statistics()
console.log(`Rebuilt state from ${stats.metadata.event_count} events`)

## Step 2: Verify Statistics

const state = Read("ARTIFACTS/activity-state.yaml")

// Compare with yesterday (if tracking)
const today = {
  total_features: state.statistics.total_features,
  completed_stories: state.statistics.completed_stories,
  open_blockers: state.statistics.open_blockers
}

// Check for unexpected changes
// (e.g., completed count decreased = error)

## Step 3: Scan for Anomalies

// Stories IN_PROGRESS > 24 hours
const staleStories = /* see Step 4 above */

// Blockers OPEN > 7 days
const oldBlockers = Object.entries(state.blockers)
  .filter(([id, blocker]) => {
    if (blocker.status !== 'OPEN') return false
    const age = (new Date() - new Date(blocker.created)) / (1000 * 60 * 60 * 24)
    return age > 7
  })

## Step 4: Generate Compliance Report

// Include in daily status report
// - Event count vs. yesterday
// - Stale entries
// - Old blockers
// - Phase status mismatches
```

---

### 5. P1 Ingest - Check Progress

**BEFORE (v1.0):**
```javascript
mcp__activity-log__find_by_robot("talib")

Check for:
- PHASE-1 status
- Blockers
- Document catalog progress
```

**AFTER (v2.0):**
```javascript
// Read current state
const state = Read("ARTIFACTS/activity-state.yaml")

// Get Talib's work
const talibWork = state.by_robot.talib || []

// Check phase status
const phase1 = state.phases["PHASE-1"]
console.log(`Phase 1 status: ${phase1?.status}`)

// Check for blockers
const blockers = state.by_status.BLOCKED || []
const talibBlocked = blockers.filter(id =>
  getEntry(state, id).robot === 'talib'
)

// Check progress
console.log(`Talib has ${talibWork.length} entries`)
```

---

### 6. P2 Analysis - Transition to P3

**BEFORE (v1.0):**
```javascript
Check:
- PHASE-2 = COMPLETED
- requirements-matrix.yaml exists
- user-stories.md exists
- acceptance-criteria.md exists
- phase2-handover.md exists

If all met:
  Request Sarah GATE-P2 review

  mcp__Seez__show_doc({
    label: "GATE-P2 Request",
    content: "P2 complete. Sarah: validate requirements before P3."
  })
```

**AFTER (v2.0):**
```javascript
// Read current state
const state = Read("ARTIFACTS/activity-state.yaml")

Check:
- state.phases["PHASE-2"].status === "COMPLETED"
- requirements-matrix.yaml exists
- user-stories.md exists
- acceptance-criteria.md exists
- phase2-handover.md exists

If all met:
  // Append GATE-P2 request event (optional tracking)
  mcp__activity-log__append({
    type: "PHASE",
    id: "PHASE-2-GATE",
    attributes: {
      status: "PENDING_REVIEW",
      robot: "roma",
      description: "Gate P2 review requested from Sarah"
    }
  })

  // Request Sarah review
  mcp__Seez__show_doc({
    label: "GATE-P2 Request",
    content: "P2 complete. Sarah: validate requirements before P3."
  })

Wait for Sarah decision:
- If GATE-P2 = APPROVE:
    // Log approval
    mcp__activity-log__append({
      type: "PHASE",
      id: "PHASE-2-GATE",
      attributes: {
        status: "APPROVED",
        robot: "sarah"
      }
    })

    // Start P3
    mcp__activity-log__append({
      type: "PHASE",
      id: "PHASE-3",
      attributes: {
        status: "IN_PROGRESS",
        robot: "pma",
        phase: 3,
        description: "Design phase"
      }
    })

    Notify PMA to begin P3

- If GATE-P2 = BLOCK:
    // Log rejection
    mcp__activity-log__append({
      type: "PHASE",
      id: "PHASE-2-GATE",
      attributes: {
        status: "REJECTED",
        robot: "sarah",
        issues: "[Sarah's feedback]"
      }
    })

    Notify Talib of blockers
```

---

### 7. P5 Generation - Monitor Layer Progress

**BEFORE (v1.0):**
```javascript
Daily check:

Ashok status:
  ashokWork = mcp__activity-log__find_by_robot("ashok")
  ashokComplete = count(status = COMPLETED)
  ashokInProgress = count(status = IN_PROGRESS)
  ashokBlocked = count(status = BLOCKED)

Reena status:
  reenaWork = mcp__activity-log__find_by_robot("reena")
  reenaComplete = count(status = COMPLETED)

  Check dependency:
  - Can Reena proceed? (Ashok stories complete?)
  - If Ashok blocked: Notify Reena of delay
```

**AFTER (v2.0):**
```javascript
Daily check:

// Rebuild state first
mcp__activity-log__rebuild_state()

// Read current state
const state = Read("ARTIFACTS/activity-state.yaml")

Ashok status:
  const ashokWork = state.by_robot.ashok || []
  const ashokComplete = ashokWork.filter(id =>
    getEntry(state, id).status === 'COMPLETED'
  ).length
  const ashokInProgress = ashokWork.filter(id =>
    getEntry(state, id).status === 'IN_PROGRESS'
  ).length
  const ashokBlocked = ashokWork.filter(id =>
    getEntry(state, id).status === 'BLOCKED'
  ).length

Reena status:
  const reenaWork = state.by_robot.reena || []
  const reenaComplete = reenaWork.filter(id =>
    getEntry(state, id).status === 'COMPLETED'
  ).length

  Check dependency:
  - Can Reena proceed? (Ashok stories complete?)
  - If Ashok blocked: Notify Reena of delay

Charlie status:
  const charlieWork = state.by_robot.charlie || []
  const charlieComplete = charlieWork.filter(id =>
    getEntry(state, id).status === 'COMPLETED'
  ).length

  Check dependency:
  - Can Charlie proceed? (Reena stories complete?)
  - If Reena blocked: Notify Charlie of delay

// Helper function
function getEntry(state, id) {
  return state.phases[id] ||
         state.features[id] ||
         state.stories[id] ||
         state.blockers[id] ||
         state.amendments[id]
}
```

---

### 8. Blocker Resolution - Detect Blockers

**BEFORE (v1.0):**
```javascript
Daily scan:
  blockers = mcp__activity-log__find_by_status("BLOCKED")
  openBlockers = mcp__activity-log__list_all_entries({
    type: "blocker",
    status: "OPEN"
  })
```

**AFTER (v2.0):**
```javascript
Daily scan:
  // Read current state
  const state = Read("ARTIFACTS/activity-state.yaml")

  // Find blocked items
  const blockedItems = state.by_status.BLOCKED || []
  console.log(`Found ${blockedItems.length} blocked items`)

  // Find open blockers
  const openBlockers = Object.entries(state.blockers)
    .filter(([id, blocker]) => blocker.status === 'OPEN')
    .map(([id, blocker]) => ({ id, ...blocker }))
  console.log(`Found ${openBlockers.length} open blockers`)
```

---

### 9. Blocker Resolution - Resolution Pattern

**BEFORE (v1.0):**
```javascript
4. Track resolution
   mcp__activity-log__update_entry(
     id: "BLOCK-[NUM]",
     updates: {
       status: "RESOLVED",
       resolvedDate: "[ISO-8601]",
       resolutionNotes: "[How resolved]"
     }
   )

5. Unblock dependent work
   Notify affected robots
   Update dependent stories
```

**AFTER (v2.0):**
```javascript
4. Track resolution
   // Append RESOLVED event
   mcp__activity-log__append({
     type: "BLOCKER",
     id: "BLOCK-[NUM]",
     attributes: {
       status: "RESOLVED",
       robot: "roma",
       resolvedDate: "[ISO-8601]",
       resolution: "[How resolved]"
     }
   })

5. Unblock dependent work
   // Get blocker details to find affected stories
   const history = mcp__activity-log__get_history({ id: "BLOCK-[NUM]" })
   const storyId = history.events[0].story

   // Append IN_PROGRESS event for unblocked story
   mcp__activity-log__append({
     type: "STORY",
     id: storyId,
     attributes: {
       status: "IN_PROGRESS",
       robot: "[assigned-robot]"
     }
   })

   Notify affected robots
```

---

### 10. Logging Compliance Monitoring - Daily Compliance Check

**BEFORE (v1.0):**
```javascript
Check for violations:

1. Stale IN_PROGRESS entries
   entries = mcp__activity-log__find_by_status("IN_PROGRESS")
   For each entry:
     If no update > 24 hours:
       Flag to robot
       Create reminder

2. Missing completion dates
   entries = mcp__activity-log__find_by_status("COMPLETED")
   For each entry:
     If completionDate = null:
       Flag violation

3. Orphaned blockers
   blockers = mcp__activity-log__list_all_entries({type: "blocker"})
   For each blocker:
     If status = OPEN and age > 7 days:
       Escalate

4. Phase mismatches
   Verify robot activity matches assigned phase
```

**AFTER (v2.0):**
```javascript
Check for violations:

// Rebuild state first
mcp__activity-log__rebuild_state()

// Read current state
const state = Read("ARTIFACTS/activity-state.yaml")

1. Stale IN_PROGRESS entries
   const inProgress = state.by_status.IN_PROGRESS || []
   const now = new Date()

   for (const entryId of inProgress) {
     const entry = getEntry(state, entryId)
     if (!entry.last_update) continue

     const lastUpdate = new Date(entry.last_update)
     const ageHours = (now - lastUpdate) / (1000 * 60 * 60)

     if (ageHours > 24) {
       Flag to robot: entry.robot
       Create reminder
     }
   }

2. Missing completion dates
   const completed = state.by_status.COMPLETED || []

   for (const entryId of completed) {
     const entry = getEntry(state, entryId)
     if (!entry.completed && entry.type === 'story') {
       Flag violation: `${entryId} completed without timestamp`
     }
   }

3. Orphaned blockers
   const openBlockers = Object.entries(state.blockers)
     .filter(([id, blocker]) => blocker.status === 'OPEN')

   for (const [blockerId, blocker] of openBlockers) {
     const created = new Date(blocker.created)
     const ageDays = (now - created) / (1000 * 60 * 60 * 24)

     if (ageDays > 7) {
       Escalate: blocker
     }
   }

4. Phase mismatches
   const currentPhase = Object.entries(state.phases)
     .find(([id, phase]) => phase.status === 'IN_PROGRESS')

   if (currentPhase) {
     const [phaseId, phaseData] = currentPhase
     // Verify robot activity matches phase assignment
   }
```

---

### 11. MCP Tool Reference - Complete Update

**BEFORE (v1.0):**
```markdown
### Activity Log
mcp__activity-log__get_statistics()
mcp__activity-log__find_by_robot(robot)
mcp__activity-log__find_by_feature(featureId)
mcp__activity-log__find_by_status(status)
mcp__activity-log__find_by_phase(phase)
mcp__activity-log__find_by_id(id)
mcp__activity-log__update_entry(id, updates)
mcp__activity-log__add_entry(entry)
mcp__activity-log__list_all_entries(filters)
```

**AFTER (v2.0):**
```markdown
### Activity Log
mcp__activity-log__append(event)           // Append event to log
mcp__activity-log__rebuild_state()         // Rebuild state from events
mcp__activity-log__query(filter)           // Query current state
mcp__activity-log__get_history(id)         // Get entry history
mcp__activity-log__get_statistics()        // Get statistics

### Query Patterns
// Find by status
mcp__activity-log__query({ status: "BLOCKED" })

// Find by robot
mcp__activity-log__query({ robot: "ashok" })

// Find by phase
mcp__activity-log__query({ phase: 2 })

// Find specific entry
mcp__activity-log__query({ id: "STORY-001-001-1-db" })

// Get full history
mcp__activity-log__get_history({ id: "BLOCK-001" })

### Reading State Directly
// For complex queries, read YAML directly
const state = Read("ARTIFACTS/activity-state.yaml")

// Access by_robot index
const ashokWork = state.by_robot.ashok || []

// Access by_status index
const blocked = state.by_status.BLOCKED || []

// Access specific collection
const allBlockers = state.blockers
```

---

## Summary of Changes

### Removed Functions
- ❌ `mcp__activity-log__find_by_id()` → Use `query({ id })`
- ❌ `mcp__activity-log__find_by_robot()` → Use `query({ robot })`
- ❌ `mcp__activity-log__find_by_status()` → Use `query({ status })`
- ❌ `mcp__activity-log__find_by_feature()` → Use `query({ feature })`
- ❌ `mcp__activity-log__find_by_phase()` → Use `query({ phase })`
- ❌ `mcp__activity-log__update_entry()` → Use `append()`
- ❌ `mcp__activity-log__add_entry()` → Use `append()`
- ❌ `mcp__activity-log__list_all_entries()` → Read YAML or use `query()`

### New Functions
- ✅ `mcp__activity-log__append(event)` - Append event to log
- ✅ `mcp__activity-log__rebuild_state()` - Rebuild state index
- ✅ `mcp__activity-log__query(filter)` - Query current state
- ✅ `mcp__activity-log__get_history(id)` - Get entry event history

### New Patterns
- ✅ Daily `rebuild_state()` before monitoring
- ✅ Read `activity-state.yaml` for complex queries
- ✅ Use indexes (`by_robot`, `by_status`, `by_phase`)
- ✅ Append events instead of updating entries
- ✅ Latest event wins for entry state

---

## Implementation Checklist

Apply these changes throughout ROME-ROBOT-004:

- [ ] Update version to 2.0
- [ ] Update revision history
- [ ] Replace all `find_by_*` with `query()`
- [ ] Replace all `update_entry` with `append()`
- [ ] Replace all `add_entry` with `append()`
- [ ] Add daily `rebuild_state()` procedure
- [ ] Update MCP tool reference section
- [ ] Add YAML reading patterns
- [ ] Update all code examples
- [ ] Test query patterns work correctly
