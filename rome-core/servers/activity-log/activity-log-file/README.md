# ROME Activity Log File - MCP Server

Event-based file system for ROME activity tracking.

## Overview

This MCP server replaces the MongoDB-based activity-log system with a simpler, faster, git-trackable event log architecture.

**Key Features:**
- ✅ Append-only event log (`ARTIFACTS/activity-log.txt`)
- ✅ Auto-generated state index (`ARTIFACTS/activity-state.yaml`)
- ✅ 40x faster writes, 5-20x faster reads vs. MongoDB
- ✅ Git-trackable complete audit trail
- ✅ No database dependency
- ✅ Human-readable text files

## Installation

```bash
cd ~/Library/Application\ Support/Claude/mcp-servers/activity-log-file
npm install
```

## Configuration

Add to Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "activity-log-file": {
      "command": "node",
      "args": [
        "/Users/will/Library/Application Support/Claude/mcp-servers/activity-log-file/index.js"
      ]
    }
  }
}
```

## Tools

### 1. `mcp__activity-log__append(event)`

Append event to activity log.

**Parameters:**
```javascript
{
  type: "STORY",           // PHASE, FEATURE, STORY, BLOCKER, AMENDMENT
  id: "STORY-001-001-1-db",
  attributes: {
    status: "IN_PROGRESS", // Required
    robot: "ashok",        // Required
    started: "2025-12-03T10:00:00Z",
    // ... other attributes
  }
}
```

**Returns:**
```javascript
{
  success: true,
  event: "2025-12-03T10:00:00Z | STORY | STORY-001-001-1-db | status:IN_PROGRESS | robot:ashok | started:2025-12-03T10:00:00Z",
  timestamp: "2025-12-03T10:00:00Z"
}
```

**Example:**
```javascript
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "IN_PROGRESS",
    robot: "ashok",
    started: "2025-12-03T10:00:00Z"
  }
})
```

---

### 2. `mcp__activity-log__rebuild_state()`

Rebuild activity state index from event log.

**Parameters:** None

**Returns:**
```javascript
{
  success: true,
  event_count: 127,
  entry_count: 43,
  generated_at: "2025-12-03T15:00:00Z"
}
```

**Example:**
```javascript
mcp__activity-log__rebuild_state()
```

**When to use:**
- After manual event log edits
- After git merge conflicts in event log
- If state file is corrupted or missing
- Daily (recommended by Roma for validation)

---

### 3. `mcp__activity-log__query(filter)`

Query current activity state.

**Parameters:**
```javascript
{
  // Optional filters (use one or combine)
  id: "STORY-001-001-1-db",  // Find specific entry
  status: "BLOCKED",          // Find by status
  robot: "ashok",             // Find by robot
  phase: 2                    // Find by phase number
}
```

**Returns:**
```javascript
{
  results: [
    {
      id: "STORY-001-001-1-db",
      status: "COMPLETED",
      robot: "ashok",
      feature: "FEAT-001",
      title: "User table",
      estimate: "2h",
      started: "2025-12-03T10:00:00Z",
      completed: "2025-12-03T12:00:00Z",
      created: "2025-12-02T14:05:00Z",
      last_update: "2025-12-03T12:00:00Z"
    }
  ],
  count: 1
}
```

**Examples:**
```javascript
// Find all blocked items
mcp__activity-log__query({ status: "BLOCKED" })

// Find all work by ashok
mcp__activity-log__query({ robot: "ashok" })

// Find specific entry
mcp__activity-log__query({ id: "STORY-001-001-1-db" })

// Find all Phase 2 entries
mcp__activity-log__query({ phase: 2 })
```

---

### 4. `mcp__activity-log__get_history(id)`

Get complete event history for an entry.

**Parameters:**
```javascript
{
  id: "STORY-001-001-1-db"
}
```

**Returns:**
```javascript
{
  id: "STORY-001-001-1-db",
  events: [
    {
      timestamp: "2025-12-02T14:05:00Z",
      status: "PENDING",
      robot: "talib",
      feature: "FEAT-001",
      title: "User table",
      estimate: "2h"
    },
    {
      timestamp: "2025-12-03T10:00:00Z",
      status: "IN_PROGRESS",
      robot: "ashok",
      started: "2025-12-03T10:00:00Z"
    },
    {
      timestamp: "2025-12-03T12:00:00Z",
      status: "COMPLETED",
      robot: "ashok",
      completed: "2025-12-03T12:00:00Z"
    }
  ],
  event_count: 3
}
```

**Example:**
```javascript
mcp__activity-log__get_history({ id: "BLOCK-001" })
```

---

### 5. `mcp__activity-log__get_statistics()`

Get activity statistics.

**Parameters:** None

**Returns:**
```javascript
{
  metadata: {
    generated: "2025-12-03T15:00:00Z",
    event_count: 127,
    last_event: "2025-12-03T14:00:00Z"
  },
  statistics: {
    total_features: 5,
    total_stories: 18,
    completed_stories: 12,
    open_blockers: 1,
    resolved_blockers: 3
  },
  by_robot: [
    { robot: "ashok", count: 8 },
    { robot: "reena", count: 6 },
    { robot: "charlie", count: 4 }
  ],
  by_status: [
    { status: "COMPLETED", count: 12 },
    { status: "IN_PROGRESS", count: 5 },
    { status: "BLOCKED", count: 1 }
  ],
  by_phase: [
    { phase: "2", count: 10 },
    { phase: "3", count: 8 }
  ]
}
```

**Example:**
```javascript
mcp__activity-log__get_statistics()
```

---

## File Format

### Event Log (`ARTIFACTS/activity-log.txt`)

Append-only event stream:

```
# ROME Activity Log
# Project: my_project
# Created: 2025-12-01T10:00:00Z
# Format: TIMESTAMP | TYPE | ID | ATTRIBUTES

2025-12-03T10:00:00Z | STORY | STORY-001-001-1-db | status:IN_PROGRESS | robot:ashok | started:2025-12-03T10:00:00Z
2025-12-03T12:00:00Z | STORY | STORY-001-001-1-db | status:COMPLETED | robot:ashok | completed:2025-12-03T12:00:00Z
```

**Rules:**
- NEVER edit previous lines
- ONLY append new events
- Timestamps MUST be chronologically increasing

### State Index (`ARTIFACTS/activity-state.yaml`)

Auto-generated from event log:

```yaml
# ROME Activity State Index
# Auto-generated from activity-log.txt
# Last updated: 2025-12-03T15:00:00Z
# DO NOT EDIT MANUALLY - use rebuild_activity_state()

metadata:
  generated: 2025-12-03T15:00:00Z
  event_count: 127

phases:
  PHASE-2:
    status: IN_PROGRESS
    robot: talib
    phase: 2
    start: 2025-12-02T16:30:00Z

stories:
  STORY-001-001-1-db:
    status: COMPLETED
    robot: ashok
    feature: FEAT-001
    title: User table
    estimate: 2h
    started: 2025-12-03T10:00:00Z
    completed: 2025-12-03T12:00:00Z

by_robot:
  ashok:
    - STORY-001-001-1-db

by_status:
  COMPLETED:
    - STORY-001-001-1-db
```

**Regeneration:** Run `rebuild_state()` to regenerate from event log.

---

## Development

### Run Tests

```bash
npm test
```

### Manual Testing

```bash
# Start server
node index.js

# Send test request (in separate terminal)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node index.js
```

---

## Migration from MongoDB

See `/ROME_framework_maintenance/migration/MIGRATION-GUIDE.md`

---

## Troubleshooting

### State file missing or corrupted

```javascript
// Regenerate from event log
mcp__activity-log__rebuild_state()
```

### Event log corrupted line

1. Find corrupted line via parser error
2. Comment line with `#CORRUPTED:` prefix
3. Append corrected event
4. Rebuild state

```bash
# In activity-log.txt
#CORRUPTED: 2025-12-03T10:00:00Z | STORY | STORY-001 | stat�s:IN_PROGRESS
2025-12-03T10:01:00Z | STORY | STORY-001 | status:IN_PROGRESS | robot:ashok
```

### Query returns empty results

Check if state is up-to-date:

```javascript
// Rebuild state first
mcp__activity-log__rebuild_state()

// Then query
mcp__activity-log__query({ status: "BLOCKED" })
```

---

## Documentation

- **Format Spec:** `/ROME/framework-governance/activity-log-format.md` (ROME-GOV-008)
- **Usage Protocol:** `/ROME/framework-governance/ROME-PROC-005` (v2.0)
- **Proposal:** `/ROME_framework_maintenance/proposals/ROME-PROP-007-event-log-activity-tracking.md`

---

## License

MIT
