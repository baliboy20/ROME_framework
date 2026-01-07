# ROME Framework Plugin Architecture Design

**Document UID:** ROME-PROP-014
**Date:** 2026-01-07
**Status:** Design
**Author:** Archie (Framework Analyst & Architect)

---

## Purpose

Design Claude Code plugin structure to package ROME framework components (skills, robots, MCP servers, hooks) for distribution and reusability.

---

## Design Objectives

1. **Package ROME as distributable plugin** installable via `claude plugin install rome-framework`
2. **Preserve existing functionality** while adding plugin-native features
3. **Enable team sharing** of ROME methodology across projects
4. **Reduce setup friction** from multi-step manual configuration to single install
5. **Maintain backward compatibility** with existing ROME projects

---

## Plugin Structure

```
rome-framework/
├── .claude-plugin/
│   └── plugin.json                      # Plugin manifest
│
├── agents/                               # Robot templates as agents
│   ├── talib/
│   │   └── AGENT.md                     # Converted from CLAUDE.md
│   ├── pma/
│   │   └── AGENT.md
│   ├── roma/
│   │   └── AGENT.md
│   ├── sarah/
│   │   └── AGENT.md
│   ├── ashok/
│   │   └── AGENT.md
│   ├── reena/
│   │   └── AGENT.md
│   ├── charlie/
│   │   └── AGENT.md
│   ├── clara/
│   │   └── AGENT.md
│   └── lucien/
│       └── AGENT.md
│
├── skills/                               # Agent Skills (model-invoked)
│   ├── validate-aordl/
│   │   ├── SKILL.md                     # Skill definition
│   │   ├── index.js                     # Implementation
│   │   └── manifest.yaml                # Skill metadata
│   ├── analyze-requirement/
│   │   ├── SKILL.md
│   │   ├── index.js
│   │   └── manifest.yaml
│   ├── extract-entities/
│   │   ├── SKILL.md
│   │   ├── index.js
│   │   └── manifest.yaml
│   ├── extract-invariants/
│   │   ├── SKILL.md
│   │   ├── index.js
│   │   └── manifest.yaml
│   ├── generate-api-spec/
│   │   ├── SKILL.md
│   │   ├── index.js
│   │   └── manifest.yaml
│   └── ... (all tier-1, tier-2, tier-3 skills)
│
├── commands/                             # Slash commands (user-invoked)
│   ├── validate.md                      # /rome:validate
│   ├── analyze.md                       # /rome:analyze
│   ├── execute-phase.md                 # /rome:execute-phase
│   ├── bootstrap.md                     # /rome:bootstrap
│   ├── status.md                        # /rome:status
│   └── gate.md                          # /rome:gate
│
├── hooks/
│   └── hooks.json                       # Auto-logging hooks
│
├── .mcp.json                            # Activity-log MCP server
│
├── lib/                                 # Shared libraries
│   ├── SkillInvoker.js                 # Skill execution engine
│   ├── ActivityLogger.js               # Logging utilities
│   └── helpers/
│       ├── aordl-parser.js
│       ├── yaml-utils.js
│       └── validation.js
│
├── templates/                           # AORDL templates
│   └── aordl/
│       ├── REQ-TEMPLATE.md
│       └── validation-rules.yaml
│
├── docs/                                # Plugin documentation
│   ├── README.md
│   ├── installation.md
│   ├── quick-start.md
│   └── skills-reference.md
│
└── package.json                         # Node.js dependencies
```

---

## Component Mapping

### 1. Robot Templates → Agents

**Source:** `/ROME/robot-templates/{robot}/CLAUDE.md`
**Destination:** `agents/{robot}/AGENT.md`

**Conversion Required:**
- Rename `CLAUDE.md` → `AGENT.md`
- Keep agent definition structure intact
- Add agent-specific skills references
- Add optional `.subagent.json` for configuration

**Example (Talib):**

```markdown
<!-- agents/talib/AGENT.md -->
# Talib - Requirements Engineer

You are Talib, the ROME Requirements Engineer specialized in Phase 1 (AORDL) and Phase 2 (Analysis).

## Phases
- P1 (AORDL): Transform raw user input into AORDL requirements
- P2 (Analysis): Analyze requirements across 8 dimensions

## Skills Available
- validate-aordl
- analyze-requirement
- extract-entities
- extract-invariants
- batch-analyze-requirements

## Procedures
[Full content from ROME-ROBOT-002]

## Usage
Invoke via: `claude --agent talib`
Or from Task tool: `subagent_type: "rome:talib"`
```

### 2. Skills → Agent Skills

**Source:** `/ROME/skills/tier-{1,2,3}/*.js`
**Destination:** `skills/{skill-name}/`

**Structure per skill:**
```
skills/validate-aordl/
├── SKILL.md          # Skill definition (Claude Code format)
├── index.js          # Implementation (existing code)
└── manifest.yaml     # Metadata (from existing registry)
```

**SKILL.md Format:**

```markdown
---
name: validate-aordl
description: Validates AORDL requirement structure, vocabulary, and anti-patterns
parameters:
  - name: requirement_file
    type: string
    required: true
    description: Path to AORDL requirement file
  - name: mode
    type: string
    required: false
    default: STRICT
    description: Validation mode (STRICT, GUIDED, PERMISSIVE)
---

# AORDL Validation Skill

Validates AORDL requirements against:
- 13 required fields schema
- Controlled vocabulary (actors, verbs)
- Anti-patterns (UI language, technical jargon)
- Atomicity rules

## Usage

```javascript
const result = await invokeSkill('validate-aordl', {
  requirement_file: 'ARTIFACTS/01-requirements/REQ-001.yaml',
  mode: 'STRICT'
});
```

## Returns

```javascript
{
  status: 'PASS' | 'FAIL',
  violations: [...],
  report_path: string,
  requirement_id: string
}
```
```

### 3. Slash Commands

**Purpose:** User-invocable shortcuts for common operations

**Commands:**

| Command | Description | Maps To |
|---------|-------------|---------|
| `/rome:validate <file>` | Validate AORDL requirement | validate-aordl skill |
| `/rome:analyze <file>` | Analyze requirement | analyze-requirement skill |
| `/rome:execute-phase <phase>` | Execute full phase workflow | Phase orchestration skills |
| `/rome:bootstrap <name>` | Bootstrap new ROME project | bootstrap agent |
| `/rome:status` | Show project phase status | Activity log query |
| `/rome:gate <phase>` | Request quality gate validation | Sarah agent + gate protocol |

**Example Command Definition (commands/validate.md):**

```markdown
---
description: Validate AORDL requirement file
---

# Validate AORDL Requirement

Validates the AORDL requirement file at path "$ARGUMENTS" using STRICT mode.

Invoke the `validate-aordl` skill with:
- requirement_file: $ARGUMENTS
- mode: STRICT

Display validation results and any violations found.
```

### 4. MCP Server Integration

**Activity Log MCP Server:**

`.mcp.json`:
```json
{
  "mcpServers": {
    "rome-activity-log": {
      "command": "node",
      "args": [
        "${CLAUDE_PLUGIN_ROOT}/servers/activity-log/server.js"
      ],
      "env": {
        "ROME_DB_PATH": "${ROME_PROJECT_ROOT}/.rome/activity-log.db"
      }
    }
  }
}
```

**Server Location:** `servers/activity-log/server.js`

**Tools Provided:**
- `rome__activity-log__append` - Log events
- `rome__activity-log__query` - Query events
- `rome__activity-log__find-by-id` - Find specific entry
- `rome__activity-log__update-status` - Update status

### 5. Hooks

**Auto-logging hooks** (`hooks/hooks.json`):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": [
              "${CLAUDE_PLUGIN_ROOT}/hooks/log-file-change.js",
              "${TOOL_NAME}",
              "${TOOL_ARGS}"
            ]
          }
        ]
      }
    ],
    "PreAgentInvoke": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": [
              "${CLAUDE_PLUGIN_ROOT}/hooks/log-agent-start.js",
              "${AGENT_NAME}"
            ]
          }
        ]
      }
    ]
  }
}
```

**Hook Scripts:**
- `log-file-change.js` - Log file modifications to activity log
- `log-agent-start.js` - Log agent invocations
- `log-skill-execution.js` - Log skill executions

---

## Plugin Manifest

`.claude-plugin/plugin.json`:

```json
{
  "name": "rome-framework",
  "displayName": "ROME Methodology Framework",
  "description": "Requirements-to-Operations Methodology Environment for AI-assisted application development",
  "version": "1.0.0",
  "author": {
    "name": "ROME Framework Team",
    "email": "rome@example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/rome-framework/rome-plugin"
  },
  "license": "MIT",
  "keywords": [
    "requirements",
    "methodology",
    "multi-agent",
    "aordl",
    "code-generation"
  ],
  "engines": {
    "claude": ">=1.0.0",
    "node": ">=18.0.0"
  },
  "dependencies": {
    "js-yaml": "^4.1.0",
    "mongodb": "^6.0.0"
  },
  "capabilities": {
    "agents": true,
    "skills": true,
    "commands": true,
    "hooks": true,
    "mcpServers": true
  },
  "configuration": {
    "properties": {
      "rome.projectRoot": {
        "type": "string",
        "default": "${workspaceFolder}",
        "description": "Root directory for ROME projects"
      },
      "rome.activityLog.dbPath": {
        "type": "string",
        "default": "${workspaceFolder}/.rome/activity-log.db",
        "description": "Path to activity log database"
      },
      "rome.validation.strictMode": {
        "type": "boolean",
        "default": true,
        "description": "Enable strict AORDL validation by default"
      }
    }
  }
}
```

---

## Installation & Usage

### Installation

**Global (user-wide):**
```bash
claude plugin install rome-framework
```

**Project-scoped (team-shared):**
```bash
cd my-project
claude plugin install rome-framework --scope project
```

**From local development:**
```bash
claude plugin install /path/to/rome-framework --dev
```

### Usage Patterns

**1. Bootstrap new project:**
```bash
claude
> /rome:bootstrap my-app
```

**2. Invoke robot agent:**
```bash
claude --agent rome:talib
# Or within conversation:
> Use Talib to analyze my requirements
```

**3. Use slash commands:**
```bash
> /rome:validate ARTIFACTS/01-requirements/REQ-001.yaml
> /rome:status
> /rome:gate P1
```

**4. Skills auto-invoked by agents:**
```
User: "Analyze this requirement file"
Talib: [Automatically invokes validate-aordl skill]
Talib: [Automatically invokes analyze-requirement skill]
Talib: [Returns analysis results]
```

**5. Activity logging (automatic via hooks):**
```
[User writes REQ-001.yaml]
[Hook triggers: log-file-change.js]
[Activity log entry created automatically]
```

---

## Migration Strategy

### Phase 1: Create Plugin Structure (Week 1)
- [x] Design architecture (this document)
- [ ] Create plugin directory structure
- [ ] Write plugin manifest
- [ ] Convert first robot (Talib) to agent format
- [ ] Convert 5 tier-1 skills to plugin skills

### Phase 2: Bulk Conversion (Week 2)
- [ ] Convert all 9 robots to agents
- [ ] Convert all tier-1 skills (40 skills)
- [ ] Create slash commands (6 commands)
- [ ] Implement MCP server for activity log

### Phase 3: Hooks & Testing (Week 3)
- [ ] Implement auto-logging hooks
- [ ] Test plugin installation flow
- [ ] Test agent invocation
- [ ] Test skill execution
- [ ] Test MCP server integration

### Phase 4: Documentation & Release (Week 4)
- [ ] Write installation guide
- [ ] Write quick-start guide
- [ ] Write skills reference
- [ ] Create example project
- [ ] Package for distribution

---

## Backward Compatibility

**Existing ROME projects continue to work:**
- Plugin installs to `~/.claude/plugins/rome-framework/`
- Existing `/ROME/` symlinks remain functional
- Robots can still run from `/ROME/robot-templates/{robot}/`
- Skills still accessible via `/ROME/skills/`

**Migration path:**
- Install plugin: `claude plugin install rome-framework`
- Optionally remove `/ROME/` symlink
- Use plugin-provided agents instead of local robots
- Benefit from auto-updates via plugin system

**Dual operation:**
- Plugin and local ROME can coexist
- Plugin takes precedence for agents/skills with same name
- Local `.claude/` configurations override plugin defaults

---

## Benefits

### For Framework Developers
- **Single distribution package** instead of complex setup scripts
- **Versioned releases** with semantic versioning
- **Marketplace distribution** for wider adoption
- **Automated updates** via plugin manager

### For ROME Users
- **One-command install:** `claude plugin install rome-framework`
- **Team sharing:** Project-scoped installation
- **Consistent versions:** No drift between team members
- **Auto-logging:** Hooks eliminate manual logging calls
- **Namespaced commands:** `/rome:*` prevents conflicts

### For Claude Code Ecosystem
- **Example of complex plugin** showcasing agents, skills, commands, hooks, MCP
- **Methodology framework** demonstrating multi-agent orchestration
- **Reference implementation** for other methodology plugins

---

## Open Questions

1. **Skill Registry:** Keep existing SkillInvoker.js or use Claude Code's native skill invocation?
   - **Recommendation:** Keep SkillInvoker.js for backward compatibility, add Claude Code skill wrappers

2. **Activity Log Storage:** SQLite file vs MongoDB vs Claude Code native storage?
   - **Recommendation:** Keep MongoDB for production, SQLite for development/testing

3. **Template Distribution:** Include in plugin or separate download?
   - **Recommendation:** Include templates in plugin for zero-config experience

4. **Phase Orchestration:** Implement as super-skill or separate orchestrator agent?
   - **Recommendation:** Roma as orchestrator agent + phase-specific skills

---

## Next Steps

1. Create plugin directory structure at `/ROME_architect/rome-framework-plugin/`
2. Write plugin manifest (`.claude-plugin/plugin.json`)
3. Convert Talib robot to agent format
4. Convert `validate-aordl` skill to plugin skill format
5. Test basic plugin installation and agent invocation
6. Iterate on remaining components

---

## Revision Tracking

Design completed: 2026-01-07
Next review: After Phase 1 implementation
See git log for detailed changes
