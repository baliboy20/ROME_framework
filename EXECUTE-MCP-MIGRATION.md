# ⚡ ROME v7.0 - MCP Integration Guide

**ROME v7.0 introduces MCP (Model Context Protocol) as the default activity tracking system.**

This guide covers both:
- Setting up NEW projects with MCP (recommended - default in v7.0)
- Migrating existing JSON-based projects to MCP

---

## 🎯 Quick Start (3 Commands)

```bash
# 1. Ensure MongoDB is running
brew services start mongodb-community  # macOS
# OR
sudo systemctl start mongodb          # Linux

# 2. Run migration (one command does everything)
./ROME/scripts/migrate-to-mcp-full.sh rome_activity_log

# 3. Test it works
cd robot_roma && claude
# Then try: await mcp__activity-log__get_statistics()
```

**That's it!** Migration complete.

---

## 📦 What Gets Migrated

### Automatic Changes

✅ **MongoDB Database**
- Database created: `rome_activity_log`
- All JSON entries migrated to MongoDB
- Indexes created for performance

✅ **Robot Templates**
- All `ROME/templates/claude-md/*.md` updated
- MCP functions added
- CLI references removed

✅ **Backups Created**
- JSON files backed up to `ROME/.backups/pre-mcp-migration-[timestamp]/`
- Old templates backed up (`.pre-mcp-backup`)

✅ **Configuration**
- `.mcp-config.json` created
- Database connection details saved

✅ **Documentation**
- `MCP-QUICK-START.md` created
- Robot-specific examples in `ROME/templates/mcp-examples/`
- Migration guide updated

---

## 🚀 Migration Script Details

### What `migrate-to-mcp-full.sh` Does

**Phase 1: Pre-Migration Checks** (10 seconds)
- ✓ Verify MongoDB running
- ✓ Verify Node.js installed
- ✓ Find existing JSON activity log

**Phase 2: Backup** (10 seconds)
- ✓ Create timestamped backup directory
- ✓ Backup JSON file
- ✓ Backup robot notes

**Phase 3: Initialize MCP Database** (20 seconds)
- ✓ Create MongoDB database
- ✓ Create collection: `activity_entries`
- ✓ Create performance indexes

**Phase 4: Migrate Data** (30 seconds)
- ✓ Read JSON file
- ✓ Validate each entry
- ✓ Insert into MongoDB
- ✓ Report success/failures

**Phase 5: Update Templates** (20 seconds)
- ✓ Update `_base-template.md` with MCP instructions
- ✓ Update `roma.md` with MCP examples
- ✓ Add MCP quick reference

**Phase 6: Create Documentation** (10 seconds)
- ✓ Generate MCP config
- ✓ Create quick start guide
- ✓ Create robot examples

**Total Time: ~2-3 minutes**

---

## 📝 Pre-Migration Checklist

Before running migration:

- [ ] MongoDB installed
  ```bash
  # Check if installed
  which mongod

  # If not installed:
  # macOS: brew install mongodb-community
  # Linux: sudo apt-get install mongodb
  ```

- [ ] MongoDB running
  ```bash
  # Check if running
  pgrep -x mongod

  # If not running:
  # macOS: brew services start mongodb-community
  # Linux: sudo systemctl start mongodb
  ```

- [ ] Node.js installed
  ```bash
  # Check version (need v14+)
  node --version
  ```

- [ ] Git working directory clean
  ```bash
  git status
  # Should show clean or committed changes
  ```

- [ ] All robot sessions closed
  ```bash
  # Exit any active Claude sessions
  # Close all iTerm robot panes
  ```

---

## ⚙️ Migration Execution

### Standard Migration

```bash
cd /Users/will/flutterProjects/Exercises/oct/romev2

# Run with default database name
./ROME/scripts/migrate-to-mcp-full.sh

# Or specify custom database name
./ROME/scripts/migrate-to-mcp-full.sh my_custom_db_name
```

### Watch Progress

The script shows real-time progress:

```
[Phase 1/6] Pre-Migration Checks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Checking MongoDB... ✓
Checking Node.js... ✓
Found activity log: /path/to/project-activity-status.json

[Phase 2/6] Backup Existing Data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backing up activity log... ✓
Backing up robot notes... ✓

[Phase 3/6] Initialize MCP Database
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Initializing MCP database... ✓

[Phase 4/6] Migrate Data to MongoDB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ Migrated FEAT-001-db
  ✓ Migrated FEAT-001-api
  ✓ Migrated FEAT-001-ui
Migration Summary:
  Success: 15
  Skipped: 0
  Failed: 0

[Phase 5/6] Update Robot Templates
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Updating base template... ✓
Updating Roma template... ✓

[Phase 6/6] Create Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Creating MCP config... ✓
Creating quick start guide... ✓

╔════════════════════════════════════╗
║    Migration Complete! ✓           ║
╚════════════════════════════════════╝
```

---

## ✅ Post-Migration Verification

### 1. Check MongoDB

```bash
mongo
> use rome_activity_log
> db.activity_entries.count()
# Should show number of migrated entries

> db.activity_entries.find().limit(3).pretty()
# Should show entries

> exit
```

### 2. Check Templates

```bash
# Verify MCP functions added
cat ROME/templates/claude-md/_base-template.md | grep "mcp__activity-log"

# Should see lines like:
# await mcp__activity-log__find_by_robot('robot-name')
```

### 3. Check Backups

```bash
ls -la ROME/.backups/
# Should see: pre-mcp-migration-[timestamp]/

ls -la ROME/.backups/pre-mcp-migration-*/
# Should see backed up files
```

### 4. Test MCP Functions

```bash
# Start a robot
cd robot_roma
claude

# In Claude session:
await mcp__activity-log__get_statistics()
# Should return project statistics

await mcp__activity-log__list_entry_types()
# Should list: feature, story, blocker, amendment, phase

await mcp__activity-log__find_by_id('PHASE-1')
# Should return Phase 1 entry
```

---

## 🎓 Using MCP After Migration

### For All Robots

**Before (JSON file):**
```javascript
// Had to read file manually
const fs = require('fs')
const data = JSON.parse(fs.readFileSync('project-activity-status.json'))
const myWork = data.entries.filter(e => e.robot === 'ashok')
```

**After (MCP):**
```javascript
// Clean function call
const myWork = await mcp__activity-log__find_by_robot('ashok')
```

### Quick Reference by Robot

**Ashok/Reena/Charlie (Developers):**
- Find work: `mcp__activity-log__find_by_robot('ashok')`
- Update status: `mcp__activity-log__update_entry(id, {status: '...'})`
- Create blocker: `mcp__activity-log__add_entry({type: 'blocker', ...})`

**Roma (Coordinator):**
- Dashboard: `mcp__activity-log__get_statistics()`
- Find blockers: `mcp__activity-log__list_all_entries({type: 'blocker'})`
- Check feature: `mcp__activity-log__find_by_feature('FEAT-001')`

**Complete examples:** See `ROME/templates/mcp-examples/[robot]-mcp-examples.md`

---

## 🔄 Rollback (If Needed)

### If migration fails or you need to rollback:

```bash
# 1. Find backup directory
ls -la ROME/.backups/
# Note the timestamp: pre-mcp-migration-20251111-123456

# 2. Restore templates
cp ROME/.backups/pre-mcp-migration-*/ROME/templates/claude-md/*.md.pre-mcp-backup ROME/templates/claude-md/

# 3. Restore JSON file (if needed)
cp ROME/.backups/pre-mcp-migration-*/project-activity-status.backup.json Project/dev/project-activity-status.json

# 4. Drop MongoDB database
mongo
> use rome_activity_log
> db.dropDatabase()
> exit
```

---

## 📚 Documentation

**Read After Migration:**

1. **Quick Start**: `ROME/MCP-QUICK-START.md`
   - How to use MCP functions
   - Common patterns
   - Function reference

2. **Migration Details**: `ROME/MCP-MIGRATION-README.md`
   - Complete migration guide
   - Troubleshooting
   - Detailed examples

3. **Robot Examples**: `ROME/templates/mcp-examples/`
   - `ashok-mcp-examples.md` - Database robot
   - `reena-mcp-examples.md` - Backend robot
   - `charlie-mcp-examples.md` - Frontend robot
   - `roma-mcp-examples.md` - Coordinator robot

4. **Deep Analysis**: `ROME/99-reference/migration-guide-activity-log-to-mcp.md`
   - Complete pros/cons analysis
   - Architecture details
   - Advanced usage

---

## 🚨 Common Issues & Solutions

### Issue: "MongoDB not running"

**Solution:**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Verify
pgrep -x mongod  # Should return a process ID
```

### Issue: "node: command not found"

**Solution:**
```bash
# Install Node.js
# macOS: brew install node
# Linux: sudo apt-get install nodejs npm

# Verify
node --version
```

### Issue: "Migration script permission denied"

**Solution:**
```bash
chmod +x ./ROME/scripts/migrate-to-mcp-full.sh
./ROME/scripts/migrate-to-mcp-full.sh
```

### Issue: "MCP functions not available in Claude"

**Solution:**
1. Verify migration completed successfully
2. Restart Claude session
3. Check MongoDB is running: `pgrep -x mongod`
4. Check database exists: `mongo` → `show dbs` → should see `rome_activity_log`

---

## ✨ Success Criteria

Migration is successful when:

✅ Script completes all 6 phases without errors
✅ MongoDB shows correct entry count
✅ Templates include MCP functions
✅ Backup created in `.backups/`
✅ Config file created: `.mcp-config.json`
✅ Test MCP function works in Claude session

---

## 🎉 Ready to Migrate!

**Execute Now:**

```bash
./ROME/scripts/migrate-to-mcp-full.sh
```

**Time Required:** 2-3 minutes

**What Happens:**
- ✓ All data migrated safely
- ✓ Backups created automatically
- ✓ Robots updated to use MCP
- ✓ Documentation generated
- ✓ Ready to use immediately

**After Migration:**
- No more JSON file editing
- No more race conditions
- 10-100x faster queries
- Clean MCP function calls
- Scalable to 10,000+ entries

---

**Let's do this! 🚀**

```bash
./ROME/scripts/migrate-to-mcp-full.sh
```
