# ROME Framework: Lexicon

| Field | Value |
|-------|-------|
| **Document UID** | ROME-LEX-001 |
| **Status** | Draft |
| **Document Type** | Foundation |

---

## Purpose

Centralized definition of all framework-specific terms to ensure terminological integrity and prevent semantic conflicts.

---

## Framework Structure

| Term | Definition | ID Pattern / Values | Scope |
|------|------------|---------------------|-------|
| **ROME** | Multi-agent orchestration system enabling Claude Code instances to transform user requirements into executable applications through defined phases | Ingest → Analysis → Design → Config → Generation | Entire methodology |
| **Phase** | Discrete transformation stage with explicit entry criteria, outputs, and exit criteria | P0-P5 | Major process divisions within ROME |
| **Quality Gate** | Validation checkpoint guarding phase transitions; enforces exit criteria | GATE-P# | Phase boundary control |
| **Robot** | Autonomous Claude Code session executing specific tasks; task-assigned, role-defined, centrally coordinated, rule-constrained | - | Individual agent instance |
| **Orchestrator** | Designated robot managing phase transitions, process integrity, multi-agent coordination; enforces quality gate compliance | Roma | Central coordination authority |

---

## Phases

| Phase | Name | Description | Output |
|-------|------|-------------|--------|
| P0 | Bootup | Framework initialization and project setup | Project structure, activity log initialized |
| P1 | AORDL | Capture and validation of structured requirements in Actor-Oriented Requirements Definition Language (AORDL) format | AORDL requirement files (ARTIFACTS/_requirements/aordl/*.yaml) |
| P2 | Analysis | Functional decomposition, entity extraction, and user story generation from AORDL requirements | Entity models, dependency graphs, user stories |
| P3 | Design | Conversion of requirements into architectural schemas and logic flows | System design specifications |
| P4 | Config | Definition of technical constraints, environment variables, scaffolding instructions | Implementation configuration specifications |
| P5 | Generation | Mechanical production of executable code based strictly on Phase 4 outputs | Executable application code |

---

## Documents & Artifacts

| Term | Definition | Format / Pattern | Scope |
|------|------------|------------------|-------|
| **UID** | Stable document identifier persisting across revisions | ROME-[TYPE]-[NUMBER] (e.g., ROME-DEF-001) | Document identification system |
| **PRD** | Product Requirements Document - user-provided specification of desired application functionality | - | Input artifact type |
| **BRD** | Business Requirements Document - user-provided specification of business objectives and constraints | - | Input artifact type |
| **Data Dictionary** | Centralized single-source-of-truth defining data entities, attributes, relationships | YAML | Data model authority |
| **Technical Specification** | Centralized doc defining technical constraints, platform requirements, implementation parameters | Markdown | Technical constraints authority |
| **Action List** | Centralized task inventory used for robot task assignment | Markdown | Task management and coordination |
| **Glossary** | Mapping between framework-specific terms and standard software engineering terminology | - | External terminology alignment |

---

## Core Concepts

| Term | Definition | Implementation | Scope |
|------|------------|----------------|-------|
| **Traceability** | Ability to track transformation steps from source requirements through to generated code | Versioned artifacts, event logging, source references | Process transparency and audit capability |
| **Single Source of Truth** | Principle requiring critical shared resources to maintain singular authoritative versions | Data Dictionary, Technical Specifications, Action Lists, Lexicon | Information consistency control |
| **Atomic Requirement** | Indivisible logical requirement unit produced during Analysis phase; cannot be further decomposed without losing semantic coherence | - | Minimum granularity unit for requirements |
| **Terminological Integrity** | Property ensuring framework terms are distinct, non-overlapping, and unambiguous | Centralized lexicon and conflict detection | Framework-wide vocabulary management |
| **LLM Optimization** | Design principle requiring terse, high-signal content optimized for Large Language Model interpretation | Excludes conversational filler, decorative prose, superfluous text | All framework document content |

---

## Work Decomposition

| Term | Definition | ID Pattern | Duration | Parent | Scope |
|------|------------|-----------|----------|--------|-------|
| **Epic** | Highest-level work grouping containing multiple related features; delivers coherent business capability | EPIC-### (e.g., EPIC-001) | Weeks to months | - | Business capability cluster |
| **Feature** | User-facing functionality implementing one or more requirements across system layers; vertical slice spanning database, backend, frontend | FEAT-### (e.g., FEAT-001) | Days to weeks | Epic | Single coherent user-facing capability |
| **Story** | Atomic implementable work unit within specific layer with clear acceptance criteria | STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER] (e.g., STORY-001-003-02-api) | 1-4 hours | Feature | Minimum granularity implementable unit |

**Story ID Components:**
- EPIC: Epic number (001-999, zero-padded)
- FEAT: Feature number within project (001-999, zero-padded)
- SEQ: Story sequence within feature-layer combination (01-99, zero-padded)
- LAYER: database \| backend \| frontend (Story IDs use: db \| api \| ui)

**Hierarchy Example:**
```
EPIC-001: User Management
  ├── FEAT-001: User Authentication
  │   ├── STORY-001-001-01-db: User table
  │   ├── STORY-001-001-02-db: Session table
  │   ├── STORY-001-001-01-api: Login endpoint
  │   └── STORY-001-001-01-ui: Login form
  └── FEAT-003: Password Reset
      ├── STORY-001-003-01-db: Reset tokens table
      └── STORY-001-003-01-api: Request reset endpoint
```

---

## Activity Tracking

| Term | Definition | ID Pattern | Required Fields | Status Values | Scope |
|------|------------|-----------|-----------------|---------------|-------|
| **Activity Log** | Append-only event log recording work item status, blockers, amendments, phase progress | - | timestamp, type, id, attributes | - | Project activity state management |
| **Feature Entry** | Activity log entry tracking feature-level work | FEAT-### | id, type, title, priority, status, robot, phase, created | PENDING, IN_PROGRESS, COMPLETED, BLOCKED | Feature-level work tracking |
| **Story Entry** | Activity log entry tracking user story implementation within a feature | STORY-[EPIC]-[FEAT]-[SEQ]-[LAYER] | id, type, feature, title, status, robot, created | PENDING, IN_PROGRESS, COMPLETED, BLOCKED | Story-level work tracking |
| **Blocker Entry** | Activity log entry documenting an impediment preventing work progress | BLOCK-### | id, type, severity, description, status, robot, created | OPEN, ESCALATED, RESOLVED | Impediment tracking and resolution |
| **Amendment Entry** | Activity log entry documenting a change request to prior phase work | AMD-### | id, type, description, requestedBy, targetPhase, status, created | PENDING_REVIEW, APPROVED, REJECTED | Change control and impact tracking |
| **Phase Entry** | Activity log entry tracking phase-level status and gate decisions | PHASE-# | id, type, status, robot, created | NOT_STARTED, IN_PROGRESS, COMPLETED | Phase progression tracking |

**Layer:** Implementation dimension categorizing work by technical tier
- Values: database, backend, frontend
- Story ID abbreviations: database → db, backend → api, frontend → ui
- Scope: Technical tier classification

**Logging Trigger:** Event requiring mandatory activity log update (work start, work completion, blocker encountered, amendment requested). Defined in ROME-PROC-005.

---

## Term Usage Constraints

### Prohibited Overlaps

- **"phase"** - Do not use to refer to project management phases external to ROME
- **"robot"** - Do not use to refer to RPA (Robotic Process Automation) systems
- **"quality gate"** - Do not use to refer to CI/CD pipeline gates unless explicitly integrating ROME with CI/CD

### Alignment with Standard Terminology

- **"Requirements"** - Aligns with standard software engineering usage
- **"Architecture"** - Aligns with standard software engineering usage
- **"Code Generation"** - Aligns with standard software engineering usage
- **"Epic > Feature > Story"** - Aligns with Agile, Scrum, SAFe, and standard project management tools (Jira, Azure DevOps)
