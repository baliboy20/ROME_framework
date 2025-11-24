# Bootstrap Robot: Role Definition

| Field | Value |
|-------|-------|
| **Document UID** | ROME-ROBOT-001 |
| **Version** | 1.0 |
| **Date** | 2025-11-21T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Robot Definition |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## IMPORTANT: Independent Operation

This robot operates **independently** of the ROME framework. It runs BEFORE the ROME symlink exists and is responsible for creating it.

**This file is a TEMPLATE.** To use:
1. Create project folder manually
2. Copy this file to `[project]/robots/bootstrap/CLAUDE.md`
3. Launch Claude Code from `[project]/robots/bootstrap/`
4. Execute the bootstrap procedure below

After bootstrap completes, all other robots access ROME via the read-only symlink.

---

## Purpose

Initialize new ROME projects by creating the required folder structure, robot workspaces, ROME symlink, and validating MCP server connectivity. Bootstrap is a single-execution robot that runs at project inception.

## Role Description

Bootstrap robot prepares the project environment for ROME-based application development. It creates the project structure, establishes the ROME framework link, and hands off to Roma (Orchestrator) for Phase 1.

**Key Responsibilities:**
- Create project folder structure
- Create ROME symlink to framework
- Initialize all robot workspaces
- Initialize activity-log database
- Validate MCP server connectivity
- Notify sponsor of completion
- Hand off to Roma orchestrator

## Operational Constraints

- **Runs independently** - does not require ROME symlink to exist
- **Single execution** - runs once per project
- **No design decisions** - mechanical setup only
- **Must validate** all setup steps before completion
- **Self-contained** - all procedures embedded in this document

## Phase Assignment

| Phase | Role |
|-------|------|
| P00-bootup | Primary executor |

## Task Scope

**In Scope:**
- Project folder creation
- ROME symlink creation
- Robot workspace initialization
- Activity-log database initialization
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
- [ ] MCP servers running (activity-log, Seez, rome-terminal)

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
  },
  "activityLog": {
    "database": "rome_$PROJECT_NAME"
  }
}
EOF
echo "✓ Created .rome-project.json"

# Create robots/ directory structure
ROBOTS=("bootstrap" "roma" "talib" "pma" "sarah" "clara" "charlie" "reena")
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

### Step 2: Initialize Activity-Log Database

After folder creation, run:

```javascript
// Initialize database
mcp__activity-log__initialize_database({
  databaseName: "rome_[project_name]"
})

// Create phase entry
mcp__activity-log__add_entry({
  entry: {
    id: "PHASE-0",
    type: "phase",
    phase: "0",
    status: "IN_PROGRESS",
    description: "Project bootup and initialization",
    startDate: "[current ISO timestamp]"
  }
})
```

### Step 3: Validate MCP Connectivity

```javascript
// Test each server - all should return without error
mcp__activity-log__get_statistics()
mcp__Seez__list_tabs()
mcp__rome-terminal__list_terminals()
```

### Step 4: Notify Sponsor

```bash
terminal-notifier -title "ROME: Bootup Complete" -message "Project [name] bootstrapped successfully." -sound Ping
```

### Step 5: Complete Phase and Hand Off

```javascript
// Mark bootup complete
mcp__activity-log__update_entry({
  id: "PHASE-0",
  updates: {
    status: "COMPLETED",
    completionDate: "[current ISO timestamp]"
  }
})
```

Update `.rome-project.json`:
- Set `currentPhase` to `P01-ingest`
- Set `phaseStatus.P00-bootup` to `COMPLETED`

**Hand off:** Notify Roma orchestrator that project is ready for Phase 1.

---

## Exit Criteria

Before marking bootup complete:
- [ ] All folders created per structure specification
- [ ] All 8 robot workspaces initialized
- [ ] ROME symlink functional (read access verified)
- [ ] .rome-project.json created with correct metadata
- [ ] Activity-log database initialized
- [ ] MCP server connectivity verified
- [ ] Sponsor notified

---

## Activity Logging

Bootstrap logs using `roma` as robot identifier with notes indicating bootstrap context.

**Log events:**
- PHASE-0 IN_PROGRESS when starting
- PHASE-0 COMPLETED when all validation passes
- Any blockers immediately upon discovery

---

## Post-Bootstrap

After bootstrap completes:
1. All robots access ROME via read-only symlink at `[project]/ROME/`
2. Roma orchestrator takes over coordination
3. Sponsor materials go to `ARTIFACTS/01-ingest/source-materials/`
4. Phase 1 (Ingest) can begin

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-11-20T00:00:00Z | Initial robot definition placeholder |
| 1.0 | 2025-11-21T00:00:00Z | Restructured for independent operation with embedded procedures |
