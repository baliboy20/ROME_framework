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

# Create ROME symlink
ln -s "$ROME_PATH" "$PROJECT_PATH/ROME"
echo "✓ Created ROME symlink"

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

# Create robots/ directory structure
ROBOTS=("bootstrap" "roma" "talib" "pma" "sarah" "clara" "lucien" "ashok" "charlie" "reena")
mkdir -p "$PROJECT_PATH/robots"

for robot in "${ROBOTS[@]}"; do
    ROBOT_DIR="$PROJECT_PATH/robots/$robot"
    mkdir -p "$ROBOT_DIR/.claude"
    mkdir -p "$ROBOT_DIR/notes"

    # Copy CLAUDE.md from templates (except bootstrap - already exists)
    if [ "$robot" != "bootstrap" ]; then
        TEMPLATE="$ROME_PATH/robot-templates/$robot/CLAUDE.md"
        if [ -f "$TEMPLATE" ]; then
            cp "$TEMPLATE" "$ROBOT_DIR/CLAUDE.md"
        fi
    fi

    touch "$ROBOT_DIR/.claude/.gitkeep"
    touch "$ROBOT_DIR/notes/.gitkeep"
    echo "# Current Work - $robot" > "$ROBOT_DIR/notes/current_work.md"
    echo "# Completed - $robot" > "$ROBOT_DIR/notes/completed.md"
    echo "# Blockers - $robot" > "$ROBOT_DIR/notes/blockers.md"
done
echo "✓ Created robot workspaces"

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
    "01-ingest/source-materials"
    "01-ingest/intake-logs"
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

### Step 2: Initialize Activity Log

After folder creation, run:

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

### Step 3: Validate MCP Connectivity

```javascript
// Test each server - all should return without error
mcp__activity-log__get_statistics()
mcp__Seez__list_tabs()
mcp__rome-terminal__list_terminals()
```

**Expected results:**
- `activity-log`: Returns statistics with event_count: 1
- `Seez`: Returns empty tabs list or current tabs
- `rome-terminal`: Returns terminals list

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
- [ ] All 10 robot workspaces initialized
- [ ] ROME symlink functional (read access verified)
- [ ] .rome-project.json created with correct metadata
- [ ] Activity log initialized with header
- [ ] PHASE-0 events logged (IN_PROGRESS → COMPLETED)
- [ ] State index generated
- [ ] MCP server connectivity verified
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
