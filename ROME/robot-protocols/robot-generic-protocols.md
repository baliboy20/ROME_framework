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

**Log Entry Template:**

```yaml
phases:
  phase_X_[robot]:
    status: pending|in_progress|completed
    start_date: "YYYY-MM-DD"
    completion_date: "YYYY-MM-DD" (if completed)
    outputs_created:
      - artifact_name_1.ext
      - artifact_name_2.ext
    current_work: "Description of current work" (if in_progress)
    blockers:
      - blocker_id: BLK-001
        title: "Blocker title"
        status: awaiting_roma_action|escalated_to_sponsor|...
    amendment_requests:
      - amendment_id: AMD-001
        affected_artifact: filename
        status: pending_[phase]_review|completed|...
    quality_gate: pending|passed|blocked
    gate_blocking_issues: [ ]
    gate_approved_by: "robot_name"
    notes: "Freeform notes about phase status"
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

## RP-3: FILE & ARTIFACT HANDLING

### RP-3.1: Input File Reading Patterns

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

### RP-3.2: Output Creation Patterns

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

### RP-3.3: File Naming Conventions

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

### RP-3.4: Version Control Patterns

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

## RP-4: DOCUMENTATION REQUIREMENTS

### RP-4.1: Code Annotations (Universal)

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

### RP-4.2: SQL File Annotations

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

### RP-4.3: Design-Aware Code Annotations

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

### RP-4.4: Activity Log Update Responsibilities

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

## RP-5: QUALITY & VALIDATION

### RP-5.1: Universal Quality Checklist

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

### RP-5.2: Integration Test Template

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

### RP-5.3: Self-Check Commands

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

### RP-5.4: Testing by Layer

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

## RP-6: COORDINATION PATTERNS

### RP-6.1: Phase Progression Protocol

**Standard Flow:**

1. **Current Phase Completion** → Robot updates `project_activity.status`:
   - `status: completed`
   - Lists all `outputs_created`
   - Notes in `notes` field

2. **Roma Reviews** → Verifies outputs exist and complete

3. **Gatekeeper Validates** → Reviews outputs, decides PASS or BLOCK

4. **Roma Announces Result** → If PASSED: next phase starts; if BLOCKED: notifications

---

### RP-6.2: Status Update Format

```
Format: Feature | Layer | Status | Robot | Timestamp | TestLevel
Example: Project Management | API | COMPLETED | Reena | 2025-10-07 10:30 | Integration
```

---

### RP-6.3: Blocker Communication Format

```markdown
🔴 BLOCKED: [Feature Name] - [Layer]
Reason: [Specific blocker]
Needs: [What would unblock]
Impact: [Dependent features]
Status: [Current annotation state]
```

---

## RP-7: ENVIRONMENT & SETUP

### RP-7.1: Robot Directory Structure

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

### RP-7.2: CLAUDE.md Template

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

### RP-7.3: Settings File Template

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

### RP-7.4: Robot Notes Directory

| File | Purpose | Content |
|------|---------|---------|
| `current_work.md` | In-progress | What you're working on now |
| `completed_features.md` | Work log | Features completed (manual tracking) |
| `blockers.md` | Issues | Problems blocking progress |
| `[role-specific].md` | Role-specific | Design decisions, schema rationale, etc. |

---

## RP-8: SPECIAL PROTOCOLS

### RP-8.1: Design-to-Implementation Handoff (Clara → Charlie)

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

### RP-8.2: Phase Amendment When Blocker Found

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

### RP-8.3: Vertical Feature Slice Definition

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

**This document is the generalized basis. Role-specific definitions inherit from here and add specializations.**
