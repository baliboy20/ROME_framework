# Phase Bootup: Operations Guidelines

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PHASE-001 |
| **Version** | 1.1 |
| **Date** | 2025-11-21T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Phase Specification |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

## Purpose
Initialize project folder structure to support ROME-based application development through all life-cycle phases. Bootstrap robot creates organized workspace for robot operations, source code, and phase artifacts.

## 1. Project Folder Structure

```
./[project_folder_name]/
├── ROME/                          → Symlink to ROME framework (read-only)
├── .rome-project.json             → Project metadata and phase tracking
│
├── robots/                        → Robot workspaces
│   ├── bootstrap/                → Phase Bootup: Project initialization
│   ├── talib/                    → Phase 1: Analysis (Requirements)
│   ├── pma/                      → Phase 2: Design (Architecture)
│   ├── roma/                     → All phases: Orchestration & Coordination
│   ├── sarah/                    → Phase 2: Design (Quality Gate)
│   ├── clara/                    → Phase 2: Design (UX/UI - optional)
│   ├── charlie/                  → Phase 3: Config (Application layer)
│   └── reena/                    → Phase 3: Config (API layer)
│
├── SOURCE/                        → Application source code and deployables
│   ├── [workspaces]/             → Code workspaces (created after Phase 2)
│   ├── tests/                    → Automated test code
│   └── config/                   → Deployment configuration files
│
└── ARTIFACTS/                     → Phase outputs and non-code deliverables
    ├── 00-bootup/                → Phase Bootup artifacts
    │   └── project-initialization/
    ├── 01-ingest/                → Phase 0: Ingest artifacts
    │   ├── source-materials/     → Original PRD, BRD, notes
    │   └── intake-logs/          → Ingestion traceability
    ├── 02-analysis/              → Phase 1: Analysis artifacts
    │   ├── requirements/         → Atomic requirements documents
    │   ├── data-dictionary/      → Domain term definitions
    │   └── requirement-maps/     → Traceability to source materials
    ├── 03-design/                → Phase 2: Design artifacts
    │   ├── architecture/         → System decomposition, schemas
    │   ├── design-assets/        → Wireframes, mockups, prototypes
    │   ├── data-models/          → ER diagrams, schemas
    │   ├── api-contracts/        → Interface specifications
    │   └── design-decisions/     → Architectural decision records
    ├── 04-config/                → Phase 3: Config artifacts
    │   ├── technical-specs/      → Technical constraints, parameters
    │   ├── environment-config/   → Environment variable definitions
    │   └── scaffolding-plans/    → Code generation instructions
    ├── 05-generation/            → Phase 4: Generation artifacts
    │   ├── generation-logs/      → Code generation traceability
    │   └── validation-reports/   → Quality assurance results
    └── reference/                → Cross-phase reference materials
        ├── research/             → User research, competitive analysis
        ├── meetings/             → Decision records, stakeholder input
        └── templates/            → Project-specific document templates
```

## Folder Purposes

### ROME (Symlink)
- Read-only access to framework foundation documents
- Ensures all robots reference consistent framework definitions
- Does not contain project-specific content

### robots/
- Each robot has isolated workspace
- Contains robot-specific operational files and working state
- `.claude/` subdirectory for Claude Code session configuration
- Robot role definition (CLAUDE.md) copied from framework templates

### SOURCE/
- All executable code, compiled binaries, deployment configs
- Created workspaces align with Phase 2 design system boundaries
- Tests and configuration files deployed with application
- Version controlled and deployed to production

### ARTIFACTS/
- Phase-specific outputs organized by life-cycle stage
- Non-executable deliverables (documents, diagrams, designs)
- Traceability artifacts linking phases together
- Reference materials supporting development decisions
- Version controlled for historical record


## Phase Overview

Bootup is the initialization phase that prepares the project environment for ROME-based application development. The Bootstrap robot operates **independently** of the ROME framework - it runs BEFORE the ROME symlink exists and is responsible for creating it.

**Duration:** Single execution at project start
**Robot:** Bootstrap (operates independently, not from ROME)
**Inputs:** Project name, target path, ROME framework location

### Bootstrap Independence

The Bootstrap robot is unique among ROME robots:
- It runs **before** the ROME symlink exists
- Its CLAUDE.md is **self-contained** with embedded procedures
- It **creates** the ROME symlink that all other robots use
- After bootstrap, ROME is accessed via **read-only** symlink

### Setup Flow

**Option A: Ignite Script (Recommended)**
```bash
./ROME/life-cycle/P00-bootup/ignite_bootstrap-robot.sh <project_name> <project_path>
```
This automates steps 1-3 below and launches Claude Code.

**Option B: Manual Setup**
```
1. Human creates: [project]/robots/bootstrap/
2. Human copies: ROME/robot-templates/bootstrap/CLAUDE.md → [project]/robots/bootstrap/CLAUDE.md
3. Human launches: Claude Code from [project]/robots/bootstrap/
4. Bootstrap creates: Full project structure including ROME symlink
5. Hand off: Roma orchestrator takes over from [project]/robots/roma/
```

## Entry Criteria

Before bootup can proceed:
- [ ] ROME framework accessible at known location
- [ ] Project name defined by sponsor
- [ ] Target project path determined
- [ ] MCP servers available (activity-log, Seez, rome-terminal)
- [ ] Sponsor contact configured in ROME-CFG-001

## Exit Criteria

Bootup is complete when:
- [ ] All folders created per structure specification
- [ ] All 8 robot workspaces initialized
- [ ] ROME symlink functional (read access verified)
- [ ] .rome-project.json created with correct metadata
- [ ] Activity-log database initialized (rome_[project_name])
- [ ] MCP server connectivity verified

## Quality Gates

### Folder Structure Validation

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Project root exists | `test -d $PROJECT_PATH` | Directory exists |
| ROME symlink valid | `test -L $PROJECT_PATH/ROME && test -r $PROJECT_PATH/ROME/foundation/core-principles.md` | Symlink readable |
| All robot dirs exist | Loop check | 8 directories under robots/ |
| ARTIFACTS structure | Loop check | All phase subdirectories exist |
| SOURCE structure | `test -d $PROJECT_PATH/SOURCE` | Directory exists |

### MCP Server Validation

| Server | Test Method | Pass Criteria |
|--------|-------------|---------------|
| activity-log | `mcp__activity-log__list_available_databases` | Returns without error |
| Seez | `mcp__Seez__list_tabs` | Returns without error |
| rome-terminal | `mcp__rome-terminal__list_terminals` | Returns without error |

### Configuration Validation

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| .rome-project.json | JSON parse | Valid JSON, required fields present |
| Sponsor config | Read ROME-CFG-001 | iMessage recipient configured |

## Operational Procedures

**Authoritative Source:** Bootstrap robot CLAUDE.md (ROME-ROBOT-001)

All operational procedures for this phase are embedded in the Bootstrap robot's self-contained CLAUDE.md template. This phase document specifies *what* must be achieved; the robot document specifies *how*.

### Execution Options

| Option | Method | Use Case |
|--------|--------|----------|
| **A (Recommended)** | `ignite_bootstrap-robot.sh` | Interactive bootstrap with Claude Code |
| **B** | Manual copy + Claude Code | When ignite script unavailable |

See **Setup Flow** in Phase Overview above for details.

### Procedure Reference

The Bootstrap robot executes these steps (defined in ROME-ROBOT-001):

1. **Create Project Structure** - folders, symlink, .rome-project.json
2. **Initialize Activity-Log** - database and PHASE-0 entry
3. **Verify MCP Connectivity** - activity-log, Seez, rome-terminal
4. **Notify Sponsor** - Terminal Notifier completion message
5. **Complete Phase** - update status, hand off to Roma

## Outputs

| Output | Location | Description |
|--------|----------|-------------|
| Project folder | `[project_path]/` | Root project directory |
| ROME symlink | `[project_path]/ROME/` | Read-only framework access |
| Project metadata | `[project_path]/.rome-project.json` | Phase tracking, config |
| Robot workspaces | `[project_path]/robots/*/` | 8 robot directories |
| Source placeholder | `[project_path]/SOURCE/` | For generated code |
| Artifacts structure | `[project_path]/ARTIFACTS/` | Phase output folders |
| Activity-log DB | MongoDB: `rome_[project_name]` | Activity tracking |

## Activity Logging Requirements

All robots operating in this phase MUST follow the Activity Logging Protocol defined in:
- **ROME-PROC-005**: `/ROME/robot-templates/robot-operations-protocols/activity-logging-protocol.md`

### Phase-Specific Logging

- Create PHASE-0 entry when bootup begins
- Log completion status for each setup step
- Update PHASE-0 to COMPLETED when all validation passes
- Log any blockers (missing dependencies, MCP failures)

## Sponsor Interaction

Minimal sponsor interaction during bootup:
- **Notification only:** Completion notification via Terminal Notifier
- **No approvals required:** Bootup is automated/mechanical
- **Reference:** ROME-PROC-002 (Sponsor Interaction Protocol)

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-11-20T00:00:00Z | Initial phase specification placeholder |
| 1.0 | 2025-11-21T00:00:00Z | Complete phase specification with bootstrap independence model |
| 1.1 | 2025-11-21T00:00:00Z | Refactored procedures to reference ROME-ROBOT-001 (reduced duplication) |
