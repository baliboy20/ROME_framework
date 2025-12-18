# ROME-PROP-007: Implementation Plan

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROP-007-IMPL |
| **Parent Proposal** | ROME-PROP-007 |
| **Version** | 0.1 |
| **Date** | 2025-12-18T00:00:00Z |
| **Status** | Draft |

---

## Implementation Phases

### Phase 1: Event Log Format Specification

**Duration:** 1 day

**Deliverables:**
- Create `ROME/framework-governance/activity-log-format.md`
- Define event line format specification
- Define attribute schemas per entry type
- Provide format examples

**File Structure:**
```markdown
# Activity Log Format Specification

## Event Line Format
TIMESTAMP | TYPE | ID | ATTR1:VALUE1 | ATTR2:VALUE2 | ...

## Entry Types
- PHASE: Phase transitions
- FEATURE: Feature-level work
- STORY: User story implementation
- BLOCKER: Impediments
- AMENDMENT: Change requests

## Attribute Schemas
[Per-type attribute definitions]

## Examples
[Comprehensive examples]
```

**Acceptance Criteria:**
- [ ] Format specification complete
- [ ] All current MongoDB fields mappable to event attributes
- [ ] Example events for all entry types
- [ ] Document follows ROME-GOV-001 standards

---

### Phase 2: MCP Server Implementation

**Duration:** 2 days

**Deliverables:**
- New MCP server: `activity-log-file`
- Tool: `mcp__activity-log__append(event)`
- Tool: `mcp__activity-log__rebuild_state()`
- Tool: `mcp__activity-log__query(filter)`
- Tool: `mcp__activity-log__get_history(id)`

**Server Location:**
```
~/Library/Application Support/Claude/
└── mcp-servers/
    └── activity-log-file/
        ├── package.json
        ├── index.js
        ├── lib/
        │   ├── event-parser.js
        │   ├── state-builder.js
        │   └── query-engine.js
        └── README.md
```

**Tool Specifications:**

#### append(event)
```javascript
// Input
{
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {
    status: "IN_PROGRESS",
    robot: "ashok",
    started: "2025-12-03T10:00:00Z"
  }
}

// Action
1. Generate timestamp (UTC)
2. Format event line
3. Append to ARTIFACTS/activity-log.txt
4. Verify append successful

// Output
{
  success: true,
  event: "2025-12-03T10:00:00Z | STORY | STORY-001-001-1-db | status:IN_PROGRESS | robot:ashok | started:2025-12-03T10:00:00Z"
}
```

#### rebuild_state()
```javascript
// Input: none

// Action
1. Read ARTIFACTS/activity-log.txt
2. Parse all events
3. Build current state per entry ID (latest event wins)
4. Generate query indexes (by_robot, by_status, by_phase)
5. Calculate statistics
6. Write ARTIFACTS/activity-state.yaml

// Output
{
  success: true,
  eventCount: 127,
  entryCount: 43,
  generatedAt: "2025-12-03T15:00:00Z"
}
```

#### query(filter)
```javascript
// Input
{
  status: "BLOCKED"  // or robot: "ashok", phase: "2", etc.
}

// Action
1. Read ARTIFACTS/activity-state.yaml
2. Parse YAML
3. Query via index (by_status, by_robot, by_phase)
4. Return matching entries

// Output
{
  results: [
    {id: "STORY-001-002-1-db", status: "BLOCKED", robot: "ashok", ...},
    ...
  ],
  count: 2
}
```

#### get_history(id)
```javascript
// Input
{
  id: "STORY-001-001-1-db"
}

// Action
1. Grep ARTIFACTS/activity-log.txt for ID
2. Parse matching lines
3. Return chronological event list

// Output
{
  id: "STORY-001-001-1-db",
  events: [
    {timestamp: "2025-12-02T14:05:00Z", status: "PENDING", robot: "talib"},
    {timestamp: "2025-12-03T10:00:00Z", status: "IN_PROGRESS", robot: "ashok"},
    {timestamp: "2025-12-03T12:00:00Z", status: "COMPLETED", robot: "ashok"}
  ],
  eventCount: 3
}
```

**Testing:**
```bash
# Test append
mcp__activity-log__append({type: "TEST", id: "TEST-001", attributes: {status: "PASS"}})

# Verify file
tail -1 ARTIFACTS/activity-log.txt
# Should show: [TIMESTAMP] | TEST | TEST-001 | status:PASS

# Test rebuild
mcp__activity-log__rebuild_state()

# Verify state
cat ARTIFACTS/activity-state.yaml
# Should contain TEST-001 entry

# Test query
mcp__activity-log__query({status: "PASS"})
# Should return: [{id: "TEST-001", ...}]

# Test history
mcp__activity-log__get_history("TEST-001")
# Should return: {events: [...]}
```

**Acceptance Criteria:**
- [ ] All 4 tools functional
- [ ] Append atomic (concurrent-safe)
- [ ] Rebuild handles malformed lines gracefully
- [ ] Query performance <20ms for 1000 entries
- [ ] History grep performance <50ms

---

### Phase 3: Update ROME-PROC-005 Activity Logging Protocol

**Duration:** 1 day

**Deliverable:** ROME-PROC-005 v2.0

**Changes:**

**Remove:**
- §2.2 Database Discovery
- All MongoDB MCP tool references
- Complex mutation procedures

**Add:**
- §2 Event Log System
  - Event log file specification
  - State index file specification
  - Generation rules
- §3 Logging Procedures (updated)
  - Append event pattern
  - Verify append pattern
  - Rebuild state pattern
- §8 Error Handling (updated)
  - Activity log unavailable
  - Corrupted event log
  - Missing state index

**Replace all examples:**
```markdown
# Before
mcp__activity-log__update_entry({
  id: "STORY-001",
  updates: {status: "IN_PROGRESS"}
})

# After
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001",
  attributes: {
    status: "IN_PROGRESS",
    robot: "[robot-name]",
    started: "[ISO-8601]"
  }
})
```

**Acceptance Criteria:**
- [ ] All MongoDB references removed
- [ ] All procedures updated to event log pattern
- [ ] Error handling covers new failure modes
- [ ] Examples provided for all entry types
- [ ] Document follows ROME-GOV-001 standards

---

### Phase 4: Update Robot Procedures

**Duration:** 2 days

**Affected Documents:**
- ROME-ROBOT-001 v2.0 (Bootstrap)
- ROME-ROBOT-002 v2.0 (Talib)
- ROME-ROBOT-003 v2.0 (PMA)
- ROME-ROBOT-004 v2.0 (Roma)
- ROME-ROBOT-007 v2.0 (Charlie)
- ROME-ROBOT-008 v2.0 (Reena)
- ROME-ROBOT-009 v2.0 (Lucien)
- ROME-ROBOT-010 v2.0 (Ashok)

**Change Pattern (Per Robot):**

1. Find all MongoDB MCP tool calls
2. Replace with event log append pattern
3. Update verification steps
4. Update error handling

**Bootstrap-Specific (ROME-ROBOT-001):**

Add Step 2.5: Initialize Activity Log

```bash
# Create event log file with header
cat > "$PROJECT_PATH/ARTIFACTS/activity-log.txt" << 'EOF'
# ROME Activity Log
# Project: $PROJECT_NAME
# Created: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Format: TIMESTAMP | TYPE | ID | ATTRIBUTES

EOF

# Append first event
mcp__activity-log__append({
  type: "PHASE",
  id: "PHASE-0",
  attributes: {
    status: "IN_PROGRESS",
    robot: "bootstrap",
    description: "Project bootup"
  }
})

# Generate initial state index
mcp__activity-log__rebuild_state()
```

**Roma-Specific (ROME-ROBOT-004):**

Major changes to query patterns:

```markdown
# Before
blockers = mcp__activity-log__find_by_status("BLOCKED")
ashokWork = mcp__activity-log__find_by_robot("ashok")

# After
state = Read("ARTIFACTS/activity-state.yaml")
blockers = state.by_status.BLOCKED
ashokWork = state.by_robot.ashok

# Or via MCP
blockers = mcp__activity-log__query({status: "BLOCKED"})
ashokWork = mcp__activity-log__query({robot: "ashok"})
```

Add new procedure: Daily State Rebuild

```markdown
### Daily State Validation (Roma)

**Frequency:** Once per day, before daily status report

1. Rebuild state index
   → mcp__activity-log__rebuild_state()

2. Verify statistics
   → Compare event count with yesterday
   → Check for unexpected changes

3. Scan for anomalies
   → Stories IN_PROGRESS > 24 hours
   → Blockers OPEN > 7 days

4. Generate compliance report
```

**Acceptance Criteria:**
- [ ] All 8 robot documents updated
- [ ] All MongoDB references removed
- [ ] Bootstrap initializes event log
- [ ] Roma uses state index for queries
- [ ] Examples consistent with ROME-PROC-005 v2.0

---

### Phase 5: Migration Tool

**Duration:** 1 day

**Deliverable:** MongoDB → Event Log migration script

**Location:**
```
ROME_framework_maintenance/migration/
└── mongodb-to-eventlog.js
```

**Script Logic:**

```javascript
#!/usr/bin/env node
// MongoDB to Event Log Migration
// Usage: node mongodb-to-eventlog.js <project-path>

const fs = require('fs');
const path = require('path');

async function migrate(projectPath) {
  console.log('Reading .rome-project.json...');
  const config = JSON.parse(fs.readFileSync(path.join(projectPath, '.rome-project.json')));
  const dbName = config.activityLog.database;

  console.log(`Connecting to MongoDB: ${dbName}...`);
  // Use existing activity-log MCP to read all entries
  const entries = await mcp__activity-log__list_all_entries();

  console.log(`Found ${entries.length} entries. Converting...`);

  const events = [];
  for (const entry of entries) {
    const timestamp = entry.createdDate || entry.startDate || new Date().toISOString();
    const type = entry.type.toUpperCase();
    const id = entry.id;

    // Build attributes (exclude internal MongoDB fields)
    const attrs = Object.entries(entry)
      .filter(([key]) => !['_id', 'createdDate', 'type', 'id'].includes(key))
      .map(([key, value]) => {
        // Quote strings with spaces
        const val = typeof value === 'string' && value.includes(' ')
          ? `"${value}"`
          : value;
        return `${key}:${val}`;
      });

    events.push({
      timestamp,
      line: `${timestamp} | ${type} | ${id} | ${attrs.join(' | ')}`
    });
  }

  // Sort by timestamp
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  console.log('Writing activity-log.txt...');
  const logPath = path.join(projectPath, 'ARTIFACTS', 'activity-log.txt');

  fs.writeFileSync(logPath, [
    '# ROME Activity Log',
    `# Project: ${config.projectName}`,
    `# Migrated from MongoDB: ${new Date().toISOString()}`,
    '# Format: TIMESTAMP | TYPE | ID | ATTRIBUTES',
    '',
    ...events.map(e => e.line)
  ].join('\n'));

  console.log('Rebuilding state index...');
  await mcp__activity-log__rebuild_state();

  console.log('Verifying migration...');
  const eventCount = events.length;
  const state = YAML.parse(fs.readFileSync(path.join(projectPath, 'ARTIFACTS', 'activity-state.yaml'), 'utf8'));
  const stateCount = Object.keys(state.phases).length +
                     Object.keys(state.features).length +
                     Object.keys(state.stories).length +
                     Object.keys(state.blockers).length +
                     Object.keys(state.amendments).length;

  console.log(`\nMigration Summary:`);
  console.log(`  Events written: ${eventCount}`);
  console.log(`  State entries: ${stateCount}`);
  console.log(`  Status: ${eventCount >= stateCount ? 'SUCCESS' : 'WARNING - count mismatch'}`);

  console.log(`\nNext steps:`);
  console.log(`  1. Review ARTIFACTS/activity-log.txt`);
  console.log(`  2. Review ARTIFACTS/activity-state.yaml`);
  console.log(`  3. Update .rome-project.json activityLog.system to "event-log"`);
  console.log(`  4. MongoDB database can be dropped after 30-day retention`);
}

// Run migration
const projectPath = process.argv[2];
if (!projectPath) {
  console.error('Usage: node mongodb-to-eventlog.js <project-path>');
  process.exit(1);
}

migrate(projectPath).catch(console.error);
```

**Manual Verification Steps:**

```bash
# After migration, manually verify

# 1. Check event count
wc -l < ARTIFACTS/activity-log.txt

# 2. Check state structure
head -50 ARTIFACTS/activity-state.yaml

# 3. Spot-check critical entries
grep "PHASE-2" ARTIFACTS/activity-log.txt
grep "FEAT-001" ARTIFACTS/activity-log.txt

# 4. Verify current phase
grep "currentPhase" .rome-project.json
grep "PHASE-" ARTIFACTS/activity-state.yaml | grep "status: IN_PROGRESS"

# 5. Test query
mcp__activity-log__query({status: "IN_PROGRESS"})

# 6. Test history
mcp__activity-log__get_history("PHASE-2")
```

**Acceptance Criteria:**
- [ ] Script converts all MongoDB entries
- [ ] Timestamp ordering preserved
- [ ] All attributes mapped correctly
- [ ] State index regenerates successfully
- [ ] Verification shows 100% entry preservation
- [ ] Migration guide documentation complete

---

### Phase 6: Testing & Validation

**Duration:** 2 days

**Test Scenarios:**

#### 1. Fresh Project Bootstrap
```bash
# Run bootstrap with new event log system
cd test-projects/
./bootstrap-new-project.sh

# Verify
[ -f ARTIFACTS/activity-log.txt ]
[ -f ARTIFACTS/activity-state.yaml ]
grep "PHASE-0" ARTIFACTS/activity-log.txt
```

#### 2. Robot Activity Logging
```bash
# Simulate robot workflow
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-db",
  attributes: {status: "IN_PROGRESS", robot: "ashok"}
})

# Verify append
tail -1 ARTIFACTS/activity-log.txt | grep "STORY-001-001-1-db"

# Rebuild state
mcp__activity-log__rebuild_state()

# Query
mcp__activity-log__query({robot: "ashok"})
# Expected: [{id: "STORY-001-001-1-db", ...}]
```

#### 3. Roma Monitoring
```bash
# Add multiple entries
for i in {1..10}; do
  mcp__activity-log__append({
    type: "STORY",
    id: "STORY-001-00${i}-1-db",
    attributes: {status: "IN_PROGRESS", robot: "ashok"}
  })
done

# Rebuild state
mcp__activity-log__rebuild_state()

# Query all ashok work
state = Read("ARTIFACTS/activity-state.yaml")
state.by_robot.ashok.length
# Expected: 10
```

#### 4. Blocker Workflow
```bash
# Create blocker
mcp__activity-log__append({
  type: "BLOCKER",
  id: "BLOCK-001",
  attributes: {
    status: "OPEN",
    severity: "HIGH",
    feature: "FEAT-001",
    robot: "ashok",
    title: "Missing API spec"
  }
})

# Block story
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-api",
  attributes: {status: "BLOCKED", blocker: "BLOCK-001", robot: "reena"}
})

# Rebuild
mcp__activity-log__rebuild_state()

# Query blocked items
mcp__activity-log__query({status: "BLOCKED"})
# Expected: [{id: "STORY-001-001-1-api", ...}]

# Query open blockers
mcp__activity-log__query({status: "OPEN"})
# Expected: [{id: "BLOCK-001", ...}]

# Resolve blocker
mcp__activity-log__append({
  type: "BLOCKER",
  id: "BLOCK-001",
  attributes: {status: "RESOLVED", resolution: "Spec provided by PMA"}
})

# Unblock story
mcp__activity-log__append({
  type: "STORY",
  id: "STORY-001-001-1-api",
  attributes: {status: "IN_PROGRESS", blocker: null}
})

# Verify
mcp__activity-log__query({status: "BLOCKED"})
# Expected: []
```

#### 5. Event History
```bash
# Get full story history
mcp__activity-log__get_history("STORY-001-001-1-db")

# Expected:
# {
#   events: [
#     {timestamp: ..., status: "PENDING"},
#     {timestamp: ..., status: "IN_PROGRESS"},
#     {timestamp: ..., status: "COMPLETED"}
#   ]
# }
```

#### 6. Corruption Recovery
```bash
# Simulate corrupted line
echo "MALFORMED LINE WITHOUT PIPES" >> ARTIFACTS/activity-log.txt

# Rebuild (should skip corrupted line)
mcp__activity-log__rebuild_state()
# Expected: Warning about line [N], state rebuilt successfully

# Manual fix
# Comment corrupted line with #CORRUPTED prefix
# Append corrected event
```

#### 7. Git Tracking
```bash
# Make changes
mcp__activity-log__append({...})

# Check git status
git status
# Expected: ARTIFACTS/activity-log.txt modified

# View changes
git diff ARTIFACTS/activity-log.txt
# Expected: Shows new event line
```

#### 8. Performance Benchmark
```bash
# Generate 1000 events
for i in {1..1000}; do
  mcp__activity-log__append({
    type: "STORY",
    id: "STORY-PERF-${i}",
    attributes: {status: "COMPLETED"}
  })
done

# Time rebuild
time mcp__activity-log__rebuild_state()
# Target: <2 seconds

# Time query
time mcp__activity-log__query({status: "COMPLETED"})
# Target: <20ms
```

**Acceptance Criteria:**
- [ ] All test scenarios pass
- [ ] Performance targets met
- [ ] Error handling verified
- [ ] Recovery procedures tested
- [ ] Git tracking confirmed

---

### Phase 7: Documentation

**Duration:** 1 day

**Deliverables:**

#### 1. Migration Guide
**File:** `ROME_framework_maintenance/migration/MIGRATION-GUIDE.md`

**Contents:**
- Prerequisites
- Step-by-step migration procedure
- Verification checklist
- Rollback procedure
- Troubleshooting

#### 2. Event Log Usage Guide
**File:** `ROME/framework-governance/activity-log-usage-guide.md`

**Contents:**
- Event log concepts
- Robot workflow examples
- Roma monitoring patterns
- Common queries
- Debugging techniques

#### 3. Updated README
**File:** `ROME/README.md`

**Add section:**
```markdown
## Activity Tracking

ROME v10 uses an append-only event log for activity tracking.

**Key Files:**
- `ARTIFACTS/activity-log.txt` - Complete audit trail
- `ARTIFACTS/activity-state.yaml` - Current state (generated)

**MCP Tools:**
- `mcp__activity-log__append(event)` - Log activity
- `mcp__activity-log__rebuild_state()` - Regenerate state
- `mcp__activity-log__query(filter)` - Query current state
- `mcp__activity-log__get_history(id)` - View entry history

**See:** `framework-governance/activity-log-usage-guide.md`
```

#### 4. Changelog
**File:** `ROME/CHANGELOG.md`

**Add entry:**
```markdown
## v10.1.0 - Activity Log System Redesign

### Breaking Changes
- **ROME-PROP-007**: Replaced MongoDB activity-log with event log system
  - Migration required for existing projects
  - See `ROME_framework_maintenance/migration/MIGRATION-GUIDE.md`

### Added
- Append-only event log (`ARTIFACTS/activity-log.txt`)
- Generated state index (`ARTIFACTS/activity-state.yaml`)
- New MCP server: `activity-log-file`
- Complete git-tracked audit trail

### Changed
- ROME-PROC-005 v2.0: Event log procedures
- All ROME-ROBOT-* v2.0: Updated logging patterns
- Bootstrap initializes event log instead of MongoDB

### Removed
- MongoDB dependency for activity tracking
- `activity-log` MCP server (replaced with `activity-log-file`)

### Performance
- 40x faster write operations
- 5-20x faster read operations
- Zero database overhead
```

**Acceptance Criteria:**
- [ ] Migration guide complete with examples
- [ ] Usage guide covers all common scenarios
- [ ] README updated with new system overview
- [ ] Changelog documents breaking changes
- [ ] All documentation follows ROME-GOV-001

---

## Rollback Plan

**If migration fails or critical issues discovered:**

### Immediate Rollback (< 24 hours)

1. **Revert .rome-project.json:**
   ```json
   {
     "activityLog": {
       "system": "mongodb",
       "database": "rome_my_project"
     }
   }
   ```

2. **Restore MongoDB MCP server:**
   - Reactivate `activity-log` MCP server
   - Verify database connectivity

3. **Verify MongoDB data intact:**
   ```javascript
   mcp__activity-log__get_statistics()
   // Should show all original entries
   ```

4. **Delete event log files:**
   ```bash
   rm ARTIFACTS/activity-log.txt
   rm ARTIFACTS/activity-state.yaml
   ```

### Gradual Rollback (> 24 hours, data added to event log)

1. **Export event log to MongoDB:**
   - Parse `activity-log.txt`
   - Insert new events into MongoDB
   - Verify counts match

2. **Follow immediate rollback steps**

3. **Verify data integrity:**
   - Compare MongoDB entry count with event log
   - Spot-check critical entries

### Prevention

- Keep MongoDB running for 30 days after migration
- Backup event log before each major operation
- Test rollback procedure in staging environment

---

## Success Criteria

**Phase 1-7 Complete When:**
- [ ] All 8 implementation phases delivered
- [ ] All test scenarios passing
- [ ] All documentation complete
- [ ] Migration tool validated on test project
- [ ] Performance targets met:
  - Append: <10ms
  - Query: <20ms
  - Rebuild: <2s for 10k events
- [ ] ROME framework documents updated:
  - ROME-PROC-005 v2.0
  - All ROME-ROBOT-* v2.0
  - ROME-GOV-NEW (event log format spec)
- [ ] UID registry updated (ROME-PROP-007 registered)
- [ ] Rollback procedure tested

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-12-18T00:00:00Z | Initial implementation plan |
