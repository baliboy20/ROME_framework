# Robot Operations Governance: Sponsor Interaction Protocol

| Field | Value |
|-------|-------|
| **Document UID** | ROME-PROC-002 |
| **Version** | 1.0 |
| **Date** | 2025-11-21T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Procedure |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines operational procedures for robot-sponsor communication. Provides step-by-step interaction flows, tool usage patterns, templates, and timeout handling.

## Scope

Applies to ALL robots during ALL phases. This protocol is NON-OPTIONAL.

## Dependencies

- ROME-GOV-006 (Sponsor Interaction Policy) - Policy definitions
- ROME-CFG-001 (Sponsor Interaction Config) - Channel and contact configuration
- ROME-PROC-005 (Activity Logging Protocol) - Logging requirements
- ROME-PRIN-001 (Core Principles) - Principle 11: Sponsor Interaction

---

## Communication Tools

Tool definitions, contact details, and timing values are configured in:
- **ROME-CFG-001**: `/ROME/framework-governance/sponsor-interaction-config.md`

### Quick Reference

| Tool | Usage |
|------|-------|
| `mcp__Seez__show_doc` | Display markdown documents |
| `mcp__Seez__ask_questions` | Interactive forms for sponsor input |
| `mcp__Seez__show_chart` | Display Mermaid diagrams |
| Terminal Notifier | AppleScript notifications |
| iMessage | AppleScript messaging (recipient in config) |

See ROME-CFG-001 for full command syntax and configuration values.

---

## Interaction Procedures

### Procedure 1: Clarification Request

**When:** Robot encounters ambiguity or missing information

**Steps:**

```
1. Log blocker entry
   → mcp__activity-log__add_entry (BLOCK-###, status: OPEN)
   → Update affected entry status → BLOCKED

2. Prepare and send Seez question
   → mcp__Seez__ask_questions (see template below)

3. Wait for response (blocking call)
   → Tool returns when sponsor submits

4. If timeout (10 minutes):
   → Send iMessage reminder
   → Continue waiting or proceed with other work

5. On response:
   → Log response in activity system
   → Resolve blocker (BLOCK-### → RESOLVED)
   → Update affected entry (BLOCKED → IN_PROGRESS)
   → Continue work with clarified information
```

**Seez Template:**
```javascript
mcp__Seez__ask_questions({
  label: "Clarification: [TOPIC]",
  title: "[Specific Question Title]",
  description: "[Context explaining what robot is doing and why clarification needed]",
  questions: [
    {
      id: "clarification",
      type: "radio",  // or "text" for open-ended
      label: "[The specific question]",
      required: true,
      options: [
        { label: "[Option A]", description: "[What this means]" },
        { label: "[Option B]", description: "[What this means]" }
      ]
    }
  ],
  submitLabel: "Confirm"
})
```

---

### Procedure 2: Approval Request

**When:** Decision requires sponsor authorization (phase gate, amendment, design choice)

**Steps:**

```
1. Prepare supporting documentation
   → mcp__Seez__show_doc (summary, artifacts, rationale)

2. Send notification
   → Terminal Notifier: "[Type] approval needed"

3. Send approval request
   → mcp__Seez__ask_questions (approval form)

4. Wait for response

5. If timeout (10 minutes):
   → Send iMessage: "ROME awaiting approval: [summary]. Please check Seez."

6. On response:
   → Log decision in activity system
   → If APPROVED: proceed with action
   → If REJECTED: log feedback, adjust approach
   → If DEFERRED: log, continue other work
```

**Seez Template - Phase Gate:**
```javascript
// Step 1: Show summary
mcp__Seez__show_doc({
  label: "[Phase] Exit Summary",
  content: `# [Phase Name] - Exit Summary

## Exit Criteria Status
| Criteria | Status |
|----------|--------|
| [Criterion 1] | ✓ PASS |
| [Criterion 2] | ✓ PASS |

## Artifacts Produced
- [Artifact 1]
- [Artifact 2]

## Notes
[Any relevant notes]
`
})

// Step 2: Request approval
mcp__Seez__ask_questions({
  label: "Phase Gate Approval",
  title: "[Current Phase] → [Next Phase]",
  description: "Review summary tab. Approve transition to next phase.",
  questions: [
    {
      id: "approval",
      type: "radio",
      label: "Approve phase transition?",
      required: true,
      options: [
        { label: "Approve", description: "Proceed to next phase" },
        { label: "Reject", description: "Return with feedback" },
        { label: "Defer", description: "Need more time to review" }
      ]
    },
    {
      id: "feedback",
      type: "textarea",
      label: "Feedback (optional)",
      required: false
    }
  ],
  submitLabel: "Submit Decision"
})
```

---

### Procedure 3: Progress Report

**When:** Feature completed, phase completed, significant milestone

**Steps:**

```
1. Generate report content
   → Query activity log for status
   → Compile completed/in-progress/blocked items

2. Display report
   → mcp__Seez__show_doc (progress report)

3. Send notification
   → Terminal Notifier: "[Event] - Progress report available"
```

**Seez Template:**
```javascript
mcp__Seez__show_doc({
  label: "Progress Report",
  content: `# ROME Progress Report
**Date:** [ISO DATE]
**Phase:** [Current Phase]

## Summary
[Brief summary of progress]

## Completed
| Item | Robot | Status |
|------|-------|--------|
| [FEAT-###] [Name] | [Robot] | ✓ COMPLETED |

## In Progress
| Item | Robot | Progress |
|------|-------|----------|
| [FEAT-###] [Name] | [Robot] | [X]% |

## Blocked
| Item | Blocker | Waiting On |
|------|---------|------------|
| [FEAT-###] | [BLOCK-###] | [Reason] |

## Upcoming
- [Next items]

## Risks/Concerns
- [Any items needing attention]
`
})
```

**Notification:**
```bash
terminal-notifier -title "ROME: Progress Update" -message "[Feature/Phase] completed. Report available in Seez." -sound Ping
```

---

### Procedure 4: Escalation

**When:** Critical blocker requiring urgent sponsor action

**Steps:**

```
1. Log critical blocker
   → mcp__activity-log__add_entry (BLOCK-###, severity: CRITICAL)

2. Send IMMEDIATE iMessage
   → "🚨 ROME ESCALATION: [Brief issue]. Please check Seez."

3. Send Terminal Notification (urgent sound)
   → Sound: "Basso"

4. Display details and request action
   → mcp__Seez__ask_questions (escalation form)

5. On response:
   → Log resolution
   → Update blocker → RESOLVED
   → Continue work
```

**iMessage Template:**
```bash
osascript -e 'tell application "Messages" to send "🚨 ROME ESCALATION: [Issue summary]. Action required. Please check Seez." to buddy "07712367761"'
```

**Seez Template:**
```javascript
mcp__Seez__ask_questions({
  label: "ESCALATION: [Issue]",
  title: "[Brief Title]",
  description: `**Severity:** CRITICAL
**Phase:** [Phase]
**Feature:** [FEAT-###]
**Robot:** [Robot Name]

**Issue:** [Description of the problem]

**Impact:** [What is blocked]

**Attempted:** [What has been tried]`,
  questions: [
    {
      id: "resolution",
      type: "radio",
      label: "How should we proceed?",
      required: true,
      options: [
        { label: "[Option 1]", description: "[Description]" },
        { label: "[Option 2]", description: "[Description]" },
        { label: "[Option 3]", description: "[Description]" }
      ]
    },
    {
      id: "details",
      type: "textarea",
      label: "Additional details (if needed)",
      required: false
    }
  ],
  submitLabel: "Resolve Escalation",
  playSound: true
})
```

---

## Timeout Handling

### Timeout Flow

```
[Request Sent via Seez]
        │
        ▼
   Wait 10 minutes
        │
        ▼
  ┌─────────────┐
  │ Response?   │──Yes──► Process Response
  └─────────────┘
        │ No
        ▼
[Send iMessage Reminder]
        │
        ▼
   Continue waiting
   OR proceed with other work
        │
        ▼
  ┌─────────────┐
  │ Response?   │──Yes──► Process Response
  └─────────────┘
        │ No
        ▼
  Log as BLOCKED
  Continue other work if possible
```

### iMessage Reminder Template

```bash
osascript -e 'tell application "Messages" to send "ROME awaiting response: [Request type] - [Brief summary]. Please check Seez app." to buddy "07712367761"'
```

---

## Logging Requirements

### Sponsor Interaction Logging

ALL sponsor interactions MUST be logged:

**On Request:**
```
→ mcp__activity-log__update_entry(
    id: "[AFFECTED-ENTRY]",
    updates: {
      sponsor_request: {
        type: "[clarification|approval|escalation]",
        timestamp: "[ISO-8601]",
        summary: "[Brief description]"
      }
    }
  )
```

**On Response:**
```
→ mcp__activity-log__update_entry(
    id: "[AFFECTED-ENTRY]",
    updates: {
      sponsor_response: {
        timestamp: "[ISO-8601]",
        decision: "[Response summary]"
      },
      status: "[Updated status based on response]"
    }
  )
```

**On Timeout:**
```
→ Log iMessage sent
→ If still no response: Create/update blocker entry
```

---

## Best Practices

### Do

- Always log interactions IMMEDIATELY
- Provide context in requests (what you're doing, why you need input)
- Offer options where possible (easier for sponsor to decide)
- Include "Defer" option for non-urgent approvals
- Clean up Seez tabs after interaction complete

### Don't

- Send multiple requests simultaneously (overwhelms sponsor)
- Skip logging for "quick" interactions
- Leave stale tabs open in Seez
- Assume sponsor saw notification (use iMessage for timeout)
- Proceed without approval for items requiring sponsor authority

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-21T00:00:00Z | Initial protocol creation |
