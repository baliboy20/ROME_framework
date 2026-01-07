# ROME Framework: Sponsor Interaction Configuration

| Field | Value |
|-------|-------|
| **Document UID** | ROME-CFG-001 |
| **Version** | 1.0 |
| **Date** | 2025-11-21T00:00:00Z |
| **Status** | Draft |
| **Document Type** | Configuration |
| **Author** | Framework Analyst & Architect |
| **Changes Approved** | false |

---

## Purpose

Centralized configuration for sponsor interaction settings. Separates environment-specific values from policy and procedure documents to ease maintenance and replacement.

## Scope

Referenced by:
- ROME-GOV-006 (Sponsor Interaction Policy)
- ROME-PROC-002 (Sponsor Interaction Protocol)

---

## Sponsor Contact

| Setting | Value |
|---------|-------|
| **iMessage Recipient** | `07712367761` |
| **Email** | *[Not configured]* |

---

## Channel Configuration

### Primary Channels

| Channel | Enabled | Tool/Method |
|---------|---------|-------------|
| Seez App | Yes | MCP Server |
| Terminal Notifier | Yes | AppleScript |
| iMessage | Yes | AppleScript |

### Seez MCP Tools

```
mcp__Seez__show_doc
mcp__Seez__ask_questions
mcp__Seez__show_chart
mcp__Seez__close_tab
mcp__Seez__list_tabs
```

### Shell Commands

**Terminal Notifier:**
```bash
terminal-notifier -title "[TITLE]" -message "[MESSAGE]" -sound [SOUND]
```

**iMessage:**
```bash
osascript -e 'tell application "Messages" to send "[MESSAGE]" to buddy "07712367761"'
```

---

## Timing Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| **Response Timeout** | 10 minutes | Time before iMessage reminder sent |
| **Escalation Immediate** | Yes | Escalations send iMessage immediately |

---

## Notification Sounds

| Event Type | Sound Name |
|------------|------------|
| Information | `Glass` |
| Completion | `Ping` |
| Urgent/Escalation | `Basso` |

---

## Notification Triggers

### Trigger Events

| Event | Notify | Channel |
|-------|--------|---------|
| Feature completed | Yes | Terminal Notifier + Seez |
| Phase completed | Yes | Terminal Notifier + Seez |
| Blocker encountered | Yes | Terminal Notifier |
| Sponsor response needed | Yes | Seez (primary) |
| Response timeout | Yes | iMessage |
| Escalation | Yes | iMessage + Terminal Notifier + Seez |

### Suppressed Events

| Event | Reason |
|-------|--------|
| Task started | Too frequent |
| Minor progress | Too frequent |
| Internal robot coordination | Not sponsor concern |

---

## Channel Selection Matrix

| Interaction Type | Primary | Timeout Fallback |
|------------------|---------|------------------|
| Questions/Confirmations | Seez `ask_questions` | iMessage |
| Status Reports | Seez `show_doc` | - |
| Approval Requests | Seez `ask_questions` | iMessage |
| Notifications | Terminal Notifier | - |
| Escalations | iMessage + Seez | - |

---

## Future Configuration Options

*Reserved for future use:*

| Setting | Status | Notes |
|---------|--------|-------|
| Slack integration | Not configured | Alternative to iMessage |
| Email notifications | Not configured | Alternative channel |
| Webhook endpoints | Not configured | For external integrations |
| Multiple sponsors | Not configured | Per-project sponsor lists |

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-11-21T00:00:00Z | Initial configuration |
