# ROME 6.0 Project Launch Guide

**Version**: 6.0 - Evolutionary, Session-Continuous, Robot-Native
**Last Updated**: 2025-11-07
**Audience**: Project owners launching first ROME project

---

## 🚀 Automated Project Setup (Recommended)

**For new ROME projects, use the automated Project Launcher:**

```bash
cd 00-start
claude
```

This launches a Claude session that will:
1. **Gather project information** from your sponsor
2. **Create project structure** with symlinks to sponsor directory
3. **Initialize all 8 robot workspaces** (Talib, PMA, Clara, Sarah, Ashok, Reena, Charlie, Roma)
4. **Launch iTerm with split-pane layout** showing all robots
5. **Coordinate with Roma** for project monitoring
6. **Guide sponsor** through uploading requirements and starting Phase 1

**See `CLAUDE.md` in this folder for detailed launcher instructions.**

---

## ⚡ Quick Start (30 minutes - Manual)

**If you prefer manual setup, or for adding individual robots later:**

**Prerequisites:**
- Raw requirements document(s)
- Project directory created
- Claude Code installed

**Launch Talib robot:**
```bash
./scripts/create-robot.sh talib
cd robot_talib
# Claude reads CLAUDE.md and starts Phase 1
```

Then Talib will refine your requirements and guide you through Phase 2.

---

## 📋 ROME 6.0: 4-Phase Sequential Model

```
PHASE 1: Requirements Refinement
         Robot: Talib
         Duration: 2-3 days
         ↓
PHASE 2: Architecture & Technical Decisions
         Robot: PMA
         Duration: 2-3 days
         ↓
PHASE 2B: Design Validation Gate
          Robot: Sarah (Quality Gatekeeper)
          Duration: 1 day
          ↓ (IF APPROVED)
PHASE 3: Implementation
         Robots: Ashok (Data), Reena (Backend), Charlie (Frontend)
         Duration: 2-3 weeks
```

**Key Principle (P2):** Phases are **sequential and mandatory**. Each phase depends on completion of the previous phase.

---

## 🤖 Understanding ROME 6.0 Robots

Each robot is a Claude Code session with specialized role and responsibilities:

| Robot | Role | Phase | Responsibility |
|-------|------|-------|-----------------|
| **Talib** | Requirements Engineer | 1 | Refine raw requirements into clear specifications |
| **PMA** | Project Manager/Architect | 2 | Design architecture, data model, feature list |
| **Clara** | UX Designer | 2A | Design system, wireframes, components (optional) |
| **Sarah** | System Auditor | 2B | Validate design across 8 dimensions (GATE) |
| **Ashok** | Data Architect | 3 | Database schema, migrations, seed data |
| **Reena** | Backend Engineer | 3 | API endpoints, business logic, integration |
| **Charlie** | Frontend Developer | 3 | UI screens, client logic, user interactions |
| **Roma** | Project Coordinator | All | Monitor progress, coordinate robots, manage blockers |

---

## 🎯 Phase 1: Requirements Refinement (Talib)

**Duration:** 2-3 days

### What Talib Does:
1. Reads your raw requirement documents from `PROJECT/dev/_user_input/`
2. Analyzes across 8 technical dimensions (data, auth, deployment, etc.)
3. Asks clarifying questions about ambiguities
4. Refines specs into clear, unambiguous requirements
5. Creates `requirements-matrix.yaml` output

### Setup Talib:
```bash
# Create project structure
mkdir -p PROJECT/dev/_user_input
mkdir -p PROJECT/dev

# Place your requirement documents here:
# - product_requirements.md
# - use_cases.md
# - technical_specs.md (optional)
# - design_mockups/ (optional)

# Create and launch Talib
./scripts/create-robot.sh talib
cd robot_talib
# Claude reads CLAUDE.md automatically
```

### How Talib Works:
- Reads CLAUDE.md with phase instructions
- Reads `PROJECT/dev/_user_input/*` for your documents
- Asks questions interactively
- Creates refined specification output
- Updates `PROJECT/dev/project_activity.status` with completion

### When Talib is Done:
- ✅ `PROJECT/dev/requirements-matrix.yaml` exists
- ✅ All ambiguities resolved
- ✅ Ready for Phase 2 (PMA)

---

## 📋 Phase 2: Architecture & Technical Decisions (PMA)

**Duration:** 2-3 days

### What PMA Does:
1. Reads Talib's refined requirements
2. Asks design questions (data model, API design, performance)
3. Creates data model: `PROJECT/dev/data_model.md`
4. Creates use cases: `PROJECT/dev/use_cases.md`
5. Makes technology stack decisions
6. Decomposes features into vertical slices
7. Creates action list: `PROJECT/dev/actionlist.md`
8. Creates decision log: `PROJECT/dev/technical-decisions.md`

### Setup PMA:
```bash
./scripts/create-robot.sh pma
cd robot_pma
# Claude reads CLAUDE.md and starts Phase 2
```

### PMA Responsibilities (Detailed in role-pma.md):

**Phase 2 Technical Architecture Decisions Checklist:**
- [ ] Technology Stack (backend, frontend, database)
- [ ] Deployment Platform (cloud provider, containerization)
- [ ] Core App Foundations (auth, error logging, performance monitoring)
- [ ] Library & Expert Selection (with evaluation criteria)
- [ ] Testing & Quality Strategy (integration-first approach)
- [ ] Sponsor Approval Gates (written approval for key decisions)

**See**: `03-phase2-architecture/role-pma.md` for complete checklist

### When PMA is Done:
- ✅ `PROJECT/dev/data_model.md` with entities and relationships
- ✅ `PROJECT/dev/use_cases.md` with user workflows
- ✅ `PROJECT/dev/actionlist.md` with feature assignments
- ✅ `PROJECT/dev/technical-decisions.md` with sponsor approvals
- ✅ Ready for Phase 2B (Sarah) validation

---

## ✅ Phase 2B: Design Validation Gate (Sarah)

**Duration:** 1 day

### What Sarah Does (P5 Quality Gates):
Sarah validates PMA's design across **8 dimensions**:
1. Data Model completeness
2. Application Flow & Use Cases feasibility
3. Authentication & Authorization strategy
4. Caching Strategy appropriateness
5. Technology Stack selection justification
6. Target Platforms & Deployment architecture
7. Testing Strategy & Test Layer Design
8. System Scope clarity

### Sarah's Decision:
- ✅ **APPROVED** → Proceed to Phase 3
- 🚫 **BLOCKED** → Return to PMA to fix issues
- 🚩 **ESCALATED** → Sponsor decision required

### Setup Sarah:
```bash
./scripts/create-robot.sh sarah
cd robot_sarah
# Claude reads CLAUDE.md and starts Phase 2B validation
```

### When Sarah Completes:
- ✅ Design validation complete
- ✅ `PROJECT/dev/project_activity.status` updated with gate result
- ✅ If APPROVED: Ready for Phase 3 implementation

**See**: `05-phase2b-audit/role-sarah.md` for 8-dimension analysis details

---

## 🚀 Phase 3: Implementation (Ashok, Reena, Charlie)

**Duration:** 2-3 weeks (parallel work)

### What Phase 3 Robots Do:

**Ashok (Data Architect):**
- Creates database schema from data model
- Writes integration tests for schema and CRUD operations
- Manages database migrations and seed data

**Reena (Backend Engineer):**
- Implements API endpoints from PMA's design
- Implements business logic and validation
- Writes integration tests for API ↔ Database

**Charlie (Frontend Developer):**
- Implements UI screens from design specs
- Implements client data layer and domain logic
- Writes integration tests for UI ↔ API ↔ Database

### Setup Phase 3:
```bash
# Create all three development robots
./scripts/create-robot.sh ashok
./scripts/create-robot.sh reena
./scripts/create-robot.sh charlie

# Launch in separate iTerm windows
cd robot_ashok  # Window 1
cd robot_reena  # Window 2
cd robot_charlie # Window 3
```

### Each Robot Follows 6-Step Protocol:
1. **ANALYZE** - Understand requirements, data model, features
2. **DESIGN** - Plan implementation approach
3. **IMPLEMENT** - Write code with @Created annotations
4. **INTEGRATE** - Write integration tests at layer boundaries
5. **VALIDATE** - Ensure all tests pass, feature complete
6. **REPORT** - Update project activity log with completion

### Session Continuity (P14):
If a robot session crashes or times out:
1. Restart robot in same directory
2. Robot automatically reads `current_work.md` (work state)
3. Robot reads `project_activity.status` (phase context)
4. Robot continues from exact checkpoint
5. **Recovery time: < 5 minutes**

No duplicate work. No lost context.

**See**: `06-phase3-development/role-ashok.md`, `role-reena.md`, `role-charlie.md` for robot-specific details

---

## 📚 Where Are You Now?

### ❓ Not Started Yet
→ Read **[quickstart.md](quickstart.md)** for 30-minute setup

### 🎯 About to Start Phase 1
→ Run `./scripts/create-robot.sh talib` and let Talib guide you

### 📋 Completed Phase 1, Starting Phase 2
→ Run `./scripts/create-robot.sh pma` and follow PMA guidance
→ Reference: `03-phase2-architecture/role-pma.md`

### ✅ Completed Phase 2, Ready for Phase 2B
→ Run `./scripts/create-robot.sh sarah` for design validation
→ Reference: `05-phase2b-audit/role-sarah.md`

### 🚀 Phase 2B Approved, Starting Phase 3
→ Run `./scripts/create-robot.sh ashok && ./scripts/create-robot.sh reena && ./scripts/create-robot.sh charlie`
→ Launch in separate iTerm windows
→ References: `06-phase3-development/role-*.md`

---

## 📖 Complete Documentation

**Core Concepts:**
- `01-methodology/operational-design-principles.md` - 14 core governance principles (P1-P14)
- `robot-protocols/robot-generic-protocols.md` - Detailed protocols (RP-1 through RP-8)

**Role Specifications:**
- `02-phase1-requirements/role-talib.md` - Requirements engineer
- `03-phase2-architecture/role-pma.md` - Project manager/architect
- `04-phase2a-ux/role-clara.md` - UX designer (optional)
- `05-phase2b-audit/role-sarah.md` - System auditor / quality gatekeeper
- `06-phase3-development/role-ashok.md` - Data architect
- `06-phase3-development/role-reena.md` - Backend engineer
- `06-phase3-development/role-charlie.md` - Frontend developer
- `99-reference/role-roma.md` - Project coordinator

**Quick References:**
- `quickstart.md` - Fast path from raw requirements to working app
- `overview.md` - ROME methodology overview (stakeholder-friendly)
- `README.md` (root) - Documentation structure and navigation

---

## 🔄 Key ROME 6.0 Principles

### P13: Evolutionary & Iterative Development
- Phase 2 decisions (tech stack, architecture) are **baseline, not absolute**
- If Phase 3 discovers unworkable constraint → Can propose revision via amendment protocol
- All changes tracked with full justification
- Builds institutional knowledge over time

### P14: Robot Session Continuity & Recovery
- Each robot maintains work state in `robot_[name]/notes/current_work.md`
- Session crash → Restart robot in same directory
- Automatic recovery to exact checkpoint: **< 5 minutes**
- No duplicate work. No lost context.

### P6: Central Coordination via Roma
- All robots update `PROJECT/dev/project_activity.status` (central activity log)
- Roma monitors all phases and coordinates cross-robot communication
- Blockers escalated systematically with resolution tracking
- Amendment requests routed to correct phase

### P7: Integration-First Testing
- Test at integration boundaries, not isolated units
- Each layer (DB, API, Client) tested with real integrations
- Unit tests only added for complex logic (high complexity)
- Full end-to-end testing from day 1

---

## 🚨 Critical Success Factors

### Before Phase 2 Starts:
- [ ] Phase 1 (Talib) complete
- [ ] `requirements-matrix.yaml` exists and is clear
- [ ] All ambiguities from raw requirements resolved

### Before Phase 3 Starts:
- [ ] Phase 2 (PMA) complete with artifacts
- [ ] Phase 2B (Sarah) validation APPROVED
- [ ] `technical-decisions.md` exists with sponsor approvals
- [ ] All development robots created via `create-robot.sh`

### Before Deployment:
- [ ] All integration tests passing
- [ ] All code annotated with @TestLevel and @ComplexityLevel
- [ ] Code review completed
- [ ] PMA approval for @Stable true

---

## ⏱️ Expected Timeline

| Phase | Robot | Duration | Output |
|-------|-------|----------|--------|
| 1 | Talib | 2-3 days | Refined requirements |
| 2 | PMA | 2-3 days | Architecture, data model, feature list |
| 2A | Clara | 2-3 days | Design specs (optional) |
| 2B | Sarah | 1 day | Design approval or blockers |
| 3 | Ashok/Reena/Charlie | 2-3 weeks | Working application |

**Total: 4-6 weeks from raw requirements to deployable product**

---

## 🎯 Philosophy

ROME 6.0 emphasizes:
- **Automation** (P1) - Each robot is autonomous Claude Code session
- **Quality Gates** (P5) - Progress blocked until work validated
- **Session Continuity** (P14) - Robot interruptions don't break workflows
- **Evolutionary Design** (P13) - Refine based on implementation insights
- **Integration-First** (P7) - Real end-to-end testing from day 1
- **Vertical Features** (P8) - Complete features DB→API→UI, not layers
- **Central Coordination** (P6) - Activity logs synchronize all robots

---

## 🚀 Ready to Start?

```bash
# Create first robot (Talib)
./scripts/create-robot.sh talib

# Launch Talib
cd robot_talib

# Claude automatically reads CLAUDE.md and starts Phase 1
# Follow Talib's guidance through the project
```

Welcome to ROME 6.0! Your journey from requirements to working software starts here.

---

## 📞 Need Help?

- **Understanding a phase?** Read the role specification in the phase folder
- **Understanding a principle?** Read `01-methodology/operational-design-principles.md`
- **Understanding protocols?** Read `robot-protocols/robot-generic-protocols.md`
- **Quick overview?** Read `quickstart.md`
- **ROME philosophy?** Read `overview.md`
