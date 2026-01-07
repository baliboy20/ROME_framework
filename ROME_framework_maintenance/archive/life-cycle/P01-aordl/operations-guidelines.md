# Phase 1 - AORDL: Operations Guidelines

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PHASE-002 |
| **Version** | 2.0 |
| **Date** | 2025-12-24T00:00:00Z |
| **Status** | Active |
| **Document Type** | Phase Specification |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | true |

---

## Purpose

Defines WHAT Phase 1 (AORDL) must accomplish, including entry/exit criteria, required outputs, and quality gates. Robot-specific procedures (HOW) are defined in Talib's CLAUDE.md document.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Phase Decomposition principle
- ROME-PROC-005 (Activity Logging Protocol) - Logging requirements
- ROME-PROC-006 (Quality Gate Protocol) - GATE-P1 requirements
- ROME-ROBOT-002 (Talib) - Primary robot for this phase
- ROME-PROP-009 (AORDL Methodology) - AORDL specification

---

## Phase Overview

| Attribute | Value |
|-----------|-------|
| Phase Number | P1 |
| Phase Name | AORDL Requirements |
| Primary Robot | Talib |
| Predecessor | P0 (Bootup) |
| Successor | P2 (Analysis) |
| Quality Gate | GATE-P1 (AORDL validation) |

**Objective:** Transform raw user input (conversations, notes, sketches, ideas) into validated AORDL requirements that are unambiguous, atomic, and implementation-ready.

**Scope:** This phase is LIMITED to:
- Capturing user requirements in AORDL format
- Validating AORDL structure and content
- Resolving ambiguities through sponsor clarification
- Transforming to BDD scenarios for validation
- Organizing requirements for P2 analysis consumption

**Out of Scope:**
- Requirements analysis (P2)
- Functional decomposition (P2)
- Architecture decisions (P3)
- Technology selection (P3)

---

## AORDL Methodology Overview

**AORDL (AI-Optimized Requirement Design Language)** is a structured requirement format designed for LLM interpretation and validation.

### 13 Required Fields

Every AORDL requirement MUST contain:

| Field | Purpose | Example |
|-------|---------|---------|
| ID | Unique identifier | REQ-001 |
| Actor | Who performs the action (specific role) | ProjectManager |
| Intent | What the actor wants to do (verb + object) | create project |
| Preconditions | State that must exist before | ProjectManager authenticated |
| Conditions | Rules that apply during execution | Project name unique |
| Postconditions | State that must exist after | Project status = 'active' |
| Outcomes | Observable results | Project saved to database |
| Invariants | Rules that must always hold | Project has exactly one owner |
| NonFunctional | Performance, security, compliance | Response < 2 seconds |
| Errors | Error conditions and messages | "Project name already exists" |
| ScopeBoundary | What's in/out of scope | InScope: basic project; OutOfScope: templates |
| OpenQuestions | Unresolved questions | "Support hierarchical projects?" |
| CopilotMode | Validation mode | STRICT, GUIDED, or PERMISSIVE |

### Anti-Patterns (Forbidden)

AORDL requirements MUST NOT contain:

| Anti-Pattern | Examples | Why Forbidden |
|--------------|----------|---------------|
| **UI Language** | "click button", "screen shows", "dropdown menu" | Implementation detail, not requirement |
| **Technical Jargon** | "POST /api/users", "SQL query", "HTTP 201" | Technology choice, not user need |
| **Generic Actors** | "user", "someone", "the system" | Not specific enough |
| **Ambiguous Verbs** | "manage", "handle", "process", "deal with" | Not atomic, unclear intent |

### Approved Verbs

Atomic intents use clear action verbs:
- **Create**: create, submit, register, add
- **Read**: view, list, search, retrieve, export
- **Update**: update, edit, modify, change
- **Delete**: delete, remove, archive, cancel
- **Process**: approve, reject, assign, validate
- **Authenticate**: authenticate, authorize, login, logout

---

## Entry Criteria

Phase 1 MAY NOT begin until ALL criteria are met:

| Criterion | Verification |
|-----------|--------------|
| Bootstrap complete | Project structure exists at ARTIFACTS path |
| User input available | Raw requirements in `_user_input/raw-requirements/` OR user ready for requirements elicitation |
| AORDL template accessible | Template at `/ROME/templates/aordl/REQ-TEMPLATE.md` |
| Activity log initialized | Database responds to MCP queries |
| Roma assignment | Talib assigned to P1 by orchestrator |
| PHASE-1 entry created | Activity log contains PHASE-1 with status NOT_STARTED or IN_PROGRESS |
| /validate-aordl skill available | Skill exists and is invocable |

---

## Exit Criteria

Phase 1 MAY NOT transition to P2 until ALL criteria are met:

| Criterion | Verification | Blocking |
|-----------|--------------|----------|
| All requirements in AORDL format | REQ-*.yaml files exist in ARTIFACTS/01-requirements/ | Yes |
| All requirements validated | Each requirement passes /validate-aordl --mode STRICT | Yes |
| All 13 fields populated | No empty required fields in any requirement | Yes |
| No anti-patterns detected | No UI language, no technical jargon, specific actors | Yes |
| Ambiguities resolved | No OPEN status in OpenQuestions field | Yes |
| BDD scenarios generated | /transform-aordl-to-bdd executed for all requirements | Yes |
| Requirements catalog created | requirements-catalog.md lists all requirements | Yes |
| Activity log updated | PHASE-1 status = COMPLETED | Yes |
| Roma verification | Orchestrator confirms phase complete | Yes |
| **GATE-P1 APPROVED** | Sarah audit passed (ROME-PROC-006) | Yes |

---

## Quality Gates

### Gate 1: AORDL Structure Validation

**Check:** Every requirement file has correct YAML structure.

**Pass Criteria:**
- Valid YAML syntax
- All 13 required fields present
- Field values are correct types (strings, lists, objects)
- ID follows naming convention (REQ-###)

**Failure Action:** Fix YAML structure, re-validate

**Validation Command:**
```bash
/validate-aordl --requirement-file ARTIFACTS/01-requirements/REQ-001.yaml --mode STRICT
```

### Gate 2: Anti-Pattern Detection

**Check:** No forbidden patterns in any requirement.

**Pass Criteria:**
- No UI keywords (click, button, screen, form, menu, tab, dropdown, modal)
- No technical keywords (POST, GET, API, SQL, HTTP, JSON, endpoint)
- No generic actors (user, person, someone, anyone)
- No ambiguous verbs (manage, handle, process, deal with)

**Failure Action:** Rewrite requirement using approved patterns

### Gate 3: Atomicity Validation

**Check:** Each requirement represents a single, indivisible intent.

**Pass Criteria:**
- Intent field contains single verb + object
- Intent cannot be split without losing meaning
- Preconditions are independent of intent
- Postconditions are direct consequences of intent

**Failure Action:** Split compound requirements into multiple atomic requirements

### Gate 4: Completeness Validation

**Check:** All requirements capture full user input.

**Pass Criteria:**
- Every user need documented as AORDL requirement
- No gaps between user input and requirements
- Coverage documented in requirements-catalog.md
- Sponsor confirms all needs captured

**Failure Action:** Create additional requirements for missing needs

### Gate 5: Ambiguity Resolution

**Check:** No unresolved ambiguities remain.

**Pass Criteria:**
- All OpenQuestions have status = RESOLVED
- Sponsor decisions documented for each question
- Assumptions documented with risk assessment
- No conflicting requirements

**Failure Action:** Pursue sponsor clarification or document assumptions

---

## Outputs

### Required Artifacts

| Artifact | Location | Description |
|----------|----------|-------------|
| AORDL requirement files | `ARTIFACTS/01-requirements/REQ-*.yaml` | Individual AORDL requirements |
| requirements-catalog.md | `ARTIFACTS/01-requirements/` | Catalog of all requirements |
| aordl-validation-report.md | `ARTIFACTS/01-requirements/` | Validation results for all requirements |
| bdd-scenarios.md | `ARTIFACTS/01-requirements/` | BDD scenarios generated from AORDL |
| phase1-handover.md | `ARTIFACTS/01-requirements/` | Handover document for P2 |

### AORDL Requirement File Schema

Each requirement file follows this structure:

```yaml
ID: REQ-001
Actor: ProjectManager
Intent: create project
Preconditions:
  - ProjectManager authenticated
  - ProjectManager has active subscription
Conditions:
  - Project name unique within organization
  - Project name length 3-100 characters
Postconditions:
  - Project status set to 'active'
  - ProjectManager assigned as project owner
  - Audit log entry created
Outcomes:
  - Project saved to database with unique ID
  - ProjectManager receives confirmation notification
Invariants:
  - Project must have exactly one owner
  - Project name cannot be changed after creation
NonFunctional:
  Performance:
    - Project creation completes in <2 seconds
  Security:
    - Requires JWT authentication
    - Owner can only be changed by owner
Errors:
  - error: "If project name already exists"
    message: "Project name already exists in your organization"
  - error: "If user subscription expired"
    message: "Active subscription required to create projects"
ScopeBoundary:
  InScope:
    - Create project with name, description, owner
    - Set initial project status
  OutOfScope:
    - Project templates
    - Bulk project creation
    - Project hierarchies
OpenQuestions:
  - question: "Should projects support hierarchical structure?"
    status: RESOLVED
    decision: "No - MVP supports flat structure only"
    decisionDate: "2025-12-24"
CopilotMode: STRICT
```

### Requirements Catalog Schema

```markdown
# Requirements Catalog

**Phase:** P1 - AORDL
**Date:** [ISO-8601]
**Robot:** Talib
**Total Requirements:** [count]

## Requirements by Actor

### ProjectManager
- REQ-001: create project
- REQ-002: update project
- REQ-003: delete project
- REQ-004: assign team member

### TeamMember
- REQ-005: view project
- REQ-006: update task status
- REQ-007: comment on task

## Requirements by Category

### Core Functionality
- REQ-001, REQ-002, REQ-003 (Project CRUD)
- REQ-004, REQ-005 (Team management)

### Collaboration
- REQ-006, REQ-007 (Task interaction)

## Coverage Assessment

| User Input Source | Requirements | Coverage |
|-------------------|--------------|----------|
| Conversation 2025-12-01 | REQ-001 to REQ-004 | Complete |
| Sketches (wireframes) | REQ-005 to REQ-007 | Complete |
| Email thread | Captured in NonFunctional | Complete |

## Validation Summary

- Total Requirements: [count]
- Validated (STRICT): [count]
- Anti-Patterns Found: 0
- Open Questions: 0
- Ready for P2: Yes
```

### AORDL Validation Report Schema

```markdown
# AORDL Validation Report

**Phase:** P1 - AORDL
**Date:** [ISO-8601]
**Robot:** Talib
**Validation Mode:** STRICT

## Validation Results

| Requirement | Structure | Anti-Patterns | Atomicity | Completeness | Status |
|-------------|-----------|---------------|-----------|--------------|--------|
| REQ-001 | PASS | PASS | PASS | PASS | ✅ VALID |
| REQ-002 | PASS | PASS | PASS | PASS | ✅ VALID |
| REQ-003 | PASS | PASS | PASS | PASS | ✅ VALID |

## Summary Statistics

- Total Requirements: [count]
- Valid: [count]
- Invalid: 0
- Warnings: [count]
- Validation Rate: 100%

## Anti-Pattern Detection

- UI Language: 0 occurrences
- Technical Jargon: 0 occurrences
- Generic Actors: 0 occurrences
- Ambiguous Verbs: 0 occurrences

## Ambiguity Resolution

- Total Questions: [count]
- Resolved: [count]
- Open: 0

## Quality Score

- Structure Compliance: 100%
- Anti-Pattern Avoidance: 100%
- Atomicity: 100%
- Completeness: 100%
- **Overall Quality: 100%**
```

### Phase 1 Handover Schema

```markdown
# Phase 1 Handover: AORDL to Analysis

**Phase:** P1 - AORDL
**Date:** [ISO-8601]
**Robot:** Talib
**Next Phase:** P2 (Analysis)
**Next Robot:** Talib (P2 mode)

## Summary

Phase 1 complete. [count] AORDL requirements created, validated, and ready for P2 analysis.

## Deliverables

- AORDL Requirements: [count] files in ARTIFACTS/01-requirements/
- Validation Report: 100% validation rate, 0 anti-patterns
- BDD Scenarios: Generated for all requirements
- Requirements Catalog: Complete coverage mapping

## Requirements Breakdown

### By Actor
- ProjectManager: [count] requirements
- TeamMember: [count] requirements
- [Other actors]: [count] requirements

### By Category
- Core CRUD: [count] requirements
- Collaboration: [count] requirements
- Administration: [count] requirements

## Validation Status

- All requirements validated in STRICT mode
- All anti-patterns eliminated
- All ambiguities resolved
- All open questions answered

## Key Decisions

1. [Decision 1]: [Sponsor decision on ambiguity]
2. [Decision 2]: [Scope boundary clarification]
3. [Decision 3]: [Non-functional requirement specification]

## Assumptions

1. [Assumption 1]: [What was assumed, risk level]
2. [Assumption 2]: [What was assumed, risk level]

## For P2 Analysis

**Input Location:** `ARTIFACTS/01-requirements/REQ-*.yaml`

**Next Steps:**
1. Execute /execute-p2-analysis skill
2. P2 will analyze AORDL requirements across 8 dimensions
3. P2 will create analysis artifacts for P3 design

**Skills Available:**
- /execute-p2-analysis - Full P2 orchestration
- /analyze-requirements-matrix - 8-dimension analysis
- /generate-requirement-maps - Traceability
- See /list-skills --phase P2 for all 19 analysis skills

## Notes for P2

- All requirements atomic and unambiguous
- Actor roles clearly defined
- Non-functional requirements captured
- Scope boundaries explicit
- Sponsor decisions documented
```

---

## AORDL Skills

Phase 1 uses the following skills for AORDL processing:

### /validate-aordl

**Purpose:** Validate AORDL requirement file structure and content

**Usage:**
```bash
/validate-aordl --requirement-file ARTIFACTS/01-requirements/REQ-001.yaml --mode STRICT
```

**Parameters:**
- `requirement_file` (required): Path to AORDL YAML file
- `mode` (optional): STRICT, GUIDED, or PERMISSIVE (default: STRICT)

**Output:**
- Validation status (PASS/FAIL)
- List of issues found (if any)
- Anti-pattern detection results
- Suggestions for fixes

**Validation Modes:**

| Mode | Strictness | Use Case |
|------|------------|----------|
| STRICT | All 13 fields required, zero anti-patterns | Final validation for GATE-P1 |
| GUIDED | All 13 fields required, warnings for anti-patterns | Iterative requirement development |
| PERMISSIVE | Core fields required, allows some anti-patterns | Initial requirement capture |

### /transform-aordl-to-bdd

**Purpose:** Transform AORDL requirement to BDD scenario for validation

**Usage:**
```bash
/transform-aordl-to-bdd --requirement-file ARTIFACTS/01-requirements/REQ-001.yaml --output-file ARTIFACTS/01-requirements/bdd-scenarios.md
```

**Parameters:**
- `requirement_file` (required): Path to AORDL YAML file
- `output_file` (required): Path to output BDD scenario file

**Output:**
- BDD Given-When-Then scenario
- Acceptance criteria
- Test outline

**Example Transformation:**

AORDL:
```yaml
ID: REQ-001
Actor: ProjectManager
Intent: create project
```

BDD:
```gherkin
Scenario: ProjectManager creates project
  Given ProjectManager is authenticated
  And ProjectManager has active subscription
  When ProjectManager creates project with name "My Project"
  Then Project is saved to database
  And Project status is 'active'
  And ProjectManager is assigned as owner
  And Confirmation notification is sent
```

### /create-aordl-requirement (Helper)

**Purpose:** Interactive helper to create new AORDL requirement

**Usage:**
```bash
/create-aordl-requirement --output-file ARTIFACTS/01-requirements/REQ-new.yaml
```

**Process:**
1. Prompts for each of 13 required fields
2. Validates input against anti-patterns
3. Suggests improvements
4. Generates YAML file
5. Auto-validates with /validate-aordl

---

## Workflow

### Typical P1 Execution Flow

```
1. Talib receives user input (conversations, notes, sketches)
   ↓
2. Identify user intents (what they want to accomplish)
   ↓
3. For each intent:
   a. Create AORDL requirement file (REQ-###.yaml)
   b. Populate all 13 fields
   c. Validate with /validate-aordl --mode GUIDED
   d. Iterate until validation passes
   ↓
4. Review all requirements for completeness
   ↓
5. Identify ambiguities and open questions
   ↓
6. Clarify with sponsor (ROME-PROC-002)
   ↓
7. Update requirements with sponsor decisions
   ↓
8. Final validation with /validate-aordl --mode STRICT
   ↓
9. Generate BDD scenarios with /transform-aordl-to-bdd
   ↓
10. Create requirements catalog
   ↓
11. Create validation report
   ↓
12. Create phase handover
   ↓
13. Request GATE-P1 audit from Sarah
   ↓
14. GATE-P1 APPROVED → Hand off to P2
```

### Iteration and Refinement

Requirements should be iteratively refined:

**First Pass (PERMISSIVE mode):**
- Capture all user intents quickly
- Don't worry about perfect wording
- Focus on completeness

**Second Pass (GUIDED mode):**
- Eliminate anti-patterns
- Ensure atomicity
- Add missing fields

**Final Pass (STRICT mode):**
- Zero anti-patterns
- All fields complete
- Ready for GATE-P1

---

## Traceability Requirements

### User Input to AORDL Tracing

Every AORDL requirement MUST be traceable to original user input:

| From | To | Traceability Method |
|------|----|---------------------|
| User conversation | REQ-ID | Source comment in YAML |
| User sketch/wireframe | REQ-ID | Reference in ScopeBoundary |
| User email/document | REQ-ID | Source reference in metadata |
| Sponsor clarification | REQ-ID | Updated OpenQuestions field |

**Example Traceability in YAML:**
```yaml
ID: REQ-001
# Source: User conversation 2025-12-24, timestamp 14:32
# Context: User wants to manage multiple projects
Actor: ProjectManager
Intent: create project
```

### AORDL to BDD Tracing

Every BDD scenario MUST be traceable to AORDL requirement:

```gherkin
# Requirement: REQ-001
# Actor: ProjectManager
# Intent: create project
Scenario: ProjectManager creates project
  ...
```

---

## Activity Logging Requirements

All robots operating in this phase MUST follow the Activity Logging Protocol:
- **ROME-PROC-005**: `/ROME/robot-templates/robot-operations-protocols/activity-logging-protocol.md`

### Phase-Specific Logging

| Event | Required Action |
|-------|-----------------|
| Phase begins | Update PHASE-1: status → IN_PROGRESS, startDate |
| Requirement created | Log REQ-### entry with status DRAFT |
| Requirement validated | Update REQ-###: validation status |
| Blocker encountered | Create BLOCK-### entry (ambiguity, missing info) |
| Sponsor clarification | Log sponsor interaction, update REQ-### |
| Requirement finalized | Update REQ-###: status → VALIDATED |
| Phase complete | Update PHASE-1: status → COMPLETED, completionDate |

### Required Log Entries

| Entry Type | When Created |
|------------|--------------|
| PHASE-1 | Phase start |
| REQ-### | Each requirement created |
| BLOCK-### | Ambiguity or missing information discovered |
| SI-P1-### | Sponsor interaction for clarification |

---

## Sponsor Interaction

Frequent sponsor interaction expected during P01:

**When to Interact:**
- Ambiguous user input requires clarification
- Multiple valid interpretations exist
- Scope boundaries unclear
- Non-functional requirements not specified
- Domain expertise needed

**Interaction Protocol:** ROME-PROC-002 (Sponsor Interaction Protocol)

**Example Clarification Request:**

```markdown
## Clarification Request: Project Hierarchy

**Requirement:** REQ-001 (create project)
**Field:** ScopeBoundary
**Ambiguity:** User mentioned "sub-projects" but scope unclear

**Question:** Should MVP support hierarchical project structure?

**Options:**
A) Flat structure only - simpler implementation
B) Two-level hierarchy (parent/child) - moderate complexity
C) Unlimited nesting - high complexity

**Impact:**
- Option A: 2 weeks less development
- Option B: Baseline timeline
- Option C: 4 weeks additional development

**Recommendation:** Option A for MVP, Option B in future release

**Sponsor Decision:** [To be filled]
```

---

## GATE-P1: AORDL Validation Gate

**Purpose:** Validate that all requirements are in correct AORDL format before P2 analysis.

**Auditor:** Sarah (System Auditor)

**Input Documents:**
- All REQ-*.yaml files in ARTIFACTS/01-requirements/
- requirements-catalog.md
- aordl-validation-report.md
- phase1-handover.md

**Validation Criteria:**

| Check | Pass Criteria | Blocking |
|-------|---------------|----------|
| Structure Compliance | All requirements have valid YAML, 13 fields | Yes |
| Anti-Pattern Detection | Zero UI language, zero technical jargon | Yes |
| Actor Specificity | No generic actors (user, person, someone) | Yes |
| Intent Atomicity | Each intent is single verb + object | Yes |
| Completeness | All user input captured as requirements | Yes |
| Ambiguity Resolution | All OpenQuestions status = RESOLVED | Yes |
| BDD Scenarios | Generated for all requirements | Yes |
| Validation Report | 100% validation rate in STRICT mode | Yes |

**Output:**
- Gate decision: APPROVE or BLOCK
- Validation report with findings
- Blockers created if BLOCK

**APPROVE:** P2 analysis proceeds
**BLOCK:** Talib addresses issues, re-submit for GATE-P1

---

## Common Anti-Pattern Examples

### ❌ WRONG: UI Language

```yaml
ID: REQ-001
Actor: User
Intent: click login button
Preconditions:
  - Login screen is displayed
```

**Problems:**
- "click" is UI implementation detail
- "button" is UI component
- "User" is generic actor

### ✅ CORRECT: User Intent

```yaml
ID: REQ-001
Actor: UnauthenticatedUser
Intent: authenticate with credentials
Preconditions:
  - User has valid credentials
  - Authentication service is available
```

---

### ❌ WRONG: Technical Jargon

```yaml
ID: REQ-002
Actor: System
Intent: POST to /api/projects endpoint
```

**Problems:**
- "POST" is HTTP method (technical)
- "/api/projects" is endpoint implementation
- "System" is not a user role

### ✅ CORRECT: User Intent

```yaml
ID: REQ-002
Actor: ProjectManager
Intent: create project
```

---

### ❌ WRONG: Ambiguous Verb

```yaml
ID: REQ-003
Actor: User
Intent: manage projects
```

**Problems:**
- "manage" is vague (create? update? delete? all?)
- Not atomic - compound intent
- "User" is generic

### ✅ CORRECT: Atomic Intent

Split into separate requirements:
```yaml
ID: REQ-003
Actor: ProjectManager
Intent: create project
```

```yaml
ID: REQ-004
Actor: ProjectManager
Intent: update project
```

```yaml
ID: REQ-005
Actor: ProjectManager
Intent: delete project
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **AORDL Compliance** | 100% | All requirements pass STRICT validation |
| **Anti-Pattern Rate** | 0% | Zero UI language, zero technical jargon |
| **Ambiguity Resolution** | 100% | All OpenQuestions resolved |
| **Completeness** | 100% | All user input captured |
| **Atomicity** | 100% | Single intent per requirement |
| **GATE-P1 Pass Rate** | 100% | First-pass approval (goal) |

---

## Troubleshooting

### Issue: Validation fails with "Generic actor"

**Solution:** Replace generic actors with specific roles
- ❌ "User" → ✅ "ProjectManager", "TeamMember", "Guest"
- ❌ "System" → ✅ Specific actor who triggers action
- ❌ "Admin" → ✅ "SystemAdministrator", "ProjectOwner"

### Issue: Validation fails with "Ambiguous verb"

**Solution:** Use atomic action verbs
- ❌ "manage" → ✅ "create", "update", "delete" (separate requirements)
- ❌ "handle" → ✅ Specific action verb
- ❌ "process" → ✅ "validate", "approve", "reject"

### Issue: Intent not atomic

**Solution:** Split into multiple requirements
- One requirement per atomic intent
- Each requirement independently implementable
- No compound intents (create AND update)

### Issue: UI language detected

**Solution:** Describe WHAT, not HOW
- ❌ "click submit button" → ✅ "submit form data"
- ❌ "dropdown shows options" → ✅ "select option from list"
- ❌ "screen displays" → ✅ Actor's intent, not UI display

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-24T00:00:00Z | Initial P1-ingest specification (deprecated) |
| 2.0 | 2025-12-24T00:00:00Z | Complete replacement with AORDL methodology (ROME-PROP-013) |
