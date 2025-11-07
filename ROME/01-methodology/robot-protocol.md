# ROME Robot Protocol

**Version:** 6.0
**Status:** Coordination and phase amendment protocol
**Principles:** P6, P12

---

## Overview

This protocol defines how robots communicate, coordinate phase progression, and request amendments to artifacts from prior phases.

**Core mechanism:** Centralized activity log (`PROJECT/dev/project_activity.status`) is single source of truth for phase state, blockers, and amendment requests.

---

## Communication Model

### Information Flow (One-Way Forward)
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

### Control Flow (Backward for Amendments Only)
```
Phase 3 needs Phase 1 change
  → Phase 3 logs amendment request in activity log
  → Roma broadcasts to Talib
  → Talib amends, updates activity log
  → Roma notifies Phase 3 change is complete
```

---

## Activity Log Structure

**Location:** `PROJECT/dev/project_activity.status`

**Format:** YAML with phase-indexed entries

```yaml
project_name: "Example Project"
last_updated: "2025-11-07T10:30:00Z"
updated_by: "robot_talib"

phases:
  phase_1_talib:
    status: completed
    start_date: "2025-11-01"
    completion_date: "2025-11-05"
    outputs_created:
      - requirements-matrix.yaml
      - data-dictionary.yaml
      - component-registry.yaml
    quality_gate: passed
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
    blockers: []
    amendment_requests: []
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

---

## Phase Progression Protocol

### Standard Flow (No Blockers)

1. **Current Phase Completion**
   - Robot updates `project_activity.status`:
     - Sets `status: completed`
     - Lists all `outputs_created` (artifact filenames)
     - Notes in `notes` field

2. **Roma Reviews & Broadcasts Gate Request**
   - Roma reads activity log
   - Roma verifies outputs exist and are complete
   - Roma updates log: `quality_gate: pending`

3. **Next Phase Gatekeeper Validation**
   - Gatekeeper (defined in P5) reviews phase outputs
   - Updates log: `quality_gate: passed` OR `quality_gate: blocked`

4. **Roma Announces Gate Result**
   - If PASSED: Updates next phase `status: in_progress`, broadcasts "Phase X approved, proceeding to Phase X+1"
   - If BLOCKED: Lists blocking issues in `gate_blocking_issues` field, notifies current robot

---

## Amendment Request Protocol

### Scenario: Phase 3 Needs Phase 1 Requirement Change

**Step 1: Phase 3 Robot Identifies Need**

Robot (Ashok/Reena/Charlie) logs request in activity log:

```yaml
phase_3_development:
  amendment_requests:
    - amendment_id: "AMD-001"
      requested_by: "robot_charlie"
      requested_date: "2025-11-07T09:15:00Z"
      affected_phase: phase_1_talib
      affected_artifact: "requirements-matrix.yaml"
      change_required: "Feature FEAT-003.2 scope ambiguity - unclear if sorting is case-sensitive"
      justification: "Frontend implementation blocked by this ambiguity. API design cannot proceed without clarity."
      severity: "HIGH"
      status: "pending_talib_review"
```

**Step 2: Roma Broadcasts to Affected Phase Robot**

Roma reads amendment request and notifies Talib:
```
@robot_talib: Amendment request AMD-001
  Artifact: requirements-matrix.yaml
  Issue: FEAT-003.2 sorting case-sensitivity ambiguity
  Requested by: robot_charlie
  Severity: HIGH

Please review and respond with:
1. Can requirement be clarified?
2. If yes, provide updated FEAT-003.2 specification
3. If no, explain constraints
```

**Step 3: Talib Responds**

Talib updates activity log:

```yaml
phase_1_talib:
  amendment_requests:
    - amendment_id: "AMD-001"
      response_date: "2025-11-07T10:00:00Z"
      decision: "approved"
      clarification: "FEAT-003.2 sorting is case-insensitive. Updated requirements-matrix.yaml line 237 with explicit criteria."
      new_commit: "abc1234 - Clarify FEAT-003.2 sorting behavior"
      status: "completed"
```

**Step 4: Roma Notifies Phase 3**

Roma broadcasts to Charlie:
```
@robot_charlie: Amendment AMD-001 completed
  Talib has clarified FEAT-003.2 sorting behavior (case-insensitive)
  Updated artifact: requirements-matrix.yaml (commit abc1234)
  You may proceed with implementation
```

**Step 5: Phase 3 Acknowledges**

Charlie updates activity log:
```yaml
phase_3_development:
  amendment_requests:
    - amendment_id: "AMD-001"
      acknowledged_by: "robot_charlie"
      acknowledged_date: "2025-11-07T10:30:00Z"
      status: "closed"
```

---

## Blocker Escalation Protocol

### When Phase Robot Cannot Proceed

**Blocker Definition:** Issue preventing phase completion that requires:
- Roma escalation to sponsor, OR
- Amendment to prior phase, OR
- Cross-robot coordination

**Step 1: Robot Logs Blocker**

```yaml
phase_2_pma:
  blockers:
    - blocker_id: "BLK-001"
      logged_by: "robot_pma"
      logged_date: "2025-11-07T09:45:00Z"
      title: "Unclear user role definitions from Phase 1"
      description: "Requirements state 3 user roles but don't define role-specific permissions. PMA needs clarity before designing APIs."
      impact: "Phase 2 design blocked; cannot define API authorization"
      severity: "CRITICAL"
      requested_action: "Escalate to sponsor for role clarification"
      status: "awaiting_roma_action"
```

**Step 2: Roma Detects & Escalates**

Roma reads activity log, sees CRITICAL blocker, escalates to sponsor:

```
BLOCKER ESCALATION - CRITICAL
  Project: Example Project
  Phase: 2 (PMA)
  Robot: robot_pma

  Title: Unclear user role definitions

  Description: Requirements specify 3 user roles but lack permission definitions.
  PMA cannot design API authorization without clarity.

  Impact: Phase 2 BLOCKED

  Decision Required:
  Option 1: Provide detailed role/permission specifications
  Option 2: Reduce scope to 1 role, defer others
  Option 3: Return to Phase 1 for Talib clarification

  Please respond with decision by EOD.
```

**Step 3: Sponsor/Roma Resolves**

After sponsor decision, Roma updates blocker:

```yaml
phase_2_pma:
  blockers:
    - blocker_id: "BLK-001"
      resolution_date: "2025-11-07T14:00:00Z"
      resolved_by: "sponsor"
      decision: "Return to Phase 1 for Talib clarification"
      action_taken: "Escalated to Talib via amendment request AMD-002"
      status: "closed_by_amendment"
```

---

## Activity Log Update Responsibilities

### Roma (Daily)
- Monitor all phases for status changes
- Verify activity log is current (updated < 24 hours ago)
- Broadcast phase transitions
- Escalate blockers with CRITICAL/HIGH severity
- Track amendment request lifecycle

### Each Robot (On Event)
- Update activity log when starting phase
- Log outputs immediately upon creation
- Request quality gate validation when ready
- Update log when amendments received/applied
- Log blockers immediately when identified

### Gatekeeper (On Validation)
- Review phase outputs (verify artifacts exist/complete)
- Update quality gate status: PASS or BLOCK
- List blocking issues if BLOCK decision
- Document gate approval decision

---

## Amendment Request Status Values

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `pending_[phase]_review` | Awaiting response from target phase robot | Wait for robot response |
| `approved` | Target phase approved and completed amendment | Close request, proceed |
| `rejected` | Target phase cannot amend (constraints prevent) | Escalate to Roma/sponsor |
| `in_progress` | Target phase is amending | Wait for update |
| `completed` | Amendment complete, artifact updated | Close request, proceed |
| `closed` | Amendment acknowledged, cycle complete | Archive |

---

## Blocker Status Values

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `awaiting_roma_action` | Roma will review/escalate | Roma to act |
| `escalated_to_sponsor` | Awaiting sponsor decision | Sponsor to decide |
| `amendment_requested` | Escalated as amendment to prior phase | Track amendment status |
| `closed_by_amendment` | Prior phase completed requested amendment | Resume work |
| `closed_by_decision` | Sponsor decided to proceed/defer/scope-change | Resume or adjust |
| `closed_by_approval` | Roma approved workaround/alternative approach | Resume work |

---

## Log Visibility & Access

- **All robots**: READ access to full activity log (global visibility - P12)
- **Roma**: READ/WRITE access to entire log
- **Individual robot**: WRITE access only to own phase section
- **Gatekeeper**: READ/WRITE access to gate section of log
- **Sponsor**: READ access to activity log (via Roma reports)

---

## Synchronization via Logs (Not Real-Time Chat)

**Key principle:** Activity log is authoritative source of truth, not robot-to-robot chat.

This enables:
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

---

## Example Workflow Trace

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

## Special: Quality Gate Amendments

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

## Summary

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
