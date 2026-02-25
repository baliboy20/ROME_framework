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

---

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

**What Roma does:**
- Creates ARTIFACTS/ directory structure
- Initializes activity log
- Creates project metadata files
- Prepares for P1 requirements capture

---

### P1: AORDL Requirements
**Robot:** Talib (Requirements Engineer)
**Purpose:** Capture structured requirements in AORDL format
**How to start:** Navigate to `ROME/rome-p1-aordl/`

```bash
cd ROME/rome-p1-aordl
# SessionStart hook auto-loads Talib in P1-aordl mode
```

**MANDATORY FIRST ACTION:** Log phase start with `/log-phase-start --phase P1 --robot talib`

**Skills available** (from `robot-plugins/talib/skills/`):
- `/log-phase-start` - Log phase start (MANDATORY)
- `/create-aordl-requirement` - Create new AORDL requirement
- `/validate-aordl` - Validate AORDL structure
- `/transform-aordl-to-bdd` - Convert to BDD format
- `/log-phase-complete` - Log phase completion (MANDATORY before GATE-P1)

**Input:** User needs, PRD, BRD
**Output:** `ARTIFACTS/_requirements/REQ-###.yaml` (AORDL files)

**AORDL Required Fields (13):**

```yaml
ID: REQ-001
Actor: ProjectManager              # Specific role (not "User")
Intent: create project              # Single atomic verb + object
Preconditions:                      # Required state before action
  - Actor is authenticated
Conditions:                         # Constraints during action
  - Project name must be unique
Postconditions:                     # Guaranteed state after
  - Project record exists
Outcomes:                           # Observable results
  - Project visible in project list
Invariants:                         # Domain truths that never change
  - Project names are globally unique
NonFunctional:
  Performance: [Response <500ms]
  Security: [Role-based access]
  Usability: []
Errors:                             # Error scenarios
  - condition: "Project name exists"
    message: "A project with this name already exists"
    code: DUPLICATE_NAME
ScopeBoundary:
  InScope: [Create project, assign owner]
  OutOfScope: [Invite members, billing]
OpenQuestions: []                    # Must be RESOLVED before GATE-P1
CopilotMode: STRICT                 # STRICT | GUIDED | PERMISSIVE
```

---

### P2: Analysis
**Robot:** Talib (Requirements Engineer)
**Purpose:** Decompose requirements into features, user stories, acceptance criteria
**How to start:** Navigate to `ROME/rome-p2-analysis/`

```bash
cd ROME/rome-p2-analysis
# SessionStart hook auto-loads Talib in P2-analysis mode
```

**Skills available** (from `robot-plugins/talib/skills/`):
- `/analyze-requirement` - Analyze single requirement (8-dimension)
- `/batch-analyze-requirements` - Analyze all requirements
- `/generate-user-stories` - Generate user stories from AORDL

**Input:** AORDL requirements from P1
**Output:** Features (FUNC-###), user stories (US-###), acceptance criteria, requirements matrix

**Traceability established:** `REQ-### → FUNC-### → US-###`

---

### P3: Design
**Robot:** PMA (Project Manager / Architect) + Clara (UX Designer, optional)
**Purpose:** Design system architecture, create feature specifications
**How to start:** Navigate to `ROME/rome-p3-design/`

```bash
cd ROME/rome-p3-design
# SessionStart hook auto-loads PMA in P3-design mode
```

**PMA creates:**
- `tech-stack.yaml` - Technology decisions + capability declarations (ROME-PROP-025)
- `data-dictionary.yaml` - All entities, fields, relationships (single source of truth)
- `api-design.md` - API contracts (endpoints, requests, responses)
- Use cases (UC-###) - Step-by-step interaction flows
- `system-architecture.md` - Layer diagram, component boundaries
- **Feature specifications** (SPEC-###) - Per-feature consolidated design contract (ROME-PROP-024)
- `actionlist.md` - Work breakdown by capability and robot for P5

**Feature Specifications (PROP-024):**

PMA creates one SPEC-### per FUNC-###, consolidating all design context for that feature:

```
SPEC-002: Organisation Management
  ├── Requirements Summary (REQ-003, REQ-004, REQ-005)
  ├── Use Cases (UC-003, UC-004, UC-005)
  ├── Data Schema (Organisation entity)
  ├── API Contracts (POST/PUT/GET /organisations)
  ├── UI Wireframes (Clara's layouts)
  ├── Implementation (empty — P5 robots complete)
  └── Change Register (v1.0)
```

**Capability Declarations (PROP-025):**

PMA defines system capabilities in `tech-stack.yaml`:

```yaml
capabilities:
  - id: database
    technology: PostgreSQL
    robot: ashok
    workspace: database
  - id: api
    technology: Hono (Bun)
    robot: reena
    workspace: backend-api
  - id: ui-app
    technology: Flutter
    robot: charlie
    workspace: frontend-app
dependencies:
  api: [database]
  ui-app: [api]
```

Capabilities replace the fixed db/api/ui model. Any number of capabilities can be declared.

**Traceability extended:** `REQ-### → FUNC-### → US-### → SPEC-### (v1.0)`

---

### P4: Configuration
**Robot:** Lucien (Configuration Specialist / DevOps)
**Purpose:** Scaffold workspaces per capability, configure build system, CI/CD
**How to start:** Navigate to `ROME/rome-p4-config/`

```bash
cd ROME/rome-p4-config
# SessionStart hook auto-loads Lucien in P4-config mode
```

**Lucien creates:**
- One workspace per capability in `SOURCE/`
- Package files, build configuration
- Test framework setup
- Environment configs (dev, test, staging, prod)
- CI/CD pipelines

**Input:** P3 designs, tech-stack.yaml (capabilities), actionlist.md
**Output:** Configured `SOURCE/` workspace roots, scaffolding manifest

---

### P5: Code Generation (Parallel Execution)
**Robots:** Per capability configuration (default: Ashok, Reena, Charlie)
**Purpose:** Generate production code with automatic dependency coordination
**How to start:** Navigate to `ROME/rome-p5-generation/`

**P5 robots read feature specifications (SPEC-###) as their primary input** — one document per feature with all design context consolidated.

Each P5 robot:
1. Reads assigned feature specs
2. Implements their capability's code
3. Completes the Implementation section of the spec with files created and rationale
4. Creates TRACEABILITY.md per feature referencing the spec
5. Bumps spec version in Change Register

**Default capabilities:**

| Capability | Robot | What They Build |
|------------|-------|----------------|
| database | Ashok | Schema, migrations, ORM models, seed data |
| api | Reena | Endpoints, services, middleware, DTOs |
| ui-app | Charlie | Screens, widgets, state management, navigation |

**Dependency coordination:** Roma reads `dependencies` from tech-stack.yaml and coordinates automatically. Capabilities with no dependencies start immediately. Dependencies are declared, not hardcoded.

**Feature-based code organisation:**

```
SOURCE/[workspace]/
└── features/
    ├── [feature_name]/
    │   ├── TRACEABILITY.md    → references SPEC-###
    │   ├── models/
    │   ├── services/
    │   ├── controllers/ or widgets/
    │   └── tests/
```

---

#### Recommended: Roma Command Center (Hybrid Mode)

Single-terminal monitoring with autonomous background agents:

```bash
cd ROME_tools
node orchestrators/p5-hybrid/index.js
```

**What happens:**
1. Agents spawn automatically in background per capability configuration
2. Live monitoring dashboard with real-time progress
3. Automatic dependency coordination per tech-stack.yaml
4. Interactive commands for manual intervention

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

**Quality Gates:**

| Gate | Validates |
|------|-----------|
| GATE-P1 | AORDL structure (13 fields), no anti-patterns, OpenQuestions resolved |
| GATE-P2 | 8-dimension coverage, user stories, acceptance criteria |
| GATE-P3 | 100% requirements coverage, feature specs created for all FUNC-### |
| GATE-P4 | Workspace configured per capabilities, dependencies installed |
| GATE-P5 | All capabilities COMPLETED, feature specs have Implementation sections, no unresolved invalidations in Change Registers, TRACEABILITY.md present per feature |

**Sarah BLOCKS if:** Missing requirements, security gaps, broken traceability, incomplete feature specs, unresolved Change Register invalidations, activity log incomplete.

---

## Traceability Chain

```
REQ-### (P1)  →  FUNC-### (P2)  →  US-### (P2)  →  SPEC-### (P3, v1.x)  →  Code (P5)
                                                         │
                                                         ├── Use Cases (UC-###)
                                                         ├── Data Schema
                                                         ├── API Contracts
                                                         ├── UI Wireframes
                                                         ├── Implementation (P5 robots)
                                                         └── Change Register
```

TRACEABILITY.md in each feature folder references the SPEC-### as the authoritative design reference.

---

## Change Propagation

When requirements or designs change after initial implementation:

1. **PMA** updates affected feature spec sections (requirements, use cases, schema, API)
2. **PMA** bumps spec version and marks which Implementation sections are **invalidated**
3. **P5 robots** review invalidated sections and update or confirm
4. **Sarah** at GATE-P5 blocks if any invalidations are unresolved

```
| Ver | Date       | Section     | Changed By | Trigger        | Invalidates          |
|-----|------------|-------------|------------|----------------|----------------------|
| 1.2 | 2026-04-01 | Use Cases   | PMA        | REQ-003 updated| Backend, Frontend    |
| 1.3 | 2026-04-02 | Backend impl| Reena      | Spec v1.2      | —                    |
| 1.4 | 2026-04-02 | Frontend    | Charlie    | Spec v1.2      | —                    |
```

---

## Robot Quick Reference

| Robot | Phase | Use For | Navigate To |
|-------|-------|---------|-------------|
| Roma | P0 + All | Project initialization & orchestration | `rome-p0-bootup/` |
| Talib | P1, P2 | AORDL requirements & analysis | `rome-p1-aordl/`, `rome-p2-analysis/` |
| PMA | P3 | Architecture, design, feature specs | `rome-p3-design/` |
| Clara | P3 | UX design, wireframes (optional) | `rome-p3-design/` (activated by PMA) |
| Lucien | P4 | Workspace configuration per capability | `rome-p4-config/` |
| Ashok | P5 | Database capability (default) | `rome-p5-generation/` |
| Reena | P5 | API/backend capability (default) | `rome-p5-generation/` |
| Charlie | P5 | Frontend/UI capability (default) | `rome-p5-generation/` |
| Sarah | QA | Quality gates & validation | `rome-qa/` |

---

## File Structure

```
my-app/
├── _user_input/                   # User-provided materials
│   └── raw-requirements/
├── ARTIFACTS/
│   ├── _requirements/             # P1-P2: Requirements & analysis
│   │   ├── REQ-001.yaml
│   │   ├── REQ-002.yaml
│   │   ├── requirements-catalog.md
│   │   ├── requirements-matrix.yaml
│   │   ├── user-stories.md
│   │   └── acceptance-criteria.md
│   ├── _design/                   # P3: Design artifacts
│   │   ├── design-decisions/
│   │   │   ├── tech-stack.yaml        # Capabilities + dependencies
│   │   │   ├── actionlist.md          # Work breakdown
│   │   │   └── phase3-handover.md
│   │   ├── data-models/
│   │   │   └── data-dictionary.yaml   # Master data definitions
│   │   ├── api-contracts/
│   │   │   └── api-design.md          # Master API definitions
│   │   ├── specs/                     # Feature specifications (PROP-024)
│   │   │   ├── SPEC-001-user-auth.md
│   │   │   ├── SPEC-002-org-mgmt.md
│   │   │   └── SPEC-003-members.md
│   │   ├── architecture/
│   │   │   └── system-architecture.md
│   │   └── design-assets/             # Clara's output
│   │       ├── wireframes/
│   │       └── design-system.md
│   └── _config/                   # P4: Configuration
│       ├── technical-specs/
│       ├── environment-config/
│       └── scaffolding-plans/
└── SOURCE/                        # P5: Generated code (per capability workspace)
    ├── backend-api/
    │   └── features/
    │       └── org-management/
    │           ├── TRACEABILITY.md
    │           ├── controllers/
    │           ├── services/
    │           └── tests/
    ├── frontend-app/
    │   └── lib/features/
    │       └── org-management/
    │           ├── TRACEABILITY.md
    │           ├── screens/
    │           ├── widgets/
    │           └── tests/
    └── database/
        ├── migrations/
        ├── models/
        └── seeds/
```

---

## Project Tracking

### Activity Logging

All robot work is tracked via the activity log MCP server:

- **Log file:** `ARTIFACTS/activity-log.txt` (append-only event stream)
- **Format:** `TIMESTAMP | TYPE | ID | ATTRIBUTES`
- **State:** `ARTIFACTS/activity-state.yaml` (rebuilt from log)
- **STORY ID pattern:** `STORY-[EPIC]-[FEAT]-[SEQ]-[CAP]` where CAP = capability from tech-stack.yaml

**Mandatory:** Every phase must log start (IN_PROGRESS) and completion (COMPLETED). Sarah BLOCKS if missing.

### Governance Documents

**Operational** (robot-facing, `ROME/rome-core/docs/operational/`):
- `baseline-universal.md` (ROME-GOV-BASELINE-A) - Universal operations for all robots
- `baseline-coordination.md` (ROME-GOV-BASELINE-B) - Coordination patterns for leads
- `activity-log-format.md` - Event log structure
- `sponsor-interaction.md` - Sponsor communication protocol
- `mcp-server-dependencies.md` - MCP server requirements

**Framework maintenance** (Archie-only, `ROME/rome-core/docs/framework-maintenance/`):
- Core principles, document standards, amendment procedures, UID registry, terminology management

---

## Summary: Requirements → Code

```
1. Bootup (P0)         → Project structure (Roma)
2. AORDL (P1)          → Structured requirements (Talib)
3. Analysis (P2)       → Features, user stories, acceptance criteria (Talib)
4. Design (P3)         → Architecture, feature specs, capability config (PMA)
5. Configuration (P4)  → Workspace setup per capability (Lucien)
6. Generation (P5)     → Working code per capability (robots from tech-stack.yaml)
7. QA (Sarah)          → Quality gates at each transition
```

**Key principles:**
- **Phase navigation** → SessionStart hook auto-loads robot
- **Feature specs** → One SPEC-### per feature consolidates all design context (PROP-024)
- **Capabilities** → System services declared in tech-stack.yaml, not hardcoded (PROP-025)
- **Change tracking** → Feature spec Change Register prevents silent drift
- **Parallel execution** → P5 robots coordinate via activity log per declared dependencies
- **Quality gates** → Sarah must approve each phase transition
- **Traceability** → REQ → FUNC → US → SPEC → Code, verified at every gate

---

**Need help?** See `PLUGIN-MANIFEST.md` for complete agent/skill reference.
