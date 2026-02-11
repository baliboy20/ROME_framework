# ROME Tools - Quick Start Guide

Quick reference for using the Node.js tooling after restructuring.

## Setup (One Time)

```bash
cd /Users/will/flutterProjects/Exercises/Jan/ROME_AORDL_V3/ROME_tools
npm install
```

**Result:** Dependencies installed in `node_modules/` (644K)

## Running P5 Hybrid Mode (Roma Command Center)

### Method 1: Direct Execution
```bash
cd /Users/will/flutterProjects/Exercises/Jan/ROME_AORDL_V3/ROME_tools
node orchestrators/p5-hybrid/index.js
```

### Method 2: NPM Script (Recommended)
```bash
cd /Users/will/flutterProjects/Exercises/Jan/ROME_AORDL_V3/ROME_tools
npm run p5-hybrid
```

## Testing

### Run Simple Dashboard Test
```bash
cd /Users/will/flutterProjects/Exercises/Jan/ROME_AORDL_V3/ROME_tools
npm test
```

**Expected:** Dashboard renders with mock agents (MCP errors are normal outside Claude Code)

### Verify All Imports Work
```bash
cd /Users/will/flutterProjects/Exercises/Jan/ROME_AORDL_V3/ROME_tools
node -e "
  require('./lib/ActivityLogCoordinator');
  require('./orchestrators/p5-hybrid/MonitoringDashboard');
  require('./orchestrators/p5-hybrid/CommandHandlers');
  require('./orchestrators/p5-hybrid/AlertSystem');
  console.log('✅ All imports successful');
"
```

## Directory Structure Quick Reference

```
ROME_tools/
├── lib/                          # Import with: require('../../lib/...')
│   ├── ActivityLogCoordinator.js # Cross-session coordination
│   ├── SkillInvoker.js          # Skill execution
│   └── SkillRegistry.js         # Skill registry
│
├── orchestrators/p5-hybrid/      # Roma Command Center
│   ├── index.js                 # Entry point: npm run p5-hybrid
│   ├── MonitoringDashboard.js   # Live monitoring interface
│   ├── CommandHandlers.js       # Interactive commands
│   └── AlertSystem.js           # Failure detection
│
└── tests/                        # Run with: npm test
    └── test-dashboard-simple.js
```

## Path Resolution from Code

If you're adding new code to ROME_tools:

### From orchestrators/p5-hybrid/ files:
```javascript
// Access shared libraries
const ActivityLogCoordinator = require('../../lib/ActivityLogCoordinator');

// Access ROME framework
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const ROME_PATH = path.join(PROJECT_ROOT, 'ROME');
const ARTIFACTS = path.join(PROJECT_ROOT, 'ARTIFACTS');
```

### From lib/ files:
```javascript
// Access ROME framework
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const ROME_PATH = path.join(PROJECT_ROOT, 'ROME');
```

### From tests/ files:
```javascript
// Access orchestrators
const Dashboard = require('../orchestrators/p5-hybrid/MonitoringDashboard');

// Access shared libraries
const Coordinator = require('../lib/ActivityLogCoordinator');
```

## Common Commands

### Install/Update Dependencies
```bash
cd ROME_tools
npm install
```

### Run Tests
```bash
cd ROME_tools
npm test
```

### Run P5 Hybrid Mode
```bash
cd ROME_tools
npm run p5-hybrid
```

### Check Which Scripts Are Available
```bash
cd ROME_tools
npm run
```

### Verify Structure
```bash
cd ROME_tools
ls -la lib/
ls -la orchestrators/
ls -la tests/
```

## What Changed?

### Old Way (Before Restructuring)
```bash
cd ROME/rome-p5-generation
node commands/rome-p5-parallel-generate-hybrid.js
```

### New Way (After Restructuring)
```bash
cd ROME_tools
npm run p5-hybrid
```

## Why This Is Better

✅ **No Node.js pollution in ROME framework**
- ROME/ contains only framework definitions (markdown, modes, skills)
- Node.js implementation isolated in ROME_tools/

✅ **Single dependency tree**
- One npm install
- One node_modules (644K total)
- Clear dependency management

✅ **Better organization**
- Shared libraries in lib/
- Orchestrators grouped by purpose
- Clear entry points

✅ **Framework independence**
- ROME framework can be executed by any implementation
- Node.js tooling is replaceable
- Clear API boundary

## Troubleshooting

### "Cannot find module" errors
**Problem:** Import paths not updated correctly
**Solution:** Use relative paths from new location
```javascript
// Wrong (old path)
require('../../rome-core/lib/ActivityLogCoordinator')

// Correct (new path)
require('../../lib/ActivityLogCoordinator')
```

### "npm: command not found"
**Problem:** Node.js not installed
**Solution:** Install Node.js v18+ from nodejs.org

### "No such file or directory: ROME_tools"
**Problem:** Wrong directory
**Solution:** Ensure you're in project root
```bash
cd /Users/will/flutterProjects/Exercises/Jan/ROME_AORDL_V3
ls ROME_tools/  # Should list package.json, lib/, orchestrators/, tests/
```

### MCP function errors in tests
**Expected behavior:** MCP functions only available in Claude Code
**Not an error:** Tests validate architecture even without MCP

## Next Steps

1. ✅ **Setup complete** - You've restructured successfully
2. 📚 **Read documentation:**
   - ROME_tools/README.md - Full documentation
   - ROME_tools/RESTRUCTURING.md - Migration details
3. 🧪 **Run tests:** `npm test`
4. 🚀 **Use in Claude Code:** Run `npm run p5-hybrid` from Claude Code session

---

**Questions?** See:
- ROME_tools/README.md - Complete documentation
- ROME_tools/RESTRUCTURING.md - What changed and why
- USER-GUIDE.md - Updated workflow documentation
