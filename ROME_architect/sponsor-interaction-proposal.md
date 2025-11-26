# Sponsor Interaction Framework: Draft Proposal

| Field | Value |
|-------|-------|
| **Document UID** | ROME-REV-005 |
| **Version** | 0.2 |
| **Date** | 2025-11-25T00:00:00Z |
| **Status** | Draft Proposal |
| **Document Type** | Review |
| **Author** | Framework Analyst & Architect |

---

## Purpose

Proposes a comprehensive structure for robot-sponsor interactions within ROME, traced from principle through policy to operational implementation.

---

## Document Hierarchy for Sponsor Interaction

Following ROME-GOV-005 (Document Architecture), sponsor interaction spans all tiers:

```
Tier 0: Foundation
    └── core-principles.md → Principle 11 (Sponsor Interaction) ✓ EXISTS

Tier 1: Governance
    └── sponsor-interaction-policy.md → NEW (ROME-GOV-006)

Tier 2: Life-cycle
    └── Each phase operations-guidelines.md → Phase-specific sponsor touchpoints

Tier 3: Operations
    ├── robot-operations-governance/sponsor-interaction-protocol.md → NEW (ROME-PROC-002)
    └── Each robot CLAUDE.md → Robot-specific interaction rules
```

---

## Proposed Documents

### 1. Sponsor Interaction Policy (ROME-GOV-006)

**Location:** `/ROME/framework-governance/sponsor-interaction-policy.md`

**Purpose:** Defines policies governing all robot-sponsor communication.

**Contents:**

```markdown
## Communication Channels

### Channel Matrix

| Channel | Tool | Purpose | Direction |
|---------|------|---------|-----------|
| **Seez App** | `mcp__Seez__show_doc` | Display status reports, design docs | Robot → Sponsor |
| **Seez App** | `mcp__Seez__ask_questions` | Confirmations, clarifications, approvals | Robot ↔ Sponsor |
| **Terminal Notifier** | AppleScript | Alerts, notifications | Robot → Sponsor |
| **iMessage** | AppleScript | Urgent messages, summaries | Robot → Sponsor |

### Channel Selection Rules

| Interaction Type | Primary Channel | Fallback |
|------------------|-----------------|----------|
| Questions/Confirmations | Seez `ask_questions` | iMessage |
| Status Reports | Seez `show_doc` | iMessage summary |
| Design Documents | Seez `show_doc` | - |
| Approval Requests | Seez `ask_questions` | iMessage + Seez |
| Notifications (info) | Terminal Notifier | - |
| Urgent Escalations | iMessage + Terminal Notifier | - |

### Routing
- Primary: Roma (Orchestrator) coordinates all sponsor communication
- Exception: Direct robot-sponsor for domain-specific clarifications

## Communication Categories

### 1. Progress Reporting
- Phase transition notifications
- Milestone completions
- Daily/weekly summaries (frequency configurable)

### 2. Clarification Requests
- Missing information
- Ambiguous requirements
- Conflicting specifications
- Edge cases

### 3. Approval Requests
- Phase gate approvals
- Amendment approvals
- Design decision approvals
- Scope change approvals

### 4. Escalations
- Blockers unresolvable by robots
- Risk notifications
- Timeline impacts

## Response Requirements
- Sponsor response SLA expectations
- Timeout handling procedures
- Default actions when sponsor unavailable

## Decision Authority Matrix
| Decision Type | Robot Authority | Sponsor Required |
|---------------|-----------------|------------------|
| Formatting choices | Yes | No |
| Minor clarifications | Yes (with logging) | No |
| Design alternatives | Recommend | Yes |
| Scope changes | No | Yes |
| Phase transitions | No | Yes |
| Amendment approval | No | Yes |
```

---

### 2. Sponsor Interaction Protocol (ROME-PROC-002)

**Location:** `/ROME/robot-templates/robot-operations-governance/sponsor-interaction-protocol.md`

**Purpose:** Operational procedures for robot-sponsor communication.

**Contents:**

```markdown
## Interaction Procedures

### Question Design Principles

**MANDATORY: Alternative Answer Option**

ALL questions (radio, checkbox, or structured options) MUST include mechanism for sponsor to provide alternative/custom answer.

**Rationale:** Predefined options may not capture sponsor's actual intent. Sponsors must never be constrained by robot assumptions.

**Implementation:**
- Seez `ask_questions`: "Other" option automatically provided by tool
- Text-based questions: Always include optional textarea for elaboration
- Multiple choice: Include "Other (specify)" as final option

**Examples:**

❌ **Incorrect - No Alternative:**
```javascript
{
  type: "radio",
  label: "Which authentication method?",
  options: [
    { label: "OAuth", description: "..." },
    { label: "JWT", description: "..." }
  ]
}
```

✓ **Correct - Alternative Enabled:**
```javascript
{
  type: "radio",
  label: "Which authentication method?",
  options: [
    { label: "OAuth", description: "..." },
    { label: "JWT", description: "..." }
    // Note: "Other" option automatically added by Seez tool
  ]
}
// Plus separate text field for details:
{
  type: "textarea",
  label: "Additional context or alternative approach",
  required: false
}
```

---

### Initiating Contact

Step 1: Determine interaction type (Progress/Clarification/Approval/Escalation)
Step 2: Check if Roma should mediate (default: yes)
Step 3: Prepare structured request (see templates - follow Question Design Principles)
Step 4: Log interaction initiation in activity log
Step 5: Send request via appropriate channel
Step 6: Await response with timeout handling

### Request Templates

#### Clarification Request
┌─────────────────────────────────────────────┐
│ CLARIFICATION REQUEST                       │
│ From: [Robot Name]                          │
│ Phase: [Current Phase]                      │
│ Feature: [FEAT-###]                         │
│ Priority: [LOW|MEDIUM|HIGH|CRITICAL]        │
├─────────────────────────────────────────────┤
│ Context:                                    │
│ [Brief description of what robot is doing]  │
│                                             │
│ Question:                                   │
│ [Specific question requiring clarification] │
│                                             │
│ Options (if applicable):                    │
│ A) [Option A description]                   │
│ B) [Option B description]                   │
│                                             │
│ Default Action (if no response):            │
│ [What robot will do if sponsor unavailable] │
│                                             │
│ Response Needed By: [Timestamp]             │
└─────────────────────────────────────────────┘

#### Approval Request
┌─────────────────────────────────────────────┐
│ APPROVAL REQUEST                            │
│ Type: [Phase Gate|Amendment|Design|Scope]   │
│ From: [Robot Name]                          │
│ Phase: [Current Phase]                      │
├─────────────────────────────────────────────┤
│ Summary:                                    │
│ [What is being requested for approval]      │
│                                             │
│ Rationale:                                  │
│ [Why this approval is needed]               │
│                                             │
│ Impact:                                     │
│ [Consequences of approval/rejection]        │
│                                             │
│ Recommendation:                             │
│ [Robot's recommended action]                │
│                                             │
│ Approve: [ ]  Reject: [ ]  Defer: [ ]       │
└─────────────────────────────────────────────┘

#### Progress Report
┌─────────────────────────────────────────────┐
│ PROGRESS REPORT                             │
│ Phase: [Current Phase]                      │
│ Period: [From Date] - [To Date]             │
├─────────────────────────────────────────────┤
│ Completed:                                  │
│ - [Item 1]                                  │
│ - [Item 2]                                  │
│                                             │
│ In Progress:                                │
│ - [Item 1] - [% complete]                   │
│                                             │
│ Blocked:                                    │
│ - [Item 1] - [Blocker reason]               │
│                                             │
│ Upcoming:                                   │
│ - [Next items]                              │
│                                             │
│ Risks/Concerns:                             │
│ - [Any items needing attention]             │
└─────────────────────────────────────────────┘

#### Escalation
┌─────────────────────────────────────────────┐
│ ESCALATION                                  │
│ Severity: [LOW|MEDIUM|HIGH|CRITICAL]        │
│ From: [Robot Name]                          │
│ Phase: [Current Phase]                      │
├─────────────────────────────────────────────┤
│ Issue:                                      │
│ [Description of the problem]                │
│                                             │
│ Impact:                                     │
│ [What is blocked or at risk]                │
│                                             │
│ Attempted Resolutions:                      │
│ - [What has been tried]                     │
│                                             │
│ Sponsor Action Required:                    │
│ [Specific action needed from sponsor]       │
│                                             │
│ Urgency: [Response needed by timestamp]     │
└─────────────────────────────────────────────┘

### Response Handling

#### On Sponsor Response
1. Log response in activity log
2. Update relevant entries (blocker resolved, amendment approved, etc.)
3. Resume work based on response
4. Acknowledge receipt to sponsor

#### On Timeout (No Response)
1. Check if default action defined
2. If default exists and non-critical: execute default, log decision
3. If no default or critical: escalate to Roma
4. Roma may re-request or pause work

### Logging Requirements

ALL sponsor interactions MUST be logged:

| Event | Log Entry |
|-------|-----------|
| Request sent | Create/update entry with sponsor_request field |
| Response received | Update entry with sponsor_response field |
| Timeout | Create blocker entry |
| Default action taken | Update entry with notes explaining decision |
```

---

### 3. Phase-Specific Touchpoints

**Location:** Each `/ROME/life-cycle/P##-*/operations-guidelines.md`

**Add section to each phase:**

```markdown
## Sponsor Interaction Points

### Mandatory Touchpoints
| Touchpoint | Type | Trigger |
|------------|------|---------|
| [Phase-specific items] | | |

### Common Clarification Needs
- [Phase-specific clarification examples]

### Phase Exit Approval
- Sponsor approval required: [Yes/No]
- Approval criteria: [What sponsor reviews]
```

#### P01-Ingest Touchpoints
| Touchpoint | Type | Trigger |
|------------|------|---------|
| Input completeness confirmation | Approval | All materials received |
| Missing document request | Clarification | Referenced doc not provided |
| Format clarification | Clarification | Unreadable/ambiguous input |

#### P02-Analysis Touchpoints
| Touchpoint | Type | Trigger |
|------------|------|---------|
| Ambiguous requirement | Clarification | Multiple interpretations possible |
| Conflicting requirements | Escalation | Requirements contradict |
| Scope confirmation | Approval | Feature boundaries unclear |
| Analysis complete | Progress | Phase ready for transition |

#### P03-Design Touchpoints
| Touchpoint | Type | Trigger |
|------------|------|---------|
| Architecture decision | Approval | Multiple valid approaches |
| Technology choice | Approval | Stack selection needed |
| Design review | Progress | Major component designed |
| Quality gate | Approval | Sarah's review complete |

#### P04-Config Touchpoints
| Touchpoint | Type | Trigger |
|------------|------|---------|
| Environment specification | Clarification | Deployment target unclear |
| Dependency approval | Approval | External library selection |
| Config review | Progress | Ready for generation |

#### P05-Generation Touchpoints
| Touchpoint | Type | Trigger |
|------------|------|---------|
| Implementation choice | Clarification | Multiple valid implementations |
| Test coverage | Progress | Tests passing/failing report |
| Generation complete | Progress | Code ready for review |
| Final delivery | Approval | Application ready for handoff |

---

### 4. Robot CLAUDE.md Updates

**Add to each robot's Governance Requirements section:**

```markdown
### Sponsor Interaction

This robot MUST comply with the Sponsor Interaction Protocol:
- **ROME-PROC-002**: `/ROME/robot-templates/robot-operations-governance/sponsor-interaction-protocol.md`

**Robot-Specific Rules:**
- [Robot-specific interaction permissions]
- [When to contact sponsor directly vs via Roma]
- [Domain-specific clarification authority]
```

#### Roma (Orchestrator) - Special Role
```markdown
### Sponsor Interaction

As Orchestrator, Roma is the PRIMARY sponsor communication channel.

Responsibilities:
- Route all sponsor requests appropriately
- Aggregate progress reports from robots
- Manage approval workflows
- Handle escalations from other robots
- Track sponsor response times
- Maintain sponsor interaction log

Authority:
- May contact sponsor directly for any interaction type
- May delegate specific clarifications to domain robots
- Controls phase gate approval requests
```

#### Other Robots
```markdown
### Sponsor Interaction

Default: Route through Roma (Orchestrator)

Direct sponsor contact permitted for:
- [Robot-specific exceptions, e.g., Talib for requirement clarifications]

Must route through Roma:
- Phase transition requests
- Scope changes
- Escalations
```

---

## Implementation Examples

### Example 1: Clarification During Analysis (Seez)

**Scenario:** Talib encounters ambiguous requirement in PRD.

**Tool Call:**
```javascript
mcp__Seez__ask_questions({
  label: "Requirement Clarification",
  title: "Authentication Requirements - FEAT-003",
  description: "Analyzing user authentication. PRD states 'secure login' but doesn't specify MFA requirements.",
  questions: [
    {
      id: "mfa_requirement",
      type: "radio",
      label: "What level of authentication is required?",
      required: true,
      options: [
        { label: "Password only", description: "Standard username/password authentication" },
        { label: "Optional MFA", description: "Users can enable MFA if desired" },
        { label: "Mandatory MFA", description: "All users must use MFA" }
        // Note: "Other" option automatically provided by Seez tool
      ]
    },
    {
      id: "additional_context",
      type: "textarea",
      label: "Additional authentication requirements or alternative approach",
      required: false,
      placeholder: "e.g., specific MFA methods, SSO integration, biometrics..."
    }
  ],
  submitLabel: "Confirm Requirement"
})
```

**Flow:**
```
1. Talib identifies ambiguity in FEAT-003
2. Talib logs: BLOCK-007 created, FEAT-003-api status → BLOCKED
3. Talib calls mcp__Seez__ask_questions (above)
4. Seez displays form to sponsor, waits for response
5. Sponsor selects "Optional MFA", clicks Confirm
6. Tool returns: { "mfa_requirement": "Optional MFA" }
7. Talib updates: BLOCK-007 → RESOLVED, FEAT-003-api → IN_PROGRESS
8. Talib continues analysis with clarified requirement
```

### Example 2: Phase Gate Approval (Seez + Notification)

**Scenario:** P03-Design complete, Sarah's quality gate passed.

**Step 1: Display Design Summary (Seez show_doc)**
```javascript
mcp__Seez__show_doc({
  label: "Design Phase Summary",
  content: `# Phase 3 Design - Exit Summary

## Exit Criteria Status
| Criteria | Status |
|----------|--------|
| All requirements addressed | ✓ PASS |
| Architecture validated | ✓ PASS |
| Interface contracts defined | ✓ PASS |
| Sarah's quality gate | ✓ PASS |

## Design Artifacts Produced
- System architecture diagram
- Data model specification
- API contract definitions
- UI component hierarchy

## Quality Gate Notes
Sarah's review completed 2025-11-21. No blocking issues found.
`
})
```

**Step 2: Send Notification (Terminal Notifier)**
```bash
osascript -e 'display notification "Design phase complete. Approval needed for Config phase." with title "ROME: Phase Gate" sound name "Glass"'
```

**Step 3: Request Approval (Seez ask_questions)**
```javascript
mcp__Seez__ask_questions({
  label: "Phase Gate Approval",
  title: "Design → Config Transition",
  description: "Design phase complete. Review summary tab and approve transition to Config phase.",
  questions: [
    {
      id: "phase_approval",
      type: "radio",
      label: "Approve transition to Configuration phase?",
      required: true,
      options: [
        { label: "Approve", description: "Proceed to Config phase" },
        { label: "Reject", description: "Return to Design with feedback" },
        { label: "Defer", description: "Need more time to review" }
      ]
    },
    {
      id: "feedback",
      type: "textarea",
      label: "Feedback (optional)",
      required: false,
      placeholder: "Any comments or concerns..."
    }
  ],
  submitLabel: "Submit Decision"
})
```

**Flow:**
```
1. Sarah completes quality gate review
2. Sarah logs: PHASE-2b status → COMPLETED
3. Roma calls mcp__Seez__show_doc (design summary)
4. Roma sends Terminal Notifier alert
5. Roma calls mcp__Seez__ask_questions (approval)
6. Sponsor reviews summary tab, selects "Approve"
7. Tool returns: { "phase_approval": "Approve", "feedback": "" }
8. Roma logs: PHASE-3 status → IN_PROGRESS
9. Roma notifies Config robots (Charlie, Reena, Ashok)
10. Config phase begins
```

### Example 3: Escalation (iMessage + Seez)

**Scenario:** Charlie discovers config requires paid API key not provided.

**Step 1: Send Urgent iMessage**
```bash
osascript -e 'tell application "Messages" to send "🚨 ROME ESCALATION: Config blocked - Stripe API key required for payment module. Please check Seez for details." to buddy "sponsor@email.com"'
```

**Step 2: Send Terminal Notification**
```bash
osascript -e 'display notification "CRITICAL: Config phase blocked. Sponsor action required." with title "ROME: Escalation" sound name "Basso"'
```

**Step 3: Display Details + Request Action (Seez)**
```javascript
mcp__Seez__ask_questions({
  label: "ESCALATION: Missing API Key",
  title: "Config Blocked - Stripe API Key Required",
  description: `**Severity:** CRITICAL
**Phase:** P04-Config
**Feature:** FEAT-007 (Checkout)
**Robot:** Charlie

**Issue:** Payment processing requires Stripe API key. No API key found in project inputs.

**Impact:** Cannot configure payment module. Checkout feature blocked.

**Attempted:** Checked all input documents, searched for alternatives (none suitable).`,
  questions: [
    {
      id: "resolution",
      type: "radio",
      label: "How should we proceed?",
      required: true,
      options: [
        { label: "Provide Stripe key", description: "I'll provide API keys below" },
        { label: "Use different provider", description: "Switch to alternative payment provider" },
        { label: "Defer feature", description: "Skip payment for now, add later" }
        // Note: "Other" option automatically provided by Seez tool
      ]
    },
    {
      id: "stripe_test_key",
      type: "text",
      label: "Stripe Test API Key (if providing)",
      required: false,
      placeholder: "sk_test_..."
    },
    {
      id: "notes",
      type: "textarea",
      label: "Additional notes or alternative resolution approach",
      required: false,
      placeholder: "e.g., prod key will follow, alternative provider preference, different approach entirely..."
    }
  ],
  submitLabel: "Resolve Escalation",
  playSound: true
})
```

**Flow:**
```
1. Charlie identifies external dependency
2. Charlie logs: BLOCK-012 created (CRITICAL)
3. Charlie escalates to Roma
4. Roma sends iMessage (urgent notification)
5. Roma sends Terminal Notifier (sound alert)
6. Roma calls mcp__Seez__ask_questions (details + resolution)
7. Sponsor sees iMessage, opens Seez
8. Sponsor selects "Provide Stripe key", enters test key
9. Tool returns: { "resolution": "Provide Stripe key", "stripe_test_key": "sk_test_xxx", "notes": "Prod key next week" }
10. Roma logs resolution, forwards to Charlie
11. Charlie updates: BLOCK-012 → RESOLVED
12. Charlie continues configuration with provided key
```

### Example 4: Progress Report (Seez show_doc)

**Scenario:** End of day progress update from Roma.

**Tool Call:**
```javascript
mcp__Seez__show_doc({
  label: "Daily Progress Report",
  content: `# ROME Progress Report
**Date:** 2025-11-21
**Phase:** P02-Analysis

## Summary
Analysis phase progressing well. 3 of 5 features analyzed.

## Completed Today
| Item | Robot | Status |
|------|-------|--------|
| FEAT-001 User Auth | Talib | ✓ COMPLETED |
| FEAT-002 Profile Mgmt | Talib | ✓ COMPLETED |

## In Progress
| Item | Robot | Progress |
|------|-------|----------|
| FEAT-003 Dashboard | Talib | 60% |

## Blocked
| Item | Blocker | Waiting On |
|------|---------|------------|
| FEAT-004 Reporting | BLOCK-003 | Sponsor clarification |

## Upcoming
- FEAT-005 Settings (pending FEAT-003 completion)

## Risks/Concerns
- BLOCK-003 aging 2 days - sponsor response needed
`
})
```

**Notification:**
```bash
osascript -e 'display notification "Daily progress report available in Seez." with title "ROME: Progress Update" sound name "Glass"'
```

---

## Activity Log Integration

### New Fields for Sponsor Interactions

Extend activity-log entries:

```json
{
  "id": "FEAT-003-api",
  "sponsor_interactions": [
    {
      "type": "clarification",
      "request_date": "2025-11-21T10:00:00Z",
      "request_summary": "MFA requirement clarification",
      "response_date": "2025-11-21T14:30:00Z",
      "response_summary": "Optional MFA selected",
      "requesting_robot": "talib",
      "blocker_id": "BLOCK-007"
    }
  ]
}
```

### Reporting Queries

```
# Find all pending sponsor requests
mcp__activity-log__list_all_entries(
  status: "BLOCKED"
) → filter where blocker requires sponsor

# Find average sponsor response time
Aggregate sponsor_interactions.response_date - request_date

# Find entries awaiting approval
mcp__activity-log__list_all_entries(
  type: "amendment",
  status: "PENDING_REVIEW"
)
```

---

## Summary: Documents to Create

| Priority | Document | UID | Location |
|----------|----------|-----|----------|
| 1 | Sponsor Interaction Policy | ROME-GOV-006 | `/ROME/framework-governance/` |
| 2 | Sponsor Interaction Protocol | ROME-PROC-002 | `/ROME/robot-templates/robot-operations-governance/` |
| 3 | Phase touchpoints | - | Update each `operations-guidelines.md` |
| 4 | Robot interaction rules | - | Update each robot `CLAUDE.md` |

---

## Questions for Sponsor

Before finalizing:

1. **Communication frequency:** How often do you want progress reports? (Daily/Weekly/Phase completion only)
2. **Response SLA:** What's a reasonable expected response time for clarifications?
3. **Default actions:** Are you comfortable with robots taking default actions on timeout for non-critical items?
4. **Direct contact:** Which robots (if any) should contact you directly vs. always via Roma?
5. **Approval granularity:** Do you want to approve every phase gate, or only critical ones?

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 0.2 | 2025-11-25T00:00:00Z | Added Question Design Principles - mandatory alternative answer option |
| 0.1 | 2025-11-21T00:00:00Z | Initial draft proposal |
