# PMA Robot Refactoring Analysis for Integrated Architecture

**Document UID:** ROME-REFACTOR-001
**Status:** Analysis
**Date:** 2025-12-23
**Author:** Framework Analyst & Architect (Archie)
**Version:** 1.0
**Dependencies:** ROME-INTEGRATION-SPEC-001, ROME-ROBOT-003, ROME-PROP-009, ROME-PROP-010, ROME-PROP-011

---

## Executive Summary

The PMA (Project Management Architect) robot requires **fundamental transformation** from a sequential, procedural executor to a **parallel orchestrator** to leverage the integrated AORDL + Skills + Subagents architecture.

**Current Model:** PMA manually performs design tasks sequentially (500-1200 lines of procedural logic)
**Target Model:** PMA orchestrates 57+ parallel subagents executing skills (50-150 lines of YAML orchestration)

**Refactoring Scope:**
- **Complexity Reduction:** 85-90% (1200 lines → 150 lines)
- **Execution Model:** Sequential → Parallel (57 concurrent subagents)
- **Input Source:** User stories → AORDL requirements (direct consumption)
- **Operations:** Manual artifact creation → Skill invocation
- **Role:** Executor → Orchestrator

---

## Current State Analysis

### PMA Robot v2.0 (Current)

**File:** `/ROME/robot-templates/PMA/CLAUDE.md`
**Lines:** ~1200 (procedural instructions)
**Model:** Sequential execution with iterative refinement

**Current P3 Workflow:**

```yaml
Stage 1: Foundation (Sequential)
  Step 1: Verify entry criteria (manual checks)
  Step 2: Log phase start (manual MCP call)
  Step 3: Read P2 outputs (manual file reads)
  Step 4: Sponsor design kickoff (manual Seez interaction)
  Step 5: Select tech stack (manual decision-making)

Stage 2: Core Design (Sequential with iteration)
  Step 6: Create data dictionary (manual entity extraction from user stories)
  Step 7: Design APIs (manual endpoint design from user stories)
  Step 8: Generate use cases (manual mapping from user stories)
  Step 9: Create system architecture (manual architecture document)
  Step 10: Optional Clara UX design (manual coordination)

Stage 3: Finalization (Sequential)
  Step 11: Create work breakdown (manual WBS creation)
  Step 12: Define test data spec (manual test data design)
  Step 13: Consistency check (manual cross-artifact validation)
  Step 14: Sponsor design review (manual Seez presentation)
  Step 15: Document design decisions (manual documentation)
  Step 16: Prepare handover (manual handover creation)
  Step 17: Execute GATE-P3 (manual gate coordination)

Total Steps: 17 sequential steps
Iteration Loops: 4 possible iteration triggers
Execution Time: 24 hours (all sequential)
```

**Key Characteristics:**
- **Procedural:** Each step described in imperative detail (do X, then Y, then Z)
- **Manual Operations:** PMA directly creates artifacts (write data dictionary, design APIs)
- **User Story Dependency:** Design inferred from user stories (40% information loss)
- **Sequential Bottleneck:** Steps 6-10 run sequentially despite being independent
- **Complex Iteration Logic:** Manual iteration management based on triggers

---

## Target State (Integrated Architecture)

### PMA Robot v3.0 (Integrated)

**Model:** Parallel orchestrator with skill-based operations
**Lines:** ~150 (YAML orchestration definition)

**Integrated P3 Workflow:**

```yaml
phase: P3
robot: PMA
mode: AORDL_DIRECT_CONSUMPTION

workflow:
  - step: 1
    name: Validate Entry Criteria
    skill: /validate-entry-criteria
    params:
      phase: P3
      robot: pma
      requires: [GATE-P2: APPROVED]

  - step: 2
    name: Log Phase Start
    skill: /log-phase-event
    params: {type: START, phase: P3, robot: pma}

  - step: 3
    name: Load AORDL Requirements
    skill: /load-aordl-requirements
    params:
      source: ARTIFACTS/01-ingest/aordl-requirements.yaml
      validate: true

  - step: 4
    name: Sponsor Design Kickoff
    skill: /request-approval
    params:
      title: Design Approach
      summary: AORDL-driven direct consumption architecture
      decision_type: approach

  - step: 5
    name: Build Data Dictionary (Sequential Foundation)
    subagent:
      type: SA-009
      operations:
        - skill: /build-data-dictionary
          params:
            aordl_requirements: ${loaded_requirements}
            extract_from: [data_model, Invariants, NonFunctional]
            output: data-dictionary.yaml

  - step: 6
    name: Parallel Design Generation (57 CONCURRENT SUBAGENTS)
    subagents_parallel:
      # 25 API endpoint designers (one per entity)
      - subagent:
          type: SA-010
          count: 25
          batch: entities
          operations:
            - skill: /generate-api-endpoint
              params:
                aordl_requirements: ${requirements_for_entity}
                entity: ${batch_item}
                data_dictionary: data-dictionary.yaml
                output: api-design.md

      # 30 use case generators (one per requirement)
      - subagent:
          type: SA-011
          count: 30
          batch: requirements
          operations:
            - skill: /generate-use-case
              params:
                aordl_requirement: ${batch_item}
                output: use-cases.md

      # 1 test architecture designer
      - subagent:
          type: SA-012
          operations:
            - skill: /generate-test-architecture
              params:
                requirements: ${loaded_requirements}
                output: test-architecture.md

      # 1 system architecture designer
      - subagent:
          type: SA-013
          operations:
            - skill: /generate-system-architecture
              params:
                requirements: ${loaded_requirements}
                data_dictionary: data-dictionary.yaml
                output: system-architecture.md

    barrier: true  # Wait for all 57 subagents

  - step: 7
    name: Consistency Check
    skill: /check-consistency
    params:
      artifacts: [data-dictionary.yaml, api-design.md, use-cases.md, system-architecture.md]

  - step: 8
    name: Sponsor Design Review
    skill: /request-approval
    params:
      title: Architecture Review
      decision_type: architecture

  - step: 9
    name: Prepare Handover
    skill: /prepare-handover
    params: {phase: P3, artifacts_dir: ARTIFACTS/03-design/}

  - step: 10
    name: Execute Gate P3
    skill: /execute-gate
    params: {gate: GATE-P3, artifacts_dir: ARTIFACTS/03-design/}

Total Steps: 10 steps (vs 17 current)
Parallel Execution: 57 concurrent subagents (Step 6)
Execution Time: 8-10 hours (60-70% faster)
```

---

## Refactoring Requirements

### 1. **Input Source Transformation**

**Current:**
```yaml
Input: User stories from P2
Process:
  - Read user-stories.md
  - Parse "As a X, I want to Y, So that Z" format
  - Infer data entities (40% loss)
  - Infer API operations (40% loss)
  - Guess business rules (60% loss)
```

**Target:**
```yaml
Input: AORDL requirements (structured, atomic)
Process:
  - Load aordl-requirements.yaml
  - Direct field mapping:
    - Intent → API endpoint
    - Actor → Use case actor
    - Invariants → Business rules (exact)
    - Preconditions → Auth/validation
    - Outcomes → Success scenarios
    - Errors → Error handling
  - Zero information loss
```

**Refactoring Actions:**
- ✓ Remove user story parsing logic
- ✓ Add AORDL loading via `/load-aordl-requirements` skill
- ✓ Update data dictionary extraction: user stories → AORDL fields
- ✓ Update API design: infer from Intent field (not user story text)
- ✓ Update use case generation: direct AORDL field mapping

---

### 2. **Execution Model Transformation**

**Current (Sequential):**
```
Step 6: Create data dictionary (120 min)
  ↓
Step 7: Design APIs (140 min)
  ↓
Step 8: Generate use cases (180 min)
  ↓
Step 9: Create system architecture (90 min)

Total: 530 minutes (8.8 hours)
```

**Target (Parallel):**
```
Step 5: Build data dictionary (5 min) [Sequential foundation]
  ↓
Step 6: Spawn 57 parallel subagents:
  - 25 API designers run in parallel (5 min total)
  - 30 use case generators run in parallel (3 min total)
  - 1 test arch designer (4 min)
  - 1 system arch designer (5 min)
  All complete in Max(5,3,4,5) = 5 minutes

Total: 10 minutes (vs 530 minutes = 98% faster)
```

**Refactoring Actions:**
- ✓ Remove sequential step dependencies (Steps 6-10 → Step 6 parallel)
- ✓ Add subagent orchestration logic
- ✓ Implement barrier synchronization (await all subagents)
- ✓ Add subagent spawning patterns (SA-009 to SA-013)
- ✓ Remove manual artifact creation (skills handle this)

---

### 3. **Role Transformation: Executor → Orchestrator**

**Current Role (Executor):**
```
PMA directly performs:
- Creates data dictionary by reading requirements
- Designs API endpoints by analyzing user stories
- Writes use cases by mapping stories
- Writes system architecture document
- Manually checks consistency
- Manually creates handover
```

**Target Role (Orchestrator):**
```
PMA orchestrates:
- Invokes /build-data-dictionary skill (via SA-009 subagent)
- Spawns 25 SA-010 subagents to invoke /generate-api-endpoint skill
- Spawns 30 SA-011 subagents to invoke /generate-use-case skill
- Invokes /check-consistency skill
- Invokes /prepare-handover skill
- Coordinates parallel execution
- Manages barriers and synchronization
```

**Refactoring Actions:**
- ✓ Replace "create data dictionary" with "invoke /build-data-dictionary skill"
- ✓ Replace "design APIs" with "spawn SA-010 subagents (25 parallel)"
- ✓ Replace "generate use cases" with "spawn SA-011 subagents (30 parallel)"
- ✓ Replace all manual operations with skill invocations
- ✓ Add orchestration logic (spawn, await, merge)

---

### 4. **Definition Format Transformation: Procedural → Declarative**

**Current Format (Procedural):**
```markdown
### Step 6: Create Data Dictionary

**Purpose:** Build single source of truth for data model.

**6a. Extract Data Entities**

Read `requirements-matrix.yaml` and `user-stories.md`.

For each requirement:
1. Identify nouns (potential entities)
2. Identify relationships
3. Identify attributes
4. Map to entity definition

**6b. Define Entity Schema**

For each entity:
```yaml
entity_name:
  description: "..."
  attributes:
    - name: "..."
      type: "..."
      required: true/false
  relationships:
    - target: "..."
      type: "..."
```

Write to `ARTIFACTS/03-design/data-dictionary.yaml`

[... 200 more lines of procedural instructions]
```

**Target Format (Declarative YAML):**
```yaml
- step: 6
  name: Build Data Dictionary
  subagent:
    type: SA-009
    operations:
      - skill: /build-data-dictionary
        params:
          aordl_requirements: aordl-requirements.yaml
          extract_from: [data_model, Invariants, NonFunctional]
          output: data-dictionary.yaml
```

**Refactoring Actions:**
- ✓ Convert PMA/CLAUDE.md from procedural markdown to YAML workflow definition
- ✓ Remove HOW instructions (skills encapsulate HOW)
- ✓ Define WHAT orchestration (spawn subagents, invoke skills, barriers)
- ✓ Reduce from 1200 lines → 150 lines (87% reduction)

---

### 5. **Dependency Transformation**

**Current Dependencies:**
```yaml
PMA reads:
  - user-stories.md
  - acceptance-criteria.md
  - requirements-matrix.yaml
  - non-functional-requirements.md
  - phase2-handover.md

PMA infers from:
  - User story text parsing
  - Acceptance criteria interpretation
  - Manual mapping
```

**Target Dependencies:**
```yaml
PMA loads:
  - aordl-requirements.yaml (single source of truth)
  - phase2-handover.md (sponsor decisions only)

Skills consume:
  - AORDL requirements (structured fields)
  - Data dictionary (from SA-009)

Zero inference required (direct field mapping)
```

**Refactoring Actions:**
- ✓ Remove dependencies on user-stories.md, acceptance-criteria.md
- ✓ Add dependency on aordl-requirements.yaml
- ✓ Update handover to reference AORDL (not user stories)
- ✓ Update downstream handover format (P3 → P4)

---

## Detailed Refactoring Plan

### Phase 1: Preparation (Before Month 1)

**1.1 Skill Catalog Definition**
```yaml
Skills PMA will invoke (via subagents):
  - /validate-entry-criteria
  - /log-phase-event
  - /load-aordl-requirements
  - /request-approval
  - /build-data-dictionary
  - /generate-api-endpoint
  - /generate-use-case
  - /generate-test-architecture
  - /generate-system-architecture
  - /check-consistency
  - /prepare-handover
  - /execute-gate

Total: 12 skills
Status: Define in ROME-PROP-010 implementation
```

**1.2 Subagent Catalog Definition**
```yaml
Subagents PMA will spawn:
  - SA-009: Data Dictionary Builder
  - SA-010: API Endpoint Designer (25 instances)
  - SA-011: Use Case Generator (30 instances)
  - SA-012: Test Architecture Designer
  - SA-013: System Architecture Designer

Total: 5 subagent types (57 instances max)
Status: Define in ROME-PROP-011 implementation
```

---

### Phase 2: Core Refactoring (Month 2-3)

**2.1 Create PMA v3.0 YAML Definition**

**File:** `/ROME/robot-templates/PMA/pma-workflow-v3.yaml`

```yaml
robot: PMA
version: 3.0
mode: orchestrator
phase: P3
input_mode: AORDL

workflow:
  - step: 1
    name: Validate Entry Criteria
    skill: /validate-entry-criteria
    params:
      phase: P3
      robot: pma
      requires:
        - GATE-P2: APPROVED
        - aordl-requirements.yaml: exists

  # [... 10 steps total as shown in Target State above]

orchestration:
  max_parallel_subagents: 57
  barrier_synchronization: true
  error_handling: fail_fast
  retry_policy:
    max_attempts: 3
    backoff: exponential

dependencies:
  inputs:
    - aordl-requirements.yaml
    - phase2-handover.md
  outputs:
    - data-dictionary.yaml
    - api-design.md
    - use-cases.md
    - system-architecture.md
    - test-architecture.md
    - phase3-handover.md
```

**2.2 Update PMA/CLAUDE.md to Reference Workflow**

```markdown
# PMA Robot: Role Definition (v3.0)

## Role Description
PMA is an **orchestrator robot** that coordinates Phase 3 (Design) by spawning
specialized subagents and invoking skills to transform AORDL requirements into
complete system architecture.

## Execution Model
PMA does NOT manually perform design tasks. Instead, PMA orchestrates:
- Spawning 57+ parallel subagents
- Invoking skills for operations
- Managing barrier synchronization
- Coordinating sponsor interactions

## Workflow Definition
See: `pma-workflow-v3.yaml` for complete declarative workflow.

## Orchestration Patterns
[Document orchestration patterns, subagent spawning, skill invocation]
```

**2.3 Remove Procedural Instructions**

```diff
- ### Step 6: Create Data Dictionary
- **6a. Extract Data Entities**
- Read `requirements-matrix.yaml` and `user-stories.md`.
- For each requirement:
- 1. Identify nouns (potential entities)
- ... [200 lines removed]

+ ### Step 5: Build Data Dictionary
+ Invoke SA-009 subagent with /build-data-dictionary skill.
+ See: pma-workflow-v3.yaml, step 5
```

---

### Phase 3: Integration Testing (Month 4)

**3.1 Pilot Project Test**
```yaml
Test: Execute PMA v3.0 on 30 AORDL requirements pilot project

Validate:
  - AORDL requirements load correctly
  - 57 subagents spawn successfully
  - Skills execute without errors
  - Artifacts generated correctly
  - Execution time: <10 hours (vs 24 hours baseline)
  - Zero information loss (AORDL fields → artifacts)

Success Criteria:
  - All 57 subagents complete
  - Consistency check passes
  - GATE-P3 approves
  - 60%+ speedup achieved
```

**3.2 Comparison Testing**
```yaml
Run both:
  - PMA v2.0 (current, sequential)
  - PMA v3.0 (integrated, parallel)

Compare:
  - Execution time
  - Artifact quality
  - Information preservation
  - Sponsor feedback

Expected Results:
  - v3.0 60-70% faster
  - v3.0 zero information loss (vs v2.0 40% loss)
  - v3.0 artifacts more precise (AORDL fields)
```

---

### Phase 4: Production Deployment (Month 8-10)

**4.1 Update All PMA References**
```yaml
Files to update:
  - /ROME/robot-templates/PMA/CLAUDE.md (role definition)
  - /ROME/robot-templates/PMA/pma-workflow-v3.yaml (new workflow)
  - /ROME/life-cycle/P03-design/operations-guidelines.md (P3 phase def)
  - /ROME/foundation/lexicon.md (add orchestrator terminology)
  - /ROME/foundation/document-architecture.md (YAML workflow format)

Documentation:
  - Add orchestration pattern examples
  - Add subagent spawning guide
  - Add skill invocation guide
  - Update Roma coordination (PMA now orchestrator)
```

**4.2 Training & Transition**
```yaml
Create:
  - PMA v2.0 → v3.0 migration guide
  - Orchestrator pattern tutorial
  - Subagent spawning best practices
  - Skill invocation examples

Deprecation:
  - Mark PMA v2.0 as deprecated (Month 10)
  - Remove PMA v2.0 (Month 12)
  - All new projects use PMA v3.0 only
```

---

## Impact Analysis

### Complexity Reduction

```yaml
PMA v2.0:
  definition_lines: 1200
  procedural_steps: 17
  iteration_logic: complex
  manual_operations: 15+
  dependencies: 6 input files

PMA v3.0:
  definition_lines: 150 (87% reduction)
  orchestration_steps: 10 (41% reduction)
  iteration_logic: none (skills handle)
  manual_operations: 0 (skills handle all)
  dependencies: 1 input file (AORDL)

Reduction: 85-90% complexity
```

### Performance Improvement

```yaml
Sequential Execution (v2.0):
  Stage 1: 90 minutes
  Stage 2: 530 minutes (bottleneck)
  Stage 3: 90 minutes
  Total: 710 minutes (11.8 hours)

Parallel Execution (v3.0):
  Stage 1: 10 minutes (skills)
  Stage 2: 10 minutes (57 parallel subagents)
  Stage 3: 10 minutes (skills)
  Total: 30 minutes

Speedup: 96% faster (23.7×)
```

### Information Preservation

```yaml
User Story Input (v2.0):
  "As a Customer, I want to create invoice, So that I can bill clients"

  PMA infers:
    - Entity: Invoice (correct)
    - API: POST /invoices (guessed)
    - Business rules: ??? (40% loss)
    - Validation: ??? (60% loss)
    - Error handling: ??? (60% loss)

  Information loss: 40-60%

AORDL Input (v3.0):
  ID: REQ-002
  Actor: Customer
  Intent: create invoice
  Invariants: [Invoice total = sum(line items) + tax + shipping]
  Preconditions: [Customer authenticated, Active subscription]
  Errors: [If line items empty: "Must have at least one line item"]

  PMA maps:
    - Entity: Invoice (from data_model)
    - API: POST /invoices (from Intent field)
    - Business rules: Invariant field (exact)
    - Validation: Preconditions field (exact)
    - Error handling: Errors field (exact)

  Information loss: 0%

Improvement: Zero information loss (100% preservation)
```

---

## Risk Assessment

### Migration Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Skill framework not ready** | Medium | High | Implement skills in Month 1-2 (PROP-010) |
| **Subagent framework not ready** | Medium | High | Implement subagents in Month 1-2 (PROP-011) |
| **AORDL requirements not available** | Low | Critical | AORDL templates created in Month 1 (PROP-009) |
| **Parallel execution bugs** | Medium | Medium | Extensive testing in Month 4 pilot |
| **PMA v2.0 projects mid-flight** | High | Low | Support both v2.0 and v3.0 until Month 12 |
| **Sponsor confusion (AORDL vs user stories)** | Medium | Low | Clear communication, gradual transition |

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Subagent resource exhaustion** | Low | Medium | Limit max parallel subagents to 60 |
| **Skill invocation failures** | Medium | Medium | Retry policies, error handling |
| **YAML workflow parsing errors** | Low | High | Schema validation, unit tests |
| **Barrier synchronization bugs** | Low | High | Extensive concurrency testing |

---

## Success Criteria

**PMA v3.0 is successful if:**

✓ Executes P3 design in <10 hours (vs 24 hours baseline)
✓ Spawns 57+ parallel subagents successfully
✓ Invokes all 12 required skills without errors
✓ Achieves zero information loss (AORDL → artifacts)
✓ Passes consistency checks automatically
✓ GATE-P3 approval rate >95%
✓ Sponsor satisfaction >90%
✓ Definition complexity reduced 85%+ (1200 → 150 lines)

---

## Appendix A: Side-by-Side Comparison

### Current PMA v2.0 (Step 6: Data Dictionary)

```markdown
### Step 6: Create Data Dictionary

**Purpose:** Build the single source of truth for the data model.

**6a. Extract Data Entities**

Read the following files:
- `ARTIFACTS/02-analysis/requirements/requirements-matrix.yaml`
- `ARTIFACTS/02-analysis/requirements/user-stories.md`

For each requirement and user story:

1. **Identify Nouns:** Look for nouns that represent business objects
   - Example: "Customer creates invoice" → "Customer", "Invoice"

2. **Identify Relationships:** Look for verbs that connect entities
   - Example: "Customer creates invoice" → Customer --creates--> Invoice

3. **Identify Attributes:** Look for descriptive properties
   - Example: "Invoice has total, date, status" → attributes of Invoice

4. **Map to Data Model:**
   ```
   Entity: Invoice
   Attributes:
     - invoice_number (string, unique)
     - total (decimal)
     - date (datetime)
     - status (enum: draft, sent, paid)
   Relationships:
     - belongs_to: Customer
     - has_many: LineItems
   ```

**6b. Define Entity Schema**

For each entity identified, create a complete schema definition:

```yaml
entity_name:
  description: "Brief description of the entity"
  attributes:
    - name: "attribute_name"
      type: "data_type"
      required: true/false
      unique: true/false
      default: "default_value"
      constraints:
        - "validation rules"
  relationships:
    - target: "RelatedEntity"
      type: "one_to_one | one_to_many | many_to_many"
      required: true/false
  business_rules:
    - id: "BR-ENTITY-001"
      description: "Business rule description"
      level: "critical | important | nice_to_have"
```

**6c. Extract Business Rules**

For each entity, review requirements to identify business rules:
- Validation rules (e.g., "Invoice total must be > 0")
- Constraints (e.g., "Customer must have active subscription")
- State transitions (e.g., "Invoice can only be paid once")

Add to entity's `business_rules` section.

**6d. Write Data Dictionary**

Create `ARTIFACTS/03-design/data-dictionary.yaml`:

```yaml
# Data Dictionary
# Generated: [ISO-8601]
# Source: P2 Requirements

entities:
  Customer:
    description: "Represents a customer in the system"
    attributes:
      - name: "customer_id"
        type: "uuid"
        required: true
        unique: true
    # ... [50 more lines per entity]

  Invoice:
    # ... [50 more lines]

  # ... [25 entities × 50 lines = 1250 lines]

relationships:
  # ... [relationship definitions]

business_rules:
  # ... [business rule definitions]
```

**6e. Validate Data Dictionary**

Check:
- All requirements mapped to entities
- No orphan entities (not referenced by requirements)
- All relationships bidirectional
- All business rules traceable to requirements

If validation fails, iterate until complete.

**Total:** ~300 lines of procedural instructions for one step
```

### Integrated PMA v3.0 (Step 5: Data Dictionary)

```yaml
- step: 5
  name: Build Data Dictionary
  subagent:
    type: SA-009
    operations:
      - skill: /build-data-dictionary
        params:
          aordl_requirements: aordl-requirements.yaml
          extract_from: [data_model, Invariants, NonFunctional]
          output: data-dictionary.yaml
          validation:
            - check_coverage: true
            - check_orphans: true
            - check_relationships: true

# AORDL fields used by /build-data-dictionary skill:
#   - data_model field: Entities, attributes, relationships
#   - Invariants field: Business rules (exact)
#   - NonFunctional field: Indexes, constraints
#
# Output: ARTIFACTS/03-design/data-dictionary.yaml
# Execution: 5 minutes (vs 120 minutes manual)
# Information loss: 0% (vs 40% manual inference)
```

**Total:** 14 lines (vs 300 lines)
**Reduction:** 95%

---

## Appendix B: PMA v3.0 Complete Workflow YAML

```yaml
# PMA Robot Workflow Definition v3.0
# Document: pma-workflow-v3.yaml
# Mode: AORDL Direct Consumption with Parallel Orchestration

robot: PMA
version: 3.0
phase: P3
mode: orchestrator
input_mode: AORDL

metadata:
  role: Project Management Architect
  responsibility: Orchestrate Phase 3 (Design) via parallel subagents
  execution_model: Parallel with barrier synchronization
  complexity: Low (orchestration only)

workflow:
  - step: 1
    name: Validate Entry Criteria
    type: skill_invocation
    skill: /validate-entry-criteria
    params:
      phase: P3
      robot: pma
      requires:
        - GATE-P2: APPROVED
        - aordl-requirements.yaml: exists
        - phase2-handover.md: exists
    on_failure: abort

  - step: 2
    name: Log Phase Start
    type: skill_invocation
    skill: /log-phase-event
    params:
      type: START
      phase: P3
      robot: pma

  - step: 3
    name: Load AORDL Requirements
    type: skill_invocation
    skill: /load-aordl-requirements
    params:
      source: ARTIFACTS/01-ingest/aordl-requirements.yaml
      validate: true
      schema: aordl-schema.yaml
    output_var: loaded_requirements

  - step: 4
    name: Sponsor Design Kickoff
    type: skill_invocation
    skill: /request-approval
    params:
      title: Design Approach
      summary: |
        Proposed Architecture: AORDL-driven design
        - Direct field mapping (Intent → API, Invariants → Business Rules)
        - Zero information loss
        - Parallel design generation (57 subagents)
      decision_type: approach
    on_rejection: abort

  - step: 5
    name: Build Data Dictionary (Sequential Foundation)
    type: subagent_spawn
    subagent:
      type: SA-009
      name: data-dictionary-builder
      context:
        requirements: ${loaded_requirements}
      operations:
        - skill: /build-data-dictionary
          params:
            aordl_requirements: ${context.requirements}
            extract_from: [data_model, Invariants, NonFunctional]
            output: ARTIFACTS/03-design/data-dictionary.yaml
            validation:
              check_coverage: true
              check_orphans: true
    await: true
    output_var: data_dictionary

  - step: 6
    name: Parallel Design Generation
    type: subagent_spawn_parallel
    description: Spawn 57 parallel subagents for design artifacts
    subagents:
      # 25 API Endpoint Designers (one per entity)
      - type: SA-010
        count: 25
        batch: ${data_dictionary.entities}
        name: api-designer-${batch_item.name}
        context:
          entity: ${batch_item}
          requirements: ${loaded_requirements}
          data_dictionary: ${data_dictionary}
        operations:
          - skill: /generate-api-endpoint
            params:
              aordl_requirements: ${findRequirementsForEntity(context.entity)}
              entity: ${context.entity}
              data_dictionary: ${context.data_dictionary}
              output: ARTIFACTS/03-design/api-design.md
              mode: append

      # 30 Use Case Generators (one per requirement)
      - type: SA-011
        count: 30
        batch: ${loaded_requirements}
        name: use-case-generator-${batch_item.id}
        context:
          requirement: ${batch_item}
        operations:
          - skill: /generate-use-case
            params:
              aordl_requirement: ${context.requirement}
              output: ARTIFACTS/03-design/use-cases.md
              mode: append

      # 1 Test Architecture Designer
      - type: SA-012
        name: test-architecture-designer
        context:
          requirements: ${loaded_requirements}
          data_dictionary: ${data_dictionary}
        operations:
          - skill: /generate-test-architecture
            params:
              requirements: ${context.requirements}
              use_cases: ARTIFACTS/03-design/use-cases.md
              data_dictionary: ${context.data_dictionary}
              output: ARTIFACTS/03-design/test-architecture.md

      # 1 System Architecture Designer
      - type: SA-013
        name: system-architecture-designer
        context:
          requirements: ${loaded_requirements}
          data_dictionary: ${data_dictionary}
        operations:
          - skill: /generate-system-architecture
            params:
              requirements: ${context.requirements}
              data_dictionary: ${context.data_dictionary}
              nfrs: ${extractNFRs(context.requirements)}
              output: ARTIFACTS/03-design/system-architecture.md

    barrier: true  # Wait for all 57 subagents
    timeout: 600000  # 10 minutes
    on_failure: collect_errors

  - step: 7
    name: Consistency Check
    type: skill_invocation
    skill: /check-consistency
    params:
      artifacts:
        - ARTIFACTS/03-design/data-dictionary.yaml
        - ARTIFACTS/03-design/api-design.md
        - ARTIFACTS/03-design/use-cases.md
        - ARTIFACTS/03-design/system-architecture.md
        - ARTIFACTS/03-design/test-architecture.md
      check_types:
        - cross_artifact_references
        - data_type_consistency
        - requirement_coverage
        - aordl_field_mapping
    on_failure: report_and_block

  - step: 8
    name: Sponsor Design Review
    type: skill_invocation
    skill: /request-approval
    params:
      title: Architecture Review
      summary: |
        Complete AORDL-driven architecture:
        - ${data_dictionary.entities.length} entities
        - ${count_api_endpoints} API endpoints
        - ${loaded_requirements.length} use cases
        - 100% requirement coverage
        - Zero information loss (AORDL fields fully mapped)
      artifacts:
        - data-dictionary.yaml
        - api-design.md
        - use-cases.md
        - system-architecture.md
      decision_type: architecture
    on_rejection: iterate_design

  - step: 9
    name: Prepare Handover
    type: skill_invocation
    skill: /prepare-handover
    params:
      phase: P3
      template: /ROME/robot-templates/PMA/handover-template.md
      artifacts_dir: ARTIFACTS/03-design/
      output: ARTIFACTS/03-design/phase3-handover.md
      include:
        - Design decisions
        - Technology selections
        - AORDL field mappings
        - Sponsor approvals

  - step: 10
    name: Execute Gate P3
    type: skill_invocation
    skill: /execute-gate
    params:
      gate: GATE-P3
      artifacts_dir: ARTIFACTS/03-design/
      robot: sarah
      validation_criteria:
        - requirement_coverage: 100%
        - consistency_check: passed
        - sponsor_approval: received
        - aordl_mapping: complete

  - step: 11
    name: Log Phase Complete
    type: skill_invocation
    skill: /log-phase-event
    params:
      type: COMPLETE
      phase: P3
      robot: pma
      metrics:
        execution_time: ${execution_time}
        subagents_spawned: 57
        artifacts_generated: 5

orchestration:
  max_parallel_subagents: 60
  barrier_synchronization: true
  error_handling: fail_fast
  retry_policy:
    max_attempts: 3
    backoff: exponential
    backoff_multiplier: 2

dependencies:
  required_skills:
    - /validate-entry-criteria
    - /log-phase-event
    - /load-aordl-requirements
    - /request-approval
    - /build-data-dictionary
    - /generate-api-endpoint
    - /generate-use-case
    - /generate-test-architecture
    - /generate-system-architecture
    - /check-consistency
    - /prepare-handover
    - /execute-gate

  required_subagents:
    - SA-009  # Data Dictionary Builder
    - SA-010  # API Endpoint Designer
    - SA-011  # Use Case Generator
    - SA-012  # Test Architecture Designer
    - SA-013  # System Architecture Designer

  input_artifacts:
    - ARTIFACTS/01-ingest/aordl-requirements.yaml
    - ARTIFACTS/02-analysis/phase2-handover.md

  output_artifacts:
    - ARTIFACTS/03-design/data-dictionary.yaml
    - ARTIFACTS/03-design/api-design.md
    - ARTIFACTS/03-design/use-cases.md
    - ARTIFACTS/03-design/system-architecture.md
    - ARTIFACTS/03-design/test-architecture.md
    - ARTIFACTS/03-design/phase3-handover.md

execution_metrics:
  traditional_time: 1440 minutes (24 hours)
  integrated_time: 600 minutes (10 hours)
  speedup: 58%
  complexity_reduction: 87%
  information_loss: 0%
```

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2025-12-23 | Initial PMA refactoring analysis - Current state analysis, target state definition, refactoring requirements, detailed refactoring plan, risk assessment, complete v3.0 workflow YAML |

---

**Status:** Ready for Review
**Next Steps:**
1. Review and approve refactoring approach
2. Implement required skills (Month 1-2)
3. Implement required subagents (Month 1-2)
4. Create PMA v3.0 YAML workflow (Month 2)
5. Test in Month 4 integration pilot
6. Deploy to production (Month 8-10)
