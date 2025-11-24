# Cross-Phase Procedure: Activity Logging Protocol

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROC-005 |
| **Version** | 0.1 |
| **Date** | 2025-11-21T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Procedure |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines mandatory procedures for robots to record activity status in a timely and consistent manner. Ensures accurate project state visibility, enables effective robot coordination, and maintains traceability as required by ROME-PRIN-001 Principle 2.

## Scope

Applies to all robots during all phases when:
- Work items are assigned, started, or completed
- Status transitions occur (PENDING → IN_PROGRESS → COMPLETED/BLOCKED)
- Blockers are encountered or resolved
- Amendments are requested or decided
- Phase transitions occur

## Dependencies

- ROME-PRIN-001 (Core Principles) - Principle 2: Traceability, Principle 5: Central Orchestration
- ROME-PROC-002 (Sponsor Interaction) - Logging of sponsor interactions
- ROME-LEX-001 (Lexicon) - Activity tracking terminology
- Activity tracking system (git-based or MongoDB-based per project configuration)

---

## Logging Trigger Points

### Mandatory Logging Events

| Event | Action Required | Timing | Responsible Robot |
|-------|-----------------|--------|-------------------|
| Work assigned | Create/claim entry | Before starting work | Assigned robot |
| Start work | Status → IN_PROGRESS | Same turn as work begins | Assigned robot |
| Progress update | Update lastUpdate timestamp | Daily or at milestones | Assigned robot |
| Blocker encountered | Create blocker + Status → BLOCKED | Immediately upon discovery | Assigned robot |
| Blocker resolved | Resolve blocker + Status → IN_PROGRESS | Immediately upon resolution | Assigned robot |
| Work completed | Status → COMPLETED | After verification, same turn | Assigned robot |
| Amendment requested | Create amendment entry | Before seeking approval | Requesting robot |
| Amendment decided | Update amendment status | Immediately upon decision | Roma (Orchestrator) |
| Phase transition | Phase entry → COMPLETED | After exit criteria verified | Roma (Orchestrator) |

### Timing Requirements

**Immediate Logging (Same Conversation Turn):**
- Status transitions (any)
- Blocker creation
- Amendment requests
- Phase completions

**Pre-Action Logging (Before Starting):**
- Work item creation (before implementation begins)
- Work claim (before starting assigned work)

**Post-Action Logging (After Verification):**
- Work completion (after verification confirms success)

---

## Entry Lifecycle

### Work Item (Feature/Story) Lifecycle

```
    ┌──────────────────────────────────────────────────────────┐
    │                                                          │
    │   ┌─────────┐    Claim    ┌─────────────┐               │
    │   │ PENDING │ ──────────► │ IN_PROGRESS │               │
    │   └─────────┘             └─────────────┘               │
    │        │                        │    │                   │
    │        │                        │    │ Blocker           │
    │        │                        │    │ Found             │
    │        │                        │    ▼                   │
    │        │                        │  ┌─────────┐          │
    │        │                        │  │ BLOCKED │          │
    │        │                        │  └─────────┘          │
    │        │                        │    │                   │
    │        │                        │    │ Blocker           │
    │        │                        │    │ Resolved          │
    │        │                        │    │                   │
    │        │                        ◄────┘                   │
    │        │                        │                        │
    │        │                        │ Verified               │
    │        │                        │ Complete               │
    │        │                        ▼                        │
    │        │                  ┌───────────┐                  │
    │        └─────────────────►│ COMPLETED │                  │
    │           (if deferred)   └───────────┘                  │
    │                                                          │
    └──────────────────────────────────────────────────────────┘
```

### Required Logging at Each Transition

| Transition | Required Log Fields |
|------------|---------------------|
| → PENDING | id, type, feature/story name, phase, layer, robot (assigned) |
| PENDING → IN_PROGRESS | status, startDate, robot (confirming) |
| IN_PROGRESS → BLOCKED | status, blocker (reference), lastUpdate |
| BLOCKED → IN_PROGRESS | status, lastUpdate, notes (resolution summary) |
| IN_PROGRESS → COMPLETED | status, completionDate, lastUpdate |

---

## Logging Procedures by Entry Type

### 1. Feature Entry Logging

**Creation (Before Implementation):**
```
Required fields:
- id: FEAT-###-[layer] or FEAT-###
- type: "feature"
- feature: FEAT-### (parent ID)
- featureName: Human-readable description
- phase: Current phase (P0-P5)
- layer: database | backend | frontend (if layer-specific)
- robot: Assigned robot
- status: PENDING
```

**Status Update (Start Work):**
```
Update fields:
- status: IN_PROGRESS
- startDate: ISO 8601 timestamp
- lastUpdate: ISO 8601 timestamp
```

**Status Update (Completion):**
```
Update fields:
- status: COMPLETED
- completionDate: ISO 8601 timestamp
- lastUpdate: ISO 8601 timestamp
```

---

### 2. Story Entry Logging

**Creation (Before Implementation):**
```
Required fields:
- id: STORY-###-#-#-[layer] or STORY-###
- type: "story"
- feature: Parent feature ID (FEAT-###)
- story: Story ID (STORY-###-#-#)
- storyName: User story description
- phase: Current phase
- layer: database | backend | frontend
- robot: Assigned robot
- status: PENDING
```

**Status transitions follow same pattern as Feature.**

---

### 3. Blocker Entry Logging

**Creation (Immediately Upon Discovery):**
```
Required fields:
- id: BLOCK-###
- type: "blocker"
- severity: CRITICAL | HIGH | MEDIUM | LOW
- feature: Related feature ID (if applicable)
- story: Related story ID (if applicable)
- description: What is blocked and why
- robot: Robot reporting blocker
- status: OPEN
- createdDate: ISO 8601 timestamp
```

**Resolution:**
```
Update fields:
- status: RESOLVED
- resolvedDate: ISO 8601 timestamp
- notes: Resolution summary (optional but recommended)
```

**Escalation:**
```
Update fields:
- status: ESCALATED
- lastUpdate: ISO 8601 timestamp
- notes: Escalation reason and target
```

---

### 4. Amendment Entry Logging

**Creation (Before Requesting Approval):**
```
Required fields:
- id: AMEND-### or AMD-###
- type: "amendment"
- severity: CRITICAL | HIGH | MEDIUM | LOW
- feature: Related feature ID
- story: Related story ID (if applicable)
- description: What needs to change and why
- requestedBy: Robot requesting amendment
- targetPhase: Phase whose work needs amendment
- status: PENDING_REVIEW
- createdDate: ISO 8601 timestamp
```

**Decision:**
```
Update fields:
- status: APPROVED | REJECTED
- decision: APPROVED | REJECTED
- decidedDate: ISO 8601 timestamp
- notes: Decision rationale (if rejected)
```

---

### 5. Phase Entry Logging

**Phase Start:**
```
Required fields:
- id: PHASE-P# (e.g., PHASE-P2)
- type: "phase"
- phase: P0 | P1 | P2 | P3 | P4 | P5
- phaseName: Human-readable name
- robot: Lead robot for phase
- status: IN_PROGRESS
- startDate: ISO 8601 timestamp
```

**Phase Completion:**
```
Update fields:
- status: COMPLETED
- completionDate: ISO 8601 timestamp
- gateDecision: APPROVED (if quality gate passed)
- notes: Phase summary (optional)
```

---

## Enforcement Mechanisms

### Layer 1: Robot Training (CLAUDE.md)

Each robot's CLAUDE.md **MUST** include the Activity Logging Protocol section:

```markdown
## Activity Logging Protocol (MANDATORY)

You MUST log activity at these trigger points:

### Before Starting Work
1. Verify entry exists for assigned work item
2. If not exists: Create entry with status PENDING
3. Update status to IN_PROGRESS
4. Verify log update successful
5. THEN begin implementation

### During Work
- Log progress updates at significant milestones
- If blocker encountered:
  1. Create blocker entry IMMEDIATELY
  2. Update work item status to BLOCKED
  3. Report to orchestrator

### After Completing Work
1. Verify implementation complete
2. Update status to COMPLETED
3. Verify log update successful
4. THEN report completion

### Logging Verification
After EVERY log update, verify success:
- Git-based: Check `git log -1` shows your commit
- MongoDB: Query entry to confirm update

### Non-Compliance
Failure to log may result in:
- Duplicate work assignment
- Phase transition blocked
- Quality gate failure
- Orchestrator escalation
```

---

### Layer 2: Workflow Integration

Logging is embedded in workflow steps, not optional:

```markdown
## Standard Work Execution Workflow

### Step 1: Claim Work
□ Query assigned work items
□ Select item to work on
□ **LOG: Update status → IN_PROGRESS** ← CHECKPOINT
□ Verify log confirmed
□ Proceed to Step 2

### Step 2: Implementation
□ Read specifications
□ Implement solution
□ If blocked:
  □ **LOG: Create blocker** ← CHECKPOINT
  □ **LOG: Status → BLOCKED** ← CHECKPOINT
  □ Escalate and wait
□ Proceed to Step 3

### Step 3: Verification
□ Test implementation
□ Verify requirements met
□ **LOG: Status → COMPLETED** ← CHECKPOINT
□ Verify log confirmed
□ Report completion

### Checkpoint Rule
DO NOT proceed past a CHECKPOINT until logging is confirmed.
```

---

### Layer 3: Orchestrator Monitoring (Roma)

Roma enforces logging compliance through audits:

#### Stale Entry Detection

```markdown
## Roma: Logging Compliance Audit

### Trigger: Before Every Phase Transition

1. Query all IN_PROGRESS entries for current phase
2. For each entry, validate:
   - lastUpdate within 24 hours (configurable threshold)
   - Assigned robot is currently active
   - No orphaned entries (robot completed but entry still IN_PROGRESS)

3. Query all BLOCKED entries:
   - Verify blocker entry exists
   - Check blocker status (OPEN vs RESOLVED mismatch)

4. Generate compliance report:
   - Stale entries (no update > threshold)
   - Orphaned entries (status mismatch)
   - Missing entries (robot reported work, no entry)
   - Unresolved blockers
```

#### Compliance Report Format

```markdown
## Activity Log Compliance Report
**Phase:** P3 (Design)
**Generated:** 2025-11-21T18:00:00Z
**Auditor:** Roma

### Summary
- Total entries: 45
- Compliant: 42
- Issues found: 3

### Issues

#### Stale Entries (no update > 24h)
| Entry ID | Robot | Last Update | Status |
|----------|-------|-------------|--------|
| STORY-003-1-2-api | charlie | 2025-11-19T10:00:00Z | IN_PROGRESS |

**Action Required:** charlie must update status or explain delay

#### Status Mismatch
| Entry ID | Logged Status | Expected | Reason |
|----------|---------------|----------|--------|
| STORY-002-1-1-db | IN_PROGRESS | COMPLETED | Robot reported completion in commit |

**Action Required:** Update entry to COMPLETED

#### Unresolved Blockers
| Blocker ID | Related Entry | Created | Status |
|------------|---------------|---------|--------|
| BLOCK-003 | FEAT-002 | 2025-11-20T09:00:00Z | OPEN |

**Action Required:** Resolve or escalate blocker

### Compliance Decision
- [ ] PASS - Phase transition approved
- [x] BLOCKED - Issues must be resolved before transition
```

---

### Layer 4: Quality Gate Integration

Phase transitions require logging completeness:

```markdown
## Phase Exit Criteria: Activity Log Completeness

### Mandatory Checks Before Phase Transition

1. **Work Item Completeness**
   □ All features for this phase have entries
   □ All stories for completed features are COMPLETED or explicitly deferred
   □ No IN_PROGRESS entries without recent updates (< 24h threshold)
   □ No orphaned entries

2. **Blocker Resolution**
   □ All blockers for this phase are RESOLVED or ESCALATED
   □ Escalated blockers have documented decisions
   □ No OPEN blockers blocking phase transition

3. **Amendment Disposition**
   □ All amendments for this phase are APPROVED or REJECTED
   □ No PENDING_REVIEW amendments
   □ Approved amendments implemented or deferred with justification

4. **Timestamp Integrity**
   □ All COMPLETED entries have completionDate
   □ All entries have lastUpdate timestamp
   □ Timestamps within expected phase timeframe

### Gate Decision
| Check | Status | Blocking? |
|-------|--------|-----------|
| Work Item Completeness | PASS/FAIL | Yes |
| Blocker Resolution | PASS/FAIL | Yes |
| Amendment Disposition | PASS/FAIL | Yes |
| Timestamp Integrity | PASS/FAIL | No (warning) |

**Phase Transition:** APPROVED only if all blocking checks PASS
```

---

### Layer 5: Git Commit Enforcement (Git-Based Tracking)

For projects using git-based activity tracking (ROME-REV-002):

#### Commit Message Hook

```bash
#!/bin/bash
# .git/hooks/commit-msg
# Validates commit message format for activity logging

MSG=$(cat "$1")

# ROME commit format validation
VALID_PHASES="P0|P1|P2|P3|P4|P5"
VALID_ROBOTS="BOOTSTRAP|ROMA|TALIB|PMA|CLARA|SARAH|CHARLIE|REENA"
VALID_ACTIONS="ADD|UPDATE|COMPLETE|BLOCK|RESOLVE|APPROVE|AMEND|TRANSITION|REQUEST"

if ! echo "$MSG" | grep -qE "^\[($VALID_PHASES)\] \[($VALID_ROBOTS)\] \[($VALID_ACTIONS)\]"; then
  echo "ERROR: Commit message must follow ROME activity logging format"
  echo ""
  echo "Format: [P#] [ROBOT] [ACTION] [ITEM-ID]: Description"
  echo ""
  echo "Example: [P3] [CHARLIE] UPDATE STORY-001: Started JWT implementation"
  echo ""
  exit 1
fi

exit 0
```

#### Pre-Commit Validation

```bash
#!/bin/bash
# .git/hooks/pre-commit
# Warns if code committed without activity log update

# Check if SOURCE files are being committed
if git diff --cached --name-only | grep -qE "^SOURCE/"; then
  # Check for recent activity log update
  LAST_LOG=$(git log -1 --format="%H" -- "ARTIFACTS/reference/activity-log/")
  LAST_CODE=$(git log -1 --format="%H" -- "SOURCE/")

  if [ "$LAST_LOG" != "$LAST_CODE" ]; then
    echo "WARNING: Code change detected without recent activity log update"
    echo ""
    echo "Ensure you have logged your status in:"
    echo "  ARTIFACTS/reference/activity-log/stories.md"
    echo ""
    echo "To proceed anyway: git commit --no-verify"
    # Uncomment to enforce:
    # exit 1
  fi
fi

exit 0
```

---

## Logging Format by System

### Git-Based Activity Tracking

**Commit Message Format:**
```
[P#] [ROBOT] [ACTION] [ITEM-ID]: Brief description

Extended description:
- What changed
- Why it changed
- Impact/dependencies

Refs: #related-item-ids
```

**File Updates:**
- Update `ARTIFACTS/reference/activity-log/features.md` (table + detail)
- Update `ARTIFACTS/reference/activity-log/stories.md` (table + detail)
- Update `ARTIFACTS/reference/activity-log/blockers.md` (if blocker)
- Commit with structured message

**Example:**
```bash
git add ARTIFACTS/reference/activity-log/stories.md
git commit -m "[P4] [CHARLIE] UPDATE STORY-001-1-1: JWT implementation started

Status changed: PENDING → IN_PROGRESS
Implementation approach: jsonwebtoken@9.0.2 library
Estimated completion: 2025-11-22

Refs: FEAT-001"
```

---

### MongoDB-Based Activity Tracking

**MCP Tool Usage:**

**Update Status:**
```
mcp__activity-log__update_entry({
  "id": "STORY-001-1-1-api",
  "updates": {
    "status": "IN_PROGRESS",
    "startDate": "2025-11-21T10:00:00Z",
    "lastUpdate": "2025-11-21T10:00:00Z",
    "notes": "Starting JWT implementation"
  }
})
```

**Create Blocker:**
```
mcp__activity-log__add_entry({
  "entry": {
    "id": "BLOCK-001",
    "type": "blocker",
    "severity": "HIGH",
    "feature": "FEAT-001",
    "story": "STORY-001-1-1",
    "description": "JWT library incompatible with Node 18",
    "robot": "charlie",
    "status": "OPEN",
    "createdDate": "2025-11-21T11:00:00Z"
  }
})
```

**Verify Update:**
```
mcp__activity-log__find_by_id({
  "id": "STORY-001-1-1-api"
})
```

---

## Error Handling

### Logging Failure Recovery

If logging fails (git commit rejected, MongoDB unavailable):

1. **Retry:** Attempt logging operation again
2. **Buffer:** Record intended log entry locally
3. **Report:** Notify orchestrator of logging failure
4. **Resume:** Continue logging when system available
5. **Reconcile:** Apply buffered entries when recovered

### Stale Entry Resolution

If entry found stale during audit:

1. **Identify:** Roma flags stale entry in compliance report
2. **Notify:** Assigned robot notified of stale entry
3. **Update:** Robot must update entry within [threshold] time
4. **Escalate:** If not updated, escalate to orchestrator
5. **Override:** Roma may update entry based on evidence (commits, reports)

### Missing Entry Creation

If work performed without entry:

1. **Detect:** Roma identifies work (commit, report) without corresponding entry
2. **Flag:** Issue logged in compliance report
3. **Create:** Responsible robot must create entry retroactively
4. **Backdate:** Entry created with accurate timestamps (based on evidence)
5. **Note:** Entry marked with "retroactive" flag in notes

---

## Best Practices

### Do

- Log status changes immediately, within the same conversation turn
- Verify logging success before proceeding with work
- Include meaningful notes explaining status/decisions
- Reference related items (parent feature, blocked story, etc.)
- Use consistent timestamps (ISO 8601)
- Update progress regularly during long-running tasks

### Don't

- Delay logging until end of session
- Assume logging succeeded without verification
- Leave entries in IN_PROGRESS when blocked
- Create blocker entries after attempting workarounds (create immediately)
- Forget to resolve blockers when issue fixed
- Skip logging for "small" tasks

### Logging Frequency Guidelines

| Task Duration | Recommended Update Frequency |
|---------------|------------------------------|
| < 1 hour | Start and completion only |
| 1-4 hours | Start, midpoint, completion |
| 4-8 hours | Every 2 hours |
| > 8 hours | Every 4 hours or at milestones |

---

## Compliance Metrics

### Key Performance Indicators

| Metric | Target | Measurement |
|--------|--------|-------------|
| Logging Timeliness | < 5 min delay | Time between event and log entry |
| Entry Completeness | 100% | Required fields populated |
| Stale Entry Rate | < 5% | Entries > 24h without update |
| Orphan Entry Rate | 0% | Status mismatches |
| Blocker Resolution Time | Logged | Time from OPEN to RESOLVED |

### Audit Schedule

| Audit Type | Frequency | Performed By |
|------------|-----------|--------------|
| Stale entry check | Daily | Roma (automated) |
| Compliance report | Phase transitions | Roma |
| Full audit | Monthly | Framework Analyst & Architect |

---

## Integration with Other Procedures

### ROME-PROC-002 (Sponsor Interaction)

Sponsor interactions logged as:
- Entry type: Recommend dedicated `sponsor_interaction` type or use notes field
- ID format: SI-[PHASE]-### (e.g., SI-DESIGN-001)
- Cross-reference in affected feature/story entries

### ROME-PROC-003 (Error Recovery)

When recovering from errors:
- Create blocker entry documenting error
- Update affected entries to BLOCKED
- Log recovery steps in notes
- Resolve blocker when recovered

### Phase Operations Guidelines

Each phase's operations-guidelines.md should reference this procedure and include phase-specific logging requirements.

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.1 | 2025-11-21T00:00:00Z | Initial draft |
