# ROME Framework: Core Principles

**Document UID:** ROME-PRIN-001  

**Version:** 1.2

**Date:** 2026-09-17T00:00:00Z

**Status:** Draft

**Document Type:** Foundation

**Author:** Framework Analyst & Architect

--------------------

## Purpose
Defines the modus operandi of ROME for all Roles and Instances operating within the framework. Particularly critical for the Framework Analyst & Architect, who ensures framework consistency and relevance as it evolves.

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
- Enable coordination across Instances
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
**Definition:** Requirements-to-code transformation occurs through discrete phases in a fixed order. The phase catalog is defined in ROME-LEX-001 (Phases); `lifecycle.js` (`PHASES`) is authoritative.

**Phases:**
- **P0 (Bootup)**: Framework initialization and project setup. Ungated.
- **P0.5 (Intake)**: Input characterization and routing. Optional.
- **P1 (AORDL)**: Capture and validation of structured requirements in Actor-Oriented Requirements Definition Language (AORDL) format
- **P2 (Analysis)**: Functional decomposition, entity extraction, and user story generation from AORDL requirements
- **P3 (Design)**: Converting requirements into architectural schemas and logic flows
- **P3.5 (Prototype)**: Visual prototyping and sponsor visual approval. Optional.
- **P4 (Config)**: Defining technical constraints, environment variables, scaffolding instructions
- **P5 (Generation)**: Mechanical production of executable code from P4 outputs

**Order rule:** Routing selects which phases a project runs, once, at intake. Optional phases may be omitted; no phase may be reordered, and no routed phase may be jumped (ROME-AX-06).

### 5. Central Orchestration
**Definition:** One Orchestrator maintains process integrity and coordination across all Instances.

**Implementation:**
- The Orchestrator (Roma) is a distinguished Role. It spawns every Instance and drives phase transitions.
- It does not produce artifacts and does not approve gates.
- Phase transitions are decided by the deterministic guard (`guard.js`), not by the Orchestrator's judgement (ROME-STD-GATE).
- Project state is held in `state.json`, independent of any Instance's lifespan.

### 6. Single Source of Truth
**Definition:** Critical shared resources maintain singular, authoritative versions.

**Implementation:**
- Centralized documents for:
  - Data Dictionary
  - Technical Specifications
  - Action Lists
- All agents reference canonical versions
- Updates propagate from single source

### 7. Role Architecture
**Definition:** Work is done by Instances, each spawned by the Orchestrator from a Role. A Role is a capability definition; an Instance is one sub-agent filling one Role for its lifetime (ROME-STD-AGENT-ROLES).

**Characteristics:**
- Roles are producers, validators, gate authority, or the Orchestrator.
- Instances run inside the Orchestrator's session with isolated context and scoped tools. They are not separate sessions.
- Many Instances may fill the same Role at once.
- Domain knowledge is injected from Expert packs, not duplicated as skills.
- Each Role's scope is limited to its assigned phase(s).

**Implementation:**
- Each Role is defined in `ROME/agents/<role>/` (`ROBOT.md`, `modes/`, `skills/`).
- Only the Orchestrator spawns Instances; Instances do not spawn peers (ROME-AX-14).
- Producer, validator, and gate authority are separate Roles (ROME-AX-13).
- An Instance finishes by returning a validated structured result; this return is its progress record.
- Framework maintenance (Archie) is not a Role and is never spawned.

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
- Instance crashes or disconnections during task execution
- Missing or corrupted framework documents
- Broken document references or invalid UIDs
- Incomplete phase outputs due to interrupted processes
- Inconsistent state across concurrent Instances

**Resilience Requirements:**
- Tasks must be resumable after Instance failure
- Document corruption must be detectable and recoverable
- Missing dependencies must be identifiable before task initiation
- State must be reconstructible from artifact trail
- Partial progress must not corrupt framework integrity

**Implementation:**
- Atomic task definitions enable clean resumption points
- Mandatory revision logs support rollback to known-good states
- Document validation checks detect corruption/incompleteness before use
- Dependency declarations in documents enable pre-flight checks
- Central orchestrator maintains authoritative task state independent of Instance lifespan
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
- Decision authority boundaries specify Role autonomy limits
- Communication logged in activity system for traceability
- **Reference:** ROME-GOV-006 (Sponsor Interaction)

### 12. Iterative Refinement
**Definition:** The framework accommodates product evolution through three controlled refinement mechanisms, scoped by cycle status and change magnitude.

**12a. Intra-Process Refinement (AMD-###)**
Modifications during an active ROME cycle (P0–P5 not yet completed).

- Triggered by: clarifications, discovered conflicts, sponsor feedback
- Mechanism: Amendment entries (`AMD-###`) in activity log
- Requires: Roma approval before implementation
- Scope: Changes propagate forward through remaining phases
- Impact analysis mandatory before approval

**12b. Post-Delivery Change Request (CR-###)**
Contained changes after the ROME cycle is complete and the application is deployed.

- Triggered by: post-delivery requirement changes, terminology corrections, schema additions, logic fixes
- Mechanism: Change Request documents (`CR-###.yaml`) in `ARTIFACTS/changes/`; `CHANGE_REQUEST` entries in activity log
- Requires: Sarah approval; full impact analysis including library and pipeline sections; rollback plan
- Scope: Traceability chain must be preserved; `ChangeHistory` entries added to all modified artifacts
- Reference: Change Request Protocol, ROME-GOV-011

**12c. Inter-Process Refinement (New Cycle)**
Major modifications requiring a full ROME cycle replay.

- Triggered by: significant scope changes, new feature sets, re-architecture
- Mechanism: New ROME process initiated with modified inputs
- Relationship: New cycle references prior cycle artifacts as baseline
- Versioning: Application version incremented (v1.0 → v2.0)

**Threshold Decision:**
```
Is the ROME cycle (P0–P5) still active?
  YES → Use AMD-### (12a: Intra-Process Amendment)
  NO: Is the change contained (no full re-architecture required)?
    YES → Use CR-### (12b: Post-Delivery Change Request)
    NO  → Use New Cycle (12c: Inter-Process Refinement)
```

**Implementation:**
- AMD-### workflow: ROME-GOV-BASELINE-B, ROME-PROC-005
- CR-### workflow: Change Request Protocol, ROME-GOV-003
- New Cycle: version control maintains relationship between cycles; traceability links refinements to source decisions

---

## Revision History

| Version | Date (ISO 8601) | Summary |
|---------|-----------------|---------|
| 1.0 | — | Initial issue. (Reconstructed entry.) |
| 1.1 | 2026-02-27T00:00:00Z | Reconstructed entry; change content not recorded. |
| 1.2 | 2026-09-17T00:00:00Z | Category 4 modification, sponsor-approved. Principle 4: phase list aligned to ROME-LEX-001 (adds P0, P0.5, P3.5; order rule per AX-06). Principle 5: Orchestrator restated as a Role that spawns Instances; guard decides transitions. Principle 7: "Robot Architecture" (autonomous sessions) replaced by "Role Architecture" (Role + Instance per ROME-STD-AGENT-ROLES). Remaining "robot" wording in Principles 2, 10, 11 and Purpose replaced with Role/Instance. Revision history added. |
