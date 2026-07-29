# ROME Framework: Lexicon

| Field | Value |
|-------|-------|
| **Document UID** | ROME-LEX-001 |
| **Version** | 1.5 |
| **Date** | 2026-07-16T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Foundation |
| **Companion** | ROME-ONT-001 (Ontology — structure and axioms) |

---

## Purpose

Centralized definition of all framework-specific terms to ensure terminological integrity and prevent semantic conflicts.

**Companion:** ROME-ONT-001 (Ontology) owns *structure* — the entity set, relations with cardinalities, and the axiom set. This document owns *definitions*. For "what does ROME guarantee is always true?", see the axiom set.

---

## Framework Structure

| Term | Definition | ID Pattern / Values | Scope |
|------|------------|---------------------|-------|
| **ROME** | Multi-agent orchestration system enabling Claude Code instances to transform user requirements into executable applications through defined phases | Bootstrap → Intake → AORDL → Analysis → Design → Prototype → Config → Generation | Entire methodology |
| **Phase** | Discrete transformation stage with explicit entry criteria, outputs, and exit criteria | P0, P0.5, P1-P3, P3.5, P4, P5 | Major process divisions within ROME |
| **Quality Gate** | Validation checkpoint guarding phase transitions; enforces exit criteria | GATE-P# | Phase boundary control |
| **Role** | A capability an agent instance may fill: producer, validator, gate authority, or orchestrator. Roles are definitions, not sessions. | - | Capability definition (ROME-STD-AGENT-ROLES §1) |
| **Instance** | A sub-agent spawned from a Role by the Orchestrator to perform work. Fills exactly one Role for its lifetime. | - | Individual agent execution |
| **Robot** | **Legacy alias — retired.** Formerly "autonomous Claude Code session executing specific tasks". Superseded by **Role** + **Instance** (ROME-STD-AGENT-ROLES §1), which separate the capability from the session filling it. Retained only to read pre-v2.0 documents and the `ROBOT.md` filenames, which are deliberately not renamed. | - | Do not use in new documents |
| **Orchestrator** | Distinguished Role managing phase transitions, process integrity, and multi-agent coordination; spawns and coordinates all Instances; enforces quality gate compliance | Roma | Central coordination authority |
| **Input** | A raw material a project starts from — a document (PRD/BRD), an idea, an existing codebase, or a design asset. Staged in `_user_input/raw-requirements/`. | - | Pre-P1 project material (ROME-ONT-001 ENT-13) |
| **Surveyor** | The Role that characterizes Inputs at P0.5 and produces the ICR. Does not author requirements, design, or approve gates. | Surveyor | Input characterization (ROME-STD-AGENT-ROLES) |
| **ICR (Input Characterization Record)** | Surveyor's structured output: intent, quality verdict, per-input inventory, and reliability. The Orchestrator routes the lifecycle from it (`routeFromICR`). | - | Routing input (ROME-ONT-001 ENT-14) |
| **Quality Verdict** | Surveyor's judgement of whether Inputs are adequate to proceed. | `SUFFICIENT` \| `INSUFFICIENT` | ICR field; gates routing (ROME-AX-17) |
| **Input Reliability** | The sponsor-declared solidity of an Input, read by Surveyor from `**Status:**` markers. Shaky levels gate routing (ROME-AX-18). | `Reliable` \| `PROPOSED` \| `RECONSTRUCTED` \| `UNDEFINED` | Sponsor reliability signal |
| **Increment** | One added unit of work (a module/slice) with its own lifecycle (routing, phases, gates, verification) over the Project's shared traceability store. Sealed on completion; sealed records are immutable (ROME-AX-19). | increment id 0..N | Growth unit (ROME-ONT-001 ENT-15; PROP-048) |
| **Project** | The whole: one or more Increments sharing a traceability store, audit trail, and framework provenance. Has no terminal state (ROME-AX-21). | - | Top-level unit (ROME-ONT-001 ENT-16) |
| **Stage** | A sponsor-ordered group of Inputs (`raw-requirements/stage-N/` or `stages.yaml`); binds to one Increment. Stage 0 = foundation (Core Subsystems); Stage 1 = the product MVP slice *by definition*. | stage-0..stage-N | Build-out ordering (ROME-ONT-001 ENT-17; PROP-049) |
| **Core Subsystem** | A cross-cutting capability multiple Stages presume or consume (auth, data schema, API skeleton, design system, hosting). Identified by Surveyor at intake; designed by PMA in the foundation Increment. | - | Program architecture (ROME-ONT-001 ENT-18; PROP-049) |
| **Stub** | A sponsor-declared stand-in implementing a Contract's interface shape with substitute behaviour, recorded with an `implementBy` Stage. Expired or undeclared stubs block delivery (ROME-AX-24). | `state.stubs[]` | Build-out decision (ROME-ONT-001 ENT-19; PROP-049) |
| **Build-Out Decision** | The sponsor's recorded per-Stage choice for a Core Subsystem or external API: implement \| stub \| defer. Presented by Surveyor in the ICR decision matrix. | implement \| stub \| defer | Sponsor decision record (PROP-049) |
| **AIB (Architecture & Infrastructure Brief)** | Sponsor-legible ≤1-page summary produced twice: AIB-P3 by PMA (component shape, patterns, vendors) and AIB-P4 by Lucien (final dependencies, deployment target, secrets flow, local dev loop, standards in force). Sponsor response required at the gate (ROME-AX-27). | `state.increments[].aib[phase]` | Sponsor checkpoint artifact (PROP-051) |
| **Sponsor Checkpoint Response** | The sponsor's recorded answer to an AIB, bound to its revision: CONFIRM (accept), REDIRECT (reopen the producing phase), DELEGATE (explicit "agent decides" — a recorded consent, never an absence; never auto-extends across phases). | CONFIRM \| REDIRECT \| DELEGATE | Gate precondition `sponsorArch`/`sponsorInfra` (PROP-051) |
| **Technical Specification (spec input)** | A properly constituted sponsor input carrying made technical decisions as TDRs. Canonical artifact: `decisions.tdr.yaml`, schema-validated by `intake.js#validateTdrs` — no LLM in the authority-parsing loop. | ICR `form: spec` | Authoritative input (ROME-STD-TECHSPEC; ROME-ONT-001 ENT-20) |
| **Change Type (CT)** | Classification of a work item against a DELIVERED Project by the highest artifact tier it forces to be reworked (code < design < requirements < architecture). Five labels, three mechanisms: CT-1 defect fix and CT-2 minor amendment (light path), CT-3 requirement change and CT-5 restructure (trace-scoped rework), CT-4 new capability (delegated to the Increment mechanism). Trace-verified before routing (ROME-AX-31). | CT-1..CT-5 | Work-item classification (PROP-054). Boundary vs *intent*: intent (`greenfield/refinement/extension/migration`) classifies a Project at CREATION; CT classifies a work item against delivered scope — `refinement` ≈ CT-3, `extension` ≈ CT-4, `migration` ≈ CT-5. |
| **Change Queue** | The Project's append-only triage list of sponsor observations (defects, amendment wishes, ideas) captured during or between sessions. Status flow QUEUED → CLASSIFIED → CONFIRMED → IN_PROGRESS → DELIVERED (PARKED reachable pre-run). Entries are never removed. | `state.changeQueue[]` | Live triage record (PROP-054 B.2) |
| **Change-Scoped Run** | The lifecycle run executing one confirmed CT-1/2/3/5 Change: an Increment tagged `change:{id, ct}` with a CT-scoped routing (e.g. `[P5]` for a defect fix). All gate/seal machinery applies unchanged (ROME-AX-32). | `intent: change` | Amendment mechanism (PROP-054 A.1) |
| **Blast Radius** | The trace-computed affected set of a Change (components, seeds, reasons), carrying an honest `granularityCeiling` when the trace cannot isolate impact below a level — the path widens rather than pretending precision. | `impact.js#blastRadius` | Scoping record (PROP-054 A.2; ROME-AX-31) |
| **Convention Level** | The rule-set a Project's artifacts were built under, declared as the framework version at last build/upgrade. The version number IS the rule-set declaration (MAJOR/MINOR ⇔ conventions changed; PATCH convention-neutral). Raised only by the migration ladder (ROME-AX-34). | `state.conventionLevel` | Version surface (PROP-055 A.1) |
| **Migration Step** | The declared per-version-boundary upgrade unit (`rome-core/migrations/<from>-<to>/step.md`): mechanical `transforms`, non-mechanical `gaps` (closed by `derive` → RECONSTRUCTED, or `sponsor`), and `semantics` notes feeding the Migration Log. A convention-neutral boundary declares `no-op` (ROME-AX-35). | MIG-x.y.z→x.y.z | Upgrade unit (PROP-055 B) |
| **Migration Log** | The Project's accumulated semantics ledger (`ARTIFACTS/_orchestration/migration-log.md`): "these artifacts predate rule X" notes agents MUST consult before flagging or altering pre-migration artifacts. | migration-log.md | Anti-drift ledger (PROP-055 C) |
| **TDR (Technical Decision Record)** | One made technical decision: id, status, scope, one checkable decision sentence, and the phases it binds. APPROVED TDRs from a Reliable carrier constrain producers (ROME-AX-29); PROPOSED TDRs surface as checkpoint questions and never bind. | TDR-## | Decision authority unit (ROME-STD-TECHSPEC; ENT-20) |
| **Deviation Request** | A producer's recorded request to depart from an APPROVED TDR (reason + proposed alternative). Surfaced via the AIB (or blocking sponsor question); only sponsor approval supersedes the TDR (ROME-AX-30). While OPEN it fails `tdrConformance`. | `state.tdrDeviations[]` DEV-# | TDR override path (PROP-052 §2.5) |
| **Carrier Reliability** | The rule that TDR authority never exceeds the reliability of the document carrying it: in a non-Reliable input every APPROVED TDR is downgraded to PROPOSED at extraction (ROME-AX-30). | `intake.js#applyCarrierReliability` | Authority bound (PROP-052 §2.1) |
| **Infra Constraint** | A sponsor-declared fact about existing infrastructure or vendor commitments (hosting/vendor accounts, operated stacks, vendors to avoid), captured by Surveyor at intake into the ICR. A P3/P4 choice contradicting one must surface in the AIB, never silently. | ICR `infraConstraints` | Intake capture (PROP-051 §2.4) |

---

## Phases

Gate ownership and enforcement: ROME-STD-GATE. Structure and invariants: ROME-ONT-001. `lifecycle.js` (`PHASES`) is authoritative.

**Optional** phases may be omitted at routing time (intent routing, PROP-036); routing never reorders phases. See ROME-AX-06.

| Phase | Name | Description | Gate | Optional | Output |
|-------|------|-------------|------|----------|--------|
| P0 | Bootup | Framework initialization and project setup | — (ungated) | No | Project structure, activity log initialized |
| P0.5 | Intake | Input characterization and intent routing; determines which phases the project routes through | GATE-P0.5 | Yes | Intent classification, routing decision |
| P1 | AORDL | Capture and validation of structured requirements in Actor-Oriented Requirements Definition Language (AORDL) format | GATE-P1 | No | AORDL requirement files (ARTIFACTS/_requirements/aordl/*.yaml) |
| P2 | Analysis | Functional decomposition, entity extraction, and user story generation from AORDL requirements | GATE-P2 | No | Entity models, dependency graphs, user stories |
| P3 | Design | Conversion of requirements into architectural schemas and logic flows | GATE-P3 | No | System design specifications |
| P3.5 | Prototype | Visual prototyping and sponsor visual approval | GATE-P3.5 | Yes | Prototype artifacts, sponsor visual approval |
| P4 | Config | Definition of technical constraints, environment variables, scaffolding instructions | GATE-P4 | No | Implementation configuration specifications |
| P5 | Generation | Mechanical production of executable code based strictly on Phase 4 outputs | GATE-P5 | No | Executable application code |

---

## Documents & Artifacts

| Term | Definition | Format / Pattern | Scope |
|------|------------|------------------|-------|
| **UID** | Stable document identifier persisting across revisions | ROME-[TYPE]-[NUMBER] (e.g., ROME-DEF-001) | Document identification system |
| **PRD** | Product Requirements Document - user-provided specification of desired application functionality | - | Input artifact type |
| **BRD** | Business Requirements Document - user-provided specification of business objectives and constraints | - | Input artifact type |
| **Data Dictionary** | Centralized single-source-of-truth defining data entities, attributes, relationships | YAML | Data model authority |
| **Technical Specs Artifact** | Lucien's P4 output doc recording technical constraints, platform requirements, implementation parameters. *Distinct from* **Technical Specification (spec input)** — the sponsor's TDR-carrying input document (ROME-STD-TECHSPEC), defined under Intake above. | Markdown | P4 configuration output |
| **Action List** | Centralized task inventory used for robot task assignment | Markdown | Task management and coordination |
| **Glossary** | Mapping between framework-specific terms and standard software engineering terminology | - | External terminology alignment |
| **Technical Brief** | Structured sponsor input declaring platform mandates, preferences, and constraints. Optional. | YAML (`_user_input/technical-brief.yaml`) | Project input document |

---

### Feature Specification (SPEC-###)
- **Definition:** Per-feature versioned document consolidating all design context (use cases, data schema, API contracts, wireframes) with implementation decisions recorded by P5 robots. Bridges P3 design and P5 code.
- **ID Pattern:** SPEC-### (number matches FUNC-### number)
- **Location:** `ARTIFACTS/_design/specs/SPEC-###-[feature-name].md`
- **Author:** PMA creates in P3; P5 robots complete Implementation section
- **Scope:** One per feature. The authoritative design reference for implementation.
- **Contrast:** Unlike TRACEABILITY.md (maps requirements to files), the feature spec captures the design contract and implementation rationale.

---

### Technical Brief Classifications

| Term | Definition | PMA Authority | Scope |
|------|-----------|--------------|-------|
| **Mandate** | Non-negotiable technical requirement from sponsor. Only changeable via AMD-### with sponsor approval. | Validate feasibility only. Cannot override. | Technical Brief classification |
| **Preference** | Sponsor-preferred technology. PMA may propose alternatives with documented justification. | May override with justification. | Technical Brief classification |
| **Constraint** | External limitation (existing infrastructure, compliance, integration dependency). *Distinct from* **Infra Constraint** (Intake section): a Constraint arrives in the legacy technical-brief.yaml; an Infra Constraint is captured by Surveyor's intake questions into the ICR (PROP-051). Where both exist, treat consistently and surface conflicts in the AIB. | Must respect. Can propose workarounds. | Technical Brief classification |

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
| **Story** | Atomic implementable work unit within specific capability with clear acceptance criteria | STORY-[EPIC]-[FEAT]-[SEQ]-[CAP] (e.g., STORY-001-003-02-api) | 1-4 hours | Feature | Minimum granularity implementable unit |

**Story ID Components:**
- EPIC: Epic number (001-999, zero-padded)
- FEAT: Feature number within project (001-999, zero-padded)
- SEQ: Story sequence within feature-capability combination (01-99, zero-padded)
- CAP: Capability identifier from tech-stack.yaml (e.g., database, api, ui-app, notifications)

**Hierarchy Example:**
```
EPIC-001: User Management
  ├── FEAT-001: User Authentication
  │   ├── STORY-001-001-01-database: User table
  │   ├── STORY-001-001-02-database: Session table
  │   ├── STORY-001-001-01-api: Login endpoint
  │   └── STORY-001-001-01-ui-app: Login form
  └── FEAT-003: Password Reset
      ├── STORY-001-003-01-database: Reset tokens table
      └── STORY-001-003-01-api: Request reset endpoint
```

---

## Activity Tracking

| Term | Definition | ID Pattern | Required Fields | Status Values | Scope |
|------|------------|-----------|-----------------|---------------|-------|
| **Activity Log** | Append-only event log recording work item status, blockers, amendments, phase progress | - | timestamp, type, id, attributes | - | Project activity state management |
| **Feature Entry** | Activity log entry tracking feature-level work | FEAT-### | id, type, title, priority, status, robot, phase, created | PENDING, IN_PROGRESS, COMPLETED, BLOCKED | Feature-level work tracking |
| **Story Entry** | Activity log entry tracking user story implementation within a feature | STORY-[EPIC]-[FEAT]-[SEQ]-[CAP] | id, type, feature, title, status, robot, created | PENDING, IN_PROGRESS, COMPLETED, BLOCKED | Story-level work tracking |
| **Blocker Entry** | Activity log entry documenting an impediment preventing work progress | BLOCK-### | id, type, severity, description, status, robot, created | OPEN, ESCALATED, RESOLVED | Impediment tracking and resolution |
| **Amendment Entry** | Activity log entry documenting an in-flight change request during an active ROME cycle | AMD-### | id, type, description, requestedBy, targetPhase, status, created | PENDING_REVIEW, APPROVED, REJECTED | In-cycle change tracking (use CR-### for post-delivery) |
| **Change Request Entry** | Activity log entry tracking a post-delivery Change Request lifecycle | CR-### | id, type, title, requestedBy, status, robot | PROPOSED, ANALYZED, APPROVED, IN_PROGRESS, COMPLETED, REJECTED, ROLLED_BACK | Post-delivery change tracking (use AMD-### during active cycle) |
| **Phase Entry** | Activity log entry tracking phase-level status and gate decisions | PHASE-# | id, type, status, robot, created | NOT_STARTED, IN_PROGRESS, COMPLETED | Phase progression tracking |

### Layer (Deprecated)
- **Status:** Deprecated. See Capability.
- **Previous values:** database, backend, frontend (fixed)
- **Replacement:** Capability — project-specific, unbounded

### Capability
- **Definition:** A system service that features consume. Declared per project in tech-stack.yaml by PMA in P3.
- **Properties:** id (unique identifier), technology (framework/platform), robot (assigned P5 robot), workspace (SOURCE/ directory)
- **Examples:** database, api, ui-app, ui-static, notifications, cdn, ml-pipeline
- **STORY ID usage:** Capability ID is used as the [CAP] suffix in STORY-[EPIC]-[FEAT]-[SEQ]-[CAP]
- **Contrast:** Unlike the deprecated "Layer" (fixed to database/backend/frontend), capabilities are project-specific and unbounded in number.

### Capability Dependency
- **Definition:** A declared relationship where one capability requires another to complete before it can start.
- **Declaration:** `dependencies` section in tech-stack.yaml
- **Enforcement:** Roma reads declarations and coordinates P5 execution order.
- **Example:** `api: [database]` means API capability cannot start until database capability completes.

**Logging Trigger:** Event requiring mandatory activity log update (work start, work completion, blocker encountered, amendment requested). Format defined in ROME-GOV-008 (activity-log-format.md); logging is performed via the `activity-log-file` MCP. (Formerly ROME-PROC-005, retired with `robot-templates/` in v2.0.)

---

## Git Conventions

Per ROME-GOV-011 (Git Conventions). All branch names and commit messages in ROME-managed applications follow these definitions.

### Branch Types

| Term | Pattern | Definition |
|------|---------|-----------|
| **Feature Branch** | `feat/FEAT-###-[slug]` | Isolated branch for P5 implementation of one feature. One branch per FEAT-###. |
| **Change Request Branch** | `cr/CR-###-[slug]` | Branch for post-delivery CR-### implementation. All implementing robots commit here. |
| **Refactor Branch** | `refactor/[description]` | Branch for refactoring work with no requirement or design changes. |
| **Hotfix Branch** | `hotfix/[description]` | Emergency production fix; merges to both `main` and `develop`. |

### Commit Types (Conventional Commits)

| Type | Use For |
|------|---------|
| `feat` | New functionality |
| `fix` | Bug fix |
| `refactor` | Code restructuring with no behaviour change |
| `docs` | Documentation only |
| `test` | Test additions or changes |
| `chore` | Build, config, dependency updates |
| `schema` | Database schema changes |

**Commit format:** `type(scope): description ([FEAT-###]|[CR-###]|[AMD-###])`

### Refactoring (ROME-defined)

**Refactoring** qualifies when ALL of: no REQ-### files modified; no design artifact changes; no observable behaviour change; no library version changes. Any violation means the change requires a CR-###. Procedure: log STORY with `refactor:true`, create `refactor/[description]` branch, no CR or Sarah gate required (but GATE-P5 code quality checks still apply if within P5 context).

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

---

## Revision Log

| Version | Date/Time (ISO 8601) | Summary |
|---------|----------------------|---------|
| 1.0 | — | Initial issue. (Predates revision logging on this document; reconstructed entry.) |
| 1.6 | 2026-07-27T00:00:00Z | PROP-054/055 companion additions: Change Type (CT-1..5, with the intent-vs-CT boundary resolving the refinement/extension overlap), Change Queue, Change-Scoped Run, Blast Radius, Convention Level, Migration Step, Migration Log (cross-linked to AX-31..35). |
| 1.5 | 2026-07-17T00:00:00Z | v3.2.1 consistency pass: duplicate "Technical Specification" resolved (P4 artifact renamed **Technical Specs Artifact**, cross-referenced to the spec-input term); Constraint ↔ Infra Constraint distinct-from note. |
| 1.4 | 2026-07-17T00:00:00Z | PROP-051/052 companion additions: AIB, Sponsor Checkpoint Response (CONFIRM/REDIRECT/DELEGATE), Technical Specification (spec input), TDR, Deviation Request, Carrier Reliability, Infra Constraint (cross-linked to ENT-20 and AX-27..30). |
| 1.3 | 2026-07-17T00:00:00Z | PROP-048/049 companion additions: defined Increment, Project, Stage, Core Subsystem, Stub, Build-Out Decision (cross-linked to ROME-ONT-001 ENT-15..19 and AX-19..24). |
| 1.2 | 2026-07-16T00:00:00Z | PROP-047 companion additions: defined Input, Surveyor, ICR, Quality Verdict, Input Reliability (previously undefined framework terms; cross-linked to ROME-ONT-001 ENT-13/14 and AX-17/18). |
| 1.1 | 2026-07-15T00:00:00Z | Staleness corrections per ROME-PROP-043 §P3, companion to ROME-ONT-001. Phase table rebuilt from `lifecycle.js`: adds P0.5 (Intake) and P3.5 (Prototype), gate column, and optional column — the P0–P5 model with a gate at every boundary was never the implemented model (P0 is ungated). "Robot" re-labeled a retired legacy alias → Role/Instance per ROME-STD-AGENT-ROLES §1; Role and Instance added as entries. Cross-link to ROME-ONT-001 added. Logging Trigger repointed from the retired ROME-PROC-005 to ROME-GOV-008. Revision log added (absent since initial issue, contrary to ROME-GOV-001). Term definitions otherwise unchanged. |
