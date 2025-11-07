# Phase 1 to Phase 2 Handoff Protocol

**Version:** 6.0 - Evolutionary, Session-Continuous, Robot-Native
**Date**: 2025-11-07
**Status:** Production
**Purpose**: Define seamless handoff from Phase 1 (Talib) to Phase 2 (PMA), ensuring requirements artifacts fully support architecture planning

---

## Overview

This document defines the Phase 1 → Phase 2 handoff protocol, ensuring:

1. **Complete Artifact Transfer** - Talib delivers all required requirement artifacts
2. **Quality Validation** - PMA validates completeness before proceeding
3. **Seamless Continuity** - No work duplication, clear dependencies between phases
4. **Issue Resolution** - Systematic handling of ambiguities or gaps

---

## Phase 1 Completion Checklist (Talib)

Before declaring Phase 1 complete, Talib validates:

**Artifacts Produced:**
- [ ] `PROJECT/dev/requirements-matrix.yaml` exists and is valid YAML
- [ ] Complete Epic → Feature → Story → Task hierarchy
- [ ] All traceability IDs follow naming conventions (EPIC-XXX, FEAT-XXX.X, STORY-XXX.X.X, TASK-XXX.X.X.X)
- [ ] No placeholder or TODO items remain
- [ ] All ambiguities from raw requirements resolved

**Quality Checks:**
- [ ] Every epic has at least 2 acceptance criteria
- [ ] Every feature has at least 1 story
- [ ] Every story follows user story format (As a..., I want..., So that...)
- [ ] Every story has 2-5 testable acceptance criteria
- [ ] Dependencies documented (no circular dependencies)
- [ ] Priority levels assigned (High/Medium/Low)

**Documentation:**
- [ ] `robot_talib/notes/current_work.md` completed
- [ ] `robot_talib/notes/completed_features.md` updated
- [ ] `PROJECT/dev/project_activity.status` marked Phase 1 COMPLETE

---

## Handoff Artifacts

### Primary Artifact: requirements-matrix.yaml

**Location:** `PROJECT/dev/requirements-matrix.yaml`

**Purpose:** Complete requirements hierarchy with full traceability and acceptance criteria

**Must contain:**
```yaml
metadata:
  version: "6.0"
  created: "2025-11-07"
  created_by: "robot_talib"
  project_name: "string"
  project_description: "string"

epics:
  - id: EPIC-001
    name: string
    description: string
    priority: "High|Medium|Low"
    acceptance_criteria:
      - string (2-5 criteria)
    features:
      - id: FEAT-001.1
        name: string
        description: string
        priority: "High|Medium|Low"
        ui_required: boolean
        dependencies: [FEAT-XXX.X]
        acceptance_criteria:
          - string (2-5 criteria)
        stories:
          - id: STORY-001.1.1
            name: string
            as_a: "user role"
            i_want: "capability"
            so_that: "benefit"
            acceptance_criteria:
              - string (2-5 criteria)
            dependencies: [STORY-XXX.X.X]
            tasks:
              - id: TASK-001.1.1.1
                name: string
                description: string
                component: string
                complexity: "Low|Medium|High"
                acceptance_criteria:
                  - string (2-5 criteria)
                dependencies: [TASK-XXX.X.X.X]
```

**PMA uses this for:**
- Understanding scope boundaries and priorities
- Identifying integration points
- Planning test coverage and vertical slices
- Creating action list with traceability
- Architecture decisions on feature complexity

---

## Handoff Validation Checklist (PMA)

### Step 1: Artifact Receipt & Parse Validation

PMA must verify before proceeding:

**File Integrity:**
- [ ] `requirements-matrix.yaml` exists
- [ ] File is valid YAML (parses without errors)
- [ ] File is readable and properly encoded

**Structure Validation:**
- [ ] Metadata section present with version, created, created_by, project_name
- [ ] At least 1 epic present
- [ ] Every epic has at least 1 feature
- [ ] Every feature has at least 1 story
- [ ] Every story has at least 1 task

### Step 2: Completeness Validation

**Hierarchy Check:**
- [ ] All IDs follow naming convention (EPIC-XXX, FEAT-XXX.X, STORY-XXX.X.X, TASK-XXX.X.X.X)
- [ ] No "TBD", "XXX", or placeholder IDs remain
- [ ] ID numbering is sequential with no gaps

**Content Validation:**
- [ ] Every epic has: name, description, acceptance criteria (min 2)
- [ ] Every feature has: name, description, acceptance criteria (min 2)
- [ ] Every story has: as_a, i_want, so_that, acceptance criteria (min 2)
- [ ] Every task has: name, description, component, acceptance criteria (min 2)
- [ ] Acceptance criteria are specific and testable (not vague like "should work well")

**Dependency Validation:**
- [ ] All referenced dependencies exist in the artifact
- [ ] No circular dependencies detected
- [ ] Dependencies are logical (child depends on child, not backwards)

### Step 3: Clarification Identification

**If validation passes:**
- [ ] Proceed to Phase 2 architecture design
- [ ] Create summary in `PROJECT/dev/project_activity.status`

**If validation identifies issues:**
1. **Minor Issues** (formatting, missing priorities):
   - PMA documents issues
   - PMA can proceed with assumptions OR request Talib revision

2. **Major Issues** (missing stories, undefined dependencies, incomplete acceptance criteria):
   - PMA documents specific gaps
   - Return to Talib for revision before proceeding

3. **Ambiguous Requirements** (PMA cannot make architecture decision):
   - PMA documents clarification questions
   - Escalate to user via Roma coordination
   - Talib or PMA updates artifact based on user response

---

## Handoff Failure Scenarios

### Scenario 1: Incomplete Artifacts

**Symptoms:**
- Missing epic(s), feature(s), or story(ies)
- Empty or stub sections
- Placeholder IDs or tasks

**Resolution:**
1. PMA documents exactly what's missing
2. Return to Talib Decomposer with specific gaps
3. Talib completes or refines artifacts
4. PMA re-validates before proceeding

**Prevention:** Talib completion checklist above

### Scenario 2: Inconsistent Traceability

**Symptoms:**
- Feature references undefined dependency
- Story IDs don't match parent feature
- Task component doesn't exist

**Resolution:**
1. PMA identifies inconsistencies
2. Talib reconciles artifact
3. PMA re-validates

**Prevention:** Talib validates IDs follow hierarchy

### Scenario 3: Ambiguous Acceptance Criteria

**Symptoms:**
- Criteria unclear (e.g., "User can see feature")
- Criteria not testable (e.g., "Performance is good")
- Missing edge cases

**Resolution:**
1. PMA documents specific questions
2. Escalate to user via Roma
3. User clarifies
4. Talib updates artifact

**Prevention:** Talib ensures criteria are specific and testable

### Scenario 4: Architectural Infeasibility

**Symptoms:**
- Requirements conflict with technology constraints
- Performance requirements seem unachievable
- Integration requirements not clear

**Resolution:**
1. PMA documents concerns with technical reasoning
2. Proceed with assumptions (document in `technical-decisions.md`)
3. Revisit during Phase 2B validation (P13 evolutionary development)
4. If major conflict: Escalate to user via Roma

**Prevention:** Talib analyzes across 8 dimensions during Phase 1

---

## Communication Protocol

### Talib Declares Phase 1 Complete

**Method:** Update `PROJECT/dev/project_activity.status`

**Example:**
```yaml
phases:
  phase_1_talib:
    status: completed
    completion_date: "2025-11-09"
    outputs_created:
      - requirements-matrix.yaml
    quality_gate: passed
    notes: "All requirements refined, validated, and ready for Phase 2"
    artifact_summary:
      epics: 3
      features: 8
      stories: 24
      tasks: 72
```

### PMA Acknowledges Receipt

**Method:** Update `PROJECT/dev/project_activity.status`

**Example - Pass:**
```yaml
  phase_2_pma:
    status: in_progress
    start_date: "2025-11-09"
    phase_1_validation: passed
    current_work: "Artifact analysis and architecture design"
    notes: "Phase 1 artifacts validated, proceeding to Step 1 analysis"
```

**Example - Issues:**
```yaml
  phase_2_pma:
    status: blocked
    blocker_type: "Phase 1 revision required"
    issues:
      - "FEAT-002.3: Missing acceptance criteria"
      - "TASK-001.2.1.2: Undefined component reference"
    required_actions: "Return to Talib for revision"
```

### PMA Requests Clarification

**Method:** Document in `PROJECT/dev/clarification-requests.md`

**Example:**
```markdown
# Phase 1 Clarification Requests

## Request 1: Feature Priority Conflict
**Feature:** FEAT-001.2 (User Registration)
**Conflict:** Marked as "Medium" priority but blocking other high-priority features
**Question:** Should this be "High" priority?
**Impact:** Affects test planning and development sequence

## Request 2: Ambiguous Acceptance Criteria
**Story:** STORY-002.1.2
**Criteria:** "User can create project quickly"
**Issue:** Not testable - define "quickly" (< 1 sec? < 5 sec?)
**Impact:** Cannot write acceptance tests without definition
```

---

## Phase 1 Artifact Example

See `phase1-artifact-schemas.md` for complete schema reference, or review actual example:

```yaml
metadata:
  version: "6.0"
  created: "2025-11-07"
  created_by: "robot_talib"
  project_name: "Project Management App"
  project_description: "Simple tool for managing projects and tasks"

epics:
  - id: EPIC-001
    name: "User Account Management"
    description: "Allow users to create accounts and authenticate"
    priority: High
    acceptance_criteria:
      - Users can sign up with email/password
      - Users can log in and log out
      - User sessions persist across requests
    features:
      - id: FEAT-001.1
        name: "User Registration"
        description: "New users can create accounts"
        priority: High
        ui_required: true
        acceptance_criteria:
          - Registration form displays correctly
          - User can submit valid credentials
          - Account is created in database
        stories:
          - id: STORY-001.1.1
            name: "Display registration form"
            as_a: "new user"
            i_want: "see a registration form"
            so_that: "I can create an account"
            acceptance_criteria:
              - Form is visible and accessible
              - Form has email and password fields
              - Form has submit and cancel buttons
            tasks:
              - id: TASK-001.1.1.1
                name: "Create registration form component"
                description: "Build HTML/CSS form with email and password fields"
                component: "auth-ui"
                complexity: Low
                acceptance_criteria:
                  - Form displays on page
                  - All fields are visible
                  - Form is responsive on mobile
```

---

## PMA Phase 2 Step 1: Artifact Analysis

PMA's first action upon receiving Phase 1 artifacts:

### Step 1A: Parse & Validate

```bash
# Pseudo-code for PMA validation
1. Read requirements-matrix.yaml
2. Parse YAML structure
3. Validate against schema (no missing required fields)
4. Count epics, features, stories, tasks
5. Check all IDs match naming convention
6. Verify no circular dependencies
7. Report any parsing errors
```

### Step 1B: Completeness Assessment

PMA documents:
- Total number of epics, features, stories, tasks
- Any obvious gaps or incomplete sections
- High-priority features that need early architecture focus
- Integration points that require special consideration

### Step 1C: Clarification Questions

If questions arise, PMA documents them in `PROJECT/dev/clarification-requests.md` and:
1. Low priority → Proceed with assumptions
2. High priority (blocks architecture) → Escalate to user via Roma

---

## Integration with Phase 2A (UX - Optional)

**Note:** UX designer Clara (Phase 2A, optional) also reads Phase 1 artifacts

**Clara needs from Phase 1:**
- `requirements-matrix.yaml` → UI feature requirements and user stories
- Feature stories → User workflows and acceptance criteria
- `ui_required: boolean` flags → Which features need UI design

**Coordination with PMA:**
1. PMA completes Phase 2 architecture first
2. Clara receives both Phase 1 artifacts AND PMA architecture (from Phase 2 completion)
3. Clara designs UI/UX constrained by both requirements and architecture

---

## PMA Phase 2 Output Expectations

**When PMA Phase 2 completes, PMA will deliver:**

- `PROJECT/dev/data_model.md` - Entity definitions and relationships (evolved from Phase 1)
- `PROJECT/dev/use_cases.md` - User workflows and system interactions
- `PROJECT/dev/actionlist.md` - Feature decomposition into vertical slices with robot assignments
- `PROJECT/dev/technical-decisions.md` - Architecture decisions with sponsor approvals
- `PROJECT/dev/project_activity.status` - Phase 2 completion with gate readiness

**These artifacts reference Phase 1 requirements-matrix.yaml throughout.**

---

## Session Continuity (P14)

**If Talib's session crashes during Phase 1:**
1. Restart robot in `robot_talib/` directory
2. Robot reads `robot_talib/notes/current_work.md` for work state
3. Robot resumes from exact checkpoint
4. Recovery time: < 5 minutes
5. No work lost

**If PMA's session crashes during Phase 2:**
1. Restart robot in `robot_pma/` directory
2. Robot reads `robot_pma/notes/current_work.md` for work state
3. Robot resumes from exact checkpoint
4. Recovery time: < 5 minutes
5. No work lost

See `robot-protocols/robot-generic-protocols.md#RP-7.6` for detailed session recovery protocol.

---

## Evolutionary Development (P13)

**During Phase 3 Implementation:**

If Ashok, Reena, or Charlie discover that Phase 2 architectural decisions are unworkable:

1. **Document the Issue** - Specific technical blocker with evidence
2. **Request Amendment** - Use amendment request protocol (RP-1.2)
3. **PMA Reviews** - Assesses feasibility
4. **User Decision** - Change requirements, change architecture, or find technical workaround
5. **Update Artifacts** - If amended, update Phase 2 and/or Phase 1 artifacts with justification

**All changes tracked with full context for institutional knowledge.**

See `01-methodology/operational-design-principles.md#P13` for complete evolutionary development principle.

---

## Key Metrics

### Successful Handoff
- ✅ Zero artifact defects at Phase 2 Step 1 validation
- ✅ PMA proceeds directly to Step 2 (architecture design) without blockers
- ✅ All requirements clear enough for technical decisions
- ✅ Timeline maintained: 2-3 days per phase

### Acceptable Handoff
- ✅ Minor clarifications resolved within 1 day
- ✅ One revision cycle for incomplete sections
- ✅ PMA can proceed with documented assumptions
- ✅ Timeline impact: +1 day

### Problematic Handoff
- 🚫 Multiple revision cycles required
- 🚫 PMA blocked from proceeding
- 🚫 Significant ambiguities requiring user escalation
- 🚫 Timeline impact: +3+ days

---

## References

**Phase 1 Documentation:**
- `phase1-quickstart.md` - Phase 1 step-by-step execution guide
- `phase1-artifact-schemas.md` - Complete YAML schema reference
- `role-talib.md` - Talib (Phase 1) complete role specification

**Phase 2 Documentation:**
- `03-phase2-architecture/role-pma.md` - PMA Phase 2 complete role specification
- `03-phase2-architecture/phase2-quickstart.md` - Phase 2 step-by-step execution

**Cross-Phase Documentation:**
- `01-methodology/operational-design-principles.md` - 14 core governance principles
- `robot-protocols/robot-generic-protocols.md` - Detailed robot protocols (RP-1 through RP-8)
- `00-start/README.md` - ROME 6.0 project launch guide

---

**This handoff protocol ensures Phase 2 begins with clear, complete, and validated requirements from Phase 1.**

