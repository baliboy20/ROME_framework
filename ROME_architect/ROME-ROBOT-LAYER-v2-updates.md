# Layer Robots v2.0 Update Guide
## Ashok (Database), Reena (Backend), Charlie (Frontend)

This guide applies to:
- ROME-ROBOT-010 (Ashok) - Database layer
- ROME-ROBOT-008 (Reena) - Backend layer
- ROME-ROBOT-007 (Charlie) - Frontend layer

All layer robots follow the same activity logging pattern.

---

## Version Updates

**Each robot CLAUDE.md:**

```markdown
| **Version** | 2.0 |
| **Date** | 2025-12-18T00:00:00Z |

Revision History:
| 2.0 | 2025-12-18T00:00:00Z | **BREAKING**: Updated for event log system (ROME-PROP-007). Replace MongoDB logging with event append pattern. |
```

---

## Core Logging Pattern Changes

### Pattern 1: Mark Story In-Progress

**BEFORE (MongoDB):**
```javascript
mcp__activity-log__update_entry({
  id: "STORY-001-001-1-db",
  updates: {
    status: "IN_PROGRESS",
    startDate: "[ISO-8601]",
    robot: "ashok"
  }
})

// Verify
mcp__activity-log__find_by_id("STORY-001-001-1-db")
```

**AFTER (Event Log):**
```javascript
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "IN_PROGRESS",
    robot: "ashok",
    started: "[ISO-8601]"
  }
})

// Verify
Read last 3 lines of ARTIFACTS/activity-log.txt
// Should show your appended event
```

---

### Pattern 2: Mark Story Completed

**BEFORE (MongoDB):**
```javascript
mcp__activity-log__update_entry({
  id: "STORY-001-001-1-db",
  updates: {
    status: "COMPLETED",
    completionDate: "[ISO-8601]"
  }
})

// Verify
mcp__activity-log__find_by_id("STORY-001-001-1-db")
```

**AFTER (Event Log):**
```javascript
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "COMPLETED",
    robot: "ashok",
    completed: "[ISO-8601]"
  }
})

// Verify
mcp__activity-log__get_history({ id: "STORY-001-001-1-db" })
// Should show: PENDING → IN_PROGRESS → COMPLETED
```

---

### Pattern 3: Encounter Blocker

**BEFORE (MongoDB):**
```javascript
// Create blocker
mcp__activity-log__add_entry({
  entry: {
    id: "BLOCK-001",
    type: "blocker",
    severity: "MEDIUM",
    feature: "FEAT-001",
    story: "STORY-001-001-1-db",
    robot: "ashok",
    status: "OPEN",
    description: "Missing schema specification for user roles"
  }
})

// Mark story blocked
mcp__activity-log__update_entry({
  id: "STORY-001-001-1-db",
  updates: {
    status: "BLOCKED",
    blocker: "BLOCK-001"
  }
})
```

**AFTER (Event Log):**
```javascript
// Append blocker event
mcp__activity-log__append({
  type: "BLOCKER",
  id: "BLOCK-001",
  attributes: {
    status: "OPEN",
    severity: "MEDIUM",
    feature: "FEAT-001",
    story: "STORY-001-001-1-db",
    robot: "ashok",
    title: "Missing schema specification for user roles",
    created: "[ISO-8601]"
  }
})

// Append blocked event for story
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "BLOCKED",
    robot: "ashok",
    blocker: "BLOCK-001"
  }
})
```

---

### Pattern 4: Resume After Blocker Resolved

**BEFORE (MongoDB):**
```javascript
// (Roma resolves blocker)

// Resume story
mcp__activity-log__update_entry({
  id: "STORY-001-001-1-db",
  updates: {
    status: "IN_PROGRESS",
    blocker: null
  }
})
```

**AFTER (Event Log):**
```javascript
// (Roma appends RESOLVED event for blocker)

// Resume story
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "IN_PROGRESS",
    robot: "ashok"
  }
})
```

---

## Complete Workflow Example

### Ashok (Database Layer) - Complete Story

```javascript
/**
 * Story: STORY-001-001-1-db - "User table schema"
 * Feature: FEAT-001 - "User Authentication"
 */

// Step 1: Start work
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "IN_PROGRESS",
    robot: "ashok",
    started: "2025-12-03T10:00:00Z"
  }
})

// Step 2: Implement
// (Create migrations, models, etc.)

// Step 3: Complete work
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "COMPLETED",
    robot: "ashok",
    completed: "2025-12-03T12:00:00Z"
  }
})

// Step 4: Verify completion logged
mcp__activity-log__get_history({ id: "STORY-001-001-1-db" })
// Returns:
// {
//   events: [
//     { timestamp: "2025-12-03T10:00:00Z", status: "IN_PROGRESS", robot: "ashok" },
//     { timestamp: "2025-12-03T12:00:00Z", status: "COMPLETED", robot: "ashok" }
//   ]
// }
```

---

### Reena (Backend Layer) - With Amendment

```javascript
/**
 * Story: STORY-001-001-1-api - "Login endpoint"
 * Feature: FEAT-001 - "User Authentication"
 */

// Step 1: Start work
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-api",
  attributes: {
    status: "IN_PROGRESS",
    robot: "reena",
    started: "2025-12-03T13:00:00Z"
  }
})

// Step 2: Discover design issue - needs amendment
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
    title: "Add pagination to user list endpoint"
  }
})

// Step 3: Wait for approval from Roma
// (Roma appends APPROVED event)

// Step 4: Continue work

// Step 5: Complete work
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-api",
  attributes: {
    status: "COMPLETED",
    robot: "reena",
    completed: "2025-12-03T17:00:00Z"
  }
})
```

---

### Charlie (Frontend Layer) - With Blocker

```javascript
/**
 * Story: STORY-001-001-1-ui - "Login screen"
 * Feature: FEAT-001 - "User Authentication"
 */

// Step 1: Start work
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-ui",
  attributes: {
    status: "IN_PROGRESS",
    robot: "charlie",
    started: "2025-12-03T16:00:00Z"
  }
})

// Step 2: Encounter blocker (API not ready)
mcp__activity-log__append({
  type: "BLOCKER",
  id: "BLOCK-002",
  attributes: {
    status: "OPEN",
    severity: "HIGH",
    feature: "FEAT-001",
    story: "STORY-001-001-1-ui",
    robot: "charlie",
    title: "Login API endpoint not yet deployed",
    created: "2025-12-03T17:00:00Z"
  }
})

mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-ui",
  attributes: {
    status: "BLOCKED",
    robot: "charlie",
    blocker: "BLOCK-002"
  }
})

// Step 3: Wait for blocker resolution
// (Roma coordinates with Reena)
// (Roma appends RESOLVED event when API ready)

// Step 4: Resume work
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-ui",
  attributes: {
    status: "IN_PROGRESS",
    robot: "charlie"
  }
})

// Step 5: Complete work
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-ui",
  attributes: {
    status: "COMPLETED",
    robot: "charlie",
    completed: "2025-12-03T21:00:00Z"
  }
})
```

---

## Verification Patterns

### After Each Append

**Always verify:**

```javascript
// Method 1: Read event log
Read("ARTIFACTS/activity-log.txt")
// Check last 3 lines contain your event

// Method 2: Get history
mcp__activity-log__get_history({ id: "STORY-001-001-1-db" })
// Check latest event matches what you appended

// Method 3: Query state
mcp__activity-log__query({ id: "STORY-001-001-1-db" })
// Check current status (after state rebuild)
```

---

## Error Handling

### Event Log File Missing

```javascript
// Check if file exists
try {
  Read("ARTIFACTS/activity-log.txt")
} catch (error) {
  // File doesn't exist - report to Roma
  console.error("Activity log missing!")
  // Roma will reinitialize
}
```

### Append Fails

```javascript
try {
  mcp__activity-log__append({
    type: "STORY",
    id: "STORY-001",
    attributes: { status: "IN_PROGRESS", robot: "ashok" }
  })
} catch (error) {
  // Retry once
  mcp__activity-log__append({
    type: "STORY",
    id: "STORY-001",
    attributes: { status: "IN_PROGRESS", robot: "ashok" }
  })

  // If still fails, report to Roma
  console.error("Failed to log activity:", error)
}
```

---

## Updated Procedures Sections

### For Each Robot CLAUDE.md

**1. Update "Logging Requirements" section:**

```markdown
## Activity Logging

**Robot identifier:** `ashok` (or `reena`, `charlie`)

**Events to log:**
- Story IN_PROGRESS when starting work
- Blocker OPEN when blocked
- Story BLOCKED when blocker encountered
- Story IN_PROGRESS when resuming after blocker
- Story COMPLETED when work finished
- Amendment PENDING_REVIEW when requesting design change

**Logging pattern:**
mcp__activity-log__append({
  type: "[ENTRY-TYPE]",
  id: "[ENTRY-ID]",
  attributes: {
    status: "[STATUS]",
    robot: "[ROBOT-NAME]",
    // ... other attributes
  }
})

**Verification:**
Always verify append succeeded by reading last lines of activity-log.txt or using get_history.
```

**2. Update all procedure code blocks to use `append()` instead of `update_entry()` or `add_entry()`**

**3. Remove references to:**
- Database connections
- `mcp__activity-log__find_by_id()`
- `mcp__activity-log__update_entry()`
- `mcp__activity-log__add_entry()`

**4. Add references to:**
- `mcp__activity-log__append()`
- `mcp__activity-log__get_history()`
- `mcp__activity-log__query()` (for checking state)
- `ARTIFACTS/activity-log.txt` (event log file)

---

## Summary

### Key Changes for Layer Robots

1. ✅ Replace `update_entry()` with `append()`
2. ✅ Replace `add_entry()` with `append()`
3. ✅ Add `type` field to all appends
4. ✅ Use `started` instead of `startDate`
5. ✅ Use `completed` instead of `completionDate`
6. ✅ Verify appends by reading log file or using `get_history()`
7. ✅ Remove all database references

### Typical Story Lifecycle

```
PENDING (created by Talib/PMA)
  ↓ append(IN_PROGRESS)
IN_PROGRESS (robot starts work)
  ↓ append(COMPLETED)
COMPLETED (robot finishes)
```

### With Blocker

```
IN_PROGRESS
  ↓ append(BLOCKER:OPEN) + append(STORY:BLOCKED)
BLOCKED (waiting for resolution)
  ↓ append(BLOCKER:RESOLVED) + append(STORY:IN_PROGRESS)
IN_PROGRESS (resume work)
  ↓ append(COMPLETED)
COMPLETED
```

---

## Implementation Checklist

For each robot (Ashok, Reena, Charlie):

- [ ] Update version to 2.0
- [ ] Update revision history
- [ ] Replace all `update_entry` calls with `append`
- [ ] Replace all `add_entry` calls with `append`
- [ ] Add `type` field to all appends
- [ ] Update attribute names (`started`, `completed`)
- [ ] Update verification patterns
- [ ] Remove database references
- [ ] Update logging requirements section
- [ ] Test with sample story workflow
