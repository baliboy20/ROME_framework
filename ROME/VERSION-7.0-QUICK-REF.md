# ROME v7.0 - Quick Reference Card

**Version**: 7.0
**Release Date**: 2025-11-12
**Status**: Production Ready

---

## 🎯 What's New in v7.0?

**MCP Native Integration** - MongoDB-backed activity tracking replaces JSON files

---

## ⚡ Quick Stats

| Metric | Improvement |
|--------|-------------|
| Query speed | **10x faster** |
| Scalability | **20x scale** (10,000+ entries) |
| Race conditions | **Zero** (ACID transactions) |
| Setup time | **3 minutes** |

---

## 🚀 New Project Setup

```bash
# 1. Start MongoDB
brew services start mongodb-community

# 2. Launch Project Setup
cd ROME/00-start
claude

# 3. Follow prompts
# MCP configured automatically!
```

---

## 📊 MCP Functions (Quick List)

### Most Used
```javascript
// Get my work
await mcp__activity-log__find_by_robot('ashok')

// Update status
await mcp__activity-log__update_entry(id, {status: 'COMPLETED'})

// Project dashboard
await mcp__activity-log__get_statistics()

// Create blocker
await mcp__activity-log__add_entry({type: 'blocker', ...})
```

### Query Functions
```javascript
mcp__activity-log__find_by_id(id)
mcp__activity-log__find_by_robot(robot)
mcp__activity-log__find_by_feature(featureId)
mcp__activity-log__find_by_status(status)
mcp__activity-log__find_by_phase(phase)
mcp__activity-log__find_by_layer(layer)
mcp__activity-log__list_all_entries(filters)
```

### Management Functions
```javascript
mcp__activity-log__add_entry(entry)
mcp__activity-log__update_entry(id, updates)
mcp__activity-log__delete_entry(id)
mcp__activity-log__validate_entry(entry)
```

### Database Functions
```javascript
mcp__activity-log__initialize_database(name)
mcp__activity-log__drop_database()
mcp__activity-log__list_available_databases()
```

### Metadata Functions
```javascript
mcp__activity-log__get_statistics()
mcp__activity-log__list_entry_types()
mcp__activity-log__get_entry_instructions(type)
```

---

## 🤖 Robot Usage Patterns

### Ashok (Database)
```javascript
const myWork = await mcp__activity-log__find_by_robot('ashok')
await mcp__activity-log__update_entry('FEAT-001-db', {status: 'COMPLETED'})
```

### Reena (Backend)
```javascript
const myWork = await mcp__activity-log__find_by_robot('reena')
const dependencies = await mcp__activity-log__find_by_feature('FEAT-001')
```

### Charlie (Frontend)
```javascript
const myWork = await mcp__activity-log__find_by_robot('charlie')
const apiReady = await mcp__activity-log__find_by_id('FEAT-001-api')
```

### Roma (Coordinator)
```javascript
const stats = await mcp__activity-log__get_statistics()
const blockers = await mcp__activity-log__list_all_entries({type: 'blocker'})
```

---

## 📁 New Files in v7.0

### Scripts
- `ROME/scripts/init-mcp-project.sh` - Initialize new project
- `ROME/scripts/migrate-to-mcp-full.sh` - Migrate existing project

### Documentation
- `MCP-MIGRATION-START-HERE.md` - Main entry point
- `EXECUTE-MCP-MIGRATION.md` - Quick guide
- `ROME/MCP-QUICK-START.md` - Daily reference
- `ROME/CHANGELOG.md` - Version history
- `ROME/VERSION-7.0-SUMMARY.md` - Release summary

### Examples
- `ROME/templates/mcp-examples/ashok-mcp-examples.md`
- `ROME/templates/mcp-examples/reena-mcp-examples.md`
- `ROME/templates/mcp-examples/charlie-mcp-examples.md`
- `ROME/templates/mcp-examples/roma-mcp-examples.md`

---

## 🔧 Prerequisites

- **MongoDB v4.0+** (running)
- **Node.js v14+** (installed)
- **Claude Code** (with MCP support)

---

## ⚠️ Quick Troubleshooting

### MongoDB not running
```bash
brew services start mongodb-community
pgrep -x mongod  # Verify
```

### MCP functions not available
```bash
# 1. Restart Claude session
# 2. Check MongoDB: pgrep -x mongod
# 3. Check database: mongo → use rome_${PROJECT_NAME} → db.activity_entries.count()
```

---

## 📚 Learn More

- **Quick Start**: `ROME/MCP-QUICK-START.md`
- **Complete Guide**: `ROME/MCP-MIGRATION-README.md`
- **Deep Analysis**: `ROME/99-reference/migration-guide-activity-log-to-mcp.md`
- **Robot Examples**: `ROME/templates/mcp-examples/`

---

## ✅ Benefits Summary

| Feature | v6.0 | v7.0 |
|---------|------|------|
| Query time | 100ms | 10ms |
| Race conditions | Yes | No |
| Max entries | 500 | 10,000+ |
| Data validation | Manual | Automatic |
| Concurrency | Unsafe | ACID safe |

---

## 🎯 Migration Path

### New Projects
✅ **MCP is default** - No action needed

### Existing Projects
```bash
./ROME/scripts/migrate-to-mcp-full.sh
# ~3 minutes, automatic backups
```

---

## 🔄 What Changed

### Changed
- ✅ Activity tracking: JSON → MongoDB
- ✅ Queries: File parsing → Indexed lookups
- ✅ Concurrency: Race conditions → ACID safe

### Unchanged
- ✅ ROME methodology (8 robots, 4 phases)
- ✅ Robot responsibilities
- ✅ Workflow patterns
- ✅ Document formats

---

**ROME v7.0 - Zero Race Conditions, 10x Faster, Production Ready** 🚀
