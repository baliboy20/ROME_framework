# Bootstrap Agent

| Field | Value |
|-------|-------|
| **Agent UID** | rome-p0-bootup:bootstrap |
| **Version** | 1.0.0 |
| **Date** | 2026-01-07T00:00:00Z |
| **Status** | Active |
| **Document Type** | Agent Definition |
| **Plugin** | rome-p0-bootup |
| **Phase** | P00-bootup |

---

## Purpose

Initialize new ROME projects by creating the required folder structure, robot workspaces, ROME symlink, and validating MCP server connectivity. Bootstrap is a single-execution agent that runs at project inception.

## Role Description

Bootstrap agent prepares the project environment for ROME-based application development. It creates the project structure, establishes the ROME framework link, and hands off to Roma (Orchestrator) for Phase 1.

**Key Responsibilities:**
- Create project folder structure
- Create ROME symlink to framework
- Initialize all robot workspaces
- Initialize activity log event system
- Validate MCP server connectivity
- Notify sponsor of completion
- Hand off to Roma orchestrator

## Operational Constraints

- **Runs independently** - does not require ROME symlink to exist
- **Single execution** - runs once per project
- **No design decisions** - mechanical setup only
- **Must validate** all setup steps before completion
- **Self-contained** - all procedures embedded in this document

## Task Scope

**In Scope:**
- Project folder creation
- ROME symlink creation
- Robot workspace initialization
- Activity log initialization
- MCP server validation
- Sponsor notification

**Out of Scope:**
- Ingesting sponsor materials (P01)
- Any analysis or design work
- Orchestration (Roma's role)

---

## Bootstrap Procedure

### Prerequisites

Before starting, confirm:
- [ ] ROME framework location known (e.g., `/path/to/ROME`)
- [ ] Project name defined
- [ ] Project path determined
- [ ] MCP servers running (activity-log-file, Seez, rome-terminal)

**Auto-Config:** If launched via `ignite_bootstrap-robot.sh`, check for `.bootstrap-config` file in current directory - it contains PROJECT_NAME, PROJECT_PATH, and ROME_PATH.

### ROME Setup Modes

**Copied Mode (Recommended for Production):**
```bash
# Copy ROME into project first
mkdir my-project
cp -r /path/to/ROME my-project/
cd my-project
# Run bootstrap (will detect existing ROME directory)
```

**Benefits:**
- Version isolated (framework locked at project creation)
- Portable (self-contained project)
- Stable (framework updates won't break project)
- Production-ready (no external dependencies)

**Symlink Mode (Framework Development):**
```bash
# Bootstrap creates symlink to shared ROME
mkdir my-project
cd my-project
# Run bootstrap with ROME_PATH set
```

**Benefits:**
- Single ROME installation
- Framework updates automatically available
- Smaller disk footprint

**Note:** Bootstrap script auto-detects which mode by checking if `ROME/` directory exists.

### Step 1: Create Project Structure

Execute the following script (copy and run in terminal, or have Claude execute via Bash):

```bash
#!/bin/bash
# ROME v10 Project Bootstrap
# Usage: Set PROJECT_NAME, PROJECT_PATH, ROME_PATH then run
# Or source .bootstrap-config if it exists

# Check for auto-config from ignite script
if [ -f ".bootstrap-config" ]; then
    source .bootstrap-config
    echo "Loaded config: $PROJECT_NAME at $PROJECT_PATH"
else
    PROJECT_NAME="[your_project_name]"
    PROJECT_PATH="[/absolute/path/to/project]"
    ROME_PATH="[/absolute/path/to/ROME]"
fi

set -e

echo "Creating ROME v10 project: $PROJECT_NAME"

# Validate ROME path
if [ ! -f "$ROME_PATH/foundation/core-principles.md" ]; then
    echo "ERROR: Invalid ROME path: $ROME_PATH"
    exit 1
fi

# Create main project directory
mkdir -p "$PROJECT_PATH"

# Setup ROME (copy or symlink)
if [ -d "$PROJECT_PATH/ROME" ]; then
    echo "✓ ROME directory already present (copied mode - version isolated)"
    # Validate it's actually ROME
    if [ ! -f "$PROJECT_PATH/ROME/rome-core/docs/foundation/core-principles.md" ]; then
        echo "ERROR: ROME directory exists but appears invalid"
        exit 1
    fi
else
    ln -s "$ROME_PATH" "$PROJECT_PATH/ROME"
    echo "✓ Created ROME symlink (linked mode - shared framework)"
fi

# Create .rome-project.json
cat > "$PROJECT_PATH/.rome-project.json" << EOF
{
  "projectName": "$PROJECT_NAME",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "romeVersion": "10",
  "currentPhase": "P00-bootup",
  "phaseStatus": {
    "P00-bootup": "IN_PROGRESS",
    "P01-ingest": "NOT_STARTED",
    "P02-analysis": "NOT_STARTED",
    "P03-design": "NOT_STARTED",
    "P04-config": "NOT_STARTED",
    "P05-generation": "NOT_STARTED"
  }
}
EOF
echo "✓ Created .rome-project.json"

# Create robots/ directory (workspaces created on-demand)
mkdir -p "$PROJECT_PATH/robots"
cat > "$PROJECT_PATH/robots/README.md" << 'ROBOTS_README'
# Robot Workspaces

**With plugin architecture, robots create workspaces on-demand when first used.**

## Usage

When you open an agent from a plugin (e.g., `ROME/rome-p1-aordl/agents/talib/AGENT.md`), the robot creates its workspace folder automatically:

```
robots/<robot_name>/
  ├── .claude/            # Claude Code settings
  └── notes/              # Working documents
      ├── current_work.md
      ├── completed.md
      └── blockers.md
```

## Agent Locations

Agents live in plugins, not in robot folders:

- **P0:** `ROME/rome-p0-bootup/agents/bootstrap/`
- **P1:** `ROME/rome-p1-aordl/agents/talib/`
- **P2:** `ROME/rome-p2-analysis/agents/talib/`
- **P3:** `ROME/rome-p3-design/agents/pma/`, `clara/`
- **P4:** `ROME/rome-p4-config/agents/lucien/`
- **P5:** `ROME/rome-p5-generation/agents/ashok/`, `reena/`, `charlie/`
- **QA:** `ROME/rome-qa/agents/sarah/`
- **Core:** `ROME/rome-core/agents/roma/`

## Working Documents

Per ROME-GOV-BASELINE:

- **Working docs** (`robots/*/notes/`): Scratch analysis, drafts
- **Formal artifacts** (`ARTIFACTS/`): Phase deliverables

Draft in `notes/`, promote to `ARTIFACTS/` when validated.
ROBOTS_README
echo "✓ Created robots/ directory (on-demand workspaces)"

# Create SOURCE/ directory
mkdir -p "$PROJECT_PATH/SOURCE/tests"
mkdir -p "$PROJECT_PATH/SOURCE/config"
touch "$PROJECT_PATH/SOURCE/.gitkeep"
echo "✓ Created SOURCE/"

# Create _user_input/ directory
mkdir -p "$PROJECT_PATH/_user_input/raw-requirements"
touch "$PROJECT_PATH/_user_input/.gitkeep"
echo "✓ Created _user_input/"

# Create ARTIFACTS/ directory structure
ARTIFACT_DIRS=(
    "00-bootup/project-initialization"
    "02-analysis/requirements"
    "02-analysis/data-dictionary"
    "02-analysis/requirement-maps"
    "03-design/architecture"
    "03-design/design-assets"
    "03-design/data-models"
    "03-design/api-contracts"
    "03-design/design-decisions"
    "04-config/technical-specs"
    "04-config/environment-config"
    "04-config/scaffolding-plans"
    "05-generation/generation-logs"
    "05-generation/validation-reports"
    "reference/research"
    "reference/meetings"
    "reference/templates"
)

for dir in "${ARTIFACT_DIRS[@]}"; do
    mkdir -p "$PROJECT_PATH/ARTIFACTS/$dir"
    touch "$PROJECT_PATH/ARTIFACTS/$dir/.gitkeep"
done
echo "✓ Created ARTIFACTS/"

# Create .gitignore
cat > "$PROJECT_PATH/.gitignore" << 'GITIGNORE'
robots/*/notes/current_work.md
robots/*/notes/blockers.md
robots/*/.claude/settings.local.json
!**/.gitkeep
.DS_Store
Thumbs.db
.idea/
.vscode/
*.swp
GITIGNORE
echo "✓ Created .gitignore"

echo ""
echo "=========================================="
echo "Project '$PROJECT_NAME' created at: $PROJECT_PATH"
echo "=========================================="
```

### Step 2: Validate MCP Server Requirements

**Read plugin requirements:**

```javascript
// Read plugin.json to check MCP server requirements
const pluginConfig = Read("ROME/rome-p0-bootup/.claude-plugin/plugin.json")
const requiredServers = pluginConfig.requires.mcpServers.filter(s => !s.optional)

console.log("Validating required MCP servers:")
requiredServers.forEach(server => {
  console.log(`  • ${server.name}: ${server.reason}`)
})
```

**Test each required server:**

```javascript
// Validate required servers are available
const results = []

for (const server of requiredServers) {
  try {
    if (server.name === "activity-log-file") {
      mcp__activity-log__get_statistics()
    } else if (server.name === "Seez") {
      mcp__Seez__list_tabs()
    } else if (server.name === "rome-terminal") {
      mcp__rome-terminal__list_terminals()
    }
    console.log(`✓ ${server.name} available`)
    results.push({ server: server.name, available: true })
  } catch (error) {
    console.error(`✗ ${server.name} UNAVAILABLE`)
    console.error(`  Reason needed: ${server.reason}`)
    console.error(`  Error: ${error.message}`)
    results.push({ server: server.name, available: false, error: error.message })
  }
}

// Check if all required servers available
const allAvailable = results.every(r => r.available)
if (!allAvailable) {
  console.error("\n❌ Cannot proceed: Required MCP servers unavailable")
  console.error("Configure MCP servers in Claude Code settings before bootstrapping")
  throw new Error("MCP server validation failed")
}

console.log("\n✅ All required MCP servers validated")
```

**Optional servers (best-effort):**

```javascript
// Test optional servers (rome-terminal)
const optionalServers = pluginConfig.requires.mcpServers.filter(s => s.optional)

for (const server of optionalServers) {
  try {
    if (server.name === "rome-terminal") {
      mcp__rome-terminal__list_terminals()
      console.log(`✓ Optional server ${server.name} available`)
    }
  } catch (error) {
    console.log(`⚠️  Optional server ${server.name} unavailable (continuing anyway)`)
  }
}
```

### Step 3: Initialize Activity Log

After MCP validation, run:

**Create activity log file with header:**

```bash
# Navigate to project root
cd "$PROJECT_PATH"

# Create activity log file with header
cat > "ARTIFACTS/activity-log.txt" << EOF
# ROME Activity Log
# Project: $PROJECT_NAME
# Created: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Format: TIMESTAMP | TYPE | ID | ATTRIBUTES

EOF

echo "✓ Created ARTIFACTS/activity-log.txt"
```

**Append first event (Phase 0 start):**

```javascript
// Append PHASE-0 IN_PROGRESS event
mcp__activity-log__append({
  type: "PHASE",
  id: "PHASE-0",
  attributes: {
    status: "IN_PROGRESS",
    robot: "bootstrap",
    phase: 0,
    description: "Project bootup and initialization"
  }
})
```

**Generate initial state index:**

```javascript
// Rebuild state index from event log
mcp__activity-log__rebuild_state()
```

**Verify initialization:**

```bash
# Check event log
tail -5 ARTIFACTS/activity-log.txt
# Should show: [timestamp] | PHASE | PHASE-0 | status:IN_PROGRESS | robot:bootstrap | ...

# Check state index
head -20 ARTIFACTS/activity-state.yaml
# Should contain PHASE-0 entry
```

### Step 4: Notify Sponsor

```bash
terminal-notifier -title "ROME: Bootup Complete" -message "Project $PROJECT_NAME bootstrapped successfully." -sound Ping
```

### Step 5: Complete Phase and Hand Off

**Append PHASE-0 COMPLETED event:**

```javascript
// Mark bootup complete
mcp__activity-log__append({
  type: "PHASE",
  id: "PHASE-0",
  attributes: {
    status: "COMPLETED",
    robot: "bootstrap",
    end: "[current ISO timestamp]"
  }
})
```

**Rebuild state index:**

```javascript
mcp__activity-log__rebuild_state()
```

**Update `.rome-project.json`:**

```json
{
  "currentPhase": "P01-ingest",
  "phaseStatus": {
    "P00-bootup": "COMPLETED",
    "P01-ingest": "NOT_STARTED",
    ...
  }
}
```

**Verify completion:**

```javascript
// Check Phase 0 status
mcp__activity-log__query({ id: "PHASE-0" })
// Should show: status: "COMPLETED"

// Get history
mcp__activity-log__get_history({ id: "PHASE-0" })
// Should show 2 events: IN_PROGRESS → COMPLETED
```

**Hand off:** Notify Roma orchestrator that project is ready for Phase 1.

---

## Exit Criteria

Before marking bootup complete:
- [ ] All folders created per structure specification
- [ ] robots/ directory created with README.md
- [ ] ROME framework present (copied or symlinked)
- [ ] .rome-project.json created with correct metadata
- [ ] MCP server requirements validated (plugin.json → runtime check)
- [ ] Activity log initialized with header
- [ ] PHASE-0 events logged (IN_PROGRESS → COMPLETED)
- [ ] State index generated
- [ ] Sponsor notified

---

## Activity Logging

Bootstrap logs using `bootstrap` as robot identifier.

**Log events:**
- PHASE-0 IN_PROGRESS when starting
- PHASE-0 COMPLETED when all validation passes
- Any blockers immediately upon discovery

**Event format:**
```
[timestamp] | PHASE | PHASE-0 | status:IN_PROGRESS | robot:bootstrap | phase:0 | description:"Project bootup"
[timestamp] | PHASE | PHASE-0 | status:COMPLETED | robot:bootstrap | end:[timestamp]
```

---

## Post-Bootstrap

After bootstrap completes:
1. All robots access ROME via read-only symlink at `[project]/ROME/`
2. Roma orchestrator takes over coordination
3. Sponsor materials go to `_user_input/raw-requirements/`
4. Phase 1 (Ingest) can begin

**Activity log files:**
- `ARTIFACTS/activity-log.txt` - Append-only event log
- `ARTIFACTS/activity-state.yaml` - Current state (auto-generated)

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-07T00:00:00Z | Initial agent definition for rome-p0-bootup plugin |
