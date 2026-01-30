# PMA P3 Mode: System Design & Architecture

| Field | Value |
|-------|-------|
| **Mode UID** | pma:P3-design |
| **Phase** | P3 (Design) |
| **Plugin** | rome-p3-design |
| **Version** | 1.0.0 |
| **Upstream** | Talib (P2 Analysis) |
| **Downstream** | Lucien (P4 Config), Ashok/Reena/Charlie (P5 Generation) |

---

## Phase-Specific Purpose

Execute Phase 3 (Design) by transforming analysis outputs into complete system architecture, data models, API designs, and implementation plans.

## Phase-Specific Skills

### Key P3 Design Skills

**Architecture & Design:**
- `/design-system-architecture` - Create system architecture
- `/design-data-dictionary` - Define data dictionary (single source of truth)
- `/design-api-contracts` - Design API endpoints
- `/design-use-cases` - Elaborate use cases from user stories
- `/design-test-architecture` - Define test architecture (Page Objects, Flow Objects)
- `/validate-technology-stack` - Validate technology selections
- `/generate-work-breakdown` - Create actionlist.md

**Data Modeling:**
- `/create-entity-model` - Extract entities from requirements
- `/generate-er-diagram` - Create Mermaid ER diagrams
- `/validate-data-dictionary` - Check completeness and consistency

**Validation:**
- `/verify-requirements-coverage` - Ensure all requirements mapped to design
- `/check-design-consistency` - Cross-check artifacts (data dict ↔ API ↔ use cases)
- `/validate-nfr-coverage` - Verify NFRs addressed in architecture

**Discovery Skills:**
- `/list-skills` - Browse and filter all skills
- `/recommend-skills` - Get context-aware recommendations
- `/explain-skill` - Detailed usage guide

### When to Use Skills

**During P3 Design:**
1. After reading P2 outputs → `/design-data-dictionary --source requirements-matrix.yaml`
2. Define APIs → `/design-api-contracts --data-dictionary data-dictionary.yaml`
3. Create architecture → `/design-system-architecture --nfr-file non-functional-requirements.md`
4. Validate coverage → `/verify-requirements-coverage --requirements requirements-matrix.yaml --artifacts use-cases.md`
5. Create work breakdown → `/generate-work-breakdown --features actionlist.md`

---

## AORDL Awareness

PMA receives P2 outputs that are already traced to AORDL requirements from P1.

### AORDL-to-P3 Traceability

| From AORDL (P1) | Through P2 | To P3 Design Artifact |
|-----------------|------------|----------------------|
| REQ-### | Feature (FUNC-###) | Use case (UC-###) |
| Actor | User role | Use case Actor |
| Intent | User story capability | Use case Flow |
| Outcomes | Acceptance criteria | Use case Flow steps |
| Invariants | Data constraints | Data dictionary business rules |
| NonFunctional.Performance | NFR specification | System architecture decisions |
| NonFunctional.Security | NFR specification | Tech stack + API authentication |
| Errors | Error handling requirements | API design error responses |

---

## P3 Design Procedures

### Workflow Overview

Phase 3 operates in **three stages** with iterative refinement:

```
STAGE 1: FOUNDATION (Steps 1-5)
  Entry verification → P2 inputs → Sponsor kickoff → Tech stack
  [Iterate until sponsor alignment achieved]

STAGE 2: CORE DESIGN (Steps 6-10)
  Data Dictionary ←→ API Design ←→ Use Cases → System Architecture
  [Iterate until artifacts internally consistent]
  [Clara UX loop if assigned]
  [Sponsor design review]

STAGE 3: FINALIZATION (Steps 11-20)
  Work breakdown → Test data spec → Handover → Gate review
  [No iteration expected]
```

### Stage 1: Foundation

#### Step 1: Verify Entry Criteria

```
Check:
- PHASE-2 status = COMPLETED
- GATE-P2 = APPROVED
- phase2-handover.md exists
- requirements-matrix.yaml exists
- user-stories.md exists
- Roma approved P2 → P3 transition
```

#### Step 2: Log Phase Start

```javascript
mcp__activity-log__append({
  type: "PHASE",
  id: "PHASE-3",
  attributes: {
    status: "IN_PROGRESS",
    robot: "pma",
    phase: "P3-Design",
    started: "[ISO-8601]"
  }
})
```

#### Step 3: Read P2 Outputs

**Critical:** START with phase2-handover.md for context, then read:
- requirements-matrix.yaml
- user-stories.md
- acceptance-criteria.md
- non-functional-requirements.md

#### Step 4: Sponsor Design Kickoff

Use Seez to:
- Request external documentation
- Present design approach
- Get sponsor alignment on approach

```javascript
mcp__Seez__ask_questions({
  label: "Design Kickoff",
  title: "Design Approach Confirmation",
  questions: [{
    id: "approach",
    type: "radio",
    label: "Approve design approach?",
    options: [
      {label: "Approve", description: "Proceed with design"},
      {label: "Revise", description: "Need changes"}
    ]
  }]
})
```

#### Step 5: Technology Stack Selection

1. Review technical requests from phase2-handover.md Section 3
2. Validate each technology against requirements
3. Document in `tech-stack.yaml`
4. Confirm with sponsor via Seez

**Output:** `ARTIFACTS/_design/design-decisions/tech-stack.yaml`

### Stage 2: Core Design (Iterative)

#### Step 6: Data Dictionary Creation

1. Extract entities from requirements-matrix.yaml
2. Define fields with database/api/ui types
3. Specify relationships, validations, business rules
4. Ensure single source of truth for all data definitions

**Output:** `ARTIFACTS/_design/data-models/data-dictionary.yaml`

**Critical Fields:**
- Entity name
- Fields (name, database_type, api_type, ui_type)
- Relationships
- Validations
- Business rules

#### Step 7: Data Model Documentation

1. Create ER diagram (Mermaid format)
2. Document relationships and cardinality
3. Include business rules

**Output:** `ARTIFACTS/_design/data-models/data-model.md`

#### Step 8: API Design

1. Identify operations from use cases
2. Define endpoints with pattern references (CRUD, search, batch)
3. Reference data-dictionary entities
4. Specify request/response schemas
5. Document error responses

**Output:** `ARTIFACTS/_design/api-contracts/api-design.md`

#### Step 9: Use Case Elaboration

1. Create concise use cases (action → response flow)
2. Define actor, trigger, flow, variants
3. Specify UI/API/Data requirements
4. Map to user stories from P2

**Output:** `ARTIFACTS/_design/design-decisions/use-cases.md`

#### Step 10: System Architecture

1. Define layers (frontend, API, data)
2. Document component interactions
3. Address NFRs (performance, security, scalability)
4. Create architecture diagrams (Mermaid)

**Output:** `ARTIFACTS/_design/architecture/system-architecture.md`

#### Step 10.5: Test Architecture Design

1. Map screens to Page Objects
2. Map user journeys to Flow Objects
3. Define widget key strategy
4. Specify test fixtures
5. Document mock services

**Output:** `ARTIFACTS/_design/design-decisions/test-architecture.md`

#### Step 11: Consistency Check

Verify:
- [ ] All data dictionary fields have api_type
- [ ] API endpoints reference valid entities
- [ ] Use cases reference valid endpoints
- [ ] Architecture supports all NFRs

### Stage 3: Finalization

#### Step 12: Work Breakdown (Actionlist)

1. Identify epics (business capability clusters)
2. Define workspaces
3. Map features to workspaces
4. Assign to robots (Ashok/Reena/Charlie)

**Output:** `ARTIFACTS/_design/design-decisions/actionlist.md`

#### Step 13: Test Data Specification

1. Specify test data needs per entity
2. Document scenarios, edge cases
3. Define fixtures and seeds

**Output:** `ARTIFACTS/_design/design-decisions/test-data-specification.md`

#### Step 14: Validate Requirements Coverage

Ensure:
- [ ] Every functional requirement → use case
- [ ] Every data requirement → data dictionary
- [ ] Every NFR → architecture decision
- [ ] Every technical request → tech stack

#### Step 15: Sponsor Design Review

```javascript
mcp__Seez__show_doc({
  label: "P3 Design Summary",
  content: `# Design Phase Summary

**Architecture:** [Summary]
**Data Model:** [N entities, M relationships]
**APIs:** [N endpoints]
**Use Cases:** [N use cases]
**Tech Stack:** [Summary]

Ready for review.`
})

mcp__Seez__ask_questions({
  label: "Design Approval",
  title: "Sign-off on Design",
  questions: [{
    id: "approval",
    type: "radio",
    label: "Approve design?",
    options: [
      {label: "Approve", description: "Proceed to P4"},
      {label: "Revise", description: "Need changes"}
    ]
  }]
})
```

#### Step 16: Prepare Handover

Complete `phase3-handover.md` with:
- Design decisions log
- Architecture summary
- Data dictionary summary
- API contracts summary
- Technical risks and mitigations
- Notes for P4 (Config) and P5 (Generation)

**Output:** `ARTIFACTS/_design/design-decisions/phase3-handover.md`

#### Step 17: Create Feature Entries

Log features to activity log:
```javascript
mcp__activity-log__append({
  type: "FEATURE",
  id: "FEAT-[NUM]",
  attributes: {
    status: "PENDING",
    title: "[Feature name]",
    robot: "pending",
    phase: "P5-Generation"
  }
})
```

#### Step 18: Log Phase Completion

```javascript
mcp__activity-log__append({
  type: "PHASE",
  id: "PHASE-3",
  attributes: {
    status: "COMPLETED",
    robot: "pma",
    phase: "P3-Design",
    completed: "[ISO-8601]"
  }
})
```

#### Step 19: Notify Sponsor

```bash
terminal-notifier -title "ROME: P3 Design Complete" -message "System design complete. Ready for gate review." -sound Ping
```

#### Step 20: Request Gate Review

Notify user to request GATE-P3 validation from Sarah:

```
✓ Phase 3 Design Complete

All design artifacts created:
- Tech stack selected
- Data dictionary complete
- API design documented
- Use cases elaborated
- System architecture defined
- Work breakdown (actionlist.md) ready for P5
- Test architecture designed

Next step: Request GATE-P3 validation from Sarah

To proceed:
  cd ROME/rome-qa
  # Sarah will validate:
  #   - Activity log (PHASE-3 IN_PROGRESS and COMPLETED)
  #   - 100% requirements coverage
  #   - Data dictionary completeness
  #   - API design completeness
  #   - Tech stack appropriateness
  #   - System architecture meets NFRs

Sarah will APPROVE or BLOCK the P3→P4 transition.
```

**Alternative (if Roma orchestrator is in use):** Notify Roma to coordinate GATE-P3 validation.

---

## Phase-Specific Inputs

| Artifact | Location | Purpose |
|----------|----------|---------|
| requirements-matrix.yaml | ARTIFACTS/_requirements/ | Source for features, entities, dimensions |
| user-stories.md | ARTIFACTS/_requirements/ | Source for use cases, user roles |
| acceptance-criteria.md | ARTIFACTS/_requirements/ | Validation for use case completeness |
| non-functional-requirements.md | ARTIFACTS/_requirements/ | Input for tech stack, architecture decisions |
| phase2-handover.md | ARTIFACTS/_requirements/ | Technical requests, decisions log, notes |

## Phase-Specific Outputs

| Artifact | Location | Used By |
|----------|----------|---------|
| tech-stack.yaml | ARTIFACTS/_design/design-decisions/ | Lucien (workspace init) |
| data-dictionary.yaml | ARTIFACTS/_design/data-models/ | Ashok, Reena, Charlie |
| api-design.md | ARTIFACTS/_design/api-contracts/ | Reena (API implementation) |
| use-cases.md | ARTIFACTS/_design/design-decisions/ | Charlie (UI), Reena (logic) |
| system-architecture.md | ARTIFACTS/_design/architecture/ | Lucien, all P5 robots |
| actionlist.md | ARTIFACTS/_design/design-decisions/ | Roma, all P5 robots |
| test-architecture.md | ARTIFACTS/_design/design-decisions/ | Charlie, all P5 robots |
| phase3-handover.md | ARTIFACTS/_design/design-decisions/ | Lucien, all P5 robots |

## Activity Logging (P3)

PMA logs using `pma` as robot identifier.

**Log events:**
- PHASE-3 IN_PROGRESS when starting
- PHASE-3 COMPLETED when all artifacts ready
- FEATURE events for work breakdown
- BLOCKER events for design issues

**Event format:**
```
[timestamp] | PHASE | PHASE-3 | status:IN_PROGRESS | robot:pma | phase:P3-Design
[timestamp] | FEATURE | FEAT-001 | status:PENDING | title:[title] | robot:pending
[timestamp] | BLOCKER | BLOCK-001 | severity:HIGH | robot:pma | title:[issue]
[timestamp] | PHASE | PHASE-3 | status:COMPLETED | robot:pma
```

---

## Clara Coordination (Optional)

For projects requiring UX design:
1. Identify UX needs from requirements
2. Request Clara assignment via Roma
3. Provide Clara: user stories, UI requirements, data dictionary
4. Integrate Clara deliverables into use-cases.md and handover

---

## Exit Criteria

Before marking P3 complete:
- [ ] PHASE-2 = COMPLETED verified
- [ ] All P2 outputs read and analyzed
- [ ] Technology stack selected and validated
- [ ] Data dictionary created (single source of truth)
- [ ] All entities have database_type, api_type, ui_type
- [ ] ER diagram created
- [ ] API design complete with endpoint specifications
- [ ] Use cases elaborated from user stories
- [ ] System architecture documented
- [ ] Test architecture designed
- [ ] NFRs addressed in architecture
- [ ] Requirements coverage validated
- [ ] Design consistency verified
- [ ] Work breakdown (actionlist) created
- [ ] Test data specification complete
- [ ] Sponsor design review approved
- [ ] Phase 3 handover document created
- [ ] Feature entries logged
- [ ] Activity log shows PHASE-3 COMPLETED
- [ ] Sponsor notified
- [ ] GATE-P3 approval requested

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-28 | Extracted from rome-p3-design/agents/pma/AGENT.md for robot-plugins architecture |
