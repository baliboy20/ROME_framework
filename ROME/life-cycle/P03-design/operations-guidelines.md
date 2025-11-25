# Phase 3 - Design: Operations Guidelines

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PHASE-004 |
| **Version** | 1.1 |
| **Date** | 2025-11-24T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Phase Specification |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines WHAT Phase 3 (Design) must accomplish, including entry/exit criteria, required outputs, and quality gates. Robot-specific procedures (HOW) are defined in PMA's CLAUDE.md.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Phase Decomposition, Modularity & Vertical Slicing
- ROME-PROC-005 (Activity Logging Protocol) - Logging requirements
- ROME-PROC-006 (Quality Gate Protocol) - GATE-P3 requirements
- ROME-ROBOT-003 (PMA) - Primary robot for this phase
- ROME-PHASE-003 (P2 Analysis) - Predecessor phase

---

## Phase Overview

| Attribute | Value |
|-----------|-------|
| Phase Number | P3 |
| Phase Name | Design |
| Primary Robot | PMA (Project Manager/Architect) |
| Supporting Robot | Clara (UX Designer) - optional |
| Predecessor | P2 (Analysis) |
| Successor | P4 (Config) |
| Quality Gate | GATE-P3 (Sarah audit required) |

**Objective:** Transform structured requirements into concrete, implementable system architecture with technology decisions, data model, API design, and actionable work breakdown.

**Scope:** This phase INCLUDES:
- Technology stack selection and justification
- System architecture design
- Data dictionary creation (single source of truth)
- API design specification
- Use case elaboration
- Work breakdown (actionlist)
- Test data specification (requirements only, not generation)
- Workspace definitions
- UX design coordination (if required)

**Out of Scope:**
- Code implementation (P5)
- Environment configuration (P4)
- Requirements extraction (P2)
- Test data generation (P4/P5)

---

## Phase Workflow Structure

Phase 3 operates in **iterative refinement cycles** rather than strict linear steps. The workflow consists of three stages:

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE 1: FOUNDATION                          │
│  Sponsor Kickoff → External Docs → Tech Stack Selection         │
│                         ↓                                       │
│              [Sponsor Alignment Loop]                           │
│                         ↓                                       │
├─────────────────────────────────────────────────────────────────┤
│                    STAGE 2: CORE DESIGN                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              DESIGN REFINEMENT CYCLE                      │   │
│  │                                                           │   │
│  │   Data Dictionary ←──→ API Design ←──→ Use Cases         │   │
│  │         ↑                  ↑               ↑              │   │
│  │         └────────┬─────────┴───────────────┘              │   │
│  │                  ↓                                        │   │
│  │         [UX Design Loop - if Clara assigned]              │   │
│  │                  ↓                                        │   │
│  │         System Architecture                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         ↓                                       │
│              [Sponsor Review Checkpoint]                        │
│                         ↓                                       │
├─────────────────────────────────────────────────────────────────┤
│                    STAGE 3: FINALIZATION                        │
│  Work Breakdown → Test Data Spec → Handover → Gate Review       │
└─────────────────────────────────────────────────────────────────┘
```

### Stage 1: Foundation

**Purpose:** Establish design direction with sponsor alignment before detailed work.

| Activity | Output | Iteration Trigger |
|----------|--------|-------------------|
| Sponsor kickoff | Design approach agreement | Sponsor requests changes |
| External docs gathering | external-references.md | New sources identified |
| Tech stack selection | tech-stack.md (draft) | Validation failure, sponsor feedback |

**Exit to Stage 2:** Sponsor approves design direction.

### Stage 2: Core Design (Iterative)

**Purpose:** Develop interconnected design artifacts with refinement loops.

**Design Refinement Cycle:**

The following artifacts are interdependent and may require multiple passes:

| Artifact | Depends On | May Trigger Update To |
|----------|------------|----------------------|
| Data Dictionary | Requirements | API Design, Use Cases |
| API Design | Data Dictionary | Use Cases, Data Dictionary |
| Use Cases | Data Dictionary, API | Data Dictionary, API Design |
| System Architecture | All above | Tech Stack |

**Iteration Rules:**
- When updating Data Dictionary → review API Design for consistency
- When updating API Design → verify Data Dictionary types match
- When updating Use Cases → confirm API endpoints exist
- Cycle until all artifacts are internally consistent

**UX Design Loop (if Clara assigned):**

| Clara Input | Clara Output | PMA Integration |
|-------------|--------------|-----------------|
| User stories, Data dictionary | Wireframes, UI specs | use-cases.md UI sections |
| Use case flows | Interaction patterns | API design validation |
| Data dictionary fields | Form designs | Validation rules refinement |

**Iteration with Clara:**
1. PMA provides initial use cases + data dictionary
2. Clara produces UI designs
3. PMA reviews for data/API alignment
4. If misalignment → update artifacts → Clara re-reviews
5. Repeat until converged

**Exit to Stage 3:** All design artifacts consistent + Sponsor review passed.

### Stage 3: Finalization

**Purpose:** Complete implementation planning artifacts.

| Activity | Output | Dependencies |
|----------|--------|--------------|
| Work breakdown | actionlist.md | All Stage 2 artifacts |
| Test data specification | test-data-specification.md | Data dictionary |
| Handover preparation | phase3-handover.md | All artifacts |
| Gate review | GATE-P3 | Handover complete |

**No iteration expected** - if Stage 2 is complete, Stage 3 is straightforward.

---

## Test Data: Specification vs Generation

### PMA Responsibility (P3): Specification

PMA specifies WHAT test data is needed:

| Specification Element | Description |
|----------------------|-------------|
| Entity coverage | Which entities need test data |
| Record quantities | Minimum records per entity |
| Relationship coverage | Required relationship patterns |
| Edge cases | Boundary conditions to test |
| Realistic examples | Sample values for each field |
| Validation scenarios | Data to test validation rules |

**Output:** `test-data-specification.md`

### P4/P5 Responsibility: Generation

Reena (P4) or generation robots (P5) CREATE actual test data:

| Generation Element | Description |
|-------------------|-------------|
| Seed scripts | Database seeding code |
| Fixture files | JSON/YAML test fixtures |
| Factory definitions | Test data factories |
| Migration data | Initial data for environments |

**PMA does NOT:** Write seed scripts, generate fixture files, or create test databases

---

## Entry Criteria

Phase 3 MAY NOT begin until ALL criteria are met:

| Criterion | Verification |
|-----------|--------------|
| P2 complete | PHASE-2 status = COMPLETED |
| GATE-P2 approved | Sarah audit passed |
| Requirements matrix exists | `requirements-matrix.yaml` complete |
| Handover received | `phase2-handover.md` complete |
| Technical requests available | Captured in handover Section 3 |
| Roma assignment | PMA assigned to P3 |
| PHASE-3 entry created | Activity log contains PHASE-3 |

---

## Exit Criteria

Phase 3 MAY NOT transition to P4 until ALL criteria are met:

| Criterion | Verification | Blocking |
|-----------|--------------|----------|
| Tech stack documented | `tech-stack.md` with justifications | Yes |
| Data dictionary complete | `data-dictionary.yaml` single source of truth | Yes |
| Data model documented | `data-model.md` with diagrams | Yes |
| API design complete | `api-design.md` with all endpoints | Yes |
| Use cases elaborated | `use-cases.md` for all features | Yes |
| System architecture | `system-architecture.md` with diagrams | Yes |
| Work breakdown complete | `actionlist.md` with workspaces and assignments | Yes |
| Test data specified | `test-data-specification.md` | Yes |
| All requirements covered | 100% mapping to architecture | Yes |
| Technical requests addressed | All sponsor tech requirements incorporated | Yes |
| Handover complete | `phase3-handover.md` with all sections | Yes |
| Activity log updated | PHASE-3 status = COMPLETED | Yes |
| Roma verification | Orchestrator confirms phase complete | Yes |
| **GATE-P3 APPROVED** | Sarah audit passed (ROME-PROC-006) | Yes |

---

## Quality Gates

**Note:** Internal quality gates (below) are validated by PMA during execution. GATE-P3 (Sarah audit) validates the complete phase output before P4 transition.

### Gate 1: Requirements Coverage

**Check:** Every requirement from P2 is addressed in architecture.

**Pass Criteria:**
- 100% of functional requirements mapped to use cases
- 100% of data requirements mapped to data dictionary
- All NFRs (performance, security, etc.) addressed in design
- Technical requests from sponsor incorporated

**Failure Action:** Identify gaps and update architecture

### Gate 2: Technology Validation

**Check:** All technology choices are actively maintained and appropriate.

**Pass Criteria:**
- Each technology validated (GitHub health, community)
- Justification documented for each choice
- Risks identified and mitigation planned
- Stack meets all requirements (performance, security, scale)

**Failure Action:** Re-evaluate technology choices

### Gate 3: Data Dictionary Completeness

**Check:** Data dictionary is single source of truth for all entities.

**Pass Criteria:**
- All entities from requirements present
- All fields have: database_type, api_type, ui_type
- All relationships defined
- All business rules documented
- All validations specified
- Examples provided for each field

**Failure Action:** Complete missing definitions

### Gate 4: Work Breakdown Completeness

**Check:** Actionlist provides complete implementation plan.

**Pass Criteria:**
- All workspaces defined with technology and owner
- All features mapped to workspaces
- All stories assigned to robots
- Estimates provided
- Dependencies documented
- Implementation order defined

**Failure Action:** Complete work breakdown

### Gate 5: Handover Readiness

**Check:** P4 (Config) and P5 (Generation) can proceed without architectural questions.

**Pass Criteria:**
- Handover document complete (all sections)
- Architecture decisions documented
- Data contracts clear
- API contracts clear
- Test data requirements specified

**Failure Action:** Complete handover sections

---

## Outputs

### Required Artifacts

| Artifact | Location | Description |
|----------|----------|-------------|
| tech-stack.md | `ARTIFACTS/dev/design/` | Technology choices with justification |
| data-dictionary.yaml | `ARTIFACTS/dev/design/` | Single source of truth for all data |
| data-model.md | `ARTIFACTS/dev/design/` | Conceptual entity model with diagrams |
| api-design.md | `ARTIFACTS/dev/design/` | Protocol-agnostic API specification |
| use-cases.md | `ARTIFACTS/dev/design/` | Detailed workflows for all features |
| system-architecture.md | `ARTIFACTS/dev/design/` | High-level architecture with diagrams |
| actionlist.md | `ARTIFACTS/dev/design/` | Workspaces and work breakdown |
| test-data-specification.md | `ARTIFACTS/dev/design/` | Realistic test data requirements |
| phase3-handover.md | `ARTIFACTS/dev/design/` | Complete handover for P4 |
| diagrams/ | `ARTIFACTS/dev/design/diagrams/` | Mermaid architecture diagrams |

### Technology Stack Schema

tech-stack.md MUST include:

| Section | Content |
|---------|---------|
| Technology Health | Validation that all technologies are active |
| Application Layer | Frontend technology with rationale |
| API Layer | Backend technology with rationale |
| Data Layer | Database technology with rationale |
| Additional Technologies | Hosting, CI/CD, monitoring |
| Alternatives Considered | Other options and why rejected |
| Trade-offs | Known compromises and mitigations |
| Risk Assessment | Technology risks and mitigations |

### Data Dictionary Schema

data-dictionary.yaml MUST define for each entity:

```yaml
entities:
  EntityName:
    description: "[Purpose]"
    table_name: "[database table]"

    fields:
      field_name:
        type: "[Logical type]"
        database_type: "[DB-specific type]"
        api_type: "[JSON type]"
        ui_type: "[Form input type]"
        required: true|false
        unique: true|false
        indexed: true|false
        sensitive: true|false
        pii: true|false
        description: "[Field purpose]"
        example: "[Sample value]"

    relationships:
      relationship_name:
        type: one-to-one|one-to-many|many-to-many
        target_entity: "[Entity name]"
        foreign_key: "[field]"
        on_delete: CASCADE|SET NULL|RESTRICT

    validations:
      field_name:
        - rule: required|format|min_length|max_length|pattern|unique|enum
          value: "[constraint value]"
          message: "[Error message]"

    business_rules:
      - id: "BR-ENTITY-###"
        description: "[Rule description]"
        level: critical|high|medium|low
        enforced_by: [database|api|ui]
```

### Actionlist Schema

actionlist.md MUST define:

```yaml
workspaces:
  - name: "[workspace-name]"
    type: application|api|data|shared
    technology: "[Framework/Language]"
    owner: "[robot name]"
    description: "[Purpose]"
    entry_point: "[main file/directory]"

features:
  FEAT-###:
    title: "[Feature name]"
    priority: HIGH|MEDIUM|LOW
    phase: MVP|future
    workspaces:
      workspace-name:
        - "[Work item 1]"
        - "[Work item 2]"
    assigned_to:
      robot-name:
        - story: "STORY-###"
          estimate: "[duration]"

phases:
  mvp:
    features: [FEAT-001, FEAT-002]
    duration: "[estimate]"

dependencies:
  - "[Dependency description]"
```

### Use Case Schema

Each use case MUST include:

```markdown
## UC-###: [Use Case Title]

**Actor**: [User role]
**Preconditions**: [Required state before]
**Postconditions**: [State after completion]

**Main Flow**:
1. [Step 1]
2. [Step 2]

**Alternative Flows**:
- [Condition]: [Alternative path]

**UI Requirements**:
- [UI element specifications]

**API Requirements**:
- [Endpoint]: [Method, payload, response]

**Data Requirements**:
- [Entity operations]
```

### Test Data Specification Schema

test-data-specification.md MUST define (specification only, not actual data):

```yaml
test_data_requirements:
  entities:
    EntityName:
      minimum_records: [N]
      required_scenarios:
        - scenario: "[Description]"
          purpose: "[What it tests]"

      field_examples:
        field_name:
          valid_examples: ["[value1]", "[value2]"]
          invalid_examples: ["[value1]", "[value2]"]
          edge_cases: ["[boundary value]"]

      relationship_coverage:
        - relationship: "[relationship_name]"
          scenarios:
            - "[e.g., Entity with 0 related records]"
            - "[e.g., Entity with many related records]"

  validation_test_cases:
    - entity: "[EntityName]"
      field: "[field_name]"
      rule: "[validation rule]"
      test_cases:
        - input: "[value]"
          expected: "PASS|FAIL"
          reason: "[why]"

  seed_data_notes:
    - "[Instructions for P4/P5 on generating this data]"
```

**Note:** PMA specifies requirements; Reena/generation robots create actual seed scripts and fixtures.

---

## 8 Dimensions Mapping

Architecture MUST address all 8 dimensions from requirements:

| Dimension | Architecture Artifact |
|-----------|----------------------|
| Functional | use-cases.md, actionlist.md |
| Data Model | data-dictionary.yaml, data-model.md |
| User Interface | use-cases.md (UI requirements), Clara deliverables |
| Integration | api-design.md, system-architecture.md |
| Security | tech-stack.md, api-design.md (auth), data-dictionary.yaml (PII) |
| Performance | tech-stack.md, system-architecture.md |
| Quality | test-data-specification.md, actionlist.md (testing) |
| Deployment | tech-stack.md (hosting), system-architecture.md |

---

## Traceability Requirements

### Requirements-to-Architecture Tracing

Every requirement MUST be traceable:

| From | To |
|------|----|
| Functional requirement | Use case |
| Data requirement | Data dictionary entity |
| UI requirement | Use case UI section |
| Integration requirement | API design |
| Security requirement | Tech stack + API auth |
| Performance requirement | Architecture decisions |
| Technical request | Tech stack decision |

### Decision Tracing

Every architecture decision MUST be traceable:

| Decision | Documentation |
|----------|---------------|
| Technology choice | tech-stack.md with rationale |
| Data model choice | data-model.md with justification |
| API pattern choice | api-design.md |
| Workspace structure | actionlist.md |

---

## Activity Logging Requirements

All robots operating in this phase MUST follow the Activity Logging Protocol:
- **ROME-PROC-005**: `/ROME/robot-templates/robot-operations-protocols/activity-logging-protocol.md`

### Phase-Specific Logging

| Event | Required Action |
|-------|-----------------|
| Phase begins | Update PHASE-3: status → IN_PROGRESS, startDate |
| Deliverable created | Log deliverable entry |
| Technology validated | Log validation result |
| Blocker encountered | Create BLOCK-### entry |
| Phase complete | Update PHASE-3: status → COMPLETED, completionDate |

### Feature Entry Creation

At phase completion, create feature entries for P4/P5:

```
For each feature in actionlist.md:
  mcp__activity-log__add_entry({
    id: "FEAT-###-[layer]",
    type: "feature",
    title: "[Feature title]",
    status: "PENDING",
    phase: "4",
    layer: "database|backend|frontend",
    workspaces: [list],
    createdDate: "[ISO-8601]"
  })
```

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-11-20T00:00:00Z | Initial phase specification placeholder |
| 1.0 | 2025-11-24T00:00:00Z | Complete phase specification with schemas and quality gates |
| 1.1 | 2025-11-24T00:00:00Z | Added iterative workflow structure, UX design loop, test data spec vs generation |
