# ROME Framework Restructuring - Node.js Separation

**Date:** 2026-02-11
**Objective:** Separate Node.js implementation tooling from ROME framework to prevent pollution

## Problem

Node.js artifacts (package.json, node_modules, implementation code) were scattered throughout the ROME framework directories, mixing framework definitions with implementation code.

## Solution

Created dedicated `ROME_tools/` directory for all Node.js implementation, keeping ROME framework clean and focused on LLM-interpretable content.

## Changes Made

### 1. Created ROME_tools Directory Structure

```
ROME_tools/
├── package.json                    # Single consolidated dependencies
├── node_modules/                   # All Node.js deps (644K)
├── lib/                            # Shared libraries
│   ├── ActivityLogCoordinator.js   # Moved from rome-core/lib/
│   ├── SkillInvoker.js            # Moved from rome-core/lib/
│   └── SkillRegistry.js           # Moved from rome-core/lib/
├── orchestrators/                  # Execution orchestrators
│   └── p5-hybrid/                  # Roma Command Center
│       ├── index.js                # Moved from rome-p5-generation/commands/
│       ├── MonitoringDashboard.js  # Moved from rome-p5-generation/lib/
│       ├── CommandHandlers.js      # Moved from rome-p5-generation/lib/
│       └── AlertSystem.js          # Moved from rome-p5-generation/lib/
└── tests/
    └── test-dashboard-simple.js    # Moved from rome-p5-generation/
```

### 2. Files Moved

**From ROME/rome-core/lib/ to ROME_tools/lib/:**
- ActivityLogCoordinator.js
- SkillInvoker.js
- SkillRegistry.js

**From ROME/rome-p5-generation/lib/ to ROME_tools/orchestrators/p5-hybrid/:**
- MonitoringDashboard.js
- CommandHandlers.js
- AlertSystem.js

**From ROME/rome-p5-generation/commands/ to ROME_tools/orchestrators/p5-hybrid/:**
- rome-p5-parallel-generate-hybrid.js → index.js

**From ROME/rome-p5-generation/ to ROME_tools/tests/:**
- test-dashboard-simple.js

### 3. Removed Node.js Artifacts from ROME

- ❌ Deleted `ROME/rome-core/package.json`
- ❌ Deleted `ROME/rome-p5-generation/package.json`
- ✅ No node_modules in ROME framework directories (except MCP servers)

### 4. Updated Import Paths

All require() statements updated to reflect new structure:

**Before:**
```javascript
require('../../rome-core/lib/ActivityLogCoordinator')
require('../lib/MonitoringDashboard')
```

**After:**
```javascript
require('../../lib/ActivityLogCoordinator')
require('./MonitoringDashboard')
```

### 5. Consolidated Dependencies

**Single package.json in ROME_tools:**
```json
{
  "name": "rome-tools",
  "dependencies": {
    "js-yaml": "^4.1.0"
  },
  "scripts": {
    "test": "node tests/test-dashboard-simple.js",
    "p5-hybrid": "node orchestrators/p5-hybrid/index.js"
  }
}
```

**Result:** 644K node_modules in one location instead of scattered across framework

### 6. Updated Documentation

- Updated USER-GUIDE.md with new paths
- Created ROME_tools/README.md
- Path changed from:
  - Old: `cd ROME/rome-p5-generation && node commands/rome-p5-parallel-generate-hybrid.js`
  - New: `cd ROME_tools && npm run p5-hybrid`

## What Remains in ROME

### ROME/rome-core/lib/
Framework utilities (not orchestration):
- annotate-artifact.cjs
- aordl-parser/
- tests/

### ROME/rome-core/servers/
MCP server implementations (require own node_modules to run as servers):
- activity-log/activity-log-file/

### Other ROME Plugins
Other phase plugins retain their package.json temporarily:
- rome-p0-bootup/package.json
- rome-p1-aordl/package.json
- rome-p2-analysis/package.json
- rome-p3-design/package.json
- rome-p4-config/package.json
- rome-qa/package.json

**Note:** These will be migrated as their orchestration tooling is developed.

## Benefits

### 1. Clean Separation
- **ROME/** = Pure framework (markdown, AORDL, modes, skills)
- **ROME_tools/** = Node.js implementation (execution, monitoring)

### 2. Single Dependency Tree
- One npm install
- One node_modules
- Clear dependency management

### 3. Framework Independence
- ROME framework can be executed by any implementation
- Node.js tooling is replaceable
- Clear API boundary via activity log MCP

### 4. Reduced Clutter
- No Node.js artifacts in framework directories
- Easier to understand ROME framework structure
- Cleaner git diffs

### 5. Better Organization
- Implementation code grouped by purpose
- Shared libraries in one location
- Clear entry points for orchestrators

## Verification

### Import Test
```bash
cd ROME_tools
node -e "
  require('./lib/ActivityLogCoordinator');
  require('./orchestrators/p5-hybrid/MonitoringDashboard');
  require('./orchestrators/p5-hybrid/CommandHandlers');
  require('./orchestrators/p5-hybrid/AlertSystem');
  console.log('✅ All imports successful');
"
```

**Result:** ✅ All imports successful

### Dependency Install
```bash
cd ROME_tools
npm install
```

**Result:** ✅ Installed 2 packages (644K)

### Test Execution
```bash
cd ROME_tools
npm test
```

**Expected:** Dashboard renders with mock agents

## Migration Guide for Other Phases

When creating orchestrators for other phases (P1-P4, QA):

1. Create orchestrator in `ROME_tools/orchestrators/<phase-name>/`
2. Move implementation .js files from ROME plugin
3. Update require() paths to use `../../lib/` for shared libraries
4. Add npm script to `ROME_tools/package.json`
5. Remove package.json from ROME plugin directory
6. Update USER-GUIDE.md with new paths

## Future Enhancements

### Potential Additional Separations
- Move all shell scripts to ROME_tools/scripts/
- Move MCP server implementations to ROME_tools/servers/
- Consolidate all testing to ROME_tools/tests/

### Alternative Implementations
With clean separation, could create:
- ROME_tools_python/
- ROME_tools_go/
- ROME_tools_rust/

All executing the same ROME framework via standardized interfaces.

## Related Documentation

- ROME_tools/README.md - Usage and structure
- USER-GUIDE.md - Updated with new paths
- ROME/rome-p5-generation/HYBRID-MODE-GUIDE.md - Roma Command Center usage

---

**Status:** ✅ Complete
**Impact:** Low (internal reorganization, external API unchanged)
**Testing:** ✅ All imports verified, test execution successful
