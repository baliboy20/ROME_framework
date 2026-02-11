# ROME Tools

Node.js implementation tooling for ROME Framework execution.

## Purpose

This directory contains all Node.js code for orchestrating and executing ROME workflows. The ROME framework itself (in `../ROME/`) contains only framework definitions, agent modes, and skills - keeping it clean and focused on LLM-interpretable content.

## Structure

```
ROME_tools/
├── package.json                 # Single consolidated dependencies
├── node_modules/                # All Node.js dependencies here
├── lib/                         # Shared libraries
│   ├── ActivityLogCoordinator.js
│   ├── SkillInvoker.js
│   └── SkillRegistry.js
├── orchestrators/               # Execution orchestrators
│   └── p5-hybrid/               # P5 Hybrid Mode (Roma Command Center)
│       ├── index.js             # Main orchestrator
│       ├── MonitoringDashboard.js
│       ├── CommandHandlers.js
│       └── AlertSystem.js
└── tests/                       # Test files
    └── test-dashboard-simple.js
```

## Installation

```bash
cd /Users/will/flutterProjects/Exercises/Jan/ROME_AORDL_V3/ROME_tools
npm install
```

## Usage

### P5 Hybrid Mode (Roma Command Center)

Launch the hybrid parallel generation orchestrator:

```bash
cd /Users/will/flutterProjects/Exercises/Jan/ROME_AORDL_V3/ROME_tools
node orchestrators/p5-hybrid/index.js
```

Or via npm script:

```bash
npm run p5-hybrid
```

This will:
- Spawn Ashok, Reena, and Charlie as background agents
- Launch live monitoring dashboard
- Provide interactive commands (/details, /tail, /force-continue, etc.)

### Testing

Run the simple dashboard test:

```bash
npm test
```

Or directly:

```bash
node tests/test-dashboard-simple.js
```

## Available Orchestrators

### P5 Hybrid Mode (Roma Command Center)
- **Path:** `orchestrators/p5-hybrid/`
- **Entry:** `index.js`
- **Purpose:** Parallel code generation for Database, API, and UI layers
- **Architecture:** 1 monitoring terminal + 3 background agents
- **Coordination:** Activity log MCP (file-based message bus)

## Library Components

### ActivityLogCoordinator
Cross-session coordination engine for multi-robot execution.

**Key methods:**
- `checkAgentAlive(robotName, phase)` - Heartbeat monitoring
- `waitForDependency(dependencyRobot, currentRobot, phase)` - Dependency coordination
- `getRobotStatus(robotName, phase)` - Comprehensive status retrieval

### SkillInvoker
Executes ROME skills from Claude Code sessions.

### SkillRegistry
Registry for managing and discovering available skills.

## Design Principles

### Separation of Concerns
- **ROME/** = Pure framework (markdown, AORDL, mode files)
- **ROME_tools/** = Node.js implementation (execution, orchestration, monitoring)

### Single Dependency Tree
All Node.js dependencies managed in one `package.json`, one `node_modules/`.

### Framework-Agnostic
These tools execute the ROME framework but are not part of the framework itself. They can be replaced with alternative implementations (Python, Go, etc.) without affecting the framework.

## Development

### Adding New Orchestrators

Create new orchestrator in `orchestrators/`:

```bash
mkdir -p orchestrators/my-new-orchestrator
```

Add entry point and supporting files, then add npm script to `package.json`:

```json
{
  "scripts": {
    "my-orchestrator": "node orchestrators/my-new-orchestrator/index.js"
  }
}
```

### Path Resolution

All orchestrators use relative paths from their location:

- `../../lib/` - Access shared libraries
- `../../../../ROME/` - Access ROME framework
- `../../../../ARTIFACTS/` - Access project artifacts

Example:

```javascript
const ActivityLogCoordinator = require('../../lib/ActivityLogCoordinator');
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const ARTIFACTS = path.join(PROJECT_ROOT, 'ARTIFACTS');
```

## Related Documentation

- **ROME Framework:** `../ROME/`
- **User Guide:** `../USER-GUIDE.md`
- **Hybrid Mode Guide:** `../ROME/rome-p5-generation/HYBRID-MODE-GUIDE.md`
- **Testing Guide:** `../ROME/rome-p5-generation/TESTING-GUIDE.md`

## Implementation Status

### Completed
- ✅ P5 Hybrid Mode (Roma Command Center)
- ✅ ActivityLogCoordinator
- ✅ MonitoringDashboard with live updates
- ✅ AlertSystem with failure detection
- ✅ CommandHandlers for manual intervention

### Future Enhancements
- Additional phase orchestrators (P1-P4, QA)
- Performance metrics collection
- Agent restart automation
- Output log aggregation
- Web-based dashboard

---

**Part of ROME-PROP-022: Agentic Loop Optimization**
