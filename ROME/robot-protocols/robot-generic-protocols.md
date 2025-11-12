# ROME Robot Generic Protocols

**Version:** 6.0
**Status:** Referenceable protocol library for all robots
**Purpose:** Centralized guidance for common robot patterns; individual role definitions specialize from this

---

## Overview

This document consolidates common protocols, patterns, and workflows that apply to ALL robots. Individual robot role definitions (`role-[name].md`) reference these protocols and add role-specific specializations.

**Usage:** When creating role-specific guidance, say: "Follows **RP-1.2: Amendment Request Protocol** (see robot-generic-protocols.md#RP-1.2)"

---

## RP-1: COMMUNICATION PROTOCOLS

### RP-1.1: Central Activity Log Mechanism

**Single Source of Truth:** `PROJECT/dev/project_activity.status` (YAML)

**Key Principle:** Activity log is authoritative source, not robot-to-robot chat

**Update Frequency:**
- On phase start/completion: immediate
- On blocker detection: immediate
- On amendment request: immediate
- On quality gate decision: immediate
- Routine status updates: daily

**Access Model:**
- All robots: READ access (global visibility per P12)
- Individual robot: WRITE access to own phase section only
- Roma: READ/WRITE access to entire log
- Gatekeeper: READ/WRITE access to gate section
- Sponsor: READ access via Roma reports

**Synchronization via Logs (Not Real-Time Chat):**

Activity log is authoritative source, not robot-to-robot chat. This enables:
- Asynchronous operation (robots work independent times)
- Clear audit trail (every action timestamped in log)
- Roma visibility (can monitor all activity)
- Sponsor oversight (can see exact state anytime)
- Amendment traceability (which robot requested what, who approved)

Robots check log:
- At phase start (understand dependencies)
- At phase completion (request gate validation)
- When blocked (log blocker, wait for Roma action)
- When returning from amendment (check for updates)

**Log Entry Template:**

```yaml
project_name: "Example Project"
last_updated: "2025-11-07T10:30:00Z"
updated_by: "robot_talib"

phases:
  phase_1_talib:
    status: completed|in_progress|not_started
    start_date: "2025-11-01"
    completion_date: "2025-11-05" (if completed)
    outputs_created:
      - requirements-matrix.yaml
      - data-dictionary.yaml
      - component-registry.yaml
    current_work: "Description of current work" (if in_progress)
    blockers: [ ]
    amendment_requests: [ ]
    quality_gate: passed|pending|blocked
    gate_approved_by: "robot_pma"
    notes: "All 8 features decomposed, traceability complete"

  phase_2_pma:
    status: in_progress
    start_date: "2025-11-05"
    outputs_created:
      - data_model.md
      - use_cases.md
      - api_design.md
    current_work: "Finalizing architecture specification"
    blockers: [ ]
    amendment_requests: [ ]
    estimated_completion: "2025-11-08"

  phase_2a_clara:
    status: not_started
    dependencies:
      - phase: phase_2_pma
        status: awaiting

  phase_2b_sarah_gate:
    status: not_started
    dependencies:
      - phase: phase_2a_clara
        status: awaiting

  phase_3_development:
    status: not_started
    dependencies:
      - phase: phase_2b_sarah_gate
        status: awaiting
    team:
      - robot_ashok
      - robot_reena
      - robot_charlie
```

**Information Flow:**
```
Phase 1 (Talib)
  ↓ outputs visible to all
Phase 2 (PMA)
  ↓ outputs visible to all
Phase 2A (Clara)
  ↓ outputs visible to all
Phase 2B (Sarah) - Quality Gate
  ↓ (IF APPROVED)
Phase 3 (Ashok, Reena, Charlie)
```

**Control Flow (Backward for Amendments Only):**
```
Phase 3 needs Phase 1 change
  → Phase 3 logs amendment request in activity log
  → Roma broadcasts to Talib
  → Talib amends, updates activity log
  → Roma notifies Phase 3 change is complete
```

---

### RP-1.2: Amendment Request Protocol

**5-Step Amendment Process:**

**Step 1: Phase Robot Identifies Need**
- Log in activity log:
  ```yaml
  amendment_requests:
    - amendment_id: AMD-001
      requested_by: robot_[name]
      requested_date: "2025-11-07T09:15:00Z"
      affected_phase: phase_X_[robot]
      affected_artifact: filename.ext
      change_required: "Specific change needed"
      justification: "Why this change is needed"
      severity: CRITICAL|HIGH|MEDIUM|LOW
      status: pending_[phase]_review
  ```

**Step 2: Roma Broadcasts to Affected Phase Robot**
- Format:
  ```
  @robot_[name]: Amendment request AMD-001
    Artifact: [filename]
    Issue: [specific issue]
    Requested by: [robot]
    Severity: [level]

  Please review and respond with:
  1. Can requirement be clarified?
  2. If yes, provide updated specification
  3. If no, explain constraints
  ```

**Step 3: Target Phase Responds**
- Update activity log:
  ```yaml
  amendment_requests:
    - amendment_id: AMD-001
      response_date: "2025-11-07T10:00:00Z"
      decision: approved|rejected
      clarification: "Details of change or explanation"
      new_commit: "abc1234 - Commit message"
      status: completed|rejected
  ```

**Step 4: Roma Notifies Requester**
- Format:
  ```
  @robot_[name]: Amendment AMD-001 completed
    [Description of change]
    Updated artifact: [filename] (commit [hash])
    You may proceed with implementation
  ```

**Step 5: Phase 3 Acknowledges**
- Update activity log:
  ```yaml
  amendment_requests:
    - amendment_id: AMD-001
      acknowledged_by: robot_[name]
      acknowledged_date: "2025-11-07T10:30:00Z"
      status: closed
  ```

**Amendment Request Status Values:**

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `pending_[phase]_review` | Awaiting response from target phase | Wait for robot response |
| `approved` | Target phase approved and completed amendment | Close request, proceed |
| `rejected` | Target phase cannot amend (constraints prevent) | Escalate to Roma/sponsor |
| `in_progress` | Target phase is amending | Wait for update |
| `completed` | Amendment complete, artifact updated | Close request, proceed |
| `closed` | Amendment acknowledged, cycle complete | Archive |

---

### RP-1.3: Blocker Escalation Protocol

**Blocker Definition:** Issue preventing phase completion requiring:
- Roma escalation to sponsor, OR
- Amendment to prior phase, OR
- Cross-robot coordination

**3-Step Escalation:**

**Step 1: Robot Logs Blocker**
- Log in activity log:
  ```yaml
  blockers:
    - blocker_id: BLK-001
      logged_by: robot_[name]
      logged_date: "2025-11-07T09:45:00Z"
      title: "Blocker title"
      description: "Detailed description of blocker"
      impact: "What's blocked, what's prevented"
      severity: CRITICAL|HIGH|MEDIUM|LOW
      requested_action: "What's needed to unblock"
      status: awaiting_roma_action
  ```

**Step 2: Roma Escalates to Sponsor**
- Format:
  ```
  BLOCKER ESCALATION - [SEVERITY]
    Project: [Name]
    Phase: [Number]
    Robot: [Name]
    Title: [Title]
    Description: [Details]
    Impact: [What's blocked]

    Decision Required:
    Option 1: [Option 1]
    Option 2: [Option 2]
    Option 3: [Option 3]

    Please respond by [deadline]
  ```

**Step 3: Roma Resolves**
- Update blocker in activity log:
  ```yaml
  blockers:
    - blocker_id: BLK-001
      resolution_date: "2025-11-07T14:00:00Z"
      resolved_by: sponsor|roma
      decision: "Selected option"
      action_taken: "What Roma did to resolve"
      status: closed_by_amendment|closed_by_decision|closed_by_approval
  ```

**Blocker Status Values:**

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `awaiting_roma_action` | Roma will review/escalate | Roma to act |
| `escalated_to_sponsor` | Awaiting sponsor decision | Sponsor to decide |
| `amendment_requested` | Escalated as amendment to prior phase | Track amendment status |
| `closed_by_amendment` | Prior phase completed requested amendment | Resume work |
| `closed_by_decision` | Sponsor decided to proceed/defer/scope-change | Resume or adjust |
| `closed_by_approval` | Roma approved workaround/alternative approach | Resume work |

---

### RP-1.4: Work Assignment Notification Protocol

**Trigger Points:**
- New work added to actionlist.md
- Dependencies complete (e.g., prior layer finished)
- Blocker resolved (robot can resume)
- Scope changes require new implementation
- Integration test failures need fixes

**Notification Format:**
```
[Robot Name], you have new work assigned:

Task: [Task description from actionlist]
Location: PROJECT/dev/actionlist.md [line numbers]
Dependencies: [What's ready that you need]
Priority: [HIGH/MEDIUM/LOW]
Blocked by: [Nothing/Robot/Resource]

Please acknowledge and provide estimated start time.
```

**Expected Response:**
- Robot acknowledges within 1 hour
- Robot provides start time estimate
- Robot updates status to IN_PROGRESS when starting
- If blocked/unavailable, escalate immediately to Roma

**Roma Logging:**
```
[TIMESTAMP] [Roma] [ASSIGN] Notified [Robot]: [Task] - dependencies ready
```

---

## RP-2: WORK PATTERNS

### RP-2.1: Universal 6-Step Protocol

Every robot MUST follow these 6 steps for each feature:

| Step | Action | Description | Output |
|------|--------|-------------|--------|
| 1 | **ANALYZE** | Understand requirements, scope, dependencies | Mental model, questions identified |
| 2 | **DESIGN** | Plan implementation approach, interfaces, patterns | Design specs, architecture sketches |
| 3 | **IMPLEMENT** | Build code with annotations and comments | Working implementation |
| 4 | **INTEGRATE** | Test at layer boundaries and with dependencies | Passing integration tests |
| 5 | **VALIDATE** | Verify feature completeness, edge cases, error handling | Complete, validated feature |
| 6 | **REPORT** | Update status with evidence (test results, commit log) | Status file updated, blockers logged |

**Execution Timeline:**
- Step 1-2: Planning phase (30% of time)
- Step 3-4: Implementation phase (60% of time)
- Step 5-6: Validation & reporting (10% of time)

---

### RP-2.2: Feature Assignment Structure

**Input:** Feature from actionlist.md

**Format:**
```markdown
## Feature: [Name] | Priority: [HIGH/MED/LOW]

### [Robot 1] ([Layer]):
- [ ] Subtask 1
  - Integration Test: [What's tested]
  - Annotation: @TestLevel Integration, @ComplexityLevel Low
- [ ] Subtask 2
  - Integration Test: [What's tested]

### [Robot 2] ([Layer]):
- [ ] Subtask 1
  - Integration Test: [What's tested]
- [ ] Subtask 2
  - Integration Test: [What's tested]

### Interface Definition:
[API endpoint or data structure specification]

### Dependencies:
- [Feature X] (must complete before this can start)

### Status: PENDING
```

---

### RP-2.3: Implementation Progression (Phase 3)

Features must be built in this order, with integration tests at each layer:

```
1. Database Schema (Ashok) + annotations
   ↓ Integration Test: Schema + CRUD works
2. Server Data Access (Reena) + annotations
   ↓ Integration Test: Model ↔ DB works
3. API Endpoints (Reena) + annotations
   ↓ Integration Test: API ↔ DB works
4. Client Data Layer (Charlie) + annotations
   ↓ Integration Test: Client ↔ API works
5. Domain Logic (Charlie) + annotations
   ↓ Integration Test: Use cases work
6. Presentation Layer (Charlie) + annotations
   ↓ Integration Test: UI ↔ Full stack works
```

Unit tests added at project end for complex logic only.

---

## RP-3: STAKEHOLDER QUESTIONING PATTERNS

### RP-3.1: Improved Question-Option Completeness Protocol

**Purpose:** When gathering requirements or making design decisions, ensure questions provide complete options while allowing for open-ended responses when necessary.

**Problem Solved:** Closed-choice questions may not capture edge cases, novel approaches, or domain-specific nuances that don't fit predefined options.

**Core Principle:** Balance structured guidance with flexibility for stakeholder expertise.

---

#### When to Use Structured vs. Open-Ended Questions

**Use Structured Options When:**
- Domain is well-known and options are enumerable
- Decision has standard industry approaches
- Constraining choices helps stakeholder understanding
- Examples: Authentication methods, database types, deployment platforms

**Use Open-Ended Questions When:**
- Domain is novel or highly specialized
- Stakeholder has deep expertise you're discovering
- Multiple valid approaches with significant trade-offs
- Examples: Business workflows, custom integrations, regulatory requirements

---

#### Question Design Pattern

**Step 1: Start with Structured Options (if applicable)**

```markdown
**Question:** What authentication method should we use?

Options:
A) OAuth 2.0 / OpenID Connect (industry standard, third-party identity)
B) JWT (stateless, token-based authentication)
C) Session-based (traditional, server-side sessions)
D) Magic Link (passwordless, email-based)
E) Other (please specify)

Please select one option, or choose "Other" to describe a different approach.
```

**Step 2: Always Include "Other (please specify)" Option**

This captures:
- Edge cases not covered by standard options
- Novel approaches specific to this domain
- Hybrid solutions combining multiple approaches
- Vendor-specific or regulatory requirements

**Step 3: Follow Up with Open-Ended Clarification**

Even when stakeholder selects a standard option, probe deeper:

```markdown
**Follow-up Questions:**
- Why is this approach preferred for your use case?
- Are there any constraints or requirements that influenced this choice?
- Do you foresee any challenges with this approach in your environment?
- [Option-specific questions]
  - For OAuth: Which identity providers should we support?
  - For JWT: What's your token refresh strategy?
  - For Sessions: What's your session storage mechanism?
```

---

#### Handling "Other" Responses

**When stakeholder selects "Other", use this template:**

```markdown
Thank you for selecting "Other". To ensure I understand your requirements:

1. **Describe the approach:**
   - What authentication method are you envisioning?
   - How would it work from the user's perspective?

2. **Rationale:**
   - Why is this approach better suited than standard options?
   - What constraints or requirements make this necessary?

3. **Technical details:**
   - What technologies or protocols would this involve?
   - Are there existing systems this needs to integrate with?

4. **Trade-offs:**
   - What are the advantages of this approach for your use case?
   - What challenges or risks do you foresee?

5. **Precedents:**
   - Have you seen this approach used successfully elsewhere?
   - Are there any references or examples you can share?
```

---

#### Conditional Questioning Flow

Use decision trees to adapt questions based on previous answers:

```markdown
**Q1:** What's the primary user base for this application?
  A) Internal employees
  B) External customers
  C) Partners/vendors
  D) Mixed (multiple user types)
  E) Other (please specify)

[If A selected → Ask about corporate directory integration]
[If B selected → Ask about self-service registration]
[If C selected → Ask about B2B/SSO requirements]
[If D selected → Ask about role separation strategy]
[If E selected → Use "Other" template above]
```

---

#### Documenting Unusual Choices

When stakeholders choose non-standard options or provide "Other" responses:

**Create Decision Log Entry:**

```markdown
## Decision: [Topic] - [Chosen Approach]

**Date:** YYYY-MM-DD
**Decision Maker:** [Stakeholder name/role]
**Robot:** [Robot name - e.g., PMA, Talib]

**Question Asked:**
[Original question with options]

**Response:** Option E (Other) - [Brief description]

**Full Stakeholder Response:**
[Capture complete explanation from follow-up questions]

**Rationale:**
- Why this approach was chosen
- What constraints drove the decision
- What alternatives were considered

**Implications:**
- Technical dependencies this creates
- Integration points this requires
- Risks or challenges to monitor

**Approval:** [Stakeholder approval confirmation]

**Future Reference:**
This decision should be reviewed if:
- [Condition 1 that might invalidate choice]
- [Condition 2 that might suggest reconsideration]
```

---

#### Example: Complete Questioning Flow

**Initial Question (Structured):**

```markdown
**Architecture Question 3: Data Persistence Strategy**

How should we handle data persistence for this application?

A) Relational Database (PostgreSQL, MySQL) - Structured data, ACID compliance
B) Document Database (MongoDB, CouchDB) - Flexible schema, JSON documents
C) Key-Value Store (Redis, DynamoDB) - Simple lookups, caching
D) Graph Database (Neo4j) - Complex relationships, graph traversal
E) Time-Series Database (InfluxDB, TimescaleDB) - Temporal data, metrics
F) Other (please specify)

Select the option that best fits your data model and access patterns.
```

**Stakeholder Response:** "F - Other"

**Follow-Up (Open-Ended):**

```markdown
Thank you. Let's explore your data persistence needs:

1. **Describe your approach:**
   What database or persistence strategy are you considering?

2. **Data characteristics:**
   - What types of data will you store?
   - What are the typical access patterns?
   - What's the expected data volume and growth rate?

3. **Why this approach:**
   - What makes standard databases insufficient?
   - What specific requirements drove this choice?

4. **Technical integration:**
   - What existing systems need to access this data?
   - Are there compliance or regulatory requirements?
   - What's your backup and disaster recovery strategy?

5. **Team expertise:**
   - Does your team have experience with this technology?
   - What's the operational overhead?
```

**Stakeholder Detailed Response:**

```
We need a hybrid approach: PostgreSQL for transactional data (orders, users)
and Elasticsearch for product search/filtering. Our legacy system already
uses PostgreSQL, and we need advanced full-text search capabilities that
SQL can't efficiently provide. We'll use CDC (Change Data Capture) to
keep Elasticsearch in sync.
```

**PMA Documentation:**

```markdown
## Decision: Hybrid Data Persistence (PostgreSQL + Elasticsearch)

**Date:** 2025-11-12
**Decided By:** Technical Stakeholder
**Robot:** robot_pma

**Original Question:** Data Persistence Strategy

**Response:** Option F (Other) - Hybrid: PostgreSQL + Elasticsearch

**Full Requirements:**
- PostgreSQL for transactional data (orders, customers, inventory)
- Elasticsearch for product search and filtering
- CDC pipeline to sync PostgreSQL → Elasticsearch
- Legacy system already on PostgreSQL (migration constraint)
- Advanced search requirements (fuzzy matching, faceted filtering)

**Rationale:**
- Cannot migrate legacy PostgreSQL without significant risk
- SQL full-text search insufficient for product catalog (millions of SKUs)
- Real-time search performance critical (< 200ms response time)
- Elasticsearch proven in similar e-commerce contexts

**Technical Implications:**
- Need CDC tool (Debezium, AWS DMS, or custom)
- Data consistency challenges (eventual consistency for search)
- Operational complexity (two databases to monitor/backup)
- Additional infrastructure cost

**Risks to Monitor:**
- CDC pipeline failures causing search staleness
- Elasticsearch cluster scaling under load
- Data model divergence between systems

**Approval:** Confirmed by CTO [Stakeholder Name]

**Review Triggers:**
- If search performance requirements change
- If PostgreSQL full-text search improves significantly
- If operational complexity becomes untenable
```

---

#### Integration with Phase Workflow

**Phase 1 (Talib):** Use structured + "Other" approach for requirements gathering
- Capture all stakeholder context
- Document unusual requirements with full justification
- Create decision log entries for non-standard choices

**Phase 2 (PMA):** Use conditional questioning for architecture decisions
- Build on Phase 1 decision logs
- Ask option-specific follow-ups based on Phase 1 choices
- Validate feasibility of "Other" responses

**Phase 2B (Sarah):** Validate decision log completeness
- Ensure "Other" responses have full documentation
- Check that unusual choices have stakeholder approval
- Verify implications are understood and acceptable

**Phase 3 (Ashok/Reena/Charlie):** Reference decision logs during implementation
- Understand why non-standard approaches were chosen
- Flag if implementation reveals unforeseen challenges
- Request amendments if assumptions proven invalid

---

#### Summary Checklist

When asking stakeholders questions:

- [ ] **Start structured** (if domain is well-known)
- [ ] **Always include "Other (please specify)"** option
- [ ] **Follow up with open-ended clarification** (even for standard options)
- [ ] **Use conditional questioning** based on previous answers
- [ ] **Document "Other" responses thoroughly** with full context
- [ ] **Create decision log entries** for non-standard choices
- [ ] **Get stakeholder approval** for unusual/risky approaches
- [ ] **Note future review triggers** for decisions

This protocol ensures:
✅ Stakeholders aren't constrained by incomplete option lists
✅ Novel approaches are captured with full context
✅ Non-standard choices are documented and justified
✅ Future robots understand why decisions were made
✅ Amendments have clear decision history to reference

---

## RP-4: FILE & ARTIFACT HANDLING

### RP-4.1: Input File Reading Patterns

**Standard Input Files:**

| File | Created By | Read By | Purpose |
|------|-----------|---------|---------|
| `data_model.md` | PMA | Ashok, Reena, Charlie, Clara | Entity definitions and constraints |
| `use_cases.md` | PMA | Ashok, Reena, Charlie, Clara | User workflows and requirements |
| `actionlist.md` | PMA | Ashok, Reena, Charlie, Roma | Feature assignments and tasks |
| `project_activity.status` | Roma (updated by all) | All robots, Roma, Sponsor | Project status and phase state |
| `requirements-matrix.yaml` | Talib | PMA, Sarah | Requirements hierarchy |
| `data-dictionary.yaml` | Talib | PMA, Ashok | Entity catalog |
| `component-registry.yaml` | Talib | PMA | Component mapping |
| `design_system.md` | Clara | Charlie | Colors, typography, spacing specs |
| `design_tokens.md` | Clara | Charlie | Copy-paste constants for implementation |

**Reading Pattern:**
1. Start of phase: Read all inputs from PROJECT/dev/ and PROJECT/DESIGN/
2. Before each feature: Review specific feature requirements in actionlist.md
3. Before implementation: Check current_work.md to understand previous robot's work
4. During implementation: Reference data_model.md and use_cases.md for validation
5. Final validation: Cross-check against use_cases.md to ensure completeness

---

### RP-4.2: Output Creation Patterns

**Output File Locations:**

```
PROJECT/
├── SOURCE/
│   ├── backend/
│   │   ├── models/          # Ashok creates schema, Reena creates models
│   │   ├── routes/          # Reena creates API endpoints
│   │   ├── services/        # Reena creates business logic
│   │   └── tests/
│   │       └── integration/ # Each robot's integration tests
│   ├── frontend/
│   │   └── lib/
│   │       ├── data/        # Charlie creates data layer
│   │       ├── domain/      # Charlie creates domain logic
│   │       ├── presentation/# Charlie creates UI
│   │       └── tests/
│   │           └── integration/
│   └── database/
│       ├── schema.sql       # Ashok creates schema
│       ├── seed.sql         # Ashok creates seed data
│       └── migrations/      # Ashok creates migrations
├── dev/
│   ├── data_model.md        # PMA creates
│   ├── use_cases.md         # PMA creates
│   ├── actionlist.md        # PMA creates, robots read
│   ├── project_activity.status # Roma manages, all robots update
│   └── project_tasks.log    # Roma manages, all robots log to
└── DESIGN/
    ├── design_system.md     # Clara creates
    ├── design_tokens.md     # Clara creates (copy-paste ready)
    ├── COMPONENT_SPECS/     # Clara creates
    └── MOCKUPS/             # Clara creates
```

---

### RP-4.3: File Naming Conventions

**Code File Naming:**
- Database schema: `schema.sql`, migrations as `YYYYMMDD_description.sql`
- Models: `[entity].js`, `[entity]_model.dart`
- Routes: `[entity]_routes.js`
- Controllers: `[entity]_controller.js`
- Repositories: `[entity]_repository.dart`
- Use Cases: `[verb_entity].dart` (e.g., `create_project.dart`)
- UI Screens: `[entity]_[action]_screen.dart` or `[entity]_[action]_page.dart`
- Tests: `[module]_[layer]_test.[js|dart]`

**Requirement ID Format:**
- Epics: `EPIC-001`, `EPIC-002`
- Features: `FEAT-001.1`, `FEAT-001.2`
- Stories: `STORY-001.1.1`, `STORY-001.1.2`
- Tasks: `TASK-001.1.1.1`, `TASK-001.1.1.2`

---

### RP-4.4: Version Control Patterns

**Commit Message Standards:**
- Include amendment ID if fixing amendment: `"Clarify FEAT-003.2 sorting behavior (AMD-001)"`
- Include robot name: `"[robot_ashok] Create projects schema"`
- Reference blockers resolved: `"[robot_reena] Fix API integration tests (BLK-001 resolved)"`

**Artifact Update Triggers:**
- After feature completion → Update `project_activity.status`
- After task completion → Update `project_tasks.log`
- After amendment completion → Update amendment_requests in activity log
- After blocker resolution → Update blockers in activity log

---

## RP-5: DOCUMENTATION REQUIREMENTS

### RP-5.1: Code Annotations (Universal)

**Required for all classes/modules:**

```typescript
/**
 * @Created YYYY-MM-DD by [RobotName]
 * @Modified YYYY-MM-DD by [RobotName]
 * @TestLevel None|Integration|Unit|Both
 * @Stable true|false
 * @ComplexityLevel Low|Medium|High
 *
 * [Optional: Description]
 * [Optional: CHANGELOG]
 * [Optional: Test file references]
 */
```

**Annotation Lifecycle:**

| Stage | @TestLevel | @Stable | @Modified |
|-------|-----------|---------|-----------|
| Creation | `None` | `false` | Not included |
| After integration tests | `Integration` | `false` | Update date & robot |
| PMA approval | `Integration` | `true` | Update date = PMA |
| Complex logic identified | `Both` | `true` | Update date & robot |

**Annotation Rules:**

- `@Created`: Only once at creation (do not update)
- `@Modified`: Update date every significant change; include robot name
- `@TestLevel`: Progress: `None` → `Integration` → `Both`
- `@Stable`: Robots must get PMA approval before changing to `true`
- `@ComplexityLevel`: Assess when complexity evident; guides unit test decisions

---

### RP-5.2: SQL File Annotations

**File Header Format:**
```sql
-- @Created YYYY-MM-DD by Ashok
-- @Modified YYYY-MM-DD by Ashok
-- @TestLevel Integration
-- @Stable false
-- @ComplexityLevel Low
-- [Brief description of what this file does]
-- Integration tests: test/integration/database_test.js

CREATE TABLE [name] ( ... );
```

---

### RP-5.3: Design-Aware Code Annotations

**For frontend implementation:**

```dart
/**
 * @Created [DATE] by Charlie
 * @Modified [DATE] by Charlie
 * @Source DESIGN/[path/to/spec] (by Clara)
 * @DesignApprovedBy Clara
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 *
 * Design Specifications Used:
 * - Color: colorPrimary (from design_tokens.md)
 * - Typography: headingStyle1 (from design_tokens.md)
 * - Spacing: spacingMd (from design_tokens.md)
 * - Component: Button variant [primary|secondary] (from button_spec.md)
 * - Layout: [From mockup name]
 */
```

---

### RP-5.4: Activity Log Update Responsibilities

**Roma (Daily):**
- Monitor all phases for status changes
- Verify activity log is current (updated < 24 hours ago)
- Broadcast phase transitions
- Escalate blockers with CRITICAL/HIGH severity
- Track amendment request lifecycle

**Each Robot (On Event):**
- Update activity log when starting phase
- Log outputs immediately upon creation (with filenames)
- Request quality gate validation when ready
- Update log when amendments received/applied
- Log blockers immediately when identified

**Gatekeeper (On Validation):**
- Review phase outputs (verify artifacts exist and complete)
- Update quality gate status: `PASS` or `BLOCK`
- List blocking issues if `BLOCK` decision
- Document gate approval decision with timestamp

---

## RP-6: QUALITY & VALIDATION

### RP-6.1: Universal Quality Checklist

Before feature marked COMPLETED:
- [ ] All assigned layers/components implemented
- [ ] Integration tests at each layer passing
- [ ] All classes have annotations
- [ ] `@TestLevel` accurate for all classes
- [ ] `@ComplexityLevel` assessed
- [ ] No blockers remaining
- [ ] Feature tested end-to-end
- [ ] Status files updated in activity log

---

### RP-6.2: Integration Test Template

```javascript
describe('[Feature] [Layer] Integration', () => {
  beforeAll(async () => {
    // Setup: connect to real systems
  });

  afterEach(async () => {
    // Cleanup: remove test data
  });

  afterAll(async () => {
    // Teardown: close connections
  });

  it('should [action] successfully', async () => {
    // Test real system behavior
    // Verify data persists/flows correctly
  });

  it('should handle [error case]', async () => {
    // Test error handling
  });
});
```

---

### RP-6.3: Self-Check Commands

```bash
# Find all unstable classes
grep -r "@Stable false" SOURCE/

# Find classes needing unit tests
grep -r "@ComplexityLevel High" SOURCE/ | grep "@TestLevel Integration"

# Find recent modifications
grep -r "@Modified [DATE]" SOURCE/

# Find classes by creator
grep -r "@Created.*by [RobotName]" SOURCE/

# Run all integration tests
npm test -- tests/integration
flutter test test/integration
```

---

### RP-6.4: Testing by Layer

**Database (Ashok):**
- Schema creation successful
- Constraints enforced
- Seed data loads
- CRUD operations work
- Migrations execute

**Backend Models (Reena):**
- Models persist to database
- Queries return correct data
- Relationships work
- Validations enforced

**API Endpoints (Reena):**
- Endpoints respond correctly
- Validation enforced
- Errors returned properly
- Data flows through DB

**Client Data Layer (Charlie):**
- API communication works
- Data deserialization correct
- Error handling functional
- Offline resilience (if required)

**Domain Logic (Charlie):**
- Business rules enforced
- Use cases execute properly
- Edge cases handled
- State management correct

**Presentation (Charlie):**
- UI displays all states
- User interactions functional
- Error states display properly
- Complete UI → API → DB flow works

---

## RP-7: COORDINATION PATTERNS

### RP-7.1: Phase Progression Protocol

**Standard Flow:**

1. **Current Phase Completion** → Robot updates `project_activity.status`:
   - `status: completed`
   - Lists all `outputs_created`
   - Notes in `notes` field

2. **Roma Reviews** → Verifies outputs exist and complete

3. **Gatekeeper Validates** → Reviews outputs, decides PASS or BLOCK

4. **Roma Announces Result** → If PASSED: next phase starts; if BLOCKED: notifications

---

### RP-7.2: Status Update Format

```
Format: Feature | Layer | Status | Robot | Timestamp | TestLevel
Example: Project Management | API | COMPLETED | Reena | 2025-10-07 10:30 | Integration
```

---

### RP-7.3: Blocker Communication Format

```markdown
🔴 BLOCKED: [Feature Name] - [Layer]
Reason: [Specific blocker]
Needs: [What would unblock]
Impact: [Dependent features]
Status: [Current annotation state]
```

---

## RP-8: ENVIRONMENT & SETUP

### RP-8.1: Robot Directory Structure

**Standard Template:**

```
PROJECT/
├── robot_[name]/
│   ├── .claude/
│   │   ├── CLAUDE.md                (Your instructions)
│   │   └── settings.local.json      (Configuration)
│   ├── notes/
│   │   ├── current_work.md          (In-progress tasks)
│   │   ├── completed_features.md    (Work log)
│   │   └── blockers.md              (Issues & blockers)
│   ├── templates/                   (Role-specific templates)
│   └── README.md                    (Quick reference - symlink to role doc)
```

---

### RP-8.2: CLAUDE.md Template

```markdown
# [Robot Name] Instructions

**Robot**: [Name] (robot_[name]/)
**Role**: [Full Role Title]
**Phase**: [Phase Number] - [Phase Name]

## Your Responsibilities

[From role-[name].md]

## Assigned Features

[From actionlist.md relevant to this robot]

## Key Files

- PROJECT/dev/data_model.md
- PROJECT/dev/use_cases.md
- PROJECT/dev/actionlist.md
- PROJECT/dev/project_activity.status
- ROME/role-[name].md
- ROME/robot-protocols/robot-generic-protocols.md

## Protocols

- 6-step protocol: ANALYZE → DESIGN → IMPLEMENT → INTEGRATE → VALIDATE → REPORT
- Integration tests at each layer
- Class annotations: @Created, @TestLevel, @Stable, @ComplexityLevel
- Update project_activity.status when features complete
- Log blockers immediately
- Request amendments for prior phase changes

## Success Criteria

[Role-specific]
```

---

### RP-8.3: Settings File Template

```json
{
  "permissions": {
    "filesystem": true,
    "git": true,
    "bash": true,
    "network": false
  },
  "robot_name": "[Name]",
  "project_path": "PROJECT",
  "role": "[Role]"
}
```

---

### RP-8.4: Robot Notes Directory

| File | Purpose | Content |
|------|---------|---------|
| `current_work.md` | In-progress | What you're working on now |
| `completed_features.md` | Work log | Features completed (manual tracking) |
| `blockers.md` | Issues | Problems blocking progress |
| `[role-specific].md` | Role-specific | Design decisions, schema rationale, etc. |

---

### RP-8.5: Session State Documentation (P14a)

**Required on every session close or when work state changes:**

#### `current_work.md` Template

```markdown
# Current Work Status

**Last Updated:** 2025-11-07 16:45 UTC
**Robot:** robot_charlie
**Session ID:** charlie-session-20251107-1

## Work In Progress

**Feature:** FEAT-003 - User Profile Management
**Task:** Implement profile form submission

**Current Location:**
- File: `src/features/profile/ProfileForm.dart`
- Line: 142
- Function: `_submitProfile()`

**What I'm Doing:**
Step 3 of 5: Add server validation error handling to form submission
- ✅ Step 1: Form structure complete
- ✅ Step 2: Client-side validation working
- 🔄 Step 3: Server error handling (IN PROGRESS)
- ⏳ Step 4: Success message display
- ⏳ Step 5: Integration test coverage

**Progress:** 60% complete

**Next Steps:**
1. Add try/catch block for API call
2. Map server error codes to user-friendly messages
3. Display errors in form
4. Run integration tests

**Code Checkpoint:**
- Last commit: `Add client validation to profile form (step 2 complete)`
- Staged changes: None
- Uncommitted work: [Lines 142-180] function body started

**Expected completion:** 45 minutes
```

#### `completed_features.md` Template

```markdown
# Completed Features Log

## 2025-11-07

### FEAT-003.1 - Profile Form UI
- **Completed:** 2025-11-07 14:22 UTC
- **Robot:** robot_charlie
- **Lines of Code:** 245
- **Files:** ProfileForm.dart, profile_model.dart
- **Tests:** Integration test passing (user can open form, fill fields, see validation)
- **Status:** Awaiting code review
- **Commit:** a3f2c8e

### FEAT-003.2 - Form Validation Logic
- **Completed:** 2025-11-07 15:30 UTC
- **Robot:** robot_charlie
- **Tests:** Integration test passing (validation triggers on field blur, shows errors)
- **Status:** Awaiting code review
- **Commit:** c9e2a1d

## 2025-11-06

### FEAT-002 - User Settings Page
- **Completed:** 2025-11-06 17:45 UTC
- **Status:** Code review approved, merged to develop
- **Commit:** b4a6d7f
```

#### `blockers.md` Template

```markdown
# Current Blockers

## Active Blockers

### BLOCKER-1: API Endpoint Not Yet Implemented
- **Date Logged:** 2025-11-07 16:30 UTC
- **Issue:** POST /api/profile endpoint doesn't exist yet (Reena's responsibility)
- **Impact:** Can't test form submission end-to-end
- **Workaround:** Using mock API response
- **Depends On:** robot_reena completing FEAT-003 backend
- **Expected Resolution:** 2025-11-08 by 10:00 UTC
- **Status:** Waiting

### BLOCKER-2: Design Token Value Unclear
- **Date Logged:** 2025-11-07 14:15 UTC
- **Issue:** Clara's design doesn't specify margin size for form buttons
- **Impact:** Button spacing doesn't match other UI
- **Depends On:** Clara amendment request (submitted)
- **Expected Resolution:** 2025-11-07 by 18:00 UTC
- **Status:** Amendment pending

## Resolved (This Session)

### BLOCKER-3: Form Library Selection (RESOLVED)
- **Logged:** 2025-11-07 09:00 UTC
- **Issue:** Unclear whether to use Riverpod or Provider for form state
- **Resolution:** PMA approved Riverpod decision via amendment
- **Resolved:** 2025-11-07 10:15 UTC
```

---

### RP-8.6: Session Restart Protocol (P14c)

**When starting a new session (after interruption, timeout, or context reset):**

**Step 1: Read Role Instructions**
```bash
cat robot_[name]/.claude/CLAUDE.md
```
Understand: phase, responsibilities, assigned features

**Step 2: Check Current Work State**
```bash
cat robot_[name]/notes/current_work.md
```
Answer these questions:
- What feature was being worked on?
- What step was in progress?
- What's the exact code location (file, line, function)?
- What's the progress percentage?
- What are the next steps?

**Step 3: Check Activity Log**
```bash
cat PROJECT/dev/project_activity.status | grep -A 20 "[robot_name]"
```
Understand: phase-level status, blockers, pending decisions from Roma

**Step 4: Check Git State**
```bash
git log --oneline --decorate -5
git status
```
Understand: latest commits, uncommitted changes, branch state

**Step 5: Check Blockers**
```bash
cat robot_[name]/notes/blockers.md
```
Understand: what's waiting on external dependencies

**Step 6: Resume from Checkpoint**
```bash
# Open the exact file and line from current_work.md
# Review the function context
# Continue from "Next Steps" outlined in current_work.md
```

**Step 7: Update Session Log**
```markdown
Append to current_work.md:

**Session Resumed:** 2025-11-07 17:30 UTC
- Previous session ended at: Step 3 of 5 (60% complete)
- Previous commit: a3f2c8e
- Continuing with: Server error handling implementation
- Code location: src/features/profile/ProfileForm.dart:142
```

**Step 8: Validate Continuity**
- [ ] All blockers from previous session still current? Update if resolved
- [ ] Any amendments approved? Check PROJECT/dev/project_activity.status
- [ ] Any new feature dependencies? Check actionlist.md
- [ ] Code compiles from checkpoint? Run build if needed
- [ ] Ready to continue? Resume at exact code location

---

### RP-8.7: Checkpoint Best Practices

**Never end a session without:**

1. **Commit or stage code with descriptive checkpoint message**
   ```bash
   git commit -m "Add profile form validation (step 2 of 5 complete)

   Progress:
   - ✅ Form structure complete
   - ✅ Client-side validation working
   - Next: Server error handling"
   ```

2. **Update current_work.md with exact state**
   - What was accomplished this session
   - What's the next immediate task (first 3 steps)
   - Where in the code to resume
   - Any new blockers encountered

3. **Update completed_features.md if feature finished**
   - Exactly when it was completed
   - What tests pass
   - Status (ready for review, awaiting merge, etc.)

4. **Update blockers.md if new blockers found**
   - Date and time logged
   - What the blocker is
   - Which feature depends on resolution
   - Expected resolution date

5. **No incomplete work without context**
   - If stopping mid-function: add TODO comment with context
   - If stopping mid-feature: note percentage complete
   - If stopping due to blocker: document exact blocker

**Checkpoint Message Format:**
```
[FEATURE-ID] [Brief description] (step N of M complete, NN% done)

Accomplished:
- Item 1
- Item 2

Next Steps:
1. First step
2. Second step
3. Third step

Status: [In Progress / Waiting on Blocker / Ready for Review]
```

---

## RP-9: SPECIAL PROTOCOLS

### RP-9.1: Design-to-Implementation Handoff (Clara → Charlie)

**3-Checkpoint Validation:**

**Checkpoint 1:** Design constants
- Clara validates: design_tokens.dart matches design_tokens.md exactly
- Blocks if: Values don't match specs

**Checkpoint 2:** Components
- Clara validates: Reusable widgets match component specs
- Blocks if: Missing variants, missing states, visual differences

**Checkpoint 3:** Screens
- Clara validates: Layout, spacing, colors, typography match designs
- Blocks if: Significant deviations, responsive breakpoint issues, accessibility failures

---

### RP-9.2: Phase Amendment When Blocker Found

If gatekeeper blocks and requires amendment:

```yaml
phase_2b_sarah_gate:
  quality_gate: blocked
  gate_blocking_issues:
    - issue: "API design incomplete for FEAT-001.3"
      required_amendment: true
      amendment_target: phase_2_pma
```

Roma broadcasts to affected phase robot with amendment request format (RP-1.2).

---

### RP-9.3: Vertical Feature Slice Definition

**Feature = Complete Stack Implementation:**

NOT horizontal layers:
- ❌ "All database tables"
- ❌ "All API endpoints"
- ❌ "All UI screens"

YES vertical slices:
- ✅ Project CRUD (Ashok: table, Reena: API, Charlie: UI)
- ✅ User Authentication (Ashok: users table, Reena: auth API, Charlie: login UI)
- ✅ Task Management (Ashok: tasks table, Reena: task API, Charlie: task screens)

---

## REFERENCE MATRIX

| Protocol | Used By | Frequency | See Section |
|----------|---------|-----------|-------------|
| Activity Log Updates | All robots | On event | RP-1.1 |
| Amendment Requests | Phase 3 → Prior phases | As needed | RP-1.2 |
| Blocker Escalation | All robots | As needed | RP-1.3 |
| Work Assignments | Roma → All robots | On new work | RP-1.4 |
| 6-Step Protocol | All robots | Every feature | RP-2.1 |
| Integration Testing | All robots | Every layer | RP-5.2 |
| Code Annotations | All robots | Every class | RP-4.1 |
| Status Updates | All robots | On completion | RP-6.2 |
| Phase Progression | Roma + Gatekeeper | On phase end | RP-6.1 |

---

## How Role Definitions Use This

**Example from a role doc:**

```markdown
## Communication

Per **RP-1.2: Amendment Request Protocol**, when you need changes from prior phases:
1. Log amendment in activity log
2. Roma broadcasts to affected robot
3. Follow 5-step amendment cycle

Reference: ROME/robot-protocols/robot-generic-protocols.md#RP-1.2

## Testing

All features tested per **RP-5.4: Testing by Layer**:
- Database: CRUD operations + constraints
- Models: Persistence + relationships
- API: Response validation + data flow

Reference: ROME/robot-protocols/robot-generic-protocols.md#RP-5.4
```

---

## EXAMPLE WORKFLOW TRACE

**Complete workflow from phase start through amendment resolution:**

```
2025-11-01 08:00 - Talib starts Phase 1
  → Updates activity log: phase_1_talib.status = in_progress

2025-11-05 17:00 - Talib completes Phase 1
  → Updates activity log: phase_1_talib.status = completed
  → Lists 3 outputs: requirements-matrix.yaml, data-dictionary.yaml, component-registry.yaml
  → Requests gate validation: phase_1_talib.quality_gate = pending

2025-11-05 17:15 - Roma reads log, broadcasts to PMA
  "Phase 1 complete, reviewing gate. PMA review requested."

2025-11-05 18:00 - PMA (gatekeeper for P1→P2) validates
  → Reviews requirements files
  → Updates log: phase_1_talib.quality_gate = passed
  → Logs: phase_2_pma.status = in_progress

2025-11-05 18:05 - Roma reads updated log, broadcasts
  "Phase 1 gate: PASS. Phase 2 approved. PMA proceeding."

2025-11-05 19:00 - PMA starts Phase 2 work
  → Updates log: phase_2_pma.current_work = "Analyzing requirements"

2025-11-07 09:15 - Charlie (Phase 3) identifies need for Phase 1 change
  → Logs amendment request AMD-001 in activity log
  → Logs: phase_3_development.amendment_requests[0].status = pending_talib_review

2025-11-07 09:20 - Roma reads log, sees amendment request
  → Broadcasts to Talib: "Amendment request AMD-001 needs your response"

2025-11-07 10:00 - Talib reviews amendment, provides clarification
  → Updates log: phase_1_talib.amendment_requests[AMD-001].status = completed

2025-11-07 10:05 - Roma reads updated log
  → Broadcasts to Charlie: "Amendment AMD-001 complete, requirements clarified"

2025-11-07 10:30 - Charlie acknowledges amendment completion
  → Closes amendment in activity log
  → Resumes Phase 3 work
```

---

## SPECIAL: QUALITY GATE AMENDMENTS

If a gatekeeper blocks a phase AND requires amendment to prior phase:

```yaml
phase_2b_sarah_gate:
  quality_gate: blocked
  gate_blocking_issues:
    - issue: "API design incomplete for Feature FEAT-001.3"
      required_amendment: "PMA must clarify API contract before design approval"
      amendment_requested: true
      amendment_target: phase_2_pma
```

Roma broadcasts:
```
Gate BLOCK: Phase 2B (Sarah) requires amendment to Phase 2 (PMA)
  Issue: API design incomplete for FEAT-001.3
  Action: Amendment request AMD-003 created for PMA
  PMA: Please clarify API contract, update api_design.md
  Status: Phase 2A design BLOCKED until amendment complete
```

---

## SUMMARY

**Activity log is the robot coordination mechanism:**
- Single source of truth for phase state
- Asynchronous (no real-time dependencies)
- Complete audit trail (timestamped, who did what)
- Amendment tracking (which artifacts changed, why)
- Blocker escalation path (to Roma, then sponsor)
- Enables P6 (central coordination) and P12 (global visibility, phase-scoped amendments)

**Update frequency:**
- On phase start/completion: immediate
- On blocker detection: immediate
- On amendment request: immediate
- On amendment completion: immediate
- On quality gate decision: immediate
- Routine status updates: daily

**Roma monitors continuously** and broadcasts state changes to robots and sponsor.

---

**This document is the generalized basis. Role-specific definitions inherit from here and add specializations.**
