ROME Framework: Lexicon
Document UID: ROME-LEX-001
Status: Draft
Document Type: Foundation

## Purpose
Centralized definition of all framework-specific terms to ensure terminological integrity and prevent semantic conflicts.

## Terms

### Framework Structure

**ROME (Methodology Framework)**
- Multi-agent orchestration system enabling Claude Code instances to transform user requirements into executable applications through defined phases
- Scope: Entire methodology from requirements intake to code generation

**Phase**
- Discrete transformation stage with explicit entry criteria, outputs, and exit criteria
- Phases execute sequentially: Ingest → Analysis → Design → Config → Generation
- Scope: Major process divisions within ROME

**Quality Gate**
- Validation checkpoint guarding phase transitions
- Enforces exit criteria before allowing progression to next phase
- Scope: Phase boundary control mechanism

### Phases

**Phase 0 (Ingest)**
- Intake and preliminary structuring of raw user materials (PRDs, BRDs, notes)
- Output: Organized input corpus ready for analysis

**Phase 1 (Analysis)**
- Transformation of raw inputs into atomic logical requirements
- Output: Structured requirement artifacts

**Phase 2 (Design)**
- Conversion of requirements into architectural schemas and logic flows
- Output: System design specifications

**Phase 3 (Config)**
- Definition of technical constraints, environment variables, scaffolding instructions
- Output: Implementation configuration specifications

**Phase 4 (Generation)**
- Mechanical production of executable code based strictly on Phase 3 outputs
- Output: Executable application code

### Agents & Roles

**Robot**
- Autonomous Claude Code session executing specific tasks within defined operational boundaries
- Characteristics: task-assigned, role-defined, centrally coordinated, rule-constrained
- Scope: Individual agent instance performing framework work

**Orchestrator**
- Designated robot managing phase transitions, process integrity, and multi-agent coordination
- Enforces quality gate compliance and maintains process flow
- Scope: Central coordination authority

### Documents

**UID (Unique Identifier)**
- Stable document identifier persisting across revisions
- Format: ROME-[TYPE]-[NUMBER] (e.g., ROME-DEF-001)
- Scope: Document identification system

**PRD (Product Requirements Document)**
- User-provided specification of desired application functionality
- Scope: Input artifact type

**BRD (Business Requirements Document)**
- User-provided specification of business objectives and constraints
- Scope: Input artifact type

**Revision Log**
- Mandatory document section recording version history
- Required fields: Revision Number, Timestamp (ISO 8601), Summary of Changes
- Location: Bottom of each document
- Scope: Document versioning mechanism

### Core Concepts

**Traceability**
- Ability to track transformation steps from source requirements through to generated code
- Implemented via versioned artifacts, logging, and source references
- Scope: Process transparency and audit capability

**Single Source of Truth**
- Principle requiring critical shared resources to maintain singular authoritative versions
- Applies to: Data Dictionary, Technical Specifications, Action Lists, Lexicon
- Scope: Information consistency control

**Atomic Requirement**
- Indivisible logical requirement unit produced during Analysis phase
- Cannot be further decomposed without losing semantic coherence
- Scope: Minimum granularity unit for requirements

**Terminological Integrity**
- Property ensuring framework terms are distinct, non-overlapping, and unambiguous
- Enforced through centralized lexicon and conflict detection
- Scope: Framework-wide vocabulary management

**LLM Optimization**
- Design principle requiring terse, high-signal content optimized for Large Language Model interpretation
- Excludes conversational filler, decorative prose, superfluous text
- Scope: All framework document content

### Technical Artifacts

**Data Dictionary**
- Centralized single-source-of-truth document defining data entities, attributes, and relationships
- Scope: Data model authority

**Technical Specification**
- Centralized document defining technical constraints, platform requirements, and implementation parameters
- Scope: Technical constraints authority

**Action List**
- Centralized task inventory used for robot task assignment
- Scope: Task management and coordination

**Glossary**
- Mapping between framework-specific terms and standard software engineering terminology where overlap exists
- Scope: External terminology alignment reference

### Activity Tracking

**Activity Log**
- Centralized tracking system recording work item status, blockers, amendments, and phase progress
- Implemented via activity-log MCP server with MongoDB backend
- Scope: Project activity state management and robot coordination

**Feature Entry**
- Activity log entry tracking feature-level work across a specific layer
- ID Pattern: FEAT-###-db|api|ui (e.g., FEAT-001-api)
- Required fields: id, type, feature, featureName, phase, layer, robot, status
- Scope: Feature-level work tracking

**Story Entry**
- Activity log entry tracking user story implementation within a feature
- ID Pattern: STORY-###-#-#-db|api|ui (e.g., STORY-001-1-1-api)
- Hierarchical relationship to parent feature
- Scope: Story-level work tracking

**Blocker Entry**
- Activity log entry documenting an impediment preventing work progress
- ID Pattern: BLOCK-### (e.g., BLOCK-001)
- Status values: OPEN, ESCALATED, RESOLVED
- Scope: Impediment tracking and resolution

**Amendment Entry**
- Activity log entry documenting a change request to prior phase work
- ID Pattern: AMD-### (e.g., AMD-001)
- Status values: PENDING_REVIEW, APPROVED, REJECTED
- Requires approval before implementation
- Scope: Change control and impact tracking

**Phase Entry**
- Activity log entry tracking phase-level status and gate decisions
- ID Pattern: PHASE-# (e.g., PHASE-2)
- Status values: NOT_STARTED, IN_PROGRESS, COMPLETED
- Scope: Phase progression tracking

**Layer**
- Implementation dimension categorizing work by technical tier
- Values: database, backend, frontend
- Used in feature and story entry IDs to indicate scope
- Scope: Technical tier classification

**Activity Status**
- State of a work item in the activity log
- Work item statuses: PENDING, IN_PROGRESS, COMPLETED, BLOCKED
- Blocker statuses: OPEN, ESCALATED, RESOLVED
- Amendment statuses: PENDING_REVIEW, APPROVED, REJECTED
- Phase statuses: NOT_STARTED, IN_PROGRESS, COMPLETED
- Scope: Work item state machine

**Logging Trigger**
- Event requiring mandatory activity log update
- Examples: work start, work completion, blocker encountered, amendment requested
- Defined in ROME-PROC-005 (Activity Logging Protocol)
- Scope: Activity log update requirements

## Term Usage Constraints

**Prohibited Overlaps:**
- Do not use "phase" to refer to project management phases external to ROME
- Do not use "robot" to refer to RPA (Robotic Process Automation) systems
- Do not use "quality gate" to refer to CI/CD pipeline gates unless explicitly integrating ROME with CI/CD

**Alignment with Standard Terminology:**
- "Requirements" aligns with standard software engineering usage
- "Architecture" aligns with standard software engineering usage
- "Code Generation" aligns with standard software engineering usage
