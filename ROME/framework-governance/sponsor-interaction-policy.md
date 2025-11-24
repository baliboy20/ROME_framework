# ROME Framework: Sponsor Interaction Policy

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GOV-006 |
| **Version** | 1.0 |
| **Date** | 2025-11-21T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Governance |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Defines policies governing all robot-sponsor communication within the ROME framework. Establishes communication channels, interaction categories, authority boundaries, and response handling.

## Scope

Applies to all robots during all phases. Roma (Orchestrator) is the primary coordinator for sponsor interactions.

## Dependencies

- ROME-PRIN-001 (Core Principles) - Principle 11: Sponsor Interaction
- ROME-PROC-002 (Sponsor Interaction Protocol) - Operational procedures
- ROME-CFG-001 (Sponsor Interaction Config) - Channel and contact configuration

---

## Communication Channels

Channel configuration, contact details, and timing settings are defined in:
- **ROME-CFG-001**: `/ROME/framework-governance/sponsor-interaction-config.md`

### Channel Overview

| Channel | Purpose | Direction |
|---------|---------|-----------|
| **Seez App** | Documents, forms, approvals | Robot ↔ Sponsor |
| **Terminal Notifier** | Alerts, notifications | Robot → Sponsor |
| **iMessage** | Urgent messages, timeout follow-ups | Robot → Sponsor |

### Channel Selection Rules

| Interaction Type | Primary Channel | Timeout Fallback |
|------------------|-----------------|------------------|
| Questions/Confirmations | Seez `ask_questions` | iMessage (per config timeout) |
| Status Reports | Seez `show_doc` + Terminal Notifier | - |
| Approval Requests | Seez `ask_questions` | iMessage (per config timeout) |
| Notifications (info) | Terminal Notifier | - |
| Urgent Escalations | iMessage + Terminal Notifier + Seez | - |

---

## Interaction Categories

### 1. Progress Reporting

**Trigger:** Completion of significant steps
- Feature completion
- Phase completion
- Milestone reached

**Channel:** Seez `show_doc` + Terminal Notifier

**Sponsor Response:** Not required (informational)

### 2. Clarification Requests

**Trigger:** Robot encounters ambiguity or missing information
- Ambiguous requirements
- Missing specifications
- Conflicting information
- Edge cases not addressed

**Channel:** Seez `ask_questions`

**Sponsor Response:** Required

**Timeout:** 10 minutes → iMessage follow-up

### 3. Approval Requests

**Trigger:** Decision requiring sponsor authorization
- Phase gate transitions
- Amendment approvals
- Design decisions with significant impact
- Scope changes

**Channel:** Seez `ask_questions` (with supporting `show_doc` if needed)

**Sponsor Response:** Required

**Timeout:** 10 minutes → iMessage follow-up

### 4. Escalations

**Trigger:** Blocker that robots cannot resolve
- External dependencies (API keys, credentials)
- Business decisions outside robot authority
- Conflicts requiring human judgment

**Channel:** iMessage (immediate) + Terminal Notifier + Seez `ask_questions`

**Sponsor Response:** Required (urgent)

---

## Response Handling

### Timeout Policy

Timeout values configured in ROME-CFG-001.

| Event | Action |
|-------|--------|
| Timeout reached | Send iMessage reminder with summary |
| No response after iMessage | Log as blocker, continue other work if possible |

### Response Logging

All sponsor interactions MUST be logged in activity system:
- Request timestamp
- Request type and summary
- Response timestamp
- Response summary
- Timeout events (if any)

---

## Decision Authority Matrix

### Robot Authority (No Sponsor Approval Needed)

| Decision Type | Authority |
|---------------|-----------|
| Formatting choices | Robot decides |
| Implementation details within spec | Robot decides |
| Minor clarifications (unambiguous) | Robot decides with logging |
| Tool/library selection within constraints | Robot decides |

### Sponsor Authority (Approval Required)

| Decision Type | Authority |
|---------------|-----------|
| Phase gate transitions | Sponsor approval |
| Scope changes | Sponsor approval |
| Amendment approval | Sponsor approval |
| Design alternatives (significant) | Sponsor approval |
| Technology stack changes | Sponsor approval |
| External service selection | Sponsor approval |

---

## Routing Policy

### Primary Route: Via Roma

All sponsor communications route through Roma (Orchestrator) by default:
- Roma aggregates and prioritizes requests
- Roma manages response tracking
- Roma handles timeout escalations

### Exception: Direct Contact

Robots MAY contact sponsor directly when:
- Roma is unavailable
- Urgent escalation requiring immediate attention
- Roma explicitly delegates to domain robot

Direct contact MUST be logged and reported to Roma when available.

---

## Notification Triggers

### Always Notify

| Event | Channel |
|-------|---------|
| Feature completed | Terminal Notifier + Seez report |
| Phase completed | Terminal Notifier + Seez report |
| Blocker encountered | Terminal Notifier |
| Sponsor response needed | Seez (primary) + iMessage (timeout) |
| Escalation | iMessage + Terminal Notifier |

### Do Not Notify

| Event | Reason |
|-------|--------|
| Task started | Too frequent |
| Minor progress | Too frequent |
| Internal robot coordination | Not sponsor concern |

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-21T00:00:00Z | Initial policy creation |
