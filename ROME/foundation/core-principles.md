--------------------

# ROME Framework: Core Principles


**Document UID:** ROME-PRIN-001  

**Version:** 1.0  

**Date:** 2025-11-20T00:00:00Z

**Status:** Draft

**Document Type:** Foundation

**Author:** Framework Analyst & Architect

--------------------

## Purpose
Defines the modus operandi of ROME for all robots operating within the framework. Particularly critical for the Framework Analyst & Architect, who ensures framework consistency and relevance as it evolves.

Detailed policy for these principles throughout the application development lifecycle is documented in `core-principles-policy.md` (ROME-IMPL-001).

## Document Structure
Each principle consists of:
- **Definition**: The principle and its purpose
- **Implementation**: How the principle manifests within framework components (with document references)

## Principles

### 1. Flexibility & Adaptability
**Definition:** Framework structure must support modification without systemic disruption.

**Implementation:**
- Information architecture supports non-breaking additions/changes
- File organization permits granular updates
- Document schemas allow extension without invalidating existing content

### 2. Traceability
**Definition:** The framework must support comprehensive tracking across two dimensions: work progress during application development and structural integrity across framework documents.

**2a. Work Traceability (Operational)**
Tracks the progress of work across the ROME lifecycle during application development.

**Purpose:**
- Monitor progress of tasks through phases
- Ensure completion of assigned work
- Verify compliance to specifications
- Enable coordination across robots
- Support recovery from interruptions

**2b. Framework Traceability (Structural)**
Maintains integrity and consistency through inter-document references within the ROME framework itself.

**Purpose:**
- Ensure all transformation steps from requirements to code are traceable
- Maintain referential integrity across documents
- Support version control and rollback
- Enable dependency tracking and validation

**Policy:**
- Detailed in `core-principles-policy.md` (ROME-IMPL-001)

### 3. Quality Assurance
**Definition:** Deliver accurate, error-free, unambiguous, and complete outputs through controlled processes.

**Implementation:**
- Phase-based decomposition with defined boundaries
- Quality gates guard phase transitions
- Exit criteria enforce completeness before progression
- Validation mechanisms specific to each phase output type

### 4. Phase Decomposition
**Definition:** Requirements-to-code transformation occurs through discrete, sequential phases.

**Phases:**
- **Phase 1 (Ingest)**: Intake of raw user materials (PRDs, BRDs, notes)
- **Phase 2 (Analysis)**: Structuring inputs into atomic logical requirements
- **Phase 3 (Design)**: Converting requirements into architectural schemas and logic flows
- **Phase 4 (Config)**: Defining technical constraints, environment variables, scaffolding instructions
- **Phase 5 (Generation)**: Mechanical production of executable code from Phase 3 outputs

### 5. Central Orchestration
**Definition:** A designated orchestrator maintains process integrity and coordination across agents.

**Implementation:**
- Single orchestrating agent (Robot) manages phase transitions
- Ensures adherence to process flow
- Monitors quality gate compliance

### 6. Single Source of Truth
**Definition:** Critical shared resources maintain singular, authoritative versions.

**Implementation:**?
- Centralized documents for:
  - Data Dictionary
  - Technical Specifications
  - Action Lists
- All agents reference canonical versions
- Updates propagate from single source

### 7. Robot Architecture
**Definition:** Robots are autonomous Claude Code sessions executing specific tasks within defined operational boundaries.

**Characteristics:**
- Autonomous Claude Code instances
- Task-assigned from central task lists
- Carefully defined role specifications
- Centrally coordinated operations
- Trainable via expert input and external knowledge sources
- Constrained by extensive rule sets defining operational scope within assigned phase(s)

**Implementation:**
- Each robot receives explicit role definition document
- Task assignment through central orchestration
- Rule sets and constraints limit operational field to specific phase(s)
- Training materials and expert guidance incorporated into role definitions
- Coordination ensures non-conflicting concurrent operations

### 8. Terminological Integrity
**Definition:** Framework terminology must be distinct, non-overlapping, and explicitly defined to prevent ambiguity.

**Requirements:**
- Terms must not conflict with other framework terms
- Terms must not create ambiguity with standard software engineering usage unless deliberately aligned
- Each term receives explicit definition in framework lexicon
- Terminology remains consistent across all phases and documents

**Implementation:**
- Centralized Lexicon document defines all framework-specific terms
- Glossary maps framework terms to standard terminology where overlap exists
- Term definitions include scope boundaries and usage constraints
- New terms require lexicon entry before use in framework documents
- Terminology conflicts flagged during document review

### 9. Modularity & Vertical Slicing
**Definition:** Applications decompose into discrete systems connected by defined interfaces, while work organizes into vertical feature slices for expedient delivery.

**Dual Decomposition Strategy:**

**Horizontal (System) Modularity:**
- Recognizes applications as compositions of one or more discrete systems
- Systems interconnect via defined system messages/interfaces
- Becomes predominant architectural concern at Design phase
- Enables independent system evolution and technology choices

**Vertical (Feature) Slicing:**
- Work organized as vertical epics/features cutting across system boundaries
- Each slice delivers complete functional requirement end-to-end
- Prioritizes expediency, quality, and tracking over strict system isolation during development
- Ensures deliverable increments satisfy user-facing functionality

**Implementation:**
- Design phase produces system decomposition and interface contracts
- Analysis and Config phases organize work into vertical feature slices
- Feature slices may span multiple systems but remain cohesive functional units
- Traceability maintains mappings between vertical slices and horizontal system boundaries

### 10. Operational Resilience
**Definition:** Framework must maintain operational integrity and support recovery under failure conditions.

**Failure Scenarios:**
- Robot crashes or disconnections during task execution
- Missing or corrupted framework documents
- Broken document references or invalid UIDs
- Incomplete phase outputs due to interrupted processes
- Inconsistent state across distributed robot operations

**Resilience Requirements:**
- Tasks must be resumable after robot failure
- Document corruption must be detectable and recoverable
- Missing dependencies must be identifiable before task initiation
- State must be reconstructible from artifact trail
- Partial progress must not corrupt framework integrity

**Implementation:**
- Atomic task definitions enable clean resumption points
- Mandatory revision logs support rollback to known-good states
- Document validation checks detect corruption/incompleteness before use
- Dependency declarations in documents enable pre-flight checks
- Central orchestrator maintains authoritative task state independent of robot lifespan
- Framework documents stored in version control for recovery
- Critical artifacts include checksums or validation metadata

### 11. Sponsor Interaction
**Definition:** The framework maintains structured communication with the project sponsor throughout operation to ensure alignment, resolve ambiguities, and obtain necessary approvals.

**Communication Types:**

**Progress Reporting:**
- Regular status updates on phase progression
- Milestone completion notifications
- Risk and blocker escalations

**Clarification Requests:**
- Ambiguous or conflicting requirements identified during Analysis
- Missing information required for Design or Config decisions
- Edge cases not addressed in source materials

**Approval Gates:**
- Phase transition approvals for critical gates
- Amendment approvals for changes to prior phase outputs
- Design decision approvals with significant impact

**Implementation:**
- Roma (Orchestrator) serves as primary sponsor communication channel
- Escalation protocols define when to engage sponsor vs. resolve internally
- Decision authority boundaries specify robot autonomy limits
- Communication logged in activity system for traceability
- **Reference:** ROME-PROC-002 (Sponsor Interaction Protocol)

### 12. Iterative Refinement
**Definition:** The framework accommodates product evolution through controlled refinement mechanisms, both within a single ROME cycle and across multiple cycles.

**Refinement Modes:**

**12a. Intra-Process Refinement (Amendments)**
Modifications during an active ROME cycle.

- Triggered by: clarifications, discovered conflicts, sponsor feedback
- Mechanism: Amendment entries in activity log
- Requires: Approval before implementation
- Scope: Changes propagate forward through remaining phases
- Impact analysis mandatory before approval

**12b. Inter-Process Refinement (New Cycle)**
Major modifications requiring a fresh ROME cycle.

- Triggered by: significant scope changes, post-deployment enhancements, new feature requests
- Mechanism: New ROME process initiated with modified inputs
- Relationship: New cycle references prior cycle artifacts as baseline
- Versioning: Application version incremented (v1.0 → v2.0)

**Threshold Criteria:**
| Use Amendment (Intra) | Use New Cycle (Inter) |
|-----------------------|-----------------------|
| Clarification of existing requirement | New functional requirements |
| Bug fix to specification | Architectural changes |
| Minor scope adjustment | Technology stack changes |
| Single-phase impact | Multi-phase cascade required |

**Implementation:**
- Amendment workflow defined in ROME-PROC-005
- Impact analysis procedures in phase operations-guidelines
- Version control maintains relationship between cycles
- Traceability links refinements to source decisions

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-20T00:00:00Z | Initial document creation |
