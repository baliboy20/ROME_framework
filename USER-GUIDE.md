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

# 2. Launch Bootstrap agent
# Open: my-app/ROME/rome-p0-bootup/agents/bootstrap/AGENT.md
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

# 2. Bootstrap will create symlink to shared ROME
# Open: /path/to/ROME/rome-p0-bootup/agents/bootstrap/AGENT.md
```

**Use for:** Framework development, quick prototyping, shared ROME installation

**Note:** Bootstrap auto-detects mode (checks if `ROME/` exists before creating symlink)

---[USER-GUIDE.md](USER-GUIDE.md)

## Phase Workflow

ROME uses a 6-phase workflow from requirements to working code:

### P0: Bootstrap
**Agent:** Bootstrap
**Purpose:** Initialize project structure
**Location:** `ROME/robot-plugins/bootstrap/ROBOT.md` (mode: P0-bootup)

**How to use:** Open AGENT.md file in Claude Code, it will load agent context

**When:** Start of every new project

---

### P1: AORDL Requirements
**Agent:** Talib (P1 mode)
**Purpose:** Capture structured requirements in AORDL format
**Location:** `ROME/robot-plugins/talib/ROBOT.md` (mode: P1-aordl)

**Skills available:**
- `create-aordl-requirement` - Create new AORDL requirement
- `validate-aordl` - Validate AORDL syntax
- `transform-aordl-to-bdd` - Convert to BDD format

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
**Agent:** Talib (P2 mode)
**Purpose:** Decompose requirements, extract entities, identify dependencies
**Location:** `ROME/robot-plugins/talib/ROBOT.md` (mode: P2-analysis)

**Skills available:**
- `analyze-requirement` - Analyze single requirement
- `batch-analyze-requirements` - Analyze all requirements
- `generate-user-stories` - Generate user stories

**Input:** AORDL requirements from P1
**Output:** Analysis artifacts, entity models, user stories

---

### P3: Design
**Agents:** PMA (architecture), Clara (validation)
**Purpose:** Design system architecture, technical specs, data models
**Locations:**
- PMA: `ROME/robot-plugins/pma/ROBOT.md` (mode: P3-design)
- Clara: `ROME/robot-plugins/clara/ROBOT.md` (mode: P3-design)

**Skills available:**
- `design-api-controllers`, `design-dto-models`
- `design-authentication`, `design-component-structure`
- `generate-architecture-diagram`

**Input:** Analysis from P2
**Output:** Architecture docs, API specs, data dictionary, component designs

**Key artifacts:**
- Architecture diagrams
- API specifications
- Data dictionary
- Component structure
- Authentication design

---

### P4: Configuration
**Agent:** Lucien
**Purpose:** Configure workspace, build system, CI/CD
**Location:** `ROME/robot-plugins/lucien/ROBOT.md` (mode: P4-config)

**Skills available:**
- `scaffold-workspace` - Create project scaffolding
- `configure-build-system` - Configure environment
- `setup-cicd-pipeline` - Setup CI/CD

**Input:** Designs from P3
**Output:** Configured workspace, build config, test framework

**Lucien creates:**
- Project structure
- Build configuration
- Test framework setup
- Environment configs
- CI/CD pipelines

---

### P5: Code Generation
**Agents:** Ashok (backend), Reena (frontend), Charlie (integration)
**Purpose:** Generate production code in parallel

**Locations:**
- Ashok: `ROME/robot-plugins/ashok/ROBOT.md` (mode: P5-generation)
- Reena: `ROME/robot-plugins/reena/ROBOT.md` (mode: P5-generation)
- Charlie: `ROME/robot-plugins/charlie/ROBOT.md` (mode: P5-generation)

**Backend (Ashok):**
- API endpoints, database models, auth middleware, business logic

**Frontend (Reena):**
- UI components, screens, state management, API integration

**Integration (Charlie):**
- API client code, end-to-end tests, integration tests

**Input:** Configuration from P4
**Output:** Working application code

---

### QA: Quality Assurance
**Agent:** Sarah
**Purpose:** Validate deliverables, enforce quality gates
**Location:** `ROME/robot-plugins/sarah/ROBOT.md` (phase-agnostic validator)
**Authority:** APPROVE or BLOCK phase transitions

**Sarah validates:**
- AORDL structure (P1→P2 gate)
- Requirements coverage (P2→P3 gate)
- Design completeness (P3→P4 gate)
- Data dictionary (P3→P4 gate)
- Traceability (all phases)

**Skills available:**
- `quality-gate-p2`, `quality-gate-p3`
- `validate-aordl-structure`, `validate-data-dictionary`
- `verify-traceability`

**Quality Gates:** Sarah must APPROVE before moving to next phase

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

## Agent Quick Reference

| Agent | Phase | Use For |
|-------|-------|---------|
| Bootstrap | P0 | Project initialization |
| Talib | P1 | AORDL requirements capture |
| Talib | P2 | Requirements analysis |
| PMA | P3 | Architecture & design |
| Clara | P3 | Design validation |
| Lucien | P4 | Workspace configuration |
| Ashok | P5 | Backend code generation |
| Reena | P5 | Frontend code generation |
| Charlie | P5 | Integration code |
| Roma | All | Orchestration (advanced) |
| Sarah | QA | Quality gates & validation |

---

## Essential Skills

**P1 Skills:**
- `create-aordl-requirement` - Author new requirement
- `validate-aordl` - Check AORDL syntax
- `transform-aordl-to-bdd` - Convert to BDD

**P2 Skills:**
- `analyze-requirement` - Decompose requirement
- `batch-analyze-requirements` - Analyze multiple

**P3 Skills:**
- `design-dto-models` - Design data models
- `design-api-controllers` - Design APIs
- `design-authentication` - Design auth system
- `design-component-structure` - Design UI components

**P4 Skills:**
- `scaffold-workspace` - Create project structure
- `configure-build-system` - Setup build tools
- `setup-test-framework` - Configure testing

**P5 Skills:**
- `generate-api-endpoints` - Generate backend APIs
- `generate-ui-components` - Generate frontend UI
- `generate-database-schema` - Generate DB schema

**QA Skills:**
- `quality-gate-p2` - Validate P1→P2 transition
- `quality-gate-p3` - Validate P2→P3 transition
- `verify-traceability` - Check requirement traceability

---

## Typical Session Flow

**Day 1: Requirements**
```bash
# Launch Claude Code in your project directory

# P0: Open Bootstrap robot
# Open: ROME/robot-plugins/bootstrap/ROBOT.md
# Bootstrap creates initial project structure

# P1: Open Talib (P1 mode)
# Open: ROME/robot-plugins/talib/ROBOT.md (loads P1-aordl mode)
# Work with Talib to create AORDL files in ARTIFACTS/_requirements/

# Talib validates AORDL as you create them
```

**Day 2: Analysis & Design**
```bash
# P2: Open Talib (P2 mode)
# Open: ROME/robot-plugins/talib/ROBOT.md (loads P2-analysis mode)
# Talib analyzes requirements in ARTIFACTS/_requirements/

# P3: Open PMA for architecture
# Open: ROME/robot-plugins/pma/ROBOT.md (loads P3-design mode)
# PMA creates architecture & designs

# Open Clara for validation
# Open: ROME/robot-plugins/clara/ROBOT.md (loads P3-design mode)
# Clara validates design completeness
```

**Day 3: Configuration & Code**
```bash
# P4: Open Lucien
# Open: ROME/robot-plugins/lucien/ROBOT.md (loads P4-config mode)
# Lucien configures workspace

# P5: Open generation robots (can work in parallel Claude sessions)
# Open: ROME/robot-plugins/ashok/ROBOT.md    (Backend, P5-generation mode)
# Open: ROME/robot-plugins/reena/ROBOT.md    (Frontend, P5-generation mode)
# Open: ROME/robot-plugins/charlie/ROBOT.md  (Integration, P5-generation mode)

# QA: Open Sarah for validation
# Open: ROME/robot-plugins/sarah/ROBOT.md (phase-agnostic validator)
```

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

**Roma:** Master orchestrator for complex workflows
**Location:** `ROME/robot-plugins/roma/ROBOT.md` (phase-agnostic orchestrator)

**Use Roma for:**
- Multi-requirement projects
- Complex phase coordination
- Custom workflow automation
- Cross-phase orchestration

**How to use:** Open Roma's AGENT.md file in Claude Code

Roma coordinates all agents and manages phase transitions automatically.

---

## Setup Options

**Recommended: Copy Entire ROME Framework**

```bash
# Copy complete framework into project
mkdir my-project
cp -r /path/to/ROME my-project/
cd my-project
# Open agents from: my-project/ROME/rome-*/agents/
```

**Benefits:**
- Self-contained, portable project
- Framework version locked (stable)
- No external dependencies
- Production-ready

**Alternative: Symlink Mode**

```bash
# Bootstrap creates symlink to shared ROME
mkdir my-project
cd my-project
# Bootstrap will create: my-project/ROME -> /path/to/ROME
# Open agents from: my-project/ROME/rome-*/agents/
```

**Benefits:**
- Single ROME installation
- Automatic framework updates
- Useful for framework development

**See:** Bootstrap agent (`ROME/rome-p0-bootup/agents/bootstrap/AGENT.md`) for auto-detection details

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
1. Bootstrap (P0)      → Project structure
2. AORDL (P1)          → Structured requirements
3. Analysis (P2)       → Decomposed requirements
4. Design (P3)         → Architecture & specs
5. Configuration (P4)  → Workspace setup
6. Generation (P5)     → Working code
7. QA (Sarah)          → Quality validation
```

**Key principle:** Each phase builds on previous phase outputs. Sarah validates transitions.

---

**Need help?** See `PLUGIN-MANIFEST.md` for complete agent/skill reference.
