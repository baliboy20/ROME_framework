# ROME Framework User Guide

**Quick reference for building applications with ROME**

---

## Quick Start

**Recommended Setup: Copy ROME into Project**

```bash
# 1. Create project and copy ROME framework
mkdir my-app
cp -r /path/to/ROME my-app/
cd my-app

# 2. Navigate to P0 bootstrap phase
cd ROME/rome-p0-bootup
# SessionStart hook auto-loads Roma (Project Manager)
# Roma initializes project structure
```

**Why copy?**
- **Version isolated:** Framework locked at project creation
- **Portable:** Self-contained, no external dependencies
- **Stable:** Framework updates won't break your project
- **Production-ready:** Can move/archive project independently

**Alternative: Symlink Mode (Framework Development)**

```bash
# 1. Create project directory
mkdir my-app
cd my-app

# 2. Navigate to shared ROME framework
cd /path/to/ROME/rome-p0-bootup
# SessionStart hook auto-loads Roma
```

**Use for:** Framework development, quick prototyping, shared ROME installation

**How It Works:**
- Navigate to phase directory → SessionStart hook fires → Robot auto-loads
- No manual file opening required
- Robot context = ROBOT.md + phase-specific mode file

---[USER-GUIDE.md](USER-GUIDE.md)

## Phase Workflow

ROME uses a 6-phase workflow from requirements to working code:

### P0: Bootstrap
**Robot:** Roma (Project Manager & Orchestrator)
**Purpose:** Initialize project structure
**How to start:** Navigate to `ROME/rome-p0-bootup/`

```bash
cd ROME/rome-p0-bootup
# SessionStart hook auto-loads Roma in P0-bootup mode
```

**When:** Start of every new project

**What Roma does:**
- Creates ARTIFACTS/ directory structure
- Initializes activity log
- Creates project metadata files
- Prepares for P1 requirements capture

---

### P1: AORDL Requirements
**Robot:** Talib (Requirements Analyst)
**Purpose:** Capture structured requirements in AORDL format
**How to start:** Navigate to `ROME/rome-p1-aordl/`

```bash
cd ROME/rome-p1-aordl
# SessionStart hook auto-loads Talib in P1-aordl mode
```

**Skills available** (from `robot-plugins/talib/skills/`):
- `/create-aordl-requirement` - Create new AORDL requirement
- `/validate-aordl` - Validate AORDL syntax
- `/transform-aordl-to-bdd` - Convert to BDD format

**Input:** User needs, PRD, BRD
**Output:** `ARTIFACTS/_requirements/aordl/*.yaml` (AORDL files)

**Example AORDL:**
```yaml
REQ-001:
  title: User Login
  actor: User
  action: Login
  object: System
  context: Web application
  ...13 required fields total
```

---

### P2: Analysis
**Robot:** Talib (Requirements Analyst)
**Purpose:** Decompose requirements, extract entities, identify dependencies
**How to start:** Navigate to `ROME/rome-p2-analysis/`

```bash
cd ROME/rome-p2-analysis
# SessionStart hook auto-loads Talib in P2-analysis mode
```

**Skills available** (from `robot-plugins/talib/skills/`):
- `/analyze-requirement` - Analyze single requirement
- `/batch-analyze-requirements` - Analyze all requirements
- `/generate-user-stories` - Generate user stories

**Input:** AORDL requirements from P1
**Output:** Analysis artifacts, entity models, user stories

---

### P3: Design
**Robot:** PMA (Principal Metadata Architect)
**Purpose:** Design system architecture, technical specs, data models
**How to start:** Navigate to `ROME/rome-p3-design/`

```bash
cd ROME/rome-p3-design
# SessionStart hook auto-loads PMA in P3-design mode
```

**Skills available** (from `robot-plugins/pma/skills/`):
- `/design-api-controllers`, `/design-dto-models`
- `/design-authentication`, `/design-component-structure`
- `/generate-architecture-diagram`
- `/generate-work-breakdown` - Creates actionlist.md for P5

**Input:** Analysis from P2
**Output:** Architecture docs, API specs, data dictionary, **actionlist.md**

**Key artifacts:**
- `data-dictionary.yaml` - All entities, fields, relationships
- `api-design.md` - API contracts (endpoints, requests, responses)
- `tech-stack.yaml` - Technology decisions
- `actionlist.md` - Work breakdown by robot for P5
- Architecture diagrams

---

### P4: Configuration
**Robot:** Lucien (DevOps & Environment Specialist)
**Purpose:** Configure workspace, build system, CI/CD
**How to start:** Navigate to `ROME/rome-p4-config/`

```bash
cd ROME/rome-p4-config
# SessionStart hook auto-loads Lucien in P4-config mode
```

**Skills available** (from `robot-plugins/lucien/skills/`):
- `/scaffold-workspace` - Create project scaffolding
- `/configure-build-system` - Configure environment
- `/setup-cicd-pipeline` - Setup CI/CD

**Input:** Designs from P3
**Output:** Configured workspace, build config, test framework

**Lucien creates:**
- `SOURCE/` directory structure
- Package files (package.json, requirements.txt, etc.)
- Build configuration
- Test framework setup
- Environment configs (dev, staging, prod)
- CI/CD pipelines

---

### P5: Code Generation (Parallel Execution)
**Robots:** Ashok (Database), Reena (Backend API), Charlie (Frontend UI)
**Purpose:** Generate production code in parallel with automatic dependency coordination
**How to start:** Navigate to `ROME/rome-p5-generation/`

```bash
cd ROME/rome-p5-generation
# SessionStart hook auto-loads Ashok (primary robot)
# Displays available robots and commands
```

**Dependency Chain:** Ashok → Reena → Charlie

**Database Layer (Ashok):**
- Database schema (DDL)
- Migrations (version-controlled)
- ORM models
- Seed data
- **No dependencies** - starts immediately

**Backend API Layer (Reena):**
- API endpoints (RESTful)
- Business logic / service layer
- Authentication middleware
- Validation middleware
- **Depends on Ashok** - waits for database layer completion

**Frontend UI Layer (Charlie):**
- Screens/pages
- UI components
- State management
- API integration
- **Depends on Reena** - waits for backend API completion

**Input:** Configuration from P4, actionlist.md from P3
**Output:** Working application code across all three layers

#### Working with Multiple Robots in P5

**Option 1: Sequential (Single Terminal)**

Switch between robots as you complete each layer:

```bash
cd ROME/rome-p5-generation
# Ashok auto-loads (database layer)
# ... work with Ashok to complete database layer ...

# Switch to Reena after Ashok completes
bash commands/switch-robot.sh reena
# ... work with Reena to complete backend API ...

# Switch to Charlie after Reena completes
bash commands/switch-robot.sh charlie
# ... work with Charlie to complete frontend UI ...
```

**Option 2: Parallel (Multiple Terminals)**

Run all three robots simultaneously with automatic coordination:

```bash
# Terminal 1: Ashok (Database)
cd ROME/rome-p5-generation
bash commands/switch-robot.sh ashok
# Ashok starts immediately, generates database layer

# Terminal 2: Reena (Backend API)
cd ROME/rome-p5-generation
bash commands/switch-robot.sh reena
# Reena checks: is Ashok complete? If yes, proceed. If no, wait.

# Terminal 3: Charlie (Frontend UI)
cd ROME/rome-p5-generation
bash commands/switch-robot.sh charlie
# Charlie checks: is Reena complete? If yes, proceed. If no, wait.
```

**Automatic Dependency Coordination:**

Robots check activity log before starting:
- Reena queries: "Is Ashok done with all database features?"
- Charlie queries: "Is Reena done with all API features?"
- If dependencies not met → robot waits
- If dependencies satisfied → robot proceeds automatically

**Monitor Progress:**

```bash
bash commands/rome-p5-status.sh
# Shows completion status for all three robots
```

**Launch All Robots:**

```bash
bash commands/rome-p5-parallel-generate.sh
# Provides instructions for multi-terminal setup
```

---

### QA: Quality Assurance
**Robot:** Sarah (QA Validator & Quality Gatekeeper)
**Purpose:** Validate deliverables, enforce quality gates
**How to start:** Navigate to `ROME/rome-qa/`
**Authority:** APPROVE or BLOCK phase transitions

```bash
cd ROME/rome-qa
# SessionStart hook auto-loads Sarah in QA-validator mode
```

**Sarah validates:**
- GATE-P1: AORDL structure validation
- GATE-P2: Analysis → Design (8-dimension coverage)
- GATE-P3: Design → Config (100% requirements coverage)
- GATE-P4: Config → Generation (configuration completeness)
- GATE-P5: Generation → Delivery (implementation completeness)

**Skills available** (from `robot-plugins/sarah/skills/`):
- `/quality-gate-p2`, `/quality-gate-p3`
- `/validate-aordl-structure`, `/validate-data-dictionary`
- `/validate-requirements-coverage`, `/verify-traceability`

**Quality Gates:** Sarah must APPROVE before moving to next phase

**Sarah's Authority:** Phase transitions BLOCK without Sarah APPROVAL

---

## Common Patterns

### Pattern 1: New Feature
```bash
1. Create AORDL requirement (Talib P1)
2. Analyze requirement (Talib P2)
3. Design feature (PMA + Clara)
4. Generate code (Ashok/Reena/Charlie)
5. Sarah validates at each gate
```

### Pattern 2: Multiple Requirements
```bash
1. Create all AORDL files (Talib P1)
2. Batch analyze (Talib P2 with batch-analyze skill)
3. Design system (PMA)
4. Clara validates designs
5. Lucien configures workspace
6. Parallel generation (all P5 agents)
```

### Pattern 3: Iterative Development
```bash
1. Start with core requirements
2. Complete P0→P5 for MVP
3. Add new requirements (back to P1)
4. Incremental P2→P5 for additions
```

---

## Robot Quick Reference

| Robot | Phase | Use For | Navigate To |
|-------|-------|---------|-------------|
| Roma | P0 | Project initialization & orchestration | `rome-p0-bootup/` |
| Talib | P1 | AORDL requirements capture | `rome-p1-aordl/` |
| Talib | P2 | Requirements analysis | `rome-p2-analysis/` |
| PMA | P3 | Architecture & design | `rome-p3-design/` |
| Lucien | P4 | Workspace configuration | `rome-p4-config/` |
| Ashok | P5 | **Database layer** code generation | `rome-p5-generation/` |
| Reena | P5 | **Backend API** code generation | `rome-p5-generation/` |
| Charlie | P5 | **Frontend UI** code generation | `rome-p5-generation/` |
| Sarah | QA | Quality gates & validation | `rome-qa/` |

**Note:** Navigate to phase directory → SessionStart hook auto-loads robot

---

## Essential Skills (ROME-PROP-020)

**Skills live in robot-plugins/** - Each robot owns their capabilities

**Talib Skills** (`robot-plugins/talib/skills/`):
- `/create-aordl-requirement` - Author new requirement (P1)
- `/validate-aordl` - Check AORDL syntax (P1)
- `/transform-aordl-to-bdd` - Convert to BDD (P1)
- `/analyze-requirement` - Decompose requirement (P2)
- `/batch-analyze-requirements` - Analyze multiple (P2)
- `/generate-user-stories` - Create user stories (P2)

**PMA Skills** (`robot-plugins/pma/skills/`):
- `/design-dto-models` - Design data models
- `/design-api-controllers` - Design APIs
- `/design-authentication` - Design auth system
- `/generate-work-breakdown` - Create actionlist.md
- `/generate-architecture-diagram` - Create architecture docs

**Lucien Skills** (`robot-plugins/lucien/skills/`):
- `/scaffold-workspace` - Create project structure
- `/configure-build-system` - Setup build tools
- `/setup-test-framework` - Configure testing
- `/setup-cicd-pipeline` - Configure CI/CD

**Ashok Skills** (`robot-plugins/ashok/skills/`):
- `/generate-database-schema` - Generate DB schema
- `/generate-migrations` - Generate migrations
- `/generate-orm-models` - Generate ORM models
- `/generate-seed-data` - Generate seed data

**Reena Skills** (`robot-plugins/reena/skills/`):
- `/generate-api-endpoints` - Generate backend APIs
- `/generate-authentication-middleware` - Generate auth

**Charlie Skills** (`robot-plugins/charlie/skills/`):
- `/generate-ui-screens` - Generate UI screens
- `/generate-ui-components` - Generate UI components

**Sarah Skills** (`robot-plugins/sarah/skills/`):
- `/quality-gate-p2` - Validate P1→P2 transition
- `/quality-gate-p3` - Validate P2→P3 transition
- `/verify-traceability` - Check requirement traceability
- `/validate-aordl-structure` - Validate AORDL format
- `/validate-data-dictionary` - Validate data dictionary

---

## Typical Session Flow (ROME-PROP-019)

**Day 1: Project Setup & Requirements**
```bash
# Launch Claude Code in your project directory

# P0: Navigate to bootup phase
cd ROME/rome-p0-bootup
# SessionStart hook auto-loads Roma
# Roma creates initial project structure

# P1: Navigate to AORDL phase
cd ../rome-p1-aordl
# SessionStart hook auto-loads Talib in P1-aordl mode
# Work with Talib to create AORDL files in ARTIFACTS/_requirements/
# Talib validates AORDL as you create them

# Request Sarah validation
cd ../rome-qa
# SessionStart hook auto-loads Sarah
# Sarah validates GATE-P1, approves P1→P2 transition
```

**Day 2: Analysis & Design**
```bash
# P2: Navigate to analysis phase
cd ROME/rome-p2-analysis
# SessionStart hook auto-loads Talib in P2-analysis mode
# Talib analyzes requirements, generates user stories

# Request Sarah validation
cd ../rome-qa
# Sarah validates GATE-P2, approves P2→P3 transition

# P3: Navigate to design phase
cd ../rome-p3-design
# SessionStart hook auto-loads PMA in P3-design mode
# PMA creates architecture, data dictionary, API design, actionlist.md

# Request Sarah validation
cd ../rome-qa
# Sarah validates GATE-P3, approves P3→P4 transition
```

**Day 3: Configuration**
```bash
# P4: Navigate to config phase
cd ROME/rome-p4-config
# SessionStart hook auto-loads Lucien in P4-config mode
# Lucien scaffolds workspace, configures build system

# Request Sarah validation
cd ../rome-qa
# Sarah validates GATE-P4, approves P4→P5 transition
```

**Day 4-5: Code Generation (Parallel)**
```bash
# P5: Navigate to generation phase
cd ROME/rome-p5-generation
# SessionStart hook auto-loads Ashok (database layer)

# Option 1: Sequential - switch robots as you complete layers
# ... work with Ashok to complete database ...
bash commands/switch-robot.sh reena
# ... work with Reena to complete backend API ...
bash commands/switch-robot.sh charlie
# ... work with Charlie to complete frontend UI ...

# Option 2: Parallel - use multiple terminals
# Terminal 1: Ashok (database) - starts immediately
# Terminal 2: Reena (backend) - waits for Ashok via activity log
# Terminal 3: Charlie (frontend) - waits for Reena via activity log

# Monitor progress
bash commands/rome-p5-status.sh

# Request final validation
cd ../rome-qa
# Sarah validates GATE-P5, approves project delivery
```

---

## P5 Phase Commands (ROME-PROP-021)

When working in `rome-p5-generation/`, you have access to multi-robot orchestration commands:

### Switch Between Robots

```bash
bash commands/switch-robot.sh <robot-name>

# Examples:
bash commands/switch-robot.sh ashok    # Database Layer
bash commands/switch-robot.sh reena    # Backend API
bash commands/switch-robot.sh charlie  # Frontend UI
```

**What it does:**
- Unloads current robot context
- Loads specified robot's ROBOT.md + P5-generation.md
- Shows dependency reminders (e.g., "Reena depends on Ashok")

### Launch Parallel Generation

```bash
bash commands/rome-p5-parallel-generate.sh
```

**What it does:**
- Provides instructions for multi-terminal setup
- Explains dependency chain (Ashok → Reena → Charlie)
- Shows how to monitor progress

### Check Progress

```bash
bash commands/rome-p5-status.sh
```

**What it does:**
- Shows completion status for all three robots
- Queries activity log for each robot's work items
- Displays overall progress percentage

### Automatic Dependency Coordination

**How Robots Check Dependencies:**

Reena automatically checks if Ashok is complete:
```javascript
// Reena's Step 2 in P5-generation mode
const ashokStatus = await mcp__activity_log__query({
  robot: "ashok",
  phase: "P5-generation"
});

if (ashokStatus has pending items) {
  console.log("⏳ Waiting for Ashok to complete database layer...");
  // WAIT - do not proceed
} else {
  console.log("✅ Ashok complete - starting API generation");
  // PROCEED
}
```

Charlie automatically checks if Reena is complete:
```javascript
// Charlie's Step 2 in P5-generation mode
const reenaStatus = await mcp__activity_log__query({
  robot: "reena",
  phase: "P5-generation"
});

if (reenaStatus has pending items) {
  console.log("⏳ Waiting for Reena to complete API layer...");
  // WAIT
} else {
  console.log("✅ Reena complete - starting UI generation");
  // PROCEED
}
```

**No manual coordination required** - robots automatically wait for dependencies.

---

## File Structure

```
my-app/
├── _user_input/            # User-provided materials
│   └── raw-requirements/
├── ARTIFACTS/
│   ├── _requirements/      # P1: AORDL requirements
│   │   ├── REQ-001.yaml
│   │   └── REQ-002.yaml
│   ├── _analysis/          # P2: Analysis artifacts
│   │   └── entities.md
│   ├── _design/            # P3: Design docs
│   │   ├── architecture.md
│   │   ├── api-spec.yaml
│   │   └── data-dictionary.md
│   └── _config/            # P4: Configuration
│       └── workspace-config.yaml
└── SOURCE/
    ├── src/                # P5: Generated code
    │   ├── backend/
    │   ├── frontend/
    │   └── integration/
    └── tests/              # P5: Generated tests
```

---

## Project Tracking & Governance

### Activity Logging

All robot work is automatically tracked:

**Activity Log:**
- Location: `ARTIFACTS/activity-log.txt`
- Format: Event stream (TIMESTAMP | TYPE | ID | ATTRIBUTES)
- Tracks: Phase transitions, work items, blockers, amendments

**Activity State:**
- Location: `ARTIFACTS/activity-state.yaml`
- Purpose: Current state snapshot (rebuilt from log)
- Queries: by_status, by_robot, by_phase

**How it works:**
- Robots use MCP server (`activity-log-file`) to append events
- State file auto-rebuilds on each append
- No manual editing required

### Robot Workspaces

Each robot has an isolated workspace for working documents:

```
robots/<robot_name>/
  ├── CLAUDE.md           # Role definition (loaded by Claude Code)
  ├── .claude/            # Claude Code settings
  └── notes/              # Working documents (ephemeral)
      ├── current_work.md # Active work tracking
      ├── completed.md    # Session notes
      └── blockers.md     # Issues encountered
```

**Working Documents vs Formal Artifacts:**
- **Working docs** (`robots/*/notes/`): Scratch analysis, drafts, personal notes (not version controlled)
- **Formal artifacts** (`ARTIFACTS/`): Phase deliverables, validated outputs (version controlled)

**Rule:** Draft in `notes/`, promote to `ARTIFACTS/` when validated and ready for downstream phases.

**Reference:** ROME-GOV-BASELINE (robot-baseline.md) - Working Documents vs Formal Artifacts section

### Project Configuration

Bootstrap creates project metadata:

**`.rome-project.json`:**
```json
{
  "projectName": "my-app",
  "createdAt": "2026-01-08T00:00:00Z",
  "romeVersion": "10",
  "currentPhase": "P01-ingest",
  "phaseStatus": {
    "P00-bootup": "COMPLETED",
    "P01-ingest": "IN_PROGRESS",
    "P02-analysis": "NOT_STARTED",
    "P03-design": "NOT_STARTED",
    "P04-config": "NOT_STARTED",
    "P05-generation": "NOT_STARTED"
  }
}
```

**Purpose:**
- Project identification
- Phase status tracking
- ROME version compatibility

### Governance Documents

Key framework documents for understanding robot behavior:

- **ROME-GOV-BASELINE** (`robot-baseline.md`): Common rules all robots follow
- **ROME-GOV-006** (`sponsor-interaction.md`): When/how robots ask questions
- **ROME-PROC-005** (`activity-logging-protocol.md`): Activity tracking requirements
- **ROME-PRIN-001** (`core-principles.md`): Framework principles

**Location:** `ROME/rome-core/docs/governance/` and `ROME/rome-core/docs/foundation/`

---

## AORDL Quick Reference

**Required Fields (13):**
1. `title` - Requirement name
2. `actor` - Who performs action
3. `action` - What they do
4. `object` - What's acted upon
5. `context` - Where/when
6. `rationale` - Why needed
7. `outcome` - Expected result
8. `constraints` - Limitations
9. `dependencies` - Related requirements
10. `priority` - Importance (P0-P3)
11. `acceptance-criteria` - Success conditions
12. `test-scenarios` - How to test
13. `metadata` - UID, version, status

**Validation:** Use Talib P1's `validate-aordl` skill before moving to P2

---

## Quality Gates

Sarah enforces these gates:

**P1→P2:** AORDL structure valid
**P2→P3:** Requirements analyzed, entities extracted
**P3→P4:** Design complete, data dictionary exists
**P4→P5:** Workspace configured, build system ready
**P5→Done:** Code generated, tests pass, traceability verified

**Sarah's authority:** APPROVE or BLOCK (no bypass)

---

## Troubleshooting

**AORDL validation fails**
→ Check all 13 required fields present
→ Use Talib P1's `validate-aordl` skill on the file

**Sarah blocks phase transition**
→ Read Sarah's feedback (specific issues)
→ Fix identified gaps
→ Re-invoke Sarah for approval

**Missing design artifacts**
→ Run Clara validation
→ PMA creates missing docs
→ Clara re-validates

**Code generation incomplete**
→ Check P4 configuration complete
→ Verify Lucien created scaffolding manifest
→ Re-run P5 agents with manifest

---

## Advanced: Roma Orchestrator

**Roma:** Project Manager & Master Orchestrator
**Purpose:** Complex workflow coordination, phase management
**How to start:** Navigate to `ROME/rome-p0-bootup/` or `ROME/rome-core/`

```bash
cd ROME/rome-p0-bootup
# SessionStart hook auto-loads Roma in P0-bootup mode
```

**Use Roma for:**
- Project initialization (P0)
- Multi-requirement projects
- Complex phase coordination
- Custom workflow automation
- Cross-phase orchestration

Roma coordinates all robots and manages phase transitions automatically.

**Roma's authority:**
- Creates work breakdown (actionlist.md) in P3
- Assigns features to robots
- Monitors overall project progress
- Coordinates phase transitions

---

## Setup Options

**Recommended: Copy Entire ROME Framework**

```bash
# Copy complete framework into project
mkdir my-project
cp -r /path/to/ROME my-project/
cd my-project

# Start with P0 bootup
cd ROME/rome-p0-bootup
# SessionStart hook auto-loads Roma
```

**Benefits:**
- Self-contained, portable project
- Framework version locked (stable)
- No external dependencies
- Production-ready

**Alternative: Symlink Mode**

```bash
# Use shared ROME installation
mkdir my-project
cd my-project

# Navigate to shared ROME
cd /path/to/ROME/rome-p0-bootup
# SessionStart hook auto-loads Roma
# Roma can create symlink if needed
```

**Benefits:**
- Single ROME installation
- Automatic framework updates
- Useful for framework development

**How SessionStart Hooks Work:**
- Navigate to phase directory (e.g., `cd rome-p1-aordl`)
- `.claude/settings.json` defines SessionStart hook
- Hook executes: `cat robot-plugins/{robot}/ROBOT.md && cat robot-plugins/{robot}/modes/{mode}.md`
- Robot context auto-loads (no manual file opening)

---

## Documentation

- `INSTALLATION-GUIDE.md` (ROME-INSTALL-001) - Future installation system (aspirational)
- `PLUGIN-MANIFEST.md` (ROME-MANIFEST-001) - Complete plugin/agent/skill catalog
- `TESTING.md` - Testing procedures
- `ROME/rome-core/docs/` - Framework internals (for developers)
- `ROME_framework_maintenance/archive/GETTING-STARTED-GUIDE.md` (ROME-GUIDE-001) - Legacy guide

---

## Summary: Requirements → Code

```
1. Bootup (P0)         → Project structure (Roma)
2. AORDL (P1)          → Structured requirements (Talib)
3. Analysis (P2)       → User stories & entities (Talib)
4. Design (P3)         → Architecture, API, data models, actionlist (PMA)
5. Configuration (P4)  → Workspace setup (Lucien)
6. Generation (P5)     → Working code (Ashok → Reena → Charlie)
7. QA (Sarah)          → Quality gates at each transition
```

**Key principles:**
- **Phase navigation** → SessionStart hook auto-loads robot
- **Skills in robots** → Capabilities live in robot-plugins/*/skills/
- **Phase plugins orchestrate** → Declare robots, dependencies, workflows
- **Parallel execution** → P5 robots coordinate via activity log
- **Quality gates** → Sarah must approve each phase transition
- **Each phase builds on previous** → Outputs become inputs

---

**Need help?** See `PLUGIN-MANIFEST.md` for complete agent/skill reference.
