# ROME v7.0 MCP Migration - Complete Guide

**ROME Version**: 7.0
**Guide Version**: 1.0
**Date**: 2025-11-12
**Status**: Production Ready - MCP is now the default for all new ROME projects

---

## 🎯 What This Is

Complete migration from JSON file-based activity log to MCP (Model Context Protocol) server with MongoDB.

**Migration Mode**: **ONE-GO** - Complete migration in single execution, MCP-only mode after completion.

---

## 📋 Prerequisites

### Required

- ✅ **MongoDB** installed and running
  ```bash
  # macOS
  brew install mongodb-community
  brew services start mongodb-community

  # Linux
  sudo apt-get install mongodb
  sudo systemctl start mongodb
  ```

- ✅ **Node.js** installed (for migration scripts)
  ```bash
  node --version  # Should be v14+
  ```

### Recommended

- ✅ Backup of current project (automatic during migration)
- ✅ All robots idle (no active Claude sessions)
- ✅ Git committed (clean working directory)

---

## 🚀 Migration Process

### Step 1: Run Migration Script

```bash
cd /path/to/romev2

# Run one-go migration
./ROME/scripts/migrate-to-mcp-full.sh [database_name]

# Example:
./ROME/scripts/migrate-to-mcp-full.sh rome_activity_log
```

**What This Does:**

1. ✓ Checks MongoDB is running
2. ✓ Backs up existing JSON files
3. ✓ Initializes MongoDB database
4. ✓ Migrates data from JSON to MongoDB
5. ✓ Updates all robot templates with MCP functions
6. ✓ Creates configuration files
7. ✓ Generates documentation

**Duration**: 2-5 minutes

---

### Step 2: Verify Migration

```bash
# Check MongoDB has data
mongo
> use rome_activity_log
> db.activity_entries.count()
> db.activity_entries.find().pretty()
> exit

# Check templates updated
cat ROME/templates/claude-md/_base-template.md | grep "mcp__activity-log"

# Check config created
cat ROME/.mcp-config.json
```

---

### Step 3: Test MCP Functions

```bash
# Start a robot session
cd robot_roma
claude

# In Claude session, try:
await mcp__activity-log__get_statistics()
await mcp__activity-log__list_entry_types()
await mcp__activity-log__find_by_id('PHASE-1')
```

---

## 📚 MCP Usage Guide

### For Developers (Ashok/Reena/Charlie)

**Find your work:**
```javascript
const myWork = await mcp__activity-log__find_by_robot('ashok')
```

**Update status:**
```javascript
await mcp__activity-log__update_entry('FEAT-001-db', {
  status: 'IN_PROGRESS',
  startDate: new Date().toISOString()
})
```

**Complete feature:**
```javascript
await mcp__activity-log__update_entry('FEAT-001-db', {
  status: 'COMPLETED',
  completionDate: new Date().toISOString(),
  testLevel: 'Integration'
})
```

**Create blocker:**
```javascript
await mcp__activity-log__add_entry({
  type: 'blocker',
  severity: 'HIGH',
  description: 'Need API design from PMA',
  robot: 'reena',
  status: 'OPEN',
  createdDate: new Date().toISOString()
})
```

### For Roma (Coordinator)

**Dashboard:**
```javascript
const stats = await mcp__activity-log__get_statistics()
```

**Find blockers:**
```javascript
const blockers = await mcp__activity-log__list_all_entries({
  type: 'blocker',
  status: 'OPEN'
})
```

**Check feature:**
```javascript
const feat = await mcp__activity-log__find_by_feature('FEAT-001')
```

**See robot status:**
```javascript
const work = await mcp__activity-log__find_by_robot('ashok')
```

---

## 📖 Complete Function Reference

| Function | Purpose | Example |
|----------|---------|---------|
| `find_by_robot(robot)` | Get all entries for robot | `find_by_robot('ashok')` |
| `find_by_feature(id)` | Get all entries for feature | `find_by_feature('FEAT-001')` |
| `find_by_status(status)` | Get entries by status | `find_by_status('BLOCKED')` |
| `find_by_phase(phase)` | Get entries by phase | `find_by_phase('3')` |
| `find_by_layer(layer)` | Get entries by layer | `find_by_layer('database')` |
| `find_by_id(id)` | Get single entry | `find_by_id('FEAT-001-db')` |
| `add_entry(entry)` | Create new entry | `add_entry({type: 'feature', ...})` |
| `update_entry(id, updates)` | Update entry | `update_entry('FEAT-001-db', {...})` |
| `delete_entry(id)` | Delete entry | `delete_entry('BLOCK-001')` |
| `get_statistics()` | Project stats | `get_statistics()` |
| `list_all_entries(filters)` | List with filters | `list_all_entries({robot: 'ashok'})` |
| `validate_entry(entry)` | Validate before adding | `validate_entry({type: 'feature', ...})` |

---

## 🎓 Robot-Specific Examples

### Ashok (Database)
- **Examples**: `ROME/templates/mcp-examples/ashok-mcp-examples.md`
- **Focus**: Find DB work, update status, create blockers

### Reena (Backend)
- **Examples**: `ROME/templates/mcp-examples/reena-mcp-examples.md`
- **Focus**: Check DB dependencies, update API status

### Charlie (Frontend)
- **Examples**: `ROME/templates/mcp-examples/charlie-mcp-examples.md`
- **Focus**: Check API dependencies, request design validation

### Roma (Coordinator)
- **Examples**: `ROME/templates/mcp-examples/roma-mcp-examples.md`
- **Focus**: Dashboard, blockers, phase status, coordination

---

## 🆕 For New Projects

### Initialize New ROME Project with MCP

```bash
./ROME/scripts/init-mcp-project.sh MyProjectName

# This creates:
# - MongoDB database: rome_MyProjectName
# - Initial phase entries (PHASE-1 through PHASE-3)
# - MCP configuration
# - All ready for robot creation
```

Then create robots as usual:
```bash
./ROME/scripts/create-robot.sh talib
./ROME/scripts/create-robot.sh pma
./ROME/scripts/create-robot.sh roma
# etc.
```

---

## 🔄 Migration Benefits

### Before (JSON File)

❌ Race conditions (robots overwrite each other)
❌ Slow queries (read entire file every time)
❌ No indexes (O(n) searches)
❌ Manual file editing
❌ No data validation

### After (MCP Server)

✅ Zero race conditions (ACID transactions)
✅ 10-100x faster queries (indexed)
✅ Instant lookups (O(log n))
✅ Functions in Claude (no file edits)
✅ Schema validation enforced
✅ Scalable to 10,000+ entries

---

## 🛠️ Troubleshooting

### MongoDB Not Running

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Check status
pgrep -x mongod
```

### Migration Script Fails

1. Check MongoDB is running
2. Check Node.js installed
3. Check file permissions
4. See backup in `ROME/.backups/`

### MCP Functions Not Available

1. Verify migration completed
2. Check templates updated: `cat ROME/templates/claude-md/_base-template.md | grep mcp`
3. Restart Claude session
4. Check MongoDB connection

### Need to Rollback

```bash
# Find backup directory
ls -la ROME/.backups/

# Restore templates
cp ROME/.backups/[timestamp]/*.md ROME/templates/claude-md/

# Restore JSON file (if needed)
cp ROME/.backups/[timestamp]/project-activity-status.backup.json Project/dev/
```

---

## 📊 Migration Checklist

**Pre-Migration:**
- [ ] MongoDB installed and running
- [ ] Node.js installed
- [ ] Git working directory clean
- [ ] All robot sessions closed

**Run Migration:**
- [ ] Execute: `./ROME/scripts/migrate-to-mcp-full.sh`
- [ ] Migration completes successfully
- [ ] Backup created in `.backups/`

**Verify:**
- [ ] MongoDB has entries: `mongo` → `db.activity_entries.count()`
- [ ] Templates updated: `grep mcp ROME/templates/claude-md/_base-template.md`
- [ ] Config created: `cat ROME/.mcp-config.json`

**Test:**
- [ ] Start robot session
- [ ] Try: `await mcp__activity-log__get_statistics()`
- [ ] Functions work correctly

**Complete:**
- [ ] Read `MCP-QUICK-START.md`
- [ ] Share with team
- [ ] Update project docs

---

## 📞 Support

**Documentation:**
- Full migration guide: `ROME/99-reference/migration-guide-activity-log-to-mcp.md`
- Quick start: `ROME/MCP-QUICK-START.md`
- Robot examples: `ROME/templates/mcp-examples/`

**Issues:**
- Check troubleshooting section above
- Review MongoDB logs
- Check migration script output

---

## 🎉 Success!

After migration:

✅ **All robots use MCP functions**
✅ **No more JSON file editing**
✅ **Faster, safer, more scalable**
✅ **Ready for production**

**Next Steps:**
1. Read `MCP-QUICK-START.md`
2. Review robot-specific examples
3. Start using MCP functions in robot sessions
4. Share with team

---

**Version History:**
- v1.0 (2025-11-11): Initial one-go migration guide
