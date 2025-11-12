# Bug Fix: .mcp.json Not Copied to Robot Directories

**Issue Date**: 2025-11-12
**Status**: ✅ Fixed
**Affected Files**:
- `ROME/scripts/create-robot.sh`
- `ROME/00-start/CLAUDE.md`

---

## 🐛 Problem Description

**User Report:**
> "the .mcp.json files are still not being copied into the robot folders"

### What Was Happening

When `create-robot.sh` created robot workspaces, it was NOT copying the `.mcp.json` MCP server configuration file to the robot's `.claude/` directory. This meant:

- Robots couldn't access MCP functions when starting Claude sessions
- Each robot would need manual `.mcp.json` configuration
- MCP integration wasn't truly "automatic" as documented

### Expected Behavior

Each robot's `.claude/` directory should have:
```
robot_[name]/.claude/
├── CLAUDE.md → symlink to template
├── .mcp.json → MCP server configuration
└── .gitkeep
```

### Actual Behavior (Bug)

Each robot's `.claude/` directory only had:
```
robot_[name]/.claude/
├── CLAUDE.md → symlink to template
└── .gitkeep
```

**Missing**: `.mcp.json` file

---

## 🔍 Root Cause Analysis

### The Bug

The `create-robot.sh` script:
1. Created `.claude/` directory ✅
2. Symlinked `CLAUDE.md` from templates ✅
3. **Did NOT copy `.mcp.json`** ❌

### Why This Happened

1. No template `.mcp.json` existed in `ROME/templates/`
2. `create-robot.sh` had no code to copy MCP configuration
3. Documentation claimed "automatic MCP" but configuration was missing

---

## ✅ Solution Implemented

### 1. Created Template MCP Configuration

**File**: `ROME/templates/.mcp.json`

```json
{
  "mcpServers": {
      "activity-log": {
        "command": "dart",
        "args": [
          "run",
          "/Users/will/flutterProjects/Apps/Local/mcps/rome/version7/activity_log_mcp/bin/server_with_web.dart"
        ],
        "disabled": false
      }
  }
}
```

**Purpose**: Single source of truth for MCP server configuration

### 2. Updated create-robot.sh

**Added** (after line 67):

```bash
# Copy .mcp.json for MCP server configuration
MCP_TEMPLATE="${ROME_ROOT}/templates/.mcp.json"
if [ -f "$MCP_TEMPLATE" ]; then
    cp "$MCP_TEMPLATE" ${ROBOT_DIR}/.claude/.mcp.json
    echo -e "  ${GREEN}✓${NC} Copied .mcp.json for MCP server access"
else
    echo -e "  ${YELLOW}⚠${NC}  No .mcp.json template found: ${MCP_TEMPLATE}"
    echo "     MCP functions may not be available in this robot"
fi
```

**Result**: Every robot now gets `.mcp.json` copied automatically

### 3. Updated .gitignore Pattern

**Modified** (line 121):

```bash
# Keep template structure in git
!notes/.gitkeep
!.claude/.gitkeep
!.claude/.mcp.json  # <- ADDED
```

**Purpose**: Ensure `.mcp.json` is committed to git (not ignored)

### 4. Updated Documentation

**File**: `ROME/00-start/CLAUDE.md`

**Updated robot structure display** to show:
```
robot_[name]/
├── .claude/
│   ├── CLAUDE.md → (MCP functions included automatically)
│   ├── .mcp.json → (MCP server configuration)  # <- ADDED
│   └── .gitkeep
```

**Updated description**: "MCP server configuration (`.mcp.json`) is copied to each robot's `.claude/` directory"

---

## 🧪 Verification

### Test Case: Create New Robot

```bash
cd ROME
./scripts/create-robot.sh test_robot
```

**Expected Output**:
```
Creating robot directory: /path/to/robot_test_robot

  ✓ Linked CLAUDE.md template
  ✓ Copied .mcp.json for MCP server access  # <- NEW
  ✓ Created notes directory with templates
  ✓ Created .gitignore
  ✓ Created .gitkeep files

✅ Robot created!
```

**File Check**:
```bash
ls -la robot_test_robot/.claude/
# Should show:
# .gitkeep
# .mcp.json  # <- NEW
# CLAUDE.md (symlink)
```

**Content Check**:
```bash
cat robot_test_robot/.claude/.mcp.json
# Should show MCP server configuration
```

### Test Result: ✅ PASSED

Test robot created successfully with `.mcp.json` present and correctly configured.

---

## 📊 Impact

### Before Fix
- ❌ `.mcp.json` not copied to robot directories
- ❌ Robots couldn't access MCP functions automatically
- ❌ Manual configuration required for each robot
- ❌ Documentation was misleading ("automatic MCP")

### After Fix
- ✅ `.mcp.json` copied automatically to every robot
- ✅ Robots have immediate MCP server access
- ✅ Zero manual configuration required
- ✅ Documentation matches implementation
- ✅ Truly "automatic MCP integration"

---

## 📁 Files Modified

### Created Files (1)
- `ROME/templates/.mcp.json` - Template MCP server configuration

### Modified Files (2)
- `ROME/scripts/create-robot.sh` - Added MCP config copy logic
- `ROME/00-start/CLAUDE.md` - Updated documentation

### Lines Changed
- `create-robot.sh`: +9 lines (MCP copy block)
- `create-robot.sh`: +1 line (gitignore pattern)
- `CLAUDE.md`: +2 lines (documentation)
- **Total**: +12 lines

---

## 🔄 Backward Compatibility

### Existing Robots

**Problem**: Robots created BEFORE this fix don't have `.mcp.json`

**Solution**: Run update script or manually copy:

```bash
# Option 1: Update single robot
cp ROME/templates/.mcp.json robot_[name]/.claude/.mcp.json

# Option 2: Update all existing robots
for robot in robot_*/; do
    cp ROME/templates/.mcp.json "$robot/.claude/.mcp.json"
    echo "✓ Updated $robot"
done
```

### New Robots

**All new robots created after this fix automatically get `.mcp.json`** ✅

---

## 🎯 Configuration Management

### Centralized Configuration

**Template**: `ROME/templates/.mcp.json`

**Benefits**:
- Single source of truth
- Easy to update MCP server path
- Consistent configuration across all robots

**To update MCP server path**:
1. Edit `ROME/templates/.mcp.json`
2. Re-run `create-robot.sh` for new robots
3. For existing robots, copy updated file manually

### Future Enhancement

**Consider**: Symlink instead of copy?

**Pros**:
- Single file to update (changes propagate automatically)
- No need to update existing robots

**Cons**:
- Relative symlink paths more complex
- Less flexibility for robot-specific MCP configs

**Decision**: Copy is simpler and more reliable for v7.0

---

## ✅ Status: Fixed

**Bug**: `.mcp.json` not copied to robot directories
**Root Cause**: No template + no copy logic in script
**Solution**:
- Created template file
- Added copy logic to script
- Updated documentation
- Updated gitignore

**Status**: ✅ Fixed and tested
**Date**: 2025-11-12

---

## 🚀 Next Steps

### For Users
1. **New projects**: Use updated scripts - automatic
2. **Existing robots**: Run update command to copy `.mcp.json`

### For Future
- Consider adding MCP server health check to `create-robot.sh`
- Consider adding validation that MCP functions work after robot creation
- Consider project-specific MCP configurations (multiple projects, different databases)

---

**ROME v7.0 - MCP Configuration Copy Fixed** ✅
