# MongoDB to Event Log Migration Guide

| Field | Value |
|-------|-------|
| **Document UID** | ROME-MIG-001 |
| **Version** | 1.0 |
| **Date** | 2025-12-18T00:00:00Z |
| **For ROME Version** | 10.1+ |
| **Related Proposal** | ROME-PROP-007 |

---

## Overview

This guide provides step-by-step instructions for migrating existing ROME v10 projects from MongoDB-based activity tracking to the new event log system.

**Migration Type:** Breaking change - requires manual migration
**Estimated Time:** 30-45 minutes per project
**Rollback Available:** Yes (keep MongoDB for 30 days)

---

## Prerequisites

Before migrating:
- [ ] Backup your MongoDB database
- [ ] Ensure all robots have completed their current work
- [ ] Update ROME framework to v10.1+
- [ ] Install new `activity-log-file` MCP server
- [ ] Git commit all current work

---

## Migration Steps

### Step 1: Backup Current State

**Save MongoDB data:**

```bash
# Export current MongoDB database
mongodump --db rome_[your_project_name] --out ./mongodb_backup_$(date +%Y%m%d)

# Verify backup
ls -la mongodb_backup_*

# Archive backup
tar -czf mongodb_backup_$(date +%Y%m%d).tar.gz mongodb_backup_*
```

**Commit current state:**

```bash
cd /path/to/your/project
git add .
git commit -m "Pre-migration state - MongoDB activity log"
git tag pre-event-log-migration
```

---

### Step 2: Install New MCP Server

**Add activity-log-file MCP server:**

```bash
claude mcp add --transport stdio activity-log-file -- dart run /Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_file_mcp/bin/server.dart
```

**Verify installation:**

```bash
# Check MCP config
cat ~/.config/claude-code/mcp-config.json | grep activity-log-file
```

**Test new server:**

```javascript
// From Claude Code
mcp__activity-log__get_statistics()
// Should return { success: false, error: "Activity log file not found" }
// This is expected - we haven't created the log yet
```

---

### Step 3: Export MongoDB to Event Log

**Create export script:**

```bash
cd /path/to/your/project
mkdir -p scripts
cat > scripts/export_mongodb_to_eventlog.js << 'EOF'
#!/usr/bin/env node

// MongoDB to Event Log Exporter
// Run from project root

const fs = require('fs');
const path = require('path');

async function exportToEventLog() {
  const projectConfig = JSON.parse(fs.readFileSync('.rome-project.json', 'utf8'));
  const projectName = projectConfig.projectName;

  console.log(`Exporting MongoDB activity log for: ${projectName}\n`);

  // Connect to MongoDB via MCP (use old activity-log MCP server)
  console.log('Reading MongoDB entries via MCP...');

  // NOTE: You'll need to call this via Claude Code with old MCP server active
  // const entries = await mcp__activity-log__list_all_entries();

  // For manual export, list entry IDs:
  console.log('\nTo complete export, use Claude Code to:');
  console.log('1. Call: mcp__activity-log__list_all_entries()');
  console.log('2. For each entry, write to activity-log.txt in event format');
  console.log('3. Run rebuild_state() when complete');
}

exportToEventLog().catch(console.error);
EOF

chmod +x scripts/export_mongodb_to_eventlog.js
```

**Export via Claude Code:**

Since MongoDB export requires the MCP connection, perform this step interactively:

```javascript
// 1. Get all entries from MongoDB
const allEntries = await mcp__activity-log__list_all_entries();

console.log(`Found ${allEntries.length} entries to migrate`);

// 2. Create activity log file with header
const fs = require('fs');
const logPath = 'ARTIFACTS/activity-log.txt';

const header = `# ROME Activity Log
# Project: ${projectConfig.projectName}
# Migrated from MongoDB: ${new Date().toISOString()}
# Format: TIMESTAMP | TYPE | ID | ATTRIBUTES

`;

fs.writeFileSync(logPath, header);

// 3. Convert each entry to event format
const events = [];

for (const entry of allEntries) {
  const timestamp = entry.createdDate || entry.startDate || new Date().toISOString();
  const type = entry.type.toUpperCase();
  const id = entry.id;

  // Build attributes (exclude internal fields)
  const attrs = [];
  for (const [key, value] of Object.entries(entry)) {
    if (['_id', 'createdDate', 'type', 'id'].includes(key)) continue;

    // Quote strings with spaces
    const formattedValue = typeof value === 'string' && value.includes(' ')
      ? `"${value.replace(/"/g, '\\"')}"`
      : value;

    attrs.push(`${key}:${formattedValue}`);
  }

  const eventLine = `${timestamp} | ${type} | ${id} | ${attrs.join(' | ')}\n`;
  events.push({ timestamp: new Date(timestamp), line: eventLine });
}

// 4. Sort by timestamp
events.sort((a, b) => a.timestamp - b.timestamp);

// 5. Write to log file
for (const event of events) {
  fs.appendFileSync(logPath, event.line);
}

console.log(`Exported ${events.length} events to ${logPath}`);
```

---

### Step 4: Rebuild State Index

```javascript
// Generate activity-state.yaml from event log
await mcp__activity-log__rebuild_state();

console.log('State index rebuilt');
```

---

### Step 5: Verify Migration

**Check event count:**

```bash
# Count events in log (exclude header)
grep -v "^#" ARTIFACTS/activity-log.txt | grep -v "^$" | wc -l

# Should match or exceed MongoDB entry count
```

**Check state structure:**

```bash
# View state index
head -50 ARTIFACTS/activity-state.yaml
```

**Verify critical entries:**

```bash
# Check current phase
grep "PHASE-" ARTIFACTS/activity-state.yaml | grep "status: IN_PROGRESS"

# Check features
grep -A 5 "^features:" ARTIFACTS/activity-state.yaml

# Check stories
grep -A 5 "^stories:" ARTIFACTS/activity-state.yaml
```

**Test queries:**

```javascript
// Query by status
const blocked = await mcp__activity-log__query({ status: "BLOCKED" });
console.log(`Blocked items: ${blocked.count}`);

// Query by robot
const ashokWork = await mcp__activity-log__query({ robot: "ashok" });
console.log(`Ashok's work: ${ashokWork.count} items`);

// Get history
const history = await mcp__activity-log__get_history({ id: "PHASE-2" });
console.log(`Phase 2 history: ${history.eventCount} events`);
```

**Get statistics:**

```javascript
const stats = await mcp__activity-log__get_statistics();
console.log(JSON.stringify(stats, null, 2));

// Verify:
// - totalEvents matches expected count
// - statistics look reasonable
// - No errors
```

---

### Step 6: Update Project Configuration

**Remove MongoDB reference from `.rome-project.json`:**

```json
{
  "projectName": "your_project",
  "createdAt": "2025-12-01T00:00:00Z",
  "romeVersion": "10",
  "currentPhase": "P02-analysis",
  "phaseStatus": { ... }
  // REMOVE THIS:
  // "activityLog": {
  //   "database": "rome_your_project"
  // }
}
```

**Commit migration:**

```bash
git add ARTIFACTS/activity-log.txt
git add ARTIFACTS/activity-state.yaml
git add .rome-project.json
git commit -m "Migrate to event log activity tracking (ROME-PROP-007)

- Exported ${EVENT_COUNT} events from MongoDB
- Generated state index
- Removed MongoDB dependency"

git tag post-event-log-migration
```

---

### Step 7: Decommission MongoDB (Optional)

**Keep MongoDB for 30 days** as safety backup, then:

```bash
# After 30 days, drop MongoDB database
mongo
> use rome_[your_project_name]
> db.dropDatabase()
> exit

# Remove old MCP server reference
claude mcp remove activity-log

# Archive MongoDB backup
mv mongodb_backup_*.tar.gz ~/Archives/rome_migrations/
```

---

## Rollback Procedure

**If migration fails or issues discovered within 30 days:**

### Immediate Rollback (<24 hours, no new data)

```bash
# 1. Restore MongoDB from backup
mongorestore --db rome_[project_name] ./mongodb_backup_[date]/rome_[project_name]

# 2. Revert .rome-project.json
git revert HEAD  # Reverts migration commit

# 3. Remove event log files
rm ARTIFACTS/activity-log.txt
rm ARTIFACTS/activity-state.yaml

# 4. Re-enable old MCP server
claude mcp add --transport stdio activity-log -- [old_server_command]

# 5. Verify MongoDB connection
mcp__activity-log__get_statistics()
```

### Gradual Rollback (>24 hours, new data in event log)

```bash
# 1. Export event log back to MongoDB
# Run via Claude Code:

const events = EventParser.parseLogFile('ARTIFACTS/activity-log.txt');

for (const event of events) {
  // Convert to MongoDB format
  const entry = {
    id: event.id,
    type: event.type.toLowerCase(),
    createdDate: event.timestamp,
    ...event.attributes
  };

  // Insert or update in MongoDB
  await mcp__activity-log__add_entry({ entry });
}

# 2. Verify MongoDB has all data
mcp__activity-log__get_statistics()

# 3. Follow immediate rollback steps 2-5
```

---

## Troubleshooting

### Issue: Event count mismatch

**Symptom:** MongoDB has 150 entries, but event log only has 142

**Cause:** Some MongoDB entries may not have timestamps

**Solution:**
```javascript
// Find entries without timestamps
const entries = await mcp__activity-log__list_all_entries();
const noTimestamp = entries.filter(e =>
  !e.createdDate && !e.startDate && !e.completionDate
);

console.log(`Entries without timestamp: ${noTimestamp.length}`);

// Use current time for these entries
for (const entry of noTimestamp) {
  // Add event with current timestamp
  const timestamp = new Date().toISOString();
  // ... append to log
}
```

### Issue: State index corrupted

**Symptom:** `activity-state.yaml` has malformed YAML

**Solution:**
```bash
# Regenerate from event log
rm ARTIFACTS/activity-state.yaml
mcp__activity-log__rebuild_state()
```

### Issue: Duplicate events in log

**Symptom:** Same event appears multiple times

**Impact:** None - latest event wins during state rebuild

**Solution:** Leave as-is (append-only rule) or manually comment duplicates:
```bash
# Edit activity-log.txt
#DUPLICATE: 2025-12-03T10:00:00Z | STORY | STORY-001 | ...
```

### Issue: Query returns empty results

**Symptom:** `query({ status: "BLOCKED" })` returns empty but items exist

**Cause:** State index out of sync

**Solution:**
```javascript
// Rebuild state index
await mcp__activity-log__rebuild_state();

// Retry query
const blocked = await mcp__activity-log__query({ status: "BLOCKED" });
```

### Issue: MCP server not found

**Symptom:** `mcp__activity-log__*` tools not available

**Solution:**
```bash
# Check MCP configuration
cat ~/.config/claude-code/mcp-config.json

# Re-add server
claude mcp add --transport stdio activity-log-file -- dart run /path/to/server.dart

# Restart Claude Code
```

---

## Post-Migration Checklist

After successful migration:

- [ ] Event log file exists: `ARTIFACTS/activity-log.txt`
- [ ] State index exists: `ARTIFACTS/activity-state.yaml`
- [ ] Event count matches or exceeds MongoDB count
- [ ] All query types work (status, robot, phase, id)
- [ ] Statistics look correct
- [ ] Current phase status preserved
- [ ] All in-progress work visible
- [ ] No blocker information lost
- [ ] `.rome-project.json` updated (MongoDB reference removed)
- [ ] Migration committed to git
- [ ] MongoDB kept as backup (30 day retention)
- [ ] Team notified of migration

---

## Benefits Realized

After migration, you should see:

**Performance:**
- ✅ Faster append operations (<10ms vs 50-200ms)
- ✅ Faster queries (5-20ms vs 20-100ms)
- ✅ No database connection overhead

**Reliability:**
- ✅ Complete git-tracked audit trail
- ✅ Human-readable activity log
- ✅ Easy corruption recovery (rebuild state)
- ✅ No database dependency

**Operations:**
- ✅ Simpler backup (git commit)
- ✅ Portable projects (copy directory)
- ✅ Grep-friendly debugging
- ✅ No database maintenance

---

## Support

**Issues during migration?**

1. Check this troubleshooting section
2. Verify MCP server installation
3. Review event log file manually
4. Rebuild state index
5. Use rollback procedure if needed

**Questions:**
- Framework issues: See ROME documentation
- MCP server bugs: Check MCP server README
- Migration-specific: This guide

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2025-12-18T00:00:00Z | Initial migration guide for ROME-PROP-007 |
