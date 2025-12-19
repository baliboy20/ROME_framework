# Activity Log File MCP Server: Testing Guide

**Document UID:** ROME-TEST-001
**Version:** 1.0
**Date:** 2025-12-19T00:00:00Z
**Status:** Active

---

## Overview

This guide provides step-by-step instructions for testing the `activity-log-file` MCP server implementing ROME-PROP-007.

**Server Location:**
`/Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_file_mcp`

**Tools Provided:**
1. `mcp__activity-log__append` - Append events to log
2. `mcp__activity-log__rebuild_state` - Regenerate state index
3. `mcp__activity-log__query` - Query current state
4. `mcp__activity-log__get_history` - Get event history
5. `mcp__activity-log__get_statistics` - Get statistics

---

## Prerequisites

### 1. Install Dependencies

```bash
cd /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_file_mcp
dart pub get
```

**Verify:** No errors, dependencies resolved.

### 2. Create Test Project

```bash
# Create test directory
mkdir -p ~/rome-test-project/ARTIFACTS

cd ~/rome-test-project
```

---

## Testing Method Options

### Option A: Direct Dart Execution (Manual Testing)

Test the server by running it directly and sending JSON-RPC commands via stdin.

### Option B: Claude Code MCP Integration (Recommended)

Configure the server in Claude Code and test via natural language commands.

### Option C: Unit Tests (Comprehensive)

Run the built-in test suite.

---

## Option A: Direct Dart Execution

### Step 1: Start Server Manually

```bash
cd /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_file_mcp

# Run server (it expects JSON-RPC on stdin)
dart run bin/server.dart
```

**Expected:** Server starts, waiting for JSON-RPC commands.

### Step 2: Send Test Commands

In a separate terminal, send JSON-RPC requests:

```bash
# Create test log file first
mkdir -p ~/rome-test-project/ARTIFACTS
cd ~/rome-test-project

# Initialize empty log
cat > ARTIFACTS/activity-log.txt << 'EOF'
# ROME Activity Log
# Project: test-project
# Created: 2025-12-19T00:00:00Z
# Format: TIMESTAMP | TYPE | ID | ATTRIBUTES

EOF
```

**Note:** Direct JSON-RPC testing requires crafting low-level protocol messages. Option B (Claude Code integration) is more practical.

---

## Option B: Claude Code MCP Integration (RECOMMENDED)

### Step 1: Configure MCP Server

Add server to Claude Code MCP config:

```bash
# Check current config location
ls -la ~/.config/claude-code/mcp-config.json

# Or use claude mcp add command
claude mcp add --transport stdio activity-log-file -- dart run /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_file_mcp/bin/server.dart
```

**Alternative:** Manually edit `~/.config/claude-code/mcp-config.json`:

```json
{
  "mcpServers": {
    "activity-log-file": {
      "command": "dart",
      "args": ["run", "/Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_file_mcp/bin/server.dart"],
      "type": "stdio"
    }
  }
}
```

### Step 2: Restart Claude Code

```bash
# Restart Claude Code to load new MCP server
# (Close and reopen, or use reload command if available)
```

### Step 3: Verify MCP Connection

In Claude Code session:

```javascript
// Ask Claude: "List available MCP tools for activity-log"
// Should see: append, rebuild_state, query, get_history, get_statistics
```

### Step 4: Initialize Test Project

```bash
# In Claude Code session, navigate to test project
cd ~/rome-test-project
mkdir -p ARTIFACTS

# Create initial log file
cat > ARTIFACTS/activity-log.txt << 'EOF'
# ROME Activity Log
# Project: test-project
# Created: 2025-12-19T00:00:00Z
# Format: TIMESTAMP | TYPE | ID | ATTRIBUTES

EOF
```

---

## Test Scenarios

### Test 1: Append Event (Basic)

**Objective:** Verify event appending works.

**Command:**
```javascript
mcp__activity-log__append({
  type: "PHASE",
  id: "PHASE-0",
  attributes: {
    status: "IN_PROGRESS",
    robot: "bootstrap",
    description: "Project bootup"
  }
})
```

**Verification:**
```bash
# Read last line of log
tail -1 ~/rome-test-project/ARTIFACTS/activity-log.txt

# Expected format:
# [TIMESTAMP] | PHASE | PHASE-0 | status:IN_PROGRESS | robot:bootstrap | description:Project bootup
```

**Success Criteria:**
- ✅ Event appended to file
- ✅ Timestamp is current (UTC)
- ✅ Format matches specification
- ✅ All attributes present

---

### Test 2: Rebuild State

**Objective:** Verify state index generation from events.

**Command:**
```javascript
mcp__activity-log__rebuild_state()
```

**Verification:**
```bash
# Check state file exists
ls -la ~/rome-test-project/ARTIFACTS/activity-state.yaml

# Read state contents
cat ~/rome-test-project/ARTIFACTS/activity-state.yaml
```

**Expected Output:**
```yaml
metadata:
  generated: [TIMESTAMP]
  event_count: 1
  last_event: [TIMESTAMP]

phases:
  PHASE-0:
    status: IN_PROGRESS
    robot: bootstrap
    description: Project bootup

features: {}
stories: {}
blockers: {}
amendments: {}

by_robot:
  bootstrap:
    - PHASE-0

by_status:
  IN_PROGRESS:
    - PHASE-0

statistics:
  total_phases: 1
  total_features: 0
  total_stories: 0
  open_blockers: 0
```

**Success Criteria:**
- ✅ State file generated
- ✅ PHASE-0 entry present
- ✅ Indexes populated (by_robot, by_status)
- ✅ Statistics accurate

---

### Test 3: Query State

**Objective:** Verify querying works.

**Setup:** Add more events first:

```javascript
// Add feature
mcp__activity-log__append({
  type: "FEATURE",
  id: "FEAT-001",
  attributes: {
    status: "IN_PROGRESS",
    robot: "talib",
    title: "User Authentication"
  }
})

// Add story
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "IN_PROGRESS",
    robot: "ashok",
    title: "User table schema"
  }
})

// Rebuild state
mcp__activity-log__rebuild_state()
```

**Query Tests:**

**A. Query by status:**
```javascript
mcp__activity-log__query({status: "IN_PROGRESS"})

// Expected: Returns PHASE-0, FEAT-001, STORY-001-001-1-db
```

**B. Query by robot:**
```javascript
mcp__activity-log__query({robot: "ashok"})

// Expected: Returns STORY-001-001-1-db
```

**C. Query by ID:**
```javascript
mcp__activity-log__query({id: "FEAT-001"})

// Expected: Returns FEAT-001 details
```

**Success Criteria:**
- ✅ Queries return matching entries
- ✅ Filters work correctly
- ✅ Response format is valid JSON

---

### Test 4: Event History

**Objective:** Verify history retrieval for entry with multiple events.

**Setup:** Update existing entry:

```javascript
// Complete story
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "COMPLETED",
    robot: "ashok",
    completed: "2025-12-19T10:30:00Z"
  }
})
```

**Query:**
```javascript
mcp__activity-log__get_history({id: "STORY-001-001-1-db"})
```

**Expected Output:**
```json
{
  "id": "STORY-001-001-1-db",
  "events": [
    {
      "timestamp": "[TIMESTAMP1]",
      "status": "IN_PROGRESS",
      "robot": "ashok",
      "title": "User table schema"
    },
    {
      "timestamp": "[TIMESTAMP2]",
      "status": "COMPLETED",
      "robot": "ashok",
      "completed": "2025-12-19T10:30:00Z"
    }
  ],
  "event_count": 2
}
```

**Success Criteria:**
- ✅ All events for ID returned
- ✅ Events in chronological order
- ✅ Timestamps preserved

---

### Test 5: Statistics

**Objective:** Verify statistics calculation.

**Command:**
```javascript
mcp__activity-log__get_statistics()
```

**Expected Output:**
```json
{
  "total_phases": 1,
  "total_features": 1,
  "total_stories": 1,
  "total_blockers": 0,
  "total_amendments": 0,
  "in_progress_count": 2,
  "completed_count": 1,
  "blocked_count": 0,
  "open_blockers": 0,
  "event_count": 4
}
```

**Success Criteria:**
- ✅ Counts accurate
- ✅ All metrics present

---

### Test 6: Blocker Workflow

**Objective:** Verify blocker creation, blocking, resolution.

**Steps:**

```javascript
// 1. Create blocker
mcp__activity-log__append({
  type: "BLOCKER",
  id: "BLOCK-001",
  attributes: {
    status: "OPEN",
    severity: "HIGH",
    title: "Missing database credentials",
    robot: "ashok",
    created: "2025-12-19T11:00:00Z"
  }
})

// 2. Block a story
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-2-db",
  attributes: {
    status: "BLOCKED",
    blocker: "BLOCK-001",
    robot: "ashok",
    title: "User auth queries"
  }
})

// 3. Rebuild state
mcp__activity-log__rebuild_state()

// 4. Query blocked items
mcp__activity-log__query({status: "BLOCKED"})
// Expected: STORY-001-001-2-db

// 5. Query open blockers
mcp__activity-log__query({status: "OPEN"})
// Expected: BLOCK-001

// 6. Resolve blocker
mcp__activity-log__append({
  type: "BLOCKER",
  id: "BLOCK-001",
  attributes: {
    status: "RESOLVED",
    resolution: "Credentials provided by DevOps",
    resolved: "2025-12-19T11:30:00Z"
  }
})

// 7. Unblock story
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-2-db",
  attributes: {
    status: "IN_PROGRESS",
    blocker: null,
    robot: "ashok"
  }
})

// 8. Rebuild and verify
mcp__activity-log__rebuild_state()
mcp__activity-log__query({status: "BLOCKED"})
// Expected: []
```

**Success Criteria:**
- ✅ Blocker workflow complete
- ✅ State updates correctly
- ✅ No blocked items after resolution

---

### Test 7: Corruption Recovery

**Objective:** Verify graceful handling of corrupted log lines.

**Steps:**

```bash
# 1. Add corrupted line
echo "MALFORMED LINE WITHOUT PIPES" >> ~/rome-test-project/ARTIFACTS/activity-log.txt

# 2. Rebuild (should skip corrupted line)
```

```javascript
mcp__activity-log__rebuild_state()
```

**Expected Behavior:**
- Server logs warning about corrupted line
- Rebuild completes successfully
- State contains all valid events

**Manual Fix:**
```bash
# Comment corrupted line
sed -i '' 's/^MALFORMED LINE/#CORRUPTED: MALFORMED LINE/' ~/rome-test-project/ARTIFACTS/activity-log.txt
```

**Success Criteria:**
- ✅ Server doesn't crash
- ✅ Warning logged
- ✅ State rebuilt from valid events

---

### Test 8: Performance Benchmark

**Objective:** Verify performance targets.

**Setup:**
```bash
# Generate 1000 test events
for i in {1..1000}; do
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | STORY | STORY-PERF-${i} | status:COMPLETED | robot:benchmark" >> ~/rome-test-project/ARTIFACTS/activity-log.txt
done
```

**Benchmark Tests:**

**A. Rebuild Speed:**
```javascript
// Time the rebuild
mcp__activity-log__rebuild_state()
```

**Target:** < 2 seconds for 1000 events

**B. Query Speed:**
```javascript
// Time the query
mcp__activity-log__query({status: "COMPLETED"})
```

**Target:** < 20ms

**C. History Retrieval:**
```javascript
// Time history for single entry
mcp__activity-log__get_history({id: "STORY-PERF-500"})
```

**Target:** < 50ms

**Success Criteria:**
- ✅ Rebuild < 2s
- ✅ Query < 20ms
- ✅ History < 50ms

---

### Test 9: Git Tracking

**Objective:** Verify git-friendly format.

**Steps:**

```bash
cd ~/rome-test-project

# Initialize git
git init
git add ARTIFACTS/activity-log.txt
git commit -m "Initial activity log"

# Add new events via MCP
```

```javascript
mcp__activity-log__append({
  type: "FEATURE",
  id: "FEAT-002",
  attributes: {
    status: "IN_PROGRESS",
    robot: "talib",
    title: "Authorization system"
  }
})
```

```bash
# Check git diff
git diff ARTIFACTS/activity-log.txt

# Expected: Shows new event line appended
```

**Success Criteria:**
- ✅ Git tracks log file
- ✅ Diffs show only new lines
- ✅ Clean append-only format

---

## Option C: Unit Tests

### Run Built-in Test Suite

```bash
cd /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_file_mcp

# Run all tests
dart test

# Run specific test file
dart test test/append_test.dart
dart test test/rebuild_state_test.dart
dart test test/query_test.dart
```

**Expected:** All tests pass.

---

## Quick Test Script

For rapid validation, run this complete test sequence:

```bash
#!/bin/bash
# quick-test-mcp.sh

PROJECT_PATH=~/rome-test-project

echo "=== ROME Activity Log MCP Server - Quick Test ==="
echo ""

# Setup
echo "1. Creating test project..."
mkdir -p $PROJECT_PATH/ARTIFACTS
cd $PROJECT_PATH

# Initialize log
cat > ARTIFACTS/activity-log.txt << 'EOF'
# ROME Activity Log
# Project: test-project
# Created: 2025-12-19T00:00:00Z
# Format: TIMESTAMP | TYPE | ID | ATTRIBUTES

EOF

echo "2. Test complete. Now run tests in Claude Code:"
echo ""
echo "   cd ~/rome-test-project"
echo ""
echo "   # Test 1: Append event"
echo "   mcp__activity-log__append({type: 'PHASE', id: 'PHASE-0', attributes: {status: 'IN_PROGRESS', robot: 'bootstrap'}})"
echo ""
echo "   # Test 2: Rebuild state"
echo "   mcp__activity-log__rebuild_state()"
echo ""
echo "   # Test 3: Query"
echo "   mcp__activity-log__query({status: 'IN_PROGRESS'})"
echo ""
echo "   # Test 4: Statistics"
echo "   mcp__activity-log__get_statistics()"
echo ""
echo "   # Test 5: Verify files"
echo "   cat ARTIFACTS/activity-log.txt"
echo "   cat ARTIFACTS/activity-state.yaml"
```

---

## Troubleshooting

### Server Won't Start

**Symptom:** `dart run bin/server.dart` fails

**Checks:**
```bash
# Verify Dart installation
dart --version

# Check dependencies installed
cd /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_file_mcp
dart pub get

# Check for syntax errors
dart analyze
```

### MCP Tools Not Available

**Symptom:** Claude Code doesn't see `mcp__activity-log__*` tools

**Checks:**
```bash
# Verify MCP config
cat ~/.config/claude-code/mcp-config.json

# Verify server path correct
ls -la /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_file_mcp/bin/server.dart

# Restart Claude Code
```

### State Rebuild Fails

**Symptom:** `rebuild_state()` returns error

**Checks:**
```bash
# Verify log file exists
ls -la $PROJECT_PATH/ARTIFACTS/activity-log.txt

# Check log format
head -10 $PROJECT_PATH/ARTIFACTS/activity-log.txt

# Look for corrupted lines (lines without pipes)
grep -v '|' $PROJECT_PATH/ARTIFACTS/activity-log.txt | grep -v '^#'
```

### Query Returns Empty

**Symptom:** Query returns no results when entries should exist

**Checks:**
```bash
# Verify state file exists
ls -la $PROJECT_PATH/ARTIFACTS/activity-state.yaml

# Check state content
cat $PROJECT_PATH/ARTIFACTS/activity-state.yaml

# Rebuild state (may be stale)
```

```javascript
mcp__activity-log__rebuild_state()
```

---

## Success Criteria Summary

**Server is working correctly when:**

- ✅ All 5 MCP tools callable from Claude Code
- ✅ Events append to log file with correct format
- ✅ State index regenerates successfully
- ✅ Queries return correct results
- ✅ Event history retrieval works
- ✅ Statistics calculation accurate
- ✅ Blocker workflow functional
- ✅ Handles corrupted lines gracefully
- ✅ Performance targets met
- ✅ Git tracking works

---

## Next Steps After Testing

Once all tests pass:

1. **Update ROME-PROP-007 Status:**
   - Mark Phase 6 (Testing) as COMPLETE
   - Document test results
   - Update completion percentage to 100%

2. **Production Deployment:**
   - Add MCP server to all developer machines
   - Update bootstrap scripts to use new server
   - Create projects with event log system

3. **Migration:**
   - Follow ROME-MIG-001 for existing projects
   - Migrate MongoDB data to event log
   - Verify data preservation

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2025-12-19T00:00:00Z | Initial testing guide created |
