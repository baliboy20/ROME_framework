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

STAGE 2: CORE DESIGN (Steps 6-11)
  Data Dictionary ←→ API Design ←→ Use Cases → Feature Specs → System Architecture
  [Iterate until artifacts internally consistent]
  [Clara UX loop if assigned]
  [Sponsor design review]

STAGE 3: FINALIZATION (Steps 12-21)
  Consistency check → Work breakdown → Test data spec → Handover → Gate review
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

##### 5a-0: Honor binding TDRs FIRST (ROME-STD-TECHSPEC / ROME-AX-29 — takes precedence)

If `state.tdrs` contains APPROVED TDRs with `binds` ∋ P3:
  - Each is a CONSTRAINT, not an input: adopt the decided value and annotate the
    implementing element `satisfies: TDR-##` (in tech-stack.yaml and/or the
    architecture decision table). GATE-P3 refuses advance on an uncited TDR.
  - To depart (deprecated library, vendor cannot meet a requirement): file a
    deviation via Roma (`recordTdrDeviation` — reason + proposed alternative);
    NEVER design around a TDR silently. Only the sponsor supersedes it (AX-30).
  - PROPOSED TDRs never bind — list them as open questions in AIB-P3 (Step 20).
  - **Precedence:** TDRs (canonical, PROP-052) > technical-brief.yaml MANDATE
    (legacy channel, below) > preferences > PMA selection. Where both a TDR and
    a technical-brief entry cover the same concern, the TDR governs and the
    brief entry is ignored (note the shadowing in tech-stack.yaml).
  - Honor recorded `state.infraConstraints` the same way: a choice contradicting
    one must be surfaced in AIB-P3, never made silently (PROP-051).

##### 5a: Load Technical Brief (legacy channel, if present)

*technical-brief.yaml predates ROME-STD-TECHSPEC. Sponsors should author TDRs
(`decisions.tdr.yaml`, GUIDE-002); this section remains for projects staged the
old way and is subordinate to 5a-0.*

If `_user_input/technical-brief.yaml` exists:

For each **MANDATE** entry:
  - Adopt into tech-stack.yaml as-is
  - Set `mandate: true`, `source: "technical-brief.yaml"`
  - Validate feasibility against requirements
  - If mandate conflicts with requirements → log BLOCKER, escalate to Roma

For each **PREFERENCE** entry:
  - Evaluate against requirements
  - If adopting: set `mandate: false`, note "adopted sponsor preference"
  - If proposing alternative: document justification in tech-stack.yaml

For each **CONSTRAINT** entry:
  - Document impact on architecture decisions
  - Design around constraint
  - If constraint blocks requirement → log BLOCKER with mitigation proposal

If `_user_input/technical-brief.yaml` does not exist:
  - PMA has full technology selection authority
  - All selections set `mandate: false`, `source: "pma-selection"`

##### 5b: Select Remaining Technologies

For any system concern NOT covered by technical brief:
  - Select based on requirements analysis
  - Set `mandate: false`, `source: "pma-selection"`
  - Document selection rationale

##### 5c: Confirm with Sponsor

Present complete tech-stack.yaml via Seez:
  - Highlight mandated items (confirmed)
  - Highlight preferences adopted or overridden (with justification)
  - Highlight open selections for approval

**Output:** `ARTIFACTS/_design/design-decisions/tech-stack.yaml`

Define capabilities: for each system service, specify id, technology, robot assignment, workspace, `mandate` (true/false), and `source`. Declare dependencies between capabilities.

**Testing declaration (REQUIRED per capability, v3.1.1):** each capability also
declares its `testing` block — the test framework, the test types expected, and
the run command. This makes the testing approach a first-class, sponsor-reviewable
design decision (it is presented with the rest of tech-stack.yaml in 5c), instead
of an implicit ecosystem convention that only materialises in P4 config files.

**TDR citation (REQUIRED where a TDR decided the item, v3.2.0):** any capability
or stack entry implementing an APPROVED TDR carries `satisfies: TDR-##` — this is
what `checkTdrConformance` reads at GATE-P3 (ROME-AX-29).

```yaml
capabilities:
  - id: ui-app
    technology: flutter
    robot: charlie
    satisfies: TDR-3        # when a TDR decided this item
    testing: { framework: flutter_test, types: [unit, widget, integration], command: "flutter test" }
  - id: api
    technology: hono-typescript
    robot: reena
    testing: { framework: vitest, types: [unit, integration], command: "npx vitest run" }
```

Downstream consumers: Lucien derives the P4 test configuration files and CI
stages FROM this block (he does not choose independently); the component
`steps[]` that the executability check runs are generated from `testing.command`.
Deviating from the ecosystem's native tooling requires a stated rationale, like
any other non-mandated selection.

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

1. Define capabilities (per tech-stack.yaml)
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

#### Step 11: Create Feature Technical Specifications

**Output:** `ARTIFACTS/_design/specs/SPEC-###-[feature-name].md` (one per FUNC-###)

For each FUNC-### identified in P2:

1. Create `SPEC-###-[feature-name].md` with:
   - **Requirements Summary** — table of traced REQ-### (Actor + Intent)
   - **Use Cases** — move UC-### for this feature here (authoritative location)
   - **Data Schema** — extract relevant entities from data-dictionary.yaml
   - **API Contracts** — extract relevant endpoints from api-design.md
   - **UI Wireframes** — Clara's output or placeholder
   - **Implementation** — empty section with one heading per capability declared in tech-stack.yaml for this feature (e.g., Database, Backend API, UI App, Notifications). P5 robots complete their capability's section.
   - **Change Register** — initialized at v1.0

2. SPEC-### number matches FUNC-### number (SPEC-002 for FUNC-002)

3. Feature specs become P3 deliverables — list in phase3-handover.md

4. use-cases.md becomes optional summary index — authoritative UCs live in specs

#### Step 12: Consistency Check

Verify:
- [ ] All data dictionary fields have api_type
- [ ] API endpoints reference valid entities
- [ ] Use cases reference valid endpoints
- [ ] Architecture supports all NFRs

### Stage 3: Finalization

#### Step 13: Work Breakdown (Actionlist)

1. Identify epics (business capability clusters)
2. Define workspaces
3. Map features to workspaces
4. Assign stories to capabilities per tech-stack.yaml configuration. Each capability maps to a robot.

**Output:** `ARTIFACTS/_design/design-decisions/actionlist.md`

#### Step 14: Test Data Specification

1. Specify test data needs per entity
2. Document scenarios, edge cases
3. Define fixtures and seeds

**Output:** `ARTIFACTS/_design/design-decisions/test-data-specification.md`

#### Step 15: Validate Requirements Coverage

Ensure:
- [ ] Every functional requirement → use case
- [ ] Every data requirement → data dictionary
- [ ] Every NFR → architecture decision
- [ ] Every technical request → tech stack

#### Step 16: Sponsor Design Review

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

#### Step 17: Prepare Handover

Complete `phase3-handover.md` with:
- Design decisions log
- Architecture summary
- Data dictionary summary
- API contracts summary
- Feature specifications index (list all SPEC-### files created with feature names)
- Technical risks and mitigations
- Notes for P4 (Config) and P5 (Generation)

**Output:** `ARTIFACTS/_design/design-decisions/phase3-handover.md`

#### Step 18: Create Feature Entries

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

#### Step 19: Log Phase Completion

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

#### Step 20: Produce AIB-P3 (Architecture & Infrastructure Brief — PROP-051 / ROME-AX-27)

Author `ARTIFACTS/_design/AIB-P3.md`, ≤1 page, plain language (ROME-GOV-001
accessibility convention):
- Component shape (topology summary) and architectural patterns chosen, one-line
  rationale each
- Every named third-party dependency/vendor so far — each with a one-line "why"
  and `swappable: yes/no/costly`
- Open infrastructure questions; PROPOSED TDRs as open questions
- Any TDR deviation filed (highlighted delta) and any choice touching a recorded
  infra constraint (highlighted)

Include the AIB in your structured return (artifacts[]). Roma issues it to the
sponsor (`guard-cli aib issue` → Seez) and collects CONFIRM / REDIRECT /
DELEGATE; GATE-P3 cannot pass without that response (`sponsorArch` fact). On
REDIRECT you are re-dispatched with the sponsor's notes — revise and the brief
is reissued as a new revision.

#### Step 21: Return

Finish by RETURNING your structured result (Return Contract in ROBOT.md):
status, artifacts (including AIB-P3 and all design artifacts), traceabilityEdges,
`tdrCitations` for every APPROVED TDR you satisfied, blockers. Returning IS the
completion record. Roma runs the mechanical checks, drives the sponsor
checkpoint, and requests the GATE-P3 verdict from Sarah — there is no
user-notification step and no path outside the orchestrator.

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
| SPEC-###-[feature].md | ARTIFACTS/_design/specs/ | All P5 robots (authoritative feature reference) |
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

For projects requiring UX design, spawn Clara as a subagent:

```javascript
// Read Clara's identity and mode
const claraRobot = Read("ROME/agents/clara/ROBOT.md")
const claraMode = Read("ROME/agents/clara/modes/P3-design.md")

// Spawn Clara as subagent
Task({
  subagent_type: "general-purpose",
  prompt: `${claraRobot}\n---\n${claraMode}\n---\n
    You are Clara (UX Designer). Create design assets for this project.

    Read these inputs:
    - ARTIFACTS/_requirements/user-stories.md
    - ARTIFACTS/_design/data-models/data-dictionary.yaml
    - ARTIFACTS/_design/design-decisions/use-cases.md

    Produce these outputs:
    - ARTIFACTS/_design/design-assets/design-system.md
    - ARTIFACTS/_design/design-assets/wireframes/ (one per screen)
    - ARTIFACTS/_design/design-assets/user-flows.md
    - ARTIFACTS/_design/design-assets/accessibility.md

    Follow your ROBOT.md and P3-design.md instructions exactly.`
})
```

After Clara completes:
1. Review Clara's design assets
2. Integrate wireframe references into feature specs (SPEC-###)
3. Update use cases with UI-specific flows if needed

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
- [ ] Feature specifications created for all FUNC-###
- [ ] System architecture documented
- [ ] Test architecture designed
- [ ] NFRs addressed in architecture
- [ ] Requirements coverage validated
- [ ] Design consistency verified
- [ ] Work breakdown (actionlist) created
- [ ] Test data specification complete
- [ ] Sponsor design review approved
- [ ] Every APPROVED TDR binding P3 cited (`satisfies: TDR-##`) or deviation filed — none silently contradicted (ROME-AX-29)
- [ ] AIB-P3 produced (component shape, vendors + rationale/swappable, open questions, deviations highlighted)
- [ ] Phase 3 handover document created
- [ ] Structured return delivered with tdrCitations (Roma drives the sponsor checkpoint + gate)

---

---

## Return Contract — Traceability Edges (PROP-042)

Return `traceabilityEdges` (not `traceabilityDeltas`). Each design artifact you produce must have at least one edge per requirement it covers.

**P3 pattern:** design artifacts use `satisfiesHow: documents` with a section anchor as `location`.

```json
"traceabilityEdges": [
  {
    "req": "REQ-012",
    "reqField": "Invariants[0]",
    "artifactId": "ApiDesign",
    "artifactKind": "document",
    "artifactPath": "ARTIFACTS/_design/api-contracts/api-design.md",
    "component": "backend",
    "satisfiesHow": "documents",
    "location": "ARTIFACTS/_design/api-contracts/api-design.md#create-organisation"
  },
  {
    "req": "REQ-003",
    "artifactId": "DataDictionary",
    "artifactKind": "document",
    "artifactPath": "ARTIFACTS/_design/data-models/data-dictionary.yaml",
    "component": "backend",
    "satisfiesHow": "documents",
    "location": "ARTIFACTS/_design/data-models/data-dictionary.yaml#organisation-entity"
  }
]
```

**Rules:**
- `artifactId` = logical document name (e.g. `ApiDesign`, `DataDictionary`, `SystemArchitecture`, `UseCase-UC-012`). One artifact node per distinct design document or section.
- `component` = the topology component the design artifact belongs to (e.g. `backend`, `mobile`). Use the component id from `tech-stack.yaml`.
- `location` = `path#section-anchor` pointing to the specific section covering this requirement. Use a stable heading anchor (lowercase, hyphens).
- Every in-scope REQ-### must have ≥1 edge. The guard checks this as part of the `matrix` mechanical fact before GATE-P3.

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0.0 | 2026-01-28 | Extracted from rome-p3-design/agents/pma/AGENT.md for agents architecture |
| 1.1.0 | 2026-06-19 | PROP-042: traceabilityEdges return contract. P3 uses satisfiesHow:documents with section anchors. |
