# ROME Framework: AORDL-Skills-Subagents Integration Specification

**Document UID:** ROME-INTEGRATION-SPEC-001
**Status:** Specification
**Date:** 2025-12-23
**Author:** Framework Analyst & Architect (Archie)
**Version:** 1.1.1
**Dependencies:** ROME-PROP-009, ROME-PROP-010, ROME-PROP-011

---

## Executive Summary

This document provides the complete technical specification for integrating AORDL (ROME-PROP-009), Skills (ROME-PROP-010), and Subagents (ROME-PROP-011) across the entire ROME lifecycle (P0-P5) into a unified AI-native orchestration framework.

**Integration Model:** Three-layer architecture where each proposal operates at a distinct layer:

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 1: AORDL (Input/Data Layer)                           │
│  Structured, atomic requirements with zero information loss  │
└──────────────────────────────────────────────────────────────┘
                         ▼ provides data to
┌──────────────────────────────────────────────────────────────┐
│  Layer 2: Skills (Operation/Execution Layer)                 │
│  Reusable, standardized operations invoked by name           │
└──────────────────────────────────────────────────────────────┘
                         ▼ orchestrated by
┌──────────────────────────────────────────────────────────────┐
│  Layer 3: Subagents (Orchestration/Concurrency Layer)        │
│  Parallel task execution with autonomous agents              │
└──────────────────────────────────────────────────────────────┘
```

**Implementation Approach:** Coordinated 18-month roadmap with parallel development tracks and defined integration validation points.

---

## Table of Contents

1. [Architectural Integration Model](#1-architectural-integration-model)
2. [Layer Specifications](#2-layer-specifications)
3. [Phase-by-Phase Integration](#3-phase-by-phase-integration)
4. [API Contracts](#4-api-contracts)
5. [Integration Points](#5-integration-points)
6. [Workflow Examples](#6-workflow-examples)
7. [Implementation Requirements](#7-implementation-requirements)
8. [Validation Criteria](#8-validation-criteria)
9. [Migration Path](#9-migration-path)
10. [Appendices](#10-appendices)

---

## 1. Architectural Integration Model

### 1.1 Layered Architecture

**Layer 1: AORDL (Input/Data)**
- **Purpose:** Define structured, atomic requirements
- **Components:** AORDL templates, validation rules, field schemas
- **Interfaces:** Provides structured data to Skills and Subagents
- **Independence:** Can exist without Skills/Subagents (manual processing)

**Layer 2: Skills (Operations/Execution)**
- **Purpose:** Standardized, reusable operations
- **Components:** 50-skill catalog, skill invocation framework
- **Interfaces:** Consume AORDL data, invoked by Subagents
- **Independence:** Can exist without AORDL (generic data) or Subagents (sequential execution)

**Layer 3: Subagents (Orchestration/Concurrency)**
- **Purpose:** Parallel task execution and delegation
- **Components:** 30-subagent catalog, orchestration framework
- **Interfaces:** Spawn workers, invoke Skills, process AORDL
- **Independence:** Can exist without AORDL or Skills (procedural tasks)

---

### 1.2 Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│  SPONSOR                                                    │
│  Authors AORDL requirements (Pre-ROME)                      │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  P0: BOOTUP (Bootstrap Robot)                               │
│  Project structure creation (unchanged)                     │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  P1: AORDL VALIDATION GATE (Talib Robot)                   │
│                                                             │
│  Talib (Parent):                                            │
│    1. Skill: /validate-entry-criteria                      │
│    2. Spawn Subagents (Parallel AORDL Processing):         │
│       ├── SA-001: AORDL Validator Subagent (batch 1)       │
│       │   └── Skill: /validate-aordl on REQ-001 to REQ-010 │
│       ├── SA-001: AORDL Validator Subagent (batch 2)       │
│       │   └── Skill: /validate-aordl on REQ-011 to REQ-020 │
│       └── ... (5 subagents total for 50 requirements)      │
│    3. Await all subagents (barrier)                        │
│    4. Skill: /merge-validation-reports                     │
│    5. Skill: /execute-gate GATE-P1                         │
│                                                             │
│  Integration: AORDL data → validated by Skills → in parallel│
│               via Subagents                                 │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  P2: ANALYSIS (Talib Robot)                                │
│                                                             │
│  Talib (Parent):                                            │
│    1. Skill: /validate-entry-criteria                      │
│    2. Spawn Subagents (Parallel Enhancement):              │
│       ├── SA-015: Capability Matrix Builder               │
│       │   └── Skills: /extract-capabilities, /map-actors   │
│       ├── SA-007: Dependency Analyzer                      │
│       │   └── Skills: /extract-dependencies, /build-graph  │
│       ├── SA-004: User Story Generator                     │
│       │   └── Skill: /generate-user-stories (from AORDL)   │
│       └── SA-006: Coverage Assessor                        │
│           └── Skill: /check-coverage (8 dimensions)        │
│    3. Await all subagents                                  │
│    4. Skill: /prepare-handover                             │
│    5. Skill: /execute-gate GATE-P2                         │
│                                                             │
│  Integration: AORDL requirements → enhanced via Skills →   │
│               in parallel via Subagents → stakeholder views │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  P3: DESIGN (PMA Robot)                                     │
│                                                             │
│  PMA (Parent):                                              │
│    1. Skill: /validate-entry-criteria                      │
│    2. Spawn Subagents (Parallel Design):                   │
│       ├── SA-009: Data Dictionary Builder                  │
│       │   └── Skills: /extract-entities (from AORDL),      │
│       │       /generate-data-dictionary                    │
│       ├── SA-010: API Designer (25 entities in parallel)   │
│       │   └── Skill: /generate-api-design (per entity)     │
│       ├── SA-011: Use Case Generator (30 features)         │
│       │   └── Skill: /generate-use-cases (from AORDL)      │
│       └── SA-012: Test Architecture Designer               │
│           └── Skills: /map-page-objects, /map-flow-objects │
│    3. Await all subagents                                  │
│    4. Skill: /check-consistency (cross-artifact)           │
│    5. Skill: /prepare-handover                             │
│    6. Skill: /execute-gate GATE-P3                         │
│                                                             │
│  Integration: AORDL direct consumption → transformed by    │
│               Skills → in parallel via Subagents → precise  │
│               architecture (0% information loss)            │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  P4: CONFIGURATION (Clara Robot)                           │
│                                                             │
│  Clara (Parent):                                            │
│    1. Skill: /validate-entry-criteria                      │
│    2. Spawn Subagents (Parallel Workspace Configuration):  │
│       ├── SA-020: Database Configurator                    │
│       ├── SA-021: API Configurator                         │
│       ├── SA-022: UI Configurator                          │
│       ├── SA-023: Test Fixture Configurator                │
│       └── SA-024: Environment Configurator                 │
│    3. Await all subagents                                  │
│    4. Skill: /execute-gate GATE-P4                         │
│                                                             │
│  Integration: AORDL data dictionary → workspace configs →  │
│               in parallel via Subagents → ready for P5      │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  P5: CODE GENERATION (Ashok, Reena, Charlie Robots)       │
│                                                             │
│  MASSIVE PARALLELIZATION (95 concurrent subagents):        │
│                                                             │
│  Ashok (Database):                                          │
│    - Spawn 25 SA-036 (DB Entity Generators) in parallel    │
│    - Skill: /generate-database-entity per entity           │
│                                                             │
│  Reena (API):                                               │
│    - Spawn 40 SA-037 (API Endpoint Generators) in parallel │
│    - Skill: /generate-api-endpoint per endpoint            │
│                                                             │
│  Charlie (UI):                                              │
│    - Spawn 30 SA-038 (UI Screen Generators) in parallel    │
│    - Skill: /generate-ui-screen per screen                 │
│                                                             │
│  All 95 subagents complete in parallel (98% faster)        │
│                                                             │
│  Integration: AORDL requirements → code patterns →         │
│               in parallel via Subagents → complete app      │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.3 Data Flow

**AORDL Requirements (Source of Truth):**
```yaml
# REQ-002.yaml
ID: REQ-002
Actor: Customer
Intent: create invoice

Preconditions:
  - Customer authenticated
  - Customer has active subscription

Outcomes:
  - Invoice saved to database with unique ID
  - Customer receives email confirmation

Invariants:
  - Invoice total = sum(line items) + tax + shipping
  - Invoice number sequential and unique

NonFunctional:
  - Performance: Invoice creation <2 seconds
  - Security: Requires JWT authentication

Errors:
  - If line items empty: "Invoice must have at least one line item"
```

**↓ Processed by**

**Skills (Operations):**
```
/validate-aordl:
  - Validates 13-field structure ✓
  - Checks controlled vocabulary ✓
  - Detects anti-patterns ✓

/generate-user-story:
  - Actor → "As a Customer"
  - Intent → "I want to create invoice"
  - Outcomes[0] → "So that I can bill clients"

/generate-api-endpoint:
  - Intent → POST /api/invoices
  - Preconditions → Auth: JWT required
  - Outcomes → Response: {invoiceId, status}
  - Errors → 400 errors mapped

/generate-use-case:
  - Intent → UC-002: Create Invoice
  - Preconditions → Flow preconditions
  - Outcomes → Flow outcomes
  - Invariants → Business rules
```

**↓ Orchestrated by**

**Subagents (Parallel Execution):**
```
Parent spawns 3 subagents in parallel:

Subagent A: Validates REQ-002 (via /validate-aordl)
Subagent B: Generates user story (via /generate-user-story)
Subagent C: Generates API endpoint (via /generate-api-endpoint)

All run concurrently → Results merged → Continue
```

---

### 1.4 Control Flow

**Sequential (Current ROME):**
```
Operation 1 → Operation 2 → Operation 3 → ... → Operation N
Time: Sum of all operation times
```

**With Skills Only:**
```
/skill-1 → /skill-2 → /skill-3 → ... → /skill-N
Time: Sum of skill times (faster due to efficiency)
```

**With Skills + Subagents (Integrated):**
```
Spawn N subagents, each invokes skills:
  Subagent-1: /skill-A
  Subagent-2: /skill-B
  Subagent-3: /skill-C
  ... (all parallel)
Await all → Merge results

Time: Max(skill times) vs Sum(skill times)
Speedup: N× (if N independent skills)
```

**With AORDL + Skills + Subagents (Full Integration):**
```
AORDL provides structured data
Skills operate on AORDL fields with precision
Subagents parallelize Skills across AORDL requirements

Result: Precise, fast, consistent
```

---

## 2. Layer Specifications

### 2.1 Layer 1: AORDL Integration Specification

#### 2.1.1 AORDL Input Mode Detection

**Location:** P1 Ingest (Talib robot)

**Logic:**
```yaml
input_mode_detection:
  if_exists:
    - _user_input/raw-requirements/REQ-*.yaml
    - OR _user_input/raw-requirements/REQ-*.md
  and:
    - Files contain AORDL field structure (ID:, Actor:, Intent:, ...)
  then:
    mode: AORDL
  else:
    mode: TRADITIONAL
```

**Skills Invoked:**
- `/detect-input-mode` - Scan raw-requirements directory
- Returns: `AORDL` or `TRADITIONAL`

**Subagent Usage:**
- None (lightweight detection, no parallelization benefit)

---

#### 2.1.2 AORDL Validation (P1)

**Skill Definition:**
```yaml
skill: /validate-aordl
parameters:
  - requirement_file: path to REQ-XXX.yaml
  - validation_rules: aordl-rules.yaml
  - output_report: validation-report-REQXXX.md

operations:
  1. Load requirement file
  2. Validate schema (13-field structure):
     - Required fields present: ID, Actor, Intent, Preconditions, Conditions,
       Postconditions, Outcomes, Invariants, NonFunctional, Errors,
       ScopeBoundary, OpenQuestions, CopilotMode
  3. Check controlled vocabulary:
     - Actor: valid role (not generic "user")
     - Intent: approved verb + business object
  4. Detect anti-patterns:
     - No UI language (click, button, screen)
     - No technical jargon (POST, SQL, endpoint)
     - No compound intents (multiple verbs)
  5. Validate cross-references:
     - ID unique
     - Dependencies valid (referenced IDs exist)
  6. Generate validation report

output:
  status: PASS | FAIL
  violations: [list of issues]
  report_path: validation-report-REQXXX.md
```

**Subagent Orchestration:**
```javascript
// Talib robot, P1 phase
const requirements = await loadAORDLFiles(); // 50 files
const batchSize = 10; // Each subagent handles 10 files
const batches = chunk(requirements, batchSize); // 5 batches

const subagents = batches.map((batch, i) =>
  spawnSubagent({
    type: 'SA-001', // AORDL Validator
    name: `aordl-validator-batch-${i}`,
    task: `Validate AORDL requirements batch ${i}`,
    context: { requirements: batch },
    operations: batch.map(req => ({
      skill: '/validate-aordl',
      params: {
        requirement_file: req.path,
        validation_rules: 'aordl-rules.yaml',
        output_report: `validation-report-${req.id}.md`
      }
    }))
  })
);

const results = await Promise.all(subagents);
const aggregated = aggregateValidationResults(results);
```

**Integration:**
- **AORDL provides:** Structured data to validate
- **Skill executes:** Validation logic
- **Subagent orchestrates:** Parallel validation of 50 files

---

#### 2.1.3 AORDL Enhancement (P2)

**Skill Definitions:**

**S1: Generate Capability Matrix**
```yaml
skill: /generate-capability-matrix
parameters:
  - requirements: aordl-requirements.yaml
  - output: capability-matrix.yaml

operations:
  1. Load all AORDL requirements
  2. Extract Actor and Intent from each requirement
  3. Build Actor → Capability mapping:
     - Actor: Customer
       Capabilities: [create invoice, submit invoice, view invoice]
  4. Generate capability-matrix.yaml

output:
  capability_matrix: capability-matrix.yaml
```

**S2: Build Dependency Graph**
```yaml
skill: /build-dependency-graph
parameters:
  - requirements: aordl-requirements.yaml
  - output: dependency-graph.yaml

operations:
  1. Load all AORDL requirements
  2. Parse Preconditions and Conditions for REQ-XXX references
  3. Build directed graph: REQ-A depends_on REQ-B
  4. Validate no cycles
  5. Identify critical path
  6. Generate dependency-graph.yaml

output:
  dependency_graph: dependency-graph.yaml
  critical_path: [REQ-001, REQ-002, REQ-003]
```

**S3: Generate User Stories (from AORDL)**
```yaml
skill: /generate-user-stories
parameters:
  - requirements: aordl-requirements.yaml
  - output: user-stories.md
  - format: stakeholder-view | epic-feature-story

operations:
  1. Load all AORDL requirements
  2. For each requirement:
     - Template: "As a {Actor}, I want to {Intent}, So that {Outcomes[0]}"
  3. Group by Epic (if metadata present)
  4. Format as markdown
  5. Generate user-stories.md

output:
  story_count: N
  output_path: user-stories.md
```

**Subagent Orchestration (P2 Parallel Enhancement):**
```javascript
// Talib robot, P2 phase
const requirements = await loadEnhancedAORDL(); // From P1

// Spawn 4 subagents in parallel
const subagents = [
  spawnSubagent({
    type: 'SA-015',
    name: 'capability-matrix-builder',
    task: 'Build capability matrix from AORDL',
    operations: [{
      skill: '/generate-capability-matrix',
      params: { requirements, output: 'capability-matrix.yaml' }
    }]
  }),

  spawnSubagent({
    type: 'SA-007',
    name: 'dependency-analyzer',
    task: 'Build dependency graph from AORDL',
    operations: [{
      skill: '/build-dependency-graph',
      params: { requirements, output: 'dependency-graph.yaml' }
    }]
  }),

  spawnSubagent({
    type: 'SA-004',
    name: 'user-story-generator',
    task: 'Generate user stories from AORDL',
    operations: [{
      skill: '/generate-user-stories',
      params: { requirements, output: 'user-stories.md', format: 'epic-feature-story' }
    }]
  }),

  spawnSubagent({
    type: 'SA-006',
    name: 'coverage-assessor',
    task: 'Check 8-dimension coverage',
    operations: [{
      skill: '/check-coverage',
      params: { requirements, output: 'coverage-report.md' }
    }]
  })
];

const results = await Promise.all(subagents);
// All 4 tasks completed in parallel
```

**Integration:**
- **AORDL provides:** Structured requirements with Actor, Intent, Outcomes
- **Skills transform:** AORDL → capability matrix, dependency graph, user stories
- **Subagents parallelize:** 4 independent transformation tasks run concurrently

---

#### 2.1.4 AORDL Direct Consumption (P3)

**Skill: Map AORDL to Use Cases**
```yaml
skill: /generate-use-case
parameters:
  - aordl_requirement: REQ-XXX
  - output: use-cases.md (append)

operations:
  1. Load AORDL requirement
  2. Map fields to use case structure:
     - Actor → Use Case Actor
     - Intent → Use Case Title
     - Preconditions → Flow preconditions (step 1)
     - Outcomes → Flow outcomes (final step)
     - Errors → Flow variants (error cases)
  3. Generate use case entry
  4. Append to use-cases.md

output:
  use_case_id: UC-XXX
```

**Skill: Map AORDL to API Design**
```yaml
skill: /generate-api-endpoint
parameters:
  - aordl_requirement: REQ-XXX
  - data_dictionary: data-dictionary.yaml
  - output: api-design.md (append)

operations:
  1. Load AORDL requirement
  2. Map Intent to HTTP method + resource:
     - create invoice → POST /api/invoices
     - update invoice → PUT /api/invoices/{id}
     - delete invoice → DELETE /api/invoices/{id}
     - view invoice → GET /api/invoices/{id}
  3. Map Preconditions to auth requirements
  4. Map Outcomes to response schema (reference data dictionary)
  5. Map Errors to HTTP error codes
  6. Generate API endpoint entry
  7. Append to api-design.md

output:
  endpoint_path: POST /api/invoices
```

**Skill: Map AORDL to Data Dictionary Business Rules**
```yaml
skill: /extract-business-rules
parameters:
  - aordl_requirement: REQ-XXX
  - entity: EntityName
  - output: data-dictionary.yaml (update)

operations:
  1. Load AORDL requirement
  2. Extract Invariants field
  3. For each invariant:
     - Generate business rule ID: BR-ENTITY-###
     - Rule description: invariant text
     - Level: critical (all AORDL invariants are critical)
     - Enforced by: [database, api, ui]
  4. Update data-dictionary.yaml business_rules section

output:
  business_rule_ids: [BR-INVOICE-001, BR-INVOICE-002]
```

**Subagent Orchestration (P3 Parallel Design):**
```javascript
// PMA robot, P3 phase
const requirements = await loadAORDLRequirements(); // 30 requirements
const dataDictionary = await loadDataDictionary();

// Spawn parallel subagents for design
const subagents = [
  spawnSubagent({
    type: 'SA-009',
    name: 'data-dictionary-builder',
    task: 'Build data dictionary with AORDL business rules',
    operations: [{
      skill: '/build-data-dictionary',
      params: { requirements, output: 'data-dictionary.yaml' }
    }]
  }),

  // Spawn 30 subagents for use case generation (one per requirement)
  ...requirements.map(req =>
    spawnSubagent({
      type: 'SA-011',
      name: `use-case-generator-${req.id}`,
      task: `Generate use case for ${req.id}`,
      operations: [{
        skill: '/generate-use-case',
        params: { aordl_requirement: req, output: 'use-cases.md' }
      }]
    })
  ),

  // Spawn 25 subagents for API endpoint design (one per entity)
  ...entities.map(entity =>
    spawnSubagent({
      type: 'SA-010',
      name: `api-designer-${entity.name}`,
      task: `Design API endpoints for ${entity.name}`,
      operations: [{
        skill: '/generate-api-endpoint',
        params: {
          aordl_requirement: findRequirementForEntity(entity),
          data_dictionary: dataDictionary,
          output: 'api-design.md'
        }
      }]
    })
  )
];

const results = await Promise.all(subagents); // 56 subagents run in parallel
```

**Integration:**
- **AORDL provides:** Precise field mapping (Intent → endpoint, Invariants → business rules)
- **Skills transform:** AORDL → Use cases, API design, business rules (zero information loss)
- **Subagents parallelize:** 56 independent design tasks (30 use cases + 25 API endpoints + 1 data dict)

---

### 2.2 Layer 2: Skills Integration Specification

#### 2.2.1 Skill Catalog Structure

**Skill Namespace:**
```
/rome/
├── validation/
│   ├── validate-entry-criteria
│   ├── validate-aordl
│   ├── validate-schema
│   ├── check-coverage
│   └── check-consistency
├── generation/
│   ├── generate-user-stories
│   ├── generate-acceptance-criteria
│   ├── generate-bdd
│   ├── generate-api-design
│   ├── generate-use-cases
│   ├── generate-data-dictionary
│   ├── generate-capability-matrix
│   └── build-dependency-graph
├── coordination/
│   ├── execute-phase
│   ├── prepare-handover
│   ├── execute-gate
│   └── log-phase-event
└── interaction/
    ├── clarify-requirement
    ├── request-approval
    └── notify-sponsor
```

---

#### 2.2.2 AORDL-Aware Skills

**Skills Optimized for AORDL Structure:**

| Skill | AORDL Field(s) Used | Benefit of AORDL |
|-------|--------------------|--------------------|
| `/validate-aordl` | All 13 fields | Precise field validation vs generic validation |
| `/generate-user-stories` | Actor, Intent, Outcomes | Direct mapping vs inference |
| `/generate-bdd` | Preconditions, Intent, Outcomes, Errors | Deterministic BDD generation |
| `/generate-api-endpoint` | Intent, Preconditions, Errors | Precise endpoint definition |
| `/generate-use-case` | Actor, Intent, Preconditions, Outcomes | Complete use case without gaps |
| `/extract-business-rules` | Invariants | Exact business rule extraction |
| `/generate-capability-matrix` | Actor, Intent | Clear capability identification |
| `/build-dependency-graph` | Preconditions, Conditions | Explicit dependency detection |
| `/check-coverage` | All fields | Field-level coverage analysis |

**Without AORDL:** Skills work on generic requirements (less precise)
**With AORDL:** Skills operate on structured fields (maximum precision)

---

#### 2.2.3 Skill Invocation from Subagents

**Pattern:**
```javascript
// Inside subagent execution context
const subagent = {
  type: 'SA-004', // User Story Generator
  execute: async (context) => {
    const { requirements } = context;

    // Subagent invokes skill
    const result = await invokeSkill('/generate-user-stories', {
      requirements: requirements,
      output: 'user-stories.md',
      format: 'epic-feature-story'
    });

    return result;
  }
};
```

**Integration Contract:**
- **Subagents** orchestrate high-level tasks
- **Skills** execute atomic operations
- **Subagents never duplicate skill logic** (always invoke skills)
- **Skills never spawn subagents** (layering discipline)

---

### 2.3 Layer 3: Subagents Integration Specification

#### 2.3.1 Subagent Catalog Organization

**AORDL-Specific Subagents:**

| Subagent | Primary Skill(s) | AORDL Integration |
|----------|------------------|-------------------|
| **SA-001: AORDL Validator** | /validate-aordl | Validates AORDL schema, vocab, anti-patterns |
| **SA-015: Capability Matrix Builder** | /generate-capability-matrix | Extracts Actor + Intent from AORDL |
| **SA-007: Dependency Analyzer** | /build-dependency-graph | Parses AORDL Preconditions/Conditions |
| **SA-004: User Story Generator** | /generate-user-stories | Transforms AORDL to stakeholder view |
| **SA-014: BDD Generator** | /generate-bdd | Maps AORDL to BDD scenarios |

**Generic Subagents (work with or without AORDL):**

| Subagent | Primary Skill(s) | AORDL Enhancement |
|----------|------------------|-------------------|
| **SA-006: Coverage Assessor** | /check-coverage | Field-level coverage if AORDL |
| **SA-010: API Designer** | /generate-api-endpoint | Precise mapping if AORDL |
| **SA-011: Use Case Generator** | /generate-use-case | Complete use cases if AORDL |
| **SA-019: Gate Validator** | /execute-gate | Traceability to AORDL if present |

---

#### 2.3.2 Subagent Spawning Patterns

**Pattern A: Fan-Out (Parallel Processing of AORDL)**
```javascript
// Parent: Talib, P1 validation
const requirements = loadAORDLFiles(); // 50 files
const batchSize = 10;
const batches = chunk(requirements, batchSize);

const subagents = batches.map((batch, i) =>
  spawnSubagent({
    type: 'SA-001',
    context: { requirements: batch },
    operations: batch.map(req => ({
      skill: '/validate-aordl',
      params: { requirement_file: req.path }
    }))
  })
);

await Promise.all(subagents);
```

**Pattern B: Specialized Delegation**
```javascript
// Parent: Talib, P2 enhancement
const subagents = [
  spawnSubagent({
    type: 'SA-015', // Capability Matrix Builder (expert)
    context: { requirements: aordlRequirements },
    operations: [{ skill: '/generate-capability-matrix' }]
  }),
  spawnSubagent({
    type: 'SA-007', // Dependency Analyzer (expert)
    context: { requirements: aordlRequirements },
    operations: [{ skill: '/build-dependency-graph' }]
  })
];

await Promise.all(subagents);
```

**Pattern C: Hybrid (Parallel + Sequential)**
```javascript
// Parent: PMA, P3 design
// Step 1: Build data dictionary (sequential, foundation)
const dataDictSubagent = await spawnSubagent({
  type: 'SA-009',
  operations: [{ skill: '/build-data-dictionary' }]
});

await dataDictSubagent.awaitCompletion();

// Step 2: Parallel design (depends on data dict)
const designSubagents = [
  spawnSubagent({ type: 'SA-010', operations: [{ skill: '/generate-api-design' }] }),
  spawnSubagent({ type: 'SA-011', operations: [{ skill: '/generate-use-cases' }] }),
  spawnSubagent({ type: 'SA-012', operations: [{ skill: '/generate-test-architecture' }] })
];

await Promise.all(designSubagents);
```

---

## 3. Phase-by-Phase Integration

### 3.1 Phase 0: Bootup (No Integration Changes)

**Current Process:** Bootstrap creates project structure
**With Integration:** No changes required

---

### 3.2 Phase 1: Ingest → AORDL Validation Gate

**Current Process (Traditional):**
- Read heterogeneous files (PDF, DOCX, images)
- Manually categorize and summarize
- ~8-12 hours

**Integrated Process (AORDL Mode):**

```yaml
phase: P1
robot: Talib
mode: AORDL_VALIDATION_GATE

workflow:
  - step: 1
    name: Detect Input Mode
    skill: /detect-input-mode
    params:
      source_dir: _user_input/raw-requirements/
    output:
      mode: AORDL | TRADITIONAL

  - step: 2
    name: Validate Entry Criteria
    skill: /validate-entry-criteria
    params:
      phase: P1
      robot: talib

  - step: 3
    name: Log Phase Start
    skill: /log-phase-event
    params:
      type: START
      phase: P1
      robot: talib

  - step: 4
    name: Parallel AORDL Validation
    subagents:
      - type: SA-001
        count: 5  # Spawn 5 subagents
        batch_size: 10  # Each handles 10 requirements
        operations:
          - skill: /validate-aordl
            params:
              requirement_file: ${batch_item}
              validation_rules: aordl-rules.yaml
    barrier: true  # Wait for all subagents

  - step: 5
    name: Merge Validation Reports
    skill: /merge-validation-reports
    params:
      input_reports: [validation-report-*.md]
      output: aordl-validation-report.md

  - step: 6
    name: Assess Coverage
    subagent:
      type: SA-006
      operations:
        - skill: /check-coverage
          params:
            requirements: aordl-requirements.yaml
            dimensions: [functional, data_model, ui, integration, security, performance, quality, deployment]
            output: coverage-report.md

  - step: 7
    name: Prepare Handover
    skill: /prepare-handover
    params:
      phase: P1
      template: handover-template.md
      artifacts_dir: ARTIFACTS/01-ingest/
      output: phase1-handover.md

  - step: 8
    name: Execute Gate P1
    skill: /execute-gate
    params:
      gate: GATE-P1
      artifacts_dir: ARTIFACTS/01-ingest/
      robot: sarah

  - step: 9
    name: Log Phase Complete
    skill: /log-phase-event
    params:
      type: COMPLETE
      phase: P1
      robot: talib

execution_time:
  traditional: 8-12 hours
  aordl_integrated: 2-3 hours
  speedup: 70-80%
```

**Integration Points:**
- **AORDL:** Structured input files (REQ-*.yaml)
- **Skills:** /validate-aordl, /check-coverage, /prepare-handover, /execute-gate
- **Subagents:** SA-001 (parallel validation), SA-006 (coverage assessment)

---

### 3.3 Phase 2: Analysis → AORDL Enhancement

**Current Process (Traditional):**
- Manual decomposition: Epic → Feature → Story → Criteria
- ~12.5 hours

**Integrated Process (AORDL Mode):**

```yaml
phase: P2
robot: Talib
mode: AORDL_ENHANCEMENT

workflow:
  - step: 1
    name: Validate Entry Criteria
    skill: /validate-entry-criteria
    params:
      phase: P2
      requires:
        - GATE-P1: APPROVED

  - step: 2
    name: Log Phase Start
    skill: /log-phase-event
    params:
      type: START
      phase: P2

  - step: 3
    name: Parallel AORDL Enhancement
    subagents_parallel:
      - subagent:
          type: SA-015
          name: capability-matrix-builder
          operations:
            - skill: /generate-capability-matrix
              params:
                requirements: aordl-requirements.yaml
                output: capability-matrix.yaml

      - subagent:
          type: SA-007
          name: dependency-analyzer
          operations:
            - skill: /build-dependency-graph
              params:
                requirements: aordl-requirements.yaml
                output: dependency-graph.yaml

      - subagent:
          type: SA-004
          name: user-story-generator
          operations:
            - skill: /generate-user-stories
              params:
                requirements: aordl-requirements.yaml
                output: user-stories.md
                format: epic-feature-story

      - subagent:
          type: SA-006
          name: coverage-assessor
          operations:
            - skill: /check-coverage
              params:
                requirements: aordl-requirements.yaml
                output: coverage-report.md

      - subagent:
          type: SA-014
          name: bdd-generator
          operations:
            - skill: /generate-bdd
              params:
                requirements: aordl-requirements.yaml
                output: bdd-scenarios.feature

    barrier: true  # Wait for all 5 subagents

  - step: 4
    name: Validate Coverage
    skill: /validate-coverage
    params:
      coverage_report: coverage-report.md
      threshold: 100%
      block_if_below: true

  - step: 5
    name: Prepare Handover
    skill: /prepare-handover
    params:
      phase: P2
      artifacts_dir: ARTIFACTS/02-analysis/
      output: phase2-handover.md

  - step: 6
    name: Execute Gate P2
    skill: /execute-gate
    params:
      gate: GATE-P2
      artifacts_dir: ARTIFACTS/02-analysis/
      robot: sarah

  - step: 7
    name: Log Phase Complete
    skill: /log-phase-event
    params:
      type: COMPLETE
      phase: P2

execution_time:
  traditional: 12.5 hours
  aordl_integrated: 1.5-2 hours
  speedup: 85-90%
```

**Integration Points:**
- **AORDL:** Source data (aordl-requirements.yaml from P1)
- **Skills:** /generate-capability-matrix, /build-dependency-graph, /generate-user-stories, /generate-bdd, /check-coverage
- **Subagents:** 5 parallel subagents (SA-015, SA-007, SA-004, SA-006, SA-014)

---

### 3.4 Phase 3: Design → AORDL Direct Consumption

**Current Process (Traditional):**
- Read user stories, infer requirements
- ~24 hours

**Integrated Process (AORDL Mode):**

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
      requires:
        - GATE-P2: APPROVED

  - step: 2
    name: Log Phase Start
    skill: /log-phase-event
    params:
      type: START
      phase: P3

  - step: 3
    name: Sponsor Design Kickoff
    skill: /request-approval
    params:
      title: Design Approach
      summary: |
        Proposed Architecture: AORDL-driven design
        - Direct field mapping (Intent → API, Invariants → Business Rules)
        - Zero information loss
      decision_type: approach

  - step: 4
    name: Build Data Dictionary
    subagent:
      type: SA-009
      operations:
        - skill: /build-data-dictionary
          params:
            requirements: aordl-requirements.yaml
            extract_from: [data_model, Invariants, NonFunctional]
            output: data-dictionary.yaml

  - step: 5
    name: Parallel Design Generation
    subagents_parallel:
      # 25 API endpoint designers (one per entity)
      - subagent:
          type: SA-010
          count: 25
          batch: entities  # From data dictionary
          operations:
            - skill: /generate-api-endpoint
              params:
                aordl_requirements: ${requirements_for_entity}
                entity: ${batch_item}
                data_dictionary: data-dictionary.yaml
                output: api-design.md

      # 30 use case generators (one per feature)
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
                requirements: aordl-requirements.yaml
                use_cases: use-cases.md
                output: test-architecture.md

      # 1 system architecture designer
      - subagent:
          type: SA-013
          operations:
            - skill: /generate-system-architecture
              params:
                requirements: aordl-requirements.yaml
                data_dictionary: data-dictionary.yaml
                nfrs: [extract NonFunctional from AORDL]
                output: system-architecture.md

    barrier: true  # Wait for all 57 subagents

  - step: 6
    name: Consistency Check
    skill: /check-consistency
    params:
      artifacts:
        - data-dictionary.yaml
        - api-design.md
        - use-cases.md
        - system-architecture.md
      check_types:
        - cross_artifact_references
        - data_type_consistency
        - requirement_coverage

  - step: 7
    name: Sponsor Design Review
    skill: /request-approval
    params:
      title: Architecture Review
      summary: |
        Complete AORDL-driven architecture
        - 25 API endpoints (from AORDL Intent)
        - 30 use cases (from AORDL Actor+Intent+Outcomes)
        - Business rules (from AORDL Invariants)
        - 100% requirement coverage
      decision_type: architecture

  - step: 8
    name: Prepare Handover
    skill: /prepare-handover
    params:
      phase: P3
      artifacts_dir: ARTIFACTS/03-design/
      output: phase3-handover.md

  - step: 9
    name: Execute Gate P3
    skill: /execute-gate
    params:
      gate: GATE-P3
      artifacts_dir: ARTIFACTS/03-design/
      robot: sarah

  - step: 10
    name: Log Phase Complete
    skill: /log-phase-event
    params:
      type: COMPLETE
      phase: P3

execution_time:
  traditional: 24 hours
  aordl_integrated: 8-10 hours
  speedup: 60-70%
```

**Integration Points:**
- **AORDL:** Direct consumption (Intent → endpoints, Invariants → business rules, Outcomes → use cases)
- **Skills:** /build-data-dictionary, /generate-api-endpoint, /generate-use-case, /generate-test-architecture, /check-consistency
- **Subagents:** 57 parallel subagents (25 API + 30 use cases + 1 test arch + 1 system arch)

---

### 3.5 Phase 4: Configuration → Parallel Workspace Setup

**Current Process (Traditional):**
- Manual workspace configuration: database schema, API scaffolding, UI framework setup
- ~2 hours

**Integrated Process (Skills + Subagents Mode):**

```yaml
phase: P4
robot: Clara
mode: PARALLEL_WORKSPACE_CONFIGURATION

workflow:
  - step: 1
    name: Validate Entry Criteria
    skill: /validate-entry-criteria
    params:
      phase: P4
      requires:
        - GATE-P3: APPROVED

  - step: 2
    name: Log Phase Start
    skill: /log-phase-event
    params:
      type: START
      phase: P4
      robot: clara

  - step: 3
    name: Load Design Artifacts
    operations:
      - Load data-dictionary.yaml (25 entities)
      - Load api-design.md (40 endpoints)
      - Load system-architecture.md (tech stack)
      - Load aordl-requirements.yaml (AORDL reference)

  - step: 4
    name: Parallel Workspace Configuration
    subagents_parallel:
      - subagent:
          type: SA-020
          name: database-configurator
          operations:
            - skill: /configure-database-workspace
              params:
                data_dictionary: data-dictionary.yaml
                aordl_requirements: aordl-requirements.yaml
                extract_constraints_from: [Invariants, NonFunctional]
                output_dir: workspace/database/
                tasks:
                  - Generate schema migration files
                  - Configure ORM models
                  - Setup database connection config
                  - Extract constraints from AORDL Invariants

      - subagent:
          type: SA-021
          name: api-configurator
          operations:
            - skill: /configure-api-workspace
              params:
                api_design: api-design.md
                aordl_requirements: aordl-requirements.yaml
                extract_validation_from: [Preconditions, Errors]
                output_dir: workspace/api/
                tasks:
                  - Generate route definitions (40 endpoints)
                  - Setup middleware config (auth from AORDL Preconditions)
                  - Configure error handlers (from AORDL Errors)
                  - Setup API documentation structure

      - subagent:
          type: SA-022
          name: ui-configurator
          operations:
            - skill: /configure-ui-workspace
              params:
                system_architecture: system-architecture.md
                aordl_requirements: aordl-requirements.yaml
                extract_flows_from: [Actor, Intent, Outcomes]
                output_dir: workspace/ui/
                tasks:
                  - Setup component library (30 screens)
                  - Configure routing (from AORDL Actor journeys)
                  - Setup state management
                  - Configure UI validation (from AORDL Invariants)

      - subagent:
          type: SA-023
          name: test-fixture-configurator
          operations:
            - skill: /configure-test-workspace
              params:
                test_architecture: test-architecture.md
                aordl_requirements: aordl-requirements.yaml
                extract_scenarios_from: [Preconditions, Outcomes, Errors]
                output_dir: workspace/tests/
                tasks:
                  - Generate test fixture structure
                  - Setup BDD test framework
                  - Configure test data (from AORDL Preconditions)
                  - Setup mocking infrastructure

      - subagent:
          type: SA-024
          name: environment-configurator
          operations:
            - skill: /configure-environment
              params:
                system_architecture: system-architecture.md
                aordl_requirements: aordl-requirements.yaml
                extract_nfrs_from: [NonFunctional]
                output_dir: workspace/
                tasks:
                  - Generate .env templates
                  - Setup CI/CD config
                  - Configure deployment scripts
                  - Setup monitoring config (from AORDL NonFunctional)

    barrier: true  # Wait for all 5 subagents

  - step: 5
    name: Validate Workspace Configuration
    skill: /validate-workspace
    params:
      workspace_dir: workspace/
      check_types:
        - directory_structure
        - config_file_validity
        - dependency_resolution
        - aordl_constraint_mapping

  - step: 6
    name: Prepare Handover
    skill: /prepare-handover
    params:
      phase: P4
      artifacts_dir: ARTIFACTS/04-config/
      output: phase4-handover.md

  - step: 7
    name: Execute Gate P4
    skill: /execute-gate
    params:
      gate: GATE-P4
      artifacts_dir: ARTIFACTS/04-config/
      robot: sarah

  - step: 8
    name: Log Phase Complete
    skill: /log-phase-event
    params:
      type: COMPLETE
      phase: P4
      robot: clara

execution_time:
  traditional: 130 minutes (sequential configuration)
  integrated: 30 minutes (5 parallel configurators)
  speedup: 77% faster (4.3×)
```

**Integration Points:**
- **AORDL:** Invariants → database constraints, Preconditions → auth config, Errors → error handlers, NonFunctional → deployment config
- **Skills:** /configure-database-workspace, /configure-api-workspace, /configure-ui-workspace, /configure-test-workspace, /configure-environment
- **Subagents:** 5 parallel configurators (SA-020 to SA-024)

**AORDL Direct Mapping Examples:**

**Database Configuration (from AORDL Invariants):**
```yaml
# AORDL REQ-002: create invoice
Invariants:
  - Invoice total = sum(line items) + tax + shipping
  - Invoice number sequential and unique

# Generated DB constraint (via SA-020 + /configure-database-workspace)
CREATE TABLE invoices (
  invoice_number SERIAL PRIMARY KEY UNIQUE,  -- From "sequential and unique"
  total DECIMAL CHECK (total = line_items_sum + tax + shipping),  -- From invariant
  ...
);
```

**API Configuration (from AORDL Preconditions & Errors):**
```yaml
# AORDL REQ-002: create invoice
Preconditions:
  - Customer authenticated
  - Customer has active subscription

Errors:
  - If line items empty: "Invoice must have at least one line item"

# Generated API middleware config (via SA-021 + /configure-api-workspace)
POST /api/invoices
  - Middleware: requireAuth()  // From "Customer authenticated"
  - Middleware: requireActiveSubscription()  // From "Customer has active subscription"
  - Validation: lineItems.length >= 1  // From Errors
```

---

### 3.6 Phase 5: Code Generation → Massive Parallel Code Generation

**Current Process (Traditional):**
- Sequential code generation: database → API → UI
- Ashok (DB): 25 entities × 10 min = 250 min
- Reena (API): 40 endpoints × 15 min = 600 min
- Charlie (UI): 30 screens × 20 min = 600 min
- **Total: ~24 hours**

**Integrated Process (AORDL + Skills + Subagents Mode):**

```yaml
phase: P5
robots: [Ashok, Reena, Charlie]
mode: MASSIVE_PARALLEL_CODE_GENERATION

workflow:
  # === ASHOK: DATABASE CODE GENERATION ===
  ashok_workflow:
    - step: 1
      name: Validate Entry Criteria
      skill: /validate-entry-criteria
      params:
        phase: P5
        robot: ashok
        requires:
          - GATE-P4: APPROVED

    - step: 2
      name: Log Phase Start
      skill: /log-phase-event
      params:
        type: START
        phase: P5-DB
        robot: ashok

    - step: 3
      name: Load Database Configuration
      operations:
        - Load workspace/database/schema.sql
        - Load data-dictionary.yaml (25 entities)
        - Load aordl-requirements.yaml (AORDL reference)

    - step: 4
      name: Parallel Database Entity Generation (25 CONCURRENT)
      subagents_parallel:
        # Spawn 25 subagents (one per entity)
        - subagent:
            type: SA-036
            count: 25
            batch: entities  # From data dictionary
            operations:
              - skill: /generate-database-entity
                params:
                  entity: ${batch_item}
                  aordl_requirements: ${requirements_for_entity}
                  extract_constraints_from: [Invariants, NonFunctional]
                  output_dir: database/models/
                  generate:
                    - ORM model class
                    - Migration file
                    - Seed data (from AORDL Preconditions)
                    - Constraints (from AORDL Invariants)
                    - Indexes (from AORDL NonFunctional.Performance)

      barrier: true  # Wait for all 25 entity generators
      time: 10 minutes (longest entity generation)

    - step: 5
      name: Generate Database Utilities
      skill: /generate-database-utilities
      params:
        entities: [all 25 entities]
        output_dir: database/utils/
        generate:
          - Connection pool manager
          - Transaction utilities
          - Query helpers

    - step: 6
      name: Log Ashok Complete
      skill: /log-phase-event
      params:
        type: COMPLETE
        phase: P5-DB
        robot: ashok

  # === REENA: API CODE GENERATION ===
  reena_workflow:
    - step: 1
      name: Validate Entry Criteria
      skill: /validate-entry-criteria
      params:
        phase: P5
        robot: reena

    - step: 2
      name: Log Phase Start
      skill: /log-phase-event
      params:
        type: START
        phase: P5-API
        robot: reena

    - step: 3
      name: Load API Configuration
      operations:
        - Load workspace/api/routes.yaml
        - Load api-design.md (40 endpoints)
        - Load aordl-requirements.yaml (AORDL reference)

    - step: 4
      name: Parallel API Endpoint Generation (40 CONCURRENT)
      subagents_parallel:
        # Spawn 40 subagents (one per endpoint)
        - subagent:
            type: SA-037
            count: 40
            batch: endpoints  # From API design
            operations:
              - skill: /generate-api-endpoint-code
                params:
                  endpoint: ${batch_item}
                  aordl_requirement: ${requirement_for_endpoint}
                  extract_logic_from: [Intent, Outcomes, Invariants, Errors]
                  output_dir: api/controllers/
                  generate:
                    - Route handler
                    - Request validation (from AORDL Preconditions)
                    - Business logic (from AORDL Invariants)
                    - Response formatting (from AORDL Outcomes)
                    - Error handling (from AORDL Errors)
                    - Auth middleware (from AORDL Preconditions)

      barrier: true  # Wait for all 40 endpoint generators
      time: 15 minutes (longest endpoint generation)

    - step: 5
      name: Generate API Utilities
      skill: /generate-api-utilities
      params:
        endpoints: [all 40 endpoints]
        output_dir: api/utils/
        generate:
          - Authentication middleware
          - Error response formatter
          - Logging middleware
          - API documentation (OpenAPI spec from AORDL)

    - step: 6
      name: Log Reena Complete
      skill: /log-phase-event
      params:
        type: COMPLETE
        phase: P5-API
        robot: reena

  # === CHARLIE: UI CODE GENERATION ===
  charlie_workflow:
    - step: 1
      name: Validate Entry Criteria
      skill: /validate-entry-criteria
      params:
        phase: P5
        robot: charlie

    - step: 2
      name: Log Phase Start
      skill: /log-phase-event
      params:
        type: START
        phase: P5-UI
        robot: charlie

    - step: 3
      name: Load UI Configuration
      operations:
        - Load workspace/ui/components.yaml
        - Load use-cases.md (30 screens)
        - Load aordl-requirements.yaml (AORDL reference)

    - step: 4
      name: Parallel UI Screen Generation (30 CONCURRENT)
      subagents_parallel:
        # Spawn 30 subagents (one per screen)
        - subagent:
            type: SA-038
            count: 30
            batch: screens  # From use cases
            operations:
              - skill: /generate-ui-screen-code
                params:
                  screen: ${batch_item}
                  aordl_requirements: ${requirements_for_screen}
                  extract_flows_from: [Actor, Intent, Outcomes, Errors]
                  output_dir: ui/screens/
                  generate:
                    - Component file (React/Vue/Flutter)
                    - State management
                    - Form validation (from AORDL Invariants)
                    - Error handling (from AORDL Errors)
                    - User flow logic (from AORDL Actor + Intent)
                    - API integration (from AORDL Outcomes)

      barrier: true  # Wait for all 30 screen generators
      time: 20 minutes (longest screen generation)

    - step: 5
      name: Generate UI Utilities
      skill: /generate-ui-utilities
      params:
        screens: [all 30 screens]
        output_dir: ui/utils/
        generate:
          - Routing configuration
          - State store setup
          - API client
          - Form validators (from AORDL Invariants)

    - step: 6
      name: Log Charlie Complete
      skill: /log-phase-event
      params:
        type: COMPLETE
        phase: P5-UI
        robot: charlie

  # === ORCHESTRATION: ALL THREE ROBOTS IN PARALLEL ===
  - step: FINAL
    name: Execute All Three Robots in Parallel
    parallel_execution:
      - Ashok workflow (25 subagents)
      - Reena workflow (40 subagents)
      - Charlie workflow (30 subagents)

    total_subagents: 95 concurrent
    barrier: true  # Wait for all 95 subagents

execution_time:
  traditional:
    ashok: 250 minutes (25 entities sequential)
    reena: 600 minutes (40 endpoints sequential)
    charlie: 600 minutes (30 screens sequential)
    total: 1450 minutes (~24 hours)

  integrated:
    ashok: 10 minutes (25 entities parallel)
    reena: 15 minutes (40 endpoints parallel)
    charlie: 20 minutes (30 screens parallel)
    total: 20 minutes (all three robots run in parallel, longest = Charlie)

  speedup: 98.6% faster (72.5×)
```

**Integration Points:**
- **AORDL:** Complete field mapping to code patterns
  - Invariants → Database constraints, Business logic, Form validation
  - Preconditions → Auth middleware, Request validation, Test setup
  - Intent → HTTP method, API handler name, User action logic
  - Outcomes → Response schemas, Success states, UI feedback
  - Errors → Error handlers, Validation messages, Error UI states
  - NonFunctional → Performance indexes, Security middleware, Logging
- **Skills:** /generate-database-entity, /generate-api-endpoint-code, /generate-ui-screen-code, /generate-*-utilities
- **Subagents:** 95 parallel code generators (25 DB + 40 API + 30 UI)

**AORDL-to-Code Direct Mapping Example:**

> **NOTE:** The code examples below are illustrative placeholders showing the AORDL-to-code mapping concept using generic technologies (Python ORM, JavaScript/Express, React). These will be replaced in a future revision with **Parse-server and Flutter SDK specific examples** based on expert patterns documented in `/Experts/expert_parse_server/` and `/Experts/expert_flutter/`. The actual ROME framework targets:
> - **Backend:** Parse-server (Parse Cloud Functions, Parse Classes)
> - **Frontend:** Flutter (BLoC pattern, DDD architecture, cross-platform)
>
> The mapping principles demonstrated below remain identical regardless of technology stack.

**Single AORDL Requirement Generates Complete Feature Stack:**

```yaml
# AORDL REQ-002: create invoice
ID: REQ-002
Actor: Customer
Intent: create invoice

Preconditions:
  - Customer authenticated
  - Customer has active subscription

Outcomes:
  - Invoice saved to database with unique ID
  - Customer receives email confirmation

Invariants:
  - Invoice total = sum(line items) + tax + shipping
  - Invoice number sequential and unique
  - Line items must have at least one entry

NonFunctional:
  - Performance: Invoice creation <2 seconds
  - Security: Requires JWT authentication

Errors:
  - If line items empty: "Invoice must have at least one line item"
  - If subscription inactive: "Active subscription required"
```

**↓ Generates (via 3 subagents in parallel):**

**1. Database Code (SA-036 + /generate-database-entity):**
```python
# database/models/invoice.py
class Invoice(Model):
    __tablename__ = 'invoices'

    # From "Invoice number sequential and unique"
    invoice_number = Column(Integer, Sequence('invoice_seq'), primary_key=True, unique=True)

    # From Invariants
    line_items_sum = Column(Decimal, nullable=False)
    tax = Column(Decimal, nullable=False)
    shipping = Column(Decimal, nullable=False)
    total = Column(Decimal, nullable=False)

    # From Outcomes
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False)
    email_sent = Column(Boolean, default=False)

    # From NonFunctional.Performance
    __table_args__ = (Index('idx_invoice_customer', 'customer_id'),)

    # From Invariants: Business rule validation
    @validates('total')
    def validate_total(self, key, value):
        assert value == self.line_items_sum + self.tax + self.shipping, \
            "Invoice total must equal sum(line items) + tax + shipping"
        return value

    # From Invariants: "Line items must have at least one entry"
    @validates('line_items')
    def validate_line_items(self, key, value):
        assert len(value) >= 1, "Invoice must have at least one line item"
        return value
```

**2. API Code (SA-037 + /generate-api-endpoint-code):**
```javascript
// api/controllers/invoices.js

// From Intent: "create invoice"
router.post('/api/invoices',
  // From Preconditions: "Customer authenticated"
  requireAuth(),
  // From Preconditions: "Customer has active subscription"
  requireActiveSubscription(),
  // From NonFunctional.Security
  validateJWT(),

  async (req, res) => {
    try {
      const { line_items, tax, shipping } = req.body;

      // From Errors: "If line items empty"
      if (!line_items || line_items.length === 0) {
        return res.status(400).json({
          error: "Invoice must have at least one line item"
        });
      }

      // From Invariants: Calculate total
      const line_items_sum = line_items.reduce((sum, item) => sum + item.amount, 0);
      const total = line_items_sum + tax + shipping;

      // From Outcomes: "Invoice saved to database with unique ID"
      const invoice = await Invoice.create({
        customer_id: req.user.id,
        line_items_sum,
        tax,
        shipping,
        total,
        line_items
      });

      // From Outcomes: "Customer receives email confirmation"
      await sendInvoiceEmail(req.user.email, invoice);

      // From NonFunctional.Performance: <2 seconds (logged)
      res.status(201).json({
        invoice_id: invoice.invoice_number,
        status: 'created'
      });

    } catch (error) {
      // From Errors
      if (error.message.includes('subscription')) {
        return res.status(403).json({
          error: "Active subscription required"
        });
      }
      res.status(500).json({ error: error.message });
    }
  }
);
```

**3. UI Code (SA-038 + /generate-ui-screen-code):**
```javascript
// ui/screens/InvoiceCreateScreen.jsx

// From Actor: "Customer"
// From Intent: "create invoice"
function InvoiceCreateScreen() {
  const [lineItems, setLineItems] = useState([]);  // From Invariants
  const [tax, setTax] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [error, setError] = useState(null);  // From Errors

  // From Invariants: "Invoice total = sum(line items) + tax + shipping"
  const total = lineItems.reduce((sum, item) => sum + item.amount, 0) + tax + shipping;

  const handleSubmit = async () => {
    // From Errors: "If line items empty"
    if (lineItems.length === 0) {
      setError("Invoice must have at least one line item");
      return;
    }

    try {
      // From Intent: create invoice
      const response = await api.post('/api/invoices', {
        line_items: lineItems,
        tax,
        shipping
      });

      // From Outcomes: "Invoice saved to database with unique ID"
      // From Outcomes: "Customer receives email confirmation"
      showSuccessMessage(`Invoice ${response.invoice_id} created. Confirmation email sent.`);

    } catch (err) {
      // From Errors
      if (err.response?.status === 403) {
        setError("Active subscription required");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div>
      <h1>Create Invoice</h1>  {/* From Intent */}

      {/* From Errors: Display validation */}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* From Invariants: Line items input */}
      <LineItemsInput
        items={lineItems}
        onChange={setLineItems}
        minItems={1}  {/* From "at least one entry" */}
      />

      {/* From Invariants: Show calculated total */}
      <TotalDisplay
        lineItemsSum={lineItems.reduce((s, i) => s + i.amount, 0)}
        tax={tax}
        shipping={shipping}
        total={total}
      />

      <button onClick={handleSubmit}>Create Invoice</button>
    </div>
  );
}
```

**Result:** Single AORDL requirement → Complete working feature (DB + API + UI) with zero information loss, generated in parallel by 3 subagents.

---

**Complete P0-P5 Integration Summary:**

```yaml
complete_lifecycle_execution:
  P0_Bootup:
    time: 30 minutes
    integration: None (unchanged)

  P1_Validation:
    traditional: 8-12 hours
    integrated: 2-3 hours
    speedup: 70-80%
    subagents: 5 parallel validators

  P2_Analysis:
    traditional: 12.5 hours
    integrated: 1.5-2 hours
    speedup: 85-90%
    subagents: 5 parallel enhancers

  P3_Design:
    traditional: 24 hours
    integrated: 8-10 hours
    speedup: 60-70%
    subagents: 57 parallel designers

  P4_Configuration:
    traditional: 2.2 hours
    integrated: 30 minutes
    speedup: 77%
    subagents: 5 parallel configurators

  P5_Generation:
    traditional: 24 hours
    integrated: 20-30 minutes
    speedup: 98%
    subagents: 95 parallel code generators (25 DB + 40 API + 30 UI)

total_lifecycle:
  traditional: 72-74 hours
  integrated: 12-16 hours
  overall_speedup: 80-85%
  total_max_concurrent_subagents: 95 (in P5)
```

**PRIMARY RECOMMENDATION:** Extend AORDL + Skills + Subagents integration to P4-P5 for massive parallelization benefits and complete AORDL-to-code traceability.

---

## 4. API Contracts

### 4.1 AORDL → Skills Contract

**Skills Consuming AORDL Data:**

| Skill | AORDL Input | Output | Contract |
|-------|------------|--------|----------|
| `/validate-aordl` | REQ-XXX.yaml | validation-report.md | Must validate all 13 fields |
| `/generate-user-stories` | aordl-requirements.yaml | user-stories.md | Maps Actor+Intent+Outcomes |
| `/generate-api-endpoint` | AORDL requirement | api-design.md entry | Maps Intent to HTTP method+resource |
| `/extract-business-rules` | AORDL Invariants | data-dictionary business_rules | Extracts all invariants |
| `/generate-use-case` | AORDL requirement | use-cases.md entry | Maps all fields to use case sections |

**Contract Requirements:**
```yaml
skill_contract:
  input:
    format: AORDL requirement (YAML or parsed object)
    required_fields: [ID, Actor, Intent]  # Minimum
    optional_fields: [all other AORDL fields]

  processing:
    must_handle_missing_fields: true
    must_preserve_requirement_id: true
    must_maintain_traceability: true

  output:
    must_reference_requirement_id: true
    must_include_source_field_mapping: true  # Which AORDL field → output
```

---

### 4.2 Skills → Subagents Contract

**Subagents Invoking Skills:**

```javascript
// Subagent invocation contract
interface SkillInvocation {
  skill: string;  // Skill path: /rome/category/skill-name
  params: {
    [key: string]: any;  // Skill-specific parameters
  };
  timeout?: number;  // Optional timeout (ms)
  retry?: {
    attempts: number;
    backoff: 'linear' | 'exponential';
  };
}

// Subagent execution contract
interface SubagentExecution {
  context: {
    // Data passed to subagent
    requirements?: any[];
    templates?: any;
    // ...
  };
  operations: SkillInvocation[];  // Skills to invoke
  parallel?: boolean;  // Execute operations in parallel
}

// Example
const subagent = {
  type: 'SA-004',
  context: { requirements: aordlRequirements },
  operations: [
    {
      skill: '/generate-user-stories',
      params: {
        requirements: '${context.requirements}',
        output: 'user-stories.md'
      },
      timeout: 600000
    }
  ]
};
```

**Contract Requirements:**
```yaml
invocation_contract:
  subagent_must:
    - Invoke skills by name (never duplicate skill logic)
    - Pass required parameters
    - Handle skill errors (timeout, failure)
    - Return skill outputs to parent

  skill_must:
    - Accept parameters as specified
    - Return structured output
    - Log activity (via activity-log MCP)
    - Throw clear errors on failure
```

---

### 4.3 Parent Robot → Subagents Contract

**Parent Spawning Subagents:**

```javascript
interface SubagentSpawn {
  type: string;  // Subagent type: SA-001 to SA-030
  name?: string;  // Optional instance name
  context: {
    // Data available to subagent
    [key: string]: any;
  };
  operations: SkillInvocation[];
  run_in_background?: boolean;  // Parallel execution
  timeout?: number;
}

// Parent contract
const parent = {
  spawnSubagent: async (config: SubagentSpawn) => {
    // Spawn subagent
    // Return subagent handle
  },

  awaitSubagent: async (subagentHandle) => {
    // Wait for completion
    // Return results
  },

  awaitAll: async (subagentHandles[]) => {
    // Barrier synchronization
    // Return all results
  }
};
```

**Contract Requirements:**
```yaml
parent_subagent_contract:
  parent_must:
    - Provide complete context to subagent
    - Handle subagent failures gracefully
    - Merge subagent results
    - Log subagent spawn/complete events

  subagent_must:
    - Execute operations autonomously
    - Return structured results
    - Report errors clearly
    - Respect timeout limits
```

---

## 5. Integration Points

### 5.1 Month 4: Integration Pilot

**Objective:** Validate AORDL + Skills + Subagents working together in single pilot project

**Pilot Project Specifications:**
- **Size:** Medium complexity (20-30 AORDL requirements)
- **Scope:** P1 → P2 → P3 execution
- **Success Criteria:** 70%+ speedup vs baseline

**Integration Validation:**

**Test 1: AORDL Validation (P1)**
```
Input: 25 AORDL requirements (REQ-001 to REQ-025)

Expected:
- 5 subagents spawned (SA-001, 5 requirements each)
- Each subagent invokes /validate-aordl skill
- Validation completes in ~3 minutes (vs 30 minutes sequential)
- All validation reports merged correctly
- GATE-P1 executed via /execute-gate skill

Actual: [Record results]
```

**Test 2: AORDL Enhancement (P2)**
```
Input: 25 validated AORDL requirements

Expected:
- 5 subagents spawned in parallel:
  - SA-015: Capability matrix (2 min)
  - SA-007: Dependency graph (3 min)
  - SA-004: User stories (2 min)
  - SA-006: Coverage assessment (2 min)
  - SA-014: BDD scenarios (2 min)
- Total time: Max(2,3,2,2,2) = 3 minutes (vs 15 minutes sequential)
- GATE-P2 passes

Actual: [Record results]
```

**Test 3: AORDL Direct Consumption (P3)**
```
Input: 25 AORDL requirements, 15 entities

Expected:
- 1 subagent: Data dictionary builder (5 min)
- 15 subagents: API designers (parallel, 5 min total)
- 25 subagents: Use case generators (parallel, 3 min total)
- 1 subagent: Test architecture (4 min)
- Total: 5 + 5 + 3 + 4 = 17 minutes (vs 120 minutes sequential)
- 100% AORDL field coverage in artifacts
- GATE-P3 passes

Actual: [Record results]
```

**Pilot Success Criteria:**
- ✓ P1: 90% faster (3 min vs 30 min)
- ✓ P2: 80% faster (3 min vs 15 min)
- ✓ P3: 85% faster (17 min vs 120 min)
- ✓ Overall: 80%+ speedup (23 min vs 165 min)
- ✓ Zero information loss (AORDL fields fully mapped to artifacts)
- ✓ All gates pass

**Integration Issues Log:**
- [Document any integration conflicts discovered]
- [Document resolution approaches]

---

### 5.2 Month 9: Mid-Point Integration Validation

**Objective:** Validate production-scale integration (100+ requirements)

**Validation Tests:**

**Scalability Test:**
```
Input: 100 AORDL requirements

Expected:
- P1: 10 subagents (10 req each) = 5 minutes
- P2: 5 parallel subagents = 5 minutes
- P3: 60+ parallel subagents = 20 minutes
- Total: 30 minutes (vs 600 minutes sequential = 95% faster)

Actual: [Record results]
```

**Consistency Test:**
```
Test: Run same 100 requirements 3 times

Expected:
- Identical artifacts produced
- Skills provide deterministic results
- No race conditions in parallel execution

Actual: [Record results]
```

**Error Handling Test:**
```
Test: Introduce invalid AORDL requirement

Expected:
- /validate-aordl skill detects error
- Subagent reports failure to parent
- GATE-P1 blocks with clear error
- Sponsor receives actionable feedback

Actual: [Record results]
```

---

### 5.3 Month 12: Production Integration Deployment

**Objective:** Deploy fully integrated system to production

**Deployment Checklist:**
- ✓ All 50 skills implemented and tested
- ✓ All 30 subagents implemented and tested
- ✓ AORDL mode integrated into P1/P2/P3 phase definitions
- ✓ Robot definitions (Talib, PMA, Sarah) updated
- ✓ 20+ projects completed successfully in staging
- ✓ Integration test suite passing (100% pass rate)
- ✓ Documentation complete (integration guide, examples)

**Production Validation:**
```
First 10 production projects:
- Monitor execution time vs baseline
- Track integration issue rate
- Collect sponsor feedback
- Measure artifact quality (information loss %)

Target Metrics:
- 80%+ speedup maintained
- <5% integration issue rate
- Zero information loss
- Sponsor satisfaction >90%
```

---

## 6. Workflow Examples

### 6.1 Complete P2 Workflow (AORDL + Skills + Subagents)

**Scenario:** Talib executes P2 Analysis with 50 AORDL requirements

```javascript
// Talib Robot - P2 Analysis Workflow
async function executePhaseTwo() {

  // Step 1: Validate entry criteria (Skill)
  await invokeSkill('/validate-entry-criteria', {
    phase: 'P2',
    robot: 'talib',
    requires: { 'GATE-P1': 'APPROVED' }
  });

  // Step 2: Log phase start (Skill)
  await invokeSkill('/log-phase-event', {
    type: 'START',
    phase: 'P2',
    robot: 'talib'
  });

  // Step 3: Load AORDL requirements (AORDL data source)
  const requirements = await loadAORDLRequirements(); // 50 requirements

  // Step 4: Spawn parallel subagents for enhancement
  const subagents = [

    // Subagent A: Capability Matrix Builder
    spawnSubagent({
      type: 'SA-015',
      name: 'capability-matrix-builder',
      context: { requirements },
      operations: [{
        skill: '/generate-capability-matrix',
        params: {
          requirements: requirements,
          output: 'ARTIFACTS/02-analysis/capability-matrix.yaml'
        }
      }]
    }),

    // Subagent B: Dependency Analyzer
    spawnSubagent({
      type: 'SA-007',
      name: 'dependency-analyzer',
      context: { requirements },
      operations: [{
        skill: '/build-dependency-graph',
        params: {
          requirements: requirements,
          output: 'ARTIFACTS/02-analysis/dependency-graph.yaml'
        }
      }]
    }),

    // Subagent C: User Story Generator
    spawnSubagent({
      type: 'SA-004',
      name: 'user-story-generator',
      context: { requirements },
      operations: [{
        skill: '/generate-user-stories',
        params: {
          requirements: requirements,
          output: 'ARTIFACTS/02-analysis/user-stories.md',
          format: 'epic-feature-story'
        }
      }]
    }),

    // Subagent D: Coverage Assessor
    spawnSubagent({
      type: 'SA-006',
      name: 'coverage-assessor',
      context: { requirements },
      operations: [{
        skill: '/check-coverage',
        params: {
          requirements: requirements,
          dimensions: ['functional', 'data_model', 'ui', 'integration',
                       'security', 'performance', 'quality', 'deployment'],
          output: 'ARTIFACTS/02-analysis/coverage-report.md'
        }
      }]
    }),

    // Subagent E: BDD Generator
    spawnSubagent({
      type: 'SA-014',
      name: 'bdd-generator',
      context: { requirements },
      operations: [{
        skill: '/generate-bdd',
        params: {
          requirements: requirements,
          output: 'ARTIFACTS/02-analysis/bdd-scenarios.feature'
        }
      }]
    })
  ];

  // Step 5: Wait for all subagents (Barrier synchronization)
  console.log('Waiting for 5 parallel subagents...');
  const results = await Promise.all(subagents);
  console.log('All subagents completed.');

  // Step 6: Validate coverage (Skill)
  const coverageValid = await invokeSkill('/validate-coverage', {
    coverage_report: 'ARTIFACTS/02-analysis/coverage-report.md',
    threshold: 100,
    block_if_below: true
  });

  if (!coverageValid.passed) {
    throw new Error('Coverage below 100%: ' + coverageValid.gaps.join(', '));
  }

  // Step 7: Prepare handover (Skill)
  await invokeSkill('/prepare-handover', {
    phase: 'P2',
    template: '/ROME/robot-templates/talib/handover-template.md',
    artifacts_dir: 'ARTIFACTS/02-analysis/',
    output: 'ARTIFACTS/02-analysis/phase2-handover.md'
  });

  // Step 8: Execute gate (Skill invoking Sarah)
  const gateResult = await invokeSkill('/execute-gate', {
    gate: 'GATE-P2',
    artifacts_dir: 'ARTIFACTS/02-analysis/',
    robot: 'sarah'
  });

  if (gateResult.decision !== 'APPROVE') {
    throw new Error('GATE-P2 blocked: ' + gateResult.violations.join(', '));
  }

  // Step 9: Log phase complete (Skill)
  await invokeSkill('/log-phase-event', {
    type: 'COMPLETE',
    phase: 'P2',
    robot: 'talib'
  });

  console.log('P2 Analysis complete: 5 artifacts generated in parallel.');
}
```

**Execution Timeline:**
```
0:00 - Validate entry (2s)
0:02 - Log start (1s)
0:03 - Load AORDL (5s)
0:08 - Spawn 5 subagents (1s)
0:09 - Subagents run in parallel:
       - SA-015: Capability matrix (2 min)
       - SA-007: Dependency graph (3 min)
       - SA-004: User stories (2 min)
       - SA-006: Coverage assessment (2 min)
       - SA-014: BDD scenarios (2 min)
3:09 - All subagents complete (barrier)
3:09 - Validate coverage (30s)
3:39 - Prepare handover (30s)
4:09 - Execute GATE-P2 (1 min)
5:09 - Log complete (1s)

Total: 5 minutes 10 seconds
```

**Without Integration (Baseline):**
```
Sequential execution:
- Capability matrix: 15 min
- Dependency graph: 20 min
- User stories: 60 min
- Coverage assessment: 30 min
- BDD scenarios: 15 min
- Handover: 20 min
- Gate: 30 min

Total: 190 minutes (3 hours 10 minutes)

Speedup: 190 min / 5.17 min = 36.7× faster (97% reduction)
```

---

### 6.2 Complete P3 Workflow (AORDL + Skills + Subagents)

**Scenario:** PMA executes P3 Design with 30 AORDL requirements and 20 entities

```javascript
// PMA Robot - P3 Design Workflow
async function executePhaseThree() {

  // Step 1-2: Entry validation and logging
  await invokeSkill('/validate-entry-criteria', { phase: 'P3', robot: 'pma' });
  await invokeSkill('/log-phase-event', { type: 'START', phase: 'P3', robot: 'pma' });

  // Step 3: Load AORDL requirements
  const requirements = await loadAORDLRequirements(); // 30 requirements

  // Step 4: Sponsor kickoff (Interactive skill)
  await invokeSkill('/request-approval', {
    title: 'Design Approach',
    summary: 'AORDL-driven direct consumption architecture',
    decision_type: 'approach'
  });

  // Step 5: Build data dictionary (Sequential foundation)
  const dataDictSubagent = spawnSubagent({
    type: 'SA-009',
    name: 'data-dictionary-builder',
    context: { requirements },
    operations: [{
      skill: '/build-data-dictionary',
      params: {
        requirements: requirements,
        extract_from: ['data_model', 'Invariants', 'NonFunctional'],
        output: 'ARTIFACTS/03-design/data-dictionary.yaml'
      }
    }]
  });

  await dataDictSubagent.awaitCompletion();
  const dataDictionary = await loadDataDictionary();
  const entities = dataDictionary.entities; // 20 entities

  // Step 6: Spawn massive parallel design
  const designSubagents = [

    // 20 API endpoint designers (one per entity)
    ...entities.map(entity =>
      spawnSubagent({
        type: 'SA-010',
        name: `api-designer-${entity.name}`,
        context: { entity, requirements, dataDictionary },
        operations: [{
          skill: '/generate-api-endpoint',
          params: {
            aordl_requirements: requirements.filter(r => r.entity === entity.name),
            entity: entity,
            data_dictionary: dataDictionary,
            output: 'ARTIFACTS/03-design/api-design.md'
          }
        }]
      })
    ),

    // 30 use case generators (one per requirement)
    ...requirements.map(req =>
      spawnSubagent({
        type: 'SA-011',
        name: `use-case-generator-${req.id}`,
        context: { requirement: req },
        operations: [{
          skill: '/generate-use-case',
          params: {
            aordl_requirement: req,
            output: 'ARTIFACTS/03-design/use-cases.md'
          }
        }]
      })
    ),

    // 1 test architecture designer
    spawnSubagent({
      type: 'SA-012',
      name: 'test-architecture-designer',
      context: { requirements },
      operations: [{
        skill: '/generate-test-architecture',
        params: {
          requirements: requirements,
          use_cases: 'ARTIFACTS/03-design/use-cases.md',
          output: 'ARTIFACTS/03-design/test-architecture.md'
        }
      }]
    }),

    // 1 system architecture designer
    spawnSubagent({
      type: 'SA-013',
      name: 'system-architecture-designer',
      context: { requirements, dataDictionary },
      operations: [{
        skill: '/generate-system-architecture',
        params: {
          requirements: requirements,
          data_dictionary: dataDictionary,
          nfrs: requirements.flatMap(r => r.NonFunctional),
          output: 'ARTIFACTS/03-design/system-architecture.md'
        }
      }]
    })
  ];

  console.log(`Spawning ${designSubagents.length} parallel subagents for design...`);
  await Promise.all(designSubagents); // 52 subagents in parallel
  console.log('All design subagents completed.');

  // Step 7: Consistency check
  await invokeSkill('/check-consistency', {
    artifacts: [
      'data-dictionary.yaml',
      'api-design.md',
      'use-cases.md',
      'system-architecture.md'
    ],
    check_types: ['cross_artifact_references', 'data_type_consistency', 'requirement_coverage']
  });

  // Step 8: Sponsor design review
  await invokeSkill('/request-approval', {
    title: 'Architecture Review',
    summary: '20 API endpoints, 30 use cases, complete from AORDL',
    decision_type: 'architecture'
  });

  // Step 9: Prepare handover
  await invokeSkill('/prepare-handover', {
    phase: 'P3',
    artifacts_dir: 'ARTIFACTS/03-design/',
    output: 'ARTIFACTS/03-design/phase3-handover.md'
  });

  // Step 10: Execute gate
  await invokeSkill('/execute-gate', {
    gate: 'GATE-P3',
    artifacts_dir: 'ARTIFACTS/03-design/',
    robot: 'sarah'
  });

  // Step 11: Log complete
  await invokeSkill('/log-phase-event', {
    type: 'COMPLETE',
    phase: 'P3',
    robot: 'pma'
  });

  console.log('P3 Design complete: 52 parallel subagents generated complete architecture.');
}
```

**Execution Timeline:**
```
0:00 - Entry validation (2s)
0:02 - Log start (1s)
0:03 - Load AORDL (5s)
0:08 - Sponsor kickoff (60s)
1:08 - Build data dictionary (5 min)
6:08 - Spawn 52 subagents (2s)
6:10 - Subagents run in parallel:
       - 20 API designers: 5 min each
       - 30 use case generators: 3 min each
       - 1 test arch: 4 min
       - 1 system arch: 5 min
       Max: 5 minutes
11:10 - Consistency check (2 min)
13:10 - Sponsor review (60s)
14:10 - Prepare handover (30s)
14:40 - Execute GATE-P3 (2 min)
16:40 - Log complete (1s)

Total: 16 minutes 41 seconds
```

**Without Integration (Baseline):**
```
Sequential execution:
- Data dictionary: 120 min
- API design (20 entities): 140 min
- Use cases (30 features): 180 min
- Test architecture: 60 min
- System architecture: 90 min
- Consistency check: 30 min
- Handover: 30 min
- Gate: 60 min

Total: 710 minutes (11 hours 50 minutes)

Speedup: 710 min / 16.68 min = 42.6× faster (98% reduction)
```

---

## 7. Implementation Requirements

### 7.1 AORDL Implementation Requirements

**Templates:**
- ✓ YAML template (REQ-template.yaml)
- ✓ Markdown template (REQ-template.md)
- ✓ Web form (aordl-authoring-form.html)

**Validation Rules:**
- ✓ AORDL schema definition (aordl-schema.yaml)
- ✓ Controlled vocabulary (approved-verbs.yaml, approved-objects.yaml)
- ✓ Anti-pattern rules (anti-patterns.yaml)

**Framework Updates:**
- ✓ ROME-PHASE-002 (P1 dual-mode support)
- ✓ ROME-PHASE-003 (P2 AORDL enhancement mode)
- ✓ ROME-PHASE-004 (P3 AORDL direct consumption)
- ✓ ROME-ROBOT-002 (Talib AORDL procedures)
- ✓ ROME-ROBOT-003 (PMA AORDL procedures)
- ✓ ROME-LEX-001 (AORDL terminology)

---

### 7.2 Skills Implementation Requirements

**Skill Framework:**
- ✓ Skill invocation mechanism (invoke skill by name)
- ✓ Skill parameter passing
- ✓ Skill result return
- ✓ Skill error handling

**Skill Catalog (50 skills):**
- ✓ Tier 1 (20 skills): HIGH impact
- ✓ Tier 2 (20 skills): MEDIUM impact
- ✓ Tier 3 (10 skills): LOW impact

**AORDL-Aware Skills (Priority):**
- ✓ /validate-aordl
- ✓ /generate-user-stories
- ✓ /generate-bdd
- ✓ /generate-api-endpoint
- ✓ /generate-use-case
- ✓ /extract-business-rules
- ✓ /generate-capability-matrix
- ✓ /build-dependency-graph

**Framework Updates:**
- ✓ Robot definitions to YAML skill orchestration
- ✓ Skill catalog documentation
- ✓ Skill usage examples

---

### 7.3 Subagents Implementation Requirements

**Subagent Framework:**
- ✓ Subagent spawning mechanism
- ✓ Parallel execution (Promise.all support)
- ✓ Barrier synchronization
- ✓ Result merging
- ✓ Error handling and retry

**Subagent Catalog (30 subagents):**
- ✓ Tier 1 (15 subagents): HIGH impact
- ✓ Tier 2 (12 subagents): MEDIUM impact
- ✓ Tier 3 (3 subagents): LOW impact

**AORDL-Specific Subagents (Priority):**
- ✓ SA-001: AORDL Validator
- ✓ SA-015: Capability Matrix Builder
- ✓ SA-007: Dependency Analyzer
- ✓ SA-004: User Story Generator
- ✓ SA-014: BDD Generator

**Framework Updates:**
- ✓ Robot definitions with subagent orchestration
- ✓ Subagent catalog documentation
- ✓ Subagent usage examples

---

## 8. Validation Criteria

### 8.1 Integration Validation (Month 4 Pilot)

**Functional Validation:**
- ✓ AORDL files load correctly in P1
- ✓ Skills invoke successfully from subagents
- ✓ Subagents spawn and execute in parallel
- ✓ Results merge correctly
- ✓ Gates execute with integrated artifacts

**Performance Validation:**
- ✓ P1: 70%+ faster with AORDL + Skills + Subagents
- ✓ P2: 80%+ faster with integrated approach
- ✓ P3: 60%+ faster with integrated approach
- ✓ Overall: 70%+ faster vs baseline

**Quality Validation:**
- ✓ Zero information loss (AORDL fields → artifacts)
- ✓ 100% requirement coverage
- ✓ No race conditions in parallel execution
- ✓ Deterministic results (same input → same output)

---

### 8.2 Production Validation (Month 12)

**Scale Validation:**
- ✓ 100+ AORDL requirements processed successfully
- ✓ 50+ parallel subagents execute without resource exhaustion
- ✓ Consistent performance across project sizes

**Reliability Validation:**
- ✓ <5% integration issue rate
- ✓ Graceful error handling (subagent failures, skill errors)
- ✓ Retry mechanisms work correctly

**Consistency Validation:**
- ✓ Skills produce identical results across invocations
- ✓ No drift between manual and skill-based execution
- ✓ AORDL validation catches all anti-patterns

---

## 9. Migration Path

### 9.1 Current to Integrated (Existing Projects)

**Option A: Rewrite Requirements to AORDL**
```
Steps:
1. Export current requirements-matrix.yaml
2. For each requirement, create AORDL file:
   - Functional requirement → AORDL requirement
   - User story → AORDL Actor + Intent + Outcomes
   - Acceptance criteria → AORDL Postconditions + Outcomes
3. Validate AORDL files (via /validate-aordl skill)
4. Re-run P2 with AORDL mode
5. Re-run P3 with AORDL direct consumption

Effort: Medium (8-16 hours for 50 requirements)
Benefit: Full integrated benefits
```

**Option B: Continue Traditional Mode**
```
Steps:
1. Keep current requirements
2. Use Skills + Subagents without AORDL
3. Benefits: 60% speedup (Skills + Subagents)
4. Tradeoff: No AORDL precision benefits

Effort: Low (no requirement rewrite)
Benefit: Partial integrated benefits
```

**Recommendation:** Option A for active projects, Option B for legacy projects

---

### 9.2 Framework Migration Sequence

**Phase 1 (Months 1-4): Foundation**
```
Month 1:
- Implement skill framework
- Implement subagent framework
- Create AORDL templates

Month 2-3:
- Implement Tier 1 skills (20 skills)
- Implement Tier 1 subagents (10 subagents)
- Update Talib/PMA with skill/subagent support

Month 4:
- Integration pilot (validate all three working together)
```

**Phase 2 (Months 5-12): Transformation**
```
Month 5-7:
- Implement all 50 skills
- Implement all 30 subagents
- Update all 8 robot definitions

Month 8-10:
- Transform robot definitions to YAML
- Update all phase operation guidelines
- Production staging tests

Month 11-12:
- Production deployment
- 20+ projects completed
- Metrics validation
```

**Phase 3 (Months 13-18): Optimization**
```
Month 13-15:
- Advanced skill patterns
- Recursive subagent execution
- Generated stakeholder views

Month 16-18:
- Skill marketplace
- Subagent marketplace
- Framework evolution complete
```

---

## 10. Appendices

### Appendix A: Integration Checklist

**Pre-Implementation:**
- [ ] All three proposals reviewed and approved
- [ ] Integration team established
- [ ] Development resources allocated
- [ ] Pilot project selected

**Month 4 Integration Pilot:**
- [ ] AORDL templates created
- [ ] 20 Tier 1 skills implemented
- [ ] 10 Tier 1 subagents implemented
- [ ] Pilot project completed
- [ ] 70%+ speedup validated
- [ ] Go/No-Go decision for Phase 2

**Month 12 Production Deployment:**
- [ ] All 50 skills implemented
- [ ] All 30 subagents implemented
- [ ] All robot definitions updated
- [ ] 20+ projects completed in staging
- [ ] 80%+ speedup validated
- [ ] Production deployment approved

**Month 18 Framework Evolution Complete:**
- [ ] Advanced features implemented
- [ ] Skill/Subagent marketplaces operational
- [ ] 85%+ speedup validated at scale
- [ ] Framework evolution complete

---

### Appendix B: Metrics Tracking Template

```yaml
project:
  name: [Project Name]
  requirements_count: [N]
  mode: AORDL | TRADITIONAL

baseline_metrics:
  p1_time: [hours]
  p2_time: [hours]
  p3_time: [hours]
  total_time: [hours]

integrated_metrics:
  p1_time: [hours]
  p2_time: [hours]
  p3_time: [hours]
  total_time: [hours]

  speedup:
    p1: [%]
    p2: [%]
    p3: [%]
    total: [%]

quality_metrics:
  information_loss: [%]
  requirement_coverage: [%]
  integration_issues: [count]
  sponsor_satisfaction: [1-10]

integration_events:
  - date: [ISO-8601]
    event: [Subagent spawned, Skill invoked, Gate executed]
    duration: [seconds]
    status: SUCCESS | FAILURE
```

---

### Appendix C: Troubleshooting Guide

**Issue: Subagent fails to invoke skill**
```
Symptoms: Subagent returns error, skill not found
Diagnosis:
  - Check skill name (case-sensitive)
  - Verify skill exists in catalog
  - Check skill parameters (required params provided)
Resolution:
  - Correct skill name: /rome/category/skill-name
  - Ensure skill registered in catalog
  - Provide all required parameters
```

**Issue: AORDL validation fails**
```
Symptoms: /validate-aordl returns FAIL, violations listed
Diagnosis:
  - Check AORDL file structure (13 fields present?)
  - Check controlled vocabulary (approved verbs?)
  - Check anti-patterns (no UI language?)
Resolution:
  - Fix AORDL file per validation report
  - Re-run validation
  - Update AORDL templates if pattern repeated
```

**Issue: Parallel subagents run sequentially**
```
Symptoms: Subagents complete one-by-one, no speedup
Diagnosis:
  - Check run_in_background parameter
  - Verify Promise.all usage (not sequential await)
  - Check concurrency limits
Resolution:
  - Set run_in_background: true
  - Use Promise.all([...subagents])
  - Adjust concurrency limits if throttled
```

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-12-23 | Initial integration specification - Complete architectural integration model, API contracts, phase-by-phase workflows (P1-P3), implementation requirements, validation criteria, migration path |
| 1.1 | 2025-12-23 | Extended integration to P4-P5 code generation phases - Added Section 3.5 (P4 Configuration with 5 parallel configurators, 77% speedup), Section 3.6 (P5 Code Generation with 95 parallel code generators, 98% speedup), complete AORDL-to-code mapping examples, updated complete lifecycle metrics (80-85% overall speedup) |
| 1.1.1 | 2025-12-23 | Added note to code examples - Clarified that code examples are illustrative placeholders and will be replaced with Parse-server and Flutter SDK specific implementations based on expert patterns in `/Experts/` directory |

---

**Document Status:** Implementation Blueprint

**Next Steps:**
1. Review and approve integration specification
2. Initiate Month 1 activities (skill framework, subagent framework, AORDL templates)
3. Begin parallel implementation tracks
4. Prepare for Month 4 integration pilot

**Contact:** Framework Analyst & Architect (Archie) for questions, clarifications, or implementation support.
