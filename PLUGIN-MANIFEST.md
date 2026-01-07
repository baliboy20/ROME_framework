# ROME Framework - Plugin Manifest

Document UID: ROME-MANIFEST-001
Version: 1.0.0
Status: Complete
Date: 2026-01-07

## Overview

This document provides a complete catalog of all ROME Framework plugins, including agents, skills, commands, dependencies, and integration points. It serves as the authoritative reference for the phase-based plugin architecture.

## Plugin Summary

| Plugin | Version | Type | Agents | Skills | Commands | Phase |
|--------|---------|------|--------|--------|----------|-------|
| rome-core | 1.0.0 | Foundation | 1 | 0 | 0 | Core |
| rome-p0-bootup | 1.0.0 | Phase | 1 | 0 | 1 | P0 |
| rome-p1-aordl | 1.0.0 | Phase | 1 | 3 | 3 | P1 |
| rome-p2-analysis | 1.0.0 | Phase | 1 | 3 | 3 | P2 |
| rome-p3-design | 1.0.0 | Phase | 2 | 12 | 3 | P3 |
| rome-p4-config | 1.0.0 | Phase | 1 | 8 | 3 | P4 |
| rome-p5-generation | 1.0.0 | Phase | 3 | 8 | 3 | P5 |
| rome-qa | 1.0.0 | Cross-Phase | 1 | 6 | 2 | QA |
| rome-full | 1.0.0 | Meta-Plugin | 10 | 40 | 18 | All |

**Totals:**
- **9 Plugins**
- **10 Unique Agents**
- **40 Skills**
- **18 Commands**

---

## Plugin Catalog

### 1. rome-core

**Version:** 1.0.0
**Type:** Foundation Plugin
**Description:** ROME Framework foundation providing shared libraries, Roma orchestrator, and activity logging infrastructure.

#### Provides

##### Libraries
- **SkillInvoker.js** - Skill invocation library for executing ROME skills
- **SkillRegistry.js** - Skill registry management for auto-discovery
- **aordl-parser/validate-aordl.js** - AORDL requirement validation utility
- **aordl-parser/transform-aordl-to-bdd.js** - AORDL to BDD transformation utility

##### Agents
| Name | Role | Version | Status |
|------|------|---------|--------|
| Roma | Framework Orchestrator | 3.0.0 | Active |

##### MCP Servers
- **activity-log** - Event-based activity logging system
  - Tools: append(), query(), get_history(), get_statistics()
  - Location: `servers/activity-log/activity-log-file/`

##### Templates
- **aordl/** - AORDL requirement authoring templates
  - REQ-TEMPLATE.yaml
  - aordl-authoring-form.html
  - aordl-validation-report-template.md
  - requirements-catalog-template.md

#### Dependencies
- None (foundation plugin)

#### NPM Dependencies
- js-yaml ^4.1.0

#### Key Files
```
rome-core/
├── .claude-plugin/
│   └── plugin.json
├── lib/
│   ├── SkillInvoker.js
│   ├── SkillRegistry.js
│   └── aordl-parser/
│       ├── validate-aordl.js
│       └── transform-aordl-to-bdd.js
├── agents/
│   └── roma/
│       └── AGENT.md
├── servers/
│   └── activity-log/
│       └── activity-log-file/
│           └── index.js
├── templates/
│   └── aordl/
│       ├── REQ-TEMPLATE.yaml
│       └── aordl-authoring-form.html
├── package.json
└── README.md
```

---

### 2. rome-p0-bootup

**Version:** 1.0.0
**Type:** Phase Plugin
**Phase:** P00-bootup
**Description:** Project initialization and workspace setup for ROME projects.

#### Provides

##### Agents
| Name | Role | Version | Status | Mode |
|------|------|---------|--------|------|
| Bootstrap | Project Initialization Specialist | 3.0.0 | Active | P0 |

##### Commands
| Command | Description | Agent |
|---------|-------------|-------|
| /rome-p0:bootstrap | Initialize new ROME project | Bootstrap |

#### Dependencies
- rome-core: ^1.0.0

#### Key Features
- Creates ROME project directory structure
- Initializes workspace configuration
- Sets up phase directories (_requirements, _analysis, _design, _config, src)
- Generates initial project metadata

#### Key Files
```
rome-p0-bootup/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   └── bootstrap/
│       └── AGENT.md
├── commands/
│   └── rome-p0-bootstrap.md
├── package.json
└── README.md
```

---

### 3. rome-p1-aordl

**Version:** 1.0.0
**Type:** Phase Plugin
**Phase:** P01-aordl
**Description:** Requirements capture and validation using Actor-Oriented Requirements Definition Language (AORDL).

#### Provides

##### Agents
| Name | Role | Version | Status | Mode |
|------|------|---------|--------|------|
| Talib | Requirements Engineer | 3.0.0 | Active | P1 |

##### Skills
| Skill | Purpose | Inputs | Outputs |
|-------|---------|--------|---------|
| validate-aordl | Validate AORDL requirement structure | AORDL YAML file | Validation report |
| transform-aordl-to-bdd | Transform AORDL to BDD format | AORDL requirement | BDD feature file |
| create-aordl-requirement | Interactive requirement creation | User input | AORDL YAML file |

##### Commands
| Command | Description | Agent | Skill |
|---------|-------------|-------|-------|
| /rome-p1:validate | Validate AORDL requirement | Talib | validate-aordl |
| /rome-p1:create | Create new AORDL requirement | Talib | create-aordl-requirement |
| /rome-p1:transform-bdd | Transform AORDL to BDD | Talib | transform-aordl-to-bdd |

#### Dependencies
- rome-core: ^1.0.0

#### Artifacts Created
- `_requirements/aordl/REQ-*.yaml` - AORDL requirement files
- `_requirements/bdd/` - BDD feature files (optional)
- `_requirements/requirements-catalog.md` - Requirements catalog

#### Key Files
```
rome-p1-aordl/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   └── talib/
│       └── AGENT.md
├── skills/
│   ├── validate-aordl/
│   │   └── SKILL.md
│   ├── transform-aordl-to-bdd/
│   │   └── SKILL.md
│   └── create-aordl-requirement/
│       └── SKILL.md
├── commands/
│   ├── rome-p1-validate.md
│   ├── rome-p1-create.md
│   └── rome-p1-transform-bdd.md
├── package.json
└── README.md
```

---

### 4. rome-p2-analysis

**Version:** 1.0.0
**Type:** Phase Plugin
**Phase:** P02-analysis
**Description:** Functional decomposition and user story generation from AORDL requirements.

#### Provides

##### Agents
| Name | Role | Version | Status | Mode |
|------|------|---------|--------|------|
| Talib | Requirements Engineer | 3.0.0 | Active | P2 |

##### Skills
| Skill | Purpose | Inputs | Outputs |
|-------|---------|--------|---------|
| analyze-requirement | Perform functional decomposition | AORDL requirement | Analysis document |
| batch-analyze-requirements | Batch analyze multiple requirements | AORDL files | Multiple analysis docs |
| generate-user-stories | Generate user stories from requirements | AORDL + Analysis | User story files |

##### Commands
| Command | Description | Agent | Skill |
|---------|-------------|-------|-------|
| /rome-p2:analyze | Analyze single requirement | Talib | analyze-requirement |
| /rome-p2:batch-analyze | Batch analyze requirements | Talib | batch-analyze-requirements |
| /rome-p2:generate-stories | Generate user stories | Talib | generate-user-stories |

#### Dependencies
- rome-core: ^1.0.0

#### Peer Dependencies
- rome-p1-aordl: >=1.0.0 (requires AORDL requirements as input)

#### Artifacts Created
- `_analysis/functional-decomposition/REQ-*-analysis.md` - Analysis documents
- `_analysis/user-stories/US-*.md` - User story files
- `_analysis/entity-catalog.yaml` - Discovered entities
- `_analysis/actor-catalog.yaml` - Discovered actors

#### Key Files
```
rome-p2-analysis/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   └── talib/
│       └── AGENT.md
├── skills/
│   ├── analyze-requirement/
│   │   └── SKILL.md
│   ├── batch-analyze-requirements/
│   │   └── SKILL.md
│   └── generate-user-stories/
│       └── SKILL.md
├── commands/
│   ├── rome-p2-analyze.md
│   ├── rome-p2-batch-analyze.md
│   └── rome-p2-generate-stories.md
├── package.json
└── README.md
```

---

### 5. rome-p3-design

**Version:** 1.0.0
**Type:** Phase Plugin
**Phase:** P03-design
**Description:** System architecture, API design, and data modeling.

#### Provides

##### Agents
| Name | Role | Version | Status | Activation |
|------|------|---------|--------|------------|
| PMA | Project Manager / Architect | 3.0.0 | Active | Default |
| Clara | UX Designer | 3.0.0 | Active | Optional |

##### Skills (PMA)
| Skill | Purpose | Inputs | Outputs |
|-------|---------|--------|---------|
| design-api-controllers | Design API controller layer | User stories | API controller specs |
| design-data-dictionary | Generate data dictionary | Analysis docs | Data dictionary YAML |
| generate-architecture-diagram | Create architecture diagrams | User stories | Architecture diagrams |
| design-dto-models | Design DTO models | Data dictionary | DTO specifications |
| design-service-layer | Design service layer | User stories | Service layer specs |
| design-repository-layer | Design repository layer | Data dictionary | Repository specs |
| design-authentication | Design authentication system | Requirements | Auth specs |
| design-error-handling | Design error handling strategy | Requirements | Error handling specs |
| design-logging-strategy | Design logging strategy | Requirements | Logging specs |
| design-testing-structure | Design test structure | Requirements | Test plan |
| design-validation-layer | Design validation layer | Data dictionary | Validation specs |

##### Skills (Clara)
| Skill | Purpose | Inputs | Outputs |
|-------|---------|--------|---------|
| design-component-structure | Design UI component structure | User stories | Component hierarchy |

##### Commands
| Command | Description | Agent | Skill |
|---------|-------------|-------|-------|
| /rome-p3:design | Execute design phase | PMA | Multiple |
| /rome-p3:activate-clara | Activate Clara for UX design | Clara | N/A |
| /rome-p3:architecture | Generate architecture diagrams | PMA | generate-architecture-diagram |

#### Dependencies
- rome-core: ^1.0.0

#### Peer Dependencies
- rome-p2-analysis: >=1.0.0 (requires user stories as input)

#### Artifacts Created
- `_design/architecture/system-architecture.md` - Architecture documentation
- `_design/architecture/diagrams/` - Architecture diagrams
- `_design/api-specs/*.yaml` - API specifications (OpenAPI)
- `_design/data-models/data-dictionary.yaml` - Data dictionary
- `_design/data-models/dto-models.yaml` - DTO specifications
- `_design/services/*.md` - Service layer specs
- `_design/repositories/*.md` - Repository specs
- `_design/authentication/auth-spec.md` - Authentication specs
- `_design/error-handling/error-strategy.md` - Error handling specs
- `_design/logging/logging-strategy.md` - Logging specs
- `_design/testing/test-plan.md` - Test plan
- `_design/validation/validation-rules.yaml` - Validation specs
- `_design/ui/component-structure.md` - UI component hierarchy (Clara)

#### Key Files
```
rome-p3-design/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   ├── pma/
│   │   └── AGENT.md
│   └── clara/
│       └── AGENT.md
├── skills/
│   ├── design-api-controllers/
│   │   └── SKILL.md
│   ├── design-data-dictionary/
│   │   └── SKILL.md
│   ├── generate-architecture-diagram/
│   │   └── SKILL.md
│   ├── design-dto-models/
│   │   └── SKILL.md
│   ├── design-service-layer/
│   │   └── SKILL.md
│   ├── design-repository-layer/
│   │   └── SKILL.md
│   ├── design-authentication/
│   │   └── SKILL.md
│   ├── design-error-handling/
│   │   └── SKILL.md
│   ├── design-logging-strategy/
│   │   └── SKILL.md
│   ├── design-testing-structure/
│   │   └── SKILL.md
│   ├── design-validation-layer/
│   │   └── SKILL.md
│   └── design-component-structure/
│       └── SKILL.md
├── commands/
│   ├── rome-p3-design.md
│   ├── rome-p3-activate-clara.md
│   └── rome-p3-architecture.md
├── package.json
└── README.md
```

---

### 6. rome-p4-config

**Version:** 1.0.0
**Type:** Phase Plugin
**Phase:** P04-config
**Description:** Workspace scaffolding, environment configuration, and build system setup.

#### Provides

##### Agents
| Name | Role | Version | Status | Mode |
|------|------|---------|--------|------|
| Lucien | DevOps Engineer | 3.0.0 | Active | P4 |

##### Skills
| Skill | Purpose | Inputs | Outputs |
|-------|---------|--------|---------|
| scaffold-workspace | Scaffold workspace structure | Architecture specs | Directory structure |
| configure-environment | Configure environment variables | Tech stack | .env files |
| setup-cicd-pipeline | Setup CI/CD pipeline | Tech stack | Pipeline config files |
| configure-build-system | Configure build system | Tech stack | Build config files |
| setup-test-framework | Setup test framework | Test plan | Test config files |
| validate-workspace-structure | Validate workspace structure | Scaffolding manifest | Validation report |
| generate-technical-specs | Generate technical specs | Design artifacts | Technical specs |
| create-scaffolding-manifest | Create scaffolding manifest | Architecture | Manifest YAML |

##### Commands
| Command | Description | Agent | Skill |
|---------|-------------|-------|-------|
| /rome-p4:configure | Configure project environment | Lucien | configure-environment |
| /rome-p4:scaffold | Scaffold workspace | Lucien | scaffold-workspace |
| /rome-p4:cicd | Setup CI/CD pipeline | Lucien | setup-cicd-pipeline |

#### Dependencies
- rome-core: ^1.0.0

#### Peer Dependencies
- rome-p3-design: >=1.0.0 (requires architecture specs as input)

#### Artifacts Created
- `_config/scaffolding-manifest.yaml` - Workspace structure manifest
- `_config/environment/` - Environment configuration files
- `_config/build/` - Build system configuration
- `_config/cicd/` - CI/CD pipeline configurations
- `_config/testing/` - Test framework configuration
- `_config/technical-specs/` - Technical specifications
- `src/features/` - Feature-based directory structure
- `.env.example` - Environment variable template
- `.gitignore` - Git ignore rules
- `package.json` or equivalent - Project manifest

#### Key Files
```
rome-p4-config/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   └── lucien/
│       └── AGENT.md
├── skills/
│   ├── scaffold-workspace/
│   │   └── SKILL.md
│   ├── configure-environment/
│   │   └── SKILL.md
│   ├── setup-cicd-pipeline/
│   │   └── SKILL.md
│   ├── configure-build-system/
│   │   └── SKILL.md
│   ├── setup-test-framework/
│   │   └── SKILL.md
│   ├── validate-workspace-structure/
│   │   └── SKILL.md
│   ├── generate-technical-specs/
│   │   └── SKILL.md
│   └── create-scaffolding-manifest/
│       └── SKILL.md
├── commands/
│   ├── rome-p4-configure.md
│   ├── rome-p4-scaffold.md
│   └── rome-p4-cicd.md
├── package.json
└── README.md
```

---

### 7. rome-p5-generation

**Version:** 1.0.0
**Type:** Phase Plugin
**Phase:** P05-generation
**Description:** Database, API, and UI code generation.

#### Provides

##### Agents
| Name | Role | Version | Status | Layer | Dependencies |
|------|------|---------|--------|-------|--------------|
| Ashok | Data Architect & Database Engineer | 3.0.0 | Active | Database | None |
| Reena | Backend Engineer | 3.0.0 | Active | API | Ashok |
| Charlie | Frontend/Application Developer | 3.0.0 | Active | UI | Reena |

##### Skills (Ashok - Database)
| Skill | Purpose | Inputs | Outputs |
|-------|---------|--------|---------|
| generate-database-schema | Generate database schema | Data dictionary | Schema SQL |
| generate-migrations | Generate database migrations | Schema | Migration files |
| generate-orm-models | Generate ORM models | Schema | Model classes |
| generate-seed-data | Generate seed data | Schema | Seed SQL/scripts |

##### Skills (Reena - API)
| Skill | Purpose | Inputs | Outputs |
|-------|---------|--------|---------|
| generate-api-endpoints | Generate API endpoints | API specs | Controller files |
| generate-authentication-middleware | Generate auth middleware | Auth specs | Middleware files |

##### Skills (Charlie - UI)
| Skill | Purpose | Inputs | Outputs |
|-------|---------|--------|---------|
| generate-ui-screens | Generate UI screens | UI specs | Screen files |
| generate-ui-components | Generate UI components | Component specs | Component files |

##### Commands
| Command | Description | Agent | Skills |
|---------|-------------|-------|--------|
| /rome-p5:generate-db | Generate database layer | Ashok | generate-database-schema, generate-migrations, generate-orm-models, generate-seed-data |
| /rome-p5:generate-api | Generate API layer | Reena | generate-api-endpoints, generate-authentication-middleware |
| /rome-p5:generate-ui | Generate UI layer | Charlie | generate-ui-screens, generate-ui-components |

#### Dependencies
- rome-core: ^1.0.0

#### Peer Dependencies
- rome-p4-config: >=1.0.0 (requires scaffolding and configuration)

#### Artifacts Created

**Database Layer (Ashok):**
- `src/features/*/database/schema.sql` - Database schemas
- `src/features/*/database/migrations/` - Migration files
- `src/features/*/database/models/` - ORM model classes
- `src/features/*/database/seeds/` - Seed data scripts

**API Layer (Reena):**
- `src/features/*/api/controllers/` - API controllers
- `src/features/*/api/routes/` - Route definitions
- `src/features/*/services/` - Business logic services
- `src/features/*/repositories/` - Data access layer
- `src/middleware/authentication/` - Auth middleware
- `src/middleware/validation/` - Validation middleware
- `src/middleware/error-handling/` - Error handlers

**UI Layer (Charlie):**
- `src/features/*/ui/screens/` - UI screens/pages
- `src/features/*/ui/components/` - UI components
- `src/features/*/ui/widgets/` - Reusable widgets
- `src/features/*/ui/state/` - State management

#### Code Organization
Feature-based structure per ROME-PROP-016:
```
src/features/authentication/
├── database/
│   ├── schema.sql
│   ├── models/
│   └── migrations/
├── api/
│   ├── controllers/
│   └── routes/
├── services/
├── repositories/
└── ui/
    ├── screens/
    └── components/
```

#### Key Files
```
rome-p5-generation/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   ├── ashok/
│   │   └── AGENT.md
│   ├── reena/
│   │   └── AGENT.md
│   └── charlie/
│       └── AGENT.md
├── skills/
│   ├── generate-database-schema/
│   │   └── SKILL.md
│   ├── generate-migrations/
│   │   └── SKILL.md
│   ├── generate-orm-models/
│   │   └── SKILL.md
│   ├── generate-seed-data/
│   │   └── SKILL.md
│   ├── generate-api-endpoints/
│   │   └── SKILL.md
│   ├── generate-authentication-middleware/
│   │   └── SKILL.md
│   ├── generate-ui-screens/
│   │   └── SKILL.md
│   └── generate-ui-components/
│       └── SKILL.md
├── commands/
│   ├── rome-p5-generate-db.md
│   ├── rome-p5-generate-api.md
│   └── rome-p5-generate-ui.md
├── package.json
└── README.md
```

---

### 8. rome-qa

**Version:** 1.0.0
**Type:** Cross-Phase Plugin
**Phase:** QA (All phases)
**Description:** Quality gate validation and traceability verification across all ROME phases.

#### Provides

##### Agents
| Name | Role | Version | Status | Authority |
|------|------|---------|--------|-----------|
| Sarah | System Auditor & Quality Gatekeeper | 3.0.0 | Active | BLOCK/APPROVE |

##### Skills
| Skill | Purpose | Inputs | Outputs |
|-------|---------|--------|---------|
| validate-aordl-structure | Validate AORDL structure compliance | AORDL files | Validation report |
| validate-requirements-coverage | Validate requirements coverage | All artifacts | Coverage report |
| validate-data-dictionary | Validate data dictionary consistency | Data dictionary | Consistency report |
| quality-gate-p2 | Quality gate for P2 completion | P2 artifacts | PASS/FAIL + blockers |
| quality-gate-p3 | Quality gate for P3 completion | P3 artifacts | PASS/FAIL + blockers |
| verify-traceability | Verify AORDL traceability chain | All artifacts | Traceability report |

##### Commands
| Command | Description | Agent | Skill |
|---------|-------------|-------|-------|
| /rome-qa:validate | Run validation checks | Sarah | Multiple |
| /rome-qa:quality-gate | Execute quality gate | Sarah | quality-gate-p* |

#### Dependencies
- rome-core: ^1.0.0

#### Peer Dependencies
- None (works across all phases)

#### Quality Gate Criteria

**P1 → P2 Quality Gate:**
- AORDL requirements exist
- Requirements are valid (structure, syntax)
- Traceability initialized
- Acceptance criteria defined

**P2 → P3 Quality Gate:**
- Functional decomposition complete
- User stories generated
- Entities and actors cataloged
- Traceability chain maintained

**P3 → P4 Quality Gate:**
- Architecture diagram complete
- API specifications defined
- Data dictionary complete
- Design artifacts traceable to requirements

**P4 → P5 Quality Gate:**
- Workspace scaffolded
- Environment configured
- Build system setup
- Test framework configured

**P5 → Delivery Quality Gate:**
- Code generation complete for all layers
- Traceability chain intact (REQ → Code)
- All acceptance criteria addressed
- Test structure in place

#### Artifacts Created
- `_qa/validation-reports/` - Validation reports
- `_qa/quality-gates/` - Quality gate reports
- `_qa/traceability/` - Traceability chain reports
- `_qa/blockers/` - Blocker lists

#### Key Files
```
rome-qa/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   └── sarah/
│       └── AGENT.md
├── skills/
│   ├── validate-aordl-structure/
│   │   └── SKILL.md
│   ├── validate-requirements-coverage/
│   │   └── SKILL.md
│   ├── validate-data-dictionary/
│   │   └── SKILL.md
│   ├── quality-gate-p2/
│   │   └── SKILL.md
│   ├── quality-gate-p3/
│   │   └── SKILL.md
│   └── verify-traceability/
│       └── SKILL.md
├── commands/
│   ├── rome-qa-validate.md
│   └── rome-qa-quality-gate.md
├── package.json
└── README.md
```

---

### 9. rome-full

**Version:** 1.0.0
**Type:** Meta-Plugin
**Phase:** All phases
**Description:** Complete ROME Framework bundle with all phase plugins.

#### Provides

**Aggregates all agents, skills, and commands from:**
- rome-core
- rome-p0-bootup
- rome-p1-aordl
- rome-p2-analysis
- rome-p3-design
- rome-p4-config
- rome-p5-generation
- rome-qa

**Total Provisions:**
- 10 Agents
- 40 Skills
- 18 Commands
- 7 Phases (P0-P5, QA)

#### Dependencies
```json
{
  "rome-core": "^1.0.0",
  "rome-p0-bootup": "^1.0.0",
  "rome-p1-aordl": "^1.0.0",
  "rome-p2-analysis": "^1.0.0",
  "rome-p3-design": "^1.0.0",
  "rome-p4-config": "^1.0.0",
  "rome-p5-generation": "^1.0.0",
  "rome-qa": "^1.0.0"
}
```

#### Installation
Single command installs all dependencies:
```bash
claude-plugin install rome-full
```

#### Key Files
```
rome-full/
├── .claude-plugin/
│   └── plugin.json
├── README.md
└── package.json
```

---

## Agent Reference

### Complete Agent Catalog

| Agent | Plugin | Role | Version | Phase | Activation |
|-------|--------|------|---------|-------|------------|
| Roma | rome-core | Framework Orchestrator | 3.0.0 | Core | Always Active |
| Bootstrap | rome-p0-bootup | Project Initialization Specialist | 3.0.0 | P0 | On-Demand |
| Talib | rome-p1-aordl | Requirements Engineer (P1) | 3.0.0 | P1 | Phase-Based |
| Talib | rome-p2-analysis | Requirements Engineer (P2) | 3.0.0 | P2 | Phase-Based |
| PMA | rome-p3-design | Project Manager / Architect | 3.0.0 | P3 | Phase-Based |
| Clara | rome-p3-design | UX Designer | 3.0.0 | P3 | Optional |
| Lucien | rome-p4-config | DevOps Engineer | 3.0.0 | P4 | Phase-Based |
| Ashok | rome-p5-generation | Data Architect & Database Engineer | 3.0.0 | P5 | Sequential |
| Reena | rome-p5-generation | Backend Engineer | 3.0.0 | P5 | Sequential |
| Charlie | rome-p5-generation | Frontend/Application Developer | 3.0.0 | P5 | Sequential |
| Sarah | rome-qa | System Auditor & Quality Gatekeeper | 3.0.0 | QA | Cross-Phase |

### Agent Responsibilities

#### Roma (Orchestrator)
- Coordinate phase transitions
- Monitor robot activity
- Resolve blockers
- Enforce AORDL traceability
- Invoke quality gates
- Log framework events

#### Bootstrap (P0)
- Initialize ROME project structure
- Create phase directories
- Generate initial configuration
- Setup version control

#### Talib (P1-P2)
**P1 Mode:**
- Author AORDL requirements
- Validate AORDL structure
- Transform AORDL to BDD
- Maintain requirements catalog

**P2 Mode:**
- Perform functional decomposition
- Identify entities and actors
- Generate user stories
- Maintain traceability

#### PMA (P3)
- Design system architecture
- Define API specifications
- Create data dictionary
- Design service layers
- Design authentication
- Design error handling
- Design logging strategy
- Design testing structure

#### Clara (P3)
- Design UI/UX components
- Create wireframes
- Define component hierarchy
- Design navigation flows

#### Lucien (P4)
- Scaffold workspace structure
- Configure environment
- Setup CI/CD pipeline
- Configure build system
- Setup test framework
- Generate technical specs

#### Ashok (P5)
- Generate database schemas
- Generate migrations
- Generate ORM models
- Generate seed data

#### Reena (P5)
- Generate API endpoints
- Generate controllers
- Generate services
- Generate repositories
- Generate authentication middleware

#### Charlie (P5)
- Generate UI screens
- Generate UI components
- Generate widgets
- Generate state management

#### Sarah (QA)
- Validate AORDL structure
- Validate requirements coverage
- Validate data dictionary
- Execute quality gates (P2, P3, P4, P5)
- Verify traceability chains
- BLOCK phase transitions if validation fails
- APPROVE phase transitions if validation passes

---

## Skill Reference

### Skills by Phase

#### P0 Skills
None (P0 uses commands only)

#### P1 Skills (AORDL)
1. validate-aordl
2. transform-aordl-to-bdd
3. create-aordl-requirement

#### P2 Skills (Analysis)
4. analyze-requirement
5. batch-analyze-requirements
6. generate-user-stories

#### P3 Skills (Design)
7. design-api-controllers
8. design-data-dictionary
9. generate-architecture-diagram
10. design-dto-models
11. design-service-layer
12. design-repository-layer
13. design-authentication
14. design-error-handling
15. design-logging-strategy
16. design-testing-structure
17. design-validation-layer
18. design-component-structure

#### P4 Skills (Configuration)
19. scaffold-workspace
20. configure-environment
21. setup-cicd-pipeline
22. configure-build-system
23. setup-test-framework
24. validate-workspace-structure
25. generate-technical-specs
26. create-scaffolding-manifest

#### P5 Skills (Generation)
27. generate-database-schema
28. generate-migrations
29. generate-orm-models
30. generate-seed-data
31. generate-api-endpoints
32. generate-authentication-middleware
33. generate-ui-screens
34. generate-ui-components

#### QA Skills (Cross-Phase)
35. validate-aordl-structure
36. validate-requirements-coverage
37. validate-data-dictionary
38. quality-gate-p2
39. quality-gate-p3
40. verify-traceability

---

## Command Reference

### Commands by Plugin

#### rome-p0-bootup
1. `/rome-p0:bootstrap` - Initialize new ROME project

#### rome-p1-aordl
2. `/rome-p1:validate` - Validate AORDL requirement
3. `/rome-p1:create` - Create new AORDL requirement
4. `/rome-p1:transform-bdd` - Transform AORDL to BDD

#### rome-p2-analysis
5. `/rome-p2:analyze` - Analyze single requirement
6. `/rome-p2:batch-analyze` - Batch analyze requirements
7. `/rome-p2:generate-stories` - Generate user stories

#### rome-p3-design
8. `/rome-p3:design` - Execute design phase
9. `/rome-p3:activate-clara` - Activate Clara (UX Designer)
10. `/rome-p3:architecture` - Generate architecture diagrams

#### rome-p4-config
11. `/rome-p4:configure` - Configure project environment
12. `/rome-p4:scaffold` - Scaffold workspace structure
13. `/rome-p4:cicd` - Setup CI/CD pipeline

#### rome-p5-generation
14. `/rome-p5:generate-db` - Generate database layer
15. `/rome-p5:generate-api` - Generate API layer
16. `/rome-p5:generate-ui` - Generate UI layer

#### rome-qa
17. `/rome-qa:validate` - Run validation checks
18. `/rome-qa:quality-gate` - Execute quality gate

---

## Dependency Graph

### Plugin Dependencies

```
rome-core (foundation)
├── rome-p0-bootup
├── rome-p1-aordl
├── rome-p2-analysis
│   └── (peer) rome-p1-aordl
├── rome-p3-design
│   └── (peer) rome-p2-analysis
├── rome-p4-config
│   └── (peer) rome-p3-design
├── rome-p5-generation
│   └── (peer) rome-p4-config
└── rome-qa

rome-full (meta-plugin)
└── All plugins above
```

### Agent Dependencies (P5)

```
Ashok (Database) → generates → Database Schema
    ↓
Reena (API) → depends on → Database Schema → generates → API Layer
    ↓
Charlie (UI) → depends on → API Layer → generates → UI Layer
```

### Phase Flow

```
[User] → [Bootstrap:P0] → [Talib:P1] → [Sarah:QA-P1]
                              ↓              ↓
                        AORDL Created    Validation
                              ↓              ↓
                        [Talib:P2] ← [APPROVED]
                              ↓
                       Analysis Done
                              ↓
                        [Sarah:QA-P2]
                              ↓
                         [APPROVED]
                              ↓
                        [PMA/Clara:P3]
                              ↓
                       Design Complete
                              ↓
                        [Sarah:QA-P3]
                              ↓
                         [APPROVED]
                              ↓
                        [Lucien:P4]
                              ↓
                       Config Complete
                              ↓
                        [Ashok:P5-DB]
                              ↓
                        [Reena:P5-API]
                              ↓
                        [Charlie:P5-UI]
                              ↓
                       Code Generation Done
                              ↓
                        [Sarah:QA-Final]
                              ↓
                         [APPROVED]
                              ↓
                        [Delivery]
```

---

## Integration Points

### Plugin-to-Plugin Communication

#### Artifact-Based Integration
Plugins communicate through shared artifacts in the ROME directory structure:

```
_requirements/aordl/  → P1 writes, P2 reads
_analysis/            → P2 writes, P3 reads
_design/              → P3 writes, P4 reads
_config/              → P4 writes, P5 reads
src/                  → P5 writes, QA reads
```

#### Traceability Integration
All artifacts maintain upstream traceability:

```yaml
# Example artifact metadata
traceability:
  upstream:
    - REQ-USER-001
    - US-AUTH-001
  downstream:
    - authentication-api.yaml
    - User.model.js
```

#### Quality Gate Integration
Sarah QA agent validates artifacts at phase boundaries:

1. P1 → P2: Validate AORDL requirements
2. P2 → P3: Validate analysis and user stories
3. P3 → P4: Validate design artifacts
4. P4 → P5: Validate configuration
5. P5 → Delivery: Validate code generation

#### Roma Orchestration
Roma coordinates all phase transitions:

```
User Request → Roma → Phase Validation → Sarah QA → Phase Transition → Agent Activation
```

---

## Technology Stack Support

### Supported Tech Stacks

ROME Framework supports multiple technology stacks through configuration:

#### Backend
- Node.js + Express
- Node.js + NestJS
- Python + Django
- Python + FastAPI
- Java + Spring Boot
- Go + Gin

#### Frontend
- Flutter/Dart
- React + TypeScript
- Vue.js + TypeScript
- Angular + TypeScript
- React Native

#### Database
- PostgreSQL
- MySQL
- MongoDB
- SQLite
- Firebase

#### ORM
- TypeORM (Node.js)
- Sequelize (Node.js)
- Django ORM (Python)
- SQLAlchemy (Python)
- Hibernate (Java)
- GORM (Go)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Initial plugin manifest created by Agent Nu |

---

## References

- ROME-PROP-018: Phase-Based Plugin Architecture
- ROME-ROBOT-001 to ROME-ROBOT-011: Agent definitions
- INSTALLATION-GUIDE.md: Installation procedures
- TESTING.md: Validation procedures
- rome-full/README.md: Meta-plugin documentation

---

## Appendix: Quick Reference Tables

### Plugin Quick Reference

| Need | Plugin(s) | Install Command |
|------|-----------|-----------------|
| Everything | rome-full | `claude-plugin install rome-full` |
| Requirements only | rome-core, rome-p0-bootup, rome-p1-aordl | `claude-plugin install rome-core rome-p0-bootup rome-p1-aordl` |
| Requirements + Analysis | + rome-p2-analysis | `+ rome-p2-analysis` |
| Design only | rome-core, rome-p3-design | `claude-plugin install rome-core rome-p3-design` |
| Code generation only | rome-core, rome-p5-generation | `claude-plugin install rome-core rome-p5-generation` |
| Quality assurance | rome-core, rome-qa | `claude-plugin install rome-core rome-qa` |

### Command Quick Reference

| Task | Command |
|------|---------|
| Initialize project | `/rome-p0:bootstrap` |
| Create requirement | `/rome-p1:create` |
| Validate requirement | `/rome-p1:validate <file>` |
| Analyze requirements | `/rome-p2:batch-analyze` |
| Generate user stories | `/rome-p2:generate-stories` |
| Design system | `/rome-p3:design` |
| Generate architecture | `/rome-p3:architecture` |
| Configure workspace | `/rome-p4:configure` |
| Scaffold workspace | `/rome-p4:scaffold` |
| Generate database | `/rome-p5:generate-db` |
| Generate API | `/rome-p5:generate-api` |
| Generate UI | `/rome-p5:generate-ui` |
| Validate artifacts | `/rome-qa:validate` |
| Run quality gate | `/rome-qa:quality-gate --phase P2` |

### Agent Quick Reference

| Agent | Activate When | Example |
|-------|---------------|---------|
| Bootstrap | Starting new project | "Initialize a new ROME project" |
| Talib (P1) | Writing requirements | "Help me create AORDL requirements" |
| Talib (P2) | Analyzing requirements | "Analyze these requirements" |
| PMA | Designing architecture | "Design the system architecture" |
| Clara | Designing UI/UX | "/rome-p3:activate-clara" |
| Lucien | Configuring workspace | "Configure the development environment" |
| Ashok | Generating database | "Generate the database schema" |
| Reena | Generating API | "Generate the API layer" |
| Charlie | Generating UI | "Generate the UI components" |
| Sarah | Quality validation | "Validate phase 2 completion" |
