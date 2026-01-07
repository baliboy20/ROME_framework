# ROME Framework User Guide

**Quick reference for building applications with ROME**

---

## Quick Start

**1. Create Project Directory**
```bash
mkdir my-app
cd my-app
```

**2. Start Building**

Launch Claude Code and open agent AGENT.md files directly from ROME:
```bash
# Open Bootstrap agent from ROME directory
open /path/to/ROME/rome-p0-bootup/agents/bootstrap/AGENT.md
```

Claude Code will load the agent context and you can begin working through phases.

**Optional:** Copy agents to your project if preferred:
```bash
# Example: Copy Bootstrap agent locally
cp -r /path/to/ROME/rome-p0-bootup/agents/bootstrap .claude/
open .claude/bootstrap/AGENT.md
```

No copying required - use agents directly from ROME/.

---

## Phase Workflow

ROME uses a 6-phase workflow from requirements to working code:

### P0: Bootstrap
**Agent:** Bootstrap
**Purpose:** Initialize project structure
**Location:** `ROME/rome-p0-bootup/agents/bootstrap/AGENT.md`

**How to use:** Open AGENT.md file in Claude Code, it will load agent context

**When:** Start of every new project

---

### P1: AORDL Requirements
**Agent:** Talib (P1 mode)
**Purpose:** Capture structured requirements in AORDL format
**Location:** `ROME/rome-p1-aordl/agents/talib/AGENT.md`

**Skills available:**
- `create-aordl-requirement` - Create new AORDL requirement
- `validate-aordl` - Validate AORDL syntax
- `transform-aordl-to-bdd` - Convert to BDD format

**Input:** User needs, PRD, BRD
**Output:** `_requirements/*.yaml` (AORDL files)

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
**Location:** `ROME/rome-p2-analysis/agents/talib/AGENT.md`

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
- PMA: `ROME/rome-p3-design/agents/pma/AGENT.md`
- Clara: `ROME/rome-p3-design/agents/clara/AGENT.md`

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
**Location:** `ROME/rome-p4-config/agents/lucien/AGENT.md`

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
- Ashok: `ROME/rome-p5-generation/agents/ashok/AGENT.md`
- Reena: `ROME/rome-p5-generation/agents/reena/AGENT.md`
- Charlie: `ROME/rome-p5-generation/agents/charlie/AGENT.md`

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
**Location:** `ROME/rome-qa/agents/sarah/AGENT.md`
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

# P0: Open Bootstrap agent
# Open: ROME/rome-p0-bootup/agents/bootstrap/AGENT.md
# Bootstrap creates initial project structure

# P1: Open Talib (P1 mode)
# Open: ROME/rome-p1-aordl/agents/talib/AGENT.md
# Work with Talib to create AORDL files in _requirements/

# Talib validates AORDL as you create them
```

**Day 2: Analysis & Design**
```bash
# P2: Open Talib (P2 mode)
# Open: ROME/rome-p2-analysis/agents/talib/AGENT.md
# Talib analyzes requirements in _requirements/

# P3: Open PMA for architecture
# Open: ROME/rome-p3-design/agents/pma/AGENT.md
# PMA creates architecture & designs

# Open Clara for validation
# Open: ROME/rome-p3-design/agents/clara/AGENT.md
# Clara validates design completeness
```

**Day 3: Configuration & Code**
```bash
# P4: Open Lucien
# Open: ROME/rome-p4-config/agents/lucien/AGENT.md
# Lucien configures workspace

# P5: Open generation agents (can work in parallel Claude sessions)
# Open: ROME/rome-p5-generation/agents/ashok/AGENT.md    (Backend)
# Open: ROME/rome-p5-generation/agents/reena/AGENT.md    (Frontend)
# Open: ROME/rome-p5-generation/agents/charlie/AGENT.md  (Integration)

# QA: Open Sarah for validation
# Open: ROME/rome-qa/agents/sarah/AGENT.md
```

---

## File Structure

```
my-app/
├── _requirements/          # P1: AORDL requirements
│   ├── REQ-001.yaml
│   └── REQ-002.yaml
├── _analysis/              # P2: Analysis artifacts
│   └── entities.md
├── _design/                # P3: Design docs
│   ├── architecture.md
│   ├── api-spec.yaml
│   └── data-dictionary.md
├── _config/                # P4: Configuration
│   └── workspace-config.yaml
├── src/                    # P5: Generated code
│   ├── backend/
│   ├── frontend/
│   └── integration/
└── tests/                  # P5: Generated tests
```

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
**Location:** `ROME/rome-core/agents/roma/AGENT.md`

**Use Roma for:**
- Multi-requirement projects
- Complex phase coordination
- Custom workflow automation
- Cross-phase orchestration

**How to use:** Open Roma's AGENT.md file in Claude Code

Roma coordinates all agents and manages phase transitions automatically.

---

## Setup Options

**Option 1: Reference ROME directory**

Point your Claude Code workspace to the ROME framework directory:
```bash
# Add ROME to your project context
# Open agents from: /path/to/ROME/rome-*/agents/
```

**Option 2: Copy specific agents**

Copy only the agents you need to your project:
```bash
# Copy P1 agent
cp -r ROME/rome-p1-aordl/agents/talib .claude/

# Copy P3 agents
cp -r ROME/rome-p3-design/agents/pma .claude/
cp -r ROME/rome-p3-design/agents/clara .claude/
```

**Option 3: Use from ROME directory**

Work directly with agents in the ROME directory - no copying needed. Just open the AGENT.md files in Claude Code.

**See:** `INSTALLATION-GUIDE.md` for detailed setup instructions

---

## Documentation

- `INSTALLATION-GUIDE.md` - Installation & setup
- `PLUGIN-MANIFEST.md` - Complete plugin/agent/skill catalog
- `TESTING.md` - Testing procedures
- `ROME/rome-core/docs/` - Framework internals (for developers)
- `ROME_framework_maintenance/archive/GETTING-STARTED-GUIDE.md` - Legacy guide

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
