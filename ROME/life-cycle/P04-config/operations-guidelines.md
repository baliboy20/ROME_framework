# Phase 4 - Config: Operations Guidelines

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PHASE-005 |
| **Version** | 2.0 |
| **Date** | 2025-12-24T00:00:00Z |
| **Status** | Active |
| **Document Type** | Phase Specification |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | true |

---

## Purpose

Defines WHAT Phase 4 (Config) must accomplish, including entry/exit criteria, required outputs, and quality gates. Robot-specific procedures (HOW) are defined in Lucien's CLAUDE.md.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Phase Decomposition, Modularity
- ROME-PROC-005 (Activity Logging Protocol) - Logging requirements
- ROME-PROC-006 (Quality Gate Protocol) - GATE-P4 requirements
- ROME-ROBOT-009 (Lucien) - Primary robot for this phase
- ROME-PHASE-004 (P3 Design) - Predecessor phase

---

## Phase Overview

| Attribute | Value |
|-----------|-------|
| Phase Number | P4 |
| Phase Name | Config |
| Primary Robot | Lucien (DevOps Engineer) |
| Predecessor | P3 (Design) |
| Successor | P5 (Generation) |
| Quality Gate | GATE-P4 (Sarah audit required) |

**Objective:** Transform design artifacts into ready-to-code project infrastructure. P5 robots should be able to start feature implementation immediately without environment setup questions.

**Scope:** This phase INCLUDES:
- Project scaffolding per workspace
- Build system configuration
- CI/CD pipeline setup
- Data workspace preparation (directory structure, connection templates)
- Environment configuration (dev, test, staging, prod)
- Dependency management
- Development tooling setup

**Out of Scope:**
- Feature code implementation (P5)
- Architecture decisions (P3)
- Business logic (P5)
- UI implementation (P5)
- Requirements extraction (P2)
- Database schema/migrations creation (Ashok - P5)
- Seed data creation (Ashok - P5)

---

## Entry Criteria

Phase 4 MAY NOT begin until ALL criteria are met:

| Criterion | Verification |
|-----------|--------------|
| P3 complete | PHASE-3 status = COMPLETED |
| GATE-P3 approved | Sarah audit passed |
| AORDL requirements available | REQ-*.yaml files from P1 (for full traceability) |
| Tech stack documented | `tech-stack.md` complete with AORDL-driven decisions |
| Data dictionary complete | `data-dictionary.yaml` with AORDL Invariants→Business rules |
| Test architecture documented | `test-architecture.md` complete |
| Actionlist complete | `actionlist.md` with workspace definitions |
| Handover received | `phase3-handover.md` complete |
| Roma assignment | Lucien assigned to P4 |
| PHASE-4 entry created | Activity log contains PHASE-4 |

---

## Exit Criteria

Phase 4 MAY NOT transition to P5 until ALL criteria are met:

| Criterion | Verification | Blocking |
|-----------|--------------|----------|
| All workspaces scaffolded | Directory structure exists per actionlist | Yes |
| Dependencies installed | Package managers configured, deps installed | Yes |
| Build commands work | Each workspace builds successfully | Yes |
| Data workspace prepared | Directory structure ready for Ashok | Yes |
| CI/CD configured | Pipeline files created and validated | Yes |
| Environment configs created | All environments documented | Yes |
| Test directories created | Test directory structure per test-architecture.md | Yes |
| Test dependencies installed | Test frameworks configured | Yes |
| Test environment configured | .env.test created, test config files exist | Yes |
| Test commands documented | Test execution commands in technical-specs.md | Yes |
| Technical specs documented | `technical-specs.md` complete | Yes |
| Scaffolding manifest complete | `scaffolding-manifest.md` documents all artifacts | Yes |
| Handover complete | `phase4-handover.md` with all sections | Yes |
| Activity log updated | PHASE-4 status = COMPLETED | Yes |
| Roma verification | Orchestrator confirms phase complete | Yes |
| **GATE-P4 APPROVED** | Sarah audit passed (ROME-PROC-006) | Yes |

---

## Quality Gates

**Note:** Internal quality gates (below) are validated by Lucien during execution. GATE-P4 (Sarah audit) validates the complete phase output before P5 transition.

### Gate 1: Workspace Scaffolding

**Check:** Every workspace from actionlist.md is scaffolded.

**Pass Criteria:**
- Directory structure matches specification
- Project initialized (package.json, pubspec.yaml, go.mod, etc.)
- Dependencies installed
- Build command runs without error

**Failure Action:** Complete missing workspace setup

### Gate 2: Data Workspace Preparation

**Check:** Data workspace is scaffolded and ready for Ashok (P5).

**Pass Criteria:**
- Directory structure created (migrations/, models/, seeds/, tests/, scripts/)
- Database connection template (.env.example) exists
- README skeleton created
- Workspace documented in scaffolding manifest

**Note:** Actual schema, migrations, and seeds are created by Ashok in P5.

**Failure Action:** Complete data workspace structure

### Gate 3: CI/CD Pipeline

**Check:** CI/CD pipeline is valid and functional.

**Pass Criteria:**
- Pipeline YAML syntax valid
- All workspaces included in pipeline
- Test stage configured
- Build stage configured
- Deployment stages defined (even if not active)

**Failure Action:** Fix pipeline configuration

### Gate 4: Environment Configuration

**Check:** All environments properly configured.

**Pass Criteria:**
- Environment template (.env.example) exists
- All required variables documented
- Sensitive values marked (not committed)
- Development environment works locally

**Failure Action:** Complete environment configuration

### Gate 5: Handover Readiness

**Check:** P5 robots can start immediately.

**Pass Criteria:**
- Handover document complete (all sections)
- Getting started instructions per workspace
- Build commands documented
- Feature assignments clear from actionlist
- No open blockers

**Failure Action:** Complete handover sections

---

## Outputs

### Required Artifacts

| Artifact | Location | Description |
|----------|----------|-------------|
| technical-specs.md | `ARTIFACTS/dev/config/` | Detailed implementation specs per workspace |
| environment-config.md | `ARTIFACTS/dev/config/` | Environment configurations |
| scaffolding-manifest.md | `ARTIFACTS/dev/config/` | What was created, where |
| ci-cd-config.md | `ARTIFACTS/dev/config/` | Pipeline configuration docs |
| phase4-handover.md | `ARTIFACTS/dev/config/` | Handover for P5 robots |
| [workspaces]/ | `SOURCE/` | Scaffolded project directories |
| [data-workspace]/ | `SOURCE/[data-workspace]/` | Data workspace structure (schema/seeds by Ashok P5) |

### Technical Specs Schema

technical-specs.md MUST include per workspace:

| Section | Content |
|---------|---------|
| Directory Structure | Complete file/folder layout |
| Build Commands | Install, dev, test, build commands |
| Environment Variables | Required vars with purpose |
| Entry Point | Main file/directory |
| Dependencies | Key packages with versions |

### Scaffolding Manifest Schema

scaffolding-manifest.md MUST include:

| Section | Content |
|---------|---------|
| Workspaces | List with location, technology, owner, status |
| Database | Migrations, models, seeds locations and status |
| CI/CD | Pipeline files and status |
| Configuration | All config files and status |
| Verification Checklist | All checks passed |

### Phase 4 Handover Schema

phase4-handover.md MUST include:

| Section | Content |
|---------|---------|
| Summary | What was completed |
| Workspace Assignments | Robot → workspace mapping |
| Getting Started | Per-robot instructions |
| Build Commands | Quick reference table |
| Environment Setup | Step-by-step local setup |
| CI/CD | Pipeline overview |
| Known Issues | Any notes for P5 |

---

## Workspace Scaffolding Requirements

### Per Workspace

Each workspace MUST have:

1. **Project Initialization**
   - Package manager initialized (npm, pip, pub, etc.)
   - Project configuration file (package.json, pyproject.toml, pubspec.yaml)

2. **Workspace Root Only**
   - Top-level workspace directory created
   - **Internal structure (src/, tests/, etc.) NOT created** - P5 robots create when implementing code

3. **Dependencies Installed**
   - Runtime dependencies
   - Development dependencies
   - Testing frameworks

4. **Build Configuration**
   - Compiler/transpiler config (tsconfig.json, etc.)
   - Linting config (.eslintrc, .prettierrc)
   - Test config (jest.config.js, pytest.ini)

5. **Environment Setup**
   - Environment template file
   - Documentation of required variables

### Data Workspace (Prepared for Ashok)

Lucien prepares the structure; Ashok (P5) creates the content:

| Lucien Creates (P4) | Ashok Creates (P5) |
|---------------------|-------------------|
| Directory structure | Migration files |
| .env.example template | ORM models |
| README skeleton | Seed data (dev/test) |
| .gitkeep files | Database tests |
| | Setup scripts |

**Directory Structure (Lucien):**
```
SOURCE/[data-workspace]/
├── migrations/       # Empty, Ashok creates migrations
├── models/           # Empty, Ashok creates models
├── seeds/
│   ├── dev/          # Empty, Ashok creates dev seeds
│   └── test/         # Empty, Ashok creates test seeds
├── tests/            # Empty, Ashok creates tests
├── scripts/          # Empty, Ashok creates scripts
├── .env.example      # Lucien creates template
└── README.md         # Lucien creates skeleton
```

---

## CI/CD Requirements

### Pipeline Stages

| Stage | Purpose | Trigger |
|-------|---------|---------|
| Lint | Code quality checks | All pushes |
| Test | Run test suites | All pushes |
| Build | Compile/bundle | All pushes |
| Deploy Dev | Deploy to development | Merge to develop |
| Deploy Staging | Deploy to staging | Merge to main |
| Deploy Prod | Deploy to production | Manual/Tag |

### Pipeline Configuration

- Syntax must be valid for target platform
- All workspaces covered
- Secrets documented (not committed)
- Caching configured for dependencies

---

## Environment Requirements

### Required Environments

| Environment | Purpose | Configuration |
|-------------|---------|---------------|
| Development | Local development | .env.development |
| Test | Automated testing | .env.test |
| Staging | Pre-production validation | .env.staging |
| Production | Live environment | .env.production |

### Environment Variables

Each environment MUST document:

| Variable | Purpose | Sensitive | Default |
|----------|---------|-----------|---------|
| [VAR_NAME] | [Purpose] | Yes/No | [Value or N/A] |

---

## Traceability Requirements

### AORDL-to-Config Tracing

Complete traceability from AORDL through all phases to configuration:

| From AORDL (P1) | Through P2 | Through P3 | To P4 Config |
|-----------------|------------|------------|--------------|
| REQ-### | Feature (FUNC-###) | Use case (UC-###) | Feature branch/workspace |
| Actor | User role | Use case Actor | Authentication config |
| Invariants | Data constraints | Data dictionary business rules | Database constraints |
| NonFunctional.Performance | NFR specification | System architecture | Environment sizing |
| NonFunctional.Security | NFR specification | Tech stack + API auth | Security config, secrets |
| Errors | Error handling | API design errors | Error logging config |

### Design-to-Config Tracing

Every design artifact MUST be traceable to configuration:

| From P3 | To P4 |
|---------|-------|
| Workspace (actionlist.md) | Scaffolded directory (SOURCE/) |
| Entity (data-dictionary.yaml) | Data workspace structure |
| Technology (tech-stack.md) | Initialized project with dependencies |
| Environment requirement | Environment config (.env files) |
| Test architecture | Test directory structure |

---

## Activity Logging Requirements

All robots operating in this phase MUST follow the Activity Logging Protocol:
- **ROME-PROC-005**: `/ROME/robot-templates/robot-operations-protocols/activity-logging-protocol.md`

### Phase-Specific Logging

| Event | Required Action |
|-------|-----------------|
| Phase begins | Update PHASE-4: status → IN_PROGRESS, startDate |
| Workspace scaffolded | Log CONFIG-WS-[workspace] entry |
| Schema generated | Log CONFIG-SCHEMA entry |
| CI/CD configured | Log CONFIG-CICD entry |
| Blocker encountered | Create BLOCK-### entry |
| Phase complete | Update PHASE-4: status → COMPLETED, completionDate |

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-11-20T00:00:00Z | Initial phase specification placeholder |
| 1.0 | 2025-11-24T00:00:00Z | Complete phase specification with Lucien as primary robot |
| 1.1 | 2025-11-24T00:00:00Z | Clarified: Lucien prepares data workspace structure, Ashok (P5) creates schema/migrations/seeds |
| 1.2 | 2025-11-24T00:00:00Z | Clarified: Lucien creates workspace root only, NOT internal src/tests structure (P5 responsibility) |
| 1.3 | 2025-12-18T00:00:00Z | Added test directory structure and test environment configuration requirements |
| 2.0 | 2025-12-24T00:00:00Z | **AORDL Integration (ROME-PROP-013 Phase 3 Week 1):** Updated entry criteria to reference AORDL requirements and AORDL-driven design decisions, added AORDL-to-Config tracing table (6 mappings from P1→P2→P3→P4), updated design-to-config tracing for clarity, updated status to Active |
