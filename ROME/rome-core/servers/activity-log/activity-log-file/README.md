# ROME Activity Log File - MCP Server

Event-based file system for ROME activity tracking.

## Overview

This MCP server replaces the MongoDB-based activity-log system with a simpler, faster, git-trackable event log architecture.

**Key Features:**
- ✅ Append-only event log (`ARTIFACTS/activity-log.txt`)
- ✅ Direct log parsing (no intermediate state file)
- ✅ 40x faster writes vs. MongoDB
- ✅ Git-trackable complete audit trail
- ✅ No database dependency
- ✅ Human-readable text files
- ✅ Always current data (no sync issues)

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
  id: "STORY-001-001-1-database",
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
  event: "2025-12-03T10:00:00Z | STORY | STORY-001-001-1-database | status:IN_PROGRESS | robot:ashok | started:2025-12-03T10:00:00Z",
  timestamp: "2025-12-03T10:00:00Z"
}
```

**Example:**
```javascript
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-database",
  attributes: {
    status: "IN_PROGRESS",
    robot: "ashok",
    started: "2025-12-03T10:00:00Z"
  }
})
```

---

### 2. `mcp__activity-log__rebuild_state()` **[DEPRECATED]**

**⚠️ DEPRECATED:** State file eliminated in favor of direct log parsing. This operation is now a no-op.

Queries (`query`, `get_statistics`) now parse the event log directly on every call, ensuring always-current data with no sync issues.

**Returns:**
```javascript
{
  success: true,
  deprecated: true,
  message: "State file eliminated - queries now parse log directly. This operation is a no-op.",
  event_count: 127,
  entry_count: 43,
  generated_at: "2025-12-03T15:00:00Z"
}
```

**Migration Note:** Remove calls to this function. It's kept for backward compatibility but does nothing.

---

### 3. `mcp__activity-log__query(filter)`

Query current activity state.

**Parameters:**
```javascript
{
  // Optional filters (use one or combine)
  id: "STORY-001-001-1-database",  // Find specific entry
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
      id: "STORY-001-001-1-database",
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
mcp__activity-log__query({ id: "STORY-001-001-1-database" })

// Find all Phase 2 entries
mcp__activity-log__query({ phase: 2 })
```

---

### 4. `mcp__activity-log__get_history(id)`

Get complete event history for an entry.

**Parameters:**
```javascript
{
  id: "STORY-001-001-1-database"
}
```

**Returns:**
```javascript
{
  id: "STORY-001-001-1-database",
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

**Single source of truth** - Append-only event stream:

```
# ROME Activity Log
# Project: my_project
# Created: 2025-12-01T10:00:00Z
# Format: TIMESTAMP | TYPE | ID | ATTRIBUTES

2025-12-03T10:00:00Z | STORY | STORY-001-001-1-database | status:IN_PROGRESS | robot:ashok | started:2025-12-03T10:00:00Z
2025-12-03T12:00:00Z | STORY | STORY-001-001-1-database | status:COMPLETED | robot:ashok | completed:2025-12-03T12:00:00Z
```

**Rules:**
- NEVER edit previous lines
- ONLY append new events
- Timestamps MUST be chronologically increasing

**Query Behavior:**
- All queries parse this file directly
- State built in-memory on each query
- Always returns current data
- No intermediate state files

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

### Event log corrupted line

1. Find corrupted line via parser error
2. Comment line with `#CORRUPTED:` prefix
3. Append corrected event
4. Query again (automatically parses corrected log)

```bash
# In activity-log.txt
#CORRUPTED: 2025-12-03T10:00:00Z | STORY | STORY-001 | stat�s:IN_PROGRESS
2025-12-03T10:01:00Z | STORY | STORY-001 | status:IN_PROGRESS | robot:ashok
```

### Query returns empty results

Verify event log format:

```bash
# Check log file exists and has events
tail ARTIFACTS/activity-log.txt

# Verify event format
grep "STORY-001" ARTIFACTS/activity-log.txt
```

### Performance concerns

For very large logs (>10,000 events), consider:
- Archiving old events to separate log files
- Implementing log rotation strategy
- Adding caching layer if needed

---

## Documentation

- **Format Spec:** `/ROME/framework-governance/activity-log-format.md` (ROME-GOV-008)
- **Usage Protocol:** `/ROME/framework-governance/ROME-PROC-005` (v2.0)
- **Proposal:** `/ROME_framework_maintenance/proposals/ROME-PROP-007-event-log-activity-tracking.md`

---

## License

MIT
