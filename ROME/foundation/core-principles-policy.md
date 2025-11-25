# ROME Framework: Core Principles Policy

| Field | Value |
|-------|-------|
| **Document UID** | ROME-IMPL-001 |
| **Version** | 1.0 |
| **Date** | 2025-11-20T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Foundation |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

## Purpose
Defines policies that operationalize core principles from `core-principles.md` (ROME-PRIN-001) across the application development lifecycle. Each phase applies these policies through specific procedures documented in phase-specific `operations-guidelines.md` files under `./life-cycle/`.

## Phase-Specific Implementation

### Phase Bootup: Framework Setup

**Purpose:** Initialize framework infrastructure and establish operational foundation before project-specific work begins.

**Principle Applications:**


 //TODO: Archie to add section on Consistency and Reproceability, given same inputs (or same intent) with same transformation proc will lead to
// to the same outcome or ouputs.

#### 1. Flexibility & Adaptability
- Framework directory structure created to support non-breaking additions
- Document templates established with extensible schemas
- Configuration supports multiple project types without structural changes
- **Reference:** `./life-cycle/00-bootup/structure-specification.md`

#### 2. Traceability

**2a. Work Traceability (Operational):**
- Activity logging infrastructure initialized (activity-log MCP server)
- Robot coordination protocols established
- Task status tracking mechanisms configured
- Phase entry templates prepared for progress monitoring
- **Reference:** ROME-PROC-005 (`/ROME/robot-templates/robot-operations-protocols/activity-logging-protocol.md`)

**2b. Framework Traceability (Structural):**
- Version control initialization for all framework documents
- Document UID registry initialized
- Inter-document reference validation configured
- Revision log templates established
- **Reference:** `./life-cycle/00-bootup/traceability-setup.md`

#### 3. Quality Assurance
- Document validation schemas installed
- Quality gate definitions established for all phases
- Exit criteria templates created
- **Reference:** `./life-cycle/00-bootup/quality-gates.md`

#### 4. Phase Decomposition
- Phase folder structure created (`./life-cycle/00-bootup/`, `./life-cycle/01-ingest/`, etc.)
- Phase boundary definitions documented
- Phase transition protocols established
- **Reference:** `./life-cycle/00-bootup/phase-definitions.md`

#### 5. Central Orchestration
- Orchestrator robot role definition created
- Task list infrastructure initialized
- Phase transition authority assigned to orchestrator
- **Reference:** `./life-cycle/00-bootup/orchestrator-spec.md`

#### 6. Single Source of Truth
- Central document locations established:
  - Data Dictionary placeholder created
  - Technical Specifications template initialized
  - Action List structure defined
- **Reference:** `./life-cycle/00-bootup/ssot-locations.md`

#### 7. Robot Architecture
- Robot role definition templates created
- Task assignment protocols established
- Rule set framework initialized
- **Reference:** `./life-cycle/00-bootup/robot-roles.md`

#### 8. Terminological Integrity
- Lexicon initialized with framework-specific terms
- Glossary structure established
- Term validation procedures defined
- **Reference:** `./foundation/lexicon.md` (ROME-LEX-001)

#### 9. Modularity & Vertical Slicing
- System decomposition templates prepared
- Feature slice tracking structures initialized
- Mapping framework between horizontal/vertical established
- **Reference:** `./life-cycle/00-bootup/decomposition-templates.md`

#### 10. Operational Resilience
- Checkpoint mechanisms configured
- Recovery procedures documented
- Document validation infrastructure installed
- Version control configured for rollback capability
- **Reference:** `./life-cycle/00-bootup/resilience-protocols.md`

---

### Phase 1: Ingest

**Purpose:** Intake and organize raw user materials (PRDs, BRDs, notes) into structured corpus.

#### 1. Flexibility & Adaptability
- Multiple input format handlers (markdown, PDF, plaintext, structured documents)
- Schema-agnostic initial storage
- Tagging system supports arbitrary categorization
- **Reference:** `./life-cycle/01-ingest/input-handling.md`

#### 2. Traceability

**2a. Work Traceability (Operational):**
- Log phase entry when Ingest begins (PHASE-1)
- Log feature/story entries for all ingestion tasks
- Update status at each transition (PENDING → IN_PROGRESS → COMPLETED)
- Log blockers immediately upon discovery
- **Reference:** ROME-PROC-005

**2b. Framework Traceability (Structural):**
- Source document checksums recorded
- Ingestion timestamp logged
- Original-to-processed mappings maintained
- **Reference:** `./life-cycle/01-ingest/traceability.md`

#### 3. Quality Assurance
- Input completeness validation
- Duplicate detection
- Missing dependency identification
- Exit criteria: All source materials catalogued and accessible
- **Reference:** `./life-cycle/01-ingest/quality-gates.md`

#### 4. Phase Decomposition
- Clear handoff to Analysis phase defined
- Input corpus structure specified
- **Reference:** `./life-cycle/01-ingest/phase-boundaries.md`

#### 5. Central Orchestration
- Orchestrator validates input completeness before phase transition
- **Reference:** `./life-cycle/01-ingest/orchestration.md`

#### 6. Single Source of Truth
- Ingested materials stored in canonical location
- Single authoritative copy of each source document
- **Reference:** `./life-cycle/01-ingest/storage-locations.md`

#### 7. Robot Architecture
- Ingest robot role defined with specific input handling rules
- **Reference:** `./life-cycle/01-ingest/robot-spec.md`

#### 8. Terminological Integrity
- Terms from source documents not yet normalized (occurs in Analysis)
- Ambiguity flagged for resolution
- **Reference:** `./life-cycle/01-ingest/terminology-handling.md`

#### 9. Modularity & Vertical Slicing
- Not primary concern during Ingest
- Source materials tagged for future feature mapping
- **Reference:** `./life-cycle/01-ingest/feature-tagging.md`

#### 10. Operational Resilience
- Partial ingestion resumable from checkpoint
- Source materials remain immutable
- **Reference:** `./life-cycle/01-ingest/recovery.md`

---

### Phase 2: Analysis

**Purpose:** Transform raw inputs into atomic logical requirements.

#### 1. Flexibility & Adaptability
- Requirement schema supports extension attributes
- Atomic requirements support refinement without invalidation
- **Reference:** `./life-cycle/02-analysis/requirement-schema.md`

#### 2. Traceability

**2a. Work Traceability (Operational):**
- Log phase entry when Analysis begins (PHASE-2)
- Log feature/story entries for all analyzed requirements
- Create entries for identified atomic requirements
- Log blockers for ambiguous requirements or conflicting specs
- Log amendments for changes to ingested materials
- **Reference:** ROME-PROC-005

**2b. Framework Traceability (Structural):**
- Each atomic requirement references source material location
- Transformation decisions logged
- **Reference:** `./life-cycle/02-analysis/traceability.md`

#### 3. Quality Assurance
- Atomic requirement validation rules
- Completeness checks against source material
- Ambiguity detection mechanisms
- Exit criteria: All source content represented as atomic requirements
- **Reference:** `./life-cycle/02-analysis/quality-gates.md`

#### 4. Phase Decomposition
- Handoff to Design phase requires validated requirement set
- **Reference:** `./life-cycle/02-analysis/phase-boundaries.md`

#### 5. Central Orchestration
- Orchestrator validates requirement completeness
- **Reference:** `./life-cycle/02-analysis/orchestration.md`

#### 6. Single Source of Truth
- Requirement repository is authoritative source
- **Reference:** `./life-cycle/02-analysis/requirement-repository.md`

#### 7. Robot Architecture
- Analysis robot constrained to requirement extraction, not design
- **Reference:** `./life-cycle/02-analysis/robot-spec.md`

#### 8. Terminological Integrity
- Terms normalized against Lexicon
- New domain terms added to Data Dictionary
- **Reference:** `./life-cycle/02-analysis/terminology-normalization.md`

#### 9. Modularity & Vertical Slicing
- Requirements tagged for feature slice membership
- Cross-system requirements identified
- **Reference:** `./life-cycle/02-analysis/feature-mapping.md`

#### 10. Operational Resilience
- Requirement extraction resumable per source document
- Partial requirement sets marked incomplete
- **Reference:** `./life-cycle/02-analysis/recovery.md`

---

### Phase 3: Design

**Purpose:** Convert requirements into architectural schemas and logic flows.

#### 1. Flexibility & Adaptability
- Design artifacts support iterative refinement
- Architecture supports multiple implementation strategies
- **Reference:** `./life-cycle/03-design/design-flexibility.md`

#### 2. Traceability

**2a. Work Traceability (Operational):**
- Log phase entry when Design begins (PHASE-2a for design, PHASE-2b for quality gate)
- Log feature entries for architectural design work per layer
- Log story entries for detailed design specifications
- Log blockers for design conflicts or unresolved dependencies
- Log amendments for required changes to analyzed requirements
- Sarah logs quality gate review findings
- **Reference:** ROME-PROC-005

**2b. Framework Traceability (Structural):**
- Design elements reference atomic requirements
- Architectural decisions logged with rationale
- **Reference:** `./life-cycle/03-design/traceability.md`

#### 3. Quality Assurance
- Architecture validation against requirements
- Design completeness checks
- Interface contract validation
- Exit criteria: All requirements addressed in design
- **Reference:** `./life-cycle/03-design/quality-gates.md`

#### 4. Phase Decomposition
- Design outputs structured for Config phase consumption
- **Reference:** `./life-cycle/03-design/phase-boundaries.md`

#### 5. Central Orchestration
- Orchestrator validates design completeness
- **Reference:** `./life-cycle/03-design/orchestration.md`

#### 6. Single Source of Truth
- Architectural schema is authoritative design reference
- **Reference:** `./life-cycle/03-design/architecture-repository.md`

#### 7. Robot Architecture
- Design robot constrained to architectural decisions, not implementation
- **Reference:** `./life-cycle/03-design/robot-spec.md`

#### 8. Terminological Integrity
- Technical terms validated against Lexicon
- System/component naming conventions enforced
- **Reference:** `./life-cycle/03-design/terminology-enforcement.md`

#### 9. Modularity & Vertical Slicing
- **Primary phase for horizontal (system) modularity**
- System decomposition produced
- Interface contracts defined
- Feature slices mapped to system boundaries
- **Reference:** `./life-cycle/03-design/modularity-specification.md`

#### 10. Operational Resilience
- Design artifacts versioned
- Partial designs marked incomplete
- **Reference:** `./life-cycle/03-design/recovery.md`

---

### Phase 4: Config

**Purpose:** Define technical constraints, environment variables, scaffolding instructions.

#### 1. Flexibility & Adaptability
- Configuration supports multiple deployment targets
- Environment-specific overrides supported
- **Reference:** `./life-cycle/04-config/configuration-flexibility.md`

#### 2. Traceability

**2a. Work Traceability (Operational):**
- Log phase entry when Config begins (PHASE-3)
- Log feature entries for configuration work per layer
- Log story entries for specific technical constraint definitions
- Log blockers for environment conflicts or missing dependencies
- Log amendments for required changes to design specifications
- **Reference:** ROME-PROC-005

**2b. Framework Traceability (Structural):**
- Configuration decisions reference design elements
- Environment constraints logged
- **Reference:** `./life-cycle/04-config/traceability.md`

#### 3. Quality Assurance
- Configuration validation against design
- Constraint consistency checks
- Exit criteria: Complete, consistent configuration for Generation phase
- **Reference:** `./life-cycle/04-config/quality-gates.md`

#### 4. Phase Decomposition
- Configuration outputs drive mechanical code generation
- **Reference:** `./life-cycle/04-config/phase-boundaries.md`

#### 5. Central Orchestration
- Orchestrator validates configuration completeness
- **Reference:** `./life-cycle/04-config/orchestration.md`

#### 6. Single Source of Truth
- Technical Specifications document is authoritative
- **Reference:** `./life-cycle/04-config/technical-specs.md`

#### 7. Robot Architecture
- Config robot constrained to technical parameter specification
- **Reference:** `./life-cycle/04-config/robot-spec.md`

#### 8. Terminological Integrity
- Technical terminology validated
- Platform-specific terms documented
- **Reference:** `./life-cycle/04-config/terminology-validation.md`

#### 9. Modularity & Vertical Slicing
- **Primary phase for vertical (feature) slicing**
- Feature slices organized for generation
- Cross-system configurations coordinated
- **Reference:** `./life-cycle/04-config/feature-slice-organization.md`

#### 10. Operational Resilience
- Configuration checkpoints enable recovery
- Partial configurations marked incomplete
- **Reference:** `./life-cycle/04-config/recovery.md`

---

### Phase 5: Generation

**Purpose:** Mechanical production of executable code based strictly on Phase 3 outputs.

#### 1. Flexibility & Adaptability
- Code generation templates support multiple languages/frameworks
- Generated code structure supports post-generation modification
- **Reference:** `./life-cycle/05-generation/generation-flexibility.md`

#### 2. Traceability

**2a. Work Traceability (Operational):**
- Log phase entry continuation (PHASE-3 continuation)
- Log feature entries for code generation work per layer
- Log story entries for specific component/module generation
- Log blockers for generation errors or config mismatches
- Log amendments for required changes to configuration specifications
- Phase completion requires logging completeness verification by Roma
- **Reference:** ROME-PROC-005

**2b. Framework Traceability (Structural):**
- Generated code includes references to configuration sources
- Generation process logged
- **Reference:** `./life-cycle/05-generation/traceability.md`

#### 3. Quality Assurance
- Generated code validation (syntax, compilation, tests)
- Completeness checks against configuration
- Exit criteria: Executable, tested application
- **Reference:** `./life-cycle/05-generation/quality-gates.md`

#### 4. Phase Decomposition
- Final phase; outputs complete application
- **Reference:** `./life-cycle/05-generation/phase-boundaries.md`

#### 5. Central Orchestration
- Orchestrator validates generation completeness
- **Reference:** `./life-cycle/05-generation/orchestration.md`

#### 6. Single Source of Truth
- Generated codebase is authoritative application artifact
- **Reference:** `./life-cycle/05-generation/codebase-repository.md`

#### 7. Robot Architecture
- Generation robot constrained to mechanical code production
- No design decisions permitted
- **Reference:** `./life-cycle/05-generation/robot-spec.md`

#### 8. Terminological Integrity
- Code identifiers follow naming conventions
- Generated documentation uses consistent terminology
- **Reference:** `./life-cycle/05-generation/code-conventions.md`

#### 9. Modularity & Vertical Slicing
- Code generated per feature slice
- System boundaries enforced through generated interfaces
- **Reference:** `./life-cycle/05-generation/modular-generation.md`

#### 10. Operational Resilience
- Generation resumable per feature slice
- Generated code validated before commit
- **Reference:** `./life-cycle/05-generation/recovery.md`

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-20T00:00:00Z | Initial document creation |
