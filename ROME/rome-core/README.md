# ROME Core Foundation Plugin

Version: 1.0.0
Type: Foundation Plugin
Status: Complete

## Overview

`rome-core` is the foundation plugin for the ROME Framework, providing shared libraries, the Roma orchestrator agent, activity logging infrastructure, and AORDL utilities required by all ROME phase plugins.

## Contents

### Libraries (`lib/`)

- **SkillInvoker.js** - Skill invocation library for executing ROME skills
- **SkillRegistry.js** - Skill registry management for auto-discovery
- **aordl-parser/** - AORDL requirement utilities
  - `validate-aordl.js` - AORDL requirement validation
  - `transform-aordl-to-bdd.js` - AORDL to BDD transformation

### Agents (`agents/`)

- **roma/AGENT.md** - Roma orchestrator agent definition
  - Coordinates all phase transitions
  - Monitors robot activity
  - Manages blockers and dependencies
  - Enforces AORDL traceability

### MCP Servers (`servers/`)

- **activity-log/activity-log-file/** - Activity logging MCP server
  - Event-based file system for activity tracking
  - Append-only event log (`activity-log.txt`)
  - Auto-generated state index (`activity-state.yaml`)
  - Tools: `append()`, `query()`, `get_history()`, `get_statistics()`

### Templates (`templates/`)

- **aordl/** - AORDL requirement authoring templates
  - `REQ-TEMPLATE.yaml` - AORDL requirement template
  - `aordl-authoring-form.html` - Interactive authoring form
  - `aordl-validation-report-template.md` - Validation report template
  - `requirements-catalog-template.md` - Requirements catalog template

## Installation

This plugin is a dependency for all ROME phase plugins. It should be installed in the ROME plugin directory structure:

```bash
/path/to/rome-plugins/
  └── rome-core/
```

## Usage

### As a Plugin Dependency

Phase plugins declare `rome-core` as a dependency in their `.claude-plugin/plugin.json`:

```json
{
  "dependencies": {
    "rome-core": "^1.0.0"
  }
}
```

### MCP Server Configuration

The activity-log MCP server is configured via `.mcp.json`:

```json
{
  "mcpServers": {
    "activity-log": {
      "command": "node",
      "args": ["${pluginPath}/servers/activity-log/activity-log-file/index.js"],
      "env": {
        "PROJECT_ROOT": "${projectRoot}"
      }
    }
  }
}
```

### Using Shared Libraries

```javascript
// Import SkillInvoker
import { SkillInvoker } from 'rome-core/lib/SkillInvoker.js';

// Import AORDL validator
import { validateAORDL } from 'rome-core/lib/aordl-parser/validate-aordl.js';
```

### Roma Orchestrator Agent

The Roma agent is defined in `agents/roma/AGENT.md` and coordinates:

- P0 → P1 → P2 → P3 → P4 → P5 phase transitions
- Robot activity monitoring
- Blocker resolution
- AORDL traceability compliance
- Quality gate coordination

## Provides

- **Libraries**: skillInvoker, skillRegistry, aordlParser, aordlValidator
- **Agents**: roma
- **MCP Servers**: activity-log
- **Templates**: aordl

## Dependencies

- Node.js >= 18.0.0
- js-yaml ^4.1.0

## License

MIT

## Author

ROME Framework Team

## Repository

https://github.com/rome-framework/rome-core
