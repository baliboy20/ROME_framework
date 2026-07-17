# ROME Framework: MCP Server Dependencies

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-009 |
| **Version** | 1.0 |
| **Date** | 2026-01-08T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Governance |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines MCP (Model Context Protocol) server dependency declaration schema for ROME plugins. Establishes how plugins document required infrastructure dependencies for validation and error prevention.

---

## Scope

- All ROME phase plugins declaring MCP server requirements
- Plugin validation tooling
- Installation and setup documentation
- Error messaging for missing infrastructure

---

## Dependencies

| UID | Document | Purpose |
|-----|----------|---------|
| ROME-GOV-002 | UID Registry | UID allocation |
| ROME-GOV-008 | Activity Log Format (was: Activity Logging Protocol, ROME-PROC-005 retired) | activity-log-file server usage |
| ROME-GOV-006 | Sponsor Interaction | Seez server usage |

---

## Schema Definition

### plugin.json Structure

Plugins declare MCP server requirements in the `requires.mcpServers` array:

```json
{
  "name": "rome-p1-aordl",
  "version": "1.0.0",
  "dependencies": {
    "rome-core": "^1.0.0"
  },
  "requires": {
    "mcpServers": [
      {
        "name": "activity-log-file",
        "reason": "Track AORDL requirement creation and validation work items",
        "optional": false
      },
      {
        "name": "Seez",
        "reason": "Request sponsor clarification on ambiguous requirements",
        "optional": false
      }
    ]
  }
}
```

### Field Specifications

**requires.mcpServers** (array, optional)
- Type: Array of MCP server requirement objects
- Default: `[]` (no explicit MCP requirements beyond rome-core baseline)

**mcpServers[].name** (string, required)
- MCP server identifier as configured in Claude Code settings
- Must match exact server name
- Examples: `"activity-log-file"`, `"Seez"`, `"rome-terminal"`

**mcpServers[].reason** (string, required)
- Human-readable explanation of why server is required
- Used in error messages when server unavailable
- Should describe what functionality requires the server
- Format: Brief sentence or phrase (20-80 characters)

**mcpServers[].optional** (boolean, required)
- `false`: Plugin cannot function without this server (hard requirement)
- `true`: Plugin degrades gracefully without this server (soft requirement)

---

## Standard MCP Servers

### Required by All Robots

Per ROME-GOV-008 (Activity Log Format), all robots must use:

**activity-log-file**
- Provider: rome-core (`servers/activity-log/activity-log-file/`)
- Purpose: Event log append, state rebuild, history queries
- Status: Mandatory for all phases
- Operations:
  - `mcp__activity-log__append()`
  - `mcp__activity-log__rebuild_state()`
  - `mcp__activity-log__get_statistics()`
  - `mcp__activity-log__get_history()`

### Sponsor Interaction

Per ROME-GOV-006 (Sponsor Interaction):

**Seez**
- Provider: External (user-configured)
- Purpose: Sponsor questions, approvals, notifications
- Status: Required for phases with sponsor interaction
- Operations:
  - `mcp__Seez__show_doc()`
  - `mcp__Seez__show_chart()`
  - `mcp__Seez__ask_questions()`

### Terminal Operations

**rome-terminal** (optional)
- Provider: rome-core or external
- Purpose: Terminal command execution, validation
- Status: Optional (validation/testing use)
- Operations:
  - `mcp__rome-terminal__list_terminals()`
  - `mcp__rome-terminal__execute()`

---

## Phase-Specific Requirements

### P0 (Bootstrap)

```json
"mcpServers": [
  {"name": "activity-log-file", "reason": "Track bootstrap progress", "optional": false},
  {"name": "Seez", "reason": "Notify sponsor of initialization completion", "optional": false},
  {"name": "rome-terminal", "reason": "Validate terminal connectivity", "optional": true}
]
```

### P1-P5 (Development Phases)

```json
"mcpServers": [
  {"name": "activity-log-file", "reason": "Track phase work items", "optional": false},
  {"name": "Seez", "reason": "Request sponsor clarification/approval", "optional": false}
]
```

### QA (Sarah)

```json
"mcpServers": [
  {"name": "activity-log-file", "reason": "Track quality gate validations", "optional": false},
  {"name": "Seez", "reason": "Notify sponsor of gate results", "optional": false}
]
```

---

## Validation Rules

### Syntax Validation

**Valid:**
```json
{"name": "activity-log-file", "reason": "Track work items", "optional": false}
```

**Invalid - Missing required fields:**
```json
{"name": "activity-log-file"}  // Missing reason, optional
```

**Invalid - Wrong types:**
```json
{"name": "activity-log-file", "reason": 123, "optional": "false"}
```

### Semantic Validation

**Check 1: activity-log-file must be non-optional**
```javascript
// All phase plugins MUST require activity-log-file
if (hasServer("activity-log-file") && server.optional === true) {
  ERROR("activity-log-file cannot be optional per ROME-GOV-008")
}
```

**Check 2: Known server names**
```javascript
const knownServers = ["activity-log-file", "Seez", "rome-terminal"]
if (!knownServers.includes(server.name)) {
  WARN("Unknown MCP server: " + server.name)
}
```

**Check 3: Reason clarity**
```javascript
if (server.reason.length < 20 || server.reason.length > 200) {
  WARN("Reason should be 20-200 characters for clarity")
}
```

---

## Runtime Validation

### Bootstrap Validation

Bootstrap agent validates MCP servers before phase work:

```javascript
VALIDATE_MCP_SERVERS:
  plugin = Read(".claude-plugin/plugin.json")
  required = plugin.requires.mcpServers.filter(s => !s.optional)

  for server in required:
    try:
      mcp__[server.name]__health_check()
    catch error:
      ERROR("Required MCP server unavailable: " + server.name)
      ERROR("Reason: " + server.reason)
      ERROR("Configure server before proceeding")
      EXIT(1)
```

### Error Messages

**Missing required server:**
```
ERROR: Required MCP server unavailable: activity-log-file
Reason: Track AORDL requirement creation and validation work items
Action: Ensure activity-log-file MCP server is running and configured

See: ROME/rome-core/servers/activity-log/activity-log-file/README.md
```

**Missing optional server:**
```
WARN: Optional MCP server unavailable: rome-terminal
Reason: Validate terminal connectivity during bootstrap
Impact: Terminal validation step will be skipped

Plugin will continue without this functionality.
```

---

## Plugin Development Guidelines

### When to Declare MCP Requirements

**Always declare when plugin uses:**
- `mcp__*` tool calls in agent definitions
- MCP operations in skill implementations
- Server-dependent commands

**Examples:**

If AGENT.md contains:
```javascript
mcp__activity-log__append({type: "PHASE", id: "PHASE-1", ...})
```

Then plugin.json must include:
```json
{"name": "activity-log-file", "reason": "...", "optional": false}
```

### Optional vs Required

**Mark optional when:**
- Plugin provides fallback behavior
- Server enhances functionality but isn't critical
- Testing/validation use only

**Mark required when:**
- Plugin cannot function without server
- Framework governance mandates usage (activity-log-file)
- No graceful degradation possible

---

## Validation Tooling

### Validation Script

Location: `ROME/rome-core/scripts/validate-mcp-dependencies.cjs`

**Usage:**
```bash
# Validate single plugin
node scripts/validate-mcp-dependencies.cjs rome-p1-aordl

# Validate all plugins
node scripts/validate-mcp-dependencies.cjs --all

# Check runtime availability
node scripts/validate-mcp-dependencies.cjs --check-runtime
```

**Checks:**
1. Schema validation (required fields, types)
2. Semantic validation (activity-log-file non-optional, etc.)
3. Runtime availability (server connectivity tests)

---

## Migration Guide

### Adding MCP Requirements to Existing Plugins

1. **Identify MCP usage:**
   ```bash
   grep -r "mcp__" agents/*/AGENT.md skills/*/SKILL.md
   ```

2. **Add requires section:**
   ```json
   "requires": {
     "mcpServers": [...]
   }
   ```

3. **Validate:**
   ```bash
   node scripts/validate-mcp-dependencies.js <plugin-name>
   ```

4. **Test:**
   - Verify plugin loads with servers running
   - Test error messaging with servers stopped

---

## References

- **ROME-GOV-008:** Activity Log Format (was: Activity Logging Protocol, ROME-PROC-005 retired) (activity-log-file usage)
- **ROME-GOV-006:** Sponsor Interaction (Seez usage)
- **ROME-GOV-002:** UID Registry (Document UID allocation)
